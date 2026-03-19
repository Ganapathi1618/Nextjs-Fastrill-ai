import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const { to, message, conversationId, customerPhone, userId } = await req.json()

    if (!to || !message || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get WhatsApp connection from server — token never goes to browser
    const { data: conn, error: connErr } = await supabaseAdmin
      .from("whatsapp_connections")
      .select("access_token, phone_number_id")
      .eq("user_id", userId)
      .single()

    if (connErr || !conn) {
      return NextResponse.json({ error: "WhatsApp not connected" }, { status: 400 })
    }

    // Send message
    const res = await fetch(
      "https://graph.facebook.com/v18.0/" + conn.phone_number_id + "/messages",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + conn.access_token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to.replace(/[^0-9]/g, ""),
          type: "text",
          text: { body: message, preview_url: false }
        })
      }
    )

    const data = await res.json()

    if (data.error) {
      console.error("WA send error:", data.error)
      return NextResponse.json({ error: data.error.message }, { status: 400 })
    }

    // Save to messages table
    const waMessageId = data?.messages?.[0]?.id || null
    await supabaseAdmin.from("messages").insert({
      user_id:         userId,
      phone_number_id: conn.phone_number_id,
      from_number:     conn.phone_number_id,
      message_text:    message,
      direction:       "outbound",
      conversation_id: conversationId || null,
      customer_phone:  customerPhone || to.replace(/[^0-9]/g, ""),
      message_type:    "text",
      status:          "sent",
      is_ai:           false,
      wa_message_id:   waMessageId,
      created_at:      new Date().toISOString()
    })

    return NextResponse.json({ success: true, messageId: waMessageId })

  } catch(err) {
    console.error("whatsapp-send error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
