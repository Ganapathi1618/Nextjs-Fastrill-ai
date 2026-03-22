// lib/ai/reply-engine.js — Final reply generation with sentiment-aware tone + 10 languages
const { getFallbackReply } = require("./fallback-engine")

// ── Nuclear think-strip — customer NEVER sees <think> content ──
function nuclearStrip(raw) {
  if (!raw?.trim()) return null

  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim()
  if (cleaned.includes("<think>")) cleaned = cleaned.split("<think>")[0].trim()
  if (!cleaned && raw.includes("</think>")) cleaned = raw.split("</think>").pop().trim()
  if (!cleaned || cleaned.length < 3) return null
  if (cleaned.toLowerCase().includes("<think>") || cleaned.toLowerCase().includes("</think>")) {
    console.error("❌ think tag survived — refusing to send"); return null
  }

  // Strip meta-commentary
  const metaPatterns = [
    /^(the\s+)?(final\s+)?response\s+(should\s+be|is)[:\s]*/i,
    /^(my\s+)?reply\s+(should\s+be|is)[:\s]*/i,
    /^(i\s+should\s+say|i\s+will\s+say|i'll\s+say)[:\s]*/i,
    /^(so\s+)?the\s+(final\s+)?reply\s+is[:\s]*/i,
    /^okay[,.]?\s+(let me|i need|so)[:\s]*/i
  ]
  for (const p of metaPatterns) cleaned = cleaned.replace(p, "").trim()

  // Detect reasoning text leaking through
  const reasoningRx = [
    /^the\s+(customer|user)\s+(is|has|wants|asked)/i,
    /^let\s+me\s+(analyze|think|check)/i,
    /^(based\s+on|looking\s+at|since\s+the)/i
  ]
  if (reasoningRx.some(rx => rx.test(cleaned)) && cleaned.length > 150) {
    const quoted = cleaned.match(/"([^"]{10,250})"/)?.[1]
    if (quoted && !reasoningRx.some(rx => rx.test(quoted))) return quoted.trim()
    const paras = cleaned.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 5)
    for (let i = paras.length-1; i >= 0; i--) {
      if (paras[i].length < 300 && !reasoningRx.some(rx => rx.test(paras[i]))) return paras[i]
    }
    console.warn("⚠️ reasoning text detected — using fallback"); return null
  }

  return cleaned.length > 3 ? cleaned : null
}

// ── Sentiment-aware tone instructions ────────────────────────
function buildToneInstructions(sentiment) {
  switch (sentiment) {
    case "angry":
      return `\nTONE INSTRUCTIONS (CRITICAL):
- Customer is ANGRY. This is your top priority.
- Start with a sincere apology. Do NOT be defensive.
- Keep response SHORT — 2 lines max.
- Do NOT upsell, suggest services, or promote anything.
- Do NOT use excessive emojis — one max.
- Offer to connect with a real person or resolve the issue immediately.`
    case "annoyed":
      return `\nTONE INSTRUCTIONS:
- Customer is frustrated. Acknowledge their frustration first.
- Keep it short and solution-focused.
- Do NOT upsell or promote. Maximum 1 emoji.
- Offer concrete help or escalation.`
    case "confused":
      return `\nTONE INSTRUCTIONS:
- Customer is confused. Simplify your language completely.
- Ask ONE clear question at a time. Use short sentences.
- Give 2-3 simple options if relevant. Be patient and reassuring.`
    case "hesitant":
      return `\nTONE INSTRUCTIONS:
- Customer is hesitant. Be reassuring but not pushy.
- Recommend the single best option. Don't overwhelm with choices.
- Don't pressure. Give them space to decide.`
    case "urgent":
      return `\nTONE INSTRUCTIONS:
- Customer is URGENT. Skip pleasantries. Get straight to the solution.
- If booking, offer the nearest available slot immediately.
- Show you understand the urgency.`
    case "positive":
      return `\nTONE: Customer is happy. Match their warm energy. Move toward next step.`
    default:
      return `\nTONE: Warm, friendly, professional. Keep replies 2-3 lines max.`
  }
}

async function generateReply({ message, biz, services, history, firstName, classification, entities, state, relevantChunks }) {
  const start = Date.now()

  if (process.env.SARVAM_API_KEY) {
    try {
      const bizName    = biz?.business_name || "our business"
      const sentiment  = classification?.sentiment || "neutral"

      // Build services block
      const svcBlock = (services||[]).map(s =>
        "• " + s.name + ": ₹" + s.price +
        (s.duration ? " (" + s.duration + " min)" : "") +
        (s.description ? " — " + s.description : "")
      ).join("\n")

      // Build booking progress hint
      const s = state || {}
      let bookingHint = ""
      if (s.service || s.date || s.time) {
        const col = [], mis = []
        if (s.service) col.push("service: " + s.service); else mis.push("which service")
        if (s.date)    col.push("date: " + s.date);       else mis.push("date")
        if (s.time)    col.push("time: " + s.time);       else mis.push("time")
        bookingHint = "\nBooking progress — Collected: " + (col.join(", ") || "nothing") +
          (mis.length ? "\nStill need: " + mis.join(", ") : "\nAll collected — ask to confirm!")
      }

      // Tone instructions based on sentiment
      const toneInstructions = buildToneInstructions(sentiment)

      // Language instruction — supports all 10 Indian languages
      const langName = biz?.ai_language || "English"
      const langInstruction = langName === "English"
        ? "Reply in English. But if the customer writes in Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, or Punjabi — reply in THEIR language automatically."
        : "Reply in " + langName + " by default. If the customer writes in a different Indian language, REPLY IN THEIR LANGUAGE. Always match the customer's language."

      const systemPrompt = `You are the WhatsApp assistant for *${bizName}*${biz?.business_type ? " (" + biz.business_type + ")" : ""}${biz?.location ? ", " + biz.location : ""}.

CRITICAL RULES:
1. Reply ONLY with the final message. No thinking, no reasoning, no meta-commentary.
2. Keep replies SHORT — 2-3 lines max unless listing services.
3. Be warm and human. Never robotic. Never repeat what customer already said.
4. Address customer as "${firstName}" when natural.
5. NEVER fabricate services, prices, or availability not listed below.
${svcBlock ? "\nSERVICES:\n" + svcBlock : ""}
${biz?.working_hours ? "\nHOURS: " + biz.working_hours : ""}
${biz?.location ? "\nADDRESS: " + biz.location : ""}
${biz?.ai_instructions ? "\nOWNER INSTRUCTIONS:\n" + biz.ai_instructions : ""}
${relevantChunks ? "\nKNOWLEDGE:\n" + relevantChunks : ""}
${bookingHint}
LANGUAGE: ${langInstruction}
CUSTOMER SENTIMENT: ${sentiment}
INTENT: ${classification?.primary_intent || "unknown"}
${toneInstructions}`

      const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-subscription-key": process.env.SARVAM_API_KEY },
        body: JSON.stringify({
          model: "sarvam-m",
          messages: [
            { role: "system", content: systemPrompt },
            ...(history || []),
            { role: "user", content: message }
          ],
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
      } else {
        console.error("❌ [reply-engine]", data.error.message)
      }
    } catch(e) {
      console.error("❌ [reply-engine] exception:", e.message)
    }
  }

  return getFallbackReply({ intent: classification, state, biz, services, firstName, message })
}

module.exports = { generateReply }
