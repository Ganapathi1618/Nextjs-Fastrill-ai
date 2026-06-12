"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/Toast"
import { usePlanGuard } from "@/lib/hooks/usePlanGuard"

const NAV = [
  { id:"overview",  label:"Revenue Engine", path:"/dashboard" },
  { id:"inbox",     label:"Conversations",  path:"/dashboard/conversations" },
  { id:"bookings",  label:"Bookings",       path:"/dashboard/bookings" },
  { id:"campaigns", label:"Campaigns",      path:"/dashboard/campaigns" },
  { id:"sequences", label:"Sequences",      path:"/dashboard/sequences" },
  { id:"leads",     label:"Lead Recovery",  path:"/dashboard/leads" },
  { id:"contacts",  label:"Customers",      path:"/dashboard/contacts" },
  { id:"analytics", label:"Analytics",      path:"/dashboard/analytics" },
  { id:"settings",  label:"Settings",       path:"/dashboard/settings" },
]

export default function Dashboard() {
  usePlanGuard()
  const router = useRouter()
  const toast  = useToast()

  const [userEmail, setUserEmail]         = useState("")
  const [userId, setUserId]               = useState(null)
  const [connected, setConnected]         = useState(false)
  const [period, setPeriod]               = useState("today")
  const [dark, setDark]                   = useState(true)
  const [mobSidebarOpen, setMobSidebarOpen] = useState(false)
  const [loading, setLoading]             = useState(true)
  const [stats, setStats]                 = useState({ revenue:0, leads:0, bookings:0, missedLeads:0, aiHandled:0, aiBookings:0, aiRevenue:0 })
  const [funnel, setFunnel]               = useState({ customers:0, convos:0, booked:0, completed:0, revenue:0 })
  const [todayBookings, setTodayBookings] = useState([])
  const [sources, setSources]             = useState([])
  const [healthScore, setHealthScore]     = useState(0)
  const [avgServiceValue, setAvgServiceValue] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) { router.push("/login"); return }
      setUserEmail(data.user.email || "")
      setUserId(data.user.id)
    })
  }, [])

  useEffect(() => { if (userId) loadAll() }, [userId, period])

  async function loadAll() {
    setLoading(true)
    try {
      const now = new Date()
      let from = new Date()
      if (period === "today") from.setHours(0,0,0,0)
      else if (period === "week") from.setDate(now.getDate()-7)
      else from.setDate(1)
      const fromISO     = from.toISOString()
      const fromDateStr = from.toISOString().split("T")[0]
      const todayStr    = now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0")

      const [{ data:wa },{ data:biz },{ data:msgs },{ data:allBks },{ data:leads },{ data:customers }] = await Promise.all([
        supabase.from("whatsapp_connections").select("id").eq("user_id",userId).maybeSingle(),
        supabase.from("business_settings").select("business_name").eq("user_id",userId).maybeSingle(),
        supabase.from("messages").select("direction,is_ai,created_at,conversation_id").eq("user_id",userId).gte("created_at",fromISO).limit(5000),
        supabase.from("bookings").select("status,amount,ai_booked,booking_date,customer_name,service,booking_time").eq("user_id",userId).limit(2000),
        supabase.from("leads").select("status,source,estimated_value,created_at").eq("user_id",userId).gte("created_at",fromISO).limit(1000),
        supabase.from("customers").select("tag,source,created_at").eq("user_id",userId).limit(5000),
      ])

      if (!biz?.business_name) {
        router.push("/onboarding")
        return
      }

      setConnected(!!wa)
      const bks = allBks || []

      const periodBks       = period==="today"
        ? bks.filter(b=>b.booking_date===todayStr&&b.status!=="cancelled")
        : bks.filter(b=>b.booking_date>=fromDateStr&&b.status!=="cancelled")
      const periodConfirmed = periodBks.filter(b=>b.status==="confirmed"||b.status==="completed")
      const revenue         = periodConfirmed.reduce((s,b)=>s+(b.amount||0),0)
      const aiRevenue       = periodBks.filter(b=>b.ai_booked&&(b.status==="confirmed"||b.status==="completed")).reduce((s,b)=>s+(b.amount||0),0)
      const avgVal          = periodConfirmed.length>0 ? Math.round(revenue/periodConfirmed.length) : 0
      const aiHandled       = (msgs||[]).filter(m=>m.is_ai&&m.direction==="outbound").length
      const aiBookings      = periodBks.filter(b=>b.ai_booked&&b.status!=="cancelled").length
      const missedLeads     = (leads||[]).filter(l=>l.status==="open").length
      const uniqueConvos    = new Set((msgs||[]).map(m=>m.conversation_id).filter(Boolean)).size

      setAvgServiceValue(avgVal)
      setStats({ revenue, leads:(leads||[]).length, bookings:periodBks.length, missedLeads, aiHandled, aiBookings, aiRevenue })

      setFunnel({ customers:(customers||[]).length, convos:uniqueConvos, booked:periodBks.length, completed:periodConfirmed.length, revenue })
      setTodayBookings(bks.filter(b=>b.booking_date===todayStr&&b.status!=="cancelled").slice(0,5))

      const srcMap={}
      for(const l of (leads||[])) { const s=l.source||"Organic"; srcMap[s]=(srcMap[s]||0)+1 }
      setSources(Object.entries(srcMap).map(([name,count])=>({name,count})).slice(0,4))

      let score=0
      if(wa)                            score+=25
      if(aiHandled>0)                   score+=Math.min(20,aiHandled*2)
      if(bks.length>0)                  score+=15
      if((leads||[]).length>0)          score+=10
      if((customers||[]).length>2)      score+=15
      if(aiBookings>0)                  score+=15
      setHealthScore(Math.min(100,score))
    } catch(e) { toast.error("Failed to load dashboard") }
    setLoading(false)
  }

  const toggleTheme = ()=>{ const n=!dark; setDark(n); localStorage.setItem("fastrill-theme",n?"dark":"light") }
  const handleLogout = async()=>{ try{ await supabase.auth.signOut(); router.push("/login") } catch(e){ toast.error("Sign out failed") } }
  const handleConnect = ()=>{
    const appId="780799931531576",configId="1090960043190718",redirectUri="https://fastrill.com/api/meta/callback"
    window.location.href=`https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&config_id=${configId}`
  }

  // ── theme tokens (same naming convention: tx/acc/bdr/ibg/sb) ──
  const bg  = dark?"#0a0a0d":"#fafafa"
  const sb  = dark?"#0d0d11":"#ffffff"
  const card= dark?"#101014":"#ffffff"
  const bdr = dark?"#1c1c22":"#e7e7e9"
  const cbdr= dark?"#1c1c22":"#e7e7e9"
  const tx  = dark?"#e8e8ea":"#18181b"
  const txm = dark?"#8b8b93":"#6b6b74"
  const txf = dark?"#55555e":"#9d9da6"
  const ibg = dark?"#16161b":"#f4f4f5"
  const acc = dark?"#00C9B1":"#00897A"
  const red = "#e5484d"
  const amber = "#f5a623"
  const ui  = userEmail?userEmail[0].toUpperCase():"G"

  const hColor = healthScore>=75?acc:healthScore>=40?amber:red
  const pLabel = period==="today"?"today":period==="week"?"past 7 days":"this month"

  const fMax = Math.max(funnel.customers,1)
  const fSteps = [
    {label:"Customers", val:funnel.customers, pct:100},
    {label:"Chats",     val:funnel.convos,    pct:Math.round((funnel.convos/fMax)*100)},
    {label:"Booked",    val:funnel.booked,    pct:Math.round((funnel.booked/fMax)*100)},
    {label:"Completed", val:funnel.completed, pct:Math.round((funnel.completed/fMax)*100)},
  ]

  const fmtINR = n => "₹" + (n||0).toLocaleString("en-IN")

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${bg}!important;color:${tx}!important;font-family:'Inter',system-ui,sans-serif!important;font-size:14px;-webkit-font-smoothing:antialiased;}
        .mono{font-family:'JetBrains Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums;}
        .wrap{display:flex;height:100vh;overflow:hidden;background:${bg};}

        .sidebar{width:208px;flex-shrink:0;background:${sb};border-right:1px solid ${bdr};display:flex;flex-direction:column;overflow-y:auto;scrollbar-width:none;}
        .sidebar::-webkit-scrollbar{display:none;}
        .logo{padding:14px 16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid ${bdr};text-decoration:none;}
        .nav-sec{padding:14px 16px 5px;font-size:10.5px;letter-spacing:0.8px;text-transform:uppercase;color:${txf};font-weight:600;}
        .nav-item{display:block;padding:6px 16px;font-size:13px;color:${txm};font-weight:450;cursor:pointer;border:none;background:none;width:100%;text-align:left;font-family:inherit;border-left:2px solid transparent;transition:color .1s;}
        .nav-item:hover{color:${tx};}
        .nav-item.active{color:${tx};font-weight:600;border-left-color:${acc};background:${ibg};}
        .sbf{margin-top:auto;padding:12px;border-top:1px solid ${bdr};}
        .uc{display:flex;align-items:center;gap:8px;padding:6px 8px;}
        .ua{width:24px;height:24px;border-radius:5px;background:${acc};display:flex;align-items:center;justify-content:center;font-weight:600;font-size:11px;color:#000;flex-shrink:0;}
        .lb{margin-top:4px;width:100%;padding:6px 8px;border-radius:5px;background:transparent;border:1px solid ${bdr};font-size:12px;color:${txm};cursor:pointer;font-family:inherit;text-align:left;}
        .lb:hover{border-color:${red}66;color:${red};}

        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .topbar{height:48px;flex-shrink:0;border-bottom:1px solid ${bdr};display:flex;align-items:center;justify-content:space-between;padding:0 20px;background:${sb};}
        .content{flex:1;overflow-y:auto;padding:20px;background:${bg};}
        .container{max-width:1080px;margin:0 auto;display:flex;flex-direction:column;gap:16px;}

        .card{background:${card};border:1px solid ${cbdr};border-radius:8px;}
        .card-h{padding:12px 16px;border-bottom:1px solid ${bdr};display:flex;align-items:center;justify-content:space-between;}
        .card-t{font-size:13px;font-weight:600;color:${tx};}
        .card-s{font-size:12px;color:${txf};}
        .card-b{padding:16px;}

        .stat-row{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid ${cbdr};border-radius:8px;background:${card};overflow:hidden;}
        .stat{padding:14px 16px;border-right:1px solid ${bdr};}
        .stat:last-child{border-right:none;}
        .stat-l{font-size:11.5px;color:${txm};margin-bottom:6px;font-weight:500;}
        .stat-v{font-size:22px;font-weight:600;color:${tx};line-height:1;letter-spacing:-0.02em;}
        .stat-s{font-size:11px;color:${txf};margin-top:6px;}

        .period-wrap{display:flex;border:1px solid ${bdr};border-radius:6px;overflow:hidden;}
        .pbt{padding:4px 12px;font-size:12px;font-weight:500;cursor:pointer;border:none;background:transparent;color:${txm};font-family:inherit;border-right:1px solid ${bdr};}
        .pbt:last-child{border-right:none;}
        .pbt.on{background:${ibg};color:${tx};font-weight:600;}

        .status{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:${txm};font-weight:500;}
        .sdot{width:6px;height:6px;border-radius:50%;background:${red};}
        .sdot.on{background:${acc};}

        .ttog{display:flex;align-items:center;gap:6px;padding:4px 10px;background:transparent;border:1px solid ${bdr};border-radius:6px;cursor:pointer;font-size:12px;color:${txm};font-family:inherit;}
        .ttog:hover{color:${tx};}

        table{width:100%;border-collapse:collapse;}
        th{text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:${txf};padding:8px 16px;border-bottom:1px solid ${bdr};}
        td{padding:9px 16px;font-size:13px;color:${tx};border-bottom:1px solid ${bdr};}
        tr:last-child td{border-bottom:none;}
        th.r,td.r{text-align:right;}

        .bar-row{display:flex;align-items:center;gap:12px;padding:7px 0;}
        .bar-l{width:84px;font-size:12.5px;color:${txm};flex-shrink:0;}
        .bar-track{flex:1;height:6px;background:${ibg};border-radius:3px;overflow:hidden;}
        .bar-fill{height:100%;background:${acc};border-radius:3px;transition:width .4s ease;}
        .bar-v{width:88px;text-align:right;font-size:12.5px;flex-shrink:0;}

        .two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
        .three-col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;}

        .alink{display:flex;justify-content:space-between;align-items:center;padding:9px 16px;border-bottom:1px solid ${bdr};cursor:pointer;font-size:13px;color:${tx};}
        .alink:last-child{border-bottom:none;}
        .alink:hover{background:${ibg};}
        .alink span:last-child{color:${txf};}

        .btn{padding:6px 14px;border-radius:6px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;border:1px solid transparent;}
        .btn-acc{background:${acc};color:#000;}
        .btn-acc:hover{opacity:0.9;}
        .btn-ghost{background:transparent;border-color:${bdr};color:${txm};}
        .btn-ghost:hover{color:${tx};}

        .hbtn{display:none;background:transparent;border:1px solid ${bdr};border-radius:6px;padding:4px 9px;cursor:pointer;font-size:15px;color:${tx};line-height:1;}
        .mob-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:299;cursor:pointer;}
        .mob-ov.open{display:block;}
        .bnav{display:none;position:fixed;bottom:0;left:0;right:0;background:${sb};border-top:1px solid ${bdr};padding:6px 0;z-index:200;}
        .bni{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 6px;border:none;background:transparent;cursor:pointer;font-family:inherit;flex:1;}
        .bnil{font-size:10px;font-weight:500;color:${txf};}
        .bni.on .bnil{color:${acc};font-weight:600;}

        @media(max-width:1100px){.three-col{grid-template-columns:1fr 1fr;}}
        @media(max-width:920px){.two-col,.three-col{grid-template-columns:1fr;}.stat-row{grid-template-columns:1fr 1fr;}.stat:nth-child(2){border-right:none;}.stat:nth-child(1),.stat:nth-child(2){border-bottom:1px solid ${bdr};}}
        @media(max-width:767px){
          .wrap{position:relative;}
          .sidebar{position:fixed;top:0;left:0;height:100vh;z-index:300;transform:translateX(-100%);transition:transform .22s;width:228px!important;box-shadow:3px 0 16px rgba(0,0,0,0.4);}
          .sidebar.open{transform:translateX(0);}
          .topbar{padding:0 12px!important;}
          .content{padding:12px!important;}
          .hbtn{display:flex!important;}
          .bnav{display:flex;justify-content:space-around;}
          .main{padding-bottom:56px;}
        }
        :focus-visible{outline:2px solid ${acc};outline-offset:1px;}
        @media(prefers-reduced-motion:reduce){*{transition:none!important;}}
      `}</style>

      <div className="wrap">
        <div className={"mob-ov"+(mobSidebarOpen?" open":"")} onClick={()=>setMobSidebarOpen(false)}/>

        <aside className={"sidebar"+(mobSidebarOpen?" open":"")}>
          <a href="/dashboard" className="logo">
            <img src="/logo.png" width="22" height="22" alt="" style={{display:"block",objectFit:"contain"}}/>
            <span style={{fontWeight:700,fontSize:15,color:tx,letterSpacing:"-0.01em"}}>fastrill</span>
          </a>
          <div className="nav-sec">Platform</div>
          {NAV.map(item=>(
            <button key={item.id} className={"nav-item"+(item.id==="overview"?" active":"")} onClick={()=>router.push(item.path)}>
              {item.label}
            </button>
          ))}
          <div className="sbf">
            <div className="uc">
              <div className="ua">{ui}</div>
              <div style={{fontSize:12,color:txm,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{userEmail||"…"}</div>
            </div>
            <button className="lb" onClick={handleLogout}>Sign out</button>
          </div>
        </aside>

        <div className="main">
          <div className="topbar">
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <button className="hbtn" onClick={()=>setMobSidebarOpen(s=>!s)}>≡</button>
              <span style={{fontWeight:600,fontSize:14,color:tx}}>Revenue Engine</span>
              <div className="period-wrap">
                {["today","week","month"].map(p=>(
                  <button key={p} className={"pbt"+(period===p?" on":"")} onClick={()=>setPeriod(p)}>
                    {p==="today"?"Today":p==="week"?"7d":"30d"}
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <button className="ttog" onClick={toggleTheme}>{dark?"Dark":"Light"}</button>
              <div className="status">
                <span className={"sdot"+(connected?" on":"")}/>
                {connected?"WhatsApp connected":"Not connected"}
              </div>
            </div>
          </div>

          <div className="content">
            <div className="container">

              {!connected&&(
                <div className="card" style={{borderColor:acc+"55"}}>
                  <div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,flexWrap:"wrap"}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:13.5,color:tx,marginBottom:3}}>Connect your WhatsApp Business number</div>
                      <div style={{fontSize:12.5,color:txm}}>The AI starts replying to customers the moment it's linked.</div>
                    </div>
                    <button className="btn btn-acc" onClick={handleConnect}>Connect WhatsApp</button>
                  </div>
                </div>
              )}

              {/* KPI strip */}
              <div className="stat-row">
                {[
                  {l:"Revenue",          v:fmtINR(stats.revenue),          s:pLabel},
                  {l:"Leads captured",   v:stats.leads,                    s:pLabel},
                  {l:"Bookings",         v:stats.bookings,                 s:pLabel},
                  {l:"Avg booking value",v:fmtINR(avgServiceValue),        s:"per confirmed booking"},
                ].map(k=>(
                  <div key={k.l} className="stat">
                    <div className="stat-l">{k.l}</div>
                    <div className="stat-v mono">{loading?"–":k.v}</div>
                    <div className="stat-s">{k.s}</div>
                  </div>
                ))}
              </div>

              <div className="two-col">
                {/* Funnel */}
                <div className="card">
                  <div className="card-h">
                    <span className="card-t">Conversion funnel</span>
                    <span className="card-s">{funnel.customers>0?funnel.customers+" customers total":""}</span>
                  </div>
                  <div className="card-b">
                    {loading?(
                      <div style={{color:txf,fontSize:13,padding:"12px 0"}}>Loading…</div>
                    ):funnel.customers===0?(
                      <div style={{color:txf,fontSize:13,padding:"12px 0"}}>No activity yet. Conversations appear here once customers message you.</div>
                    ):(
                      <>
                        {fSteps.map(s=>(
                          <div key={s.label} className="bar-row">
                            <div className="bar-l">{s.label}</div>
                            <div className="bar-track"><div className="bar-fill" style={{width:Math.max(s.pct,2)+"%"}}/></div>
                            <div className="bar-v mono" style={{color:tx}}>{s.val}<span style={{color:txf}}> · {s.pct}%</span></div>
                          </div>
                        ))}
                        <div style={{display:"flex",justifyContent:"space-between",marginTop:12,paddingTop:12,borderTop:`1px solid ${bdr}`}}>
                          <span style={{fontSize:12.5,color:txm}}>Revenue from completed</span>
                          <span className="mono" style={{fontSize:13,fontWeight:600,color:acc}}>{fmtINR(funnel.revenue)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* AI performance */}
                <div className="card">
                  <div className="card-h">
                    <span className="card-t">AI performance</span>
                    <span className="card-s">{pLabel}</span>
                  </div>
                  <table>
                    <tbody>
                      {[
                        {l:"AI replies sent",      v:stats.aiHandled},
                        {l:"Bookings made by AI",  v:stats.aiBookings},
                        {l:"Revenue from AI bookings", v:fmtINR(stats.aiRevenue)},
                        {l:"Open leads, no booking yet", v:stats.missedLeads, warn:stats.missedLeads>0},
                      ].map(r=>(
                        <tr key={r.l}>
                          <td style={{color:txm}}>{r.l}</td>
                          <td className="r mono" style={{fontWeight:600,color:r.warn?amber:tx}}>{loading?"–":r.v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {stats.missedLeads>0&&(
                    <div style={{padding:"10px 16px",borderTop:`1px solid ${bdr}`}}>
                      <button className="btn btn-ghost" style={{width:"100%"}} onClick={()=>router.push("/dashboard/leads")}>
                        Follow up with {stats.missedLeads} open lead{stats.missedLeads>1?"s":""}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="three-col">
                {/* Today's bookings */}
                <div className="card" style={{gridColumn:"span 2"}}>
                  <div className="card-h">
                    <span className="card-t">Today's bookings</span>
                    <span className="card-s">{todayBookings.length} scheduled</span>
                  </div>
                  {loading?(
                    <div style={{padding:16,color:txf,fontSize:13}}>Loading…</div>
                  ):todayBookings.length===0?(
                    <div style={{padding:"22px 16px",color:txf,fontSize:13}}>
                      Nothing scheduled today.{!connected&&" Connect WhatsApp to let the AI book for you."}
                    </div>
                  ):(
                    <table>
                      <thead>
                        <tr><th>Customer</th><th>Service</th><th className="r">Time</th><th className="r">Amount</th></tr>
                      </thead>
                      <tbody>
                        {todayBookings.map(b=>(
                          <tr key={b.customer_name+b.booking_time}>
                            <td style={{fontWeight:500}}>{b.customer_name}</td>
                            <td style={{color:txm}}>{b.service}</td>
                            <td className="r mono">{b.booking_time||"–"}</td>
                            <td className="r mono">{b.amount>0?fmtINR(b.amount):"–"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Health + sources */}
                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  <div className="card">
                    <div className="card-h">
                      <span className="card-t">Setup health</span>
                      <span className="mono" style={{fontSize:13,fontWeight:600,color:hColor}}>{healthScore}/100</span>
                    </div>
                    <div className="card-b" style={{paddingTop:12,paddingBottom:12}}>
                      <div className="bar-track" style={{height:5}}>
                        <div className="bar-fill" style={{width:healthScore+"%",background:hColor}}/>
                      </div>
                      <div style={{fontSize:12,color:txm,marginTop:8}}>
                        {connected?"AI is live and answering customers.":"Connect WhatsApp to activate the AI."}
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-h"><span className="card-t">Lead sources</span></div>
                    {loading?(
                      <div style={{padding:16,color:txf,fontSize:13}}>Loading…</div>
                    ):sources.length===0?(
                      <div style={{padding:16,color:txf,fontSize:13}}>No leads yet.</div>
                    ):(
                      <table><tbody>
                        {sources.map(s=>(
                          <tr key={s.name}>
                            <td style={{color:txm,textTransform:"capitalize"}}>{s.name}</td>
                            <td className="r mono" style={{fontWeight:600}}>{s.count}</td>
                          </tr>
                        ))}
                      </tbody></table>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="card">
                <div className="card-h"><span className="card-t">Quick actions</span></div>
                {[
                  {label:"Send a campaign",            path:"/dashboard/campaigns"},
                  {label:"Recover open leads",         path:"/dashboard/leads"},
                  {label:"Add a booking manually",     path:"/dashboard/bookings"},
                  {label:"Set up a drip sequence",     path:"/dashboard/sequences"},
                ].map(a=>(
                  <div key={a.label} className="alink" onClick={()=>router.push(a.path)}>
                    <span>{a.label}</span><span>→</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>

      <nav className="bnav">
        {[
          {id:"overview",  label:"Home",      path:"/dashboard"},
          {id:"inbox",     label:"Chats",     path:"/dashboard/conversations"},
          {id:"bookings",  label:"Bookings",  path:"/dashboard/bookings"},
          {id:"leads",     label:"Leads",     path:"/dashboard/leads"},
          {id:"contacts",  label:"Customers", path:"/dashboard/contacts"},
        ].map(item=>(
          <button key={item.id} className={"bni"+(item.id==="overview"?" on":"")} onClick={()=>router.push(item.path)}>
            <span className="bnil">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
