diff --git a/lib/policy/policy-engine.js b/lib/policy/policy-engine.js
new file mode 100644
index 0000000000000000000000000000000000000000..8af0c4c844305bd9170e5e4008e7e540cfadede8
--- /dev/null
+++ b/lib/policy/policy-engine.js
@@ -0,0 +1,30 @@
+export function evaluatePolicies({ text = "", biz = {}, intent, entities, customerMemory } = {}) {
+  const flags = {
+    handoffRequired: false,
+    reason: null,
+    replyOverride: null,
+  }
+
+  const lower = String(text || "").toLowerCase()
+
+  if (/refund|legal|doctor|medical emergency/.test(lower)) {
+    flags.handoffRequired = true
+    flags.reason = "Sensitive topic requires human support"
+  }
+
+  if (/human|owner|manager|staff/.test(lower)) {
+    flags.handoffRequired = true
+    flags.reason = "Customer requested human handoff"
+  }
+
+  if (entities?.timeCandidate?.ambiguous === "outofhours") {
+    flags.replyOverride = `We're open ${biz?.working_hours || "during business hours"} 😊 Please share a time within those hours and I'll help you book it.`
+  }
+
+  if (customerMemory?.customer_type === "vip" && intent?.primary === "complaint") {
+    flags.handoffRequired = true
+    flags.reason = "VIP complaint should be handled by a human"
+  }
+
+  return flags
+}
