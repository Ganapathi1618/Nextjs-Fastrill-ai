// lib/ai/reply-engine.js
// Prompt 3 — generate ONLY the final reply
// No business logic. No date math. No booking decisions.
// Just human-sounding WhatsApp messages.

export async function generateReply({
  customerName,
  businessName,
  businessType,
  location,
  mapsLink,
  workingHours,
  aiInstructions,
  aiLanguage,
  description,
  services,
  intent,
  entities,
  stateContext,
  conversationHistory,
  customerMemory,
  retrievedChunks,
  actionTaken,
  replyDirective,
  cal
}) {
  const firstName = (customerName || "").split(" ")[0] || "there"

  const servicesText = services.length > 0
    ? services.map(s => {
        let l = `• ${s.name}: ₹${s.price}`
        if (s.duration) l += ` (${s.duration} min)`
        if (s.description) l += ` — ${s.description}`
        return l
      }).join("\n")
    : "No services configured yet."

  const memoryContext = customerMemory
    ? `Customer profile: prefers ${customerMemory.preferred_language||"English"}, ${customerMemory.customer_type||"new"} customer, sentiment tendency: ${customerMemory.sentiment_tendency||"neutral"}`
    : "New customer, no history."

  const toneGuide = getToneGuide(intent.sentiment, intent.urgency)

  const chunksText = retrievedChunks?.length > 0
    ? "\nRELEVANT INFO:\n" + retrievedChunks.map(c => `[${c.title}]: ${c.content}`).join("\n")
    : ""

  const lastMessages = conversationHistory.slice(-8).map(m =>
    `${m.role === "user" ? "Customer" : "AI"}: ${m.content}`
  ).join("\n")

  const prompt = `You are the WhatsApp AI assistant for *${businessName}*${businessType ? ` (${businessType})` : ""}${location ? `, ${location}` : ""}.

ABOUT: ${description || "A service business."}
HOURS: ${workingHours || "Not specified"}
${location ? `ADDRESS: ${location}` : ""}
${mapsLink ? `MAPS: ${mapsLink}` : ""}
${aiInstructions ? `OWNER INSTRUCTIONS: ${aiInstructions}` : ""}

SERVICES:
${servicesText}
${chunksText}

CUSTOMER: ${firstName}
LANGUAGE: ${aiLanguage || "English"}
${memoryContext}

CONVERSATION SO FAR:
${lastMessages || "No history"}

CURRENT SITUATION:
Intent: ${intent.primary_intent}${intent.secondary_intent ? " + " + intent.secondary_intent : ""}
Sentiment: ${intent.sentiment} | Urgency: ${intent.urgency}
${stateContext}
${actionTaken ? `ACTION TAKEN: ${actionTaken}` : ""}

YOUR DIRECTIVE: ${replyDirective}

TONE GUIDE: ${toneGuide}

RULES:
1. Reply in 2-3 lines MAX. This is WhatsApp — keep it short.
2. Sound like a warm, smart human receptionist. Not a bot.
3. Use ${firstName}'s name naturally — not every message, just when it feels right.
4. Match the customer's language (Hindi/Telugu/English/mix — whatever they use).
5. Never mention you are an AI unless directly asked.
6. Never repeat the same thing twice in a row.
7. When customer corrects you → apologize warmly first: "You're right, sorry! 😊"
8. When booking confirmed → celebrate warmly, keep it short.
9. When customer says thanks after booking → reference the booking: "See you on [date]! 😊"
10. When customer is angry → empathize first, help second. Stop upselling immediately.
11. Never dump the full booking confirmation again after it's already been sent.
12. Calendar for reference: TODAY = ${cal.today.full} (${cal.today.iso})

Return ONLY this JSON, nothing else:
{
  "reply": "the WhatsApp message to send",
  "tone": "warm|professional|empathetic|celebratory|apologetic",
  "handoff_suggested": false
}`

  try {
    const result = await callSarvam(prompt, `Generate reply for: "${replyDirective}"`, 400)

    // CRITICAL: Strip ALL think blocks before anything — prevents <think> leaking to customer
    const safeResult = stripAllThinkContent(result)

    // Try JSON parse first
    const parsed = parseJSON(safeResult)
    if (parsed?.reply && isCleanReply(parsed.reply)) return parsed

    // JSON failed — try extracting clean text
    const cleaned = extractCleanText(safeResult)
    if (cleaned && isCleanReply(cleaned)) return { reply: cleaned, tone: "warm", handoff_suggested: false }

    // Nothing clean — NEVER send raw Sarvam output — use deterministic fallback
    console.warn("[reply-engine] No clean reply extracted, using fallback")
  } catch(e) {
    console.error("[reply-engine] Error:", e.message)
  }

  return buildFallbackReply({ intent, entities, businessName, firstName, services, stateContext, actionTaken, cal })
}

function getToneGuide(sentiment, urgency) {
  if (sentiment === "angry")    return "Apologize immediately. Empathize. Be calm and fast. No emojis. No upselling."
  if (sentiment === "annoyed")  return "Acknowledge frustration. Be concise. Fix the issue directly."
  if (sentiment === "confused") return "Be very simple and clear. One thing at a time. No jargon."
  if (sentiment === "hesitant") return "Be warm and reassuring. Reduce options. Make it easy to decide."
  if (sentiment === "positive") return "Match their energy. Be friendly and enthusiastic."
  if (urgency    === "high")    return "Be fast and direct. Skip pleasantries. Solve immediately."
  return "Be warm, friendly, and professional."
}

function buildFallbackReply({ intent, entities, businessName, firstName, services, stateContext, actionTaken, cal }) {
  const sp = services.slice(0,3).map(s => s.name).join(", ")

  if (actionTaken === "booking_created") {
    const svc  = entities?.service?.value || "your appointment"
    const date = entities?.date?.value ? new Date(entities.date.value+"T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"}) : null
    const time = entities?.time?.value
    return {
      reply: `✅ *Booking Confirmed!*\n\n📋 ${svc}${date ? `\n📅 ${date}` : ""}${time ? `\n⏰ ${time}` : ""}\n\nSee you soon at *${businessName}*! 😊`,
      tone:  "celebratory",
      handoff_suggested: false
    }
  }
  if (actionTaken === "booking_confirmed_already") {
    const svc  = entities?.service?.value || "your appointment"
    const date = entities?.date?.value ? new Date(entities.date.value+"T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"}) : null
    return {
      reply: `You're all set, ${firstName}! 😊 *${svc}*${date ? ` on *${date}*` : ""} is confirmed. See you soon! 🌟`,
      tone:  "warm",
      handoff_suggested: false
    }
  }

  switch(intent.primary_intent) {
    case "greeting":
      return { reply: `Hi ${firstName}! 👋 Welcome to *${businessName}*!${sp?`\n\nWe offer: ${sp} and more.`:""}\n\nHow can I help? 😊`, tone: "warm", handoff_suggested: false }
    case "gratitude":
      return { reply: `You're welcome, ${firstName}! 😊 Have a wonderful day! 🌟`, tone: "warm", handoff_suggested: false }
    case "human_handoff":
      return { reply: `Of course! 🙏 I'll notify our team right away. Someone will reach out to you shortly, ${firstName}.`, tone: "professional", handoff_suggested: true }
    case "complaint":
      return { reply: `I'm really sorry about this, ${firstName} 😔 Let me make this right for you right away.`, tone: "empathetic", handoff_suggested: true }
    default:
      return { reply: `Thanks for reaching out to *${businessName}*! 😊${sp?`\n\nWe offer: ${sp}.`:""}\n\nHow can I help you today?`, tone: "warm", handoff_suggested: false }
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
      temperature: 0.5
    })
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data?.choices?.[0]?.message?.content || ""
}

// Strip ALL think content — handles complete, incomplete, and nested think blocks
function stripAllThinkContent(raw) {
  if (!raw) return ""
  let c = raw
  c = c.replace(/<think>[\s\S]*?<\/think>/gi, "")  // complete blocks
  c = c.replace(/<think>[\s\S]*/gi, "")              // incomplete/unclosed blocks
  c = c.replace(/<\/?think>/gi, "")                   // orphan tags
  return c.trim()
}

// Validate reply is actually clean customer-facing text
function isCleanReply(text) {
  if (!text || text.length < 3 || text.length > 800) return false
  const forbidden = ["<think>", "</think>", "okay, let", "okay, i", "let me tackle",
    "the user wants", "the customer is", "i need to", "first, i", "now, i",
    "so the reply", "the directive", "based on the", "i should", "i'll generate",
    "i will generate", "let me write", "looking at the"]
  const lower = text.toLowerCase()
  return !forbidden.some(f => lower.startsWith(f) || lower.includes(f + " "))
}

// Extract clean text from stripped Sarvam output
function extractCleanText(stripped) {
  if (!stripped) return null
  // Try JSON reply field first
  const jsonMatch = stripped.match(/"reply"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/)
  if (jsonMatch && jsonMatch[1]) return jsonMatch[1].replace(/\\n/g, "\n")
  // Use plain text if short enough and looks like a message
  const text = stripped.trim()
  if (text.length > 5 && text.length < 500 && !text.startsWith("{")) return text
  return null
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
