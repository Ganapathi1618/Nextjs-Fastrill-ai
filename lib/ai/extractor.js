// lib/ai/extractor.js
// STEP 2 — Entity extraction
// Returns structured fields: service, date, time, confirmation, ambiguous_fields
// Never triggers execution — only provides candidates

import { parseJSON } from "./classifier"
import { isValidDate, isPastDate, getTodayStr } from "../booking/calendar-engine"

export async function extractEntities({ message, history, services, state }) {
  const start = Date.now()

  if (process.env.SARVAM_API_KEY) {
    try {
      const result = await callSarvamExtractor({ message, history, services, state })
      if (result) {
        // Validate extracted dates — reject invalid or past dates
        if (result.date && !isValidDate(result.date)) {
          console.warn("[extractor] Sarvam returned invalid date:", result.date, "— clearing")
          result.date = null
        }
        if (result.date && isPastDate(result.date)) {
          console.warn("[extractor] Sarvam returned past date:", result.date, "— clearing")
          result.date = null
        }
        console.log(`✅ [extractor] service:${result.service||"null"} date:${result.date||"null"} time:${result.time||"null"} | ${Date.now()-start}ms`)
        return result
      }
    } catch(e) {
      console.warn("⚠️ [extractor] Sarvam failed:", e.message)
    }
  }

  const fallback = ruleBasedExtract(message, services, state)
  console.log("⚡ [extractor] fallback used")
  return fallback
}

async function callSarvamExtractor({ message, history, services, state }) {
  const serviceNames  = (services || []).map(s => s.name).join(", ") || "none configured"
  const recentHistory = (history || []).slice(-4).map(m =>
    (m.role === "user" ? "Customer" : "AI") + ": " + m.content
  ).join("\n")

  const todayStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: "Asia/Kolkata"
  })

  const prompt = `You are an entity extractor for a WhatsApp booking assistant.

Today is: ${todayStr}
Available services: ${serviceNames}
Current state: service="${state?.service||"none"}" date="${state?.date||"none"}" time="${state?.time||"none"}"

Recent conversation:
${recentHistory || "(no history)"}

Latest message: "${message}"

Extract entities. Use context from history too. Reply ONLY with valid JSON, no explanation:
{
  "service": "<matched service name exactly as listed above, or null>",
  "date": "<YYYY-MM-DD format only, or null>",
  "time": "<HH:MM 24hr format only, or null>",
  "time_window": "<morning|afternoon|evening|night or null>",
  "confirmation": "<true if customer confirmed, false if declined, null if unclear>",
  "ambiguous_fields": ["list of fields needing clarification"],
  "confidence": {
    "service": 0.0,
    "date": 0.0,
    "time": 0.0
  }
}`

  const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
    method:  "POST",
    headers: { "Content-Type": "application/json", "api-subscription-key": process.env.SARVAM_API_KEY },
    body:    JSON.stringify({
      model:       "sarvam-m",
      messages:    [{ role: "user", content: prompt }],
      max_tokens:  200,
      temperature: 0.1
    })
  })

  const data = await response.json()
  if (data?.error) {
    console.error("❌ [extractor] Sarvam error:", data.error.message)
    return null
  }
  const raw = data?.choices?.[0]?.message?.content || ""
  return parseJSON(raw, "extractor")
}

function ruleBasedExtract(message, services, state) {
  const m      = (message || "").toLowerCase()
  const now    = new Date()
  const pad    = n => String(n).padStart(2, "0")
  const toStr  = d => d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate())

  // Use calendar-engine for today to ensure timezone correctness
  const todayStr = getTodayStr()

  // ── Service matching ──────────────────────────────────────────
  let service = state?.service || null
  if (!service && services?.length) {
    for (const s of services) {
      if (m.includes(s.name.toLowerCase())) { service = s.name; break }
    }
    if (!service) {
      for (const s of services) {
        const words = s.name.toLowerCase().split(/\s+/).filter(w => w.length > 3)
        if (words.some(w => m.includes(w))) { service = s.name; break }
      }
    }
  }

  // ── Date matching ─────────────────────────────────────────────
  let date = state?.date || null
  if (!date) {
    if (/\b(today|aaj)\b/.test(m)) {
      date = todayStr
    } else if (/\b(tomorrow|kal|kl)\b/.test(m)) {
      const t = new Date(now); t.setDate(now.getDate()+1); date = toStr(t)
    } else if (/\b(day after|parso)\b/.test(m)) {
      const t = new Date(now); t.setDate(now.getDate()+2); date = toStr(t)
    } else {
      // Day names
      const days = [
        ["sunday","sun"], ["monday","mon"], ["tuesday","tue"], ["wednesday","wed"],
        ["thursday","thu"], ["friday","fri"], ["saturday","sat"]
      ]
      for (let i = 0; i < days.length; i++) {
        if (days[i].some(d => new RegExp("\\b" + d + "\\b").test(m))) {
          let diff = (i - now.getDay() + 7) % 7
          if (diff === 0) diff = 7
          const t = new Date(now); t.setDate(now.getDate() + diff)
          date = toStr(t); break
        }
      }
      // "25th march" or "march 25"
      if (!date) {
        const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"]
        for (let i = 0; i < months.length; i++) {
          const re = new RegExp("(\\d{1,2})(?:st|nd|rd|th)?\\s*" + months[i] + "|" + months[i] + "\\s*(\\d{1,2})(?:st|nd|rd|th)?", "i")
          const dm = m.match(re)
          if (dm) {
            const day = parseInt(dm[1] || dm[2])
            date = now.getFullYear() + "-" + pad(i+1) + "-" + pad(day)
            break
          }
        }
      }
      // DD/MM or DD-MM
      if (!date) {
        const dm = m.match(/(\d{1,2})[\/\-](\d{1,2})/)
        if (dm) date = now.getFullYear() + "-" + pad(dm[2]) + "-" + pad(dm[1])
      }
    }
  }

  // Validate extracted date — never trust a bad or past date
  if (date && !isValidDate(date)) {
    console.warn("[extractor] invalid date from rule-based:", date, "— clearing")
    date = null
  }
  if (date && isPastDate(date)) {
    console.warn("[extractor] past date from rule-based:", date, "— clearing")
    date = null
  }

  // ── Time matching ─────────────────────────────────────────────
  let time       = state?.time || null
  let timeWindow = null
  if (!time) {
    if      (/\b(morning|subah)\b/.test(m))     timeWindow = "morning"
    else if (/\b(afternoon|dopahar)\b/.test(m)) timeWindow = "afternoon"
    else if (/\b(evening|shaam)\b/.test(m))     timeWindow = "evening"
    else if (/\b(night|raat)\b/.test(m))        timeWindow = "night"

    const tm = m.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i) || m.match(/(\d{2}):(\d{2})/)
    if (tm) {
      let hour  = parseInt(tm[1])
      const min = tm[2] ? tm[2].padStart(2, "0") : "00"
      const ap  = (tm[3] || "").toLowerCase()
      if (ap === "pm" && hour < 12) hour += 12
      if (ap === "am" && hour === 12) hour = 0
      if (hour >= 7 && hour <= 22) time = pad(hour) + ":" + min
    }
  }

  // ── Confirmation ──────────────────────────────────────────────
  const confirmWords = ["yes","yeah","yep","ok","okay","sure","confirm","correct","haan","ha","ji","theek","done","go ahead","book it","proceed"]
  const cancelWords  = ["no","nope","cancel","nahi","mat"]
  const mTrim        = m.trim()
  const confirmation = confirmWords.some(w => mTrim === w || mTrim.startsWith(w + " "))
    ? true
    : cancelWords.some(w => mTrim === w) ? false : null

  const ambiguous_fields = []
  if (!service) ambiguous_fields.push("service")
  if (!date)    ambiguous_fields.push("date")
  if (!time && !timeWindow) ambiguous_fields.push("time")

  return {
    service, date, time,
    time_window: timeWindow,
    confirmation,
    ambiguous_fields,
    confidence: {
      service: service ? 0.85 : 0.0,
      date:    date    ? 0.85 : 0.0,
      time:    time    ? 0.85 : 0.0
    }
  }
}
