"use client"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/Toast"

const NAV = [
  { id:"overview",  label:"Revenue Engine", icon:"⬡", path:"/dashboard" },
  { id:"inbox",     label:"Conversations",  icon:"◎", path:"/dashboard/conversations" },
  { id:"bookings",  label:"Bookings",       icon:"◷", path:"/dashboard/bookings" },
  { id:"campaigns", label:"Campaigns",      icon:"◆", path:"/dashboard/campaigns" },
  { id:"leads",     label:"Lead Recovery",  icon:"◉", path:"/dashboard/leads" },
  { id:"contacts",  label:"Customers",      icon:"◑", path:"/dashboard/contacts" },
  { id:"analytics", label:"Analytics",      icon:"▦", path:"/dashboard/analytics" },
  { id:"settings",  label:"Settings",       icon:"◌", path:"/dashboard/settings" },
]
const TIMES = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30"]
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

// ─── Safe date helpers ─────────────────────────────────
// booking_date may be "2026-03-15" OR "2026-03-15T00:00:00Z" — always take first 10 chars
const toDateStr = (v) => (v || "").substring(0, 10)
const getTodayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
}

export default function Bookings() {
  const router = useRouter()
  const toast  = useToast()
  const [userId,      setUserId]      = useState(null)
  const [userEmail,   setUserEmail]   = useState("")
  const [authLoading, setAuthLoading] = useState(true)
  const [dark,        setDark]        = useState(true)
  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUserId(session.user.id); setUserEmail(session.user.email||"") }
      setAuthLoading(false)
    })
  }, [])
  const toggleTheme = () => { const n=!dark; setDark(n); localStorage.setItem("fastrill-theme",n?"dark":"light") }

  const [mobSidebarOpen, setMobSidebarOpen] = useState(false)
  const [view, setView]             = useState("list")
  const [bookings, setBookings]     = useState([])
  const [selected, setSelected]     = useState(null)
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState("upcoming")
  const [showAdd, setShowAdd]       = useState(false)
  const [services, setServices]     = useState([])
  const [weekOffset, setWeekOffset] = useState(0)
  const [newBk, setNewBk]           = useState({ customer_name:"", customer_phone:"", service:"", staff:"", booking_date:"", booking_time:"", amount:"" })
  const [saving, setSaving]         = useState(false)

  const todayStr = getTodayStr()

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) router.push("/login")
      else { setUserEmail(data.user.email || ""); setUserId(data.user.id) }
    })
  }, [])

  useEffect(() => { if (userId) { load(); loadServices() } }, [userId])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from("bookings").select("*").eq("user_id", userId)
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true })
    if (error) console.error("Bookings load:", error.message)
    const list = (data || []).map(b => ({ ...b, booking_date: toDateStr(b.booking_date) }))
    setBookings(list)
    recalcStats(list)
    // Auto-select first upcoming booking
    const upcoming = list.filter(b => b.booking_date >= todayStr)
    setSelected(upcoming[0] || list[0] || null)
    setLoading(false)
  }

  function recalcStats(list) {
    const confirmed = list.filter(b => b.status === "confirmed" || b.status === "completed")
    setStats({
      total:     list.length,
      confirmed: list.filter(b => b.status === "confirmed").length,
      pending:   list.filter(b => b.status === "pending").length,
      revenue:   confirmed.reduce((s, b) => s + (b.amount || 0), 0),
      ai:        list.filter(b => b.ai_booked).length,
    })
  }

  const [stats, setStats] = useState({ total:0, confirmed:0, pending:0, revenue:0, ai:0 })

  async function loadServices() {
    const { data } = await supabase.from("services").select("name,price").eq("user_id", userId)
    setServices(data || [])
  }

  async function updateStatus(id, newStatus) {
    const { error } = await supabase.from("bookings").update({ status: newStatus }).eq("id", id)
    if (error) { console.error("Status update:", error.message); return }
    const updated = bookings.map(b => b.id === id ? { ...b, status: newStatus } : b)
    setBookings(updated)
    recalcStats(updated)
    if (selected?.id === id) setSelected(s => ({ ...s, status: newStatus }))
  }

  async function addBooking() {
    if (!newBk.customer_name || !newBk.service || !newBk.booking_date) return
    setSaving(true)
    const { data, error } = await supabase.from("bookings").insert({
      ...newBk, user_id: userId, status: "confirmed", ai_booked: false,
      amount: parseInt(newBk.amount) || 0, created_at: new Date().toISOString()
    }).select().single()
    if (error) { console.error("Add booking:", error.message); setSaving(false); return }
    if (data) {
      const row = { ...data, booking_date: toDateStr(data.booking_date) }
      const updated = [...bookings, row].sort((a,b) => a.booking_date > b.booking_date ? 1 : -1)
      setBookings(updated)
      recalcStats(updated)
      setSelected(row)
      setShowAdd(false)
      setNewBk({ customer_name:"", customer_phone:"", service:"", staff:"", booking_date:"", booking_time:"", amount:"" })
    }
    setSaving(false)
  }


  // ─── Theme tokens ──────────────────────────────────────
  const bg=dark?"#08080e":"#f0f2f5", sidebar=dark?"#0c0c15":"#ffffff", card=dark?"#0f0f1a":"#ffffff"
  const border=dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.08)"
  const cardBorder=dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.09)"
  const text=dark?"#eeeef5":"#111827"
  const textMuted=dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const textFaint=dark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.25)"
  const inputBg=dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"
  const accent=dark?"#00C9B1":"#00897A"
  const accentDim=dark?"rgba(0,208,132,0.12)":"rgba(0,147,90,0.1)"
  const navText=dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const navActive=dark?"rgba(0,196,125,0.1)":"rgba(0,180,115,0.08)"
  const navActiveBorder = "rgba(0,201,177,0.2)" // dark?"rgba(0,196,125,0.2)":"rgba(0,180,115,0.2)"
  const navActiveText = "#00C9B1" // dark?"#00B5A0":"#00897A"
  const userInitial = userEmail ? userEmail[0].toUpperCase() : "G"
  const statusColor = { confirmed:accent, pending:"#f59e0b", "in-progress":"#38bdf8", completed:"#a78bfa", cancelled:"#fb7185" }

  // ─── Week calculation (timezone-safe) ─────────────────
  const now = new Date()
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + weekOffset * 7)
  const weekDays = Array.from({length:7}, (_,i) => {
    const d = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()+i)
    return d
  })
  const weekLabel = `${weekDays[0].getDate()} ${MONTHS[weekDays[0].getMonth()]} – ${weekDays[6].getDate()} ${MONTHS[weekDays[6].getMonth()]}`

  // Local date string: no UTC conversion → no timezone shift
  const localDateStr = (d) =>
    `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`

  const formatDate = (raw) => {
    if (!raw) return "—"
    const d = toDateStr(raw)
    const tomorrow = new Date(now); tomorrow.setDate(now.getDate()+1)
    const tomorrowStr = localDateStr(tomorrow)
    const prefix = d === todayStr ? "Today · " : d === tomorrowStr ? "Tomorrow · " : ""
    try { return prefix + new Date(d+"T12:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"}) }
    catch { return raw }
  }

  // ─── Filters ───────────────────────────────────────────
  const todayBks = bookings.filter(b => b.booking_date === todayStr)
  const filterMap = {
    upcoming:  bookings.filter(b => b.booking_date >= todayStr && b.status !== "cancelled"),
    today:     todayBks,
    all:       bookings,
    confirmed: bookings.filter(b => b.status === "confirmed"),
    pending:   bookings.filter(b => b.status === "pending"),
    completed: bookings.filter(b => b.status === "completed"),
    cancelled: bookings.filter(b => b.status === "cancelled"),
  }
  const filtered = filterMap[filter] || bookings


  // ─── Booking Card ──────────────────────────────────────
  const BookingCard = ({ b }) => {
    const isToday = b.booking_date === todayStr
    const isSelected = selected?.id === b.id
    return (
      <div onClick={() => setSelected(isSelected ? null : b)} style={{
        background: isSelected ? accentDim : isToday ? `${accent}08` : card,
        border: `1px solid ${isSelected ? accent+"66" : isToday ? accent+"44" : (statusColor[b.status]||textFaint)+"44"}`,
        borderLeft: `3px solid ${isToday ? accent : statusColor[b.status] || textFaint}`,
        borderRadius:10, padding:"11px 13px", cursor:"pointer", marginBottom:8, transition:"all 0.1s"
      }}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontWeight:700,fontSize:13,color:text}}>{b.customer_name}</span>
            {isToday && <span style={{fontSize:9,fontWeight:800,color:accent,background:accentDim,border:`1px solid ${accent}44`,borderRadius:100,padding:"1px 6px"}}>TODAY</span>}
            {b.ai_booked && <span style={{fontSize:9,fontWeight:700,color:"#a78bfa",background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.2)",borderRadius:100,padding:"1px 6px"}}>◈ AI</span>}
          </div>
          <span style={{fontSize:10.5,fontWeight:700,color:statusColor[b.status],background:(statusColor[b.status]||textFaint)+"18",border:`1px solid ${(statusColor[b.status]||textFaint)}33`,borderRadius:100,padding:"2px 8px"}}>{b.status||"—"}</span>
        </div>
        <div style={{fontSize:12,color:textMuted,marginBottom:4}}>
          {b.service}{b.booking_time ? ` · ⏰ ${b.booking_time}` : ""}
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:11,color:isToday?accent:textFaint,fontWeight:isToday?600:400}}>{formatDate(b.booking_date)}</span>
          {b.amount > 0 && <span style={{fontWeight:700,fontSize:12.5,color:accent}}>₹{b.amount.toLocaleString()}</span>}
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${bg}!important;color:${text}!important;font-family:'Plus Jakarta Sans',sans-serif!important;}
        .wrap{display:flex;height:100vh;overflow:hidden;}
        .sidebar{width:224px;flex-shrink:0;background:${sidebar};border-right:1px solid ${border};display:flex;flex-direction:column;overflow-y:auto;}
        .logo{padding:16px 18px;font-weight:800;font-size:20px;color:${text};text-decoration:none;display:flex;flex-direction:row;align-items:center;gap:10px;border-bottom:1px solid ${border};line-height:1;}
        .logo span{color:${accent};}
        .nav-section{padding:18px 16px 7px;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${textFaint};font-weight:600;}
        .nav-item{display:flex;align-items:center;gap:9px;padding:9px 12px;margin:1px 8px;border-radius:8px;cursor:pointer;font-size:13.5px;color:${navText};font-weight:500;transition:all 0.13s;border:1px solid transparent;background:none;width:calc(100% - 16px);text-align:left;font-family:'Plus Jakarta Sans',sans-serif;}
        .nav-item:hover{background:${inputBg};color:${text};}
        .nav-item.active{background:${navActive};color:${navActiveText};font-weight:600;border-color:${navActiveBorder};}
        .nav-icon{font-size:13px;width:18px;text-align:center;flex-shrink:0;}
        .sidebar-footer{margin-top:auto;padding:14px;border-top:1px solid ${border};}
        .user-card{display:flex;align-items:center;gap:9px;padding:9px;border-radius:9px;background:${inputBg};border:1px solid ${cardBorder};}
        .user-avatar{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,${accent},#0ea5e9);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#fff;flex-shrink:0;}
        .user-email{font-size:11.5px;color:${textMuted};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .logout-btn{margin-top:7px;width:100%;padding:7px;border-radius:7px;background:transparent;border:1px solid ${cardBorder};font-size:12px;color:${textMuted};cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .logout-btn:hover{border-color:#fca5a5;color:#ef4444;}
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .topbar{height:54px;flex-shrink:0;border-bottom:1px solid ${border};display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:${sidebar};}
        .tb-title{font-weight:700;font-size:15px;color:${text};}
        .topbar-r{display:flex;align-items:center;gap:8px;}
        .theme-toggle{display:flex;align-items:center;gap:6px;padding:5px 10px;background:${inputBg};border:1px solid ${cardBorder};border-radius:8px;cursor:pointer;font-size:11.5px;color:${textMuted};font-family:'Plus Jakarta Sans',sans-serif;}
        .toggle-pill{width:30px;height:16px;border-radius:100px;background:${dark?accent:"#d1d5db"};position:relative;flex-shrink:0;}
        .toggle-pill::after{content:'';position:absolute;top:2px;width:12px;height:12px;border-radius:50%;background:#fff;left:${dark?"16px":"2px"};}
        .content{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:14px;background:${bg};}
        .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;gap:8px;color:${textFaint};text-align:center;}
        .week-nav-btn{padding:5px 12px;border-radius:7px;border:1px solid ${cardBorder};background:${inputBg};color:${textMuted};cursor:pointer;font-size:12px;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.12s;}
        .week-nav-btn:hover{color:${text};border-color:${accent}66;}
        select option{background-color:#0c0c15!important;color:#eeeef5!important;}

        /* ══ MOBILE RESPONSIVE ══════════════════════════════════ */
        @media(max-width:767px){
          .wrap{position:relative;}
          .sidebar{
            position:fixed;top:0;left:0;height:100vh;z-index:300;
            transform:translateX(-100%);transition:transform 0.25s ease;
            width:240px!important;box-shadow:4px 0 24px rgba(0,0,0,0.5);
          }
          .sidebar.mob-open{transform:translateX(0);}
          .mob-overlay{display:block!important;}
          .main{width:100%;}
          .topbar{padding:0 12px!important;}
          .content{padding:12px!important;}
          .hamburger{display:flex!important;}
          .tb-title{font-size:14px!important;}
          /* Hide theme toggle label on small screens */
          .theme-toggle .tog-label{display:none;}
        }
        .mob-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:299;cursor:pointer;}
        .hamburger{display:none;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:6px 9px;cursor:pointer;font-size:17px;color:#eeeef5;line-height:1;margin-right:2px;}
        /* Responsive grids */
        @media(max-width:767px){
          [style*="grid-template-columns: repeat(5"]{grid-template-columns:repeat(2,1fr)!important;}
          [style*="grid-template-columns: repeat(4"]{grid-template-columns:repeat(2,1fr)!important;}
          [style*="grid-template-columns: repeat(3"]{grid-template-columns:repeat(2,1fr)!important;}
          [style*="grid-template-columns: 1fr 300px"]{grid-template-columns:1fr!important;}
          [style*="grid-template-columns: 1fr 320px"]{grid-template-columns:1fr!important;}
          [style*="grid-template-columns: 280px 1fr 280px"]{grid-template-columns:1fr!important;}
          [style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important;}
          [style*="repeat(7,1fr)"]{grid-template-columns:repeat(4,1fr)!important;}
        }
        /* Bottom navigation bar */
        .bottom-nav{
          display:none;position:fixed;bottom:0;left:0;right:0;
          background:#0c0c15;border-top:1px solid rgba(255,255,255,0.07);
          padding:6px 0;z-index:200;
        }
        @media(max-width:767px){
          .bottom-nav{display:flex;justify-content:space-around;}
          .main{padding-bottom:60px;}
          .wrap{padding-bottom:0;}
        }
        .bnav-btn{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 6px;border:none;background:transparent;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;flex:1;}
        .bnav-icon{font-size:17px;color:rgba(255,255,255,0.3);}
        .bnav-label{font-size:9px;font-weight:600;color:rgba(255,255,255,0.3);}
        .bnav-btn.active .bnav-icon,.bnav-btn.active .bnav-label{color:#00C9B1;}
      `}</style>

      <div className="wrap">
        <aside className={`sidebar${mobSidebarOpen?" mob-open":""}`}>
          <a href="/dashboard" className="logo" style={{display:"flex",alignItems:"center",gap:"8px"}}><img src="/logo.png" width="34" height="34" alt="Fastrill" style={{display:"block",objectFit:"contain",flexShrink:0}} /><span style={{fontWeight:800,fontSize:20,color:tx,letterSpacing:"-0.3px"}}>fast<span style={{color:acc}}>rill</span></span></a>
          <div className="nav-section">Platform</div>
          {NAV.map(item => (
            <button key={item.id} className={`nav-item${item.id==="bookings"?" active":""}`} onClick={() => router.push(item.path)}>
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
            <button className="hamburger" onClick={()=>setMobSidebarOpen(s=>!s)}>☰</button>
              <span className="tb-title">Bookings</span>
            <div className="topbar-r">
              {/* View toggle */}
              <div style={{display:"flex",background:inputBg,border:`1px solid ${cardBorder}`,borderRadius:8,padding:2,gap:1}}>
                {["list","week"].map(v => (
                  <button key={v} onClick={() => setView(v)} style={{padding:"4px 12px",borderRadius:6,fontSize:11.5,fontWeight:600,cursor:"pointer",border:"none",background:view===v?card:"transparent",color:view===v?text:textMuted,fontFamily:"'Plus Jakarta Sans',sans-serif",boxShadow:view===v?"0 1px 3px rgba(0,0,0,0.15)":"none"}}>
                    {v.charAt(0).toUpperCase()+v.slice(1)}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowAdd(true)} style={{background:accent,color:"#000",border:"none",padding:"7px 16px",borderRadius:8,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                + New Booking
              </button>
              <button className="theme-toggle" onClick={toggleTheme}>
                <span>{dark?"🌙":"☀️"}</span><div className="toggle-pill"/><span>{dark?"Dark":"Light"}</span>
              </button>
            </div>
          </div>

          <div className="content">
            {/* ── Stats ── */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:11}}>
              {[
                { l:"Total",     v:stats.total,                          c:text    },
                { l:"Confirmed", v:stats.confirmed,                      c:accent  },
                { l:"Pending",   v:stats.pending,                        c:"#f59e0b" },
                { l:"AI Booked", v:stats.ai,                             c:"#a78bfa" },
                { l:"Revenue",   v:`₹${stats.revenue.toLocaleString()}`, c:accent  },
              ].map(s => (
                <div key={s.l} style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:11,padding:"13px 15px"}}>
                  <div style={{fontSize:11,color:textMuted,marginBottom:5}}>{s.l}</div>
                  <div style={{fontSize:22,fontWeight:700,color:s.c}}>{loading?"…":s.v}</div>
                </div>
              ))}
            </div>

            {/* ── Today banner ── */}
            {todayBks.length > 0 && (
              <div style={{background:`linear-gradient(135deg,${accent}14,${accent}06)`,border:`1px solid ${accent}33`,borderRadius:11,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:20}}>📅</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,color:text}}>{todayBks.length} booking{todayBks.length>1?"s":""} today</div>
                    <div style={{fontSize:11.5,color:textMuted}}>{todayBks.map(b=>`${b.customer_name}${b.booking_time?` @ ${b.booking_time}`:""}`).join(" · ")}</div>
                  </div>
                </div>
                <button onClick={() => { setFilter("today"); setView("list") }} style={{padding:"5px 14px",borderRadius:7,background:accent,border:"none",color:"#000",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",flexShrink:0}}>
                  View Today
                </button>
              </div>
            )}

            {/* ── WEEK VIEW ── */}
            {view === "week" ? (
              <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,overflow:"hidden"}}>
                {/* Navigation */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:`1px solid ${border}`}}>
                  <button className="week-nav-btn" onClick={() => setWeekOffset(w => w-1)}>← Prev week</button>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontWeight:700,fontSize:13,color:text}}>{weekLabel}</span>
                    {weekOffset !== 0 && (
                      <button onClick={() => setWeekOffset(0)} style={{padding:"2px 8px",borderRadius:6,border:`1px solid ${accent}44`,background:accentDim,color:accent,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Today</button>
                    )}
                  </div>
                  <button className="week-nav-btn" onClick={() => setWeekOffset(w => w+1)}>Next week →</button>
                </div>

                {/* Day headers */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:`1px solid ${border}`}}>
                  {weekDays.map((d, i) => {
                    const ds = localDateStr(d)
                    const isToday = ds === todayStr
                    const count = bookings.filter(b => b.booking_date === ds).length
                    return (
                      <div key={i} style={{padding:"10px 8px",textAlign:"center",borderRight:i<6?`1px solid ${border}`:"none",background:isToday?`${accent}08`:"transparent"}}>
                        <div style={{fontSize:10.5,color:textFaint,fontWeight:600,marginBottom:4}}>{DAYS[d.getDay()]}</div>
                        <div style={{width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto",fontWeight:700,fontSize:13,background:isToday?accent:"transparent",color:isToday?"#000":textMuted}}>
                          {d.getDate()}
                        </div>
                        {count > 0 && <div style={{marginTop:4,fontSize:9,fontWeight:700,color:accent,background:accentDim,borderRadius:100,padding:"1px 5px",display:"inline-block"}}>{count}</div>}
                      </div>
                    )
                  })}
                </div>

                {/* Booking slots */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",minHeight:240,padding:"8px 4px",gap:4}}>
                  {weekDays.map((d, i) => {
                    const ds = localDateStr(d)
                    const isToday = ds === todayStr
                    const dayBks = bookings.filter(b => b.booking_date === ds)
                    return (
                      <div key={i} style={{borderRight:i<6?`1px solid ${border}`:"none",padding:"4px",background:isToday?`${accent}04`:"transparent",borderRadius:4}}>
                        {dayBks.map(b => (
                          <div key={b.id} onClick={() => setSelected(b)} style={{
                            fontSize:10.5, fontWeight:600, color:statusColor[b.status]||accent,
                            background:(statusColor[b.status]||accent)+"18",
                            border:`1px solid ${statusColor[b.status]||accent}33`,
                            borderRadius:5, padding:"4px 5px", marginBottom:4, cursor:"pointer",
                            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", lineHeight:1.4,
                            outline: selected?.id===b.id ? `2px solid ${accent}` : "none"
                          }}>
                            {b.booking_time && <span style={{opacity:0.75}}>{b.booking_time} </span>}
                            {b.customer_name}
                          </div>
                        ))}
                        {dayBks.length === 0 && isToday && (
                          <div style={{fontSize:9.5,color:textFaint,textAlign:"center",marginTop:12}}>Free today</div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Selected booking detail in week view */}
                {selected && (
                  <div style={{borderTop:`1px solid ${border}`,padding:"14px 18px",display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
                    <div style={{fontWeight:700,fontSize:13,color:text}}>{selected.customer_name}</div>
                    <div style={{fontSize:12,color:textMuted}}>{selected.service}</div>
                    <div style={{fontSize:12,color:textMuted}}>{formatDate(selected.booking_date)}{selected.booking_time?` · ${selected.booking_time}`:""}</div>
                    {selected.amount>0 && <div style={{fontSize:12,fontWeight:700,color:accent}}>₹{selected.amount.toLocaleString()}</div>}
                    <div style={{display:"flex",gap:6,marginLeft:"auto"}}>
                      {selected.status!=="confirmed"  && <button onClick={()=>updateStatus(selected.id,"confirmed")}  style={{padding:"5px 12px",borderRadius:7,background:accentDim,border:`1px solid ${accent}44`,color:accent,fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>✓ Confirm</button>}
                      {selected.status!=="completed"  && <button onClick={()=>updateStatus(selected.id,"completed")}  style={{padding:"5px 12px",borderRadius:7,background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.25)",color:"#a78bfa",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>✓ Done</button>}
                      {selected.status!=="cancelled"  && <button onClick={()=>updateStatus(selected.id,"cancelled")}  style={{padding:"5px 12px",borderRadius:7,background:"rgba(251,113,133,0.1)",border:"1px solid rgba(251,113,133,0.25)",color:"#fb7185",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>✕ Cancel</button>}
                      <button onClick={()=>setSelected(null)} style={{padding:"5px 10px",borderRadius:7,background:inputBg,border:`1px solid ${cardBorder}`,color:textMuted,fontSize:11,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>✕</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── LIST VIEW ── */
              <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:14}}>
                {/* List */}
                <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,overflow:"hidden"}}>
                  <div style={{padding:"10px 14px",borderBottom:`1px solid ${border}`,display:"flex",gap:5,flexWrap:"wrap"}}>
                    {[
                      { k:"upcoming",  label:"Upcoming" },
                      { k:"today",     label:`Today${todayBks.length>0?" ("+todayBks.length+")":""}`, hi:todayBks.length>0 },
                      { k:"all",       label:"All" },
                      { k:"confirmed", label:"Confirmed" },
                      { k:"pending",   label:"Pending" },
                      { k:"completed", label:"Done" },
                      { k:"cancelled", label:"Cancelled" },
                    ].map(f => {
                      const active = filter === f.k
                      const color = f.hi ? accent : statusColor[f.k] || accent
                      return (
                        <button key={f.k} onClick={() => setFilter(f.k)} style={{padding:"3px 10px",borderRadius:100,fontSize:11,fontWeight:600,cursor:"pointer",border:`1px solid ${active?color+"55":cardBorder}`,background:active?color+"18":"transparent",color:active?color:textMuted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                          {f.label}
                        </button>
                      )
                    })}
                  </div>
                  <div style={{padding:12,overflowY:"auto",maxHeight:"calc(100vh - 310px)"}}>
                    {loading ? (
                      <div className="empty-state"><span style={{fontSize:22}}>⏳</span><span>Loading bookings…</span></div>
                    ) : filtered.length === 0 ? (
                      <div className="empty-state">
                        <span style={{fontSize:28,opacity:0.3}}>◷</span>
                        <span style={{fontWeight:600,fontSize:13}}>No {filter} bookings</span>
                        <span style={{fontSize:11}}>AI creates bookings automatically from WhatsApp</span>
                        <button onClick={()=>setShowAdd(true)} style={{marginTop:6,padding:"6px 14px",borderRadius:8,background:accentDim,border:`1px solid ${accent}44`,color:accent,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>+ Add manually</button>
                      </div>
                    ) : (
                      filtered.map(b => <BookingCard key={b.id} b={b} />)
                    )}
                  </div>
                </div>

                {/* Detail panel */}
                <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:18}}>
                  {selected ? (
                    <>
                      <div style={{fontWeight:700,fontSize:14,color:text,marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        Booking Details
                        <button onClick={()=>setSelected(null)} style={{background:"transparent",border:"none",color:textFaint,cursor:"pointer",fontSize:18}}>×</button>
                      </div>
                      {selected.booking_date === todayStr && (
                        <div style={{background:accentDim,border:`1px solid ${accent}44`,borderRadius:8,padding:"7px 11px",marginBottom:12,fontSize:12,fontWeight:600,color:accent}}>
                          📅 This booking is TODAY
                        </div>
                      )}
                      {[
                        ["Customer",  selected.customer_name],
                        ["Phone",     selected.customer_phone || "—"],
                        ["Service",   selected.service],
                        ["Date",      formatDate(selected.booking_date)],
                        ["Time",      selected.booking_time || "—"],
                        ["Amount",    selected.amount ? `₹${selected.amount.toLocaleString()}` : "—"],
                        ["Source",    selected.ai_booked ? "◈ AI" : "Manual"],
                        ["Status",    selected.status],
                      ].map(([l,v]) => (
                        <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${border}`}}>
                          <span style={{fontSize:11.5,color:textMuted}}>{l}</span>
                          <span style={{fontSize:12,fontWeight:600,color:l==="Status"?(statusColor[v]||text):text}}>{v}</span>
                        </div>
                      ))}
                      <div style={{display:"flex",gap:7,marginTop:14,flexWrap:"wrap"}}>
                        {selected.status!=="confirmed"  && <button onClick={()=>updateStatus(selected.id,"confirmed")}  style={{flex:1,padding:"8px",background:accentDim,border:`1px solid ${accent}44`,borderRadius:8,color:accent,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>✓ Confirm</button>}
                        {selected.status!=="completed"  && <button onClick={()=>updateStatus(selected.id,"completed")}  style={{flex:1,padding:"8px",background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.25)",borderRadius:8,color:"#a78bfa",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>✓ Done</button>}
                        {selected.status!=="cancelled"  && <button onClick={()=>updateStatus(selected.id,"cancelled")}  style={{padding:"8px 12px",background:"rgba(251,113,133,0.1)",border:"1px solid rgba(251,113,133,0.25)",borderRadius:8,color:"#fb7185",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>✕ Cancel</button>}
                      </div>
                    </>
                  ) : (
                    <div style={{textAlign:"center",padding:"40px 16px"}}>
                      <div style={{fontSize:28,opacity:0.15,marginBottom:10}}>◷</div>
                      <div style={{fontSize:12,color:textFaint,lineHeight:1.7}}>Click any booking<br/>to see details & actions</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Add Booking Modal ── */}
      {showAdd && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.72)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={e=>{if(e.target===e.currentTarget)setShowAdd(false)}}>
          <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:16,padding:28,width:420,display:"flex",flexDirection:"column",gap:12}}>
            <div style={{fontWeight:800,fontSize:16,color:text,marginBottom:2}}>New Booking</div>
            <input placeholder="Customer name *" value={newBk.customer_name} onChange={e=>setNewBk(p=>({...p,customer_name:e.target.value}))} style={{background:dark?"rgba(255,255,255,0.05)":"#f1f5f9",border:`1px solid ${dark?"rgba(255,255,255,0.1)":"#e2e8f0"}`,borderRadius:8,padding:"9px 12px",color:dark?"#eeeef5":"#1e293b",fontSize:13,outline:"none",width:"100%",fontFamily:"'Plus Jakarta Sans',sans-serif"}}/>
            <input placeholder="Phone (with country code)" value={newBk.customer_phone} onChange={e=>setNewBk(p=>({...p,customer_phone:e.target.value}))} style={{background:dark?"rgba(255,255,255,0.05)":"#f1f5f9",border:`1px solid ${dark?"rgba(255,255,255,0.1)":"#e2e8f0"}`,borderRadius:8,padding:"9px 12px",color:dark?"#eeeef5":"#1e293b",fontSize:13,outline:"none",width:"100%",fontFamily:"'Plus Jakarta Sans',sans-serif"}}/>
            <select value={newBk.service} onChange={e=>{
              const svc = services.find(s=>s.name===e.target.value)
              setNewBk(p=>({...p,service:e.target.value,amount:svc?.price?.toString()||p.amount}))
            }} style={{background:dark?"rgba(255,255,255,0.05)":"#f1f5f9",border:`1px solid ${dark?"rgba(255,255,255,0.1)":"#e2e8f0"}`,borderRadius:8,padding:"9px 12px",color:dark?"#eeeef5":"#1e293b",fontSize:13,outline:"none",width:"100%",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              <option value="">Select service *</option>
              {services.map(s=><option key={s.name} value={s.name}>{s.name} — ₹{s.price}</option>)}
              <option value="Other">Other</option>
            </select>
            <input placeholder="Staff member" value={newBk.staff} onChange={e=>setNewBk(p=>({...p,staff:e.target.value}))} style={{background:dark?"rgba(255,255,255,0.05)":"#f1f5f9",border:`1px solid ${dark?"rgba(255,255,255,0.1)":"#e2e8f0"}`,borderRadius:8,padding:"9px 12px",color:dark?"#eeeef5":"#1e293b",fontSize:13,outline:"none",width:"100%",fontFamily:"'Plus Jakarta Sans',sans-serif"}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <input type="date" value={newBk.booking_date} onChange={e=>setNewBk(p=>({...p,booking_date:e.target.value}))} style={{background:dark?"rgba(255,255,255,0.05)":"#f1f5f9",border:`1px solid ${dark?"rgba(255,255,255,0.1)":"#e2e8f0"}`,borderRadius:8,padding:"9px 12px",color:dark?"#eeeef5":"#1e293b",fontSize:13,outline:"none",width:"100%",fontFamily:"'Plus Jakarta Sans',sans-serif"}}/>
              <select value={newBk.booking_time} onChange={e=>setNewBk(p=>({...p,booking_time:e.target.value}))} style={{background:dark?"rgba(255,255,255,0.05)":"#f1f5f9",border:`1px solid ${dark?"rgba(255,255,255,0.1)":"#e2e8f0"}`,borderRadius:8,padding:"9px 12px",color:dark?"#eeeef5":"#1e293b",fontSize:13,outline:"none",width:"100%",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                <option value="">Select time</option>
                {TIMES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <input placeholder="Amount (₹) — auto-filled from service" type="number" value={newBk.amount} onChange={e=>setNewBk(p=>({...p,amount:e.target.value}))} style={{background:dark?"rgba(255,255,255,0.05)":"#f1f5f9",border:`1px solid ${dark?"rgba(255,255,255,0.1)":"#e2e8f0"}`,borderRadius:8,padding:"9px 12px",color:dark?"#eeeef5":"#1e293b",fontSize:13,outline:"none",width:"100%",fontFamily:"'Plus Jakarta Sans',sans-serif"}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setShowAdd(false)} style={{flex:1,padding:"9px",background:inputBg,border:`1px solid ${cardBorder}`,borderRadius:8,color:textMuted,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Cancel</button>
              <button onClick={addBooking} disabled={saving||!newBk.customer_name||!newBk.service||!newBk.booking_date}
                style={{flex:1,padding:"9px",background:accent,border:"none",borderRadius:8,color:"#000",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",opacity:(saving||!newBk.customer_name||!newBk.service||!newBk.booking_date)?0.5:1}}>
                {saving?"Saving...":"Add Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
