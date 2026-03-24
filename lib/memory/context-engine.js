// lib/memory/context-engine.js
const { createClient } = require("@supabase/supabase-js")

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function loadContext({ userId, conversationId, phone }) {
  try {
    const todayStr = new Date().toISOString().split("T")[0]

    const [{ data: bizSettings }, { data: bizKnowledge }, { data: servicesList }, { data: rawHistory }, { data: activeBookings }] = await Promise.all([
      supabaseAdmin.from("business_settings").select("*").eq("user_id", userId).maybeSingle(),
      supabaseAdmin.from("business_knowledge").select("*").eq("user_id", userId).maybeSingle(),
      supabaseAdmin.from("services").select("name,price,duration,category,description,service_type,is_active").eq("user_id", userId),
      supabaseAdmin.from("messages").select("message_text,direction,is_ai,created_at").eq("conversation_id", conversationId).order("created_at", { ascending: false }).limit(12),
      // Load customer's active bookings so AI knows what exists — not relying on chat history
      supabaseAdmin.from("bookings").select("service,booking_date,booking_time,status").eq("customer_phone", phone).eq("user_id", userId).in("status", ["confirmed","pending"]).gte("booking_date", todayStr).order("booking_date", { ascending: true }).limit(5)
    ])

    const biz = Object.assign({}, bizKnowledge || {}, bizSettings || {}, {
      ai_instructions: [bizSettings?.ai_instructions, bizKnowledge?.content, bizKnowledge?.knowledge, bizKnowledge?.notes].filter(Boolean).join("\n\n") || ""
    })

    const services = (servicesList || []).filter(s => s.is_active !== false)
    const history  = buildHistory(rawHistory || [])

    // Format active bookings for the AI prompt
    const bookingsSummary = (activeBookings || []).length > 0
      ? (activeBookings || []).map(b => b.service + " on " + b.booking_date + (b.booking_time ? " at " + b.booking_time : "")).join(", ")
      : "no upcoming bookings"

    return { biz, services, history, chunks: [], activeBookings: bookingsSummary }
  } catch(e) {
    console.error("❌ loadContext failed:", e.message)
    return { biz: {}, services: [], history: [], chunks: [], activeBookings: 'none' }
  }
}

function buildHistory(rawHistory) {
  if (!rawHistory?.length) return []
  const chronological = [...rawHistory].reverse()
  const msgs = chronological.map(m => ({ role: m.direction === "inbound" ? "user" : "assistant", content: (m.message_text || "").trim() })).filter(m => m.content && m.content !== "[media message]")
  const merged = []
  for (const msg of msgs) {
    if (!merged.length) { merged.push(msg); continue }
    if (merged[merged.length-1].role === msg.role) { merged[merged.length-1].content += "\n" + msg.content }
    else merged.push(msg)
  }
  while (merged.length && merged[0].role !== "user") merged.shift()
  return merged.slice(-12)
}

function retrieveChunks(chunks, topic) {
  if (!chunks?.length || !topic) return ""
  const t = topic.toLowerCase()
  return chunks.filter(c => (c.title||"").toLowerCase().includes(t) || (c.content||"").toLowerCase().includes(t) || (c.category||"").toLowerCase().includes(t) || (c.keywords||[]).some(k => t.includes(k.toLowerCase()) || k.toLowerCase().includes(t))).slice(0,4).map(c => "[" + c.category + "] " + c.title + ": " + c.content).join("\n\n")
}

module.exports = { loadContext, retrieveChunks }
