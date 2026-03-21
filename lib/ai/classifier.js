// lib/ai/classifier.js — Intent + sentiment classification

const INTENTS = ["greeting","service_inquiry","pricing","booking_new","booking_confirm","booking_lookup","booking_reschedule","booking_cancel","location_query","hours_query","policy_query","recommendation_request","complaint","frustration","human_handoff","followup_response","out_of_scope","gratitude"]
const SENTIMENTS = ["neutral","positive","confused","hesitant","annoyed","angry","urgent"]

function parseJSON(raw, stage) {
  try {
    let clean = (raw || "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim()
    if (clean.includes("<think>")) clean = clean.split("<think>")[0].trim()
    clean = clean.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim()
    const match = clean.match(/\{[\s\S]*\}/)
    if (!match) return null
    return JSON.parse(match[0])
  } catch(e) { console.warn("[" + stage + "] JSON parse failed:", e.message); return null }
}

function ruleBasedClassify(message) {
  const m = (message || "").toLowerCase().trim()
  const greetingRx  = /^(hi|hello|hey|hii|namaste|good\s+(morning|evening|afternoon|night)|hola|hai)[!\s.]*$/i
  const reschedKw   = ["reschedule","change","postpone","different time","another day","shift booking"]
  const cancelKw    = ["cancel","don't want","not coming","won't come","nahi aana"]
  const confirmKw   = ["yes","yeah","yep","ok","okay","sure","confirm","haan","ji","theek","done"]
  const bookingKw   = ["book","appointment","slot","schedule","want to come","visit","reserve"]
  const pricingKw   = ["price","cost","how much","rate","charge","fee","offer","package","service"]
  const locationKw  = ["where","address","location","maps","directions","how to reach"]
  const hoursKw     = ["timing","hours","open","close","when","working"]
  const humanKw     = ["human","agent","person","owner","manager","speak to"]
  const complaintKw = ["problem","issue","wrong","bad","terrible","complaint","not good"]
  const gratitudeKw = ["thank","thanks","ok thanks","great","perfect","awesome"]

  let primary_intent = "out_of_scope", sentiment = "neutral", urgency = "low"

  if (greetingRx.test(m))                         primary_intent = "greeting"
  else if (reschedKw.some(k => m.includes(k)))    primary_intent = "booking_reschedule"
  else if (cancelKw.some(k => m.includes(k)))     primary_intent = "booking_cancel"
  else if (confirmKw.some(k => m.trim() === k))   primary_intent = "booking_confirm"
  else if (bookingKw.some(k => m.includes(k)))    primary_intent = "booking_new"
  else if (pricingKw.some(k => m.includes(k)))    primary_intent = "pricing"
  else if (locationKw.some(k => m.includes(k)))   primary_intent = "location_query"
  else if (hoursKw.some(k => m.includes(k)))      primary_intent = "hours_query"
  else if (humanKw.some(k => m.includes(k)))      primary_intent = "human_handoff"
  else if (complaintKw.some(k => m.includes(k)))  { primary_intent = "complaint"; sentiment = "annoyed" }
  else if (gratitudeKw.some(k => m.includes(k)))  { primary_intent = "gratitude"; sentiment = "positive" }

  if (m.includes("urgent") || m.includes("asap")) urgency = "high"
  return { primary_intent, secondary_intent: null, sentiment, urgency, confidence: 0.75, reason: "rule-based" }
}

async function classifyMessage({ message, history, biz }) {
  const start = Date.now()
  if (process.env.SARVAM_API_KEY) {
    try {
      const recentHistory = (history || []).slice(-4).map(m => (m.role === "user" ? "Customer" : "AI") + ": " + m.content).join("\n")
      const prompt = `You are a message classifier for a WhatsApp business assistant.
Business: ${biz?.business_name || "a service business"} (${biz?.business_type || ""})
Recent conversation:\n${recentHistory || "(no history)"}
Latest customer message: "${message}"
Reply ONLY with valid JSON, no explanation:
{"primary_intent":"<one of: ${INTENTS.join(", ")}>","secondary_intent":"<one or null>","sentiment":"<one of: ${SENTIMENTS.join(", ")}>","urgency":"<low|medium|high>","confidence":<0.0-1.0>,"reason":"<one sentence>"}`

      const res  = await fetch("https://api.sarvam.ai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", "api-subscription-key": process.env.SARVAM_API_KEY }, body: JSON.stringify({ model: "sarvam-m", messages: [{ role: "user", content: prompt }], max_tokens: 150, temperature: 0.1 }) })
      const data = await res.json()
      if (!data?.error) {
        const result = parseJSON(data?.choices?.[0]?.message?.content || "", "classifier")
        if (result) { console.log("✅ [classifier] " + result.primary_intent + " | " + (Date.now()-start) + "ms"); return result }
      } else { console.error("❌ [classifier]", data.error.message) }
    } catch(e) { console.warn("⚠️ [classifier] failed:", e.message) }
  }
  const fallback = ruleBasedClassify(message)
  console.log("⚡ [classifier] fallback: " + fallback.primary_intent)
  return fallback
}

module.exports = { classifyMessage, parseJSON }
