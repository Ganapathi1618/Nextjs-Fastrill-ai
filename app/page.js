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
    { r: "a", m: "Hi Anita! It's been a while since your last visit at Riya Salon.\n\nYour favourite keratin treatment is available this week — want to book?" },
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
  { name: "Priya Nair", biz: "Glow Parlour, Hyderabad", result: "+43% bookings, month one", quote: "I was losing Saturday night bookings because nobody replied after 8 PM. Customers now book at midnight and wake up to a confirmation. It paid for itself in the first week." },
  { name: "Dr. Ravi Sharma", biz: "Skin First Clinic, Vijayawada", result: "₹22k saved per month", quote: "My patients message in Telugu and the AI replies in Telugu, books the slot, and follows up if they go quiet. I had to see it to believe it wasn't a person." },
  { name: "Sneha Reddy", biz: "Studio S, 2 branches, Bangalore", result: "0 missed messages", quote: "Two branches, both inboxes handled at once. Our staff stopped checking phones and started focusing on the customer in front of them." },
]

function Icon({ name, size = 20 }) {
  const c = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" }
  switch (name) {
    case "calendar": return <svg {...c}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
    case "broadcast": return <svg {...c}><path d="M4 11.5v1a7.5 7.5 0 0 0 15 0v-1" /><path d="M9 18l1 3M15 18l-1 3" /><circle cx="11.5" cy="6.5" r="4.5" /></svg>
    case "recover": return <svg {...c}><path d="M3 12a9 9 0 1 0 2.6-6.4" /><path d="M3 5v5h5" /></svg>
    case "globe": return <svg {...c}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>
    case "check": return <svg {...c} strokeWidth={2.2}><path d="M20 6L9 17l-5-5" /></svg>
    case "arrow": return <svg {...c} strokeWidth={2}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    case "x": return <svg {...c} strokeWidth={2}><path d="M5 5l14 14M19 5L5 19" /></svg>
    case "play": return <svg {...c} strokeWidth={2}><path d="M6 4l14 8-14 8V4z" /></svg>
    case "moon": return <svg {...c}><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" /></svg>
    case "bolt": return <svg {...c}><path d="M13 2L4.5 14h7L11 22l8.5-12h-7L13 2z" /></svg>
    case "frown": return <svg {...c}><circle cx="12" cy="12" r="9" /><path d="M16 16s-1.5-2-4-2-4 2-4 2M9 9h.01M15 9h.01" /></svg>
    default: return null
  }
}

export default function FastrillMarketingDark() {
  const [scrolled, setScrolled] = useState(false)
  const [mobOpen, setMobOpen] = useState(false)
  const [demoKey, setDemoKey] = useState("booking")
  const [demoMsgs, setDemoMsgs] = useState([])
  const [counts, setCounts] = useState({ a: 0, b: 0, c: 0 })
  const statsRef = useRef(null)
  const countedRef = useRef(false)
  const demoRef = useRef(null)
  const timerRef = useRef(null)

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
    if (!statsRef.current || countedRef.current) return
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return
        countedRef.current = true
        io.disconnect()
        const run = (to, dur, cb) => {
          const s = performance.now()
          const tick = (now) => {
            const t = Math.min((now - s) / dur, 1)
            const e = 1 - Math.pow(1 - t, 3)
            cb(Math.round(to * e))
            if (t < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
        run(3200, 1700, (v) => setCounts((p) => ({ ...p, a: v })))
        run(99, 1400, (v) => setCounts((p) => ({ ...p, b: v })))
        run(73, 1300, (v) => setCounts((p) => ({ ...p, c: v })))
      },
      { threshold: 0.3 }
    )
    io.observe(statsRef.current)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("v5-in")
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    )
    document.querySelectorAll(".v5-fade").forEach((el, idx) => {
      const sibs = Array.from(el.parentElement?.querySelectorAll(":scope>.v5-fade") || [])
      const i = sibs.indexOf(el)
      el.style.transitionDelay = Math.min(i * 0.07, 0.28) + "s"
      io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  return (
    <>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:#050608;color:#9CA3B0;font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden;}

:root{
  --ink:#F4F5F7;--ink-soft:#9CA3B0;--ink-faint:#5B6270;
  --base:#050608;--s1:#0A0C10;--s2:#0F1217;--s3:#151921;
  --line:rgba(255,255,255,0.07);--line2:rgba(255,255,255,0.11);
  --signal:#39D3BB;--signal-deep:#22A98F;--signal-tint:rgba(57,211,187,0.1);--signal-tint2:rgba(57,211,187,0.05);
  --purple:#8065F4;--purple-deep:#6A4FE0;
  --warn:#E2574C;--warn-tint:rgba(226,87,76,0.08);
  --display:'Plus Jakarta Sans',sans-serif;--mono:'JetBrains Mono',monospace;
  --shadow-card:0 1px 2px rgba(0,0,0,0.3),0 8px 24px rgba(0,0,0,0.35);
  --shadow-lift:0 4px 16px rgba(0,0,0,0.4),0 32px 64px rgba(0,0,0,0.45);
}

body::before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse 60% 45% at 35% -10%,rgba(57,211,187,0.07),transparent 60%),radial-gradient(ellipse 50% 40% at 80% 5%,rgba(128,101,244,0.05),transparent 60%);}

.v5-fade{opacity:0;transform:translateY(18px);transition:opacity .7s cubic-bezier(.2,.8,.2,1),transform .7s cubic-bezier(.2,.8,.2,1)}
.v5-fade.v5-in{opacity:1;transform:none}

/* NAV */
.v5-nav{position:fixed;top:0;left:0;right:0;z-index:200;height:72px;padding:0 clamp(20px,4vw,48px);display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid transparent;transition:all .25s;}
.v5-nav.sc{background:rgba(5,6,8,.88);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom-color:var(--line);}
.v5-logo{display:flex;align-items:center;gap:10px;text-decoration:none;}
.v5-logo-img{width:30px;height:30px;object-fit:contain;flex-shrink:0;display:block;}
.v5-logo-text{font-family:var(--display);font-weight:800;font-size:21px;color:var(--ink);letter-spacing:-0.02em;}
.v5-logo-text em{color:var(--signal);font-style:normal;}
.v5-nmid{display:flex;align-items:center;gap:4px;list-style:none;}
.v5-nmid a{font-size:14px;font-weight:500;color:var(--ink-soft);text-decoration:none;padding:8px 14px;border-radius:7px;transition:all .15s;}
.v5-nmid a:hover{color:var(--ink);background:rgba(255,255,255,.04);}
.v5-nr{display:flex;align-items:center;gap:8px;}
.v5-signin{font-size:14px;font-weight:500;color:var(--ink-soft);text-decoration:none;padding:8px 14px;}
.v5-signin:hover{color:var(--ink);}
.v5-cta-nav{display:inline-flex;align-items:center;gap:6px;background:var(--signal);color:#fff;padding:9px 18px;border-radius:8px;font-weight:700;font-size:13.5px;text-decoration:none;transition:all .2s;}
.v5-cta-nav:hover{background:var(--signal-deep);transform:translateY(-1px);box-shadow:0 8px 24px rgba(57,211,187,.3);}
.v5-hbg{display:none;background:none;border:1px solid var(--line2);border-radius:7px;padding:7px 10px;cursor:pointer;color:var(--ink-soft);font-size:16px;}
.v5-mdraw{position:fixed;top:72px;left:0;right:0;z-index:190;background:rgba(5,6,8,.97);backdrop-filter:blur(20px);border-bottom:1px solid var(--line);padding:10px 14px 18px;display:flex;flex-direction:column;gap:2px;transform:translateY(-110%);transition:transform .22s ease;}
.v5-mdraw.open{transform:none;}
.v5-mdraw a{color:var(--ink-soft);text-decoration:none;font-size:14px;font-weight:500;padding:10px 12px;border-radius:8px;}
.v5-mdraw a:hover{color:var(--ink);background:rgba(255,255,255,.04);}

/* HERO */
.v5-hero{min-height:96vh;display:flex;align-items:center;padding:clamp(110px,12vw,140px) clamp(20px,4vw,48px) clamp(48px,6vw,72px);position:relative;overflow:hidden;}
.v5-hero-grid{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);background-size:72px 72px;mask-image:radial-gradient(ellipse 65% 55% at 50% 0%,black,transparent 75%);}
.v5-hero-in{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 460px;gap:clamp(32px,5vw,72px);align-items:center;position:relative;z-index:1;width:100%;}
.v5-eyebrow{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--line2);border-radius:100px;padding:6px 14px 6px 8px;margin-bottom:26px;font-size:12.5px;font-weight:600;color:var(--ink-soft);background:rgba(255,255,255,.02);}
.v5-eyebrow-dot{width:18px;height:18px;border-radius:50%;background:var(--signal-tint);border:1px solid rgba(57,211,187,.3);display:flex;align-items:center;justify-content:center;}
.v5-eyebrow-dot::after{content:'';width:5px;height:5px;border-radius:50%;background:var(--signal);animation:v5pulse 2s infinite;}
@keyframes v5pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(1.7)}}
.v5-h1{font-family:var(--display);font-weight:800;font-size:clamp(38px,4.8vw,60px);line-height:1.04;letter-spacing:-.035em;color:var(--ink);margin-bottom:8px;}
.v5-h1-line2{display:block;font-size:clamp(22px,2.6vw,32px);font-weight:700;line-height:1.15;letter-spacing:-.025em;color:var(--ink-faint);margin-top:6px;margin-bottom:26px;}
.v5-h1-line2 em{color:var(--signal);font-style:normal;}
.v5-sub{display:flex;flex-direction:column;gap:6px;margin-bottom:32px;max-width:480px;}
.v5-sub-line{font-size:15px;color:var(--ink-soft);line-height:1.65;}
.v5-sub-line strong{color:var(--ink);font-weight:700;background:var(--signal-tint2);padding:1px 5px;border-radius:4px;}
.v5-hero-btns{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:32px;}
.v5-btn-primary{display:inline-flex;align-items:center;gap:8px;background:var(--signal);color:#fff;padding:14px 26px;border-radius:10px;font-weight:700;font-size:14.5px;text-decoration:none;transition:all .22s;border:none;cursor:pointer;font-family:inherit;box-shadow:0 8px 24px rgba(57,211,187,.25);}
.v5-btn-primary:hover{background:var(--signal-deep);transform:translateY(-1px);box-shadow:0 12px 32px rgba(57,211,187,.35);}
.v5-btn-secondary{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.03);color:var(--ink);padding:14px 22px;border-radius:10px;font-weight:600;font-size:14.5px;text-decoration:none;border:1px solid var(--line2);transition:all .2s;}
.v5-btn-secondary:hover{background:rgba(255,255,255,.06);border-color:var(--signal);color:var(--signal);}
.v5-trust-mini{display:flex;align-items:center;gap:12px;}
.v5-mini-avs{display:flex;}
.v5-mini-av{width:26px;height:26px;border-radius:50%;border:2px solid var(--base);margin-left:-6px;font-size:9.5px;font-weight:800;color:#fff;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--signal),var(--purple));}
.v5-mini-av:first-child{margin-left:0;}
.v5-trust-mini span{font-size:12.5px;color:var(--ink-faint);}

/* phone mockup */
.v5-phone-wrap{position:relative;}
.v5-float-chip{position:absolute;background:var(--s2);border:1px solid var(--line2);border-radius:10px;padding:9px 13px;box-shadow:var(--shadow-card);display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:var(--ink);opacity:0;animation:v5chip .6s ease forwards;z-index:3;}
.v5-chip-ico{width:17px;height:17px;border-radius:50%;background:var(--signal-tint);color:var(--signal);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
@keyframes v5chip{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.v5-chip-1{top:-12px;right:-10px;animation-delay:1.3s;}
.v5-chip-2{bottom:18%;left:-26px;animation-delay:2.2s;}
.v5-phone{background:var(--s2);border:1px solid var(--line2);border-radius:22px;overflow:hidden;box-shadow:var(--shadow-lift);}
.v5-phone-top{background:var(--s3);border-bottom:1px solid var(--line);padding:13px 16px;display:flex;align-items:center;gap:10px;}
.v5-phone-av{width:34px;height:34px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,var(--signal),var(--purple));display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#fff;}
.v5-phone-name{font-size:13px;font-weight:700;color:var(--ink);}
.v5-phone-status{font-size:10.5px;color:var(--signal);display:flex;align-items:center;gap:4px;margin-top:1px;}
.v5-phone-status::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--signal);animation:v5pulse 2s infinite;}
.v5-phone-body{padding:14px;min-height:260px;max-height:320px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;scrollbar-width:none;}
.v5-phone-body::-webkit-scrollbar{display:none;}
.v5-pm{max-width:82%;padding:9px 13px;border-radius:12px;font-size:12.5px;line-height:1.55;white-space:pre-wrap;animation:v5msgin .22s ease both;}
.v5-pm.c{background:var(--signal);color:#fff;align-self:flex-end;border-radius:12px 4px 12px 12px;}
.v5-pm.a{background:var(--s3);border:1px solid var(--line);color:var(--ink);align-self:flex-start;border-radius:4px 12px 12px 12px;}
@keyframes v5msgin{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}

/* TRUST BAR */
.v5-trust{border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:14px clamp(16px,3vw,48px);display:flex;align-items:center;justify-content:center;gap:clamp(16px,3vw,40px);flex-wrap:wrap;background:var(--s1);}
.v5-tbadge{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:500;color:var(--ink-faint);white-space:nowrap;}
.v5-tdiv{width:1px;height:14px;background:var(--line2);}

/* STATS */
.v5-stats{background:var(--s1);border-bottom:1px solid var(--line);}
.v5-stats-row{display:grid;grid-template-columns:repeat(3,1fr);max-width:1200px;margin:0 auto;}
.v5-stat-cell{padding:clamp(36px,4.5vw,52px) clamp(20px,3vw,40px);border-right:1px solid var(--line);text-align:center;}
.v5-stat-cell:last-child{border-right:none;}
.v5-stat-n{font-family:var(--mono);font-size:clamp(38px,4.5vw,54px);font-weight:500;color:var(--ink);line-height:1;letter-spacing:-.02em;margin-bottom:6px;}
.v5-stat-n em{color:var(--signal);font-style:normal;}
.v5-stat-l{font-size:13.5px;font-weight:600;color:var(--ink-soft);}
.v5-stat-s{font-size:11.5px;color:var(--ink-faint);margin-top:4px;}

/* SECTION BASE */
.v5-sec{padding:clamp(88px,10vw,128px) 0;border-top:1px solid var(--line);}
.v5-sec:first-of-type{border-top:none;}
.v5-sec.alt{background:var(--s1);}
.v5-w{max-width:1200px;margin:0 auto;padding:0 clamp(20px,4vw,48px);}
.v5-label{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:700;letter-spacing:2.8px;text-transform:uppercase;color:var(--signal);margin-bottom:16px;}
.v5-label::before{content:'';width:16px;height:1.5px;background:var(--signal);}
.v5-h2{font-family:var(--display);font-weight:800;font-size:clamp(28px,3.6vw,44px);color:var(--ink);margin-bottom:16px;line-height:1.1;letter-spacing:-.03em;}
.v5-h2 em{font-style:italic;color:var(--signal);}
.v5-p{font-size:clamp(14px,1.5vw,16px);color:var(--ink-soft);line-height:1.8;}

/* LOSS TIMELINE */
.v5-loss-timeline{display:flex;flex-direction:column;border-left:2px solid var(--line);position:relative;max-width:760px;margin:48px auto 0;}
.v5-loss-item{display:grid;grid-template-columns:90px 1fr;gap:18px;padding:22px 0 22px 28px;border-bottom:1px solid var(--line);position:relative;}
.v5-loss-item:last-child{border-bottom:none;}
.v5-loss-item::before{content:'';position:absolute;left:-7px;top:30px;width:12px;height:12px;border-radius:50%;background:var(--line);border:2px solid var(--base);}
.v5-loss-item.hl{background:var(--warn-tint);padding:22px 24px 22px 28px;margin:0 -10px;border-radius:10px;}
.v5-loss-item.hl::before{background:var(--warn);}
.v5-loss-time{font-size:12.5px;font-weight:700;color:var(--ink-faint);text-align:right;padding-top:2px;}
.v5-loss-content{display:flex;align-items:flex-start;gap:11px;}
.v5-loss-ico{width:30px;height:30px;border-radius:8px;background:var(--s2);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--ink-faint);}
.v5-loss-item.hl .v5-loss-ico{background:rgba(226,87,76,.12);border-color:rgba(226,87,76,.25);color:var(--warn);}
.v5-loss-event{font-size:14px;font-weight:700;color:var(--ink);margin-bottom:3px;}
.v5-loss-desc{font-size:12.5px;color:var(--ink-soft);line-height:1.6;}
.v5-loss-item.hl .v5-loss-event{color:var(--warn);}

/* PAIN CARDS */
.v5-pain-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:16px;overflow:hidden;margin-top:48px;}
.v5-pain-card{background:var(--s1);padding:clamp(26px,3vw,36px);position:relative;}
.v5-pain-num{font-family:var(--mono);font-size:clamp(40px,5vw,56px);font-weight:500;line-height:1;color:rgba(57,211,187,.12);margin-bottom:14px;}
.v5-pain-ico{width:36px;height:36px;border-radius:9px;background:var(--s2);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;color:var(--ink-faint);margin-bottom:14px;}
.v5-pain-title{font-size:17px;font-weight:700;color:var(--ink);margin-bottom:6px;letter-spacing:-.01em;}
.v5-pain-desc{font-size:13px;color:var(--ink-soft);line-height:1.75;}
.v5-pain-tag{display:inline-block;margin-top:14px;font-size:11px;font-weight:700;color:var(--warn);border:1px solid rgba(226,87,76,.25);border-radius:6px;padding:3px 9px;}

/* MODULES */
.v5-module{display:grid;grid-template-columns:1fr 1fr;gap:clamp(28px,5vw,60px);align-items:center;margin-top:72px;}
.v5-module.rev .v5-module-text{order:2;}
.v5-module.rev .v5-module-visual{order:1;}
.v5-module-tag{display:inline-block;font-size:11.5px;font-weight:700;color:var(--signal);background:var(--signal-tint);padding:4px 12px;border-radius:100px;margin-bottom:14px;}
.v5-module-title{font-family:var(--display);font-weight:800;font-size:clamp(20px,2.4vw,26px);color:var(--ink);letter-spacing:-.02em;line-height:1.2;margin-bottom:10px;}
.v5-module-desc{font-size:13.5px;color:var(--ink-soft);line-height:1.7;margin-bottom:18px;}
.v5-module-list{list-style:none;display:flex;flex-direction:column;gap:10px;}
.v5-module-list li{display:flex;align-items:flex-start;gap:9px;font-size:13px;color:var(--ink-soft);}
.v5-module-list li svg{color:var(--signal);flex-shrink:0;margin-top:2px;}

.v5-mock-dash{background:var(--s1);border:1px solid var(--line2);border-radius:16px;overflow:hidden;box-shadow:var(--shadow-lift);max-width:400px;margin:0 auto;}
.v5-mock-bar{height:38px;background:var(--s2);border-bottom:1px solid var(--line);display:flex;align-items:center;padding:0 14px;gap:6px;}
.v5-mock-dot{width:8px;height:8px;border-radius:50%;background:var(--line2);}
.v5-mock-body{padding:20px;}
.v5-mock-title{font-weight:700;font-size:14px;color:var(--ink);margin-bottom:14px;}
.v5-mock-stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;}
.v5-mock-stat-label{font-size:10.5px;color:var(--ink-faint);margin-bottom:5px;}
.v5-mock-stat-val{font-family:var(--mono);font-weight:500;font-size:17px;color:var(--ink);}
.v5-mock-stat-val.s{color:var(--signal);}
.v5-mock-roi{background:var(--s2);border-radius:10px;padding:13px 15px;}
.v5-mock-roi-row{display:flex;justify-content:space-between;font-size:12px;color:var(--ink-soft);padding:4px 0;}
.v5-mock-roi-row strong{font-family:var(--mono);font-weight:500;color:var(--ink);}
.v5-mock-roi-row strong.s{color:var(--signal);}

.v5-mock-inbox{background:var(--s1);border:1px solid var(--line2);border-radius:16px;overflow:hidden;box-shadow:var(--shadow-lift);max-width:420px;margin:0 auto;}
.v5-inbox-row{display:flex;align-items:center;gap:11px;padding:13px 16px;border-bottom:1px solid var(--line);}
.v5-inbox-row:last-child{border-bottom:none;}
.v5-inbox-av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--signal),var(--purple));color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0;}
.v5-inbox-mid{flex:1;min-width:0;}
.v5-inbox-name{font-size:12.5px;font-weight:700;color:var(--ink);margin-bottom:2px;}
.v5-inbox-msg{font-size:11.5px;color:var(--ink-faint);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.v5-inbox-right{text-align:right;flex-shrink:0;}
.v5-inbox-time{font-size:10px;color:var(--ink-faint);margin-bottom:4px;}
.v5-ai-pill{font-size:9.5px;font-weight:700;padding:2px 7px;border-radius:100px;background:var(--s2);color:var(--ink-faint);}
.v5-ai-pill.on{background:var(--signal-tint);color:var(--signal);}

/* DEMO */
.v5-demo-layout{display:grid;grid-template-columns:170px 1fr;gap:18px;margin-top:40px;align-items:start;}
.v5-demo-tabs{display:flex;flex-direction:column;gap:7px;}
.v5-demo-tab{background:var(--s1);border:1px solid var(--line);border-radius:11px;padding:13px 14px;cursor:pointer;transition:all .18s;}
.v5-demo-tab.on{border-color:var(--signal);background:var(--signal-tint2);}
.v5-demo-tab:hover:not(.on){border-color:var(--line2);}
.v5-dt-label{font-size:13px;font-weight:700;color:var(--ink);margin-bottom:2px;}
.v5-dt-sub{font-size:11px;color:var(--ink-faint);}
.v5-wa-mock{background:#0a0c10;border-radius:18px;overflow:hidden;border:1px solid var(--line2);box-shadow:var(--shadow-lift);}
.v5-wa-head{background:var(--s3);padding:13px 17px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--line);}
.v5-wa-av{width:34px;height:34px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,var(--signal),var(--purple));display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#fff;}
.v5-wa-name{font-size:13.5px;font-weight:700;color:var(--ink);}
.v5-wa-st{font-size:10.5px;color:var(--signal);}
.v5-wa-body{padding:14px;min-height:280px;max-height:340px;display:flex;flex-direction:column;gap:9px;overflow-y:auto;scrollbar-width:none;}
.v5-wa-body::-webkit-scrollbar{display:none;}
.v5-wm{max-width:80%;padding:9px 13px;border-radius:12px;font-size:13px;line-height:1.55;white-space:pre-wrap;animation:v5msgin .22s ease both;}
.v5-wm.c{background:var(--signal);color:#fff;align-self:flex-end;border-radius:12px 4px 12px 12px;}
.v5-wm.a{background:var(--s3);border:1px solid var(--line);color:var(--ink);align-self:flex-start;border-radius:4px 12px 12px 12px;}

/* REVENUE BEFORE/AFTER */
.v5-rev-viz{display:grid;grid-template-columns:1fr 44px 1fr;gap:18px;align-items:center;margin-top:48px;}
.v5-rev-col{background:var(--s1);border:1px solid var(--line);border-radius:16px;padding:24px 22px;}
.v5-rev-col.after{border-color:rgba(57,211,187,.3);}
.v5-rev-col-label{font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;margin-bottom:16px;display:flex;align-items:center;gap:7px;}
.v5-rev-col-label.bad{color:var(--warn);}
.v5-rev-col-label.good{color:var(--signal);}
.v5-rev-item{display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--line);}
.v5-rev-item:last-child{border-bottom:none;}
.v5-rev-ico{width:28px;height:28px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
.v5-rev-ico.bad{background:rgba(226,87,76,.1);color:var(--warn);}
.v5-rev-ico.good{background:var(--signal-tint);color:var(--signal);}
.v5-rev-item-t{font-size:12.5px;font-weight:600;color:var(--ink);margin-bottom:2px;}
.v5-rev-item-s{font-size:11px;color:var(--ink-faint);line-height:1.4;}
.v5-rev-arrow{display:flex;flex-direction:column;align-items:center;gap:6px;}
.v5-rev-arrow-line{width:1px;height:28px;background:linear-gradient(to bottom,transparent,var(--signal),transparent);}
.v5-rev-arrow-ico{width:32px;height:32px;border-radius:50%;background:var(--signal-tint);border:1px solid rgba(57,211,187,.3);display:flex;align-items:center;justify-content:center;color:var(--signal);}

/* TESTIMONIALS */
.v5-test-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:48px;}
.v5-tc{background:var(--s1);border:1px solid var(--line);border-radius:14px;padding:24px;transition:border-color .2s;}
.v5-tc:hover{border-color:rgba(57,211,187,.25);}
.v5-tc-result{display:inline-block;background:var(--signal-tint);border:1px solid rgba(57,211,187,.25);color:var(--signal);font-size:13px;font-weight:700;padding:7px 13px;border-radius:8px;margin-bottom:16px;}
.v5-tc-quote{font-size:13.5px;color:var(--ink-soft);line-height:1.8;margin-bottom:18px;}
.v5-tc-auth{display:flex;align-items:center;gap:11px;padding-top:15px;border-top:1px solid var(--line);}
.v5-tc-av{width:36px;height:36px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:#fff;background:linear-gradient(135deg,var(--signal),var(--purple));}
.v5-tc-name{font-size:13px;font-weight:700;color:var(--ink);}
.v5-tc-biz{font-size:11.5px;color:var(--ink-faint);}

/* FOUNDER */
.v5-founder-card{background:var(--s1);border:1px solid var(--line2);border-radius:18px;padding:clamp(28px,4vw,48px);position:relative;max-width:820px;margin:0 auto;}
.v5-founder-qmark{font-size:64px;line-height:.8;color:rgba(57,211,187,.12);margin-bottom:8px;display:block;font-family:var(--display);}
.v5-founder-body{font-size:14.5px;color:var(--ink-soft);line-height:1.95;margin-bottom:28px;}
.v5-founder-body strong{color:var(--ink);font-weight:700;}
.v5-founder-body em{font-style:italic;color:var(--signal);}
.v5-founder-hl{display:block;background:var(--warn-tint);border-left:2px solid var(--warn);padding:11px 15px;border-radius:0 8px 8px 0;margin:12px 0;font-size:14px;color:var(--ink);font-style:normal;}
.v5-founder-profile{display:flex;align-items:center;gap:14px;padding-top:22px;border-top:1px solid var(--line);}
.v5-founder-av{width:44px;height:44px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,var(--signal),var(--purple));display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;color:#fff;}
.v5-founder-name{font-size:14px;font-weight:700;color:var(--ink);}
.v5-founder-role{font-size:12px;color:var(--ink-faint);margin-top:1px;}

/* PRICING */
.v5-pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;align-items:start;margin-top:48px;}
.v5-plan{background:var(--s1);border:1px solid var(--line);border-radius:16px;padding:clamp(24px,3vw,32px) clamp(20px,3vw,26px);position:relative;}
.v5-plan.pop{border-color:rgba(57,211,187,.4);box-shadow:var(--shadow-lift);}
.v5-plan-badge{position:absolute;top:-1px;left:24px;transform:translateY(-50%);background:var(--signal);color:#fff;font-size:10.5px;font-weight:800;padding:3px 12px;border-radius:100px;}
.v5-plan-tier{font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--ink-faint);margin-bottom:5px;}
.v5-plan-tag{font-size:12.5px;color:var(--ink-faint);margin-bottom:18px;}
.v5-plan-price{display:flex;align-items:baseline;gap:2px;margin-bottom:3px;}
.v5-plan-rs{font-size:16px;font-weight:700;color:var(--ink);}
.v5-plan-amt{font-family:var(--mono);font-size:clamp(36px,4.5vw,44px);font-weight:500;color:var(--ink);letter-spacing:-.02em;}
.v5-plan.pop .v5-plan-amt,.v5-plan.pop .v5-plan-rs{color:var(--signal);}
.v5-plan-mo{font-size:11.5px;color:var(--ink-faint);margin-bottom:16px;}
.v5-plan-hr{border:none;border-top:1px solid var(--line);margin:14px 0;}
.v5-plan-list{list-style:none;display:flex;flex-direction:column;gap:9px;margin-bottom:22px;}
.v5-plan-list li{display:flex;align-items:flex-start;gap:8px;font-size:12.5px;color:var(--ink-soft);}
.v5-plan-list li svg{color:var(--signal);flex-shrink:0;margin-top:2px;}
.v5-plan-list li.exc{color:var(--ink-faint);text-decoration:line-through;}
.v5-plan-btn{display:block;text-align:center;padding:12px;border-radius:9px;font-weight:700;font-size:13.5px;text-decoration:none;transition:all .2s;}
.v5-plan-btn.go{background:var(--signal);color:#fff;}
.v5-plan-btn.go:hover{background:var(--signal-deep);box-shadow:0 8px 24px rgba(57,211,187,.3);}
.v5-plan-btn.out{background:transparent;color:var(--ink);border:1px solid var(--line2);}
.v5-plan-btn.out:hover{border-color:var(--signal);color:var(--signal);}

/* FAQ */
.v5-faq-box{max-width:700px;margin:48px auto 0;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--s1);}
.v5-fi{border-bottom:1px solid var(--line);}
.v5-fi:last-child{border-bottom:none;}
.v5-fb{width:100%;background:none;border:none;padding:18px 22px;text-align:left;font-size:14px;font-weight:600;color:var(--ink);cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:12px;font-family:inherit;}
.v5-fb:hover{background:rgba(255,255,255,.015);}
.v5-fp{width:22px;height:22px;border-radius:50%;background:var(--s2);display:flex;align-items:center;justify-content:center;font-size:14px;color:var(--ink-faint);flex-shrink:0;transition:all .2s;}
.v5-fa{padding:0 22px;font-size:13.5px;color:var(--ink-soft);line-height:1.8;max-height:0;overflow:hidden;transition:max-height .3s ease,padding .3s ease;}
.v5-fi.op .v5-fa{max-height:200px;padding:0 22px 18px;}
.v5-fi.op .v5-fp{background:var(--signal-tint);color:var(--signal);transform:rotate(45deg);}

/* CTA */
.v5-cta-sec{padding:clamp(72px,9vw,112px) clamp(20px,4vw,48px);text-align:center;position:relative;}
.v5-cta-card{max-width:720px;margin:0 auto;position:relative;background:var(--s1);border:1px solid rgba(57,211,187,.3);border-radius:20px;padding:clamp(40px,5vw,72px) clamp(24px,4vw,56px);}
.v5-cta-h{font-family:var(--display);font-weight:800;font-size:clamp(26px,3.6vw,42px);color:var(--ink);line-height:1.15;letter-spacing:-.03em;margin-bottom:16px;}
.v5-cta-h em{font-style:italic;color:var(--signal);}
.v5-cta-p{font-size:14.5px;color:var(--ink-soft);margin-bottom:30px;line-height:1.8;max-width:440px;margin-left:auto;margin-right:auto;}
.v5-cta-btns{display:flex;align-items:center;justify-content:center;gap:11px;flex-wrap:wrap;}
.v5-cta-note{margin-top:16px;font-size:11.5px;color:var(--ink-faint);}

/* FOOTER */
.v5-footer{background:var(--s1);border-top:1px solid var(--line);padding:clamp(44px,6vw,60px) clamp(20px,4vw,48px) 28px;}
.v5-ft{max-width:1200px;margin:0 auto;}
.v5-ft-top{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:clamp(24px,4vw,48px);margin-bottom:40px;}
.v5-ft-tagline{font-size:12.5px;color:var(--ink-faint);line-height:1.8;margin-top:14px;max-width:260px;}
.v5-ft-hd{font-size:10px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;color:var(--ink-faint);margin-bottom:13px;}
.v5-ft-lks{list-style:none;display:flex;flex-direction:column;gap:9px;}
.v5-ft-lks a{font-size:13px;color:var(--ink-soft);text-decoration:none;}
.v5-ft-lks a:hover{color:var(--signal);}
.v5-ft-bot{padding-top:20px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;font-size:11.5px;color:var(--ink-faint);flex-wrap:wrap;gap:8px;}

@media(max-width:860px){
  .v5-nmid,.v5-signin{display:none;}
  .v5-hbg{display:flex;}
  .v5-hero{padding-top:100px;min-height:auto;}
  .v5-hero-in{grid-template-columns:1fr;gap:36px;}
  .v5-float-chip{display:none;}
  .v5-stats-row{grid-template-columns:1fr;}
  .v5-stat-cell{border-right:none;border-bottom:1px solid var(--line);}
  .v5-stat-cell:last-child{border-bottom:none;}
  .v5-pain-grid{grid-template-columns:1fr;}
  .v5-loss-item{grid-template-columns:1fr;gap:10px;padding:18px 0 18px 24px;}
  .v5-loss-time{text-align:left;}
  .v5-module,.v5-module.rev{grid-template-columns:1fr;gap:24px;}
  .v5-module.rev .v5-module-text{order:1;}
  .v5-module.rev .v5-module-visual{order:2;}
  .v5-demo-layout{grid-template-columns:1fr;}
  .v5-demo-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;}
  .v5-rev-viz{grid-template-columns:1fr;}
  .v5-rev-arrow{flex-direction:row;justify-content:center;}
  .v5-rev-arrow-line{width:28px;height:1px;}
  .v5-test-grid{grid-template-columns:1fr;}
  .v5-pgrid{grid-template-columns:1fr;}
  .v5-ft-top{grid-template-columns:1fr;}
}
@media(min-width:861px) and (max-width:1140px){
  .v5-nmid,.v5-signin{display:none;}
  .v5-hbg{display:flex;}
  .v5-hero-in{grid-template-columns:1fr 380px;}
}
      `}</style>

      {/* NAV */}
      <nav className={`v5-nav${scrolled ? " sc" : ""}`}>
        <a href="/" className="v5-logo">
          <img src="/logo.png" alt="Fastrill" className="v5-logo-img" />
          <span className="v5-logo-text">fast<em>rill</em></span>
        </a>
        <ul className="v5-nmid">
          {[["#pain", "Problem"], ["#how", "Product"], ["#demo", "Demo"], ["#pricing", "Pricing"]].map(([h, l]) => (
            <li key={h}><a href={h}>{l}</a></li>
          ))}
        </ul>
        <div className="v5-nr">
          <a href="/login" className="v5-signin">Sign in</a>
          <a href="/signup" className="v5-cta-nav">Start free</a>
          <button className="v5-hbg" onClick={() => setMobOpen((p) => !p)}>≡</button>
        </div>
      </nav>
      <div className={`v5-mdraw${mobOpen ? " open" : ""}`}>
        {[["#pain", "Problem"], ["#how", "Product"], ["#demo", "Demo"], ["#pricing", "Pricing"]].map(([h, l]) => (
          <a key={h} href={h} onClick={() => setMobOpen(false)}>{l}</a>
        ))}
        <a href="/login" onClick={() => setMobOpen(false)}>Sign in</a>
      </div>

      {/* HERO */}
      <section className="v5-hero">
        <div className="v5-hero-grid" />
        <div className="v5-hero-in">
          <div>
            <div className="v5-eyebrow"><span className="v5-eyebrow-dot" />AI revenue engine for Indian service businesses</div>
            <h1 className="v5-h1">You're not losing leads.</h1>
            <span className="v5-h1-line2">You're losing them <em>after they message you.</em></span>
            <div className="v5-sub">
              <span className="v5-sub-line">Every lead on WhatsApp is real money.</span>
              <span className="v5-sub-line">Most businesses reply in <strong>hours</strong> — or never.</span>
              <span className="v5-sub-line">Fastrill replies in <strong>under 2 seconds.</strong> Books the appointment. Confirmed.</span>
            </div>
            <div className="v5-hero-btns">
              <a href="/signup" className="v5-btn-primary">Start free <Icon name="arrow" size={15} /></a>
              <a href="#demo" className="v5-btn-secondary"><Icon name="play" size={14} /> See it live</a>
            </div>
            <div className="v5-trust-mini">
              <div className="v5-mini-avs">
                {["P", "R", "S", "A"].map((c, i) => (<span key={i} className="v5-mini-av" style={{ zIndex: 4 - i }}>{c}</span>))}
              </div>
              <span>80+ businesses already converting more leads</span>
            </div>
          </div>

          <div className="v5-phone-wrap">
            <div className="v5-float-chip v5-chip-1"><span className="v5-chip-ico"><Icon name="check" size={11} /></span>Appointment booked</div>
            <div className="v5-float-chip v5-chip-2"><span className="v5-chip-ico"><Icon name="check" size={11} /></span>Lead recovered</div>
            <div className="v5-phone">
              <div className="v5-phone-top">
                <div className="v5-phone-av">R</div>
                <div>
                  <div className="v5-phone-name">Riya Salon</div>
                  <div className="v5-phone-status">Fastrill AI · Online now</div>
                </div>
              </div>
              <div className="v5-phone-body">
                {DEMOS.booking.map((m, i) => (
                  <div key={i} className={`v5-pm ${m.r}`}>{m.m}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <div className="v5-trust">
        {[["256-bit encrypted"], ["India servers"], ["2-sec response"], ["10+ languages"], ["4.9/5 rating"]].map(([t], i, arr) => (
          <span key={t} style={{ display: "flex", alignItems: "center", gap: "inherit" }}>
            <span className="v5-tbadge">{t}</span>
            {i < arr.length - 1 && <span className="v5-tdiv" />}
          </span>
        ))}
      </div>

      {/* STATS */}
      <div className="v5-stats" ref={statsRef}>
        <div className="v5-stats-row">
          {[
            { n: counts.a.toLocaleString("en-IN"), s: "+", l: "Bookings automated monthly", d: "across active businesses" },
            { n: counts.b, s: "%", l: "Faster than human reply", d: "average 1.8-second response" },
            { n: counts.c, s: "%", l: "Fewer missed leads", d: "in the first 30 days" },
          ].map((s, i) => (
            <div key={i} className="v5-stat-cell v5-fade">
              <div className="v5-stat-n">{s.n}<em>{s.s}</em></div>
              <div className="v5-stat-l">{s.l}</div>
              <div className="v5-stat-s">{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* LOSS TIMELINE */}
      <section className="v5-sec">
        <div className="v5-w">
          <div className="v5-fade" style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
            <div className="v5-label" style={{ justifyContent: "center" }}>The silent cost</div>
            <h2 className="v5-h2">What happens when you don't reply instantly?</h2>
            <p className="v5-p">A real scenario. A real loss.</p>
          </div>
          <div className="v5-loss-timeline v5-fade">
            {[
              { time: "9:02 PM", event: "Customer messages you", desc: "Ready to book. Service: keratin treatment. Budget: ₹2,800", icon: "globe" },
              { time: "9:45 PM", event: "You finally reply", desc: "Too late — they already asked your competitor.", icon: "frown" },
              { time: "10:12 PM", event: "Customer booked elsewhere", desc: "Your competitor replied in 2 minutes.", icon: "x" },
              { time: "—", event: "Your loss", desc: "₹2,800 + lifetime value + reviews = ₹12,000+", icon: "frown", hl: true },
            ].map((item, i) => (
              <div key={i} className={`v5-loss-item${item.hl ? " hl" : ""}`}>
                <div className="v5-loss-time">{item.time}</div>
                <div className="v5-loss-content">
                  <div className="v5-loss-ico"><Icon name={item.icon} size={15} /></div>
                  <div>
                    <div className="v5-loss-event">{item.event}</div>
                    <div className="v5-loss-desc">{item.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="v5-fade" style={{ textAlign: "center", marginTop: 40 }}>
            <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 20 }}>
              This happens <strong style={{ color: "var(--warn)" }}>thousands of times every month</strong> across Indian businesses.
            </p>
            <a href="/signup" className="v5-btn-primary">Stop the bleeding <Icon name="arrow" size={15} /></a>
          </div>
        </div>
      </section>

      {/* PAIN */}
      <section className="v5-sec alt" id="pain">
        <div className="v5-w">
          <div className="v5-fade" style={{ maxWidth: 580 }}>
            <div className="v5-label">The real problem</div>
            <h2 className="v5-h2">Your ads are working.<br /><em>Your follow-up isn't.</em></h2>
            <p className="v5-p">Most businesses spend thousands getting leads to message them. The money walks out in the WhatsApp inbox.</p>
          </div>
          <div className="v5-pain-grid">
            {[
              { n: "01", icon: "moon", title: "Leads die after hours.", desc: "A customer messages at 10 PM about your bridal package. You see it at 9 AM — she's already booked someone who replied in 2 minutes.", tag: "Revenue lost every night" },
              { n: "02", icon: "bolt", title: "Speed wins the booking.", desc: "Your competitor replies in 2 seconds. You reply in 2 hours. Same service, same price — they win the appointment every time.", tag: "Competitive loss" },
              { n: "03", icon: "frown", title: "Silence becomes a bad review.", desc: "An upset customer messages at peak hour. Your staff is busy. Fastrill responds in 2 seconds with genuine empathy — before it reaches Google.", tag: "Reputation at risk" },
            ].map((p) => (
              <div key={p.n} className="v5-pain-card v5-fade">
                <div className="v5-pain-num">{p.n}</div>
                <div className="v5-pain-ico"><Icon name={p.icon} size={17} /></div>
                <div className="v5-pain-title">{p.title}</div>
                <p className="v5-pain-desc">{p.desc}</p>
                <div className="v5-pain-tag">{p.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section className="v5-sec" id="how">
        <div className="v5-w">
          <div className="v5-fade">
            <div className="v5-label">What's inside</div>
            <h2 className="v5-h2">Not a chatbot.<br /><em>A revenue system.</em></h2>
            <p className="v5-p" style={{ maxWidth: 480 }}>Three modules working together — conversation, campaigns and bookings, all in one dashboard.</p>
          </div>

          <div className="v5-module">
            <div className="v5-module-text v5-fade">
              <div className="v5-module-tag">Booking</div>
              <h3 className="v5-module-title">Books the appointment, start to finish.</h3>
              <p className="v5-module-desc">Service, date, time, confirmation — collected in order, checked against real availability, and confirmed without a human touching it.</p>
              <ul className="v5-module-list">
                <li><Icon name="check" size={14} />Understands casual, mixed-language messages</li>
                <li><Icon name="check" size={14} />Checks real slot availability before confirming</li>
                <li><Icon name="check" size={14} />Notifies the owner the moment it's booked</li>
              </ul>
            </div>
            <div className="v5-module-visual v5-fade">
              <div className="v5-wa-mock">
                <div className="v5-wa-head">
                  <div className="v5-wa-av">R</div>
                  <div><div className="v5-wa-name">Riya Salon</div><div className="v5-wa-st">Fastrill AI · Online</div></div>
                </div>
                <div className="v5-wa-body">
                  <div className="v5-wm c">Hi, I want a haircut tomorrow around 3pm</div>
                  <div className="v5-wm a">{"Tomorrow's great — 3 PM is available.\n\nShall I confirm Haircut for tomorrow at 3:00 PM?"}</div>
                  <div className="v5-wm c">Yes please!</div>
                  <div className="v5-wm a">{"Booking confirmed.\n\nHaircut · Tomorrow · 3:00 PM"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="v5-module rev">
            <div className="v5-module-text v5-fade">
              <div className="v5-module-tag">Campaigns</div>
              <h3 className="v5-module-title">See exactly what each campaign earned.</h3>
              <p className="v5-module-desc">Send approved WhatsApp templates to customer segments, and track delivery, replies and revenue attributed to that exact send.</p>
              <ul className="v5-module-list">
                <li><Icon name="check" size={14} />Segment by tag — new, returning, VIP, inactive</li>
                <li><Icon name="check" size={14} />Real Meta delivery and read tracking</li>
                <li><Icon name="check" size={14} />Revenue and ROI per campaign, not just opens</li>
              </ul>
            </div>
            <div className="v5-module-visual v5-fade">
              <div className="v5-mock-dash">
                <div className="v5-mock-bar"><span className="v5-mock-dot" /><span className="v5-mock-dot" /><span className="v5-mock-dot" /></div>
                <div className="v5-mock-body">
                  <div className="v5-mock-title">Winter offer — January</div>
                  <div className="v5-mock-stat-row">
                    <div><div className="v5-mock-stat-label">Sent</div><div className="v5-mock-stat-val">412</div></div>
                    <div><div className="v5-mock-stat-label">Delivered</div><div className="v5-mock-stat-val">404</div></div>
                    <div><div className="v5-mock-stat-label">Replied</div><div className="v5-mock-stat-val s">138</div></div>
                  </div>
                  <div className="v5-mock-roi">
                    <div className="v5-mock-roi-row"><span>Est. bookings</span><strong>82</strong></div>
                    <div className="v5-mock-roi-row"><span>Est. revenue</span><strong>₹98,400</strong></div>
                    <div className="v5-mock-roi-row"><span>ROI</span><strong className="s">+612%</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="v5-module">
            <div className="v5-module-text v5-fade">
              <div className="v5-module-tag">Inbox</div>
              <h3 className="v5-module-title">One inbox. Every conversation, every customer.</h3>
              <p className="v5-module-desc">See every conversation live, take over manually whenever you want, and let the AI pick back up the moment you're done.</p>
              <ul className="v5-module-list">
                <li><Icon name="check" size={14} />Toggle AI off for any single conversation</li>
                <li><Icon name="check" size={14} />Full customer history and tags in one view</li>
                <li><Icon name="check" size={14} />Works across 10+ Indian languages</li>
              </ul>
            </div>
            <div className="v5-module-visual v5-fade">
              <div className="v5-mock-inbox">
                {[
                  { n: "Priya Nair", m: "Yes please, book me for 3 PM", t: "now", on: true },
                  { n: "Arjun Mehta", m: "Do you have dermatology also", t: "2m", on: true },
                  { n: "Sneha Reddy", m: "Thank you so much!", t: "14m", on: false },
                ].map((c) => (
                  <div key={c.n} className="v5-inbox-row">
                    <div className="v5-inbox-av">{c.n.charAt(0)}</div>
                    <div className="v5-inbox-mid">
                      <div className="v5-inbox-name">{c.n}</div>
                      <div className="v5-inbox-msg">{c.m}</div>
                    </div>
                    <div className="v5-inbox-right">
                      <div className="v5-inbox-time">{c.t}</div>
                      <div className={`v5-ai-pill${c.on ? " on" : ""}`}>{c.on ? "AI on" : "Manual"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section className="v5-sec alt" id="demo">
        <div className="v5-w">
          <div className="v5-fade">
            <div className="v5-label">Live demo</div>
            <h2 className="v5-h2">See how a real customer gets<br /><em>converted in seconds.</em></h2>
            <p className="v5-p" style={{ maxWidth: 480 }}>Click a scenario — instant replies, any language, any context.</p>
          </div>
          <div className="v5-demo-layout">
            <div className="v5-demo-tabs v5-fade">
              {DEMO_META.map((s) => (
                <div key={s.k} className={`v5-demo-tab${demoKey === s.k ? " on" : ""}`} onClick={() => setDemoKey(s.k)}>
                  <div className="v5-dt-label">{s.label}</div>
                  <div className="v5-dt-sub">{s.sub}</div>
                </div>
              ))}
            </div>
            <div className="v5-wa-mock v5-fade">
              <div className="v5-wa-head">
                <div className="v5-wa-av">R</div>
                <div><div className="v5-wa-name">Riya Salon</div><div className="v5-wa-st">Fastrill AI · Online</div></div>
              </div>
              <div className="v5-wa-body" ref={demoRef}>
                {demoMsgs.map((m, i) => (<div key={i} className={`v5-wm ${m.r}`}>{m.m}</div>))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REVENUE BEFORE/AFTER */}
      <section className="v5-sec">
        <div className="v5-w">
          <div className="v5-fade" style={{ textAlign: "center" }}>
            <div className="v5-label" style={{ justifyContent: "center" }}>The difference</div>
            <h2 className="v5-h2">Before Fastrill.<br /><em>After Fastrill.</em></h2>
            <p className="v5-p" style={{ maxWidth: 400, margin: "0 auto" }}>Two businesses. Same ads. Same leads. Different results.</p>
          </div>
          <div className="v5-rev-viz v5-fade">
            <div className="v5-rev-col">
              <div className="v5-rev-col-label bad"><Icon name="x" size={12} /> Without Fastrill</div>
              {[
                ["Reply in 8 hours", "Lead already booked elsewhere"],
                ["No reply after hours", "₹300 ad spend, zero return"],
                ["Complaint ignored", "Google review: 2 stars"],
                ["No visibility", "No idea which leads converted"],
              ].map(([t, s]) => (
                <div key={t} className="v5-rev-item">
                  <div className="v5-rev-ico bad"><Icon name="x" size={13} /></div>
                  <div><div className="v5-rev-item-t">{t}</div><div className="v5-rev-item-s">{s}</div></div>
                </div>
              ))}
            </div>
            <div className="v5-rev-arrow">
              <div className="v5-rev-arrow-line" /><div className="v5-rev-arrow-ico"><Icon name="arrow" size={14} /></div><div className="v5-rev-arrow-line" />
            </div>
            <div className="v5-rev-col after">
              <div className="v5-rev-col-label good"><Icon name="check" size={12} /> With Fastrill</div>
              {[
                ["Reply in 2 seconds", "Lead booked before competitor opens"],
                ["Books at 2 AM", "You wake up to confirmed appointments"],
                ["Complaint resolved instantly", "Customer retained, crisis avoided"],
                ["Full revenue dashboard", "Every booking tracked to source"],
              ].map(([t, s]) => (
                <div key={t} className="v5-rev-item">
                  <div className="v5-rev-ico good"><Icon name="check" size={13} /></div>
                  <div><div className="v5-rev-item-t">{t}</div><div className="v5-rev-item-s">{s}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="v5-sec alt">
        <div className="v5-w">
          <div className="v5-fade" style={{ textAlign: "center" }}>
            <div className="v5-label" style={{ justifyContent: "center" }}>Results</div>
            <h2 className="v5-h2">Real revenue from<br /><em>real Indian businesses</em></h2>
          </div>
          <div className="v5-test-grid">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="v5-tc v5-fade">
                <div className="v5-tc-result">{t.result}</div>
                <p className="v5-tc-quote">"{t.quote}"</p>
                <div className="v5-tc-auth">
                  <div className="v5-tc-av">{t.name.charAt(0)}</div>
                  <div><div className="v5-tc-name">{t.name}</div><div className="v5-tc-biz">{t.biz}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOUNDER */}
      <section className="v5-sec">
        <div className="v5-w">
          <div className="v5-fade" style={{ textAlign: "center", marginBottom: 36 }}>
            <div className="v5-label" style={{ justifyContent: "center" }}>Why we built this</div>
            <h2 className="v5-h2">The story behind <em>Fastrill</em></h2>
          </div>
          <div className="v5-founder-card v5-fade">
            <span className="v5-founder-qmark">"</span>
            <p className="v5-founder-body">
              I've spent years in digital marketing — running ads, building funnels, optimising campaigns for businesses across India. Every lead costs money. Real money.<br /><br />
              And yet, the single most common thing I saw across <strong>every single client</strong> — salons, clinics, gyms, coaching centres — was this:<br /><br />
              <em className="v5-founder-hl">Leads were arriving. And dying in the WhatsApp inbox.</em><br /><br />
              A customer messages at 10 PM, ready to book. Nobody replies until morning. By then, they've moved on. You spent ₹300 on that click. It just evaporated.<br /><br />
              I saw a salon owner in Hyderabad spending <strong>₹40,000/month on Instagram ads</strong>. Almost 60% of the leads who messaged never got a reply within the hour. Not because of bad ads — because of slow replies.<br /><br />
              <strong>The problem was never the ads. It was always the follow-up.</strong><br /><br />
              So we built Fastrill — not as another chatbot, but as a revenue recovery system that sits between your ad spend and your bank account, and makes sure every lead gets an instant reply, in their language, at any hour.
            </p>
            <div className="v5-founder-profile">
              <div className="v5-founder-av">G</div>
              <div>
                <div className="v5-founder-name">Ganapathi</div>
                <div className="v5-founder-role">Founder, Fastrill — Solvabil Pvt. Ltd.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="v5-sec alt" id="pricing">
        <div className="v5-w">
          <div className="v5-fade" style={{ textAlign: "center" }}>
            <div className="v5-label" style={{ justifyContent: "center" }}>Pricing</div>
            <h2 className="v5-h2">Simple pricing.<br /><em>Pays for itself.</em></h2>
            <p className="v5-p" style={{ maxWidth: 400, margin: "0 auto" }}>No per-message fees. Flat monthly.</p>
          </div>
          <div className="v5-pgrid">
            {[
              { tier: "Starter", price: "999", tag: "Solo operators & new businesses", cta: "Get started", cs: "out", feats: [["inc", "1 WhatsApp number"], ["inc", "300 AI conversations / month"], ["inc", "Booking automation"], ["exc", "Lead recovery"], ["exc", "WhatsApp campaigns"]] },
              { tier: "Growth", price: "1,999", tag: "For growing businesses", cta: "Start free trial", cs: "go", pop: true, feats: [["inc", "1 WhatsApp number"], ["inc", "Unlimited conversations"], ["inc", "Customer memory"], ["inc", "Lead recovery"], ["inc", "WhatsApp campaigns"]] },
              { tier: "Pro", price: "4,999", tag: "Multi-branch teams", cta: "Contact sales", cs: "out", feats: [["inc", "Up to 5 WhatsApp numbers"], ["inc", "Everything in Growth"], ["inc", "Multi-branch management"], ["inc", "Custom AI playbook"], ["inc", "Dedicated onboarding"]] },
            ].map((plan) => (
              <div key={plan.tier} className={`v5-plan v5-fade${plan.pop ? " pop" : ""}`}>
                {plan.pop && <div className="v5-plan-badge">Most popular</div>}
                <div className="v5-plan-tier">{plan.tier}</div>
                <div className="v5-plan-tag">{plan.tag}</div>
                <div className="v5-plan-price"><span className="v5-plan-rs">₹</span><span className="v5-plan-amt">{plan.price}</span></div>
                <div className="v5-plan-mo">per month + GST</div>
                <hr className="v5-plan-hr" />
                <ul className="v5-plan-list">
                  {plan.feats.map(([c, t]) => (<li key={t} className={c}>{c === "inc" ? <Icon name="check" size={14} /> : <Icon name="x" size={14} />}{t}</li>))}
                </ul>
                <a href="/signup" className={`v5-plan-btn ${plan.cs}`}>{plan.cta}</a>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", marginTop: 24, fontSize: 12.5, color: "var(--ink-faint)" }}>14-day free trial · No credit card · Cancel anytime</p>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection />

      {/* CTA */}
      <section className="v5-cta-sec">
        <div className="v5-cta-card v5-fade">
          <h2 className="v5-cta-h">Turn every WhatsApp conversation into <em>revenue.</em></h2>
          <p className="v5-cta-p">Start automating replies, recovering leads, and booking customers today.</p>
          <div className="v5-cta-btns">
            <a href="/signup" className="v5-btn-primary">Start free — no card needed <Icon name="arrow" size={15} /></a>
            <a href="https://wa.me/916309279265" className="v5-btn-secondary">Message us on WhatsApp</a>
          </div>
          <p className="v5-cta-note">14-day free trial · Setup in 10 minutes · Cancel anytime</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="v5-footer">
        <div className="v5-ft">
          <div className="v5-ft-top">
            <div>
              <a href="/" className="v5-logo">
                <img src="/logo.png" alt="Fastrill" className="v5-logo-img" />
                <span className="v5-logo-text">fast<em>rill</em></span>
              </a>
              <p className="v5-ft-tagline">AI-powered WhatsApp automation for Indian service businesses. Built by Solvabil Pvt. Ltd.</p>
            </div>
            {[
              { h: "Product", lks: [["How it works", "#how"], ["Pricing", "#pricing"], ["Demo", "#demo"]] },
              { h: "Company", lks: [["Our story", "#"], ["Contact", "mailto:team@fastrill.com"], ["Call us", "tel:+916309279265"]] },
              { h: "Legal", lks: [["Privacy", "/privacy"], ["Terms", "/terms"]] },
            ].map((col) => (
              <div key={col.h}>
                <div className="v5-ft-hd">{col.h}</div>
                <ul className="v5-ft-lks">{col.lks.map(([n, h]) => (<li key={n}><a href={h}>{n}</a></li>))}</ul>
              </div>
            ))}
          </div>
          <div className="v5-ft-bot">
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
    <section className="v5-sec">
      <div className="v5-w">
        <div className="v5-fade" style={{ textAlign: "center" }}>
          <div className="v5-label" style={{ justifyContent: "center" }}>FAQ</div>
          <h2 className="v5-h2">Honest answers</h2>
        </div>
        <div className="v5-faq-box v5-fade">
          {faqs.map((f, i) => (
            <div key={i} className={`v5-fi${open === i ? " op" : ""}`}>
              <button className="v5-fb" onClick={() => setOpen(open === i ? null : i)}>{f.q}<span className="v5-fp">+</span></button>
              <div className="v5-fa">{f.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
