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
Current state: service="${state?.service||"none"}" date="${state?.date||"none"}" time="${state?.time||"none"}"
Recent conversation:\n${recentHistory || "(no history)"}
Latest message: "${message}"
Reply ONLY with valid JSON:
{"service":"<exact service name from list or null>","date":"<YYYY-MM-DD or null>","time":"<HH:MM 24hr or null>","time_window":"<morning|afternoon|evening|night or null>","confirmation":"<true|false|null>","ambiguous_fields":[],"confidence":{"service":0.0,"date":0.0,"time":0.0}}`

      const res  = await fetch("https://api.sarvam.ai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", "api-subscription-key": process.env.SARVAM_API_KEY }, body: JSON.stringify({ model: "sarvam-m", messages: [{ role: "user", content: prompt }], max_tokens: 200, temperature: 0.1 }) })
      const data = await res.json()
      if (!data?.error) {
        const result = parseJSON(data?.choices?.[0]?.message?.content || "", "extractor")
        if (result) {
          if (result.date && !isValidDate(result.date)) { console.warn("[extractor] invalid date:", result.date); result.date = null }
          if (result.date && isPastDate(result.date))   { console.warn("[extractor] past date:", result.date);    result.date = null }
          console.log("✅ [extractor] svc=" + (result.service||"null") + " date=" + (result.date||"null") + " | " + (Date.now()-start) + "ms")
          return result
        }
      } else { console.error("❌ [extractor]", data.error.message) }
    } catch(e) { console.warn("⚠️ [extractor] failed:", e.message) }
  }
  return ruleBasedExtract(message, services, state)
}

function ruleBasedExtract(message, services, state) {
  const m       = (message || "").toLowerCase()
  const now     = new Date()
  const pad     = n => String(n).padStart(2,"0")
  const toStr   = d => d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate())
  const todayStr = getTodayStr()

  let service = state?.service || null
  if (!service && services?.length) {
    for (const s of services) { if (m.includes(s.name.toLowerCase())) { service = s.name; break } }
    if (!service) { for (const s of services) { const words = s.name.toLowerCase().split(/\s+/).filter(w => w.length > 3); if (words.some(w => m.includes(w))) { service = s.name; break } } }
  }

  let date = state?.date || null
  if (!date) {
    if (/\b(today|aaj)\b/.test(m))              date = todayStr
    else if (/\b(tomorrow|kal|kl)\b/.test(m))   { const t=new Date(now); t.setDate(now.getDate()+1); date=toStr(t) }
    else if (/\b(day after|parso)\b/.test(m))   { const t=new Date(now); t.setDate(now.getDate()+2); date=toStr(t) }
    else {
      const days=[["sunday","sun"],["monday","mon"],["tuesday","tue"],["wednesday","wed"],["thursday","thu"],["friday","fri"],["saturday","sat"]]
      for (let i=0;i<days.length;i++) {
        if (days[i].some(d => new RegExp("\\b"+d+"\\b").test(m))) {
          let diff=(i-now.getDay()+7)%7; if(diff===0)diff=7
          const t=new Date(now); t.setDate(now.getDate()+diff); date=toStr(t); break
        }
      }
      if (!date) {
        const months=["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"]
        for (let i=0;i<months.length;i++) {
          const re=new RegExp("(\\d{1,2})(?:st|nd|rd|th)?\\s*"+months[i]+"|"+months[i]+"\\s*(\\d{1,2})(?:st|nd|rd|th)?","i")
          const dm=m.match(re); if(dm){date=now.getFullYear()+"-"+pad(i+1)+"-"+pad(parseInt(dm[1]||dm[2]));break}
        }
      }
      if (!date) { const dm=m.match(/(\d{1,2})[\/\-](\d{1,2})/); if(dm)date=now.getFullYear()+"-"+pad(dm[2])+"-"+pad(dm[1]) }
    }
  }
  if (date && !isValidDate(date)) { console.warn("[extractor] invalid date cleared:", date); date=null }
  if (date && isPastDate(date))   { console.warn("[extractor] past date cleared:", date);    date=null }

  let time=state?.time||null, timeWindow=null
  if (!time) {
    if      (/\b(morning|subah)\b/.test(m))     timeWindow="morning"
    else if (/\b(afternoon|dopahar)\b/.test(m)) timeWindow="afternoon"
    else if (/\b(evening|shaam)\b/.test(m))     timeWindow="evening"
    else if (/\b(night|raat)\b/.test(m))        timeWindow="night"
    const tm=m.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i)||m.match(/(\d{2}):(\d{2})/)
    if (tm) {
      let hour=parseInt(tm[1]); const min=(tm[2]||"00").padStart(2,"0"); const ap=(tm[3]||"").toLowerCase()
      if(ap==="pm"&&hour<12)hour+=12; if(ap==="am"&&hour===12)hour=0
      if(hour>=7&&hour<=22)time=pad(hour)+":"+min
    }
  }

  const mTrim=m.trim()
  const confirmWords=["yes","yeah","yep","ok","okay","sure","confirm","correct","haan","ha","ji","theek","done","go ahead","book it","proceed"]
  const cancelWords=["no","nope","cancel","nahi","mat"]
  const confirmation=confirmWords.some(w=>mTrim===w||mTrim.startsWith(w+" "))?true:cancelWords.some(w=>mTrim===w)?false:null

  const ambiguous_fields=[]
  if(!service)ambiguous_fields.push("service")
  if(!date)ambiguous_fields.push("date")
  if(!time&&!timeWindow)ambiguous_fields.push("time")

  return { service, date, time, time_window:timeWindow, confirmation, ambiguous_fields, confidence:{service:service?0.85:0,date:date?0.85:0,time:time?0.85:0} }
}

module.exports = { extractEntities }
