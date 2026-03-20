// lib/booking/calendar-engine.js
// ALL date/time math lives here. Sarvam never calculates dates.

export function buildCalendarContext() {
  const nowIST  = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
  const pad     = n => String(n).padStart(2, "0")
  const toISO   = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  const toFull  = d => d.toLocaleDateString("en-IN", { weekday:"long",  day:"numeric", month:"long",  year:"numeric", timeZone:"Asia/Kolkata" })
  const toShort = d => d.toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short",                 timeZone:"Asia/Kolkata" })

  const days   = []
  const named  = {}
  const byDate = {}

  for (let i = 0; i <= 14; i++) {
    const d       = new Date(nowIST)
    d.setDate(nowIST.getDate() + i)
    const iso     = toISO(d)
    const full    = toFull(d)
    const short   = toShort(d)
    const dayName = d.toLocaleDateString("en-IN", { weekday:"long", timeZone:"Asia/Kolkata" }).toLowerCase()
    const dateNum = d.getDate()
    const monthName = d.toLocaleDateString("en-IN", { month:"long", timeZone:"Asia/Kolkata" })

    days.push({ i, iso, full, short, dayName, dateNum, monthName })
    if (!named[dayName])               named[dayName]               = { iso, full, short }
    if (!named[dayName.substring(0,3)]) named[dayName.substring(0,3)] = { iso, full, short }
    if (!byDate[dateNum])              byDate[dateNum]              = { iso, full, short, monthName }
  }

  const calStr = days.slice(0,14).map(d => {
    const label = d.i===0 ? " ← TODAY" : d.i===1 ? " ← TOMORROW" : ""
    return `${d.dayName.charAt(0).toUpperCase()+d.dayName.slice(1)}, ${d.dateNum} ${d.monthName} ${d.iso.split("-")[0]}  [${d.iso}]${label}`
  }).join("\n")

  return {
    today:    days[0],
    tomorrow: days[1],
    dayAfter: days[2],
    saturday: days.find(d => d.dayName === "saturday"),
    sunday:   days.find(d => d.dayName === "sunday"),
    named, byDate, days, calStr, nowIST
  }
}

export function resolveDate(text, cal) {
  const t = (text || "").toLowerCase().trim()

  if (/\btoday\b|\baaj\b/.test(t))                  return { ...cal.today,    ambiguous: false }
  if (/\btomorrow\b|\bkal\b|\bkl\b/.test(t))        return { ...cal.tomorrow,  ambiguous: false }
  if (/\bday after\b|\bparso\b/.test(t))            return { ...cal.dayAfter,  ambiguous: false }
  if (/\bthis weekend\b/.test(t))                   return { ambiguous: true,  options: [cal.saturday, cal.sunday].filter(Boolean) }

  // Named days
  for (const [name, info] of Object.entries(cal.named)) {
    if (new RegExp("\\b" + name + "\\b").test(t)) return { ...info, ambiguous: false }
  }

  // Month + day — "25th march", "march 25", "25/3"
  const months = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,
                   january:1,february:2,march:3,april:4,june:6,july:7,august:8,september:9,october:10,november:11,december:12 }
  let targetMonth = null
  for (const [mn, mv] of Object.entries(months)) {
    if (t.includes(mn)) { targetMonth = mv; break }
  }
  const numMatch = t.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/)
  if (numMatch && targetMonth) {
    const day = parseInt(numMatch[1])
    const d   = new Date(cal.nowIST.getFullYear(), targetMonth-1, day)
    if (d.getMonth() === targetMonth-1) {
      const pad = x => String(x).padStart(2,"0")
      const iso = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
      return {
        iso,
        full:  d.toLocaleDateString("en-IN", { weekday:"long",  day:"numeric", month:"long",  year:"numeric" }),
        short: d.toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short" }),
        ambiguous: false
      }
    }
  }

  // Just a number — "25", "the 10th"
  if (numMatch && !targetMonth) {
    const n = parseInt(numMatch[1])
    if (n >= 1 && n <= 31 && cal.byDate[n]) {
      return { ...cal.byDate[n], ambiguous: true, justNumber: true, num: n }
    }
  }

  // DD/MM
  const slash = t.match(/(\d{1,2})[\/\-](\d{1,2})/)
  if (slash) {
    const day = parseInt(slash[1]), mon = parseInt(slash[2])
    const d   = new Date(cal.nowIST.getFullYear(), mon-1, day)
    if (d.getMonth() === mon-1) {
      const pad = x => String(x).padStart(2,"0")
      const iso = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
      return {
        iso,
        full:  d.toLocaleDateString("en-IN", { weekday:"long",  day:"numeric", month:"long",  year:"numeric" }),
        short: d.toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short" }),
        ambiguous: true
      }
    }
  }

  return null
}

export function resolveTime(text, workingHours) {
  const t = (text || "").toLowerCase().trim()

  // Parse business hours
  let openHour = 9, closeHour = 21
  if (workingHours) {
    const wh = workingHours.toLowerCase()
    if (wh.includes("24/7") || wh.includes("24 hour") || wh.includes("always open")) {
      openHour = 0; closeHour = 23
    } else {
      const ampm = workingHours.match(/(\d{1,2})(?:[:.]\d{2})?\s*(am|pm)/gi) || []
      if (ampm.length >= 2) {
        const parsed = ampm.map(h => {
          const m = h.match(/(\d{1,2})(?:[:.]\d{2})?\s*(am|pm)/i)
          if (!m) return null
          let hr = parseInt(m[1])
          if (m[2].toLowerCase() === "pm" && hr < 12) hr += 12
          if (m[2].toLowerCase() === "am" && hr === 12) hr = 0
          return hr
        }).filter(n => n !== null)
        openHour = Math.min(...parsed); closeHour = Math.max(...parsed)
      } else {
        const nums = (workingHours.match(/\b(\d{1,2})(?::\d{2})?\b/g) || []).map(n => parseInt(n)).filter(n => n>=0&&n<=23)
        if (nums.length >= 2) {
          let o = nums[0], c = nums[nums.length-1]
          if (c < o && c <= 12) c += 12
          openHour = o; closeHour = c
        }
      }
    }
  }

  if (/\bnoon\b|\b12\s*pm\b/.test(t))  return { time24: "12:00", display: "12:00 PM", ambiguous: false }
  if (/\bmidnight\b/.test(t))           return { time24: "00:00", display: "12:00 AM", ambiguous: false }

  // Vague time words without numbers
  if (/\bmorning\b|\bsubah\b/.test(t)    && !/\d/.test(t)) return { ambiguous: "vague", vague: "morning",   openHour, closeHour }
  if (/\bafternoon\b|\bdopahar\b/.test(t) && !/\d/.test(t)) return { ambiguous: "vague", vague: "afternoon", openHour, closeHour }
  if (/\bevening\b|\bshaam\b/.test(t)    && !/\d/.test(t)) return { ambiguous: "vague", vague: "evening",   openHour, closeHour }
  if (/\bnight\b|\braat\b/.test(t)       && !/\d/.test(t)) return { ambiguous: "vague", vague: "night",     openHour, closeHour }

  // Explicit am/pm — "11am", "5:30pm", "5.30 pm", "at 11 am"
  const explicit = t.match(/\b(\d{1,2})(?:[:\.](\d{2}))?\s*(am|pm)\b/i)
  if (explicit) {
    let h    = parseInt(explicit[1])
    const mn = explicit[2] || "00"
    const ap = explicit[3].toLowerCase()
    if (ap === "pm" && h < 12) h += 12
    if (ap === "am" && h === 12) h = 0
    const display = `${h > 12 ? h-12 : h||12}:${mn} ${ap.toUpperCase()}`
    return { time24: `${String(h).padStart(2,"0")}:${mn}`, display, ambiguous: false }
  }

  // HH:MM 24hr
  const hm = t.match(/\b(\d{1,2}):(\d{2})\b/)
  if (hm) {
    const h = parseInt(hm[1]), mn = hm[2]
    if (h >= 0 && h <= 23) {
      const display = h >= 12 ? `${h===12?12:h-12}:${mn} PM` : `${h||12}:${mn} AM`
      return { time24: `${String(h).padStart(2,"0")}:${mn}`, display, ambiguous: false }
    }
  }

  // Just a number — "11", "5", "at 3"
  const num = t.match(/\bat\s*(\d{1,2})\b|\b(\d{1,2})\b/)
  if (num) {
    const h   = parseInt(num[1] || num[2])
    if (h >= 1 && h <= 12) {
      const amH = h, pmH = h === 12 ? 12 : h + 12
      const amFits = amH >= openHour && amH <= closeHour
      const pmFits = pmH >= openHour && pmH <= closeHour
      if (amFits && !pmFits) return { time24: `${String(amH).padStart(2,"0")}:00`, display: `${h}:00 AM`, ambiguous: false }
      if (pmFits && !amFits) return { time24: `${String(pmH).padStart(2,"0")}:00`, display: `${h}:00 PM`, ambiguous: false }
      if (amFits && pmFits)  return { ambiguous: true,          hour: h, amH, pmH }
      return { ambiguous: "outofhours", hour: h, openHour, closeHour }
    }
  }

  return null
}

export function formatDateForDisplay(isoDate) {
  if (!isoDate) return null
  return new Date(isoDate + "T12:00:00").toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long"
  })
}
