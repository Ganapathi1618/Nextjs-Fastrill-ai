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

const processingLock = new Set()

// ── Rate limiting ──────────────────────────────────────────────
const rateLimitMap = new Map()
const RATE_LIMIT_WINDOW_MS = 60000
const RATE_LIMIT_MAX       = 100

function isRateLimited(phone) {
  const now  = Date.now()
  const data = rateLimitMap.get(phone) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS }
  if (now > data.resetAt) {
    rateLimitMap.set(phone, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }
  if (data.count >= RATE_LIMIT_MAX) return true
  data.count++
  rateLimitMap.set(phone, data)
  return false
}

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

async function POST(req) {
  try {
    const body = await req.json()

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

    const { data: connection } = await supabaseAdmin
      .from("whatsapp_connections")
      .select("user_id, access_token")
      .eq("phone_number_id", phoneNumberId)
      .single()

    if (!connection) {
      console.error("❌ No WA connection for phoneNumberId:", phoneNumberId)
      return NextResponse.json({ status: "no_connection" })
    }

    const userId      = connection.user_id
    const accessToken = connection.access_token

    for (const message of messages) {
      try {
        await processMessage({ message, contacts, userId, accessToken, phoneNumberId })
      } catch(e) {
        console.error("❌ processMessage error:", e.message, e.stack)
      }
    }

    return NextResponse.json({ status: "ok" })

  } catch(err) {
    console.error("❌ Webhook fatal:", err.message, err.stack)
    return NextResponse.json({ status: "error" }, { status: 200 })
  }
}

async function processMessage({ message, contacts, userId, accessToken, phoneNumberId }) {
  const msg = normalizeMessage(message, contacts)

  if (processingLock.has(msg.messageId)) return
  if (await isDuplicate(msg.messageId)) return

  // ── Rate limit check ───────────────────────────────────────
  if (isRateLimited(msg.phone)) {
    console.error("🚫 Rate limited:", msg.phone)
    return
  }

  processingLock.add(msg.messageId)
  setTimeout(() => processingLock.delete(msg.messageId), 30000)

  const { customer, isNew } = await upsertCustomer({
    userId, phone: msg.phone, name: msg.contactName, timestamp: msg.timestamp
  })

  const conversation = await upsertConversation({
    userId, phone: msg.phone, customerId: customer?.id,
    text: msg.effectiveText, timestamp: msg.timestamp
  })

  if (msg.isText) {
    const compliance = await handleCompliance({
      userId, phone: msg.phone,
      text: msg.effectiveText, conversationId: conversation?.id
    })
    if (compliance.action) {
      await saveInboundMessage({
        userId, phoneNumberId, from: msg.from,
        text: msg.effectiveText || "[" + msg.type + "]",
        type: msg.type, conversationId: conversation?.id,
        phone: msg.phone, messageId: msg.messageId, timestamp: msg.timestamp
      })
      await sendAndSave({
        phoneNumberId, accessToken, to: msg.from,
        message: compliance.reply, userId,
        conversationId: conversation?.id, isAI: true
      })
      return
    }
  }

  if (conversation?.ai_enabled === false) {
    await saveInboundMessage({
      userId, phoneNumberId, from: msg.from,
      text: msg.effectiveText || "[" + msg.type + "]",
      type: msg.type, conversationId: conversation?.id,
      phone: msg.phone, messageId: msg.messageId, timestamp: msg.timestamp
    })
    return
  }

  // Check if customer is replying to a campaign message
let campaignContext = null
try {
  const { data: lastOutbound } = await supabaseAdmin
    .from("messages")
    .select("message_text, message_type, created_at")
    .eq("conversation_id", conversation?.id)
    .eq("direction", "outbound")
    .eq("message_type", "template")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastOutbound) {
    const hoursSince = (Date.now() - new Date(lastOutbound.created_at).getTime()) / 3600000
    if (hoursSince < 24) {
      campaignContext = lastOutbound.message_text
    }
  }
} catch(e) {
  console.error("⚠️ campaignContext fetch failed:", e.message)
}

const reply = await orchestrate({
  userId,
  conversationId: conversation?.id,
  phone:          msg.phone,
  contactName:    msg.contactName,
  message:        msg.effectiveText || "",
  isMediaOnly:    msg.isMediaOnly,
  phoneNumberId,
  campaignContext
})

  await saveInboundMessage({
    userId, phoneNumberId, from: msg.from,
    text: msg.effectiveText || "[" + msg.type + "]",
    type: msg.type, conversationId: conversation?.id,
    phone: msg.phone, messageId: msg.messageId, timestamp: msg.timestamp
  })

  if (msg.effectiveText) {
    await upsertLead({
      userId, customerId: customer?.id, phone: msg.phone,
      name: msg.contactName, text: msg.effectiveText,
      timestamp: msg.timestamp, isNew
    }).catch(e => console.error("⚠️ upsertLead failed (non-fatal):", e.message))
  }

  if (reply) {
    await sendAndSave({
      phoneNumberId, accessToken, to: msg.from,
      message: reply, userId,
      conversationId: conversation?.id, isAI: true
    })
    await supabaseAdmin.from("conversations")
      .update({ last_message: reply, last_message_at: new Date().toISOString() })
      .eq("id", conversation?.id)
  } else {
    console.error("🚨 Orchestrator returned empty reply for msg:", msg.effectiveText)
  }
}

module.exports = { GET, POST }
