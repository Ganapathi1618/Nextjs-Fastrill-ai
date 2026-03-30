// lib/ai/orchestrator.js — v3.2 PRODUCTION HARDENED
// Changes from v3.1:
//   - Sarvam call has 15s hard timeout (was: no timeout → silent hang)
//   - 2 automatic retries on timeout/network failure with exponential back-off
//   - Guaranteed reply: fallback ALWAYS fires if AI returns null/empty
//   - Structured error logging so Vercel logs show exactly what failed
//   - Negation safety guard retained from v3.1
//   - Echo fix: context is loaded before inbound message is saved (handled in webhook)

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

// ── Config ─────────────────────────────────────────────────────
const SARVAM_TIMEOUT_MS  = 15000  // 15s hard timeout per attempt
const SARVAM_MAX_RETRIES = 2      // 2 retries = 3 total attempts maximum

// ── Date helpers ───────────────────────────────────────────────
function pad(n) { return String(n).padStart(2, "0") }
function toDateStr(d) { return d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate()) }
function addDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return toDateStr(d) }
function todayStr()    { return toDateStr(new Date()) }
function tomorrowStr() { return addDays(1) }
function sleep(ms)     { return new Promise(r => setTimeout(r, ms)) }

// ── Negation guard ─────────────────────────────────────────────
const NEGATION_PATTERNS = [
  /^no\b/i, /^nahi\b/i, /^nope\b/i,
  /^vaddu\b/i, /^vaddhu\b/i, /^don'?t\b/i,
  /^cancel\s+it\b/i, /^not\s+now\b/i,
  /^wait\b/i, /^hold\b/i, /^stop\b/i,
]
function isNegation(message) {
  return NEGATION_PATTERNS.some(p => p.test((message || "").trim()))
}

// ── Sarvam call: timeout + retry ──────────────────────────────
// Root cause of "Hi" with no reply: Sarvam hung, fetch had no timeout,
// Vercel function waited until it hit its own limit, returned null,
// reply was empty string, nothing was sent.
// Fix: AbortController enforces 15s max. If it times out or errors,
// we retry up to 2 more times before giving up and using fallback.
async function callSarvamWithRetry(payload, attempt = 1) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SARVAM_TIMEOUT_MS)

  try {
    const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
      method:  "POST",
      headers: {
        "Content-Type":         "application/json",
        "api-subscription-key": process.env.SARVAM_API_KEY
      },
      body:   JSON.stringify(payload),
      signal: controller.signal
    })
    clearTimeout(timer)

    const data = await res.json()

    if (data?.error) {
      const code = data.error.code || data.error.status
      console.error("❌ Sarvam API error (attempt " + attempt + ") code=" + code + ":", data.error.message)
      // Auth/quota errors won't recover on retry — bail immediately
      if (code === 401 || code === 403 || code === 429) return null
      if (attempt <= SARVAM_MAX_RETRIES) {
        await sleep(800 * attempt)
        return callSarvamWithRetry(payload, attempt + 1)
      }
      return null
    }

    const content = data?.choices?.[0]?.message?.content || null
    if (!content) console.warn("⚠️ Sarvam returned empty content (attempt " + attempt + ")")
    return content

  } catch(e) {
    clearTimeout(timer)
    const reason = e.name === "AbortError" ? "TIMEOUT (" + SARVAM_TIMEOUT_MS + "ms)" : e.message
    console.error("❌ Sarvam " + reason + " (attempt " + attempt + ")")
    if (attempt <= SARVAM_MAX_RETRIES) {
      console.log("🔄 Retry " + (attempt + 1) + "/" + (SARVAM_MAX_RETRIES + 1) + "...")
      await sleep(800 * attempt)
      return callSarvamWithRetry(payload, attempt + 1)
    }
    console.error("💀 All Sarvam attempts failed — guaranteed fallback will fire")
    return null
  }
}

// ── Parse AI JSON decision ─────────────────────────────────────
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

// ── Master prompt ──────────────────────────────────────────────
function buildMasterPrompt({ message, biz, services, history, state, firstName, activeBookings }) {
  const bizName  = biz?.business_name || "this business"
  const bizType  = biz?.business_type || "business"
  const svcList  = services.map(s =>
    s.name + " ₹" + s.price +
    (s.duration    ? " " + s.duration + "min" : "") +
    (s.description ? " (" + s.description + ")" : "")
  ).join("\n") || "no services configured"

  const historyText = (history || []).slice(-8).map(m =>
    (m.role === "user" ? "Customer" : "You") + ": " + m.content
  ).join("\n")

  const stateLines = []
  if (state.service)            stateLines.push("Already have service: " + state.service)
  if (state.date)               stateLines.push("Already have date: " + state.date)
  if (state.time)               stateLines.push("Already have time: " + state.time)
  if (state.stage && state.stage !== "idle") stateLines.push("Current stage: " + state.stage)
  if (state.preferred_language) stateLines.push("⚠️ MUST reply in " + state.preferred_language + " — customer requested this")
  const stateText = stateLines.length ? stateLines.join("\n") : "Fresh conversation — nothing collected yet"

  const todayFormatted = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: "Asia/Kolkata"
  })

  return `You are an AI receptionist for *${bizName}* (${bizType}).
Today is ${todayFormatted}.

SERVICES AVAILABLE:
${svcList}

BUSINESS INFO:
${biz?.working_hours ? "Hours: " + biz.working_hours : ""}
${biz?.location ? "Location: " + biz.location : ""}
${biz?.maps_link ? "Maps: " + biz.maps_link : ""}
${biz?.ai_instructions ? "Owner instructions: " + biz.ai_instructions : ""}

CONVERSATION SO FAR:
${historyText || "(new conversation)"}

BOOKING STATE: ${stateText}

CUSTOMER'S ACTIVE BOOKINGS:
${activeBookings || "no upcoming bookings"}

CUSTOMER NAME: ${firstName}
CUSTOMER MESSAGE: "${message}"

YOUR JOB:
You are a warm, intelligent receptionist. You understand context and intent.
You NEVER give a generic greeting when the customer clearly states their intent.
If they say "need reschedule" or "want to cancel" — act on it immediately, don't greet.
You never repeat yourself. You ask one clarifying question at a time.
Match the customer's language — Telugu reply for Telugu, Hindi for Hindi.

LANGUAGE RULE (CRITICAL):
- Detect the language of the customer's message
- Reply in that SAME language always
- If customer says "reply in english" / "english lo" → switch and STAY in English
- Preferred language from state: ${state.preferred_language || "not set — detect from message"}

CONFIRMATION vs NEGATION (CRITICAL):
- confirmed=true ONLY for: yes, ok, okay, sure, haan, avunu, sare, confirm, proceed, do it
- confirmed=false for: no, nope, nahi, vaddu, don't, wait, hold on, not now, stop
- "no book it" → confirmed=false. The word "no" at the start = ALWAYS confirmed=false.
- NEVER set confirmed=true if message starts with no/nahi/vaddu/nope
- When confirmed=false during confirm_booking: ask what they'd like to change

BOOKING LOGIC:
- Need: service + date + time (for time-based services)
- Collect one missing field at a time — never ask multiple things at once
- "same time" or "same slot" = use already-selected time: ${state.time || "none"}
- "today" = ${todayStr()}, "tomorrow" = ${tomorrowStr()}
- Confirm before booking. Never book without explicit yes.

RESCHEDULE LOGIC:
- action="do_reschedule" only after: service + new date + new time + confirmation
- action="collect_date" if service known but no new date
- action="collect_time" if service + date known but no new time
- action="confirm_booking" when all 3 collected — ask customer to confirm

CANCEL LOGIC:
- Recognize typos: cancle/cancell/canel = cancel
- "cancel everything" → action="do_cancel", cancel_scope="all"
- "cancel all except 27th march 5pm" → cancel_scope="all", keep_date="2026-03-27", keep_time="17:00"
- "cancel [specific]" → cancel_scope="specific"
- NEVER show the booking menu when customer wants to cancel

IMPORTANT RULES:
1. If customer asks price/location/hours mid-booking — answer, then resume booking
2. Never say "I don't understand" — map to closest intent
3. If unclear, ask ONE clarifying question
4. Never repeat the same response twice in a row
5. Keep replies short — 2-3 lines max unless listing services
6. Never invent services or prices not listed above
7. NEVER use raw dates like "2026-03-27" in replies — say "Tuesday, 31 March"

RESPOND WITH ONLY THIS JSON (no markdown, no preamble, no explanation):
{
  "reply": "<your reply to the customer in their language>",
  "action": "<none | collect_service | collect_date | collect_time | confirm_booking | do_booking | do_reschedule | do_cancel | show_services | show_location | show_hours | escalate>",
  "extracted": {
    "service": "<service name or null>",
    "date": "<YYYY-MM-DD or null>",
    "time": "<HH:MM 24hr or null>",
    "confirmed": <true or false — NEVER true if message starts with no/nahi/vaddu>,
    "cancel_scope": "<all | specific | null>",
    "keep_date": "<YYYY-MM-DD or null>",
    "keep_time": "<HH:MM or null>"
  },
  "preferred_language": "<English | Telugu | Hindi | Tamil | null — only when customer explicitly requests>",
  "language": "<detected language name>"
}`
}

// ── Smart fallback when AI is completely down ──────────────────
// Detects rough intent from raw message so customer never gets silence.
function buildSafeFallback({ message, state, biz, services, firstName }) {
  const msg = (message || "").toLowerCase().trim()

  let intent = { primary_intent: "out_of_scope", sentiment: "neutral" }

  if (/^(hi|hello|hey|hii|hai|namaste|నమస్కారం|హలో)\b/i.test(msg)) {
    intent.primary_intent = "greeting"
  } else if (/\b(price|cost|charge|fee|rate|how much|ధర|రేటు|ఎంత)\b/i.test(msg)) {
    intent.primary_intent = "pricing"
  } else if (/\b(book|appointment|slot|schedule|fix|బుక్|అపాయింట్మెంట్)\b/i.test(msg)) {
    intent.primary_intent = "booking_new"
  } else if (/\b(reschedule|change|shift|postpone|మార్చు)\b/i.test(msg)) {
    intent.primary_intent = "booking_reschedule"
  } else if (/\b(cancel|cancle|cancell|రద్దు)\b/i.test(msg)) {
    intent.primary_intent = "booking_cancel"
  } else if (/\b(where|location|address|map|చిరునామా)\b/i.test(msg)) {
    intent.primary_intent = "location_query"
  } else if (/\b(time|hour|open|close|timing|సమయం)\b/i.test(msg)) {
    intent.primary_intent = "hours_query"
  } else if (state?.stage && state.stage !== "idle") {
    // Mid-flow: treat as booking continuation
    intent.primary_intent = "booking_new"
  }

  return getFallbackReply({ intent, state, biz, services, firstName, message })
}

// ── Main orchestrate ───────────────────────────────────────────
async function orchestrate({ userId, conversationId, phone, contactName, message, isMediaOnly }) {
  console.log("\n🎯 ORCHESTRATOR v3.2 | " + phone + " | \"" + (message||"").substring(0, 60) + "\"")
  const start = Date.now()

  // Load context + state — wrapped so DB failures don't cause silence
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

  // ── AI call with timeout + retry ───────────────────────────
  let decision = null

  if (process.env.SARVAM_API_KEY) {
    const raw = await callSarvamWithRetry({
      model:       "sarvam-m",
      messages:    [{ role: "user", content: buildMasterPrompt({ message, biz, services, history, state, firstName, activeBookings }) }],
      max_tokens:  600,
      temperature: 0.4
    })

    if (raw) {
      decision = parseAIDecision(raw)
      if (decision) {
        console.log("✅ AI ok | action=" + decision.action + " lang=" + (decision.language||"?") + " | " + (Date.now()-start) + "ms")
      } else {
        console.warn("⚠️ AI response unparseable — falling back")
      }
    } else {
      console.warn("⚠️ Sarvam null after all retries — falling back")
    }
  } else {
    console.warn("⚠️ SARVAM_API_KEY not set")
  }

  // ── GUARANTEED FALLBACK ────────────────────────────────────
  // Customer NEVER gets silence. If AI failed for any reason:
  if (!decision) {
    const fallbackReply = buildSafeFallback({ message, state, biz, services, firstName })
    console.log("⚡ Fallback reply sent | " + (Date.now()-start) + "ms")
    try { await saveState(conversationId, state) } catch(e) {}
    return fallbackReply
  }

  // ── Language ───────────────────────────────────────────────
  let newState = Object.assign({}, state)
  if (decision.preferred_language && decision.preferred_language !== "null") {
    newState.preferred_language = decision.preferred_language
    console.log("🌐 Language saved:", decision.preferred_language)
  }

  const extracted = decision.extracted || {}
  let   action    = decision.action || "none"

  // ── NEGATION SAFETY GUARD ──────────────────────────────────
  if (isNegation(message) && (extracted.confirmed === true || action === "do_booking")) {
    console.warn("⛔ Negation guard | blocked booking for msg:", message)
    extracted.confirmed = false
    if (action === "do_booking") action = "confirm_booking"
  }

  // ── Update state ───────────────────────────────────────────
  const isReschedule = ["do_reschedule","collect_date","collect_time","confirm_booking"].includes(action)

  if (extracted.service) {
    const matched = matchService(extracted.service, services)
    if (matched && (!newState.service || isReschedule)) {
      newState.service = matched.name
      console.log("📌 Service:", matched.name)
    }
  }
  if (extracted.date) newState.date = extracted.date
  if (extracted.time) newState.time = extracted.time

  let reply = decision.reply || ""

  // ── Execute: Booking ───────────────────────────────────────
  if (action === "do_booking") {
    console.log("📋 do_booking | svc:", newState.service, "| date:", newState.date, "| time:", newState.time, "| confirmed:", extracted.confirmed)
    if (newState.service && (newState.date || !isTimeBased(matchService(newState.service, services)))) {
      if (extracted.confirmed === true) {
        try {
          const result = await createBooking({
            userId, customerName: contactName, customerPhone: phone,
            customerId: null, state: newState, services, bizName: biz.business_name
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

  // ── Execute: Cancel ────────────────────────────────────────
  if (action === "do_cancel") {
    try {
      const todayDate = new Date().toISOString().split("T")[0]
      const cancelScope = extracted?.cancel_scope

      if (cancelScope === "all") {
        const { data: allBookings } = await supabaseAdmin
          .from("bookings")
          .select("id, service, booking_date, booking_time")
          .eq("customer_phone", phone)
          .eq("user_id", userId)
          .in("status", ["confirmed","pending"])
          .gte("booking_date", todayDate)

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
            await supabaseAdmin.from("bookings")
              .update({ status: "cancelled" })
              .in("id", toCancel.map(b => b.id))
            console.log("✅ Cancelled", toCancel.length, "bookings")
          }
        }
      } else if (newState.service || newState.date) {
        let q = supabaseAdmin.from("bookings")
          .update({ status: "cancelled" })
          .eq("customer_phone", phone)
          .eq("user_id", userId)
          .in("status", ["confirmed","pending"])
        if (newState.service) q = q.ilike("service", "%" + newState.service + "%")
        if (newState.date)    q = q.eq("booking_date", newState.date)
        if (newState.time)    q = q.eq("booking_time", newState.time)
        await q
        console.log("✅ Cancelled specific booking")
      }

      newState = clearBookingFields(newState)
      await saveState(conversationId, newState)
      return reply || buildSafeFallback({ message, state: newState, biz, services, firstName })
    } catch(e) {
      console.error("❌ Cancel failed:", e.message)
    }
  }

  // ── Execute: Reschedule ────────────────────────────────────
  if (action === "do_reschedule") {
    if (newState.date && newState.time && extracted.confirmed === true) {
      try {
        console.log("🔄 Reschedule:", newState.service, newState.date, newState.time)
        const result = await rescheduleBooking({
          userId, customerPhone: phone,
          date: newState.date, time: newState.time,
          services, serviceName: newState.service
        })
        if (result.ok) {
          newState = clearBookingFields(newState)
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

  // ── Update stage ───────────────────────────────────────────
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
        input_json: { phone, message },
        success: true, created_at: new Date().toISOString()
      })
    } catch(e) {}
  }

  // Final line: ALWAYS return something. Never empty string.
  return reply || buildSafeFallback({ message, state: newState, biz, services, firstName })
}

module.exports = { orchestrate }
