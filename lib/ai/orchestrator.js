// lib/ai/orchestrator.js — v3.4 STATE FIX + MULTILINGUAL
const { getFallbackReply }  = require("./fallback-engine")
const { loadContext }       = require("../memory/context-engine")
const { loadState, saveState, clearBookingFields } = require("../memory/state-engine")
const { createBooking, rescheduleBooking } = require("../booking/booking-engine")
const { matchService, isTimeBased }        = require("../booking/slot-engine")
const { createClient } = require("@supabase/supabase-js")

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const SARVAM_TIMEOUT_MS  = 15000
const SARVAM_MAX_RETRIES = 2

function pad(n) { return String(n).padStart(2, "0") }
function toDateStr(d) { return d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate()) }

function todayStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
}
function tomorrowStr() {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
  d.setDate(d.getDate() + 1)
  return toDateStr(d)
}
function todayFormatted() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: "Asia/Kolkata"
  })
}
function currentMonth() {
  return new Date().toLocaleDateString("en-IN", { month: "long", timeZone: "Asia/Kolkata" })
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function detectLanguage(message) {
  if (!message) return "English"
  if (/[\u0C00-\u0C7F]/.test(message)) return "Telugu"
  if (/[\u0900-\u097F]/.test(message)) return "Hindi"
  if (/[\u0B80-\u0BFF]/.test(message)) return "Tamil"
  if (/[\u0C80-\u0CFF]/.test(message)) return "Kannada"
  if (/[\u0D00-\u0D7F]/.test(message)) return "Malayalam"
  return "English"
}

// Strip emojis that render as stickers on WhatsApp
function stripBadEmojis(text) {
  if (!text) return text
  return text
    .replace(/📅/g, "").replace(/📆/g, "").replace(/⏰/g, "")
    .replace(/🔔/g, "").replace(/⌚/g, "")
    .replace(/🕐|🕑|🕒|🕓|🕔|🕕|🕖|🕗|🕘|🕙|🕚|🕛/g, "")
    .replace(/  +/g, " ").trim()
}

// Pre-resolve today/tomorrow BEFORE sending to AI
function preFillDateFromMessage(message, state) {
  if (state.date) return null
  const m = (message || "").toLowerCase().trim()
  if (/\btoday\b/.test(m) || /\baaj\b/.test(m) || /\bee roju\b/.test(m)) return todayStr()
  if (/\btomorrow\b/.test(m) || /\bkal\b/.test(m) || /\breyyi\b/.test(m) || /\bnale\b/.test(m)) return tomorrowStr()
  return null
}

const NEGATION_PATTERNS = [
  /^no\b/i, /^nahi\b/i, /^nope\b/i,
  /^vaddu\b/i, /^vaddhu\b/i, /^don'?t\b/i,
  /^cancel\s+it\b/i, /^not\s+now\b/i,
  /^wait\b/i, /^hold\b/i, /^stop\b/i,
]
function isNegation(message) {
  return NEGATION_PATTERNS.some(p => p.test((message || "").trim()))
}

async function callSarvamWithRetry(payload, attempt = 1) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SARVAM_TIMEOUT_MS)
  try {
    const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-subscription-key": process.env.SARVAM_API_KEY },
      body: JSON.stringify(payload),
      signal: controller.signal
    })
    clearTimeout(timer)
    const data = await res.json()
    if (data?.error) {
      const code = data.error.code || data.error.status
      console.error("❌ Sarvam error (attempt " + attempt + ") code=" + code + ":", data.error.message)
      if (code === 401 || code === 403 || code === 429) return null
      if (attempt <= SARVAM_MAX_RETRIES) { await sleep(800 * attempt); return callSarvamWithRetry(payload, attempt + 1) }
      return null
    }
    const content = data?.choices?.[0]?.message?.content || null
    if (!content) console.warn("⚠️ Sarvam returned empty content (attempt " + attempt + ")")
    return content
  } catch(e) {
    clearTimeout(timer)
    const reason = e.name === "AbortError" ? "TIMEOUT (" + SARVAM_TIMEOUT_MS + "ms)" : e.message
    console.error("❌ Sarvam " + reason + " (attempt " + attempt + ")")
    if (attempt <= SARVAM_MAX_RETRIES) { await sleep(800 * attempt); return callSarvamWithRetry(payload, attempt + 1) }
    console.error("💀 All Sarvam attempts failed")
    return null
  }
}

function parseAIDecision(raw) {
  if (!raw) return null
  try {
    let clean = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim()
    if (clean.includes("<think>")) clean = clean.split("<think>")[0].trim()
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    return JSON.parse(jsonMatch[0])
  } catch(e) {
    console.error("❌ JSON parse failed. Raw:", (raw || "").substring(0, 150))
    return null
  }
}

function buildMasterPrompt({ message, biz, services, history, state, firstName, activeBookings, detectedLanguage, preFilledDate }) {
  const bizName = biz?.business_name || "this business"
  const bizType = biz?.business_type || "business"
  const svcList = services.map(s =>
    s.name + " ₹" + s.price +
    (s.duration    ? " " + s.duration + "min" : "") +
    (s.description ? " (" + s.description + ")" : "")
  ).join("\n") || "no services configured"

  const historyText = (history || []).slice(-8).map(m =>
    (m.role === "user" ? "Customer" : "You") + ": " + m.content
  ).join("\n")

  const stateLines = []
  if (state.service) stateLines.push("Already have service: " + state.service)
  if (state.date)    stateLines.push("Already have date: " + state.date + " — DO NOT ask for date again")
  else if (preFilledDate) stateLines.push("Date resolved from message: " + preFilledDate + " — USE THIS as extracted.date, do NOT ask for date again")
  if (state.time)    stateLines.push("Already have time: " + state.time + " — DO NOT ask for time again")
  if (state.stage && state.stage !== "idle") stateLines.push("Current stage: " + state.stage)
  if (state.preferred_language) stateLines.push("⚠️ MUST reply in " + state.preferred_language + " — customer requested this language")
  const stateText = stateLines.length ? stateLines.join("\n") : "Fresh conversation — nothing collected yet"

  const langOverride = state.preferred_language
    ? `⚠️ REPLY LANGUAGE: ${state.preferred_language} — customer explicitly requested this. Do NOT use any other language.`
    : `⚠️ REPLY LANGUAGE: ${detectedLanguage} — detected from message script. Do NOT use any other language.`

  const today    = todayStr()
  const tomorrow = tomorrowStr()
  const month    = currentMonth()

  return `${langOverride}

You are an AI receptionist for *${bizName}* (${bizType}).

CURRENT DATE AND TIME (IST):
Today     = ${today} (${todayFormatted()})
Tomorrow  = ${tomorrow}
This month = ${month} ${new Date().getFullYear()}

DATE RESOLUTION (CRITICAL — apply before replying):
- "today" / "aaj" / "ee roju"           → extracted.date = "${today}" — do NOT ask again
- "tomorrow" / "kal" / "nale" / "reyyi" → extracted.date = "${tomorrow}" — do NOT ask again
- "24th" / "25th" / any day number with NO month → assume ${month}, if passed use next month
- Day names like "Monday", "Saturday" → find next occurrence
- NEVER ask "which month?" — always resolve automatically
- If date already in BOOKING STATE → skip date collection entirely

SERVICES AVAILABLE:
${svcList}

BUSINESS INFO:
${biz?.working_hours ? "Hours: " + biz.working_hours : ""}
${biz?.location      ? "Location: " + biz.location : ""}
${biz?.maps_link     ? "Maps: " + biz.maps_link : ""}
${biz?.ai_instructions ? "Owner instructions: " + biz.ai_instructions : ""}

CONVERSATION SO FAR:
${historyText || "(new conversation)"}

BOOKING STATE:
${stateText}

CUSTOMER'S ACTIVE BOOKINGS:
${activeBookings || "no upcoming bookings"}

CUSTOMER NAME: ${firstName}
CUSTOMER MESSAGE: "${message}"

YOUR JOB:
You are a warm, intelligent receptionist. You understand context and intent.
Never give a generic greeting when customer states their intent clearly.
If they say "reschedule" or "cancel" — act immediately, don't greet.
Never repeat yourself. Ask one clarifying question at a time.

LANGUAGE RULE (CRITICAL):
- Detect language from SCRIPT/CHARACTERS, NOT from language names mentioned
- Telugu script (అ ఆ ఇ etc) → reply in Telugu
- Hindi/Devanagari (अ आ इ etc) → reply in Hindi
- Latin script (a-z) → reply in ENGLISH even if "telugu" or "hindi" is mentioned
- If customer says "speak english" / "english lo" → switch and STAY in English
- Preferred language from state: ${state.preferred_language || "not set — detect from script"}

CONFIRMATION vs NEGATION:
- confirmed=true ONLY for: yes, ok, okay, sure, haan, avunu, sare, confirm, proceed, do it
- confirmed=false for: no, nope, nahi, vaddu, don't, wait, hold on, not now, stop
- Word "no" at start → ALWAYS confirmed=false
- When confirmed=false during confirm_booking: ask what they'd like to change

BOOKING LOGIC:
- Need: service + date + time (for time-based services)
- Collect ONE missing field at a time
- "same time" / "same slot" → use state.time: ${state.time || "none"}
- Never book without explicit confirmation

SMART TIME HANDLING:
- Business hours: ${biz?.working_hours || "9am to 9pm"}
- "2" / "2 o'clock" = 14:00 (2am outside business hours)
- "3","4","5","6","7","8" = always PM
- "9" = 09:00, "10","11","12" = 10:00,11:00,12:00, "1" = 13:00
- Always convert to 24hr in extracted.time
- Show as "2 PM", "10 AM" in reply — never "14:00"
- Never ask "AM or PM?"

RESCHEDULE LOGIC:
- collect_date → collect_time → confirm_booking → do_reschedule
- If stage=reschedule_mode and customer confirms → ALWAYS action=do_reschedule, confirmed=true

CANCEL LOGIC:
- "cancel everything" → action=do_cancel, cancel_scope=all
- "cancel [specific]" → cancel_scope=specific
- Typos: cancle/cancell/canel = cancel

EMOJI RULE (CRITICAL):
- NEVER use: 📅 📆 ⏰ 🔔 — these render as image stickers on WhatsApp
- Allowed: ✅ 😊 👋 🙏 💬 ✓ 😔 🌟

RULES:
1. Answer price/location/hours questions mid-booking, then resume
2. Never say "I don't understand" — map to closest intent
3. Ask ONE clarifying question if unclear
4. Never repeat same response twice
5. Keep replies 2-3 lines max unless listing services
6. Never invent services or prices
7. Never use raw dates like "2026-04-25" — say "Saturday, 25 April"
8. Never ask "which month?" — assume current month

RESPOND WITH ONLY THIS JSON:
{
  "reply": "<reply in REPLY LANGUAGE above>",
  "action": "<none|collect_service|collect_date|collect_time|confirm_booking|do_booking|do_reschedule|do_cancel|show_services|show_location|show_hours|escalate>",
  "extracted": {
    "service": "<name or null>",
    "date": "<YYYY-MM-DD or null — ${today} for today, ${tomorrow} for tomorrow>",
    "time": "<HH:MM 24hr or null>",
    "confirmed": <true or false>,
    "cancel_scope": "<all|specific|null>",
    "keep_date": "<YYYY-MM-DD or null>",
    "keep_time": "<HH:MM or null>"
  },
  "preferred_language": "<English|Telugu|Hindi|Tamil|null — only when customer explicitly requests>",
  "language": "<detected language>"
}`
}

function buildSafeFallback({ message, state, biz, services, firstName }) {
  const msg = (message || "").toLowerCase().trim()
  let intent = { primary_intent: "out_of_scope", sentiment: "neutral" }
  if (/^(hi|hello|hey|hii|hai|namaste|నమస్కారం|హలో)\b/i.test(msg))              intent.primary_intent = "greeting"
  else if (/\b(price|cost|charge|fee|rate|how much|ధర|రేటు|ఎంత)\b/i.test(msg))  intent.primary_intent = "pricing"
  else if (/\b(book|appointment|slot|schedule|fix|బుక్|అపాయింట్మెంట్)\b/i.test(msg)) intent.primary_intent = "booking_new"
  else if (/\b(reschedule|change|shift|postpone|మార్చు)\b/i.test(msg))            intent.primary_intent = "booking_reschedule"
  else if (/\b(cancel|cancle|cancell|రద్దు)\b/i.test(msg))                        intent.primary_intent = "booking_cancel"
  else if (/where (are|is) you|what.*(address|location)|how.*(get|find|reach)/i.test(msg)) intent.primary_intent = "location_query"
  else if (/what.*(timing|hours|open)|when.*open|working hours/i.test(msg))       intent.primary_intent = "hours_query"
  else if (state?.stage && state.stage !== "idle")                                 intent.primary_intent = "booking_new"
  return getFallbackReply({ intent, state, biz, services, firstName, message })
}

async function orchestrate({ userId, conversationId, phone, contactName, message, isMediaOnly }) {
  let context, state
  try {
    ;[context, state] = await Promise.all([
      loadContext({ userId, conversationId, phone }),
      loadState(conversationId)
    ])
  } catch(e) {
    console.error("❌ CRITICAL: context/state load failed:", e.message)
    return "Hi! We're having a brief technical issue. Please try again in a moment 🙏"
  }

  const { biz, services, history, activeBookings } = context
  const firstName = (contactName || "").split(" ")[0] || "there"

  if (isMediaOnly) {
    return "Thanks for sharing! 😊 If you have any questions or want to book, just type here."
  }

  // ── LANGUAGE DETECTION ──────────────────────────────────────
  const detectedLang = detectLanguage(message)

  // Update preferred_language if customer's script changed
  // e.g. they previously said "speak Telugu" but now writing in English → switch back
  let currentPreferred = state.preferred_language
  if (currentPreferred && currentPreferred !== "English") {
    // If customer is now writing in Latin script → they switched to English
    if (detectedLang === "English" && !/speak|language|english|telugu|hindi/i.test(message)) {
      currentPreferred = null
    }
  }
  const replyLang = currentPreferred || detectedLang

  // ── FRESH BOOKING STATE CLEAR ────────────────────────────────
  // If stage is idle, ALWAYS clear stale date/time from previous sessions
  // This prevents old reschedule/booking data being reused in new conversations
  if (!state.stage || state.stage === "idle") {
    state = {
      ...state,
      service:          null,
      date:             null,
      time:             null,
      staff:            null,
      missing_fields:   [],
      last_ai_question: null,
      clarification_for: [],
      confidence:       {},
      preferred_language: currentPreferred || state.preferred_language
    }
  }

  // ── PRE-FILL DATE FROM MESSAGE ───────────────────────────────
  const preFilledDate = preFillDateFromMessage(message, state)
  if (preFilledDate && !state.date) {
    state = { ...state, date: preFilledDate }
  }

  let decision = null

  if (process.env.SARVAM_API_KEY) {
    const raw = await callSarvamWithRetry({
      model:       "sarvam-m",
      messages:    [{ role: "user", content: buildMasterPrompt({ message, biz, services, history, state, firstName, activeBookings, detectedLanguage: replyLang, preFilledDate }) }],
      max_tokens:  1200,
      temperature: 0.3
    })

    if (raw) {
      decision = parseAIDecision(raw)
      if (!decision) {
        console.warn("⚠️ AI response unparseable — retrying with minimal prompt")
        const svcNames = services.map(s => s.name).join(", ")
        const isRescheduleStage = state.stage === "reschedule_mode"
        const confirmAction = isRescheduleStage ? "do_reschedule" : "do_booking"
        const minimalPrompt = `Reply ONLY with valid JSON. No explanation.

Customer: "${message}"
Services: ${svcNames}
Stage: ${state.stage || "idle"}
State: service=${state.service||"none"}, date=${state.date||"none"}, time=${state.time||"none"}
Today=${todayStr()}, Tomorrow=${tomorrowStr()}
Language: ${replyLang}

Rules:
- service known, no date → action=collect_date
- service+date known, no time → action=collect_time  
- all collected → action=confirm_booking
- customer confirmed → action=${confirmAction}, confirmed=true
- reschedule_mode + yes → action=do_reschedule, confirmed=true
- NEVER use emojis 📅 📆 ⏰ in reply

{"reply":"<reply in ${replyLang}>","action":"<action>","extracted":{"service":"<name or null>","date":"<YYYY-MM-DD or null>","time":"<HH:MM or null>","confirmed":<true/false>},"language":"${replyLang}"}`

        const raw2 = await callSarvamWithRetry({
          model: "sarvam-m",
          messages: [{ role: "user", content: minimalPrompt }],
          max_tokens: 400,
          temperature: 0.1
        })
        if (raw2) {
          decision = parseAIDecision(raw2)
          if (!decision) console.warn("⚠️ Retry also unparseable — using fallback")
        }
      }
    } else {
      console.warn("⚠️ Sarvam null after all retries — falling back")
    }
  } else {
    console.warn("⚠️ SARVAM_API_KEY not set")
  }

  // Language enforcement — if AI replied in wrong language, translate
  if (decision?.reply) {
    const replyScript = detectLanguage(decision.reply)
    if (replyLang === "English" && replyScript !== "English") {
      console.warn("⚠️ Wrong language in reply — translating to English")
      const translateRaw = await callSarvamWithRetry({
        model: "sarvam-m",
        messages: [{ role: "user", content: "Translate to English. Reply with ONLY translated text:\n\n" + decision.reply }],
        max_tokens: 300,
        temperature: 0.1
      })
      if (translateRaw && translateRaw.trim().length > 3) {
        decision.reply = translateRaw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim()
      }
    }
    // Always strip bad emojis
    decision.reply = stripBadEmojis(decision.reply)
  }

  if (!decision) {
    const fallbackReply = buildSafeFallback({ message, state, biz, services, firstName })
    try { await saveState(conversationId, state) } catch(e) {}
    return fallbackReply
  }

  let newState = Object.assign({}, state)

  // Update preferred_language from AI decision
  if (decision.preferred_language && decision.preferred_language !== "null") {
    newState.preferred_language = decision.preferred_language
  } else if (!currentPreferred && detectedLang !== "English") {
    // Auto-set preferred language from detected script
    newState.preferred_language = detectedLang
  }

  const extracted = decision.extracted || {}
  let action = decision.action || "none"

  // Inject pre-filled date if AI didn't extract one
  if (preFilledDate && !extracted.date) {
    extracted.date = preFilledDate
  }

  // Negation guard
  if (isNegation(message) && (extracted.confirmed === true || action === "do_booking")) {
    console.warn("⛔ Negation guard fired")
    extracted.confirmed = false
    if (action === "do_booking") action = "confirm_booking"
  }

  // Reschedule confirmation override
  const CONFIRM_WORDS = /^(yes|ok|okay|sure|haan|avunu|sare|confirm|cofirmed|confirmed|proceed)$/i
  if (
    newState.stage === "reschedule_mode" &&
    CONFIRM_WORDS.test((message || "").trim()) &&
    newState.date && newState.time
  ) {
    action = "do_reschedule"
    extracted.confirmed = true
  }

  const isReschedule = ["do_reschedule","collect_date","collect_time","confirm_booking"].includes(action)

  if (extracted.service) {
    const matched = matchService(extracted.service, services)
    if (matched && (!newState.service || isReschedule)) {
      newState.service = matched.name
    }
  }
  if (extracted.date) newState.date = extracted.date
  if (extracted.time) {
    const { normalizeTime } = require("../booking/calendar-engine")
    newState.time = normalizeTime(extracted.time) || extracted.time
  }

  let reply = decision.reply || ""

  // ── Execute: Booking ─────────────────────────────────────────
  if (action === "do_booking") {
    if (newState.service && (newState.date || !isTimeBased(matchService(newState.service, services)))) {
      if (extracted.confirmed === true) {
        try {
          const result = await createBooking({
            userId, customerName: contactName, customerPhone: phone,
            customerId: null, state: newState, services,
            bizName: biz.business_name,
            language: replyLang
          })
          if (result.ok) {
            newState = clearBookingFields(newState)
            newState.stage = "idle"
            await saveState(conversationId, newState)
            await supabaseAdmin.from("conversations")
              .update({ last_message: "✅ Booking Confirmed — " + result.booking.service })
              .eq("id", conversationId)
            return result.confirmMsg
          } else if (result.slotFull) {
            newState.time = null
            await saveState(conversationId, newState)
            return result.message
          }
        } catch(e) {
          console.error("❌ createBooking threw:", e.message)
          return "Sorry, there was an issue saving your booking 😅 Please try again."
        }
      }
    }
  }

  // ── Execute: Cancel ──────────────────────────────────────────
  if (action === "do_cancel") {
    try {
      const todayDate = todayStr()
      const cancelScope = extracted?.cancel_scope
      if (cancelScope === "all") {
        const { data: allBookings } = await supabaseAdmin
          .from("bookings").select("id, service, booking_date, booking_time")
          .eq("customer_phone", phone).eq("user_id", userId)
          .in("status", ["confirmed","pending"]).gte("booking_date", todayDate)
        if (allBookings?.length) {
          const keepDate = extracted?.keep_date || null
          const keepTime = extracted?.keep_time || null
          const toCancel = allBookings.filter(b => {
            if (!keepDate && !keepTime) return true
            if (keepDate && keepTime) return !(b.booking_date === keepDate && b.booking_time === keepTime)
            if (keepDate) return b.booking_date !== keepDate
            if (keepTime) return b.booking_time !== keepTime
            return true
          })
          if (toCancel.length) {
            await supabaseAdmin.from("bookings").update({ status: "cancelled" })
              .in("id", toCancel.map(b => b.id))
          }
        }
      } else if (newState.service || newState.date) {
        let q = supabaseAdmin.from("bookings").update({ status: "cancelled" })
          .eq("customer_phone", phone).eq("user_id", userId)
          .in("status", ["confirmed","pending"])
        if (newState.service) q = q.ilike("service", "%" + newState.service + "%")
        if (newState.date)    q = q.eq("booking_date", newState.date)
        if (newState.time)    q = q.eq("booking_time", newState.time)
        await q
      }
      newState = clearBookingFields(newState)
      await saveState(conversationId, newState)
      return reply || buildSafeFallback({ message, state: newState, biz, services, firstName })
    } catch(e) {
      console.error("❌ Cancel failed:", e.message)
    }
  }

  // ── Execute: Reschedule ──────────────────────────────────────
  if (action === "do_reschedule") {
    if (newState.date && newState.time && extracted.confirmed === true) {
      try {
        const result = await rescheduleBooking({
          userId, customerPhone: phone,
          date: newState.date, time: newState.time,
          services, serviceName: newState.service
        })
        if (result.ok) {
          newState = clearBookingFields(newState)
          newState.stage = "idle"
          await saveState(conversationId, newState)
          return result.message
        }
        await saveState(conversationId, newState)
        return result.message
      } catch(e) {
        console.error("❌ Reschedule threw:", e.message)
      }
    }
  }

  // ── Update stage ─────────────────────────────────────────────
  const stageMap = {
    "collect_service":  "awaiting_service",
    "collect_date":     "awaiting_date",
    "collect_time":     "awaiting_time",
    "confirm_booking":  "awaiting_confirmation",
    "do_booking":       "awaiting_confirmation",
    "do_reschedule":    "reschedule_mode",
    "escalate":         "handoff_mode",
  }
  if (stageMap[action]) newState.stage = stageMap[action]

  newState.failed_clarifications =
    (action === "none" && reply.includes("?"))
      ? (newState.failed_clarifications || 0) + 1
      : 0

  try {
    await saveState(conversationId, newState)
  } catch(e) {
    console.error("❌ saveState failed (non-fatal):", e.message)
  }

  if (action === "escalate") {
    try {
      await supabaseAdmin.from("ai_event_log").insert({
        user_id: userId, stage: "handoff",
        input_json: { message },
        success: true, created_at: new Date().toISOString()
      })
    } catch(e) {}
  }

  return reply || buildSafeFallback({ message, state: newState, biz, services, firstName })
}

module.exports = { orchestrate }
