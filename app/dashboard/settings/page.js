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
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
const LANGUAGES = ["English","Hindi","Telugu","Tamil","Kannada","Malayalam","Marathi","Bengali","Gujarati","Punjabi"]

export default function Settings() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [userId, setUserId] = useState(null)
  const [dark, setDark] = useState(true)
  const [tab, setTab] = useState("business")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  const [business, setBusiness] = useState({ name:"", type:"Salon", phone:"", location:"", mapsLink:"", description:"" })
  const [services, setServices] = useState([])
  const [newService, setNewService] = useState({ name:"", price:"", duration:"30", category:"Hair" })
  const [ai, setAI] = useState({ language:"English", customInstructions:"", autoBooking:true, followUpEnabled:true, greetingMessage:"", missedLeadMessage:"" })
  const [whatsapp, setWhatsapp] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login")
      else { setUserEmail(data.user.email||""); setUserId(data.user.id) }
    })
  }, [])

  useEffect(() => { if (userId) loadAll() }, [userId])

  async function loadAll() {
    setLoading(true)
    const [{ data: bs }, { data: svcs }, { data: wa }] = await Promise.all([
      supabase.from("business_settings").select("*").eq("user_id", userId).single(),
      supabase.from("services").select("*").eq("user_id", userId).order("category"),
      supabase.from("whatsapp_connections").select("*").eq("user_id", userId).single()
    ])
    if (bs) {
      setBusiness({ name:bs.business_name||"", type:bs.business_type||"Salon", phone:bs.phone||"", location:bs.location||"", mapsLink:bs.maps_link||"", description:bs.description||"" })
      setAI({ language:bs.ai_language||"English", customInstructions:bs.ai_instructions||"", autoBooking:bs.auto_booking!==false, followUpEnabled:bs.follow_up_enabled!==false, greetingMessage:bs.greeting_message||"", missedLeadMessage:bs.missed_lead_message||"" })
    }
    setServices(svcs||[])
    setWhatsapp(wa||null)
    setLoading(false)
  }

  async function saveBusiness() {
    setSaving(true)
    const payload = { user_id:userId, business_name:business.name, business_type:business.type, phone:business.phone, location:business.location, maps_link:business.mapsLink, description:business.description, ai_language:ai.language, ai_instructions:ai.customInstructions, auto_booking:ai.autoBooking, follow_up_enabled:ai.followUpEnabled, greeting_message:ai.greetingMessage, missed_lead_message:ai.missedLeadMessage, updated_at:new Date().toISOString() }
    await supabase.from("business_settings").upsert(payload, { onConflict:"user_id" })
    // Also sync to business_knowledge for AI to use
    const knowledgeText = `Business: ${business.name}\nType: ${business.type}\nPhone: ${business.phone}\nLocation: ${business.location}\nMaps: ${business.mapsLink}\nAbout: ${business.description}`
    await supabase.from("business_knowledge").upsert({ user_id:userId, category:"business_info", content:knowledgeText }, { onConflict:"user_id,category" })
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),2500)
  }

  async function addService() {
    if (!newService.name||!newService.price) return
    const { data } = await supabase.from("services").insert({ ...newService, user_id:userId, price:parseInt(newService.price), duration:parseInt(newService.duration) }).select().single()
    if (data) {
      setServices(prev=>[...prev, data])
      setNewService({ name:"", price:"", duration:"30", category:"Hair" })
      // Sync services to knowledge base
      const svcText = [...services, data].map(s=>`${s.name}: ₹${s.price} (${s.duration} min)`).join("\n")
      await supabase.from("business_knowledge").upsert({ user_id:userId, category:"services", content:svcText }, { onConflict:"user_id,category" })
    }
  }

  async function deleteService(id) {
    await supabase.from("services").delete().eq("id", id)
    setServices(prev=>prev.filter(s=>s.id!==id))
  }

  async function disconnectWhatsApp() {
    if (!confirm("Disconnect WhatsApp? AI will stop responding.")) return
    await supabase.from("whatsapp_connections").delete().eq("user_id", userId)
    setWhatsapp(null)
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
  const inp = { background:inputBg, border:`1px solid ${cardBorder}`, borderRadius:8, padding:"9px 12px", fontSize:13, color:text, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none", width:"100%" }

  const TABS = [{ id:"business",label:"Business"},{id:"services",label:"Services"},{id:"ai",label:"AI Brain"},{id:"whatsapp",label:"WhatsApp"}]
  const CATEGORIES = ["Hair","Skin","Nails","Bridal","Massage","Body","Other"]

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
        .content{flex:1;overflow-y:auto;padding:20px 24px;background:${bg};}
        .section-label{font-size:11px;color:${textFaint};fontWeight:600;textTransform:uppercase;letterSpacing:1px;marginBottom:7px;}
        .toggle-row{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid ${border};}
        .tog{width:38px;height:22px;border-radius:100px;position:relative;cursor:pointer;border:none;flex-shrink:0;transition:background 0.2s;}
        .tog::after{content:'';position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left 0.2s;}
        select{color-scheme:dark;background-color:inherit;}
        select option{background-color:#0c0c15!important;color:#eeeef5!important;}
        select:focus{outline:none;}
      `}</style>

      <div className="wrap">
        <aside className="sidebar">
          <a href="/dashboard" className="logo">fast<span>rill</span></a>
          <div className="nav-section">Platform</div>
          {NAV.map(item=>(
            <button key={item.id} className={`nav-item${item.id==="settings"?" active":""}`} onClick={()=>router.push(item.path)}>
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
            <span className="tb-title">Settings</span>
            <div className="topbar-r">
              {(tab==="business"||tab==="ai") && (
                <button onClick={saveBusiness} disabled={saving} style={{background:saved?"#22c55e":accent,color:"#000",border:"none",padding:"7px 18px",borderRadius:8,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"background 0.2s"}}>
                  {saving?"Saving...":saved?"✓ Saved":"Save Changes"}
                </button>
              )}
              <button className="theme-toggle" onClick={toggleTheme}>
                <span>{dark?"🌙":"☀️"}</span><div className="toggle-pill"/><span>{dark?"Dark":"Light"}</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{padding:"0 24px",borderBottom:`1px solid ${border}`,background:sidebar,display:"flex",gap:0,flexShrink:0}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"14px 18px",background:"transparent",border:"none",borderBottom:tab===t.id?`2px solid ${accent}`:"2px solid transparent",color:tab===t.id?accent:textMuted,fontWeight:tab===t.id?700:500,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"all 0.12s"}}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="content">
            {loading ? (
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:200,color:textFaint}}>Loading...</div>
            ) : tab==="business" ? (
              <div style={{maxWidth:620,display:"flex",flexDirection:"column",gap:20}}>
                <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:22}}>
                  <div style={{fontWeight:700,fontSize:14,color:text,marginBottom:16}}>Business Info</div>
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    <div><div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>Business Name *</div><input placeholder="e.g. Priya Beauty Salon" value={business.name} onChange={e=>setBusiness(p=>({...p,name:e.target.value}))} style={inp}/></div>
                    <div><div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>Business Type</div>
                      <select value={business.type} onChange={e=>setBusiness(p=>({...p,type:e.target.value}))} style={inp}>
                        {["Salon","Beauty Parlour","Spa","Clinic","Dermatology","Dental","Gym","Yoga Studio","Other"].map(t=><option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div><div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>WhatsApp Phone Number</div><input placeholder="+91 98765 43210" value={business.phone} onChange={e=>setBusiness(p=>({...p,phone:e.target.value}))} style={inp}/></div>
                    <div><div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>Location / Address</div><input placeholder="Building, Street, City" value={business.location} onChange={e=>setBusiness(p=>({...p,location:e.target.value}))} style={inp}/></div>
                    <div><div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>Google Maps Link</div><input placeholder="https://maps.google.com/..." value={business.mapsLink} onChange={e=>setBusiness(p=>({...p,mapsLink:e.target.value}))} style={inp}/></div>
                    <div><div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>Business Description <span style={{color:textFaint}}>(AI uses this to answer customer questions)</span></div>
                      <textarea placeholder="Tell customers about your salon — specialties, experience, awards, unique selling points..." value={business.description} onChange={e=>setBusiness(p=>({...p,description:e.target.value}))}
                        style={{...inp,resize:"vertical",minHeight:90,lineHeight:1.5}}/>
                    </div>
                  </div>
                </div>
              </div>

            ) : tab==="services" ? (
              <div style={{maxWidth:700,display:"flex",flexDirection:"column",gap:16}}>
                {/* Add service */}
                <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:20}}>
                  <div style={{fontWeight:700,fontSize:14,color:text,marginBottom:14}}>Add Service</div>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:10}}>
                      <div><div style={{fontSize:11,color:textMuted,marginBottom:4}}>Service Name</div><input placeholder="e.g. Haircut" value={newService.name} onChange={e=>setNewService(p=>({...p,name:e.target.value}))} style={inp}/></div>
                      <div><div style={{fontSize:11,color:textMuted,marginBottom:4}}>Price (₹)</div><input type="number" placeholder="500" value={newService.price} onChange={e=>setNewService(p=>({...p,price:e.target.value}))} style={inp}/></div>
                      <div><div style={{fontSize:11,color:textMuted,marginBottom:4}}>Duration (min)</div><input type="number" placeholder="30" value={newService.duration} onChange={e=>setNewService(p=>({...p,duration:e.target.value}))} style={inp}/></div>
                    </div>
                    <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
                      <div style={{flex:1}}><div style={{fontSize:11,color:textMuted,marginBottom:4}}>Category</div>
                        <select value={newService.category} onChange={e=>setNewService(p=>({...p,category:e.target.value}))} style={inp}>
                          {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <button onClick={addService} style={{background:accent,color:"#000",border:"none",padding:"10px 22px",borderRadius:8,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",whiteSpace:"nowrap",height:40,flexShrink:0}}>+ Add Service</button>
                    </div>
                  </div>
                </div>

                {/* Service list */}
                <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,overflow:"hidden"}}>
                  <div style={{padding:"12px 16px",borderBottom:`1px solid ${border}`,fontWeight:700,fontSize:13,color:text}}>Your Services ({services.length})</div>
                  {services.length===0 ? (
                    <div style={{textAlign:"center",padding:"30px",color:textFaint,fontSize:12}}>No services yet — add your first service above</div>
                  ) : CATEGORIES.filter(cat=>services.some(s=>s.category===cat)).map(cat=>(
                    <div key={cat}>
                      <div style={{padding:"8px 16px",background:inputBg,fontSize:10,fontWeight:700,color:textFaint,letterSpacing:"1px",textTransform:"uppercase"}}>{cat}</div>
                      {services.filter(s=>s.category===cat).map(s=>(
                        <div key={s.id} style={{display:"flex",alignItems:"center",padding:"10px 16px",borderBottom:`1px solid ${border}`}}>
                          <div style={{flex:1,fontWeight:600,fontSize:13,color:text}}>{s.name}</div>
                          <div style={{fontSize:12,color:textMuted,marginRight:16}}>{s.duration} min</div>
                          <div style={{fontWeight:700,fontSize:13,color:accent,marginRight:16}}>₹{parseInt(s.price||0).toLocaleString()}</div>
                          <button onClick={()=>deleteService(s.id)} style={{background:"transparent",border:"none",color:textFaint,cursor:"pointer",fontSize:15,lineHeight:1}}>×</button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

            ) : tab==="ai" ? (
              <div style={{maxWidth:620,display:"flex",flexDirection:"column",gap:20}}>
                <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:22}}>
                  <div style={{fontWeight:700,fontSize:14,color:text,marginBottom:16}}>AI Settings</div>

                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    <div><div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>Primary Language</div>
                      <select value={ai.language} onChange={e=>setAI(p=>({...p,language:e.target.value}))} style={inp}>
                        {LANGUAGES.map(l=><option key={l}>{l}</option>)}
                      </select>
                    </div>

                    <div className="toggle-row">
                      <div>
                        <div style={{fontWeight:600,fontSize:13,color:text}}>Auto Booking</div>
                        <div style={{fontSize:11.5,color:textMuted}}>AI books appointments without human approval</div>
                      </div>
                      <button className="tog" style={{background:ai.autoBooking?accent:"rgba(255,255,255,0.12)"}} onClick={()=>setAI(p=>({...p,autoBooking:!p.autoBooking}))}>
                        <span style={{position:"absolute",top:3,width:16,height:16,borderRadius:"50%",background:"#fff",left:ai.autoBooking?"19px":"3px",transition:"left 0.2s",display:"block"}}/>
                      </button>
                    </div>

                    <div className="toggle-row">
                      <div>
                        <div style={{fontWeight:600,fontSize:13,color:text}}>Follow-up Messages</div>
                        <div style={{fontSize:11.5,color:textMuted}}>AI sends follow-ups to inactive leads</div>
                      </div>
                      <button className="tog" style={{background:ai.followUpEnabled?accent:"rgba(255,255,255,0.12)"}} onClick={()=>setAI(p=>({...p,followUpEnabled:!p.followUpEnabled}))}>
                        <span style={{position:"absolute",top:3,width:16,height:16,borderRadius:"50%",background:"#fff",left:ai.followUpEnabled?"19px":"3px",transition:"left 0.2s",display:"block"}}/>
                      </button>
                    </div>

                    <div><div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>Greeting Message</div>
                      <textarea placeholder="Hi [Name]! Welcome to our salon 😊 How can I help you today?" value={ai.greetingMessage} onChange={e=>setAI(p=>({...p,greetingMessage:e.target.value}))}
                        style={{...inp,resize:"vertical",minHeight:70}}/>
                    </div>

                    <div><div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>Custom AI Instructions <span style={{color:textFaint}}>(tone, rules, what to say/avoid)</span></div>
                      <textarea placeholder="Always respond in a warm, friendly tone. Never mention competitor salons. If unsure about pricing, say 'let me check and get back to you'..." value={ai.customInstructions} onChange={e=>setAI(p=>({...p,customInstructions:e.target.value}))}
                        style={{...inp,resize:"vertical",minHeight:110,lineHeight:1.5}}/>
                    </div>
                  </div>
                </div>
              </div>

            ) : tab==="whatsapp" ? (
              <div style={{maxWidth:560,display:"flex",flexDirection:"column",gap:16}}>
                {whatsapp ? (
                  <div style={{background:card,border:`1px solid ${accent}44`,borderRadius:13,padding:22}}>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                      <div style={{width:44,height:44,borderRadius:11,background:"#25d366",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>💬</div>
                      <div>
                        <div style={{fontWeight:800,fontSize:15,color:text}}>WhatsApp Connected ✓</div>
                        <div style={{fontSize:12,color:textMuted}}>Your AI is live and responding</div>
                      </div>
                    </div>
                    {[["Phone Number ID",whatsapp.phone_number_id],["WABA ID",whatsapp.waba_id||"—"],["Status","🟢 Active"]].map(([l,v])=>(
                      <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${border}`}}>
                        <span style={{fontSize:12,color:textMuted}}>{l}</span>
                        <span style={{fontSize:12,fontWeight:600,color:text,fontFamily:"monospace"}}>{v}</span>
                      </div>
                    ))}
                    <button onClick={disconnectWhatsApp} style={{marginTop:16,width:"100%",padding:"9px",background:"rgba(251,113,133,0.1)",border:"1px solid rgba(251,113,133,0.25)",borderRadius:8,color:"#fb7185",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Disconnect WhatsApp</button>
                  </div>
                ) : (
                  <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:28,textAlign:"center"}}>
                    <div style={{fontSize:36,marginBottom:12}}>💬</div>
                    <div style={{fontWeight:800,fontSize:16,color:text,marginBottom:6}}>Connect Your WhatsApp</div>
                    <div style={{fontSize:13,color:textMuted,marginBottom:20,lineHeight:1.6}}>Link your business WhatsApp to activate AI replies, lead capture, and auto-booking.</div>
                    <button onClick={()=>{ const appId="780799931531576",configId="1090960043190718",redirectUri="https://fastrill.com/api/meta/callback"; window.location.href=`https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&config_id=${configId}` }} style={{background:"#1877f2",color:"#fff",border:"none",padding:"11px 24px",borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                      Connect WhatsApp via Meta →
                    </button>
                  </div>
                )}

                <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:20}}>
                  <div style={{fontWeight:700,fontSize:13.5,color:text,marginBottom:12}}>Webhook Configuration</div>
                  {[["Webhook URL","https://fastrill.com/api/meta/webhook"],["Verify Token","fastrill_webhook_2026"],["Events","messages, message_status"]].map(([l,v])=>(
                    <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${border}`}}>
                      <span style={{fontSize:12,color:textMuted}}>{l}</span>
                      <span style={{fontSize:11.5,fontWeight:600,color:text,fontFamily:"monospace",wordBreak:"break-all",textAlign:"right",maxWidth:"60%"}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}
