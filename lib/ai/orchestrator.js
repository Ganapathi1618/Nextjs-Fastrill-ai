// lib/ai/orchestrator.js — v3.7 PRE-ROUTER ARCHITECTURE
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

// ── Confirm words ──────────────────────────────────────────────
const CONFIRM_WORDS = /^(yes|ok|okay|sure|haan|avunu|sare|confirm|cofirmed|confirmed|proceed)\.?\s*$/i

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

// ── PRE-ROUTER ─────────────────────────────────────────────────
// Runs BEFORE Sarvam. Classifies message into:
// "booking" → send to Sarvam AI
// "greeting" → handle directly, no Sarvam
// "out_of_scope" → handle directly, no Sarvam
function routeIntent(message, state) {
  const m = (message || "").toLowerCase().trim()

  // Non-Latin scripts → always booking flow (Telugu/Hindi customers)
  if (/[\u0C00-\u0C7F]/.test(message)) return "booking"  // Telugu
  if (/[\u0900-\u097F]/.test(message)) return "booking"  // Hindi
  if (/[\u0B80-\u0BFF]/.test(message)) return "booking"  // Tamil
  if (/[\u0C80-\u0CFF]/.test(message)) return "booking"  // Kannada
  if (/[\u0D00-\u0D7F]/.test(message)) return "booking"  // Malayalam

  // If mid-booking flow → always booking regardless of message
  if (state?.stage && state.stage !== "idle") return "booking"

  // Confirmation words mid-flow → booking
  if (CONFIRM_WORDS.test(m)) return "booking"

  // Booking keywords → Sarvam
  if (/\b(book|appointment|slot|schedule|fix|cancel|reschedule|rebook|postpone)\b/i.test(m)) return "booking"
  if (/\b(price|cost|charge|rate|how much|service|services|offer)\b/i.test(m)) return "booking"
  if (/\b(location|address|where|maps|directions|how to reach)\b/i.test(m)) return "booking"
  if (/\b(hours|timing|open|close|when|working)\b/i.test(m)) return "booking"
  if (/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(m)) return "booking"
  if (/\b(remind|reminder|notify|notification)\b/i.test(m)) return "booking"
  if (/\d+(st|nd|rd|th)?\s*(april|may|june|july|august|september|october|november|december|january|february|march)/i.test(m)) return "booking"
  if (/\b(am|pm|morning|evening|afternoon|night)\b/i.test(m)) return "booking"

  // Pure greeting → handle directly
  if (/^(hi|hello|hey|hii|hai|namaste|good morning|good evening|good afternoon|howdy|sup|wassup)[\s!.]*$/i.test(m)) return "greeting"

  // Everything else → out_of_scope
  return "out_of_scope"
}

// ── OUT OF SCOPE REPLIES ────────────────────────────────────────
// Varied, human responses for different out-of-scope categories
// No Sarvam call — instant, zero cost
function buildOutOfScopeReply(message, firstName, bizName) {
  const m = (message || "").toLowerCase().trim()
  const name = firstName || "there"

  // Sports / IPL / Cricket / Football
  if (/\b(ipl|cricket|football|soccer|match|score|team|player|tournament|league|sport|fifa|worldcup|t20|odi|test match)\b/i.test(m))
    return "Ha, wish I was watching too! 😄 I'm busy managing bookings at *" + bizName + "* — need to schedule something?"

  // Weather
  if (/\b(weather|rain|sunny|cloudy|temperature|hot|cold|humidity|forecast|climate)\b/i.test(m))
    return "No idea — I'm indoors all day managing bookings! 😂 Need to book something at *" + bizName + "*?"

  // Jokes
  if (/\b(joke|funny|laugh|comedy|humor|pun|lol|haha)\b/i.test(m))
    return "Why did the customer always come back? Because the service was too good to cancel 😄\n\nCan I book something for you?"

  // Who are you / bot question
  if (/\b(who are you|are you (a )?bot|are you human|are you ai|are you real|what (type|kind) of bot|robot)\b/i.test(m))
    return "I'm the AI receptionist at *" + bizName + "* 😊 I handle bookings, answer questions about our services, and make sure you're taken care of.\n\nWhat can I help you with?"

  // Feelings / emotional
  if (/\b(sad|upset|stressed|tired|depressed|anxious|lonely|bored|bad day|not well|sick|unwell)\b/i.test(m))
    return "Aw, sorry to hear that " + name + " 😔 Sometimes a little self-care helps — want to treat yourself and book something at *" + bizName + "*?"

  // Abusive / frustrated
  if (/\b(fuck|fck|shit|damn|bastard|idiot|stupid|useless|worst|hate|disgusting|crap)\b/i.test(m))
    return "I understand you might be frustrated " + name + " 😔 I'm here to help — what's going on? Let me know how I can make it right."

  // News / politics / current events
  if (/\b(news|politics|government|modi|rahul|bjp|congress|election|vote|minister|president|prime minister)\b/i.test(m))
    return "Ha, that's a bit above my pay grade 😄 I'm just here managing bookings at *" + bizName + "* — can I help you with that?"

  // Math / calculations
  if (/\d+\s*[\+\-\*\/]\s*\d+/i.test(m))
    return "Ha, I'm a receptionist not a calculator 😂 Need to book something at *" + bizName + "*?"

  // Movies / TV / entertainment
  if (/\b(movie|film|series|show|netflix|amazon|hotstar|ott|actor|actress|director|bollywood|hollywood|trailer)\b/i.test(m))
    return "Ooh good taste! 🎬 I'm stuck managing bookings though — need to schedule something at *" + bizName + "*?"

  // Food / recipes
  if (/\b(recipe|food|cook|eat|restaurant|dinner|lunch|breakfast|hungry|taste|dish)\b/i.test(m) && !/\b(book|appointment)\b/i.test(m))
    return "Mmm, now I'm hungry too 😂 I can only help with bookings at *" + bizName + "* though — need to schedule something?"

  // General knowledge / trivia
  if (/\b(who is|what is|when did|where is|explain|tell me about|history of|meaning of|define)\b/i.test(m))
    return "That's a great question — but a bit outside my expertise! 😄 I'm best at bookings and appointments at *" + bizName + "* — can I help with that?"

  // Compliments
  if (/\b(good|great|awesome|amazing|excellent|wonderful|fantastic|love|nice|cool|brilliant)\b/i.test(m) && m.length < 30)
    return "Thank you " + name + "! 😊 That means a lot. Anything I can help you book today?"

  // Thank you
  if (/\b(thank|thanks|thnx|thx|ty|thank you|thankyou|shukriya|dhanyavaad)\b/i.test(m))
    return "You're welcome " + name + "! 😊 Let me know if you need anything else."

  // Bye / leaving
  if (/\b(bye|goodbye|see you|cya|later|take care|ok bye|good night|goodnight)\b/i.test(m))
    return "Take care " + name + "! 😊 See you soon at *" + bizName + "*. Feel free to message anytime!"

  // Random / unclear
  return "I'm the receptionist at *" + bizName + "* 😊 I'm best at bookings, pricing, and appointment questions — can I help you with any of those?"
}

function preFillDateFromMessage(message, state) {
  if (state.date) return null
  const m = (message || "").toLowerCase().trim()
  if (/\btoday\b/.test(m) || /\baaj\b/.test(m) || /\bee roju\b/.test(m)) return todayStr()
  if (/\btomorrow\b/.test(m) || /\bkal\b/.test(m) || /\breyyi\b/.test(m) || /\bnale\b/.test(m)) return tomorrowStr()
  return null
}

// Smart negation — only pure standalone negations
const PURE_NEGATION_PATTERN = /^(no|nahi|nope|vaddu|vaddhu|don't|dont|wait|hold|stop|not now|cancel it)\.?\s*$/i
function isNegation(message) {
  return PURE_NEGATION_PATTERN.test((message || "").trim())
}

// Date correction detection
function isDateCorrection(message) {
  return /\b(no|nahi|vaddu)\b.*\b(\d{1,2}(st|nd|rd|th)?)\b/i.test(message) ||
         /\bmake it\s+\d/i.test(message) ||
         /\bchange.*\d{1,2}(st|nd|rd|th)?\b/i.test(message)
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

function buildMasterPrompt({ message, biz, services, history, state, firstName, activeBookings, detectedLanguage, preFilledDate }) {
  const bizName = biz?.business_name || "this business"
  const bizType = biz?.business_type || "business"
  const svcList = services.map(s =>
    s.name + " ₹" + s.price +
    (s.duration    ? " " + s.duration + "min" : "") +
    (s.description ? " (" + s.description + ")" : "")
  ).join("\n") || "no services configured"

  // Only booking-relevant history — no out-of-scope noise
  const historyText = (history || []).slice(-6).map(m =>
    (m.role === "user" ? "Customer" : "You") + ": " + m.content
  ).join("\n")

  const stateLines = []
  if (state.service) stateLines.push("Already have service: " + state.service)
  if (state.date)    stateLines.push("Already have date: " + state.date + " — DO NOT ask for date again")
  else if (preFilledDate) stateLines.push("Date resolved: " + preFilledDate + " — USE THIS as extracted.date")
  if (state.time)    stateLines.push("Already have time: " + state.time + " — DO NOT ask for time again")
  if (state.stage && state.stage !== "idle") stateLines.push("Current stage: " + state.stage)
  if (state.preferred_language) stateLines.push("⚠️ MUST reply in " + state.preferred_language)
  if (state.last_booking && (Date.now() - state.last_booking.confirmed_at) < 5 * 60 * 1000) {
    stateLines.push("Just confirmed booking: " + state.last_booking.service + " on " + state.last_booking.date + (state.last_booking.time ? " at " + state.last_booking.time : ""))
  }
  const stateText = stateLines.length ? stateLines.join("\n") : "Fresh conversation"

  const langOverride = state.preferred_language
    ? `⚠️ REPLY LANGUAGE: ${state.preferred_language} — customer explicitly requested. Do NOT use any other language.`
    : `⚠️ REPLY LANGUAGE: ${detectedLanguage} — detected from script. Do NOT use any other language.`

  const today    = todayStr()
  const tomorrow = tomorrowStr()
  const month    = currentMonth()

  return `${langOverride}

You are an AI receptionist for *${bizName}* (${bizType}).
You are warm, witty, emotionally intelligent. Short natural replies like WhatsApp messages.

CURRENT DATE (IST):
Today     = ${today} (${todayFormatted()})
Tomorrow  = ${tomorrow}
This month = ${month} ${new Date().getFullYear()}

DATE RESOLUTION (CRITICAL):
- "today" / "aaj" / "ee roju"           → extracted.date = "${today}"
- "tomorrow" / "kal" / "nale"           → extracted.date = "${tomorrow}"
- "28th" / "25th" with NO month         → assume ${month}, if passed use next month
- Day names like "Monday"               → find next occurrence
- Customer gives NEW date during confirmation → OVERRIDE state date with new date, confirmed=false
- NEVER ask "which month?" — always resolve automatically
- If date in BOOKING STATE → do NOT ask again

CRITICAL DATE OVERRIDE:
- If customer message contains a specific date (28th, 28 April etc) → ALWAYS use that date
- "No please book on 28th" = customer wants 28th → extract date, set confirmed=false, ask to confirm new date
- Do NOT treat "No book on 28th" as cancellation

SERVICES:
${svcList}

BUSINESS INFO:
${biz?.working_hours ? "Hours: " + biz.working_hours : ""}
${biz?.location      ? "Location: " + biz.location : ""}
${biz?.maps_link     ? "Maps: " + biz.maps_link : ""}
${biz?.ai_instructions ? "Instructions: " + biz.ai_instructions : ""}

RECENT CONVERSATION:
${historyText || "(new conversation)"}

BOOKING STATE:
${stateText}

ACTIVE BOOKINGS:
${activeBookings || "none"}

CUSTOMER: ${firstName}
MESSAGE: "${message}"

LANGUAGE:
- Telugu script → reply in Telugu
- Hindi script → reply in Hindi
- Latin script → reply in ENGLISH
- Match customer tone — casual if casual, warm if upset

CONFIRMATION vs NEGATION:
- confirmed=true: yes, ok, sure, haan, avunu, sare, confirm, proceed
- Pure negation (standalone "no"/"nahi"/"vaddu") → confirmed=false
- "No book on 28th" = NOT negation → extract new date, confirmed=false

BOOKING:
- Collect service → date → time → confirm → do_booking
- ONE question at a time
- Never book without explicit yes/ok/sure

TIME:
- "2","3"..."8" = PM (outside business hours if AM)
- "9"=09:00, "10"/"11"/"12"=AM, "1"=13:00
- Always 24hr in extracted.time, show "2 PM" in reply
- Never ask AM/PM

RESCHEDULE: collect_date → collect_time → confirm_booking → do_reschedule
CANCEL: "cancel everything" → cancel_scope=all, "cancel [specific]" → cancel_scope=specific
REMINDER: "remind me 2hrs before" → action=set_reminder, reminder_preference="2hrs"

REPLY FORMAT:
- NEVER show raw dates like "2026-04-28" — say "Tuesday, 28 April"
- NEVER show raw times like "20:00" — say "8 PM"  
- NEVER use: 📅 📆 ⏰ 🔔 🎊
- Allowed: ✅ 😊 👋 🙏 😄 😔 😂 ✓
- 1-3 lines max
- Never list services unless asked

RESPOND WITH ONLY THIS JSON:
{
  "reply": "<warm natural reply in REPLY LANGUAGE>",
  "action": "<none|collect_service|collect_date|collect_time|confirm_booking|do_booking|do_reschedule|do_cancel|set_reminder|show_services|show_location|show_hours|escalate>",
  "extracted": {
    "service": "<name or null>",
    "date": "<YYYY-MM-DD or null>",
    "time": "<HH:MM 24hr or null>",
    "confirmed": <true or false>,
    "cancel_scope": "<all|specific|null>",
    "keep_date": "<YYYY-MM-DD or null>",
    "keep_time": "<HH:MM or null>",
    "reminder_preference": "<2hrs|24hrs|null>"
  },
  "preferred_language": "<English|Telugu|Hindi|Tamil|null>",
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
  else if (/remind|reminder/i.test(msg))                                           intent.primary_intent = "reminder_request"
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
  const bizName   = biz?.business_name || "us"

  if (isMediaOnly) {
    return "Thanks for sharing! 😊 If you have any questions or want to book, just type here."
  }

  // ── LANGUAGE DETECTION ──────────────────────────────────────
  const detectedLang = detectLanguage(message)
  let currentPreferred = state.preferred_language
  if (currentPreferred && currentPreferred !== "English") {
    if (detectedLang === "English" && !/speak|language|english|telugu|hindi/i.test(message)) {
      currentPreferred = null
    }
  }
  const replyLang = currentPreferred || detectedLang

  // ── PRE-ROUTER ──────────────────────────────────────────────
  // Handle greetings and out-of-scope WITHOUT calling Sarvam
  const routedIntent = routeIntent(message, state)

  if (routedIntent === "greeting") {
    const svcPrev = services.slice(0, 3).map(s => s.name).join(", ")
    return "Hi " + firstName + "! 👋 Welcome to *" + bizName + "*!" +
      (svcPrev ? "\n\nWe offer: " + svcPrev + " and more." : "") +
      "\n\nHow can I help you today? 😊"
  }

  if (routedIntent === "out_of_scope") {
    return buildOutOfScopeReply(message, firstName, bizName)
  }

  // ── FRESH BOOKING STATE CLEAR ───────────────────────────────
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

  // ── PRE-FILL DATE ───────────────────────────────────────────
  const preFilledDate = preFillDateFromMessage(message, state)
  if (preFilledDate && !state.date) {
    state = { ...state, date: preFilledDate }
  }

  // ── DATE CORRECTION DURING CONFIRMATION ────────────────────
  if (
    state.stage === "awaiting_confirmation" &&
    isDateCorrection(message) &&
    !CONFIRM_WORDS.test((message || "").trim())
  ) {
    state = { ...state, date: null, confirmed: false }
  }

  // ── SARVAM AI CALL ──────────────────────────────────────────
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
- confirmed (yes/ok/sure) → action=${confirmAction}, confirmed=true
- reschedule_mode + yes → action=do_reschedule, confirmed=true
- "No book on 28th" → extract date, confirmed=false, action=confirm_booking
- reminder request → action=set_reminder
- NEVER show raw dates like 2026-04-28 — say "Tuesday, 28 April"
- NEVER use 📅 📆 ⏰ 🎊

{"reply":"<reply in ${replyLang}>","action":"<action>","extracted":{"service":"<or null>","date":"<YYYY-MM-DD or null>","time":"<HH:MM or null>","confirmed":<true/false>,"reminder_preference":"<2hrs|24hrs|null>"},"language":"${replyLang}"}`

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
      console.warn("⚠️ Wrong language — translating to English")
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

  // Inject pre-filled date
  if (preFilledDate && !extracted.date) {
    extracted.date = preFilledDate
  }

  // Date override — if AI extracted a different date than state, new date wins
  if (extracted.date && newState.date && extracted.date !== newState.date) {
    console.warn("📅 Date override: " + newState.date + " → " + extracted.date)
    newState.date = extracted.date
    if (newState.stage === "awaiting_confirmation") {
      extracted.confirmed = false
      action = "confirm_booking"
    }
  }

  // Smart negation guard — pure standalone negations only
  if (isNegation(message) && (extracted.confirmed === true || action === "do_booking")) {
    console.warn("⛔ Negation guard fired")
    extracted.confirmed = false
    if (action === "do_booking") action = "confirm_booking"
  }

  // Reschedule confirmation override
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
            // Save last booking context for 5 mins so AI can reference it
            newState.last_booking = {
              service:      result.booking.service,
              date:         result.booking.booking_date,
              time:         result.booking.booking_time,
              confirmed_at: Date.now()
            }
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

  // ── Execute: Set Reminder ───────────────────────────────────
  if (action === "set_reminder" && extracted.reminder_preference) {
    try {
      const { data: nextBooking } = await supabaseAdmin
        .from("bookings")
        .select("id")
        .eq("customer_phone", phone)
        .eq("user_id", userId)
        .in("status", ["confirmed","pending"])
        .gte("booking_date", todayStr())
        .order("booking_date", { ascending: true })
        .limit(1).maybeSingle()

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
