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
        headers: { "Authorization": "Bearer " + accessToken, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp", to: phone, type: "text",
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
    // Get IST time
    const nowIST    = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
    const todayIST  = nowIST.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
    const tomorrowIST = new Date(nowIST)
    tomorrowIST.setDate(tomorrowIST.getDate() + 1)
    const tomorrowStr = tomorrowIST.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })

    // Get businesses with reminders enabled
    const { data: businesses } = await supabaseAdmin
      .from("business_settings")
      .select("user_id, business_name, reminders_enabled, plan, plan_expires_at")
      .eq("reminders_enabled", true)
      .in("plan", ["growth", "pro"])

    if (!businesses?.length) {
      return NextResponse.json({ status: "no businesses with reminders enabled" })
    }

    let totalSent = 0
    let totalSkipped = 0

    for (const biz of businesses) {
      if (biz.plan_expires_at && new Date(biz.plan_expires_at) < new Date()) continue

      const { data: conn } = await supabaseAdmin
        .from("whatsapp_connections")
        .select("access_token, phone_number_id")
        .eq("user_id", biz.user_id).single()
      if (!conn) continue

      // Get tomorrow's confirmed bookings not yet reminded
      const { data: bookings } = await supabaseAdmin
        .from("bookings")
        .select("id, customer_name, customer_phone, service, booking_time, reminder_sent")
        .eq("user_id", biz.user_id)
        .eq("booking_date", tomorrowStr)
        .eq("status", "confirmed")
        .eq("reminder_sent", false)

      if (!bookings?.length) continue

      for (const booking of bookings) {
        if (!booking.customer_phone) { totalSkipped++; continue }

        const name = (booking.customer_name || "there").split(" ")[0]
        const time = booking.booking_time
          ? new Date("2000-01-01T" + booking.booking_time).toLocaleTimeString("en-IN", {
              hour: "2-digit", minute: "2-digit", hour12: true
            })
          : null

        // Clean message — no sticker emojis
        const message = [
          "Hi " + name + "! 👋",
          "",
          "Just a reminder — you have an appointment tomorrow:",
          "",
          "Service: " + booking.service,
          time ? "Time: " + time : "",
          "At: " + (biz.business_name || "our salon"),
          "",
          "See you tomorrow! If you need to reschedule or cancel, just reply here. 😊"
        ].filter(Boolean).join("\n")

        const sent = await sendWhatsAppMessage(
          conn.access_token, conn.phone_number_id,
          booking.customer_phone, message
        )

        if (sent) {
          await supabaseAdmin.from("bookings")
            .update({ reminder_sent: true, reminder_sent_at: new Date().toISOString() })
            .eq("id", booking.id)
          totalSent++
        } else {
          totalSkipped++
        }
      }
    }

    return NextResponse.json({ status: "ok", sent: totalSent, skipped: totalSkipped, date: tomorrowStr })

  } catch(e) {
    console.error("❌ Reminders cron failed:", e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
