// lib/booking/calendar-engine.js
// Single source of truth for dates — JS always calculates day names, never AI

function getDayName(dateStr) {
  if (!dateStr) return null
  try { return new Date(dateStr + "T12:00:00").toLocaleDateString("en-IN", { weekday: "long", timeZone: "Asia/Kolkata" }) } catch(e) { return null }
}

function formatDate(dateStr) {
  if (!dateStr) return null
  try { return new Date(dateStr + "T12:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" }) } catch(e) { return dateStr }
}

function formatDateShort(dateStr) {
  if (!dateStr) return null
  try { return new Date(dateStr + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" }) } catch(e) { return dateStr }
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

function buildConfirmMsg(service, dateStr, time, bizName, timeBased) {
  const dayAndDate = formatDate(dateStr)
  let msg = "✅ *Booking Confirmed!*\n\n📋 Service: " + service
  if (dayAndDate) msg += "\n📅 Date: " + dayAndDate
  if (time && timeBased) msg += "\n⏰ Time: " + time
  msg += "\n\nSee you soon at *" + (bizName || "us") + "*! 😊"
  return msg
}

function buildConfirmQuestion(service, dateStr, time) {
  const dayAndDate = formatDate(dateStr)
  let q = "Shall I confirm your booking for *" + service + "*"
  if (dayAndDate) q += " on " + dayAndDate
  if (time)       q += " at " + time
  q += "? ✅"
  return q
}

function buildRescheduleMsg(service, dateStr, time) {
  const dayAndDate = formatDate(dateStr)
  let msg = "✅ *Rescheduled!*\n\n📋 Service: " + service + "\n📅 New Date: " + (dayAndDate || dateStr)
  if (time) msg += "\n⏰ New Time: " + time
  msg += "\n\nAll updated! See you soon 😊"
  return msg
}

module.exports = { getDayName, formatDate, formatDateShort, getTodayStr, isValidDate, isPastDate, buildConfirmMsg, buildConfirmQuestion, buildRescheduleMsg }
