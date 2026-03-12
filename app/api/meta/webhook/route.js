import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ── GET: Meta webhook verification ──
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

// ── POST: Receive WhatsApp messages ──
export async function POST(req) {
  try {
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
      if (messageType === "text")        messageText = message.text?.body || ""
      else if (messageType === "button") messageText = message.button?.text || ""
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
      const { error: msgErr } = await supabaseAdmin.from("messages").insert({
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
      if (msgErr) console.error("Message insert error:", msgErr.message)

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
      const [{ data: knowledgeRows }, { data: bizSettings }, { data: history }, { data: servicesList }] = await Promise.all([
        supabaseAdmin.from("business_knowledge").select("category,content").eq("user_id", userId),
        supabaseAdmin.from("business_settings").select("*").eq("user_id", userId).maybeSingle(),
        supabaseAdmin.from("messages").select("message_text,direction,is_ai")
          .eq("conversation_id", conversation?.id)
          .order("created_at", { ascending: false })
          .limit(12),
        supabaseAdmin.from("services").select("name,price").eq("user_id", userId)
      ])

      const knowledge = {}
      ;(knowledgeRows || []).forEach(r => { knowledge[r.category] = r.content })

      const conversationHistory = (history || []).reverse().map(m => ({
        role:    m.direction === "inbound" ? "user" : "assistant",
        content: (m.message_text || "").trim()
      })).filter(m => m.content)

      // ── 7. DETECT BOOKING STATE from conversation history ──
      const bookingState = detectBookingState(conversationHistory, messageText)
      console.log("📋 Booking state:", JSON.stringify(bookingState))

      // ── 8. IF BOOKING IS CONFIRMED → CREATE IT ──
      if (bookingState.readyToBook) {
        console.log("✅ All booking details collected — creating booking!")

        const bookingDate = bookingState.date || new Date().toISOString().split("T")[0]
        const bookingTime = bookingState.time || null
        const serviceName = bookingState.service || "Appointment"

        // Find service price
        const matchedService = (servicesList || []).find(s =>
          s.name.toLowerCase().includes(serviceName.toLowerCase()) ||
          serviceName.toLowerCase().includes(s.name.toLowerCase())
        )
        const amount = matchedService?.price || 0

        // Insert booking
        const { data: newBooking, error: bookErr } = await supabaseAdmin
          .from("bookings")
          .insert({
            user_id:        userId,
            customer_name:  contactName,
            customer_phone: formattedPhone,
            customer_id:    customer?.id || null,
            service:        serviceName,
            booking_date:   bookingDate,
            booking_time:   bookingTime,
            amount:         amount,
            status:         "confirmed",
            ai_booked:      true,
            created_at:     new Date().toISOString()
          })
          .select().single()

        if (bookErr) {
          console.error("❌ Booking insert error:", bookErr.message)
        } else {
          console.log("✅ Booking created:", newBooking.id)
          // Update conversation to show booking confirmed
          await supabaseAdmin.from("conversations")
            .update({ last_message: `✅ *Booking Confirmed!* 📋 Service: ${serviceName}` })
            .eq("id", conversation?.id)
        }

        // Send confirmation reply
        const confirmReply = buildConfirmationMessage(serviceName, bookingDate, bookingTime, bizSettings?.business_name || "our salon")

        await sendWhatsAppMessage({
          phoneNumberId,
          accessToken: connection.access_token,
          toNumber: fromNumber,
          message: confirmReply
        })

        await supabaseAdmin.from("messages").insert({
          user_id:         userId,
          phone_number_id: phoneNumberId,
          from_number:     phoneNumberId,
          message_text:    confirmReply,
          direction:       "outbound",
          conversation_id: conversation?.id || null,
          customer_phone:  formattedPhone,
          message_type:    "text",
          status:          "sent",
          is_ai:           true,
          created_at:      new Date().toISOString()
        })

        await supabaseAdmin.from("conversations")
          .update({ last_message: confirmReply, last_message_at: new Date().toISOString() })
          .eq("id", conversation?.id)

        continue
      }

      // ── 9. GENERATE AI REPLY ──
      const aiReply = await generateAIReply({
        customerMessage: messageText,
        knowledge, bizSettings,
        history: conversationHistory,
        customerName: contactName,
        bookingState
      })

      // ── 10. SEND REPLY VIA WHATSAPP ──
      const sendResult = await sendWhatsAppMessage({
        phoneNumberId,
        accessToken: connection.access_token,
        toNumber: fromNumber,
        message: aiReply
      })
      console.log("📤 Sent reply:", aiReply.substring(0, 80))

      // ── 11. SAVE OUTBOUND MESSAGE ──
      await supabaseAdmin.from("messages").insert({
        user_id:         userId,
        phone_number_id: phoneNumberId,
        from_number:     phoneNumberId,
        message_text:    aiReply,
        direction:       "outbound",
        conversation_id: conversation?.id || null,
        customer_phone:  formattedPhone,
        message_type:    "text",
        status:          "sent",
        is_ai:           true,
        wa_message_id:   sendResult?.messages?.[0]?.id || null,
        created_at:      new Date().toISOString()
      })

      // ── 12. UPDATE CONVERSATION ──
      await supabaseAdmin.from("conversations")
        .update({ last_message: aiReply, last_message_at: new Date().toISOString() })
        .eq("id", conversation?.id)
    }

    return NextResponse.json({ status: "ok" }, { status: 200 })
  } catch (err) {
    console.error("❌ Webhook fatal error:", err)
    return NextResponse.json({ status: "error", message: err.message }, { status: 200 })
  }
}

// ── DETECT BOOKING STATE from conversation ──
function detectBookingState(history, latestMessage) {
  const state = { service: null, date: null, time: null, readyToBook: false }

  // Combine all messages into one searchable string (last 10 messages)
  const allText = [...history.map(m => m.content), latestMessage].join(" ").toLowerCase()
  const latestLower = latestMessage.toLowerCase()

  // ── Extract SERVICE ──
  const serviceKeywords = [
    "haircut", "hair cut", "hair color", "colour", "coloring", "facial", "cleanup",
    "bleach", "waxing", "threading", "manicure", "pedicure", "spa", "massage",
    "keratin", "smoothening", "rebonding", "highlights", "balayage", "trim",
    "shave", "beard", "bridal", "makeup", "mehendi", "henna", "eyebrow",
    "hair wash", "blow dry", "hair spa", "dandruff", "treatment"
  ]
  for (const kw of serviceKeywords) {
    if (allText.includes(kw)) { state.service = kw; break }
  }

  // ── Extract DATE ──
  const today = new Date()
  const todayStr = today.toISOString().split("T")[0]

  // "today"
  if (latestLower.includes("today") || allText.includes("today")) {
    state.date = todayStr
  }
  // "tomorrow"
  else if (latestLower.includes("tomorrow") || latestLower.includes("kal") || allText.includes("tomorrow")) {
    const tom = new Date(today); tom.setDate(tom.getDate() + 1)
    state.date = tom.toISOString().split("T")[0]
  }
  // day names
  else {
    const days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"]
    for (let i = 0; i < days.length; i++) {
      if (allText.includes(days[i])) {
        const diff = (i - today.getDay() + 7) % 7 || 7
        const d = new Date(today); d.setDate(d.getDate() + diff)
        state.date = d.toISOString().split("T")[0]
        break
      }
    }
  }
  // explicit date like "12-03" or "12/3" or "march 12" or "12 march"
  if (!state.date) {
    const monthNames = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"]
    for (let i = 0; i < monthNames.length; i++) {
      const re = new RegExp(`(\\d{1,2})\\s*${monthNames[i]}|${monthNames[i]}\\s*(\\d{1,2})`)
      const m = allText.match(re)
      if (m) {
        const day = parseInt(m[1] || m[2])
        const year = today.getFullYear()
        state.date = `${year}-${String(i+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`
        break
      }
    }
  }
  // "DD/MM" or "DD-MM"
  if (!state.date) {
    const m = allText.match(/(\d{1,2})[\/\-](\d{1,2})/)
    if (m) {
      const year = today.getFullYear()
      state.date = `${year}-${String(m[2]).padStart(2,"0")}-${String(m[1]).padStart(2,"0")}`
    }
  }

  // ── Extract TIME ──
  const timeMatch = allText.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
  if (timeMatch) {
    let hour = parseInt(timeMatch[1])
    const min = timeMatch[2] ? timeMatch[2] : "00"
    const ampm = timeMatch[3]?.toLowerCase()
    if (ampm === "pm" && hour < 12) hour += 12
    if (ampm === "am" && hour === 12) hour = 0
    if (hour >= 7 && hour <= 21) {
      state.time = `${String(hour).padStart(2,"0")}:${min}`
    }
  }

  // ── Check if CONFIRMED (customer said yes/confirm/ok after AI asked) ──
  const confirmWords = ["yes","yeah","ok","okay","sure","confirm","correct","right","haan","ha","ji","theek","done","book it","go ahead","please book","book karo","please","book"]
  const isConfirming = confirmWords.some(w => latestLower.trim() === w || latestLower.trim().startsWith(w + " ") || latestLower.trim().endsWith(" " + w))

  // Check if AI previously sent a confirmation summary (contains "Booked" or "confirm" in last AI message)
  const lastAiMsg = [...history].reverse().find(m => m.role === "assistant")
  const aiAskedToConfirm = lastAiMsg && (
    lastAiMsg.content.toLowerCase().includes("shall i book") ||
    lastAiMsg.content.toLowerCase().includes("confirm") ||
    lastAiMsg.content.toLowerCase().includes("shall i confirm") ||
    lastAiMsg.content.toLowerCase().includes("want me to book") ||
    lastAiMsg.content.toLowerCase().includes("book you for") ||
    lastAiMsg.content.toLowerCase().includes("booking for")
  )

  // Ready to book if: service + date + time all present AND customer confirmed
  if (state.service && state.date && state.time && isConfirming) {
    state.readyToBook = true
  }
  // Also ready if: service + date + time all present AND AI had already asked to confirm
  if (state.service && state.date && state.time && isConfirming && aiAskedToConfirm) {
    state.readyToBook = true
  }

  return state
}

function buildConfirmationMessage(service, date, time, businessName) {
  const formattedDate = date ? new Date(date + "T12:00:00").toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" }) : date
  return [
    "✅ *Booking Confirmed!*",
    "",
    `📋 Service: ${service}`,
    `📅 Date: ${formattedDate || date}`,
    time ? `⏰ Time: ${time}` : "",
    "",
    `See you soon at ${businessName}! 😊`
  ].filter(l => l !== undefined && l !== null && !(l === "" && false)).join("\n").replace(/\n{3,}/g, "\n\n")
}

async function generateAIReply({ customerMessage, knowledge, bizSettings, history, customerName, bookingState }) {
  const firstName    = customerName?.split(" ")[0] || "there"
  const businessName = bizSettings?.business_name || (knowledge?.business_info?.match(/Business:\s*(.+)/)?.[1]) || "our salon"
  const businessType = bizSettings?.business_type || "salon"
  const location     = bizSettings?.location || (knowledge?.business_info?.match(/Location:\s*(.+)/)?.[1]) || ""
  const mapsLink     = bizSettings?.maps_link || (knowledge?.business_info?.match(/Maps:\s*(.+)/)?.[1]) || ""
  const servicesText = knowledge?.services || ""
  const aiInstructions = bizSettings?.ai_instructions || ""
  const greetingStyle  = bizSettings?.greeting_message || ""
  const aiLanguage     = bizSettings?.ai_language || "English"

  // Build booking context hint for AI
  let bookingHint = ""
  if (bookingState.service || bookingState.date || bookingState.time) {
    const collected = []
    if (bookingState.service) collected.push(`service: ${bookingState.service}`)
    if (bookingState.date)    collected.push(`date: ${bookingState.date}`)
    if (bookingState.time)    collected.push(`time: ${bookingState.time}`)
    const missing = []
    if (!bookingState.service) missing.push("which service")
    if (!bookingState.date)    missing.push("preferred date")
    if (!bookingState.time)    missing.push("preferred time")
    bookingHint = `\nCURRENT BOOKING STATE: Collected so far — ${collected.join(", ")}. ${missing.length ? `Still need: ${missing.join(", ")}.` : "All details collected — ask customer to confirm!"}`
  }

  const systemPrompt = `You are a smart, warm WhatsApp assistant for ${businessName} — a ${businessType}${location ? ` located in ${location}` : ""}.

Your mission: Convert every inquiry into a booking. Be helpful, friendly, and concise.

${servicesText ? `SERVICES & PRICES:\n${servicesText}\n` : "No services listed yet — tell customers to call for pricing."}
${location ? `ADDRESS: ${location}` : ""}
${mapsLink ? `MAPS LINK: ${mapsLink}` : ""}
${knowledge?.business_info ? `\nBUSINESS INFO:\n${knowledge.business_info}` : ""}
${aiInstructions ? `\nSPECIAL INSTRUCTIONS:\n${aiInstructions}` : ""}
${bookingHint}

BOOKING FLOW (follow strictly):
1. When customer wants to book → collect: service name, date, time (one question at a time)
2. Once you have all 3 → summarize and ask: "Shall I confirm booking for [service] on [date] at [time]? ✅"
3. When customer says yes/confirm → reply ONLY: "Great! Booking confirmed! ✅"
4. System will auto-save the booking to database

RULES:
- Keep replies SHORT — max 3-4 lines on WhatsApp
- Use 1-2 emojis naturally
- Address customer as ${firstName} occasionally  
- Respond in ${aiLanguage} (if customer writes in Telugu/Hindi, reply in same language)
- For pricing: give prices directly from the services list
- For location: share address${mapsLink ? ` and maps link: ${mapsLink}` : ""}
- Never make up services, prices, or info not listed above
${greetingStyle ? `\nGreeting style: "${greetingStyle}"` : ""}`

  // ── 1. Try Sarvam AI ──
  if (process.env.SARVAM_API_KEY) {
    try {
      console.log("🔄 Trying Sarvam AI...")
      const sarvamMessages = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: customerMessage }
      ]
      const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-subscription-key": process.env.SARVAM_API_KEY },
        body: JSON.stringify({ model: "sarvam-m", messages: sarvamMessages, max_tokens: 300, temperature: 0.7 }),
      })
      const raw = await response.text()
      const data = JSON.parse(raw)
      if (data?.choices?.[0]?.message?.content) {
        let reply = data.choices[0].message.content.trim()
        reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, "").trim()
        reply = reply.replace(/<think>[\s\S]*/gi, "").trim()
        if (reply) {
          console.log("✅ Sarvam replied:", reply.substring(0, 80))
          return reply
        }
      }
      console.error("Sarvam bad response:", JSON.stringify(data).substring(0, 300))
    } catch (err) {
      console.error("Sarvam API error:", err.message)
    }
  }

  // ── 2. Try Claude ──
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-haiku-20240307", max_tokens: 300, system: systemPrompt, messages: [...history, { role: "user", content: customerMessage }] }),
      })
      const data = await response.json()
      if (data?.content?.[0]?.text) {
        console.log("✅ Claude replied")
        return data.content[0].text.trim()
      }
    } catch (err) {
      console.error("Claude API error:", err.message)
    }
  }

  // ── 3. Smart fallback ──
  return smartFallback(customerMessage, businessName, servicesText, firstName, location, mapsLink, bookingState)
}

function smartFallback(msg, businessName, servicesText, firstName, location, mapsLink, bookingState) {
  const m = msg.toLowerCase().trim()

  if (m.match(/^(hi|hello|hey|hii|helo|hai|hiya|gm|good morning|good afternoon|good evening|namaste|నమస్కారం|నమస్తే)[\\s!.]*$/)) {
    return `Hi ${firstName}! 👋 Welcome to ${businessName}!\n\nHow can I help you today? 😊\n✂️ Book appointment\n💰 Prices & services\n📍 Location & timings`
  }
  if (m.includes("book") || m.includes("appointment") || m.includes("slot") || m.includes("availab") || m.includes("schedule") || m.includes("cheyandi") || m.includes("kavali")) {
    if (bookingState?.service && !bookingState?.date) return `Sure! 📅 What date works for you for the ${bookingState.service}?`
    if (bookingState?.service && bookingState?.date && !bookingState?.time) return `What time would you prefer? ⏰`
    return `I'd love to help you book! 📅\n\nWhich service are you looking for, and what date & time works best for you?`
  }
  if (m.includes("price") || m.includes("cost") || m.includes("rate") || m.includes("how much") || m.includes("charges") || m.includes("kitna") || m.includes("ekkuva") || m.includes("entha")) {
    if (servicesText) return `Here are our services & prices 💰\n\n${servicesText}\n\nWant to book? Just let me know! 😊`
    return `I'll have our team share the latest prices with you right away 🙌`
  }
  if (m.includes("time") || m.includes("open") || m.includes("hours") || m.includes("timing") || m.includes("close")) {
    return `We're open Monday–Saturday, 9 AM to 7 PM 🕐\n\nWould you like to book a slot?`
  }
  if (m.includes("location") || m.includes("address") || m.includes("where") || m.includes("direction")) {
    if (location && mapsLink) return `📍 We're at ${location}\n\nGoogle Maps: ${mapsLink}\n\nSee you soon! 😊`
    if (location) return `📍 We're at ${location}\n\nWould you like to book an appointment?`
    return `I'll share our location with you shortly! 📍`
  }
  if (m.match(/(thank|thanks|ok|okay|great|perfect|good|noted|sure|done|alright|thx|👍|धन्यवाद|థాంక్యూ)/)) {
    return `You're most welcome! 😊\n\nLooking forward to seeing you at ${businessName}! Let us know if you need anything else 🙌`
  }
  if (m.includes("speak") || m.includes("human") || m.includes("owner") || m.includes("manager") || m.includes("call me")) {
    return `Of course! 🙌 I'll notify our team right away and someone will reach out to you shortly.`
  }
  return `Thanks for reaching out to ${businessName}! 😊\n\nHow can I help you today?\n✂️ Services & prices\n📅 Book appointment\n📍 Our location`
}

async function sendWhatsAppMessage({ phoneNumberId, accessToken, toNumber, message }) {
  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: toNumber, type: "text", text: { body: message, preview_url: false } })
    })
    const data = await res.json()
    if (data.error) console.error("❌ WhatsApp send error:", data.error)
    return data
  } catch (err) {
    console.error("❌ Failed to send WhatsApp:", err.message)
    return {}
  }
}
