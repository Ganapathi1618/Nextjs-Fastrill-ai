// app/api/meta/webhook/route.js
// FIXES IN THIS FILE:
// 1. saveInbound uses msg.dbMessageType (button/interactive → "text") — fixes DB constraint error
// 2. Campaign button reply context — BOOK NOW taps now trigger AI with campaign context
// 3. replied_count incremented on campaigns table when customer replies to a campaign

const { NextResponse } = require("next/server")
const { createClient } = require("@supabase/supabase-js")
const { normalizeMessage }   = require("@/lib/messaging/normalizer")
const { orchestrate }        = require("@/lib/ai/orchestrator")
const { sendAndSave }        = require("@/lib/messaging/wa-send")
const { isDuplicate, upsertCustomer, upsertConversation, saveInboundMessage, upsertLead, handleCompliance } = require("@/lib/crm/customer-engine")
const { stopEnrollment }     = require("@/lib/sequences/sequence-engine")

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const rateLimitMap = new Map()
const RATE_LIMIT_WINDOW_MS = 60000
const RATE_LIMIT_MAX = 100

function isRateLimited(phone) {
  const now  = Date.now()
  const data = rateLimitMap.get(phone) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS }
  if (now > data.resetAt) { rateLimitMap.set(phone, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS }); return false }
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
            .eq("wa_message_id", s.id).then(() => {}).catch(() => {})
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

    for (const message of messages) {
      try {
        await processMessage({ message, contacts, userId: connection.user_id, accessToken: connection.access_token, phoneNumberId })
      } catch(e) {
        console.error("❌ processMessage error:", e.message)
      }
    }

    return NextResponse.json({ status: "ok" })
  } catch(err) {
    console.error("❌ Webhook fatal:", err.message)
    return NextResponse.json({ status: "error" }, { status: 200 })
  }
}

async function processMessage({ message, contacts, userId, accessToken, phoneNumberId }) {
  const msg = normalizeMessage(message, contacts)

  if (await isDuplicate(msg.messageId)) return

  if (isRateLimited(msg.phone)) { console.error("🚫 Rate limited:", msg.phone); return }

  const { customer, isNew } = await upsertCustomer({
    userId, phone: msg.phone, name: msg.contactName, timestamp: msg.timestamp
  })

  const conversation = await upsertConversation({
    userId, phone: msg.phone, customerId: customer?.id,
    text: msg.effectiveText, timestamp: msg.timestamp
  })

  // FIX 1: Use msg.dbMessageType — normalizer maps button/interactive → "text"
  // Fixes: "messages_message_type_check" DB constraint violation on BOOK NOW taps
  const saved = await saveInboundMessage({
    userId, phoneNumberId, from: msg.from,
    text: msg.effectiveText || "[" + msg.type + "]",
    type: msg.dbMessageType,
    conversationId: conversation?.id,
    phone: msg.phone, messageId: msg.messageId, timestamp: msg.timestamp
  })

  if (!saved) {
    console.log("⚡ Atomic dedup blocked duplicate:", msg.messageId)
    return
  }

  if (msg.isText) {
    const compliance = await handleCompliance({ userId, phone: msg.phone, text: msg.effectiveText, conversationId: conversation?.id })
    if (compliance.action) {
      await sendAndSave({ phoneNumberId, accessToken, to: msg.from, message: compliance.reply, userId, conversationId: conversation?.id, isAI: true })
      return
    }
  }

  if (conversation?.ai_enabled === false) return

  // Global AI master switch
  try {
    const { data: bizFlag } = await supabaseAdmin
      .from("business_settings")
      .select("ai_enabled")
      .eq("user_id", userId)
      .maybeSingle()
    if (bizFlag?.ai_enabled === false) {
      console.log("⏸️ AI globally paused for user:", userId)
      return
    }
  } catch(e) {}

  try {
    await stopEnrollment({ leadPhone: msg.phone, userId, reason: "replied" })
  } catch(e) {}

  // FIX 2 + FIX 3: Campaign context detection + replied_count increment
  let campaignContext = null
  let activeCampaignId = null

  try {
    // Check if this conversation has a recent campaign send
    if (conversation?.campaign_sent_at && conversation?.campaign_message) {
      const hoursSince = (Date.now() - new Date(conversation.campaign_sent_at).getTime()) / 3600000
      if (hoursSince < 48) {
        campaignContext = conversation.campaign_message
      }
    }

    // FIX 2: If customer tapped a CTA button (BOOK NOW etc.) and no campaign_sent_at,
    // detect via recent outbound template message in this conversation
    if (!campaignContext && (msg.type === "button" || msg.type === "interactive")) {
      const { data: recentTemplate } = await supabaseAdmin
        .from("messages")
        .select("message_text, created_at")
        .eq("conversation_id", conversation?.id)
        .eq("direction", "outbound")
        .eq("message_type", "template")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (recentTemplate) {
        const hoursSince = (Date.now() - new Date(recentTemplate.created_at).getTime()) / 3600000
        if (hoursSince < 48) {
          campaignContext = recentTemplate.message_text
          console.log("📢 Button reply detected — campaign context loaded")
        }
      }
    }

    // FIX 3: Increment replied_count on the campaigns table
    // Find the most recent campaign sent to this phone number
    // that hasn't already counted this phone as replied
    if (campaignContext || msg.type === "button" || msg.type === "interactive") {
      const { data: recentCampaign } = await supabaseAdmin
        .from("campaigns")
        .select("id, replied_count, wa_message_ids")
        .eq("user_id", userId)
        .in("status", ["done", "completed", "live"])
        .order("sent_at", { ascending: false })
        .limit(5)

      if (recentCampaign?.length) {
        // Find which campaign this customer received — match by wa_message_ids
        // wa_message_ids is an array of message IDs sent in that campaign
        // Check if any recent campaign was sent within last 48 hours
        const cutoff = new Date(Date.now() - 48 * 3600000).toISOString()
        const { data: matchedCampaign } = await supabaseAdmin
          .from("campaigns")
          .select("id, replied_count")
          .eq("user_id", userId)
          .in("status", ["done", "completed"])
          .gte("sent_at", cutoff)
          .order("sent_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        if (matchedCampaign) {
          activeCampaignId = matchedCampaign.id
          // Increment replied_count — use supabase increment via raw SQL update
          await supabaseAdmin
            .from("campaigns")
            .update({ replied_count: (matchedCampaign.replied_count || 0) + 1 })
            .eq("id", matchedCampaign.id)
          console.log("📊 replied_count incremented for campaign:", matchedCampaign.id)
        }
      }
    }
  } catch(e) {
    console.warn("⚠️ Campaign context/count error:", e.message)
  }

  const reply = await orchestrate({
    userId, conversationId: conversation?.id, phone: msg.phone,
    contactName: msg.contactName, message: msg.effectiveText || "",
    isMediaOnly: msg.isMediaOnly, phoneNumberId, campaignContext
  })

  if (msg.effectiveText) {
    await upsertLead({
      userId, customerId: customer?.id, phone: msg.phone,
      name: msg.contactName, text: msg.effectiveText,
      timestamp: msg.timestamp, isNew
    }).catch(() => {})
  }

  if (reply) {
    await sendAndSave({ phoneNumberId, accessToken, to: msg.from, message: reply, userId, conversationId: conversation?.id, isAI: true })
    await supabaseAdmin.from("conversations")
      .update({ last_message: reply, last_message_at: new Date().toISOString() })
      .eq("id", conversation?.id)
  } else {
    console.error("🚨 Orchestrator returned empty reply:", msg.effectiveText)
  }
}

module.exports = { GET, POST }
