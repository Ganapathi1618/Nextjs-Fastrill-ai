// lib/ai/orchestrator.js
// The brain — runs the full pipeline for every message
// Each step is isolated — one failure never crashes the whole pipeline

import { classifyMessage }                    from "./classifier.js"
import { extractEntities }                    from "./extractor.js"
import { generateReply }                      from "./reply-engine.js"
import { getFallbackReply }                   from "./fallback-engine.js"
import { loadContext, retrieveChunks }        from "../memory/context-engine.js"
import { loadState, saveState, clearBookingFields, pushInterruption } from "../memory/state-engine.js"
import { createBooking, rescheduleBooking }   from "../booking/booking-engine.js"
import { matchService, isTimeBased }          from "../booking/slot-engine.js"
import { upsertLead }                         from "../crm/customer-engine.js"
import { createClient }                       from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export async function orchestrate({
  userId, conversationId, phone, contactName,
  message, isMediaOnly, phoneNumberId
}) {
  console.log(`\n🎯 ORCHESTRATOR | ${phone} | "${message?.substring(0,60)}"`)

  // ── Load everything we need ──────────────────────────────────────
  const [context, state] = await Promise.all([
    loadContext({ userId, conversationId, phone }),
    loadState(conversationId)
  ])

  const { biz, services, history, memory, chunks } = context
  const firstName = contactName.split(" ")[0] || "there"

  // ── Handle media-only (no text, no caption) ──────────────────────
  if (isMediaOnly) {
    return `Thanks for sharing! 😊 If you have any questions or want to book, just type here.`
  }

  // ── STEP 1 & 2: Classify + Extract in parallel ───────────────────
  const [classification, entities] = await Promise.all([
    classifyMessage({ message, history, biz }),
    extractEntities({ message, history, services, state })
  ])

  console.log(`📊 Intent: ${classification.primary_intent} | Sentiment: ${classification.sentiment} | Confidence: ${classification.confidence}`)
  console.log(`📦 Entities: service=${entities.service||"null"} date=${entities.date||"null"} time=${entities.time||"null"} confirm=${entities.confirmation}`)

  const intent = classification.primary_intent

  // ── STEP 3: Update state from entities ──────────────────────────
  let newState = { ...state, turns: (state.turns || 0) + 1 }

  // Merge extracted entities into state (only update if newly found)
  if (entities.service && !newState.service)  newState.service = entities.service
  if (entities.date    && !newState.date)     newState.date    = entities.date
  if (entities.time    && !newState.time)     newState.time    = entities.time

  // If reschedule — always update date/time even if already set
  if (intent === "booking_reschedule") {
    if (entities.date) newState.date = entities.date
    if (entities.time) newState.time = entities.time
  }

  newState.primary_intent   = intent
  newState.last_user_goal   = message
  newState.failed_clarifications = state.failed_clarifications || 0

  // ── STEP 4: Handle interruptions ─────────────────────────────────
  // If we're mid-booking and customer asks something else, stack it
  const isMidBooking    = newState.service && (newState.stage === "awaiting_date" || newState.stage === "awaiting_time" || newState.stage === "awaiting_confirmation")
  const isInterruption  = isMidBooking && ["pricing","location_query","hours_query","service_inquiry","policy_query"].includes(intent)

  if (isInterruption) {
    console.log(`🔀 Interruption detected: ${intent} while mid-booking`)
    newState = pushInterruption(newState, intent, message)
  }

  // ── STEP 5: Deterministic actions (no AI needed) ─────────────────

  // COMPLIANCE (STOP/START) — handled in webhook before orchestrator
  // so we don't need to handle here

  // HUMAN HANDOFF
  if (intent === "human_handoff" || newState.handoff_required ||
      (newState.failed_clarifications >= 3)) {
    newState.handoff_required = true
    newState.stage = "handoff_mode"
    await saveState(conversationId, newState)
    // Notify owner (fire and forget)
    notifyOwnerHandoff({ userId, phone, contactName, message, state: newState }).catch(() => {})
    return `Of course! 🙌 I'll notify our team right away and someone will be with you shortly.\n\nIs there anything specific you'd like me to mention to them?`
  }

  // GREETING — instant, no AI call needed
  if (intent === "greeting" && !newState.service) {
    const svcPreview = services.slice(0, 3).map(s => s.name).join(", ")
    await saveState(conversationId, { ...newState, stage: "idle" })
    return `Hi ${firstName}! 👋 Welcome to *${biz.business_name || "us"}*!${svcPreview ? `\n\nWe offer: ${svcPreview} and more.` : ""}\n\nHow can I help you today? 😊`
  }

  // EXTERNAL VENUE GUARD
  const isExternal = /\b(restaurant|hotel|cafe|bar|resort|movie|flight|train|bus)\b/i.test(message)
               && /\b(book|reserve|table|ticket|seat)\b/i.test(message)
  if (isExternal) {
    const svcPreview = services.slice(0, 3).map(s => s.name).join(", ")
    return `Hi! I can only help with bookings for *${biz.business_name || "us"}* 😊${svcPreview ? `\n\nWe offer: ${svcPreview}.\n\nWould you like to book with us?` : ""}`
  }

  // INSTANT REPLIES — pricing, location, hours (no AI needed)
  if (intent === "pricing" || intent === "service_inquiry") {
    if (!isInterruption) {
      const list = services.map(s => `• *${s.name}* — ₹${s.price}${s.duration ? ` (${s.duration} min)` : ""}`).join("\n")
      const reply = services.length
        ? `*${biz.business_name || "Our"} Services*\n\n${list}\n\nWant to book any? 😊`
        : `I'll get our latest services for you shortly! 😊`
      if (!isMidBooking) { await saveState(conversationId, newState); return reply }
      // If mid-booking, answer the interruption and then resume
      const resumeHint = `\n\nFor your *${newState.service}* booking — what date works for you? 📅`
      return reply + resumeHint
    }
  }

  if (intent === "location_query") {
    const reply = biz.maps_link
      ? `📍 *${biz.business_name}* is at:\n${biz.location}\n\n🗺️ ${biz.maps_link}\n\nSee you soon! 😊`
      : biz.location ? `📍 We're at: *${biz.location}*` : `I'll share our location shortly! 📍`
    if (!isMidBooking) { await saveState(conversationId, newState); return reply }
    const resumeHint = newState.service ? `\n\nBack to your booking — what date works for your *${newState.service}*? 📅` : ""
    return reply + resumeHint
  }

  if (intent === "hours_query") {
    const reply = biz.working_hours
      ? `⏰ *${biz.business_name}* is open:\n\n${biz.working_hours}\n\nAnything else? 😊`
      : `I'll confirm our working hours for you shortly! ⏰`
    if (!isMidBooking) { await saveState(conversationId, newState); return reply }
    const resumeHint = newState.service ? `\n\nFor your *${newState.service}* booking — what date works? 📅` : ""
    return reply + resumeHint
  }

  // RESCHEDULE
  if (intent === "booking_reschedule") {
    newState.stage = "reschedule_mode"
    if (newState.date && newState.time) {
      const result = await rescheduleBooking({ userId, customerPhone: phone, date: newState.date, time: newState.time, services })
      if (result.ok) {
        newState = clearBookingFields(newState)
        await saveState(conversationId, newState)
        return result.message
      }
      await saveState(conversationId, newState)
      return result.message
    }
    await saveState(conversationId, newState)
    if (!newState.date) return `Sure ${firstName}! 📅 What new date works for you?`
    if (!newState.time) return `Got the date! ⏰ What time works for you?`
  }

  // CANCEL
  if (intent === "booking_cancel") {
    newState.stage = "cancel_mode"
    await saveState(conversationId, newState)
    return `I understand you want to cancel 😔\n\nWould you prefer to reschedule instead? We'd love to have you at *${biz.business_name || "us"}*!`
  }

  // ── STEP 6: Booking flow ─────────────────────────────────────────
  if (intent === "booking_new" || intent === "booking_confirm" ||
      newState.service || newState.stage?.includes("awaiting")) {

    // If customer is confirming and AI had asked for confirmation
    const lastAiMsg    = [...(history || [])].reverse().find(m => m.role === "assistant")
    const aiAskedConfirm = lastAiMsg && (
      lastAiMsg.content.toLowerCase().includes("shall i book") ||
      lastAiMsg.content.toLowerCase().includes("shall i confirm") ||
      lastAiMsg.content.toLowerCase().includes("want me to book") ||
      lastAiMsg.content.toLowerCase().includes("confirm booking") ||
      lastAiMsg.content.toLowerCase().includes("book that") ||
      lastAiMsg.content.toLowerCase().includes("confirm that")
    )
    const customerConfirmed = entities.confirmation === true

    if (newState.service && customerConfirmed && aiAskedConfirm) {
      // Execute booking
      const result = await createBooking({
        userId, customerName: contactName, customerPhone: phone,
        customerId: null, state: newState, services
      })

      if (result.ok) {
        newState = clearBookingFields(newState)
        newState.stage = "booking_complete"
        await saveState(conversationId, newState)
        // Update conversation last message
        await supabaseAdmin.from("conversations")
          .update({ last_message: "✅ Booking Confirmed — " + result.booking.service })
          .eq("id", conversationId)
        return result.confirmMsg
      }

      if (result.slotFull) {
        // Keep state, just update time to null so customer gives new time
        newState.time = null
        await saveState(conversationId, newState)
        return result.message
      }

      // Booking failed
      await saveState(conversationId, newState)
      return `Sorry, I had trouble saving the booking 😅 Let me try again — please confirm: *${newState.service}* on ${newState.date} at ${newState.time}?`
    }

    // Determine what's still missing
    const matched   = matchService(newState.service, services)
    const needsTime = !newState.service || isTimeBased(matched)

    if (!newState.service) {
      newState.stage = "awaiting_service"
      await saveState(conversationId, newState)
      // Let AI handle service recommendation naturally
    } else if (!newState.date && needsTime) {
      newState.stage = "awaiting_date"
      newState.last_ai_question = "date"
      await saveState(conversationId, newState)
      return `Great choice! 📅 What date works for your *${newState.service}*?`
    } else if (!newState.time && needsTime) {
      newState.stage = "awaiting_time"
      newState.last_ai_question = "time"
      await saveState(conversationId, newState)
      return `Almost there! ⏰ What time works for you on ${newState.date}?`
    } else if (newState.service && (newState.date || !needsTime)) {
      // All collected — ask for confirmation
      newState.stage = "awaiting_confirmation"
      newState.last_ai_question = "confirmation"
      await saveState(conversationId, newState)
      const dateFormatted = newState.date
        ? new Date(newState.date + "T12:00:00").toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" })
        : null
      return `Shall I confirm your booking for *${newState.service}*${dateFormatted ? " on " + dateFormatted : ""}${newState.time ? " at " + newState.time : ""}? ✅`
    }
  }

  // ── STEP 7: AI reply for everything else ─────────────────────────
  await saveState(conversationId, newState)

  // Retrieve relevant knowledge chunks
  const relevantChunks = retrieveChunks(chunks, message)

  const reply = await generateReply({
    message, biz, services, history, firstName,
    classification, entities, state: newState, relevantChunks
  })

  return reply
}

async function notifyOwnerHandoff({ userId, phone, contactName, message, state }) {
  try {
    // Log handoff event for owner to see in dashboard
    await supabaseAdmin.from("ai_event_log").insert({
      user_id:       userId,
      stage:         "handoff",
      input_json:    { phone, contactName, message },
      output_json:   { reason: state.handoff_required, stage: state.stage },
      success:       true,
      created_at:    new Date().toISOString()
    })
  } catch(e) {}
}
