// lib/messaging/normalizer.js
function normalizeMessage(message, contacts) {
  const from        = message.from
  const type        = message.type
  const messageId   = message.id
  const timestamp   = new Date(parseInt(message.timestamp) * 1000).toISOString()
  const contact     = (contacts || []).find(c => c.wa_id === from)
  const contactName = contact?.profile?.name || "Customer"
  const phone       = from.replace(/[^0-9]/g, "")

  let text = "", caption = "", mediaType = null

  if      (type === "text")        text    = message.text?.body || ""
  else if (type === "button")      text    = message.button?.text || ""
  else if (type === "interactive") text    = message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || ""
  else if (type === "image")       { caption = message.image?.caption    || ""; mediaType = "image"    }
  else if (type === "video")       { caption = message.video?.caption    || ""; mediaType = "video"    }
  else if (type === "document")    { caption = message.document?.caption || ""; mediaType = "document" }
  else if (type === "audio")       mediaType = "audio"
  else if (type === "sticker")     mediaType = "sticker"

  const effectiveText = text || caption
  const isText        = ["text","button","interactive"].includes(type) || !!caption
  const isMediaOnly   = !isText && !!mediaType

  // Handle quoted/replied messages — append context so AI understands the reference
  let quotedText = ""
  if (message.context?.quoted_message?.text?.body) {
    quotedText = message.context.quoted_message.text.body
  }
  // Some WhatsApp payloads put quoted content here
  if (message.text?.context?.quoted_message) {
    quotedText = message.text.context.quoted_message
  }

  // If customer replied to a message, prepend "[Replying to: ...]" so AI has context
  const fullText = quotedText
    ? "[Replying to: " + quotedText.substring(0, 80) + "...] " + effectiveText
    : effectiveText

  return { from, phone, type, messageId, timestamp, contactName, text, caption, effectiveText: fullText || effectiveText, isText, isMediaOnly, mediaType, raw: message }
}

module.exports = { normalizeMessage }
