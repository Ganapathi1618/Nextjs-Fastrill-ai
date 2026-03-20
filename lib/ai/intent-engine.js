diff --git a/lib/ai/intent-engine.js b/lib/ai/intent-engine.js
new file mode 100644
index 0000000000000000000000000000000000000000..cd18b874771ad80e046825b04c2d5dae164cde8a
--- /dev/null
+++ b/lib/ai/intent-engine.js
@@ -0,0 +1,72 @@
+const INTENT_PATTERNS = [
+  { primary: "booking_lookup", patterns: [/did you book/i, /my booking/i, /my appointment/i, /check my booking/i, /what did i book/i] },
+  { primary: "booking_reschedule", patterns: [/reschedule/i, /change.*time/i, /change.*date/i, /shift.*booking/i, /postpone/i, /changed my mind/i, /move it to/i, /schedule it (?:on|for|in)/i, /can you please schedule/i, /instead.*(?:date|day|time)/i] },
+  { primary: "booking_cancel", patterns: [/cancel/i, /drop.*booking/i, /remove.*appointment/i] },
+  { primary: "booking_confirm", patterns: [/^yes$/i, /^confirm$/i, /^book it$/i, /^okay book/i, /^go ahead$/i] },
+  { primary: "booking_new", patterns: [/book/i, /appointment/i, /schedule/i, /reserve/i] },
+  { primary: "pricing", patterns: [/price/i, /cost/i, /charges/i, /how much/i, /pricing/i, /menu/i] },
+  { primary: "service_inquiry", patterns: [/services/i, /what do you offer/i, /available/i, /offer/i] },
+  { primary: "location_query", patterns: [/where/i, /location/i, /address/i, /map/i] },
+  { primary: "hours_query", patterns: [/timing/i, /hours/i, /open/i, /close/i] },
+  { primary: "human_handoff", patterns: [/human/i, /person/i, /staff/i, /owner/i, /call me/i] },
+  { primary: "gratitude", patterns: [/thanks/i, /thank you/i] },
+  { primary: "greeting", patterns: [/^hi$/i, /^hello$/i, /^hey$/i, /^hii$/i, /^namaste$/i] },
+]
+
+export function detectSentiment(text = "") {
+  const t = String(text).toLowerCase()
+  if (/angry|frustrated|bad service|useless|worst|not happy|annoyed/.test(t)) return { sentiment: "negative", urgency: "high", confidence: 0.82 }
+  if (/urgent|asap|immediately|right now/.test(t)) return { sentiment: "neutral", urgency: "high", confidence: 0.78 }
+  if (/please|could you|can you/.test(t)) return { sentiment: "neutral", urgency: "medium", confidence: 0.62 }
+  if (/great|awesome|perfect|love|nice/.test(t)) return { sentiment: "positive", urgency: "low", confidence: 0.7 }
+  return { sentiment: "neutral", urgency: "medium", confidence: 0.5 }
+}
+
+export function classifyIntent({ text = "", bookingState = null, existingBookingInfo = null } = {}) {
+  const clean = String(text || "").trim()
+  const lower = clean.toLowerCase()
+
+  for (const rule of INTENT_PATTERNS) {
+    if (rule.patterns.some((pattern) => pattern.test(clean))) {
+      return {
+        primary: rule.primary,
+        secondary: deriveSecondaryIntent(lower),
+        confidence: deriveConfidence(rule.primary, lower, bookingState, existingBookingInfo),
+        reason: `Matched rule for ${rule.primary}`,
+      }
+    }
+  }
+
+  if (bookingState && Object.values(bookingState).some(Boolean)) {
+    return {
+      primary: /change|reschedule|shift|move|instead|changed my mind/.test(lower) ? "booking_reschedule" : "booking_new",
+      secondary: "state_resume",
+      confidence: 0.76,
+      reason: "Conversation has active booking state",
+    }
+  }
+
+  return {
+    primary: "out_of_scope",
+    secondary: null,
+    confidence: 0.35,
+    reason: "No intent rule matched",
+  }
+}
+
+function deriveSecondaryIntent(lower) {
+  if (/price|cost|charges|how much/.test(lower)) return "pricing"
+  if (/book|appointment|schedule/.test(lower)) return "booking"
+  if (/where|location|address/.test(lower)) return "location"
+  if (/time|timing|hours|open|close/.test(lower)) return "hours"
+  return null
+}
+
+function deriveConfidence(primary, lower, bookingState, existingBookingInfo) {
+  if (primary === "booking_lookup" && existingBookingInfo) return 0.95
+  if (["booking_new", "booking_reschedule", "booking_cancel", "pricing"].includes(primary)) return 0.88
+  if (primary === "booking_confirm" && bookingState) return 0.84
+  if (primary === "greeting" || primary === "gratitude") return 0.93
+  if (lower.split(/\s+/).length <= 2) return 0.58
+  return 0.72
+}
