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

    // Status updates (delivered/read) — return ok, don't process
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
      const fromNumber    = message.from
      const messageType   = message.type
      const timestamp     = new Date(parseInt(message.timestamp) * 1000).toISOString()
      const contact       = contacts.find(c => c.wa_id === fromNumber)
      const contactName   = contact?.profile?.name || "Customer"
      const formattedPhone = "+" + fromNumber

      // Extract text from all message types
      let messageText = ""
      if (messageType === "text")        messageText = message.text?.body || ""
      else if (messageType === "button") messageText = message.button?.text || ""
      else if (messageType === "interactive") {
        messageText = message.interactive?.button_reply?.title
          || message.interactive?.list_reply?.title || ""
      }

      console.log(`📩 [${phoneNumberId}] From ${fromNumber} (${contactName}): "${messageText}"`)

      // ── Find which business owns this WhatsApp number ──
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
          .insert({ user_id:userId, phone:formattedPhone, name:contactName, source:"whatsapp", tag:"new_lead", created_at:timestamp })
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
        .maybeSingle() // Don't filter by status — find ANY conversation for this number

      if (existingConvo) {
        const { data: updatedConvo } = await supabaseAdmin
          .from("conversations")
          .update({
            last_message:    messageText || "[media]",
            last_message_at: timestamp,
            unread_count:    (existingConvo.unread_count || 0) + 1,
            customer_id:     customer?.id || existingConvo.customer_id,
            status:          "open" // Reopen if it was resolved
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
        content:         messageText || "[media message]",
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
          // New customer = new lead
          await supabaseAdmin.from("leads").insert({
            user_id:userId, customer_id:customer.id, phone:formattedPhone,
            name:contactName, source:"whatsapp", status:"open",
            last_message:messageText, last_message_at:timestamp,
            ai_score:60, estimated_value:600
          }).catch(e => console.warn("Lead insert warn:", e.message))
        } else if (existingCustomer) {
          // Update existing open lead
          await supabaseAdmin.from("leads")
            .update({ last_message:messageText, last_message_at:timestamp })
            .eq("customer_id", existingCustomer.id).eq("status","open")
            .catch(() => {})
        }
      }

      // ── 5. CHECK AI ENABLED ──
      if (conversation?.ai_enabled === false) {
        console.log("AI disabled for this conversation — skipping reply")
        continue
      }

      // Skip AI for non-text messages
      if (!messageText) {
        console.log("Non-text message — skipping AI reply")
        continue
      }

      // ── 6. GET BUSINESS DATA ──
      const [{ data: knowledgeRows }, { data: bizSettings }, { data: history }] = await Promise.all([
        supabaseAdmin.from("business_knowledge").select("category,content").eq("user_id", userId),
        supabaseAdmin.from("business_settings").select("*").eq("user_id", userId).maybeSingle(),
        supabaseAdmin.from("messages").select("content,message_text,direction,is_ai")
          .eq("conversation_id", conversation?.id)
          .order("created_at", { ascending: false })
          .limit(10)
      ])

      const knowledge = {}
      ;(knowledgeRows || []).forEach(r => { knowledge[r.category] = r.content })

      const conversationHistory = (history || []).reverse().map(m => ({
        role:    m.direction === "inbound" ? "user" : "assistant",
        content: (m.content || m.message_text || "").trim()
      })).filter(m => m.content)

      // ── 7. GENERATE AI REPLY ──
      const aiReply = await generateAIReply({
        customerMessage: messageText,
        knowledge, bizSettings,
        history: conversationHistory,
        customerName: contactName
      })

      // ── 8. SEND REPLY VIA WHATSAPP ──
      const sendResult = await sendWhatsAppMessage({
        phoneNumberId,
        accessToken: connection.access_token,
        toNumber: fromNumber,
        message: aiReply
      })
      console.log("📤 Sent reply:", aiReply.substring(0, 80))

      // ── 9. SAVE OUTBOUND MESSAGE ──
      await supabaseAdmin.from("messages").insert({
        user_id:         userId,
        phone_number_id: phoneNumberId,
        from_number:     phoneNumberId,
        message_text:    aiReply,
        content:         aiReply,
        direction:       "outbound",
        conversation_id: conversation?.id || null,
        customer_phone:  formattedPhone,
        message_type:    "text",
        status:          "sent",
        is_ai:           true,
        wa_message_id:   sendResult?.messages?.[0]?.id || null,
        created_at:      new Date().toISOString()
      })

      // ── 10. UPDATE CONVERSATION with last AI reply ──
      await supabaseAdmin.from("conversations")
        .update({ last_message:aiReply, last_message_at:new Date().toISOString() })
        .eq("id", conversation?.id)
    }

    return NextResponse.json({ status: "ok" }, { status: 200 })
  } catch (err) {
    console.error("❌ Webhook fatal error:", err)
    return NextResponse.json({ status: "error", message: err.message }, { status: 200 })
  }
}

// ─────────────────────────────────────────
// GENERATE AI REPLY
// ─────────────────────────────────────────
async function generateAIReply({ customerMessage, knowledge, bizSettings, history, customerName }) {
  const firstName    = customerName?.split(" ")[0] || "there"

  // Pull business name from settings OR knowledge base (set up in Settings page)
  const businessName = bizSettings?.business_name
    || (knowledge?.business_info?.match(/Business:\s*(.+)/)?.[1])
    || "our salon"

  const businessType   = bizSettings?.business_type || "salon"
  const location       = bizSettings?.location || (knowledge?.business_info?.match(/Location:\s*(.+)/)?.[1]) || ""
  const mapsLink       = bizSettings?.maps_link || (knowledge?.business_info?.match(/Maps:\s*(.+)/)?.[1]) || ""
  const servicesText   = knowledge?.services || ""
  const aiInstructions = bizSettings?.ai_instructions || ""
  const greetingStyle  = bizSettings?.greeting_message || ""
  const aiLanguage     = bizSettings?.ai_language || "English"

  const systemPrompt = `You are a smart, warm WhatsApp assistant for ${businessName} — a ${businessType}${location ? ` located in ${location}` : ""}.

Your mission: Convert every inquiry into a booking. Be helpful, friendly, and concise.

${servicesText ? `SERVICES & PRICES:\n${servicesText}\n` : "No services listed yet — tell customers to call for pricing."}
${location ? `ADDRESS: ${location}` : ""}
${mapsLink ? `MAPS LINK: ${mapsLink}` : ""}
${knowledge?.business_info ? `\nBUSINESS INFO:\n${knowledge.business_info}` : ""}
${aiInstructions ? `\nSPECIAL INSTRUCTIONS:\n${aiInstructions}` : ""}

RULES (follow strictly):
- Keep replies SHORT — max 3-4 lines on WhatsApp
- Use 1-2 emojis naturally — don't spam them
- Address customer as ${firstName} occasionally
- Respond in ${aiLanguage} (if customer writes in Hindi/Tamil/Telugu, reply in same language)
- For booking requests: ask service + preferred date + preferred time
- When customer confirms a booking: say exactly "Great! ✅ I've booked you for [service] on [date] at [time]. See you at ${businessName}! 😊"
- For pricing questions: give prices directly from the list above
- For location: share the address${mapsLink ? ` and maps link: ${mapsLink}` : ""}
- If customer asks for human/owner: "Of course! I'll notify our team and they'll call you shortly 🙌"
- Never make up services, prices, or information not listed above
- If asked something you don't know: "I'll check that and our team will confirm shortly 🙌"
${greetingStyle ? `\nWhen greeting new customers, use this style: "${greetingStyle}"` : ""}`

  // Try Claude API first
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type":      "application/json",
          "x-api-key":         process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model:      "claude-haiku-20240307", // Fast + cheap for WhatsApp replies
          max_tokens: 300,
          system:     systemPrompt,
          messages:   [...history, { role: "user", content: customerMessage }],
        }),
      })
      const data = await response.json()
      if (data?.content?.[0]?.text) {
        return data.content[0].text.trim()
      }
      console.error("Claude unexpected response:", JSON.stringify(data).substring(0, 200))
    } catch (err) {
      console.error("Claude API error:", err.message)
    }
  } else {
    console.warn("⚠️ ANTHROPIC_API_KEY not set — using smart fallback replies")
  }

  // Smart fallback (when no Claude key or Claude fails)
  return smartFallback(customerMessage, businessName, servicesText, firstName, location, mapsLink)
}

// ─────────────────────────────────────────
// SMART FALLBACK REPLIES
// ─────────────────────────────────────────
function smartFallback(msg, businessName, servicesText, firstName, location, mapsLink) {
  const m = msg.toLowerCase().trim()

  // Greeting
  if (m.match(/^(hi|hello|hey|hii|helo|hai|hiya|gm|good morning|good afternoon|good evening|namaste|नमस्ते)[\s!.]*$/)) {
    return `Hi ${firstName}! 👋 Welcome to ${businessName}!\n\nHow can I help you today? 😊\n✂️ Book appointment\n💰 Prices & services\n📍 Location & timings`
  }
  // Booking intent
  if (m.includes("book") || m.includes("appointment") || m.includes("slot") || m.includes("availab") || m.includes("schedule")) {
    return `I'd love to help you book! 📅\n\nWhich service are you looking for, and what date & time works best for you?`
  }
  // Price inquiry
  if (m.includes("price") || m.includes("cost") || m.includes("rate") || m.includes("how much") || m.includes("charges") || m.includes("kitna")) {
    if (servicesText) return `Here are our services & prices 💰\n\n${servicesText}\n\nWant to book? Just let me know! 😊`
    return `I'll have our team share the latest prices with you right away 🙌`
  }
  // Timings
  if (m.includes("time") || m.includes("open") || m.includes("hours") || m.includes("timing") || m.includes("close") || m.includes("kab")) {
    return `We're open Monday–Saturday, 9 AM to 7 PM 🕐\n\nWould you like to book a slot?`
  }
  // Location
  if (m.includes("location") || m.includes("address") || m.includes("where") || m.includes("kahan") || m.includes("direction")) {
    if (location && mapsLink) return `📍 We're at ${location}\n\nGoogle Maps: ${mapsLink}\n\nSee you soon! 😊`
    if (location) return `📍 We're at ${location}\n\nWould you like to book an appointment?`
    return `I'll share our location with you shortly! Our team will send the address 📍`
  }
  // Cancel/reschedule
  if (m.includes("cancel") || m.includes("reschedule") || m.includes("change appointment")) {
    return `No problem! I'll note your request 🙌\n\nOur team will reach out to reschedule your appointment. What date works better for you?`
  }
  // Thanks/confirmation
  if (m.match(/(thank|thanks|ok|okay|great|perfect|good|noted|sure|done|alright|thx|👍)/)) {
    return `You're most welcome! 😊\n\nLooking forward to seeing you at ${businessName}! Let us know if you need anything else 🙌`
  }
  // Human request
  if (m.includes("speak") || m.includes("human") || m.includes("owner") || m.includes("manager") || m.includes("call me")) {
    return `Of course! 🙌 I'll notify our team right away and someone will reach out to you shortly.\n\nThank you for your patience! 😊`
  }

  // Default
  return `Thanks for reaching out to ${businessName}! 😊\n\nHow can I help you today? You can ask about:\n✂️ Services & prices\n📅 Book appointment\n📍 Our location`
}

// ─────────────────────────────────────────
// SEND WHATSAPP MESSAGE
// ─────────────────────────────────────────
async function sendWhatsAppMessage({ phoneNumberId, accessToken, toNumber, message }) {
  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type":  "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to:   toNumber,
        type: "text",
        text: { body: message, preview_url: false }
      })
    })
    const data = await res.json()
    if (data.error) console.error("❌ WhatsApp send error:", data.error)
    return data
  } catch (err) {
    console.error("❌ Failed to send WhatsApp:", err.message)
    return {}
  }
}
