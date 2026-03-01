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

    for (const message of messages) {
      const fromNumber  = message.from
      const messageText = message.text?.body || ""
      const messageType = message.type

      if (messageType !== "text" || !messageText) continue

      console.log(`📩 From ${fromNumber}: ${messageText}`)

      // ── Find which business owns this phone number ──
      const { data: connection, error: connError } = await supabaseAdmin
        .from("whatsapp_connections")
        .select("user_id, access_token")
        .eq("phone_number_id", phoneNumberId)
        .single()

      if (connError) console.log("Connection error:", connError)
      if (!connection) {
        console.log("No connection found for phoneNumberId:", phoneNumberId)
        continue
      }

      console.log("✅ Found connection for user:", connection.user_id)

      // ── Save inbound message ──
      await supabaseAdmin.from("messages").insert({
        user_id:         connection.user_id,
        phone_number_id: phoneNumberId,
        from_number:     fromNumber,
        message_text:    messageText,
        direction:       "inbound",
      })

      // ── Get business knowledge base ──
      const { data: knowledge, error: knowledgeError } = await supabaseAdmin
        .from("business_knowledge")
        .select("*")
        .eq("user_id", connection.user_id)
        .single()

      if (knowledgeError) console.log("Knowledge error:", knowledgeError)
      console.log("Knowledge found:", knowledge ? "YES" : "NO")

      // ── Get last 5 messages for context ──
      const { data: history } = await supabaseAdmin
        .from("messages")
        .select("message_text, direction")
        .eq("user_id", connection.user_id)
        .eq("from_number", fromNumber)
        .order("created_at", { ascending: false })
        .limit(5)

      const conversationHistory = (history || [])
        .reverse()
        .map(m => ({
          role:    m.direction === "inbound" ? "user" : "assistant",
          content: m.message_text
        }))

      // ── Generate AI reply ──
      const aiReply = await generateAIReply({
        customerMessage: messageText,
        knowledge,
        history: conversationHistory,
      })

      console.log("🤖 AI Reply:", aiReply)

      // ── Send reply via WhatsApp ──
      await sendWhatsAppReply({
        phoneNumberId,
        accessToken: connection.access_token,
        toNumber:    fromNumber,
        message:     aiReply,
      })

      // ── Save outbound message ──
      await supabaseAdmin.from("messages").insert({
        user_id:         connection.user_id,
        phone_number_id: phoneNumberId,
        from_number:     fromNumber,
        message_text:    aiReply,
        direction:       "outbound",
      })
    }

    return NextResponse.json({ status: "ok" }, { status: 200 })

  } catch (err) {
    console.error("Webhook error:", err)
    return NextResponse.json({ status: "error" }, { status: 200 })
  }
}

// ── AI Reply using Claude ──
async function generateAIReply({ customerMessage, knowledge, history }) {
  try {
    const businessContext = knowledge ? `You are a friendly assistant for ${knowledge.business_name}, a ${knowledge.business_type} in ${knowledge.location}.

SERVICES AND PRICING:
${knowledge.services}

WORKING HOURS:
${knowledge.working_hours}

RULES:
- Reply in a warm, friendly, human tone
- Keep replies short (max 3-4 lines)
- Use 1-2 emojis naturally
- Never make up prices or services not listed above
- If unsure, say: "Let me check that for you! Our team will get back to you shortly 🙌"
- If customer asks for human, say: "Sure! Our team will reach out shortly 🙌"` 
: `You are a friendly business assistant. Keep replies short and helpful. If unsure say: "Our team will get back to you shortly 🙌"`

    console.log("Calling Claude API...")
    console.log("ANTHROPIC_API_KEY exists:", !!process.env.ANTHROPIC_API_KEY)

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
        messages: [
          ...history,
          { role: "user", content: customerMessage }
        ],
      }),
    })

    const data = await response.json()
    console.log("Claude response status:", response.status)
    console.log("Claude response:", JSON.stringify(data))

    if (data?.content?.[0]?.text) {
      return data.content[0].text
    }

    console.log("No content in Claude response, using fallback")
    return "Thanks for reaching out! Our team will get back to you shortly 🙌"

  } catch (err) {
    console.error("Claude API error:", err)
    return "Thanks for reaching out! Our team will get back to you shortly 🙌"
  }
}

// ── Send WhatsApp Message ──
async function sendWhatsAppReply({ phoneNumberId, accessToken, toNumber, message }) {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to:   toNumber,
          type: "text",
          text: { body: message },
        }),
      }
    )
    const data = await res.json()
    console.log("✅ WhatsApp reply sent:", JSON.stringify(data))
    return data
  } catch (err) {
    console.error("Failed to send WhatsApp reply:", err)
  }
}
