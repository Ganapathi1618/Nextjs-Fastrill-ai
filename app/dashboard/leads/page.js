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

const LEADS = [
  { id:1, name:"Sneha Patel", phone:"+91 76543 21098", source:"Instagram", joinedAt:"Mar 1, 2026", daysAgo:7,
    context:"Asked about hair color pricing. Said she'd think about it.", lastMsg:"How much for global color?", aiScore:92,
    suggestedMsg:"Hi Sneha! 😊 Still thinking about the hair color? This week we have a special — global color starting ₹800. Want to book a slot? 💇‍♀️" },
  { id:2, name:"Kavya Reddy", phone:"+91 43210 98765", source:"Campaign", joinedAt:"Feb 20, 2026", daysAgo:16,
    context:"Replied to Diwali campaign, asked about facials. Never booked.", lastMsg:"What facials do you offer?", aiScore:85,
    suggestedMsg:"Hi Kavya! ✨ You'd asked about our facials earlier. We have a Gold Facial + Cleanup combo at ₹999 this week only. Shall I book you in?" },
  { id:3, name:"Ravi Kumar", phone:"+91 90876 54321", source:"Instagram", joinedAt:"Mar 6, 2026", daysAgo:2,
    context:"DM'd from Instagram about men's grooming packages.", lastMsg:"Do you have packages for men?", aiScore:78,
    suggestedMsg:"Hi Ravi! ✂️ Yes we do! Our Men's Grooming Package — haircut + beard + hair wash — is ₹299. Want me to book you this weekend?" },
  { id:4, name:"Ananya Singh", phone:"+91 11223 44556", source:"Referral", joinedAt:"Feb 10, 2026", daysAgo:26,
    context:"Referred by Priya Sharma. Was interested in bridal packages.", lastMsg:"My friend Priya suggested your salon", aiScore:95,
    suggestedMsg:"Hi Ananya! 💐 Priya told us you might be looking for bridal packages! We'd love to have you in for a trial. Shall we schedule a free consultation this week?" },
  { id:5, name:"Meenakshi Rao", phone:"+91 99887 76655", source:"WhatsApp", joinedAt:"Jan 28, 2026", daysAgo:39,
    context:"Asked about nail art, was comparing prices with another salon.", lastMsg:"Is nail art included in the package?", aiScore:61,
    suggestedMsg:"Hi Meenakshi! 💅 Coming back to your question on nail art — yes it's included in our Premium Manicure package (₹450). Only a few slots left this week!" },
  { id:6, name:"Deepak Nair", phone:"+91 88776 65544", source:"WhatsApp", joinedAt:"Mar 3, 2026", daysAgo:5,
    context:"Asked about appointment availability, then went silent.", lastMsg:"Are you open on Sundays?", aiScore:70,
    suggestedMsg:"Hi Deepak! Yes we're open Sundays 10AM–6PM 🗓️ Want me to check availability for this Sunday?" },
  { id:7, name:"Pooja Menon", phone:"+91 77665 54433", source:"Campaign", joinedAt:"Feb 25, 2026", daysAgo:11,
    context:"Clicked campaign link but never replied to follow-up.", lastMsg:"(opened campaign, no reply)", aiScore:55,
    suggestedMsg:"Hi Pooja! 👋 Noticed you checked out our offer earlier. We still have a few slots open this week — want to grab one before they fill up? 😊" },
]

const SOURCE_COLORS = {
  Instagram: { bg:"rgba(214,40,132,0.08)", border:"rgba(214,40,132,0.2)", text:"#d62884" },
  WhatsApp: { bg:"rgba(0,168,89,0.08)", border:"rgba(0,168,89,0.2)", text:"#00a859" },
  Referral: { bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.2)", text:"#f59e0b" },
  Campaign: { bg:"rgba(14,165,233,0.08)", border:"rgba(14,165,233,0.2)", text:"#0ea5e9" },
  Google: { bg:"rgba(66,133,244,0.08)", border:"rgba(66,133,244,0.2)", text:"#4285f4" },
}

export default function LeadRecoveryPage() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [dark, setDark] = useState(true)
  const [leads, setLeads] = useState(LEADS)
  const [selected, setSelected] = useState(null)
  const [sentIds, setSentIds] = useState([])
  const [dismissedIds, setDismissedIds] = useState([])
  const [editingMsg, setEditingMsg] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [filter, setFilter] = useState("all") // all | hot | warm | cold
  const [sendingId, setSendingId] = useState(null)

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

  useEffect(() => {
    if (selected) setEditingMsg(selected.suggestedMsg)
  }, [selected])

  const toggleTheme = () => { const n = !dark; setDark(n); localStorage.setItem("fastrill-theme", n?"dark":"light") }
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login") }

  const scoreLabel = (s) => s >= 85 ? "🔥 Hot" : s >= 65 ? "🌡 Warm" : "❄️ Cold"
  const scoreColor = (s) => s >= 85 ? "#ef4444" : s >= 65 ? "#f59e0b" : "#0ea5e9"

  const activeleads = leads.filter(l => !dismissedIds.includes(l.id))
  const filtered = activeleads.filter(l => {
    if (filter === "hot") return l.aiScore >= 85
    if (filter === "warm") return l.aiScore >= 65 && l.aiScore < 85
    if (filter === "cold") return l.aiScore < 65
    return true
  })

  const handleSend = (lead) => {
    setSendingId(lead.id)
    setTimeout(() => {
      setSentIds(p => [...p, lead.id])
      setSendingId(null)
      if (selected?.id === lead.id) setSelected(null)
    }, 1200)
  }

  const potentialRevenue = activeleads.length * 650

  const t = dark ? {
    bg:"#0a0a0f", sidebar:"#0f0f17", border:"rgba(255,255,255,0.06)", card:"#0f0f17",
    cardBorder:"rgba(255,255,255,0.07)", text:"#e8e8f0", textMuted:"rgba(255,255,255,0.4)",
    textFaint:"rgba(255,255,255,0.2)", navActive:"rgba(0,196,125,0.1)",
    navActiveBorder:"rgba(0,196,125,0.2)", navActiveText:"#00c47d",
    navText:"rgba(255,255,255,0.45)", inputBg:"rgba(255,255,255,0.04)",
    chipBg:"rgba(255,255,255,0.02)", chipBorder:"rgba(255,255,255,0.05)",
    rowHover:"rgba(255,255,255,0.025)",
  } : {
    bg:"#f4f5f7", sidebar:"#ffffff", border:"rgba(0,0,0,0.07)", card:"#ffffff",
    cardBorder:"rgba(0,0,0,0.08)", text:"#111827", textMuted:"rgba(0,0,0,0.45)",
    textFaint:"rgba(0,0,0,0.25)", navActive:"rgba(0,180,115,0.08)",
    navActiveBorder:"rgba(0,180,115,0.2)", navActiveText:"#00935a",
    navText:"rgba(0,0,0,0.45)", inputBg:"rgba(0,0,0,0.03)",
    chipBg:"rgba(0,0,0,0.02)", chipBorder:"rgba(0,0,0,0.05)",
    rowHover:"rgba(0,0,0,0.02)",
  }
  const accent = dark ? "#00c47d" : "#00935a"
  const userInitial = userEmail ? userEmail[0].toUpperCase() : "G"

  const avatarColor = (name) => {
    const colors = ["#00c47d","#0ea5e9","#7c3aed","#f59e0b","#ef4444","#10b981","#f97316"]
    return colors[name.charCodeAt(0) % colors.length]
  }

  const AvatarEl = ({ name, size = 38 }) => (
    <div style={{ width:size, height:size, borderRadius:10, background:`${avatarColor(name)}15`, border:`1.5px solid ${avatarColor(name)}30`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:size*0.36, color:avatarColor(name), flexShrink:0, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      {name.split(" ").map(w => w[0]).join("").slice(0, 2)}
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
        html,body { background:${t.bg}!important; color:${t.text}!important; font-family:'Plus Jakarta Sans',sans-serif!important; }
        .root { display:flex; height:100vh; overflow:hidden; background:${t.bg}; }
        .sidebar { width:224px; flex-shrink:0; background:${t.sidebar}; border-right:1px solid ${t.border}; display:flex; flex-direction:column; overflow-y:auto; }
        .logo { padding:22px 20px 18px; font-weight:800; font-size:20px; color:${t.text}; text-decoration:none; display:block; border-bottom:1px solid ${t.border}; }
        .logo span { color:${accent}; }
        .nav-section { padding:18px 16px 7px; font-size:10px; letter-spacing:1.2px; text-transform:uppercase; color:${t.textFaint}; font-weight:600; }
        .nav-item { display:flex; align-items:center; gap:9px; padding:9px 12px; margin:1px 8px; border-radius:8px; cursor:pointer; font-size:13.5px; color:${t.navText}; font-weight:500; transition:all 0.13s; border:1px solid transparent; background:none; width:calc(100% - 16px); text-align:left; font-family:'Plus Jakarta Sans',sans-serif; }
        .nav-item:hover { background:${t.inputBg}; color:${t.text}; }
        .nav-item.active { background:${t.navActive}; color:${t.navActiveText}; font-weight:600; border-color:${t.navActiveBorder}; }
        .nav-icon { font-size:13px; width:18px; text-align:center; flex-shrink:0; }
        .sidebar-footer { margin-top:auto; padding:14px; border-top:1px solid ${t.border}; }
        .user-card { display:flex; align-items:center; gap:9px; padding:9px; border-radius:9px; background:${t.inputBg}; border:1px solid ${t.cardBorder}; }
        .user-avatar { width:30px; height:30px; border-radius:8px; background:linear-gradient(135deg,${accent},#0ea5e9); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px; color:#fff; flex-shrink:0; }
        .user-email { font-size:11.5px; color:${t.textMuted}; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .logout-btn { margin-top:7px; width:100%; padding:7px; border-radius:7px; background:transparent; border:1px solid ${t.cardBorder}; font-size:12px; color:${t.textMuted}; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; }
        .logout-btn:hover { border-color:#fca5a5; color:#ef4444; }
        .main { flex:1; display:flex; flex-direction:column; overflow:hidden; }
        .topbar { height:54px; flex-shrink:0; border-bottom:1px solid ${t.border}; display:flex; align-items:center; justify-content:space-between; padding:0 24px; background:${t.sidebar}; }
        .topbar-title { font-weight:700; font-size:15px; color:${t.text}; }
        .topbar-right { display:flex; align-items:center; gap:9px; }
        .theme-btn { display:flex; align-items:center; gap:7px; padding:5px 11px; border-radius:8px; background:${t.inputBg}; border:1px solid ${t.cardBorder}; cursor:pointer; font-size:12px; color:${t.textMuted}; font-family:'Plus Jakarta Sans',sans-serif; font-weight:500; }
        .pill { width:32px; height:18px; border-radius:100px; background:${dark?accent:"#d1d5db"}; position:relative; flex-shrink:0; }
        .pill::after { content:''; position:absolute; top:2px; width:14px; height:14px; border-radius:50%; background:#fff; left:${dark?"16px":"2px"}; }
        .content { flex:1; display:flex; overflow:hidden; }

        /* Opportunity banner */
        .opp-banner { padding:14px 20px; background:linear-gradient(90deg,${accent}0d,rgba(14,165,233,0.04)); border-bottom:1px solid ${accent}18; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-shrink:0; }
        .opp-left { display:flex; align-items:center; gap:14px; }
        .opp-icon { width:38px; height:38px; border-radius:10px; background:${accent}15; border:1px solid ${accent}25; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
        .opp-title { font-weight:800; font-size:14px; color:${t.text}; }
        .opp-sub { font-size:12px; color:${t.textMuted}; margin-top:2px; }
        .opp-stat { text-align:center; }
        .opp-val { font-weight:800; font-size:20px; letter-spacing:-0.5px; }
        .opp-label { font-size:10.5px; color:${t.textMuted}; margin-top:1px; text-transform:uppercase; letter-spacing:0.7px; }

        /* Split layout */
        .list-col { width:420px; flex-shrink:0; border-right:1px solid ${t.border}; display:flex; flex-direction:column; overflow:hidden; }
        .detail-col { flex:1; overflow-y:auto; background:${t.bg}; }
        .detail-col::-webkit-scrollbar { width:4px; }
        .detail-col::-webkit-scrollbar-thumb { background:${t.border}; }

        /* Filters */
        .filter-bar { display:flex; gap:5px; padding:11px 14px; border-bottom:1px solid ${t.border}; background:${t.sidebar}; flex-shrink:0; }
        .ftab { display:flex; align-items:center; gap:5px; padding:5px 12px; border-radius:7px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid ${t.cardBorder}; background:transparent; color:${t.textMuted}; white-space:nowrap; transition:all 0.12s; font-family:'Plus Jakarta Sans',sans-serif; }
        .ftab.active { background:${accent}15; border-color:${accent}40; color:${accent}; }
        .ftab-n { font-size:10px; padding:1px 6px; border-radius:100px; background:${t.inputBg}; }
        .ftab.active .ftab-n { background:${accent}20; color:${accent}; }

        /* Lead list */
        .lead-list { flex:1; overflow-y:auto; }
        .lead-list::-webkit-scrollbar { width:4px; }
        .lead-list::-webkit-scrollbar-thumb { background:${t.border}; }
        .lead-row { display:flex; align-items:flex-start; gap:11px; padding:13px 14px; border-bottom:1px solid ${t.border}; cursor:pointer; transition:background 0.12s; position:relative; }
        .lead-row:hover { background:${t.rowHover}; }
        .lead-row.active { background:${accent}06; border-right:2px solid ${accent}; }
        .lead-row.sent { opacity:0.45; }
        .lead-info { flex:1; min-width:0; }
        .lead-name { font-weight:700; font-size:13.5px; color:${t.text}; }
        .lead-last { font-size:12px; color:${t.textMuted}; margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-style:italic; }
        .lead-meta { display:flex; align-items:center; gap:7px; margin-top:5px; }
        .src-tag { display:inline-flex; padding:1px 8px; border-radius:100px; font-size:10.5px; font-weight:600; }
        .days-tag { font-size:11px; color:${t.textFaint}; }
        .score-badge { display:flex; align-items:center; gap:4px; padding:3px 9px; border-radius:7px; font-size:11px; font-weight:700; flex-shrink:0; }
        .sent-badge { font-size:11px; color:${accent}; font-weight:700; display:flex; align-items:center; gap:4px; }
        .quick-send { padding:5px 11px; border-radius:7px; background:${accent}; border:none; color:#000; font-size:11.5px; font-weight:700; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; flex-shrink:0; transition:all 0.13s; }
        .quick-send:hover { transform:translateY(-1px); }

        /* Detail panel */
        .detail-inner { padding:22px 24px; max-width:620px; }
        .det-header { display:flex; align-items:flex-start; gap:14px; margin-bottom:20px; }
        .det-name { font-weight:800; font-size:19px; color:${t.text}; letter-spacing:-0.3px; margin-bottom:4px; }
        .det-phone { font-size:13px; color:${t.textMuted}; margin-bottom:8px; }
        .det-tags { display:flex; gap:7px; align-items:center; flex-wrap:wrap; }

        /* Score ring */
        .score-ring { width:64px; height:64px; flex-shrink:0; position:relative; }
        .score-ring svg { transform:rotate(-90deg); }
        .score-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
        .score-num { font-weight:800; font-size:17px; line-height:1; }
        .score-lbl { font-size:8px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; color:${t.textFaint}; }

        /* Context card */
        .ctx-card { background:${t.card}; border:1px solid ${t.cardBorder}; border-radius:13px; padding:16px 18px; margin-bottom:14px; }
        .ctx-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.9px; color:${t.textFaint}; margin-bottom:10px; }
        .ctx-text { font-size:13px; color:${t.textMuted}; line-height:1.6; }
        .last-msg-box { display:flex; gap:10px; align-items:flex-start; margin-top:10px; padding:10px 13px; border-radius:9px; background:${t.inputBg}; border:1px solid ${t.cardBorder}; }
        .wa-dot { width:8px; height:8px; border-radius:50%; background:#00a859; margin-top:5px; flex-shrink:0; }
        .last-msg-text { font-size:12.5px; color:${t.text}; font-style:italic; }

        /* AI message editor */
        .ai-card { background:${t.card}; border:1px solid ${t.cardBorder}; border-radius:13px; padding:18px 20px; margin-bottom:14px; }
        .ai-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
        .ai-badge { display:flex; align-items:center; gap:6px; padding:4px 11px; border-radius:7px; background:${accent}10; border:1px solid ${accent}25; }
        .ai-badge-text { font-size:11.5px; font-weight:700; color:${accent}; }
        .edit-btn { padding:4px 11px; border-radius:7px; background:${t.inputBg}; border:1px solid ${t.cardBorder}; color:${t.textMuted}; font-size:11.5px; font-weight:600; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; }
        .msg-bubble { background:${accent}08; border:1px solid ${accent}18; border-radius:13px; border-bottom-left-radius:3px; padding:13px 16px; font-size:13.5px; color:${t.text}; line-height:1.7; }
        .msg-textarea { width:100%; background:${t.inputBg}; border:1px solid ${accent}33; border-radius:13px; border-bottom-left-radius:3px; padding:13px 16px; font-size:13.5px; color:${t.text}; line-height:1.7; resize:none; outline:none; font-family:'Plus Jakarta Sans',sans-serif; min-height:110px; }
        .send-row { display:flex; gap:9px; margin-top:14px; align-items:center; }
        .send-btn { flex:1; padding:11px; border-radius:10px; background:${accent}; border:none; color:#000; font-size:13.5px; font-weight:800; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.15s; }
        .send-btn:hover { transform:translateY(-1px); box-shadow:0 4px 16px ${accent}44; }
        .send-btn.loading { opacity:0.7; cursor:not-allowed; }
        .dismiss-btn { padding:11px 18px; border-radius:10px; background:${t.inputBg}; border:1px solid ${t.cardBorder}; color:${t.textMuted}; font-size:13px; font-weight:600; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; }

        /* Sent state */
        .sent-state { text-align:center; padding:32px 24px; }
        .sent-icon { font-size:40px; margin-bottom:12px; }
        .sent-title { font-weight:800; font-size:17px; color:${t.text}; margin-bottom:6px; }
        .sent-sub { font-size:13px; color:${t.textMuted}; line-height:1.6; }

        /* Empty */
        .empty-panel { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px; text-align:center; }
        .empty-icon-big { font-size:48px; margin-bottom:14px; opacity:0.2; }

        /* Sending spinner */
        @keyframes spin { to { transform:rotate(360deg); } }
        .spinner { width:16px; height:16px; border:2px solid #00000033; border-top-color:#000; border-radius:50%; animation:spin 0.7s linear infinite; }

        @keyframes slideIn { from { opacity:0; transform:translateX(12px); } to { opacity:1; transform:translateX(0); } }
        .detail-inner { animation:slideIn 0.2s ease; }
      `}</style>

      <div className="root">
        <aside className="sidebar">
          <a href="/dashboard" className="logo">fast<span>rill</span></a>
          <div className="nav-section">Platform</div>
          {NAV.map(item => (
            <button key={item.id} className={`nav-item${item.id === "leads" ? " active" : ""}`} onClick={() => router.push(item.path)}>
              <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
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
            <div className="topbar-title">◉ Lead Recovery</div>
            <div className="topbar-right">
              <button className="theme-btn" onClick={toggleTheme}>
                <span>{dark ? "🌙" : "☀️"}</span><div className="pill" /><span>{dark ? "Dark" : "Light"}</span>
              </button>
            </div>
          </div>

          {/* Opportunity banner */}
          <div className="opp-banner">
            <div className="opp-left">
              <div className="opp-icon">◉</div>
              <div>
                <div className="opp-title">₹{potentialRevenue.toLocaleString()} sitting in unconverted leads</div>
                <div className="opp-sub">These people showed interest but never booked. AI has written a message for each — one click to send.</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:24, flexShrink:0 }}>
              {[
                { val:activeleads.length, label:"Open Leads", color:accent },
                { val:activeleads.filter(l => l.aiScore >= 85).length, label:"Hot Leads", color:"#ef4444" },
                { val:sentIds.length, label:"Recovered", color:"#7c3aed" },
              ].map(s => (
                <div key={s.label} className="opp-stat">
                  <div className="opp-val" style={{ color:s.color }}>{s.val}</div>
                  <div className="opp-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="content">
            {/* Left: lead list */}
            <div className="list-col">
              <div className="filter-bar">
                {[
                  { id:"all", label:"All", n:activeleads.length },
                  { id:"hot", label:"🔥 Hot", n:activeleads.filter(l=>l.aiScore>=85).length },
                  { id:"warm", label:"🌡 Warm", n:activeleads.filter(l=>l.aiScore>=65&&l.aiScore<85).length },
                  { id:"cold", label:"❄️ Cold", n:activeleads.filter(l=>l.aiScore<65).length },
                ].map(f => (
                  <button key={f.id} className={`ftab${filter === f.id ? " active" : ""}`} onClick={() => setFilter(f.id)}>
                    {f.label} <span className="ftab-n">{f.n}</span>
                  </button>
                ))}
              </div>

              <div className="lead-list">
                {filtered.length === 0 && (
                  <div style={{ padding:32, textAlign:"center" }}>
                    <div style={{ fontSize:32, opacity:0.2, marginBottom:10 }}>◉</div>
                    <div style={{ fontSize:13, color:t.textMuted }}>No leads in this category</div>
                  </div>
                )}

                {filtered.map(lead => {
                  const isSent = sentIds.includes(lead.id)
                  const isSending = sendingId === lead.id
                  return (
                    <div key={lead.id} className={`lead-row${selected?.id === lead.id ? " active" : ""}${isSent ? " sent" : ""}`}
                      onClick={() => !isSent && setSelected(lead)}>
                      <AvatarEl name={lead.name} />
                      <div className="lead-info">
                        <div className="lead-name">{lead.name}</div>
                        <div className="lead-last">"{lead.lastMsg}"</div>
                        <div className="lead-meta">
                          <span className="src-tag" style={{ background:SOURCE_COLORS[lead.source]?.bg, border:`1px solid ${SOURCE_COLORS[lead.source]?.border}`, color:SOURCE_COLORS[lead.source]?.text }}>{lead.source}</span>
                          <span className="days-tag">{lead.daysAgo}d ago</span>
                        </div>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0 }}>
                        {isSent ? (
                          <div className="sent-badge">✓ Sent</div>
                        ) : (
                          <>
                            <div className="score-badge" style={{ background:`${scoreColor(lead.aiScore)}10`, border:`1px solid ${scoreColor(lead.aiScore)}25`, color:scoreColor(lead.aiScore) }}>
                              {scoreLabel(lead.aiScore)} {lead.aiScore}
                            </div>
                            <button className="quick-send" onClick={e => { e.stopPropagation(); handleSend(lead) }}>
                              {isSending ? <div className="spinner" /> : "Send →"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right: detail */}
            <div className="detail-col">
              {!selected ? (
                <div className="empty-panel">
                  <div className="empty-icon-big">◉</div>
                  <div style={{ fontWeight:700, fontSize:15, color:t.text, marginBottom:6 }}>Select a lead to recover</div>
                  <div style={{ fontSize:13, color:t.textMuted, maxWidth:280, lineHeight:1.6 }}>
                    Click any lead on the left. AI has already written a personalised message — review, edit if needed, then send in one click.
                  </div>
                </div>
              ) : sentIds.includes(selected.id) ? (
                <div className="sent-state">
                  <div className="sent-icon">✅</div>
                  <div className="sent-title">Message sent to {selected.name}!</div>
                  <div className="sent-sub">
                    Fastrill AI will handle the reply automatically and push toward a booking.<br />
                    You'll see the conversation in your inbox.
                  </div>
                  <button style={{ marginTop:18, padding:"9px 20px", borderRadius:9, background:accent, border:"none", color:"#000", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}
                    onClick={() => { setSelected(null) }}>← Back to leads</button>
                </div>
              ) : (
                <div className="detail-inner">
                  {/* Header */}
                  <div className="det-header">
                    <AvatarEl name={selected.name} size={52} />
                    <div style={{ flex:1 }}>
                      <div className="det-name">{selected.name}</div>
                      <div className="det-phone">{selected.phone}</div>
                      <div className="det-tags">
                        <span className="src-tag" style={{ background:SOURCE_COLORS[selected.source]?.bg, border:`1px solid ${SOURCE_COLORS[selected.source]?.border}`, color:SOURCE_COLORS[selected.source]?.text, padding:"2px 9px", borderRadius:100, fontSize:11, fontWeight:700 }}>{selected.source}</span>
                        <span style={{ fontSize:12, color:t.textFaint }}>Lead since {selected.joinedAt}</span>
                        <span style={{ fontSize:12, color:t.textFaint }}>· {selected.daysAgo} days ago</span>
                      </div>
                    </div>

                    {/* Score ring */}
                    <div className="score-ring">
                      <svg width="64" height="64" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="26" fill="none" stroke={t.chipBorder} strokeWidth="5" />
                        <circle cx="32" cy="32" r="26" fill="none" stroke={scoreColor(selected.aiScore)}
                          strokeWidth="5" strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 26}`}
                          strokeDashoffset={`${2 * Math.PI * 26 * (1 - selected.aiScore / 100)}`}
                          style={{ transition:"stroke-dashoffset 0.5s ease" }} />
                      </svg>
                      <div className="score-center">
                        <div className="score-num" style={{ color:scoreColor(selected.aiScore) }}>{selected.aiScore}</div>
                        <div className="score-lbl">Score</div>
                      </div>
                    </div>
                  </div>

                  {/* Context */}
                  <div className="ctx-card">
                    <div className="ctx-title">Why this lead went cold</div>
                    <div className="ctx-text">{selected.context}</div>
                    <div className="last-msg-box">
                      <div className="wa-dot" />
                      <div>
                        <div style={{ fontSize:10.5, color:t.textFaint, fontWeight:600, marginBottom:3, textTransform:"uppercase", letterSpacing:"0.6px" }}>Last message from them</div>
                        <div className="last-msg-text">"{selected.lastMsg}"</div>
                      </div>
                    </div>
                  </div>

                  {/* AI message */}
                  <div className="ai-card">
                    <div className="ai-header">
                      <div className="ai-badge">
                        <span style={{ fontSize:14 }}>⬡</span>
                        <span className="ai-badge-text">AI-written recovery message</span>
                      </div>
                      <button className="edit-btn" onClick={() => setIsEditing(p => !p)}>
                        {isEditing ? "✓ Done" : "✏️ Edit"}
                      </button>
                    </div>

                    {isEditing ? (
                      <textarea className="msg-textarea" value={editingMsg} onChange={e => setEditingMsg(e.target.value)} />
                    ) : (
                      <div className="msg-bubble">{editingMsg}</div>
                    )}

                    <div style={{ fontSize:11.5, color:t.textFaint, marginTop:10, display:"flex", alignItems:"center", gap:6 }}>
                      <span>⬡</span> After they reply, Fastrill AI takes over and converts the conversation into a booking
                    </div>

                    <div className="send-row">
                      <button
                        className={`send-btn${sendingId === selected.id ? " loading" : ""}`}
                        onClick={() => handleSend(selected)}
                        disabled={sendingId === selected.id}>
                        {sendingId === selected.id
                          ? <><div className="spinner" /> Sending via WhatsApp...</>
                          : <>💬 Send on WhatsApp</>}
                      </button>
                      <button className="dismiss-btn" onClick={() => { setDismissedIds(p => [...p, selected.id]); setSelected(null) }}>
                        Dismiss
                      </button>
                    </div>
                  </div>

                  {/* Why AI scored this */}
                  <div style={{ background:t.card, border:`1px solid ${t.cardBorder}`, borderRadius:13, padding:"16px 18px" }}>
                    <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.9px", color:t.textFaint, marginBottom:12 }}>Why AI scored this lead {selected.aiScore}/100</div>
                    {[
                      { factor:"Showed clear intent", present: selected.aiScore >= 70, detail:"Asked about a specific service or price" },
                      { factor:"Recent engagement", present: selected.daysAgo <= 14, detail:`Last contact ${selected.daysAgo} days ago` },
                      { factor:"High-value source", present: selected.source === "Referral", detail:selected.source === "Referral" ? "Referred leads convert 3x better" : `Came from ${selected.source}` },
                      { factor:"Multiple touchpoints", present: selected.aiScore >= 80, detail:"Engaged more than once" },
                    ].map(f => (
                      <div key={f.factor} style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:9 }}>
                        <div style={{ width:18, height:18, borderRadius:5, background:f.present ? `${accent}15` : `${t.inputBg}`, border:`1px solid ${f.present ? accent+"33" : t.cardBorder}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:f.present ? accent : t.textFaint, flexShrink:0, marginTop:1 }}>
                          {f.present ? "✓" : "—"}
                        </div>
                        <div>
                          <div style={{ fontSize:12.5, fontWeight:600, color:f.present ? t.text : t.textFaint }}>{f.factor}</div>
                          <div style={{ fontSize:11.5, color:t.textFaint, marginTop:1 }}>{f.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
