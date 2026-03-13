import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
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

    const body = await req.json()

    const value = body?.entry?.[0]?.changes?.[0]?.value

    if (!value?.messages) {
      return NextResponse.json({ status: "no_message" })
    }

    const phoneNumberId = value.metadata.phone_number_id
    const messages = value.messages
    const contacts = value.contacts || []

    for (const msg of messages) {

      const messageId = msg.id
      const from = msg.from
      const type = msg.type

      let text = ""

      if (type === "text") text = msg.text.body

      const phone = from.replace(/[^0-9]/g, "")

      const contact = contacts.find(c => c.wa_id === from)
      const name = contact?.profile?.name || "Customer"

      const timestamp = new Date(parseInt(msg.timestamp) * 1000).toISOString()

      const { data: existingMsg } = await supabase
        .from("messages")
        .select("id")
        .eq("wa_message_id", messageId)
        .maybeSingle()

      if (existingMsg) continue

      const { data: conn } = await supabase
        .from("whatsapp_connections")
        .select("user_id,access_token")
        .eq("phone_number_id", phoneNumberId)
        .single()

      if (!conn) continue

      const userId = conn.user_id

      let customer

      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("*")
        .eq("phone", phone)
        .eq("user_id", userId)
        .maybeSingle()

      if (existingCustomer) {

        await supabase
          .from("customers")
          .update({ last_visit_at: timestamp })
          .eq("id", existingCustomer.id)

        customer = existingCustomer

      } else {

        const { data: newCustomer } = await supabase
          .from("customers")
          .insert({
            user_id: userId,
            phone,
            name,
            tag: "new_lead",
            created_at: timestamp
          })
          .select()
          .single()

        customer = newCustomer
      }

      let conversation

      const { data: existingConvo } = await supabase
        .from("conversations")
        .select("*")
        .eq("phone", phone)
        .eq("user_id", userId)
        .maybeSingle()

      if (existingConvo) {

        const { data: updated } = await supabase
          .from("conversations")
          .update({
            last_message: text,
            last_message_at: timestamp
          })
          .eq("id", existingConvo.id)
          .select()
          .single()

        conversation = updated

      } else {

        const { data: newConvo } = await supabase
          .from("conversations")
          .insert({
            user_id: userId,
            phone,
            customer_id: customer?.id,
            status: "open",
            ai_enabled: true,
            last_message: text,
            last_message_at: timestamp
          })
          .select()
          .single()

        conversation = newConvo
      }

      await supabase.from("messages").insert({
        user_id: userId,
        phone_number_id: phoneNumberId,
        from_number: from,
        message_text: text,
        direction: "inbound",
        conversation_id: conversation?.id,
        customer_phone: phone,
        message_type: type,
        status: "delivered",
        wa_message_id: messageId,
        created_at: timestamp
      })

      await processAI({
        userId,
        phoneNumberId,
        accessToken: conn.access_token,
        message: text,
        phone,
        from,
        name,
        conversation
      })

    }

    return NextResponse.json({ status: "ok" })

  } catch (err) {

    console.error("Webhook error:", err)

    return NextResponse.json({
      status: "error",
      message: err.message
    })
  }
}

async function processAI({
  userId,
  phoneNumberId,
  accessToken,
  message,
  phone,
  from,
  name,
  conversation
}) {

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)

  const { data: biz } = await supabase
    .from("business_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  const historyRes = await supabase
    .from("messages")
    .select("message_text,direction")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: false })
    .limit(10)

  const history = historyRes.data || []

  const intent = detectIntent(message)

  if (intent.type === "booking") {

    const slot = await findAvailableSlot({
      userId,
      services,
      serviceName: intent.service,
      date: intent.date,
      time: intent.time
    })

    if (slot.available) {

      await supabase.from("bookings").insert({
        user_id: userId,
        customer_name: name,
        customer_phone: phone,
        service: intent.service,
        booking_date: slot.date,
        booking_time: slot.time,
        amount: slot.price,
        status: "confirmed",
        ai_booked: true
      })

      const reply = `✅ Booking confirmed\n${intent.service}\n${slot.date} ${slot.time}`

      await sendWA(phoneNumberId, accessToken, from, reply)

      return

    } else {

      const next = await suggestNextSlot({
        userId,
        service: intent.service,
        date: intent.date,
        services
      })

      const reply = `That slot is full.\nNext available: ${next}`

      await sendWA(phoneNumberId, accessToken, from, reply)

      return
    }
  }

  const aiReply = await generateAI(message, history, services, biz)

  await sendWA(phoneNumberId, accessToken, from, aiReply)

}

function detectIntent(text) {

  const t = text.toLowerCase()

  if (t.includes("book") || t.includes("appointment")) {
    return {
      type: "booking",
      service: "appointment",
      date: new Date().toISOString().slice(0, 10),
      time: "17:00"
    }
  }

  return { type: "general" }
}

async function findAvailableSlot({ userId, services, serviceName, date, time }) {

  const service = services.find(s =>
    serviceName?.toLowerCase().includes(s.name.toLowerCase())
  )

  const capacity = service?.capacity || 1

  const { data: existing } = await supabase
    .from("bookings")
    .select("*")
    .eq("booking_date", date)
    .eq("booking_time", time)
    .eq("service", serviceName)

  if ((existing?.length || 0) >= capacity) {
    return { available: false }
  }

  return {
    available: true,
    date,
    time,
    price: service?.price || 0
  }
}

async function suggestNextSlot({ userId, service, date, services }) {

  const svc = services.find(s => s.name === service)

  const duration = svc?.duration_minutes || 30

  let start = 10 * 60

  while (start < 20 * 60) {

    const h = Math.floor(start / 60)
    const m = start % 60

    const time = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`

    const slot = await findAvailableSlot({
      userId,
      services,
      serviceName: service,
      date,
      time
    })

    if (slot.available) return `${date} ${time}`

    start += duration
  }

  return "No slots available"
}

async function generateAI(message, history, services, biz) {

  try {

    const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": process.env.SARVAM_API_KEY
      },
      body: JSON.stringify({
        model: "sarvam-m",
        messages: [
          { role: "system", content: `You are assistant for ${biz?.business_name}` },
          { role: "user", content: message }
        ]
      })
    })

    const data = await res.json()

    const reply = data?.choices?.[0]?.message?.content

    if (reply) return reply

  } catch (e) {}

  return "How can I help you?"
}

async function sendWA(phoneNumberId, accessToken, to, text) {

  await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text }
    })
  })

}
