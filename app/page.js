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

const COMPARISON_PAIRS = [
  { before: "Reply in 8 hours", after: "Reply in 2 seconds" },
  { before: "No reply after hours", after: "Books at 2 AM" },
  { before: "Complaint ignored", after: "Resolved instantly" },
  { before: "No visibility on what converted", after: "Every booking tracked to source" },
]

function Icon({ name, size = 20 }) {
  const c = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" }
  switch (name) {
    case "check": return <svg {...c} strokeWidth={2.2}><path d="M20 6L9 17l-5-5" /></svg>
    case "arrow": return <svg {...c} strokeWidth={2}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    case "x": return <svg {...c} strokeWidth={2}><path d="M5 5l14 14M19 5L5 19" /></svg>
    case "play": return <svg {...c} strokeWidth={2}><path d="M6 4l14 8-14 8V4z" /></svg>
    default: return null
  }
}

export default function FastrillV9() {
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
    clearTimeout(timerRef.current)
    const msgs = DEMOS[demoKey]
    msgs.forEach((m, i) => {
      timerRef.current = setTimeout(() => {
        setDemoMsgs((p) => [...p, m])
        if (demoRef.current) demoRef.current.scrollTop = 9999
      }, 500 + i * 950)
    })
    return () => clearTimeout(timerRef.current)
  }, [demoKey])

  useEffect(() => {
    const el = cmpRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setCmpRevealed(true)
          io.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("v9-in")
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    )
    document.querySelectorAll(".v9-fade").forEach((el, idx) => {
      const sibs = Array.from(el.parentElement?.querySelectorAll(":scope>.v9-fade") || [])
      const i = sibs.indexOf(el)
      el.style.transitionDelay = Math.min(i * 0.06, 0.24) + "s"
      io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  return (
    <>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&family=Newsreader:ital@1&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:#050608;color:#9CA3B0;font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden;}

:root{
  --ink:#F4F5F7;--ink-soft:#9CA3B0;--ink-faint:#5B6270;
  --base:#050608;--s1:#0A0C10;--s2:#0F1217;--s3:#151921;
  --line:rgba(255,255,255,0.07);--line2:rgba(255,255,255,0.11);
  --teal:#39D3BB;--teal-deep:#22A98F;--teal-tint:rgba(57,211,187,0.1);
  --purple:#8065F4;--purple-deep:#6A4FE0;--purple-tint:rgba(128,101,244,0.1);
  --warn:#E2574C;--warn-tint:rgba(226,87,76,0.08);
  --display:'Plus Jakarta Sans',sans-serif;--mono:'JetBrains Mono',monospace;--serif:'Newsreader',serif;
  --shadow-card:0 1px 2px rgba(0,0,0,0.3),0 8px 24px rgba(0,0,0,0.35);
  --shadow-lift:0 4px 16px rgba(0,0,0,0.4),0 32px 64px rgba(0,0,0,0.45);
}
body::before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse 60% 45% at 30% -10%,rgba(57,211,187,0.06),transparent 60%),radial-gradient(ellipse 50% 40% at 85% 0%,rgba(128,101,244,0.05),transparent 60%);}

.v9-fade{opacity:0;transform:translateY(16px);transition:opacity .65s cubic-bezier(.2,.8,.2,1),transform .65s cubic-bezier(.2,.8,.2,1)}
.v9-fade.v9-in{opacity:1;transform:none}

/* NAV — unchanged pattern, this is correct as-is */
.v9-nav{position:fixed;top:0;left:0;right:0;z-index:200;height:68px;padding:0 clamp(20px,4vw,52px);display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid transparent;transition:all .25s;}
.v9-nav.sc{background:rgba(5,6,8,.88);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom-color:var(--line);}
.v9-logo{display:flex;align-items:center;gap:9px;text-decoration:none;}
.v9-logo-img{width:28px;height:28px;object-fit:contain;flex-shrink:0;display:block;}
.v9-logo-text{font-family:var(--display);font-weight:800;font-size:19px;color:var(--ink);letter-spacing:-.02em;}
.v9-logo-text em{color:var(--teal);font-style:normal;}
.v9-nmid{display:flex;align-items:center;gap:2px;list-style:none;}
.v9-nmid a{font-size:13.5px;font-weight:500;color:var(--ink-soft);text-decoration:none;padding:7px 13px;border-radius:6px;}
.v9-nmid a:hover{color:var(--ink);background:rgba(255,255,255,.04);}
.v9-nr{display:flex;align-items:center;gap:6px;}
.v9-signin{font-size:13.5px;font-weight:500;color:var(--ink-soft);text-decoration:none;padding:7px 13px;}
.v9-signin:hover{color:var(--ink);}
.v9-cta-nav{display:inline-flex;align-items:center;gap:6px;background:var(--teal);color:#06140f;padding:8px 16px;border-radius:7px;font-weight:700;font-size:13px;text-decoration:none;transition:all .2s;}
.v9-cta-nav:hover{background:var(--teal-deep);transform:translateY(-1px);}
.v9-hbg{display:none;background:none;border:1px solid var(--line2);border-radius:7px;padding:6px 9px;cursor:pointer;color:var(--ink-soft);font-size:15px;}
.v9-mdraw{position:fixed;top:68px;left:0;right:0;z-index:190;background:rgba(5,6,8,.97);backdrop-filter:blur(20px);border-bottom:1px solid var(--line);padding:10px 14px 18px;display:flex;flex-direction:column;gap:2px;transform:translateY(-110%);transition:transform .22s ease;}
.v9-mdraw.open{transform:none;}
.v9-mdraw a{color:var(--ink-soft);text-decoration:none;font-size:14px;font-weight:500;padding:10px 12px;border-radius:8px;}

/* ── 1. HERO — no eyebrow chip, headline flows directly, mockup integrated not boxed-separate ── */
.v9-hero{min-height:92vh;display:flex;align-items:center;padding:clamp(96px,11vw,120px) clamp(20px,4vw,52px) clamp(40px,5vw,64px);position:relative;overflow:hidden;}
.v9-hero-grid{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,.016) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.016) 1px,transparent 1px);background-size:80px 80px;mask-image:radial-gradient(ellipse 65% 55% at 50% 0%,black,transparent 75%);}
.v9-hero-in{max-width:1240px;margin:0 auto;position:relative;z-index:1;width:100%;}
.v9-hero-kicker{font-family:var(--mono);font-size:12.5px;color:var(--teal);letter-spacing:.04em;margin-bottom:18px;display:flex;align-items:center;gap:8px;}
.v9-hero-kicker::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--teal);animation:v9pulse 2s infinite;}
@keyframes v9pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(1.6)}}
.v9-h1{font-family:var(--display);font-weight:800;font-size:clamp(42px,6.4vw,84px);line-height:.98;letter-spacing:-.04em;color:var(--ink);max-width:920px;}
.v9-h1 .v9-h1-soft{color:var(--ink-faint);}
.v9-h1 em{color:var(--teal);font-style:normal;}
.v9-hero-bottom{display:grid;grid-template-columns:1fr 420px;gap:clamp(28px,4vw,56px);align-items:end;margin-top:40px;}
.v9-sub{font-size:clamp(15px,1.5vw,17px);color:var(--ink-soft);line-height:1.7;max-width:440px;margin-bottom:28px;}
.v9-sub strong{color:var(--ink);font-weight:700;}
.v9-hero-btns{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.v9-btn-primary{display:inline-flex;align-items:center;gap:8px;background:var(--teal);color:#06140f;padding:13px 24px;border-radius:9px;font-weight:700;font-size:14px;text-decoration:none;transition:all .22s;border:none;cursor:pointer;font-family:inherit;box-shadow:0 8px 24px rgba(57,211,187,.2);}
.v9-btn-primary:hover{background:var(--teal-deep);transform:translateY(-1px);box-shadow:0 12px 32px rgba(57,211,187,.3);}
.v9-btn-secondary{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.03);color:var(--ink);padding:13px 20px;border-radius:9px;font-weight:600;font-size:14px;text-decoration:none;border:1px solid var(--line2);transition:all .2s;}
.v9-btn-secondary:hover{background:rgba(255,255,255,.06);border-color:var(--teal);color:var(--teal);}

.v9-phone{background:var(--s2);border:1px solid var(--line2);border-radius:18px;overflow:hidden;box-shadow:var(--shadow-lift);}
.v9-phone-top{background:var(--s3);border-bottom:1px solid var(--line);padding:11px 14px;display:flex;align-items:center;gap:9px;}
.v9-phone-av{width:28px;height:28px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,var(--teal),var(--purple));display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;color:#fff;}
.v9-phone-name{font-size:12px;font-weight:700;color:var(--ink);}
.v9-phone-status{font-size:9.5px;color:var(--teal);display:flex;align-items:center;gap:4px;}
.v9-phone-status::before{content:'';width:4px;height:4px;border-radius:50%;background:var(--teal);}
.v9-phone-body{padding:13px;min-height:220px;display:flex;flex-direction:column;gap:7px;}
.v9-pm{max-width:84%;padding:8px 12px;border-radius:11px;font-size:11.5px;line-height:1.5;white-space:pre-wrap;animation:v9msgin .22s ease both;}
.v9-pm.c{background:var(--teal);color:#06140f;align-self:flex-end;border-radius:11px 3px 11px 11px;font-weight:500;}
.v9-pm.a{background:var(--s3);border:1px solid var(--line);color:var(--ink);align-self:flex-start;border-radius:3px 11px 11px 11px;}
@keyframes v9msgin{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}

@media(max-width:900px){
  .v9-nmid,.v9-signin{display:none;}
  .v9-hbg{display:flex;}
  .v9-hero-bottom{grid-template-columns:1fr;}
}

/* ── 2. TICKER STAT BAR — thin, dense, no card shapes ── */
.v9-ticker{border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--s1);padding:18px clamp(20px,4vw,52px);}
.v9-ticker-in{max-width:1240px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:20px;}
.v9-ticker-item{display:flex;align-items:baseline;gap:8px;}
.v9-ticker-num{font-family:var(--mono);font-weight:500;font-size:20px;color:var(--ink);}
.v9-ticker-num em{color:var(--teal);font-style:normal;}
.v9-ticker-label{font-size:12px;color:var(--ink-faint);}
.v9-ticker-sep{width:1px;height:16px;background:var(--line2);}
@media(max-width:760px){.v9-ticker-sep{display:none;}}

/* ── 3. LOSS STORY — full width, huge numbers, no card heading pattern ── */
.v9-story{padding:clamp(80px,10vw,120px) clamp(20px,4vw,52px);}
.v9-story-in{max-width:980px;margin:0 auto;}
.v9-story-kicker{font-size:13px;color:var(--ink-faint);margin-bottom:8px;}
.v9-story-h{font-family:var(--display);font-weight:800;font-size:clamp(26px,3.4vw,40px);color:var(--ink);letter-spacing:-.025em;margin-bottom:56px;max-width:560px;}
.v9-story-row{display:grid;grid-template-columns:160px 1fr;gap:24px;align-items:baseline;padding:28px 0;border-top:1px solid var(--line);}
.v9-story-row:last-child{border-bottom:1px solid var(--line);}
.v9-story-time{font-family:var(--mono);font-size:clamp(22px,2.8vw,32px);font-weight:500;color:var(--ink-faint);}
.v9-story-row.hl .v9-story-time{color:var(--warn);}
.v9-story-text-event{font-size:16px;font-weight:700;color:var(--ink);margin-bottom:4px;}
.v9-story-row.hl .v9-story-text-event{color:var(--warn);}
.v9-story-text-desc{font-size:14px;color:var(--ink-soft);line-height:1.6;}
@media(max-width:640px){.v9-story-row{grid-template-columns:1fr;gap:6px;}}

/* ── 4. PAIN — keep 3-card but compress, this is one of only two "card row" patterns allowed ── */
.v9-pain{padding:clamp(72px,9vw,108px) clamp(20px,4vw,52px);background:var(--s1);border-top:1px solid var(--line);border-bottom:1px solid var(--line);}
.v9-pain-in{max-width:1240px;margin:0 auto;}
.v9-pain-head{max-width:560px;margin-bottom:48px;}
.v9-pain-label{font-size:12px;font-weight:700;color:var(--teal);letter-spacing:.08em;text-transform:uppercase;margin-bottom:14px;}
.v9-pain-h{font-family:var(--display);font-weight:800;font-size:clamp(26px,3.4vw,38px);color:var(--ink);letter-spacing:-.025em;line-height:1.15;margin-bottom:14px;}
.v9-pain-h em{font-style:italic;color:var(--teal);}
.v9-pain-p{font-size:14px;color:var(--ink-soft);line-height:1.75;}
.v9-pain-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:14px;overflow:hidden;}
.v9-pain-card{background:var(--base);padding:28px 26px;}
.v9-pain-num{font-family:var(--mono);font-size:36px;font-weight:500;color:rgba(57,211,187,.15);margin-bottom:12px;}
.v9-pain-title{font-size:16px;font-weight:700;color:var(--ink);margin-bottom:7px;}
.v9-pain-desc{font-size:13px;color:var(--ink-soft);line-height:1.7;}
.v9-pain-tag{display:inline-block;margin-top:14px;font-size:11px;font-weight:700;color:var(--warn);border:1px solid rgba(226,87,76,.25);border-radius:6px;padding:3px 9px;}
@media(max-width:760px){.v9-pain-grid{grid-template-columns:1fr;}}

/* ── 5. PRODUCT MODULES — alternating, varied background tone per module ── */
.v9-product{padding:clamp(80px,10vw,120px) clamp(20px,4vw,52px);}
.v9-product-in{max-width:1240px;margin:0 auto;}
.v9-product-head{max-width:560px;margin-bottom:64px;}
.v9-module{display:grid;grid-template-columns:1fr 1fr;gap:clamp(28px,5vw,64px);align-items:center;padding:56px 0;}
.v9-module.tone{background:var(--s1);margin:0 calc(-1 * clamp(20px,4vw,52px));padding:56px clamp(20px,4vw,52px);border-radius:0;}
.v9-module.rev .v9-module-text{order:2;}
.v9-module.rev .v9-module-visual{order:1;}
.v9-module-tag{font-family:var(--mono);font-size:11.5px;color:var(--teal);margin-bottom:14px;}
.v9-module-title{font-family:var(--display);font-weight:800;font-size:clamp(21px,2.5vw,28px);color:var(--ink);letter-spacing:-.02em;line-height:1.2;margin-bottom:11px;}
.v9-module-desc{font-size:13.5px;color:var(--ink-soft);line-height:1.7;margin-bottom:18px;}
.v9-module-list{list-style:none;display:flex;flex-direction:column;gap:10px;}
.v9-module-list li{display:flex;align-items:flex-start;gap:9px;font-size:13px;color:var(--ink-soft);}
.v9-module-list li svg{color:var(--teal);flex-shrink:0;margin-top:2px;}

.v9-mock-wa{background:#0a0c10;border-radius:16px;overflow:hidden;box-shadow:var(--shadow-lift);border:1px solid var(--line2);max-width:380px;margin:0 auto;}
.v9-mock-wa-head{background:var(--s3);padding:12px 15px;display:flex;align-items:center;gap:9px;}
.v9-mock-av{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--teal),var(--purple));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#fff;flex-shrink:0;}
.v9-mock-name{font-size:12.5px;font-weight:700;color:var(--ink);}
.v9-mock-status{font-size:10px;color:var(--teal);}
.v9-mock-wa-body{padding:15px;min-height:210px;display:flex;flex-direction:column;gap:8px;}
.v9-mock-wa-body .v9-pm{font-size:12.5px;}

.v9-mock-dash{background:var(--s1);border:1px solid var(--line2);border-radius:16px;overflow:hidden;box-shadow:var(--shadow-lift);max-width:380px;margin:0 auto;}
.v9-mock-bar{height:36px;background:var(--s2);border-bottom:1px solid var(--line);display:flex;align-items:center;padding:0 13px;gap:6px;}
.v9-mock-dot{width:7px;height:7px;border-radius:50%;background:var(--line2);}
.v9-mock-body{padding:20px;}
.v9-mock-title{font-weight:700;font-size:13.5px;color:var(--ink);margin-bottom:14px;}
.v9-mock-stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;}
.v9-mock-stat-label{font-size:10px;color:var(--ink-faint);margin-bottom:5px;}
.v9-mock-stat-val{font-family:var(--mono);font-weight:500;font-size:16px;color:var(--ink);}
.v9-mock-stat-val.t{color:var(--teal);}
.v9-mock-roi{background:var(--s2);border-radius:9px;padding:12px 14px;}
.v9-mock-roi-row{display:flex;justify-content:space-between;font-size:11.5px;color:var(--ink-soft);padding:4px 0;}
.v9-mock-roi-row strong{font-family:var(--mono);font-weight:500;color:var(--ink);}
.v9-mock-roi-row strong.t{color:var(--teal);}

.v9-mock-inbox{background:var(--s1);border:1px solid var(--line2);border-radius:16px;overflow:hidden;box-shadow:var(--shadow-lift);max-width:400px;margin:0 auto;}
.v9-inbox-row{display:flex;align-items:center;gap:10px;padding:12px 15px;border-bottom:1px solid var(--line);}
.v9-inbox-row:last-child{border-bottom:none;}
.v9-inbox-av{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--teal),var(--purple));color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;flex-shrink:0;}
.v9-inbox-mid{flex:1;min-width:0;}
.v9-inbox-name{font-size:12px;font-weight:700;color:var(--ink);margin-bottom:2px;}
.v9-inbox-msg{font-size:11px;color:var(--ink-faint);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.v9-inbox-right{text-align:right;flex-shrink:0;}
.v9-inbox-time{font-size:9.5px;color:var(--ink-faint);margin-bottom:4px;}
.v9-ai-pill{font-size:9px;font-weight:700;padding:2px 7px;border-radius:100px;background:var(--s2);color:var(--ink-faint);}
.v9-ai-pill.on{background:var(--teal-tint);color:var(--teal);}

@media(max-width:860px){
  .v9-module,.v9-module.rev{grid-template-columns:1fr;gap:24px;}
  .v9-module.rev .v9-module-text{order:1;}
  .v9-module.rev .v9-module-visual{order:2;}
  .v9-module.tone{margin:0 -20px;padding:40px 20px;}
}

/* ── 6. DEMO ── */
.v9-demo{padding:clamp(72px,9vw,108px) clamp(20px,4vw,52px);background:var(--s1);border-top:1px solid var(--line);border-bottom:1px solid var(--line);}
.v9-demo-in{max-width:1240px;margin:0 auto;}
.v9-demo-head{max-width:520px;margin-bottom:40px;}
.v9-demo-layout{display:grid;grid-template-columns:170px 1fr;gap:18px;align-items:start;}
.v9-demo-tabs{display:flex;flex-direction:column;gap:7px;}
.v9-demo-tab{background:var(--base);border:1px solid var(--line);border-radius:10px;padding:13px 14px;cursor:pointer;transition:all .18s;}
.v9-demo-tab.on{border-color:var(--teal);background:var(--teal-tint);}
.v9-dt-label{font-size:13px;font-weight:700;color:var(--ink);margin-bottom:2px;}
.v9-dt-sub{font-size:11px;color:var(--ink-faint);}
.v9-wa-mock{background:#0a0c10;border-radius:16px;overflow:hidden;border:1px solid var(--line2);box-shadow:var(--shadow-lift);}
.v9-wa-head{background:var(--s3);padding:12px 16px;display:flex;align-items:center;gap:9px;border-bottom:1px solid var(--line);}
.v9-wa-body{padding:14px;min-height:260px;max-height:320px;display:flex;flex-direction:column;gap:8px;overflow-y:auto;scrollbar-width:none;}
.v9-wa-body::-webkit-scrollbar{display:none;}
@media(max-width:760px){.v9-demo-layout{grid-template-columns:1fr;}.v9-demo-tabs{display:grid;grid-template-columns:repeat(3,1fr);}}

/* ── 7. COMPARISON — inline strikethrough reveal, NOT card grid ── */
.v9-cmp{padding:clamp(80px,10vw,120px) clamp(20px,4vw,52px);}
.v9-cmp-in{max-width:760px;margin:0 auto;}
.v9-cmp-head{text-align:center;margin-bottom:56px;}
.v9-cmp-list{display:flex;flex-direction:column;gap:0;}
.v9-cmp-row{display:flex;align-items:center;gap:18px;padding:22px 0;border-bottom:1px solid var(--line);}
.v9-cmp-before{font-size:15px;color:var(--ink-faint);text-decoration:line-through;text-decoration-color:var(--warn);opacity:.6;flex-shrink:0;min-width:240px;text-align:right;transition:opacity .5s;}
.v9-cmp-arrow{color:var(--ink-faint);flex-shrink:0;}
.v9-cmp-after{font-size:16px;font-weight:600;color:var(--ink);opacity:0;transform:translateX(-8px);transition:all .5s;}
.v9-cmp-row.show .v9-cmp-after{opacity:1;transform:none;}
@media(max-width:600px){.v9-cmp-row{flex-direction:column;align-items:flex-start;gap:6px;}.v9-cmp-before{text-align:left;min-width:0;}}

/* ── 8. TESTIMONIAL RAIL ── */
.v9-test{padding:clamp(80px,10vw,120px) clamp(20px,4vw,52px);background:var(--s1);border-top:1px solid var(--line);border-bottom:1px solid var(--line);}
.v9-test-in{max-width:1100px;margin:0 auto;}
.v9-test-layout{display:grid;grid-template-columns:1.3fr 1fr;gap:clamp(32px,5vw,64px);align-items:start;}
.v9-test-qmark{font-size:64px;line-height:.7;color:rgba(57,211,187,.2);display:block;margin-bottom:8px;font-family:var(--serif);font-style:italic;}
.v9-test-quote{font-size:clamp(19px,2.4vw,26px);font-weight:600;color:var(--ink);line-height:1.5;letter-spacing:-.01em;margin-bottom:28px;}
.v9-test-auth{display:flex;align-items:center;gap:11px;padding-top:18px;border-top:1px solid var(--line);}
.v9-test-av{width:38px;height:38px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#fff;background:linear-gradient(135deg,var(--teal),var(--purple));}
.v9-test-name{font-size:13.5px;font-weight:700;color:var(--ink);}
.v9-test-biz{font-size:12px;color:var(--ink-faint);}
.v9-test-rail{display:flex;flex-direction:column;border-left:1px solid var(--line);}
.v9-test-rail-item{text-align:left;background:none;border:none;border-left:2px solid transparent;margin-left:-1px;padding:16px 0 16px 22px;cursor:pointer;font-family:inherit;transition:all .2s;}
.v9-test-rail-item.on{border-left-color:var(--teal);}
.v9-test-rail-result{font-family:var(--mono);font-weight:500;font-size:22px;color:var(--ink-faint);margin-bottom:3px;transition:color .2s;}
.v9-test-rail-item.on .v9-test-rail-result{color:var(--teal);}
.v9-test-rail-label{font-size:11px;color:var(--ink-faint);margin-bottom:6px;}
.v9-test-rail-name{font-size:12px;color:var(--ink-faint);}
@media(max-width:760px){.v9-test-layout{grid-template-columns:1fr;gap:28px;}.v9-test-rail{border-left:none;border-top:1px solid var(--line);flex-direction:row;flex-wrap:wrap;}.v9-test-rail-item{border-left:none;border-top:2px solid transparent;margin-left:0;margin-top:-1px;padding:14px 18px 14px 0;}.v9-test-rail-item.on{border-top-color:var(--teal);}}

/* ── 9. FOUNDER — letter treatment ── */
.v9-founder{padding:clamp(80px,10vw,120px) clamp(20px,4vw,52px);}
.v9-founder-in{max-width:680px;margin:0 auto;}
.v9-founder-kicker{font-size:12px;font-weight:700;color:var(--ink-faint);letter-spacing:.08em;text-transform:uppercase;margin-bottom:32px;text-align:center;}
.v9-founder-letter{font-family:var(--serif);font-style:italic;font-size:clamp(17px,2vw,20px);color:var(--ink-soft);line-height:1.85;}
.v9-founder-letter strong{color:var(--ink);font-weight:600;font-style:normal;}
.v9-founder-letter .v9-pull{display:block;color:var(--teal);font-size:clamp(20px,2.4vw,24px);margin:24px 0;line-height:1.5;}
.v9-founder-sign{margin-top:48px;display:flex;align-items:center;gap:14px;font-family:'Plus Jakarta Sans',sans-serif;font-style:normal;}
.v9-founder-av{width:42px;height:42px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,var(--teal),var(--purple));display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;color:#fff;}
.v9-founder-name{font-size:14px;font-weight:700;color:var(--ink);}
.v9-founder-role{font-size:12px;color:var(--ink-faint);}

/* ── 10. PRICING ── */
.v9-pricing{padding:clamp(80px,10vw,120px) clamp(20px,4vw,52px);background:var(--s1);border-top:1px solid var(--line);border-bottom:1px solid var(--line);}
.v9-pricing-in{max-width:1100px;margin:0 auto;}
.v9-pricing-head{text-align:center;margin-bottom:8px;}
.v9-billing-toggle{display:inline-flex;align-items:center;gap:4px;background:var(--base);border:1px solid var(--line);border-radius:100px;padding:4px;margin:24px auto 40px;}
.v9-bt{padding:8px 18px;border-radius:100px;font-size:13px;font-weight:700;border:none;background:transparent;color:var(--ink-faint);cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px;transition:all .2s;}
.v9-bt.on{background:var(--teal);color:#06140f;}
.v9-bt-save{font-size:10px;font-weight:800;background:rgba(0,0,0,.12);padding:1px 7px;border-radius:100px;}
.v9-bt:not(.on) .v9-bt-save{background:var(--teal-tint);color:var(--teal);}
.v9-pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;align-items:start;}
.v9-plan{background:var(--base);border:1px solid var(--line);border-radius:14px;padding:clamp(22px,3vw,28px) clamp(20px,3vw,24px);position:relative;}
.v9-plan.pop{border-color:rgba(57,211,187,.4);box-shadow:var(--shadow-lift);}
.v9-plan-badge{position:absolute;top:-1px;left:22px;transform:translateY(-50%);background:var(--teal);color:#06140f;font-size:10px;font-weight:800;padding:3px 11px;border-radius:100px;}
.v9-plan-tier{font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:5px;}
.v9-plan-tag{font-size:12px;color:var(--ink-faint);margin-bottom:18px;}
.v9-plan-price{display:flex;align-items:baseline;gap:2px;margin-bottom:3px;}
.v9-plan-rs{font-size:15px;font-weight:700;color:var(--ink);}
.v9-plan-amt{font-family:var(--mono);font-size:clamp(32px,4vw,38px);font-weight:500;color:var(--ink);letter-spacing:-.02em;}
.v9-plan.pop .v9-plan-amt,.v9-plan.pop .v9-plan-rs{color:var(--teal);}
.v9-plan-mo{font-size:11px;color:var(--ink-faint);margin-bottom:16px;}
.v9-plan-billed{color:var(--ink-faint);}
.v9-plan-hr{border:none;border-top:1px solid var(--line);margin:14px 0;}
.v9-plan-list{list-style:none;display:flex;flex-direction:column;gap:9px;margin-bottom:20px;}
.v9-plan-list li{display:flex;align-items:flex-start;gap:8px;font-size:12px;color:var(--ink-soft);}
.v9-plan-list li svg{color:var(--teal);flex-shrink:0;margin-top:2px;}
.v9-plan-list li.exc{color:var(--ink-faint);text-decoration:line-through;}
.v9-plan-btn{display:block;text-align:center;padding:11px;border-radius:8px;font-weight:700;font-size:13px;text-decoration:none;transition:all .2s;}
.v9-plan-btn.go{background:var(--teal);color:#06140f;}
.v9-plan-btn.go:hover{background:var(--teal-deep);}
.v9-plan-btn.out{background:transparent;color:var(--ink);border:1px solid var(--line2);}
.v9-plan-btn.out:hover{border-color:var(--teal);color:var(--teal);}
@media(max-width:760px){.v9-pgrid{grid-template-columns:1fr;}}

/* ── 11. FAQ ── */
.v9-faq{padding:clamp(72px,9vw,108px) clamp(20px,4vw,52px);}
.v9-faq-in{max-width:680px;margin:0 auto;}
.v9-faq-head{text-align:center;margin-bottom:40px;}
.v9-fi{border-bottom:1px solid var(--line);}
.v9-fi:first-child{border-top:1px solid var(--line);}
.v9-fb{width:100%;background:none;border:none;padding:18px 0;text-align:left;font-size:14px;font-weight:600;color:var(--ink);cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:12px;font-family:inherit;}
.v9-fp{width:20px;height:20px;border-radius:50%;background:var(--s2);display:flex;align-items:center;justify-content:center;font-size:13px;color:var(--ink-faint);flex-shrink:0;transition:all .2s;}
.v9-fa{font-size:13.5px;color:var(--ink-soft);line-height:1.75;max-height:0;overflow:hidden;transition:max-height .3s ease,padding .3s ease;}
.v9-fi.op .v9-fa{max-height:200px;padding:0 0 18px;}
.v9-fi.op .v9-fp{background:var(--teal-tint);color:var(--teal);transform:rotate(45deg);}

/* ── CTA ── */
.v9-cta{padding:clamp(72px,9vw,108px) clamp(20px,4vw,52px);text-align:center;}
.v9-cta-card{max-width:680px;margin:0 auto;background:var(--s1);border:1px solid rgba(57,211,187,.3);border-radius:18px;padding:clamp(40px,5vw,64px) clamp(24px,4vw,48px);}
.v9-cta-h{font-family:var(--display);font-weight:800;font-size:clamp(24px,3.2vw,38px);color:var(--ink);line-height:1.2;letter-spacing:-.03em;margin-bottom:14px;}
.v9-cta-h em{font-style:italic;color:var(--teal);}
.v9-cta-p{font-size:14px;color:var(--ink-soft);margin-bottom:28px;line-height:1.7;max-width:400px;margin-left:auto;margin-right:auto;}
.v9-cta-btns{display:flex;align-items:center;justify-content:center;gap:11px;flex-wrap:wrap;}
.v9-cta-note{margin-top:16px;font-size:11px;color:var(--ink-faint);}

/* ── FOOTER ── */
.v9-footer{background:var(--s1);border-top:1px solid var(--line);padding:clamp(44px,6vw,60px) clamp(20px,4vw,52px) 28px;}
.v9-ft{max-width:1240px;margin:0 auto;}
.v9-ft-top{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:clamp(24px,4vw,48px);margin-bottom:40px;}
.v9-ft-tagline{font-size:12px;color:var(--ink-faint);line-height:1.8;margin-top:14px;max-width:260px;}
.v9-ft-hd{font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:13px;}
.v9-ft-lks{list-style:none;display:flex;flex-direction:column;gap:9px;}
.v9-ft-lks a{font-size:13px;color:var(--ink-soft);text-decoration:none;}
.v9-ft-lks a:hover{color:var(--teal);}
.v9-ft-bot{padding-top:20px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--ink-faint);flex-wrap:wrap;gap:8px;}
@media(max-width:760px){.v9-ft-top{grid-template-columns:1fr;}}
      `}</style>

      {/* NAV */}
      <nav className={`v9-nav${scrolled ? " sc" : ""}`}>
        <a href="/" className="v9-logo">
          <img src="/logo.png" alt="Fastrill" className="v9-logo-img" />
          <span className="v9-logo-text">fast<em>rill</em></span>
        </a>
        <ul className="v9-nmid">
          {[["#pain", "Problem"], ["#product", "Product"], ["#demo", "Demo"], ["#pricing", "Pricing"]].map(([h, l]) => (
            <li key={h}><a href={h}>{l}</a></li>
          ))}
        </ul>
        <div className="v9-nr">
          <a href="/login" className="v9-signin">Sign in</a>
          <a href="/signup" className="v9-cta-nav">Start free</a>
          <button className="v9-hbg" onClick={() => setMobOpen((p) => !p)}>≡</button>
        </div>
      </nav>
      <div className={`v9-mdraw${mobOpen ? " open" : ""}`}>
        {[["#pain", "Problem"], ["#product", "Product"], ["#demo", "Demo"], ["#pricing", "Pricing"]].map(([h, l]) => (
          <a key={h} href={h} onClick={() => setMobOpen(false)}>{l}</a>
        ))}
        <a href="/login">Sign in</a>
      </div>

      {/* 1. HERO */}
      <section className="v9-hero">
        <div className="v9-hero-grid" />
        <div className="v9-hero-in">
          <div className="v9-hero-kicker">FASTRILL · AI FOR WHATSAPP</div>
          <h1 className="v9-h1">
            <span className="v9-h1-soft">You're not losing leads.</span><br />
            You're losing them <em>after they message you.</em>
          </h1>
          <div className="v9-hero-bottom">
            <div>
              <p className="v9-sub">
                Most businesses reply in <strong>hours</strong> — or never. Fastrill replies in <strong>under 2 seconds</strong>, qualifies the customer, and books the appointment automatically.
              </p>
              <div className="v9-hero-btns">
                <a href="/signup" className="v9-btn-primary">Start free <Icon name="arrow" size={15} /></a>
                <a href="#demo" className="v9-btn-secondary"><Icon name="play" size={13} /> See it live</a>
              </div>
            </div>
            <div className="v9-phone">
              <div className="v9-phone-top">
                <div className="v9-phone-av">R</div>
                <div>
                  <div className="v9-phone-name">Riya Salon</div>
                  <div className="v9-phone-status">Online now</div>
                </div>
              </div>
              <div className="v9-phone-body">
                {DEMOS.booking.map((m, i) => (<div key={i} className={`v9-pm ${m.r}`}>{m.m}</div>))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TICKER */}
      <div className="v9-ticker">
        <div className="v9-ticker-in">
          {[["3,200", "+", "Bookings automated monthly"], ["99", "%", "Delivery success rate"], ["1.8s", "", "Average AI response time"], ["10", "+", "Indian languages supported"]].map(([n, s, l], i, arr) => (
            <span key={l} style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <span className="v9-ticker-item"><span className="v9-ticker-num">{n}<em>{s}</em></span><span className="v9-ticker-label">{l}</span></span>
              {i < arr.length - 1 && <span className="v9-ticker-sep" />}
            </span>
          ))}
        </div>
      </div>

      {/* 3. LOSS STORY */}
      <section className="v9-story">
        <div className="v9-story-in">
          <div className="v9-fade">
            <div className="v9-story-kicker">A real scenario</div>
            <h2 className="v9-story-h">What happens when you don't reply instantly?</h2>
          </div>
          {[
            { time: "9:02 PM", event: "Customer messages you", desc: "Ready to book. Service: keratin treatment. Budget: ₹2,800." },
            { time: "9:45 PM", event: "You finally reply", desc: "Too late — they already asked your competitor." },
            { time: "10:12 PM", event: "Customer booked elsewhere", desc: "Your competitor replied in 2 minutes." },
            { time: "—", event: "Your loss", desc: "₹2,800 + lifetime value + reviews ≈ ₹12,000+", hl: true },
          ].map((row) => (
            <div key={row.event} className={`v9-story-row v9-fade${row.hl ? " hl" : ""}`}>
              <div className="v9-story-time">{row.time}</div>
              <div>
                <div className="v9-story-text-event">{row.event}</div>
                <div className="v9-story-text-desc">{row.desc}</div>
              </div>
            </div>
          ))}
          <div className="v9-fade" style={{ marginTop: 40, textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 20 }}>This happens thousands of times every month across Indian businesses.</p>
            <a href="/signup" className="v9-btn-primary">Stop the bleeding <Icon name="arrow" size={15} /></a>
          </div>
        </div>
      </section>

      {/* 4. PAIN */}
      <section className="v9-pain" id="pain">
        <div className="v9-pain-in">
          <div className="v9-pain-head v9-fade">
            <div className="v9-pain-label">The real problem</div>
            <h2 className="v9-pain-h">Your ads are working.<br /><em>Your follow-up isn't.</em></h2>
            <p className="v9-pain-p">Most businesses spend thousands getting leads to message them. The money walks out in the WhatsApp inbox.</p>
          </div>
          <div className="v9-pain-grid">
            {[
              { n: "01", t: "Leads die after hours.", d: "A customer messages at 10 PM about your bridal package. You see it at 9 AM — she's already booked someone who replied in 2 minutes.", tag: "Revenue lost every night" },
              { n: "02", t: "Speed wins the booking.", d: "Your competitor replies in 2 seconds. You reply in 2 hours. Same service, same price — they win the appointment every time.", tag: "Competitive loss" },
              { n: "03", t: "Silence becomes a bad review.", d: "An upset customer messages at peak hour. Your staff is busy. Fastrill responds in 2 seconds with genuine empathy.", tag: "Reputation at risk" },
            ].map((p) => (
              <div key={p.n} className="v9-pain-card v9-fade">
                <div className="v9-pain-num">{p.n}</div>
                <div className="v9-pain-title">{p.t}</div>
                <p className="v9-pain-desc">{p.d}</p>
                <div className="v9-pain-tag">{p.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PRODUCT MODULES */}
      <section className="v9-product" id="product">
        <div className="v9-product-in">
          <div className="v9-product-head v9-fade">
            <div className="v9-pain-label">What's inside</div>
            <h2 className="v9-pain-h">Not a chatbot.<br /><em>A revenue system.</em></h2>
          </div>

          <div className="v9-module">
            <div className="v9-module-text v9-fade">
              <div className="v9-module-tag">01 / BOOKING</div>
              <h3 className="v9-module-title">Books the appointment, start to finish.</h3>
              <p className="v9-module-desc">Service, date, time, confirmation — collected in order, checked against real availability, and confirmed without a human touching it.</p>
              <ul className="v9-module-list">
                <li><Icon name="check" size={14} />Understands casual, mixed-language messages</li>
                <li><Icon name="check" size={14} />Checks real slot availability before confirming</li>
                <li><Icon name="check" size={14} />Notifies the owner the moment it's booked</li>
              </ul>
            </div>
            <div className="v9-module-visual v9-fade">
              <div className="v9-mock-wa">
                <div className="v9-mock-wa-head">
                  <div className="v9-mock-av">R</div>
                  <div><div className="v9-mock-name">Riya Salon</div><div className="v9-mock-status">Online</div></div>
                </div>
                <div className="v9-mock-wa-body">
                  <div className="v9-pm c">Hi, I want a haircut tomorrow around 3pm</div>
                  <div className="v9-pm a">{"Tomorrow's great — 3 PM is available.\n\nShall I confirm Haircut for tomorrow at 3:00 PM?"}</div>
                  <div className="v9-pm c">Yes please!</div>
                  <div className="v9-pm a">{"Booking confirmed.\n\nHaircut · Tomorrow · 3:00 PM"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="v9-module rev tone">
            <div className="v9-module-text v9-fade">
              <div className="v9-module-tag">02 / CAMPAIGNS</div>
              <h3 className="v9-module-title">See exactly what each campaign earned.</h3>
              <p className="v9-module-desc">Send approved WhatsApp templates to customer segments, and track delivery, replies and revenue attributed to that exact send.</p>
              <ul className="v9-module-list">
                <li><Icon name="check" size={14} />Segment by tag — new, returning, VIP, inactive</li>
                <li><Icon name="check" size={14} />Real Meta delivery and read tracking</li>
                <li><Icon name="check" size={14} />Revenue and ROI per campaign, not just opens</li>
              </ul>
            </div>
            <div className="v9-module-visual v9-fade">
              <div className="v9-mock-dash">
                <div className="v9-mock-bar"><span className="v9-mock-dot" /><span className="v9-mock-dot" /><span className="v9-mock-dot" /></div>
                <div className="v9-mock-body">
                  <div className="v9-mock-title">Winter offer — January</div>
                  <div className="v9-mock-stat-row">
                    <div><div className="v9-mock-stat-label">Sent</div><div className="v9-mock-stat-val">412</div></div>
                    <div><div className="v9-mock-stat-label">Delivered</div><div className="v9-mock-stat-val">404</div></div>
                    <div><div className="v9-mock-stat-label">Replied</div><div className="v9-mock-stat-val t">138</div></div>
                  </div>
                  <div className="v9-mock-roi">
                    <div className="v9-mock-roi-row"><span>Est. bookings</span><strong>82</strong></div>
                    <div className="v9-mock-roi-row"><span>Est. revenue</span><strong>₹98,400</strong></div>
                    <div className="v9-mock-roi-row"><span>ROI</span><strong className="t">+612%</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="v9-module">
            <div className="v9-module-text v9-fade">
              <div className="v9-module-tag">03 / INBOX</div>
              <h3 className="v9-module-title">One inbox. Every conversation, every customer.</h3>
              <p className="v9-module-desc">See every conversation live, take over manually whenever you want, and let the AI pick back up the moment you're done.</p>
              <ul className="v9-module-list">
                <li><Icon name="check" size={14} />Toggle AI off for any single conversation</li>
                <li><Icon name="check" size={14} />Full customer history and tags in one view</li>
                <li><Icon name="check" size={14} />Works across 10+ Indian languages</li>
              </ul>
            </div>
            <div className="v9-module-visual v9-fade">
              <div className="v9-mock-inbox">
                {[
                  { n: "Priya Nair", m: "Yes please, book me for 3 PM", t: "now", on: true },
                  { n: "Arjun Mehta", m: "Do you have dermatology also", t: "2m", on: true },
                  { n: "Sneha Reddy", m: "Thank you so much!", t: "14m", on: false },
                ].map((c) => (
                  <div key={c.n} className="v9-inbox-row">
                    <div className="v9-inbox-av">{c.n.charAt(0)}</div>
                    <div className="v9-inbox-mid"><div className="v9-inbox-name">{c.n}</div><div className="v9-inbox-msg">{c.m}</div></div>
                    <div className="v9-inbox-right"><div className="v9-inbox-time">{c.t}</div><div className={`v9-ai-pill${c.on ? " on" : ""}`}>{c.on ? "AI on" : "Manual"}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. DEMO */}
      <section className="v9-demo" id="demo">
        <div className="v9-demo-in">
          <div className="v9-demo-head v9-fade">
            <div className="v9-pain-label">Live demo</div>
            <h2 className="v9-pain-h">See it convert in <em>seconds.</em></h2>
            <p className="v9-pain-p">Click a scenario — instant replies, any language.</p>
          </div>
          <div className="v9-demo-layout">
            <div className="v9-demo-tabs v9-fade">
              {DEMO_META.map((s) => (
                <div key={s.k} className={`v9-demo-tab${demoKey === s.k ? " on" : ""}`} onClick={() => setDemoKey(s.k)}>
                  <div className="v9-dt-label">{s.label}</div>
                  <div className="v9-dt-sub">{s.sub}</div>
                </div>
              ))}
            </div>
            <div className="v9-wa-mock v9-fade">
              <div className="v9-wa-head">
                <div className="v9-mock-av">R</div>
                <div><div className="v9-mock-name">Riya Salon</div><div className="v9-mock-status">Online</div></div>
              </div>
              <div className="v9-wa-body" ref={demoRef}>
                {demoMsgs.map((m, i) => (<div key={i} className={`v9-pm ${m.r}`}>{m.m}</div>))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. COMPARISON — strikethrough reveal */}
      <section className="v9-cmp" ref={cmpRef}>
        <div className="v9-cmp-in">
          <div className="v9-cmp-head v9-fade">
            <div className="v9-pain-label" style={{ justifyContent: "center", display: "flex" }}>The difference</div>
            <h2 className="v9-pain-h">Before Fastrill. <em>After.</em></h2>
          </div>
          <div className="v9-cmp-list">
            {COMPARISON_PAIRS.map((pair, i) => (
              <div key={pair.before} className={`v9-cmp-row${cmpRevealed ? " show" : ""}`} style={{ transitionDelay: `${i * 0.15}s` }}>
                <div className="v9-cmp-before">{pair.before}</div>
                <div className="v9-cmp-arrow"><Icon name="arrow" size={16} /></div>
                <div className="v9-cmp-after">{pair.after}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. TESTIMONIAL RAIL */}
      <section className="v9-test">
        <div className="v9-test-in">
          <div className="v9-test-layout v9-fade">
            <div>
              <span className="v9-test-qmark">"</span>
              <p className="v9-test-quote">{TESTIMONIALS[activeTestimonial].quote}</p>
              <div className="v9-test-auth">
                <div className="v9-test-av">{TESTIMONIALS[activeTestimonial].name.charAt(0)}</div>
                <div><div className="v9-test-name">{TESTIMONIALS[activeTestimonial].name}</div><div className="v9-test-biz">{TESTIMONIALS[activeTestimonial].biz}</div></div>
              </div>
            </div>
            <div className="v9-test-rail">
              {TESTIMONIALS.map((t, i) => (
                <button key={t.name} className={`v9-test-rail-item${i === activeTestimonial ? " on" : ""}`} onClick={() => setActiveTestimonial(i)}>
                  <div className="v9-test-rail-result">{t.result}</div>
                  <div className="v9-test-rail-label">{t.resultLabel}</div>
                  <div className="v9-test-rail-name">{t.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 9. FOUNDER — letter treatment */}
      <section className="v9-founder">
        <div className="v9-founder-in">
          <div className="v9-fade">
            <div className="v9-founder-kicker">Why we built this</div>
            <div className="v9-founder-letter">
              I've spent years in digital marketing — running ads, building funnels, optimising campaigns for businesses across India. Every lead costs money. Real money.
              <br /><br />
              And yet, the single most common thing I saw across <strong>every single client</strong> — salons, clinics, gyms, coaching centres — was this:
              <span className="v9-pull">Leads were arriving. And dying in the WhatsApp inbox.</span>
              A customer messages at 10 PM, ready to book. Nobody replies until morning. By then, they've moved on. You spent ₹300 on that click. It just evaporated.
              <br /><br />
              I saw a salon owner in Hyderabad spending <strong>₹40,000 a month on Instagram ads</strong>. Almost 60% of the leads who messaged never got a reply within the hour. Not because of bad ads — because of slow replies.
              <br /><br />
              <strong>The problem was never the ads. It was always the follow-up.</strong>
              <br /><br />
              So we built Fastrill — not as another chatbot, but as a revenue recovery system that sits between your ad spend and your bank account, and makes sure every lead gets an instant reply, in their language, at any hour.
            </div>
            <div className="v9-founder-sign">
              <div className="v9-founder-av">G</div>
              <div><div className="v9-founder-name">Ganapathi</div><div className="v9-founder-role">Founder, Fastrill — Solvabil Pvt. Ltd.</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. PRICING */}
      <section className="v9-pricing" id="pricing">
        <div className="v9-pricing-in">
          <div className="v9-pricing-head v9-fade">
            <div className="v9-pain-label" style={{ justifyContent: "center", display: "flex" }}>Pricing</div>
            <h2 className="v9-pain-h" style={{ textAlign: "center" }}>Simple pricing.<br /><em>Pays for itself.</em></h2>
          </div>
          <div className="v9-fade" style={{ display: "flex", justifyContent: "center" }}>
            <div className="v9-billing-toggle">
              <button className={`v9-bt${billing === "monthly" ? " on" : ""}`} onClick={() => setBilling("monthly")}>Monthly</button>
              <button className={`v9-bt${billing === "annual" ? " on" : ""}`} onClick={() => setBilling("annual")}>Annual <span className="v9-bt-save">Save 17%</span></button>
            </div>
          </div>
          <div className="v9-pgrid">
            {[
              { tier: "Starter", monthly: 999, tag: "Solo operators & new businesses", cta: "Get started", cs: "out", feats: [["inc", "1 WhatsApp number"], ["inc", "300 AI conversations / month"], ["inc", "Booking automation"], ["exc", "Lead recovery"], ["exc", "WhatsApp campaigns"]] },
              { tier: "Growth", monthly: 1999, tag: "For growing businesses", cta: "Start free trial", cs: "go", pop: true, feats: [["inc", "1 WhatsApp number"], ["inc", "Unlimited conversations"], ["inc", "Customer memory"], ["inc", "Lead recovery"], ["inc", "WhatsApp campaigns"]] },
              { tier: "Pro", monthly: 4999, tag: "Multi-branch teams", cta: "Contact sales", cs: "out", feats: [["inc", "Up to 5 WhatsApp numbers"], ["inc", "Everything in Growth"], ["inc", "Multi-branch management"], ["inc", "Custom AI playbook"], ["inc", "Dedicated onboarding"]] },
            ].map((plan) => {
              const price = billing === "annual" ? Math.round(plan.monthly * 0.83) : plan.monthly
              return (
                <div key={plan.tier} className={`v9-plan v9-fade${plan.pop ? " pop" : ""}`}>
                  {plan.pop && <div className="v9-plan-badge">Most popular</div>}
                  <div className="v9-plan-tier">{plan.tier}</div>
                  <div className="v9-plan-tag">{plan.tag}</div>
                  <div className="v9-plan-price"><span className="v9-plan-rs">₹</span><span className="v9-plan-amt">{price.toLocaleString("en-IN")}</span></div>
                  <div className="v9-plan-mo">per month + GST{billing === "annual" && <span className="v9-plan-billed"> · billed ₹{(price * 12).toLocaleString("en-IN")}/yr</span>}</div>
                  <hr className="v9-plan-hr" />
                  <ul className="v9-plan-list">
                    {plan.feats.map(([c, t]) => (<li key={t} className={c}>{c === "inc" ? <Icon name="check" size={13} /> : <Icon name="x" size={13} />}{t}</li>))}
                  </ul>
                  <a href="/signup" className={`v9-plan-btn ${plan.cs}`}>{plan.cta}</a>
                </div>
              )
            })}
          </div>
          <p style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "var(--ink-faint)" }}>14-day free trial · No credit card · Cancel anytime</p>
        </div>
      </section>

      {/* 11. FAQ */}
      <FAQSection />

      {/* CTA */}
      <section className="v9-cta">
        <div className="v9-cta-card v9-fade">
          <h2 className="v9-cta-h">Turn every WhatsApp conversation into <em>revenue.</em></h2>
          <p className="v9-cta-p">Start automating replies, recovering leads, and booking customers today.</p>
          <div className="v9-cta-btns">
            <a href="/signup" className="v9-btn-primary">Start free — no card needed <Icon name="arrow" size={15} /></a>
            <a href="https://wa.me/916309279265" className="v9-btn-secondary">Message us on WhatsApp</a>
          </div>
          <p className="v9-cta-note">14-day free trial · Setup in 10 minutes · Cancel anytime</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="v9-footer">
        <div className="v9-ft">
          <div className="v9-ft-top">
            <div>
              <a href="/" className="v9-logo">
                <img src="/logo.png" alt="Fastrill" className="v9-logo-img" />
                <span className="v9-logo-text">fast<em>rill</em></span>
              </a>
              <p className="v9-ft-tagline">AI-powered WhatsApp automation for Indian service businesses. Built by Solvabil Pvt. Ltd.</p>
            </div>
            {[
              { h: "Product", lks: [["How it works", "#product"], ["Pricing", "#pricing"], ["Demo", "#demo"]] },
              { h: "Company", lks: [["Our story", "#"], ["Contact", "mailto:team@fastrill.com"], ["Call us", "tel:+916309279265"]] },
              { h: "Legal", lks: [["Privacy", "/privacy"], ["Terms", "/terms"]] },
            ].map((col) => (
              <div key={col.h}>
                <div className="v9-ft-hd">{col.h}</div>
                <ul className="v9-ft-lks">{col.lks.map(([n, h]) => (<li key={n}><a href={h}>{n}</a></li>))}</ul>
              </div>
            ))}
          </div>
          <div className="v9-ft-bot">
            <span>© 2026 Fastrill, a product by Solvabil Pvt. Ltd.</span>
            <span>Made in India</span>
          </div>
        </div>
      </footer>
    </>
  )
}

function FAQSection() {
  const [open, setOpen] = useState(null)
  const faqs = [
    { q: "Do I need to change my WhatsApp number?", a: "No. You keep your existing WhatsApp Business number. Fastrill connects via Meta's official Business API — customers message the same number they always have." },
    { q: "How long does setup take?", a: "About 10 minutes from account creation to your first AI reply. Connect WhatsApp, add your services and hours, go live." },
    { q: "Which Indian languages are supported?", a: "Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi and English — auto-detected per conversation." },
    { q: "Can I take over and reply manually?", a: "Yes, always. Toggle AI off for any conversation — you reply manually, AI waits. Toggle back on when done." },
    { q: "Is there a free trial?", a: "Yes — 14 days, full Growth plan access, no credit card required." },
  ]
  return (
    <section className="v9-faq">
      <div className="v9-faq-in">
        <div className="v9-faq-head v9-fade">
          <div className="v9-pain-label" style={{ justifyContent: "center", display: "flex" }}>FAQ</div>
          <h2 className="v9-pain-h" style={{ textAlign: "center" }}>Honest answers</h2>
        </div>
        <div className="v9-fade">
          {faqs.map((f, i) => (
            <div key={i} className={`v9-fi${open === i ? " op" : ""}`}>
              <button className="v9-fb" onClick={() => setOpen(open === i ? null : i)}>{f.q}<span className="v9-fp">+</span></button>
              <div className="v9-fa">{f.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
