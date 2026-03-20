// lib/booking/booking-engine.js
// All booking DB operations — create, reschedule, cancel, lookup

import { createClient } from "@supabase/supabase-js"
import { matchService, isTimeBased, isSlotAvailable, findNextSlot } from "./slot-engine.js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function createBooking({ userId, customer, entities, services }) {
  const svc = matchService(entities.service?.value, services)

  // Slot check for time-based services
  if (isTimeBased(svc) && entities.date?.value && entities.time?.value) {
    const slotFree = await isSlotAvailable({
      userId, date: entities.date.value, time: entities.time.value,
      serviceName: svc?.name || entities.service.value, services
    })
    if (!slotFree) {
      const alt = await findNextSlot({ userId, date: entities.date.value, serviceName: svc?.name || entities.service.value, services })
      return { success: false, slotTaken: true, nextSlot: alt }
    }
  }

  const { data: booking, error } = await supabaseAdmin.from("bookings").insert({
    user_id:        userId,
    customer_name:  customer.name,
    customer_phone: customer.phone,
    customer_id:    customer.id || null,
    service:        svc?.name || entities.service.value || "Appointment",
    booking_date:   entities.date?.value  || null,
    booking_time:   entities.time?.value  || null,
    amount:         svc?.price            || 0,
    status:         "confirmed",
    ai_booked:      true,
    created_at:     new Date().toISOString()
  }).select().single()

  if (error) {
    console.error("[booking-engine] Create error:", error.message)
    return { success: false, error: error.message }
  }

  // Update customer tag
  try {
    const { count: bc } = await supabaseAdmin.from("bookings")
      .select("id", { count: "exact" })
      .eq("customer_phone", customer.phone).eq("user_id", userId)
      .in("status", ["confirmed","completed"])
    const tag = bc >= 5 ? "vip" : bc >= 2 ? "returning" : "new_lead"
    await supabaseAdmin.from("customers")
      .update({ tag, last_visit_at: new Date().toISOString() })
      .eq("phone", customer.phone).eq("user_id", userId)
  } catch(e) {}

  // Convert lead
  try {
    await supabaseAdmin.from("leads")
      .update({ status: "converted", last_message_at: new Date().toISOString() })
      .eq("customer_id", customer.id).eq("user_id", userId).eq("status", "open")
  } catch(e) {}

  return { success: true, booking }
}

export async function rescheduleBooking({ userId, customerPhone, entities, services }) {
  // Find booking — prefer matching by service name if known
  let bookingToUpdate = null
  if (entities.service?.value) {
    const { data: sb } = await supabaseAdmin.from("bookings").select("*")
      .eq("customer_phone", customerPhone).eq("user_id", userId)
      .ilike("service", "%" + entities.service.value + "%")
      .in("status", ["confirmed","pending"])
      .order("booking_date", { ascending: true }).limit(1).maybeSingle()
    bookingToUpdate = sb
  }
  if (!bookingToUpdate) {
    const { data: lb } = await supabaseAdmin.from("bookings").select("*")
      .eq("customer_phone", customerPhone).eq("user_id", userId)
      .in("status", ["confirmed","pending"])
      .order("booking_date", { ascending: true }).limit(1).maybeSingle()
    bookingToUpdate = lb
  }
  if (!bookingToUpdate) return { success: false, error: "No booking found" }

  await supabaseAdmin.from("bookings").update({
    booking_date: entities.date?.value || bookingToUpdate.booking_date,
    booking_time: entities.time?.value || bookingToUpdate.booking_time,
    status:       "confirmed"
  }).eq("id", bookingToUpdate.id)

  return { success: true, booking: bookingToUpdate }
}

export async function cancelBooking({ userId, customerPhone }) {
  const { data: booking } = await supabaseAdmin.from("bookings").select("*")
    .eq("customer_phone", customerPhone).eq("user_id", userId)
    .in("status", ["confirmed","pending"])
    .order("booking_date", { ascending: true }).limit(1).maybeSingle()

  if (!booking) return { success: false, error: "No booking found" }

  await supabaseAdmin.from("bookings")
    .update({ status: "cancelled" })
    .eq("id", booking.id)

  return { success: true, booking }
}

export async function lookupBooking({ userId, customerPhone }) {
  const { data: booking } = await supabaseAdmin.from("bookings").select("*")
    .eq("customer_phone", customerPhone).eq("user_id", userId)
    .in("status", ["confirmed","pending"])
    .order("created_at", { ascending: false }).limit(1).maybeSingle()

  return booking || null
}
