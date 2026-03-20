diff --git a/lib/messaging/inbound-normalizer.js b/lib/messaging/inbound-normalizer.js
new file mode 100644
index 0000000000000000000000000000000000000000..af9c61d97cbc1d341b2878e32c883edd2e635711
--- /dev/null
+++ b/lib/messaging/inbound-normalizer.js
@@ -0,0 +1,59 @@
+export function normalizeInboundMessage(message = {}, contacts = []) {
+  const messageType = message?.type || "unknown"
+  const contact = contacts.find((c) => c.wa_id === message.from)
+  const fromNumber = message?.from || ""
+
+  let messageText = ""
+  let mediaCaption = ""
+
+  if (messageType === "text") messageText = message.text?.body || ""
+  else if (messageType === "button") messageText = message.button?.text || ""
+  else if (messageType === "interactive") {
+    messageText = message.interactive?.button_reply?.title
+      || message.interactive?.list_reply?.title
+      || ""
+  } else if (messageType === "image") mediaCaption = message.image?.caption || ""
+  else if (messageType === "video") mediaCaption = message.video?.caption || ""
+  else if (messageType === "document") mediaCaption = message.document?.caption || ""
+
+  const effectiveText = (messageText || mediaCaption || "").trim()
+  const isTextMessage = ["text", "button", "interactive"].includes(messageType) || !!mediaCaption
+  const isAudio = messageType === "audio"
+  const isMediaNoText = !isTextMessage && !isAudio && ["image", "video", "document", "sticker"].includes(messageType)
+
+  return {
+    messageId: message.id || null,
+    messageType,
+    fromNumber,
+    formattedPhone: fromNumber.replace(/[^0-9]/g, ""),
+    contactName: contact?.profile?.name || "Customer",
+    timestamp: message.timestamp ? new Date(parseInt(message.timestamp, 10) * 1000).toISOString() : new Date().toISOString(),
+    effectiveText,
+    isTextMessage,
+    isAudio,
+    isMediaNoText,
+    rawMessage: message,
+  }
+}
+
+export function normalizeConversationHistory(rawHistory = []) {
+  return rawHistory.reverse().map((m) => ({
+    role: m.direction === "inbound" ? "user" : "assistant",
+    content: String(m.message_text || "").trim(),
+  })).filter((m) => m.content && m.content !== "[media message]")
+}
+
+export function buildAlternatingHistory(history = []) {
+  if (!history.length) return []
+  const deduped = []
+
+  for (const msg of history) {
+    if (!deduped.length || deduped[deduped.length - 1].role !== msg.role) deduped.push(msg)
+    else deduped[deduped.length - 1] = msg
+  }
+
+  while (deduped.length && deduped[0].role !== "user") deduped.shift()
+  while (deduped.length && deduped[deduped.length - 1].role === "user") deduped.pop()
+
+  return deduped.slice(-12)
+}
