"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

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

const LANGUAGES = ["English","Hindi","Telugu","Tamil","Kannada","Malayalam","Marathi","Bengali","Gujarati","Punjabi"]

// Health & Wellness focused business types
const BUSINESS_TYPES = [
  "Salon","Beauty Parlour","Spa","Hair Studio","Nail Studio",
  "Makeup Studio","Skin Clinic","Dermatology Clinic","Dental Clinic",
  "Ayurvedic Clinic","Physiotherapy Clinic","Yoga Studio",
  "Fitness Studio","Gym","Wellness Center","Medispa","Other"
]

// Health & Wellness focused categories
const CATEGORIES = [
  "Hair","Skin","Nails","Bridal","Massage","Body",
  "Dental","Fitness","Ayurveda","Consultation","Membership","Other"
]

const TIMES = [
  "09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30",
  "13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30",
  "17:00","17:30","18:00","18:30","19:00","19:30"
]

const TABS = [
  { id:"business", label:"Business" },
  { id:"services", label:"Services" },
  { id:"ai",       label:"AI Brain" },
  { id:"whatsapp", label:"WhatsApp" }
]

export default function Settings() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [userId, setUserId]       = useState(null)
  const [dark, setDark]           = useState(true)
  const [mobSidebarOpen, setMobSidebarOpen] = useState(false)
  const [tab, setTab]             = useState("business")
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [saveError, setSaveError] = useState("")
  const [loading, setLoading]     = useState(true)

  const [business, setBusiness] = useState({
    name:"", type:"Salon", phone:"", location:"", mapsLink:"",
    description:"", workingHours:""
  })
  const [services, setServices] = useState([])
  const [newService, setNewService] = useState({
    name:"", price:"", duration:"30", category:"Hair",
    capacity:"1", service_type:"appointment", description:""
  })
  const [ai, setAI] = useState({
    language:"English", customInstructions:"", autoBooking:true,
    followUpEnabled:true, greetingMessage:"", missedLeadMessage:""
  })
  const [whatsapp, setWhatsapp] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login")
      else { setUserEmail(data.user.email || ""); setUserId(data.user.id) }
    })
  }, [])

  useEffect(() => { if (userId) loadAll() }, [userId])

  async function loadAll() {
    setLoading(true)
    try {
      const [{ data: bs }, { data: svcs }, { data: wa }] = await Promise.all([
        supabase.from("business_settings").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("services").select("*").eq("user_id", userId).order("category"),
        supabase.from("whatsapp_connections").select("*").eq("user_id", userId).maybeSingle()
      ])
      if (bs) {
        setBusiness({
          name:         bs.business_name  || "",
          type:         bs.business_type  || "Salon",
          phone:        bs.phone          || "",
          location:     bs.location       || "",
          mapsLink:     bs.maps_link      || "",
          description:  bs.description    || "",
          workingHours: bs.working_hours  || ""
        })
        setAI({
          language:           bs.ai_language          || "English",
          customInstructions: bs.ai_instructions      || "",
          autoBooking:        bs.auto_booking         !== false,
          followUpEnabled:    bs.follow_up_enabled    !== false,
          greetingMessage:    bs.greeting_message     || "",
          missedLeadMessage:  bs.missed_lead_message  || ""
        })
      }
      setServices(svcs || [])
      setWhatsapp(wa || null)
    } catch(e) { console.error("loadAll error:", e) }
    setLoading(false)
  }

  async function saveBusiness() {
    if (!business.name.trim()) {
      setSaveError("Business name is required")
      setTimeout(() => setSaveError(""), 3000)
      return
    }
    setSaving(true); setSaveError("")
    try {
      const payload = {
        user_id:             userId,
        business_name:       business.name.trim(),
        business_type:       business.type,
        phone:               business.phone.trim(),
        location:            business.location.trim(),
        maps_link:           business.mapsLink.trim(),
        description:         business.description.trim(),
        working_hours:       business.workingHours.trim(),
        ai_language:         ai.language,
        ai_instructions:     ai.customInstructions.trim(),
        auto_booking:        ai.autoBooking,
        follow_up_enabled:   ai.followUpEnabled,
        greeting_message:    ai.greetingMessage.trim(),
        missed_lead_message: ai.missedLeadMessage.trim(),
        updated_at:          new Date().toISOString()
      }
      const { error: bsErr } = await supabase
        .from("business_settings").upsert(payload, { onConflict: "user_id" })
      if (bsErr) { setSaveError("Failed to save: " + bsErr.message); setSaving(false); return }

      // Sync to business_knowledge for AI webhook
      const knowledgeText = [
        `Business: ${business.name}`,
        `Type: ${business.type}`,
        business.phone       ? `Phone: ${business.phone}`           : "",
        business.location    ? `Location: ${business.location}`     : "",
        business.mapsLink    ? `Maps: ${business.mapsLink}`         : "",
        business.description ? `About: ${business.description}`     : "",
        business.workingHours? `Hours: ${business.workingHours}`    : "",
      ].filter(Boolean).join("\n")

      await supabase.from("business_knowledge").upsert(
        { user_id: userId, category: "business_info", content: knowledgeText },
        { onConflict: "user_id,category" }
      )
      setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch(e) { setSaveError("Unexpected error: " + e.message); setSaving(false) }
  }

  async function addService() {
    if (!newService.name.trim() || !newService.price) return
    setSaving(true)
    try {
      const isPackage = newService.service_type === "package"
      const payload = {
        name:         newService.name.trim(),
        price:        parseInt(newService.price) || 0,
        duration:     isPackage ? null : (parseInt(newService.duration) || 30),
        category:     newService.category,
        capacity:     isPackage ? null : (parseInt(newService.capacity) || 1),
        service_type: newService.service_type,
        description:  newService.description.trim() || null,
        is_active:    true,
        user_id:      userId
      }
      const { data, error } = await supabase.from("services").insert(payload).select().single()
      if (error) { console.error("Add service error:", error); setSaving(false); return }
      if (data) {
        const updated = [...services, data]
        setServices(updated)
        setNewService({ name:"", price:"", duration:"30", category:"Hair", capacity:"1", service_type:"appointment", description:"" })
        await syncServicesToKnowledge(updated)
      }
    } catch(e) { console.error("Unexpected error:", e) }
    setSaving(false)
  }

  async function deleteService(id) {
    await supabase.from("services").delete().eq("id", id)
    const updated = services.filter(s => s.id !== id)
    setServices(updated)
    await syncServicesToKnowledge(updated)
  }

  async function toggleServiceActive(svc) {
    const newActive = svc.is_active === false ? true : false
    await supabase.from("services").update({ is_active: newActive }).eq("id", svc.id)
    const updated = services.map(s => s.id === svc.id ? {...s, is_active: newActive} : s)
    setServices(updated)
  }

  async function syncServicesToKnowledge(svcList) {
    try {
      const active = svcList.filter(s => s.is_active !== false)
      const text = active.map(s => {
        let line = `${s.name}: ₹${s.price}`
        if (s.service_type !== "package" && s.duration) line += ` (${s.duration} min)`
        if (s.service_type === "package" && s.description) line += ` — ${s.description}`
        if (s.capacity > 1) line += ` [${s.capacity} slots]`
        return line
      }).join("\n")
      await supabase.from("business_knowledge").upsert(
        { user_id: userId, category: "services", content: text || "No services listed." },
        { onConflict: "user_id,category" }
      )
    } catch(e) { console.warn("Knowledge sync failed:", e) }
  }

  async function disconnectWhatsApp() {
    if (!confirm("Disconnect WhatsApp? AI will stop responding to customers.")) return
    await supabase.from("whatsapp_connections").delete().eq("user_id", userId)
    setWhatsapp(null)
  }

  const toggleTheme = () => { const n=!dark; setDark(n); localStorage.setItem("fastrill-theme",n?"dark":"light") }
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login") }

  // ── Theme tokens ────────────────────────────────────────────────
  const bg         = dark ? "#08080e"                   : "#f0f2f5"
  const sidebar    = dark ? "#0c0c15"                   : "#ffffff"
  const card       = dark ? "#0f0f1a"                   : "#ffffff"
  const border     = dark ? "rgba(255,255,255,0.07)"    : "rgba(0,0,0,0.08)"
  const cardBorder = dark ? "rgba(255,255,255,0.08)"    : "rgba(0,0,0,0.09)"
  const text       = dark ? "#eeeef5"                   : "#111827"
  const textMuted  = dark ? "rgba(255,255,255,0.45)"    : "rgba(0,0,0,0.5)"
  const textFaint  = dark ? "rgba(255,255,255,0.2)"     : "rgba(0,0,0,0.25)"
  const inputBg    = dark ? "rgba(255,255,255,0.04)"    : "rgba(0,0,0,0.03)"
  const accent     = dark ? "#00d084"                   : "#00935a"
  const navText    = dark ? "rgba(255,255,255,0.45)"    : "rgba(0,0,0,0.5)"
  const navActive  = dark ? "rgba(0,196,125,0.1)"       : "rgba(0,180,115,0.08)"
  const navActiveBorder = dark ? "rgba(0,196,125,0.2)" : "rgba(0,180,115,0.2)"
  const navActiveText   = dark ? "#00c47d"             : "#00935a"
  const userInitial = userEmail ? userEmail[0].toUpperCase() : "G"

  const inp = {
    background: inputBg, border: `1px solid ${cardBorder}`, borderRadius: 8,
    padding: "9px 12px", fontSize: 13, color: text,
    fontFamily: "'Plus Jakarta Sans',sans-serif", outline: "none", width: "100%"
  }

  // Service type pill colours
  const svcTypeStyle = (type) => type === "package"
    ? { color:"#38bdf8", bg:"rgba(56,189,248,0.1)", border:"rgba(56,189,248,0.2)" }
    : { color: accent,   bg:`${accent}18`,           border:`${accent}33` }

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
        .theme-toggle{display:flex;align-items:center;gap:6px;padding:5px 10px;background:${inputBg};border:1px solid ${cardBorder};border-radius:8px;cursor:pointer;font-size:11.5px;color:${textMuted};font-family:'Plus Jakarta Sans',sans-serif;}
        .toggle-pill{width:30px;height:16px;border-radius:100px;background:${dark?accent:"#d1d5db"};position:relative;flex-shrink:0;}
        .toggle-pill::after{content:'';position:absolute;top:2px;width:12px;height:12px;border-radius:50%;background:#fff;left:${dark?"16px":"2px"};}
        .content{flex:1;overflow-y:auto;padding:20px 24px;background:${bg};}
        .toggle-row{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid ${border};}
        .tog{width:38px;height:22px;border-radius:100px;position:relative;cursor:pointer;border:none;flex-shrink:0;transition:background 0.2s;}
        .tog::after{content:'';position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left 0.2s;}
        select{color-scheme:dark;}
        select option{background-color:#0c0c15!important;color:#eeeef5!important;}
        .svc-type-btn{padding:5px 12px;border-radius:7px;font-size:11.5px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.12s;}
        @media(max-width:767px){
          .wrap{position:relative;}
          .sidebar{position:fixed;top:0;left:0;height:100vh;z-index:300;transform:translateX(-100%);transition:transform 0.25s ease;width:240px!important;box-shadow:4px 0 24px rgba(0,0,0,0.5);}
          .sidebar.mob-open{transform:translateX(0);}
          .mob-overlay{display:block!important;}
          .main{width:100%;}
          .topbar{padding:0 12px!important;}
          .content{padding:12px!important;}
          .hamburger{display:flex!important;}
        }
        .mob-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:299;cursor:pointer;}
        .hamburger{display:none;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:6px 9px;cursor:pointer;font-size:17px;color:#eeeef5;line-height:1;margin-right:2px;}
        @media(max-width:767px){
          [style*="grid-template-columns: 2fr 1fr 1fr 1fr"]{grid-template-columns:1fr 1fr!important;}
          [style*="grid-template-columns: repeat(4"]{grid-template-columns:repeat(2,1fr)!important;}
        }
        .bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;background:#0c0c15;border-top:1px solid rgba(255,255,255,0.07);padding:6px 0;z-index:200;}
        @media(max-width:767px){.bottom-nav{display:flex;justify-content:space-around;}.main{padding-bottom:60px;}}
        .bnav-btn{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 6px;border:none;background:transparent;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;flex:1;}
        .bnav-icon{font-size:17px;color:rgba(255,255,255,0.3);}
        .bnav-label{font-size:9px;font-weight:600;color:rgba(255,255,255,0.3);}
        .bnav-btn.active .bnav-icon,.bnav-btn.active .bnav-label{color:#00d084;}
      `}</style>

      <div className="wrap">
        <div className="mob-overlay" style={{display: mobSidebarOpen?"block":"none"}} onClick={()=>setMobSidebarOpen(false)}/>
        <aside className={`sidebar${mobSidebarOpen?" mob-open":""}`}>
          <a href="/dashboard" className="logo">fast<span>rill</span></a>
          <div className="nav-section">Platform</div>
          {NAV.map(item => (
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
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button className="hamburger" onClick={()=>setMobSidebarOpen(s=>!s)}>☰</button>
              <span style={{fontWeight:700,fontSize:15,color:text}}>Settings</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {(tab==="business"||tab==="ai") && (
                <button onClick={saveBusiness} disabled={saving} style={{
                  background: saved?"#22c55e":saveError?"#ef4444":accent,
                  color:"#000",border:"none",padding:"7px 18px",borderRadius:8,
                  fontWeight:700,fontSize:12,cursor:saving?"not-allowed":"pointer",
                  fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"background 0.2s"
                }}>
                  {saving?"Saving...":saved?"✓ Saved":saveError?"✗ Error":"Save Changes"}
                </button>
              )}
              <button className="theme-toggle" onClick={toggleTheme}>
                <span>{dark?"🌙":"☀️"}</span><div className="toggle-pill"/>
              </button>
            </div>
          </div>

          {/* Error banner */}
          {saveError && (
            <div style={{margin:"0 24px",marginTop:8,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#f87171"}}>
              ⚠️ {saveError}
            </div>
          )}

          {/* Tabs */}
          <div style={{padding:"0 24px",borderBottom:`1px solid ${border}`,background:sidebar,display:"flex",gap:0,flexShrink:0}}>
            {TABS.map(t => (
              <button key={t.id} onClick={()=>setTab(t.id)} style={{
                padding:"14px 18px",background:"transparent",border:"none",
                borderBottom:tab===t.id?`2px solid ${accent}`:"2px solid transparent",
                color:tab===t.id?accent:textMuted,
                fontWeight:tab===t.id?700:500,fontSize:13,cursor:"pointer",
                fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"all 0.12s"
              }}>{t.label}</button>
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
                    <div>
                      <div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>Business Name *</div>
                      <input placeholder="e.g. Priya Beauty Salon" value={business.name} onChange={e=>setBusiness(p=>({...p,name:e.target.value}))} style={inp}/>
                    </div>
                    <div>
                      <div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>Business Type</div>
                      <select value={business.type} onChange={e=>setBusiness(p=>({...p,type:e.target.value}))} style={inp}>
                        {BUSINESS_TYPES.map(t=><option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>WhatsApp Phone Number</div>
                      <input placeholder="+91 98765 43210" value={business.phone} onChange={e=>setBusiness(p=>({...p,phone:e.target.value}))} style={inp}/>
                    </div>
                    <div>
                      <div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>Location / Address</div>
                      <input placeholder="Shop no, Building, Street, City" value={business.location} onChange={e=>setBusiness(p=>({...p,location:e.target.value}))} style={inp}/>
                    </div>
                    <div>
                      <div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>Google Maps Link</div>
                      <input placeholder="https://maps.google.com/..." value={business.mapsLink} onChange={e=>setBusiness(p=>({...p,mapsLink:e.target.value}))} style={inp}/>
                    </div>
                    <div>
                      <div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>
                        Working Hours <span style={{color:textFaint}}>(AI uses this to answer availability questions)</span>
                      </div>
                      <input placeholder="e.g. Mon–Sat 10am–8pm, Sunday 11am–6pm" value={business.workingHours} onChange={e=>setBusiness(p=>({...p,workingHours:e.target.value}))} style={inp}/>
                    </div>
                    <div>
                      <div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>
                        About Your Business <span style={{color:textFaint}}>(AI uses this to answer customer questions)</span>
                      </div>
                      <textarea
                        placeholder="Tell customers what makes your salon/spa/clinic special — your experience, specialties, certifications, awards, and what to expect when they visit..."
                        value={business.description}
                        onChange={e=>setBusiness(p=>({...p,description:e.target.value}))}
                        style={{...inp,resize:"vertical",minHeight:90,lineHeight:1.5}}
                      />
                    </div>
                  </div>
                </div>
                <div style={{fontSize:12,color:textFaint,textAlign:"center"}}>
                  💡 After saving, your AI will immediately use this info to answer customer questions
                </div>
              </div>

            ) : tab==="services" ? (
              <div style={{maxWidth:720,display:"flex",flexDirection:"column",gap:16}}>

                {/* Add service form */}
                <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:20}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                    <div style={{fontWeight:700,fontSize:14,color:text}}>Add Service</div>
                    {/* Service type toggle */}
                    <div style={{display:"flex",gap:4,background:inputBg,border:`1px solid ${cardBorder}`,borderRadius:8,padding:3}}>
                      {[
                        {val:"appointment", label:"Appointment"},
                        {val:"package",     label:"Package"}
                      ].map(opt => {
                        const active = newService.service_type === opt.val
                        return (
                          <button key={opt.val}
                            onClick={()=>setNewService(p=>({...p,service_type:opt.val}))}
                            style={{
                              padding:"5px 12px",borderRadius:6,fontSize:11.5,fontWeight:600,
                              cursor:"pointer",border:"none",fontFamily:"'Plus Jakarta Sans',sans-serif",
                              background: active ? (opt.val==="package"?"rgba(56,189,248,0.15)":accent+"22") : "transparent",
                              color: active ? (opt.val==="package"?"#38bdf8":accent) : textMuted,
                              transition:"all 0.12s"
                            }}>
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Type hint */}
                  <div style={{fontSize:11.5,color:textFaint,marginBottom:14,padding:"8px 12px",background:inputBg,borderRadius:7,borderLeft:`2px solid ${newService.service_type==="package"?"#38bdf8":accent}`}}>
                    {newService.service_type==="appointment"
                      ? "⏰ Appointment — has duration and time slot booking (e.g. Haircut 45 min, Facial 60 min)"
                      : "📦 Package — sold as a bundle, no slot booking needed (e.g. 10-session membership, Bridal Package)"}
                  </div>

                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {/* Row 1: name, price, category */}
                    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:10}}>
                      <div>
                        <div style={{fontSize:11,color:textMuted,marginBottom:4}}>Service Name *</div>
                        <input placeholder={newService.service_type==="appointment"?"e.g. Hair Colour, Facial":"e.g. Bridal Package, 10 Sessions"} value={newService.name} onChange={e=>setNewService(p=>({...p,name:e.target.value}))} style={inp}/>
                      </div>
                      <div>
                        <div style={{fontSize:11,color:textMuted,marginBottom:4}}>Price (₹) *</div>
                        <input type="number" placeholder="500" value={newService.price} onChange={e=>setNewService(p=>({...p,price:e.target.value}))} style={inp}/>
                      </div>
                      <div>
                        <div style={{fontSize:11,color:textMuted,marginBottom:4}}>Category</div>
                        <select value={newService.category} onChange={e=>setNewService(p=>({...p,category:e.target.value}))} style={inp}>
                          {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Row 2: duration + capacity (appointment only) OR description (package only) */}
                    {newService.service_type==="appointment" ? (
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                        <div>
                          <div style={{fontSize:11,color:textMuted,marginBottom:4}}>Duration (minutes)</div>
                          <select value={newService.duration} onChange={e=>setNewService(p=>({...p,duration:e.target.value}))} style={inp}>
                            {[15,20,30,45,60,75,90,120,150,180].map(d=><option key={d} value={d}>{d} min</option>)}
                          </select>
                        </div>
                        <div>
                          <div style={{fontSize:11,color:textMuted,marginBottom:4}}>
                            Capacity <span style={{color:textFaint,fontSize:10}}>(parallel bookings per slot)</span>
                          </div>
                          <input type="number" min="1" max="20" placeholder="1" value={newService.capacity} onChange={e=>setNewService(p=>({...p,capacity:e.target.value}))} style={inp}/>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{fontSize:11,color:textMuted,marginBottom:4}}>
                          Package Description <span style={{color:textFaint}}>(AI tells customers what's included)</span>
                        </div>
                        <input placeholder="e.g. Includes 10 sessions, valid for 3 months" value={newService.description} onChange={e=>setNewService(p=>({...p,description:e.target.value}))} style={inp}/>
                      </div>
                    )}

                    <button
                      onClick={addService}
                      disabled={saving||!newService.name||!newService.price}
                      style={{
                        background:(saving||!newService.name||!newService.price)?"rgba(0,208,132,0.3)":accent,
                        color:"#000",border:"none",padding:"10px",borderRadius:8,fontWeight:700,
                        fontSize:13,cursor:(saving||!newService.name||!newService.price)?"not-allowed":"pointer",
                        fontFamily:"'Plus Jakarta Sans',sans-serif"
                      }}>
                      {saving?"Adding...":"+ Add Service"}
                    </button>
                  </div>
                </div>

                {/* Services list */}
                <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,overflow:"hidden"}}>
                  <div style={{padding:"12px 16px",borderBottom:`1px solid ${border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{fontWeight:700,fontSize:13,color:text}}>Your Services ({services.length})</div>
                    <div style={{fontSize:11,color:textFaint}}>
                      {services.filter(s=>s.service_type!=="package").length} appointments · {services.filter(s=>s.service_type==="package").length} packages
                    </div>
                  </div>
                  {services.length===0 ? (
                    <div style={{textAlign:"center",padding:"32px",color:textFaint,fontSize:12}}>
                      No services yet — add your first service above
                    </div>
                  ) : CATEGORIES.filter(cat=>services.some(s=>s.category===cat)).map(cat=>(
                    <div key={cat}>
                      <div style={{padding:"7px 16px",background:inputBg,fontSize:10,fontWeight:700,color:textFaint,letterSpacing:"1px",textTransform:"uppercase"}}>{cat}</div>
                      {services.filter(s=>s.category===cat).map(s=>{
                        const typeStyle = svcTypeStyle(s.service_type)
                        return (
                          <div key={s.id} style={{display:"flex",alignItems:"center",padding:"10px 16px",borderBottom:`1px solid ${border}`,gap:10,opacity:s.is_active===false?0.45:1}}>
                            {/* Service type badge */}
                            <span style={{fontSize:9.5,fontWeight:700,color:typeStyle.color,background:typeStyle.bg,border:`1px solid ${typeStyle.border}`,borderRadius:100,padding:"1px 7px",flexShrink:0}}>
                              {s.service_type==="package"?"pkg":"appt"}
                            </span>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontWeight:600,fontSize:13,color:text}}>{s.name}</div>
                              {s.service_type==="package" && s.description && (
                                <div style={{fontSize:11,color:textFaint,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.description}</div>
                              )}
                            </div>
                            {s.service_type!=="package" && s.duration && (
                              <div style={{fontSize:11.5,color:textMuted,flexShrink:0}}>{s.duration} min</div>
                            )}
                            {s.service_type!=="package" && (s.capacity||1)>1 && (
                              <div style={{fontSize:10.5,fontWeight:700,color:"#38bdf8",background:"rgba(56,189,248,0.1)",border:"1px solid rgba(56,189,248,0.2)",borderRadius:100,padding:"1px 7px",flexShrink:0}}>
                                {s.capacity} slots
                              </div>
                            )}
                            <div style={{fontWeight:700,fontSize:13,color:accent,flexShrink:0}}>₹{parseInt(s.price||0).toLocaleString()}</div>
                            <button
                              onClick={()=>toggleServiceActive(s)}
                              style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:100,flexShrink:0,
                                border:`1px solid ${s.is_active===false?"rgba(251,113,133,0.3)":accent+"44"}`,
                                background:s.is_active===false?"rgba(251,113,133,0.08)":"rgba(0,208,132,0.08)",
                                color:s.is_active===false?"#fb7185":accent,
                                cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                              {s.is_active===false?"Off":"On"}
                            </button>
                            <button onClick={()=>deleteService(s.id)} style={{background:"transparent",border:"none",color:textFaint,cursor:"pointer",fontSize:16,lineHeight:1,flexShrink:0}}>×</button>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>

                {/* Capacity explainer */}
                <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:10,padding:"12px 16px",fontSize:12,color:textMuted,lineHeight:1.6}}>
                  💡 <strong style={{color:text}}>Capacity</strong> = how many customers can book the same slot simultaneously. A salon with 3 stylists doing haircuts can set capacity to 3 — AI will book up to 3 haircuts at 10am before marking it full.
                </div>
              </div>

            ) : tab==="ai" ? (
              <div style={{maxWidth:620,display:"flex",flexDirection:"column",gap:20}}>
                <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:22}}>
                  <div style={{fontWeight:700,fontSize:14,color:text,marginBottom:4}}>AI Brain Settings</div>
                  <div style={{fontSize:12,color:textFaint,marginBottom:16}}>Control how your AI responds to customers on WhatsApp</div>

                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    <div>
                      <div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>Primary Language</div>
                      <select value={ai.language} onChange={e=>setAI(p=>({...p,language:e.target.value}))} style={inp}>
                        {LANGUAGES.map(l=><option key={l}>{l}</option>)}
                      </select>
                    </div>

                    <div className="toggle-row">
                      <div>
                        <div style={{fontWeight:600,fontSize:13,color:text}}>Auto Booking</div>
                        <div style={{fontSize:11.5,color:textMuted}}>AI books appointments automatically from WhatsApp chat</div>
                      </div>
                      <button className="tog" style={{background:ai.autoBooking?accent:"rgba(255,255,255,0.12)"}} onClick={()=>setAI(p=>({...p,autoBooking:!p.autoBooking}))}>
                        <span style={{position:"absolute",top:3,width:16,height:16,borderRadius:"50%",background:"#fff",left:ai.autoBooking?"19px":"3px",transition:"left 0.2s",display:"block"}}/>
                      </button>
                    </div>

                    <div className="toggle-row">
                      <div>
                        <div style={{fontWeight:600,fontSize:13,color:text}}>Follow-up Messages</div>
                        <div style={{fontSize:11.5,color:textMuted}}>AI follows up with inactive leads automatically</div>
                      </div>
                      <button className="tog" style={{background:ai.followUpEnabled?accent:"rgba(255,255,255,0.12)"}} onClick={()=>setAI(p=>({...p,followUpEnabled:!p.followUpEnabled}))}>
                        <span style={{position:"absolute",top:3,width:16,height:16,borderRadius:"50%",background:"#fff",left:ai.followUpEnabled?"19px":"3px",transition:"left 0.2s",display:"block"}}/>
                      </button>
                    </div>

                    <div>
                      <div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>
                        Greeting Message <span style={{color:textFaint}}>(sent to new customers on first message)</span>
                      </div>
                      <textarea
                        placeholder={`Hi [Name]! Welcome to ${business.name||"our salon"} 😊\n\nHow can I help you today?`}
                        value={ai.greetingMessage}
                        onChange={e=>setAI(p=>({...p,greetingMessage:e.target.value}))}
                        style={{...inp,resize:"vertical",minHeight:80}}
                      />
                    </div>

                    <div>
                      <div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>
                        Custom AI Instructions <span style={{color:textFaint}}>(tone, rules, what to say or avoid)</span>
                      </div>
                      <textarea
                        placeholder={`Examples for ${business.type||"salon"}:\n• Always respond warmly and use the customer's first name\n• Upsell hair spa with every haircut booking\n• If customer asks about parking, say free parking available below the building\n• Never mention competitor prices\n• If unsure about pricing, say "let me check and get back to you"`}
                        value={ai.customInstructions}
                        onChange={e=>setAI(p=>({...p,customInstructions:e.target.value}))}
                        style={{...inp,resize:"vertical",minHeight:140,lineHeight:1.6}}
                      />
                    </div>

                    <div style={{background:"rgba(0,208,132,0.06)",border:`1px solid ${accent}22`,borderRadius:9,padding:"12px 14px",fontSize:12,color:textMuted,lineHeight:1.7}}>
                      💡 <strong style={{color:text}}>What your AI knows:</strong> Your business name, type, location, working hours, all services with prices and durations, and your custom instructions above.<br/><br/>
                      🧠 <strong style={{color:text}}>The more you fill in, the smarter your AI gets.</strong> Add upsell rules, FAQs, parking info, cancellation policy — anything a new staff member would need to know.
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
                        <div style={{fontSize:12,color:textMuted}}>Your AI is live and responding to customers</div>
                      </div>
                    </div>
                    {[
                      ["Phone Number ID", whatsapp.phone_number_id],
                      ["WABA ID",         whatsapp.waba_id||"—"],
                      ["Status",          "🟢 Active"]
                    ].map(([l,v])=>(
                      <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${border}`}}>
                        <span style={{fontSize:12,color:textMuted}}>{l}</span>
                        <span style={{fontSize:12,fontWeight:600,color:text,fontFamily:"monospace"}}>{v}</span>
                      </div>
                    ))}
                    <button onClick={disconnectWhatsApp} style={{marginTop:16,width:"100%",padding:"9px",background:"rgba(251,113,133,0.1)",border:"1px solid rgba(251,113,133,0.25)",borderRadius:8,color:"#fb7185",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                      Disconnect WhatsApp
                    </button>
                  </div>
                ) : (
                  <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:28,textAlign:"center"}}>
                    <div style={{fontSize:36,marginBottom:12}}>💬</div>
                    <div style={{fontWeight:800,fontSize:16,color:text,marginBottom:6}}>Connect Your WhatsApp</div>
                    <div style={{fontSize:13,color:textMuted,marginBottom:20,lineHeight:1.6}}>Link your business WhatsApp to activate AI replies, lead capture, and auto-booking.</div>
                    <button onClick={()=>{
                      const appId="780799931531576",configId="1090960043190718"
                      const redirectUri="https://fastrill.com/api/meta/callback"
                      window.location.href=`https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&config_id=${configId}`
                    }} style={{background:"#1877f2",color:"#fff",border:"none",padding:"11px 24px",borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                      Connect WhatsApp via Meta →
                    </button>
                  </div>
                )}

                <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:20}}>
                  <div style={{fontWeight:700,fontSize:13.5,color:text,marginBottom:12}}>Webhook Configuration</div>
                  {[
                    ["Webhook URL",  "https://fastrill.com/api/meta/webhook"],
                    ["Verify Token","fastrill_webhook_2026"],
                    ["Events",      "messages, message_status"]
                  ].map(([l,v])=>(
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
