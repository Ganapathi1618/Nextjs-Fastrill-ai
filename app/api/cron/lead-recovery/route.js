// app/api/cron/lead-recovery/route.js
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function sendWhatsApp(accessToken, phoneNumberId, to, message) {
  const phone = to.replace(/[^0-9]/g, "")
  if (phone.length < 10) return false
  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + accessToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: { body: message, preview_url: false }
        })
      }
    )
    const data = await res.json()
    if (data.error) {
      console.error("❌ WA send error:", data.error.message)
      return false
    }
    return true
  } catch(e) {
    console.error("❌ WA send exception:", e.message)
    return false
  }
}

function buildRecoveryMessage(name, bizName, services) {
  const svcText = services?.length
    ? services.slice(0, 3).join(", ")
    : "our services"

  return [
    "Hi " + name + "! 👋",
    "",
    "You recently enquired at *" + bizName + "* but didn't complete your booking.",
    "",
    "We'd love to have you! We offer: " + svcText,
    "",
    "Want to book a slot? Just reply here and our AI will help you in seconds. 😊"
  ].join("\n")
}

export async function GET(req) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== "Bearer " + process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))

    // Find leads that messaged 24-72 hours ago, never booked, never recovered
    const cutoffStart = new Date(nowIST.getTime() - 72 * 60 * 60 * 1000).toISOString()
    const cutoffEnd   = new Date(nowIST.getTime() - 24 * 60 * 60 * 1000).toISOString()

    // Get businesses on growth/pro plan
    const { data: businesses } = await supabaseAdmin
      .from("business_settings")
      .select("user_id, business_name, plan, plan_expires_at")
      .in("plan", ["growth", "pro"])

    if (!businesses?.length) {
      return NextResponse.json({ status: "no eligible businesses" })
    }

    let totalSent = 0, totalSkipped = 0

    for (const biz of businesses) {
      // Skip expired plans
      if (biz.plan_expires_at && new Date(biz.plan_expires_at) < new Date()) continue

      const { data: conn } = await supabaseAdmin
        .from("whatsapp_connections")
        .select("access_token, phone_number_id")
        .eq("user_id", biz.user_id)
        .single()
      if (!conn) continue

      // Get services for this business
      const { data: svcData } = await supabaseAdmin
        .from("services")
        .select("name")
        .eq("user_id", biz.user_id)
        .eq("is_active", true)
        .limit(5)
      const services = (svcData || []).map(s => s.name)

      // Find open leads in time window that haven't been recovered
      const { data: leads } = await supabaseAdmin
        .from("leads")
        .select("id, name, phone, status, recovery_sent")
        .eq("user_id", biz.user_id)
        .eq("status", "open")
        .eq("recovery_sent", false)
        .gte("last_message_at", cutoffStart)
        .lte("last_message_at", cutoffEnd)

      if (!leads?.length) continue

      // Check which leads already have a booking — skip them
      const phones = leads.map(l => l.phone).filter(Boolean)
      const { data: booked } = await supabaseAdmin
        .from("bookings")
        .select("customer_phone")
        .eq("user_id", biz.user_id)
        .in("customer_phone", phones)
        .in("status", ["confirmed", "pending", "completed"])

      const bookedPhones = new Set((booked || []).map(b => b.customer_phone))

      for (const lead of leads) {
        if (!lead.phone) { totalSkipped++; continue }
        if (bookedPhones.has(lead.phone)) {
          // Lead converted — mark recovery_sent so we don't process again
          await supabaseAdmin.from("leads")
            .update({ recovery_sent: true, status: "converted" })
            .eq("id", lead.id)
          totalSkipped++
          continue
        }

        const name    = (lead.name || "there").split(" ")[0]
        const message = buildRecoveryMessage(name, biz.business_name, services)

        const sent = await sendWhatsApp(conn.access_token, conn.phone_number_id, lead.phone, message)

        if (sent) {
          await supabaseAdmin.from("leads")
            .update({
              recovery_sent:    true,
              recovery_sent_at: new Date().toISOString(),
              status:           "contacted"
            })
            .eq("id", lead.id)
          totalSent++
          console.log("✅ Lead recovery sent:", lead.phone)
        } else {
          totalSkipped++
          console.warn("⚠️ Lead recovery failed:", lead.phone)
        }

        // 1 second delay between sends — rate limit safety
        await new Promise(r => setTimeout(r, 1000))
      }
    }

    return NextResponse.json({
      status: "ok",
      sent:    totalSent,
      skipped: totalSkipped,
      checkedAt: nowIST.toISOString()
    })

  } catch(e) {
    console.error("❌ Lead recovery cron failed:", e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
