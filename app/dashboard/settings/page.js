"use client"
export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

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

const TABS = [
  { id:"business", label:"Business",  icon:"🏢" },
  { id:"services", label:"Services",  icon:"📋" },
  { id:"ai",       label:"AI Brain",  icon:"🧠" },
  { id:"whatsapp", label:"WhatsApp",  icon:"💬" },
  { id:"account",  label:"Account",   icon:"👤" },
]

const LANGUAGES  = ["English","Hindi","Telugu","Tamil","Kannada","Malayalam","Marathi","Bengali","Gujarati","Punjabi","Auto-detect"]
const BIZ_TYPES  = ["Salon","Beauty Parlour","Spa","Hair Studio","Nail Studio","Makeup Studio","Skin Clinic","Dermatology Clinic","Dental Clinic","Ayurvedic Clinic","Physiotherapy Clinic","Yoga Studio","Fitness Studio","Gym","Wellness Center","Agency","Consulting","Restaurant","Retail","Education","Real Estate","Other"]
const CATEGORIES = ["Hair","Skin","Nails","Bridal","Massage","Body","Dental","Fitness","Ayurveda","Consultation","Membership","Other"]

export default function SettingsPage() {
  const [userId, setUserId]         = useState(null)
  const [userEmail, setUserEmail]   = useState("")
  const [tab, setTab]               = useState("business")
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const [saveError, setSaveError]   = useState("")
  const [dark, setDark]             = useState(true)
  const [mobOpen, setMobOpen]       = useState(false)
  const [waConn, setWaConn]         = useState(null)
  const [testMsg, setTestMsg]       = useState("")
  const [testReply, setTestReply]   = useState("")
  const [testing, setTesting]       = useState(false)

  const [business, setBusiness] = useState({
    business_name:"", business_type:"Salon", phone:"", location:"",
    maps_link:"", description:"", working_hours:"", website:"", email:""
  })
  const [ai, setAi] = useState({
    ai_language:"English", ai_instructions:"", greeting_message:"",
    auto_booking:true, follow_up_enabled:true, content:"", knowledge:""
  })
  const [services, setServices]     = useState([])
  const [newSvc, setNewSvc]         = useState({ name:"", price:"", duration:"30", category:"Hair", capacity:"1", service_type:"appointment", description:"" })
  const [editingId, setEditingId]   = useState(null)
  const [newPassword, setNewPassword]     = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPass, setChangingPass]   = useState(false)

  // ── Theme tokens (matches existing dashboard) ─────────────────
  const bg         = dark ? "#08080e"                 : "#f0f2f5"
  const sidebar    = dark ? "#0c0c15"                 : "#ffffff"
  const card       = dark ? "#0f0f1a"                 : "#ffffff"
  const border     = dark ? "rgba(255,255,255,0.07)"  : "rgba(0,0,0,0.08)"
  const cardBorder = dark ? "rgba(255,255,255,0.08)"  : "rgba(0,0,0,0.09)"
  const text       = dark ? "#eeeef5"                 : "#111827"
  const textMuted  = dark ? "rgba(255,255,255,0.45)"  : "rgba(0,0,0,0.5)"
  const textFaint  = dark ? "rgba(255,255,255,0.2)"   : "rgba(0,0,0,0.25)"
  const inputBg    = dark ? "rgba(255,255,255,0.04)"  : "rgba(0,0,0,0.03)"
  const accent     = dark ? "#00C9B1"                 : "#00897A"
  const navActive  = dark ? "rgba(0,196,125,0.1)"     : "rgba(0,180,115,0.08)"
  const navActiveBorder = dark ? "rgba(0,196,125,0.2)": "rgba(0,180,115,0.2)"
  const navActiveText   = dark ? "#00B5A0"            : "#00897A"

  const inp = {
    background: inputBg, border: `1px solid ${cardBorder}`, borderRadius: 8,
    padding: "9px 12px", fontSize: 13, color: text,
    fontFamily: "'Plus Jakarta Sans',sans-serif", outline: "none", width: "100%",
    boxSizing: "border-box"
  }
  const btnPrimary = {
    background: accent, color: "#000", border: "none", padding: "9px 20px",
    borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer",
    fontFamily: "'Plus Jakarta Sans',sans-serif"
  }
  const lbl = { fontSize: 11.5, color: textMuted, marginBottom: 5, display: "block" }

  function showToast(msg, type="success") {
    if (type === "error") { setSaveError(msg); setTimeout(() => setSaveError(""), 3500) }
    else { setSaved(true); setTimeout(() => setSaved(false), 2500) }
  }

  useEffect(() => {
    const t = localStorage.getItem("fastrill-theme")
    if (t) setDark(t === "dark")
    async function load() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = "/login"; return }
      setUserId(user.id); setUserEmail(user.email || "")
      const [{ data: biz }, { data: kn }, { data: svcs }, { data: wa }] = await Promise.all([
        supabase.from("business_settings").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("business_knowledge").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("services").select("*").eq("user_id", user.id).order("category"),
        supabase.from("whatsapp_connections").select("*").eq("user_id", user.id).maybeSingle(),
      ])
      if (biz) setBusiness(b => ({ ...b, ...biz }))
      if (biz || kn) setAi(a => ({
        ...a,
        ai_language:       biz?.ai_language       || "English",
        ai_instructions:   biz?.ai_instructions   || "",
        greeting_message:  biz?.greeting_message  || "",
        auto_booking:      biz?.auto_booking      !== false,
        follow_up_enabled: biz?.follow_up_enabled !== false,
        content:           kn?.content            || "",
        knowledge:         kn?.knowledge          || "",
      }))
      if (svcs) setServices(svcs)
      if (wa)   setWaConn(wa)
      setLoading(false)
    }
    load()
  }, [])

  async function saveBusiness() {
    if (!business.business_name?.trim()) { showToast("Business name is required", "error"); return }
    setSaving(true); setSaveError("")
    try {
      const supabase = getSupabase()
      const { error } = await supabase.from("business_settings").upsert({
        ...business, user_id: userId,
        ai_language: ai.ai_language, ai_instructions: ai.ai_instructions,
        greeting_message: ai.greeting_message, auto_booking: ai.auto_booking,
        follow_up_enabled: ai.follow_up_enabled, updated_at: new Date().toISOString()
      }, { onConflict: "user_id" })
      if (error) throw error
      showToast("Saved ✓")
    } catch(e) { showToast(e.message || "Save failed", "error") }
    finally { setSaving(false) }
  }

  async function saveAI() {
    setSaving(true)
    try {
      const supabase = getSupabase()
      await Promise.all([
        supabase.from("business_settings").upsert({
          user_id: userId, ai_language: ai.ai_language,
          ai_instructions: ai.ai_instructions, greeting_message: ai.greeting_message,
          auto_booking: ai.auto_booking, follow_up_enabled: ai.follow_up_enabled
        }, { onConflict: "user_id" }),
        supabase.from("business_knowledge").upsert({
          user_id: userId, content: ai.content, knowledge: ai.knowledge,
          category: "business_info"
        }, { onConflict: "user_id,category" })
      ])
      showToast("AI settings saved ✓")
    } catch(e) { showToast(e.message || "Save failed", "error") }
    finally { setSaving(false) }
  }

  async function addService() {
    if (!newSvc.name.trim() || !newSvc.price) { showToast("Name and price required", "error"); return }
    setSaving(true)
    try {
      const supabase = getSupabase()
      const isPkg = newSvc.service_type === "package"
      const { data, error } = await supabase.from("services").insert({
        name: newSvc.name.trim(), price: parseFloat(newSvc.price),
        duration: isPkg ? null : parseInt(newSvc.duration),
        category: newSvc.category, capacity: isPkg ? null : parseInt(newSvc.capacity),
        service_type: newSvc.service_type, description: newSvc.description.trim() || null,
        is_active: true, user_id: userId
      }).select().single()
      if (error) throw error
      setServices(s => [...s, data])
      setNewSvc({ name:"", price:"", duration:"30", category:"Hair", capacity:"1", service_type:"appointment", description:"" })
      showToast("Service added ✓")
    } catch(e) { showToast(e.message || "Failed to add", "error") }
    finally { setSaving(false) }
  }

  async function toggleService(id, current) {
    const supabase = getSupabase()
    await supabase.from("services").update({ is_active: !current }).eq("id", id)
    setServices(s => s.map(x => x.id === id ? { ...x, is_active: !current } : x))
  }

  async function deleteService(id) {
    if (!confirm("Delete this service?")) return
    const supabase = getSupabase()
    await supabase.from("services").delete().eq("id", id)
    setServices(s => s.filter(x => x.id !== id))
    showToast("Deleted")
  }

  async function saveService(svc) {
    const supabase = getSupabase()
    await supabase.from("services").update({
      name: svc.name, price: parseFloat(svc.price),
      duration: svc.duration ? parseInt(svc.duration) : null,
      description: svc.description, service_type: svc.service_type, category: svc.category
    }).eq("id", svc.id)
    setServices(s => s.map(x => x.id === svc.id ? { ...x, ...svc } : x))
    setEditingId(null)
    showToast("Updated ✓")
  }

  async function testAI() {
    if (!testMsg.trim()) return
    setTesting(true); setTestReply("")
    try {
      const res = await fetch("/api/test-ai", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ message: testMsg, userId }) })
      const data = await res.json()
      setTestReply(data.reply || "No reply received")
    } catch(e) { setTestReply("Error: " + e.message) }
    finally { setTesting(false) }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    if (newPassword.length < 8) { showToast("Min 8 characters", "error"); return }
    if (newPassword !== confirmPassword) { showToast("Passwords don't match", "error"); return }
    setChangingPass(true)
    try {
      const { error } = await getSupabase().auth.updateUser({ password: newPassword })
      if (error) throw error
      showToast("Password updated ✓")
      setNewPassword(""); setConfirmPassword("")
    } catch(e) { showToast(e.message || "Failed", "error") }
    finally { setChangingPass(false) }
  }

  async function handleLogout() {
    await getSupabase().auth.signOut()
    window.location.href = "/login"
  }

  const toggleTheme = () => { const n = !dark; setDark(n); localStorage.setItem("fastrill-theme", n ? "dark" : "light") }
  const userInitial = userEmail ? userEmail[0].toUpperCase() : "G"

  const svcBadge = (type) => type === "package"
    ? { color:"#38bdf8", bg:"rgba(56,189,248,0.1)", border:"rgba(56,189,248,0.2)" }
    : { color: accent,   bg: accent+"18",           border: accent+"33" }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${bg}!important;color:${text}!important;font-family:'Plus Jakarta Sans',sans-serif!important;}
        .s-wrap{display:flex;height:100vh;overflow:hidden;}
        .s-sidebar{width:224px;flex-shrink:0;background:${sidebar};border-right:1px solid ${border};display:flex;flex-direction:column;overflow-y:auto;}
        .s-logo{padding:16px 18px;font-weight:800;font-size:20px;color:${text};text-decoration:none;display:flex;flex-direction:row;align-items:center;gap:10px;border-bottom:1px solid ${border};line-height:1;}
        .s-logo span{color:${accent};}
        .s-section{padding:18px 16px 7px;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${textFaint};font-weight:600;}
        .s-nav{display:flex;align-items:center;gap:9px;padding:9px 12px;margin:1px 8px;border-radius:8px;cursor:pointer;font-size:13.5px;color:${textMuted};font-weight:500;transition:all 0.13s;border:1px solid transparent;background:none;width:calc(100% - 16px);text-align:left;font-family:'Plus Jakarta Sans',sans-serif;text-decoration:none;}
        .s-nav:hover{background:${inputBg};color:${text};}
        .s-nav.active{background:${navActive};color:${navActiveText};font-weight:600;border-color:${navActiveBorder};}
        .s-footer{margin-top:auto;padding:14px;border-top:1px solid ${border};}
        .s-user{display:flex;align-items:center;gap:9px;padding:9px;border-radius:9px;background:${inputBg};border:1px solid ${cardBorder};}
        .s-avatar{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,${accent},#0ea5e9);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#fff;flex-shrink:0;}
        .s-email{font-size:11.5px;color:${textMuted};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .s-logout{margin-top:7px;width:100%;padding:7px;border-radius:7px;background:transparent;border:1px solid ${cardBorder};font-size:12px;color:${textMuted};cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .s-logout:hover{border-color:#fca5a5;color:#ef4444;}
        .s-main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .s-topbar{height:54px;flex-shrink:0;border-bottom:1px solid ${border};display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:${sidebar};}
        .s-content{flex:1;overflow-y:auto;padding:20px 24px;background:${bg};}
        .s-tabs{display:flex;gap:0;border-bottom:1px solid ${border};background:${sidebar};flex-shrink:0;padding:0 24px;}
        .s-tab{padding:14px 16px;background:transparent;border:none;border-bottom:2px solid transparent;color:${textMuted};font-weight:500;font-size:13px;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.12s;display:flex;align-items:center;gap:6px;}
        .s-tab.active{border-bottom-color:${accent};color:${accent};font-weight:700;}
        .s-card{background:${card};border:1px solid ${cardBorder};border-radius:13px;padding:22px;margin-bottom:16px;}
        .tog{width:38px;height:22px;border-radius:100px;position:relative;cursor:pointer;border:none;flex-shrink:0;transition:background 0.2s;}
        .tog::after{content:'';position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left 0.2s;}
        .tog-row{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid ${border};}
        .hamburger{display:none;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:6px 9px;cursor:pointer;font-size:17px;color:#eeeef5;margin-right:4px;}
        .mob-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:299;cursor:pointer;}
        select option{background-color:#0c0c15!important;color:#eeeef5!important;}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @media(max-width:767px){
          .s-sidebar{position:fixed;top:0;left:0;height:100vh;z-index:300;transform:translateX(-100%);transition:transform 0.25s ease;box-shadow:4px 0 24px rgba(0,0,0,0.5);}
          .s-sidebar.open{transform:translateX(0);}
          .mob-overlay{display:block;}
          .hamburger{display:flex!important;}
          .s-topbar{padding:0 12px!important;}
          .s-content{padding:12px!important;}
          .s-tabs{padding:0 8px;overflow-x:auto;}
          .s-tab{padding:12px 10px;font-size:12px;}
        }
        .bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;background:#0c0c15;border-top:1px solid rgba(255,255,255,0.07);padding:6px 0;z-index:200;}
        @media(max-width:767px){.bottom-nav{display:flex;justify-content:space-around;}.s-main{padding-bottom:60px;}}
        .bnav{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 6px;border:none;background:transparent;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;flex:1;text-decoration:none;}
        .bnav-icon{font-size:17px;color:rgba(255,255,255,0.3);}
        .bnav-label{font-size:9px;font-weight:600;color:rgba(255,255,255,0.3);}
        .bnav.active .bnav-icon,.bnav.active .bnav-label{color:#00C9B1;}
      `}</style>

      <div className="s-wrap">
        {/* Mobile overlay */}
        {mobOpen && <div className="mob-overlay" onClick={() => setMobOpen(false)} />}

        {/* Sidebar */}
        <aside className={`s-sidebar${mobOpen ? " open" : ""}`}>
          <a href="/dashboard" className="s-logo"><img src="/logo.png" width="34" height="34" alt="Fastrill" style={{display:"block",objectFit:"contain",flexShrink:0}} /><span style={{fontWeight:800,fontSize:20,color:text,letterSpacing:"-0.3px",lineHeight:1}}>fast<span style={{color:accent}}>rill</span></span></a>
          <div className="s-section">Platform</div>
          {NAV.map(n => (
            <a key={n.id} href={n.path} className={`s-nav${n.id === "settings" ? " active" : ""}`}>
              <span style={{ fontSize:13, width:18, textAlign:"center" }}>{n.icon}</span>
              <span>{n.label}</span>
            </a>
          ))}
          <div className="s-footer">
            <div className="s-user">
              <div className="s-avatar">{userInitial}</div>
              <div className="s-email">{userEmail || "Loading..."}</div>
            </div>
            <button className="s-logout" onClick={handleLogout}>↩ Sign out</button>
          </div>
        </aside>

        {/* Main */}
        <div className="s-main">
          {/* Topbar */}
          <div className="s-topbar">
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <button className="hamburger" onClick={() => setMobOpen(o => !o)}>☰</button>
              <span style={{ fontWeight:700, fontSize:15, color:text }}>Settings</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {(tab === "business" || tab === "ai") && (
                <button onClick={tab === "ai" ? saveAI : saveBusiness} disabled={saving} style={{
                  ...btnPrimary,
                  background: saved ? "#22c55e" : saveError ? "#ef4444" : accent,
                  opacity: saving ? 0.7 : 1
                }}>
                  {saving ? "Saving..." : saved ? "✓ Saved" : saveError ? "✗ Error" : "Save Changes"}
                </button>
              )}
              <button onClick={toggleTheme} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 10px", background:inputBg, border:`1px solid ${cardBorder}`, borderRadius:8, cursor:"pointer", fontSize:11.5, color:textMuted, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                <span>{dark ? "🌙" : "☀️"}</span>
                <div style={{ width:30, height:16, borderRadius:100, background: dark ? accent : "#d1d5db", position:"relative" }}>
                  <span style={{ position:"absolute", top:2, width:12, height:12, borderRadius:"50%", background:"#fff", left: dark ? "16px" : "2px", transition:"left 0.2s", display:"block" }} />
                </div>
              </button>
            </div>
          </div>

          {/* Error banner */}
          {saveError && (
            <div style={{ margin:"0 24px", marginTop:8, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#f87171" }}>
              ⚠️ {saveError}
            </div>
          )}

          {/* Tabs */}
          <div className="s-tabs">
            {TABS.map(t => (
              <button key={t.id} className={`s-tab${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div className="s-content">
            <div style={{ maxWidth: 680 }}>

              {loading ? (
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"80px 0",gap:12,color:textMuted}}>
                  <div style={{width:20,height:20,border:`2px solid ${accent}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                  <span style={{fontSize:14}}>Loading settings...</span>
                </div>
              ) : (<>

              {/* ── BUSINESS ── */}
              {tab === "business" && (
                <div className="s-card">
                  <div style={{ fontWeight:700, fontSize:14, color:text, marginBottom:16 }}>Business Information</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      <div>
                        <label style={lbl}>Business Name *</label>
                        <input value={business.business_name} onChange={e => setBusiness(b=>({...b,business_name:e.target.value}))} placeholder="e.g. Priya Beauty Salon" style={inp} />
                      </div>
                      <div>
                        <label style={lbl}>Business Type</label>
                        <select value={business.business_type} onChange={e => setBusiness(b=>({...b,business_type:e.target.value}))} style={inp}>
                          {BIZ_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={lbl}>Location / Address</label>
                      <input value={business.location} onChange={e => setBusiness(b=>({...b,location:e.target.value}))} placeholder="Shop no, Building, Street, City" style={inp} />
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      <div>
                        <label style={lbl}>Google Maps Link</label>
                        <input value={business.maps_link} onChange={e => setBusiness(b=>({...b,maps_link:e.target.value}))} placeholder="https://maps.google.com/..." style={inp} />
                      </div>
                      <div>
                        <label style={lbl}>Website</label>
                        <input value={business.website} onChange={e => setBusiness(b=>({...b,website:e.target.value}))} placeholder="https://yoursite.com" style={inp} />
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      <div>
                        <label style={lbl}>Phone Number</label>
                        <input value={business.phone} onChange={e => setBusiness(b=>({...b,phone:e.target.value}))} placeholder="+91 98765 43210" style={inp} />
                      </div>
                      <div>
                        <label style={lbl}>Business Email</label>
                        <input value={business.email} onChange={e => setBusiness(b=>({...b,email:e.target.value}))} placeholder="hello@yourbusiness.com" style={inp} />
                      </div>
                    </div>
                    <div>
                      <label style={lbl}>Working Hours</label>
                      <input value={business.working_hours} onChange={e => setBusiness(b=>({...b,working_hours:e.target.value}))} placeholder="Mon–Sat 10am–8pm, Sunday 11am–6pm" style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>About Your Business <span style={{ color:textFaint }}>(AI uses this to answer customer questions)</span></label>
                      <textarea value={business.description} onChange={e => setBusiness(b=>({...b,description:e.target.value}))} placeholder="Your specialties, experience, certifications, what to expect when visiting..." rows={3} style={{ ...inp, resize:"vertical", lineHeight:1.6 }} />
                    </div>
                  </div>
                  <div style={{ marginTop:12, fontSize:12, color:textFaint }}>💡 After saving, your AI immediately uses this info to answer customer questions</div>
                </div>
              )}

              {/* ── SERVICES ── */}
              {tab === "services" && (
                <>
                  {/* Add service */}
                  <div className="s-card">
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                      <div style={{ fontWeight:700, fontSize:14, color:text }}>Add Service</div>
                      <div style={{ display:"flex", gap:4, background:inputBg, border:`1px solid ${cardBorder}`, borderRadius:8, padding:3 }}>
                        {[{val:"appointment",label:"Appointment"},{val:"package",label:"Package"}].map(opt => (
                          <button key={opt.val} onClick={() => setNewSvc(s=>({...s,service_type:opt.val}))} style={{ padding:"5px 12px", borderRadius:6, fontSize:11.5, fontWeight:600, cursor:"pointer", border:"none", fontFamily:"'Plus Jakarta Sans',sans-serif", background: newSvc.service_type===opt.val?(opt.val==="package"?"rgba(56,189,248,0.15)":accent+"22"):"transparent", color: newSvc.service_type===opt.val?(opt.val==="package"?"#38bdf8":accent):textMuted }}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize:11.5, color:textFaint, marginBottom:14, padding:"8px 12px", background:inputBg, borderRadius:7, borderLeft:`2px solid ${newSvc.service_type==="package"?"#38bdf8":accent}` }}>
                      {newSvc.service_type==="appointment" ? "⏰ Appointment — time slot booking with duration" : "📦 Package — bundle or membership, no slot booking needed"}
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:10, marginBottom:10 }}>
                      <div>
                        <label style={lbl}>Service Name *</label>
                        <input value={newSvc.name} onChange={e => setNewSvc(s=>({...s,name:e.target.value}))} placeholder={newSvc.service_type==="appointment"?"e.g. Hair Spa":"e.g. Bridal Package"} style={inp} />
                      </div>
                      <div>
                        <label style={lbl}>Price (₹) *</label>
                        <input type="number" value={newSvc.price} onChange={e => setNewSvc(s=>({...s,price:e.target.value}))} placeholder="500" style={inp} />
                      </div>
                      <div>
                        <label style={lbl}>Category</label>
                        <select value={newSvc.category} onChange={e => setNewSvc(s=>({...s,category:e.target.value}))} style={inp}>
                          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    {newSvc.service_type === "appointment" ? (
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                        <div>
                          <label style={lbl}>Duration (minutes)</label>
                          <select value={newSvc.duration} onChange={e => setNewSvc(s=>({...s,duration:e.target.value}))} style={inp}>
                            {[15,20,30,45,60,75,90,120,150,180].map(d => <option key={d} value={d}>{d} min</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={lbl}>Capacity <span style={{ color:textFaint }}>(parallel bookings per slot)</span></label>
                          <input type="number" min="1" max="20" value={newSvc.capacity} onChange={e => setNewSvc(s=>({...s,capacity:e.target.value}))} placeholder="1" style={inp} />
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginBottom:10 }}>
                        <label style={lbl}>Package Description</label>
                        <input value={newSvc.description} onChange={e => setNewSvc(s=>({...s,description:e.target.value}))} placeholder="e.g. Includes 10 sessions, valid 3 months" style={inp} />
                      </div>
                    )}
                    <button onClick={addService} disabled={saving||!newSvc.name||!newSvc.price} style={{ ...btnPrimary, opacity: saving||!newSvc.name||!newSvc.price ? 0.5 : 1, cursor: saving||!newSvc.name||!newSvc.price ? "not-allowed":"pointer" }}>
                      {saving ? "Adding..." : "+ Add Service"}
                    </button>
                  </div>

                  {/* Services list */}
                  <div className="s-card" style={{ padding:0, overflow:"hidden" }}>
                    <div style={{ padding:"12px 16px", borderBottom:`1px solid ${border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <div style={{ fontWeight:700, fontSize:13, color:text }}>Your Services ({services.length})</div>
                      <div style={{ fontSize:11, color:textFaint }}>{services.filter(s=>s.service_type!=="package").length} appointments · {services.filter(s=>s.service_type==="package").length} packages</div>
                    </div>
                    {services.length === 0 ? (
                      <div style={{ textAlign:"center", padding:32, color:textFaint, fontSize:12 }}>No services yet — add one above</div>
                    ) : CATEGORIES.filter(cat => services.some(s => s.category === cat)).map(cat => (
                      <div key={cat}>
                        <div style={{ padding:"7px 16px", background:inputBg, fontSize:10, fontWeight:700, color:textFaint, letterSpacing:"1px", textTransform:"uppercase" }}>{cat}</div>
                        {services.filter(s => s.category === cat).map(svc => {
                          const badge = svcBadge(svc.service_type)
                          return (
                            <div key={svc.id} style={{ padding:"12px 16px", borderBottom:`1px solid ${border}`, opacity: svc.is_active===false ? 0.45 : 1 }}>
                              {editingId === svc.id ? (
                                <EditService svc={svc} onSave={saveService} onCancel={() => setEditingId(null)} inp={inp} lbl={lbl} btnPrimary={btnPrimary} border={cardBorder} textMuted={textMuted} text={text} inputBg={inputBg} />
                              ) : (
                                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                  <span style={{ fontSize:9.5, fontWeight:700, color:badge.color, background:badge.bg, border:`1px solid ${badge.border}`, borderRadius:100, padding:"1px 7px", flexShrink:0 }}>
                                    {svc.service_type==="package"?"pkg":"appt"}
                                  </span>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ fontWeight:600, fontSize:13, color:text }}>{svc.name}</div>
                                    {svc.description && <div style={{ fontSize:11, color:textFaint, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{svc.description}</div>}
                                  </div>
                                  {svc.duration && <span style={{ fontSize:11.5, color:textMuted, flexShrink:0 }}>{svc.duration} min</span>}
                                  <span style={{ fontWeight:700, fontSize:13, color:accent, flexShrink:0 }}>₹{parseInt(svc.price||0).toLocaleString()}</span>
                                  <button onClick={() => toggleService(svc.id, svc.is_active)} style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:100, border:`1px solid ${svc.is_active===false?"rgba(251,113,133,0.3)":accent+"44"}`, background:svc.is_active===false?"rgba(251,113,133,0.08)":accent+"08", color:svc.is_active===false?"#fb7185":accent, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                                    {svc.is_active===false?"Off":"On"}
                                  </button>
                                  <button onClick={() => setEditingId(svc.id)} style={{ background:"transparent", border:"none", color:textMuted, cursor:"pointer", fontSize:11, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Edit</button>
                                  <button onClick={() => deleteService(svc.id)} style={{ background:"transparent", border:"none", color:textFaint, cursor:"pointer", fontSize:16, lineHeight:1 }}>×</button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── AI BRAIN ── */}
              {tab === "ai" && (
                <>
                  <div className="s-card">
                    <div style={{ fontWeight:700, fontSize:14, color:text, marginBottom:4 }}>AI Brain Settings</div>
                    <div style={{ fontSize:12, color:textFaint, marginBottom:16 }}>Control how your AI responds to customers</div>

                    <div style={{ marginBottom:14 }}>
                      <label style={lbl}>Primary Language</label>
                      <select value={ai.ai_language} onChange={e => setAi(a=>({...a,ai_language:e.target.value}))} style={inp}>
                        {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                      </select>
                    </div>

                    <div className="tog-row">
                      <div>
                        <div style={{ fontWeight:600, fontSize:13, color:text }}>Auto Booking</div>
                        <div style={{ fontSize:11.5, color:textMuted }}>AI books appointments automatically from WhatsApp</div>
                      </div>
                      <button className="tog" style={{ background: ai.auto_booking ? accent : "rgba(255,255,255,0.12)" }} onClick={() => setAi(a=>({...a,auto_booking:!a.auto_booking}))}>
                        <span style={{ position:"absolute", top:3, width:16, height:16, borderRadius:"50%", background:"#fff", left: ai.auto_booking ? "19px" : "3px", transition:"left 0.2s", display:"block" }} />
                      </button>
                    </div>

                    <div className="tog-row" style={{ marginBottom:14 }}>
                      <div>
                        <div style={{ fontWeight:600, fontSize:13, color:text }}>Follow-up Messages</div>
                        <div style={{ fontSize:11.5, color:textMuted }}>AI follows up with inactive leads automatically</div>
                      </div>
                      <button className="tog" style={{ background: ai.follow_up_enabled ? accent : "rgba(255,255,255,0.12)" }} onClick={() => setAi(a=>({...a,follow_up_enabled:!a.follow_up_enabled}))}>
                        <span style={{ position:"absolute", top:3, width:16, height:16, borderRadius:"50%", background:"#fff", left: ai.follow_up_enabled ? "19px" : "3px", transition:"left 0.2s", display:"block" }} />
                      </button>
                    </div>

                    <div style={{ marginBottom:14 }}>
                      <label style={lbl}>Greeting Message <span style={{ color:textFaint }}>(sent to new customers)</span></label>
                      <textarea value={ai.greeting_message} onChange={e => setAi(a=>({...a,greeting_message:e.target.value}))} placeholder={`Hi [Name]! Welcome to ${business.business_name||"our business"} 😊\n\nHow can I help you today?`} rows={3} style={{ ...inp, resize:"vertical", lineHeight:1.6 }} />
                    </div>

                    <div style={{ marginBottom:14 }}>
                      <label style={lbl}>Custom AI Instructions <span style={{ color:textFaint }}>(tone, upsells, rules)</span></label>
                      <textarea value={ai.ai_instructions} onChange={e => setAi(a=>({...a,ai_instructions:e.target.value}))} placeholder={`Examples:\n• Always respond warmly and use the customer's first name\n• Upsell hair spa with every haircut booking\n• Free parking available in basement\n• Never mention competitor prices`} rows={5} style={{ ...inp, resize:"vertical", lineHeight:1.6 }} />
                    </div>

                    <div style={{ marginBottom:14 }}>
                      <label style={lbl}>Knowledge Base <span style={{ color:textFaint }}>(FAQs, policies, extra info)</span></label>
                      <textarea value={ai.content||ai.knowledge} onChange={e => setAi(a=>({...a,content:e.target.value,knowledge:e.target.value}))} placeholder={`Examples:\n• Cancellation policy: cancel 2hrs before\n• We accept UPI, cash, cards\n• Nearest landmark: next to City Mall\n• Organic products only`} rows={5} style={{ ...inp, resize:"vertical", lineHeight:1.6 }} />
                    </div>

                    <div style={{ background:`${accent}08`, border:`1px solid ${accent}22`, borderRadius:9, padding:"12px 14px", fontSize:12, color:textMuted, lineHeight:1.7 }}>
                      💡 <strong style={{ color:text }}>The more you fill in, the smarter your AI gets.</strong> Add upsell rules, FAQs, parking info, cancellation policy — anything a new staff member would need to know.
                    </div>
                  </div>

                  {/* Test AI */}
                  <div className="s-card">
                    <div style={{ fontWeight:700, fontSize:14, color:text, marginBottom:4 }}>Test AI Reply</div>
                    <div style={{ fontSize:12, color:textFaint, marginBottom:14 }}>Send a test message to see how your AI responds</div>
                    <div style={{ display:"flex", gap:10, marginBottom:12 }}>
                      <input value={testMsg} onChange={e => setTestMsg(e.target.value)} onKeyDown={e => e.key==="Enter" && testAI()} placeholder="e.g. I want to book hair spa tomorrow evening" style={{ ...inp, flex:1 }} />
                      <button onClick={testAI} disabled={testing||!testMsg.trim()} style={{ ...btnPrimary, opacity: testing||!testMsg.trim() ? 0.5 : 1, whiteSpace:"nowrap" }}>
                        {testing ? "Testing..." : "Test →"}
                      </button>
                    </div>
                    {testReply && (
                      <div style={{ background:inputBg, borderRadius:8, padding:14, border:`1px solid ${cardBorder}` }}>
                        <div style={{ fontSize:11, color:textFaint, marginBottom:6 }}>AI Reply:</div>
                        <div style={{ fontSize:13.5, color:text, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{testReply}</div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── WHATSAPP ── */}
              {tab === "whatsapp" && (
                <>
                  {waConn ? (
                    <div className="s-card" style={{ border:`1px solid ${accent}44` }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                        <div style={{ width:44, height:44, borderRadius:11, background:"#25d366", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>💬</div>
                        <div>
                          <div style={{ fontWeight:800, fontSize:15, color:text }}>WhatsApp Connected ✓</div>
                          <div style={{ fontSize:12, color:textMuted }}>Your AI is live and responding to customers</div>
                        </div>
                      </div>
                      {[["Phone Number ID", waConn.phone_number_id],["WABA ID", waConn.waba_id||"—"],["Status","🟢 Active"]].map(([l,v]) => (
                        <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:`1px solid ${border}` }}>
                          <span style={{ fontSize:12, color:textMuted }}>{l}</span>
                          <span style={{ fontSize:12, fontWeight:600, color:text, fontFamily:"monospace" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="s-card" style={{ textAlign:"center" }}>
                      <div style={{ fontSize:36, marginBottom:12 }}>💬</div>
                      <div style={{ fontWeight:800, fontSize:16, color:text, marginBottom:6 }}>Connect Your WhatsApp</div>
                      <div style={{ fontSize:13, color:textMuted, marginBottom:20, lineHeight:1.6 }}>Link your business WhatsApp to activate AI replies, lead capture, and auto-booking.</div>
                      <button onClick={() => {
                        const appId=process.env.NEXT_PUBLIC_META_APP_ID||""
                        const configId=process.env.NEXT_PUBLIC_META_CONFIG_ID||""
                        const redirectUri=(process.env.NEXT_PUBLIC_APP_URL||window.location.origin)+"/api/meta/callback"
                        window.location.href = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&config_id=${configId}`
                      }} style={{ background:"#1877f2", color:"#fff", border:"none", padding:"11px 24px", borderRadius:9, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                        Connect WhatsApp via Meta →
                      </button>
                    </div>
                  )}

                  <div className="s-card">
                    <div style={{ fontWeight:700, fontSize:13.5, color:text, marginBottom:12 }}>Webhook Configuration</div>
                    {[["Webhook URL",(process.env.NEXT_PUBLIC_APP_URL||"https://fastrill.com")+"/api/meta/webhook"],["Verify Token",process.env.WEBHOOK_VERIFY_TOKEN||"configure in .env"],["Events","messages, message_status"]].map(([l,v]) => (
                      <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${border}` }}>
                        <span style={{ fontSize:12, color:textMuted }}>{l}</span>
                        <span style={{ fontSize:11.5, fontWeight:600, color:text, fontFamily:"monospace", wordBreak:"break-all", textAlign:"right", maxWidth:"60%" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── ACCOUNT ── */}
              {tab === "account" && (
                <>
                  <div className="s-card">
                    <div style={{ fontWeight:700, fontSize:14, color:text, marginBottom:16 }}>Account Details</div>
                    <div>
                      <label style={lbl}>Email Address</label>
                      <input value={userEmail} readOnly style={{ ...inp, opacity:0.6 }} />
                    </div>
                  </div>

                  <div className="s-card">
                    <div style={{ fontWeight:700, fontSize:14, color:text, marginBottom:16 }}>Change Password</div>
                    <form onSubmit={handleChangePassword}>
                      <div style={{ marginBottom:12 }}>
                        <label style={lbl}>New Password</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 8 characters" minLength={8} style={inp} />
                      </div>
                      <div style={{ marginBottom:16 }}>
                        <label style={lbl}>Confirm New Password</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat new password" style={{ ...inp, border: confirmPassword && confirmPassword !== newPassword ? "1px solid #f87171" : `1px solid ${cardBorder}` }} />
                        {confirmPassword && confirmPassword !== newPassword && <p style={{ color:"#f87171", fontSize:11, marginTop:4 }}>Passwords do not match</p>}
                      </div>
                      <button type="submit" disabled={changingPass} style={{ ...btnPrimary, opacity:changingPass?0.7:1 }}>
                        {changingPass ? "Updating..." : "Update Password"}
                      </button>
                    </form>
                  </div>

                  <div className="s-card" style={{ border:"1px solid rgba(239,68,68,0.2)" }}>
                    <div style={{ fontWeight:700, fontSize:14, color:"#f87171", marginBottom:4 }}>Danger Zone</div>
                    <div style={{ fontSize:13, color:textMuted, marginBottom:16 }}>Sign out from all devices</div>
                    <button onClick={handleLogout} style={{ ...btnPrimary, background:"#dc2626" }}>Sign Out</button>
                  </div>
                </>
              )}

            </>)}
          </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="bottom-nav">
        {[
          { id:"overview", icon:"⬡", label:"Home",     path:"/dashboard" },
          { id:"inbox",    icon:"◎", label:"Chats",    path:"/dashboard/conversations" },
          { id:"bookings", icon:"◷", label:"Bookings", path:"/dashboard/bookings" },
          { id:"leads",    icon:"◉", label:"Leads",    path:"/dashboard/leads" },
          { id:"settings", icon:"◌", label:"Settings", path:"/dashboard/settings" },
        ].map(n => (
          <a key={n.id} href={n.path} className={`bnav${n.id==="settings"?" active":""}`}>
            <span className="bnav-icon">{n.icon}</span>
            <span className="bnav-label">{n.label}</span>
          </a>
        ))}
      </div>
    </>
  )
}

function EditService({ svc, onSave, onCancel, inp, lbl, btnPrimary, border, textMuted, text, inputBg }) {
  const [form, setForm] = useState({ ...svc })
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
        <div><label style={lbl}>Name</label><input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} style={inp} /></div>
        <div><label style={lbl}>Price (₹)</label><input type="number" value={form.price} onChange={e => setForm(f=>({...f,price:e.target.value}))} style={inp} /></div>
        <div><label style={lbl}>Duration (min)</label><input type="number" value={form.duration||""} onChange={e => setForm(f=>({...f,duration:e.target.value}))} style={inp} /></div>
        <div><label style={lbl}>Category</label>
          <select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))} style={inp}>
            {["Hair","Skin","Nails","Bridal","Massage","Body","Dental","Fitness","Ayurveda","Consultation","Membership","Other"].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom:10 }}><label style={lbl}>Description</label><input value={form.description||""} onChange={e => setForm(f=>({...f,description:e.target.value}))} style={inp} /></div>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={() => onSave(form)} style={{ ...btnPrimary, fontSize:12, padding:"7px 16px" }}>Save</button>
        <button onClick={onCancel} style={{ padding:"7px 16px", borderRadius:8, border:`1px solid ${border}`, background:"transparent", color:textMuted, fontSize:12, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Cancel</button>
      </div>
    </div>
  )
}
