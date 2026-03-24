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
function buildMasterPrompt({ message, biz, services, history, state, firstName, activeBookings }) {
  const bizName   = biz?.business_name || "this business"
  const bizType   = biz?.business_type || "business"
  const svcList   = services.map(s =>
    s.name + " ₹" + s.price + (s.duration ? " " + s.duration + "min" : "") +
    (s.description ? " (" + s.description + ")" : "")
  ).join("\n") || "no services configured"
  const langName  = biz?.ai_language || "English"

  // Build conversation context — last 8 messages for clarity
  const historyText = (history || []).slice(-8).map(m =>
    (m.role === "user" ? "Customer" : "You") + ": " + m.content
  ).join("\n")

  // Current booking state — be explicit about what we know
  const stateLines = []
  if (state.service) stateLines.push("Already have service: " + state.service)
  if (state.date)    stateLines.push("Already have date: " + state.date)
  if (state.time)    stateLines.push("Already have time: " + state.time)
  if (state.stage && state.stage !== "idle") stateLines.push("Current stage: " + state.stage)
  const stateText = stateLines.length ? stateLines.join("\n") : "Fresh conversation — nothing collected yet"

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

CUSTOMER'S ACTIVE BOOKINGS (from database — use this for reschedule/cancel):
${activeBookings || "no upcoming bookings"}

CUSTOMER NAME: ${firstName}
CUSTOMER MESSAGE: "${message}"

YOUR JOB:
You are a warm, intelligent receptionist. You understand context and intent.
You NEVER give a generic greeting when the customer clearly states their intent.
If they say "need reschedule" or "want to cancel" — act on it immediately, don't greet.
If they say "reschedule" — ask which service if unclear, or proceed if you know it.
You never repeat yourself. You ask one clarifying question at a time.
Match the customer's language — Telugu reply for Telugu, Hindi for Hindi.

LANGUAGE RULE (CRITICAL):
- Detect the language of the customer's message
- Reply in that SAME language always
- If customer says "reply in english" or "speak english" or "english lo" → switch to English and STAY in English for all future replies
- If customer says "i need in english language" → reply in English from now on
- Preferred language from state: ${state.preferred_language || "not set — detect from message"}
- NEVER ignore an explicit language request

BOOKING LOGIC:
- To book: you need service + date + time (for time-based services)
- Collect one missing field at a time — don't ask for everything at once
- "same time" or "same slot" = use the already-selected time: ${state.time || "none"}
- "today" = ${todayStr()}, "tomorrow" = ${tomorrowStr()}
- When all 3 fields collected, confirm before booking
- Never book without explicit confirmation (yes/ok/haan/avunu/sare etc)

RESCHEDULE LOGIC (CRITICAL):
- When customer mentions reschedule + a specific service (e.g. "automation"), extract that service
- Set action = "do_reschedule" only after you have new date + time + confirmation
- Set action = "collect_date" if you have service but no new date
- Set action = "collect_time" if you have service + date but no new time
- Set action = "confirm_booking" when you have service + new date + new time, ask customer to confirm
- ALWAYS extract the service name from what the customer mentions, even in past tense ("I booked automation")
- The extracted.service field must be the service they want to reschedule

CANCEL LOGIC (CRITICAL):
- If customer says "cancel it" or "cancel my booking" — ask which booking if multiple exist
- If customer says "cancel everything" or "cancel all" — set action="do_cancel", cancel_scope="all"
- If customer says "cancel all except X" — set action="do_cancel", cancel_scope="all", and preserve the exception in your reply
- If customer says "cancel [specific service/date]" — set action="do_cancel", cancel_scope="specific"
- Always confirm with the customer what was cancelled in your reply
- NEVER show the booking menu when customer wants to cancel — that's the wrong action

IMPORTANT RULES:
1. If customer is mid-booking and asks something else (price, location, hours) — answer it, then resume booking
2. Never say "I don't understand" — always map to closest intent
3. If genuinely unclear, ask ONE clarifying question
4. Never repeat the same response twice in a row
5. Keep replies short — 2-3 lines max unless listing services
6. Never make up services, prices, or availability not listed above
7. NEVER use raw date format like "2026-03-27" in your reply — always say "Friday, 27 March" or "27th March"
8. Convert all dates to human-readable format before putting them in your reply

RESPOND WITH JSON (no other text, no markdown, no explanation):
{
  "reply": "<your reply to the customer in their language>",
  "action": "<one of: none | collect_service | collect_date | collect_time | confirm_booking | do_booking | do_reschedule | do_cancel | show_services | show_location | show_hours | escalate>",
  "extracted": {
    "service": "<service name from list or null>",
    "date": "<YYYY-MM-DD or null>",
    "time": "<HH:MM 24hr or null>",
    "confirmed": <true or false or null>,
    "cancel_scope": "<all | specific | null — 'all' means cancel all except specified>"
  },
  "preferred_language": "<English | Telugu | Hindi | Tamil | null — set this when customer requests a specific language>",
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

  const { biz, services, history, activeBookings } = context
  const firstName = (contactName||"").split(" ")[0] || "there"

  if (isMediaOnly) {
    return "Thanks for sharing! 😊 If you have any questions or want to book, just type here."
  }

  // ── Call Sarvam AI with the master prompt ─────────────────────
  let decision = null

  if (process.env.SARVAM_API_KEY) {
    try {
      const prompt = buildMasterPrompt({ message, biz, services, history, state, firstName, activeBookings })

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
  const action = decision.action || "none"

  // For reschedule: ALWAYS update service/date/time from AI extraction
  // because state might have stale service from a previous booking flow
  const isReschedule = action === "do_reschedule" || action === "collect_date" ||
                       action === "collect_time" || action === "confirm_booking"

  if (extracted.service) {
    const matched = matchService(extracted.service, services)
    // Always update service for reschedule, or when state is empty
    if (matched && (!newState.service || isReschedule)) {
      newState.service = matched.name
      console.log("📌 Service set to:", matched.name)
    }
  }
  // Always update date/time when AI provides them
  if (extracted.date) newState.date = extracted.date
  if (extracted.time) newState.time = extracted.time

  // ── Execute action ────────────────────────────────────────────
  let reply = decision.reply || ""

  // Handle booking execution actions
  if (action === "do_booking") {
    console.log("📋 do_booking | service:", newState.service, "date:", newState.date, "time:", newState.time, "confirmed:", extracted.confirmed)
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

  // ── Cancel handler ───────────────────────────────────────────
  if (action === "do_cancel") {
    try {
      const todayStr = new Date().toISOString().split("T")[0]
      const cancelScope = extracted?.cancel_scope

      if (cancelScope === "all") {
        // Cancel ALL future bookings for this customer
        // But preserve any exception the customer mentioned (e.g. "except 27th march 5pm")
        const { data: allBookings } = await supabaseAdmin
          .from("bookings")
          .select("id, service, booking_date, booking_time")
          .eq("customer_phone", phone)
          .eq("user_id", userId)
          .in("status", ["confirmed","pending"])
          .gte("booking_date", todayStr)

        if (allBookings?.length) {
          // Find which ones to keep (AI reply mentions the exception)
          // Keep bookings that match the exception date/time in the reply
          const keepDate  = newState.date  || null
          const keepTime  = newState.time  || null

          const toCancel = allBookings.filter(b => {
            if (!keepDate && !keepTime) return true // cancel all
            if (keepDate && keepTime) return !(b.booking_date === keepDate && b.booking_time === keepTime)
            if (keepDate) return b.booking_date !== keepDate
            return true
          })

          if (toCancel.length) {
            await supabaseAdmin.from("bookings")
              .update({ status: "cancelled" })
              .in("id", toCancel.map(b => b.id))
            console.log("✅ Cancelled", toCancel.length, "bookings for", phone)
          }
        }
      } else if (newState.service || newState.date) {
        // Cancel specific booking
        let q = supabaseAdmin.from("bookings")
          .update({ status: "cancelled" })
          .eq("customer_phone", phone)
          .eq("user_id", userId)
          .in("status", ["confirmed","pending"])

        if (newState.service) q = q.ilike("service", "%" + newState.service + "%")
        if (newState.date)    q = q.eq("booking_date", newState.date)
        if (newState.time)    q = q.eq("booking_time", newState.time)

        await q
        console.log("✅ Cancelled specific booking for", phone)
      }

      newState = clearBookingFields(newState)
      await saveState(conversationId, newState)
      return reply // AI already composed the cancellation message
    } catch(e) {
      console.error("❌ Cancel failed:", e.message)
    }
  }

  if (action === "do_reschedule") {
    // Only execute if customer explicitly confirmed (yes/ok/haan/avunu etc)
    if (newState.date && newState.time && extracted.confirmed === true) {
      console.log("🔄 Executing reschedule:", newState.service, newState.date, newState.time)
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
    // Not confirmed yet — AI reply handles the confirmation question
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
