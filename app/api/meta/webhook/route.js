// ════════════════════════════════════════════════════════════════════
// FASTRILL WEBHOOK — VERSION 8.0
// ════════════════════════════════════════════════════════════════════
// KEY CHANGES over v7.1:
// ✅ ZERO hardcoded service keywords — 100% DB-driven service detection
// ✅ AI system prompt fully generic — works for ANY business type
// ✅ Business settings loaded FIRST, AI called LAST
// ✅ greetingRx extended with Hindi/Telugu/multilingual patterns
// ✅ extractBookingDetails now receives servicesList and ONLY uses it
// ✅ Media messages: use caption text if present before falling back
// ✅ booking_state persisted on conversations table (persistent across msgs)
// ✅ All v7.1 fixes retained
// ════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const mode      = searchParams.get("hub.mode")
  const token     = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")
  if (mode === "subscribe" && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }
  return new Response("Forbidden", { status: 403 })
}

export async function POST(req) {
  try {
    console.log("🚀 FASTRILL WEBHOOK v8.0")
    const body = await req.json()

    // ── Status updates (delivered/read/failed) ───────────────────────
    const statuses = body?.entry?.[0]?.changes?.[0]?.value?.statuses
    const hasMsg   = body?.entry?.[0]?.changes?.[0]?.value?.messages
    if (statuses && !hasMsg) {
      for (const status of statuses) {
        const waMessageId = status.id
        const statusType  = status.status
        if (waMessageId && ["delivered","read","failed"].includes(statusType)) {
          try {
            await supabaseAdmin.from("messages")
              .update({ status: statusType, [`${statusType}_at`]: new Date().toISOString() })
              .eq("wa_message_id", waMessageId)
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

    for (const message of messages) {
      const fromNumber     = message.from
      const messageType    = message.type
      const messageId      = message.id
      const timestamp      = new Date(parseInt(message.timestamp) * 1000).toISOString()
      const contact        = contacts.find(c => c.wa_id === fromNumber)
      const contactName    = contact?.profile?.name || "Customer"
      const formattedPhone = fromNumber.replace(/[^0-9]/g, "")

      // ── DUPLICATE GUARD ──────────────────────────────────────────
      const { data: dupMsg } = await supabaseAdmin
        .from("messages").select("id").eq("wa_message_id", messageId).maybeSingle()
      if (dupMsg) { console.log("⚠️ Duplicate:", messageId); continue }

      // ── EXTRACT TEXT ─────────────────────────────────────────────
      // For media messages, try to grab caption — don't just discard
      let messageText = ""
      let mediaCaption = ""
      if      (messageType === "text")        messageText = message.text?.body || ""
      else if (messageType === "button")      messageText = message.button?.text || ""
      else if (messageType === "interactive") {
        messageText = message.interactive?.button_reply?.title
          || message.interactive?.list_reply?.title || ""
      } else if (messageType === "image")     mediaCaption = message.image?.caption || ""
      else if (messageType === "video")       mediaCaption = message.video?.caption || ""
      else if (messageType === "document")    mediaCaption = message.document?.caption || ""

      // If there's a caption on media, treat it as text so AI can respond meaningfully
      const effectiveText  = messageText || mediaCaption
      const isTextMessage  = ["text","button","interactive"].includes(messageType) || !!mediaCaption
      const isMediaNoText  = !isTextMessage && ["image","video","audio","document","sticker"].includes(messageType)

      console.log(`📩 [${phoneNumberId}] From ${fromNumber} (${contactName}): "${effectiveText || "[" + messageType + "]"}"`)

      // ── LOOK UP WHATSAPP CONNECTION ──────────────────────────────
      const { data: connection } = await supabaseAdmin
        .from("whatsapp_connections")
        .select("user_id, access_token")
        .eq("phone_number_id", phoneNumberId)
        .single()
      if (!connection) { console.error("❌ No WA connection:", phoneNumberId); continue }
      const userId = connection.user_id

      // ══ 1. CRM — UPSERT CUSTOMER ════════════════════════════════
      let customer = null
      const { data: existingCustomer } = await supabaseAdmin
        .from("customers").select("*")
        .eq("phone", formattedPhone).eq("user_id", userId).maybeSingle()

      if (existingCustomer) {
        await supabaseAdmin.from("customers")
          .update({ last_visit_at: timestamp, name: existingCustomer.name || contactName })
          .eq("id", existingCustomer.id)
        customer = existingCustomer
      } else {
        const { data: newCustomer } = await supabaseAdmin.from("customers").insert({
          user_id: userId, phone: formattedPhone, name: contactName,
          source: "whatsapp", tag: "new_lead", created_at: timestamp
        }).select().single()
        customer = newCustomer
        console.log(`✅ New customer: ${contactName} (${formattedPhone})`)
      }

      // ══ 2. CRM — UPSERT CONVERSATION ════════════════════════════
      let conversation = null
      const { data: existingConvo } = await supabaseAdmin
        .from("conversations").select("*")
        .eq("phone", formattedPhone).eq("user_id", userId).maybeSingle()

      if (existingConvo) {
        const { data: updatedConvo } = await supabaseAdmin.from("conversations")
          .update({
            last_message:    effectiveText || "[media]",
            last_message_at: timestamp,
            unread_count:    (existingConvo.unread_count || 0) + 1,
            customer_id:     customer?.id || existingConvo.customer_id,
            status:          "open"
          })
          .eq("id", existingConvo.id).select().single()
        conversation = updatedConvo
      } else {
        const { data: newConvo } = await supabaseAdmin.from("conversations").insert({
          user_id: userId, customer_id: customer?.id || null,
          phone: formattedPhone, status: "open", ai_enabled: true,
          last_message: effectiveText || "[media]", last_message_at: timestamp, unread_count: 1
        }).select().single()
        conversation = newConvo
      }

      // ══ 3. MESSAGES — SAVE INBOUND ══════════════════════════════
      await supabaseAdmin.from("messages").insert({
        user_id:         userId,
        phone_number_id: phoneNumberId,
        from_number:     fromNumber,
        message_text:    effectiveText || `[${messageType} message]`,
        direction:       "inbound",
        conversation_id: conversation?.id || null,
        customer_phone:  formattedPhone,
        message_type:    messageType || "text",
        status:          "delivered",
        is_ai:           false,
        wa_message_id:   messageId || null,
        created_at:      timestamp
      })

      // ══ 4. LEADS — AUTO CAPTURE ══════════════════════════════════
      if (effectiveText) {
        if (!existingCustomer && customer) {
          try {
            await supabaseAdmin.from("leads").insert({
              user_id: userId, customer_id: customer.id,
              phone: formattedPhone, name: contactName,
              source: "whatsapp", status: "open",
              last_message: effectiveText, last_message_at: timestamp,
              ai_score: 60, estimated_value: 600
            })
          } catch(e) {}
        } else if (existingCustomer) {
          try {
            await supabaseAdmin.from("leads")
              .update({ last_message: effectiveText, last_message_at: timestamp })
              .eq("customer_id", existingCustomer.id).eq("status", "open")
          } catch(e) {}
        }
      }

      // ══ 5. COMPLIANCE — STOP / START ════════════════════════════
      const stopKeywords = ["stop","unsubscribe","opt out","optout","don't message","dont message","remove me","no more messages"]
      const isStopRequest = isTextMessage && stopKeywords.some(kw =>
        (effectiveText||"").toLowerCase().trim() === kw ||
        (effectiveText||"").toLowerCase().includes(kw)
      )
      if (isStopRequest) {
        try {
          await supabaseAdmin.from("campaign_optouts").upsert(
            { user_id: userId, phone: formattedPhone, created_at: new Date().toISOString() },
            { onConflict: "user_id,phone" }
          )
          await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: "You've been unsubscribed from our messages. Reply START to resubscribe anytime 🙏", userId, conversationId: conversation?.id, customerPhone: formattedPhone })
        } catch(e) {}
        continue
      }
      if (isTextMessage && (effectiveText||"").toLowerCase().trim() === "start") {
        try {
          await supabaseAdmin.from("campaign_optouts").delete().eq("user_id", userId).eq("phone", formattedPhone)
          await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: "You've been resubscribed! Welcome back 😊", userId, conversationId: conversation?.id, customerPhone: formattedPhone })
        } catch(e) {}
        continue
      }

      // ── Skip AI if disabled ──────────────────────────────────────
      if (conversation?.ai_enabled === false) { console.log("⏸️ AI disabled"); continue }

      // ── Handle media with NO caption ────────────────────────────
      // At this point if there's no usable text, send a generic reply
      if (isMediaNoText) {
        await sendAndSave({
          phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber,
          message: "Thanks for sharing! 😊 If you'd like to know more or have any questions, just type them here.",
          userId, conversationId: conversation?.id, customerPhone: formattedPhone
        })
        continue
      }

      // ══ 6. LOAD BUSINESS INTELLIGENCE ═══════════════════════════
      // IMPORTANT: Load everything BEFORE any AI or intent logic.
      // The AI must know what this business sells before it responds.
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
          .order("created_at", { ascending: false }).limit(14),
        supabaseAdmin.from("services").select("name, price, duration, capacity, category, is_active").eq("user_id", userId),
        supabaseAdmin.from("business_knowledge").select("*").eq("user_id", userId).maybeSingle()
      ])

      // ── Deep merge: business_settings + business_knowledge ──────
      // business_knowledge wins on overlap since it's the "AI brain" content
      const biz = {
        ...(bizSettings  || {}),
        ...(bizKnowledge || {}),
        ai_instructions: [
          bizSettings?.ai_instructions,
          bizKnowledge?.content,
          bizKnowledge?.instructions,
          bizKnowledge?.knowledge,
          bizKnowledge?.notes
        ].filter(Boolean).join("\n\n") || ""
      }

      // Active services only — what the business currently offers
      const activeServices = (servicesList || []).filter(s => s.is_active !== false)

      console.log("🧠 Business:", {
        name: biz.business_name,
        type: biz.business_type,
        services: activeServices.length,
        hasAIBrain: !!(biz.ai_instructions)
      })

      const historyRaw = (rawHistory || []).reverse().map(m => ({
        role:    m.direction === "inbound" ? "user" : "assistant",
        content: (m.message_text || "").trim()
      })).filter(m => m.content && m.content !== "[media message]")

      const conversationHistory = buildAlternatingHistory(historyRaw)

      // ── Load persisted booking state from conversation ───────────
      // This prevents losing context across messages
      let persistedBookingState = null
      try {
        if (conversation?.booking_state) {
          persistedBookingState = typeof conversation.booking_state === "string"
            ? JSON.parse(conversation.booking_state)
            : conversation.booking_state
        }
      } catch(e) { persistedBookingState = null }

      // ══ 7. DETECT INTENT ════════════════════════════════════════
      // Pass activeServices so detection is 100% DB-driven, zero hardcoded keywords
      const intent = detectIntent(conversationHistory, effectiveText, activeServices, persistedBookingState)
      console.log("🎯 Intent:", intent.type, "| State:", JSON.stringify(intent.bookingState))

      // ── Persist updated booking state ────────────────────────────
      if (conversation?.id && (intent.bookingState.service || intent.bookingState.date || intent.bookingState.time)) {
        try {
          await supabaseAdmin.from("conversations")
            .update({ booking_state: JSON.stringify(intent.bookingState) })
            .eq("id", conversation.id)
        } catch(e) { console.warn("booking_state persist failed:", e.message) }
      }

      // ══ 7b. DETECT EXTERNAL BOOKING REQUESTS ════════════════════
      // Only triggers if customer explicitly asks for something outside this business
      const isExternalVenue = /\b(restaurant|resto|hotel|cafe|diner|bar|dhaba|club|resort|lounge|movie|flight|train|bus)\b/i.test(effectiveText)
      const isBookingVerb   = /\b(book|reserve|table|seat|reservation|ticket)\b/i.test(effectiveText)
      if (isExternalVenue && isBookingVerb) {
        const businessName   = biz.business_name || "us"
        const servicesPreview = activeServices.slice(0, 3).map(s => s.name).join(", ")
        const rejectMsg = `Hi! I can only help with bookings for ${businessName} 😊${servicesPreview ? `\n\nWe offer: ${servicesPreview}${activeServices.length > 3 ? " and more" : ""}.\n\nWould you like to book with us?` : ""}`
        await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: rejectMsg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
        continue
      }

      // ══ 8. INSTANT REPLIES (no AI needed) ═══════════════════════
      // These use business settings data directly — fast, accurate, no AI cost
      if (intent.type === "pricing" && !intent.bookingState.service) {
        const priceReply = buildPricingReply(activeServices, biz)
        await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: priceReply, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
        continue
      }
      if (intent.type === "location") {
        const locationReply = buildLocationReply(biz)
        await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: locationReply, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
        continue
      }
      if (intent.type === "hours") {
        const hoursReply = buildHoursReply(biz)
        await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: hoursReply, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
        continue
      }

      // ══ 9. RESCHEDULE FLOW ══════════════════════════════════════
      if (intent.type === "reschedule" && intent.bookingState.date && intent.bookingState.time) {
        const { data: existingBooking } = await supabaseAdmin
          .from("bookings").select("*")
          .eq("customer_phone", formattedPhone).eq("user_id", userId)
          .in("status", ["confirmed","pending"])
          .order("booking_date", { ascending: true }).limit(1).maybeSingle()

        if (existingBooking) {
          const slotFree = await isSlotAvailable({
            userId, date: intent.bookingState.date, time: intent.bookingState.time,
            service: existingBooking.service, servicesList: activeServices,
            excludeBookingId: existingBooking.id
          })
          if (!slotFree) {
            const altSlot = await findNextAvailableSlot({ userId, date: intent.bookingState.date, service: existingBooking.service, servicesList: activeServices })
            const busyMsg = altSlot
              ? `That slot is full 😅 Next available: *${altSlot}*\n\nShall I book that instead? ✅`
              : `That slot is fully booked 😅 Please suggest another time?`
            await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: busyMsg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
            continue
          }
          await supabaseAdmin.from("bookings")
            .update({ booking_date: intent.bookingState.date, booking_time: intent.bookingState.time, status: "confirmed" })
            .eq("id", existingBooking.id)
          const rescheduleMsg = buildRescheduleConfirmation(existingBooking.service, intent.bookingState.date, intent.bookingState.time, biz.business_name || "our business")
          await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: rescheduleMsg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
          // Clear booking state after reschedule
          try { await supabaseAdmin.from("conversations").update({ booking_state: null }).eq("id", conversation.id) } catch(e) {}
          continue
        }
      }

      // ══ 10. NEW BOOKING CREATION ═════════════════════════════════
      if (intent.type === "booking" && intent.bookingState.readyToBook) {
        const { date, time, service } = intent.bookingState
        const matchedService = matchService(service, activeServices)
        const slotFree = await isSlotAvailable({ userId, date, time, service: matchedService?.name || service, servicesList: activeServices })
        if (!slotFree) {
          const altSlot = await findNextAvailableSlot({ userId, date, service: matchedService?.name || service, servicesList: activeServices })
          const busyMsg = altSlot
            ? `That slot is taken 😅 How about *${altSlot}*? Shall I book that? ✅`
            : `That time slot is fully booked 😅 Could you suggest another time?`
          await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: busyMsg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
          continue
        }

        const { data: newBooking, error: bookErr } = await supabaseAdmin.from("bookings").insert({
          user_id:        userId,
          customer_name:  contactName,
          customer_phone: formattedPhone,
          customer_id:    customer?.id || null,
          service:        matchedService?.name || service || "Appointment",
          booking_date:   date,
          booking_time:   time,
          amount:         matchedService?.price || 0,
          status:         "confirmed",
          ai_booked:      true,
          created_at:     new Date().toISOString()
        }).select().single()

        if (!bookErr && newBooking) {
          console.log("✅ Booking created:", newBooking.id, service, date, time)
          try {
            const { count: bookingCount } = await supabaseAdmin.from("bookings").select("id", { count: "exact" })
              .eq("customer_phone", formattedPhone).eq("user_id", userId).in("status", ["confirmed","completed"])
            const newTag = bookingCount >= 5 ? "vip" : bookingCount >= 2 ? "returning" : "new_lead"
            await supabaseAdmin.from("customers").update({ tag: newTag, last_visit_at: new Date().toISOString() })
              .eq("phone", formattedPhone).eq("user_id", userId)
          } catch(e) {}
          try {
            await supabaseAdmin.from("leads").update({ status: "converted", last_message_at: new Date().toISOString() })
              .eq("customer_id", customer?.id).eq("user_id", userId).eq("status", "open")
          } catch(e) {}
          // Clear booking state after successful booking
          try { await supabaseAdmin.from("conversations").update({ booking_state: null }).eq("id", conversation.id) } catch(e) {}
        }

        const confirmMsg = buildConfirmationMessage(matchedService?.name || service, date, time, biz.business_name || "our business")
        await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: confirmMsg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
        await supabaseAdmin.from("conversations").update({ last_message: "✅ Booking Confirmed — " + (matchedService?.name || service) }).eq("id", conversation?.id)
        continue
      }

      // ══ 11. AI REPLY ═════════════════════════════════════════════
      // By this point biz, activeServices, and conversationHistory are all loaded.
      // The AI gets the full business context — it knows what this business sells.
      const aiReply = await generateAIReply({
        customerMessage: effectiveText,
        bizSettings:     biz,
        history:         conversationHistory,
        customerName:    contactName,
        intent,
        servicesList:    activeServices
      })

      console.log("📤 Sending:", aiReply.substring(0, 120))
      await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: aiReply, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
      await supabaseAdmin.from("conversations").update({ last_message: aiReply, last_message_at: new Date().toISOString() }).eq("id", conversation?.id)
    }

    return NextResponse.json({ status: "ok" }, { status: 200 })
  } catch (err) {
    console.error("❌ Webhook fatal error:", err)
    return NextResponse.json({ status: "error", message: err.message }, { status: 200 })
  }
}

// ════════════════════════════════════════════════════════════════════
// INTENT DETECTION — fully generic, no niche assumptions
// ════════════════════════════════════════════════════════════════════

function detectIntent(history, latestMessage, servicesList, persistedState) {
  const latestLower = (latestMessage || "").toLowerCase().trim()
  const allText     = [...history.map(m => m.content), latestMessage].join(" ").toLowerCase()

  const rescheduleKw = ["reschedule","change booking","change appointment","change timing","postpone","shift booking","move booking","different time","different date","another time","another day","change slot"]
  const cancelKw     = ["cancel","cancellation","don't want","not coming","cant come","cannot come","won't come","nahi aana","cancel karo"]
  const bookingKw    = ["book","appointment","slot","schedule","availab","fix appointment","want to come","coming in","visit","book karo","booking","reserve","enquire","inquiry","interested"]
  const pricingKw    = ["price","cost","rate","how much","charges","kitna","ekkuva","entha","fees","charge","amount","pricing","plans","packages","offer"]
  const locationKw   = ["location","address","where are you","where is","directions","maps","navigate","how to reach","how to come","landmark","find you"]
  const hoursKw      = ["timing","timings","hours","open","close","when","working hours","available","availability","what time","office hours","business hours"]

  // ── Multilingual greeting detection ─────────────────────────────
  // Covers English, Hindi, Telugu, Tamil, Kannada, Marathi, Bengali, Gujarati
  const greetingRx = /^(hi|hello|hey|hii|helo|hai|hiya|gm|heyyy|sup|whats\s*up|good\s*(morning|afternoon|evening|night)|namaste|namaskar|vanakkam|nomoskar|namaskaara|pranam|kem\s*cho|kasa\s*kay|sat\s*sri\s*akal|assalam|wa\s*alaikum|haan|bolo|bol|yo|wassup|ayyo|ayo)[!\s.]*$/i

  const isReschedule = rescheduleKw.some(kw => latestLower.includes(kw))
  const isCancel     = cancelKw.some(kw => latestLower.includes(kw))
  const isBooking    = bookingKw.some(kw => latestLower.includes(kw))
  const isPricing    = pricingKw.some(kw => latestLower.includes(kw))
  const isLocation   = locationKw.some(kw => latestLower.includes(kw))
  const isHours      = hoursKw.some(kw => latestLower.includes(kw))
  const isGreeting   = greetingRx.test(latestLower)

  // ── Extract booking details using ONLY DB services (no hardcoded keywords) ──
  const bookingState = extractBookingDetails(history, latestMessage, allText, latestLower, servicesList, persistedState)

  let type = "general"
  if      (isCancel)     type = "cancel"
  else if (isReschedule) type = "reschedule"
  else if (isBooking || bookingState.service || bookingState.date || bookingState.time) type = "booking"
  else if (isGreeting)   type = "greeting"
  else if (isPricing)    type = "pricing"
  else if (isHours)      type = "hours"
  else if (isLocation)   type = "location"

  if (type === "reschedule" && !bookingState.date) {
    const fresh = extractBookingDetails([], latestMessage, latestLower, latestLower, servicesList, null)
    bookingState.date = fresh.date
    bookingState.time = fresh.time
  }

  return { type, bookingState }
}

// ════════════════════════════════════════════════════════════════════
// BOOKING DETAILS EXTRACTOR
// ════════════════════════════════════════════════════════════════════
// KEY CHANGE: Service detection uses ONLY servicesList from DB.
// No hardcoded keywords. If the business sells "Automation Setup" or
// "Immigration Consultation" or "Roof Repair" — it will be detected.
// The persistedState arg carries forward any partially collected info
// from previous messages via the conversations.booking_state column.

function extractBookingDetails(history, latestMessage, allText, latestLower, servicesList, persistedState) {
  const now = new Date()

  // Start from persisted state if available (cross-message memory)
  const state = {
    service:      persistedState?.service      || null,
    date:         persistedState?.date         || null,
    time:         persistedState?.time         || null,
    readyToBook:  false
  }

  // ── SERVICE DETECTION: 100% DB-driven ───────────────────────────
  // Check servicesList from DB against conversation text.
  // No hardcoded keywords. Works for ANY business type.
  if (!state.service && servicesList?.length) {
    const textToCheck = allText.toLowerCase()
    // Priority 1: exact match
    for (const svc of servicesList) {
      if (textToCheck.includes(svc.name.toLowerCase())) {
        state.service = svc.name
        break
      }
    }
    // Priority 2: partial word match (e.g. "automation" matches "Automation Setup")
    if (!state.service) {
      for (const svc of servicesList) {
        const words = svc.name.toLowerCase().split(/\s+/).filter(w => w.length > 3)
        if (words.some(w => textToCheck.includes(w))) {
          state.service = svc.name
          break
        }
      }
    }
  }

  // ── DATE EXTRACTION ──────────────────────────────────────────────
  if (!state.date) {
    const hasDateInLatest =
      /\b(today|tomorrow|kal|parso|sun|mon|tue|wed|thu|fri|sat|sunday|monday|tuesday|wednesday|thursday|friday|saturday|aaj|kal)\b/i.test(latestMessage) ||
      /\d{1,2}[\/\-]\d{1,2}/.test(latestMessage) ||
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(latestMessage) ||
      /\d{1,2}(st|nd|rd|th)/i.test(latestMessage)

    const dateText = hasDateInLatest ? latestLower : allText
    const todayStr = now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2,"0") + "-" + String(now.getDate()).padStart(2,"0")

    if (dateText.includes("today") || dateText.includes("aaj")) {
      state.date = todayStr
    } else if (dateText.includes("tomorrow") || dateText.includes("kal ") || dateText.includes("kal\n")) {
      const t = new Date(now); t.setDate(now.getDate()+1)
      state.date = t.getFullYear() + "-" + String(t.getMonth()+1).padStart(2,"0") + "-" + String(t.getDate()).padStart(2,"0")
    } else if (dateText.includes("parso") || dateText.includes("day after")) {
      const t = new Date(now); t.setDate(now.getDate()+2)
      state.date = t.getFullYear() + "-" + String(t.getMonth()+1).padStart(2,"0") + "-" + String(t.getDate()).padStart(2,"0")
    } else {
      const days = [
        {idx:0, names:["sunday","sun"]}, {idx:1, names:["monday","mon"]},
        {idx:2, names:["tuesday","tue"]}, {idx:3, names:["wednesday","wed"]},
        {idx:4, names:["thursday","thu"]}, {idx:5, names:["friday","fri"]},
        {idx:6, names:["saturday","sat"]}
      ]
      for (const day of days) {
        if (day.names.some(n => new RegExp("\\b" + n + "\\b","i").test(dateText))) {
          let diff = (day.idx - now.getDay() + 7) % 7
          if (diff === 0) diff = 7
          const d = new Date(now); d.setDate(now.getDate()+diff)
          state.date = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0")
          break
        }
      }
    }

    if (!state.date) {
      const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"]
      const src = hasDateInLatest ? latestMessage : allText
      for (let i = 0; i < months.length; i++) {
        const re = new RegExp("(\\d{1,2})(?:st|nd|rd|th)?\\s*" + months[i] + "|" + months[i] + "\\s*(\\d{1,2})(?:st|nd|rd|th)?", "i")
        const m  = src.match(re)
        if (m) {
          const day = parseInt(m[1] || m[2])
          if (day >= 1 && day <= 31) {
            state.date = now.getFullYear() + "-" + String(i+1).padStart(2,"0") + "-" + String(day).padStart(2,"0")
            break
          }
        }
      }
    }

    if (!state.date) {
      const src = hasDateInLatest ? latestMessage : allText
      const m   = src.match(/(\d{1,2})[\/\-](\d{1,2})/)
      if (m) state.date = now.getFullYear() + "-" + String(m[2]).padStart(2,"0") + "-" + String(m[1]).padStart(2,"0")
    }
  }

  // ── TIME EXTRACTION ──────────────────────────────────────────────
  if (!state.time) {
    const hasTimeInLatest =
      /\d{1,2}(:\d{2})?\s*(am|pm)/i.test(latestMessage) ||
      /\d{2}:\d{2}/.test(latestMessage) ||
      /\b\d{1,2}(pm|am)\b/i.test(latestMessage) ||
      /\b(morning|afternoon|evening|night|subah|dopahar|shaam|raat)\b/i.test(latestMessage)

    const timeText = hasTimeInLatest ? latestMessage : allText

    if      (/\b(morning|subah)\b/i.test(timeText) && !hasTimeInLatest)        state.time = "10:00"
    else if (/\b(afternoon|dopahar)\b/i.test(timeText) && !hasTimeInLatest)    state.time = "14:00"
    else if (/\b(evening|shaam)\b/i.test(timeText) && !hasTimeInLatest)        state.time = "17:00"
    else if (/\b(night|raat)\b/i.test(timeText) && !hasTimeInLatest)           state.time = "19:00"
    else {
      const tm = timeText.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i) || timeText.match(/(\d{2}):(\d{2})/)
      if (tm) {
        let hour   = parseInt(tm[1])
        const min  = tm[2] ? tm[2] : "00"
        const ampm = tm[3]?.toLowerCase()
        if (ampm === "pm" && hour < 12) hour += 12
        if (ampm === "am" && hour === 12) hour = 0
        if (hour >= 7 && hour <= 22) state.time = String(hour).padStart(2,"0") + ":" + min.padStart(2,"0")
      }
    }
  }

  // ── CONFIRM DETECTION ────────────────────────────────────────────
  const confirmWords = ["yes","yeah","yep","yup","ok","okay","sure","confirm","correct","right","haan","ha","ji","theek","done","book it","go ahead","please book","book karo","sounds good","perfect","great","yeahh","yess","k","👍","✅","proceed","do it","bilkul","zaroor"]
  const isConfirming = confirmWords.some(w => latestLower.trim() === w || latestLower.trim().startsWith(w + " ") || latestLower.trim().endsWith(" " + w))
  const lastAiMsg = [...history].reverse().find(m => m.role === "assistant")
  const aiAskedConfirm = lastAiMsg && (
    lastAiMsg.content.toLowerCase().includes("shall i book") ||
    lastAiMsg.content.toLowerCase().includes("shall i confirm") ||
    lastAiMsg.content.toLowerCase().includes("want me to book") ||
    lastAiMsg.content.toLowerCase().includes("book you for") ||
    lastAiMsg.content.toLowerCase().includes("confirm booking") ||
    lastAiMsg.content.toLowerCase().includes("confirm your booking") ||
    lastAiMsg.content.toLowerCase().includes("book that") ||
    lastAiMsg.content.toLowerCase().includes("confirm that")
  )

  if (state.service && state.date && state.time && isConfirming && aiAskedConfirm) {
    state.readyToBook = true
  }

  return state
}

// ════════════════════════════════════════════════════════════════════
// AI REPLY GENERATOR — v8.0
// FULLY GENERIC: system prompt is 100% data-driven from business settings.
// The AI knows nothing about salons, clinics, or any niche by default.
// It only knows what THIS business has configured in their settings.
// ════════════════════════════════════════════════════════════════════

async function generateAIReply({ customerMessage, bizSettings, history, customerName, intent, servicesList }) {
  const firstName      = (customerName || "").split(" ")[0] || "there"
  const businessName   = bizSettings?.business_name   || "our business"
  const businessType   = bizSettings?.business_type   || "business"
  const location       = bizSettings?.location        || ""
  const mapsLink       = bizSettings?.maps_link       || ""
  const workingHours   = bizSettings?.working_hours   || ""
  const aiInstructions = bizSettings?.ai_instructions || ""
  const greetingStyle  = bizSettings?.greeting_message|| ""
  const aiLanguage     = bizSettings?.ai_language     || "English"
  const description    = bizSettings?.description     || ""

  // Build services text dynamically from DB — no assumptions about what they sell
  const servicesText = servicesList.length > 0
    ? servicesList.map(s => {
        let line = `• ${s.name}: ₹${s.price}`
        if (s.duration) line += ` (${s.duration} min)`
        if (s.category) line += ` [${s.category}]`
        return line
      }).join("\n")
    : ""

  // Build booking hint from current intent state
  const bs = intent.bookingState
  let bookingHint = ""
  if (bs.service || bs.date || bs.time) {
    const collected = [], missing = []
    if (bs.service) collected.push("service: " + bs.service)
    else missing.push("which service they want")
    if (bs.date) collected.push("date: " + new Date(bs.date + "T12:00:00").toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short" }))
    else missing.push("their preferred date")
    if (bs.time) collected.push("time: " + bs.time)
    else missing.push("their preferred time")
    bookingHint = "\n\nBOOKING PROGRESS:"
    if (collected.length) bookingHint += "\nAlready collected: " + collected.join(", ")
    if (missing.length)   bookingHint += "\nStill need: " + missing.join(", ")
    if (!missing.length)  bookingHint += "\nAll details collected — ask customer to confirm!"
  }

  const intentHint =
    intent.type === "reschedule" ? "\nCUSTOMER INTENT: Wants to reschedule — collect new date and time only." :
    intent.type === "cancel"     ? "\nCUSTOMER INTENT: Wants to cancel — acknowledge warmly, offer to reschedule instead." : ""

  // ── GENERIC SYSTEM PROMPT ────────────────────────────────────────
  // This prompt works for a salon, a law firm, an automation agency,
  // a dental clinic, a tutoring center — anything. It reads its
  // knowledge entirely from what the business owner configured.
  const systemPrompt = `You are the AI assistant for ${businessName}${businessType ? ` (${businessType})` : ""}${location ? `, located at ${location}` : ""}.

Your job is to help customers by answering questions about this business and helping them book appointments or services.

CRITICAL RULES:
1. You ONLY represent ${businessName}. Never help book or recommend other businesses.
2. Keep replies SHORT — maximum 3-4 lines. Customers are on WhatsApp, not reading emails.
3. Be warm, friendly, and conversational. Not robotic. Not repetitive.
4. Never show your reasoning or thinking. Send only the final reply.
5. If a customer asks about something this business doesn't offer, politely say so and mention what you do offer.
${description ? `\nABOUT THIS BUSINESS:\n${description}` : ""}
${servicesText ? `\nSERVICES THIS BUSINESS OFFERS:\n${servicesText}` : "\nThis business has not listed their services yet — if asked, say you'll check and get back to them."}
${workingHours ? `\nWORKING HOURS: ${workingHours}` : ""}
${location ? `\nADDRESS: ${location}` : ""}
${mapsLink ? `\nMAPS LINK: ${mapsLink}` : ""}
${aiInstructions ? `\nBUSINESS OWNER'S INSTRUCTIONS FOR YOU:\n${aiInstructions}` : ""}
${greetingStyle ? `\nGREETING STYLE: ${greetingStyle}` : ""}

BOOKING FLOW — when a customer wants to book, collect ONE piece of info at a time:
1. Which service? (from the list above — don't suggest services not on the list)
2. Which date?
3. Which time?
4. Once all 3 collected → say exactly: "Shall I confirm booking for [service] on [date] at [time]? ✅"
5. If customer says yes → booking is auto-created, you don't need to do anything else
${intentHint}${bookingHint}

LANGUAGE: Reply in ${aiLanguage}. If the customer writes in a different language, match their language naturally.
TONE: Conversational, helpful, brief. 1-2 emojis max. No lengthy paragraphs.`

  // Try Sarvam AI
  if (process.env.SARVAM_API_KEY) {
    try {
      const sarvamMessages = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: customerMessage }
      ]
      console.log("🔄 Calling Sarvam | history length:", history.length)
      const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
        method:  "POST",
        headers: { "Content-Type": "application/json", "api-subscription-key": process.env.SARVAM_API_KEY },
        body:    JSON.stringify({ model: "sarvam-2", messages: sarvamMessages, max_tokens: 500, temperature: 0.65 })
      })
      const rawText = await response.text()
      console.log("📨 Sarvam HTTP:", response.status)
      const data = JSON.parse(rawText)
      if (data?.error) {
        console.error("❌ Sarvam error:", JSON.stringify(data.error))
      } else {
        const rawContent = data?.choices?.[0]?.message?.content || ""
        const reply      = extractSarvamReply(rawContent)
        if (reply) return reply
      }
    } catch (err) {
      console.error("Sarvam exception:", err.message)
    }
  }

  console.warn("⚠️ Sarvam unavailable — using smart fallback")
  return smartFallback({ msg: customerMessage, intent, businessName, servicesText, firstName, location, mapsLink, bookingState: bs, servicesList })
}

// ════════════════════════════════════════════════════════════════════
// SARVAM REPLY EXTRACTOR — v7.1 (unchanged, proven stable)
// ════════════════════════════════════════════════════════════════════

function extractSarvamReply(rawContent) {
  if (!rawContent || !rawContent.trim()) return null
  console.log("📨 Sarvam raw (400):", rawContent.substring(0, 400))
  if (rawContent.includes("</think>")) {
    const afterThink = rawContent.split("</think>").pop().trim()
    if (afterThink && afterThink.length > 3) { console.log("✅ Pattern A"); return afterThink }
  }
  if (!rawContent.includes("<think>") && !rawContent.includes("</think>")) {
    const reply = rawContent.trim()
    if (reply.length > 3) { console.log("✅ Pattern D"); return reply }
  }
  const stripped = rawContent.replace(/<\/think>/g, "").replace(/<think>/g, "").trim()
  const lines = stripped.split("\n").map(l => l.trim()).filter(l => l.length > 2)
  const reasoningStarters = ["so ","the ","wait","let me","first","i need","i should","okay,","okay.","but ","now,","now.","since ","the user","looking at","according","maybe ","perhaps ","however","alternatively","the assistant","the response","the booking","to summarize","in summary","so the","so i","i'll","i will","that means","this means","the customer","based on"]
  const isReasoning = (line) => line.length > 200 || reasoningStarters.some(s => line.toLowerCase().startsWith(s))
  const replyStarters = [/^(hi|hello|hey|sure|great|got it|perfect|of course|absolutely|no problem)/i,/^[\u{1F600}-\u{1F9FF}]/u,/^(sure|ok|okay|yes|no problem|thanks|thank you)/i,/^\*/,/^(your|we |here|happy to|would you|what (date|time|service)|which)/i,/^[A-Z][a-z].*\?$/]
  const isReply = (line) => replyStarters.some(rx => rx.test(line.trim()))
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]
    if (line.length < 200 && !isReasoning(line)) {
      if (isReply(line) || line.endsWith("?") || line.endsWith("😊") || line.endsWith("✅")) {
        console.log("✅ Pattern B/E"); return line
      }
    }
  }
  const paragraphs = stripped.split("\n\n").map(p => p.trim()).filter(p => p.length > 3)
  for (let i = paragraphs.length - 1; i >= 0; i--) {
    if (paragraphs[i].length < 150) { console.log("✅ Pattern C"); return paragraphs[i] }
  }
  const responseMatch = stripped.match(/(?:response should be|reply should be|answer should be|say something like)[:\s]*[""]?([^""\n]+)[""]?/i)
  if (responseMatch?.[1]) { const e = responseMatch[1].trim().replace(/^[""]|[""]$/g,""); if (e.length>3&&e.length<300) return e }
  const lastLine = lines[lines.length - 1]
  if (lastLine && lastLine.length < 400) { console.log("✅ Last resort"); return lastLine }
  console.warn("⚠️ Could not extract Sarvam reply")
  return null
}

// ════════════════════════════════════════════════════════════════════
// SMART FALLBACK — also generic, uses servicesList from DB
// ════════════════════════════════════════════════════════════════════

function smartFallback({ msg, intent, businessName, servicesText, firstName, location, mapsLink, bookingState: bs, servicesList }) {
  const m = (msg || "").toLowerCase().trim()
  if (intent.type === "reschedule") {
    if (!bs.date && !bs.time) return `Sure ${firstName}! 📅 What new date and time works for you?`
    if (bs.date  && !bs.time) return `Got the date! ⏰ What time would you prefer?`
    if (!bs.date &&  bs.time) return `Got the time! 📅 What date works for you?`
    return `Reschedule to ${bs.date} at ${bs.time} — shall I confirm? ✅`
  }
  if (intent.type === "cancel") return `I understand you want to cancel 😔\n\nWould you prefer to reschedule instead? We'd love to help you!`
  if (intent.type === "greeting") return `Hi ${firstName}! 👋 Welcome to *${businessName}*!\n\nHow can I help you today? 😊`
  if (intent.type === "pricing") {
    if (servicesText) return `*Our Services & Pricing*\n\n${servicesText}\n\nInterested in any of these? 😊`
    return `I'll check our latest pricing and get back to you shortly! 🙌`
  }
  if (intent.type === "hours") {
    const hours = bizSettings?.working_hours
    if (hours) return `⏰ *Our Hours*\n\n${hours}\n\nFeel free to reach out anytime! 😊`
    return `I'll check our working hours and let you know! 🙌`
  }
  if (intent.type === "location") {
    if (location && mapsLink) return `📍 ${location}\n\n🗺️ ${mapsLink}\n\nSee you soon! 😊`
    if (location)             return `📍 We're at: ${location}`
    return `I'll share our location shortly 📍`
  }
  if (intent.type === "booking") {
    if (!bs.service) {
      if (servicesList?.length) {
        const topServices = servicesList.slice(0, 3).map(s => s.name).join(", ")
        return `I'd love to help you book! 😊\n\nWe offer: ${topServices}${servicesList.length > 3 ? " and more" : ""}.\n\nWhich service interests you?`
      }
      return `I'd love to help you book! 😊\n\nWhich service are you interested in?`
    }
    if (bs.service && !bs.date) return `Sure! 📅 What date works for your ${bs.service}?`
    if (bs.service && bs.date && !bs.time) return `Almost there! ⏰ What time works for you?`
    return `Shall I confirm booking for *${bs.service}* on ${bs.date} at ${bs.time}? ✅`
  }
  if (/thank|thanks|ok|okay|great|perfect|good|noted|done|alright/.test(m)) return `You're welcome! 😊 Looking forward to seeing you at *${businessName}*!`
  if (/speak|human|owner|manager|staff|agent/.test(m)) return `Of course! 🙌 I'll notify our team and someone will reach out shortly.`
  // Generic fallback — lists actual services from DB
  const serviceList = servicesList?.length
    ? servicesList.slice(0, 3).map(s => s.name).join(", ")
    : ""
  return `Thanks for reaching out to *${businessName}*! 😊\n\n${serviceList ? `We offer ${serviceList} and more.\n\n` : ""}How can I help?\n📅 Book an appointment\n💰 Services & pricing\n📍 Find us`
}

// ════════════════════════════════════════════════════════════════════
// INSTANT REPLY BUILDERS — 100% from DB settings
// ════════════════════════════════════════════════════════════════════

function buildPricingReply(servicesList, biz) {
  if (!servicesList?.length) return `Please reach us directly for our latest pricing 🙏\n\nOr ask about any specific service!`
  const list = servicesList.map(s => {
    let line = `• *${s.name}* — ₹${s.price}`
    if (s.duration) line += ` (${s.duration} min)`
    return line
  }).join("\n")
  return `*${biz.business_name || "Our"} Services*\n\n${list}\n\nWant to book? Just let me know! 😊`
}

function buildLocationReply(biz) {
  const location = biz?.location || ""
  const mapsLink = biz?.maps_link || ""
  if (location && mapsLink) return `📍 *${biz.business_name || "We're"}* at:\n${location}\n\n🗺️ ${mapsLink}\n\nSee you soon! 😊`
  if (location)             return `📍 We're at: *${location}*\n\nWant to book? 😊`
  return `I'll get our address for you shortly! 📍`
}

function buildHoursReply(biz) {
  const hours = biz?.working_hours || ""
  const name  = biz?.business_name || "We"
  if (hours) return `⏰ *${name}* is open:\n\n${hours}\n\nAnything else I can help with? 😊`
  return `I'll check our working hours and get back to you! ⏰`
}

function buildConfirmationMessage(service, date, time, businessName) {
  const formatted = date ? new Date(date + "T12:00:00").toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" }) : date
  return `✅ *Booking Confirmed!*\n\n📋 Service: ${service}\n📅 Date: ${formatted || date}${time ? `\n⏰ Time: ${time}` : ""}\n\nSee you soon at *${businessName}*! 😊`
}

function buildRescheduleConfirmation(service, date, time, businessName) {
  const formatted = date ? new Date(date + "T12:00:00").toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" }) : date
  return `✅ *Booking Rescheduled!*\n\n📋 Service: ${service}\n📅 New Date: ${formatted || date}${time ? `\n⏰ New Time: ${time}` : ""}\n\nAll updated! See you at *${businessName}* 😊`
}

// ════════════════════════════════════════════════════════════════════
// SLOT AVAILABILITY ENGINE (unchanged from v7.1)
// ════════════════════════════════════════════════════════════════════

async function isSlotAvailable({ userId, date, time, service, servicesList, excludeBookingId }) {
  if (!date || !time) return true
  const svc      = matchService(service, servicesList)
  const capacity = svc?.capacity || 1
  const query    = supabaseAdmin.from("bookings").select("id")
    .eq("user_id", userId).eq("booking_date", date).eq("booking_time", time)
    .in("status", ["confirmed","pending"])
  if (excludeBookingId) query.neq("id", excludeBookingId)
  const { data: existing } = await query
  return (existing?.length || 0) < capacity
}

async function findNextAvailableSlot({ userId, date, service, servicesList }) {
  if (!date) return null
  const svc      = matchService(service, servicesList)
  const duration = svc?.duration || 30
  const slots    = []
  let m = 9 * 60
  while (m <= 20 * 60) {
    slots.push(`${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`)
    m += duration
  }
  for (const time of slots) {
    const free = await isSlotAvailable({ userId, date, time, service, servicesList })
    if (free) {
      const dt = new Date(date + "T" + time + ":00")
      return dt.toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short" }) + " at " + time
    }
  }
  return null
}

function matchService(serviceName, servicesList) {
  if (!serviceName || !servicesList?.length) return null
  const s = serviceName.toLowerCase().trim()
  return servicesList.find(svc => svc.name.toLowerCase() === s)
    || servicesList.find(svc => svc.name.toLowerCase().includes(s) || s.includes(svc.name.toLowerCase()))
    || null
}

// ════════════════════════════════════════════════════════════════════
// CONVERSATION HISTORY BUILDER (unchanged from v7.1)
// ════════════════════════════════════════════════════════════════════

function buildAlternatingHistory(rawHistory) {
  if (!rawHistory || rawHistory.length === 0) return []
  const deduped = []
  for (const msg of rawHistory) {
    if (deduped.length === 0 || deduped[deduped.length-1].role !== msg.role) {
      deduped.push(msg)
    } else {
      deduped[deduped.length-1] = msg
    }
  }
  while (deduped.length > 0 && deduped[0].role !== "user") deduped.shift()
  while (deduped.length > 0 && deduped[deduped.length-1].role === "user") deduped.pop()
  return deduped.slice(-10)
}

// ════════════════════════════════════════════════════════════════════
// WHATSAPP SENDER + MESSAGE SAVER (unchanged from v7.1)
// ════════════════════════════════════════════════════════════════════

async function sendAndSave({ phoneNumberId, accessToken, toNumber, message, userId, conversationId, customerPhone }) {
  const sendResult = await sendWhatsAppMessage({ phoneNumberId, accessToken, toNumber, message })
  await supabaseAdmin.from("messages").insert({
    user_id:         userId,
    phone_number_id: phoneNumberId,
    from_number:     phoneNumberId,
    message_text:    message,
    direction:       "outbound",
    conversation_id: conversationId || null,
    customer_phone:  customerPhone,
    message_type:    "text",
    status:          "sent",
    is_ai:           true,
    wa_message_id:   sendResult?.messages?.[0]?.id || null,
    created_at:      new Date().toISOString()
  })
  return sendResult
}

async function sendWhatsAppMessage({ phoneNumberId, accessToken, toNumber, message }) {
  try {
    const res = await fetch("https://graph.facebook.com/v18.0/" + phoneNumberId + "/messages", {
      method:  "POST",
      headers: { "Authorization": "Bearer " + accessToken, "Content-Type": "application/json" },
      body:    JSON.stringify({ messaging_product: "whatsapp", to: toNumber, type: "text", text: { body: message, preview_url: false } })
    })
    const data = await res.json()
    if (data.error) console.error("❌ WA send error:", JSON.stringify(data.error))
    return data
  } catch (err) {
    console.error("❌ WA send exception:", err.message)
    return {}
  }
}
