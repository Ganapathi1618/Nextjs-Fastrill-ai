// lib/policy/policy-engine.js
// Deterministic rules — LLM never invents policy

export function applyPolicy({ intent, entities, biz, bookingState, customerMemory }) {

  // ── Handoff triggers ───────────────────────────────────────────────
  const handoffTriggers = []
  if (intent.primary_intent === "human_handoff")          handoffTriggers.push("Customer requested human")
  if (intent.primary_intent === "complaint" && intent.sentiment === "angry") handoffTriggers.push("Angry complaint")
  if (intent.sentiment === "angry" && intent.urgency === "high")             handoffTriggers.push("High urgency anger")
  if (customerMemory?.last_complaint_at) {
    const daysSince = (Date.now() - new Date(customerMemory.last_complaint_at)) / 86400000
    if (daysSince < 7) handoffTriggers.push("Recent complaint history")
  }

  // ── Business hours check ───────────────────────────────────────────
  const isWithinHours = checkBusinessHours(biz?.working_hours)

  // ── Booking policy ─────────────────────────────────────────────────
  const bookingPolicy = {
    requiresService:      true,
    requiresDate:         true,
    requiresTime:         isTimedService(entities?.service?.value, biz),
    minConfidence:        0.75,
    allowPartialBooking:  false,
  }

  // ── Missing fields ─────────────────────────────────────────────────
  const missing = []
  if (!entities?.service?.value)                            missing.push("service")
  if (!entities?.date?.value)                               missing.push("date")
  if (bookingPolicy.requiresTime && !entities?.time?.value) missing.push("time")

  // ── Confidence check ───────────────────────────────────────────────
  const intentConfident  = intent.confidence >= bookingPolicy.minConfidence
  const serviceConfident = (entities?.service?.confidence || 0) >= 0.75
  const dateConfident    = !entities?.date?.ambiguous && !!entities?.date?.value
  const timeConfident    = !entities?.time?.ambiguous && !!entities?.time?.value

  // ── Ready to book? ─────────────────────────────────────────────────
  const readyToBook = (
    intentConfident &&
    !!entities?.service?.value &&
    serviceConfident &&
    !!entities?.date?.value &&
    dateConfident &&
    (!bookingPolicy.requiresTime || (!!entities?.time?.value && timeConfident))
  )

  // ── Ready to confirm? (waiting for yes/no) ─────────────────────────
  const awaitingConfirmation = bookingState?.stage === "awaiting_confirmation"

  return {
    handoffRequired:      handoffTriggers.length > 0,
    handoffTriggers,
    handoffPriority:      handoffTriggers.some(t => t.includes("Angry")) ? "high" : "medium",
    isWithinHours,
    bookingPolicy,
    missing,
    readyToBook,
    awaitingConfirmation,
    intentConfident,
    serviceConfident,
    dateConfident,
    timeConfident,
    canProceed: intentConfident && !entities?.service?.not_offered,
  }
}

function checkBusinessHours(workingHours) {
  if (!workingHours) return true // assume open if not set
  const wh = workingHours.toLowerCase()
  if (wh.includes("24/7") || wh.includes("always open")) return true

  const now     = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
  const hour    = now.getHours()
  const dayName = now.toLocaleDateString("en-IN", { weekday:"long", timeZone:"Asia/Kolkata" }).toLowerCase()

  // Check if day is mentioned as closed
  if (wh.includes("sunday closed") && dayName === "sunday") return false
  if (wh.includes("saturday closed") && dayName === "saturday") return false

  // Parse hours
  const ampm = workingHours.match(/(\d{1,2})(?:[:.]\d{2})?\s*(am|pm)/gi) || []
  if (ampm.length >= 2) {
    const hours = ampm.map(h => {
      const m = h.match(/(\d{1,2})(?:[:.]\d{2})?\s*(am|pm)/i)
      if (!m) return null
      let hr = parseInt(m[1])
      if (m[2].toLowerCase() === "pm" && hr < 12) hr += 12
      if (m[2].toLowerCase() === "am" && hr === 12) hr = 0
      return hr
    }).filter(n => n !== null)
    const openHour  = Math.min(...hours)
    const closeHour = Math.max(...hours)
    return hour >= openHour && hour <= closeHour
  }
  return true
}

function isTimedService(serviceName, biz) {
  // Packages don't need time slots
  // This is a simple check — can be enhanced with DB lookup
  return true // default: all services need time
}

// Build reply directive based on policy + intent + entities
export function buildReplyDirective({ intent, entities, policy, bookingState, biz, customerMemory, cal }) {
  const { primary_intent, secondary_intent, sentiment } = intent
  const { missing, readyToBook, awaitingConfirmation, handoffRequired } = policy

  // ── Post-booking — already confirmed ──────────────────────────────
  if (bookingState?.confirmed) {
    if (primary_intent === "gratitude")
      return `Customer said thanks after booking is confirmed. Reply warmly and reference their booking (${bookingState.service} on ${bookingState.date}). Keep it short — see you soon type message.`
    if (primary_intent === "booking_lookup" || /update|any update|booked/i.test(intent.reason||""))
      return `Customer asking about their booking. Remind them warmly: ${bookingState.service} confirmed for ${bookingState.date}${bookingState.time ? " at "+bookingState.time : ""}. Ask if anything else needed.`
    return `Booking already confirmed for ${bookingState.service}. Respond naturally to: "${intent.reason||"their message"}". Don't repeat the full booking block.`
  }

  // ── Handoff ────────────────────────────────────────────────────────
  if (handoffRequired)
    return `Customer needs human attention (reason: ${policy.handoffTriggers.join(", ")}). Apologize warmly, tell them someone will reach out shortly. Be empathetic.`

  // ── Angry/complaint ────────────────────────────────────────────────
  if (sentiment === "angry" || sentiment === "annoyed")
    return `Customer is ${sentiment}. Apologize first. Empathize. Then offer to help fix the issue. Keep it short and genuine. No emojis if very angry.`

  // ── Service not offered ────────────────────────────────────────────
  if (entities?.service?.not_offered)
    return `Customer asked for "${entities.service.mentioned}" which we don't offer. Tell them warmly we don't have that, then show what we DO offer with prices. Ask if they'd like to book one of ours.`

  // ── Recommendation ─────────────────────────────────────────────────
  if (primary_intent === "recommendation_request")
    return `Customer wants a recommendation. Look at our services and suggest the best fit based on what they said. Be like a helpful expert, not a menu.`

  // ── Human handoff ─────────────────────────────────────────────────
  if (primary_intent === "human_handoff")
    return `Customer wants to speak to a human. Acknowledge warmly, say the team will be notified and someone will reach out shortly.`

  // ── Greeting ──────────────────────────────────────────────────────
  if (primary_intent === "greeting")
    return `Greet the customer warmly. Mention business name. List top 3 services briefly. Ask how you can help.`

  // ── Pricing ──────────────────────────────────────────────────────
  if (primary_intent === "pricing" || primary_intent === "service_inquiry")
    return `Customer wants to know about services/pricing. List all services with prices nicely. Offer to book.`

  // ── Location ─────────────────────────────────────────────────────
  if (primary_intent === "location_query")
    return `Share location: ${biz?.location || "not set"}. Include maps link if available: ${biz?.maps_link || "not set"}.`

  // ── Hours ────────────────────────────────────────────────────────
  if (primary_intent === "hours_query")
    return `Share working hours: ${biz?.working_hours || "not set"}.`

  // ── Gratitude ───────────────────────────────────────────────────
  if (primary_intent === "gratitude")
    return `Customer said thanks. Reply warmly and naturally. Short and sweet.`

  // ── Booking flow ─────────────────────────────────────────────────
  if (["booking_new","booking_confirm","booking_reschedule","booking_cancel"].includes(primary_intent)) {

    if (primary_intent === "booking_cancel")
      return `Customer wants to cancel. Acknowledge, ask if they'd prefer to reschedule instead. Be warm.`

    if (primary_intent === "booking_reschedule")
      return `Customer wants to reschedule. Ask for their preferred new date${entities?.date?.value ? " (date: "+entities.date.value+" already captured)" : ""}${entities?.time?.value ? " and time: "+entities.time.value+" already captured" : ""}.`

    // Check ambiguity first
    if (entities?.date?.ambiguous && entities?.date?.resolved) {
      const d = entities.date.resolved
      if (d.justNumber) return `Customer said "${d.num}" for date. Confirm warmly: "Did you mean ${d.short}? 😊"`
      if (d.options)    return `Customer said "this weekend". Ask: Saturday (${d.options[0]?.short}) or Sunday (${d.options[1]?.short})?`
      return `Date seems ambiguous. Confirm: "Did you mean ${d.short}? 😊"`
    }

    if (entities?.time?.ambiguous === true) {
      const r = entities.time.resolved
      return `Time is ambiguous. Customer said "${r?.hour}". Ask: "${r?.hour} AM or ${r?.hour} PM? 😊"`
    }
    if (entities?.time?.ambiguous === "vague") {
      const r = entities.time.resolved
      const sug = { morning:"10 AM or 11 AM", afternoon:"1 PM, 2 PM, or 3 PM", evening:"5 PM, 6 PM, or 7 PM", night:"7 PM or 8 PM" }
      return `Customer said "${r?.vague}". Ask for specific time: "${sug[r?.vague] || "please give a specific time"}"`
    }
    if (entities?.time?.ambiguous === "outofhours") {
      const r = entities.time.resolved
      return `Customer's time is outside business hours. Tell them hours are ${biz?.working_hours} and ask for a valid time.`
    }

    // Correction detected
    if (entities?.correction_detected && entities?.correction_field) {
      return `Customer is correcting the ${entities.correction_field}. Apologize briefly, update it, re-confirm everything.`
    }

    // Awaiting confirmation
    if (awaitingConfirmation) {
      if (entities?.confirmation?.value === true)
        return `Customer confirmed. Create the booking. Reply with full confirmation: service + date + time. Celebrate warmly.`
      if (entities?.confirmation?.value === false)
        return `Customer said no to confirmation. Ask warmly: "No problem! What would you like to change — the service, date, or time? 😊"`
    }

    // Collect missing fields
    if (missing.includes("service"))
      return `Ask which service the customer wants. List available services briefly.`
    if (missing.includes("date"))
      return `Ask what date works for their ${entities?.service?.value || "appointment"}.`
    if (missing.includes("time"))
      return `Ask what time works on ${entities?.date?.value ? new Date(entities.date.value+"T12:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"}) : "that day"}.`

    // All collected — ask to confirm
    if (readyToBook) {
      const svc  = entities?.service?.value
      const date = entities?.date?.value ? new Date(entities.date.value+"T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"}) : null
      const time = entities?.time?.value
      return `All booking details collected. Ask customer to confirm: "Shall I confirm *${svc}* on *${date}* at *${time}*? ✅"`
    }
  }

  return `Respond naturally and helpfully to the customer's message. Be warm and concise.`
}
