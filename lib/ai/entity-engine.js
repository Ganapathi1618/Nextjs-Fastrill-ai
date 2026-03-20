// lib/ai/entity-engine.js
// Prompt 2 — extract structured entities with confidence scores
// Never triggers execution — only provides candidates

export async function extractEntities({ text, history, services, cal, workingHours, bookingState }) {
  const start = Date.now()

  const servicesLine = services.map(s => `${s.name} (₹${s.price})`).join(", ") || "none"
  const lastMessages = history.slice(-6).map(m =>
    `${m.role === "user" ? "Customer" : "AI"}: ${m.content}`
  ).join("\n")

  const stateDesc = bookingState
    ? `Current state: service="${bookingState.service||"?"}", date="${bookingState.date||"?"}", time="${bookingState.time||"?"}"`
    : "No booking in progress"

  const prompt = `You are an entity extractor for a WhatsApp booking assistant.

Services available: ${servicesLine}
${stateDesc}

Conversation:
${lastMessages}

Customer's latest message: "${text}"

Extract entities and return ONLY valid JSON.

For service matching:
- Only use names from the services list above
- If customer mentions something not in the list → service.value = null, service.not_offered = true, service.mentioned = "what they said"
- Fuzzy match: "automaton" → "Automation", "hair spa" → closest match if exists
- If no service mentioned → null

For date:
- Use context from conversation history if customer is continuing a booking
- "tomorrow", "next monday" etc → resolve to YYYY-MM-DD using today = ${cal.today.iso}
- Just a number like "25" → ambiguous = true
- No date mentioned → null

For time:
- Explicit "11am", "5pm" → extract and convert to HH:MM 24hr
- Just "11" or "5" → ambiguous = true
- "morning", "evening" → vague = true
- No time mentioned → null

For confirmation:
- yes/yeah/ok/sure/confirm/haan/ji/bilkul → true
- no/nope/nahi/wrong/change → false
- not applicable → null

Return this JSON:
{
  "service": {
    "value": "exact service name from list or null",
    "confidence": 0.0,
    "ambiguous": false,
    "not_offered": false,
    "mentioned": "what customer said if not_offered"
  },
  "date": {
    "value": "YYYY-MM-DD or null",
    "confidence": 0.0,
    "ambiguous": false,
    "raw": "what customer said"
  },
  "time": {
    "value": "HH:MM 24hr or null",
    "confidence": 0.0,
    "ambiguous": false,
    "vague": false,
    "raw": "what customer said"
  },
  "confirmation": {
    "value": true/false/null,
    "confidence": 0.0
  },
  "staff": {
    "value": null,
    "confidence": 0.0
  },
  "budget": {
    "value": null,
    "confidence": 0.0
  },
  "urgency_words": [],
  "correction_detected": false,
  "correction_field": null
}`

  try {
    const result = await callSarvam(prompt, text, 400)
    const parsed = parseJSON(result)
    if (!parsed) throw new Error("Invalid JSON")

    // Override with JS-resolved date/time if Sarvam got them
    // JS resolution is more accurate than LLM for date math
    import { resolveDate, resolveTime } from "../booking/calendar-engine.js"
    const jsDate = resolveDate(text, cal)
    const jsTime = resolveTime(text, workingHours || "")

    if (jsDate && parsed.date) {
      // JS wins for date calculation
      parsed.date.value     = jsDate.ambiguous ? null : jsDate.iso
      parsed.date.ambiguous = !!jsDate.ambiguous
      parsed.date.resolved  = jsDate
    }
    if (jsTime && parsed.time) {
      if (!jsTime.ambiguous && jsTime.time24) {
        parsed.time.value     = jsTime.time24
        parsed.time.ambiguous = false
        parsed.time.display   = jsTime.display
      } else {
        parsed.time.ambiguous = true
        parsed.time.resolved  = jsTime
      }
    }

    // If booking state has service and customer didn't mention a new one, carry forward
    if (!parsed.service?.value && bookingState?.service) {
      parsed.service = { value: bookingState.service, confidence: 1.0, carried: true }
    }
    if (!parsed.date?.value && bookingState?.date) {
      parsed.date = { value: bookingState.date, confidence: 1.0, carried: true }
    }
    if (!parsed.time?.value && bookingState?.time) {
      parsed.time = { value: bookingState.time, confidence: 1.0, carried: true }
    }

    return { ...parsed, latency: Date.now() - start }
  } catch(e) {
    console.error("[entity-engine] Error:", e.message)
    return buildFallbackEntities(text, services, bookingState, cal, workingHours)
  }
}

function buildFallbackEntities(text, services, bookingState, cal, workingHours) {
  const { resolveDate, resolveTime } = require("../booking/calendar-engine.js")
  const jsDate = resolveDate(text, cal)
  const jsTime = resolveTime(text, workingHours || "")

  // Service matching — DB driven
  let serviceValue = bookingState?.service || null
  let notOffered   = false
  let mentioned    = null
  const t = text.toLowerCase()

  for (const svc of services) {
    if (t.includes(svc.name.toLowerCase())) { serviceValue = svc.name; break }
  }
  if (!serviceValue) {
    for (const svc of services) {
      const words = svc.name.toLowerCase().split(/\s+/).filter(w => w.length > 3)
      if (words.some(w => t.includes(w))) { serviceValue = svc.name; break }
    }
  }

  // Yes/no detection
  const yesWords = ["yes","yeah","yep","yup","ok","okay","sure","confirm","haan","ha","ji","theek","done","bilkul","correct","right"]
  const noWords  = ["no","nope","nahi","wrong","change","different","incorrect","cancel"]
  const isYes    = yesWords.some(w => t.trim() === w || t.trim().startsWith(w+" ") || t.trim().endsWith(" "+w))
  const isNo     = noWords.some(w =>  t.trim() === w || t.trim().startsWith(w+" ") || t.trim().endsWith(" "+w))

  return {
    service:      { value: serviceValue, confidence: serviceValue ? 0.8 : 0, not_offered: notOffered, mentioned },
    date:         { value: jsDate && !jsDate.ambiguous ? jsDate.iso : (bookingState?.date || null), confidence: 0.7, ambiguous: !!(jsDate?.ambiguous), resolved: jsDate },
    time:         { value: jsTime && !jsTime.ambiguous ? jsTime.time24 : (bookingState?.time || null), confidence: 0.7, ambiguous: !!(jsTime?.ambiguous), resolved: jsTime },
    confirmation: { value: isYes ? true : isNo ? false : null, confidence: (isYes||isNo) ? 0.85 : 0 },
    staff:        { value: null, confidence: 0 },
    budget:       { value: null, confidence: 0 },
    correction_detected: /actually|instead|change|wrong|not that/i.test(text),
    correction_field: /date|day|month/.test(t) ? "date" : /time|am|pm/.test(t) ? "time" : /service|want/.test(t) ? "service" : null
  }
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
  let content = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim()
  const match = content.match(/\{[\s\S]*\}/)
  if (!match) return null
  try { return JSON.parse(match[0]) } catch(e) { return null }
}
