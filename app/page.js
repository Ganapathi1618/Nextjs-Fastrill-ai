"use client"
import { useEffect, useRef, useState } from "react"

const convos = {
  booking: [
    { t:"customer", m:"Hi, I want to book a facial 😊" },
    { t:"ai",       m:"Great choice! 📅 What date works for your Facial session?" },
    { t:"customer", m:"Tomorrow evening" },
    { t:"ai",       m:"Tomorrow is Saturday, 21 March! What time — 5 PM, 6 PM, or 7 PM?" },
    { t:"customer", m:"6pm please" },
    { t:"ai",       m:"Shall I confirm *Facial* on *Sat, 21 Mar* at *6:00 PM*? ✅" },
    { t:"customer", m:"Yes!" },
    { t:"ai",       m:"✅ Booking Confirmed!\n\n📋 Facial\n📅 Saturday, 21 March\n⏰ 6:00 PM\n\nSee you soon! 😊" },
  ],
  unknown: [
    { t:"customer", m:"Do you do hair straightening?" },
    { t:"ai",       m:"We don't offer that 😊 But here's what we have:\n\n• Hair Spa — ₹800\n• Cleanup — ₹500\n• Facial — ₹1,200\n\nWant to book one?" },
    { t:"customer", m:"Ok hair spa then!" },
    { t:"ai",       m:"Perfect! 📅 What date works for your Hair Spa?" },
  ],
  hindi: [
    { t:"customer", m:"Namaste! Kal ka appointment mil sakta hai?" },
    { t:"ai",       m:"Namaste! 😊 Bilkul. Kal kaunsi service chahiye?" },
    { t:"customer", m:"Facial chahiye" },
    { t:"ai",       m:"Kal Saturday 21 Mar — kaunsa time suit karega?" },
    { t:"customer", m:"Shaam ko 5 baje" },
    { t:"ai",       m:"Confirm karu — *Facial* Sat 21 Mar at *5 PM*? ✅" },
    { t:"customer", m:"Haan theek hai!" },
    { t:"ai",       m:"✅ Booking ho gayi!\n📋 Facial\n📅 Saturday, 21 March\n⏰ 5:00 PM\n\nGlow Salon mein milte hain! 😊" },
  ],
  reschedule: [
    { t:"customer", m:"I need to reschedule my appointment" },
    { t:"ai",       m:"Of course! 😊 What new date works for you?" },
    { t:"customer", m:"Next Monday" },
    { t:"ai",       m:"Monday, 23 March — what time?" },
    { t:"customer", m:"3pm" },
    { t:"ai",       m:"✅ Rescheduled!\n📋 Hair Spa\n📅 Monday, 23 March\n⏰ 3:00 PM\n\nSee you soon! 😊" },
  ],
}

const featureData = [
  { icon:"📅", title:"Smart Appointment Booking", desc:"Customers message naturally — 'I want a facial tomorrow at 6pm' — and Fastrill handles the entire flow. Collects service, confirms date, checks availability, books automatically.", tag:"Core" },
  { icon:"🧠", title:"Customer Memory", desc:"Remembers every customer — preferred services, favorite time windows, language, booking history. Every return visit feels personalized.", tag:"Personalization" },
  { icon:"💬", title:"10+ Indian Languages", desc:"Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, English — auto-detected and replied in. No setup needed.", tag:"Multilingual" },
  { icon:"🎯", title:"Lead Recovery", desc:"When a customer starts booking but drops mid-flow, Fastrill follows up automatically at the right time with the right message.", tag:"Revenue" },
  { icon:"😤", title:"Emotion Detection", desc:"Detects when a customer is frustrated or angry and adapts immediately. Empathy first, solution second. Escalates to you when needed.", tag:"AI v2" },
  { icon:"🔄", title:"Handles Interruptions", desc:"Customer asks a price question mid-booking? AI answers it and returns to the booking flow — no context lost.", tag:"AI v2" },
  { icon:"👤", title:"Human Handoff", desc:"Knows when to stop — refund disputes, complex complaints. Pauses, notifies you with full context, waits for you.", tag:"Smart" },
  { icon:"📊", title:"Analytics Dashboard", desc:"All conversations, bookings, leads, and campaigns in one beautiful dashboard. Track AI performance and revenue.", tag:"Dashboard" },
]

const faqs = [
  { q:"Do I need to change my WhatsApp number?", a:"No. You keep your existing WhatsApp Business number. Fastrill connects through Meta's official Business API. Same number — now with AI." },
  { q:"Which languages does the AI support?", a:"Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, and English — auto-detected, no setup needed." },
  { q:"Can I take over from the AI and reply manually?", a:"Yes, always. In your dashboard, toggle AI off for any conversation and reply yourself. You are always in control." },
  { q:"How long does setup take?", a:"About 10 minutes. Connect WhatsApp, add your services and working hours, go live. No developer or technical knowledge required." },
  { q:"What if the AI doesn't know the answer?", a:"It tells the customer it will check and connect them with the team. You get notified. It never invents answers on pricing or policy." },
  { q:"Is there a free trial?", a:"Yes — 14 days free, no credit card required. Full access to all Growth plan features. Love it or pay nothing." },
]

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0)
  const [activeConvo, setActiveConvo]     = useState("booking")
  const [messages, setMessages]           = useState([])
  const [openFaq, setOpenFaq]             = useState(null)
  const [mobileNav, setMobileNav]         = useState(false)
  const convoRef = useRef(null)

  useEffect(() => {
    setMessages([])
    const msgs = convos[activeConvo]
    msgs.forEach((msg, i) => {
      setTimeout(() => {
        setMessages(prev => [...prev, msg])
        if (convoRef.current) convoRef.current.scrollTop = convoRef.current.scrollHeight
      }, i * 420)
    })
  }, [activeConvo])

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target) } })
    }, { threshold: 0.08, rootMargin: "0px 0px -30px 0px" })
    document.querySelectorAll(".reveal").forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const f = featureData[activeFeature]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600;1,700&family=Outfit:wght@300;400;500;600;700&display=swap');
        :root {
          --cream:#faf8f4; --cream2:#f4f1eb; --cream3:#ede9e0;
          --navy:#0f1523; --navy2:#1a2235; --navy3:#243048;
          --green:#00a86b; --green2:#00d084;
          --gbg:rgba(0,168,107,0.08); --gbd:rgba(0,168,107,0.2);
          --text:#1a1a2e; --muted:#6b7280; --faint:#9ca3af;
          --border:#e5e0d8; --border2:#d1ccc2;
          --sh-sm:0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04);
          --sh-md:0 4px 24px rgba(0,0,0,0.08),0 2px 8px rgba(0,0,0,0.04);
          --sh-lg:0 20px 60px rgba(0,0,0,0.12),0 8px 24px rgba(0,0,0,0.06);
          --sh-xl:0 40px 100px rgba(0,0,0,0.16);
        }
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        body{background:#fff;color:var(--text);font-family:'Outfit',sans-serif;font-size:16px;line-height:1.6;overflow-x:hidden;}
        h1,h2,h3{font-family:'Playfair Display',serif;line-height:1.1;letter-spacing:-0.01em;}

        /* NAV */
        .nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:0 48px;height:68px;display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.92);backdrop-filter:blur(24px);border-bottom:1px solid var(--border);}
        .logo{font-family:'Outfit',sans-serif;font-weight:700;font-size:22px;color:var(--text);text-decoration:none;letter-spacing:-0.5px;}
        .logo span{color:var(--green);}
        .nav-links{display:flex;align-items:center;gap:32px;list-style:none;}
        .nav-links a{color:var(--muted);text-decoration:none;font-size:14.5px;font-weight:500;transition:color .2s;}
        .nav-links a:hover{color:var(--text);}
        .nav-cta{background:var(--navy)!important;color:#fff!important;padding:10px 24px;border-radius:8px;font-weight:600!important;}
        .hamburger{display:none;background:none;border:1.5px solid var(--border2);border-radius:8px;padding:7px 10px;cursor:pointer;font-size:16px;color:var(--navy);}

        /* HERO */
        .hero{padding:140px 48px 100px;background:var(--cream);position:relative;overflow:hidden;}
        .hero::before{content:'';position:absolute;top:-100px;right:-100px;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(0,168,107,0.06) 0%,transparent 70%);pointer-events:none;}
        .hero-inner{max-width:1160px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;position:relative;z-index:1;}
        .hero-badge{display:inline-flex;align-items:center;gap:8px;background:var(--gbg);border:1px solid var(--gbd);border-radius:100px;padding:6px 16px;font-size:13px;font-weight:600;color:var(--green);margin-bottom:28px;}
        .hero-badge::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--green);animation:blink 2s ease infinite;}
        @keyframes blink{0%,100%{opacity:1;}50%{opacity:.3;}}
        .hero h1{font-size:clamp(40px,5vw,66px);font-weight:800;color:var(--navy);margin-bottom:24px;}
        .hero h1 em{font-style:italic;color:var(--green);}
        .hero-sub{font-size:18px;color:var(--muted);line-height:1.7;font-weight:400;margin-bottom:40px;max-width:480px;}
        .hero-actions{display:flex;align-items:center;gap:16px;margin-bottom:40px;flex-wrap:wrap;}
        .btn-primary{display:inline-flex;align-items:center;gap:8px;background:var(--navy);color:#fff;padding:14px 32px;border-radius:10px;font-weight:600;font-size:15px;text-decoration:none;transition:all .2s;box-shadow:0 4px 20px rgba(15,21,35,.25);}
        .btn-primary:hover{background:var(--navy2);transform:translateY(-2px);}
        .btn-ghost{display:inline-flex;align-items:center;gap:8px;background:transparent;color:var(--text);padding:14px 28px;border-radius:10px;font-weight:500;font-size:15px;text-decoration:none;border:1.5px solid var(--border2);transition:all .2s;}
        .btn-ghost:hover{border-color:var(--green);color:var(--green);}
        .hero-trust{display:flex;align-items:center;gap:24px;padding-top:24px;border-top:1px solid var(--border);flex-wrap:wrap;}
        .trust-item{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--muted);font-weight:500;}
        .trust-check{width:18px;height:18px;border-radius:50%;background:var(--gbg);border:1px solid var(--gbd);display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--green);flex-shrink:0;}

        /* PHONE */
        .hero-visual{display:flex;justify-content:center;position:relative;}
        .hero-visual::before{content:'';position:absolute;top:-20px;right:-20px;width:120px;height:120px;background-image:radial-gradient(circle,var(--border2) 1.5px,transparent 1.5px);background-size:14px 14px;opacity:.6;}
        .phone-wrap{position:relative;display:inline-block;}
        .phone-shadow{position:absolute;bottom:-30px;left:50%;transform:translateX(-50%);width:200px;height:40px;background:radial-gradient(ellipse,rgba(0,0,0,.15) 0%,transparent 70%);filter:blur(10px);}
        .phone{width:290px;background:#1c1c1e;border-radius:44px;padding:14px;box-shadow:var(--sh-xl),0 0 0 1px rgba(255,255,255,.05) inset;position:relative;}
        .phone::before{content:'';position:absolute;top:14px;left:50%;transform:translateX(-50%);width:90px;height:26px;background:#1c1c1e;border-radius:0 0 16px 16px;z-index:10;}
        .phone-screen{background:#111b21;border-radius:32px;overflow:hidden;}
        .wa-header{background:#1f2c34;padding:38px 14px 12px;display:flex;align-items:center;gap:10px;}
        .wa-avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--green2),#0ea5e9);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:#000;flex-shrink:0;}
        .wa-name{font-size:13px;font-weight:600;color:#e9edef;}
        .wa-status{font-size:10.5px;color:var(--green2);}
        .wa-msgs{background:#0b141a;padding:10px 8px;display:flex;flex-direction:column;gap:6px;min-height:340px;}
        .wa-msg{max-width:82%;padding:7px 10px;border-radius:7px;font-size:11.5px;line-height:1.45;color:#e9edef;animation:msgIn .35s ease both;}
        .wa-msg.out{background:#005c4b;align-self:flex-end;border-radius:7px 2px 7px 7px;}
        .wa-msg.bot{background:linear-gradient(135deg,#0a2a1f,#0d3525);border:1px solid rgba(0,168,107,.25);align-self:flex-start;border-radius:2px 7px 7px 7px;}
        .bot-lbl{font-size:9.5px;color:var(--green2);font-weight:700;margin-bottom:2px;display:block;}
        @keyframes msgIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}

        /* FLOAT CARDS */
        .float-card{position:absolute;background:#fff;border:1px solid var(--border);border-radius:14px;padding:12px 16px;box-shadow:var(--sh-md);display:flex;align-items:center;gap:10px;white-space:nowrap;}
        .fc1{top:60px;right:-80px;animation:float 3s ease-in-out infinite;}
        .fc2{bottom:100px;left:-90px;animation:float 3s ease-in-out 1.5s infinite;}
        @keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}
        .float-icon{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}
        .fi-green{background:var(--gbg);}
        .fi-blue{background:rgba(59,130,246,.1);}
        .float-num{font-size:17px;font-weight:700;color:var(--text);line-height:1;}
        .float-lbl{font-size:11px;color:var(--muted);margin-top:1px;}

        /* LOGOS */
        .logos-strip{padding:36px 0;border-bottom:1px solid var(--border);}
        .logos-inner{max-width:1160px;margin:0 auto;padding:0 48px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;}
        .logos-lbl{font-size:13px;color:var(--faint);font-weight:500;white-space:nowrap;}
        .logos-div{width:1px;height:24px;background:var(--border);flex-shrink:0;}
        .logos-row{display:flex;align-items:center;gap:28px;flex-wrap:wrap;}
        .biz-pill{display:flex;align-items:center;gap:7px;font-size:13.5px;font-weight:600;color:var(--muted);}

        /* STATS */
        .stats-section{padding:72px 0;background:var(--navy);}
        .stats-grid{max-width:1160px;margin:0 auto;padding:0 48px;display:grid;grid-template-columns:repeat(4,1fr);gap:0;}
        .stat-item{text-align:center;padding:0 32px;border-right:1px solid rgba(255,255,255,.1);}
        .stat-item:last-child{border-right:none;}
        .stat-num{font-family:'Playfair Display',serif;font-size:52px;font-weight:700;color:#fff;line-height:1;margin-bottom:8px;}
        .stat-acc{color:var(--green2);}
        .stat-lbl{font-size:14px;color:rgba(255,255,255,.5);line-height:1.4;}

        /* CONTAINER */
        .container{max-width:1160px;margin:0 auto;padding:0 48px;}

        /* EYEBROW */
        .eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--green);margin-bottom:16px;}
        .eyebrow::before{content:'';width:20px;height:2px;background:var(--green);border-radius:1px;}
        .section-h{font-size:clamp(32px,4vw,52px);font-weight:700;color:var(--navy);margin-bottom:20px;}
        .section-p{font-size:17px;color:var(--muted);line-height:1.7;}

        /* HOW */
        .how-section{padding:120px 0;background:var(--cream);}
        .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:36px;margin-top:72px;position:relative;}
        .steps::before{content:'';position:absolute;top:50px;left:calc(16.66% + 24px);right:calc(16.66% + 24px);height:1px;background:linear-gradient(90deg,var(--green),rgba(0,168,107,.2),var(--green));}
        .step{background:#fff;border:1px solid var(--border);border-radius:20px;padding:40px 32px;position:relative;z-index:1;transition:all .25s;box-shadow:var(--sh-sm);}
        .step:hover{transform:translateY(-6px);box-shadow:var(--sh-lg);border-color:var(--gbd);}
        .step-num{width:50px;height:50px;border-radius:14px;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;font-family:'Outfit',sans-serif;margin-bottom:24px;}
        .step h3{font-size:20px;font-weight:700;color:var(--navy);margin-bottom:12px;}
        .step p{font-size:14.5px;color:var(--muted);line-height:1.7;}

        /* FEATURES */
        .features-section{padding:120px 0;background:#fff;}
        .features-layout{display:grid;grid-template-columns:1fr 1fr;gap:64px;margin-top:72px;align-items:start;}
        .features-list{border:1px solid var(--border);border-radius:20px;overflow:hidden;}
        .feature-row{padding:20px 24px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .15s;display:flex;align-items:flex-start;gap:14px;}
        .feature-row:last-child{border-bottom:none;}
        .feature-row:hover,.feature-row.active{background:var(--cream);}
        .feature-row.active{border-left:3px solid var(--green);}
        .fr-icon{width:38px;height:38px;border-radius:10px;background:var(--gbg);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;margin-top:2px;}
        .fr-title{font-size:14.5px;font-weight:600;color:var(--navy);margin-bottom:3px;}
        .fr-desc{font-size:13px;color:var(--muted);line-height:1.55;}
        .feature-detail{background:var(--cream);border:1px solid var(--border);border-radius:20px;padding:40px;position:sticky;top:90px;min-height:300px;}
        .fd-icon{font-size:44px;margin-bottom:18px;}
        .fd-title{font-size:26px;font-weight:700;color:var(--navy);margin-bottom:14px;}
        .fd-desc{font-size:15px;color:var(--muted);line-height:1.75;}
        .fd-tag{display:inline-block;margin-top:20px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--green);background:var(--gbg);border:1px solid var(--gbd);padding:4px 12px;border-radius:6px;}

        /* DEMO */
        .demo-section{padding:120px 0;background:var(--cream);}
        .demo-grid{display:grid;grid-template-columns:1fr 1fr;gap:56px;margin-top:72px;align-items:start;}
        .scenario-list{display:flex;flex-direction:column;gap:12px;}
        .scenario{background:#fff;border:1.5px solid var(--border);border-radius:14px;padding:18px 20px;cursor:pointer;transition:all .2s;}
        .scenario.active{border-color:var(--green);box-shadow:0 0 0 3px var(--gbg);}
        .scenario:hover:not(.active){border-color:var(--border2);box-shadow:var(--sh-sm);}
        .sc-title{font-size:14.5px;font-weight:600;color:var(--navy);margin-bottom:4px;}
        .sc-desc{font-size:13px;color:var(--muted);}
        .chat-window{background:#0b141a;border-radius:20px;overflow:hidden;box-shadow:var(--sh-xl);}
        .cw-header{background:#1f2c34;padding:16px 20px;display:flex;align-items:center;gap:12px;}
        .cw-msgs{padding:16px;min-height:360px;display:flex;flex-direction:column;gap:10px;overflow-y:auto;}
        .cw-msg{max-width:78%;padding:9px 14px;border-radius:10px;font-size:13px;line-height:1.55;}
        .cw-msg.customer{background:#005c4b;color:#e9edef;align-self:flex-end;border-radius:10px 2px 10px 10px;animation:msgIn .3s ease both;}
        .cw-msg.ai{background:#1a2a22;border:1px solid rgba(0,168,107,.2);color:#e9edef;align-self:flex-start;border-radius:2px 10px 10px 10px;animation:msgIn .3s ease both;}
        .cw-ai-label{font-size:10px;color:var(--green2);font-weight:700;margin-bottom:3px;display:block;}

        /* FOR WHO */
        .forwho-section{padding:120px 0;background:#fff;}
        .biz-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:72px;}
        .biz-card{background:var(--cream);border:1px solid var(--border);border-radius:18px;padding:28px 22px;text-align:center;transition:all .25s;}
        .biz-card:hover{background:#fff;border-color:var(--gbd);transform:translateY(-4px);box-shadow:var(--sh-md);}
        .biz-emoji{font-size:32px;margin-bottom:12px;display:block;}
        .biz-name{font-size:15px;font-weight:600;color:var(--navy);margin-bottom:6px;}
        .biz-desc{font-size:13px;color:var(--muted);line-height:1.5;}

        /* VS */
        .vs-section{padding:120px 0;background:var(--navy);position:relative;overflow:hidden;}
        .vs-section::before{content:'';position:absolute;top:-200px;right:-200px;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(0,208,132,.06) 0%,transparent 70%);}
        .vs-grid{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;margin-top:64px;}
        .vs-eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--green2);margin-bottom:16px;}
        .vs-eyebrow::before{content:'';width:20px;height:2px;background:var(--green2);border-radius:1px;}
        .vs-h{font-size:clamp(30px,3.5vw,48px);font-weight:700;color:#fff;margin-bottom:16px;}
        .vs-p{font-size:16px;color:rgba(255,255,255,.55);line-height:1.7;}
        .vs-points{display:flex;flex-direction:column;gap:14px;margin-top:28px;}
        .vs-point{display:flex;align-items:flex-start;gap:12px;font-size:14.5px;color:rgba(255,255,255,.75);line-height:1.6;}
        .vs-check{width:22px;height:22px;border-radius:50%;background:rgba(0,208,132,.15);border:1px solid rgba(0,208,132,.3);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--green2);flex-shrink:0;margin-top:2px;}
        .vs-table{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:20px;overflow:hidden;}
        .vs-thead{display:grid;grid-template-columns:1fr 1fr;background:rgba(255,255,255,.06);}
        .vs-th{padding:16px 24px;font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;}
        .vs-th.them{color:rgba(255,255,255,.4);border-right:1px solid rgba(255,255,255,.1);}
        .vs-th.us{color:var(--green2);}
        .vs-row{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid rgba(255,255,255,.08);}
        .vs-cell{padding:13px 24px;font-size:13.5px;display:flex;align-items:center;gap:8px;}
        .vs-cell.them{color:rgba(255,255,255,.4);border-right:1px solid rgba(255,255,255,.08);}
        .vs-cell.them::before{content:'✕';color:#f87171;font-size:11px;}
        .vs-cell.us{color:rgba(255,255,255,.85);font-weight:500;}
        .vs-cell.us::before{content:'✓';color:var(--green2);font-size:11px;}

        /* PRICING */
        .pricing-section{padding:120px 0;background:var(--cream);}
        .pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:72px;}
        .plan{background:#fff;border:1.5px solid var(--border);border-radius:24px;padding:40px 36px;position:relative;transition:all .25s;box-shadow:var(--sh-sm);}
        .plan:hover{transform:translateY(-6px);box-shadow:var(--sh-lg);}
        .plan.featured{border-color:var(--green);background:var(--navy);box-shadow:var(--sh-xl);transform:scale(1.03);}
        .plan.featured:hover{transform:scale(1.03) translateY(-6px);}
        .plan-ribbon{position:absolute;top:-1px;left:50%;transform:translateX(-50%);background:var(--green);color:#fff;font-size:11px;font-weight:700;padding:5px 18px;border-radius:0 0 12px 12px;white-space:nowrap;}
        .plan-tier{font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:20px;}
        .plan.featured .plan-tier{color:rgba(255,255,255,.5);}
        .plan-price{display:flex;align-items:baseline;gap:2px;margin-bottom:6px;}
        .plan-currency{font-size:22px;font-weight:600;color:var(--navy);margin-top:8px;}
        .plan.featured .plan-currency{color:rgba(255,255,255,.6);}
        .plan-amount{font-family:'Playfair Display',serif;font-size:56px;font-weight:700;color:var(--navy);line-height:1;letter-spacing:-2px;}
        .plan.featured .plan-amount{color:#fff;}
        .plan-period{font-size:13px;color:var(--muted);margin-bottom:28px;}
        .plan.featured .plan-period{color:rgba(255,255,255,.5);}
        .plan-divider{border:none;border-top:1px solid var(--border);margin:24px 0;}
        .plan.featured .plan-divider{border-color:rgba(255,255,255,.1);}
        .plan-features{list-style:none;display:flex;flex-direction:column;gap:11px;margin-bottom:32px;}
        .plan-features li{display:flex;align-items:flex-start;gap:9px;font-size:14px;color:var(--muted);line-height:1.5;}
        .plan.featured .plan-features li{color:rgba(255,255,255,.7);}
        .plan-features li::before{content:'✓';color:var(--green);font-size:12px;margin-top:2px;flex-shrink:0;font-weight:700;}
        .plan-features li.bold{color:var(--text);font-weight:600;}
        .plan.featured .plan-features li.bold{color:#fff;}
        .plan-cta{display:block;text-align:center;padding:14px;border-radius:12px;font-weight:600;font-size:15px;text-decoration:none;transition:all .2s;font-family:'Outfit',sans-serif;}
        .plan-cta.dark{background:var(--navy);color:#fff;}
        .plan-cta.dark:hover{background:var(--navy2);}
        .plan-cta.green-btn{background:var(--green);color:#fff;box-shadow:0 4px 20px rgba(0,168,107,.4);}
        .plan-cta.green-btn:hover{background:#00c07a;}
        .plan-cta.outline{background:transparent;color:var(--navy);border:1.5px solid var(--border2);}
        .plan-cta.outline:hover{border-color:var(--green);color:var(--green);}

        /* TESTIMONIALS */
        .t-section{padding:120px 0;background:#fff;}
        .t-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:72px;}
        .t-card{background:var(--cream);border:1px solid var(--border);border-radius:20px;padding:32px;transition:all .2s;}
        .t-card:hover{background:#fff;box-shadow:var(--sh-md);transform:translateY(-3px);}
        .t-stars{color:#f59e0b;font-size:16px;letter-spacing:2px;margin-bottom:16px;}
        .t-text{font-size:14.5px;color:var(--muted);line-height:1.75;margin-bottom:24px;font-style:italic;}
        .t-author{display:flex;align-items:center;gap:12px;}
        .t-avatar{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;color:#fff;flex-shrink:0;}
        .t-name{font-size:14px;font-weight:600;color:var(--navy);}
        .t-biz{font-size:12.5px;color:var(--muted);}

        /* FAQ */
        .faq-section{padding:120px 0;background:var(--cream);}
        .faq-wrap{max-width:720px;margin:72px auto 0;border:1px solid var(--border);border-radius:20px;overflow:hidden;background:#fff;box-shadow:var(--sh-sm);}
        .faq-item{border-bottom:1px solid var(--border);}
        .faq-item:last-child{border-bottom:none;}
        .faq-btn{width:100%;background:none;border:none;padding:22px 28px;text-align:left;font-size:15.5px;font-weight:600;color:var(--navy);cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:16px;font-family:'Outfit',sans-serif;transition:background .15s;}
        .faq-btn:hover{background:var(--cream);}
        .faq-plus{width:28px;height:28px;border-radius:50%;background:var(--cream2);display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--navy);flex-shrink:0;transition:all .2s;line-height:1;}
        .faq-answer{padding:0 28px;font-size:14.5px;color:var(--muted);line-height:1.75;max-height:0;overflow:hidden;transition:max-height .3s ease,padding .3s ease;}
        .faq-item.open .faq-answer{max-height:200px;padding:0 28px 24px;}
        .faq-item.open .faq-plus{background:var(--gbg);color:var(--green);transform:rotate(45deg);}

        /* CTA */
        .cta-section{padding:120px 0;background:var(--navy);text-align:center;position:relative;overflow:hidden;}
        .cta-section::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:800px;height:400px;background:radial-gradient(ellipse,rgba(0,208,132,.08) 0%,transparent 70%);}
        .cta-section h2{font-size:clamp(34px,5vw,62px);color:#fff;margin-bottom:20px;position:relative;}
        .cta-section p{font-size:18px;color:rgba(255,255,255,.55);margin-bottom:40px;font-weight:300;position:relative;}
        .cta-btns{display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;position:relative;}
        .cta-primary{display:inline-flex;align-items:center;gap:8px;background:var(--green);color:#fff;padding:16px 40px;border-radius:12px;font-weight:600;font-size:16px;text-decoration:none;transition:all .2s;box-shadow:0 4px 24px rgba(0,168,107,.4);}
        .cta-primary:hover{background:#00c07a;transform:translateY(-2px);}
        .cta-ghost-btn{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.08);color:#fff;padding:16px 32px;border-radius:12px;font-weight:500;font-size:15px;text-decoration:none;border:1px solid rgba(255,255,255,.15);transition:all .2s;}
        .cta-ghost-btn:hover{background:rgba(255,255,255,.12);}
        .cta-note{margin-top:20px;font-size:13px;color:rgba(255,255,255,.35);position:relative;}

        /* FOOTER */
        footer{background:var(--navy2);border-top:1px solid rgba(255,255,255,.08);padding:64px 48px 40px;}
        .footer-inner{max-width:1160px;margin:0 auto;}
        .footer-top{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px;margin-bottom:48px;}
        .footer-logo .logo{color:#fff;}
        .footer-about{font-size:14px;color:rgba(255,255,255,.45);line-height:1.7;margin-top:14px;max-width:280px;}
        .footer-col-title{font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.35);margin-bottom:16px;}
        .footer-links{list-style:none;display:flex;flex-direction:column;gap:10px;}
        .footer-links a{font-size:14px;color:rgba(255,255,255,.55);text-decoration:none;transition:color .2s;}
        .footer-links a:hover{color:var(--green2);}
        .footer-bottom{padding-top:28px;border-top:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;align-items:center;font-size:13px;color:rgba(255,255,255,.3);}

        /* REVEAL */
        .reveal{opacity:0;transform:translateY(28px);transition:opacity .65s ease,transform .65s ease;}
        .reveal.visible{opacity:1;transform:none;}

        /* RESPONSIVE */
        @media(max-width:1024px){
          .hero-inner{grid-template-columns:1fr;text-align:center;}
          .hero-actions{justify-content:center;}
          .hero-trust{justify-content:center;}
          .hero-sub{margin:0 auto 40px;}
          .hero-visual{display:none;}
          .features-layout{grid-template-columns:1fr;}
          .demo-grid{grid-template-columns:1fr;}
          .vs-grid{grid-template-columns:1fr;}
          .footer-top{grid-template-columns:1fr 1fr;}
        }
        @media(max-width:768px){
          .nav{padding:0 20px;}
          .nav-links{display:none;}
          .hamburger{display:flex;}
          .hero{padding:100px 20px 60px;}
          .container{padding:0 20px;}
          .logos-inner{padding:0 20px;}
          .stats-grid{grid-template-columns:repeat(2,1fr);padding:0 20px;}
          .stat-item{border-right:none;border-bottom:1px solid rgba(255,255,255,.1);padding:20px;}
          .steps{grid-template-columns:1fr;}
          .steps::before{display:none;}
          .biz-grid{grid-template-columns:repeat(2,1fr);}
          .pricing-grid{grid-template-columns:1fr;}
          .plan.featured{transform:none;}
          .t-grid{grid-template-columns:1fr;}
          .footer-top{grid-template-columns:1fr;}
          .footer-bottom{flex-direction:column;gap:8px;text-align:center;}
          footer{padding:48px 20px 32px;}
        }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <a href="/" className="logo">fast<span>rill</span></a>
        <ul className="nav-links">
          <li><a href="#how">How it works</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#faq">FAQ</a></li>
          <li><a href="/signup" className="nav-cta">Start Free →</a></li>
        </ul>
        <button className="hamburger" onClick={() => setMobileNav(!mobileNav)}>☰</button>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="hero-badge">🇮🇳 Built for Indian Service Businesses</div>
            <h1>Your WhatsApp<br/><em>Books Appointments</em><br/>While You Sleep</h1>
            <p className="hero-sub">Fastrill is an AI receptionist that lives on your WhatsApp. Books appointments, follows up on leads, answers questions — in Hindi, Telugu, Tamil, and 7 more languages. 24/7.</p>
            <div className="hero-actions">
              <a href="/signup" className="btn-primary">Start Free Trial →</a>
              <a href="#how" className="btn-ghost">How it works ↓</a>
            </div>
            <div className="hero-trust">
              <div className="trust-item"><div className="trust-check">✓</div>No app needed</div>
              <div className="trust-item"><div className="trust-check">✓</div>Setup in 10 min</div>
              <div className="trust-item"><div className="trust-check">✓</div>14-day free trial</div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="phone-wrap">
              <div className="phone-shadow"></div>
              <div className="phone">
                <div className="phone-screen">
                  <div className="wa-header">
                    <div className="wa-avatar">P</div>
                    <div>
                      <div className="wa-name">Priya Beauty Salon</div>
                      <div className="wa-status">◈ AI Active — replies instantly</div>
                    </div>
                  </div>
                  <div className="wa-msgs">
                    <div className="wa-msg out" style={{animationDelay:".1s"}}>Hi, want to book facial 😊</div>
                    <div className="wa-msg bot" style={{animationDelay:".5s"}}><span className="bot-lbl">◈ Fastrill AI</span>Great! 📅 What date works?</div>
                    <div className="wa-msg out" style={{animationDelay:".9s"}}>Tomorrow evening</div>
                    <div className="wa-msg bot" style={{animationDelay:"1.3s"}}><span className="bot-lbl">◈ Fastrill AI</span>Sat 21 Mar! ⏰ What time — 5, 6, or 7 PM?</div>
                    <div className="wa-msg out" style={{animationDelay:"1.7s"}}>6pm</div>
                    <div className="wa-msg bot" style={{animationDelay:"2.1s"}}><span className="bot-lbl">◈ Fastrill AI</span>Confirm *Facial* Sat 21 Mar at *6 PM*? ✅</div>
                    <div className="wa-msg out" style={{animationDelay:"2.5s"}}>Yes! 🙌</div>
                    <div className="wa-msg bot" style={{animationDelay:"2.9s"}}><span className="bot-lbl">◈ Fastrill AI</span>✅ Booked! See you Saturday 6 PM 😊</div>
                  </div>
                </div>
              </div>
              <div className="float-card fc1">
                <div className="float-icon fi-green">📅</div>
                <div><div className="float-num">+47%</div><div className="float-lbl">More bookings</div></div>
              </div>
              <div className="float-card fc2">
                <div className="float-icon fi-blue">⚡</div>
                <div><div className="float-num">&lt;3s</div><div className="float-lbl">Response time</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOGOS */}
      <div className="logos-strip">
        <div className="logos-inner">
          <span className="logos-lbl">Built for</span>
          <div className="logos-div"></div>
          <div className="logos-row">
            {["💈 Salons","🧖 Spas","🏥 Clinics","🦷 Dental","💪 Fitness","💅 Nail Studios","🌿 Ayurveda","💻 Agencies"].map(b => (
              <div key={b} className="biz-pill">{b}</div>
            ))}
          </div>
        </div>
      </div>

      {/* STATS */}
      <section className="stats-section">
        <div className="stats-grid">
          {[
            { num:<><span className="stat-acc">24</span>/7</>, lbl:"AI replies instantly,\neven at 2 AM" },
            { num:<>10<span className="stat-acc">+</span></>, lbl:"Indian languages\nsupported natively" },
            { num:<><span className="stat-acc">0</span></>, lbl:"Missed leads while\nyou're busy or away" },
            { num:<>10<span className="stat-acc">m</span></>, lbl:"Setup time, zero\ntechnical knowledge" },
          ].map((s,i) => (
            <div key={i} className="stat-item reveal">
              <div className="stat-num">{s.num}</div>
              <div className="stat-lbl" style={{whiteSpace:"pre-line"}}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section" id="how">
        <div className="container">
          <div className="reveal">
            <div className="eyebrow">How it works</div>
            <h2 className="section-h">Set it up once.<br/>It works forever.</h2>
            <p className="section-p" style={{maxWidth:480}}>Connect, configure, go live. No developer needed. No complicated training.</p>
          </div>
          <div className="steps">
            {[
              { n:"01", title:"Connect Your WhatsApp", desc:"Link your existing WhatsApp Business number through Meta's official API. One click, fully secure. Your number, your conversations — always." },
              { n:"02", title:"Configure Your Business", desc:"Add services, prices, working hours, and custom instructions. Write in plain language — the AI understands exactly what you mean." },
              { n:"03", title:"Watch It Convert", desc:"Every customer who messages gets an instant, intelligent reply. Bookings happen automatically. Leads get followed up. Revenue grows." },
            ].map(s => (
              <div key={s.n} className="step reveal">
                <div className="step-num">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section" id="features">
        <div className="container">
          <div className="reveal">
            <div className="eyebrow">Features</div>
            <h2 className="section-h">Everything your front desk<br/>does — automated.</h2>
            <p className="section-p" style={{maxWidth:480}}>Not a chatbot with fixed responses. A full AI system that thinks, remembers, and converts.</p>
          </div>
          <div className="features-layout">
            <div className="features-list reveal">
              {featureData.map((fd, i) => (
                <div key={i} className={"feature-row" + (activeFeature===i?" active":"")} onClick={() => setActiveFeature(i)}>
                  <div className="fr-icon">{fd.icon}</div>
                  <div>
                    <div className="fr-title">{fd.title}</div>
                    <div className="fr-desc">{fd.desc.substring(0,60)}...</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="feature-detail reveal">
              <div className="fd-icon">{f.icon}</div>
              <div className="fd-title">{f.title}</div>
              <p className="fd-desc">{f.desc}</p>
              <span className="fd-tag">{f.tag}</span>
            </div>
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section className="demo-section">
        <div className="container">
          <div className="reveal">
            <div className="eyebrow">See it in action</div>
            <h2 className="section-h">Real conversations.<br/><em>Real intelligence.</em></h2>
            <p className="section-p" style={{maxWidth:480}}>Click any scenario to see how Fastrill handles it.</p>
          </div>
          <div className="demo-grid">
            <div className="scenario-list reveal">
              {[
                { key:"booking",    title:"📅 Natural Booking Flow",   desc:"From 'I want a facial' to confirmed in 6 messages" },
                { key:"unknown",    title:"❓ Service Not Offered",     desc:"Customer asks for something you don't do — handled warmly" },
                { key:"hindi",      title:"🇮🇳 Hindi Booking",           desc:"Customer writes Hindi, AI responds in Hindi perfectly" },
                { key:"reschedule", title:"🔄 Reschedule Request",      desc:"Change appointment date with zero friction" },
              ].map(s => (
                <div key={s.key} className={"scenario"+(activeConvo===s.key?" active":"")} onClick={() => setActiveConvo(s.key)}>
                  <div className="sc-title">{s.title}</div>
                  <div className="sc-desc">{s.desc}</div>
                </div>
              ))}
            </div>
            <div className="chat-window reveal">
              <div className="cw-header">
                <div className="wa-avatar" style={{width:32,height:32,fontSize:12}}>G</div>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"#e9edef"}}>Glow Salon</div>
                  <div style={{fontSize:11,color:"#00d084"}}>◈ Fastrill AI Active</div>
                </div>
              </div>
              <div className="cw-msgs" ref={convoRef}>
                {messages.map((msg, i) => (
                  <div key={i} className={"cw-msg "+(msg.t==="customer"?"customer":"ai")}>
                    {msg.t==="ai" && <span className="cw-ai-label">◈ Fastrill AI</span>}
                    {msg.m.split("\n").map((line,j) => <span key={j}>{line}{j<msg.m.split("\n").length-1&&<br/>}</span>)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOR WHO */}
      <section className="forwho-section">
        <div className="container">
          <div className="reveal" style={{textAlign:"center"}}>
            <div className="eyebrow">Built for</div>
            <h2 className="section-h">Every business that runs<br/>on appointments</h2>
            <p className="section-p" style={{maxWidth:520,margin:"0 auto"}}>If your customers book with you and message on WhatsApp, Fastrill works for you.</p>
          </div>
          <div className="biz-grid">
            {[
              { e:"💈", n:"Salons & Parlours",     d:"Book haircuts, facials, and beauty services automatically" },
              { e:"🧖", n:"Spas & Wellness",       d:"Schedule massages, treatments, and wellness sessions" },
              { e:"🏥", n:"Clinics & Doctors",     d:"Manage patient appointments and follow-ups" },
              { e:"🦷", n:"Dental Clinics",        d:"Auto-book checkups and treatment appointments" },
              { e:"💪", n:"Gyms & Fitness",        d:"Book PT sessions, classes, and consultations" },
              { e:"💅", n:"Nail Studios",           d:"Manage nail art, gel, and extension appointments" },
              { e:"🌿", n:"Ayurvedic & Physio",    d:"Schedule consultations and therapy sessions" },
              { e:"💻", n:"Agencies",               d:"Book demos, discovery calls, and kickoffs" },
            ].map(b => (
              <div key={b.n} className="biz-card reveal">
                <span className="biz-emoji">{b.e}</span>
                <div className="biz-name">{b.n}</div>
                <p className="biz-desc">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VS */}
      <section className="vs-section">
        <div className="container">
          <div className="vs-grid">
            <div className="reveal">
              <div className="vs-eyebrow">Why Fastrill</div>
              <h2 className="vs-h">Not just another<br/>WhatsApp bot</h2>
              <p className="vs-p">Most tools give you rigid menus. Fastrill gives you an AI that actually understands your customers.</p>
              <div className="vs-points">
                {["Understands natural language — not just commands","Remembers customers across conversations","Handles any message, not just expected ones","Detects emotion and adapts its tone","Never hallucinates on policies or pricing","Knows when to hand off to a human"].map(p => (
                  <div key={p} className="vs-point"><div className="vs-check">✓</div>{p}</div>
                ))}
              </div>
            </div>
            <div className="vs-table reveal">
              <div className="vs-thead">
                <div className="vs-th them">Other tools</div>
                <div className="vs-th us">Fastrill</div>
              </div>
              {[
                ["Fixed button menus only","Natural conversation"],
                ["English only","10+ Indian languages"],
                ["Breaks on unexpected messages","Handles anything intelligently"],
                ["No customer memory","Remembers every customer"],
                ["No emotion awareness","Adapts to customer mood"],
                ["Per-message pricing","Flat monthly — unlimited"],
                ["Needs developer to setup","10-minute self-setup"],
              ].map(([t,u]) => (
                <div key={t} className="vs-row">
                  <div className="vs-cell them">{t}</div>
                  <div className="vs-cell us">{u}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing-section" id="pricing">
        <div className="container">
          <div className="reveal" style={{textAlign:"center"}}>
            <div className="eyebrow">Pricing</div>
            <h2 className="section-h">Simple, honest pricing</h2>
            <p className="section-p" style={{maxWidth:480,margin:"0 auto"}}>No per-message charges. No hidden fees. One flat monthly price that pays for itself with a single extra booking.</p>
          </div>
          <div className="pricing-grid">
            <div className="plan reveal">
              <div className="plan-tier">Starter</div>
              <div className="plan-price"><span className="plan-currency">₹</span><span className="plan-amount">999</span></div>
              <div className="plan-period">per month + GST</div>
              <hr className="plan-divider"/>
              <ul className="plan-features">
                <li className="bold">1 WhatsApp number</li>
                <li>AI booking automation</li>
                <li>300 conversations/month</li>
                <li>Basic analytics</li>
                <li>Email support</li>
              </ul>
              <a href="/signup" className="plan-cta outline">Get Started</a>
            </div>
            <div className="plan featured reveal">
              <div className="plan-ribbon">Most Popular</div>
              <div className="plan-tier">Growth</div>
              <div className="plan-price"><span className="plan-currency" style={{color:"rgba(255,255,255,.6)"}}>₹</span><span className="plan-amount" style={{color:"#fff"}}>1,999</span></div>
              <div className="plan-period">per month + GST</div>
              <hr className="plan-divider"/>
              <ul className="plan-features">
                <li className="bold">1 WhatsApp number</li>
                <li className="bold">Unlimited conversations</li>
                <li className="bold">Customer memory</li>
                <li className="bold">Lead recovery automation</li>
                <li>WhatsApp campaigns</li>
                <li>Advanced analytics</li>
                <li>Priority support</li>
              </ul>
              <a href="/signup" className="plan-cta green-btn">Start Free Trial →</a>
            </div>
            <div className="plan reveal">
              <div className="plan-tier">Pro</div>
              <div className="plan-price"><span className="plan-currency">₹</span><span className="plan-amount">4,999</span></div>
              <div className="plan-period">per month + GST</div>
              <hr className="plan-divider"/>
              <ul className="plan-features">
                <li className="bold">Up to 3 WhatsApp numbers</li>
                <li className="bold">Everything in Growth</li>
                <li className="bold">Multi-branch management</li>
                <li>Staff availability routing</li>
                <li>Custom AI playbook</li>
                <li>Dedicated onboarding</li>
                <li>SLA-backed support</li>
              </ul>
              <a href="/signup" className="plan-cta dark">Contact Us</a>
            </div>
          </div>
          <p style={{textAlign:"center",marginTop:28,fontSize:14,color:"var(--muted)"}}>
            All plans include a <strong>14-day free trial</strong>. No credit card required.
          </p>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="t-section">
        <div className="container">
          <div className="reveal" style={{textAlign:"center"}}>
            <div className="eyebrow">Testimonials</div>
            <h2 className="section-h">Business owners love Fastrill</h2>
          </div>
          <div className="t-grid">
            {[
              { av:"P", bg:"linear-gradient(135deg,#f59e0b,#ef4444)", name:"Priya Sharma", biz:"Glow Beauty Parlour, Hyderabad", text:"Before Fastrill I was losing bookings at night because I couldn't reply on WhatsApp. Now the AI handles everything. My bookings went up 40% in the first month." },
              { av:"R", bg:"linear-gradient(135deg,#3b82f6,#0ea5e9)", name:"Dr. Ravi Kumar", biz:"Apollo Skin Clinic, Vijayawada", text:"My patients message in Telugu and the AI replies in Telugu perfectly. Books appointments, sends reminders, never makes mistakes. Unbelievable for this price." },
              { av:"S", bg:"linear-gradient(135deg,#00d084,#0ea5e9)", name:"Sneha Reddy", biz:"Studio S Salon, Bangalore", text:"We have 3 branches and managing WhatsApp for all was a nightmare. Fastrill handles all three. Our receptionist now only handles in-person walk-ins." },
            ].map(t => (
              <div key={t.name} className="t-card reveal">
                <div className="t-stars">★★★★★</div>
                <p className="t-text">"{t.text}"</p>
                <div className="t-author">
                  <div className="t-avatar" style={{background:t.bg}}>{t.av}</div>
                  <div><div className="t-name">{t.name}</div><div className="t-biz">{t.biz}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section" id="faq">
        <div className="container">
          <div className="reveal" style={{textAlign:"center"}}>
            <div className="eyebrow">FAQ</div>
            <h2 className="section-h">Honest answers</h2>
          </div>
          <div className="faq-wrap">
            {faqs.map((faq, i) => (
              <div key={i} className={"faq-item"+(openFaq===i?" open":"")}>
                <button className="faq-btn" onClick={() => setOpenFaq(openFaq===i?null:i)}>
                  {faq.q}
                  <span className="faq-plus">+</span>
                </button>
                <div className="faq-answer">{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container" style={{position:"relative",zIndex:1}}>
          <h2>Your next customer<br/>is messaging you <em style={{color:"var(--green2)",fontStyle:"italic"}}>right now</em></h2>
          <p>Don't make them wait. Let Fastrill answer instantly, every time, in any language.</p>
          <div className="cta-btns">
            <a href="/signup" className="cta-primary">Start Free — No Card Needed →</a>
            <a href="https://wa.me/919999999999" className="cta-ghost-btn">💬 Chat on WhatsApp</a>
          </div>
          <p className="cta-note">14-day free trial · Setup in 10 minutes · Cancel anytime</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-logo">
              <a href="/" className="logo">fast<span>rill</span></a>
              <p className="footer-about">WhatsApp AI receptionist for Indian service businesses. Books appointments, converts leads, and grows your revenue — 24/7, in any language.</p>
            </div>
            <div>
              <div className="footer-col-title">Product</div>
              <ul className="footer-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#how">How it works</a></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-title">Company</div>
              <ul className="footer-links">
                <li><a href="/about">About</a></li>
                <li><a href="/blog">Blog</a></li>
                <li><a href="/contact">Contact</a></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-title">Legal</div>
              <ul className="footer-links">
                <li><a href="/privacy">Privacy Policy</a></li>
                <li><a href="/terms">Terms of Service</a></li>
                <li><a href="/refund">Refund Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Fastrill Technologies. All rights reserved.</span>
            <span>Made with ❤️ in India 🇮🇳</span>
          </div>
        </div>
      </footer>
    </>
  )
}
