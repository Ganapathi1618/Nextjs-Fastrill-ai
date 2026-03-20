// lib/messaging/inbound-normalizer.js
// Extracts clean text + metadata from any WhatsApp message type

export function normalizeInbound(message, contacts) {
  const fromNumber  = message.from
  const messageType = message.type
  const messageId   = message.id
  const timestamp   = new Date(parseInt(message.timestamp) * 1000).toISOString()
  const contact     = (contacts || []).find(c => c.wa_id === fromNumber)
  const contactName = contact?.profile?.name || "Customer"
  const phone       = fromNumber.replace(/[^0-9]/g, "")

  let text         = ""
  let mediaCaption = ""
  let mediaType    = null

  if      (messageType === "text")        text         = message.text?.body || ""
  else if (messageType === "button")      text         = message.button?.text || ""
  else if (messageType === "interactive") {
    text = message.interactive?.button_reply?.title
        || message.interactive?.list_reply?.title || ""
  }
  else if (messageType === "image")    { mediaCaption = message.image?.caption    || ""; mediaType = "image" }
  else if (messageType === "video")    { mediaCaption = message.video?.caption    || ""; mediaType = "video" }
  else if (messageType === "document") { mediaCaption = message.document?.caption || ""; mediaType = "document" }
  else if (messageType === "audio")    { mediaType = "audio" }
  else if (messageType === "sticker")  { mediaType = "sticker" }

  const effectiveText = text || mediaCaption
  const isText        = ["text","button","interactive"].includes(messageType) || !!mediaCaption
  const isAudio       = messageType === "audio"
  const isMediaOnly   = !isText && !isAudio && !!mediaType

  return {
    fromNumber,
    messageType,
    messageId,
    timestamp,
    contactName,
    phone,
    text:         effectiveText,
    rawText:      text,
    mediaCaption,
    mediaType,
    isText,
    isAudio,
    isMediaOnly,
    hasText:      !!effectiveText,
  }
}
