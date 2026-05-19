// app/api/cron/appointment-reminders/route.js
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function formatTime(timeStr) {
  if (!timeStr) return ""
  const [h, m] = timeStr.split(":").map(Number)
  const period = h >= 12 ? "PM" : "AM"
  const display = (h % 12 || 12) + (m > 0 ? ":" + String(m).padStart(2, "0") : "")
  return display + " " + period
}

function formatDate(dateStr) {
  if (!dateStr) return ""
  try {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("en-IN", {
      weekday: "long", day: "numeric", month: "long",
      timeZone: "Asia/Kolkata"
    })
  } catch(e) { return dateStr }
}

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

function buildReminderMessage(name, service, dateStr, timeStr, bizName, type) {
  const displayDate = formatDate(dateStr)
  const displayTime = formatTime(timeStr)

  if (type === "2hrs") {
    return [
      "Hi " + name + "! 👋",
      "",
      "Your appointment is in 2 hours:",
      "",
      "Service: " + service,
      displayTime ? "Time: " + displayTime : "",
      "At: " + (bizName || "our salon"),
      "",
      "See you soon! If you need to reschedule, just reply here. 😊"
    ].filter(Boolean).join("\n")
  }

  // 24hr reminder
  return [
    "Hi " + name + "! 👋",
    "",
    "Reminder — you have an appointment tomorrow:",
    "",
    "Service: " + service,
    displayDate ? "Date: " + displayDate : "",
    displayTime ? "Time: " + displayTime : "",
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
    // IST time
    const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
    const currentHourIST = nowIST.getHours()

    const todayStr    = nowIST.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
    const tomorrowIST = new Date(nowIST)
    tomorrowIST.setDate(tomorrowIST.getDate() + 1)
    const tomorrowStr = tomorrowIST.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })

    // 2hr window: bookings in next 1.5 to 2.5 hours
    const windowStart = new Date(nowIST.getTime() + 90  * 60 * 1000)
    const windowEnd   = new Date(nowIST.getTime() + 150 * 60 * 1000)
    const windowStartTime = windowStart.toLocaleTimeString("en-CA", { hour12: false, timeZone: "Asia/Kolkata" }).substring(0, 5)
    const windowEndTime   = windowEnd.toLocaleTimeString("en-CA",   { hour12: false, timeZone: "Asia/Kolkata" }).substring(0, 5)

    // Get businesses with reminders enabled on growth/pro plan
    const { data: businesses } = await supabaseAdmin
      .from("business_settings")
      .select("user_id, business_name, reminders_enabled, plan, plan_expires_at")
      .eq("reminders_enabled", true)
      .in("plan", ["growth", "pro"])

    if (!businesses?.length) {
      return NextResponse.json({ status: "no businesses with reminders enabled" })
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

      // ── 24HR REMINDERS — only between 7am-9am IST ──────────────
      if (currentHourIST >= 7 && currentHourIST <= 9) {
        const { data: bookings24 } = await supabaseAdmin
          .from("bookings")
          .select("id, customer_name, customer_phone, service, booking_date, booking_time, reminder_preference")
          .eq("user_id", biz.user_id)
          .eq("booking_date", tomorrowStr)
          .eq("status", "confirmed")
          .eq("reminder_sent", false)

        for (const booking of (bookings24 || [])) {
          const pref = booking.reminder_preference || "24hrs"
          if (pref !== "24hrs") continue
          if (!booking.customer_phone) { totalSkipped++; continue }

          const name    = (booking.customer_name || "there").split(" ")[0]
          const message = buildReminderMessage(
            name, booking.service,
            booking.booking_date, booking.booking_time,
            biz.business_name, "24hrs"
          )

          const sent = await sendWhatsApp(conn.access_token, conn.phone_number_id, booking.customer_phone, message)
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

      // ── 2HR REMINDERS — every cron run ─────────────────────────
      const { data: bookings2hr } = await supabaseAdmin
        .from("bookings")
        .select("id, customer_name, customer_phone, service, booking_date, booking_time, reminder_preference")
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
        const message = buildReminderMessage(
          name, booking.service,
          booking.booking_date, booking.booking_time,
          biz.business_name, "2hrs"
        )

        const sent = await sendWhatsApp(conn.access_token, conn.phone_number_id, booking.customer_phone, message)
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
      hourIST: currentHourIST,
      windows: {
        "24hr_active": currentHourIST >= 7 && currentHourIST <= 9,
        "2hr_window": windowStartTime + " to " + windowEndTime
      }
    })

  } catch(e) {
    console.error("❌ Reminders cron failed:", e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
