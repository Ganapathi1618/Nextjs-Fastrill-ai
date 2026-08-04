"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth }  from "@/lib/hooks/useAuth"
import { useTheme } from "@/lib/hooks/useTheme"
import { useToast } from "@/components/Toast"
import { usePlanGuard } from "@/lib/hooks/usePlanGuard"

const NAV = [
  { id:"overview",     label:"Revenue Engine",  icon:"⬡", path:"/dashboard" },
  { id:"inbox",        label:"Conversations",   icon:"◎", path:"/dashboard/conversations" },
  { id:"bookings",     label:"Bookings",        icon:"◷", path:"/dashboard/bookings" },
  { id:"pipeline",     label:"CRM Pipeline",    icon:"⬦", path:"/dashboard/pipeline" },
  { id:"team",         label:"Team",            icon:"⊕", path:"/dashboard/team" },
  { id:"campaigns",    label:"Campaigns",       icon:"◆", path:"/dashboard/campaigns" },
  { id:"sequences",    label:"Sequences",       icon:"⟳", path:"/dashboard/sequences" },
  { id:"leads",        label:"Lead Recovery",   icon:"◉", path:"/dashboard/leads" },
  { id:"contacts",     label:"Customers",       icon:"◑", path:"/dashboard/contacts" },
  { id:"analytics",    label:"Analytics",       icon:"▦", path:"/dashboard/analytics" },
  { id:"templates",    label:"WA Templates",    icon:"▤", path:"/dashboard/templates" },
  { id:"integrations", label:"Integrations",    icon:"⌁", path:"/dashboard/integrations" },
  { id:"reports",      label:"Reports",         icon:"⊟", path:"/dashboard/reports" },
  { id:"referrals",    label:"Refer & Earn",    icon:"◈", path:"/dashboard/referrals" },
  { id:"settings",     label:"Settings",        icon:"◌", path:"/dashboard/settings" },
]

const MOCK_REFERRALS = [
  { name:"Priya Nair", biz:"Glow Parlour", status:"active", plan:"Growth", earned:2000, date:"Jul 12, 2026" },
  { name:"Dr. Ravi Sharma", biz:"Skin First Clinic", status:"active", plan:"Pro", earned:5000, date:"Jun 28, 2026" },
  { name:"Sneha Reddy", biz:"Studio S", status:"trial", plan:"Growth Trial", earned:0, date:"Jul 30, 2026" },
]

const HOW_IT_WORKS = [
  { step:"1", title:"Share your link", desc:"Send your unique referral link to any business owner via WhatsApp, email, or in person.", icon:"🔗" },
  { step:"2", title:"They sign up", desc:"They start a free 14-day trial. No credit card needed — easy for them to say yes.", icon:"✅" },
  { step:"3", title:"They go paid", desc:"When they subscribe to any plan, you earn ₹1,000–₹5,000 instantly in your wallet.", icon:"💸" },
  { step:"4", title:"Withdraw anytime", desc:"Transfer to your bank account or use credits to reduce your own Fastrill bill.", icon:"🏦" },
]

const EARN_TABLE = [
  { plan:"Starter (₹999/mo)", earn:"₹1,000", recurring:"₹200/mo" },
  { plan:"Growth (₹1,999/mo)", earn:"₹2,000", recurring:"₹400/mo" },
  { plan:"Pro (₹4,999/mo)", earn:"₹5,000", recurring:"₹1,000/mo" },
]

export default function Referrals() {
  usePlanGuard()
  const { userId, userEmail, loading: authLoading, logout } = useAuth()
  const { dark, toggleTheme, colors } = useTheme()
  const toast = useToast()
  const router = useRouter()

  const [mobOpen,    setMobOpen]    = useState(false)
  const [refCode,    setRefCode]    = useState("")
  const [referrals,  setReferrals]  = useState(MOCK_REFERRALS)
  const [copied,     setCopied]     = useState(false)
  const [withdrawing,setWithdrawing]= useState(false)

  useEffect(() => {
    if (userId) {
      const code = "FST-"+(userId.slice(0,6).toUpperCase())
      setRefCode(code)
    }
  }, [userId])

  const refLink = typeof window!=="undefined" ? `${window.location.origin}/signup?ref=${refCode}` : `https://fastrill.com/signup?ref=${refCode}`
  const totalEarned = referrals.reduce((s,r)=>s+r.earned,0)
  const active = referrals.filter(r=>r.status==="active").length

  function copyLink() {
    navigator.clipboard.writeText(refLink)
    setCopied(true)
    setTimeout(()=>setCopied(false),2000)
    toast.success("Referral link copied!")
  }

  function shareWhatsApp() {
    const msg = `Hey! I've been using Fastrill to automate my WhatsApp bookings and it's been amazing.\n\nThought you'd love it too — get a free 14-day trial here:\n${refLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank")
  }

  async function withdraw() {
    if (totalEarned === 0) { toast.error("No earnings to withdraw yet"); return }
    setWithdrawing(true)
    await new Promise(r=>setTimeout(r,1000))
    toast.success(`₹${totalEarned.toLocaleString()} withdrawal initiated — arrives in 2-3 business days`)
    setWithdrawing(false)
  }

  const bg   = dark?"#08080e":"#f0f2f5", sb=dark?"#0c0c15":"#ffffff"
  const card = dark?"#0f0f1a":"#ffffff"
  const bdr  = dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.08)"
  const cbdr = dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.09)"
  const tx   = dark?"#eeeef5":"#111827"
  const txm  = dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const txf  = dark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.25)"
  const ibg  = dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"
  const acc  = dark?"#00C9B1":"#00897A"
  const navActive = dark?"rgba(0,196,125,0.1)":"rgba(0,180,115,0.08)"
  const navText   = dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const ui = userEmail?userEmail[0].toUpperCase():"G"

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${bg}!important;color:${tx}!important;font-family:'Plus Jakarta Sans',sans-serif!important;}
        .wrap{display:flex;height:100vh;overflow:hidden;}
        .sidebar{width:224px;flex-shrink:0;background:${sb};border-right:1px solid ${bdr};display:flex;flex-direction:column;overflow-y:auto;}
        .logo{padding:16px 18px;font-weight:800;font-size:20px;color:${tx};text-decoration:none;display:flex;align-items:center;gap:10px;border-bottom:1px solid ${bdr};line-height:1;}
        .nav-section{padding:14px 16px 5px;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${txf};font-weight:600;}
        .nav-item{display:flex;align-items:center;gap:9px;padding:8px 12px;margin:1px 8px;border-radius:8px;cursor:pointer;font-size:13px;color:${navText};font-weight:500;transition:all 0.13s;border:1px solid transparent;background:none;width:calc(100% - 16px);text-align:left;font-family:'Plus Jakarta Sans',sans-serif;}
        .nav-item:hover{background:${ibg};color:${tx};}
        .nav-item.active{background:${navActive};color:${colors.navActiveText};font-weight:600;border-color:${colors.navActiveBdr};}
        .nav-icon{font-size:12px;width:18px;text-align:center;flex-shrink:0;}
        .sbf{margin-top:auto;padding:14px;border-top:1px solid ${bdr};}
        .uc{display:flex;align-items:center;gap:9px;padding:9px;border-radius:9px;background:${ibg};border:1px solid ${cbdr};}
        .ua{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,${acc},#0ea5e9);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#fff;flex-shrink:0;}
        .lb{margin-top:7px;width:100%;padding:7px;border-radius:7px;background:transparent;border:1px solid ${cbdr};font-size:12px;color:${txm};cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .lb:hover{border-color:#fca5a5;color:#ef4444;}
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .topbar{height:54px;flex-shrink:0;border-bottom:1px solid ${bdr};display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:${sb};}
        .content{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:16px;background:${bg};}
        .theme-toggle{display:flex;align-items:center;gap:6px;padding:5px 10px;background:${ibg};border:1px solid ${cbdr};border-radius:8px;cursor:pointer;font-size:11.5px;color:${txm};font-family:'Plus Jakarta Sans',sans-serif;}
        .toggle-pill{width:30px;height:16px;border-radius:100px;background:${dark?acc:"#d1d5db"};position:relative;flex-shrink:0;}
        .toggle-pill::after{content:'';position:absolute;top:2px;width:12px;height:12px;border-radius:50%;background:#fff;left:${dark?"16px":"2px"};}
        .hamburger{display:none;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:6px 9px;cursor:pointer;font-size:17px;color:#eeeef5;line-height:1;margin-right:2px;}
        .mob-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:299;cursor:pointer;}
        .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;}
        .two-col{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        @media(max-width:900px){.stats-grid{grid-template-columns:repeat(2,1fr);}.two-col{grid-template-columns:1fr;}}
        @media(max-width:767px){
          .sidebar{position:fixed;top:0;left:0;height:100vh;z-index:300;transform:translateX(-100%);transition:transform 0.25s ease;width:240px!important;box-shadow:4px 0 24px rgba(0,0,0,0.5);}
          .sidebar.mob-open{transform:translateX(0);}
          .mob-ov{display:block;}
          .hamburger{display:flex!important;}
          .topbar{padding:0 12px!important;}
          .content{padding:12px!important;gap:12px!important;}
          .stats-grid{grid-template-columns:repeat(2,1fr);}
          .two-col{grid-template-columns:1fr;}
        }
        .bnav{display:none;position:fixed;bottom:0;left:0;right:0;background:${sb};border-top:1px solid ${bdr};padding:6px 0 calc(6px + env(safe-area-inset-bottom));z-index:200;}
        @media(max-width:767px){.bnav{display:flex;justify-content:space-around;}.main{padding-bottom:60px;}}
        .bni{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 6px;border:none;background:transparent;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;flex:1;}
        .bnic{font-size:17px;color:rgba(255,255,255,0.3);}
        .bnil{font-size:9px;font-weight:600;color:rgba(255,255,255,0.3);}
        .bni.on .bnic,.bni.on .bnil{color:${acc};}
      `}</style>

      <div className={"mob-ov"+(mobOpen?" open":"")} onClick={()=>setMobOpen(false)}/>
      <div className="wrap">
        <aside className={`sidebar${mobOpen?" mob-open":""}`}>
          <a href="/dashboard" className="logo">
            <img src="/logo.png" width="34" height="34" alt="Fastrill" style={{display:"block",objectFit:"contain",flexShrink:0}}/>
            <span style={{fontWeight:800,fontSize:20,color:tx,letterSpacing:"-0.3px",lineHeight:1}}>fast<span style={{color:acc}}>rill</span></span>
          </a>
          <div className="nav-section">Platform</div>
          {NAV.map(item=>(
            <button key={item.id} className={`nav-item${item.id==="referrals"?" active":""}`} onClick={()=>router.push(item.path)}>
              <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
          <div className="sbf">
            <div className="uc">
              <div className="ua">{ui}</div>
              <div style={{fontSize:11.5,color:txm,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{userEmail||"Loading..."}</div>
            </div>
            <button className="lb" onClick={logout}>↩ Sign out</button>
          </div>
        </aside>

        <div className="main">
          <div className="topbar">
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button className="hamburger" onClick={()=>setMobOpen(s=>!s)}>☰</button>
              <span style={{fontWeight:700,fontSize:15,color:tx}}>Refer & Earn</span>
            </div>
            <button className="theme-toggle" onClick={toggleTheme}>
              <span>{dark?"🌙":"☀️"}</span><div className="toggle-pill"/><span>{dark?"Dark":"Light"}</span>
            </button>
          </div>

          <div className="content">
            {/* Hero banner */}
            <div style={{background:`linear-gradient(135deg,#0F172A,#1E3A5F)`,borderRadius:16,padding:"clamp(20px,3vw,32px)",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,201,177,0.2),transparent)",pointerEvents:"none"}}/>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:acc,marginBottom:8}}>Refer & Earn</div>
              <div style={{fontSize:"clamp(20px,3vw,32px)",fontWeight:800,color:"#fff",lineHeight:1.15,marginBottom:8}}>
                Earn up to ₹5,000<br/>per referral + recurring
              </div>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.6)",marginBottom:20,lineHeight:1.6}}>
                Know a business owner who could use WhatsApp automation? Refer them and earn when they subscribe — plus ₹200–₹1,000 every month they stay active.
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <button onClick={copyLink}
                  style={{padding:"10px 20px",borderRadius:9,background:acc,border:"none",color:"#000",fontWeight:700,fontSize:13.5,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  {copied?"✓ Copied!":"📋 Copy referral link"}
                </button>
                <button onClick={shareWhatsApp}
                  style={{padding:"10px 18px",borderRadius:9,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  📲 Share on WhatsApp
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="stats-grid">
              {[
                {l:"Total Earned",    v:`₹${totalEarned.toLocaleString()}`,  c:"#4ade80"},
                {l:"Active Referrals",v:active,                               c:acc},
                {l:"In Trial",        v:referrals.filter(r=>r.status==="trial").length, c:"#f59e0b"},
                {l:"Pending Payout",  v:`₹${totalEarned.toLocaleString()}`,  c:"#a78bfa"},
              ].map(s=>(
                <div key={s.l} style={{background:card,border:`1px solid ${cbdr}`,borderRadius:11,padding:"13px 15px"}}>
                  <div style={{fontSize:11,color:txm,marginBottom:4}}>{s.l}</div>
                  <div style={{fontSize:22,fontWeight:700,color:s.c}}>{s.v}</div>
                </div>
              ))}
            </div>

            {/* Ref link box */}
            <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:12,padding:"14px 18px"}}>
              <div style={{fontSize:11,fontWeight:600,color:txm,marginBottom:7}}>Your referral link</div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <div style={{flex:1,background:ibg,border:`1px solid ${cbdr}`,borderRadius:8,padding:"9px 13px",fontSize:12.5,color:txm,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {refLink}
                </div>
                <button onClick={copyLink}
                  style={{padding:"9px 16px",borderRadius:8,background:copied?acc:ibg,border:`1px solid ${cbdr}`,color:copied?"#000":txm,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600,whiteSpace:"nowrap",transition:"all 0.15s"}}>
                  {copied?"✓ Copied":"Copy"}
                </button>
              </div>
            </div>

            <div className="two-col">
              {/* How it works */}
              <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:13,padding:"16px 18px"}}>
                <div style={{fontWeight:700,fontSize:13,color:tx,marginBottom:14}}>How it works</div>
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  {HOW_IT_WORKS.map(h=>(
                    <div key={h.step} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                      <div style={{width:32,height:32,borderRadius:9,background:acc+"18",border:`1px solid ${acc}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{h.icon}</div>
                      <div>
                        <div style={{fontWeight:700,fontSize:13,color:tx,marginBottom:2}}>{h.title}</div>
                        <div style={{fontSize:12,color:txm,lineHeight:1.55}}>{h.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Earnings table + payout */}
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:13,overflow:"hidden"}}>
                  <div style={{fontWeight:700,fontSize:13,color:tx,padding:"14px 18px",borderBottom:`1px solid ${bdr}`}}>What you earn</div>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                    <thead>
                      <tr style={{background:ibg}}>
                        <th style={{padding:"8px 14px",textAlign:"left",color:txm,fontWeight:600,fontSize:11}}>Plan</th>
                        <th style={{padding:"8px 14px",textAlign:"right",color:txm,fontWeight:600,fontSize:11}}>One-time</th>
                        <th style={{padding:"8px 14px",textAlign:"right",color:txm,fontWeight:600,fontSize:11}}>Monthly</th>
                      </tr>
                    </thead>
                    <tbody>
                      {EARN_TABLE.map((r,i)=>(
                        <tr key={r.plan} style={{borderTop:`1px solid ${bdr}`}}>
                          <td style={{padding:"9px 14px",color:tx,fontSize:12}}>{r.plan}</td>
                          <td style={{padding:"9px 14px",textAlign:"right",color:"#4ade80",fontWeight:700}}>{r.earn}</td>
                          <td style={{padding:"9px 14px",textAlign:"right",color:acc,fontWeight:700}}>{r.recurring}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:13,padding:"14px 18px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <div style={{fontWeight:700,fontSize:13,color:tx}}>Wallet balance</div>
                    <div style={{fontSize:22,fontWeight:800,color:"#4ade80"}}>₹{totalEarned.toLocaleString()}</div>
                  </div>
                  <button onClick={withdraw} disabled={withdrawing||totalEarned===0}
                    style={{width:"100%",padding:"10px",borderRadius:9,background:totalEarned>0?acc:ibg,border:`1px solid ${cbdr}`,color:totalEarned>0?"#000":txf,fontWeight:700,fontSize:13,cursor:totalEarned>0?"pointer":"default",fontFamily:"'Plus Jakarta Sans',sans-serif",opacity:withdrawing?0.7:1}}>
                    {withdrawing?"Processing…":totalEarned>0?"↓ Withdraw to bank":"No balance yet"}
                  </button>
                  <div style={{fontSize:11,color:txf,marginTop:7,textAlign:"center"}}>Or apply as Fastrill credits to reduce your bill</div>
                </div>
              </div>
            </div>

            {/* Referrals table */}
            {referrals.length>0&&(
              <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:13,overflow:"hidden"}}>
                <div style={{fontWeight:700,fontSize:13,color:tx,padding:"14px 18px",borderBottom:`1px solid ${bdr}`}}>Your referrals</div>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5}}>
                  <thead>
                    <tr style={{background:ibg}}>
                      {["Business","Plan","Status","Earned","Date"].map(h=>(
                        <th key={h} style={{padding:"8px 16px",textAlign:"left",color:txm,fontWeight:600,fontSize:11,borderBottom:`1px solid ${bdr}`}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((r,i)=>(
                      <tr key={i} style={{borderBottom:`1px solid ${bdr}`}}>
                        <td style={{padding:"10px 16px"}}>
                          <div style={{fontWeight:600,color:tx}}>{r.name}</div>
                          <div style={{fontSize:11,color:txm}}>{r.biz}</div>
                        </td>
                        <td style={{padding:"10px 16px",color:txm}}>{r.plan}</td>
                        <td style={{padding:"10px 16px"}}>
                          <span style={{fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:100,background:r.status==="active"?acc+"18":"#f59e0b18",color:r.status==="active"?acc:"#f59e0b",border:`1px solid ${r.status==="active"?acc+"33":"#f59e0b33"}`}}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{padding:"10px 16px",fontWeight:700,color:"#4ade80"}}>₹{r.earned.toLocaleString()}</td>
                        <td style={{padding:"10px 16px",color:txm}}>{r.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      <nav className="bnav">
        {[
          {id:"overview", icon:"⬡",label:"Home",    path:"/dashboard"},
          {id:"analytics",icon:"▦",label:"Analytics",path:"/dashboard/analytics"},
          {id:"reports",  icon:"⊟",label:"Reports",  path:"/dashboard/reports"},
          {id:"referrals",icon:"◈",label:"Refer",    path:"/dashboard/referrals"},
          {id:"settings", icon:"◌",label:"Settings", path:"/dashboard/settings"},
        ].map(item=>(
          <button key={item.id} className={"bni"+(item.id==="referrals"?" on":"")} onClick={()=>router.push(item.path)}>
            <span className="bnic">{item.icon}</span><span className="bnil">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
