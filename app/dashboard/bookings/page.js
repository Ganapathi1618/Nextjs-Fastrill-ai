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

const TIMES = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30"]
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]

export default function Bookings() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [userId, setUserId] = useState(null)
  const [dark, setDark] = useState(true)
  const [view, setView] = useState("list")
  const [bookings, setBookings] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [showAdd, setShowAdd] = useState(false)
  const [services, setServices] = useState([])
  const [stats, setStats] = useState({ total:0, confirmed:0, pending:0, revenue:0, ai:0 })
  const [today] = useState(new Date())
  const [newBooking, setNewBooking] = useState({ customer_name:"", customer_phone:"", service:"", staff:"", booking_date:"", booking_time:"", amount:"" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login")
      else { setUserEmail(data.user.email||""); setUserId(data.user.id) }
    })
  }, [])

  useEffect(() => { if (userId) { loadBookings(); loadServices() } }, [userId])

  async function loadBookings() {
    setLoading(true)
    const today = new Date().toISOString().split("T")[0]
    const { data } = await supabase.from("bookings").select("*").eq("user_id", userId).gte("booking_date", today).order("booking_date").order("booking_time")
    const list = data || []
    setBookings(list)
    setStats({
      total: list.length,
      confirmed: list.filter(b=>b.status==="confirmed").length,
      pending: list.filter(b=>b.status==="pending").length,
      revenue: list.reduce((s,b)=>s+(b.amount||0),0),
      ai: list.filter(b=>b.ai_booked).length
    })
    setLoading(false)
  }

  async function loadServices() {
    const { data } = await supabase.from("services").select("name,price").eq("user_id", userId)
    setServices(data||[])
  }

  async function updateStatus(id, status) {
    await supabase.from("bookings").update({ status }).eq("id", id)
    setBookings(prev => prev.map(b => b.id===id ? {...b, status} : b))
    if (selected?.id===id) setSelected(prev=>({...prev, status}))
    setStats(prev => ({...prev,
      confirmed: status==="confirmed" ? prev.confirmed+1 : prev.confirmed-(selected?.status==="confirmed"?1:0),
      pending: status==="pending" ? prev.pending+1 : prev.pending-(selected?.status==="pending"?1:0)
    }))
  }

  async function addBooking() {
    if (!newBooking.customer_name || !newBooking.service || !newBooking.booking_date) return
    setSaving(true)
    const { data } = await supabase.from("bookings").insert({
      ...newBooking, user_id: userId, status: "pending", ai_booked: false,
      amount: parseInt(newBooking.amount)||0
    }).select().single()
    if (data) { setBookings(prev=>[...prev, data]); setShowAdd(false); setNewBooking({ customer_name:"", customer_phone:"", service:"", staff:"", booking_date:"", booking_time:"", amount:"" }) }
    setSaving(false)
  }

  const toggleTheme = () => { const n=!dark; setDark(n); localStorage.setItem("fastrill-theme",n?"dark":"light") }
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login") }

  const bg=dark?"#08080e":"#f0f2f5", sidebar=dark?"#0c0c15":"#ffffff", card=dark?"#0f0f1a":"#ffffff"
  const border=dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.08)", cardBorder=dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.09)"
  const text=dark?"#eeeef5":"#111827", textMuted=dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const textFaint=dark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.25)", inputBg=dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"
  const accent=dark?"#00d084":"#00935a", navText=dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const navActive=dark?"rgba(0,196,125,0.1)":"rgba(0,180,115,0.08)", navActiveBorder=dark?"rgba(0,196,125,0.2)":"rgba(0,180,115,0.2)"
  const navActiveText=dark?"#00c47d":"#00935a", accentDim=dark?"rgba(0,208,132,0.12)":"rgba(0,147,90,0.1)"
  const userInitial=userEmail?userEmail[0].toUpperCase():"G"

  const statusColor = { confirmed:accent, pending:"#f59e0b", "in-progress":"#38bdf8", completed:"#a78bfa", cancelled:"#fb7185" }
  const weekDays = Array.from({length:7}, (_,i) => { const d=new Date(today); d.setDate(today.getDate()-today.getDay()+i); return d })

  const filtered = filter==="all" ? bookings : bookings.filter(b=>b.status===filter)

  const inp = { background:inputBg, border:`1px solid ${cardBorder}`, borderRadius:8, padding:"9px 12px", fontSize:13, color:text, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none", width:"100%" }

  const BookingCard = ({b}) => (
    <div onClick={()=>setSelected(b===selected?null:b)} style={{background:card, border:`1px solid ${statusColor[b.status]||textFaint}44`, borderRadius:10, padding:"11px 13px", cursor:"pointer", borderLeft:`3px solid ${statusColor[b.status]||textFaint}`, marginBottom:8, transition:"transform 0.12s"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontWeight:700,fontSize:13,color:text}}>{b.customer_name}</span>
        <span style={{fontSize:10.5,fontWeight:700,color:statusColor[b.status],background:statusColor[b.status]+"15",border:`1px solid ${statusColor[b.status]}33`,borderRadius:100,padding:"2px 8px"}}>{b.status}</span>
      </div>
      <div style={{fontSize:12,color:textMuted,marginBottom:3}}>{b.service} {b.staff?`· ${b.staff}`:""} {b.booking_time?`· ${b.booking_time}`:""}</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:11,color:textFaint}}>{b.booking_date}</span>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {b.ai_booked && <span style={{fontSize:9.5,fontWeight:700,color:"#a78bfa",background:"rgba(167,139,250,0.12)",border:"1px solid rgba(167,139,250,0.2)",borderRadius:100,padding:"1px 7px"}}>◈ AI</span>}
          {b.amount>0 && <span style={{fontWeight:700,fontSize:12.5,color:accent}}>₹{b.amount.toLocaleString()}</span>}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${bg}!important;color:${text}!important;font-family:'Plus Jakarta Sans',sans-serif!important;}
        .wrap{display:flex;height:100vh;overflow:hidden;background:${bg};}
        .sidebar{width:224px;flex-shrink:0;background:${sidebar};border-right:1px solid ${border};display:flex;flex-direction:column;overflow-y:auto;}
        .logo{padding:22px 20px 18px;font-weight:800;font-size:20px;color:${text};text-decoration:none;display:block;border-bottom:1px solid ${border};}
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
        .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;gap:8px;color:${textFaint};}
        select{color-scheme:dark;background-color:inherit;}
        select option{background-color:#0c0c15!important;color:#eeeef5!important;}
        select:focus{outline:none;}
      `}</style>

      <div className="wrap">
        <aside className="sidebar">
          <a href="/dashboard" className="logo">fast<span>rill</span></a>
          <div className="nav-section">Platform</div>
          {NAV.map(item=>(
            <button key={item.id} className={`nav-item${item.id==="bookings"?" active":""}`} onClick={()=>router.push(item.path)}>
              <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
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
            <span className="tb-title">Bookings</span>
            <div className="topbar-r">
              <div style={{display:"flex",background:inputBg,border:`1px solid ${cardBorder}`,borderRadius:8,padding:2,gap:1}}>
                {["list","week"].map(v=>(
                  <button key={v} onClick={()=>setView(v)} style={{padding:"4px 12px",borderRadius:6,fontSize:11.5,fontWeight:600,cursor:"pointer",border:"none",background:view===v?card:"transparent",color:view===v?text:textMuted,fontFamily:"'Plus Jakarta Sans',sans-serif",boxShadow:view===v?"0 1px 3px rgba(0,0,0,0.15)":"none"}}>
                    {v.charAt(0).toUpperCase()+v.slice(1)}
                  </button>
                ))}
              </div>
              <button onClick={()=>setShowAdd(true)} style={{background:accent,color:"#000",border:"none",padding:"7px 16px",borderRadius:8,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>+ New Booking</button>
              <button className="theme-toggle" onClick={toggleTheme}>
                <span>{dark?"🌙":"☀️"}</span><div className="toggle-pill"/><span>{dark?"Dark":"Light"}</span>
              </button>
            </div>
          </div>

          <div className="content">
            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:11}}>
              {[{l:"Upcoming",v:stats.total,c:text},{l:"Confirmed",v:stats.confirmed,c:accent},{l:"Pending",v:stats.pending,c:"#f59e0b"},{l:"AI Booked",v:stats.ai,c:"#a78bfa"},{l:"Revenue",v:`₹${stats.revenue.toLocaleString()}`,c:accent}].map(s=>(
                <div key={s.l} style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:11,padding:"13px 15px"}}>
                  <div style={{fontSize:11,color:textMuted,marginBottom:5}}>{s.l}</div>
                  <div style={{fontSize:22,fontWeight:700,color:s.c}}>{s.v}</div>
                </div>
              ))}
            </div>

            {view==="week" ? (
              /* Week view */
              <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,overflow:"hidden"}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:`1px solid ${border}`}}>
                  {weekDays.map((d,i)=>(
                    <div key={i} style={{padding:"12px 8px",textAlign:"center",borderRight:i<6?`1px solid ${border}`:"none"}}>
                      <div style={{fontSize:10.5,color:textFaint,fontWeight:600,marginBottom:5}}>{DAYS[d.getDay()]}</div>
                      <div style={{width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto",fontWeight:700,fontSize:13,background:d.toDateString()===today.toDateString()?accent:"transparent",color:d.toDateString()===today.toDateString()?"#fff":textMuted}}>
                        {d.getDate()}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",minHeight:200,padding:8,gap:6}}>
                  {weekDays.map((d,i)=>{
                    const dayStr = d.toISOString().split("T")[0]
                    const dayBookings = bookings.filter(b=>b.booking_date===dayStr)
                    return (
                      <div key={i} style={{borderRight:i<6?`1px solid ${border}`:"none",paddingRight:i<6?6:0}}>
                        {dayBookings.map(b=>(
                          <div key={b.id} onClick={()=>setSelected(b)} style={{fontSize:10.5,fontWeight:600,color:statusColor[b.status],background:statusColor[b.status]+"15",border:`1px solid ${statusColor[b.status]}33`,borderRadius:5,padding:"3px 6px",marginBottom:3,cursor:"pointer",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                            {b.booking_time} {b.customer_name}
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              /* List view */
              <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:14}}>
                <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,overflow:"hidden"}}>
                  <div style={{padding:"12px 16px",borderBottom:`1px solid ${border}`,display:"flex",gap:6}}>
                    {["all","confirmed","pending","completed","cancelled"].map(f=>(
                      <button key={f} onClick={()=>setFilter(f)} style={{padding:"3px 10px",borderRadius:100,fontSize:11,fontWeight:600,cursor:"pointer",border:`1px solid ${filter===f?(statusColor[f]||accent)+"44":cardBorder}`,background:filter===f?(statusColor[f]||accent)+"15":"transparent",color:filter===f?(statusColor[f]||accent):textMuted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                        {f.charAt(0).toUpperCase()+f.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div style={{padding:14}}>
                    {loading ? <div className="empty-state"><span>Loading...</span></div>
                    : filtered.length===0 ? <div className="empty-state"><span style={{fontSize:28}}>◷</span><span>No bookings yet</span><span style={{fontSize:11}}>Bookings will appear when customers message your WhatsApp</span></div>
                    : filtered.map(b=><BookingCard key={b.id} b={b}/>)}
                  </div>
                </div>

                {/* Detail */}
                <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:18}}>
                  {selected ? (
                    <>
                      <div style={{fontWeight:700,fontSize:14,color:text,marginBottom:14,display:"flex",justifyContent:"space-between"}}>
                        Booking Details
                        <button onClick={()=>setSelected(null)} style={{background:"transparent",border:"none",color:textFaint,cursor:"pointer",fontSize:16}}>×</button>
                      </div>
                      {[["Customer",selected.customer_name],["Phone",selected.customer_phone||"—"],["Service",selected.service],["Staff",selected.staff||"—"],["Date",selected.booking_date],["Time",selected.booking_time||"—"],["Amount",selected.amount?`₹${selected.amount.toLocaleString()}`:"—"],["Booked by",selected.ai_booked?"◈ AI":"Manual"]].map(([l,v])=>(
                        <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${border}`}}>
                          <span style={{fontSize:11.5,color:textMuted}}>{l}</span>
                          <span style={{fontSize:12,fontWeight:600,color:text}}>{v}</span>
                        </div>
                      ))}
                      <div style={{display:"flex",gap:7,marginTop:14}}>
                        {selected.status!=="confirmed" && <button onClick={()=>updateStatus(selected.id,"confirmed")} style={{flex:1,padding:"8px",background:accentDim,border:`1px solid ${accent}44`,borderRadius:8,color:accent,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>✓ Confirm</button>}
                        {selected.status!=="completed" && <button onClick={()=>updateStatus(selected.id,"completed")} style={{flex:1,padding:"8px",background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.25)",borderRadius:8,color:"#a78bfa",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>✓ Done</button>}
                        {selected.status!=="cancelled" && <button onClick={()=>updateStatus(selected.id,"cancelled")} style={{padding:"8px 12px",background:"rgba(251,113,133,0.1)",border:"1px solid rgba(251,113,133,0.25)",borderRadius:8,color:"#fb7185",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>✕</button>}
                      </div>
                    </>
                  ) : (
                    <div style={{textAlign:"center",padding:"30px 16px"}}>
                      <div style={{fontSize:28,opacity:0.2,marginBottom:8}}>◷</div>
                      <div style={{fontSize:12,color:textFaint,lineHeight:1.6}}>Click any booking<br/>to see details</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Booking Modal */}
      {showAdd && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
          <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:16,padding:28,width:420,display:"flex",flexDirection:"column",gap:12}}>
            <div style={{fontWeight:800,fontSize:16,color:text}}>New Booking</div>
            <input placeholder="Customer name *" value={newBooking.customer_name} onChange={e=>setNewBooking(p=>({...p,customer_name:e.target.value}))} style={inp}/>
            <input placeholder="Phone" value={newBooking.customer_phone} onChange={e=>setNewBooking(p=>({...p,customer_phone:e.target.value}))} style={inp}/>
            <select value={newBooking.service} onChange={e=>setNewBooking(p=>({...p,service:e.target.value}))} style={inp}>
              <option value="">Select service *</option>
              {services.map(s=><option key={s.name} value={s.name}>{s.name} — ₹{s.price}</option>)}
              <option value="Other">Other</option>
            </select>
            <input placeholder="Staff" value={newBooking.staff} onChange={e=>setNewBooking(p=>({...p,staff:e.target.value}))} style={inp}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <input type="date" value={newBooking.booking_date} onChange={e=>setNewBooking(p=>({...p,booking_date:e.target.value}))} style={inp}/>
              <select value={newBooking.booking_time} onChange={e=>setNewBooking(p=>({...p,booking_time:e.target.value}))} style={inp}>
                <option value="">Time</option>
                {TIMES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <input placeholder="Amount (₹)" type="number" value={newBooking.amount} onChange={e=>setNewBooking(p=>({...p,amount:e.target.value}))} style={inp}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setShowAdd(false)} style={{flex:1,padding:"9px",background:inputBg,border:`1px solid ${cardBorder}`,borderRadius:8,color:textMuted,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Cancel</button>
              <button onClick={addBooking} disabled={saving} style={{flex:1,padding:"9px",background:accent,border:"none",borderRadius:8,color:"#000",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{saving?"Saving...":"Add Booking"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
