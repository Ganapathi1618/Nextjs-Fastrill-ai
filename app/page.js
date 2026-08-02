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
    { r: "a", m: "Booking ho gayi!\n\nFacial · ₹1,200\nKal, 29 March · 6:00 PM\n\nMilenge!" },
  ],
  winback: [
    { r: "a", m: "Hi Anita — it's been a while since your last visit.\n\nYour favourite keratin treatment is available this week, want to book?" },
    { r: "c", m: "Yes actually! What's the price?" },
    { r: "a", m: "Keratin Treatment is ₹2,800 (90 min). 10% off this week — ₹2,520." },
    { r: "c", m: "Book me Saturday morning" },
    { r: "a", m: "Booking confirmed.\n\nKeratin Treatment · ₹2,520\nSaturday, 29 March · 10:00 AM" },
  ],
}

const DEMO_META = [
  { k: "booking", label: "Booking flow", sub: "End-to-end in 4 messages", icon: "📅" },
  { k: "hindi", label: "Hindi support", sub: "Auto-detected per chat", icon: "🌐" },
  { k: "winback", label: "Win-back", sub: "Inactive customer recovery", icon: "🔁" },
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
        .fade{opacity:0;transform:translateY(16px);transition:opacity .5s ease,transform .5s ease}
        .fade.in{opacity:1;transform:none}
        @media(prefers-reduced-motion:reduce){.fade{opacity:1 !important;transform:none !important;transition:none}}

        /* HERO */
        .hero{padding:clamp(100px,13vh,150px) clamp(16px,4vw,52px) clamp(60px,8vw,100px);background:linear-gradient(160deg,#F0F7FF 0%,#fff 60%)}
        .hero-inner{max-width:1160px;margin:0 auto;display:grid;grid-template-columns:1.15fr 0.85fr;gap:clamp(40px,6vw,80px);align-items:center}
        .hero-badge{display:inline-flex;align-items:center;gap:8px;background:#fff;border:1.5px solid #DBEAFE;color:#1D6AF5;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:7px 16px;border-radius:100px;margin-bottom:26px;box-shadow:0 2px 8px rgba(29,106,245,.08)}
        .hero-badge-dot{width:7px;height:7px;border-radius:50%;background:#1D6AF5;animation:blink 1.6s infinite}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        .hero-h1{font-size:clamp(36px,5vw,62px);font-weight:800;color:#111827;line-height:1.07;letter-spacing:-.04em;margin-bottom:22px;font-family:'Plus Jakarta Sans',sans-serif}
        .hero-h1 em{font-style:normal;color:#1D6AF5}
        .hero-sub{font-size:clamp(15px,1.6vw,18px);color:#6B7280;line-height:1.78;max-width:500px;margin-bottom:32px}
        .hero-sub strong{color:#374151;font-weight:600}
        .hero-btns{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:32px}
        .btn-primary{display:inline-flex;align-items:center;gap:8px;background:#1D6AF5;color:#fff;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;transition:background .15s,transform .1s;border:none;cursor:pointer;font-family:inherit;white-space:nowrap}
        .btn-primary:hover{background:#1558D0;transform:translateY(-1px)}
        .btn-secondary{display:inline-flex;align-items:center;gap:8px;background:#fff;color:#374151;padding:14px 24px;border-radius:10px;font-weight:600;font-size:15px;text-decoration:none;border:1.5px solid #E5E7EB;transition:border-color .15s,background .15s;white-space:nowrap}
        .btn-secondary:hover{border-color:#9CA3AF;background:#F9FAFB}
        .hero-trust{display:flex;align-items:center;gap:22px;font-size:13px;flex-wrap:wrap}
        .hero-trust span{display:flex;align-items:center;gap:6px;color:#6B7280}
        .hero-trust svg{color:#1D6AF5}

        /* HERO VISUAL */
        .hero-vis{position:relative;display:flex;justify-content:center;align-items:center;min-height:520px}
        .hero-glow{position:absolute;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(29,106,245,.12) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none}

        /* FLOATING CHIPS */
        .chip{position:absolute;background:#fff;border-radius:14px;box-shadow:0 4px 20px rgba(0,0,0,.12);display:flex;align-items:center;gap:9px;padding:10px 14px;font-size:12.5px;font-weight:600;color:#111827;white-space:nowrap;border:1px solid #F3F4F6;animation:floatA 4s ease-in-out infinite}
        .chip-icon{width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
        .chip-val{font-size:16px;font-weight:800;font-family:'Plus Jakarta Sans',sans-serif;letter-spacing:-.02em}
        .chip-lbl{font-size:10.5px;color:#6B7280;font-weight:500;margin-top:1px}
        .chip.c1{top:10%;left:-8%;animation-delay:0s}
        .chip.c2{top:18%;right:-10%;animation-delay:.8s}
        .chip.c3{bottom:22%;left:-12%;animation-delay:1.6s}
        .chip.c4{bottom:12%;right:-8%;animation-delay:2.4s}
        @keyframes floatA{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}

        /* PHONE */
        .ph-frame{position:relative;z-index:1;width:265px;background:#1a1a1a;border-radius:38px;padding:9px;box-shadow:0 32px 80px rgba(0,0,0,.22),0 0 0 1px rgba(255,255,255,.06)}
        .ph-screen{border-radius:30px;overflow:hidden;background:#EFE7DB;display:flex;flex-direction:column;height:490px}
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

        @media(max-width:860px){
          .hero-inner{grid-template-columns:1fr;text-align:center}
          .hero-sub{margin-left:auto;margin-right:auto}
          .hero-btns{justify-content:center}
          .hero-trust{justify-content:center}
          .hero-badge{margin:0 auto 26px}
          .hero-vis{min-height:380px}
          .ph-frame{width:230px}
          .ph-screen{height:420px}
          .chip{display:none}
        }

        /* LOGOS STRIP */
        .logos{padding:24px clamp(16px,4vw,52px);border-top:1px solid #F3F4F6;border-bottom:1px solid #F3F4F6;background:#fff}
        .logos-inner{max-width:1120px;margin:0 auto;display:flex;align-items:center;gap:clamp(16px,3vw,48px);flex-wrap:wrap;justify-content:center}
        .logos-label{font-size:12px;color:#9CA3AF;font-weight:600;white-space:nowrap}
        .logos-chips{display:flex;align-items:center;gap:clamp(12px,2vw,32px);flex-wrap:wrap;justify-content:center}
        .logo-chip{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:700;color:#6B7280}
        .logo-chip-icon{font-size:18px}

        /* STATS */
        .stats{background:#111827;padding:clamp(44px,5vw,64px) clamp(16px,4vw,52px)}
        .stats-inner{max-width:1120px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#1F2937;border:1px solid #1F2937;border-radius:16px;overflow:hidden}
        .stat-box{background:#111827;padding:clamp(24px,3vw,36px) 24px;text-align:center}
        .stat-num{font-size:clamp(36px,4.5vw,52px);font-weight:800;color:#fff;letter-spacing:-.04em;line-height:1;font-family:'Plus Jakarta Sans',sans-serif}
        .stat-num span{color:#1D6AF5}
        .stat-lbl{font-size:13px;color:#6B7280;margin-top:8px}
        @media(max-width:640px){.stats-inner{grid-template-columns:repeat(2,1fr)}}

        /* SECTIONS */
        .sec{padding:clamp(72px,8vw,100px) clamp(16px,4vw,52px)}
        .sec-inner{max-width:1120px;margin:0 auto}
        .sec-label{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#1D6AF5;margin-bottom:14px}
        .sec-h2{font-size:clamp(26px,3.5vw,42px);font-weight:800;color:#111827;letter-spacing:-.03em;line-height:1.12;margin-bottom:14px;font-family:'Plus Jakarta Sans',sans-serif}
        .sec-h2 em{font-style:normal;color:#1D6AF5}
        .sec-lead{font-size:16px;color:#6B7280;line-height:1.75;max-width:540px}
        .center{text-align:center}
        .center .sec-lead{margin-left:auto;margin-right:auto}

        /* PROBLEM SECTION */
        .prob-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:48px}
        .prob-card{border-radius:18px;padding:28px 24px;border:1.5px solid transparent}
        .prob-icon{font-size:32px;margin-bottom:16px}
        .prob-title{font-size:17px;font-weight:700;color:#111827;margin-bottom:10px}
        .prob-desc{font-size:14px;line-height:1.75;color:#6B7280}
        .prob-tag{display:inline-flex;align-items:center;gap:6px;margin-top:16px;font-size:11.5px;font-weight:600;padding:4px 12px;border-radius:100px}
        @media(max-width:700px){.prob-grid{grid-template-columns:1fr}}

        /* HOW IT WORKS */
        .steps-vis{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:52px;position:relative}
        .steps-vis::before{content:'';position:absolute;top:36px;left:calc(16.66% + 8px);right:calc(16.66% + 8px);height:2px;background:linear-gradient(90deg,#DBEAFE,#1D6AF5,#DBEAFE);z-index:0}
        .step-box{background:#fff;border:1.5px solid #E5E7EB;border-radius:18px;padding:28px 22px;position:relative;z-index:1}
        .step-num{width:44px;height:44px;border-radius:50%;background:#1D6AF5;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;margin-bottom:18px;font-family:'Plus Jakarta Sans',sans-serif;box-shadow:0 4px 12px rgba(29,106,245,.3)}
        .step-title{font-size:16px;font-weight:700;color:#111827;margin-bottom:8px}
        .step-desc{font-size:14px;color:#6B7280;line-height:1.7}
        @media(max-width:700px){.steps-vis{grid-template-columns:1fr}.steps-vis::before{display:none}}

        /* MODULES — 2-col like features page */
        .mod-sec{padding:clamp(72px,8vw,100px) clamp(16px,4vw,52px)}
        .mod-inner{max-width:1080px;margin:0 auto;display:flex;flex-direction:column;gap:80px}
        .mod-row{display:grid;grid-template-columns:1fr 1fr;gap:clamp(36px,5vw,72px);align-items:center}
        .mod-label{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:12px}
        .mod-h3{font-size:clamp(22px,2.8vw,34px);font-weight:800;color:#111827;letter-spacing:-.025em;line-height:1.18;margin-bottom:12px;font-family:'Plus Jakarta Sans',sans-serif}
        .mod-p{font-size:15px;color:#6B7280;line-height:1.8;margin-bottom:20px}
        .mod-list{list-style:none;display:flex;flex-direction:column;gap:10px}
        .mod-list li{display:flex;align-items:flex-start;gap:9px;font-size:14px;color:#374151;line-height:1.5}
        .mod-list li::before{content:'✓';color:#1D6AF5;font-weight:700;flex-shrink:0;margin-top:1px}
        .cmock-mini{background:#EFE7DB;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.1)}
        .cmock-hd{background:#075E54;color:#fff;display:flex;align-items:center;gap:10px;padding:11px 14px}
        .cmock-av{width:30px;height:30px;border-radius:50%;background:#F3C26B;color:#7C3E0A;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0}
        .cmock-body{padding:12px 10px;display:flex;flex-direction:column;gap:7px}
        .cb{max-width:82%;padding:8px 12px 6px;border-radius:10px;font-size:12px;line-height:1.5;color:#1B1B18;white-space:pre-wrap}
        .cb.c{background:#DCF8C6;align-self:flex-end;border-top-right-radius:3px}
        .cb.a{background:#fff;align-self:flex-start;border-top-left-radius:3px}
        .cb-ts{display:block;font-size:8.5px;color:rgba(0,0,0,.4);text-align:right;margin-top:2px}
        .dash-mock{background:#fff;border:1.5px solid #E5E7EB;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.08)}
        .dash-hd{background:#F9FAFB;padding:13px 16px;border-bottom:1px solid #E5E7EB;font-size:13px;font-weight:700;color:#111827;display:flex;justify-content:space-between}
        .dash-kpis{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid #F3F4F6}
        .dash-kpi{padding:14px 16px;border-right:1px solid #F3F4F6}
        .dash-kpi:last-child{border-right:none}
        .dash-kl{font-size:10.5px;color:#9CA3AF;margin-bottom:3px}
        .dash-kv{font-size:20px;font-weight:800;color:#111827;font-family:'Plus Jakarta Sans',sans-serif}
        .dash-kv.blue{color:#1D6AF5}
        .dash-body{padding:14px 16px;display:flex;flex-direction:column;gap:10px}
        .dash-row{display:flex;justify-content:space-between;font-size:13px;padding:8px 0;border-bottom:1px solid #F9FAFB}
        .inbox-mock{background:#fff;border:1.5px solid #E5E7EB;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.08)}
        .inbox-hd{background:#F9FAFB;padding:12px 16px;border-bottom:1px solid #E5E7EB;display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:700;color:#111827}
        .inbox-badge{background:#1D6AF5;color:#fff;font-size:10px;font-weight:700;border-radius:100px;padding:2px 8px}
        .inbox-row{display:flex;align-items:center;gap:11px;padding:11px 16px;border-bottom:1px solid #F9FAFB}
        .inbox-av{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0}
        .inbox-mid{flex:1;min-width:0}
        .inbox-name{font-size:13px;font-weight:600;color:#111827;margin-bottom:2px}
        .inbox-msg{font-size:11.5px;color:#9CA3AF;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .inbox-pill{font-size:9.5px;font-weight:700;padding:3px 9px;border-radius:100px;flex-shrink:0}
        .pill-ai{background:#EEF4FF;color:#1D6AF5}
        .pill-you{background:#F3F4F6;color:#9CA3AF}
        @media(max-width:800px){.mod-row{grid-template-columns:1fr}}

        /* DEMO */
        .demo-grid{display:grid;grid-template-columns:200px 1fr;gap:16px;margin-top:44px;align-items:start}
        .demo-tabs{display:flex;flex-direction:column;gap:8px}
        .demo-tab{background:#fff;border:1.5px solid #E5E7EB;border-radius:12px;padding:14px 16px;cursor:pointer;text-align:left;font-family:inherit;width:100%;transition:border-color .15s;display:flex;align-items:flex-start;gap:10px}
        .demo-tab:hover{border-color:#BFDBFE}
        .demo-tab.on{border-color:#1D6AF5;background:#EEF4FF}
        .demo-tab-icon{font-size:18px;flex-shrink:0;margin-top:1px}
        .demo-tab-label{font-size:13.5px;font-weight:700;color:#111827;margin-bottom:2px}
        .demo-tab-sub{font-size:11px;color:#9CA3AF}
        .demo-wa{background:#fff;border:1.5px solid #E5E7EB;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.06)}
        .demo-wa-hd{background:#075E54;color:#fff;display:flex;align-items:center;gap:10px;padding:12px 16px}
        .demo-wa-av{width:32px;height:32px;border-radius:50%;background:#F3C26B;color:#7C3E0A;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px}
        .demo-wa-body{padding:16px;min-height:220px;max-height:280px;display:flex;flex-direction:column;gap:8px;overflow-y:auto;scrollbar-width:none;background:#F9FAFB}
        .demo-wa-body::-webkit-scrollbar{display:none}
        .demo-wa-body .cb{font-size:13px;animation:msgin .2s ease both}
        @keyframes msgin{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
        @media(max-width:680px){.demo-grid{grid-template-columns:1fr}.demo-tabs{display:grid;grid-template-columns:repeat(3,1fr)}}

        /* INDUSTRIES */
        .ind-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:48px}
        .ind-card{background:#fff;border:1.5px solid #E5E7EB;border-radius:18px;padding:24px;text-decoration:none;display:flex;flex-direction:column;gap:10px;transition:border-color .15s,box-shadow .15s,transform .15s}
        .ind-card:hover{border-color:#BFDBFE;box-shadow:0 8px 28px rgba(29,106,245,.1);transform:translateY(-2px)}
        .ind-emoji{font-size:30px}
        .ind-title{font-size:15.5px;font-weight:700;color:#111827}
        .ind-desc{font-size:13.5px;color:#6B7280;line-height:1.65;flex:1}
        .ind-arrow{font-size:12.5px;font-weight:700;color:#1D6AF5;margin-top:4px}
        @media(max-width:700px){.ind-grid{grid-template-columns:1fr 1fr}}
        @media(max-width:440px){.ind-grid{grid-template-columns:1fr}}

        /* TESTIMONIALS */
        .tgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:48px}
        .tcard{background:#fff;border:1.5px solid #E5E7EB;border-radius:18px;padding:28px;display:flex;flex-direction:column}
        .tcard-metric{font-size:34px;font-weight:800;color:#1D6AF5;letter-spacing:-.03em;line-height:1;font-family:'Plus Jakarta Sans',sans-serif}
        .tcard-metric-l{font-size:12px;color:#9CA3AF;margin:5px 0 20px}
        .tcard-q{font-size:14px;color:#374151;line-height:1.78;flex:1}
        .tcard-auth{display:flex;align-items:center;gap:10px;margin-top:20px;padding-top:16px;border-top:1px solid #F3F4F6}
        .tcard-av{width:38px;height:38px;border-radius:50%;background:#EEF4FF;color:#1D6AF5;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;flex-shrink:0}
        .tcard-name{font-size:13.5px;font-weight:700;color:#111827}
        .tcard-biz{font-size:12px;color:#9CA3AF;margin-top:2px}
        @media(max-width:800px){.tgrid{grid-template-columns:1fr;max-width:440px;margin-left:auto;margin-right:auto}}

        /* VS TABLE */
        .vs-wrap{overflow-x:auto;margin-top:44px;border:1.5px solid #E5E7EB;border-radius:16px}
        .vs-table{width:100%;border-collapse:collapse;font-size:13.5px;min-width:580px}
        .vs-table th{padding:14px 18px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9CA3AF;background:#F9FAFB;border-bottom:1.5px solid #E5E7EB;text-align:left}
        .vs-table th.hl{background:#EEF4FF;color:#1D6AF5;border-bottom-color:#BFDBFE}
        .vs-table td{padding:12px 18px;border-bottom:1px solid #F3F4F6;color:#6B7280;vertical-align:middle}
        .vs-table tr:last-child td{border-bottom:none}
        .vs-table td.hl{background:#F5F9FF;font-weight:600;color:#111827}
        .vs-table td.feat{font-weight:500;color:#374151;max-width:210px}
        .vs-yes{color:#16A34A;font-weight:700}
        .vs-no{color:#D1D5DB}
        .vs-part{color:#D97706;font-weight:600}

        /* PRICING */
        .billing-toggle{display:inline-flex;align-items:center;background:#F3F4F6;border-radius:100px;padding:4px;margin:20px auto 40px}
        .bt{padding:9px 20px;border-radius:100px;font-size:13.5px;font-weight:600;border:none;background:transparent;color:#6B7280;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:7px;transition:background .15s,color .15s}
        .bt.on{background:#fff;color:#111827;box-shadow:0 1px 4px rgba(0,0,0,.1)}
        .bt-save{font-size:10px;font-weight:700;padding:2px 8px;border-radius:100px;background:#DCFCE7;color:#15803D}
        .pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
        .plan{background:#fff;border:1.5px solid #E5E7EB;border-radius:20px;padding:clamp(22px,3vw,30px);position:relative;display:flex;flex-direction:column}
        .plan.pop{border-color:#1D6AF5;box-shadow:0 8px 40px rgba(29,106,245,.14)}
        .plan-badge{position:absolute;top:0;left:24px;transform:translateY(-50%);background:#1D6AF5;color:#fff;font-size:11px;font-weight:700;padding:4px 14px;border-radius:100px}
        .plan-tier{font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#9CA3AF;margin-bottom:4px}
        .plan-tag{font-size:13px;color:#9CA3AF;margin-bottom:16px}
        .plan-price{display:flex;align-items:baseline;gap:2px}
        .plan-rs{font-size:17px;font-weight:600;color:#374151}
        .plan-amt{font-size:clamp(34px,4vw,46px);font-weight:800;color:#111827;letter-spacing:-.03em;font-family:'Plus Jakarta Sans',sans-serif}
        .plan-mo{font-size:12px;color:#9CA3AF;margin:4px 0 16px}
        .plan-hr{border:none;border-top:1px solid #F3F4F6;margin:12px 0 14px}
        .plan-feats{list-style:none;display:flex;flex-direction:column;gap:10px;margin-bottom:22px;flex:1}
        .plan-feats li{display:flex;align-items:flex-start;gap:9px;font-size:13.5px;color:#374151}
        .plan-feats li svg{color:#1D6AF5;flex-shrink:0;margin-top:2px}
        .plan-feats li.exc{color:#D1D5DB}
        .plan-feats li.exc svg{color:#D1D5DB}
        .plan-btn{display:block;text-align:center;padding:13px;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;transition:background .15s;font-family:'Plus Jakarta Sans',sans-serif}
        .plan-btn.go{background:#1D6AF5;color:#fff}
        .plan-btn.go:hover{background:#1558D0}
        .plan-btn.out{background:#F9FAFB;color:#374151;border:1.5px solid #E5E7EB}
        .plan-btn.out:hover{background:#F3F4F6}
        @media(max-width:800px){.pgrid{grid-template-columns:1fr;max-width:420px;margin:0 auto}}

        /* FAQ */
        .faq-list{max-width:700px;margin:48px auto 0}
        .fi{border-bottom:1px solid #F3F4F6}
        .fi:first-child{border-top:1px solid #F3F4F6}
        .fb{width:100%;background:none;border:none;padding:20px 0;text-align:left;font-size:15px;font-weight:600;color:#111827;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:14px;font-family:inherit}
        .fp{width:26px;height:26px;border-radius:50%;border:1.5px solid #E5E7EB;display:flex;align-items:center;justify-content:center;font-size:14px;color:#9CA3AF;flex-shrink:0;transition:transform .2s,color .2s,border-color .2s}
        .fa{font-size:14.5px;color:#6B7280;line-height:1.8;max-height:0;overflow:hidden;transition:max-height .3s ease,padding .3s ease}
        .fi.op .fa{max-height:220px;padding:0 0 20px}
        .fi.op .fp{color:#1D6AF5;border-color:#1D6AF5;transform:rotate(45deg)}

        /* CTA */
        .cta-sec{background:linear-gradient(135deg,#0F172A 0%,#1E3A5F 100%);padding:clamp(72px,8vw,110px) clamp(16px,4vw,52px);text-align:center;position:relative;overflow:hidden}
        .cta-sec::before{content:'';position:absolute;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(29,106,245,.25) 0%,transparent 70%);top:-100px;left:50%;transform:translateX(-50%);pointer-events:none}
        .cta-sec h2{font-size:clamp(28px,4vw,50px);font-weight:800;color:#fff;letter-spacing:-.03em;margin-bottom:14px;font-family:'Plus Jakarta Sans',sans-serif;position:relative}
        .cta-sec p{font-size:17px;color:rgba(255,255,255,.65);margin-bottom:36px;position:relative}
        .btn-white{display:inline-flex;align-items:center;gap:8px;background:#fff;color:#1D6AF5;padding:14px 30px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;transition:background .15s;font-family:'Plus Jakarta Sans',sans-serif}
        .btn-white:hover{background:#EEF4FF}
        .btn-ghost{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.1);color:#fff;padding:14px 24px;border-radius:10px;font-weight:600;font-size:15px;text-decoration:none;border:1.5px solid rgba(255,255,255,.2);transition:background .15s}
        .btn-ghost:hover{background:rgba(255,255,255,.18)}
        .cta-note{margin-top:20px;font-size:13px;color:rgba(255,255,255,.45);position:relative}
      `}</style>

      <MarketingNav />

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              AI-powered WhatsApp Automation
            </div>
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

          <div className="hero-vis">
            <div className="hero-glow" />

            {/* Floating chips */}
            <div className="chip c1">
              <div className="chip-icon" style={{ background: "#EEF4FF" }}>⚡</div>
              <div><div className="chip-val" style={{ color: "#1D6AF5" }}>{"< 2s"}</div><div className="chip-lbl">reply time</div></div>
            </div>
            <div className="chip c2">
              <div className="chip-icon" style={{ background: "#F0FDF4" }}>📅</div>
              <div><div className="chip-val" style={{ color: "#059669" }}>3,200+</div><div className="chip-lbl">bookings / month</div></div>
            </div>
            <div className="chip c3">
              <div className="chip-icon" style={{ background: "#FFF7ED" }}>🌐</div>
              <div><div className="chip-val" style={{ color: "#D97706" }}>10+</div><div className="chip-lbl">Indian languages</div></div>
            </div>
            <div className="chip c4">
              <div className="chip-icon" style={{ background: "#F5F3FF" }}>📊</div>
              <div><div className="chip-val" style={{ color: "#7C3AED" }}>98%</div><div className="chip-lbl">open rate</div></div>
            </div>

            <PhoneDemo />
          </div>
        </div>
      </section>

      {/* ── LOGOS STRIP ── */}
      <div className="logos">
        <div className="logos-inner">
          <span className="logos-label">Works with</span>
          <div className="logos-chips">
            {[["📱", "WhatsApp Business"], ["🏢", "Meta Business Suite"], ["🔗", "Razorpay"], ["📊", "Google Calendar"], ["⚙️", "Zapier"]].map(([icon, name]) => (
              <div key={name} className="logo-chip"><span className="logo-chip-icon">{icon}</span>{name}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <section className="stats">
        <div className="stats-inner fade in">
          {[["3,200+", "Bookings automated monthly"], ["99%", "Message delivery rate"], ["< 2s", "Average reply time"], ["60%", "Fewer no-shows"]].map(([n, l]) => (
            <div key={l} className="stat-box">
              <div className="stat-num">{n.includes("+") ? <>{n.replace("+","")}<span>+</span></> : n}</div>
              <div className="stat-lbl">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section className="sec" style={{ background: "#fff" }}>
        <div className="sec-inner">
          <div className="fade center">
            <div className="sec-label">The real problem</div>
            <h2 className="sec-h2">Your ads are working.<br />Your follow-up isn&apos;t.</h2>
            <p className="sec-lead center">Most businesses spend thousands getting leads to message them. The money walks out in the WhatsApp inbox.</p>
          </div>
          <div className="prob-grid">
            {[
              { icon: "🌙", bg: "#FEF2F2", border: "#FECACA", tag: "Revenue lost every night", tagBg: "#FEF2F2", tagColor: "#DC2626", title: "Leads die after hours", desc: "A customer messages at 10 PM about your bridal package. You see it at 9 AM — she's already booked someone who replied in 2 minutes." },
              { icon: "⚡", bg: "#FFFBEB", border: "#FDE68A", tag: "Competitive disadvantage", tagBg: "#FFFBEB", tagColor: "#D97706", title: "Speed wins the booking", desc: "Your competitor replies in 2 seconds. You reply in 2 hours. Same service, same price — they win the appointment every time." },
              { icon: "⭐", bg: "#FFF0F6", border: "#FBCFE8", tag: "Reputation at risk", tagBg: "#FFF0F6", tagColor: "#DB2777", title: "Silence becomes a bad review", desc: "An upset customer messages at peak hour. Your staff is busy. The message sits unread. The 1-star review doesn't." },
            ].map(p => (
              <div key={p.title} className="prob-card fade" style={{ background: p.bg, borderColor: p.border }}>
                <div className="prob-icon">{p.icon}</div>
                <div className="prob-title">{p.title}</div>
                <p className="prob-desc">{p.desc}</p>
                <span className="prob-tag" style={{ background: "rgba(255,255,255,.7)", color: p.tagColor, border: `1px solid ${p.border}` }}>{p.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCT MODULES ── */}
      <section className="mod-sec" style={{ background: "#F9FAFB" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div className="fade center" style={{ marginBottom: 64 }}>
            <div className="sec-label">What&apos;s inside</div>
            <h2 className="sec-h2">Not a chatbot. A <em>revenue system</em>.</h2>
            <p className="sec-lead center">Three modules that work together to turn every WhatsApp conversation into money in your bank.</p>
          </div>
          <div className="mod-inner">

            {/* BOOKING */}
            <div className="mod-row fade">
              <div>
                <div className="mod-label" style={{ color: "#059669" }}>01 · Booking Engine</div>
                <h3 className="mod-h3">Books the appointment,<br />start to finish.</h3>
                <p className="mod-p">Service, date, time, confirmation — collected naturally, checked against real availability, and confirmed without a human touching it.</p>
                <ul className="mod-list">
                  <li>Understands casual, mixed-language messages</li>
                  <li>Checks real slot availability before confirming</li>
                  <li>Sends instant notification to the owner</li>
                  <li>Handles rescheduling and cancellation</li>
                </ul>
              </div>
              <div>
                <div className="cmock-mini">
                  <div className="cmock-hd">
                    <div className="cmock-av">R</div>
                    <div><div style={{ fontSize: 13, fontWeight: 600 }}>Riya Salon</div><div style={{ fontSize: 10, opacity: .8 }}>online</div></div>
                  </div>
                  <div className="cmock-body">
                    <div className="cb c">Hi, I want a haircut tomorrow around 3pm<span className="cb-ts">9:41 PM ✓✓</span></div>
                    <div className="cb a">{"Tomorrow's great — 3 PM is available.\n\nConfirm Haircut · tomorrow · 3:00 PM?"}<span className="cb-ts">9:41 PM</span></div>
                    <div className="cb c">Yes please!<span className="cb-ts">9:42 PM ✓✓</span></div>
                    <div className="cb a">{"✅ Booking confirmed!\n\nHaircut · Tomorrow · 3:00 PM\nSee you then! 🙏"}<span className="cb-ts">9:42 PM</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* CAMPAIGNS */}
            <div className="mod-row fade">
              <div style={{ order: 2 }}>
                <div className="mod-label" style={{ color: "#D97706" }}>02 · WhatsApp Campaigns</div>
                <h3 className="mod-h3">See exactly what<br />each campaign earned.</h3>
                <p className="mod-p">Send approved WhatsApp templates to customer segments, and track delivery, replies and revenue attributed to that exact send — not just opens.</p>
                <ul className="mod-list">
                  <li>Segment by tag — new, returning, VIP, inactive</li>
                  <li>Real Meta delivery and read tracking</li>
                  <li>Revenue and ROI per campaign</li>
                  <li>Schedule sends for optimal timing</li>
                </ul>
              </div>
              <div style={{ order: 1 }}>
                <div className="dash-mock">
                  <div className="dash-hd"><span>January Offer Campaign</span><span style={{ fontSize: 10.5, color: "#1D6AF5", fontWeight: 600 }}>Completed</span></div>
                  <div className="dash-kpis">
                    <div className="dash-kpi"><div className="dash-kl">Sent</div><div className="dash-kv">412</div></div>
                    <div className="dash-kpi"><div className="dash-kl">Read</div><div className="dash-kv">403</div></div>
                    <div className="dash-kpi"><div className="dash-kl">Replied</div><div className="dash-kv blue">138</div></div>
                  </div>
                  <div className="dash-body">
                    {[["Bookings generated", "82"], ["Revenue earned", "₹98,400"], ["Campaign spend", "₹13,900"], ["ROI", "+612%"]].map(([l, v], i) => (
                      <div key={l} className="dash-row">
                        <span style={{ color: "#6B7280" }}>{l}</span>
                        <strong style={{ color: i === 3 ? "#1D6AF5" : "#111827" }}>{v}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* INBOX */}
            <div className="mod-row fade">
              <div>
                <div className="mod-label" style={{ color: "#7C3AED" }}>03 · Smart Inbox</div>
                <h3 className="mod-h3">One inbox. Every conversation.<br />Full control.</h3>
                <p className="mod-p">See every conversation live, take over manually whenever you want, and let Fastrill pick back up the moment you&apos;re done.</p>
                <ul className="mod-list">
                  <li>Take over any conversation in one tap</li>
                  <li>Full customer history and tags in one view</li>
                  <li>Works across 10+ Indian languages</li>
                  <li>Real-time conversation updates</li>
                </ul>
              </div>
              <div>
                <div className="inbox-mock">
                  <div className="inbox-hd"><span>All conversations</span><span className="inbox-badge">4 active</span></div>
                  {[
                    { n: "Priya Nair", m: "Yes please, book me for 3 PM", ai: true, c: "#EEF4FF", l: "P" },
                    { n: "Arjun Mehta", m: "Do you have dermatology also?", ai: true, c: "#FFF7ED", l: "A" },
                    { n: "Sneha Reddy", m: "Thank you so much! See you 🙏", ai: false, c: "#F0FDF4", l: "S" },
                    { n: "Kiran Patel", m: "What time do you close today?", ai: true, c: "#F5F3FF", l: "K" },
                  ].map(c => (
                    <div key={c.n} className="inbox-row">
                      <div className="inbox-av" style={{ background: c.c }}>{c.l}</div>
                      <div className="inbox-mid"><div className="inbox-name">{c.n}</div><div className="inbox-msg">{c.m}</div></div>
                      <span className={`inbox-pill ${c.ai ? "pill-ai" : "pill-you"}`}>{c.ai ? "AI" : "You"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── LIVE DEMO ── */}
      <section className="sec" id="demo" style={{ background: "#fff" }}>
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
                  <div className="demo-tab-icon">{s.icon}</div>
                  <div><div className="demo-tab-label">{s.label}</div><div className="demo-tab-sub">{s.sub}</div></div>
                </button>
              ))}
            </div>
            <div className="demo-wa fade">
              <div className="demo-wa-hd">
                <div className="demo-wa-av">R</div>
                <div style={{ marginLeft: 2 }}><div style={{ fontSize: 13, fontWeight: 600 }}>Riya Salon</div><div style={{ fontSize: 10, opacity: .8 }}>online</div></div>
              </div>
              <div className="demo-wa-body" ref={demoRef}>
                {demoMsgs.map((m, i) => <div key={`${demoKey}-${i}`} className={`cb ${m.r}`}>{m.m}</div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="sec" style={{ background: "#F0F7FF" }}>
        <div className="sec-inner">
          <div className="fade center">
            <div className="sec-label">Setup</div>
            <h2 className="sec-h2">Live in 10 minutes, not 10 days</h2>
            <p className="sec-lead center">No developers needed. No API docs. Just connect your WhatsApp and you&apos;re ready.</p>
          </div>
          <div className="steps-vis">
            {[
              { n: "1", title: "Connect your WhatsApp", desc: "Link your WhatsApp Business number via the official Meta API. Takes 3 minutes. Your customers keep messaging the same number they know." },
              { n: "2", title: "Tell Fastrill about your business", desc: "Add your services, prices, working hours, and team. Fastrill learns your business and starts handling conversations exactly as you would." },
              { n: "3", title: "Watch it handle conversations", desc: "From the first message to the confirmed booking — Fastrill replies, qualifies, books, and follows up. You get notified when a booking lands." },
            ].map(s => (
              <div key={s.n} className="step-box fade">
                <div className="step-num">{s.n}</div>
                <div className="step-title">{s.title}</div>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INDUSTRIES ── */}
      <section className="sec" style={{ background: "#fff" }}>
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
                <div className="ind-arrow">Learn more →</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="sec" style={{ background: "#F9FAFB" }}>
        <div className="sec-inner">
          <div className="fade center">
            <div className="sec-label">Results</div>
            <h2 className="sec-h2">Real businesses. Real numbers.</h2>
          </div>
          <div className="tgrid">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="tcard fade">
                <div className="tcard-metric">{t.result}</div>
                <div className="tcard-metric-l">{t.resultLabel}</div>
                <p className="tcard-q">&ldquo;{t.quote}&rdquo;</p>
                <div className="tcard-auth">
                  <div className="tcard-av">{t.initial}</div>
                  <div><div className="tcard-name">{t.name}</div><div className="tcard-biz">{t.biz}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VS TABLE ── */}
      <section className="sec" style={{ background: "#fff" }}>
        <div className="sec-inner">
          <div className="fade center">
            <div className="sec-label">How we compare</div>
            <h2 className="sec-h2">Why businesses choose <em>Fastrill</em></h2>
            <p className="sec-lead center">Most WhatsApp tools just broadcast. Fastrill understands, replies, and books — in your customer&apos;s language.</p>
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
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="sec" style={{ background: "#F0F7FF" }} id="pricing">
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

      {/* ── FAQ ── */}
      <FAQSection />

      {/* ── CTA ── */}
      <section className="cta-sec">
        <h2>Turn every WhatsApp message into revenue</h2>
        <p>Start automating replies, recovering leads, and booking customers today.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", position: "relative" }}>
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
    <section className="sec" style={{ background: "#fff" }}>
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
