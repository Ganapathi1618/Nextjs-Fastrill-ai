import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import "@/lib/env"

// ════════════════════════════════════════════════════════════════════
// FASTRILL WEBHOOK — VERSION 10.0
// ════════════════════════════════════════════════════════════════════
//
// ARCHITECTURE: Sarvam is the brain. Code is the executor.
//
// OLD WAY (broken): Code tries to parse human language with if/else.
//   → breaks on every edge case, feels like a bot
//
// NEW WAY (smart): Sarvam reads the full conversation and returns
//   structured JSON telling the code exactly what to do.
//   → handles any language, any phrasing, any edge case naturally
//
// FLOW:
//   1. Save inbound message to DB
//   2. Load business context (services, settings, history, state)
//   3. Call Sarvam with full context → get JSON response
//   4. Send Sarvam's reply to customer
//   5. Execute Sarvam's action (create booking, reschedule, etc.)
//
// SARVAM ACTIONS:
//   none             → just reply, no DB action
//   collect_service  → ask which service (reply handled by Sarvam)
//   collect_date     → ask for date (reply handled by Sarvam)
//   collect_time     → ask for time (reply handled by Sarvam)
//   confirm_booking  → ask customer to confirm (reply handled by Sarvam)
//   create_booking   → create booking in DB
//   reschedule       → update existing booking in DB
//   cancel           → cancel existing booking in DB
//   clear_state      → customer rejected, clear booking state
//
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
    console.log("🚀 FASTRILL WEBHOOK v10.0")
    const body = await req.json()

    // Handle delivery status updates
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

      // Duplicate guard
      const { data: dupMsg } = await supabaseAdmin
        .from("messages").select("id").eq("wa_message_id", messageId).maybeSingle()
      if (dupMsg) { console.log("⚠️ Duplicate:", messageId); continue }

      // Extract text from any message type
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

      // Find WhatsApp connection → user
      const { data: connection } = await supabaseAdmin
        .from("whatsapp_connections")
        .select("user_id, access_token")
        .eq("phone_number_id", phoneNumberId)
        .single()
      if (!connection) { console.error("❌ No WA connection:", phoneNumberId); continue }
      const userId = connection.user_id

      // ══════════════════════════════════════════════════════════════
      // CRM: Upsert customer
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
      // CRM: Upsert conversation
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

      // Save inbound message
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

      // Lead capture
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

      // STOP/START compliance
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

      // Skip if AI disabled
      if (conversation?.ai_enabled === false) { console.log("⏸️ AI disabled"); continue }

      // Handle media with no caption
      if (isMediaNoText) {
        await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: "Thanks for sharing! 😊 If you have any questions or want to book, just type here.", userId, conversationId: conversation?.id, customerPhone: formattedPhone })
        continue
      }

      // ══════════════════════════════════════════════════════════════
      // LOAD BUSINESS CONTEXT
      // Everything Sarvam needs to understand and respond intelligently
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

      // bizSettings always wins over bizKnowledge for identity
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

      // Build conversation history for Sarvam
      const historyRaw = (rawHistory || []).reverse().map(m => ({
        role:    m.direction === "inbound" ? "user" : "assistant",
        content: (m.message_text || "").trim()
      })).filter(m => m.content && m.content !== "[media message]")
      const conversationHistory = buildAlternatingHistory(historyRaw)

      // Load persisted booking state
      let bookingState = null
      try {
        if (conversation?.booking_state) {
          bookingState = typeof conversation.booking_state === "string"
            ? JSON.parse(conversation.booking_state)
            : conversation.booking_state
        }
      } catch(e) { bookingState = null }

      console.log("🧠 Context loaded:", {
        biz: biz.business_name,
        services: activeServices.length,
        history: conversationHistory.length,
        state: bookingState
      })

      // ══════════════════════════════════════════════════════════════
      // SARVAM: THE BRAIN
      // Give Sarvam everything it needs. It returns:
      // { reply: string, action: string, booking: object }
      // ══════════════════════════════════════════════════════════════
      const sarvamResult = await callSarvamBrain({
        customerMessage: effectiveText,
        customerName:    contactName,
        biz,
        activeServices,
        conversationHistory,
        bookingState
      })

      console.log("🤖 Sarvam result:", JSON.stringify(sarvamResult))

      const { reply, action, booking: newBookingData } = sarvamResult

      // Send reply to customer first (fast response)
      await sendAndSave({
        phoneNumberId,
        accessToken:    connection.access_token,
        toNumber:       fromNumber,
        message:        reply,
        userId,
        conversationId: conversation?.id,
        customerPhone:  formattedPhone
      })

      // Update conversation last message
      await supabaseAdmin.from("conversations")
        .update({ last_message: reply, last_message_at: new Date().toISOString() })
        .eq("id", conversation?.id)

      // ══════════════════════════════════════════════════════════════
      // EXECUTE ACTION — Sarvam told us what to do, we do it
      // ══════════════════════════════════════════════════════════════
      console.log("⚡ Executing action:", action)

      if (action === "update_state" && newBookingData) {
        // Save partial booking progress to DB
        const mergedState = { ...(bookingState || {}), ...newBookingData }
        try {
          await supabaseAdmin.from("conversations")
            .update({ booking_state: JSON.stringify(mergedState) })
            .eq("id", conversation.id)
        } catch(e) { console.warn("State update failed:", e.message) }
      }

      else if (action === "create_booking" && newBookingData?.service) {
        // Slot availability check for time-based services
        const matchedSvc = matchService(newBookingData.service, activeServices)
        if (isTimeBased(matchedSvc) && newBookingData.date && newBookingData.time) {
          const slotFree = await isSlotAvailable({
            userId,
            date:         newBookingData.date,
            time:         newBookingData.time,
            service:      newBookingData.service,
            servicesList: activeServices
          })
          if (!slotFree) {
            const alt = await findNextAvailableSlot({ userId, date: newBookingData.date, service: newBookingData.service, servicesList: activeServices })
            const slotMsg = alt
              ? `That slot just got taken 😅 Next available: *${alt}*\n\nShall I book that instead? ✅`
              : `That slot is fully booked 😅 Please suggest another time and I'll check for you!`
            await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: slotMsg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
            continue
          }
        }

        // Create the booking
        const { data: newBooking, error: bookErr } = await supabaseAdmin.from("bookings").insert({
          user_id:        userId,
          customer_name:  contactName,
          customer_phone: formattedPhone,
          customer_id:    customer?.id || null,
          service:        matchedSvc?.name || newBookingData.service,
          booking_date:   newBookingData.date   || null,
          booking_time:   newBookingData.time   || null,
          amount:         matchedSvc?.price     || 0,
          status:         "confirmed",
          ai_booked:      true,
          created_at:     new Date().toISOString()
        }).select().single()

        if (!bookErr && newBooking) {
          console.log("✅ Booking created:", newBooking.id)
          // Update customer tag
          try {
            const { count: bc } = await supabaseAdmin.from("bookings")
              .select("id", { count: "exact" })
              .eq("customer_phone", formattedPhone).eq("user_id", userId)
              .in("status", ["confirmed","completed"])
            const tag = bc >= 5 ? "vip" : bc >= 2 ? "returning" : "new_lead"
            await supabaseAdmin.from("customers")
              .update({ tag, last_visit_at: new Date().toISOString() })
              .eq("phone", formattedPhone).eq("user_id", userId)
          } catch(e) {}
          // Convert lead
          try {
            await supabaseAdmin.from("leads")
              .update({ status: "converted", last_message_at: new Date().toISOString() })
              .eq("customer_id", customer?.id).eq("user_id", userId).eq("status", "open")
          } catch(e) {}
          // Clear booking state
          try {
            await supabaseAdmin.from("conversations")
              .update({ booking_state: null, last_message: "✅ Booking Confirmed — " + (matchedSvc?.name || newBookingData.service) })
              .eq("id", conversation.id)
          } catch(e) {}
        }
      }

      else if (action === "reschedule" && newBookingData) {
        // Find the booking to reschedule
        // Priority: match by service name if known, else most recent
        let bookingToUpdate = null
        if (newBookingData.service) {
          const { data: sb } = await supabaseAdmin.from("bookings").select("*")
            .eq("customer_phone", formattedPhone).eq("user_id", userId)
            .ilike("service", "%" + newBookingData.service + "%")
            .in("status", ["confirmed","pending"])
            .order("booking_date", { ascending: true }).limit(1).maybeSingle()
          bookingToUpdate = sb
        }
        if (!bookingToUpdate) {
          const { data: lb } = await supabaseAdmin.from("bookings").select("*")
            .eq("customer_phone", formattedPhone).eq("user_id", userId)
            .in("status", ["confirmed","pending"])
            .order("booking_date", { ascending: true }).limit(1).maybeSingle()
          bookingToUpdate = lb
        }
        if (bookingToUpdate && (newBookingData.date || newBookingData.time)) {
          await supabaseAdmin.from("bookings").update({
            booking_date: newBookingData.date || bookingToUpdate.booking_date,
            booking_time: newBookingData.time || bookingToUpdate.booking_time,
            status:       "confirmed"
          }).eq("id", bookingToUpdate.id)
          console.log("✅ Booking rescheduled:", bookingToUpdate.id)
          try { await supabaseAdmin.from("conversations").update({ booking_state: null }).eq("id", conversation.id) } catch(e) {}
        }
      }

      else if (action === "cancel") {
        try {
          await supabaseAdmin.from("bookings")
            .update({ status: "cancelled" })
            .eq("customer_phone", formattedPhone).eq("user_id", userId)
            .in("status", ["confirmed","pending"])
          await supabaseAdmin.from("conversations").update({ booking_state: null }).eq("id", conversation.id)
          console.log("✅ Booking cancelled")
        } catch(e) { console.warn("Cancel failed:", e.message) }
      }

      else if (action === "clear_state") {
        try {
          await supabaseAdmin.from("conversations").update({ booking_state: null }).eq("id", conversation.id)
          console.log("🗑️ Booking state cleared")
        } catch(e) {}
      }

      // For all other actions (none, collect_service, collect_date,
      // collect_time, confirm_booking) — Sarvam's reply already sent,
      // update state if booking data provided
      else if (newBookingData && Object.keys(newBookingData).length > 0) {
        const mergedState = { ...(bookingState || {}), ...newBookingData }
        try {
          await supabaseAdmin.from("conversations")
            .update({ booking_state: JSON.stringify(mergedState) })
            .eq("id", conversation.id)
        } catch(e) {}
      }
    }

    return NextResponse.json({ status: "ok" }, { status: 200 })
  } catch (err) {
    console.error("❌ Webhook fatal:", err)
    return NextResponse.json({ status: "error", message: err.message }, { status: 200 })
  }
}

// ════════════════════════════════════════════════════════════════════
// SARVAM BRAIN
// This is the core of the new architecture.
// Sarvam reads everything and returns structured JSON.
// ════════════════════════════════════════════════════════════════════

async function callSarvamBrain({ customerMessage, customerName, biz, activeServices, conversationHistory, bookingState }) {
  const firstName    = (customerName || "").split(" ")[0] || "there"
  const businessName = biz?.business_name   || "our business"
  const businessType = biz?.business_type   || ""
  const location     = biz?.location        || ""
  const mapsLink     = biz?.maps_link       || ""
  const workingHours = biz?.working_hours   || ""
  const aiInstr      = biz?.ai_instructions || ""
  const aiLanguage   = biz?.ai_language     || "English"
  const description  = biz?.description     || ""

  // Build services list for Sarvam
  const servicesText = activeServices.length > 0
    ? activeServices.map(s => {
        let line = `- ${s.name}: ₹${s.price}`
        if (s.duration) line += ` (${s.duration} min)`
        if (s.description) line += ` — ${s.description}`
        return line
      }).join("\n")
    : "No services configured yet."

  // Build current booking state description
  const stateDesc = bookingState
    ? `Currently collecting: service=${bookingState.service||"?"}, date=${bookingState.date||"?"}, time=${bookingState.time||"?"}`
    : "No booking in progress."

  // The system prompt — tells Sarvam exactly what JSON to return
  const systemPrompt = `You are the WhatsApp AI assistant for *${businessName}*${businessType ? ` (${businessType})` : ""}${location ? `, located at ${location}` : ""}.

ABOUT THE BUSINESS:
${description || "A business using Fastrill for WhatsApp bookings."}
${workingHours ? `Working hours: ${workingHours}` : ""}
${mapsLink ? `Maps: ${mapsLink}` : ""}
${aiInstr ? `\nOwner instructions:\n${aiInstr}` : ""}

SERVICES WE OFFER (EXACT LIST — nothing else):
${servicesText}

CURRENT BOOKING PROGRESS:
${stateDesc}

CUSTOMER NAME: ${firstName}
LANGUAGE: ${aiLanguage}

YOUR JOB:
You are a smart, warm, human-sounding WhatsApp assistant. You handle bookings, answer questions, and help customers naturally.

BOOKING RULES:
- Only book services from the EXACT LIST above. If customer asks for something not on the list, tell them warmly what you DO offer.
- For appointments: collect service → date → time → confirm → book
- For packages: collect service → confirm → book (no time needed)
- Ask ONE thing at a time. Never ask for multiple things in one message.
- When all details collected, ask: "Shall I confirm booking for [service] on [date] at [time]? ✅"
- When customer says yes/ok/confirm → action = create_booking
- When customer says no/wrong/change → action = clear_state, ask what to change
- When customer says reschedule → action = reschedule with new date/time

REPLY RULES:
- Keep replies SHORT — 2-3 lines max. This is WhatsApp.
- Be warm, friendly, human. Never sound robotic or like a bot.
- Use the customer's name naturally.
- Match the customer's language (Hindi, Telugu, English etc.)
- Never reveal you are an AI unless directly asked.

YOU MUST RESPOND WITH ONLY VALID JSON. No explanation, no markdown, no text outside JSON.

JSON FORMAT:
{
  "reply": "the message to send to customer",
  "action": "none|update_state|confirm_booking|create_booking|reschedule|cancel|clear_state",
  "booking": {
    "service": "exact service name from list or null",
    "date": "YYYY-MM-DD or null",
    "time": "HH:MM or null"
  }
}

ACTION MEANINGS:
- none: just reply, no booking action needed
- update_state: save partial booking details collected so far
- confirm_booking: you asked customer to confirm, waiting for their yes/no
- create_booking: customer confirmed, create the booking now
- reschedule: update an existing booking with new date/time
- cancel: cancel an existing booking
- clear_state: customer said no/wrong, clear booking state

EXAMPLES:
Customer: "hi" → {"reply": "Hi ${firstName}! 👋 Welcome to *${businessName}*! How can I help you today? 😊", "action": "none", "booking": {}}
Customer: "what services do you offer" → {"reply": "Here's what we offer at *${businessName}*:\\n\\n[list services with prices]\\n\\nInterested in booking? 😊", "action": "none", "booking": {}}
Customer: "i want a haircut" (haircut NOT in services list) → {"reply": "We don't offer haircut, ${firstName} 😊 But here's what we do have:\\n\\n[list services]\\n\\nWould you like to book any of these?", "action": "none", "booking": {}}
Customer: "book automation" (automation IS in list) → {"reply": "Great choice! 📅 What date works for your *Automation* session?", "action": "update_state", "booking": {"service": "Automation", "date": null, "time": null}}
Customer: "tomorrow" → {"reply": "Perfect! ⏰ What time works for you?", "action": "update_state", "booking": {"service": "Automation", "date": "2026-03-21", "time": null}}
Customer: "5pm" → {"reply": "Shall I confirm booking for *Automation* on *Sat, 21 Mar* at *17:00*? ✅", "action": "confirm_booking", "booking": {"service": "Automation", "date": "2026-03-21", "time": "17:00"}}
Customer: "yes" → {"reply": "✅ *Booking Confirmed!*\\n\\n📋 Service: Automation\\n📅 Date: Saturday, 21 March\\n⏰ Time: 17:00\\n\\nSee you soon at *${businessName}*! 😊", "action": "create_booking", "booking": {"service": "Automation", "date": "2026-03-21", "time": "17:00"}}
Customer: "no i need hair cut" (haircut not in list) → {"reply": "No problem! 😊 We don't offer haircut, but here's what we have:\\n\\n[list services]\\n\\nWould you like to book any of these?", "action": "clear_state", "booking": {}}`

  // Call Sarvam
  if (process.env.SARVAM_API_KEY) {
    try {
      const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: customerMessage }
      ]

      console.log("🔄 Calling Sarvam | history:", conversationHistory.length)
      const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
        method:  "POST",
        headers: {
          "Content-Type":          "application/json",
          "api-subscription-key":  process.env.SARVAM_API_KEY
        },
        body: JSON.stringify({
          model:       "sarvam-m",
          messages,
          max_tokens:  600,
          temperature: 0.4  // lower = more consistent JSON output
        })
      })

      const rawText = await response.text()
      console.log("📨 Sarvam HTTP:", response.status)

      const data = JSON.parse(rawText)
      if (data?.error) {
        console.error("❌ Sarvam error:", JSON.stringify(data.error))
      } else {
        const content = data?.choices?.[0]?.message?.content || ""
        const result  = parseSarvamJSON(content, businessName, firstName, activeServices)
        if (result) {
          console.log("✅ Sarvam parsed:", result.action, "|", result.reply?.substring(0, 80))
          return result
        }
      }
    } catch(err) {
      console.error("Sarvam exception:", err.message)
    }
  }

  // Fallback if Sarvam fails
  console.warn("⚠️ Sarvam unavailable — using fallback")
  return buildFallbackResponse({ customerMessage, businessName, firstName, activeServices, bookingState })
}

// ════════════════════════════════════════════════════════════════════
// PARSE SARVAM JSON RESPONSE
// Handles think tags, markdown fences, partial JSON
// ════════════════════════════════════════════════════════════════════

function parseSarvamJSON(rawContent, businessName, firstName, activeServices) {
  if (!rawContent?.trim()) return null
  console.log("📝 Raw Sarvam:", rawContent.substring(0, 500))

  let content = rawContent

  // Strip <think>...</think> blocks
  content = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim()

  // Strip markdown code fences
  content = content.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim()

  // Find JSON object in the content
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.warn("No JSON found in Sarvam response")
    return null
  }

  try {
    const parsed = JSON.parse(jsonMatch[0])

    // Validate required fields
    if (!parsed.reply || typeof parsed.reply !== "string") {
      console.warn("Invalid Sarvam JSON: missing reply")
      return null
    }

    // Sanitize action
    const validActions = ["none","update_state","confirm_booking","create_booking","reschedule","cancel","clear_state"]
    if (!validActions.includes(parsed.action)) {
      parsed.action = "none"
    }

    // Sanitize booking object
    if (!parsed.booking || typeof parsed.booking !== "object") {
      parsed.booking = {}
    }

    // Validate date format YYYY-MM-DD
    if (parsed.booking.date && !/^\d{4}-\d{2}-\d{2}$/.test(parsed.booking.date)) {
      console.warn("Invalid date format from Sarvam:", parsed.booking.date)
      parsed.booking.date = null
    }

    // Validate time format HH:MM
    if (parsed.booking.time && !/^\d{2}:\d{2}$/.test(parsed.booking.time)) {
      // Try to fix common formats like "5pm", "17:00:00"
      const timeFixed = fixTimeFormat(parsed.booking.time)
      parsed.booking.time = timeFixed
    }

    // Validate service exists in active services
    if (parsed.booking.service) {
      const matched = matchService(parsed.booking.service, activeServices)
      if (matched) {
        parsed.booking.service = matched.name // use exact DB name
      } else {
        // Sarvam tried to book a service that doesn't exist
        // Don't block — reply still goes through, just clear the service
        console.warn("Sarvam booked unknown service:", parsed.booking.service)
        parsed.booking.service = null
        // Downgrade action if it was about to create a booking
        if (["create_booking","confirm_booking"].includes(parsed.action)) {
          parsed.action = "none"
        }
      }
    }

    return parsed

  } catch(e) {
    console.error("JSON parse error:", e.message, "| Content:", jsonMatch[0].substring(0, 200))
    return null
  }
}

// ════════════════════════════════════════════════════════════════════
// FALLBACK RESPONSE — when Sarvam is unavailable
// ════════════════════════════════════════════════════════════════════

function buildFallbackResponse({ customerMessage, businessName, firstName, activeServices, bookingState }) {
  const msg   = (customerMessage || "").toLowerCase().trim()
  const sp    = activeServices.slice(0, 3).map(s => s.name).join(", ")
  const spAll = activeServices.length > 0
    ? activeServices.map(s => `• *${s.name}* — ₹${s.price}`).join("\n")
    : ""

  // Greeting
  if (/^(hi|hello|hey|hii|hai|namaste|vanakkam|good\s*(morning|afternoon|evening))/i.test(msg)) {
    return {
      reply:   `Hi ${firstName}! 👋 Welcome to *${businessName}*!${sp ? `\n\nWe offer: ${sp} and more.` : ""}\n\nHow can I help you today? 😊`,
      action:  "none",
      booking: {}
    }
  }

  // Pricing/services
  if (/price|cost|services|offer|how much|charges|menu|list/i.test(msg)) {
    return {
      reply:   spAll ? `*${businessName} Services*\n\n${spAll}\n\nWant to book? Just ask! 😊` : `Please contact us directly for pricing 🙏`,
      action:  "none",
      booking: {}
    }
  }

  // Location
  if (/location|address|where|directions|maps/i.test(msg)) {
    const loc  = ""
    const maps = ""
    return {
      reply:   loc ? `📍 We're at: *${loc}*\n\nSee you soon! 😊` : `I'll get our address for you shortly! 📍`,
      action:  "none",
      booking: {}
    }
  }

  // Default
  return {
    reply:   `Thanks for reaching out to *${businessName}*! 😊${sp ? `\n\nWe offer: ${sp}.` : ""}\n\nHow can I help?\n📅 Book an appointment\n💰 Services & pricing\n📍 Our location`,
    action:  "none",
    booking: {}
  }
}

// ════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════

function fixTimeFormat(timeStr) {
  if (!timeStr) return null
  // Handle "5pm", "5:00pm", "17:00:00"
  const m = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
  if (!m) return null
  let h    = parseInt(m[1])
  const mn = m[2] || "00"
  const ap = m[3]?.toLowerCase()
  if (ap === "pm" && h < 12) h += 12
  if (ap === "am" && h === 12) h = 0
  if (h >= 0 && h <= 23) return `${String(h).padStart(2,"0")}:${mn.padStart(2,"0")}`
  return null
}

function isTimeBased(service) {
  if (!service) return false
  if (service.service_type === "time")    return true
  if (service.service_type === "package") return false
  return !!(service.duration && service.duration > 0)
}

function matchService(name, list) {
  if (!name || !list?.length) return null
  const s = name.toLowerCase().trim()
  return list.find(svc => svc.name.toLowerCase() === s)
    || list.find(svc => svc.name.toLowerCase().includes(s) || s.includes(svc.name.toLowerCase()))
    || null
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
      const dt = new Date(date + "T" + time + ":00")
      return dt.toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short" }) + " at " + time
    }
  }
  return null
}

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
  return deduped.slice(-12)
}

async function sendAndSave({ phoneNumberId, accessToken, toNumber, message, userId, conversationId, customerPhone }) {
  const result = await sendWhatsAppMessage({ phoneNumberId, accessToken, toNumber, message })
  try {
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
  } catch(e) { console.warn("Message save failed:", e.message) }
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
