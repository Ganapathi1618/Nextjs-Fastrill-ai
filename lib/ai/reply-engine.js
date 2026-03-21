// lib/ai/reply-engine.js — Final reply generation with nuclear think-strip
const { getFallbackReply } = require("./fallback-engine")

function nuclearStrip(raw) {
  if (!raw?.trim()) return null
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim()
  if (cleaned.includes("<think>")) cleaned = cleaned.split("<think>")[0].trim()
  if (!cleaned && raw.includes("</think>")) cleaned = raw.split("</think>").pop().trim()
  if (!cleaned || cleaned.length < 3) return null
  if (cleaned.toLowerCase().includes("<think>") || cleaned.toLowerCase().includes("</think>")) { console.error("❌ think tag survived — refusing to send"); return null }
  const metaPatterns = [/^(the\s+)?(final\s+)?response\s+(should\s+be|is)[:\s]*/i,/^(my\s+)?reply\s+(should\s+be|is)[:\s]*/i,/^(i\s+should\s+say|i\s+will\s+say|i'll\s+say)[:\s]*/i,/^(so\s+)?the\s+(final\s+)?reply\s+is[:\s]*/i,/^okay[,.]?\s+(let me|i need|so)[:\s]*/i]
  for (const p of metaPatterns) cleaned = cleaned.replace(p, "").trim()
  const reasoningRx=[/^the\s+(customer|user)\s+(is|has|wants|asked)/i,/^let\s+me\s+(analyze|think|check)/i,/^(based\s+on|looking\s+at|since\s+the|given\s+that)/i]
  if (reasoningRx.some(rx=>rx.test(cleaned))&&cleaned.length>150) {
    const quoted=cleaned.match(/"([^"]{10,250})"/)?.[1]
    if(quoted&&!reasoningRx.some(rx=>rx.test(quoted)))return quoted.trim()
    const paras=cleaned.split(/\n\n+/).map(p=>p.trim()).filter(p=>p.length>5)
    for(let i=paras.length-1;i>=0;i--){if(paras[i].length<300&&!reasoningRx.some(rx=>rx.test(paras[i])))return paras[i]}
    console.warn("⚠️ reasoning text detected, using fallback"); return null
  }
  return cleaned.length>3?cleaned:null
}

async function generateReply({ message, biz, services, history, firstName, classification, entities, state, relevantChunks }) {
  const start = Date.now()
  if (process.env.SARVAM_API_KEY) {
    try {
      const bizName   = biz?.business_name||"our business"
      const svcBlock  = (services||[]).map(s=>"• "+s.name+": ₹"+s.price+(s.duration?" ("+s.duration+" min)":"")+(s.description?" — "+s.description:"")).join("\n")
      const s         = state||{}
      let bookingHint = ""
      if(s.service||s.date||s.time){
        const col=[],mis=[]
        if(s.service)col.push("service: "+s.service);else mis.push("which service")
        if(s.date)col.push("date: "+s.date);else mis.push("date")
        if(s.time)col.push("time: "+s.time);else mis.push("time")
        bookingHint="\nBooking progress — Collected: "+(col.join(", ")||"nothing")+(mis.length?"\nStill need: "+mis.join(", "):"\nAll collected — ask to confirm!")
      }
      let tone=""
      const sentiment=classification?.sentiment||"neutral"
      if(sentiment==="angry"||sentiment==="annoyed")tone="\nTONE: Customer frustrated. Apologize first. Keep short. Don't upsell."
      else if(sentiment==="confused")tone="\nTONE: Customer confused. Simplify. Ask one clear question."
      else if(sentiment==="hesitant")tone="\nTONE: Customer hesitant. Be reassuring. Recommend best option."

      const systemPrompt = `You are the WhatsApp assistant for *${bizName}*${biz?.business_type?" ("+biz.business_type+")":""}${biz?.location?", "+biz.location:""}.
CRITICAL: Reply ONLY with the final message. No thinking, no reasoning, no meta-commentary.
Keep replies SHORT — 2-3 lines max unless listing services.
Be warm and human. Never robotic. Never repeat what customer already said.
Address customer as "${firstName}" when natural.
${svcBlock?"\nSERVICES:\n"+svcBlock:""}
${biz?.working_hours?"\nHOURS: "+biz.working_hours:""}
${biz?.location?"\nADDRESS: "+biz.location:""}
${biz?.ai_instructions?"\nOWNER INSTRUCTIONS:\n"+biz.ai_instructions:""}
${relevantChunks?"\nKNOWLEDGE:\n"+relevantChunks:""}
${bookingHint}${tone}
INTENT: ${classification?.primary_intent||"unknown"}
LANGUAGE: ${biz?.ai_language||"English"}`

      const res  = await fetch("https://api.sarvam.ai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", "api-subscription-key": process.env.SARVAM_API_KEY }, body: JSON.stringify({ model: "sarvam-m", messages: [{role:"system",content:systemPrompt},...(history||[]),{role:"user",content:message}], max_tokens: 400, temperature: 0.65 }) })
      const data = await res.json()
      if (!data?.error) {
        const raw   = data?.choices?.[0]?.message?.content||""
        const reply = nuclearStrip(raw)
        if (reply) { console.log("✅ [reply-engine] " + (Date.now()-start) + "ms | " + reply.substring(0,60)); return reply }
        console.warn("⚠️ [reply-engine] nuclearStrip returned null — using fallback")
      } else { console.error("❌ [reply-engine]", data.error.message) }
    } catch(e) { console.error("❌ [reply-engine] exception:", e.message) }
  }
  return getFallbackReply({ intent: classification, state, biz, services, firstName, message })
}

module.exports = { generateReply }
