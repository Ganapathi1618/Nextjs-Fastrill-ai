"use client"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const NAV = [
  { id:"overview",  label:"Revenue Engine", icon:"⬡", path:"/dashboard" },
  { id:"inbox",     label:"Conversations",  icon:"◎", path:"/dashboard/conversations" },
  { id:"bookings",  label:"Bookings",       icon:"◷", path:"/dashboard/bookings" },
  { id:"campaigns", label:"Campaigns",      icon:"◆", path:"/dashboard/campaigns" },
  { id:"leads",     label:"Lead Recovery",  icon:"◉", path:"/dashboard/leads" },
  { id:"contacts",  label:"Customers",      icon:"◑", path:"/dashboard/contacts" },
  { id:"analytics", label:"Analytics",      icon:"▦", path:"/dashboard/analytics" },
  { id:"settings",  label:"Settings",       icon:"◌", path:"/dashboard/settings" },
]

const TEMPLATES = [
  { id:"offer",    label:"Special Offer 🎉",       text:"Hi {name}! 🎉 Special offer just for you — get 20% off your next visit this week!\n\nBook now: Reply BOOK\n\n{business}" },
  { id:"reminder", label:"Appointment Reminder ⏰", text:"Hi {name}! ⏰ Just a reminder about your upcoming appointment.\n\nSee you soon at {business}! 😊\nReply RESCHEDULE if you need to change." },
  { id:"winback",  label:"Win Back 💔",             text:"Hi {name}! We miss you 😊 It's been a while since your last visit.\n\nCome back this week and get a special treat! 🎁\nReply BOOK to schedule. — {business}" },
  { id:"festival", label:"Festival Greetings 🪔",   text:"Hi {name}! Wishing you a wonderful celebration! 🪔✨\n\nTreat yourself this festive season at {business}!\nReply BOOK 😊" },
  { id:"review",   label:"Ask for Review ⭐",        text:"Hi {name}! Thank you for visiting {business} 😊\n\nWe'd love your feedback! Quick review takes 2 mins 🙏\n\n{cta}" },
  { id:"referral", label:"Referral Ask 🤝",          text:"Hi {name}! Loved your recent visit at {business}? 😊\n\nRefer a friend and both of you get 10% off!\nJust ask them to mention your name when booking 🎁" },
  { id:"custom",   label:"Custom Message ✏️",        text:"" },
]

const SEGMENTS = [
  { id:"all",       label:"All Customers",       desc:"Everyone who has messaged you" },
  { id:"new_lead",  label:"New Leads",            desc:"First-time contacts, haven't booked" },
  { id:"returning", label:"Returning",            desc:"Booked 2+ times" },
  { id:"vip",       label:"VIP",                  desc:"Tagged as VIP" },
  { id:"inactive",  label:"Inactive 30d+",        desc:"Haven't visited in 30+ days" },
  { id:"csv",       label:"Upload CSV / Numbers", desc:"Custom phone number list" },
]

export default function Campaigns() {
  const router = useRouter()
  const fileRef = useRef(null)

  const [userEmail, setUserEmail]   = useState("")
  const [userId, setUserId]         = useState(null)
  const [dark, setDark]             = useState(true)
  const [mobSidebarOpen, setMobSidebarOpen] = useState(false)
  const [customers, setCustomers]   = useState([])
  const [optouts, setOptouts]       = useState([])
  const [whatsapp, setWhatsapp]     = useState(null)
  const [biz, setBiz]               = useState(null)
  const [loading, setLoading]       = useState(true)
  const [sending, setSending]       = useState(false)
  const [sent, setSent]             = useState(0)
  const [failed, setFailed]         = useState(0)
  const [tab, setTab]               = useState("compose")
  const [step, setStep]             = useState("compose")

  const [selectedTemplate, setSelectedTemplate] = useState("offer")
  const [segment, setSegment]       = useState("all")
  const [message, setMessage]       = useState(TEMPLATES[0].text)
  const [campaignName, setCampaignName] = useState("")
  const [ctaText, setCtaText]       = useState("")
  const [ctaUrl, setCtaUrl]         = useState("")
  const [csvNumbers, setCsvNumbers] = useState([])
  const [testPhone, setTestPhone]   = useState("")
  const [testSending, setTestSending] = useState(false)
  const [testSent, setTestSent]     = useState(false)
  const [history, setHistory]       = useState([])

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) router.push("/login")
      else { setUserEmail(data.user.email||""); setUserId(data.user.id) }
    })
  }, [])

  useEffect(() => { if (userId) loadData() }, [userId])

  async function loadData() {
    setLoading(true)
    const [{ data: custs }, { data: wa }, { data: bizData }, { data: opts }, { data: hist }] = await Promise.all([
      supabase.from("customers").select("id,name,phone,tag,last_visit_at,created_at").eq("user_id", userId),
      supabase.from("whatsapp_connections").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("business_settings").select("business_name").eq("user_id", userId).maybeSingle(),
      supabase.from("campaign_optouts").select("phone").eq("user_id", userId),
      supabase.from("campaigns").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
    ])
    setCustomers(custs || [])
    setWhatsapp(wa || null)
    setBiz(bizData || null)
    setOptouts((opts||[]).map(o => o.phone))
    setHistory(hist || [])
    setLoading(false)
  }

  function normalisePhone(phone) {
    const d = (phone||"").replace(/[^0-9]/g, "")
    if (d.length === 12 && d.startsWith("91")) return d.slice(2)
    if (d.length === 11 && d.startsWith("0"))  return d.slice(1)
    return d.length >= 10 ? d.slice(-10) : d
  }

  function getAudience() {
    const now = new Date()
    const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate()-30)
    let base = segment === "csv"
      ? csvNumbers.map((phone, i) => ({ id:`csv-${i}`, name:phone, phone }))
      : customers.filter(c => {
          if (segment === "all")       return true
          if (segment === "new_lead")  return c.tag === "new_lead"
          if (segment === "returning") return c.tag === "returning" || c.tag === "vip"
          if (segment === "vip")       return c.tag === "vip"
          if (segment === "inactive")  return new Date(c.last_visit_at||c.created_at) < thirtyDaysAgo
          return true
        }).filter(c => c.phone)

    // Deduplicate by normalised phone
    const seen = new Set()
    base = base.filter(c => {
      const n = normalisePhone(c.phone)
      if (seen.has(n)) return false
      seen.add(n); return true
    })

    // Remove opt-outs
    const optoutSet = new Set(optouts.map(normalisePhone))
    return base.filter(c => !optoutSet.has(normalisePhone(c.phone)))
  }

  function buildMessage(customer) {
    const firstName = (customer.name||"there").split(" ")[0]
    const businessName = biz?.business_name || "us"
    const ctaLine = ctaUrl ? `\n\n${ctaText||"Book now"}: ${ctaUrl}` : ""
    return (message
      .replace(/\{name\}/g, firstName)
      .replace(/\{business\}/g, businessName)
      .replace(/\{cta\}/g, ctaUrl ? `${ctaText||"Click here"}: ${ctaUrl}` : "")
    ) + ctaLine
  }

  async function sendTestMessage() {
    if (!testPhone.trim() || !whatsapp) return
    setTestSending(true)
    try {
      const phone = testPhone.replace(/[^0-9]/g, "")
      const text  = buildMessage({ name: "Test User", phone })
      const res = await fetch(`https://graph.facebook.com/v18.0/${whatsapp.phone_number_id}/messages`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${whatsapp.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product:"whatsapp", to:phone, type:"text", text:{ body:text, preview_url:false } })
      })
      const d = await res.json()
      if (!d.error) { setTestSent(true); setTimeout(() => setTestSent(false), 3000) }
      else alert("Failed: " + d.error.message)
    } catch(e) { alert("Error: " + e.message) }
    setTestSending(false)
  }

  async function sendCampaign() {
    if (!message.trim() || !campaignName.trim()) return
    const audience = getAudience()
    if (!audience.length) return
    setSending(true); setSent(0); setFailed(0); setStep("sending")
    let sentCount=0, failCount=0

    for (const customer of audience) {
      try {
        const text  = buildMessage(customer)
        const phone = customer.phone.replace(/[^0-9]/g, "")
        const res = await fetch(`https://graph.facebook.com/v18.0/${whatsapp.phone_number_id}/messages`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${whatsapp.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ messaging_product:"whatsapp", to:phone, type:"text", text:{ body:text, preview_url:false } })
        })
        const d = await res.json()
        if (!d.error) { sentCount++; setSent(sentCount) }
        else          { failCount++; setFailed(failCount) }
        await new Promise(r => setTimeout(r, 1200))
      } catch(e) { failCount++; setFailed(failCount) }
    }

    try {
      await supabase.from("campaigns").insert({
        user_id: userId, name: campaignName, segment, message,
        sent_count: sentCount, failed_count: failCount,
        status: "completed", sent_at: new Date().toISOString(), created_at: new Date().toISOString()
      })
      loadData()
    } catch(e) { console.warn("History save:", e) }

    setSending(false); setStep("done")
  }

  function handleCsvUpload(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const lines = ev.target.result.split(/\r?\n/).map(l=>l.trim()).filter(Boolean)
      const phones = []
      for (const line of lines) {
        for (const col of line.split(",")) {
          const digits = col.replace(/[^0-9]/g,"")
          if (digits.length >= 10) { phones.push(digits); break }
        }
      }
      setCsvNumbers([...new Set(phones)]); setSegment("csv")
    }
    reader.readAsText(file)
  }

  const toggleTheme  = () => { const n=!dark; setDark(n); localStorage.setItem("fastrill-theme",n?"dark":"light") }
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login") }

  const bg=dark?"#08080e":"#f0f2f5", sidebar=dark?"#0c0c15":"#ffffff", card=dark?"#0f0f1a":"#ffffff"
  const border=dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.08)", cardBorder=dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.09)"
  const text=dark?"#eeeef5":"#111827", textMuted=dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const textFaint=dark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.25)", inputBg=dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"
  const accent=dark?"#00d084":"#00935a", accentDim=dark?"rgba(0,208,132,0.12)":"rgba(0,147,90,0.1)"
  const navText=dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const navActive=dark?"rgba(0,196,125,0.1)":"rgba(0,180,115,0.08)"
  const navActiveBorder=dark?"rgba(0,196,125,0.2)":"rgba(0,180,115,0.2)"
  const navActiveText=dark?"#00c47d":"#00935a"
  const userInitial = userEmail?userEmail[0].toUpperCase():"G"
  const inp = { background:inputBg, border:`1px solid ${cardBorder}`, borderRadius:8, padding:"9px 12px", fontSize:13, color:text, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none", width:"100%" }

  const audience = getAudience()
  const previewCustomer = audience[0] || customers[0] || { name:"Priya", phone:"" }
  const msgLength = buildMessage(previewCustomer).length
  const WA_LIMIT = 4096

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${bg}!important;color:${text}!important;font-family:'Plus Jakarta Sans',sans-serif!important;}
        .wrap{display:flex;height:100vh;overflow:hidden;}
        .sidebar{width:224px;flex-shrink:0;background:${sidebar};border-right:1px solid ${border};display:flex;flex-direction:column;overflow-y:auto;}
        .logo{padding:22px 20px 18px;font-weight:800;font-size:20px;color:${text};text-decoration:none;display:block;border-bottom:1px solid ${border};}
        .logo span{color:${accent};}
        .nav-section{padding:18px 16px 7px;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${textFaint};font-weight:600;}
        .nav-item{display:flex;align-items:center;gap:9px;padding:9px 12px;margin:1px 8px;border-radius:8px;cursor:pointer;font-size:13.5px;color:${navText};font-weight:500;transition:all 0.13s;border:1px solid transparent;background:none;width:calc(100% - 16px);text-align:left;font-family:'Plus Jakarta Sans',sans-serif;}
        .nav-item:hover{background:${inputBg};color:${text};}
        .nav-item.active{background:${navActive};color:${navActiveText};font-weight:600;border-color:${navActiveBorder};}
        .nav-icon{font-size:13px;width:18px;text-align:center;flex-shrink:0;}
        .sidebar-footer{margin-top:auto;padding:14px;border-top:1px solid ${border};}
        .user-card{display:flex;align-items:center;gap:9px;padding:9px;border-radius:9px;background:${inputBg};border:1px solid ${cardBorder};}
        .user-avatar{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,${accent},#0ea5e9);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#fff;flex-shrink:0;}
        .user-email{font-size:11.5px;color:${textMuted};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .logout-btn{margin-top:7px;width:100%;padding:7px;border-radius:7px;background:transparent;border:1px solid ${cardBorder};font-size:12px;color:${textMuted};cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .logout-btn:hover{border-color:#fca5a5;color:#ef4444;}
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .topbar{height:54px;flex-shrink:0;border-bottom:1px solid ${border};display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:${sidebar};}
        .tb-title{font-weight:700;font-size:15px;color:${text};}
        .topbar-r{display:flex;align-items:center;gap:8px;}
        .theme-toggle{display:flex;align-items:center;gap:6px;padding:5px 10px;background:${inputBg};border:1px solid ${cardBorder};border-radius:8px;cursor:pointer;font-size:11.5px;color:${textMuted};font-family:'Plus Jakarta Sans',sans-serif;}
        .toggle-pill{width:30px;height:16px;border-radius:100px;background:${dark?accent:"#d1d5db"};position:relative;flex-shrink:0;}
        .toggle-pill::after{content:'';position:absolute;top:2px;width:12px;height:12px;border-radius:50%;background:#fff;left:${dark?"16px":"2px"};}
        .content{flex:1;overflow-y:auto;padding:18px 20px;background:${bg};}
        .tmpl-card{padding:9px 12px;border-radius:8px;cursor:pointer;border:1px solid ${cardBorder};background:transparent;transition:all 0.12s;margin-bottom:5px;text-align:left;width:100%;font-family:'Plus Jakarta Sans',sans-serif;}
        .tmpl-card:hover{background:${inputBg};}
        .seg-card{padding:9px 11px;border-radius:8px;cursor:pointer;border:1px solid ${cardBorder};background:transparent;margin-bottom:5px;transition:all 0.12s;}
        .seg-card:hover{border-color:${accent}33;}
        select option{background-color:#0c0c15!important;color:#eeeef5!important;}
        .campaign-grid{display:grid;grid-template-columns:250px 1fr 260px;gap:14px;}
        /* MOBILE */
        @media(max-width:767px){
          .wrap{position:relative;}
          .sidebar{position:fixed;top:0;left:0;height:100vh;z-index:300;transform:translateX(-100%);transition:transform 0.25s ease;width:240px!important;box-shadow:4px 0 24px rgba(0,0,0,0.5);}
          .sidebar.mob-open{transform:translateX(0);}
          .topbar{padding:0 12px!important;}
          .content{padding:10px!important;}
          .hamburger{display:flex!important;}
          .campaign-grid{grid-template-columns:1fr!important;}
        }
        .mob-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:299;cursor:pointer;}
        @media(max-width:767px){.mob-overlay.open{display:block;}}
        .hamburger{display:none;background:${inputBg};border:1px solid ${cardBorder};border-radius:8px;padding:6px 9px;cursor:pointer;font-size:17px;color:${text};line-height:1;margin-right:4px;}
        .bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;background:${sidebar};border-top:1px solid ${border};padding:6px 0;z-index:200;}
        @media(max-width:767px){.bottom-nav{display:flex;justify-content:space-around;}.main{padding-bottom:60px;}}
        .bnav-btn{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 6px;border:none;background:transparent;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;flex:1;}
        .bnav-icon{font-size:17px;color:${textFaint};}
        .bnav-label{font-size:9px;font-weight:600;color:${textFaint};}
        .bnav-btn.active .bnav-icon,.bnav-btn.active .bnav-label{color:${accent};}
      `}</style>

      <div className="wrap">
        <div className={`mob-overlay${mobSidebarOpen?" open":""}`} onClick={()=>setMobSidebarOpen(false)}/>
        <aside className={`sidebar${mobSidebarOpen?" mob-open":""}`}>
          <a href="/dashboard" className="logo">fast<span>rill</span></a>
          <div className="nav-section">Platform</div>
          {NAV.map(item=>(
            <button key={item.id} className={`nav-item${item.id==="campaigns"?" active":""}`} onClick={()=>{router.push(item.path);setMobSidebarOpen(false)}}>
              <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
          <div className="sidebar-footer">
            <div className="user-card">
              <div className="user-avatar">{userInitial}</div>
              <div className="user-email">{userEmail||"Loading..."}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>↩ Sign out</button>
          </div>
        </aside>

        <div className="main">
          <div className="topbar">
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <button className="hamburger" onClick={()=>setMobSidebarOpen(s=>!s)}>☰</button>
              <span className="tb-title">Campaigns</span>
              <div style={{display:"flex",background:inputBg,border:`1px solid ${cardBorder}`,borderRadius:8,padding:2,gap:1,marginLeft:10}}>
                {["compose","history"].map(t=>(
                  <button key={t} onClick={()=>setTab(t)} style={{padding:"3px 11px",borderRadius:6,fontSize:11.5,fontWeight:600,cursor:"pointer",border:"none",background:tab===t?card:"transparent",color:tab===t?text:textMuted,fontFamily:"'Plus Jakarta Sans',sans-serif",boxShadow:tab===t?"0 1px 3px rgba(0,0,0,0.15)":"none"}}>
                    {t==="history"?`History (${history.length})`:t.charAt(0).toUpperCase()+t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="topbar-r">
              <button className="theme-toggle" onClick={toggleTheme}>
                <span>{dark?"🌙":"☀️"}</span><div className="toggle-pill"/><span>{dark?"Dark":"Light"}</span>
              </button>
            </div>
          </div>

          <div className="content">
            {!loading && !whatsapp && (
              <div style={{background:"rgba(251,113,133,0.08)",border:"1px solid rgba(251,113,133,0.25)",borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                <span style={{fontSize:18}}>⚠️</span>
                <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:"#fb7185"}}>WhatsApp not connected</div><div style={{fontSize:12,color:textMuted}}>Connect in Settings first</div></div>
                <button onClick={()=>router.push("/dashboard/settings")} style={{padding:"6px 12px",borderRadius:7,background:"rgba(251,113,133,0.1)",border:"1px solid rgba(251,113,133,0.25)",color:"#fb7185",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Settings →</button>
              </div>
            )}

            {/* HISTORY TAB */}
            {tab==="history" ? (
              <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,overflow:"hidden"}}>
                <div style={{padding:"12px 16px",borderBottom:`1px solid ${border}`,fontWeight:700,fontSize:13,color:text}}>Campaign History</div>
                {history.length===0 ? (
                  <div style={{textAlign:"center",padding:"40px",color:textFaint}}>
                    <div style={{fontSize:28,marginBottom:8}}>📢</div>
                    <div style={{fontWeight:600}}>No campaigns sent yet</div>
                  </div>
                ) : history.map(c=>(
                  <div key={c.id} style={{padding:"13px 16px",borderBottom:`1px solid ${border}`,display:"flex",alignItems:"center",gap:14}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:13,color:text,marginBottom:2}}>{c.name}</div>
                      <div style={{fontSize:11.5,color:textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.message?.substring(0,70)}...</div>
                      <div style={{fontSize:11,color:textFaint,marginTop:2}}>{c.sent_at?new Date(c.sent_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):""} · Segment: {c.segment}</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontWeight:700,fontSize:13,color:accent}}>{c.sent_count} sent</div>
                      {(c.failed_count||0)>0 && <div style={{fontSize:11,color:"#fb7185"}}>{c.failed_count} failed</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : step==="done" ? (
              /* DONE */
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:16}}>
                <div style={{fontSize:52}}>🎉</div>
                <div style={{fontWeight:800,fontSize:22,color:text}}>Campaign Sent!</div>
                <div style={{display:"flex",gap:24}}>
                  <div style={{textAlign:"center"}}><div style={{fontSize:36,fontWeight:800,color:accent}}>{sent}</div><div style={{fontSize:12,color:textMuted}}>Delivered</div></div>
                  {failed>0&&<div style={{textAlign:"center"}}><div style={{fontSize:36,fontWeight:800,color:"#fb7185"}}>{failed}</div><div style={{fontSize:12,color:textMuted}}>Failed</div></div>}
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>{setStep("compose");setSent(0);setFailed(0);setCampaignName("");}} style={{padding:"10px 24px",borderRadius:9,background:accent,border:"none",color:"#000",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>New Campaign</button>
                  <button onClick={()=>setTab("history")} style={{padding:"10px 24px",borderRadius:9,background:inputBg,border:`1px solid ${cardBorder}`,color:textMuted,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>View History</button>
                </div>
              </div>
            ) : step==="sending" ? (
              /* SENDING */
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:14}}>
                <div style={{fontSize:40}}>📤</div>
                <div style={{fontWeight:800,fontSize:18,color:text}}>Sending Campaign...</div>
                <div style={{fontSize:12,color:textMuted}}>Keep this tab open · 1 message/sec (WhatsApp policy)</div>
                <div style={{display:"flex",gap:24}}>
                  <div style={{textAlign:"center"}}><div style={{fontSize:32,fontWeight:800,color:accent}}>{sent}</div><div style={{fontSize:11,color:textMuted}}>Sent</div></div>
                  <div style={{textAlign:"center"}}><div style={{fontSize:32,fontWeight:800,color:textMuted}}>{Math.max(0,audience.length-sent-failed)}</div><div style={{fontSize:11,color:textMuted}}>Remaining</div></div>
                  {failed>0&&<div style={{textAlign:"center"}}><div style={{fontSize:32,fontWeight:800,color:"#fb7185"}}>{failed}</div><div style={{fontSize:11,color:textMuted}}>Failed</div></div>}
                </div>
                <div style={{width:280,height:6,borderRadius:100,background:inputBg}}>
                  <div style={{height:6,borderRadius:100,background:accent,width:`${audience.length>0?Math.round(((sent+failed)/audience.length)*100):0}%`,transition:"width 0.5s"}}/>
                </div>
              </div>
            ) : (
              /* COMPOSE */
              <div className="campaign-grid">
                {/* Col 1: Templates */}
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:14}}>
                    <div style={{fontWeight:700,fontSize:12.5,color:text,marginBottom:10}}>Templates</div>
                    {TEMPLATES.map(t=>(
                      <button key={t.id} className="tmpl-card"
                        onClick={()=>{setSelectedTemplate(t.id);if(t.text)setMessage(t.text)}}
                        style={{color:selectedTemplate===t.id?accent:text,fontWeight:selectedTemplate===t.id?700:500,fontSize:12.5,border:`1px solid ${selectedTemplate===t.id?accent+"44":cardBorder}`,background:selectedTemplate===t.id?accentDim:"transparent"}}>
                        {t.label}
                      </button>
                    ))}
                    <div style={{marginTop:12,padding:"11px 12px",background:inputBg,borderRadius:9}}>
                      <div style={{fontSize:10,fontWeight:700,color:textFaint,marginBottom:7,letterSpacing:"0.5px"}}>VARIABLES</div>
                      {[["{name}","Customer first name"],["{business}","Your business name"],["{cta}","CTA text + link"]].map(([v,d])=>(
                        <div key={v} style={{marginBottom:6}}>
                          <code style={{fontSize:11,color:accent,fontWeight:700}}>{v}</code>
                          <div style={{fontSize:10.5,color:textFaint}}>{d}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Col 2: Compose + Preview + Test */}
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {/* Compose */}
                  <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:16}}>
                    <div style={{fontWeight:700,fontSize:13,color:text,marginBottom:12}}>Compose Message</div>
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:11.5,color:textMuted,marginBottom:4,fontWeight:600}}>Campaign Name <span style={{color:"#fb7185"}}>*</span></div>
                      <input placeholder="e.g. Diwali Offer 2026" value={campaignName} onChange={e=>setCampaignName(e.target.value)}
                        style={{...inp,border:`1px solid ${!campaignName.trim()?"rgba(251,113,133,0.35)":cardBorder}`}}/>
                    </div>
                    <div style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <div style={{fontSize:11.5,color:textMuted,fontWeight:600}}>Message</div>
                        <div style={{fontSize:11,color:msgLength>WA_LIMIT*0.8?"#f59e0b":textFaint}}>{msgLength}/{WA_LIMIT}</div>
                      </div>
                      <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={6}
                        placeholder="Type your message... Use {name}, {business}, {cta}"
                        style={{...inp,resize:"vertical",lineHeight:1.6,minHeight:130,border:`1px solid ${msgLength>WA_LIMIT?"#fb7185":cardBorder}`}}/>
                      {msgLength>WA_LIMIT && <div style={{fontSize:11,color:"#fb7185",marginTop:3}}>⚠️ Too long — WhatsApp limit is {WA_LIMIT} chars</div>}
                    </div>
                    {/* CTA link */}
                    <div style={{marginBottom:10,padding:"12px 13px",background:inputBg,border:`1px solid ${ctaUrl?accent+"33":cardBorder}`,borderRadius:9}}>
                      <div style={{fontSize:11.5,color:textMuted,fontWeight:600,marginBottom:8}}>🔗 CTA Link <span style={{color:textFaint,fontWeight:400}}>(optional)</span></div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1.6fr",gap:8}}>
                        <input placeholder='e.g. "Book Now"' value={ctaText} onChange={e=>setCtaText(e.target.value)} style={{...inp,padding:"7px 10px",fontSize:12}}/>
                        <input placeholder="https://wa.me/91..." value={ctaUrl} onChange={e=>setCtaUrl(e.target.value)} style={{...inp,padding:"7px 10px",fontSize:12}}/>
                      </div>
                      {ctaUrl && <div style={{fontSize:11,color:accent,marginTop:6}}>✓ CTA will be appended to your message</div>}
                    </div>
                    <div style={{padding:"9px 11px",background:"rgba(245,158,11,0.07)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:8,fontSize:11.5,color:"#f59e0b",lineHeight:1.6}}>
                      ⚠️ <strong>Meta Policy:</strong> Only message customers who contacted you first. Customers replying <strong>STOP</strong> are auto-excluded from all future campaigns.
                    </div>
                  </div>

                  {/* Preview */}
                  <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:16}}>
                    <div style={{fontWeight:700,fontSize:13,color:text,marginBottom:10}}>Preview <span style={{fontSize:11,color:textFaint,fontWeight:400}}>for {previewCustomer.name}</span></div>
                    <div style={{background:dark?"#1a1a2e":"#e5ddd5",borderRadius:10,padding:12}}>
                      <div style={{background:dark?"#2a2a3e":"#fff",borderRadius:"4px 12px 12px 12px",padding:"10px 13px",maxWidth:"85%",display:"inline-block"}}>
                        <div style={{fontSize:12.5,color:dark?"#eee":"#111",lineHeight:1.7,whiteSpace:"pre-wrap"}}>
                          {buildMessage(previewCustomer)||<span style={{color:textFaint,fontStyle:"italic"}}>Type a message above...</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Test send */}
                  <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:16}}>
                    <div style={{fontWeight:700,fontSize:13,color:text,marginBottom:8}}>🧪 Send Test First</div>
                    <div style={{display:"flex",gap:8}}>
                      <input placeholder="Your WhatsApp number" value={testPhone} onChange={e=>setTestPhone(e.target.value)} style={{...inp,flex:1}}/>
                      <button onClick={sendTestMessage} disabled={!testPhone.trim()||!whatsapp||testSending}
                        style={{padding:"9px 14px",borderRadius:8,background:testSent?accent:accentDim,border:`1px solid ${accent}44`,color:testSent?"#000":accent,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",flexShrink:0}}>
                        {testSending?"...":testSent?"Sent ✓":"Send Test"}
                      </button>
                    </div>
                    <div style={{fontSize:11,color:textFaint,marginTop:5}}>Always test before sending to your full audience</div>
                  </div>
                </div>

                {/* Col 3: Audience + Send */}
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:14}}>
                    <div style={{fontWeight:700,fontSize:12.5,color:text,marginBottom:10}}>Audience</div>
                    {SEGMENTS.map(s=>(
                      <div key={s.id} onClick={()=>{setSegment(s.id);if(s.id!=="csv")setCsvNumbers([])}}
                        className="seg-card"
                        style={{border:`1px solid ${segment===s.id?accent+"55":cardBorder}`,background:segment===s.id?accentDim:"transparent"}}>
                        <div style={{fontWeight:600,fontSize:12.5,color:segment===s.id?accent:text}}>{s.label}</div>
                        <div style={{fontSize:10.5,color:textFaint,marginTop:1}}>{s.desc}</div>
                      </div>
                    ))}
                    <div style={{marginTop:8}}>
                      <input ref={fileRef} type="file" accept=".csv,.txt" style={{display:"none"}} onChange={handleCsvUpload}/>
                      <button onClick={()=>fileRef.current?.click()}
                        style={{width:"100%",padding:"8px",borderRadius:8,background:segment==="csv"?accentDim:inputBg,border:`1px solid ${segment==="csv"?accent+"44":cardBorder}`,color:segment==="csv"?accent:textMuted,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                        📎 {csvNumbers.length>0?`${csvNumbers.length} numbers loaded`:"Upload CSV or .txt file"}
                      </button>
                      {csvNumbers.length>0 && (
                        <div style={{fontSize:11,color:textFaint,marginTop:4,textAlign:"center"}}>
                          {csvNumbers.length} numbers · <span style={{color:"#fb7185",cursor:"pointer"}} onClick={()=>{setCsvNumbers([]);setSegment("all")}}>Clear</span>
                        </div>
                      )}
                      <div style={{fontSize:10.5,color:textFaint,marginTop:5,lineHeight:1.5}}>One number per line, or first column of CSV. Country code auto-detected.</div>
                    </div>
                  </div>

                  <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:16}}>
                    <div style={{fontWeight:700,fontSize:13,color:text,marginBottom:8}}>Ready to send</div>
                    <div style={{fontSize:34,fontWeight:800,color:audience.length>0?accent:textFaint,marginBottom:2,letterSpacing:"-1px"}}>{audience.length}</div>
                    <div style={{fontSize:12,color:textMuted,marginBottom:10}}>
                      recipients
                      {optouts.length>0&&<span style={{fontSize:11,color:textFaint}}> · {optouts.length} opted out excluded</span>}
                    </div>

                    {audience.length>0 && (
                      <div style={{marginBottom:12,maxHeight:80,overflowY:"auto"}}>
                        {audience.slice(0,4).map((c,i)=>(
                          <div key={i} style={{fontSize:11,color:textFaint,padding:"2px 0",display:"flex",justifyContent:"space-between"}}>
                            <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"60%"}}>{c.name}</span>
                            <span>···{(c.phone||"").slice(-4)}</span>
                          </div>
                        ))}
                        {audience.length>4&&<div style={{fontSize:11,color:textFaint}}>+{audience.length-4} more</div>}
                      </div>
                    )}

                    {optouts.length>0 && (
                      <div style={{marginBottom:10,padding:"7px 10px",background:"rgba(251,113,133,0.06)",border:"1px solid rgba(251,113,133,0.15)",borderRadius:7,fontSize:11,color:"#fb7185"}}>
                        🚫 {optouts.length} opted out (STOP) — auto excluded
                      </div>
                    )}

                    <button onClick={sendCampaign}
                      disabled={!whatsapp||!audience.length||!message.trim()||!campaignName.trim()||sending||msgLength>WA_LIMIT}
                      style={{width:"100%",padding:"11px",background:(!whatsapp||!audience.length||!message.trim()||!campaignName.trim())?inputBg:accent,border:`1px solid ${(!whatsapp||!audience.length||!message.trim()||!campaignName.trim())?cardBorder:accent}`,borderRadius:9,color:(!whatsapp||!audience.length||!message.trim()||!campaignName.trim())?textMuted:"#000",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",marginBottom:6}}>
                      {!whatsapp?"Connect WhatsApp first":!campaignName.trim()?"Add a campaign name ↑":!audience.length?"No recipients":"🚀 Send Campaign"}
                    </button>
                    {!campaignName.trim()&&message.trim()&&audience.length>0&&(
                      <div style={{fontSize:11,color:"#fb7185",textAlign:"center"}}>Campaign name is required to track history</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav className="bottom-nav">
        {[{id:"overview",icon:"⬡",label:"Home",path:"/dashboard"},{id:"inbox",icon:"◎",label:"Chats",path:"/dashboard/conversations"},{id:"bookings",icon:"◷",label:"Bookings",path:"/dashboard/bookings"},{id:"leads",icon:"◉",label:"Leads",path:"/dashboard/leads"},{id:"contacts",icon:"◑",label:"Customers",path:"/dashboard/contacts"}].map(item=>(
          <button key={item.id} className={`bnav-btn${item.id==="campaigns"?" active":""}`} onClick={()=>router.push(item.path)}>
            <span className="bnav-icon">{item.icon}</span>
            <span className="bnav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
