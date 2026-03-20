diff --git a/lib/booking/calendar-engine.js b/lib/booking/calendar-engine.js
new file mode 100644
index 0000000000000000000000000000000000000000..cdab3ac2431b0734e3a6d7876c8cfb25fdcb0a9a
--- /dev/null
+++ b/lib/booking/calendar-engine.js
@@ -0,0 +1,274 @@
+const DEFAULT_TIMEZONE = "Asia/Kolkata"
+
+function pad(n) {
+  return String(n).padStart(2, "0")
+}
+
+function zonedNow(timeZone = DEFAULT_TIMEZONE) {
+  return new Date(new Date().toLocaleString("en-US", { timeZone }))
+}
+
+function toISODate(d) {
+  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
+}
+
+function formatFullDate(d, timeZone = DEFAULT_TIMEZONE) {
+  return d.toLocaleDateString("en-IN", {
+    weekday: "long",
+    day: "numeric",
+    month: "long",
+    year: "numeric",
+    timeZone,
+  })
+}
+
+function formatShortDate(d, timeZone = DEFAULT_TIMEZONE) {
+  return d.toLocaleDateString("en-IN", {
+    weekday: "short",
+    day: "numeric",
+    month: "short",
+    timeZone,
+  })
+}
+
+export function buildCalendarContext({ daysAhead = 14, timeZone = DEFAULT_TIMEZONE } = {}) {
+  const now = zonedNow(timeZone)
+  const days = []
+  const named = {}
+  const byDate = {}
+
+  for (let i = 0; i <= daysAhead; i += 1) {
+    const d = new Date(now)
+    d.setDate(now.getDate() + i)
+
+    const iso = toISODate(d)
+    const full = formatFullDate(d, timeZone)
+    const short = formatShortDate(d, timeZone)
+    const dayName = d.toLocaleDateString("en-IN", { weekday: "long", timeZone }).toLowerCase()
+    const monthName = d.toLocaleDateString("en-IN", { month: "long", timeZone })
+    const dateNum = d.getDate()
+
+    const item = { i, iso, full, short, dayName, dateNum, monthName }
+    days.push(item)
+
+    if (!named[dayName]) named[dayName] = { iso, full, short }
+    const shortName = dayName.slice(0, 3)
+    if (!named[shortName]) named[shortName] = { iso, full, short }
+    if (!byDate[dateNum]) byDate[dateNum] = { iso, full, short, monthName }
+  }
+
+  const calStr = days.slice(0, daysAhead).map((d) => {
+    const label = d.i === 0 ? " ← TODAY" : d.i === 1 ? " ← TOMORROW" : ""
+    return `${d.dayName.charAt(0).toUpperCase() + d.dayName.slice(1)}, ${d.dateNum} ${d.monthName} ${d.iso.split("-")[0]}${label}`
+  }).join("\n")
+
+  return {
+    now,
+    timeZone,
+    days,
+    named,
+    byDate,
+    today: days[0] || null,
+    tomorrow: days[1] || null,
+    dayAfter: days[2] || null,
+    saturday: days.find((d) => d.dayName === "saturday") || null,
+    sunday: days.find((d) => d.dayName === "sunday") || null,
+    calStr,
+  }
+}
+
+export function resolveCustomerDate(text, cal = buildCalendarContext()) {
+  const t = String(text || "").toLowerCase().trim()
+  if (!t) return null
+
+  if (/\btoday\b|\baaj\b/.test(t)) return { ...cal.today, ambiguous: false }
+  if (/\btomorrow\b|\bkal\b|\bkl\b/.test(t)) return { ...cal.tomorrow, ambiguous: false }
+  if (/\bday after\b|\bparso\b/.test(t)) return { ...cal.dayAfter, ambiguous: false }
+  if (/\bthis weekend\b/.test(t) && cal.saturday) {
+    return { ambiguous: true, options: [cal.saturday, cal.sunday].filter(Boolean) }
+  }
+
+  for (const [name, info] of Object.entries(cal.named || {})) {
+    if (new RegExp(`\\b${name}\\b`).test(t)) return { ...info, ambiguous: false }
+  }
+
+  const numMatch = t.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/)
+  if (numMatch) {
+    const n = parseInt(numMatch[1], 10)
+    if (n >= 1 && n <= 31) {
+      const months = {
+        jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
+        jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
+        january: 1, february: 2, march: 3, april: 4, june: 6,
+        july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
+      }
+
+      let targetMonth = null
+      for (const [mn, mv] of Object.entries(months)) {
+        if (t.includes(mn)) {
+          targetMonth = mv
+          break
+        }
+      }
+
+      if (targetMonth) {
+        const d = new Date(cal.now.getFullYear(), targetMonth - 1, n)
+        if (d.getMonth() !== targetMonth - 1) return null
+        return {
+          iso: toISODate(d),
+          full: formatFullDate(d, cal.timeZone),
+          short: formatShortDate(d, cal.timeZone),
+          ambiguous: false,
+        }
+      }
+
+      if (cal.byDate?.[n]) return { ...cal.byDate[n], ambiguous: true, justNumber: true, num: n }
+    }
+  }
+
+  const slashMatch = t.match(/(\d{1,2})[\/\-](\d{1,2})/)
+  if (slashMatch) {
+    const day = parseInt(slashMatch[1], 10)
+    const month = parseInt(slashMatch[2], 10)
+    const d = new Date(cal.now.getFullYear(), month - 1, day)
+    if (d.getMonth() === month - 1) {
+      return {
+        iso: toISODate(d),
+        full: formatFullDate(d, cal.timeZone),
+        short: formatShortDate(d, cal.timeZone),
+        ambiguous: true,
+      }
+    }
+  }
+
+  return null
+}
+
+export function parseWorkingHours(workingHours) {
+  let openHour = 9
+  let closeHour = 21
+  const raw = String(workingHours || "").trim()
+  if (!raw) return { openHour, closeHour, raw }
+
+  const wh = raw.toLowerCase()
+  if (wh.includes("24/7") || wh.includes("24 hour") || wh.includes("always open")) {
+    return { openHour: 0, closeHour: 23, raw }
+  }
+
+  const ampmMatches = raw.match(/(\d{1,2})(?:[:.]\d{2})?\s*(am|pm)/gi) || []
+  if (ampmMatches.length >= 2) {
+    const parsed = ampmMatches.map((h) => {
+      const m = h.match(/(\d{1,2})(?:[:.]\d{2})?\s*(am|pm)/i)
+      if (!m) return null
+      let hr = parseInt(m[1], 10)
+      if (m[2].toLowerCase() === "pm" && hr < 12) hr += 12
+      if (m[2].toLowerCase() === "am" && hr === 12) hr = 0
+      return hr
+    }).filter((n) => n !== null)
+
+    if (parsed.length >= 2) {
+      return { openHour: Math.min(...parsed), closeHour: Math.max(...parsed), raw }
+    }
+  }
+
+  const numMatches = raw.match(/\b(\d{1,2})(?::\d{2})?\b/g) || []
+  if (numMatches.length >= 2) {
+    const nums = numMatches.map((n) => parseInt(n, 10)).filter((n) => n >= 0 && n <= 23)
+    if (nums.length >= 2) {
+      let open = nums[0]
+      let close = nums[nums.length - 1]
+      if (close < open && close <= 12) close += 12
+      else if (close < 12 && open < close) close += 12
+      openHour = open
+      closeHour = close
+    }
+  }
+
+  return { openHour, closeHour, raw }
+}
+
+export function resolveCustomerTime(text, workingHours) {
+  const t = String(text || "").toLowerCase().trim()
+  if (!t) return null
+
+  const { openHour, closeHour } = parseWorkingHours(workingHours)
+
+  if (/\bnoon\b|\b12\s*pm\b/.test(t)) return { time24: "12:00", display: "12:00 PM", ambiguous: false, hour: 12 }
+  if (/\bmidnight\b/.test(t)) return { time24: "00:00", display: "12:00 AM", ambiguous: false, hour: 0 }
+
+  if (/\bmorning\b|\bsubah\b/.test(t) && !/\d/.test(t)) return { ambiguous: "vague", vague: "morning", openHour, closeHour }
+  if (/\bafternoon\b|\bdopahar\b/.test(t) && !/\d/.test(t)) return { ambiguous: "vague", vague: "afternoon", openHour, closeHour }
+  if (/\bevening\b|\bshaam\b/.test(t) && !/\d/.test(t)) return { ambiguous: "vague", vague: "evening", openHour, closeHour }
+  if (/\bnight\b|\braat\b/.test(t) && !/\d/.test(t)) return { ambiguous: "vague", vague: "night", openHour, closeHour }
+
+  const halfPast = t.match(/half\s*past\s*(\d{1,2})/)
+  if (halfPast) {
+    const h = parseInt(halfPast[1], 10)
+    const amFits = h >= openHour && h < closeHour
+    const pmH = h + 12
+    const pmFits = pmH >= openHour && pmH < closeHour
+    if (amFits && !pmFits) return { time24: `${pad(h)}:30`, display: `${h}:30 AM`, ambiguous: false, hour: h }
+    if (pmFits && !amFits) return { time24: `${pad(pmH)}:30`, display: `${h}:30 PM`, ambiguous: false, hour: pmH }
+    return { ambiguous: true, hour: h, min: "30", amFits, pmFits }
+  }
+
+  const explicit = t.match(/\b(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)\b/i)
+  if (explicit) {
+    let h = parseInt(explicit[1], 10)
+    const mn = explicit[2] || "00"
+    const ap = explicit[3].toLowerCase()
+    if (ap === "pm" && h < 12) h += 12
+    if (ap === "am" && h === 12) h = 0
+    return {
+      time24: `${pad(h)}:${mn}`,
+      display: `${h > 12 ? h - 12 : h || 12}:${mn} ${ap.toUpperCase()}`,
+      ambiguous: false,
+      hour: h,
+    }
+  }
+
+  const hhmm = t.match(/\b(\d{1,2}):(\d{2})\b/)
+  if (hhmm) {
+    const h = parseInt(hhmm[1], 10)
+    const mn = hhmm[2]
+    if (h >= 0 && h <= 23) {
+      return {
+        time24: `${pad(h)}:${mn}`,
+        display: h >= 12 ? `${h === 12 ? 12 : h - 12}:${mn} PM` : `${h || 12}:${mn} AM`,
+        ambiguous: false,
+        hour: h,
+      }
+    }
+  }
+
+  const numOnly = t.match(/\bat\s*(\d{1,2})\b|\b(\d{1,2})\b/)
+  if (numOnly) {
+    const h = parseInt(numOnly[1] || numOnly[2], 10)
+    if (h >= 1 && h <= 12) {
+      const amH = h
+      const pmH = h === 12 ? 12 : h + 12
+      const amFits = amH >= openHour && amH <= closeHour
+      const pmFits = pmH >= openHour && pmH <= closeHour
+      if (amFits && !pmFits) return { time24: `${pad(amH)}:00`, display: `${h}:00 AM`, ambiguous: false, hour: amH }
+      if (pmFits && !amFits) return { time24: `${pad(pmH)}:00`, display: `${h}:00 PM`, ambiguous: false, hour: pmH }
+      if (amFits && pmFits) return { ambiguous: true, hour: h, amH, pmH, amFits, pmFits }
+      return { ambiguous: "outofhours", hour: h, openHour, closeHour }
+    }
+  }
+
+  return null
+}
+
+export function formatBookingDate(date, timeZone = DEFAULT_TIMEZONE) {
+  if (!date) return null
+  return new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
+    weekday: "long",
+    day: "numeric",
+    month: "long",
+    timeZone,
+  })
+}
+
+
+export const resolveDate = resolveCustomerDate
+export const resolveTime = resolveCustomerTime
