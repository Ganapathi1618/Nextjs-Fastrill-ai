// lib/ai/fallback-engine.js — v2.1
// FIX 1: Location/hours intent only fires when customer is ASKING for it,
//         not when they merely mention the word "location" or "time"
// FIX 2: Language detection uses script/structure, not mention of language name

function getFallbackReply({ intent, state, biz, services, firstName, message }) {
  const name     = firstName || "there"
  const bizName  = biz?.business_name || "us"
  const location = biz?.location      || ""
  const hours    = biz?.working_hours || ""
  const mapsLink = biz?.maps_link     || ""
  const svcPrev  = (services||[]).slice(0,3).map(s => s.name).join(", ")
  const primary  = intent?.primary_intent || "out_of_scope"
  const sentiment= intent?.sentiment      || "neutral"
  const stage    = state?.stage           || "idle"
  const isUpset  = sentiment === "angry" || sentiment === "annoyed"
  const msg      = (message||"").toLowerCase().trim()

  // Language detection — check script, not mentions of language names
  // "Why you using telugu?" is English — it mentions "telugu" but is written in Latin script
  const isTeluguScript  = /[\u0C00-\u0C7F]/.test(message)
  const isHindiScript   = /[\u0900-\u097F]/.test(message)
  const isTamilScript   = /[\u0B80-\u0BFF]/.test(message)
  const isNonLatinScript = isTeluguScript || isHindiScript || isTamilScript

  // Language question — only when asking if we speak a language
  // NOT when a customer mentions a language name in a complaint
  const langQuestion = /^(do you (know|speak|understand)|can you (speak|understand))\s+(telugu|hindi|tamil|kannada|malayalam|marathi|bengali|gujarati|punjabi)/i.test(msg)
  if (langQuestion) {
    return "Yes " + name + "! 😊 I can communicate in Telugu, Hindi, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi and English.\n\nHow can I help you? / మీకు ఎలా సహాయం చేయగలను?"
  }

  if (isUpset && (primary === "complaint" || primary === "frustration")) {
    return "I'm really sorry, " + name + " 😔 Let me help you right away.\n\nWhat exactly can I assist you with?"
  }

  if (primary === "greeting") {
    return "Hi " + name + "! 👋 Welcome to *" + bizName + "*!" +
      (svcPrev ? "\n\nWe offer: " + svcPrev + " and more." : "") +
      "\n\nHow can I help you today? 😊"
  }

  if (primary === "frustration") {
    return "I understand " + name + ", let me help! 😊\n\nWhat would you like to know or do?"
  }

  if (primary === "pricing" || primary === "service_inquiry") {
    if (services?.length) {
      const list = services.slice(0,5).map(s =>
        "• *" + s.name + "* — ₹" + s.price + (s.duration ? " (" + s.duration + " min)" : "")
      ).join("\n")
      return "*" + bizName + " Services*\n\n" + list + (isUpset ? "" : "\n\nWant to book any? 😊")
    }
    return "I'll get our latest pricing for you shortly! 😊"
  }

  // Location — only fire when customer is genuinely asking for it
  // NOT when they say "who asked the location" or "why location"
  if (primary === "location_query") {
    if (location && mapsLink) return "📍 *" + bizName + "* is at:\n" + location + "\n\n🗺️ " + mapsLink + "\n\nSee you soon! 😊"
    if (location)             return "📍 We're at: *" + location + "*"
    return "I'll share our location shortly! 📍"
  }

  if (primary === "hours_query") {
    return hours
      ? "⏰ *" + bizName + "* is open:\n\n" + hours + "\n\nAnything else? 😊"
      : "I'll confirm our hours shortly! ⏰"
  }

  if (primary === "booking_reschedule") {
    if (!state?.date && !state?.time) return "Sure " + name + "! 📅 What new date and time works for you?"
    if (state?.date  && !state?.time) return "Got the date! ⏰ What time works for you?"
    if (!state?.date &&  state?.time) return "Got the time! 📅 Which date works for you?"
    return "Got it! Rescheduling to " + state.date + " at " + state.time + " — shall I confirm? ✅"
  }

  if (primary === "booking_cancel") {
    if (isUpset) return "I understand, and I'm sorry 🙏 I'll cancel your booking right away.\n\nIs there anything else I can help with?"
    return "I understand you want to cancel 😔\n\nWould you prefer to reschedule instead? We'd love to have you at *" + bizName + "*!"
  }

  if (primary === "complaint") {
    return "I'm really sorry to hear this, " + name + " 😔 Your feedback matters to us.\n\nI'm flagging this to our team right away — someone will reach out to you shortly. 🙏"
  }

  if (primary === "human_handoff") {
    return "Of course! 🙌 I'll notify our team right away and someone will be with you shortly.\n\nIs there anything specific you'd like me to mention?"
  }

  if (primary === "gratitude") {
    return "You're welcome! 😊 Looking forward to seeing you at *" + bizName + "*!"
  }

  if (primary === "recommendation_request") {
    if (services?.length) {
      const top = services.slice(0,2).map(s =>
        "• *" + s.name + "* — ₹" + s.price + (s.description ? " (" + s.description + ")" : "")
      ).join("\n")
      return "Here are my top picks for you:\n\n" + top + "\n\nWant to book one? 😊"
    }
  }

  if (primary === "booking_new" || primary === "booking_confirm" || stage !== "idle") {
    if (!state?.service) return svcPrev
      ? "I'd love to help you book! 😊\n\nWe offer: " + svcPrev + ".\n\nWhich service would you like?"
      : "I'd love to help you book! 😊 Which service are you interested in?"
    if (!state?.date) return "Great choice! 📅 What date works for your *" + state.service + "*?"
    if (!state?.time) return "Almost there! ⏰ What time works for you on " + state.date + "?"
    return "Shall I confirm your booking for *" + state.service + "* on " + state.date + (state.time ? " at " + state.time : "") + "? ✅"
  }

  // Catch-all — never dump services, never mention location unprompted
  return "Hi " + name + "! 😊 How can I help you today? I can assist with bookings, pricing, or any questions about *" + bizName + "*."
}

module.exports = { getFallbackReply }
