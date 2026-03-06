"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const NAV_ITEMS = [
  { id:"overview",  label:"Revenue Engine", icon:"⬡", path:"/dashboard" },
  { id:"inbox",     label:"Conversations",  icon:"◎", path:"/dashboard/conversations" },
  { id:"bookings",  label:"Bookings",       icon:"◷", path:"/dashboard/bookings" },
  { id:"campaigns", label:"Campaigns",      icon:"◆", path:"/dashboard/campaigns" },
  { id:"leads",     label:"Lead Recovery",  icon:"◉", path:"/dashboard/leads" },
  { id:"contacts",  label:"Customers",      icon:"◑", path:"/dashboard/contacts" },
  { id:"analytics", label:"Analytics",      icon:"▦", path:"/dashboard/analytics" },
  { id:"settings",  label:"Settings",       icon:"◌", path:"/dashboard/settings" },
]

export default function Dashboard() {
  const router = useRouter()
  const [email,setEmail]     = useState("")
  const [dark,setDark]       = useState(true)
  const [period,setPeriod]   = useState("today")
  const [connected]          = useState(false)
  const health               = 74

  useEffect(()=>{
    const saved = localStorage.getItem("fastrill-theme")
    if(saved) setDark(saved==="dark")
    supabase.auth.getUser().then(({data})=>{
      if(!data.user) router.push("/login")
      else setEmail(data.user.email||"")
    })
  },[])

  const toggle = ()=>{ const n=!dark; setDark(n); localStorage.setItem("fastrill-theme",n?"dark":"light") }
  const logout = async ()=>{ await supabase.auth.signOut(); router.push("/login") }
  const connect = ()=>{
    const id="780799931531576", cfg="1090960043190718", uri="https://fastrill.com/api/meta/callback"
    window.location.href=`https://www.facebook.com/v18.0/dialog/oauth?client_id=${id}&redirect_uri=${encodeURIComponent(uri)}&response_type=code&config_id=${cfg}`
  }

  const accent = dark?"#00c47d":"#00935a"
  const hColor = health>=75?accent:health>=50?"#f59e0b":"#ef4444"
  const hLabel = health>=75?"Excellent":health>=50?"Needs Work":"Critical"
  const init   = email?email[0].toUpperCase():"G"
  const daysLeft = new Date(new Date().getFullYear(),new Date().getMonth()+1,0).getDate()-new Date().getDate()

  const t = dark?{
    pageBg:"#0b0b12",sideBg:"#0f0f18",topBg:"#0f0f18",cardBg:"#14141e",
    border:"rgba(255,255,255,0.07)",cardEdge:"rgba(255,255,255,0.09)",
    text:"#ededf5",muted:"rgba(255,255,255,0.42)",faint:"rgba(255,255,255,0.2)",
    navTxt:"rgba(255,255,255,0.48)",navAct:"rgba(0,196,125,0.13)",
    navEdge:"rgba(0,196,125,0.28)",navActTxt:"#00c47d",
    chipBg:"rgba(255,255,255,0.04)",
  }:{
    pageBg:"#eef0f4",sideBg:"#ffffff",topBg:"#ffffff",cardBg:"#ffffff",
    border:"rgba(0,0,0,0.08)",cardEdge:"rgba(0,0,0,0.09)",
    text:"#111827",muted:"rgba(0,0,0,0.48)",faint:"rgba(0,0,0,0.28)",
    navTxt:"rgba(0,0,0,0.48)",navAct:"rgba(0,148,90,0.09)",
    navEdge:"rgba(0,148,90,0.22)",navActTxt:"#00935a",
    chipBg:"rgba(0,0,0,0.03)",
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html,body{height:100%;overflow:hidden;background:${t.pageBg}!important;color:${t.text}!important;font-family:'DM Sans',sans-serif!important;}
    .shell{display:flex;height:100vh;}
    /* SIDEBAR */
    .sb{width:212px;flex-shrink:0;background:${t.sideBg};border-right:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;}
    .sb-logo{display:block;padding:20px 18px 16px;font-family:'Syne',sans-serif;font-weight:800;font-size:22px;color:${t.text};text-decoration:none;border-bottom:1px solid ${t.border};letter-spacing:-0.5px;flex-shrink:0;}
    .sb-logo span{color:${accent};}
    .sb-section{padding:18px 16px 5px;font-size:9.5px;letter-spacing:1.6px;text-transform:uppercase;color:${t.faint};font-weight:600;}
    .sb-nav{flex:1;overflow-y:auto;padding-bottom:8px;}
    .sb-nav::-webkit-scrollbar{display:none;}
    .sb-item{display:flex;align-items:center;gap:10px;padding:9px 11px;margin:1px 8px;border-radius:9px;border:1px solid transparent;font-size:13px;font-weight:500;color:${t.navTxt};background:none;width:calc(100% - 16px);text-align:left;cursor:pointer;transition:all 0.13s;font-family:'DM Sans',sans-serif;}
    .sb-item:hover{background:${t.chipBg};color:${t.text};}
    .sb-item.on{background:${t.navAct};color:${t.navActTxt};font-weight:600;border-color:${t.navEdge};}
    .sb-icon{font-size:13px;width:18px;text-align:center;flex-shrink:0;}
    .sb-foot{flex-shrink:0;padding:12px;border-top:1px solid ${t.border};}
    .sb-user{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:10px;background:${t.chipBg};border:1px solid ${t.cardEdge};margin-bottom:7px;}
    .sb-av{width:30px;height:30px;border-radius:8px;flex-shrink:0;background:linear-gradient(135deg,${accent},#0ea5e9);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#fff;}
    .sb-em{font-size:11.5px;color:${t.muted};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .sb-logout{width:100%;padding:7px;border-radius:8px;background:transparent;border:1px solid ${t.cardEdge};font-size:12px;color:${t.muted};cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.13s;}
    .sb-logout:hover{border-color:rgba(239,68,68,0.4);color:#ef4444;}
    /* MAIN */
    .main{flex:1;min-width:0;display:flex;flex-direction:column;}
    /* TOPBAR */
    .top{flex-shrink:0;height:54px;background:${t.topBg};border-bottom:1px solid ${t.border};display:flex;align-items:center;justify-content:space-between;padding:0 22px;gap:12px;}
    .top-l{display:flex;align-items:center;gap:14px;}
    .top-title{font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:${t.text};}
    .ptabs{display:flex;gap:2px;padding:3px;background:${t.chipBg};border:1px solid ${t.cardEdge};border-radius:9px;}
    .ptab{padding:4px 13px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;border:none;background:transparent;color:${t.muted};font-family:'DM Sans',sans-serif;transition:all 0.13s;}
    .ptab.on{background:${accent};color:#000;}
    .top-r{display:flex;align-items:center;gap:10px;flex-shrink:0;}
    .theme-btn{display:flex;align-items:center;gap:7px;padding:5px 12px;border-radius:8px;background:${t.chipBg};border:1px solid ${t.cardEdge};font-size:12px;color:${t.muted};cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:500;}
    .pill{width:30px;height:17px;border-radius:100px;background:${dark?accent:"#c9cdd4"};position:relative;flex-shrink:0;transition:background 0.2s;}
    .pill::after{content:'';position:absolute;top:1.5px;width:14px;height:14px;border-radius:50%;background:#fff;transition:left 0.2s;left:${dark?"14px":"1.5px"};}
    .conn{display:flex;align-items:center;gap:6px;padding:5px 13px;border-radius:100px;font-size:11.5px;font-weight:600;white-space:nowrap;}
    .conn.off{background:rgba(239,68,68,0.09);border:1px solid rgba(239,68,68,0.22);color:#ef4444;}
    .conn.on{background:${accent}14;border:1px solid ${accent}30;color:${accent};}
    .conn-dot{width:6px;height:6px;border-radius:50%;background:currentColor;}
    /* BODY */
    .body{flex:1;overflow-y:auto;padding:20px 22px 32px;background:${t.pageBg};}
    .body::-webkit-scrollbar{width:4px;}
    .body::-webkit-scrollbar-thumb{background:${t.border};border-radius:2px;}
    /* BANNER */
    .banner{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 20px;border-radius:13px;background:${dark?`linear-gradient(135deg,${accent}0e,rgba(14,165,233,0.07))`:`linear-gradient(135deg,${accent}0a,rgba(14,165,233,0.05))`};border:1px solid ${accent}28;margin-bottom:18px;}
    .banner-l{display:flex;align-items:center;gap:14px;}
    .banner-ico{width:42px;height:42px;border-radius:11px;background:#25d366;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:21px;box-shadow:0 4px 12px rgba(37,211,102,0.28);}
    .banner-title{font-weight:700;font-size:13.5px;color:${t.text};margin-bottom:3px;}
    .banner-sub{font-size:12px;color:${t.muted};}
    .banner-btn{flex-shrink:0;display:inline-flex;align-items:center;gap:8px;padding:9px 18px;border-radius:10px;border:none;cursor:pointer;background:#1877f2;color:#fff;font-weight:700;font-size:13px;font-family:'DM Sans',sans-serif;box-shadow:0 4px 14px rgba(24,119,242,0.32);transition:transform 0.14s;}
    .banner-btn:hover{transform:translateY(-1px);}
    /* CARDS */
    .card{background:${t.cardBg};border:1px solid ${t.cardEdge};border-radius:13px;padding:18px;}
    .ch{font-weight:700;font-size:13.5px;color:${t.text};margin-bottom:4px;}
    .cs{font-size:11.5px;color:${t.muted};}
    .card-hd{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;}
    /* ROW 1 */
    .row1{display:grid;grid-template-columns:190px 1fr;gap:14px;margin-bottom:14px;align-items:start;}
    .health{background:${t.cardBg};border:1px solid ${t.cardEdge};border-radius:13px;padding:20px 14px;display:flex;flex-direction:column;align-items:center;text-align:center;position:relative;overflow:hidden;}
    .health::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,${hColor}14,transparent 60%);pointer-events:none;}
    .h-lbl{font-size:9.5px;letter-spacing:1.6px;text-transform:uppercase;color:${t.faint};font-weight:600;margin-bottom:13px;}
    .h-ring{width:110px;height:110px;position:relative;margin-bottom:11px;}
    .h-ring svg{transform:rotate(-90deg);}
    .h-inner{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
    .h-num{font-family:'Syne',sans-serif;font-weight:800;font-size:34px;line-height:1;}
    .h-den{font-size:11px;color:${t.faint};}
    .h-status{font-weight:700;font-size:13px;margin-bottom:5px;}
    .h-sub{font-size:11px;color:${t.muted};line-height:1.5;}
    .kpis{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:12px;}
    .kpi{background:${t.cardBg};border:1px solid ${t.cardEdge};border-radius:12px;padding:16px;display:flex;flex-direction:column;transition:border-color 0.14s,transform 0.14s;}
    .kpi:hover{border-color:${t.muted};transform:translateY(-2px);}
    .kpi-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
    .kpi-name{font-size:11.5px;color:${t.muted};font-weight:500;}
    .kpi-dot{width:7px;height:7px;border-radius:50%;}
    .kpi-val{font-family:'Syne',sans-serif;font-weight:700;font-size:28px;line-height:1;margin-bottom:5px;}
    .kpi-sub{font-size:11px;color:${t.faint};}
    /* ROW 2 */
    .row2{margin-bottom:14px;}
    .funnel-wrap{display:flex;align-items:flex-end;gap:5px;height:96px;}
    .f-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;}
    .f-num{font-weight:700;font-size:12.5px;}
    .f-bar{width:100%;border-radius:4px 4px 0 0;}
    .f-lbl{font-size:10px;color:${t.muted};text-align:center;font-weight:500;}
    .f-arr{color:${t.faint};font-size:18px;padding-bottom:26px;}
    /* ROW 3 */
    .row3{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;}
    .ai-badge{display:inline-flex;align-items:center;gap:5px;margin-bottom:12px;background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.2);border-radius:100px;padding:3px 10px;font-size:10px;color:#7c3aed;font-weight:700;}
    .ai-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;}
    .ai-m{background:${t.chipBg};border:1px solid ${t.cardEdge};border-radius:10px;padding:12px;}
    .ai-v{font-family:'Syne',sans-serif;font-weight:700;font-size:22px;color:${t.text};margin-bottom:3px;}
    .ai-l{font-size:11px;color:${t.muted};line-height:1.4;}
    .lost{background:${t.cardBg};border:1px solid rgba(239,68,68,0.18);border-radius:13px;padding:18px;}
    .lost-hd{font-weight:700;font-size:13.5px;color:${t.text};display:flex;align-items:center;gap:7px;margin-bottom:4px;}
    .lost-sub{font-size:11.5px;color:${t.muted};margin-bottom:14px;}
    .lost-big{font-family:'Syne',sans-serif;font-weight:800;font-size:38px;color:#ef4444;letter-spacing:-1px;margin-bottom:4px;}
    .lost-desc{font-size:12px;color:${t.faint};margin-bottom:14px;}
    .lost-row{display:flex;align-items:center;justify-content:space-between;padding:7px 11px;border-radius:8px;background:${t.chipBg};border:1px solid ${t.cardEdge};margin-bottom:7px;}
    .lost-row:last-child{margin-bottom:0;}
    .lost-rl{font-size:12px;color:${t.muted};}
    .lost-rv{font-size:12px;font-weight:700;color:#ef4444;}
    /* ROW 4 */
    .row4{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;}
    .src-row{display:flex;align-items:center;gap:9px;padding:9px 0;border-bottom:1px solid ${t.border};}
    .src-row:last-child{border-bottom:none;}
    .src-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
    .src-name{font-size:12.5px;color:${t.text};flex:1;font-weight:500;}
    .src-ct{font-size:11px;color:${t.faint};margin-right:7px;}
    .src-rev{font-weight:700;font-size:12.5px;color:${accent};}
    .bk-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 0;text-align:center;gap:8px;}
    .bk-icon{font-size:28px;opacity:0.2;}
    .bk-txt{font-size:12px;color:${t.faint};line-height:1.5;}
    .forecast{background:${t.cardBg};border:1px solid ${accent}22;border-radius:13px;padding:18px;}
    .fc-lbl{font-size:9.5px;letter-spacing:1.6px;text-transform:uppercase;color:${t.faint};font-weight:600;margin-bottom:5px;}
    .fc-amt{font-family:'Syne',sans-serif;font-weight:800;font-size:32px;color:${accent};letter-spacing:-1px;margin-bottom:4px;}
    .fc-sub{font-size:12px;color:${t.muted};margin-bottom:14px;}
    .fc-bar{height:5px;background:${t.chipBg};border-radius:100px;margin-bottom:5px;overflow:hidden;}
    .fc-fill{height:100%;border-radius:100px;background:linear-gradient(90deg,${accent},#0ea5e9);width:0%;}
    .fc-pct{font-size:11px;color:${t.faint};margin-bottom:14px;}
    .fc-rows{display:flex;flex-direction:column;gap:9px;}
    .fc-row{display:flex;justify-content:space-between;align-items:center;}
    .fc-rl{font-size:12px;color:${t.muted};}
    .fc-rv{font-size:12.5px;font-weight:600;color:${t.text};}
    @media(max-width:1100px){.row1{grid-template-columns:1fr;}.kpis{grid-template-columns:repeat(4,1fr);grid-template-rows:unset;}.row4{grid-template-columns:1fr 1fr;}}
    @media(max-width:820px){.sb{display:none;}.row3{grid-template-columns:1fr;}.row4{grid-template-columns:1fr;}.kpis{grid-template-columns:1fr 1fr;}}
  `

  return (
    <>
      <style>{css}</style>
      <div className="shell">
        <aside className="sb">
          <a href="/dashboard" className="sb-logo">fast<span>rill</span></a>
          <div className="sb-section">Platform</div>
          <nav className="sb-nav">
            {NAV_ITEMS.map(n=>(
              <button key={n.id} className={`sb-item${n.id==="overview"?" on":""}`} onClick={()=>router.push(n.path)}>
                <span className="sb-icon">{n.icon}</span><span>{n.label}</span>
              </button>
            ))}
          </nav>
          <div className="sb-foot">
            <div className="sb-user"><div className="sb-av">{init}</div><div className="sb-em">{email||"Loading..."}</div></div>
            <button className="sb-logout" onClick={logout}>↩ Sign out</button>
          </div>
        </aside>

        <div className="main">
          <div className="top">
            <div className="top-l">
              <span className="top-title">Revenue Engine</span>
              <div className="ptabs">
                {["today","week","month"].map(p=>(
                  <button key={p} className={`ptab${period===p?" on":""}`} onClick={()=>setPeriod(p)}>
                    {p.charAt(0).toUpperCase()+p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="top-r">
              <button className="theme-btn" onClick={toggle}>
                <span>{dark?"🌙":"☀️"}</span><div className="pill"/><span>{dark?"Dark":"Light"}</span>
              </button>
              <div className={`conn ${connected?"on":"off"}`}>
                <span className="conn-dot"/>{connected?"WhatsApp Live":"Not Connected"}
              </div>
            </div>
          </div>

          <div className="body">
            {!connected&&(
              <div className="banner">
                <div className="banner-l">
                  <div className="banner-ico">💬</div>
                  <div>
                    <div className="banner-title">Connect WhatsApp to start generating revenue</div>
                    <div className="banner-sub">Link your business number to activate AI-powered lead conversion</div>
                  </div>
                </div>
                <button className="banner-btn" onClick={connect}>Connect via Facebook →</button>
              </div>
            )}

            {/* ROW 1 — Health Score + KPI Cards */}
            <div className="row1">
              <div className="health">
                <div className="h-lbl">Business Health Score</div>
                <div className="h-ring">
                  <svg width="110" height="110" viewBox="0 0 110 110">
                    <circle cx="55" cy="55" r="44" fill="none" stroke={dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)"} strokeWidth="7"/>
                    <circle cx="55" cy="55" r="44" fill="none" stroke={hColor} strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={`${2*Math.PI*44}`}
                      strokeDashoffset={`${2*Math.PI*44*(1-health/100)}`}
                      style={{transition:"stroke-dashoffset 1.2s ease"}}
                    />
                  </svg>
                  <div className="h-inner">
                    <div className="h-num" style={{color:hColor}}>{health}</div>
                    <div className="h-den">/100</div>
                  </div>
                </div>
                <div className="h-status" style={{color:hColor}}>{hLabel}</div>
                <div className="h-sub">WhatsApp converting leads<br/>above average</div>
              </div>

              <div className="kpis">
                {[
                  {name:"Revenue Generated",   val:"₹0", color:accent},
                  {name:"Leads Captured",       val:"0",  color:"#0ea5e9"},
                  {name:"Appointments Booked",  val:"0",  color:"#7c3aed"},
                  {name:"Missed Leads",         val:"0",  color:"#ef4444"},
                ].map(k=>(
                  <div key={k.name} className="kpi">
                    <div className="kpi-top">
                      <div className="kpi-name">{k.name}</div>
                      <div className="kpi-dot" style={{background:k.color+"55"}}/>
                    </div>
                    <div className="kpi-val" style={{color:k.color}}>{k.val}</div>
                    <div className="kpi-sub">Connect to track</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ROW 2 — Funnel */}
            <div className="row2 card">
              <div className="card-hd">
                <div><div className="ch">Conversion Funnel</div><div className="cs">Where are leads dropping off?</div></div>
              </div>
              <div className="funnel-wrap">
                {[
                  {label:"Leads In",      val:0,    pct:100, color:accent},
                  {label:"Conversations", val:0,    pct:72,  color:"#00b4d8"},
                  {label:"Bookings",      val:0,    pct:41,  color:"#7c3aed"},
                  {label:"Completed",     val:0,    pct:28,  color:"#f59e0b"},
                  {label:"Revenue",       val:"₹0", pct:18,  color:"#ef4444"},
                ].map((s,i,arr)=>(
                  <>{
                    <div key={s.label} className="f-col">
                      <div className="f-num" style={{color:s.color}}>{s.val}</div>
                      <div className="f-bar" style={{height:`${s.pct*0.66}px`,background:s.color+"22",border:`1px solid ${s.color}38`}}/>
                      <div className="f-lbl">{s.label}</div>
                    </div>
                  }{i<arr.length-1&&<div className="f-arr" key={`a${i}`}>›</div>}</>
                ))}
              </div>
            </div>

            {/* ROW 3 — AI Performance + Lost Revenue */}
            <div className="row3">
              <div className="card">
                <div className="ai-badge">◈ AI PERFORMANCE</div>
                <div className="card-hd" style={{marginBottom:12}}>
                  <div><div className="ch">What your AI achieved</div><div className="cs">Powered by Claude</div></div>
                </div>
                <div className="ai-grid">
                  {[
                    {l:"AI Conversations",v:"0",  s:"handled today"},
                    {l:"Avg Response",    v:"—",  s:"seconds"},
                    {l:"AI Bookings",     v:"0",  s:"generated"},
                    {l:"AI Revenue",      v:"₹0", s:"attributed"},
                  ].map(m=>(
                    <div key={m.l} className="ai-m">
                      <div className="ai-v">{m.v}</div>
                      <div className="ai-l">{m.l}<br/>{m.s}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lost">
                <div className="lost-hd"><span>🔥</span> Lost Revenue Tracker</div>
                <div className="lost-sub">Revenue lost from unanswered or abandoned leads</div>
                <div className="lost-big">₹0</div>
                <div className="lost-desc">potential revenue lost this {period}</div>
                {[
                  {l:"Unanswered leads",        v:"₹0"},
                  {l:"Abandoned conversations", v:"₹0"},
                  {l:"No follow-up sent",        v:"₹0"},
                ].map(r=>(
                  <div key={r.l} className="lost-row">
                    <span className="lost-rl">{r.l}</span><span className="lost-rv">{r.v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ROW 4 — Sources + Bookings + Forecast */}
            <div className="row4">
              <div className="card">
                <div className="card-hd"><div><div className="ch">Lead Sources</div><div className="cs">Revenue by channel</div></div></div>
                {[
                  {name:"Meta Ads",        color:"#1877f2"},
                  {name:"Google Ads",      color:"#ea4335"},
                  {name:"Organic WhatsApp",color:"#25d366"},
                  {name:"Instagram",       color:"#e1306c"},
                ].map(s=>(
                  <div key={s.name} className="src-row">
                    <div className="src-dot" style={{background:s.color}}/>
                    <div className="src-name">{s.name}</div>
                    <div className="src-ct">0 leads</div>
                    <div className="src-rev">₹0</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="card-hd"><div><div className="ch">Today's Bookings</div><div className="cs">Upcoming appointments</div></div></div>
                <div className="bk-empty">
                  <div className="bk-icon">📅</div>
                  <div className="bk-txt">No bookings yet today<br/>Connect WhatsApp to start</div>
                </div>
              </div>
              <div className="forecast">
                <div className="fc-lbl">Monthly Forecast</div>
                <div className="fc-amt">₹0</div>
                <div className="fc-sub">Predicted from current trends</div>
                <div className="fc-bar"><div className="fc-fill"/></div>
                <div className="fc-pct">0% of monthly target reached</div>
                <div className="fc-rows">
                  {[
                    {l:"Avg booking value",v:"—"},
                    {l:"Conversion rate",  v:"—"},
                    {l:"Leads needed",     v:"—"},
                    {l:"Days remaining",   v:daysLeft},
                  ].map(r=>(
                    <div key={r.l} className="fc-row">
                      <span className="fc-rl">{r.l}</span><span className="fc-rv">{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
