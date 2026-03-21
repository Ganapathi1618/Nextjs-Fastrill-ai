"use client"
import { useEffect, useRef, useState } from "react"

// ── DATA ─────────────────────────────────────────────────────────────

const CONVOS = {
  booking: [
    { t:"c", m:"Hi, I want to book a haircut tomorrow" },
    { t:"a", m:"Great! 📅 Tomorrow is Saturday 21st — what time works? We're open 10 AM–8 PM 😊" },
    { t:"c", m:"Around 3pm?" },
    { t:"a", m:"Shall I confirm *Haircut* on *Sat, 21 Mar* at *3:00 PM*? ✅" },
    { t:"c", m:"Yes please!" },
    { t:"a", m:"✅ Done! Haircut confirmed for Saturday 21st at 3 PM.\n\nSee you at Riya Salon! 😊" },
  ],
  unknown: [
    { t:"c", m:"Do you do hair straightening?" },
    { t:"a", m:"We don't offer hair straightening 😊 But here's what we do have:\n\n• Haircut — ₹400\n• Hair Spa — ₹800\n• Cleanup — ₹500\n\nWant to book one of these?" },
    { t:"c", m:"Ok hair spa!" },
    { t:"a", m:"Perfect choice! 📅 What date works for your Hair Spa session?" },
    { t:"c", m:"This Sunday" },
    { t:"a", m:"Sunday 22nd — what time works for you? ⏰" },
  ],
  hindi: [
    { t:"c", m:"Bhai facial karwa sakte hai kya?" },
    { t:"a", m:"Haan bilkul! 😊 Facial ₹1,200 mein available hai. Kab aana chahenge?" },
    { t:"c", m:"Kal evening ko" },
    { t:"a", m:"Kal Saturday 21 March — shaam ko 5 baje, 6 baje ya 7 baje?" },
    { t:"c", m:"6 baje theek rahega" },
    { t:"a", m:"Confirm karu — *Facial* Saturday 21 March ko *6:00 PM*? ✅" },
    { t:"c", m:"Ha bilkul" },
    { t:"a", m:"✅ Booking ho gayi!\n\n📋 Facial\n📅 Saturday, 21 March\n⏰ 6:00 PM\n\nRiya Salon mein milenge! 😊" },
  ],
  lead: [
    { t:"c", m:"How much is the bridal package?" },
    { t:"a", m:"Our Bridal Package is ₹8,500 and includes makeup, hair styling, saree draping & bridal mehendi 💍\n\nWhen's the big day? I can check availability for you 😊" },
    { t:"c", m:"March 28th" },
    { t:"a", m:"Exciting! March 28th is a Friday — slots go fast for weddings 🌸\n\nShall I block the day for you? We'll need a ₹1,000 advance to confirm." },
    { t:"c", m:"Yes let's do it" },
    { t:"a", m:"Wonderful! I'll send you the payment link for the advance now.\n\nYour wedding day is going to be beautiful 💐" },
  ],
  angry: [
    { t:"c", m:"Your staff was so rude to me last time. Never coming back" },
    { t:"a", m:"I'm really sorry to hear this 😔 That's absolutely not okay and not how we treat our customers.\n\nCould you tell me a bit more about what happened? I want to make this right for you." },
    { t:"c", m:"The girl at the counter was dismissive when I asked about pricing" },
    { t:"a", m:"I completely understand your frustration and I apologize sincerely. This has been flagged to the salon manager — someone will call you within the hour.\n\nWe'd love to earn your trust back. 🙏" },
  ],
}

const FEATURES = [
  { icon:"🧠", title:"Intent Detection", tag:"Core AI", desc:"Understands what customers actually mean — not just keywords. 'I want to come tomorrow evening' becomes a confirmed booking automatically. Works in Hindi, Telugu, Tamil, and 10 more languages." },
  { icon:"💬", title:"10+ Indian Languages", tag:"Multilingual", desc:"Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, English — auto-detected. Your customer writes what feels natural. Fastrill handles the rest." },
  { icon:"🧩", title:"Interruption Handling", tag:"AI v2", desc:"Customer asks a price question mid-booking? Fastrill answers it and smoothly returns to where it left off — just like a trained human receptionist would." },
  { icon:"😤", title:"Emotion Detection", tag:"AI v2", desc:"Detects when a customer is frustrated, confused, or angry. Adapts tone immediately — empathy first, solution second. Stops upselling when the customer is upset." },
  { icon:"🧠", title:"Customer Memory", tag:"Personalization", desc:"Remembers every customer — preferred services, favorite times, language, past visits. Returns customers feel recognized, not like strangers." },
  { icon:"🎯", title:"Lead Recovery", tag:"Revenue", desc:"Customer dropped mid-booking? Fastrill follows up automatically at the right time. Recovers bookings that would have been permanently lost without a single manual effort." },
  { icon:"👤", title:"Smart Human Handoff", tag:"Escalation", desc:"Knows exactly when to stop and get you involved — refunds, disputes, angry customers, complex requests. Pauses AI, notifies you with full context." },
  { icon:"📢", title:"WhatsApp Campaigns", tag:"Marketing", desc:"Send bulk promotional messages using Meta-approved templates. Target specific customer segments, track opens and replies, measure conversion rate per campaign." },
  { icon:"📊", title:"Full Analytics Dashboard", tag:"Dashboard", desc:"Real-time view of conversations, bookings, leads, campaign performance, AI quality metrics, and revenue. Everything in one beautiful dashboard." },
]

const METRICS = [
  { num:"< 2s",   label:"Average AI response time" },
  { num:"10+",    label:"Languages auto-detected" },
  { num:"24/7",   label:"Always on, never misses" },
  { num:"10min",  label:"Setup, zero tech needed" },
]

const TESTIMONIALS = [
  { init:"P", grad:"#f59e0b,#ef4444", name:"Priya Sharma", biz:"Glow Beauty Parlour, Hyderabad", result:"+40% bookings in month 1", text:"Before Fastrill I was losing bookings at night because nobody was replying on WhatsApp. Now the AI handles everything. I wake up to confirmed bookings every morning." },
  { init:"R", grad:"#3b82f6,#0ea5e9", name:"Dr. Ravi Kumar", biz:"Apollo Skin Clinic, Vijayawada", result:"Saved ₹18,000/month on staff", text:"My patients message in Telugu and the AI replies in Telugu perfectly. It books appointments, answers questions, and follows up on missed slots. I had to see it to believe it." },
  { init:"S", grad:"#00d084,#0ea5e9", name:"Sneha Reddy", biz:"Studio S — 3 branches, Bangalore", result:"Replaced 2 receptionist shifts", text:"We have 3 branches and managing WhatsApp for all of them was impossible. Fastrill handles all three simultaneously. Our staff now focuses on actual customers, not their phones." },
  { init:"A", grad:"#a855f7,#6366f1", name:"Arjun Mehta", biz:"FitLife Gym, Mumbai", result:"320 new members via WhatsApp", text:"I used to spend 3 hours a day responding to membership inquiries. Now Fastrill handles all of it — qualifies leads, explains packages, and books demo sessions automatically." },
  { init:"N", grad:"#f59e0b,#ef4444", name:"Nandini Iyer", biz:"Ayur Wellness Centre, Chennai", result:"Zero missed appointments", text:"Our clients ask questions in Tamil and the AI responds naturally in Tamil. It even follows up 1 hour before appointments. Cancellations dropped by 60%." },
  { init:"V", grad:"#10b981,#0ea5e9", name:"Vikram Nair", biz:"Pixel Agency, Kochi", result:"4x faster lead qualification", text:"We're a digital agency — I use Fastrill to qualify discovery call leads. It asks the right questions, collects budget and timeline, and books calls only with serious prospects." },
]

const FAQS = [
  { q:"Do I need to change my WhatsApp number?", a:"No. You keep your exact same WhatsApp Business number. Fastrill connects through Meta's official Business API. Your customers message the same number they already have saved. Nothing changes on their end." },
  { q:"Is this just for salons and clinics?", a:"Not at all. Fastrill works for any business that gets customers on WhatsApp — gyms, agencies, real estate, coaching, restaurants, retail, and more. If your customers message you, Fastrill can handle it." },
  { q:"What languages does the AI support?", a:"Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, and English — all auto-detected. Your customer writes what feels natural. Fastrill detects the language and responds in the same language, automatically." },
  { q:"Can I reply manually and take over from the AI?", a:"Yes, always. In your dashboard, toggle AI off for any conversation and reply yourself. The AI waits. Toggle it back on and it resumes. You're in full control at all times." },
  { q:"What if a customer says something the AI can't handle?", a:"Fastrill knows its limits. For complex situations — refund disputes, medical questions, frustrated customers — it pauses, notifies you with the full context, and waits. It never guesses on important topics." },
  { q:"How does pricing work? Are there per-message charges?", a:"No per-message charges ever. Flat monthly pricing regardless of volume. WhatsApp does charge for business-initiated messages (like campaigns) per Meta's standard rates, but all AI conversations are covered in your plan." },
  { q:"How long does setup actually take?", a:"10 minutes for a basic setup. Connect WhatsApp via Meta (one click), add your services and working hours, go live. Full setup with custom instructions and all services typically takes 20–30 minutes." },
  { q:"Is there a free trial?", a:"Yes — 14 days free, full Growth plan access, no credit card required. At the end of 14 days you choose to subscribe or not. No automatic charges, no pressure." },
]

const PLANS = [
  {
    name:"Starter", price:"999", period:"month",
    desc:"Perfect for solo operators",
    cta:"Start Free", ctaStyle:"outline", featured:false,
    features:[
      { bold:true,  text:"1 WhatsApp number" },
      { bold:false, text:"AI booking automation" },
      { bold:false, text:"Up to 300 conversations/month" },
      { bold:false, text:"10+ languages" },
      { bold:false, text:"Basic analytics dashboard" },
      { bold:false, text:"Email support" },
    ],
  },
  {
    name:"Growth", price:"1,999", period:"month",
    desc:"For businesses serious about growth",
    cta:"Start Free Trial →", ctaStyle:"green", featured:true,
    ribbon:"Most Popular",
    features:[
      { bold:true,  text:"1 WhatsApp number" },
      { bold:true,  text:"Unlimited conversations" },
      { bold:true,  text:"Customer memory & personalization" },
      { bold:true,  text:"Lead recovery automation" },
      { bold:false, text:"WhatsApp campaigns" },
      { bold:false, text:"Emotion detection & handoff" },
      { bold:false, text:"Advanced analytics" },
      { bold:false, text:"Priority support" },
    ],
  },
  {
    name:"Pro", price:"4,999", period:"month",
    desc:"Multi-branch & enterprise",
    cta:"Contact Us", ctaStyle:"dark", featured:false,
    features:[
      { bold:true,  text:"Up to 5 WhatsApp numbers" },
      { bold:true,  text:"Everything in Growth" },
      { bold:true,  text:"Multi-branch management" },
      { bold:true,  text:"Staff availability routing" },
      { bold:false, text:"Custom AI playbook per branch" },
      { bold:false, text:"API access" },
      { bold:false, text:"Dedicated onboarding" },
      { bold:false, text:"SLA-backed support" },
    ],
  },
]

const USE_CASES = [
  { emoji:"💈", name:"Salons & Parlours",    desc:"Book haircuts, facials, threading. Handle regulars and walk-ins automatically." },
  { emoji:"🧖", name:"Spas & Wellness",      desc:"Schedule massages, body treatments, meditation sessions 24/7." },
  { emoji:"🏥", name:"Clinics & Doctors",    desc:"Manage patient appointments, follow-ups, and pre-visit instructions." },
  { emoji:"🦷", name:"Dental Clinics",       desc:"Auto-book checkups, cleanings, and treatment appointments." },
  { emoji:"💪", name:"Gyms & Fitness",       desc:"Book PT sessions, yoga classes, trial memberships automatically." },
  { emoji:"💅", name:"Nail & Makeup Studios",desc:"Manage nail art, gel, extensions, and bridal bookings." },
  { emoji:"🌿", name:"Ayurvedic & Physio",   desc:"Schedule consultations, therapy, and treatment plan sessions." },
  { emoji:"🏠", name:"Real Estate",          desc:"Qualify property inquiries, schedule site visits, send follow-ups." },
  { emoji:"🎓", name:"Coaching & Training",  desc:"Book discovery calls, batch enrolments, and follow up on leads." },
  { emoji:"🍽️", name:"Restaurants & Cafes", desc:"Take reservations, answer menu questions, confirm bookings." },
  { emoji:"💻", name:"Agencies",             desc:"Qualify leads, book demos, manage discovery call scheduling." },
  { emoji:"🏪", name:"Retail & D2C",         desc:"Answer product questions, take orders, send order updates on WhatsApp." },
]

// ── COMPONENT ─────────────────────────────────────────────────────────

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0)
  const [activeConvo, setActiveConvo]     = useState("booking")
  const [messages, setMessages]           = useState([])
  const [openFaq, setOpenFaq]             = useState(null)
  const [tab, setTab]                     = useState("monthly")
  const convoRef = useRef(null)

  useEffect(() => {
    setMessages([])
    const msgs = CONVOS[activeConvo]
    msgs.forEach((msg, i) => {
      setTimeout(() => {
        setMessages(prev => [...prev, msg])
        if (convoRef.current) convoRef.current.scrollTop = convoRef.current.scrollHeight
      }, i * 450)
    })
  }, [activeConvo])

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("v"); obs.unobserve(e.target) } })
    }, { threshold: 0.06, rootMargin:"0px 0px -24px 0px" })
    document.querySelectorAll(".rv").forEach((el,i) => {
      const parent = el.parentElement
      const siblings = parent ? Array.from(parent.querySelectorAll(":scope > .rv")) : []
      const idx = siblings.indexOf(el)
      if (idx > 0) el.style.transitionDelay = Math.min(idx * 0.07, 0.28) + "s"
      obs.observe(el)
    })
    return () => obs.disconnect()
  }, [])

  const f = FEATURES[activeFeature]

  return (
    <>
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=Outfit:wght@300;400;500;600;700&display=swap');
:root{
  --cr:#faf8f4;--cr2:#f4f1eb;--cr3:#ede9e0;
  --nv:#0f1523;--nv2:#1a2235;--nv3:#243048;
  --gn:#00a86b;--gn2:#00d084;
  --gb:rgba(0,168,107,.08);--gbd:rgba(0,168,107,.2);
  --tx:#1a1a2e;--mu:#64748b;--fa:#94a3b8;
  --bd:#e5e0d8;--bd2:#d1ccc2;
  --sm:0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04);
  --md:0 4px 24px rgba(0,0,0,.08),0 2px 8px rgba(0,0,0,.04);
  --lg:0 20px 60px rgba(0,0,0,.12),0 8px 24px rgba(0,0,0,.06);
  --xl:0 40px 100px rgba(0,0,0,.16);
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{background:#fff;color:var(--tx);font-family:'Outfit',sans-serif;font-size:16px;line-height:1.6;overflow-x:hidden;}
h1,h2,h3{font-family:'Playfair Display',serif;line-height:1.08;letter-spacing:-.02em;}

/* NAV */
.nav{position:fixed;top:0;left:0;right:0;z-index:100;height:64px;padding:0 48px;display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.93);backdrop-filter:blur(20px);border-bottom:1px solid var(--bd);}
.logo{font-family:'Outfit',sans-serif;font-weight:700;font-size:21px;color:var(--tx);text-decoration:none;letter-spacing:-.5px;}
.logo span{color:var(--gn);}
.nav-links{display:flex;align-items:center;gap:28px;list-style:none;}
.nav-links a{color:var(--mu);text-decoration:none;font-size:14px;font-weight:500;transition:color .2s;}
.nav-links a:hover{color:var(--tx);}
.nav-cta{background:var(--nv)!important;color:#fff!important;padding:9px 22px;border-radius:8px;font-weight:600!important;font-size:13.5px!important;}

/* HERO */
.hero{padding:128px 48px 80px;background:var(--cr);position:relative;overflow:hidden;}
.hero-blob1{position:absolute;top:-180px;right:-180px;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(0,168,107,.07) 0%,transparent 70%);pointer-events:none;}
.hero-blob2{position:absolute;bottom:-200px;left:-100px;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(15,21,35,.05) 0%,transparent 70%);pointer-events:none;}
.hero-inner{max-width:1160px;margin:0 auto;display:grid;grid-template-columns:1fr 420px;gap:72px;align-items:center;position:relative;z-index:1;}

/* HERO LEFT */
.hero-eyebrow{display:inline-flex;align-items:center;gap:8px;background:var(--gb);border:1px solid var(--gbd);border-radius:100px;padding:5px 14px;font-size:12.5px;font-weight:600;color:var(--gn);margin-bottom:24px;}
.hero-eyebrow::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--gn);animation:blink 2s infinite;}
@keyframes blink{0%,100%{opacity:1;}50%{opacity:.25;}}
.hero h1{font-size:clamp(38px,5vw,64px);font-weight:800;color:var(--nv);margin-bottom:20px;}
.hero h1 em{font-style:italic;color:var(--gn);}
.hero-sub{font-size:17px;color:var(--mu);line-height:1.7;margin-bottom:36px;max-width:520px;font-weight:400;}
.hero-actions{display:flex;align-items:center;gap:14px;margin-bottom:36px;flex-wrap:wrap;}
.btn-p{display:inline-flex;align-items:center;gap:8px;background:var(--nv);color:#fff;padding:13px 30px;border-radius:10px;font-weight:600;font-size:15px;text-decoration:none;transition:all .2s;box-shadow:0 4px 18px rgba(15,21,35,.25);}
.btn-p:hover{background:var(--nv2);transform:translateY(-2px);}
.btn-g{display:inline-flex;align-items:center;gap:8px;background:transparent;color:var(--tx);padding:13px 24px;border-radius:10px;font-weight:500;font-size:14.5px;text-decoration:none;border:1.5px solid var(--bd2);transition:all .2s;}
.btn-g:hover{border-color:var(--gn);color:var(--gn);}

/* HERO PROOF POINTS */
.hero-proof{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.proof-item{display:flex;align-items:center;gap:9px;font-size:13.5px;color:var(--mu);font-weight:500;padding:10px 14px;background:#fff;border:1px solid var(--bd);border-radius:10px;}
.proof-check{width:20px;height:20px;border-radius:50%;background:var(--gb);border:1px solid var(--gbd);display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--gn);flex-shrink:0;}

/* HERO RIGHT — PHONE */
.hero-phone-wrap{position:relative;display:flex;justify-content:center;}
.hero-phone-wrap::before{content:'';position:absolute;top:-10px;right:-10px;width:100px;height:100px;background-image:radial-gradient(circle,var(--bd2) 1.5px,transparent 1.5px);background-size:13px 13px;opacity:.7;}
.phone{width:280px;background:#1c1c1e;border-radius:44px;padding:12px;box-shadow:var(--xl),0 0 0 1px rgba(255,255,255,.05) inset;position:relative;z-index:1;}
.phone::before{content:'';position:absolute;top:12px;left:50%;transform:translateX(-50%);width:80px;height:24px;background:#1c1c1e;border-radius:0 0 14px 14px;z-index:10;}
.ph-screen{background:#111b21;border-radius:32px;overflow:hidden;}
.ph-hd{background:#1f2c34;padding:36px 12px 10px;display:flex;align-items:center;gap:9px;}
.ph-av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--gn2),#0ea5e9);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#000;flex-shrink:0;}
.ph-nm{font-size:12.5px;font-weight:600;color:#e9edef;}
.ph-st{font-size:10px;color:var(--gn2);}
.ph-msgs{background:#0b141a;padding:9px 7px;display:flex;flex-direction:column;gap:5px;min-height:320px;}
.ph-m{max-width:84%;padding:6px 10px;border-radius:7px;font-size:11px;line-height:1.45;color:#e9edef;}
.ph-m.out{background:#005c4b;align-self:flex-end;border-radius:7px 2px 7px 7px;animation:mi .3s ease both;}
.ph-m.bot{background:linear-gradient(135deg,#0a2a1f,#0d3525);border:1px solid rgba(0,168,107,.2);align-self:flex-start;border-radius:2px 7px 7px 7px;animation:mi .3s ease both;}
.ph-bot-lbl{font-size:9px;color:var(--gn2);font-weight:700;margin-bottom:2px;display:block;}
@keyframes mi{from{opacity:0;transform:translateY(5px);}to{opacity:1;transform:none;}}

/* FLOAT CARDS */
.fc{position:absolute;background:#fff;border:1px solid var(--bd);border-radius:12px;padding:11px 14px;box-shadow:var(--md);display:flex;align-items:center;gap:9px;white-space:nowrap;z-index:2;}
.fc1{top:40px;right:-72px;animation:fl 3s ease-in-out infinite;}
.fc2{bottom:80px;left:-80px;animation:fl 3s ease-in-out 1.5s infinite;}
@keyframes fl{0%,100%{transform:translateY(0);}50%{transform:translateY(-5px);}}
.fc-ic{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;}
.fc-gn{background:var(--gb);}
.fc-bl{background:rgba(59,130,246,.1);}
.fc-num{font-size:16px;font-weight:700;color:var(--tx);line-height:1;}
.fc-lbl{font-size:10.5px;color:var(--mu);}

/* LOGOS */
.logos{padding:28px 0;border-top:1px solid var(--bd);border-bottom:1px solid var(--bd);background:#fff;}
.logos-in{max-width:1160px;margin:0 auto;padding:0 48px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;}
.logos-lbl{font-size:12px;color:var(--fa);font-weight:600;letter-spacing:.5px;text-transform:uppercase;white-space:nowrap;}
.logos-d{width:1px;height:20px;background:var(--bd);flex-shrink:0;}
.logos-row{display:flex;align-items:center;gap:20px;flex-wrap:wrap;}
.bz-pill{font-size:13px;font-weight:600;color:var(--mu);}

/* METRICS STRIP */
.metrics{padding:0;background:var(--nv);}
.metrics-grid{max-width:1160px;margin:0 auto;padding:0 48px;display:grid;grid-template-columns:repeat(4,1fr);}
.metric{padding:40px 32px;text-align:center;border-right:1px solid rgba(255,255,255,.08);}
.metric:last-child{border-right:none;}
.metric-num{font-family:'Playfair Display',serif;font-size:48px;font-weight:700;color:#fff;line-height:1;margin-bottom:8px;}
.metric-acc{color:var(--gn2);}
.metric-lbl{font-size:13.5px;color:rgba(255,255,255,.45);line-height:1.4;}

/* SECTION */
.sec{padding:100px 0;}
.sec-cr{background:var(--cr);}
.sec-wh{background:#fff;}
.sec-nv{background:var(--nv);}
.container{max-width:1160px;margin:0 auto;padding:0 48px;}
.eye{display:inline-flex;align-items:center;gap:8px;font-size:11.5px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gn);margin-bottom:14px;}
.eye::before{content:'';width:18px;height:2px;background:var(--gn);border-radius:1px;}
.eye-wh{color:var(--gn2);}
.eye-wh::before{background:var(--gn2);}
.sec-h{font-size:clamp(30px,4vw,50px);font-weight:800;color:var(--nv);margin-bottom:16px;}
.sec-h-wh{color:#fff;}
.sec-p{font-size:16.5px;color:var(--mu);line-height:1.7;}

/* HOW IT WORKS */
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:56px;position:relative;}
.steps::before{content:'';position:absolute;top:48px;left:calc(16.66% + 20px);right:calc(16.66% + 20px);height:1px;background:linear-gradient(90deg,var(--gn),rgba(0,168,107,.15),var(--gn));}
.step{background:#fff;border:1px solid var(--bd);border-radius:18px;padding:36px 28px;position:relative;z-index:1;transition:all .25s;box-shadow:var(--sm);}
.step:hover{transform:translateY(-5px);box-shadow:var(--lg);border-color:var(--gbd);}
.step-n{width:46px;height:46px;border-radius:12px;background:var(--nv);color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;font-family:'Outfit',sans-serif;margin-bottom:20px;}
.step h3{font-size:19px;font-weight:700;color:var(--nv);margin-bottom:10px;}
.step p{font-size:14px;color:var(--mu);line-height:1.7;}

/* FEATURES */
.feat-layout{display:grid;grid-template-columns:1fr 1fr;gap:48px;margin-top:56px;align-items:start;}
.feat-list{border:1px solid var(--bd);border-radius:18px;overflow:hidden;box-shadow:var(--sm);}
.feat-row{padding:18px 22px;border-bottom:1px solid var(--bd);cursor:pointer;transition:background .15s;display:flex;align-items:flex-start;gap:13px;}
.feat-row:last-child{border-bottom:none;}
.feat-row:hover,.feat-row.on{background:var(--cr);}
.feat-row.on{border-left:3px solid var(--gn);padding-left:19px;}
.fr-ic{width:36px;height:36px;border-radius:9px;background:var(--gb);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;margin-top:1px;}
.fr-t{font-size:14px;font-weight:600;color:var(--nv);margin-bottom:2px;}
.fr-d{font-size:12.5px;color:var(--mu);line-height:1.5;}
.feat-detail{background:var(--cr);border:1px solid var(--bd);border-radius:18px;padding:36px;position:sticky;top:82px;}
.fd-ic{font-size:40px;margin-bottom:16px;}
.fd-t{font-size:24px;font-weight:700;color:var(--nv);margin-bottom:12px;}
.fd-d{font-size:14.5px;color:var(--mu);line-height:1.75;}
.fd-tg{display:inline-block;margin-top:18px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--gn);background:var(--gb);border:1px solid var(--gbd);padding:4px 12px;border-radius:5px;}

/* DEMO */
.demo-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;margin-top:56px;align-items:start;}
.sc-list{display:flex;flex-direction:column;gap:10px;}
.sc{background:#fff;border:1.5px solid var(--bd);border-radius:12px;padding:16px 18px;cursor:pointer;transition:all .2s;}
.sc.on{border-color:var(--gn);box-shadow:0 0 0 3px var(--gb);}
.sc:hover:not(.on){border-color:var(--bd2);box-shadow:var(--sm);}
.sc-t{font-size:14px;font-weight:600;color:var(--nv);margin-bottom:3px;}
.sc-d{font-size:12.5px;color:var(--mu);}
.chat-win{background:#0b141a;border-radius:18px;overflow:hidden;box-shadow:var(--xl);}
.cw-hd{background:#1f2c34;padding:14px 18px;display:flex;align-items:center;gap:11px;}
.cw-msgs{padding:14px;min-height:360px;display:flex;flex-direction:column;gap:9px;overflow-y:auto;}
.cw-m{max-width:78%;padding:8px 13px;border-radius:10px;font-size:13px;line-height:1.55;animation:mi .3s ease both;}
.cw-m.c{background:#005c4b;color:#e9edef;align-self:flex-end;border-radius:10px 2px 10px 10px;}
.cw-m.a{background:#1a2a22;border:1px solid rgba(0,168,107,.2);color:#e9edef;align-self:flex-start;border-radius:2px 10px 10px 10px;}
.cw-al{font-size:9.5px;color:var(--gn2);font-weight:700;margin-bottom:3px;display:block;}

/* USE CASES */
.uc-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:56px;}
.uc-card{background:#fff;border:1px solid var(--bd);border-radius:16px;padding:24px 20px;transition:all .25s;}
.uc-card:hover{border-color:var(--gbd);transform:translateY(-3px);box-shadow:var(--md);}
.uc-em{font-size:28px;margin-bottom:10px;display:block;}
.uc-n{font-size:14.5px;font-weight:600;color:var(--nv);margin-bottom:5px;}
.uc-d{font-size:12.5px;color:var(--mu);line-height:1.5;}

/* VS */
.vs-grid{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:start;margin-top:56px;}
.vs-pts{display:flex;flex-direction:column;gap:12px;margin-top:24px;}
.vs-pt{display:flex;align-items:flex-start;gap:11px;font-size:14.5px;color:rgba(255,255,255,.7);line-height:1.6;}
.vs-ck{width:20px;height:20px;border-radius:50%;background:rgba(0,208,132,.15);border:1px solid rgba(0,208,132,.3);display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--gn2);flex-shrink:0;margin-top:2px;}
.vs-tbl{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:18px;overflow:hidden;}
.vs-thead{display:grid;grid-template-columns:1fr 1fr;background:rgba(255,255,255,.06);}
.vs-th{padding:14px 22px;font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;}
.vs-th.tm{color:rgba(255,255,255,.35);border-right:1px solid rgba(255,255,255,.08);}
.vs-th.us{color:var(--gn2);}
.vs-row{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid rgba(255,255,255,.07);}
.vs-c{padding:12px 22px;font-size:13px;display:flex;align-items:center;gap:7px;}
.vs-c.tm{color:rgba(255,255,255,.38);border-right:1px solid rgba(255,255,255,.07);}
.vs-c.tm::before{content:'✕';color:#f87171;font-size:10px;}
.vs-c.us{color:rgba(255,255,255,.82);font-weight:500;}
.vs-c.us::before{content:'✓';color:var(--gn2);font-size:10px;}

/* SOCIAL PROOF BAR */
.proof-bar{background:var(--cr2);border-top:1px solid var(--bd);border-bottom:1px solid var(--bd);padding:32px 0;}
.proof-bar-in{max-width:1160px;margin:0 auto;padding:0 48px;display:grid;grid-template-columns:repeat(4,1fr);gap:0;}
.pb-item{text-align:center;padding:0 20px;border-right:1px solid var(--bd);}
.pb-item:last-child{border-right:none;}
.pb-num{font-family:'Playfair Display',serif;font-size:36px;font-weight:700;color:var(--nv);line-height:1;margin-bottom:4px;}
.pb-lbl{font-size:13px;color:var(--mu);}

/* PRICING */
.pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:56px;}
.plan{background:#fff;border:1.5px solid var(--bd);border-radius:22px;padding:36px 32px;position:relative;transition:all .25s;box-shadow:var(--sm);}
.plan:hover{transform:translateY(-5px);box-shadow:var(--lg);}
.plan.ft{border-color:var(--gn);background:var(--nv);box-shadow:var(--xl);transform:scale(1.02);}
.plan.ft:hover{transform:scale(1.02) translateY(-5px);}
.plan-rb{position:absolute;top:-1px;left:50%;transform:translateX(-50%);background:var(--gn);color:#fff;font-size:11px;font-weight:700;padding:5px 16px;border-radius:0 0 10px 10px;white-space:nowrap;}
.plan-tier{font-size:11.5px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--mu);margin-bottom:6px;}
.plan.ft .plan-tier{color:rgba(255,255,255,.45);}
.plan-desc{font-size:13px;color:var(--fa);margin-bottom:20px;}
.plan.ft .plan-desc{color:rgba(255,255,255,.4);}
.plan-price{display:flex;align-items:baseline;gap:2px;margin-bottom:4px;}
.p-cur{font-size:20px;font-weight:600;color:var(--nv);margin-top:6px;}
.plan.ft .p-cur{color:rgba(255,255,255,.6);}
.p-amt{font-family:'Playfair Display',serif;font-size:52px;font-weight:700;color:var(--nv);line-height:1;letter-spacing:-1px;}
.plan.ft .p-amt{color:#fff;}
.p-per{font-size:12.5px;color:var(--fa);margin-bottom:24px;}
.plan.ft .p-per{color:rgba(255,255,255,.4);}
.p-div{border:none;border-top:1px solid var(--bd);margin:20px 0;}
.plan.ft .p-div{border-color:rgba(255,255,255,.1);}
.p-feats{list-style:none;display:flex;flex-direction:column;gap:10px;margin-bottom:28px;}
.p-feats li{display:flex;align-items:flex-start;gap:8px;font-size:13.5px;color:var(--mu);line-height:1.5;}
.plan.ft .p-feats li{color:rgba(255,255,255,.65);}
.p-feats li::before{content:'✓';color:var(--gn);font-size:11px;margin-top:2px;flex-shrink:0;font-weight:700;}
.p-feats li.b{color:var(--tx);font-weight:600;}
.plan.ft .p-feats li.b{color:#fff;}
.p-cta{display:block;text-align:center;padding:13px;border-radius:10px;font-weight:600;font-size:14.5px;text-decoration:none;transition:all .2s;}
.p-cta.dk{background:var(--nv);color:#fff;}
.p-cta.dk:hover{background:var(--nv2);}
.p-cta.gn{background:var(--gn);color:#fff;box-shadow:0 4px 18px rgba(0,168,107,.4);}
.p-cta.gn:hover{background:#00c07a;}
.p-cta.ol{background:transparent;color:var(--nv);border:1.5px solid var(--bd2);}
.p-cta.ol:hover{border-color:var(--gn);color:var(--gn);}
.p-note{text-align:center;margin-top:24px;font-size:13.5px;color:var(--mu);}

/* TESTIMONIALS */
.t-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:56px;}
.t-card{background:var(--cr);border:1px solid var(--bd);border-radius:18px;padding:28px;transition:all .2s;}
.t-card:hover{background:#fff;box-shadow:var(--md);transform:translateY(-3px);}
.t-result{display:inline-block;background:rgba(0,168,107,.1);border:1px solid rgba(0,168,107,.2);color:var(--gn);font-size:12px;font-weight:700;padding:4px 10px;border-radius:6px;margin-bottom:14px;}
.t-stars{color:#f59e0b;font-size:14px;letter-spacing:1.5px;margin-bottom:12px;}
.t-text{font-size:14px;color:var(--mu);line-height:1.75;margin-bottom:20px;font-style:italic;}
.t-auth{display:flex;align-items:center;gap:11px;}
.t-av{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#fff;flex-shrink:0;}
.t-nm{font-size:13.5px;font-weight:600;color:var(--nv);}
.t-bz{font-size:12px;color:var(--mu);}

/* FAQ */
.faq-wrap{max-width:720px;margin:56px auto 0;border:1px solid var(--bd);border-radius:18px;overflow:hidden;background:#fff;box-shadow:var(--sm);}
.faq-item{border-bottom:1px solid var(--bd);}
.faq-item:last-child{border-bottom:none;}
.faq-btn{width:100%;background:none;border:none;padding:20px 26px;text-align:left;font-size:15px;font-weight:600;color:var(--nv);cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:14px;font-family:'Outfit',sans-serif;transition:background .15s;}
.faq-btn:hover{background:var(--cr);}
.faq-plus{width:26px;height:26px;border-radius:50%;background:var(--cr2);display:flex;align-items:center;justify-content:center;font-size:17px;color:var(--nv);flex-shrink:0;transition:all .2s;line-height:1;}
.faq-ans{padding:0 26px;font-size:14px;color:var(--mu);line-height:1.75;max-height:0;overflow:hidden;transition:max-height .3s ease,padding .3s ease;}
.faq-item.op .faq-ans{max-height:180px;padding:0 26px 20px;}
.faq-item.op .faq-plus{background:var(--gb);color:var(--gn);transform:rotate(45deg);}

/* CTA */
.cta-sec{padding:100px 0;background:var(--nv);text-align:center;position:relative;overflow:hidden;}
.cta-sec::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:700px;height:350px;background:radial-gradient(ellipse,rgba(0,208,132,.07) 0%,transparent 70%);}
.cta-sec h2{font-size:clamp(32px,5vw,58px);color:#fff;margin-bottom:18px;position:relative;}
.cta-sec p{font-size:17px;color:rgba(255,255,255,.5);margin-bottom:36px;font-weight:300;position:relative;}
.cta-btns{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;position:relative;}
.cta-p{display:inline-flex;align-items:center;gap:8px;background:var(--gn);color:#fff;padding:15px 36px;border-radius:11px;font-weight:600;font-size:15.5px;text-decoration:none;transition:all .2s;box-shadow:0 4px 22px rgba(0,168,107,.4);}
.cta-p:hover{background:#00c07a;transform:translateY(-2px);}
.cta-gh{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.07);color:#fff;padding:15px 28px;border-radius:11px;font-weight:500;font-size:14.5px;text-decoration:none;border:1px solid rgba(255,255,255,.13);transition:all .2s;}
.cta-gh:hover{background:rgba(255,255,255,.11);}
.cta-n{margin-top:18px;font-size:12.5px;color:rgba(255,255,255,.3);position:relative;}

/* FOOTER */
footer{background:var(--nv2);border-top:1px solid rgba(255,255,255,.07);padding:56px 48px 36px;}
.ft-in{max-width:1160px;margin:0 auto;}
.ft-top{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;margin-bottom:40px;}
.ft-logo .logo{color:#fff;}
.ft-ab{font-size:13.5px;color:rgba(255,255,255,.4);line-height:1.7;margin-top:12px;max-width:280px;}
.ft-col-t{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.3);margin-bottom:14px;}
.ft-links{list-style:none;display:flex;flex-direction:column;gap:9px;}
.ft-links a{font-size:13.5px;color:rgba(255,255,255,.5);text-decoration:none;transition:color .2s;}
.ft-links a:hover{color:var(--gn2);}
.ft-bot{padding-top:24px;border-top:1px solid rgba(255,255,255,.07);display:flex;justify-content:space-between;align-items:center;font-size:12.5px;color:rgba(255,255,255,.28);}

/* REVEAL */
.rv{opacity:0;transform:translateY(24px);transition:opacity .6s ease,transform .6s ease;}
.rv.v{opacity:1;transform:none;}

/* RESPONSIVE */
@media(max-width:1024px){
  .hero-inner{grid-template-columns:1fr;}.hero-phone-wrap{display:none;}
  .feat-layout{grid-template-columns:1fr;}.demo-grid{grid-template-columns:1fr;}
  .vs-grid{grid-template-columns:1fr;}.ft-top{grid-template-columns:1fr 1fr;}
  .uc-grid{grid-template-columns:repeat(3,1fr);}
}
@media(max-width:768px){
  .nav{padding:0 20px;}.nav-links{display:none;}
  .hero{padding:96px 20px 60px;}.container{padding:0 20px;}
  .logos-in{padding:0 20px;}.metrics-grid{grid-template-columns:repeat(2,1fr);padding:0 20px;}
  .metric{border-right:none;border-bottom:1px solid rgba(255,255,255,.08);padding:28px;}
  .steps{grid-template-columns:1fr;}.steps::before{display:none;}
  .uc-grid{grid-template-columns:repeat(2,1fr);}
  .pricing-grid{grid-template-columns:1fr;}.plan.ft{transform:none;}
  .t-grid{grid-template-columns:1fr;}
  .proof-bar-in{grid-template-columns:repeat(2,1fr);padding:0 20px;}
  .pb-item{border-right:none;border-bottom:1px solid var(--bd);padding:20px;}
  .ft-top{grid-template-columns:1fr;}.ft-bot{flex-direction:column;gap:8px;text-align:center;}
  footer{padding:40px 20px 28px;}
}
    `}</style>

    {/* NAV */}
    <nav className="nav">
      <a href="/" className="logo">fast<span>rill</span></a>
      <ul className="nav-links">
        <li><a href="#features">Features</a></li>
        <li><a href="#demo">Demo</a></li>
        <li><a href="#pricing">Pricing</a></li>
        <li><a href="#faq">FAQ</a></li>
        <li><a href="/signup" className="nav-cta">Start Free →</a></li>
      </ul>
    </nav>

    {/* HERO */}
    <section className="hero">
      <div className="hero-blob1"/><div className="hero-blob2"/>
      <div className="hero-inner">
        <div>
          <div className="hero-eyebrow">🚀 WhatsApp Growth Engine for Indian Businesses</div>
          <h1>Turn every WhatsApp<br/>message into a<br/><em>conversion</em></h1>
          <p className="hero-sub">Fastrill understands real customer intent and replies instantly — like your best sales rep, available 24/7. Books appointments, qualifies leads, handles queries, recovers drop-offs. In any language your customers speak.</p>
          <div className="hero-actions">
            <a href="/signup" className="btn-p">Start Free — No Card Needed →</a>
            <a href="#demo" className="btn-g">See live demo ↓</a>
          </div>
          <div className="hero-proof">
            {[
              "Intent-based AI replies in under 2 seconds",
              "Connect WhatsApp Business in 10 minutes",
              "Works in Hindi, Telugu, Tamil + 7 more",
              "14-day free trial, no credit card required",
            ].map(p => (
              <div key={p} className="proof-item">
                <div className="proof-check">✓</div>
                {p}
              </div>
            ))}
          </div>
        </div>

        <div className="hero-phone-wrap">
          <div className="fc fc1">
            <div className="fc-ic fc-gn">📅</div>
            <div><div className="fc-num">+47%</div><div className="fc-lbl">More bookings</div></div>
          </div>
          <div className="fc fc2">
            <div className="fc-ic fc-bl">⚡</div>
            <div><div className="fc-num">&lt;2s</div><div className="fc-lbl">AI response</div></div>
          </div>
          <div className="phone">
            <div className="ph-screen">
              <div className="ph-hd">
                <div className="ph-av">R</div>
                <div><div className="ph-nm">Riya Salon</div><div className="ph-st">◈ AI Active</div></div>
              </div>
              <div className="ph-msgs">
                {[
                  {t:"out",m:"Hi want to book haircut tomorrow"},
                  {t:"bot",m:"Great! Tomorrow Sat 21 — what time? Open 10AM–8PM 😊"},
                  {t:"out",m:"Around 3pm"},
                  {t:"bot",m:"Confirm *Haircut* Sat 21 Mar at *3PM*? ✅"},
                  {t:"out",m:"Yes!"},
                  {t:"bot",m:"✅ Done! See you Saturday 3PM at Riya Salon 😊"},
                ].map((m,i) => (
                  <div key={i} className={"ph-m "+m.t} style={{animationDelay:i*.4+"s"}}>
                    {m.t==="bot"&&<span className="ph-bot-lbl">◈ Fastrill AI</span>}
                    {m.m}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* LOGOS */}
    <div className="logos">
      <div className="logos-in">
        <span className="logos-lbl">Works for</span>
        <div className="logos-d"/>
        <div className="logos-row">
          {["💈 Salons","🧖 Spas","🏥 Clinics","🦷 Dental","💪 Gyms","💅 Studios","🏠 Real Estate","🎓 Coaching","🍽️ Restaurants","💻 Agencies"].map(b=>(
            <div key={b} className="bz-pill">{b}</div>
          ))}
        </div>
      </div>
    </div>

    {/* METRICS */}
    <section className="metrics">
      <div className="metrics-grid">
        {[
          {num:<><span className="metric-acc">&lt;2</span>s</>,lbl:"Average AI response time"},
          {num:<>10<span className="metric-acc">+</span></>,lbl:"Indian languages supported"},
          {num:<><span className="metric-acc">24</span>/7</>,lbl:"Always on, never misses a lead"},
          {num:<><span className="metric-acc">10</span>min</>,lbl:"Setup time, no tech needed"},
        ].map((m,i)=>(
          <div key={i} className="metric rv">
            <div className="metric-num">{m.num}</div>
            <div className="metric-lbl">{m.lbl}</div>
          </div>
        ))}
      </div>
    </section>

    {/* HOW */}
    <section className="sec sec-cr" id="how">
      <div className="container">
        <div className="rv">
          <div className="eye">How it works</div>
          <h2 className="sec-h">Live in 10 minutes.<br/>No developer needed.</h2>
          <p className="sec-p" style={{maxWidth:480}}>Connect, configure, go live. Your AI receptionist is ready before your next customer messages.</p>
        </div>
        <div className="steps">
          {[
            {n:"01",t:"Connect Your WhatsApp",d:"Link your existing WhatsApp Business number via Meta's official API. One click, fully secure. Your number stays yours — customers message the same number they always have."},
            {n:"02",t:"Tell It About Your Business",d:"Add your services, prices, working hours, and any custom instructions in plain language. The AI learns your business in minutes. Add as much detail as you want — the smarter you make it, the better it performs."},
            {n:"03",t:"AI Handles Every Conversation",d:"Every customer who messages you gets an instant, intelligent reply. Bookings, queries, lead qualification, follow-ups — all handled automatically. You see everything in your dashboard in real time."},
          ].map(s=>(
            <div key={s.n} className="step rv">
              <div className="step-n">{s.n}</div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* PROOF BAR */}
    <div className="proof-bar">
      <div className="proof-bar-in">
        {[
          {num:"₹18,000",lbl:"Saved monthly on staff costs (avg)"},
          {num:"47%",    lbl:"Increase in bookings in first month"},
          {num:"60%",    lbl:"Reduction in appointment cancellations"},
          {num:"320+",   lbl:"New customers acquired via WhatsApp"},
        ].map(p=>(
          <div key={p.lbl} className="pb-item rv">
            <div className="pb-num">{p.num}</div>
            <div className="pb-lbl">{p.lbl}</div>
          </div>
        ))}
      </div>
    </div>

    {/* FEATURES */}
    <section className="sec sec-wh" id="features">
      <div className="container">
        <div className="rv">
          <div className="eye">Features</div>
          <h2 className="sec-h">Everything your front desk<br/>does — automated.</h2>
          <p className="sec-p" style={{maxWidth:480}}>Not a chatbot. A full AI system built for Indian businesses — with memory, emotion detection, multilingual support, and genuine intelligence.</p>
        </div>
        <div className="feat-layout">
          <div className="feat-list rv">
            {FEATURES.map((fd,i)=>(
              <div key={i} className={"feat-row"+(activeFeature===i?" on":"")} onClick={()=>setActiveFeature(i)}>
                <div className="fr-ic">{fd.icon}</div>
                <div>
                  <div className="fr-t">{fd.title}</div>
                  <div className="fr-d">{fd.desc.substring(0,55)}…</div>
                </div>
              </div>
            ))}
          </div>
          <div className="feat-detail rv">
            <div className="fd-ic">{f.icon}</div>
            <div className="fd-t">{f.title}</div>
            <p className="fd-d">{f.desc}</p>
            <span className="fd-tg">{f.tag}</span>
          </div>
        </div>
      </div>
    </section>

    {/* DEMO */}
    <section className="sec sec-cr" id="demo">
      <div className="container">
        <div className="rv">
          <div className="eye">Live demo</div>
          <h2 className="sec-h">Real conversations.<br/><em>Real intelligence.</em></h2>
          <p className="sec-p" style={{maxWidth:480}}>Click any scenario. Watch how Fastrill handles it — not with fixed scripts, but with genuine understanding.</p>
        </div>
        <div className="demo-grid">
          <div className="sc-list rv">
            {[
              {key:"booking",  t:"📅 Booking flow",         d:"From 'I want a haircut' to confirmed — automatically"},
              {key:"unknown",  t:"❓ Service not offered",   d:"Handles gracefully — shows what you do offer"},
              {key:"hindi",    t:"🇮🇳 Hindi conversation",   d:"Full booking in Hindi — detected automatically"},
              {key:"lead",     t:"💰 High-value lead",       d:"Converts a bridal inquiry into a confirmed booking"},
              {key:"angry",    t:"😤 Angry customer",        d:"Detects frustration, responds with empathy"},
            ].map(s=>(
              <div key={s.key} className={"sc"+(activeConvo===s.key?" on":"")} onClick={()=>setActiveConvo(s.key)}>
                <div className="sc-t">{s.t}</div>
                <div className="sc-d">{s.d}</div>
              </div>
            ))}
          </div>
          <div className="chat-win rv">
            <div className="cw-hd">
              <div className="ph-av" style={{width:30,height:30,fontSize:11}}>R</div>
              <div>
                <div style={{fontSize:12.5,fontWeight:600,color:"#e9edef"}}>Riya Salon</div>
                <div style={{fontSize:10,color:"#00d084"}}>◈ Fastrill AI Active</div>
              </div>
            </div>
            <div className="cw-msgs" ref={convoRef}>
              {messages.map((msg,i)=>(
                <div key={i} className={"cw-m "+(msg.t==="c"?"c":"a")}>
                  {msg.t==="a"&&<span className="cw-al">◈ Fastrill AI</span>}
                  {msg.m.split("\n").map((l,j)=><span key={j}>{l}{j<msg.m.split("\n").length-1&&<br/>}</span>)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* USE CASES */}
    <section className="sec sec-wh">
      <div className="container">
        <div className="rv" style={{textAlign:"center"}}>
          <div className="eye" style={{justifyContent:"center"}}>Who it's for</div>
          <h2 className="sec-h">Built for every business<br/>that runs on customers</h2>
          <p className="sec-p" style={{maxWidth:540,margin:"0 auto"}}>If your customers message you on WhatsApp and you want to grow — Fastrill works for you.</p>
        </div>
        <div className="uc-grid">
          {USE_CASES.map(u=>(
            <div key={u.name} className="uc-card rv">
              <span className="uc-em">{u.emoji}</span>
              <div className="uc-n">{u.name}</div>
              <p className="uc-d">{u.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* VS */}
    <section className="sec sec-nv">
      <div className="container">
        <div className="vs-grid">
          <div className="rv">
            <div className="eye eye-wh">Why Fastrill</div>
            <h2 className="sec-h sec-h-wh">Not just another<br/>WhatsApp tool</h2>
            <p className="sec-p" style={{color:"rgba(255,255,255,.5)"}}>Most tools give you rigid menus and keyword triggers. Fastrill is an AI that genuinely understands what your customers are saying.</p>
            <div className="vs-pts">
              {[
                "Understands natural language — not just keywords",
                "Remembers every customer across all conversations",
                "Handles any message type, not just expected ones",
                "Detects emotion and adapts its tone in real time",
                "Never makes up answers on pricing or policy",
                "Knows exactly when to escalate to a human",
                "Built specifically for Indian languages and context",
              ].map(p=>(
                <div key={p} className="vs-pt"><div className="vs-ck">✓</div>{p}</div>
              ))}
            </div>
          </div>
          <div className="vs-tbl rv">
            <div className="vs-thead">
              <div className="vs-th tm">Other tools</div>
              <div className="vs-th us">Fastrill</div>
            </div>
            {[
              ["Fixed button menus","Natural conversation"],
              ["English only","10+ Indian languages"],
              ["Breaks on unexpected messages","Handles anything"],
              ["No customer memory","Remembers every visit"],
              ["No emotion awareness","Adapts to customer mood"],
              ["Per-message pricing","Flat monthly unlimited"],
              ["Needs developer","10-minute self-setup"],
              ["Generic responses","Business-specific AI"],
            ].map(([t,u])=>(
              <div key={t} className="vs-row">
                <div className="vs-c tm">{t}</div>
                <div className="vs-c us">{u}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* PRICING */}
    <section className="sec sec-cr" id="pricing">
      <div className="container">
        <div className="rv" style={{textAlign:"center"}}>
          <div className="eye" style={{justifyContent:"center"}}>Pricing</div>
          <h2 className="sec-h">Simple pricing.<br/>Pays for itself.</h2>
          <p className="sec-p" style={{maxWidth:480,margin:"0 auto"}}>No per-message charges. No hidden fees. One flat monthly price. A single extra booking per week pays for the entire plan.</p>
        </div>
        <div className="pricing-grid">
          {PLANS.map(plan=>(
            <div key={plan.name} className={"plan rv"+(plan.featured?" ft":"")}>
              {plan.ribbon&&<div className="plan-rb">{plan.ribbon}</div>}
              <div className="plan-tier">{plan.name}</div>
              <div className="plan-desc">{plan.desc}</div>
              <div className="plan-price">
                <span className="p-cur">₹</span>
                <span className="p-amt">{plan.price}</span>
              </div>
              <div className="p-per">per month + GST</div>
              <hr className="p-div"/>
              <ul className="p-feats">
                {plan.features.map(f=>(
                  <li key={f.text} className={f.bold?"b":""}>{f.text}</li>
                ))}
              </ul>
              <a href="/signup" className={"p-cta "+(plan.ctaStyle==="green"?"gn":plan.ctaStyle==="dark"?"dk":"ol")}>{plan.cta}</a>
            </div>
          ))}
        </div>
        <p className="p-note">All plans include a <strong>14-day free trial</strong> · No credit card required · Cancel anytime</p>
      </div>
    </section>

    {/* TESTIMONIALS */}
    <section className="sec sec-wh">
      <div className="container">
        <div className="rv" style={{textAlign:"center"}}>
          <div className="eye" style={{justifyContent:"center"}}>Results</div>
          <h2 className="sec-h">Real results from<br/>real businesses</h2>
        </div>
        <div className="t-grid">
          {TESTIMONIALS.map(t=>(
            <div key={t.name} className="t-card rv">
              <div className="t-result">📈 {t.result}</div>
              <div className="t-stars">★★★★★</div>
              <p className="t-text">"{t.text}"</p>
              <div className="t-auth">
                <div className="t-av" style={{background:`linear-gradient(135deg,${t.grad})`}}>{t.init}</div>
                <div><div className="t-nm">{t.name}</div><div className="t-bz">{t.biz}</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* FAQ */}
    <section className="sec sec-cr" id="faq">
      <div className="container">
        <div className="rv" style={{textAlign:"center"}}>
          <div className="eye" style={{justifyContent:"center"}}>FAQ</div>
          <h2 className="sec-h">Honest answers<br/>to real questions</h2>
        </div>
        <div className="faq-wrap">
          {FAQS.map((faq,i)=>(
            <div key={i} className={"faq-item"+(openFaq===i?" op":"")}>
              <button className="faq-btn" onClick={()=>setOpenFaq(openFaq===i?null:i)}>
                {faq.q}
                <span className="faq-plus">+</span>
              </button>
              <div className="faq-ans">{faq.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="cta-sec">
      <div className="container" style={{position:"relative",zIndex:1}}>
        <h2>Your next customer is<br/>messaging you <em style={{color:"var(--gn2)",fontStyle:"italic"}}>right now</em></h2>
        <p>Don't make them wait. Don't lose them to a competitor who replies faster.<br/>Fastrill answers instantly — in their language, every time, 24/7.</p>
        <div className="cta-btns">
          <a href="/signup" className="cta-p">Start Free Trial — No Card Needed →</a>
          <a href="https://wa.me/919999999999" className="cta-gh">💬 Chat with us on WhatsApp</a>
        </div>
        <p className="cta-n">14-day free trial · Setup in 10 minutes · Cancel anytime · No credit card required</p>
      </div>
    </section>

    {/* FOOTER */}
    <footer>
      <div className="ft-in">
        <div className="ft-top">
          <div className="ft-logo">
            <a href="/" className="logo">fast<span>rill</span></a>
            <p className="ft-ab">WhatsApp AI growth engine for Indian businesses. Turns every message into a conversion — automatically, in any language, 24/7.</p>
          </div>
          <div>
            <div className="ft-col-t">Product</div>
            <ul className="ft-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#demo">Live Demo</a></li>
              <li><a href="/changelog">Changelog</a></li>
            </ul>
          </div>
          <div>
            <div className="ft-col-t">Company</div>
            <ul className="ft-links">
              <li><a href="/about">About</a></li>
              <li><a href="/blog">Blog</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>
          <div>
            <div className="ft-col-t">Legal</div>
            <ul className="ft-links">
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/terms">Terms of Service</a></li>
              <li><a href="/refund">Refund Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="ft-bot">
          <span>© 2026 Fastrill Technologies Pvt. Ltd. All rights reserved.</span>
          <span>Made with ❤️ in India </span>
        </div>
      </div>
    </footer>
    </>
  )
}
