"use client"

import { useState, useEffect, useRef, useCallback } from "react"

// ── Demo conversations — no API needed ─────────────────────────────
const DEMOS = {
  booking: [
    { r:"c", m:"Hi, I want a haircut tomorrow around 3pm" },
    { r:"a", m:"Hey! 👋 Tomorrow's Saturday — 3 PM works great.\n\nShall I confirm *Haircut* for *Saturday, 29th March at 3:00 PM*? ✅" },
    { r:"c", m:"Yes please!" },
    { r:"a", m:"✅ *Booking Confirmed!*\n\n📋 Haircut\n📅 Saturday, 29 March\n⏰ 3:00 PM\n\nSee you then! 😊" },
  ],
  hindi: [
    { r:"c", m:"Bhai facial karwa sakte hai kal?" },
    { r:"a", m:"Haan bilkul! 😊\n\nFacial ₹1,200 mein available hai (60 min).\n\nKis time aana chahenge?" },
    { r:"c", m:"Shaam 6 baje" },
    { r:"a", m:"Confirm karu *Facial* kal *shaam 6:00 PM* ke liye? ✅" },
    { r:"c", m:"Haan kar do" },
    { r:"a", m:"✅ *Booking ho gayi!*\n\n📋 Facial · ₹1,200\n📅 Kal, 29 March\n⏰ 6:00 PM\n\nMilenge! 😊" },
  ],
  complaint: [
    { r:"c", m:"Your staff was really rude to me last time. Very disappointed." },
    { r:"a", m:"I'm truly sorry to hear this 😔\n\nThat's not how we treat our customers at all. Could you tell me what happened?" },
    { r:"c", m:"The receptionist dismissed me when I asked about pricing" },
    { r:"a", m:"I sincerely apologise — this has been flagged to our manager immediately.\n\nSomeone will call you within the hour. We'd genuinely like to make this right 🙏" },
  ],
  winback: [
    { r:"a", m:"Hi Anita! 👋 It's been a while since your last visit at Riya Salon.\n\nWe've missed you! Your favourite keratin treatment is available this week — want to book?" },
    { r:"c", m:"Oh yes actually! What's the price?" },
    { r:"a", m:"Keratin Treatment is ₹2,800 (90 min). Your last visit was in December so we're offering you 10% off — ₹2,520 this week only 🎁" },
    { r:"c", m:"That's great, book me Saturday morning" },
    { r:"a", m:"✅ *Booking Confirmed!*\n\n📋 Keratin Treatment · ₹2,520\n📅 Saturday, 29 March · 10:00 AM\n\nCan't wait to see you! 😊" },
  ],
}

const DEMO_META = [
  { k:"booking",   label:"Booking flow",    sub:"End-to-end in 4 msgs" },
  { k:"hindi",     label:"Hindi support",   sub:"Auto-detected" },
  { k:"complaint", label:"Complaint",       sub:"Empathy mode" },
  { k:"winback",   label:"Win-back",        sub:"Inactive customer" },
]

const FAQS = [
  { q:"Do I need to change my WhatsApp number?", a:"No. You keep your existing WhatsApp Business number. Fastrill connects via Meta's official Business API — your customers message the same number they always have. Nothing changes on their end." },
  { q:"How long does setup actually take?", a:"About 10 minutes from account creation to your first AI reply. Connect WhatsApp (one click via Meta), add your services and hours, go live. No developer required." },
  { q:"Which Indian languages are supported?", a:"Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, and English — all auto-detected per conversation. No configuration needed." },
  { q:"Can I take over and reply manually?", a:"Yes, always. Toggle AI off for any conversation in your dashboard — you reply manually, AI waits. Toggle back on when done. Full control at every moment." },
  { q:"What happens when the AI doesn't know the answer?", a:"It tells the customer it will check and get back to them — you get an instant notification with full context. The AI never guesses on pricing, policy, or anything important." },
  { q:"Are there per-message charges on top of the subscription?", a:"No per-message charges ever from Fastrill. Flat monthly pricing regardless of volume. WhatsApp does charge for business-initiated messages (campaigns) per Meta's standard rates — those are passed through at cost." },
  { q:"Is my customer data safe?", a:"All data is encrypted with 256-bit SSL and stored securely in India. We never share or sell your customer data to third parties. Your data is yours, always." },
  { q:"Is there a free trial?", a:"Yes — 14 days, full Growth plan access, no credit card required. No automatic charges at the end. You decide whether to continue." },
]

const TESTIMONIALS = [
  { init:"P", grad:"135deg,#f59e0b,#ef4444", name:"Priya Nair", biz:"Glow Parlour · Hyderabad", result:"+43% bookings in month one", quote:"I was losing Saturday night bookings because nobody replied after 8 PM. With Fastrill, customers book in the middle of the night and wake up to confirmation messages. It paid for itself in the first week." },
  { init:"R", grad:"135deg,#3b82f6,#06b6d4", name:"Dr. Ravi Sharma", biz:"Skin First Clinic · Vijayawada", result:"Saved ₹22k/month on front desk", quote:"My patients message in Telugu and the AI replies perfectly — in Telugu. Books appointments, handles reschedules, follows up. I had to see it to believe it was actually AI." },
  { init:"S", grad:"135deg,#10b981,#0ea5e9", name:"Sneha Reddy", biz:"Studio S · 2 branches, Bangalore", result:"Replaced evening receptionist shift", quote:"Two branches, both WhatsApp inboxes handled simultaneously. Our staff now focuses entirely on in-person customers, not constantly checking their phones. Night and day difference." },
  { init:"A", grad:"135deg,#a855f7,#6366f1", name:"Arjun Mehta", biz:"FitLife Gym · Mumbai", result:"320 membership leads converted", quote:"We used to spend 4 hours a day on membership inquiries. Fastrill qualifies leads, explains packages, and books discovery sessions. Completely hands-off, completely consistent." },
  { init:"N", grad:"135deg,#f59e0b,#10b981", name:"Nandini Iyer", biz:"Ayur Wellness · Chennai", result:"60% fewer no-shows", quote:"Clients message in Tamil, AI responds in Tamil with perfect grammar. It sends reminders an hour before every appointment. No-shows dropped so fast in month one I thought the data was wrong." },
  { init:"V", grad:"135deg,#0ea5e9,#10b981", name:"Vikram Naidu", biz:"Skin Clinic · Guntur", result:"3x lead-to-booking rate", quote:"Before, I'd run ads and then manually reply to every WhatsApp message at midnight. Now Fastrill replies in 2 seconds, qualifies the lead, and books them — I just confirm in the morning." },
]

export default function MarketingPage() {
  const [demoKey, setDemoKey]         = useState("booking")
  const [demoMsgs, setDemoMsgs]       = useState([])
  const [openFaq, setOpenFaq]         = useState(null)
  const [scrolled, setScrolled]       = useState(false)
  const [mobOpen, setMobOpen]         = useState(false)
  const [exitShow, setExitShow]       = useState(false)
  const [exitGone, setExitGone]       = useState(false)
  const [counts, setCounts]           = useState({ a:0, b:0, c:0 })
  const [heroIdx, setHeroIdx]         = useState(0)

  const demoRef    = useRef(null)
  const statsRef   = useRef(null)
  const countedRef = useRef(false)
  const timerRef   = useRef(null)
  const exitRef    = useRef(null)

  // Hero rotating headlines
  const HEADLINES = [
    "Your ads are working.\nYour follow-up isn't.",
    "Leads message you\nat midnight. Who replies?",
    "2 seconds or 2 hours.\nOne wins the booking.",
  ]

  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i+1) % HEADLINES.length), 3800)
    return () => clearInterval(t)
  }, [])

  // Demo playback
  useEffect(() => {
    setDemoMsgs([])
    if (timerRef.current) clearTimeout(timerRef.current)
    const msgs = DEMOS[demoKey]
    msgs.forEach((m, i) => {
      timerRef.current = setTimeout(() => {
        setDemoMsgs(p => [...p, m])
        if (demoRef.current) demoRef.current.scrollTop = 9999
      }, 600 + i * 900)
    })
    return () => clearTimeout(timerRef.current)
  }, [demoKey])

  // Scroll listener
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", fn, { passive:true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  // Exit bar
  useEffect(() => {
    if (exitGone) return
    exitRef.current = setTimeout(() => setExitShow(true), 28000)
    return () => clearTimeout(exitRef.current)
  }, [exitGone])

  // Stats counter
  useEffect(() => {
    if (!statsRef.current || countedRef.current) return
    const io = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return
      countedRef.current = true
      io.disconnect()
      const run = (to, dur, cb) => {
        const s = performance.now()
        const tick = now => {
          const t = Math.min((now-s)/dur,1), e=1-Math.pow(1-t,3)
          cb(Math.round(to*e))
          if (t<1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
      run(3200, 1800, v => setCounts(p=>({...p,a:v})))
      run(99,   1500, v => setCounts(p=>({...p,b:v})))
      run(73,   1400, v => setCounts(p=>({...p,c:v})))
    }, { threshold:0.3 })
    io.observe(statsRef.current)
    return () => io.disconnect()
  }, [])

  // Reveal animations
  useEffect(() => {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add("vis"); io.unobserve(e.target) } })
    }, { threshold:0.05, rootMargin:"0px 0px -20px 0px" })
    document.querySelectorAll(".fade").forEach((el,i) => {
      const sibs = Array.from(el.parentElement?.querySelectorAll(":scope>.fade")||[])
      const idx  = sibs.indexOf(el)
      el.style.transitionDelay = Math.min(idx*0.07,0.25)+"s"
      io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  return (<>
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=DM Sans:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{
  background:#050811;
  color:#94a3b8;
  font-family:'DM Sans',sans-serif;
  font-size:16px;
  line-height:1.6;
  overflow-x:hidden;
  -webkit-font-smoothing:antialiased;
}
:root{
  --ink:#f1f5f9;
  --ink2:#94a3b8;
  --ink3:#475569;
  --ink4:#1e293b;
  --base:#050811;
  --s1:#080d1a;
  --s2:#0c1221;
  --s3:#101828;
  --s4:#162033;
  --line:rgba(255,255,255,.06);
  --line2:rgba(255,255,255,.1);
  --line3:rgba(255,255,255,.16);
  --teal:#00C9B1;
  --teal2:rgba(0,201,177,.12);
  --teal3:rgba(0,201,177,.22);
  --teal4:rgba(0,201,177,.06);
  --wa:#25d366;
  --red:#f43f5e;
  --amber:#f59e0b;
  --sans:'DM Sans',sans-serif;
  --display:'DM Sans',sans-serif;
}

/* ── Ambient background ── */
body::before{
  content:'';position:fixed;inset:0;z-index:0;pointer-events:none;
  background:
    radial-gradient(ellipse 90% 55% at 50% -10%,rgba(0,201,177,.07) 0%,transparent 60%),
    radial-gradient(ellipse 50% 40% at 85% 75%,rgba(0,80,200,.04) 0%,transparent 50%);
}

/* ── NAV ── */
.nav{
  position:fixed;top:0;left:0;right:0;z-index:200;
  height:60px;padding:0 clamp(16px,4vw,56px);
  display:flex;align-items:center;justify-content:space-between;
  transition:all .3s;
}
.nav.sc{
  background:rgba(5,8,17,.9);
  backdrop-filter:blur(20px);
  -webkit-backdrop-filter:blur(20px);
  border-bottom:1px solid var(--line);
}
.logo{
  display:flex;align-items:center;gap:10px;
  text-decoration:none;font-family:var(--display);
  font-weight:1000;font-size:60px;letter-spacing:-0.5px;color:var(--ink);
}
.logo img{width:60px;height:60px;object-fit:contain;flex-shrink:0;}
.logo em{color:var(--teal);font-style:normal;}
.nmid{display:flex;align-items:center;gap:2px;list-style:none;}
.nmid a{
  font-size:13px;font-weight:500;color:var(--ink2);
  text-decoration:none;padding:6px 12px;border-radius:7px;
  transition:all .15s;font-family:var(--sans);
}
.nmid a:hover{color:var(--ink);background:rgba(255,255,255,.04)}
.nr{display:flex;align-items:center;gap:8px;}
.nav-login{
  font-size:13px;font-weight:500;color:var(--ink2);
  text-decoration:none;padding:7px 14px;border-radius:7px;
  transition:color .15s;
}
.nav-login:hover{color:var(--ink);}
.nav-cta{
  display:inline-flex;align-items:center;gap:6px;
  background:var(--teal);color:#000;padding:9px 18px;
  border-radius:8px;font-weight:700;font-size:13px;
  text-decoration:none;transition:all .2s;
  font-family:var(--display);letter-spacing:-.2px;
}
.nav-cta:hover{background:#00e5cc;transform:translateY(-1px);box-shadow:0 8px 24px rgba(0,201,177,.25);}
.hbg{
  display:none;background:none;border:1px solid var(--line2);
  border-radius:7px;padding:6px 10px;cursor:pointer;
  color:var(--ink2);font-size:15px;line-height:1;
}
.mdraw{
  position:fixed;top:60px;left:0;right:0;z-index:190;
  background:rgba(5,8,17,.97);backdrop-filter:blur(24px);
  border-bottom:1px solid var(--line);padding:10px 14px 18px;
  display:flex;flex-direction:column;gap:2px;
  transform:translateY(-110%);transition:transform .22s ease;
}
.mdraw.open{transform:none;}
.mdraw a{
  color:var(--ink2);text-decoration:none;font-size:14px;
  font-weight:500;padding:10px 12px;border-radius:8px;
  transition:all .15s;font-family:var(--sans);
}
.mdraw a:hover{color:var(--ink);background:rgba(255,255,255,.04)}
.mdraw hr{border:none;border-top:1px solid var(--line);margin:6px 0;}

/* ── HERO ── */
.hero{
  min-height:100vh;
  padding:clamp(100px,12vw,150px) clamp(16px,5vw,56px) clamp(60px,8vw,90px);
  background:var(--base);position:relative;overflow:hidden;
}
.hero-grid-bg{
  position:absolute;inset:0;pointer-events:none;
  background-image:
    linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);
  background-size:80px 80px;
  mask-image:radial-gradient(ellipse 70% 55% at 50% 0%,black,transparent 75%);
}
.hero-in{
  max-width:1200px;margin:0 auto;
  display:grid;grid-template-columns:1fr 420px;
  gap:clamp(40px,5vw,80px);align-items:center;
  position:relative;z-index:1;
}
.hero-eyebrow{
  display:inline-flex;align-items:center;gap:7px;
  border:1px solid var(--teal3);border-radius:100px;
  padding:5px 14px 5px 7px;margin-bottom:28px;
  font-size:11.5px;font-weight:600;color:var(--teal);
  letter-spacing:.3px;font-family:var(--display);
}
.eyebrow-dot{
  width:20px;height:20px;border-radius:50%;
  background:var(--teal2);border:1px solid var(--teal3);
  display:flex;align-items:center;justify-content:center;
}
.eyebrow-dot::after{
  content:'';width:6px;height:6px;border-radius:50%;
  background:var(--teal);animation:pulse 2s infinite;
}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(1.6)}}

.h1{
  font-family:var(--display);
  font-size:clamp(40px,5.5vw,72px);
  font-weight:800;line-height:1.05;
  letter-spacing:-.04em;color:var(--ink);
  margin-bottom:6px;white-space:pre-line;
  min-height:clamp(100px,14vw,160px);
}
.h1 em{font-style:normal;color:var(--teal);}
.hero-sub{
  font-size:clamp(15px,1.6vw,17px);color:var(--ink2);
  max-width:500px;margin-bottom:32px;line-height:1.9;font-weight:400;
  margin-top:16px;
}
.hero-btns{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:28px;}
.btn-primary{
  display:inline-flex;align-items:center;gap:8px;
  background:var(--teal);color:#000;padding:14px 28px;
  border-radius:9px;font-weight:700;font-size:15px;
  text-decoration:none;transition:all .2s;
  font-family:var(--display);letter-spacing:-.2px;
}
.btn-primary:hover{background:#00e5cc;transform:translateY(-1px);box-shadow:0 14px 32px rgba(0,201,177,.28);}
.btn-ghost{
  display:inline-flex;align-items:center;gap:7px;
  background:rgba(255,255,255,.04);color:var(--ink);
  padding:14px 22px;border-radius:9px;font-weight:500;font-size:14px;
  text-decoration:none;border:1px solid var(--line2);transition:all .2s;
}
.btn-ghost:hover{background:rgba(255,255,255,.07);border-color:var(--line3);}
.hero-proof{
  display:flex;align-items:center;gap:14px;
  padding:12px 16px;background:var(--teal4);
  border:1px solid var(--teal3);border-radius:11px;
  max-width:440px;
}
.proof-avs{display:flex;}
.proof-av{
  width:26px;height:26px;border-radius:50%;border:2px solid var(--base);
  margin-left:-6px;font-size:9.5px;font-weight:800;color:#fff;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
}
.proof-av:first-child{margin-left:0;}
.proof-text{font-size:12.5px;color:var(--ink2);}
.proof-text strong{color:var(--teal);font-weight:700;}

/* ── PHONE MOCKUP ── */
.phone-wrap{position:relative;}
.phone{
  background:var(--s2);border:1px solid var(--line2);
  border-radius:22px;overflow:hidden;
  box-shadow:0 40px 100px rgba(0,0,0,.65),0 0 0 1px rgba(0,201,177,.04);
}
.phone-top{
  background:var(--s3);border-bottom:1px solid var(--line);
  padding:13px 16px;display:flex;align-items:center;gap:10px;
}
.phone-av{
  width:34px;height:34px;border-radius:50%;flex-shrink:0;
  background:linear-gradient(135deg,var(--teal),#0ea5e9);
  display:flex;align-items:center;justify-content:center;
  font-weight:800;font-size:13px;color:#000;
}
.phone-name{font-size:13px;font-weight:700;color:var(--ink);font-family:var(--display);}
.phone-status{font-size:10.5px;color:var(--teal);display:flex;align-items:center;gap:4px;margin-top:1px;}
.phone-status::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--teal);animation:pulse 2s infinite;}
.ai-live-badge{
  margin-left:6px;font-size:9px;font-weight:800;
  background:var(--teal2);color:var(--teal);
  border:1px solid var(--teal3);border-radius:4px;
  padding:1px 6px;letter-spacing:.5px;
}
.phone-body{
  padding:14px;min-height:240px;max-height:300px;
  overflow-y:auto;display:flex;flex-direction:column;gap:8px;
  scrollbar-width:none;
}
.phone-body::-webkit-scrollbar{display:none;}
.pm{
  max-width:82%;padding:9px 13px;border-radius:12px;
  font-size:13px;line-height:1.55;white-space:pre-wrap;
  animation:msgIn .22s ease both;
}
.pm.c{
  background:#005c4b;color:#e9edef;align-self:flex-end;
  border-radius:12px 4px 12px 12px;
}
.pm.a{
  background:var(--s4);border:1px solid var(--line);
  color:var(--ink);align-self:flex-start;border-radius:4px 12px 12px 12px;
}
.pm.a .ai-label{font-size:9.5px;color:var(--teal);font-weight:700;margin-bottom:4px;display:block;}
.typing{
  display:flex;align-items:center;gap:4px;padding:10px 13px;
  background:var(--s4);border:1px solid var(--line);
  border-radius:4px 12px 12px 12px;align-self:flex-start;width:fit-content;
}
.typing span{width:6px;height:6px;border-radius:50%;background:var(--ink3);animation:bounce .8s infinite;}
.typing span:nth-child(2){animation-delay:.15s;}
.typing span:nth-child(3){animation-delay:.3s;}
@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
@keyframes msgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}

/* ── STATS ── */
.stats{background:var(--s1);border-top:1px solid var(--line);border-bottom:1px solid var(--line);}
.stats-row{display:grid;grid-template-columns:repeat(3,1fr);max-width:1200px;margin:0 auto;}
.stat-cell{
  padding:clamp(32px,4vw,52px) clamp(20px,3vw,44px);
  border-right:1px solid var(--line);text-align:center;
}
.stat-cell:last-child{border-right:none;}
.stat-n{
  font-family:var(--display);
  font-size:clamp(44px,5vw,62px);font-weight:800;
  color:var(--ink);line-height:1;letter-spacing:-.05em;margin-bottom:6px;
}
.stat-n em{color:var(--teal);font-style:normal;}
.stat-l{font-size:14px;font-weight:600;color:var(--ink2);}
.stat-s{font-size:12px;color:var(--ink3);margin-top:4px;}

/* ── TRUST BAR ── */
.trust{
  border-bottom:1px solid var(--line);
  padding:13px clamp(16px,4vw,56px);
  display:flex;align-items:center;justify-content:center;
  gap:clamp(14px,3vw,36px);flex-wrap:wrap;
  background:var(--s1);
}
.tbadge{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:500;color:var(--ink3);white-space:nowrap;}
.tdiv{width:1px;height:16px;background:var(--line2);}

/* ── SECTION ── */
.sec{padding:clamp(72px,9vw,116px) 0;}
.w{max-width:1200px;margin:0 auto;padding:0 clamp(16px,4vw,56px);}
.label{
  display:inline-flex;align-items:center;gap:8px;
  font-size:10.5px;font-weight:700;letter-spacing:3px;
  text-transform:uppercase;color:var(--teal);
  margin-bottom:16px;font-family:var(--display);
}
.label::before{content:'';width:16px;height:1.5px;background:var(--teal);}
.sh{
  font-family:var(--display);font-weight:800;
  font-size:clamp(28px,4vw,46px);color:var(--ink);
  margin-bottom:16px;line-height:1.08;letter-spacing:-.035em;
}
.sh em{font-style:italic;color:var(--teal);}
.sp{font-size:clamp(14px,1.5vw,16.5px);color:var(--ink2);line-height:1.9;font-weight:400;}

/* ── PAIN ── */
.pain-grid{
  display:grid;grid-template-columns:repeat(3,1fr);
  gap:1px;background:var(--line);
  border:1px solid var(--line);border-radius:18px;
  overflow:hidden;margin-top:52px;
}
.pain-card{
  background:var(--s1);padding:clamp(26px,3vw,42px);
  position:relative;overflow:hidden;transition:background .2s;
}
.pain-card:hover{background:var(--s2);}
.pain-card::before{
  content:'';position:absolute;top:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,transparent,rgba(0,201,177,.3),transparent);
  opacity:0;transition:.3s;
}
.pain-card:hover::before{opacity:1;}
.pain-num{
  font-family:var(--display);
  font-size:clamp(56px,8vw,88px);font-weight:900;
  line-height:1;color:rgba(0,201,177,.06);
  margin-bottom:16px;letter-spacing:-.05em;
}
.pain-ico{font-size:26px;display:block;margin-bottom:12px;}
.pain-title{font-family:var(--display);font-size:16px;font-weight:700;color:var(--ink);margin-bottom:8px;letter-spacing:-.02em;}
.pain-desc{font-size:13.5px;color:var(--ink2);line-height:1.8;font-weight:400;}
.pain-tag{
  display:inline-block;margin-top:14px;font-size:11px;
  font-weight:700;color:var(--red);border:1px solid rgba(244,63,94,.22);
  border-radius:6px;padding:3px 9px;letter-spacing:.3px;
}

/* ── HOW ── */
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:52px;}
.step{
  background:var(--s1);border:1px solid var(--line);
  border-radius:16px;padding:28px 24px;position:relative;
  transition:all .22s;
}
.step:hover{border-color:var(--teal3);background:var(--s2);transform:translateY(-3px);}
.step-n{
  width:36px;height:36px;border-radius:9px;
  background:var(--teal2);border:1px solid var(--teal3);
  display:flex;align-items:center;justify-content:center;
  font-family:var(--display);font-size:14px;font-weight:900;
  color:var(--teal);margin-bottom:18px;
}
.step h3{font-family:var(--display);font-size:16px;font-weight:700;color:var(--ink);margin-bottom:8px;letter-spacing:-.02em;}
.step p{font-size:13.5px;color:var(--ink2);line-height:1.75;}
.step-ui{margin-top:16px;background:var(--s3);border:1px solid var(--line);border-radius:10px;padding:10px;}
.step-row{
  display:flex;align-items:center;gap:8px;
  padding:6px 8px;border-radius:7px;margin-bottom:4px;
  font-size:12px;color:var(--ink2);
}
.step-row:last-child{margin-bottom:0;}
.step-row.on{background:var(--teal2);color:var(--teal);font-weight:600;}
.step-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;}
.step:not(:last-child)::after{
  content:'→';position:absolute;right:-14px;top:44px;
  font-size:18px;color:var(--teal);opacity:.3;z-index:2;
}

/* ── DEMO ── */
.demo-layout{display:grid;grid-template-columns:170px 1fr;gap:18px;margin-top:52px;align-items:start;}
.demo-tabs{display:flex;flex-direction:column;gap:7px;}
.demo-tab{
  background:var(--s1);border:1px solid var(--line);
  border-radius:11px;padding:12px 14px;cursor:pointer;transition:all .18s;
}
.demo-tab.on{border-color:var(--teal);background:var(--teal4);}
.demo-tab:hover:not(.on){border-color:var(--line2);background:var(--s2);}
.dt-label{font-size:13px;font-weight:600;color:var(--ink);margin-bottom:2px;font-family:var(--display);}
.dt-sub{font-size:11px;color:var(--ink2);}
.wa-mock{
  background:#0b141a;border-radius:18px;overflow:hidden;
  border:1px solid rgba(255,255,255,.06);
  box-shadow:0 28px 72px rgba(0,0,0,.55);
}
.wa-head{
  background:#1f2c34;padding:13px 17px;
  display:flex;align-items:center;gap:10px;
  border-bottom:1px solid rgba(255,255,255,.05);
}
.wa-av{
  width:34px;height:34px;border-radius:50%;flex-shrink:0;
  background:linear-gradient(135deg,var(--teal),#0ea5e9);
  display:flex;align-items:center;justify-content:center;
  font-weight:900;font-size:13px;color:#000;
}
.wa-name{font-size:13.5px;font-weight:700;color:#e9edef;font-family:var(--display);}
.wa-st{font-size:10.5px;color:var(--wa);}
.wa-body{
  padding:14px;min-height:280px;max-height:340px;
  display:flex;flex-direction:column;gap:9px;
  overflow-y:auto;scrollbar-width:none;
}
.wa-body::-webkit-scrollbar{display:none;}
.wm{
  max-width:80%;padding:9px 13px;border-radius:12px;
  font-size:13.5px;line-height:1.55;white-space:pre-wrap;
  animation:msgIn .22s ease both;
}
.wm.c{background:#005c4b;color:#e9edef;align-self:flex-end;border-radius:12px 4px 12px 12px;}
.wm.a{background:#1a2d22;border:1px solid rgba(37,211,102,.1);color:#e9edef;align-self:flex-start;border-radius:4px 12px 12px 12px;}
.wm.a .al{font-size:9.5px;color:var(--wa);font-weight:700;margin-bottom:4px;display:block;}

/* ── FEATURES ── */
.feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:52px;}
.fc{
  background:var(--s1);border:1px solid var(--line);
  border-radius:16px;padding:26px 22px;transition:all .2s;position:relative;overflow:hidden;
}
.fc::after{
  content:'';position:absolute;top:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,transparent,var(--teal3),transparent);
  opacity:0;transition:.25s;
}
.fc:hover{border-color:var(--teal3);background:var(--s2);transform:translateY(-2px);}
.fc:hover::after{opacity:1;}
.fc-ico{
  width:40px;height:40px;border-radius:9px;
  background:var(--teal2);border:1px solid var(--teal3);
  display:flex;align-items:center;justify-content:center;
  font-size:18px;margin-bottom:14px;
}
.fc-badge{
  float:right;font-size:9.5px;font-weight:700;
  letter-spacing:.4px;text-transform:uppercase;
  color:var(--teal);background:var(--teal2);
  border:1px solid var(--teal3);padding:2px 7px;border-radius:4px;margin-top:2px;
}
.fc-title{font-family:var(--display);font-size:15px;font-weight:700;color:var(--ink);margin-bottom:7px;clear:both;letter-spacing:-.02em;}
.fc-desc{font-size:13px;color:var(--ink2);line-height:1.75;}

/* ── WHO ── */
.who-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:52px;}
.who-card{
  background:var(--s1);border:1px solid var(--line);
  border-radius:13px;padding:18px 16px;transition:all .18s;
}
.who-card:hover{border-color:var(--teal3);transform:translateY(-2px);background:var(--s2);}
.who-e{font-size:24px;display:block;margin-bottom:8px;}
.who-n{font-family:var(--display);font-size:13.5px;font-weight:700;color:var(--ink);margin-bottom:3px;}
.who-d{font-size:12px;color:var(--ink2);line-height:1.5;}

/* ── VS ── */
.vs-layout{display:grid;grid-template-columns:1fr 1fr;gap:52px;align-items:start;margin-top:52px;}
.vs-pts{display:flex;flex-direction:column;gap:12px;margin-top:20px;}
.vs-pt{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:var(--ink2);line-height:1.7;}
.vs-ck{
  width:18px;height:18px;border-radius:50%;flex-shrink:0;margin-top:2px;
  background:var(--teal2);border:1px solid var(--teal3);
  display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--teal);
}
.vs-tbl{background:var(--s1);border:1px solid var(--line);border-radius:16px;overflow:hidden;}
.vs-head{display:grid;grid-template-columns:1fr 1fr;background:var(--s2);}
.vs-th{padding:12px 20px;font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;}
.vs-th.tm{color:var(--ink3);border-right:1px solid var(--line);}
.vs-th.us{color:var(--teal);}
.vs-row{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid var(--line);}
.vs-c{padding:11px 20px;font-size:13px;display:flex;align-items:center;gap:6px;}
.vs-c.tm{color:var(--ink3);border-right:1px solid var(--line);}
.vs-c.tm::before{content:'✕';color:var(--red);font-size:10px;}
.vs-c.us{color:var(--ink);font-weight:500;}
.vs-c.us::before{content:'✓';color:var(--teal);font-size:11px;}

/* ── TESTIMONIALS ── */
.t-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:52px;}
.tc{
  background:var(--s1);border:1px solid var(--line);
  border-radius:16px;padding:26px;transition:all .2s;
}
.tc:hover{border-color:var(--teal3);transform:translateY(-2px);box-shadow:0 16px 40px rgba(0,0,0,.3);}
.tc-result{
  display:inline-block;background:var(--teal2);border:1px solid var(--teal3);
  color:var(--teal);font-size:10.5px;font-weight:700;
  padding:3px 10px;border-radius:6px;margin-bottom:12px;
}
.tc-stars{color:var(--amber);font-size:11.5px;letter-spacing:2px;margin-bottom:11px;}
.tc-quote{
  font-size:14px;color:var(--ink2);line-height:1.85;
  margin-bottom:18px;font-style:italic;
  font-family:'DM Sans',sans-serif;
}
.tc-auth{display:flex;align-items:center;gap:10px;}
.tc-av{
  width:36px;height:36px;border-radius:50%;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  font-weight:800;font-size:13px;color:#fff;
}
.tc-name{font-family:var(--display);font-size:13px;font-weight:700;color:var(--ink);}
.tc-biz{font-size:11.5px;color:var(--ink2);}
.tc-ver{font-size:10px;color:var(--teal);font-weight:600;margin-top:2px;}

/* ── FOUNDER ── */
.founder-sec{
  padding:clamp(72px,9vw,116px) 0;
  background:var(--s1);
  border-top:1px solid var(--line);border-bottom:1px solid var(--line);
  position:relative;overflow:hidden;
}
.founder-card{
  background:var(--s2);border:1px solid var(--line2);
  border-radius:22px;padding:clamp(32px,5vw,56px);
  position:relative;overflow:hidden;max-width:860px;margin:0 auto;
}
.founder-card::before{
  content:'';position:absolute;top:0;left:8%;right:8%;height:1px;
  background:linear-gradient(90deg,transparent,var(--teal),transparent);
}
.founder-qmark{
  font-size:80px;line-height:.8;color:rgba(0,201,177,.08);
  font-family:var(--display);margin-bottom:10px;display:block;
}
.founder-body{
  font-size:clamp(15px,1.6vw,17px);color:var(--ink2);
  line-height:2;font-weight:400;margin-bottom:32px;
}
.founder-body strong{color:var(--ink);font-weight:600;}
.founder-body em{font-style:italic;color:var(--teal);}
.founder-highlight{
  display:block;background:rgba(244,63,94,.07);
  border-left:2px solid var(--red);
  padding:12px 16px;border-radius:0 8px 8px 0;
  margin:12px 0;font-size:15px;color:var(--ink);font-style:normal;
}
.founder-profile{
  display:flex;align-items:center;gap:16px;
  padding-top:24px;border-top:1px solid var(--line);
}
.founder-av{
  width:50px;height:50px;border-radius:50%;flex-shrink:0;
  background:linear-gradient(135deg,var(--teal),#0ea5e9);
  display:flex;align-items:center;justify-content:center;
  font-weight:900;font-size:18px;color:#000;
}
.founder-name{font-family:var(--display);font-size:15px;font-weight:700;color:var(--ink);}
.founder-role{font-size:12.5px;color:var(--ink2);margin-top:1px;}
.founder-co{font-size:11.5px;color:var(--teal);font-weight:600;margin-top:2px;}

/* ── PRICING ── */
.p-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:52px;align-items:start;}
.plan{
  background:var(--s1);border:1px solid var(--line);
  border-radius:18px;padding:clamp(22px,3vw,36px) clamp(18px,3vw,28px);
  position:relative;transition:all .2s;
}
.plan:hover:not(.pop){border-color:var(--teal3);}
.plan.pop{
  background:var(--s2);border-color:rgba(0,201,177,.28);
  box-shadow:0 0 0 1px rgba(0,201,177,.06),0 24px 64px rgba(0,201,177,.06);
}
.plan.pop::before{
  content:'';position:absolute;top:0;left:14%;right:14%;height:1px;
  background:linear-gradient(90deg,transparent,var(--teal),transparent);
}
.p-badge{
  position:absolute;top:-1px;left:50%;transform:translateX(-50%);
  background:var(--teal);color:#000;font-family:var(--display);
  font-size:10px;font-weight:800;padding:3px 14px;
  border-radius:0 0 9px 9px;white-space:nowrap;
}
.p-tier{font-family:var(--display);font-size:10px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:var(--ink2);margin-bottom:5px;}
.p-tag{font-size:13px;color:var(--ink2);margin-bottom:18px;}
.p-price{display:flex;align-items:baseline;gap:1px;margin-bottom:3px;}
.p-rs{font-size:17px;font-weight:700;color:var(--ink);margin-top:5px;}
.p-amt{font-family:var(--display);font-size:clamp(42px,5vw,54px);font-weight:900;color:var(--ink);line-height:1;letter-spacing:-.04em;}
.plan.pop .p-amt,.plan.pop .p-rs{color:var(--teal);}
.p-mo{font-size:12px;color:var(--ink2);margin-bottom:16px;}
.p-value{
  display:flex;align-items:flex-start;gap:7px;
  background:var(--teal4);border:1px solid var(--teal3);
  border-radius:8px;padding:9px 11px;margin-bottom:20px;
  font-size:12px;color:var(--teal);font-weight:600;line-height:1.45;
}
.p-hr{border:none;border-top:1px solid var(--line);margin:16px 0;}
.p-list{list-style:none;display:flex;flex-direction:column;gap:9px;margin-bottom:24px;}
.p-list li{display:flex;align-items:flex-start;gap:7px;font-size:13px;line-height:1.5;}
.p-list li.inc{color:var(--ink2);}
.p-list li.inc::before{content:'✓';color:var(--teal);font-size:10px;margin-top:2px;flex-shrink:0;font-weight:800;}
.p-list li.exc{color:var(--ink3);text-decoration:line-through;}
.p-list li.exc::before{content:'✕';color:var(--ink3);font-size:10px;margin-top:2px;flex-shrink:0;}
.p-list li.hi{color:var(--ink);font-weight:600;}
.p-list li.hi::before{content:'✓';color:var(--teal);font-size:10px;margin-top:2px;flex-shrink:0;font-weight:800;}
.p-btn{
  display:block;text-align:center;padding:12px;
  border-radius:10px;font-weight:700;font-size:14px;
  text-decoration:none;transition:all .2s;
  font-family:var(--display);letter-spacing:-.1px;
}
.p-btn.go{background:var(--teal);color:#000;}
.p-btn.go:hover{background:#00e5cc;box-shadow:0 8px 24px rgba(0,201,177,.28);}
.p-btn.out{background:transparent;color:var(--ink);border:1px solid var(--line2);}
.p-btn.out:hover{border-color:var(--teal);color:var(--teal);}
.p-foot{text-align:center;margin-top:20px;font-size:13px;color:var(--ink2);}

/* ── FAQ ── */
.faq-box{max-width:680px;margin:52px auto 0;border:1px solid var(--line);border-radius:16px;overflow:hidden;background:var(--s1);}
.fi{border-bottom:1px solid var(--line);}
.fi:last-child{border-bottom:none;}
.fb{
  width:100%;background:none;border:none;padding:18px 24px;
  text-align:left;font-size:14.5px;font-weight:600;color:var(--ink);
  cursor:pointer;display:flex;justify-content:space-between;align-items:center;
  gap:12px;font-family:var(--display);transition:background .15s;letter-spacing:-.02em;
}
.fb:hover{background:rgba(255,255,255,.02);}
.fp{
  width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,.05);
  display:flex;align-items:center;justify-content:center;
  font-size:15px;color:var(--ink2);flex-shrink:0;transition:all .2s;line-height:1;
}
.fa{
  padding:0 24px;font-size:14px;color:var(--ink2);line-height:1.85;
  max-height:0;overflow:hidden;transition:max-height .3s ease,padding .3s ease;
}
.fi.op .fa{max-height:220px;padding:0 24px 20px;}
.fi.op .fp{background:var(--teal2);color:var(--teal);transform:rotate(45deg);}

/* ── CTA ── */
.cta-sec{
  padding:clamp(72px,9vw,116px) clamp(16px,4vw,56px);
  text-align:center;background:var(--base);position:relative;overflow:hidden;
}
.cta-sec::before{
  content:'';position:absolute;top:50%;left:50%;
  transform:translate(-50%,-50%);
  width:min(800px,100vw);height:600px;
  background:radial-gradient(ellipse,rgba(0,201,177,.05),transparent 60%);
  pointer-events:none;
}
.cta-card{
  max-width:740px;margin:0 auto;position:relative;z-index:1;
  background:var(--s1);border:1px solid var(--teal3);
  border-radius:24px;padding:clamp(44px,6vw,80px) clamp(28px,5vw,64px);overflow:hidden;
}
.cta-card::before{
  content:'';position:absolute;top:0;left:8%;right:8%;height:1px;
  background:linear-gradient(90deg,transparent,var(--teal),transparent);
}
.cta-h{
  font-family:var(--display);font-size:clamp(30px,4.5vw,52px);
  color:var(--ink);margin-bottom:16px;line-height:1.07;
  letter-spacing:-.04em;font-weight:800;
}
.cta-h em{font-style:italic;color:var(--teal);}
.cta-p{font-size:clamp(14px,1.6vw,16.5px);color:var(--ink2);margin-bottom:36px;line-height:1.85;}
.cta-btns{display:flex;align-items:center;justify-content:center;gap:11px;flex-wrap:wrap;}
.cta-note{margin-top:18px;font-size:12px;color:var(--ink3);}

/* ── EXIT BAR ── */
.exit-bar{
  position:fixed;bottom:0;left:0;right:0;z-index:300;
  background:var(--s2);border-top:1px solid var(--teal3);
  padding:13px clamp(16px,4vw,56px);
  display:flex;align-items:center;justify-content:space-between;
  gap:14px;flex-wrap:wrap;
  transform:translateY(100%);transition:transform .4s cubic-bezier(.22,1,.36,1);
}
.exit-bar.show{transform:none;}
.exit-txt{font-size:14px;color:var(--ink2);}
.exit-txt strong{color:var(--ink);}
.exit-acts{display:flex;align-items:center;gap:9px;flex-shrink:0;}
.exit-cta{
  display:inline-flex;align-items:center;gap:6px;
  background:var(--teal);color:#000;padding:9px 20px;
  border-radius:8px;font-weight:700;font-size:13.5px;
  text-decoration:none;transition:all .2s;font-family:var(--display);
}
.exit-cta:hover{background:#00e5cc;}
.exit-close{
  background:none;border:1px solid var(--line2);color:var(--ink3);
  padding:8px 13px;border-radius:8px;cursor:pointer;
  font-size:13px;transition:all .15s;font-family:var(--sans);
}
.exit-close:hover{color:var(--ink);border-color:var(--line3);}

/* ── FOOTER ── */
footer{background:var(--s1);border-top:1px solid var(--line);padding:clamp(48px,6vw,68px) clamp(16px,4vw,56px) clamp(28px,4vw,38px);}
.ft{max-width:1200px;margin:0 auto;}
.ft-top{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:clamp(24px,4vw,52px);margin-bottom:clamp(32px,4vw,44px);}
.ft-tagline{font-size:13px;color:var(--ink2);line-height:1.85;margin-top:12px;max-width:260px;}
.ft-badges{display:flex;gap:7px;flex-wrap:wrap;margin-top:14px;}
.ft-badge{font-size:11px;color:var(--ink3);background:var(--s2);border:1px solid var(--line);border-radius:6px;padding:3px 8px;}
.ft-hd{font-family:var(--display);font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--ink3);margin-bottom:14px;}
.ft-lks{list-style:none;display:flex;flex-direction:column;gap:9px;}
.ft-lks a{font-size:13.5px;color:var(--ink2);text-decoration:none;transition:color .14s;}
.ft-lks a:hover{color:var(--teal);}
.ft-bot{padding-top:22px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--ink3);flex-wrap:wrap;gap:7px;}

/* ── REVEAL ── */
.fade{opacity:0;transform:translateY(20px);transition:opacity .65s ease,transform .65s ease;}
.fade.vis{opacity:1;transform:none;}

/* ── MARQUEE ── */
.mq{border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--s1);padding:12px 0;overflow:hidden;position:relative;}
.mq::before,.mq::after{content:'';position:absolute;top:0;bottom:0;width:60px;z-index:2;}
.mq::before{left:0;background:linear-gradient(90deg,var(--s1),transparent);}
.mq::after{right:0;background:linear-gradient(-90deg,var(--s1),transparent);}
.mq-track{display:flex;animation:mq 30s linear infinite;width:max-content;}
@keyframes mq{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.mq-item{display:flex;align-items:center;gap:6px;padding:0 20px;font-size:13px;font-weight:500;color:var(--ink3);white-space:nowrap;border-right:1px solid var(--line);}

/* ── MOBILE ── */
@media(max-width:768px){
  .nav{padding:0 14px;}
  .nmid,.nav-login{display:none;}
  .hbg{display:flex;}
  .hero{padding:80px 14px 48px;min-height:auto;}
  .hero-in{grid-template-columns:1fr;gap:24px;}
  .h1{font-size:clamp(34px,9vw,46px);min-height:auto;}
  .hero-btns{flex-direction:column;align-items:stretch;}
  .btn-primary,.btn-ghost{justify-content:center;}
  .stats-row{grid-template-columns:1fr;}
  .stat-cell{border-right:none;border-bottom:1px solid var(--line);}
  .stat-cell:last-child{border-bottom:none;}
  .pain-grid{grid-template-columns:1fr;gap:0;}
  .pain-card{border-bottom:1px solid var(--line);}
  .steps{grid-template-columns:1fr;gap:12px;}
  .step:not(:last-child)::after{display:none;}
  .demo-layout{grid-template-columns:1fr;gap:12px;}
  .demo-tabs{display:grid;grid-template-columns:1fr 1fr;gap:7px;}
  .feat-grid{grid-template-columns:1fr;gap:10px;}
  .who-grid{grid-template-columns:repeat(2,1fr);gap:9px;}
  .vs-layout{grid-template-columns:1fr;gap:24px;}
  .p-grid{grid-template-columns:1fr;gap:14px;}
  .t-grid{grid-template-columns:1fr;gap:10px;}
  .cta-card{padding:32px 18px;border-radius:18px;}
  .cta-btns{flex-direction:column;align-items:stretch;}
  .cta-btns a{justify-content:center;}
  .ft-top{grid-template-columns:1fr;gap:28px;}
  .ft-tagline{max-width:100%;}
  .ft-bot{flex-direction:column;text-align:center;}
  .sec{padding:clamp(48px,7vw,72px) 0;}
  .mq{display:none;}
  .exit-bar{flex-direction:column;align-items:flex-start;}
  .hero-proof{flex-direction:column;align-items:flex-start;}
}
@media(min-width:769px) and (max-width:1100px){
  .nmid,.nav-login{display:none;}
  .hbg{display:flex;}
  .feat-grid{grid-template-columns:repeat(2,1fr);}
  .who-grid{grid-template-columns:repeat(3,1fr);}
  .t-grid{grid-template-columns:repeat(2,1fr);}
  .ft-top{grid-template-columns:1fr 1fr;gap:32px;}
  .hero-in{grid-template-columns:1fr 380px;}
  .vs-layout{grid-template-columns:1fr;}
}
    `}</style>

    {/* EXIT BAR */}
    {!exitGone && (
      <div className={`exit-bar${exitShow?" show":""}`}>
        <div className="exit-txt"><strong>Still deciding?</strong> Start free — 14 days, no credit card, cancel anytime.</div>
        <div className="exit-acts">
          <a href="/signup" className="exit-cta">Start Free Trial →</a>
          <button className="exit-close" onClick={()=>{setExitShow(false);setExitGone(true);}}>Maybe later</button>
        </div>
      </div>
    )}

    {/* NAV */}
    <nav className={`nav${scrolled?" sc":""}`}>
     <a href="/" className="logo" style={{display:"flex",alignItems:"center",gap:"10px"}}>
  <img 
    src="/logo.png" 
    width="60" 
    height="60" 
    alt="Fastrill" 
    style={{display:"block",objectFit:"contain",flexShrink:0}} 
  />
  <span style={{fontWeight:800,fontSize:28,color:"#fff",letterSpacing:"-0.3px",lineHeight:1}}>
    fast<span style={{color:"#00C9B1"}}>rill</span>
  </span>
</a>
      <ul className="nmid">
        {[["#pain","The Problem"],["#how","How It Works"],["#demo","Demo"],["#pricing","Pricing"],["#founder","Our Story"],["#faq","FAQ"]].map(([h,l])=>(
          <li key={h}><a href={h}>{l}</a></li>
        ))}
      </ul>
      <div className="nr">
        <a href="/login" className="nav-login">Log in</a>
        <a href="/signup" className="nav-cta">Start Free →</a>
        <button className="hbg" onClick={()=>setMobOpen(p=>!p)}>☰</button>
      </div>
    </nav>
    <div className={`mdraw${mobOpen?" open":""}`}>
      {[["#pain","The Problem"],["#how","How It Works"],["#demo","Demo"],["#pricing","Pricing"],["#founder","Our Story"],["#faq","FAQ"]].map(([h,l])=>(
        <a key={h} href={h} onClick={()=>setMobOpen(false)}>{l}</a>
      ))}
      <hr/>
      <a href="/login" onClick={()=>setMobOpen(false)}>Log in</a>
      <a href="/signup" onClick={()=>setMobOpen(false)} style={{color:"var(--teal)",fontWeight:700}}>Start Free Trial →</a>
    </div>

    {/* ── HERO ── */}
    <section className="hero">
      <div className="hero-grid-bg"/>
      <div className="hero-in">
        <div>
          <div className="hero-eyebrow">
            <div className="eyebrow-dot"/>
            🇮🇳 Built for Indian businesses
          </div>
          <h1 className="h1">{HEADLINES[heroIdx]}</h1>
          <p className="hero-sub">
            Every lead that messages you on WhatsApp is worth money. Most businesses reply in hours — or not at all. Fastrill replies in 2 seconds, books the appointment, and sends the confirmation. Automatically. In their language.
          </p>
          <div className="hero-btns">
            <a href="/signup" className="btn-primary">Start Free — No Card Needed →</a>
            <a href="#demo" className="btn-ghost">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M6.5 5.5l4 2.5-4 2.5V5.5z" fill="currentColor"/></svg>
              See it live
            </a>
          </div>
          <div className="hero-proof">
            <div className="proof-avs">
              {[["#f59e0b","P"],["#10b981","R"],["#38bdf8","S"],["#a855f7","A"],["#ef4444","N"]].map(([c,i],idx)=>(
                <div key={idx} className="proof-av" style={{background:`linear-gradient(135deg,${c},${c}88)`}}>{i}</div>
              ))}
            </div>
            <div className="proof-text">
              <strong>80+ businesses</strong> already converting more leads on WhatsApp ★★★★★
            </div>
          </div>
        </div>

        {/* Phone mockup with live demo */}
        <div className="phone-wrap fade">
          <div className="phone">
            <div className="phone-top">
              <div className="phone-av">R</div>
              <div>
                <div className="phone-name">Riya Salon <span className="ai-live-badge">AI</span></div>
                <div className="phone-status">Fastrill AI · Online now</div>
              </div>
            </div>
            <div className="phone-body" ref={demoRef}>
              {DEMOS.booking.map((m,i)=>(
                <div key={i} className={`pm ${m.r}`}>
                  {m.r==="a"&&<span className="ai-label">◈ Fastrill AI</span>}
                  {m.m.split("\n").map((l,j,arr)=><span key={j}>{l}{j<arr.length-1&&<br/>}</span>)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* TRUST BAR */}
    <div className="trust">
      {[{i:"🔒",t:"256-bit Encrypted"},{i:"🇮🇳",t:"India Servers"},{i:"⚡",t:"2-sec Response"},{i:"🌐",t:"10+ Languages"},{i:"⭐",t:"4.9/5 Rating"},{i:"🛡️",t:"Zero Data Sharing"}].map((b,i,arr)=>(
        <span key={b.t} style={{display:"flex",alignItems:"center",gap:"clamp(14px,3vw,36px)"}}>
          <span className="tbadge"><span>{b.i}</span>{b.t}</span>
          {i<arr.length-1&&<span className="tdiv"/>}
        </span>
      ))}
    </div>

    {/* MARQUEE */}
    <div className="mq">
      <div className="mq-track">
        {[...Array(2)].map((_,r)=>
          ["💈 Salons","🧖 Spas","🏥 Clinics","🦷 Dental","💪 Gyms","💅 Nail Studios","🏠 Real Estate","🎓 Coaching","🍽️ Restaurants","💻 Agencies","🌿 Ayurveda","🏪 Retail"].map(b=>(
            <div key={r+b} className="mq-item">{b}</div>
          ))
        )}
      </div>
    </div>

    {/* STATS */}
    <div className="stats" ref={statsRef}>
      <div className="stats-row">
        {[
          {n:counts.a.toLocaleString("en-IN"),s:"+",l:"Bookings automated monthly",d:"across active businesses on the platform"},
          {n:counts.b,s:"%",l:"Faster than human reply",d:"average 1.8 second AI response time"},
          {n:counts.c,s:"%",l:"Fewer missed leads",d:"businesses see in their first 30 days"},
        ].map((s,i)=>(
          <div key={i} className="stat-cell fade">
            <div className="stat-n">{s.n}<em>{s.s}</em></div>
            <div className="stat-l">{s.l}</div>
            <div className="stat-s">{s.d}</div>
          </div>
        ))}
      </div>
    </div>

    {/* PAIN */}
    <section className="sec" id="pain" style={{background:"var(--base)"}}>
      <div className="w">
        <div className="fade" style={{maxWidth:600}}>
          <div className="label">The real problem</div>
          <h2 className="sh">You're not losing leads.<br />You're losing them <em>after they arrive.</em></h2>
          <p className="sp" style={{maxWidth:480}}>Most businesses spend thousands on ads and get the leads. The breakdown happens in the WhatsApp inbox — and it costs far more than the ads themselves.</p>
        </div>
        <div className="pain-grid">
          {[
            {n:"01",ico:"🌙",title:"Leads die after hours",desc:"A customer messages at 10 PM about your bridal package. You see it at 9 AM. She's already booked someone who replied in 2 minutes. That's ₹8,500 gone — not from bad ads, from a 10-hour silence.",tag:"Revenue lost"},
            {n:"02",ico:"⏳",title:"Speed wins the booking",desc:"A lead is hottest in the first 5 minutes. After that, conversion probability drops by 80%. Your competitor who replies in 2 seconds wins the appointment — even if your service is better.",tag:"Competitive loss"},
            {n:"03",ico:"😤",title:"One ignored message = one bad review",desc:"An upset customer messages at peak hour. Your staff is busy. The delay makes it worse. Fastrill responds in 2 seconds with genuine empathy — de-escalating before the situation reaches Google Reviews.",tag:"Reputation risk"},
          ].map(p=>(
            <div key={p.n} className="pain-card">
              <div className="pain-num">{p.n}</div>
              <span className="pain-ico">{p.ico}</span>
              <div className="pain-title">{p.title}</div>
              <div className="pain-desc">{p.desc}</div>
              <div className="pain-tag">{p.tag}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* HOW */}
    <section className="sec" id="how" style={{background:"var(--s1)"}}>
      <div className="w">
        <div className="fade">
          <div className="label">How it works</div>
          <h2 className="sh">Live in 10 minutes.<br /><em>Zero technical knowledge.</em></h2>
          <p className="sp" style={{maxWidth:460}}>No developer. No training data. No complicated setup. Three steps from zero to a fully automated WhatsApp business.</p>
        </div>
        <div className="steps">
          {[
            {n:"1",title:"Connect WhatsApp",desc:"Link your existing WhatsApp Business number via Meta's official API. One click. Your customers keep messaging the same number.",rows:[{on:true,dot:"#10b981",t:"WhatsApp Business connected"},{on:false,dot:"#404858",t:"Phone: +91 98765 43210"},{on:true,dot:"#10b981",t:"Status: Active ✓"}]},
            {n:"2",title:"Add Your Services",desc:"Add services, prices, working hours, and any custom instructions — plain English or Hindi. The AI learns your business instantly.",rows:[{on:true,dot:"#10b981",t:"Haircut — ₹400 · 30 min"},{on:true,dot:"#10b981",t:"Hair Spa — ₹800 · 60 min"},{on:true,dot:"#10b981",t:"Facial — ₹1,200 · 60 min"}]},
            {n:"3",title:"AI Handles Everything",desc:"Every customer gets an instant, intelligent reply. Bookings confirmed, leads qualified, revenue tracked — all live in your dashboard.",rows:[{on:true,dot:"#10b981",t:"✅ Booking confirmed · Priya · 3PM"},{on:true,dot:"#38bdf8",t:"📋 New lead · Rahul · Bridal pkg"},{on:false,dot:"#f59e0b",t:"💬 Anita asking about pricing"}]},
          ].map(s=>(
            <div key={s.n} className="step fade">
              <div className="step-n">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              <div className="step-ui">
                {s.rows.map((r,i)=>(
                  <div key={i} className={`step-row${r.on?" on":""}`}>
                    <div className="step-dot" style={{background:r.on?r.dot:"var(--ink3)"}}/>
                    {r.t}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* DEMO */}
    <section className="sec" id="demo" style={{background:"var(--base)"}}>
      <div className="w">
        <div className="fade">
          <div className="label">Live demo</div>
          <h2 className="sh">Real conversations.<br /><em>Real intelligence.</em></h2>
          <p className="sp" style={{maxWidth:460}}>Click any scenario to see Fastrill AI in action — instant replies, any language, any context.</p>
        </div>
        <div className="demo-layout">
          <div className="demo-tabs fade">
            {DEMO_META.map(s=>(
              <div key={s.k} className={`demo-tab${demoKey===s.k?" on":""}`} onClick={()=>setDemoKey(s.k)}>
                <div className="dt-label">{s.label}</div>
                <div className="dt-sub">{s.sub}</div>
              </div>
            ))}
          </div>
          <div className="wa-mock fade">
            <div className="wa-head">
              <div className="wa-av">R</div>
              <div>
                <div className="wa-name">Riya Salon</div>
                <div className="wa-st">◈ Fastrill AI · Online</div>
              </div>
            </div>
            <div className="wa-body" ref={demoRef}>
              {demoMsgs.map((m,i)=>(
                <div key={i} className={`wm ${m.r}`}>
                  {m.r==="a"&&<span className="al">◈ Fastrill AI</span>}
                  {m.m.split("\n").map((l,j,arr)=><span key={j}>{l}{j<arr.length-1&&<br/>}</span>)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* FEATURES */}
    <section className="sec" id="features" style={{background:"var(--s1)"}}>
      <div className="w">
        <div className="fade">
          <div className="label">Features</div>
          <h2 className="sh">Not a chatbot.<br /><em>A revenue system.</em></h2>
          <p className="sp" style={{maxWidth:480}}>Built with genuine intelligence — multilingual support, emotion detection, customer memory, and lead recovery. Everything a trained human receptionist does, at unlimited scale.</p>
        </div>
        <div className="feat-grid">
          {[
            {i:"🧠",badge:"Core AI",title:"Real Intent Detection",desc:"Understands 'I want to come tomorrow evening for a facial' — not just keywords. Works across all 10+ Indian languages automatically."},
            {i:"💬",badge:"Language",title:"10+ Indian Languages",desc:"Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, English — auto-detected per conversation."},
            {i:"🔄",badge:"Smart",title:"Handles Any Interruption",desc:"Customer asks a price question mid-booking? AI answers and returns to the booking flow — exactly like a trained human would."},
            {i:"😤",badge:"EQ",title:"Emotion Detection",desc:"Detects frustration or anger in real time. Switches to empathy mode — de-escalates before you even know there's an issue."},
            {i:"🧩",badge:"Memory",title:"Remembers Every Customer",desc:"Preferred services, favourite times, past visits, language preference. Return customers feel recognised, not like strangers."},
            {i:"🎯",badge:"Revenue",title:"Lead Recovery Engine",desc:"Customer dropped mid-booking? Fastrill follows up at the right moment. Every missed lead gets a second chance automatically."},
            {i:"👤",badge:"Control",title:"Human Handoff",desc:"Knows when to stop — refunds, disputes, complex cases. Pauses and notifies you with full conversation context."},
            {i:"📢",badge:"Marketing",title:"WhatsApp Campaigns",desc:"Send personalised messages to customer segments. Track opens, replies, bookings — directly attributed to each campaign."},
            {i:"📊",badge:"Analytics",title:"Revenue Dashboard",desc:"Conversations, bookings, campaigns, leads — all in one view. Track AI quality and revenue impact live."},
          ].map(f=>(
            <div key={f.title} className="fc fade">
              <div className="fc-badge">{f.badge}</div>
              <div className="fc-ico">{f.i}</div>
              <div className="fc-title">{f.title}</div>
              <div className="fc-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* WHO */}
    <section className="sec" style={{background:"var(--base)"}}>
      <div className="w">
        <div className="fade" style={{textAlign:"center"}}>
          <div className="label" style={{justifyContent:"center"}}>Who it's for</div>
          <h2 className="sh" style={{textAlign:"center"}}>Any business that runs<br /><em>on customers</em></h2>
          <p className="sp" style={{maxWidth:440,margin:"0 auto"}}>If customers message you on WhatsApp and you want to convert more of them — Fastrill works for you.</p>
        </div>
        <div className="who-grid">
          {[
            {e:"💈",n:"Salons & Parlours",d:"Bookings, pricing, reschedules"},
            {e:"🧖",n:"Spas & Wellness",d:"Sessions, packages, follow-ups"},
            {e:"🏥",n:"Clinics & Doctors",d:"Appointments, reminders, reports"},
            {e:"🦷",n:"Dental Clinics",d:"Checkups, treatments, recalls"},
            {e:"💪",n:"Gyms & Fitness",d:"PT sessions, memberships, trials"},
            {e:"💅",n:"Nail & Makeup",d:"Bookings, bridal, extensions"},
            {e:"🏠",n:"Real Estate",d:"Qualify leads, site visit bookings"},
            {e:"🎓",n:"Coaching & Tutoring",d:"Discovery calls, enrolments"},
            {e:"🍽️",n:"Restaurants",d:"Reservations, menu questions"},
            {e:"💻",n:"Agencies",d:"Lead qualification, demo bookings"},
            {e:"🌿",n:"Ayurveda & Physio",d:"Consultations, therapy sessions"},
            {e:"🏪",n:"Retail & D2C",d:"Orders, stock queries, support"},
          ].map(u=>(
            <div key={u.n} className="who-card fade">
              <span className="who-e">{u.e}</span>
              <div className="who-n">{u.n}</div>
              <p className="who-d">{u.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* VS */}
    <section className="sec" style={{background:"var(--s1)"}}>
      <div className="w">
        <div className="vs-layout">
          <div className="fade">
            <div className="label">Why Fastrill</div>
            <h2 className="sh">Not just another<br /><em>WhatsApp tool</em></h2>
            <p className="sp">Most tools give you rigid button menus that break the moment a customer says anything unexpected. Fastrill actually understands — in any language, in any context.</p>
            <div className="vs-pts">
              {[
                "Natural conversation — not preset button menus",
                "Remembers every customer across all conversations",
                "Handles any message, not just expected inputs",
                "Detects emotion and adapts tone in real time",
                "Never guesses on pricing, policy, or availability",
                "Knows exactly when to hand off to a human",
                "Built specifically for Indian languages and context",
              ].map(p=>(
                <div key={p} className="vs-pt"><div className="vs-ck">✓</div>{p}</div>
              ))}
            </div>
          </div>
          <div className="vs-tbl fade">
            <div className="vs-head">
              <div className="vs-th tm">Other tools</div>
              <div className="vs-th us">Fastrill</div>
            </div>
            {[
              ["Fixed button menus","Natural conversation"],
              ["English only","10+ Indian languages"],
              ["Breaks on unexpected","Handles anything"],
              ["No customer memory","Remembers everything"],
              ["No emotion awareness","Adapts to mood"],
              ["Per-message billing","Flat monthly unlimited"],
              ["Needs a developer","10-min self-setup"],
              ["Generic bot replies","Business-specific AI"],
            ].map(([t,u])=>(
              <div key={t} className="vs-row">
                <div className="vs-c tm">{t}</div>
                <div className="vs-c us">{u}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* TESTIMONIALS */}
    <section className="sec" style={{background:"var(--base)"}}>
      <div className="w">
        <div className="fade" style={{textAlign:"center"}}>
          <div className="label" style={{justifyContent:"center"}}>Results</div>
          <h2 className="sh" style={{textAlign:"center"}}>Real revenue from<br /><em>real Indian businesses</em></h2>
          <p className="sp" style={{maxWidth:420,margin:"0 auto"}}>From salons in Hyderabad to clinics in Vijayawada — businesses that reply faster book more.</p>
        </div>
        <div className="t-grid">
          {TESTIMONIALS.map(t=>(
            <div key={t.name} className="tc fade">
              <div className="tc-result">📈 {t.result}</div>
              <div className="tc-stars">★★★★★</div>
              <p className="tc-quote">"{t.quote}"</p>
              <div className="tc-auth">
                <div className="tc-av" style={{background:`linear-gradient(${t.grad})`}}>{t.init}</div>
                <div>
                  <div className="tc-name">{t.name}</div>
                  <div className="tc-biz">{t.biz}</div>
                  <div className="tc-ver">✅ Verified Customer</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* FOUNDER */}
    <section className="founder-sec" id="founder">
      <div className="w">
        <div className="fade" style={{textAlign:"center",marginBottom:40}}>
          <div className="label" style={{justifyContent:"center"}}>Why we built this</div>
          <h2 className="sh" style={{textAlign:"center"}}>The story behind<br /><em>Fastrill</em></h2>
        </div>
        <div className="founder-card fade">
          <span className="founder-qmark">"</span>
          <p className="founder-body">
            I've spent years in digital marketing — running ads, building funnels, optimising campaigns for businesses across India. I know how hard it is to get a lead. The targeting, the creative, the budget, the testing. Every lead costs money. Real money.<br /><br />
            And yet, the single most common thing I saw across <strong>every single client</strong> — salons, clinics, gyms, coaching centres, real estate agents — was this:<br /><br />
            <em className="founder-highlight">💸 Leads were arriving. And dying in the WhatsApp inbox.</em><br /><br />
            A customer messages at 10 PM — interested, ready to book. Nobody replies until morning. By then, they've moved on. You spent ₹300 on that click. It just evaporated.<br /><br />
            I saw a salon owner in Hyderabad spending <strong>₹40,000/month on Instagram ads</strong>. Her ROAS looked decent on paper. But when we dug in — almost 60% of the leads who messaged never got a reply within the hour. Her actual conversion rate was less than half of what it could be. Not because of bad ads. Because of slow replies.<br /><br />
            <strong>The problem was never the ads. It was always the follow-up.</strong><br /><br />
            So we built Fastrill — not as another chatbot, but as a <em>revenue recovery system</em>. Something that sits between your ad spend and your bank account, and makes sure every lead gets an instant, intelligent reply — in their language, at any hour, without you lifting a finger.
          </p>
          <div className="founder-profile">
            <div className="founder-av">G</div>
            <div>
              <div className="founder-name">Ganapathi</div>
              <div className="founder-role">Founder · Digital Marketing Strategist</div>
              <div className="founder-co">Fastrill — by Solvabil Pvt. Ltd. 🇮🇳</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* PRICING */}
    <section className="sec" id="pricing" style={{background:"var(--base)"}}>
      <div className="w">
        <div className="fade" style={{textAlign:"center"}}>
          <div className="label" style={{justifyContent:"center"}}>Pricing</div>
          <h2 className="sh" style={{textAlign:"center"}}>Simple pricing.<br /><em>Pays for itself.</em></h2>
          <p className="sp" style={{maxWidth:420,margin:"0 auto"}}>No per-message fees. Flat monthly. One extra booking per week covers the entire plan.</p>
        </div>
        <div className="p-grid">
          {[
            { tier:"Starter", price:"999", tag:"Solo operators & new businesses", cta:"Get Started", cs:"out", pop:false,
              value:"💡 1 extra booking/week = plan fully paid off",
              feats:[{c:"inc",t:"1 WhatsApp number"},{c:"inc",t:"300 AI conversations/month"},{c:"inc",t:"Appointment booking automation"},{c:"inc",t:"10+ Indian languages"},{c:"exc",t:"Customer memory"},{c:"exc",t:"Lead recovery automation"},{c:"exc",t:"WhatsApp campaigns"},{c:"exc",t:"Priority support"}] },
            { tier:"Growth", price:"1,999", tag:"For growing businesses", cta:"Start Free Trial →", cs:"go", pop:true, badge:"Most Popular",
              value:"💡 Unlimited conversations — no per-message fees ever",
              feats:[{c:"inc",t:"1 WhatsApp number"},{c:"inc",t:"Unlimited AI conversations"},{c:"inc",t:"Customer memory & history"},{c:"inc",t:"Lead recovery automation"},{c:"inc",t:"Emotion detection & handoff"},{c:"inc",t:"WhatsApp campaigns"},{c:"hi",t:"Advanced analytics"},{c:"hi",t:"Priority support"}] },
            { tier:"Pro", price:"4,999", tag:"Multi-branch & growing teams", cta:"Contact Sales", cs:"out", pop:false,
              value:"💡 Up to 5 WhatsApp numbers — one dashboard",
              feats:[{c:"inc",t:"Up to 5 WhatsApp numbers"},{c:"inc",t:"Everything in Growth"},{c:"inc",t:"Multi-branch management"},{c:"inc",t:"Staff availability routing"},{c:"hi",t:"Custom AI playbook"},{c:"hi",t:"API access"},{c:"hi",t:"Dedicated onboarding call"},{c:"hi",t:"SLA support"}] },
          ].map(plan=>(
            <div key={plan.tier} className={`plan fade${plan.pop?" pop":""}`}>
              {plan.badge&&<div className="p-badge">{plan.badge}</div>}
              <div className="p-tier">{plan.tier}</div>
              <div className="p-tag">{plan.tag}</div>
              <div className="p-price"><span className="p-rs">₹</span><span className="p-amt">{plan.price}</span></div>
              <div className="p-mo">per month + GST</div>
              <div className="p-value">{plan.value}</div>
              <hr className="p-hr"/>
              <ul className="p-list">{plan.feats.map(f=><li key={f.t} className={f.c}>{f.t}</li>)}</ul>
              <a href="/signup" className={`p-btn ${plan.cs}`}>{plan.cta}</a>
            </div>
          ))}
        </div>
        <p className="p-foot">All plans include a <strong style={{color:"var(--ink)"}}>14-day free trial</strong> · No credit card · Cancel anytime · GST invoice provided</p>
      </div>
    </section>

    {/* FAQ */}
    <section className="sec" id="faq" style={{background:"var(--s1)"}}>
      <div className="w">
        <div className="fade" style={{textAlign:"center"}}>
          <div className="label" style={{justifyContent:"center"}}>FAQ</div>
          <h2 className="sh" style={{textAlign:"center"}}>Honest answers</h2>
          <p className="sp" style={{maxWidth:380,margin:"0 auto"}}>Everything you need to know. No fluff, no pressure.</p>
        </div>
        <div className="faq-box">
          {FAQS.map((q,i)=>(
            <div key={i} className={`fi${openFaq===i?" op":""}`}>
              <button className="fb" onClick={()=>setOpenFaq(openFaq===i?null:i)}>
                {q.q}<span className="fp">+</span>
              </button>
              <div className="fa">{q.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="cta-sec">
      <div className="w">
        <div className="cta-card fade">
          <h2 className="cta-h">Your next customer is<br />messaging you <em>right now</em></h2>
          <p className="cta-p">Don't make them wait. Don't lose them to whoever replies faster.<br/>Fastrill answers in 2 seconds — in their language, every time, 24/7.</p>
          <div className="cta-btns">
            <a href="/signup" className="btn-primary">Start Free Trial — No Card Needed →</a>
            <a href="https://wa.me/919346079265" className="btn-ghost">💬 Chat on WhatsApp</a>
          </div>
          <p className="cta-note">14-day free trial · Setup in 10 minutes · Cancel anytime · No credit card required</p>
        </div>
      </div>
    </section>

    {/* FOOTER */}
    <footer>
      <div className="ft">
        <div className="ft-top">
          <div>
           <a href="/" className="logo" style={{display:"flex",alignItems:"center",gap:"10px"}}>
  <img 
    src="/logo.png" 
    width="34" 
    height="34" 
    alt="Fastrill" 
    style={{display:"block",objectFit:"contain",flexShrink:0}} 
  />
  <span style={{fontWeight:800,fontSize:20,color:"#fff",letterSpacing:"-0.3px",lineHeight:1}}>
    fast<span style={{color:"#00C9B1"}}>rill</span>
  </span>
</a>
            <p className="ft-tagline">AI-powered WhatsApp automation for Indian businesses. Turns every lead into a booked customer — 24/7, in any language.</p>
            <div className="ft-badges">
              {["🔒 SSL Encrypted","🇮🇳 Indian Servers","🛡️ Zero Data Sharing"].map(b=>(
                <div key={b} className="ft-badge">{b}</div>
              ))}
            </div>
          </div>
          {[
            {h:"Product",lks:[["Features","#features"],["Pricing","#pricing"],["Demo","#demo"],["How it works","#how"]]},
            {h:"Company",lks:[["Our Story","#founder"],["Blog","/blog"],["Contact","/contact"]]},
            {h:"Legal",lks:[["Privacy","/privacy"],["Terms","/terms"],["Refund","/refund"]]},
          ].map(col=>(
            <div key={col.h}>
              <div className="ft-hd">{col.h}</div>
              <ul className="ft-lks">{col.lks.map(([n,h])=><li key={n}><a href={h}>{n}</a></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="ft-bot">
          <span>© 2026 Fastrill — a product by Solvabil Pvt. Ltd.</span>
          <span>Made with ❤️ in India 🇮🇳</span>
        </div>
      </div>
    </footer>
  </>)
}
