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

function buildReminderMessage(name, service, time, bizName, type) {
  const timeStr = time
    ? new Date("2000-01-01T" + time).toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", hour12: true
      })
    : null

  if (type === "2hrs") {
    return [
      "Hi " + name + "! 👋",
      "",
      "Your appointment is in 2 hours:",
      "",
      "Service: " + service,
      timeStr ? "Time: " + timeStr : "",
      "At: " + (bizName || "our salon"),
      "",
      "See you soon! If you need to reschedule, just reply here. 😊"
    ].filter(Boolean).join("\n")
  }

  // Default 24hr reminder
  return [
    "Hi " + name + "! 👋",
    "",
    "Just a reminder — you have an appointment tomorrow:",
    "",
    "Service: " + service,
    timeStr ? "Time: " + timeStr : "",
    "At: " + (bizName || "our salon"),
    "",
    "See you tomorrow! If you need to reschedule or cancel, just reply here. 😊"
  ].filter(Boolean).join("\n")
}

export async function GET(req) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== "Bearer " + process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get current IST time
    const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
    const todayStr = nowIST.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })

    // Tomorrow's date in IST
    const tomorrowIST = new Date(nowIST)
    tomorrowIST.setDate(tomorrowIST.getDate() + 1)
    const tomorrowStr = tomorrowIST.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })

    // Current time window for 2hr reminders
    // Look for bookings happening in next 1.5 to 2.5 hours
    const windowStart = new Date(nowIST.getTime() + 90  * 60 * 1000)  // +1.5hr
    const windowEnd   = new Date(nowIST.getTime() + 150 * 60 * 1000)  // +2.5hr
    const windowStartTime = windowStart.toTimeString().substring(0, 5)  // "HH:MM"
    const windowEndTime   = windowEnd.toTimeString().substring(0, 5)    // "HH:MM"

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
      // Skip expired plans
      if (biz.plan_expires_at && new Date(biz.plan_expires_at) < new Date()) continue

      const { data: conn } = await supabaseAdmin
        .from("whatsapp_connections")
        .select("access_token, phone_number_id")
        .eq("user_id", biz.user_id).single()
      if (!conn) continue

      // ── 24HR REMINDERS ─────────────────────────────────────
      // Send to customers who want 24hr reminders (default)
      // Only run this between 7am-9am IST to avoid spamming
      const currentHourIST = nowIST.getHours()
      if (currentHourIST >= 7 && currentHourIST <= 9) {
        const { data: bookings24 } = await supabaseAdmin
          .from("bookings")
          .select("id, customer_name, customer_phone, service, booking_time, reminder_sent, reminder_preference")
          .eq("user_id", biz.user_id)
          .eq("booking_date", tomorrowStr)
          .eq("status", "confirmed")
          .eq("reminder_sent", false)

        for (const booking of (bookings24 || [])) {
          // Only send 24hr reminder if preference is 24hrs or not set
          const pref = booking.reminder_preference || "24hrs"
          if (pref !== "24hrs") continue
          if (!booking.customer_phone) { totalSkipped++; continue }

          const name    = (booking.customer_name || "there").split(" ")[0]
          const message = buildReminderMessage(name, booking.service, booking.booking_time, biz.business_name, "24hrs")

          const sent = await sendWhatsAppMessage(conn.access_token, conn.phone_number_id, booking.customer_phone, message)
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

      // ── 2HR REMINDERS ──────────────────────────────────────
      // Look for bookings happening today in the next 1.5-2.5 hours
      // that have reminder_preference = '2hrs' and reminder_sent = false
      const { data: bookings2hr } = await supabaseAdmin
        .from("bookings")
        .select("id, customer_name, customer_phone, service, booking_time, reminder_sent, reminder_preference")
        .eq("user_id", biz.user_id)
        .eq("booking_date", todayStr)
        .eq("status", "confirmed")
        .eq("reminder_sent", false)
        .eq("reminder_preference", "2hrs")
        .gte("booking_time", windowStartTime)
        .lte("booking_time", windowEndTime)

      for (const booking of (bookings2hr || [])) {
        if (!booking.customer_phone) { totalSkipped++; continue }

        const name    = (booking.customer_name || "there").split(" ")[0]
        const message = buildReminderMessage(name, booking.service, booking.booking_time, biz.business_name, "2hrs")

        const sent = await sendWhatsAppMessage(conn.access_token, conn.phone_number_id, booking.customer_phone, message)
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

    return NextResponse.json({
      status: "ok",
      sent: totalSent,
      skipped: totalSkipped,
      checkedAt: nowIST.toISOString(),
      windows: { "24hr_active": currentHourIST >= 7 && currentHourIST <= 9, "2hr_window": windowStartTime + " to " + windowEndTime }
    })

  } catch(e) {
    console.error("❌ Reminders cron failed:", e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
