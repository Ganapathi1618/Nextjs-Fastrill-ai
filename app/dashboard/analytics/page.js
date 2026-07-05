"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/Toast"
import { usePlanGuard } from "@/lib/hooks/usePlanGuard"

const NAV = [
  { id:"overview",  label:"Revenue Engine", icon:"⬡", path:"/dashboard" },
  { id:"inbox",     label:"Conversations",  icon:"◎", path:"/dashboard/conversations" },
  { id:"bookings",  label:"Bookings",       icon:"◷", path:"/dashboard/bookings" },
  { id:"campaigns", label:"Campaigns",      icon:"◆", path:"/dashboard/campaigns" },
  { id:"sequences", label:"Sequences",      icon:"⟳", path:"/dashboard/sequences" },
  { id:"leads",     label:"Lead Recovery",  icon:"◉", path:"/dashboard/leads" },
  { id:"contacts",  label:"Customers",      icon:"◑", path:"/dashboard/contacts" },
  { id:"analytics", label:"Analytics",      icon:"▦", path:"/dashboard/analytics" },
  { id:"settings",  label:"Settings",       icon:"◌", path:"/dashboard/settings" },
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
    async function initAuth() {
      const hash = window.location.hash
      if (hash && hash.includes("access_token")) {
        const params = new URLSearchParams(hash.substring(1))
        const access_token = params.get("access_token")
        const refresh_token = params.get("refresh_token")
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token })
          window.history.replaceState(null, "", window.location.pathname)
        }
      }
      const { data } = await supabase.auth.getUser()
      if (!data?.user) { router.push("/login"); return }
      setUserEmail(data.user.email || "")
      setUserId(data.user.id)
    }
    initAuth()
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

      const allConfirmed = bks.filter(b=>b.status==="confirmed"||b.status==="completed")
      setFunnel({ customers:(customers||[]).length, convos:uniqueConvos, booked:periodBks.length, completed:periodConfirmed.length, revenue })
      setTodayBookings(bks.filter(b=>b.booking_date===todayStr&&b.status!=="cancelled").slice(0,4))

      const srcMap={}
      for(const l of (leads||[])) { const s=l.source||"Organic"; srcMap[s]=(srcMap[s]||0)+1 }
      const srcColors={whatsapp:"#25d366",instagram:"#e1306c",google:"#ea4335",referral:"#f59e0b",organic:"#38bdf8"}
      setSources(Object.entries(srcMap).map(([name,count])=>({name,count,color:srcColors[name.toLowerCase()]||"#a78bfa"})).slice(0,4))

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

  const handleConnect = () => {
    const appId      = process.env.NEXT_PUBLIC_META_APP_ID
    const configId   = process.env.NEXT_PUBLIC_META_CONFIG_ID
    if (!appId || !configId) { toast.error("Meta App ID not configured"); return }
    const appUrl     = process.env.NEXT_PUBLIC_APP_URL        || "https://fastrill.com"
    const redirectUri = appUrl + "/api/meta/callback"
    window.location.href = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&config_id=${configId}&state=${userId}`
  }

  const bg=dark?"#08080e":"#f0f2f5", sb=dark?"#0c0c15":"#ffffff", card=dark?"#0f0f1a":"#ffffff"
  const bdr=dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.08)", cbdr=dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.09)"
  const tx=dark?"#eeeef5":"#111827", txm=dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const txf=dark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.25)", ibg=dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"
  const acc=dark?"#00C9B1":"#00897A"
  const navText=dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const navActive=dark?"rgba(0,196,125,0.1)":"rgba(0,180,115,0.08)"
  const navActiveBorder=dark?"rgba(0,196,125,0.2)":"rgba(0,180,115,0.2)"
  const navActiveText=dark?"#00B5A0":"#00897A"
  const adim=dark?"rgba(0,208,132,0.12)":"rgba(0,147,90,0.1)"
  const ui=userEmail?userEmail[0].toUpperCase():"G"
  const hColor=healthScore>=75?acc:healthScore>=40?"#f59e0b":"#ef4444"
  const hLabel=healthScore>=75?"Excellent":healthScore>=40?"Needs Work":"Getting Started"
  const circ=2*Math.PI*46
  const pLabel=period==="today"?"Today":period==="week"?"This week":"This month"

  const fMax=Math.max(funnel.customers,1)
  const fSteps=[
    {label:"Customers",  val:funnel.customers, pct:100,                                   color:acc,     icon:"◑"},
    {label:"Conversations",val:funnel.convos,   pct:Math.round((funnel.convos/fMax)*100),  color:"#38bdf8",icon:"◎"},
    {label:"Booked",     val:funnel.booked,    pct:Math.round((funnel.booked/fMax)*100),  color:"#a78bfa",icon:"◷"},
    {label:"Completed",  val:funnel.completed, pct:Math.round((funnel.completed/fMax)*100),color:"#f59e0b",icon:"✓"},
    {label:"Revenue",    val:"₹"+(funnel.revenue).toLocaleString(), pct:funnel.customers>0?Math.round((funnel.completed/fMax)*100):0, color:"#fb7185",icon:"₹"},
  ]

  const FunnelShape = ({ steps }) => {
    const w=500, h=280, padX=60, padY=10
    const stepH = (h - padY*2) / steps.length
    return (
      <svg viewBox={`0 0 ${w} ${h}`} style={{width:"100%",height:"auto",display:"block"}}>
        <defs>
          {steps.map((s,i)=>(
            <linearGradient key={`fg${i}`} id={`fg${i}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.25"/>
              <stop offset="50%" stopColor={s.color} stopOpacity="0.15"/>
              <stop offset="100%" stopColor={s.color} stopOpacity="0.25"/>
            </linearGradient>
          ))}
        </defs>
        {steps.map((step,i)=>{
          const topPct = i===0 ? 100 : steps[i-1].pct
          const botPct = step.pct !== null ? step.pct : (steps[i-1]?.pct || 100)
          const topW = Math.max(40, (topPct/100)*(w-padX*2))
          const botW = Math.max(40, (botPct/100)*(w-padX*2))
          const y = padY + i*stepH
          const cx = w/2
          const topL=cx-topW/2, topR=cx+topW/2
          const botL=cx-botW/2, botR=cx+botW/2
          const pts=`${topL},${y} ${topR},${y} ${botR},${y+stepH-2} ${botL},${y+stepH-2}`
          return (
            <g key={i}>
              <polygon points={pts} fill={`url(#fg${i})`} stroke={step.color} strokeWidth="1" strokeOpacity="0.35"/>
              <text x={padX-8} y={y+stepH/2+1} textAnchor="end" fill={step.color} fontSize="11" fontWeight="700" fontFamily="'Plus Jakarta Sans',sans-serif">{step.label}</text>
              <text x={w-padX+8} y={y+stepH/2-4} textAnchor="start" fill={tx} fontSize="16" fontWeight="800" fontFamily="'Plus Jakarta Sans',sans-serif">{loading?"—":step.val}</text>
              {step.pct!==null && <text x={w-padX+8} y={y+stepH/2+12} textAnchor="start" fill={txf} fontSize="10" fontFamily="'Plus Jakarta Sans',sans-serif">{step.pct}% of total</text>}
              {i>0 && (
                <line x1={cx} y1={y-1} x2={cx} y2={y+1} stroke={step.color} strokeWidth="1" strokeOpacity="0.2" strokeDasharray="3,3"/>
              )}
            </g>
          )
        })}
      </svg>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${bg}!important;color:${tx}!important;font-family:'Plus Jakarta Sans',sans-serif!important;}
        .wrap{display:flex;height:100vh;overflow:hidden;background:${bg};}
        .sidebar{width:224px;flex-shrink:0;background:${sb};border-right:1px solid ${bdr};display:flex;flex-direction:column;overflow-y:auto;scrollbar-width:none;}
        .sidebar::-webkit-scrollbar{display:none;}
        .logo{padding:16px 18px;font-weight:800;font-size:20px;color:${tx};text-decoration:none;display:flex;flex-direction:row;align-items:center;gap:10px;border-bottom:1px solid ${bdr};line-height:1;}
        .logo span{color:${acc};}
        .nav-sec{padding:18px 16px 7px;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${txf};font-weight:600;}
        .nav-item{display:flex;align-items:center;gap:9px;padding:9px 12px;margin:1px 8px;border-radius:8px;cursor:pointer;font-size:13.5px;color:${navText};font-weight:500;transition:all 0.13s;border:1px solid transparent;background:none;width:calc(100% - 16px);text-align:left;font-family:'Plus Jakarta Sans',sans-serif;}
        .nav-item:hover{background:${ibg};color:${tx};}
        .nav-item.active{background:${navActive};color:${navActiveText};font-weight:600;border-color:${navActiveBorder};}
        .nav-icon{font-size:13px;width:18px;text-align:center;flex-shrink:0;}
        .sbf{margin-top:auto;padding:14px;border-top:1px solid ${bdr};}
        .uc{display:flex;align-items:center;gap:9px;padding:9px;border-radius:9px;background:${ibg};border:1px solid ${cbdr};}
        .ua{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,${acc},#0ea5e9);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#fff;flex-shrink:0;}
        .lb{margin-top:7px;width:100%;padding:7px;border-radius:7px;background:transparent;border:1px solid ${cbdr};font-size:12px;color:${txm};cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .lb:hover{border-color:#fca5a5;color:#ef4444;}
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .topbar{height:54px;flex-shrink:0;border-bottom:1px solid ${bdr};display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:${sb};}
        .content{flex:1;overflow-y:auto;padding:20px 24px;background:${bg};display:flex;flex-direction:column;gap:14px;}
        .card{background:${card};border:1px solid ${cbdr};border-radius:13px;padding:18px;}
        .two-col{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        .three-col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;}
        .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;}
        @media(max-width:1200px){.three-col{grid-template-columns:1fr 1fr;}}
        @media(max-width:960px){.two-col,.three-col{grid-template-columns:1fr;}}
        @media(max-width:767px){
          .kpi-grid{grid-template-columns:repeat(2,1fr)!important;}
          .health-row{grid-template-columns:1fr!important;}
          .wrap{position:relative;}
          .sidebar{position:fixed;top:0;left:0;height:100vh;z-index:300;transform:translateX(-100%);transition:transform 0.25s;width:240px!important;box-shadow:4px 0 24px rgba(0,0,0,0.5);}
          .sidebar.open{transform:translateX(0);}
          .topbar{padding:0 12px!important;}
          .content{padding:12px!important;}
          .hbtn{display:flex!important;}
          [style*="grid-template-columns: 210px"]{grid-template-columns:1fr!important;}
          [style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important;}
          [style*="grid-template-columns: 1fr 300px"]{grid-template-columns:1fr!important;}
        }
        .mob-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:299;cursor:pointer;}
        .mob-ov.open{display:block;}
        .hbtn{display:none;background:${ibg};border:1px solid ${cbdr};border-radius:8px;padding:6px 9px;cursor:pointer;font-size:17px;color:${tx};line-height:1;margin-right:2px;}
        .period-wrap{display:flex;background:${ibg};border:1px solid ${cbdr};border-radius:8px;padding:2px;gap:1px;}
        .pbt{padding:3px 11px;border-radius:6px;font-size:11.5px;font-weight:600;cursor:pointer;border:none;background:transparent;color:${txm};font-family:'Plus Jakarta Sans',sans-serif;}
        .pbt.on{background:${card};color:${tx};box-shadow:0 1px 3px rgba(0,0,0,0.15);}
        .badge{display:flex;align-items:center;gap:5px;padding:4px 11px;border-radius:100px;font-size:11px;font-weight:600;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);color:#ef4444;white-space:nowrap;}
        .badge.on{background:${adim};border-color:${acc}44;color:${acc};}
        .bdot{width:5px;height:5px;border-radius:50%;background:currentColor;}
        .ttog{display:flex;align-items:center;gap:6px;padding:5px 10px;background:${ibg};border:1px solid ${cbdr};border-radius:8px;cursor:pointer;font-size:11.5px;color:${txm};font-family:'Plus Jakarta Sans',sans-serif;}
        .tpill{width:30px;height:16px;border-radius:100px;background:${dark?acc:"#d1d5db"};position:relative;flex-shrink:0;}
        .tpill::after{content:'';position:absolute;top:2px;width:12px;height:12px;border-radius:50%;background:#fff;left:${dark?"16px":"2px"};}
        .bnav{display:none;position:fixed;bottom:0;left:0;right:0;background:${sb};border-top:1px solid ${bdr};padding:6px 0;z-index:200;}
        @media(max-width:767px){.bnav{display:flex;justify-content:space-around;}.main{padding-bottom:60px;}}
        .bni{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 6px;border:none;background:transparent;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;flex:1;}
        .bnic{font-size:17px;color:rgba(255,255,255,0.3);}
        .bnil{font-size:9px;font-weight:600;color:rgba(255,255,255,0.3);}
        .bni.on .bnic,.bni.on .bnil{color:${acc};}
        select option{background-color:#0c0c15!important;color:#eeeef5!important;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp 0.4s ease both;}
      `}</style>

      <div className="wrap">
        <div className={"mob-ov"+(mobSidebarOpen?" open":"")} onClick={()=>setMobSidebarOpen(false)}/>
        <aside className={"sidebar"+(mobSidebarOpen?" open":"")}>
          <a href="/dashboard" className="logo">
            <img src="/logo.png" width="34" height="34" alt="Fastrill" style={{display:"block",objectFit:"contain",flexShrink:0}}/>
            <span style={{fontWeight:800,fontSize:20,color:tx,letterSpacing:"-0.3px",lineHeight:1}}>fast<span style={{color:acc}}>rill</span></span>
          </a>
          <div className="nav-sec">Platform</div>
          {NAV.map(item=>(
            <button key={item.id} className={"nav-item"+(item.id==="overview"?" active":"")} onClick={()=>router.push(item.path)}>
              <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
          <div className="sbf">
            <div className="uc">
              <div className="ua">{ui}</div>
              <div style={{fontSize:11.5,color:txm,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{userEmail||"Loading..."}</div>
            </div>
            <button className="lb" onClick={handleLogout}>{"↩"} Sign out</button>
          </div>
        </aside>

        <div className="main">
          <div className="topbar">
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button className="hbtn" onClick={()=>setMobSidebarOpen(s=>!s)}>{"☰"}</button>
              <span style={{fontWeight:700,fontSize:15,color:tx}}>Revenue Engine</span>
              <div className="period-wrap">
                {["today","week","month"].map(p=>(
                  <button key={p} className={"pbt"+(period===p?" on":"")} onClick={()=>setPeriod(p)}>
                    {p.charAt(0).toUpperCase()+p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button className="ttog" onClick={toggleTheme}><span>{dark?"🌙":"☀️"}</span><div className="tpill"/><span>{dark?"Dark":"Light"}</span></button>
              <div className={"badge"+(connected?" on":"")}><span className="bdot"/>{connected?"WhatsApp Live":"Not Connected"}</div>
            </div>
          </div>

          <div className="content">
            {!connected&&(
              <div className="fade-up" style={{background:dark?`linear-gradient(135deg,${acc}0f,rgba(56,189,248,0.06))`:`linear-gradient(135deg,${acc}0a,rgba(56,189,248,0.04))`,border:`1px solid ${acc}28`,borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:14}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:38,height:38,borderRadius:10,background:"#25d366",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{"💬"}</div>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,color:tx,marginBottom:2}}>Connect WhatsApp to start generating revenue</div>
                    <div style={{fontSize:11.5,color:txm}}>Link your business number to activate AI-powered lead conversion</div>
                  </div>
                </div>
                <button onClick={handleConnect} style={{background:"#1877f2",color:"#fff",border:"none",padding:"8px 16px",borderRadius:8,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",flexShrink:0}}>Connect WhatsApp {"→"}</button>
              </div>
            )}

            {/* Health + KPIs */}
            <div className="health-row fade-up" style={{display:"grid",gridTemplateColumns:"210px 1fr",gap:14}}>
              <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:13,padding:"20px 16px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",inset:0,background:`radial-gradient(circle at 50% 30%,${acc}0d,transparent 70%)`,pointerEvents:"none"}}/>
                <div style={{fontSize:10,letterSpacing:"1.5px",textTransform:"uppercase",color:txf,fontWeight:600,marginBottom:12}}>Business Health</div>
                <div style={{position:"relative",width:110,height:110,marginBottom:12}}>
                  <svg width="110" height="110" viewBox="0 0 110 110" style={{transform:"rotate(-90deg)"}}>
                    <circle cx="55" cy="55" r="46" fill="none" stroke={dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.07)"} strokeWidth="7"/>
                    <circle cx="55" cy="55" r="46" fill="none" stroke={hColor} strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={`${circ}`} strokeDashoffset={`${circ*(1-healthScore/100)}`} style={{transition:"stroke-dashoffset 1.2s ease"}}/>
                  </svg>
                  <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                    <div style={{fontWeight:800,fontSize:34,lineHeight:1,color:hColor}}>{healthScore}</div>
                    <div style={{fontSize:11,color:txf}}>/100</div>
                  </div>
                </div>
                <div style={{fontWeight:700,fontSize:13,color:hColor,marginBottom:3}}>{hLabel}</div>
                <div style={{fontSize:11,color:txm,lineHeight:1.5}}>{loading?"Calculating...":connected?"AI is active":"Connect WhatsApp to start"}</div>
              </div>

              <div className="kpi-grid">
                {[
                  {name:"Revenue Generated",   val:"₹"+stats.revenue.toLocaleString(),  color:acc,       icon:"₹", sub:pLabel, delta:stats.revenue>0?"+"+stats.revenue.toLocaleString():null},
                  {name:"Leads Captured",      val:stats.leads,                          color:"#38bdf8", icon:"↗", sub:pLabel, delta:stats.leads>0?"+"+stats.leads:null},
                  {name:"Appointments Booked", val:stats.bookings,                       color:"#a78bfa", icon:"◷",sub:pLabel, delta:stats.bookings>0?"+"+stats.bookings:null},
                  {name:"Avg Service Value",   val:"₹"+avgServiceValue.toLocaleString(),color:"#f59e0b", icon:"₹", sub:"per booking", delta:null},
                ].map(k=>(
                  <div key={k.name} style={{background:card,border:`1px solid ${cbdr}`,borderRadius:11,padding:"15px 14px",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${k.color}88,${k.color}22)`,borderRadius:"11px 11px 0 0"}}/>
                    <div style={{position:"absolute",top:12,right:13,fontSize:13,opacity:0.3}}>{k.icon}</div>
                    <div style={{fontSize:11,color:txm,marginBottom:8}}>{k.name}</div>
                    <div style={{fontWeight:700,fontSize:28,letterSpacing:"-1px",lineHeight:1,color:k.color,marginBottom:5}}>{loading?"—":k.val}</div>
                    <div style={{fontSize:10.5,color:txf}}>{k.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversion Funnel — Tapered shape */}
            <div className="card fade-up" style={{animationDelay:"0.1s"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div>
                  <div style={{fontWeight:700,fontSize:14,color:tx}}>Conversion Funnel</div>
                  <div style={{fontSize:11.5,color:txm,marginTop:3}}>Customer journey from first contact to revenue</div>
                </div>
                {funnel.customers>0&&<div style={{fontSize:11,color:txf,background:ibg,padding:"4px 10px",borderRadius:6,border:`1px solid ${cbdr}`}}>Based on {funnel.customers} customers</div>}
              </div>
              {loading?(
                <div style={{textAlign:"center",padding:"30px 0",color:txf,fontSize:13}}>Loading funnel data...</div>
              ):funnel.customers===0?(
                <div style={{textAlign:"center",padding:"30px 0",color:txf,fontSize:13}}>No data yet {"—"} connect WhatsApp and start chatting</div>
              ):(
                <FunnelShape steps={fSteps}/>
              )}
              {!loading && funnel.customers>0 && funnel.convos>0 && (
                <div style={{display:"flex",gap:10,marginTop:12,justifyContent:"center",flexWrap:"wrap"}}>
                  {[
                    {l:"Chat Rate", v:Math.round((funnel.convos/funnel.customers)*100)+"%", c:"#38bdf8"},
                    {l:"Book Rate", v:funnel.convos>0?Math.round((funnel.booked/funnel.convos)*100)+"%":"0%", c:"#a78bfa"},
                    {l:"Complete Rate", v:funnel.booked>0?Math.round((funnel.completed/funnel.booked)*100)+"%":"0%", c:"#f59e0b"},
                  ].map(m=>(
                    <div key={m.l} style={{display:"flex",alignItems:"center",gap:6,background:ibg,border:`1px solid ${cbdr}`,borderRadius:8,padding:"6px 14px"}}>
                      <div style={{width:6,height:6,borderRadius:"50%",background:m.c}}/>
                      <span style={{fontSize:11,color:txm}}>{m.l}</span>
                      <span style={{fontSize:12,fontWeight:700,color:m.c}}>{m.v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Performance + Missed Revenue */}
            <div className="two-col fade-up" style={{animationDelay:"0.15s"}}>
              <div className="card">
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                  <div>
                    <div style={{display:"inline-flex",alignItems:"center",gap:4,background:"rgba(167,139,250,0.12)",border:"1px solid rgba(167,139,250,0.2)",borderRadius:100,padding:"2px 9px",fontSize:10,color:"#a78bfa",fontWeight:700,letterSpacing:"0.5px"}}>{"◈"} AI PERFORMANCE</div>
                    <div style={{fontWeight:700,fontSize:13.5,color:tx,marginTop:8}}>What your AI achieved</div>
                  </div>
                  <div style={{fontSize:11,color:txm}}>Gemini AI</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
                  {[
                    {l:"Conversations Handled",v:stats.aiHandled,    s:"real AI replies",   c:acc},
                    {l:"AI Bookings Created",  v:stats.aiBookings,   s:"auto-booked",       c:"#a78bfa"},
                    {l:"Revenue from AI",      v:"₹"+stats.aiRevenue.toLocaleString(), s:"ai_booked = true", c:"#38bdf8"},
                    {l:"Avg Booking Value",    v:"₹"+avgServiceValue.toLocaleString(), s:"per booking",      c:"#f59e0b"},
                  ].map(m=>(
                    <div key={m.l} style={{background:ibg,border:`1px solid ${cbdr}`,borderRadius:9,padding:12,position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",bottom:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${m.c}55,transparent)`}}/>
                      <div style={{fontWeight:700,fontSize:22,color:m.c,lineHeight:1,marginBottom:3}}>{loading?"—":m.v}</div>
                      <div style={{fontSize:11,color:txm,lineHeight:1.4}}>{m.l}<br/><span style={{opacity:0.6,fontSize:10}}>{m.s}</span></div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{background:card,border:"1px solid rgba(251,113,133,0.18)",borderRadius:13,padding:18}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <div style={{fontWeight:700,fontSize:13.5,color:tx}}>{"🔥"} Missed Revenue</div>
                  <div style={{fontSize:11,color:txm}}>Open leads unfollowed</div>
                </div>
                <div style={{fontWeight:800,fontSize:36,color:"#fb7185",letterSpacing:"-1.5px",lineHeight:1,marginBottom:4}}>
                  {loading?"—":stats.missedLeads>0?stats.missedLeads+" open leads":"All caught up ✅"}
                </div>
                <div style={{fontSize:11.5,color:txm,marginBottom:14}}>
                  {stats.missedLeads>0?"no booking yet this period":"No open leads right now"}
                </div>
                {[
                  {l:"Open leads",       v:stats.missedLeads, c:"#fb7185"},
                  {l:"AI replies sent",  v:stats.aiHandled,   c:acc},
                  {l:"Bookings created", v:stats.bookings,    c:acc},
                ].map(r=>(
                  <div key={r.l} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 10px",background:ibg,border:`1px solid ${cbdr}`,borderRadius:7,marginBottom:5}}>
                    <span style={{fontSize:12,color:txm}}>{r.l}</span>
                    <span style={{fontSize:12,fontWeight:700,color:r.c}}>{loading?"—":r.v}</span>
                  </div>
                ))}
                {stats.missedLeads>0&&(
                  <button onClick={()=>router.push("/dashboard/leads")} style={{width:"100%",marginTop:10,padding:"8px",borderRadius:8,background:"rgba(251,113,133,0.1)",border:"1px solid rgba(251,113,133,0.25)",color:"#fb7185",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                    Recover {stats.missedLeads} leads {"→"}
                  </button>
                )}
              </div>
            </div>

            {/* Sources + Today + Quick Actions */}
            <div className="three-col fade-up" style={{animationDelay:"0.2s"}}>
              <div className="card">
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                  <div style={{fontWeight:700,fontSize:13.5,color:tx}}>Lead Sources</div>
                  <div style={{fontSize:11,color:txm}}>By channel</div>
                </div>
                {loading?<div style={{color:txf,fontSize:12,textAlign:"center",padding:"16px 0"}}>Loading...</div>
                :sources.length===0?<div style={{color:txf,fontSize:12,textAlign:"center",padding:"16px 0"}}>No leads yet</div>
                :(<>
                  {sources.map(s=>{
                    const total=sources.reduce((a,b)=>a+b.count,0)
                    const pct=total>0?Math.round((s.count/total)*100):0
                    return(
                      <div key={s.name} style={{marginBottom:10}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{width:8,height:8,borderRadius:"50%",background:s.color,flexShrink:0}}/>
                            <span style={{fontSize:12.5,color:tx,fontWeight:500,textTransform:"capitalize"}}>{s.name}</span>
                          </div>
                          <span style={{fontWeight:700,fontSize:12,color:s.color}}>{s.count} ({pct}%)</span>
                        </div>
                        <div style={{height:4,borderRadius:100,background:dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)"}}>
                          <div style={{height:4,borderRadius:100,width:`${Math.max(pct,3)}%`,background:`linear-gradient(90deg,${s.color},${s.color}88)`,transition:"width 0.5s"}}/>
                        </div>
                      </div>
                    )
                  })}
                </>)}
              </div>

              <div className="card">
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                  <div style={{fontWeight:700,fontSize:13.5,color:tx}}>Today's Bookings</div>
                  <div style={{fontSize:11,color:txm}}>{todayBookings.length} scheduled</div>
                </div>
                {loading?<div style={{color:txf,fontSize:12,textAlign:"center",padding:"16px 0"}}>Loading...</div>
                :todayBookings.length===0?(
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"22px 0",gap:6}}>
                    <div style={{fontSize:26,opacity:0.2}}>{"📅"}</div>
                    <div style={{fontSize:11.5,color:txf,textAlign:"center",lineHeight:1.5}}>No bookings today<br/>{connected?"Appear automatically from WhatsApp":"Connect WhatsApp to start"}</div>
                  </div>
                ):todayBookings.map(b=>(
                  <div key={b.customer_name+b.booking_time} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${bdr}`}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:12.5,color:tx}}>{b.customer_name}</div>
                      <div style={{fontSize:11,color:txm}}>{b.service}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:11.5,fontWeight:600,color:acc}}>{b.booking_time||"—"}</div>
                      {b.amount>0&&<div style={{fontSize:10.5,color:txf}}>{"₹"}{b.amount}</div>}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{background:card,border:`1px solid ${acc}1e`,borderRadius:13,padding:18}}>
                <div style={{fontSize:10,letterSpacing:"1.2px",textTransform:"uppercase",color:txf,fontWeight:600,marginBottom:4}}>Quick Actions</div>
                <div style={{fontWeight:800,fontSize:20,color:acc,letterSpacing:"-0.5px",lineHeight:1,marginBottom:12}}>Grow Faster</div>
                {[
                  {label:"Send Campaign",   sub:"Reach all customers",        icon:"📢",path:"/dashboard/campaigns",color:acc},
                  {label:"Recover Leads",   sub:stats.missedLeads+" waiting", icon:"◉", path:"/dashboard/leads",   color:"#fb7185"},
                  {label:"Add Booking",     sub:"Manual entry",               icon:"📅",path:"/dashboard/bookings",color:"#a78bfa"},
                  {label:"New Sequence",    sub:"Drip automation",            icon:"⟳", path:"/dashboard/sequences",color:"#38bdf8"},
                ].map(a=>(
                  <div key={a.label} onClick={()=>router.push(a.path)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${bdr}`,cursor:"pointer"}}>
                    <div style={{display:"flex",alignItems:"center",gap:9}}>
                      <span style={{fontSize:15}}>{a.icon}</span>
                      <div>
                        <div style={{fontSize:12,fontWeight:600,color:tx}}>{a.label}</div>
                        <div style={{fontSize:10.5,color:txm}}>{a.sub}</div>
                      </div>
                    </div>
                    <span style={{color:a.color,fontSize:14}}>{"→"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav className="bnav">
        {[
          {id:"overview",  icon:"⬡",label:"Home",      path:"/dashboard"},
          {id:"inbox",     icon:"◎",label:"Chats",     path:"/dashboard/conversations"},
          {id:"bookings",  icon:"◷",label:"Bookings",  path:"/dashboard/bookings"},
          {id:"leads",     icon:"◉",label:"Leads",     path:"/dashboard/leads"},
          {id:"contacts",  icon:"◑",label:"Customers", path:"/dashboard/contacts"},
        ].map(item=>(
          <button key={item.id} className={"bni"+(item.id==="overview"?" on":"")} onClick={()=>router.push(item.path)}>
            <span className="bnic">{item.icon}</span><span className="bnil">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
