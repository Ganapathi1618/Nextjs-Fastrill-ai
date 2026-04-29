// lib/ai/orchestrator.js — v3.9 PERMANENT ARCHITECTURE
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
function todayStr() { return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) }
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

function t(en, te, hi, lang) {
  if (lang === "Telugu" && te) return te
  if (lang === "Hindi"  && hi) return hi
  return en
}

// ── PRE-ROUTER — WHITELIST ONLY ────────────────────────────────
// Only handles 100% certain patterns instantly
// Everything else goes to Sarvam — no guessing
function routeIntent(message) {
  const m = (message || "").toLowerCase().trim()

  // Pure greetings — no ambiguity
  if (/^(hi|hello|hey|hii|hai|namaste|good morning|good evening|good afternoon|howdy|sup|wassup)[\s!.]*$/i.test(m))
    return "greeting"

  // Pure thanks
  if (/^(thank|thanks|thnx|thx|ty|thank you|thankyou|shukriya|dhanyavaad)[\s!.]*$/i.test(m))
    return "thanks"

  // Pure bye
  if (/^(bye|goodbye|see you|cya|later|take care|good night|goodnight)[\s!.]*$/i.test(m))
    return "bye"

  // Pure compliment
  if (/^(good|great|awesome|amazing|excellent|wonderful|nice|cool|brilliant|perfect|superb)[\s!.]*$/i.test(m))
    return "compliment"

  // 100% certain out-of-scope — specific domains with no overlap with booking
  if (/\b(ipl|cricket|football|soccer|fifa|worldcup|t20|odi|test match)\b/i.test(m) && !/\b(book|cancel|reschedule)\b/i.test(m))
    return "out_of_scope_sports"

  if (/\b(weather|rainfall|temperature|forecast|humidity|climate)\b/i.test(m))
    return "out_of_scope_weather"

  if (/\b(tell me a joke|crack a joke|say something funny)\b/i.test(m))
    return "out_of_scope_joke"

  if (/\b(who is modi|who is rahul|bjp|congress|politics|election|prime minister|president of india)\b/i.test(m))
    return "out_of_scope_politics"

  if (/\b(fuck|fck|shit|bastard|idiot|stupid|useless|worst|hate you)\b/i.test(m))
    return "out_of_scope_abuse"

  // Everything else — booking, pricing, services, questions, my bookings, ai automation?, etc
  // ALL go to Sarvam for proper extraction
  return "sarvam"
}

// ── OUT OF SCOPE REPLIES ────────────────────────────────────────
function buildOutOfScopeReply(type, message, firstName, bizName) {
  const name = firstName || "there"
  const m    = (message || "").toLowerCase()

  switch(type) {
    case "greeting": {
      return null // handled separately with services list
    }
    case "thanks":
      return "You're welcome " + name + "! 😊 Let me know if you need anything else."

    case "bye":
      return "Take care " + name + "! 😊 See you soon at *" + bizName + "*!"

    case "compliment":
      return "Thank you " + name + "! 😊 Anything I can help you book today?"

    case "out_of_scope_sports":
      return "Ha, wish I was watching too! 😄 I'm managing bookings at *" + bizName + "* — need to schedule something?"

    case "out_of_scope_weather":
      return "No idea — I'm indoors all day! 😂 Need to book something at *" + bizName + "*?"

    case "out_of_scope_joke":
      return "Why did the customer always come back? Because the service was too good to cancel 😄\n\nCan I book something for you?"

    case "out_of_scope_politics":
      return "Ha, that's above my pay grade 😄 I'm just here for bookings at *" + bizName + "* — can I help?"

    case "out_of_scope_abuse":
      return "I understand you might be frustrated " + name + " 😔 I'm here to help — what's going on?"

    default:
      return null
  }
}

// ── REPLY BUILDER — OUR CODE BUILDS ALL DISPLAY TEXT ───────────
function buildReply(action, state, services, biz, firstName, lang, extracted, activeBookings) {
  const name    = firstName || "there"
  const bizName = biz?.business_name || "us"
  const svc     = state.service || extracted?.service
  const date    = state.date    || extracted?.date
  const time    = state.time    || extracted?.time

  const displayDate = date ? formatDate(date) : null
  const displayTime = time ? formatTime(normalizeTime(time)) : null
  const svcList     = (services || []).slice(0, 6).map(s =>
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
        const tp   = displayTime ? " at " + displayTime : ""
        const tpTe = displayTime ? " " + displayTime + "కి" : ""
        const tpHi = displayTime ? " " + displayTime + " को" : ""
        return t(
          "Shall I confirm *" + svc + "* on " + displayDate + tp + "? ✅",
          "*" + svc + "* " + displayDate + tpTe + " బుక్ చేయమా? ✅",
          "*" + svc + "* " + displayDate + tpHi + " बुक करें? ✅",
          lang
        )
      }
      return null

    case "show_services":
      return t(
        "*" + bizName + " Services*\n\n" + svcList + "\n\nWant to book any? 😊",
        "*" + bizName + " సేవలు*\n\n" + svcList + "\n\nబుక్ చేయాలా? 😊",
        "*" + bizName + " सेवाएं*\n\n" + svcList + "\n\nबुक करना चाहते हैं? 😊",
        lang
      )

    case "show_location":
      if (biz?.location) {
        return "📍 *" + bizName + "*\n" + biz.location + (biz.maps_link ? "\n\n" + biz.maps_link : "")
      }
      return t("Let me get our location for you! 😊", "లొకేషన్ తెలియజేస్తాను! 😊", "लोकेशन बताता हूं! 😊", lang)

    case "show_hours":
      if (biz?.working_hours) {
        return t(
          "*" + bizName + "* is open:\n" + biz.working_hours + "\n\nAnything else? 😊",
          "*" + bizName + "* తెరిచి ఉంటుంది:\n" + biz.working_hours + "\n\nఇంకేమైనా? 😊",
          "*" + bizName + "* खुला है:\n" + biz.working_hours + "\n\nकुछ और? 😊",
          lang
        )
      }
      return null

    case "show_bookings":
      if (activeBookings && activeBookings !== "no upcoming bookings" && activeBookings !== "none") {
        return t(
          "Your upcoming bookings:\n\n" + activeBookings + "\n\nNeed to reschedule or cancel? 😊",
          "మీ రాబోయే బుకింగ్‌లు:\n\n" + activeBookings + "\n\nరీషెడ్యూల్ లేదా క్యాన్సిల్ చేయాలా? 😊",
          "आपकी upcoming बुकिंग:\n\n" + activeBookings + "\n\nरीशेड्यूल या रद्द करना है? 😊",
          lang
        )
      }
      return t(
        "You don't have any upcoming bookings. Want to book something? 😊",
        "మీకు ప్రస్తుతం బుకింగ్‌లు లేవు. బుక్ చేయాలా? 😊",
        "कोई upcoming बुकिंग नहीं है। कुछ बुक करना है? 😊",
        lang
      )

    default:
      return null
  }
}

// ── SMART DEFAULT — never generic ──────────────────────────────
function buildSmartDefault(message, firstName, bizName, state, lang) {
  const name = firstName || "there"

  // Mid-flow — customer said something unexpected
  if (state?.stage && state.stage !== "idle") {
    const stageReplies = {
      "awaiting_service":      t("Which service would you like? 😊", "ఏ సేవ కావాలి? 😊", "कौन सी सेवा? 😊", lang),
      "awaiting_date":         t("What date works for you? 😊", "తేదీ చెప్పండి? 😊", "तारीख बताइए? 😊", lang),
      "awaiting_time":         t("What time works for you? 😊", "సమయం చెప్పండి? 😊", "समय बताइए? 😊", lang),
      "awaiting_confirmation": t("Shall I confirm this booking? ✅", "బుకింగ్ నిర్ధారించమా? ✅", "बुकिंग confirm करूं? ✅", lang),
    }
    if (stageReplies[state.stage]) return stageReplies[state.stage]
  }

  // Random varied defaults — never the same twice
  const defaults = [
    t("Not sure I got that! 😊 I handle bookings at *" + bizName + "* — can I help you schedule something?",
      "అర్థం కాలేదు! 😊 *" + bizName + "*లో బుకింగ్‌కు సహాయం చేయగలను — ఏమి కావాలి?",
      "समझ नहीं आया! 😊 *" + bizName + "* में बुकिंग में मदद कर सकता हूं — क्या चाहिए?", lang),
    t("Hmm, I'm not sure about that one! 😄 But bookings I'm great at — want to schedule something at *" + bizName + "*?",
      "అది నాకు తెలియదు! 😄 కానీ బుకింగ్‌లో మంచిగా చేస్తాను — *" + bizName + "*లో ఏమైనా బుక్ చేయాలా?",
      "वो मुझे नहीं पता! 😄 लेकिन बुकिंग में अच्छा हूं — *" + bizName + "* में कुछ बुक करना है?", lang),
    t("That's a bit beyond me! 😊 I'm the receptionist at *" + bizName + "* — bookings and appointments are my thing!",
      "అది నా పరిధి కాదు! 😊 నేను *" + bizName + "* రిసెప్షనిస్ట్‌ని — బుకింగ్‌లు నా పని!",
      "वो मेरे बस का नहीं! 😊 मैं *" + bizName + "* का receptionist हूं — बुकिंग मेरा काम है!", lang),
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

function buildExtractionPrompt({ message, services, history, state, firstName, activeBookings }) {
  const svcNames = services.map(s => s.name + " ₹" + s.price).join(", ") || "no services"
  const historyText = (history || []).slice(-4).map(m =>
    (m.role === "user" ? "C" : "A") + ": " + m.content.substring(0, 80)
  ).join("\n")
  const stateText = [
    state.service ? "service=" + state.service : "",
    state.date    ? "date=" + state.date : "",
    state.time    ? "time=" + state.time : "",
    state.stage && state.stage !== "idle" ? "stage=" + state.stage : ""
  ].filter(Boolean).join(", ") || "fresh start"

  const today    = todayStr()
  const tomorrow = tomorrowStr()
  const month    = currentMonth()

  return `Extract booking intent from customer message. Reply ONLY with valid JSON.

TODAY=${today} (${todayFormatted()})
TOMORROW=${tomorrow}
MONTH=${month}
SERVICES: ${svcNames}
BOOKINGS: ${activeBookings || "none"}
HISTORY:
${historyText || "none"}
STATE: ${stateText}
CUSTOMER: ${firstName}
MESSAGE: "${message}"

DATE RULES:
- today/aaj/ee roju → "${today}"
- tomorrow/kal/nale → "${tomorrow}"
- "28th" no month → nearest future in ${month}
- "No book 28th" or date correction → new date, confirmed=false

ACTION RULES:
- Service named, no date → collect_date
- Service+date, no time → collect_time
- Service+date+time → confirm_booking
- yes/ok/sure/avunu + awaiting_confirmation → do_booking, confirmed=true
- yes/ok/sure + reschedule_mode → do_reschedule, confirmed=true
- cancel → do_cancel
- reschedule request → collect_date
- reminder request → set_reminder
- price/cost/services/what do you offer → show_services
- location/address/where → show_location
- hours/timing/when open → show_hours
- my booking/my bookings/show bookings/do i have/how many booking/booking i have/tell me booking/check booking/any appointment → show_bookings
- date correction "No book 28th" → confirm_booking, confirmed=false, extract new date
- anything else unclear → none

TIME: 1-8 without am/pm = PM, 9=09:00, 10/11/12=AM, convert to 24hr

JSON:
{
  "action": "<none|collect_service|collect_date|collect_time|confirm_booking|do_booking|do_reschedule|do_cancel|set_reminder|show_services|show_location|show_hours|show_bookings|escalate>",
  "extracted": {
    "service": "<exact name or null>",
    "date": "<YYYY-MM-DD or null>",
    "time": "<HH:MM or null>",
    "confirmed": <true/false>,
    "cancel_scope": "<all|specific|null>",
    "keep_date": "<YYYY-MM-DD or null>",
    "keep_time": "<HH:MM or null>",
    "reminder_preference": "<2hrs|24hrs|null>"
  },
  "preferred_language": "<English|Telugu|Hindi|Tamil|null>",
  "sentiment": "<happy|neutral|frustrated|upset>"
}`
}

function ruleBasedExtraction(message, state, services) {
  const m = (message || "").toLowerCase().trim()
  const extracted = {
    service: null, date: null, time: null, confirmed: false,
    cancel_scope: null, keep_date: null, keep_time: null, reminder_preference: null
  }
  let action = "none"

  if (CONFIRM_WORDS.test(m)) {
    extracted.confirmed = true
    if (state.stage === "reschedule_mode")        action = "do_reschedule"
    else if (state.stage === "awaiting_confirmation") action = "do_booking"
    else action = "confirm_booking"
  }
  else if (/\b(cancel|cancle|cancell|రద్దు)\b/i.test(m)) {
    action = "do_cancel"
    extracted.cancel_scope = /everything|all|sab|అన్నీ/i.test(m) ? "all" : "specific"
  }
  else if (/\b(reschedule|change|postpone|మార్చు)\b/i.test(m)) action = "collect_date"
  else if (/\b(price|pricing|cost|service|offer|what.*have)\b/i.test(m)) action = "show_services"
  else if (/\b(location|address|where|maps)\b/i.test(m)) action = "show_location"
  else if (/\b(hours|timing|open|when)\b/i.test(m)) action = "show_hours"
  else if (/\b(booking|appointment)\b/i.test(m) && /\b(how many|do i have|my|list|show|tell me|know|check|any)\b/i.test(m)) action = "show_bookings"
  else if (/\b(my booking|active booking|upcoming booking|how many booking)\b/i.test(m)) action = "show_bookings"
  else if (/\b(remind|reminder)\b/i.test(m)) action = "set_reminder"
  else if (services?.length) {
    for (const svc of services) {
      if (m.includes(svc.name.toLowerCase().replace(/\s+/g, " "))) {
        extracted.service = svc.name
        action = state.date ? (state.time ? "confirm_booking" : "collect_time") : "collect_date"
        break
      }
    }
  }
  else if (state.stage === "awaiting_date")    action = "collect_date"
  else if (state.stage === "awaiting_time")    action = "collect_time"
  else if (state.stage === "awaiting_service") action = "collect_service"

  return { action, extracted, sentiment: "neutral" }
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

  // ── LANGUAGE ────────────────────────────────────────────────
  const detectedLang = detectLanguage(message)
  let currentPreferred = state.preferred_language
  if (currentPreferred && currentPreferred !== "English") {
    if (detectedLang === "English" && !/speak|language|english|telugu|hindi/i.test(message)) {
      currentPreferred = null
    }
  }
  const replyLang = currentPreferred || detectedLang

  // ── PRE-ROUTER — WHITELIST ONLY ─────────────────────────────
  const routedIntent = routeIntent(message)

  if (routedIntent === "greeting") {
    const svcPrev = services.slice(0, 3).map(s => s.name).join(", ")
    return t(
      "Hi " + firstName + "! 👋 Welcome to *" + bizName + "*!" + (svcPrev ? "\n\nWe offer: " + svcPrev + " and more." : "") + "\n\nHow can I help you today? 😊",
      "నమస్కారం " + firstName + "! 👋 *" + bizName + "*కి స్వాగతం!" + (svcPrev ? "\n\nమేము అందిస్తున్నాము: " + svcPrev + "." : "") + "\n\nమీకు ఎలా సహాయం చేయగలను? 😊",
      "नमस्ते " + firstName + "! 👋 *" + bizName + "* में आपका स्वागत है!" + (svcPrev ? "\n\nहम देते हैं: " + svcPrev + "।" : "") + "\n\nमैं आपकी कैसे मदद कर सकता हूं? 😊",
      replyLang
    )
  }

  const quickReply = buildOutOfScopeReply(routedIntent, message, firstName, bizName)
  if (quickReply) return quickReply

  // ── FRESH STATE CLEAR ───────────────────────────────────────
  if (!state.stage || state.stage === "idle") {
    state = {
      ...state,
      service: null, date: null, time: null, staff: null,
      missing_fields: [], last_ai_question: null,
      clarification_for: [], confidence: {},
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

  // ── SARVAM EXTRACTION ───────────────────────────────────────
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
      if (!decision) console.warn("⚠️ Sarvam unparseable — rule fallback")
    }
  }

  if (!decision) {
    decision = ruleBasedExtraction(message, state, services)
  }

  // ── STATE UPDATES ───────────────────────────────────────────
  let newState = Object.assign({}, state)

  if (decision.preferred_language && decision.preferred_language !== "null") {
    newState.preferred_language = decision.preferred_language
  } else if (!currentPreferred && detectedLang !== "English") {
    newState.preferred_language = detectedLang
  }

  const extracted = decision.extracted || {}
  let action = decision.action || "none"

  if (preFilledDate && !extracted.date) extracted.date = preFilledDate

  // Date override
  if (extracted.date && newState.date && extracted.date !== newState.date) {
    console.warn("📅 Date override: " + newState.date + " → " + extracted.date)
    newState.date = extracted.date
    if (newState.stage === "awaiting_confirmation") {
      extracted.confirmed = false
      action = "confirm_booking"
    }
  }

  // Negation guard
  if (PURE_NEGATION.test((message || "").trim()) && (extracted.confirmed === true || action === "do_booking")) {
    extracted.confirmed = false
    if (action === "do_booking") action = "confirm_booking"
  }

  // Reschedule override
  if (newState.stage === "reschedule_mode" && CONFIRM_WORDS.test((message || "").trim()) && newState.date && newState.time) {
    action = "do_reschedule"
    extracted.confirmed = true
  }

  const isReschedule = ["do_reschedule","collect_date","collect_time","confirm_booking"].includes(action)

  if (extracted.service) {
    const matched = matchService(extracted.service, services)
    if (matched && (!newState.service || isReschedule)) newState.service = matched.name
  }
  if (extracted.date) newState.date = extracted.date
  if (extracted.time) newState.time = normalizeTime(extracted.time) || extracted.time

  // ── BUILD REPLY ─────────────────────────────────────────────
  let reply = buildReply(action, newState, services, biz, firstName, replyLang, extracted, activeBookings)
  if (!reply) reply = buildSmartDefault(message, firstName, bizName, state, replyLang)
  reply = stripBadEmojis(reply)

  // ── EXECUTE: Booking ────────────────────────────────────────
  if (action === "do_booking") {
    if (newState.service && (newState.date || !isTimeBased(matchService(newState.service, services)))) {
      if (extracted.confirmed === true) {
        try {
          const result = await createBooking({
            userId, customerName: contactName, customerPhone: phone,
            customerId: null, state: newState, services,
            bizName: biz.business_name, language: replyLang
          })
          if (result.ok) {
            newState = clearBookingFields(newState)
            newState.stage = "idle"
            newState.last_booking = {
              service: result.booking.service,
              date:    result.booking.booking_date,
              time:    result.booking.booking_time,
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

  // ── EXECUTE: Cancel ─────────────────────────────────────────
  if (action === "do_cancel") {
    try {
      const cancelScope = extracted?.cancel_scope
      if (cancelScope === "all") {
        const { data: allBookings } = await supabaseAdmin
          .from("bookings").select("id, service, booking_date, booking_time")
          .eq("customer_phone", phone).eq("user_id", userId)
          .in("status", ["confirmed","pending"]).gte("booking_date", todayStr())
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

  // ── EXECUTE: Reschedule ─────────────────────────────────────
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

  // ── EXECUTE: Set Reminder ───────────────────────────────────
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
        "తప్పకుండా! " + (extracted.reminder_preference === "2hrs" ? "2 గంటల" : "ఒక రోజు") + " ముందు రిమైండర్ పంపిస్తాను. 😊",
        "जरूर! " + (extracted.reminder_preference === "2hrs" ? "2 घंटे" : "एक दिन") + " पहले reminder भेजूंगा। 😊",
        replyLang
      )
    } catch(e) {
      console.error("❌ set_reminder failed:", e.message)
    }
  }

  // ── UPDATE STAGE ────────────────────────────────────────────
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
      ? (newState.failed_clarifications || 0) + 1 : 0

  try { await saveState(conversationId, newState) } catch(e) {
    console.error("❌ saveState failed:", e.message)
  }

  if (action === "escalate") {
    try {
      await supabaseAdmin.from("ai_event_log").insert({
        user_id: userId, stage: "handoff",
        input_json: { message }, success: true,
        created_at: new Date().toISOString()
      })
    } catch(e) {}
  }

  return reply
}

module.exports = { orchestrate }
