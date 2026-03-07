"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const NAV = [
  { id:"overview", label:"Revenue Engine", icon:"◈", path:"/dashboard" },
  { id:"inbox", label:"Conversations", icon:"◎", path:"/dashboard/conversations" },
  { id:"bookings", label:"Bookings", icon:"◷", path:"/dashboard/bookings" },
  { id:"campaigns", label:"Campaigns", icon:"◆", path:"/dashboard/campaigns" },
  { id:"leads", label:"Lead Recovery", icon:"◉", path:"/dashboard/leads" },
  { id:"contacts", label:"Customers", icon:"◑", path:"/dashboard/contacts" },
  { id:"analytics", label:"Analytics", icon:"◫", path:"/dashboard/analytics" },
  { id:"settings", label:"Settings", icon:"◌", path:"/dashboard/settings" },
]

const SPECS = ["Hair Stylist","Dermatologist","Beautician","Makeup Artist","Nail Technician","Massage Therapist","Spa Therapist","General Doctor","Dentist","Physiotherapist","Other"]
const DURATIONS = [10,15,20,30,45,60,90,120]
const WEEK_DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
const LANGUAGES = ["English","Hindi","Telugu","Tamil","Kannada","Malayalam","Marathi"]
const BIZ_TYPES = ["Salon","Clinic","Spa","Dental","Physiotherapy","Skin Care","Other"]
const QUICK_RULES = ["Always ask customer's name before booking","Ask for preferred time slot","Send confirmation after booking","Offer alternatives if slot is full","Always greet with business name","Ask for service preference first"]

export default function SettingsPage() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [dark, setDark] = useState(true)
  const [tab, setTab] = useState("business")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [bizName, setBizName] = useState("Glamour Studio")
  const [bizType, setBizType] = useState("Salon")
  const [location, setLocation] = useState("")
  const [mapsLink, setMapsLink] = useState("")
  const [phone, setPhone] = useState("+91 93460 79265")
  const [description, setDescription] = useState("")

  const [services, setServices] = useState([
    {id:1,name:"Women's Haircut",price:"350",duration:"30",category:"Hair"},
    {id:2,name:"Men's Haircut",price:"200",duration:"20",category:"Hair"},
    {id:3,name:"Hair Colour",price:"1500",duration:"90",category:"Hair"},
    {id:4,name:"Facial",price:"600",duration:"60",category:"Skin"},
    {id:5,name:"Bridal Package",price:"8000",duration:"120",category:"Bridal"},
  ])

  const [staff, setStaff] = useState([
    {id:1,name:"Ananya",role:"Senior Stylist",spec:"Hair Stylist",slotDur:30,capacity:1,days:Object.fromEntries(WEEK_DAYS.map(d=>[d,{on:d!=="Sun",from:"09:00",to:"18:00"}]))},
    {id:2,name:"Riya",role:"Beautician",spec:"Beautician",slotDur:45,capacity:1,days:Object.fromEntries(WEEK_DAYS.map(d=>[d,{on:d!=="Wed"&&d!=="Sun",from:"09:00",to:"18:00"}]))},
  ])

  const [aiInstructions, setAiInstructions] = useState("")
  const [activeRules, setActiveRules] = useState([])
  const [faqs, setFaqs] = useState([
    {id:1,q:"What are your working hours?",a:"Mon-Sat 9AM–7PM, Sunday 10AM–5PM."},
    {id:2,q:"Do you offer home service?",a:"Currently in-salon services only."},
  ])
  const [bookingLink, setBookingLink] = useState("")
  const [language, setLanguage] = useState("English")

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) router.push("/login")
      else setUserEmail(data.user.email || "")
    }
    init()
  }, [])

  const toggleTheme = () => { const n = !dark; setDark(n); localStorage.setItem("fastrill-theme", n?"dark":"light") }
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login") }

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r=>setTimeout(r,900))
    setSaving(false); setSaved(true)
    setTimeout(()=>setSaved(false),2500)
  }

  const addSvc = () => setServices(p=>[...p,{id:Date.now(),name:"",price:"",duration:"30",category:""}])
  const rmSvc = (id) => setServices(p=>p.filter(s=>s.id!==id))
  const updSvc = (id,f,v) => setServices(p=>p.map(s=>s.id===id?{...s,[f]:v}:s))

  const addStaff = () => setStaff(p=>[...p,{id:Date.now(),name:"",role:"",spec:"Hair Stylist",slotDur:30,capacity:1,days:Object.fromEntries(WEEK_DAYS.map(d=>[d,{on:true,from:"09:00",to:"18:00"}]))}])
  const rmStaff = (id) => setStaff(p=>p.filter(s=>s.id!==id))
  const updStaff = (id,f,v) => setStaff(p=>p.map(s=>s.id===id?{...s,[f]:v}:s))
  const updDay = (sid,day,f,v) => setStaff(p=>p.map(s=>s.id===sid?{...s,days:{...s.days,[day]:{...s.days[day],[f]:v}}}:s))

  const addFaq = () => setFaqs(p=>[...p,{id:Date.now(),q:"",a:""}])
  const rmFaq = (id) => setFaqs(p=>p.filter(f=>f.id!==id))
  const updFaq = (id,f,v) => setFaqs(p=>p.map(x=>x.id===id?{...x,[f]:v}:x))
  const toggleRule = (r) => setActiveRules(p=>p.includes(r)?p.filter(x=>x!==r):[...p,r])

  const t = dark ? {
    bg:"#0a0a0f",sidebar:"#0f0f17",border:"rgba(255,255,255,0.06)",card:"#0f0f17",
    cardBorder:"rgba(255,255,255,0.07)",text:"#e8e8f0",textMuted:"rgba(255,255,255,0.4)",
    textFaint:"rgba(255,255,255,0.2)",navActive:"rgba(0,196,125,0.1)",
    navActiveBorder:"rgba(0,196,125,0.2)",navActiveText:"#00c47d",
    navText:"rgba(255,255,255,0.45)",inputBg:"rgba(255,255,255,0.04)",
    chipBg:"rgba(255,255,255,0.02)",chipBorder:"rgba(255,255,255,0.05)",
  } : {
    bg:"#f4f5f7",sidebar:"#ffffff",border:"rgba(0,0,0,0.07)",card:"#ffffff",
    cardBorder:"rgba(0,0,0,0.08)",text:"#111827",textMuted:"rgba(0,0,0,0.45)",
    textFaint:"rgba(0,0,0,0.25)",navActive:"rgba(0,180,115,0.08)",
    navActiveBorder:"rgba(0,180,115,0.2)",navActiveText:"#00935a",
    navText:"rgba(0,0,0,0.45)",inputBg:"rgba(0,0,0,0.03)",
    chipBg:"rgba(0,0,0,0.02)",chipBorder:"rgba(0,0,0,0.05)",
  }
  const accent = dark ? "#00c47d" : "#00935a"
  const userInitial = userEmail ? userEmail[0].toUpperCase() : "G"

  const inp = {background:t.inputBg,border:`1px solid ${t.cardBorder}`,borderRadius:9,padding:"9px 12px",fontSize:13,color:t.text,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none",width:"100%"}
  const sinp = {background:t.inputBg,border:`1px solid ${t.cardBorder}`,borderRadius:7,padding:"7px 10px",fontSize:12.5,color:t.text,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none",width:"100%"}

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${t.bg}!important;color:${t.text}!important;font-family:'Plus Jakarta Sans',sans-serif!important;}
        .root{display:flex;height:100vh;overflow:hidden;background:${t.bg};}
        .sidebar{width:224px;flex-shrink:0;background:${t.sidebar};border-right:1px solid ${t.border};display:flex;flex-direction:column;overflow-y:auto;}
        .logo{padding:22px 20px 18px;font-weight:800;font-size:20px;color:${t.text};text-decoration:none;display:block;border-bottom:1px solid ${t.border};font-family:'Plus Jakarta Sans',sans-serif;}
        .logo span{color:${accent};}
        .nav-section{padding:18px 16px 7px;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${t.textFaint};font-weight:600;}
        .nav-item{display:flex;align-items:center;gap:9px;padding:9px 12px;margin:1px 8px;border-radius:8px;cursor:pointer;font-size:13.5px;color:${t.navText};font-weight:500;transition:all 0.13s;border:1px solid transparent;background:none;width:calc(100% - 16px);text-align:left;font-family:'Plus Jakarta Sans',sans-serif;}
        .nav-item:hover{background:${t.inputBg};color:${t.text};}
        .nav-item.active{background:${t.navActive};color:${t.navActiveText};font-weight:600;border-color:${t.navActiveBorder};}
        .nav-icon{font-size:13px;width:18px;text-align:center;flex-shrink:0;}
        .sidebar-footer{margin-top:auto;padding:14px;border-top:1px solid ${t.border};}
        .user-card{display:flex;align-items:center;gap:9px;padding:9px;border-radius:9px;background:${t.inputBg};border:1px solid ${t.cardBorder};}
        .user-avatar{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,${accent},#0ea5e9);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#fff;flex-shrink:0;}
        .user-email{font-size:11.5px;color:${t.textMuted};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .logout-btn{margin-top:7px;width:100%;padding:7px;border-radius:7px;background:transparent;border:1px solid ${t.cardBorder};font-size:12px;color:${t.textMuted};cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.12s;}
        .logout-btn:hover{border-color:#fca5a5;color:#ef4444;}
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .topbar{height:54px;flex-shrink:0;border-bottom:1px solid ${t.border};display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:${t.sidebar};}
        .topbar-title{font-weight:700;font-size:15px;color:${t.text};}
        .topbar-right{display:flex;align-items:center;gap:10px;}
        .theme-btn{display:flex;align-items:center;gap:7px;padding:5px 11px;border-radius:8px;background:${t.inputBg};border:1px solid ${t.cardBorder};cursor:pointer;font-size:12px;color:${t.textMuted};font-family:'Plus Jakarta Sans',sans-serif;font-weight:500;}
        .pill{width:32px;height:18px;border-radius:100px;background:${dark?accent:"#d1d5db"};position:relative;transition:background 0.2s;flex-shrink:0;}
        .pill::after{content:'';position:absolute;top:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:left 0.2s;left:${dark?"16px":"2px"};}
        .s-root{display:flex;flex-direction:column;flex:1;overflow:hidden;}
        .tabs{display:flex;gap:4px;padding:14px 20px 0;border-bottom:1px solid ${t.border};background:${t.sidebar};flex-shrink:0;}
        .stab{display:flex;align-items:center;gap:7px;padding:9px 16px;border-radius:9px 9px 0 0;font-size:13px;font-weight:600;cursor:pointer;border:1px solid transparent;border-bottom:none;background:transparent;color:${t.textMuted};transition:all 0.13s;font-family:'Plus Jakarta Sans',sans-serif;}
        .stab:hover{color:${t.text};background:${t.inputBg};}
        .stab.active{background:${t.bg};color:${t.text};border-color:${t.border};border-bottom-color:${t.bg};}
        .sbody{flex:1;overflow-y:auto;padding:24px;}
        .sbody::-webkit-scrollbar{width:3px;}
        .sbody::-webkit-scrollbar-thumb{background:${t.border};}
        .scard{background:${t.card};border:1px solid ${t.cardBorder};border-radius:13px;padding:20px;margin-bottom:16px;}
        .sc-title{font-weight:700;font-size:13.5px;color:${t.text};margin-bottom:4px;}
        .sc-sub{font-size:12px;color:${t.textMuted};margin-bottom:18px;}
        .fgrid{display:grid;grid-template-columns:1fr 1fr;gap:13px;}
        .fgrid.full{grid-column:1/-1;}
        .flabel{font-size:11.5px;font-weight:600;color:${t.textMuted};margin-bottom:5px;display:block;}
        .svc-hdr{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 32px;gap:9px;padding:0 0 6px;}
        .svc-hl{font-size:10.5px;color:${t.textFaint};font-weight:600;text-transform:uppercase;letter-spacing:1px;}
        .svc-row{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 32px;gap:9px;align-items:center;padding:8px 0;border-bottom:1px solid ${t.border};}
        .rm-btn{width:28px;height:28px;border-radius:7px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.15);color:#ef4444;cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .add-btn{display:flex;align-items:center;gap:7px;padding:8px 14px;border-radius:9px;background:${accent}10;border:1px dashed ${accent}33;color:${accent};font-size:12.5px;font-weight:600;cursor:pointer;transition:all 0.13s;font-family:'Plus Jakarta Sans',sans-serif;margin-top:10px;}
        .staff-card{background:${t.chipBg};border:1px solid ${t.chipBorder};border-radius:11px;padding:16px;margin-bottom:12px;}
        .sc-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
        .sc-name{font-weight:700;font-size:14px;color:${t.text};}
        .days-row{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px;}
        .day-pill{display:flex;flex-direction:column;align-items:center;gap:4px;}
        .day-tog{width:36px;height:36px;border-radius:9px;border:1px solid ${t.cardBorder};background:${t.inputBg};color:${t.textMuted};cursor:pointer;font-size:11.5px;font-weight:600;transition:all 0.13s;font-family:'Plus Jakarta Sans',sans-serif;}
        .day-tog.on{background:${accent}15;border-color:${accent}33;color:${accent};}
        .day-hrs{display:flex;align-items:center;gap:4px;}
        .tinput{background:${t.inputBg};border:1px solid ${t.cardBorder};border-radius:6px;padding:4px 7px;font-size:11px;color:${t.text};font-family:'Plus Jakarta Sans',sans-serif;outline:none;width:68px;}
        .cap-row2{display:flex;align-items:center;gap:8px;margin-top:10px;}
        .cap-lbl{font-size:12px;color:${t.textMuted};font-weight:500;}
        .stepper{display:flex;align-items:center;border:1px solid ${t.cardBorder};border-radius:8px;overflow:hidden;}
        .step-btn{width:30px;height:30px;background:${t.inputBg};border:none;color:${t.text};cursor:pointer;font-size:16px;font-weight:700;}
        .step-btn:hover{background:${accent}18;color:${accent};}
        .step-num{width:36px;text-align:center;font-weight:700;font-size:14px;color:${t.text};background:${t.chipBg};}
        .rules-wrap{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;}
        .rule-tag{display:inline-flex;align-items:center;gap:6px;padding:6px 13px;border-radius:100px;font-size:12px;font-weight:500;cursor:pointer;transition:all 0.13s;border:1px solid ${t.cardBorder};background:${t.inputBg};color:${t.textMuted};font-family:'Plus Jakarta Sans',sans-serif;}
        .rule-tag.active{background:${accent}12;border-color:${accent}30;color:${accent};}
        .faq-row{display:grid;grid-template-columns:1fr 1fr 32px;gap:9px;align-items:start;margin-bottom:9px;}
        .lang-wrap{display:flex;flex-wrap:wrap;gap:7px;}
        .lang-btn{padding:6px 14px;border-radius:8px;font-size:12.5px;font-weight:600;cursor:pointer;border:1px solid ${t.cardBorder};background:${t.inputBg};color:${t.textMuted};transition:all 0.13s;font-family:'Plus Jakarta Sans',sans-serif;}
        .lang-btn.active{background:${accent}12;border-color:${accent}30;color:${accent};}
        .save-bar{padding:14px 20px;border-top:1px solid ${t.border};background:${t.sidebar};display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-shrink:0;}
        .save-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 24px;border-radius:10px;background:${accent};border:none;color:#000;font-weight:700;font-size:13px;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.15s;}
        .save-btn:disabled{opacity:0.6;cursor:not-allowed;}
        .saved-msg{font-size:12.5px;color:${accent};font-weight:600;}
        @media(max-width:768px){.sidebar{display:none;}}
      `}</style>

      <div className="root">
        <aside className="sidebar">
          <a href="/dashboard" className="logo">fast<span>rill</span></a>
          <div className="nav-section">Platform</div>
          {NAV.map(item => (
            <button key={item.id} className={`nav-item${item.id==="settings"?" active":""}`} onClick={() => router.push(item.path)}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
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
            <div className="topbar-title">Settings</div>
            <div className="topbar-right">
              <button className="theme-btn" onClick={toggleTheme}>
                <span>{dark?"🌙":"☀️"}</span><div className="pill"/><span>{dark?"Dark":"Light"}</span>
              </button>
            </div>
          </div>

          <div className="s-root">
            <div className="tabs">
              {[{id:"business",label:"Business Info",icon:"🏪"},{id:"services",label:"Services & Pricing",icon:"💈"},{id:"booking",label:"Booking Setup",icon:"📅"},{id:"ai",label:"AI Instructions",icon:"◈"}].map(x => (
                <button key={x.id} className={`stab${tab===x.id?" active":""}`} onClick={()=>setTab(x.id)}>
                  <span>{x.icon}</span>{x.label}
                </button>
              ))}
            </div>

            <div className="sbody">
              {tab==="business" && (
                <div className="scard">
                  <div className="sc-title">Business Information</div>
                  <div className="sc-sub">This info helps the AI understand your business context</div>
                  <div className="fgrid">
                    <div><label className="flabel">Business Name</label><input style={inp} value={bizName} onChange={e=>setBizName(e.target.value)} placeholder="e.g. Glamour Studio"/></div>
                    <div><label className="flabel">Business Type</label><select style={inp} value={bizType} onChange={e=>setBizType(e.target.value)}>{BIZ_TYPES.map(x=><option key={x}>{x}</option>)}</select></div>
                    <div><label className="flabel">Phone Number</label><input style={inp} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX"/></div>
                    <div><label className="flabel">Location / Area</label><input style={inp} value={location} onChange={e=>setLocation(e.target.value)} placeholder="e.g. Bandra West, Mumbai"/></div>
                    <div style={{gridColumn:"1/-1"}}><label className="flabel">Google Maps Link</label><input style={inp} value={mapsLink} onChange={e=>setMapsLink(e.target.value)} placeholder="https://maps.google.com/..."/></div>
                    <div style={{gridColumn:"1/-1"}}><label className="flabel">Business Description (for AI context)</label><textarea style={{...inp,resize:"vertical",minHeight:80}} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe your business, specialties, target customers..."/></div>
                  </div>
                </div>
              )}

              {tab==="services" && (
                <div className="scard">
                  <div className="sc-title">Services & Pricing</div>
                  <div className="sc-sub">AI uses this to answer pricing questions and suggest bookings</div>
                  <div className="svc-hdr">{["Service Name","Price (₹)","Duration","Category",""].map(h=><div key={h} className="svc-hl">{h}</div>)}</div>
                  {services.map(s => (
                    <div key={s.id} className="svc-row">
                      <input style={sinp} value={s.name} onChange={e=>updSvc(s.id,"name",e.target.value)} placeholder="e.g. Women's Haircut"/>
                      <input style={sinp} value={s.price} onChange={e=>updSvc(s.id,"price",e.target.value)} placeholder="350" type="number"/>
                      <select style={sinp} value={s.duration} onChange={e=>updSvc(s.id,"duration",e.target.value)}>{DURATIONS.map(d=><option key={d} value={d}>{d} min</option>)}</select>
                      <input style={sinp} value={s.category} onChange={e=>updSvc(s.id,"category",e.target.value)} placeholder="Hair, Skin..."/>
                      <button className="rm-btn" onClick={()=>rmSvc(s.id)}>×</button>
                    </div>
                  ))}
                  <button className="add-btn" onClick={addSvc}>+ Add Service</button>
                </div>
              )}

              {tab==="booking" && (
                <div className="scard">
                  <div className="sc-title">Staff & Specialists</div>
                  <div className="sc-sub">Each staff member has their own schedule, slot duration, and capacity</div>
                  {staff.map(s => (
                    <div key={s.id} className="staff-card">
                      <div className="sc-hdr"><div className="sc-name">{s.name||"New Staff Member"}</div><button className="rm-btn" onClick={()=>rmStaff(s.id)}>×</button></div>
                      <div className="fgrid">
                        <div><label className="flabel">Name</label><input style={inp} value={s.name} onChange={e=>updStaff(s.id,"name",e.target.value)} placeholder="Staff name"/></div>
                        <div><label className="flabel">Role / Title</label><input style={inp} value={s.role} onChange={e=>updStaff(s.id,"role",e.target.value)} placeholder="e.g. Senior Stylist"/></div>
                        <div><label className="flabel">Specialization</label><select style={inp} value={s.spec} onChange={e=>updStaff(s.id,"spec",e.target.value)}>{SPECS.map(x=><option key={x}>{x}</option>)}</select></div>
                        <div><label className="flabel">Slot Duration</label><select style={inp} value={s.slotDur} onChange={e=>updStaff(s.id,"slotDur",parseInt(e.target.value))}>{DURATIONS.map(d=><option key={d} value={d}>{d} minutes</option>)}</select></div>
                      </div>
                      <div className="cap-row2">
                        <span className="cap-lbl">Simultaneous clients:</span>
                        <div className="stepper">
                          <button className="step-btn" onClick={()=>updStaff(s.id,"capacity",Math.max(1,s.capacity-1))}>−</button>
                          <span className="step-num">{s.capacity}</span>
                          <button className="step-btn" onClick={()=>updStaff(s.id,"capacity",Math.min(20,s.capacity+1))}>+</button>
                        </div>
                        <span style={{fontSize:11,color:t.textFaint}}>(e.g. 3 chairs = capacity 3)</span>
                      </div>
                      <div style={{marginTop:14}}>
                        <div style={{fontSize:11.5,color:t.textMuted,fontWeight:600,marginBottom:8}}>Working Hours</div>
                        <div className="days-row">
                          {WEEK_DAYS.map(day => (
                            <div key={day} className="day-pill">
                              <button className={`day-tog${s.days[day].on?" on":""}`} onClick={()=>updDay(s.id,day,"on",!s.days[day].on)}>{day}</button>
                              {s.days[day].on && (
                                <div className="day-hrs">
                                  <input type="time" className="tinput" value={s.days[day].from} onChange={e=>updDay(s.id,day,"from",e.target.value)}/>
                                  <span style={{fontSize:10,color:t.textFaint}}>–</span>
                                  <input type="time" className="tinput" value={s.days[day].to} onChange={e=>updDay(s.id,day,"to",e.target.value)}/>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="add-btn" onClick={addStaff}>+ Add Staff Member</button>
                </div>
              )}

              {tab==="ai" && (
                <>
                  <div className="scard">
                    <div className="sc-title">Quick AI Rules</div>
                    <div className="sc-sub">Click to toggle — AI will follow these in every conversation</div>
                    <div className="rules-wrap">
                      {QUICK_RULES.map(r => (
                        <button key={r} className={`rule-tag${activeRules.includes(r)?" active":""}`} onClick={()=>toggleRule(r)}>
                          {activeRules.includes(r)?"✓ ":"+ "}{r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="scard">
                    <div className="sc-title">Custom AI Instructions</div>
                    <div className="sc-sub">Give the AI specific instructions for your business</div>
                    <textarea style={{...inp,resize:"vertical",minHeight:100}} value={aiInstructions} onChange={e=>setAiInstructions(e.target.value)} placeholder="e.g. Always mention our loyalty program. Don't discuss competitor pricing..."/>
                  </div>
                  <div className="scard">
                    <div className="sc-title">FAQ Builder</div>
                    <div className="sc-sub">AI will use these answers for common questions</div>
                    {faqs.map(f => (
                      <div key={f.id} className="faq-row">
                        <input style={sinp} value={f.q} onChange={e=>updFaq(f.id,"q",e.target.value)} placeholder="Question..."/>
                        <input style={sinp} value={f.a} onChange={e=>updFaq(f.id,"a",e.target.value)} placeholder="Answer..."/>
                        <button className="rm-btn" onClick={()=>rmFaq(f.id)}>×</button>
                      </div>
                    ))}
                    <button className="add-btn" onClick={addFaq}>+ Add FAQ</button>
                  </div>
                  <div className="scard">
                    <div className="sc-title">AI Reply Language</div>
                    <div className="sc-sub">AI will respond in the selected language</div>
                    <div className="lang-wrap">
                      {LANGUAGES.map(l => <button key={l} className={`lang-btn${language===l?" active":""}`} onClick={()=>setLanguage(l)}>{l}</button>)}
                    </div>
                  </div>
                  <div className="scard">
                    <div className="sc-title">External Booking Link</div>
                    <div className="sc-sub">Optional — AI will share this if in-chat booking isn't set up</div>
                    <input style={inp} value={bookingLink} onChange={e=>setBookingLink(e.target.value)} placeholder="https://calendly.com/yourbusiness"/>
                  </div>
                </>
              )}
            </div>

            <div className="save-bar">
              {saved && <span className="saved-msg">✓ Changes saved successfully</span>}
              <button className="save-btn" onClick={handleSave} disabled={saving}>{saving?"Saving...":"Save Changes"}</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
