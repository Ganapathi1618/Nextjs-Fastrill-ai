"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const NAV = [
  { id:"overview", label:"Revenue Engine", icon:"⬡", path:"/dashboard" },
  { id:"inbox", label:"Conversations", icon:"◎", path:"/dashboard/conversations" },
  { id:"bookings", label:"Bookings", icon:"◷", path:"/dashboard/bookings" },
  { id:"campaigns", label:"Campaigns", icon:"◆", path:"/dashboard/campaigns" },
  { id:"leads", label:"Lead Recovery", icon:"◉", path:"/dashboard/leads" },
  { id:"contacts", label:"Customers", icon:"◑", path:"/dashboard/contacts" },
  { id:"analytics", label:"Analytics", icon:"▦", path:"/dashboard/analytics" },
  { id:"settings", label:"Settings", icon:"◌", path:"/dashboard/settings" },
]

export default function Dashboard() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [connected, setConnected] = useState(false)
  const [period, setPeriod] = useState("today")
  const [healthScore] = useState(74)
  const [dark, setDark] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login")
      else setUserEmail(data.user.email || "")
    })
  }, [])

  const toggleTheme = () => {
    const n = !dark; setDark(n)
    localStorage.setItem("fastrill-theme", n ? "dark" : "light")
  }

  const handleLogout = async () => {
    await supabase.auth.signOut(); router.push("/login")
  }

  const handleConnect = () => {
    const appId = "780799931531576"
    const configId = "1090960043190718"
    const redirectUri = "https://fastrill.com/api/meta/callback"
    window.location.href = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&config_id=${configId}`
  }

  const bg = dark ? "#08080e" : "#f0f2f5"
  const sidebar = dark ? "#0c0c15" : "#ffffff"
  const card = dark ? "#0f0f1a" : "#ffffff"
  const border = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"
  const cardBorder = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)"
  const text = dark ? "#eeeef5" : "#111827"
  const textMuted = dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)"
  const textFaint = dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)"
  const inputBg = dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"
  const accent = dark ? "#00d084" : "#00935a"
  const accentDim = dark ? "rgba(0,208,132,0.12)" : "rgba(0,147,90,0.1)"
  const userInitial = userEmail ? userEmail[0].toUpperCase() : "G"

  const hColor = healthScore >= 75 ? accent : healthScore >= 50 ? "#f59e0b" : "#ef4444"
  const hLabel = healthScore >= 75 ? "Excellent" : healthScore >= 50 ? "Needs Work" : "Critical"

  const kpis = [
    { name:"Revenue Generated", val:"₹0", color:accent, icon:"₹" },
    { name:"Leads Captured", val:"0", color:"#38bdf8", icon:"↗" },
    { name:"Appointments Booked", val:"0", color:"#a78bfa", icon:"📅" },
    { name:"Missed Leads", val:"0", color:"#fb7185", icon:"!" },
  ]

  const funnel = [
    { label:"Leads In", val:0, pct:100, color:accent },
    { label:"Chats", val:0, pct:72, color:"#38bdf8" },
    { label:"Booked", val:0, pct:41, color:"#a78bfa" },
    { label:"Done", val:0, pct:28, color:"#f59e0b" },
    { label:"Revenue", val:"₹0", pct:18, color:"#fb7185" },
  ]

  const aiMetrics = [
    { label:"Conversations Handled", val:"0", sub:"by AI today" },
    { label:"Avg Response Time", val:"—", sub:"seconds" },
    { label:"Bookings by AI", val:"0", sub:"appointments" },
    { label:"Revenue Attributed", val:"₹0", sub:"to AI replies" },
  ]

  const sources = [
    { name:"Meta Ads", leads:0, rev:"₹0", color:"#1877f2" },
    { name:"Google Ads", leads:0, rev:"₹0", color:"#ea4335" },
    { name:"Organic WhatsApp", leads:0, rev:"₹0", color:"#25d366" },
    { name:"Instagram", leads:0, rev:"₹0", color:"#e1306c" },
  ]

  const lostRows = [
    { label:"Unanswered leads", val:"₹0" },
    { label:"Abandoned conversations", val:"₹0" },
    { label:"No follow-up sent", val:"₹0" },
  ]

  const forecastItems = [
    { label:"Avg booking value", val:"—" },
    { label:"Conversion rate", val:"—" },
    { label:"Leads needed", val:"—" },
    { label:"Days remaining", val: new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate() - new Date().getDate() },
  ]

  const circ = 2 * Math.PI * 46

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: ${bg} !important; color: ${text} !important; font-family: 'DM Sans', sans-serif !important; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${border}; border-radius: 10px; }

        .wrap { display: flex; height: 100vh; overflow: hidden; background: ${bg}; }

        /* Sidebar */
        .sb { width: 220px; flex-shrink: 0; background: ${sidebar}; border-right: 1px solid ${border}; display: flex; flex-direction: column; overflow-y: auto; transition: transform 0.25s; }
        .sb-logo { padding: 20px 18px 16px; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 19px; color: ${text}; border-bottom: 1px solid ${border}; display: block; text-decoration: none; letter-spacing: -0.5px; }
        .sb-logo span { color: ${accent}; }
        .sb-section { padding: 18px 16px 6px; font-size: 9.5px; letter-spacing: 1.4px; text-transform: uppercase; color: ${textFaint}; font-weight: 600; }
        .sb-nav { padding: 3px 8px; }
        .nav-btn { display: flex; align-items: center; gap: 9px; width: 100%; padding: 8px 10px; border-radius: 8px; border: 1px solid transparent; background: transparent; color: ${textMuted}; font-size: 13.5px; font-weight: 500; cursor: pointer; text-align: left; font-family: 'DM Sans', sans-serif; transition: all 0.12s; margin-bottom: 1px; }
        .nav-btn:hover { background: ${inputBg}; color: ${text}; }
        .nav-btn.active { background: ${accentDim}; border-color: ${accent}33; color: ${accent}; font-weight: 600; }
        .nav-icon { font-size: 12px; width: 16px; text-align: center; flex-shrink: 0; }
        .sb-foot { margin-top: auto; padding: 12px; border-top: 1px solid ${border}; }
        .user-row { display: flex; align-items: center; gap: 8px; padding: 8px 9px; background: ${inputBg}; border: 1px solid ${cardBorder}; border-radius: 9px; margin-bottom: 8px; }
        .user-av { width: 28px; height: 28px; border-radius: 7px; background: linear-gradient(135deg, ${accent}, #38bdf8); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; color: #fff; flex-shrink: 0; }
        .user-em { font-size: 11px; color: ${textMuted}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .logout { width: 100%; padding: 7px; background: transparent; border: 1px solid ${cardBorder}; border-radius: 7px; font-size: 11.5px; color: ${textMuted}; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.12s; }
        .logout:hover { border-color: #fca5a5; color: #ef4444; }

        /* Main */
        .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
        .topbar { height: 52px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 22px; background: ${sidebar}; border-bottom: 1px solid ${border}; gap: 12px; }
        .topbar-l { display: flex; align-items: center; gap: 14px; }
        .tb-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; color: ${text}; }
        .period-wrap { display: flex; background: ${inputBg}; border: 1px solid ${cardBorder}; border-radius: 8px; padding: 2px; gap: 1px; }
        .period-btn { padding: 3px 11px; border-radius: 6px; font-size: 11.5px; font-weight: 600; cursor: pointer; border: none; background: transparent; color: ${textMuted}; font-family: 'DM Sans', sans-serif; transition: all 0.12s; }
        .period-btn.active { background: ${card}; color: ${text}; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
        .topbar-r { display: flex; align-items: center; gap: 8px; }
        .theme-toggle { display: flex; align-items: center; gap: 6px; padding: 5px 10px; background: ${inputBg}; border: 1px solid ${cardBorder}; border-radius: 8px; cursor: pointer; font-size: 11.5px; color: ${textMuted}; font-family: 'DM Sans', sans-serif; white-space: nowrap; }
        .toggle-pill { width: 30px; height: 16px; border-radius: 100px; background: ${dark ? accent : "#d1d5db"}; position: relative; flex-shrink: 0; transition: background 0.2s; }
        .toggle-pill::after { content: ''; position: absolute; top: 2px; width: 12px; height: 12px; border-radius: 50%; background: #fff; transition: left 0.2s; left: ${dark ? "16px" : "2px"}; }
        .badge { display: flex; align-items: center; gap: 5px; padding: 4px 11px; border-radius: 100px; font-size: 11px; font-weight: 600; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #ef4444; white-space: nowrap; }
        .badge.on { background: ${accentDim}; border-color: ${accent}44; color: ${accent}; }
        .badge-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

        /* Content */
        .content { flex: 1; overflow-y: auto; padding: 18px 22px; background: ${bg}; display: flex; flex-direction: column; gap: 14px; }

        /* Banner */
        .banner { background: ${dark ? `linear-gradient(135deg, ${accent}0f, rgba(56,189,248,0.06))` : `linear-gradient(135deg, ${accent}0a, rgba(56,189,248,0.04))`}; border: 1px solid ${accent}28; border-radius: 12px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 14px; }
        .banner-l { display: flex; align-items: center; gap: 12px; }
        .banner-icon { width: 38px; height: 38px; border-radius: 10px; background: #25d366; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .banner-title { font-weight: 700; font-size: 13px; color: ${text}; margin-bottom: 2px; }
        .banner-sub { font-size: 11.5px; color: ${textMuted}; }
        .connect-btn { background: #1877f2; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer; font-family: 'DM Sans', sans-serif; white-space: nowrap; transition: opacity 0.12s; flex-shrink: 0; }
        .connect-btn:hover { opacity: 0.88; }

        /* Top row: health + kpis */
        .top-row { display: grid; grid-template-columns: 210px 1fr; gap: 14px; align-items: stretch; }
        .health-card { background: ${card}; border: 1px solid ${cardBorder}; border-radius: 13px; padding: 20px 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; position: relative; overflow: hidden; }
        .health-card::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 50% 30%, ${accent}0d, transparent 70%); pointer-events: none; }
        .h-label { font-size: 9.5px; letter-spacing: 1.5px; text-transform: uppercase; color: ${textFaint}; font-weight: 600; margin-bottom: 12px; }
        .h-ring { position: relative; width: 110px; height: 110px; margin-bottom: 12px; }
        .h-ring svg { transform: rotate(-90deg); }
        .h-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .h-num { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 34px; line-height: 1; }
        .h-denom { font-size: 11px; color: ${textFaint}; }
        .h-status { font-weight: 700; font-size: 13px; margin-bottom: 3px; }
        .h-sub { font-size: 11px; color: ${textMuted}; line-height: 1.5; }

        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 11px; }
        .kpi { background: ${card}; border: 1px solid ${cardBorder}; border-radius: 11px; padding: 15px 14px; position: relative; overflow: hidden; transition: transform 0.13s, border-color 0.13s; }
        .kpi:hover { transform: translateY(-2px); border-color: ${accent}44; }
        .kpi::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; border-radius: 11px 11px 0 0; }
        .kpi-label { font-size: 11px; color: ${textMuted}; font-weight: 500; margin-bottom: 8px; }
        .kpi-val { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 28px; letter-spacing: -1px; line-height: 1; margin-bottom: 5px; }
        .kpi-hint { font-size: 10.5px; color: ${textFaint}; }
        .kpi-icon { position: absolute; top: 12px; right: 13px; font-size: 13px; opacity: 0.35; }

        /* 2-col row */
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .card { background: ${card}; border: 1px solid ${cardBorder}; border-radius: 13px; padding: 18px; }
        .card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .card-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13.5px; color: ${text}; }
        .card-sub { font-size: 11px; color: ${textMuted}; font-weight: 400; }
        .card-badge { display: inline-flex; align-items: center; gap: 4px; background: rgba(167,139,250,0.12); border: 1px solid rgba(167,139,250,0.2); border-radius: 100px; padding: 2px 9px; font-size: 9.5px; color: #a78bfa; font-weight: 700; letter-spacing: 0.5px; }

        /* Funnel */
        .funnel { display: flex; align-items: flex-end; gap: 6px; height: 105px; }
        .f-step { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .f-bar { width: 100%; border-radius: 4px 4px 0 0; }
        .f-val { font-weight: 700; font-size: 12.5px; }
        .f-label { font-size: 9.5px; color: ${textMuted}; text-align: center; }
        .f-arrow { color: ${textFaint}; font-size: 14px; margin-bottom: 25px; flex-shrink: 0; }

        /* AI metrics grid */
        .ai-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
        .ai-m { background: ${inputBg}; border: 1px solid ${cardBorder}; border-radius: 9px; padding: 12px; }
        .ai-v { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 22px; color: ${text}; line-height: 1; margin-bottom: 3px; }
        .ai-l { font-size: 11px; color: ${textMuted}; line-height: 1.4; }

        /* Lost revenue */
        .lost-card { background: ${card}; border: 1px solid rgba(251,113,133,0.18); border-radius: 13px; padding: 18px; }
        .lost-amt { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 38px; color: #fb7185; letter-spacing: -1.5px; line-height: 1; margin-bottom: 2px; }
        .lost-desc { font-size: 11.5px; color: ${textMuted}; margin-bottom: 13px; }
        .lost-row { display: flex; align-items: center; justify-content: space-between; padding: 7px 10px; background: ${inputBg}; border: 1px solid ${cardBorder}; border-radius: 7px; margin-bottom: 5px; }
        .lost-rl { font-size: 12px; color: ${textMuted}; }
        .lost-rv { font-size: 12px; font-weight: 700; color: #fb7185; }

        /* 3-col row */
        .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }

        /* Sources */
        .src-row { display: flex; align-items: center; gap: 9px; padding: 8px 0; border-bottom: 1px solid ${border}; }
        .src-row:last-child { border-bottom: none; }
        .src-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .src-name { font-size: 12.5px; color: ${text}; flex: 1; font-weight: 500; }
        .src-leads { font-size: 11px; color: ${textMuted}; margin-right: 4px; }
        .src-rev { font-weight: 700; font-size: 12px; color: ${accent}; }

        /* Bookings empty */
        .bk-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 22px 0; text-align: center; gap: 6px; }
        .bk-ei { font-size: 26px; opacity: 0.2; }
        .bk-et { font-size: 11.5px; color: ${textFaint}; line-height: 1.5; }

        /* Forecast */
        .forecast-card { background: ${card}; border: 1px solid ${accent}1e; border-radius: 13px; padding: 18px; }
        .fc-label { font-size: 9.5px; letter-spacing: 1.4px; text-transform: uppercase; color: ${textFaint}; font-weight: 600; margin-bottom: 4px; }
        .fc-amt { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 30px; color: ${accent}; letter-spacing: -1px; line-height: 1; margin-bottom: 2px; }
        .fc-sub { font-size: 11px; color: ${textMuted}; margin-bottom: 12px; }
        .fc-bar { height: 4px; background: ${inputBg}; border-radius: 100px; margin-bottom: 4px; overflow: hidden; }
        .fc-fill { height: 100%; background: linear-gradient(90deg, ${accent}, #38bdf8); border-radius: 100px; width: 0%; }
        .fc-pct { font-size: 10.5px; color: ${textFaint}; margin-bottom: 12px; }
        .fc-item { display: flex; justify-content: space-between; font-size: 11.5px; padding: 5px 0; border-bottom: 1px solid ${border}; }
        .fc-item:last-child { border-bottom: none; }
        .fc-il { color: ${textMuted}; }
        .fc-iv { font-weight: 600; color: ${text}; }

        @media (max-width: 1200px) {
          .kpi-grid { grid-template-columns: repeat(2,1fr); }
          .three-col { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 960px) {
          .top-row { grid-template-columns: 1fr; }
          .two-col, .three-col { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .sb { position: fixed; top: 0; left: 0; height: 100vh; z-index: 100; transform: ${sidebarOpen ? "translateX(0)" : "translateX(-100%)"}; }
          .content { padding: 14px; }
          .topbar { padding: 0 14px; }
        }
      `}</style>

      <div className="wrap">
        <aside className="sb">
          <a href="/dashboard" className="sb-logo">fast<span>rill</span></a>
          <div className="sb-section">Platform</div>
          <div className="sb-nav">
            {NAV.map(item => (
              <button key={item.id} className={`nav-btn${item.id==="overview"?" active":""}`} onClick={() => router.push(item.path)}>
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          <div className="sb-foot">
            <div className="user-row">
              <div className="user-av">{userInitial}</div>
              <div className="user-em">{userEmail || "Loading..."}</div>
            </div>
            <button className="logout" onClick={handleLogout}>↩ Sign out</button>
          </div>
        </aside>

        <div className="main">
          <div className="topbar">
            <div className="topbar-l">
              <span className="tb-title">Revenue Engine</span>
              <div className="period-wrap">
                {["today","week","month"].map(p => (
                  <button key={p} className={`period-btn${period===p?" active":""}`} onClick={() => setPeriod(p)}>
                    {p.charAt(0).toUpperCase()+p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="topbar-r">
              <button className="theme-toggle" onClick={toggleTheme}>
                <span>{dark?"🌙":"☀️"}</span>
                <div className="toggle-pill" />
                <span>{dark?"Dark":"Light"}</span>
              </button>
              <div className={`badge${connected?" on":""}`}>
                <span className="badge-dot" />
                {connected ? "WhatsApp Live" : "Not Connected"}
              </div>
            </div>
          </div>

          <div className="content">
            {!connected && (
              <div className="banner">
                <div className="banner-l">
                  <div className="banner-icon">💬</div>
                  <div>
                    <div className="banner-title">Connect WhatsApp to start generating revenue</div>
                    <div className="banner-sub">Link your business number to activate AI-powered lead conversion</div>
                  </div>
                </div>
                <button className="connect-btn" onClick={handleConnect}>Connect WhatsApp →</button>
              </div>
            )}

            {/* Health Score + KPIs */}
            <div className="top-row">
              <div className="health-card">
                <div className="h-label">Business Health Score</div>
                <div className="h-ring">
                  <svg width="110" height="110" viewBox="0 0 110 110">
                    <circle cx="55" cy="55" r="46" fill="none" stroke={dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.07)"} strokeWidth="7"/>
                    <circle cx="55" cy="55" r="46" fill="none" stroke={hColor} strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={`${circ}`}
                      strokeDashoffset={`${circ*(1-healthScore/100)}`}
                      style={{transition:"stroke-dashoffset 1.2s ease"}}
                    />
                  </svg>
                  <div className="h-center">
                    <div className="h-num" style={{color:hColor}}>{healthScore}</div>
                    <div className="h-denom">/100</div>
                  </div>
                </div>
                <div className="h-status" style={{color:hColor}}>{hLabel}</div>
                <div className="h-sub">WhatsApp converting<br/>leads above average</div>
              </div>

              <div className="kpi-grid">
                {kpis.map(k => (
                  <div key={k.name} className="kpi">
                    <div className="kpi-icon">{k.icon}</div>
                    <div className="kpi-label">{k.name}</div>
                    <div className="kpi-val" style={{color:k.color}}>{k.val}</div>
                    <div className="kpi-hint">Connect to track</div>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:"2px",background:k.color+"55",borderRadius:"11px 11px 0 0"}}/>
                  </div>
                ))}
              </div>
            </div>

            {/* Funnel */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">Conversion Funnel</div>
                <div className="card-sub">Where are leads dropping off?</div>
              </div>
              <div className="funnel">
                {funnel.map((s,i) => (
                  <div key={s.label} style={{display:"contents"}}>
                    <div className="f-step">
                      <div className="f-val" style={{color:s.color}}>{s.val}</div>
                      <div className="f-bar" style={{height:`${s.pct*0.62}px`,background:s.color+"22",border:`1px solid ${s.color}40`}}/>
                      <div className="f-label">{s.label}</div>
                    </div>
                    {i < funnel.length-1 && <div className="f-arrow">›</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* AI Performance + Lost Revenue */}
            <div className="two-col">
              <div className="card">
                <div className="card-head">
                  <div>
                    <div className="card-badge">◈ AI PERFORMANCE</div>
                    <div className="card-title" style={{marginTop:8}}>What your AI achieved</div>
                  </div>
                  <div className="card-sub">Powered by Claude</div>
                </div>
                <div className="ai-grid">
                  {aiMetrics.map(m => (
                    <div key={m.label} className="ai-m">
                      <div className="ai-v">{m.val}</div>
                      <div className="ai-l">{m.label}<br/><span style={{opacity:0.7}}>{m.sub}</span></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lost-card">
                <div className="card-head">
                  <div className="card-title">🔥 Lost Revenue Tracker</div>
                  <div className="card-sub">Unanswered leads</div>
                </div>
                <div className="lost-amt">₹0</div>
                <div className="lost-desc">potential revenue lost this {period}</div>
                {lostRows.map(r => (
                  <div key={r.label} className="lost-row">
                    <span className="lost-rl">{r.label}</span>
                    <span className="lost-rv">{r.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sources + Bookings + Forecast */}
            <div className="three-col">
              <div className="card">
                <div className="card-head">
                  <div className="card-title">Lead Sources</div>
                  <div className="card-sub">Revenue by channel</div>
                </div>
                {sources.map(s => (
                  <div key={s.name} className="src-row">
                    <div className="src-dot" style={{background:s.color}}/>
                    <div className="src-name">{s.name}</div>
                    <div className="src-leads">{s.leads} leads</div>
                    <div className="src-rev">{s.rev}</div>
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="card-head">
                  <div className="card-title">Today's Bookings</div>
                  <div className="card-sub">Upcoming</div>
                </div>
                <div className="bk-empty">
                  <div className="bk-ei">📅</div>
                  <div className="bk-et">No bookings yet today<br/>Connect WhatsApp to start</div>
                </div>
              </div>

              <div className="forecast-card">
                <div className="fc-label">Monthly Forecast</div>
                <div className="fc-amt">₹0</div>
                <div className="fc-sub">Based on current trends</div>
                <div className="fc-bar"><div className="fc-fill"/></div>
                <div className="fc-pct">0% of monthly target reached</div>
                {forecastItems.map(f => (
                  <div key={f.label} className="fc-item">
                    <span className="fc-il">{f.label}</span>
                    <span className="fc-iv">{f.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
