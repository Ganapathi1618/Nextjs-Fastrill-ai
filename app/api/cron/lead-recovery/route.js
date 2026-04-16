import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function sendWhatsAppMessage(accessToken, phoneNumberId, to, message) {
  const phone = to.replace(/[^0-9]/g, "")
  if (phone.length < 10) return false
  try {
    const res = await fetch(
      "https://graph.facebook.com/v18.0/" + phoneNumberId + "/messages",
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
    return !data.error
  } catch(e) {
    console.error("❌ WA send failed:", e.message)
    return false
  }
}

export async function GET(req) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== "Bearer " + process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Leads older than 24 hours but less than 72 hours, still open
    const now = new Date()
    const from = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString()
    const to   = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

    // Get all users with lead recovery enabled
    const { data: businesses } = await supabaseAdmin
      .from("business_settings")
      .select("user_id, business_name, lead_recovery_enabled, plan, plan_expires_at")
      .eq("lead_recovery_enabled", true)
      .in("plan", ["growth", "pro"])

    if (!businesses?.length) {
      return NextResponse.json({ status: "no businesses with lead recovery enabled" })
    }

    let totalSent = 0
    let totalSkipped = 0

    for (const biz of businesses) {
      // Skip expired plans
      if (biz.plan_expires_at && new Date(biz.plan_expires_at) < new Date()) continue

      // Get WhatsApp connection
      const { data: conn } = await supabaseAdmin
        .from("whatsapp_connections")
        .select("access_token, phone_number_id")
        .eq("user_id", biz.user_id)
        .single()

      if (!conn) continue

      // Get open leads in the 24-72 hour window not yet followed up
      const { data: leads } = await supabaseAdmin
        .from("leads")
        .select("id, name, phone, source, estimated_value, recovery_sent")
        .eq("user_id", biz.user_id)
        .eq("status", "open")
        .eq("recovery_sent", false)
        .gte("created_at", from)
        .lte("created_at", to)

      if (!leads?.length) continue

      for (const lead of leads) {
        if (!lead.phone) { totalSkipped++; continue }

        const name = (lead.name || "there").split(" ")[0]

        const message = [
          "Hi " + name + "! 😊",
          "",
          "We noticed you reached out to us earlier but we haven't heard back.",
          "",
          "We'd love to help you! Whether you want to book an appointment, know our prices, or have any questions — just reply here and we'll get back to you right away.",
          "",
          "Looking forward to seeing you at " + (biz.business_name || "our salon") + "! 🌟"
        ].join("\n")

        const sent = await sendWhatsAppMessage(
          conn.access_token,
          conn.phone_number_id,
          lead.phone,
          message
        )

        if (sent) {
          await supabaseAdmin
            .from("leads")
            .update({ recovery_sent: true, recovery_sent_at: new Date().toISOString() })
            .eq("id", lead.id)
          totalSent++
        } else {
          totalSkipped++
        }
      }
    }

    return NextResponse.json({
      status: "ok",
      sent: totalSent,
      skipped: totalSkipped
    })

  } catch(e) {
    console.error("❌ Lead recovery cron failed:", e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
