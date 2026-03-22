// lib/ai/extractor.js — Entity extraction with 10 Indian language support
const { parseJSON }                            = require("./classifier")
const { isValidDate, isPastDate, getTodayStr } = require("../booking/calendar-engine")

async function extractEntities({ message, history, services, state }) {
  const start = Date.now()

  if (process.env.SARVAM_API_KEY) {
    try {
      const serviceNames  = (services || []).map(s => s.name).join(", ") || "none"
      const recentHistory = (history || []).slice(-4).map(m =>
        (m.role === "user" ? "Customer" : "AI") + ": " + m.content
      ).join("\n")
      const todayStr = new Date().toLocaleDateString("en-IN", {
        weekday:"long", day:"numeric", month:"long", year:"numeric", timeZone:"Asia/Kolkata"
      })

      const prompt = `You are an entity extractor for a WhatsApp booking assistant.
Today is: ${todayStr}
Available services: ${serviceNames}
Current state: service="${state?.service||"none"}" date="${state?.date||"none"}" time="${state?.time||"none"}"

Recent conversation:
${recentHistory || "(no history)"}

Latest message: "${message}"

IMPORTANT: Customer may write in ANY Indian language — Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, or English. Extract entities regardless of language.
Common patterns: "kal"/"aagami kaal" = tomorrow, "aaj"/"inru"/"ippo" = today, "parso" = day after tomorrow.
Time: "subah/morning" = 09:00-12:00, "dopahar/afternoon" = 12:00-16:00, "shaam/evening" = 16:00-20:00, "raat/night" = 20:00-22:00.

Reply ONLY with valid JSON:
{"service":"<exact service name from list or null>","date":"<YYYY-MM-DD or null>","time":"<HH:MM 24hr or null>","time_window":"<morning|afternoon|evening|night or null>","confirmation":"<true|false|null>","ambiguous_fields":[],"confidence":{"service":0.0,"date":0.0,"time":0.0}}`

      const res  = await fetch("https://api.sarvam.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-subscription-key": process.env.SARVAM_API_KEY },
        body: JSON.stringify({ model: "sarvam-m", messages: [{ role: "user", content: prompt }], max_tokens: 200, temperature: 0.1 })
      })
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
    } catch(e) { console.warn("⚠️ [extractor] Sarvam failed:", e.message) }
  }

  return ruleBasedExtract(message, services, state)
}

function ruleBasedExtract(message, services, state) {
  const m      = (message || "").toLowerCase().trim()
  const now    = new Date()
  const pad    = n => String(n).padStart(2, "0")
  const toStr  = d => d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate())
  const todayStr = getTodayStr()

  // ── Service matching ──────────────────────────────────────────
  let service = state?.service || null
  if (!service && services?.length) {
    for (const s of services) {
      if (m.includes(s.name.toLowerCase())) { service = s.name; break }
    }
    if (!service) {
      for (const s of services) {
        const words = s.name.toLowerCase().split(/\s+/).filter(w => w.length > 3)
        if (words.some(w => m.includes(w))) { service = s.name; break }
      }
    }
  }

  // ── Date extraction (multilingual) ───────────────────────────
  let date = state?.date || null
  if (!date) {
    if (/\b(today|aaj|ippo|inru|ivattu|ivale|innu|innaikku|aaj ke|aajke|aaje)\b/.test(m)) {
      date = todayStr
    } else if (/\b(tomorrow|kal|kl|naale|naalai|naalaiku|agami\s*kal|udya|kaale)\b/.test(m)) {
      const t = new Date(now); t.setDate(now.getDate()+1); date = toStr(t)
    } else if (/\b(day after|parso|parsho|naalai marunaal|porshoo)\b/.test(m)) {
      const t = new Date(now); t.setDate(now.getDate()+2); date = toStr(t)
    } else {
      // Day names — English + Hindi + Telugu + Tamil + other languages
      const days = [
        ["sunday","sun","ravivar","ravivaar","iravaar","bhaanuvaar"],
        ["monday","mon","somvar","somvaar","thingazhmai","sombaar"],
        ["tuesday","tue","mangalvar","mangalvaar","sevvai","mongolbaar"],
        ["wednesday","wed","budhvar","budhvaar","budhan","budhbaar"],
        ["thursday","thu","guruvar","guruvaar","viyazhan","brihoshpotibaar"],
        ["friday","fri","shukravar","shukravaar","velli","shukrobaar"],
        ["saturday","sat","shanivar","shanivaar","shani","shonibaar"]
      ]
      for (let i = 0; i < days.length; i++) {
        if (days[i].some(d => new RegExp("\\b" + d + "\\b").test(m))) {
          let diff = (i - now.getDay() + 7) % 7
          if (diff === 0) diff = 7
          const t = new Date(now); t.setDate(now.getDate() + diff); date = toStr(t); break
        }
      }

      // "25th march" / "march 25" pattern
      if (!date) {
        const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"]
        for (let i = 0; i < months.length; i++) {
          const re = new RegExp("(\\d{1,2})(?:st|nd|rd|th)?\\s*" + months[i] + "|" + months[i] + "\\s*(\\d{1,2})(?:st|nd|rd|th)?", "i")
          const dm = m.match(re)
          if (dm) {
            const day = parseInt(dm[1] || dm[2])
            if (day >= 1 && day <= 31) date = now.getFullYear() + "-" + pad(i+1) + "-" + pad(day)
            break
          }
        }
      }

      // Bare number like "28" or "28th" — treat as day of month
      if (!date) {
        const bareDay = m.match(/^(\d{1,2})(?:st|nd|rd|th)?$/)
        if (bareDay) {
          const day = parseInt(bareDay[1])
          if (day >= 1 && day <= 31) {
            let month = now.getMonth() + 1
            let year  = now.getFullYear()
            const candidate = year + "-" + pad(month) + "-" + pad(day)
            if (isValidDate(candidate) && !isPastDate(candidate)) {
              date = candidate
            } else {
              month = month === 12 ? 1 : month + 1
              year  = month === 1 ? year + 1 : year
              const next = year + "-" + pad(month) + "-" + pad(day)
              if (isValidDate(next)) date = next
            }
          }
        }
      }

      // DD/MM format
      if (!date) {
        const dm = m.match(/(\d{1,2})[\/\-](\d{1,2})/)
        if (dm) {
          const day = parseInt(dm[1]), month = parseInt(dm[2])
          if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
            date = now.getFullYear() + "-" + pad(month) + "-" + pad(day)
          }
        }
      }
    }
  }

  if (date && !isValidDate(date)) { console.warn("[extractor] invalid date cleared:", date); date = null }
  if (date && isPastDate(date))   { console.warn("[extractor] past date cleared:", date);    date = null }

  // ── Time extraction (multilingual) ───────────────────────────
  let time = state?.time || null
  let timeWindow = null

  if (!time) {
    if      (/\b(morning|subah|kalai|beligge|ravile|sakali|sokal|savare|savere)\b/.test(m))         timeWindow = "morning"
    else if (/\b(afternoon|dopahar|madhyahnam|madhyanam|dupari|dupur|bapore|dupahar)\b/.test(m))    timeWindow = "afternoon"
    else if (/\b(evening|shaam|sayantram|malai|sanje|vaikunneram|sandhyakal|bikel|sanjh)\b/.test(m)) timeWindow = "evening"
    else if (/\b(night|raat|ratri|iravu|raatri|raathriya|raat)\b/.test(m))                          timeWindow = "night"

    // HH:MM or H:MM with optional am/pm
    const tm = m.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i) || m.match(/(\d{2}):(\d{2})/)
    if (tm) {
      let hour = parseInt(tm[1])
      const min = (tm[2] || "00").padStart(2, "0")
      const ap  = (tm[3] || "").toLowerCase()
      if (ap === "pm" && hour < 12) hour += 12
      if (ap === "am" && hour === 12) hour = 0
      if (hour >= 7 && hour <= 22) time = pad(hour) + ":" + min
    }

    // "3 baje", "5 baje" — Hindi/Urdu time expressions
    if (!time) {
      const bajeMatch = m.match(/(\d{1,2})\s*(baje|vajta|ganta|mani|ghante)\b/)
      if (bajeMatch) {
        let hour = parseInt(bajeMatch[1])
        if      (timeWindow === "morning"   && hour <= 12) { /* keep */ }
        else if (timeWindow === "evening"   && hour < 12)  hour += 12
        else if (timeWindow === "afternoon" && hour < 12)  hour += 12
        else if (hour < 7)                                  hour += 12
        if (hour >= 7 && hour <= 22) time = pad(hour) + ":00"
      }
    }

    // Bare number — only when AI just asked for time
    if (!time && state?.last_ai_question === "time") {
      const bareNum = m.match(/^(\d{1,2})$/)
      if (bareNum) {
        let hour = parseInt(bareNum[1])
        if (hour >= 1 && hour <= 9) hour += 12 // assume PM
        if (hour >= 7 && hour <= 22) {
          time = pad(hour) + ":00"
          console.log("[extractor] bare number → " + time + " (PM assumed)")
        }
      }

      // Word numbers: "five", "six" etc
      const wordNums = { one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10, eleven:11, twelve:12 }
      if (!time) {
        for (const [word, num] of Object.entries(wordNums)) {
          if (m === word || m.startsWith(word + " ")) {
            let hour = num >= 1 && num <= 9 ? num + 12 : num
            if (hour >= 7 && hour <= 22) { time = pad(hour) + ":00"; break }
          }
        }
      }
    }
  }

  // ── Confirmation (multilingual) ───────────────────────────────
  const mTrim = m.trim()
  const confirmWords = [
    "yes","yeah","yep","ok","okay","sure","confirm","correct","done","go ahead","book it","proceed",
    "sounds good","that works","yeah that works","perfect","absolutely","definitely",
    "haan","ha","ji","theek","bilkul","sahi","pakka","kar do","ho jayega",
    "avunu","sare","cheseyandi","aam","sari","seri","pannunga",
    "howdu","aanu","sheri","ho","hoy","chaalel","kara",
    "haa","hyan","thik","koro","hobe","barabar","chalega","haanji"
  ]
  const cancelWords = ["no","nope","cancel","nahi","mat","vaddu","venda","beda","nako","na","nathi"]
  const confirmation = confirmWords.some(w => mTrim === w || mTrim.startsWith(w + " ")) ? true
    : cancelWords.some(w => mTrim === w) ? false : null

  const ambiguous_fields = []
  if (!service)             ambiguous_fields.push("service")
  if (!date)                ambiguous_fields.push("date")
  if (!time && !timeWindow) ambiguous_fields.push("time")

  console.log("⚡ [extractor] rule-based: svc=" + (service||"null") + " date=" + (date||"null") + " time=" + (time||"null"))
  return { service, date, time, time_window: timeWindow, confirmation, ambiguous_fields, confidence: { service: service?0.85:0, date: date?0.85:0, time: time?0.85:0 } }
}

module.exports = { extractEntities }
