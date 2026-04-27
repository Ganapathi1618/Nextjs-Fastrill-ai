// lib/ai/orchestrator.js — v3.6 PRODUCTION COMPLETE
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

function stripBadEmojis(text) {
  if (!text) return text
  return text
    .replace(/📅/g, "").replace(/📆/g, "").replace(/⏰/g, "")
    .replace(/🔔/g, "").replace(/⌚/g, "").replace(/🎊/g, "")
    .replace(/🕐|🕑|🕒|🕓|🕔|🕕|🕖|🕗|🕘|🕙|🕚|🕛/g, "")
    .replace(/  +/g, " ").trim()
}

function preFillDateFromMessage(message, state) {
  if (state.date) return null
  const m = (message || "").toLowerCase().trim()
  if (/\btoday\b/.test(m) || /\baaj\b/.test(m) || /\bee roju\b/.test(m)) return todayStr()
  if (/\btomorrow\b/.test(m) || /\bkal\b/.test(m) || /\breyyi\b/.test(m) || /\bnale\b/.test(m)) return tomorrowStr()
  return null
}

// Smarter negation — only pure standalone negations block booking
// "No please book on 28th" is NOT a negation — customer is correcting date
// "No" / "nahi" / "vaddu" alone = negation
const PURE_NEGATION_PATTERN = /^(no|nahi|nope|vaddu|vaddhu|don't|dont|wait|hold|stop|not now|cancel it)\.?\s*$/i
function isNegation(message) {
  return PURE_NEGATION_PATTERN.test((message || "").trim())
}

// Detect if customer is correcting/updating a field mid-booking
// "No please book on 28th" = date correction, not negation
function isDateCorrection(message) {
  return /\b(no|nahi|vaddu)\b.*\b(\d{1,2}(st|nd|rd|th)?)\b/i.test(message) ||
         /\b(book|change|make it|28th|29th|30th|1st|2nd|3rd)\b/i.test(message)
}

async function callSarvamWithRetry(payload, attempt = 1) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SARVAM_TIMEOUT_MS)
  try {
    const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": process.env.SARVAM_API_KEY
      },
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

// Filter history to only include booking-relevant messages
// Removes out-of-scope chatter (sports, general questions) so AI doesn't get confused
function filterRelevantHistory(history) {
  if (!history?.length) return []
  const OUT_OF_SCOPE_PATTERNS = [
    /who won|ipl|cricket|football|sports|weather|news|politics|joke/i,
    /what type of bot|are you a bot|are you human|who are you/i,
    /fck|fuck|shit|damn|wtf/i,
    /can you read|read the msg|context/i
  ]
  return history.filter(m => {
    const content = (m.content || "").toLowerCase()
    // Keep all assistant messages and booking-related user messages
    if (m.role === "assistant") return true
    // Filter out user messages that are pure out-of-scope
    const isOutOfScope = OUT_OF_SCOPE_PATTERNS.some(p => p.test(content))
    const isBookingRelated = /book|appointment|service|date|time|cancel|reschedule|price|cost|location|hours/i.test(content)
    return !isOutOfScope || isBookingRelated
  })
}

function buildMasterPrompt({ message, biz, services, history, state, firstName, activeBookings, detectedLanguage, preFilledDate }) {
  const bizName = biz?.business_name || "this business"
  const bizType = biz?.business_type || "business"
  const svcList = services.map(s =>
    s.name + " ₹" + s.price +
    (s.duration    ? " " + s.duration + "min" : "") +
    (s.description ? " (" + s.description + ")" : "")
  ).join("\n") || "no services configured"

  // Filter history to remove out-of-scope noise
  const cleanHistory = filterRelevantHistory(history || [])
  const historyText = cleanHistory.slice(-6).map(m =>
    (m.role === "user" ? "Customer" : "You") + ": " + m.content
  ).join("\n")

  const stateLines = []
  if (state.service) stateLines.push("Already have service: " + state.service)
  if (state.date)    stateLines.push("Already have date: " + state.date + " — DO NOT ask for date again")
  else if (preFilledDate) stateLines.push("Date resolved from message: " + preFilledDate + " — USE THIS as extracted.date, do NOT ask for date again")
  if (state.time)    stateLines.push("Already have time: " + state.time + " — DO NOT ask for time again")
  if (state.stage && state.stage !== "idle") stateLines.push("Current stage: " + state.stage)
  if (state.preferred_language) stateLines.push("⚠️ MUST reply in " + state.preferred_language)
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

DATE RESOLUTION (CRITICAL):
- "today" / "aaj" / "ee roju"           → extracted.date = "${today}" — do NOT ask again
- "tomorrow" / "kal" / "nale" / "reyyi" → extracted.date = "${tomorrow}" — do NOT ask again
- "28th" / "25th" / any day number      → assume ${month} first, if passed use next month — NEVER ask which month
- Day names like "Monday"               → find next occurrence of that day
- If customer says "No book on 28th" or "make it 28th" or corrects the date → UPDATE extracted.date to the new date, set confirmed=false, ask to confirm new date
- If date already in BOOKING STATE but customer gives a NEW date → OVERRIDE with the new date

CRITICAL DATE OVERRIDE RULE:
- If customer gives a specific date in their message (like "28th", "28 April") → ALWAYS use that date
- Do NOT use the date from BOOKING STATE if customer is specifying a different one
- "No please book on 28th" = customer wants 28th, NOT a cancellation

SERVICES AVAILABLE:
${svcList}

BUSINESS INFO:
${biz?.working_hours ? "Hours: " + biz.working_hours : ""}
${biz?.location      ? "Location: " + biz.location : ""}
${biz?.maps_link     ? "Maps: " + biz.maps_link : ""}
${biz?.ai_instructions ? "Owner instructions: " + biz.ai_instructions : ""}

RECENT BOOKING CONVERSATION:
${historyText || "(new conversation)"}

BOOKING STATE:
${stateText}

CUSTOMER'S ACTIVE BOOKINGS:
${activeBookings || "no upcoming bookings"}

CUSTOMER NAME: ${firstName}
CUSTOMER MESSAGE: "${message}"

YOUR PERSONALITY:
You are warm, witty, emotionally intelligent — like a real human receptionist at ${bizName}.
You have personality. You can laugh. You are empathetic. You never sound like a robot.
Keep replies SHORT and natural — like WhatsApp messages, not formal emails.

OUT-OF-SCOPE HANDLING (CRITICAL):
When customer asks something unrelated to the business — sports, weather, news, jokes, politics, general knowledge:
- Do NOT say "I only handle bookings" — robotic
- Do NOT say "I can't answer that" — cold
- Handle like a real human receptionist — acknowledge warmly, redirect naturally

Examples:
Customer: "Who won IPL today?"
You: "Ha, wish I was watching too! 😄 I'm managing bookings here at ${bizName} — need to schedule something?"

Customer: "What's the weather?"
You: "No idea, stuck inside replying to messages 😂 Need to book something?"

Customer: "Tell me a joke"
You: "Why did the customer never cancel? Service was too good 😄 Can I book something for you?"

Customer: "Who are you / what type of bot are you?"
You: "I'm the AI receptionist at ${bizName} 😊 I handle bookings, answer questions about our services, and make sure you're taken care of. What can I help you with?"

Customer: "fck you / abusive message"
You: "I understand you might be frustrated 😔 I'm here to help — what's going on? Let me know how I can make it right."

LANGUAGE RULE (CRITICAL):
- Detect language from SCRIPT/CHARACTERS, NOT from language names mentioned
- Telugu script → reply in Telugu
- Hindi/Devanagari → reply in Hindi
- Latin script → reply in ENGLISH even if "telugu" or "hindi" is mentioned
- Match the TONE of the customer — casual if they're casual, warm if they're upset
- If customer says "speak english" → switch and STAY in English
- DO NOT mix languages — if replying in Telugu, full reply in Telugu

CONFIRMATION vs NEGATION (CRITICAL):
- confirmed=true ONLY for: yes, ok, okay, sure, haan, avunu, sare, confirm, proceed, do it
- confirmed=false ONLY when message is PURELY negative: "no", "nahi", "vaddu", "stop", "wait" — standalone words
- "No please book on 28th" = NOT a negation — customer is correcting the date, set confirmed=false but extract new date
- "No make it 5pm" = NOT a negation — customer is changing time, extract new time
- NEVER block a booking because the word "no" appears at start if customer is giving new info after it

BOOKING LOGIC:
- Need: service + date + time (for time-based services)
- Collect ONE missing field at a time
- If customer gives a new date/time during confirmation → update extracted fields, ask to re-confirm
- "same time" / "same slot" → use state.time: ${state.time || "none"}
- Never book without explicit yes/ok/sure/confirm

SMART TIME HANDLING:
- Business hours: ${biz?.working_hours || "9am to 9pm"}
- "2" / "2 o'clock" = 14:00 (2am is outside business hours)
- "3","4","5","6","7","8" = always PM
- "9" = 09:00, "10","11","12" = 10:00, 11:00, 12:00, "1" = 13:00
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

REMINDER PREFERENCE:
- "remind me 2 hours before" / "2hrs before" → action=set_reminder, extracted.reminder_preference="2hrs"
- "remind me day before" / "24hrs before"    → action=set_reminder, extracted.reminder_preference="24hrs"
- Confirm warmly: "Sure! I'll remind you 2 hours before 😊"

REPLY FORMAT RULES (CRITICAL):
- NEVER show raw dates like "2026-04-25" or "2026-04-28" in your reply text — say "Tuesday, 28 April" 
- NEVER show raw times like "20:00" — say "8 PM"
- NEVER use emojis: 📅 📆 ⏰ 🔔 🎊 — these render as stickers on WhatsApp
- Allowed emojis: ✅ 😊 👋 🙏 💬 😄 😔 😂 🌟 ✓
- Keep replies 1-3 lines max for most messages
- Never list services unless customer asks

IMPORTANT RULES:
1. Answer price/location/hours mid-booking, then resume naturally
2. Never say "I don't understand" — map to closest intent
3. Never repeat same response twice in a row
4. Never invent services or prices not in the list
5. If customer seems upset — acknowledge feelings first, help second
6. If customer is just chatting — be friendly, redirect gently
7. You are a receptionist — stay in that role naturally, not like a chatbot

RESPOND WITH ONLY THIS JSON (no markdown, no preamble):
{
  "reply": "<your reply — warm, natural, human — in REPLY LANGUAGE>",
  "action": "<none|collect_service|collect_date|collect_time|confirm_booking|do_booking|do_reschedule|do_cancel|set_reminder|show_services|show_location|show_hours|escalate|out_of_scope>",
  "extracted": {
    "service": "<name or null>",
    "date": "<YYYY-MM-DD or null — ${today} for today, ${tomorrow} for tomorrow>",
    "time": "<HH:MM 24hr or null>",
    "confirmed": <true or false>,
    "cancel_scope": "<all|specific|null>",
    "keep_date": "<YYYY-MM-DD or null>",
    "keep_time": "<HH:MM or null>",
    "reminder_preference": "<2hrs|24hrs|null>"
  },
  "preferred_language": "<English|Telugu|Hindi|Tamil|null — only when customer explicitly requests>",
  "language": "<detected language>"
}`
}

function buildSafeFallback({ message, state, biz, services, firstName }) {
  const msg = (message || "").toLowerCase().trim()
  const bizName = biz?.business_name || "us"
  let intent = { primary_intent: "out_of_scope", sentiment: "neutral" }

  if (/^(hi|hello|hey|hii|hai|namaste|నమస్కారం|హలో)\b/i.test(msg))
    intent.primary_intent = "greeting"
  else if (/\b(price|cost|charge|fee|rate|how much|ధర|రేటు|ఎంత)\b/i.test(msg))
    intent.primary_intent = "pricing"
  else if (/\b(book|appointment|slot|schedule|fix|బుక్|అపాయింట్మెంట్)\b/i.test(msg))
    intent.primary_intent = "booking_new"
  else if (/\b(reschedule|change|shift|postpone|మార్చు)\b/i.test(msg))
    intent.primary_intent = "booking_reschedule"
  else if (/\b(cancel|cancle|cancell|రద్దు)\b/i.test(msg))
    intent.primary_intent = "booking_cancel"
  else if (/where (are|is) you|what.*(address|location)|how.*(get|find|reach)/i.test(msg))
    intent.primary_intent = "location_query"
  else if (/what.*(timing|hours|open)|when.*open|working hours/i.test(msg))
    intent.primary_intent = "hours_query"
  else if (/remind|reminder/i.test(msg))
    intent.primary_intent = "reminder_request"
  else if (state?.stage && state.stage !== "idle")
    intent.primary_intent = "booking_new"

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

  // Auto-reset preferred language if customer switches back to English script
  let currentPreferred = state.preferred_language
  if (currentPreferred && currentPreferred !== "English") {
    if (detectedLang === "English" && !/speak|language|english|telugu|hindi/i.test(message)) {
      currentPreferred = null
    }
  }
  const replyLang = currentPreferred || detectedLang

  // ── FRESH BOOKING STATE CLEAR ───────────────────────────────
  // When stage is idle, ALWAYS wipe stale date/time from previous sessions
  if (!state.stage || state.stage === "idle") {
    state = {
      ...state,
      service:           null,
      date:              null,
      time:              null,
      staff:             null,
      missing_fields:    [],
      last_ai_question:  null,
      clarification_for: [],
      confidence:        {},
      preferred_language: currentPreferred || state.preferred_language
    }
  }

  // ── PRE-FILL DATE FROM MESSAGE ──────────────────────────────
  const preFilledDate = preFillDateFromMessage(message, state)
  if (preFilledDate && !state.date) {
    state = { ...state, date: preFilledDate }
  }

  // ── DETECT DATE CORRECTION ──────────────────────────────────
  // If customer is giving a new date during awaiting_confirmation stage
  // clear old date from state so AI picks up the new one
  if (state.stage === "awaiting_confirmation" && isDateCorrection(message)) {
    state = { ...state, date: null, confirmed: false }
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
Business: ${biz?.business_name || "this business"}

Rules:
- If message is unrelated to business (sports, weather, jokes) → action=out_of_scope, reply warmly and redirect
- If service known, no date → action=collect_date
- If service+date known, no time → action=collect_time
- If all collected → action=confirm_booking
- If customer confirmed (yes/ok/sure) → action=${confirmAction}, confirmed=true
- If reschedule_mode + yes → action=do_reschedule, confirmed=true
- If customer says "No book on 28th" → extract date=28th of current month, confirmed=false, action=confirm_booking
- If reminder request → action=set_reminder
- NEVER show raw dates like 2026-04-28 in reply — say "Tuesday, 28 April"
- NEVER use emojis 📅 📆 ⏰ 🎊 in reply

{"reply":"<reply in ${replyLang}>","action":"<action>","extracted":{"service":"<name or null>","date":"<YYYY-MM-DD or null>","time":"<HH:MM or null>","confirmed":<true/false>,"reminder_preference":"<2hrs|24hrs|null>"},"language":"${replyLang}"}`

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

  // Language enforcement
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
    // Always strip bad emojis including 🎊
    decision.reply = stripBadEmojis(decision.reply)
  }

  if (!decision) {
    const fallbackReply = buildSafeFallback({ message, state, biz, services, firstName })
    try { await saveState(conversationId, state) } catch(e) {}
    return fallbackReply
  }

  let newState = Object.assign({}, state)

  // Update preferred language
  if (decision.preferred_language && decision.preferred_language !== "null") {
    newState.preferred_language = decision.preferred_language
  } else if (!currentPreferred && detectedLang !== "English") {
    newState.preferred_language = detectedLang
  }

  const extracted = decision.extracted || {}
  let action = decision.action || "none"

  // Inject pre-filled date if AI didn't extract one
  if (preFilledDate && !extracted.date) {
    extracted.date = preFilledDate
  }

  // Smart negation guard — only pure standalone negations block booking
  // "No please book on 28th" should NOT block — customer is correcting
  if (isNegation(message) && (extracted.confirmed === true || action === "do_booking")) {
    console.warn("⛔ Negation guard fired")
    extracted.confirmed = false
    if (action === "do_booking") action = "confirm_booking"
  }

  // If customer gave a new date during confirmation — clear old state date
  // so the new extracted date takes priority
  if (extracted.date && newState.date && extracted.date !== newState.date) {
    console.warn("📅 Date override: " + newState.date + " → " + extracted.date)
    newState.date = extracted.date
    // If we're in confirmation stage with a new date — go back to confirming
    if (newState.stage === "awaiting_confirmation") {
      extracted.confirmed = false
      action = "confirm_booking"
    }
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

  // ── Execute: Booking ────────────────────────────────────────
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

  // ── Execute: Cancel ─────────────────────────────────────────
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

  // ── Execute: Reschedule ─────────────────────────────────────
  if (action === "do_reschedule") {
    if (newState.date && newState.time && extracted.confirmed === true) {
      try {
        const result = await rescheduleBooking({
          userId, customerPhone: phone,
          date: newState.date, time: newState.time,
          services, serviceName: newState.service,
          language: replyLang
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

  // ── Execute: Set Reminder Preference ───────────────────────
  if (action === "set_reminder" && extracted.reminder_preference) {
    try {
      const { data: nextBooking } = await supabaseAdmin
        .from("bookings")
        .select("id, service, booking_date, booking_time")
        .eq("customer_phone", phone)
        .eq("user_id", userId)
        .in("status", ["confirmed","pending"])
        .gte("booking_date", todayStr())
        .order("booking_date", { ascending: true })
        .limit(1)
        .maybeSingle()

      if (nextBooking) {
        await supabaseAdmin.from("bookings")
          .update({ reminder_preference: extracted.reminder_preference })
          .eq("id", nextBooking.id)
      }
      await saveState(conversationId, newState)
      return reply || "Sure! I'll remind you " + (extracted.reminder_preference === "2hrs" ? "2 hours" : "a day") + " before your appointment. 😊"
    } catch(e) {
      console.error("❌ set_reminder failed:", e.message)
    }
  }

  // ── Out of scope — return AI reply directly ─────────────────
  if (action === "out_of_scope") {
    await saveState(conversationId, newState)
    return reply
  }

  // ── Update stage ────────────────────────────────────────────
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
