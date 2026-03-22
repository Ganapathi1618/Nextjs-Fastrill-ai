// lib/ai/orchestrator.js — Main pipeline with sentiment-aware routing
const { classifyMessage }    = require("./classifier")
const { extractEntities }    = require("./extractor")
const { generateReply }      = require("./reply-engine")
const { getFallbackReply }   = require("./fallback-engine")
const { loadContext, retrieveChunks }       = require("../memory/context-engine")
const { loadState, saveState, clearBookingFields, pushInterruption } = require("../memory/state-engine")
const { createBooking, rescheduleBooking }  = require("../booking/booking-engine")
const { matchService, isTimeBased }         = require("../booking/slot-engine")
const { buildConfirmQuestion }              = require("../booking/calendar-engine")
const { createClient }       = require("@supabase/supabase-js")

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function orchestrate({ userId, conversationId, phone, contactName, message, isMediaOnly }) {
  console.log("\n🎯 ORCHESTRATOR | " + phone + " | \"" + (message||"").substring(0,60) + "\"")

  const [context, state] = await Promise.all([
    loadContext({ userId, conversationId, phone }),
    loadState(conversationId)
  ])

  const { biz, services, history, chunks } = context
  const firstName = (contactName||"").split(" ")[0] || "there"

  if (isMediaOnly) return "Thanks for sharing! 😊 If you have any questions or want to book, just type here."

  // ── STEP 1+2: Classify + Extract in parallel ──────────────────
  const [classification, entities] = await Promise.all([
    classifyMessage({ message, history, biz }),
    extractEntities({ message, history, services, state })
  ])

  const intent    = classification.primary_intent
  const sentiment = classification.sentiment || "neutral"

  console.log("📊 " + intent + " | " + sentiment + " | conf:" + classification.confidence)
  console.log("📦 svc=" + (entities.service||"null") + " date=" + (entities.date||"null") + " time=" + (entities.time||"null"))

  // ── STEP 3: Update state ──────────────────────────────────────
  let newState = Object.assign({}, state, { turns: (state.turns||0)+1 })

  if (entities.service && !newState.service) newState.service = entities.service
  if (entities.date    && !newState.date)    newState.date    = entities.date
  if (entities.time    && !newState.time)    newState.time    = entities.time

  if (intent === "booking_reschedule") {
    if (entities.date) newState.date = entities.date
    if (entities.time) newState.time = entities.time
  }

  newState.primary_intent          = intent
  newState.sentiment               = sentiment
  newState.last_user_goal          = message
  newState.failed_clarifications   = state.failed_clarifications || 0

  // ── Log upset sentiment for analytics ────────────────────────
  if (sentiment === "angry" || sentiment === "annoyed") {
    try {
      await supabaseAdmin.from("ai_event_log").insert({
        user_id: userId, stage: "sentiment_alert",
        input_json: { phone, message, sentiment, intent },
        success: true, created_at: new Date().toISOString()
      })
    } catch(e) {}
  }

  // ── STEP 4: Interruption detection ───────────────────────────
  const isMidBooking   = newState.service && ["awaiting_date","awaiting_time","awaiting_confirmation"].includes(newState.stage)
  const isInterruption = isMidBooking && ["pricing","location_query","hours_query","service_inquiry"].includes(intent)
  if (isInterruption) {
    console.log("🔀 Interruption: " + intent)
    newState = pushInterruption(newState, intent, message)
  }

  // ── STEP 5: Complaint / angry — empathetic AI reply ──────────
  if (intent === "complaint" || intent === "frustration" || (sentiment === "angry" && intent !== "greeting")) {
    newState.stage = "complaint_mode"
    await saveState(conversationId, newState)
    try {
      await supabaseAdmin.from("ai_event_log").insert({
        user_id: userId, stage: "complaint",
        input_json: { phone, message, sentiment },
        success: true, created_at: new Date().toISOString()
      })
    } catch(e) {}
    return generateReply({
      message, biz, services, history, firstName,
      classification, entities, state: newState,
      relevantChunks: retrieveChunks(chunks, message)
    })
  }

  // ── STEP 6: Human handoff ─────────────────────────────────────
  if (intent === "human_handoff" || newState.handoff_required || newState.failed_clarifications >= 3) {
    newState.handoff_required = true
    newState.stage = "handoff_mode"
    await saveState(conversationId, newState)
    try {
      await supabaseAdmin.from("ai_event_log").insert({
        user_id: userId, stage: "handoff",
        input_json: { phone, message, sentiment },
        success: true, created_at: new Date().toISOString()
      })
    } catch(e) {}
    return "Of course! 🙌 I'll notify our team right away and someone will be with you shortly.\n\nAnything specific you'd like me to mention to them?"
  }

  // ── STEP 7: Greeting ─────────────────────────────────────────
  if (intent === "greeting" && !newState.service) {
    const svcPrev = services.slice(0,3).map(s => s.name).join(", ")
    await saveState(conversationId, Object.assign({}, newState, { stage: "idle" }))
    return "Hi " + firstName + "! 👋 Welcome to *" + (biz.business_name||"us") + "*!" +
      (svcPrev ? "\n\nWe offer: " + svcPrev + " and more." : "") +
      "\n\nHow can I help you today? 😊"
  }

  // ── STEP 8: External venue guard ─────────────────────────────
  if (/\b(restaurant|hotel|cafe|bar|resort|movie|flight|train)\b/i.test(message) &&
      /\b(book|reserve|table|ticket)\b/i.test(message)) {
    const svcPrev = services.slice(0,3).map(s => s.name).join(", ")
    return "Hi! I can only help with bookings for *" + (biz.business_name||"us") + "* 😊" +
      (svcPrev ? "\n\nWe offer: " + svcPrev + ".\n\nWould you like to book with us?" : "")
  }

  // ── STEP 9: Instant replies ───────────────────────────────────
  const isUpset = sentiment === "angry" || sentiment === "annoyed"

  if ((intent === "pricing" || intent === "service_inquiry") && services.length) {
    const list  = services.map(s => "• *" + s.name + "* — ₹" + s.price + (s.duration ? " (" + s.duration + " min)" : "")).join("\n")
    const reply = "*" + (biz.business_name||"Our") + " Services*\n\n" + list + (isUpset ? "" : "\n\nWant to book any? 😊")
    if (!isMidBooking) { await saveState(conversationId, newState); return reply }
    return reply + "\n\nFor your *" + newState.service + "* booking — what date works? 📅"
  }

  if (intent === "location_query") {
    const reply = biz.maps_link
      ? "📍 *" + biz.business_name + "* is at:\n" + biz.location + "\n\n🗺️ " + biz.maps_link + "\n\nSee you soon! 😊"
      : biz.location ? "📍 We're at: *" + biz.location + "*"
      : "I'll share our location shortly! 📍"
    if (!isMidBooking) { await saveState(conversationId, newState); return reply }
    return reply + (newState.service ? "\n\nBack to your booking — what date for *" + newState.service + "*? 📅" : "")
  }

  if (intent === "hours_query") {
    const reply = biz.working_hours
      ? "⏰ *" + (biz.business_name||"We") + "* is open:\n\n" + biz.working_hours + "\n\nAnything else? 😊"
      : "I'll confirm our hours shortly! ⏰"
    if (!isMidBooking) { await saveState(conversationId, newState); return reply }
    return reply + (newState.service ? "\n\nFor your *" + newState.service + "* booking — what date? 📅" : "")
  }

  if (intent === "gratitude") {
    await saveState(conversationId, newState)
    return "You're welcome! 😊 Looking forward to seeing you at *" + (biz.business_name||"us") + "*!"
  }

  // ── STEP 10: Reschedule ───────────────────────────────────────
  if (intent === "booking_reschedule") {
    newState.stage = "reschedule_mode"
    if (newState.date && newState.time) {
      const result = await rescheduleBooking({
        userId, customerPhone: phone,
        date: newState.date, time: newState.time, services
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
    return !newState.date
      ? "Sure " + firstName + "! 📅 What new date works for you?"
      : "Got the date! ⏰ What time works for you?"
  }

  // ── STEP 11: Cancel — sentiment-aware ────────────────────────
  if (intent === "booking_cancel") {
    newState.stage = "cancel_mode"
    await saveState(conversationId, newState)
    if (isUpset) {
      return "I understand, and I'm sorry for any inconvenience 🙏 I'll cancel your booking right away.\n\nIs there anything else I can help with?"
    }
    return "I understand you want to cancel 😔\n\nWould you prefer to reschedule instead? We'd love to have you at *" + (biz.business_name||"us") + "*!"
  }

  // ── STEP 12: Booking flow ─────────────────────────────────────
  const isBookingFlow = intent === "booking_new" || intent === "booking_confirm" ||
                        newState.service || (newState.stage && newState.stage.includes("awaiting"))

  if (isBookingFlow) {
    const lastAiMsg = [...(history||[])].reverse().find(m => m.role === "assistant")
    const aiAsked   = lastAiMsg && (
      lastAiMsg.content.toLowerCase().includes("shall i confirm") ||
      lastAiMsg.content.toLowerCase().includes("shall i book") ||
      lastAiMsg.content.toLowerCase().includes("confirm booking") ||
      lastAiMsg.content.toLowerCase().includes("book that") ||
      lastAiMsg.content.toLowerCase().includes("confirm karu") ||
      lastAiMsg.content.toLowerCase().includes("confirm cheyya")
    )
    const confirmed = entities.confirmation === true

    if (newState.service && confirmed && aiAsked) {
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
      return "Sorry, had trouble saving 😅 Please confirm: *" + newState.service + "* on " + newState.date + (newState.time ? " at " + newState.time : "") + "?"
    }

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
      return buildConfirmQuestion(newState.service, newState.date, newState.time)
    }
  }

  // ── STEP 13: AI reply for everything else ─────────────────────
  await saveState(conversationId, newState)
  return generateReply({
    message, biz, services, history, firstName,
    classification, entities, state: newState,
    relevantChunks: retrieveChunks(chunks, message)
  })
}

module.exports = { orchestrate }
