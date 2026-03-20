"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/Toast"

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
  { id:"business", label:"Business",   icon:"🏢" },
  { id:"ai",       label:"AI Brain",   icon:"◈" },
  { id:"services", label:"Services",   icon:"📋" },
  { id:"whatsapp", label:"WhatsApp",   icon:"💬" },
]

const LANGUAGES = ["English","Hindi","Telugu","Tamil","Kannada","Malayalam","Marathi","Bengali","Gujarati","Punjabi","Auto-detect"]
const BIZ_TYPES  = ["Salon","Clinic","Spa","Gym","Restaurant","Agency","Consulting","Retail","Education","Real Estate","Other"]

export default function Settings() {
  const router = useRouter()
  const toast  = useToast()

  const [userEmail, setUserEmail]   = useState("")
  const [userId, setUserId]         = useState(null)
  const [dark, setDark]             = useState(true)
  const [mobOpen, setMobOpen]       = useState(false)
  const [tab, setTab]               = useState("business")
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [waConn, setWaConn]         = useState(null)

  // Business settings
  const [biz, setBiz] = useState({
    business_name:"", business_type:"", location:"", maps_link:"",
    working_hours:"", description:"", phone:"", email:"", website:""
  })

  // AI Brain
  const [ai, setAi] = useState({
    ai_instructions:"", ai_language:"English", greeting_message:"",
    content:"", knowledge:""
  })

  // Services list
  const [services, setServices]   = useState([])
  const [newSvc, setNewSvc]       = useState({ name:"", price:"", duration:"", category:"", description:"", service_type:"time" })
  const [editSvcId, setEditSvcId] = useState(null)
  const [editSvc, setEditSvc]     = useState({})
  const [addingSvc, setAddingSvc] = useState(false)

  // Test AI
  const [testMsg, setTestMsg]     = useState("")
  const [testReply, setTestReply] = useState("")
  const [testing, setTesting]     = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) router.push("/login")
      else { setUserEmail(data.user.email || ""); setUserId(data.user.id) }
    })
  }, [])

  useEffect(() => { if (userId) loadAll() }, [userId])

  async function loadAll() {
    setLoading(true)
    try {
      const [{ data: bizData }, { data: aiData }, { data: svcData }, { data: waData }] = await Promise.all([
        supabase.from("business_settings").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("business_knowledge").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("services").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
        supabase.from("whatsapp_connections").select("phone_number_id,created_at,status").eq("user_id", userId).maybeSingle(),
      ])
      if (bizData) setBiz({
        business_name:  bizData.business_name  || "",
        business_type:  bizData.business_type  || "",
        location:       bizData.location       || "",
        maps_link:      bizData.maps_link      || "",
        working_hours:  bizData.working_hours  || "",
        description:    bizData.description    || "",
        phone:          bizData.phone          || "",
        email:          bizData.email          || "",
        website:        bizData.website        || "",
      })
      if (aiData) setAi({
        ai_instructions: aiData.ai_instructions || bizData?.ai_instructions || "",
        ai_language:     bizData?.ai_language   || "English",
        greeting_message:bizData?.greeting_message || "",
        content:         aiData.content         || "",
        knowledge:       aiData.knowledge       || aiData.notes || "",
      })
      setServices(svcData || [])
      setWaConn(waData || null)
    } catch(e) { toast.error("Failed to load settings") }
    setLoading(false)
  }

  async function saveBusiness() {
    if (!biz.business_name.trim()) { toast.warning("Business name is required"); return }
    setSaving(true)
    try {
      const { data: existing } = await supabase.from("business_settings").select("id").eq("user_id", userId).maybeSingle()
      if (existing) {
        await supabase.from("business_settings").update({ ...biz, updated_at: new Date().toISOString() }).eq("user_id", userId)
      } else {
        await supabase.from("business_settings").insert({ ...biz, user_id: userId, created_at: new Date().toISOString() })
      }
      toast.success("Business settings saved!")
    } catch(e) { toast.error("Failed to save: " + e.message) }
    setSaving(false)
  }

  async function saveAI() {
    setSaving(true)
    try {
      // Update language + greeting in business_settings
      await supabase.from("business_settings").update({
        ai_language:      ai.ai_language,
        greeting_message: ai.greeting_message,
        ai_instructions:  ai.ai_instructions,
      }).eq("user_id", userId)

      // Upsert business_knowledge
      const { data: existing } = await supabase.from("business_knowledge").select("id").eq("user_id", userId).maybeSingle()
      if (existing) {
        await supabase.from("business_knowledge").update({
          ai_instructions: ai.ai_instructions, content: ai.content, knowledge: ai.knowledge,
          updated_at: new Date().toISOString()
        }).eq("user_id", userId)
      } else {
        await supabase.from("business_knowledge").insert({
          user_id: userId, ai_instructions: ai.ai_instructions,
          content: ai.content, knowledge: ai.knowledge,
          created_at: new Date().toISOString()
        })
      }
      toast.success("AI Brain saved! Changes apply to next message.")
    } catch(e) { toast.error("Failed to save AI settings: " + e.message) }
    setSaving(false)
  }

  async function testAI() {
    if (!testMsg.trim()) { toast.warning("Enter a test message first"); return }
    setTesting(true); setTestReply("")
    try {
      const res = await fetch("/api/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: testMsg, userId })
      })
      const data = await res.json()
      if (data.reply) setTestReply(data.reply)
      else setTestReply("Test reply not available — check webhook logs on Vercel")
    } catch(e) { setTestReply("Test failed: " + e.message) }
    setTesting(false)
  }

  async function addService() {
    if (!newSvc.name.trim() || !newSvc.price) { toast.warning("Name and price are required"); return }
    setAddingSvc(true)
    try {
      const { data, error } = await supabase.from("services").insert({
        user_id: userId, name: newSvc.name.trim(), price: parseFloat(newSvc.price) || 0,
        duration: parseInt(newSvc.duration) || null, category: newSvc.category || null,
        description: newSvc.description || null, service_type: newSvc.service_type || "time",
        is_active: true, created_at: new Date().toISOString()
      }).select().single()
      if (error) throw error
      setServices(prev => [...prev, data])
      setNewSvc({ name:"", price:"", duration:"", category:"", description:"", service_type:"time" })
      toast.success(newSvc.name + " added")
    } catch(e) { toast.error("Failed to add service: " + e.message) }
    setAddingSvc(false)
  }

  async function updateService(id) {
    try {
      await supabase.from("services").update({
        name: editSvc.name, price: parseFloat(editSvc.price)||0,
        duration: parseInt(editSvc.duration)||null, category: editSvc.category||null,
        description: editSvc.description||null, service_type: editSvc.service_type||"time",
        is_active: editSvc.is_active
      }).eq("id", id)
      setServices(prev => prev.map(s => s.id === id ? { ...s, ...editSvc } : s))
      setEditSvcId(null)
      toast.success("Service updated")
    } catch(e) { toast.error("Failed to update service") }
  }

  async function toggleService(id, isActive) {
    try {
      await supabase.from("services").update({ is_active: !isActive }).eq("id", id)
      setServices(prev => prev.map(s => s.id === id ? { ...s, is_active: !isActive } : s))
      toast.info(isActive ? "Service disabled — AI won't offer it" : "Service enabled")
    } catch(e) { toast.error("Failed to toggle service") }
  }

  async function deleteService(id, name) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      await supabase.from("services").delete().eq("id", id)
      setServices(prev => prev.filter(s => s.id !== id))
      toast.success(name + " deleted")
    } catch(e) { toast.error("Failed to delete service") }
  }

  const handleConnect = () => {
    const appId="780799931531576", configId="1090960043190718", redirectUri="https://fastrill.com/api/meta/callback"
    window.location.href=`https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&config_id=${configId}`
  }

  const toggleTheme  = () => { const n=!dark; setDark(n); localStorage.setItem("fastrill-theme",n?"dark":"light") }
  const handleLogout = async () => { try{ await supabase.auth.signOut(); router.push("/login") } catch(e){ toast.error("Sign out failed") } }

  const bg=dark?"#08080e":"#f0f2f5", sb=dark?"#0c0c15":"#ffffff", card=dark?"#0f0f1a":"#ffffff"
  const bdr=dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.08)", cbdr=dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.09)"
  const tx=dark?"#eeeef5":"#111827", txm=dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const txf=dark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.25)", ibg=dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"
  const acc=dark?"#00d084":"#00935a"
  const navText=dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const navActive=dark?"rgba(0,196,125,0.1)":"rgba(0,180,115,0.08)"
  const navActiveBorder=dark?"rgba(0,196,125,0.2)":"rgba(0,180,115,0.2)"
  const navActiveText=dark?"#00c47d":"#00935a"
  const adim=dark?"rgba(0,208,132,0.12)":"rgba(0,147,90,0.1)"
  const ui=userEmail?userEmail[0].toUpperCase():"G"
  const inp={background:ibg,border:`1px solid ${cbdr}`,borderRadius:8,padding:"9px 12px",fontSize:13,color:tx,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none",width:"100%"}
  const label={fontSize:12,color:txm,fontWeight:600,marginBottom:5,display:"block"}

  const SectionHeader = ({title,sub})=>(
    <div style={{marginBottom:20}}>
      <div style={{fontWeight:700,fontSize:14,color:tx}}>{title}</div>
      {sub&&<div style={{fontSize:12,color:txf,marginTop:2}}>{sub}</div>}
    </div>
  )

  const Field = ({label:l,children})=>(
    <div style={{marginBottom:14}}>
      <div style={{...label}}>{l}</div>
      {children}
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${bg}!important;color:${tx}!important;font-family:'Plus Jakarta Sans',sans-serif!important;}
        .wrap{display:flex;height:100vh;overflow:hidden;}
        .sidebar{width:224px;flex-shrink:0;background:${sb};border-right:1px solid ${bdr};display:flex;flex-direction:column;overflow-y:auto;}
        .logo{padding:22px 20px 18px;font-weight:800;font-size:20px;color:${tx};text-decoration:none;display:block;border-bottom:1px solid ${bdr};}
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
        .ttog{display:flex;align-items:center;gap:6px;padding:5px 10px;background:${ibg};border:1px solid ${cbdr};border-radius:8px;cursor:pointer;font-size:11.5px;color:${txm};font-family:'Plus Jakarta Sans',sans-serif;}
        .tpill{width:30px;height:16px;border-radius:100px;background:${dark?acc:"#d1d5db"};position:relative;flex-shrink:0;}
        .tpill::after{content:'';position:absolute;top:2px;width:12px;height:12px;border-radius:50%;background:#fff;left:${dark?"16px":"2px"};}
        .content{flex:1;display:flex;overflow:hidden;}
        .tabs-sidebar{width:180px;flex-shrink:0;border-right:1px solid ${bdr};padding:16px 12px;background:${sb};display:flex;flex-direction:column;gap:3px;}
        .tab-btn{display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:8px;cursor:pointer;border:none;background:transparent;text-align:left;font-family:'Plus Jakarta Sans',sans-serif;width:100%;font-size:13px;color:${txm};font-weight:500;transition:all 0.12s;}
        .tab-btn:hover{background:${ibg};color:${tx};}
        .tab-btn.on{background:${navActive};color:${navActiveText};font-weight:600;border:1px solid ${navActiveBorder};}
        .tab-content{flex:1;overflow-y:auto;padding:28px;background:${bg};}
        .card{background:${card};border:1px solid ${cbdr};border-radius:13px;padding:22px;margin-bottom:16px;}
        .two-col{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        .svc-row{display:flex;align-items:center;gap:12px;padding:"11px 0";border-bottom:1px solid ${bdr};}
        .hbtn{display:none;background:${ibg};border:1px solid ${cbdr};border-radius:8px;padding:6px 9px;cursor:pointer;font-size:17px;color:${tx};line-height:1;margin-right:2px;}
        .mob-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:299;cursor:pointer;}
        .mob-ov.open{display:block;}
        .bnav{display:none;position:fixed;bottom:0;left:0;right:0;background:${sb};border-top:1px solid ${bdr};padding:6px 0;z-index:200;}
        .bni{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 6px;border:none;background:transparent;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;flex:1;}
        .bnic{font-size:17px;color:rgba(255,255,255,0.3);}
        .bnil{font-size:9px;font-weight:600;color:rgba(255,255,255,0.3);}
        .bni.on .bnic,.bni.on .bnil{color:${acc};}
        @media(max-width:767px){
          .wrap{position:relative;}
          .sidebar{position:fixed;top:0;left:0;height:100vh;z-index:300;transform:translateX(-100%);transition:transform 0.25s;width:240px!important;box-shadow:4px 0 24px rgba(0,0,0,0.5);}
          .sidebar.open{transform:translateX(0);}
          .mob-ov.open{display:block;}
          .hbtn{display:flex;}
          .bnav{display:flex;}
          .main{padding-bottom:60px;}
          .topbar{padding:0 12px!important;}
          .content{flex-direction:column;}
          .tabs-sidebar{width:100%!important;flex-direction:row;border-right:none;border-bottom:1px solid ${bdr};padding:8px;overflow-x:auto;}
          .tab-content{padding:16px;}
          .two-col{grid-template-columns:1fr!important;}
        }
        input:focus,textarea:focus,select:focus{border-color:${acc}88!important;outline:none;}
        select option{background-color:#0c0c15!important;color:#eeeef5!important;}
        .save-btn{padding:"10px 24px";border-radius:9px;background:${acc};border:none;color:#000;font-weight:700;font-size:13px;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .save-btn:disabled{opacity:0.6;cursor:not-allowed;}
      `}</style>

      <div className="wrap">
        <div className={"mob-ov"+(mobOpen?" open":"")} onClick={()=>setMobOpen(false)}/>
        <aside className={"sidebar"+(mobOpen?" open":"")}>
          <a href="/dashboard" className="logo">fast<span>rill</span></a>
          <div className="nav-sec">Platform</div>
          {NAV.map(item=>(
            <button key={item.id} className={"nav-item"+(item.id==="settings"?" active":"")} onClick={()=>router.push(item.path)}>
              <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
          <div className="sbf">
            <div className="uc">
              <div className="ua">{ui}</div>
              <div style={{fontSize:11.5,color:txm,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{userEmail||"Loading..."}</div>
            </div>
            <button className="lb" onClick={handleLogout}>↩ Sign out</button>
          </div>
        </aside>

        <div className="main">
          <div className="topbar">
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button className="hbtn" onClick={()=>setMobOpen(s=>!s)}>☰</button>
              <span style={{fontWeight:700,fontSize:15,color:tx}}>Settings</span>
            </div>
            <button className="ttog" onClick={toggleTheme}><span>{dark?"🌙":"☀️"}</span><div className="tpill"/><span>{dark?"Dark":"Light"}</span></button>
          </div>

          <div className="content">
            {/* Tab sidebar */}
            <div className="tabs-sidebar">
              {TABS.map(t=>(
                <button key={t.id} className={"tab-btn"+(tab===t.id?" on":"")} onClick={()=>setTab(t.id)}>
                  <span style={{fontSize:14}}>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="tab-content">
              {loading?(
                <div style={{textAlign:"center",padding:60,color:txf,fontSize:14}}>Loading settings...</div>
              ):(

                /* ─── BUSINESS TAB ─── */
                tab==="business"&&(
                  <div>
                    <SectionHeader title="Business Profile" sub="This information is used by the AI to represent your business"/>
                    <div className="card">
                      <div className="two-col">
                        <Field label="Business Name *">
                          <input value={biz.business_name} onChange={e=>setBiz(p=>({...p,business_name:e.target.value}))} placeholder="e.g. Priya's Beauty Salon" style={inp}/>
                        </Field>
                        <Field label="Business Type">
                          <select value={biz.business_type} onChange={e=>setBiz(p=>({...p,business_type:e.target.value}))} style={inp}>
                            <option value="">Select type</option>
                            {BIZ_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                          </select>
                        </Field>
                      </div>
                      <Field label="Description">
                        <textarea value={biz.description} onChange={e=>setBiz(p=>({...p,description:e.target.value}))} rows={2} placeholder="Brief description of what your business does" style={{...inp,resize:"vertical"}}/>
                      </Field>
                      <Field label="Address / Location">
                        <input value={biz.location} onChange={e=>setBiz(p=>({...p,location:e.target.value}))} placeholder="Full address customers can use to find you" style={inp}/>
                      </Field>
                      <div className="two-col">
                        <Field label="Google Maps Link">
                          <input value={biz.maps_link} onChange={e=>setBiz(p=>({...p,maps_link:e.target.value}))} placeholder="https://maps.google.com/..." style={inp}/>
                        </Field>
                        <Field label="Website">
                          <input value={biz.website} onChange={e=>setBiz(p=>({...p,website:e.target.value}))} placeholder="https://yoursite.com" style={inp}/>
                        </Field>
                      </div>
                      <Field label="Working Hours">
                        <input value={biz.working_hours} onChange={e=>setBiz(p=>({...p,working_hours:e.target.value}))} placeholder="e.g. Mon–Sat 9am–8pm, Sun 10am–5pm" style={inp}/>
                      </Field>
                      <div className="two-col">
                        <Field label="Phone (for customers)">
                          <input value={biz.phone} onChange={e=>setBiz(p=>({...p,phone:e.target.value}))} placeholder="e.g. +91 98765 43210" style={inp}/>
                        </Field>
                        <Field label="Email">
                          <input value={biz.email} onChange={e=>setBiz(p=>({...p,email:e.target.value}))} placeholder="contact@yourbusiness.com" style={inp}/>
                        </Field>
                      </div>
                    </div>
                    <button onClick={saveBusiness} disabled={saving} style={{padding:"10px 28px",borderRadius:9,background:acc,border:"none",color:"#000",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",opacity:saving?0.6:1}}>
                      {saving?"Saving...":"Save Business Settings"}
                    </button>
                  </div>
                )
              )}

              {/* ─── AI BRAIN TAB ─── */}
              {!loading&&tab==="ai"&&(
                <div>
                  <SectionHeader title="AI Brain" sub="Configure how your AI assistant thinks, talks, and responds"/>

                  <div className="card">
                    <div style={{fontWeight:600,fontSize:13,color:tx,marginBottom:12}}>🌐 Language & Style</div>
                    <div className="two-col">
                      <Field label="Reply Language">
                        <select value={ai.ai_language} onChange={e=>setAi(p=>({...p,ai_language:e.target.value}))} style={inp}>
                          {LANGUAGES.map(l=><option key={l} value={l}>{l}</option>)}
                        </select>
                      </Field>
                      <Field label="Greeting Style">
                        <input value={ai.greeting_message} onChange={e=>setAi(p=>({...p,greeting_message:e.target.value}))} placeholder="e.g. Warm & friendly, use Hindi sometimes" style={inp}/>
                      </Field>
                    </div>
                  </div>

                  <div className="card">
                    <div style={{fontWeight:600,fontSize:13,color:tx,marginBottom:4}}>📝 AI Instructions</div>
                    <div style={{fontSize:11.5,color:txf,marginBottom:12}}>Tell the AI how to behave, what to say, what to avoid. The more specific, the better.</div>
                    <textarea value={ai.ai_instructions} onChange={e=>setAi(p=>({...p,ai_instructions:e.target.value}))} rows={5} placeholder={"Examples:\n• Always be warm and use the customer's first name\n• If someone asks about price, always mention our premium packages first\n• For clinic: never give medical advice, always ask them to visit\n• For salon: suggest add-on services when booking"} style={{...inp,resize:"vertical",lineHeight:1.6}}/>
                  </div>

                  <div className="card">
                    <div style={{fontWeight:600,fontSize:13,color:tx,marginBottom:4}}>🧠 Business Knowledge</div>
                    <div style={{fontSize:11.5,color:txf,marginBottom:12}}>Add anything the AI should know — FAQs, policies, parking info, special deals, staff names, etc.</div>
                    <textarea value={ai.knowledge} onChange={e=>setAi(p=>({...p,knowledge:e.target.value}))} rows={6} placeholder={"Examples:\n• Free parking available in basement B2\n• Ask for Priya if you want the best haircut experience\n• We use Kerastase products only — no chemical treatments without patch test\n• Cancellations must be 2 hours before appointment"} style={{...inp,resize:"vertical",lineHeight:1.6}}/>
                  </div>

                  {/* Test AI */}
                  <div className="card">
                    <div style={{fontWeight:600,fontSize:13,color:tx,marginBottom:4}}>🧪 Test Your AI</div>
                    <div style={{fontSize:11.5,color:txf,marginBottom:12}}>Send a test message to see how your AI would reply (uses current saved settings)</div>
                    <div style={{display:"flex",gap:8,marginBottom:testReply?12:0}}>
                      <input value={testMsg} onChange={e=>setTestMsg(e.target.value)} placeholder='e.g. "What services do you offer?" or "Book me tomorrow at 10"'
                        onKeyDown={e=>{if(e.key==="Enter")testAI()}} style={{...inp,flex:1}}/>
                      <button onClick={testAI} disabled={testing||!testMsg.trim()}
                        style={{padding:"9px 18px",borderRadius:8,background:testing?ibg:adim,border:`1px solid ${acc}44`,color:acc,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",flexShrink:0,whiteSpace:"nowrap"}}>
                        {testing?"Testing...":"Test →"}
                      </button>
                    </div>
                    {testReply&&(
                      <div style={{background:`${acc}0d`,border:`1px solid ${acc}22`,borderRadius:9,padding:"12px 14px"}}>
                        <div style={{fontSize:10.5,color:acc,fontWeight:700,marginBottom:5}}>◈ AI REPLY</div>
                        <div style={{fontSize:13,color:tx,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{testReply}</div>
                      </div>
                    )}
                  </div>

                  <button onClick={saveAI} disabled={saving} style={{padding:"10px 28px",borderRadius:9,background:acc,border:"none",color:"#000",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",opacity:saving?0.6:1}}>
                    {saving?"Saving...":"Save AI Settings"}
                  </button>
                </div>
              )}

              {/* ─── SERVICES TAB ─── */}
              {!loading&&tab==="services"&&(
                <div>
                  <SectionHeader title="Services" sub="Services the AI offers and books for customers. Keep them accurate — AI uses this to answer pricing questions."/>

                  {/* Add new service */}
                  <div className="card">
                    <div style={{fontWeight:600,fontSize:13,color:tx,marginBottom:14}}>+ Add New Service</div>
                    <div className="two-col" style={{marginBottom:10}}>
                      <Field label="Service Name *">
                        <input value={newSvc.name} onChange={e=>setNewSvc(p=>({...p,name:e.target.value}))} placeholder="e.g. Haircut, Full Body Massage, Consultation" style={inp}/>
                      </Field>
                      <Field label="Price (₹) *">
                        <input type="number" value={newSvc.price} onChange={e=>setNewSvc(p=>({...p,price:e.target.value}))} placeholder="e.g. 500" style={inp}/>
                      </Field>
                    </div>
                    <div className="two-col" style={{marginBottom:10}}>
                      <Field label="Type">
                        <select value={newSvc.service_type} onChange={e=>setNewSvc(p=>({...p,service_type:e.target.value}))} style={inp}>
                          <option value="time">Time-based (slot booking)</option>
                          <option value="package">Package (no slot needed)</option>
                        </select>
                      </Field>
                      <Field label="Duration (min) — for time-based">
                        <input type="number" value={newSvc.duration} onChange={e=>setNewSvc(p=>({...p,duration:e.target.value}))} placeholder="e.g. 30" style={inp}/>
                      </Field>
                    </div>
                    <div className="two-col" style={{marginBottom:14}}>
                      <Field label="Category">
                        <input value={newSvc.category} onChange={e=>setNewSvc(p=>({...p,category:e.target.value}))} placeholder="e.g. Hair, Skin, Wellness" style={inp}/>
                      </Field>
                      <Field label="Description (shown to customers)">
                        <input value={newSvc.description} onChange={e=>setNewSvc(p=>({...p,description:e.target.value}))} placeholder="Brief description" style={inp}/>
                      </Field>
                    </div>
                    <button onClick={addService} disabled={addingSvc||!newSvc.name.trim()||!newSvc.price}
                      style={{padding:"9px 20px",borderRadius:8,background:newSvc.name&&newSvc.price?acc:ibg,border:"none",color:newSvc.name&&newSvc.price?"#000":txm,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                      {addingSvc?"Adding...":"Add Service"}
                    </button>
                  </div>

                  {/* Services list */}
                  <div className="card">
                    <div style={{fontWeight:600,fontSize:13,color:tx,marginBottom:4}}>Your Services ({services.length})</div>
                    <div style={{fontSize:11.5,color:txf,marginBottom:14}}>Toggle to enable/disable a service. Disabled services won't be offered by AI.</div>
                    {services.length===0?(
                      <div style={{textAlign:"center",padding:"24px 0",color:txf,fontSize:12}}>No services added yet. Add your first service above.</div>
                    ):services.map(s=>(
                      <div key={s.id} style={{padding:"12px 0",borderBottom:`1px solid ${bdr}`}}>
                        {editSvcId===s.id?(
                          // Edit mode
                          <div>
                            <div className="two-col" style={{marginBottom:8}}>
                              <input value={editSvc.name||""} onChange={e=>setEditSvc(p=>({...p,name:e.target.value}))} placeholder="Name" style={{...inp,fontSize:12}}/>
                              <input type="number" value={editSvc.price||""} onChange={e=>setEditSvc(p=>({...p,price:e.target.value}))} placeholder="Price ₹" style={{...inp,fontSize:12}}/>
                            </div>
                            <div className="two-col" style={{marginBottom:8}}>
                              <select value={editSvc.service_type||"time"} onChange={e=>setEditSvc(p=>({...p,service_type:e.target.value}))} style={{...inp,fontSize:12}}>
                                <option value="time">Time-based</option>
                                <option value="package">Package</option>
                              </select>
                              <input type="number" value={editSvc.duration||""} onChange={e=>setEditSvc(p=>({...p,duration:e.target.value}))} placeholder="Duration (min)" style={{...inp,fontSize:12}}/>
                            </div>
                            <input value={editSvc.description||""} onChange={e=>setEditSvc(p=>({...p,description:e.target.value}))} placeholder="Description" style={{...inp,fontSize:12,marginBottom:8}}/>
                            <div style={{display:"flex",gap:8}}>
                              <button onClick={()=>setEditSvcId(null)} style={{padding:"6px 14px",borderRadius:7,background:ibg,border:`1px solid ${cbdr}`,color:txm,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Cancel</button>
                              <button onClick={()=>updateService(s.id)} style={{padding:"6px 14px",borderRadius:7,background:acc,border:"none",color:"#000",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Save</button>
                            </div>
                          </div>
                        ):(
                          // View mode
                          <div style={{display:"flex",alignItems:"center",gap:12}}>
                            {/* Toggle */}
                            <button onClick={()=>toggleService(s.id,s.is_active!==false)}
                              style={{width:36,height:20,borderRadius:100,position:"relative",cursor:"pointer",border:"none",background:s.is_active!==false?acc:"rgba(255,255,255,0.12)",transition:"background 0.2s",flexShrink:0}}>
                              <span style={{position:"absolute",top:"2px",width:"16px",height:"16px",borderRadius:"50%",background:"#fff",transition:"left 0.2s",left:s.is_active!==false?"18px":"2px",display:"block"}}/>
                            </button>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                <span style={{fontWeight:600,fontSize:13,color:s.is_active!==false?tx:txf}}>{s.name}</span>
                                <span style={{fontSize:10,fontWeight:600,color:acc,background:adim,borderRadius:100,padding:"1px 7px"}}>{s.service_type==="package"?"Package":"Time-based"}</span>
                                {s.category&&<span style={{fontSize:10,color:txf}}>{s.category}</span>}
                              </div>
                              <div style={{fontSize:11.5,color:txm,marginTop:2}}>
                                ₹{s.price}{s.duration?` · ${s.duration} min`:""}
                                {s.description&&<span style={{color:txf}}> · {s.description}</span>}
                              </div>
                            </div>
                            <div style={{display:"flex",gap:6,flexShrink:0}}>
                              <button onClick={()=>{ setEditSvcId(s.id); setEditSvc({name:s.name,price:s.price,duration:s.duration||"",category:s.category||"",description:s.description||"",service_type:s.service_type||"time",is_active:s.is_active!==false}) }}
                                style={{padding:"4px 10px",borderRadius:7,background:ibg,border:`1px solid ${cbdr}`,color:txm,fontSize:11.5,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Edit</button>
                              <button onClick={()=>deleteService(s.id,s.name)}
                                style={{padding:"4px 10px",borderRadius:7,background:"rgba(251,113,133,0.08)",border:"1px solid rgba(251,113,133,0.2)",color:"#fb7185",fontSize:11.5,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Delete</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── WHATSAPP TAB ─── */}
              {!loading&&tab==="whatsapp"&&(
                <div>
                  <SectionHeader title="WhatsApp Connection" sub="Connect your WhatsApp Business number to activate the AI assistant"/>

                  <div className="card">
                    {waConn?(
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
                          <div style={{width:44,height:44,borderRadius:12,background:"#25d36622",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>💬</div>
                          <div>
                            <div style={{fontWeight:700,fontSize:14,color:tx}}>WhatsApp Connected ✅</div>
                            <div style={{fontSize:12,color:txm,marginTop:2}}>Phone Number ID: {waConn.phone_number_id}</div>
                            <div style={{fontSize:11,color:txf,marginTop:1}}>Connected {waConn.created_at?new Date(waConn.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):"recently"}</div>
                          </div>
                        </div>
                        <div style={{background:`${acc}08`,border:`1px solid ${acc}22`,borderRadius:9,padding:"12px 14px",marginBottom:14}}>
                          <div style={{fontSize:12.5,fontWeight:600,color:acc,marginBottom:4}}>✅ AI is active on your WhatsApp number</div>
                          <div style={{fontSize:11.5,color:txm,lineHeight:1.6}}>
                            Every incoming message is handled by Sarvam AI.<br/>
                            Webhook: <code style={{color:acc}}>https://fastrill.com/api/meta/webhook</code>
                          </div>
                        </div>
                        <button onClick={handleConnect}
                          style={{padding:"9px 18px",borderRadius:8,background:ibg,border:`1px solid ${cbdr}`,color:txm,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                          Reconnect WhatsApp
                        </button>
                      </div>
                    ):(
                      <div style={{textAlign:"center",padding:"24px 0"}}>
                        <div style={{fontSize:40,marginBottom:16}}>💬</div>
                        <div style={{fontWeight:700,fontSize:15,color:tx,marginBottom:6}}>Connect Your WhatsApp Business</div>
                        <div style={{fontSize:12.5,color:txm,marginBottom:24,maxWidth:400,margin:"0 auto 24px"}}>
                          Link your WhatsApp Business number to activate AI-powered customer service. Your AI will reply to customers automatically 24/7.
                        </div>
                        <button onClick={handleConnect}
                          style={{padding:"11px 28px",borderRadius:10,background:"#1877f2",border:"none",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                          Connect WhatsApp →
                        </button>
                        <div style={{fontSize:11.5,color:txf,marginTop:14}}>Uses Meta WhatsApp Business API · Your number stays yours</div>
                      </div>
                    )}
                  </div>

                  <div className="card">
                    <div style={{fontWeight:600,fontSize:13,color:tx,marginBottom:12}}>📡 Webhook Setup</div>
                    <div style={{fontSize:12,color:txm,marginBottom:10}}>If you need to reconfigure your Meta webhook:</div>
                    {[
                      ["Webhook URL","https://fastrill.com/api/meta/webhook"],
                      ["Verify Token","Use your WEBHOOK_VERIFY_TOKEN from .env"],
                      ["Subscribed Fields","messages"],
                    ].map(([label,val])=>(
                      <div key={label} style={{padding:"9px 12px",background:ibg,border:`1px solid ${cbdr}`,borderRadius:8,marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:12,color:txm,fontWeight:600}}>{label}</span>
                        <code style={{fontSize:11.5,color:acc}}>{val}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <nav className="bnav">
        {[
          {id:"overview",icon:"⬡",label:"Home",    path:"/dashboard"},
          {id:"inbox",   icon:"◎",label:"Chats",   path:"/dashboard/conversations"},
          {id:"bookings",icon:"◷",label:"Bookings",path:"/dashboard/bookings"},
          {id:"leads",   icon:"◉",label:"Leads",   path:"/dashboard/leads"},
          {id:"contacts",icon:"◑",label:"Customers",path:"/dashboard/contacts"},
        ].map(item=>(
          <button key={item.id} className={"bni"+(item.id==="settings"?" on":"")} onClick={()=>router.push(item.path)}>
            <span className="bnic">{item.icon}</span><span className="bnil">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
