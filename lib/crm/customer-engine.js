// lib/crm/customer-engine.js
const { createClient } = require("@supabase/supabase-js")

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function upsertCustomer({ userId, phone, name, timestamp }) {
  const { data: existing } = await supabaseAdmin.from("customers").select("*").eq("phone", phone).eq("user_id", userId).maybeSingle()
  if (existing) {
    await supabaseAdmin.from("customers").update({ last_visit_at: timestamp, name: existing.name || name }).eq("id", existing.id)
    return { customer: existing, isNew: false }
  }
  const { data } = await supabaseAdmin.from("customers").insert({ user_id: userId, phone, name, source: "whatsapp", tag: "new_lead", created_at: timestamp }).select().single()
  return { customer: data, isNew: true }
}

async function upsertConversation({ userId, phone, customerId, text, timestamp }) {
  const { data: existing } = await supabaseAdmin.from("conversations").select("*").eq("phone", phone).eq("user_id", userId).maybeSingle()
  if (existing) {
    const { data: updated } = await supabaseAdmin.from("conversations").update({ last_message: text || "[media]", last_message_at: timestamp, unread_count: (existing.unread_count || 0) + 1, customer_id: customerId || existing.customer_id, status: "open" }).eq("id", existing.id).select().single()
    return updated
  }
  const { data } = await supabaseAdmin.from("conversations").insert({ user_id: userId, customer_id: customerId || null, phone, status: "open", ai_enabled: true, last_message: text || "[media]", last_message_at: timestamp, unread_count: 1 }).select().single()
  return data
}

async function saveInboundMessage({ userId, phoneNumberId, from, text, type, conversationId, phone, messageId, timestamp }) {
  try {
    await supabaseAdmin.from("messages").insert({ user_id: userId, phone_number_id: phoneNumberId, from_number: from, message_text: text || "[" + type + "]", direction: "inbound", conversation_id: conversationId || null, customer_phone: phone, message_type: type || "text", status: "delivered", is_ai: false, wa_message_id: messageId || null, created_at: timestamp })
  } catch(e) { console.warn("saveInbound failed:", e.message) }
}

async function upsertLead({ userId, customerId, phone, name, text, timestamp, isNew }) {
  try {
    if (isNew && customerId) {
      await supabaseAdmin.from("leads").insert({ user_id: userId, customer_id: customerId, phone, name, source: "whatsapp", status: "open", last_message: text, last_message_at: timestamp, ai_score: 60, estimated_value: 600 })
    } else if (customerId) {
      await supabaseAdmin.from("leads").update({ last_message: text, last_message_at: timestamp }).eq("customer_id", customerId).eq("status", "open")
    }
  } catch(e) {}
}

async function isDuplicate(messageId) {
  if (!messageId) return false
  const { data } = await supabaseAdmin.from("messages").select("id").eq("wa_message_id", messageId).maybeSingle()
  return !!data
}

async function handleCompliance({ userId, phone, text }) {
  const t = (text || "").toLowerCase().trim()
  const stopKw = ["stop","unsubscribe","opt out","optout","don't message","remove me"]
  if (stopKw.some(k => t === k || t.includes(k))) {
    try { await supabaseAdmin.from("campaign_optouts").upsert({ user_id: userId, phone, created_at: new Date().toISOString() }, { onConflict: "user_id,phone" }) } catch(e) {}
    return { action: "stop", reply: "You've been unsubscribed from our messages. Reply START to resubscribe anytime 🙏" }
  }
  if (t === "start") {
    try { await supabaseAdmin.from("campaign_optouts").delete().eq("user_id", userId).eq("phone", phone) } catch(e) {}
    return { action: "start", reply: "You've been resubscribed! Welcome back 😊" }
  }
  return { action: null }
}

module.exports = { upsertCustomer, upsertConversation, saveInboundMessage, upsertLead, isDuplicate, handleCompliance }
