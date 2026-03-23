// lib/ai/reply-engine.js — Final reply generation with language matching + sentiment tone
const { getFallbackReply } = require("./fallback-engine")

function nuclearStrip(raw) {
  if (!raw?.trim()) return null
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim()
  if (cleaned.includes("<think>")) cleaned = cleaned.split("<think>")[0].trim()
  if (!cleaned && raw.includes("</think>")) cleaned = raw.split("</think>").pop().trim()
  if (!cleaned || cleaned.length < 3) return null
  if (cleaned.toLowerCase().includes("<think>") || cleaned.toLowerCase().includes("</think>")) {
    console.error("❌ think tag survived — refusing to send"); return null
  }
  const metaPatterns = [
    /^(the\s+)?(final\s+)?response\s+(should\s+be|is)[:\s]*/i,
    /^(my\s+)?reply\s+(should\s+be|is)[:\s]*/i,
    /^(i\s+should\s+say|i\s+will\s+say|i'll\s+say)[:\s]*/i,
    /^(so\s+)?the\s+(final\s+)?reply\s+is[:\s]*/i,
    /^okay[,.]?\s+(let me|i need|so)[:\s]*/i
  ]
  for (const p of metaPatterns) cleaned = cleaned.replace(p, "").trim()
  const reasoningRx = [/^the\s+(customer|user)\s+(is|has|wants|asked)/i, /^let\s+me\s+(analyze|think|check)/i, /^(based\s+on|looking\s+at|since\s+the)/i]
  if (reasoningRx.some(rx => rx.test(cleaned)) && cleaned.length > 150) {
    const quoted = cleaned.match(/"([^"]{10,250})"/)?.[1]
    if (quoted && !reasoningRx.some(rx => rx.test(quoted))) return quoted.trim()
    const paras = cleaned.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 5)
    for (let i = paras.length-1; i >= 0; i--) {
      if (paras[i].length < 300 && !reasoningRx.some(rx => rx.test(paras[i]))) return paras[i]
    }
    console.warn("⚠️ reasoning text detected — fallback"); return null
  }
  return cleaned.length > 3 ? cleaned : null
}

function buildToneInstructions(sentiment) {
  switch(sentiment) {
    case "angry":    return "\nTONE: Customer is ANGRY. Apologize first. Keep very short. No upsell. Offer human help."
    case "annoyed":  return "\nTONE: Customer is frustrated. Acknowledge briefly. Be direct. No upsell."
    case "confused": return "\nTONE: Customer is confused. Simplify completely. One question only."
    case "hesitant": return "\nTONE: Customer is hesitant. Be warm and reassuring. One clear recommendation."
    case "urgent":   return "\nTONE: Customer is urgent. Skip pleasantries. Direct answer immediately."
    case "positive": return "\nTONE: Customer is happy. Match their energy warmly."
    default:         return "\nTONE: Warm, friendly, professional. 2-3 lines max."
  }
}

async function generateReply({ message, biz, services, history, firstName, classification, entities, state, relevantChunks }) {
  const start = Date.now()

  if (process.env.SARVAM_API_KEY) {
    try {
      const bizName   = biz?.business_name || "our business"
      const sentiment = classification?.sentiment || "neutral"

      const svcBlock = (services||[]).map(s =>
        "• " + s.name + ": ₹" + s.price +
        (s.duration ? " (" + s.duration + " min)" : "") +
        (s.description ? " — " + s.description : "")
      ).join("\n")

      const s = state || {}
      let bookingHint = ""
      if (s.service || s.date || s.time) {
        const col = [], mis = []
        if (s.service) col.push("service: " + s.service); else mis.push("which service")
        if (s.date)    col.push("date: " + s.date);       else mis.push("date")
        if (s.time)    col.push("time: " + s.time);       else mis.push("time")
        bookingHint = "\nBooking progress — Collected: " + (col.join(", ")||"nothing") +
          (mis.length ? "\nStill need: " + mis.join(", ") : "\nAll collected — ask to confirm!")
      }

      const langName = biz?.ai_language || "English"

      // KEY FIX: Language instruction is now the top priority
      // AI MUST reply in customer's language, not just default language
      const langInstruction = `LANGUAGE RULES (CRITICAL — follow these exactly):
1. Detect what language the customer wrote in
2. ALWAYS reply in the SAME language the customer used
3. If customer writes in Telugu → reply in Telugu
4. If customer writes in Hindi → reply in Hindi
5. If customer writes in Tamil → reply in Tamil
6. If customer asks "do you know X language?" → say YES and switch to that language
7. Default language when unclear: ${langName}
8. NEVER reply in a different language than what the customer used`

      const systemPrompt = `You are the WhatsApp assistant for *${bizName}*${biz?.business_type?" ("+biz.business_type+")":""}${biz?.location?", "+biz.location:""}.

CRITICAL RULES:
1. Reply ONLY with the final message. No thinking, no reasoning, no meta-commentary.
2. Keep replies SHORT — 2-3 lines max unless listing services.
3. Be warm and human. Never robotic.
4. Address customer as "${firstName}" when natural.
5. NEVER fabricate services, prices, or availability not listed below.
6. If customer asks if you know a language — say YES and demonstrate by replying in that language.

${langInstruction}
${svcBlock ? "\nSERVICES:\n" + svcBlock : ""}
${biz?.working_hours ? "\nHOURS: " + biz.working_hours : ""}
${biz?.location ? "\nADDRESS: " + biz.location : ""}
${biz?.ai_instructions ? "\nOWNER INSTRUCTIONS:\n" + biz.ai_instructions : ""}
${relevantChunks ? "\nKNOWLEDGE:\n" + relevantChunks : ""}
${bookingHint}
CUSTOMER SENTIMENT: ${sentiment}
INTENT: ${classification?.primary_intent||"unknown"}
${buildToneInstructions(sentiment)}`

      const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-subscription-key": process.env.SARVAM_API_KEY },
        body: JSON.stringify({
          model: "sarvam-m",
          messages: [{ role:"system", content:systemPrompt }, ...(history||[]), { role:"user", content:message }],
          max_tokens: 400,
          temperature: 0.65
        })
      })

      const data = await res.json()
      if (!data?.error) {
        const raw   = data?.choices?.[0]?.message?.content || ""
        const reply = nuclearStrip(raw)
        if (reply) {
          console.log("✅ [reply-engine] " + sentiment + " | " + (Date.now()-start) + "ms | " + reply.substring(0,60))
          return reply
        }
        console.warn("⚠️ [reply-engine] nuclearStrip null — fallback")
      } else { console.error("❌ [reply-engine]", data.error.message) }
    } catch(e) { console.error("❌ [reply-engine] exception:", e.message) }
  }

  return getFallbackReply({ intent: classification, state, biz, services, firstName, message })
}

module.exports = { generateReply }
