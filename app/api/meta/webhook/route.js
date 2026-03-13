import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(req) {
  const { searchParams } = new URL(req.url)

  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }

  return new Response("Forbidden", { status: 403 })
}

export async function POST(req) {
  try {

    console.log("🚀 WEBHOOK RUNNING")

    const body = await req.json()

    const statuses = body?.entry?.[0]?.changes?.[0]?.value?.statuses

    if (statuses && !body?.entry?.[0]?.changes?.[0]?.value?.messages) {
      return NextResponse.json({ status: "status_update" }, { status: 200 })
    }

    if (!body?.entry?.[0]?.changes?.[0]?.value?.messages) {
      return NextResponse.json({ status: "no_message" }, { status: 200 })
    }

    const value = body.entry[0].changes[0].value
    const phoneNumberId = value?.metadata?.phone_number_id
    const messages = value?.messages || []
    const contacts = value?.contacts || []

    for (const message of messages) {

      const fromNumber = message.from
      const messageType = message.type

      const timestamp = new Date(
        parseInt(message.timestamp) * 1000
      ).toISOString()

      const contact = contacts.find(c => c.wa_id === fromNumber)

      const contactName =
        contact?.profile?.name || "Customer"

      const formattedPhone =
        fromNumber.replace(/[^0-9]/g, "")

      let messageText = ""

      if (messageType === "text") {
        messageText = message.text?.body || ""
      }
      else if (messageType === "button") {
        messageText = message.button?.text || ""
      }
      else if (messageType === "interactive") {
        messageText =
          message.interactive?.button_reply?.title ||
          message.interactive?.list_reply?.title ||
          ""
      }

      console.log(`📩 ${formattedPhone}: ${messageText}`)

      const { data: connection } = await supabaseAdmin
        .from("whatsapp_connections")
        .select("user_id, access_token")
        .eq("phone_number_id", phoneNumberId)
        .single()

      if (!connection) {
        console.log("❌ No connection found")
        continue
      }

      const userId = connection.user_id

      /* ------------------------------------------------ */
      /* DUPLICATE MESSAGE PROTECTION (NEW FEATURE) */
      /* ------------------------------------------------ */

      const { data: existingMessage } = await supabaseAdmin
        .from("messages")
        .select("id")
        .eq("wa_message_id", message.id)
        .maybeSingle()

      if (existingMessage) {
        console.log("⚠️ Duplicate webhook ignored:", message.id)
        continue
      }

      /* ------------------------------------------------ */
      /* CUSTOMER UPSERT */
      /* ------------------------------------------------ */

      let customer = null

      const { data: existingCustomer } = await supabaseAdmin
        .from("customers")
        .select("*")
        .eq("phone", formattedPhone)
        .eq("user_id", userId)
        .maybeSingle()

      if (existingCustomer) {

        await supabaseAdmin
          .from("customers")
          .update({
            last_visit_at: timestamp
          })
          .eq("id", existingCustomer.id)

        customer = existingCustomer

      } else {

        const { data: newCustomer } = await supabaseAdmin
          .from("customers")
          .insert({
            user_id: userId,
            phone: formattedPhone,
            name: contactName,
            source: "whatsapp",
            tag: "new_lead",
            created_at: timestamp
          })
          .select()
          .single()

        customer = newCustomer

        console.log("✅ New customer created")

      }

      /* ------------------------------------------------ */
      /* CONVERSATION UPSERT */
      /* ------------------------------------------------ */

      let conversation = null

      const { data: existingConvo } = await supabaseAdmin
        .from("conversations")
        .select("*")
        .eq("phone", formattedPhone)
        .eq("user_id", userId)
        .maybeSingle()

      if (existingConvo) {

        const { data: updated } = await supabaseAdmin
          .from("conversations")
          .update({
            last_message: messageText || "[media]",
            last_message_at: timestamp,
            unread_count: (existingConvo.unread_count || 0) + 1,
            customer_id: customer?.id || existingConvo.customer_id,
            status: "open"
          })
          .eq("id", existingConvo.id)
          .select()
          .single()

        conversation = updated

      } else {

        const { data: newConvo } = await supabaseAdmin
          .from("conversations")
          .insert({
            user_id: userId,
            customer_id: customer?.id,
            phone: formattedPhone,
            status: "open",
            ai_enabled: true,
            last_message: messageText || "[media]",
            last_message_at: timestamp,
            unread_count: 1
          })
          .select()
          .single()

        conversation = newConvo

      }

      /* ------------------------------------------------ */
      /* SAVE MESSAGE */
      /* ------------------------------------------------ */

      await supabaseAdmin
        .from("messages")
        .insert({
          user_id: userId,
          phone_number_id: phoneNumberId,
          from_number: fromNumber,
          message_text: messageText || "[media]",
          direction: "inbound",
          conversation_id: conversation?.id,
          customer_phone: formattedPhone,
          message_type: messageType || "text",
          status: "delivered",
          is_ai: false,
          wa_message_id: message.id,
          created_at: timestamp
        })

      /* ------------------------------------------------ */
      /* AI REPLY */
      /* ------------------------------------------------ */

      if (!messageText) {
        return
      }

      const aiReply = `Hi ${contactName.split(" ")[0]} 👋

Thanks for your message.

How can I help you today?

📅 Book appointment
💰 Services & prices
📍 Location`

      await sendWhatsAppMessage({
        phoneNumberId,
        accessToken: connection.access_token,
        toNumber: fromNumber,
        message: aiReply
      })

      await supabaseAdmin
        .from("messages")
        .insert({
          user_id: userId,
          phone_number_id: phoneNumberId,
          from_number: phoneNumberId,
          message_text: aiReply,
          direction: "outbound",
          conversation_id: conversation?.id,
          customer_phone: formattedPhone,
          message_type: "text",
          status: "sent",
          is_ai: true,
          created_at: new Date().toISOString()
        })

    }

    return NextResponse.json({ status: "ok" }, { status: 200 })

  } catch (err) {

    console.error("❌ Webhook error:", err)

    return NextResponse.json({
      status: "error",
      message: err.message
    }, { status: 200 })
  }
}

/* ------------------------------------------------ */
/* SEND WHATSAPP MESSAGE */
/* ------------------------------------------------ */

async function sendWhatsAppMessage({ phoneNumberId, accessToken, toNumber, message }) {

  try {

    const res = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: toNumber,
          type: "text",
          text: {
            body: message
          }
        })
      }
    )

    const data = await res.json()

    if (data.error) {
      console.error("WhatsApp send error:", data.error)
    }

    return data

  } catch (err) {

    console.error("WhatsApp send failed:", err.message)

    return {}
  }
}
