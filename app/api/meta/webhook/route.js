import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// ════════════════════════════════════════════════════════════════════
// FASTRILL WEBHOOK — VERSION 6.0
// Full enterprise WhatsApp AI SaaS engine
// ════════════════════════════════════════════════════════════════════
// FEATURES:
// ✅ Multi-tenant SaaS (user_id isolation throughout)
// ✅ Duplicate message guard (wa_message_id dedup)
// ✅ WhatsApp text / button / interactive support
// ✅ Status update filtering (skip delivery receipts)
// ✅ Customer CRM auto-create + last_visit tracking
// ✅ Conversation thread management + unread count
// ✅ Inbound message storage with full metadata
// ✅ Lead auto-capture + update on returning customers
// ✅ AI toggle per conversation (ai_enabled flag)
// ✅ Sarvam AI with full conversation history context
// ✅ <think> tag extraction (sarvam-m outputs reasoning)
// ✅ Business knowledge injection (name/type/location/hours)
// ✅ Service catalog injection with prices + duration
// ✅ Booking intent detection (book/slot/appointment)
// ✅ Reschedule intent detection (multi-keyword, multilingual)
// ✅ Cancel intent detection + soft redirect to reschedule
// ✅ Pricing query detection + instant service price reply
// ✅ Location query detection + maps link reply
// ✅ Greeting detection + warm welcome
// ✅ Natural language date parsing (today/tomorrow/weekday/15th march)
// ✅ Natural language time parsing (5pm/morning/18:00/4:30pm)
// ✅ Multi-language keyword support (Hindi/Telugu/English)
// ✅ Service name extraction from services table
// ✅ Booking state machine (collect service→date→time→confirm)
// ✅ Slot conflict prevention (checks existing bookings per slot)
// ✅ Capacity control (supports chairs/doctors/parallel bookings)
// ✅ Alternative slot suggestion when slot is full
// ✅ Service duration awareness for slot intervals
// ✅ Booking database insertion with ai_booked flag
// ✅ Booking confirmation WhatsApp message
// ✅ Reschedule flow (update existing booking)
// ✅ Reschedule confirmation WhatsApp message
// ✅ Cancel handling with reschedule offer
// ✅ Strictly alternating AI history (Sarvam requirement)
// ✅ Rule-based fallback when Sarvam unavailable
// ✅ All DB tables synced: customers/conversations/messages/leads/bookings
// ════════════════════════════════════════════════════════════════════

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ── GET: WhatsApp webhook verification ──────────────────────────────
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

// ── POST: Receive WhatsApp messages ─────────────────────────────────
export async function POST(req) {
  try {
    console.log("🚀 FASTRILL WEBHOOK v6.0")
    const body = await req.json()

    // Skip pure delivery status updates (no messages)
    const statuses = body?.entry?.[0]?.changes?.[0]?.value?.statuses
    if (statuses && !body?.entry?.[0]?.changes?.[0]?.value?.messages) {
      return NextResponse.json({ status: "status_update" }, { status: 200 })
    }
    if (!body?.entry?.[0]?.changes?.[0]?.value?.messages) {
      return NextResponse.json({ status: "no_message" }, { status: 200 })
    }

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

      // ── DUPLICATE MESSAGE GUARD ──────────────────────────────────
      const { data: dupMsg } = await supabaseAdmin
        .from("messages").select("id").eq("wa_message_id", messageId).maybeSingle()
      if (dupMsg) {
        console.log("⚠️ Duplicate message, skipping:", messageId)
        continue
      }

      // ── EXTRACT TEXT ─────────────────────────────────────────────
      let messageText = ""
      if      (messageType === "text")        messageText = message.text?.body || ""
      else if (messageType === "button")      messageText = message.button?.text || ""
      else if (messageType === "interactive") {
        messageText = message.interactive?.button_reply?.title
          || message.interactive?.list_reply?.title || ""
      }
      // Skip non-text media (images/audio/video) for AI — still save them
      const isTextMessage = ["text","button","interactive"].includes(messageType)

      console.log(`📩 [${phoneNumberId}] From ${fromNumber} (${contactName}): "${messageText}"`)

      // ── LOOK UP WHATSAPP CONNECTION → USER ──────────────────────
      const { data: connection } = await supabaseAdmin
        .from("whatsapp_connections")
        .select("user_id, access_token")
        .eq("phone_number_id", phoneNumberId)
        .single()

      if (!connection) {
        console.error("❌ No WA connection for phoneNumberId:", phoneNumberId)
        continue
      }
      const userId = connection.user_id

      // ══ 1. CRM — UPSERT CUSTOMER ════════════════════════════════
      let customer = null
      const { data: existingCustomer } = await supabaseAdmin
        .from("customers")
        .select("*")
        .eq("phone", formattedPhone)
        .eq("user_id", userId)
        .maybeSingle()

      if (existingCustomer) {
        await supabaseAdmin.from("customers")
          .update({ last_visit_at: timestamp, name: existingCustomer.name || contactName })
          .eq("id", existingCustomer.id)
        customer = existingCustomer
      } else {
        const { data: newCustomer, error: custErr } = await supabaseAdmin
          .from("customers")
          .insert({
            user_id: userId, phone: formattedPhone, name: contactName,
            source: "whatsapp", tag: "new_lead", created_at: timestamp
          })
          .select().single()
        if (custErr) console.error("Customer insert error:", custErr.message)
        customer = newCustomer
        console.log(`✅ New customer: ${contactName} (${formattedPhone})`)
      }

      // ══ 2. CRM — UPSERT CONVERSATION ════════════════════════════
      let conversation = null
      const { data: existingConvo } = await supabaseAdmin
        .from("conversations")
        .select("*")
        .eq("phone", formattedPhone)
        .eq("user_id", userId)
        .maybeSingle()

      if (existingConvo) {
        const { data: updatedConvo } = await supabaseAdmin
          .from("conversations")
          .update({
            last_message:    messageText || "[media]",
            last_message_at: timestamp,
            unread_count:    (existingConvo.unread_count || 0) + 1,
            customer_id:     customer?.id || existingConvo.customer_id,
            status:          "open"
          })
          .eq("id", existingConvo.id)
          .select().single()
        conversation = updatedConvo
      } else {
        const { data: newConvo, error: convoErr } = await supabaseAdmin
          .from("conversations")
          .insert({
            user_id:         userId,
            customer_id:     customer?.id || null,
            phone:           formattedPhone,
            status:          "open",
            ai_enabled:      true,
            last_message:    messageText || "[media]",
            last_message_at: timestamp,
            unread_count:    1
          })
          .select().single()
        if (convoErr) console.error("Conversation insert error:", convoErr.message)
        conversation = newConvo
      }

      // ══ 3. MESSAGES — SAVE INBOUND ══════════════════════════════
      await supabaseAdmin.from("messages").insert({
        user_id:         userId,
        phone_number_id: phoneNumberId,
        from_number:     fromNumber,
        message_text:    messageText || "[media message]",
        direction:       "inbound",
        conversation_id: conversation?.id || null,
        customer_phone:  formattedPhone,
        message_type:    messageType || "text",
        status:          "delivered",
        is_ai:           false,
        wa_message_id:   messageId || null,
        created_at:      timestamp
      })

      // ══ 4. LEADS — AUTO CAPTURE / UPDATE ════════════════════════
      if (messageText) {
        if (!existingCustomer && customer) {
          // New customer = new lead
          try {
            await supabaseAdmin.from("leads").insert({
              user_id:         userId,
              customer_id:     customer.id,
              phone:           formattedPhone,
              name:            contactName,
              source:          "whatsapp",
              status:          "open",
              last_message:    messageText,
              last_message_at: timestamp,
              ai_score:        60,
              estimated_value: 600
            })
          } catch(e) { console.warn("Lead insert warn:", e.message) }
        } else if (existingCustomer) {
          // Returning customer — update their open lead's last activity
          try {
            await supabaseAdmin.from("leads")
              .update({ last_message: messageText, last_message_at: timestamp })
              .eq("customer_id", existingCustomer.id)
              .eq("status", "open")
          } catch(e) { console.warn("Lead update warn:", e.message) }
        }
      }

      // ══ 5. SAFETY CHECKS ════════════════════════════════════════
      // Handle STOP / opt-out requests (Meta compliance requirement)
      const stopKeywords = ["stop","unsubscribe","opt out","optout","don't message","dont message","remove me","no more messages","no more msgs"]
      const isStopRequest = isTextMessage && stopKeywords.some(kw => (messageText||"").toLowerCase().trim() === kw || (messageText||"").toLowerCase().includes(kw))
      if (isStopRequest) {
        try {
          await supabaseAdmin.from("campaign_optouts").upsert({ user_id: userId, phone: formattedPhone, created_at: new Date().toISOString() }, { onConflict: "user_id,phone" })
          const stopReply = "You've been unsubscribed from our messages. Reply START to resubscribe anytime 🙏"
          await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: stopReply, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
          console.log("🚫 Opt-out recorded for:", formattedPhone)
        } catch(e) { console.warn("Optout save failed:", e.message) }
        continue
      }
      // Handle START / re-subscribe
      if (isTextMessage && (messageText||"").toLowerCase().trim() === "start") {
        try {
          await supabaseAdmin.from("campaign_optouts").delete().eq("user_id", userId).eq("phone", formattedPhone)
          const startReply = "You've been resubscribed! Welcome back 😊"
          await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: startReply, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
        } catch(e) { console.warn("Resubscribe failed:", e.message) }
        continue
      }

      // Skip AI if disabled for this conversation
      if (conversation?.ai_enabled === false) {
        console.log("⏸️ AI disabled for this conversation")
        continue
      }
      // Skip AI for non-text messages (images, audio, video)
      if (!isTextMessage || !messageText) {
        console.log("⏸️ Non-text/empty message — skipping AI")
        continue
      }

      // ══ 6. LOAD BUSINESS INTELLIGENCE ═══════════════════════════
      const [
        { data: bizSettings },
        { data: rawHistory },
        { data: servicesList },
        { data: bk }
      ] = await Promise.all([
        supabaseAdmin.from("business_settings").select("*").eq("user_id", userId).maybeSingle(),
        supabaseAdmin.from("messages")
          .select("message_text, direction, is_ai, created_at")
          .eq("conversation_id", conversation?.id)
          .order("created_at", { ascending: false })
          .limit(14),
        supabaseAdmin.from("services")
          .select("name, price, duration, capacity")
          .eq("user_id", userId),
        supabaseAdmin.from("business_knowledge").select("*").eq("user_id", userId).maybeSingle()
      ])

      // Build strictly alternating history (Sarvam requirement)
      const historyRaw = (rawHistory || []).reverse().map(m => ({
        role:    m.direction === "inbound" ? "user" : "assistant",
        content: (m.message_text || "").trim()
      })).filter(m => m.content && m.content !== "[media message]")

      const conversationHistory = buildAlternatingHistory(historyRaw)
      console.log("📜 History:", conversationHistory.map(m => m.role).join("→") || "empty")

      // ══ 7. DETECT INTENT ════════════════════════════════════════
      const intent = detectIntent(conversationHistory, messageText)
      console.log("🎯 Intent:", intent.type, "| State:", JSON.stringify(intent.bookingState))

      const biz = bizSettings || bk || {}

      // ══ 8. INSTANT REPLIES — No AI needed ═══════════════════════
      // Pricing query → instant service list
      if (intent.type === "pricing" && !intent.bookingState.service) {
        const priceReply = buildPricingReply(servicesList, biz)
        await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: priceReply, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
        await supabaseAdmin.from("conversations").update({ last_message: priceReply, last_message_at: new Date().toISOString() }).eq("id", conversation?.id)
        continue
      }

      // Location query → instant maps reply
      if (intent.type === "location") {
        const locationReply = buildLocationReply(biz)
        await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: locationReply, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
        await supabaseAdmin.from("conversations").update({ last_message: locationReply, last_message_at: new Date().toISOString() }).eq("id", conversation?.id)
        continue
      }

      // ══ 9. RESCHEDULE FLOW ═══════════════════════════════════════
      if (intent.type === "reschedule" && intent.bookingState.date && intent.bookingState.time) {
        const { data: existingBooking } = await supabaseAdmin
          .from("bookings")
          .select("*")
          .eq("customer_phone", formattedPhone)
          .eq("user_id", userId)
          .in("status", ["confirmed", "pending"])
          .order("booking_date", { ascending: true })
          .limit(1)
          .maybeSingle()

        if (existingBooking) {
          const newDate = intent.bookingState.date
          const newTime = intent.bookingState.time

          // Check slot availability before rescheduling
          const slotFree = await isSlotAvailable({ userId, date: newDate, time: newTime, service: existingBooking.service, servicesList: servicesList || [], excludeBookingId: existingBooking.id })

          if (!slotFree) {
            const altSlot = await findNextAvailableSlot({ userId, date: newDate, service: existingBooking.service, servicesList: servicesList || [] })
            const busyMsg = altSlot
              ? `That slot is full 😅 Next available: *${altSlot}*\n\nShall I book that instead? ✅`
              : `That slot is fully booked 😅 Please suggest another time?`
            await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: busyMsg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
            continue
          }

          await supabaseAdmin.from("bookings")
            .update({ booking_date: newDate, booking_time: newTime, status: "confirmed" })
            .eq("id", existingBooking.id)

          const rescheduleMsg = buildRescheduleConfirmation(existingBooking.service, newDate, newTime, biz.business_name || "our business")
          await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: rescheduleMsg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
          await supabaseAdmin.from("conversations").update({ last_message: `🔄 Rescheduled — ${existingBooking.service}` }).eq("id", conversation?.id)
          console.log("🔄 Booking rescheduled:", existingBooking.id, "→", newDate, newTime)
          continue
        }
      }

      // ══ 10. NEW BOOKING CREATION ══════════════════════════════════
      if (intent.type === "booking" && intent.bookingState.readyToBook) {
        const { date, time, service } = intent.bookingState

        // Match service from DB for accurate price + duration
        const matchedService = matchService(service, servicesList || [])

        // Check slot availability (capacity control)
        const slotFree = await isSlotAvailable({ userId, date, time, service: matchedService?.name || service, servicesList: servicesList || [] })

        if (!slotFree) {
          const altSlot = await findNextAvailableSlot({ userId, date, service: matchedService?.name || service, servicesList: servicesList || [] })
          const busyMsg = altSlot
            ? `That slot is taken 😅 How about *${altSlot}*? Shall I book that? ✅`
            : `That time slot is fully booked 😅 Could you suggest another time?`
          await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: busyMsg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
          continue
        }

        const { data: newBooking, error: bookErr } = await supabaseAdmin
          .from("bookings")
          .insert({
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
          })
          .select().single()

        if (bookErr) {
          console.error("❌ Booking insert error:", bookErr.message)
        } else {
          console.log("✅ Booking created:", newBooking.id, service, date, time)
        }

        const confirmMsg = buildConfirmationMessage(matchedService?.name || service, date, time, biz.business_name || "our business")
        await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: confirmMsg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
        await supabaseAdmin.from("conversations").update({ last_message: `✅ Booking Confirmed — ${service}` }).eq("id", conversation?.id)
        continue
      }

      // ══ 11. AI REPLY ═════════════════════════════════════════════
      const aiReply = await generateAIReply({
        customerMessage: messageText,
        bizSettings:     biz,
        history:         conversationHistory,
        customerName:    contactName,
        intent,
        servicesList:    servicesList || []
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
// SLOT AVAILABILITY ENGINE
// Supports capacity control (parallel bookings) + duration awareness
// ════════════════════════════════════════════════════════════════════

async function isSlotAvailable({ userId, date, time, service, servicesList, excludeBookingId }) {
  if (!date || !time) return true

  const svc = matchService(service, servicesList)
  const capacity = svc?.capacity || 1 // default 1 slot per time (1 chair/doctor)

  const query = supabaseAdmin
    .from("bookings")
    .select("id")
    .eq("user_id", userId)
    .eq("booking_date", date)
    .eq("booking_time", time)
    .in("status", ["confirmed", "pending"])

  if (excludeBookingId) query.neq("id", excludeBookingId)

  const { data: existing } = await query
  return (existing?.length || 0) < capacity
}

async function findNextAvailableSlot({ userId, date, service, servicesList }) {
  if (!date) return null

  const svc = matchService(service, servicesList)
  const duration = svc?.duration || svc?.duration_minutes || 30

  // Generate time slots from 9am to 8pm in service-duration intervals
  const slots = []
  let minuteStart = 9 * 60
  while (minuteStart <= 20 * 60) {
    const h = Math.floor(minuteStart / 60)
    const m = minuteStart % 60
    slots.push(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`)
    minuteStart += duration
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
  const s = serviceName.toLowerCase()
  return servicesList.find(svc =>
    svc.name.toLowerCase().includes(s) || s.includes(svc.name.toLowerCase())
  ) || null
}

// ════════════════════════════════════════════════════════════════════
// CONVERSATION HISTORY BUILDER
// Sarvam requires strictly alternating user/assistant messages
// ════════════════════════════════════════════════════════════════════

function buildAlternatingHistory(rawHistory) {
  if (!rawHistory || rawHistory.length === 0) return []
  const deduped = []
  for (const msg of rawHistory) {
    if (deduped.length === 0 || deduped[deduped.length-1].role !== msg.role) {
      deduped.push(msg)
    } else {
      deduped[deduped.length-1] = msg // keep latest of consecutive same-role
    }
  }
  // Must start with user, end with assistant (for history context)
  while (deduped.length > 0 && deduped[0].role !== "user") deduped.shift()
  while (deduped.length > 0 && deduped[deduped.length-1].role === "user") deduped.pop()
  return deduped.slice(-10) // max 10 messages for context window
}

// ════════════════════════════════════════════════════════════════════
// INTENT DETECTION ENGINE
// Detects: booking, reschedule, cancel, pricing, location, greeting
// Multi-language: English + Hindi + Telugu keywords
// ════════════════════════════════════════════════════════════════════

function detectIntent(history, latestMessage) {
  const latestLower = latestMessage.toLowerCase().trim()
  const allText     = [...history.map(m => m.content), latestMessage].join(" ").toLowerCase()

  // ── Intent keyword maps ──
  const rescheduleKw = ["reschedule","change booking","change the booking","change appointment","change timing","change time","postpone","shift booking","move booking","update booking","different time","different date","another time","another day","change my slot","change slot","booking timings","change timings","timings change","booking change"]
  const cancelKw     = ["cancel","cancellation","don't want","not coming","cant come","cannot come","won't come","nahi aana","cancel karo","cancel cheyyandi"]
  const bookingKw    = ["book","appointment","slot","schedule","availab","cheyandi","kavali","fix appointment","want to come","coming in","visit","book karo","booking","appoint"]
  const pricingKw    = ["price","cost","rate","how much","charges","kitna","ekkuva","entha","fees","charge","amount","worth"]
  const locationKw   = ["location","address","where are you","where is","directions","maps","navigate","how to reach","how to come","gps","landmark","near","street"]
  const greetingRx   = /^(hi|hello|hey|hii|helo|hai|hiya|gm|gd mrng|good\s*(morning|afternoon|evening|night)|namaste|namaskar|vanakkam|heyyy|howdy|sup|whats up|what's up)[!\s.]*$/i

  const isReschedule = rescheduleKw.some(kw => latestLower.includes(kw))
  const isCancel     = cancelKw.some(kw => latestLower.includes(kw))
  const isBooking    = bookingKw.some(kw => latestLower.includes(kw))
  const isPricing    = pricingKw.some(kw => latestLower.includes(kw))
  const isLocation   = locationKw.some(kw => latestLower.includes(kw))
  const isGreeting   = greetingRx.test(latestLower)

  const bookingState = extractBookingDetails(history, latestMessage, allText, latestLower)

  let type = "general"
  if      (isCancel)     type = "cancel"
  else if (isReschedule) type = "reschedule"
  else if (isBooking || bookingState.service || bookingState.date || bookingState.time) type = "booking"
  else if (isGreeting)   type = "greeting"
  else if (isPricing)    type = "pricing"
  else if (isLocation)   type = "location"

  // For reschedule, try to extract new date/time from latest message
  if (type === "reschedule" && !bookingState.date) {
    const fresh = extractBookingDetails([], latestMessage, latestLower, latestLower)
    bookingState.date = fresh.date
    bookingState.time = fresh.time
  }

  return { type, bookingState }
}

// ════════════════════════════════════════════════════════════════════
// NATURAL LANGUAGE UNDERSTANDING
// Extracts: service, date, time from natural language
// Supports: today/tomorrow/weekday/day+month/DD-MM formats
// Time: 5pm / 4:30pm / morning / evening / 16:00
// ════════════════════════════════════════════════════════════════════

function extractBookingDetails(history, latestMessage, allText, latestLower) {
  const state = { service: null, date: null, time: null, readyToBook: false }

  // Use IST-safe today
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`

  // ── Service extraction ──
  // First try to match against dynamic services, then fallback to keyword list
  const serviceKeywords = [
    "haircut","hair cut","hair color","colour","coloring","facial","cleanup","bleach",
    "waxing","threading","manicure","pedicure","spa","massage","keratin","smoothening",
    "rebonding","highlights","balayage","trim","shave","beard","bridal","makeup",
    "mehendi","henna","eyebrow","hair wash","blow dry","hair spa","dandruff","treatment",
    "nail art","nail extension","lash","eyelash","botox","clean up","consultation",
    "detan","de-tan","de tan","root touch","root touch up","hair straightening",
    "hair smoothing","permanent straightening","protein treatment","scalp treatment",
    "cleanup","deep conditioning","toning","toner"
  ]
  for (const kw of serviceKeywords) {
    if (allText.includes(kw)) { state.service = kw; break }
  }

  // ── Date extraction ──
  const hasDateInLatest =
    /\b(today|tomorrow|kal|parso|sun|mon|tue|wed|thu|fri|sat|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i.test(latestMessage) ||
    /\d{1,2}[\/\-]\d{1,2}/.test(latestMessage) ||
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(latestMessage) ||
    /\d{1,2}(st|nd|rd|th)/i.test(latestMessage)

  const dateText = hasDateInLatest ? latestLower : allText

  if (dateText.includes("today")) {
    state.date = todayStr
  } else if (dateText.includes("tomorrow") || dateText.includes("kal ")) {
    const t = new Date(now); t.setDate(now.getDate() + 1)
    state.date = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`
  } else if (dateText.includes("parso") || dateText.includes("day after")) {
    const t = new Date(now); t.setDate(now.getDate() + 2)
    state.date = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`
  } else {
    // Weekday detection
    const days = [
      {idx:0, names:["sunday","sun"]},
      {idx:1, names:["monday","mon"]},
      {idx:2, names:["tuesday","tue"]},
      {idx:3, names:["wednesday","wed"]},
      {idx:4, names:["thursday","thu"]},
      {idx:5, names:["friday","fri"]},
      {idx:6, names:["saturday","sat"]}
    ]
    for (const day of days) {
      if (day.names.some(n => new RegExp(`\\b${n}\\b`,"i").test(dateText))) {
        let diff = (day.idx - now.getDay() + 7) % 7
        if (diff === 0) diff = 7 // "friday" = next friday if today is friday
        const d = new Date(now); d.setDate(now.getDate() + diff)
        state.date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
        break
      }
    }
  }

  // "15th march" / "march 15" / "15 march" patterns
  if (!state.date) {
    const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"]
    for (let i = 0; i < months.length; i++) {
      const re = new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s*${months[i]}|${months[i]}\\s*(\\d{1,2})(?:st|nd|rd|th)?`, "i")
      const src = hasDateInLatest ? latestMessage : allText
      const m = src.match(re)
      if (m) {
        const day = parseInt(m[1] || m[2])
        if (day >= 1 && day <= 31) {
          state.date = `${now.getFullYear()}-${String(i+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`
          break
        }
      }
    }
  }

  // DD/MM or DD-MM fallback
  if (!state.date) {
    const m = (hasDateInLatest ? latestMessage : allText).match(/(\d{1,2})[\/\-](\d{1,2})/)
    if (m) {
      state.date = `${now.getFullYear()}-${String(m[2]).padStart(2,"0")}-${String(m[1]).padStart(2,"0")}`
    }
  }

  // ── Time extraction ──
  const hasTimeInLatest =
    /\d{1,2}(:\d{2})?\s*(am|pm)/i.test(latestMessage) ||
    /\d{2}:\d{2}/.test(latestMessage) ||
    /\b\d{1,2}(pm|am)\b/i.test(latestMessage) ||
    /\b(morning|afternoon|evening|night)\b/i.test(latestMessage)

  const timeText = hasTimeInLatest ? latestMessage : allText

  if      (/\bmorning\b/i.test(timeText)   && !hasTimeInLatest) state.time = "10:00"
  else if (/\bafternoon\b/i.test(timeText) && !hasTimeInLatest) state.time = "14:00"
  else if (/\bevening\b/i.test(timeText)   && !hasTimeInLatest) state.time = "17:00"
  else if (/\bnight\b/i.test(timeText)     && !hasTimeInLatest) state.time = "19:00"
  else {
    // Parse "5pm", "4:30pm", "16:00", "4 pm"
    const tm = timeText.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i) || timeText.match(/(\d{2}):(\d{2})/)
    if (tm) {
      let hour = parseInt(tm[1])
      const min  = tm[2] ? tm[2] : "00"
      const ampm = tm[3]?.toLowerCase()
      if (ampm === "pm" && hour < 12) hour += 12
      if (ampm === "am" && hour === 12) hour = 0
      if (hour >= 7 && hour <= 22) {
        state.time = `${String(hour).padStart(2,"0")}:${min.padStart(2,"0")}`
      }
    }
  }

  // ── Booking confirmation detection ──
  // Customer must say yes AFTER AI asked to confirm
  const confirmWords = [
    "yes","yeah","yep","yup","ok","okay","sure","confirm","correct","right",
    "haan","ha","ji","theek","done","book it","go ahead","please book",
    "book karo","please","book","confirm karo","sounds good","perfect","great"
  ]
  const isConfirming = confirmWords.some(w =>
    latestLower.trim() === w ||
    latestLower.trim().startsWith(w + " ") ||
    latestLower.trim().endsWith(" " + w)
  )
  const lastAiMsg = [...history].reverse().find(m => m.role === "assistant")
  const aiAskedConfirm = lastAiMsg && (
    lastAiMsg.content.toLowerCase().includes("shall i book") ||
    lastAiMsg.content.toLowerCase().includes("shall i confirm") ||
    lastAiMsg.content.toLowerCase().includes("want me to book") ||
    lastAiMsg.content.toLowerCase().includes("book you for") ||
    lastAiMsg.content.toLowerCase().includes("confirm booking") ||
    lastAiMsg.content.toLowerCase().includes("confirm your booking")
  )

  if (state.service && state.date && state.time && isConfirming && aiAskedConfirm) {
    state.readyToBook = true
  }

  return state
}

// ════════════════════════════════════════════════════════════════════
// AI REPLY GENERATOR
// Primary: Sarvam AI (sarvam-m) with think-tag extraction
// Fallback: Rule-based smart reply engine
// ════════════════════════════════════════════════════════════════════

async function generateAIReply({ customerMessage, bizSettings, history, customerName, intent, servicesList }) {
  const firstName    = (customerName || "").split(" ")[0] || "there"
  const businessName = bizSettings?.business_name || "our business"
  const businessType = bizSettings?.business_type || "business"
  const location     = bizSettings?.location || ""
  const mapsLink     = bizSettings?.maps_link || ""
  const workingHours = bizSettings?.working_hours || ""
  const aiInstructions = bizSettings?.ai_instructions || ""
  const greetingStyle  = bizSettings?.greeting_message || ""
  const aiLanguage     = bizSettings?.ai_language || "English"

  const servicesText = servicesList.length > 0
    ? servicesList.map(s => `${s.name}: ₹${s.price}${s.duration ? ` (${s.duration} min)` : ""}`).join("\n")
    : ""

  // Build booking state hint for AI context
  const bs = intent.bookingState
  let bookingHint = ""
  if (bs.service || bs.date || bs.time) {
    const collected = []
    const missing   = []
    if (bs.service) collected.push(`service: ${bs.service}`)
    else            missing.push("which service")
    if (bs.date)    collected.push(`date: ${new Date(bs.date + "T12:00:00").toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short" })}`)
    else            missing.push("preferred date")
    if (bs.time)    collected.push(`time: ${bs.time}`)
    else            missing.push("preferred time")
    bookingHint = `\nBOOKING STATE — Collected: ${collected.join(", ")}.${missing.length ? ` Still need: ${missing.join(", ")}.` : " All collected — ask to confirm!"}`
  }

  const intentHint =
    intent.type === "reschedule" ? "\nCUSTOMER INTENT: RESCHEDULE — ask for new date/time only. Do NOT send welcome message." :
    intent.type === "cancel"     ? "\nCUSTOMER INTENT: CANCEL — acknowledge warmly, offer to reschedule instead." :
    ""

  const systemPrompt = `You are a smart, warm WhatsApp assistant for ${businessName} (${businessType}${location ? `, ${location}` : ""}).

Your mission: Handle customer requests and convert inquiries into bookings.

${servicesText ? `SERVICES & PRICES:\n${servicesText}\n` : ""}${workingHours ? `WORKING HOURS: ${workingHours}\n` : ""}${location ? `ADDRESS: ${location}` : ""}${mapsLink ? `\nMAPS: ${mapsLink}` : ""}${aiInstructions ? `\nSPECIAL INSTRUCTIONS:\n${aiInstructions}` : ""}
${intentHint}${bookingHint}

BOOKING FLOW:
1. Collect service, date, time — ONE question at a time
2. Once all 3 collected → "Shall I confirm booking for [service] on [date] at [time]? ✅"
3. Customer says yes → booking is created automatically

RESCHEDULE FLOW:
- Ask for new date and time only
- Once collected → "Reschedule to [date] at [time]? ✅"

RULES:
- SHORT replies — max 3-4 lines, 1-2 emojis max
- Address customer as "${firstName}" occasionally  
- Reply in ${aiLanguage} (match customer language naturally)
- NEVER repeat info already collected in booking state
- NEVER generic welcome for specific requests
${greetingStyle ? `- Greeting style: "${greetingStyle}"` : ""}`

  // ── Try Sarvam AI ────────────────────────────────────────────────
  if (process.env.SARVAM_API_KEY) {
    try {
      const sarvamMessages = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: customerMessage }
      ]
      console.log("🔄 Calling Sarvam | roles:", sarvamMessages.map(m => m.role).join("→"))

      const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
        method:  "POST",
        headers: { "Content-Type": "application/json", "api-subscription-key": process.env.SARVAM_API_KEY },
        body:    JSON.stringify({ model: "sarvam-m", messages: sarvamMessages, max_tokens: 500, temperature: 0.65 })
      })

      const rawText = await response.text()
      console.log("📨 Sarvam HTTP:", response.status)
      console.log("📨 Sarvam raw:", rawText.substring(0, 400))

      const data = JSON.parse(rawText)
      if (data?.error) {
        console.error("❌ Sarvam API error:", JSON.stringify(data.error))
      } else {
        const rawContent = data?.choices?.[0]?.message?.content || ""
        const reply = extractSarvamReply(rawContent)
        if (reply) return reply
      }
    } catch (err) {
      console.error("Sarvam exception:", err.message)
    }
  }

  // ── Rule-based fallback ──────────────────────────────────────────
  console.warn("⚠️ Sarvam unavailable — rule-based fallback")
  return smartFallback({ msg: customerMessage, intent, businessName, servicesText, firstName, location, mapsLink, bookingState: bs })
}

// ════════════════════════════════════════════════════════════════════
// SARVAM <think> TAG EXTRACTOR
// sarvam-m wraps ALL output in <think> tags with reasoning first,
// then the actual reply. We extract the last short paragraph.
// ════════════════════════════════════════════════════════════════════

function extractSarvamReply(rawContent) {
  if (!rawContent || !rawContent.trim()) return null
  console.log("📨 Sarvam content (300):", rawContent.substring(0, 300))

  // CASE 1: Clean reply after </think>
  if (rawContent.includes("</think>")) {
    const afterThink = rawContent.split("</think>").pop().trim()
    if (afterThink && afterThink.length > 3) {
      console.log("✅ Case 1 — after </think>:", afterThink.substring(0, 100))
      return afterThink
    }
    // Nothing after </think> — grab last paragraph from inside
    const insideMatch = rawContent.match(/<think>([\s\S]*)<\/think>/)
    if (insideMatch) {
      const paras = insideMatch[1].trim().split("\n\n").map(p => p.trim()).filter(p => p.length > 5)
      if (paras.length > 0) {
        const reply = paras[paras.length - 1]
        console.log("✅ Case 1b — last para inside think:", reply.substring(0, 100))
        return reply
      }
    }
  }

  // CASE 2: No think tags at all — use directly
  if (!rawContent.includes("<think>")) {
    const reply = rawContent.trim()
    if (reply.length > 3) {
      console.log("✅ Case 2 — no think tags:", reply.substring(0, 100))
      return reply
    }
  }

  // CASE 3: Unclosed <think> — grab last paragraph
  if (rawContent.includes("<think>")) {
    const inside = rawContent.replace(/<think>/g, "").trim()
    const paras  = inside.split("\n\n").map(p => p.trim()).filter(p => p.length > 5)
    if (paras.length > 0) {
      const reply = paras[paras.length - 1]
      console.log("✅ Case 3 — unclosed think:", reply.substring(0, 100))
      return reply
    }
  }

  console.warn("⚠️ Could not extract Sarvam reply")
  return null
}

// ════════════════════════════════════════════════════════════════════
// INSTANT REPLY BUILDERS (no AI needed for these)
// ════════════════════════════════════════════════════════════════════

function buildPricingReply(servicesList, biz) {
  if (!servicesList?.length) return `Please reach us directly for our latest pricing 🙏`
  const list = servicesList.map(s => `• ${s.name}: ₹${s.price}${s.duration ? ` (${s.duration} min)` : ""}`).join("\n")
  return `💰 *Our Services & Prices*\n\n${list}\n\nWant to book? Just let me know! 😊`
}

function buildLocationReply(biz) {
  const location = biz?.location || ""
  const mapsLink = biz?.maps_link || ""
  if (location && mapsLink) return `📍 *${biz.business_name || "We're"}* at:\n${location}\n\n🗺️ ${mapsLink}\n\nSee you soon! 😊`
  if (location)             return `📍 We're at: *${location}*\n\nWould you like to book an appointment?`
  return `I'll get our address for you shortly! 📍`
}

function buildConfirmationMessage(service, date, time, businessName) {
  const formatted = date ? new Date(date + "T12:00:00").toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" }) : date
  return ["✅ *Booking Confirmed!*", "",
    `📋 Service: ${service}`,
    `📅 Date: ${formatted || date}`,
    time ? `⏰ Time: ${time}` : "",
    "", `See you soon at *${businessName}*! 😊`
  ].filter(Boolean).join("\n").replace(/\n{3,}/g, "\n\n")
}

function buildRescheduleConfirmation(service, date, time, businessName) {
  const formatted = date ? new Date(date + "T12:00:00").toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" }) : date
  return ["✅ *Booking Rescheduled!*", "",
    `📋 Service: ${service}`,
    `📅 New Date: ${formatted || date}`,
    time ? `⏰ New Time: ${time}` : "",
    "", `All updated! See you at *${businessName}* 😊`
  ].filter(Boolean).join("\n").replace(/\n{3,}/g, "\n\n")
}

// ════════════════════════════════════════════════════════════════════
// RULE-BASED FALLBACK ENGINE
// Used when Sarvam AI is unavailable
// ════════════════════════════════════════════════════════════════════

function smartFallback({ msg, intent, businessName, servicesText, firstName, location, mapsLink, bookingState: bs }) {
  const m = msg.toLowerCase().trim()

  if (intent.type === "reschedule") {
    if (!bs.date && !bs.time) return `Sure ${firstName}! 📅 What new date and time works for you?`
    if (bs.date && !bs.time)  return `Got the date! ⏰ What time would you prefer?`
    if (!bs.date && bs.time)  return `Got the time! 📅 What date works for you?`
    return `I'll reschedule to ${bs.date} at ${bs.time}. Shall I confirm? ✅`
  }
  if (intent.type === "cancel") {
    return `I understand you want to cancel 😔\n\nWould you prefer to reschedule instead? We'd love to see you! 🙌`
  }
  if (intent.type === "greeting") {
    return `Hi ${firstName}! 👋 Welcome to *${businessName}*!\n\nHow can I help you today? 😊\n📅 Book appointment\n💰 Services & prices\n📍 Our location`
  }
  if (intent.type === "pricing") {
    if (servicesText) return `💰 *Our Services*\n\n${servicesText}\n\nWant to book? Just let me know! 😊`
    return `I'll share our latest prices with you right away 🙌`
  }
  if (intent.type === "location") {
    if (location && mapsLink) return `📍 ${location}\n\n🗺️ ${mapsLink}\n\nSee you soon! 😊`
    if (location)             return `📍 We're at: ${location}`
    return `I'll share our location shortly 📍`
  }
  if (intent.type === "booking") {
    if (!bs.service)                     return `I'd love to help you book! 😊\n\nWhich service are you interested in?`
    if (bs.service && !bs.date)          return `Sure! 📅 What date works for your ${bs.service}?`
    if (bs.service && bs.date && !bs.time) return `Almost there! ⏰ What time works for you?`
    return `Shall I confirm booking for *${bs.service}* on ${bs.date} at ${bs.time}? ✅`
  }
  if (/thank|thanks|ok|okay|great|perfect|good|noted|done|alright|👍/.test(m)) {
    return `You're most welcome! 😊 Looking forward to seeing you at *${businessName}*! 🙌`
  }
  if (/speak|human|owner|manager|staff|agent/.test(m)) {
    return `Of course! 🙌 I'll notify our team and someone will reach out to you shortly.`
  }
  return `Thanks for reaching out to *${businessName}*! 😊\n\nHow can I help?\n📅 Book appointment\n💰 Services & prices\n📍 Our location`
}

// ════════════════════════════════════════════════════════════════════
// WHATSAPP SENDER + MESSAGE SAVER
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
    const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method:  "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body:    JSON.stringify({
        messaging_product: "whatsapp",
        to:                toNumber,
        type:              "text",
        text:              { body: message, preview_url: false }
      })
    })
    const data = await res.json()
    if (data.error) console.error("❌ WA send error:", JSON.stringify(data.error))
    return data
  } catch (err) {
    console.error("❌ WA send exception:", err.message)
    return {}
  }
}
