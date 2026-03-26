"use client"
import { useEffect, useRef, useState } from "react"

const CONVOS = {
  booking:[
    {t:"c",m:"Hi, I want to book a haircut tomorrow"},
    {t:"a",m:"Great! 📅 Tomorrow is Saturday 21st — what time works?\nWe're open 10AM–8PM 😊"},
    {t:"c",m:"3pm works for me"},
    {t:"a",m:"Shall I confirm *Haircut* on *Sat, 21 Mar* at *3:00 PM*? ✅"},
    {t:"c",m:"Yes please!"},
    {t:"a",m:"✅ Confirmed! Haircut booked for Saturday 3PM.\n\nSee you at Riya Salon! 😊"},
  ],
  hindi:[
    {t:"c",m:"Bhai facial karwa sakte hai kya?"},
    {t:"a",m:"Haan bilkul! 😊 Facial ₹1,200 mein available hai.\nKab aana chahenge?"},
    {t:"c",m:"Kal shaam 6 baje"},
    {t:"a",m:"Confirm karu *Facial* kal *6:00 PM* ke liye? ✅"},
    {t:"c",m:"Ha bilkul"},
    {t:"a",m:"✅ Booking ho gayi!\n📋 Facial · 📅 Sat, 21 March · ⏰ 6:00 PM\n\nRiya Salon mein milenge! 😊"},
  ],
  lead:[
    {t:"c",m:"How much is your bridal makeup package?"},
    {t:"a",m:"Our Bridal Package is ₹8,500 💍\nMakeup, hair styling, saree draping & mehendi.\n\nWhen's the wedding?"},
    {t:"c",m:"March 28th"},
    {t:"a",m:"March 28th — slots go fast! 🌸\n\nShall I block the day? We need ₹1,000 advance."},
    {t:"c",m:"Yes let's do it"},
    {t:"a",m:"Wonderful! 💐 Sending payment link now.\n\nYour wedding day will be beautiful!"},
  ],
  angry:[
    {t:"c",m:"Your staff was so rude to me last time. Never coming back"},
    {t:"a",m:"I'm really sorry to hear this 😔 That's absolutely not how we treat customers.\n\nCould you tell me what happened?"},
    {t:"c",m:"The receptionist was dismissive when I asked about pricing"},
    {t:"a",m:"I sincerely apologize. This has been flagged to the manager — someone will call you within the hour.\n\nWe'd love to earn your trust back 🙏"},
  ],
}

const FAQS=[
  {q:"Do I need to change my WhatsApp number?",a:"No. You keep your exact same WhatsApp Business number. Fastrill connects through Meta's official Business API. Your customers message the same number they always have — nothing changes on their end."},
  {q:"Is this only for salons and clinics?",a:"Not at all. Fastrill works for any business that gets customers on WhatsApp — gyms, agencies, real estate, coaching, restaurants, retail, and more. If your customers message you, Fastrill can handle it."},
  {q:"Which Indian languages are supported?",a:"Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, and English — all auto-detected. No setup needed. The AI detects what your customer writes and responds in the same language."},
  {q:"Can I take over from the AI and reply manually?",a:"Yes, always. In your dashboard, toggle AI off for any conversation and reply yourself. The AI waits until you turn it back on. You're fully in control at all times."},
  {q:"What if the AI doesn't know the answer?",a:"It tells the customer it will check and connect them with the team — you get notified immediately. The AI never guesses or invents answers on pricing, policy, or anything important."},
  {q:"Are there per-message charges?",a:"No per-message charges ever. Flat monthly pricing regardless of volume. WhatsApp charges for business-initiated messages (like campaigns) per Meta's standard rates, but all AI conversations are covered in your plan."},
  {q:"How long does setup take?",a:"About 10 minutes. Connect WhatsApp via Meta (one click), add your services and hours, go live. No developer or technical knowledge required."},
  {q:"Is there a free trial?",a:"Yes — 14 days free, full Growth plan access, no credit card required. No automatic charges at the end. You choose whether to continue."},
  {q:"How does Fastrill help grow my business?",a:"Beyond just replying, Fastrill actively recovers lost leads, sends follow-up campaigns, upsells services, and fills empty slots. Businesses using Fastrill see 30–60% more bookings within the first month simply by capturing conversations they were previously missing."},
  {q:"Is my customer data safe?",a:"Yes. All data is encrypted with 256-bit SSL, stored on secure Indian servers, and we are fully GDPR compliant. We are a Meta Official Business Partner — your WhatsApp integration is verified and secure."},
]

const CONVOS_LIST = [
  {init:"P", name:"Priya S.",  msg:"Can I reschedule to 4PM?",       time:"2m",  tag:"booking", tc:"#3fb950", ai:true},
  {init:"R", name:"Rahul M.", msg:"Bridal package for March 28",    time:"5m",  tag:"lead",    tc:"#38bdf8", ai:true},
  {init:"A", name:"Anita K.", msg:"Hair spa price please?",         time:"12m", tag:"query",   tc:"#f59e0b", ai:true},
  {init:"V", name:"Vijay R.", msg:"Confirm 11AM tomorrow",          time:"18m", tag:"booking", tc:"#3fb950", ai:true},
  {init:"S", name:"Sneha P.", msg:"Mujhe Sunday slot chahiye",      time:"31m", tag:"hindi",   tc:"#c084fc", ai:true},
  {init:"D", name:"Dr. Kumar",msg:"Appointments for next week",     time:"42m", tag:"query",   tc:"#f59e0b", ai:false},
]

const GROWTH_LOOPS = [
  {n:"01", icon:"📥", t:"More Leads Captured", d:"Every message gets an instant reply — no lead slips through at night, on weekends, or during rush hours. Your ad spend finally converts.", arrow:true},
  {n:"02", icon:"📅", t:"More Bookings Confirmed", d:"AI books appointments end-to-end — no back and forth. Customers confirm in one conversation. Your calendar fills itself.", arrow:true},
  {n:"03", icon:"🔁", t:"Repeat Customers Return", d:"Fastrill remembers every customer's preferences and sends personalised follow-ups. One visit becomes five. Loyalty is automated.", arrow:true},
  {n:"04", icon:"📣", t:"Word of Mouth Spreads", d:"Happy customers who felt heard and responded to instantly — they tell their friends. Your WhatsApp becomes a referral engine.", arrow:true},
  {n:"05", icon:"💰", t:"Revenue Compounds", d:"More bookings × more repeat visits × more referrals = exponential growth. All without hiring more staff or spending more on ads.", arrow:false},
]

export default function LandingPage(){
  const [convo,setConvo]     = useState("booking")
  const [msgs,setMsgs]       = useState([])
  const [faq,setFaq]         = useState(null)
  const [mob,setMob]         = useState(false)
  const [counts,setCounts]   = useState({a:0,b:0,c:0})
  const [scrolled,setScrolled] = useState(false)
  const [heroMsg,setHeroMsg] = useState("")
  const [heroChat,setHeroChat] = useState([])
  const [heroLoading,setHeroLoading] = useState(false)
  const [exitBar,setExitBar] = useState(false)
  const [exitDismissed,setExitDismissed] = useState(false)
  const chatRef  = useRef(null)
  const heroChatRef = useRef(null)
  const statsRef = useRef(null)
  const counted  = useRef(false)
  const exitTimer = useRef(null)

  useEffect(()=>{
    setMsgs([])
    CONVOS[convo].forEach((m,i)=>{
      setTimeout(()=>{
        setMsgs(p=>[...p,m])
        if(chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight
      },i*580)
    })
  },[convo])

  useEffect(()=>{
    const io=new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){e.target.classList.add("vis");io.unobserve(e.target)}
      })
    },{threshold:.06,rootMargin:"0px 0px -24px 0px"})
    document.querySelectorAll(".fade").forEach((el)=>{
      const sibs=el.parentElement?Array.from(el.parentElement.querySelectorAll(":scope>.fade")):[]
      const idx=sibs.indexOf(el)
      if(idx>0) el.style.transitionDelay=Math.min(idx*.08,.28)+"s"
      io.observe(el)
    })
    return()=>io.disconnect()
  },[])

  useEffect(()=>{
    if(!statsRef.current||counted.current) return
    const io2=new IntersectionObserver(entries=>{
      if(entries[0].isIntersecting){
        counted.current=true
        run(0,2400,1800,v=>setCounts(p=>({...p,a:v})))
        run(0,99,1600,v=>setCounts(p=>({...p,b:v})))
        run(0,68,1400,v=>setCounts(p=>({...p,c:v})))
        io2.disconnect()
      }
    },{threshold:.3})
    io2.observe(statsRef.current)
    return()=>io2.disconnect()
  },[])

  useEffect(()=>{
    const fn=()=>setScrolled(window.scrollY>30)
    window.addEventListener("scroll",fn,{passive:true})
    return()=>window.removeEventListener("scroll",fn)
  },[])

  useEffect(()=>{
    if(exitDismissed) return
    exitTimer.current = setTimeout(()=>setExitBar(true), 30000)
    return()=>clearTimeout(exitTimer.current)
  },[exitDismissed])

  useEffect(()=>{
    if(heroChatRef.current) heroChatRef.current.scrollTop=heroChatRef.current.scrollHeight
  },[heroChat])

  function run(from,to,dur,cb){
    const s=performance.now()
    const tick=now=>{
      const t=Math.min((now-s)/dur,1),e=1-Math.pow(1-t,3)
      cb(Math.round(from+(to-from)*e))
      if(t<1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  async function sendHeroMsg(){
    if(!heroMsg.trim()||heroLoading) return
    const userMsg = heroMsg.trim()
    setHeroMsg("")
    setHeroChat(p=>[...p,{r:"user",m:userMsg}])
    setHeroLoading(true)
    try{
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:`You are Fastrill AI — a WhatsApp AI receptionist for Indian businesses. You are currently being demoed on a landing page for a salon called "Riya Salon" in Mumbai. You reply like a real WhatsApp business assistant — short, warm, helpful, with occasional emojis. You can book appointments, answer pricing questions, handle complaints, and reply in Hindi if the customer writes in Hindi. Services: Haircut ₹400 (30min), Hair Spa ₹800 (60min), Facial ₹1200 (60min), Bridal Package ₹8500 (full day). Hours: 10AM-8PM Mon-Sat. Always reply in 2-4 lines max. Never break character.`,
          messages:[
            ...heroChat.map(c=>({role:c.r==="user"?"user":"assistant",content:c.m})),
            {role:"user",content:userMsg}
          ]
        })
      })
      const data = await res.json()
      const reply = data.content?.map(i=>i.text||"").join("")||"Let me check that for you! 😊"
      setHeroChat(p=>[...p,{r:"ai",m:reply}])
    }catch(e){
      setHeroChat(p=>[...p,{r:"ai",m:"Namaste! 😊 I'm Fastrill AI. I can book appointments, answer pricing questions, and more. Try asking me anything!"}])
    }
    setHeroLoading(false)
  }

  return(<>
  <style>{`
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:#060a0d;color:#8b97a6;font-family:'DM Sans',sans-serif;font-size:16px;line-height:1.6;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
:root{
  --ink:#f0f4f8;--ink2:#8b97a6;--ink3:#4a5568;--ink4:#2d3748;
  --base:#060a0d;--s1:#0b1117;--s2:#0f1923;--s3:#14202e;--s4:#1a2a3d;--s5:#1f3247;
  --gl:rgba(63,185,80,.14);--gb:rgba(63,185,80,.26);--g0:#3fb950;--g1:#2ea043;--g2:#1a6b2c;--gx:#57e070;
  --line:rgba(255,255,255,.06);--line2:rgba(255,255,255,.10);--line3:rgba(255,255,255,.16);
  --wa:#25d366;--blue:#38bdf8;--amber:#f59e0b;
  --serif:'Instrument Serif',Georgia,serif;--sans:'DM Sans',sans-serif;
}
body::before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E");background-size:200px 200px;opacity:.6;}

/* NAV */
.nav{position:fixed;top:0;left:0;right:0;z-index:300;height:60px;padding:0 clamp(20px,4vw,56px);display:flex;align-items:center;justify-content:space-between;transition:background .3s,border-color .3s;}
.nav.scrolled{background:rgba(6,10,13,.88);backdrop-filter:blur(24px);border-bottom:1px solid var(--line);}
.nav-logo{display:flex;align-items:center;gap:9px;text-decoration:none;font-family:var(--sans);font-weight:700;font-size:19px;letter-spacing:-.4px;color:var(--ink);}
.nav-logo img{display:block;object-fit:contain;flex-shrink:0}
.nav-logo .rill{color:var(--g0)}
.nmid{display:flex;align-items:center;gap:2px;list-style:none}
.nmid a{font-size:13.5px;font-weight:500;color:var(--ink2);text-decoration:none;padding:6px 12px;border-radius:8px;transition:all .15s;}
.nmid a:hover{color:var(--ink);background:rgba(255,255,255,.04)}
.nr{display:flex;align-items:center;gap:8px}
.nav-in{font-size:13.5px;font-weight:500;color:var(--ink2);text-decoration:none;padding:7px 14px;border-radius:8px;transition:all .15s;}
.nav-in:hover{color:var(--ink)}
.nav-cta{display:inline-flex;align-items:center;gap:6px;background:var(--g0);color:#000;padding:8px 20px;border-radius:9px;font-weight:700;font-size:13px;letter-spacing:-.1px;text-decoration:none;transition:all .2s;border:none;}
.nav-cta:hover{background:var(--gx);transform:translateY(-1px);box-shadow:0 8px 24px rgba(63,185,80,.3)}
.hbg{display:none;background:none;border:1px solid var(--line2);border-radius:7px;padding:7px 10px;cursor:pointer;color:var(--ink2);font-size:15px;line-height:1}
.mdraw{position:fixed;top:60px;left:0;right:0;z-index:290;background:rgba(6,10,13,.97);backdrop-filter:blur(24px);border-bottom:1px solid var(--line);padding:12px 16px 20px;display:flex;flex-direction:column;gap:4px;transform:translateY(-110%);transition:transform .22s ease;}
.mdraw.open{transform:none}
.mdraw a{color:var(--ink2);text-decoration:none;font-size:14px;font-weight:500;padding:10px 14px;border-radius:9px;transition:all .15s;}
.mdraw a:hover{color:var(--ink);background:rgba(255,255,255,.04)}
.mdraw hr{border:none;border-top:1px solid var(--line);margin:6px 0}

/* HERO */
.hero{min-height:100vh;padding:clamp(100px,12vw,148px) clamp(20px,5vw,56px) clamp(56px,8vw,96px);background:var(--base);position:relative;overflow:hidden;}
.hero-grid{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:80px 80px;mask-image:radial-gradient(ellipse 90% 60% at 50% -10%,black 0%,transparent 70%);}
.hero-glow{position:absolute;top:-200px;left:50%;transform:translateX(-50%);width:min(1000px,140vw);height:700px;pointer-events:none;background:radial-gradient(ellipse at 50% 30%,rgba(63,185,80,.07) 0%,transparent 60%);}
.hero-line{position:absolute;left:clamp(20px,5vw,56px);top:20%;bottom:20%;width:1px;background:linear-gradient(to bottom,transparent,var(--g0),transparent);opacity:.25;}
.hero-in{max-width:1160px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:clamp(36px,5vw,72px);align-items:center;position:relative;z-index:1;}
.chip{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--gb);border-radius:100px;padding:4px 12px 4px 8px;margin-bottom:28px;font-size:12px;font-weight:600;color:var(--g0);letter-spacing:.2px;}
.chip-dot{width:20px;height:20px;border-radius:50%;background:var(--gl);border:1px solid var(--gb);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.chip-dot::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--g0);animation:blink 2s infinite;}
@keyframes blink{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(1.4)}}
.hero-h1{font-size:clamp(40px,5.5vw,72px);line-height:1.06;letter-spacing:-.04em;margin-bottom:22px;color:var(--ink);font-family:var(--sans);font-weight:700;}
.hero-h1 .serif-em{font-family:var(--serif);font-style:italic;font-weight:400;color:var(--g0);letter-spacing:-.02em;}
.hero-sub{font-size:clamp(15px,1.6vw,17px);color:var(--ink2);max-width:480px;margin-bottom:28px;line-height:1.8;font-weight:300;}
.hero-btns{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:24px}
.btn-prime{display:inline-flex;align-items:center;gap:8px;background:var(--g0);color:#000;padding:13px 28px;border-radius:10px;font-weight:700;font-size:15px;letter-spacing:-.2px;text-decoration:none;transition:all .2s;}
.btn-prime:hover{background:var(--gx);transform:translateY(-1px);box-shadow:0 12px 32px rgba(63,185,80,.28)}
.btn-sec{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.04);color:var(--ink);padding:13px 22px;border-radius:10px;font-weight:500;font-size:14.5px;text-decoration:none;border:1px solid var(--line2);transition:all .2s;}
.btn-sec:hover{background:rgba(255,255,255,.07);border-color:var(--line3)}
.btn-wa{display:inline-flex;align-items:center;gap:8px;background:rgba(37,211,102,.12);color:var(--wa);padding:13px 22px;border-radius:10px;font-weight:600;font-size:14.5px;text-decoration:none;border:1px solid rgba(37,211,102,.25);transition:all .2s;}
.btn-wa:hover{background:rgba(37,211,102,.2);border-color:rgba(37,211,102,.4)}
.hero-proof{display:flex;flex-direction:column;gap:8px;margin-bottom:24px}
.hp{display:flex;align-items:center;gap:9px;font-size:13px;color:var(--ink2);font-weight:400}
.hp svg{flex-shrink:0;opacity:.7}

/* SOCIAL PROOF ROW */
.sp-row{display:flex;align-items:center;gap:20px;flex-wrap:wrap;padding:14px 16px;background:rgba(63,185,80,.04);border:1px solid var(--gb);border-radius:12px;margin-top:8px;}
.sp-avatars{display:flex}
.sp-av{width:28px;height:28px;border-radius:50%;border:2px solid var(--s1);margin-left:-8px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff;flex-shrink:0;}
.sp-av:first-child{margin-left:0}
.sp-txt{font-size:12.5px;color:var(--ink2);font-weight:400;flex:1}
.sp-txt strong{color:var(--g0);font-weight:700}
.sp-stars{color:#f59e0b;font-size:11px;letter-spacing:1px}

/* HERO LIVE CHAT */
.hero-live-chat{background:var(--s2);border:1px solid var(--gb);border-radius:16px;overflow:hidden;box-shadow:0 0 0 1px rgba(63,185,80,.06),0 32px 80px rgba(0,0,0,.6);}
.hlc-hd{background:var(--s3);border-bottom:1px solid var(--line);padding:12px 16px;display:flex;align-items:center;gap:10px;}
.hlc-av{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--g0),var(--blue));display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;color:#000;flex-shrink:0;}
.hlc-info{flex:1}
.hlc-nm{font-size:13px;font-weight:700;color:var(--ink)}
.hlc-st{font-size:10.5px;color:var(--wa);display:flex;align-items:center;gap:4px;}
.hlc-st::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--wa);animation:blink 2s infinite;}
.hlc-try{display:inline-block;background:rgba(63,185,80,.15);color:var(--g0);font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;border:1px solid var(--gb);}
.hlc-msgs{padding:14px;min-height:200px;max-height:260px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;}
.hlc-msg{max-width:85%;padding:9px 13px;border-radius:10px;font-size:13px;line-height:1.5;animation:cmIn .24s ease both;}
.hlc-msg.user{background:#005c4b;color:#e9edef;align-self:flex-end;border-radius:10px 3px 10px 10px;}
.hlc-msg.ai{background:#1a2d22;border:1px solid rgba(63,185,80,.15);color:#e9edef;align-self:flex-start;border-radius:3px 10px 10px 10px;}
.hlc-msg.ai .ai-tag{font-size:9px;color:var(--wa);font-weight:700;margin-bottom:3px;display:block;}
.hlc-typing{display:flex;align-items:center;gap:5px;padding:10px 13px;background:#1a2d22;border:1px solid rgba(63,185,80,.15);border-radius:3px 10px 10px 10px;align-self:flex-start;width:fit-content;}
.hlc-typing span{width:6px;height:6px;border-radius:50%;background:var(--wa);animation:typing .8s infinite;}
.hlc-typing span:nth-child(2){animation-delay:.15s}
.hlc-typing span:nth-child(3){animation-delay:.3s}
@keyframes typing{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
.hlc-input{display:flex;align-items:center;gap:8px;padding:10px 12px;border-top:1px solid var(--line);background:var(--s3);}
.hlc-inp{flex:1;background:var(--s4);border:1px solid var(--line2);border-radius:22px;padding:8px 14px;font-size:13px;color:var(--ink);font-family:var(--sans);outline:none;transition:border-color .2s;}
.hlc-inp::placeholder{color:var(--ink3)}
.hlc-inp:focus{border-color:var(--g0)}
.hlc-send{width:34px;height:34px;border-radius:50%;background:var(--g0);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;transition:all .2s;flex-shrink:0;}
.hlc-send:hover{background:var(--gx);transform:scale(1.08)}
.hlc-send:disabled{background:var(--ink3);cursor:not-allowed;transform:none}
.hlc-placeholder{padding:20px;text-align:center;color:var(--ink3);font-size:12.5px;line-height:1.6;}
.hlc-placeholder strong{display:block;color:var(--ink2);font-size:13px;margin-bottom:4px;}

/* DASHBOARD */
.dash-frame{position:relative;background:var(--s2);border:1px solid var(--line2);border-radius:16px;overflow:hidden;box-shadow:0 0 0 1px rgba(63,185,80,.06),0 32px 80px rgba(0,0,0,.6),0 0 60px rgba(63,185,80,.04) inset;}
.db-chrome{background:var(--s3);border-bottom:1px solid var(--line);padding:10px 14px;display:flex;align-items:center;gap:10px;}
.db-dots{display:flex;gap:5px}
.db-dot{width:10px;height:10px;border-radius:50%}
.db-url{flex:1;background:var(--s4);border:1px solid var(--line);border-radius:6px;padding:4px 10px;font-size:10.5px;color:var(--ink3);display:flex;align-items:center;gap:6px;max-width:260px;margin:0 auto;}
.db-url-lock{font-size:9px;color:var(--g0)}
.db-layout{display:flex;height:380px}
.db-sidebar{width:52px;background:var(--s2);border-right:1px solid var(--line);display:flex;flex-direction:column;align-items:center;padding:12px 0;gap:6px;flex-shrink:0;}
.db-sicon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;color:var(--ink3);transition:.15s;cursor:pointer;}
.db-sicon.act{background:var(--gl);color:var(--g0)}
.db-main{flex:1;overflow:hidden;display:flex;flex-direction:column}
.db-topbar{padding:10px 14px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;font-size:12px;color:var(--ink2);flex-shrink:0;}
.db-topbar-title{font-weight:700;color:var(--ink);font-size:12.5px}
.db-ai-badge{display:flex;align-items:center;gap:5px;background:var(--gl);border:1px solid var(--gb);border-radius:100px;padding:3px 9px;font-size:10px;font-weight:700;color:var(--g0);}
.db-ai-badge::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--g0);animation:blink 2s infinite}
.db-content{flex:1;overflow:hidden;padding:12px 14px;display:flex;flex-direction:column;gap:10px}
.db-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;flex-shrink:0}
.db-stat{background:var(--s3);border:1px solid var(--line);border-radius:9px;padding:9px 10px;}
.db-stat-l{font-size:9.5px;color:var(--ink3);margin-bottom:3px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.db-stat-v{font-size:16px;font-weight:800;color:var(--ink);line-height:1;letter-spacing:-.5px}
.db-stat-d{font-size:9px;color:var(--g0);font-weight:600;margin-top:2px}
.db-convos{flex:1;overflow:hidden;display:flex;flex-direction:column;gap:0}
.db-conv-hd{display:flex;align-items:center;justify-content:space-between;font-size:10px;font-weight:700;color:var(--ink3);padding:6px 10px;border-bottom:1px solid var(--line);flex-shrink:0;text-transform:uppercase;letter-spacing:.8px;}
.db-conv-live{display:flex;align-items:center;gap:5px;color:var(--g0);text-transform:none;letter-spacing:0}
.db-conv-live::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--g0);animation:blink 1.5s infinite}
.dc{display:flex;align-items:center;gap:8px;padding:7px 10px;border-bottom:1px solid rgba(255,255,255,.03);cursor:pointer;transition:background .12s;}
.dc:hover{background:rgba(255,255,255,.02)}
.dc-av{width:24px;height:24px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:9.5px;font-weight:800;color:#000;}
.dc-info{flex:1;min-width:0}
.dc-nm{font-size:11px;font-weight:600;color:var(--ink)}
.dc-ms{font-size:10px;color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dc-r{display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0}
.dc-t{font-size:9px;color:var(--ink3)}
.dc-tag{font-size:8.5px;font-weight:700;padding:1.5px 5px;border-radius:3px;text-transform:uppercase;letter-spacing:.3px;}
.dc-ai{width:14px;height:14px;border-radius:50%;background:var(--gl);border:1px solid var(--gb);display:flex;align-items:center;justify-content:center;font-size:7px;color:var(--g0);flex-shrink:0;}

/* MARQUEE */
.mq-wrap{border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--s1);padding:15px 0;overflow:hidden;position:relative;}
.mq-wrap::before,.mq-wrap::after{content:'';position:absolute;top:0;bottom:0;width:100px;z-index:2;}
.mq-wrap::before{left:0;background:linear-gradient(90deg,var(--s1),transparent)}
.mq-wrap::after{right:0;background:linear-gradient(-90deg,var(--s1),transparent)}
.mq-track{display:flex;animation:mq 35s linear infinite;width:max-content}
@keyframes mq{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.mq-item{display:flex;align-items:center;gap:7px;padding:0 24px;font-size:13px;font-weight:500;color:var(--ink3);white-space:nowrap;border-right:1px solid var(--line);letter-spacing:-.1px;}
.mq-item:last-child{border-right:none}

/* TRUST BADGES */
.trust-bar{background:var(--s1);border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:18px 0;}
.trust-inner{max-width:1160px;margin:0 auto;padding:0 clamp(20px,4vw,56px);display:flex;align-items:center;justify-content:center;gap:clamp(16px,3vw,40px);flex-wrap:wrap;}
.trust-badge{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;color:var(--ink2);}
.trust-badge span{font-size:16px}
.trust-sep{width:1px;height:20px;background:var(--line2)}

/* SEC */
.sec{padding:clamp(72px,9vw,116px) 0}
.wrap{max-width:1160px;margin:0 auto;padding:0 clamp(20px,4vw,56px)}
.label{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--g0);margin-bottom:16px;}
.label::before{content:'';width:16px;height:1.5px;background:var(--g0)}
.sh{font-family:var(--sans);font-weight:700;font-size:clamp(28px,4vw,46px);color:var(--ink);margin-bottom:16px;line-height:1.1;letter-spacing:-.03em;}
.sh .si{font-family:var(--serif);font-style:italic;font-weight:400;color:var(--g0)}
.sp{font-size:clamp(14px,1.6vw,16.5px);color:var(--ink2);line-height:1.8;font-weight:300}

/* STATS BAR */
.stats-bar{background:var(--s1);border-top:1px solid var(--line);border-bottom:1px solid var(--line);}
.stats-row{display:grid;grid-template-columns:repeat(3,1fr)}
.stat-cell{padding:clamp(28px,4vw,52px) clamp(24px,3vw,48px);border-right:1px solid var(--line);text-align:center;}
.stat-cell:last-child{border-right:none}
.stat-n{font-size:clamp(40px,5vw,60px);font-weight:800;color:var(--ink);letter-spacing:-.05em;line-height:1;margin-bottom:8px;font-family:var(--sans);}
.stat-n em{font-style:normal;color:var(--g0)}
.stat-l{font-size:14px;font-weight:500;color:var(--ink2)}
.stat-s{font-size:12px;color:var(--ink3);margin-top:4px}

/* PAIN */
.pain-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:16px;overflow:hidden;margin-top:52px;}
.pain-card{background:var(--s1);padding:clamp(28px,3vw,40px);position:relative;overflow:hidden;transition:background .2s;}
.pain-card:hover{background:var(--s2)}
.pain-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--gb),transparent);opacity:0;transition:opacity .3s;}
.pain-card:hover::before{opacity:1}
.pain-num{font-size:clamp(48px,6vw,72px);font-weight:900;line-height:1;letter-spacing:-.05em;color:rgba(63,185,80,.08);font-family:var(--sans);margin-bottom:16px;}
.pain-icon{font-size:28px;margin-bottom:16px;display:block}
.pain-t{font-size:16px;font-weight:700;color:var(--ink);margin-bottom:10px;letter-spacing:-.02em}
.pain-d{font-size:13.5px;color:var(--ink2);line-height:1.75;font-weight:300}
.pain-tag{display:inline-block;margin-top:16px;font-size:11px;font-weight:700;color:var(--g0);border:1px solid var(--gb);border-radius:6px;padding:3px 9px;letter-spacing:.3px;}

/* HOW */
.how-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:52px}
.how-card{background:var(--s1);border:1px solid var(--line);border-radius:16px;padding:28px 24px;position:relative;transition:all .25s;}
.how-card:hover{border-color:var(--gb);background:var(--s2);transform:translateY(-3px)}
.how-n{width:36px;height:36px;border-radius:10px;background:var(--gl);border:1px solid var(--gb);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;color:var(--g0);margin-bottom:18px;}
.how-card h3{font-size:16px;font-weight:700;color:var(--ink);margin-bottom:9px;letter-spacing:-.02em}
.how-card p{font-size:13.5px;color:var(--ink2);line-height:1.72;font-weight:300}
.how-ui{margin-top:18px;background:var(--s3);border:1px solid var(--line);border-radius:10px;padding:12px;}
.how-row{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:7px;margin-bottom:4px;color:var(--ink2);font-size:11.5px}
.how-row:last-child{margin-bottom:0}
.how-row.on{background:var(--gl);color:var(--g0);font-weight:600}
.how-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.how-card:not(:last-child)::after{content:'→';position:absolute;right:-13px;top:44px;font-size:20px;color:var(--g0);z-index:2;opacity:.5;}

/* DEMO */
.demo-wrap{display:grid;grid-template-columns:180px 1fr;gap:20px;margin-top:52px;align-items:start;}
.demo-tabs{display:flex;flex-direction:column;gap:7px}
.demo-tab{background:var(--s1);border:1px solid var(--line);border-radius:11px;padding:12px 14px;cursor:pointer;transition:all .2s;}
.demo-tab.on{border-color:var(--g0);background:rgba(63,185,80,.06)}
.demo-tab:hover:not(.on){border-color:var(--line2)}
.dt-t{font-size:13px;font-weight:600;color:var(--ink);margin-bottom:2px}
.dt-s{font-size:11.5px;color:var(--ink2)}
.wa-frame{background:#0b141a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.07);box-shadow:0 24px 60px rgba(0,0,0,.5);}
.wa-hd{background:#1f2c34;padding:12px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,.05);}
.wa-av{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--g0),var(--blue));display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;color:#000;flex-shrink:0;}
.wa-nm{font-size:13px;font-weight:700;color:#e9edef}
.wa-st{font-size:10.5px;color:var(--wa)}
.wa-body{padding:14px;min-height:300px;display:flex;flex-direction:column;gap:9px;overflow-y:auto;max-height:360px;}
.cm{max-width:80%;padding:9px 13px;border-radius:10px;font-size:13px;line-height:1.55;animation:cmIn .24s ease both;}
.cm.c{background:#005c4b;color:#e9edef;align-self:flex-end;border-radius:10px 3px 10px 10px}
.cm.a{background:#1a2d22;border:1px solid rgba(63,185,80,.15);color:#e9edef;align-self:flex-start;border-radius:3px 10px 10px 10px;}
.cm-tag{font-size:9.5px;color:var(--wa);font-weight:700;margin-bottom:4px;display:block}
@keyframes cmIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}

/* GROWTH LOOP */
.growth-loop{margin-top:52px;position:relative;}
.growth-center{display:flex;flex-direction:column;align-items:center;gap:0;}
.gl-step{display:grid;grid-template-columns:1fr 80px 1fr;align-items:center;gap:0;width:100%;max-width:860px;margin:0 auto;}
.gl-step:nth-child(odd) .gl-card{grid-column:1;text-align:right;}
.gl-step:nth-child(odd) .gl-arrow{grid-column:2}
.gl-step:nth-child(odd) .gl-empty{grid-column:3}
.gl-step:nth-child(even) .gl-empty{grid-column:1}
.gl-step:nth-child(even) .gl-arrow{grid-column:2}
.gl-step:nth-child(even) .gl-card{grid-column:3}
.gl-card{background:var(--s1);border:1px solid var(--line);border-radius:14px;padding:20px 22px;transition:all .22s;position:relative;}
.gl-card:hover{border-color:var(--gb);background:var(--s2);transform:translateY(-2px)}
.gl-card::after{content:'';position:absolute;top:0;left:0;right:0;height:1.5px;background:linear-gradient(90deg,transparent,var(--gb),transparent);opacity:0;transition:.25s;}
.gl-card:hover::after{opacity:1}
.gl-num{font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:var(--g0);margin-bottom:6px}
.gl-icon{font-size:24px;margin-bottom:8px;display:block}
.gl-t{font-size:15px;font-weight:700;color:var(--ink);margin-bottom:6px;letter-spacing:-.02em}
.gl-d{font-size:12.5px;color:var(--ink2);line-height:1.7;font-weight:300}
.gl-arrow{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:16px 0;}
.gl-arrow-line{width:2px;height:40px;background:linear-gradient(to bottom,var(--g0),rgba(63,185,80,.2));margin:0 auto;}
.gl-arrow-head{font-size:18px;color:var(--g0);line-height:1}
.gl-center-icon{width:56px;height:56px;border-radius:50%;background:var(--gl);border:2px solid var(--gb);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;margin:0 auto;}
.gl-empty{}

/* FEATS */
.feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:52px}
.fc{background:var(--s1);border:1px solid var(--line);border-radius:16px;padding:26px 22px;transition:all .22s;position:relative;overflow:hidden;}
.fc::after{content:'';position:absolute;top:0;left:0;right:0;height:1.5px;background:linear-gradient(90deg,transparent,var(--gb),transparent);opacity:0;transition:opacity .25s;}
.fc:hover{border-color:var(--gb);background:var(--s2);transform:translateY(-2px)}
.fc:hover::after{opacity:1}
.fc-ico{width:40px;height:40px;border-radius:10px;background:var(--gl);border:1px solid var(--gb);display:flex;align-items:center;justify-content:center;font-size:18px;margin-bottom:14px;}
.fc-badge{float:right;font-size:10px;font-weight:700;letter-spacing:.3px;text-transform:uppercase;color:var(--g0);background:var(--gl);border:1px solid var(--gb);padding:2px 7px;border-radius:4px;margin-top:2px;}
.fc-t{font-size:15px;font-weight:700;color:var(--ink);margin-bottom:9px;clear:both;letter-spacing:-.02em}
.fc-d{font-size:13px;color:var(--ink2);line-height:1.72;font-weight:300}

/* WHO */
.who-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:52px}
.who{background:var(--s1);border:1px solid var(--line);border-radius:12px;padding:18px 16px;transition:all .2s;}
.who:hover{border-color:var(--gb);transform:translateY(-2px);background:var(--s2)}
.who-e{font-size:24px;margin-bottom:9px;display:block}
.who-n{font-size:13.5px;font-weight:700;color:var(--ink);margin-bottom:4px;letter-spacing:-.01em}
.who-d{font-size:12px;color:var(--ink2);line-height:1.55;font-weight:300}

/* VS */
.vs-layout{display:grid;grid-template-columns:1fr 1fr;gap:52px;align-items:start;margin-top:52px}
.vs-pts{display:flex;flex-direction:column;gap:13px;margin-top:22px}
.vs-pt{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:var(--ink2);line-height:1.7;font-weight:300}
.vs-ck{width:18px;height:18px;border-radius:50%;flex-shrink:0;margin-top:3px;background:var(--gl);border:1px solid var(--gb);display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--g0);}
.vs-tbl{background:var(--s1);border:1px solid var(--line);border-radius:16px;overflow:hidden;}
.vs-head{display:grid;grid-template-columns:1fr 1fr;background:var(--s2)}
.vs-th{padding:12px 20px;font-size:10.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase}
.vs-th.tm{color:var(--ink3);border-right:1px solid var(--line)}
.vs-th.us{color:var(--g0)}
.vs-row{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid var(--line)}
.vs-c{padding:11px 20px;font-size:13px;display:flex;align-items:center;gap:6px;font-weight:400}
.vs-c.tm{color:var(--ink3);border-right:1px solid var(--line)}
.vs-c.tm::before{content:'✕';color:#f85149;font-size:10px}
.vs-c.us{color:var(--ink);font-weight:500}
.vs-c.us::before{content:'✓';color:var(--g0);font-size:11px}

/* PRICING */
.p-wrap{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:52px;align-items:start}
.plan{background:var(--s1);border:1px solid var(--line);border-radius:18px;padding:clamp(24px,3vw,36px) clamp(20px,3vw,30px);position:relative;transition:all .22s;}
.plan:hover:not(.pop){border-color:var(--gb)}
.plan.pop{background:var(--s2);border-color:rgba(63,185,80,.3);box-shadow:0 0 0 1px rgba(63,185,80,.06),0 24px 64px rgba(63,185,80,.08);}
.plan.pop::before{content:'';position:absolute;top:0;left:20%;right:20%;height:1px;background:linear-gradient(90deg,transparent,var(--g0),transparent);}
.p-pop-badge{position:absolute;top:-1px;left:50%;transform:translateX(-50%);background:var(--g1);color:#fff;font-size:10.5px;font-weight:800;padding:3px 16px;border-radius:0 0 10px 10px;white-space:nowrap;border:1px solid var(--g0);border-top:none;letter-spacing:.3px;}
.p-tier{font-size:10.5px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--ink2);margin-bottom:6px}
.p-tagline{font-size:13px;color:var(--ink2);margin-bottom:22px;font-weight:300}
.p-pr{display:flex;align-items:baseline;gap:1px;margin-bottom:4px}
.p-rs{font-size:18px;font-weight:700;color:var(--ink);margin-top:6px}
.p-amt{font-size:clamp(42px,5vw,52px);font-weight:900;color:var(--ink);line-height:1;letter-spacing:-.04em}
.plan.pop .p-amt,.plan.pop .p-rs{color:var(--g0)}
.p-mo{font-size:12px;color:var(--ink2);margin-bottom:18px;font-weight:300}
.p-val{display:flex;align-items:center;gap:7px;background:var(--gl);border:1px solid var(--gb);border-radius:8px;padding:8px 12px;margin-bottom:20px;font-size:12px;color:var(--g0);font-weight:600;line-height:1.4;}
.p-hr{border:none;border-top:1px solid var(--line);margin:18px 0}
.p-list{list-style:none;display:flex;flex-direction:column;gap:9px;margin-bottom:26px}
.p-list li{display:flex;align-items:flex-start;gap:7px;font-size:13px;line-height:1.55;font-weight:300}
.p-list li.inc{color:var(--ink2)}
.p-list li.inc::before{content:'✓';color:var(--g0);font-size:10.5px;margin-top:2px;flex-shrink:0;font-weight:800}
.p-list li.exc{color:var(--ink3);text-decoration:line-through}
.p-list li.exc::before{content:'✕';color:var(--ink4);font-size:10px;margin-top:2px;flex-shrink:0}
.p-list li.hi{color:var(--ink);font-weight:600}
.p-list li.hi::before{content:'✓';color:var(--g0);font-size:10.5px;margin-top:2px;flex-shrink:0;font-weight:800}
.p-btn{display:block;text-align:center;padding:11px;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;transition:all .2s;letter-spacing:-.1px}
.p-btn.go{background:var(--g0);color:#000;border:none}
.p-btn.go:hover{background:var(--gx);box-shadow:0 8px 24px rgba(63,185,80,.3)}
.p-btn.out{background:transparent;color:var(--ink);border:1px solid var(--line2)}
.p-btn.out:hover{border-color:var(--g0);color:var(--g0)}
.p-foot{text-align:center;margin-top:22px;font-size:13px;color:var(--ink2);font-weight:300}

/* TESTIMONIALS */
.t-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:52px}
.tc{background:var(--s1);border:1px solid var(--line);border-radius:16px;padding:26px;transition:all .22s;}
.tc:hover{border-color:var(--gb);transform:translateY(-2px)}
.tc-badge{display:inline-block;background:var(--gl);border:1px solid var(--gb);color:var(--g0);font-size:11px;font-weight:700;padding:3px 9px;border-radius:5px;margin-bottom:14px;}
.tc-stars{color:#f59e0b;font-size:12.5px;letter-spacing:2px;margin-bottom:10px}
.tc-txt{font-size:14px;color:var(--ink2);line-height:1.82;margin-bottom:18px;font-style:italic;font-family:var(--serif);font-weight:400;letter-spacing:-.01em;}
.tc-auth{display:flex;align-items:center;gap:10px}
.tc-av{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#fff;flex-shrink:0;}
.tc-nm{font-size:13px;font-weight:700;color:var(--ink);letter-spacing:-.01em}
.tc-bz{font-size:11.5px;color:var(--ink2);font-weight:300}
.tc-verified{display:inline-flex;align-items:center;gap:4px;font-size:10px;color:var(--g0);font-weight:600;margin-top:3px;}

/* FOUNDER STORY */
.founder-sec{padding:clamp(72px,9vw,116px) 0;background:var(--base);position:relative;overflow:hidden;}
.founder-sec::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--gb),transparent);}
.founder-inner{max-width:900px;margin:0 auto;padding:0 clamp(20px,4vw,56px);}
.founder-story{background:var(--s1);border:1px solid var(--line);border-radius:20px;padding:clamp(32px,5vw,56px);position:relative;overflow:hidden;}
.founder-story::after{content:'';position:absolute;bottom:-60px;right:-60px;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(63,185,80,.05),transparent 70%);pointer-events:none;}
.founder-quote-mark{font-size:80px;line-height:.8;color:rgba(63,185,80,.12);font-family:var(--serif);margin-bottom:8px;display:block;}
.founder-story-text{font-size:clamp(15px,1.8vw,17px);color:var(--ink2);line-height:2;font-weight:300;margin-bottom:32px;}
.founder-story-text strong{color:var(--ink);font-weight:600;}
.founder-story-text em{font-style:italic;color:var(--g0);}
.founder-profile{display:flex;align-items:center;gap:16px;padding-top:24px;border-top:1px solid var(--line);}
.founder-av{width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,var(--g0),var(--blue));display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;color:#000;flex-shrink:0;}
.founder-name{font-size:15px;font-weight:700;color:var(--ink);letter-spacing:-.02em}
.founder-title{font-size:12.5px;color:var(--ink2);font-weight:300;margin-top:2px}
.founder-company{font-size:11.5px;color:var(--g0);font-weight:600;margin-top:3px}

/* FAQ */
.faq-box{max-width:680px;margin:52px auto 0;border:1px solid var(--line);border-radius:16px;overflow:hidden;background:var(--s1)}
.fi{border-bottom:1px solid var(--line)}
.fi:last-child{border-bottom:none}
.fb{width:100%;background:none;border:none;padding:19px 24px;text-align:left;font-size:14.5px;font-weight:600;color:var(--ink);cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:14px;font-family:var(--sans);transition:background .15s;letter-spacing:-.01em;}
.fb:hover{background:rgba(255,255,255,.02)}
.fp{width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,.05);display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--ink2);flex-shrink:0;transition:all .2s;line-height:1;}
.fa{padding:0 24px;font-size:13.5px;color:var(--ink2);line-height:1.82;max-height:0;overflow:hidden;transition:max-height .3s ease,padding .3s ease;font-weight:300;}
.fi.op .fa{max-height:200px;padding:0 24px 20px}
.fi.op .fp{background:var(--gl);color:var(--g0);transform:rotate(45deg)}

/* CTA */
.cta-sec{padding:clamp(72px,9vw,116px) clamp(20px,4vw,56px);text-align:center;background:var(--base);position:relative;overflow:hidden;}
.cta-sec::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:min(800px,100vw);height:600px;background:radial-gradient(ellipse,rgba(63,185,80,.06) 0%,transparent 65%);pointer-events:none;}
.cta-card{max-width:760px;margin:0 auto;position:relative;z-index:1;background:var(--s1);border:1px solid var(--gb);border-radius:24px;padding:clamp(48px,6vw,80px) clamp(28px,5vw,68px);overflow:hidden;}
.cta-card::before{content:'';position:absolute;top:0;left:10%;right:10%;height:1px;background:linear-gradient(90deg,transparent,var(--g0),transparent);}
.cta-card::after{content:'';position:absolute;bottom:-80px;right:-80px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(63,185,80,.06),transparent 70%);pointer-events:none;}
.cta-h{font-size:clamp(30px,5vw,52px);color:var(--ink);margin-bottom:16px;line-height:1.08;letter-spacing:-.035em;font-family:var(--sans);font-weight:700;}
.cta-h .si{font-family:var(--serif);font-style:italic;font-weight:400;color:var(--g0)}
.cta-p{font-size:clamp(14px,1.7vw,16.5px);color:var(--ink2);margin-bottom:36px;line-height:1.8;font-weight:300}
.cta-btns{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap}
.cta-note{margin-top:18px;font-size:12px;color:var(--ink3)}

/* EXIT BAR */
.exit-bar{position:fixed;bottom:0;left:0;right:0;z-index:400;background:var(--s2);border-top:1px solid var(--gb);padding:14px clamp(20px,4vw,56px);display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;transform:translateY(100%);transition:transform .4s cubic-bezier(.22,1,.36,1);}
.exit-bar.show{transform:none}
.exit-bar-txt{font-size:14px;color:var(--ink2);font-weight:400}
.exit-bar-txt strong{color:var(--ink);font-weight:600}
.exit-bar-actions{display:flex;align-items:center;gap:10px;flex-shrink:0}
.exit-bar-cta{display:inline-flex;align-items:center;gap:6px;background:var(--g0);color:#000;padding:9px 20px;border-radius:8px;font-weight:700;font-size:13.5px;text-decoration:none;transition:all .2s;}
.exit-bar-cta:hover{background:var(--gx)}
.exit-bar-close{background:none;border:1px solid var(--line2);color:var(--ink3);padding:8px 14px;border-radius:8px;cursor:pointer;font-size:13px;transition:all .15s;}
.exit-bar-close:hover{color:var(--ink);border-color:var(--line3)}

/* FOOTER */
footer{background:var(--s1);border-top:1px solid var(--line);padding:clamp(48px,6vw,64px) clamp(20px,4vw,56px) clamp(28px,3vw,36px);}
.ft{max-width:1160px;margin:0 auto}
.ft-top{display:grid;grid-template-columns:2.2fr 1fr 1fr 1fr;gap:clamp(24px,4vw,52px);margin-bottom:clamp(32px,4vw,44px)}
.ft-tagline{font-size:13px;color:var(--ink2);line-height:1.8;margin-top:14px;max-width:260px;font-weight:300}
.ft-hd{font-size:10.5px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--ink3);margin-bottom:14px}
.ft-lks{list-style:none;display:flex;flex-direction:column;gap:9px}
.ft-lks a{font-size:13.5px;color:var(--ink2);text-decoration:none;transition:color .14s;font-weight:300}
.ft-lks a:hover{color:var(--g0)}
.ft-bot{padding-top:24px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;font-size:12.5px;color:var(--ink3);flex-wrap:wrap;gap:8px;font-weight:300;}

/* REVEAL */
.fade{opacity:0;transform:translateY(24px);transition:opacity .65s ease,transform .65s ease}
.fade.vis{opacity:1;transform:none}

/* MOBILE */
@media(max-width:768px){
  .nav{padding:0 16px}
  .nmid,.nav-in{display:none}
  .hbg{display:flex}
  .nav-logo{font-size:17px}
  .hero{padding:82px 16px 48px;min-height:auto}
  .hero-in{grid-template-columns:1fr;gap:24px}
  .hero-line{display:none}
  .hero-h1{font-size:clamp(32px,9vw,46px)}
  .hero-sub{font-size:15px;margin-bottom:22px}
  .hero-btns{flex-direction:column;align-items:stretch}
  .btn-prime,.btn-sec,.btn-wa{justify-content:center}
  .stats-row{grid-template-columns:1fr}
  .stat-cell{border-right:none;border-bottom:1px solid var(--line)}
  .stat-cell:last-child{border-bottom:none}
  .pain-grid{grid-template-columns:1fr;gap:0}
  .pain-card{border-bottom:1px solid var(--line)}
  .how-grid{grid-template-columns:1fr;gap:12px}
  .how-card:not(:last-child)::after{display:none}
  .how-card:not(:last-child){padding-bottom:28px}
  .how-card:not(:last-child)::before{content:'↓';position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);font-size:18px;color:var(--g0);z-index:2}
  .demo-wrap{grid-template-columns:1fr;gap:14px}
  .demo-tabs{display:grid;grid-template-columns:1fr 1fr;gap:7px}
  .feat-grid{grid-template-columns:1fr;gap:10px}
  .who-grid{grid-template-columns:repeat(2,1fr);gap:10px}
  .vs-layout{grid-template-columns:1fr;gap:24px}
  .p-wrap{grid-template-columns:1fr;gap:14px}
  .t-grid{grid-template-columns:1fr;gap:12px}
  .cta-card{padding:36px 20px;border-radius:16px}
  .cta-btns{flex-direction:column;align-items:stretch}
  .cta-btns a{justify-content:center}
  .ft-top{grid-template-columns:1fr;gap:28px}
  .ft-tagline{max-width:100%}
  .ft-bot{flex-direction:column;text-align:center}
  .sec{padding:clamp(52px,8vw,80px) 0}
  .mq-wrap{display:none}
  .gl-step{grid-template-columns:1fr!important}
  .gl-step .gl-empty{display:none}
  .gl-step .gl-arrow{display:none}
  .gl-step .gl-card{grid-column:1!important;text-align:left!important}
  .growth-center{gap:12px}
  .trust-inner{gap:12px 20px}
  .trust-sep{display:none}
  .exit-bar{flex-direction:column;align-items:flex-start}
}
@media(min-width:769px) and (max-width:1024px){
  .nmid,.nav-in{display:none}
  .hbg{display:flex}
  .hero-in{gap:32px}
  .hero-h1{font-size:clamp(34px,5vw,52px)}
  .feat-grid{grid-template-columns:repeat(2,1fr)}
  .who-grid{grid-template-columns:repeat(3,1fr)}
  .t-grid{grid-template-columns:repeat(2,1fr)}
  .ft-top{grid-template-columns:1fr 1fr;gap:32px}
  .vs-layout{grid-template-columns:1fr}
  .demo-wrap{grid-template-columns:160px 1fr}
  .db-stats{grid-template-columns:repeat(2,1fr)}
  .stats-row{grid-template-columns:1fr 1fr}
  .stat-cell:nth-child(2){border-right:none}
}
  `}</style>

  {/* EXIT BAR */}
  {!exitDismissed && (
    <div className={`exit-bar${exitBar?" show":""}`}>
      <div className="exit-bar-txt"><strong>Still thinking?</strong> Start free — no card needed. 14 days, full access, cancel anytime.</div>
      <div className="exit-bar-actions">
        <a href="/signup" className="exit-bar-cta">Start Free Trial →</a>
        <button className="exit-bar-close" onClick={()=>{setExitBar(false);setExitDismissed(true)}}>Maybe later</button>
      </div>
    </div>
  )}

  {/* NAV */}
  <nav className={`nav${scrolled?" scrolled":""}`}>
    <a href="/" className="nav-logo">
      <span>fast<span className="rill">rill</span></span>
    </a>
    <ul className="nmid">
      {[["#how","How it works"],["#features","Features"],["#demo","Demo"],["#pricing","Pricing"],["#founder","Our Story"],["#faq","FAQ"]].map(([h,l])=>(
        <li key={h}><a href={h}>{l}</a></li>
      ))}
    </ul>
    <div className="nr">
      <a href="/login" className="nav-in">Log in</a>
      <a href="/signup" className="nav-cta">Start Free →</a>
      <button className="hbg" onClick={()=>setMob(p=>!p)}>☰</button>
    </div>
  </nav>
  <div className={`mdraw${mob?" open":""}`}>
    {[["#how","How it works"],["#features","Features"],["#demo","Demo"],["#pricing","Pricing"],["#founder","Our Story"],["#faq","FAQ"]].map(([h,l])=>(
      <a key={h} href={h} onClick={()=>setMob(false)}>{l}</a>
    ))}
    <hr/>
    <a href="/login" onClick={()=>setMob(false)}>Log in</a>
    <a href="/signup" onClick={()=>setMob(false)} style={{color:"var(--g0)",fontWeight:600}}>Start Free Trial →</a>
  </div>

  {/* HERO */}
  <section className="hero">
    <div className="hero-grid"/>
    <div className="hero-glow"/>
    <div className="hero-line"/>
    <div className="hero-in">
      <div>
        <div className="chip">
          <div className="chip-dot"/>
          🇮🇳 Built for Indian businesses on WhatsApp
        </div>
        <h1 className="hero-h1">
          Your AI receptionist<br/>that works{" "}
          <span className="serif-em">while you sleep</span>
        </h1>
        <p className="hero-sub">
          Fastrill replies to every WhatsApp message in under 2 seconds —
          books appointments, qualifies leads, handles complaints.
          In Hindi, Telugu, Tamil, and 10 more languages.
        </p>
        <div className="hero-btns">
          <a href="/signup" className="btn-prime">Start Free Trial — No Card →</a>
          <a href="https://wa.me/919346079265" className="btn-wa">💬 Chat on WhatsApp</a>
          <a href="#demo" className="btn-sec">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M6.5 5.5l4 2.5-4 2.5V5.5z" fill="currentColor"/></svg>
            See live demo
          </a>
        </div>
        <div className="hero-proof">
          {["Replies in under 2 seconds","10+ Indian languages, auto-detected","Setup in 10 minutes — no developer needed","14-day free trial · no credit card required"].map(p=>(
            <div key={p} className="hp">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6.5" stroke="#3fb950" strokeOpacity=".4"/><path d="M4 7l2 2 4-4" stroke="#3fb950" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {p}
            </div>
          ))}
        </div>
        {/* SOCIAL PROOF ROW */}
        <div className="sp-row">
          <div className="sp-avatars">
            {[["#f59e0b","P"],["#3fb950","R"],["#38bdf8","S"],["#a855f7","A"],["#ef4444","N"]].map(([c,i],idx)=>(
              <div key={idx} className="sp-av" style={{background:`linear-gradient(135deg,${c},${c}88)`}}>{i}</div>
            ))}
          </div>
          <div className="sp-txt"><strong>50+ businesses</strong> already automating on WhatsApp <span className="sp-stars">★★★★★</span></div>
        </div>
      </div>

      {/* LIVE CHAT WIDGET */}
      <div className="hero-live-chat fade">
        <div className="hlc-hd">
          <div className="hlc-av">R</div>
          <div className="hlc-info">
            <div className="hlc-nm">Riya Salon <span className="hlc-try">LIVE AI</span></div>
            <div className="hlc-st">Fastrill AI · Online — type anything below</div>
          </div>
        </div>
        <div className="hlc-msgs" ref={heroChatRef}>
          {heroChat.length===0 && (
            <div className="hlc-placeholder">
              <strong>👋 Try the AI live right here!</strong>
              Ask anything — "book a haircut", "facial price?", pricing, complaints — in any language.
            </div>
          )}
          {heroChat.map((m,i)=>(
            <div key={i} className={`hlc-msg ${m.r==="user"?"user":"ai"}`}>
              {m.r==="ai" && <span className="ai-tag">◈ Fastrill AI</span>}
              {m.m.split("\n").map((l,j,arr)=><span key={j}>{l}{j<arr.length-1&&<br/>}</span>)}
            </div>
          ))}
          {heroLoading && (
            <div className="hlc-typing">
              <span/><span/><span/>
            </div>
          )}
        </div>
        <div className="hlc-input">
          <input
            className="hlc-inp"
            placeholder="Book appointment, ask price, Hindi — anything..."
            value={heroMsg}
            onChange={e=>setHeroMsg(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&sendHeroMsg()}
          />
          <button className="hlc-send" onClick={sendHeroMsg} disabled={heroLoading}>➤</button>
        </div>
      </div>
    </div>
  </section>

  {/* TRUST BADGES */}
  <div className="trust-bar">
    <div className="trust-inner">
      {[
        {i:"✅",t:"Meta Official Business Partner"},
        {i:"🔒",t:"256-bit SSL Encrypted"},
        {i:"🇮🇳",t:"Hosted on Indian Servers"},
        {i:"📋",t:"GDPR Compliant"},
        {i:"⭐",t:"4.9/5 Customer Rating"},
        {i:"🛡️",t:"Zero Data Sharing with Third Parties"},
      ].map((b,i,arr)=>(
        <>
          <div key={b.t} className="trust-badge"><span>{b.i}</span>{b.t}</div>
          {i<arr.length-1 && <div key={b.t+"sep"} className="trust-sep"/>}
        </>
      ))}
    </div>
  </div>

  {/* MARQUEE */}
  <div className="mq-wrap">
    <div className="mq-track">
      {[...Array(2)].map((_,r)=>(
        ["💈 Salons","🧖 Spas","🏥 Clinics","🦷 Dental","💪 Gyms","💅 Nail Studios","🏠 Real Estate","🎓 Coaching","🍽️ Restaurants","💻 Agencies","🌿 Ayurveda","🏪 Retail"].map(b=>(
          <div key={r+b} className="mq-item">{b}</div>
        ))
      ))}
    </div>
  </div>

  {/* STATS */}
  <div className="stats-bar" ref={statsRef}>
    <div className="wrap">
      <div className="stats-row">
        <div className="stat-cell fade">
          <div className="stat-n">{counts.a.toLocaleString('en-IN')}<em>+</em></div>
          <div className="stat-l">Bookings automated</div>
          <div className="stat-s">every month across active businesses</div>
        </div>
        <div className="stat-cell fade">
          <div className="stat-n">{counts.b}<em>%</em></div>
          <div className="stat-l">Faster than human replies</div>
          <div className="stat-s">average 1.8 second response time</div>
        </div>
        <div className="stat-cell fade">
          <div className="stat-n">{counts.c}<em>%</em></div>
          <div className="stat-l">Reduction in missed leads</div>
          <div className="stat-s">from businesses in their first month</div>
        </div>
      </div>
    </div>
  </div>

  {/* PAIN */}
  <section className="sec" style={{background:"var(--base)"}}>
    <div className="wrap">
      <div className="fade" style={{maxWidth:600}}>
        <div className="label">The real cost</div>
        <h2 className="sh">Every unanswered message is<br/><span className="si">money leaving</span></h2>
        <p className="sp" style={{maxWidth:480}}>Most Indian businesses lose 40–60% of potential customers simply because no one replied in time. Your customers don't wait — they move on.</p>
      </div>
      <div className="pain-grid fade" style={{marginTop:52}}>
        {[
          {n:"01",icon:"🌙",t:"Leads arrive while you sleep",d:"A bridal client messages at 11 PM. You see it at 9 AM. She's already booked elsewhere. That's ₹8,500 gone because you were unavailable for 10 hours.",tag:"Lost revenue"},
          {n:"02",icon:"📱",t:"3 hours a day answering WhatsApp",d:"Your staff answers the same 10 questions about pricing, availability, and timing — every single day. That's time spent on phones instead of on customers in front of them.",tag:"Wasted time"},
          {n:"03",icon:"😤",t:"One slow reply becomes a 1-star review",d:"An upset customer messages. You're busy. The delay makes it worse. Fastrill responds in 2 seconds with empathy — de-escalating before it becomes a public problem.",tag:"Reputation risk"},
        ].map(p=>(
          <div key={p.n} className="pain-card">
            <div className="pain-num">{p.n}</div>
            <span className="pain-icon">{p.icon}</span>
            <div className="pain-t">{p.t}</div>
            <div className="pain-d">{p.d}</div>
            <div className="pain-tag">{p.tag}</div>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* HOW */}
  <section className="sec" id="how" style={{background:"var(--s1)"}}>
    <div className="wrap">
      <div className="fade">
        <div className="label">How it works</div>
        <h2 className="sh">Live in 10 minutes.<br/><span className="si">Zero technical knowledge.</span></h2>
        <p className="sp" style={{maxWidth:480}}>No developer. No training data. No complicated setup. Three steps from zero to a fully automated WhatsApp business.</p>
      </div>
      <div className="how-grid">
        {[
          {n:"1",t:"Connect WhatsApp",p:"Link your existing WhatsApp Business number via Meta's official API. One click, fully secure.",rows:[{on:true,dot:"#3fb950",text:"WhatsApp Business connected"},{on:false,dot:"#4a5568",text:"Phone: +91 98765 43210"},{on:true,dot:"#3fb950",text:"Status: Active ✓"}]},
          {n:"2",t:"Add Your Services",p:"Add services, prices, working hours, staff, and any custom rules. Plain English or Hindi.",rows:[{on:true,dot:"#3fb950",text:"Haircut — ₹400 · 30 min"},{on:true,dot:"#3fb950",text:"Hair Spa — ₹800 · 60 min"},{on:true,dot:"#3fb950",text:"Facial — ₹1,200 · 60 min"}]},
          {n:"3",t:"AI Handles Everything",p:"Every customer gets an instant, intelligent reply. Bookings confirmed, leads followed up — live in your dashboard.",rows:[{on:true,dot:"#3fb950",text:"✅ Booking confirmed · Priya · 3PM"},{on:true,dot:"#38bdf8",text:"📋 New lead · Rahul · Bridal pkg"},{on:false,dot:"#f59e0b",text:"💬 Anita asking about pricing"}]},
        ].map(s=>(
          <div key={s.n} className="how-card fade">
            <div className="how-n">{s.n}</div>
            <h3>{s.t}</h3>
            <p>{s.p}</p>
            <div className="how-ui">
              {s.rows.map((r,i)=>(
                <div key={i} className={`how-row${r.on?" on":""}`}>
                  <div className="how-dot" style={{background:r.on?r.dot:"var(--ink3)"}}/>
                  {r.text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* GROWTH LOOP */}
  <section className="sec" style={{background:"var(--base)"}}>
    <div className="wrap">
      <div className="fade" style={{textAlign:"center"}}>
        <div className="label" style={{justifyContent:"center"}}>The Growth Engine</div>
        <h2 className="sh" style={{textAlign:"center"}}>How Fastrill grows your<br/><span className="si">business automatically</span></h2>
        <p className="sp" style={{maxWidth:520,margin:"0 auto"}}>Every conversation Fastrill handles creates a compounding effect. Here's exactly how your business grows — month after month — without extra staff or ad spend.</p>
      </div>
      <div className="growth-loop">
        <div className="growth-center">
          {GROWTH_LOOPS.map((step,i)=>(
            <div key={step.n} style={{width:"100%",maxWidth:860,margin:"0 auto"}}>
              <div className="gl-step" style={{display:"grid",gridTemplateColumns:i%2===0?"1fr 80px 1fr":"1fr 80px 1fr",gap:0,alignItems:"center"}}>
                {i%2===0 ? <>
                  <div className="gl-card fade" style={{textAlign:"right"}}>
                    <div className="gl-num">{step.n}</div>
                    <span className="gl-icon">{step.icon}</span>
                    <div className="gl-t">{step.t}</div>
                    <div className="gl-d">{step.d}</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"16px 0"}}>
                    <div style={{width:2,height:40,background:"linear-gradient(to bottom,var(--g0),rgba(63,185,80,.2))",margin:"0 auto"}}/>
                    {step.arrow && <div style={{fontSize:18,color:"var(--g0)",lineHeight:1}}>↓</div>}
                  </div>
                  <div/>
                </> : <>
                  <div/>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"16px 0"}}>
                    <div style={{width:2,height:40,background:"linear-gradient(to bottom,var(--g0),rgba(63,185,80,.2))",margin:"0 auto"}}/>
                    {step.arrow && <div style={{fontSize:18,color:"var(--g0)",lineHeight:1}}>↓</div>}
                  </div>
                  <div className="gl-card fade">
                    <div className="gl-num">{step.n}</div>
                    <span className="gl-icon">{step.icon}</span>
                    <div className="gl-t">{step.t}</div>
                    <div className="gl-d">{step.d}</div>
                  </div>
                </>}
              </div>
            </div>
          ))}
          <div className="fade" style={{textAlign:"center",marginTop:32,padding:"24px 32px",background:"var(--gl)",border:"1px solid var(--gb)",borderRadius:16,maxWidth:480,margin:"32px auto 0"}}>
            <div style={{fontSize:28,marginBottom:8}}>🔄</div>
            <div style={{fontSize:15,fontWeight:700,color:"var(--ink)",marginBottom:6}}>The loop never stops</div>
            <div style={{fontSize:13,color:"var(--ink2)",lineHeight:1.7,fontWeight:300}}>Every new customer Fastrill converts becomes a repeat customer, who refers more customers — all while you focus on delivering great service.</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* DEMO */}
  <section className="sec" id="demo" style={{background:"var(--s1)"}}>
    <div className="wrap">
      <div className="fade">
        <div className="label">Live demo</div>
        <h2 className="sh">Real conversations.<br/><span className="si">Real intelligence.</span></h2>
        <p className="sp" style={{maxWidth:480}}>Click any scenario to watch the AI handle it. Different context, different tone — but always instant, always accurate.</p>
      </div>
      <div className="demo-wrap">
        <div className="demo-tabs fade">
          {[{k:"booking",t:"📅 Booking",d:"End-to-end"},{k:"hindi",t:"🇮🇳 Hindi",d:"Auto-detected"},{k:"lead",t:"💰 Bridal Lead",d:"High-value"},{k:"angry",t:"😤 Complaint",d:"Empathy mode"}].map(s=>(
            <div key={s.k} className={`demo-tab${convo===s.k?" on":""}`} onClick={()=>setConvo(s.k)}>
              <div className="dt-t">{s.t}</div>
              <div className="dt-s">{s.d}</div>
            </div>
          ))}
        </div>
        <div className="wa-frame fade">
          <div className="wa-hd">
            <div className="wa-av">R</div>
            <div><div className="wa-nm">Riya Salon</div><div className="wa-st">◈ Fastrill AI · Online</div></div>
          </div>
          <div className="wa-body" ref={chatRef}>
            {msgs.map((m,i)=>(
              <div key={i} className={`cm ${m.t==="c"?"c":"a"}`}>
                {m.t==="a"&&<span className="cm-tag">◈ Fastrill AI</span>}
                {m.m.split("\n").map((l,j,arr)=>(
                  <span key={j}>{l}{j<arr.length-1&&<br/>}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* FEATURES */}
  <section className="sec" id="features" style={{background:"var(--base)"}}>
    <div className="wrap">
      <div className="fade">
        <div className="label">Features</div>
        <h2 className="sh">Not a chatbot.<br/><span className="si">A real AI receptionist.</span></h2>
        <p className="sp" style={{maxWidth:500}}>Built with genuine intelligence — memory, emotion detection, multilingual support. Everything a trained human receptionist does, at unlimited scale.</p>
      </div>
      <div className="feat-grid">
        {[
          {i:"🧠",badge:"Core AI",t:"Real Intent Detection",d:"Understands 'I want to come tomorrow evening for a facial' — not just keywords. Works across all 10+ Indian languages automatically."},
          {i:"💬",badge:"Language",t:"10+ Indian Languages",d:"Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, English — auto-detected. Zero setup required."},
          {i:"🔄",badge:"Smart",t:"Handles Interruptions",d:"Customer asks a price question mid-booking? AI answers it and returns to the booking — exactly like a trained human would."},
          {i:"😤",badge:"AI v2",t:"Emotion Detection",d:"Detects frustration or anger in real time. Switches to empathy mode — de-escalates before you even know there's an issue."},
          {i:"🧩",badge:"Memory",t:"Remembers Every Customer",d:"Preferred services, favorite times, past visits, language. Return customers feel recognized, not like strangers."},
          {i:"🎯",badge:"Revenue",t:"Lead Recovery",d:"Customer dropped mid-booking? Fastrill follows up at the right moment. Every missed lead gets a second chance automatically."},
          {i:"👤",badge:"Control",t:"Smart Human Handoff",d:"Knows when to stop — refunds, disputes, complex issues. Pauses and notifies you instantly with full conversation context."},
          {i:"📢",badge:"Marketing",t:"WhatsApp Campaigns",d:"Send Meta-approved bulk messages. Target segments, track opens and replies, measure conversion — all from your dashboard."},
          {i:"📊",badge:"Analytics",t:"Full Revenue Dashboard",d:"Conversations, bookings, leads, campaigns — all in one view. Track AI quality, revenue impact, and response metrics live."},
        ].map(f=>(
          <div key={f.t} className="fc fade">
            <div className="fc-badge">{f.badge}</div>
            <div className="fc-ico">{f.i}</div>
            <div className="fc-t">{f.t}</div>
            <div className="fc-d">{f.d}</div>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* WHO */}
  <section className="sec" style={{background:"var(--s1)"}}>
    <div className="wrap">
      <div className="fade" style={{textAlign:"center"}}>
        <div className="label" style={{justifyContent:"center"}}>Who it's for</div>
        <h2 className="sh" style={{textAlign:"center"}}>Built for every business<br/><span className="si">that runs on customers</span></h2>
        <p className="sp" style={{maxWidth:460,margin:"0 auto"}}>If your customers message you on WhatsApp and you want to convert more — Fastrill works for you.</p>
      </div>
      <div className="who-grid">
        {[
          {e:"💈",n:"Salons & Parlours",d:"Book haircuts, facials, threading"},{e:"🧖",n:"Spas & Wellness",d:"Schedule massages and treatments"},{e:"🏥",n:"Clinics & Doctors",d:"Appointments and follow-ups"},{e:"🦷",n:"Dental Clinics",d:"Checkups and treatments"},{e:"💪",n:"Gyms & Fitness",d:"PT sessions, memberships"},{e:"💅",n:"Nail & Makeup",d:"Bookings and bridal packages"},{e:"🏠",n:"Real Estate",d:"Qualify leads, site visits"},{e:"🎓",n:"Coaching",d:"Discovery calls, enrolments"},{e:"🍽️",n:"Restaurants",d:"Reservations and menu queries"},{e:"💻",n:"Agencies",d:"Lead qualification and demos"},{e:"🌿",n:"Ayurveda & Physio",d:"Consultations and therapy"},{e:"🏪",n:"Retail & D2C",d:"Orders and product queries"},
        ].map(u=>(
          <div key={u.n} className="who fade">
            <span className="who-e">{u.e}</span>
            <div className="who-n">{u.n}</div>
            <p className="who-d">{u.d}</p>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* VS */}
  <section className="sec" style={{background:"var(--base)"}}>
    <div className="wrap">
      <div className="vs-layout">
        <div className="fade">
          <div className="label">Why Fastrill</div>
          <h2 className="sh">Not just another<br/><span className="si">WhatsApp tool</span></h2>
          <p className="sp">Most tools give you rigid button menus that break the moment a customer says anything unexpected. Fastrill actually understands — in any language, in any context.</p>
          <div className="vs-pts">
            {["Understands natural language — not just preset commands","Remembers every customer across all conversations","Handles any message, not just expected ones","Detects emotion and adapts tone in real time","Never guesses on pricing, policy, or availability","Knows exactly when to hand off to a human","Built specifically for Indian languages and context"].map(p=>(
              <div key={p} className="vs-pt"><div className="vs-ck">✓</div>{p}</div>
            ))}
          </div>
        </div>
        <div className="vs-tbl fade">
          <div className="vs-head">
            <div className="vs-th tm">Other tools</div>
            <div className="vs-th us">Fastrill</div>
          </div>
          {[["Fixed button menus","Natural conversation"],["English only","10+ Indian languages"],["Breaks on unexpected","Handles anything"],["No memory","Remembers every customer"],["No emotion awareness","Adapts to mood"],["Per-message billing","Flat monthly unlimited"],["Needs a developer","10-min self-setup"],["Generic bot replies","Business-specific AI"]].map(([t,u])=>(
            <div key={t} className="vs-row">
              <div className="vs-c tm">{t}</div>
              <div className="vs-c us">{u}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>

  {/* PRICING */}
  <section className="sec" id="pricing" style={{background:"var(--s1)"}}>
    <div className="wrap">
      <div className="fade" style={{textAlign:"center"}}>
        <div className="label" style={{justifyContent:"center"}}>Pricing</div>
        <h2 className="sh" style={{textAlign:"center"}}>Simple pricing.<br/><span className="si">Pays for itself.</span></h2>
        <p className="sp" style={{maxWidth:440,margin:"0 auto"}}>No per-message charges. Flat monthly. One extra booking per week covers the entire plan.</p>
      </div>
      <div className="p-wrap">
        {[
          {
            tier:"Starter",price:"999",tagline:"For solo operators & new businesses",cta:"Get Started",cs:"out",pop:false,
            val:"1 extra booking/week = plan fully paid off",
            feats:[
              {c:"hi",t:"1 WhatsApp number"},{c:"hi",t:"300 AI conversations/month"},{c:"hi",t:"Appointment booking automation"},{c:"hi",t:"10+ Indian languages"},
              {c:"exc",t:"Customer memory"},{c:"exc",t:"Lead recovery automation"},{c:"exc",t:"WhatsApp campaigns"},{c:"exc",t:"Priority support"},
            ]
          },
          {
            tier:"Growth",price:"1,999",tagline:"For growing businesses",cta:"Start Free Trial →",cs:"go",pop:true,badge:"Most Popular",
            val:"Unlimited conversations — no per-message fees ever",
            feats:[
              {c:"hi",t:"1 WhatsApp number"},{c:"hi",t:"Unlimited AI conversations"},{c:"hi",t:"Customer memory & history"},{c:"hi",t:"Lead recovery automation"},
              {c:"hi",t:"Emotion detection & handoff"},{c:"hi",t:"WhatsApp campaigns"},{c:"hi",t:"Advanced analytics"},{c:"hi",t:"Priority support"},
            ]
          },
          {
            tier:"Pro",price:"4,999",tagline:"Multi-branch & growing teams",cta:"Contact Sales",cs:"out",pop:false,
            val:"Up to 5 WhatsApp numbers — one dashboard",
            feats:[
              {c:"hi",t:"Up to 5 WhatsApp numbers"},{c:"hi",t:"Everything in Growth"},{c:"hi",t:"Multi-branch management"},{c:"hi",t:"Staff availability routing"},
              {c:"hi",t:"Custom AI playbook"},{c:"hi",t:"API access"},{c:"hi",t:"Dedicated onboarding call"},{c:"hi",t:"SLA support"},
            ]
          },
        ].map(plan=>(
          <div key={plan.tier} className={`plan fade${plan.pop?" pop":""}`}>
            {plan.badge&&<div className="p-pop-badge">{plan.badge}</div>}
            <div className="p-tier">{plan.tier}</div>
            <div className="p-tagline">{plan.tagline}</div>
            <div className="p-pr"><span className="p-rs">₹</span><span className="p-amt">{plan.price}</span></div>
            <div className="p-mo">per month + GST</div>
            <div className="p-val">💡 {plan.val}</div>
            <hr className="p-hr"/>
            <ul className="p-list">
              {plan.feats.map(f=>(
                <li key={f.t} className={f.c}>{f.t}</li>
              ))}
            </ul>
            <a href="/signup" className={`p-btn ${plan.cs}`}>{plan.cta}</a>
          </div>
        ))}
      </div>
      <p className="p-foot">All plans include a <strong style={{color:"var(--ink)",fontWeight:600}}>14-day free trial</strong> · No credit card · Cancel anytime</p>
    </div>
  </section>

  {/* TESTIMONIALS */}
  <section className="sec" style={{background:"var(--base)"}}>
    <div className="wrap">
      <div className="fade" style={{textAlign:"center"}}>
        <div className="label" style={{justifyContent:"center"}}>Results</div>
        <h2 className="sh" style={{textAlign:"center"}}>Real results from<br/><span className="si">real Indian businesses</span></h2>
      </div>
      <div className="t-grid">
        {[
          {i:"P",g:"#f59e0b,#ef4444",n:"Priya Sharma",b:"Glow Beauty Parlour, Hyderabad",r:"+40% bookings in month 1",tx:"Before Fastrill I was losing bookings at night because nobody replied. Now I wake up to confirmed bookings every morning. It paid for itself in week one."},
          {i:"R",g:"#3b82f6,#0ea5e9",n:"Dr. Ravi Kumar",b:"Apollo Skin Clinic, Vijayawada",r:"Saved ₹18,000/month on staff",tx:"My patients message in Telugu and the AI replies perfectly in Telugu. Books appointments, answers questions, follows up. I had to see it to believe it."},
          {i:"S",g:"#3fb950,#0ea5e9",n:"Sneha Reddy",b:"Studio S — 3 branches, Bangalore",r:"Replaced 2 receptionist shifts",tx:"3 branches, all WhatsApp managed simultaneously by Fastrill. Our staff now focuses on in-person customers, not their phones all day."},
          {i:"A",g:"#a855f7,#6366f1",n:"Arjun Mehta",b:"FitLife Gym, Mumbai",r:"320 new members via WhatsApp",tx:"I used to spend 3 hours a day on membership inquiries. Fastrill qualifies leads, explains packages, and books demos. Completely hands-off."},
          {i:"N",g:"#f59e0b,#10b981",n:"Nandini Iyer",b:"Ayur Wellness, Chennai",r:"60% fewer cancellations",tx:"Clients ask in Tamil, AI responds in Tamil. It follows up 1 hour before every appointment. Cancellations dropped dramatically in the first month."},
          {i:"V",g:"#10b981,#0ea5e9",n:"Vikram Nair",b:"Pixel Agency, Kochi",r:"4x faster lead qualification",tx:"We qualify discovery call leads with Fastrill. It asks the right questions, gets budget and timeline, books calls with serious prospects only."},
        ].map(t=>(
          <div key={t.n} className="tc fade">
            <div className="tc-badge">📈 {t.r}</div>
            <div className="tc-stars">★★★★★</div>
            <p className="tc-txt">"{t.tx}"</p>
            <div className="tc-auth">
              <div className="tc-av" style={{background:`linear-gradient(135deg,${t.g})`}}>{t.i}</div>
              <div>
                <div className="tc-nm">{t.n}</div>
                <div className="tc-bz">{t.b}</div>
                <div className="tc-verified">✅ Verified Customer</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* FOUNDER STORY */}
  <section className="founder-sec" id="founder">
    <div className="founder-inner">
      <div className="fade" style={{textAlign:"center",marginBottom:40}}>
        <div className="label" style={{justifyContent:"center"}}>Our Story</div>
        <h2 className="sh" style={{textAlign:"center"}}>Why we built<br/><span className="si">Fastrill</span></h2>
      </div>
      <div className="founder-story fade">
        <span className="founder-quote-mark">"</span>
        <p className="founder-story-text">
          I ran a small coaching center in Mumbai. We were spending <strong>₹30,000 a month on Instagram and Google ads</strong> — and the leads were coming in. The phone was buzzing. WhatsApp was filling up.<br/><br/>
          But here's the thing — <strong>I was the only one who could answer properly.</strong> My staff didn't know the pricing well enough. They'd say "I'll check and call you back." Half the time, they forgot. Or the customer had already signed up somewhere else.<br/><br/>
          I'd wake up at 7 AM to <em>11 unread messages</em>. Leads from the night before. People asking about batch timings, fees, demo classes. By the time I replied — at 7:15 AM — <strong>three of them had already gone to competitors.</strong> I could see the "last seen" timestamps. They were up at midnight. They messaged three places. The one that replied first — won.<br/><br/>
          I tried hiring a receptionist. She was great — during office hours. But leads don't come only during office hours. A mother researching coaching for her child does it at 10 PM after putting the kids to sleep. A professional looking for a gym slot messages at 6 AM before his commute.<br/><br/>
          <strong>I was paying ₹30,000 in ads to generate interest — and losing 60% of it because nobody replied fast enough.</strong> The ads weren't the problem. The reply speed was.<br/><br/>
          So we built Fastrill. Not a chatbot with fixed menus — those break the moment someone asks something slightly different. A <em>real AI that understands context, remembers customers, speaks their language, and books the appointment end-to-end.</em><br/><br/>
          Today, Fastrill is live for businesses across India. Salons in Hyderabad. Clinics in Vijayawada. Gyms in Mumbai. Coaching centers like mine. <strong>Every single one of them was losing money in the gap between "ad click" and "reply received."</strong> Fastrill closes that gap — permanently, 24/7, in any language.<br/><br/>
          <em>If you've ever woken up to missed messages and felt that sinking feeling — this is for you.</em>
        </p>
        <div className="founder-profile">
          <div className="founder-av">K</div>
          <div>
            <div className="founder-name">Karan Mehta</div>
            <div className="founder-title">Founder & CEO, Fastrill</div>
            <div className="founder-company">a product by Solvabil Pvt. Ltd. · Made in India 🇮🇳</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* FAQ */}
  <section className="sec" id="faq" style={{background:"var(--s1)"}}>
    <div className="wrap">
      <div className="fade" style={{textAlign:"center"}}>
        <div className="label" style={{justifyContent:"center"}}>FAQ</div>
        <h2 className="sh" style={{textAlign:"center"}}>Honest answers</h2>
        <p className="sp" style={{maxWidth:400,margin:"0 auto"}}>Everything you need to know before starting. No fluff, no pressure.</p>
      </div>
      <div className="faq-box">
        {FAQS.map((q,i)=>(
          <div key={i} className={`fi${faq===i?" op":""}`}>
            <button className="fb" onClick={()=>setFaq(faq===i?null:i)}>
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
    <div className="wrap">
      <div className="cta-card fade">
        <h2 className="cta-h">Your next customer is<br/>messaging you <span className="si">right now</span></h2>
        <p className="cta-p">Don't make them wait. Don't lose them to a competitor who replies faster.<br/>Fastrill answers in 2 seconds — in their language, every time, 24/7.</p>
        <div className="cta-btns">
          <a href="/signup" className="btn-prime">Start Free Trial — No Card Needed →</a>
          <a href="https://wa.me/919346079265" className="btn-wa">💬 Chat on WhatsApp</a>
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
          <a href="/" className="nav-logo" style={{display:"inline-flex"}}>
            <span style={{fontFamily:"var(--sans)",fontWeight:700,fontSize:17,color:"var(--ink)",letterSpacing:"-.4px"}}>
              fast<span style={{color:"var(--g0)"}}>rill</span>
            </span>
          </a>
          <p className="ft-tagline">AI-powered WhatsApp automation for Indian businesses. Turns every message into a booked customer — 24/7, in any language.</p>
          <div style={{marginTop:16,display:"flex",gap:8,flexWrap:"wrap"}}>
            {["✅ Meta Partner","🔒 SSL Encrypted","🇮🇳 Indian Servers"].map(b=>(
              <div key={b} style={{fontSize:11,color:"var(--ink3)",background:"var(--s2)",border:"1px solid var(--line)",borderRadius:6,padding:"3px 8px"}}>{b}</div>
            ))}
          </div>
        </div>
        {[
          {h:"Product",lks:[["Features","#features"],["Pricing","#pricing"],["Demo","#demo"],["How it works","#how"]]},
          {h:"Company",lks:[["About","#founder"],["Blog","/blog"],["Contact","/contact"]]},
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
