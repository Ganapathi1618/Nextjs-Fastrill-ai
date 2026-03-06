"use client"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useTheme } from "@/lib/ThemeContext"

const navItems = [
  { id: "overview", label: "Revenue Engine", icon: "◈", path: "/dashboard" },
  { id: "inbox", label: "Conversations", icon: "◎", path: "/dashboard/conversations" },
  { id: "bookings", label: "Bookings", icon: "◷", path: "/dashboard/bookings" },
  { id: "campaigns", label: "Campaigns", icon: "◆", path: "/dashboard/campaigns" },
  { id: "leads", label: "Lead Recovery", icon: "◉", path: "/dashboard/leads" },
  { id: "contacts", label: "Customers", icon: "◑", path: "/dashboard/contacts" },
  { id: "analytics", label: "Analytics", icon: "◫", path: "/dashboard/analytics" },
  { id: "settings", label: "Settings", icon: "◌", path: "/dashboard/settings" },
]

export default function DashboardLayout({ children, activePage, topbar }) {
  const router = useRouter()
  const { darkMode, toggleTheme, t, accent } = useTheme()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const userInitial = "G" // can be passed as prop later

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: ${t.bg} !important; color: ${t.text} !important; font-family: 'Plus Jakarta Sans', sans-serif !important; }

        .layout-root { display: flex; height: 100vh; overflow: hidden; background: ${t.bg}; }

        /* SIDEBAR */
        .sidebar { width: 224px; flex-shrink: 0; background: ${t.sidebar}; border-right: 1px solid ${t.border}; display: flex; flex-direction: column; overflow-y: auto; }
        .sidebar-logo { padding: 22px 20px 18px; font-weight: 800; font-size: 20px; color: ${t.text}; text-decoration: none; display: block; border-bottom: 1px solid ${t.border}; font-family: 'Plus Jakarta Sans', sans-serif; }
        .sidebar-logo span { color: ${accent}; }
        .sidebar-section { padding: 18px 16px 7px; font-size: 10px; letter-spacing: 1.2px; text-transform: uppercase; color: ${t.textFaint}; font-weight: 600; }
        .nav-item { display: flex; align-items: center; gap: 9px; padding: 9px 12px; margin: 1px 8px; border-radius: 8px; cursor: pointer; font-size: 13.5px; color: ${t.navText}; font-weight: 500; transition: all 0.13s; border: 1px solid transparent; background: none; width: calc(100% - 16px); text-align: left; font-family: 'Plus Jakarta Sans', sans-serif; }
        .nav-item:hover { background: ${t.inputBg}; color: ${t.text}; }
        .nav-item.active { background: ${t.navActive}; color: ${t.navActiveText}; font-weight: 600; border-color: ${t.navActiveBorder}; }
        .nav-icon { font-size: 13px; width: 18px; text-align: center; flex-shrink: 0; }
        .nav-badge { margin-left: auto; background: #f59e0b; color: #000; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 100px; }
        .sidebar-footer { margin-top: auto; padding: 14px; border-top: 1px solid ${t.border}; }
        .user-card { display: flex; align-items: center; gap: 9px; padding: 9px; border-radius: 9px; background: ${t.inputBg}; border: 1px solid ${t.cardBorder}; }
        .user-avatar { width: 30px; height: 30px; border-radius: 8px; background: linear-gradient(135deg, ${accent}, #0ea5e9); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; color: #fff; flex-shrink: 0; }
        .user-email { font-size: 11.5px; color: ${t.textMuted}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .logout-btn { margin-top: 7px; width: 100%; padding: 7px; border-radius: 7px; background: transparent; border: 1px solid ${t.cardBorder}; font-size: 12px; color: ${t.textMuted}; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.12s; }
        .logout-btn:hover { border-color: #fca5a5; color: #ef4444; }

        /* MAIN */
        .layout-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

        /* TOPBAR */
        .topbar { height: 54px; flex-shrink: 0; border-bottom: 1px solid ${t.border}; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; background: ${t.topbar}; }
        .topbar-left { display: flex; align-items: center; gap: 14px; }
        .topbar-title { font-weight: 700; font-size: 15px; color: ${t.text}; }
        .topbar-right { display: flex; align-items: center; gap: 10px; }

        /* THEME TOGGLE */
        .theme-toggle { display: flex; align-items: center; gap: 7px; padding: 5px 11px; border-radius: 8px; background: ${t.inputBg}; border: 1px solid ${t.cardBorder}; cursor: pointer; font-size: 12px; color: ${t.textMuted}; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500; transition: all 0.12s; }
        .theme-toggle:hover { color: ${t.text}; }
        .toggle-pill { width: 32px; height: 18px; border-radius: 100px; background: ${darkMode ? accent : "#d1d5db"}; position: relative; transition: background 0.2s; flex-shrink: 0; }
        .toggle-pill::after { content: ''; position: absolute; top: 2px; width: 14px; height: 14px; border-radius: 50%; background: #fff; transition: left 0.2s; left: ${darkMode ? "16px" : "2px"}; }

        .conn-badge { display: flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 100px; font-size: 11px; font-weight: 600; }

        @media (max-width: 768px) { .sidebar { display: none; } }
      `}</style>

      <div className="layout-root">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <a href="/dashboard" className="sidebar-logo">fast<span>rill</span></a>
          <div className="sidebar-section">Platform</div>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item${activePage === item.id ? " active" : ""}`}
              onClick={() => router.push(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          <div className="sidebar-footer">
            <div className="user-card">
              <div className="user-avatar">{userInitial}</div>
              <div className="user-email">Loading...</div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>↩ Sign out</button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="layout-main">
          {/* TOPBAR */}
          <div className="topbar">
            <div className="topbar-left">
              {topbar}
            </div>
            <div className="topbar-right">
              <button className="theme-toggle" onClick={toggleTheme}>
                <span>{darkMode ? "🌙" : "☀️"}</span>
                <div className="toggle-pill" />
                <span>{darkMode ? "Dark" : "Light"}</span>
              </button>
            </div>
          </div>

          {/* PAGE CONTENT */}
          {children}
        </div>
      </div>
    </>
  )
}
