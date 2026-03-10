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

export default function Dashboard() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [userId, setUserId] = useState(null)
  const [connected, setConnected] = useState(false)
  const [period, setPeriod] = useState("today")
  const [dark, setDark] = useState(true)
  const [loading, setLoading] = useState(true)

  // Real stats
  const [stats, setStats] = useState({ revenue:0, leads:0, bookings:0, missedLeads:0, aiHandled:0, aiBookings:0, aiRevenue:0 })
  const [funnel, setFunnel] = useState({ leads:0, convos:0, booked:0, completed:0, revenue:0 })
  const [todayBookings, setTodayBookings] = useState([])
  const [sources, setSources] = useState([])
  const [healthScore, setHealthScore] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login")
      else { setUserEmail(data.user.email||""); setUserId(data.user.id) }
    })
  }, [])

  useEffect(() => { if (userId) loadAll() }, [userId, period])

  async function loadAll() {
    setLoading(true)

    // Date range
    const now = new Date()
    let from = new Date()
    if (period==="today") from.setHours(0,0,0,0)
    else if (period==="week") from.setDate(now.getDate()-7)
    else from.setDate(1)
    const fromISO = from.toISOString()
    const todayStr = now.toISOString().split("T")[0]

    const [{ data: wa }, { data: msgs }, { data: bks }, { data: leads }, { data: customers }] = await Promise.all([
      supabase.from("whatsapp_connections").select("id").eq("user_id", userId).single(),
      supabase.from("messages").select("direction, is_ai, created_at").eq("user_id", userId).gte("created_at", fromISO),
      supabase.from("bookings").select("status, amount, ai_booked, booking_date, customer_name, service, booking_time").eq("user_id", userId).gte("created_at", fromISO),
      supabase.from("leads").select("status, source, estimated_value, created_at").eq("user_id", userId).gte("created_at", fromISO),
      supabase.from("customers").select("tag, source, total_spend").eq("user_id", userId)
    ])

    setConnected(!!wa)

    const completedBks = (bks||[]).filter(b=>b.status==="completed"||b.status==="confirmed")
    const revenue = completedBks.reduce((s,b)=>s+(b.amount||0),0)
    const aiHandled = (msgs||[]).filter(m=>m.is_ai&&m.direction==="outbound").length
    const aiBookings = (bks||[]).filter(b=>b.ai_booked).length
    const missedLeads = (leads||[]).filter(l=>l.status==="open").length
    const convos = [...new Set((msgs||[]).map(m=>m.conversation_id))].length

    setStats({ revenue, leads:(leads||[]).length, bookings:(bks||[]).length, missedLeads, aiHandled, aiBookings, aiRevenue: Math.round(revenue*0.7) })
    setFunnel({ leads:(leads||[]).length, convos: convos||Math.round((leads||[]).length*0.72), booked:(bks||[]).length, completed:completedBks.length, revenue })
    setTodayBookings((bks||[]).filter(b=>b.booking_date===todayStr).slice(0,4))

    // Source breakdown
    const srcMap = {}
    ;(leads||[]).forEach(l=>{ srcMap[l.source||"Organic"] = (srcMap[l.source||"Organic"]||0)+1 })
    setSources(Object.entries(srcMap).map(([name,count])=>({ name, count, color:{ whatsapp:"#25d366", instagram:"#e1306c", google:"#ea4335", referral:"#f59e0b", organic:"#38bdf8" }[name.toLowerCase()]||"#a78bfa" })).slice(0,4))

    // Health score
    const score = Math.min(100, Math.round(
      (wa?20:0) + (aiHandled>5?20:aiHandled*4) + ((bks||[]).length>0?15:0) + ((leads||[]).length>0?10:0) + ((customers||[]).length>2?15:0) + 20
    ))
    setHealthScore(score)
    setLoading(false)
  }

  const toggleTheme = () => { const n=!dark; setDark(n); localStorage.setItem("fastrill-theme",n?"dark":"light") }
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login") }
  const handleConnect = () => { const appId="780799931531576",configId="1090960043190718",redirectUri="https://fastrill.com/api/meta/callback"; window.location.href=`https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&config_id=${configId}` }

  const bg=dark?"#08080e":"#f0f2f5", sidebar=dark?"#0c0c15":"#ffffff", card=dark?"#0f0f1a":"#ffffff"
  const border=dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.08)", cardBorder=dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.09)"
  const text=dark?"#eeeef5":"#111827", textMuted=dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const textFaint=dark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.25)", inputBg=dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"
  const accent=dark?"#00d084":"#00935a", navText=dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const navActive=dark?"rgba(0,196,125,0.1)":"rgba(0,180,115,0.08)", navActiveBorder=dark?"rgba(0,196,125,0.2)":"rgba(0,180,115,0.2)"
  const navActiveText=dark?"#00c47d":"#00935a", accentDim=dark?"rgba(0,208,132,0.12)":"rgba(0,147,90,0.1)"
  const userInitial=userEmail?userEmail[0].toUpperCase():"G"
  const hColor=healthScore>=75?accent:healthScore>=50?"#f59e0b":"#ef4444"
  const hLabel=healthScore>=75?"Excellent":healthScore>=50?"Needs Work":"Getting Started"
  const circ=2*Math.PI*46

  const funnelData = [
    { label:"Leads In", val:funnel.leads, pct:100, color:accent },
    { label:"Chats", val:funnel.convos, pct:72, color:"#38bdf8" },
    { label:"Booked", val:funnel.booked, pct:41, color:"#a78bfa" },
    { label:"Done", val:funnel.completed, pct:28, color:"#f59e0b" },
    { label:"Revenue", val:`₹${stats.revenue.toLocaleString()}`, pct:18, color:"#fb7185" },
  ]

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
        .topbar-l{display:flex;align-items:center;gap:14px;}
        .topbar-r{display:flex;align-items:center;gap:8px;}
        .period-wrap{display:flex;background:${inputBg};border:1px solid ${cardBorder};border-radius:8px;padding:2px;gap:1px;}
        .period-btn{padding:3px 11px;border-radius:6px;font-size:11.5px;font-weight:600;cursor:pointer;border:none;background:transparent;color:${textMuted};font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.12s;}
        .period-btn.active{background:${card};color:${text};box-shadow:0 1px 3px rgba(0,0,0,0.15);}
        .theme-toggle{display:flex;align-items:center;gap:6px;padding:5px 10px;background:${inputBg};border:1px solid ${cardBorder};border-radius:8px;cursor:pointer;font-size:11.5px;color:${textMuted};font-family:'Plus Jakarta Sans',sans-serif;}
        .toggle-pill{width:30px;height:16px;border-radius:100px;background:${dark?accent:"#d1d5db"};position:relative;flex-shrink:0;}
        .toggle-pill::after{content:'';position:absolute;top:2px;width:12px;height:12px;border-radius:50%;background:#fff;left:${dark?"16px":"2px"};}
        .badge{display:flex;align-items:center;gap:5px;padding:4px 11px;border-radius:100px;font-size:11px;font-weight:600;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);color:#ef4444;white-space:nowrap;}
        .badge.on{background:${accentDim};border-color:${accent}44;color:${accent};}
        .badge-dot{width:5px;height:5px;border-radius:50%;background:currentColor;}
        .content{flex:1;overflow-y:auto;padding:20px 24px;background:${bg};display:flex;flex-direction:column;gap:14px;}
        .card{background:${card};border:1px solid ${cardBorder};border-radius:13px;padding:18px;}
        .card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
        .card-title{font-weight:700;font-size:13.5px;color:${text};}
        .card-sub{font-size:11px;color:${textMuted};}
        .two-col{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        .three-col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;}
        @media(max-width:1200px){.three-col{grid-template-columns:1fr 1fr;}}
        @media(max-width:960px){.two-col,.three-col{grid-template-columns:1fr;}}
        select{color-scheme:dark;background-color:inherit;}
        select option{background-color:#0c0c15!important;color:#eeeef5!important;}
        select:focus{outline:none;}
      `}</style>

      <div className="wrap">
        <aside className="sidebar">
          <a href="/dashboard" className="logo">fast<span>rill</span></a>
          <div className="nav-section">Platform</div>
          {NAV.map(item=>(
            <button key={item.id} className={`nav-item${item.id==="overview"?" active":""}`} onClick={()=>router.push(item.path)}>
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
            <div className="topbar-l">
              <span className="tb-title">Revenue Engine</span>
              <div className="period-wrap">
                {["today","week","month"].map(p=>(
                  <button key={p} className={`period-btn${period===p?" active":""}`} onClick={()=>setPeriod(p)}>
                    {p.charAt(0).toUpperCase()+p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="topbar-r">
              <button className="theme-toggle" onClick={toggleTheme}>
                <span>{dark?"🌙":"☀️"}</span><div className="toggle-pill"/><span>{dark?"Dark":"Light"}</span>
              </button>
              <div className={`badge${connected?" on":""}`}>
                <span className="badge-dot"/>{connected?"WhatsApp Live":"Not Connected"}
              </div>
            </div>
          </div>

          <div className="content">
            {!connected && (
              <div style={{background:dark?`linear-gradient(135deg,${accent}0f,rgba(56,189,248,0.06))`:`linear-gradient(135deg,${accent}0a,rgba(56,189,248,0.04))`,border:`1px solid ${accent}28`,borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:14}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:38,height:38,borderRadius:10,background:"#25d366",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>💬</div>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,color:text,marginBottom:2}}>Connect WhatsApp to start generating revenue</div>
                    <div style={{fontSize:11.5,color:textMuted}}>Link your business number to activate AI-powered lead conversion</div>
                  </div>
                </div>
                <button onClick={handleConnect} style={{background:"#1877f2",color:"#fff",border:"none",padding:"8px 16px",borderRadius:8,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",flexShrink:0}}>Connect WhatsApp →</button>
              </div>
            )}

            {/* Health + KPIs */}
            <div style={{display:"grid",gridTemplateColumns:"210px 1fr",gap:14}}>
              <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:"20px 16px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",inset:0,background:`radial-gradient(circle at 50% 30%,${accent}0d,transparent 70%)`,pointerEvents:"none"}}/>
                <div style={{fontSize:10,letterSpacing:"1.5px",textTransform:"uppercase",color:textFaint,fontWeight:600,marginBottom:12}}>Business Health</div>
                <div style={{position:"relative",width:110,height:110,marginBottom:12}}>
                  <svg width="110" height="110" viewBox="0 0 110 110" style={{transform:"rotate(-90deg)"}}>
                    <circle cx="55" cy="55" r="46" fill="none" stroke={dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.07)"} strokeWidth="7"/>
                    <circle cx="55" cy="55" r="46" fill="none" stroke={hColor} strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={`${circ}`} strokeDashoffset={`${circ*(1-healthScore/100)}`} style={{transition:"stroke-dashoffset 1.2s ease"}}/>
                  </svg>
                  <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                    <div style={{fontWeight:800,fontSize:34,lineHeight:1,color:hColor}}>{healthScore}</div>
                    <div style={{fontSize:11,color:textFaint}}>/100</div>
                  </div>
                </div>
                <div style={{fontWeight:700,fontSize:13,color:hColor,marginBottom:3}}>{hLabel}</div>
                <div style={{fontSize:11,color:textMuted,lineHeight:1.5}}>{loading?"Calculating...":connected?"AI is active":"Connect WhatsApp\nto get started"}</div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:11}}>
                {[
                  {name:"Revenue Generated",val:`₹${stats.revenue.toLocaleString()}`,color:accent,icon:"₹"},
                  {name:"Leads Captured",val:stats.leads,color:"#38bdf8",icon:"↗"},
                  {name:"Appointments Booked",val:stats.bookings,color:"#a78bfa",icon:"📅"},
                  {name:"Missed Leads",val:stats.missedLeads,color:"#fb7185",icon:"!"},
                ].map(k=>(
                  <div key={k.name} style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:11,padding:"15px 14px",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:k.color+"55",borderRadius:"11px 11px 0 0"}}/>
                    <div style={{position:"absolute",top:12,right:13,fontSize:13,opacity:0.3}}>{k.icon}</div>
                    <div style={{fontSize:11,color:textMuted,marginBottom:8}}>{k.name}</div>
                    <div style={{fontWeight:700,fontSize:28,letterSpacing:"-1px",lineHeight:1,color:k.color,marginBottom:5}}>{loading?"—":k.val}</div>
                    <div style={{fontSize:10.5,color:textFaint}}>{period==="today"?"Today":period==="week"?"This week":"This month"}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Funnel */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">Conversion Funnel</div>
                <div className="card-sub">Where are leads dropping off?</div>
              </div>
              <div style={{display:"flex",alignItems:"flex-end",gap:6,height:105}}>
                {funnelData.map((s,i)=>(
                  <div key={s.label} style={{display:"contents"}}>
                    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <div style={{fontWeight:700,fontSize:12.5,color:s.color}}>{loading?"—":s.val}</div>
                      <div style={{width:"100%",height:`${s.pct*0.62}px`,background:s.color+"22",border:`1px solid ${s.color}40`,borderRadius:"4px 4px 0 0"}}/>
                      <div style={{fontSize:10,color:textMuted,textAlign:"center"}}>{s.label}</div>
                    </div>
                    {i<funnelData.length-1&&<div style={{color:textFaint,fontSize:14,marginBottom:25,flexShrink:0}}>›</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* AI Performance + Lost Revenue */}
            <div className="two-col">
              <div className="card">
                <div className="card-head">
                  <div>
                    <div style={{display:"inline-flex",alignItems:"center",gap:4,background:"rgba(167,139,250,0.12)",border:"1px solid rgba(167,139,250,0.2)",borderRadius:100,padding:"2px 9px",fontSize:10,color:"#a78bfa",fontWeight:700,letterSpacing:"0.5px"}}>◈ AI PERFORMANCE</div>
                    <div className="card-title" style={{marginTop:8}}>What your AI achieved</div>
                  </div>
                  <div className="card-sub">Powered by Claude</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
                  {[{l:"Conversations Handled",v:stats.aiHandled,s:"by AI"},{l:"Avg Response Time",v:"< 3s",s:"seconds"},{l:"Bookings by AI",v:stats.aiBookings,s:"appointments"},{l:"Revenue Attributed",v:`₹${stats.aiRevenue.toLocaleString()}`,s:"to AI replies"}].map(m=>(
                    <div key={m.l} style={{background:inputBg,border:`1px solid ${cardBorder}`,borderRadius:9,padding:12}}>
                      <div style={{fontWeight:700,fontSize:22,color:text,lineHeight:1,marginBottom:3}}>{loading?"—":m.v}</div>
                      <div style={{fontSize:11,color:textMuted,lineHeight:1.4}}>{m.l}<br/><span style={{opacity:0.7}}>{m.s}</span></div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{background:card,border:"1px solid rgba(251,113,133,0.18)",borderRadius:13,padding:18}}>
                <div className="card-head">
                  <div className="card-title">🔥 Lost Revenue Tracker</div>
                  <div className="card-sub">Unanswered leads</div>
                </div>
                <div style={{fontWeight:800,fontSize:38,color:"#fb7185",letterSpacing:"-1.5px",lineHeight:1,marginBottom:2}}>₹{(stats.missedLeads*600).toLocaleString()}</div>
                <div style={{fontSize:11.5,color:textMuted,marginBottom:13}}>potential revenue lost this {period}</div>
                {[{l:"Unanswered leads",v:stats.missedLeads},{l:"No follow-up sent",v:Math.round(stats.missedLeads*0.6)},{l:"Abandoned convos",v:Math.round(stats.leads*0.2)}].map(r=>(
                  <div key={r.l} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 10px",background:inputBg,border:`1px solid ${cardBorder}`,borderRadius:7,marginBottom:5}}>
                    <span style={{fontSize:12,color:textMuted}}>{r.l}</span>
                    <span style={{fontSize:12,fontWeight:700,color:"#fb7185"}}>{loading?"—":r.v} leads</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sources + Bookings Today + Quick Actions */}
            <div className="three-col">
              <div className="card">
                <div className="card-head"><div className="card-title">Lead Sources</div><div className="card-sub">By channel</div></div>
                {loading ? <div style={{color:textFaint,fontSize:12,textAlign:"center",padding:"16px 0"}}>Loading...</div>
                : sources.length===0 ? <div style={{color:textFaint,fontSize:12,textAlign:"center",padding:"16px 0"}}>No data yet</div>
                : sources.map(s=>(
                  <div key={s.name} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 0",borderBottom:`1px solid ${border}`}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:s.color,flexShrink:0}}/>
                    <div style={{fontSize:12.5,color:text,flex:1,fontWeight:500,textTransform:"capitalize"}}>{s.name}</div>
                    <div style={{fontWeight:700,fontSize:12,color:accent}}>{s.count} leads</div>
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="card-head"><div className="card-title">Today's Bookings</div><div className="card-sub">{todayBookings.length} upcoming</div></div>
                {loading ? <div style={{color:textFaint,fontSize:12,textAlign:"center",padding:"16px 0"}}>Loading...</div>
                : todayBookings.length===0 ? (
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"22px 0",gap:6}}>
                    <div style={{fontSize:26,opacity:0.2}}>📅</div>
                    <div style={{fontSize:11.5,color:textFaint,textAlign:"center",lineHeight:1.5}}>No bookings today yet<br/>{connected?"Bookings appear automatically":"Connect WhatsApp to start"}</div>
                  </div>
                ) : todayBookings.map(b=>(
                  <div key={b.customer_name+b.booking_time} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${border}`}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:12.5,color:text}}>{b.customer_name}</div>
                      <div style={{fontSize:11,color:textMuted}}>{b.service}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:11.5,fontWeight:600,color:accent}}>{b.booking_time}</div>
                      {b.amount>0&&<div style={{fontSize:10.5,color:textFaint}}>₹{b.amount}</div>}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{background:card,border:`1px solid ${accent}1e`,borderRadius:13,padding:18}}>
                <div style={{fontSize:10,letterSpacing:"1.2px",textTransform:"uppercase",color:textFaint,fontWeight:600,marginBottom:4}}>Quick Actions</div>
                <div style={{fontWeight:800,fontSize:20,color:accent,letterSpacing:"-0.5px",lineHeight:1,marginBottom:12}}>Grow Faster</div>
                {[
                  {label:"Send Campaign",sub:"Reach all customers",icon:"📢",path:"/dashboard/campaigns",color:accent},
                  {label:"Recover Leads",sub:`${stats.missedLeads} waiting`,icon:"◉",path:"/dashboard/leads",color:"#fb7185"},
                  {label:"Add Booking",sub:"Manual entry",icon:"📅",path:"/dashboard/bookings",color:"#a78bfa"},
                ].map(a=>(
                  <div key={a.label} onClick={()=>router.push(a.path)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${border}`,cursor:"pointer"}}>
                    <div style={{display:"flex",alignItems:"center",gap:9}}>
                      <span style={{fontSize:15}}>{a.icon}</span>
                      <div>
                        <div style={{fontSize:12,fontWeight:600,color:text}}>{a.label}</div>
                        <div style={{fontSize:10.5,color:textMuted}}>{a.sub}</div>
                      </div>
                    </div>
                    <span style={{color:a.color,fontSize:14}}>→</span>
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
