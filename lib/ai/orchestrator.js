// lib/ai/orchestrator.js — v3.0 AI-FIRST architecture
// Sarvam AI makes ALL decisions. Code only handles booking DB operations.
// No keyword matching. No intent routing. AI is the brain, code is the hands.

const { generateReply }     = require("./reply-engine")
const { getFallbackReply }  = require("./fallback-engine")
const { loadContext }       = require("../memory/context-engine")
const { loadState, saveState, clearBookingFields } = require("../memory/state-engine")
const { createBooking, rescheduleBooking } = require("../booking/booking-engine")
const { matchService, isTimeBased }        = require("../booking/slot-engine")
const { buildConfirmQuestion, formatDate } = require("../booking/calendar-engine")
const { createClient } = require("@supabase/supabase-js")

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ── Pure functions for date/time (no month overflow bugs) ──────
function pad(n) { return String(n).padStart(2, "0") }
function toDateStr(d) { return d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate()) }
function addDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return toDateStr(d) }
function todayStr()    { return toDateStr(new Date()) }
function tomorrowStr() { return addDays(1) }

// ── Extract booking fields from AI JSON decision ───────────────
function parseAIDecision(raw) {
  if (!raw) return null
  try {
    // Strip think tags
    let clean = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim()
    if (clean.includes("<think>")) clean = clean.split("<think>")[0].trim()
    // Find JSON block
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    return JSON.parse(jsonMatch[0])
  } catch(e) {
    return null
  }
}

// ── The single prompt that drives EVERYTHING ───────────────────
function buildMasterPrompt({ message, biz, services, history, state, firstName }) {
  const bizName   = biz?.business_name || "this business"
  const bizType   = biz?.business_type || "business"
  const svcList   = services.map(s =>
    s.name + " ₹" + s.price + (s.duration ? " " + s.duration + "min" : "") +
    (s.description ? " (" + s.description + ")" : "")
  ).join(", ") || "no services configured"
  const langName  = biz?.ai_language || "English"

  // Build conversation context
  const historyText = (history || []).map(m =>
    (m.role === "user" ? "Customer" : "Assistant") + ": " + m.content
  ).join("\n")

  // Current booking state
  const stateText = [
    state.service ? "Service selected: " + state.service : "",
    state.date    ? "Date selected: " + state.date : "",
    state.time    ? "Time selected: " + state.time : "",
    state.stage && state.stage !== "idle" ? "Current stage: " + state.stage : "",
  ].filter(Boolean).join(", ") || "No active booking"

  // Today's date for context
  const now = new Date()
  const todayFormatted = now.toLocaleDateString("en-IN", {
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

CUSTOMER NAME: ${firstName}
CUSTOMER MESSAGE: "${message}"

YOUR JOB:
Respond like a warm, intelligent human receptionist — not a bot.
You understand context. You remember what was said before.
You never repeat yourself. You ask one question at a time.
You handle any language naturally — if they write in Telugu, reply in Telugu.
If they write in Hindi, reply in Hindi. Match their language always.

LANGUAGE RULE (CRITICAL):
- Detect the language of the customer's message
- Reply in that SAME language
- If they ask "do you know X language?" — say YES and switch to that language
- Never reply in English when customer writes in another language

BOOKING LOGIC:
- To book: you need service + date + time (for time-based services)
- Collect one missing field at a time — don't ask for everything at once
- "same time" or "same slot" = use the already-selected time: ${state.time || "none"}
- "today" = ${todayStr()}, "tomorrow" = ${tomorrowStr()}
- When all 3 fields collected, confirm before booking
- Never book without explicit confirmation (yes/ok/haan/avunu/sare etc)

IMPORTANT RULES:
1. If customer is mid-booking and asks something else (price, location, hours) — answer it, then resume booking
2. Never say "I don't understand" — always map to closest intent
3. If genuinely unclear, ask ONE clarifying question
4. Never repeat the same response twice in a row
5. Keep replies short — 2-3 lines max unless listing services
6. Never make up services, prices, or availability not listed above

RESPOND WITH JSON (no other text, no markdown, no explanation):
{
  "reply": "<your reply to the customer in their language>",
  "action": "<one of: none | collect_service | collect_date | collect_time | confirm_booking | do_booking | do_reschedule | show_services | show_location | show_hours | escalate>",
  "extracted": {
    "service": "<service name from list or null>",
    "date": "<YYYY-MM-DD or null>",
    "time": "<HH:MM 24hr or null>",
    "confirmed": <true or false or null>
  },
  "language": "<detected language name>"
}`
}

async function orchestrate({ userId, conversationId, phone, contactName, message, isMediaOnly }) {
  console.log("\n🎯 ORCHESTRATOR v3 | " + phone + " | \"" + (message||"").substring(0,60) + "\"")
  const start = Date.now()

  const [context, state] = await Promise.all([
    loadContext({ userId, conversationId, phone }),
    loadState(conversationId)
  ])

  const { biz, services, history } = context
  const firstName = (contactName||"").split(" ")[0] || "there"

  if (isMediaOnly) {
    return "Thanks for sharing! 😊 If you have any questions or want to book, just type here."
  }

  // ── Call Sarvam AI with the master prompt ─────────────────────
  let decision = null

  if (process.env.SARVAM_API_KEY) {
    try {
      const prompt = buildMasterPrompt({ message, biz, services, history, state, firstName })

      const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-subscription-key": process.env.SARVAM_API_KEY
        },
        body: JSON.stringify({
          model: "sarvam-m",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 600,
          temperature: 0.4  // Lower = more consistent, less hallucination
        })
      })

      const data = await res.json()
      if (!data?.error) {
        const raw = data?.choices?.[0]?.message?.content || ""
        decision = parseAIDecision(raw)
        if (decision) {
          console.log("✅ AI decision: action=" + decision.action + " lang=" + (decision.language||"?") + " | " + (Date.now()-start) + "ms")
        } else {
          console.warn("⚠️ AI returned non-JSON:", raw.substring(0, 100))
        }
      } else {
        console.error("❌ Sarvam error:", data.error.message)
      }
    } catch(e) {
      console.error("❌ Sarvam exception:", e.message)
    }
  }

  // ── If AI failed, use smart fallback ─────────────────────────
  if (!decision) {
    console.log("⚡ Using rule-based fallback")
    return getFallbackReply({ state, biz, services, firstName, message, intent: null })
  }

  // ── Update state with AI-extracted entities ───────────────────
  let newState = Object.assign({}, state)

  const extracted = decision.extracted || {}

  // Only update if AI found something new
  if (extracted.service && !newState.service) {
    const matched = matchService(extracted.service, services)
    if (matched) newState.service = matched.name
  }
  if (extracted.date && !newState.date) {
    newState.date = extracted.date
  }
  if (extracted.time && !newState.time) {
    newState.time = extracted.time
  }

  // ── Execute action ────────────────────────────────────────────
  const action = decision.action || "none"
  let reply    = decision.reply || ""

  // Handle booking execution actions
  if (action === "do_booking") {
    if (newState.service && (newState.date || !isTimeBased(matchService(newState.service, services)))) {
      if (extracted.confirmed === true) {
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
        } else {
          await saveState(conversationId, newState)
          return reply || "Sorry, had trouble saving 😅 Please try again."
        }
      }
    }
    // Not enough info or not confirmed — just use AI reply
  }

  if (action === "do_reschedule") {
    if (newState.date && newState.time) {
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
    }
  }

  // Update stage based on action
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
  if (action === "none" || action === "show_services" || action === "show_location" || action === "show_hours") {
    // Don't change stage for informational replies
  }

  // Track failed clarifications
  if (action === "none" && !reply.includes("?") === false) {
    newState.failed_clarifications = (newState.failed_clarifications || 0) + 1
  } else {
    newState.failed_clarifications = 0
  }

  await saveState(conversationId, newState)

  // Log to analytics if escalated
  if (action === "escalate") {
    try {
      await supabaseAdmin.from("ai_event_log").insert({
        user_id: userId, stage: "handoff",
        input_json: { phone, message },
        success: true, created_at: new Date().toISOString()
      })
    } catch(e) {}
  }

  return reply || getFallbackReply({ state: newState, biz, services, firstName, message, intent: null })
}

module.exports = { orchestrate }
