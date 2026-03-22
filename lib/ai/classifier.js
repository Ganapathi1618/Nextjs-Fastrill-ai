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
 
// Multilingual keywords covering: English, Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi
const GREETING_PATTERNS = [
  /^(hi|hello|hey|hii|hola|hai|yo)[!\s.]*$/i,
  /^(namaste|namaskar|namasthe|pranam|vanakkam|namaskaram|namaskara)[!\s.]*$/i,
  /^good\s+(morning|evening|afternoon|night)[!\s.]*$/i,
  // Hindi: suprabhat, shubh sandhya
  /^(suprabhat|shubh\s+(ratri|sandhya|prabhat))[!\s.]*$/i,
  // Bengali: nomoshkar, kemon acho
  /^(nomoshkar|nomoskar|kemon\s+acho|ki\s+khobor)[!\s.]*$/i,
  // Gujarati: kem cho, su khabar
  /^(kem\s+cho|su\s+khabar|jay\s+shree\s+krishna)[!\s.]*$/i,
  // Punjabi: sat sri akal, kiddan, ki haal
  /^(sat\s+sri\s+akal|ki\s+haal|kiddan|kiddha)[!\s.]*$/i,
  // Telugu: baagunnara, ela unnaru
  /^(baagunnara|ela\s+unnaru|em\s+chestunnaru)[!\s.]*$/i,
  // Tamil: vanakkam, epdi irukeenga
  /^(vanakkam|epdi\s+irukeenga|eppadi\s+irukkinga)[!\s.]*$/i,
  // Kannada: hegidira, namaskara
  /^(hegidira|heg\s+iddira|namaskara|yenri)[!\s.]*$/i,
  // Malayalam: sughamano, enthonn und
  /^(sughamano|enthokke\s+und|sugham\s+alle)[!\s.]*$/i,
  // Marathi: kasa aahat, kashi aahe
  /^(kasa\s+aahat|kashi\s+aahe|namaskar)[!\s.]*$/i,
]
 
const BOOKING_KW = [
  // English
  "book","appointment","slot","schedule","want to come","visit","reserve","booking",
  // Hindi
  "book karo","booking karna","appointment lena","slot chahiye","aana hai","aana chahta","aana chahti",
  // Telugu
  "book cheyyi","appointment kavali","slot kavali","ravali","ravalani",
  // Tamil
  "book pannu","appointment venum","slot venum","vara venum","varavum",
  // Kannada
  "book madi","appointment beku","slot beku","barbekku","barali",
  // Malayalam
  "book cheyyuka","appointment venam","slot venam","varanam","varanamennu",
  // Marathi
  "book kara","appointment pahije","slot pahije","yayche aahe","yaycha aahe",
  // Bengali
  "book korte chai","appointment chai","slot chai","ashbo","ashte chai",
  // Gujarati
  "book karo","appointment joie","slot joie","aavvu chhe","aavvanu chhe",
  // Punjabi
  "book karo","appointment chahida","slot chahida","auna hai","aana chahunda",
]
 
const PRICING_KW = [
  // English
  "price","cost","how much","rate","charge","fee","offer","package","kitna","kitni","kya rate",
  // Hindi
  "kitna lagega","kitna hoga","kitne ka","kitne paise","charge kya","fees kya","daam","rate batao","price batao",
  // Telugu
  "entha","entha avutundi","rate enta","charge enta","dhara enta","evaru enta","dabbu entha",
  // Tamil
  "evvalavu","vilai enna","rate enna","charge enna","thogai enna","kaasu evvalavu",
  // Kannada
  "yeshtu","rate yeshtu","charge yeshtu","bele yeshtu","paisaa yeshtu",
  // Malayalam
  "ethrayanu","rate ethra","charge ethra","vila ethra","paisa ethra",
  // Marathi
  "kimat kai","rate kai","charge kai","kiti lagel","kiti hota",
  // Bengali
  "koto","daam koto","rate koto","charge koto","koto taka","koto lagbe",
  // Gujarati
  "ketla","rate ketla","charge ketla","bhav ketla","paisa ketla",
  // Punjabi
  "kinne da","rate ki","charge ki","kitne da","paise kitne",
]
 
const LOCATION_KW = [
  "where","address","location","maps","directions","how to reach",
  // Hindi
  "kahan","kahan hai","address kya","kaise aaye","kaise pahuchein","jagah","pata batao",
  // Telugu
  "ekkada","address enti","ekkadundi","ela ravali","chotu",
  // Tamil
  "enga","address enna","enga irukku","eppadi vara","idam",
  // Kannada
  "elli","address yenu","yellidhe","hege barodu","jagaa",
  // Malayalam
  "evide","address ethu","evide anu","engane varanam","sthalam",
  // Marathi
  "kuthe","address kay","kuthe aahe","kasa yenar","jagaa",
  // Bengali
  "kothay","address ki","kothay hobe","kibhabe ashbo","jaygaa",
  // Gujarati
  "kya","address shu","kya chhe","kem aavvanu","jagya",
  // Punjabi
  "kithe","address ki","kithe hai","kiven auna","jagah",
]
 
const HOURS_KW = [
  "timing","hours","open","close","when","working","time",
  // Hindi
  "samay","kab khulta","kab band","kitne baje","kab aaye","timing kya",
  // Telugu
  "samayam","eppudu","eppudu terastaru","eppudu moostaru","timing enti",
  // Tamil
  "neram","eppothu","eppothu thirakkirathu","eppothu mooduthu","timing enna",
  // Kannada
  "samaya","yaavaga","yaavaga tegeyuttaare","yaavaga moosuttaare","timing yenu",
  // Malayalam
  "samayam","eppol","eppol thurakkunnu","eppol adaykunnu","timing enthu",
  // Marathi
  "vel","kevha","kevha ughadte","kevha band hote","timing kay",
  // Bengali
  "somoy","kokhon","kokhon khole","kokhon bondho","timing ki",
  // Gujarati
  "samay","kyare","kyare khule","kyare bandh","timing shu",
  // Punjabi
  "samaan","kaddho","kaddo khulde","kaddo band","timing ki",
]
 
const RESCHEDULE_KW = [
  "reschedule","change","postpone","different time","another day","shift booking",
  // Hindi
  "badalna","change karo","alag din","alag time","postpone karo","date change",
  // Telugu
  "maarchu","change cheyyi","vere roju","vere time","postpone cheyyi",
  // Tamil
  "maathu","change pannu","vera naal","vera neram","postpone pannu",
  // Kannada
  "badalaayisu","change maadi","bere dina","bere samaya",
  // Malayalam
  "maattuka","change cheyyuka","vere divasam","vere samayam",
  // Marathi
  "badala","change kara","vegla divas","vegli vel",
  // Bengali
  "bodlao","change koro","onno din","onno somoy",
  // Gujarati
  "badlo","change karo","bijo divas","biji time",
  // Punjabi
  "badlo","change karo","hor din","hor time",
]
 
const CANCEL_KW = [
  "cancel","don't want","not coming","won't come",
  // Hindi
  "cancel karo","nahi aana","nahi aaunga","nahi aaungi","booking cancel","mat karo",
  // Telugu
  "cancel cheyyi","raanu","cancel cheyyandi","vaddu",
  // Tamil
  "cancel pannu","varamattein","venda","cancel pannunga",
  // Kannada
  "cancel maadi","baralla","beda","cancel maadkondi",
  // Malayalam
  "cancel cheyyuka","varunilla","venda","cancel cheyyoole",
  // Marathi
  "cancel kara","yenyacha nahi","nako","cancel kara booking",
  // Bengali
  "cancel koro","ashbo na","darkar nei","cancel kore dao",
  // Gujarati
  "cancel karo","nahi aavvanu","nathi joitu","cancel karo ne",
  // Punjabi
  "cancel karo","nahi auna","nahi chahida","cancel kar do",
]
 
const CONFIRM_KW = [
  // English
  "yes","yeah","yep","ok","okay","sure","confirm","correct","done","go ahead","proceed","book it",
  // Hindi
  "haan","ha","ji","theek","theek hai","bilkul","sahi","pakka","kar do","ho jayega",
  // Telugu
  "avunu","sare","okay","cheseyandi","confirm cheyyi","avutundi","sarele",
  // Tamil
  "aam","sari","seri","pannunga","confirm pannu","aagatum","sariya",
  // Kannada
  "howdu","sari","okay","maadi","confirm maadi","aguthe","aaitu",
  // Malayalam
  "aanu","sheri","sheriya","okay","cheyyuka","confirm cheyyuka","sheri aanu",
  // Marathi
  "ho","hoy","theek aahe","chaalel","kara","confirm kara","barobar","bhari",
  // Bengali
  "haa","hyan","thik","thik achhe","koro","confirm koro","hobe","hobena",
  // Gujarati
  "ha","haan","thik","barabar","karo","confirm karo","chaalse","hase",
  // Punjabi
  "haanji","haan","theek","theek hai","karo","confirm karo","ho jayega","chalega",
]
 
const HUMAN_KW = [
  "human","agent","person","owner","manager","speak to","talk to","real person",
  // Hindi
  "insaan se","manager se","owner se","baat karo kisi se","staff se baat","boss se",
  // Telugu
  "manishi tho","manager tho","owner tho","evaraina tho","staff tho",
  // Tamil
  "manithar","manager kitta","owner kitta","yaaravadhu kitta","staff kitta",
  // Kannada
  "manushya","manager jothe","owner jothe","yaarigadru jothe","staff jothe",
  // Malayalam
  "manushyan","manager ode","owner ode","aarenkkilum ode","staff ode",
  // Marathi
  "manus","manager shi","owner shi","konala tari","staff shi",
  // Bengali
  "manush","manager er shathe","owner er shathe","karo shathe","staff er shathe",
  // Gujarati
  "manas","manager sathe","owner sathe","koi sathe","staff sathe",
  // Punjabi
  "insaan","manager naal","owner naal","kise naal","staff naal",
]
 
const COMPLAINT_KW = [
  "problem","issue","wrong","bad","terrible","complaint","not good","worst","disappointed","unhappy","cheated",
  // Hindi
  "problem hai","galat","kharab","complaint","bura","dikkat","pareshani","dhokha","bekar","ghatiya",
  // Telugu
  "problem undi","tappuga","cheddaga","complaint","chala cheddaga","baadha","mosam",
  // Tamil
  "problem irukku","thappu","mosamana","complaint","kettathu","kastam","mosam",
  // Kannada
  "problem ide","tappu","ketta","complaint","thumba ketta","kashta","mosam",
  // Malayalam
  "problem undu","thettanu","mosamaanu","complaint","vallya mosam","kashttam","cheating",
  // Marathi
  "problem aahe","chukicha","vaait","complaint","khup vaait","tras","dhokha",
  // Bengali
  "problem achhe","bhul","kharap","complaint","khub kharap","jhamela","thokabaji",
  // Gujarati
  "problem chhe","kharab","bhundu","complaint","bahuj kharab","taklif","dhokho",
  // Punjabi
  "problem hai","galat","manda","complaint","bahut manda","pareshani","dhokha",
]
 
const GRATITUDE_KW = [
  "thank","thanks","ok thanks","great","perfect","awesome","wonderful","amazing",
  // Hindi
  "dhanyavaad","shukriya","bahut accha","shandar","badiya","zabardast",
  // Telugu
  "dhanyavaadalu","thanks ra","baagundu","manchi","super","chaala bagundi",
  // Tamil
  "nandri","romba nandri","super","nalla irukku","arumai","romba nalla",
  // Kannada
  "dhanyavaada","thanks guru","thumba chennagide","super","bahaala","manchi",
  // Malayalam
  "nanni","thanks","valare nannaayi","super","adipoli","mashi",
  // Marathi
  "dhanyavaad","aabhari","khup chaan","mast","bhari","zabardast",
  // Bengali
  "dhonnobad","thank you","khub bhalo","darun","osonkhya","fatafati",
  // Gujarati
  "aabhar","dhanyavaad","bahuj saru","maja","fatafat","zabardast",
  // Punjabi
  "dhanvaad","shukriya","bahut vadiya","shandar","kamaal","bahut badhiya",
]
 
// Enhanced sentiment detection with multilingual keywords
const SENTIMENT_ANGRY_KW = [
  "angry","furious","worst","terrible","pathetic","useless","disgusting","fraud","scam","cheat",
  "gussa","naraaz","bahut bura","ghatiya","bekar","bakwas","dhokha",
  "mosam","kharap","thokabaji","pagal","bewakoof",
]
 
const SENTIMENT_ANNOYED_KW = [
  "annoyed","irritated","frustrated","not happy","disappointed","fed up","sick of",
  "pareshan","dikkat","tang","sataya","baar baar","phir se","kitni baar",
]
 
const SENTIMENT_CONFUSED_KW = [
  "confused","don't understand","not clear","what do you mean","explain","kuch samajh nahi",
  "samajh nahi aaya","kya matlab","clear nahi","pata nahi","eppudu","puriyala","artham kala",
]
 
const SENTIMENT_HESITANT_KW = [
  "maybe","not sure","thinking","let me think","I'll think","decide later","soch raha","sochu",
  "shayad","pata nahi","dekhte hai","baad mein","later","alochinchu","yosikkiren",
]
 
const SENTIMENT_URGENT_KW = [
  "urgent","asap","immediately","right now","emergency","jaldi","abhi",
  "turant","fatafat","now","quickly","ekdum","tatkaal","vegam","vegane",
]
 
function detectSentiment(message) {
  const m = (message || "").toLowerCase().trim()
  if (SENTIMENT_ANGRY_KW.some(k => m.includes(k)))    return { sentiment: "angry",    urgency: "high" }
  if (SENTIMENT_ANNOYED_KW.some(k => m.includes(k)))  return { sentiment: "annoyed",  urgency: "medium" }
  if (SENTIMENT_URGENT_KW.some(k => m.includes(k)))   return { sentiment: "urgent",   urgency: "high" }
  if (SENTIMENT_CONFUSED_KW.some(k => m.includes(k))) return { sentiment: "confused", urgency: "low" }
  if (SENTIMENT_HESITANT_KW.some(k => m.includes(k))) return { sentiment: "hesitant", urgency: "low" }
  if (GRATITUDE_KW.some(k => m.includes(k)))          return { sentiment: "positive", urgency: "low" }
  return { sentiment: "neutral", urgency: "low" }
}
 
function ruleBasedClassify(message) {
  const m = (message || "").toLowerCase().trim()
  const greetingRx  = /^(hi|hello|hey|hii|namaste|good\s+(morning|evening|afternoon|night)|hola|hai)[!\s.]*$/i
  const reschedKw   = ["reschedule","change","postpone","different time","another day","shift booking"]
  const cancelKw    = ["cancel","don't want","not coming","won't come","nahi aana"]
  const confirmKw   = ["yes","yeah","yep","ok","okay","sure","confirm","haan","ji","theek","done"]
  const bookingKw   = ["book","appointment","slot","schedule","want to come","visit","reserve"]
  const pricingKw   = ["price","cost","how much","rate","charge","fee","offer","package","service"]
  const locationKw  = ["where","address","location","maps","directions","how to reach"]
  const hoursKw     = ["timing","hours","open","close","when","working"]
  const humanKw     = ["human","agent","person","owner","manager","speak to"]
  const complaintKw = ["problem","issue","wrong","bad","terrible","complaint","not good"]
  const gratitudeKw = ["thank","thanks","ok thanks","great","perfect","awesome"]
 
  let primary_intent = "out_of_scope", sentiment = "neutral", urgency = "low"
 
  if (greetingRx.test(m))                         primary_intent = "greeting"
  else if (reschedKw.some(k => m.includes(k)))    primary_intent = "booking_reschedule"
  else if (cancelKw.some(k => m.includes(k)))     primary_intent = "booking_cancel"
  else if (confirmKw.some(k => m.trim() === k))   primary_intent = "booking_confirm"
  else if (bookingKw.some(k => m.includes(k)))    primary_intent = "booking_new"
  else if (pricingKw.some(k => m.includes(k)))    primary_intent = "pricing"
  else if (locationKw.some(k => m.includes(k)))   primary_intent = "location_query"
  else if (hoursKw.some(k => m.includes(k)))      primary_intent = "hours_query"
  else if (humanKw.some(k => m.includes(k)))      primary_intent = "human_handoff"
  else if (complaintKw.some(k => m.includes(k)))  { primary_intent = "complaint"; sentiment = "annoyed" }
  else if (gratitudeKw.some(k => m.includes(k)))  { primary_intent = "gratitude"; sentiment = "positive" }
 
  if (m.includes("urgent") || m.includes("asap")) urgency = "high"
  return { primary_intent, secondary_intent: null, sentiment, urgency, confidence: 0.75, reason: "rule-based" }
 
  // Check greeting patterns (regex-based)
  for (const rx of GREETING_PATTERNS) {
    if (rx.test(m)) return { primary_intent: "greeting", secondary_intent: null, ...detectSentiment(m), confidence: 0.80, reason: "rule-based-multilingual" }
  }
 
  // Check intents (keyword-based, order matters)
  if (RESCHEDULE_KW.some(k => m.includes(k)))                       return { primary_intent: "booking_reschedule", secondary_intent: null, ...detectSentiment(m), confidence: 0.78, reason: "rule-based-multilingual" }
  if (CANCEL_KW.some(k => m.includes(k)))                           return { primary_intent: "booking_cancel",     secondary_intent: null, ...detectSentiment(m), confidence: 0.78, reason: "rule-based-multilingual" }
  if (CONFIRM_KW.some(k => m.trim() === k || m.startsWith(k+" ")))  return { primary_intent: "booking_confirm",    secondary_intent: null, ...detectSentiment(m), confidence: 0.78, reason: "rule-based-multilingual" }
  if (COMPLAINT_KW.some(k => m.includes(k)))                        return { primary_intent: "complaint",          secondary_intent: null, sentiment: "annoyed",  urgency: "high", confidence: 0.78, reason: "rule-based-multilingual" }
  if (HUMAN_KW.some(k => m.includes(k)))                            return { primary_intent: "human_handoff",      secondary_intent: null, ...detectSentiment(m), confidence: 0.78, reason: "rule-based-multilingual" }
  if (BOOKING_KW.some(k => m.includes(k)))                          return { primary_intent: "booking_new",        secondary_intent: null, ...detectSentiment(m), confidence: 0.78, reason: "rule-based-multilingual" }
  if (PRICING_KW.some(k => m.includes(k)))                          return { primary_intent: "pricing",            secondary_intent: null, ...detectSentiment(m), confidence: 0.78, reason: "rule-based-multilingual" }
  if (LOCATION_KW.some(k => m.includes(k)))                         return { primary_intent: "location_query",     secondary_intent: null, ...detectSentiment(m), confidence: 0.78, reason: "rule-based-multilingual" }
  if (HOURS_KW.some(k => m.includes(k)))                            return { primary_intent: "hours_query",        secondary_intent: null, ...detectSentiment(m), confidence: 0.78, reason: "rule-based-multilingual" }
  if (GRATITUDE_KW.some(k => m.includes(k)))                        return { primary_intent: "gratitude",          secondary_intent: null, sentiment: "positive", urgency: "low",  confidence: 0.78, reason: "rule-based-multilingual" }
 
  return { primary_intent: "out_of_scope", secondary_intent: null, ...detectSentiment(m), confidence: 0.65, reason: "rule-based-no-match" }
}
 
async function classifyMessage({ message, history, biz }) {

Expand 5 hidden lines
Business: ${biz?.business_name || "a service business"} (${biz?.business_type || ""})
Recent conversation:\n${recentHistory || "(no history)"}
Latest customer message: "${message}"
 
IMPORTANT: The customer may write in ANY Indian language (Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi) or English. Detect the language and classify intent accurately regardless of language.
 
Reply ONLY with valid JSON, no explanation:
{"primary_intent":"<one of: ${INTENTS.join(", ")}>","secondary_intent":"<one or null>","sentiment":"<one of: ${SENTIMENTS.join(", ")}>","urgency":"<low|medium|high>","confidence":<0.0-1.0>,"reason":"<one sentence>"}`
{"primary_intent":"<one of: ${INTENTS.join(", ")}>","secondary_intent":"<one or null>","sentiment":"<one of: ${SENTIMENTS.join(", ")}>","urgency":"<low|medium|high>","confidence":<0.0-1.0>,"reason":"<one sentence>","detected_language":"<language name>"}`
 
      const res  = await fetch("https://api.sarvam.ai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", "api-subscription-key": process.env.SARVAM_API_KEY }, body: JSON.stringify({ model: "sarvam-m", messages: [{ role: "user", content: prompt }], max_tokens: 150, temperature: 0.1 }) })
      const res  = await fetch("https://api.sarvam.ai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", "api-subscription-key": process.env.SARVAM_API_KEY }, body: JSON.stringify({ model: "sarvam-m", messages: [{ role: "user", content: prompt }], max_tokens: 200, temperature: 0.1 }) })
      const data = await res.json()
      if (!data?.error) {
        const result = parseJSON(data?.choices?.[0]?.message?.content || "", "classifier")
        if (result) { console.log("✅ [classifier] " + result.primary_intent + " | " + (Date.now()-start) + "ms"); return result }
        if (result) { console.log("✅ [classifier] " + result.primary_intent + " | " + result.sentiment + " | " + (result.detected_language || "unknown") + " | " + (Date.now()-start) + "ms"); return result }
      } else { console.error("❌ [classifier]", data.error.message) }
    } catch(e) { console.warn("⚠️ [classifier] failed:", e.message) }
  }
  const fallback = ruleBasedClassify(message)
  console.log("⚡ [classifier] fallback: " + fallback.primary_intent)
  console.log("⚡ [classifier] fallback: " + fallback.primary_intent + " | " + fallback.sentiment)
  return fallback
}
