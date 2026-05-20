// lib/ai/orchestrator.js — v5.2 OFFER + TYPO + CONFIRMATION FIXES
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

// FIX 3: Expanded CONFIRM_WORDS to catch more natural confirmations
// Customers say "s", "yep", "yup", "deal", "let's do it", "book karo" etc
const CONFIRM_WORDS = /^(yes|ok|okay|sure|haan|avunu|sare|confirm|cofirmed|confirmed|proceed|book it|do it|yes please|ha|ji|ji haan|aanu|otey|done|go ahead|please|correct|right|yep|yup|yeah|ya|deal|lets do it|let's do it|sounds good|perfect|great|fine|book karo|karo|kar do|aavunu|ante|ante avunu|ante ok|s|y)\.?\s*$/i

const PURE_NEGATION = /^(no|nahi|nope|vaddu|vaddhu|don't|dont|wait|hold|stop|not now|cancel it|வேண்டாம்|వద్దు|noo|nope|na|mat karo)\.?\s*$/i

// ── DATE/TIME HELPERS ──────────────────────────────────────────
function pad(n) { return String(n).padStart(2,"0") }
function toDateStr(d) { return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()) }

function nowIST() {
  return new Date(new Date().toLocaleString("en-US",{timeZone:"Asia/Kolkata"}))
}
function todayStr() {
  const d=nowIST()
  return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())
}
function tomorrowStr() {
  const d=nowIST()
  d.setDate(d.getDate()+1)
  return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())
}
function todayFormatted() {
  return nowIST().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})
}
function currentMonth() {
  return nowIST().toLocaleDateString("en-IN",{month:"long"})
}
function sleep(ms) { return new Promise(r=>setTimeout(r,ms)) }

// ── LANGUAGE ───────────────────────────────────────────────────
function detectLanguage(msg) {
  if (!msg) return "English"
  if (/[\u0C00-\u0C7F]/.test(msg)) return "Telugu"
  if (/[\u0900-\u097F]/.test(msg)) return "Hindi"
  if (/[\u0B80-\u0BFF]/.test(msg)) return "Tamil"
  if (/[\u0C80-\u0CFF]/.test(msg)) return "Kannada"
  if (/[\u0D00-\u0D7F]/.test(msg)) return "Malayalam"
  return "English"
}

function t(en,te,hi,lang) {
  if (lang==="Telugu"&&te) return te
  if (lang==="Hindi"&&hi) return hi
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

// ── DATE EXTRACTION ────────────────────────────────────────────
function extractDateFromMessage(message) {
  if (!message) return null
  const m = message.toLowerCase().trim()

  if (/\btoday\b|\baaj\b|\bee roju\b|\binna\b|\baaj ka\b/.test(m)) return todayStr()
  if (/\btomorrow\b|\bkal\b|\bnale\b|\breyyi\b|\bnaale\b|\bkal ka\b/.test(m)) return tomorrowStr()

  const MONTHS = {
    jan:0,january:0,feb:1,february:1,mar:2,march:2,
    apr:3,april:3,may:4,jun:5,june:5,jul:6,july:6,
    aug:7,august:7,sep:8,september:8,oct:9,october:9,
    nov:10,november:10,dec:11,december:11
  }

  const withMonth =
    m.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)/i) ||
    m.match(/(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?/i)

  if (withMonth) {
    let day, monthStr
    if (/^\d/.test(withMonth[1])) { day=parseInt(withMonth[1]); monthStr=withMonth[2] }
    else { monthStr=withMonth[1]; day=parseInt(withMonth[2]) }
    const mIdx = MONTHS[monthStr.toLowerCase().substring(0,3)]
    if (mIdx!==undefined && day>=1 && day<=31) {
      let yr = nowIST().getFullYear()
      const cand = new Date(yr,mIdx,day)
      if (cand < new Date(todayStr()+"T00:00:00")) yr++
      const d = new Date(yr,mIdx,day)
      return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())
    }
  }

  const DAYS = {sunday:0,monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6}
  const dayMatch = m.match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i)
  if (dayMatch) {
    const target = DAYS[dayMatch[1].toLowerCase()]
    const d = nowIST()
    let diff = target - d.getDay()
    if (diff<=0) diff+=7
    d.setDate(d.getDate()+diff)
    return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())
  }

  const ordinal = m.match(/\b(\d{1,2})(st|nd|rd|th)\b/)
  if (ordinal) {
    const day = parseInt(ordinal[1])
    if (day>=1 && day<=31) {
      const now = nowIST()
      let mo=now.getMonth(), yr=now.getFullYear()
      let d=new Date(yr,mo,day)
      if (d<=now) { mo++; if(mo>11){mo=0;yr++} }
      d=new Date(yr,mo,day)
      return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())
    }
  }

  return null
}

// ── TIME EXTRACTION ────────────────────────────────────────────
function extractTimeFromMessage(message) {
  if (!message) return null
  const m = message.toLowerCase().trim()

  const ampm = m.match(/\b(\d{1,2})(?:[:.:](\d{2}))?\s*(am|pm)\b/i)
  if (ampm) {
    let h=parseInt(ampm[1])
    const min=ampm[2]||"00"
    const p=ampm[3].toLowerCase()
    if (p==="pm"&&h!==12) h+=12
    if (p==="am"&&h===12) h=0
    return pad(h)+":"+min
  }

  const exp24 = m.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/)
  if (exp24) return pad(parseInt(exp24[1]))+":"+exp24[2]

  const baje = m.match(/\b(\d{1,2})\s*baje\b/i)
  if (baje) {
    let h=parseInt(baje[1])
    if (h>=1&&h<=8) h+=12
    return pad(h)+":00"
  }

  const plainWithContext = m.match(/\bat\s+(\d{1,2})\b/) || m.match(/\b(\d{1,2})\s+o'?clock\b/i)
  if (plainWithContext) {
    const h = parseInt(plainWithContext[1])
    return normalizeTime(String(h))
  }

  return null
}

// ── SERVICE EXTRACTION — FIX 2: Added fuzzy matching for typos ─
function extractServiceFromMessage(message, services) {
  if (!services?.length||!message) return null
  const m = message.toLowerCase().replace(/[?!.,]/g,"").trim()

  // Exact match first
  for (const svc of services) {
    if (m.includes(svc.name.toLowerCase())) return svc.name
  }

  // Word-level partial match
  for (const svc of services) {
    const words = svc.name.toLowerCase().split(" ")
    if (words.filter(w=>w.length>3).every(w=>m.includes(w))) return svc.name
  }

  // FIX 2: Fuzzy match — handles typos like "automaton" → "automation"
  // Check if message contains most of the service name characters
  for (const svc of services) {
    const svcLower = svc.name.toLowerCase()
    if (svcLower.length < 4) continue
    // Check substring match — if 80% of service name is in message
    const minLen = Math.floor(svcLower.length * 0.8)
    const prefix = svcLower.substring(0, minLen)
    if (m.includes(prefix)) return svc.name
    // Also check if message word is close to service name
    const words = m.split(/\s+/)
    for (const word of words) {
      if (word.length < 4) continue
      // Levenshtein distance check — if within 2 chars difference
      if (Math.abs(word.length - svcLower.length) <= 2) {
        let matches = 0
        const shorter = word.length < svcLower.length ? word : svcLower
        const longer  = word.length < svcLower.length ? svcLower : word
        for (let i = 0; i < shorter.length; i++) {
          if (longer.includes(shorter[i])) matches++
        }
        if (matches / longer.length >= 0.8) return svc.name
      }
    }
  }

  return null
}

// ── SARVAM CALL ────────────────────────────────────────────────
async function callSarvamWithRetry(payload, attempt=1) {
  const controller = new AbortController()
  const timer = setTimeout(()=>controller.abort(), SARVAM_TIMEOUT_MS)
  try {
    const res = await fetch("https://api.sarvam.ai/v1/chat/completions",{
      method:"POST",
      headers:{"Content-Type":"application/json","api-subscription-key":process.env.SARVAM_API_KEY},
      body:JSON.stringify(payload),
      signal:controller.signal
    })
    clearTimeout(timer)
    const data = await res.json()
    if (data?.error) {
      const code=data.error.code||data.error.status
      console.error("❌ Sarvam error attempt "+attempt+" code="+code)
      if (code===401||code===403||code===429) return null
      if (attempt<=SARVAM_MAX_RETRIES) { await sleep(800*attempt); return callSarvamWithRetry(payload,attempt+1) }
      return null
    }
    return data?.choices?.[0]?.message?.content||null
  } catch(e) {
    clearTimeout(timer)
    console.error("❌ Sarvam "+(e.name==="AbortError"?"TIMEOUT":e.message)+" attempt "+attempt)
    if (attempt<=SARVAM_MAX_RETRIES) { await sleep(800*attempt); return callSarvamWithRetry(payload,attempt+1) }
    return null
  }
}

function parseJSON(raw) {
  if (!raw) return null
  try {
    let clean=raw.replace(/<think>[\s\S]*?<\/think>/gi,"").trim()
    if (clean.includes("<think>")) clean=clean.split("<think>")[0].trim()
    const match=clean.match(/\{[\s\S]*\}/)
    if (!match) return null
    return JSON.parse(match[0])
  } catch(e) { return null }
}

// ── SARVAM PROMPT ──────────────────────────────────────────────
function buildSarvamPrompt({ message, services, history, state, firstName, activeBookings, biz }) {
  const svcNames = services.map(s=>s.name+" ₹"+s.price).join(", ")||"none"
  const hist = (history||[]).slice(-3).map(m=>(m.role==="user"?"C":"A")+": "+m.content.substring(0,60)).join("\n")
  const st = [
    state.service?"svc="+state.service:"",
    state.date?"date="+state.date:"",
    state.time?"time="+state.time:"",
    state.stage&&state.stage!=="idle"?"stage="+state.stage:""
  ].filter(Boolean).join(", ")||"fresh"

  return `Booking assistant. Classify intent AND extract data. JSON only. No explanation.

TODAY=${todayStr()} (${todayFormatted()})
TOMORROW=${tomorrowStr()}
MONTH=${currentMonth()}
${biz?.active_offer ? "ACTIVE OFFER THIS WEEK: " + biz.active_offer + "\n— If customer says CLAIM, mentions offer, discount, or is replying to a campaign message — confirm this offer applies and help them book." : ""}
SERVICES: ${svcNames}
ACTIVE BOOKINGS: ${activeBookings||"none"}
STATE: ${st}
HISTORY:
${hist||"none"}
CUSTOMER: ${firstName}
MESSAGE: "${message}"

INTENT OPTIONS:
book = new booking or wants to claim offer/deal
cancel = cancel booking
reschedule = change booking
confirm = yes/ok/sure/avunu/s/y/yep/yup/deal/sounds good — ANY confirmation
deny = no/nahi/vaddu/nope — clear rejection
show_services = asking about services/price/what you offer/how much
show_bookings = asking about their bookings IN ANY WAY
show_location = where are you/address
show_hours = timing/when open/working hours
set_reminder = wants reminder before appointment
provide_info = giving date/time/service name (mid-flow)
out_of_scope = sports/weather/news/jokes/politics/general knowledge
unclear = truly cannot determine

EXTRACTION RULES:
- today/aaj/ee roju = ${todayStr()}
- tomorrow/kal/nale = ${tomorrowStr()}
- "29th" no month = nearest future date in ${currentMonth()}
- 1pm-8pm: 13:00-20:00, 9am=09:00, 10/11/12=AM
- "5pm" = 17:00, "5:30pm" = 17:30, "10am" = 10:00
- confirmed=true for: yes/ok/sure/avunu/haan/confirm/s/y/yep/yup/deal/sounds good/perfect
- confirmed=false for: no/nahi/vaddu/don't/nope
- Service name typos: "automaton"="automation", "hair spaa"="hair spa" — match closest

RESPOND WITH ONLY THIS JSON:
{
  "intent": "<intent>",
  "extracted": {
    "service": "<exact name from list or null>",
    "date": "<YYYY-MM-DD or null>",
    "time": "<HH:MM 24hr or null>",
    "confirmed": <true or false>,
    "cancel_scope": "<all|specific|null>",
    "reminder_preference": "<2hrs|24hrs|null>"
  },
  "preferred_language": "<English|Telugu|Hindi|Tamil|null — only if explicitly requested>",
  "sentiment": "<happy|neutral|frustrated|upset>"
}`
}

// ── RULE-BASED FALLBACK — FIX 1: Added claim/offer intent ──────
function ruleBasedClassify(message, state, services) {
  const m=(message||"").toLowerCase().trim()
  const extracted={service:null,date:null,time:null,confirmed:false,cancel_scope:null,reminder_preference:null}
  let intent="unclear"

  if (CONFIRM_WORDS.test(m)) { intent="confirm"; extracted.confirmed=true }
  else if (PURE_NEGATION.test(m)) { intent="deny" }
  else if (/\b(cancel|cancle|cancell|రద్దు|रद्द)\b/i.test(m)) {
    intent="cancel"
    extracted.cancel_scope=/everything|all|sab|అన్నీ|सब/i.test(m)?"all":"specific"
  }
  else if (/\b(reschedule|change.*appointment|postpone|మార్చు|बदलना)\b/i.test(m)) intent="reschedule"
  else if (/\b(price|pricing|cost|charge|rate|how much|service|services|what.*offer|what.*have|menu)\b/i.test(m)) intent="show_services"
  else if (/\b(location|address|where|maps|directions|how.*reach)\b/i.test(m)) intent="show_location"
  else if (/\b(hours|timing|open|close|when.*open|working)\b/i.test(m)) intent="show_hours"
  else if (/\b(remind|reminder|notify|alert)\b/i.test(m)) {
    intent="set_reminder"
    extracted.reminder_preference=/2\s*hr|2\s*hour|two hour/i.test(m)?"2hrs":"24hrs"
  }
  else if (
    /\b(booking|appointment|booked|scheduled)s?\b/i.test(m) &&
    /\b(how many|do i have|my|any|list|show|check|tell|confirm|there|upcoming|active|status)\b/i.test(m)
  ) intent="show_bookings"
  // FIX 1: Claim/offer intent — customer replying to campaign
  else if (/\b(claim|redeem|avail|use offer|get offer|want offer|grab|interested|i want|book now)\b/i.test(m)) {
    intent="book"
  }
  else {
    const svc=extractServiceFromMessage(message,services)
    if (svc) { extracted.service=svc; intent="provide_info" }
    else if (extractDateFromMessage(message)) intent="provide_info"
    else if (extractTimeFromMessage(message)) intent="provide_info"
    else if (state?.stage&&state.stage!=="idle") intent="provide_info"
  }

  return { intent, extracted, sentiment:"neutral", preferred_language:null }
}

// ── QUICK ROUTE ────────────────────────────────────────────────
function quickRoute(message) {
  const m=(message||"").toLowerCase().trim()
  if (/^(hi|hello|hey|hii|hai|namaste|good morning|good evening|good afternoon|howdy|sup|wassup)[\s!.]*$/i.test(m)) return "greeting"
  if (/^(thank|thanks|thnx|thx|ty|thank you|thankyou|shukriya|dhanyavaad|thq|tq|thanks a lot|thank u)[\s!.]*$/i.test(m)) return "thanks"
  if (/^(bye|goodbye|see you|cya|later|take care|good night|goodnight|ok bye|okk bye|tc)[\s!.]*$/i.test(m)) return "bye"
  // FIX 3: Removed "ok|okay|done|perfect|great" from compliment — these are confirmations not compliments
  if (/^(good|awesome|amazing|excellent|wonderful|nice|cool|brilliant|superb|👍|🙏)[\s!.]*$/i.test(m)) return "compliment"
  if (/\b(ipl|cricket|football|soccer|fifa|worldcup|t20|odi|nba|nfl|epl)\b/i.test(m)&&!/\b(book|cancel|reschedule)\b/i.test(m)) return "sports"
  if (/\b(weather|rainfall|temperature|forecast|humidity|climate)\b/i.test(m)) return "weather"
  if (/\b(tell me a joke|crack a joke|say something funny|make me laugh)\b/i.test(m)) return "joke"
  if (/\b(who is modi|who is rahul|bjp|congress|election|prime minister of india|politics)\b/i.test(m)) return "politics"
  if (/\b(fuck|fck|shit|bastard|idiot|stupid|useless|worst|hate you|mf|mfr|bc|mc)\b/i.test(m)) return "abuse"
  return null
}

function quickReply(type, firstName, bizName) {
  const name=firstName||"there"
  const varied=[
    t("Not sure I got that! 😊 I handle bookings at *"+bizName+"* — can I help?","అర్థం కాలేదు! 😊 బుకింగ్‌లో సహాయం చేయగలను.","समझ नहीं आया! 😊 बुकिंग में मदद कर सकता हूं।","English"),
    t("Hmm! 😄 I'm great at bookings — want to schedule something?","😄 బుకింగ్‌లో మంచిగా చేస్తాను — ఏమైనా బుక్ చేయాలా?","😄 बुकिंग में अच्छा हूं — कुछ बुक करना है?","English"),
    t("That's outside my area! 😊 But bookings — I'm your person!","అది నా పరిధి కాదు! 😊 బుకింగ్‌లో నేను సహాయం చేయగలను!","वो मेरे area में नहीं! 😊 लेकिन बुकिंग में मदद कर सकता हूं!","English"),
  ]
  switch(type) {
    case "thanks":     return "You're welcome "+name+"! 😊 Let me know if you need anything else."
    case "bye":        return "Take care "+name+"! 😊 See you soon at *"+bizName+"*!"
    case "compliment": return "Thank you "+name+"! 😊 Anything I can help you book today?"
    case "sports":     return "Ha, wish I was watching too! 😄 I'm managing bookings at *"+bizName+"* — need to schedule something?"
    case "weather":    return "No idea — I'm indoors all day! 😂 Need to book something at *"+bizName+"*?"
    case "joke":       return "Why did the customer always come back? Service was too good to cancel 😄\n\nCan I book something for you?"
    case "politics":   return "Ha, that's above my pay grade 😄 I'm just here for bookings — can I help?"
    case "abuse":      return "I understand you might be frustrated "+name+" 😔 I'm here to help — what's going on?"
    default:           return varied[Math.floor(Math.random()*varied.length)]
  }
}

// ── REPLY BUILDER — FIX 1: Show active offer with service list ──
function buildReply(action, state, services, biz, lang, activeBookings) {
  const bizName=biz?.business_name||"us"
  const svc=state.service
  const displayDate=state.date?formatDate(state.date):null
  const displayTime=state.time?formatTime(state.time):null
  const svcList=(services||[]).map(s=>"• *"+s.name+"* — ₹"+s.price+(s.duration?" ("+s.duration+" min)":"")).join("\n")

  // FIX 1: Show active offer when listing services
  const offerLine = biz?.active_offer
    ? "\n\n🎁 *Active Offer:* " + biz.active_offer
    : ""

  switch(action) {
    case "collect_service":
      return t(
        "Which service would you like to book? 😊"+offerLine+"\n\n"+svcList,
        "మీకు ఏ సేవ కావాలి? 😊"+offerLine+"\n\n"+svcList,
        "कौन सी सेवा चाहिए? 😊"+offerLine+"\n\n"+svcList,
        lang
      )
    case "collect_date":
      return t(
        "What date works for your *"+svc+"*?",
        "*"+svc+"* కోసం తేదీ చెప్పండి?",
        "*"+svc+"* के लिए तारीख बताइए?",
        lang
      )
    case "collect_time":
      return t(
        "What time works for you on "+(displayDate||state.date)+"?",
        (displayDate||state.date)+"న ఏ సమయం కావాలి?",
        (displayDate||state.date)+" को कौन सा समय?",
        lang
      )
    case "confirm_booking":
      if (svc&&displayDate) {
        const tp=displayTime?" at "+displayTime:""
        const tpTe=displayTime?" "+displayTime+"కి":""
        const tpHi=displayTime?" "+displayTime+" को":""
        return t(
          "Shall I confirm *"+svc+"* on "+displayDate+tp+"? ✅",
          "*"+svc+"* "+displayDate+tpTe+" బుక్ చేయమా? ✅",
          "*"+svc+"* "+displayDate+tpHi+" बुक करें? ✅",
          lang
        )
      }
      return null
    case "show_services":
      return t(
        "*"+bizName+" Services*"+offerLine+"\n\n"+svcList+"\n\nWant to book any? 😊",
        "*"+bizName+" సేవలు*"+offerLine+"\n\n"+svcList+"\n\nబుక్ చేయాలా? 😊",
        "*"+bizName+" सेवाएं*"+offerLine+"\n\n"+svcList+"\n\nबुक करना है? 😊",
        lang
      )
    case "show_location":
      if (biz?.location) {
        return "📍 *"+bizName+"*\n"+biz.location+(biz.maps_link?"\n\n"+biz.maps_link:"")
      }
      return t("I'll get our location! 😊","లొకేషన్ తెలియజేస్తాను! 😊","लोकेशन बताता हूं! 😊",lang)
    case "show_hours":
      if (biz?.working_hours) {
        return t(
          "*"+bizName+"* is open:\n"+biz.working_hours+"\n\nAnything else? 😊",
          "*"+bizName+"* తెరిచి ఉంటుంది:\n"+biz.working_hours+"\n\nఇంకేమైనా? 😊",
          "*"+bizName+"* खुला है:\n"+biz.working_hours+"\n\nकुछ और? 😊",
          lang
        )
      }
      return t("I'll confirm our hours! 😊","సమయాలు తెలియజేస్తాను! 😊","समय बताता हूं! 😊",lang)
    case "show_bookings":
      if (activeBookings&&activeBookings!=="no upcoming bookings"&&activeBookings!=="none") {
        return t(
          "Here are your upcoming bookings:\n\n"+activeBookings+"\n\nNeed to reschedule or cancel any? 😊",
          "మీ రాబోయే బుకింగ్‌లు:\n\n"+activeBookings+"\n\nరీషెడ్యూల్ లేదా క్యాన్సిల్ చేయాలా? 😊",
          "आपकी upcoming बुकिंग:\n\n"+activeBookings+"\n\nरीशेड्यूल या रद्द करना है? 😊",
          lang
        )
      }
      return t(
        "You don't have any upcoming bookings right now. Want to book something? 😊",
        "మీకు ప్రస్తుతం బుకింగ్‌లు లేవు. బుక్ చేయాలా? 😊",
        "अभी कोई upcoming बुकिंग नहीं है। कुछ बुक करना है? 😊",
        lang
      )
    default:
      return null
  }
}

// ── SMART DEFAULT ──────────────────────────────────────────────
function buildSmartDefault(state, bizName, lang) {
  if (state?.stage&&state.stage!=="idle") {
    const map={
      "awaiting_service":      t("Which service would you like? 😊","ఏ సేవ కావాలి? 😊","कौन सी सेवा? 😊",lang),
      "awaiting_date":         t("What date works for you? 😊","తేదీ చెప్పండి? 😊","तारीख बताइए? 😊",lang),
      "awaiting_time":         t("What time works for you? 😊","సమయం చెప్పండి? 😊","समय బताइए? 😊",lang),
      "awaiting_confirmation": t("Shall I confirm this booking? ✅","బుకింగ్ నిర్ధారించమా? ✅","बुकिंग confirm करूं? ✅",lang),
    }
    if (map[state.stage]) return map[state.stage]
  }
  const opts=[
    t("Not sure I got that! 😊 I handle bookings at *"+bizName+"* — can I help you schedule something?","అర్థం కాలేదు! 😊 బుకింగ్‌లో సహాయం చేయగలను.","समझ नहीं आया! 😊 बुकिंग में मदद कर सकता हूं।",lang),
    t("Hmm, not my area! 😄 But bookings I'm great at — want to schedule something?","అది నాకు తెలియదు! 😄 కానీ బుకింగ్‌లో మంచిగా చేస్తాను.","वो नहीं पता! 😄 लेकिन बुकिंग में अच्छा हूं।",lang),
    t("That's a bit beyond me! 😊 I'm the receptionist at *"+bizName+"* — bookings are my thing!","అది నా పరిధి కాదు! 😊 నేను *"+bizName+"* రిసెప్షనిస్ట్‌ని.","वो मेरे बस का नहीं! 😊 मैं *"+bizName+"* का receptionist हूं।",lang),
  ]
  return opts[Math.floor(Math.random()*opts.length)]
}

// ── MAIN ORCHESTRATE ───────────────────────────────────────────
async function orchestrate({ userId, conversationId, phone, contactName, message, isMediaOnly }) {
  let context, state
  try {
    ;[context,state] = await Promise.all([
      loadContext({ userId, conversationId, phone }),
      loadState(conversationId)
    ])
  } catch(e) {
    console.error("❌ context/state load failed:",e.message)
    return "Hi! We're having a brief technical issue. Please try again in a moment 🙏"
  }

  const { biz, services, history, activeBookings } = context
  const firstName = (contactName||"").split(" ")[0]||"there"
  const bizName   = biz?.business_name||"us"

  if (isMediaOnly) return "Thanks for sharing! 😊 If you have any questions or want to book, just type here."

  // ── LANGUAGE ──────────────────────────────────────────────────
  const detectedLang = detectLanguage(message)
  let currentPreferred = state.preferred_language
  if (currentPreferred&&currentPreferred!=="English"&&detectedLang==="English"&&!/speak|language|english|telugu|hindi/i.test(message)) {
    currentPreferred=null
  }
  const replyLang = currentPreferred||detectedLang

  // ── QUICK ROUTE ───────────────────────────────────────────────
  const qType = quickRoute(message)
  if (qType==="greeting") {
    const svcPrev=services.slice(0,3).map(s=>s.name).join(", ")
    const offerLine = biz?.active_offer ? "\n\n🎁 *Active Offer:* "+biz.active_offer : ""
    return t(
      "Hi "+firstName+"! 👋 Welcome to *"+bizName+"*!"+(svcPrev?"\n\nWe offer: "+svcPrev+" and more.":"")+offerLine+"\n\nHow can I help today? 😊",
      "నమస్కారం "+firstName+"! 👋 *"+bizName+"*కి స్వాగతం!"+(svcPrev?"\n\nమేము: "+svcPrev+" అందిస్తున్నాము.":"")+offerLine+"\n\nమీకు ఎలా సహాయం చేయగలను? 😊",
      "नमस्ते "+firstName+"! 👋 *"+bizName+"* में स्वागत!"+(svcPrev?"\n\nहम देते हैं: "+svcPrev+"।":"")+offerLine+"\n\nकैसे मदद करूं? 😊",
      replyLang
    )
  }
  if (qType) return quickReply(qType, firstName, bizName)

  // ── FRESH STATE CLEAR ─────────────────────────────────────────
  if (!state.stage||state.stage==="idle") {
    state={
      ...state,
      service:null, date:null, time:null, staff:null,
      missing_fields:[], last_ai_question:null,
      clarification_for:[], confidence:{},
      preferred_language: currentPreferred||state.preferred_language
    }
  }

  // ── DIRECT EXTRACTION ─────────────────────────────────────────
  const msgDate    = extractDateFromMessage(message)
  const msgTime    = extractTimeFromMessage(message)
  const msgService = extractServiceFromMessage(message, services)

  if (msgDate&&!state.date)       state={...state,date:msgDate}
  if (msgTime&&!state.time)       state={...state,time:msgTime}
  if (msgService&&!state.service) state={...state,service:msgService}

  if (msgDate&&state.date&&msgDate!==state.date&&state.stage==="awaiting_confirmation") {
    state={...state,date:msgDate,time:msgTime||null}
  }

  // ── SARVAM ────────────────────────────────────────────────────
  let sarvamResult = null
  if (process.env.SARVAM_API_KEY) {
    const raw = await callSarvamWithRetry({
      model:"sarvam-m",
      messages:[{role:"user",content:buildSarvamPrompt({message,services,history,state,firstName,activeBookings,biz})}],
      max_tokens:200,
      temperature:0.1
    })
    sarvamResult = parseJSON(raw)
  }
  if (!sarvamResult) sarvamResult = ruleBasedClassify(message, state, services)

  const intent    = sarvamResult.intent||"unclear"
  const extracted = sarvamResult.extracted||{service:null,date:null,time:null,confirmed:false,cancel_scope:null,reminder_preference:null}

  // ── UPDATE STATE ──────────────────────────────────────────────
  let newState = Object.assign({}, state)

  if (sarvamResult.preferred_language&&sarvamResult.preferred_language!=="null") {
    newState.preferred_language=sarvamResult.preferred_language
  } else if (!currentPreferred&&detectedLang!=="English") {
    newState.preferred_language=detectedLang
  }

  if (!msgService&&extracted.service) {
    const matched=matchService(extracted.service,services)
    if (matched) newState.service=matched.name
  }
  if (!msgDate&&extracted.date) newState.date=extracted.date
  if (!msgTime&&extracted.time) {
    const nt=normalizeTime(extracted.time)
    if (nt) newState.time=nt
  }
  if (newState.time&&!newState.time.match(/^\d{2}:\d{2}$/)) {
    newState.time=normalizeTime(newState.time)||newState.time
  }

  // ── DETERMINE ACTION ──────────────────────────────────────────
  let action = "none"
  let confirmed = extracted.confirmed||false

  // FIX 3: isConfirmMsg checks CONFIRM_WORDS which now includes s/y/yep/yup/deal/sounds good
  const isConfirmMsg = CONFIRM_WORDS.test((message||"").trim())
  const isDenyMsg    = PURE_NEGATION.test((message||"").trim())

  // FIX 3: Also check sentiment-based confirmation
  // If stage is awaiting_confirmation and Sarvam says intent=confirm → book
  const sarvamConfirmed = intent==="confirm" || extracted.confirmed===true

  if (isConfirmMsg || sarvamConfirmed) {
    confirmed=true
    if (newState.stage==="reschedule_mode"&&newState.date&&newState.time) {
      action="do_reschedule"
    } else if (newState.stage==="awaiting_confirmation"&&newState.service&&newState.date) {
      action="do_booking"
    } else {
      action="confirm_booking"
    }
  } else if (isDenyMsg || intent==="deny") {
    confirmed=false
    if (newState.stage==="awaiting_confirmation") {
      return t(
        "No problem! What would you like to change — the service, date, or time? 😊",
        "సరే! మీరు ఏమి మార్చాలనుకుంటున్నారు — సేవ, తేదీ, లేదా సమయం? 😊",
        "कोई बात नहीं! क्या बदलना है — service, date, या time? 😊",
        replyLang
      )
    }
  } else if (intent==="show_services")  action="show_services"
  else if (intent==="show_bookings")    action="show_bookings"
  else if (intent==="show_location")    action="show_location"
  else if (intent==="show_hours")       action="show_hours"
  else if (intent==="set_reminder")     action="set_reminder"
  else if (intent==="cancel") {
    action="do_cancel"
    if (!extracted.cancel_scope) extracted.cancel_scope=/everything|all|sab|అన్నీ|सब/i.test(message)?"all":"specific"
  }
  else if (intent==="reschedule") {
    newState.date=null
    newState.time=null
    action="collect_date"
  }
  else if (intent==="out_of_scope") {
    const oos=[
      t("That's outside my expertise! 😄 I handle bookings at *"+bizName+"* — can I help you schedule something?","అది నా పరిధి కాదు! 😄 బుకింగ్‌లో సహాయం చేయగలను.","वो मेरे area में नहीं! 😄 बुकिंग में मदद कर సकता हूं।",replyLang),
      t("Hmm, not my thing! 😊 But I'm great at bookings — want to schedule something at *"+bizName+"*?","నాకు తెలియదు! 😊 కానీ బుకింగ్‌లో మంచిగా చేస్తాను.","वो नहीं पता! 😊 लेकिन बुकिंग में अच्छा हूं।",replyLang),
      t("Ha, that's a bit beyond me! 😄 I'm just the receptionist at *"+bizName+"* — need to book something?","అది చాలా పైన ఉంది! 😄 నేను *"+bizName+"* రిసెప్షనిస్ట్‌ని — బుక్ చేయాలా?","Ha, वो मेरे बस का नहीं! 😄 मैं *"+bizName+"* का receptionist हूं।",replyLang),
    ]
    return stripBadEmojis(oos[Math.floor(Math.random()*oos.length)])
  }
  else if (["book","provide_info","unclear"].includes(intent)||
           (newState.stage&&newState.stage!=="idle")) {
    if (newState.service&&newState.date&&newState.time) action="confirm_booking"
    else if (newState.service&&newState.date)           action="collect_time"
    else if (newState.service)                          action="collect_date"
    else if (newState.stage==="awaiting_service")       action="collect_service"
    else                                                action="collect_service"
  }

  const stageMap={
    "collect_service":"awaiting_service",
    "collect_date":"awaiting_date",
    "collect_time":"awaiting_time",
    "confirm_booking":"awaiting_confirmation",
    "do_booking":"awaiting_confirmation",
    "do_reschedule":"reschedule_mode",
    "escalate":"handoff_mode"
  }
  if (stageMap[action]) newState.stage=stageMap[action]

  // ── BUILD REPLY ───────────────────────────────────────────────
  let reply=buildReply(action,newState,services,biz,replyLang,activeBookings)
  if (!reply) reply=buildSmartDefault(state,bizName,replyLang)
  reply=stripBadEmojis(reply)

  // ── EXECUTE: Booking ──────────────────────────────────────────
  if (action==="do_booking"&&confirmed===true) {
    if (newState.service&&(newState.date||!isTimeBased(matchService(newState.service,services)))) {
      try {
        const result=await createBooking({
          userId,customerName:contactName,customerPhone:phone,
          customerId:null,state:newState,services,
          bizName:biz.business_name,language:replyLang
        })
        if (result.ok) {
          newState=clearBookingFields(newState)
          newState.stage="idle"
          newState.last_booking={
            service:result.booking.service,
            date:result.booking.booking_date,
            time:result.booking.booking_time,
            confirmed_at:Date.now()
          }
          await saveState(conversationId,newState)
          await supabaseAdmin.from("conversations")
            .update({last_message:"✅ Booking Confirmed — "+result.booking.service})
            .eq("id",conversationId)
          return result.confirmMsg
        } else if (result.slotFull) {
          newState.time=null
          await saveState(conversationId,newState)
          return result.message
        }
      } catch(e) {
        console.error("❌ createBooking threw:",e.message)
        return "Sorry, there was an issue saving your booking 😅 Please try again."
      }
    }
  }

  // ── EXECUTE: Cancel ───────────────────────────────────────────
  if (action==="do_cancel") {
    try {
      const cancelScope=extracted?.cancel_scope||"specific"
      if (cancelScope==="all") {
        const {data:all}=await supabaseAdmin.from("bookings")
          .select("id").eq("customer_phone",phone).eq("user_id",userId)
          .in("status",["confirmed","pending"]).gte("booking_date",todayStr())
        if (all?.length) {
          await supabaseAdmin.from("bookings").update({status:"cancelled"}).in("id",all.map(b=>b.id))
        }
      } else {
        if (newState.service||newState.date) {
          let q=supabaseAdmin.from("bookings").update({status:"cancelled"}).eq("customer_phone",phone).eq("user_id",userId).in("status",["confirmed","pending"])
          if (newState.service) q=q.ilike("service","%"+newState.service+"%")
          if (newState.date)    q=q.eq("booking_date",newState.date)
          await q
        } else {
          const {data:latest}=await supabaseAdmin.from("bookings").select("id")
            .eq("customer_phone",phone).eq("user_id",userId)
            .in("status",["confirmed","pending"]).gte("booking_date",todayStr())
            .order("booking_date",{ascending:true}).limit(1).maybeSingle()
          if (latest) await supabaseAdmin.from("bookings").update({status:"cancelled"}).eq("id",latest.id)
        }
      }
      newState=clearBookingFields(newState)
      await saveState(conversationId,newState)
      return t(
        "Your booking has been cancelled 😊 Let me know if you'd like to rebook!",
        "మీ బుకింగ్ రద్దు చేయబడింది 😊 మళ్ళీ బుక్ చేయాలంటే చెప్పండి!",
        "आपकी बुकिंग रद्द हो गई 😊 दोबारा बुक करना हो तो बताइए!",
        replyLang
      )
    } catch(e) { console.error("❌ Cancel failed:",e.message) }
  }

  // ── EXECUTE: Reschedule ───────────────────────────────────────
  if (action==="do_reschedule"&&confirmed===true&&newState.date&&newState.time) {
    try {
      const result=await rescheduleBooking({
        userId,customerPhone:phone,
        date:newState.date,time:newState.time,
        services,serviceName:newState.service,
        language:replyLang
      })
      if (result.ok) {
        newState=clearBookingFields(newState)
        newState.stage="idle"
        await saveState(conversationId,newState)
        return result.message
      }
      await saveState(conversationId,newState)
      return result.message
    } catch(e) { console.error("❌ Reschedule threw:",e.message) }
  }

  // ── EXECUTE: Set Reminder ─────────────────────────────────────
  if (action==="set_reminder"&&extracted.reminder_preference) {
    try {
      const {data:nb}=await supabaseAdmin.from("bookings").select("id")
        .eq("customer_phone",phone).eq("user_id",userId)
        .in("status",["confirmed","pending"])
        .gte("booking_date",todayStr())
        .order("booking_date",{ascending:true}).limit(1).maybeSingle()
      if (nb) await supabaseAdmin.from("bookings").update({reminder_preference:extracted.reminder_preference}).eq("id",nb.id)
      await saveState(conversationId,newState)
      return t(
        "Sure! I'll remind you "+(extracted.reminder_preference==="2hrs"?"2 hours":"a day")+" before your appointment. 😊",
        "తప్పకుండా! "+(extracted.reminder_preference==="2hrs"?"2 గంటల":"ఒక రోజు")+" ముందు రిమైండర్ పంపిస్తాను. 😊",
        "जरूर! "+(extracted.reminder_preference==="2hrs"?"2 घंटे":"एक दिन")+" पहले reminder भेजूंगा। 😊",
        replyLang
      )
    } catch(e) { console.error("❌ set_reminder failed:",e.message) }
  }

  // ── SAVE STATE ────────────────────────────────────────────────
  newState.failed_clarifications=(action==="none"&&reply.includes("?"))?(newState.failed_clarifications||0)+1:0
  try { await saveState(conversationId,newState) } catch(e) { console.error("❌ saveState failed:",e.message) }

  if (action==="escalate") {
    try {
      await supabaseAdmin.from("ai_event_log").insert({
        user_id:userId,stage:"handoff",
        input_json:{message},success:true,
        created_at:new Date().toISOString()
      })
    } catch(e) {}
  }

  return reply
}

module.exports = { orchestrate }
