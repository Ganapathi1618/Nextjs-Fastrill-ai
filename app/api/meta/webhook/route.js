import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import "@/lib/env"

// ════════════════════════════════════════════════════════════════════
// FASTRILL WEBHOOK — VERSION 10.2 — FINAL
// ════════════════════════════════════════════════════════════════════
// Architecture: Sarvam = brain. Code = executor.
//
// KEY PRINCIPLES:
// 1. ALL calendar math done in JS — Sarvam never calculates dates
// 2. Full 14-day calendar injected into every prompt
// 3. Human tone — apology when AI made mistake, empathy always
// 4. Ambiguous date ("25") → JS finds the date, Sarvam confirms warmly
// 5. Ambiguous time ("11") → checked against business hours
// 6. "Did you book for me?" → DB lookup before replying
// 7. Corrections ("actually 5pm") → update only that field, keep rest
// 8. Context-aware fallback — never shows generic menu mid-booking
// 9. Voice note → polite text-only message
// 10. Anger/frustration → empathy first, help second
// ════════════════════════════════════════════════════════════════════

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ════════════════════════════════════════════════════════════════════
// CALENDAR UTILITY — All date math lives here, never in Sarvam
// ════════════════════════════════════════════════════════════════════

function buildCalendarContext() {
  // Use IST timezone for all calculations
  const nowIST  = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
  const pad     = n => String(n).padStart(2, "0")
  const toISO   = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  const toFull  = d => d.toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric", timeZone:"Asia/Kolkata" })
  const toShort = d => d.toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short", timeZone:"Asia/Kolkata" })

  const days   = []
  const named  = {} // "monday" → { iso, full, short }
  const byDate = {} // 25 → { iso, full, short, month }

  for (let i = 0; i <= 14; i++) {
    const d    = new Date(nowIST)
    d.setDate(nowIST.getDate() + i)
    const iso  = toISO(d)
    const full = toFull(d)
    const short= toShort(d)
    const dayName = d.toLocaleDateString("en-IN", { weekday:"long", timeZone:"Asia/Kolkata" }).toLowerCase()
    const dateNum = d.getDate()
    const monthName = d.toLocaleDateString("en-IN", { month:"long", timeZone:"Asia/Kolkata" })

    days.push({ i, iso, full, short, dayName, dateNum, monthName })

    // Map day names — only store the FIRST (nearest) occurrence
    if (!named[dayName]) named[dayName] = { iso, full, short }
    // Short versions
    const shortDay = dayName.substring(0, 3)
    if (!named[shortDay]) named[shortDay] = { iso, full, short }

    // Map date numbers — store all so we can handle "25" → find next 25th
    if (!byDate[dateNum]) byDate[dateNum] = { iso, full, short, monthName }
  }

  // Special entries
  const today    = days[0]
  const tomorrow = days[1]
  const dayAfter = days[2]

  // Weekend
  const saturday = days.find(d => d.dayName === "saturday")
  const sunday   = days.find(d => d.dayName === "sunday")

  // Build the calendar string to inject into prompt
  const calStr = days.slice(0, 14).map(d => {
    const label = d.i === 0 ? " ← TODAY" : d.i === 1 ? " ← TOMORROW" : ""
    return `${d.dayName.charAt(0).toUpperCase()+d.dayName.slice(1)}, ${d.dateNum} ${d.monthName} ${d.iso.split("-")[0]}${label}`
  }).join("\n")

  return {
    today, tomorrow, dayAfter,
    saturday, sunday,
    named, byDate, days,
    calStr,
    nowIST
  }
}

// Parse what a customer means when they say a date
// Returns { iso, full, short, ambiguous, options } or null
function resolveCustomerDate(text, cal) {
  const t = (text || "").toLowerCase().trim()

  if (/\btoday\b|\baaj\b/.test(t))                        return { ...cal.today,    ambiguous: false }
  if (/\btomorrow\b|\bkal\b|\bkl\b/.test(t))              return { ...cal.tomorrow,  ambiguous: false }
  if (/\bday after\b|\bparso\b/.test(t))                  return { ...cal.dayAfter,  ambiguous: false }
  if (/\bthis weekend\b/.test(t) && cal.saturday)         return { ambiguous: true, options: [cal.saturday, cal.sunday].filter(Boolean) }

  // "next monday" / "this friday" / just "friday"
  for (const [name, info] of Object.entries(cal.named)) {
    if (new RegExp("\\b" + name + "\\b").test(t)) return { ...info, ambiguous: false }
  }

  // "30th", "25", "the 10th", "10th march", "march 10"
  const numMatch = t.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/)
  if (numMatch) {
    const n = parseInt(numMatch[1])
    if (n >= 1 && n <= 31) {
      // Check if specific month mentioned
      const months = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,
                       january:1,february:2,march:3,april:4,june:6,july:7,august:8,september:9,october:10,november:11,december:12 }
      let targetMonth = null
      for (const [mn, mv] of Object.entries(months)) {
        if (t.includes(mn)) { targetMonth = mv; break }
      }

      if (targetMonth) {
        // Specific month mentioned — calculate exact date
        const d = new Date(cal.nowIST.getFullYear(), targetMonth - 1, n)
        if (d.getMonth() !== targetMonth - 1) return null // invalid date
        const pad = x => String(x).padStart(2, "0")
        const iso = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
        const full = d.toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric", timeZone:"Asia/Kolkata" })
        const short = d.toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short", timeZone:"Asia/Kolkata" })
        return { iso, full, short, ambiguous: false }
      } else {
        // Just a number — look it up in next 14 days
        if (cal.byDate[n]) return { ...cal.byDate[n], ambiguous: true, justNumber: true, num: n }
      }
    }
  }

  // "DD/MM" or "DD-MM"
  const slashMatch = t.match(/(\d{1,2})[\/\-](\d{1,2})/)
  if (slashMatch) {
    const day = parseInt(slashMatch[1])
    const mon = parseInt(slashMatch[2])
    const d   = new Date(cal.nowIST.getFullYear(), mon - 1, day)
    if (d.getMonth() === mon - 1) {
      const pad = x => String(x).padStart(2, "0")
      const iso = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
      const full = d.toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" })
      const short = d.toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short" })
      return { iso, full, short, ambiguous: true }
    }
  }

  return null
}

// Parse time from customer message
// Returns { time24, display, ambiguous, hour } or null
function resolveCustomerTime(text, workingHours) {
  const t = (text || "").toLowerCase().trim()

  // Parse working hours — handles any format a business owner might type
  let openHour = 9, closeHour = 21 // safe defaults
  if (workingHours) {
    const wh = workingHours.toLowerCase()
    if (wh.includes("24/7") || wh.includes("24 hour") || wh.includes("always open")) {
      openHour = 0; closeHour = 23
    } else {
      // Try am/pm format first — most reliable
      const ampmMatches = workingHours.match(/(\d{1,2})(?:[:.]\d{2})?\s*(am|pm)/gi) || []
      if (ampmMatches.length >= 2) {
        const parsed = ampmMatches.map(h => {
          const m = h.match(/(\d{1,2})(?:[:.]\d{2})?\s*(am|pm)/i)
          if (!m) return null
          let hr = parseInt(m[1])
          if (m[2].toLowerCase() === "pm" && hr < 12) hr += 12
          if (m[2].toLowerCase() === "am" && hr === 12) hr = 0
          return hr
        }).filter(n => n !== null)
        openHour = Math.min(...parsed); closeHour = Math.max(...parsed)
      } else {
        // Fallback: plain numbers like "9-5", "10 to 22", "8-8"
        const numMatches = workingHours.match(/\b(\d{1,2})(?::\d{2})?\b/g) || []
        if (numMatches.length >= 2) {
          const nums = numMatches.map(n => parseInt(n)).filter(n => n >= 0 && n <= 23)
          if (nums.length >= 2) {
            let open = nums[0], close = nums[nums.length - 1]
            // If close < open and small (e.g. 5), it's 5pm → add 12
            if (close < open && close <= 12) close += 12
            else if (close < 12 && open < close) close += 12
            openHour = open; closeHour = close
          }
        }
      }
    }
  }

  // Named times
  if (/\bnoon\b|\b12\s*pm\b/.test(t))     return { time24: "12:00", display: "12:00 PM", ambiguous: false, hour: 12 }
  if (/\bmidnight\b/.test(t))              return { time24: "00:00", display: "12:00 AM", ambiguous: false, hour: 0 }

  // "morning" / "afternoon" / "evening" / "night" without specific time
  if (/\bmorning\b|\bsubah\b/.test(t) && !/\d/.test(t)) return { ambiguous: "vague", vague: "morning", openHour, closeHour }
  if (/\bafternoon\b|\bdopahar\b/.test(t) && !/\d/.test(t)) return { ambiguous: "vague", vague: "afternoon", openHour, closeHour }
  if (/\bevening\b|\bshaam\b/.test(t) && !/\d/.test(t)) return { ambiguous: "vague", vague: "evening", openHour, closeHour }
  if (/\bnight\b|\braat\b/.test(t) && !/\d/.test(t))    return { ambiguous: "vague", vague: "night", openHour, closeHour }

  // "half past 3" → 3:30
  const halfPast = t.match(/half\s*past\s*(\d{1,2})/)
  if (halfPast) {
    const h = parseInt(halfPast[1])
    const amFits  = h >= openHour && h < closeHour
    const pmH     = h + 12
    const pmFits  = pmH >= openHour && pmH < closeHour
    if (amFits && !pmFits) return { time24: `${String(h).padStart(2,"0")}:30`, display: `${h}:30 AM`, ambiguous: false, hour: h }
    if (pmFits && !amFits) return { time24: `${String(pmH).padStart(2,"0")}:30`, display: `${h}:30 PM`, ambiguous: false, hour: pmH }
    return { ambiguous: true, hour: h, min: "30", amFits, pmFits }
  }

  // Explicit am/pm — "11am", "11 am", "at 11am", "5:30pm", "5.30 pm"
  const explicit = t.match(/\b(\d{1,2})(?:[:\.](\d{2}))?\s*(am|pm)\b/i)
  if (explicit) {
    let h    = parseInt(explicit[1])
    const mn = explicit[2] || "00"
    const ap = explicit[3].toLowerCase()
    if (ap === "pm" && h < 12) h += 12
    if (ap === "am" && h === 12) h = 0
    const display = `${h > 12 ? h-12 : h || 12}:${mn} ${ap.toUpperCase()}`
    return { time24: `${String(h).padStart(2,"0")}:${mn}`, display, ambiguous: false, hour: h }
  }

  // HH:MM without am/pm — "17:00", "11:00"
  const hmatch = t.match(/\b(\d{1,2}):(\d{2})\b/)
  if (hmatch) {
    const h  = parseInt(hmatch[1])
    const mn = hmatch[2]
    if (h >= 0 && h <= 23) {
      const display = h >= 12 ? `${h === 12 ? 12 : h-12}:${mn} PM` : `${h || 12}:${mn} AM`
      return { time24: `${String(h).padStart(2,"0")}:${mn}`, display, ambiguous: false, hour: h }
    }
  }

  // Just a number — "11", "5", "3"
  const numOnly = t.match(/\bat\s*(\d{1,2})\b|\b(\d{1,2})\b/)
  if (numOnly) {
    const h      = parseInt(numOnly[1] || numOnly[2])
    if (h >= 1 && h <= 12) {
      const amH    = h
      const pmH    = h === 12 ? 12 : h + 12
      const amFits = amH >= openHour && amH <= closeHour
      const pmFits = pmH >= openHour && pmH <= closeHour
      if (amFits && !pmFits) return { time24: `${String(amH).padStart(2,"0")}:00`, display: `${h}:00 AM`, ambiguous: false, hour: amH }
      if (pmFits && !amFits) return { time24: `${String(pmH).padStart(2,"0")}:00`, display: `${h}:00 PM`, ambiguous: false, hour: pmH }
      if (amFits && pmFits)  return { ambiguous: true, hour: h, amH, pmH, amFits, pmFits }
      // Neither fits
      return { ambiguous: "outofhours", hour: h, openHour, closeHour }
    }
  }

  return null
}

// ════════════════════════════════════════════════════════════════════
// GET: Webhook verification
// ════════════════════════════════════════════════════════════════════

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const mode      = searchParams.get("hub.mode")
  const token     = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")
  if (mode === "subscribe" && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }
  return new Response("Forbidden", { status: 403 })
}

// ════════════════════════════════════════════════════════════════════
// POST: Receive messages
// ════════════════════════════════════════════════════════════════════

export async function POST(req) {
  try {
    console.log("🚀 FASTRILL WEBHOOK v10.2")
    const body = await req.json()

    const statuses = body?.entry?.[0]?.changes?.[0]?.value?.statuses
    const hasMsg   = body?.entry?.[0]?.changes?.[0]?.value?.messages
    if (statuses && !hasMsg) {
      for (const s of statuses) {
        if (s.id && ["delivered","read","failed"].includes(s.status)) {
          try {
            await supabaseAdmin.from("messages")
              .update({ status: s.status, [`${s.status}_at`]: new Date().toISOString() })
              .eq("wa_message_id", s.id)
          } catch(e) {}
        }
      }
      return NextResponse.json({ status: "status_update" }, { status: 200 })
    }
    if (!hasMsg) return NextResponse.json({ status: "no_message" }, { status: 200 })

    const value         = body.entry[0].changes[0].value
    const phoneNumberId = value?.metadata?.phone_number_id
    const messages      = value?.messages || []
    const contacts      = value?.contacts || []

    for (const message of messages) {
      const fromNumber     = message.from
      const messageType    = message.type
      const messageId      = message.id
      const timestamp      = new Date(parseInt(message.timestamp) * 1000).toISOString()
      const contact        = contacts.find(c => c.wa_id === fromNumber)
      const contactName    = contact?.profile?.name || "Customer"
      const formattedPhone = fromNumber.replace(/[^0-9]/g, "")

      // Duplicate guard
      const { data: dupMsg } = await supabaseAdmin
        .from("messages").select("id").eq("wa_message_id", messageId).maybeSingle()
      if (dupMsg) { console.log("⚠️ Duplicate:", messageId); continue }

      // Extract text from all message types
      let messageText  = ""
      let mediaCaption = ""
      if      (messageType === "text")        messageText  = message.text?.body || ""
      else if (messageType === "button")      messageText  = message.button?.text || ""
      else if (messageType === "interactive") {
        messageText = message.interactive?.button_reply?.title
          || message.interactive?.list_reply?.title || ""
      }
      else if (messageType === "image")    mediaCaption = message.image?.caption    || ""
      else if (messageType === "video")    mediaCaption = message.video?.caption    || ""
      else if (messageType === "document") mediaCaption = message.document?.caption || ""

      const effectiveText = messageText || mediaCaption
      const isTextMessage = ["text","button","interactive"].includes(messageType) || !!mediaCaption
      const isAudio       = messageType === "audio"
      const isMediaNoText = !isTextMessage && !isAudio && ["image","video","document","sticker"].includes(messageType)

      console.log(`📩 From ${fromNumber} (${contactName}): "${effectiveText || "[" + messageType + "]"}"`)

      // Find connection → user
      const { data: connection } = await supabaseAdmin
        .from("whatsapp_connections")
        .select("user_id, access_token")
        .eq("phone_number_id", phoneNumberId)
        .single()
      if (!connection) { console.error("❌ No WA connection:", phoneNumberId); continue }
      const userId = connection.user_id

      // CRM: Upsert customer
      let customer = null
      const { data: existingCustomer } = await supabaseAdmin
        .from("customers").select("*")
        .eq("phone", formattedPhone).eq("user_id", userId).maybeSingle()
      if (existingCustomer) {
        await supabaseAdmin.from("customers")
          .update({ last_visit_at: timestamp, name: existingCustomer.name || contactName })
          .eq("id", existingCustomer.id)
        customer = existingCustomer
      } else {
        const { data: nc } = await supabaseAdmin.from("customers").insert({
          user_id: userId, phone: formattedPhone, name: contactName,
          source: "whatsapp", tag: "new_lead", created_at: timestamp
        }).select().single()
        customer = nc
      }

      // CRM: Upsert conversation
      let conversation = null
      const { data: existingConvo } = await supabaseAdmin
        .from("conversations").select("*")
        .eq("phone", formattedPhone).eq("user_id", userId).maybeSingle()
      if (existingConvo) {
        const { data: uc } = await supabaseAdmin.from("conversations")
          .update({
            last_message:    effectiveText || "[media]",
            last_message_at: timestamp,
            unread_count:    (existingConvo.unread_count || 0) + 1,
            customer_id:     customer?.id || existingConvo.customer_id,
            status:          "open"
          })
          .eq("id", existingConvo.id).select().single()
        conversation = uc
      } else {
        const { data: nc } = await supabaseAdmin.from("conversations").insert({
          user_id:         userId,
          customer_id:     customer?.id || null,
          phone:           formattedPhone,
          status:          "open",
          ai_enabled:      true,
          last_message:    effectiveText || "[media]",
          last_message_at: timestamp,
          unread_count:    1
        }).select().single()
        conversation = nc
      }

      // Save inbound message
      await supabaseAdmin.from("messages").insert({
        user_id:         userId,
        phone_number_id: phoneNumberId,
        from_number:     fromNumber,
        message_text:    effectiveText || `[${messageType} message]`,
        direction:       "inbound",
        conversation_id: conversation?.id || null,
        customer_phone:  formattedPhone,
        message_type:    messageType || "text",
        status:          "delivered",
        is_ai:           false,
        wa_message_id:   messageId || null,
        created_at:      timestamp
      })

      // Lead capture
      if (effectiveText) {
        if (!existingCustomer && customer) {
          try {
            await supabaseAdmin.from("leads").insert({
              user_id: userId, customer_id: customer.id,
              phone: formattedPhone, name: contactName,
              source: "whatsapp", status: "open",
              last_message: effectiveText, last_message_at: timestamp,
              ai_score: 60, estimated_value: 600
            })
          } catch(e) {}
        } else if (existingCustomer) {
          try {
            await supabaseAdmin.from("leads")
              .update({ last_message: effectiveText, last_message_at: timestamp })
              .eq("customer_id", existingCustomer.id).eq("status", "open")
          } catch(e) {}
        }
      }

      // STOP/START compliance
      const stopKw = ["stop","unsubscribe","opt out","optout","don't message","dont message","remove me","no more messages"]
      const isStop = isTextMessage && stopKw.some(kw =>
        (effectiveText||"").toLowerCase().trim() === kw ||
        (effectiveText||"").toLowerCase().includes(kw)
      )
      if (isStop) {
        try {
          await supabaseAdmin.from("campaign_optouts").upsert(
            { user_id: userId, phone: formattedPhone, created_at: new Date().toISOString() },
            { onConflict: "user_id,phone" }
          )
          await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: "You've been unsubscribed. Reply START to resubscribe anytime 🙏", userId, conversationId: conversation?.id, customerPhone: formattedPhone })
        } catch(e) {}
        continue
      }
      if (isTextMessage && (effectiveText||"").toLowerCase().trim() === "start") {
        try {
          await supabaseAdmin.from("campaign_optouts").delete().eq("user_id", userId).eq("phone", formattedPhone)
          await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: "You've been resubscribed! Welcome back 😊", userId, conversationId: conversation?.id, customerPhone: formattedPhone })
        } catch(e) {}
        continue
      }

      if (conversation?.ai_enabled === false) { console.log("⏸️ AI disabled"); continue }

      // Voice note — can't read audio
      if (isAudio) {
        const firstName = contactName.split(" ")[0] || "there"
        await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: `Hey ${firstName}! 😊 I can only read text messages right now. Could you type what you'd like to say?`, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
        continue
      }

      // Image/video/doc with no caption
      if (isMediaNoText) {
        await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: "Thanks for sharing! 😊 If you have any questions or want to book, just type here.", userId, conversationId: conversation?.id, customerPhone: formattedPhone })
        continue
      }

      // Load business context
      const [
        { data: bizSettings },
        { data: rawHistory },
        { data: servicesList },
        { data: bizKnowledge }
      ] = await Promise.all([
        supabaseAdmin.from("business_settings").select("*").eq("user_id", userId).maybeSingle(),
        supabaseAdmin.from("messages")
          .select("message_text, direction, is_ai, created_at")
          .eq("conversation_id", conversation?.id)
          .order("created_at", { ascending: false }).limit(20),
        supabaseAdmin.from("services")
          .select("name, price, duration, capacity, category, description, service_type, is_active")
          .eq("user_id", userId),
        supabaseAdmin.from("business_knowledge").select("*").eq("user_id", userId).maybeSingle()
      ])

      const biz = {
        ...(bizKnowledge || {}),
        ...(bizSettings  || {}),
        ai_instructions: [
          bizSettings?.ai_instructions,
          bizKnowledge?.content,
          bizKnowledge?.instructions,
          bizKnowledge?.knowledge,
          bizKnowledge?.notes
        ].filter(Boolean).join("\n\n") || ""
      }

      const activeServices = (servicesList || []).filter(s => s.is_active !== false)

      const historyRaw = (rawHistory || []).reverse().map(m => ({
        role:    m.direction === "inbound" ? "user" : "assistant",
        content: (m.message_text || "").trim()
      })).filter(m => m.content && m.content !== "[media message]")
      const conversationHistory = buildAlternatingHistory(historyRaw)

      // Load booking state
      let bookingState = null
      try {
        if (conversation?.booking_state) {
          bookingState = typeof conversation.booking_state === "string"
            ? JSON.parse(conversation.booking_state)
            : conversation.booking_state
        }
      } catch(e) { bookingState = null }

      // Build calendar context — JS does ALL date math
      const cal = buildCalendarContext()

      // Pre-resolve date and time from customer message
      const resolvedDate = resolveCustomerDate(effectiveText, cal)
      const resolvedTime = resolveCustomerTime(effectiveText, biz?.working_hours || "")

      // Check if customer is asking about their booking
      const isBookingQuery = /did you book|my booking|my appointment|booked for me|check my booking|what did i book/i.test(effectiveText)
      let existingBookingInfo = null
      if (isBookingQuery) {
        const { data: recentBooking } = await supabaseAdmin.from("bookings").select("*")
          .eq("customer_phone", formattedPhone).eq("user_id", userId)
          .in("status", ["confirmed","pending"])
          .order("created_at", { ascending: false }).limit(1).maybeSingle()
        existingBookingInfo = recentBooking
      }

      console.log("🧠 Context:", {
        biz: biz.business_name,
        services: activeServices.length,
        history: conversationHistory.length,
        state: bookingState,
        resolvedDate: resolvedDate?.iso,
        resolvedTime: resolvedTime?.time24,
        isBookingQuery
      })

      // Call Sarvam brain
      const sarvamResult = await callSarvamBrain({
        customerMessage: effectiveText,
        customerName:    contactName,
        biz,
        activeServices,
        conversationHistory,
        bookingState,
        cal,
        resolvedDate,
        resolvedTime,
        existingBookingInfo
      })

      console.log("🤖 Sarvam:", sarvamResult.action, "|", sarvamResult.reply?.substring(0, 100))

      const { reply, action, booking: newBookingData } = sarvamResult

      // Send reply immediately
      await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: reply, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
      await supabaseAdmin.from("conversations").update({ last_message: reply, last_message_at: new Date().toISOString() }).eq("id", conversation?.id)

      // Execute action
      console.log("⚡ Action:", action, "| Data:", JSON.stringify(newBookingData))

      if (action === "update_state" || action === "confirm_booking") {
        if (newBookingData && Object.keys(newBookingData).some(k => newBookingData[k])) {
          const mergedState = { ...(bookingState || {}) }
          // Only overwrite fields that have actual values
          if (newBookingData.service) mergedState.service = newBookingData.service
          if (newBookingData.date)    mergedState.date    = newBookingData.date
          if (newBookingData.time)    mergedState.time    = newBookingData.time
          try {
            await supabaseAdmin.from("conversations")
              .update({ booking_state: JSON.stringify(mergedState) })
              .eq("id", conversation.id)
          } catch(e) { console.warn("State save failed:", e.message) }
        }
      }

      else if (action === "create_booking" && newBookingData?.service) {
        const matchedSvc = matchService(newBookingData.service, activeServices)
        // Slot check
        if (isTimeBased(matchedSvc) && newBookingData.date && newBookingData.time) {
          const slotFree = await isSlotAvailable({ userId, date: newBookingData.date, time: newBookingData.time, service: newBookingData.service, servicesList: activeServices })
          if (!slotFree) {
            const alt = await findNextAvailableSlot({ userId, date: newBookingData.date, service: newBookingData.service, servicesList: activeServices })
            const msg = alt
              ? `That slot just got taken 😅 Next available: *${alt}*\n\nShall I book that instead? ✅`
              : `That slot is fully booked 😅 Please suggest another time!`
            await sendAndSave({ phoneNumberId, accessToken: connection.access_token, toNumber: fromNumber, message: msg, userId, conversationId: conversation?.id, customerPhone: formattedPhone })
            continue
          }
        }
        const { data: newBooking, error: bookErr } = await supabaseAdmin.from("bookings").insert({
          user_id:        userId,
          customer_name:  contactName,
          customer_phone: formattedPhone,
          customer_id:    customer?.id || null,
          service:        matchedSvc?.name || newBookingData.service,
          booking_date:   newBookingData.date || null,
          booking_time:   newBookingData.time || null,
          amount:         matchedSvc?.price   || 0,
          status:         "confirmed",
          ai_booked:      true,
          created_at:     new Date().toISOString()
        }).select().single()
        if (!bookErr && newBooking) {
          console.log("✅ Booking created:", newBooking.id)
          try {
            const { count: bc } = await supabaseAdmin.from("bookings").select("id", { count: "exact" })
              .eq("customer_phone", formattedPhone).eq("user_id", userId).in("status", ["confirmed","completed"])
            const tag = bc >= 5 ? "vip" : bc >= 2 ? "returning" : "new_lead"
            await supabaseAdmin.from("customers").update({ tag, last_visit_at: new Date().toISOString() }).eq("phone", formattedPhone).eq("user_id", userId)
          } catch(e) {}
          try {
            await supabaseAdmin.from("leads").update({ status: "converted", last_message_at: new Date().toISOString() })
              .eq("customer_id", customer?.id).eq("user_id", userId).eq("status", "open")
          } catch(e) {}
          try { await supabaseAdmin.from("conversations").update({ booking_state: null }).eq("id", conversation.id) } catch(e) {}
        }
      }

      else if (action === "reschedule" && newBookingData) {
        let bookingToUpdate = null
        if (newBookingData.service) {
          const { data: sb } = await supabaseAdmin.from("bookings").select("*")
            .eq("customer_phone", formattedPhone).eq("user_id", userId)
            .ilike("service", "%" + newBookingData.service + "%")
            .in("status", ["confirmed","pending"])
            .order("booking_date", { ascending: true }).limit(1).maybeSingle()
          bookingToUpdate = sb
        }
        if (!bookingToUpdate) {
          const { data: lb } = await supabaseAdmin.from("bookings").select("*")
            .eq("customer_phone", formattedPhone).eq("user_id", userId)
            .in("status", ["confirmed","pending"])
            .order("booking_date", { ascending: true }).limit(1).maybeSingle()
          bookingToUpdate = lb
        }
        if (bookingToUpdate) {
          await supabaseAdmin.from("bookings").update({
            booking_date: newBookingData.date || bookingToUpdate.booking_date,
            booking_time: newBookingData.time || bookingToUpdate.booking_time,
            status:       "confirmed"
          }).eq("id", bookingToUpdate.id)
          console.log("✅ Rescheduled:", bookingToUpdate.id)
          try { await supabaseAdmin.from("conversations").update({ booking_state: null }).eq("id", conversation.id) } catch(e) {}
        }
      }

      else if (action === "cancel") {
        try {
          await supabaseAdmin.from("bookings").update({ status: "cancelled" })
            .eq("customer_phone", formattedPhone).eq("user_id", userId)
            .in("status", ["confirmed","pending"])
          await supabaseAdmin.from("conversations").update({ booking_state: null }).eq("id", conversation.id)
          console.log("✅ Cancelled")
        } catch(e) {}
      }

      else if (action === "clear_state") {
        try { await supabaseAdmin.from("conversations").update({ booking_state: null }).eq("id", conversation.id) } catch(e) {}
      }
    }

    return NextResponse.json({ status: "ok" }, { status: 200 })
  } catch (err) {
    console.error("❌ Webhook fatal:", err)
    return NextResponse.json({ status: "error", message: err.message }, { status: 200 })
  }
}

// ════════════════════════════════════════════════════════════════════
// SARVAM BRAIN — Final version
// JS pre-resolves dates and times, Sarvam just replies intelligently
// ════════════════════════════════════════════════════════════════════

async function callSarvamBrain({ customerMessage, customerName, biz, activeServices, conversationHistory, bookingState, cal, resolvedDate, resolvedTime, existingBookingInfo }) {
  const firstName    = (customerName || "").split(" ")[0] || "there"
  const businessName = biz?.business_name   || "our business"
  const businessType = biz?.business_type   || ""
  const location     = biz?.location        || ""
  const mapsLink     = biz?.maps_link       || ""
  const workingHours = biz?.working_hours   || ""
  const aiInstr      = biz?.ai_instructions || ""
  const aiLanguage   = biz?.ai_language     || "English"
  const description  = biz?.description     || ""

  const servicesText = activeServices.length > 0
    ? activeServices.map(s => {
        let l = `- ${s.name}: ₹${s.price}`
        if (s.duration) l += ` (${s.duration} min)`
        if (s.description) l += ` — ${s.description}`
        return l
      }).join("\n")
    : "No services configured yet."

  const stateDesc = bookingState && Object.keys(bookingState).some(k => bookingState[k])
    ? `IN PROGRESS: service="${bookingState.service||"not set"}", date="${bookingState.date||"not set"}", time="${bookingState.time||"not set"}"`
    : "No booking in progress."

  // Build date resolution hint for Sarvam
  let dateHint = ""
  if (resolvedDate) {
    if (resolvedDate.ambiguous && resolvedDate.justNumber) {
      dateHint = `\nDATE RESOLUTION: Customer said "${resolvedDate.num}" which JS resolved as ${resolvedDate.full} (${resolvedDate.iso}). This is ambiguous — confirm with customer: "Did you mean ${resolvedDate.short}? 😊"`
    } else if (resolvedDate.ambiguous && resolvedDate.options) {
      dateHint = `\nDATE RESOLUTION: Customer said "this weekend" which means ${resolvedDate.options.map(o=>o.short).join(" or ")}. Ask which one they prefer.`
    } else if (resolvedDate.ambiguous) {
      dateHint = `\nDATE RESOLUTION: Customer's date is ambiguous. JS computed it as ${resolvedDate.full} (${resolvedDate.iso}). Confirm with customer before using.`
    } else {
      dateHint = `\nDATE RESOLUTION: Customer's date = ${resolvedDate.full} (${resolvedDate.iso}). Use this exact date. Do NOT recalculate.`
    }
  }

  // Build time resolution hint for Sarvam
  let timeHint = ""
  if (resolvedTime) {
    if (resolvedTime.ambiguous === true) {
      timeHint = `\nTIME RESOLUTION: Customer said a number that could be ${resolvedTime.amH}:00 AM or ${resolvedTime.pmH}:00 PM. Business hours: ${workingHours || "not set"}. Both fit within hours — ask: "Do you mean ${resolvedTime.hour} AM or ${resolvedTime.hour} PM? 😊"`
    } else if (resolvedTime.ambiguous === "vague") {
      const suggestions = {
        morning:   "10 AM or 11 AM",
        afternoon: "1 PM, 2 PM, or 3 PM",
        evening:   "5 PM, 6 PM, or 7 PM",
        night:     "7 PM or 8 PM"
      }
      timeHint = `\nTIME RESOLUTION: Customer said "${resolvedTime.vague}" which is vague. Ask: "What time in the ${resolvedTime.vague}? ${suggestions[resolvedTime.vague] || "Please give a specific time"} 😊"`
    } else if (resolvedTime.ambiguous === "outofhours") {
      timeHint = `\nTIME RESOLUTION: Customer's time (${resolvedTime.hour}) is outside business hours (${workingHours}). Tell them our hours and ask for a valid time.`
    } else {
      timeHint = `\nTIME RESOLUTION: Customer's time = ${resolvedTime.display} (${resolvedTime.time24}). Use this exact time. Do NOT recalculate.`
    }
  }

  // Booking query hint
  let bookingQueryHint = ""
  if (existingBookingInfo) {
    const b = existingBookingInfo
    const fd = b.booking_date ? new Date(b.booking_date+"T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"}) : null
    bookingQueryHint = `\nEXISTING BOOKING FOUND: Service="${b.service}", Date="${fd||b.booking_date}", Time="${b.booking_time||"not set"}", Status="${b.status}". Tell customer about this booking warmly.`
  } else if (/did you book|my booking|my appointment/i.test(customerMessage)) {
    bookingQueryHint = `\nBOOKING QUERY: Customer is asking about their booking. NO booking found in DB. Tell them warmly no booking yet and offer to book now.`
  }

  const systemPrompt = `You are the WhatsApp AI assistant for *${businessName}*${businessType ? ` (${businessType})` : ""}${location ? `, ${location}` : ""}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUSINESS INFO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
About: ${description || "A business using Fastrill for WhatsApp bookings."}
Hours: ${workingHours || "Not specified"}
${location ? `Address: ${location}` : ""}
${mapsLink ? `Maps: ${mapsLink}` : ""}
${aiInstr ? `Owner instructions: ${aiInstr}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SERVICES (ONLY these — nothing else exists)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${servicesText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CALENDAR (calculated by system — use EXACTLY as given)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${cal.calStr}

CRITICAL: NEVER calculate dates yourself. Use the calendar above ONLY.
${dateHint}
${timeHint}
${bookingQueryHint}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BOOKING STATE NOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${stateDesc}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSONALITY & TONE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Customer name: ${firstName}
Language: ${aiLanguage}

You are warm, human, and caring — not a bot. You:
- Use the customer's name naturally
- Apologize gracefully when you make a mistake: "You're right, sorry about that! 😊"
- Empathize when customer is frustrated: "I completely understand, let me fix that right away!"
- Say things like "Great choice!", "Perfect!", "Of course!" — not robotic confirmations
- Keep messages SHORT — 2-3 lines max on WhatsApp
- Never sound like a menu or a bot
- Match the customer's language (Hindi, Telugu, mix — whatever they use)
- When thanked: reference the booking context ("You're welcome! See you on [date] 😊")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BOOKING RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Only book services from the list above. If customer asks for something else → warmly say you don't offer it and show what you DO offer with prices.
2. Flow: service → date → time → confirm → book. One question at a time.
3. DATES: Use the system-resolved date from DATE RESOLUTION above. Never calculate yourself.
4. TIMES: Use the system-resolved time from TIME RESOLUTION above. Never assume am/pm.
5. When you made a mistake (wrong date, wrong day name) and customer corrects you: apologize warmly and fix it.
6. When customer says "no" to confirmation: ask "No problem! What would you like to change — the service, date, or time? 😊"
7. When customer changes ONE thing (e.g. "actually 5pm"): update ONLY that field, keep everything else.
8. Final confirmation must show full details: service + full date with day name + time.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE FORMAT — JSON ONLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Respond ONLY with valid JSON. No text before or after. No markdown.

{
  "reply": "WhatsApp message to send",
  "action": "none|update_state|confirm_booking|create_booking|reschedule|cancel|clear_state",
  "booking": {
    "service": "exact service name or null",
    "date": "YYYY-MM-DD or null",
    "time": "HH:MM 24hr or null"
  }
}

ACTIONS:
- none: just reply, nothing to save
- update_state: save partial booking progress
- confirm_booking: all details ready, waiting for yes/no
- create_booking: customer said yes, book now
- reschedule: update existing booking
- cancel: cancel existing booking
- clear_state: customer wants to start over

DATE RULES:
- Only put a confirmed, unambiguous date in the "date" field
- If date is ambiguous (just "25", "tomorrow" not yet confirmed) → set date to null, use update_state only AFTER customer confirms
- Always YYYY-MM-DD

TIME RULES:
- Only put confirmed time in "time" field
- If ambiguous (just "11", "evening") → set time to null
- Always HH:MM 24hr format`

  if (process.env.SARVAM_API_KEY) {
    try {
      const msgs = [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: customerMessage }
      ]
      console.log("🔄 Calling Sarvam | history:", conversationHistory.length)
      const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
        method:  "POST",
        headers: {
          "Content-Type":         "application/json",
          "api-subscription-key": process.env.SARVAM_API_KEY
        },
        body: JSON.stringify({
          model:       "sarvam-m",
          messages:    msgs,
          max_tokens:  700,
          temperature: 0.3
        })
      })
      const rawText = await response.text()
      console.log("📨 Sarvam HTTP:", response.status)
      const data = JSON.parse(rawText)
      if (data?.error) {
        console.error("❌ Sarvam error:", JSON.stringify(data.error))
      } else {
        const content = data?.choices?.[0]?.message?.content || ""
        const result  = parseSarvamJSON(content, activeServices)
        if (result) {
          console.log("✅ Parsed:", result.action, "|", result.reply?.substring(0, 100))
          return result
        }
      }
    } catch(err) { console.error("Sarvam exception:", err.message) }
  }

  console.warn("⚠️ Sarvam unavailable — context-aware fallback")
  return buildFallbackResponse({ customerMessage, businessName, firstName, activeServices, bookingState, existingBookingInfo })
}

// ════════════════════════════════════════════════════════════════════
// PARSE SARVAM JSON
// ════════════════════════════════════════════════════════════════════

function parseSarvamJSON(rawContent, activeServices) {
  if (!rawContent?.trim()) return null
  console.log("📝 Raw Sarvam:", rawContent.substring(0, 400))

  let content = rawContent
  content = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim()
  content = content.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim()

  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) { console.warn("No JSON found"); return null }

  try {
    const parsed = JSON.parse(jsonMatch[0])

    if (!parsed.reply || typeof parsed.reply !== "string") { console.warn("Missing reply"); return null }

    const validActions = ["none","update_state","confirm_booking","create_booking","reschedule","cancel","clear_state"]
    if (!validActions.includes(parsed.action)) parsed.action = "none"

    if (!parsed.booking || typeof parsed.booking !== "object") parsed.booking = {}

    // Validate date format
    if (parsed.booking.date && !/^\d{4}-\d{2}-\d{2}$/.test(parsed.booking.date)) {
      console.warn("Bad date:", parsed.booking.date); parsed.booking.date = null
    }

    // Validate and fix time format
    if (parsed.booking.time) {
      const fixed = fixTimeFormat(parsed.booking.time)
      parsed.booking.time = fixed
    }

    // Validate service exists in DB
    if (parsed.booking.service) {
      const matched = matchService(parsed.booking.service, activeServices)
      if (matched) {
        parsed.booking.service = matched.name
      } else {
        console.warn("Unknown service:", parsed.booking.service)
        parsed.booking.service = null
        if (["create_booking","confirm_booking"].includes(parsed.action)) parsed.action = "none"
      }
    }

    return parsed
  } catch(e) {
    console.error("JSON parse error:", e.message)
    return null
  }
}

// ════════════════════════════════════════════════════════════════════
// CONTEXT-AWARE FALLBACK
// ════════════════════════════════════════════════════════════════════

function buildFallbackResponse({ customerMessage, businessName, firstName, activeServices, bookingState, existingBookingInfo }) {
  const msg  = (customerMessage || "").toLowerCase().trim()
  const spAll = activeServices.length > 0
    ? activeServices.map(s => `• *${s.name}* — ₹${s.price}`).join("\n")
    : ""
  const sp3  = activeServices.slice(0,3).map(s=>s.name).join(", ")

  // Booking query
  if (existingBookingInfo) {
    const b  = existingBookingInfo
    const fd = b.booking_date ? new Date(b.booking_date+"T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"}) : null
    return {
      reply:   `Yes ${firstName}! 😊 Here's your booking:\n\n📋 Service: ${b.service}\n📅 Date: ${fd||b.booking_date}${b.booking_time ? `\n⏰ Time: ${b.booking_time}` : ""}\n\nSee you soon! 🙏`,
      action:  "none",
      booking: {}
    }
  }

  // Continue booking flow if in progress
  if (bookingState) {
    const { service, date, time } = bookingState
    if (!service) return { reply: `Which service would you like?\n\n${spAll}\n\nJust type the name 😊`, action: "none", booking: {} }
    if (!date)    return { reply: `What date works for your *${service}*? 📅`, action: "none", booking: {} }
    if (!time)    return { reply: `What time works for you? ⏰`, action: "none", booking: {} }
    const fd = new Date(date+"T12:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})
    return { reply: `Shall I confirm *${service}* on *${fd}* at *${time}*? ✅`, action: "confirm_booking", booking: { service, date, time } }
  }

  // Generic responses
  if (/^(hi|hello|hey|hii|hai|namaste|vanakkam)/i.test(msg)) {
    return { reply: `Hi ${firstName}! 👋 Welcome to *${businessName}*!${sp3?`\n\nWe offer: ${sp3} and more.`:""}\n\nHow can I help? 😊`, action: "none", booking: {} }
  }
  if (/price|cost|services|offer|how much|charges|menu|list/i.test(msg)) {
    return { reply: spAll ? `*${businessName} Services*\n\n${spAll}\n\nWant to book? 😊` : `Please contact us for pricing 🙏`, action: "none", booking: {} }
  }
  if (/thank|thanks/i.test(msg)) {
    return { reply: `You're welcome, ${firstName}! 😊 Have a great day! 🌟`, action: "none", booking: {} }
  }

  return {
    reply:   `Thanks for reaching out to *${businessName}*! 😊${sp3?`\n\nWe offer: ${sp3}.`:""}\n\nHow can I help?\n📅 Book an appointment\n💰 Services & pricing\n📍 Our location`,
    action:  "none",
    booking: {}
  }
}

// ════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════

function fixTimeFormat(t) {
  if (!t) return null
  if (/^\d{2}:\d{2}$/.test(t)) return t
  const m = t.match(/(\d{1,2})(?:[:\.](\d{2}))?\s*(am|pm)?/i)
  if (!m) return null
  let h = parseInt(m[1])
  const mn = m[2] || "00"
  const ap = m[3]?.toLowerCase()
  if (ap === "pm" && h < 12) h += 12
  if (ap === "am" && h === 12) h = 0
  if (h >= 0 && h <= 23) return `${String(h).padStart(2,"0")}:${mn.padStart(2,"0")}`
  return null
}

function isTimeBased(service) {
  if (!service) return false
  if (service.service_type === "time")    return true
  if (service.service_type === "package") return false
  return !!(service.duration && service.duration > 0)
}

function matchService(name, list) {
  if (!name || !list?.length) return null
  const s = name.toLowerCase().trim()
  return list.find(svc => svc.name.toLowerCase() === s)
    || list.find(svc => svc.name.toLowerCase().includes(s) || s.includes(svc.name.toLowerCase()))
    || null
}

async function isSlotAvailable({ userId, date, time, service, servicesList, excludeBookingId }) {
  if (!date || !time) return true
  const svc      = matchService(service, servicesList)
  const capacity = svc?.capacity || 1
  const query    = supabaseAdmin.from("bookings").select("id")
    .eq("user_id", userId).eq("booking_date", date).eq("booking_time", time)
    .in("status", ["confirmed","pending"])
  if (excludeBookingId) query.neq("id", excludeBookingId)
  const { data: ex } = await query
  return (ex?.length || 0) < capacity
}

async function findNextAvailableSlot({ userId, date, service, servicesList }) {
  if (!date) return null
  const svc      = matchService(service, servicesList)
  const duration = svc?.duration || 30
  const slots    = []
  let m = 9 * 60
  while (m <= 20 * 60) {
    slots.push(`${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`)
    m += duration
  }
  for (const time of slots) {
    const free = await isSlotAvailable({ userId, date, time, service, servicesList })
    if (free) {
      const dt = new Date(date+"T"+time+":00")
      return dt.toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"}) + " at " + time
    }
  }
  return null
}

function buildAlternatingHistory(rawHistory) {
  if (!rawHistory?.length) return []
  const deduped = []
  for (const msg of rawHistory) {
    if (deduped.length === 0 || deduped[deduped.length-1].role !== msg.role) {
      deduped.push(msg)
    } else {
      deduped[deduped.length-1] = msg
    }
  }
  while (deduped.length > 0 && deduped[0].role !== "user") deduped.shift()
  while (deduped.length > 0 && deduped[deduped.length-1].role === "user") deduped.pop()
  return deduped.slice(-12)
}

async function sendAndSave({ phoneNumberId, accessToken, toNumber, message, userId, conversationId, customerPhone }) {
  const result = await sendWhatsAppMessage({ phoneNumberId, accessToken, toNumber, message })
  try {
    await supabaseAdmin.from("messages").insert({
      user_id:         userId,
      phone_number_id: phoneNumberId,
      from_number:     phoneNumberId,
      message_text:    message,
      direction:       "outbound",
      conversation_id: conversationId || null,
      customer_phone:  customerPhone,
      message_type:    "text",
      status:          "sent",
      is_ai:           true,
      wa_message_id:   result?.messages?.[0]?.id || null,
      created_at:      new Date().toISOString()
    })
  } catch(e) { console.warn("Message save failed:", e.message) }
  return result
}

async function sendWhatsAppMessage({ phoneNumberId, accessToken, toNumber, message }) {
  try {
    const res  = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method:  "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body:    JSON.stringify({ messaging_product: "whatsapp", to: toNumber, type: "text", text: { body: message, preview_url: false } })
    })
    const data = await res.json()
    if (data.error) console.error("❌ WA error:", JSON.stringify(data.error))
    return data
  } catch(err) {
    console.error("❌ WA exception:", err.message)
    return {}
  }
}

// SQL: ALTER TABLE conversations ADD COLUMN IF NOT EXISTS booking_state JSONB;
