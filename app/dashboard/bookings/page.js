"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const NAV = [
  { id:"overview", label:"Revenue Engine", icon:"◈", path:"/dashboard" },
  { id:"inbox", label:"Conversations", icon:"◎", path:"/dashboard/conversations" },
  { id:"bookings", label:"Bookings", icon:"◷", path:"/dashboard/bookings" },
  { id:"campaigns", label:"Campaigns", icon:"◆", path:"/dashboard/campaigns" },
  { id:"leads", label:"Lead Recovery", icon:"◉", path:"/dashboard/leads" },
  { id:"contacts", label:"Customers", icon:"◑", path:"/dashboard/contacts" },
  { id:"analytics", label:"Analytics", icon:"◫", path:"/dashboard/analytics" },
  { id:"settings", label:"Settings", icon:"◌", path:"/dashboard/settings" },
]

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const SLOTS = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30"]
const STAFF = [{name:"All Staff",color:"#00c47d"},{name:"Ananya",color:"#0ea5e9"},{name:"Riya",color:"#f59e0b"},{name:"Raj",color:"#7c3aed"}]
const BOOKINGS = [
  {id:1,customer:"Priya Sharma",phone:"+91 98765 43210",service:"Women's Haircut",staff:"Ananya",time:"10:00",duration:30,status:"confirmed",revenue:350,avatar:"P",source:"WhatsApp AI"},
  {id:2,customer:"Meera Nair",phone:"+91 54321 09876",service:"Facial",staff:"Ananya",time:"11:00",duration:60,status:"confirmed",revenue:600,avatar:"M",source:"WhatsApp AI"},
  {id:3,customer:"Sneha Patel",phone:"+91 76543 21098",service:"Bridal Package",staff:"Riya",time:"13:00",duration:120,status:"in-progress",revenue:8000,avatar:"S",source:"Walk-in"},
  {id:4,customer:"Kiran Reddy",phone:"+91 65432 10987",service:"Men's Haircut",staff:"Raj",time:"15:00",duration:30,status:"pending",revenue:200,avatar:"K",source:"WhatsApp AI"},
  {id:5,customer:"Rahul Verma",phone:"+91 87654 32109",service:"Hair Colour",staff:"Riya",time:"16:00",duration:90,status:"pending",revenue:1500,avatar:"R",source:"WhatsApp AI"},
]

export default function BookingsPage() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [dark, setDark] = useState(true)
  const [view, setView] = useState("day")
  const [selDate, setSelDate] = useState(new Date())
  const [selBooking, setSelBooking] = useState(null)
  const [staffFilter, setStaffFilter] = useState("All Staff")

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
  const changeDate = (d) => { const nd = new Date(selDate); nd.setDate(nd.getDate()+d); setSelDate(nd) }
  const formatDate = (d) => `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`

  const filtered = staffFilter==="All Staff" ? BOOKINGS : BOOKINGS.filter(b=>b.staff===staffFilter)
  const totalRev = BOOKINGS.reduce((s,b)=>s+b.revenue,0)
  const statusColor = (s) => ({confirmed:"#00c47d","in-progress":"#0ea5e9",pending:"#f59e0b",cancelled:"#ef4444"}[s]||"#6b7280")
  const statusLabel = (s) => ({confirmed:"Confirmed","in-progress":"In Progress",pending:"Pending",cancelled:"Cancelled"}[s]||s)
  const staffColor = (n) => STAFF.find(s=>s.name===n)?.color||"#6b7280"

  const getWeekDates = () => {
    const w=[]; const s=new Date(selDate); s.setDate(s.getDate()-s.getDay())
    for(let i=0;i<7;i++){const d=new Date(s);d.setDate(s.getDate()+i);w.push(d)}
    return w
  }

  const t = dark ? {
    bg:"#0a0a0f",sidebar:"#0f0f17",border:"rgba(255,255,255,0.06)",card:"#0f0f17",
    cardBorder:"rgba(255,255,255,0.07)",text:"#e8e8f0",textMuted:"rgba(255,255,255,0.4)",
    textFaint:"rgba(255,255,255,0.2)",navActive:"rgba(0,196,125,0.1)",
    navActiveBorder:"rgba(0,196,125,0.2)",navActiveText:"#00c47d",
    navText:"rgba(255,255,255,0.45)",inputBg:"rgba(255,255,255,0.04)",
  } : {
    bg:"#f4f5f7",sidebar:"#ffffff",border:"rgba(0,0,0,0.07)",card:"#ffffff",
    cardBorder:"rgba(0,0,0,0.08)",text:"#111827",textMuted:"rgba(0,0,0,0.45)",
    textFaint:"rgba(0,0,0,0.25)",navActive:"rgba(0,180,115,0.08)",
    navActiveBorder:"rgba(0,180,115,0.2)",navActiveText:"#00935a",
    navText:"rgba(0,0,0,0.45)",inputBg:"rgba(0,0,0,0.03)",
  }
  const accent = dark ? "#00c47d" : "#00935a"
  const userInitial = userEmail ? userEmail[0].toUpperCase() : "G"

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
        .topbar-left{display:flex;align-items:center;gap:10px;}
        .topbar-title{font-weight:700;font-size:15px;color:${t.text};}
        .topbar-right{display:flex;align-items:center;gap:10px;}
        .theme-btn{display:flex;align-items:center;gap:7px;padding:5px 11px;border-radius:8px;background:${t.inputBg};border:1px solid ${t.cardBorder};cursor:pointer;font-size:12px;color:${t.textMuted};font-family:'Plus Jakarta Sans',sans-serif;font-weight:500;}
        .pill{width:32px;height:18px;border-radius:100px;background:${dark?accent:"#d1d5db"};position:relative;transition:background 0.2s;flex-shrink:0;}
        .pill::after{content:'';position:absolute;top:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:left 0.2s;left:${dark?"16px":"2px"};}
        .nav-btn{width:28px;height:28px;border-radius:7px;background:${t.inputBg};border:1px solid ${t.cardBorder};color:${t.textMuted};cursor:pointer;font-size:13px;}
        .date-lbl{font-weight:700;font-size:13px;color:${t.text};min-width:160px;text-align:center;}
        .today-btn{padding:4px 12px;border-radius:7px;background:${accent}18;border:1px solid ${accent}33;color:${accent};font-size:11.5px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .view-tabs{display:flex;gap:0;background:${t.inputBg};border:1px solid ${t.cardBorder};border-radius:9px;padding:3px;}
        .vtab{padding:5px 13px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;border:none;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.12s;}
        .bk-root{display:flex;flex-direction:column;flex:1;overflow:hidden;}
        .stats-bar{display:flex;gap:10px;padding:12px 20px;border-bottom:1px solid ${t.border};background:${t.bg};flex-shrink:0;flex-wrap:wrap;}
        .stat-chip{display:flex;align-items:center;gap:8px;padding:7px 13px;border-radius:9px;background:${t.card};border:1px solid ${t.cardBorder};}
        .stat-v{font-weight:700;font-size:15px;}
        .stat-l{font-size:11px;color:${t.textMuted};}
        .bk-body{display:flex;flex:1;overflow:hidden;}
        .staff-col{width:170px;flex-shrink:0;border-right:1px solid ${t.border};padding:14px 10px;background:${t.sidebar};overflow-y:auto;}
        .staff-title{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:${t.textFaint};font-weight:600;margin-bottom:10px;}
        .staff-btn{display:flex;align-items:center;gap:8px;width:100%;padding:8px 10px;border-radius:8px;border:none;background:transparent;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:12.5px;color:${t.navText};font-weight:500;transition:all 0.12s;text-align:left;margin-bottom:2px;}
        .staff-btn:hover{background:${t.inputBg};color:${t.text};}
        .staff-btn.active{background:${t.inputBg};color:${t.text};font-weight:600;}
        .sdot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
        .cap-box{padding:10px;border-radius:9px;background:${accent}08;border:1px solid ${accent}18;margin-top:12px;}
        .cap-title{font-size:10px;color:${t.textFaint};font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;}
        .cap-row{display:flex;justify-content:space-between;font-size:11px;color:${t.textMuted};margin-bottom:3px;}
        .cap-val{color:${accent};font-weight:700;}
        .day-view{flex:1;overflow-y:auto;}
        .day-view::-webkit-scrollbar{width:3px;}
        .time-row{display:flex;min-height:52px;border-bottom:1px solid ${t.border};}
        .time-row:hover{background:${t.inputBg};}
        .time-lbl{width:60px;flex-shrink:0;padding:6px 10px 0;font-size:11px;color:${t.textFaint};text-align:right;}
        .slot-area{flex:1;padding:4px 10px;display:flex;flex-wrap:wrap;gap:6px;align-items:flex-start;}
        .bk-chip{display:flex;align-items:center;gap:8px;padding:7px 11px;border-radius:9px;cursor:pointer;transition:all 0.15s;min-width:190px;max-width:300px;}
        .bk-chip:hover{transform:translateY(-1px);}
        .bk-av{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;color:#fff;flex-shrink:0;}
        .bk-name{font-size:12px;font-weight:600;color:${t.text};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .bk-svc{font-size:11px;color:${t.textMuted};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .bk-rev{font-weight:700;font-size:12px;color:${accent};flex-shrink:0;}
        .week-view{flex:1;overflow:auto;}
        .week-hdr{display:grid;grid-template-columns:60px repeat(7,1fr);border-bottom:1px solid ${t.border};background:${t.sidebar};position:sticky;top:0;z-index:10;}
        .week-hdr-cell{padding:9px 6px;text-align:center;border-right:1px solid ${t.border};cursor:pointer;}
        .wdn{font-size:10px;color:${t.textFaint};font-weight:600;text-transform:uppercase;letter-spacing:1px;}
        .wdd{font-weight:700;font-size:17px;color:${t.textMuted};margin-top:1px;}
        .wdd.today{color:${accent};}
        .week-body{display:grid;grid-template-columns:60px repeat(7,1fr);}
        .wtl{padding:6px 10px 0;font-size:11px;color:${t.textFaint};text-align:right;border-right:1px solid ${t.border};min-height:48px;}
        .wcell{border-right:1px solid ${t.border};border-bottom:1px solid ${t.border};min-height:48px;padding:3px;}
        .wcell:hover{background:${t.inputBg};}
        .wbk{padding:3px 6px;border-radius:5px;font-size:10.5px;font-weight:600;color:${t.text};margin-bottom:2px;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .list-view{flex:1;overflow-y:auto;padding:16px 20px;}
        .list-section{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:${t.textFaint};font-weight:600;margin-bottom:9px;margin-top:18px;}
        .list-section:first-child{margin-top:0;}
        .list-card{display:flex;align-items:center;gap:13px;padding:13px 15px;background:${t.card};border:1px solid ${t.cardBorder};border-radius:11px;margin-bottom:7px;cursor:pointer;transition:all 0.15s;}
        .list-card:hover{border-color:${accent}33;transform:translateX(2px);}
        .list-av{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;background:linear-gradient(135deg,${accent}30,#0ea5e930);color:${t.text};flex-shrink:0;}
        .list-name{font-size:13px;font-weight:600;color:${t.text};margin-bottom:3px;}
        .list-meta{font-size:11.5px;color:${t.textMuted};display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
        .ai-tag{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:100px;background:${accent}10;border:1px solid ${accent}20;color:${accent};font-size:10px;font-weight:600;}
        .list-time{font-weight:700;font-size:14px;color:${t.text};}
        .list-rev{font-weight:700;font-size:13px;color:${accent};}
        .sbadge{padding:2px 9px;border-radius:100px;font-size:10px;font-weight:700;}
        .detail-panel{width:280px;flex-shrink:0;border-left:1px solid ${t.border};background:${t.sidebar};overflow-y:auto;padding:18px;}
        .dp-title{font-weight:700;font-size:13.5px;color:${t.text};margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;}
        .close-btn{width:24px;height:24px;border-radius:6px;background:${t.inputBg};border:none;color:${t.textMuted};cursor:pointer;font-size:14px;}
        .dp-av{width:52px;height:52px;border-radius:13px;background:linear-gradient(135deg,${accent}40,#0ea5e940);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px;color:${t.text};margin:0 auto 12px;}
        .dp-name{font-weight:700;font-size:17px;color:${t.text};text-align:center;margin-bottom:3px;}
        .dp-phone{font-size:11.5px;color:${t.textMuted};text-align:center;margin-bottom:14px;}
        .dp-rev{font-weight:800;font-size:30px;color:${accent};text-align:center;margin:12px 0;letter-spacing:-0.5px;}
        .dp-lbl{font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${t.textFaint};font-weight:600;margin-bottom:7px;}
        .dp-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid ${t.border};font-size:12.5px;}
        .dp-rl{color:${t.textMuted};}
        .dp-rv{color:${t.text};font-weight:600;}
        .dp-actions{display:flex;flex-direction:column;gap:7px;margin-top:14px;}
        .act-btn{width:100%;padding:9px;border-radius:9px;font-weight:700;font-size:12.5px;cursor:pointer;transition:all 0.15s;border:none;font-family:'Plus Jakarta Sans',sans-serif;}
        @media(max-width:768px){.sidebar{display:none;}}
      `}</style>

      <div className="root">
        <aside className="sidebar">
          <a href="/dashboard" className="logo">fast<span>rill</span></a>
          <div className="nav-section">Platform</div>
          {NAV.map(item => (
            <button key={item.id} className={`nav-item${item.id==="bookings"?" active":""}`} onClick={() => router.push(item.path)}>
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
              <div className="topbar-title">Bookings</div>
              <button className="nav-btn" onClick={()=>changeDate(-1)}>‹</button>
              <span className="date-lbl">{formatDate(selDate)}</span>
              <button className="nav-btn" onClick={()=>changeDate(1)}>›</button>
              <button className="today-btn" onClick={()=>setSelDate(new Date())}>Today</button>
              <div className="view-tabs">
                {["day","week","list"].map(v => (
                  <button key={v} className="vtab" onClick={()=>setView(v)}
                    style={{background:view===v?accent:"transparent",color:view===v?"#000":t.textMuted}}>
                    {v.charAt(0).toUpperCase()+v.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="topbar-right">
              <button className="theme-btn" onClick={toggleTheme}>
                <span>{dark?"🌙":"☀️"}</span><div className="pill"/><span>{dark?"Dark":"Light"}</span>
              </button>
            </div>
          </div>

          <div className="bk-root">
            <div className="stats-bar">
              {[
                {label:"Today's Revenue",val:`₹${totalRev.toLocaleString()}`,color:accent},
                {label:"Total Bookings",val:BOOKINGS.length,color:"#0ea5e9"},
                {label:"Confirmed",val:BOOKINGS.filter(b=>b.status==="confirmed").length,color:accent},
                {label:"Pending",val:BOOKINGS.filter(b=>b.status==="pending").length,color:"#f59e0b"},
                {label:"Booked via AI",val:BOOKINGS.filter(b=>b.source==="WhatsApp AI").length,color:"#7c3aed"},
              ].map(s => (
                <div key={s.label} className="stat-chip">
                  <div className="stat-v" style={{color:s.color}}>{s.val}</div>
                  <div className="stat-l">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="bk-body">
              <div className="staff-col">
                <div className="staff-title">Filter by Staff</div>
                {STAFF.map(s => (
                  <button key={s.name} className={`staff-btn${staffFilter===s.name?" active":""}`} onClick={()=>setStaffFilter(s.name)}>
                    <div className="sdot" style={{background:s.color}}/>{s.name}
                  </button>
                ))}
                <div className="cap-box">
                  <div className="cap-title">Capacity Today</div>
                  {STAFF.slice(1).map(s => (
                    <div key={s.name} className="cap-row">
                      <span style={{color:s.color}}>{s.name}</span>
                      <span className="cap-val">{BOOKINGS.filter(b=>b.staff===s.name).length} booked</span>
                    </div>
                  ))}
                </div>
              </div>

              {view==="day" && (
                <div className="day-view">
                  {SLOTS.map(time => {
                    const bks = filtered.filter(b=>b.time===time)
                    return (
                      <div key={time} className="time-row">
                        <div className="time-lbl">{time}</div>
                        <div className="slot-area">
                          {bks.map(b => (
                            <div key={b.id} className="bk-chip"
                              style={{background:statusColor(b.status)+"12",borderColor:statusColor(b.status)+"30",border:"1px solid"}}
                              onClick={()=>setSelBooking(b)}>
                              <div className="bk-av" style={{background:staffColor(b.staff)+"80"}}>{b.avatar}</div>
                              <div style={{flex:1,minWidth:0}}>
                                <div className="bk-name">{b.customer}</div>
                                <div className="bk-svc">{b.service} · {b.staff}</div>
                              </div>
                              <div className="bk-rev">₹{b.revenue}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {view==="week" && (
                <div className="week-view">
                  <div className="week-hdr">
                    <div style={{padding:"9px 6px",borderRight:`1px solid ${t.border}`}}/>
                    {getWeekDates().map((d,i) => (
                      <div key={i} className="week-hdr-cell" onClick={()=>{setSelDate(d);setView("day")}}>
                        <div className="wdn">{DAYS[d.getDay()]}</div>
                        <div className={`wdd${d.toDateString()===new Date().toDateString()?" today":""}`}>{d.getDate()}</div>
                      </div>
                    ))}
                  </div>
                  <div className="week-body">
                    {SLOTS.map(time => (
                      <>
                        <div key={`t${time}`} className="wtl">{time}</div>
                        {getWeekDates().map((d,i) => (
                          <div key={`${time}-${i}`} className="wcell">
                            {BOOKINGS.filter(b=>b.time===time).map(b => (
                              <div key={b.id} className="wbk"
                                style={{background:statusColor(b.status)+"18",borderLeft:`3px solid ${statusColor(b.status)}`}}
                                onClick={()=>setSelBooking(b)}>
                                {b.customer.split(" ")[0]}
                              </div>
                            ))}
                          </div>
                        ))}
                      </>
                    ))}
                  </div>
                </div>
              )}

              {view==="list" && (
                <div className="list-view">
                  {["in-progress","confirmed","pending"].map(status => {
                    const grp = filtered.filter(b=>b.status===status)
                    if(!grp.length) return null
                    return (
                      <div key={status}>
                        <div className="list-section">{status==="in-progress"?"🔵 In Progress":status==="confirmed"?"✅ Confirmed":"⏳ Pending"}</div>
                        {grp.map(b => (
                          <div key={b.id} className="list-card" onClick={()=>setSelBooking(b)}>
                            <div className="list-av">{b.avatar}</div>
                            <div style={{flex:1}}>
                              <div className="list-name">{b.customer}</div>
                              <div className="list-meta">
                                <span>{b.service}</span>
                                <span style={{color:staffColor(b.staff)}}>{b.staff}</span>
                                <span>{b.duration} min</span>
                                {b.source==="WhatsApp AI" && <span className="ai-tag">◈ AI Booked</span>}
                              </div>
                            </div>
                            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                              <div className="list-time">{b.time}</div>
                              <div className="list-rev">₹{b.revenue.toLocaleString()}</div>
                              <div className="sbadge" style={{background:statusColor(b.status)+"15",color:statusColor(b.status)}}>{statusLabel(b.status)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}

              {selBooking && (
                <div className="detail-panel">
                  <div className="dp-title">Booking Details <button className="close-btn" onClick={()=>setSelBooking(null)}>×</button></div>
                  <div className="dp-av">{selBooking.avatar}</div>
                  <div className="dp-name">{selBooking.customer}</div>
                  <div className="dp-phone">{selBooking.phone}</div>
                  <div className="dp-rev">₹{selBooking.revenue.toLocaleString()}</div>
                  <div className="dp-lbl">Appointment Info</div>
                  {[
                    {label:"Service",val:selBooking.service},
                    {label:"Staff",val:selBooking.staff},
                    {label:"Time",val:selBooking.time},
                    {label:"Duration",val:`${selBooking.duration} min`},
                    {label:"Status",val:statusLabel(selBooking.status)},
                    {label:"Source",val:selBooking.source},
                  ].map(r => (
                    <div key={r.label} className="dp-row">
                      <span className="dp-rl">{r.label}</span>
                      <span className="dp-rv" style={r.label==="Status"?{color:statusColor(selBooking.status)}:{}}>{r.val}</span>
                    </div>
                  ))}
                  <div className="dp-actions">
                    {selBooking.status==="pending" && <button className="act-btn" style={{background:accent,color:"#000"}}>✓ Confirm Booking</button>}
                    <button className="act-btn" style={{background:"rgba(37,211,102,0.1)",border:"1px solid rgba(37,211,102,0.2)",color:"#25d366"}}>💬 Message on WhatsApp</button>
                    <button className="act-btn" style={{background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.15)",color:"#ef4444"}}>✕ Cancel Booking</button>
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
