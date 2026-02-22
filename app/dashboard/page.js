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
      `https://www.facebook.com/dialog/oauth?client_id=${appId}` +
      `&redirect_uri=${redirectUri}` +
      `&response_type=code` +
      `&config_id=${configId}`
  }

  const stats = [
    { label: "Messages Today", value: "0", unit: "", trend: null, icon: "💬" },
    { label: "Reply Rate", value: "0", unit: "%", trend: null, icon: "⚡" },
    { label: "Conversations", value: "0", unit: "", trend: null, icon: "🔄" },
    { label: "Conversions", value: "0", unit: "", trend: null, icon: "🎯" },
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

  const recentMessages = [
    { name: "Priya S.", msg: "Hi, what's the price for the gold plan?", time: "—", intent: "Pricing inquiry", unread: false },
    { name: "Rahul M.", msg: "Is there a trial available?", time: "—", intent: "Trial query", unread: false },
    { name: "Arjun T.", msg: "Can I integrate with Shopify?", time: "—", intent: "Integration query", unread: false },
  ]

  const userInitial = userEmail ? userEmail[0].toUpperCase() : "U"

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080c10; color: #e8edf2; font-family: 'DM Sans', sans-serif; overflow-x: hidden; }

        /* LAYOUT */
        .dash-root { display: flex; height: 100vh; overflow: hidden; }

        /* SIDEBAR */
        .sidebar {
          width: 240px; flex-shrink: 0;
          background: #0d1117;
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex; flex-direction: column;
          padding: 0;
          overflow-y: auto;
        }
        .sidebar-logo {
          padding: 24px 20px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 20px; color: #fff; text-decoration: none;
          display: block;
        }
        .sidebar-logo span { color: #00e5a0; }

        .sidebar-section-label {
          font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
          color: rgba(255,255,255,0.2); font-weight: 500;
          padding: 20px 20px 8px;
        }

        .nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 20px; margin: 1px 8px;
          border-radius: 8px; cursor: pointer;
          font-size: 14px; color: rgba(255,255,255,0.4);
          transition: all 0.15s; border: none; background: none;
          width: calc(100% - 16px); text-align: left;
        }
        .nav-item:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.7); }
        .nav-item.active { background: rgba(0,229,160,0.08); color: #00e5a0; }
        .nav-item-icon { font-size: 15px; width: 20px; text-align: center; flex-shrink: 0; }
        .nav-item-label { font-weight: 400; }

        .sidebar-footer {
          margin-top: auto;
          padding: 16px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .user-card {
          display: flex; align-items: center; gap: 10px;
          padding: 10px; border-radius: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .user-avatar {
          width: 32px; height: 32px; border-radius: 8px;
          background: linear-gradient(135deg, #00e5a0, #0099ff);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 13px; color: #080c10; flex-shrink: 0;
        }
        .user-email { font-size: 11px; color: rgba(255,255,255,0.35); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .logout-btn {
          margin-top: 8px; width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 8px; border-radius: 8px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          font-size: 12px; color: rgba(255,255,255,0.3);
          cursor: pointer; transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .logout-btn:hover { border-color: rgba(239,68,68,0.3); color: #ef4444; background: rgba(239,68,68,0.05); }

        /* MAIN */
        .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

        /* TOPBAR */
        .topbar {
          height: 60px; flex-shrink: 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 28px;
          background: #080c10;
        }
        .topbar-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 16px; color: #fff; }
        .topbar-right { display: flex; align-items: center; gap: 12px; }
        .topbar-badge {
          display: flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 100px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          font-size: 11px; color: #f87171; font-weight: 500;
        }
        .topbar-badge.connected {
          background: rgba(0,229,160,0.08);
          border-color: rgba(0,229,160,0.2);
          color: #00e5a0;
        }
        .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

        /* CONTENT */
        .content { flex: 1; overflow-y: auto; padding: 28px; }

        /* CONNECT BANNER */
        .connect-banner {
          background: linear-gradient(135deg, rgba(0,229,160,0.06), rgba(0,153,255,0.04));
          border: 1px solid rgba(0,229,160,0.15);
          border-radius: 16px; padding: 24px 28px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 20px; margin-bottom: 28px; flex-wrap: wrap;
        }
        .connect-banner-left { display: flex; align-items: center; gap: 16px; }
        .connect-banner-icon {
          width: 48px; height: 48px; border-radius: 12px;
          background: #25d366;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; flex-shrink: 0;
        }
        .connect-banner-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; color: #fff; margin-bottom: 4px; }
        .connect-banner-sub { font-size: 13px; color: rgba(255,255,255,0.4); font-weight: 300; }
        .connect-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: #1877f2; color: #fff;
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 13px; padding: 11px 20px; border-radius: 10px;
          border: none; cursor: pointer; text-decoration: none;
          transition: opacity 0.2s, transform 0.15s; white-space: nowrap;
        }
        .connect-btn:hover { opacity: 0.88; transform: translateY(-1px); }

        /* STATS GRID */
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
        .stat-card {
          background: #0d1117;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px; padding: 20px;
          transition: border-color 0.2s;
        }
        .stat-card:hover { border-color: rgba(0,229,160,0.12); }
        .stat-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .stat-icon {
          width: 36px; height: 36px; border-radius: 9px;
          background: rgba(0,229,160,0.08);
          border: 1px solid rgba(0,229,160,0.12);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
        }
        .stat-label { font-size: 12px; color: rgba(255,255,255,0.35); font-weight: 400; }
        .stat-value {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 32px; letter-spacing: -1px; color: #fff; line-height: 1;
        }
        .stat-value span { color: #00e5a0; font-size: 18px; }
        .stat-empty { font-size: 11px; color: rgba(255,255,255,0.2); margin-top: 6px; }

        /* GRID 2 COL */
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .grid-3-1 { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }

        /* PANEL */
        .panel {
          background: #0d1117;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; overflow: hidden;
        }
        .panel-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .panel-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; color: #fff; }
        .panel-action {
          font-size: 12px; color: rgba(255,255,255,0.3);
          text-decoration: none; cursor: pointer;
          transition: color 0.15s; background: none; border: none;
        }
        .panel-action:hover { color: #00e5a0; }

        /* INBOX LIST */
        .inbox-empty {
          padding: 48px 20px; text-align: center;
        }
        .inbox-empty-icon { font-size: 36px; margin-bottom: 12px; }
        .inbox-empty-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; color: rgba(255,255,255,0.3); margin-bottom: 6px; }
        .inbox-empty-sub { font-size: 13px; color: rgba(255,255,255,0.15); font-weight: 300; }

        .msg-item {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 0.15s; cursor: pointer;
        }
        .msg-item:last-child { border-bottom: none; }
        .msg-item:hover { background: rgba(255,255,255,0.02); }
        .msg-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #00e5a0);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 13px; color: #fff; flex-shrink: 0;
        }
        .msg-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 3px; }
        .msg-preview { font-size: 12px; color: rgba(255,255,255,0.3); font-weight: 300; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px; }
        .msg-intent { display: inline-flex; align-items: center; margin-top: 5px; }
        .intent-chip { font-size: 10px; color: #00e5a0; background: rgba(0,229,160,0.08); border: 1px solid rgba(0,229,160,0.15); border-radius: 4px; padding: 2px 7px; }

        /* QUICK ACTIONS */
        .quick-actions { display: flex; flex-direction: column; gap: 10px; padding: 16px; }
        .quick-action {
          display: flex; align-items: center; gap: 12px;
          padding: 14px; border-radius: 10px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          cursor: pointer; transition: all 0.15s;
          text-align: left;
        }
        .quick-action:hover { border-color: rgba(0,229,160,0.2); background: rgba(0,229,160,0.03); }
        .qa-icon {
          width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-size: 16px;
        }
        .qa-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px; color: rgba(255,255,255,0.7); margin-bottom: 2px; }
        .qa-sub { font-size: 11px; color: rgba(255,255,255,0.25); font-weight: 300; }
        .qa-arrow { margin-left: auto; color: rgba(255,255,255,0.15); font-size: 14px; }

        /* SETUP CHECKLIST */
        .checklist { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
        .check-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px; border-radius: 10px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
        }
        .check-item.done { background: rgba(0,229,160,0.04); border-color: rgba(0,229,160,0.1); }
        .check-circle {
          width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
          border: 2px solid rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px;
        }
        .check-circle.done { background: #00e5a0; border-color: #00e5a0; color: #080c10; font-weight: 700; }
        .check-text { font-size: 13px; color: rgba(255,255,255,0.4); }
        .check-text.done { color: rgba(255,255,255,0.6); }

        /* RESPONSIVE */
        @media (max-width: 1100px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .grid-3-1 { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .sidebar { display: none; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .grid-2 { grid-template-columns: 1fr; }
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

          <div className="sidebar-section-label">Menu</div>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item${activeTab === item.id ? " active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span className="nav-item-label">{item.label}</span>
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
                {connected ? "WhatsApp Connected" : "WhatsApp Not Connected"}
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
                    <div className="stat-icon">{s.icon}</div>
                  </div>
                  <div className="stat-value">
                    {s.value}<span>{s.unit}</span>
                  </div>
                  <div className="stat-empty">Connect WhatsApp to see data</div>
                </div>
              ))}
            </div>

            {/* ROW: Inbox + Quick Actions */}
            <div className="grid-3-1" style={{marginBottom:"20px"}}>
              {/* RECENT MESSAGES */}
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

              {/* QUICK ACTIONS */}
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">Quick Actions</div>
                </div>
                <div className="quick-actions">
                  {[
                    { icon: "📣", bg: "rgba(0,229,160,0.08)", title: "New Campaign", sub: "Send a broadcast" },
                    { icon: "🤖", bg: "rgba(0,153,255,0.08)", title: "Create Automation", sub: "Build a workflow" },
                    { icon: "📋", bg: "rgba(245,158,11,0.08)", title: "Message Templates", sub: "Browse templates" },
                    { icon: "👥", bg: "rgba(124,58,237,0.08)", title: "Import Contacts", sub: "Upload a CSV" },
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
