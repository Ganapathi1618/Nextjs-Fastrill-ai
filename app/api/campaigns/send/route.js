import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const { phone, message, userId } = await req.json()
    if (!phone || !message || !userId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // Get WA connection for this user
    const { data: conn } = await supabase
      .from("whatsapp_connections")
      .select("phone_number_id, access_token")
      .eq("user_id", userId)
      .single()

    if (!conn) return NextResponse.json({ error: "No WA connection" }, { status: 400 })

    // Format phone (ensure starts with country code, no +)
    const toNumber = phone.replace(/[^0-9]/g, "")

    const res = await fetch(`https://graph.facebook.com/v18.0/${conn.phone_number_id}/messages`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${conn.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toNumber,
        type: "text",
        text: { body: message, preview_url: false }
      })
    })

    const data = await res.json()
    if (data.error) {
      console.error("WA send error:", data.error)
      return NextResponse.json({ error: data.error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, messageId: data.messages?.[0]?.id })

  } catch (err) {
    console.error("Campaign send error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
