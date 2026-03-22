// lib/ai/classifier.js — Intent + sentiment classification with 10 Indian languages

const INTENTS = ["greeting","service_inquiry","pricing","booking_new","booking_confirm","booking_lookup","booking_reschedule","booking_cancel","location_query","hours_query","policy_query","recommendation_request","complaint","frustration","human_handoff","followup_response","out_of_scope","gratitude"]
const SENTIMENTS = ["neutral","positive","confused","hesitant","annoyed","angry","urgent"]

function parseJSON(raw, stage) {
  try {
    let clean = (raw || "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim()
    if (clean.includes("<think>")) clean = clean.split("<think>")[0].trim()
    clean = clean.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim()
    const match = clean.match(/\{[\s\S]*\}/)
    if (!match) return null
    return JSON.parse(match[0])
  } catch(e) { console.warn("[" + stage + "] JSON parse failed:", e.message); return null }
}

// ── Greeting patterns — 10 Indian languages ──────────────────
const GREETING_PATTERNS = [
  /^(hi|hello|hey|hii|hola|hai|yo)[!\s.]*$/i,
  /^(namaste|namaskar|namasthe|pranam|vanakkam|namaskaram|namaskara)[!\s.]*$/i,
  /^good\s+(morning|evening|afternoon|night)[!\s.]*$/i,
  /^(suprabhat|shubh\s+(ratri|sandhya|prabhat))[!\s.]*$/i,
  /^(nomoshkar|nomoskar|kemon\s+acho|ki\s+khobor)[!\s.]*$/i,
  /^(kem\s+cho|su\s+khabar|jay\s+shree\s+krishna)[!\s.]*$/i,
  /^(sat\s+sri\s+akal|ki\s+haal|kiddan|kiddha)[!\s.]*$/i,
  /^(baagunnara|ela\s+unnaru|em\s+chestunnaru)[!\s.]*$/i,
  /^(vanakkam|epdi\s+irukeenga|eppadi\s+irukkinga)[!\s.]*$/i,
  /^(hegidira|heg\s+iddira|namaskara|yenri)[!\s.]*$/i,
  /^(sughamano|enthokke\s+und|sugham\s+alle)[!\s.]*$/i,
  /^(kasa\s+aahat|kashi\s+aahe|namaskar)[!\s.]*$/i,
]

// ── Multilingual keyword lists ────────────────────────────────
const BOOKING_KW = [
  "book","appointment","slot","schedule","want to come","visit","reserve","booking",
  "book karo","booking karna","appointment lena","slot chahiye","aana hai","aana chahta","aana chahti",
  "book cheyyi","appointment kavali","slot kavali","ravali","ravalani",
  "book pannu","appointment venum","slot venum","vara venum","varavum",
  "book madi","appointment beku","slot beku","barbekku","barali",
  "book cheyyuka","appointment venam","slot venam","varanam","varanamennu",
  "book kara","appointment pahije","slot pahije","yayche aahe","yaycha aahe",
  "book korte chai","appointment chai","slot chai","ashbo","ashte chai",
  "book karo","appointment joie","slot joie","aavvu chhe","aavvanu chhe",
  "book karo","appointment chahida","slot chahida","auna hai","aana chahunda",
]

const PRICING_KW = [
  "price","cost","how much","rate","charge","fee","offer","package","kitna","kitni","kya rate",
  "kitna lagega","kitna hoga","kitne ka","kitne paise","charge kya","fees kya","daam","rate batao","price batao",
  "entha","entha avutundi","rate enta","charge enta","dhara enta","dabbu entha",
  "evvalavu","vilai enna","rate enna","charge enna","thogai enna","kaasu evvalavu",
  "yeshtu","rate yeshtu","charge yeshtu","bele yeshtu","paisaa yeshtu",
  "ethrayanu","rate ethra","charge ethra","vila ethra","paisa ethra",
  "kimat kai","rate kai","charge kai","kiti lagel","kiti hota",
  "koto","daam koto","rate koto","charge koto","koto taka","koto lagbe",
  "ketla","rate ketla","charge ketla","bhav ketla","paisa ketla",
  "kinne da","rate ki","charge ki","kitne da","paise kitne",
]

const LOCATION_KW = [
  "where","address","location","maps","directions","how to reach",
  "kahan","kahan hai","address kya","kaise aaye","kaise pahuchein","jagah","pata batao",
  "ekkada","address enti","ekkadundi","ela ravali","chotu",
  "enga","address enna","enga irukku","eppadi vara","idam",
  "elli","address yenu","yellidhe","hege barodu","jagaa",
  "evide","address ethu","evide anu","engane varanam","sthalam",
  "kuthe","address kay","kuthe aahe","kasa yenar","jagaa",
  "kothay","address ki","kothay hobe","kibhabe ashbo","jaygaa",
  "kya","address shu","kya chhe","kem aavvanu","jagya",
  "kithe","address ki","kithe hai","kiven auna","jagah",
]

const HOURS_KW = [
  "timing","hours","open","close","when","working","time",
  "samay","kab khulta","kab band","kitne baje","kab aaye","timing kya",
  "samayam","eppudu","eppudu terastaru","eppudu moostaru","timing enti",
  "neram","eppothu","eppothu thirakkirathu","eppothu mooduthu","timing enna",
  "samaya","yaavaga","yaavaga tegeyuttaare","yaavaga moosuttaare","timing yenu",
  "samayam","eppol","eppol thurakkunnu","eppol adaykunnu","timing enthu",
  "vel","kevha","kevha ughadte","kevha band hote","timing kay",
  "somoy","kokhon","kokhon khole","kokhon bondho","timing ki",
  "samay","kyare","kyare khule","kyare bandh","timing shu",
  "samaan","kaddho","kaddo khulde","kaddo band","timing ki",
]

const RESCHEDULE_KW = [
  "reschedule","change","postpone","different time","another day","shift booking",
  "badalna","change karo","alag din","alag time","postpone karo","date change",
  "maarchu","change cheyyi","vere roju","vere time","postpone cheyyi",
  "maathu","change pannu","vera naal","vera neram","postpone pannu",
  "badalaayisu","change maadi","bere dina","bere samaya",
  "maattuka","change cheyyuka","vere divasam","vere samayam",
  "badala","change kara","vegla divas","vegli vel",
  "bodlao","change koro","onno din","onno somoy",
  "badlo","change karo","bijo divas","biji time",
  "badlo","change karo","hor din","hor time",
]

const CANCEL_KW = [
  "cancel","don't want","not coming","won't come",
  "cancel karo","nahi aana","nahi aaunga","nahi aaungi","booking cancel","mat karo",
  "cancel cheyyi","raanu","cancel cheyyandi","vaddu",
  "cancel pannu","varamattein","venda","cancel pannunga",
  "cancel maadi","baralla","beda","cancel maadkondi",
  "cancel cheyyuka","varunilla","venda","cancel cheyyoole",
  "cancel kara","yenyacha nahi","nako","cancel kara booking",
  "cancel koro","ashbo na","darkar nei","cancel kore dao",
  "cancel karo","nahi aavvanu","nathi joitu","cancel karo ne",
  "cancel karo","nahi auna","nahi chahida","cancel kar do",
]

const CONFIRM_KW = [
  "yes","yeah","yep","ok","okay","sure","confirm","correct","done","go ahead","proceed","book it",
  "sounds good","sounds great","that works","yeah that works","perfect","absolutely","definitely",
  "haan","ha","ji","theek","theek hai","bilkul","sahi","pakka","kar do","ho jayega",
  "avunu","sare","okay","cheseyandi","confirm cheyyi","avutundi","sarele",
  "aam","sari","seri","pannunga","confirm pannu","aagatum","sariya",
  "howdu","sari","okay","maadi","confirm maadi","aguthe","aaitu",
  "aanu","sheri","sheriya","okay","cheyyuka","confirm cheyyuka","sheri aanu",
  "ho","hoy","theek aahe","chaalel","kara","confirm kara","barobar","bhari",
  "haa","hyan","thik","thik achhe","koro","confirm koro","hobe","hobena",
  "ha","haan","thik","barabar","karo","confirm karo","chaalse","hase",
  "haanji","haan","theek","theek hai","karo","confirm karo","ho jayega","chalega",
]

const HUMAN_KW = [
  "human","agent","person","owner","manager","speak to","talk to","real person",
  "insaan se","manager se","owner se","baat karo kisi se","staff se baat","boss se",
  "manishi tho","manager tho","owner tho","evaraina tho","staff tho",
  "manithar","manager kitta","owner kitta","yaaravadhu kitta","staff kitta",
  "manushya","manager jothe","owner jothe","yaarigadru jothe","staff jothe",
  "manushyan","manager ode","owner ode","aarenkkilum ode","staff ode",
  "manus","manager shi","owner shi","konala tari","staff shi",
  "manush","manager er shathe","owner er shathe","karo shathe","staff er shathe",
  "manas","manager sathe","owner sathe","koi sathe","staff sathe",
  "insaan","manager naal","owner naal","kise naal","staff naal",
]

const COMPLAINT_KW = [
  "problem","issue","wrong","bad","terrible","complaint","not good","worst","disappointed","unhappy","cheated",
  "problem hai","galat","kharab","bura","dikkat","pareshani","dhokha","bekar","ghatiya",
  "problem undi","tappuga","cheddaga","chala cheddaga","baadha","mosam",
  "problem irukku","thappu","mosamana","kettathu","kastam","mosam",
  "problem ide","tappu","ketta","thumba ketta","kashta","mosam",
  "problem undu","thettanu","mosamaanu","vallya mosam","kashttam","cheating",
  "problem aahe","chukicha","vaait","khup vaait","tras","dhokha",
  "problem achhe","bhul","kharap","khub kharap","jhamela","thokabaji",
  "problem chhe","kharab","bhundu","bahuj kharab","taklif","dhokho",
  "problem hai","galat","manda","bahut manda","pareshani","dhokha",
]

const GRATITUDE_KW = [
  "thank","thanks","ok thanks","great","perfect","awesome","wonderful","amazing",
  "dhanyavaad","shukriya","bahut accha","shandar","badiya","zabardast",
  "dhanyavaadalu","thanks ra","baagundu","manchi","super","chaala bagundi",
  "nandri","romba nandri","super","nalla irukku","arumai","romba nalla",
  "dhanyavaada","thanks guru","thumba chennagide","super","bahaala","manchi",
  "nanni","thanks","valare nannaayi","super","adipoli","mashi",
  "dhanyavaad","aabhari","khup chaan","mast","bhari","zabardast",
  "dhonnobad","thank you","khub bhalo","darun","osonkhya","fatafati",
  "aabhar","dhanyavaad","bahuj saru","maja","fatafat","zabardast",
  "dhanvaad","shukriya","bahut vadiya","shandar","kamaal","bahut badhiya",
]

// ── Sentiment detection ───────────────────────────────────────
const SENTIMENT_ANGRY_KW   = ["angry","furious","worst","terrible","pathetic","useless","disgusting","fraud","scam","cheat","gussa","naraaz","bahut bura","ghatiya","bekar","bakwas","dhokha","mosam","kharap","thokabaji"]
const SENTIMENT_ANNOYED_KW = ["annoyed","irritated","frustrated","not happy","disappointed","fed up","sick of","pareshan","dikkat","tang","sataya","baar baar","phir se","kitni baar"]
const SENTIMENT_CONFUSED_KW= ["confused","don't understand","not clear","what do you mean","explain","kuch samajh nahi","samajh nahi aaya","kya matlab","clear nahi","puriyala","artham kala"]
const SENTIMENT_HESITANT_KW= ["maybe","not sure","thinking","let me think","decide later","soch raha","shayad","dekhte hai","baad mein","alochinchu","yosikkiren"]
const SENTIMENT_URGENT_KW  = ["urgent","asap","immediately","right now","emergency","jaldi","abhi","turant","fatafat","tatkaal","vegam","vegane"]

function detectSentiment(m) {
  if (SENTIMENT_ANGRY_KW.some(k => m.includes(k)))    return { sentiment: "angry",    urgency: "high"   }
  if (SENTIMENT_ANNOYED_KW.some(k => m.includes(k)))  return { sentiment: "annoyed",  urgency: "medium" }
  if (SENTIMENT_URGENT_KW.some(k => m.includes(k)))   return { sentiment: "urgent",   urgency: "high"   }
  if (SENTIMENT_CONFUSED_KW.some(k => m.includes(k))) return { sentiment: "confused", urgency: "low"    }
  if (SENTIMENT_HESITANT_KW.some(k => m.includes(k))) return { sentiment: "hesitant", urgency: "low"    }
  if (GRATITUDE_KW.some(k => m.includes(k)))          return { sentiment: "positive", urgency: "low"    }
  return { sentiment: "neutral", urgency: "low" }
}

function ruleBasedClassify(message) {
  const m = (message || "").toLowerCase().trim()

  // Greeting check — regex patterns first
  for (const rx of GREETING_PATTERNS) {
    if (rx.test(m)) return { primary_intent: "greeting", secondary_intent: null, ...detectSentiment(m), confidence: 0.80, reason: "rule-based-multilingual" }
  }

  // Intent detection — order matters
  if (RESCHEDULE_KW.some(k => m.includes(k)))                        return { primary_intent: "booking_reschedule", secondary_intent: null, ...detectSentiment(m), confidence: 0.78, reason: "rule-based-multilingual" }
  if (CANCEL_KW.some(k => m.includes(k)))                            return { primary_intent: "booking_cancel",     secondary_intent: null, ...detectSentiment(m), confidence: 0.78, reason: "rule-based-multilingual" }
  if (CONFIRM_KW.some(k => m.trim() === k || m.startsWith(k + " "))) return { primary_intent: "booking_confirm",    secondary_intent: null, ...detectSentiment(m), confidence: 0.80, reason: "rule-based-multilingual" }
  if (COMPLAINT_KW.some(k => m.includes(k)))                         return { primary_intent: "complaint",          secondary_intent: null, sentiment: "annoyed",  urgency: "high", confidence: 0.78, reason: "rule-based-multilingual" }
  if (HUMAN_KW.some(k => m.includes(k)))                             return { primary_intent: "human_handoff",      secondary_intent: null, ...detectSentiment(m), confidence: 0.78, reason: "rule-based-multilingual" }
  if (BOOKING_KW.some(k => m.includes(k)))                           return { primary_intent: "booking_new",        secondary_intent: null, ...detectSentiment(m), confidence: 0.78, reason: "rule-based-multilingual" }
  if (PRICING_KW.some(k => m.includes(k)))                           return { primary_intent: "pricing",            secondary_intent: null, ...detectSentiment(m), confidence: 0.78, reason: "rule-based-multilingual" }
  if (LOCATION_KW.some(k => m.includes(k)))                          return { primary_intent: "location_query",     secondary_intent: null, ...detectSentiment(m), confidence: 0.78, reason: "rule-based-multilingual" }
  if (HOURS_KW.some(k => m.includes(k)))                             return { primary_intent: "hours_query",        secondary_intent: null, ...detectSentiment(m), confidence: 0.78, reason: "rule-based-multilingual" }
  if (GRATITUDE_KW.some(k => m.includes(k)))                         return { primary_intent: "gratitude",          secondary_intent: null, sentiment: "positive", urgency: "low",  confidence: 0.78, reason: "rule-based-multilingual" }

  return { primary_intent: "out_of_scope", secondary_intent: null, ...detectSentiment(m), confidence: 0.65, reason: "rule-based-no-match" }
}

async function classifyMessage({ message, history, biz }) {
  const start = Date.now()
  if (process.env.SARVAM_API_KEY) {
    try {
      const recentHistory = (history || []).slice(-4).map(m => (m.role === "user" ? "Customer" : "AI") + ": " + m.content).join("\n")
      const prompt = `You are a message classifier for a WhatsApp business assistant.
Business: ${biz?.business_name || "a service business"} (${biz?.business_type || ""})
Recent conversation:\n${recentHistory || "(no history)"}
Latest customer message: "${message}"

IMPORTANT: Customer may write in ANY Indian language (Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi) or English. Classify accurately regardless of language.

Reply ONLY with valid JSON, no explanation:
{"primary_intent":"<one of: ${INTENTS.join(", ")}>","secondary_intent":"<one or null>","sentiment":"<one of: ${SENTIMENTS.join(", ")}>","urgency":"<low|medium|high>","confidence":<0.0-1.0>,"reason":"<one sentence>","detected_language":"<language name>"}`

      const res  = await fetch("https://api.sarvam.ai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", "api-subscription-key": process.env.SARVAM_API_KEY }, body: JSON.stringify({ model: "sarvam-m", messages: [{ role: "user", content: prompt }], max_tokens: 200, temperature: 0.1 }) })
      const data = await res.json()
      if (!data?.error) {
        const result = parseJSON(data?.choices?.[0]?.message?.content || "", "classifier")
        if (result) { console.log("✅ [classifier] " + result.primary_intent + " | " + result.sentiment + " | " + (result.detected_language || "unknown") + " | " + (Date.now()-start) + "ms"); return result }
      } else { console.error("❌ [classifier]", data.error.message) }
    } catch(e) { console.warn("⚠️ [classifier] failed:", e.message) }
  }
  const fallback = ruleBasedClassify(message)
  console.log("⚡ [classifier] fallback: " + fallback.primary_intent + " | " + fallback.sentiment)
  return fallback
}

module.exports = { classifyMessage, parseJSON }
