"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth }  from "@/lib/hooks/useAuth"
import { useTheme } from "@/lib/hooks/useTheme"
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

export default function Analytics() {
  const { userId, userEmail, loading: authLoading, logout } = useAuth()
  const { dark, toggleTheme, colors, inputStyle: inp } = useTheme()
  const toast = useToast()

  const router = useRouter()
  const [mobSidebarOpen, setMobSidebarOpen] = useState(false)
  const [loading, setLoading]     = useState(true)
  const [period, setPeriod]       = useState("30") // days
  const [data, setData]           = useState({
    revenue:0, bookings:0, customers:0, leads:0, aiReplies:0, conversionRate:0,
    avgBookingValue:0, returningRate:0, topServices:[], dailyRevenue:[], dailyBookings:[],
    bookingsByStatus:{}, leadsBySource:{}, aiVsManual:{ ai:0, manual:0 }
  })

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) router.push("/login")
      else { setUserEmail(data.user.email||""); setUserId(data.user.id) }
    })
  }, [])

  useEffect(() => { if (userId) loadAnalytics() }, [userId, period])

  async function loadAnalytics() {
    setLoading(true)
    const from = new Date()
    from.setDate(from.getDate() - parseInt(period))
    const fromISO = from.toISOString()
    const fromDate = from.toISOString().split("T")[0]

    const [
      { data: bks },
      { data: leads },
      { data: msgs },
      { data: customers },
    ] = await Promise.all([
      supabase.from("bookings").select("*").eq("user_id", userId),
      supabase.from("leads").select("*").eq("user_id", userId).gte("created_at", fromISO),
      supabase.from("messages").select("direction,is_ai,created_at").eq("user_id", userId).gte("created_at", fromISO),
      supabase.from("customers").select("id,created_at,tag").eq("user_id", userId),
    ])

    const periodBks = (bks||[]).filter(b => b.booking_date >= fromDate)
    const confirmedBks = periodBks.filter(b=>b.status==="confirmed"||b.status==="completed")
    const revenue = confirmedBks.reduce((s,b)=>s+(b.amount||0),0)
    const aiReplies = (msgs||[]).filter(m=>m.is_ai&&m.direction==="outbound").length
    const newCustomers = (customers||[]).filter(c=>c.created_at>=fromISO).length
    const returningCustomers = (customers||[]).filter(c=>c.tag==="returning"||c.tag==="vip").length

    // Top services
    const svcMap = {}
    for (const b of periodBks) {
      if (!b.service) continue
      if (!svcMap[b.service]) svcMap[b.service] = { count:0, revenue:0 }
      svcMap[b.service].count++
      if (b.status==="confirmed"||b.status==="completed") svcMap[b.service].revenue += (b.amount||0)
    }
    const topServices = Object.entries(svcMap)
      .map(([name,d])=>({name,...d}))
      .sort((a,b)=>b.revenue-a.revenue)
      .slice(0,6)

    // Daily revenue + bookings (last N days)
    const days = parseInt(period) <= 7 ? parseInt(period) : parseInt(period) <= 30 ? 30 : 30
    const dailyRevenue = []
    const dailyBookings = []
    for (let i=days-1; i>=0; i--) {
      const d = new Date(); d.setDate(d.getDate()-i)
      const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
      const dayBks = (bks||[]).filter(b=>b.booking_date===ds)
      const dayRev = dayBks.filter(b=>b.status==="confirmed"||b.status==="completed").reduce((s,b)=>s+(b.amount||0),0)
      dailyRevenue.push({ date: ds, label: `${d.getDate()}/${d.getMonth()+1}`, value: dayRev })
      dailyBookings.push({ date: ds, label: `${d.getDate()}/${d.getMonth()+1}`, value: dayBks.length })
    }

    // Bookings by status
    const statusMap = {}
    for (const b of periodBks) statusMap[b.status||"unknown"] = (statusMap[b.status||"unknown"]||0)+1

    // Leads by source
    const srcMap = {}
    for (const l of (leads||[])) srcMap[l.source||"organic"] = (srcMap[l.source||"organic"]||0)+1

    setData({
      revenue, bookings: periodBks.length,
      customers: newCustomers,
      leads: (leads||[]).length,
      aiReplies,
      conversionRate: (leads||[]).length>0 ? Math.round((periodBks.length/(leads||[]).length)*100) : 0,
      avgBookingValue: confirmedBks.length>0 ? Math.round(revenue/confirmedBks.length) : 0,
      returningRate: (customers||[]).length>0 ? Math.round((returningCustomers/(customers||[]).length)*100) : 0,
      topServices,
      dailyRevenue: dailyRevenue.slice(-14), // show last 14 days max
      dailyBookings: dailyBookings.slice(-14),
      bookingsByStatus: statusMap,
      leadsBySource: srcMap,
      aiVsManual: {
        ai:     periodBks.filter(b=>b.ai_booked).length,
        manual: periodBks.filter(b=>!b.ai_booked).length
      }
    })
    setLoading(false)
  }

  // toggleTheme now from useTheme() hook
  // logout now from useAuth() hook

  const bg=dark?"#08080e":"#f0f2f5", sidebar=dark?"#0c0c15":"#ffffff", card=dark?"#0f0f1a":"#ffffff"
  const border=dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.08)", cardBorder=dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.09)"
  const text=dark?"#eeeef5":"#111827", textMuted=dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const textFaint=dark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.25)", inputBg=dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"
  const accent=dark?"#00C9B1":"#00897A"
  const navText=dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const navActive=dark?"rgba(0,196,125,0.1)":"rgba(0,180,115,0.08)"
  const navActiveBorder = colors.navActiveBdr // dark?"rgba(0,196,125,0.2)":"rgba(0,180,115,0.2)"
  const navActiveText = colors.navActiveText // dark?"#00B5A0":"#00897A"
  const userInitial = userEmail?userEmail[0].toUpperCase():"G"

  // Mini bar chart component
  const BarChart = ({ dataPoints, color, label }) => {
    const max = Math.max(...dataPoints.map(d=>d.value), 1)
    return (
      <div>
        <div style={{fontSize:11,color:textFaint,fontWeight:600,marginBottom:10}}>{label}</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:3,height:70}}>
          {dataPoints.map((d,i)=>(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
              <div style={{
                width:"100%", borderRadius:"3px 3px 0 0",
                height: d.value>0 ? `${Math.max(4,(d.value/max)*60)}px` : "2px",
                background: d.value>0 ? color : (dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)"),
                transition:"height 0.3s"
              }}/>
            </div>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
          <span style={{fontSize:9.5,color:textFaint}}>{dataPoints[0]?.label}</span>
          <span style={{fontSize:9.5,color:textFaint}}>{dataPoints[dataPoints.length-1]?.label}</span>
        </div>
      </div>
    )
  }

  // Donut-style metric
  const RingMetric = ({ value, max, color, label, sub }) => {
    const pct = Math.min(100, max>0 ? Math.round((value/max)*100) : 0)
    const r = 28, circ = 2*Math.PI*r
    const dash = (pct/100)*circ
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
        <svg width={72} height={72} style={{transform:"rotate(-90deg)"}}>
          <circle cx={36} cy={36} r={r} fill="none" stroke={dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.06)"} strokeWidth={6}/>
          <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={6}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{transition:"stroke-dasharray 0.5s"}}/>
        </svg>
        <div style={{marginTop:-54,fontSize:15,fontWeight:800,color:text,textAlign:"center",lineHeight:1}}>{pct}%</div>
        <div style={{marginTop:20,fontSize:11.5,fontWeight:700,color:text,textAlign:"center"}}>{label}</div>
        {sub && <div style={{fontSize:10.5,color:textFaint,textAlign:"center"}}>{sub}</div>}
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
        .logo{padding:16px 18px;font-weight:800;font-size:20px;color:${tx};text-decoration:none;display:flex;flex-direction:row;align-items:center;gap:10px;border-bottom:1px solid ${bdr};line-height:1;};text-decoration:none;display:block;border-bottom:1px solid ${border};}
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
        .stat-card{background:${card};border:1px solid ${cardBorder};border-radius:11px;padding:15px 17px;}

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
          <a href="/dashboard" className="logo" style={{display:"flex",alignItems:"center",gap:"8px"}}><img src="/logo.png" width="34" height="34" alt="Fastrill" style={{display:"block",objectFit:"contain",flexShrink:0}} /><span style={{fontWeight:800,fontSize:20,color:tx,letterSpacing:"-0.3px",lineHeight:1}}>fast<span style={{color:acc}}>rill</span></span></a>
          <div className="nav-section">Platform</div>
          {NAV.map(item => (
            <button key={item.id} className={`nav-item${item.id==="analytics"?" active":""}`} onClick={() => router.push(item.path)}>
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
            <button className="hamburger" onClick={()=>setMobSidebarOpen(s=>!s)}>☰</button>
              <span className="tb-title">Analytics</span>
            <div className="topbar-r">
              {/* Period selector */}
              <div style={{display:"flex",background:inputBg,border:`1px solid ${cardBorder}`,borderRadius:8,padding:2,gap:1}}>
                {[["7","7 days"],["30","30 days"],["90","90 days"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setPeriod(v)} style={{padding:"4px 12px",borderRadius:6,fontSize:11.5,fontWeight:600,cursor:"pointer",border:"none",background:period===v?card:"transparent",color:period===v?text:textMuted,fontFamily:"'Plus Jakarta Sans',sans-serif",boxShadow:period===v?"0 1px 3px rgba(0,0,0,0.15)":"none"}}>
                    {l}
                  </button>
                ))}
              </div>
              <button className="theme-toggle" onClick={toggleTheme}>
                <span>{dark?"🌙":"☀️"}</span><div className="toggle-pill"/><span>{dark?"Dark":"Light"}</span>
              </button>
            </div>
          </div>

          <div className="content">
            {/* Top KPIs */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:11}}>
              {[
                {l:"Revenue",         v:`₹${data.revenue.toLocaleString()}`, c:accent,     icon:"₹"},
                {l:"Bookings",        v:data.bookings,                       c:"#a78bfa",  icon:"📅"},
                {l:"New Customers",   v:data.customers,                      c:"#38bdf8",  icon:"◑"},
                {l:"Leads Captured",  v:data.leads,                          c:"#f59e0b",  icon:"↗"},
              ].map(s=>(
                <div key={s.l} className="stat-card">
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <div style={{fontSize:11,color:textMuted}}>{s.l}</div>
                    <div style={{fontSize:13,opacity:0.4}}>{s.icon}</div>
                  </div>
                  <div style={{fontSize:24,fontWeight:800,color:s.c,letterSpacing:"-0.5px"}}>{loading?"…":s.v}</div>
                  <div style={{fontSize:10.5,color:textFaint,marginTop:2}}>Last {period} days</div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div className="stat-card">
                <div style={{fontWeight:700,fontSize:13,color:text,marginBottom:14}}>Revenue Trend</div>
                {loading ? <div style={{height:80,display:"flex",alignItems:"center",justifyContent:"center",color:textFaint,fontSize:12}}>Loading...</div>
                  : <BarChart dataPoints={data.dailyRevenue} color={accent} label="Daily revenue (₹)"/>}
              </div>
              <div className="stat-card">
                <div style={{fontWeight:700,fontSize:13,color:text,marginBottom:14}}>Booking Volume</div>
                {loading ? <div style={{height:80,display:"flex",alignItems:"center",justifyContent:"center",color:textFaint,fontSize:12}}>Loading...</div>
                  : <BarChart dataPoints={data.dailyBookings} color="#a78bfa" label="Daily bookings"/>}
              </div>
            </div>

            {/* Performance metrics row */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
              {/* Conversion + AI rates */}
              <div className="stat-card" style={{display:"flex",justifyContent:"space-around",alignItems:"center",padding:"20px 16px"}}>
                <RingMetric value={data.conversionRate} max={100} color={accent} label="Conversion" sub="lead → booking"/>
                <RingMetric value={data.returningRate} max={100} color="#38bdf8" label="Returning" sub="of customers"/>
              </div>

              {/* AI Performance */}
              <div className="stat-card">
                <div style={{fontWeight:700,fontSize:13,color:text,marginBottom:14}}>◈ AI Performance</div>
                {[
                  {l:"AI Replies Sent",  v:data.aiReplies,              c:accent},
                  {l:"AI Bookings",      v:data.aiVsManual.ai,          c:"#a78bfa"},
                  {l:"Manual Bookings",  v:data.aiVsManual.manual,      c:textMuted},
                  {l:"Avg Booking Value",v:`₹${data.avgBookingValue}`,   c:accent},
                ].map(r=>(
                  <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${border}`}}>
                    <span style={{fontSize:12,color:textMuted}}>{r.l}</span>
                    <span style={{fontSize:12,fontWeight:700,color:r.c}}>{loading?"…":r.v}</span>
                  </div>
                ))}
              </div>

              {/* Booking status breakdown */}
              <div className="stat-card">
                <div style={{fontWeight:700,fontSize:13,color:text,marginBottom:14}}>Booking Status</div>
                {Object.keys(data.bookingsByStatus).length===0 ? (
                  <div style={{color:textFaint,fontSize:12,textAlign:"center",padding:"16px 0"}}>No data yet</div>
                ) : Object.entries(data.bookingsByStatus).map(([status, count])=>{
                  const total = Object.values(data.bookingsByStatus).reduce((a,b)=>a+b,0)
                  const pct = Math.round((count/total)*100)
                  const c = {confirmed:accent,completed:"#a78bfa",cancelled:"#fb7185",pending:"#f59e0b"}[status]||textMuted
                  return (
                    <div key={status} style={{marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:11.5,color:textMuted,textTransform:"capitalize"}}>{status}</span>
                        <span style={{fontSize:11.5,fontWeight:700,color:c}}>{count} ({pct}%)</span>
                      </div>
                      <div style={{height:4,borderRadius:100,background:dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)"}}>
                        <div style={{height:4,borderRadius:100,width:`${pct}%`,background:c,transition:"width 0.4s"}}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Bottom row: Top Services + Lead Sources */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              {/* Top Services */}
              <div className="stat-card">
                <div style={{fontWeight:700,fontSize:13,color:text,marginBottom:14}}>Top Services by Revenue</div>
                {data.topServices.length===0 ? (
                  <div style={{color:textFaint,fontSize:12,textAlign:"center",padding:"16px 0"}}>No bookings yet</div>
                ) : data.topServices.map((s,i)=>{
                  const maxRev = data.topServices[0].revenue || 1
                  return (
                    <div key={s.name} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,alignItems:"center"}}>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          <span style={{fontSize:10,fontWeight:700,color:accent,opacity:0.6}}>#{i+1}</span>
                          <span style={{fontSize:12,fontWeight:600,color:text,textTransform:"capitalize"}}>{s.name}</span>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <span style={{fontSize:12,fontWeight:700,color:accent}}>₹{s.revenue.toLocaleString()}</span>
                          <span style={{fontSize:10.5,color:textFaint,marginLeft:6}}>{s.count}x</span>
                        </div>
                      </div>
                      <div style={{height:4,borderRadius:100,background:dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)"}}>
                        <div style={{height:4,borderRadius:100,width:`${Math.round((s.revenue/maxRev)*100)}%`,background:`linear-gradient(90deg,${accent},#0ea5e9)`,transition:"width 0.4s"}}/>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Lead Sources */}
              <div className="stat-card">
                <div style={{fontWeight:700,fontSize:13,color:text,marginBottom:14}}>Lead Sources</div>
                {Object.keys(data.leadsBySource).length===0 ? (
                  <div style={{color:textFaint,fontSize:12,textAlign:"center",padding:"16px 0"}}>No leads yet</div>
                ) : (() => {
                  const total = Object.values(data.leadsBySource).reduce((a,b)=>a+b,0)
                  const srcColors = { whatsapp:"#25d366", instagram:"#e1306c", google:"#ea4335", referral:"#f59e0b", organic:"#38bdf8" }
                  return Object.entries(data.leadsBySource).sort((a,b)=>b[1]-a[1]).map(([src,count])=>{
                    const pct = Math.round((count/total)*100)
                    const c = srcColors[src.toLowerCase()] || "#a78bfa"
                    return (
                      <div key={src} style={{marginBottom:10}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                          <span style={{fontSize:12,color:textMuted,textTransform:"capitalize"}}>{src}</span>
                          <span style={{fontSize:12,fontWeight:700,color:c}}>{count} ({pct}%)</span>
                        </div>
                        <div style={{height:4,borderRadius:100,background:dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)"}}>
                          <div style={{height:4,borderRadius:100,width:`${pct}%`,background:c,transition:"width 0.4s"}}/>
                        </div>
                      </div>
                    )
                  })
                })()}
                <div style={{marginTop:14,padding:"10px 12px",background:inputBg,borderRadius:8,fontSize:11.5,color:textMuted}}>
                  📊 Total leads: <span style={{fontWeight:700,color:text}}>{data.leads}</span> · Conversion: <span style={{fontWeight:700,color:accent}}>{data.conversionRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
