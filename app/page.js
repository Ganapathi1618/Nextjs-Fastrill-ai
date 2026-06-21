"use client"

import { useState, useEffect, useRef } from "react"

// ── Demo conversation data (unchanged content, reused for live chat sim) ──
const DEMO_THREAD = [
  { r: "c", m: "Hi, I want a haircut tomorrow around 3pm", t: "11:42 PM" },
  { r: "a", m: "Hey! Tomorrow's Saturday — 3 PM works great.\n\nShall I confirm Haircut for Saturday, 29th March at 3:00 PM?", t: "11:42 PM" },
  { r: "c", m: "Yes please!", t: "11:43 PM" },
  { r: "a", m: "Booking confirmed.\n\nHaircut · Saturday, 29 March · 3:00 PM\n\nSee you then!", t: "11:43 PM" },
]

const LIFECYCLE = [
  { label: "Lead arrives", time: "11:42 PM", desc: "Customer messages on WhatsApp" },
  { label: "AI responds", time: "11:42 PM", desc: "Instant reply, zero wait" },
  { label: "AI qualifies", time: "11:42 PM", desc: "Service, date, time collected" },
  { label: "Booking confirmed", time: "11:43 PM", desc: "Slot locked, owner notified" },
]

const FEATURES = [
  {
    icon: "chat",
    title: "AI conversations",
    desc: "Understands casual, mixed-language messages and responds like a trained staff member — not a button menu.",
  },
  {
    icon: "calendar",
    title: "Automated booking",
    desc: "Collects service, date and time in order, checks real availability, and confirms — without a human touching it.",
  },
  {
    icon: "recover",
    title: "Lead recovery",
    desc: "Customers who go quiet after asking about price get a timely, personalised follow-up automatically.",
  },
  {
    icon: "broadcast",
    title: "WhatsApp campaigns",
    desc: "Send approved templates to customer segments and track exactly what each campaign converted to revenue.",
  },
  {
    icon: "database",
    title: "Customer memory",
    desc: "Every conversation, booking and preference is remembered — return customers are recognised instantly.",
  },
  {
    icon: "chart",
    title: "Revenue analytics",
    desc: "See bookings, campaign ROI and AI-handled revenue in one dashboard, not scattered across exports.",
  },
]

const COMPARISON_ROWS = [
  ["Response time", "Hours, if at all", "Minutes, business hours", "Under 2 seconds, 24/7"],
  ["Lead recovery", "Manual, easily forgotten", "Not included", "Automatic follow-up"],
  ["Booking automation", "None", "Basic, button-based", "Full conversational flow"],
  ["Works after hours", "No", "No", "Yes"],
  ["Revenue tracking", "Spreadsheets", "Message counts only", "Per-campaign ROI"],
]

const TESTIMONIALS = [
  {
    quote: "We were losing Saturday night bookings because nobody replied after 8 PM. Customers now book at midnight and wake up to a confirmation.",
    name: "Priya Nair",
    role: "Owner, Glow Parlour",
    metric: "+43%",
    metricLabel: "bookings, month one",
  },
  {
    quote: "Patients message in Telugu and the AI replies in Telugu, books the slot, and follows up if they go quiet. I had to see it to believe it wasn't a person.",
    name: "Dr. Ravi Sharma",
    role: "Skin First Clinic",
    metric: "₹22k",
    metricLabel: "saved per month",
  },
  {
    quote: "Two branches, both inboxes handled at once. Our staff stopped checking phones and started focusing on the customer in front of them.",
    name: "Sneha Reddy",
    role: "Studio S, 2 branches",
    metric: "0",
    metricLabel: "missed messages",
  },
]

const PRICING = [
  {
    name: "Starter",
    monthly: 999,
    desc: "Solo operators getting started",
    features: ["1 WhatsApp number", "300 AI conversations / month", "Booking automation", "10+ Indian languages"],
    cta: "Get started",
  },
  {
    name: "Growth",
    monthly: 1999,
    desc: "For growing businesses",
    features: ["1 WhatsApp number", "Unlimited conversations", "Customer memory", "Lead recovery", "WhatsApp campaigns", "Priority support"],
    cta: "Start free trial",
    popular: true,
  },
  {
    name: "Pro",
    monthly: 4999,
    desc: "Multi-branch teams",
    features: ["Up to 5 WhatsApp numbers", "Everything in Growth", "Multi-branch management", "Custom AI playbook", "Dedicated onboarding"],
    cta: "Contact sales",
  },
]

function annualPrice(monthly) {
  // 17% discount when billed annually — standard SaaS annual incentive,
  // not an unrealistic "basically free" number
  return Math.round(monthly * 0.83)
}

function Icon({ name, size = 22 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" }
  switch (name) {
    case "chat":
      return <svg {...common}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
    case "calendar":
      return <svg {...common}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    case "recover":
      return <svg {...common}><path d="M3 12a9 9 0 1 0 2.6-6.4"/><path d="M3 5v5h5"/></svg>
    case "broadcast":
      return <svg {...common}><path d="M4 11.5v1a7.5 7.5 0 0 0 15 0v-1"/><path d="M9 18l1 3M15 18l-1 3"/><circle cx="11.5" cy="6.5" r="4.5"/></svg>
    case "database":
      return <svg {...common}><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/><path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"/></svg>
    case "chart":
      return <svg {...common}><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/></svg>
    case "check":
      return <svg {...common} strokeWidth={2}><path d="M20 6L9 17l-5-5"/></svg>
    case "arrow":
      return <svg {...common} strokeWidth={2}><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    case "x":
      return <svg {...common} strokeWidth={2}><path d="M5 5l14 14M19 5L5 19"/></svg>
    case "play":
      return <svg {...common} strokeWidth={2}><path d="M6 4l14 8-14 8V4z"/></svg>
    default:
      return null
  }
}

export default function FastrillMarketingV2() {
  const [billing, setBilling] = useState("monthly")
  const [scrolled, setScrolled] = useState(false)
  const [demoMsgs, setDemoMsgs] = useState([])
  const [lifecycleActive, setLifecycleActive] = useState(-1)
  const demoRef = useRef(null)
  const lifecycleRef = useRef(null)
  const heroRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Hero live-chat simulation — plays once on mount
  useEffect(() => {
    const timers = []
    DEMO_THREAD.forEach((msg, i) => {
      timers.push(setTimeout(() => {
        setDemoMsgs((p) => [...p, msg])
      }, 700 + i * 1100))
    })
    return () => timers.forEach(clearTimeout)
  }, [])

  // Lifecycle rail — scroll-triggered sequential reveal (the signature element)
  useEffect(() => {
    const el = lifecycleRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          LIFECYCLE.forEach((_, i) => {
            setTimeout(() => setLifecycleActive(i), i * 450)
          })
          io.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Generic reveal-on-scroll for fade elements
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("v2-in")
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    )
    document.querySelectorAll(".v2-fade").forEach((el, idx) => {
      el.style.transitionDelay = Math.min((idx % 4) * 0.08, 0.32) + "s"
      io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  return (
    <>
      <style>{`
@import url('https://api.fontshare.com/v2/css?f[]=general-sans@500,600,700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  background: #FFFFFF;
  color: #0B0D12;
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

:root {
  --ink: #0B0D12;
  --ink-soft: #585F6E;
  --ink-faint: #9197A5;
  --paper: #FFFFFF;
  --canvas: #F7F8FA;
  --line: rgba(11,13,18,0.08);
  --line-soft: rgba(11,13,18,0.05);
  --signal: #146EF5;
  --signal-deep: #0B4FC4;
  --signal-tint: #EAF2FE;
  --signal-tint-2: rgba(20,110,245,0.06);
  --shadow-card: 0 1px 2px rgba(11,13,18,0.04), 0 8px 24px rgba(11,13,18,0.06);
  --shadow-lift: 0 4px 12px rgba(11,13,18,0.06), 0 24px 48px rgba(11,13,18,0.10);
  --display: 'General Sans', 'Inter', sans-serif;
  --mono: 'JetBrains Mono', monospace;
}

.v2-fade { opacity: 0; transform: translateY(16px); transition: opacity 0.7s cubic-bezier(.2,.8,.2,1), transform 0.7s cubic-bezier(.2,.8,.2,1); }
.v2-fade.v2-in { opacity: 1; transform: none; }

/* ── NAV ── */
.v2-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 200;
  height: 72px; padding: 0 clamp(20px,4vw,48px);
  display: flex; align-items: center; justify-content: space-between;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid transparent;
  transition: border-color 0.25s, box-shadow 0.25s;
}
.v2-nav.sc { border-bottom-color: var(--line); box-shadow: 0 1px 0 rgba(11,13,18,0.02); }
.v2-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
.v2-logo-img { width: 30px; height: 30px; object-fit: contain; flex-shrink: 0; display: block; }
.v2-logo-text { font-family: var(--display); font-weight: 600; font-size: 20px; color: var(--ink); letter-spacing: -0.02em; }
.v2-logo-text em { color: var(--signal); font-style: normal; }
.v2-nmid { display: flex; align-items: center; gap: 4px; list-style: none; }
.v2-nmid a { font-size: 14px; font-weight: 500; color: var(--ink-soft); text-decoration: none; padding: 8px 14px; border-radius: 7px; transition: all 0.15s; }
.v2-nmid a:hover { color: var(--ink); background: var(--canvas); }
.v2-nr { display: flex; align-items: center; gap: 8px; }
.v2-signin { font-size: 14px; font-weight: 500; color: var(--ink-soft); text-decoration: none; padding: 8px 14px; }
.v2-signin:hover { color: var(--ink); }
.v2-cta-nav {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--ink); color: white; padding: 9px 18px;
  border-radius: 8px; font-weight: 600; font-size: 13.5px;
  text-decoration: none; transition: all 0.2s;
}
.v2-cta-nav:hover { background: var(--signal-deep); transform: translateY(-1px); }
.v2-hbg { display: none; background: none; border: 1px solid var(--line); border-radius: 7px; padding: 7px 10px; cursor: pointer; font-size: 16px; }

/* ── HERO ── */
.v2-hero { padding: 96px clamp(20px,4vw,48px) clamp(50px,7vw,80px); background: var(--paper); position: relative; overflow: hidden; }
.v2-hero-grid {
  position: absolute; inset: 0; pointer-events: none; opacity: 0.5;
  background-image: linear-gradient(rgba(11,13,18,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(11,13,18,0.025) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 60% 50% at 50% 0%, black, transparent 70%);
}
.v2-hero-mesh {
  position: absolute; top: -120px; left: 50%; transform: translateX(-50%);
  width: 1100px; height: 560px; pointer-events: none;
  background: radial-gradient(ellipse 55% 60% at 50% 0%, rgba(20,110,245,0.07), transparent 70%);
}
.v2-hero-in { max-width: 1200px; margin: 0 auto; position: relative; z-index: 1; display: grid; grid-template-columns: 1fr 480px; gap: clamp(24px,4vw,48px); align-items: center; }
.v2-hero-left { max-width: 560px; }
.v2-eyebrow {
  display: inline-flex; align-items: center; gap: 7px;
  border: 1px solid var(--line); border-radius: 100px;
  padding: 6px 14px; margin-bottom: 20px;
  font-size: 13px; font-weight: 500; color: var(--ink-soft);
  background: var(--canvas);
}
.v2-eyebrow strong { color: var(--ink); font-weight: 600; }
.v2-h1 {
  font-family: var(--display); font-weight: 600;
  font-size: clamp(40px,5.6vw,68px); line-height: 1.04;
  letter-spacing: -0.035em; color: var(--ink);
  max-width: 760px; margin-bottom: 22px;
}
.v2-sub {
  font-size: clamp(16px,1.7vw,19px); color: var(--ink-soft);
  max-width: 540px; line-height: 1.6; margin-bottom: 36px; font-weight: 400;
}
.v2-hero-btns { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 28px; }
.v2-hero-trust-mini { display: flex; align-items: center; gap: 12px; }
.v2-mini-avatars { display: flex; }
.v2-mini-av { width: 26px; height: 26px; border-radius: 50%; background: linear-gradient(135deg,var(--signal),#0b4fc4); border: 2px solid white; margin-left: -8px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; color: white; }
.v2-mini-av:first-child { margin-left: 0; }
.v2-hero-trust-mini span:last-child { font-size: 12.5px; color: var(--ink-faint); }
.v2-btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--ink); color: white; padding: 14px 26px;
  border-radius: 10px; font-weight: 600; font-size: 15px;
  text-decoration: none; transition: all 0.2s; border: none; cursor: pointer;
  font-family: 'Inter', sans-serif;
}
.v2-btn-primary:hover { background: var(--signal-deep); transform: translateY(-1px); box-shadow: var(--shadow-card); }
.v2-btn-secondary {
  display: inline-flex; align-items: center; gap: 8px;
  background: transparent; color: var(--ink); padding: 14px 22px;
  border-radius: 10px; font-weight: 600; font-size: 15px;
  text-decoration: none; border: 1px solid var(--line); transition: all 0.2s;
}
.v2-btn-secondary:hover { border-color: var(--ink-faint); background: var(--canvas); }

/* hero dashboard mockup */
.v2-dash-wrap { position: relative; }
.v2-dash {
  background: var(--paper); border: 1px solid var(--line);
  border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-lift);
}
.v2-dash-bar { height: 44px; background: var(--canvas); border-bottom: 1px solid var(--line); display: flex; align-items: center; padding: 0 16px; gap: 7px; }
.v2-dash-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--line); }
.v2-dash-body { padding: clamp(16px,2vw,22px); }
.v2-dash-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.v2-dash-title { font-family: var(--display); font-weight: 600; font-size: 19px; color: var(--ink); }
.v2-dash-sub { font-size: 12.5px; color: var(--ink-faint); margin-top: 2px; }
.v2-dash-kpis { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; margin-bottom: 16px; }
.v2-kpi { background: var(--canvas); border-radius: 10px; padding: 14px 16px; }
.v2-kpi-label { font-size: 11.5px; color: var(--ink-faint); margin-bottom: 8px; font-weight: 500; }
.v2-kpi-val { font-family: var(--mono); font-weight: 500; font-size: 22px; color: var(--ink); letter-spacing: -0.01em; }
.v2-kpi-val.signal { color: var(--signal); }
.v2-dash-rev { background: linear-gradient(135deg, var(--signal-tint), rgba(20,110,245,0.02)); border: 1px solid rgba(20,110,245,0.12); border-radius: 12px; padding: 14px 16px; }
.v2-dash-rev-label { font-size: 12px; font-weight: 600; color: var(--signal-deep); margin-bottom: 12px; }
.v2-dash-rev-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
.v2-dash-rev-item-label { font-size: 11px; color: var(--ink-faint); margin-bottom: 4px; }
.v2-dash-rev-item-val { font-family: var(--mono); font-weight: 500; font-size: 17px; color: var(--ink); }

.v2-float-chip {
  position: absolute; background: var(--paper); border: 1px solid var(--line);
  border-radius: 10px; padding: 10px 14px; box-shadow: var(--shadow-card);
  display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 500; color: var(--ink);
  opacity: 0; animation: v2chip 0.6s ease forwards;
}
.v2-float-chip .v2-chip-ico { width: 18px; height: 18px; border-radius: 50%; background: var(--signal-tint); color: var(--signal-deep); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
@keyframes v2chip { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.v2-chip-1 { top: -14px; right: 6%; animation-delay: 1.4s; }
.v2-chip-2 { bottom: -16px; left: 8%; animation-delay: 2.3s; }
.v2-chip-3 { top: 40%; left: -36px; animation-delay: 3.1s; }

@media(max-width: 860px) {
  .v2-float-chip { display: none; }
  .v2-dash-kpis { grid-template-columns: repeat(2,1fr); }
  .v2-dash-rev-grid { grid-template-columns: 1fr; }
}

/* ── TRUST STRIP ── */
.v2-trust { padding: 28px clamp(20px,4vw,48px); border-bottom: 1px solid var(--line); background: var(--canvas); }
.v2-trust-in { max-width: 1140px; margin: 0 auto; display: flex; align-items: center; justify-content: center; gap: clamp(24px,5vw,56px); flex-wrap: wrap; }
.v2-trust-item { display: flex; align-items: baseline; gap: 8px; }
.v2-trust-num { font-family: var(--display); font-weight: 600; font-size: 22px; color: var(--ink); }
.v2-trust-label { font-size: 13px; color: var(--ink-faint); }

/* ── SECTION BASE ── */
.v2-sec { padding: clamp(80px,10vw,128px) clamp(20px,4vw,48px); border-top: 1px solid var(--line-soft); }
.v2-sec:first-of-type { border-top: none; }
.v2-sec.alt { background: var(--canvas); }
.v2-w { max-width: 1140px; margin: 0 auto; }
.v2-label { font-size: 13px; font-weight: 600; color: var(--signal-deep); letter-spacing: 0.01em; margin-bottom: 14px; }
.v2-h2 { font-family: var(--display); font-weight: 600; font-size: clamp(30px,4vw,44px); line-height: 1.12; letter-spacing: -0.03em; color: var(--ink); margin-bottom: 16px; max-width: 620px; }
.v2-h2-c { text-align: center; margin-left: auto; margin-right: auto; }
.v2-p { font-size: 16px; color: var(--ink-soft); line-height: 1.65; max-width: 540px; }
.v2-p-c { text-align: center; margin-left: auto; margin-right: auto; }

/* ── PROBLEM CARDS ── */
.v2-problem-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; margin-top: 48px; }
.v2-problem-card { background: var(--paper); padding: 28px 26px; }
.v2-problem-row { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.v2-problem-x { width: 20px; height: 20px; border-radius: 50%; background: rgba(226,75,74,0.1); color: #A32D2D; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.v2-problem-title { font-weight: 600; font-size: 15px; color: var(--ink); }
.v2-problem-desc { font-size: 13.5px; color: var(--ink-soft); line-height: 1.65; }

/* ── LIFECYCLE RAIL (signature element) ── */
.v2-rail-wrap { margin-top: 56px; position: relative; }
.v2-rail-line { position: absolute; top: 17px; left: 5%; right: 5%; height: 2px; background: var(--line); z-index: 0; }
.v2-rail-line-fill { position: absolute; top: 0; left: 0; height: 100%; background: var(--signal); width: 0%; transition: width 1.6s cubic-bezier(.2,.8,.2,1); }
.v2-rail { position: relative; z-index: 1; display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
.v2-rail-node { text-align: center; }
.v2-rail-dot { width: 36px; height: 36px; border-radius: 50%; background: var(--paper); border: 2px solid var(--line); margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-family: var(--mono); font-size: 12px; font-weight: 500; color: var(--ink-faint); transition: all 0.4s; }
.v2-rail-node.active .v2-rail-dot { border-color: var(--signal); background: var(--signal); color: white; }
.v2-rail-label { font-weight: 600; font-size: 14.5px; color: var(--ink); margin-bottom: 4px; transition: color 0.4s; }
.v2-rail-time { font-family: var(--mono); font-size: 11.5px; color: var(--ink-faint); margin-bottom: 6px; }
.v2-rail-desc { font-size: 12.5px; color: var(--ink-soft); line-height: 1.5; max-width: 170px; margin: 0 auto; }

@media(max-width: 760px) {
  .v2-rail { grid-template-columns: 1fr; gap: 28px; }
  .v2-rail-line { display: none; }
}

/* ── FEATURES (legacy, unused after module redesign) ── */
.v2-feat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-top: 48px; }
.v2-feat-card { background: var(--paper); border: 1px solid var(--line); border-radius: 14px; padding: 26px 24px; transition: all 0.2s; }
.v2-feat-card:hover { border-color: rgba(20,110,245,0.25); box-shadow: var(--shadow-card); transform: translateY(-2px); }
.v2-feat-ico { width: 38px; height: 38px; border-radius: 10px; background: var(--signal-tint); color: var(--signal-deep); display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
.v2-feat-title { font-weight: 600; font-size: 15.5px; color: var(--ink); margin-bottom: 8px; }
.v2-feat-desc { font-size: 13.5px; color: var(--ink-soft); line-height: 1.65; }

/* ── MODULES — real screenshot rows, alternating ── */
.v2-module { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(32px,5vw,64px); align-items: center; margin-top: 80px; }
.v2-module.reverse .v2-module-text { order: 2; }
.v2-module.reverse .v2-module-visual { order: 1; }
.v2-module-tag { display: inline-block; font-size: 12px; font-weight: 600; color: var(--signal-deep); background: var(--signal-tint); padding: 4px 12px; border-radius: 100px; margin-bottom: 16px; }
.v2-module-title { font-family: var(--display); font-weight: 600; font-size: clamp(22px,2.6vw,28px); color: var(--ink); letter-spacing: -0.02em; line-height: 1.2; margin-bottom: 12px; }
.v2-module-desc { font-size: 14.5px; color: var(--ink-soft); line-height: 1.65; margin-bottom: 20px; }
.v2-module-list { list-style: none; display: flex; flex-direction: column; gap: 11px; }
.v2-module-list li { display: flex; align-items: flex-start; gap: 9px; font-size: 13.5px; color: var(--ink-soft); }
.v2-module-list li svg { color: var(--signal); flex-shrink: 0; margin-top: 2px; }

/* WhatsApp-style mockup (module 1) */
.v2-mockup-wa { background: #0b141a; border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-lift); border: 1px solid var(--line); max-width: 380px; margin: 0 auto; }
.v2-mockup-wa-head { background: #1f2c34; padding: 13px 16px; display: flex; align-items: center; gap: 10px; }
.v2-mockup-av { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg,var(--signal),#0b4fc4); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px; color: white; flex-shrink: 0; }
.v2-mockup-name { font-size: 13px; font-weight: 600; color: #e9edef; }
.v2-mockup-status { font-size: 10.5px; color: #25d366; }
.v2-mockup-wa-body { padding: 16px; min-height: 220px; display: flex; flex-direction: column; gap: 9px; }
.v2-mockup-wa .v2-msg { max-width: 80%; padding: 9px 13px; border-radius: 12px; font-size: 13px; line-height: 1.5; white-space: pre-wrap; }
.v2-mockup-wa .v2-msg.c { background: #005c4b; color: #e9edef; align-self: flex-end; border-radius: 12px 3px 12px 12px; }
.v2-mockup-wa .v2-msg.a { background: #1a2d22; border: 1px solid rgba(37,211,102,0.1); color: #e9edef; align-self: flex-start; border-radius: 3px 12px 12px 12px; }

/* Mini dashboard mockup (module 2) */
.v2-mockup-dash-mini { background: var(--paper); border: 1px solid var(--line); border-radius: 16px; padding: 22px; box-shadow: var(--shadow-lift); max-width: 380px; margin: 0 auto; }
.v2-mockup-dash-mini-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
.v2-mockup-dash-mini-title { font-weight: 600; font-size: 14.5px; color: var(--ink); }
.v2-mockup-badge { font-size: 11px; font-weight: 600; color: var(--signal-deep); background: var(--signal-tint); padding: 3px 10px; border-radius: 100px; }
.v2-mockup-stat-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 18px; }
.v2-mockup-stat-label { font-size: 11px; color: var(--ink-faint); margin-bottom: 6px; }
.v2-mockup-stat-val { font-family: var(--mono); font-weight: 500; font-size: 18px; color: var(--ink); }
.v2-mockup-stat-val.signal { color: var(--signal); }
.v2-mockup-roi { background: var(--canvas); border-radius: 10px; padding: 14px 16px; }
.v2-mockup-roi-label { font-size: 11.5px; font-weight: 600; color: var(--ink-faint); margin-bottom: 10px; }
.v2-mockup-roi-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--ink-soft); padding: 5px 0; }
.v2-mockup-roi-row strong { font-family: var(--mono); font-weight: 500; color: var(--ink); }
.v2-mockup-roi-row strong.signal { color: var(--signal); }

/* Inbox mockup (module 3) */
.v2-mockup-inbox { background: var(--paper); border: 1px solid var(--line); border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-lift); max-width: 420px; margin: 0 auto; }
.v2-mockup-inbox-row { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-bottom: 1px solid var(--line); }
.v2-mockup-inbox-row:last-child { border-bottom: none; }
.v2-mockup-inbox-av { width: 36px; height: 36px; border-radius: 50%; background: var(--ink); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 13px; flex-shrink: 0; }
.v2-mockup-inbox-mid { flex: 1; min-width: 0; }
.v2-mockup-inbox-name { font-size: 13.5px; font-weight: 600; color: var(--ink); margin-bottom: 2px; }
.v2-mockup-inbox-msg { font-size: 12.5px; color: var(--ink-faint); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.v2-mockup-inbox-right { text-align: right; flex-shrink: 0; }
.v2-mockup-inbox-time { font-size: 11px; color: var(--ink-faint); margin-bottom: 5px; }
.v2-mockup-ai-pill { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 100px; background: var(--canvas); color: var(--ink-faint); }
.v2-mockup-ai-pill.on { background: var(--signal-tint); color: var(--signal-deep); }

@media(max-width: 860px) {
  .v2-module, .v2-module.reverse { grid-template-columns: 1fr; gap: 28px; }
  .v2-module.reverse .v2-module-text { order: 1; }
  .v2-module.reverse .v2-module-visual { order: 2; }
}

/* ── COMPARISON TABLE ── */
.v2-cmp { margin-top: 48px; border: 1px solid var(--line); border-radius: 14px; overflow: hidden; background: var(--paper); }
.v2-cmp-row { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; }
.v2-cmp-row + .v2-cmp-row { border-top: 1px solid var(--line); }
.v2-cmp-cell { padding: 16px 18px; font-size: 13.5px; display: flex; align-items: center; gap: 8px; }
.v2-cmp-head .v2-cmp-cell { font-weight: 600; font-size: 12.5px; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.02em; background: var(--canvas); }
.v2-cmp-row:not(.v2-cmp-head) .v2-cmp-cell:first-child { font-weight: 500; color: var(--ink); }
.v2-cmp-cell.us { background: var(--signal-tint-2); color: var(--ink); font-weight: 500; }
.v2-cmp-cell.bad { color: var(--ink-faint); }
@media(max-width: 700px) {
  .v2-cmp-row { grid-template-columns: 1fr; }
  .v2-cmp-cell { padding: 10px 16px; border-bottom: 1px solid var(--line-soft); }
}

/* ── TESTIMONIALS ── */
.v2-test-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-top: 48px; }
.v2-test-card { background: var(--paper); border: 1px solid var(--line); border-radius: 14px; padding: 26px; display: flex; flex-direction: column; gap: 18px; }
.v2-test-metric { display: flex; align-items: baseline; gap: 8px; }
.v2-test-metric-num { font-family: var(--display); font-weight: 600; font-size: 26px; color: var(--signal); }
.v2-test-metric-label { font-size: 12.5px; color: var(--ink-faint); }
.v2-test-quote { font-size: 14.5px; color: var(--ink-soft); line-height: 1.7; flex: 1; }
.v2-test-auth { display: flex; align-items: center; gap: 10px; padding-top: 16px; border-top: 1px solid var(--line); }
.v2-test-av { width: 36px; height: 36px; border-radius: 50%; background: var(--ink); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 13px; flex-shrink: 0; }
.v2-test-name { font-weight: 600; font-size: 13.5px; color: var(--ink); }
.v2-test-role { font-size: 12px; color: var(--ink-faint); }

/* ── PRICING ── */
.v2-toggle { display: inline-flex; align-items: center; gap: 4px; background: var(--canvas); border: 1px solid var(--line); border-radius: 100px; padding: 4px; margin: 0 auto 48px; }
.v2-toggle-btn { padding: 8px 18px; border-radius: 100px; font-size: 13.5px; font-weight: 600; border: none; background: transparent; color: var(--ink-faint); cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif; display: flex; align-items: center; gap: 6px; }
.v2-toggle-btn.on { background: var(--ink); color: white; }
.v2-toggle-save { font-size: 10.5px; font-weight: 700; background: var(--signal-tint); color: var(--signal-deep); padding: 1px 7px; border-radius: 100px; }
.v2-toggle-btn.on .v2-toggle-save { background: rgba(255,255,255,0.18); color: white; }
.v2-pgrid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; align-items: start; }
.v2-plan { background: var(--paper); border: 1px solid var(--line); border-radius: 16px; padding: 30px 26px; position: relative; }
.v2-plan.pop { border: 1.5px solid var(--signal); box-shadow: var(--shadow-lift); }
.v2-plan-badge { position: absolute; top: -1px; left: 24px; transform: translateY(-50%); background: var(--signal); color: white; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 100px; }
.v2-plan-name { font-family: var(--display); font-weight: 600; font-size: 17px; color: var(--ink); margin-bottom: 4px; }
.v2-plan-desc { font-size: 13px; color: var(--ink-faint); margin-bottom: 20px; }
.v2-plan-price { display: flex; align-items: baseline; gap: 4px; margin-bottom: 4px; }
.v2-plan-curr { font-size: 18px; font-weight: 600; color: var(--ink); }
.v2-plan-amt { font-family: var(--display); font-weight: 600; font-size: 40px; color: var(--ink); letter-spacing: -0.02em; }
.v2-plan-period { font-size: 13px; color: var(--ink-faint); }
.v2-plan-annual-note { font-size: 12px; color: var(--ink-faint); margin-bottom: 22px; min-height: 16px; }
.v2-plan-list { list-style: none; display: flex; flex-direction: column; gap: 11px; margin-bottom: 26px; }
.v2-plan-list li { display: flex; align-items: flex-start; gap: 9px; font-size: 13.5px; color: var(--ink-soft); }
.v2-plan-list li svg { flex-shrink: 0; margin-top: 2px; color: var(--signal); }
.v2-plan-btn { display: block; text-align: center; padding: 12px; border-radius: 9px; font-weight: 600; font-size: 14px; text-decoration: none; transition: all 0.2s; }
.v2-plan-btn.go { background: var(--ink); color: white; }
.v2-plan-btn.go:hover { background: var(--signal-deep); }
.v2-plan-btn.out { background: transparent; color: var(--ink); border: 1px solid var(--line); }
.v2-plan-btn.out:hover { border-color: var(--ink-faint); background: var(--canvas); }

/* ── FINAL CTA ── */
.v2-fcta { padding: clamp(80px,10vw,128px) clamp(20px,4vw,48px); background: var(--ink); text-align: center; }
.v2-fcta-h { font-family: var(--display); font-weight: 600; font-size: clamp(30px,4.5vw,48px); color: white; letter-spacing: -0.03em; margin-bottom: 16px; max-width: 640px; margin-left: auto; margin-right: auto; }
.v2-fcta-p { font-size: 16px; color: rgba(255,255,255,0.65); max-width: 480px; margin: 0 auto 36px; line-height: 1.6; }
.v2-fcta-btns { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; }
.v2-fcta .v2-btn-primary { background: white; color: var(--ink); }
.v2-fcta .v2-btn-primary:hover { background: var(--signal-tint); }
.v2-fcta .v2-btn-secondary { color: white; border-color: rgba(255,255,255,0.2); }
.v2-fcta .v2-btn-secondary:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.3); }

/* ── FOOTER ── */
.v2-footer { background: var(--paper); border-top: 1px solid var(--line); padding: clamp(48px,6vw,64px) clamp(20px,4vw,48px) 32px; }
.v2-footer-in { max-width: 1140px; margin: 0 auto; }
.v2-footer-top { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr; gap: clamp(24px,4vw,48px); margin-bottom: 48px; }
.v2-footer-tag { font-size: 13.5px; color: var(--ink-soft); line-height: 1.7; margin-top: 14px; max-width: 260px; }
.v2-footer-head { font-size: 11px; font-weight: 700; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 14px; }
.v2-footer-links { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.v2-footer-links a { font-size: 13.5px; color: var(--ink-soft); text-decoration: none; }
.v2-footer-links a:hover { color: var(--ink); }
.v2-footer-bot { padding-top: 24px; border-top: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; font-size: 12.5px; color: var(--ink-faint); flex-wrap: wrap; gap: 10px; }

/* ── LIVE CHAT SIM (used in solution section) ── */
.v2-chatsim { background: var(--canvas); border-radius: 16px; padding: 4px; }
.v2-chatsim-in { background: var(--paper); border-radius: 13px; overflow: hidden; border: 1px solid var(--line); }
.v2-chatsim-head { padding: 14px 18px; border-bottom: 1px solid var(--line); display: flex; align-items: center; gap: 10px; }
.v2-chatsim-av { width: 32px; height: 32px; border-radius: 50%; background: var(--ink); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px; }
.v2-chatsim-name { font-weight: 600; font-size: 13.5px; color: var(--ink); }
.v2-chatsim-status { font-size: 11px; color: var(--signal); display: flex; align-items: center; gap: 5px; }
.v2-chatsim-status::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--signal); }
.v2-chatsim-body { padding: 18px; min-height: 200px; display: flex; flex-direction: column; gap: 10px; }
.v2-msg { max-width: 78%; padding: 10px 14px; border-radius: 12px; font-size: 13.5px; line-height: 1.5; white-space: pre-wrap; animation: v2msgin 0.3s ease both; }
.v2-msg.c { background: var(--ink); color: white; align-self: flex-end; border-radius: 12px 3px 12px 12px; }
.v2-msg.a { background: var(--canvas); color: var(--ink); align-self: flex-start; border-radius: 3px 12px 12px 12px; border: 1px solid var(--line); }
.v2-msg-time { font-size: 10px; opacity: 0.5; margin-top: 4px; display: block; }
@keyframes v2msgin { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

@media(max-width: 860px) {
  .v2-nmid, .v2-signin { display: none; }
  .v2-hbg { display: flex; }
  .v2-hero { padding-top: 110px; }
  .v2-hero-in { grid-template-columns: 1fr; }
  .v2-hero-left { max-width: 100%; }
  .v2-problem-grid { grid-template-columns: 1fr; }
  .v2-feat-grid { grid-template-columns: 1fr; }
  .v2-test-grid { grid-template-columns: 1fr; }
  .v2-pgrid { grid-template-columns: 1fr; }
  .v2-footer-top { grid-template-columns: 1fr; }
  .v2-dash-kpis { grid-template-columns: repeat(2,1fr); }
}
      `}</style>

      {/* ── NAV ── */}
      <nav className={`v2-nav${scrolled ? " sc" : ""}`}>
        <a href="/" className="v2-logo">
          <img src="/logo.png" alt="Fastrill" className="v2-logo-img" />
          <span className="v2-logo-text">fast<em>rill</em></span>
        </a>
        <ul className="v2-nmid">
          {[["#product", "Product"], ["#customers", "Customers"], ["#pricing", "Pricing"]].map(([h, l]) => (
            <li key={h}><a href={h}>{l}</a></li>
          ))}
        </ul>
        <div className="v2-nr">
          <a href="/login" className="v2-signin">Sign in</a>
          <a href="/signup" className="v2-cta-nav">Start free <Icon name="arrow" size={14} /></a>
          <button className="v2-hbg">≡</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="v2-hero">
        <div className="v2-hero-mesh" />
        <div className="v2-hero-grid" />
        <div className="v2-hero-in">
          <div className="v2-hero-left">
            <div className="v2-eyebrow">AI revenue engine for <strong>service businesses</strong></div>
            <h1 className="v2-h1">Stop losing leads on WhatsApp.</h1>
            <p className="v2-sub">
              Fastrill replies in seconds, qualifies the customer, and books the appointment automatically — day or night, in their language.
            </p>
            <div className="v2-hero-btns">
              <a href="/signup" className="v2-btn-primary">Get started free <Icon name="arrow" size={16} /></a>
              <a href="#demo" className="v2-btn-secondary"><Icon name="play" size={15} /> See it in action</a>
            </div>
            <div className="v2-hero-trust-mini">
              <div className="v2-mini-avatars">
                {["P","R","S","A"].map((c,i)=>(<span key={i} className="v2-mini-av" style={{zIndex:4-i}}>{c}</span>))}
              </div>
              <span>80+ businesses already converting more leads</span>
            </div>
          </div>

          <div className="v2-dash-wrap">
            <div className="v2-float-chip v2-chip-1">
              <span className="v2-chip-ico"><Icon name="check" size={11} /></span>
              Appointment booked
            </div>
            <div className="v2-float-chip v2-chip-2">
              <span className="v2-chip-ico"><Icon name="check" size={11} /></span>
              Lead recovered
            </div>
            <div className="v2-float-chip v2-chip-3">
              <span className="v2-chip-ico"><Icon name="check" size={11} /></span>
              Reply sent in 1.8s
            </div>
            <div className="v2-dash">
              <div className="v2-dash-bar">
                <span className="v2-dash-dot" /><span className="v2-dash-dot" /><span className="v2-dash-dot" />
              </div>
              <div className="v2-dash-body">
                <div className="v2-dash-head">
                  <div>
                    <div className="v2-dash-title">Campaign performance</div>
                    <div className="v2-dash-sub">14 campaigns · Real-time tracking</div>
                  </div>
                </div>
                <div className="v2-dash-kpis">
                  <div className="v2-kpi"><div className="v2-kpi-label">Total sent</div><div className="v2-kpi-val">3,214</div></div>
                  <div className="v2-kpi"><div className="v2-kpi-label">Delivery rate</div><div className="v2-kpi-val signal">98%</div></div>
                  <div className="v2-kpi"><div className="v2-kpi-label">Read rate</div><div className="v2-kpi-val">81%</div></div>
                  <div className="v2-kpi"><div className="v2-kpi-label">Reply rate</div><div className="v2-kpi-val signal">34%</div></div>
                </div>
                <div className="v2-dash-rev">
                  <div className="v2-dash-rev-label">Revenue impact</div>
                  <div className="v2-dash-rev-grid">
                    <div><div className="v2-dash-rev-item-label">Est. bookings</div><div className="v2-dash-rev-item-val">218</div></div>
                    <div><div className="v2-dash-rev-item-label">Est. revenue</div><div className="v2-dash-rev-item-val">₹2,61,600</div></div>
                    <div><div className="v2-dash-rev-item-label">ROI</div><div className="v2-dash-rev-item-val">+412%</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <div className="v2-trust">
        <div className="v2-trust-in">
          {[["80+", "businesses on Fastrill"], ["2s", "average response time"], ["10+", "Indian languages"], ["24/7", "always responding"]].map(([n, l]) => (
            <div key={l} className="v2-trust-item">
              <span className="v2-trust-num">{n}</span>
              <span className="v2-trust-label">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── PROBLEM ── */}
      <section className="v2-sec" id="product">
        <div className="v2-w">
          <div className="v2-fade">
            <div className="v2-label">The cost of waiting</div>
            <h2 className="v2-h2">Every missed WhatsApp message costs you a customer.</h2>
            <p className="v2-p">Your ads are working. The follow-up isn't — and that gap is where the revenue disappears.</p>
          </div>
          <div className="v2-problem-grid">
            {[
              { t: "Slow responses", d: "A customer messages at 10 PM. You reply at 9 AM. They've already booked someone else." },
              { t: "No follow-up", d: "Leads who ask about price and go quiet are gone for good — nobody circles back." },
              { t: "Manual everything", d: "Every booking, reschedule and reminder takes a person's time, every single day." },
            ].map((p) => (
              <div key={p.t} className="v2-problem-card v2-fade">
                <div className="v2-problem-row">
                  <span className="v2-problem-x"><Icon name="x" size={11} /></span>
                  <span className="v2-problem-title">{p.t}</span>
                </div>
                <p className="v2-problem-desc">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIFECYCLE RAIL — signature element ── */}
      <section className="v2-sec alt" ref={lifecycleRef}>
        <div className="v2-w">
          <div className="v2-fade" style={{ textAlign: "center" }}>
            <div className="v2-label" style={{ justifyContent: "center", display: "flex" }}>How it works</div>
            <h2 className="v2-h2 v2-h2-c">From message to booked, in one conversation.</h2>
            <p className="v2-p v2-p-c">A real exchange — start to finish, with no human in the loop.</p>
          </div>
          <div className="v2-rail-wrap">
            <div className="v2-rail-line">
              <div className="v2-rail-line-fill" style={{ width: lifecycleActive >= 0 ? `${(lifecycleActive / (LIFECYCLE.length - 1)) * 100}%` : "0%" }} />
            </div>
            <div className="v2-rail">
              {LIFECYCLE.map((node, i) => (
                <div key={node.label} className={`v2-rail-node${i <= lifecycleActive ? " active" : ""}`}>
                  <div className="v2-rail-dot">{i <= lifecycleActive ? <Icon name="check" size={15} /> : i + 1}</div>
                  <div className="v2-rail-label">{node.label}</div>
                  <div className="v2-rail-time">{node.time}</div>
                  <div className="v2-rail-desc">{node.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE DEMO ── */}
      <section className="v2-sec" id="demo">
        <div className="v2-w" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
          <div className="v2-fade">
            <div className="v2-label">Live example</div>
            <h2 className="v2-h2">No scripts. No button menus. Just a conversation.</h2>
            <p className="v2-p" style={{ marginBottom: 28 }}>
              The customer types like they would to a person. Fastrill understands intent, collects what it needs, and confirms — without ever feeling like a bot.
            </p>
            <a href="/signup" className="v2-btn-primary">Try it on your number <Icon name="arrow" size={16} /></a>
          </div>
          <div className="v2-fade">
            <div className="v2-chatsim">
              <div className="v2-chatsim-in">
                <div className="v2-chatsim-head">
                  <div className="v2-chatsim-av">R</div>
                  <div>
                    <div className="v2-chatsim-name">Riya Salon</div>
                    <div className="v2-chatsim-status">Fastrill AI · Online</div>
                  </div>
                </div>
                <div className="v2-chatsim-body" ref={demoRef}>
                  {demoMsgs.map((m, i) => (
                    <div key={i} className={`v2-msg ${m.r}`}>
                      {m.m}
                      <span className="v2-msg-time">{m.t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MODULES — real product screenshots, alternating layout ── */}
      <section className="v2-sec alt">
        <div className="v2-w">
          <div className="v2-fade">
            <div className="v2-label">What's inside</div>
            <h2 className="v2-h2">Not a chatbot. A revenue system.</h2>
            <p className="v2-p">Three modules working together — conversation, campaigns and bookings, all in one dashboard.</p>
          </div>

          {/* Module 1 — Booking conversation */}
          <div className="v2-module">
            <div className="v2-module-text v2-fade">
              <div className="v2-module-tag">Booking</div>
              <h3 className="v2-module-title">Books the appointment, start to finish.</h3>
              <p className="v2-module-desc">Service, date, time, confirmation — collected in order, checked against real availability, and confirmed without a human touching it.</p>
              <ul className="v2-module-list">
                <li><Icon name="check" size={15} />Understands casual, mixed-language messages</li>
                <li><Icon name="check" size={15} />Checks real slot availability before confirming</li>
                <li><Icon name="check" size={15} />Notifies the owner the moment it's booked</li>
              </ul>
            </div>
            <div className="v2-module-visual v2-fade">
              <div className="v2-mockup-wa">
                <div className="v2-mockup-wa-head">
                  <div className="v2-mockup-av">R</div>
                  <div>
                    <div className="v2-mockup-name">Riya Salon</div>
                    <div className="v2-mockup-status">Fastrill AI · Online</div>
                  </div>
                </div>
                <div className="v2-mockup-wa-body">
                  <div className="v2-msg c">Hi, I want a haircut tomorrow around 3pm</div>
                  <div className="v2-msg a">Tomorrow's great — 3 PM is available.{"\n\n"}Shall I confirm Haircut for tomorrow at 3:00 PM?</div>
                  <div className="v2-msg c">Yes please!</div>
                  <div className="v2-msg a">Booking confirmed.{"\n\n"}Haircut · Tomorrow · 3:00 PM</div>
                </div>
              </div>
            </div>
          </div>

          {/* Module 2 — Campaign dashboard */}
          <div className="v2-module reverse">
            <div className="v2-module-text v2-fade">
              <div className="v2-module-tag">Campaigns</div>
              <h3 className="v2-module-title">See exactly what each campaign earned.</h3>
              <p className="v2-module-desc">Send approved WhatsApp templates to customer segments, and track delivery, replies and revenue attributed to that exact send.</p>
              <ul className="v2-module-list">
                <li><Icon name="check" size={15} />Segment by tag — new, returning, VIP, inactive</li>
                <li><Icon name="check" size={15} />Real Meta delivery and read tracking</li>
                <li><Icon name="check" size={15} />Revenue and ROI per campaign, not just opens</li>
              </ul>
            </div>
            <div className="v2-module-visual v2-fade">
              <div className="v2-mockup-dash-mini">
                <div className="v2-mockup-dash-mini-head">
                  <div className="v2-mockup-dash-mini-title">Winter offer — January</div>
                  <span className="v2-mockup-badge">Done</span>
                </div>
                <div className="v2-mockup-stat-row">
                  <div><div className="v2-mockup-stat-label">Sent</div><div className="v2-mockup-stat-val">412</div></div>
                  <div><div className="v2-mockup-stat-label">Delivered</div><div className="v2-mockup-stat-val">404</div></div>
                  <div><div className="v2-mockup-stat-label">Replied</div><div className="v2-mockup-stat-val signal">138</div></div>
                </div>
                <div className="v2-mockup-roi">
                  <div className="v2-mockup-roi-label">Revenue impact</div>
                  <div className="v2-mockup-roi-row">
                    <span>Est. bookings</span><strong>82</strong>
                  </div>
                  <div className="v2-mockup-roi-row">
                    <span>Est. revenue</span><strong>₹98,400</strong>
                  </div>
                  <div className="v2-mockup-roi-row">
                    <span>ROI</span><strong className="signal">+612%</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Module 3 — Conversations inbox */}
          <div className="v2-module">
            <div className="v2-module-text v2-fade">
              <div className="v2-module-tag">Inbox</div>
              <h3 className="v2-module-title">One inbox. Every conversation, every customer.</h3>
              <p className="v2-module-desc">See every conversation live, take over manually whenever you want, and let the AI pick back up the moment you're done.</p>
              <ul className="v2-module-list">
                <li><Icon name="check" size={15} />Toggle AI off for any single conversation</li>
                <li><Icon name="check" size={15} />Full customer history and tags in one view</li>
                <li><Icon name="check" size={15} />Works across 10+ Indian languages</li>
              </ul>
            </div>
            <div className="v2-module-visual v2-fade">
              <div className="v2-mockup-inbox">
                {[
                  { n: "Priya Nair", m: "Yes please, book me for 3 PM", t: "now", on: true },
                  { n: "Arjun Mehta", m: "Do you have dermatology also", t: "2m", on: true },
                  { n: "Sneha Reddy", m: "Thank you so much!", t: "14m", on: false },
                ].map((c) => (
                  <div key={c.n} className="v2-mockup-inbox-row">
                    <div className="v2-mockup-inbox-av">{c.n.charAt(0)}</div>
                    <div className="v2-mockup-inbox-mid">
                      <div className="v2-mockup-inbox-name">{c.n}</div>
                      <div className="v2-mockup-inbox-msg">{c.m}</div>
                    </div>
                    <div className="v2-mockup-inbox-right">
                      <div className="v2-mockup-inbox-time">{c.t}</div>
                      <div className={`v2-mockup-ai-pill${c.on ? " on" : ""}`}>{c.on ? "AI on" : "Manual"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARISON ── */}
      <section className="v2-sec" id="customers">
        <div className="v2-w">
          <div className="v2-fade" style={{ textAlign: "center" }}>
            <div className="v2-label" style={{ justifyContent: "center", display: "flex" }}>Why Fastrill</div>
            <h2 className="v2-h2 v2-h2-c">Built for the gap other tools leave open.</h2>
            <p className="v2-p v2-p-c">Manual replies don't scale. Generic WhatsApp tools don't book. Fastrill does both.</p>
          </div>
          <div className="v2-cmp v2-fade">
            <div className="v2-cmp-row v2-cmp-head">
              <div className="v2-cmp-cell" />
              <div className="v2-cmp-cell">Manual</div>
              <div className="v2-cmp-cell">Generic tools</div>
              <div className="v2-cmp-cell">Fastrill</div>
            </div>
            {COMPARISON_ROWS.map((row) => (
              <div key={row[0]} className="v2-cmp-row">
                <div className="v2-cmp-cell">{row[0]}</div>
                <div className="v2-cmp-cell bad">{row[1]}</div>
                <div className="v2-cmp-cell bad">{row[2]}</div>
                <div className="v2-cmp-cell us"><Icon name="check" size={14} />{row[3]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="v2-sec alt">
        <div className="v2-w">
          <div className="v2-fade" style={{ textAlign: "center" }}>
            <div className="v2-label" style={{ justifyContent: "center", display: "flex" }}>Results</div>
            <h2 className="v2-h2 v2-h2-c">Real revenue from real businesses.</h2>
          </div>
          <div className="v2-test-grid">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="v2-test-card v2-fade">
                <div className="v2-test-metric">
                  <span className="v2-test-metric-num">{t.metric}</span>
                  <span className="v2-test-metric-label">{t.metricLabel}</span>
                </div>
                <p className="v2-test-quote">"{t.quote}"</p>
                <div className="v2-test-auth">
                  <div className="v2-test-av">{t.name.charAt(0)}</div>
                  <div>
                    <div className="v2-test-name">{t.name}</div>
                    <div className="v2-test-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="v2-sec" id="pricing">
        <div className="v2-w">
          <div className="v2-fade" style={{ textAlign: "center" }}>
            <div className="v2-label" style={{ justifyContent: "center", display: "flex" }}>Pricing</div>
            <h2 className="v2-h2 v2-h2-c">Simple pricing. Pays for itself.</h2>
            <p className="v2-p v2-p-c" style={{ marginBottom: 32 }}>No per-message fees. Cancel anytime.</p>
          </div>
          <div className="v2-fade" style={{ display: "flex", justifyContent: "center" }}>
            <div className="v2-toggle">
              <button className={`v2-toggle-btn${billing === "monthly" ? " on" : ""}`} onClick={() => setBilling("monthly")}>Monthly</button>
              <button className={`v2-toggle-btn${billing === "annual" ? " on" : ""}`} onClick={() => setBilling("annual")}>
                Annual <span className="v2-toggle-save">Save 17%</span>
              </button>
            </div>
          </div>
          <div className="v2-pgrid">
            {PRICING.map((plan) => {
              const price = billing === "annual" ? annualPrice(plan.monthly) : plan.monthly
              return (
                <div key={plan.name} className={`v2-plan v2-fade${plan.popular ? " pop" : ""}`}>
                  {plan.popular && <div className="v2-plan-badge">Most popular</div>}
                  <div className="v2-plan-name">{plan.name}</div>
                  <div className="v2-plan-desc">{plan.desc}</div>
                  <div className="v2-plan-price">
                    <span className="v2-plan-curr">₹</span>
                    <span className="v2-plan-amt">{price.toLocaleString("en-IN")}</span>
                    <span className="v2-plan-period">/month</span>
                  </div>
                  <div className="v2-plan-annual-note">
                    {billing === "annual" ? `Billed ₹${(price * 12).toLocaleString("en-IN")} yearly` : "Billed monthly"}
                  </div>
                  <ul className="v2-plan-list">
                    {plan.features.map((f) => (
                      <li key={f}><Icon name="check" size={15} />{f}</li>
                    ))}
                  </ul>
                  <a href="/signup" className={`v2-plan-btn ${plan.popular ? "go" : "out"}`}>{plan.cta}</a>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="v2-fcta">
        <h2 className="v2-fcta-h">Turn every WhatsApp conversation into revenue.</h2>
        <p className="v2-fcta-p">Start automating replies, recovering leads, and booking customers today.</p>
        <div className="v2-fcta-btns">
          <a href="/signup" className="v2-btn-primary">Start free trial <Icon name="arrow" size={16} /></a>
          <a href="https://wa.me/916309279265" className="v2-btn-secondary">Talk to us on WhatsApp</a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="v2-footer">
        <div className="v2-footer-in">
          <div className="v2-footer-top">
            <div>
              <div className="v2-logo">
                <img src="/logo.png" alt="Fastrill" className="v2-logo-img" />
                <span className="v2-logo-text">fast<em>rill</em></span>
              </div>
              <p className="v2-footer-tag">AI-powered WhatsApp automation for Indian service businesses. Built by Solvabil Pvt. Ltd.</p>
            </div>
            {[
              { h: "Product", links: [["Features", "#product"], ["Pricing", "#pricing"], ["Demo", "#demo"]] },
              { h: "Company", links: [["About", "#"], ["Contact", "mailto:team@fastrill.com"], ["Call us", "tel:+916309279265"]] },
              { h: "Legal", links: [["Privacy", "/privacy"], ["Terms", "/terms"]] },
            ].map((col) => (
              <div key={col.h}>
                <div className="v2-footer-head">{col.h}</div>
                <ul className="v2-footer-links">
                  {col.links.map(([n, h]) => (<li key={n}><a href={h}>{n}</a></li>))}
                </ul>
              </div>
            ))}
          </div>
          <div className="v2-footer-bot">
            <span>© 2026 Fastrill, a product by Solvabil Pvt. Ltd.</span>
            <span>Made in India</span>
          </div>
        </div>
      </footer>
    </>
  )
}
