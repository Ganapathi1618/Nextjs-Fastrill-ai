diff --git a/lib/ai/memory-engine.js b/lib/ai/memory-engine.js
new file mode 100644
index 0000000000000000000000000000000000000000..20d3fb35c55fec682f86b54e6572a8d8847c14c2
--- /dev/null
+++ b/lib/ai/memory-engine.js
@@ -0,0 +1,71 @@
+export function parseConversationState(conversation) {
+  try {
+    if (!conversation?.booking_state) return null
+    return typeof conversation.booking_state === "string"
+      ? JSON.parse(conversation.booking_state)
+      : conversation.booking_state
+  } catch {
+    return null
+  }
+}
+
+export function buildConversationState({ existingState = null, intent, entities, lastUserGoal = "" } = {}) {
+  const merged = {
+    stage: deriveStage(intent?.primary, entities?.missingFields || [], entities?.confirmation),
+    primary_intent: intent?.primary || "out_of_scope",
+    secondary_intent: intent?.secondary || null,
+    service: entities?.service || existingState?.service || null,
+    date: entities?.date || existingState?.date || null,
+    time: entities?.time || existingState?.time || null,
+    missing_fields: entities?.missingFields || [],
+    last_user_goal: lastUserGoal || existingState?.last_user_goal || "",
+    confidence: entities?.confidence || existingState?.confidence || {},
+    interruption_stack: existingState?.interruption_stack || [],
+    handoff_required: false,
+  }
+
+  return merged
+}
+
+export async function loadCustomerMemory({ supabaseAdmin, userId, customerId, customerPhone }) {
+  if (!supabaseAdmin || !userId) return null
+  try {
+    const { data: bookings } = await supabaseAdmin
+      .from("bookings")
+      .select("service, booking_time, status, created_at")
+      .eq("user_id", userId)
+      .eq("customer_phone", customerPhone)
+      .order("created_at", { ascending: false })
+      .limit(10)
+
+    const completed = (bookings || []).filter((b) => ["confirmed", "completed"].includes(b.status))
+    const serviceCounts = {}
+    completed.forEach((b) => {
+      if (b.service) serviceCounts[b.service] = (serviceCounts[b.service] || 0) + 1
+    })
+
+    const preferredService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null
+    const customerType = completed.length >= 5 ? "vip" : completed.length >= 2 ? "returning" : "new"
+
+    return {
+      customer_id: customerId || null,
+      customer_type: customerType,
+      preferred_service: preferredService,
+      total_bookings: completed.length,
+      recent_bookings: completed.slice(0, 3),
+    }
+  } catch {
+    return null
+  }
+}
+
+function deriveStage(primaryIntent, missingFields, confirmation) {
+  if (primaryIntent === "booking_cancel") return "cancel_mode"
+  if (primaryIntent === "booking_reschedule") return "reschedule_mode"
+  if (confirmation === true && missingFields.length === 0) return "awaiting_execution"
+  if (missingFields.includes("service")) return "awaiting_service"
+  if (missingFields.includes("date")) return "awaiting_date"
+  if (missingFields.includes("time")) return "awaiting_time"
+  if (primaryIntent === "booking_new") return "awaiting_confirmation"
+  return "idle"
+}
