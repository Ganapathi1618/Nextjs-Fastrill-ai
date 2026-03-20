diff --git a/lib/ai/reply-engine.js b/lib/ai/reply-engine.js
new file mode 100644
index 0000000000000000000000000000000000000000..1c167ac0c96bf5e70a93ccf759333784c8e8ee80
--- /dev/null
+++ b/lib/ai/reply-engine.js
@@ -0,0 +1,87 @@
+import { describeExistingBooking } from "@/lib/booking/booking-engine"
+import { formatBookingDate } from "@/lib/booking/calendar-engine"
+
+export function buildFallbackReply({
+  text = "",
+  firstName = "there",
+  businessName = "our business",
+  activeServices = [],
+  state = null,
+  existingBookingInfo = null,
+  policy = null,
+}) {
+  if (policy?.replyOverride) {
+    return { reply: policy.replyOverride, action: "none", booking: {} }
+  }
+
+  const lower = String(text || "").toLowerCase().trim()
+  const servicesList = activeServices.map((s) => `• *${s.name}* — ₹${s.price}`).join("\n")
+  const topServices = activeServices.slice(0, 3).map((s) => s.name).join(", ")
+
+  if (existingBookingInfo) {
+    const desc = describeExistingBooking(existingBookingInfo)
+    return {
+      reply: `Yes ${firstName}! 😊 Here's your booking:\n\n📋 Service: ${desc.service}\n📅 Date: ${desc.date || existingBookingInfo.booking_date}${desc.time ? `\n⏰ Time: ${desc.time}` : ""}\n\nSee you soon! 🙏`,
+      action: "none",
+      booking: {},
+    }
+  }
+
+  if (/changed my mind|reschedule|move it|shift it|schedule it (?:on|for|in)|instead/i.test(lower) && (state?.service || existingBookingInfo)) {
+    const serviceName = state?.service || existingBookingInfo?.service || "your session"
+    return {
+      reply: `Of course ${firstName} 😊 I can reschedule *${serviceName}*. What new date would you like?`,
+      action: "none",
+      booking: {},
+    }
+  }
+
+  if (state?.service && !state?.date) {
+    return { reply: `Perfect, ${firstName} 😊 What date works for your *${state.service}*?`, action: "none", booking: {} }
+  }
+  if (state?.service && state?.date && !state?.time) {
+    return { reply: `Great choice! *${state.service}* on *${formatBookingDate(state.date) || state.date}*. What time would you like? ⏰`, action: "none", booking: {} }
+  }
+  if (state?.service && state?.date && state?.time) {
+    const formattedDate = formatBookingDate(state.date) || state.date
+    return {
+      reply: `Shall I confirm *${state.service}* on *${formattedDate}* at *${state.time}*? ✅`,
+      action: "confirm_booking",
+      booking: { service: state.service, date: state.date, time: state.time },
+    }
+  }
+
+  if (/^(hi|hello|hey|hii|namaste)/i.test(lower)) {
+    return {
+      reply: `Hi ${firstName}! 👋 Welcome to *${businessName}*!${topServices ? `\n\nWe offer: ${topServices}.` : ""}\n\nHow can I help today? 😊`,
+      action: "none",
+      booking: {},
+    }
+  }
+
+  if (/price|cost|charges|pricing|menu|services|offer|how much/i.test(lower)) {
+    return {
+      reply: servicesList ? `*${businessName} Services*\n\n${servicesList}\n\nWant me to help you book one? 😊` : `Please contact us for pricing 🙏`,
+      action: "none",
+      booking: {},
+    }
+  }
+
+  if (/where|location|address|map/i.test(lower)) {
+    return {
+      reply: `Of course ${firstName} 😊 Please share your preferred branch or ask in Settings/Business info if location is configured.`,
+      action: "none",
+      booking: {},
+    }
+  }
+
+  if (/thanks|thank you/i.test(lower)) {
+    return { reply: `You're welcome, ${firstName}! 😊`, action: "none", booking: {} }
+  }
+
+  return {
+    reply: `Thanks for messaging *${businessName}* 😊${topServices ? `\n\nWe offer ${topServices}.` : ""}\n\nWould you like pricing, available services, or help with booking?`,
+    action: "none",
+    booking: {},
+  }
+}
