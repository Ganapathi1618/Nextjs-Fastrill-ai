// app/api/meta/webhook/route.js
// FASTRILL AI v3 — Webhook entry point
// FIX 1: Per-phone message queue — prevents greeting loop when Meta sends
//         multiple messages simultaneously (same phone, different messageIds)
// FIX 2: Context loaded BEFORE saveInboundMessage — prevents echo bug where
//         the customer's own message appeared in history and got echoed back

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

// In-memory lock: dedup same messageId (Meta sometimes sends webhook twice)
const processingLock = new Set()

// Per-phone queue: ensures messages from the same phone are processed
// strictly one at a time — prevents simultaneous messages getting same history
// and producing the same reply (greeting loop)
const phoneQueues = new Map()   // phone → Promise (tail of queue)

function enqueueForPhone(phone, fn) {
  const prev = phoneQueues.get(phone) || Promise.resolve()
  const next = prev.then(fn).catch(e => {
    console.error("❌ Queue error for", phone, ":", e.message)
  })
  phoneQueues.set(phone, next)
  // Clean up map entry once queue drains (prevent memory leak)
  next.finally(() => {
    if (phoneQueues.get(phone) === next) phoneQueues.delete(phone)
  })
  return next
}

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

    // Normalize all messages first so we have phones for queue routing
    const normalized = messages.map(m => normalizeMessage(m, contacts))

    // Enqueue each message per-phone — guarantees serial processing per customer
    // Multiple customers still process in parallel (different phones = different queues)
    for (const msg of normalized) {
      enqueueForPhone(msg.phone, () =>
        processMessage({ msg, userId, accessToken, phoneNumberId })
      )
    }

    // Return 200 immediately — processing continues async in queue
    // Meta only needs 200 ACK within 20s; actual processing is background
    console.log("✅ Webhook ACK in " + (Date.now()-start) + "ms")
    return NextResponse.json({ status: "ok" })

  } catch(err) {
    console.error("❌ Webhook fatal:", err.message, err.stack)
    // Always return 200 to Meta — returning 500 causes infinite retries
    return NextResponse.json({ status: "error" }, { status: 200 })
  }
}

// ── Process single message (runs serially per phone via queue) ──
async function processMessage({ msg, userId, accessToken, phoneNumberId }) {
  console.log("📩 " + msg.phone + " (" + msg.contactName + "): \"" + (msg.effectiveText || "["+msg.type+"]") + "\"")

  // 1. Deduplicate — in-memory lock first (fast), then DB check
  if (processingLock.has(msg.messageId)) {
    console.log("⚠️ Already processing:", msg.messageId)
    return
  }
  if (await isDuplicate(msg.messageId)) {
    console.log("⚠️ Duplicate in DB:", msg.messageId)
    return
  }
  processingLock.add(msg.messageId)
  setTimeout(() => processingLock.delete(msg.messageId), 30000)

  // 2. Upsert customer + conversation
  const { customer, isNew } = await upsertCustomer({
    userId, phone: msg.phone, name: msg.contactName, timestamp: msg.timestamp
  })

  const conversation = await upsertConversation({
    userId, phone: msg.phone, customerId: customer?.id,
    text: msg.effectiveText, timestamp: msg.timestamp
  })

  // 3. FIX: Load AI context BEFORE saving inbound message.
  //    Previously: saveInboundMessage ran first → inbound was in DB → loadContext
  //    picked it up → AI saw customer's own message at end of history → echoed it.
  //    Now: context snapshot is taken before the new message is written to DB.
  const { orchestrate: _orchestrate } = require("@/lib/ai/orchestrator")  // already required above, just documenting intent

  // Compliance check first (STOP/START) — must happen before AI
  if (msg.isText) {
    const compliance = await handleCompliance({
      userId, phone: msg.phone,
      text: msg.effectiveText, conversationId: conversation?.id
    })
    if (compliance.action) {
      // Save inbound THEN reply for compliance — order matters here for audit
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

  // 4. Skip if AI disabled
  if (conversation?.ai_enabled === false) {
    console.log("⏸️ AI disabled")
    await saveInboundMessage({
      userId, phoneNumberId, from: msg.from,
      text: msg.effectiveText || "[" + msg.type + "]",
      type: msg.type, conversationId: conversation?.id,
      phone: msg.phone, messageId: msg.messageId, timestamp: msg.timestamp
    })
    return
  }

  // 5. Orchestrate — context loaded INSIDE orchestrator BEFORE we save inbound
  //    This is the critical order fix for the echo bug
  const reply = await orchestrate({
    userId,
    conversationId: conversation?.id,
    phone:          msg.phone,
    contactName:    msg.contactName,
    message:        msg.effectiveText || "",
    isMediaOnly:    msg.isMediaOnly,
    phoneNumberId
  })

  // 6. NOW save inbound message — after AI has already read context
  await saveInboundMessage({
    userId, phoneNumberId, from: msg.from,
    text: msg.effectiveText || "[" + msg.type + "]",
    type: msg.type, conversationId: conversation?.id,
    phone: msg.phone, messageId: msg.messageId, timestamp: msg.timestamp
  })

  // 7. Lead tracking
  if (msg.effectiveText) {
    await upsertLead({
      userId, customerId: customer?.id, phone: msg.phone,
      name: msg.contactName, text: msg.effectiveText,
      timestamp: msg.timestamp, isNew
    })
  }

  // 8. Send reply
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
