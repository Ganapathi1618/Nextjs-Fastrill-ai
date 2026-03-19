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

const BUSINESS_TYPES = [
  "Salon","Beauty Parlour","Spa","Hair Studio","Nail Studio",
  "Makeup Studio","Skin Clinic","Dermatology Clinic","Dental Clinic",
  "Ayurvedic Clinic","Physiotherapy Clinic","Yoga Studio",
  "Fitness Studio","Gym","Wellness Center","Medispa","General clinic","Other"
]

const CATEGORIES = [
  "Hair","Skin","Nails","Bridal","Massage","Body",
  "Dental","skin","General","Fitness","Ayurveda","Consultation","Membership","Other"
]

const DURATION_OPTIONS = [15,20,30,45,60,75,90,120,150,180]

const TABS = [
  { id:"business", label:"Business" },
  { id:"services", label:"Services" },
  { id:"ai",       label:"AI Brain" },
  { id:"whatsapp", label:"WhatsApp" },
]

export default function Settings() {
  const router = useRouter()
  const [userEmail, setUserEmail]   = useState("")
  const [userId, setUserId]         = useState(null)
  const [dark, setDark]             = useState(true)
  const [mobOpen, setMobOpen]       = useState(false)
  const [tab, setTab]               = useState("business")
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const [saveError, setSaveError]   = useState("")
  const [loading, setLoading]       = useState(true)
  const [whatsapp, setWhatsapp]     = useState(null)
  const [services, setServices]     = useState([])

  const [biz, setBiz] = useState({
    name:"", type:"Salon", phone:"", location:"",
    mapsLink:"", description:"", workingHours:""
  })

  const [ai, setAI] = useState({
    language:"English", customInstructions:"",
    autoBooking:true, followUpEnabled:true,
    greetingMessage:""
  })

  const [newSvc, setNewSvc] = useState({
    name:"", price:"", duration:"30", category:"Hair",
    capacity:"1", service_type:"appointment", description:""
  })

  useEffect(function() {
    var saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    supabase.auth.getUser().then(function(res) {
      var user = res.data && res.data.user
      if (!user) { router.push("/login"); return }
      setUserEmail(user.email || "")
      setUserId(user.id)
    })
  }, [])

  useEffect(function() { if (userId) loadAll() }, [userId])

  async function loadAll() {
    setLoading(true)
    try {
      var results = await Promise.all([
        supabase.from("business_settings").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("services").select("*").eq("user_id", userId).order("category"),
        supabase.from("whatsapp_connections").select("*").eq("user_id", userId).maybeSingle()
      ])
      var bs  = results[0].data
      var svcs = results[1].data
      var wa  = results[2].data
      if (bs) {
        setBiz({
          name:         bs.business_name  || "",
          type:         bs.business_type  || "Salon",
          phone:        bs.phone          || "",
          location:     bs.location       || "",
          mapsLink:     bs.maps_link      || "",
          description:  bs.description    || "",
          workingHours: bs.working_hours  || ""
        })
        setAI({
          language:           bs.ai_language       || "English",
          customInstructions: bs.ai_instructions   || "",
          autoBooking:        bs.auto_booking      !== false,
          followUpEnabled:    bs.follow_up_enabled !== false,
          greetingMessage:    bs.greeting_message  || ""
        })
      }
      setServices(svcs || [])
      setWhatsapp(wa || null)
    } catch(e) { console.error("loadAll:", e) }
    setLoading(false)
  }

  async function saveBusiness() {
    if (!biz.name.trim()) {
      setSaveError("Business name is required")
      setTimeout(function() { setSaveError("") }, 3000)
      return
    }
    setSaving(true); setSaveError("")
    try {
      var payload = {
        user_id:             userId,
        business_name:       biz.name.trim(),
        business_type:       biz.type,
        phone:               biz.phone.trim(),
        location:            biz.location.trim(),
        maps_link:           biz.mapsLink.trim(),
        description:         biz.description.trim(),
        working_hours:       biz.workingHours.trim(),
        ai_language:         ai.language,
        ai_instructions:     ai.customInstructions.trim(),
        auto_booking:        ai.autoBooking,
        follow_up_enabled:   ai.followUpEnabled,
        greeting_message:    ai.greetingMessage.trim(),
        updated_at:          new Date().toISOString()
      }
      var result = await supabase.from("business_settings").upsert(payload, { onConflict: "user_id" })
      if (result.error) {
        setSaveError("Failed to save: " + result.error.message)
        setSaving(false); return
      }
      var knText = [
        "Business: " + biz.name,
        "Type: " + biz.type,
        biz.phone        ? "Phone: " + biz.phone        : "",
        biz.location     ? "Location: " + biz.location  : "",
        biz.mapsLink     ? "Maps: " + biz.mapsLink       : "",
        biz.description  ? "About: " + biz.description  : "",
        biz.workingHours ? "Hours: " + biz.workingHours  : "",
      ].filter(Boolean).join("\n")
      await supabase.from("business_knowledge").upsert(
        { user_id: userId, category: "business_info", content: knText },
        { onConflict: "user_id,category" }
      )
      setSaving(false); setSaved(true)
      setTimeout(function() { setSaved(false) }, 2500)
    } catch(e) {
      setSaveError("Unexpected error: " + e.message)
      setSaving(false)
    }
  }

  async function addService() {
    if (!newSvc.name.trim() || !newSvc.price) return
    setSaving(true)
    try {
      var isPkg = newSvc.service_type === "package"
      var payload = {
        user_id:      userId,
        name:         newSvc.name.trim(),
        price:        parseInt(newSvc.price) || 0,
        duration:     isPkg ? null : (parseInt(newSvc.duration) || 30),
        category:     newSvc.category,
        capacity:     isPkg ? null : (parseInt(newSvc.capacity) || 1),
        service_type: newSvc.service_type,
        description:  newSvc.description.trim() || null,
        is_active:    true
      }
      var result = await supabase.from("services").insert(payload).select().single()
      if (result.error) {
        alert("Could not add service: " + result.error.message)
        setSaving(false); return
      }
      if (result.data) {
        var updated = services.concat([result.data])
        setServices(updated)
        setNewSvc({ name:"", price:"", duration:"30", category:"Hair", capacity:"1", service_type:"appointment", description:"" })
        await syncServices(updated)
      }
    } catch(e) { console.error("addService:", e) }
    setSaving(false)
  }

  async function deleteService(id) {
    await supabase.from("services").delete().eq("id", id)
    var updated = services.filter(function(s) { return s.id !== id })
    setServices(updated)
    await syncServices(updated)
  }

  async function toggleActive(svc) {
    var val = svc.is_active === false ? true : false
    await supabase.from("services").update({ is_active: val }).eq("id", svc.id)
    setServices(services.map(function(s) { return s.id === svc.id ? Object.assign({}, s, { is_active: val }) : s }))
  }

  async function syncServices(list) {
    try {
      var active = list.filter(function(s) { return s.is_active !== false })
      var text = active.map(function(s) {
        var line = s.name + ": Rs." + s.price
        if (s.service_type !== "package" && s.duration) line += " (" + s.duration + " min)"
        if (s.service_type === "package" && s.description) line += " - " + s.description
        if (s.capacity > 1) line += " [" + s.capacity + " slots]"
        return line
      }).join("\n")
      await supabase.from("business_knowledge").upsert(
        { user_id: userId, category: "services", content: text || "No services listed." },
        { onConflict: "user_id,category" }
      )
    } catch(e) { console.warn("syncServices:", e) }
  }

  async function disconnectWA() {
    if (!confirm("Disconnect WhatsApp? AI will stop responding.")) return
    await supabase.from("whatsapp_connections").delete().eq("user_id", userId)
    setWhatsapp(null)
  }

  function toggleTheme() {
    var n = !dark; setDark(n)
    localStorage.setItem("fastrill-theme", n ? "dark" : "light")
  }

  async function handleLogout() {
    await supabase.auth.signOut(); router.push("/login")
  }

  // theme
  var bg          = dark ? "#08080e"                 : "#f0f2f5"
  var sb          = dark ? "#0c0c15"                 : "#ffffff"
  var card        = dark ? "#0f0f1a"                 : "#ffffff"
  var border      = dark ? "rgba(255,255,255,0.07)"  : "rgba(0,0,0,0.08)"
  var cborder     = dark ? "rgba(255,255,255,0.08)"  : "rgba(0,0,0,0.09)"
  var tx          = dark ? "#eeeef5"                 : "#111827"
  var txm         = dark ? "rgba(255,255,255,0.45)"  : "rgba(0,0,0,0.5)"
  var txf         = dark ? "rgba(255,255,255,0.2)"   : "rgba(0,0,0,0.25)"
  var ibg         = dark ? "rgba(255,255,255,0.04)"  : "rgba(0,0,0,0.03)"
  var acc         = dark ? "#00d084"                 : "#00935a"
  var navTx       = dark ? "rgba(255,255,255,0.45)"  : "rgba(0,0,0,0.5)"
  var navAct      = dark ? "rgba(0,196,125,0.1)"     : "rgba(0,180,115,0.08)"
  var navActB     = dark ? "rgba(0,196,125,0.2)"     : "rgba(0,180,115,0.2)"
  var navActTx    = dark ? "#00c47d"                 : "#00935a"
  var ui          = userEmail ? userEmail[0].toUpperCase() : "G"

  var inp = {
    background: ibg, border: "1px solid " + cborder, borderRadius: 8,
    padding: "9px 12px", fontSize: 13, color: tx,
    fontFamily: "'Plus Jakarta Sans',sans-serif", outline: "none", width: "100%"
  }

  var isAppt = newSvc.service_type === "appointment"

  return (
    <div>
      <style>{"\
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');\
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}\
        html,body{background:" + bg + "!important;color:" + tx + "!important;font-family:'Plus Jakarta Sans',sans-serif!important;}\
        .fw{display:flex;height:100vh;overflow:hidden;}\
        .sb{width:224px;flex-shrink:0;background:" + sb + ";border-right:1px solid " + border + ";display:flex;flex-direction:column;overflow-y:auto;}\
        .logo{padding:22px 20px 18px;font-weight:800;font-size:20px;color:" + tx + ";text-decoration:none;display:block;border-bottom:1px solid " + border + ";}\
        .logo span{color:" + acc + ";}\
        .ns{padding:18px 16px 7px;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:" + txf + ";font-weight:600;}\
        .ni{display:flex;align-items:center;gap:9px;padding:9px 12px;margin:1px 8px;border-radius:8px;cursor:pointer;font-size:13.5px;color:" + navTx + ";font-weight:500;transition:all 0.13s;border:1px solid transparent;background:none;width:calc(100% - 16px);text-align:left;font-family:'Plus Jakarta Sans',sans-serif;}\
        .ni:hover{background:" + ibg + ";color:" + tx + ";}\
        .ni.on{background:" + navAct + ";color:" + navActTx + ";font-weight:600;border-color:" + navActB + ";}\
        .nic{font-size:13px;width:18px;text-align:center;flex-shrink:0;}\
        .sbf{margin-top:auto;padding:14px;border-top:1px solid " + border + ";}\
        .uc{display:flex;align-items:center;gap:9px;padding:9px;border-radius:9px;background:" + ibg + ";border:1px solid " + cborder + ";}\
        .ua{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg," + acc + ",#0ea5e9);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#fff;flex-shrink:0;}\
        .ue{font-size:11.5px;color:" + txm + ";overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}\
        .lb{margin-top:7px;width:100%;padding:7px;border-radius:7px;background:transparent;border:1px solid " + cborder + ";font-size:12px;color:" + txm + ";cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}\
        .lb:hover{border-color:#fca5a5;color:#ef4444;}\
        .mn{flex:1;display:flex;flex-direction:column;overflow:hidden;}\
        .tb{height:54px;flex-shrink:0;border-bottom:1px solid " + border + ";display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:" + sb + ";}\
        .tt{font-weight:700;font-size:15px;color:" + tx + ";}\
        .tr{display:flex;align-items:center;gap:8px;}\
        .tg{display:flex;align-items:center;gap:6px;padding:5px 10px;background:" + ibg + ";border:1px solid " + cborder + ";border-radius:8px;cursor:pointer;font-size:11.5px;color:" + txm + ";font-family:'Plus Jakarta Sans',sans-serif;}\
        .tp{width:30px;height:16px;border-radius:100px;background:" + (dark ? acc : "#d1d5db") + ";position:relative;flex-shrink:0;}\
        .tp::after{content:'';position:absolute;top:2px;width:12px;height:12px;border-radius:50%;background:#fff;left:" + (dark ? "16px" : "2px") + ";}\
        .ct{flex:1;overflow-y:auto;padding:20px 24px;background:" + bg + ";}\
        .tr2{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid " + border + ";}\
        .tog{width:38px;height:22px;border-radius:100px;position:relative;cursor:pointer;border:none;flex-shrink:0;transition:background 0.2s;}\
        .tog::after{content:'';position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left 0.2s;}\
        select option{background-color:#0c0c15!important;color:#eeeef5!important;}\
        .hb{display:none;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:6px 9px;cursor:pointer;font-size:17px;color:#eeeef5;line-height:1;margin-right:4px;}\
        .mo{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:299;cursor:pointer;}\
        @media(max-width:767px){\
          .fw{position:relative;}\
          .sb{position:fixed;top:0;left:0;height:100vh;z-index:300;transform:translateX(-100%);transition:transform 0.25s ease;width:240px!important;box-shadow:4px 0 24px rgba(0,0,0,0.5);}\
          .sb.open{transform:translateX(0);}\
          .mo.open{display:block;}\
          .mn{width:100%;}\
          .tb{padding:0 12px!important;}\
          .ct{padding:12px!important;}\
          .hb{display:flex;}\
        }\
      "}</style>

      <div className="fw">
        <div className={"mo" + (mobOpen ? " open" : "")} onClick={function() { setMobOpen(false) }} />

        <aside className={"sb" + (mobOpen ? " open" : "")}>
          <a href="/dashboard" className="logo">fast<span>rill</span></a>
          <div className="ns">Platform</div>
          {NAV.map(function(item) {
            return (
              <button key={item.id} className={"ni" + (item.id === "settings" ? " on" : "")}
                onClick={function() { router.push(item.path); setMobOpen(false) }}>
                <span className="nic">{item.icon}</span><span>{item.label}</span>
              </button>
            )
          })}
          <div className="sbf">
            <div className="uc">
              <div className="ua">{ui}</div>
              <div className="ue">{userEmail || "Loading..."}</div>
            </div>
            <button className="lb" onClick={handleLogout}>Sign out</button>
          </div>
        </aside>

        <div className="mn">
          <div className="tb">
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button className="hb" onClick={function() { setMobOpen(function(s) { return !s }) }}>☰</button>
              <span className="tt">Settings</span>
            </div>
            <div className="tr">
              {(tab === "business" || tab === "ai") && (
                <button onClick={saveBusiness} disabled={saving} style={{
                  background: saved ? "#22c55e" : saveError ? "#ef4444" : acc,
                  color:"#000", border:"none", padding:"7px 18px", borderRadius:8,
                  fontWeight:700, fontSize:12, cursor: saving ? "not-allowed" : "pointer",
                  fontFamily:"'Plus Jakarta Sans',sans-serif"
                }}>
                  {saving ? "Saving..." : saved ? "Saved" : saveError ? "Error" : "Save Changes"}
                </button>
              )}
              <button className="tg" onClick={toggleTheme}>
                <span>{dark ? "🌙" : "☀️"}</span>
                <div className="tp" />
              </button>
            </div>
          </div>

          {saveError && (
            <div style={{margin:"8px 24px 0",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#f87171"}}>
              {saveError}
            </div>
          )}

          {/* Tab bar */}
          <div style={{padding:"0 24px",borderBottom:"1px solid "+border,background:sb,display:"flex",flexShrink:0}}>
            {TABS.map(function(t) {
              return (
                <button key={t.id} onClick={function() { setTab(t.id) }} style={{
                  padding:"14px 18px", background:"transparent", border:"none",
                  borderBottom: tab===t.id ? "2px solid "+acc : "2px solid transparent",
                  color: tab===t.id ? acc : txm,
                  fontWeight: tab===t.id ? 700 : 500, fontSize:13,
                  cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif"
                }}>{t.label}</button>
              )
            })}
          </div>

          <div className="ct">
            {loading ? (
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:200,color:txf}}>Loading...</div>

            ) : tab === "business" ? (
              <div style={{maxWidth:620,display:"flex",flexDirection:"column",gap:20}}>
                <div style={{background:card,border:"1px solid "+cborder,borderRadius:13,padding:22}}>
                  <div style={{fontWeight:700,fontSize:14,color:tx,marginBottom:16}}>Business Info</div>
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    <div>
                      <div style={{fontSize:11.5,color:txm,marginBottom:5}}>Business Name *</div>
                      <input placeholder="e.g. Priya Beauty Salon" value={biz.name}
                        onChange={function(e) { setBiz(function(p) { return Object.assign({},p,{name:e.target.value}) }) }}
                        style={inp} />
                    </div>
                    <div>
                      <div style={{fontSize:11.5,color:txm,marginBottom:5}}>Business Type</div>
                      <select value={biz.type}
                        onChange={function(e) { setBiz(function(p) { return Object.assign({},p,{type:e.target.value}) }) }}
                        style={inp}>
                        {BUSINESS_TYPES.map(function(t) { return <option key={t}>{t}</option> })}
                      </select>
                    </div>
                    <div>
                      <div style={{fontSize:11.5,color:txm,marginBottom:5}}>WhatsApp Phone Number</div>
                      <input placeholder="+91 98765 43210" value={biz.phone}
                        onChange={function(e) { setBiz(function(p) { return Object.assign({},p,{phone:e.target.value}) }) }}
                        style={inp} />
                    </div>
                    <div>
                      <div style={{fontSize:11.5,color:txm,marginBottom:5}}>Location / Address</div>
                      <input placeholder="Shop no, Building, Street, City" value={biz.location}
                        onChange={function(e) { setBiz(function(p) { return Object.assign({},p,{location:e.target.value}) }) }}
                        style={inp} />
                    </div>
                    <div>
                      <div style={{fontSize:11.5,color:txm,marginBottom:5}}>Google Maps Link</div>
                      <input placeholder="https://maps.google.com/..." value={biz.mapsLink}
                        onChange={function(e) { setBiz(function(p) { return Object.assign({},p,{mapsLink:e.target.value}) }) }}
                        style={inp} />
                    </div>
                    <div>
                      <div style={{fontSize:11.5,color:txm,marginBottom:5}}>
                        Working Hours <span style={{color:txf}}>(AI tells customers when you are open)</span>
                      </div>
                      <input placeholder="e.g. Mon-Sat 10am-8pm, Sunday 11am-6pm" value={biz.workingHours}
                        onChange={function(e) { setBiz(function(p) { return Object.assign({},p,{workingHours:e.target.value}) }) }}
                        style={inp} />
                    </div>
                    <div>
                      <div style={{fontSize:11.5,color:txm,marginBottom:5}}>
                        About Your Business <span style={{color:txf}}>(AI uses this to answer customer questions)</span>
                      </div>
                      <textarea
                        placeholder="Tell customers what makes your salon/spa/clinic special - your experience, specialties, certifications, awards..."
                        value={biz.description}
                        onChange={function(e) { setBiz(function(p) { return Object.assign({},p,{description:e.target.value}) }) }}
                        style={Object.assign({},inp,{resize:"vertical",minHeight:90,lineHeight:1.5})}
                      />
                    </div>
                  </div>
                </div>
                <div style={{fontSize:12,color:txf,textAlign:"center"}}>
                  After saving, your AI will immediately use this info to answer customers
                </div>
              </div>

            ) : tab === "services" ? (
              <div style={{maxWidth:720,display:"flex",flexDirection:"column",gap:16}}>

                {/* Add service card */}
                <div style={{background:card,border:"1px solid "+cborder,borderRadius:13,padding:20}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                    <div style={{fontWeight:700,fontSize:14,color:tx}}>Add Service</div>
                    {/* Service type toggle */}
                    <div style={{display:"flex",gap:4,background:ibg,border:"1px solid "+cborder,borderRadius:8,padding:3}}>
                      {[{val:"appointment",label:"Appointment"},{val:"package",label:"Package"}].map(function(opt) {
                        var active = newSvc.service_type === opt.val
                        var activeColor = opt.val === "package" ? "#38bdf8" : acc
                        return (
                          <button key={opt.val}
                            onClick={function() { setNewSvc(function(p) { return Object.assign({},p,{service_type:opt.val}) }) }}
                            style={{
                              padding:"5px 14px", borderRadius:6, fontSize:12, fontWeight:600,
                              cursor:"pointer", border:"none", fontFamily:"'Plus Jakarta Sans',sans-serif",
                              background: active ? (opt.val === "package" ? "rgba(56,189,248,0.15)" : acc+"22") : "transparent",
                              color: active ? activeColor : txm
                            }}>
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Type hint */}
                  <div style={{
                    fontSize:11.5, color:txf, marginBottom:14, padding:"8px 12px",
                    background:ibg, borderRadius:7,
                    borderLeft:"2px solid " + (isAppt ? acc : "#38bdf8")
                  }}>
                    {isAppt
                      ? "Appointment: has duration and time slot booking (e.g. Haircut 45 min, Facial 60 min)"
                      : "Package: sold as a bundle, no slot booking needed (e.g. Bridal Package, 10-session Membership)"}
                  </div>

                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {/* Row 1 */}
                    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:10}}>
                      <div>
                        <div style={{fontSize:11,color:txm,marginBottom:4}}>Service Name *</div>
                        <input
                          placeholder={isAppt ? "e.g. Hair Colour, Facial" : "e.g. Bridal Package, 10 Sessions"}
                          value={newSvc.name}
                          onChange={function(e) { setNewSvc(function(p) { return Object.assign({},p,{name:e.target.value}) }) }}
                          style={inp} />
                      </div>
                      <div>
                        <div style={{fontSize:11,color:txm,marginBottom:4}}>Price (Rs.) *</div>
                        <input type="number" placeholder="500" value={newSvc.price}
                          onChange={function(e) { setNewSvc(function(p) { return Object.assign({},p,{price:e.target.value}) }) }}
                          style={inp} />
                      </div>
                      <div>
                        <div style={{fontSize:11,color:txm,marginBottom:4}}>Category</div>
                        <select value={newSvc.category}
                          onChange={function(e) { setNewSvc(function(p) { return Object.assign({},p,{category:e.target.value}) }) }}
                          style={inp}>
                          {CATEGORIES.map(function(c) { return <option key={c}>{c}</option> })}
                        </select>
                      </div>
                    </div>

                    {/* Row 2: appointment fields vs package description */}
                    {isAppt ? (
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                        <div>
                          <div style={{fontSize:11,color:txm,marginBottom:4}}>Duration</div>
                          <select value={newSvc.duration}
                            onChange={function(e) { setNewSvc(function(p) { return Object.assign({},p,{duration:e.target.value}) }) }}
                            style={inp}>
                            {DURATION_OPTIONS.map(function(d) { return <option key={d} value={String(d)}>{d} min</option> })}
                          </select>
                        </div>
                        <div>
                          <div style={{fontSize:11,color:txm,marginBottom:4}}>
                            Capacity <span style={{fontSize:10,color:txf}}>(parallel bookings per slot)</span>
                          </div>
                          <input type="number" min="1" max="20" placeholder="1" value={newSvc.capacity}
                            onChange={function(e) { setNewSvc(function(p) { return Object.assign({},p,{capacity:e.target.value}) }) }}
                            style={inp} />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{fontSize:11,color:txm,marginBottom:4}}>
                          Package Description <span style={{fontSize:10,color:txf}}>(AI tells customers what is included)</span>
                        </div>
                        <input placeholder="e.g. Includes 10 sessions, valid for 3 months"
                          value={newSvc.description}
                          onChange={function(e) { setNewSvc(function(p) { return Object.assign({},p,{description:e.target.value}) }) }}
                          style={inp} />
                      </div>
                    )}

                    <button onClick={addService}
                      disabled={saving || !newSvc.name || !newSvc.price}
                      style={{
                        background: (saving || !newSvc.name || !newSvc.price) ? "rgba(0,208,132,0.3)" : acc,
                        color:"#000", border:"none", padding:"10px", borderRadius:8,
                        fontWeight:700, fontSize:13,
                        cursor: (saving || !newSvc.name || !newSvc.price) ? "not-allowed" : "pointer",
                        fontFamily:"'Plus Jakarta Sans',sans-serif"
                      }}>
                      {saving ? "Adding..." : "+ Add Service"}
                    </button>
                  </div>
                </div>

                {/* Services list */}
                <div style={{background:card,border:"1px solid "+cborder,borderRadius:13,overflow:"hidden"}}>
                  <div style={{padding:"12px 16px",borderBottom:"1px solid "+border,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{fontWeight:700,fontSize:13,color:tx}}>
                      Your Services ({services.length})
                    </div>
                    <div style={{fontSize:11,color:txf}}>
                      {services.filter(function(s) { return s.service_type !== "package" }).length} appointments &bull; {services.filter(function(s) { return s.service_type === "package" }).length} packages
                    </div>
                  </div>

                  {services.length === 0 ? (
                    <div style={{textAlign:"center",padding:"32px",color:txf,fontSize:12}}>
                      No services yet - add your first service above
                    </div>
                  ) : CATEGORIES.filter(function(cat) { return services.some(function(s) { return s.category === cat }) }).map(function(cat) {
                    return (
                      <div key={cat}>
                        <div style={{padding:"7px 16px",background:ibg,fontSize:10,fontWeight:700,color:txf,letterSpacing:"1px",textTransform:"uppercase"}}>{cat}</div>
                        {services.filter(function(s) { return s.category === cat }).map(function(s) {
                          var isPkg = s.service_type === "package"
                          var badgeColor  = isPkg ? "#38bdf8" : acc
                          var badgeBg     = isPkg ? "rgba(56,189,248,0.1)" : acc+"18"
                          var badgeBorder = isPkg ? "rgba(56,189,248,0.2)" : acc+"33"
                          return (
                            <div key={s.id} style={{display:"flex",alignItems:"center",padding:"10px 16px",borderBottom:"1px solid "+border,gap:10,opacity:s.is_active===false?0.45:1}}>
                              <span style={{fontSize:9.5,fontWeight:700,color:badgeColor,background:badgeBg,border:"1px solid "+badgeBorder,borderRadius:100,padding:"1px 7px",flexShrink:0}}>
                                {isPkg ? "pkg" : "appt"}
                              </span>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontWeight:600,fontSize:13,color:tx}}>{s.name}</div>
                                {isPkg && s.description && (
                                  <div style={{fontSize:11,color:txf,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.description}</div>
                                )}
                              </div>
                              {!isPkg && s.duration && (
                                <div style={{fontSize:11.5,color:txm,flexShrink:0}}>{s.duration} min</div>
                              )}
                              {!isPkg && (s.capacity||1) > 1 && (
                                <div style={{fontSize:10.5,fontWeight:700,color:"#38bdf8",background:"rgba(56,189,248,0.1)",border:"1px solid rgba(56,189,248,0.2)",borderRadius:100,padding:"1px 7px",flexShrink:0}}>
                                  {s.capacity} slots
                                </div>
                              )}
                              <div style={{fontWeight:700,fontSize:13,color:acc,flexShrink:0}}>
                                Rs.{parseInt(s.price||0).toLocaleString()}
                              </div>
                              <button onClick={function() { toggleActive(s) }} style={{
                                fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:100,flexShrink:0,
                                border:"1px solid "+(s.is_active===false?"rgba(251,113,133,0.3)":acc+"44"),
                                background:s.is_active===false?"rgba(251,113,133,0.08)":acc+"11",
                                color:s.is_active===false?"#fb7185":acc,
                                cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"
                              }}>
                                {s.is_active===false ? "Off" : "On"}
                              </button>
                              <button onClick={function() { deleteService(s.id) }} style={{background:"transparent",border:"none",color:txf,cursor:"pointer",fontSize:16,lineHeight:1,flexShrink:0}}>
                                x
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>

                <div style={{background:card,border:"1px solid "+cborder,borderRadius:10,padding:"12px 16px",fontSize:12,color:txm,lineHeight:1.6}}>
                  Capacity = how many customers can book the same slot at once. A salon with 3 stylists doing haircuts can set capacity to 3.
                </div>
              </div>

            ) : tab === "ai" ? (
              <div style={{maxWidth:620,display:"flex",flexDirection:"column",gap:20}}>
                <div style={{background:card,border:"1px solid "+cborder,borderRadius:13,padding:22}}>
                  <div style={{fontWeight:700,fontSize:14,color:tx,marginBottom:4}}>AI Brain Settings</div>
                  <div style={{fontSize:12,color:txf,marginBottom:16}}>Control how your AI responds to customers on WhatsApp</div>
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    <div>
                      <div style={{fontSize:11.5,color:txm,marginBottom:5}}>Primary Language</div>
                      <select value={ai.language}
                        onChange={function(e) { setAI(function(p) { return Object.assign({},p,{language:e.target.value}) }) }}
                        style={inp}>
                        {LANGUAGES.map(function(l) { return <option key={l}>{l}</option> })}
                      </select>
                    </div>

                    <div className="tr2">
                      <div>
                        <div style={{fontWeight:600,fontSize:13,color:tx}}>Auto Booking</div>
                        <div style={{fontSize:11.5,color:txm}}>AI books appointments automatically from WhatsApp chat</div>
                      </div>
                      <button className="tog"
                        style={{background: ai.autoBooking ? acc : "rgba(255,255,255,0.12)"}}
                        onClick={function() { setAI(function(p) { return Object.assign({},p,{autoBooking:!p.autoBooking}) }) }}>
                        <span style={{position:"absolute",top:3,width:16,height:16,borderRadius:"50%",background:"#fff",left:ai.autoBooking?"19px":"3px",transition:"left 0.2s",display:"block"}} />
                      </button>
                    </div>

                    <div className="tr2">
                      <div>
                        <div style={{fontWeight:600,fontSize:13,color:tx}}>Follow-up Messages</div>
                        <div style={{fontSize:11.5,color:txm}}>AI follows up with inactive leads automatically</div>
                      </div>
                      <button className="tog"
                        style={{background: ai.followUpEnabled ? acc : "rgba(255,255,255,0.12)"}}
                        onClick={function() { setAI(function(p) { return Object.assign({},p,{followUpEnabled:!p.followUpEnabled}) }) }}>
                        <span style={{position:"absolute",top:3,width:16,height:16,borderRadius:"50%",background:"#fff",left:ai.followUpEnabled?"19px":"3px",transition:"left 0.2s",display:"block"}} />
                      </button>
                    </div>

                    <div>
                      <div style={{fontSize:11.5,color:txm,marginBottom:5}}>
                        Greeting Message <span style={{color:txf}}>(sent to new customers on first message)</span>
                      </div>
                      <textarea
                        placeholder={"Hi [Name]! Welcome to " + (biz.name || "our salon") + " How can I help you today?"}
                        value={ai.greetingMessage}
                        onChange={function(e) { setAI(function(p) { return Object.assign({},p,{greetingMessage:e.target.value}) }) }}
                        style={Object.assign({},inp,{resize:"vertical",minHeight:80})}
                      />
                    </div>

                    <div>
                      <div style={{fontSize:11.5,color:txm,marginBottom:5}}>
                        Custom AI Instructions <span style={{color:txf}}>(tone, rules, upsells, FAQs)</span>
                      </div>
                      <textarea
                        placeholder={"Examples:\n- Always use the customer's first name\n- Upsell hair spa with every haircut booking\n- Free parking available below the building\n- Never mention competitor salons\n- If unsure about pricing say I will check and get back to you"}
                        value={ai.customInstructions}
                        onChange={function(e) { setAI(function(p) { return Object.assign({},p,{customInstructions:e.target.value}) }) }}
                        style={Object.assign({},inp,{resize:"vertical",minHeight:140,lineHeight:1.6})}
                      />
                    </div>

                    <div style={{background:"rgba(0,208,132,0.06)",border:"1px solid "+acc+"22",borderRadius:9,padding:"12px 14px",fontSize:12,color:txm,lineHeight:1.7}}>
                      Your AI knows: business name, type, location, working hours, all services with prices and durations, and your custom instructions above. The more you fill in, the smarter your AI gets.
                    </div>
                  </div>
                </div>
              </div>

            ) : tab === "whatsapp" ? (
              <div style={{maxWidth:560,display:"flex",flexDirection:"column",gap:16}}>
                {whatsapp ? (
                  <div style={{background:card,border:"1px solid "+acc+"44",borderRadius:13,padding:22}}>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                      <div style={{width:44,height:44,borderRadius:11,background:"#25d366",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>💬</div>
                      <div>
                        <div style={{fontWeight:800,fontSize:15,color:tx}}>WhatsApp Connected</div>
                        <div style={{fontSize:12,color:txm}}>Your AI is live and responding to customers</div>
                      </div>
                    </div>
                    {[["Phone Number ID",whatsapp.phone_number_id],["WABA ID",whatsapp.waba_id||"-"],["Status","Active"]].map(function(row) {
                      return (
                        <div key={row[0]} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid "+border}}>
                          <span style={{fontSize:12,color:txm}}>{row[0]}</span>
                          <span style={{fontSize:12,fontWeight:600,color:tx,fontFamily:"monospace"}}>{row[1]}</span>
                        </div>
                      )
                    })}
                    <button onClick={disconnectWA} style={{marginTop:16,width:"100%",padding:"9px",background:"rgba(251,113,133,0.1)",border:"1px solid rgba(251,113,133,0.25)",borderRadius:8,color:"#fb7185",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                      Disconnect WhatsApp
                    </button>
                  </div>
                ) : (
                  <div style={{background:card,border:"1px solid "+cborder,borderRadius:13,padding:28,textAlign:"center"}}>
                    <div style={{fontSize:36,marginBottom:12}}>💬</div>
                    <div style={{fontWeight:800,fontSize:16,color:tx,marginBottom:6}}>Connect Your WhatsApp</div>
                    <div style={{fontSize:13,color:txm,marginBottom:20,lineHeight:1.6}}>Link your business WhatsApp to activate AI replies, lead capture, and auto-booking.</div>
                    <button onClick={function() {
                      var appId="780799931531576", configId="1090960043190718"
                      var redirectUri="https://fastrill.com/api/meta/callback"
                      window.location.href="https://www.facebook.com/v18.0/dialog/oauth?client_id="+appId+"&redirect_uri="+encodeURIComponent(redirectUri)+"&response_type=code&config_id="+configId
                    }} style={{background:"#1877f2",color:"#fff",border:"none",padding:"11px 24px",borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                      Connect WhatsApp via Meta
                    </button>
                  </div>
                )}
                <div style={{background:card,border:"1px solid "+cborder,borderRadius:13,padding:20}}>
                  <div style={{fontWeight:700,fontSize:13.5,color:tx,marginBottom:12}}>Webhook Configuration</div>
                  {[
                    ["Webhook URL","https://fastrill.com/api/meta/webhook"],
                    ["Verify Token","fastrill_webhook_2026"],
                    ["Events","messages, message_status"]
                  ].map(function(row) {
                    return (
                      <div key={row[0]} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid "+border}}>
                        <span style={{fontSize:12,color:txm}}>{row[0]}</span>
                        <span style={{fontSize:11.5,fontWeight:600,color:tx,fontFamily:"monospace",wordBreak:"break-all",textAlign:"right",maxWidth:"60%"}}>{row[1]}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
