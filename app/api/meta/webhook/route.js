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
    console.log("🚀 WEBHOOK VERSION 5.3 — extract reply from inside think block")
    const body = await req.json()

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
      const timestamp      = new Date(parseInt(message.timestamp) * 1000).toISOString()
      const contact        = contacts.find(c => c.wa_id === fromNumber)
      const contactName    = contact?.profile?.name || "Customer"
      const formattedPhone = fromNumber.replace(/[^0-9]/g, "")

      let messageText = ""
      if      (messageType === "text")        messageText = message.text?.body || ""
      else if (messageType === "button")      messageText = message.button?.text || ""
      else if (messageType === "interactive") {
        messageText = message.interactive?.button_reply?.title
          || message.interactive?.list_reply?.title || ""
      }

      console.log(`📩 [${phoneNumberId}] From ${fromNumber} (${contactName}): "${messageText}"`)

      const { data: connection } = await supabaseAdmin
        .from("whatsapp_connections")
        .select("user_id, access_token")
        .eq("phone_number_id", phoneNumberId)
        .single()

      if (!connection) {
        console.error("❌ No connection found for phoneNumberId:", phoneNumberId)
        continue
      }
      const userId = connection.user_id

      // ── 1. UPSERT CUSTOMER ──
      let customer = null
      const { data: existingCustomer } = await supabaseAdmin
        .from("customers")
        .select("*")
        .eq("phone", formattedPhone)
        .eq("user_id", userId)
        .maybeSingle()

      if (existingCustomer) {
        await supabaseAdmin.from("customers")
          .update({ last_visit_at: timestamp })
          .eq("id", existingCustomer.id)
        customer = existingCustomer
      } else {
        const { data: newCustomer, error: custErr } = await supabaseAdmin
          .from("customers")
          .insert({ user_id: userId, phone: formattedPhone, name: contactName, source: "whatsapp", tag: "new_lead", created_at: timestamp })
          .select().single()
        if (custErr) console.error("Customer insert error:", custErr.message)
        customer = newCustomer
        console.log(`✅ New customer: ${contactName} (${formattedPhone})`)
      }

      // ── 2. UPSERT CONVERSATION ──
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

      // ── 3. SAVE INBOUND MESSAGE ──
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
        wa_message_id:   message.id || null,
        created_at:      timestamp
      })

      // ── 4. UPSERT LEAD ──
      if (messageText) {
        if (!existingCustomer && customer) {
          try {
            await supabaseAdmin.from("leads").insert({
              user_id: userId, customer_id: customer.id, phone: formattedPhone,
              name: contactName, source: "whatsapp", status: "open",
              last_message: messageText, last_message_at: timestamp,
              ai_score: 60, estimated_value: 600
            })
          } catch(e) { console.warn("Lead insert warn:", e.message) }
        } else if (existingCustomer) {
          try {
            await supabaseAdmin.from("leads")
              .update({ last_message: messageText, last_message_at: timestamp })
              .eq("customer_id", existingCustomer.id).eq("status", "open")
          } catch(e) { console.warn("Lead update warn:", e.message) }
        }
      }

      // ── 5. CHECK AI ENABLED ──
      if (conversation?.ai_enabled === false) {
        console.log("AI disabled for this conversation — skipping reply")
        continue
      }
      if (!messageText) {
        console.log("Non-text message — skipping AI reply")
        continue
      }

      // ── 6. GET BUSINESS DATA ──
      const [{ data: bizSettings }, { data: history }, { data: servicesList }, { data: bk }] = await Promise.all([
        supabaseAdmin.from("business_settings").select("*").eq("user_id", userId).maybeSingle(),
        supabaseAdmin.from("messages")
          .select("message_text,direction,is_ai,created_at")
          .eq("conversation_id", conversation?.id)
          .order("created_at", { ascending: false })
          .limit(14),
        supabaseAdmin.from("services").select("name,price,duration").eq("user_id", userId),
        supabaseAdmin.from("business_knowledge").select("*").eq("user_id", userId).maybeSingle()
      ])

      const rawHistory = (history || []).reverse().map(m => ({
        role:    m.direction === "inbound" ? "user" : "assistant",
        content: (m.message_text || "").trim()
      })).filter(m => m.content && m.content !== "[media message]")

      const conversationHistory = buildAlternatingHistory(rawHistory)
      console.log("📜 History roles:", conversationHistory.map(m => m.role).join(" → ") || "empty")

      // ── 7. DETECT INTENT ──
      const intent = detectIntent(conversationHistory, messageText)
      console.log("🎯 Intent:", intent.type, "| State:", JSON.stringify(intent.bookingState))

      // ── 8. RESCHEDULE ──
      if (intent.type === "reschedule" && intent.bookingState.date && intent.bookingState.time) {
        const { data: existingBooking } = await supabaseAdmin
          .from("bookings")
          .select("*")
          .eq("customer_phone", formattedPhone)
          .eq("user_id", userId)
          .in("status", ["confirmed", "pending"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        if (existingBooking) {
          await supabaseAdmin.from("bookings")
            .update({ booking_date: intent.bookingState.date, booking_time: intent.bookingState.time, status: "confirmed" })
            .eq("id", existingBooking.id)
          const rescheduleMsg = buildRescheduleConfirmation(existingBooking.service, intent.bookingState.date, intent.bookingState.time, bizSettings?.business_name || bk?.business_name || "our business")
          await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: rescheduleMsg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
          continue
        }
      }

      // ── 9. NEW BOOKING ──
      if (intent.type === "booking" && intent.bookingState.readyToBook) {
        const { date, time, service } = intent.bookingState
        const matchedService = (servicesList || []).find(s =>
          s.name.toLowerCase().includes((service||"").toLowerCase()) ||
          (service||"").toLowerCase().includes(s.name.toLowerCase())
        )
        const { data: newBooking, error: bookErr } = await supabaseAdmin
          .from("bookings")
          .insert({
            user_id: userId, customer_name: contactName, customer_phone: formattedPhone,
            customer_id: customer?.id || null, service: service || "Appointment",
            booking_date: date, booking_time: time, amount: matchedService?.price || 0,
            status: "confirmed", ai_booked: true, created_at: new Date().toISOString()
          })
          .select().single()
        if (bookErr) console.error("❌ Booking insert error:", bookErr.message)
        else console.log("✅ Booking created:", newBooking.id)

        const confirmMsg = buildConfirmationMessage(service, date, time, bizSettings?.business_name || bk?.business_name || "our business")
        await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: confirmMsg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
        await supabaseAdmin.from("conversations").update({ last_message: `✅ Booking Confirmed — ${service}` }).eq("id", conversation?.id)
        continue
      }

      // ── 10. GENERATE AI REPLY ──
      const aiReply = await generateAIReply({
        customerMessage: messageText, bizSettings, bk,
        history: conversationHistory, customerName: contactName,
        intent, servicesList: servicesList || []
      })

      console.log("📤 Sending:", aiReply.substring(0, 100))
      await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: aiReply, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
      await supabaseAdmin.from("conversations").update({ last_message: aiReply, last_message_at: new Date().toISOString() }).eq("id", conversation?.id)
    }

    return NextResponse.json({ status: "ok" }, { status: 200 })
  } catch (err) {
    console.error("❌ Webhook fatal error:", err)
    return NextResponse.json({ status: "error", message: err.message }, { status: 200 })
  }
}

// ── STRICTLY ALTERNATING HISTORY ──
function buildAlternatingHistory(rawHistory) {
  if (!rawHistory || rawHistory.length === 0) return []
  const deduped = []
  for (const msg of rawHistory) {
    if (deduped.length === 0 || deduped[deduped.length - 1].role !== msg.role) {
      deduped.push(msg)
    } else {
      deduped[deduped.length - 1] = msg
    }
  }
  while (deduped.length > 0 && deduped[0].role !== "user") deduped.shift()
  while (deduped.length > 0 && deduped[deduped.length - 1].role === "user") deduped.pop()
  return deduped.slice(-10)
}

// ── INTENT DETECTOR ──
function detectIntent(history, latestMessage) {
  const latestLower = latestMessage.toLowerCase().trim()
  const allText     = [...history.map(m => m.content), latestMessage].join(" ").toLowerCase()

  const rescheduleKeywords = ["reschedule","change booking","change the booking","change appointment","change the appointment","change timing","change the timing","change time","change the time","postpone","shift booking","move booking","update booking","different time","different date","another time","another day","change my slot","change slot","booking timings","change timings","timings change","booking change","appointment change"]
  const isReschedule = rescheduleKeywords.some(kw => latestLower.includes(kw))
  const isCancel     = ["cancel","cancellation","don't want","not coming","cant come","cannot come","nahi aana","cancel karo"].some(kw => latestLower.includes(kw))
  const isBooking    = ["book","appointment","slot","schedule","availab","cheyandi","kavali","fix appointment","want to come","coming in","visit","book karo"].some(kw => latestLower.includes(kw))

  const bookingState = extractBookingDetails(history, latestMessage, allText, latestLower)

  let type = "general"
  if      (isCancel)     type = "cancel"
  else if (isReschedule) type = "reschedule"
  else if (isBooking || bookingState.service || bookingState.date || bookingState.time) type = "booking"
  else if (/^(hi|hello|hey|hii|helo|hai|hiya|gm|good\s*(morning|afternoon|evening)|namaste)[\s!.]*$/.test(latestLower)) type = "greeting"
  else if (/price|cost|rate|how much|charges|kitna|ekkuva|entha/.test(latestLower)) type = "pricing"
  else if (/location|address|where|direction|maps/.test(latestLower)) type = "location"

  if (type === "reschedule" && !bookingState.date) {
    const fresh = extractBookingDetails([], latestMessage, latestLower, latestLower)
    bookingState.date = fresh.date
    bookingState.time = fresh.time
  }

  return { type, bookingState }
}

function extractBookingDetails(history, latestMessage, allText, latestLower) {
  const state = { service: null, date: null, time: null, readyToBook: false }
  const today = new Date()

  const serviceKeywords = ["haircut","hair cut","hair color","colour","coloring","facial","cleanup","bleach","waxing","threading","manicure","pedicure","spa","massage","keratin","smoothening","rebonding","highlights","balayage","trim","shave","beard","bridal","makeup","mehendi","henna","eyebrow","hair wash","blow dry","hair spa","dandruff","treatment","nail art","nail extension","lash","eyelash","botox","clean up","consultation"]
  for (const kw of serviceKeywords) {
    if (allText.includes(kw)) { state.service = kw; break }
  }

  const hasDateInLatest = /\b(today|tomorrow|kal|parso|sun|mon|tue|wed|thu|fri|sat|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i.test(latestMessage)
    || /\d{1,2}[\/\-]\d{1,2}/.test(latestMessage)
    || /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(latestMessage)
  const dateText = hasDateInLatest ? latestLower : allText

  if (dateText.includes("today")) {
    state.date = today.toISOString().split("T")[0]
  } else if (dateText.includes("tomorrow") || dateText.includes("kal")) {
    const t = new Date(today); t.setDate(t.getDate() + 1)
    state.date = t.toISOString().split("T")[0]
  } else if (dateText.includes("parso")) {
    const t = new Date(today); t.setDate(t.getDate() + 2)
    state.date = t.toISOString().split("T")[0]
  } else {
    const days = [{idx:0,names:["sunday","sun"]},{idx:1,names:["monday","mon"]},{idx:2,names:["tuesday","tue"]},{idx:3,names:["wednesday","wed"]},{idx:4,names:["thursday","thu"]},{idx:5,names:["friday","fri"]},{idx:6,names:["saturday","sat"]}]
    for (const day of days) {
      if (day.names.some(n => new RegExp(`\\b${n}\\b`,"i").test(dateText))) {
        let diff = (day.idx - today.getDay() + 7) % 7
        if (diff === 0) diff = 7
        const d = new Date(today); d.setDate(d.getDate() + diff)
        state.date = d.toISOString().split("T")[0]
        break
      }
    }
  }
  if (!state.date) {
    const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"]
    for (let i = 0; i < months.length; i++) {
      const re = new RegExp(`(\\d{1,2})\\s*${months[i]}|${months[i]}\\s*(\\d{1,2})`,"i")
      const m  = (hasDateInLatest ? latestMessage : allText).match(re)
      if (m) {
        const day = parseInt(m[1] || m[2])
        state.date = `${today.getFullYear()}-${String(i+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`
        break
      }
    }
  }
  if (!state.date) {
    const m = (hasDateInLatest ? latestMessage : allText).match(/(\d{1,2})[\/\-](\d{1,2})/)
    if (m) state.date = `${today.getFullYear()}-${String(m[2]).padStart(2,"0")}-${String(m[1]).padStart(2,"0")}`
  }

  const hasTimeInLatest = /\d{1,2}(:\d{2})?\s*(am|pm)/i.test(latestMessage)
    || /\d{1,2}:\d{2}/.test(latestMessage)
    || /\b\d{1,2}(pm|am)\b/i.test(latestMessage)
    || /\b(morning|afternoon|evening|night)\b/i.test(latestMessage)
  const timeText = hasTimeInLatest ? latestMessage : allText

  if      (/\bmorning\b/i.test(timeText)   && !hasTimeInLatest) state.time = "10:00"
  else if (/\bafternoon\b/i.test(timeText) && !hasTimeInLatest) state.time = "14:00"
  else if (/\bevening\b/i.test(timeText)   && !hasTimeInLatest) state.time = "17:00"
  else {
    const tm = timeText.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i) || timeText.match(/(\d{2}):(\d{2})/)
    if (tm) {
      let hour = parseInt(tm[1])
      const min = tm[2] ? tm[2] : "00"
      const ampm = tm[3]?.toLowerCase()
      if (ampm === "pm" && hour < 12) hour += 12
      if (ampm === "am" && hour === 12) hour = 0
      if (hour >= 7 && hour <= 22) state.time = `${String(hour).padStart(2,"0")}:${min}`
    }
  }

  const confirmWords = ["yes","yeah","ok","okay","sure","confirm","correct","right","haan","ha","ji","theek","done","book it","go ahead","please book","book karo","please","book","confirm karo"]
  const isConfirming = confirmWords.some(w => latestLower.trim() === w || latestLower.trim().startsWith(w+" ") || latestLower.trim().endsWith(" "+w))
  const lastAiMsg = [...history].reverse().find(m => m.role === "assistant")
  const aiAskedConfirm = lastAiMsg && (
    lastAiMsg.content.toLowerCase().includes("shall i book") ||
    lastAiMsg.content.toLowerCase().includes("confirm") ||
    lastAiMsg.content.toLowerCase().includes("want me to book") ||
    lastAiMsg.content.toLowerCase().includes("book you for") ||
    lastAiMsg.content.toLowerCase().includes("booking for") ||
    lastAiMsg.content.toLowerCase().includes("shall i confirm")
  )
  if (state.service && state.date && state.time && isConfirming && aiAskedConfirm) state.readyToBook = true

  return state
}

function buildConfirmationMessage(service, date, time, businessName) {
  const formattedDate = date ? new Date(date+"T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"}) : date
  return ["✅ *Booking Confirmed!*","",`📋 Service: ${service}`,`📅 Date: ${formattedDate||date}`,time?`⏰ Time: ${time}`:"","",`See you soon at ${businessName}! 😊`].filter(l=>l!==undefined).join("\n").replace(/\n{3,}/g,"\n\n")
}

function buildRescheduleConfirmation(service, date, time, businessName) {
  const formattedDate = date ? new Date(date+"T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"}) : date
  return ["✅ *Booking Rescheduled!*","",`📋 Service: ${service}`,`📅 New Date: ${formattedDate||date}`,time?`⏰ New Time: ${time}`:"","",`Updated! See you soon at ${businessName} 😊`].filter(l=>l!==undefined).join("\n").replace(/\n{3,}/g,"\n\n")
}

async function sendAndSave({ phoneNumberId, accessToken, toNumber, message, userId, conversationId, customerPhone }) {
  const sendResult = await sendWhatsAppMessage({ phoneNumberId, accessToken, toNumber, message })
  await supabaseAdmin.from("messages").insert({
    user_id: userId, phone_number_id: phoneNumberId, from_number: phoneNumberId,
    message_text: message, direction: "outbound", conversation_id: conversationId || null,
    customer_phone: customerPhone, message_type: "text", status: "sent", is_ai: true,
    wa_message_id: sendResult?.messages?.[0]?.id || null, created_at: new Date().toISOString()
  })
  return sendResult
}

// ════════════════════════════════════════════════════════
// extractSarvamReply — handles ALL sarvam-m think tag patterns
// sarvam-m always wraps output in <think> tags. The actual customer reply
// is the LAST short paragraph inside the think block (after all the reasoning).
function extractSarvamReply(rawContent) {
  if (!rawContent || !rawContent.trim()) return null
  console.log("📨 Sarvam raw (300 chars):", rawContent.substring(0, 300))

  // CASE 1: Clean reply exists AFTER </think> tag — ideal case
  if (rawContent.includes("</think>")) {
    const afterThink = rawContent.split("</think>").pop().trim()
    if (afterThink && afterThink.length > 3) {
      console.log("✅ Case 1 — after </think>:", afterThink.substring(0, 100))
      return afterThink
    }
    // Nothing after </think> — extract from INSIDE think block
    const insideMatch = rawContent.match(/<think>([\s\S]*)<\/think>/)
    if (insideMatch) {
      const insideThink = insideMatch[1].trim()
      // The reply is the last non-empty paragraph inside think
      const paragraphs = insideThink.split(/

+/).map(p => p.trim()).filter(p => p.length > 5)
      if (paragraphs.length > 0) {
        const reply = paragraphs[paragraphs.length - 1]
        console.log("✅ Case 1b — last para inside think:", reply.substring(0, 100))
        return reply
      }
    }
  }

  // CASE 2: No think tags — pure reply, use directly
  if (!rawContent.includes("<think>")) {
    const reply = rawContent.trim()
    if (reply.length > 3) {
      console.log("✅ Case 2 — no think tags:", reply.substring(0, 100))
      return reply
    }
  }

  // CASE 3: Has <think> but no </think> — still thinking, grab last paragraph
  if (rawContent.includes("<think>")) {
    const insideThink = rawContent.replace(/<think>/g, "").trim()
    const paragraphs = insideThink.split(/

+/).map(p => p.trim()).filter(p => p.length > 5)
    if (paragraphs.length > 0) {
      const reply = paragraphs[paragraphs.length - 1]
      console.log("✅ Case 3 — last para unclosed think:", reply.substring(0, 100))
      return reply
    }
  }

  console.warn("⚠️ Could not extract any reply from Sarvam content")
  return null
}

async function generateAIReply({ customerMessage, bizSettings, bk, history, customerName, intent, servicesList }) {
  const firstName    = customerName?.split(" ")[0] || "there"
  const businessName = bizSettings?.business_name || bk?.business_name || "our business"
  const businessType = bizSettings?.business_type || bk?.business_type || "business"
  const location     = bizSettings?.location || bk?.location || ""
  const mapsLink     = bizSettings?.maps_link || ""
  const aiInstructions = bizSettings?.ai_instructions || ""
  const greetingStyle  = bizSettings?.greeting_message || ""
  const aiLanguage     = bizSettings?.ai_language || "English"
  const servicesText   = servicesList.length > 0
    ? servicesList.map(s => `${s.name}: ₹${s.price}${s.duration ? ` (${s.duration} min)` : ""}`).join("\n")
    : bk?.services || ""

  const bs = intent.bookingState
  let bookingHint = ""
  if (bs.service || bs.date || bs.time) {
    const collected = []
    if (bs.service) collected.push(`service: ${bs.service}`)
    if (bs.date)    collected.push(`date: ${new Date(bs.date+"T12:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})}`)
    if (bs.time)    collected.push(`time: ${bs.time}`)
    const missing = []
    if (!bs.service) missing.push("which service")
    if (!bs.date)    missing.push("preferred date")
    if (!bs.time)    missing.push("preferred time")
    bookingHint = `\nBOOKING STATE: Collected — ${collected.join(", ")}.${missing.length ? ` Still need: ${missing.join(", ")}.` : " All details collected — ask customer to confirm!"}`
  }

  const intentHint = intent.type === "reschedule"
    ? "\nCUSTOMER INTENT: RESCHEDULE — wants to change existing booking. Ask for new date and time only. Do NOT send welcome message."
    : intent.type === "cancel"
    ? "\nCUSTOMER INTENT: CANCEL — wants to cancel. Acknowledge warmly, offer to reschedule instead."
    : ""

  const systemPrompt = `You are a smart, warm WhatsApp assistant for ${businessName} (${businessType}${location ? `, ${location}` : ""}).

Your mission: Handle all customer requests and convert inquiries into bookings.

${servicesText ? `SERVICES & PRICES:\n${servicesText}\n` : ""}
${location  ? `ADDRESS: ${location}`   : ""}
${mapsLink  ? `MAPS LINK: ${mapsLink}` : ""}
${aiInstructions ? `\nSPECIAL INSTRUCTIONS:\n${aiInstructions}` : ""}
${intentHint}
${bookingHint}

BOOKING FLOW:
1. Collect service, date, time — ONE question at a time
2. Once all 3 → "Shall I confirm booking for [service] on [date] at [time]? ✅"
3. Customer confirms → "Great! Booking confirmed ✅"

RESCHEDULE FLOW:
- "change booking/reschedule" → ask for new date and time ONLY
- Do NOT give welcome message for reschedule requests
- Once new date + time → "Reschedule to [date] at [time]? ✅"

RULES:
- SHORT replies — max 3-4 lines, 1-2 emojis
- Address as "${firstName}" occasionally
- Reply in ${aiLanguage} (match customer's language)
- NEVER give generic welcome for specific requests
- NEVER ask for info already in booking state above
${greetingStyle ? `\nGreeting style: "${greetingStyle}"` : ""}`

  // ── 1. Try Sarvam AI ──
  if (process.env.SARVAM_API_KEY) {
    try {
      const sarvamMessages = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: customerMessage }
      ]
      console.log("🔄 Sarvam roles:", sarvamMessages.map(m => m.role).join("→"))

      const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
        method:  "POST",
        headers: { "Content-Type": "application/json", "api-subscription-key": process.env.SARVAM_API_KEY },
        body:    JSON.stringify({ model: "sarvam-m", messages: sarvamMessages, max_tokens: 500, temperature: 0.65 })
      })

      const rawText = await response.text()
      console.log("📨 Sarvam HTTP status:", response.status)
      console.log("📨 Sarvam raw response:", rawText.substring(0, 400))

      const data = JSON.parse(rawText)

      // Check for API-level error
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

  // ── 2. Rule-based fallback (only if Sarvam fails) ──
  console.warn("⚠️ Sarvam failed — using rule-based fallback")
  return smartFallback({ msg: customerMessage, intent, businessName, servicesText, firstName, location, mapsLink, bookingState: bs })
}

function smartFallback({ msg, intent, businessName, servicesText, firstName, location, mapsLink, bookingState }) {
  const m = msg.toLowerCase().trim()
  if (intent.type === "reschedule") {
    if (!bookingState.date && !bookingState.time) return `Sure ${firstName}! 📅 What new date and time works for you?`
    if (bookingState.date && !bookingState.time)  return `Got it! What time would you prefer? ⏰`
    if (!bookingState.date && bookingState.time)  return `Got the time! What date works for you? 📅`
    return `I'll reschedule to ${bookingState.date} at ${bookingState.time}. Shall I confirm? ✅`
  }
  if (intent.type === "cancel")  return `I understand you want to cancel 😔\n\nWould you like to reschedule instead? 🙌`
  if (intent.type === "greeting") return `Hi ${firstName}! 👋 Welcome to ${businessName}!\n\nHow can I help you today? 😊\n📅 Book appointment\n💰 Services & prices\n📍 Our location`
  if (intent.type === "pricing" || m.includes("price") || m.includes("cost") || m.includes("how much")) {
    if (servicesText) return `Here are our services & prices 💰\n\n${servicesText}\n\nWant to book? Just let me know! 😊`
    return `I'll share the latest prices with you right away 🙌`
  }
  if (intent.type === "location" || m.includes("location") || m.includes("address") || m.includes("where")) {
    if (location && mapsLink) return `📍 We're at ${location}\n\nGoogle Maps: ${mapsLink}\n\nSee you soon! 😊`
    if (location)             return `📍 We're at ${location}\n\nWould you like to book?`
    return `I'll share our location shortly! 📍`
  }
  if (intent.type === "booking" || m.includes("book") || m.includes("appointment")) {
    if (bookingState.service && !bookingState.date)                      return `Sure! 📅 What date works for your ${bookingState.service}?`
    if (bookingState.service && bookingState.date && !bookingState.time) return `Almost there! What time works for you? ⏰`
    return `I'd love to help you book! 📅\n\nWhat service, date & time works best for you?`
  }
  if (m.match(/(thank|thanks|ok|okay|great|perfect|good|noted|done|alright|👍)/)) return `You're most welcome! 😊 Looking forward to seeing you at ${businessName}! 🙌`
  if (m.includes("speak") || m.includes("human") || m.includes("owner") || m.includes("manager")) return `Of course! 🙌 I'll notify our team and someone will reach out to you shortly.`
  return `Thanks for reaching out to ${businessName}! 😊\n\nHow can I help?\n📅 Book appointment\n💰 Services & prices\n📍 Our location`
}

async function sendWhatsAppMessage({ phoneNumberId, accessToken, toNumber, message }) {
  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method:  "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body:    JSON.stringify({ messaging_product: "whatsapp", to: toNumber, type: "text", text: { body: message, preview_url: false } })
    })
    const data = await res.json()
    if (data.error) console.error("❌ WhatsApp send error:", data.error)
    return data
  } catch (err) {
    console.error("❌ Failed to send WhatsApp:", err.message)
    return {}
  }
}
