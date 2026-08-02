"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth }  from "@/lib/hooks/useAuth"
import { useTheme } from "@/lib/hooks/useTheme"
import { useToast } from "@/components/Toast"
import { usePlanGuard } from "@/lib/hooks/usePlanGuard"

const NAV = [
  { id:"overview",      label:"Revenue Engine",  icon:"⬡", path:"/dashboard" },
  { id:"inbox",         label:"Conversations",   icon:"◎", path:"/dashboard/conversations" },
  { id:"bookings",      label:"Bookings",        icon:"◷", path:"/dashboard/bookings" },
  { id:"pipeline",      label:"CRM Pipeline",    icon:"⬦", path:"/dashboard/pipeline" },
  { id:"team",          label:"Team",            icon:"⊕", path:"/dashboard/team" },
  { id:"campaigns",     label:"Campaigns",       icon:"◆", path:"/dashboard/campaigns" },
  { id:"sequences",     label:"Sequences",       icon:"⟳", path:"/dashboard/sequences" },
  { id:"leads",         label:"Lead Recovery",   icon:"◉", path:"/dashboard/leads" },
  { id:"contacts",      label:"Customers",       icon:"◑", path:"/dashboard/contacts" },
  { id:"templates",     label:"WA Templates",    icon:"▤", path:"/dashboard/templates" },
  { id:"integrations",  label:"Integrations",    icon:"⌁", path:"/dashboard/integrations" },
  { id:"reports",       label:"Reports",         icon:"⊟", path:"/dashboard/reports" },
  { id:"referrals",     label:"Refer & Earn",    icon:"◈", path:"/dashboard/referrals" },
  { id:"analytics",     label:"Analytics",       icon:"▦", path:"/dashboard/analytics" },
  { id:"settings",      label:"Settings",        icon:"◌", path:"/dashboard/settings" },
]

const INTEGRATIONS = [
  {
    id:"meta_ads", name:"Meta Ads", category:"Lead Source",
    desc:"Auto-capture leads from Facebook & Instagram ads directly into your pipeline. Zero manual entry.",
    icon:"📘", color:"#1877F2", badge:"Most popular",
    fields:[{label:"Meta Pixel ID",key:"pixel_id",placeholder:"Enter your Pixel ID"},{label:"Lead Form ID",key:"form_id",placeholder:"Enter Lead Form ID"}]
  },
  {
    id:"google_forms", name:"Google Forms", category:"Lead Source",
    desc:"Any Google Form submission instantly creates a lead and triggers a WhatsApp reply.",
    icon:"📋", color:"#4285F4",
    fields:[{label:"Form Webhook URL",key:"webhook_url",placeholder:"We'll generate this for you",readonly:true}]
  },
  {
    id:"razorpay", name:"Razorpay", category:"Payments",
    desc:"Track payments against leads. When a customer pays, their lead status moves to Won automatically.",
    icon:"💳", color:"#2D87FF",
    fields:[{label:"API Key ID",key:"api_key",placeholder:"rzp_live_..."},{label:"Webhook Secret",key:"webhook_secret",placeholder:"Your webhook secret"}]
  },
  {
    id:"google_calendar", name:"Google Calendar", category:"Bookings",
    desc:"Two-way sync. Bookings made on WhatsApp appear in Google Calendar. Calendar blocks reflect on WhatsApp availability.",
    icon:"📅", color:"#34A853",
    fields:[{label:"Calendar ID",key:"calendar_id",placeholder:"your@gmail.com or calendar ID"}]
  },
  {
    id:"zapier", name:"Zapier", category:"Automation",
    desc:"Connect Fastrill to 6,000+ apps. Send leads to Salesforce, HubSpot, Notion, Sheets — anything.",
    icon:"⚡", color:"#FF4A00",
    fields:[{label:"Zapier Webhook URL",key:"zap_url",placeholder:"https://hooks.zapier.com/..."}]
  },
  {
    id:"indiamart", name:"IndiaMart", category:"Lead Source",
    desc:"Leads from your IndiaMart listing automatically enter Fastrill and get a WhatsApp reply in 2 seconds.",
    icon:"🏭", color:"#FF6600",
    fields:[{label:"IndiaMart API Key",key:"api_key",placeholder:"Enter your IndiaMart API Key"}]
  },
  {
    id:"just_dial", name:"JustDial", category:"Lead Source",
    desc:"Never miss a JustDial enquiry. Every lead gets an instant WhatsApp follow-up.",
    icon:"📞", color:"#E31E25",
    fields:[{label:"JustDial Callback Key",key:"callback_key",placeholder:"Enter callback key"}]
  },
  {
    id:"calendly", name:"Calendly", category:"Bookings",
    desc:"When a Calendly booking is made, Fastrill sends automatic reminders and follow-ups on WhatsApp.",
    icon:"🗓", color:"#006BFF",
    fields:[{label:"Calendly Webhook URL",key:"webhook_url",placeholder:"Generated automatically",readonly:true}]
  },
  {
    id:"shopify", name:"Shopify", category:"E-commerce",
    desc:"Send order confirmations, shipping updates, and win-back campaigns via WhatsApp.",
    icon:"🛍", color:"#96BF48",
    fields:[{label:"Shopify Store URL",key:"store_url",placeholder:"yourstore.myshopify.com"},{label:"API Access Token",key:"token",placeholder:"shpat_..."}]
  },
]

export default function Integrations() {
  usePlanGuard()
  const { userId, userEmail, loading: authLoading, logout } = useAuth()
  const { dark, toggleTheme, colors } = useTheme()
  const toast = useToast()
  const router = useRouter()

  const [mobOpen,   setMobOpen]   = useState(false)
  const [connected, setConnected] = useState({})
  const [expanded,  setExpanded]  = useState(null)
  const [fields,    setFields]    = useState({})
  const [saving,    setSaving]    = useState(null)
  const [filter,    setFilter]    = useState("All")

  const categories = ["All", ...new Set(INTEGRATIONS.map(i=>i.category))]

  useEffect(() => {
    if (!userId) return
    supabase.from("integrations").select("*").eq("user_id", userId).then(({data})=>{
      if (!data) return
      const map = {}
      data.forEach(i=>{ map[i.integration_id] = true; })
      setConnected(map)
    })
  }, [userId])

  async function saveIntegration(intId) {
    setSaving(intId)
    const cfg = fields[intId] || {}
    const { error } = await supabase.from("integrations").upsert({
      user_id: userId, integration_id: intId, config: cfg, connected_at: new Date().toISOString()
    }, { onConflict:"user_id,integration_id" })
    setSaving(null)
    if (error) { toast.error("Failed to save"); return }
    setConnected(p=>({...p,[intId]:true}))
    setExpanded(null)
    toast.success("Integration connected!")
  }

  async function disconnect(intId) {
    await supabase.from("integrations").delete().eq("user_id",userId).eq("integration_id",intId)
    setConnected(p=>({...p,[intId]:false}))
    toast.success("Disconnected")
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

  const filtered = filter==="All" ? INTEGRATIONS : INTEGRATIONS.filter(i=>i.category===filter)
  const connectedCount = Object.values(connected).filter(Boolean).length

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
        .content{flex:1;overflow-y:auto;padding:20px 24px;background:${bg};}
        .theme-toggle{display:flex;align-items:center;gap:6px;padding:5px 10px;background:${ibg};border:1px solid ${cbdr};border-radius:8px;cursor:pointer;font-size:11.5px;color:${txm};font-family:'Plus Jakarta Sans',sans-serif;}
        .toggle-pill{width:30px;height:16px;border-radius:100px;background:${dark?acc:"#d1d5db"};position:relative;flex-shrink:0;}
        .toggle-pill::after{content:'';position:absolute;top:2px;width:12px;height:12px;border-radius:50%;background:#fff;left:${dark?"16px":"2px"};}
        .hamburger{display:none;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:6px 9px;cursor:pointer;font-size:17px;color:#eeeef5;line-height:1;margin-right:2px;}
        .mob-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:299;cursor:pointer;}
        .int-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;margin-top:18px;}
        .int-card{background:${card};border:1px solid ${cbdr};border-radius:13px;overflow:hidden;transition:border-color 0.15s;}
        .int-card:hover{border-color:${acc}44}
        .int-card.open{border-color:${acc}66}
        .int-head{padding:16px 18px;display:flex;align-items:flex-start;gap:12px;cursor:pointer;}
        .int-icon{width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;}
        .int-body{padding:0 18px 16px;border-top:1px solid ${bdr};display:flex;flex-direction:column;gap:10px;}
        .inp{background:${ibg};border:1px solid ${cbdr};border-radius:8px;padding:9px 12px;font-size:12.5px;color:${tx};outline:none;width:100%;font-family:'Plus Jakarta Sans',sans-serif;}
        .inp:focus{border-color:${acc}66}
        .inp:read-only{opacity:0.6;cursor:default;}
        .tag{font-size:10px;font-weight:700;padding:2px 8px;border-radius:100px;border:1px solid}
        @media(max-width:767px){
          .sidebar{position:fixed;top:0;left:0;height:100vh;z-index:300;transform:translateX(-100%);transition:transform 0.25s ease;width:240px!important;box-shadow:4px 0 24px rgba(0,0,0,0.5);}
          .sidebar.mob-open{transform:translateX(0);}
          .mob-ov{display:block;}
          .hamburger{display:flex!important;}
          .topbar{padding:0 12px!important;}
          .content{padding:12px!important;}
          .int-grid{grid-template-columns:1fr;}
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
            <button key={item.id} className={`nav-item${item.id==="integrations"?" active":""}`} onClick={()=>router.push(item.path)}>
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
              <span style={{fontWeight:700,fontSize:15,color:tx}}>Integrations</span>
              <span style={{fontSize:11,color:acc,padding:"2px 9px",background:acc+"18",border:`1px solid ${acc}33`,borderRadius:100,marginLeft:4}}>{connectedCount} connected</span>
            </div>
            <button className="theme-toggle" onClick={toggleTheme}>
              <span>{dark?"🌙":"☀️"}</span><div className="toggle-pill"/><span>{dark?"Dark":"Light"}</span>
            </button>
          </div>

          <div className="content">
            <div style={{background:`linear-gradient(135deg,${acc}18,transparent)`,border:`1px solid ${acc}33`,borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",gap:12,marginBottom:4}}>
              <span style={{fontSize:22}}>⌁</span>
              <div>
                <div style={{fontWeight:700,fontSize:13,color:tx}}>Connect your tools — leads flow in automatically</div>
                <div style={{fontSize:12,color:txm,marginTop:2}}>Every connected source sends leads directly into your pipeline with an instant WhatsApp reply.</div>
              </div>
            </div>

            {/* Category filter */}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:4}}>
              {categories.map(c=>(
                <button key={c} onClick={()=>setFilter(c)}
                  style={{padding:"4px 12px",borderRadius:100,fontSize:11.5,fontWeight:600,cursor:"pointer",border:`1px solid ${filter===c?acc+"55":cbdr}`,background:filter===c?acc+"18":"transparent",color:filter===c?acc:txm,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  {c}
                </button>
              ))}
            </div>

            <div className="int-grid">
              {filtered.map(int=>{
                const isConn = connected[int.id]
                const isOpen = expanded===int.id
                return (
                  <div key={int.id} className={`int-card${isOpen?" open":""}`}>
                    <div className="int-head" onClick={()=>setExpanded(isOpen?null:int.id)}>
                      <div className="int-icon" style={{background:int.color+"18",border:`1px solid ${int.color}33`}}>{int.icon}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                          <span style={{fontWeight:700,fontSize:13.5,color:tx}}>{int.name}</span>
                          {int.badge&&<span className="tag" style={{background:"#f59e0b18",color:"#f59e0b",borderColor:"#f59e0b33"}}>{int.badge}</span>}
                          {isConn&&<span className="tag" style={{background:acc+"18",color:acc,borderColor:acc+"33"}}>✓ Connected</span>}
                        </div>
                        <span className="tag" style={{background:ibg,color:txm,borderColor:cbdr,marginBottom:4,display:"inline-block"}}>{int.category}</span>
                        <div style={{fontSize:12,color:txm,lineHeight:1.55,marginTop:4}}>{int.desc}</div>
                      </div>
                    </div>

                    {isOpen&&(
                      <div className="int-body" style={{paddingTop:14}}>
                        {int.fields.map(f=>(
                          <div key={f.key}>
                            <div style={{fontSize:11,fontWeight:600,color:txm,marginBottom:5}}>{f.label}</div>
                            <input className="inp" readOnly={f.readonly}
                              placeholder={f.readonly?"Auto-generated after save":f.placeholder}
                              value={fields[int.id]?.[f.key]||""}
                              onChange={e=>setFields(p=>({...p,[int.id]:{...(p[int.id]||{}),[f.key]:e.target.value}}))}/>
                          </div>
                        ))}
                        <div style={{display:"flex",gap:8,marginTop:4}}>
                          <button onClick={()=>saveIntegration(int.id)} disabled={saving===int.id}
                            style={{flex:1,padding:"9px",borderRadius:8,background:acc,border:"none",color:"#000",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",opacity:saving===int.id?0.6:1}}>
                            {saving===int.id?"Connecting…":"Connect"}
                          </button>
                          {isConn&&<button onClick={()=>disconnect(int.id)}
                            style={{padding:"9px 14px",borderRadius:8,background:"transparent",border:`1px solid #ef444444`,color:"#ef4444",fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600}}>
                            Disconnect
                          </button>}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      <nav className="bnav">
        {[
          {id:"overview",     icon:"⬡",label:"Home",   path:"/dashboard"},
          {id:"inbox",        icon:"◎",label:"Chats",  path:"/dashboard/conversations"},
          {id:"integrations", icon:"⌁",label:"Connect",path:"/dashboard/integrations"},
          {id:"reports",      icon:"⊟",label:"Reports",path:"/dashboard/reports"},
          {id:"settings",     icon:"◌",label:"Settings",path:"/dashboard/settings"},
        ].map(item=>(
          <button key={item.id} className={"bni"+(item.id==="integrations"?" on":"")} onClick={()=>router.push(item.path)}>
            <span className="bnic">{item.icon}</span><span className="bnil">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
