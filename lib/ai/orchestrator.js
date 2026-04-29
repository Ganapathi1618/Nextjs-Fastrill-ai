// lib/ai/orchestrator.js — v4.0 ZERO BUG ARCHITECTURE
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
const CONFIRM_WORDS = /^(yes|ok|okay|sure|haan|avunu|sare|confirm|cofirmed|confirmed|proceed|book it|do it|yes please|ha)\.?\s*$/i
const PURE_NEGATION = /^(no|nahi|nope|vaddu|vaddhu|don't|dont|wait|hold|stop|not now|cancel it)\.?\s*$/i

// ── DATE/TIME HELPERS ──────────────────────────────────────────
function pad(n) { return String(n).padStart(2, "0") }
function toDateStr(d) { return d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate()) }

function nowIST() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
}
function todayStr() {
  const d = nowIST()
  return d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate())
}
function tomorrowStr() {
  const d = nowIST()
  d.setDate(d.getDate() + 1)
  return d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate())
}
function todayFormatted() {
  return nowIST().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  })
}
function currentMonth() {
  return nowIST().toLocaleDateString("en-IN", { month: "long" })
}
function currentMonthNum() { return nowIST().getMonth() }
function currentYear()     { return nowIST().getFullYear() }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ── LANGUAGE ───────────────────────────────────────────────────
function detectLanguage(message) {
  if (!message) return "English"
  if (/[\u0C00-\u0C7F]/.test(message)) return "Telugu"
  if (/[\u0900-\u097F]/.test(message)) return "Hindi"
  if (/[\u0B80-\u0BFF]/.test(message)) return "Tamil"
  if (/[\u0C80-\u0CFF]/.test(message)) return "Kannada"
  if (/[\u0D00-\u0D7F]/.test(message)) return "Malayalam"
  return "English"
}

function t(en, te, hi, lang) {
  if (lang === "Telugu" && te) return te
  if (lang === "Hindi"  && hi) return hi
  return en
}

function stripBadEmojis(text) {
  if (!text) return text
  return text
    .replace(/📅/g,"").replace(/📆/g,"").replace(/⏰/g,"")
    .replace(/🔔/g,"").replace(/⌚/g,"").replace(/🎊/g,"")
    .replace(/🕐|🕑|🕒|🕓|🕔|🕕|🕖|🕗|🕘|🕙|🕚|🕛/g,"")
    .replace(/  +/g," ").trim()
}

// ── DATE EXTRACTION FROM MESSAGE ───────────────────────────────
// Extracts date from any natural language date expression
// Returns YYYY-MM-DD or null
function extractDateFromMessage(message) {
  const m = (message || "").toLowerCase().trim()

  // Today/Tomorrow keywords — all languages
  if (/\btoday\b|\baaj\b|\bee roju\b|\binna\b/.test(m)) return todayStr()
  if (/\btomorrow\b|\bkal\b|\bnale\b|\breyyi\b|\bnaale\b/.test(m)) return tomorrowStr()

  const MONTHS = {
    jan:0,january:0,feb:1,february:1,mar:2,march:2,
    apr:3,april:3,may:4,jun:5,june:5,
    jul:6,july:6,aug:7,august:7,sep:8,september:8,
    oct:9,october:9,nov:10,november:10,dec:11,december:11
  }

  // "29 april", "29th april", "april 29", "april 29th"
  const withMonthName = m.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)/i) ||
                        m.match(/(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?/i)
  if (withMonthName) {
    let day, monthStr
    if (/^\d/.test(withMonthName[1])) { day = parseInt(withMonthName[1]); monthStr = withMonthName[2] }
    else { monthStr = withMonthName[1]; day = parseInt(withMonthName[2]) }
    const monthIdx = MONTHS[monthStr.toLowerCase().substring(0,3)]
    if (monthIdx !== undefined && day >= 1 && day <= 31) {
      let year = currentYear()
      const candidate = new Date(year, monthIdx, day)
      const today = new Date(todayStr() + "T00:00:00")
      if (candidate < today) year++
      const d = new Date(year, monthIdx, day)
      return d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate())
    }
  }

  // Day names — "monday", "tuesday" etc
  const DAYS = { sunday:0, monday:1, tuesday:2, wednesday:3, thursday:4, friday:5, saturday:6 }
  const dayMatch = m.match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i)
  if (dayMatch) {
    const targetDay = DAYS[dayMatch[1].toLowerCase()]
    const d = nowIST()
    const currentDay = d.getDay()
    let diff = targetDay - currentDay
    if (diff <= 0) diff += 7
    d.setDate(d.getDate() + diff)
    return d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate())
  }

  // "29th", "29", "1st", "2nd" — ordinal or plain number
  // Only match if no time pattern present to avoid "5pm" matching as day 5
  const hasTimePattern = /\b\d{1,2}\s*(am|pm)\b/i.test(m) || /\b\d{1,2}:\d{2}\b/.test(m)
  const ordinalMatch = m.match(/\b(\d{1,2})(st|nd|rd|th)\b/)
  if (ordinalMatch) {
    const day = parseInt(ordinalMatch[1])
    if (day >= 1 && day <= 31) {
      const today = nowIST()
      let month = currentMonthNum()
      let year  = currentYear()
      let d = new Date(year, month, day)
      if (d <= today) { month++; if (month > 11) { month = 0; year++ } }
      d = new Date(year, month, day)
      return d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate())
    }
  }

  return null
}

// ── TIME EXTRACTION FROM MESSAGE ───────────────────────────────
// Extracts time from any natural language time expression
// Returns HH:MM (24hr) or null
function extractTimeFromMessage(message) {
  const m = (message || "").toLowerCase().trim()

  // "5pm", "5 pm", "5:00pm", "10am", "10:30 am"
  const ampmMatch = m.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i)
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1])
    const min = ampmMatch[2] ? ampmMatch[2] : "00"
    const period = ampmMatch[3].toLowerCase()
    if (period === "pm" && h !== 12) h += 12
    if (period === "am" && h === 12) h = 0
    return pad(h) + ":" + min
  }

  // "17:00", "10:30" — explicit 24hr
  const explicit24 = m.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/)
  if (explicit24) return pad(parseInt(explicit24[1])) + ":" + explicit24[2]

  // "5 baje", "5 baje evening" (Hindi)
  const bajeMatch = m.match(/\b(\d{1,2})\s*baje\b/i)
  if (bajeMatch) {
    let h = parseInt(bajeMatch[1])
    if (h >= 1 && h <= 8) h += 12  // evening assumption
    return pad(h) + ":00"
  }

  // Plain number like "5" only when context is clearly time
  // (mid-flow when stage is awaiting_time)
  const plainNum = m.match(/^(\d{1,2})$/)
  if (plainNum) {
    return normalizeTime(plainNum[1])
  }

  return null
}

// ── SERVICE EXTRACTION FROM MESSAGE ───────────────────────────
function extractServiceFromMessage(message, services) {
  if (!services?.length || !message) return null
  const m = message.toLowerCase().replace(/[?!.,]/g, "").trim()
  // Exact match first
  for (const svc of services) {
    if (m.includes(svc.name.toLowerCase())) return svc.name
  }
  // Partial match
  for (const svc of services) {
    const words = svc.name.toLowerCase().split(" ")
    if (words.some(w => w.length > 3 && m.includes(w))) return svc.name
  }
  return null
}

// ── PRE-ROUTER — WHITELIST ONLY ────────────────────────────────
function routeIntent(message) {
  const m = (message || "").toLowerCase().trim()
  // Pure greetings
  if (/^(hi|hello|hey|hii|hai|namaste|good morning|good evening|good afternoon|howdy|sup|wassup)[\s!.]*$/i.test(m)) return "greeting"
  // Pure thanks
  if (/^(thank|thanks|thnx|thx|ty|thank you|thankyou|shukriya|dhanyavaad|thq|tq)[\s!.]*$/i.test(m)) return "thanks"
  // Pure bye
  if (/^(bye|goodbye|see you|cya|later|take care|good night|goodnight|ok bye|okk bye)[\s!.]*$/i.test(m)) return "bye"
  // Pure compliment
  if (/^(good|great|awesome|amazing|excellent|wonderful|nice|cool|brilliant|perfect|superb|👍|🙏)[\s!.]*$/i.test(m)) return "compliment"
  // 100% certain out-of-scope
  if (/\b(ipl|cricket|football|soccer|fifa|worldcup|t20|odi|test match|nba|nfl)\b/i.test(m) && !/\b(book|cancel|reschedule)\b/i.test(m)) return "sports"
  if (/\b(weather|rainfall|temperature|forecast|humidity|climate)\b/i.test(m)) return "weather"
  if (/\b(tell me a joke|crack a joke|say something funny)\b/i.test(m)) return "joke"
  if (/\b(who is modi|who is rahul|bjp|congress|election|prime minister of india)\b/i.test(m)) return "politics"
  if (/\b(fuck|fck|shit|bastard|idiot|stupid|useless|worst|hate you|mf|mfr)\b/i.test(m)) return "abuse"
  // Everything else → Sarvam
  return "sarvam"
}

// ── OUT OF SCOPE REPLIES ────────────────────────────────────────
function buildOutOfScopeReply(type, firstName, bizName) {
  const name = firstName || "there"
  const defaults = [
    "Not sure I got that! 😊 I handle bookings at *" + bizName + "* — can I help you schedule something?",
    "Hmm, that's a bit beyond me! 😄 But bookings I'm great at — want to book something at *" + bizName + "*?",
    "I'm best at bookings at *" + bizName + "* 😊 — what can I help you with?"
  ]
  switch(type) {
    case "thanks":     return "You're welcome " + name + "! 😊 Let me know if you need anything else."
    case "bye":        return "Take care " + name + "! 😊 See you soon at *" + bizName + "*!"
    case "compliment": return "Thank you " + name + "! 😊 Anything I can help you book today?"
    case "sports":     return "Ha, wish I was watching too! 😄 I'm managing bookings at *" + bizName + "* — need to schedule something?"
    case "weather":    return "No idea — I'm indoors all day! 😂 Need to book something at *" + bizName + "*?"
    case "joke":       return "Why did the customer always come back? Service was too good to cancel 😄\n\nCan I book something for you?"
    case "politics":   return "Ha, that's above my pay grade 😄 I'm just here for bookings — can I help?"
    case "abuse":      return "I understand you might be frustrated 😔 I'm here to help — what's going on?"
    default:           return defaults[Math.floor(Math.random() * defaults.length)]
  }
}

// ── REPLY BUILDER — ALL DISPLAY TEXT FROM OUR CODE ─────────────
function buildReply(action, state, services, biz, lang, activeBookings) {
  const bizName     = biz?.business_name || "us"
  const svc         = state.service
  const date        = state.date
  const time        = state.time
  const displayDate = date ? formatDate(date) : null
  const displayTime = time ? formatTime(time) : null
  const svcList     = (services || []).map(s =>
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
      return t("I'll get our location for you! 😊", "లొకేషన్ తెలియజేస్తాను! 😊", "लोकेशन बताता हूं! 😊", lang)
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

// ── SMART DEFAULT ──────────────────────────────────────────────
function buildSmartDefault(state, bizName, lang) {
  if (state?.stage && state.stage !== "idle") {
    const map = {
      "awaiting_service":      t("Which service would you like? 😊", "ఏ సేవ కావాలి? 😊", "कौन सी सेवा? 😊", lang),
      "awaiting_date":         t("What date works for you? 😊", "తేదీ చెప్పండి? 😊", "तारीख बताइए? 😊", lang),
      "awaiting_time":         t("What time works for you? 😊", "సమయం చెప్పండి? 😊", "समय बताइए? 😊", lang),
      "awaiting_confirmation": t("Shall I confirm this booking? ✅", "బుకింగ్ నిర్ధారించమా? ✅", "बुकिंग confirm करूं? ✅", lang),
    }
    if (map[state.stage]) return map[state.stage]
  }
  const opts = [
    t("Not sure I got that! 😊 I handle bookings at *" + bizName + "* — can I help?", "అర్థం కాలేదు! 😊 బుకింగ్‌లో సహాయం చేయగలను.", "समझ नहीं आया! 😊 बुकिंग में मदद कर सकता हूं।", lang),
    t("Hmm, not sure about that! 😄 But bookings I'm great at — want to schedule something?", "అది తెలియదు! 😄 బుకింగ్‌లో మంచిగా చేస్తాను.", "वो नहीं पता! 😄 बुकिंग में अच्छा हूं।", lang),
  ]
  return opts[Math.floor(Math.random() * opts.length)]
}

// ── SARVAM ─────────────────────────────────────────────────────
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
      console.error("❌ Sarvam error attempt " + attempt + " code=" + code + ":", data.error.message)
      if (code === 401 || code === 403 || code === 429) return null
      if (attempt <= SARVAM_MAX_RETRIES) { await sleep(800 * attempt); return callSarvamWithRetry(payload, attempt + 1) }
      return null
    }
    const content = data?.choices?.[0]?.message?.content || null
    return content
  } catch(e) {
    clearTimeout(timer)
    console.error("❌ Sarvam " + (e.name === "AbortError" ? "TIMEOUT" : e.message) + " attempt " + attempt)
    if (attempt <= SARVAM_MAX_RETRIES) { await sleep(800 * attempt); return callSarvamWithRetry(payload, attempt + 1) }
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
    console.error("❌ JSON parse failed:", (raw||"").substring(0,100))
    return null
  }
}

// ── EXTRACTION PROMPT — SHORT AND FOCUSED ──────────────────────
function buildExtractionPrompt({ message, services, history, state, firstName, activeBookings }) {
  const svcNames = services.map(s => s.name).join(", ") || "none"
  const hist = (history||[]).slice(-3).map(m => (m.role==="user"?"C":"A") + ": " + m.content.substring(0,60)).join("\n")
  const st   = [
    state.service ? "service=" + state.service : "",
    state.date    ? "date=" + state.date : "",
    state.time    ? "time=" + state.time : "",
    state.stage && state.stage !== "idle" ? "stage=" + state.stage : ""
  ].filter(Boolean).join(", ") || "fresh"

  return `Extract intent from customer message. JSON only. No explanation.

TODAY=${todayStr()} TOMORROW=${tomorrowStr()} MONTH=${currentMonth()}
SERVICES: ${svcNames}
STATE: ${st}
HISTORY: ${hist||"none"}
CUSTOMER: ${firstName}
MESSAGE: "${message}"

ACTION (pick one):
collect_service = needs to pick service
collect_date = service known, need date
collect_time = service+date known, need time  
confirm_booking = service+date+time all known, ask to confirm
do_booking = customer confirmed yes/ok/sure/avunu
do_reschedule = confirmed reschedule
do_cancel = cancel request
set_reminder = reminder request
show_services = asking about services/pricing/what do you offer
show_location = asking for address/location/where
show_hours = asking about timing/hours/when open
show_bookings = asking about their bookings/appointments/how many
none = unclear

RULES:
- If message has service name → extract it
- today/aaj = ${todayStr()}, tomorrow/kal = ${tomorrowStr()}
- "29th" no month = nearest future date in ${currentMonth()}
- 1-8 without am/pm = PM, 9=09:00, 10/11/12=AM
- yes/ok/sure/avunu/haan + awaiting_confirmation = do_booking confirmed=true
- yes/ok/sure + reschedule_mode = do_reschedule confirmed=true
- "No book 29th" = confirm_booking with new date, confirmed=false

{"action":"<action>","extracted":{"service":"<name or null>","date":"<YYYY-MM-DD or null>","time":"<HH:MM or null>","confirmed":<true/false>,"cancel_scope":"<all|specific|null>","reminder_preference":"<2hrs|24hrs|null>"},"preferred_language":"<English|Telugu|Hindi|Tamil|null>","sentiment":"<happy|neutral|frustrated|upset>"}`
}

// ── RULE BASED EXTRACTION ──────────────────────────────────────
function ruleBasedExtraction(message, state, services) {
  const m = (message||"").toLowerCase().trim()
  const extracted = { service:null, date:null, time:null, confirmed:false, cancel_scope:null, reminder_preference:null }
  let action = "none"

  if (CONFIRM_WORDS.test(m)) {
    extracted.confirmed = true
    action = state.stage==="reschedule_mode" ? "do_reschedule" : state.stage==="awaiting_confirmation" ? "do_booking" : "confirm_booking"
  }
  else if (/\b(cancel|cancle|cancell|రద్దు)\b/i.test(m)) { action="do_cancel"; extracted.cancel_scope=/everything|all|సబ్|అన్నీ/i.test(m)?"all":"specific" }
  else if (/\b(reschedule|change.*appointment|postpone|మార్చు)\b/i.test(m)) action="collect_date"
  else if (/\b(price|pricing|cost|charge|rate|how much|service|services|what.*offer|what.*have|what.*do you)\b/i.test(m)) action="show_services"
  else if (/\b(location|address|where|maps|directions|how.*reach|find you)\b/i.test(m)) action="show_location"
  else if (/\b(hours|timing|open|close|when|working|available.*time)\b/i.test(m)) action="show_hours"
  else if (/\b(booking|appointment)\b/i.test(m) && /\b(how many|do i have|my|list|show|tell|know|check|any)\b/i.test(m)) action="show_bookings"
  else if (/\b(remind|reminder|notify)\b/i.test(m)) { action="set_reminder"; extracted.reminder_preference=/2\s*hr|2\s*hour|two hour/i.test(m)?"2hrs":"24hrs" }
  else {
    const svc = extractServiceFromMessage(message, services)
    if (svc) {
      extracted.service = svc
      action = state.date ? (state.time ? "confirm_booking" : "collect_time") : "collect_date"
    }
    else if (state.stage==="awaiting_date")    action="collect_date"
    else if (state.stage==="awaiting_time")    action="collect_time"
    else if (state.stage==="awaiting_service") action="collect_service"
  }

  return { action, extracted, sentiment:"neutral" }
}

// ── MAIN ORCHESTRATE ───────────────────────────────────────────
async function orchestrate({ userId, conversationId, phone, contactName, message, isMediaOnly }) {
  let context, state
  try {
    ;[context, state] = await Promise.all([
      loadContext({ userId, conversationId, phone }),
      loadState(conversationId)
    ])
  } catch(e) {
    console.error("❌ context/state load failed:", e.message)
    return "Hi! We're having a brief technical issue. Please try again in a moment 🙏"
  }

  const { biz, services, history, activeBookings } = context
  const firstName = (contactName||"").split(" ")[0] || "there"
  const bizName   = biz?.business_name || "us"

  if (isMediaOnly) return "Thanks for sharing! 😊 If you have any questions or want to book, just type here."

  // ── LANGUAGE ──────────────────────────────────────────────
  const detectedLang = detectLanguage(message)
  let currentPreferred = state.preferred_language
  if (currentPreferred && currentPreferred !== "English" && detectedLang === "English" && !/speak|language|english|telugu|hindi/i.test(message)) {
    currentPreferred = null
  }
  const replyLang = currentPreferred || detectedLang

  // ── PRE-ROUTER ───────────────────────────────────────────
  const routedIntent = routeIntent(message)
  if (routedIntent === "greeting") {
    const svcPrev = services.slice(0,3).map(s=>s.name).join(", ")
    return t(
      "Hi " + firstName + "! 👋 Welcome to *" + bizName + "*!" + (svcPrev ? "\n\nWe offer: " + svcPrev + " and more." : "") + "\n\nHow can I help you today? 😊",
      "నమస్కారం " + firstName + "! 👋 *" + bizName + "*కి స్వాగతం!" + (svcPrev ? "\n\nమేము: " + svcPrev + " అందిస్తున్నాము." : "") + "\n\nమీకు ఎలా సహాయం చేయగలను? 😊",
      "नमस्ते " + firstName + "! 👋 *" + bizName + "* में आपका स्वागत!" + (svcPrev ? "\n\nहम देते हैं: " + svcPrev + "।" : "") + "\n\nकैसे मदद करूं? 😊",
      replyLang
    )
  }
  if (routedIntent !== "sarvam") return buildOutOfScopeReply(routedIntent, firstName, bizName)

  // ── FRESH STATE CLEAR ────────────────────────────────────
  if (!state.stage || state.stage === "idle") {
    state = { ...state, service:null, date:null, time:null, staff:null, missing_fields:[], last_ai_question:null, clarification_for:[], confidence:{}, preferred_language: currentPreferred || state.preferred_language }
  }

  // ── EXTRACT DATE/TIME/SERVICE FROM MESSAGE DIRECTLY ──────
  // Do this BEFORE Sarvam so we have accurate data
  const msgDate    = extractDateFromMessage(message)
  const msgTime    = extractTimeFromMessage(message)
  const msgService = extractServiceFromMessage(message, services)

  // Apply message extractions to state
  if (msgDate && !state.date) state = { ...state, date: msgDate }
  if (msgTime && !state.time) state = { ...state, time: msgTime }
  if (msgService && !state.service) state = { ...state, service: msgService }

  // If customer is giving new date during confirmation → override
  if (msgDate && state.date && msgDate !== state.date && state.stage === "awaiting_confirmation") {
    state = { ...state, date: msgDate, time: msgTime || state.time }
  }

  // ── SARVAM EXTRACTION ────────────────────────────────────
  let decision = null
  if (process.env.SARVAM_API_KEY) {
    const raw = await callSarvamWithRetry({
      model: "sarvam-m",
      messages: [{ role:"user", content: buildExtractionPrompt({ message, services, history, state, firstName, activeBookings }) }],
      max_tokens: 300,
      temperature: 0.1
    })
    if (raw) decision = parseAIDecision(raw)
  }
  if (!decision) decision = ruleBasedExtraction(message, state, services)

  // ── UPDATE STATE FROM SARVAM ─────────────────────────────
  let newState = Object.assign({}, state)
  const extracted = decision.extracted || {}

  if (decision.preferred_language && decision.preferred_language !== "null") {
    newState.preferred_language = decision.preferred_language
  } else if (!currentPreferred && detectedLang !== "English") {
    newState.preferred_language = detectedLang
  }

  // Merge extracted data — our direct extraction takes priority over Sarvam
  // Only use Sarvam's date/time if we didn't already extract from message
  if (!msgService && extracted.service) {
    const matched = matchService(extracted.service, services)
    if (matched) newState.service = matched.name
  }
  if (!msgDate && extracted.date) newState.date = extracted.date
  if (!msgTime && extracted.time) newState.time = normalizeTime(extracted.time) || extracted.time

  // Make sure normalizeTime is applied to whatever time we have
  if (newState.time && !newState.time.includes(":")) {
    newState.time = normalizeTime(newState.time) || newState.time
  }

  // ── DETERMINE ACTION FROM STATE — NOT FROM SARVAM ────────
  // This is the key — we drive action from what we actually have
  // Sarvam action only used for special cases
  let action = decision.action || "none"

  // Special actions — trust Sarvam
  const specialActions = ["do_booking","do_reschedule","do_cancel","set_reminder","show_services","show_location","show_hours","show_bookings","escalate","none"]

  if (!specialActions.includes(action)) {
    // For collect_* and confirm_booking — recalculate from state
    if (newState.service && newState.date && newState.time) action = "confirm_booking"
    else if (newState.service && newState.date)             action = "collect_time"
    else if (newState.service)                              action = "collect_date"
    else                                                    action = "collect_service"
  }

  // Confirmation check
  const isConfirm = CONFIRM_WORDS.test((message||"").trim())
  if (isConfirm && newState.stage === "awaiting_confirmation" && newState.service && newState.date) {
    action = "do_booking"
    extracted.confirmed = true
  }
  if (isConfirm && newState.stage === "reschedule_mode" && newState.date && newState.time) {
    action = "do_reschedule"
    extracted.confirmed = true
  }

  // Negation guard — pure standalone only
  if (PURE_NEGATION.test((message||"").trim()) && (extracted.confirmed === true || action === "do_booking")) {
    extracted.confirmed = false
    if (action === "do_booking") action = "confirm_booking"
  }

  // Update stage map
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

  // ── BUILD REPLY ──────────────────────────────────────────
  let reply = buildReply(action, newState, services, biz, replyLang, activeBookings)
  if (!reply) reply = buildSmartDefault(state, bizName, replyLang)
  reply = stripBadEmojis(reply)

  // ── EXECUTE: Booking ─────────────────────────────────────
  if (action === "do_booking" && extracted.confirmed === true) {
    if (newState.service && (newState.date || !isTimeBased(matchService(newState.service, services)))) {
      try {
        const result = await createBooking({
          userId, customerName: contactName, customerPhone: phone,
          customerId: null, state: newState, services,
          bizName: biz.business_name, language: replyLang
        })
        if (result.ok) {
          newState = clearBookingFields(newState)
          newState.stage = "idle"
          newState.last_booking = { service: result.booking.service, date: result.booking.booking_date, time: result.booking.booking_time, confirmed_at: Date.now() }
          await saveState(conversationId, newState)
          await supabaseAdmin.from("conversations").update({ last_message: "✅ Booking Confirmed — " + result.booking.service }).eq("id", conversationId)
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

  // ── EXECUTE: Cancel ──────────────────────────────────────
  if (action === "do_cancel") {
    try {
      const cancelScope = extracted?.cancel_scope
      if (cancelScope === "all") {
        const { data: allBookings } = await supabaseAdmin.from("bookings").select("id,service,booking_date,booking_time")
          .eq("customer_phone",phone).eq("user_id",userId).in("status",["confirmed","pending"]).gte("booking_date",todayStr())
        if (allBookings?.length) {
          await supabaseAdmin.from("bookings").update({status:"cancelled"}).in("id",allBookings.map(b=>b.id))
        }
      } else if (newState.service || newState.date) {
        let q = supabaseAdmin.from("bookings").update({status:"cancelled"}).eq("customer_phone",phone).eq("user_id",userId).in("status",["confirmed","pending"])
        if (newState.service) q = q.ilike("service","%"+newState.service+"%")
        if (newState.date)    q = q.eq("booking_date",newState.date)
        if (newState.time)    q = q.eq("booking_time",newState.time)
        await q
      }
      newState = clearBookingFields(newState)
      await saveState(conversationId, newState)
      return t("Your booking has been cancelled 😊 Let me know if you'd like to rebook!", "మీ బుకింగ్ రద్దు చేయబడింది 😊 మళ్ళీ బుక్ చేయాలంటే చెప్పండి!", "आपकी बुकिंग रद्द हो गई 😊 दोबारा बुक करना हो तो बताइए!", replyLang)
    } catch(e) { console.error("❌ Cancel failed:", e.message) }
  }

  // ── EXECUTE: Reschedule ──────────────────────────────────
  if (action === "do_reschedule" && extracted.confirmed === true) {
    if (newState.date && newState.time) {
      try {
        const result = await rescheduleBooking({ userId, customerPhone:phone, date:newState.date, time:newState.time, services, serviceName:newState.service, language:replyLang })
        if (result.ok) {
          newState = clearBookingFields(newState)
          newState.stage = "idle"
          await saveState(conversationId, newState)
          return result.message
        }
        await saveState(conversationId, newState)
        return result.message
      } catch(e) { console.error("❌ Reschedule threw:", e.message) }
    }
  }

  // ── EXECUTE: Set Reminder ────────────────────────────────
  if (action === "set_reminder" && extracted.reminder_preference) {
    try {
      const { data: nextBooking } = await supabaseAdmin.from("bookings").select("id")
        .eq("customer_phone",phone).eq("user_id",userId).in("status",["confirmed","pending"])
        .gte("booking_date",todayStr()).order("booking_date",{ascending:true}).limit(1).maybeSingle()
      if (nextBooking) await supabaseAdmin.from("bookings").update({reminder_preference:extracted.reminder_preference}).eq("id",nextBooking.id)
      await saveState(conversationId, newState)
      return t(
        "Sure! I'll remind you " + (extracted.reminder_preference==="2hrs"?"2 hours":"a day") + " before your appointment. 😊",
        "తప్పకుండా! " + (extracted.reminder_preference==="2hrs"?"2 గంటల":"ఒక రోజు") + " ముందు రిమైండర్ పంపిస్తాను. 😊",
        "जरूर! " + (extracted.reminder_preference==="2hrs"?"2 घंटे":"एक दिन") + " पहले reminder भेजूंगा। 😊",
        replyLang
      )
    } catch(e) { console.error("❌ set_reminder failed:", e.message) }
  }

  // ── SAVE STATE ───────────────────────────────────────────
  newState.failed_clarifications = (action==="none" && reply.includes("?")) ? (newState.failed_clarifications||0)+1 : 0
  try { await saveState(conversationId, newState) } catch(e) { console.error("❌ saveState failed:", e.message) }

  if (action === "escalate") {
    try { await supabaseAdmin.from("ai_event_log").insert({ user_id:userId, stage:"handoff", input_json:{message}, success:true, created_at:new Date().toISOString() }) } catch(e) {}
  }

  return reply
}

module.exports = { orchestrate }
