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

// ── POST: Receive and reply to WhatsApp messages ──
export async function POST(req) {
  try {
    const body = await req.json()

    if (!body?.entry?.[0]?.changes?.[0]?.value?.messages) {
      return NextResponse.json({ status: "no_message" }, { status: 200 })
    }

    const value         = body.entry[0].changes[0].value
    const phoneNumberId = value?.metadata?.phone_number_id
    const messages      = value?.messages || []
    const contacts      = value?.contacts || []

    for (const message of messages) {
      const fromNumber  = message.from
      const messageText = message.text?.body || ""
      const messageType = message.type
      const timestamp   = new Date(parseInt(message.timestamp) * 1000).toISOString()

      const contact        = contacts.find(c => c.wa_id === fromNumber)
      const contactName    = contact?.profile?.name || "Unknown"
      const formattedPhone = "+" + fromNumber

      if (messageType !== "text" || !messageText) continue

      console.log(`📩 From ${fromNumber} (${contactName}): ${messageText}`)

      // ── Find which business owns this phone number ──
      const { data: connection } = await supabaseAdmin
        .from("whatsapp_connections")
        .select("user_id, access_token")
        .eq("phone_number_id", phoneNumberId)
        .single()

      if (!connection) {
        console.log("No connection found for phoneNumberId:", phoneNumberId)
        continue
      }

      // ── 1. UPSERT CUSTOMER ──
      let customer = null
      const { data: existingCustomer } = await supabaseAdmin
        .from("customers")
        .select("*")
        .eq("phone", formattedPhone)
        .single()

      if (existingCustomer) {
        customer = existingCustomer
      } else {
        const { data: newCustomer } = await supabaseAdmin
          .from("customers")
          .insert({ phone: formattedPhone, name: contactName, source: "whatsapp", tag: "new_lead" })
          .select().single()
        customer = newCustomer
        console.log(`✅ New customer: ${contactName}`)
      }

      // ── 2. UPSERT CONVERSATION ──
      let conversation = null
      const { data: existingConvo } = await supabaseAdmin
        .from("conversations")
        .select("*")
        .eq("phone", formattedPhone)
        .eq("status", "open")
        .single()

      if (existingConvo) {
        const { data: updatedConvo } = await supabaseAdmin
          .from("conversations")
          .update({ last_message: messageText, last_message_at: timestamp, unread_count: existingConvo.unread_count + 1 })
          .eq("id", existingConvo.id)
          .select().single()
        conversation = updatedConvo
      } else {
        const { data: newConvo } = await supabaseAdmin
          .from("conversations")
          .insert({ customer_id: customer?.id || null, phone: formattedPhone, status: "open", ai_enabled: true, last_message: messageText, last_message_at: timestamp, unread_count: 1 })
          .select().single()
        conversation = newConvo
        console.log(`✅ New conversation created`)
      }

      // ── 3. SAVE INBOUND MESSAGE ──
      await supabaseAdmin.from("messages").insert({
        user_id:         connection.user_id,
        phone_number_id: phoneNumberId,
        from_number:     fromNumber,
        message_text:    messageText,
        direction:       "inbound",
        conversation_id: conversation?.id || null,
        customer_phone:  formattedPhone,
        message_type:    "text",
        status:          "delivered",
        is_ai:           false,
        created_at:      timestamp
      })

      // ── 4. CREATE LEAD (new customers only) ──
      if (!existingCustomer && customer) {
        await supabaseAdmin.from("leads").insert({
          customer_id: customer.id, phone: formattedPhone, name: contactName,
          source: "whatsapp", status: "open", last_message: messageText,
          last_message_at: timestamp, ai_score: 60, score_intent: 60,
          score_recency: 80, score_source: 60, score_touchpoints: 40, days_inactive: 0
        })
        console.log(`✅ Lead created: ${contactName}`)
      }

      // ── 5. GET BUSINESS KNOWLEDGE ──
      const { data: knowledge } = await supabaseAdmin
        .from("business_knowledge")
        .select("*")
        .eq("user_id", connection.user_id)
        .single()

      // ── 6. GET LAST 5 MESSAGES FOR CONTEXT ──
      const { data: history } = await supabaseAdmin
        .from("messages")
        .select("message_text, direction")
        .eq("user_id", connection.user_id)
        .eq("from_number", fromNumber)
        .order("created_at", { ascending: false })
        .limit(5)

      const conversationHistory = (history || []).reverse().map(m => ({
        role:    m.direction === "inbound" ? "user" : "assistant",
        content: m.message_text
      }))

      // ── 7. GENERATE & SEND AI REPLY ──
      if (conversation?.ai_enabled !== false) {
        const aiReply = await generateAIReply({
          customerMessage: messageText,
          knowledge,
          history: conversationHistory,
          customerName: contactName
        })

        await sendWhatsAppReply({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: aiReply })

        await supabaseAdmin.from("messages").insert({
          user_id:         connection.user_id,
          phone_number_id: phoneNumberId,
          from_number:     fromNumber,
          message_text:    aiReply,
          direction:       "outbound",
          conversation_id: conversation?.id || null,
          customer_phone:  formattedPhone,
          message_type:    "text",
          status:          "sent",
          is_ai:           true,
          created_at:      new Date().toISOString()
        })

        console.log("🤖 AI Reply sent:", aiReply)
      }
    }

    return NextResponse.json({ status: "ok" }, { status: 200 })
  } catch (err) {
    console.error("Webhook error:", err)
    return NextResponse.json({ status: "error" }, { status: 200 })
  }
}

// ── AI Reply using Claude ──
async function generateAIReply({ customerMessage, knowledge, history, customerName }) {
  try {
    const firstName = customerName?.split(" ")[0] || "there"
    const businessContext = knowledge
      ? `You are a friendly assistant for ${knowledge.business_name}, a ${knowledge.business_type} in ${knowledge.location}.

SERVICES AND PRICING:
${knowledge.services}

WORKING HOURS:
${knowledge.working_hours}

RULES:
- Reply in warm, friendly, human tone
- Address customer by first name (${firstName}) when appropriate
- Keep replies short (max 3-4 lines)
- Use 1-2 emojis naturally
- Never make up prices or services not listed
- If unsure: "Let me check that! Our team will get back to you shortly 🙌"
- If customer wants human: "Sure! Our team will reach out shortly 🙌"`
      : `You are a friendly business assistant. Keep replies short. If unsure say: "Our team will get back to you shortly 🙌"`

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-haiku-20240307",
        max_tokens: 300,
        system:     businessContext,
        messages:   [...history, { role: "user", content: customerMessage }],
      }),
    })

    const data = await response.json()
    if (data?.content?.[0]?.text) return data.content[0].text
    return fallbackReply(customerMessage, knowledge, firstName)

  } catch (err) {
    console.error("Claude API error:", err)
    return "Thanks for reaching out! Our team will get back to you shortly 🙌"
  }
}

// ── Fallback when Claude API not available ──
function fallbackReply(msg, knowledge, firstName) {
  const businessName = knowledge?.business_name || "us"
  const m = msg.toLowerCase().trim()
  if (m.match(/^(hi|hello|hey|hii|helo|hai)$/))
    return `Hi ${firstName}! 👋 Welcome to ${businessName}! How can I help?\n\n💅 Book an appointment\n💰 Check prices\n⏰ Our timings`
  if (m.includes("book") || m.includes("appointment") || m.includes("slot"))
    return `I'd love to book you in! 📅 What service and date works for you?`
  if (m.includes("price") || m.includes("cost") || m.includes("rate"))
    return knowledge?.services ? `Here are our services:\n\n${knowledge.services}\n\nWould you like to book?` : `Our team will share pricing shortly 🙌`
  if (m.includes("time") || m.includes("open") || m.includes("hours"))
    return knowledge?.working_hours ? `We're open ${knowledge.working_hours} 🕐\n\nBook a slot?` : `Our team will share timings shortly 🙌`
  return `Thanks for reaching out to ${businessName}! 😊 Our team will get back to you shortly 🙌`
}

// ── Send WhatsApp Message ──
async function sendWhatsAppReply({ phoneNumberId, accessToken, toNumber, message }) {
  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: toNumber, type: "text", text: { body: message } })
    })
    const data = await res.json()
    console.log("✅ WhatsApp reply sent:", JSON.stringify(data))
    return data
  } catch (err) {
    console.error("Failed to send WhatsApp reply:", err)
  }
}
