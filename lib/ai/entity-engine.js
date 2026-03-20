diff --git a/lib/ai/entity-engine.js b/lib/ai/entity-engine.js
new file mode 100644
index 0000000000000000000000000000000000000000..e6708ba0072643df84e8a3cb35159c90249ab242
--- /dev/null
+++ b/lib/ai/entity-engine.js
@@ -0,0 +1,375 @@
+import { resolveCustomerDate, resolveCustomerTime } from "@/lib/booking/calendar-engine"
+import { matchService } from "@/lib/booking/booking-engine"
+
+// Prompt 2 — extract structured entities with confidence scores.
+// Never triggers execution — only provides candidates.
+export async function extractEntities({
+  text = "",
+  history = [],
+  services = [],
+  cal,
+  calendar,
+  workingHours = "",
+  bookingState = null,
+} = {}) {
+  const start = Date.now()
+  const activeCalendar = calendar || cal
+  const customerText = String(text || "").trim()
+
+  try {
+    const llmEntities = process.env.SARVAM_API_KEY
+      ? await extractEntitiesWithSarvam({
+          text: customerText,
+          history,
+          services,
+          cal: activeCalendar,
+          workingHours,
+          bookingState,
+        })
+      : null
+
+    const hydrated = hydrateEntities({
+      parsed: llmEntities,
+      text: customerText,
+      services,
+      cal: activeCalendar,
+      workingHours,
+      bookingState,
+    })
+
+    return { ...hydrated, latency: Date.now() - start }
+  } catch (error) {
+    console.error("[entity-engine] Error:", error.message)
+    return {
+      ...buildFallbackEntities(customerText, services, bookingState, activeCalendar, workingHours),
+      latency: Date.now() - start,
+    }
+  }
+}
+
+async function extractEntitiesWithSarvam({ text, history, services, cal, workingHours, bookingState }) {
+  const servicesLine = services.map((s) => `${s.name} (₹${s.price})`).join(", ") || "none"
+  const lastMessages = history.slice(-6).map((m) => (
+    `${m.role === "user" ? "Customer" : "AI"}: ${m.content}`
+  )).join("\n")
+
+  const stateDesc = bookingState
+    ? `Current state: service="${bookingState.service || "?"}", date="${bookingState.date || "?"}", time="${bookingState.time || "?"}"`
+    : "No booking in progress"
+
+  const prompt = `You are an entity extractor for a WhatsApp booking assistant.
+
+Services available: ${servicesLine}
+${stateDesc}
+Business working hours: ${workingHours || "not set"}
+Today is: ${cal?.today?.iso || "unknown"}
+
+Conversation:
+${lastMessages || "No previous messages"}
+
+Customer's latest message: "${text}"
+
+Extract entities and return ONLY valid JSON.
+
+For service matching:
+- Only use names from the services list above
+- If customer mentions something not in the list → service.value = null, service.not_offered = true, service.mentioned = "what they said"
+- Fuzzy match closely when possible
+- If no service mentioned → null
+
+For date:
+- Use context from conversation history if customer is continuing a booking
+- "tomorrow", "next monday" etc → resolve relative to today = ${cal?.today?.iso || "unknown"}
+- Just a number like "25" → ambiguous = true
+- No date mentioned → null
+
+For time:
+- Explicit "11am", "5pm" → extract and convert to HH:MM 24hr
+- Just "11" or "5" → ambiguous = true
+- "morning", "evening" → vague = true
+- No time mentioned → null
+
+For confirmation:
+- yes/yeah/ok/sure/confirm/haan/ji/bilkul → true
+- no/nope/nahi/wrong/change → false
+- not applicable → null
+
+Return this JSON:
+{
+  "service": {
+    "value": "exact service name from list or null",
+    "confidence": 0.0,
+    "ambiguous": false,
+    "not_offered": false,
+    "mentioned": null
+  },
+  "date": {
+    "value": "YYYY-MM-DD or null",
+    "confidence": 0.0,
+    "ambiguous": false,
+    "raw": null
+  },
+  "time": {
+    "value": "HH:MM 24hr or null",
+    "confidence": 0.0,
+    "ambiguous": false,
+    "vague": false,
+    "raw": null
+  },
+  "confirmation": {
+    "value": true,
+    "confidence": 0.0
+  },
+  "staff": {
+    "value": null,
+    "confidence": 0.0
+  },
+  "budget": {
+    "value": null,
+    "confidence": 0.0
+  },
+  "urgency_words": [],
+  "correction_detected": false,
+  "correction_field": null
+}`
+
+  const result = await callSarvam(prompt, text, 500)
+  const parsed = parseJSON(result)
+  if (!parsed) throw new Error("Invalid JSON from Sarvam")
+  return parsed
+}
+
+function hydrateEntities({ parsed, text, services, cal, workingHours, bookingState }) {
+  const base = parsed && typeof parsed === "object"
+    ? structuredCloneSafe(parsed)
+    : buildFallbackEntities(text, services, bookingState, cal, workingHours)
+
+  const jsDate = resolveCustomerDate(text, cal)
+  const jsTime = resolveCustomerTime(text, workingHours || "")
+  const matchedService = matchService(base?.service?.value || text, services)
+
+  const service = {
+    value: matchedService?.name || bookingState?.service || base?.service?.value || null,
+    confidence: matchedService ? 0.95 : clampConfidence(base?.service?.confidence, bookingState?.service ? 1 : 0),
+    ambiguous: !!base?.service?.ambiguous,
+    not_offered: !!base?.service?.not_offered,
+    mentioned: base?.service?.mentioned || null,
+    carried: !matchedService && !!bookingState?.service && !base?.service?.value,
+  }
+
+  const date = {
+    value: jsDate && !jsDate.ambiguous
+      ? jsDate.iso
+      : base?.date?.value || bookingState?.date || null,
+    confidence: jsDate
+      ? (jsDate.ambiguous ? 0.6 : 0.97)
+      : clampConfidence(base?.date?.confidence, bookingState?.date ? 1 : 0),
+    ambiguous: !!(jsDate?.ambiguous || base?.date?.ambiguous),
+    raw: base?.date?.raw || null,
+    resolved: jsDate || null,
+    carried: !jsDate && !!bookingState?.date && !base?.date?.value,
+  }
+
+  const time = {
+    value: jsTime && !jsTime.ambiguous
+      ? jsTime.time24
+      : base?.time?.value || bookingState?.time || null,
+    confidence: jsTime
+      ? (jsTime.ambiguous ? 0.55 : 0.96)
+      : clampConfidence(base?.time?.confidence, bookingState?.time ? 1 : 0),
+    ambiguous: !!(jsTime?.ambiguous || base?.time?.ambiguous),
+    vague: !!(jsTime?.ambiguous === "vague" || base?.time?.vague),
+    raw: base?.time?.raw || null,
+    display: jsTime?.display || base?.time?.display || null,
+    resolved: jsTime || null,
+    carried: !jsTime && !!bookingState?.time && !base?.time?.value,
+  }
+
+  const confirmation = normalizeConfirmation(base?.confirmation, text)
+  const correction = detectCorrection(text)
+
+  return {
+    service,
+    date,
+    time,
+    confirmation,
+    staff: normalizeField(base?.staff),
+    budget: normalizeBudget(base?.budget, text),
+    urgency_words: Array.isArray(base?.urgency_words) ? base.urgency_words : detectUrgencyWords(text),
+    correction_detected: base?.correction_detected ?? correction.detected,
+    correction_field: base?.correction_field || correction.field,
+    missingFields: buildMissingFields({ service: service.value, date: date.value, time: time.value }),
+    confidence: {
+      service: service.confidence,
+      date: date.confidence,
+      time: time.confidence,
+      confirmation: confirmation.confidence,
+    },
+  }
+}
+
+function buildFallbackEntities(text, services, bookingState, cal, workingHours) {
+  const jsDate = resolveCustomerDate(text, cal)
+  const jsTime = resolveCustomerTime(text, workingHours || "")
+  const serviceMatch = matchService(text, services)
+  const correction = detectCorrection(text)
+  const confirmation = normalizeConfirmation(null, text)
+
+  return {
+    service: {
+      value: serviceMatch?.name || bookingState?.service || null,
+      confidence: serviceMatch ? 0.82 : (bookingState?.service ? 1 : 0),
+      ambiguous: false,
+      not_offered: false,
+      mentioned: null,
+      carried: !serviceMatch && !!bookingState?.service,
+    },
+    date: {
+      value: jsDate && !jsDate.ambiguous ? jsDate.iso : (bookingState?.date || null),
+      confidence: jsDate ? (jsDate.ambiguous ? 0.6 : 0.78) : (bookingState?.date ? 1 : 0),
+      ambiguous: !!jsDate?.ambiguous,
+      raw: null,
+      resolved: jsDate || null,
+      carried: !jsDate && !!bookingState?.date,
+    },
+    time: {
+      value: jsTime && !jsTime.ambiguous ? jsTime.time24 : (bookingState?.time || null),
+      confidence: jsTime ? (jsTime.ambiguous ? 0.55 : 0.78) : (bookingState?.time ? 1 : 0),
+      ambiguous: !!jsTime?.ambiguous,
+      vague: jsTime?.ambiguous === "vague",
+      raw: null,
+      display: jsTime?.display || null,
+      resolved: jsTime || null,
+      carried: !jsTime && !!bookingState?.time,
+    },
+    confirmation,
+    staff: { value: null, confidence: 0 },
+    budget: normalizeBudget(null, text),
+    urgency_words: detectUrgencyWords(text),
+    correction_detected: correction.detected,
+    correction_field: correction.field,
+    missingFields: buildMissingFields({
+      service: serviceMatch?.name || bookingState?.service,
+      date: jsDate && !jsDate.ambiguous ? jsDate.iso : bookingState?.date,
+      time: jsTime && !jsTime.ambiguous ? jsTime.time24 : bookingState?.time,
+    }),
+    confidence: {
+      service: serviceMatch ? 0.82 : (bookingState?.service ? 1 : 0),
+      date: jsDate ? (jsDate.ambiguous ? 0.6 : 0.78) : (bookingState?.date ? 1 : 0),
+      time: jsTime ? (jsTime.ambiguous ? 0.55 : 0.78) : (bookingState?.time ? 1 : 0),
+      confirmation: confirmation.confidence,
+    },
+  }
+}
+
+async function callSarvam(systemContent, userContent, maxTokens) {
+  const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
+    method: "POST",
+    headers: {
+      "Content-Type": "application/json",
+      "api-subscription-key": process.env.SARVAM_API_KEY,
+    },
+    body: JSON.stringify({
+      model: "sarvam-m",
+      messages: [
+        { role: "system", content: systemContent },
+        { role: "user", content: userContent },
+      ],
+      max_tokens: maxTokens,
+      temperature: 0.1,
+    }),
+  })
+
+  const data = await res.json()
+  if (data.error) throw new Error(data.error.message)
+  return data?.choices?.[0]?.message?.content || ""
+}
+
+function parseJSON(raw) {
+  if (!raw) return null
+  const content = String(raw)
+    .replace(/<think>[\s\S]*?<\/think>/gi, "")
+    .replace(/```json\s*/gi, "")
+    .replace(/```\s*/gi, "")
+    .trim()
+
+  const match = content.match(/\{[\s\S]*\}/)
+  if (!match) return null
+
+  try {
+    return JSON.parse(match[0])
+  } catch {
+    return null
+  }
+}
+
+function normalizeConfirmation(field, text) {
+  if (field && typeof field.value === "boolean") {
+    return { value: field.value, confidence: clampConfidence(field.confidence, 0.85) }
+  }
+
+  const t = String(text || "").toLowerCase().trim()
+  const yesWords = ["yes", "yeah", "yep", "yup", "ok", "okay", "sure", "confirm", "haan", "ha", "ji", "theek", "done", "bilkul", "correct", "right"]
+  const noWords = ["no", "nope", "nahi", "wrong", "change", "different", "incorrect", "cancel"]
+
+  const isYes = yesWords.some((w) => t === w || t.startsWith(`${w} `) || t.endsWith(` ${w}`))
+  const isNo = noWords.some((w) => t === w || t.startsWith(`${w} `) || t.endsWith(` ${w}`))
+
+  return {
+    value: isYes ? true : isNo ? false : null,
+    confidence: isYes || isNo ? 0.85 : 0,
+  }
+}
+
+function normalizeField(field) {
+  return {
+    value: field?.value || null,
+    confidence: clampConfidence(field?.confidence, 0),
+  }
+}
+
+function normalizeBudget(field, text) {
+  const detected = String(text || "").match(/₹\s?(\d+)|rs\.?\s?(\d+)|under\s?(\d+)/i)
+  const value = field?.value || detected?.[1] || detected?.[2] || detected?.[3] || null
+  return {
+    value: value ? Number(value) : null,
+    confidence: value ? clampConfidence(field?.confidence, 0.72) : 0,
+  }
+}
+
+function detectUrgencyWords(text) {
+  const words = ["urgent", "asap", "today", "right now", "immediately", "soon"]
+  const lower = String(text || "").toLowerCase()
+  return words.filter((word) => lower.includes(word))
+}
+
+function detectCorrection(text) {
+  const lower = String(text || "").toLowerCase()
+  const detected = /actually|instead|change|wrong|not that|correction|rather/.test(lower)
+  const field = /date|day|month|tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday/.test(lower)
+    ? "date"
+    : /time|am|pm|morning|evening|night|afternoon|\b\d{1,2}(:\d{2})?\b/.test(lower)
+      ? "time"
+      : /service|booking|spa|facial|hair|cleanup|massage|consultation/.test(lower)
+        ? "service"
+        : null
+
+  return { detected, field }
+}
+
+function buildMissingFields({ service, date, time }) {
+  const missing = []
+  if (!service) missing.push("service")
+  if (!date) missing.push("date")
+  if (!time) missing.push("time")
+  return missing
+}
+
+function clampConfidence(value, fallback = 0) {
+  const num = typeof value === "number" ? value : fallback
+  return Math.max(0, Math.min(1, num))
+}
+
+function structuredCloneSafe(value) {
+  return JSON.parse(JSON.stringify(value))
+}
