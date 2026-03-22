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
  { id:"ai",       label:"AI Brain",  icon:"🧠" },
  { id:"services", label:"Services",  icon:"📋" },
  { id:"whatsapp", label:"WhatsApp",  icon:"💬" },
  { id:"account",  label:"Account",   icon:"👤" },
]

const LANGUAGES = ["English","Hindi","Telugu","Tamil","Kannada","Malayalam","Marathi","Bengali","Gujarati","Punjabi","Auto-detect"]
const BIZ_TYPES  = ["Salon","Clinic","Spa","Gym","Restaurant","Agency","Consulting","Retail","Education","Real Estate","Other"]

export default function SettingsPage() {
  const [userId, setUserId]       = useState(null)
  const [userEmail, setUserEmail] = useState("")
  const [tab, setTab]             = useState("business")
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState(null)
  const [mobOpen, setMobOpen]     = useState(false)
  const [dark, setDark]           = useState(true)
  const [waConn, setWaConn]       = useState(null)
  const [testMsg, setTestMsg]     = useState("")
  const [testReply, setTestReply] = useState("")
  const [testing, setTesting]     = useState(false)

  // Business
  const [biz, setBiz] = useState({
    business_name:"", business_type:"", location:"", maps_link:"",
    working_hours:"", description:"", phone:"", email:"", website:""
  })

  // AI Brain
  const [ai, setAi] = useState({
    ai_instructions:"", ai_language:"English", greeting_message:"", content:"", knowledge:""
  })

  // Services
  const [services, setServices]     = useState([])
  const [newService, setNewService] = useState({ name:"", price:"", duration:"", description:"", service_type:"time_based" })
  const [editingId, setEditingId]   = useState(null)

  // Account
  const [newPassword, setNewPassword]     = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPass, setChangingPass]   = useState(false)

  function showToast(msg, type="success") {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    async function load() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = "/login"; return }
      setUserId(user.id)
      setUserEmail(user.email)

      const [{ data: bizData }, { data: knData }, { data: svcData }, { data: waData }] = await Promise.all([
        supabase.from("business_settings").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("business_knowledge").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("services").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("whatsapp_connections").select("*").eq("user_id", user.id).maybeSingle(),
      ])

      if (bizData)  setBiz(b => ({ ...b, ...bizData }))
      if (knData)   setAi(a => ({ ...a, ...knData, ai_instructions: bizData?.ai_instructions || "", ai_language: bizData?.ai_language || "English", greeting_message: bizData?.greeting_message || "" }))
      if (svcData)  setServices(svcData)
      if (waData)   setWaConn(waData)
      setLoading(false)
    }
    load()
  }, [])

  async function saveBusiness() {
    setSaving(true)
    try {
      const supabase = getSupabase()
      const { error } = await supabase.from("business_settings").upsert({ ...biz, user_id: userId }, { onConflict: "user_id" })
      if (error) throw error
      showToast("Business settings saved ✅")
    } catch(e) { showToast(e.message || "Save failed", "error") }
    finally { setSaving(false) }
  }

  async function saveAI() {
    setSaving(true)
    try {
      const supabase = getSupabase()
      const [r1, r2] = await Promise.all([
        supabase.from("business_settings").upsert({ user_id: userId, ai_instructions: ai.ai_instructions, ai_language: ai.ai_language, greeting_message: ai.greeting_message }, { onConflict: "user_id" }),
        supabase.from("business_knowledge").upsert({ user_id: userId, content: ai.content, knowledge: ai.knowledge }, { onConflict: "user_id" }),
      ])
      if (r1.error) throw r1.error
      showToast("AI Brain settings saved ✅")
    } catch(e) { showToast(e.message || "Save failed", "error") }
    finally { setSaving(false) }
  }

  async function addService() {
    if (!newService.name || !newService.price) { showToast("Name and price are required", "error"); return }
    setSaving(true)
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase.from("services").insert({ ...newService, price: parseFloat(newService.price), duration: newService.duration ? parseInt(newService.duration) : null, user_id: userId, is_active: true }).select().single()
      if (error) throw error
      setServices(s => [...s, data])
      setNewService({ name:"", price:"", duration:"", description:"", service_type:"time_based" })
      showToast("Service added ✅")
    } catch(e) { showToast(e.message || "Failed to add service", "error") }
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
    showToast("Service deleted")
  }

  async function saveService(svc) {
    const supabase = getSupabase()
    await supabase.from("services").update({ name: svc.name, price: parseFloat(svc.price), duration: svc.duration ? parseInt(svc.duration) : null, description: svc.description, service_type: svc.service_type }).eq("id", svc.id)
    setServices(s => s.map(x => x.id === svc.id ? svc : x))
    setEditingId(null)
    showToast("Service updated ✅")
  }

  async function testAI() {
    if (!testMsg.trim()) return
    setTesting(true); setTestReply("")
    try {
      const res = await fetch("/api/test-ai", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ message: testMsg, userId }) })
      const data = await res.json()
      setTestReply(data.reply || "No reply")
    } catch(e) { setTestReply("Error: " + e.message) }
    finally { setTesting(false) }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    if (newPassword.length < 8) { showToast("Password must be at least 8 characters", "error"); return }
    if (newPassword !== confirmPassword) { showToast("Passwords do not match", "error"); return }
    setChangingPass(true)
    try {
      const { error } = await getSupabase().auth.updateUser({ password: newPassword })
      if (error) throw error
      showToast("Password updated ✅")
      setNewPassword(""); setConfirmPassword("")
    } catch(e) { showToast(e.message || "Failed to update password", "error") }
    finally { setChangingPass(false) }
  }

  async function handleLogout() {
    await getSupabase().auth.signOut()
    window.location.href = "/login"
  }

  const colors = dark ? {
    bg:"#0a0a0f", card:"#111118", border:"#1e1e2e", text:"#e2e8f0",
    muted:"#64748b", accent:"#6366f1", accentLight:"#818cf8", surface:"#161622"
  } : {
    bg:"#f8fafc", card:"#ffffff", border:"#e2e8f0", text:"#0f172a",
    muted:"#64748b", accent:"#6366f1", accentLight:"#4f46e5", surface:"#f1f5f9"
  }

  const inp = { width:"100%", padding:"10px 12px", borderRadius:"8px", border:"1px solid "+colors.border, background:colors.surface, color:colors.text, fontSize:"14px", outline:"none", boxSizing:"border-box" }
  const btn = { padding:"10px 20px", borderRadius:"8px", border:"none", background:colors.accent, color:"#fff", fontSize:"14px", fontWeight:"600", cursor:"pointer" }
  const label = { display:"block", color:colors.muted, fontSize:"12px", marginBottom:"6px", fontWeight:"500" }

  if (loading) return (
    <div style={{ minHeight:"100vh", background:colors.bg, display:"flex", alignItems:"center", justifyContent:"center", color:colors.text, fontFamily:"Inter,sans-serif" }}>
      Loading settings...
    </div>
  )

  return (
    <div style={{ minHeight:"100vh", background:colors.bg, fontFamily:"Inter,sans-serif", color:colors.text }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:"20px", right:"20px", zIndex:9999, padding:"12px 20px", borderRadius:"10px", background: toast.type==="error"?"#dc2626":"#16a34a", color:"#fff", fontSize:"14px", fontWeight:"600", boxShadow:"0 4px 20px rgba(0,0,0,0.3)" }}>
          {toast.msg}
        </div>
      )}

      {/* Sidebar */}
      <div style={{ position:"fixed", left:0, top:0, bottom:0, width:"220px", background:colors.card, borderRight:"1px solid "+colors.border, padding:"20px 0", display:"flex", flexDirection:"column", zIndex:100 }} className="sidebar-desktop">
        <div style={{ padding:"0 20px 20px", borderBottom:"1px solid "+colors.border }}>
          <div style={{ fontSize:"20px", fontWeight:"800", color:colors.text }}>fast<span style={{ color:colors.accent }}>rill</span></div>
        </div>
        <nav style={{ flex:1, padding:"12px 8px", overflowY:"auto" }}>
          {NAV.map(n => (
            <a key={n.id} href={n.path} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 12px", borderRadius:"8px", marginBottom:"2px", background: n.id==="settings" ? colors.accent+"22" : "transparent", color: n.id==="settings" ? colors.accent : colors.muted, textDecoration:"none", fontSize:"14px", fontWeight: n.id==="settings" ? "600" : "400" }}>
              <span>{n.icon}</span>{n.label}
            </a>
          ))}
        </nav>
        <div style={{ padding:"12px 20px", borderTop:"1px solid "+colors.border }}>
          <div style={{ fontSize:"12px", color:colors.muted, marginBottom:"8px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{userEmail}</div>
          <button onClick={handleLogout} style={{ width:"100%", padding:"8px", borderRadius:"6px", border:"1px solid "+colors.border, background:"transparent", color:colors.muted, fontSize:"13px", cursor:"pointer" }}>Sign out</button>
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft:"220px", padding:"32px" }}>
        <div style={{ maxWidth:"800px" }}>

          {/* Header */}
          <div style={{ marginBottom:"28px" }}>
            <h1 style={{ fontSize:"24px", fontWeight:"700", color:colors.text, marginBottom:"4px" }}>Settings</h1>
            <p style={{ color:colors.muted, fontSize:"14px" }}>Manage your business, AI, and account settings</p>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:"4px", background:colors.card, padding:"4px", borderRadius:"10px", marginBottom:"28px", border:"1px solid "+colors.border }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ flex:1, padding:"9px 12px", borderRadius:"7px", border:"none", background: tab===t.id ? colors.accent : "transparent", color: tab===t.id ? "#fff" : colors.muted, fontSize:"13px", fontWeight:"600", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", transition:"all 0.15s" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* ── BUSINESS TAB ── */}
          {tab === "business" && (
            <div style={{ background:colors.card, borderRadius:"12px", padding:"24px", border:"1px solid "+colors.border }}>
              <h2 style={{ fontSize:"16px", fontWeight:"700", marginBottom:"20px" }}>Business Information</h2>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"16px" }}>
                <div>
                  <label style={label}>Business Name *</label>
                  <input value={biz.business_name} onChange={e => setBiz(b=>({...b,business_name:e.target.value}))} placeholder="Your business name" style={inp} />
                </div>
                <div>
                  <label style={label}>Business Type</label>
                  <select value={biz.business_type} onChange={e => setBiz(b=>({...b,business_type:e.target.value}))} style={inp}>
                    <option value="">Select type</option>
                    {BIZ_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom:"16px" }}>
                <label style={label}>Address / Location</label>
                <input value={biz.location} onChange={e => setBiz(b=>({...b,location:e.target.value}))} placeholder="Full address" style={inp} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"16px" }}>
                <div>
                  <label style={label}>Google Maps Link</label>
                  <input value={biz.maps_link} onChange={e => setBiz(b=>({...b,maps_link:e.target.value}))} placeholder="https://maps.google.com/..." style={inp} />
                </div>
                <div>
                  <label style={label}>Website</label>
                  <input value={biz.website} onChange={e => setBiz(b=>({...b,website:e.target.value}))} placeholder="https://yoursite.com" style={inp} />
                </div>
              </div>
              <div style={{ marginBottom:"16px" }}>
                <label style={label}>Working Hours</label>
                <input value={biz.working_hours} onChange={e => setBiz(b=>({...b,working_hours:e.target.value}))} placeholder="Mon-Sat: 9am-7pm, Sun: Closed" style={inp} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"16px" }}>
                <div>
                  <label style={label}>Phone Number</label>
                  <input value={biz.phone} onChange={e => setBiz(b=>({...b,phone:e.target.value}))} placeholder="+91 98765 43210" style={inp} />
                </div>
                <div>
                  <label style={label}>Business Email</label>
                  <input value={biz.email} onChange={e => setBiz(b=>({...b,email:e.target.value}))} placeholder="hello@yourbusiness.com" style={inp} />
                </div>
              </div>
              <div style={{ marginBottom:"20px" }}>
                <label style={label}>Business Description</label>
                <textarea value={biz.description} onChange={e => setBiz(b=>({...b,description:e.target.value}))} placeholder="Brief description of your business..." rows={3} style={{ ...inp, resize:"vertical" }} />
              </div>
              <button onClick={saveBusiness} disabled={saving} style={{ ...btn, opacity:saving?0.7:1 }}>
                {saving ? "Saving..." : "Save Business Settings"}
              </button>
            </div>
          )}

          {/* ── AI BRAIN TAB ── */}
          {tab === "ai" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
              <div style={{ background:colors.card, borderRadius:"12px", padding:"24px", border:"1px solid "+colors.border }}>
                <h2 style={{ fontSize:"16px", fontWeight:"700", marginBottom:"20px" }}>AI Configuration</h2>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"16px" }}>
                  <div>
                    <label style={label}>AI Language</label>
                    <select value={ai.ai_language} onChange={e => setAi(a=>({...a,ai_language:e.target.value}))} style={inp}>
                      {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={label}>Greeting Message</label>
                    <input value={ai.greeting_message} onChange={e => setAi(a=>({...a,greeting_message:e.target.value}))} placeholder="Welcome to our business! How can I help?" style={inp} />
                  </div>
                </div>
                <div style={{ marginBottom:"16px" }}>
                  <label style={label}>AI Instructions (Owner Playbook)</label>
                  <textarea value={ai.ai_instructions} onChange={e => setAi(a=>({...a,ai_instructions:e.target.value}))} placeholder={"Examples:\n- Always be warm and professional\n- Upsell hair spa to customers booking cleanup\n- Offer 10% discount for first-time customers\n- Always confirm bookings in Telugu if customer writes in Telugu"} rows={6} style={{ ...inp, resize:"vertical" }} />
                  <p style={{ color:colors.muted, fontSize:"12px", marginTop:"6px" }}>Tell the AI how to behave, what to upsell, discount rules, tone etc.</p>
                </div>
                <div style={{ marginBottom:"20px" }}>
                  <label style={label}>Knowledge Base (FAQs, Policies, Info)</label>
                  <textarea value={ai.content || ai.knowledge} onChange={e => setAi(a=>({...a,content:e.target.value,knowledge:e.target.value}))} placeholder={"Examples:\n- Parking available in basement\n- We use only organic products\n- Cancellation policy: cancel 2hrs before\n- We accept UPI, cash, cards\n- Nearest landmark: next to City Mall"} rows={6} style={{ ...inp, resize:"vertical" }} />
                  <p style={{ color:colors.muted, fontSize:"12px", marginTop:"6px" }}>FAQs, policies, location info — the AI uses this to answer customer questions accurately.</p>
                </div>
                <button onClick={saveAI} disabled={saving} style={{ ...btn, opacity:saving?0.7:1 }}>
                  {saving ? "Saving..." : "Save AI Settings"}
                </button>
              </div>

              {/* Test AI */}
              <div style={{ background:colors.card, borderRadius:"12px", padding:"24px", border:"1px solid "+colors.border }}>
                <h2 style={{ fontSize:"16px", fontWeight:"700", marginBottom:"8px" }}>Test AI Reply</h2>
                <p style={{ color:colors.muted, fontSize:"13px", marginBottom:"16px" }}>Send a test message to see how your AI responds</p>
                <div style={{ display:"flex", gap:"10px", marginBottom:"12px" }}>
                  <input value={testMsg} onChange={e => setTestMsg(e.target.value)} onKeyDown={e => e.key==="Enter" && testAI()} placeholder="e.g. I want to book a hair spa tomorrow" style={{ ...inp, flex:1 }} />
                  <button onClick={testAI} disabled={testing || !testMsg.trim()} style={{ ...btn, opacity: testing||!testMsg.trim() ? 0.6 : 1, whiteSpace:"nowrap" }}>
                    {testing ? "Testing..." : "Test →"}
                  </button>
                </div>
                {testReply && (
                  <div style={{ background:colors.surface, borderRadius:"8px", padding:"14px", border:"1px solid "+colors.border }}>
                    <p style={{ color:colors.muted, fontSize:"12px", marginBottom:"6px" }}>AI Reply:</p>
                    <p style={{ color:colors.text, fontSize:"14px", lineHeight:"1.6", whiteSpace:"pre-wrap" }}>{testReply}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SERVICES TAB ── */}
          {tab === "services" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
              {/* Add service */}
              <div style={{ background:colors.card, borderRadius:"12px", padding:"24px", border:"1px solid "+colors.border }}>
                <h2 style={{ fontSize:"16px", fontWeight:"700", marginBottom:"16px" }}>Add New Service</h2>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"12px" }}>
                  <div>
                    <label style={label}>Service Name *</label>
                    <input value={newService.name} onChange={e => setNewService(s=>({...s,name:e.target.value}))} placeholder="e.g. Hair Spa" style={inp} />
                  </div>
                  <div>
                    <label style={label}>Price (₹) *</label>
                    <input type="number" value={newService.price} onChange={e => setNewService(s=>({...s,price:e.target.value}))} placeholder="500" style={inp} />
                  </div>
                  <div>
                    <label style={label}>Duration (minutes)</label>
                    <input type="number" value={newService.duration} onChange={e => setNewService(s=>({...s,duration:e.target.value}))} placeholder="60" style={inp} />
                  </div>
                  <div>
                    <label style={label}>Service Type</label>
                    <select value={newService.service_type} onChange={e => setNewService(s=>({...s,service_type:e.target.value}))} style={inp}>
                      <option value="time_based">Time-based (Salon/Clinic)</option>
                      <option value="package">Package (Agency/Consulting)</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom:"16px" }}>
                  <label style={label}>Description</label>
                  <input value={newService.description} onChange={e => setNewService(s=>({...s,description:e.target.value}))} placeholder="Brief description..." style={inp} />
                </div>
                <button onClick={addService} disabled={saving} style={{ ...btn, opacity:saving?0.7:1 }}>
                  + Add Service
                </button>
              </div>

              {/* Services list */}
              <div style={{ background:colors.card, borderRadius:"12px", padding:"24px", border:"1px solid "+colors.border }}>
                <h2 style={{ fontSize:"16px", fontWeight:"700", marginBottom:"16px" }}>Your Services ({services.length})</h2>
                {services.length === 0 ? (
                  <p style={{ color:colors.muted, fontSize:"14px", textAlign:"center", padding:"20px" }}>No services yet. Add one above.</p>
                ) : services.map(svc => (
                  <div key={svc.id} style={{ borderRadius:"8px", border:"1px solid "+colors.border, padding:"16px", marginBottom:"10px", background:colors.surface }}>
                    {editingId === svc.id ? (
                      <EditService svc={svc} onSave={saveService} onCancel={() => setEditingId(null)} inp={inp} label={label} btn={btn} colors={colors} />
                    ) : (
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"4px" }}>
                            <span style={{ fontWeight:"600", fontSize:"15px" }}>{svc.name}</span>
                            <span style={{ background: svc.is_active ? "#16a34a22" : "#dc262622", color: svc.is_active ? "#4ade80" : "#f87171", padding:"2px 8px", borderRadius:"20px", fontSize:"11px", fontWeight:"600" }}>
                              {svc.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div style={{ color:colors.muted, fontSize:"13px" }}>
                            ₹{svc.price} {svc.duration ? "· " + svc.duration + " min" : ""} · {svc.service_type === "package" ? "Package" : "Time-based"}
                            {svc.description && " · " + svc.description}
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:"8px" }}>
                          <button onClick={() => toggleService(svc.id, svc.is_active)} style={{ padding:"6px 12px", borderRadius:"6px", border:"1px solid "+colors.border, background:"transparent", color:colors.muted, fontSize:"12px", cursor:"pointer" }}>
                            {svc.is_active ? "Disable" : "Enable"}
                          </button>
                          <button onClick={() => setEditingId(svc.id)} style={{ padding:"6px 12px", borderRadius:"6px", border:"1px solid "+colors.border, background:"transparent", color:colors.text, fontSize:"12px", cursor:"pointer" }}>
                            Edit
                          </button>
                          <button onClick={() => deleteService(svc.id)} style={{ padding:"6px 12px", borderRadius:"6px", border:"none", background:"#dc262620", color:"#f87171", fontSize:"12px", cursor:"pointer" }}>
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── WHATSAPP TAB ── */}
          {tab === "whatsapp" && (
            <div style={{ background:colors.card, borderRadius:"12px", padding:"24px", border:"1px solid "+colors.border }}>
              <h2 style={{ fontSize:"16px", fontWeight:"700", marginBottom:"20px" }}>WhatsApp Connection</h2>

              {waConn ? (
                <div>
                  <div style={{ background:"#16a34a11", border:"1px solid #16a34a44", borderRadius:"10px", padding:"16px", marginBottom:"20px", display:"flex", alignItems:"center", gap:"12px" }}>
                    <span style={{ fontSize:"24px" }}>✅</span>
                    <div>
                      <p style={{ fontWeight:"600", color:"#4ade80", marginBottom:"2px" }}>WhatsApp Connected</p>
                      <p style={{ color:colors.muted, fontSize:"13px" }}>Phone: {waConn.phone_number || waConn.phone_number_id}</p>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
                    <div>
                      <label style={label}>Phone Number ID</label>
                      <input value={waConn.phone_number_id || ""} readOnly style={{ ...inp, opacity:0.6 }} />
                    </div>
                    <div>
                      <label style={label}>Business Account ID</label>
                      <input value={waConn.business_account_id || ""} readOnly style={{ ...inp, opacity:0.6 }} />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ background:"#dc262611", border:"1px solid #dc262644", borderRadius:"10px", padding:"20px", textAlign:"center" }}>
                  <p style={{ fontSize:"24px", marginBottom:"12px" }}>📵</p>
                  <p style={{ fontWeight:"600", color:"#f87171", marginBottom:"8px" }}>WhatsApp Not Connected</p>
                  <p style={{ color:colors.muted, fontSize:"13px", marginBottom:"16px" }}>Connect your WhatsApp Business account to start receiving messages</p>
                  <a href="/onboarding" style={{ ...btn, textDecoration:"none", display:"inline-block" }}>Connect WhatsApp →</a>
                </div>
              )}

              <div style={{ marginTop:"24px", padding:"16px", background:colors.surface, borderRadius:"8px", border:"1px solid "+colors.border }}>
                <p style={{ fontWeight:"600", fontSize:"14px", marginBottom:"8px" }}>Webhook URL</p>
                <code style={{ color:colors.accent, fontSize:"13px", wordBreak:"break-all" }}>
                  https://fastrill.com/api/meta/webhook
                </code>
                <p style={{ color:colors.muted, fontSize:"12px", marginTop:"8px" }}>Use this URL in your Meta Business Manager webhook settings</p>
              </div>
            </div>
          )}

          {/* ── ACCOUNT TAB ── */}
          {tab === "account" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
              <div style={{ background:colors.card, borderRadius:"12px", padding:"24px", border:"1px solid "+colors.border }}>
                <h2 style={{ fontSize:"16px", fontWeight:"700", marginBottom:"20px" }}>Account Details</h2>
                <div style={{ marginBottom:"16px" }}>
                  <label style={label}>Email Address</label>
                  <input value={userEmail} readOnly style={{ ...inp, opacity:0.6 }} />
                </div>
              </div>

              <div style={{ background:colors.card, borderRadius:"12px", padding:"24px", border:"1px solid "+colors.border }}>
                <h2 style={{ fontSize:"16px", fontWeight:"700", marginBottom:"20px" }}>Change Password</h2>
                <form onSubmit={handleChangePassword}>
                  <div style={{ marginBottom:"12px" }}>
                    <label style={label}>New Password</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 8 characters" minLength={8} style={inp} />
                  </div>
                  <div style={{ marginBottom:"20px" }}>
                    <label style={label}>Confirm New Password</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat new password" style={{ ...inp, border: confirmPassword && confirmPassword !== newPassword ? "1px solid #f87171" : "1px solid "+colors.border }} />
                    {confirmPassword && confirmPassword !== newPassword && <p style={{ color:"#f87171", fontSize:"12px", marginTop:"4px" }}>Passwords do not match</p>}
                  </div>
                  <button type="submit" disabled={changingPass} style={{ ...btn, opacity:changingPass?0.7:1 }}>
                    {changingPass ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>

              <div style={{ background:colors.card, borderRadius:"12px", padding:"24px", border:"1px solid "+colors.border }}>
                <h2 style={{ fontSize:"16px", fontWeight:"700", marginBottom:"8px", color:"#f87171" }}>Danger Zone</h2>
                <p style={{ color:colors.muted, fontSize:"13px", marginBottom:"16px" }}>Sign out from all devices</p>
                <button onClick={handleLogout} style={{ ...btn, background:"#dc2626" }}>Sign Out</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div style={{ display:"none", position:"fixed", bottom:0, left:0, right:0, background:colors.card, borderTop:"1px solid "+colors.border, padding:"8px 0", zIndex:100 }} className="mobile-nav">
        {[
          { id:"overview", icon:"⬡", label:"Home",     path:"/dashboard" },
          { id:"inbox",    icon:"◎", label:"Chats",    path:"/dashboard/conversations" },
          { id:"bookings", icon:"◷", label:"Bookings", path:"/dashboard/bookings" },
          { id:"leads",    icon:"◉", label:"Leads",    path:"/dashboard/leads" },
          { id:"settings", icon:"◌", label:"Settings", path:"/dashboard/settings" },
        ].map(n => (
          <a key={n.id} href={n.path} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"2px", textDecoration:"none", color: n.id==="settings" ? colors.accent : colors.muted, fontSize:"10px", padding:"4px" }}>
            <span style={{ fontSize:"18px" }}>{n.icon}</span>{n.label}
          </a>
        ))}
      </div>

    </div>
  )
}

function EditService({ svc, onSave, onCancel, inp, label, btn, colors }) {
  const [form, setForm] = useState({ ...svc })
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"10px" }}>
        <div>
          <label style={label}>Name</label>
          <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} style={inp} />
        </div>
        <div>
          <label style={label}>Price (₹)</label>
          <input type="number" value={form.price} onChange={e => setForm(f=>({...f,price:e.target.value}))} style={inp} />
        </div>
        <div>
          <label style={label}>Duration (min)</label>
          <input type="number" value={form.duration||""} onChange={e => setForm(f=>({...f,duration:e.target.value}))} style={inp} />
        </div>
        <div>
          <label style={label}>Type</label>
          <select value={form.service_type} onChange={e => setForm(f=>({...f,service_type:e.target.value}))} style={inp}>
            <option value="time_based">Time-based</option>
            <option value="package">Package</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom:"10px" }}>
        <label style={label}>Description</label>
        <input value={form.description||""} onChange={e => setForm(f=>({...f,description:e.target.value}))} style={inp} />
      </div>
      <div style={{ display:"flex", gap:"8px" }}>
        <button onClick={() => onSave(form)} style={{ ...btn, fontSize:"13px", padding:"8px 16px" }}>Save</button>
        <button onClick={onCancel} style={{ padding:"8px 16px", borderRadius:"8px", border:"1px solid "+colors.border, background:"transparent", color:colors.muted, fontSize:"13px", cursor:"pointer" }}>Cancel</button>
      </div>
    </div>
  )
}
