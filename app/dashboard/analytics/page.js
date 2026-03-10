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

function Sparkline({ data, color, height=36 }) {
  if (!data?.length) return null
  const max = Math.max(...data, 1)
  const w = 120, h = height
  const pts = data.map((v,i) => `${(i/(data.length-1))*w},${h - (v/max)*h*0.85}`).join(" ")
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{overflow:"visible"}}>
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" points={pts}/>
      <polyline fill={color+"18"} stroke="none" points={`0,${h} ${pts} ${w},${h}`}/>
    </svg>
  )
}

export default function Analytics() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [userId, setUserId] = useState(null)
  const [dark, setDark] = useState(true)
  const [period, setPeriod] = useState("30d")
  const [loading, setLoading] = useState(true)

  const [summary, setSummary] = useState({ revenue:0, bookings:0, leads:0, customers:0, aiHandled:0, convRate:0 })
  const [revenueChart, setRevenueChart] = useState([])
  const [leadsChart, setLeadsChart] = useState([])
  const [topServices, setTopServices] = useState([])
  const [customerTags, setCustomerTags] = useState([])
  const [aiStats, setAIStats] = useState({ handled:0, booked:0, responseTime:"<3s", satisfaction:"—" })

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login")
      else { setUserEmail(data.user.email||""); setUserId(data.user.id) }
    })
  }, [])

  useEffect(() => { if (userId) loadAnalytics() }, [userId, period])

  async function loadAnalytics() {
    setLoading(true)
    const days = period==="7d"?7:period==="30d"?30:90
    const from = new Date(); from.setDate(from.getDate()-days)
    const fromISO = from.toISOString()

    const [{ data: bks }, { data: leads }, { data: customers }, { data: msgs }] = await Promise.all([
      supabase.from("bookings").select("amount, status, service, ai_booked, created_at, booking_date").eq("user_id", userId).gte("created_at", fromISO),
      supabase.from("leads").select("created_at, source, status").eq("user_id", userId).gte("created_at", fromISO),
      supabase.from("customers").select("tag, created_at, total_spend").eq("user_id", userId),
      supabase.from("messages").select("direction, is_ai, created_at").eq("user_id", userId).gte("created_at", fromISO)
    ])

    const completedBks = (bks||[]).filter(b=>b.status==="completed"||b.status==="confirmed")
    const revenue = completedBks.reduce((s,b)=>s+(b.amount||0),0)
    const aiHandled = (msgs||[]).filter(m=>m.is_ai&&m.direction==="outbound").length
    const convRate = (leads||[]).length > 0 ? Math.round(((bks||[]).length/(leads||[]).length)*100) : 0

    setSummary({ revenue, bookings:(bks||[]).length, leads:(leads||[]).length, customers:(customers||[]).length, aiHandled, convRate })

    // Build daily charts (last 14 days)
    const chartDays = Math.min(14, days)
    const revArr = [], leadsArr = []
    for (let i=chartDays-1; i>=0; i--) {
      const d = new Date(); d.setDate(d.getDate()-i)
      const dStr = d.toISOString().split("T")[0]
      const dayRevenue = (bks||[]).filter(b=>b.booking_date===dStr).reduce((s,b)=>s+(b.amount||0),0)
      const dayLeads = (leads||[]).filter(l=>l.created_at?.startsWith(dStr)).length
      revArr.push(dayRevenue); leadsArr.push(dayLeads)
    }
    setRevenueChart(revArr); setLeadsChart(leadsArr)

    // Top services
    const svcMap = {}
    ;(bks||[]).forEach(b=>{ if (b.service) svcMap[b.service] = (svcMap[b.service]||{count:0,revenue:0}); svcMap[b.service].count++; svcMap[b.service].revenue+=(b.amount||0) })
    setTopServices(Object.entries(svcMap).map(([name,d])=>({name,...d})).sort((a,b)=>b.revenue-a.revenue).slice(0,5))

    // Customer breakdown
    const tagMap = {}
    ;(customers||[]).forEach(c=>{ tagMap[c.tag||"regular"]=(tagMap[c.tag||"regular"]||0)+1 })
    const total = (customers||[]).length||1
    setCustomerTags(Object.entries(tagMap).map(([tag,count])=>({tag,count,pct:Math.round((count/total)*100)})))

    setAIStats({ handled:aiHandled, booked:(bks||[]).filter(b=>b.ai_booked).length, responseTime:"<3s", satisfaction:"—" })
    setLoading(false)
  }

  const toggleTheme = () => { const n=!dark; setDark(n); localStorage.setItem("fastrill-theme",n?"dark":"light") }
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login") }

  const bg=dark?"#08080e":"#f0f2f5", sidebar=dark?"#0c0c15":"#ffffff", card=dark?"#0f0f1a":"#ffffff"
  const border=dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.08)", cardBorder=dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.09)"
  const text=dark?"#eeeef5":"#111827", textMuted=dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const textFaint=dark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.25)", inputBg=dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"
  const accent=dark?"#00d084":"#00935a", navText=dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const navActive=dark?"rgba(0,196,125,0.1)":"rgba(0,180,115,0.08)", navActiveBorder=dark?"rgba(0,196,125,0.2)":"rgba(0,180,115,0.2)"
  const navActiveText=dark?"#00c47d":"#00935a"
  const userInitial=userEmail?userEmail[0].toUpperCase():"G"

  const tagColor = { vip:"#f59e0b", regular:"#38bdf8", inactive:"#fb7185", new_lead:"#a78bfa" }

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
        .content{flex:1;overflow-y:auto;padding:20px 24px;background:${bg};display:flex;flex-direction:column;gap:14px;}
        .card{background:${card};border:1px solid ${cardBorder};border-radius:13px;padding:18px;}
        .card-title{font-weight:700;font-size:13.5px;color:${text};margin-bottom:14px;}
        .two-col{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        @media(max-width:960px){.two-col{grid-template-columns:1fr;}}
        select{color-scheme:dark;background-color:inherit;}
        select option{background-color:#0c0c15!important;color:#eeeef5!important;}
        select:focus{outline:none;}
      `}</style>

      <div className="wrap">
        <aside className="sidebar">
          <a href="/dashboard" className="logo">fast<span>rill</span></a>
          <div className="nav-section">Platform</div>
          {NAV.map(item=>(
            <button key={item.id} className={`nav-item${item.id==="analytics"?" active":""}`} onClick={()=>router.push(item.path)}>
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
            <span className="tb-title">Analytics</span>
            <div className="topbar-r">
              <div style={{display:"flex",background:inputBg,border:`1px solid ${cardBorder}`,borderRadius:8,padding:2,gap:1}}>
                {["7d","30d","90d"].map(p=>(
                  <button key={p} onClick={()=>setPeriod(p)} style={{padding:"4px 12px",borderRadius:6,fontSize:11.5,fontWeight:600,cursor:"pointer",border:"none",background:period===p?card:"transparent",color:period===p?text:textMuted,fontFamily:"'Plus Jakarta Sans',sans-serif",boxShadow:period===p?"0 1px 3px rgba(0,0,0,0.15)":"none"}}>
                    {p==="7d"?"7 Days":p==="30d"?"30 Days":"90 Days"}
                  </button>
                ))}
              </div>
              <button className="theme-toggle" onClick={toggleTheme}>
                <span>{dark?"🌙":"☀️"}</span><div className="toggle-pill"/><span>{dark?"Dark":"Light"}</span>
              </button>
            </div>
          </div>

          <div className="content">
            {/* Summary KPIs */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:11}}>
              {[
                {l:"Revenue",v:`₹${summary.revenue.toLocaleString()}`,c:accent,chart:revenueChart},
                {l:"Bookings",v:summary.bookings,c:"#a78bfa",chart:leadsChart},
                {l:"Leads",v:summary.leads,c:"#38bdf8",chart:leadsChart},
                {l:"Customers",v:summary.customers,c:"#f59e0b",chart:null},
                {l:"AI Handled",v:summary.aiHandled,c:"#a78bfa",chart:null},
                {l:"Conv. Rate",v:`${summary.convRate}%`,c:accent,chart:null},
              ].map(k=>(
                <div key={k.l} style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:11,padding:"13px 14px",overflow:"hidden",position:"relative"}}>
                  <div style={{fontSize:10.5,color:textMuted,marginBottom:5}}>{k.l}</div>
                  <div style={{fontWeight:800,fontSize:22,color:k.c,marginBottom:k.chart?4:0}}>{loading?"—":k.v}</div>
                  {k.chart && <Sparkline data={k.chart} color={k.c} height={30}/>}
                </div>
              ))}
            </div>

            {/* Revenue + Leads charts */}
            <div className="two-col">
              <div className="card">
                <div className="card-title">Daily Revenue (₹)</div>
                {revenueChart.length>0 ? (
                  <div style={{position:"relative",height:120}}>
                    <svg width="100%" height="120" viewBox={`0 0 ${revenueChart.length*20} 100`} preserveAspectRatio="none" style={{overflow:"visible"}}>
                      {revenueChart.map((v,i)=>{
                        const max=Math.max(...revenueChart,1)
                        const x=i*20+10, barH=Math.max(2,(v/max)*80), y=90-barH
                        return <rect key={i} x={x-6} y={y} width={12} height={barH} rx={3} fill={accent+"88"} style={{transition:"height 0.3s"}}/>
                      })}
                    </svg>
                    {revenueChart.every(v=>v===0)&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:textFaint}}>No revenue data yet</div>}
                  </div>
                ) : <div style={{height:80,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:textFaint}}>No data yet</div>}
              </div>

              <div className="card">
                <div className="card-title">Daily Leads</div>
                {leadsChart.length>0 ? (
                  <div style={{position:"relative",height:120}}>
                    <svg width="100%" height="120" viewBox={`0 0 ${leadsChart.length*20} 100`} preserveAspectRatio="none" style={{overflow:"visible"}}>
                      {leadsChart.map((v,i)=>{
                        const max=Math.max(...leadsChart,1)
                        const x=i*20+10, barH=Math.max(2,(v/max)*80), y=90-barH
                        return <rect key={i} x={x-6} y={y} width={12} height={barH} rx={3} fill={"#38bdf888"} style={{transition:"height 0.3s"}}/>
                      })}
                    </svg>
                    {leadsChart.every(v=>v===0)&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:textFaint}}>No lead data yet</div>}
                  </div>
                ) : <div style={{height:80,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:textFaint}}>No data yet</div>}
              </div>
            </div>

            {/* Top Services + Customer Breakdown + AI Stats */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
              {/* Top Services */}
              <div className="card">
                <div className="card-title">Top Services</div>
                {topServices.length===0 ? <div style={{fontSize:12,color:textFaint,textAlign:"center",padding:"16px 0"}}>No booking data yet</div>
                : topServices.map((s,i)=>{
                  const maxRev = topServices[0]?.revenue||1
                  return (
                    <div key={s.name} style={{marginBottom:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:12.5,fontWeight:600,color:text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"60%"}}>{s.name}</span>
                        <span style={{fontSize:12,fontWeight:700,color:accent}}>₹{s.revenue.toLocaleString()}</span>
                      </div>
                      <div style={{height:4,background:inputBg,borderRadius:100,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${(s.revenue/maxRev)*100}%`,background:`linear-gradient(90deg,${accent},#38bdf8)`,borderRadius:100}}/>
                      </div>
                      <div style={{fontSize:10.5,color:textFaint,marginTop:2}}>{s.count} bookings</div>
                    </div>
                  )
                })}
              </div>

              {/* Customer Tags */}
              <div className="card">
                <div className="card-title">Customer Breakdown</div>
                {customerTags.length===0 ? <div style={{fontSize:12,color:textFaint,textAlign:"center",padding:"16px 0"}}>No customers yet</div>
                : customerTags.map(t=>(
                  <div key={t.tag} style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:12,fontWeight:600,color:tagColor[t.tag]||textMuted,textTransform:"capitalize"}}>{t.tag.replace("_"," ")}</span>
                      <span style={{fontSize:12,color:textMuted}}>{t.count} ({t.pct}%)</span>
                    </div>
                    <div style={{height:4,background:inputBg,borderRadius:100,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${t.pct}%`,background:(tagColor[t.tag]||textMuted)+"88",borderRadius:100,transition:"width 0.5s"}}/>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Stats */}
              <div className="card">
                <div className="card-title">AI Performance</div>
                {[
                  {l:"Messages Handled",v:aiStats.handled,c:"#a78bfa"},
                  {l:"Bookings Made by AI",v:aiStats.booked,c:accent},
                  {l:"Avg Response Time",v:aiStats.responseTime,c:"#38bdf8"},
                  {l:"Customer Satisfaction",v:aiStats.satisfaction,c:"#f59e0b"},
                ].map(s=>(
                  <div key={s.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${border}`}}>
                    <span style={{fontSize:12,color:textMuted}}>{s.l}</span>
                    <span style={{fontSize:14,fontWeight:700,color:s.c}}>{loading?"—":s.v}</span>
                  </div>
                ))}
                <div style={{marginTop:14,padding:"10px 12px",background:inputBg,borderRadius:8,fontSize:11.5,color:textMuted,lineHeight:1.5}}>
                  💡 AI is responding to messages in under 3 seconds, 24/7 — even when you're asleep.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
