// lib/ai/intent-engine.js
// Prompt 1 — classify intent + sentiment + urgency
// Uses a small fast call to Sarvam

const VALID_INTENTS = [
  "greeting", "service_inquiry", "pricing", "booking_new",
  "booking_confirm", "booking_lookup", "booking_reschedule",
  "booking_cancel", "location_query", "hours_query",
  "policy_query", "recommendation_request", "complaint",
  "frustration", "human_handoff", "followup_response",
  "out_of_scope", "gratitude"
]

const VALID_SENTIMENTS = ["neutral","positive","confused","hesitant","annoyed","angry","urgent"]

export async function classifyIntent({ text, history, businessName, services }) {
  const start = Date.now()

  const servicesLine = services.length > 0
    ? services.map(s => s.name).join(", ")
    : "none"

  const lastMessages = history.slice(-4).map(m =>
    `${m.role === "user" ? "Customer" : "AI"}: ${m.content}`
  ).join("\n")

  const prompt = `You are an intent classifier for a WhatsApp business assistant for "${businessName}".

Services offered: ${servicesLine}

Recent conversation:
${lastMessages || "No history yet"}

Customer's latest message: "${text}"

Classify this message and return ONLY valid JSON, nothing else.

Valid primary intents: ${VALID_INTENTS.join(", ")}
Valid sentiments: ${VALID_SENTIMENTS.join(", ")}

Rules:
- If customer mentions booking + asks price → primary=booking_new, secondary=pricing
- If customer says yes/no/ok/confirm after AI asked a question → booking_confirm
- If message has anger words or complaints → sentiment=annoyed or angry
- If message is just "hi", "hello", "hey", "hai" → greeting
- If asking about service that doesn't exist in list → out_of_scope
- Confidence 0.0 to 1.0

Return this exact JSON:
{
  "primary_intent": "one of the valid intents",
  "secondary_intent": "one of the valid intents or null",
  "sentiment": "one of the valid sentiments",
  "urgency": "low|medium|high",
  "confidence": 0.0 to 1.0,
  "reason": "one line explanation"
}`

  try {
    const result = await callSarvam(prompt, text, 200)
    const parsed = parseJSON(result)
    if (!parsed) throw new Error("Invalid JSON from intent engine")

    // Validate
    if (!VALID_INTENTS.includes(parsed.primary_intent)) parsed.primary_intent = "out_of_scope"
    if (!VALID_SENTIMENTS.includes(parsed.sentiment))   parsed.sentiment       = "neutral"
    if (!parsed.confidence || parsed.confidence < 0)    parsed.confidence      = 0.5

    return {
      ...parsed,
      latency: Date.now() - start
    }
  } catch(e) {
    console.error("[intent-engine] Error:", e.message)
    // Deterministic fallback
    return deterministicIntent(text)
  }
}

function deterministicIntent(text) {
  const t = (text || "").toLowerCase().trim()

  if (/^(hi|hello|hey|hii|hai|namaste|vanakkam|good\s*(morning|evening|afternoon))/i.test(t))
    return { primary_intent: "greeting",      sentiment: "neutral", urgency: "low",    confidence: 0.95 }
  if (/\b(book|appointment|slot|schedule)\b/i.test(t))
    return { primary_intent: "booking_new",   sentiment: "neutral", urgency: "medium", confidence: 0.85 }
  if (/\b(price|cost|how much|charges|rate)\b/i.test(t))
    return { primary_intent: "pricing",       sentiment: "neutral", urgency: "low",    confidence: 0.85 }
  if (/\b(reschedule|change|postpone|move)\b/i.test(t))
    return { primary_intent: "booking_reschedule", sentiment: "neutral", urgency: "medium", confidence: 0.80 }
  if (/\b(cancel|cancellation)\b/i.test(t))
    return { primary_intent: "booking_cancel", sentiment: "neutral", urgency: "medium", confidence: 0.85 }
  if (/\b(where|location|address|directions|maps)\b/i.test(t))
    return { primary_intent: "location_query", sentiment: "neutral", urgency: "low",   confidence: 0.90 }
  if (/\b(timing|hours|open|close|when)\b/i.test(t))
    return { primary_intent: "hours_query",   sentiment: "neutral", urgency: "low",    confidence: 0.90 }
  if (/\b(thank|thanks|ok|okay|great|perfect)\b/i.test(t))
    return { primary_intent: "gratitude",     sentiment: "positive", urgency: "low",   confidence: 0.90 }
  if (/\b(yes|yeah|yep|yup|confirm|haan|ji|sure)\b/i.test(t))
    return { primary_intent: "booking_confirm", sentiment: "positive", urgency: "medium", confidence: 0.80 }
  if (/\b(no|nope|nahi|wrong|cancel|change)\b/i.test(t))
    return { primary_intent: "booking_confirm", sentiment: "neutral", urgency: "medium", confidence: 0.75 }
  if (/\b(angry|frustrated|worst|terrible|pathetic|useless)\b/i.test(t))
    return { primary_intent: "complaint",     sentiment: "angry",   urgency: "high",   confidence: 0.85 }
  if (/\b(recommend|suggest|best|what should|which one)\b/i.test(t))
    return { primary_intent: "recommendation_request", sentiment: "neutral", urgency: "low", confidence: 0.80 }
  if (/\b(human|person|owner|manager|staff|agent|speak to)\b/i.test(t))
    return { primary_intent: "human_handoff", sentiment: "neutral", urgency: "medium", confidence: 0.90 }

  return { primary_intent: "out_of_scope",  sentiment: "neutral", urgency: "low",    confidence: 0.50 }
}

async function callSarvam(systemContent, userContent, maxTokens) {
  const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
    method:  "POST",
    headers: { "Content-Type": "application/json", "api-subscription-key": process.env.SARVAM_API_KEY },
    body:    JSON.stringify({
      model:       "sarvam-m",
      messages:    [{ role: "system", content: systemContent }, { role: "user", content: userContent }],
      max_tokens:  maxTokens,
      temperature: 0.1
    })
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data?.choices?.[0]?.message?.content || ""
}

function parseJSON(raw) {
  if (!raw) return null
  let content = stripAllThinkContent(raw)
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim()
  const match = content.match(/\{[\s\S]*\}/)
  if (!match) return null
  try { return JSON.parse(match[0]) } catch(e) { return null }
}


// Strip ALL think content before processing — prevents leaking to customer
function stripAllThinkContent(raw) {
  if (!raw) return ""
  let c = raw
  c = c.replace(/<think>[\s\S]*?<\/think>/gi, "")
  c = c.replace(/<think>[\s\S]*/gi, "")
  c = c.replace(/<\/?think>/gi, "")
  return c.trim()
}
