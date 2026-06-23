"use client"

import { useState, useEffect, useRef } from "react"

const DEMOS = {
  booking: [
    { r: "c", m: "Hi, I want a haircut tomorrow around 3pm" },
    { r: "a", m: "Tomorrow works — 3 PM is available!\n\nShall I confirm Haircut for tomorrow at 3:00 PM?" },
    { r: "c", m: "Yes please!" },
    { r: "a", m: "Done! Booking confirmed.\n\nHaircut · Tomorrow · 3:00 PM\n\nSee you then!" },
  ],
  hindi: [
    { r: "c", m: "Bhai facial karwa sakte hai kal?" },
    { r: "a", m: "Haan bilkul!\n\nFacial ₹1,200 (60 min).\n\nKis time aana chahenge?" },
    { r: "c", m: "Shaam 6 baje" },
    { r: "a", m: "Done! Booking confirmed.\n\nFacial · ₹1,200\nKal · 6:00 PM\n\nMilenge!" },
  ],
  winback: [
    { r: "a", m: "Hi Anita — it's been a while since your last visit.\n\nYour favourite keratin treatment is available this week — 10% off. Interested?" },
    { r: "c", m: "Oh yes! What's the price?" },
    { r: "a", m: "Keratin Treatment — ₹2,520 (was ₹2,800).\nWhen works for you?" },
    { r: "c", m: "Saturday morning" },
    { r: "a", m: "Booked!\n\nKeratin Treatment · ₹2,520\nSaturday · 10:00 AM" },
  ],
}

const DEMO_TABS = [
  { k: "booking", label: "Instant booking", sub: "4 messages, done" },
  { k: "hindi", label: "Hindi auto-reply", sub: "Language detected" },
  { k: "winback", label: "Win-back campaign", sub: "Re-engage & book" },
]

const TESTIMONIALS = [
  { name: "Priya Nair", role: "Glow Parlour, Hyderabad", stat: "+43%", statLabel: "more bookings", quote: "Customers book at midnight now. It paid for itself in the first week." },
  { name: "Dr. Ravi Sharma", role: "Skin First Clinic, Vijayawada", stat: "₹22k", statLabel: "saved monthly", quote: "Patients message in Telugu, AI replies in Telugu. I had to see it to believe it." },
  { name: "Sneha Reddy", role: "Studio S, Bangalore", stat: "0", statLabel: "missed messages", quote: "Two branches, both inboxes handled at once. Staff focuses on the customer in front of them." },
]

export default function Landing() {
  const [scrolled, setScrolled] = useState(false)
  const [mobNav, setMobNav] = useState(false)
  const [demoKey, setDemoKey] = useState("booking")
  const [demoMsgs, setDemoMsgs] = useState([])
  const [billing, setBilling] = useState("monthly")
  const [tIdx, setTIdx] = useState(0)
  const [faq, setFaq] = useState(null)
  const chatRef = useRef(null)
  const tmr = useRef(null)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  useEffect(() => {
    setDemoMsgs([])
    clearTimeout(tmr.current)
    DEMOS[demoKey].forEach((m, i) => {
      tmr.current = setTimeout(() => {
        setDemoMsgs(p => [...p, m])
        if (chatRef.current) chatRef.current.scrollTop = 9999
      }, 350 + i * 800)
    })
    return () => clearTimeout(tmr.current)
  }, [demoKey])

  useEffect(() => {
    const io = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("_in"); io.unobserve(e.target) } }),
      { threshold: 0.05, rootMargin: "0px 0px -40px 0px" }
    )
    document.querySelectorAll("._a").forEach((el) => {
      const sibs = Array.from(el.parentElement?.querySelectorAll(":scope>._a") || [])
      el.style.transitionDelay = Math.min(sibs.indexOf(el) * 0.07, 0.35) + "s"
      io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  const FAQS = [
    ["Do I need a new WhatsApp number?", "No. Fastrill connects to your existing WhatsApp Business number via Meta's official API."],
    ["How long does setup take?", "10 minutes. Connect WhatsApp, add services and hours, go live."],
    ["Which languages work?", "Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, English — auto-detected."],
    ["Can I reply manually?", "Yes. Toggle AI off for any conversation. Toggle back when you're done."],
    ["Is there a free trial?", "14 days, full Growth plan, no credit card."],
  ]

  return (
    <>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:#08080c;color:#94949e;font-family:'Instrument Sans','Inter',system-ui,-apple-system,sans-serif;font-size:16px;line-height:1.65;-webkit-font-smoothing:antialiased;overflow-x:hidden}

:root{
  --w:#f0f0f5;--w2:#cdcdd6;--w3:#94949e;--w4:#5a5a66;--w5:#38383f;
  --d1:#08080c;--d2:#0e0e14;--d3:#14141c;--d4:#1a1a24;--d5:#22222e;
  --line:rgba(255,255,255,.06);--line2:rgba(255,255,255,.1);
  --accent:#7c5cfc;--accent2:#9b7eff;--accent-g:linear-gradient(135deg,#7c5cfc,#c084fc);
  --amber:#f5a623;--amber-t:rgba(245,166,35,.08);
  --red:#ef4444;--red-t:rgba(239,68,68,.06);
  --green:#22c55e;--green-t:rgba(34,197,94,.08);
  --hd:'Space Grotesk','Instrument Sans',sans-serif;
  --mono:'JetBrains Mono',monospace;
  --r:10px;--r2:14px;--r3:20px;
}

._a{opacity:0;transform:translateY(20px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}
._a._in{opacity:1;transform:none}

/* GRAIN */
body::after{content:'';position:fixed;inset:0;z-index:9999;pointer-events:none;opacity:.025;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}

/* AURORA */
.aurora{position:fixed;top:0;left:0;right:0;height:100vh;pointer-events:none;z-index:0;overflow:hidden}
.aurora::before{content:'';position:absolute;top:-40%;left:-10%;width:70%;height:80%;background:radial-gradient(ellipse,rgba(124,92,252,.07),transparent 65%);filter:blur(60px)}
.aurora::after{content:'';position:absolute;top:-20%;right:-15%;width:50%;height:60%;background:radial-gradient(ellipse,rgba(192,132,252,.04),transparent 65%);filter:blur(60px)}

/* NAV */
.n{position:fixed;top:0;left:0;right:0;z-index:200;height:60px;display:flex;align-items:center;justify-content:space-between;padding:0 clamp(16px,4vw,48px);transition:all .2s}
.n.s{background:rgba(8,8,12,.88);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid var(--line)}
.n-logo{display:flex;align-items:center;gap:7px;text-decoration:none}
.n-logo img{width:22px;height:22px;object-fit:contain}
.n-logo b{font-family:var(--hd);font-weight:700;font-size:17px;color:var(--w);letter-spacing:-.03em}
.n-logo b em{background:var(--accent-g);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-style:normal}
.n-mid{display:flex;gap:2px;list-style:none}
.n-mid a{font-size:13px;font-weight:500;color:var(--w3);text-decoration:none;padding:6px 12px;border-radius:6px;transition:.15s}
.n-mid a:hover{color:var(--w)}
.n-r{display:flex;align-items:center;gap:6px}
.n-sign{font-size:13px;font-weight:500;color:var(--w3);text-decoration:none;padding:6px 12px}
.n-sign:hover{color:var(--w)}
.btn{display:inline-flex;align-items:center;gap:6px;font-weight:600;font-size:13px;border-radius:8px;text-decoration:none;border:none;cursor:pointer;font-family:inherit;transition:all .2s}
.btn-p{background:var(--accent);color:#fff;padding:8px 18px;box-shadow:0 0 24px rgba(124,92,252,.2),inset 0 1px 0 rgba(255,255,255,.1)}
.btn-p:hover{background:#6a4ce8;transform:translateY(-1px);box-shadow:0 0 32px rgba(124,92,252,.35)}
.btn-s{background:transparent;color:var(--w2);padding:8px 16px;border:1px solid var(--line2)}
.btn-s:hover{border-color:var(--accent);color:var(--accent2)}
.btn-l{padding:13px 28px;font-size:14px;border-radius:10px}
.hb{display:none;background:none;border:1px solid var(--line2);border-radius:6px;padding:5px 8px;color:var(--w3);cursor:pointer;font-size:15px;line-height:1}
.mob-d{position:fixed;top:60px;left:0;right:0;z-index:190;background:rgba(8,8,12,.97);backdrop-filter:blur(16px);border-bottom:1px solid var(--line);padding:8px 16px 16px;display:flex;flex-direction:column;gap:2px;transform:translateY(-120%);transition:transform .2s}
.mob-d.open{transform:none}
.mob-d a{color:var(--w3);text-decoration:none;font-size:14px;font-weight:500;padding:10px 12px;border-radius:8px}
@media(max-width:768px){.n-mid,.n-sign{display:none}.hb{display:flex;align-items:center}}

/* HERO */
.hero{min-height:100vh;display:flex;align-items:center;padding:130px clamp(16px,4vw,48px) 80px;position:relative;z-index:1}
.hero-i{max-width:1120px;margin:0 auto;width:100%}
.hero-tag{display:inline-flex;align-items:center;gap:8px;padding:4px 14px 4px 5px;border-radius:100px;border:1px solid rgba(124,92,252,.2);background:rgba(124,92,252,.06);font-size:11px;font-weight:600;color:var(--accent2);margin-bottom:32px;font-family:var(--mono)}
.hero-tag span{width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:0 0 8px var(--accent)}
.hero-h{font-family:var(--hd);font-weight:700;font-size:clamp(44px,7vw,80px);line-height:.94;letter-spacing:-.05em;color:var(--w);max-width:780px;margin-bottom:28px}
.hero-h .dim{color:var(--w4)}
.hero-h .hl{background:var(--accent-g);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero-row{display:grid;grid-template-columns:1fr 380px;gap:clamp(32px,5vw,56px);align-items:end}
.hero-p{font-size:clamp(15px,1.4vw,17px);color:var(--w3);line-height:1.8;max-width:440px;margin-bottom:32px}
.hero-p strong{color:var(--w);font-weight:600}
.hero-acts{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.hero-proof{margin-top:48px;display:flex;align-items:center;gap:16px}
.hero-proof-txt{font-size:12px;color:var(--w4);line-height:1.5}
.hero-proof-txt b{color:var(--w3);font-weight:600}
.hero-avs{display:flex}
.hero-avs i{width:30px;height:30px;border-radius:50%;border:2px solid var(--d1);margin-left:-9px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:9px;color:#fff;font-style:normal}
.hero-avs i:first-child{margin-left:0}

/* PHONE */
.ph{background:var(--d3);border:1px solid var(--line2);border-radius:var(--r3);overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.03) inset}
.ph-bar{background:var(--d4);border-bottom:1px solid var(--line);padding:10px 12px;display:flex;align-items:center;gap:8px}
.ph-av{width:26px;height:26px;border-radius:50%;background:var(--accent-g);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:9px;color:#fff;flex-shrink:0}
.ph-nm{font-size:11px;font-weight:700;color:var(--w)}
.ph-st{font-size:8.5px;color:var(--accent2);display:flex;align-items:center;gap:3px}
.ph-st::before{content:'';width:4px;height:4px;border-radius:50%;background:var(--accent)}
.ph-body{padding:10px;min-height:190px;display:flex;flex-direction:column;gap:5px}
.m{max-width:84%;padding:7px 10px;border-radius:10px;font-size:10.5px;line-height:1.5;white-space:pre-wrap;animation:mi .2s ease both}
.m.c{background:var(--accent);color:#fff;align-self:flex-end;border-radius:10px 3px 10px 10px;font-weight:500}
.m.a{background:var(--d4);border:1px solid var(--line2);color:var(--w2);align-self:flex-start;border-radius:3px 10px 10px 10px}
@keyframes mi{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}

@media(max-width:900px){.hero-row{grid-template-columns:1fr}}

/* NUMBERS */
.nums{border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:0 clamp(16px,4vw,48px)}
.nums-i{max-width:1120px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr)}
.num-c{padding:28px 0;text-align:center;border-right:1px solid var(--line)}
.num-c:last-child{border-right:none}
.num-v{font-family:var(--hd);font-size:clamp(24px,3vw,32px);font-weight:700;color:var(--w);margin-bottom:2px}
.num-v em{background:var(--accent-g);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-style:normal}
.num-l{font-size:11px;color:var(--w4)}
@media(max-width:640px){.nums-i{grid-template-columns:repeat(2,1fr)}.num-c:nth-child(2){border-right:none}}

/* SECTION */
.sec{padding:clamp(80px,10vw,120px) clamp(16px,4vw,48px);position:relative;z-index:1}
.sec.alt{background:var(--d2);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.sec-i{max-width:1120px;margin:0 auto}
.sec-lbl{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:var(--accent2);margin-bottom:12px}
.sec-h{font-family:var(--hd);font-weight:700;font-size:clamp(28px,3.8vw,44px);color:var(--w);letter-spacing:-.04em;line-height:1.1;margin-bottom:14px;max-width:580px}
.sec-h em{background:var(--accent-g);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-style:normal}
.sec-p{font-size:15px;color:var(--w3);line-height:1.75;max-width:480px}

/* BENTO */
.bento{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:auto auto;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:var(--r2);overflow:hidden;margin-top:48px}
.bento-c{background:var(--d1);padding:32px 28px;position:relative;overflow:hidden}
.bento-c.wide{grid-column:span 2}
.bento-ic{width:36px;height:36px;border-radius:8px;background:rgba(124,92,252,.08);border:1px solid rgba(124,92,252,.15);display:flex;align-items:center;justify-content:center;color:var(--accent2);margin-bottom:16px}
.bento-t{font-size:15px;font-weight:700;color:var(--w);margin-bottom:6px;font-family:var(--hd)}
.bento-d{font-size:12.5px;color:var(--w3);line-height:1.7}
.bento-stat{position:absolute;right:24px;bottom:20px;font-family:var(--mono);font-size:28px;font-weight:500;color:rgba(124,92,252,.12)}
@media(max-width:768px){.bento{grid-template-columns:1fr}.bento-c.wide{grid-column:span 1}}

/* MODULES */
.mod{display:grid;grid-template-columns:1fr 1fr;gap:clamp(32px,5vw,56px);align-items:center;padding:56px 0;border-bottom:1px solid var(--line)}
.mod:last-child{border-bottom:none}
.mod.rv .mod-t{order:2}
.mod.rv .mod-v{order:1}
.mod-tag{font-family:var(--mono);font-size:10px;color:var(--accent2);margin-bottom:10px;letter-spacing:.04em}
.mod-title{font-family:var(--hd);font-weight:700;font-size:clamp(22px,2.5vw,28px);color:var(--w);letter-spacing:-.03em;line-height:1.15;margin-bottom:10px}
.mod-desc{font-size:13.5px;color:var(--w3);line-height:1.7;margin-bottom:18px}
.mod-list{list-style:none;display:flex;flex-direction:column;gap:9px}
.mod-list li{display:flex;align-items:flex-start;gap:7px;font-size:12.5px;color:var(--w3)}
.mod-list li svg{color:var(--accent2);flex-shrink:0;margin-top:2px}

/* MOCK DASH */
.mk{background:var(--d2);border:1px solid var(--line2);border-radius:var(--r2);overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.4)}
.mk-bar{height:30px;background:var(--d3);border-bottom:1px solid var(--line);display:flex;align-items:center;padding:0 10px;gap:4px}
.mk-dot{width:5px;height:5px;border-radius:50%;background:var(--line2)}
.mk-body{padding:18px}
.mk-t{font-weight:700;font-size:12.5px;color:var(--w);margin-bottom:12px}
.mk-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
.mk-sl{font-size:9px;color:var(--w4);margin-bottom:3px}
.mk-sv{font-family:var(--mono);font-size:14px;font-weight:600;color:var(--w)}
.mk-sv.hl{color:var(--accent2)}
.mk-roi{background:var(--d3);border-radius:8px;padding:10px 12px}
.mk-rr{display:flex;justify-content:space-between;font-size:10.5px;color:var(--w4);padding:2px 0}
.mk-rr b{font-family:var(--mono);color:var(--w);font-weight:500}
.mk-rr b.hl{color:var(--accent2)}

/* INBOX MOCK */
.ib{background:var(--d2);border:1px solid var(--line2);border-radius:var(--r2);overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.4)}
.ib-r{display:flex;align-items:center;gap:9px;padding:11px 13px;border-bottom:1px solid var(--line)}
.ib-r:last-child{border-bottom:none}
.ib-a{width:26px;height:26px;border-radius:50%;background:var(--accent-g);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:9px;color:#fff;flex-shrink:0}
.ib-mid{flex:1;min-width:0}
.ib-nm{font-size:11.5px;font-weight:700;color:var(--w);margin-bottom:1px}
.ib-msg{font-size:10px;color:var(--w4);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ib-rt{text-align:right;flex-shrink:0}
.ib-time{font-size:8.5px;color:var(--w5);margin-bottom:3px}
.ib-pill{font-size:7.5px;font-weight:700;padding:2px 6px;border-radius:100px}
.ib-pill.on{background:rgba(124,92,252,.1);color:var(--accent2)}
.ib-pill.off{background:var(--d4);color:var(--w4)}

@media(max-width:860px){.mod,.mod.rv{grid-template-columns:1fr;gap:24px}.mod.rv .mod-t{order:1}.mod.rv .mod-v{order:2}}

/* DEMO */
.demo-l{display:grid;grid-template-columns:180px 1fr;gap:14px;margin-top:40px}
.demo-tabs{display:flex;flex-direction:column;gap:5px}
.demo-tab{background:var(--d1);border:1px solid var(--line);border-radius:var(--r);padding:11px 12px;cursor:pointer;transition:.15s;text-align:left}
.demo-tab.on{border-color:var(--accent);background:rgba(124,92,252,.06)}
.demo-tab-l{font-size:12.5px;font-weight:700;color:var(--w);margin-bottom:1px}
.demo-tab-s{font-size:9.5px;color:var(--w4)}
.wa-m{background:var(--d3);border-radius:var(--r2);overflow:hidden;border:1px solid var(--line2);box-shadow:0 8px 32px rgba(0,0,0,.4)}
.wa-h{background:var(--d4);padding:10px 14px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--line)}
.wa-b{padding:12px;min-height:220px;max-height:280px;display:flex;flex-direction:column;gap:5px;overflow-y:auto;scrollbar-width:none}
.wa-b::-webkit-scrollbar{display:none}
@media(max-width:768px){.demo-l{grid-template-columns:1fr}.demo-tabs{display:grid;grid-template-columns:repeat(3,1fr)}}

/* TESTIMONIALS */
.t-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:48px}
.t-card{background:var(--d2);border:1px solid var(--line2);border-radius:var(--r2);padding:28px 24px;transition:border-color .2s;cursor:default}
.t-card.on{border-color:rgba(124,92,252,.3);box-shadow:0 0 32px rgba(124,92,252,.05)}
.t-stat{font-family:var(--hd);font-size:28px;font-weight:700;margin-bottom:2px}
.t-card.on .t-stat{background:var(--accent-g);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.t-card:not(.on) .t-stat{color:var(--w4)}
.t-sl{font-size:10px;color:var(--w4);margin-bottom:16px}
.t-q{font-size:13px;color:var(--w2);line-height:1.7;margin-bottom:18px;font-style:italic}
.t-who{display:flex;align-items:center;gap:8px;padding-top:14px;border-top:1px solid var(--line)}
.t-av{width:28px;height:28px;border-radius:50%;background:var(--accent-g);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:9px;color:#fff;flex-shrink:0}
.t-nm{font-size:11.5px;font-weight:700;color:var(--w)}
.t-rl{font-size:10px;color:var(--w4)}
@media(max-width:768px){.t-grid{grid-template-columns:1fr}}

/* FOUNDER */
.founder-wrap{max-width:640px;margin:0 auto}
.founder-txt{font-size:clamp(16px,1.8vw,18px);color:var(--w3);line-height:1.85}
.founder-txt strong{color:var(--w);font-weight:600}
.founder-pull{display:block;margin:28px 0;font-family:var(--hd);font-size:clamp(20px,2.4vw,24px);font-weight:700;line-height:1.4;background:var(--accent-g);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.founder-sig{margin-top:40px;display:flex;align-items:center;gap:12px}

/* PRICING */
.bill-tog{display:inline-flex;align-items:center;gap:3px;background:var(--d3);border:1px solid var(--line);border-radius:100px;padding:3px;margin:24px auto 40px}
.bt{padding:7px 16px;border-radius:100px;font-size:12px;font-weight:700;border:none;background:transparent;color:var(--w4);cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:5px;transition:.15s}
.bt.on{background:var(--accent);color:#fff}
.bt-sv{font-size:9px;font-weight:800;padding:1px 6px;border-radius:100px}
.bt.on .bt-sv{background:rgba(255,255,255,.2)}
.bt:not(.on) .bt-sv{background:rgba(124,92,252,.1);color:var(--accent2)}
.pg{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;align-items:start}
.pl{background:var(--d1);border:1px solid var(--line);border-radius:var(--r2);padding:clamp(24px,3vw,30px) clamp(18px,3vw,22px);position:relative;transition:border-color .2s}
.pl:hover{border-color:var(--line2)}
.pl.pop{border-color:rgba(124,92,252,.3);box-shadow:0 0 40px rgba(124,92,252,.06)}
.pl-badge{position:absolute;top:-1px;left:18px;transform:translateY(-50%);background:var(--accent);color:#fff;font-size:9px;font-weight:800;padding:3px 10px;border-radius:100px;letter-spacing:.02em}
.pl-tier{font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--w4);margin-bottom:3px}
.pl-tag{font-size:11.5px;color:var(--w4);margin-bottom:14px}
.pl-price{display:flex;align-items:baseline;gap:2px;margin-bottom:2px}
.pl-rs{font-size:13px;font-weight:700;color:var(--w)}
.pl-amt{font-family:var(--hd);font-size:clamp(28px,3.5vw,34px);font-weight:700;color:var(--w);letter-spacing:-.03em}
.pl.pop .pl-amt,.pl.pop .pl-rs{background:var(--accent-g);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.pl-mo{font-size:10.5px;color:var(--w4);margin-bottom:14px}
.pl-hr{border:none;border-top:1px solid var(--line);margin:12px 0}
.pl-list{list-style:none;display:flex;flex-direction:column;gap:7px;margin-bottom:18px}
.pl-list li{display:flex;align-items:flex-start;gap:6px;font-size:11.5px;color:var(--w3)}
.pl-list li svg{flex-shrink:0;margin-top:2px}
.pl-list li.ex{color:var(--w5);text-decoration:line-through}
.pl-btn{display:block;text-align:center;padding:10px;border-radius:8px;font-weight:700;font-size:12.5px;text-decoration:none;transition:.15s;font-family:inherit;border:none;cursor:pointer;width:100%}
.pl-btn.go{background:var(--accent);color:#fff}
.pl-btn.go:hover{background:#6a4ce8}
.pl-btn.ot{background:transparent;color:var(--w);border:1px solid var(--line2)}
.pl-btn.ot:hover{border-color:var(--accent);color:var(--accent2)}
@media(max-width:768px){.pg{grid-template-columns:1fr}}

/* FAQ */
.faq-l{max-width:600px;margin:40px auto 0}
.fq{border-bottom:1px solid var(--line)}
.fq:first-child{border-top:1px solid var(--line)}
.fq-b{width:100%;background:none;border:none;padding:15px 0;text-align:left;font-size:13.5px;font-weight:600;color:var(--w);cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:12px;font-family:inherit}
.fq-p{width:16px;height:16px;border-radius:50%;background:var(--d4);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--w4);flex-shrink:0;transition:.15s}
.fq-a{font-size:13px;color:var(--w3);line-height:1.75;max-height:0;overflow:hidden;transition:max-height .25s ease,padding .25s ease}
.fq.op .fq-a{max-height:200px;padding:0 0 15px}
.fq.op .fq-p{background:rgba(124,92,252,.12);color:var(--accent2);transform:rotate(45deg)}

/* CTA */
.cta-sec{padding:clamp(80px,10vw,120px) clamp(16px,4vw,48px);text-align:center;position:relative;z-index:1}
.cta-box{max-width:600px;margin:0 auto;position:relative}
.cta-box::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:500px;height:300px;background:radial-gradient(ellipse,rgba(124,92,252,.08),transparent 70%);pointer-events:none;z-index:0}
.cta-h{font-family:var(--hd);font-weight:700;font-size:clamp(26px,3.4vw,40px);color:var(--w);letter-spacing:-.04em;margin-bottom:14px;line-height:1.1;position:relative;z-index:1}
.cta-h em{background:var(--accent-g);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-style:normal}
.cta-pp{font-size:14px;color:var(--w3);margin-bottom:28px;line-height:1.7;max-width:380px;margin-left:auto;margin-right:auto;position:relative;z-index:1}
.cta-btns{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;position:relative;z-index:1}
.cta-note{margin-top:14px;font-size:10.5px;color:var(--w5);position:relative;z-index:1}

/* FOOTER */
.ft{background:var(--d2);border-top:1px solid var(--line);padding:clamp(40px,6vw,56px) clamp(16px,4vw,48px) 24px;position:relative;z-index:1}
.ft-i{max-width:1120px;margin:0 auto}
.ft-top{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:clamp(20px,4vw,40px);margin-bottom:32px}
.ft-tag{font-size:11.5px;color:var(--w4);line-height:1.8;margin-top:10px;max-width:240px}
.ft-hd{font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--w4);margin-bottom:10px}
.ft-lk{list-style:none;display:flex;flex-direction:column;gap:7px}
.ft-lk a{font-size:12.5px;color:var(--w3);text-decoration:none;transition:.15s}
.ft-lk a:hover{color:var(--accent2)}
.ft-bot{padding-top:16px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;font-size:10.5px;color:var(--w5);flex-wrap:wrap;gap:8px}
@media(max-width:768px){.ft-top{grid-template-columns:1fr}}
      `}</style>

      <div className="aurora" />

      {/* NAV */}
      <nav className={`n${scrolled?" s":""}`}>
        <a href="/" className="n-logo">
          <img src="/logo.png" alt="Fastrill" />
          <b>fast<em>rill</em></b>
        </a>
        <ul className="n-mid">
          {[["#problem","Problem"],["#product","Product"],["#demo","Demo"],["#pricing","Pricing"]].map(([h,l])=>(
            <li key={h}><a href={h}>{l}</a></li>
          ))}
        </ul>
        <div className="n-r">
          <a href="/login" className="n-sign">Log in</a>
          <a href="/signup" className="btn btn-p">Get started</a>
          <button className="hb" onClick={()=>setMobNav(p=>!p)}>&#9776;</button>
        </div>
      </nav>
      <div className={`mob-d${mobNav?" open":""}`}>
        {[["#problem","Problem"],["#product","Product"],["#demo","Demo"],["#pricing","Pricing"],["/login","Log in"]].map(([h,l])=>(
          <a key={h} href={h} onClick={()=>setMobNav(false)}>{l}</a>
        ))}
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-i">
          <div className="hero-tag _a"><span/>AI Revenue Infrastructure</div>
          <h1 className="hero-h _a">
            <span className="dim">Your leads message you.</span><br/>
            Then <span className="hl">nothing happens.</span>
          </h1>
          <div className="hero-row">
            <div className="_a">
              <p className="hero-p">
                You spend thousands on ads. Leads land on WhatsApp. But nobody replies for hours — or ever. <strong>Fastrill responds in 2 seconds</strong>, qualifies the lead, and books the appointment. No human needed.
              </p>
              <div className="hero-acts">
                <a href="/signup" className="btn btn-p btn-l">Start free trial &rarr;</a>
                <a href="#demo" className="btn btn-s btn-l">See a live demo</a>
              </div>
              <div className="hero-proof">
                <div className="hero-avs">
                  {["#7c5cfc","#c084fc","#a78bfa","#818cf8"].map((c,i)=>(
                    <i key={i} style={{background:c}}>{"PRSA"[i]}</i>
                  ))}
                </div>
                <div className="hero-proof-txt"><b>200+ businesses</b> across India<br/>trust Fastrill with their revenue</div>
              </div>
            </div>
            <div className="ph _a">
              <div className="ph-bar">
                <div className="ph-av">R</div>
                <div><div className="ph-nm">Riya Salon</div><div className="ph-st">AI Active</div></div>
              </div>
              <div className="ph-body">
                {DEMOS.booking.map((msg,i)=><div key={i} className={`m ${msg.r}`}>{msg.m}</div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NUMBERS */}
      <div className="nums">
        <div className="nums-i">
          {[["3,200","+ bookings/mo"],["1.8","s avg response"],["99","% delivery"],["10","+ languages"]].map(([v,l])=>(
            <div key={l} className="num-c _a">
              <div className="num-v">{v}<em>{l.charAt(0)==="+"||l.charAt(0)==="s"||l.charAt(0)==="%"||l.charAt(0)==="+"?"":"+"}</em></div>
              <div className="num-l">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PROBLEM */}
      <section className="sec alt" id="problem">
        <div className="sec-i">
          <div className="_a">
            <div className="sec-lbl">// the problem</div>
            <h2 className="sec-h">Your ads work.<br/>Your <em>inbox doesn't.</em></h2>
            <p className="sec-p">You spend lakhs getting leads. They die in WhatsApp because nobody replied fast enough.</p>
          </div>
          <div className="bento">
            {[
              { t:"Leads die after hours", d:"Customer messages at 10 PM. You see it at 9 AM. They booked your competitor at 10:02 PM.", s:"62%", wide:false },
              { t:"Speed is the only moat", d:"Your competitor replies in 2 seconds. You reply in 2 hours. Same service, same price — they win every single time. The fastest reply gets the booking.", s:"2s", wide:true },
              { t:"Silence becomes 1-star reviews", d:"Frustrated customer messages during peak hour. Staff is too busy. No reply. One-star review on Google the next morning.", s:"1★", wide:true },
              { t:"You can't scale yourself", d:"More ads = more messages = more you can't reply to. Growth creates the exact problem that kills growth.", s:"∞", wide:false },
            ].map(c=>(
              <div key={c.t} className={`bento-c _a${c.wide?" wide":""}`}>
                <div className="bento-ic"><Sv n="alert" s={16}/></div>
                <div className="bento-t">{c.t}</div>
                <div className="bento-d">{c.d}</div>
                <div className="bento-stat">{c.s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT */}
      <section className="sec" id="product">
        <div className="sec-i">
          <div className="_a">
            <div className="sec-lbl">// inside fastrill</div>
            <h2 className="sec-h">Not a chatbot.<br/><em>Revenue infrastructure.</em></h2>
          </div>

          <div className="mod _a">
            <div className="mod-t">
              <div className="mod-tag">01 / BOOKING ENGINE</div>
              <h3 className="mod-title">Collects, checks, confirms. Automatically.</h3>
              <p className="mod-desc">Service, date, time — gathered conversationally, validated against real availability, confirmed without a human touching it.</p>
              <ul className="mod-list">
                <li><Sv n="check" s={13}/>Understands casual Hindi, Telugu, Tamil, mixed messages</li>
                <li><Sv n="check" s={13}/>Checks live slot availability before confirming</li>
                <li><Sv n="check" s={13}/>Sends you a notification the moment it books</li>
              </ul>
            </div>
            <div className="mod-v">
              <div className="ph">
                <div className="ph-bar"><div className="ph-av">R</div><div><div className="ph-nm">Riya Salon</div><div className="ph-st">AI Active</div></div></div>
                <div className="ph-body">
                  <div className="m c">Hi, haircut tomorrow 3pm?</div>
                  <div className="m a">{"3 PM tomorrow is open!\n\nConfirm Haircut for tomorrow at 3:00 PM?"}</div>
                  <div className="m c">Yes</div>
                  <div className="m a">{"Booked! Haircut · Tomorrow · 3:00 PM"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mod rv _a">
            <div className="mod-t">
              <div className="mod-tag">02 / CAMPAIGNS & ROI</div>
              <h3 className="mod-title">See the revenue each campaign generated.</h3>
              <p className="mod-desc">Send WhatsApp templates to segments. Track delivery, replies, and revenue — not just opens.</p>
              <ul className="mod-list">
                <li><Sv n="check" s={13}/>Segment: new, returning, VIP, inactive</li>
                <li><Sv n="check" s={13}/>Real Meta delivery + read tracking</li>
                <li><Sv n="check" s={13}/>Revenue attribution per campaign</li>
              </ul>
            </div>
            <div className="mod-v">
              <div className="mk">
                <div className="mk-bar"><span className="mk-dot"/><span className="mk-dot"/><span className="mk-dot"/></div>
                <div className="mk-body">
                  <div className="mk-t">Winter offer — January</div>
                  <div className="mk-stats">
                    <div><div className="mk-sl">Sent</div><div className="mk-sv">412</div></div>
                    <div><div className="mk-sl">Delivered</div><div className="mk-sv">404</div></div>
                    <div><div className="mk-sl">Replied</div><div className="mk-sv hl">138</div></div>
                  </div>
                  <div className="mk-roi">
                    <div className="mk-rr"><span>Est. bookings</span><b>82</b></div>
                    <div className="mk-rr"><span>Est. revenue</span><b>₹98,400</b></div>
                    <div className="mk-rr"><span>ROI</span><b className="hl">+612%</b></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mod _a">
            <div className="mod-t">
              <div className="mod-tag">03 / UNIFIED INBOX</div>
              <h3 className="mod-title">Every conversation. One screen.</h3>
              <p className="mod-desc">See all chats live. Take over manually anytime. Let AI resume when you're done.</p>
              <ul className="mod-list">
                <li><Sv n="check" s={13}/>Per-conversation AI toggle</li>
                <li><Sv n="check" s={13}/>Customer history, tags, booking status</li>
                <li><Sv n="check" s={13}/>10+ Indian languages auto-detected</li>
              </ul>
            </div>
            <div className="mod-v">
              <div className="ib">
                {[
                  {n:"Priya Nair",msg:"Yes, book me for 3 PM",t:"now",on:true},
                  {n:"Arjun Mehta",msg:"Do you have dermatology also?",t:"2m",on:true},
                  {n:"Sneha Reddy",msg:"Thank you so much!",t:"14m",on:false},
                ].map(c=>(
                  <div key={c.n} className="ib-r">
                    <div className="ib-a">{c.n[0]}</div>
                    <div className="ib-mid"><div className="ib-nm">{c.n}</div><div className="ib-msg">{c.msg}</div></div>
                    <div className="ib-rt"><div className="ib-time">{c.t}</div><div className={`ib-pill ${c.on?"on":"off"}`}>{c.on?"AI":"Manual"}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section className="sec alt" id="demo">
        <div className="sec-i">
          <div className="_a">
            <div className="sec-lbl">// live demo</div>
            <h2 className="sec-h">Watch it <em>convert.</em></h2>
            <p className="sec-p">Pick a scenario. See the AI handle it naturally.</p>
          </div>
          <div className="demo-l">
            <div className="demo-tabs _a">
              {DEMO_TABS.map(s=>(
                <div key={s.k} className={`demo-tab${demoKey===s.k?" on":""}`} onClick={()=>setDemoKey(s.k)}>
                  <div className="demo-tab-l">{s.label}</div>
                  <div className="demo-tab-s">{s.sub}</div>
                </div>
              ))}
            </div>
            <div className="wa-m _a">
              <div className="wa-h">
                <div className="ph-av">R</div>
                <div><div className="ph-nm">Riya Salon</div><div className="ph-st">AI Active</div></div>
              </div>
              <div className="wa-b" ref={chatRef}>
                {demoMsgs.map((msg,i)=><div key={i} className={`m ${msg.r}`}>{msg.m}</div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="sec">
        <div className="sec-i">
          <div className="_a">
            <div className="sec-lbl">// results</div>
            <h2 className="sec-h">Real businesses. <em>Real numbers.</em></h2>
          </div>
          <div className="t-grid">
            {TESTIMONIALS.map((t,i)=>(
              <div key={t.name} className={`t-card _a${i===tIdx?" on":""}`} onClick={()=>setTIdx(i)}>
                <div className="t-stat">{t.stat}</div>
                <div className="t-sl">{t.statLabel}</div>
                <div className="t-q">"{t.quote}"</div>
                <div className="t-who">
                  <div className="t-av">{t.name[0]}</div>
                  <div><div className="t-nm">{t.name}</div><div className="t-rl">{t.role}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOUNDER */}
      <section className="sec alt">
        <div className="sec-i">
          <div className="founder-wrap _a">
            <div className="sec-lbl" style={{textAlign:"center"}}>// why we built this</div>
            <div className="founder-txt" style={{marginTop:28}}>
              <p>I've spent years in digital marketing — running ads, building funnels, optimising campaigns for businesses across India. Every lead costs real money.</p>
              <p style={{marginTop:20}}>The single most common thing I saw across <strong>every client</strong> — salons, clinics, gyms, coaching centres:</p>
              <span className="founder-pull">Leads were arriving. And dying in the WhatsApp inbox.</span>
              <p>A salon owner in Hyderabad. <strong>₹40,000/month on Instagram ads.</strong> 60% of leads who messaged never got a reply within the hour. Not bad ads — slow replies.</p>
              <p style={{marginTop:20}}><strong>The problem was never the ads. It was always the follow-up.</strong></p>
            </div>
            <div className="founder-sig">
              <div className="t-av" style={{width:40,height:40,fontSize:14}}>G</div>
              <div><div style={{fontSize:14,fontWeight:700,color:"var(--w)"}}>Ganapathi</div><div style={{fontSize:11,color:"var(--w4)"}}>Founder, Fastrill — Solvabil Pvt. Ltd.</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="sec" id="pricing">
        <div className="sec-i">
          <div className="_a" style={{textAlign:"center"}}>
            <div className="sec-lbl" style={{display:"flex",justifyContent:"center"}}>// pricing</div>
            <h2 className="sec-h" style={{margin:"0 auto",textAlign:"center"}}>Simple pricing.<br/><em>Pays for itself.</em></h2>
          </div>
          <div className="_a" style={{display:"flex",justifyContent:"center"}}>
            <div className="bill-tog">
              <button className={`bt${billing==="monthly"?" on":""}`} onClick={()=>setBilling("monthly")}>Monthly</button>
              <button className={`bt${billing==="annual"?" on":""}`} onClick={()=>setBilling("annual")}>Annual <span className="bt-sv">-17%</span></button>
            </div>
          </div>
          <div className="pg">
            {[
              {tier:"Starter",monthly:999,tag:"Solo operators",cta:"Get started",cs:"ot",feats:[["i","1 WhatsApp number"],["i","300 AI conversations/mo"],["i","Booking automation"],["x","Lead recovery"],["x","Campaigns"]]},
              {tier:"Growth",monthly:1999,tag:"Growing businesses",cta:"Start free trial",cs:"go",pop:true,feats:[["i","1 WhatsApp number"],["i","Unlimited conversations"],["i","Customer memory"],["i","Lead recovery"],["i","WhatsApp campaigns"]]},
              {tier:"Pro",monthly:4999,tag:"Multi-branch",cta:"Contact sales",cs:"ot",feats:[["i","Up to 5 numbers"],["i","Everything in Growth"],["i","Multi-branch management"],["i","Custom AI playbook"],["i","Dedicated onboarding"]]},
            ].map(p=>{
              const price=billing==="annual"?Math.round(p.monthly*0.83):p.monthly
              return(
                <div key={p.tier} className={`pl _a${p.pop?" pop":""}`}>
                  {p.pop&&<div className="pl-badge">Popular</div>}
                  <div className="pl-tier">{p.tier}</div>
                  <div className="pl-tag">{p.tag}</div>
                  <div className="pl-price"><span className="pl-rs">₹</span><span className="pl-amt">{price.toLocaleString("en-IN")}</span></div>
                  <div className="pl-mo">/month + GST{billing==="annual"&&<span style={{color:"var(--w5)"}}> · ₹{(price*12).toLocaleString("en-IN")}/yr</span>}</div>
                  <hr className="pl-hr"/>
                  <ul className="pl-list">
                    {p.feats.map(([c,t])=><li key={t} className={c==="x"?"ex":""}>{c==="i"?<Sv n="check" s={12} cl="accent"/>:<Sv n="x" s={12} cl="muted"/>}{t}</li>)}
                  </ul>
                  <a href="/signup" className={`pl-btn ${p.cs}`}>{p.cta}</a>
                </div>
              )
            })}
          </div>
          <p style={{textAlign:"center",marginTop:20,fontSize:11,color:"var(--w5)"}}>14-day free trial · No credit card · Cancel anytime</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="sec alt">
        <div className="sec-i">
          <div className="_a" style={{textAlign:"center"}}>
            <div className="sec-lbl" style={{display:"flex",justifyContent:"center"}}>// faq</div>
            <h2 className="sec-h" style={{margin:"0 auto",textAlign:"center"}}>Questions</h2>
          </div>
          <div className="faq-l _a">
            {FAQS.map(([q,a],i)=>(
              <div key={i} className={`fq${faq===i?" op":""}`}>
                <button className="fq-b" onClick={()=>setFaq(faq===i?null:i)}>{q}<span className="fq-p">+</span></button>
                <div className="fq-a">{a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-sec">
        <div className="cta-box _a">
          <h2 className="cta-h">Stop losing revenue<br/>to <em>slow replies.</em></h2>
          <p className="cta-pp">Every unanswered message is money you already spent. Start recovering it today.</p>
          <div className="cta-btns">
            <a href="/signup" className="btn btn-p btn-l">Start free trial &rarr;</a>
            <a href="https://wa.me/916309279265" className="btn btn-s btn-l">Message us</a>
          </div>
          <p className="cta-note">14-day trial · 10 min setup · Cancel anytime</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="ft">
        <div className="ft-i">
          <div className="ft-top">
            <div>
              <a href="/" className="n-logo"><img src="/logo.png" alt="Fastrill"/><b>fast<em>rill</em></b></a>
              <p className="ft-tag">AI-powered revenue infrastructure for Indian service businesses. Built by Solvabil Pvt. Ltd.</p>
            </div>
            {[
              {h:"Product",lks:[["How it works","#product"],["Pricing","#pricing"],["Demo","#demo"]]},
              {h:"Company",lks:[["About","#"],["Contact","mailto:team@fastrill.com"],["Call","tel:+916309279265"]]},
              {h:"Legal",lks:[["Privacy","/privacy"],["Terms","/terms"]]},
            ].map(col=>(
              <div key={col.h}>
                <div className="ft-hd">{col.h}</div>
                <ul className="ft-lk">{col.lks.map(([n,h])=><li key={n}><a href={h}>{n}</a></li>)}</ul>
              </div>
            ))}
          </div>
          <div className="ft-bot">
            <span>&copy; 2026 Fastrill &mdash; Solvabil Pvt. Ltd.</span>
            <span>Made in India</span>
          </div>
        </div>
      </footer>
    </>
  )
}

function Sv({ n, s = 18, cl = "" }) {
  const p = { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", style: cl === "accent" ? { color: "var(--accent2)" } : cl === "muted" ? { color: "var(--w5)" } : {} }
  switch (n) {
    case "check": return <svg {...p}><path d="M20 6L9 17l-5-5" /></svg>
    case "x": return <svg {...p}><path d="M18 6L6 18M6 6l12 12" /></svg>
    case "alert": return <svg {...p} strokeWidth={1.6}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" /></svg>
    default: return null
  }
}
