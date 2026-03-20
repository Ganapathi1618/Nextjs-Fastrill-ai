// app/api/meta/webhook/route.js
// FASTRILL AI v2 — Webhook entry point
// This file does ONE thing: receive the message and hand off to orchestrator
// All business logic is in lib/ai/orchestrator.js

import { NextResponse }    from "next/server"
import { createClient }    from "@supabase/supabase-js"
import { normalizeMessage } from "@/lib/messaging/normalizer"
import { orchestrate }     from "@/lib/ai/orchestrator"
import { sendAndSave }     from "@/lib/messaging/wa-send"
import {
  isDuplicate,
  upsertCustomer,
  upsertConversation,
  saveInboundMessage,
  upsertLead,
  handleCompliance
} from "@/lib/crm/customer-engine"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ── GET: Webhook verification ────────────────────────────────────────
export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const mode      = searchParams.get("hub.mode")
  const token     = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")
  if (mode === "subscribe" && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }
  return new Response("Forbidden", { status: 403 })
}

// ── POST: Receive WhatsApp messages ─────────────────────────────────
export async function POST(req) {
  const start = Date.now()
  try {
    const body = await req.json()

    // ── Handle delivery/read status updates ─────────────────────────
    const statuses = body?.entry?.[0]?.changes?.[0]?.value?.statuses
    const hasMsg   = body?.entry?.[0]?.changes?.[0]?.value?.messages
    if (statuses && !hasMsg) {
      for (const s of statuses) {
        if (s.id && ["delivered","read","failed"].includes(s.status)) {
          supabaseAdmin.from("messages")
            .update({ status: s.status, [`${s.status}_at`]: new Date().toISOString() })
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

    // ── Get WhatsApp connection → user ───────────────────────────────
    const { data: connection } = await supabaseAdmin
      .from("whatsapp_connections")
      .select("user_id, access_token")
      .eq("phone_number_id", phoneNumberId)
      .single()

    if (!connection) {
      console.error("❌ No WA connection for phoneNumberId:", phoneNumberId)
      return NextResponse.json({ status: "no_connection" })
    }
    const { user_id: userId, access_token: accessToken } = connection

    for (const message of messages) {
      try {
        await processMessage({ message, contacts, userId, accessToken, phoneNumberId })
      } catch(e) {
        console.error("❌ processMessage error:", e.message, e.stack?.substring(0, 300))
      }
    }

    console.log(`✅ Webhook processed in ${Date.now()-start}ms`)
    return NextResponse.json({ status: "ok" })

  } catch(err) {
    console.error("❌ Webhook fatal:", err.message)
    return NextResponse.json({ status: "error" }, { status: 200 }) // Always 200 to Meta
  }
}

async function processMessage({ message, contacts, userId, accessToken, phoneNumberId }) {
  // ── 1. Normalize ────────────────────────────────────────────────
  const msg = normalizeMessage(message, contacts)
  console.log(`📩 [${phoneNumberId}] ${msg.phone} (${msg.contactName}): "${msg.effectiveText || "["+msg.type+"]"}"`)

  // ── 2. Deduplicate ──────────────────────────────────────────────
  if (await isDuplicate(msg.messageId)) {
    console.log("⚠️ Duplicate message:", msg.messageId)
    return
  }

  // ── 3. CRM — upsert customer + conversation ─────────────────────
  const { customer, isNew } = await upsertCustomer({
    userId, phone: msg.phone, name: msg.contactName, timestamp: msg.timestamp
  })

  const conversation = await upsertConversation({
    userId, phone: msg.phone, customerId: customer?.id,
    text: msg.effectiveText, timestamp: msg.timestamp
  })

  // ── 4. Save inbound message ─────────────────────────────────────
  await saveInboundMessage({
    userId, phoneNumberId, from: msg.from,
    text: msg.effectiveText || `[${msg.type}]`,
    type: msg.type, conversationId: conversation?.id,
    phone: msg.phone, messageId: msg.messageId, timestamp: msg.timestamp
  })

  // ── 5. Lead tracking ────────────────────────────────────────────
  if (msg.effectiveText) {
    await upsertLead({
      userId, customerId: customer?.id, phone: msg.phone,
      name: msg.contactName, text: msg.effectiveText,
      timestamp: msg.timestamp, isNew
    })
  }

  // ── 6. Compliance (STOP/START) ──────────────────────────────────
  if (msg.isText) {
    const compliance = await handleCompliance({
      userId, phone: msg.phone, text: msg.effectiveText, conversationId: conversation?.id
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

  // ── 7. Skip if AI disabled ──────────────────────────────────────
  if (conversation?.ai_enabled === false) {
    console.log("⏸️ AI disabled for this conversation")
    return
  }

  // ── 8. Orchestrate — get reply ──────────────────────────────────
  const reply = await orchestrate({
    userId,
    conversationId: conversation?.id,
    phone:          msg.phone,
    contactName:    msg.contactName,
    message:        msg.effectiveText || "",
    isMediaOnly:    msg.isMediaOnly,
    phoneNumberId
  })

  // ── 9. Send reply ───────────────────────────────────────────────
  if (reply) {
    await sendAndSave({
      phoneNumberId, accessToken, to: msg.from,
      message: reply, userId,
      conversationId: conversation?.id, isAI: true
    })
    // Update conversation last message
    await supabaseAdmin.from("conversations")
      .update({ last_message: reply, last_message_at: new Date().toISOString() })
      .eq("id", conversation?.id)
  }
}
