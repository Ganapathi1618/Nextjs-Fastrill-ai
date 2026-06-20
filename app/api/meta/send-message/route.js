// app/api/meta/send-message/route.js
// NEW FILE — sends a single WhatsApp message (template or test send) server-side.
// Used by campaigns page for both "Send Test" and the bulk campaign loop —
// access_token never leaves the server.

const { NextResponse } = require("next/server")
const { createClient } = require("@supabase/supabase-js")

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 })
    }
    const token = authHeader.slice(7)

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid auth token" }, { status: 401 })
    }
    const userId = user.id

    const body = await req.json()
    const { to, templateName, language, components } = body

    if (!to || !templateName) {
      return NextResponse.json({ error: "Missing 'to' or 'templateName'" }, { status: 400 })
    }

    const { data: wa } = await supabaseAdmin
      .from("whatsapp_connections")
      .select("access_token, phone_number_id")
      .eq("user_id", userId)
      .maybeSingle()

    if (!wa?.access_token || !wa?.phone_number_id) {
      return NextResponse.json({ error: "WhatsApp not connected" }, { status: 400 })
    }

    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: language || "en" }
      }
    }
    if (components && components.length > 0) {
      payload.template.components = components
    }

    const res = await fetch(
      `https://graph.facebook.com/v18.0/${wa.phone_number_id}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + wa.access_token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    )
    const data = await res.json()

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 200 })
    }

    const waMessageId = data?.messages?.[0]?.id || null
    return NextResponse.json({ ok: true, waMessageId }, { status: 200 })
  } catch (err) {
    console.error("❌ /api/meta/send-message error:", err.message)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

module.exports = { POST }
