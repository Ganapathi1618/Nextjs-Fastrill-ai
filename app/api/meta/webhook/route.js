import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import "@/lib/env"

// ════════════════════════════════════════════════════════════════════
// FASTRILL WEBHOOK — VERSION 9.3
// ════════════════════════════════════════════════════════════════════
// Complete booking state machine — all paths handled:
//
// BOOKING FLOW (all steps bypass AI entirely):
//   1. Customer says service → ask date
//   2. Customer says date   → ask time  
//   3. Customer says time   → send "Shall I confirm X on Y at Z?"
//   4. Customer says yes    → create booking → clear state
//   5. Customer says no     → clear state → ask "What would you like to change?"
//   6. Customer says "reschedule" → use ACTIVE service (not old DB booking)
//
// RESCHEDULE RULE (the haircut bug fix):
//   Always use booking_state.service if present.
//   Only fall back to DB lookup if no active booking in progress.
//
// REJECTION DETECTION:
//   "no", "wrong", "change", "different" after AI asked confirm →
//   clears booking_state in DB + in memory → asks what to change.
//
// SARVAM is ONLY called for general conversation (not booking flow).
// Every booking step is rule-based and deterministic.
// ════════════════════════════════════════════════════════════════════

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ── GET: Webhook verification ────────────────────────────────────────
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

// ── POST: Receive messages ───────────────────────────────────────────
export async function POST(req) {
  try {
    console.log("🚀 FASTRILL WEBHOOK v9.3")
    const body = await req.json()

    // Status updates (delivered/read/failed) — no AI needed
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

    for (const message of messages) {
      const fromNumber     = message.from
      const messageType    = message.type
      const messageId      = message.id
      const timestamp      = new Date(parseInt(message.timestamp) * 1000).toISOString()
      const contact        = contacts.find(c => c.wa_id === fromNumber)
      const contactName    = contact?.profile?.name || "Customer"
      const formattedPhone = fromNumber.replace(/[^0-9]/g, "")

      // ── Duplicate guard ───────────────────────────────────────────
      const { data: dupMsg } = await supabaseAdmin
        .from("messages").select("id").eq("wa_message_id", messageId).maybeSingle()
      if (dupMsg) { console.log("⚠️ Duplicate:", messageId); continue }

      // ── Extract text ──────────────────────────────────────────────
      let messageText  = ""
      let mediaCaption = ""
      if      (messageType === "text")        messageText  = message.text?.body || ""
      else if (messageType === "button")      messageText  = message.button?.text || ""
      else if (messageType === "interactive") {
        messageText = message.interactive?.button_reply?.title
          || message.interactive?.list_reply?.title || ""
      }
      else if (messageType === "image")    mediaCaption = message.image?.caption    || ""
      else if (messageType === "video")    mediaCaption = message.video?.caption    || ""
      else if (messageType === "document") mediaCaption = message.document?.caption || ""

      const effectiveText = messageText || mediaCaption
      const isTextMessage = ["text","button","interactive"].includes(messageType) || !!mediaCaption
      const isMediaNoText = !isTextMessage && ["image","video","audio","document","sticker"].includes(messageType)

      console.log(`📩 From ${fromNumber} (${contactName}): "${effectiveText || "[" + messageType + "]"}"`)

      // ── Find WhatsApp connection → user ───────────────────────────
      const { data: connection } = await supabaseAdmin
        .from("whatsapp_connections")
        .select("user_id, access_token")
        .eq("phone_number_id", phoneNumberId)
        .single()
      if (!connection) { console.error("❌ No WA connection:", phoneNumberId); continue }
      const userId = connection.user_id

      // ══════════════════════════════════════════════════════════════
      // STEP 1: CRM — upsert customer
      // ══════════════════════════════════════════════════════════════
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
        const { data: nc } = await supabaseAdmin.from("customers").insert({
          user_id: userId, phone: formattedPhone, name: contactName,
          source: "whatsapp", tag: "new_lead", created_at: timestamp
        }).select().single()
        customer = nc
        console.log(`✅ New customer: ${contactName}`)
      }

      // ══════════════════════════════════════════════════════════════
      // STEP 2: CRM — upsert conversation
      // ══════════════════════════════════════════════════════════════
      let conversation = null
      const { data: existingConvo } = await supabaseAdmin
        .from("conversations").select("*")
        .eq("phone", formattedPhone).eq("user_id", userId).maybeSingle()

      if (existingConvo) {
        const { data: uc } = await supabaseAdmin.from("conversations")
          .update({
            last_message:    effectiveText || "[media]",
            last_message_at: timestamp,
            unread_count:    (existingConvo.unread_count || 0) + 1,
            customer_id:     customer?.id || existingConvo.customer_id,
            status:          "open"
          })
          .eq("id", existingConvo.id).select().single()
        conversation = uc
      } else {
        const { data: nc } = await supabaseAdmin.from("conversations").insert({
          user_id:         userId,
          customer_id:     customer?.id || null,
          phone:           formattedPhone,
          status:          "open",
          ai_enabled:      true,
          last_message:    effectiveText || "[media]",
          last_message_at: timestamp,
          unread_count:    1
        }).select().single()
        conversation = nc
      }

      // ══════════════════════════════════════════════════════════════
      // STEP 3: Save inbound message
      // ══════════════════════════════════════════════════════════════
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

      // ══════════════════════════════════════════════════════════════
      // STEP 4: Lead capture
      // ══════════════════════════════════════════════════════════════
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

      // ══════════════════════════════════════════════════════════════
      // STEP 5: STOP/START compliance
      // ══════════════════════════════════════════════════════════════
      const stopKw = ["stop","unsubscribe","opt out","optout","don't message","dont message","remove me","no more messages"]
      const isStop = isTextMessage && stopKw.some(kw =>
        (effectiveText||"").toLowerCase().trim() === kw ||
        (effectiveText||"").toLowerCase().includes(kw)
      )
      if (isStop) {
        try {
          await supabaseAdmin.from("campaign_optouts").upsert(
            { user_id: userId, phone: formattedPhone, created_at: new Date().toISOString() },
            { onConflict: "user_id,phone" }
          )
          await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: "You've been unsubscribed. Reply START to resubscribe anytime 🙏", userId, conversationId: conversation?.id, customerPhone: formattedPhone })
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

      // ── Skip AI if disabled ────────────────────────────────────────
      if (conversation?.ai_enabled === false) { console.log("⏸️ AI disabled"); continue }

      // ── Media with no caption ──────────────────────────────────────
      if (isMediaNoText) {
        await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: "Thanks for sharing! 😊 If you have any questions or want to book, just type here.", userId, conversationId: conversation?.id, customerPhone: formattedPhone })
        continue
      }

      // ══════════════════════════════════════════════════════════════
      // STEP 6: Load business data
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
          .order("created_at", { ascending: false }).limit(14),
        supabaseAdmin.from("services")
          .select("name, price, duration, capacity, category, description, service_type, is_active")
          .eq("user_id", userId),
        supabaseAdmin.from("business_knowledge").select("*").eq("user_id", userId).maybeSingle()
      ])

      // bizSettings always wins over bizKnowledge for identity fields
      const biz = {
        ...(bizKnowledge || {}),
        ...(bizSettings  || {}),
        ai_instructions: [
          bizSettings?.ai_instructions,
          bizKnowledge?.content,
          bizKnowledge?.instructions,
          bizKnowledge?.knowledge,
          bizKnowledge?.notes
        ].filter(Boolean).join("\n\n") || ""
      }

      const activeServices = (servicesList || []).filter(s => s.is_active !== false)
      console.log("🧠 Biz:", biz.business_name, "| Services:", activeServices.length)

      const historyRaw = (rawHistory || []).reverse().map(m => ({
        role:    m.direction === "inbound" ? "user" : "assistant",
        content: (m.message_text || "").trim()
      })).filter(m => m.content && m.content !== "[media message]")

      const conversationHistory = buildAlternatingHistory(historyRaw)

      // ── Load persisted booking state ──────────────────────────────
      let persistedState = null
      try {
        if (conversation?.booking_state) {
          persistedState = typeof conversation.booking_state === "string"
            ? JSON.parse(conversation.booking_state)
            : conversation.booking_state
        }
      } catch(e) { persistedState = null }

      // ══════════════════════════════════════════════════════════════
      // STEP 7: Detect intent + extract booking details
      // ══════════════════════════════════════════════════════════════
      const latestLower = (effectiveText || "").toLowerCase().trim()
      const allText     = [...conversationHistory.map(m => m.content), effectiveText].join(" ").toLowerCase()

      // ── Check if customer is REJECTING a confirmation ─────────────
      // This must be checked BEFORE anything else to clear bad state
      const rejectWords  = ["no","nope","nah","nahi","cancel","wrong","incorrect","change","different","not that","other","another"]
      const lastAiMsg    = [...conversationHistory].reverse().find(m => m.role === "assistant")
      const aiJustAskedConfirm = lastAiMsg && (
        lastAiMsg.content.toLowerCase().includes("shall i confirm") ||
        lastAiMsg.content.toLowerCase().includes("shall i book") ||
        lastAiMsg.content.toLowerCase().includes("confirm booking") ||
        lastAiMsg.content.toLowerCase().includes("book that") ||
        lastAiMsg.content.toLowerCase().includes("confirm that")
      )
      const isRejecting = aiJustAskedConfirm && rejectWords.some(w =>
        latestLower === w ||
        latestLower.startsWith(w + " ") ||
        latestLower.endsWith(" " + w)
      )

      if (isRejecting) {
        console.log("🚫 Customer rejected confirmation — clearing state")
        // Clear booking state in DB
        try { await supabaseAdmin.from("conversations").update({ booking_state: null }).eq("id", conversation.id) } catch(e) {}
        // Ask what they want to change
        const changeMsg = `No problem! 😊 What would you like to change?\n\n• *Service* — type a different service\n• *Date* — type a new date\n• *Time* — type a new time`
        await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: changeMsg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
        await supabaseAdmin.from("conversations").update({ last_message: changeMsg, last_message_at: new Date().toISOString() }).eq("id", conversation?.id)
        continue
      }

      // ── Detect intent ──────────────────────────────────────────────
      const intent = detectIntent(conversationHistory, effectiveText, latestLower, allText, activeServices, persistedState)
      console.log("🎯 Intent:", intent.type, "| State:", JSON.stringify(intent.bs))

      // Persist updated booking state (only if something was collected)
      const bs = intent.bs
      if (conversation?.id && (bs.service || bs.date || bs.time)) {
        try {
          await supabaseAdmin.from("conversations")
            .update({ booking_state: JSON.stringify({ service: bs.service, date: bs.date, time: bs.time }) })
            .eq("id", conversation.id)
        } catch(e) { console.warn("booking_state persist failed:", e.message) }
      }

      // ══════════════════════════════════════════════════════════════
      // STEP 8: External booking guard
      // ══════════════════════════════════════════════════════════════
      const isExternalVenue = /\b(restaurant|resto|hotel|cafe|diner|bar|dhaba|club|resort|lounge|movie|flight|train|bus)\b/i.test(effectiveText)
      const isExternalVerb  = /\b(book|reserve|table|seat|reservation|ticket)\b/i.test(effectiveText)
      if (isExternalVenue && isExternalVerb) {
        const sp  = activeServices.slice(0, 3).map(s => s.name).join(", ")
        const msg = `Hi! I can only help with bookings for *${biz.business_name || "us"}* 😊${sp ? `\n\nWe offer: ${sp}${activeServices.length > 3 ? " and more" : ""}.\n\nWould you like to book with us?` : ""}`
        await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: msg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
        continue
      }

      // ══════════════════════════════════════════════════════════════
      // STEP 9: INSTANT REPLIES — no AI, no Sarvam
      // ══════════════════════════════════════════════════════════════

      // Greeting
      if (intent.type === "greeting") {
        const firstName   = contactName.split(" ")[0] || "there"
        const sp          = activeServices.slice(0, 3).map(s => s.name).join(", ")
        const msg         = `Hi ${firstName}! 👋 Welcome to *${biz.business_name || "us"}*!${sp ? `\n\nWe offer: ${sp}${activeServices.length > 3 ? " and more" : ""}.` : ""}\n\nHow can I help you today? 😊`
        await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: msg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
        await supabaseAdmin.from("conversations").update({ last_message: msg, last_message_at: new Date().toISOString() }).eq("id", conversation?.id)
        continue
      }

      // Pricing
      if (intent.type === "pricing") {
        const msg = buildPricingReply(activeServices, biz)
        await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: msg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
        await supabaseAdmin.from("conversations").update({ last_message: msg, last_message_at: new Date().toISOString() }).eq("id", conversation?.id)
        continue
      }

      // Location
      if (intent.type === "location") {
        const msg = buildLocationReply(biz)
        await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: msg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
        await supabaseAdmin.from("conversations").update({ last_message: msg, last_message_at: new Date().toISOString() }).eq("id", conversation?.id)
        continue
      }

      // Hours
      if (intent.type === "hours") {
        const msg = buildHoursReply(biz)
        await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: msg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
        await supabaseAdmin.from("conversations").update({ last_message: msg, last_message_at: new Date().toISOString() }).eq("id", conversation?.id)
        continue
      }

      // Cancel
      if (intent.type === "cancel") {
        const msg = `I understand you want to cancel 😔\n\nWould you prefer to reschedule instead? Just let me know a new date and time that works for you 📅`
        await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: msg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
        await supabaseAdmin.from("conversations").update({ last_message: msg, last_message_at: new Date().toISOString() }).eq("id", conversation?.id)
        continue
      }

      // ══════════════════════════════════════════════════════════════
      // STEP 10: BOOKING FLOW — fully rule-based, zero AI
      // Every step is deterministic. AI never touches booking logic.
      // ══════════════════════════════════════════════════════════════
      if (intent.type === "booking" || intent.type === "reschedule") {

        // ── RESCHEDULE: use active service, NOT old DB booking ────────
        // THE HAIRCUT FIX: if customer was discussing "automation" and says
        // "reschedule", we reschedule "automation" — not their old haircut.
        if (intent.type === "reschedule") {
          // Determine which service to reschedule
          // Priority: 1) active booking_state.service, 2) DB lookup
          const rescheduleService = bs.service || null

          if (bs.date && bs.time) {
            // We have new date+time — find the booking to update
            let bookingToUpdate = null

            if (rescheduleService) {
              // Look for existing booking of THIS specific service
              const { data: svcBooking } = await supabaseAdmin
                .from("bookings").select("*")
                .eq("customer_phone", formattedPhone).eq("user_id", userId)
                .ilike("service", rescheduleService)
                .in("status", ["confirmed","pending"])
                .order("booking_date", { ascending: true }).limit(1).maybeSingle()
              bookingToUpdate = svcBooking
            }

            if (!bookingToUpdate) {
              // Fallback: most recent confirmed booking
              const { data: latestBooking } = await supabaseAdmin
                .from("bookings").select("*")
                .eq("customer_phone", formattedPhone).eq("user_id", userId)
                .in("status", ["confirmed","pending"])
                .order("booking_date", { ascending: true }).limit(1).maybeSingle()
              bookingToUpdate = latestBooking
            }

            if (bookingToUpdate) {
              const matchedSvc = matchService(bookingToUpdate.service, activeServices)
              if (isTimeBased(matchedSvc)) {
                const slotFree = await isSlotAvailable({ userId, date: bs.date, time: bs.time, service: bookingToUpdate.service, servicesList: activeServices, excludeBookingId: bookingToUpdate.id })
                if (!slotFree) {
                  const alt = await findNextAvailableSlot({ userId, date: bs.date, service: bookingToUpdate.service, servicesList: activeServices })
                  const msg = alt ? `That slot is full 😅 Next available: *${alt}*\n\nShall I book that instead? ✅` : `That slot is fully booked 😅 Please suggest another time?`
                  await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: msg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
                  continue
                }
              }
              await supabaseAdmin.from("bookings").update({ booking_date: bs.date, booking_time: bs.time, status: "confirmed" }).eq("id", bookingToUpdate.id)
              const msg = buildRescheduleConfirmation(bookingToUpdate.service, bs.date, bs.time, biz.business_name || "our business")
              await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: msg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
              try { await supabaseAdmin.from("conversations").update({ booking_state: null, last_message: msg, last_message_at: new Date().toISOString() }).eq("id", conversation.id) } catch(e) {}
              continue
            } else {
              // No booking found to reschedule — treat as new booking
              console.log("No existing booking to reschedule — treating as new booking")
            }
          } else {
            // Have reschedule intent but no date/time yet — ask for them
            const svcName = rescheduleService || "your appointment"
            const msg = `Sure! 📅 What new date works for *${svcName}*?`
            await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: msg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
            await supabaseAdmin.from("conversations").update({ last_message: msg, last_message_at: new Date().toISOString() }).eq("id", conversation?.id)
            continue
          }
        }

        // ── BOOKING: collect details one by one ───────────────────────
        const matchedSvc = bs.service ? matchService(bs.service, activeServices) : null
        const needsTime  = !bs.service || isTimeBased(matchedSvc)

        // No service yet — ask which one
        if (!bs.service) {
          const sp  = activeServices.slice(0, 4).map(s => s.name).join(", ")
          const msg = sp
            ? `I'd love to help! 😊\n\nWe offer: ${sp}${activeServices.length > 4 ? " and more" : ""}.\n\nWhich service would you like?`
            : `I'd love to help you book! 😊 Which service are you interested in?`
          await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: msg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
          await supabaseAdmin.from("conversations").update({ last_message: msg, last_message_at: new Date().toISOString() }).eq("id", conversation?.id)
          continue
        }

        // Has service, no date — ask for date
        if (bs.service && !bs.date) {
          const msg = `Great choice! 📅 What date works for your *${matchedSvc?.name || bs.service}*?`
          await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: msg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
          await supabaseAdmin.from("conversations").update({ last_message: msg, last_message_at: new Date().toISOString() }).eq("id", conversation?.id)
          continue
        }

        // Has service + date, no time (for time-based services) — ask for time
        if (bs.service && bs.date && !bs.time && needsTime) {
          const msg = `Almost there! ⏰ What time works for you?`
          await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: msg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
          await supabaseAdmin.from("conversations").update({ last_message: msg, last_message_at: new Date().toISOString() }).eq("id", conversation?.id)
          continue
        }

        // All details collected + customer confirmed — create booking
        if (bs.readyToBook) {
          const { date, time, service } = bs
          const svc = matchService(service, activeServices)

          // Slot check for time-based services
          if (isTimeBased(svc) && date && time) {
            const slotFree = await isSlotAvailable({ userId, date, time, service: svc?.name || service, servicesList: activeServices })
            if (!slotFree) {
              const alt = await findNextAvailableSlot({ userId, date, service: svc?.name || service, servicesList: activeServices })
              const msg = alt ? `That slot is taken 😅 How about *${alt}*? Shall I book that? ✅` : `That time slot is fully booked 😅 Could you suggest another time?`
              await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: msg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
              continue
            }
          }

          // Create the booking
          const { data: newBooking, error: bookErr } = await supabaseAdmin.from("bookings").insert({
            user_id:        userId,
            customer_name:  contactName,
            customer_phone: formattedPhone,
            customer_id:    customer?.id || null,
            service:        svc?.name || service || "Appointment",
            booking_date:   date || null,
            booking_time:   time || null,
            amount:         svc?.price || 0,
            status:         "confirmed",
            ai_booked:      true,
            created_at:     new Date().toISOString()
          }).select().single()

          if (!bookErr && newBooking) {
            console.log("✅ Booking created:", newBooking.id, service, date, time)
            // Update customer tag
            try {
              const { count: bc } = await supabaseAdmin.from("bookings").select("id", { count: "exact" })
                .eq("customer_phone", formattedPhone).eq("user_id", userId).in("status", ["confirmed","completed"])
              const tag = bc >= 5 ? "vip" : bc >= 2 ? "returning" : "new_lead"
              await supabaseAdmin.from("customers").update({ tag, last_visit_at: new Date().toISOString() }).eq("phone", formattedPhone).eq("user_id", userId)
              console.log("🏷️ Tag:", tag)
            } catch(e) {}
            // Convert lead
            try {
              await supabaseAdmin.from("leads").update({ status: "converted", last_message_at: new Date().toISOString() })
                .eq("customer_id", customer?.id).eq("user_id", userId).eq("status", "open")
              console.log("✅ Lead converted")
            } catch(e) {}
            // Clear booking state
            try { await supabaseAdmin.from("conversations").update({ booking_state: null }).eq("id", conversation.id) } catch(e) {}
          }

          const confirmMsg = buildConfirmationMessage(svc?.name || service, date, time, biz.business_name || "our business", isTimeBased(svc))
          await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: confirmMsg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
          await supabaseAdmin.from("conversations").update({ last_message: "✅ Booking Confirmed — " + (svc?.name || service), last_message_at: new Date().toISOString() }).eq("id", conversation?.id)
          continue
        }

        // All collected but not yet confirmed — ask to confirm (NO AI)
        if (bs.service && bs.date && (bs.time || !needsTime)) {
          const svc         = matchService(bs.service, activeServices)
          const dateFormatted = new Date(bs.date + "T12:00:00").toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short" })
          const timePart    = bs.time ? ` at *${bs.time}*` : ""
          const msg         = `Shall I confirm booking for *${svc?.name || bs.service}* on *${dateFormatted}*${timePart}? ✅`
          await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: msg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
          await supabaseAdmin.from("conversations").update({ last_message: msg, last_message_at: new Date().toISOString() }).eq("id", conversation?.id)
          continue
        }
      }

      // ══════════════════════════════════════════════════════════════
      // STEP 11: AI REPLY — only for general conversation
      // At this point all booking/instant paths are handled above.
      // Sarvam handles: general questions, FAQs, edge cases.
      // ══════════════════════════════════════════════════════════════
      const aiReply = await generateAIReply({
        customerMessage: effectiveText,
        biz,
        history:         conversationHistory,
        customerName:    contactName,
        intent,
        activeServices
      })

      console.log("📤 AI reply:", aiReply.substring(0, 100))
      await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: aiReply, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
      await supabaseAdmin.from("conversations").update({ last_message: aiReply, last_message_at: new Date().toISOString() }).eq("id", conversation?.id)
    }

    return NextResponse.json({ status: "ok" }, { status: 200 })
  } catch (err) {
    console.error("❌ Webhook fatal:", err)
    return NextResponse.json({ status: "error", message: err.message }, { status: 200 })
  }
}

// ════════════════════════════════════════════════════════════════════
// INTENT DETECTOR
// Returns intent type + booking state (bs)
// ════════════════════════════════════════════════════════════════════

function detectIntent(history, latestMessage, latestLower, allText, servicesList, persistedState) {
  const rescheduleKw = ["reschedule","change booking","change appointment","change timing","postpone","shift booking","move booking","different time","different date","another time","another day","change slot","rebook"]
  const cancelKw     = ["cancel","cancellation","don't want","not coming","cant come","cannot come","won't come","nahi aana","cancel karo"]
  const bookingKw    = ["book","appointment","slot","schedule","availab","fix appointment","want to come","coming in","visit","book karo","booking","reserve","set up","call","demo","meeting"]
  const pricingKw    = ["price","cost","rate","how much","charges","kitna","ekkuva","entha","fees","charge","amount","pricing","plans","packages","offer","services","what do you","what you offer","what you provide","tell me about","what are your","list","menu"]
  const locationKw   = ["location","address","where are you","where is","directions","maps","navigate","how to reach","how to come","landmark","find you"]
  const hoursKw      = ["timing","timings","hours","open","close","when","working hours","available when","what time","office hours","business hours"]
  const greetingRx   = /^(hi|hello|hey|hii|helo|hai|hiya|gm|heyyy|sup|whats\s*up|good\s*(morning|afternoon|evening|night)|namaste|namaskar|vanakkam|nomoskar|namaskaara|pranam|kem\s*cho|kasa\s*kay|sat\s*sri\s*akal|haan|bolo|bol|yo|wassup|ayyo|ayo|howdy|greetings|welcome)[!\s.]*$/i

  const isReschedule = rescheduleKw.some(kw => latestLower.includes(kw))
  const isCancel     = cancelKw.some(kw => latestLower.includes(kw))
  const isBooking    = bookingKw.some(kw => latestLower.includes(kw))
  const isPricing    = pricingKw.some(kw => latestLower.includes(kw))
  const isLocation   = locationKw.some(kw => latestLower.includes(kw))
  const isHours      = hoursKw.some(kw => latestLower.includes(kw))
  const isGreeting   = greetingRx.test(latestLower)

  const bs = extractBookingDetails(history, latestMessage, allText, latestLower, servicesList, persistedState)

  // Priority order: cancel > reschedule > pricing > booking > greeting > hours > location > general
  let type = "general"
  if      (isCancel)                                                              type = "cancel"
  else if (isReschedule)                                                          type = "reschedule"
  else if (isPricing && !bs.service && !bs.date && !bs.time && !bs.readyToBook)  type = "pricing"
  else if (isBooking || bs.service || bs.date || bs.time || bs.readyToBook)      type = "booking"
  else if (isGreeting)                                                            type = "greeting"
  else if (isHours)                                                               type = "hours"
  else if (isLocation)                                                            type = "location"

  return { type, bs }
}

// ════════════════════════════════════════════════════════════════════
// BOOKING DETAILS EXTRACTOR
// Carries state across messages via persistedState (from DB)
// ════════════════════════════════════════════════════════════════════

function extractBookingDetails(history, latestMessage, allText, latestLower, servicesList, persistedState) {
  const now = new Date()
  const state = {
    service:     persistedState?.service || null,
    date:        persistedState?.date    || null,
    time:        persistedState?.time    || null,
    readyToBook: false
  }

  // ── Service: DB-driven, no hardcoded keywords ────────────────────
  if (!state.service && servicesList?.length) {
    const text = allText.toLowerCase()
    // Pass 1: exact name match
    for (const svc of servicesList) {
      if (text.includes(svc.name.toLowerCase())) { state.service = svc.name; break }
    }
    // Pass 2: partial word match (words > 3 chars)
    if (!state.service) {
      for (const svc of servicesList) {
        const words = svc.name.toLowerCase().split(/\s+/).filter(w => w.length > 3)
        if (words.length && words.some(w => text.includes(w))) { state.service = svc.name; break }
      }
    }
  }

  // ── Date extraction ───────────────────────────────────────────────
  if (!state.date) {
    const hasDateInLatest =
      /\b(today|tomorrow|kal|parso|aaj|sun|mon|tue|wed|thu|fri|sat|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i.test(latestMessage) ||
      /\d{1,2}[\/\-]\d{1,2}/.test(latestMessage) ||
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(latestMessage) ||
      /\d{1,2}(st|nd|rd|th)/i.test(latestMessage)

    const src  = hasDateInLatest ? latestLower : allText
    const pad  = n => String(n).padStart(2, "0")
    const fmt  = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`

    if      (src.includes("today")     || src.includes("aaj"))           { state.date = fmt(now) }
    else if (src.includes("tomorrow")  || /\bkal\b/.test(src))           { const t=new Date(now); t.setDate(now.getDate()+1); state.date=fmt(t) }
    else if (src.includes("parso")     || src.includes("day after"))     { const t=new Date(now); t.setDate(now.getDate()+2); state.date=fmt(t) }
    else {
      // Day names
      const days = [{i:0,n:["sunday","sun"]},{i:1,n:["monday","mon"]},{i:2,n:["tuesday","tue"]},{i:3,n:["wednesday","wed"]},{i:4,n:["thursday","thu"]},{i:5,n:["friday","fri"]},{i:6,n:["saturday","sat"]}]
      for (const day of days) {
        if (day.n.some(n => new RegExp("\\b"+n+"\\b","i").test(src))) {
          let diff = (day.i - now.getDay() + 7) % 7
          if (diff === 0) diff = 7
          const d = new Date(now); d.setDate(now.getDate()+diff); state.date = fmt(d); break
        }
      }
      // Month+day e.g. "22nd march", "march 22"
      if (!state.date) {
        const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"]
        const rawSrc = hasDateInLatest ? latestMessage : allText
        for (let i=0; i<months.length; i++) {
          const re = new RegExp("(\\d{1,2})(?:st|nd|rd|th)?\\s*"+months[i]+"|"+months[i]+"\\s*(\\d{1,2})(?:st|nd|rd|th)?","i")
          const m  = rawSrc.match(re)
          if (m) { const d=parseInt(m[1]||m[2]); if(d>=1&&d<=31){ state.date=`${now.getFullYear()}-${String(i+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; break } }
        }
      }
      // DD/MM or DD-MM
      if (!state.date) {
        const m = (hasDateInLatest ? latestMessage : allText).match(/(\d{1,2})[\/\-](\d{1,2})/)
        if (m) state.date = `${now.getFullYear()}-${String(m[2]).padStart(2,"0")}-${String(m[1]).padStart(2,"0")}`
      }
    }
  }

  // ── Time extraction ───────────────────────────────────────────────
  if (!state.time) {
    const hasTimeInLatest =
      /\d{1,2}(:\d{2})?\s*(am|pm)/i.test(latestMessage) ||
      /\d{2}:\d{2}/.test(latestMessage) ||
      /\b\d{1,2}(pm|am)\b/i.test(latestMessage) ||
      /\b(morning|afternoon|evening|night|subah|dopahar|shaam|raat)\b/i.test(latestMessage)

    const src = hasTimeInLatest ? latestMessage : allText

    if      (/\b(morning|subah)\b/i.test(src)    && !hasTimeInLatest) state.time = "10:00"
    else if (/\b(afternoon|dopahar)\b/i.test(src) && !hasTimeInLatest) state.time = "14:00"
    else if (/\b(evening|shaam)\b/i.test(src)    && !hasTimeInLatest) state.time = "17:00"
    else if (/\b(night|raat)\b/i.test(src)        && !hasTimeInLatest) state.time = "19:00"
    else {
      const tm = src.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i) || src.match(/(\d{2}):(\d{2})/)
      if (tm) {
        let h = parseInt(tm[1])
        const min = tm[2] || "00"
        const ap  = tm[3]?.toLowerCase()
        if (ap === "pm" && h < 12) h += 12
        if (ap === "am" && h === 12) h = 0
        if (h >= 7 && h <= 22) state.time = `${String(h).padStart(2,"0")}:${min.padStart(2,"0")}`
      }
    }
  }

  // ── Confirm detection ─────────────────────────────────────────────
  const confirmWords = ["yes","yeah","yep","yup","ok","okay","sure","confirm","correct","right","haan","ha","ji","theek","done","book it","go ahead","please book","book karo","sounds good","perfect","great","yeahh","yess","k","👍","✅","proceed","do it","bilkul","zaroor","yea","yah"]
  const isConfirming = confirmWords.some(w =>
    latestLower.trim() === w ||
    latestLower.trim().startsWith(w + " ") ||
    latestLower.trim().endsWith(" " + w)
  )
  const lastAiMsg    = [...history].reverse().find(m => m.role === "assistant")
  const aiAskedConfirm = lastAiMsg && (
    lastAiMsg.content.toLowerCase().includes("shall i confirm") ||
    lastAiMsg.content.toLowerCase().includes("shall i book") ||
    lastAiMsg.content.toLowerCase().includes("confirm booking") ||
    lastAiMsg.content.toLowerCase().includes("book that") ||
    lastAiMsg.content.toLowerCase().includes("confirm that")
  )
  if (state.service && isConfirming && aiAskedConfirm) {
    state.readyToBook = true
  }

  return state
}

// ════════════════════════════════════════════════════════════════════
// AI REPLY — only for general conversation
// Sarvam is NOT used for any booking step
// ════════════════════════════════════════════════════════════════════

async function generateAIReply({ customerMessage, biz, history, customerName, intent, activeServices }) {
  const firstName    = (customerName || "").split(" ")[0] || "there"
  const businessName = biz?.business_name   || "our business"
  const location     = biz?.location        || ""
  const mapsLink     = biz?.maps_link       || ""
  const workingHours = biz?.working_hours   || ""
  const aiInstr      = biz?.ai_instructions || ""
  const aiLanguage   = biz?.ai_language     || "English"
  const description  = biz?.description     || ""
  const businessType = biz?.business_type   || ""

  const servicesText = activeServices.length > 0
    ? activeServices.map(s => {
        let l = `• ${s.name}: ₹${s.price}`
        if (isTimeBased(s) && s.duration) l += ` (${s.duration} min)`
        if (!isTimeBased(s) && s.description) l += ` — ${s.description}`
        return l
      }).join("\n")
    : ""

  const systemPrompt = `You are the WhatsApp assistant for *${businessName}*${businessType ? ` (${businessType})` : ""}${location ? `, ${location}` : ""}.

RULES:
1. Only represent *${businessName}*. Never help book anything elsewhere.
2. Replies must be SHORT — 2 to 3 lines max. This is WhatsApp.
3. Be warm, friendly, natural. Sound human not robotic.
4. Never output internal notes, system text, or debug information.
5. Never repeat info the customer already gave you.
6. Address customer as "${firstName}".
${description    ? `\nABOUT: ${description}`            : ""}
${servicesText   ? `\nSERVICES:\n${servicesText}`        : ""}
${workingHours   ? `\nHOURS: ${workingHours}`            : ""}
${location       ? `\nADDRESS: ${location}`              : ""}
${mapsLink       ? `\nMAPS: ${mapsLink}`                  : ""}
${aiInstr        ? `\nOWNER INSTRUCTIONS:\n${aiInstr}`   : ""}

LANGUAGE: ${aiLanguage}. Match customer's language naturally.`

  if (process.env.SARVAM_API_KEY) {
    try {
      const msgs = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: customerMessage }
      ]
      console.log("🔄 Sarvam | history:", history.length)
      const res  = await fetch("https://api.sarvam.ai/v1/chat/completions", {
        method:  "POST",
        headers: { "Content-Type": "application/json", "api-subscription-key": process.env.SARVAM_API_KEY },
        body:    JSON.stringify({ model: "sarvam-m", messages: msgs, max_tokens: 300, temperature: 0.6 })
      })
      const raw  = await res.text()
      console.log("📨 Sarvam HTTP:", res.status)
      const data = JSON.parse(raw)
      if (data?.error) {
        console.error("❌ Sarvam:", JSON.stringify(data.error))
      } else {
        const reply = extractSarvamReply(data?.choices?.[0]?.message?.content || "")
        if (reply) return reply
      }
    } catch(err) { console.error("Sarvam exception:", err.message) }
  }

  console.warn("⚠️ Sarvam unavailable — fallback")
  return smartFallback({ msg: customerMessage, intent, biz, firstName, activeServices })
}

// ════════════════════════════════════════════════════════════════════
// SARVAM REPLY EXTRACTOR
// Strips internal/debug text before returning
// ════════════════════════════════════════════════════════════════════

function extractSarvamReply(raw) {
  if (!raw?.trim()) return null

  // Strip any internal/debug text that might leak
  const cleaned = raw
    .replace(/\[INTERNAL[^\]]*\][^\n]*/gi, "")
    .replace(/BOOKING IN PROGRESS:[^\n]*/gi, "")
    .replace(/Already have:[^\n]*/gi, "")
    .replace(/Ask next:[^\n]*/gi, "")
    .replace(/Still need:[^\n]*/gi, "")
    .trim()

  if (!cleaned) return null

  // Pattern A: after </think> tag
  if (cleaned.includes("</think>")) {
    const after = cleaned.split("</think>").pop().trim()
    if (after?.length > 3) return after
  }

  // Pattern D: no think tags at all — pure reply
  if (!cleaned.includes("<think>") && !cleaned.includes("</think>")) {
    if (cleaned.length > 3) return cleaned
  }

  const stripped = cleaned.replace(/<\/think>/g,"").replace(/<think>/g,"").trim()
  const lines    = stripped.split("\n").map(l=>l.trim()).filter(l=>l.length>2)

  const reasoningPrefixes = ["so ","the ","wait","let me","first","i need","i should","okay,","okay.","but ","now,","now.","since ","the user","looking at","according","maybe ","perhaps ","however","alternatively","to summarize","in summary","so the","so i","i'll","i will","that means","this means","the customer","based on"]
  const internalPrefixes  = ["[internal","booking in progress","already have:","ask next:","still need:","collected:","missing:"]

  const isBad   = l => l.length > 200 || reasoningPrefixes.some(p => l.toLowerCase().startsWith(p)) || internalPrefixes.some(p => l.toLowerCase().startsWith(p))
  const isReply = l => /^(hi|hello|hey|sure|great|got it|perfect|of course|absolutely|no problem|ok|okay|yes|thanks)/i.test(l) || /^[\u{1F300}-\u{1F9FF}]/u.test(l) || l.endsWith("?") || l.endsWith("😊") || l.endsWith("✅") || /^\*/.test(l)

  // Find last good reply line
  for (let i = lines.length-1; i >= 0; i--) {
    const l = lines[i]
    if (l.length < 200 && !isBad(l) && isReply(l)) return l
  }

  // Last short non-bad paragraph
  const paras = stripped.split("\n\n").map(p=>p.trim()).filter(p=>p.length>3&&!internalPrefixes.some(x=>p.toLowerCase().startsWith(x)))
  for (let i = paras.length-1; i >= 0; i--) {
    if (paras[i].length < 200) return paras[i]
  }

  // Safe last line
  const safe = [...lines].reverse().find(l => l.length < 300 && !isBad(l))
  return safe || null
}

// ════════════════════════════════════════════════════════════════════
// SMART FALLBACK — when Sarvam unavailable
// ════════════════════════════════════════════════════════════════════

function smartFallback({ msg, intent, biz, firstName, activeServices }) {
  const m            = (msg || "").toLowerCase().trim()
  const businessName = biz?.business_name || "our business"
  const location     = biz?.location      || ""
  const mapsLink     = biz?.maps_link     || ""
  const sp           = activeServices?.length
    ? activeServices.slice(0,3).map(s=>s.name).join(", ") + (activeServices.length>3?" and more":"")
    : ""

  if (/thank|thanks|ok|okay|great|perfect|good|noted|done|alright/.test(m))
    return `You're welcome! 😊 Looking forward to seeing you at *${businessName}*!`
  if (/speak|human|owner|manager|staff|agent/.test(m))
    return `Of course! 🙌 I'll let our team know and someone will reach out shortly.`
  if (sp)
    return `Thanks for reaching out to *${businessName}*! 😊\n\nWe offer: ${sp}.\n\nHow can I help?\n📅 Book an appointment\n💰 Services & pricing\n📍 Our location`
  return `Thanks for reaching out to *${businessName}*! 😊 How can I help you today?`
}

// ════════════════════════════════════════════════════════════════════
// INSTANT REPLY BUILDERS
// ════════════════════════════════════════════════════════════════════

function buildPricingReply(servicesList, biz) {
  if (!servicesList?.length) return `Please reach us directly for our latest pricing 🙏`
  const list = servicesList.map(s => {
    let l = `• *${s.name}* — ₹${s.price}`
    if (isTimeBased(s) && s.duration) l += ` (${s.duration} min)`
    if (!isTimeBased(s) && s.description) l += `\n  ${s.description}`
    return l
  }).join("\n")
  return `*${biz.business_name || "Our"} Services*\n\n${list}\n\nWant to book? Just ask! 😊`
}

function buildLocationReply(biz) {
  const loc  = biz?.location  || ""
  const maps = biz?.maps_link || ""
  if (loc && maps) return `📍 *${biz.business_name || "We're"}* at:\n${loc}\n\n🗺️ ${maps}\n\nSee you soon! 😊`
  if (loc)         return `📍 We're at: *${loc}*\n\nAnything else? 😊`
  return `I'll get our address for you shortly! 📍`
}

function buildHoursReply(biz) {
  const h = biz?.working_hours || ""
  if (h) return `⏰ *${biz.business_name || "We"}* is open:\n\n${h}\n\nAnything else? 😊`
  return `I'll check our working hours and get back to you! ⏰`
}

function buildConfirmationMessage(service, date, time, businessName, timeBased) {
  const formatted = date ? new Date(date+"T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"}) : null
  let msg = `✅ *Booking Confirmed!*\n\n📋 Service: ${service}`
  if (formatted || date) msg += `\n📅 Date: ${formatted || date}`
  if (time && timeBased)  msg += `\n⏰ Time: ${time}`
  msg += `\n\nSee you soon at *${businessName}*! 😊`
  return msg
}

function buildRescheduleConfirmation(service, date, time, businessName) {
  const formatted = date ? new Date(date+"T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"}) : null
  return `✅ *Rescheduled!*\n\n📋 Service: ${service}\n📅 New Date: ${formatted||date}${time?`\n⏰ New Time: ${time}`:""}\n\nAll updated! See you at *${businessName}* 😊`
}

// ════════════════════════════════════════════════════════════════════
// SLOT AVAILABILITY
// ════════════════════════════════════════════════════════════════════

function isTimeBased(service) {
  if (!service) return false
  if (service.service_type === "time")    return true
  if (service.service_type === "package") return false
  return !!(service.duration && service.duration > 0)
}

async function isSlotAvailable({ userId, date, time, service, servicesList, excludeBookingId }) {
  if (!date || !time) return true
  const svc      = matchService(service, servicesList)
  const capacity = svc?.capacity || 1
  const query    = supabaseAdmin.from("bookings").select("id")
    .eq("user_id", userId).eq("booking_date", date).eq("booking_time", time)
    .in("status", ["confirmed","pending"])
  if (excludeBookingId) query.neq("id", excludeBookingId)
  const { data: ex } = await query
  return (ex?.length || 0) < capacity
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
      const dt = new Date(date+"T"+time+":00")
      return dt.toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"}) + " at " + time
    }
  }
  return null
}

function matchService(name, list) {
  if (!name || !list?.length) return null
  const s = name.toLowerCase().trim()
  return list.find(svc => svc.name.toLowerCase() === s)
    || list.find(svc => svc.name.toLowerCase().includes(s) || s.includes(svc.name.toLowerCase()))
    || null
}

// ════════════════════════════════════════════════════════════════════
// CONVERSATION HISTORY — strictly alternating user/assistant
// ════════════════════════════════════════════════════════════════════

function buildAlternatingHistory(rawHistory) {
  if (!rawHistory?.length) return []
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
// WHATSAPP SENDER + MESSAGE SAVER
// ════════════════════════════════════════════════════════════════════

async function sendAndSave({ phoneNumberId, accessToken, toNumber, message, userId, conversationId, customerPhone }) {
  const result = await sendWhatsAppMessage({ phoneNumberId, accessToken, toNumber, message })
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
    wa_message_id:   result?.messages?.[0]?.id || null,
    created_at:      new Date().toISOString()
  })
  return result
}

async function sendWhatsAppMessage({ phoneNumberId, accessToken, toNumber, message }) {
  try {
    const res  = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method:  "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body:    JSON.stringify({ messaging_product: "whatsapp", to: toNumber, type: "text", text: { body: message, preview_url: false } })
    })
    const data = await res.json()
    if (data.error) console.error("❌ WA send error:", JSON.stringify(data.error))
    return data
  } catch(err) {
    console.error("❌ WA send exception:", err.message)
    return {}
  }
}

// SQL: ALTER TABLE conversations ADD COLUMN IF NOT EXISTS booking_state JSONB;
