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

  const navItems = [
    { id: "overview", label: "Revenue Engine", icon: "◈" },
    { id: "inbox", label: "Conversations", icon: "◎" },
    { id: "bookings", label: "Bookings", icon: "◷" },
    { id: "leads", label: "Lead Recovery", icon: "◉" },
    { id: "contacts", label: "Customers", icon: "◑" },
    { id: "analytics", label: "Analytics", icon: "◫" },
    { id: "settings", label: "Settings", icon: "◌" },
  ]

  const funnelSteps = [
    { label: "Leads In", value: 0, pct: 100, color: "#00c47d" },
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
    if (score >= 75) return "#00c47d"
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
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          background: #0a0a0f !important;
          color: #e8e8f0 !important;
          font-family: 'DM Sans', sans-serif !important;
        }

        /* ── ROOT LAYOUT ── */
        .dash-root { display: flex; height: 100vh; overflow: hidden; background: #0a0a0f; }

        /* ── SIDEBAR ── */
        .sidebar {
          width: 220px; flex-shrink: 0;
          background: #0f0f17;
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex; flex-direction: column;
          overflow-y: auto;
        }
        .sidebar-logo {
          padding: 24px 20px 20px;
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 22px; color: #fff; text-decoration: none;
          display: block; letter-spacing: -0.5px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .sidebar-logo span { color: #00c47d; }

        .sidebar-section {
          padding: 20px 12px 8px;
          font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
          color: rgba(255,255,255,0.2); font-weight: 600;
        }

        .nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; margin: 2px 8px;
          border-radius: 8px; cursor: pointer;
          font-size: 13px; color: rgba(255,255,255,0.45); font-weight: 500;
          transition: all 0.15s; border: none; background: none;
          width: calc(100% - 16px); text-align: left;
          font-family: 'DM Sans', sans-serif;
        }
        .nav-item:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8); }
        .nav-item.active {
          background: rgba(0,196,125,0.1);
          color: #00c47d; font-weight: 600;
          border: 1px solid rgba(0,196,125,0.2);
        }
        .nav-icon { font-size: 14px; width: 18px; text-align: center; flex-shrink: 0; }

        .sidebar-footer {
          margin-top: auto; padding: 14px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .user-card {
          display: flex; align-items: center; gap: 10px;
          padding: 10px; border-radius: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .user-avatar {
          width: 30px; height: 30px; border-radius: 8px;
          background: linear-gradient(135deg, #00c47d, #0ea5e9);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 12px; color: #fff; flex-shrink: 0;
        }
        .user-email { font-size: 11px; color: rgba(255,255,255,0.35); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .logout-btn {
          margin-top: 8px; width: 100%;
          padding: 7px; border-radius: 7px;
          background: transparent; border: 1px solid rgba(255,255,255,0.08);
          font-size: 11.5px; color: rgba(255,255,255,0.3); cursor: pointer;
          transition: all 0.12s; font-family: 'DM Sans', sans-serif;
        }
        .logout-btn:hover { border-color: rgba(239,68,68,0.4); color: #ef4444; }

        /* ── MAIN ── */
        .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

        /* ── TOPBAR ── */
        .topbar {
          height: 56px; flex-shrink: 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 24px; background: #0f0f17;
        }
        .topbar-left { display: flex; align-items: center; gap: 16px; }
        .topbar-title {
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 15px; color: #fff;
        }
        .period-tabs { display: flex; gap: 4px; }
        .period-tab {
          padding: 4px 12px; border-radius: 6px;
          font-size: 11.5px; font-weight: 600; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.08);
          background: transparent; color: rgba(255,255,255,0.35);
          transition: all 0.12s; font-family: 'DM Sans', sans-serif;
        }
        .period-tab.active {
          background: rgba(0,196,125,0.12);
          border-color: rgba(0,196,125,0.3);
          color: #00c47d;
        }
        .topbar-right { display: flex; align-items: center; gap: 10px; }
        .conn-badge {
          display: flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 100px;
          font-size: 11px; font-weight: 600;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          color: #ef4444;
        }
        .conn-badge.connected {
          background: rgba(0,196,125,0.1);
          border-color: rgba(0,196,125,0.25);
          color: #00c47d;
        }
        .badge-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

        /* ── CONTENT ── */
        .content { flex: 1; overflow-y: auto; padding: 20px 24px; background: #0a0a0f; }

        /* ── CONNECT BANNER ── */
        .connect-banner {
          background: linear-gradient(135deg, rgba(0,196,125,0.08), rgba(14,165,233,0.08));
          border: 1px solid rgba(0,196,125,0.2);
          border-radius: 14px; padding: 18px 22px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; margin-bottom: 20px;
        }
        .connect-banner-left { display: flex; align-items: center; gap: 14px; }
        .connect-icon {
          width: 42px; height: 42px; border-radius: 11px;
          background: #25d366;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(37,211,102,0.3);
        }
        .connect-title {
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 13.5px; color: #fff; margin-bottom: 3px;
        }
        .connect-sub { font-size: 12px; color: rgba(255,255,255,0.4); }
        .connect-btn {
          display: inline-flex; align-items: center; gap: 7px;
          background: #1877f2; color: #fff;
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 12.5px; padding: 10px 18px; border-radius: 9px;
          border: none; cursor: pointer; white-space: nowrap;
          box-shadow: 0 4px 14px rgba(24,119,242,0.4);
          transition: all 0.15s;
        }
        .connect-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(24,119,242,0.5); }

        /* ── SCORE + KPI ROW ── */
        .top-row { display: grid; grid-template-columns: 240px 1fr; gap: 16px; margin-bottom: 16px; }

        /* ── HEALTH SCORE ── */
        .health-card {
          background: #0f0f17;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 20px;
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; text-align: center;
          position: relative; overflow: hidden;
        }
        .health-card::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(circle at 50% 0%, rgba(0,196,125,0.08), transparent 70%);
        }
        .health-label {
          font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
          color: rgba(255,255,255,0.3); font-weight: 600; margin-bottom: 12px;
        }
        .health-ring {
          width: 110px; height: 110px; position: relative; margin-bottom: 12px;
        }
        .health-ring svg { transform: rotate(-90deg); }
        .health-score-num {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
        }
        .health-num {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 30px; line-height: 1;
        }
        .health-denom { font-size: 11px; color: rgba(255,255,255,0.3); }
        .health-status {
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 13px; margin-bottom: 4px;
        }
        .health-sub { font-size: 11px; color: rgba(255,255,255,0.35); line-height: 1.4; }

        /* ── KPI GRID ── */
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .kpi-card {
          background: #0f0f17;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 16px;
          transition: border-color 0.15s, transform 0.15s;
          cursor: default;
        }
        .kpi-card:hover { border-color: rgba(0,196,125,0.25); transform: translateY(-1px); }
        .kpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .kpi-name { font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 500; }
        .kpi-dot { width: 6px; height: 6px; border-radius: 50%; }
        .kpi-val {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 26px; color: #fff; letter-spacing: -1px; line-height: 1;
          margin-bottom: 4px;
        }
        .kpi-change { font-size: 11px; color: rgba(255,255,255,0.25); }
        .kpi-change.up { color: #00c47d; }
        .kpi-change.down { color: #ef4444; }

        /* ── FUNNEL ── */
        .funnel-card {
          background: #0f0f17;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 20px;
          margin-bottom: 16px;
        }
        .card-title {
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 13px; color: #fff; margin-bottom: 16px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .card-subtitle { font-size: 11px; color: rgba(255,255,255,0.3); font-weight: 400; font-family: 'DM Sans', sans-serif; }
        .funnel-steps { display: flex; align-items: flex-end; gap: 4px; height: 80px; }
        .funnel-step { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .funnel-bar {
          width: 100%; border-radius: 6px 6px 0 0;
          transition: opacity 0.2s;
        }
        .funnel-bar:hover { opacity: 0.8; }
        .funnel-step-label { font-size: 10px; color: rgba(255,255,255,0.35); text-align: center; font-weight: 500; }
        .funnel-step-val { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px; color: #fff; }
        .funnel-arrow { color: rgba(255,255,255,0.15); font-size: 16px; margin-bottom: 30px; }

        /* ── MIDDLE ROW ── */
        .mid-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }

        /* ── AI PERFORMANCE ── */
        .ai-card {
          background: #0f0f17;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 20px;
        }
        .ai-badge {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(124,58,237,0.15);
          border: 1px solid rgba(124,58,237,0.25);
          border-radius: 100px; padding: 3px 10px;
          font-size: 10px; color: #a78bfa; font-weight: 600;
          margin-bottom: 14px;
        }
        .ai-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .ai-metric {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 10px; padding: 12px;
        }
        .ai-metric-val {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 22px; color: #fff; margin-bottom: 2px;
        }
        .ai-metric-label { font-size: 11px; color: rgba(255,255,255,0.3); }

        /* ── LOST REVENUE ── */
        .lost-card {
          background: linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.02));
          border: 1px solid rgba(239,68,68,0.15);
          border-radius: 14px; padding: 20px;
        }
        .lost-title {
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 13px; color: #fff; margin-bottom: 4px;
          display: flex; align-items: center; gap: 8px;
        }
        .lost-fire { font-size: 16px; }
        .lost-sub { font-size: 11px; color: rgba(255,255,255,0.3); margin-bottom: 16px; }
        .lost-amount {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 38px; color: #ef4444; letter-spacing: -2px;
          margin-bottom: 4px;
        }
        .lost-desc { font-size: 12px; color: rgba(255,255,255,0.35); margin-bottom: 16px; }
        .lost-breakdown { display: flex; flex-direction: column; gap: 8px; }
        .lost-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 10px; border-radius: 8px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
        }
        .lost-row-label { font-size: 11.5px; color: rgba(255,255,255,0.4); }
        .lost-row-val { font-size: 12px; font-weight: 700; color: #ef4444; font-family: 'Syne', sans-serif; }

        /* ── BOTTOM ROW ── */
        .bot-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }

        /* ── SOURCES ── */
        .sources-card {
          background: #0f0f17;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 20px;
        }
        .source-row {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .source-row:last-child { border-bottom: none; }
        .source-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .source-name { font-size: 12.5px; color: rgba(255,255,255,0.6); flex: 1; font-weight: 500; }
        .source-leads { font-size: 11px; color: rgba(255,255,255,0.3); margin-right: 8px; }
        .source-rev { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 12px; color: #00c47d; }

        /* ── BOOKINGS ── */
        .bookings-card {
          background: #0f0f17;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 20px;
        }
        .booking-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 30px 0; text-align: center;
          gap: 8px;
        }
        .booking-empty-icon { font-size: 28px; opacity: 0.3; }
        .booking-empty-text { font-size: 12px; color: rgba(255,255,255,0.25); }

        /* ── PREDICTION ── */
        .predict-card {
          background: linear-gradient(135deg, rgba(0,196,125,0.06), rgba(14,165,233,0.06));
          border: 1px solid rgba(0,196,125,0.15);
          border-radius: 14px; padding: 20px;
        }
        .predict-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.3); font-weight: 600; margin-bottom: 6px; }
        .predict-amount {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 32px; color: #00c47d; letter-spacing: -1px; margin-bottom: 4px;
        }
        .predict-sub { font-size: 11.5px; color: rgba(255,255,255,0.3); margin-bottom: 16px; }
        .predict-bar-bg {
          height: 6px; background: rgba(255,255,255,0.06);
          border-radius: 100px; margin-bottom: 6px; overflow: hidden;
        }
        .predict-bar-fill {
          height: 100%; border-radius: 100px;
          background: linear-gradient(90deg, #00c47d, #0ea5e9);
          width: 0%;
        }
        .predict-pct { font-size: 11px; color: rgba(255,255,255,0.3); }
        .predict-items { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
        .predict-item {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 12px;
        }
        .predict-item-label { color: rgba(255,255,255,0.4); }
        .predict-item-val { font-family: 'Syne', sans-serif; font-weight: 700; color: rgba(255,255,255,0.7); font-size: 12px; }

        /* ── SCROLLBAR ── */
        .content::-webkit-scrollbar { width: 4px; }
        .content::-webkit-scrollbar-track { background: transparent; }
        .content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

        /* ── RESPONSIVE ── */
        @media (max-width: 1200px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr); }
          .bot-row { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 900px) {
          .top-row { grid-template-columns: 1fr; }
          .mid-row { grid-template-columns: 1fr; }
          .bot-row { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .sidebar { display: none; }
          .content { padding: 14px; }
        }
      `}</style>

      <div className="dash-root">
        {/* ── SIDEBAR ── */}
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

        {/* ── MAIN ── */}
        <div className="main">
          {/* TOPBAR */}
          <div className="topbar">
            <div className="topbar-left">
              <div className="topbar-title">Revenue Engine</div>
              <div className="period-tabs">
                {["today", "week", "month"].map(p => (
                  <button
                    key={p}
                    className={`period-tab${period === p ? " active" : ""}`}
                    onClick={() => setPeriod(p)}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="topbar-right">
              <div className={`conn-badge${connected ? " connected" : ""}`}>
                <span className="badge-dot" />
                {connected ? "WhatsApp Live" : "Not Connected"}
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="content">

            {/* CONNECT BANNER */}
            {!connected && (
              <div className="connect-banner">
                <div className="connect-banner-left">
                  <div className="connect-icon">💬</div>
                  <div>
                    <div className="connect-title">Connect WhatsApp to start generating revenue</div>
                    <div className="connect-sub">Link your business number to activate AI-powered lead conversion</div>
                  </div>
                </div>
                <button className="connect-btn" onClick={handleConnect}>
                  Connect WhatsApp →
                </button>
              </div>
            )}

            {/* HEALTH SCORE + KPIs */}
            <div className="top-row">
              {/* Business Health Score */}
              <div className="health-card">
                <div className="health-label">Business Health Score</div>
                <div className="health-ring">
                  <svg width="110" height="110" viewBox="0 0 110 110">
                    <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
                    <circle
                      cx="55" cy="55" r="46" fill="none"
                      stroke={getHealthColor(healthScore)}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 46}`}
                      strokeDashoffset={`${2 * Math.PI * 46 * (1 - healthScore / 100)}`}
                      style={{transition: "stroke-dashoffset 1s ease"}}
                    />
                  </svg>
                  <div className="health-score-num">
                    <div className="health-num" style={{color: getHealthColor(healthScore)}}>{healthScore}</div>
                    <div className="health-denom">/100</div>
                  </div>
                </div>
                <div className="health-status" style={{color: getHealthColor(healthScore)}}>
                  {getHealthLabel(healthScore)}
                </div>
                <div className="health-sub">Your WhatsApp is converting<br/>leads above average</div>
              </div>

              {/* KPI Cards */}
              <div className="kpi-grid">
                {[
                  { name: "Revenue Generated", val: "₹0", change: "Connect to track", color: "#00c47d" },
                  { name: "Leads Captured", val: "0", change: "Connect to track", color: "#0ea5e9" },
                  { name: "Appointments Booked", val: "0", change: "Connect to track", color: "#7c3aed" },
                  { name: "Missed Leads", val: "0", change: "Connect to track", color: "#ef4444" },
                ].map((kpi) => (
                  <div key={kpi.name} className="kpi-card">
                    <div className="kpi-top">
                      <div className="kpi-name">{kpi.name}</div>
                      <div className="kpi-dot" style={{background: kpi.color + "60"}} />
                    </div>
                    <div className="kpi-val" style={{color: kpi.color}}>{kpi.val}</div>
                    <div className="kpi-change">{kpi.change}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* CONVERSION FUNNEL */}
            <div className="funnel-card">
              <div className="card-title">
                Conversion Funnel
                <span className="card-subtitle">Where are leads dropping off?</span>
              </div>
              <div style={{display:"flex", alignItems:"flex-end", gap:"8px", height:"120px"}}>
                {funnelSteps.map((step, i) => (
                  <>
                    <div key={step.label} className="funnel-step">
                      <div className="funnel-step-val" style={{color: step.color}}>{step.value}</div>
                      <div
                        className="funnel-bar"
                        style={{
                          height: `${step.pct * 0.7}px`,
                          background: step.color + "30",
                          border: `1px solid ${step.color}40`,
                        }}
                      />
                      <div className="funnel-step-label">{step.label}</div>
                    </div>
                    {i < funnelSteps.length - 1 && (
                      <div className="funnel-arrow" key={`arr-${i}`}>›</div>
                    )}
                  </>
                ))}
              </div>
            </div>

            {/* AI PERFORMANCE + LOST REVENUE */}
            <div className="mid-row">
              {/* AI Performance */}
              <div className="ai-card">
                <div className="ai-badge">◈ AI PERFORMANCE</div>
                <div className="card-title" style={{marginBottom:"14px"}}>
                  What your AI achieved
                  <span className="card-subtitle">Powered by Claude</span>
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

              {/* Lost Revenue Tracker */}
              <div className="lost-card">
                <div className="lost-title">
                  <span className="lost-fire">🔥</span>
                  Lost Revenue Tracker
                </div>
                <div className="lost-sub">Revenue lost from unanswered or abandoned leads</div>
                <div className="lost-amount">₹0</div>
                <div className="lost-desc">potential revenue lost this {period}</div>
                <div className="lost-breakdown">
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
            </div>

            {/* SOURCES + BOOKINGS + PREDICTION */}
            <div className="bot-row">
              {/* Marketing Sources */}
              <div className="sources-card">
                <div className="card-title" style={{marginBottom:"12px"}}>
                  Lead Sources
                  <span className="card-subtitle">Revenue by channel</span>
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

              {/* Today's Bookings */}
              <div className="bookings-card">
                <div className="card-title" style={{marginBottom:"12px"}}>
                  Today's Bookings
                  <span className="card-subtitle">Upcoming appointments</span>
                </div>
                <div className="booking-empty">
                  <div className="booking-empty-icon">📅</div>
                  <div className="booking-empty-text">No bookings yet today<br/>Connect WhatsApp to start</div>
                </div>
              </div>

              {/* Revenue Prediction */}
              <div className="predict-card">
                <div className="predict-label">Monthly Forecast</div>
                <div className="predict-amount">₹0</div>
                <div className="predict-sub">Predicted revenue based on current trends</div>
                <div className="predict-bar-bg">
                  <div className="predict-bar-fill" style={{width: "0%"}} />
                </div>
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
