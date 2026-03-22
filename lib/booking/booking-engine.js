// lib/booking/booking-engine.js
const { createClient }   = require("@supabase/supabase-js")
const { matchService, isTimeBased, isSlotAvailable, findNextSlot } = require("./slot-engine")
const { buildConfirmMsg, buildRescheduleMsg, isValidDate, isPastDate } = require("./calendar-engine")

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createBooking({ userId, customerName, customerPhone, customerId, state, services, bizName }) {
  const { service, date, time } = state
  const matched = matchService(service, services)

  // Validate date
  if (date && !isValidDate(date)) return { ok: false, error: "invalid_date", message: "That doesn't seem like a valid date 😅 Could you give me the date again?" }
  if (date && isPastDate(date))   return { ok: false, error: "past_date",    message: "That date has already passed 😅 Could you pick a future date?" }

  // Pre-insert slot check
  if (isTimeBased(matched) && date && time) {
    const free = await isSlotAvailable({ userId, date, time, serviceName: service, services })
    if (!free) {
      const next = await findNextSlot({ userId, date, serviceName: service, services })
      return { ok: false, slotFull: true, message: next ? "That slot is taken 😅 Next available: *" + next + "*\n\nShall I book that instead? ✅" : "That slot is fully booked 😅 Could you suggest another time?" }
    }
  }

  // Resolve customerId if not provided
  if (!customerId && customerPhone) {
    try {
      const { data: cust } = await supabaseAdmin.from("customers")
        .select("id").eq("phone", customerPhone).eq("user_id", userId).maybeSingle()
      if (cust) customerId = cust.id
    } catch(e) {}
  }

  // Insert booking
  const { data, error } = await supabaseAdmin.from("bookings").insert({
    user_id:        userId,
    customer_name:  customerName,
    customer_phone: customerPhone,
    customer_id:    customerId || null,
    service:        matched?.name || service || "Appointment",
    booking_date:   date || null,
    booking_time:   time || null,
    amount:         matched?.price || 0,
    status:         "confirmed",
    ai_booked:      true,
    created_at:     new Date().toISOString()
  }).select().single()

  if (error) {
    console.error("❌ Booking insert failed:", error.message)
    return { ok: false, error: error.message }
  }

  // Post-insert race condition guard
  if (isTimeBased(matched) && date && time) {
    const { data: overlapping } = await supabaseAdmin.from("bookings")
      .select("id").eq("user_id", userId).eq("booking_date", date).eq("booking_time", time)
      .in("status", ["confirmed","pending"])
    const capacity = matched?.capacity || 1
    if ((overlapping?.length || 0) > capacity) {
      await supabaseAdmin.from("bookings").delete().eq("id", data.id)
      const next = await findNextSlot({ userId, date, serviceName: service, services })
      return { ok: false, slotFull: true, message: next ? "That slot just got booked 😅 Next available: *" + next + "*\n\nShall I book that? ✅" : "That slot just filled up 😅 Could you suggest another time?" }
    }
  }

  // Update customer tag
  try {
    const { count } = await supabaseAdmin.from("bookings")
      .select("id", { count: "exact" })
      .eq("customer_phone", customerPhone).eq("user_id", userId)
      .in("status", ["confirmed","completed"])
    const tag = count >= 5 ? "vip" : count >= 2 ? "returning" : "new_lead"
    await supabaseAdmin.from("customers")
      .update({ tag, last_visit_at: new Date().toISOString() })
      .eq("phone", customerPhone).eq("user_id", userId)
  } catch(e) { console.warn("⚠️ Customer tag update failed:", e.message) }

  // Convert lead — only for this specific customer
  if (customerId) {
    try {
      await supabaseAdmin.from("leads")
        .update({ status: "converted", last_message_at: new Date().toISOString() })
        .eq("customer_id", customerId).eq("user_id", userId).eq("status", "open")
        .limit(1)
    } catch(e) { console.warn("⚠️ Lead conversion failed:", e.message) }
  }

  const confirmMsg = buildConfirmMsg(matched?.name || service, date, time, bizName || "us", isTimeBased(matched))
  return { ok: true, booking: data, confirmMsg }
}

async function rescheduleBooking({ userId, customerPhone, date, time, services }) {
  if (date && !isValidDate(date)) return { ok: false, message: "That doesn't seem like a valid date 😅 Could you give me the date again?" }
  if (date && isPastDate(date))   return { ok: false, message: "That date has already passed 😅 Could you pick a future date?" }

  const { data: existing } = await supabaseAdmin.from("bookings").select("*")
    .eq("customer_phone", customerPhone).eq("user_id", userId)
    .in("status", ["confirmed","pending"])
    .order("booking_date", { ascending: true }).limit(1).maybeSingle()

  if (!existing) return { ok: false, notFound: true, message: "I couldn't find an upcoming booking for you. Would you like to make a new booking? 😊" }

  const free = await isSlotAvailable({ userId, date, time, serviceName: existing.service, services, excludeBookingId: existing.id })
  if (!free) {
    const next = await findNextSlot({ userId, date, serviceName: existing.service, services })
    return { ok: false, slotFull: true, message: next ? "That slot is taken 😅 Next available: *" + next + "*\n\nShall I reschedule to that? ✅" : "That slot is fully booked 😅 Please suggest another time?" }
  }

  const { error } = await supabaseAdmin.from("bookings")
    .update({ booking_date: date, booking_time: time, status: "confirmed" }).eq("id", existing.id)

  if (error) {
    console.error("❌ Reschedule update failed:", error.message)
    return { ok: false, message: "Sorry, had trouble rescheduling 😅 Please try again." }
  }

  return { ok: true, message: buildRescheduleMsg(existing.service, date, time) }
}

module.exports = { createBooking, rescheduleBooking }
