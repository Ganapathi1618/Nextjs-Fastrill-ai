"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const SLOT_DURATIONS = [10, 15, 20, 30, 45, 60, 90, 120]
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const BUSINESS_TYPES = ["Salon", "Clinic", "Spa", "Fitness Studio", "Dental Clinic", "Physiotherapy", "Other"]
const SPECIALIZATIONS = [
  "General Physician", "Dermatologist", "Gynecologist", "Pediatrician",
  "Orthopedic", "Cardiologist", "ENT Specialist", "Ophthalmologist",
  "Neurologist", "Psychiatrist", "Hair Stylist", "Makeup Artist",
  "Nail Technician", "Spa Therapist", "Fitness Trainer", "Other"
]

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("business")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userEmail, setUserEmail] = useState("")

  // Business Info
  const [businessName, setBusinessName] = useState("")
  const [businessType, setBusinessType] = useState("Salon")
  const [location, setLocation] = useState("")
  const [mapsLink, setMapsLink] = useState("")
  const [phone, setPhone] = useState("")
  const [description, setDescription] = useState("")

  // Services
  const [services, setServices] = useState([
    { id: 1, name: "", price: "", duration: 30, category: "" }
  ])

  // Staff / Booking
  const [staff, setStaff] = useState([
    {
      id: 1, name: "", role: "", specialization: "",
      slotDuration: 30, capacity: 1,
      hours: DAYS.map(d => ({ day: d, open: d !== "Sunday", from: "10:00", to: "20:00" }))
    }
  ])

  // AI Instructions
  const [faqs, setFaqs] = useState([{ id: 1, q: "", a: "" }])
  const [aiRules, setAiRules] = useState("")
  const [bookingLink, setBookingLink] = useState("")
  const [language, setLanguage] = useState("English")

  const navItems = [
    { id: "overview", label: "Revenue Engine", icon: "◈" },
    { id: "inbox", label: "Conversations", icon: "◎" },
    { id: "bookings", label: "Bookings", icon: "◷" },
    { id: "leads", label: "Lead Recovery", icon: "◉" },
    { id: "contacts", label: "Customers", icon: "◑" },
    { id: "analytics", label: "Analytics", icon: "◫" },
    { id: "settings", label: "Settings", icon: "◌" },
  ]

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { router.push("/login"); return }
      setUserEmail(data.user.email || "")
    }
    init()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  // ── Services helpers ──
  const addService = () => setServices(s => [...s, { id: Date.now(), name: "", price: "", duration: 30, category: "" }])
  const removeService = (id) => setServices(s => s.filter(x => x.id !== id))
  const updateService = (id, field, val) => setServices(s => s.map(x => x.id === id ? { ...x, [field]: val } : x))

  // ── Staff helpers ──
  const addStaff = () => setStaff(s => [...s, {
    id: Date.now(), name: "", role: "", specialization: "",
    slotDuration: 30, capacity: 1,
    hours: DAYS.map(d => ({ day: d, open: d !== "Sunday", from: "10:00", to: "20:00" }))
  }])
  const removeStaff = (id) => setStaff(s => s.filter(x => x.id !== id))
  const updateStaff = (id, field, val) => setStaff(s => s.map(x => x.id === id ? { ...x, [field]: val } : x))
  const updateStaffHour = (staffId, day, field, val) => {
    setStaff(s => s.map(x => x.id === staffId ? {
      ...x,
      hours: x.hours.map(h => h.day === day ? { ...h, [field]: val } : h)
    } : x))
  }

  // ── FAQ helpers ──
  const addFaq = () => setFaqs(f => [...f, { id: Date.now(), q: "", a: "" }])
  const removeFaq = (id) => setFaqs(f => f.filter(x => x.id !== id))
  const updateFaq = (id, field, val) => setFaqs(f => f.map(x => x.id === id ? { ...x, [field]: val } : x))

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 900))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const tabs = [
    { id: "business", label: "Business Info", icon: "🏢" },
    { id: "services", label: "Services & Pricing", icon: "✦" },
    { id: "booking", label: "Booking Setup", icon: "📅" },
    { id: "ai", label: "AI Instructions", icon: "◈" },
  ]

  const userInitial = userEmail ? userEmail[0].toUpperCase() : "U"

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0a0a0f !important; color: #e8e8f0 !important; font-family: 'DM Sans', sans-serif !important; }

        .dash-root { display: flex; height: 100vh; overflow: hidden; background: #0a0a0f; }

        /* SIDEBAR */
        .sidebar { width: 220px; flex-shrink: 0; background: #0f0f17; border-right: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; overflow-y: auto; }
        .sidebar-logo { padding: 24px 20px 20px; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 22px; color: #fff; text-decoration: none; display: block; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .sidebar-logo span { color: #00c47d; }
        .sidebar-section { padding: 20px 12px 8px; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.2); font-weight: 600; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; margin: 2px 8px; border-radius: 8px; cursor: pointer; font-size: 13px; color: rgba(255,255,255,0.45); font-weight: 500; transition: all 0.15s; border: none; background: none; width: calc(100% - 16px); text-align: left; font-family: 'DM Sans', sans-serif; }
        .nav-item:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8); }
        .nav-item.active { background: rgba(0,196,125,0.1); color: #00c47d; font-weight: 600; border: 1px solid rgba(0,196,125,0.2); }
        .nav-icon { font-size: 14px; width: 18px; text-align: center; }
        .sidebar-footer { margin-top: auto; padding: 14px; border-top: 1px solid rgba(255,255,255,0.05); }
        .user-card { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); }
        .user-avatar { width: 30px; height: 30px; border-radius: 8px; background: linear-gradient(135deg, #00c47d, #0ea5e9); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 12px; color: #fff; flex-shrink: 0; }
        .user-email { font-size: 11px; color: rgba(255,255,255,0.35); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .logout-btn { margin-top: 8px; width: 100%; padding: 7px; border-radius: 7px; background: transparent; border: 1px solid rgba(255,255,255,0.08); font-size: 11.5px; color: rgba(255,255,255,0.3); cursor: pointer; transition: all 0.12s; font-family: 'DM Sans', sans-serif; }
        .logout-btn:hover { border-color: rgba(239,68,68,0.4); color: #ef4444; }

        /* MAIN */
        .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .topbar { height: 56px; flex-shrink: 0; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between; padding: 0 24px; background: #0f0f17; }
        .topbar-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; color: #fff; }
        .save-btn { display: inline-flex; align-items: center; gap: 7px; padding: 8px 20px; border-radius: 9px; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 12.5px; border: none; cursor: pointer; transition: all 0.15s; }
        .save-btn.idle { background: #00c47d; color: #000; box-shadow: 0 4px 14px rgba(0,196,125,0.35); }
        .save-btn.idle:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,196,125,0.45); }
        .save-btn.saving { background: rgba(0,196,125,0.2); color: #00c47d; cursor: not-allowed; }
        .save-btn.saved { background: rgba(0,196,125,0.15); color: #00c47d; border: 1px solid rgba(0,196,125,0.3); }

        .content { flex: 1; overflow-y: auto; background: #0a0a0f; }

        /* TABS */
        .tab-bar { display: flex; gap: 4px; padding: 16px 24px 0; border-bottom: 1px solid rgba(255,255,255,0.06); background: #0f0f17; }
        .tab-btn { padding: 10px 18px; border-radius: 8px 8px 0 0; font-size: 12.5px; font-weight: 600; cursor: pointer; border: none; background: transparent; color: rgba(255,255,255,0.35); transition: all 0.15s; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; gap: 7px; border-bottom: 2px solid transparent; }
        .tab-btn:hover { color: rgba(255,255,255,0.7); }
        .tab-btn.active { color: #00c47d; border-bottom-color: #00c47d; background: rgba(0,196,125,0.05); }

        /* FORM AREA */
        .form-area { padding: 24px; max-width: 860px; }

        /* SECTION */
        .section { background: #0f0f17; border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 22px; margin-bottom: 16px; }
        .section-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13.5px; color: #fff; margin-bottom: 4px; }
        .section-sub { font-size: 12px; color: rgba(255,255,255,0.3); margin-bottom: 18px; }

        /* FORM FIELDS */
        .field-row { display: grid; gap: 14px; margin-bottom: 14px; }
        .field-row.cols-2 { grid-template-columns: 1fr 1fr; }
        .field-row.cols-3 { grid-template-columns: 1fr 1fr 1fr; }
        .field-group { display: flex; flex-direction: column; gap: 6px; }
        .field-label { font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
        .field-input, .field-select, .field-textarea {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 9px; padding: 10px 13px;
          font-size: 13px; color: #e8e8f0;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.15s;
          width: 100%;
        }
        .field-input:focus, .field-select:focus, .field-textarea:focus { outline: none; border-color: rgba(0,196,125,0.4); background: rgba(0,196,125,0.03); }
        .field-input::placeholder, .field-textarea::placeholder { color: rgba(255,255,255,0.2); }
        .field-select { cursor: pointer; }
        .field-select option { background: #1a1a2e; color: #e8e8f0; }
        .field-textarea { resize: vertical; min-height: 80px; line-height: 1.5; }

        /* SERVICE ROWS */
        .service-row { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 10px; align-items: center; padding: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; margin-bottom: 8px; transition: border-color 0.15s; }
        .service-row:hover { border-color: rgba(0,196,125,0.15); }
        .remove-btn { width: 30px; height: 30px; border-radius: 7px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15); color: #ef4444; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.12s; flex-shrink: 0; }
        .remove-btn:hover { background: rgba(239,68,68,0.15); }
        .add-btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 9px; background: rgba(0,196,125,0.08); border: 1px solid rgba(0,196,125,0.2); color: #00c47d; font-size: 12.5px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; margin-top: 4px; }
        .add-btn:hover { background: rgba(0,196,125,0.14); }

        /* STAFF CARD */
        .staff-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 18px; margin-bottom: 14px; }
        .staff-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .staff-number { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 11px; color: rgba(255,255,255,0.25); letter-spacing: 1px; text-transform: uppercase; }
        .staff-name-preview { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; color: #00c47d; }

        /* HOURS TABLE */
        .hours-table { display: flex; flex-direction: column; gap: 6px; margin-top: 14px; }
        .hours-row { display: grid; grid-template-columns: 100px 40px 1fr 20px 1fr; gap: 8px; align-items: center; }
        .hours-day { font-size: 12px; color: rgba(255,255,255,0.5); font-weight: 500; }
        .toggle { width: 36px; height: 20px; border-radius: 100px; border: none; cursor: pointer; transition: background 0.2s; position: relative; flex-shrink: 0; }
        .toggle.on { background: #00c47d; }
        .toggle.off { background: rgba(255,255,255,0.1); }
        .toggle::after { content: ''; position: absolute; top: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: left 0.2s; }
        .toggle.on::after { left: 18px; }
        .toggle.off::after { left: 2px; }
        .hours-sep { font-size: 11px; color: rgba(255,255,255,0.2); text-align: center; }
        .time-input { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 7px; padding: 6px 10px; font-size: 12px; color: #e8e8f0; font-family: 'DM Sans', sans-serif; width: 100%; }
        .time-input:focus { outline: none; border-color: rgba(0,196,125,0.35); }
        .time-input:disabled { opacity: 0.25; cursor: not-allowed; }

        /* CAPACITY ROW */
        .capacity-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
        .capacity-card { background: rgba(0,196,125,0.04); border: 1px solid rgba(0,196,125,0.12); border-radius: 10px; padding: 14px; }
        .capacity-label { font-size: 10px; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 8px; }
        .capacity-hint { font-size: 11px; color: rgba(255,255,255,0.25); margin-top: 5px; }

        /* FAQ */
        .faq-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 10px; align-items: start; padding: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; margin-bottom: 8px; }

        /* AI RULES */
        .rule-tag { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 100px; background: rgba(124,58,237,0.1); border: 1px solid rgba(124,58,237,0.2); color: #a78bfa; font-size: 11.5px; font-weight: 600; margin: 4px; cursor: pointer; transition: all 0.12s; }
        .rule-tag:hover { background: rgba(124,58,237,0.18); }
        .rule-tag.active { background: rgba(124,58,237,0.2); border-color: rgba(124,58,237,0.4); }

        /* SCROLLBAR */
        .content::-webkit-scrollbar { width: 4px; }
        .content::-webkit-scrollbar-track { background: transparent; }
        .content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

        @media (max-width: 768px) {
          .sidebar { display: none; }
          .field-row.cols-2, .field-row.cols-3 { grid-template-columns: 1fr; }
          .service-row { grid-template-columns: 1fr 1fr; }
          .hours-row { grid-template-columns: 80px 36px 1fr 16px 1fr; gap: 5px; }
        }
      `}</style>

      <div className="dash-root">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <a href="/" className="sidebar-logo">fast<span>rill</span></a>
          <div className="sidebar-section">Platform</div>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item${item.id === "settings" ? " active" : ""}`}
              onClick={() => item.id !== "settings" && router.push(`/dashboard?tab=${item.id}`)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          <div className="sidebar-footer">
            <div className="user-card">
              <div className="user-avatar">{userInitial}</div>
              <div className="user-email">{userEmail}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>↩ Sign out</button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="main">
          {/* TOPBAR */}
          <div className="topbar">
            <div className="topbar-title">Settings</div>
            <button
              className={`save-btn ${saving ? "saving" : saved ? "saved" : "idle"}`}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "⟳ Saving..." : saved ? "✓ Saved" : "Save Changes"}
            </button>
          </div>

          {/* TAB BAR */}
          <div className="tab-bar">
            {tabs.map(t => (
              <button
                key={t.id}
                className={`tab-btn${activeTab === t.id ? " active" : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>

          {/* CONTENT */}
          <div className="content">
            <div className="form-area">

              {/* ── TAB 1: BUSINESS INFO ── */}
              {activeTab === "business" && (
                <>
                  <div className="section">
                    <div className="section-title">Business Identity</div>
                    <div className="section-sub">This information is shown to customers on WhatsApp</div>
                    <div className="field-row cols-2">
                      <div className="field-group">
                        <label className="field-label">Business Name</label>
                        <input className="field-input" placeholder="e.g. Glamour Studio" value={businessName} onChange={e => setBusinessName(e.target.value)} />
                      </div>
                      <div className="field-group">
                        <label className="field-label">Business Type</label>
                        <select className="field-select" value={businessType} onChange={e => setBusinessType(e.target.value)}>
                          {BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="field-row cols-2">
                      <div className="field-group">
                        <label className="field-label">Phone Number</label>
                        <input className="field-input" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} />
                      </div>
                      <div className="field-group">
                        <label className="field-label">City / Area</label>
                        <input className="field-input" placeholder="e.g. Banjara Hills, Hyderabad" value={location} onChange={e => setLocation(e.target.value)} />
                      </div>
                    </div>
                    <div className="field-row">
                      <div className="field-group">
                        <label className="field-label">Google Maps Link</label>
                        <input className="field-input" placeholder="https://maps.google.com/..." value={mapsLink} onChange={e => setMapsLink(e.target.value)} />
                      </div>
                    </div>
                    <div className="field-row">
                      <div className="field-group">
                        <label className="field-label">Business Description</label>
                        <textarea className="field-textarea" placeholder="Describe your business in 2-3 lines. The AI will use this to introduce your business to customers." value={description} onChange={e => setDescription(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── TAB 2: SERVICES ── */}
              {activeTab === "services" && (
                <div className="section">
                  <div className="section-title">Services & Pricing</div>
                  <div className="section-sub">Add all your services with prices. The AI will use this to answer customer queries accurately.</div>

                  <div style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr auto", gap:"10px", padding:"0 0 8px", marginBottom:"4px"}}>
                    {["Service Name", "Price (₹)", "Duration (min)", ""].map((h, i) => (
                      <div key={i} style={{fontSize:"10px", color:"rgba(255,255,255,0.3)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px"}}>{h}</div>
                    ))}
                  </div>

                  {services.map(s => (
                    <div key={s.id} className="service-row">
                      <input className="field-input" placeholder="e.g. Haircut (Women)" value={s.name} onChange={e => updateService(s.id, "name", e.target.value)} />
                      <input className="field-input" placeholder="350" type="number" value={s.price} onChange={e => updateService(s.id, "price", e.target.value)} />
                      <select className="field-select" value={s.duration} onChange={e => updateService(s.id, "duration", Number(e.target.value))}>
                        {SLOT_DURATIONS.map(d => <option key={d} value={d}>{d} min</option>)}
                      </select>
                      <button className="remove-btn" onClick={() => removeService(s.id)}>×</button>
                    </div>
                  ))}
                  <button className="add-btn" onClick={addService}>+ Add Service</button>
                </div>
              )}

              {/* ── TAB 3: BOOKING SETUP ── */}
              {activeTab === "booking" && (
                <>
                  <div className="section">
                    <div className="section-title">Staff & Availability</div>
                    <div className="section-sub">
                      Each staff member or specialist has their own schedule, slot duration, and capacity.
                      {businessType === "Salon" && " For salons, capacity = number of chairs that staff member manages."}
                      {businessType === "Clinic" && " For clinics, each doctor has their own schedule and slot duration."}
                    </div>

                    {staff.map((s, idx) => (
                      <div key={s.id} className="staff-card">
                        <div className="staff-card-header">
                          <div>
                            <div className="staff-number">Staff #{idx + 1}</div>
                            <div className="staff-name-preview">{s.name || "Unnamed"}</div>
                          </div>
                          {staff.length > 1 && (
                            <button className="remove-btn" onClick={() => removeStaff(s.id)}>×</button>
                          )}
                        </div>

                        <div className="field-row cols-3">
                          <div className="field-group">
                            <label className="field-label">Name</label>
                            <input className="field-input" placeholder="e.g. Priya / Dr. Rajan" value={s.name} onChange={e => updateStaff(s.id, "name", e.target.value)} />
                          </div>
                          <div className="field-group">
                            <label className="field-label">Role / Title</label>
                            <input className="field-input" placeholder="e.g. Senior Stylist, Doctor" value={s.role} onChange={e => updateStaff(s.id, "role", e.target.value)} />
                          </div>
                          <div className="field-group">
                            <label className="field-label">Specialization</label>
                            <select className="field-select" value={s.specialization} onChange={e => updateStaff(s.id, "specialization", e.target.value)}>
                              <option value="">Select...</option>
                              {SPECIALIZATIONS.map(sp => <option key={sp}>{sp}</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="capacity-row">
                          <div className="capacity-card">
                            <div className="capacity-label">Slot Duration</div>
                            <select className="field-select" value={s.slotDuration} onChange={e => updateStaff(s.id, "slotDuration", Number(e.target.value))}>
                              {SLOT_DURATIONS.map(d => <option key={d} value={d}>{d} minutes</option>)}
                            </select>
                            <div className="capacity-hint">How long each appointment takes</div>
                          </div>
                          <div className="capacity-card">
                            <div className="capacity-label">
                              {businessType === "Salon" ? "Simultaneous Clients" : "Simultaneous Patients"}
                            </div>
                            <input
                              className="field-input" type="number" min="1" max="20"
                              value={s.capacity}
                              onChange={e => updateStaff(s.id, "capacity", Number(e.target.value))}
                              placeholder="1"
                            />
                            <div className="capacity-hint">
                              {businessType === "Salon"
                                ? `${s.capacity} client${s.capacity > 1 ? "s" : ""} at ${s.slotDuration}-min slots simultaneously`
                                : `${s.capacity} patient${s.capacity > 1 ? "s" : ""} per ${s.slotDuration}-min slot`
                              }
                            </div>
                          </div>
                        </div>

                        {/* WORKING HOURS */}
                        <div style={{fontSize:"11px", color:"rgba(255,255,255,0.3)", fontWeight:600, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"8px"}}>Working Hours</div>
                        <div className="hours-table">
                          {s.hours.map(h => (
                            <div key={h.day} className="hours-row">
                              <div className="hours-day">{h.day}</div>
                              <button
                                className={`toggle ${h.open ? "on" : "off"}`}
                                onClick={() => updateStaffHour(s.id, h.day, "open", !h.open)}
                              />
                              <input
                                className="time-input" type="time" value={h.from}
                                disabled={!h.open}
                                onChange={e => updateStaffHour(s.id, h.day, "from", e.target.value)}
                              />
                              <div className="hours-sep">–</div>
                              <input
                                className="time-input" type="time" value={h.to}
                                disabled={!h.open}
                                onChange={e => updateStaffHour(s.id, h.day, "to", e.target.value)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    <button className="add-btn" onClick={addStaff}>
                      + Add {businessType === "Clinic" ? "Doctor / Specialist" : "Staff Member"}
                    </button>
                  </div>
                </>
              )}

              {/* ── TAB 4: AI INSTRUCTIONS ── */}
              {activeTab === "ai" && (
                <>
                  <div className="section">
                    <div className="section-title">Quick AI Rules</div>
                    <div className="section-sub">Click to add pre-built rules your AI will always follow</div>
                    <div style={{display:"flex", flexWrap:"wrap", gap:"4px", marginBottom:"16px"}}>
                      {[
                        "Always ask customer's name before booking",
                        "Ask for preferred time before showing slots",
                        "Send confirmation message after every booking",
                        "If customer is angry, escalate to human immediately",
                        "Never discuss competitor pricing",
                        "Always mention walk-ins are welcome",
                        "Ask for doctor preference before booking",
                        "Mention parking availability",
                        "Send reminder 1 hour before appointment",
                      ].map(rule => (
                        <button
                          key={rule}
                          className={`rule-tag${aiRules.includes(rule) ? " active" : ""}`}
                          onClick={() => setAiRules(prev =>
                            prev.includes(rule)
                              ? prev.replace(rule + "\n", "").replace(rule, "")
                              : prev + (prev ? "\n" : "") + rule
                          )}
                        >
                          {aiRules.includes(rule) ? "✓" : "+"} {rule}
                        </button>
                      ))}
                    </div>

                    <div className="field-group">
                      <label className="field-label">Custom AI Instructions</label>
                      <textarea
                        className="field-textarea"
                        style={{minHeight: "100px"}}
                        placeholder="Add any specific instructions for your AI... e.g. 'Always greet customers in Telugu if they message in Telugu. Never reveal staff personal numbers.'"
                        value={aiRules}
                        onChange={e => setAiRules(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="section">
                    <div className="section-title">Frequently Asked Questions</div>
                    <div className="section-sub">Add common questions your customers ask. AI will use these for accurate answers.</div>

                    {faqs.map((f, idx) => (
                      <div key={f.id} className="faq-row">
                        <input className="field-input" placeholder={`Q: e.g. Do you take walk-ins?`} value={f.q} onChange={e => updateFaq(f.id, "q", e.target.value)} />
                        <input className="field-input" placeholder="A: Yes, walk-ins are welcome..." value={f.a} onChange={e => updateFaq(f.id, "a", e.target.value)} />
                        {faqs.length > 1 && <button className="remove-btn" onClick={() => removeFaq(f.id)}>×</button>}
                      </div>
                    ))}
                    <button className="add-btn" onClick={addFaq}>+ Add FAQ</button>
                  </div>

                  <div className="section">
                    <div className="section-title">Booking & Contact</div>
                    <div className="section-sub">Optional links the AI can share with customers</div>
                    <div className="field-row cols-2">
                      <div className="field-group">
                        <label className="field-label">Booking Link (optional)</label>
                        <input className="field-input" placeholder="https://calendly.com/..." value={bookingLink} onChange={e => setBookingLink(e.target.value)} />
                      </div>
                      <div className="field-group">
                        <label className="field-label">AI Reply Language</label>
                        <select className="field-select" value={language} onChange={e => setLanguage(e.target.value)}>
                          {["English", "Hindi", "Telugu", "Tamil", "Kannada", "Malayalam", "Marathi"].map(l => <option key={l}>{l}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  )
}
