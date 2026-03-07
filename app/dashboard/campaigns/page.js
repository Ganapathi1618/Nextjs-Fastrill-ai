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

const MOCK_CAMPAIGNS = [
  {
    id:1, name:"Diwali Offer — 30% Off Facials", status:"completed", goal:"Booking",
    segment:"All Customers", sentAt:"Oct 28, 2024",
    sent:500, delivered:487, opened:312, replied:68, booked:41, revenue:24600,
    followUpSent:180, followUpReplied:22,
    template:"Hi {{1}}, this Diwali get 30% off on all facials 🪔 Limited slots! Book now: {{2}}",
  },
  {
    id:2, name:"New Bridal Package Launch", status:"active", goal:"Awareness",
    segment:"Female Customers", sentAt:"Mar 5, 2026",
    sent:280, delivered:271, opened:198, replied:34, booked:18, revenue:144000,
    followUpSent:80, followUpReplied:9,
    template:"Hi {{1}}, we just launched our exclusive Bridal Package ✨ Starting at ₹8,000. Want to know more?",
  },
  {
    id:3, name:"Re-engage Inactive Customers", status:"active", goal:"Re-engagement",
    segment:"Inactive (60+ days)", sentAt:"Mar 6, 2026",
    sent:120, delivered:116, opened:44, replied:11, booked:5, revenue:3500,
    followUpSent:34, followUpReplied:4,
    template:"Hi {{1}}, we miss you! 😊 It's been a while. Come back this week and get ₹100 off on any service.",
  },
  {
    id:4, name:"Men's Haircut Weekend Special", status:"draft", goal:"Booking",
    segment:"Male Customers", sentAt:"—",
    sent:0, delivered:0, opened:0, replied:0, booked:0, revenue:0,
    followUpSent:0, followUpReplied:0,
    template:"Hi {{1}}, weekend special! Men's haircut at just ₹150 this Sat & Sun only ✂️ Book your slot!",
  },
]

const GOALS = ["Booking", "Awareness", "Re-engagement", "Upsell"]
const SEGMENTS = ["All Customers", "Female Customers", "Male Customers", "Inactive (60+ days)", "VIP Customers", "New Leads"]

export default function CampaignsPage() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [dark, setDark] = useState(true)
  const [view, setView] = useState("list") // list | create | detail
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS)

  // Builder state
  const [step, setStep] = useState(1)
  const [bName, setBName] = useState("")
  const [bGoal, setBGoal] = useState("Booking")
  const [bSegment, setBSegment] = useState("All Customers")
  const [bTemplate, setBTemplate] = useState("")
  const [bFollowUpEnabled, setBFollowUpEnabled] = useState(true)
  const [bFollowUpDays, setBFollowUpDays] = useState(2)
  const [bColdDays, setBColdDays] = useState(3)

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) router.push("/login")
      else setUserEmail(data.user.email || "")
    }
    init()
  }, [])

  const toggleTheme = () => { const n = !dark; setDark(n); localStorage.setItem("fastrill-theme", n?"dark":"light") }
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login") }

  const openDetail = (c) => { setSelectedCampaign(c); setView("detail") }
  const statusColor = (s) => ({active:"#00c47d", completed:"#0ea5e9", draft:"#6b7280", paused:"#f59e0b"}[s]||"#6b7280")
  const statusLabel = (s) => ({active:"● Live", completed:"✓ Completed", draft:"○ Draft", paused:"⏸ Paused"}[s]||s)
  const goalColor = (g) => ({Booking:"#00c47d", Awareness:"#0ea5e9", "Re-engagement":"#f59e0b", Upsell:"#7c3aed"}[g]||"#6b7280")

  const pct = (n, d) => d > 0 ? Math.round(n/d*100) : 0

  const t = dark ? {
    bg:"#0a0a0f", sidebar:"#0f0f17", border:"rgba(255,255,255,0.06)", card:"#0f0f17",
    cardBorder:"rgba(255,255,255,0.07)", text:"#e8e8f0", textMuted:"rgba(255,255,255,0.4)",
    textFaint:"rgba(255,255,255,0.2)", navActive:"rgba(0,196,125,0.1)",
    navActiveBorder:"rgba(0,196,125,0.2)", navActiveText:"#00c47d",
    navText:"rgba(255,255,255,0.45)", inputBg:"rgba(255,255,255,0.04)",
    chipBg:"rgba(255,255,255,0.02)", chipBorder:"rgba(255,255,255,0.05)",
  } : {
    bg:"#f4f5f7", sidebar:"#ffffff", border:"rgba(0,0,0,0.07)", card:"#ffffff",
    cardBorder:"rgba(0,0,0,0.08)", text:"#111827", textMuted:"rgba(0,0,0,0.45)",
    textFaint:"rgba(0,0,0,0.25)", navActive:"rgba(0,180,115,0.08)",
    navActiveBorder:"rgba(0,180,115,0.2)", navActiveText:"#00935a",
    navText:"rgba(0,0,0,0.45)", inputBg:"rgba(0,0,0,0.03)",
    chipBg:"rgba(0,0,0,0.02)", chipBorder:"rgba(0,0,0,0.05)",
  }
  const accent = dark ? "#00c47d" : "#00935a"
  const userInitial = userEmail ? userEmail[0].toUpperCase() : "G"
  const inp = {background:t.inputBg,border:`1px solid ${t.cardBorder}`,borderRadius:9,padding:"9px 12px",fontSize:13,color:t.text,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none",width:"100%"}

  const totalRevenue = campaigns.reduce((s,c)=>s+c.revenue,0)
  const activeCampaigns = campaigns.filter(c=>c.status==="active").length
  const totalBooked = campaigns.reduce((s,c)=>s+c.booked,0)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${t.bg}!important;color:${t.text}!important;font-family:'Plus Jakarta Sans',sans-serif!important;}
        .root{display:flex;height:100vh;overflow:hidden;background:${t.bg};}
        .sidebar{width:224px;flex-shrink:0;background:${t.sidebar};border-right:1px solid ${t.border};display:flex;flex-direction:column;overflow-y:auto;}
        .logo{padding:22px 20px 18px;font-weight:800;font-size:20px;color:${t.text};text-decoration:none;display:block;border-bottom:1px solid ${t.border};font-family:'Plus Jakarta Sans',sans-serif;}
        .logo span{color:${accent};}
        .nav-section{padding:18px 16px 7px;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${t.textFaint};font-weight:600;}
        .nav-item{display:flex;align-items:center;gap:9px;padding:9px 12px;margin:1px 8px;border-radius:8px;cursor:pointer;font-size:13.5px;color:${t.navText};font-weight:500;transition:all 0.13s;border:1px solid transparent;background:none;width:calc(100% - 16px);text-align:left;font-family:'Plus Jakarta Sans',sans-serif;}
        .nav-item:hover{background:${t.inputBg};color:${t.text};}
        .nav-item.active{background:${t.navActive};color:${t.navActiveText};font-weight:600;border-color:${t.navActiveBorder};}
        .nav-icon{font-size:13px;width:18px;text-align:center;flex-shrink:0;}
        .sidebar-footer{margin-top:auto;padding:14px;border-top:1px solid ${t.border};}
        .user-card{display:flex;align-items:center;gap:9px;padding:9px;border-radius:9px;background:${t.inputBg};border:1px solid ${t.cardBorder};}
        .user-avatar{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,${accent},#0ea5e9);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#fff;flex-shrink:0;}
        .user-email{font-size:11.5px;color:${t.textMuted};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .logout-btn{margin-top:7px;width:100%;padding:7px;border-radius:7px;background:transparent;border:1px solid ${t.cardBorder};font-size:12px;color:${t.textMuted};cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.12s;}
        .logout-btn:hover{border-color:#fca5a5;color:#ef4444;}
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .topbar{height:54px;flex-shrink:0;border-bottom:1px solid ${t.border};display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:${t.sidebar};}
        .topbar-left{display:flex;align-items:center;gap:12px;}
        .topbar-title{font-weight:700;font-size:15px;color:${t.text};}
        .topbar-right{display:flex;align-items:center;gap:10px;}
        .theme-btn{display:flex;align-items:center;gap:7px;padding:5px 11px;border-radius:8px;background:${t.inputBg};border:1px solid ${t.cardBorder};cursor:pointer;font-size:12px;color:${t.textMuted};font-family:'Plus Jakarta Sans',sans-serif;font-weight:500;}
        .pill{width:32px;height:18px;border-radius:100px;background:${dark?accent:"#d1d5db"};position:relative;transition:background 0.2s;flex-shrink:0;}
        .pill::after{content:'';position:absolute;top:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:left 0.2s;left:${dark?"16px":"2px"};}
        .new-btn{display:inline-flex;align-items:center;gap:7px;padding:8px 18px;border-radius:9px;background:${accent};border:none;color:#000;font-weight:700;font-size:12.5px;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.15s;}
        .new-btn:hover{transform:translateY(-1px);box-shadow:0 4px 14px ${accent}44;}
        .back-btn{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;background:${t.inputBg};border:1px solid ${t.cardBorder};color:${t.textMuted};font-size:12.5px;font-weight:500;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .content{flex:1;overflow-y:auto;padding:20px 24px;background:${t.bg};}
        .content::-webkit-scrollbar{width:4px;}
        .content::-webkit-scrollbar-thumb{background:${t.border};border-radius:2px;}

        /* Stats row */
        .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;}
        .stat-card{background:${t.card};border:1px solid ${t.cardBorder};border-radius:12px;padding:16px 18px;}
        .stat-label{font-size:11px;color:${t.textMuted};font-weight:500;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.8px;}
        .stat-value{font-weight:800;font-size:26px;letter-spacing:-0.5px;line-height:1;}
        .stat-sub{font-size:11px;color:${t.textFaint};margin-top:3px;}

        /* Campaign list */
        .section-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
        .section-title{font-weight:700;font-size:14px;color:${t.text};}
        .filter-row{display:flex;gap:4px;}
        .ftab{padding:4px 11px;border-radius:6px;font-size:11.5px;font-weight:600;cursor:pointer;border:1px solid ${t.cardBorder};background:transparent;color:${t.textMuted};transition:all 0.12s;font-family:'Plus Jakarta Sans',sans-serif;}
        .ftab.active{background:${accent}15;border-color:${accent}40;color:${accent};}

        .camp-card{background:${t.card};border:1px solid ${t.cardBorder};border-radius:13px;padding:18px 20px;margin-bottom:10px;cursor:pointer;transition:all 0.15s;}
        .camp-card:hover{border-color:${accent}33;transform:translateY(-1px);}
        .camp-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;}
        .camp-left{flex:1;}
        .camp-name{font-weight:700;font-size:14px;color:${t.text};margin-bottom:5px;}
        .camp-meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
        .camp-pill{display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border-radius:100px;font-size:10.5px;font-weight:600;}
        .camp-status{font-size:11.5px;font-weight:700;}
        .camp-date{font-size:11px;color:${t.textFaint};}

        /* Funnel bar */
        .funnel-row{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;}
        .funnel-item{text-align:center;}
        .funnel-label{font-size:10px;color:${t.textFaint};font-weight:500;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.7px;}
        .funnel-bar-wrap{height:4px;background:${t.inputBg};border-radius:100px;margin-bottom:4px;overflow:hidden;}
        .funnel-bar-fill{height:100%;border-radius:100px;transition:width 0.5s ease;}
        .funnel-val{font-weight:700;font-size:14px;}
        .funnel-pct{font-size:10px;color:${t.textFaint};}
        .funnel-rev{font-weight:800;font-size:16px;}

        /* Revenue highlight */
        .rev-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:8px;background:${accent}10;border:1px solid ${accent}22;color:${accent};font-size:13px;font-weight:700;}

        /* Campaign Detail */
        .detail-wrap{max-width:820px;}
        .detail-hero{background:${t.card};border:1px solid ${t.cardBorder};border-radius:14px;padding:22px 24px;margin-bottom:16px;}
        .detail-title{font-weight:800;font-size:20px;color:${t.text};margin-bottom:10px;letter-spacing:-0.3px;}
        .detail-meta-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px;}
        .detail-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
        .dkpi{background:${t.chipBg};border:1px solid ${t.chipBorder};border-radius:10px;padding:14px;}
        .dkpi-val{font-weight:800;font-size:24px;color:${t.text};letter-spacing:-0.5px;}
        .dkpi-label{font-size:11px;color:${t.textMuted};margin-top:2px;}
        .funnel-card{background:${t.card};border:1px solid ${t.cardBorder};border-radius:14px;padding:22px 24px;margin-bottom:16px;}
        .funnel-big{display:flex;align-items:flex-end;gap:0;height:100px;margin:16px 0;}
        .fstage{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;position:relative;}
        .fstage-bar{width:80%;border-radius:5px 5px 0 0;transition:height 0.5s ease;}
        .fstage-label{font-size:10px;color:${t.textFaint};text-align:center;font-weight:500;text-transform:uppercase;letter-spacing:0.7px;}
        .fstage-val{font-weight:700;font-size:14px;}
        .fstage-pct{font-size:10px;color:${t.textFaint};}
        .farrow{font-size:18px;color:${t.textFaint};margin-bottom:34px;flex-shrink:0;}
        .followup-card{background:${t.card};border:1px solid ${t.cardBorder};border-radius:14px;padding:22px 24px;margin-bottom:16px;}
        .fu-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px;}
        .fu-box{background:${t.chipBg};border:1px solid ${t.chipBorder};border-radius:10px;padding:14px;}
        .fu-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:${t.textFaint};margin-bottom:8px;}
        .fu-stat{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;}
        .fu-label{font-size:12px;color:${t.textMuted};}
        .fu-val{font-size:12px;font-weight:700;color:${t.text};}
        .template-card{background:${t.card};border:1px solid ${t.cardBorder};border-radius:14px;padding:22px 24px;margin-bottom:16px;}
        .tmpl-bubble{background:${accent}0d;border:1px solid ${accent}20;border-radius:12px;border-bottom-left-radius:3px;padding:12px 16px;font-size:13px;color:${t.text};line-height:1.6;max-width:380px;margin-top:12px;}

        /* Campaign Builder */
        .builder-wrap{max-width:680px;}
        .step-row{display:flex;align-items:center;gap:0;margin-bottom:24px;}
        .step-item{display:flex;align-items:center;gap:8px;}
        .step-dot{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;transition:all 0.2s;}
        .step-dot.done{background:${accent};color:#000;}
        .step-dot.active{background:${accent}20;border:2px solid ${accent};color:${accent};}
        .step-dot.todo{background:${t.inputBg};border:1px solid ${t.cardBorder};color:${t.textFaint};}
        .step-name{font-size:12px;font-weight:600;}
        .step-name.active{color:${t.text};}
        .step-name.todo{color:${t.textFaint};}
        .step-line{flex:1;height:1px;background:${t.border};margin:0 8px;}
        .builder-card{background:${t.card};border:1px solid ${t.cardBorder};border-radius:14px;padding:24px;margin-bottom:16px;}
        .bc-title{font-weight:700;font-size:15px;color:${t.text};margin-bottom:4px;}
        .bc-sub{font-size:12.5px;color:${t.textMuted};margin-bottom:20px;}
        .field-label{font-size:11.5px;font-weight:600;color:${t.textMuted};margin-bottom:5px;display:block;}
        .field-wrap{margin-bottom:14px;}
        .goal-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin-bottom:14px;}
        .goal-card{padding:12px 14px;border-radius:10px;border:1px solid ${t.cardBorder};background:${t.inputBg};cursor:pointer;transition:all 0.13s;}
        .goal-card.active{background:${accent}10;border-color:${accent}33;}
        .goal-name{font-weight:700;font-size:13px;color:${t.text};margin-bottom:2px;}
        .goal-sub{font-size:11px;color:${t.textMuted};}
        .seg-grid{display:flex;flex-wrap:wrap;gap:7px;}
        .seg-btn{padding:6px 14px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid ${t.cardBorder};background:${t.inputBg};color:${t.textMuted};transition:all 0.13s;font-family:'Plus Jakarta Sans',sans-serif;}
        .seg-btn.active{background:${accent}12;border-color:${accent}33;color:${accent};}
        .fu-toggle-row{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-radius:10px;background:${t.inputBg};border:1px solid ${t.cardBorder};margin-bottom:12px;}
        .fu-tog-label{font-size:13px;font-weight:600;color:${t.text};}
        .fu-tog-sub{font-size:11px;color:${t.textMuted};}
        .toggle-btn{width:40px;height:22px;border-radius:100px;border:none;cursor:pointer;position:relative;flex-shrink:0;transition:background 0.2s;}
        .toggle-btn.on{background:${accent};}
        .toggle-btn.off{background:${dark?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.12)"};}
        .toggle-btn::after{content:'';position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left 0.2s;}
        .toggle-btn.on::after{left:21px;}
        .toggle-btn.off::after{left:3px;}
        .days-input-row{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:9px;background:${t.chipBg};border:1px solid ${t.chipBorder};margin-bottom:8px;}
        .days-lbl{font-size:12.5px;color:${t.textMuted};flex:1;}
        .days-num{display:flex;align-items:center;gap:0;border:1px solid ${t.cardBorder};border-radius:7px;overflow:hidden;}
        .days-btn{width:28px;height:28px;background:${t.inputBg};border:none;color:${t.text};cursor:pointer;font-size:15px;font-weight:700;}
        .days-val{width:32px;text-align:center;font-weight:700;font-size:13px;color:${t.text};background:${t.chipBg};}
        .ai-note-box{display:flex;gap:10px;padding:12px 14px;border-radius:10px;background:rgba(124,58,237,0.06);border:1px solid rgba(124,58,237,0.15);margin-top:14px;}
        .ai-note-icon{font-size:16px;flex-shrink:0;}
        .ai-note-text{font-size:12px;color:${t.textMuted};line-height:1.55;}
        .btn-row{display:flex;gap:9px;justify-content:flex-end;margin-top:6px;}
        .sec-btn{padding:9px 20px;border-radius:9px;background:${t.inputBg};border:1px solid ${t.cardBorder};color:${t.textMuted};font-size:13px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .pri-btn{padding:9px 22px;border-radius:9px;background:${accent};border:none;color:#000;font-size:13px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.15s;}
        .pri-btn:hover{transform:translateY(-1px);}
        .preview-box{background:${dark?"#0d1117":"#f0fdf4"};border:1px solid ${accent}22;border-radius:12px;padding:16px;margin-top:14px;}
        .preview-title{font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${t.textFaint};font-weight:600;margin-bottom:10px;}
        .preview-msg{background:${accent}0d;border:1px solid ${accent}20;border-radius:12px;border-bottom-left-radius:3px;padding:10px 14px;font-size:12.5px;color:${t.text};line-height:1.6;max-width:320px;}
        @media(max-width:768px){.sidebar{display:none;}}
      `}</style>

      <div className="root">
        <aside className="sidebar">
          <a href="/dashboard" className="logo">fast<span>rill</span></a>
          <div className="nav-section">Platform</div>
          {NAV.map(item => (
            <button key={item.id} className={`nav-item${item.id==="campaigns"?" active":""}`} onClick={() => router.push(item.path)}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
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
            <div className="topbar-left">
              {view !== "list" && (
                <button className="back-btn" onClick={() => { setView("list"); setStep(1) }}>← Back</button>
              )}
              <div className="topbar-title">
                {view==="list" ? "Revenue Campaigns" : view==="create" ? "New Campaign" : selectedCampaign?.name}
              </div>
            </div>
            <div className="topbar-right">
              <button className="theme-btn" onClick={toggleTheme}>
                <span>{dark?"🌙":"☀️"}</span><div className="pill"/><span>{dark?"Dark":"Light"}</span>
              </button>
              {view==="list" && (
                <button className="new-btn" onClick={() => { setView("create"); setStep(1) }}>
                  ◆ New Campaign
                </button>
              )}
            </div>
          </div>

          <div className="content">

            {/* ─── LIST VIEW ─── */}
            {view==="list" && (
              <>
                {/* Summary stats */}
                <div className="stats-row">
                  {[
                    {label:"Total Campaign Revenue", value:`₹${totalRevenue.toLocaleString()}`, sub:"across all campaigns", color:accent},
                    {label:"Active Campaigns", value:activeCampaigns, sub:"sending now", color:"#0ea5e9"},
                    {label:"Bookings Generated", value:totalBooked, sub:"via campaigns", color:"#7c3aed"},
                    {label:"Avg Open Rate", value:`${pct(campaigns.reduce((s,c)=>s+c.opened,0), campaigns.reduce((s,c)=>s+c.delivered,0))}%`, sub:"across all campaigns", color:"#f59e0b"},
                  ].map(s => (
                    <div key={s.label} className="stat-card">
                      <div className="stat-label">{s.label}</div>
                      <div className="stat-value" style={{color:s.color}}>{s.value}</div>
                      <div className="stat-sub">{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Campaigns */}
                <div className="section-hdr">
                  <div className="section-title">All Campaigns</div>
                  <div className="filter-row">
                    {["All","Active","Completed","Draft"].map(f => (
                      <button key={f} className="ftab active" style={{background:f==="All"?`${accent}15`:"transparent",borderColor:f==="All"?`${accent}40`:t.cardBorder,color:f==="All"?accent:t.textMuted}}>{f}</button>
                    ))}
                  </div>
                </div>

                {campaigns.map(c => (
                  <div key={c.id} className="camp-card" onClick={()=>openDetail(c)}>
                    <div className="camp-top">
                      <div className="camp-left">
                        <div className="camp-name">{c.name}</div>
                        <div className="camp-meta">
                          <span className="camp-status" style={{color:statusColor(c.status)}}>{statusLabel(c.status)}</span>
                          <span className="camp-pill" style={{background:goalColor(c.goal)+"15",border:`1px solid ${goalColor(c.goal)}25`,color:goalColor(c.goal)}}>{c.goal}</span>
                          <span className="camp-pill" style={{background:t.inputBg,border:`1px solid ${t.cardBorder}`,color:t.textMuted}}>👥 {c.segment}</span>
                          <span className="camp-date">Sent {c.sentAt}</span>
                        </div>
                      </div>
                      {c.revenue > 0 && (
                        <div className="rev-badge">₹{c.revenue.toLocaleString()} revenue</div>
                      )}
                    </div>

                    {c.sent > 0 && (
                      <div className="funnel-row">
                        {[
                          {label:"Sent", val:c.sent, pct:100, color:"#6b7280"},
                          {label:"Delivered", val:c.delivered, pct:pct(c.delivered,c.sent), color:"#0ea5e9"},
                          {label:"Opened", val:c.opened, pct:pct(c.opened,c.sent), color:"#f59e0b"},
                          {label:"Replied", val:c.replied, pct:pct(c.replied,c.sent), color:"#7c3aed"},
                          {label:"Booked", val:c.booked, pct:pct(c.booked,c.sent), color:accent},
                          {label:"Revenue", val:`₹${c.revenue.toLocaleString()}`, pct:pct(c.booked,c.sent), color:accent, rev:true},
                        ].map(f => (
                          <div key={f.label} className="funnel-item">
                            <div className="funnel-label">{f.label}</div>
                            <div className="funnel-bar-wrap">
                              <div className="funnel-bar-fill" style={{width:`${f.pct}%`,background:f.color+"66"}}/>
                            </div>
                            <div className={f.rev?"funnel-rev":"funnel-val"} style={{color:f.color}}>{f.val}</div>
                            {!f.rev && <div className="funnel-pct">{f.pct}%</div>}
                          </div>
                        ))}
                      </div>
                    )}

                    {c.status === "draft" && (
                      <div style={{fontSize:12,color:t.textFaint,display:"flex",alignItems:"center",gap:6}}>
                        <span>○</span> Draft — click to continue building
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* ─── DETAIL VIEW ─── */}
            {view==="detail" && selectedCampaign && (
              <div className="detail-wrap">
                {/* Hero */}
                <div className="detail-hero">
                  <div className="detail-title">{selectedCampaign.name}</div>
                  <div className="detail-meta-row">
                    <span className="camp-status" style={{color:statusColor(selectedCampaign.status),fontSize:13,fontWeight:700}}>{statusLabel(selectedCampaign.status)}</span>
                    <span className="camp-pill" style={{background:goalColor(selectedCampaign.goal)+"15",border:`1px solid ${goalColor(selectedCampaign.goal)}25`,color:goalColor(selectedCampaign.goal),padding:"3px 10px",borderRadius:100,fontSize:12,fontWeight:600}}>{selectedCampaign.goal}</span>
                    <span style={{fontSize:12,color:t.textFaint}}>👥 {selectedCampaign.segment}</span>
                    <span style={{fontSize:12,color:t.textFaint}}>Sent {selectedCampaign.sentAt}</span>
                  </div>
                  <div className="detail-kpis">
                    {[
                      {label:"Revenue Generated", val:`₹${selectedCampaign.revenue.toLocaleString()}`, color:accent},
                      {label:"Bookings from Campaign", val:selectedCampaign.booked, color:"#7c3aed"},
                      {label:"Cost per Booking", val:selectedCampaign.booked>0?`₹${Math.round(selectedCampaign.revenue/selectedCampaign.booked).toLocaleString()} avg`:"—", color:"#0ea5e9"},
                    ].map(k => (
                      <div key={k.label} className="dkpi">
                        <div className="dkpi-val" style={{color:k.color}}>{k.val}</div>
                        <div className="dkpi-label">{k.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Funnel */}
                <div className="funnel-card">
                  <div className="section-title">Campaign Funnel</div>
                  <div style={{fontSize:12,color:t.textMuted,marginTop:3}}>From send → to revenue — every step tracked</div>
                  <div className="funnel-big">
                    {[
                      {label:"Sent", val:selectedCampaign.sent, pct:100, color:"#6b7280"},
                      {label:"Delivered", val:selectedCampaign.delivered, pct:pct(selectedCampaign.delivered,selectedCampaign.sent), color:"#0ea5e9"},
                      {label:"Opened", val:selectedCampaign.opened, pct:pct(selectedCampaign.opened,selectedCampaign.sent), color:"#f59e0b"},
                      {label:"Replied", val:selectedCampaign.replied, pct:pct(selectedCampaign.replied,selectedCampaign.sent), color:"#7c3aed"},
                      {label:"Booked", val:selectedCampaign.booked, pct:pct(selectedCampaign.booked,selectedCampaign.sent), color:accent},
                    ].map((f, i, arr) => (
                      <>
                        <div key={f.label} className="fstage">
                          <div className="fstage-bar" style={{height:`${f.pct}px`,background:f.color+"30",border:`1px solid ${f.color}50`,minHeight:8}}/>
                          <div className="fstage-val" style={{color:f.color}}>{f.val}</div>
                          <div className="fstage-pct">{f.pct}%</div>
                          <div className="fstage-label">{f.label}</div>
                        </div>
                        {i < arr.length-1 && <div className="farrow">›</div>}
                      </>
                    ))}
                  </div>

                  {/* Revenue callout */}
                  <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:10,background:`${accent}08`,border:`1px solid ${accent}20`,marginTop:4}}>
                    <div style={{fontSize:28,fontWeight:800,color:accent}}>₹{selectedCampaign.revenue.toLocaleString()}</div>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:t.text}}>Revenue Generated</div>
                      <div style={{fontSize:11.5,color:t.textMuted}}>{selectedCampaign.booked} bookings × avg ₹{selectedCampaign.booked>0?Math.round(selectedCampaign.revenue/selectedCampaign.booked).toLocaleString():"—"} per booking</div>
                    </div>
                  </div>
                </div>

                {/* Smart Follow-ups */}
                <div className="followup-card">
                  <div className="section-title">◆ Smart Follow-ups</div>
                  <div style={{fontSize:12,color:t.textMuted,marginTop:3}}>AI automatically followed up with non-responders</div>
                  <div className="fu-row">
                    <div className="fu-box">
                      <div className="fu-title">🔥 Warm Follow-up</div>
                      <div style={{fontSize:11.5,color:t.textFaint,marginBottom:10}}>Opened but didn't reply · Sent after 2 days</div>
                      {[
                        {label:"Targeted", val:selectedCampaign.opened - selectedCampaign.replied},
                        {label:"Follow-up Sent", val:selectedCampaign.followUpSent},
                        {label:"Replied", val:selectedCampaign.followUpReplied},
                        {label:"Reply Rate", val:`${pct(selectedCampaign.followUpReplied,selectedCampaign.followUpSent)}%`},
                      ].map(r => (
                        <div key={r.label} className="fu-stat">
                          <span className="fu-label">{r.label}</span>
                          <span className="fu-val">{r.val}</span>
                        </div>
                      ))}
                    </div>
                    <div className="fu-box">
                      <div className="fu-title">❄️ Cold Re-engage</div>
                      <div style={{fontSize:11.5,color:t.textFaint,marginBottom:10}}>Didn't open · Sent after 3 days</div>
                      {[
                        {label:"Targeted", val:selectedCampaign.sent - selectedCampaign.opened},
                        {label:"Resent", val:Math.round((selectedCampaign.sent - selectedCampaign.opened)*0.6)},
                        {label:"Opened", val:Math.round((selectedCampaign.sent - selectedCampaign.opened)*0.12)},
                        {label:"Open Rate", val:"12%"},
                      ].map(r => (
                        <div key={r.label} className="fu-stat">
                          <span className="fu-label">{r.label}</span>
                          <span className="fu-val">{r.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Template */}
                <div className="template-card">
                  <div className="section-title">Message Template</div>
                  <div style={{fontSize:12,color:t.textMuted,marginTop:3}}>Approved WhatsApp template used in this campaign</div>
                  <div className="tmpl-bubble">{selectedCampaign.template}</div>
                </div>

                {selectedCampaign.status === "active" && (
                  <div style={{display:"flex",gap:10}}>
                    <button style={{padding:"10px 20px",borderRadius:9,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",color:"#ef4444",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>⏸ Pause Campaign</button>
                    <button style={{padding:"10px 20px",borderRadius:9,background:`${accent}10`,border:`1px solid ${accent}25`,color:accent,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>⟳ Duplicate Campaign</button>
                  </div>
                )}
              </div>
            )}

            {/* ─── CREATE VIEW ─── */}
            {view==="create" && (
              <div className="builder-wrap">
                {/* Steps */}
                <div className="step-row">
                  {[{n:1,label:"Setup"},{n:2,label:"Template"},{n:3,label:"Follow-up"}].map((s,i,arr) => (
                    <>
                      <div key={s.n} className="step-item">
                        <div className={`step-dot ${step>s.n?"done":step===s.n?"active":"todo"}`}>
                          {step>s.n?"✓":s.n}
                        </div>
                        <div className={`step-name ${step===s.n?"active":"todo"}`}>{s.label}</div>
                      </div>
                      {i < arr.length-1 && <div key={`l${i}`} className="step-line"/>}
                    </>
                  ))}
                </div>

                {/* Step 1: Setup */}
                {step===1 && (
                  <div className="builder-card">
                    <div className="bc-title">Campaign Setup</div>
                    <div className="bc-sub">Name your campaign and choose your goal</div>

                    <div className="field-wrap">
                      <label className="field-label">Campaign Name</label>
                      <input style={inp} value={bName} onChange={e=>setBName(e.target.value)} placeholder="e.g. Diwali Special — 30% Off Facials"/>
                    </div>

                    <div className="field-wrap">
                      <label className="field-label">Campaign Goal</label>
                      <div className="goal-grid">
                        {[
                          {id:"Booking",sub:"Drive appointment bookings"},
                          {id:"Awareness",sub:"Announce new services or offers"},
                          {id:"Re-engagement",sub:"Bring back inactive customers"},
                          {id:"Upsell",sub:"Sell premium services to existing customers"},
                        ].map(g => (
                          <div key={g.id} className={`goal-card${bGoal===g.id?" active":""}`} onClick={()=>setBGoal(g.id)}>
                            <div className="goal-name" style={{color:bGoal===g.id?goalColor(g.id):t.text}}>{g.id}</div>
                            <div className="goal-sub">{g.sub}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="field-wrap">
                      <label className="field-label">Target Segment</label>
                      <div className="seg-grid">
                        {SEGMENTS.map(s => (
                          <button key={s} className={`seg-btn${bSegment===s?" active":""}`} onClick={()=>setBSegment(s)}>{s}</button>
                        ))}
                      </div>
                    </div>

                    <div className="btn-row">
                      <button className="pri-btn" onClick={()=>setStep(2)} disabled={!bName}>Next →</button>
                    </div>
                  </div>
                )}

                {/* Step 2: Template */}
                {step===2 && (
                  <div className="builder-card">
                    <div className="bc-title">Message Template</div>
                    <div className="bc-sub">Write your WhatsApp message. Use {"{{1}}"} for customer name, {"{{2}}"} for booking link.</div>

                    <div className="field-wrap">
                      <label className="field-label">Message</label>
                      <textarea style={{...inp,resize:"vertical",minHeight:100,lineHeight:1.6}} value={bTemplate} onChange={e=>setBTemplate(e.target.value)} placeholder={`Hi {{1}}, ${bGoal==="Booking"?"we have a special offer for you this week! Book your appointment:":`exciting news from our salon!`} {{2}}`}/>
                    </div>

                    {bTemplate && (
                      <div className="preview-box">
                        <div className="preview-title">Preview — how it will look</div>
                        <div className="preview-msg">
                          {bTemplate.replace("{{1}}", "Priya").replace("{{2}}", "fastrill.com/book")}
                        </div>
                      </div>
                    )}

                    <div className="ai-note-box">
                      <div className="ai-note-icon">⬡</div>
                      <div className="ai-note-text">
                        <strong style={{color:"#a78bfa"}}>AI follow-up note:</strong> When customers reply to this campaign, Fastrill AI will automatically continue the conversation and guide them toward a booking — no manual handling needed.
                      </div>
                    </div>

                    <div className="btn-row">
                      <button className="sec-btn" onClick={()=>setStep(1)}>← Back</button>
                      <button className="pri-btn" onClick={()=>setStep(3)} disabled={!bTemplate}>Next →</button>
                    </div>
                  </div>
                )}

                {/* Step 3: Follow-up */}
                {step===3 && (
                  <div className="builder-card">
                    <div className="bc-title">Smart Follow-up Rules</div>
                    <div className="bc-sub">Fastrill AI automatically follows up based on how customers respond</div>

                    <div className="fu-toggle-row">
                      <div>
                        <div className="fu-tog-label">Enable Smart Follow-ups</div>
                        <div className="fu-tog-sub">AI will re-engage non-responders automatically</div>
                      </div>
                      <button className={`toggle-btn ${bFollowUpEnabled?"on":"off"}`} onClick={()=>setBFollowUpEnabled(p=>!p)}/>
                    </div>

                    {bFollowUpEnabled && (
                      <>
                        <div className="days-input-row">
                          <div>
                            <div style={{fontSize:13,fontWeight:600,color:t.text}}>🔥 Warm Follow-up</div>
                            <div style={{fontSize:11.5,color:t.textMuted}}>For customers who opened but didn't reply</div>
                          </div>
                          <div className="days-num">
                            <button className="days-btn" onClick={()=>setBFollowUpDays(p=>Math.max(1,p-1))}>−</button>
                            <div className="days-val">{bFollowUpDays}</div>
                            <button className="days-btn" onClick={()=>setBFollowUpDays(p=>Math.min(7,p+1))}>+</button>
                          </div>
                          <div style={{fontSize:12,color:t.textFaint,minWidth:36}}>days</div>
                        </div>

                        <div className="days-input-row">
                          <div>
                            <div style={{fontSize:13,fontWeight:600,color:t.text}}>❄️ Cold Re-engage</div>
                            <div style={{fontSize:11.5,color:t.textMuted}}>For customers who didn't open at all</div>
                          </div>
                          <div className="days-num">
                            <button className="days-btn" onClick={()=>setBColdDays(p=>Math.max(1,p-1))}>−</button>
                            <div className="days-val">{bColdDays}</div>
                            <button className="days-btn" onClick={()=>setBColdDays(p=>Math.min(10,p+1))}>+</button>
                          </div>
                          <div style={{fontSize:12,color:t.textFaint,minWidth:36}}>days</div>
                        </div>

                        <div className="ai-note-box">
                          <div className="ai-note-icon">⬡</div>
                          <div className="ai-note-text">
                            AI generates a <strong style={{color:"#a78bfa"}}>different follow-up message</strong> based on the original campaign context — not the same message again. Warm leads get a gentle nudge; cold leads get a fresh angle.
                          </div>
                        </div>
                      </>
                    )}

                    <div className="btn-row" style={{marginTop:18}}>
                      <button className="sec-btn" onClick={()=>setStep(2)}>← Back</button>
                      <button className="pri-btn" onClick={()=>{
                        const newC = {
                          id: Date.now(), name:bName, status:"draft", goal:bGoal,
                          segment:bSegment, sentAt:"—",
                          sent:0,delivered:0,opened:0,replied:0,booked:0,revenue:0,
                          followUpSent:0,followUpReplied:0,
                          template:bTemplate,
                        }
                        setCampaigns(p=>[newC,...p])
                        setView("list"); setStep(1); setBName(""); setBTemplate("")
                      }}>Save as Draft</button>
                      <button className="pri-btn" style={{background:"#1877f2",color:"#fff"}} onClick={()=>{
                        const newC = {
                          id: Date.now(), name:bName, status:"active", goal:bGoal,
                          segment:bSegment, sentAt:"Now",
                          sent:0,delivered:0,opened:0,replied:0,booked:0,revenue:0,
                          followUpSent:0,followUpReplied:0,
                          template:bTemplate,
                        }
                        setCampaigns(p=>[newC,...p])
                        setView("list"); setStep(1); setBName(""); setBTemplate("")
                      }}>🚀 Launch Campaign</button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}
