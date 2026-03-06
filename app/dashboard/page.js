"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function Dashboard() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [connected, setConnected] = useState(false)
  const [period, setPeriod] = useState("today")
  const [healthScore] = useState(74)
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push("/login")
      } else {
        setUserEmail(data.user.email || "")
      }
    }
    checkUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleConnect = () => {
    const appId = "780799931531576"
    const configId = "1090960043190718"
    const redirectUri = "https://fastrill.com/api/meta/callback"
    window.location.href =
      `https://www.facebook.com/v18.0/dialog/oauth` +
      `?client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&config_id=${configId}`
  }

  const userInitial = userEmail ? userEmail[0].toUpperCase() : "U"

  const t = darkMode ? {
    bg: "#0a0a0f", sidebar: "#0f0f17", border: "rgba(255,255,255,0.06)",
    card: "#0f0f17", cardBorder: "rgba(255,255,255,0.07)",
    text: "#e8e8f0", textMuted: "rgba(255,255,255,0.4)", textFaint: "rgba(255,255,255,0.2)",
    navActive: "rgba(0,196,125,0.1)", navActiveBorder: "rgba(0,196,125,0.2)",
    navActiveText: "#00c47d", navText: "rgba(255,255,255,0.45)",
    inputBg: "rgba(255,255,255,0.04)", chipBg: "rgba(255,255,255,0.02)",
    chipBorder: "rgba(255,255,255,0.05)", topbar: "#0f0f17",
  } : {
    bg: "#f4f5f7", sidebar: "#ffffff", border: "rgba(0,0,0,0.07)",
    card: "#ffffff", cardBorder: "rgba(0,0,0,0.08)",
    text: "#111827", textMuted: "rgba(0,0,0,0.45)", textFaint: "rgba(0,0,0,0.25)",
    navActive: "rgba(0,180,115,0.08)", navActiveBorder: "rgba(0,180,115,0.2)",
    navActiveText: "#00935a", navText: "rgba(0,0,0,0.45)",
    inputBg: "rgba(0,0,0,0.03)", chipBg: "rgba(0,0,0,0.02)",
    chipBorder: "rgba(0,0,0,0.05)", topbar: "#ffffff",
  }

  const accent = darkMode ? "#00c47d" : "#00935a"

  const navItems = [
    { id: "overview", label: "Revenue Engine", icon: "◈" },
    { id: "inbox", label: "Conversations", icon: "◎" },
    { id: "bookings", label: "Bookings", icon: "◷" },
    { id: "campaigns", label: "Campaigns", icon: "◆" },
    { id: "leads", label: "Lead Recovery", icon: "◉" },
    { id: "contacts", label: "Customers", icon: "◑" },
    { id: "analytics", label: "Analytics", icon: "◫" },
    { id: "settings", label: "Settings", icon: "◌" },
  ]

  const funnelSteps = [
    { label: "Leads In", value: 0, pct: 100, color: accent },
    { label: "Conversations", value: 0, pct: 72, color: "#00b4d8" },
    { label: "Bookings", value: 0, pct: 41, color: "#7c3aed" },
    { label: "Completed", value: 0, pct: 28, color: "#f59e0b" },
    { label: "Revenue", value: "₹0", pct: 18, color: "#ef4444" },
  ]

  const aiMetrics = [
    { label: "AI Conversations", value: "0", sub: "handled today" },
    { label: "Avg Response", value: "—", sub: "seconds" },
    { label: "AI Bookings", value: "0", sub: "generated" },
    { label: "AI Revenue", value: "₹0", sub: "attributed" },
  ]

  const sources = [
    { name: "Meta Ads", leads: 0, revenue: "₹0", color: "#1877f2" },
    { name: "Google Ads", leads: 0, revenue: "₹0", color: "#ea4335" },
    { name: "Organic WhatsApp", leads: 0, revenue: "₹0", color: "#25d366" },
    { name: "Instagram", leads: 0, revenue: "₹0", color: "#e1306c" },
  ]

  const getHealthColor = (score) => {
    if (score >= 75) return accent
    if (score >= 50) return "#f59e0b"
    return "#ef4444"
  }

  const getHealthLabel = (score) => {
    if (score >= 75) return "Excellent"
    if (score >= 50) return "Needs Work"
    return "Critical"
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: ${t.bg} !important; color: ${t.text} !important; font-family: 'Plus Jakarta Sans', sans-serif !important; }
        .dash-root { display: flex; height: 100vh; overflow: hidden; background: ${t.bg}; }

        .sidebar { width: 224px; flex-shrink: 0; background: ${t.sidebar}; border-right: 1px solid ${t.border}; display: flex; flex-direction: column; overflow-y: auto; }
        .sidebar-logo { padding: 22px 20px 18px; font-weight: 800; font-size: 20px; color: ${t.text}; text-decoration: none; display: block; border-bottom: 1px solid ${t.border}; }
        .sidebar-logo span { color: ${accent}; }
        .sidebar-section { padding: 18px 16px 7px; font-size: 10px; letter-spacing: 1.2px; text-transform: uppercase; color: ${t.textFaint}; font-weight: 600; }
        .nav-item { display: flex; align-items: center; gap: 9px; padding: 9px 12px; margin: 1px 8px; border-radius: 8px; cursor: pointer; font-size: 13.5px; color: ${t.navText}; font-weight: 500; transition: all 0.13s; border: 1px solid transparent; background: none; width: calc(100% - 16px); text-align: left; font-family: 'Plus Jakarta Sans', sans-serif; }
        .nav-item:hover { background: ${t.inputBg}; color: ${t.text}; }
        .nav-item.active { background: ${t.navActive}; color: ${t.navActiveText}; font-weight: 600; border-color: ${t.navActiveBorder}; }
        .nav-icon { font-size: 13px; width: 18px; text-align: center; flex-shrink: 0; }
        .sidebar-footer { margin-top: auto; padding: 14px; border-top: 1px solid ${t.border}; }
        .user-card { display: flex; align-items: center; gap: 9px; padding: 9px; border-radius: 9px; background: ${t.inputBg}; border: 1px solid ${t.cardBorder}; }
        .user-avatar { width: 30px; height: 30px; border-radius: 8px; background: linear-gradient(135deg, ${accent}, #0ea5e9); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; color: #fff; flex-shrink: 0; }
        .user-email { font-size: 11.5px; color: ${t.textMuted}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .logout-btn { margin-top: 7px; width: 100%; padding: 7px; border-radius: 7px; background: transparent; border: 1px solid ${t.cardBorder}; font-size: 12px; color: ${t.textMuted}; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.12s; }
        .logout-btn:hover { border-color: #fca5a5; color: #ef4444; }

        .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .topbar { height: 54px; flex-shrink: 0; border-bottom: 1px solid ${t.border}; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; background: ${t.topbar}; }
        .topbar-left { display: flex; align-items: center; gap: 14px; }
        .topbar-title { font-weight: 700; font-size: 15px; color: ${t.text}; }
        .period-tabs { display: flex; gap: 3px; }
        .period-tab { padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid ${t.cardBorder}; background: transparent; color: ${t.textMuted}; transition: all 0.12s; font-family: 'Plus Jakarta Sans', sans-serif; }
        .period-tab.active { background: ${accent}18; border-color: ${accent}44; color: ${accent}; }
        .topbar-right { display: flex; align-items: center; gap: 10px; }

        .theme-toggle { display: flex; align-items: center; gap: 7px; padding: 5px 11px; border-radius: 8px; background: ${t.inputBg}; border: 1px solid ${t.cardBorder}; cursor: pointer; font-size: 12px; color: ${t.textMuted}; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500; transition: all 0.12s; }
        .theme-toggle:hover { color: ${t.text}; }
        .toggle-pill { width: 32px; height: 18px; border-radius: 100px; background: ${darkMode ? accent : "#d1d5db"}; position: relative; transition: background 0.2s; flex-shrink: 0; }
        .toggle-pill::after { content: ''; position: absolute; top: 2px; width: 14px; height: 14px; border-radius: 50%; background: #fff; transition: left 0.2s; left: ${darkMode ? "16px" : "2px"}; }

        .conn-badge { display: flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 100px; font-size: 11px; font-weight: 600; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #ef4444; }
        .conn-badge.connected { background: ${accent}18; border-color: ${accent}33; color: ${accent}; }
        .badge-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

        .content { flex: 1; overflow-y: auto; padding: 20px 24px; background: ${t.bg}; }
        .content::-webkit-scrollbar { width: 4px; }
        .content::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 2px; }

        .connect-banner { background: ${darkMode ? `linear-gradient(135deg,${accent}10,rgba(14,165,233,0.07))` : `linear-gradient(135deg,${accent}08,rgba(14,165,233,0.05))`}; border: 1px solid ${accent}30; border-radius: 13px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
        .connect-banner-left { display: flex; align-items: center; gap: 13px; }
        .connect-icon { width: 40px; height: 40px; border-radius: 10px; background: #25d366; display: flex; align-items: center; justify-content: center; font-size: 19px; flex-shrink: 0; box-shadow: 0 4px 14px rgba(37,211,102,0.25); }
        .connect-title { font-weight: 700; font-size: 13.5px; color: ${t.text}; margin-bottom: 2px; }
        .connect-sub { font-size: 12px; color: ${t.textMuted}; }
        .connect-btn { display: inline-flex; align-items: center; gap: 7px; background: #1877f2; color: #fff; font-weight: 700; font-size: 12.5px; padding: 9px 18px; border-radius: 9px; border: none; cursor: pointer; box-shadow: 0 3px 12px rgba(24,119,242,0.3); transition: all 0.15s; font-family: 'Plus Jakarta Sans', sans-serif; white-space: nowrap; }
        .connect-btn:hover { transform: translateY(-1px); }

        .top-row { display: grid; grid-template-columns: 230px 1fr; gap: 14px; margin-bottom: 14px; }
        .health-card { background: ${t.card}; border: 1px solid ${t.cardBorder}; border-radius: 13px; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; position: relative; overflow: hidden; }
        .health-card::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 50% 0%, ${accent}0d, transparent 65%); }
        .health-label { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: ${t.textFaint}; font-weight: 600; margin-bottom: 11px; }
        .health-ring { width: 106px; height: 106px; position: relative; margin-bottom: 11px; }
        .health-ring svg { transform: rotate(-90deg); }
        .health-score-num { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .health-num { font-weight: 800; font-size: 32px; line-height: 1; }
        .health-denom { font-size: 11px; color: ${t.textFaint}; }
        .health-status { font-weight: 700; font-size: 13px; margin-bottom: 4px; }
        .health-sub { font-size: 11px; color: ${t.textMuted}; line-height: 1.45; }

        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 11px; }
        .kpi-card { background: ${t.card}; border: 1px solid ${t.cardBorder}; border-radius: 11px; padding: 15px; transition: border-color 0.15s, transform 0.15s; }
        .kpi-card:hover { border-color: ${accent}44; transform: translateY(-1px); }
        .kpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 9px; }
        .kpi-name { font-size: 11.5px; color: ${t.textMuted}; font-weight: 500; }
        .kpi-dot { width: 6px; height: 6px; border-radius: 50%; }
        .kpi-val { font-weight: 700; font-size: 26px; letter-spacing: -0.5px; line-height: 1; margin-bottom: 4px; }
        .kpi-change { font-size: 11px; color: ${t.textFaint}; }

        .funnel-card { background: ${t.card}; border: 1px solid ${t.cardBorder}; border-radius: 13px; padding: 18px; margin-bottom: 14px; }
        .card-title { font-weight: 700; font-size: 13.5px; color: ${t.text}; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; }
        .card-subtitle { font-size: 11.5px; color: ${t.textMuted}; font-weight: 400; }
        .funnel-step { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px; }
        .funnel-bar { width: 100%; border-radius: 5px 5px 0 0; }
        .funnel-step-label { font-size: 10.5px; color: ${t.textMuted}; text-align: center; font-weight: 500; }
        .funnel-step-val { font-weight: 700; font-size: 13px; }
        .funnel-arrow { color: ${t.textFaint}; font-size: 15px; margin-bottom: 28px; }

        .mid-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
        .ai-card { background: ${t.card}; border: 1px solid ${t.cardBorder}; border-radius: 13px; padding: 18px; }
        .ai-badge { display: inline-flex; align-items: center; gap: 5px; background: rgba(124,58,237,0.1); border: 1px solid rgba(124,58,237,0.2); border-radius: 100px; padding: 3px 10px; font-size: 10px; color: #7c3aed; font-weight: 700; margin-bottom: 12px; }
        .ai-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
        .ai-metric { background: ${t.chipBg}; border: 1px solid ${t.chipBorder}; border-radius: 9px; padding: 12px; }
        .ai-metric-val { font-weight: 700; font-size: 22px; color: ${t.text}; margin-bottom: 2px; }
        .ai-metric-label { font-size: 11px; color: ${t.textMuted}; line-height: 1.4; }

        .lost-card { background: ${t.card}; border: 1px solid rgba(239,68,68,0.15); border-radius: 13px; padding: 18px; }
        .lost-title { font-weight: 700; font-size: 13.5px; color: ${t.text}; margin-bottom: 3px; display: flex; align-items: center; gap: 7px; }
        .lost-sub { font-size: 11.5px; color: ${t.textMuted}; margin-bottom: 14px; }
        .lost-amount { font-weight: 800; font-size: 36px; color: #ef4444; letter-spacing: -1px; margin-bottom: 3px; }
        .lost-desc { font-size: 12px; color: ${t.textMuted}; margin-bottom: 14px; }
        .lost-row { display: flex; align-items: center; justify-content: space-between; padding: 7px 10px; border-radius: 7px; background: ${t.chipBg}; border: 1px solid ${t.chipBorder}; margin-bottom: 6px; }
        .lost-row-label { font-size: 12px; color: ${t.textMuted}; }
        .lost-row-val { font-size: 12px; font-weight: 700; color: #ef4444; }

        .bot-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
        .sources-card { background: ${t.card}; border: 1px solid ${t.cardBorder}; border-radius: 13px; padding: 18px; }
        .source-row { display: flex; align-items: center; gap: 9px; padding: 9px 0; border-bottom: 1px solid ${t.border}; }
        .source-row:last-child { border-bottom: none; }
        .source-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .source-name { font-size: 12.5px; color: ${t.text}; flex: 1; font-weight: 500; }
        .source-leads { font-size: 11px; color: ${t.textMuted}; margin-right: 6px; }
        .source-rev { font-weight: 700; font-size: 12px; color: ${accent}; }
        .bookings-card { background: ${t.card}; border: 1px solid ${t.cardBorder}; border-radius: 13px; padding: 18px; }
        .booking-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 28px 0; text-align: center; gap: 7px; }
        .booking-empty-icon { font-size: 26px; opacity: 0.25; }
        .booking-empty-text { font-size: 12px; color: ${t.textFaint}; }
        .predict-card { background: ${t.card}; border: 1px solid ${accent}22; border-radius: 13px; padding: 18px; }
        .predict-label { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: ${t.textFaint}; font-weight: 600; margin-bottom: 5px; }
        .predict-amount { font-weight: 800; font-size: 30px; color: ${accent}; letter-spacing: -0.5px; margin-bottom: 3px; }
        .predict-sub { font-size: 12px; color: ${t.textMuted}; margin-bottom: 14px; }
        .predict-bar-bg { height: 5px; background: ${t.inputBg}; border-radius: 100px; margin-bottom: 5px; overflow: hidden; }
        .predict-bar-fill { height: 100%; border-radius: 100px; background: linear-gradient(90deg, ${accent}, #0ea5e9); width: 0%; }
        .predict-pct { font-size: 11px; color: ${t.textFaint}; }
        .predict-items { display: flex; flex-direction: column; gap: 7px; margin-top: 12px; }
        .predict-item { display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
        .predict-item-label { color: ${t.textMuted}; }
        .predict-item-val { font-weight: 600; color: ${t.text}; font-size: 12px; }

        @media (max-width: 1200px) { .kpi-grid { grid-template-columns: repeat(2,1fr); } .bot-row { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 900px) { .top-row, .mid-row, .bot-row { grid-template-columns: 1fr; } }
        @media (max-width: 768px) { .sidebar { display: none; } .content { padding: 14px; } }
      `}</style>

      <div className="dash-root">
        <aside className="sidebar">
          <a href="/" className="sidebar-logo">fast<span>rill</span></a>
          <div className="sidebar-section">Platform</div>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item${activeTab === item.id ? " active" : ""}`}
              onClick={() => {
                if (item.id === "settings") router.push("/dashboard/settings")
                else if (item.id === "inbox") router.push("/dashboard/conversations")
                else if (item.id === "bookings") router.push("/dashboard/bookings")
                else if (item.id === "campaigns") router.push("/dashboard/campaigns")
                else if (item.id === "leads") router.push("/dashboard/leads")
                else if (item.id === "contacts") router.push("/dashboard/contacts")
                else if (item.id === "analytics") router.push("/dashboard/analytics")
                else setActiveTab(item.id)
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          <div className="sidebar-footer">
            <div className="user-card">
              <div className="user-avatar">{userInitial}</div>
              <div className="user-email">{userEmail || "Loading..."}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>↩ Sign out</button>
          </div>
        </aside>

        <div className="main">
          <div className="topbar">
            <div className="topbar-left">
              <div className="topbar-title">Revenue Engine</div>
              <div className="period-tabs">
                {["today", "week", "month"].map(p => (
                  <button key={p} className={`period-tab${period === p ? " active" : ""}`} onClick={() => setPeriod(p)}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="topbar-right">
              <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
                <span>{darkMode ? "🌙" : "☀️"}</span>
                <div className="toggle-pill" />
                <span>{darkMode ? "Dark" : "Light"}</span>
              </button>
              <div className={`conn-badge${connected ? " connected" : ""}`}>
                <span className="badge-dot" />
                {connected ? "WhatsApp Live" : "Not Connected"}
              </div>
            </div>
          </div>

          <div className="content">
            {!connected && (
              <div className="connect-banner">
                <div className="connect-banner-left">
                  <div className="connect-icon">💬</div>
                  <div>
                    <div className="connect-title">Connect WhatsApp to start generating revenue</div>
                    <div className="connect-sub">Link your business number to activate AI-powered lead conversion</div>
                  </div>
                </div>
                <button className="connect-btn" onClick={handleConnect}>Connect WhatsApp →</button>
              </div>
            )}

            <div className="top-row">
              <div className="health-card">
                <div className="health-label">Business Health Score</div>
                <div className="health-ring">
                  <svg width="106" height="106" viewBox="0 0 106 106">
                    <circle cx="53" cy="53" r="44" fill="none" stroke={darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)"} strokeWidth="7"/>
                    <circle cx="53" cy="53" r="44" fill="none" stroke={getHealthColor(healthScore)} strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 44}`}
                      strokeDashoffset={`${2 * Math.PI * 44 * (1 - healthScore / 100)}`}
                      style={{transition:"stroke-dashoffset 1s ease"}}
                    />
                  </svg>
                  <div className="health-score-num">
                    <div className="health-num" style={{color: getHealthColor(healthScore)}}>{healthScore}</div>
                    <div className="health-denom">/100</div>
                  </div>
                </div>
                <div className="health-status" style={{color: getHealthColor(healthScore)}}>{getHealthLabel(healthScore)}</div>
                <div className="health-sub">Your WhatsApp is converting<br/>leads above average</div>
              </div>
              <div className="kpi-grid">
                {[
                  { name: "Revenue Generated", val: "₹0", color: accent },
                  { name: "Leads Captured", val: "0", color: "#0ea5e9" },
                  { name: "Appointments Booked", val: "0", color: "#7c3aed" },
                  { name: "Missed Leads", val: "0", color: "#ef4444" },
                ].map((kpi) => (
                  <div key={kpi.name} className="kpi-card">
                    <div className="kpi-top">
                      <div className="kpi-name">{kpi.name}</div>
                      <div className="kpi-dot" style={{background: kpi.color + "55"}} />
                    </div>
                    <div className="kpi-val" style={{color: kpi.color}}>{kpi.val}</div>
                    <div className="kpi-change">Connect to track</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="funnel-card">
              <div className="card-title">
                Conversion Funnel <span className="card-subtitle">Where are leads dropping off?</span>
              </div>
              <div style={{display:"flex", alignItems:"flex-end", gap:"8px", height:"110px"}}>
                {funnelSteps.map((step, i) => (
                  <>
                    <div key={step.label} className="funnel-step">
                      <div className="funnel-step-val" style={{color: step.color}}>{step.value}</div>
                      <div className="funnel-bar" style={{height:`${step.pct * 0.65}px`, background: step.color + "25", border:`1px solid ${step.color}35`}} />
                      <div className="funnel-step-label">{step.label}</div>
                    </div>
                    {i < funnelSteps.length - 1 && <div className="funnel-arrow" key={`a${i}`}>›</div>}
                  </>
                ))}
              </div>
            </div>

            <div className="mid-row">
              <div className="ai-card">
                <div className="ai-badge">◈ AI PERFORMANCE</div>
                <div className="card-title" style={{marginBottom:"12px"}}>
                  What your AI achieved <span className="card-subtitle">Powered by Claude</span>
                </div>
                <div className="ai-metrics">
                  {aiMetrics.map((m) => (
                    <div key={m.label} className="ai-metric">
                      <div className="ai-metric-val">{m.value}</div>
                      <div className="ai-metric-label">{m.label}<br/>{m.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lost-card">
                <div className="lost-title"><span>🔥</span> Lost Revenue Tracker</div>
                <div className="lost-sub">Revenue lost from unanswered or abandoned leads</div>
                <div className="lost-amount">₹0</div>
                <div className="lost-desc">potential revenue lost this {period}</div>
                {[
                  { label: "Unanswered leads", val: "₹0" },
                  { label: "Abandoned conversations", val: "₹0" },
                  { label: "No follow-up sent", val: "₹0" },
                ].map(r => (
                  <div key={r.label} className="lost-row">
                    <span className="lost-row-label">{r.label}</span>
                    <span className="lost-row-val">{r.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bot-row">
              <div className="sources-card">
                <div className="card-title" style={{marginBottom:"10px"}}>
                  Lead Sources <span className="card-subtitle">Revenue by channel</span>
                </div>
                {sources.map((s) => (
                  <div key={s.name} className="source-row">
                    <div className="source-dot" style={{background: s.color}} />
                    <div className="source-name">{s.name}</div>
                    <div className="source-leads">{s.leads} leads</div>
                    <div className="source-rev">{s.revenue}</div>
                  </div>
                ))}
              </div>
              <div className="bookings-card">
                <div className="card-title" style={{marginBottom:"10px"}}>
                  Today's Bookings <span className="card-subtitle">Upcoming</span>
                </div>
                <div className="booking-empty">
                  <div className="booking-empty-icon">📅</div>
                  <div className="booking-empty-text">No bookings yet today<br/>Connect WhatsApp to start</div>
                </div>
              </div>
              <div className="predict-card">
                <div className="predict-label">Monthly Forecast</div>
                <div className="predict-amount">₹0</div>
                <div className="predict-sub">Predicted revenue based on current trends</div>
                <div className="predict-bar-bg"><div className="predict-bar-fill" /></div>
                <div className="predict-pct">0% of monthly target reached</div>
                <div className="predict-items">
                  {[
                    { label: "Avg booking value", val: "—" },
                    { label: "Conversion rate", val: "—" },
                    { label: "Leads needed", val: "—" },
                    { label: "Days remaining", val: new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate() - new Date().getDate() },
                  ].map(item => (
                    <div key={item.label} className="predict-item">
                      <span className="predict-item-label">{item.label}</span>
                      <span className="predict-item-val">{item.val}</span>
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
