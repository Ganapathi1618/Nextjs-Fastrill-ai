"use client"

import { useState, useEffect, useRef } from "react"

const DEMOS = {
  booking: [
    { r: "c", m: "Hi, I want a haircut tomorrow around 3pm" },
    { r: "a", m: "Tomorrow's Saturday — 3 PM works great.\n\nShall I confirm Haircut for Saturday, 29th March at 3:00 PM?" },
    { r: "c", m: "Yes please!" },
    { r: "a", m: "Booking confirmed.\n\nHaircut\nSaturday, 29 March\n3:00 PM\n\nSee you then!" },
  ],
  hindi: [
    { r: "c", m: "Bhai facial karwa sakte hai kal?" },
    { r: "a", m: "Haan bilkul!\n\nFacial ₹1,200 mein available hai (60 min).\n\nKis time aana chahenge?" },
    { r: "c", m: "Shaam 6 baje" },
    { r: "a", m: "Confirm karu Facial kal shaam 6:00 PM ke liye?" },
    { r: "c", m: "Haan kar do" },
    { r: "a", m: "Booking ho gayi!\n\nFacial · ₹1,200\nKal, 29 March\n6:00 PM\n\nMilenge!" },
  ],
  winback: [
    { r: "a", m: "Hi Anita — it's been a while since your last visit at Riya Salon.\n\nYour favourite keratin treatment is available this week, want to book?" },
    { r: "c", m: "Oh yes actually! What's the price?" },
    { r: "a", m: "Keratin Treatment is ₹2,800 (90 min). 10% off this week — ₹2,520." },
    { r: "c", m: "That's great, book me Saturday morning" },
    { r: "a", m: "Booking confirmed.\n\nKeratin Treatment · ₹2,520\nSaturday, 29 March · 10:00 AM" },
  ],
}

const DEMO_META = [
  { k: "booking", label: "Booking flow", sub: "End-to-end in 4 messages" },
  { k: "hindi", label: "Hindi support", sub: "Auto-detected per chat" },
  { k: "winback", label: "Win-back", sub: "Inactive customer" },
]

const TESTIMONIALS = [
  { name: "Priya Nair", biz: "Glow Parlour, Hyderabad", result: "+43%", resultLabel: "bookings, month one", quote: "I was losing Saturday night bookings because nobody replied after 8 PM. Customers now book at midnight and wake up to a confirmation. It paid for itself in the first week." },
  { name: "Dr. Ravi Sharma", biz: "Skin First Clinic, Vijayawada", result: "₹22k", resultLabel: "saved per month", quote: "My patients message in Telugu and the AI replies in Telugu, books the slot, and follows up if they go quiet. I had to see it to believe it wasn't a person." },
  { name: "Sneha Reddy", biz: "Studio S, 2 branches, Bangalore", result: "0", resultLabel: "missed messages", quote: "Two branches, both inboxes handled at once. Our staff stopped checking phones and started focusing on the customer in front of them." },
]

const LOGOS = ["Salons", "Clinics", "Gyms", "Coaching", "Restaurants", "Real Estate"]

function Ic({ name, size = 20, className = "" }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", className }
  switch (name) {
    case "check": return <svg {...p} strokeWidth={2.4}><path d="M20 6L9 17l-5-5" /></svg>
    case "arrow-right": return <svg {...p} strokeWidth={2}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    case "x": return <svg {...p} strokeWidth={2}><path d="M5 5l14 14M19 5L5 19" /></svg>
    case "zap": return <svg {...p}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
    case "calendar": return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
    case "message": return <svg {...p}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
    case "target": return <svg {...p}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
    case "bar-chart": return <svg {...p}><path d="M12 20V10M18 20V4M6 20v-4" /></svg>
    case "shield": return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
    case "globe": return <svg {...p}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
    case "users": return <svg {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
    case "play": return <svg {...p}><polygon points="5,3 19,12 5,21" /></svg>
    default: return null
  }
}

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)
  const [mobMenu, setMobMenu] = useState(false)
  const [demoKey, setDemoKey] = useState("booking")
  const [demoMsgs, setDemoMsgs] = useState([])
  const [billing, setBilling] = useState("monthly")
  const [activeT, setActiveT] = useState(0)
  const [faqOpen, setFaqOpen] = useState(null)
  const demoRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  useEffect(() => {
    setDemoMsgs([])
    clearTimeout(timerRef.current)
    const msgs = DEMOS[demoKey]
    msgs.forEach((m, i) => {
      timerRef.current = setTimeout(() => {
        setDemoMsgs(p => [...p, m])
        if (demoRef.current) demoRef.current.scrollTop = 9999
      }, 400 + i * 850)
    })
    return () => clearTimeout(timerRef.current)
  }, [demoKey])

  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("fi"); io.unobserve(e.target) }
      }),
      { threshold: 0.06, rootMargin: "0px 0px -30px 0px" }
    )
    document.querySelectorAll(".fo").forEach((el, idx) => {
      const sibs = Array.from(el.parentElement?.querySelectorAll(":scope>.fo") || [])
      el.style.transitionDelay = Math.min(sibs.indexOf(el) * 0.06, 0.3) + "s"
      io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  const faqs = [
    { q: "Do I need to change my WhatsApp number?", a: "No. You keep your existing WhatsApp Business number. Fastrill connects via Meta's official Business API." },
    { q: "How long does setup take?", a: "About 10 minutes. Connect WhatsApp, add your services and hours, go live." },
    { q: "Which languages are supported?", a: "Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi and English — auto-detected per conversation." },
    { q: "Can I reply manually?", a: "Yes, always. Toggle AI off for any conversation — reply manually, toggle back when done." },
    { q: "Is there a free trial?", a: "14 days, full Growth plan access, no credit card required." },
  ]

  return (
    <>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:#09090b;color:#a1a1aa;font-family:'Inter',system-ui,sans-serif;font-size:16px;line-height:1.65;-webkit-font-smoothing:antialiased;overflow-x:hidden}

:root{
  --white:#fafafa;--gray-100:#f4f4f5;--gray-200:#e4e4e7;--gray-300:#d4d4d8;
  --gray-400:#a1a1aa;--gray-500:#71717a;--gray-600:#52525b;--gray-700:#3f3f46;
  --gray-800:#27272a;--gray-900:#18181b;--gray-950:#09090b;
  --brand:#10b981;--brand-dark:#059669;--brand-light:#34d399;--brand-50:rgba(16,185,129,.06);--brand-100:rgba(16,185,129,.12);
  --r:12px;--r-lg:16px;--r-xl:20px;
  --shadow:0 1px 3px rgba(0,0,0,.4),0 6px 20px rgba(0,0,0,.3);
  --shadow-lg:0 4px 12px rgba(0,0,0,.4),0 20px 48px rgba(0,0,0,.4);
  --mono:'JetBrains Mono',monospace;
}

.fo{opacity:0;transform:translateY(18px);transition:opacity .7s cubic-bezier(.22,.8,.22,1),transform .7s cubic-bezier(.22,.8,.22,1)}
.fo.fi{opacity:1;transform:none}

/* ── NAV ── */
.nav{position:fixed;top:0;left:0;right:0;z-index:100;height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 clamp(16px,4vw,48px);transition:all .2s}
.nav.scrolled{background:rgba(9,9,11,.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--gray-800)}
.logo{display:flex;align-items:center;gap:8px;text-decoration:none;font-weight:800;font-size:18px;color:var(--white);letter-spacing:-.03em}
.logo img{width:24px;height:24px;object-fit:contain}
.logo em{color:var(--brand);font-style:normal}
.nav-links{display:flex;align-items:center;gap:4px;list-style:none}
.nav-links a{font-size:13px;font-weight:500;color:var(--gray-400);text-decoration:none;padding:6px 12px;border-radius:6px;transition:color .15s}
.nav-links a:hover{color:var(--white)}
.nav-r{display:flex;align-items:center;gap:8px}
.nav-signin{font-size:13px;font-weight:500;color:var(--gray-400);text-decoration:none;padding:6px 14px;transition:color .15s}
.nav-signin:hover{color:var(--white)}
.btn{display:inline-flex;align-items:center;gap:6px;font-weight:600;font-size:13px;border-radius:8px;text-decoration:none;transition:all .2s;border:none;cursor:pointer;font-family:inherit}
.btn-brand{background:var(--brand);color:#fff;padding:8px 18px;box-shadow:0 0 20px rgba(16,185,129,.15)}
.btn-brand:hover{background:var(--brand-dark);transform:translateY(-1px);box-shadow:0 0 28px rgba(16,185,129,.25)}
.btn-outline{background:transparent;color:var(--gray-200);padding:8px 16px;border:1px solid var(--gray-700)}
.btn-outline:hover{border-color:var(--brand);color:var(--brand)}
.btn-lg{padding:12px 28px;font-size:14px;border-radius:10px}
.hamburger{display:none;background:none;border:1px solid var(--gray-700);border-radius:6px;padding:5px 8px;color:var(--gray-400);cursor:pointer;font-size:16px}
.mob-drawer{position:fixed;top:64px;left:0;right:0;z-index:99;background:rgba(9,9,11,.97);backdrop-filter:blur(16px);border-bottom:1px solid var(--gray-800);padding:8px 16px 16px;display:flex;flex-direction:column;gap:2px;transform:translateY(-120%);transition:transform .2s}
.mob-drawer.open{transform:none}
.mob-drawer a{color:var(--gray-400);text-decoration:none;font-size:14px;font-weight:500;padding:10px 12px;border-radius:8px}
.mob-drawer a:hover{color:var(--white);background:var(--gray-900)}
@media(max-width:768px){.nav-links,.nav-signin{display:none}.hamburger{display:flex;align-items:center}}

/* ── HERO ── */
.hero{min-height:100vh;display:flex;align-items:center;padding:120px clamp(16px,4vw,48px) 80px;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:-20%;left:50%;transform:translateX(-50%);width:800px;height:600px;background:radial-gradient(ellipse,rgba(16,185,129,.08),transparent 70%);pointer-events:none}
.hero-inner{max-width:1200px;margin:0 auto;width:100%;position:relative;z-index:1}
.hero-badge{display:inline-flex;align-items:center;gap:8px;padding:5px 14px 5px 6px;border-radius:100px;border:1px solid var(--gray-800);background:var(--gray-900);font-size:12px;font-weight:600;color:var(--gray-400);margin-bottom:28px}
.hero-badge-dot{width:8px;height:8px;border-radius:50%;background:var(--brand);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(16,185,129,.4)}50%{opacity:.8;box-shadow:0 0 0 6px transparent}}
.hero-h1{font-weight:900;font-size:clamp(40px,6vw,76px);line-height:.96;letter-spacing:-.045em;color:var(--white);max-width:820px;margin-bottom:24px}
.hero-h1 .muted{color:var(--gray-600)}
.hero-h1 .accent{color:var(--brand)}
.hero-grid{display:grid;grid-template-columns:1fr 400px;gap:clamp(32px,5vw,64px);align-items:end;margin-top:8px}
.hero-sub{font-size:clamp(15px,1.4vw,17px);color:var(--gray-400);line-height:1.75;max-width:460px;margin-bottom:32px}
.hero-sub strong{color:var(--white);font-weight:600}
.hero-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.hero-social-proof{margin-top:40px;display:flex;align-items:center;gap:14px;font-size:12px;color:var(--gray-500)}
.hero-avatars{display:flex}
.hero-avatars span{width:28px;height:28px;border-radius:50%;border:2px solid var(--gray-950);margin-left:-8px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:9px;color:#fff}
.hero-avatars span:first-child{margin-left:0}

/* Phone mock */
.phone{background:var(--gray-900);border:1px solid var(--gray-800);border-radius:var(--r-xl);overflow:hidden;box-shadow:var(--shadow-lg)}
.phone-bar{background:var(--gray-900);border-bottom:1px solid var(--gray-800);padding:10px 14px;display:flex;align-items:center;gap:8px}
.phone-av{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--brand),#3b82f6);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:10px;color:#fff;flex-shrink:0}
.phone-name{font-size:12px;font-weight:700;color:var(--white)}
.phone-stat{font-size:9px;color:var(--brand);display:flex;align-items:center;gap:3px}
.phone-stat::before{content:'';width:4px;height:4px;border-radius:50%;background:var(--brand)}
.phone-body{padding:12px;min-height:200px;display:flex;flex-direction:column;gap:6px}
.msg{max-width:82%;padding:8px 11px;border-radius:10px;font-size:11px;line-height:1.5;white-space:pre-wrap;animation:msgin .2s ease both}
.msg.c{background:var(--brand);color:#fff;align-self:flex-end;border-radius:10px 3px 10px 10px;font-weight:500}
.msg.a{background:var(--gray-800);border:1px solid var(--gray-700);color:var(--gray-200);align-self:flex-start;border-radius:3px 10px 10px 10px}
@keyframes msgin{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}

@media(max-width:900px){.hero-grid{grid-template-columns:1fr;gap:36px}}

/* ── TRUST BAR ── */
.trust{border-top:1px solid var(--gray-800);border-bottom:1px solid var(--gray-800);padding:20px clamp(16px,4vw,48px)}
.trust-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:24px 40px}
.trust-item{font-size:13px;font-weight:600;color:var(--gray-600);letter-spacing:.02em;display:flex;align-items:center;gap:6px}
.trust-item::before{content:'';width:4px;height:4px;border-radius:50%;background:var(--gray-700)}

/* ── SECTIONS SHARED ── */
.section{padding:clamp(80px,10vw,120px) clamp(16px,4vw,48px)}
.section.alt{background:var(--gray-900);border-top:1px solid var(--gray-800);border-bottom:1px solid var(--gray-800)}
.section-inner{max-width:1200px;margin:0 auto}
.section-label{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--brand);margin-bottom:14px}
.section-h{font-weight:800;font-size:clamp(28px,3.6vw,42px);color:var(--white);letter-spacing:-.035em;line-height:1.12;margin-bottom:16px;max-width:600px}
.section-h em{color:var(--brand);font-style:normal}
.section-p{font-size:15px;color:var(--gray-400);line-height:1.75;max-width:520px}

/* ── PROBLEM ── */
.problem-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--gray-800);border:1px solid var(--gray-800);border-radius:var(--r-lg);overflow:hidden;margin-top:48px}
.problem-card{background:var(--gray-950);padding:32px 28px}
.problem-num{font-family:var(--mono);font-size:11px;color:var(--gray-600);margin-bottom:16px}
.problem-title{font-size:17px;font-weight:700;color:var(--white);margin-bottom:8px}
.problem-desc{font-size:13px;color:var(--gray-400);line-height:1.7}
.problem-tag{display:inline-block;margin-top:16px;font-size:10px;font-weight:700;color:#ef4444;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:100px;padding:3px 10px}
@media(max-width:768px){.problem-grid{grid-template-columns:1fr}}

/* ── FEATURES / HOW IT WORKS ── */
.features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:48px}
.feature-card{background:var(--gray-900);border:1px solid var(--gray-800);border-radius:var(--r-lg);padding:28px 24px;transition:border-color .2s}
.feature-card:hover{border-color:var(--gray-700)}
.feature-icon{width:40px;height:40px;border-radius:10px;background:var(--brand-50);border:1px solid var(--brand-100);display:flex;align-items:center;justify-content:center;color:var(--brand);margin-bottom:16px}
.feature-title{font-size:15px;font-weight:700;color:var(--white);margin-bottom:6px}
.feature-desc{font-size:13px;color:var(--gray-400);line-height:1.7}
@media(max-width:768px){.features-grid{grid-template-columns:1fr}}

/* ── PRODUCT MODULE ── */
.module{display:grid;grid-template-columns:1fr 1fr;gap:clamp(32px,5vw,64px);align-items:center;padding:64px 0;border-bottom:1px solid var(--gray-800)}
.module:last-child{border-bottom:none}
.module.rev .mod-text{order:2}
.module.rev .mod-visual{order:1}
.mod-tag{font-family:var(--mono);font-size:11px;color:var(--brand);margin-bottom:12px}
.mod-title{font-weight:800;font-size:clamp(22px,2.6vw,28px);color:var(--white);letter-spacing:-.025em;line-height:1.2;margin-bottom:12px}
.mod-desc{font-size:14px;color:var(--gray-400);line-height:1.7;margin-bottom:20px}
.mod-list{list-style:none;display:flex;flex-direction:column;gap:10px}
.mod-list li{display:flex;align-items:flex-start;gap:8px;font-size:13px;color:var(--gray-400)}
.mod-list li svg{color:var(--brand);flex-shrink:0;margin-top:2px}

.mock-dash{background:var(--gray-900);border:1px solid var(--gray-800);border-radius:var(--r-lg);overflow:hidden;box-shadow:var(--shadow-lg)}
.mock-bar{height:32px;background:var(--gray-950);border-bottom:1px solid var(--gray-800);display:flex;align-items:center;padding:0 12px;gap:5px}
.mock-dot{width:6px;height:6px;border-radius:50%;background:var(--gray-700)}
.mock-body{padding:20px}
.mock-title{font-weight:700;font-size:13px;color:var(--white);margin-bottom:14px}
.mock-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
.mock-stat-label{font-size:10px;color:var(--gray-500);margin-bottom:4px}
.mock-stat-val{font-family:var(--mono);font-size:16px;font-weight:600;color:var(--white)}
.mock-stat-val.green{color:var(--brand)}
.mock-roi{background:var(--gray-950);border-radius:8px;padding:12px}
.mock-roi-row{display:flex;justify-content:space-between;font-size:11px;color:var(--gray-500);padding:3px 0}
.mock-roi-row strong{font-family:var(--mono);color:var(--white)}
.mock-roi-row strong.green{color:var(--brand)}

.mock-inbox{background:var(--gray-900);border:1px solid var(--gray-800);border-radius:var(--r-lg);overflow:hidden;box-shadow:var(--shadow-lg)}
.inbox-row{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--gray-800)}
.inbox-row:last-child{border-bottom:none}
.inbox-av{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--brand),#3b82f6);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:10px;color:#fff;flex-shrink:0}
.inbox-mid{flex:1;min-width:0}
.inbox-name{font-size:12px;font-weight:700;color:var(--white);margin-bottom:1px}
.inbox-msg{font-size:11px;color:var(--gray-500);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.inbox-right{text-align:right;flex-shrink:0}
.inbox-time{font-size:9px;color:var(--gray-600);margin-bottom:3px}
.ai-pill{font-size:8px;font-weight:700;padding:2px 6px;border-radius:100px;background:var(--gray-800);color:var(--gray-500)}
.ai-pill.on{background:var(--brand-50);color:var(--brand)}

@media(max-width:860px){
  .module,.module.rev{grid-template-columns:1fr;gap:28px}
  .module.rev .mod-text{order:1}
  .module.rev .mod-visual{order:2}
}

/* ── DEMO ── */
.demo-layout{display:grid;grid-template-columns:180px 1fr;gap:16px;align-items:start;margin-top:40px}
.demo-tabs{display:flex;flex-direction:column;gap:6px}
.demo-tab{background:var(--gray-950);border:1px solid var(--gray-800);border-radius:10px;padding:12px 14px;cursor:pointer;transition:all .15s;text-align:left}
.demo-tab.on{border-color:var(--brand);background:var(--brand-50)}
.demo-tab-label{font-size:13px;font-weight:700;color:var(--white);margin-bottom:2px}
.demo-tab-sub{font-size:10px;color:var(--gray-500)}
.wa-mock{background:var(--gray-950);border-radius:var(--r-lg);overflow:hidden;border:1px solid var(--gray-800);box-shadow:var(--shadow-lg)}
.wa-head{background:var(--gray-900);padding:10px 14px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--gray-800)}
.wa-body{padding:12px;min-height:240px;max-height:300px;display:flex;flex-direction:column;gap:6px;overflow-y:auto;scrollbar-width:none}
.wa-body::-webkit-scrollbar{display:none}
@media(max-width:768px){.demo-layout{grid-template-columns:1fr}.demo-tabs{display:grid;grid-template-columns:repeat(3,1fr)}}

/* ── METRICS ── */
.metrics-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:48px}
.metric-card{background:var(--gray-900);border:1px solid var(--gray-800);border-radius:var(--r-lg);padding:28px 24px;text-align:center}
.metric-val{font-family:var(--mono);font-size:clamp(28px,3.5vw,36px);font-weight:600;color:var(--white);margin-bottom:4px}
.metric-val em{color:var(--brand);font-style:normal}
.metric-label{font-size:12px;color:var(--gray-500)}
@media(max-width:768px){.metrics-row{grid-template-columns:repeat(2,1fr)}}

/* ── TESTIMONIALS ── */
.test-layout{display:grid;grid-template-columns:1.3fr 1fr;gap:clamp(32px,5vw,56px);align-items:start;margin-top:48px}
.test-qmark{font-size:56px;line-height:.7;color:rgba(16,185,129,.15);margin-bottom:8px}
.test-quote{font-size:clamp(18px,2.2vw,24px);font-weight:600;color:var(--white);line-height:1.5;letter-spacing:-.01em;margin-bottom:24px}
.test-auth{display:flex;align-items:center;gap:10px;padding-top:16px;border-top:1px solid var(--gray-800)}
.test-av{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--brand),#3b82f6);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:#fff;flex-shrink:0}
.test-name{font-size:13px;font-weight:700;color:var(--white)}
.test-biz{font-size:11px;color:var(--gray-500)}
.test-rail{display:flex;flex-direction:column;border-left:1px solid var(--gray-800)}
.test-rail-item{text-align:left;background:none;border:none;border-left:2px solid transparent;margin-left:-1px;padding:14px 0 14px 20px;cursor:pointer;font-family:inherit;transition:all .15s}
.test-rail-item.on{border-left-color:var(--brand)}
.test-rail-result{font-family:var(--mono);font-size:20px;font-weight:600;color:var(--gray-600);margin-bottom:2px;transition:color .15s}
.test-rail-item.on .test-rail-result{color:var(--brand)}
.test-rail-label{font-size:10px;color:var(--gray-500);margin-bottom:4px}
.test-rail-name{font-size:11px;color:var(--gray-600)}
@media(max-width:768px){.test-layout{grid-template-columns:1fr;gap:24px}.test-rail{border-left:none;border-top:1px solid var(--gray-800);flex-direction:row;flex-wrap:wrap}.test-rail-item{border-left:none;border-top:2px solid transparent;margin:0;padding:12px 16px 12px 0}.test-rail-item.on{border-top-color:var(--brand)}}

/* ── PRICING ── */
.billing-toggle{display:inline-flex;align-items:center;gap:3px;background:var(--gray-950);border:1px solid var(--gray-800);border-radius:100px;padding:3px;margin:24px auto 40px}
.bt{padding:7px 16px;border-radius:100px;font-size:12px;font-weight:700;border:none;background:transparent;color:var(--gray-500);cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:5px;transition:all .15s}
.bt.on{background:var(--brand);color:#fff}
.bt-save{font-size:9px;font-weight:800;padding:1px 6px;border-radius:100px}
.bt.on .bt-save{background:rgba(255,255,255,.2)}
.bt:not(.on) .bt-save{background:var(--brand-50);color:var(--brand)}
.pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;align-items:start}
.plan{background:var(--gray-950);border:1px solid var(--gray-800);border-radius:var(--r-lg);padding:clamp(24px,3vw,32px) clamp(20px,3vw,24px);position:relative;transition:border-color .2s}
.plan:hover{border-color:var(--gray-700)}
.plan.pop{border-color:rgba(16,185,129,.35);box-shadow:0 0 40px rgba(16,185,129,.06)}
.plan-badge{position:absolute;top:-1px;left:20px;transform:translateY(-50%);background:var(--brand);color:#fff;font-size:9px;font-weight:800;padding:3px 10px;border-radius:100px}
.plan-tier{font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--gray-500);margin-bottom:4px}
.plan-tag{font-size:12px;color:var(--gray-500);margin-bottom:16px}
.plan-price{display:flex;align-items:baseline;gap:2px;margin-bottom:2px}
.plan-rs{font-size:14px;font-weight:700;color:var(--white)}
.plan-amt{font-family:var(--mono);font-size:clamp(30px,3.8vw,36px);font-weight:600;color:var(--white);letter-spacing:-.02em}
.plan.pop .plan-amt,.plan.pop .plan-rs{color:var(--brand)}
.plan-mo{font-size:11px;color:var(--gray-500);margin-bottom:16px}
.plan-hr{border:none;border-top:1px solid var(--gray-800);margin:14px 0}
.plan-list{list-style:none;display:flex;flex-direction:column;gap:8px;margin-bottom:20px}
.plan-list li{display:flex;align-items:flex-start;gap:7px;font-size:12px;color:var(--gray-400)}
.plan-list li svg{color:var(--brand);flex-shrink:0;margin-top:2px}
.plan-list li.exc{color:var(--gray-600);text-decoration:line-through}
.plan-btn{display:block;text-align:center;padding:10px;border-radius:8px;font-weight:700;font-size:13px;text-decoration:none;transition:all .15s;font-family:inherit;border:none;cursor:pointer;width:100%}
.plan-btn.go{background:var(--brand);color:#fff}
.plan-btn.go:hover{background:var(--brand-dark)}
.plan-btn.out{background:transparent;color:var(--white);border:1px solid var(--gray-700)}
.plan-btn.out:hover{border-color:var(--brand);color:var(--brand)}
@media(max-width:768px){.pgrid{grid-template-columns:1fr}}

/* ── FAQ ── */
.faq-list{max-width:640px;margin:40px auto 0}
.faq-item{border-bottom:1px solid var(--gray-800)}
.faq-item:first-child{border-top:1px solid var(--gray-800)}
.faq-btn{width:100%;background:none;border:none;padding:16px 0;text-align:left;font-size:14px;font-weight:600;color:var(--white);cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:12px;font-family:inherit}
.faq-plus{width:18px;height:18px;border-radius:50%;background:var(--gray-800);display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--gray-500);flex-shrink:0;transition:all .15s}
.faq-answer{font-size:13px;color:var(--gray-400);line-height:1.75;max-height:0;overflow:hidden;transition:max-height .25s ease,padding .25s ease}
.faq-item.open .faq-answer{max-height:200px;padding:0 0 16px}
.faq-item.open .faq-plus{background:var(--brand-100);color:var(--brand);transform:rotate(45deg)}

/* ── CTA ── */
.cta-section{padding:clamp(80px,10vw,120px) clamp(16px,4vw,48px);text-align:center}
.cta-card{max-width:640px;margin:0 auto;background:var(--gray-900);border:1px solid rgba(16,185,129,.25);border-radius:var(--r-xl);padding:clamp(40px,5vw,56px) clamp(24px,4vw,40px);position:relative;overflow:hidden}
.cta-card::before{content:'';position:absolute;top:-50%;left:50%;transform:translateX(-50%);width:500px;height:300px;background:radial-gradient(ellipse,rgba(16,185,129,.06),transparent 70%);pointer-events:none}
.cta-h{font-weight:800;font-size:clamp(24px,3vw,36px);color:var(--white);letter-spacing:-.03em;margin-bottom:12px;line-height:1.15;position:relative}
.cta-h em{color:var(--brand);font-style:normal}
.cta-p{font-size:14px;color:var(--gray-400);margin-bottom:28px;line-height:1.7;max-width:380px;margin-left:auto;margin-right:auto;position:relative}
.cta-btns{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;position:relative}
.cta-note{margin-top:14px;font-size:11px;color:var(--gray-600);position:relative}

/* ── FOOTER ── */
.footer{background:var(--gray-900);border-top:1px solid var(--gray-800);padding:clamp(40px,6vw,56px) clamp(16px,4vw,48px) 24px}
.ft-inner{max-width:1200px;margin:0 auto}
.ft-top{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:clamp(20px,4vw,40px);margin-bottom:36px}
.ft-tagline{font-size:12px;color:var(--gray-500);line-height:1.8;margin-top:12px;max-width:240px}
.ft-hd{font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--gray-500);margin-bottom:12px}
.ft-links{list-style:none;display:flex;flex-direction:column;gap:8px}
.ft-links a{font-size:13px;color:var(--gray-400);text-decoration:none;transition:color .15s}
.ft-links a:hover{color:var(--brand)}
.ft-bot{padding-top:16px;border-top:1px solid var(--gray-800);display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--gray-600);flex-wrap:wrap;gap:8px}
@media(max-width:768px){.ft-top{grid-template-columns:1fr}}
      `}</style>

      {/* NAV */}
      <nav className={`nav${scrollY > 20 ? " scrolled" : ""}`}>
        <a href="/" className="logo">
          <img src="/logo.png" alt="Fastrill" />
          <span>fast<em>rill</em></span>
        </a>
        <ul className="nav-links">
          {[["#problem","Problem"],["#product","Product"],["#demo","Demo"],["#pricing","Pricing"]].map(([h,l]) => (
            <li key={h}><a href={h}>{l}</a></li>
          ))}
        </ul>
        <div className="nav-r">
          <a href="/login" className="nav-signin">Sign in</a>
          <a href="/signup" className="btn btn-brand">Start free</a>
          <button className="hamburger" onClick={() => setMobMenu(p => !p)}>&#9776;</button>
        </div>
      </nav>
      <div className={`mob-drawer${mobMenu ? " open" : ""}`}>
        {[["#problem","Problem"],["#product","Product"],["#demo","Demo"],["#pricing","Pricing"],
          ["/login","Sign in"]].map(([h,l]) => (
          <a key={h} href={h} onClick={() => setMobMenu(false)}>{l}</a>
        ))}
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge"><span className="hero-badge-dot" /> Built for Indian service businesses</div>
          <h1 className="hero-h1">
            <span className="muted">Every missed message</span><br />
            is a customer you <span className="accent">already paid for.</span>
          </h1>
          <div className="hero-grid">
            <div>
              <p className="hero-sub">
                Your ads bring leads to WhatsApp. But most go unanswered for hours — or forever. Fastrill replies in <strong>under 2 seconds</strong>, qualifies the lead, and books the appointment. Automatically.
              </p>
              <div className="hero-actions">
                <a href="/signup" className="btn btn-brand btn-lg">Start free trial <Ic name="arrow-right" size={15} /></a>
                <a href="#demo" className="btn btn-outline btn-lg"><Ic name="play" size={13} /> Watch demo</a>
              </div>
              <div className="hero-social-proof">
                <div className="hero-avatars">
                  {["P","R","S","A"].map((l,i) => (
                    <span key={i} style={{background:`hsl(${160+i*40},60%,${40+i*5}%)`}}>{l}</span>
                  ))}
                </div>
                <span>Trusted by 200+ businesses across India</span>
              </div>
            </div>
            <div className="phone">
              <div className="phone-bar">
                <div className="phone-av">R</div>
                <div>
                  <div className="phone-name">Riya Salon</div>
                  <div className="phone-stat">AI Active</div>
                </div>
              </div>
              <div className="phone-body">
                {DEMOS.booking.map((m,i) => <div key={i} className={`msg ${m.r}`}>{m.m}</div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <div className="trust">
        <div className="trust-inner">
          {LOGOS.map(l => <span key={l} className="trust-item">{l}</span>)}
        </div>
      </div>

      {/* METRICS */}
      <section className="section">
        <div className="section-inner">
          <div className="metrics-row">
            {[
              ["3,200+","Bookings automated monthly"],
              ["1.8s","Average response time"],
              ["99%","Message delivery rate"],
              ["10+","Indian languages"],
            ].map(([v,l]) => (
              <div key={l} className="metric-card fo">
                <div className="metric-val">{v}</div>
                <div className="metric-label">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="section alt" id="problem">
        <div className="section-inner">
          <div className="fo">
            <div className="section-label">The problem</div>
            <h2 className="section-h">Your ads are working.<br /><em>Your inbox isn't.</em></h2>
            <p className="section-p">You spend thousands getting leads to message you. Then they die in the WhatsApp inbox because nobody replied fast enough.</p>
          </div>
          <div className="problem-grid">
            {[
              { n: "01", t: "Leads die after hours", d: "A customer messages at 10 PM about your bridal package. You see it at 9 AM. She already booked someone else.", tag: "Revenue lost nightly" },
              { n: "02", t: "Speed wins bookings", d: "Your competitor replies in 2 seconds. You reply in 2 hours. Same service, same price — they win every time.", tag: "Competitive loss" },
              { n: "03", t: "Silence becomes bad reviews", d: "An upset customer messages at peak hour. Staff is busy. No reply for hours. One-star review follows.", tag: "Reputation risk" },
            ].map(p => (
              <div key={p.n} className="problem-card fo">
                <div className="problem-num">{p.n}</div>
                <div className="problem-title">{p.t}</div>
                <p className="problem-desc">{p.d}</p>
                <div className="problem-tag">{p.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section">
        <div className="section-inner">
          <div className="fo" style={{textAlign:"center",maxWidth:560,margin:"0 auto"}}>
            <div className="section-label" style={{display:"flex",justifyContent:"center"}}>How it works</div>
            <h2 className="section-h" style={{margin:"0 auto 16px"}}>Connect. Configure. <em>Convert.</em></h2>
            <p className="section-p" style={{margin:"0 auto"}}>10-minute setup. No code. No developer needed.</p>
          </div>
          <div className="features-grid">
            {[
              { icon: "zap", t: "Instant AI replies", d: "Every message gets a response in under 2 seconds. 24/7, in any Indian language." },
              { icon: "calendar", t: "Auto-booking", d: "Service, date, time — collected conversationally. Checked against real availability." },
              { icon: "target", t: "Lead recovery", d: "Automatically follows up with leads who went quiet. Brings them back with offers." },
              { icon: "bar-chart", t: "Campaign ROI", d: "Send WhatsApp campaigns and track revenue per message — not just opens." },
              { icon: "globe", t: "10+ languages", d: "Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali and more. Auto-detected." },
              { icon: "shield", t: "Meta verified", d: "Uses official WhatsApp Business API. Your existing number. Fully compliant." },
            ].map(f => (
              <div key={f.t} className="feature-card fo">
                <div className="feature-icon"><Ic name={f.icon} size={18} /></div>
                <div className="feature-title">{f.t}</div>
                <p className="feature-desc">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT MODULES */}
      <section className="section alt" id="product">
        <div className="section-inner">
          <div className="fo">
            <div className="section-label">Inside Fastrill</div>
            <h2 className="section-h">Not a chatbot.<br /><em>A revenue system.</em></h2>
          </div>

          <div className="module fo">
            <div className="mod-text">
              <div className="mod-tag">01 / BOOKING ENGINE</div>
              <h3 className="mod-title">Books appointments start to finish.</h3>
              <p className="mod-desc">Service, date, time, confirmation — collected conversationally, checked against real availability, confirmed without human intervention.</p>
              <ul className="mod-list">
                <li><Ic name="check" size={14} />Understands casual, mixed-language messages</li>
                <li><Ic name="check" size={14} />Checks real slot availability before confirming</li>
                <li><Ic name="check" size={14} />Notifies you the moment it's booked</li>
              </ul>
            </div>
            <div className="mod-visual">
              <div className="phone">
                <div className="phone-bar">
                  <div className="phone-av">R</div>
                  <div><div className="phone-name">Riya Salon</div><div className="phone-stat">AI Active</div></div>
                </div>
                <div className="phone-body">
                  <div className="msg c">Hi, I want a haircut tomorrow around 3pm</div>
                  <div className="msg a">{"Tomorrow's great — 3 PM is available.\n\nShall I confirm Haircut for tomorrow at 3:00 PM?"}</div>
                  <div className="msg c">Yes please!</div>
                  <div className="msg a">{"Booking confirmed.\n\nHaircut · Tomorrow · 3:00 PM"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="module rev fo">
            <div className="mod-text">
              <div className="mod-tag">02 / CAMPAIGNS</div>
              <h3 className="mod-title">See exactly what each campaign earned.</h3>
              <p className="mod-desc">Send approved WhatsApp templates to customer segments. Track delivery, replies, and revenue attributed to each send.</p>
              <ul className="mod-list">
                <li><Ic name="check" size={14} />Segment by tag — new, returning, VIP, inactive</li>
                <li><Ic name="check" size={14} />Real Meta delivery and read tracking</li>
                <li><Ic name="check" size={14} />Revenue and ROI per campaign</li>
              </ul>
            </div>
            <div className="mod-visual">
              <div className="mock-dash">
                <div className="mock-bar"><span className="mock-dot" /><span className="mock-dot" /><span className="mock-dot" /></div>
                <div className="mock-body">
                  <div className="mock-title">Winter offer — January</div>
                  <div className="mock-stats">
                    <div><div className="mock-stat-label">Sent</div><div className="mock-stat-val">412</div></div>
                    <div><div className="mock-stat-label">Delivered</div><div className="mock-stat-val">404</div></div>
                    <div><div className="mock-stat-label">Replied</div><div className="mock-stat-val green">138</div></div>
                  </div>
                  <div className="mock-roi">
                    <div className="mock-roi-row"><span>Est. bookings</span><strong>82</strong></div>
                    <div className="mock-roi-row"><span>Est. revenue</span><strong>₹98,400</strong></div>
                    <div className="mock-roi-row"><span>ROI</span><strong className="green">+612%</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="module fo">
            <div className="mod-text">
              <div className="mod-tag">03 / UNIFIED INBOX</div>
              <h3 className="mod-title">One inbox. Every conversation.</h3>
              <p className="mod-desc">See every conversation live, take over manually whenever you want, let AI pick back up the moment you're done.</p>
              <ul className="mod-list">
                <li><Ic name="check" size={14} />Toggle AI on/off per conversation</li>
                <li><Ic name="check" size={14} />Full customer history and tags in one view</li>
                <li><Ic name="check" size={14} />Works across 10+ Indian languages</li>
              </ul>
            </div>
            <div className="mod-visual">
              <div className="mock-inbox">
                {[
                  { n: "Priya Nair", m: "Yes please, book me for 3 PM", t: "now", on: true },
                  { n: "Arjun Mehta", m: "Do you have dermatology also", t: "2m", on: true },
                  { n: "Sneha Reddy", m: "Thank you so much!", t: "14m", on: false },
                ].map(c => (
                  <div key={c.n} className="inbox-row">
                    <div className="inbox-av">{c.n[0]}</div>
                    <div className="inbox-mid"><div className="inbox-name">{c.n}</div><div className="inbox-msg">{c.m}</div></div>
                    <div className="inbox-right"><div className="inbox-time">{c.t}</div><div className={`ai-pill${c.on?" on":""}`}>{c.on?"AI on":"Manual"}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section className="section" id="demo">
        <div className="section-inner">
          <div className="fo">
            <div className="section-label">Live demo</div>
            <h2 className="section-h">See it convert in <em>real time.</em></h2>
            <p className="section-p">Pick a scenario. Watch the AI handle it naturally.</p>
          </div>
          <div className="demo-layout">
            <div className="demo-tabs fo">
              {DEMO_META.map(s => (
                <div key={s.k} className={`demo-tab${demoKey===s.k?" on":""}`} onClick={() => setDemoKey(s.k)}>
                  <div className="demo-tab-label">{s.label}</div>
                  <div className="demo-tab-sub">{s.sub}</div>
                </div>
              ))}
            </div>
            <div className="wa-mock fo">
              <div className="wa-head">
                <div className="phone-av">R</div>
                <div><div className="phone-name">Riya Salon</div><div className="phone-stat">AI Active</div></div>
              </div>
              <div className="wa-body" ref={demoRef}>
                {demoMsgs.map((m,i) => <div key={i} className={`msg ${m.r}`}>{m.m}</div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section alt">
        <div className="section-inner">
          <div className="fo">
            <div className="section-label">Results</div>
            <h2 className="section-h">Real businesses. <em>Real numbers.</em></h2>
          </div>
          <div className="test-layout fo">
            <div>
              <div className="test-qmark">"</div>
              <p className="test-quote">{TESTIMONIALS[activeT].quote}</p>
              <div className="test-auth">
                <div className="test-av">{TESTIMONIALS[activeT].name[0]}</div>
                <div><div className="test-name">{TESTIMONIALS[activeT].name}</div><div className="test-biz">{TESTIMONIALS[activeT].biz}</div></div>
              </div>
            </div>
            <div className="test-rail">
              {TESTIMONIALS.map((t,i) => (
                <button key={t.name} className={`test-rail-item${i===activeT?" on":""}`} onClick={() => setActiveT(i)}>
                  <div className="test-rail-result">{t.result}</div>
                  <div className="test-rail-label">{t.resultLabel}</div>
                  <div className="test-rail-name">{t.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOUNDER */}
      <section className="section">
        <div className="section-inner" style={{maxWidth:680,margin:"0 auto"}}>
          <div className="fo" style={{textAlign:"center"}}>
            <div className="section-label" style={{display:"flex",justifyContent:"center"}}>Why we built this</div>
          </div>
          <div className="fo" style={{marginTop:32,fontSize:"clamp(16px,1.8vw,18px)",color:"var(--gray-400)",lineHeight:1.85}}>
            <p>
              I've spent years in digital marketing — running ads, building funnels, optimising campaigns for businesses across India. Every lead costs real money.
            </p>
            <p style={{marginTop:20}}>
              And the single most common thing I saw across <strong style={{color:"var(--white)",fontWeight:600}}>every client</strong> — salons, clinics, gyms, coaching centres — was this:
            </p>
            <p style={{margin:"24px 0",fontSize:"clamp(18px,2.2vw,22px)",color:"var(--brand)",fontWeight:600}}>
              Leads were arriving. And dying in the WhatsApp inbox.
            </p>
            <p>
              A salon owner in Hyderabad spending <strong style={{color:"var(--white)",fontWeight:600}}>₹40,000/month on Instagram ads</strong>. 60% of leads who messaged never got a reply within the hour. Not bad ads — slow replies.
            </p>
            <p style={{marginTop:20}}>
              <strong style={{color:"var(--white)",fontWeight:600}}>The problem was never the ads. It was always the follow-up.</strong>
            </p>
            <div style={{marginTop:40,display:"flex",alignItems:"center",gap:14}}>
              <div className="test-av" style={{width:42,height:42,fontSize:15}}>G</div>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:"var(--white)"}}>Ganapathi</div>
                <div style={{fontSize:12,color:"var(--gray-500)"}}>Founder, Fastrill — Solvabil Pvt. Ltd.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section alt" id="pricing">
        <div className="section-inner">
          <div className="fo" style={{textAlign:"center"}}>
            <div className="section-label" style={{display:"flex",justifyContent:"center"}}>Pricing</div>
            <h2 className="section-h" style={{margin:"0 auto 0",textAlign:"center"}}>Simple pricing.<br /><em>Pays for itself.</em></h2>
          </div>
          <div className="fo" style={{display:"flex",justifyContent:"center"}}>
            <div className="billing-toggle">
              <button className={`bt${billing==="monthly"?" on":""}`} onClick={() => setBilling("monthly")}>Monthly</button>
              <button className={`bt${billing==="annual"?" on":""}`} onClick={() => setBilling("annual")}>Annual <span className="bt-save">Save 17%</span></button>
            </div>
          </div>
          <div className="pgrid">
            {[
              { tier:"Starter", monthly:999, tag:"Solo operators", cta:"Get started", cs:"out", feats:[["inc","1 WhatsApp number"],["inc","300 AI conversations / mo"],["inc","Booking automation"],["exc","Lead recovery"],["exc","Campaigns"]] },
              { tier:"Growth", monthly:1999, tag:"Growing businesses", cta:"Start free trial", cs:"go", pop:true, feats:[["inc","1 WhatsApp number"],["inc","Unlimited conversations"],["inc","Customer memory"],["inc","Lead recovery"],["inc","WhatsApp campaigns"]] },
              { tier:"Pro", monthly:4999, tag:"Multi-branch teams", cta:"Contact sales", cs:"out", feats:[["inc","Up to 5 numbers"],["inc","Everything in Growth"],["inc","Multi-branch management"],["inc","Custom AI playbook"],["inc","Dedicated onboarding"]] },
            ].map(plan => {
              const price = billing==="annual" ? Math.round(plan.monthly*0.83) : plan.monthly
              return (
                <div key={plan.tier} className={`plan fo${plan.pop?" pop":""}`}>
                  {plan.pop && <div className="plan-badge">Most popular</div>}
                  <div className="plan-tier">{plan.tier}</div>
                  <div className="plan-tag">{plan.tag}</div>
                  <div className="plan-price"><span className="plan-rs">₹</span><span className="plan-amt">{price.toLocaleString("en-IN")}</span></div>
                  <div className="plan-mo">per month + GST{billing==="annual" && <span style={{color:"var(--gray-600)"}}> · billed ₹{(price*12).toLocaleString("en-IN")}/yr</span>}</div>
                  <hr className="plan-hr" />
                  <ul className="plan-list">
                    {plan.feats.map(([c,t]) => <li key={t} className={c}>{c==="inc"?<Ic name="check" size={13}/>:<Ic name="x" size={13}/>}{t}</li>)}
                  </ul>
                  <a href="/signup" className={`plan-btn ${plan.cs}`}>{plan.cta}</a>
                </div>
              )
            })}
          </div>
          <p style={{textAlign:"center",marginTop:20,fontSize:12,color:"var(--gray-600)"}}>14-day free trial · No credit card · Cancel anytime</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="section-inner">
          <div className="fo" style={{textAlign:"center"}}>
            <div className="section-label" style={{display:"flex",justifyContent:"center"}}>FAQ</div>
            <h2 className="section-h" style={{margin:"0 auto",textAlign:"center"}}>Common questions</h2>
          </div>
          <div className="faq-list fo">
            {faqs.map((f,i) => (
              <div key={i} className={`faq-item${faqOpen===i?" open":""}`}>
                <button className="faq-btn" onClick={() => setFaqOpen(faqOpen===i?null:i)}>{f.q}<span className="faq-plus">+</span></button>
                <div className="faq-answer">{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-card fo">
          <h2 className="cta-h">Turn every WhatsApp message into <em>revenue.</em></h2>
          <p className="cta-p">Start automating replies, recovering leads, and booking customers today.</p>
          <div className="cta-btns">
            <a href="/signup" className="btn btn-brand btn-lg">Start free — no card needed <Ic name="arrow-right" size={15} /></a>
           
