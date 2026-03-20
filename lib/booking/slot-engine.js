// lib/booking/slot-engine.js
// Slot availability — pure DB logic, no AI

import { createClient } from "@supabase/supabase-js"
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function isSlotAvailable({ userId, date, time, serviceName, services, excludeBookingId }) {
  if (!date || !time) return true
  const svc      = matchService(serviceName, services)
  const capacity = svc?.capacity || 1
  let query = supabaseAdmin.from("bookings").select("id")
    .eq("user_id", userId).eq("booking_date", date).eq("booking_time", time)
    .in("status", ["confirmed","pending"])
  if (excludeBookingId) query = query.neq("id", excludeBookingId)
  const { data: existing } = await query
  return (existing?.length || 0) < capacity
}

export async function findNextSlot({ userId, date, serviceName, services }) {
  if (!date) return null
  const svc      = matchService(serviceName, services)
  const duration = svc?.duration || 30
  const slots    = []
  let m = 9 * 60
  while (m <= 20 * 60) {
    slots.push(`${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`)
    m += duration
  }
  for (const time of slots) {
    const free = await isSlotAvailable({ userId, date, time, serviceName, services })
    if (free) {
      const dt = new Date(date + "T" + time + ":00")
      return dt.toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short" }) + " at " + time
    }
  }
  return null
}

export function matchService(name, list) {
  if (!name || !list?.length) return null
  const s = name.toLowerCase().trim()
  return list.find(svc => svc.name.toLowerCase() === s)
    || list.find(svc => svc.name.toLowerCase().includes(s) || s.includes(svc.name.toLowerCase()))
    || null
}

export function isTimeBased(service) {
  if (!service) return false
  if (service.service_type === "package") return false
  return !!(service.duration && service.duration > 0)
}
