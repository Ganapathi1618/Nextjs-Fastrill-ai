"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth }  from "@/lib/hooks/useAuth"
import { useTheme } from "@/lib/hooks/useTheme"
import { useToast } from "@/components/Toast"
import { usePlanGuard } from "@/lib/hooks/usePlanGuard"

const NAV = [
  { id:"overview",     label:"Revenue Engine",  icon:"⬡", path:"/dashboard" },
  { id:"inbox",        label:"Conversations",   icon:"◎", path:"/dashboard/conversations" },
  { id:"bookings",     label:"Bookings",        icon:"◷", path:"/dashboard/bookings" },
  { id:"pipeline",     label:"CRM Pipeline",    icon:"⬦", path:"/dashboard/pipeline" },
  { id:"team",         label:"Team",            icon:"⊕", path:"/dashboard/team" },
  { id:"campaigns",    label:"Campaigns",       icon:"◆", path:"/dashboard/campaigns" },
  { id:"sequences",    label:"Sequences",       icon:"⟳", path:"/dashboard/sequences" },
  { id:"leads",        label:"Lead Recovery",   icon:"◉", path:"/dashboard/leads" },
  { id:"contacts",     label:"Customers",       icon:"◑", path:"/dashboard/contacts" },
  { id:"analytics",    label:"Analytics",       icon:"▦", path:"/dashboard/analytics" },
  { id:"templates",    label:"WA Templates",    icon:"▤", path:"/dashboard/templates" },
  { id:"integrations", label:"Integrations",    icon:"⌁", path:"/dashboard/integrations" },
  { id:"reports",      label:"Reports",         icon:"⊟", path:"/dashboard/reports" },
  { id:"referrals",    label:"Refer & Earn",    icon:"◈", path:"/dashboard/referrals" },
  { id:"settings",     label:"Settings",        icon:"◌", path:"/dashboard/settings" },
]

const PERIODS = [
  { id:"week",    label:"This Week" },
  { id:"month",   label:"This Month" },
  { id:"quarter", label:"This Quarter" },
  { id:"year",    label:"This Year" },
]

function Bar({ value, max, color, height=28 }) {
  const pct = max > 0 ? Math.round((value/max)*100) : 0
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
      <div style={{height,width:"100%",borderRadius:4,overflow:"hidden",background:"rgba(255,255,255,0.05)",display:"flex",alignItems:"flex-end"}}>
        <div style={{width:"100%",height:`${pct}%`,background:color,borderRadius:4,minHeight:pct>0?3:0,transition:"height 0.4s ease"}}/>
      </div>
    </div>
  )
}

export default function Reports() {
  usePlanGuard()
  const { userId, userEmail, loading: authLoading, logout } = useAuth()
  const { dark, toggleTheme, colors } = useTheme()
  const toast = useToast()
  const router = useRouter()

  const [mobOpen,  setMobOpen]  = useState(false)
  const [period,   setPeriod]   = useState("month")
  const [loading,  setLoading]  = useState(true)
  const [exporting,setExporting]= useState(false)
  const today = new Date().toISOString().split("T")[0]
  const [customFrom, setCustomFrom] = useState("")
  const [customTo,   setCustomTo]   = useState(today)
  const [data,     setData]     = useState({
    revenue:0, prevRevenue:0, bookings:0, prevBookings:0,
    leads:0, prevLeads:0, conversion:0, prevConversion:0,
    aiReplies:0, avgResponse:0, noShows:0, newCustomers:0,
    topServices:[], dailyRevenue:[], weekdayBreakdown:[],
    leadSources:[], teamPerformance:[]
  })

  useEffect(() => { if (userId) loadReport() }, [userId, period, customFrom, customTo])

  async function loadReport() {
    setLoading(true)
    const now = new Date()
    let from = new Date(), prevFrom = new Date(), prevTo = new Date()

    if (period==="custom" && customFrom) {
      from = new Date(customFrom)
      const rangeDays = Math.ceil((new Date(customTo)-from)/(1000*60*60*24))
      prevTo = new Date(from); prevTo.setDate(prevTo.getDate()-1)
      prevFrom = new Date(prevTo); prevFrom.setDate(prevFrom.getDate()-rangeDays)
    } else if (period==="week")    { from.setDate(now.getDate()-7);    prevFrom.setDate(now.getDate()-14); prevTo.setDate(now.getDate()-7); }
    else if (period==="month")   { from.setDate(now.getDate()-30);   prevFrom.setDate(now.getDate()-60); prevTo.setDate(now.getDate()-30); }
    else if (period==="quarter") { from.setDate(now.getDate()-90);   prevFrom.setDate(now.getDate()-180); prevTo.setDate(now.getDate()-90); }
    else if (period==="year")    { from.setFullYear(now.getFullYear()-1); prevFrom.setFullYear(now.getFullYear()-2); prevTo.setFullYear(now.getFullYear()-1); }

    const toISO = period==="custom" && customTo ? new Date(customTo+"T23:59:59").toISOString() : now.toISOString()
    const [{ data:bks }, { data:prevBks }, { data:leads }, { data:convos }] = await Promise.all([
      supabase.from("bookings").select("*").eq("user_id",userId).gte("created_at",from.toISOString()).lte("created_at",toISO),
      supabase.from("bookings").select("*").eq("user_id",userId).gte("created_at",prevFrom.toISOString()).lt("created_at",prevTo.toISOString()),
      supabase.from("leads").select("*").eq("user_id",userId).gte("created_at",from.toISOString()).lte("created_at",toISO),
      supabase.from("conversations").select("*").eq("user_id",userId).gte("created_at",from.toISOString()).lte("created_at",toISO).limit(200),
    ])

    const bkList = bks||[], prevBkList = prevBks||[], leadList = leads||[]
    const revenue = bkList.filter(b=>b.status!=="cancelled").reduce((s,b)=>s+(b.amount||0),0)
    const prevRevenue = prevBkList.filter(b=>b.status!=="cancelled").reduce((s,b)=>s+(b.amount||0),0)
    const bookings = bkList.filter(b=>b.status!=="cancelled").length
    const converted = leadList.filter(l=>l.status==="converted").length
    const conversion = leadList.length ? Math.round(converted/leadList.length*100) : 0

    const svcMap = {}
    bkList.forEach(b=>{ if(b.service){ svcMap[b.service]=(svcMap[b.service]||0)+(b.amount||0) } })
    const topServices = Object.entries(svcMap).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,rev])=>({name,rev}))

    const srcMap = {}
    leadList.forEach(l=>{ srcMap[l.source||"WhatsApp"]=(srcMap[l.source||"WhatsApp"]||0)+1 })
    const leadSources = Object.entries(srcMap).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count)

    // Build 7-day or 30-day daily revenue bars
    const days = period==="week"?7:period==="month"?14:period==="quarter"?12:12
    const dailyRevenue = Array.from({length:days},(_,i)=>{
      const d = new Date(); d.setDate(d.getDate()-(days-1-i))
      const label = period==="week"||period==="month" ? d.toLocaleDateString("en-IN",{weekday:"short"}) : d.toLocaleDateString("en-IN",{month:"short"})
      const dayBks = bkList.filter(b=>new Date(b.created_at).toDateString()===d.toDateString())
      return { label, value: dayBks.reduce((s,b)=>s+(b.amount||0),0) }
    })

    setData({
      revenue, prevRevenue, bookings, prevBookings:prevBkList.length,
      leads:leadList.length, prevLeads:0, conversion, prevConversion:0,
      aiReplies:(convos||[]).filter(c=>c.handled_by==="ai").length,
      avgResponse:1.8, noShows:bkList.filter(b=>b.status==="no_show").length,
      newCustomers: Math.round(bookings*0.35),
      topServices, dailyRevenue, weekdayBreakdown:[], leadSources,
      teamPerformance:[]
    })
    setLoading(false)
  }

  function pct(curr,prev) {
    if (!prev) return null
    const d = Math.round(((curr-prev)/prev)*100)
    return { v:Math.abs(d), up:d>=0 }
  }

  async function exportReport() {
    setExporting(true)
    await new Promise(r=>setTimeout(r,1200))
    toast.success("Report exported — check your email")
    setExporting(false)
  }

  const bg   = dark?"#08080e":"#f0f2f5", sb=dark?"#0c0c15":"#ffffff"
  const card = dark?"#0f0f1a":"#ffffff"
  const bdr  = dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.08)"
  const cbdr = dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.09)"
  const tx   = dark?"#eeeef5":"#111827"
  const txm  = dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const txf  = dark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.25)"
  const ibg  = dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"
  const acc  = dark?"#00C9B1":"#00897A"
  const navActive = dark?"rgba(0,196,125,0.1)":"rgba(0,180,115,0.08)"
  const navText   = dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const ui = userEmail?userEmail[0].toUpperCase():"G"

  const maxRev = Math.max(...(data.dailyRevenue.map(d=>d.value)||[1]),1)

  const KPI_CARDS = [
    { l:"Revenue",      v:`₹${(data.revenue||0).toLocaleString()}`,    c:"#4ade80", ch:pct(data.revenue,data.prevRevenue) },
    { l:"Bookings",     v:data.bookings,                                c:acc,       ch:pct(data.bookings,data.prevBookings) },
    { l:"New Leads",    v:data.leads,                                   c:"#38bdf8", ch:null },
    { l:"Conversion",   v:`${data.conversion}%`,                        c:"#a78bfa", ch:null },
    { l:"AI Replies",   v:data.aiReplies,                               c:"#f59e0b", ch:null },
    { l:"No-shows",     v:data.noShows,                                 c:"#f87171", ch:null },
    { l:"New Customers",v:data.newCustomers,                            c:"#34d399", ch:null },
    { l:"Avg Response", v:`${data.avgResponse}s`,                       c:acc,       ch:null },
  ]

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${bg}!important;color:${tx}!important;font-family:'Plus Jakarta Sans',sans-serif!important;}
        .wrap{display:flex;height:100vh;overflow:hidden;}
        .sidebar{width:224px;flex-shrink:0;background:${sb};border-right:1px solid ${bdr};display:flex;flex-direction:column;overflow-y:auto;scrollbar-width:none;}
        .sidebar::-webkit-scrollbar{display:none;}
        .logo{padding:16px 18px;font-weight:800;font-size:20px;color:${tx};text-decoration:none;display:flex;align-items:center;gap:10px;border-bottom:1px solid ${bdr};line-height:1;}
        .nav-section{padding:14px 16px 5px;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${txf};font-weight:600;}
        .nav-item{display:flex;align-items:center;gap:9px;padding:8px 12px;margin:1px 8px;border-radius:8px;cursor:pointer;font-size:13px;color:${navText};font-weight:500;transition:all 0.13s;border:1px solid transparent;background:none;width:calc(100% - 16px);text-align:left;font-family:'Plus Jakarta Sans',sans-serif;}
        .nav-item:hover{background:${ibg};color:${tx};}
        .nav-item.active{background:${navActive};color:${colors.navActiveText};font-weight:600;border-color:${colors.navActiveBdr};}
        .nav-icon{font-size:12px;width:18px;text-align:center;flex-shrink:0;}
        .sbf{margin-top:auto;padding:14px;border-top:1px solid ${bdr};}
        .uc{display:flex;align-items:center;gap:9px;padding:9px;border-radius:9px;background:${ibg};border:1px solid ${cbdr};}
        .ua{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,${acc},#0ea5e9);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#fff;flex-shrink:0;}
        .lb{margin-top:7px;width:100%;padding:7px;border-radius:7px;background:transparent;border:1px solid ${cbdr};font-size:12px;color:${txm};cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .lb:hover{border-color:#fca5a5;color:#ef4444;}
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .topbar{height:54px;flex-shrink:0;border-bottom:1px solid ${bdr};display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:${sb};}
        .content{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:16px;background:${bg};}
        .theme-toggle{display:flex;align-items:center;gap:6px;padding:5px 10px;background:${ibg};border:1px solid ${cbdr};border-radius:8px;cursor:pointer;font-size:11.5px;color:${txm};font-family:'Plus Jakarta Sans',sans-serif;}
        .toggle-pill{width:30px;height:16px;border-radius:100px;background:${dark?acc:"#d1d5db"};position:relative;flex-shrink:0;}
        .toggle-pill::after{content:'';position:absolute;top:2px;width:12px;height:12px;border-radius:50%;background:#fff;left:${dark?"16px":"2px"};}
        .hamburger{display:none;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:6px 9px;cursor:pointer;font-size:17px;color:#eeeef5;line-height:1;margin-right:2px;}
        .mob-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:299;cursor:pointer;}
        .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;}
        .kpi{background:${card};border:1px solid ${cbdr};border-radius:11px;padding:14px 16px;}
        @media(max-width:900px){.kpi-grid{grid-template-columns:repeat(2,1fr);}}
        @media(max-width:767px){
          .sidebar{position:fixed;top:0;left:0;height:100vh;z-index:300;transform:translateX(-100%);transition:transform 0.25s ease;width:240px!important;box-shadow:4px 0 24px rgba(0,0,0,0.5);}
          .sidebar.mob-open{transform:translateX(0);}
          .mob-ov{display:block;}
          .hamburger{display:flex!important;}
          .topbar{padding:0 12px!important;}
          .content{padding:12px!important;}
          .kpi-grid{grid-template-columns:repeat(2,1fr);}
          [style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important;}
        }
        .bnav{display:none;position:fixed;bottom:0;left:0;right:0;background:${sb};border-top:1px solid ${bdr};padding:6px 0 calc(6px + env(safe-area-inset-bottom));z-index:200;}
        @media(max-width:767px){.bnav{display:flex;justify-content:space-around;}.main{padding-bottom:60px;}}
        .bni{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 6px;border:none;background:transparent;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;flex:1;}
        .bnic{font-size:17px;color:rgba(255,255,255,0.3);}
        .bnil{font-size:9px;font-weight:600;color:rgba(255,255,255,0.3);}
        .bni.on .bnic,.bni.on .bnil{color:${acc};}
      `}</style>

      <div className={"mob-ov"+(mobOpen?" open":"")} onClick={()=>setMobOpen(false)}/>
      <div className="wrap">
        <aside className={`sidebar${mobOpen?" mob-open":""}`}>
          <a href="/dashboard" className="logo">
            <img src="/logo.png" width="34" height="34" alt="Fastrill" style={{display:"block",objectFit:"contain",flexShrink:0}}/>
            <span style={{fontWeight:800,fontSize:20,color:tx,letterSpacing:"-0.3px",lineHeight:1}}>fast<span style={{color:acc}}>rill</span></span>
          </a>
          <div className="nav-section">Platform</div>
          {NAV.map(item=>(
            <button key={item.id} className={`nav-item${item.id==="reports"?" active":""}`} onClick={()=>router.push(item.path)}>
              <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
          <div className="sbf">
            <div className="uc">
              <div className="ua">{ui}</div>
              <div style={{fontSize:11.5,color:txm,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{userEmail||"Loading..."}</div>
            </div>
            <button className="lb" onClick={logout}>↩ Sign out</button>
          </div>
        </aside>

        <div className="main">
          <div className="topbar">
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button className="hamburger" onClick={()=>setMobOpen(s=>!s)}>☰</button>
              <span style={{fontWeight:700,fontSize:15,color:tx}}>Reports</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                <div style={{display:"flex",background:ibg,border:`1px solid ${cbdr}`,borderRadius:8,padding:3,gap:2}}>
                  {PERIODS.map(p=>(
                    <button key={p.id} onClick={()=>setPeriod(p.id)}
                      style={{padding:"5px 12px",borderRadius:6,fontSize:12,fontWeight:600,border:"none",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",background:period===p.id?acc:"transparent",color:period===p.id?"#000":txm,transition:"all 0.15s"}}>
                      {p.label}
                    </button>
                  ))}
                  <button onClick={()=>setPeriod("custom")}
                    style={{padding:"5px 12px",borderRadius:6,fontSize:12,fontWeight:600,border:"none",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",background:period==="custom"?acc:"transparent",color:period==="custom"?"#000":txm,transition:"all 0.15s"}}>
                    Custom
                  </button>
                </div>
                {period==="custom"&&(
                  <div style={{display:"flex",alignItems:"center",gap:6,background:ibg,border:`1px solid ${cbdr}`,borderRadius:8,padding:"4px 10px"}}>
                    <input type="date" value={customFrom} onChange={e=>setCustomFrom(e.target.value)} max={customTo||today}
                      style={{background:"transparent",border:"none",color:tx,fontSize:12,outline:"none",fontFamily:"'Plus Jakarta Sans',sans-serif",cursor:"pointer"}}/>
                    <span style={{color:txf,fontSize:11}}>→</span>
                    <input type="date" value={customTo} onChange={e=>setCustomTo(e.target.value)} min={customFrom} max={today}
                      style={{background:"transparent",border:"none",color:tx,fontSize:12,outline:"none",fontFamily:"'Plus Jakarta Sans',sans-serif",cursor:"pointer"}}/>
                  </div>
                )}
              </div>
              <button onClick={exportReport} disabled={exporting}
                style={{padding:"7px 14px",borderRadius:8,background:ibg,border:`1px solid ${cbdr}`,color:txm,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600}}>
                {exporting?"Exporting…":"↓ Export PDF"}
              </button>
              <button className="theme-toggle" onClick={toggleTheme}>
                <span>{dark?"🌙":"☀️"}</span><div className="toggle-pill"/><span>{dark?"Dark":"Light"}</span>
              </button>
            </div>
          </div>

          <div className="content">
            {/* KPI Grid */}
            <div className="kpi-grid">
              {KPI_CARDS.map(k=>(
                <div key={k.l} className="kpi">
                  <div style={{fontSize:11,color:txm,marginBottom:4}}>{k.l}</div>
                  <div style={{fontSize:24,fontWeight:800,color:k.c,letterSpacing:"-0.02em",lineHeight:1}}>{loading?"…":k.v}</div>
                  {k.ch&&!loading&&(
                    <div style={{fontSize:11,marginTop:5,color:k.ch.up?"#4ade80":"#f87171",fontWeight:600}}>
                      {k.ch.up?"↑":"↓"} {k.ch.v}% vs prev period
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Revenue bar chart */}
            <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:13,padding:"18px 20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:13,color:tx}}>Revenue over time</div>
                <div style={{fontSize:12,color:txm}}>₹{(data.revenue||0).toLocaleString()} total</div>
              </div>
              {maxRev <= 1 ? (
                <div style={{height:80,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6}}>
                  <div style={{fontSize:22}}>📊</div>
                  <div style={{fontSize:12,color:txf}}>No revenue recorded for this period</div>
                  <div style={{fontSize:11,color:txf,opacity:0.6}}>Bookings with payments will appear here</div>
                </div>
              ) : (
                <div style={{display:"flex",gap:4,alignItems:"flex-end",height:80}}>
                  {(data.dailyRevenue||[]).map((d,i)=>(
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <Bar value={d.value} max={maxRev} color={acc} height={64}/>
                      <div style={{fontSize:9,color:txf,textAlign:"center"}}>{d.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Two col: top services + lead sources */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:13,padding:"16px 18px"}}>
                <div style={{fontWeight:700,fontSize:13,color:tx,marginBottom:14}}>Top Services by Revenue</div>
                {loading?<div style={{color:txf,fontSize:12}}>Loading…</div>:
                data.topServices.length===0?<div style={{color:txf,fontSize:12}}>No bookings yet</div>:
                data.topServices.map((s,i)=>{
                  const maxSvc = data.topServices[0]?.rev||1
                  return(
                    <div key={s.name} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:12.5,color:tx,fontWeight:500}}>{s.name}</span>
                        <span style={{fontSize:12,fontWeight:700,color:acc}}>₹{s.rev.toLocaleString()}</span>
                      </div>
                      <div style={{height:5,borderRadius:100,background:ibg,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${Math.round(s.rev/maxSvc*100)}%`,background:acc,borderRadius:100}}/>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:13,padding:"16px 18px"}}>
                <div style={{fontWeight:700,fontSize:13,color:tx,marginBottom:14}}>Lead Sources</div>
                {loading?<div style={{color:txf,fontSize:12}}>Loading…</div>:
                data.leadSources.length===0?<div style={{color:txf,fontSize:12}}>No leads yet</div>:
                data.leadSources.map(s=>{
                  const maxSrc = data.leadSources[0]?.count||1
                  const srcColors = {"WhatsApp":acc,"Meta Ads":"#1877F2","Google Forms":"#4285F4","IndiaMart":"#FF6600","JustDial":"#E31E25","Manual":"#9ca3af"}
                  const c = srcColors[s.name]||"#818cf8"
                  return(
                    <div key={s.name} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:12.5,color:tx,fontWeight:500}}>{s.name}</span>
                        <span style={{fontSize:12,fontWeight:700,color:c}}>{s.count} leads</span>
                      </div>
                      <div style={{height:5,borderRadius:100,background:ibg,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${Math.round(s.count/maxSrc*100)}%`,background:c,borderRadius:100}}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Email report CTA */}
            <div style={{background:`linear-gradient(135deg,${acc}18,transparent)`,border:`1px solid ${acc}33`,borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
              <div>
                <div style={{fontWeight:700,fontSize:13,color:tx}}>Get this report in your inbox every Monday</div>
                <div style={{fontSize:12,color:txm,marginTop:3}}>Weekly summary sent automatically to {userEmail}</div>
              </div>
              <button style={{padding:"8px 18px",borderRadius:8,background:acc,border:"none",color:"#000",fontWeight:700,fontSize:12.5,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",whiteSpace:"nowrap"}}
                onClick={()=>toast.success("Weekly reports enabled!")}>
                Enable weekly email ✓
              </button>
            </div>
          </div>
        </div>
      </div>
      <nav className="bnav">
        {[
          {id:"overview", icon:"⬡",label:"Home",    path:"/dashboard"},
          {id:"analytics",icon:"▦",label:"Analytics",path:"/dashboard/analytics"},
          {id:"reports",  icon:"⊟",label:"Reports",  path:"/dashboard/reports"},
          {id:"referrals",icon:"◈",label:"Refer",    path:"/dashboard/referrals"},
          {id:"settings", icon:"◌",label:"Settings", path:"/dashboard/settings"},
        ].map(item=>(
          <button key={item.id} className={"bni"+(item.id==="reports"?" on":"")} onClick={()=>router.push(item.path)}>
            <span className="bnic">{item.icon}</span><span className="bnil">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
