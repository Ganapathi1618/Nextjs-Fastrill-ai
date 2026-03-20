diff --git a/lib/ai/orchestrator.js b/lib/ai/orchestrator.js
new file mode 100644
index 0000000000000000000000000000000000000000..fd4b27d63ede5060e5ed3bd863bb3a0500796022
--- /dev/null
+++ b/lib/ai/orchestrator.js
@@ -0,0 +1,94 @@
+import { buildConversationState, loadCustomerMemory, parseConversationState } from "@/lib/ai/memory-engine"
+import { classifyIntent, detectSentiment } from "@/lib/ai/intent-engine"
+import { extractEntities } from "@/lib/ai/entity-engine"
+import { buildFallbackReply } from "@/lib/ai/reply-engine"
+import { buildCalendarContext } from "@/lib/booking/calendar-engine"
+import { evaluatePolicies } from "@/lib/policy/policy-engine"
+
+export async function orchestrateInboundMessage({
+  supabaseAdmin,
+  conversation,
+  customer,
+  userId,
+  text,
+  biz,
+  activeServices,
+  conversationHistory,
+  existingBookingInfo,
+  timeZone = "Asia/Kolkata",
+}) {
+  const bookingState = parseConversationState(conversation)
+  const calendar = buildCalendarContext({ timeZone })
+  const sentiment = detectSentiment(text)
+  const intent = classifyIntent({ text, bookingState, existingBookingInfo })
+  const entities = await extractEntities({
+    text,
+    history: conversationHistory || [],
+    services: activeServices,
+    calendar,
+    workingHours: biz?.working_hours || "",
+    bookingState,
+  })
+
+  const customerMemory = await loadCustomerMemory({
+    supabaseAdmin,
+    userId,
+    customerId: customer?.id,
+    customerPhone: customer?.phone,
+  })
+
+  const policy = evaluatePolicies({
+    text,
+    biz,
+    intent,
+    entities,
+    customerMemory,
+  })
+
+  const state = buildConversationState({
+    existingState: bookingState,
+    intent,
+    entities,
+    lastUserGoal: text,
+  })
+
+  const firstName = (customer?.name || "there").split(" ")[0] || "there"
+  const fallback = buildFallbackReply({
+    text,
+    firstName,
+    businessName: biz?.business_name || "our business",
+    activeServices,
+    state,
+    existingBookingInfo,
+    policy,
+  })
+
+  const action = deriveAction(intent, entities, policy)
+  return {
+    reply: fallback.reply,
+    action,
+    booking: {
+      service: state.service || null,
+      date: state.date || null,
+      time: state.time || null,
+    },
+    state,
+    intent,
+    entities,
+    sentiment,
+    policy,
+    customerMemory,
+    calendar,
+    conversationHistory,
+  }
+}
+
+function deriveAction(intent, entities, policy) {
+  if (policy?.handoffRequired) return "none"
+  if (intent.primary === "booking_cancel") return "cancel"
+  if (intent.primary === "booking_reschedule") return "reschedule"
+  if (intent.primary === "booking_confirm" && entities.missingFields.length === 0) return "create_booking"
+  if (intent.primary === "booking_new" && entities.missingFields.length === 0) return "confirm_booking"
+  if (intent.primary === "booking_new") return "update_state"
+  return "none"
+}
