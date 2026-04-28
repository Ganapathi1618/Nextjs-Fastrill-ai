// lib/ai/orchestrator.js — v3.8 EXTRACTION-ONLY ARCHITECTURE
const { getFallbackReply }  = require("./fallback-engine")
const { loadContext }       = require("../memory/context-engine")
const { loadState, saveState, clearBookingFields } = require("../memory/state-engine")
const { createBooking, rescheduleBooking } = require("../booking/booking-engine")
const { matchService, isTimeBased }        = require("../booking/slot-engine")
const { formatDate, formatTime, normalizeTime } = require("../booking/calendar-engine")
const { createClient } = require("@supabase/supabase-js")

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const SARVAM_TIMEOUT_MS  = 15000
const SARVAM_MAX_RETRIES = 2

const CONFIRM_WORDS = /^(yes|ok|okay|sure|haan|avunu|sare|confirm|cofirmed|confirmed|proceed)\.?\s*$/i
const PURE_NEGATION = /^(no|nahi|nope|vaddu|vaddhu|don't|dont|wait|hold|stop|not now|cancel it)\.?\s*$/i

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

// ── MULTILINGUAL REPLY BUILDER ─────────────────────────────────
// Our code builds ALL display text — never trust Sarvam for dates/times
function t(en, te, hi, lang) {
  if (lang === "Telugu" && te) return te
  if (lang === "Hindi"  && hi) return hi
  return en
}

function buildReply(action, state, services, biz, firstName, lang, extracted) {
  const name    = firstName || "there"
  const bizName = biz?.business_name || "us"
  const svc     = state.service || extracted?.service
  const date    = state.date    || extracted?.date
  const time    = state.time    || extracted?.time

  const displayDate = date ? formatDate(date) : null
  const displayTime = time ? formatTime(normalizeTime(time)) : null
  const svcList     = (services || []).slice(0, 5).map(s =>
    "• *" + s.name + "* — ₹" + s.price + (s.duration ? " (" + s.duration + " min)" : "")
  ).join("\n")

  switch(action) {
    case "collect_service":
      return t(
        "Which service would you like to book? 😊\n\n" + svcList,
        "మీకు ఏ సేవ కావాలి? 😊\n\n" + svcList,
        "कौन सी सेवा चाहिए? 😊\n\n" + svcList,
        lang
      )

    case "collect_date":
      return t(
        "What date works for your *" + svc + "*?",
        "*" + svc + "* కోసం తేదీ చెప్పండి?",
        "*" + svc + "* के लिए तारीख बताइए?",
        lang
      )

    case "collect_time":
      return t(
        "What time works for you on " + (displayDate || date) + "?",
        (displayDate || date) + "న ఏ సమయం కావాలి?",
        (displayDate || date) + " को कौन सा समय?",
        lang
      )

    case "confirm_booking":
      if (svc && displayDate) {
        const timepart = displayTime ? " at " + displayTime : ""
        const timepartTe = displayTime ? " " + displayTime + "కి" : ""
        const timepartHi = displayTime ? " " + displayTime + " को" : ""
        return t(
          "Shall I confirm *" + svc + "* on " + displayDate + timepart + "? ✅",
          "*" + svc + "* " + displayDate + timepartTe + " బుక్ చేయమా? ✅",
          "*" + svc + "* " + displayDate + timepartHi + " बुक करें? ✅",
          lang
        )
      }
      return null // fall through to Sarvam reply

    case "show_services":
      return t(
        "*" + bizName + " Services*\n\n" + svcList + "\n\nWant to book any? 😊",
        "*" + bizName + " సేవలు*\n\n" + svcList + "\n\nబుక్ చేయాలా? 😊",
        "*" + bizName + " सेवाएं*\n\n" + svcList + "\n\nबुक करना चाहते हैं? 😊",
        lang
      )

    case "show_location":
      if (biz?.location) {
        let msg = t("📍 *" + bizName + "*\n", "📍 *" + bizName + "*\n", "📍 *" + bizName + "*\n", lang)
        msg += biz.location
        if (biz.maps_link) msg += "\n\n" + biz.maps_link
        return msg
      }
      return null

    case "show_hours":
      if (biz?.working_hours) {
        return t(
          "*" + bizName + "* is open:\n\n" + biz.working_hours + "\n\nAnything else? 😊",
          "*" + bizName + "* తెరిచి ఉంటుంది:\n\n" + biz.working_hours + "\n\nఇంకేమైనా? 😊",
          "*" + bizName + "* खुला है:\n\n" + biz.working_hours + "\n\nकुछ और? 😊",
          lang
        )
      }
      return null

    default:
      return null // Sarvam reply used for none/escalate/etc
  }
}

// ── PRE-ROUTER ─────────────────────────────────────────────────
function routeIntent(message, state) {
  const m = (message || "").toLowerCase().trim()

  // Non-Latin scripts → always booking
  if (/[\u0C00-\u0C7F\u0900-\u097F\u0B80-\u0BFF\u0C80-\u0CFF\u0D00-\u0D7F]/.test(message)) return "booking"

  // Mid-flow → always booking
  if (state?.stage && state.stage !== "idle") return "booking"

  // Confirmation → booking
  if (CONFIRM_WORDS.test(m)) return "booking"

  // Booking keywords
  if (/\b(book|appointment|slot|schedule|fix|cancel|reschedule|rebook|postpone)\b/i.test(m)) return "booking"
  if (/\b(price|pricing|cost|charge|rate|how much|service|services|offer|package)\b/i.test(m)) return "booking"
  if (/\b(location|address|where|maps|directions|how to reach|find you)\b/i.test(m)) return "booking"
  if (/\b(hours|timing|open|close|when|working|available)\b/i.test(m)) return "booking"
  if (/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(m)) return "booking"
  if (/\b(remind|reminder|notify|notification|alert)\b/i.test(m)) return "booking"
  if (/\b(am|pm|morning|evening|afternoon|night|noon)\b/i.test(m)) return "booking"
  if (/\d+(st|nd|rd|th)?\s*(april|may|june|july|august|september|october|november|december|january|february|march)/i.test(m)) return "booking"
  if (/\b\d{1,2}\s*(am|pm)\b/i.test(m)) return "booking"

  // Pure greeting
  if (/^(hi|hello|hey|hii|hai|namaste|good morning|good evening|good afternoon|howdy|sup|wassup)[\s!.]*$/i.test(m)) return "greeting"

  // Everything else
  return "out_of_scope"
}

// ── OUT OF SCOPE REPLIES ────────────────────────────────────────
function buildOutOfScopeReply(message, firstName, bizName) {
  const m   = (message || "").toLowerCase().trim()
  const name = firstName || "there"

  if (/\b(ipl|cricket|football|soccer|match|score|team|player|tournament|league|sport|fifa|worldcup|t20|odi)\b/i.test(m))
    return "Ha, wish I was watching too! 😄 I'm busy managing bookings at *" + bizName + "* — need to schedule something?"

  if (/\b(weather|rain|sunny|cloudy|temperature|hot|cold|humidity|forecast)\b/i.test(m))
    return "No idea — I'm indoors all day! 😂 Need to book something at *" + bizName + "*?"

  if (/\b(joke|funny|laugh|comedy|humor|lol|haha)\b/i.test(m))
    return "Why did the customer always come back? Because the service was too good to cancel 😄\n\nCan I book something for you?"

  if (/\b(who are you|are you (a )?bot|are you human|are you ai|are you real|what (type|kind) of bot|robot)\b/i.test(m))
    return "I'm the AI receptionist at *" + bizName + "* 😊 I handle bookings and answer questions about our services.\n\nWhat can I help you with?"

  if (/\b(sad|upset|stressed|tired|depressed|anxious|lonely|bored|bad day|not well|sick)\b/i.test(m))
    return "Aw, sorry to hear that " + name + " 😔 Sometimes a little self-care helps — want to treat yourself and book something?"

  if (/\b(fuck|fck|shit|damn|bastard|idiot|stupid|useless|worst|hate)\b/i.test(m))
    return "I understand you might be frustrated " + name + " 😔 I'm here to help — what's going on?"

  if (/\b(news|politics|government|modi|rahul|bjp|congress|election|vote|minister|president)\b/i.test(m))
    return "Ha, that's above my pay grade 😄 I'm just here for bookings at *" + bizName + "* — can I help?"

  if (/\b(math|maths|calculate|calculation|calculator|algebra|arithmetic)\b/i.test(m) || /\d+\s*[\+\-\*\/]\s*\d+/.test(m))
    return "Ha, I'm a receptionist not a calculator 😂 Need to book something at *" + bizName + "*?"

  if (/\b(movie|film|series|show|netflix|amazon|hotstar|ott|actor|actress|bollywood|hollywood)\b/i.test(m))
    return "Ooh good taste! 🎬 I'm stuck managing bookings though — need to schedule something?"

  if (/\b(recipe|food|cook|eat|hungry|taste|dish)\b/i.test(m) && !/\b(book|appointment)\b/i.test(m))
    return "Mmm, now I'm hungry too 😂 I can only help with bookings at *" + bizName + "* though!"

  if (/\b(who is|what is|when did|where is|explain|tell me about|history of|meaning of|define)\b/i.test(m))
    return "Great question — but a bit outside my expertise! 😄 I'm best at bookings at *" + bizName + "* — can I help?"

  if (/^(thank|thanks|thnx|thx|ty|thank you|thankyou|shukriya|dhanyavaad)[\s!.]*$/i.test(m))
    return "You're welcome " + name + "! 😊 Let me know if you need anything else."

  if (/^(bye|goodbye|see you|cya|later|take care|good night|goodnight)[\s!.]*$/i.test(m))
    return "Take care " + name + "! 😊 See you soon at *" + bizName + "*!"

  if (/^(good|great|awesome|amazing|excellent|wonderful|nice|cool|brilliant)[\s!.]*$/i.test(m))
    return "Thank you " + name + "! 😊 Anything I can help you book today?"

  // Default — varied so it doesn't repeat
  const defaults = [
    "I'm the receptionist at *" + bizName + "* 😊 Best at bookings and appointments — can I help?",
    "That's a bit outside my area! 😄 I handle bookings at *" + bizName + "* — need to schedule something?",
    "Hmm, not sure about that one! 😊 But I'm great at bookings — want to schedule something at *" + bizName + "*?",
  ]
  return defaults[Math.floor(Math.random() * defaults.length)]
}

function preFillDateFromMessage(message, state) {
  if (state.date) return null
  const m = (message || "").toLowerCase().trim()
  if (/\btoday\b/.test(m) || /\baaj\b/.test(m) || /\bee roju\b/.test(m)) return todayStr()
  if (/\btomorrow\b/.test(m) || /\bkal\b/.test(m) || /\breyyi\b/.test(m) || /\bnale\b/.test(m)) return tomorrowStr()
  return null
}

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

// ── EXTRACTION-ONLY PROMPT ─────────────────────────────────────
// Sarvam only extracts structured data — our code builds all reply text
// This eliminates wrong dates, wrong day names, wrong confirmation text
function buildExtractionPrompt({ message, services, history, state, firstName, activeBookings }) {
  const svcNames = services.map(s => s.name + " (" + s.price + ")").join(", ") || "no services"
  const historyText = (history || []).slice(-4).map(m =>
    (m.role === "user" ? "C" : "A") + ": " + m.content.substring(0, 100)
  ).join("\n")

  const stateText = [
    state.service ? "service=" + state.service : "",
    state.date    ? "date=" + state.date : "",
    state.time    ? "time=" + state.time : "",
    state.stage   ? "stage=" + state.stage : ""
  ].filter(Boolean).join(", ") || "fresh"

  const today    = todayStr()
  const tomorrow = tomorrowStr()
  const month    = currentMonth()

  return `You are a booking data extractor. Extract ONLY structured data from customer message.
Reply with ONLY valid JSON. No explanation. No markdown.

TODAY = ${today} (${todayFormatted()})
TOMORROW = ${tomorrow}
CURRENT MONTH = ${month}

SERVICES: ${svcNames}
ACTIVE BOOKINGS: ${activeBookings || "none"}
RECENT HISTORY:
${historyText || "none"}
CURRENT STATE: ${stateText}
CUSTOMER NAME: ${firstName}
CUSTOMER MESSAGE: "${message}"

DATE RULES:
- "today"/"aaj"/"ee roju" → "${today}"
- "tomorrow"/"kal"/"nale" → "${tomorrow}"
- "28th"/"1st" with no month → nearest future date in ${month}
- "No book on 28th" → date=28th of ${month}, confirmed=false
- If customer gives NEW date different from state date → use the NEW date

ACTION RULES:
- Customer names a service, no date in state → collect_date
- Service+date known, no time → collect_time
- Service+date+time all known → confirm_booking
- Customer says yes/ok/sure/confirm/avunu/haan + stage=awaiting_confirmation → do_booking, confirmed=true
- Customer says yes/ok/sure + stage=reschedule_mode → do_reschedule, confirmed=true
- Cancel request → do_cancel
- Reschedule request → collect_date (for new date)
- Reminder request → set_reminder
- Pricing/services question → show_services
- Location question → show_location
- Hours question → show_hours
- "No book on 28th" or date correction → confirm_booking, confirmed=false, extract new date
- Unclear/general → none

RESPOND WITH ONLY THIS JSON:
{
  "action": "<none|collect_service|collect_date|collect_time|confirm_booking|do_booking|do_reschedule|do_cancel|set_reminder|show_services|show_location|show_hours|escalate>",
  "extracted": {
    "service": "<exact service name from list or null>",
    "date": "<YYYY-MM-DD or null>",
    "time": "<HH:MM 24hr or null>",
    "confirmed": <true or false>,
    "cancel_scope": "<all|specific|null>",
    "keep_date": "<YYYY-MM-DD or null>",
    "keep_time": "<HH:MM or null>",
    "reminder_preference": "<2hrs|24hrs|null>"
  },
  "preferred_language": "<English|Telugu|Hindi|Tamil|null — only if customer explicitly requests>",
  "sentiment": "<happy|neutral|frustrated|upset>"
}`
}

function buildSafeFallback({ message, state, biz, services, firstName }) {
  const msg = (message || "").toLowerCase().trim()
  let intent = { primary_intent: "out_of_scope", sentiment: "neutral" }
  if (/^(hi|hello|hey|hii|hai|namaste|నమస్కారం|హలో)\b/i.test(msg))              intent.primary_intent = "greeting"
  else if (/\b(price|pricing|cost|charge|fee|rate|how much)\b/i.test(msg))       intent.primary_intent = "pricing"
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
  const routedIntent = routeIntent(message, state)

  if (routedIntent === "greeting") {
    const svcPrev = services.slice(0, 3).map(s => s.name).join(", ")
    return t(
      "Hi " + firstName + "! 👋 Welcome to *" + bizName + "*!" + (svcPrev ? "\n\nWe offer: " + svcPrev + " and more." : "") + "\n\nHow can I help you today? 😊",
      "నమస్కారం " + firstName + "! 👋 *" + bizName + "*కి స్వాగతం!" + (svcPrev ? "\n\nమేము అందిస్తున్నాము: " + svcPrev + "." : "") + "\n\nమీకు ఎలా సహాయం చేయగలను? 😊",
      "नमस्ते " + firstName + "! 👋 *" + bizName + "* में आपका स्वागत है!" + (svcPrev ? "\n\nहम देते हैं: " + svcPrev + "।" : "") + "\n\nमैं आपकी कैसे मदद कर सकता हूं? 😊",
      replyLang
    )
  }

  if (routedIntent === "out_of_scope") {
    return buildOutOfScopeReply(message, firstName, bizName)
  }

  // ── FRESH STATE CLEAR ───────────────────────────────────────
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

  // ── DATE CORRECTION ─────────────────────────────────────────
  if (
    state.stage === "awaiting_confirmation" &&
    isDateCorrection(message) &&
    !CONFIRM_WORDS.test((message || "").trim())
  ) {
    state = { ...state, date: null, confirmed: false }
  }

  // ── SARVAM EXTRACTION ONLY ──────────────────────────────────
  let decision = null

  if (process.env.SARVAM_API_KEY) {
    const raw = await callSarvamWithRetry({
      model:       "sarvam-m",
      messages:    [{ role: "user", content: buildExtractionPrompt({ message, services, history, state, firstName, activeBookings }) }],
      max_tokens:  400,
      temperature: 0.1
    })

    if (raw) {
      decision = parseAIDecision(raw)
      if (!decision) {
        console.warn("⚠️ Extraction unparseable — using rule-based fallback")
      }
    } else {
      console.warn("⚠️ Sarvam null — using rule-based fallback")
    }
  }

  // ── RULE-BASED FALLBACK EXTRACTION ─────────────────────────
  // If Sarvam fails, extract from message using rules
  if (!decision) {
    decision = ruleBasedExtraction(message, state, services)
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

  // Date override — new date always wins over stale state date
  if (extracted.date && newState.date && extracted.date !== newState.date) {
    console.warn("📅 Date override: " + newState.date + " → " + extracted.date)
    newState.date = extracted.date
    if (newState.stage === "awaiting_confirmation") {
      extracted.confirmed = false
      action = "confirm_booking"
    }
  }

  // Smart negation guard
  if (PURE_NEGATION.test((message || "").trim()) && (extracted.confirmed === true || action === "do_booking")) {
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
    newState.time = normalizeTime(extracted.time) || extracted.time
  }

  // ── BUILD REPLY FROM OUR CODE (not Sarvam) ──────────────────
  // This is the key change — we build all display text ourselves
  // No more wrong dates, wrong day names from Sarvam
  let reply = buildReply(action, newState, services, biz, firstName, replyLang, extracted)

  // For actions where we don't have a template (none, escalate etc)
  // use a sensible default based on sentiment
  if (!reply) {
    const sentiment = decision.sentiment || "neutral"
    if (sentiment === "frustrated" || sentiment === "upset") {
      reply = t(
        "I understand " + firstName + " 😔 Let me help you right away. What would you like to do?",
        "అర్థమైంది " + firstName + " 😔 వెంటనే సహాయం చేస్తాను. ఏమి కావాలి?",
        "समझ गया " + firstName + " 😔 अभी मदद करता हूं। क्या चाहिए?",
        replyLang
      )
    } else {
      reply = t(
        "How can I help you with your booking at *" + bizName + "*? 😊",
        "*" + bizName + "*లో బుకింగ్‌కు ఎలా సహాయం చేయగలను? 😊",
        "*" + bizName + "* में बुकिंग के लिए कैसे मदद करूं? 😊",
        replyLang
      )
    }
  }

  reply = stripBadEmojis(reply)

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
      return t(
        "Your booking has been cancelled 😊 Let me know if you'd like to rebook!",
        "మీ బుకింగ్ రద్దు చేయబడింది 😊 మళ్ళీ బుక్ చేయాలంటే చెప్పండి!",
        "आपकी बुकिंग रद्द हो गई 😊 दोबारा बुक करना हो तो बताइए!",
        replyLang
      )
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
        .from("bookings").select("id")
        .eq("customer_phone", phone).eq("user_id", userId)
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
      return t(
        "Sure! I'll remind you " + (extracted.reminder_preference === "2hrs" ? "2 hours" : "a day") + " before your appointment. 😊",
        "తప్పకుండా! మీ అపాయింట్మెంట్‌కి " + (extracted.reminder_preference === "2hrs" ? "2 గంటల" : "ఒక రోజు") + " ముందు రిమైండర్ పంపిస్తాను. 😊",
        "जरूर! आपकी appointment से " + (extracted.reminder_preference === "2hrs" ? "2 घंटे" : "एक दिन") + " पहले reminder भेजूंगा। 😊",
        replyLang
      )
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

// ── RULE-BASED EXTRACTION FALLBACK ─────────────────────────────
// Used when Sarvam fails — extracts intent from message using rules
function ruleBasedExtraction(message, state, services) {
  const m = (message || "").toLowerCase().trim()
  let action = "none"
  const extracted = {
    service: null, date: null, time: null,
    confirmed: false, cancel_scope: null,
    keep_date: null, keep_time: null,
    reminder_preference: null
  }

  // Confirmation
  if (CONFIRM_WORDS.test(m)) {
    extracted.confirmed = true
    if (state.stage === "reschedule_mode") action = "do_reschedule"
    else if (state.stage === "awaiting_confirmation") action = "do_booking"
    else action = "confirm_booking"
  }
  // Cancel
  else if (/\b(cancel|cancle|cancell|రద్దు)\b/i.test(m)) {
    action = "do_cancel"
    extracted.cancel_scope = /everything|all|sab|అన్నీ/i.test(m) ? "all" : "specific"
  }
  // Reschedule
  else if (/\b(reschedule|change|postpone|మార్చు)\b/i.test(m)) {
    action = "collect_date"
  }
  // Service match
  else if (services?.length) {
    for (const svc of services) {
      if (m.includes(svc.name.toLowerCase())) {
        extracted.service = svc.name
        action = state.date ? (state.time ? "confirm_booking" : "collect_time") : "collect_date"
        break
      }
    }
  }
  // Pricing
  else if (/\b(price|pricing|cost|charge|rate|how much)\b/i.test(m)) {
    action = "show_services"
  }
  // Location
  else if (/\b(location|address|where|maps)\b/i.test(m)) {
    action = "show_location"
  }
  // Hours
  else if (/\b(hours|timing|open|when)\b/i.test(m)) {
    action = "show_hours"
  }
  // Mid-flow continuation
  else if (state.stage === "awaiting_service") action = "collect_service"
  else if (state.stage === "awaiting_date")    action = "collect_date"
  else if (state.stage === "awaiting_time")    action = "collect_time"

  return { action, extracted, sentiment: "neutral" }
}

module.exports = { orchestrate }
