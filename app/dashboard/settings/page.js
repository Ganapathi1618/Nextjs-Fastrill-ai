"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"
import { useTheme } from "@/lib/ThemeContext"

const SPECIALIZATIONS = ["Hair Stylist","Dermatologist","Beautician","Makeup Artist","Nail Technician","Massage Therapist","Spa Therapist","General Doctor","Dentist","Physiotherapist","Other"]
const SLOT_DURATIONS = [10,15,20,30,45,60,90,120]
const DAYS_OF_WEEK = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
const LANGUAGES = ["English","Hindi","Telugu","Tamil","Kannada","Malayalam","Marathi"]
const BUSINESS_TYPES = ["Salon","Clinic","Spa","Dental","Physiotherapy","Skin Care","Other"]

const DEFAULT_STAFF = [
  { id:1, name:"Ananya", role:"Senior Stylist", specialization:"Hair Stylist", slotDuration:30, capacity:1, days:{ Mon:{on:true,from:"09:00",to:"18:00"}, Tue:{on:true,from:"09:00",to:"18:00"}, Wed:{on:true,from:"09:00",to:"18:00"}, Thu:{on:true,from:"09:00",to:"18:00"}, Fri:{on:true,from:"09:00",to:"18:00"}, Sat:{on:true,from:"10:00",to:"17:00"}, Sun:{on:false,from:"10:00",to:"17:00"} } },
  { id:2, name:"Riya", role:"Beautician", specialization:"Beautician", slotDuration:45, capacity:1, days:{ Mon:{on:true,from:"09:00",to:"18:00"}, Tue:{on:true,from:"09:00",to:"18:00"}, Wed:{on:false,from:"09:00",to:"18:00"}, Thu:{on:true,from:"09:00",to:"18:00"}, Fri:{on:true,from:"09:00",to:"18:00"}, Sat:{on:true,from:"10:00",to:"17:00"}, Sun:{on:false,from:"10:00",to:"17:00"} } },
]

const DEFAULT_SERVICES = [
  { id:1, name:"Women's Haircut", price:"350", duration:"30", category:"Hair" },
  { id:2, name:"Men's Haircut", price:"200", duration:"20", category:"Hair" },
  { id:3, name:"Hair Colour", price:"1500", duration:"90", category:"Hair" },
  { id:4, name:"Facial", price:"600", duration:"60", category:"Skin" },
  { id:5, name:"Bridal Package", price:"8000", duration:"120", category:"Bridal" },
]

const DEFAULT_FAQS = [
  { id:1, q:"What are your working hours?", a:"We're open Monday to Saturday 9AM–7PM, Sunday 10AM–5PM." },
  { id:2, q:"Do you offer home service?", a:"Currently we only offer in-salon services." },
]

const QUICK_RULES = [
  "Always ask customer's name before booking",
  "Ask for preferred time slot",
  "Send confirmation after booking",
  "Offer alternatives if slot is full",
  "Always greet with business name",
  "Ask for service preference first",
]

export default function SettingsPage() {
  const router = useRouter()
  const { t, accent, darkMode } = useTheme()
  const [activeTab, setActiveTab] = useState("business")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Business Info
  const [businessName, setBusinessName] = useState("Glamour Studio")
  const [businessType, setBusinessType] = useState("Salon")
  const [location, setLocation] = useState("")
  const [mapsLink, setMapsLink] = useState("")
  const [phone, setPhone] = useState("+91 93460 79265")
  const [description, setDescription] = useState("")

  // Services
  const [services, setServices] = useState(DEFAULT_SERVICES)

  // Staff
  const [staff, setStaff] = useState(DEFAULT_STAFF)

  // AI
  const [aiInstructions, setAiInstructions] = useState("")
  const [activeRules, setActiveRules] = useState([])
  const [faqs, setFaqs] = useState(DEFAULT_FAQS)
  const [bookingLink, setBookingLink] = useState("")
  const [language, setLanguage] = useState("English")

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) router.push("/login")
    }
    init()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 900))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // Services helpers
  const addService = () => setServices(p => [...p, { id: Date.now(), name:"", price:"", duration:"30", category:"" }])
  const removeService = (id) => setServices(p => p.filter(s => s.id !== id))
  const updateService = (id, field, val) => setServices(p => p.map(s => s.id===id ? {...s,[field]:val} : s))

  // Staff helpers
  const addStaff = () => setStaff(p => [...p, {
    id: Date.now(), name:"", role:"", specialization:"Hair Stylist", slotDuration:30, capacity:1,
    days: Object.fromEntries(DAYS_OF_WEEK.map(d => [d, {on:true,from:"09:00",to:"18:00"}]))
  }])
  const removeStaff = (id) => setStaff(p => p.filter(s => s.id !== id))
  const updateStaff = (id, field, val) => setStaff(p => p.map(s => s.id===id ? {...s,[field]:val} : s))
  const updateStaffDay = (sid, day, field, val) => setStaff(p => p.map(s => s.id===sid ? {...s, days:{...s.days,[day]:{...s.days[day],[field]:val}}} : s))

  // FAQ helpers
  const addFaq = () => setFaqs(p => [...p, { id: Date.now(), q:"", a:"" }])
  const removeFaq = (id) => setFaqs(p => p.filter(f => f.id !== id))
  const updateFaq = (id, field, val) => setFaqs(p => p.map(f => f.id===id ? {...f,[field]:val} : f))

  const toggleRule = (rule) => setActiveRules(p => p.includes(rule) ? p.filter(r => r!==rule) : [...p, rule])

  const TABS = [
    { id:"business", label:"Business Info", icon:"🏪" },
    { id:"services", label:"Services & Pricing", icon:"💈" },
    { id:"booking", label:"Booking Setup", icon:"📅" },
    { id:"ai", label:"AI Instructions", icon:"◈" },
  ]

  return (
    <DashboardLayout
      activePage="settings"
      topbar={<span style={{fontWeight:700, fontSize:15, color:t.text}}>Settings</span>}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .settings-root { display:flex; flex-direction:column; flex:1; overflow:hidden; height:calc(100vh - 54px); font-family:'Plus Jakarta Sans',sans-serif; }
        .settings-tabs { display:flex; gap:4px; padding:14px 20px 0; border-bottom:1px solid ${t.border}; background:${t.topbar}; flex-shrink:0; }
        .s-tab { display:flex; align-items:center; gap:7px; padding:9px 16px; border-radius:9px 9px 0 0; font-size:13px; font-weight:600; cursor:pointer; border:1px solid transparent; border-bottom:none; background:transparent; color:${t.textMuted}; transition:all 0.13s; font-family:'Plus Jakarta Sans',sans-serif; }
        .s-tab:hover { color:${t.text}; background:${t.inputBg}; }
        .s-tab.active { background:${t.bg}; color:${t.text}; border-color:${t.border}; border-bottom-color:${t.bg}; }
        .settings-body { flex:1; overflow-y:auto; padding:24px; }
        .settings-body::-webkit-scrollbar { width:3px; }
        .settings-body::-webkit-scrollbar-thumb { background:${t.border}; }

        /* SECTION */
        .section-card { background:${t.card}; border:1px solid ${t.cardBorder}; border-radius:13px; padding:20px; margin-bottom:16px; }
        .section-title { font-weight:700; font-size:13.5px; color:${t.text}; margin-bottom:4px; }
        .section-sub { font-size:12px; color:${t.textMuted}; margin-bottom:18px; }

        /* FORM */
        .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:13px; }
        .form-grid.cols3 { grid-template-columns:1fr 1fr 1fr; }
        .form-grid.cols1 { grid-template-columns:1fr; }
        .field { display:flex; flex-direction:column; gap:5px; }
        .field.full { grid-column:1/-1; }
        .field label { font-size:11.5px; font-weight:600; color:${t.textMuted}; }
        .field input, .field select, .field textarea {
          background:${t.inputBg}; border:1px solid ${t.cardBorder}; border-radius:9px;
          padding:9px 12px; font-size:13px; color:${t.text}; font-family:'Plus Jakarta Sans',sans-serif;
          outline:none; transition:border-color 0.15s;
        }
        .field input:focus, .field select:focus, .field textarea:focus { border-color:${accent}55; }
        .field input::placeholder, .field textarea::placeholder { color:${t.textFaint}; }
        .field select option { background:${darkMode ? "#1a1a2e" : "#ffffff"}; color:${t.text}; }
        .field textarea { resize:vertical; min-height:80px; }

        /* SERVICES */
        .svc-row { display:grid; grid-template-columns:2fr 1fr 1fr 1fr 32px; gap:9px; align-items:center; padding:8px 0; border-bottom:1px solid ${t.border}; }
        .svc-header { display:grid; grid-template-columns:2fr 1fr 1fr 1fr 32px; gap:9px; padding:0 0 6px; }
        .svc-hdr-lbl { font-size:10.5px; color:${t.textFaint}; font-weight:600; text-transform:uppercase; letter-spacing:1px; }
        .svc-input { background:${t.inputBg}; border:1px solid ${t.cardBorder}; border-radius:7px; padding:7px 10px; font-size:12.5px; color:${t.text}; font-family:'Plus Jakarta Sans',sans-serif; outline:none; width:100%; }
        .svc-input:focus { border-color:${accent}55; }
        .remove-btn { width:28px; height:28px; border-radius:7px; background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.15); color:#ef4444; cursor:pointer; font-size:15px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .add-row-btn { display:flex; align-items:center; gap:7px; padding:8px 14px; border-radius:9px; background:${accent}10; border:1px dashed ${accent}33; color:${accent}; font-size:12.5px; font-weight:600; cursor:pointer; transition:all 0.13s; font-family:'Plus Jakarta Sans',sans-serif; margin-top:10px; }
        .add-row-btn:hover { background:${accent}18; }

        /* STAFF CARDS */
        .staff-card { background:${t.chipBg || t.inputBg}; border:1px solid ${t.chipBorder || t.cardBorder}; border-radius:11px; padding:16px; margin-bottom:12px; }
        .staff-card-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
        .staff-card-name { font-weight:700; font-size:14px; color:${t.text}; }
        .staff-days { display:flex; gap:6px; flex-wrap:wrap; margin-top:12px; }
        .day-pill { display:flex; flex-direction:column; align-items:center; gap:4px; }
        .day-toggle { width:36px; height:36px; border-radius:9px; border:1px solid ${t.cardBorder}; background:${t.inputBg}; color:${t.textMuted}; cursor:pointer; font-size:11.5px; font-weight:600; transition:all 0.13s; font-family:'Plus Jakarta Sans',sans-serif; }
        .day-toggle.on { background:${accent}15; border-color:${accent}33; color:${accent}; }
        .day-hours { display:flex; align-items:center; gap:4px; }
        .time-input { background:${t.inputBg}; border:1px solid ${t.cardBorder}; border-radius:6px; padding:4px 7px; font-size:11px; color:${t.text}; font-family:'Plus Jakarta Sans',sans-serif; outline:none; width:68px; }
        .time-input:focus { border-color:${accent}55; }
        .capacity-row { display:flex; align-items:center; gap:8px; margin-top:10px; }
        .cap-label { font-size:12px; color:${t.textMuted}; font-weight:500; }
        .cap-stepper { display:flex; align-items:center; gap:0; border:1px solid ${t.cardBorder}; border-radius:8px; overflow:hidden; }
        .cap-btn { width:30px; height:30px; background:${t.inputBg}; border:none; color:${t.text}; cursor:pointer; font-size:16px; font-weight:700; transition:background 0.12s; }
        .cap-btn:hover { background:${accent}18; color:${accent}; }
        .cap-num { width:36px; text-align:center; font-weight:700; font-size:14px; color:${t.text}; background:${t.chipBg || t.inputBg}; }

        /* AI */
        .rules-grid { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px; }
        .rule-tag { display:inline-flex; align-items:center; gap:6px; padding:6px 13px; border-radius:100px; font-size:12px; font-weight:500; cursor:pointer; transition:all 0.13s; border:1px solid ${t.cardBorder}; background:${t.inputBg}; color:${t.textMuted}; font-family:'Plus Jakarta Sans',sans-serif; }
        .rule-tag.active { background:${accent}12; border-color:${accent}30; color:${accent}; }
        .faq-row { display:grid; grid-template-columns:1fr 1fr 32px; gap:9px; align-items:start; margin-bottom:9px; }
        .lang-grid { display:flex; flex-wrap:wrap; gap:7px; }
        .lang-btn { padding:6px 14px; border-radius:8px; font-size:12.5px; font-weight:600; cursor:pointer; border:1px solid ${t.cardBorder}; background:${t.inputBg}; color:${t.textMuted}; transition:all 0.13s; font-family:'Plus Jakarta Sans',sans-serif; }
        .lang-btn.active { background:${accent}12; border-color:${accent}30; color:${accent}; }

        /* SAVE BAR */
        .save-bar { padding:14px 20px; border-top:1px solid ${t.border}; background:${t.topbar}; display:flex; align-items:center; justify-content:flex-end; gap:10px; flex-shrink:0; }
        .save-btn { display:inline-flex; align-items:center; gap:8px; padding:10px 24px; border-radius:10px; background:${accent}; border:none; color:#000; font-weight:700; font-size:13px; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.15s; }
        .save-btn:hover { opacity:0.88; }
        .save-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .saved-msg { font-size:12.5px; color:${accent}; font-weight:600; display:flex; align-items:center; gap:5px; }
      `}</style>

      <div className="settings-root">
        {/* TABS */}
        <div className="settings-tabs">
          {TABS.map(tab => (
            <button key={tab.id} className={`s-tab${activeTab===tab.id?" active":""}`} onClick={() => setActiveTab(tab.id)}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        {/* BODY */}
        <div className="settings-body">

          {/* ── BUSINESS INFO ── */}
          {activeTab === "business" && (
            <>
              <div className="section-card">
                <div className="section-title">Business Information</div>
                <div className="section-sub">This info helps the AI understand your business context</div>
                <div className="form-grid">
                  <div className="field">
                    <label>Business Name</label>
                    <input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Glamour Studio" />
                  </div>
                  <div className="field">
                    <label>Business Type</label>
                    <select value={businessType} onChange={e => setBusinessType(e.target.value)}>
                      {BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Phone Number</label>
                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
                  </div>
                  <div className="field">
                    <label>Location / Area</label>
                    <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Bandra West, Mumbai" />
                  </div>
                  <div className="field full">
                    <label>Google Maps Link</label>
                    <input value={mapsLink} onChange={e => setMapsLink(e.target.value)} placeholder="https://maps.google.com/..." />
                  </div>
                  <div className="field full">
                    <label>Business Description (for AI context)</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your business, specialties, target customers..." rows={3} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── SERVICES ── */}
          {activeTab === "services" && (
            <div className="section-card">
              <div className="section-title">Services & Pricing</div>
              <div className="section-sub">AI uses this to answer pricing questions and suggest bookings</div>
              <div className="svc-header">
                {["Service Name","Price (₹)","Duration","Category",""].map(h => <div key={h} className="svc-hdr-lbl">{h}</div>)}
              </div>
              {services.map(svc => (
                <div key={svc.id} className="svc-row">
                  <input className="svc-input" value={svc.name} onChange={e => updateService(svc.id,"name",e.target.value)} placeholder="e.g. Women's Haircut" />
                  <input className="svc-input" value={svc.price} onChange={e => updateService(svc.id,"price",e.target.value)} placeholder="350" type="number" />
                  <select className="svc-input" value={svc.duration} onChange={e => updateService(svc.id,"duration",e.target.value)}>
                    {SLOT_DURATIONS.map(d => <option key={d} value={d}>{d} min</option>)}
                  </select>
                  <input className="svc-input" value={svc.category} onChange={e => updateService(svc.id,"category",e.target.value)} placeholder="Hair, Skin..." />
                  <button className="remove-btn" onClick={() => removeService(svc.id)}>×</button>
                </div>
              ))}
              <button className="add-row-btn" onClick={addService}>+ Add Service</button>
            </div>
          )}

          {/* ── BOOKING SETUP ── */}
          {activeTab === "booking" && (
            <>
              <div className="section-card">
                <div className="section-title">Staff & Specialists</div>
                <div className="section-sub">Each staff member has their own schedule, slot duration, and capacity</div>
                {staff.map(s => (
                  <div key={s.id} className="staff-card">
                    <div className="staff-card-header">
                      <div className="staff-card-name">{s.name || "New Staff Member"}</div>
                      <button className="remove-btn" onClick={() => removeStaff(s.id)}>×</button>
                    </div>
                    <div className="form-grid">
                      <div className="field">
                        <label>Name</label>
                        <input value={s.name} onChange={e => updateStaff(s.id,"name",e.target.value)} placeholder="Staff name" />
                      </div>
                      <div className="field">
                        <label>Role / Title</label>
                        <input value={s.role} onChange={e => updateStaff(s.id,"role",e.target.value)} placeholder="e.g. Senior Stylist" />
                      </div>
                      <div className="field">
                        <label>Specialization</label>
                        <select value={s.specialization} onChange={e => updateStaff(s.id,"specialization",e.target.value)}>
                          {SPECIALIZATIONS.map(sp => <option key={sp}>{sp}</option>)}
                        </select>
                      </div>
                      <div className="field">
                        <label>Appointment Slot Duration</label>
                        <select value={s.slotDuration} onChange={e => updateStaff(s.id,"slotDuration",parseInt(e.target.value))}>
                          {SLOT_DURATIONS.map(d => <option key={d} value={d}>{d} minutes</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="capacity-row">
                      <span className="cap-label">Simultaneous clients / capacity:</span>
                      <div className="cap-stepper">
                        <button className="cap-btn" onClick={() => updateStaff(s.id,"capacity",Math.max(1,s.capacity-1))}>−</button>
                        <span className="cap-num">{s.capacity}</span>
                        <button className="cap-btn" onClick={() => updateStaff(s.id,"capacity",Math.min(20,s.capacity+1))}>+</button>
                      </div>
                      <span style={{fontSize:11,color:t.textFaint}}>(e.g. 3 salon chairs = capacity 3)</span>
                    </div>
                    <div style={{marginTop:14}}>
                      <div style={{fontSize:11.5,color:t.textMuted,fontWeight:600,marginBottom:8}}>Working Hours</div>
                      <div className="staff-days">
                        {DAYS_OF_WEEK.map(day => (
                          <div key={day} className="day-pill">
                            <button className={`day-toggle${s.days[day].on?" on":""}`} onClick={() => updateStaffDay(s.id,day,"on",!s.days[day].on)}>
                              {day}
                            </button>
                            {s.days[day].on && (
                              <div className="day-hours">
                                <input type="time" className="time-input" value={s.days[day].from} onChange={e => updateStaffDay(s.id,day,"from",e.target.value)} />
                                <span style={{fontSize:10,color:t.textFaint}}>–</span>
                                <input type="time" className="time-input" value={s.days[day].to} onChange={e => updateStaffDay(s.id,day,"to",e.target.value)} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                <button className="add-row-btn" onClick={addStaff}>+ Add Staff Member</button>
              </div>
            </>
          )}

          {/* ── AI INSTRUCTIONS ── */}
          {activeTab === "ai" && (
            <>
              <div className="section-card">
                <div className="section-title">Quick AI Rules</div>
                <div className="section-sub">Click to toggle rules — AI will follow these in every conversation</div>
                <div className="rules-grid">
                  {QUICK_RULES.map(rule => (
                    <button key={rule} className={`rule-tag${activeRules.includes(rule)?" active":""}`} onClick={() => toggleRule(rule)}>
                      {activeRules.includes(rule) ? "✓ " : "+ "}{rule}
                    </button>
                  ))}
                </div>
              </div>

              <div className="section-card">
                <div className="section-title">Custom AI Instructions</div>
                <div className="section-sub">Give the AI specific instructions for your business</div>
                <div className="field">
                  <textarea value={aiInstructions} onChange={e => setAiInstructions(e.target.value)} rows={5}
                    placeholder="e.g. Always mention our loyalty program. Don't discuss competitor pricing. If customer asks for discount, offer 10% first-timer discount..." />
                </div>
              </div>

              <div className="section-card">
                <div className="section-title">FAQ Builder</div>
                <div className="section-sub">AI will use these answers for common questions</div>
                {faqs.map(faq => (
                  <div key={faq.id} className="faq-row">
                    <div className="field">
                      <input className="svc-input" value={faq.q} onChange={e => updateFaq(faq.id,"q",e.target.value)} placeholder="Question..." />
                    </div>
                    <div className="field">
                      <input className="svc-input" value={faq.a} onChange={e => updateFaq(faq.id,"a",e.target.value)} placeholder="Answer..." />
                    </div>
                    <button className="remove-btn" style={{marginTop:2}} onClick={() => removeFaq(faq.id)}>×</button>
                  </div>
                ))}
                <button className="add-row-btn" onClick={addFaq}>+ Add FAQ</button>
              </div>

              <div className="section-card">
                <div className="section-title">AI Reply Language</div>
                <div className="section-sub">AI will respond in the selected language</div>
                <div className="lang-grid">
                  {LANGUAGES.map(lang => (
                    <button key={lang} className={`lang-btn${language===lang?" active":""}`} onClick={() => setLanguage(lang)}>{lang}</button>
                  ))}
                </div>
              </div>

              <div className="section-card">
                <div className="section-title">External Booking Link</div>
                <div className="section-sub">Optional — AI will share this link if in-chat booking isn't set up</div>
                <div className="field">
                  <input value={bookingLink} onChange={e => setBookingLink(e.target.value)} placeholder="https://calendly.com/yourbusiness or similar" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* SAVE BAR */}
        <div className="save-bar">
          {saved && <span className="saved-msg">✓ Changes saved successfully</span>}
          <button className="save-btn" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
