// lib/ai/orchestrator.js
// The master pipeline — every message flows through here
// Webhook calls this. Everything else is a module.

import { createClient }        from "@supabase/supabase-js"
import { normalizeInbound }    from "../messaging/inbound-normalizer.js"
import { buildCalendarContext} from "../booking/calendar-engine.js"
import { classifyIntent }      from "./intent-engine.js"
import { extractEntities }     from "./entity-engine.js"
import { generateReply }       from "./reply-engine.js"
import { loadMemory, updateMemory } from "./memory-engine.js"
import { applyPolicy, buildReplyDirective } from "../policy/policy-engine.js"
import { createBooking, rescheduleBooking, cancelBooking, lookupBooking } from "../booking/booking-engine.js"
import { NextResponse }        from "next/server"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const orchestrator = {
  async process(body) {
    try {
      // Status updates — handled inline, no pipeline needed
      const statuses = body?.entry?.[0]?.changes?.[0]?.value?.statuses
      const hasMsg   = body?.entry?.[0]?.changes?.[0]?.value?.messages
      if (statuses && !hasMsg) {
        for (const s of statuses) {
          if (s.id && ["delivered","read","failed"].includes(s.status)) {
            try {
              await supabaseAdmin.from("messages")
                .update({ status: s.status, [`${s.status}_at`]: new Date().toISOString() })
                .eq("wa_message_id", s.id)
            } catch(e) {}
          }
        }
        return NextResponse.json({ status: "status_update" }, { status: 200 })
      }
      if (!hasMsg) return NextResponse.json({ status: "no_message" }, { status: 200 })

      const value         = body.entry[0].changes[0].value
      const phoneNumberId = value?.metadata?.phone_number_id
      const messages      = value?.messages || []
      const contacts      = value?.contacts || []

      for (const rawMessage of messages) {
        await this.processMessage({ rawMessage, contacts, phoneNumberId })
      }

      return NextResponse.json({ status: "ok" }, { status: 200 })
    } catch(err) {
      console.error("❌ Orchestrator fatal:", err)
      return NextResponse.json({ status: "error", message: err.message }, { status: 200 })
    }
  },

  async processMessage({ rawMessage, contacts, phoneNumberId }) {
    const pipelineStart = Date.now()
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("🚀 FASTRILL AI v2 PIPELINE START")

    // ══════════════════════════════════════════════════════════════
    // STAGE A — NORMALIZE
    // ══════════════════════════════════════════════════════════════
    const msg = normalizeInbound(rawMessage, contacts)
    console.log(`📩 [${msg.phone}] "${msg.text || "["+msg.mediaType+"]"}"`)

    // Duplicate guard
    const { data: dupMsg } = await supabaseAdmin
      .from("messages").select("id").eq("wa_message_id", msg.messageId).maybeSingle()
    if (dupMsg) { console.log("⚠️ Duplicate, skip"); return }

    // ══════════════════════════════════════════════════════════════
    // STAGE B — FIND CONNECTION + USER
    // ══════════════════════════════════════════════════════════════
    const { data: connection } = await supabaseAdmin
      .from("whatsapp_connections")
      .select("user_id, access_token")
      .eq("phone_number_id", phoneNumberId)
      .single()
    if (!connection) { console.error("❌ No WA connection:", phoneNumberId); return }
    const userId = connection.user_id

    // ══════════════════════════════════════════════════════════════
    // STAGE C — CRM: UPSERT CUSTOMER + CONVERSATION
    // ══════════════════════════════════════════════════════════════
    const customer = await this.upsertCustomer({ userId, msg })
    const conversation = await this.upsertConversation({ userId, customer, msg })

    // Save inbound message
    await this.saveMessage({ userId, phoneNumberId, msg, conversation, direction: "inbound" })

    // Update lead
    await this.updateLead({ userId, customer, msg })

    // ══════════════════════════════════════════════════════════════
    // STAGE D — COMPLIANCE: STOP/START
    // ══════════════════════════════════════════════════════════════
    const complianceResult = await this.handleCompliance({ userId, msg, connection, conversation })
    if (complianceResult.handled) return

    // Skip if AI disabled
    if (conversation?.ai_enabled === false) { console.log("⏸️ AI disabled"); return }

    // Handle audio
    if (msg.isAudio) {
      const firstName = msg.contactName.split(" ")[0]
      await this.sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: msg.fromNumber, message: `Hey ${firstName}! 😊 I can only read text right now. Could you type what you'd like to say?`, userId, conversation, msg })
      return
    }

    // Handle media without text
    if (msg.isMediaOnly) {
      await this.sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: msg.fromNumber, message: "Thanks for sharing! 😊 If you have any questions or want to book, just type here.", userId, conversation, msg })
      return
    }

    if (!msg.hasText) return

    // ══════════════════════════════════════════════════════════════
    // STAGE E — LOAD BUSINESS CONTEXT
    // ══════════════════════════════════════════════════════════════
    const [
      { data: bizSettings },
      { data: rawHistory },
      { data: servicesList },
      { data: bizKnowledge }
    ] = await Promise.all([
      supabaseAdmin.from("business_settings").select("*").eq("user_id", userId).maybeSingle(),
      supabaseAdmin.from("messages")
        .select("message_text, direction, is_ai, created_at")
        .eq("conversation_id", conversation?.id)
        .order("created_at", { ascending: false }).limit(20),
      supabaseAdmin.from("services")
        .select("name, price, duration, capacity, category, description, service_type, is_active")
        .eq("user_id", userId),
      supabaseAdmin.from("business_knowledge").select("*").eq("user_id", userId).maybeSingle()
    ])

    const biz = {
      ...(bizKnowledge || {}),
      ...(bizSettings  || {}),
      ai_instructions: [
        bizSettings?.ai_instructions,
        bizKnowledge?.content,
        bizKnowledge?.instructions
      ].filter(Boolean).join("\n\n") || ""
    }

    const activeServices = (servicesList || []).filter(s => s.is_active !== false)

    const historyRaw = (rawHistory || []).reverse().map(m => ({
      role:    m.direction === "inbound" ? "user" : "assistant",
      content: (m.message_text || "").trim()
    })).filter(m => m.content && m.content !== "[media message]")
    const history = this.buildAlternatingHistory(historyRaw)

    // Load booking state
    let bookingState = null
    try {
      if (conversation?.state_json) {
        bookingState = typeof conversation.state_json === "string"
          ? JSON.parse(conversation.state_json)
          : conversation.state_json
      }
    } catch(e) { bookingState = null }

    // ══════════════════════════════════════════════════════════════
    // STAGE F — LOAD CUSTOMER MEMORY
    // ══════════════════════════════════════════════════════════════
    const customerMemory = await loadMemory({ userId, phone: msg.phone, customerId: customer?.id })

    // ══════════════════════════════════════════════════════════════
    // STAGE G — BUILD CALENDAR CONTEXT (JS, never LLM)
    // ══════════════════════════════════════════════════════════════
    const cal = buildCalendarContext()

    // ══════════════════════════════════════════════════════════════
    // STAGE H — CLASSIFY INTENT (Sarvam call 1 — small/fast)
    // ══════════════════════════════════════════════════════════════
    console.log("🎯 Classifying intent...")
    const intent = await classifyIntent({
      text: msg.text,
      history,
      businessName: biz.business_name || "our business",
      services: activeServices
    })
    console.log(`🎯 Intent: ${intent.primary_intent} | Sentiment: ${intent.sentiment} | Confidence: ${intent.confidence}`)

    // ══════════════════════════════════════════════════════════════
    // STAGE I — EXTRACT ENTITIES (Sarvam call 2 — structured)
    // ══════════════════════════════════════════════════════════════
    console.log("🔍 Extracting entities...")
    const entities = await extractEntities({
      text:         msg.text,
      history,
      services:     activeServices,
      cal,
      workingHours: biz.working_hours || "",
      bookingState
    })
    console.log(`🔍 Service: ${entities.service?.value} | Date: ${entities.date?.value} | Time: ${entities.time?.value} | Confirm: ${entities.confirmation?.value}`)

    // ══════════════════════════════════════════════════════════════
    // STAGE J — APPLY POLICY (deterministic)
    // ══════════════════════════════════════════════════════════════
    const policy = applyPolicy({ intent, entities, biz, bookingState, customerMemory })
    console.log(`📋 Policy: readyToBook=${policy.readyToBook} | missing=${policy.missing.join(",")} | handoff=${policy.handoffRequired}`)

    // ══════════════════════════════════════════════════════════════
    // STAGE K — CHECK BOOKING LOOKUP
    // ══════════════════════════════════════════════════════════════
    let existingBooking = null
    if (intent.primary_intent === "booking_lookup" || /did you book|my booking|any update/i.test(msg.text)) {
      existingBooking = await lookupBooking({ userId, customerPhone: msg.phone })
    }

    // ══════════════════════════════════════════════════════════════
    // STAGE L — CHOOSE ACTION + UPDATE STATE
    // ══════════════════════════════════════════════════════════════
    let actionTaken    = null
    let newBookingData = null
    let stateUpdate    = { ...bookingState }
    let stateContext   = ""

    // Merge newly extracted entities into state
    if (entities.service?.value && !stateUpdate.confirmed) stateUpdate.service = entities.service.value
    if (entities.date?.value    && !entities.date?.ambiguous && !stateUpdate.confirmed) stateUpdate.date = entities.date.value
    if (entities.time?.value    && !entities.time?.ambiguous && !stateUpdate.confirmed) stateUpdate.time = entities.time.value

    // Handle confirmed booking state
    if (bookingState?.confirmed) {
      actionTaken  = "booking_confirmed_already"
      stateContext = `Booking already confirmed: ${bookingState.service} on ${bookingState.date}${bookingState.time ? " at "+bookingState.time : ""}`
    }

    // Handle handoff
    else if (policy.handoffRequired) {
      actionTaken = "handoff_required"
      await supabaseAdmin.from("conversations").update({
        handoff_at:    new Date().toISOString(),
        handoff_reason: policy.handoffTriggers.join(", ")
      }).eq("id", conversation.id)
      stateContext = `Handoff required: ${policy.handoffTriggers.join(", ")}`
    }

    // Handle cancel
    else if (intent.primary_intent === "booking_cancel") {
      const result = await cancelBooking({ userId, customerPhone: msg.phone })
      actionTaken  = result.success ? "booking_cancelled" : "booking_cancel_not_found"
      stateUpdate  = null
      stateContext = `Cancel: ${result.success ? "cancelled "+result.booking?.service : "no booking found"}`
    }

    // Handle reschedule
    else if (intent.primary_intent === "booking_reschedule" && entities.date?.value && entities.time?.value) {
      const result = await rescheduleBooking({ userId, customerPhone: msg.phone, entities, services: activeServices })
      actionTaken  = result.success ? "booking_rescheduled" : "booking_reschedule_failed"
      if (result.success) {
        stateUpdate = null
        stateContext = `Rescheduled: ${result.booking.service} to ${entities.date.value} ${entities.time.value}`
      }
    }

    // Handle confirmation → create booking
    else if (
      (policy.awaitingConfirmation || bookingState?.stage === "awaiting_confirmation") &&
      entities.confirmation?.value === true &&
      stateUpdate.service && stateUpdate.date
    ) {
      const result = await createBooking({
        userId, customer, services: activeServices,
        entities: {
          service: { value: stateUpdate.service },
          date:    { value: stateUpdate.date },
          time:    { value: stateUpdate.time }
        }
      })
      if (result.success) {
        actionTaken = "booking_created"
        newBookingData = result.booking
        stateUpdate = {
          confirmed: true,
          service:   stateUpdate.service,
          date:      stateUpdate.date,
          time:      stateUpdate.time
        }
        stateContext = `Booking created: ${stateUpdate.service} on ${stateUpdate.date} at ${stateUpdate.time}`
      } else if (result.slotTaken) {
        actionTaken  = "slot_taken"
        stateContext = `Slot taken. Next available: ${result.nextSlot}`
      }
    }

    // Handle confirmation → NO (customer said no)
    else if (
      (policy.awaitingConfirmation || bookingState?.stage === "awaiting_confirmation") &&
      entities.confirmation?.value === false
    ) {
      actionTaken  = "confirmation_rejected"
      stateUpdate  = { service: stateUpdate.service } // keep service, clear date+time
      stateContext  = "Customer rejected confirmation. Ask what to change."
    }

    // Ready to book — ask for confirmation
    else if (policy.readyToBook && !bookingState?.stage?.includes("awaiting_confirmation")) {
      actionTaken  = "ready_to_confirm"
      stateUpdate  = { ...stateUpdate, stage: "awaiting_confirmation" }
      stateContext = `All details ready: ${stateUpdate.service} on ${stateUpdate.date} at ${stateUpdate.time}`
    }

    // Still collecting
    else if (intent.primary_intent === "booking_new" || intent.primary_intent === "booking_confirm") {
      actionTaken  = "collecting_details"
      stateContext = `Collecting: missing=[${policy.missing.join(",")}], have=[service:${stateUpdate.service||"?"}, date:${stateUpdate.date||"?"}, time:${stateUpdate.time||"?"}]`
    }

    // Save updated state
    if (conversation?.id) {
      try {
        await supabaseAdmin.from("conversations").update({
          state_json: stateUpdate ? JSON.stringify(stateUpdate) : null
        }).eq("id", conversation.id)
      } catch(e) { console.warn("State save failed:", e.message) }
    }

    console.log(`⚡ Action: ${actionTaken} | State: ${JSON.stringify(stateUpdate)}`)

    // ══════════════════════════════════════════════════════════════
    // STAGE M — BUILD REPLY DIRECTIVE
    // ══════════════════════════════════════════════════════════════
    let replyDirective = buildReplyDirective({
      intent, entities, policy, bookingState: stateUpdate, biz, customerMemory, cal
    })

    // Override directive for specific actions
    if (actionTaken === "booking_created" && newBookingData) {
      const fd = stateUpdate.date ? new Date(stateUpdate.date+"T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"}) : null
      replyDirective = `Booking confirmed! Send full confirmation: service=${stateUpdate.service}, date=${fd||stateUpdate.date}, time=${stateUpdate.time}. Be warm and celebratory.`
    }
    if (actionTaken === "slot_taken") {
      const result = { nextSlot: stateContext.split("Next available: ")[1] }
      replyDirective = `That slot is taken. Tell customer warmly. ${result.nextSlot ? "Suggest next available: "+result.nextSlot : "Ask them to suggest another time."}`
    }
    if (actionTaken === "booking_rescheduled") {
      replyDirective = `Booking rescheduled. Confirm new date/time warmly.`
    }
    if (actionTaken === "booking_cancelled") {
      replyDirective = `Booking cancelled. Acknowledge warmly. Offer to reschedule.`
    }
    if (existingBooking) {
      const fd = existingBooking.booking_date ? new Date(existingBooking.booking_date+"T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"}) : null
      replyDirective = `Customer asked about their booking. Found: ${existingBooking.service} on ${fd||existingBooking.booking_date}${existingBooking.booking_time ? " at "+existingBooking.booking_time : ""}. Tell them warmly.`
    }

    // ══════════════════════════════════════════════════════════════
    // STAGE N — GENERATE REPLY (Sarvam call 3 — reply only)
    // ══════════════════════════════════════════════════════════════
    console.log("💬 Generating reply...")
    const replyResult = await generateReply({
      customerName:    msg.contactName,
      businessName:    biz.business_name    || "our business",
      businessType:    biz.business_type    || "",
      location:        biz.location         || "",
      mapsLink:        biz.maps_link        || "",
      workingHours:    biz.working_hours    || "",
      aiInstructions:  biz.ai_instructions  || "",
      aiLanguage:      biz.ai_language      || "English",
      description:     biz.description      || "",
      services:        activeServices,
      intent,
      entities,
      stateContext,
      conversationHistory: history,
      customerMemory,
      retrievedChunks: null,
      actionTaken,
      replyDirective,
      cal
    })

    const finalReply = replyResult.reply
    console.log(`📤 Reply: "${finalReply.substring(0, 100)}"`)

    // ══════════════════════════════════════════════════════════════
    // STAGE O — SEND + SAVE
    // ══════════════════════════════════════════════════════════════
    await this.sendAndSave({
      phoneNumberId,
      accessToken:    connection.access_token,
      toNumber:       msg.fromNumber,
      message:        finalReply,
      userId,
      conversation,
      msg
    })

    await supabaseAdmin.from("conversations").update({
      last_message:    finalReply,
      last_message_at: new Date().toISOString()
    }).eq("id", conversation?.id)

    // ══════════════════════════════════════════════════════════════
    // STAGE P — HANDOFF NOTIFICATION
    // ══════════════════════════════════════════════════════════════
    if (replyResult.handoff_suggested || actionTaken === "handoff_required") {
      console.log("🚨 Handoff required — owner should be notified")
      // TODO: send notification to business owner via their WhatsApp or email
    }

    // ══════════════════════════════════════════════════════════════
    // STAGE Q — UPDATE MEMORY + LOG
    // ══════════════════════════════════════════════════════════════
    await updateMemory({
      userId, phone: msg.phone, customerId: customer?.id,
      intent, entities, sentiment: intent.sentiment,
      bookingCreated: actionTaken === "booking_created",
      serviceUsed: stateUpdate?.service
    })

    // Log AI event
    try {
      await supabaseAdmin.from("ai_event_log").insert({
        conversation_id: conversation?.id,
        user_id:         userId,
        message_id:      msg.messageId,
        stage:           "full_pipeline",
        input_json:      { text: msg.text, intent: intent.primary_intent, sentiment: intent.sentiment },
        output_json:     { reply: finalReply, action: actionTaken, tone: replyResult.tone },
        latency_ms:      Date.now() - pipelineStart,
        model_name:      "sarvam-m",
        success:         true
      })
    } catch(e) { console.warn("Event log failed:", e.message) }

    const totalTime = Date.now() - pipelineStart
    console.log(`✅ Pipeline complete in ${totalTime}ms`)
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  },

  // ── CRM helpers ────────────────────────────────────────────────────

  async upsertCustomer({ userId, msg }) {
    const { data: existing } = await supabaseAdmin.from("customers").select("*")
      .eq("phone", msg.phone).eq("user_id", userId).maybeSingle()
    if (existing) {
      await supabaseAdmin.from("customers")
        .update({ last_visit_at: msg.timestamp, name: existing.name || msg.contactName })
        .eq("id", existing.id)
      return existing
    }
    const { data: nc } = await supabaseAdmin.from("customers").insert({
      user_id: userId, phone: msg.phone, name: msg.contactName,
      source: "whatsapp", tag: "new_lead", created_at: msg.timestamp
    }).select().single()
    return nc
  },

  async upsertConversation({ userId, customer, msg }) {
    const { data: existing } = await supabaseAdmin.from("conversations").select("*")
      .eq("phone", msg.phone).eq("user_id", userId).maybeSingle()
    if (existing) {
      const { data: uc } = await supabaseAdmin.from("conversations").update({
        last_message:    msg.text || "[media]",
        last_message_at: msg.timestamp,
        unread_count:    (existing.unread_count || 0) + 1,
        customer_id:     customer?.id || existing.customer_id,
        status:          "open"
      }).eq("id", existing.id).select().single()
      return uc
    }
    const { data: nc } = await supabaseAdmin.from("conversations").insert({
      user_id:         userId,
      customer_id:     customer?.id || null,
      phone:           msg.phone,
      status:          "open",
      ai_enabled:      true,
      last_message:    msg.text || "[media]",
      last_message_at: msg.timestamp,
      unread_count:    1
    }).select().single()
    return nc
  },

  async saveMessage({ userId, phoneNumberId, msg, conversation, direction, replyText, isAI }) {
    await supabaseAdmin.from("messages").insert({
      user_id:         userId,
      phone_number_id: phoneNumberId,
      from_number:     direction === "inbound" ? msg.fromNumber : phoneNumberId,
      message_text:    direction === "inbound" ? (msg.text || `[${msg.messageType} message]`) : replyText,
      direction,
      conversation_id: conversation?.id || null,
      customer_phone:  msg.phone,
      message_type:    "text",
      status:          direction === "inbound" ? "delivered" : "sent",
      is_ai:           isAI || false,
      wa_message_id:   msg.messageId || null,
      created_at:      direction === "inbound" ? msg.timestamp : new Date().toISOString()
    })
  },

  async updateLead({ userId, customer, msg }) {
    if (!msg.text) return
    try {
      const { data: existing } = await supabaseAdmin.from("customers").select("id")
        .eq("phone", msg.phone).eq("user_id", userId).maybeSingle()
      if (!existing) {
        await supabaseAdmin.from("leads").insert({
          user_id: userId, customer_id: customer?.id,
          phone: msg.phone, name: msg.contactName,
          source: "whatsapp", status: "open",
          last_message: msg.text, last_message_at: msg.timestamp,
          ai_score: 60, estimated_value: 600
        })
      } else {
        await supabaseAdmin.from("leads")
          .update({ last_message: msg.text, last_message_at: msg.timestamp })
          .eq("customer_id", customer?.id).eq("status", "open")
      }
    } catch(e) {}
  },

  async handleCompliance({ userId, msg, connection, conversation }) {
    const stopKw = ["stop","unsubscribe","opt out","optout","don't message","dont message","remove me","no more messages"]
    const t = (msg.text || "").toLowerCase().trim()

    if (msg.isText && stopKw.some(kw => t === kw || t.includes(kw))) {
      try {
        await supabaseAdmin.from("campaign_optouts").upsert(
          { user_id: userId, phone: msg.phone, created_at: new Date().toISOString() },
          { onConflict: "user_id,phone" }
        )
        await this.sendWA({ phoneNumberId: connection.phone_number_id || msg.fromNumber, accessToken: connection.access_token, toNumber: msg.fromNumber, message: "You've been unsubscribed. Reply START to resubscribe anytime 🙏" })
      } catch(e) {}
      return { handled: true }
    }

    if (msg.isText && t === "start") {
      try {
        await supabaseAdmin.from("campaign_optouts").delete().eq("user_id", userId).eq("phone", msg.phone)
        await this.sendWA({ phoneNumberId: connection.phone_number_id || msg.fromNumber, accessToken: connection.access_token, toNumber: msg.fromNumber, message: "You've been resubscribed! Welcome back 😊" })
      } catch(e) {}
      return { handled: true }
    }

    return { handled: false }
  },

  async sendAndSave({ phoneNumberId, accessToken, toNumber, message, userId, conversation, msg }) {
    const result = await this.sendWA({ phoneNumberId, accessToken, toNumber, message })
    try {
      await supabaseAdmin.from("messages").insert({
        user_id:         userId,
        phone_number_id: phoneNumberId,
        from_number:     phoneNumberId,
        message_text:    message,
        direction:       "outbound",
        conversation_id: conversation?.id || null,
        customer_phone:  msg.phone,
        message_type:    "text",
        status:          "sent",
        is_ai:           true,
        wa_message_id:   result?.messages?.[0]?.id || null,
        created_at:      new Date().toISOString()
      })
    } catch(e) { console.warn("Message save failed:", e.message) }
    return result
  },

  async sendWA({ phoneNumberId, accessToken, toNumber, message }) {
    try {
      const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
        method:  "POST",
        headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body:    JSON.stringify({ messaging_product: "whatsapp", to: toNumber, type: "text", text: { body: message, preview_url: false } })
      })
      const data = await res.json()
      if (data.error) console.error("❌ WA error:", JSON.stringify(data.error))
      return data
    } catch(e) {
      console.error("❌ WA exception:", e.message)
      return {}
    }
  },

  buildAlternatingHistory(raw) {
    if (!raw?.length) return []
    const d = []
    for (const m of raw) {
      if (d.length === 0 || d[d.length-1].role !== m.role) d.push(m)
      else d[d.length-1] = m
    }
    while (d.length > 0 && d[0].role !== "user") d.shift()
    while (d.length > 0 && d[d.length-1].role === "user") d.pop()
    return d.slice(-12)
  }
}
