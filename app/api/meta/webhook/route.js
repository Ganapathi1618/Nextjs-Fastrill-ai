import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import "@/lib/env"

// ════════════════════════════════════════════════════════════════════
// FASTRILL WEBHOOK — VERSION 10.1
// ════════════════════════════════════════════════════════════════════
// Fixes from v10.0:
// ✅ FIX 1: Ambiguous date ("25") → Sarvam must confirm full date
// ✅ FIX 2: Ambiguous time ("11") → Sarvam checks hours, clarifies am/pm
// ✅ FIX 3: Fallback is now context-aware (booking in progress = continue flow)
// ✅ FIX 4: Today's date injected into prompt so Sarvam knows current month/year
// ════════════════════════════════════════════════════════════════════

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
    console.log("🚀 FASTRILL WEBHOOK v10.1")
    const body = await req.json()

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

      // Extract text
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

      // Find connection
      const { data: connection } = await supabaseAdmin
        .from("whatsapp_connections")
        .select("user_id, access_token")
        .eq("phone_number_id", phoneNumberId)
        .single()
      if (!connection) { console.error("❌ No WA connection:", phoneNumberId); continue }
      const userId = connection.user_id

      // ── CRM: Upsert customer ──────────────────────────────────────
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

      // ── CRM: Upsert conversation ──────────────────────────────────
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

      if (conversation?.ai_enabled === false) { console.log("⏸️ AI disabled"); continue }

      if (isMediaNoText) {
        await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: "Thanks for sharing! 😊 If you have any questions or want to book, just type here.", userId, conversationId: conversation?.id, customerPhone: formattedPhone })
        continue
      }

      // ── Load business context ─────────────────────────────────────
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
          bizKnowledge?.instructions,
          bizKnowledge?.knowledge,
          bizKnowledge?.notes
        ].filter(Boolean).join("\n\n") || ""
      }

      const activeServices = (servicesList || []).filter(s => s.is_active !== false)

      const historyRaw = (rawHistory || []).reverse().map(m => ({
        role:    m.direction === "inbound" ? "user" : "assistant",
        content: (m.message_text || "").trim()
      })).filter(m => m.content && m.content !== "[media message]")
      const conversationHistory = buildAlternatingHistory(historyRaw)

      let bookingState = null
      try {
        if (conversation?.booking_state) {
          bookingState = typeof conversation.booking_state === "string"
            ? JSON.parse(conversation.booking_state)
            : conversation.booking_state
        }
      } catch(e) { bookingState = null }

      console.log("🧠 Context:", { biz: biz.business_name, services: activeServices.length, history: conversationHistory.length, state: bookingState })

      // ── Call Sarvam Brain ─────────────────────────────────────────
      const sarvamResult = await callSarvamBrain({
        customerMessage: effectiveText,
        customerName:    contactName,
        biz,
        activeServices,
        conversationHistory,
        bookingState
      })

      console.log("🤖 Sarvam:", sarvamResult.action, "|", sarvamResult.reply?.substring(0, 80))

      const { reply, action, booking: newBookingData } = sarvamResult

      // Send reply
      await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: reply, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
      await supabaseAdmin.from("conversations").update({ last_message: reply, last_message_at: new Date().toISOString() }).eq("id", conversation?.id)

      // ── Execute action ────────────────────────────────────────────
      console.log("⚡ Action:", action, "| Data:", JSON.stringify(newBookingData))

      if (action === "update_state" || action === "confirm_booking") {
        if (newBookingData && Object.keys(newBookingData).some(k => newBookingData[k])) {
          const mergedState = { ...(bookingState || {}), ...newBookingData }
          // Remove null values from merge
          Object.keys(mergedState).forEach(k => { if (mergedState[k] === null) delete mergedState[k] })
          try {
            await supabaseAdmin.from("conversations")
              .update({ booking_state: JSON.stringify(mergedState) })
              .eq("id", conversation.id)
          } catch(e) { console.warn("State save failed:", e.message) }
        }
      }

      else if (action === "create_booking" && newBookingData?.service) {
        const matchedSvc = matchService(newBookingData.service, activeServices)

        // Slot check
        if (isTimeBased(matchedSvc) && newBookingData.date && newBookingData.time) {
          const slotFree = await isSlotAvailable({ userId, date: newBookingData.date, time: newBookingData.time, service: newBookingData.service, servicesList: activeServices })
          if (!slotFree) {
            const alt = await findNextAvailableSlot({ userId, date: newBookingData.date, service: newBookingData.service, servicesList: activeServices })
            const msg = alt
              ? `That slot just got taken 😅 Next available: *${alt}*\n\nShall I book that instead? ✅`
              : `That slot is fully booked 😅 Please suggest another time!`
            await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: msg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
            continue
          }
        }

        const { data: newBooking, error: bookErr } = await supabaseAdmin.from("bookings").insert({
          user_id:        userId,
          customer_name:  contactName,
          customer_phone: formattedPhone,
          customer_id:    customer?.id || null,
          service:        matchedSvc?.name || newBookingData.service,
          booking_date:   newBookingData.date || null,
          booking_time:   newBookingData.time || null,
          amount:         matchedSvc?.price   || 0,
          status:         "confirmed",
          ai_booked:      true,
          created_at:     new Date().toISOString()
        }).select().single()

        if (!bookErr && newBooking) {
          console.log("✅ Booking created:", newBooking.id)
          try {
            const { count: bc } = await supabaseAdmin.from("bookings").select("id", { count: "exact" })
              .eq("customer_phone", formattedPhone).eq("user_id", userId).in("status", ["confirmed","completed"])
            const tag = bc >= 5 ? "vip" : bc >= 2 ? "returning" : "new_lead"
            await supabaseAdmin.from("customers").update({ tag, last_visit_at: new Date().toISOString() }).eq("phone", formattedPhone).eq("user_id", userId)
          } catch(e) {}
          try {
            await supabaseAdmin.from("leads").update({ status: "converted", last_message_at: new Date().toISOString() })
              .eq("customer_id", customer?.id).eq("user_id", userId).eq("status", "open")
          } catch(e) {}
          try { await supabaseAdmin.from("conversations").update({ booking_state: null }).eq("id", conversation.id) } catch(e) {}
        }
      }

      else if (action === "reschedule" && newBookingData) {
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
        if (bookingToUpdate) {
          await supabaseAdmin.from("bookings").update({
            booking_date: newBookingData.date || bookingToUpdate.booking_date,
            booking_time: newBookingData.time || bookingToUpdate.booking_time,
            status:       "confirmed"
          }).eq("id", bookingToUpdate.id)
          console.log("✅ Rescheduled:", bookingToUpdate.id)
          try { await supabaseAdmin.from("conversations").update({ booking_state: null }).eq("id", conversation.id) } catch(e) {}
        }
      }

      else if (action === "cancel") {
        try {
          await supabaseAdmin.from("bookings").update({ status: "cancelled" })
            .eq("customer_phone", formattedPhone).eq("user_id", userId)
            .in("status", ["confirmed","pending"])
          await supabaseAdmin.from("conversations").update({ booking_state: null }).eq("id", conversation.id)
          console.log("✅ Cancelled")
        } catch(e) {}
      }

      else if (action === "clear_state") {
        try { await supabaseAdmin.from("conversations").update({ booking_state: null }).eq("id", conversation.id) } catch(e) {}
        console.log("🗑️ State cleared")
      }
    }

    return NextResponse.json({ status: "ok" }, { status: 200 })
  } catch (err) {
    console.error("❌ Webhook fatal:", err)
    return NextResponse.json({ status: "error", message: err.message }, { status: 200 })
  }
}

// ════════════════════════════════════════════════════════════════════
// SARVAM BRAIN — v10.1
// Key improvements:
// 1. Today's date injected so Sarvam knows current month/year
// 2. Explicit rules for ambiguous dates and times
// 3. Business hours used to resolve am/pm ambiguity
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

  // Inject today's date so Sarvam can resolve relative dates correctly
  const now         = new Date()
  const todayIST    = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
  const todayStr    = todayIST.toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" })
  const todayISO    = `${todayIST.getFullYear()}-${String(todayIST.getMonth()+1).padStart(2,"0")}-${String(todayIST.getDate()).padStart(2,"0")}`

  const servicesText = activeServices.length > 0
    ? activeServices.map(s => {
        let line = `- ${s.name}: ₹${s.price}`
        if (s.duration) line += ` (${s.duration} min)`
        if (s.description) line += ` — ${s.description}`
        return line
      }).join("\n")
    : "No services configured yet."

  const stateDesc = bookingState && Object.keys(bookingState).length > 0
    ? `Booking in progress: service=${bookingState.service||"not set"}, date=${bookingState.date||"not set"}, time=${bookingState.time||"not set"}`
    : "No booking in progress."

  const systemPrompt = `You are the WhatsApp AI assistant for *${businessName}*${businessType ? ` (${businessType})` : ""}${location ? `, ${location}` : ""}.

TODAY'S DATE: ${todayStr} (${todayISO})
Use this to resolve dates correctly. "Tomorrow" = one day after today. "25" alone = 25th of current month unless it has already passed, then next month.

BUSINESS HOURS: ${workingHours || "Not specified"}
Use business hours to resolve am/pm ambiguity.

ABOUT: ${description || "A business using Fastrill for WhatsApp bookings."}
${mapsLink ? `Maps: ${mapsLink}` : ""}
${aiInstr ? `\nOwner instructions:\n${aiInstr}` : ""}

SERVICES WE OFFER (ONLY these — nothing else):
${servicesText}

BOOKING STATE RIGHT NOW:
${stateDesc}

CUSTOMER: ${firstName}
LANGUAGE: ${aiLanguage}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULES — READ CAREFULLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RULE 1 — SERVICES:
Only book services from the EXACT LIST above.
If customer asks for something NOT in the list, say warmly:
"We don't offer [X]. Here's what we have: [list services with prices]. Would you like to book one of these?"
Never invent services. Never say "we don't have that" and leave them hanging.

RULE 2 — AMBIGUOUS DATE:
If customer sends ONLY a number like "25" or "5" or "the 10th" without a month:
- DO NOT assume. Confirm first.
- Reply: "Did you mean [day] [current month]? Just confirming before I check availability 😊"
- Set action to "update_state" only AFTER customer confirms.
If customer says "tomorrow", "next monday" etc. — calculate from TODAY's date above and confirm:
- Reply: "That's [full date] — does that work for you? 😊"

RULE 3 — AMBIGUOUS TIME:
If customer sends ONLY a number like "11" or "5" or "3" without am/pm:
- Check business hours to see if both am and pm are possible.
- If BOTH are within business hours: ask "Do you mean [X]am or [X]pm? 😊"
- If only ONE is within business hours: confirm that one. "I'll take that as [X]am — we close at [closing time]. Does that work? 😊"
- If NEITHER is within business hours: say "We're open [hours]. Which time works for you?"
- NEVER assume am or pm without asking or logically confirming from hours.

RULE 4 — BOOKING FLOW:
Collect details in this order: service → date (confirmed) → time (confirmed) → final confirmation → book
Ask ONE thing at a time. Never skip a step.
When all details collected and confirmed, ask:
"Shall I confirm booking for *[service]* on *[full date like Mon, 25 Mar]* at *[time like 11:00 AM]*? ✅"
When customer says yes → action = create_booking
When customer says no/wrong/change → action = clear_state, ask what to change naturally

RULE 5 — NATURAL CONVERSATION:
Be warm, friendly, human. 2-3 lines max per message. This is WhatsApp.
Match the customer's language.
Never sound like a bot. Never show system text or internal notes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE FORMAT — CRITICAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOU MUST RESPOND WITH ONLY VALID JSON. Nothing else. No explanation. No markdown. No text before or after.

{
  "reply": "the WhatsApp message to send to customer",
  "action": "none|update_state|confirm_booking|create_booking|reschedule|cancel|clear_state",
  "booking": {
    "service": "exact service name from list or null",
    "date": "YYYY-MM-DD or null",
    "time": "HH:MM (24hr) or null"
  }
}

ACTION GUIDE:
- none: just reply, nothing to save
- update_state: save booking progress (partial details collected)
- confirm_booking: you asked customer to confirm, waiting for yes/no — save all details
- create_booking: customer said yes, create booking now
- reschedule: customer wants to change date/time of existing booking
- cancel: customer wants to cancel
- clear_state: customer rejected or wants to start over

DATE RULES FOR JSON:
- Only put a date in "date" field when it is FULLY CONFIRMED by customer
- If ambiguous (just "25" or "tomorrow" not yet confirmed), set date to null and use update_state only after customer confirms
- Always use YYYY-MM-DD format

TIME RULES FOR JSON:
- Only put a time in "time" field when am/pm is CONFIRMED or unambiguous
- Use 24hr format: 11am = "11:00", 11pm = "23:00", 5pm = "17:00"
- If ambiguous (just "11" with no am/pm), set time to null and ask

EXAMPLES:

Customer: "hi"
{"reply": "Hi ${firstName}! 👋 Welcome to *${businessName}*! How can I help you today? 😊", "action": "none", "booking": {}}

Customer: "what services do you have"
{"reply": "*${businessName} Services*\\n\\n${activeServices.slice(0,4).map(s=>`• *${s.name}* — ₹${s.price}`).join("\\n")}\\n\\nWant to book one? 😊", "action": "none", "booking": {}}

Customer: "i want hair cut" (haircut NOT in list)
{"reply": "We don't offer haircut, ${firstName} 😊 But here's what we have:\\n\\n${activeServices.slice(0,4).map(s=>`• *${s.name}* — ₹${s.price}`).join("\\n")}\\n\\nWould you like to book one of these?", "action": "none", "booking": {}}

Customer: "book automation"
{"reply": "Great choice! 📅 What date works for your *Automation* session?", "action": "update_state", "booking": {"service": "Automation", "date": null, "time": null}}

Customer: "25" (ambiguous — only a number, no month)
{"reply": "Did you mean March 25th? Just confirming before I check availability 😊", "action": "none", "booking": {}}

Customer: "yes march 25"
{"reply": "Perfect! ⏰ What time works for you?", "action": "update_state", "booking": {"service": "Automation", "date": "2026-03-25", "time": null}}

Customer: "11" (ambiguous — business hours are 10am-10pm, both 11am and 11pm possible... wait 11pm is after 10pm closing so only 11am works)
{"reply": "I'll take that as 11:00 AM — we close at 10 PM so that works great! 😊\\n\\nShall I confirm booking for *Automation* on *Wed, 25 Mar* at *11:00 AM*? ✅", "action": "confirm_booking", "booking": {"service": "Automation", "date": "2026-03-25", "time": "11:00"}}

Customer: "11" (ambiguous — business hours are 9am-11pm, BOTH 11am and 11pm are possible)
{"reply": "Do you mean 11 AM or 11 PM? 😊", "action": "none", "booking": {}}

Customer: "11am"
{"reply": "Shall I confirm booking for *Automation* on *Wed, 25 Mar* at *11:00 AM*? ✅", "action": "confirm_booking", "booking": {"service": "Automation", "date": "2026-03-25", "time": "11:00"}}

Customer: "yes"
{"reply": "✅ *Booking Confirmed!*\\n\\n📋 Service: Automation\\n📅 Date: Wednesday, 25 March\\n⏰ Time: 11:00 AM\\n\\nSee you soon at *${businessName}*! 😊", "action": "create_booking", "booking": {"service": "Automation", "date": "2026-03-25", "time": "11:00"}}

Customer: "no i need hair cut instead" (mid-booking, haircut not in list)
{"reply": "No problem! 😊 We don't offer haircut, but here's what we have:\\n\\n${activeServices.slice(0,4).map(s=>`• *${s.name}* — ₹${s.price}`).join("\\n")}\\n\\nWould you like to book one of these?", "action": "clear_state", "booking": {}}`

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
          "Content-Type":         "application/json",
          "api-subscription-key": process.env.SARVAM_API_KEY
        },
        body: JSON.stringify({
          model:       "sarvam-m",
          messages,
          max_tokens:  600,
          temperature: 0.3  // low temperature = consistent JSON
        })
      })

      const rawText = await response.text()
      console.log("📨 Sarvam HTTP:", response.status)
      const data = JSON.parse(rawText)

      if (data?.error) {
        console.error("❌ Sarvam error:", JSON.stringify(data.error))
      } else {
        const content = data?.choices?.[0]?.message?.content || ""
        const result  = parseSarvamJSON(content, activeServices)
        if (result) {
          console.log("✅ Parsed:", result.action, "|", result.reply?.substring(0, 80))
          return result
        }
      }
    } catch(err) {
      console.error("Sarvam exception:", err.message)
    }
  }

  console.warn("⚠️ Sarvam unavailable — context-aware fallback")
  return buildFallbackResponse({ customerMessage, businessName, firstName, activeServices, bookingState })
}

// ════════════════════════════════════════════════════════════════════
// PARSE SARVAM JSON
// ════════════════════════════════════════════════════════════════════

function parseSarvamJSON(rawContent, activeServices) {
  if (!rawContent?.trim()) return null
  console.log("📝 Raw:", rawContent.substring(0, 400))

  let content = rawContent
  // Strip think tags
  content = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim()
  // Strip markdown fences
  content = content.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim()

  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) { console.warn("No JSON in Sarvam response"); return null }

  try {
    const parsed = JSON.parse(jsonMatch[0])

    if (!parsed.reply || typeof parsed.reply !== "string") {
      console.warn("Invalid: missing reply"); return null
    }

    const validActions = ["none","update_state","confirm_booking","create_booking","reschedule","cancel","clear_state"]
    if (!validActions.includes(parsed.action)) parsed.action = "none"

    if (!parsed.booking || typeof parsed.booking !== "object") parsed.booking = {}

    // Validate date
    if (parsed.booking.date && !/^\d{4}-\d{2}-\d{2}$/.test(parsed.booking.date)) {
      console.warn("Bad date format:", parsed.booking.date)
      parsed.booking.date = null
    }

    // Validate and fix time
    if (parsed.booking.time) {
      const fixed = fixTimeFormat(parsed.booking.time)
      parsed.booking.time = fixed
    }

    // Validate service exists in DB
    if (parsed.booking.service) {
      const matched = matchService(parsed.booking.service, activeServices)
      if (matched) {
        parsed.booking.service = matched.name
      } else {
        console.warn("Unknown service from Sarvam:", parsed.booking.service)
        parsed.booking.service = null
        if (["create_booking","confirm_booking"].includes(parsed.action)) {
          parsed.action = "none"
        }
      }
    }

    return parsed
  } catch(e) {
    console.error("JSON parse error:", e.message)
    return null
  }
}

// ════════════════════════════════════════════════════════════════════
// CONTEXT-AWARE FALLBACK
// When Sarvam fails, continue booking flow if one is in progress
// ════════════════════════════════════════════════════════════════════

function buildFallbackResponse({ customerMessage, businessName, firstName, activeServices, bookingState }) {
  const msg  = (customerMessage || "").toLowerCase().trim()
  const spAll = activeServices.length > 0
    ? activeServices.map(s => `• *${s.name}* — ₹${s.price}`).join("\n")
    : ""
  const sp3  = activeServices.slice(0,3).map(s => s.name).join(", ")

  // If booking in progress, continue it
  if (bookingState) {
    const { service, date, time } = bookingState

    if (!service) {
      return {
        reply:   `Which service would you like to book?\n\n${spAll}\n\nJust type the name 😊`,
        action:  "none",
        booking: {}
      }
    }
    if (service && !date) {
      return {
        reply:   `What date works for your *${service}*? 📅`,
        action:  "none",
        booking: {}
      }
    }
    if (service && date && !time) {
      return {
        reply:   `What time works for you? ⏰`,
        action:  "none",
        booking: {}
      }
    }
    if (service && date && time) {
      const fd = new Date(date+"T12:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})
      return {
        reply:   `Shall I confirm booking for *${service}* on *${fd}* at *${time}*? ✅`,
        action:  "confirm_booking",
        booking: { service, date, time }
      }
    }
  }

  // No booking in progress — generic responses
  if (/^(hi|hello|hey|hii|hai|namaste)/i.test(msg)) {
    return {
      reply:   `Hi ${firstName}! 👋 Welcome to *${businessName}*!${sp3 ? `\n\nWe offer: ${sp3} and more.` : ""}\n\nHow can I help? 😊`,
      action:  "none",
      booking: {}
    }
  }
  if (/price|cost|services|offer|how much|charges|menu|list/i.test(msg)) {
    return {
      reply:   spAll ? `*${businessName} Services*\n\n${spAll}\n\nWant to book? Just ask! 😊` : `Please contact us for pricing 🙏`,
      action:  "none",
      booking: {}
    }
  }
  if (/location|address|where|directions|maps/i.test(msg)) {
    return {
      reply:   `I'll get our address for you shortly! 📍`,
      action:  "none",
      booking: {}
    }
  }

  return {
    reply:   `Thanks for reaching out to *${businessName}*! 😊${sp3 ? `\n\nWe offer: ${sp3}.` : ""}\n\nHow can I help?\n📅 Book an appointment\n💰 Services & pricing\n📍 Our location`,
    action:  "none",
    booking: {}
  }
}

// ════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════

function fixTimeFormat(timeStr) {
  if (!timeStr) return null
  // Already HH:MM
  if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr
  // Handle "5pm", "5:00pm", "17:00:00", "11:00 AM"
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
      const dt = new Date(date+"T"+time+":00")
      return dt.toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"}) + " at " + time
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
    if (data.error) console.error("❌ WA error:", JSON.stringify(data.error))
    return data
  } catch(err) {
    console.error("❌ WA exception:", err.message)
    return {}
  }
}

// SQL: ALTER TABLE conversations ADD COLUMN IF NOT EXISTS booking_state JSONB;
