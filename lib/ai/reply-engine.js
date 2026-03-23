// lib/ai/reply-engine.js — Only used when orchestrator needs a non-JSON AI reply
// (complaint handling, complex out-of-scope, etc.)
const { getFallbackReply } = require("./fallback-engine")

function nuclearStrip(raw) {
  if (!raw?.trim()) return null
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim()
  if (cleaned.includes("<think>")) cleaned = cleaned.split("<think>")[0].trim()
  if (!cleaned && raw.includes("</think>")) cleaned = raw.split("</think>").pop().trim()
  if (!cleaned || cleaned.length < 3) return null
  if (cleaned.toLowerCase().includes("<think>")) { console.error("❌ think tag survived"); return null }
  const meta = [
    /^(the\s+)?(final\s+)?response\s+(should\s+be|is)[:\s]*/i,
    /^(my\s+)?reply\s+(should\s+be|is)[:\s]*/i,
    /^(i\s+should\s+say|i\s+will\s+say)[:\s]*/i,
  ]
  for (const p of meta) cleaned = cleaned.replace(p, "").trim()
  return cleaned.length > 3 ? cleaned : null
}

async function generateReply({ message, biz, services, history, firstName, classification, state }) {
  const start = Date.now()

  if (process.env.SARVAM_API_KEY) {
    try {
      const bizName   = biz?.business_name || "our business"
      const sentiment = classification?.sentiment || "neutral"
      const langName  = biz?.ai_language || "English"
      const svcBlock  = (services||[]).map(s => "• " + s.name + ": ₹" + s.price + (s.duration ? " (" + s.duration + " min)" : "")).join("\n")

      const toneMap = {
        angry:    "Customer is ANGRY. Apologize sincerely first. Keep very short. No upsell. Offer human help.",
        annoyed:  "Customer is frustrated. Acknowledge briefly. Be solution-focused. No upsell.",
        confused: "Customer is confused. Simplify. Ask ONE question max.",
        urgent:   "Customer is urgent. Skip pleasantries. Direct answer only.",
      }
      const tone = toneMap[sentiment] || "Warm, friendly, 2-3 lines max."

      const langRule = `Reply in the same language the customer used. If they wrote in Telugu, reply in Telugu. If Hindi, reply in Hindi. Default: ${langName}.`

      const systemPrompt = `You are the WhatsApp receptionist for *${bizName}*.
RULES: Reply ONLY with the final message. No thinking. No meta-commentary.
${svcBlock ? "SERVICES:\n" + svcBlock : ""}
${biz?.working_hours ? "HOURS: " + biz.working_hours : ""}
${biz?.location ? "ADDRESS: " + biz.location : ""}
${biz?.ai_instructions ? "OWNER RULES:\n" + biz.ai_instructions : ""}
LANGUAGE: ${langRule}
TONE: ${tone}`

      const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-subscription-key": process.env.SARVAM_API_KEY },
        body: JSON.stringify({
          model: "sarvam-m",
          messages: [
            { role: "system", content: systemPrompt },
            ...(history||[]),
            { role: "user", content: message }
          ],
          max_tokens: 300,
          temperature: 0.6
        })
      })

      const data = await res.json()
      if (!data?.error) {
        const reply = nuclearStrip(data?.choices?.[0]?.message?.content || "")
        if (reply) {
          console.log("✅ [reply-engine] " + sentiment + " | " + (Date.now()-start) + "ms")
          return reply
        }
      } else { console.error("❌ [reply-engine]", data.error.message) }
    } catch(e) { console.error("❌ [reply-engine]:", e.message) }
  }

  return getFallbackReply({ intent: classification, state, biz, services, firstName, message })
}

module.exports = { generateReply }
