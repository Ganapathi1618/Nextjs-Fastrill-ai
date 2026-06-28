"use client"

import { useState, useEffect, useRef } from "react"

// ─── CHAT DEMO SEQUENCE ───────────────────────────────────────
const CHAT_SEQUENCE = [
  { role: "customer", text: "Hi, I want a haircut tomorrow 3pm", delay: 0 },
  { role: "typing", delay: 800 },
  { role: "ai", text: "Tomorrow 3 PM works! Shall I confirm Haircut for Saturday, 29 March at 3:00 PM? ✅", delay: 1600 },
  { role: "customer", text: "Yes please!", delay: 3200 },
  { role: "typing", delay: 3800 },
  { role: "ai", text: "Booking confirmed 🎉\n\nHaircut · 29 March · 3:00 PM\nSee you then!", delay: 4400 },
]

const STATS = [
  { value: "1.8s", label: "avg reply time" },
  { value: "99%", label: "delivery rate" },
  { value: "3,200+", label: "bookings / month" },
  { value: "10+", label: "languages" },
]

const FEATURES = [
  {
    tag: "Booking Engine",
    title: "Books appointments end-to-end",
    desc: "Service, date, time, confirmation — collected naturally and checked against real availability. No human needed.",
    detail: ["Understands mixed-language messages", "Checks real slot availability", "Instant owner notification"],
  },
  {
    tag: "Campaigns",
    title: "Know exactly what each campaign earned",
    desc: "Send WhatsApp templates to customer segments. Track delivery, replies, and revenue attributed to every send.",
    detail: ["Segment by tag — new, VIP, inactive", "Real Meta delivery tracking", "Revenue & ROI per campaign"],
  },
  {
    tag: "Smart Inbox",
    title: "One inbox. Every conversation.",
    desc: "See all conversations live. Take over manually anytime. AI picks back up the moment you're done.",
    detail: ["Toggle AI per conversation", "Full customer history", "Works in 10+ Indian languages"],
  },
]

const TESTIMONIALS = [
  { name: "Priya Nair", biz: "Glow Parlour, Hyderabad", stat: "+43%", statLabel: "bookings", quote: "Customers now book at midnight and wake up to a confirmation. Paid for itself in the first week." },
  { name: "Dr. Ravi Sharma", biz: "Skin First Clinic, Vijayawada", stat: "₹22k", statLabel: "saved / month", quote: "My patients message in Telugu and the AI replies in Telugu. I had to see it to believe it wasn't a person." },
  { name: "Sneha Reddy", biz: "Studio S, Bangalore", stat: "0", statLabel: "missed messages", quote: "Two branches, both inboxes handled at once. Staff stopped checking phones and started focusing on customers." },
]

const PLANS = [
  { name: "Starter", price: 999, desc: "Solo operators", features: ["1 WhatsApp number", "300 AI conversations / mo", "Booking automation", "10+ Indian languages"], missing: ["Lead recovery", "Campaigns"] },
  { name: "Growth", price: 1999, desc: "Growing businesses", features: ["Unlimited conversations", "Lead recovery", "WhatsApp campaigns", "Revenue analytics", "Customer memory"], pop: true },
  { name: "Pro", price: 4999, desc: "Multi-branch teams", features: ["Up to 5 numbers", "Everything in Growth", "Multi-branch management", "Custom AI playbook", "Dedicated onboarding"] },
]

const FAQS = [
  { q: "Do I need to change my WhatsApp number?", a: "No. You keep your existing WhatsApp Business number. Fastrill connects via Meta's official Business API." },
  { q: "How long does setup take?", a: "About 10 minutes from account creation to your first AI reply." },
  { q: "Which languages does Fastrill support?", a: "Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi and English — auto-detected per conversation." },
  { q: "Can I reply manually?", a: "Yes, always. Toggle AI off for any conversation, reply yourself, toggle back. You're always in control." },
  { q: "Is there a free trial?", a: "14 days, full Growth plan access, no credit card required." },
]

function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect() } }, { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return [ref, inView]
}

function ChatDemo() {
  const [messages, setMessages] = useState([])
  const [showTyping, setShowTyping] = useState(false)
  const [ref, inView] = useInView(0.3)
  const bodyRef = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    if (!inView || started.current) return
    started.current = true
    CHAT_SEQUENCE.forEach(step => {
      setTimeout(() => {
        if (step.role === "typing") { setShowTyping(true); return }
        setShowTyping(false)
        if (step.role !== "typing") {
          setMessages(p => [...p, step])
          setTimeout(() => { if (bodyRef.current) bodyRef.current.scrollTop = 9999 }, 50)
        }
      }, step.delay)
    })
  }, [inView])

  return (
    <div ref={ref} className="chat-demo">
      <div className="chat-header">
        <div className="chat-avatar">R</div>
        <div>
          <div className="chat-name">Riya Salon</div>
          <div className="chat-online"><span className="online-dot" />AI Active</div>
        </div>
        <div className="chat-badge">fastrill</div>
      </div>
      <div className="chat-body" ref={bodyRef}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role}`} style={{ animationDelay: "0ms" }}>
            {m.text}
          </div>
        ))}
        {showTyping && (
          <div className="chat-typing">
            <span /><span /><span />
          </div>
        )}
      </div>
      <div className="chat-footer">
        <div className="chat-tag">⚡ Replied in 1.8 seconds</div>
      </div>
    </div>
  )
}

function FeatureCard({ feature, index }) {
  const [ref, inView] = useInView(0.1)
  const [hovered, setHovered] = useState(false)
  return (
    <div
      ref={ref}
      className={`feature-card${inView ? " visible" : ""}${hovered ? " hovered" : ""}`}
      style={{ transitionDelay: `${index * 100}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="feature-card-inner">
        <div className="feature-tag">{feature.tag}</div>
        <h3 className="feature-title">{feature.title}</h3>
        <p className="feature-desc">{feature.desc}</p>
        <ul className="feature-list">
          {feature.detail.map(d => (
            <li key={d}><CheckIcon />{d}</li>
          ))}
        </ul>
      </div>
      <div className="feature-glow" />
    </div>
  )
}

function StatCard({ value, label, index }) {
  const [ref, inView] = useInView(0.3)
  return (
    <div ref={ref} className={`stat-card${inView ? " visible" : ""}`} style={{ transitionDelay: `${index * 80}ms` }}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function FAQ({ q, a, index }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`faq-item${open ? " open" : ""}`}>
      <button className="faq-q" onClick={() => setOpen(p => !p)}>
        {q}
        <span className="faq-icon">{open ? "−" : "+"}</span>
      </button>
      <div className="faq-a">{a}</div>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export default function Page() {
  const [scrolled, setScrolled] = useState(false)
  const [mobOpen, setMobOpen] = useState(false)
  const [billing, setBilling] = useState("monthly")
  const [activeT, setActiveT] = useState(0)
  const [heroRef, heroInView] = useInView(0.1)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setActiveT(p => (p + 1) % TESTIMONIALS.length), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300;0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800;0,14..32,900;1,14..32,400&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        :root {
          --bg: #080A0F;
          --bg1: #0D1017;
          --bg2: #121620;
          --border: rgba(255,255,255,0.06);
          --border2: rgba(255,255,255,0.10);
          --border3: rgba(255,255,255,0.16);
          --ink: #F1F3F7;
          --ink2: #B8BFCC;
          --ink3: #717A8C;
          --ink4: #404855;
          --teal: #39D3BB;
          --teal-dim: rgba(57,211,187,0.12);
          --teal-glow: rgba(57,211,187,0.08);
          --red: #E2574C;
          --sans: 'Inter', system-ui, sans-serif;
          --mono: 'JetBrains Mono', monospace;
          --ease: cubic-bezier(0.16, 1, 0.3, 1);
        }

        body {
          background: var(--bg);
          color: var(--ink2);
          font-family: var(--sans);
          font-size: 15px;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        /* ── NOISE TEXTURE ── */
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-size: 128px 128px;
        }

        /* ── REVEAL ANIMATIONS ── */
        .reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s var(--ease), transform 0.7s var(--ease);
        }
        .reveal.visible {
          opacity: 1;
          transform: none;
        }

        /* ── NAV ── */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 clamp(16px, 4vw, 48px);
          transition: background 0.3s, border-color 0.3s;
          border-bottom: 1px solid transparent;
        }
        .nav.scrolled {
          background: rgba(8,10,15,0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom-color: var(--border);
        }
        .nav-logo {
          display: flex; align-items: center; gap: 8px;
          text-decoration: none;
          font-weight: 800; font-size: 17px; letter-spacing: -0.03em;
          color: var(--ink);
        }
        .nav-logo img { width: 26px; height: 26px; object-fit: contain; }
        .nav-logo em { color: var(--teal); font-style: normal; }
        .nav-links { display: flex; gap: 2px; list-style: none; }
        .nav-links a {
          font-size: 13px; font-weight: 500; color: var(--ink3);
          text-decoration: none; padding: 6px 12px; border-radius: 6px;
          transition: color 0.15s, background 0.15s;
        }
        .nav-links a:hover { color: var(--ink); background: rgba(255,255,255,0.04); }
        .nav-right { display: flex; align-items: center; gap: 8px; }
        .nav-signin {
          font-size: 13px; font-weight: 500; color: var(--ink3);
          text-decoration: none; padding: 6px 12px;
          transition: color 0.15s;
        }
        .nav-signin:hover { color: var(--ink); }
        .btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--teal); color: #04120D;
          padding: 8px 18px; border-radius: 8px;
          font-weight: 700; font-size: 13px; text-decoration: none;
          border: none; cursor: pointer; font-family: var(--sans);
          transition: all 0.2s;
          box-shadow: 0 0 0 1px rgba(57,211,187,0.3), 0 2px 8px rgba(57,211,187,0.15);
        }
        .btn-primary:hover {
          background: #2FC4AE;
          box-shadow: 0 0 0 1px rgba(57,211,187,0.5), 0 4px 20px rgba(57,211,187,0.25);
          transform: translateY(-1px);
        }
        .btn-ghost {
          display: inline-flex; align-items: center; gap: 7px;
          background: transparent; color: var(--ink);
          padding: 8px 18px; border-radius: 8px;
          font-weight: 600; font-size: 13px; text-decoration: none;
          border: 1px solid var(--border2); cursor: pointer; font-family: var(--sans);
          transition: all 0.2s;
        }
        .btn-ghost:hover { border-color: var(--border3); background: rgba(255,255,255,0.03); }
        .nav-hbg {
          display: none; background: none; border: 1px solid var(--border2);
          border-radius: 6px; padding: 5px 9px; cursor: pointer;
          color: var(--ink3); font-size: 15px;
        }
        .mob-drawer {
          position: fixed; top: 60px; left: 0; right: 0; z-index: 99;
          background: rgba(8,10,15,0.97); backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          padding: 8px 16px 20px;
          display: flex; flex-direction: column; gap: 2px;
          transform: translateY(-110%); transition: transform 0.25s var(--ease);
        }
        .mob-drawer.open { transform: none; }
        .mob-drawer a {
          color: var(--ink3); text-decoration: none; font-size: 14px;
          font-weight: 500; padding: 11px 12px; border-radius: 8px;
          transition: color 0.15s, background 0.15s;
        }
        .mob-drawer a:hover { color: var(--ink); background: rgba(255,255,255,0.04); }
        @media(max-width:768px) {
          .nav-links, .nav-signin { display: none; }
          .nav-hbg { display: flex; align-items: center; }
        }

        /* ── HERO ── */
        .hero {
          min-height: 100vh;
          display: flex; align-items: center;
          padding: clamp(100px,14vw,160px) clamp(16px,4vw,48px) clamp(64px,8vw,100px);
          position: relative; overflow: hidden;
        }

        /* dot grid */
        .hero-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px);
          background-size: 32px 32px;
          mask-image: radial-gradient(ellipse 80% 70% at 50% 0%, black 30%, transparent 80%);
        }

        /* glow orbs */
        .hero-orb {
          position: absolute; border-radius: 50%;
          filter: blur(100px); pointer-events: none; will-change: transform;
        }
        .hero-orb-1 {
          width: 500px; height: 400px; top: -10%; left: -5%;
          background: radial-gradient(circle, rgba(57,211,187,0.12), transparent 70%);
          animation: drift1 20s ease-in-out infinite;
        }
        .hero-orb-2 {
          width: 400px; height: 300px; top: 0; right: -10%;
          background: radial-gradient(circle, rgba(100,80,255,0.07), transparent 70%);
          animation: drift2 25s ease-in-out infinite;
        }
        @keyframes drift1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(40px,30px)} }
        @keyframes drift2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-30px,20px)} }

        .hero-inner {
          max-width: 1200px; margin: 0 auto;
          position: relative; z-index: 1; width: 100%;
        }

        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          border: 1px solid var(--border2);
          border-radius: 100px; padding: 5px 14px 5px 8px;
          margin-bottom: 28px;
          font-family: var(--mono); font-size: 11px; color: var(--ink3);
          letter-spacing: 0.04em;
          background: rgba(255,255,255,0.02);
        }
        .hero-badge-dot {
          width: 6px; height: 6px; border-radius: 50%; background: var(--teal);
          box-shadow: 0 0 6px var(--teal);
          animation: blink 2s ease-in-out infinite;
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }

        .hero-h1 {
          font-size: clamp(40px, 6.5vw, 84px);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.05em;
          color: var(--ink);
          max-width: 820px;
          margin-bottom: 24px;
        }
        .hero-h1 .dim { color: var(--ink4); }
        .hero-h1 .accent {
          background: linear-gradient(135deg, #39D3BB, #7AE8DA);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-layout {
          display: grid; grid-template-columns: 1fr 420px;
          gap: clamp(32px,5vw,72px); align-items: center;
          margin-top: 12px;
        }

        .hero-sub {
          font-size: clamp(15px,1.3vw,17px); color: var(--ink3);
          line-height: 1.75; max-width: 420px; margin-bottom: 32px;
        }
        .hero-sub strong { color: var(--ink2); font-weight: 600; }

        .hero-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

        .btn-hero {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--teal); color: #04120D;
          padding: 13px 28px; border-radius: 9px;
          font-weight: 700; font-size: 15px; text-decoration: none;
          transition: all 0.2s;
          box-shadow: 0 0 0 1px rgba(57,211,187,0.4), 0 4px 24px rgba(57,211,187,0.2);
          position: relative; overflow: hidden;
        }
        .btn-hero::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, rgba(255,255,255,0.12), transparent);
          border-radius: inherit;
        }
        .btn-hero:hover {
          background: #2FC4AE;
          transform: translateY(-2px);
          box-shadow: 0 0 0 1px rgba(57,211,187,0.6), 0 8px 36px rgba(57,211,187,0.3);
        }

        .btn-hero-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: var(--ink2);
          padding: 13px 22px; border-radius: 9px;
          font-weight: 600; font-size: 15px; text-decoration: none;
          border: 1px solid var(--border2);
          transition: all 0.2s;
        }
        .btn-hero-ghost:hover {
          color: var(--ink); border-color: rgba(57,211,187,0.3);
          background: rgba(57,211,187,0.04);
        }

        .hero-trust {
          display: flex; align-items: center; gap: 20px;
          margin-top: 24px; flex-wrap: wrap;
        }
        .hero-trust-item {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; color: var(--ink4);
        }
        .hero-trust-item::before {
          content: '';
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--teal); opacity: 0.6;
          flex-shrink: 0;
        }

        @media(max-width:900px) {
          .hero-layout { grid-template-columns: 1fr; gap: 40px; }
        }

        /* ── CHAT DEMO ── */
        .chat-demo {
          background: var(--bg1);
          border: 1px solid var(--border2);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 0 0 1px rgba(57,211,187,0.06),
                      0 20px 60px rgba(0,0,0,0.5),
                      0 0 80px rgba(57,211,187,0.04);
          position: relative;
        }
        .chat-demo::before {
          content: '';
          position: absolute; inset: -1px; border-radius: 17px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(57,211,187,0.2) 0%, transparent 40%, transparent 60%, rgba(100,80,255,0.1) 100%);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          -webkit-mask-composite: xor;
          pointer-events: none; z-index: 1;
        }
        .chat-header {
          background: var(--bg2); border-bottom: 1px solid var(--border);
          padding: 12px 16px;
          display: flex; align-items: center; gap: 10px;
        }
        .chat-avatar {
          width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #39D3BB, #2A9D8F);
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 12px; color: #04120D;
        }
        .chat-name { font-size: 13px; font-weight: 700; color: var(--ink); }
        .chat-online {
          font-size: 10px; color: var(--teal);
          display: flex; align-items: center; gap: 4px;
        }
        .online-dot {
          display: inline-block; width: 5px; height: 5px;
          border-radius: 50%; background: var(--teal);
          animation: blink 1.5s infinite;
        }
        .chat-badge {
          margin-left: auto;
          font-family: var(--mono); font-size: 9px; font-weight: 500;
          color: var(--teal); background: var(--teal-dim);
          padding: 3px 8px; border-radius: 4px; letter-spacing: 0.04em;
        }
        .chat-body {
          padding: 16px; min-height: 220px;
          display: flex; flex-direction: column; gap: 8px;
          overflow-y: auto; scrollbar-width: none;
        }
        .chat-body::-webkit-scrollbar { display: none; }
        .chat-msg {
          max-width: 85%; padding: 9px 13px; border-radius: 12px;
          font-size: 12.5px; line-height: 1.55; white-space: pre-wrap;
          animation: msg-in 0.3s var(--ease) both;
        }
        @keyframes msg-in {
          from { opacity: 0; transform: translateY(8px) scale(0.96); }
          to { opacity: 1; transform: none; }
        }
        .chat-msg.customer {
          background: var(--teal); color: #04120D; font-weight: 500;
          align-self: flex-end; border-radius: 12px 3px 12px 12px;
        }
        .chat-msg.ai {
          background: var(--bg2); border: 1px solid var(--border);
          color: var(--ink2); align-self: flex-start;
          border-radius: 3px 12px 12px 12px;
        }
        .chat-typing {
          align-self: flex-start;
          display: flex; gap: 4px; padding: 12px 14px;
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 3px 12px 12px 12px;
          animation: msg-in 0.2s var(--ease) both;
        }
        .chat-typing span {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--ink4);
          animation: typing 1.2s ease-in-out infinite;
        }
        .chat-typing span:nth-child(2) { animation-delay: 0.2s; }
        .chat-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing {
          0%,80%,100% { opacity: 0.3; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-4px); }
        }
        .chat-footer {
          padding: 10px 16px; border-top: 1px solid var(--border);
          background: var(--bg2);
        }
        .chat-tag {
          font-family: var(--mono); font-size: 10px; color: var(--teal);
          opacity: 0.8;
        }

        /* ── STATS ── */
        .stats-section {
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          background: var(--bg1);
          padding: 36px clamp(16px,4vw,48px);
        }
        .stats-inner {
          max-width: 1000px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(4,1fr);
          gap: 1px; background: var(--border);
        }
        .stat-card {
          background: var(--bg1); padding: 28px 24px; text-align: center;
          opacity: 0; transform: translateY(16px);
          transition: opacity 0.6s var(--ease), transform 0.6s var(--ease);
        }
        .stat-card.visible { opacity: 1; transform: none; }
        .stat-value {
          font-family: var(--mono); font-size: 32px; font-weight: 500;
          color: var(--ink); letter-spacing: -0.02em; margin-bottom: 4px;
        }
        .stat-label { font-size: 12px; color: var(--ink4); }
        @media(max-width:640px) { .stats-inner { grid-template-columns: repeat(2,1fr); } }

        /* ── SECTION SHARED ── */
        .section { padding: clamp(80px,10vw,120px) clamp(16px,4vw,48px); }
        .section.alt { background: var(--bg1); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .section-inner { max-width: 1200px; margin: 0 auto; }
        .eyebrow {
          font-family: var(--mono); font-size: 11px; font-weight: 500;
          color: var(--teal); letter-spacing: 0.08em; text-transform: uppercase;
          margin-bottom: 14px; opacity: 0.85;
        }
        .section-h {
          font-size: clamp(28px,3.5vw,44px); font-weight: 900;
          color: var(--ink); letter-spacing: -0.035em; line-height: 1.1;
          margin-bottom: 16px;
        }
        .section-h em {
          font-style: normal;
          background: linear-gradient(135deg, #39D3BB, #7AE8DA);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .section-p { font-size: 14.5px; color: var(--ink3); line-height: 1.75; max-width: 480px; }

        /* ── TIMELINE ── */
        .timeline { margin-top: 56px; border-top: 1px solid var(--border); }
        .tl-row {
          display: grid; grid-template-columns: 120px 1fr;
          gap: 24px; padding: 28px 0; border-bottom: 1px solid var(--border);
          opacity: 0; transform: translateX(-12px);
          transition: opacity 0.6s var(--ease), transform 0.6s var(--ease);
        }
        .tl-row.visible { opacity: 1; transform: none; }
        .tl-row.danger .tl-time { color: var(--red); }
        .tl-row.danger .tl-event { color: var(--red); }
        .tl-time { font-family: var(--mono); font-size: 20px; font-weight: 500; color: var(--ink4); }
        .tl-event { font-size: 15px; font-weight: 700; color: var(--ink); margin-bottom: 4px; }
        .tl-desc { font-size: 13px; color: var(--ink3); line-height: 1.65; }
        @media(max-width:540px) { .tl-row { grid-template-columns: 1fr; gap: 4px; } }

        /* ── PAIN CARDS ── */
        .pain-grid {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: 1px; background: var(--border);
          border: 1px solid var(--border);
          border-radius: 12px; overflow: hidden; margin-top: 48px;
        }
        .pain-card {
          background: var(--bg); padding: 32px 28px;
          transition: background 0.25s;
          opacity: 0; transform: translateY(20px);
          transition: opacity 0.6s var(--ease), transform 0.6s var(--ease), background 0.25s;
        }
        .pain-card.visible { opacity: 1; transform: none; }
        .pain-card:hover { background: var(--bg1); }
        .pain-num {
          font-family: var(--mono); font-size: 11px; color: var(--ink4);
          margin-bottom: 20px; letter-spacing: 0.05em;
        }
        .pain-title { font-size: 16px; font-weight: 700; color: var(--ink); margin-bottom: 10px; }
        .pain-desc { font-size: 13px; color: var(--ink3); line-height: 1.7; }
        .pain-tag {
          display: inline-block; margin-top: 18px;
          font-size: 10.5px; font-weight: 700; color: var(--red);
          background: rgba(226,87,76,0.07); border: 1px solid rgba(226,87,76,0.2);
          border-radius: 5px; padding: 3px 10px;
        }
        @media(max-width:768px) { .pain-grid { grid-template-columns: 1fr; } }

        /* ── FEATURES ── */
        .features-grid {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: 16px; margin-top: 52px;
        }
        .feature-card {
          background: var(--bg); border: 1px solid var(--border);
          border-radius: 14px; padding: 28px 24px;
          position: relative; overflow: hidden; cursor: default;
          opacity: 0; transform: translateY(24px);
          transition: opacity 0.6s var(--ease), transform 0.6s var(--ease), border-color 0.25s;
        }
        .feature-card.visible { opacity: 1; transform: none; }
        .feature-card:hover { border-color: var(--border3); }
        .feature-card-inner { position: relative; z-index: 1; }
        .feature-glow {
          position: absolute; bottom: -40px; right: -40px;
          width: 160px; height: 160px; border-radius: 50%;
          background: radial-gradient(circle, rgba(57,211,187,0.07), transparent 70%);
          transition: opacity 0.3s;
          opacity: 0;
        }
        .feature-card:hover .feature-glow { opacity: 1; }
        .feature-tag {
          font-family: var(--mono); font-size: 10px; font-weight: 500;
          color: var(--teal); letter-spacing: 0.06em; text-transform: uppercase;
          margin-bottom: 14px; opacity: 0.8;
        }
        .feature-title {
          font-size: 16px; font-weight: 700; color: var(--ink);
          line-height: 1.3; margin-bottom: 10px; letter-spacing: -0.01em;
        }
        .feature-desc { font-size: 13px; color: var(--ink3); line-height: 1.7; margin-bottom: 20px; }
        .feature-list { list-style: none; display: flex; flex-direction: column; gap: 9px; }
        .feature-list li { display: flex; align-items: flex-start; gap: 9px; font-size: 12.5px; color: var(--ink3); }
        .feature-list li svg { color: var(--teal); flex-shrink: 0; margin-top: 2px; }
        @media(max-width:768px) { .features-grid { grid-template-columns: 1fr; } }

        /* ── DEMO SECTION ── */
        .demo-wrap {
          display: grid; grid-template-columns: 200px 1fr;
          gap: 20px; align-items: start; margin-top: 48px;
        }
        .demo-tabs { display: flex; flex-direction: column; gap: 6px; }
        .demo-tab {
          background: var(--bg); border: 1px solid var(--border);
          border-radius: 10px; padding: 14px 16px; cursor: pointer;
          transition: all 0.2s; text-align: left;
        }
        .demo-tab:hover { background: var(--bg1); border-color: var(--border2); }
        .demo-tab.active { border-color: rgba(57,211,187,0.35); background: rgba(57,211,187,0.05); }
        .demo-tab-icon { font-size: 15px; margin-bottom: 5px; }
        .demo-tab-label { font-size: 13px; font-weight: 700; color: var(--ink); margin-bottom: 2px; }
        .demo-tab-sub { font-size: 11px; color: var(--ink4); }
        .demo-chat-wrap {
          background: var(--bg1); border: 1px solid var(--border2);
          border-radius: 16px; overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.4);
        }
        @media(max-width:640px) {
          .demo-wrap { grid-template-columns: 1fr; }
          .demo-tabs { display: grid; grid-template-columns: repeat(3,1fr); }
        }

        /* ── BEFORE / AFTER ── */
        .ba-list { margin-top: 56px; border-top: 1px solid var(--border); }
        .ba-row {
          display: grid; grid-template-columns: 1fr 40px 1fr;
          gap: 16px; align-items: center; padding: 22px 0;
          border-bottom: 1px solid var(--border);
          opacity: 0; transform: translateY(12px);
          transition: opacity 0.5s var(--ease), transform 0.5s var(--ease);
        }
        .ba-row.visible { opacity: 1; transform: none; }
        .ba-before {
          font-size: 14px; color: var(--ink4);
          text-decoration: line-through; text-decoration-color: var(--red);
          text-align: right;
        }
        .ba-arrow { color: var(--ink4); text-align: center; font-size: 16px; }
        .ba-row.visible .ba-arrow { color: var(--teal); }
        .ba-after { font-size: 15px; font-weight: 600; color: var(--ink); }
        @media(max-width:540px) {
          .ba-row { grid-template-columns: 1fr; }
          .ba-before { text-align: left; }
          .ba-arrow { display: none; }
        }

        /* ── TESTIMONIALS ── */
        .test-wrap {
          display: grid; grid-template-columns: 1.4fr 1fr;
          gap: clamp(32px,5vw,64px); align-items: start; margin-top: 52px;
        }
        .test-quote-mark { font-size: 80px; line-height: 0.6; color: rgba(57,211,187,0.1); margin-bottom: 10px; display: block; }
        .test-quote {
          font-size: clamp(18px,2.2vw,23px); font-weight: 600; color: var(--ink);
          line-height: 1.5; letter-spacing: -0.01em; margin-bottom: 28px; min-height: 100px;
        }
        .test-author { display: flex; align-items: center; gap: 12px; padding-top: 20px; border-top: 1px solid var(--border); }
        .test-av {
          width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, var(--teal), #2A4FD4);
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 14px; color: #fff;
        }
        .test-name { font-size: 13px; font-weight: 700; color: var(--ink); }
        .test-biz { font-size: 11.5px; color: var(--ink4); }
        .test-rail { display: flex; flex-direction: column; border-left: 1px solid var(--border); }
        .test-btn {
          text-align: left; background: none; border: none; cursor: pointer; font-family: var(--sans);
          border-left: 2px solid transparent; margin-left: -1px;
          padding: 18px 0 18px 22px; transition: all 0.2s;
        }
        .test-btn.active { border-left-color: var(--teal); background: linear-gradient(90deg, rgba(57,211,187,0.06), transparent 70%); }
        .test-stat { font-family: var(--mono); font-size: 22px; color: var(--ink4); margin-bottom: 3px; transition: color 0.2s; }
        .test-btn.active .test-stat { color: var(--teal); }
        .test-stat-label { font-size: 10.5px; color: var(--ink4); margin-bottom: 5px; }
        .test-person { font-size: 11px; color: var(--ink4); }
        @media(max-width:640px) {
          .test-wrap { grid-template-columns: 1fr; gap: 28px; }
          .test-rail { border-left: none; border-top: 1px solid var(--border); flex-direction: row; flex-wrap: wrap; }
          .test-btn { border-left: none; border-top: 2px solid transparent; margin: 0; padding: 14px 18px 14px 0; }
          .test-btn.active { border-top-color: var(--teal); background: none; }
        }

        /* ── FOUNDER ── */
        .founder-inner { max-width: 640px; margin: 0 auto; }
        .founder-body {
          margin-top: 40px; font-size: clamp(16px,1.7vw,18px);
          color: var(--ink3); line-height: 1.9; font-style: italic;
        }
        .founder-body strong { color: var(--ink2); font-weight: 600; font-style: normal; }
        .founder-pull {
          display: block; margin: 28px 0; color: var(--teal);
          font-size: clamp(18px,2.2vw,22px); line-height: 1.5;
        }
        .founder-sig { margin-top: 44px; display: flex; align-items: center; gap: 14px; }
        .founder-av {
          width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, var(--teal), #2A4FD4);
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 15px; color: #fff;
        }
        .founder-name { font-size: 14px; font-weight: 700; color: var(--ink); font-style: normal; }
        .founder-role { font-size: 11.5px; color: var(--ink4); font-style: normal; }

        /* ── PRICING ── */
        .billing-toggle {
          display: inline-flex; align-items: center; gap: 2px;
          background: var(--bg1); border: 1px solid var(--border2);
          border-radius: 100px; padding: 3px;
          margin: 24px auto 44px;
        }
        .bill-btn {
          padding: 8px 18px; border-radius: 100px; border: none; cursor: pointer;
          font-family: var(--sans); font-size: 13px; font-weight: 700;
          background: transparent; color: var(--ink4); transition: all 0.2s;
          display: flex; align-items: center; gap: 6px;
        }
        .bill-btn.active { background: var(--teal); color: #04120D; }
        .bill-save {
          font-size: 9.5px; font-weight: 800; padding: 1px 7px; border-radius: 100px;
        }
        .bill-btn.active .bill-save { background: rgba(0,0,0,0.12); }
        .bill-btn:not(.active) .bill-save { background: var(--teal-dim); color: var(--teal); }

        .plan-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; align-items: start; }
        .plan-card {
          background: var(--bg); border: 1px solid var(--border);
          border-radius: 16px; padding: clamp(22px,3vw,30px);
          position: relative; transition: all 0.25s;
          opacity: 0; transform: translateY(20px);
          transition: opacity 0.6s var(--ease), transform 0.6s var(--ease), border-color 0.25s, box-shadow 0.25s;
        }
        .plan-card.visible { opacity: 1; transform: none; }
        .plan-card:hover { border-color: var(--border2); }
        .plan-card.pop {
          border-color: rgba(57,211,187,0.25);
          box-shadow: 0 0 60px rgba(57,211,187,0.06), 0 20px 60px rgba(0,0,0,0.3);
        }
        .plan-badge {
          position: absolute; top: -1px; left: 20px;
          transform: translateY(-50%);
          background: var(--teal); color: #04120D;
          font-size: 9.5px; font-weight: 800; padding: 3px 12px;
          border-radius: 100px;
        }
        .plan-name { font-size: 10px; font-weight: 800; letter-spacing: 0.07em; text-transform: uppercase; color: var(--ink4); margin-bottom: 4px; }
        .plan-desc { font-size: 12px; color: var(--ink4); margin-bottom: 20px; }
        .plan-price { display: flex; align-items: baseline; gap: 1px; margin-bottom: 3px; }
        .plan-rs { font-size: 16px; font-weight: 700; color: var(--ink); }
        .plan-amt { font-family: var(--mono); font-size: clamp(32px,4vw,40px); font-weight: 500; color: var(--ink); letter-spacing: -0.02em; }
        .plan-card.pop .plan-amt, .plan-card.pop .plan-rs { color: var(--teal); }
        .plan-mo { font-size: 11px; color: var(--ink4); margin-bottom: 20px; }
        .plan-divider { border: none; border-top: 1px solid var(--border); margin: 16px 0; }
        .plan-features { list-style: none; display: flex; flex-direction: column; gap: 9px; margin-bottom: 22px; }
        .plan-features li { display: flex; align-items: flex-start; gap: 8px; font-size: 12.5px; color: var(--ink3); }
        .plan-features li.miss { color: var(--ink4); text-decoration: line-through; }
        .plan-features li svg { color: var(--teal); flex-shrink: 0; margin-top: 2px; }
        .plan-features li.miss svg { color: var(--ink4); opacity: 0.4; }
        .plan-cta {
          display: block; text-align: center; padding: 11px;
          border-radius: 9px; font-weight: 700; font-size: 13.5px;
          text-decoration: none; transition: all 0.2s; cursor: pointer;
          border: none; font-family: var(--sans); width: 100%;
        }
        .plan-cta.primary { background: var(--teal); color: #04120D; box-shadow: 0 2px 12px rgba(57,211,187,0.2); }
        .plan-cta.primary:hover { background: #2FC4AE; box-shadow: 0 4px 20px rgba(57,211,187,0.3); transform: translateY(-1px); }
        .plan-cta.secondary { background: transparent; color: var(--ink); border: 1px solid var(--border2); }
        .plan-cta.secondary:hover { border-color: var(--border3); background: rgba(255,255,255,0.03); }
        @media(max-width:768px) { .plan-grid { grid-template-columns: 1fr; max-width: 400px; margin: 0 auto; } }

        /* ── FAQ ── */
        .faq-list { max-width: 640px; margin: 44px auto 0; }
        .faq-item { border-bottom: 1px solid var(--border); }
        .faq-item:first-child { border-top: 1px solid var(--border); }
        .faq-q {
          width: 100%; background: none; border: none; padding: 20px 0;
          text-align: left; font-size: 14.5px; font-weight: 600; color: var(--ink);
          cursor: pointer; display: flex; justify-content: space-between;
          align-items: center; gap: 12px; font-family: var(--sans);
          transition: color 0.2s;
        }
        .faq-q:hover { color: var(--teal); }
        .faq-icon {
          width: 22px; height: 22px; border-radius: 50%;
          background: var(--bg2); display: flex; align-items: center;
          justify-content: center; font-size: 15px; color: var(--ink4);
          flex-shrink: 0; transition: all 0.25s;
        }
        .faq-item.open .faq-icon { background: var(--teal-dim); color: var(--teal); transform: rotate(45deg); }
        .faq-a {
          font-size: 14px; color: var(--ink3); line-height: 1.8;
          max-height: 0; overflow: hidden;
          transition: max-height 0.35s ease, padding 0.35s ease;
        }
        .faq-item.open .faq-a { max-height: 200px; padding-bottom: 20px; }

        /* ── CTA SECTION ── */
        .cta-card {
          max-width: 700px; margin: 0 auto;
          background: var(--bg1); border: 1px solid rgba(57,211,187,0.15);
          border-radius: 20px; padding: clamp(44px,6vw,72px) clamp(24px,4vw,56px);
          text-align: center; position: relative; overflow: hidden;
        }
        .cta-card::before {
          content: ''; position: absolute; bottom: 0; left: 50%;
          transform: translateX(-50%);
          width: 400px; height: 200px;
          background: radial-gradient(ellipse, rgba(57,211,187,0.07), transparent 70%);
          pointer-events: none;
        }
        .cta-h {
          font-size: clamp(26px,3vw,38px); font-weight: 900; color: var(--ink);
          letter-spacing: -0.04em; line-height: 1.1; margin-bottom: 14px;
          position: relative;
        }
        .cta-h em {
          font-style: normal;
          background: linear-gradient(135deg, #39D3BB, #7AE8DA);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .cta-p { font-size: 14.5px; color: var(--ink3); margin-bottom: 28px; position: relative; }
        .cta-btns { display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap; position: relative; }
        .cta-note { margin-top: 16px; font-size: 11.5px; color: var(--ink4); position: relative; }

        /* ── FOOTER ── */
        .footer {
          background: var(--bg1); border-top: 1px solid var(--border);
          padding: clamp(44px,6vw,60px) clamp(16px,4vw,48px) 28px;
        }
        .footer-inner { max-width: 1200px; margin: 0 auto; }
        .footer-top {
          display: grid; grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: clamp(24px,4vw,48px); margin-bottom: 40px;
        }
        .footer-tagline { font-size: 12.5px; color: var(--ink4); line-height: 1.8; margin-top: 14px; max-width: 240px; }
        .footer-col-h { font-size: 10px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink4); margin-bottom: 14px; }
        .footer-links { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .footer-links a { font-size: 13px; color: var(--ink3); text-decoration: none; transition: color 0.15s; }
        .footer-links a:hover { color: var(--teal); }
        .footer-bot {
          padding-top: 20px; border-top: 1px solid var(--border);
          display: flex; justify-content: space-between; align-items: center;
          font-size: 11.5px; color: var(--ink4); flex-wrap: wrap; gap: 8px;
        }
        @media(max-width:640px) { .footer-top { grid-template-columns: 1fr; } }

        /* ── SCROLL ANIMATIONS HELPER ── */
        @media(prefers-reduced-motion: reduce) {
          .reveal, .stat-card, .pain-card, .feature-card, .tl-row, .ba-row, .plan-card {
            opacity: 1 !important; transform: none !important; transition: none !important;
          }
        }
      `}</style>

      {/* NAV */}
      <nav className={`nav${scrolled ? " scrolled" : ""}`}>
        <a href="/" className="nav-logo">
          <img src="/logo.png" alt="Fastrill" />
          fast<em>rill</em>
        </a>
        <ul className="nav-links">
          {[["#problem","Problem"],["#product","Product"],["#demo","Demo"],["#pricing","Pricing"]].map(([h,l]) => (
            <li key={h}><a href={h}>{l}</a></li>
          ))}
        </ul>
        <div className="nav-right">
          <a href="/login" className="nav-signin">Sign in</a>
          <a href="/login" className="btn-primary">Start free</a>
          <button className="nav-hbg" onClick={() => setMobOpen(p => !p)}>&#9776;</button>
        </div>
      </nav>
      <div className={`mob-drawer${mobOpen ? " open" : ""}`}>
        {[["#problem","Problem"],["#product","Product"],["#demo","Demo"],["#pricing","Pricing"],["/login","Sign in"]].map(([h,l]) => (
          <a key={h} href={h} onClick={() => setMobOpen(false)}>{l}</a>
        ))}
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-grid" />
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-inner">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            WhatsApp AI for Indian businesses
          </div>
          <h1 className="hero-h1">
            <span className="dim">Leads are messaging.</span><br />
            <span className="accent">Nobody is replying.</span>
          </h1>
          <div className="hero-layout">
            <div>
              <p className="hero-sub">
                Most businesses reply in <strong>hours</strong> — or never.
                Fastrill replies in <strong>under 2 seconds</strong>, qualifies the lead,
                and books the appointment. Automatically.
              </p>
              <div className="hero-actions">
                <a href="/login" className="btn-hero">Start free trial <ArrowIcon /></a>
                <a href="#demo" className="btn-hero-ghost">See it live</a>
              </div>
              <div className="hero-trust">
                <span className="hero-trust-item">No credit card</span>
                <span className="hero-trust-item">Setup in 10 min</span>
                <span className="hero-trust-item">10+ Indian languages</span>
                <span className="hero-trust-item">14-day free trial</span>
              </div>
            </div>
            <ChatDemo />
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="stats-section">
        <div className="stats-inner">
          {STATS.map((s, i) => <StatCard key={s.label} value={s.value} label={s.label} index={i} />)}
        </div>
      </div>

      {/* STORY */}
      <section className="section">
        <div className="section-inner">
          <RevealBlock>
            <div className="eyebrow">What happens every night</div>
            <h2 className="section-h" style={{maxWidth:520}}>You spend ₹40,000 on ads.<br /><em>Leads die in your inbox.</em></h2>
          </RevealBlock>
          <TimelineSection />
          <RevealBlock style={{marginTop:44, textAlign:"center"}}>
            <p style={{fontSize:14, color:"var(--ink4)", marginBottom:22}}>This happens across thousands of Indian businesses every single day.</p>
            <a href="/login" className="btn-hero" style={{margin:"0 auto"}}>Fix this now <ArrowIcon /></a>
          </RevealBlock>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="section alt" id="problem">
        <div className="section-inner">
          <RevealBlock style={{maxWidth:520}}>
            <div className="eyebrow">The real problem</div>
            <h2 className="section-h">Your ads are working.<br /><em>Your follow-up isn&apos;t.</em></h2>
            <p className="section-p">You spend thousands getting leads to message you. The money walks out in the WhatsApp inbox.</p>
          </RevealBlock>
          <PainSection />
        </div>
      </section>

      {/* PRODUCT */}
      <section className="section" id="product">
        <div className="section-inner">
          <RevealBlock>
            <div className="eyebrow">What&apos;s inside</div>
            <h2 className="section-h">Not a chatbot.<br /><em>A revenue system.</em></h2>
            <p className="section-p">Three modules that work together to turn every WhatsApp message into a booking.</p>
          </RevealBlock>
          <div className="features-grid" style={{marginTop:52}}>
            {FEATURES.map((f, i) => <FeatureCard key={f.tag} feature={f} index={i} />)}
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section className="section alt" id="demo">
        <div className="section-inner">
          <RevealBlock>
            <div className="eyebrow">Live demo</div>
            <h2 className="section-h">See it handle a real conversation.</h2>
            <p className="section-p">Watch the AI book an appointment, reply in Hindi, and recover a lapsed customer.</p>
          </RevealBlock>
          <DemoSection />
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section className="section">
        <div className="section-inner">
          <RevealBlock style={{textAlign:"center"}}>
            <div className="eyebrow">The difference</div>
            <h2 className="section-h" style={{textAlign:"center"}}>Before. <em>After.</em></h2>
          </RevealBlock>
          <BeforeAfterSection />
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section alt">
        <div className="section-inner">
          <RevealBlock>
            <div className="eyebrow">Results</div>
            <h2 className="section-h">Real businesses. <em>Real numbers.</em></h2>
          </RevealBlock>
          <div className="test-wrap">
            <div>
              <span className="test-quote-mark">&ldquo;</span>
              <p className="test-quote">{TESTIMONIALS[activeT].quote}</p>
              <div className="test-author">
                <div className="test-av">{TESTIMONIALS[activeT].name[0]}</div>
                <div>
                  <div className="test-name">{TESTIMONIALS[activeT].name}</div>
                  <div className="test-biz">{TESTIMONIALS[activeT].biz}</div>
                </div>
              </div>
            </div>
            <div className="test-rail">
              {TESTIMONIALS.map((t,i) => (
                <button key={t.name} className={`test-btn${i===activeT?" active":""}`} onClick={() => setActiveT(i)}>
                  <div className="test-stat">{t.stat}</div>
                  <div className="test-stat-label">{t.statLabel}</div>
                  <div className="test-person">{t.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOUNDER */}
      <section className="section">
        <div className="section-inner">
          <RevealBlock style={{textAlign:"center"}}>
            <div className="eyebrow">Why we built this</div>
            <h2 className="section-h" style={{textAlign:"center"}}>A letter from the <em>founder</em></h2>
          </RevealBlock>
          <RevealBlock>
            <div className="founder-inner">
              <div className="founder-body">
                I&apos;ve spent years in digital marketing — running ads, building funnels, optimising campaigns for businesses across India. Every lead costs real money.
                <br /><br />
                And the single most common thing I saw across <strong>every single client</strong> — salons, clinics, gyms, coaching centres — was this:
                <span className="founder-pull">&ldquo;Leads were arriving. And dying in the WhatsApp inbox.&rdquo;</span>
                A salon owner in Hyderabad spending <strong>₹40,000 a month on Instagram ads</strong>. Almost 60% of those leads never got a reply within the hour. Not bad ads — slow replies.
                <br /><br />
                <strong>The problem was never the ads. It was always the follow-up.</strong>
                <br /><br />
                So we built Fastrill — not as another chatbot, but as a revenue recovery system that sits between your ad spend and your bank account.
                <div className="founder-sig">
                  <div className="founder-av">G</div>
                  <div>
                    <div className="founder-name">Ganapathi</div>
                    <div className="founder-role">Founder, Fastrill — Solvabil Pvt. Ltd.</div>
                  </div>
                </div>
              </div>
            </div>
          </RevealBlock>
        </div>
      </section>

      {/* PRICING */}
      <section className="section alt" id="pricing">
        <div className="section-inner">
          <RevealBlock style={{textAlign:"center"}}>
            <div className="eyebrow">Pricing</div>
            <h2 className="section-h" style={{textAlign:"center"}}>Simple pricing.<br /><em>Pays for itself.</em></h2>
            <p className="section-p" style={{textAlign:"center",margin:"0 auto"}}>One missed booking costs more than a month of Fastrill.</p>
          </RevealBlock>
          <div style={{display:"flex",justifyContent:"center"}}>
            <div className="billing-toggle">
              <button className={`bill-btn${billing==="monthly"?" active":""}`} onClick={() => setBilling("monthly")}>Monthly</button>
              <button className={`bill-btn${billing==="annual"?" active":""}`} onClick={() => setBilling("annual")}>Annual <span className="bill-save">Save 17%</span></button>
            </div>
          </div>
          <div className="plan-grid">
            {PLANS.map((plan, i) => {
              const price = billing === "annual" ? Math.round(plan.price * 0.83) : plan.price
              return <PlanCard key={plan.name} plan={plan} price={price} billing={billing} index={i} />
            })}
          </div>
          <p style={{textAlign:"center",marginTop:24,fontSize:12,color:"var(--ink4)"}}>14-day free trial · No credit card · Cancel anytime</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="section-inner">
          <RevealBlock style={{textAlign:"center"}}>
            <div className="eyebrow">FAQ</div>
            <h2 className="section-h" style={{textAlign:"center"}}>Honest answers</h2>
          </RevealBlock>
          <div className="faq-list">
            {FAQS.map((f,i) => <FAQ key={i} q={f.q} a={f.a} index={i} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <RevealBlock>
          <div className="cta-card">
            <h2 className="cta-h">Turn every WhatsApp message<br />into <em>revenue.</em></h2>
            <p className="cta-p">Start automating replies, recovering leads, and booking customers today.</p>
            <div className="cta-btns">
              <a href="/login" className="btn-hero">Start free — no card needed <ArrowIcon /></a>
              <a href="https://wa.me/916309279265" className="btn-hero-ghost">Message us on WhatsApp</a>
            </div>
            <p className="cta-note">14-day free trial · Setup in 10 minutes · Cancel anytime</p>
          </div>
        </RevealBlock>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div>
              <a href="/" className="nav-logo">
                <img src="/logo.png" alt="Fastrill" />fast<em>rill</em>
              </a>
              <p className="footer-tagline">AI-powered WhatsApp automation for Indian service businesses. Built by Solvabil Pvt. Ltd.</p>
            </div>
            {[
              {h:"Product", lks:[["How it works","#product"],["Pricing","#pricing"],["Live demo","#demo"]]},
              {h:"Company", lks:[["Our story","#"],["Contact","mailto:team@fastrill.com"],["Call us","tel:+916309279265"]]},
              {h:"Legal", lks:[["Privacy policy","/privacy"],["Terms of service","/terms"]]},
            ].map(col => (
              <div key={col.h}>
                <div className="footer-col-h">{col.h}</div>
                <ul className="footer-links">
                  {col.lks.map(([n,h]) => <li key={n}><a href={h}>{n}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="footer-bot">
            <span>© 2026 Fastrill, a product by Solvabil Pvt. Ltd.</span>
            <span>Made with conviction in India</span>
          </div>
        </div>
      </footer>
    </>
  )
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────

function RevealBlock({ children, style }) {
  const [ref, inView] = useInView(0.1)
  return <div ref={ref} className={`reveal${inView ? " visible" : ""}`} style={style}>{children}</div>
}

function TimelineSection() {
  const rows = [
    { time: "9:02 PM", event: "Customer messages you", desc: "Ready to book. Service: keratin treatment. Budget: ₹2,800." },
    { time: "9:45 PM", event: "You finally reply", desc: "Too late — they already messaged your competitor." },
    { time: "10:12 PM", event: "Customer booked elsewhere", desc: "Competitor replied in 2 minutes. Same price. Same service." },
    { time: "—", event: "Your loss", desc: "₹2,800 + lifetime value + referrals ≈ ₹12,000+", danger: true },
  ]
  return (
    <div className="timeline">
      {rows.map((r, i) => <TLRow key={r.event} row={r} index={i} />)}
    </div>
  )
}

function TLRow({ row, index }) {
  const [ref, inView] = useInView(0.2)
  return (
    <div ref={ref} className={`tl-row${inView ? " visible" : ""}${row.danger ? " danger" : ""}`}
      style={{ transitionDelay: `${index * 80}ms` }}>
      <div className="tl-time">{row.time}</div>
      <div>
        <div className="tl-event">{row.event}</div>
        <div className="tl-desc">{row.desc}</div>
      </div>
    </div>
  )
}

function PainSection() {
  const cards = [
    { n: "01", t: "Leads die after hours", d: "Customer messages at 10 PM about your bridal package. You see it at 9 AM — she's already booked someone who replied in 2 minutes.", tag: "Revenue lost nightly" },
    { n: "02", t: "Speed wins the booking", d: "Your competitor replies in 2 seconds. You reply in 2 hours. Same service, same price — they win every time.", tag: "Competitive loss" },
    { n: "03", t: "Silence becomes a review", d: "Upset customer messages at peak hour. Staff is busy. No reply for 3 hours. The 1-star review doesn't wait.", tag: "Reputation at risk" },
  ]
  return (
    <div className="pain-grid">
      {cards.map((c, i) => <PainCard key={c.n} card={c} index={i} />)}
    </div>
  )
}

function PainCard({ card, index }) {
  const [ref, inView] = useInView(0.15)
  return (
    <div ref={ref} className={`pain-card${inView ? " visible" : ""}`} style={{ transitionDelay: `${index * 100}ms` }}>
      <div className="pain-num">{card.n}</div>
      <div className="pain-title">{card.t}</div>
      <p className="pain-desc">{card.d}</p>
      <div className="pain-tag">{card.tag}</div>
    </div>
  )
}

function DemoSection() {
  const [active, setActive] = useState("booking")
  const [msgs, setMsgs] = useState([])
  const [typing, setTyping] = useState(false)
  const bodyRef = useRef(null)
  const timerRefs = useRef([])

  const DEMOS = {
    booking: [
      { role: "customer", text: "Hi, I want a haircut tomorrow around 3pm", delay: 0 },
      { role: "typing", delay: 800 },
      { role: "ai", text: "Tomorrow 3 PM works! Shall I confirm Haircut for Saturday, 29 March at 3:00 PM? ✅", delay: 1600 },
      { role: "customer", text: "Yes please!", delay: 3200 },
      { role: "typing", delay: 4000 },
      { role: "ai", text: "Booking confirmed! 🎉\n\nHaircut · 29 March · 3:00 PM\nSee you then!", delay: 4800 },
    ],
    hindi: [
      { role: "customer", text: "Bhai facial karwa sakte hai kal?", delay: 0 },
      { role: "typing", delay: 700 },
      { role: "ai", text: "Haan bilkul! 😊\n\nFacial ₹1,200 mein available hai (60 min).\n\nKis time aana chahenge?", delay: 1400 },
      { role: "customer", text: "Shaam 6 baje", delay: 2800 },
      { role: "typing", delay: 3400 },
      { role: "ai", text: "Confirm karu Facial kal shaam 6:00 PM ke liye? ✅", delay: 4000 },
      { role: "customer", text: "Haan kar do", delay: 5200 },
      { role: "typing", delay: 5800 },
      { role: "ai", text: "Booking ho gayi! ✅\n\nFacial · ₹1,200\nKal, 6:00 PM\n\nMilenge!", delay: 6400 },
    ],
    winback: [
      { role: "ai", text: "Hi Anita! 👋 It's been a while since your last visit at Riya Salon.\n\nYour favourite Keratin Treatment is available this week — want to book?", delay: 0 },
      { role: "customer", text: "Oh yes! What's the price now?", delay: 1800 },
      { role: "typing", delay: 2400 },
      { role: "ai", text: "Keratin Treatment is ₹2,800 (90 min). 10% off this week — just ₹2,520! 🎉", delay: 3000 },
      { role: "customer", text: "That's great, book me Saturday morning", delay: 4400 },
      { role: "typing", delay: 5000 },
      { role: "ai", text: "Booking confirmed! ✅\n\nKeratin Treatment · ₹2,520\nSaturday · 10:00 AM", delay: 5600 },
    ],
  }

  const TABS = [
    { k: "booking", label: "Booking flow", sub: "End-to-end in 4 msgs", icon: "📅" },
    { k: "hindi", label: "Hindi support", sub: "Auto-detected", icon: "🇮🇳" },
    { k: "winback", label: "Win-back", sub: "Inactive customer", icon: "🔄" },
  ]

  useEffect(() => {
    setMsgs([])
    setTyping(false)
    timerRefs.current.forEach(clearTimeout)
    timerRefs.current = []
    DEMOS[active].forEach(step => {
      const t = setTimeout(() => {
        if (step.role === "typing") { setTyping(true); return }
        setTyping(false)
        setMsgs(p => [...p, step])
        setTimeout(() => { if (bodyRef.current) bodyRef.current.scrollTop = 9999 }, 50)
      }, step.delay)
      timerRefs.current.push(t)
    })
    return () => timerRefs.current.forEach(clearTimeout)
  }, [active])

  return (
    <div className="demo-wrap">
      <div className="demo-tabs">
        {TABS.map(tab => (
          <div key={tab.k} className={`demo-tab${active===tab.k?" active":""}`} onClick={() => setActive(tab.k)}>
            <div className="demo-tab-icon">{tab.icon}</div>
            <div className="demo-tab-label">{tab.label}</div>
            <div className="demo-tab-sub">{tab.sub}</div>
          </div>
        ))}
      </div>
      <div className="demo-chat-wrap">
        <div className="chat-header">
          <div className="chat-avatar">R</div>
          <div>
            <div className="chat-name">Riya Salon</div>
            <div className="chat-online"><span className="online-dot" />AI Active</div>
          </div>
          <div className="chat-badge">fastrill</div>
        </div>
        <div className="chat-body" ref={bodyRef} style={{minHeight:260,maxHeight:320}}>
          {msgs.map((m, i) => (
            <div key={`${active}-${i}`} className={`chat-msg ${m.role}`}>{m.text}</div>
          ))}
          {typing && <div className="chat-typing"><span /><span /><span /></div>}
        </div>
        <div className="chat-footer">
          <div className="chat-tag">⚡ Average reply time: 1.8 seconds</div>
        </div>
      </div>
    </div>
  )
}

function BeforeAfterSection() {
  const pairs = [
    { before: "Reply in 8 hours", after: "Reply in 2 seconds, automatically" },
    { before: "No reply after 9 PM", after: "Books appointments at 2 AM" },
    { before: "Complaint ignored", after: "Resolved instantly with empathy" },
    { before: "No idea what converted", after: "Every booking tracked to source" },
    { before: "Staff glued to phones", after: "Staff focused on customers in front of them" },
  ]
  return (
    <div className="ba-list">
      {pairs.map((p, i) => <BARow key={p.before} pair={p} index={i} />)}
    </div>
  )
}

function BARow({ pair, index }) {
  const [ref, inView] = useInView(0.3)
  return (
    <div ref={ref} className={`ba-row${inView ? " visible" : ""}`} style={{ transitionDelay: `${index * 100}ms` }}>
      <div className="ba-before">{pair.before}</div>
      <div className="ba-arrow">→</div>
      <div className="ba-after">{pair.after}</div>
    </div>
  )
}

function PlanCard({ plan, price, billing, index }) {
  const [ref, inView] = useInView(0.1)
  return (
    <div ref={ref} className={`plan-card${inView ? " visible" : ""}${plan.pop ? " pop" : ""}`}
      style={{ transitionDelay: `${index * 100}ms` }}>
      {plan.pop && <div className="plan-badge">Most popular</div>}
      <div className="plan-name">{plan.name}</div>
      <div className="plan-desc">{plan.desc}</div>
      <div className="plan-price">
        <span className="plan-rs">₹</span>
        <span className="plan-amt">{price.toLocaleString("en-IN")}</span>
      </div>
      <div className="plan-mo">per month + GST{billing==="annual" && ` · billed ₹${(price*12).toLocaleString("en-IN")}/yr`}</div>
      <hr className="plan-divider" />
      <ul className="plan-features">
        {plan.features.map(f => (
          <li key={f}><CheckIcon />{f}</li>
        ))}
        {(plan.missing||[]).map(f => (
          <li key={f} className="miss"><CheckIcon />{f}</li>
        ))}
      </ul>
      <a href="/login" className={`plan-cta${plan.pop ? " primary" : " secondary"}`}>
        {plan.pop ? "Start free trial" : plan.name === "Pro" ? "Contact sales" : "Get started"}
      </a>
    </div>
  )
}
