// lib/booking/calendar-engine.js
// Single source of truth for dates and confirmation messages
// No emojis in confirmations — WhatsApp renders 📅 as a sticker on some clients

function getDayName(dateStr) {
  if (!dateStr) return null
  try {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("en-IN", {
      weekday: "long", timeZone: "Asia/Kolkata"
    })
  } catch(e) { return null }
}

function formatDate(dateStr) {
  if (!dateStr) return null
  try {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("en-IN", {
      weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata"
    })
  } catch(e) { return dateStr }
}

function formatDateShort(dateStr) {
  if (!dateStr) return null
  try {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("en-IN", {
      weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata"
    })
  } catch(e) { return dateStr }
}

function getTodayStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
}

function isValidDate(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const d = new Date(dateStr + "T12:00:00")
  return !isNaN(d.getTime())
}

function isPastDate(dateStr) {
  if (!dateStr) return false
  return dateStr < getTodayStr()
}

// Smart time normalization — called before saving to DB and before display
// Business hours: 9am to 9pm
// Rule: single number or HH:MM where hour < 9 → assume PM
// Examples:
//   "2"     → "14:00"  (2pm, because 2am is outside business hours)
//   "2pm"   → "14:00"
//   "2am"   → "02:00"  (explicit am, respect it)
//   "14"    → "14:00"
//   "9"     → "09:00"  (9 is ambiguous — default to 9am which is opening time)
//   "10"    → "10:00"  (10am, within business hours)
//   "02:00" → "14:00"  (2am is outside business hours → must mean 2pm)
function normalizeTime(raw) {
  if (!raw) return null
  const s = String(raw).toLowerCase().trim()

  // Already HH:MM format
  const hhmmMatch = s.match(/^(\d{1,2}):(\d{2})$/)
  if (hhmmMatch) {
    let h = parseInt(hhmmMatch[1])
    const m = hhmmMatch[2]
    // If hour is 0-8, it's outside business hours → must mean PM
    if (h >= 1 && h <= 8) h += 12
    return String(h).padStart(2, "0") + ":" + m
  }

  // Explicit am/pm
  const ampmMatch = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/)
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1])
    const m = ampmMatch[2] || "00"
    const period = ampmMatch[3]
    if (period === "pm" && h !== 12) h += 12
    if (period === "am" && h === 12) h = 0
    return String(h).padStart(2, "0") + ":" + m
  }

  // Plain number like "2" or "14"
  const numMatch = s.match(/^(\d{1,2})$/)
  if (numMatch) {
    let h = parseInt(numMatch[1])
    if (h > 12) return String(h).padStart(2, "0") + ":00"  // 13-23 = 24hr
    if (h >= 1 && h <= 8) h += 12  // 1-8 outside business hours → PM
    if (h === 0) h = 12             // 0 → 12pm
    return String(h).padStart(2, "0") + ":00"
  }

  return raw  // Return as-is if unrecognized
}

// Format time for display: "14:00" → "2:00 PM"
function formatTime(timeStr) {
  if (!timeStr) return null
  const normalized = normalizeTime(timeStr)
  if (!normalized) return timeStr
  const [h, m] = normalized.split(":").map(Number)
  const period = h >= 12 ? "PM" : "AM"
  const display = (h % 12 || 12) + (m > 0 ? ":" + String(m).padStart(2, "0") : "")
  return display + " " + period
}

// Resolve "2nd", "3rd", "15th" to nearest future date YYYY-MM-DD
// If this month's date has passed, use next month
function resolveOrdinalDate(day) {
  if (!day || isNaN(day)) return null
  const today = new Date(getTodayStr() + "T12:00:00")
  const todayDay = today.getDate()
  const year = today.getFullYear()
  const month = today.getMonth() // 0-indexed

  // Try this month first
  const thisMonth = new Date(year, month, day)
  if (thisMonth.getDate() === day && thisMonth >= today) {
    return getTodayStr().substring(0,7) + "-" + String(day).padStart(2, "0")
  }

  // Use next month
  const nextMonth = new Date(year, month + 1, day)
  if (nextMonth.getDate() === day) {
    const y = nextMonth.getFullYear()
    const mo = String(nextMonth.getMonth() + 1).padStart(2, "0")
    const d  = String(nextMonth.getDate()).padStart(2, "0")
    return y + "-" + mo + "-" + d
  }

  return null
}

// Booking confirmation — no emojis, clean WhatsApp-safe format
function buildConfirmMsg(service, dateStr, time, bizName, timeBased) {
  const dayAndDate = formatDate(dateStr)
  const displayTime = timeBased && time ? formatTime(normalizeTime(time)) : null

  let msg = "Booking Confirmed!\n\n"
  msg += "Service: " + service + "\n"
  if (dayAndDate) msg += "Date: " + dayAndDate + "\n"
  if (displayTime) msg += "Time: " + displayTime + "\n"
  msg += "\nSee you soon at *" + (bizName || "us") + "*!"
  return msg
}

function buildConfirmQuestion(service, dateStr, time) {
  const dayAndDate = formatDate(dateStr)
  const displayTime = time ? formatTime(normalizeTime(time)) : null
  let q = "Shall I confirm your booking for *" + service + "*"
  if (dayAndDate) q += " on " + dayAndDate
  if (displayTime) q += " at " + displayTime
  q += "?"
  return q
}

function buildRescheduleMsg(service, dateStr, time) {
  const dayAndDate = formatDate(dateStr)
  const displayTime = time ? formatTime(normalizeTime(time)) : null
  let msg = "Rescheduled!\n\n"
  msg += "Service: " + service + "\n"
  msg += "New Date: " + (dayAndDate || dateStr) + "\n"
  if (displayTime) msg += "New Time: " + displayTime + "\n"
  msg += "\nAll updated! See you soon."
  return msg
}

module.exports = {
  getDayName, formatDate, formatDateShort, getTodayStr,
  isValidDate, isPastDate, normalizeTime, formatTime,
  resolveOrdinalDate, buildConfirmMsg, buildConfirmQuestion, buildRescheduleMsg
}
