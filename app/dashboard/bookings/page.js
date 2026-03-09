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

const BOOKINGS = [
  { id:1, name:"Priya Sharma", service:"Bridal Package", staff:"Ananya", time:"10:00 AM", duration:120, status:"confirmed", date:"today", revenue:8500, aiBooked:true },
  { id:2, name:"Rahul Mehta", service:"Gold Facial", staff:"Riya", time:"11:30 AM", duration:60, status:"confirmed", date:"today", revenue:1500, aiBooked:false },
  { id:3, name:"Sneha Patel", service:"Haircut + Colour", staff:"Ananya", time:"02:00 PM", duration:90, status:"in-progress", date:"today", revenue:2200, aiBooked:true },
  { id:4, name:"Anjali Gupta", service:"Hydra Facial", staff:"Riya", time:"04:00 PM", duration:60, status:"pending", date:"today", revenue:2200, aiBooked:true },
  { id:5, name:"Kavita Nair", service:"Haircut", staff:"Ananya", time:"05:30 PM", duration:30, status:"pending", date:"today", revenue:500, aiBooked:false },
]

const STAFF = [
  { id:"ananya", name:"Ananya", color:"#a78bfa", slots: 8 },
  { id:"riya", name:"Riya", color:"#38bdf8", slots: 6 },
  { id:"raj", name:"Raj", color:"#fb7185", slots: 5 },
]

const TIMES = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30"]

export default function Bookings() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [dark, setDark] = useState(true)
  const [view, setView] = useState("day")
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [today] = useState(new Date())

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

  const statusColor = { confirmed: accent, pending: "#f59e0b", "in-progress": "#38bdf8", cancelled: "#fb7185" }

  const stats = [
    { label:"Today's Revenue", val:"₹14,900", color:accent },
    { label:"Total Bookings", val:"5", color:"#38bdf8" },
    { label:"Confirmed", val:"2", color:accent },
    { label:"Pending", val:"2", color:"#f59e0b" },
    { label:"AI Booked", val:"3", color:"#a78bfa" },
  ]

  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
  const weekDays = Array.from({length:7}, (_,i) => {
    const d = new Date(today)
    const diff = i - today.getDay()
    d.setDate(today.getDate() + diff)
    return d
  })

  const BookingCard = ({b}) => (
    <div onClick={()=>setSelectedBooking(b===selectedBooking?null:b)} style={{
      background: card, border:`1px solid ${statusColor[b.status]}44`,
      borderRadius:10, padding:"11px 13px", cursor:"pointer",
      borderLeft:`3px solid ${statusColor[b.status]}`,
      transition:"transform 0.12s", marginBottom:8
    }}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontWeight:700,fontSize:13,color:text}}>{b.name}</span>
        <span style={{fontSize:10.5,fontWeight:700,color:statusColor[b.status],background:statusColor[b.status]+"15",border:`1px solid ${statusColor[b.status]}33`,borderRadius:100,padding:"2px 8px"}}>
          {b.status.charAt(0).toUpperCase()+b.status.slice(1).replace("-"," ")}
        </span>
      </div>
      <div style={{fontSize:12,color:textMuted,marginBottom:3}}>{b.service} · {b.duration}min</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:11.5,color:textFaint}}>👤 {b.staff} · ⏰ {b.time}</span>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {b.aiBooked && <span style={{fontSize:9.5,fontWeight:700,color:"#a78bfa",background:"rgba(167,139,250,0.12)",border:"1px solid rgba(167,139,250,0.2)",borderRadius:100,padding:"1px 7px"}}>◈ AI</span>}
          <span style={{fontWeight:700,fontSize:12.5,color:accent}}>₹{b.revenue.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: ${bg} !important; color: ${text} !important; font-family: 'Plus Jakarta Sans', sans-serif !important; }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: ${border}; border-radius: 10px; }
        .wrap { display: flex; height: 100vh; overflow: hidden; }
        .sb { width: 224px; flex-shrink: 0; background: ${sidebar}; border-right: 1px solid ${border}; display: flex; flex-direction: column; overflow-y: auto; }
        .sb-logo { padding: 20px 18px 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 19px; color: ${text}; border-bottom: 1px solid ${border}; display: block; text-decoration: none; }
        .sb-logo span { color: ${accent}; }
        .sb-section { padding: 18px 16px 6px; font-size: 9.5px; letter-spacing: 1.4px; text-transform: uppercase; color: ${textFaint}; font-weight: 600; }
        .sb-nav { padding: 3px 8px; }
        .nav-btn { display: flex; align-items: center; gap: 9px; width: 100%; padding: 8px 10px; border-radius: 8px; border: 1px solid transparent; background: transparent; color: ${textMuted}; font-size: 13.5px; font-weight: 500; cursor: pointer; text-align: left; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.12s; margin-bottom: 1px; }
        .nav-btn:hover { background: ${inputBg}; color: ${text}; }
        .nav-btn.active { background: ${accentDim}; border-color: ${accent}33; color: ${accent}; font-weight: 600; }
        .nav-icon { font-size: 12px; width: 16px; text-align: center; flex-shrink: 0; }
        .sb-foot { margin-top: auto; padding: 12px; border-top: 1px solid ${border}; }
        .user-row { display: flex; align-items: center; gap: 8px; padding: 8px 9px; background: ${inputBg}; border: 1px solid ${cardBorder}; border-radius: 9px; margin-bottom: 8px; }
        .user-av { width: 28px; height: 28px; border-radius: 7px; background: linear-gradient(135deg, ${accent}, #38bdf8); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; color: #fff; flex-shrink: 0; }
        .user-em { font-size: 11px; color: ${textMuted}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .logout { width: 100%; padding: 7px; background: transparent; border: 1px solid ${cardBorder}; border-radius: 7px; font-size: 11.5px; color: ${textMuted}; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.12s; }
        .logout:hover { border-color: #fca5a5; color: #ef4444; }
        .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
        .topbar { height: 54px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; background: ${sidebar}; border-bottom: 1px solid ${border}; }
        .tb-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 15px; color: ${text}; }
        .topbar-r { display: flex; align-items: center; gap: 8px; }
        .view-toggle { display: flex; background: ${inputBg}; border: 1px solid ${cardBorder}; border-radius: 8px; padding: 2px; gap: 1px; }
        .vt-btn { padding: 4px 12px; border-radius: 6px; font-size: 11.5px; font-weight: 600; cursor: pointer; border: none; background: transparent; color: ${textMuted}; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.12s; }
        .vt-btn.active { background: ${card}; color: ${text}; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
        .theme-toggle { display: flex; align-items: center; gap: 6px; padding: 5px 10px; background: ${inputBg}; border: 1px solid ${cardBorder}; border-radius: 8px; cursor: pointer; font-size: 11.5px; color: ${textMuted}; font-family: 'Plus Jakarta Sans', sans-serif; }
        .toggle-pill { width: 30px; height: 16px; border-radius: 100px; background: ${dark?accent:"#d1d5db"}; position: relative; flex-shrink: 0; transition: background 0.2s; }
        .toggle-pill::after { content:''; position:absolute; top:2px; width:12px; height:12px; border-radius:50%; background:#fff; transition:left 0.2s; left:${dark?"16px":"2px"}; }

        .content { flex: 1; overflow-y: auto; padding: 18px 22px; display: flex; flex-direction: column; gap: 14px; background: ${bg}; }
        .stats-row { display: grid; grid-template-columns: repeat(5,1fr); gap: 11px; }
        .stat { background: ${card}; border: 1px solid ${cardBorder}; border-radius: 11px; padding: 13px 15px; }
        .stat-label { font-size: 11px; color: ${textMuted}; margin-bottom: 5px; }
        .stat-val { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 22px; }

        .bk-grid { display: grid; grid-template-columns: 1fr 280px; gap: 14px; flex: 1; min-height: 0; }
        .main-card { background: ${card}; border: 1px solid ${cardBorder}; border-radius: 13px; overflow: hidden; display: flex; flex-direction: column; }
        .card-head { padding: 14px 16px; border-bottom: 1px solid ${border}; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
        .card-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 13.5px; color: ${text}; }
        .card-body { flex: 1; overflow-y: auto; padding: 14px; }

        .week-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
        .week-day { text-align: center; }
        .wd-name { font-size: 10.5px; color: ${textFaint}; margin-bottom: 5px; font-weight: 600; }
        .wd-num { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.12s; }
        .wd-num.today { background: ${accent}; color: #fff; }
        .wd-event { font-size: 9.5px; padding: 2px 5px; border-radius: 4px; margin-bottom: 2px; font-weight: 600; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .time-grid { display: grid; gap: 0; }
        .time-row { display: flex; align-items: stretch; min-height: 36px; border-bottom: 1px solid ${border}; }
        .time-label { width: 55px; flex-shrink: 0; font-size: 10.5px; color: ${textFaint}; padding: 8px 10px 0 0; text-align: right; }
        .time-slot { flex: 1; padding: 3px 6px; }
        .slot-event { border-radius: 6px; padding: 5px 8px; font-size: 11.5px; font-weight: 600; border-left: 3px solid; }

        .detail-card { background: ${card}; border: 1px solid ${cardBorder}; border-radius: 13px; padding: 16px; }
        .detail-head { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 13px; color: ${text}; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid ${border}; }
        .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px solid ${border}; }
        .detail-row:last-child { border-bottom: none; }
        .dl { font-size: 11.5px; color: ${textMuted}; }
        .dv { font-size: 12px; font-weight: 600; color: ${text}; }

        @media (max-width: 1200px) { .stats-row { grid-template-columns: repeat(3,1fr); } .bk-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="wrap">
        <aside className="sb">
          <a href="/dashboard" className="sb-logo">fast<span>rill</span></a>
          <div className="sb-section">Platform</div>
          <div className="sb-nav">
            {NAV.map(item => (
              <button key={item.id} className={`nav-btn${item.id==="bookings"?" active":""}`} onClick={()=>router.push(item.path)}>
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          <div className="sb-foot">
            <div className="user-row">
              <div className="user-av">{userInitial}</div>
              <div className="user-em">{userEmail||"Loading..."}</div>
            </div>
            <button className="logout" onClick={handleLogout}>↩ Sign out</button>
          </div>
        </aside>

        <div className="main">
          <div className="topbar">
            <span className="tb-title">Bookings</span>
            <div className="topbar-r">
              <div className="view-toggle">
                {["day","week","list"].map(v=>(
                  <button key={v} className={`vt-btn${view===v?" active":""}`} onClick={()=>setView(v)}>
                    {v.charAt(0).toUpperCase()+v.slice(1)}
                  </button>
                ))}
              </div>
              <button className="theme-toggle" onClick={toggleTheme}>
                <span>{dark?"🌙":"☀️"}</span>
                <div className="toggle-pill"/>
                <span>{dark?"Dark":"Light"}</span>
              </button>
            </div>
          </div>

          <div className="content">
            <div className="stats-row">
              {stats.map(s=>(
                <div key={s.label} className="stat">
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-val" style={{color:s.color}}>{s.val}</div>
                </div>
              ))}
            </div>

            <div className="bk-grid">
              <div className="main-card">
                <div className="card-head">
                  <div className="card-title">
                    {view==="day" && `Today — ${today.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}`}
                    {view==="week" && "This Week"}
                    {view==="list" && "All Bookings"}
                  </div>
                </div>
                <div className="card-body">
                  {view==="list" && (
                    <div>
                      {["in-progress","confirmed","pending"].map(s=>(
                        <div key={s} style={{marginBottom:18}}>
                          <div style={{fontSize:10.5,letterSpacing:1.2,textTransform:"uppercase",color:statusColor[s],fontWeight:700,marginBottom:8}}>
                            ● {s.replace("-"," ").toUpperCase()}
                          </div>
                          {BOOKINGS.filter(b=>b.status===s).map(b=><BookingCard key={b.id} b={b}/>)}
                          {BOOKINGS.filter(b=>b.status===s).length===0 && <div style={{fontSize:12,color:textFaint,padding:"8px 0"}}>No bookings</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {view==="day" && (
                    <div className="time-grid">
                      {TIMES.map(t=>{
                        const bk = BOOKINGS.find(b=>b.time===t+" AM"||b.time===t+" PM"||b.time.startsWith(t))
                        return (
                          <div key={t} className="time-row">
                            <div className="time-label">{t}</div>
                            <div className="time-slot">
                              {bk && (
                                <div className="slot-event" style={{background:statusColor[bk.status]+"15",borderColor:statusColor[bk.status],color:text,cursor:"pointer"}}
                                  onClick={()=>setSelectedBooking(bk===selectedBooking?null:bk)}>
                                  {bk.name} — {bk.service}
                                  {bk.aiBooked && <span style={{marginLeft:6,fontSize:9.5,color:"#a78bfa"}}>◈ AI</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {view==="week" && (
                    <div className="week-grid">
                      {weekDays.map((d,i)=>(
                        <div key={i} className="week-day">
                          <div className="wd-name">{days[d.getDay()]}</div>
                          <div className={`wd-num${d.toDateString()===today.toDateString()?" today":""}`} style={{color:d.toDateString()===today.toDateString()?"#fff":textMuted}}>
                            {d.getDate()}
                          </div>
                          {d.toDateString()===today.toDateString() && BOOKINGS.slice(0,3).map(b=>(
                            <div key={b.id} className="wd-event" style={{background:statusColor[b.status]+"18",color:statusColor[b.status]}}>
                              {b.time.split(" ")[0]} {b.name.split(" ")[0]}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Detail panel */}
              <div>
                {selectedBooking ? (
                  <div className="detail-card">
                    <div className="detail-head">
                      Booking Details
                      <button onClick={()=>setSelectedBooking(null)} style={{float:"right",background:"transparent",border:"none",color:textFaint,cursor:"pointer",fontSize:16}}>×</button>
                    </div>
                    {[
                      ["Customer", selectedBooking.name],
                      ["Service", selectedBooking.service],
                      ["Staff", selectedBooking.staff],
                      ["Time", selectedBooking.time],
                      ["Duration", selectedBooking.duration+" min"],
                      ["Revenue", "₹"+selectedBooking.revenue.toLocaleString()],
                      ["Status", selectedBooking.status.replace("-"," ")],
                      ["Booked by", selectedBooking.aiBooked?"◈ AI":"Manual"],
                    ].map(([l,v])=>(
                      <div key={l} className="detail-row">
                        <span className="dl">{l}</span>
                        <span className="dv" style={l==="Status"?{color:statusColor[selectedBooking.status]}:{}}>{v}</span>
                      </div>
                    ))}
                    <div style={{display:"flex",gap:7,marginTop:12}}>
                      <button style={{flex:1,padding:"7px",background:accentDim,border:`1px solid ${accent}44`,borderRadius:7,color:accent,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>✓ Confirm</button>
                      <button style={{flex:1,padding:"7px",background:"rgba(251,113,133,0.1)",border:"1px solid rgba(251,113,133,0.25)",borderRadius:7,color:"#fb7185",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>✕ Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="detail-card" style={{textAlign:"center",padding:"30px 16px"}}>
                    <div style={{fontSize:28,opacity:0.2,marginBottom:8}}>◷</div>
                    <div style={{fontSize:12,color:textFaint,lineHeight:1.6}}>Click any booking<br/>to see details</div>
                    <div style={{marginTop:20}}>
                      <div style={{fontSize:11,color:textFaint,marginBottom:8,fontWeight:600,letterSpacing:1,textTransform:"uppercase"}}>Staff</div>
                      {STAFF.map(s=>(
                        <div key={s.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:`1px solid ${border}`}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:s.color,flexShrink:0}}/>
                          <span style={{fontSize:12.5,color:text,flex:1,fontWeight:500}}>{s.name}</span>
                          <span style={{fontSize:11,color:textFaint}}>{s.slots} slots</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
