"use client"
import { useEffect, useRef, useState } from "react"

const CONVOS = {
  booking:[
    {t:"c",m:"Hi want to book a haircut tomorrow"},
    {t:"a",m:"Great! 📅 Tomorrow is Saturday 21st — what time? We're open 10AM–8PM 😊"},
    {t:"c",m:"3pm works"},
    {t:"a",m:"Shall I confirm *Haircut* on *Sat, 21 Mar* at *3:00 PM*? ✅"},
    {t:"c",m:"Yes!"},
    {t:"a",m:"✅ Confirmed! See you Saturday 3PM at Riya Salon 😊"},
  ],
  hindi:[
    {t:"c",m:"Bhai facial karwa sakte hai?"},
    {t:"a",m:"Haan bilkul! 😊 Facial ₹1,200 mein available hai. Kab aana chahenge?"},
    {t:"c",m:"Kal evening 6 baje"},
    {t:"a",m:"Confirm karu — *Facial* Saturday 21 March ko *6:00 PM*? ✅"},
    {t:"c",m:"Ha bilkul"},
    {t:"a",m:"✅ Booking ho gayi! Kal 6 PM ko milenge 😊"},
  ],
  lead:[
    {t:"c",m:"How much is the bridal package?"},
    {t:"a",m:"Our Bridal Package is ₹8,500 — includes makeup, hair styling, saree draping & mehendi 💍\n\nWhen's the big day? I'll check availability 😊"},
    {t:"c",m:"March 28th"},
    {t:"a",m:"March 28th — slots go fast for weddings 🌸\n\nShall I block the day? We need ₹1,000 advance to confirm."},
    {t:"c",m:"Yes let's do it!"},
    {t:"a",m:"Wonderful! Sending you the payment link now 💐\n\nYour wedding day is going to be beautiful!"},
  ],
  angry:[
    {t:"c",m:"Your staff was so rude to me. Never coming back"},
    {t:"a",m:"I'm really sorry to hear this 😔 That's absolutely not okay.\n\nCould you tell me what happened? I want to make this right for you."},
    {t:"c",m:"The receptionist was dismissive about pricing"},
    {t:"a",m:"I sincerely apologize. This has been flagged to the manager — someone will call you within the hour.\n\nWe'd love to earn your trust back 🙏"},
  ],
  unknown:[
    {t:"c",m:"Do you do hair straightening?"},
    {t:"a",m:"We don't offer that 😊 But here's what we have:\n\n• Haircut — ₹400\n• Hair Spa — ₹800\n• Facial — ₹1,200\n\nWant to book one of these?"},
    {t:"c",m:"Hair spa sounds good"},
    {t:"a",m:"Perfect! 📅 What date works for your Hair Spa?"},
  ],
}

const FEATURES=[
  {icon:"🧠",title:"Real Intent Detection",tag:"Core AI",desc:"Understands 'I want to come tomorrow evening for a facial' — not just keyword commands. Works across Hindi, Telugu, Tamil, and 10 more Indian languages automatically."},
  {icon:"💬",title:"10+ Indian Languages",tag:"Multilingual",desc:"Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, English — auto-detected. Your customer writes what feels natural, Fastrill responds in kind."},
  {icon:"🔄",title:"Interruption Handling",tag:"AI v2",desc:"Customer asks a price question mid-booking? Fastrill answers it and returns to the booking flow seamlessly — just like a trained human receptionist would."},
  {icon:"😤",title:"Emotion Detection",tag:"AI v2",desc:"Detects frustration, anger, confusion in real time. Adapts tone immediately — empathy first, solution second. Stops upselling when the customer is upset."},
  {icon:"🧩",title:"Customer Memory",tag:"Personalization",desc:"Remembers every customer — preferred services, favorite times, language, past bookings. Return customers feel recognized and valued, not like strangers."},
  {icon:"🎯",title:"Lead Recovery",tag:"Revenue",desc:"Customer dropped mid-booking? Fastrill follows up automatically at the right moment. Recovers bookings that would have been permanently lost."},
  {icon:"👤",title:"Smart Human Handoff",tag:"Escalation",desc:"Knows when to stop — refunds, disputes, complex requests. Pauses AI, notifies you with full context. Never gets stuck or makes things worse."},
  {icon:"📢",title:"WhatsApp Campaigns",tag:"Marketing",desc:"Send bulk messages to your customer list using Meta-approved templates. Target segments, track opens and replies, measure conversion per campaign."},
]

const TESTIMONIALS=[
  {i:"P",g:"#f59e0b,#ef4444",n:"Priya Sharma",b:"Glow Beauty Parlour, Hyderabad",r:"+40% bookings month 1",t:"Before Fastrill I was losing bookings at night. Now I wake up to confirmed appointments every morning. It paid for itself in week one."},
  {i:"R",g:"#3b82f6,#0ea5e9",n:"Dr. Ravi Kumar",b:"Apollo Skin Clinic, Vijayawada",r:"Saved ₹18,000/month",t:"My patients message in Telugu and the AI replies perfectly in Telugu. Books appointments, answers questions, follows up. I had to see it to believe it."},
  {i:"S",g:"#00d084,#0ea5e9",n:"Sneha Reddy",b:"Studio S — 3 branches, Bangalore",r:"Replaced 2 receptionist shifts",t:"3 branches, all WhatsApp managed by Fastrill simultaneously. Our staff now focuses on actual customers, not their phones all day."},
  {i:"A",g:"#a855f7,#6366f1",n:"Arjun Mehta",b:"FitLife Gym, Mumbai",r:"320 new members via WhatsApp",t:"I used to spend 3 hours a day on membership inquiries. Fastrill qualifies leads, explains packages, and books demos automatically."},
  {i:"N",g:"#f59e0b,#10b981",n:"Nandini Iyer",b:"Ayur Wellness, Chennai",r:"60% fewer cancellations",t:"Clients ask in Tamil, AI responds in Tamil. It follows up 1 hour before appointments. Cancellations dropped dramatically."},
  {i:"V",g:"#10b981,#0ea5e9",n:"Vikram Nair",b:"Pixel Agency, Kochi",r:"4x faster lead qualification",t:"We qualify discovery call leads with Fastrill. It asks the right questions, gets budget and timeline, and books calls with serious prospects only."},
]

const FAQS=[
  {q:"Do I need to change my WhatsApp number?",a:"No. You keep your existing WhatsApp Business number. Fastrill connects through Meta's official Business API. Your customers message the same number they always have — nothing changes on their end."},
  {q:"Is this only for salons and clinics?",a:"Not at all. Fastrill works for any business that gets customers on WhatsApp — gyms, agencies, real estate, coaching, restaurants, retail, and more. If your customers message you, Fastrill can handle it."},
  {q:"Which Indian languages are supported?",a:"Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, and English — all auto-detected. No setup needed. Your customer writes what feels natural and Fastrill responds in the same language."},
  {q:"Can I take over from the AI and reply manually?",a:"Yes, always. In your dashboard, toggle AI off for any conversation and reply yourself. The AI waits. Toggle it back on and it resumes. You are always fully in control."},
  {q:"What if the AI doesn't know the answer?",a:"It tells the customer it will check and connect them with the team. You get notified immediately. The AI never invents answers on pricing, policy, or anything it's not sure about."},
  {q:"Are there per-message charges?",a:"No per-message charges ever. Flat monthly pricing regardless of conversation volume. WhatsApp charges for business-initiated messages (campaigns) per Meta's standard rates, but all AI conversations are included in your plan."},
  {q:"How long does setup take?",a:"About 10 minutes for basic setup. Connect WhatsApp via Meta, add your services and working hours, go live. No developer, no technical knowledge required."},
  {q:"Is there a free trial?",a:"Yes — 14 days free, full Growth plan access, no credit card required. At the end you choose to subscribe or not. No automatic charges."},
]

export default function LandingPage(){
  const [feat,setFeat]=useState(0)
  const [convo,setConvo]=useState("booking")
  const [msgs,setMsgs]=useState([])
  const [faq,setFaq]=useState(null)
  const ref=useRef(null)

  useEffect(()=>{
    setMsgs([])
    CONVOS[convo].forEach((m,i)=>{
      setTimeout(()=>{
        setMsgs(p=>[...p,m])
        if(ref.current) ref.current.scrollTop=ref.current.scrollHeight
      },i*480)
    })
  },[convo])

  useEffect(()=>{
    const io=new IntersectionObserver(entries=>{
      entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})
    },{threshold:.07,rootMargin:"0px 0px -20px 0px"})
    document.querySelectorAll(".an").forEach((el,i)=>{
      const sibs=Array.from((el.parentElement||el).querySelectorAll(":scope > .an"))
      const idx=sibs.indexOf(el)
      if(idx>0) el.style.transitionDelay=Math.min(idx*.08,.32)+"s"
      io.observe(el)
    })
    return ()=>io.disconnect()
  },[])

  const f=FEATURES[feat]

  return(<>
  <style>{`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Syne:wght@700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:#080c14;color:#e2e8f0;font-family:'Inter',sans-serif;font-size:16px;line-height:1.6;overflow-x:hidden}
h1,h2,h3,.display{font-family:'Syne',sans-serif;line-height:1.08;letter-spacing:-.02em}

/* ── TOKENS ──────────────────────────────────────────── */
:root{
  --bg:#080c14;
  --bg2:#0d1220;
  --bg3:#111827;
  --bg4:#1a2236;
  --gn:#00d084;
  --gn2:rgba(0,208,132,.12);
  --gn3:rgba(0,208,132,.25);
  --bd:rgba(255,255,255,.07);
  --bd2:rgba(255,255,255,.12);
  --tx:#e2e8f0;
  --mu:rgba(226,232,240,.55);
  --fa:rgba(226,232,240,.3);
  --glow:0 0 60px rgba(0,208,132,.15);
}

/* ── NAV ─────────────────────────────────────────────── */
.nav{
  position:fixed;top:0;left:0;right:0;z-index:100;
  height:62px;padding:0 clamp(20px,4vw,48px);
  display:flex;align-items:center;justify-content:space-between;
  background:rgba(8,12,20,.85);backdrop-filter:blur(20px);
  border-bottom:1px solid var(--bd);
}
.logo{font-family:'Syne',sans-serif;font-weight:800;font-size:20px;color:var(--tx);text-decoration:none;letter-spacing:-.5px}
.logo span{color:var(--gn)}
.nav-r{display:flex;align-items:center;gap:28px}
.nav-links{display:flex;align-items:center;gap:24px;list-style:none}
.nav-links a{color:var(--mu);text-decoration:none;font-size:13.5px;font-weight:500;transition:color .2s}
.nav-links a:hover{color:var(--tx)}
.nav-cta{
  background:var(--gn);color:#000!important;padding:9px 20px;
  border-radius:8px;font-weight:700!important;font-size:13.5px!important;
  transition:opacity .2s!important;white-space:nowrap;
}
.nav-cta:hover{opacity:.85}
.hamburger{display:none;background:none;border:1px solid var(--bd2);border-radius:7px;padding:7px 10px;cursor:pointer;color:var(--tx);font-size:16px}

/* ── HERO ────────────────────────────────────────────── */
.hero{
  position:relative;min-height:100vh;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:100px clamp(20px,5vw,48px) 80px;overflow:hidden;
}
/* grid lines */
.hero::before{
  content:'';position:absolute;inset:0;
  background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);
  background-size:60px 60px;
  mask-image:radial-gradient(ellipse 80% 70% at 50% 0%,black 0%,transparent 100%);
  pointer-events:none;
}
.hero-glow{
  position:absolute;top:-100px;left:50%;transform:translateX(-50%);
  width:min(800px,100vw);height:600px;
  background:radial-gradient(ellipse,rgba(0,208,132,.1) 0%,transparent 65%);
  pointer-events:none;
}
.hero-badge{
  display:inline-flex;align-items:center;gap:8px;
  background:var(--gn2);border:1px solid var(--gn3);border-radius:100px;
  padding:6px 16px;font-size:12.5px;font-weight:600;color:var(--gn);
  margin-bottom:28px;
}
.hero-badge::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--gn);animation:blink 2s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.25}}
.hero h1{
  font-size:clamp(36px,7vw,88px);font-weight:800;
  color:var(--tx);margin-bottom:8px;
  background:linear-gradient(135deg,#fff 40%,rgba(255,255,255,.6));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.hero-accent{
  font-size:clamp(36px,7vw,88px);font-weight:800;font-family:'Syne',sans-serif;
  background:linear-gradient(135deg,var(--gn),#00f5a0);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  display:block;letter-spacing:-.02em;line-height:1.08;margin-bottom:24px;
}
.hero-sub{
  font-size:clamp(16px,2vw,19px);color:var(--mu);
  max-width:580px;margin:0 auto 40px;font-weight:400;line-height:1.7;
}
.hero-btns{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;margin-bottom:56px}
.btn-main{
  display:inline-flex;align-items:center;gap:8px;
  background:var(--gn);color:#000;padding:14px 32px;border-radius:10px;
  font-weight:700;font-size:15px;text-decoration:none;transition:all .2s;
  box-shadow:0 0 32px rgba(0,208,132,.3);
}
.btn-main:hover{opacity:.88;transform:translateY(-2px);box-shadow:0 0 48px rgba(0,208,132,.4)}
.btn-sec{
  display:inline-flex;align-items:center;gap:8px;
  background:rgba(255,255,255,.06);color:var(--tx);
  padding:14px 28px;border-radius:10px;font-weight:500;font-size:14.5px;
  text-decoration:none;border:1px solid var(--bd2);transition:all .2s;
}
.btn-sec:hover{background:rgba(255,255,255,.1);border-color:var(--gn)}

/* proof pills */
.hero-pills{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap}
.pill{
  display:flex;align-items:center;gap:7px;
  background:rgba(255,255,255,.04);border:1px solid var(--bd);
  border-radius:100px;padding:7px 16px;
  font-size:13px;color:var(--mu);font-weight:500;
}
.pill-dot{width:6px;height:6px;border-radius:50%;background:var(--gn);flex-shrink:0}

/* ── MARQUEE ─────────────────────────────────────────── */
.marquee-wrap{
  border-top:1px solid var(--bd);border-bottom:1px solid var(--bd);
  background:var(--bg2);padding:20px 0;overflow:hidden;position:relative;
}
.marquee-wrap::before,.marquee-wrap::after{
  content:'';position:absolute;top:0;bottom:0;width:120px;z-index:2;
}
.marquee-wrap::before{left:0;background:linear-gradient(90deg,var(--bg2),transparent)}
.marquee-wrap::after{right:0;background:linear-gradient(-90deg,var(--bg2),transparent)}
.marquee-track{display:flex;gap:0;animation:marquee 28s linear infinite;width:max-content}
.marquee-track:hover{animation-play-state:paused}
@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.m-item{
  display:flex;align-items:center;gap:8px;
  padding:0 32px;font-size:13px;font-weight:600;color:var(--mu);
  white-space:nowrap;border-right:1px solid var(--bd);
}

/* ── METRICS BAR ─────────────────────────────────────── */
.metrics{background:var(--bg2);border-bottom:1px solid var(--bd)}
.metrics-grid{
  max-width:1160px;margin:0 auto;padding:0 clamp(20px,4vw,48px);
  display:grid;grid-template-columns:repeat(4,1fr);
}
.metric{
  padding:40px 20px;text-align:center;
  border-right:1px solid var(--bd);
  position:relative;
}
.metric:last-child{border-right:none}
.metric::after{
  content:'';position:absolute;bottom:0;left:20%;right:20%;height:1px;
  background:linear-gradient(90deg,transparent,var(--gn),transparent);
  opacity:0;transition:opacity .3s;
}
.metric:hover::after{opacity:1}
.m-num{
  font-family:'Syne',sans-serif;font-size:clamp(36px,4vw,52px);
  font-weight:800;color:var(--gn);line-height:1;margin-bottom:8px;
}
.m-lbl{font-size:13px;color:var(--mu);line-height:1.4}

/* ── CONTAINER ───────────────────────────────────────── */
.wrap{max-width:1160px;margin:0 auto;padding:0 clamp(20px,4vw,48px)}
.sec{padding:clamp(64px,8vw,112px) 0}
.eye{
  display:inline-flex;align-items:center;gap:8px;
  font-size:11.5px;font-weight:700;letter-spacing:2px;
  text-transform:uppercase;color:var(--gn);margin-bottom:14px;
}
.eye::before{content:'';width:16px;height:2px;background:var(--gn);border-radius:1px}
.sh{font-size:clamp(28px,4vw,48px);font-weight:800;color:var(--tx);margin-bottom:16px}
.sp{font-size:clamp(15px,2vw,17px);color:var(--mu);line-height:1.7}

/* ── HOW ─────────────────────────────────────────────── */
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:52px}
.step{
  background:var(--bg2);border:1px solid var(--bd);border-radius:18px;
  padding:32px 28px;transition:all .3s;position:relative;overflow:hidden;
}
.step::before{
  content:'';position:absolute;top:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,var(--gn),transparent);
  opacity:0;transition:opacity .3s;
}
.step:hover{border-color:rgba(0,208,132,.2);box-shadow:var(--glow)}
.step:hover::before{opacity:1}
.step-n{
  width:44px;height:44px;border-radius:12px;
  background:var(--gn2);border:1px solid var(--gn3);
  display:flex;align-items:center;justify-content:center;
  font-size:18px;font-weight:800;font-family:'Syne',sans-serif;
  color:var(--gn);margin-bottom:20px;
}
.step h3{font-size:18px;font-weight:700;color:var(--tx);margin-bottom:10px}
.step p{font-size:14px;color:var(--mu);line-height:1.7}

/* ── BENTO FEATURES ──────────────────────────────────── */
.bento{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:52px}
.bento-card{
  background:var(--bg2);border:1px solid var(--bd);border-radius:18px;
  padding:28px 24px;transition:all .3s;cursor:pointer;position:relative;overflow:hidden;
}
.bento-card::after{
  content:'';position:absolute;inset:0;border-radius:18px;
  background:radial-gradient(circle at 50% 0%,rgba(0,208,132,.06),transparent 70%);
  opacity:0;transition:opacity .3s;
}
.bento-card:hover,.bento-card.on{border-color:rgba(0,208,132,.25);box-shadow:var(--glow)}
.bento-card.on::after,.bento-card:hover::after{opacity:1}
.bc-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.bc-icon{
  width:40px;height:40px;border-radius:10px;background:var(--gn2);
  border:1px solid var(--gn3);display:flex;align-items:center;
  justify-content:center;font-size:18px;flex-shrink:0;
}
.bc-tag{font-size:10.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--gn);background:var(--gn2);border:1px solid var(--gn3);padding:3px 9px;border-radius:4px}
.bc-title{font-size:15px;font-weight:700;color:var(--tx);margin-bottom:8px}
.bc-desc{font-size:13px;color:var(--mu);line-height:1.65}

/* ── DEMO ────────────────────────────────────────────── */
.demo-wrap{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:52px;align-items:start}
.sc-list{display:flex;flex-direction:column;gap:10px}
.sc{
  background:var(--bg2);border:1px solid var(--bd);border-radius:13px;
  padding:16px 18px;cursor:pointer;transition:all .2s;
}
.sc.on{border-color:var(--gn);background:var(--gn2);box-shadow:0 0 20px rgba(0,208,132,.1)}
.sc:hover:not(.on){border-color:var(--bd2)}
.sc-t{font-size:14px;font-weight:600;color:var(--tx);margin-bottom:3px}
.sc-d{font-size:12.5px;color:var(--mu)}
.chat{background:#0b141a;border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,.08)}
.chat-hd{background:#1f2c34;padding:14px 18px;display:flex;align-items:center;gap:11px;border-bottom:1px solid rgba(255,255,255,.05)}
.chat-av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--gn),#0ea5e9);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#000;flex-shrink:0}
.chat-nm{font-size:13px;font-weight:600;color:#e9edef}
.chat-st{font-size:10.5px;color:var(--gn)}
.chat-msgs{padding:14px 12px;min-height:320px;display:flex;flex-direction:column;gap:8px;overflow-y:auto}
.cm{max-width:80%;padding:8px 13px;border-radius:10px;font-size:13px;line-height:1.55;animation:pop .25s ease both}
.cm.c{background:#005c4b;color:#e9edef;align-self:flex-end;border-radius:10px 2px 10px 10px}
.cm.a{background:#1a2a22;border:1px solid rgba(0,208,132,.18);color:#e9edef;align-self:flex-start;border-radius:2px 10px 10px 10px}
.cm-lbl{font-size:9.5px;color:var(--gn);font-weight:700;margin-bottom:3px;display:block}
@keyframes pop{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}

/* ── PROOF BAR ───────────────────────────────────────── */
.proof-bar{background:var(--bg3);border-top:1px solid var(--bd);border-bottom:1px solid var(--bd);padding:clamp(28px,4vw,48px) 0}
.proof-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:0}
.pbi{text-align:center;padding:0 20px;border-right:1px solid var(--bd)}
.pbi:last-child{border-right:none}
.pb-num{font-family:'Syne',sans-serif;font-size:clamp(28px,3vw,44px);font-weight:800;color:var(--gn);line-height:1;margin-bottom:6px}
.pb-lbl{font-size:13px;color:var(--mu);line-height:1.4}

/* ── VS ──────────────────────────────────────────────── */
.vs-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start;margin-top:52px}
.vs-pts{display:flex;flex-direction:column;gap:12px;margin-top:24px}
.vs-pt{display:flex;align-items:flex-start;gap:10px;font-size:14.5px;color:var(--mu);line-height:1.6}
.vs-ck{width:20px;height:20px;border-radius:50%;background:var(--gn2);border:1px solid var(--gn3);display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--gn);flex-shrink:0;margin-top:2px}
.vs-tbl{background:var(--bg2);border:1px solid var(--bd);border-radius:18px;overflow:hidden}
.vs-th-row{display:grid;grid-template-columns:1fr 1fr;background:var(--bg3)}
.vs-th{padding:14px 22px;font-size:11.5px;font-weight:700;letter-spacing:.5px;text-transform:uppercase}
.vs-th.tm{color:var(--fa);border-right:1px solid var(--bd)}
.vs-th.us{color:var(--gn)}
.vs-row{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid var(--bd)}
.vs-c{padding:12px 22px;font-size:13px;display:flex;align-items:center;gap:7px}
.vs-c.tm{color:var(--fa);border-right:1px solid var(--bd)}
.vs-c.tm::before{content:'✕';color:#ef4444;font-size:10px}
.vs-c.us{color:var(--tx);font-weight:500}
.vs-c.us::before{content:'✓';color:var(--gn);font-size:10px}

/* ── USE CASES ───────────────────────────────────────── */
.uc-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:52px}
.uc{
  background:var(--bg2);border:1px solid var(--bd);border-radius:16px;
  padding:22px 18px;transition:all .25s;
}
.uc:hover{border-color:rgba(0,208,132,.2);transform:translateY(-3px);box-shadow:var(--glow)}
.uc-em{font-size:28px;margin-bottom:10px;display:block}
.uc-n{font-size:14px;font-weight:600;color:var(--tx);margin-bottom:5px}
.uc-d{font-size:12.5px;color:var(--mu);line-height:1.5}

/* ── PRICING ─────────────────────────────────────────── */
.p-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:52px}
.plan{
  background:var(--bg2);border:1px solid var(--bd);border-radius:22px;
  padding:clamp(28px,3vw,40px) clamp(24px,3vw,36px);position:relative;transition:all .3s;
}
.plan:hover{border-color:rgba(0,208,132,.2);box-shadow:var(--glow)}
.plan.ft{
  background:linear-gradient(135deg,var(--bg3),var(--bg2));
  border-color:rgba(0,208,132,.35);
  box-shadow:0 0 60px rgba(0,208,132,.12),inset 0 1px 0 rgba(0,208,132,.2);
}
.p-rb{
  position:absolute;top:-1px;left:50%;transform:translateX(-50%);
  background:var(--gn);color:#000;font-size:11px;font-weight:800;
  padding:4px 16px;border-radius:0 0 10px 10px;white-space:nowrap;font-family:'Syne',sans-serif;
}
.p-tier{font-size:11.5px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--mu);margin-bottom:8px}
.p-desc{font-size:13px;color:var(--fa);margin-bottom:20px}
.p-price{display:flex;align-items:baseline;gap:3px;margin-bottom:4px}
.p-cur{font-size:22px;font-weight:600;color:var(--tx);margin-top:8px}
.p-amt{font-family:'Syne',sans-serif;font-size:clamp(44px,5vw,56px);font-weight:800;color:var(--tx);line-height:1;letter-spacing:-2px}
.plan.ft .p-amt,.plan.ft .p-cur{color:var(--gn)}
.p-per{font-size:12.5px;color:var(--fa);margin-bottom:24px}
.p-div{border:none;border-top:1px solid var(--bd);margin:20px 0}
.p-feats{list-style:none;display:flex;flex-direction:column;gap:10px;margin-bottom:28px}
.p-feats li{display:flex;align-items:flex-start;gap:8px;font-size:13.5px;color:var(--mu);line-height:1.5}
.p-feats li::before{content:'✓';color:var(--gn);font-size:11px;margin-top:2px;flex-shrink:0;font-weight:700}
.p-feats li.b{color:var(--tx);font-weight:600}
.p-cta{display:block;text-align:center;padding:13px;border-radius:10px;font-weight:700;font-size:14.5px;text-decoration:none;transition:all .2s;font-family:'Syne',sans-serif}
.p-cta.gn{background:var(--gn);color:#000;box-shadow:0 0 28px rgba(0,208,132,.3)}
.p-cta.gn:hover{opacity:.88}
.p-cta.ol{background:transparent;color:var(--tx);border:1px solid var(--bd2)}
.p-cta.ol:hover{border-color:var(--gn);color:var(--gn)}
.p-note{text-align:center;margin-top:20px;font-size:13px;color:var(--fa)}

/* ── TESTIMONIALS ────────────────────────────────────── */
.t-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:52px}
.tc{
  background:var(--bg2);border:1px solid var(--bd);border-radius:18px;
  padding:26px 24px;transition:all .2s;
}
.tc:hover{border-color:rgba(0,208,132,.18);transform:translateY(-2px)}
.tc-res{display:inline-block;background:var(--gn2);border:1px solid var(--gn3);color:var(--gn);font-size:11.5px;font-weight:700;padding:3px 10px;border-radius:5px;margin-bottom:12px}
.tc-stars{color:#f59e0b;font-size:13px;letter-spacing:1.5px;margin-bottom:10px}
.tc-text{font-size:13.5px;color:var(--mu);line-height:1.75;margin-bottom:18px;font-style:italic}
.tc-auth{display:flex;align-items:center;gap:10px}
.tc-av{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#fff;flex-shrink:0}
.tc-nm{font-size:13.5px;font-weight:600;color:var(--tx)}
.tc-bz{font-size:12px;color:var(--mu)}

/* ── FAQ ─────────────────────────────────────────────── */
.faq-wrap{max-width:680px;margin:52px auto 0;border:1px solid var(--bd);border-radius:18px;overflow:hidden;background:var(--bg2)}
.fi{border-bottom:1px solid var(--bd)}
.fi:last-child{border-bottom:none}
.fb{width:100%;background:none;border:none;padding:20px 24px;text-align:left;font-size:15px;font-weight:600;color:var(--tx);cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:14px;font-family:'Inter',sans-serif;transition:background .15s}
.fb:hover{background:rgba(255,255,255,.03)}
.fp{width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.05);display:flex;align-items:center;justify-content:center;font-size:17px;color:var(--mu);flex-shrink:0;transition:all .2s;line-height:1}
.fa-ans{padding:0 24px;font-size:14px;color:var(--mu);line-height:1.75;max-height:0;overflow:hidden;transition:max-height .3s ease,padding .3s ease}
.fi.op .fa-ans{max-height:160px;padding:0 24px 20px}
.fi.op .fp{background:var(--gn2);color:var(--gn);transform:rotate(45deg)}

/* ── CTA ─────────────────────────────────────────────── */
.cta-sec{padding:clamp(64px,8vw,112px) 0;position:relative;overflow:hidden;text-align:center}
.cta-sec::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:min(700px,100vw);height:400px;background:radial-gradient(ellipse,rgba(0,208,132,.08) 0%,transparent 70%);pointer-events:none}
.cta-box{
  max-width:760px;margin:0 auto;position:relative;z-index:1;
  background:var(--bg2);border:1px solid rgba(0,208,132,.2);
  border-radius:24px;padding:clamp(40px,6vw,80px) clamp(24px,5vw,72px);
}
.cta-box::before{content:'';position:absolute;top:0;left:20%;right:20%;height:1px;background:linear-gradient(90deg,transparent,var(--gn),transparent)}
.cta-box h2{font-size:clamp(28px,5vw,52px);color:var(--tx);margin-bottom:16px}
.cta-box p{font-size:clamp(15px,2vw,17px);color:var(--mu);margin-bottom:36px;font-weight:300}
.cta-btns{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap}
.cta-n{margin-top:16px;font-size:12.5px;color:var(--fa)}

/* ── FOOTER ──────────────────────────────────────────── */
footer{background:var(--bg2);border-top:1px solid var(--bd);padding:clamp(40px,5vw,60px) clamp(20px,4vw,48px) clamp(24px,3vw,36px)}
.ft-in{max-width:1160px;margin:0 auto}
.ft-top{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:clamp(24px,4vw,48px);margin-bottom:clamp(24px,4vw,40px)}
.ft-logo .logo{font-size:18px}
.ft-ab{font-size:13px;color:var(--fa);line-height:1.7;margin-top:12px;max-width:260px}
.ft-ct{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--fa);margin-bottom:14px}
.ft-lks{list-style:none;display:flex;flex-direction:column;gap:9px}
.ft-lks a{font-size:13.5px;color:var(--mu);text-decoration:none;transition:color .2s}
.ft-lks a:hover{color:var(--gn)}
.ft-bot{padding-top:24px;border-top:1px solid var(--bd);display:flex;justify-content:space-between;align-items:center;font-size:12.5px;color:var(--fa);flex-wrap:wrap;gap:8px}

/* ── REVEAL ──────────────────────────────────────────── */
.an{opacity:0;transform:translateY(22px);transition:opacity .6s ease,transform .6s ease}
.an.in{opacity:1;transform:none}

/* ══════════════════════════════════════════════════════
   MOBILE FIRST — everything below 768px
   ══════════════════════════════════════════════════════ */
@media(max-width:768px){

  /* NAV */
  .nav{height:56px;padding:0 18px}
  .nav-links{display:none}
  .hamburger{display:flex}
  .logo{font-size:18px}

  /* HERO */
  .hero{padding:90px 20px 60px;min-height:auto}
  .hero h1{font-size:clamp(32px,9vw,48px)}
  .hero-accent{font-size:clamp(32px,9vw,48px)}
  .hero-sub{font-size:15px;margin-bottom:32px}
  .hero-btns{flex-direction:column;align-items:stretch;gap:12px}
  .btn-main,.btn-sec{justify-content:center;padding:14px 24px}
  .hero-pills{flex-direction:column;align-items:stretch;gap:8px}
  .pill{justify-content:center;font-size:12.5px}

  /* MARQUEE */
  .m-item{padding:0 20px;font-size:12px}

  /* METRICS */
  .metrics-grid{grid-template-columns:repeat(2,1fr)}
  .metric{border-right:none!important;border-bottom:1px solid var(--bd);padding:28px 16px}
  .metric:nth-child(odd){border-right:1px solid var(--bd)!important}
  .metric:nth-last-child(-n+2){border-bottom:none}
  .m-num{font-size:36px}

  /* HOW */
  .steps{grid-template-columns:1fr;gap:14px}

  /* BENTO FEATURES */
  .bento{grid-template-columns:1fr;gap:12px}

  /* DEMO */
  .demo-wrap{grid-template-columns:1fr;gap:20px}
  .sc-list{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .chat-msgs{min-height:280px}

  /* PROOF BAR */
  .proof-grid{grid-template-columns:repeat(2,1fr)}
  .pbi{border-right:none!important;border-bottom:1px solid var(--bd);padding:20px 12px}
  .pbi:nth-child(odd){border-right:1px solid var(--bd)!important}
  .pbi:nth-last-child(-n+2){border-bottom:none}
  .pb-num{font-size:28px}

  /* VS */
  .vs-grid{grid-template-columns:1fr;gap:28px}

  /* USE CASES */
  .uc-grid{grid-template-columns:repeat(2,1fr);gap:12px}

  /* PRICING */
  .p-grid{grid-template-columns:1fr;gap:16px}
  .plan{padding:28px 24px}
  .p-amt{font-size:44px}

  /* TESTIMONIALS */
  .t-grid{grid-template-columns:1fr;gap:12px}

  /* CTA */
  .cta-box{padding:40px 24px;border-radius:18px}
  .cta-btns{flex-direction:column;align-items:stretch}
  .btn-main,.cta-btns a{justify-content:center}

  /* FOOTER */
  .ft-top{grid-template-columns:1fr;gap:28px}
  .ft-ab{max-width:100%}
  .ft-bot{flex-direction:column;text-align:center}

  /* SECTIONS */
  .sh{font-size:clamp(26px,7vw,36px)}
  .sp{font-size:15px}
  .wrap{padding:0 18px}
}

/* Tablet 768–1024 */
@media(min-width:769px) and (max-width:1024px){
  .nav-links{display:none}
  .hamburger{display:flex}
  .hero h1,.hero-accent{font-size:clamp(40px,6vw,64px)}
  .metrics-grid{grid-template-columns:repeat(4,1fr)}
  .bento{grid-template-columns:repeat(2,1fr)}
  .demo-wrap{grid-template-columns:1fr 1fr}
  .vs-grid{grid-template-columns:1fr}
  .uc-grid{grid-template-columns:repeat(3,1fr)}
  .p-grid{grid-template-columns:repeat(3,1fr)}
  .t-grid{grid-template-columns:repeat(2,1fr)}
  .ft-top{grid-template-columns:1fr 1fr;gap:28px}
}
  `}</style>

  {/* NAV */}
  <nav className="nav">
    <a href="/" className="logo">fast<span>rill</span></a>
    <div className="nav-r">
      <ul className="nav-links">
        <li><a href="#features">Features</a></li>
        <li><a href="#demo">Demo</a></li>
        <li><a href="#pricing">Pricing</a></li>
        <li><a href="#faq">FAQ</a></li>
      </ul>
      <a href="/signup" className="nav-cta">Start Free →</a>
      <button className="hamburger">☰</button>
    </div>
  </nav>

  {/* HERO */}
  <section className="hero">
    <div className="hero-glow"/>
    <div className="hero-badge">🚀 WhatsApp Growth Engine for Indian Businesses</div>
    <h1>Turn Every Message</h1>
    <span className="hero-accent">Into a Conversion</span>
    <p className="hero-sub">Fastrill understands real customer intent and replies instantly — like your best sales rep, available 24/7. In Hindi, Telugu, Tamil, and 10 more languages.</p>
    <div className="hero-btns">
      <a href="/signup" className="btn-main">Start Free — No Card Needed →</a>
      <a href="#demo" className="btn-sec">See it live ↓</a>
    </div>
    <div className="hero-pills">
      {["Intent-based AI replies in under 2 seconds","Connect WhatsApp in 10 minutes","Works in Hindi, Telugu, Tamil + 7 more","Free 14-day trial, no credit card"].map(p=>(
        <div key={p} className="pill"><div className="pill-dot"/>{p}</div>
      ))}
    </div>
  </section>

  {/* MARQUEE */}
  <div className="marquee-wrap">
    <div className="marquee-track">
      {[...Array(2)].map((_,rep)=>(
        ["💈 Salons","🧖 Spas","🏥 Clinics","🦷 Dental","💪 Gyms","💅 Nail Studios","🏠 Real Estate","🎓 Coaching","🍽️ Restaurants","💻 Agencies","🌿 Ayurveda","🏪 Retail"].map(b=>(
          <div key={rep+b} className="m-item">{b}</div>
        ))
      ))}
    </div>
  </div>

  {/* METRICS */}
  <section className="metrics">
    <div className="metrics-grid">
      {[
        {n:"< 2s",   l:"Average AI response time"},
        {n:"10+",    l:"Indian languages auto-detected"},
        {n:"24/7",   l:"Always on, never misses a lead"},
        {n:"10 min", l:"Setup — no tech knowledge needed"},
      ].map((m,i)=>(
        <div key={i} className="metric an">
          <div className="m-num">{m.n}</div>
          <div className="m-lbl">{m.l}</div>
        </div>
      ))}
    </div>
  </section>

  {/* HOW IT WORKS */}
  <section className="sec" id="how" style={{background:"var(--bg)"}}>
    <div className="wrap">
      <div className="an">
        <div className="eye">How it works</div>
        <h2 className="sh">Live in 10 minutes.<br/>No developer needed.</h2>
        <p className="sp" style={{maxWidth:480}}>Connect, configure, go live. Your AI receptionist starts working before your next customer messages.</p>
      </div>
      <div className="steps">
        {[
          {n:"01",t:"Connect Your WhatsApp",d:"Link your existing WhatsApp Business number via Meta's official API. One click. Your number stays yours — customers message the same number they always have."},
          {n:"02",t:"Configure Your Business",d:"Add services, prices, working hours, and custom instructions in plain language. The AI learns your business instantly. The more detail you give, the smarter it gets."},
          {n:"03",t:"AI Handles Everything",d:"Every customer gets an instant, intelligent reply. Bookings, queries, lead qualification, follow-ups — all handled automatically. You watch it in your dashboard in real time."},
        ].map(s=>(
          <div key={s.n} className="step an">
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
    <div className="wrap">
      <div className="proof-grid">
        {[
          {n:"₹18K",  l:"Saved monthly on staff costs (avg)"},
          {n:"47%",   l:"Increase in bookings in first month"},
          {n:"60%",   l:"Reduction in appointment cancellations"},
          {n:"2s",    l:"Average response time vs 4hr manual"},
        ].map(p=>(
          <div key={p.l} className="pbi an">
            <div className="pb-num">{p.n}</div>
            <div className="pb-lbl">{p.l}</div>
          </div>
        ))}
      </div>
    </div>
  </div>

  {/* FEATURES BENTO */}
  <section className="sec" id="features" style={{background:"var(--bg2)"}}>
    <div className="wrap">
      <div className="an">
        <div className="eye">Features</div>
        <h2 className="sh">Not a chatbot.<br/>A real AI brain.</h2>
        <p className="sp" style={{maxWidth:480}}>Built with a 13-stage processing pipeline — intent detection, entity extraction, customer memory, emotion sensing, and policy enforcement. All working together.</p>
      </div>
      <div className="bento">
        {FEATURES.map((fd,i)=>(
          <div key={i} className={"bento-card an"+(feat===i?" on":"")} onClick={()=>setFeat(i)}>
            <div className="bc-top">
              <div className="bc-icon">{fd.icon}</div>
              <div className="bc-tag">{fd.tag}</div>
            </div>
            <div className="bc-title">{fd.title}</div>
            <div className="bc-desc">{feat===i ? fd.desc : fd.desc.substring(0,70)+"…"}</div>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* DEMO */}
  <section className="sec" id="demo" style={{background:"var(--bg)"}}>
    <div className="wrap">
      <div className="an">
        <div className="eye">Live demo</div>
        <h2 className="sh">Real conversations.<br/>Real intelligence.</h2>
        <p className="sp" style={{maxWidth:480}}>Click any scenario. Watch how the AI handles it — not with fixed scripts, but with genuine understanding of what the customer needs.</p>
      </div>
      <div className="demo-wrap">
        <div className="sc-list an">
          {[
            {k:"booking",t:"📅 Booking flow",       d:"'I want a haircut' to confirmed"},
            {k:"hindi",  t:"🇮🇳 Hindi booking",      d:"Full booking in Hindi — auto detected"},
            {k:"lead",   t:"💰 High-value lead",     d:"Bridal inquiry → confirmed booking"},
            {k:"angry",  t:"😤 Angry customer",      d:"Emotion detected, tone adapts instantly"},
            {k:"unknown",t:"❓ Service not offered", d:"Handled warmly, shows alternatives"},
          ].map(s=>(
            <div key={s.k} className={"sc"+(convo===s.k?" on":"")} onClick={()=>setConvo(s.k)}>
              <div className="sc-t">{s.t}</div>
              <div className="sc-d">{s.d}</div>
            </div>
          ))}
        </div>
        <div className="chat an">
          <div className="chat-hd">
            <div className="chat-av">R</div>
            <div>
              <div className="chat-nm">Riya Salon</div>
              <div className="chat-st">◈ Fastrill AI Active</div>
            </div>
          </div>
          <div className="chat-msgs" ref={ref}>
            {msgs.map((m,i)=>(
              <div key={i} className={"cm "+(m.t==="c"?"c":"a")}>
                {m.t==="a"&&<span className="cm-lbl">◈ Fastrill AI</span>}
                {m.m.split("\n").map((l,j)=><span key={j}>{l}{j<m.m.split("\n").length-1&&<br/>}</span>)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* USE CASES */}
  <section className="sec" style={{background:"var(--bg2)"}}>
    <div className="wrap">
      <div className="an" style={{textAlign:"center"}}>
        <div className="eye" style={{justifyContent:"center"}}>Who it's for</div>
        <h2 className="sh">Built for every business<br/>that runs on customers</h2>
        <p className="sp" style={{maxWidth:520,margin:"0 auto"}}>If your customers message you on WhatsApp and you want to convert more — Fastrill works for you.</p>
      </div>
      <div className="uc-grid">
        {[
          {e:"💈",n:"Salons & Parlours",   d:"Book haircuts, facials, threading automatically"},
          {e:"🧖",n:"Spas & Wellness",     d:"Schedule massages and treatment sessions"},
          {e:"🏥",n:"Clinics & Doctors",   d:"Manage patient appointments and follow-ups"},
          {e:"🦷",n:"Dental Clinics",      d:"Auto-book checkups and treatments"},
          {e:"💪",n:"Gyms & Fitness",      d:"Book PT sessions, classes, memberships"},
          {e:"💅",n:"Nail & Makeup",       d:"Manage bookings, bridal packages, extensions"},
          {e:"🏠",n:"Real Estate",         d:"Qualify leads, schedule site visits"},
          {e:"🎓",n:"Coaching & Training", d:"Book discovery calls, batch enrolments"},
          {e:"🍽️",n:"Restaurants",         d:"Take reservations, answer menu questions"},
          {e:"💻",n:"Agencies",            d:"Qualify leads, book demos and discovery calls"},
          {e:"🌿",n:"Ayurveda & Physio",   d:"Schedule consultations and therapy sessions"},
          {e:"🏪",n:"Retail & D2C",        d:"Answer product questions, take orders on WhatsApp"},
        ].map(u=>(
          <div key={u.n} className="uc an">
            <span className="uc-em">{u.e}</span>
            <div className="uc-n">{u.n}</div>
            <p className="uc-d">{u.d}</p>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* VS */}
  <section className="sec" style={{background:"var(--bg)"}}>
    <div className="wrap">
      <div className="vs-grid">
        <div className="an">
          <div className="eye">Why Fastrill</div>
          <h2 className="sh">Not just another<br/>WhatsApp tool</h2>
          <p className="sp">Most tools give you rigid menus and keyword triggers. Fastrill is an AI that genuinely understands what your customers are saying — and responds like a human would.</p>
          <div className="vs-pts">
            {["Natural language understanding, not keyword matching","Remembers every customer across all conversations","Handles any message — not just expected ones","Detects emotion, adapts tone in real time","Never invents answers on pricing or policy","Knows exactly when to hand off to a human","Built specifically for Indian languages and context"].map(p=>(
              <div key={p} className="vs-pt"><div className="vs-ck">✓</div>{p}</div>
            ))}
          </div>
        </div>
        <div className="vs-tbl an">
          <div className="vs-th-row">
            <div className="vs-th tm">Other tools</div>
            <div className="vs-th us">Fastrill</div>
          </div>
          {[
            ["Fixed button menus","Natural conversation"],
            ["English only","10+ Indian languages"],
            ["Breaks on unexpected messages","Handles anything intelligently"],
            ["No customer memory","Remembers every visit"],
            ["No emotion awareness","Adapts to mood in real time"],
            ["Per-message billing","Flat monthly unlimited"],
            ["Needs developer setup","10-minute self-setup"],
            ["Generic bot responses","Business-specific AI"],
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
  <section className="sec" id="pricing" style={{background:"var(--bg2)"}}>
    <div className="wrap">
      <div className="an" style={{textAlign:"center"}}>
        <div className="eye" style={{justifyContent:"center"}}>Pricing</div>
        <h2 className="sh">Simple pricing.<br/>Pays for itself.</h2>
        <p className="sp" style={{maxWidth:460,margin:"0 auto"}}>No per-message charges. Flat monthly. One extra booking per week covers the entire plan.</p>
      </div>
      <div className="p-grid">
        {[
          {
            name:"Starter",price:"999",desc:"For solo operators",cta:"Get Started",cs:"ol",ft:false,
            feats:[
              {b:true, t:"1 WhatsApp number"},
              {b:false,t:"AI booking automation"},
              {b:false,t:"300 conversations/month"},
              {b:false,t:"10+ Indian languages"},
              {b:false,t:"Basic analytics"},
              {b:false,t:"Email support"},
            ]
          },
          {
            name:"Growth",price:"1,999",desc:"For growing businesses",cta:"Start Free Trial →",cs:"gn",ft:true,ribbon:"Most Popular",
            feats:[
              {b:true, t:"1 WhatsApp number"},
              {b:true, t:"Unlimited conversations"},
              {b:true, t:"Customer memory & personalization"},
              {b:true, t:"Lead recovery automation"},
              {b:false,t:"Emotion detection & handoff"},
              {b:false,t:"WhatsApp campaigns"},
              {b:false,t:"Advanced analytics"},
              {b:false,t:"Priority support"},
            ]
          },
          {
            name:"Pro",price:"4,999",desc:"Multi-branch & teams",cta:"Contact Us",cs:"ol",ft:false,
            feats:[
              {b:true, t:"Up to 5 WhatsApp numbers"},
              {b:true, t:"Everything in Growth"},
              {b:true, t:"Multi-branch management"},
              {b:true, t:"Staff availability routing"},
              {b:false,t:"Custom AI playbook"},
              {b:false,t:"API access"},
              {b:false,t:"Dedicated onboarding"},
              {b:false,t:"SLA-backed support"},
            ]
          },
        ].map(plan=>(
          <div key={plan.name} className={"plan an"+(plan.ft?" ft":"")}>
            {plan.ribbon&&<div className="p-rb">{plan.ribbon}</div>}
            <div className="p-tier">{plan.name}</div>
            <div className="p-desc">{plan.desc}</div>
            <div className="p-price">
              <span className="p-cur">₹</span>
              <span className="p-amt">{plan.price}</span>
            </div>
            <div className="p-per">per month + GST</div>
            <hr className="p-div"/>
            <ul className="p-feats">
              {plan.feats.map(f=>(
                <li key={f.t} className={f.b?"b":""}>{f.t}</li>
              ))}
            </ul>
            <a href="/signup" className={"p-cta "+plan.cs}>{plan.cta}</a>
          </div>
        ))}
      </div>
      <p className="p-note">All plans include a <strong style={{color:"var(--tx)"}}>14-day free trial</strong> · No credit card required · Cancel anytime</p>
    </div>
  </section>

  {/* TESTIMONIALS */}
  <section className="sec" style={{background:"var(--bg)"}}>
    <div className="wrap">
      <div className="an" style={{textAlign:"center"}}>
        <div className="eye" style={{justifyContent:"center"}}>Results</div>
        <h2 className="sh">Real results from<br/>real businesses</h2>
      </div>
      <div className="t-grid">
        {TESTIMONIALS.map(t=>(
          <div key={t.n} className="tc an">
            <div className="tc-res">📈 {t.r}</div>
            <div className="tc-stars">★★★★★</div>
            <p className="tc-text">"{t.t}"</p>
            <div className="tc-auth">
              <div className="tc-av" style={{background:`linear-gradient(135deg,${t.g})`}}>{t.i}</div>
              <div><div className="tc-nm">{t.n}</div><div className="tc-bz">{t.b}</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* FAQ */}
  <section className="sec" id="faq" style={{background:"var(--bg2)"}}>
    <div className="wrap">
      <div className="an" style={{textAlign:"center"}}>
        <div className="eye" style={{justifyContent:"center"}}>FAQ</div>
        <h2 className="sh">Honest answers<br/>to real questions</h2>
      </div>
      <div className="faq-wrap">
        {FAQS.map((q,i)=>(
          <div key={i} className={"fi"+(faq===i?" op":"")}>
            <button className="fb" onClick={()=>setFaq(faq===i?null:i)}>
              {q.q}<span className="fp">+</span>
            </button>
            <div className="fa-ans">{q.a}</div>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* CTA */}
  <section className="cta-sec">
    <div className="wrap">
      <div className="cta-box an">
        <h2>Your next customer is<br/>messaging you <em style={{color:"var(--gn)",fontStyle:"italic"}}>right now</em></h2>
        <p>Don't make them wait. Don't lose them to a competitor who replies faster.<br/>Fastrill answers in 2 seconds — in their language, 24/7.</p>
        <div className="cta-btns">
          <a href="/signup" className="btn-main">Start Free Trial — No Card →</a>
          <a href="https://wa.me/919999999999" className="btn-sec">💬 Chat on WhatsApp</a>
        </div>
        <p className="cta-n">14-day free trial · Setup in 10 minutes · Cancel anytime</p>
      </div>
    </div>
  </section>

  {/* FOOTER */}
  <footer>
    <div className="ft-in">
      <div className="ft-top">
        <div className="ft-logo">
          <a href="/" className="logo">fast<span>rill</span></a>
          <p className="ft-ab">WhatsApp AI growth engine for Indian businesses. Turns every message into a conversion — in any language, 24/7.</p>
        </div>
        {[
          {t:"Product", links:[["Features","#features"],["Pricing","#pricing"],["Demo","#demo"],["Changelog","/changelog"]]},
          {t:"Company", links:[["About","/about"],["Blog","/blog"],["Contact","/contact"]]},
          {t:"Legal",   links:[["Privacy","/privacy"],["Terms","/terms"],["Refund","/refund"]]},
        ].map(col=>(
          <div key={col.t}>
            <div className="ft-ct">{col.t}</div>
            <ul className="ft-lks">
              {col.links.map(([name,href])=>(
                <li key={name}><a href={href}>{name}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="ft-bot">
        <span>© 2026 Fastrill Technologies Pvt. Ltd.</span>
        <span>Made with ❤️ in India 🇮🇳</span>
      </div>
    </div>
  </footer>
  </>)
}
