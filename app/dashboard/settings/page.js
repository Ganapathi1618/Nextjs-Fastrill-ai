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

const DEFAULT_SERVICES = [
  { name:"Haircut", price:"300", duration:"30", category:"Hair" },
  { name:"Hair Colour", price:"800", duration:"90", category:"Hair" },
  { name:"Gold Facial", price:"1500", duration:"60", category:"Skin" },
  { name:"Bridal Package", price:"8500", duration:"120", category:"Bridal" },
  { name:"Nail Art", price:"600", duration:"45", category:"Nails" },
]

const LANGUAGES = ["English","Hindi","Telugu","Tamil","Kannada","Malayalam","Marathi"]

export default function Settings() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [dark, setDark] = useState(true)
  const [tab, setTab] = useState("business")
  const [saved, setSaved] = useState(false)

  const [business, setBusiness] = useState({
    name:"", type:"Salon", phone:"", location:"", mapsLink:"", description:""
  })
  const [services, setServices] = useState(DEFAULT_SERVICES)
  const [booking, setBooking] = useState({
    slotDuration: 30,
    capacity: 2,
    staff: [
      { name:"Ananya", days: {Mon:true,Tue:true,Wed:true,Thu:true,Fri:true,Sat:true,Sun:false}, start:"09:00", end:"19:00" },
      { name:"Riya", days: {Mon:true,Tue:true,Wed:true,Thu:true,Fri:true,Sat:false,Sun:false}, start:"10:00", end:"18:00" },
    ]
  })
  const [ai, setAI] = useState({
    language: "English",
    customInstructions: "",
    bookingLink: "",
    rules: { greetNewLeads:true, autoBookAppointments:true, sendReminders:true, collectFeedback:false, handleCancellations:true, upsellServices:false },
    faqs: [
      { q:"What are your working hours?", a:"We are open Monday to Saturday, 9 AM to 7 PM." },
      { q:"Do you take walk-ins?", a:"Yes, subject to availability. Appointments are preferred." },
    ]
  })

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login")
      else setUserEmail(data.user.email || "")
    })
  }, [])

  const toggleTheme = () => {
    const n = !dark; setDark(n)
    localStorage.setItem("fastrill-theme", n ? "dark" : "light")
  }
  const handleLogout = async () => {
    await supabase.auth.signOut(); router.push("/login")
  }
  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const bg = dark ? "#08080e" : "#f0f2f5"
  const sidebar = dark ? "#0c0c15" : "#ffffff"
  const card = dark ? "#0f0f1a" : "#ffffff"
  const border = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"
  const cardBorder = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)"
  const text = dark ? "#eeeef5" : "#111827"
  const textMuted = dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)"
  const textFaint = dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)"
  const inputBg = dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"
  const accent = dark ? "#00d084" : "#00935a"
  const accentDim = dark ? "rgba(0,208,132,0.12)" : "rgba(0,147,90,0.1)"
  const userInitial = userEmail ? userEmail[0].toUpperCase() : "G"

  const inp = {
    background: inputBg, border:`1px solid ${cardBorder}`, borderRadius:8,
    padding:"9px 12px", fontSize:13, color:text,
    fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none", width:"100%",
    transition:"border-color 0.12s"
  }

  const TABS = [
    { id:"business", label:"Business Info", icon:"🏢" },
    { id:"services", label:"Services & Pricing", icon:"✂️" },
    { id:"booking", label:"Booking Setup", icon:"📅" },
    { id:"ai", label:"AI Instructions", icon:"◈" },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: ${bg} !important; color: ${text} !important; font-family: 'Plus Jakarta Sans', sans-serif !important; }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: ${border}; border-radius: 10px; }
        .wrap { display: flex; height: 100vh; overflow: hidden; }
        .sb { width: 224px; flex-shrink: 0; background: ${sidebar}; border-right: 1px solid ${border}; display: flex; flex-direction: column; overflow-y: auto; }
        .sb-logo { padding: 22px 20px 18px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 20px; color: ${text}; border-bottom: 1px solid ${border}; display: block; text-decoration: none; }
        .sb-logo span { color: ${accent}; }
        .sb-section { padding: 18px 16px 6px; font-size: 10px; letter-spacing: 1.4px; text-transform: uppercase; color: ${textFaint}; font-weight: 600; }
        .sb-nav { padding: 3px 8px; }
        .nav-btn { display: flex; align-items: center; gap: 9px; width: 100%; padding: 9px 12px; border-radius: 8px; margin: 1px 8px; width: calc(100% - 16px); border: 1px solid transparent; background: transparent; color: ${textMuted}; font-size: 13.5px; font-weight: 500; cursor: pointer; text-align: left; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.12s; margin-bottom: 1px; }
        .nav-btn:hover { background: ${inputBg}; color: ${text}; }
        .nav-btn.active { background: ${accentDim}; border-color: ${accent}33; color: ${accent}; font-weight: 600; }
        .nav-icon { font-size: 12px; width: 16px; text-align: center; flex-shrink: 0; }
        .sb-foot { margin-top: auto; padding: 12px; border-top: 1px solid ${border}; }
        .user-row { display: flex; align-items: center; gap: 8px; padding: 8px 9px; background: ${inputBg}; border: 1px solid ${cardBorder}; border-radius: 9px; margin-bottom: 8px; }
        .user-av { width: 28px; height: 28px; border-radius: 7px; background: linear-gradient(135deg, ${accent}, #38bdf8); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; color: #fff; flex-shrink: 0; }
        .user-em { font-size: 11px; color: ${textMuted}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .logout { width: 100%; padding: 7px; background: transparent; border: 1px solid ${cardBorder}; border-radius: 7px; font-size: 11.5px; color: ${textMuted}; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.12s; }
        .logout:hover { border-color: #fca5a5; color: #ef4444; }
        .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
        .topbar { height: 54px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; background: ${sidebar}; border-bottom: 1px solid ${border}; }
        .tb-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 15px; color: ${text}; }
        .topbar-r { display: flex; align-items: center; gap: 8px; }
        .theme-toggle { display: flex; align-items: center; gap: 6px; padding: 5px 10px; background: ${inputBg}; border: 1px solid ${cardBorder}; border-radius: 8px; cursor: pointer; font-size: 11.5px; color: ${textMuted}; font-family: 'Plus Jakarta Sans', sans-serif; }
        .toggle-pill { width: 30px; height: 16px; border-radius: 100px; background: ${dark?accent:"#d1d5db"}; position: relative; flex-shrink: 0; transition: background 0.2s; }
        .toggle-pill::after { content:''; position:absolute; top:2px; width:12px; height:12px; border-radius:50%; background:#fff; transition:left 0.2s; left:${dark?"16px":"2px"}; }

        .settings-body { flex: 1; display: flex; overflow: hidden; }
        .tabs-sidebar { width: 200px; flex-shrink: 0; border-right: 1px solid ${border}; padding: 16px 8px; background: ${sidebar}; }
        .tab-btn { display: flex; align-items: center; gap: 9px; width: 100%; padding: 9px 11px; border-radius: 8px; margin: 1px 8px; width: calc(100% - 16px); border: 1px solid transparent; background: transparent; color: ${textMuted}; font-size: 13px; font-weight: 500; cursor: pointer; text-align: left; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.12s; margin-bottom: 2px; }
        .tab-btn:hover { background: ${inputBg}; color: ${text}; }
        .tab-btn.active { background: ${accentDim}; border-color: ${accent}33; color: ${accent}; font-weight: 600; }
        .tab-icon { font-size: 14px; }
        .content { flex: 1; overflow-y: auto; padding: 20px 24px; background: ${bg}; }
        .section { background: ${card}; border: 1px solid ${cardBorder}; border-radius: 13px; padding: 20px; margin-bottom: 14px; }
        .section-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 14px; color: ${text}; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid ${border}; }
        .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .field { display: flex; flex-direction: column; gap: 5px; }
        .field.full { grid-column: 1/-1; }
        .label { font-size: 11.5px; font-weight: 600; color: ${textMuted}; }
        .inp { background: ${inputBg}; border: 1px solid ${cardBorder}; border-radius: 8px; padding: 9px 12px; font-size: 13px; color: ${text}; font-family: 'Plus Jakarta Sans', sans-serif; outline: none; width: 100%; }
        .inp:focus { border-color: ${accent}66; }
        .inp-select { appearance: none; cursor: pointer; }
        .textarea { resize: vertical; min-height: 80px; }

        .svc-table { width: 100%; border-collapse: collapse; }
        .svc-th { font-size: 10.5px; font-weight: 700; color: ${textFaint}; letter-spacing: 0.8px; text-transform: uppercase; padding: 0 8px 8px; text-align: left; border-bottom: 1px solid ${border}; }
        .svc-td { padding: 7px 8px; border-bottom: 1px solid ${border}; }
        .svc-inp { background: ${inputBg}; border: 1px solid transparent; border-radius: 6px; padding: 5px 9px; font-size: 12.5px; color: ${text}; font-family: 'Plus Jakarta Sans', sans-serif; outline: none; width: 100%; }
        .svc-inp:focus { border-color: ${accent}55; }
        .del-btn { background: transparent; border: none; color: ${textFaint}; cursor: pointer; font-size: 15px; padding: 2px 6px; border-radius: 5px; transition: color 0.12s; }
        .del-btn:hover { color: #fb7185; }
        .add-btn { display: flex; align-items: center; gap: 6px; background: ${inputBg}; border: 1px dashed ${cardBorder}; border-radius: 8px; padding: 8px 14px; font-size: 12.5px; color: ${textMuted}; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; margin-top: 10px; transition: all 0.12s; }
        .add-btn:hover { border-color: ${accent}55; color: ${accent}; }

        .staff-card { background: ${inputBg}; border: 1px solid ${cardBorder}; border-radius: 10px; padding: 14px; margin-bottom: 10px; }
        .staff-name { font-weight: 700; font-size: 13px; color: ${text}; margin-bottom: 10px; }
        .days-row { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 10px; }
        .day-toggle { width: 32px; height: 32px; border-radius: 8px; border: 1px solid ${cardBorder}; background: transparent; color: ${textFaint}; font-size: 10.5px; font-weight: 700; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.12s; }
        .day-toggle.on { background: ${accentDim}; border-color: ${accent}44; color: ${accent}; }
        .hours-row { display: flex; align-items: center; gap: 10px; font-size: 12px; color: ${textMuted}; }

        .stepper { display: flex; align-items: center; gap: 10px; }
        .step-btn { width: 30px; height: 30px; border-radius: 8px; background: ${inputBg}; border: 1px solid ${cardBorder}; color: ${text}; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.12s; }
        .step-btn:hover { border-color: ${accent}55; color: ${accent}; }
        .step-val { font-weight: 700; font-size: 16px; color: ${text}; min-width: 20px; text-align: center; }

        .rules-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
        .rule-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 13px; background: ${inputBg}; border: 1px solid ${cardBorder}; border-radius: 9px; }
        .rule-label { font-size: 12.5px; color: ${text}; font-weight: 500; }
        .rule-toggle { width: 34px; height: 18px; border-radius: 100px; position: relative; cursor: pointer; transition: background 0.2s; border: none; flex-shrink: 0; }
        .rule-toggle::after { content:''; position:absolute; top:2px; width:14px; height:14px; border-radius:50%; background:#fff; transition:left 0.2s; }

        .faq-item { background: ${inputBg}; border: 1px solid ${cardBorder}; border-radius: 10px; padding: 13px; margin-bottom: 9px; }
        .faq-row { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 7px; }
        .faq-row:last-child { margin-bottom: 0; }
        .faq-label { font-size: 10.5px; font-weight: 700; color: ${textFaint}; letter-spacing: 0.5px; text-transform: uppercase; width: 14px; padding-top: 10px; flex-shrink: 0; }

        .save-bar { position: sticky; bottom: 0; padding: 12px 24px; background: ${sidebar}; border-top: 1px solid ${border}; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
        .save-btn { background: ${accent}; color: #fff; border: none; padding: 9px 24px; border-radius: 9px; font-weight: 700; font-size: 13px; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: opacity 0.12s; }
        .save-btn:hover { opacity: 0.88; }
        .save-msg { font-size: 12.5px; color: ${accent}; font-weight: 600; display: flex; align-items: center; gap: 6px; }
      `}</style>

      <div className="wrap">
        <aside className="sb">
          <a href="/dashboard" className="sb-logo">fast<span>rill</span></a>
          <div className="sb-section">Platform</div>
          <div className="sb-nav">
            {NAV.map(item=>(
              <button key={item.id} className={`nav-btn${item.id==="settings"?" active":""}`} onClick={()=>router.push(item.path)}>
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          <div className="sb-foot">
            <div className="user-row">
              <div className="user-av">{userInitial}</div>
              <div className="user-em">{userEmail||"Loading..."}</div>
            </div>
            <button className="logout" onClick={handleLogout}>↩ Sign out</button>
          </div>
        </aside>

        <div className="main">
          <div className="topbar">
            <span className="tb-title">Settings</span>
            <div className="topbar-r">
              <button className="theme-toggle" onClick={toggleTheme}>
                <span>{dark?"🌙":"☀️"}</span>
                <div className="toggle-pill"/>
                <span>{dark?"Dark":"Light"}</span>
              </button>
            </div>
          </div>

          <div className="settings-body">
            <div className="tabs-sidebar">
              {TABS.map(t=>(
                <button key={t.id} className={`tab-btn${tab===t.id?" active":""}`} onClick={()=>setTab(t.id)}>
                  <span className="tab-icon">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div className="content">

                {tab==="business" && (
                  <div className="section">
                    <div className="section-title">Business Information</div>
                    <div className="field-grid">
                      <div className="field">
                        <div className="label">Business Name</div>
                        <input className="inp" placeholder="e.g. Glamour Studio" value={business.name} onChange={e=>setBusiness({...business,name:e.target.value})}/>
                      </div>
                      <div className="field">
                        <div className="label">Business Type</div>
                        <select className="inp inp-select" value={business.type} onChange={e=>setBusiness({...business,type:e.target.value})}>
                          {["Salon","Spa","Clinic","Beauty Parlour","Physiotherapy","Dental","Other"].map(t=><option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="field">
                        <div className="label">WhatsApp Number</div>
                        <input className="inp" placeholder="+91 98765 43210" value={business.phone} onChange={e=>setBusiness({...business,phone:e.target.value})}/>
                      </div>
                      <div className="field">
                        <div className="label">Location / Area</div>
                        <input className="inp" placeholder="e.g. Banjara Hills, Hyderabad" value={business.location} onChange={e=>setBusiness({...business,location:e.target.value})}/>
                      </div>
                      <div className="field full">
                        <div className="label">Google Maps Link</div>
                        <input className="inp" placeholder="https://maps.google.com/..." value={business.mapsLink} onChange={e=>setBusiness({...business,mapsLink:e.target.value})}/>
                      </div>
                      <div className="field full">
                        <div className="label">Business Description (for AI)</div>
                        <textarea className="inp textarea" placeholder="Describe your business, specialties, and what makes you unique..." value={business.description} onChange={e=>setBusiness({...business,description:e.target.value})}/>
                      </div>
                    </div>
                  </div>
                )}

                {tab==="services" && (
                  <div className="section">
                    <div className="section-title">Services & Pricing</div>
                    <table className="svc-table">
                      <thead>
                        <tr>
                          {["Service Name","Price (₹)","Duration (min)","Category",""].map(h=>(
                            <th key={h} className="svc-th">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {services.map((s,i)=>(
                          <tr key={i}>
                            <td className="svc-td"><input className="svc-inp" value={s.name} onChange={e=>{const ns=[...services];ns[i]={...ns[i],name:e.target.value};setServices(ns)}}/></td>
                            <td className="svc-td"><input className="svc-inp" type="number" value={s.price} onChange={e=>{const ns=[...services];ns[i]={...ns[i],price:e.target.value};setServices(ns)}}/></td>
                            <td className="svc-td"><input className="svc-inp" type="number" value={s.duration} onChange={e=>{const ns=[...services];ns[i]={...ns[i],duration:e.target.value};setServices(ns)}}/></td>
                            <td className="svc-td"><input className="svc-inp" value={s.category} onChange={e=>{const ns=[...services];ns[i]={...ns[i],category:e.target.value};setServices(ns)}}/></td>
                            <td className="svc-td"><button className="del-btn" onClick={()=>setServices(services.filter((_,j)=>j!==i))}>×</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button className="add-btn" onClick={()=>setServices([...services,{name:"",price:"",duration:"",category:""}])}>
                      + Add Service
                    </button>
                  </div>
                )}

                {tab==="booking" && (
                  <>
                    <div className="section">
                      <div className="section-title">Booking Configuration</div>
                      <div style={{display:"flex",gap:32,flexWrap:"wrap"}}>
                        <div>
                          <div className="label" style={{marginBottom:8}}>Slot Duration (minutes)</div>
                          <div className="stepper">
                            <button className="step-btn" onClick={()=>setBooking({...booking,slotDuration:Math.max(10,booking.slotDuration-5)})}>−</button>
                            <span className="step-val">{booking.slotDuration}</span>
                            <button className="step-btn" onClick={()=>setBooking({...booking,slotDuration:booking.slotDuration+5})}>+</button>
                          </div>
                        </div>
                        <div>
                          <div className="label" style={{marginBottom:8}}>Simultaneous Clients</div>
                          <div className="stepper">
                            <button className="step-btn" onClick={()=>setBooking({...booking,capacity:Math.max(1,booking.capacity-1)})}>−</button>
                            <span className="step-val">{booking.capacity}</span>
                            <button className="step-btn" onClick={()=>setBooking({...booking,capacity:booking.capacity+1})}>+</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="section">
                      <div className="section-title">Staff Schedule</div>
                      {booking.staff.map((s,si)=>(
                        <div key={si} className="staff-card">
                          <div className="staff-name">👤 {s.name}</div>
                          <div className="days-row">
                            {DAYS.map(d=>(
                              <button key={d} className={`day-toggle${s.days[d]?" on":""}`}
                                onClick={()=>{
                                  const ns=[...booking.staff]
                                  ns[si]={...ns[si],days:{...ns[si].days,[d]:!ns[si].days[d]}}
                                  setBooking({...booking,staff:ns})
                                }}>
                                {d}
                              </button>
                            ))}
                          </div>
                          <div className="hours-row">
                            <span>From</span>
                            <input className="inp" style={{width:90}} type="time" value={s.start}
                              onChange={e=>{const ns=[...booking.staff];ns[si]={...ns[si],start:e.target.value};setBooking({...booking,staff:ns})}}/>
                            <span>To</span>
                            <input className="inp" style={{width:90}} type="time" value={s.end}
                              onChange={e=>{const ns=[...booking.staff];ns[si]={...ns[si],end:e.target.value};setBooking({...booking,staff:ns})}}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {tab==="ai" && (
                  <>
                    <div className="section">
                      <div className="section-title">AI Quick Rules</div>
                      <div className="rules-grid">
                        {Object.entries(ai.rules).map(([key, val])=>(
                          <div key={key} className="rule-item">
                            <span className="rule-label">{key.replace(/([A-Z])/g," $1").replace(/^./,s=>s.toUpperCase())}</span>
                            <button className="rule-toggle" style={{background:val?accent:"rgba(255,255,255,0.1)"}}
                              onClick={()=>setAI({...ai,rules:{...ai.rules,[key]:!val}})}>
                              <span style={{position:"absolute",top:"2px",width:"14px",height:"14px",borderRadius:"50%",background:"#fff",transition:"left 0.2s",left:val?"18px":"2px",display:"block"}}/>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="section">
                      <div className="section-title">Custom AI Instructions</div>
                      <div className="field" style={{marginBottom:12}}>
                        <div className="label">Response Language</div>
                        <select className="inp inp-select" style={{width:200}} value={ai.language} onChange={e=>setAI({...ai,language:e.target.value})}>
                          {LANGUAGES.map(l=><option key={l}>{l}</option>)}
                        </select>
                      </div>
                      <div className="field" style={{marginBottom:12}}>
                        <div className="label">External Booking Link (optional)</div>
                        <input className="inp" placeholder="https://calendly.com/..." value={ai.bookingLink} onChange={e=>setAI({...ai,bookingLink:e.target.value})}/>
                      </div>
                      <div className="field">
                        <div className="label">Additional Instructions for AI</div>
                        <textarea className="inp textarea" style={{minHeight:100}} placeholder="e.g. Always greet with the customer's name. Never quote prices without checking availability first..." value={ai.customInstructions} onChange={e=>setAI({...ai,customInstructions:e.target.value})}/>
                      </div>
                    </div>

                    <div className="section">
                      <div className="section-title" style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <span>FAQ Builder</span>
                        <button className="add-btn" style={{margin:0,padding:"5px 12px",fontSize:12}} onClick={()=>setAI({...ai,faqs:[...ai.faqs,{q:"",a:""}]})}>
                          + Add FAQ
                        </button>
                      </div>
                      {ai.faqs.map((f,i)=>(
                        <div key={i} className="faq-item">
                          <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
                            <div style={{flex:1}}>
                              <div className="faq-row">
                                <span className="faq-label">Q</span>
                                <input className="inp" placeholder="Question" value={f.q} onChange={e=>{const nf=[...ai.faqs];nf[i]={...nf[i],q:e.target.value};setAI({...ai,faqs:nf})}}/>
                              </div>
                              <div className="faq-row">
                                <span className="faq-label">A</span>
                                <input className="inp" placeholder="Answer" value={f.a} onChange={e=>{const nf=[...ai.faqs];nf[i]={...nf[i],a:e.target.value};setAI({...ai,faqs:nf})}}/>
                              </div>
                            </div>
                            <button className="del-btn" onClick={()=>setAI({...ai,faqs:ai.faqs.filter((_,j)=>j!==i)})}>×</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="save-bar">
                {saved ? (
                  <span className="save-msg">✓ Settings saved successfully</span>
                ) : (
                  <span style={{fontSize:12,color:textFaint}}>Changes are not saved yet</span>
                )}
                <button className="save-btn" onClick={handleSave}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
