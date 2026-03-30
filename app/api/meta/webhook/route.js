// app/api/meta/webhook/route.js
// FASTRILL AI v3.3 — Webhook entry point
//
// ROOT CAUSE OF SILENCE BUG:
//   v3.2 returned 200 immediately then processed async via enqueueForPhone().
//   Vercel serverless functions TERMINATE as soon as the response is sent.
//   The async queue never ran. Customer got silence every time.
//
// FIX:
//   Process ALL messages synchronously (await) before returning 200.
//   Vercel keeps the function alive until we return — so this is correct.
//   Meta allows up to 20s for a 200 response, Vercel hobby timeout is 60s.
//
// GREETING LOOP FIX (replaces the broken async queue):
//   DB-level dedup: before processing, write a "processing" lock row to DB.
//   If a second message from the same phone arrives while first is processing,
//   the DB insert will conflict (unique constraint on phone+timestamp window)
//   and it skips. This works across serverless instances unlike in-memory Sets.
//   Simpler approach used here: check if messageId already processed (existing
//   isDuplicate check) — Meta assigns unique IDs per message so same-phone
//   rapid messages are different IDs and all process, but now they process
//   sequentially within the same webhook POST (messages array is iterated
//   with await, not fired in parallel).

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

// In-memory dedup for the same messageId arriving twice in the same invocation
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

    // Status updates (delivered/read) — handle and return immediately
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

    // Resolve WhatsApp connection → user
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

    // Process messages SEQUENTIALLY with await — critical for Vercel.
    // Do NOT use Promise.all() here — that fires all in parallel, causing
    // the greeting loop (all see same history before any reply is saved).
    // Sequential await means each message sees the updated history from
    // the previous one.
    for (const message of messages) {
      try {
        await processMessage({ message, contacts, userId, accessToken, phoneNumberId })
      } catch(e) {
        console.error("❌ processMessage error:", e.message, e.stack)
        // Continue to next message — don't let one failure block others
      }
    }

    console.log("✅ Webhook done in " + (Date.now()-start) + "ms")
    return NextResponse.json({ status: "ok" })

  } catch(err) {
    console.error("❌ Webhook fatal:", err.message, err.stack)
    // MUST return 200 — returning 5xx causes Meta to retry infinitely
    return NextResponse.json({ status: "error" }, { status: 200 })
  }
}

// ── Process single message ─────────────────────────────────────
async function processMessage({ message, contacts, userId, accessToken, phoneNumberId }) {
  // 1. Normalize raw WhatsApp payload
  const msg = normalizeMessage(message, contacts)
  console.log("📩 " + msg.phone + " (" + msg.contactName + "): \"" + (msg.effectiveText || "["+msg.type+"]") + "\"")

  // 2. Dedup — in-memory first (same invocation), then DB (across invocations)
  if (processingLock.has(msg.messageId)) {
    console.log("⚠️ Already processing (in-memory lock):", msg.messageId)
    return
  }
  if (await isDuplicate(msg.messageId)) {
    console.log("⚠️ Duplicate in DB:", msg.messageId)
    return
  }
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

  // 4. Compliance check (STOP/START) — must run before AI
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

  // 5. Skip if AI disabled for this conversation
  if (conversation?.ai_enabled === false) {
    console.log("⏸️ AI disabled for conversation", conversation?.id)
    await saveInboundMessage({
      userId, phoneNumberId, from: msg.from,
      text: msg.effectiveText || "[" + msg.type + "]",
      type: msg.type, conversationId: conversation?.id,
      phone: msg.phone, messageId: msg.messageId, timestamp: msg.timestamp
    })
    return
  }

  // 6. ECHO FIX: Orchestrate BEFORE saving inbound to DB.
  //    If we save inbound first, loadContext() inside orchestrate picks up
  //    the customer's own message as the last history entry and the AI
  //    echoes it back. By orchestrating first, history snapshot is clean.
  const reply = await orchestrate({
    userId,
    conversationId: conversation?.id,
    phone:          msg.phone,
    contactName:    msg.contactName,
    message:        msg.effectiveText || "",
    isMediaOnly:    msg.isMediaOnly,
    phoneNumberId
  })

  // 7. NOW save inbound — after AI has read history
  await saveInboundMessage({
    userId, phoneNumberId, from: msg.from,
    text: msg.effectiveText || "[" + msg.type + "]",
    type: msg.type, conversationId: conversation?.id,
    phone: msg.phone, messageId: msg.messageId, timestamp: msg.timestamp
  })

  // 8. Lead tracking
  if (msg.effectiveText) {
    await upsertLead({
      userId, customerId: customer?.id, phone: msg.phone,
      name: msg.contactName, text: msg.effectiveText,
      timestamp: msg.timestamp, isNew
    }).catch(e => console.error("⚠️ upsertLead failed (non-fatal):", e.message))
  }

  // 9. Send reply — orchestrator guarantees reply is never null/empty
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
    // This should never happen after v3.2 orchestrator, but log if it does
    console.error("🚨 Orchestrator returned empty reply for:", msg.phone, "msg:", msg.effectiveText)
  }
}

module.exports = { GET, POST }
