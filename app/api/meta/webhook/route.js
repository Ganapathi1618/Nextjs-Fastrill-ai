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

    const body = await req.json()

    const value = body?.entry?.[0]?.changes?.[0]?.value

    if (!value?.messages) {
      return NextResponse.json({ status: "no_message" }, { status: 200 })
    }

    const phoneNumberId = value.metadata.phone_number_id
    const messages = value.messages
    const contacts = value.contacts || []

    for (const message of messages) {

      const fromNumber = message.from
      const messageId = message.id
      const timestamp = new Date(parseInt(message.timestamp) * 1000).toISOString()

      let messageText = ""

      if (message.type === "text") {
        messageText = message.text.body
      }

      const formattedPhone = fromNumber.replace(/[^0-9]/g, "")

      const contact = contacts.find(c => c.wa_id === fromNumber)
      const contactName = contact?.profile?.name || "Customer"

      /* -------------------------------- */
      /* DUPLICATE PROTECTION */
      /* -------------------------------- */

      const { data: existingMsg } = await supabaseAdmin
        .from("messages")
        .select("id")
        .eq("wa_message_id", messageId)
        .maybeSingle()

      if (existingMsg) {
        console.log("Duplicate webhook ignored")
        continue
      }

      /* -------------------------------- */
      /* GET WHATSAPP CONNECTION */
      /* -------------------------------- */

      const { data: connection } = await supabaseAdmin
        .from("whatsapp_connections")
        .select("user_id, access_token")
        .eq("phone_number_id", phoneNumberId)
        .single()

      if (!connection) continue

      const userId = connection.user_id

      /* -------------------------------- */
      /* CUSTOMER UPSERT */
      /* -------------------------------- */

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
            tag: "new_lead",
            created_at: timestamp
          })
          .select()
          .single()

        customer = newCustomer

      }

      /* -------------------------------- */
      /* CONVERSATION UPSERT */
      /* -------------------------------- */

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
            last_message: messageText,
            last_message_at: timestamp,
            unread_count: (existingConvo.unread_count || 0) + 1
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
            phone: formattedPhone,
            customer_id: customer?.id,
            status: "open",
            ai_enabled: true,
            last_message: messageText,
            last_message_at: timestamp,
            unread_count: 1
          })
          .select()
          .single()

        conversation = newConvo

      }

      /* -------------------------------- */
      /* SAVE INBOUND MESSAGE */
      /* -------------------------------- */

      await supabaseAdmin.from("messages").insert({
        user_id: userId,
        phone_number_id: phoneNumberId,
        from_number: fromNumber,
        message_text: messageText,
        direction: "inbound",
        conversation_id: conversation?.id,
        customer_phone: formattedPhone,
        message_type: message.type,
        status: "delivered",
        is_ai: false,
        wa_message_id: messageId,
        created_at: timestamp
      })

      /* -------------------------------- */
      /* BOOKING INTENT SIMPLE DETECTION */
      /* -------------------------------- */

      const lower = messageText.toLowerCase()

      if (lower.includes("book")) {

        const { data: services } = await supabaseAdmin
          .from("services")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)

        const matchedService = services?.[0]

        if (!matchedService) continue

        const serviceDuration = matchedService.duration_minutes || 30
        const serviceCapacity = matchedService.capacity || 1

        const date = new Date().toISOString().split("T")[0]
        const time = "17:00"

        const { data: existingBookings } = await supabaseAdmin
          .from("bookings")
          .select("id")
          .eq("user_id", userId)
          .eq("booking_date", date)
          .eq("booking_time", time)
          .eq("service", matchedService.name)
          .in("status", ["confirmed","pending"])

        const currentCount = existingBookings?.length || 0

        if (currentCount >= serviceCapacity) {

          const slotMsg = `That slot is fully booked 😔

Available slots:
${generateNextSlots(time)}`

          await sendWhatsAppMessage({
            phoneNumberId,
            accessToken: connection.access_token,
            toNumber: fromNumber,
            message: slotMsg
          })

          continue
        }

        await supabaseAdmin
          .from("bookings")
          .insert({
            user_id: userId,
            customer_id: customer?.id,
            customer_name: contactName,
            customer_phone: formattedPhone,
            service: matchedService.name,
            booking_date: date,
            booking_time: time,
            duration_minutes: serviceDuration,
            amount: matchedService.price,
            status: "confirmed",
            ai_booked: true,
            created_at: new Date().toISOString()
          })

        const confirmMsg = `✅ Booking Confirmed

Service: ${matchedService.name}
Date: ${date}
Time: ${time}`

        await sendWhatsAppMessage({
          phoneNumberId,
          accessToken: connection.access_token,
          toNumber: fromNumber,
          message: confirmMsg
        })

      }

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

/* -------------------------------- */
/* NEXT SLOT GENERATOR */
/* -------------------------------- */

function generateNextSlots(time) {

  const [h, m] = time.split(":").map(Number)

  const slots = []

  for (let i = 1; i <= 3; i++) {

    const next = new Date()
    next.setHours(h)
    next.setMinutes(m + (i * 30))

    const hh = String(next.getHours()).padStart(2, "0")
    const mm = String(next.getMinutes()).padStart(2, "0")

    slots.push(`${hh}:${mm}`)
  }

  return slots.join("\n")
}

/* -------------------------------- */
/* SEND WHATSAPP MESSAGE */
/* -------------------------------- */

async function sendWhatsAppMessage({ phoneNumberId, accessToken, toNumber, message }) {

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
        text: { body: message }
      })
    }
  )

  return res.json()
}
