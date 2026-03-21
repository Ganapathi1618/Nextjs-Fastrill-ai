"use client"
import { useEffect, useRef, useState } from "react"

const CONVOS = {
  booking:[
    {t:"c",m:"Hi, I want to book a haircut tomorrow"},
    {t:"a",m:"Great! 📅 Tomorrow is Saturday 21st — what time works? We're open 10AM–8PM 😊"},
    {t:"c",m:"3pm works for me"},
    {t:"a",m:"Shall I confirm *Haircut* on *Sat, 21 Mar* at *3:00 PM*? ✅"},
    {t:"c",m:"Yes please!"},
    {t:"a",m:"✅ Confirmed! Haircut booked for Saturday 3PM.\n\nSee you at Riya Salon! 😊"},
  ],
  hindi:[
    {t:"c",m:"Bhai facial karwa sakte hai kya?"},
    {t:"a",m:"Haan bilkul! 😊 Facial ₹1,200 mein available hai. Kab aana chahenge?"},
    {t:"c",m:"Kal shaam 6 baje"},
    {t:"a",m:"Kal Saturday 21 March — Confirm karu *Facial* ko *6:00 PM*? ✅"},
    {t:"c",m:"Ha bilkul"},
    {t:"a",m:"✅ Booking ho gayi!\n📋 Facial · 📅 Sat, 21 March · ⏰ 6:00 PM\n\nRiya Salon mein milenge! 😊"},
  ],
  lead:[
    {t:"c",m:"How much is your bridal makeup package?"},
    {t:"a",m:"Our Bridal Package is ₹8,500 💍\nIncludes makeup, hair styling, saree draping & mehendi.\n\nWhen's the wedding? I'll check availability 😊"},
    {t:"c",m:"March 28th"},
    {t:"a",m:"March 28th — slots go fast for weddings! 🌸\n\nShall I block the day? We need ₹1,000 advance to confirm."},
    {t:"c",m:"Yes let's do it"},
    {t:"a",m:"Wonderful! 💐 Sending payment link now.\n\nYour wedding day is going to be beautiful!"},
  ],
  angry:[
    {t:"c",m:"Your staff was so rude to me last time. I'm never coming back"},
    {t:"a",m:"I'm really sorry to hear this 😔 That's absolutely not okay and not how we treat customers.\n\nCould you tell me what happened? I want to make this right."},
    {t:"c",m:"The receptionist was dismissive when I asked about pricing"},
    {t:"a",m:"I sincerely apologize. This has been flagged to the salon manager — someone will call you within the hour.\n\nWe'd love to earn your trust back 🙏"},
  ],
}

const FAQS=[
  {q:"Do I need to change my WhatsApp number?",a:"No. You keep your exact same WhatsApp Business number. Fastrill connects through Meta's official Business API. Your customers message the same number they always have — nothing changes on their end."},
  {q:"Is this only for salons and clinics?",a:"Not at all. Fastrill works for any business that gets customers on WhatsApp — gyms, agencies, real estate, coaching, restaurants, retail, and more. If your customers message you, Fastrill can handle it."},
  {q:"Which Indian languages are supported?",a:"Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, and English — all auto-detected. No setup needed. The AI detects what your customer writes and responds in the same language."},
  {q:"Can I take over from the AI and reply manually?",a:"Yes, always. In your dashboard, toggle AI off for any conversation and reply yourself. The AI waits until you turn it back on. You're fully in control at all times."},
  {q:"What if the AI doesn't know the answer?",a:"It tells the customer it will check and connect them with the team — you get notified immediately. The AI never guesses or invents answers on pricing, policy, or anything important."},
  {q:"Are there per-message charges?",a:"No per-message charges ever. Flat monthly pricing regardless of volume. WhatsApp charges for business-initiated messages (like campaigns) per Meta's standard rates, but all AI conversations are covered in your plan."},
  {q:"How long does setup take?",a:"About 10 minutes. Connect WhatsApp via Meta (one click), add your services and hours, go live. No developer or technical knowledge required."},
  {q:"Is there a free trial?",a:"Yes — 14 days free, full Growth plan access, no credit card required. No automatic charges at the end. You choose whether to continue."},
]

export default function LandingPage(){
  const [convo,setConvo] = useState("booking")
  const [msgs,setMsgs]   = useState([])
  const [faq,setFaq]     = useState(null)
  const ref = useRef(null)

  useEffect(()=>{
    setMsgs([])
    CONVOS[convo].forEach((m,i)=>{
      setTimeout(()=>{
        setMsgs(p=>[...p,m])
        if(ref.current) ref.current.scrollTop = ref.current.scrollHeight
      }, i * 500)
    })
  },[convo])

  useEffect(()=>{
    const io = new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){ e.target.classList.add("vis"); io.unobserve(e.target) }
      })
    },{threshold:.06,rootMargin:"0px 0px -20px 0px"})
    document.querySelectorAll(".fade").forEach((el,i)=>{
      const par = el.parentElement
      const sibs = par ? Array.from(par.querySelectorAll(":scope > .fade")) : []
      const idx = sibs.indexOf(el)
      if(idx>0) el.style.transitionDelay = Math.min(idx*.09,.3)+"s"
      io.observe(el)
    })
    return ()=>io.disconnect()
  },[])

  return(<>
  <style>{`
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{
  background:#0d1117;
  color:#c9d1d9;
  font-family:'Plus Jakarta Sans',sans-serif;
  font-size:16px;line-height:1.6;overflow-x:hidden;
}
h1,h2,h3{
  font-family:'Plus Jakarta Sans',sans-serif;
  font-weight:800;line-height:1.15;letter-spacing:-.025em;color:#f0f6fc;
}

/* ── TOKENS ───────────────────────────────────── */
:root{
  --bg:   #0d1117;
  --bg2:  #161b22;
  --bg3:  #1c2128;
  --bg4:  #21262d;
  --gn:   #2ea043;
  --gnb:  #238636;
  --gnl:  #3fb950;
  --gngl: rgba(46,160,67,.15);
  --gnbd: rgba(46,160,67,.3);
  --bd:   rgba(240,246,252,.1);
  --bd2:  rgba(240,246,252,.18);
  --tx:   #f0f6fc;
  --tx2:  #8b949e;
  --tx3:  #6e7681;
  --wa:   #25d366;
}

/* ── NAV ──────────────────────────────────────── */
.nav{
  position:fixed;top:0;left:0;right:0;z-index:100;
  height:60px;padding:0 clamp(16px,4vw,48px);
  display:flex;align-items:center;justify-content:space-between;
  background:rgba(13,17,23,.9);backdrop-filter:blur(12px);
  border-bottom:1px solid var(--bd);
}
.logo{
  font-weight:800;font-size:20px;color:var(--tx);
  text-decoration:none;letter-spacing:-.5px;
}
.logo span{color:var(--gnl)}
.nav-mid{display:flex;align-items:center;gap:8px;list-style:none}
.nav-mid a{
  color:var(--tx2);text-decoration:none;font-size:13.5px;
  font-weight:500;padding:6px 10px;border-radius:6px;transition:all .15s;
}
.nav-mid a:hover{color:var(--tx);background:rgba(255,255,255,.06)}
.nav-cta{
  display:inline-flex;align-items:center;gap:6px;
  background:var(--gnb);color:#fff;padding:8px 20px;
  border-radius:8px;font-weight:700;font-size:13.5px;
  text-decoration:none;transition:all .15s;border:1px solid var(--gn);
}
.nav-cta:hover{background:var(--gn)}
.nav-r{display:flex;align-items:center;gap:12px}
.hbg{
  display:none;background:none;border:1px solid var(--bd2);
  border-radius:6px;padding:6px 9px;cursor:pointer;color:var(--tx2);font-size:15px;
}

/* ── HERO ─────────────────────────────────────── */
.hero{
  padding:clamp(96px,12vw,140px) clamp(16px,5vw,48px) clamp(64px,8vw,100px);
  background:var(--bg);
  position:relative;overflow:hidden;
}
.hero-grid{
  position:absolute;inset:0;
  background-image:
    linear-gradient(rgba(240,246,252,.03) 1px,transparent 1px),
    linear-gradient(90deg,rgba(240,246,252,.03) 1px,transparent 1px);
  background-size:48px 48px;
  mask-image:radial-gradient(ellipse 70% 60% at 50% 0%,black,transparent);
}
.hero-glow{
  position:absolute;top:-80px;left:50%;transform:translateX(-50%);
  width:min(700px,100vw);height:500px;
  background:radial-gradient(ellipse,rgba(46,160,67,.08) 0%,transparent 65%);
  pointer-events:none;
}
.hero-in{max-width:900px;margin:0 auto;text-align:center;position:relative;z-index:1}
.hero-chip{
  display:inline-flex;align-items:center;gap:8px;
  background:var(--gngl);border:1px solid var(--gnbd);border-radius:100px;
  padding:5px 14px;font-size:12.5px;font-weight:600;color:var(--gnl);margin-bottom:24px;
}
.hero-chip::before{
  content:'';width:6px;height:6px;border-radius:50%;
  background:var(--gnl);animation:pulse 2s infinite;
}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.3)}}
.hero h1{
  font-size:clamp(36px,6.5vw,76px);
  color:var(--tx);margin-bottom:20px;
}
.hero h1 em{
  font-style:normal;
  background:linear-gradient(135deg,var(--gnl) 0%,#56d364 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.hero-sub{
  font-size:clamp(15px,2vw,18px);color:var(--tx2);
  max-width:560px;margin:0 auto 36px;font-weight:400;line-height:1.7;
}
.hero-btns{
  display:flex;align-items:center;justify-content:center;
  gap:12px;flex-wrap:wrap;margin-bottom:48px;
}
.btn-green{
  display:inline-flex;align-items:center;gap:8px;
  background:var(--gnb);color:#fff;padding:13px 28px;
  border-radius:8px;font-weight:700;font-size:15px;
  text-decoration:none;transition:all .2s;
  border:1px solid var(--gn);
  box-shadow:0 0 0 3px rgba(46,160,67,.0);
}
.btn-green:hover{background:var(--gn);box-shadow:0 0 0 3px rgba(46,160,67,.2)}
.btn-outline{
  display:inline-flex;align-items:center;gap:8px;
  background:rgba(255,255,255,.04);color:var(--tx);
  padding:13px 24px;border-radius:8px;font-weight:500;font-size:14.5px;
  text-decoration:none;border:1px solid var(--bd2);transition:all .2s;
}
.btn-outline:hover{background:rgba(255,255,255,.08);border-color:var(--gnl)}

/* hero proof row */
.hero-proof{
  display:flex;align-items:center;justify-content:center;
  gap:clamp(16px,3vw,32px);flex-wrap:wrap;
}
.hp{display:flex;align-items:center;gap:7px;font-size:13px;color:var(--tx2);font-weight:500}
.hp-dot{width:5px;height:5px;border-radius:50%;background:var(--gnl);flex-shrink:0}

/* ── MARQUEE ──────────────────────────────────── */
.mqw{
  border-top:1px solid var(--bd);border-bottom:1px solid var(--bd);
  background:var(--bg2);padding:18px 0;overflow:hidden;position:relative;
}
.mqw::before,.mqw::after{
  content:'';position:absolute;top:0;bottom:0;width:100px;z-index:2;
}
.mqw::before{left:0;background:linear-gradient(90deg,var(--bg2),transparent)}
.mqw::after{right:0;background:linear-gradient(-90deg,var(--bg2),transparent)}
.mq-track{display:flex;animation:mq 30s linear infinite;width:max-content}
.mq-track:hover{animation-play-state:paused}
@keyframes mq{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.mq-item{
  display:flex;align-items:center;gap:8px;
  padding:0 28px;font-size:13px;font-weight:600;color:var(--tx2);
  white-space:nowrap;border-right:1px solid var(--bd);
}
.mq-item:last-child{border-right:none}

/* ── SECTION ──────────────────────────────────── */
.sec{padding:clamp(56px,8vw,100px) 0}
.wrap{max-width:1120px;margin:0 auto;padding:0 clamp(16px,4vw,48px)}
.sec-label{
  display:inline-flex;align-items:center;gap:7px;
  font-size:11.5px;font-weight:700;letter-spacing:1.5px;
  text-transform:uppercase;color:var(--gnl);margin-bottom:12px;
}
.sec-label::before{content:'';width:14px;height:2px;background:var(--gnl);border-radius:1px}
.sec-h{font-size:clamp(26px,4vw,44px);color:var(--tx);margin-bottom:14px}
.sec-p{font-size:clamp(14px,1.8vw,16px);color:var(--tx2);line-height:1.75}

/* ── HOW IT WORKS — visual flow ───────────────── */
.how-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:48px}
.how-card{
  background:var(--bg2);border:1px solid var(--bd);
  border-radius:14px;padding:28px 24px;position:relative;
  transition:border-color .2s;
}
.how-card:hover{border-color:var(--gnbd)}
/* connector arrow between cards */
.how-card:not(:last-child)::after{
  content:'→';position:absolute;right:-14px;top:50%;transform:translateY(-50%);
  font-size:18px;color:var(--gnl);z-index:2;
}
.how-step{
  width:32px;height:32px;border-radius:8px;
  background:var(--gngl);border:1px solid var(--gnbd);
  display:flex;align-items:center;justify-content:center;
  font-size:13px;font-weight:800;color:var(--gnl);
  margin-bottom:16px;font-family:'Plus Jakarta Sans',sans-serif;
}
.how-card h3{font-size:16px;font-weight:700;color:var(--tx);margin-bottom:8px}
.how-card p{font-size:13.5px;color:var(--tx2);line-height:1.65}

/* mini UI inside how cards */
.how-ui{
  margin-top:16px;background:var(--bg3);border:1px solid var(--bd);
  border-radius:10px;padding:12px;font-size:11.5px;
}
.how-ui-row{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;margin-bottom:4px;color:var(--tx2)}
.how-ui-row:last-child{margin-bottom:0}
.how-ui-row.active{background:var(--gngl);color:var(--gnl);font-weight:600}
.how-ui-dot{width:6px;height:6px;border-radius:50%;background:var(--gnl);flex-shrink:0}

/* ── FLOW SECTION — visual pipeline ──────────── */
.flow-sec{background:var(--bg2)}
.flow-pipeline{
  display:flex;align-items:center;gap:0;
  margin-top:48px;overflow-x:auto;padding-bottom:8px;
}
.flow-step{
  flex:1;min-width:120px;
  display:flex;flex-direction:column;align-items:center;
  text-align:center;position:relative;padding:0 8px;
}
.flow-step:not(:last-child)::after{
  content:'';position:absolute;right:0;top:28px;
  width:calc(50% - 0px);height:2px;
  background:linear-gradient(90deg,var(--gnbd),transparent);
  z-index:0;
}
.flow-step:not(:first-child)::before{
  content:'';position:absolute;left:0;top:28px;
  width:50%;height:2px;
  background:linear-gradient(90deg,transparent,var(--gnbd));
  z-index:0;
}
.flow-icon{
  width:56px;height:56px;border-radius:14px;
  background:var(--bg3);border:1px solid var(--bd);
  display:flex;align-items:center;justify-content:center;
  font-size:22px;margin-bottom:10px;position:relative;z-index:1;
  transition:all .2s;
}
.flow-step:hover .flow-icon{border-color:var(--gnbd);background:var(--gngl)}
.flow-label{font-size:12px;font-weight:600;color:var(--tx);margin-bottom:3px}
.flow-sub{font-size:11px;color:var(--tx2)}

/* ── DEMO ─────────────────────────────────────── */
.demo-layout{
  display:grid;grid-template-columns:200px 1fr;
  gap:20px;margin-top:48px;align-items:start;
}
.demo-tabs{display:flex;flex-direction:column;gap:8px}
.demo-tab{
  background:var(--bg2);border:1px solid var(--bd);
  border-radius:10px;padding:12px 14px;cursor:pointer;transition:all .2s;
}
.demo-tab.on{border-color:var(--gnl);background:var(--gngl)}
.demo-tab:hover:not(.on){border-color:var(--bd2)}
.dt-title{font-size:13px;font-weight:600;color:var(--tx);margin-bottom:2px}
.dt-sub{font-size:11.5px;color:var(--tx2)}
.chat-win{background:#0b141a;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.08)}
.chat-hd{background:#1f2c34;padding:12px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,.06)}
.chat-av{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--gnl),#0ea5e9);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;color:#000;flex-shrink:0}
.chat-nm{font-size:12.5px;font-weight:700;color:#e9edef}
.chat-st{font-size:10px;color:var(--wa)}
.chat-body{padding:12px;min-height:300px;display:flex;flex-direction:column;gap:8px;overflow-y:auto}
.cm{max-width:78%;padding:8px 12px;border-radius:10px;font-size:13px;line-height:1.5;animation:cmIn .25s ease both}
.cm.c{background:#005c4b;color:#e9edef;align-self:flex-end;border-radius:10px 2px 10px 10px}
.cm.a{background:#1e2d23;border:1px solid rgba(37,211,102,.15);color:#e9edef;align-self:flex-start;border-radius:2px 10px 10px 10px}
.cm-tag{font-size:9.5px;color:var(--wa);font-weight:700;margin-bottom:3px;display:block}
@keyframes cmIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}

/* ── FEATURES GRID ────────────────────────────── */
.feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:48px}
.feat-card{
  background:var(--bg2);border:1px solid var(--bd);border-radius:14px;
  padding:24px 20px;transition:all .2s;
}
.feat-card:hover{border-color:var(--gnbd);background:var(--bg3)}
.fc-ico{
  width:38px;height:38px;border-radius:9px;
  background:var(--gngl);border:1px solid var(--gnbd);
  display:flex;align-items:center;justify-content:center;
  font-size:17px;margin-bottom:14px;
}
.fc-tag{float:right;font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--gnl);background:var(--gngl);border:1px solid var(--gnbd);padding:2px 8px;border-radius:4px;margin-top:2px}
.fc-t{font-size:14.5px;font-weight:700;color:var(--tx);margin-bottom:8px;clear:both}
.fc-d{font-size:13px;color:var(--tx2);line-height:1.65}

/* ── WHO IT'S FOR ─────────────────────────────── */
.who-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:48px}
.who-card{
  background:var(--bg2);border:1px solid var(--bd);
  border-radius:12px;padding:20px 16px;transition:all .2s;
}
.who-card:hover{border-color:var(--gnbd);transform:translateY(-2px)}
.who-em{font-size:26px;margin-bottom:8px;display:block}
.who-n{font-size:13.5px;font-weight:700;color:var(--tx);margin-bottom:4px}
.who-d{font-size:12px;color:var(--tx2);line-height:1.5}

/* ── VS ───────────────────────────────────────── */
.vs-layout{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:start;margin-top:48px}
.vs-pts{display:flex;flex-direction:column;gap:12px;margin-top:20px}
.vs-pt{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:var(--tx2);line-height:1.6}
.vs-ck{
  width:18px;height:18px;border-radius:50%;flex-shrink:0;margin-top:2px;
  background:var(--gngl);border:1px solid var(--gnbd);
  display:flex;align-items:center;justify-content:center;
  font-size:9px;color:var(--gnl);
}
.vs-tbl{background:var(--bg2);border:1px solid var(--bd);border-radius:14px;overflow:hidden}
.vs-head{display:grid;grid-template-columns:1fr 1fr;background:var(--bg3)}
.vs-th{padding:12px 20px;font-size:11.5px;font-weight:700;letter-spacing:.5px;text-transform:uppercase}
.vs-th.tm{color:var(--tx3);border-right:1px solid var(--bd)}
.vs-th.us{color:var(--gnl)}
.vs-row{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid var(--bd)}
.vs-c{padding:11px 20px;font-size:13px;display:flex;align-items:center;gap:6px}
.vs-c.tm{color:var(--tx3);border-right:1px solid var(--bd)}
.vs-c.tm::before{content:'✕';color:#f85149;font-size:10px}
.vs-c.us{color:var(--tx);font-weight:500}
.vs-c.us::before{content:'✓';color:var(--gnl);font-size:10px}

/* ── PRICING ──────────────────────────────────── */
.p-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:48px}
.plan{
  background:var(--bg2);border:1px solid var(--bd);
  border-radius:16px;padding:clamp(24px,3vw,36px) clamp(20px,3vw,32px);
  position:relative;transition:border-color .2s;
}
.plan:hover{border-color:var(--gnbd)}
.plan.ft{
  background:var(--bg3);
  border-color:rgba(46,160,67,.4);
  box-shadow:0 0 0 1px rgba(46,160,67,.1),0 8px 32px rgba(46,160,67,.08);
}
.p-badge{
  position:absolute;top:-1px;left:50%;transform:translateX(-50%);
  background:var(--gnb);color:#fff;font-size:11px;font-weight:700;
  padding:3px 14px;border-radius:0 0 8px 8px;white-space:nowrap;
  border:1px solid var(--gn);border-top:none;
}
.p-tier{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--tx2);margin-bottom:6px}
.p-tagline{font-size:13px;color:var(--tx2);margin-bottom:20px}
.p-price{display:flex;align-items:baseline;gap:2px;margin-bottom:4px}
.p-rs{font-size:20px;font-weight:600;color:var(--tx);margin-top:6px}
.p-amt{font-size:clamp(40px,5vw,52px);font-weight:800;color:var(--tx);line-height:1;letter-spacing:-1px}
.plan.ft .p-amt,.plan.ft .p-rs{color:var(--gnl)}
.p-mo{font-size:12px;color:var(--tx2);margin-bottom:20px}
.p-hr{border:none;border-top:1px solid var(--bd);margin:18px 0}
.p-list{list-style:none;display:flex;flex-direction:column;gap:9px;margin-bottom:24px}
.p-list li{display:flex;align-items:flex-start;gap:7px;font-size:13px;color:var(--tx2);line-height:1.5}
.p-list li::before{content:'✓';color:var(--gnl);font-size:11px;margin-top:1px;flex-shrink:0;font-weight:700}
.p-list li.hi{color:var(--tx);font-weight:600}
.p-btn{display:block;text-align:center;padding:11px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;transition:all .2s}
.p-btn.gn{background:var(--gnb);color:#fff;border:1px solid var(--gn)}
.p-btn.gn:hover{background:var(--gn)}
.p-btn.ol{background:transparent;color:var(--tx);border:1px solid var(--bd2)}
.p-btn.ol:hover{border-color:var(--gnl);color:var(--gnl)}
.p-foot{text-align:center;margin-top:18px;font-size:13px;color:var(--tx2)}

/* ── TESTIMONIALS ─────────────────────────────── */
.t-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:48px}
.tc{background:var(--bg2);border:1px solid var(--bd);border-radius:14px;padding:24px;transition:border-color .2s}
.tc:hover{border-color:var(--gnbd)}
.tc-badge{display:inline-block;background:var(--gngl);border:1px solid var(--gnbd);color:var(--gnl);font-size:11.5px;font-weight:700;padding:3px 9px;border-radius:5px;margin-bottom:12px}
.tc-stars{color:#e3b341;font-size:13px;letter-spacing:1.5px;margin-bottom:10px}
.tc-txt{font-size:13.5px;color:var(--tx2);line-height:1.75;margin-bottom:18px;font-style:italic}
.tc-auth{display:flex;align-items:center;gap:10px}
.tc-av{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#fff;flex-shrink:0}
.tc-nm{font-size:13px;font-weight:700;color:var(--tx)}
.tc-bz{font-size:11.5px;color:var(--tx2)}

/* ── FAQ ──────────────────────────────────────── */
.faq-box{max-width:660px;margin:48px auto 0;border:1px solid var(--bd);border-radius:14px;overflow:hidden;background:var(--bg2)}
.fi{border-bottom:1px solid var(--bd)}
.fi:last-child{border-bottom:none}
.fb{width:100%;background:none;border:none;padding:18px 22px;text-align:left;font-size:14.5px;font-weight:600;color:var(--tx);cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:14px;font-family:inherit;transition:background .15s}
.fb:hover{background:rgba(255,255,255,.03)}
.fp{width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;font-size:15px;color:var(--tx2);flex-shrink:0;transition:all .2s;line-height:1}
.fa{padding:0 22px;font-size:13.5px;color:var(--tx2);line-height:1.75;max-height:0;overflow:hidden;transition:max-height .3s ease,padding .3s ease}
.fi.op .fa{max-height:160px;padding:0 22px 18px}
.fi.op .fp{background:var(--gngl);color:var(--gnl);transform:rotate(45deg)}

/* ── CTA ──────────────────────────────────────── */
.cta-sec{padding:clamp(56px,8vw,100px) clamp(16px,4vw,48px);text-align:center;position:relative;overflow:hidden}
.cta-sec::before{
  content:'';position:absolute;top:50%;left:50%;
  transform:translate(-50%,-50%);
  width:min(600px,100vw);height:400px;
  background:radial-gradient(ellipse,rgba(46,160,67,.07) 0%,transparent 70%);
  pointer-events:none;
}
.cta-card{
  max-width:720px;margin:0 auto;position:relative;z-index:1;
  background:var(--bg2);border:1px solid var(--gnbd);
  border-radius:20px;padding:clamp(40px,6vw,72px) clamp(24px,5vw,60px);
}
.cta-card::before{
  content:'';position:absolute;top:0;left:15%;right:15%;height:1px;
  background:linear-gradient(90deg,transparent,var(--gnl),transparent);
}
.cta-card h2{font-size:clamp(26px,5vw,48px);color:var(--tx);margin-bottom:14px}
.cta-card h2 em{font-style:normal;color:var(--gnl)}
.cta-card p{font-size:clamp(14px,1.8vw,16px);color:var(--tx2);margin-bottom:32px}
.cta-btns{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap}
.cta-note{margin-top:16px;font-size:12px;color:var(--tx3)}

/* ── FOOTER ───────────────────────────────────── */
footer{background:var(--bg2);border-top:1px solid var(--bd);padding:clamp(40px,5vw,56px) clamp(16px,4vw,48px) clamp(24px,3vw,32px)}
.ft{max-width:1120px;margin:0 auto}
.ft-top{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:clamp(20px,4vw,40px);margin-bottom:clamp(24px,4vw,36px)}
.ft-brand .logo{font-size:18px}
.ft-about{font-size:13px;color:var(--tx2);line-height:1.7;margin-top:12px;max-width:260px}
.ft-col-h{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--tx3);margin-bottom:12px}
.ft-lks{list-style:none;display:flex;flex-direction:column;gap:8px}
.ft-lks a{font-size:13.5px;color:var(--tx2);text-decoration:none;transition:color .15s}
.ft-lks a:hover{color:var(--gnl)}
.ft-bot{padding-top:20px;border-top:1px solid var(--bd);display:flex;justify-content:space-between;align-items:center;font-size:12.5px;color:var(--tx3);flex-wrap:wrap;gap:8px}

/* ── REVEAL ───────────────────────────────────── */
.fade{opacity:0;transform:translateY(20px);transition:opacity .55s ease,transform .55s ease}
.fade.vis{opacity:1;transform:none}

/* ══════════════════════════════════════════════
   MOBILE — < 768px
══════════════════════════════════════════════ */
@media(max-width:768px){
  /* nav */
  .nav{height:54px;padding:0 16px}
  .nav-mid{display:none}
  .hbg{display:flex}
  .logo{font-size:18px}

  /* hero */
  .hero{padding:84px 16px 56px}
  .hero h1{font-size:clamp(30px,8vw,44px)}
  .hero-sub{font-size:15px;margin-bottom:28px}
  .hero-btns{flex-direction:column;align-items:stretch}
  .btn-green,.btn-outline{justify-content:center;padding:13px 20px}
  .hero-proof{flex-direction:column;align-items:flex-start;gap:10px;max-width:280px;margin:0 auto}

  /* marquee */
  .mq-item{padding:0 18px;font-size:12px}

  /* sections */
  .sec{padding:clamp(44px,7vw,64px) 0}
  .wrap{padding:0 16px}
  .sec-h{font-size:clamp(24px,7vw,34px)}
  .sec-p{font-size:14px}

  /* how */
  .how-grid{grid-template-columns:1fr;gap:12px}
  .how-card:not(:last-child)::after{display:none}
  /* vertical arrow for mobile */
  .how-card:not(:last-child){padding-bottom:32px}
  .how-card:not(:last-child)::before{
    content:'↓';position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);
    font-size:16px;color:var(--gnl);z-index:2;
  }

  /* flow pipeline */
  .flow-pipeline{
    flex-direction:column;align-items:flex-start;
    gap:0;padding-bottom:0;
  }
  .flow-step{
    flex-direction:row;align-items:center;
    text-align:left;min-width:auto;width:100%;
    padding:12px 0;border-bottom:1px solid var(--bd);
  }
  .flow-step:last-child{border-bottom:none}
  .flow-step::after,.flow-step::before{display:none}
  .flow-icon{width:44px;height:44px;flex-shrink:0;margin-bottom:0;margin-right:14px;font-size:18px}
  .flow-label{font-size:13.5px;margin-bottom:2px}
  .flow-sub{font-size:12px}

  /* demo */
  .demo-layout{grid-template-columns:1fr;gap:16px}
  .demo-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .chat-body{min-height:260px}

  /* features */
  .feat-grid{grid-template-columns:1fr;gap:10px}

  /* who */
  .who-grid{grid-template-columns:repeat(2,1fr);gap:10px}

  /* vs */
  .vs-layout{grid-template-columns:1fr;gap:24px}

  /* pricing */
  .p-grid{grid-template-columns:1fr;gap:14px}
  .plan{padding:24px 20px}
  .p-amt{font-size:42px}

  /* testimonials */
  .t-grid{grid-template-columns:1fr;gap:12px}

  /* cta */
  .cta-card{padding:36px 20px;border-radius:16px}
  .cta-btns{flex-direction:column;align-items:stretch}
  .cta-btns a{justify-content:center}

  /* footer */
  .ft-top{grid-template-columns:1fr;gap:24px}
  .ft-about{max-width:100%}
  .ft-bot{flex-direction:column;text-align:center}
}

/* TABLET — 769–1024 */
@media(min-width:769px) and (max-width:1024px){
  .nav-mid{display:none}
  .hbg{display:flex}
  .hero h1{font-size:clamp(38px,6vw,58px)}
  .feat-grid{grid-template-columns:repeat(2,1fr)}
  .who-grid{grid-template-columns:repeat(3,1fr)}
  .t-grid{grid-template-columns:repeat(2,1fr)}
  .ft-top{grid-template-columns:1fr 1fr;gap:28px}
  .vs-layout{grid-template-columns:1fr}
  .demo-layout{grid-template-columns:160px 1fr}
}
  `}</style>

  {/* ── NAV ─────────────────────────────────── */}
  <nav className="nav">
    <a href="/" className="logo">fast<span>rill</span></a>
    <ul className="nav-mid">
      <li><a href="#how">How it works</a></li>
      <li><a href="#features">Features</a></li>
      <li><a href="#demo">Demo</a></li>
      <li><a href="#pricing">Pricing</a></li>
      <li><a href="#faq">FAQ</a></li>
    </ul>
    <div className="nav-r">
      <a href="/signup" className="nav-cta">Start Free →</a>
      <button className="hbg">☰</button>
    </div>
  </nav>

  {/* ── HERO ────────────────────────────────── */}
  <section className="hero">
    <div className="hero-grid"/>
    <div className="hero-glow"/>
    <div className="hero-in">
      <div className="hero-chip">🇮🇳 WhatsApp AI built for Indian businesses</div>
      <h1>Your WhatsApp replies<br/>like your <em>best employee</em></h1>
      <p className="hero-sub">
        Fastrill understands what customers actually mean and responds instantly —
        books appointments, qualifies leads, handles queries.
        In Hindi, Telugu, Tamil, and 10 more languages. 24/7.
      </p>
      <div className="hero-btns">
        <a href="/signup" className="btn-green">Start Free Trial — No Card Needed →</a>
        <a href="#demo" className="btn-outline">See live demo ↓</a>
      </div>
      <div className="hero-proof">
        {[
          "Replies in under 2 seconds",
          "10+ Indian languages",
          "Setup in 10 minutes",
          "14-day free trial",
        ].map(p=>(
          <div key={p} className="hp"><div className="hp-dot"/>{p}</div>
        ))}
      </div>
    </div>
  </section>

  {/* ── MARQUEE ─────────────────────────────── */}
  <div className="mqw">
    <div className="mq-track">
      {[...Array(2)].map((_,r)=>(
        ["💈 Salons","🧖 Spas","🏥 Clinics","🦷 Dental","💪 Gyms","💅 Nail Studios","🏠 Real Estate","🎓 Coaching","🍽️ Restaurants","💻 Agencies","🌿 Ayurveda","🏪 Retail"].map(b=>(
          <div key={r+b} className="mq-item">{b}</div>
        ))
      ))}
    </div>
  </div>

  {/* ── HOW IT WORKS ────────────────────────── */}
  <section className="sec" id="how" style={{background:"var(--bg)"}}>
    <div className="wrap">
      <div className="fade">
        <div className="sec-label">How it works</div>
        <h2 className="sec-h">Set it up in 10 minutes.<br/>Never miss a customer again.</h2>
        <p className="sec-p" style={{maxWidth:500}}>No developer, no training, no complicated setup. Connect your WhatsApp, describe your business, go live.</p>
      </div>
      <div className="how-grid">
        {/* Step 1 */}
        <div className="how-card fade">
          <div className="how-step">1</div>
          <h3>Connect WhatsApp</h3>
          <p>Link your existing WhatsApp Business number via Meta's official API. One click, fully secure. Nothing changes for your customers.</p>
          <div className="how-ui">
            <div className="how-ui-row active"><div className="how-ui-dot"/>WhatsApp Business connected</div>
            <div className="how-ui-row"><div style={{width:6,height:6,borderRadius:"50%",background:"var(--tx3)",flexShrink:0}}/>Phone: +91 98765 43210</div>
            <div className="how-ui-row"><div style={{width:6,height:6,borderRadius:"50%",background:"var(--gnl)",flexShrink:0}}/>Status: Active ✓</div>
          </div>
        </div>
        {/* Step 2 */}
        <div className="how-card fade">
          <div className="how-step">2</div>
          <h3>Add Your Services</h3>
          <p>Add services, prices, working hours, and any custom instructions. Plain language — the AI understands it all. More detail = smarter AI.</p>
          <div className="how-ui">
            <div className="how-ui-row active"><div className="how-ui-dot"/>Haircut — ₹400 · 30 min</div>
            <div className="how-ui-row active"><div className="how-ui-dot"/>Hair Spa — ₹800 · 60 min</div>
            <div className="how-ui-row active"><div className="how-ui-dot"/>Facial — ₹1,200 · 60 min</div>
          </div>
        </div>
        {/* Step 3 */}
        <div className="how-card fade">
          <div className="how-step">3</div>
          <h3>AI Handles Everything</h3>
          <p>Every customer gets an instant reply. Bookings confirmed, questions answered, leads followed up — all in your dashboard in real time.</p>
          <div className="how-ui">
            <div className="how-ui-row active"><div className="how-ui-dot"/>✅ Booking confirmed · Priya · 3PM Sat</div>
            <div className="how-ui-row active"><div className="how-ui-dot"/>📋 New lead · Rahul · Bridal pkg</div>
            <div className="how-ui-row"><div style={{width:6,height:6,borderRadius:"50%",background:"var(--tx3)",flexShrink:0}}/>💬 Anita asking about pricing</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* ── AI FLOW PIPELINE ────────────────────── */}
  <section className="sec flow-sec" id="flow">
    <div className="wrap">
      <div className="fade">
        <div className="sec-label">Under the hood</div>
        <h2 className="sec-h">How every message is processed</h2>
        <p className="sec-p" style={{maxWidth:520}}>
          Every WhatsApp message goes through a 13-stage AI pipeline in under 2 seconds.
          This is why Fastrill feels human — it's not guessing, it's understanding.
        </p>
      </div>
      <div className="flow-pipeline fade">
        {[
          {icon:"📩",label:"Message In",    sub:"Any language"},
          {icon:"🔍",label:"Intent",         sub:"What do they want?"},
          {icon:"🧩",label:"Entities",       sub:"Service, date, time"},
          {icon:"🧠",label:"Memory",         sub:"Who is this customer?"},
          {icon:"📋",label:"Policy Check",   sub:"Hours, rules, slots"},
          {icon:"😤",label:"Emotion",        sub:"Mood detection"},
          {icon:"💬",label:"Reply Gen",      sub:"Human-sounding"},
          {icon:"✅",label:"Action",         sub:"Book / Save / Notify"},
        ].map(s=>(
          <div key={s.label} className="flow-step">
            <div className="flow-icon">{s.icon}</div>
            <div className="flow-label">{s.label}</div>
            <div className="flow-sub">{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* ── DEMO ────────────────────────────────── */}
  <section className="sec" id="demo" style={{background:"var(--bg)"}}>
    <div className="wrap">
      <div className="fade">
        <div className="sec-label">Live demo</div>
        <h2 className="sec-h">Real conversations,<br/>real intelligence</h2>
        <p className="sec-p" style={{maxWidth:500}}>
          Click any scenario below. This is the actual AI — not scripted responses.
          Watch how it handles each situation differently.
        </p>
      </div>
      <div className="demo-layout">
        <div className="demo-tabs fade">
          {[
            {k:"booking",t:"📅 Booking",    d:"End-to-end"},
            {k:"hindi",  t:"🇮🇳 Hindi",     d:"Auto-detected"},
            {k:"lead",   t:"💰 Lead",        d:"High value"},
            {k:"angry",  t:"😤 Complaint",  d:"Empathy mode"},
          ].map(s=>(
            <div key={s.k} className={"demo-tab"+(convo===s.k?" on":"")} onClick={()=>setConvo(s.k)}>
              <div className="dt-title">{s.t}</div>
              <div className="dt-sub">{s.d}</div>
            </div>
          ))}
        </div>
        <div className="chat-win fade">
          <div className="chat-hd">
            <div className="chat-av">R</div>
            <div>
              <div className="chat-nm">Riya Salon</div>
              <div className="chat-st">◈ Fastrill AI · Online</div>
            </div>
          </div>
          <div className="chat-body" ref={ref}>
            {msgs.map((m,i)=>(
              <div key={i} className={"cm "+(m.t==="c"?"c":"a")}>
                {m.t==="a"&&<span className="cm-tag">◈ Fastrill AI</span>}
                {m.m.split("\n").map((l,j)=>(
                  <span key={j}>{l}{j<m.m.split("\n").length-1&&<br/>}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* ── FEATURES ────────────────────────────── */}
  <section className="sec" id="features" style={{background:"var(--bg2)"}}>
    <div className="wrap">
      <div className="fade">
        <div className="sec-label">Features</div>
        <h2 className="sec-h">Not a chatbot.<br/>A real AI receptionist.</h2>
        <p className="sec-p" style={{maxWidth:500}}>
          Built with genuine intelligence — memory, emotion detection, interruption handling,
          multilingual support. Everything a trained human receptionist does.
        </p>
      </div>
      <div className="feat-grid">
        {[
          {i:"🧠",tag:"Core AI",      t:"Real Intent Detection",      d:"Understands 'I want to come tomorrow evening for a facial' — not just keywords. Works across all 10+ Indian languages automatically."},
          {i:"💬",tag:"Multilingual", t:"10+ Indian Languages",        d:"Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, English — auto-detected. No setup needed."},
          {i:"🔄",tag:"Smart",        t:"Handles Interruptions",       d:"Customer asks a price question mid-booking? AI answers it and returns to the booking — just like a trained human would."},
          {i:"😤",tag:"AI v2",        t:"Emotion Detection",           d:"Detects frustration or anger in real time. Adapts tone — empathy first, solution second. Escalates to you when needed."},
          {i:"🧩",tag:"Memory",       t:"Remembers Every Customer",    d:"Preferred services, favorite times, language, past visits. Return customers feel recognized, not like strangers."},
          {i:"🎯",tag:"Revenue",      t:"Lead Recovery",               d:"Customer dropped mid-booking? Fastrill follows up automatically at the right moment. No booking left behind."},
          {i:"👤",tag:"Escalation",   t:"Smart Human Handoff",         d:"Knows when to stop — refunds, disputes, angry customers. Pauses, notifies you with full context. Never makes things worse."},
          {i:"📢",tag:"Marketing",    t:"WhatsApp Campaigns",          d:"Send bulk messages using Meta-approved templates. Target segments, track opens and replies, measure conversion."},
          {i:"📊",tag:"Dashboard",    t:"Full Analytics",              d:"All conversations, bookings, leads, campaign performance in one dashboard. Track AI quality and revenue in real time."},
        ].map(f=>(
          <div key={f.t} className="feat-card fade">
            <div className="fc-tag">{f.tag}</div>
            <div className="fc-ico">{f.i}</div>
            <div className="fc-t">{f.t}</div>
            <div className="fc-d">{f.d}</div>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* ── WHO IT'S FOR ────────────────────────── */}
  <section className="sec" style={{background:"var(--bg)"}}>
    <div className="wrap">
      <div className="fade" style={{textAlign:"center"}}>
        <div className="sec-label" style={{justifyContent:"center"}}>Who it's for</div>
        <h2 className="sec-h">Built for every business<br/>that runs on customers</h2>
        <p className="sec-p" style={{maxWidth:500,margin:"0 auto"}}>If your customers message you on WhatsApp and you want to convert more — Fastrill works for you.</p>
      </div>
      <div className="who-grid">
        {[
          {e:"💈",n:"Salons & Parlours",   d:"Book haircuts, facials, threading"},
          {e:"🧖",n:"Spas & Wellness",     d:"Schedule massages and treatments"},
          {e:"🏥",n:"Clinics & Doctors",   d:"Appointments and follow-ups"},
          {e:"🦷",n:"Dental Clinics",      d:"Checkups and treatments"},
          {e:"💪",n:"Gyms & Fitness",      d:"PT sessions, memberships"},
          {e:"💅",n:"Nail & Makeup",       d:"Bookings and bridal packages"},
          {e:"🏠",n:"Real Estate",         d:"Qualify leads, site visits"},
          {e:"🎓",n:"Coaching",            d:"Discovery calls, enrolments"},
          {e:"🍽️",n:"Restaurants",         d:"Reservations and menu queries"},
          {e:"💻",n:"Agencies",            d:"Lead qualification and demos"},
          {e:"🌿",n:"Ayurveda & Physio",   d:"Consultations and therapy"},
          {e:"🏪",n:"Retail & D2C",        d:"Orders and product queries"},
        ].map(u=>(
          <div key={u.n} className="who-card fade">
            <span className="who-em">{u.e}</span>
            <div className="who-n">{u.n}</div>
            <p className="who-d">{u.d}</p>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* ── VS ──────────────────────────────────── */}
  <section className="sec" style={{background:"var(--bg2)"}}>
    <div className="wrap">
      <div className="vs-layout">
        <div className="fade">
          <div className="sec-label">Why Fastrill</div>
          <h2 className="sec-h">Not just another<br/>WhatsApp tool</h2>
          <p className="sec-p">Most tools give you rigid button menus. Fastrill actually understands your customers — in their language, in any context.</p>
          <div className="vs-pts">
            {[
              "Understands natural language — not just commands",
              "Remembers customers across all conversations",
              "Handles any message, not just expected ones",
              "Detects emotion and adapts its tone in real time",
              "Never guesses on pricing, policy, or availability",
              "Knows exactly when to escalate to a human",
              "Built specifically for Indian languages and context",
            ].map(p=>(
              <div key={p} className="vs-pt"><div className="vs-ck">✓</div>{p}</div>
            ))}
          </div>
        </div>
        <div className="vs-tbl fade">
          <div className="vs-head">
            <div className="vs-th tm">Other tools</div>
            <div className="vs-th us">Fastrill</div>
          </div>
          {[
            ["Fixed button menus","Natural conversation"],
            ["English only","10+ Indian languages"],
            ["Breaks on unexpected input","Handles anything"],
            ["No memory","Remembers every customer"],
            ["No emotion awareness","Adapts to mood"],
            ["Per-message billing","Flat monthly unlimited"],
            ["Developer needed","10-min self-setup"],
            ["Generic bot replies","Business-specific AI"],
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

  {/* ── PRICING ─────────────────────────────── */}
  <section className="sec" id="pricing" style={{background:"var(--bg)"}}>
    <div className="wrap">
      <div className="fade" style={{textAlign:"center"}}>
        <div className="sec-label" style={{justifyContent:"center"}}>Pricing</div>
        <h2 className="sec-h">Simple pricing.<br/>Pays for itself.</h2>
        <p className="sec-p" style={{maxWidth:440,margin:"0 auto"}}>
          No per-message charges. Flat monthly. A single extra booking per week covers the entire plan.
        </p>
      </div>
      <div className="p-grid">
        {[
          {
            name:"Starter",price:"999",tagline:"For solo operators",
            cta:"Get Started",cs:"ol",ft:false,
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
            name:"Growth",price:"1,999",tagline:"For growing businesses",
            cta:"Start Free Trial →",cs:"gn",ft:true,badge:"Most Popular",
            feats:[
              {b:true, t:"1 WhatsApp number"},
              {b:true, t:"Unlimited conversations"},
              {b:true, t:"Customer memory"},
              {b:true, t:"Lead recovery automation"},
              {b:false,t:"Emotion detection & handoff"},
              {b:false,t:"WhatsApp campaigns"},
              {b:false,t:"Advanced analytics"},
              {b:false,t:"Priority support"},
            ]
          },
          {
            name:"Pro",price:"4,999",tagline:"Multi-branch & teams",
            cta:"Contact Us",cs:"ol",ft:false,
            feats:[
              {b:true, t:"Up to 5 WhatsApp numbers"},
              {b:true, t:"Everything in Growth"},
              {b:true, t:"Multi-branch management"},
              {b:true, t:"Staff availability routing"},
              {b:false,t:"Custom AI playbook"},
              {b:false,t:"API access"},
              {b:false,t:"Dedicated onboarding"},
              {b:false,t:"SLA support"},
            ]
          },
        ].map(plan=>(
          <div key={plan.name} className={"plan fade"+(plan.ft?" ft":"")}>
            {plan.badge&&<div className="p-badge">{plan.badge}</div>}
            <div className="p-tier">{plan.name}</div>
            <div className="p-tagline">{plan.tagline}</div>
            <div className="p-price">
              <span className="p-rs">₹</span>
              <span className="p-amt">{plan.price}</span>
            </div>
            <div className="p-mo">per month + GST</div>
            <hr className="p-hr"/>
            <ul className="p-list">
              {plan.feats.map(f=>(
                <li key={f.t} className={f.b?"hi":""}>{f.t}</li>
              ))}
            </ul>
            <a href="/signup" className={"p-btn "+plan.cs}>{plan.cta}</a>
          </div>
        ))}
      </div>
      <p className="p-foot">All plans include a <strong style={{color:"var(--tx)"}}>14-day free trial</strong> · No credit card · Cancel anytime</p>
    </div>
  </section>

  {/* ── TESTIMONIALS ────────────────────────── */}
  <section className="sec" style={{background:"var(--bg2)"}}>
    <div className="wrap">
      <div className="fade" style={{textAlign:"center"}}>
        <div className="sec-label" style={{justifyContent:"center"}}>Results</div>
        <h2 className="sec-h">Real results from<br/>real businesses</h2>
      </div>
      <div className="t-grid">
        {[
          {i:"P",g:"#f59e0b,#ef4444",n:"Priya Sharma",      b:"Glow Beauty Parlour, Hyderabad", r:"+40% bookings in month 1",       t:"Before Fastrill I was losing bookings at night because nobody replied. Now I wake up to confirmed bookings every morning. It paid for itself in week one."},
          {i:"R",g:"#3b82f6,#0ea5e9",n:"Dr. Ravi Kumar",    b:"Apollo Skin Clinic, Vijayawada",  r:"Saved ₹18,000/month on staff",   t:"My patients message in Telugu and the AI replies perfectly in Telugu. Books appointments, answers questions, follows up. I had to see it to believe it."},
          {i:"S",g:"#2ea043,#0ea5e9",n:"Sneha Reddy",       b:"Studio S — 3 branches, Bangalore",r:"Replaced 2 receptionist shifts", t:"3 branches, all WhatsApp managed simultaneously by Fastrill. Our staff now focuses on in-person customers, not their phones all day."},
          {i:"A",g:"#a855f7,#6366f1",n:"Arjun Mehta",       b:"FitLife Gym, Mumbai",             r:"320 new members via WhatsApp",   t:"I used to spend 3 hours a day on membership inquiries. Fastrill qualifies leads, explains packages, and books demos. Completely hands-off."},
          {i:"N",g:"#f59e0b,#10b981",n:"Nandini Iyer",      b:"Ayur Wellness, Chennai",          r:"60% fewer cancellations",        t:"Clients ask in Tamil, AI responds in Tamil. It follows up 1 hour before every appointment. Cancellations dropped dramatically in the first month."},
          {i:"V",g:"#10b981,#0ea5e9",n:"Vikram Nair",       b:"Pixel Agency, Kochi",             r:"4x faster lead qualification",   t:"We qualify discovery call leads with Fastrill. It asks the right questions, gets budget and timeline, books calls with serious prospects only."},
        ].map(t=>(
          <div key={t.n} className="tc fade">
            <div className="tc-badge">📈 {t.r}</div>
            <div className="tc-stars">★★★★★</div>
            <p className="tc-txt">"{t.t}"</p>
            <div className="tc-auth">
              <div className="tc-av" style={{background:`linear-gradient(135deg,${t.g})`}}>{t.i}</div>
              <div><div className="tc-nm">{t.n}</div><div className="tc-bz">{t.b}</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* ── FAQ ─────────────────────────────────── */}
  <section className="sec" id="faq" style={{background:"var(--bg)"}}>
    <div className="wrap">
      <div className="fade" style={{textAlign:"center"}}>
        <div className="sec-label" style={{justifyContent:"center"}}>FAQ</div>
        <h2 className="sec-h">Honest answers</h2>
      </div>
      <div className="faq-box">
        {FAQS.map((q,i)=>(
          <div key={i} className={"fi"+(faq===i?" op":"")}>
            <button className="fb" onClick={()=>setFaq(faq===i?null:i)}>
              {q.q}<span className="fp">+</span>
            </button>
            <div className="fa">{q.a}</div>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* ── CTA ──────────────────────────────────────────────────────────────────────────────────────────────────────  */}
  <section className="cta-sec">
    <div className="wrap">
      <div className="cta-card fade">
        <h2>Your next customer is<br/>messaging you <em>right now</em></h2>
        <p>Don't make them wait. Don't lose them to a competitor who replies faster.<br/>Fastrill answers in 2 seconds — in their language, every time.</p>
        <div className="cta-btns">
          <a href="/signup" className="btn-green">Start Free Trial — No Card Needed →</a>
          <a href="https://wa.me/919346079265" className="btn-outline">💬 Chat on WhatsApp</a>
        </div>
        <p className="cta-note">14-day free trial · Setup in 10 minutes · Cancel anytime · No credit card required</p>
      </div>
    </div>
  </section>

  {/* ── FOOTER ──────────────────────────────── */}
  <footer>
    <div className="ft">
      <div className="ft-top">
        <div className="ft-brand">
          <a href="/" className="logo">fast<span>rill</span></a>
          <p className="ft-about">WhatsApp AI growth engine for Indian businesses. Turns every message into a conversion — in any language, 24/7.</p>
        </div>
        {[
          {h:"Product",lks:[["Features","#features"],["Pricing","#pricing"],["Demo","#demo"],["How it works","#how"]]},
          {h:"Company",lks:[["About","/about"],["Blog","/blog"],["Contact","/contact"]]},
          {h:"Legal",  lks:[["Privacy","/privacy"],["Terms","/terms"],["Refund","/refund"]]},
        ].map(col=>(
          <div key={col.h}>
            <div className="ft-col-h">{col.h}</div>
            <ul className="ft-lks">
              {col.lks.map(([n,h])=><li key={n}><a href={h}>{n}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="ft-bot">
        <span>© 2026 Fastrill Technologies Pvt. Ltd. All rights reserved.</span>
        <span>Made with ❤️ in India 🇮🇳</span>
      </div>
    </div>
  </footer>
  </>)
}
