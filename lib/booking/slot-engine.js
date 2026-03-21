// lib/booking/slot-engine.js
const { createClient } = require("@supabase/supabase-js")

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function isTimeBased(service) {
  if (!service) return false
  if (service.service_type === "package") return false
  return !!(service.duration && service.duration > 0)
}

function matchService(name, services) {
  if (!name || !services?.length) return null
  const n = name.toLowerCase().trim()
  return services.find(s => s.name.toLowerCase() === n) || services.find(s => s.name.toLowerCase().includes(n) || n.includes(s.name.toLowerCase())) || null
}

async function isSlotAvailable({ userId, date, time, serviceName, services, excludeBookingId }) {
  if (!date || !time) return true
  const svc = matchService(serviceName, services)
  const capacity = svc?.capacity || 1
  let query = supabaseAdmin.from("bookings").select("id").eq("user_id", userId).eq("booking_date", date).eq("booking_time", time).in("status", ["confirmed","pending"])
  if (excludeBookingId) query = query.neq("id", excludeBookingId)
  const { data } = await query
  return (data?.length || 0) < capacity
}

async function findNextSlot({ userId, date, serviceName, services }) {
  if (!date) return null
  const svc = matchService(serviceName, services)
  const duration = svc?.duration || 30
  const slots = []
  let m = 9 * 60
  while (m <= 20 * 60) {
    const h = String(Math.floor(m/60)).padStart(2,"0")
    const min = String(m%60).padStart(2,"0")
    slots.push(h + ":" + min)
    m += duration
  }
  for (const time of slots) {
    const free = await isSlotAvailable({ userId, date, time, serviceName, services })
    if (free) {
      const d = new Date(date + "T" + time + ":00")
      return d.toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short" }) + " at " + time
    }
  }
  return null
}

module.exports = { isTimeBased, matchService, isSlotAvailable, findNextSlot }
