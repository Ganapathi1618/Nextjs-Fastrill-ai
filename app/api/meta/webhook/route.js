// app/api/meta/webhook/route.js
// FASTRILL AI v2 — Webhook entry point (CommonJS compatible)

const { NextResponse } = require("next/server")
const { createClient } = require("@supabase/supabase-js")
const { normalizeMessage }   = require("@/lib/messaging/normalizer")
const { orchestrate }        = require("@/lib/ai/orchestrator")
const { sendAndSave }        = require("@/lib/messaging/wa-send")
const { isDuplicate, upsertCustomer, upsertConversation, saveInboundMessage, upsertLead, handleCompliance } = require("@/lib/crm/customer-engine")

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// In-memory lock to prevent duplicate processing when Meta sends webhook twice
const processingLock = new Set()

// ── GET: Webhook verification ──────────────────────────────────
async function GET(req) {
  const { searchParams } = new URL(req.url)
  const mode      = searchParams.get("hub.mode")
  const token     = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")
  if (mode === "subscribe" && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }
  return new Response("Forbidden", { status: 403 })
}

// ── POST: Receive messages ─────────────────────────────────────
async function POST(req) {
  const start = Date.now()
  try {
    const body = await req.json()

    // Delivery/read status updates — return 200 immediately
    const statuses = body?.entry?.[0]?.changes?.[0]?.value?.statuses
    const hasMsg   = body?.entry?.[0]?.changes?.[0]?.value?.messages
    if (statuses && !hasMsg) {
      for (const s of statuses) {
        if (s.id && ["delivered","read","failed"].includes(s.status)) {
          supabaseAdmin.from("messages")
            .update({ status: s.status, [s.status + "_at"]: new Date().toISOString() })
            .eq("wa_message_id", s.id)
            .then(() => {}).catch(() => {})
        }
      }
      return NextResponse.json({ status: "status_update" })
    }
    if (!hasMsg) return NextResponse.json({ status: "no_message" })

    const value         = body.entry[0].changes[0].value
    const phoneNumberId = value?.metadata?.phone_number_id
    const messages      = value?.messages || []
    const contacts      = value?.contacts || []

    // Get WhatsApp connection → user
    const { data: connection } = await supabaseAdmin
      .from("whatsapp_connections")
      .select("user_id, access_token")
      .eq("phone_number_id", phoneNumberId)
      .single()

    if (!connection) {
      console.error("❌ No WA connection for:", phoneNumberId)
      return NextResponse.json({ status: "no_connection" })
    }

    const userId      = connection.user_id
    const accessToken = connection.access_token

    for (const message of messages) {
      try {
        await processMessage({ message, contacts, userId, accessToken, phoneNumberId })
      } catch(e) {
        console.error("❌ processMessage error:", e.message)
      }
    }

    console.log("✅ Webhook done in " + (Date.now()-start) + "ms")
    return NextResponse.json({ status: "ok" })

  } catch(err) {
    console.error("❌ Webhook fatal:", err.message, err.stack)
    // Always return 200 to Meta — returning 500 causes infinite retries
    return NextResponse.json({ status: "error" }, { status: 200 })
  }
}

// ── Process single message ─────────────────────────────────────
async function processMessage({ message, contacts, userId, accessToken, phoneNumberId }) {
  // 1. Normalize
  const msg = normalizeMessage(message, contacts)
  console.log("📩 " + msg.phone + " (" + msg.contactName + "): \"" + (msg.effectiveText || "["+msg.type+"]") + "\"")

  // 2. Deduplicate — in-memory lock first (fast), then DB check
  if (processingLock.has(msg.messageId)) {
    console.log("⚠️ Already processing:", msg.messageId)
    return
  }
  if (await isDuplicate(msg.messageId)) {
    console.log("⚠️ Duplicate in DB:", msg.messageId)
    return
  }
  // Acquire lock — release after 30s
  processingLock.add(msg.messageId)
  setTimeout(() => processingLock.delete(msg.messageId), 30000)

  // 3. Upsert customer + conversation
  const { customer, isNew } = await upsertCustomer({
    userId, phone: msg.phone, name: msg.contactName, timestamp: msg.timestamp
  })

  const conversation = await upsertConversation({
    userId, phone: msg.phone, customerId: customer?.id,
    text: msg.effectiveText, timestamp: msg.timestamp
  })

  // 4. Save inbound message
  await saveInboundMessage({
    userId, phoneNumberId, from: msg.from,
    text: msg.effectiveText || "[" + msg.type + "]",
    type: msg.type, conversationId: conversation?.id,
    phone: msg.phone, messageId: msg.messageId, timestamp: msg.timestamp
  })

  // 5. Lead tracking
  if (msg.effectiveText) {
    await upsertLead({
      userId, customerId: customer?.id, phone: msg.phone,
      name: msg.contactName, text: msg.effectiveText,
      timestamp: msg.timestamp, isNew
    })
  }

  // 6. Compliance (STOP/START)
  if (msg.isText) {
    const compliance = await handleCompliance({
      userId, phone: msg.phone,
      text: msg.effectiveText, conversationId: conversation?.id
    })
    if (compliance.action) {
      await sendAndSave({
        phoneNumberId, accessToken, to: msg.from,
        message: compliance.reply, userId,
        conversationId: conversation?.id, isAI: true
      })
      return
    }
  }

  // 7. Skip if AI disabled
  if (conversation?.ai_enabled === false) {
    console.log("⏸️ AI disabled")
    return
  }

  // 8. Orchestrate — get AI reply
  const reply = await orchestrate({
    userId,
    conversationId: conversation?.id,
    phone:          msg.phone,
    contactName:    msg.contactName,
    message:        msg.effectiveText || "",
    isMediaOnly:    msg.isMediaOnly,
    phoneNumberId
  })

  // 9. Send reply
  if (reply) {
    await sendAndSave({
      phoneNumberId, accessToken, to: msg.from,
      message: reply, userId,
      conversationId: conversation?.id, isAI: true
    })
    await supabaseAdmin.from("conversations")
      .update({ last_message: reply, last_message_at: new Date().toISOString() })
      .eq("id", conversation?.id)
  }
}

module.exports = { GET, POST }
