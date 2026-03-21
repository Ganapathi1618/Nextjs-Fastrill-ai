// lib/memory/context-engine.js
const { createClient } = require("@supabase/supabase-js")

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function loadContext({ userId, conversationId, phone }) {
  try {
    const [{ data: bizSettings }, { data: bizKnowledge }, { data: servicesList }, { data: rawHistory }, { data: knowledgeChunks }] = await Promise.all([
      supabaseAdmin.from("business_settings").select("*").eq("user_id", userId).maybeSingle(),
      supabaseAdmin.from("business_knowledge").select("*").eq("user_id", userId).maybeSingle(),
      supabaseAdmin.from("services").select("name,price,duration,category,description,service_type,is_active").eq("user_id", userId),
      supabaseAdmin.from("messages").select("message_text,direction,is_ai,created_at").eq("conversation_id", conversationId).order("created_at", { ascending: false }).limit(16),
      supabaseAdmin.from("business_knowledge_chunks").select("category,title,content,keywords,priority").eq("user_id", userId).eq("is_active", true).order("priority", { ascending: false }).limit(30)
    ])

    const biz = Object.assign({}, bizKnowledge || {}, bizSettings || {}, {
      ai_instructions: [bizSettings?.ai_instructions, bizKnowledge?.content, bizKnowledge?.knowledge, bizKnowledge?.notes].filter(Boolean).join("\n\n") || ""
    })

    const services = (servicesList || []).filter(s => s.is_active !== false)
    const history  = buildHistory(rawHistory || [])

    return { biz, services, history, chunks: knowledgeChunks || [] }
  } catch(e) {
    console.error("❌ loadContext failed:", e.message)
    return { biz: {}, services: [], history: [], chunks: [] }
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
