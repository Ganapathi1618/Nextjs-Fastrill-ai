// lib/ai/extractor.js — Entity extraction
const { parseJSON }                            = require("./classifier")
const { isValidDate, isPastDate, getTodayStr } = require("../booking/calendar-engine")

async function extractEntities({ message, history, services, state }) {
  const start = Date.now()
  if (process.env.SARVAM_API_KEY) {
    try {
      const serviceNames  = (services || []).map(s => s.name).join(", ") || "none"
      const recentHistory = (history || []).slice(-4).map(m => (m.role === "user" ? "Customer" : "AI") + ": " + m.content).join("\n")
      const todayStr      = new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric", timeZone:"Asia/Kolkata" })

      const prompt = `You are an entity extractor for a WhatsApp booking assistant.
Today is: ${todayStr}
Available services: ${serviceNames}
Current booking state: service="${state?.service||"none"}" date="${state?.date||"none"}" time="${state?.time||"none"}"

Recent conversation:
${recentHistory || "(no history)"}

Latest message: "${message}"

IMPORTANT RULES:
- If customer says just a number like "28" or "28th" and context is about date, extract as date in current/next month
- If customer says just "5" or "5pm" or "5:00" and context is about time, extract as time (assume PM if between 1-9)
- If state already has service, don't change it unless customer clearly mentions a different service
- Date must be YYYY-MM-DD format
- Time must be HH:MM 24hr format

Reply ONLY with valid JSON, no explanation:
{"service":"<exact service name from list or null>","date":"<YYYY-MM-DD or null>","time":"<HH:MM 24hr or null>","time_window":"<morning|afternoon|evening|night or null>","confirmation":"<true|false|null>","ambiguous_fields":[],"confidence":{"service":0.0,"date":0.0,"time":0.0}}`

      const res  = await fetch("https://api.sarvam.ai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", "api-subscription-key": process.env.SARVAM_API_KEY }, body: JSON.stringify({ model: "sarvam-m", messages: [{ role: "user", content: prompt }], max_tokens: 200, temperature: 0.1 }) })
      const data = await res.json()
      if (!data?.error) {
        const result = parseJSON(data?.choices?.[0]?.message?.content || "", "extractor")
        if (result) {
          if (result.date && !isValidDate(result.date)) { console.warn("[extractor] invalid date:", result.date); result.date = null }
          if (result.date && isPastDate(result.date))   { console.warn("[extractor] past date:", result.date);   result.date = null }
          console.log("✅ [extractor] svc=" + (result.service||"null") + " date=" + (result.date||"null") + " time=" + (result.time||"null") + " | " + (Date.now()-start) + "ms")
          return result
        }
      } else { console.error("❌ [extractor]", data.error.message) }
    } catch(e) { console.warn("⚠️ [extractor] failed:", e.message) }
  }
  return ruleBasedExtract(message, services, state)
}

function ruleBasedExtract(message, services, state) {
  const m       = (message || "").toLowerCase().trim()
  const now     = new Date()
  const pad     = n => String(n).padStart(2, "0")
  const toStr   = d => d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate())
  const todayStr = getTodayStr()

  // ── Service matching ──────────────────────────────────────────
  let service = state?.service || null
  if (!service && services?.length) {
    for (const s of services) { if (m.includes(s.name.toLowerCase())) { service = s.name; break } }
    if (!service) {
      for (const s of services) {
        const words = s.name.toLowerCase().split(/\s+/).filter(w => w.length > 3)
        if (words.some(w => m.includes(w))) { service = s.name; break }
      }
    }
  }

  // ── Date matching ─────────────────────────────────────────────
  let date = state?.date || null
  if (!date) {
    if      (/\b(today|aaj)\b/.test(m))           date = todayStr
    else if (/\b(tomorrow|kal|kl)\b/.test(m))     { const t=new Date(now); t.setDate(now.getDate()+1); date=toStr(t) }
    else if (/\b(day after|parso)\b/.test(m))     { const t=new Date(now); t.setDate(now.getDate()+2); date=toStr(t) }
    else {
      // Day names — Monday, Tuesday etc
      const days=[["sunday","sun"],["monday","mon"],["tuesday","tue"],["wednesday","wed"],["thursday","thu"],["friday","fri"],["saturday","sat"]]
      for (let i=0;i<days.length;i++) {
        if (days[i].some(d => new RegExp("\\b"+d+"\\b").test(m))) {
          let diff=(i-now.getDay()+7)%7; if(diff===0)diff=7
          const t=new Date(now); t.setDate(now.getDate()+diff); date=toStr(t); break
        }
      }

      // "25th march" or "march 25" or "25 march"
      if (!date) {
        const months=["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"]
        for (let i=0;i<months.length;i++) {
          const re=new RegExp("(\\d{1,2})(?:st|nd|rd|th)?\\s*"+months[i]+"|"+months[i]+"\\s*(\\d{1,2})(?:st|nd|rd|th)?","i")
          const dm=m.match(re)
          if (dm) { date=now.getFullYear()+"-"+pad(i+1)+"-"+pad(parseInt(dm[1]||dm[2])); break }
        }
      }

      // SMART: just a bare number like "28" or "28th" — treat as day of month
      // This is the key fix for "28th" not being caught
      if (!date) {
        const bareDay = m.match(/^(\d{1,2})(?:st|nd|rd|th)?$/)
        if (bareDay) {
          const day = parseInt(bareDay[1])
          if (day >= 1 && day <= 31) {
            // Use current month, but if day already passed use next month
            let month = now.getMonth() + 1
            let year  = now.getFullYear()
            const candidate = year + "-" + pad(month) + "-" + pad(day)
            if (isValidDate(candidate) && !isPastDate(candidate)) {
              date = candidate
            } else {
              // Try next month
              month = month === 12 ? 1 : month + 1
              year  = month === 1 ? year + 1 : year
              const nextMonth = year + "-" + pad(month) + "-" + pad(day)
              if (isValidDate(nextMonth)) date = nextMonth
            }
          }
        }
      }

      // DD/MM format
      if (!date) {
        const dm=m.match(/^(\d{1,2})[\/\-](\d{1,2})$/)
        if (dm) date=now.getFullYear()+"-"+pad(parseInt(dm[2]))+"-"+pad(parseInt(dm[1]))
      }
    }
  }

  if (date && !isValidDate(date)) { console.warn("[extractor] invalid date cleared:", date); date=null }
  if (date && isPastDate(date))   { console.warn("[extractor] past date cleared:", date);    date=null }

  // ── Time matching ─────────────────────────────────────────────
  let time=state?.time||null, timeWindow=null
  if (!time) {
    if      (/\b(morning|subah)\b/.test(m))     timeWindow="morning"
    else if (/\b(afternoon|dopahar)\b/.test(m)) timeWindow="afternoon"
    else if (/\b(evening|shaam)\b/.test(m))     timeWindow="evening"
    else if (/\b(night|raat)\b/.test(m))        timeWindow="night"

    // HH:MM or H:MM format
    const colonTime = m.match(/\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i)
    if (colonTime) {
      let hour=parseInt(colonTime[1]); const min=colonTime[2].padStart(2,"0"); const ap=(colonTime[3]||"").toLowerCase()
      if(ap==="pm"&&hour<12)hour+=12; if(ap==="am"&&hour===12)hour=0
      if(hour>=7&&hour<=22)time=pad(hour)+":"+min
    }

    // "5pm", "10am", "5 pm" format
    if (!time) {
      const ampm = m.match(/\b(\d{1,2})\s*(am|pm)\b/i)
      if (ampm) {
        let hour=parseInt(ampm[1]); const ap=ampm[2].toLowerCase()
        if(ap==="pm"&&hour<12)hour+=12; if(ap==="am"&&hour===12)hour=0
        if(hour>=7&&hour<=22)time=pad(hour)+":00"
      }
    }

    // SMART: bare number like "5" or "11" — this is the key fix for "5" not being caught as time
    // Only apply when AI just asked for time (state.last_ai_question === "time")
    if (!time && state?.last_ai_question === "time") {
      const bareNum = m.match(/^(\d{1,2})$/)
      if (bareNum) {
        let hour = parseInt(bareNum[1])
        // Assume PM for hours 1-9 (business context: 1pm-9pm more likely than 1am-9am)
        if (hour >= 1 && hour <= 9) hour += 12
        if (hour >= 7 && hour <= 22) time = pad(hour) + ":00"
        console.log("[extractor] bare number time: " + bareNum[1] + " → " + time + " (PM assumed)")
      }
    }

    // "5 o'clock", "five" etc
    if (!time && state?.last_ai_question === "time") {
      const wordNums = { one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10, eleven:11, twelve:12 }
      for (const [word, num] of Object.entries(wordNums)) {
        if (m === word || m.startsWith(word + " ")) {
          let hour = num >= 1 && num <= 9 ? num + 12 : num  // Assume PM
          if (hour >= 7 && hour <= 22) { time = pad(hour) + ":00"; break }
        }
      }
    }
  }

  // ── Confirmation ──────────────────────────────────────────────
  const confirmWords = ["yes","yeah","yep","ok","okay","sure","confirm","correct","haan","ha","ji","theek","done","go ahead","book it","proceed","absolutely","perfect","great","sounds good"]
  const cancelWords  = ["no","nope","cancel","nahi","mat","don't","dont"]
  const confirmation = confirmWords.some(w => m === w || m.startsWith(w+" ")) ? true
                     : cancelWords.some(w => m === w) ? false
                     : null

  const ambiguous_fields = []
  if (!service) ambiguous_fields.push("service")
  if (!date)    ambiguous_fields.push("date")
  if (!time && !timeWindow) ambiguous_fields.push("time")

  console.log("⚡ [extractor] rule-based: svc=" + (service||"null") + " date=" + (date||"null") + " time=" + (time||"null"))
  return { service, date, time, time_window:timeWindow, confirmation, ambiguous_fields, confidence:{service:service?0.85:0,date:date?0.85:0,time:time?0.85:0} }
}

module.exports = { extractEntities }
