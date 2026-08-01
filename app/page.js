"use client"

import { useState, useEffect, useRef } from "react"
import MarketingNav from "@/components/MarketingNav"
import MarketingFooter from "@/components/MarketingFooter"

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
  { k: "booking", label: "Booking flow", sub: "End-to-end in 4 messages", icon: "calendar" },
  { k: "hindi", label: "Hindi support", sub: "Auto-detected per chat", icon: "globe" },
  { k: "winback", label: "Win-back", sub: "Inactive customer recovery", icon: "refresh" },
]

const TESTIMONIALS = [
  { name: "Priya Nair", biz: "Glow Parlour, Hyderabad", result: "+43%", resultLabel: "bookings in month one", quote: "I was losing Saturday night bookings because nobody replied after 8 PM. Customers now book at midnight and wake up to a confirmation. It paid for itself in the first week.", initial: "P" },
  { name: "Dr. Ravi Sharma", biz: "Skin First Clinic, Vijayawada", result: "₹22k", resultLabel: "saved per month", quote: "My patients message in Telugu and Fastrill replies in Telugu, books the slot, and follows up if they go quiet. I had to see it to believe it wasn't a person.", initial: "R" },
  { name: "Sneha Reddy", biz: "Studio S, 2 branches, Bangalore", result: "0", resultLabel: "missed messages", quote: "Two branches, both inboxes handled at once. Our staff stopped checking phones and started focusing on the customer in front of them.", initial: "S" },
]

function Ic({ name, size = 20 }) {
  const c = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" }
  switch (name) {
    case "check": return <svg {...c} strokeWidth={2.2}><path d="M20 6L9 17l-5-5" /></svg>
    case "arrow": return <svg {...c} strokeWidth={2}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    case "x": return <svg {...c} strokeWidth={2}><path d="M5 5l14 14M19 5L5 19" /></svg>
    case "globe": return <svg {...c}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
    case "shield": return <svg {...c}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
    case "clock": return <svg {...c}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
    case "msg": return <svg {...c}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
    case "calendar": return <svg {...c}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
    case "send": return <svg {...c}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" /></svg>
    case "inbox": return <svg {...c}><path d="M22 12h-6l-2 3H10l-2-3H2" /><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" /></svg>
    case "refresh": return <svg {...c}><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
    case "chart": return <svg {...c}><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
    case "users": return <svg {...c}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
    case "settings": return <svg {...c}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
    default: return null
  }
}

export default function FastrillLanding() {
  const [demoKey, setDemoKey] = useState("booking")
  const [demoMsgs, setDemoMsgs] = useState([])
  const [billing, setBilling] = useState("monthly")
  const demoRef = useRef(null)

  useEffect(() => {
    setDemoMsgs([])
    const msgs = DEMOS[demoKey]
    const timers = msgs.map((m, i) => setTimeout(() => {
      setDemoMsgs(p => [...p, m])
      if (demoRef.current) demoRef.current.scrollTop = 9999
    }, 500 + i * 1000))
    return () => timers.forEach(clearTimeout)
  }, [demoKey])

  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target) } }),
      { threshold: 0.05, rootMargin: "0px 0px -20px 0px" }
    )
    document.querySelectorAll(".fade").forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  const plans = [
    { tier: "Starter", monthly: 999, tag: "Solo operators & new businesses", cta: "Get started", cs: "out", feats: [["inc", "1 WhatsApp number"], ["inc", "300 conversations / month"], ["inc", "Booking automation"], ["inc", "10+ Indian languages"], ["inc", "Bulk WhatsApp campaigns"], ["exc", "Lead recovery sequences"], ["exc", "Appointment reminders"], ["exc", "Revenue analytics"]] },
    { tier: "Growth", monthly: 1999, tag: "For growing businesses", cta: "Start free trial", cs: "go", pop: true, feats: [["inc", "1 WhatsApp number"], ["inc", "Unlimited conversations"], ["inc", "Customer memory & context"], ["inc", "Lead recovery sequences"], ["inc", "Appointment reminders"], ["inc", "Revenue analytics"]] },
    { tier: "Pro", monthly: 4999, tag: "Multi-branch teams", cta: "Contact sales", cs: "out", feats: [["inc", "Up to 5 WhatsApp numbers"], ["inc", "Everything in Growth"], ["inc", "Multi-branch management"], ["inc", "Dedicated onboarding"], ["inc", "Priority support"]] },
  ]

  return (
    <div style={{ background: "#fff", color: "#374151", fontFamily: "'Inter',system-ui,sans-serif", minHeight: "100vh" }}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{-webkit-font-smoothing:antialiased;overflow-x:hidden;background:#fff}

        /* ── FADE IN ── */
        .fade{opacity:0;transform:translateY(16px);transition:opacity .5s ease,transform .5s ease}
        .fade.in{opacity:1;transform:none}
        @media(prefers-reduced-motion:reduce){.fade{opacity:1 !important;transform:none !important;transition:none}}

        /* ── BUTTONS ── */
        .btn-primary{display:inline-flex;align-items:center;gap:8px;background:#5A5FE8;color:#fff;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;transition:background .15s,transform .1s;border:none;cursor:pointer;font-family:inherit;white-space:nowrap}
        .btn-primary:hover{background:#4449D0;transform:translateY(-1px)}
        .btn-secondary{display:inline-flex;align-items:center;gap:8px;background:#fff;color:#374151;padding:14px 24px;border-radius:10px;font-weight:600;font-size:15px;text-decoration:none;border:1.5px solid #E5E7EB;transition:border-color .15s,background .15s;white-space:nowrap}
        .btn-secondary:hover{border-color:#9CA3AF;background:#F9FAFB}

        /* ── HERO ── */
        .hero{padding:clamp(108px,14vh,160px) clamp(16px,4vw,52px) clamp(60px,8vw,100px);background:#fff}
        .hero-inner{max-width:1120px;margin:0 auto;display:grid;grid-template-columns:1.1fr 0.9fr;gap:clamp(40px,6vw,80px);align-items:center}
        .hero-eyebrow{display:inline-flex;align-items:center;gap:8px;background:#EEF0FF;color:#5A5FE8;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:6px 14px;border-radius:100px;margin-bottom:24px}
        .hero-h1{font-size:clamp(36px,5vw,60px);font-weight:800;color:#111827;line-height:1.08;letter-spacing:-.03em;margin-bottom:22px;font-family:'Plus Jakarta Sans',sans-serif}
        .hero-h1 em{font-style:normal;color:#5A5FE8}
        .hero-sub{font-size:clamp(15px,1.6vw,18px);color:#6B7280;line-height:1.75;max-width:500px;margin-bottom:32px}
        .hero-sub strong{color:#374151;font-weight:600}
        .hero-btns{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:28px}
        .hero-trust{display:flex;align-items:center;gap:20px;font-size:13px;color:#9CA3AF;flex-wrap:wrap}
        .hero-trust span{display:flex;align-items:center;gap:6px;color:#6B7280}
        .hero-trust svg{color:#5A5FE8}
        @media(max-width:860px){
          .hero-inner{grid-template-columns:1fr;text-align:center}
          .hero-sub{margin-left:auto;margin-right:auto}
          .hero-btns{justify-content:center}
          .hero-trust{justify-content:center}
          .hero-eyebrow{margin:0 auto 24px}
        }

        /* ── PHONE MOCK ── */
        .ph-wrap{display:flex;justify-content:center;position:relative}
        .ph-wrap::before{content:'';position:absolute;width:380px;height:380px;border-radius:50%;background:radial-gradient(circle,rgba(90,95,232,.12) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%)}
        .ph-frame{position:relative;z-index:1;width:270px;background:#1a1a1a;border-radius:36px;padding:9px;box-shadow:0 32px 80px rgba(0,0,0,.2),0 0 0 1px rgba(255,255,255,.08)}
        .ph-screen{border-radius:28px;overflow:hidden;background:#EFE7DB;display:flex;flex-direction:column;height:500px}
        .ph-status{background:#075E54;color:#fff;font-size:9px;display:flex;justify-content:space-between;padding:6px 14px 0;font-weight:600}
        .ph-head{background:#075E54;color:#fff;display:flex;align-items:center;gap:9px;padding:8px 12px 10px}
        .ph-avatar{width:30px;height:30px;border-radius:50%;background:#F3C26B;color:#7C3E0A;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0}
        .ph-name{font-size:12.5px;font-weight:600;line-height:1.2}
        .ph-onl{font-size:9px;opacity:.85}
        .ph-chat{flex:1;padding:11px 9px;display:flex;flex-direction:column;gap:6px;overflow:hidden;background-color:#EFE7DB;background-image:radial-gradient(rgba(0,0,0,.04) 1px,transparent 1px);background-size:18px 18px}
        .ph-bub{max-width:82%;padding:7px 10px 5px;border-radius:9px;font-size:11px;line-height:1.45;color:#1B1B18;animation:phin .3s ease both;white-space:pre-wrap}
        .ph-bub.c{background:#DCF8C6;align-self:flex-end;border-top-right-radius:2px}
        .ph-bub.a{background:#fff;align-self:flex-start;border-top-left-radius:2px}
        .ph-time{display:block;font-size:8px;color:rgba(0,0,0,.4);text-align:right;margin-top:2px}
        .ph-time .tick{color:#4FB6EC}
        @keyframes phin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .ph-typing{align-self:flex-start;background:#fff;border-radius:9px;border-top-left-radius:2px;padding:10px 13px;display:flex;gap:4px;animation:phin .25s ease both}
        .ph-typing i{width:5px;height:5px;border-radius:50%;background:#999;animation:phdot 1.1s infinite}
        .ph-typing i:nth-child(2){animation-delay:.18s}
        .ph-typing i:nth-child(3){animation-delay:.36s}
        @keyframes phdot{0%,60%,100%{opacity:.35;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}
        .ph-card{align-self:flex-start;max-width:88%;background:#fff;border-radius:10px;border-top-left-radius:2px;box-shadow:0 1px 2px rgba(0,0,0,.12);overflow:hidden;animation:phin .3s ease both}
        .ph-card-top{display:flex;align-items:center;gap:8px;background:#F0FAF0;padding:8px 11px;border-bottom:1px solid #E4EDE2}
        .ph-card-check{width:18px;height:18px;border-radius:50%;background:#25A55A;color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .ph-card-title{font-size:11px;font-weight:700;color:#14532D}
        .ph-card-body{padding:8px 11px 6px}
        .ph-card-row{display:flex;justify-content:space-between;gap:12px;font-size:10px;color:#555;padding:2px 0}
        .ph-card-row b{color:#1B1B18;font-weight:600}
        .ph-card-foot{font-size:8.5px;color:rgba(0,0,0,.4);padding:0 11px 7px;display:flex;justify-content:space-between}
        .ph-card-foot .tick{color:#4FB6EC}
        .ph-bar{display:flex;align-items:center;gap:7px;padding:7px 9px;background:#F2EBDF}
        .ph-bar-input{flex:1;background:#fff;border-radius:100px;font-size:10px;color:#AAA;padding:7px 11px}
        .ph-bar-send{width:28px;height:28px;border-radius:50%;background:#00897B;color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        @media(max-width:860px){.ph-frame{width:240px}.ph-screen{height:440px}}

        /* ── STATS STRIP ── */
        .stats-strip{border-top:1px solid #F3F4F6;border-bottom:1px solid #F3F4F6;background:#F9FAFB;padding:28px clamp(16px,4vw,52px)}
        .stats-strip-inner{max-width:1120px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:16px;text-align:center}
        .stats-strip-inner b{display:block;font-size:26px;font-weight:800;color:#111827;letter-spacing:-.02em;font-family:'Plus Jakarta Sans',sans-serif}
        .stats-strip-inner span{font-size:13px;color:#6B7280;margin-top:4px;display:block}
        @media(max-width:600px){.stats-strip-inner{grid-template-columns:repeat(2,1fr)}}

        /* ── SECTIONS ── */
        .sec{padding:clamp(64px,8vw,100px) clamp(16px,4vw,52px)}
        .sec-alt{background:#F9FAFB}
        .sec-inner{max-width:1120px;margin:0 auto}
        .sec-label{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#5A5FE8;margin-bottom:14px}
        .sec-h2{font-size:clamp(26px,3.5vw,42px);font-weight:800;color:#111827;letter-spacing:-.03em;line-height:1.12;margin-bottom:14px;font-family:'Plus Jakarta Sans',sans-serif}
        .sec-h2 em{font-style:normal;color:#5A5FE8}
        .sec-lead{font-size:16px;color:#6B7280;line-height:1.75;max-width:540px}

        /* ── TIMELINE ── */
        .timeline{margin-top:44px;border:1px solid #E5E7EB;border-radius:16px;overflow:hidden}
        .tl-row{display:grid;grid-template-columns:110px 1fr;gap:24px;align-items:flex-start;padding:20px 24px;border-bottom:1px solid #F3F4F6}
        .tl-row:last-child{border-bottom:none}
        .tl-time{font-size:15px;font-weight:700;color:#9CA3AF;font-variant-numeric:tabular-nums;padding-top:2px}
        .tl-row.danger .tl-time{color:#EF4444}
        .tl-event{font-size:15px;font-weight:700;color:#111827;margin-bottom:3px}
        .tl-row.danger .tl-event{color:#EF4444}
        .tl-desc{font-size:13.5px;color:#6B7280;line-height:1.6}
        @media(max-width:500px){.tl-row{grid-template-columns:1fr;gap:4px;padding:16px 16px}}

        /* ── PROBLEM CARDS ── */
        .cards3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:44px}
        .card{background:#fff;border:1.5px solid #E5E7EB;border-radius:16px;padding:28px 24px}
        .card-num{font-size:12px;font-weight:700;letter-spacing:.06em;color:#5A5FE8;margin-bottom:12px}
        .card-title{font-size:16px;font-weight:700;color:#111827;margin-bottom:8px}
        .card-desc{font-size:14px;color:#6B7280;line-height:1.7}
        .card-tag{display:inline-block;margin-top:16px;font-size:11.5px;font-weight:600;color:#EF4444;background:#FEF2F2;border-radius:6px;padding:3px 10px}
        @media(max-width:700px){.cards3{grid-template-columns:1fr}}

        /* ── MODULES ── */
        .module{display:grid;grid-template-columns:1fr 1fr;gap:clamp(32px,5vw,72px);align-items:center;padding:52px 0;border-bottom:1px solid #F3F4F6}
        .module:last-child{border-bottom:none}
        .module.rev .module-text{order:2}
        .module.rev .module-vis{order:1}
        .module-tag{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#5A5FE8;margin-bottom:12px;display:flex;align-items:center;gap:8px}
        .module-title{font-size:clamp(20px,2.5vw,28px);font-weight:800;color:#111827;letter-spacing:-.025em;line-height:1.2;margin-bottom:10px;font-family:'Plus Jakarta Sans',sans-serif}
        .module-desc{font-size:14.5px;color:#6B7280;line-height:1.75;margin-bottom:18px}
        .module-list{list-style:none;display:flex;flex-direction:column;gap:10px}
        .module-list li{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:#374151}
        .module-list li svg{color:#5A5FE8;flex-shrink:0;margin-top:2px}
        .mock{background:#fff;border:1.5px solid #E5E7EB;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06);max-width:420px;margin:0 auto}
        .mock-hd{background:#F9FAFB;padding:12px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #E5E7EB}
        .mock-av{width:32px;height:32px;border-radius:50%;background:#EEF0FF;color:#5A5FE8;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0}
        .mock-name{font-size:13px;font-weight:700;color:#111827}
        .mock-sub{font-size:10.5px;color:#5A5FE8}
        .mock-body{padding:16px;display:flex;flex-direction:column;gap:8px}
        .bub{max-width:82%;padding:9px 12px;border-radius:12px;font-size:12.5px;line-height:1.5;white-space:pre-wrap}
        .bub.c{background:#F3F4F6;color:#374151;align-self:flex-start;border-bottom-left-radius:4px}
        .bub.a{background:#EEF0FF;color:#3730A3;align-self:flex-end;border-bottom-right-radius:4px}
        .bub-ts{font-size:9.5px;color:#9CA3AF;align-self:flex-end}
        .dash-body{padding:20px}
        .dash-title{font-weight:700;font-size:13.5px;color:#111827;margin-bottom:16px}
        .dash-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
        .dash-kpi-l{font-size:10.5px;color:#9CA3AF;margin-bottom:3px}
        .dash-kpi-v{font-weight:700;font-size:18px;color:#111827;letter-spacing:-.01em}
        .dash-kpi-v.accent{color:#5A5FE8}
        .dash-roi{background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:12px 14px}
        .dash-roi-row{display:flex;justify-content:space-between;font-size:12.5px;color:#6B7280;padding:4px 0}
        .dash-roi-row strong{color:#111827}
        .dash-roi-row strong.accent{color:#5A5FE8}
        .inbox-row{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid #F3F4F6}
        .inbox-row:last-child{border-bottom:none}
        .inbox-mid{flex:1;min-width:0}
        .inbox-name{font-size:13px;font-weight:600;color:#111827;margin-bottom:2px}
        .inbox-msg{font-size:11.5px;color:#9CA3AF;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .pill{font-size:9.5px;font-weight:700;padding:3px 9px;border-radius:100px;background:#EEF0FF;color:#5A5FE8;flex-shrink:0}
        .pill.off{background:#F3F4F6;color:#9CA3AF}
        @media(max-width:800px){.module,.module.rev{grid-template-columns:1fr}.module.rev .module-text{order:1}.module.rev .module-vis{order:2}}

        /* ── DEMO ── */
        .demo-grid{display:grid;grid-template-columns:220px 1fr;gap:16px;margin-top:40px;align-items:start}
        .demo-tabs{display:flex;flex-direction:column;gap:8px}
        .demo-tab{background:#fff;border:1.5px solid #E5E7EB;border-radius:12px;padding:14px 16px;cursor:pointer;text-align:left;font-family:inherit;width:100%;transition:border-color .15s}
        .demo-tab:hover{border-color:#C7C9F8}
        .demo-tab.on{border-color:#5A5FE8;background:#EEF0FF}
        .demo-tab-icon{color:#5A5FE8;margin-bottom:8px}
        .demo-tab-label{font-size:13.5px;font-weight:700;color:#111827;margin-bottom:2px}
        .demo-tab-sub{font-size:11.5px;color:#9CA3AF}
        .demo-wa{background:#fff;border:1.5px solid #E5E7EB;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.06)}
        .demo-wa-body{padding:16px;min-height:260px;max-height:320px;display:flex;flex-direction:column;gap:8px;overflow-y:auto;scrollbar-width:none}
        .demo-wa-body::-webkit-scrollbar{display:none}
        .demo-wa-body .bub{font-size:13px;animation:msgin .2s ease both}
        @keyframes msgin{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
        @media(max-width:680px){.demo-grid{grid-template-columns:1fr}.demo-tabs{display:grid;grid-template-columns:repeat(3,1fr)}}

        /* ── BEFORE/AFTER ── */
        .ba-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:44px}
        .ba-col{background:#fff;border:1.5px solid #E5E7EB;border-radius:16px;overflow:hidden}
        .ba-col.after{border-color:#C7C9F8}
        .ba-head{padding:14px 20px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
        .ba-head.before{background:#FEF2F2;color:#DC2626;border-bottom:1px solid #FEE2E2}
        .ba-head.after{background:#EEF0FF;color:#5A5FE8;border-bottom:1px solid #C7C9F8}
        .ba-list{list-style:none;padding:16px 20px;display:flex;flex-direction:column;gap:12px}
        .ba-list li{display:flex;align-items:flex-start;gap:10px;font-size:13.5px}
        .ba-list.before li{color:#6B7280}
        .ba-list.after li{color:#374151;font-weight:500}
        @media(max-width:600px){.ba-grid{grid-template-columns:1fr}}

        /* ── COMPETITOR TABLE ── */
        .vs-wrap{overflow-x:auto;margin-top:44px;border:1.5px solid #E5E7EB;border-radius:16px}
        .vs-table{width:100%;border-collapse:collapse;font-size:13.5px;min-width:580px}
        .vs-table th{padding:14px 18px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9CA3AF;background:#F9FAFB;border-bottom:1.5px solid #E5E7EB;text-align:left}
        .vs-table th.hl{background:#EEF0FF;color:#5A5FE8;border-bottom-color:#C7C9F8}
        .vs-table td{padding:13px 18px;border-bottom:1px solid #F3F4F6;color:#6B7280;vertical-align:middle}
        .vs-table tr:last-child td{border-bottom:none}
        .vs-table td.hl{background:#F5F6FF;font-weight:600;color:#111827}
        .vs-table td.feat{font-weight:500;color:#374151;max-width:210px}
        .vs-yes{color:#16A34A;font-weight:700}
        .vs-no{color:#D1D5DB}
        .vs-part{color:#D97706;font-weight:600}

        /* ── TESTIMONIALS ── */
        .tgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:44px}
        .tcard{background:#fff;border:1.5px solid #E5E7EB;border-radius:16px;padding:28px;display:flex;flex-direction:column}
        .tcard-metric{font-size:30px;font-weight:800;color:#5A5FE8;letter-spacing:-.02em;line-height:1;font-family:'Plus Jakarta Sans',sans-serif}
        .tcard-metric-l{font-size:12px;color:#9CA3AF;margin:5px 0 20px}
        .tcard-q{font-size:14px;color:#374151;line-height:1.75;flex:1}
        .tcard-auth{display:flex;align-items:center;gap:10px;margin-top:20px;padding-top:16px;border-top:1px solid #F3F4F6}
        .tcard-av{width:36px;height:36px;border-radius:50%;background:#EEF0FF;color:#5A5FE8;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0}
        .tcard-name{font-size:13.5px;font-weight:700;color:#111827}
        .tcard-biz{font-size:12px;color:#9CA3AF;margin-top:2px}
        @media(max-width:800px){.tgrid{grid-template-columns:1fr;max-width:440px;margin-left:auto;margin-right:auto}}

        /* ── HOW IT WORKS ── */
        .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:48px}
        .step{background:#fff;border:1.5px solid #E5E7EB;border-radius:16px;padding:28px 24px}
        .step-num{width:36px;height:36px;border-radius:50%;background:#5A5FE8;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;margin-bottom:16px;font-family:'Plus Jakarta Sans',sans-serif}
        .step-title{font-size:16px;font-weight:700;color:#111827;margin-bottom:8px}
        .step-desc{font-size:14px;color:#6B7280;line-height:1.7}
        @media(max-width:700px){.steps{grid-template-columns:1fr}}

        /* ── INDUSTRIES ── */
        .ind-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:44px}
        .ind-card{background:#fff;border:1.5px solid #E5E7EB;border-radius:16px;padding:24px;text-decoration:none;display:flex;flex-direction:column;gap:10px;transition:border-color .15s,box-shadow .15s}
        .ind-card:hover{border-color:#C7C9F8;box-shadow:0 4px 20px rgba(90,95,232,.08)}
        .ind-emoji{font-size:28px}
        .ind-title{font-size:15.5px;font-weight:700;color:#111827}
        .ind-desc{font-size:13.5px;color:#6B7280;line-height:1.6;flex:1}
        .ind-link{font-size:12.5px;font-weight:700;color:#5A5FE8;display:flex;align-items:center;gap:4px;margin-top:4px}
        @media(max-width:700px){.ind-grid{grid-template-columns:1fr 1fr}}
        @media(max-width:440px){.ind-grid{grid-template-columns:1fr}}

        /* ── PRICING ── */
        .billing-toggle{display:inline-flex;align-items:center;background:#F3F4F6;border-radius:100px;padding:4px;margin:20px auto 40px}
        .bt{padding:9px 20px;border-radius:100px;font-size:13.5px;font-weight:600;border:none;background:transparent;color:#6B7280;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:7px;transition:background .15s,color .15s}
        .bt.on{background:#fff;color:#111827;box-shadow:0 1px 4px rgba(0,0,0,.1)}
        .bt-save{font-size:10px;font-weight:700;padding:2px 8px;border-radius:100px;background:#DCFCE7;color:#15803D}
        .pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
        .plan{background:#fff;border:1.5px solid #E5E7EB;border-radius:18px;padding:clamp(22px,3vw,30px);position:relative;display:flex;flex-direction:column}
        .plan.pop{border-color:#5A5FE8;box-shadow:0 8px 32px rgba(90,95,232,.12)}
        .plan-badge{position:absolute;top:0;left:24px;transform:translateY(-50%);background:#5A5FE8;color:#fff;font-size:11px;font-weight:700;padding:4px 14px;border-radius:100px}
        .plan-tier{font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#9CA3AF;margin-bottom:4px}
        .plan-tag{font-size:13px;color:#9CA3AF;margin-bottom:16px}
        .plan-price{display:flex;align-items:baseline;gap:2px}
        .plan-rs{font-size:17px;font-weight:600;color:#374151}
        .plan-amt{font-size:clamp(34px,4vw,44px);font-weight:800;color:#111827;letter-spacing:-.03em;font-family:'Plus Jakarta Sans',sans-serif}
        .plan-mo{font-size:12px;color:#9CA3AF;margin:4px 0 16px}
        .plan-hr{border:none;border-top:1px solid #F3F4F6;margin:12px 0 14px}
        .plan-feats{list-style:none;display:flex;flex-direction:column;gap:10px;margin-bottom:22px;flex:1}
        .plan-feats li{display:flex;align-items:flex-start;gap:9px;font-size:13.5px;color:#374151}
        .plan-feats li svg{color:#5A5FE8;flex-shrink:0;margin-top:2px}
        .plan-feats li.exc{color:#D1D5DB}
        .plan-feats li.exc svg{color:#D1D5DB}
        .plan-btn{display:block;text-align:center;padding:13px;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;transition:background .15s}
        .plan-btn.go{background:#5A5FE8;color:#fff}
        .plan-btn.go:hover{background:#4449D0}
        .plan-btn.out{background:#F9FAFB;color:#374151;border:1.5px solid #E5E7EB}
        .plan-btn.out:hover{background:#F3F4F6}
        @media(max-width:800px){.pgrid{grid-template-columns:1fr;max-width:420px;margin:0 auto}}

        /* ── FAQ ── */
        .faq-list{max-width:680px;margin:44px auto 0}
        .fi{border-bottom:1px solid #F3F4F6}
        .fi:first-child{border-top:1px solid #F3F4F6}
        .fb{width:100%;background:none;border:none;padding:20px 0;text-align:left;font-size:15px;font-weight:600;color:#111827;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:14px;font-family:inherit}
        .fp{width:24px;height:24px;border-radius:50%;border:1.5px solid #E5E7EB;display:flex;align-items:center;justify-content:center;font-size:14px;color:#9CA3AF;flex-shrink:0;transition:transform .2s,color .2s,border-color .2s}
        .fa{font-size:14.5px;color:#6B7280;line-height:1.8;max-height:0;overflow:hidden;transition:max-height .3s ease,padding .3s ease}
        .fi.op .fa{max-height:220px;padding:0 0 20px}
        .fi.op .fp{color:#5A5FE8;border-color:#5A5FE8;transform:rotate(45deg)}

        /* ── CTA SECTION ── */
        .cta-sec{background:linear-gradient(135deg,#5A5FE8 0%,#7C3AED 100%);padding:clamp(60px,8vw,100px) clamp(16px,4vw,52px);text-align:center}
        .cta-sec h2{font-size:clamp(28px,4vw,48px);font-weight:800;color:#fff;letter-spacing:-.03em;margin-bottom:14px;font-family:'Plus Jakarta Sans',sans-serif}
        .cta-sec p{font-size:16px;color:rgba(255,255,255,.8);margin-bottom:32px}
        .btn-white{display:inline-flex;align-items:center;gap:8px;background:#fff;color:#5A5FE8;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;transition:background .15s}
        .btn-white:hover{background:#F5F6FF}
        .btn-ghost{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.15);color:#fff;padding:14px 24px;border-radius:10px;font-weight:600;font-size:15px;text-decoration:none;border:1.5px solid rgba(255,255,255,.3);transition:background .15s}
        .btn-ghost:hover{background:rgba(255,255,255,.22)}
        .cta-note{margin-top:18px;font-size:13px;color:rgba(255,255,255,.6)}

        .center{text-align:center}
        .center .sec-lead{margin-left:auto;margin-right:auto}
      `}</style>

      <MarketingNav />

      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="hero-eyebrow">AI-powered WhatsApp automation</div>
            <h1 className="hero-h1">
              Your leads are messaging.<br />
              <em>Nobody is replying.</em>
            </h1>
            <p className="hero-sub">
              Most Indian businesses reply in <strong>hours</strong> — or never. Fastrill replies in <strong>under 2 seconds</strong>, understands the customer in their language, and books the appointment automatically.
            </p>
            <div className="hero-btns">
              <a href="/signup" className="btn-primary">Start free trial →</a>
              <a href="#demo" className="btn-secondary">See it live</a>
            </div>
            <div className="hero-trust">
              <span><Ic name="shield" size={13} /> No credit card</span>
              <span><Ic name="clock" size={13} /> Setup in 10 minutes</span>
              <span><Ic name="globe" size={13} /> 10+ Indian languages</span>
            </div>
          </div>
          <div className="ph-wrap">
            <PhoneDemo />
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="stats-strip">
        <div className="stats-strip-inner fade in">
          {[["3,200+", "Bookings automated monthly"], ["99%", "Message delivery rate"], ["1.8s", "Average reply time"], ["10+", "Indian languages"]].map(([n, l]) => (
            <div key={l}><b>{n}</b><span>{l}</span></div>
          ))}
        </div>
      </div>

      {/* PROBLEM */}
      <section className="sec">
        <div className="sec-inner">
          <div className="fade center">
            <div className="sec-label">The real problem</div>
            <h2 className="sec-h2">Your ads are working.<br />Your follow-up isn't.</h2>
            <p className="sec-lead center">Most businesses spend thousands getting leads to message them. The money walks out in the WhatsApp inbox.</p>
          </div>
          <div className="cards3">
            {[
              { n: "01", t: "Leads die after hours", d: "A customer messages at 10 PM about your bridal package. You see it at 9 AM — she's already booked someone who replied in 2 minutes.", tag: "Revenue lost every night" },
              { n: "02", t: "Speed wins the booking", d: "Your competitor replies in 2 seconds. You reply in 2 hours. Same service, same price — they win the appointment every time.", tag: "Competitive disadvantage" },
              { n: "03", t: "Silence becomes a bad review", d: "An upset customer messages at peak hour. Your staff is busy. The message sits unread. The 1-star review doesn't.", tag: "Reputation at risk" },
            ].map(p => (
              <div key={p.n} className="card fade">
                <div className="card-num">{p.n}</div>
                <div className="card-title">{p.t}</div>
                <p className="card-desc">{p.d}</p>
                <div className="card-tag">{p.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="sec sec-alt">
        <div className="sec-inner">
          <div className="fade">
            <div className="sec-label">A real scenario</div>
            <h2 className="sec-h2" style={{ maxWidth: 520 }}>What happens when you don&apos;t reply instantly</h2>
          </div>
          <div className="timeline fade">
            {[
              { time: "9:02 PM", event: "Customer messages you", desc: "Ready to book. Service: keratin treatment. Budget: ₹2,800." },
              { time: "9:45 PM", event: "You finally reply", desc: "Too late — they already asked your competitor." },
              { time: "10:12 PM", event: "Customer booked elsewhere", desc: "Your competitor replied in 2 minutes." },
              { time: "—", event: "₹2,800 lost. Plus lifetime value.", desc: "₹2,800 this booking + referrals ≈ ₹12,000+ over time", danger: true },
            ].map(row => (
              <div key={row.event} className={`tl-row${row.danger ? " danger" : ""}`}>
                <div className="tl-time">{row.time}</div>
                <div>
                  <div className="tl-event">{row.event}</div>
                  <div className="tl-desc">{row.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT */}
      <section className="sec" id="product">
        <div className="sec-inner">
          <div className="fade">
            <div className="sec-label">What&apos;s inside</div>
            <h2 className="sec-h2">Not a chatbot. A revenue system.</h2>
            <p className="sec-lead">Three modules that work together to turn every WhatsApp conversation into money in your bank.</p>
          </div>

          <div className="module">
            <div className="module-text fade">
              <div className="module-tag"><Ic name="calendar" size={14} /> 01 · Booking engine</div>
              <h3 className="module-title">Books the appointment, start to finish.</h3>
              <p className="module-desc">Service, date, time, confirmation — collected naturally, checked against real availability, and confirmed without a human touching it.</p>
              <ul className="module-list">
                <li><Ic name="check" size={14} />Understands casual, mixed-language messages</li>
                <li><Ic name="check" size={14} />Checks real slot availability before confirming</li>
                <li><Ic name="check" size={14} />Sends instant notification to the owner</li>
                <li><Ic name="check" size={14} />Handles rescheduling and cancellation</li>
              </ul>
            </div>
            <div className="module-vis fade">
              <div className="mock">
                <div className="mock-hd">
                  <div className="mock-av">R</div>
                  <div><div className="mock-name">Riya Salon</div><div className="mock-sub">Online</div></div>
                </div>
                <div className="mock-body">
                  <div className="bub c">Hi, I want a haircut tomorrow around 3pm</div>
                  <div className="bub a">{"Tomorrow's great — 3 PM is available.\n\nShall I confirm Haircut for tomorrow at 3:00 PM?"}</div>
                  <div className="bub c">Yes please!</div>
                  <div className="bub a">{"Booking confirmed.\n\nHaircut · Tomorrow · 3:00 PM\n\nSee you then! 🙏"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="module rev">
            <div className="module-text fade">
              <div className="module-tag"><Ic name="send" size={14} /> 02 · WhatsApp Campaigns</div>
              <h3 className="module-title">See exactly what each campaign earned.</h3>
              <p className="module-desc">Send approved WhatsApp templates to customer segments, and track delivery, replies and revenue attributed to that exact send.</p>
              <ul className="module-list">
                <li><Ic name="check" size={14} />Segment by tag — new, returning, VIP, inactive</li>
                <li><Ic name="check" size={14} />Real Meta delivery and read tracking</li>
                <li><Ic name="check" size={14} />Revenue and ROI per campaign, not just opens</li>
                <li><Ic name="check" size={14} />Schedule sends for optimal timing</li>
              </ul>
            </div>
            <div className="module-vis fade">
              <div className="mock">
                <div className="dash-body">
                  <div className="dash-title">Winter offer — January</div>
                  <div className="dash-kpis">
                    <div><div className="dash-kpi-l">Sent</div><div className="dash-kpi-v">412</div></div>
                    <div><div className="dash-kpi-l">Delivered</div><div className="dash-kpi-v">404</div></div>
                    <div><div className="dash-kpi-l">Replied</div><div className="dash-kpi-v accent">138</div></div>
                  </div>
                  <div className="dash-roi">
                    <div className="dash-roi-row"><span>Est. bookings</span><strong>82</strong></div>
                    <div className="dash-roi-row"><span>Est. revenue</span><strong>₹98,400</strong></div>
                    <div className="dash-roi-row"><span>ROI</span><strong className="accent">+612%</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="module">
            <div className="module-text fade">
              <div className="module-tag"><Ic name="inbox" size={14} /> 03 · Smart inbox</div>
              <h3 className="module-title">One inbox. Every conversation. Full control.</h3>
              <p className="module-desc">See every conversation live, take over manually whenever you want, and let Fastrill pick back up the moment you&apos;re done.</p>
              <ul className="module-list">
                <li><Ic name="check" size={14} />Take over any conversation in one tap</li>
                <li><Ic name="check" size={14} />Full customer history and tags in one view</li>
                <li><Ic name="check" size={14} />Works across 10+ Indian languages</li>
                <li><Ic name="check" size={14} />Real-time conversation updates</li>
              </ul>
            </div>
            <div className="module-vis fade">
              <div className="mock">
                {[
                  { n: "Priya Nair", m: "Yes please, book me for 3 PM", on: true },
                  { n: "Arjun Mehta", m: "Do you have dermatology also", on: true },
                  { n: "Sneha Reddy", m: "Thank you so much!", on: false },
                  { n: "Kiran Patel", m: "What time do you close?", on: true },
                ].map(c => (
                  <div key={c.n} className="inbox-row">
                    <div className="mock-av">{c.n.charAt(0)}</div>
                    <div className="inbox-mid"><div className="inbox-name">{c.n}</div><div className="inbox-msg">{c.m}</div></div>
                    <div className={`pill${c.on ? "" : " off"}`}>{c.on ? "Auto" : "You"}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section className="sec sec-alt" id="demo">
        <div className="sec-inner">
          <div className="fade center">
            <div className="sec-label">Live demo</div>
            <h2 className="sec-h2">See it convert in real time</h2>
            <p className="sec-lead center">Pick a scenario and watch Fastrill handle the entire conversation — any language, any hour.</p>
          </div>
          <div className="demo-grid">
            <div className="demo-tabs fade">
              {DEMO_META.map(s => (
                <button key={s.k} className={`demo-tab${demoKey === s.k ? " on" : ""}`} onClick={() => setDemoKey(s.k)}>
                  <div className="demo-tab-icon"><Ic name={s.icon} size={16} /></div>
                  <div className="demo-tab-label">{s.label}</div>
                  <div className="demo-tab-sub">{s.sub}</div>
                </button>
              ))}
            </div>
            <div className="demo-wa fade">
              <div className="mock-hd">
                <div className="mock-av">R</div>
                <div><div className="mock-name">Riya Salon</div><div className="mock-sub">Online</div></div>
              </div>
              <div className="demo-wa-body" ref={demoRef}>
                {demoMsgs.map((m, i) => <div key={`${demoKey}-${i}`} className={`bub ${m.r}`}>{m.m}</div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="sec">
        <div className="sec-inner">
          <div className="fade center">
            <div className="sec-label">Setup</div>
            <h2 className="sec-h2">Live in 10 minutes, not 10 days</h2>
            <p className="sec-lead center">No developers needed. No API docs. Just connect your WhatsApp and you&apos;re ready.</p>
          </div>
          <div className="steps">
            {[
              { n: "1", title: "Connect your WhatsApp", desc: "Link your WhatsApp Business number via the official Meta API — the same number your customers already know. Takes 3 minutes." },
              { n: "2", title: "Tell Fastrill about your business", desc: "Add your services, prices, working hours, and team. Fastrill learns your business and starts handling conversations exactly as you would." },
              { n: "3", title: "Watch it handle conversations", desc: "From the first message to the confirmed booking — Fastrill replies, qualifies, books, and follows up. You get notified when a booking lands." },
            ].map(s => (
              <div key={s.n} className="step fade">
                <div className="step-num">{s.n}</div>
                <div className="step-title">{s.title}</div>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section className="sec sec-alt">
        <div className="sec-inner">
          <div className="fade center">
            <div className="sec-label">The difference</div>
            <h2 className="sec-h2">Before Fastrill. After.</h2>
          </div>
          <div className="ba-grid fade">
            <div className="ba-col">
              <div className="ba-head before">Without Fastrill</div>
              <ul className="ba-list before">
                {["Reply in 8 hours — or never", "Miss bookings every night after 8 PM", "Customers move to competitor silently", "Staff glued to phones, ignoring clients", "No idea what WhatsApp messages converted"].map(t => (
                  <li key={t}><span style={{ color: "#EF4444", marginTop: 3 }}><Ic name="x" size={14} /></span>{t}</li>
                ))}
              </ul>
            </div>
            <div className="ba-col after">
              <div className="ba-head after">With Fastrill</div>
              <ul className="ba-list after">
                {["Reply in under 2 seconds — 24/7", "Books appointments at 2 AM automatically", "Every lead captured and followed up", "Staff focused on the customer in front of them", "Every booking tracked to source and campaign"].map(t => (
                  <li key={t}><span style={{ color: "#5A5FE8", marginTop: 3 }}><Ic name="check" size={14} /></span>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section className="sec">
        <div className="sec-inner">
          <div className="fade center">
            <div className="sec-label">Industries</div>
            <h2 className="sec-h2">Built for every service business in India</h2>
            <p className="sec-lead center">Whether you run a salon or a hospital — Fastrill speaks the language of your business and your customers.</p>
          </div>
          <div className="ind-grid">
            {[
              { emoji: "💇", title: "Salons & Spas", desc: "Book appointments, send reminders, win back silent customers. Your front desk — 24/7.", href: "/industries/salons" },
              { emoji: "🏥", title: "Clinics & Healthcare", desc: "Patient scheduling in Hindi, Telugu, Tamil and more. Reduce no-shows automatically.", href: "/industries/clinics" },
              { emoji: "📚", title: "Coaching & Education", desc: "Enroll students, send class reminders, and follow up with leads in their language.", href: "/industries/coaching" },
              { emoji: "🏠", title: "Real Estate", desc: "Qualify leads 24/7, schedule site visits, and nurture long sales cycles automatically.", href: "/industries/real-estate" },
              { emoji: "🏋️", title: "Gyms & Fitness", desc: "Fill time slots, renew memberships, and send class reminders without staff effort.", href: "/industries/gyms" },
              { emoji: "🍽️", title: "Restaurants & Cafés", desc: "Take reservations, handle delivery queries, and run re-engagement campaigns that fill tables.", href: "/signup" },
            ].map(ind => (
              <a key={ind.title} href={ind.href} className="ind-card fade">
                <div className="ind-emoji">{ind.emoji}</div>
                <div className="ind-title">{ind.title}</div>
                <p className="ind-desc">{ind.desc}</p>
                <div className="ind-link">Learn more <Ic name="arrow" size={11} /></div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="sec sec-alt">
        <div className="sec-inner">
          <div className="fade center">
            <div className="sec-label">What customers say</div>
            <h2 className="sec-h2">Real businesses. Real results.</h2>
          </div>
          <div className="tgrid">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="tcard fade">
                <div className="tcard-metric">{t.result}</div>
                <div className="tcard-metric-l">{t.resultLabel}</div>
                <p className="tcard-q">&ldquo;{t.quote}&rdquo;</p>
                <div className="tcard-auth">
                  <div className="tcard-av">{t.initial}</div>
                  <div>
                    <div className="tcard-name">{t.name}</div>
                    <div className="tcard-biz">{t.biz}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPETITOR COMPARISON */}
      <section className="sec">
        <div className="sec-inner">
          <div className="fade center">
            <div className="sec-label">How we compare</div>
            <h2 className="sec-h2">Why businesses choose <em>Fastrill</em></h2>
            <p className="sec-lead center">Most WhatsApp tools just broadcast. Fastrill actually understands, replies, and books — in your customer&apos;s language.</p>
          </div>
          <div className="vs-wrap fade">
            <table className="vs-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 200 }}>Feature</th>
                  <th className="hl">Fastrill</th>
                  <th>WATI</th>
                  <th>Interakt</th>
                  <th>WappBiz</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["AI conversations (not scripted)", "✓", "✗", "✗", "✗"],
                  ["Auto-booking via WhatsApp", "✓", "✗", "✗", "✗"],
                  ["10+ Indian languages, auto-detected", "✓", "✗", "Partial", "✗"],
                  ["Bulk WhatsApp campaigns", "✓", "✓", "✓", "✓"],
                  ["Lead recovery sequences", "✓", "Partial", "✗", "✗"],
                  ["Revenue attribution per campaign", "✓", "✗", "Partial", "✗"],
                  ["Starts at ₹999/month", "✓", "✗", "✗", "✗"],
                  ["Built for Indian SMBs", "✓", "✗", "Partial", "Partial"],
                  ["Replies in under 2 seconds", "✓", "✗", "✗", "✗"],
                ].map(([feat, f, wati, interakt, wbiz]) => (
                  <tr key={feat}>
                    <td className="feat">{feat}</td>
                    <td className="hl"><span className={f === "✓" ? "vs-yes" : "vs-no"}>{f}</span></td>
                    <td><span className={wati === "✓" ? "vs-yes" : wati === "Partial" ? "vs-part" : "vs-no"}>{wati}</span></td>
                    <td><span className={interakt === "✓" ? "vs-yes" : interakt === "Partial" ? "vs-part" : "vs-no"}>{interakt}</span></td>
                    <td><span className={wbiz === "✓" ? "vs-yes" : wbiz === "Partial" ? "vs-part" : "vs-no"}>{wbiz}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="fade center" style={{ marginTop: 16, fontSize: 12, color: "#9CA3AF" }}>Pricing and features based on publicly available information. Last checked July 2026.</p>
        </div>
      </section>

      {/* PRICING */}
      <section className="sec sec-alt" id="pricing">
        <div className="sec-inner">
          <div className="fade center">
            <div className="sec-label">Pricing</div>
            <h2 className="sec-h2">Simple pricing. Pays for itself.</h2>
            <p className="sec-lead center">One missed booking costs more than a month of Fastrill.</p>
          </div>
          <div className="fade center">
            <div className="billing-toggle">
              <button className={`bt${billing === "monthly" ? " on" : ""}`} onClick={() => setBilling("monthly")}>Monthly</button>
              <button className={`bt${billing === "annual" ? " on" : ""}`} onClick={() => setBilling("annual")}>Annual <span className="bt-save">Save 17%</span></button>
            </div>
          </div>
          <div className="pgrid">
            {plans.map(plan => {
              const price = billing === "annual" ? Math.round(plan.monthly * 0.83) : plan.monthly
              return (
                <div key={plan.tier} className={`plan fade${plan.pop ? " pop" : ""}`}>
                  {plan.pop && <div className="plan-badge">Most popular</div>}
                  <div className="plan-tier">{plan.tier}</div>
                  <div className="plan-tag">{plan.tag}</div>
                  <div className="plan-price"><span className="plan-rs">₹</span><span className="plan-amt">{price.toLocaleString("en-IN")}</span></div>
                  <div className="plan-mo">per month + GST{billing === "annual" && <span> · billed ₹{(price * 12).toLocaleString("en-IN")}/yr</span>}</div>
                  <hr className="plan-hr" />
                  <ul className="plan-feats">
                    {plan.feats.map(([c, t]) => (
                      <li key={t} className={c === "exc" ? "exc" : undefined}>
                        {c === "inc" ? <Ic name="check" size={13} /> : <Ic name="x" size={13} />}{t}
                      </li>
                    ))}
                  </ul>
                  <a href="/signup" className={`plan-btn ${plan.cs}`}>{plan.cta}</a>
                </div>
              )
            })}
          </div>
          <p className="fade center" style={{ marginTop: 24, fontSize: 13, color: "#9CA3AF" }}>14-day free trial · No credit card · Cancel anytime</p>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection />

      {/* CTA */}
      <section className="cta-sec">
        <h2>Turn every WhatsApp message into revenue</h2>
        <p>Start automating replies, recovering leads, and booking customers today.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/signup" className="btn-white">Start free trial →</a>
          <a href="https://wa.me/916309279265" className="btn-ghost"><Ic name="msg" size={15} /> Message us on WhatsApp</a>
        </div>
        <p className="cta-note">14-day free trial · Setup in 10 minutes · Cancel anytime</p>
      </section>

      <MarketingFooter />
    </div>
  )
}

const PHONE_SCRIPT = [
  { t: "c", m: "Namaste! Kal facial ho payega?", time: "9:41 PM" },
  { t: "typing", dur: 1100 },
  { t: "a", m: "Namaste Anita ji! Haan bilkul 🙏\nKal 11:00 AM ya 4:00 PM free hai.\nKaunsa time theek rahega?", time: "9:41 PM" },
  { t: "c", m: "4 baje perfect 👍", time: "9:42 PM" },
  { t: "typing", dur: 1100 },
  { t: "card", time: "9:42 PM" },
]

function PhoneDemo() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(PHONE_SCRIPT.length)
      return
    }
    const item = PHONE_SCRIPT[step]
    const delay = step >= PHONE_SCRIPT.length ? 3600 : (item.t === "typing" ? item.dur : 1250)
    const t = setTimeout(() => setStep(s => s >= PHONE_SCRIPT.length ? 0 : s + 1), delay)
    return () => clearTimeout(t)
  }, [step])

  const visible = PHONE_SCRIPT.slice(0, step + 1).filter((it, i) => it.t !== "typing" || i === step)

  return (
    <div className="ph-frame" aria-hidden="true">
      <div className="ph-screen">
        <div className="ph-status"><span>9:42</span><span>▂▄▆ ⌁ ▉</span></div>
        <div className="ph-head">
          <span style={{ fontSize: 16, opacity: .9 }}>‹</span>
          <div className="ph-avatar">L</div>
          <div>
            <div className="ph-name">Lakshmi Beauty Parlour</div>
            <div className="ph-onl">online</div>
          </div>
        </div>
        <div className="ph-chat">
          {visible.map((it, i) => {
            if (it.t === "typing") return <div key={`ty-${i}`} className="ph-typing"><i /><i /><i /></div>
            if (it.t === "card") return (
              <div key="card" className="ph-card">
                <div className="ph-card-top">
                  <div className="ph-card-check"><Ic name="check" size={10} /></div>
                  <div className="ph-card-title">Appointment Confirmed</div>
                </div>
                <div className="ph-card-body">
                  <div className="ph-card-row"><span>Service</span><b>Gold Facial</b></div>
                  <div className="ph-card-row"><span>Date</span><b>Kal · Sat, 29 March</b></div>
                  <div className="ph-card-row"><span>Time</span><b>4:00 PM</b></div>
                  <div className="ph-card-row"><span>Amount</span><b>₹1,200</b></div>
                </div>
                <div className="ph-card-foot"><span>Milte hai kal! 💐</span><span>{it.time} <span className="tick">✓✓</span></span></div>
              </div>
            )
            return (
              <div key={`${it.t}-${i}`} className={`ph-bub ${it.t}`}>
                {it.m}
                <span className="ph-time">{it.time}{it.t === "c" && <> <span className="tick">✓✓</span></>}</span>
              </div>
            )
          })}
        </div>
        <div className="ph-bar">
          <div className="ph-bar-input">Message</div>
          <div className="ph-bar-send"><Ic name="send" size={12} /></div>
        </div>
      </div>
    </div>
  )
}

function FAQSection() {
  const [open, setOpen] = useState(null)
  const faqs = [
    { q: "Do I need to change my WhatsApp number?", a: "No. You keep your existing WhatsApp Business number. Fastrill connects via Meta's official Business API — customers message the same number they always have." },
    { q: "How long does setup take?", a: "About 10 minutes from account creation to your first automatic reply. Connect WhatsApp, add your services and hours, go live." },
    { q: "Which Indian languages does Fastrill support?", a: "Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi and English — auto-detected per conversation. No configuration needed." },
    { q: "Can I take over and reply manually?", a: "Yes, always. Pause auto-replies for any conversation and reply yourself — Fastrill waits, and picks back up when you're done. You're always in control." },
    { q: "Is there a free trial?", a: "Yes — 14 days, full Growth plan access, no credit card required. If it doesn't pay for itself, you don't pay." },
    { q: "How is Fastrill different from a chatbot?", a: "Chatbots follow scripts. Fastrill understands context — it reads the customer's intent, checks your real availability, books the slot, and follows up if they go quiet. It's a revenue system, not a decision tree." },
  ]
  return (
    <section className="sec">
      <div className="sec-inner">
        <div className="fade center">
          <div className="sec-label">FAQ</div>
          <h2 className="sec-h2">Honest answers</h2>
        </div>
        <div className="faq-list fade">
          {faqs.map((f, i) => (
            <div key={i} className={`fi${open === i ? " op" : ""}`}>
              <button className="fb" onClick={() => setOpen(open === i ? null : i)}>{f.q}<span className="fp">+</span></button>
              <div className="fa">{f.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
