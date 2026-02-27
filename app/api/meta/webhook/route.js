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
    console.log("Webhook verified successfully")
    return new Response(challenge, { status: 200 })
  }

  return new Response("Forbidden", { status: 403 })
}

// ── POST: Receive incoming WhatsApp messages ──
export async function POST(req) {
  try {
    const body = await req.json()

    // Meta sends a test ping first — handle it
    if (!body?.entry?.[0]?.changes?.[0]?.value?.messages) {
      return NextResponse.json({ status: "no_message" }, { status: 200 })
    }

    const value          = body.entry[0].changes[0].value
    const phoneNumberId  = value?.metadata?.phone_number_id
    const messages       = value?.messages || []

    for (const message of messages) {
      const fromNumber  = message.from   // customer's phone number
      const messageText = message.text?.body || ""
      const messageType = message.type   // text, image, audio etc

      // Only handle text messages for now
      if (messageType !== "text" || !messageText) continue

      console.log(`📩 Message from ${fromNumber}: ${messageText}`)

      // ── Find which user owns this phone_number_id ──
      const { data: connection } = await supabaseAdmin
        .from("whatsapp_connections")
        .select("user_id, access_token")
        .eq("phone_number_id", phoneNumberId)
        .single()

      if (!connection) {
        console.log("No connection found for phone_number_id:", phoneNumberId)
        continue
      }

      // ── Save message to database ──
      await supabaseAdmin.from("messages").insert({
        user_id:        connection.user_id,
        phone_number_id: phoneNumberId,
        from_number:    fromNumber,
        message_text:   messageText,
        direction:      "inbound",
      })

      // ── Send auto-reply (placeholder for now) ──
      await sendWhatsAppReply({
        phoneNumberId,
        accessToken: connection.access_token,
        toNumber:    fromNumber,
        message:     `Hi! Thanks for reaching out. We'll get back to you shortly. 🙌`,
      })
    }

    return NextResponse.json({ status: "ok" }, { status: 200 })

  } catch (err) {
    console.error("Webhook error:", err)
    // Always return 200 to Meta — otherwise Meta will retry constantly
    return NextResponse.json({ status: "error" }, { status: 200 })
  }
}

// ── Helper: Send WhatsApp message via Meta API ──
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
          to:      toNumber,
          type:    "text",
          text:    { body: message },
        }),
      }
    )
    const data = await res.json()
    console.log("Reply sent:", data)
    return data
  } catch (err) {
    console.error("Failed to send reply:", err)
  }
}
