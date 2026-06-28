"use client"

import { useState, useEffect, useRef, useCallback } from "react"

const DEMOS = {
  booking: [
    { r: "c", m: "Hi, I want a haircut tomorrow around 3pm" },
    { r: "a", m: "Tomorrow’s Saturday — 3 PM works great.\n\nShall I confirm Haircut for Saturday, 29th March at 3:00 PM?" },
    { r: "c", m: "Yes please!" },
    { r: "a", m: "✅ Booking confirmed.\n\nHaircut\nSaturday, 29 March\n3:00 PM\n\nSee you then!" },
  ],
  hindi: [
    { r: "c", m: "Bhai facial karwa sakte hai kal?" },
    { r: "a", m: "Haan bilkul!\n\nFacial ₹1,200 mein available hai (60 min).\n\nKis time aana chahenge?" },
    { r: "c", m: "Shaam 6 baje" },
    { r: "a", m: "Confirm karu Facial kal shaam 6:00 PM ke liye?" },
    { r: "c", m: "Haan kar do" },
    { r: "a", m: "✅ Booking ho gayi!\n\nFacial · ₹1,200\nKal, 29 March\n6:00 PM\n\nMilenge!" },
  ],
  winback: [
    { r: "a", m: "Hi Anita — it’s been a while since your last visit at Riya Salon.\n\nYour favourite keratin treatment is available this week, want to book?" },
    { r: "c", m: "Oh yes actually! What’s the price?" },
    { r: "a", m: "Keratin Treatment is ₹2,800 (90 min). 10% off this week — ₹2,520." },
    { r: "c", m: "That’s great, book me Saturday morning" },
    { r: "a", m: "✅ Booking confirmed.\n\nKeratin Treatment · ₹2,520\nSaturday, 29 March · 10:00 AM" },
  ],
}

const DEMO_META = [
  { k: "booking", label: "Booking flow", sub: "End-to-end in 4 messages", icon: "📅" },
  { k: "hindi", label: "Hindi support", sub: "Auto-detected per chat", icon: "🇮🇳" },
  { k: "winback", label: "Win-back", sub: "Inactive customer recovery", icon: "🔄" },
]

const TESTIMONIALS = [
  { name: "Priya Nair", biz: "Glow Parlour, Hyderabad", result: "+43%", resultLabel: "bookings in month one", quote: "I was losing Saturday night bookings because nobody replied after 8 PM. Customers now book at midnight and wake up to a confirmation. It paid for itself in the first week.", initial: "P" },
  { name: "Dr. Ravi Sharma", biz: "Skin First Clinic, Vijayawada", result: "₹22k", resultLabel: "saved per month", quote: "My patients message in Telugu and the AI replies in Telugu, books the slot, and follows up if they go quiet. I had to see it to believe it wasn’t a person.", initial: "R" },
  { name: "Sneha Reddy", biz: "Studio S, 2 branches, Bangalore", result: "0", resultLabel: "missed messages", quote: "Two branches, both inboxes handled at once. Our staff stopped checking phones and started focusing on the customer in front of them.", initial: "S" },
]

function AnimatedCounter({ end, suffix = "", prefix = "", duration = 2000 }) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setStarted(true); io.disconnect() }
    }, { threshold: 0.5 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    const steps = 60
    const increment = end / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(current))
    }, duration / steps)
    return () => clearInterval(timer)
  }, [started, end, duration])

  return <span ref={ref}>{prefix}{typeof end === "number" && end > 100 ? count.toLocaleString("en-IN") : count}{suffix}</span>
}

function Ic({ name, size = 20 }) {
  const c = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" }
  switch (name) {
    case "check": return <svg {...c} strokeWidth={2.2}><path d="M20 6L9 17l-5-5" /></svg>
    case "arrow": return <svg {...c} strokeWidth={2}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    case "x": return <svg {...c} strokeWidth={2}><path d="M5 5l14 14M19 5L5 19" /></svg>
    case "star": return <svg {...c} fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
    case "zap": return <svg {...c} strokeWidth={2}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
    case "globe": return <svg {...c}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
    case "shield": return <svg {...c}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
    case "clock": return <svg {...c}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
    case "msg": return <svg {...c}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
    case "calendar": return <svg {...c}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
    case "send": return <svg {...c}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" /></svg>
    case "inbox": return <svg {...c}><path d="M22 12h-6l-2 3H10l-2-3H2" /><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" /></svg>
    default: return null
  }
}

export default function FastrillLanding() {
  const [scrolled, setScrolled] = useState(false)
  const [mobOpen, setMobOpen] = useState(false)
  const [demoKey, setDemoKey] = useState("booking")
  const [demoMsgs, setDemoMsgs] = useState([])
  const [billing, setBilling] = useState("monthly")
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [cmpRevealed, setCmpRevealed] = useState(false)
  const demoRef = useRef(null)
  const timerRef = useRef(null)
  const cmpRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    setDemoMsgs([])
    if (timerRef.current) clearTimeout(timerRef.current)
    const msgs = DEMOS[demoKey]
    const timers = []
    msgs.forEach((m, i) => {
      const t = setTimeout(() => {
        setDemoMsgs(p => [...p, m])
        if (demoRef.current) demoRef.current.scrollTop = 9999
      }, 600 + i * 1100)
      timers.push(t)
    })
    return () => timers.forEach(clearTimeout)
  }, [demoKey])

  useEffect(() => {
    const el = cmpRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setCmpRevealed(true); io.disconnect() }
    }, { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("fl-in"); io.unobserve(e.target) }
      }),
      { threshold: 0.06, rootMargin: "0px 0px -30px 0px" }
    )
    document.querySelectorAll(".fl-fade").forEach((el) => {
      const sibs = Array.from(el.parentElement?.querySelectorAll(":scope > .fl-fade") || [])
      el.style.transitionDelay = Math.min(sibs.indexOf(el) * 0.07, 0.28) + "s"
      io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(p => (p + 1) % TESTIMONIALS.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  const plans = [
    { tier: "Starter", monthly: 999, tag: "Solo operators & new businesses", cta: "Get started", cs: "out", feats: [["inc", "1 WhatsApp number"], ["inc", "300 AI conversations / month"], ["inc", "Booking automation"], ["inc", "10+ Indian languages"], ["exc", "Lead recovery"], ["exc", "WhatsApp campaigns"]] },
    { tier: "Growth", monthly: 1999, tag: "For growing businesses", cta: "Start free trial", cs: "go", pop: true, feats: [["inc", "1 WhatsApp number"], ["inc", "Unlimited conversations"], ["inc", "Customer memory & context"], ["inc", "Lead recovery sequences"], ["inc", "WhatsApp campaigns"], ["inc", "Revenue analytics"]] },
    { tier: "Pro", monthly: 4999, tag: "Multi-branch teams", cta: "Contact sales", cs: "out", feats: [["inc", "Up to 5 WhatsApp numbers"], ["inc", "Everything in Growth"], ["inc", "Multi-branch management"], ["inc", "Custom AI playbook"], ["inc", "Dedicated onboarding"], ["inc", "Priority support"]] },
  ]

  return (
    <>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&family=Newsreader:ital,wght@1,400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:#050608;color:#9CA3B0;font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}

:root{
  --ink:#F4F5F7;--ink2:#C8CCD4;--ink3:#9CA3B0;--ink4:#6B7280;--ink5:#3D4450;
  --base:#050608;--s1:#0A0C10;--s2:#0F1217;--s3:#151921;--s4:#1C2130;
  --line:rgba(255,255,255,.06);--line2:rgba(255,255,255,.10);--line3:rgba(255,255,255,.15);
  --teal:#39D3BB;--teal2:#2BC4AC;--teal3:#22A98F;--teal-g:linear-gradient(135deg,#39D3BB,#22A98F);
  --teal-glow:rgba(57,211,187,.15);--teal-tint:rgba(57,211,187,.08);
  --purple:#8065F4;--purple2:#6A4FE0;--purple-tint:rgba(128,101,244,.08);
  --warn:#E2574C;--warn-tint:rgba(226,87,76,.06);
  --grad-text:linear-gradient(135deg,#39D3BB 0%,#8065F4 100%);
  --display:'Plus Jakarta Sans',system-ui,sans-serif;--mono:'JetBrains Mono',monospace;--serif:'Newsreader',serif;
  --shadow-sm:0 1px 2px rgba(0,0,0,.25);
  --shadow-md:0 4px 16px rgba(0,0,0,.3),0 1px 3px rgba(0,0,0,.2);
  --shadow-lg:0 8px 32px rgba(0,0,0,.4),0 2px 8px rgba(0,0,0,.2);
  --shadow-xl:0 16px 64px rgba(0,0,0,.5),0 4px 16px rgba(0,0,0,.3);
  --shadow-glow:0 0 60px rgba(57,211,187,.12),0 0 120px rgba(57,211,187,.06);
  --radius:12px;--radius-lg:16px;--radius-xl:20px;
}

/* Ambient background */
body::before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;
  background:
    radial-gradient(ellipse 80% 50% at 20% -20%,rgba(57,211,187,.07),transparent 60%),
    radial-gradient(ellipse 60% 40% at 80% -10%,rgba(128,101,244,.06),transparent 55%),
    radial-gradient(ellipse 40% 30% at 50% 100%,rgba(57,211,187,.04),transparent 50%);
}

/* Reveal animation */
.fl-fade{opacity:0;transform:translateY(20px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}
.fl-fade.fl-in{opacity:1;transform:none}

/* Gradient text utility */
.grad-text{background:var(--grad-text);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}

/* ── NAV ── */
.fl-nav{position:fixed;top:0;left:0;right:0;z-index:200;height:64px;padding:0 clamp(20px,4vw,48px);display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid transparent;transition:all .3s cubic-bezier(.16,1,.3,1)}
.fl-nav.sc{background:rgba(5,6,8,.85);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border-bottom-color:var(--line)}
.fl-logo{display:flex;align-items:center;gap:9px;text-decoration:none}
.fl-logo img{width:30px;height:30px;object-fit:contain;flex-shrink:0}
.fl-logo-text{font-weight:900;font-size:20px;color:var(--ink);letter-spacing:-.03em}
.fl-logo-text em{color:var(--teal);font-style:normal}
.fl-nav-links{display:flex;align-items:center;gap:2px;list-style:none}
.fl-nav-links a{font-size:13px;font-weight:500;color:var(--ink3);text-decoration:none;padding:7px 14px;border-radius:8px;transition:all .2s}
.fl-nav-links a:hover{color:var(--ink);background:rgba(255,255,255,.04)}
.fl-nav-right{display:flex;align-items:center;gap:8px}
.fl-nav-signin{font-size:13px;font-weight:500;color:var(--ink3);text-decoration:none;padding:7px 14px;transition:color .2s}
.fl-nav-signin:hover{color:var(--ink)}
.fl-nav-cta{display:inline-flex;align-items:center;gap:6px;background:var(--teal);color:#06140f;padding:8px 18px;border-radius:8px;font-weight:700;font-size:13px;text-decoration:none;transition:all .2s;box-shadow:0 2px 12px rgba(57,211,187,.2)}
.fl-nav-cta:hover{background:var(--teal2);transform:translateY(-1px);box-shadow:0 4px 20px rgba(57,211,187,.3)}
.fl-hbg{display:none;background:none;border:1px solid var(--line2);border-radius:8px;padding:6px 10px;cursor:pointer;color:var(--ink3);font-size:16px}
.fl-mdraw{position:fixed;top:64px;left:0;right:0;z-index:190;background:rgba(5,6,8,.97);backdrop-filter:blur(24px);border-bottom:1px solid var(--line);padding:12px 16px 20px;display:flex;flex-direction:column;gap:2px;transform:translateY(-110%);transition:transform .25s ease}
.fl-mdraw.open{transform:none}
.fl-mdraw a{color:var(--ink3);text-decoration:none;font-size:14px;font-weight:500;padding:12px 14px;border-radius:8px}
.fl-mdraw a:hover{background:rgba(255,255,255,.04);color:var(--ink)}

@media(max-width:900px){
  .fl-nav-links,.fl-nav-signin{display:none}
  .fl-hbg{display:flex}
}

/* ── HERO ── */
.fl-hero{min-height:100vh;display:flex;align-items:center;padding:clamp(100px,12vw,140px) clamp(20px,4vw,48px) clamp(60px,8vw,100px);position:relative;overflow:hidden}
.fl-hero-grid{position:absolute;inset:0;pointer-events:none;
  background-image:linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px);
  background-size:72px 72px;
  mask-image:radial-gradient(ellipse 70% 60% at 50% 0%,black,transparent 75%)}
.fl-hero-orb1{position:absolute;top:-20%;left:-10%;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(57,211,187,.1) 0%,transparent 70%);filter:blur(80px);pointer-events:none;animation:fl-float 15s ease-in-out infinite}
.fl-hero-orb2{position:absolute;top:-10%;right:-15%;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(128,101,244,.08) 0%,transparent 70%);filter:blur(80px);pointer-events:none;animation:fl-float 18s ease-in-out infinite reverse}
@keyframes fl-float{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,20px)}}
.fl-hero-in{max-width:1200px;margin:0 auto;position:relative;z-index:1;width:100%}
.fl-hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(57,211,187,.08);border:1px solid rgba(57,211,187,.15);border-radius:100px;padding:6px 16px 6px 8px;margin-bottom:24px;font-size:12.5px;color:var(--teal);font-weight:600}
.fl-hero-badge-dot{width:8px;height:8px;border-radius:50%;background:var(--teal);animation:fl-pulse 2s infinite}
@keyframes fl-pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(57,211,187,.4)}50%{opacity:.7;box-shadow:0 0 0 6px rgba(57,211,187,0)}}
.fl-h1{font-weight:900;font-size:clamp(40px,6vw,80px);line-height:.96;letter-spacing:-.045em;color:var(--ink);max-width:900px;margin-bottom:24px}
.fl-h1 .soft{color:var(--ink4)}
.fl-h1 .em{background:linear-gradient(135deg,var(--teal),#6BE4D0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.fl-hero-layout{display:grid;grid-template-columns:1fr 400px;gap:clamp(32px,5vw,64px);align-items:end;margin-top:8px}
.fl-hero-sub{font-size:clamp(15px,1.4vw,17px);color:var(--ink3);line-height:1.75;max-width:440px;margin-bottom:32px}
.fl-hero-sub strong{color:var(--ink);font-weight:700}
.fl-hero-btns{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.fl-btn-p{display:inline-flex;align-items:center;gap:8px;background:var(--teal);color:#06140f;padding:14px 28px;border-radius:10px;font-weight:700;font-size:14.5px;text-decoration:none;transition:all .25s;border:none;cursor:pointer;font-family:inherit;box-shadow:0 4px 20px rgba(57,211,187,.25),inset 0 1px 0 rgba(255,255,255,.2)}
.fl-btn-p:hover{background:var(--teal2);transform:translateY(-2px);box-shadow:0 8px 32px rgba(57,211,187,.35),inset 0 1px 0 rgba(255,255,255,.2)}
.fl-btn-s{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.03);color:var(--ink);padding:14px 22px;border-radius:10px;font-weight:600;font-size:14px;text-decoration:none;border:1px solid var(--line2);transition:all .25s}
.fl-btn-s:hover{background:rgba(255,255,255,.06);border-color:rgba(57,211,187,.4);color:var(--teal)}
.fl-hero-trust{display:flex;align-items:center;gap:16px;margin-top:28px;font-size:12px;color:var(--ink4)}
.fl-hero-trust-item{display:flex;align-items:center;gap:5px}
.fl-hero-trust-item svg{color:var(--teal);opacity:.7}

/* Phone mockup */
.fl-phone{background:var(--s2);border:1px solid var(--line2);border-radius:22px;overflow:hidden;box-shadow:var(--shadow-xl),var(--shadow-glow);position:relative}
.fl-phone::before{content:'';position:absolute;inset:-1px;border-radius:22px;padding:1px;background:linear-gradient(135deg,rgba(57,211,187,.2),transparent 40%,transparent 60%,rgba(128,101,244,.15));mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask-composite:exclude;-webkit-mask-composite:xor;pointer-events:none;z-index:1}
.fl-phone-top{background:var(--s3);border-bottom:1px solid var(--line);padding:12px 16px;display:flex;align-items:center;gap:10px}
.fl-phone-av{width:32px;height:32px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,var(--teal),var(--purple));display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#fff}
.fl-phone-name{font-size:13px;font-weight:700;color:var(--ink)}
.fl-phone-status{font-size:10px;color:var(--teal);display:flex;align-items:center;gap:4px}
.fl-phone-status::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--teal)}
.fl-phone-body{padding:14px;min-height:230px;display:flex;flex-direction:column;gap:8px}
.fl-pm{max-width:84%;padding:9px 13px;border-radius:12px;font-size:12px;line-height:1.55;white-space:pre-wrap;animation:fl-msgin .25s ease both}
.fl-pm.c{background:var(--teal);color:#06140f;align-self:flex-end;border-radius:12px 3px 12px 12px;font-weight:500}
.fl-pm.a{background:var(--s3);border:1px solid var(--line);color:var(--ink2);align-self:flex-start;border-radius:3px 12px 12px 12px}
@keyframes fl-msgin{from{opacity:0;transform:translateY(6px) scale(.97)}to{opacity:1;transform:none}}

@media(max-width:900px){
  .fl-hero-layout{grid-template-columns:1fr}
  .fl-phone{max-width:380px;margin:0 auto}
}

/* ── STATS BAR ── */
.fl-stats{border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--s1);padding:24px clamp(20px,4vw,48px);position:relative;overflow:hidden}
.fl-stats::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(57,211,187,.02) 50%,transparent);pointer-events:none}
.fl-stats-in{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:24px}
.fl-stat{display:flex;align-items:baseline;gap:8px}
.fl-stat-num{font-family:var(--mono);font-weight:500;font-size:22px;color:var(--ink)}
.fl-stat-num em{color:var(--teal);font-style:normal}
.fl-stat-label{font-size:12px;color:var(--ink4)}
.fl-stat-sep{width:1px;height:20px;background:var(--line2)}
@media(max-width:760px){.fl-stat-sep{display:none}.fl-stats-in{justify-content:center}}

/* ── SECTION PATTERNS ── */
.fl-section{padding:clamp(80px,10vw,120px) clamp(20px,4vw,48px)}
.fl-section.alt{background:var(--s1);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.fl-section-in{max-width:1200px;margin:0 auto}
.fl-label{font-family:var(--mono);font-size:11.5px;font-weight:600;color:var(--teal);letter-spacing:.06em;text-transform:uppercase;margin-bottom:14px}
.fl-label.center{text-align:center}
.fl-h2{font-weight:900;font-size:clamp(28px,3.6vw,44px);color:var(--ink);letter-spacing:-.03em;line-height:1.1;margin-bottom:16px}
.fl-h2.center{text-align:center}
.fl-h2 em{font-style:normal;background:linear-gradient(135deg,var(--teal),#6BE4D0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.fl-p{font-size:14.5px;color:var(--ink3);line-height:1.75;max-width:520px}
.fl-p.center{text-align:center;margin:0 auto}

/* ── STORY TIMELINE ── */
.fl-timeline{margin-top:56px}
.fl-tl-row{display:grid;grid-template-columns:140px 1fr;gap:28px;align-items:baseline;padding:28px 0;border-top:1px solid var(--line);position:relative}
.fl-tl-row:last-child{border-bottom:1px solid var(--line)}
.fl-tl-time{font-family:var(--mono);font-size:clamp(20px,2.5vw,28px);font-weight:500;color:var(--ink5)}
.fl-tl-row.danger .fl-tl-time{color:var(--warn)}
.fl-tl-event{font-size:16px;font-weight:700;color:var(--ink);margin-bottom:4px}
.fl-tl-row.danger .fl-tl-event{color:var(--warn)}
.fl-tl-desc{font-size:13.5px;color:var(--ink3);line-height:1.65}
@media(max-width:640px){.fl-tl-row{grid-template-columns:1fr;gap:6px}}

/* ── PAIN CARDS ── */
.fl-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:var(--radius-lg);overflow:hidden;margin-top:48px}
.fl-card{background:var(--base);padding:32px 28px;position:relative;transition:background .3s}
.fl-card:hover{background:var(--s2)}
.fl-card-num{font-family:var(--mono);font-size:40px;font-weight:500;background:linear-gradient(135deg,rgba(57,211,187,.12),rgba(128,101,244,.08));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:14px}
.fl-card-title{font-size:16px;font-weight:700;color:var(--ink);margin-bottom:8px}
.fl-card-desc{font-size:13px;color:var(--ink3);line-height:1.7}
.fl-card-tag{display:inline-block;margin-top:16px;font-size:11px;font-weight:700;color:var(--warn);border:1px solid rgba(226,87,76,.2);border-radius:6px;padding:3px 10px;background:var(--warn-tint)}
@media(max-width:760px){.fl-cards{grid-template-columns:1fr}}

/* ── PRODUCT MODULES ── */
.fl-module{display:grid;grid-template-columns:1fr 1fr;gap:clamp(32px,5vw,72px);align-items:center;padding:64px 0}
.fl-module.alt-bg{background:var(--s1);margin:0 calc(-1 * clamp(20px,4vw,48px));padding:64px clamp(20px,4vw,48px);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.fl-module.rev .fl-module-text{order:2}
.fl-module.rev .fl-module-vis{order:1}
.fl-module-tag{font-family:var(--mono);font-size:11.5px;color:var(--teal);font-weight:500;margin-bottom:14px;display:flex;align-items:center;gap:8px}
.fl-module-tag svg{opacity:.5}
.fl-module-title{font-weight:800;font-size:clamp(22px,2.6vw,30px);color:var(--ink);letter-spacing:-.02em;line-height:1.2;margin-bottom:12px}
.fl-module-desc{font-size:13.5px;color:var(--ink3);line-height:1.75;margin-bottom:20px}
.fl-module-list{list-style:none;display:flex;flex-direction:column;gap:11px}
.fl-module-list li{display:flex;align-items:flex-start;gap:10px;font-size:13px;color:var(--ink3)}
.fl-module-list li svg{color:var(--teal);flex-shrink:0;margin-top:2px}

/* Phone/Dashboard mocks */
.fl-mock{background:var(--s2);border:1px solid var(--line2);border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-lg);max-width:380px;margin:0 auto;position:relative}
.fl-mock::before{content:'';position:absolute;inset:-1px;border-radius:var(--radius-xl);padding:1px;background:linear-gradient(135deg,rgba(57,211,187,.15),transparent 40%,transparent 60%,rgba(128,101,244,.1));mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask-composite:exclude;-webkit-mask-composite:xor;pointer-events:none;z-index:1}
.fl-mock-head{background:var(--s3);padding:12px 15px;display:flex;align-items:center;gap:9px;border-bottom:1px solid var(--line)}
.fl-mock-av{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--teal),var(--purple));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#fff;flex-shrink:0}
.fl-mock-name{font-size:12.5px;font-weight:700;color:var(--ink)}
.fl-mock-status{font-size:10px;color:var(--teal)}
.fl-mock-body{padding:15px;min-height:220px;display:flex;flex-direction:column;gap:8px}
.fl-mock-body .fl-pm{font-size:12.5px}

.fl-dash{background:var(--s1);border:1px solid var(--line2);border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-lg);max-width:380px;margin:0 auto;position:relative}
.fl-dash::before{content:'';position:absolute;inset:-1px;border-radius:var(--radius-xl);padding:1px;background:linear-gradient(135deg,rgba(128,101,244,.15),transparent 40%);mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask-composite:exclude;-webkit-mask-composite:xor;pointer-events:none;z-index:1}
.fl-dash-bar{height:36px;background:var(--s2);border-bottom:1px solid var(--line);display:flex;align-items:center;padding:0 14px;gap:6px}
.fl-dash-dot{width:7px;height:7px;border-radius:50%;background:var(--line3)}
.fl-dash-body{padding:20px}
.fl-dash-title{font-weight:700;font-size:13.5px;color:var(--ink);margin-bottom:16px}
.fl-dash-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}
.fl-dash-stat-label{font-size:10px;color:var(--ink4);margin-bottom:5px}
.fl-dash-stat-val{font-family:var(--mono);font-weight:500;font-size:17px;color:var(--ink)}
.fl-dash-stat-val.t{color:var(--teal)}
.fl-dash-roi{background:var(--s2);border-radius:10px;padding:14px 16px}
.fl-dash-roi-row{display:flex;justify-content:space-between;font-size:11.5px;color:var(--ink3);padding:5px 0}
.fl-dash-roi-row strong{font-family:var(--mono);font-weight:500;color:var(--ink)}
.fl-dash-roi-row strong.t{color:var(--teal)}

.fl-inbox{background:var(--s1);border:1px solid var(--line2);border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-lg);max-width:400px;margin:0 auto}
.fl-inbox-row{display:flex;align-items:center;gap:11px;padding:13px 16px;border-bottom:1px solid var(--line);transition:background .2s}
.fl-inbox-row:hover{background:rgba(255,255,255,.02)}
.fl-inbox-row:last-child{border-bottom:none}
.fl-inbox-av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--teal),var(--purple));color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;flex-shrink:0}
.fl-inbox-mid{flex:1;min-width:0}
.fl-inbox-name{font-size:12.5px;font-weight:700;color:var(--ink);margin-bottom:2px}
.fl-inbox-msg{font-size:11px;color:var(--ink4);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fl-inbox-right{text-align:right;flex-shrink:0}
.fl-inbox-time{font-size:10px;color:var(--ink4);margin-bottom:4px}
.fl-ai-pill{font-size:9px;font-weight:700;padding:2px 8px;border-radius:100px;background:var(--s2);color:var(--ink4)}
.fl-ai-pill.on{background:var(--teal-tint);color:var(--teal)}

@media(max-width:860px){
  .fl-module,.fl-module.rev{grid-template-columns:1fr;gap:28px}
  .fl-module.rev .fl-module-text{order:1}
  .fl-module.rev .fl-module-vis{order:2}
  .fl-module.alt-bg{margin:0 -20px;padding:48px 20px}
}

/* ── DEMO ── */
.fl-demo-layout{display:grid;grid-template-columns:180px 1fr;gap:20px;align-items:start;margin-top:44px}
.fl-demo-tabs{display:flex;flex-direction:column;gap:8px}
.fl-demo-tab{background:var(--base);border:1px solid var(--line);border-radius:var(--radius);padding:14px 16px;cursor:pointer;transition:all .2s}
.fl-demo-tab:hover{border-color:var(--line2);background:var(--s2)}
.fl-demo-tab.on{border-color:rgba(57,211,187,.4);background:var(--teal-tint)}
.fl-demo-tab-icon{font-size:16px;margin-bottom:6px}
.fl-demo-tab-label{font-size:13px;font-weight:700;color:var(--ink);margin-bottom:2px}
.fl-demo-tab-sub{font-size:11px;color:var(--ink4)}
.fl-wa-mock{background:#0a0c10;border-radius:var(--radius-xl);overflow:hidden;border:1px solid var(--line2);box-shadow:var(--shadow-xl);position:relative}
.fl-wa-mock::before{content:'';position:absolute;inset:-1px;border-radius:var(--radius-xl);padding:1px;background:linear-gradient(180deg,rgba(57,211,187,.15),transparent 30%);mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask-composite:exclude;-webkit-mask-composite:xor;pointer-events:none;z-index:1}
.fl-wa-head{background:var(--s3);padding:13px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--line)}
.fl-wa-body{padding:16px;min-height:280px;max-height:340px;display:flex;flex-direction:column;gap:8px;overflow-y:auto;scrollbar-width:none}
.fl-wa-body::-webkit-scrollbar{display:none}
@media(max-width:760px){.fl-demo-layout{grid-template-columns:1fr}.fl-demo-tabs{display:grid;grid-template-columns:repeat(3,1fr)}}

/* ── COMPARISON ── */
.fl-cmp-list{margin-top:56px}
.fl-cmp-row{display:flex;align-items:center;gap:20px;padding:24px 0;border-bottom:1px solid var(--line)}
.fl-cmp-before{font-size:15px;color:var(--ink4);text-decoration:line-through;text-decoration-color:var(--warn);opacity:.5;flex-shrink:0;min-width:260px;text-align:right;transition:opacity .5s}
.fl-cmp-arrow{color:var(--ink5);flex-shrink:0;transition:color .5s}
.fl-cmp-after{font-size:16px;font-weight:700;color:var(--ink);opacity:0;transform:translateX(-10px);transition:all .6s cubic-bezier(.16,1,.3,1)}
.fl-cmp-row.show .fl-cmp-after{opacity:1;transform:none}
.fl-cmp-row.show .fl-cmp-arrow{color:var(--teal)}
@media(max-width:600px){.fl-cmp-row{flex-direction:column;align-items:flex-start;gap:6px}.fl-cmp-before{text-align:left;min-width:0}}

/* ── TESTIMONIALS ── */
.fl-test-layout{display:grid;grid-template-columns:1.4fr 1fr;gap:clamp(36px,5vw,72px);align-items:start;margin-top:48px}
.fl-test-quote-mark{font-size:72px;line-height:.65;color:rgba(57,211,187,.15);font-family:var(--serif);font-style:italic;display:block;margin-bottom:8px}
.fl-test-quote{font-size:clamp(18px,2.2vw,24px);font-weight:600;color:var(--ink);line-height:1.55;letter-spacing:-.01em;margin-bottom:32px;min-height:120px}
.fl-test-auth{display:flex;align-items:center;gap:12px;padding-top:20px;border-top:1px solid var(--line)}
.fl-test-av{width:40px;height:40px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;color:#fff;background:linear-gradient(135deg,var(--teal),var(--purple))}
.fl-test-name{font-size:14px;font-weight:700;color:var(--ink)}
.fl-test-biz{font-size:12px;color:var(--ink4)}
.fl-test-rail{display:flex;flex-direction:column;border-left:1px solid var(--line)}
.fl-test-rail-btn{text-align:left;background:none;border:none;border-left:2px solid transparent;margin-left:-1px;padding:18px 0 18px 24px;cursor:pointer;font-family:inherit;transition:all .25s}
.fl-test-rail-btn.on{border-left-color:var(--teal);background:linear-gradient(90deg,var(--teal-tint),transparent 80%)}
.fl-test-rail-result{font-family:var(--mono);font-weight:500;font-size:24px;color:var(--ink5);margin-bottom:4px;transition:color .25s}
.fl-test-rail-btn.on .fl-test-rail-result{color:var(--teal)}
.fl-test-rail-label{font-size:11px;color:var(--ink4);margin-bottom:6px}
.fl-test-rail-name{font-size:12px;color:var(--ink4)}
@media(max-width:760px){.fl-test-layout{grid-template-columns:1fr;gap:32px}.fl-test-rail{border-left:none;border-top:1px solid var(--line);flex-direction:row;flex-wrap:wrap}.fl-test-rail-btn{border-left:none;border-top:2px solid transparent;margin-left:0;margin-top:-1px;padding:16px 20px 16px 0}.fl-test-rail-btn.on{border-top-color:var(--teal);background:none}}

/* ── FOUNDER ── */
.fl-founder-in{max-width:680px;margin:0 auto;text-align:center}
.fl-founder-letter{font-family:var(--serif);font-style:italic;font-size:clamp(17px,2vw,20px);color:var(--ink3);line-height:1.9;text-align:left;margin-top:40px}
.fl-founder-letter strong{color:var(--ink);font-weight:600;font-style:normal}
.fl-founder-pull{display:block;color:var(--teal);font-size:clamp(20px,2.4vw,24px);margin:28px 0;line-height:1.5;font-family:var(--serif);font-style:italic}
.fl-founder-sign{margin-top:48px;display:flex;align-items:center;gap:14px;justify-content:flex-start}
.fl-founder-av{width:44px;height:44px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,var(--teal),var(--purple));display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;color:#fff}
.fl-founder-name{font-size:14px;font-weight:700;color:var(--ink);font-family:var(--display);font-style:normal}
.fl-founder-role{font-size:12px;color:var(--ink4);font-family:var(--display);font-style:normal}

/* ── PRICING ── */
.fl-billing-toggle{display:inline-flex;align-items:center;gap:3px;background:var(--base);border:1px solid var(--line2);border-radius:100px;padding:4px;margin:24px auto 44px}
.fl-bt{padding:9px 20px;border-radius:100px;font-size:13px;font-weight:700;border:none;background:transparent;color:var(--ink4);cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px;transition:all .25s}
.fl-bt.on{background:var(--teal);color:#06140f}
.fl-bt-save{font-size:10px;font-weight:800;padding:2px 8px;border-radius:100px}
.fl-bt.on .fl-bt-save{background:rgba(0,0,0,.12)}
.fl-bt:not(.on) .fl-bt-save{background:var(--teal-tint);color:var(--teal)}
.fl-pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;align-items:start}
.fl-plan{background:var(--base);border:1px solid var(--line);border-radius:var(--radius-xl);padding:clamp(24px,3vw,32px);position:relative;transition:all .3s}
.fl-plan:hover{border-color:var(--line2);transform:translateY(-2px)}
.fl-plan.pop{border-color:rgba(57,211,187,.3);box-shadow:var(--shadow-xl),0 0 80px rgba(57,211,187,.08)}
.fl-plan.pop::before{content:'';position:absolute;inset:-1px;border-radius:var(--radius-xl);padding:1px;background:linear-gradient(135deg,rgba(57,211,187,.3),rgba(128,101,244,.15));mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask-composite:exclude;-webkit-mask-composite:xor;pointer-events:none}
.fl-plan-badge{position:absolute;top:-1px;left:24px;transform:translateY(-50%);background:var(--teal);color:#06140f;font-size:10px;font-weight:800;padding:4px 14px;border-radius:100px;box-shadow:0 2px 8px rgba(57,211,187,.3)}
.fl-plan-tier{font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--ink4);margin-bottom:6px}
.fl-plan-tag{font-size:12px;color:var(--ink4);margin-bottom:20px}
.fl-plan-price{display:flex;align-items:baseline;gap:2px;margin-bottom:4px}
.fl-plan-rs{font-size:16px;font-weight:700;color:var(--ink)}
.fl-plan-amt{font-family:var(--mono);font-size:clamp(34px,4.5vw,42px);font-weight:500;color:var(--ink);letter-spacing:-.02em}
.fl-plan.pop .fl-plan-amt,.fl-plan.pop .fl-plan-rs{color:var(--teal)}
.fl-plan-mo{font-size:11px;color:var(--ink4);margin-bottom:18px}
.fl-plan-billed{color:var(--ink4)}
.fl-plan-hr{border:none;border-top:1px solid var(--line);margin:16px 0}
.fl-plan-list{list-style:none;display:flex;flex-direction:column;gap:10px;margin-bottom:24px}
.fl-plan-list li{display:flex;align-items:flex-start;gap:9px;font-size:12.5px;color:var(--ink3)}
.fl-plan-list li svg{color:var(--teal);flex-shrink:0;margin-top:2px}
.fl-plan-list li.exc{color:var(--ink5);text-decoration:line-through}
.fl-plan-list li.exc svg{color:var(--ink5);opacity:.5}
.fl-plan-btn{display:block;text-align:center;padding:12px;border-radius:10px;font-weight:700;font-size:13.5px;text-decoration:none;transition:all .25s}
.fl-plan-btn.go{background:var(--teal);color:#06140f;box-shadow:0 2px 12px rgba(57,211,187,.2)}
.fl-plan-btn.go:hover{background:var(--teal2);transform:translateY(-1px);box-shadow:0 4px 20px rgba(57,211,187,.3)}
.fl-plan-btn.out{background:transparent;color:var(--ink);border:1px solid var(--line2)}
.fl-plan-btn.out:hover{border-color:rgba(57,211,187,.4);color:var(--teal)}
@media(max-width:760px){.fl-pgrid{grid-template-columns:1fr;max-width:400px;margin:0 auto}}

/* ── FAQ ── */
.fl-faq-list{max-width:680px;margin:44px auto 0}
.fl-fi{border-bottom:1px solid var(--line)}
.fl-fi:first-child{border-top:1px solid var(--line)}
.fl-fb{width:100%;background:none;border:none;padding:20px 0;text-align:left;font-size:14.5px;font-weight:600;color:var(--ink);cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:14px;font-family:inherit;transition:color .2s}
.fl-fb:hover{color:var(--teal)}
.fl-fp{width:22px;height:22px;border-radius:50%;background:var(--s2);display:flex;align-items:center;justify-content:center;font-size:14px;color:var(--ink4);flex-shrink:0;transition:all .25s}
.fl-fa{font-size:14px;color:var(--ink3);line-height:1.8;max-height:0;overflow:hidden;transition:max-height .35s ease,padding .35s ease}
.fl-fi.op .fl-fa{max-height:200px;padding:0 0 20px}
.fl-fi.op .fl-fp{background:var(--teal-tint);color:var(--teal);transform:rotate(45deg)}

/* ── CTA ── */
.fl-cta-card{max-width:720px;margin:0 auto;background:var(--s1);border:1px solid rgba(57,211,187,.2);border-radius:var(--radius-xl);padding:clamp(44px,6vw,72px) clamp(28px,4vw,56px);text-align:center;position:relative;overflow:hidden}
.fl-cta-card::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle at 50% 100%,rgba(57,211,187,.06) 0%,transparent 50%);pointer-events:none}
.fl-cta-btns{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:28px}
.fl-cta-note{margin-top:18px;font-size:11.5px;color:var(--ink4)}

/* ── FOOTER ── */
.fl-footer{background:var(--s1);border-top:1px solid var(--line);padding:clamp(48px,6vw,64px) clamp(20px,4vw,48px) 28px}
.fl-ft{max-width:1200px;margin:0 auto}
.fl-ft-top{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:clamp(28px,4vw,56px);margin-bottom:44px}
.fl-ft-tagline{font-size:12.5px;color:var(--ink4);line-height:1.8;margin-top:14px;max-width:260px}
.fl-ft-hd{font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--ink4);margin-bottom:14px}
.fl-ft-lks{list-style:none;display:flex;flex-direction:column;gap:10px}
.fl-ft-lks a{font-size:13px;color:var(--ink3);text-decoration:none;transition:color .2s}
.fl-ft-lks a:hover{color:var(--teal)}
.fl-ft-bot{padding-top:20px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--ink4);flex-wrap:wrap;gap:8px}
@media(max-width:760px){.fl-ft-top{grid-template-columns:1fr}}
      `}</style>

      {/* NAV */}
      <nav className={`fl-nav${scrolled ? " sc" : ""}`}>
        <a href="/" className="fl-logo">
          <img src="/logo.png" alt="Fastrill" />
          <span className="fl-logo-text">fast<em>rill</em></span>
        </a>
        <ul className="fl-nav-links">
          {[["#problem", "Problem"], ["#product", "Product"], ["#demo", "Demo"], ["#pricing", "Pricing"]].map(([h, l]) => (
            <li key={h}><a href={h}>{l}</a></li>
          ))}
        </ul>
        <div className="fl-nav-right">
          <a href="/login" className="fl-nav-signin">Sign in</a>
          <a href="/login" className="fl-nav-cta">Start free</a>
          <button className="fl-hbg" onClick={() => setMobOpen(p => !p)}>&#9776;</button>
        </div>
      </nav>
      <div className={`fl-mdraw${mobOpen ? " open" : ""}`}>
        {[["#problem", "Problem"], ["#product", "Product"], ["#demo", "Demo"], ["#pricing", "Pricing"]].map(([h, l]) => (
          <a key={h} href={h} onClick={() => setMobOpen(false)}>{l}</a>
        ))}
        <a href="/login" onClick={() => setMobOpen(false)}>Sign in</a>
      </div>

      {/* HERO */}
      <section className="fl-hero">
        <div className="fl-hero-grid" />
        <div className="fl-hero-orb1" />
        <div className="fl-hero-orb2" />
        <div className="fl-hero-in">
          <div className="fl-hero-badge">
            <span className="fl-hero-badge-dot" />
            AI-POWERED WHATSAPP AUTOMATION
          </div>
          <h1 className="fl-h1">
            <span className="soft">Your leads are messaging.</span><br />
            <span className="em">Nobody is replying.</span>
          </h1>
          <div className="fl-hero-layout">
            <div>
              <p className="fl-hero-sub">
                Most businesses reply in <strong>hours</strong> &mdash; or never. Fastrill replies in <strong>under 2 seconds</strong>, understands the customer, and books the appointment. Automatically.
              </p>
              <div className="fl-hero-btns">
                <a href="/login" className="fl-btn-p">Start free trial <Ic name="arrow" size={15} /></a>
                <a href="#demo" className="fl-btn-s"><Ic name="zap" size={14} /> See it in action</a>
              </div>
              <div className="fl-hero-trust">
                <span className="fl-hero-trust-item"><Ic name="shield" size={13} /> No credit card</span>
                <span className="fl-hero-trust-item"><Ic name="clock" size={13} /> Setup in 10 min</span>
                <span className="fl-hero-trust-item"><Ic name="globe" size={13} /> 10+ languages</span>
              </div>
            </div>
            <div className="fl-phone">
              <div className="fl-phone-top">
                <div className="fl-phone-av">R</div>
                <div>
                  <div className="fl-phone-name">Riya Salon</div>
                  <div className="fl-phone-status">Online now</div>
                </div>
              </div>
              <div className="fl-phone-body">
                {DEMOS.booking.map((m, i) => <div key={i} className={`fl-pm ${m.r}`}>{m.m}</div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="fl-stats">
        <div className="fl-stats-in">
          {[
            [3200, "+", "Bookings automated monthly"],
            [99, "%", "Delivery success rate"],
            ["1.8", "s", "Average AI response"],
            [10, "+", "Indian languages"],
          ].map(([n, s, l], i, arr) => (
            <span key={l} style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <span className="fl-stat">
                <span className="fl-stat-num">
                  {typeof n === "number" ? <AnimatedCounter end={n} /> : n}<em>{s}</em>
                </span>
                <span className="fl-stat-label">{l}</span>
              </span>
              {i < arr.length - 1 && <span className="fl-stat-sep" />}
            </span>
          ))}
        </div>
      </div>

      {/* STORY */}
      <section className="fl-section">
        <div className="fl-section-in">
          <div className="fl-fade">
            <div className="fl-label">A real scenario</div>
            <h2 className="fl-h2" style={{ maxWidth: 560 }}>What happens when you <em>don&apos;t reply</em> instantly?</h2>
          </div>
          <div className="fl-timeline">
            {[
              { time: "9:02 PM", event: "Customer messages you", desc: "Ready to book. Service: keratin treatment. Budget: ₹2,800." },
              { time: "9:45 PM", event: "You finally reply", desc: "Too late — they already asked your competitor." },
              { time: "10:12 PM", event: "Customer booked elsewhere", desc: "Your competitor replied in 2 minutes." },
              { time: "—", event: "Your loss", desc: "₹2,800 + lifetime value + referrals ≈ ₹12,000+", danger: true },
            ].map(row => (
              <div key={row.event} className={`fl-tl-row fl-fade${row.danger ? " danger" : ""}`}>
                <div className="fl-tl-time">{row.time}</div>
                <div>
                  <div className="fl-tl-event">{row.event}</div>
                  <div className="fl-tl-desc">{row.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="fl-fade" style={{ marginTop: 44, textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "var(--ink3)", marginBottom: 22 }}>This happens thousands of times every month across Indian businesses.</p>
            <a href="/login" className="fl-btn-p">Stop losing revenue <Ic name="arrow" size={15} /></a>
          </div>
        </div>
      </section>

      {/* PAIN */}
      <section className="fl-section alt" id="problem">
        <div className="fl-section-in">
          <div className="fl-fade" style={{ maxWidth: 560 }}>
            <div className="fl-label">The real problem</div>
            <h2 className="fl-h2">Your ads are working.<br /><em>Your follow-up isn&apos;t.</em></h2>
            <p className="fl-p">Most businesses spend thousands getting leads to message them. The money walks out in the WhatsApp inbox.</p>
          </div>
          <div className="fl-cards">
            {[
              { n: "01", t: "Leads die after hours", d: "A customer messages at 10 PM about your bridal package. You see it at 9 AM — she’s already booked someone who replied in 2 minutes.", tag: "Revenue lost every night" },
              { n: "02", t: "Speed wins the booking", d: "Your competitor replies in 2 seconds. You reply in 2 hours. Same service, same price — they win the appointment every time.", tag: "Competitive disadvantage" },
              { n: "03", t: "Silence becomes a bad review", d: "An upset customer messages at peak hour. Your staff is busy. The message sits unread. The 1-star review doesn’t.", tag: "Reputation at risk" },
            ].map(p => (
              <div key={p.n} className="fl-card fl-fade">
                <div className="fl-card-num">{p.n}</div>
                <div className="fl-card-title">{p.t}</div>
                <p className="fl-card-desc">{p.d}</p>
                <div className="fl-card-tag">{p.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT */}
      <section className="fl-section" id="product">
        <div className="fl-section-in">
          <div className="fl-fade">
            <div className="fl-label">What&apos;s inside</div>
            <h2 className="fl-h2">Not a chatbot.<br /><em>A revenue system.</em></h2>
            <p className="fl-p">Three modules that work together to turn every WhatsApp conversation into money in your bank.</p>
          </div>

          {/* Module 1: Booking */}
          <div className="fl-module">
            <div className="fl-module-text fl-fade">
              <div className="fl-module-tag"><Ic name="calendar" size={14} /> 01 / BOOKING ENGINE</div>
              <h3 className="fl-module-title">Books the appointment, start to finish.</h3>
              <p className="fl-module-desc">Service, date, time, confirmation &mdash; collected naturally, checked against real availability, and confirmed without a human touching it.</p>
              <ul className="fl-module-list">
                <li><Ic name="check" size={14} />Understands casual, mixed-language messages</li>
                <li><Ic name="check" size={14} />Checks real slot availability before confirming</li>
                <li><Ic name="check" size={14} />Sends instant notification to the owner</li>
                <li><Ic name="check" size={14} />Handles rescheduling and cancellation</li>
              </ul>
            </div>
            <div className="fl-module-vis fl-fade">
              <div className="fl-mock">
                <div className="fl-mock-head">
                  <div className="fl-mock-av">R</div>
                  <div><div className="fl-mock-name">Riya Salon</div><div className="fl-mock-status">Online</div></div>
                </div>
                <div className="fl-mock-body">
                  <div className="fl-pm c">Hi, I want a haircut tomorrow around 3pm</div>
                  <div className="fl-pm a">{"Tomorrow’s great — 3 PM is available.\n\nShall I confirm Haircut for tomorrow at 3:00 PM?"}</div>
                  <div className="fl-pm c">Yes please!</div>
                  <div className="fl-pm a">{"✅ Booking confirmed.\n\nHaircut · Tomorrow · 3:00 PM"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Module 2: Campaigns */}
          <div className="fl-module rev alt-bg">
            <div className="fl-module-text fl-fade">
              <div className="fl-module-tag"><Ic name="send" size={14} /> 02 / CAMPAIGNS</div>
              <h3 className="fl-module-title">See exactly what each campaign earned.</h3>
              <p className="fl-module-desc">Send approved WhatsApp templates to customer segments, and track delivery, replies and revenue attributed to that exact send.</p>
              <ul className="fl-module-list">
                <li><Ic name="check" size={14} />Segment by tag &mdash; new, returning, VIP, inactive</li>
                <li><Ic name="check" size={14} />Real Meta delivery and read tracking</li>
                <li><Ic name="check" size={14} />Revenue and ROI per campaign, not just opens</li>
                <li><Ic name="check" size={14} />Schedule sends for optimal timing</li>
              </ul>
            </div>
            <div className="fl-module-vis fl-fade">
              <div className="fl-dash">
                <div className="fl-dash-bar"><span className="fl-dash-dot" /><span className="fl-dash-dot" /><span className="fl-dash-dot" /></div>
                <div className="fl-dash-body">
                  <div className="fl-dash-title">Winter offer &mdash; January</div>
                  <div className="fl-dash-stats">
                    <div><div className="fl-dash-stat-label">Sent</div><div className="fl-dash-stat-val">412</div></div>
                    <div><div className="fl-dash-stat-label">Delivered</div><div className="fl-dash-stat-val">404</div></div>
                    <div><div className="fl-dash-stat-label">Replied</div><div className="fl-dash-stat-val t">138</div></div>
                  </div>
                  <div className="fl-dash-roi">
                    <div className="fl-dash-roi-row"><span>Est. bookings</span><strong>82</strong></div>
                    <div className="fl-dash-roi-row"><span>Est. revenue</span><strong>&#8377;98,400</strong></div>
                    <div className="fl-dash-roi-row"><span>ROI</span><strong className="t">+612%</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
     
