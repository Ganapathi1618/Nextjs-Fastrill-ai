"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function Dashboard() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [connected, setConnected] = useState(false)

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

  const stats = [
    { label: "Messages Today", value: "0", unit: "", icon: "💬", color: "#16a34a" },
    { label: "Reply Rate", value: "0", unit: "%", icon: "⚡", color: "#2563eb" },
    { label: "Conversations", value: "0", unit: "", icon: "🔄", color: "#7c3aed" },
    { label: "Conversions", value: "0", unit: "", icon: "🎯", color: "#ea580c" },
  ]

  const navItems = [
    { id: "overview", label: "Overview", icon: "▣" },
    { id: "inbox", label: "Inbox", icon: "💬" },
    { id: "campaigns", label: "Campaigns", icon: "📣" },
    { id: "automation", label: "Automation", icon: "🤖" },
    { id: "contacts", label: "Contacts", icon: "👥" },
    { id: "analytics", label: "Analytics", icon: "📊" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ]

  const userInitial = userEmail ? userEmail[0].toUpperCase() : "U"

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f6fa; color: #111827; font-family: 'Plus Jakarta Sans', sans-serif; overflow-x: hidden; }

        /* LAYOUT */
        .dash-root { display: flex; height: 100vh; overflow: hidden; }

        /* SIDEBAR */
        .sidebar {
          width: 232px; flex-shrink: 0;
          background: #fff;
          border-right: 1px solid #e5e7eb;
          display: flex; flex-direction: column;
          overflow-y: auto;
        }
        .sidebar-logo {
          padding: 22px 20px 18px;
          border-bottom: 1px solid #f3f4f6;
          font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800;
          font-size: 20px; color: #111827; text-decoration: none;
          display: block; letter-spacing: -0.5px;
        }
        .sidebar-logo span { color: #059669; }

        .sidebar-section-label {
          font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase;
          color: #9ca3af; font-weight: 600;
          padding: 20px 20px 8px;
        }

        .nav-item {
          display: flex; align-items: center; gap: 9px;
          padding: 9px 12px; margin: 1px 8px;
          border-radius: 8px; cursor: pointer;
          font-size: 13.5px; color: #6b7280; font-weight: 500;
          transition: all 0.12s; border: none; background: none;
          width: calc(100% - 16px); text-align: left;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .nav-item:hover { background: #f9fafb; color: #111827; }
        .nav-item.active { background: #ecfdf5; color: #059669; font-weight: 600; }
        .nav-item-icon { font-size: 15px; width: 20px; text-align: center; flex-shrink: 0; }

        .sidebar-footer {
          margin-top: auto; padding: 14px;
          border-top: 1px solid #f3f4f6;
        }
        .user-card {
          display: flex; align-items: center; gap: 10px;
          padding: 10px; border-radius: 10px;
          background: #f9fafb; border: 1px solid #e5e7eb;
        }
        .user-avatar {
          width: 32px; height: 32px; border-radius: 8px;
          background: linear-gradient(135deg, #059669, #0284c7);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800;
          font-size: 13px; color: #fff; flex-shrink: 0;
        }
        .user-email { font-size: 11.5px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
        .logout-btn {
          margin-top: 8px; width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 8px; border-radius: 8px;
          background: #fff; border: 1px solid #e5e7eb;
          font-size: 12px; color: #9ca3af; cursor: pointer;
          transition: all 0.12s; font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 500;
        }
        .logout-btn:hover { border-color: #fca5a5; color: #ef4444; background: #fef2f2; }

        /* MAIN */
        .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

        /* TOPBAR */
        .topbar {
          height: 58px; flex-shrink: 0;
          border-bottom: 1px solid #e5e7eb;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 24px; background: #fff;
        }
        .topbar-title {
          font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700;
          font-size: 15px; color: #111827;
        }
        .topbar-right { display: flex; align-items: center; gap: 10px; }
        .topbar-badge {
          display: flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 100px;
          background: #fef2f2; border: 1px solid #fecaca;
          font-size: 11.5px; color: #dc2626; font-weight: 600;
        }
        .topbar-badge.connected {
          background: #ecfdf5; border-color: #a7f3d0; color: #059669;
        }
        .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

        /* CONTENT */
        .content { flex: 1; overflow-y: auto; padding: 24px; background: #f5f6fa; }

        /* CONNECT BANNER */
        .connect-banner {
          background: linear-gradient(135deg, #ecfdf5, #eff6ff);
          border: 1px solid #a7f3d0;
          border-radius: 14px; padding: 20px 24px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; margin-bottom: 24px; flex-wrap: wrap;
        }
        .connect-banner-left { display: flex; align-items: center; gap: 14px; }
        .connect-banner-icon {
          width: 44px; height: 44px; border-radius: 12px;
          background: #25d366;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(37,211,102,0.25);
        }
        .connect-banner-title {
          font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700;
          font-size: 14px; color: #111827; margin-bottom: 3px;
        }
        .connect-banner-sub { font-size: 12.5px; color: #6b7280; font-weight: 400; }
        .connect-btn {
          display: inline-flex; align-items: center; gap: 7px;
          background: #1877f2; color: #fff;
          font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700;
          font-size: 13px; padding: 10px 18px; border-radius: 9px;
          border: none; cursor: pointer;
          transition: opacity 0.15s, transform 0.12s; white-space: nowrap;
          box-shadow: 0 2px 8px rgba(24,119,242,0.3);
        }
        .connect-btn:hover { opacity: 0.9; transform: translateY(-1px); }

        /* STATS GRID */
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
        .stat-card {
          background: #fff; border: 1px solid #e5e7eb;
          border-radius: 12px; padding: 18px;
          transition: box-shadow 0.15s, border-color 0.15s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-color: #d1fae5; }
        .stat-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .stat-icon {
          width: 34px; height: 34px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
        }
        .stat-label { font-size: 12px; color: #6b7280; font-weight: 500; }
        .stat-value {
          font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800;
          font-size: 30px; letter-spacing: -1px; color: #111827; line-height: 1;
        }
        .stat-value span { font-size: 16px; color: #9ca3af; font-weight: 600; }
        .stat-empty { font-size: 11px; color: #d1d5db; margin-top: 5px; font-weight: 400; }

        /* GRID */
        .grid-3-1 { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }

        /* PANEL */
        .panel {
          background: #fff; border: 1px solid #e5e7eb;
          border-radius: 12px; overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .panel-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 18px; border-bottom: 1px solid #f3f4f6;
        }
        .panel-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 13.5px; color: #111827; }
        .panel-action {
          font-size: 12px; color: #9ca3af; text-decoration: none;
          cursor: pointer; transition: color 0.12s;
          background: none; border: none; font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 500;
        }
        .panel-action:hover { color: #059669; }

        /* INBOX EMPTY */
        .inbox-empty { padding: 44px 20px; text-align: center; }
        .inbox-empty-icon { font-size: 32px; margin-bottom: 10px; }
        .inbox-empty-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 14px; color: #9ca3af; margin-bottom: 5px; }
        .inbox-empty-sub { font-size: 12.5px; color: #d1d5db; font-weight: 400; }

        /* QUICK ACTIONS */
        .quick-actions { display: flex; flex-direction: column; gap: 8px; padding: 14px; }
        .quick-action {
          display: flex; align-items: center; gap: 11px;
          padding: 12px; border-radius: 9px;
          background: #f9fafb; border: 1px solid #f3f4f6;
          cursor: pointer; transition: all 0.12s; text-align: left;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .quick-action:hover { border-color: #a7f3d0; background: #f0fdf4; }
        .qa-icon {
          width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-size: 15px;
        }
        .qa-title { font-weight: 600; font-size: 12.5px; color: #374151; margin-bottom: 1px; }
        .qa-sub { font-size: 11px; color: #9ca3af; font-weight: 400; }
        .qa-arrow { margin-left: auto; color: #d1d5db; font-size: 15px; }

        /* CHECKLIST */
        .checklist { padding: 14px; display: flex; flex-direction: column; gap: 7px; }
        .check-item {
          display: flex; align-items: center; gap: 11px;
          padding: 11px 13px; border-radius: 9px;
          background: #f9fafb; border: 1px solid #f3f4f6;
        }
        .check-item.done { background: #f0fdf4; border-color: #d1fae5; }
        .check-circle {
          width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
          border: 2px solid #d1d5db;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; color: transparent;
        }
        .check-circle.done { background: #059669; border-color: #059669; color: #fff; font-weight: 700; }
        .check-text { font-size: 13px; color: #9ca3af; font-weight: 500; }
        .check-text.done { color: #374151; }

        /* RESPONSIVE */
        @media (max-width: 1100px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .grid-3-1 { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .sidebar { display: none; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .content { padding: 16px; }
          .topbar { padding: 0 16px; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
          .connect-banner { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <div className="dash-root">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <a href="/" className="sidebar-logo">fast<span>rill</span></a>

          <div className="sidebar-section-label">Main Menu</div>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item${activeTab === item.id ? " active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}

          <div className="sidebar-footer">
            <div className="user-card">
              <div className="user-avatar">{userInitial}</div>
              <div className="user-email">{userEmail || "Loading..."}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              ↩ Sign out
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="main">
          {/* TOPBAR */}
          <div className="topbar">
            <div className="topbar-title">
              {navItems.find(n => n.id === activeTab)?.label || "Overview"}
            </div>
            <div className="topbar-right">
              <div className={`topbar-badge${connected ? " connected" : ""}`}>
                <span className="badge-dot" />
                {connected ? "WhatsApp Connected" : "Not Connected"}
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="content">

            {/* CONNECT BANNER */}
            {!connected && (
              <div className="connect-banner">
                <div className="connect-banner-left">
                  <div className="connect-banner-icon">💬</div>
                  <div>
                    <div className="connect-banner-title">Connect your WhatsApp Business account</div>
                    <div className="connect-banner-sub">Link your number to start automating replies and campaigns</div>
                  </div>
                </div>
                <button className="connect-btn" onClick={handleConnect}>
                  Connect WhatsApp →
                </button>
              </div>
            )}

            {/* STATS */}
            <div className="stats-grid">
              {stats.map((s) => (
                <div key={s.label} className="stat-card">
                  <div className="stat-card-top">
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-icon" style={{background: s.color + "15"}}>{s.icon}</div>
                  </div>
                  <div className="stat-value">
                    {s.value}<span>{s.unit}</span>
                  </div>
                  <div className="stat-empty">Connect WhatsApp to see data</div>
                </div>
              ))}
            </div>

            {/* ROW: Inbox + Quick Actions */}
            <div className="grid-3-1" style={{marginBottom:"16px"}}>
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">Recent Messages</div>
                  <button className="panel-action" onClick={() => setActiveTab("inbox")}>View all →</button>
                </div>
                <div className="inbox-empty">
                  <div className="inbox-empty-icon">📭</div>
                  <div className="inbox-empty-title">No messages yet</div>
                  <div className="inbox-empty-sub">Connect WhatsApp to start receiving messages here</div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">Quick Actions</div>
                </div>
                <div className="quick-actions">
                  {[
                    { icon: "📣", bg: "#ecfdf5", title: "New Campaign", sub: "Send a broadcast" },
                    { icon: "🤖", bg: "#eff6ff", title: "Create Automation", sub: "Build a workflow" },
                    { icon: "📋", bg: "#fffbeb", title: "Message Templates", sub: "Browse templates" },
                    { icon: "👥", bg: "#f5f3ff", title: "Import Contacts", sub: "Upload a CSV" },
                  ].map((a) => (
                    <button key={a.title} className="quick-action">
                      <div className="qa-icon" style={{background: a.bg}}>{a.icon}</div>
                      <div>
                        <div className="qa-title">{a.title}</div>
                        <div className="qa-sub">{a.sub}</div>
                      </div>
                      <span className="qa-arrow">›</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SETUP CHECKLIST */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Getting Started</div>
                <div className="panel-action">1 of 4 complete</div>
              </div>
              <div className="checklist">
                {[
                  { label: "Create your Fastrill account", done: true },
                  { label: "Connect WhatsApp Business account", done: false },
                  { label: "Set up your first automation", done: false },
                  { label: "Send your first campaign", done: false },
                ].map((c) => (
                  <div key={c.label} className={`check-item${c.done ? " done" : ""}`}>
                    <div className={`check-circle${c.done ? " done" : ""}`}>
                      {c.done ? "✓" : ""}
                    </div>
                    <div className={`check-text${c.done ? " done" : ""}`}>{c.label}</div>
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
