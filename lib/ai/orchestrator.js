// lib/ai/orchestrator.js
// The brain — runs the full pipeline for every message
// Each step is isolated — one failure never crashes the whole pipeline

const { classifyMessage } = require("./classifier")
const { extractEntities } = require("./extractor")
const { generateReply } = require("./reply-engine")
const { getFallbackReply } = require("./fallback-engine")
const { loadContext, retrieveChunks } = require("../memory/context-engine")
const { loadState, saveState, clearBookingFields, pushInterruption } = require("../memory/state-engine")
const { createBooking, rescheduleBooking } = require("../booking/booking-engine")
const { matchService, isTimeBased } = require("../booking/slot-engine")
const { buildConfirmQuestion } = require("../booking/calendar-engine")
const { upsertLead } = require("../crm/customer-engine")
const { createClient } = require("@supabase/supabase-js")

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function orchestrate({
  userId, conversationId, phone, contactName,
  message, isMediaOnly, phoneNumberId
}) {
  console.log("\n🎯 ORCHESTRATOR | " + phone + " | \"" + (message||"").substring(0,60) + "\"")

  // ── Load everything in parallel ──────────────────────────────
  const [context, state] = await Promise.all([
    loadContext({ userId, conversationId, phone }),
    loadState(conversationId)
  ])

  const { biz, services, history, chunks } = context
  const firstName = (contactName || "").split(" ")[0] || "there"

  // ── Media only ───────────────────────────────────────────────
  if (isMediaOnly) {
    return "Thanks for sharing! 😊 If you have any questions or want to book, just type here."
  }

  // ── STEP 1 + 2: Classify and Extract in parallel ─────────────
  const [classification, entities] = await Promise.all([
    classifyMessage({ message, history, biz }),
    extractEntities({ message, history, services, state })
  ])

  console.log("📊 Intent: " + classification.primary_intent + " | Sentiment: " + classification.sentiment + " | Conf: " + classification.confidence)
  console.log("📦 service=" + (entities.service||"null") + " date=" + (entities.date||"null") + " time=" + (entities.time||"null") + " confirm=" + entities.confirmation)

  const intent = classification.primary_intent

  // ── STEP 3: Update state from entities ───────────────────────
  let newState = Object.assign({}, state, { turns: (state.turns || 0) + 1 })

  // Merge newly extracted entities into state
  if (entities.service && !newState.service) newState.service = entities.service
  if (entities.date    && !newState.date)    newState.date    = entities.date
  if (entities.time    && !newState.time)    newState.time    = entities.time

  // Reschedule always updates date/time
  if (intent === "booking_reschedule") {
    if (entities.date) newState.date = entities.date
    if (entities.time) newState.time = entities.time
  }

  newState.primary_intent          = intent
  newState.last_user_goal          = message
  newState.failed_clarifications   = state.failed_clarifications || 0

  // ── STEP 4: Interruption detection ───────────────────────────
  const isMidBooking   = newState.service && (
    newState.stage === "awaiting_date" ||
    newState.stage === "awaiting_time" ||
    newState.stage === "awaiting_confirmation"
  )
  const interruptTypes = ["pricing","location_query","hours_query","service_inquiry","policy_query"]
  const isInterruption = isMidBooking && interruptTypes.includes(intent)

  if (isInterruption) {
    console.log("🔀 Interruption: " + intent + " while mid-booking")
    newState = pushInterruption(newState, intent, message)
  }

  // ── STEP 5: Human handoff ─────────────────────────────────────
  if (intent === "human_handoff" || newState.handoff_required || newState.failed_clarifications >= 3) {
    newState.handoff_required = true
    newState.stage = "handoff_mode"
    await saveState(conversationId, newState)
    logHandoff({ userId, phone, contactName, message, state: newState })
    return "Of course! 🙌 I'll notify our team right away and someone will be with you shortly.\n\nIs there anything specific you'd like me to mention to them?"
  }

  // ── STEP 6: Instant replies (no AI needed) ───────────────────

  // Greeting
  if (intent === "greeting" && !newState.service) {
    const svcPreview = services.slice(0, 3).map(s => s.name).join(", ")
    await saveState(conversationId, Object.assign({}, newState, { stage: "idle" }))
    return "Hi " + firstName + "! 👋 Welcome to *" + (biz.business_name || "us") + "*!" +
      (svcPreview ? "\n\nWe offer: " + svcPreview + " and more." : "") +
      "\n\nHow can I help you today? 😊"
  }

  // External venue guard
  const isExternal = /\b(restaurant|hotel|cafe|bar|resort|movie|flight|train|bus)\b/i.test(message)
                  && /\b(book|reserve|table|ticket|seat)\b/i.test(message)
  if (isExternal) {
    const svcPreview = services.slice(0, 3).map(s => s.name).join(", ")
    return "Hi! I can only help with bookings for *" + (biz.business_name || "us") + "* 😊" +
      (svcPreview ? "\n\nWe offer: " + svcPreview + ".\n\nWould you like to book with us?" : "")
  }

  // Pricing
  if (intent === "pricing" || intent === "service_inquiry") {
    if (services.length) {
      const list = services.map(s =>
        "• *" + s.name + "* — ₹" + s.price + (s.duration ? " (" + s.duration + " min)" : "")
      ).join("\n")
      const reply = "*" + (biz.business_name || "Our") + " Services*\n\n" + list + "\n\nWant to book any? 😊"
      if (!isMidBooking) { await saveState(conversationId, newState); return reply }
      return reply + "\n\nFor your *" + newState.service + "* booking — what date works? 📅"
    }
  }

  // Location
  if (intent === "location_query") {
    const reply = biz.maps_link
      ? "📍 *" + biz.business_name + "* is at:\n" + biz.location + "\n\n🗺️ " + biz.maps_link + "\n\nSee you soon! 😊"
      : biz.location ? "📍 We're at: *" + biz.location + "*"
      : "I'll share our location shortly! 📍"
    if (!isMidBooking) { await saveState(conversationId, newState); return reply }
    return reply + (newState.service ? "\n\nBack to your booking — what date for *" + newState.service + "*? 📅" : "")
  }

  // Hours
  if (intent === "hours_query") {
    const reply = biz.working_hours
      ? "⏰ *" + (biz.business_name || "We") + "* is open:\n\n" + biz.working_hours + "\n\nAnything else? 😊"
      : "I'll confirm our working hours for you shortly! ⏰"
    if (!isMidBooking) { await saveState(conversationId, newState); return reply }
    return reply + (newState.service ? "\n\nFor your *" + newState.service + "* booking — what date works? 📅" : "")
  }

  // Gratitude
  if (intent === "gratitude") {
    await saveState(conversationId, newState)
    return "You're welcome! 😊 Looking forward to seeing you at *" + (biz.business_name || "us") + "*!"
  }

  // ── STEP 7: Reschedule ────────────────────────────────────────
  if (intent === "booking_reschedule") {
    newState.stage = "reschedule_mode"
    if (newState.date && newState.time) {
      const result = await rescheduleBooking({
        userId, customerPhone: phone,
        date: newState.date, time: newState.time,
        services, bizName: biz.business_name
      })
      if (result.ok) {
        newState = clearBookingFields(newState)
        await saveState(conversationId, newState)
        return result.message
      }
      await saveState(conversationId, newState)
      return result.message
    }
    await saveState(conversationId, newState)
    if (!newState.date) return "Sure " + firstName + "! 📅 What new date works for you?"
    return "Got the date! ⏰ What time works for you?"
  }

  // Cancel
  if (intent === "booking_cancel") {
    newState.stage = "cancel_mode"
    await saveState(conversationId, newState)
    return "I understand you want to cancel 😔\n\nWould you prefer to reschedule instead? We'd love to have you at *" + (biz.business_name || "us") + "*!"
  }

  // ── STEP 8: Booking flow ──────────────────────────────────────
  const isBookingFlow = intent === "booking_new" || intent === "booking_confirm" ||
                        newState.service || (newState.stage && newState.stage.includes("awaiting"))

  if (isBookingFlow) {
    // Check if customer is confirming after AI asked for confirmation
    const lastAiMsg = [...(history || [])].reverse().find(m => m.role === "assistant")
    const aiAskedConfirm = lastAiMsg && (
      lastAiMsg.content.toLowerCase().includes("shall i confirm") ||
      lastAiMsg.content.toLowerCase().includes("shall i book") ||
      lastAiMsg.content.toLowerCase().includes("want me to book") ||
      lastAiMsg.content.toLowerCase().includes("confirm booking") ||
      lastAiMsg.content.toLowerCase().includes("book that") ||
      lastAiMsg.content.toLowerCase().includes("confirm that")
    )
    const customerConfirmed = entities.confirmation === true

    if (newState.service && customerConfirmed && aiAskedConfirm) {
      const result = await createBooking({
        userId, customerName: contactName, customerPhone: phone,
        customerId: null, state: newState, services,
        bizName: biz.business_name
      })

      if (result.ok) {
        newState = clearBookingFields(newState)
        newState.stage = "booking_complete"
        await saveState(conversationId, newState)
        await supabaseAdmin.from("conversations")
          .update({ last_message: "✅ Booking Confirmed — " + result.booking.service })
          .eq("id", conversationId)
        return result.confirmMsg
      }

      if (result.slotFull) {
        newState.time = null
        await saveState(conversationId, newState)
        return result.message
      }

      await saveState(conversationId, newState)
      return "Sorry, I had trouble saving the booking 😅 Please try again — confirm: *" +
        newState.service + "* on " + newState.date + (newState.time ? " at " + newState.time : "") + "?"
    }

    // Determine missing fields and guide customer
    const matched   = matchService(newState.service, services)
    const needsTime = !newState.service || isTimeBased(matched)

    if (!newState.service) {
      newState.stage = "awaiting_service"
      await saveState(conversationId, newState)
      // Fall through to AI reply for natural service recommendation
    } else if (!newState.date && needsTime) {
      newState.stage = "awaiting_date"
      newState.last_ai_question = "date"
      await saveState(conversationId, newState)
      return "Great choice! 📅 What date works for your *" + newState.service + "*?"
    } else if (!newState.time && needsTime) {
      newState.stage = "awaiting_time"
      newState.last_ai_question = "time"
      await saveState(conversationId, newState)
      return "Almost there! ⏰ What time works for you on " + newState.date + "?"
    } else if (newState.service && (newState.date || !needsTime)) {
      newState.stage = "awaiting_confirmation"
      newState.last_ai_question = "confirmation"
      await saveState(conversationId, newState)
      // buildConfirmQuestion calculates day name from JS Date — NEVER from AI
      return buildConfirmQuestion(newState.service, newState.date, newState.time)
    }
  }

  // ── STEP 9: AI reply for everything else ─────────────────────
  await saveState(conversationId, newState)
  const relevantChunks = retrieveChunks(chunks, message)

  return generateReply({
    message, biz, services, history, firstName,
    classification, entities, state: newState, relevantChunks
  })
}

async function logHandoff({ userId, phone, contactName, message, state }) {
  try {
    await supabaseAdmin.from("ai_event_log").insert({
      user_id:    userId,
      stage:      "handoff",
      input_json: { phone, contactName, message },
      output_json:{ reason: "handoff_required", stage: state.stage },
      success:    true,
      created_at: new Date().toISOString()
    })
  } catch(e) {}
}

module.exports = { orchestrate }
