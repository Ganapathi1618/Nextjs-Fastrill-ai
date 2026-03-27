"use client"
export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

const BIZ_TYPES = [
  { id:"Salon",              icon:"✂️",  desc:"Hair, cuts, styling" },
  { id:"Beauty Parlour",     icon:"💄",  desc:"Makeup, skincare" },
  { id:"Spa",                icon:"🧘",  desc:"Massage, wellness" },
  { id:"Dermatology Clinic", icon:"🏥",  desc:"Skin treatments" },
  { id:"Dental Clinic",      icon:"🦷",  desc:"Dental care" },
  { id:"Gym",                icon:"💪",  desc:"Fitness, training" },
  { id:"Yoga Studio",        icon:"🧘",  desc:"Yoga, meditation" },
  { id:"Fitness Studio",     icon:"🏋️",  desc:"Classes, workouts" },
  { id:"Nail Studio",        icon:"💅",  desc:"Nails, nail art" },
  { id:"Makeup Studio",      icon:"💋",  desc:"Bridal, events" },
  { id:"Hair Studio",        icon:"💇",  desc:"Hair specialists" },
  { id:"Clinic",             icon:"🩺",  desc:"General medicine" },
  { id:"Agency",             icon:"🏢",  desc:"Services, consulting" },
  { id:"Restaurant",         icon:"🍽️",  desc:"Food, dining" },
  { id:"Other",              icon:"🏪",  desc:"Other business" },
]

const POPULAR_SERVICES = {
  "Salon":              [{ name:"Haircut", price:500, duration:30 },{ name:"Hair Color", price:1500, duration:90 },{ name:"Hair Spa", price:800, duration:60 }],
  "Beauty Parlour":     [{ name:"Facial", price:800, duration:60 },{ name:"Threading", price:50, duration:15 },{ name:"Waxing", price:400, duration:45 }],
  "Spa":                [{ name:"Full Body Massage", price:2000, duration:60 },{ name:"Head Massage", price:600, duration:30 },{ name:"Aromatherapy", price:1500, duration:60 }],
  "Dermatology Clinic": [{ name:"Skin Consultation", price:500, duration:30 },{ name:"Cleanup", price:1000, duration:45 },{ name:"Detan", price:800, duration:30 }],
  "Dental Clinic":      [{ name:"Consultation", price:300, duration:30 },{ name:"Cleaning", price:800, duration:45 },{ name:"Filling", price:1500, duration:60 }],
  "Gym":                [{ name:"Monthly Membership", price:1500, duration:30 },{ name:"Personal Training", price:800, duration:60 },{ name:"Diet Consultation", price:500, duration:30 }],
  "Yoga Studio":        [{ name:"Yoga Class", price:500, duration:60 },{ name:"Private Session", price:1200, duration:60 },{ name:"Monthly Pass", price:3000, duration:60 }],
  "Fitness Studio":     [{ name:"Group Class", price:400, duration:45 },{ name:"PT Session", price:800, duration:60 },{ name:"Monthly Pass", price:2500, duration:60 }],
  "Nail Studio":        [{ name:"Manicure", price:500, duration:45 },{ name:"Pedicure", price:600, duration:45 },{ name:"Nail Art", price:800, duration:60 }],
  "Makeup Studio":      [{ name:"Bridal Makeup", price:5000, duration:120 },{ name:"Party Makeup", price:2000, duration:60 },{ name:"Everyday Makeup", price:800, duration:45 }],
  "Agency":             [{ name:"Consultation", price:2000, duration:60 },{ name:"Monthly Retainer", price:15000, duration:60 },{ name:"Project", price:50000, duration:60 }],
  "Restaurant":         [{ name:"Table Booking", price:0, duration:60 },{ name:"Private Dining", price:2000, duration:120 }],
}

const LANGUAGES = ["English","Hindi","Telugu","Tamil","Kannada","Malayalam","Marathi","Bengali","Gujarati","Punjabi"]
const STEPS     = ["Business","Services","AI Setup","WhatsApp"]

export default function OnboardingPage() {
  const [step, setStep]   = useState(0)
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Step 1 - Business
  const [bizName, setBizName]   = useState("")
  const [bizType, setBizType]   = useState("")
  const [location, setLocation] = useState("")
  const [hours, setHours]       = useState("")
  const [phone, setPhone]       = useState("")

  // Step 2 - Services
  const [services, setServices] = useState([])
  const [customSvc, setCustomSvc] = useState({ name:"", price:"", duration:"30" })

  // Step 3 - AI
  const [language, setLanguage] = useState("English")
  const [instructions, setInstructions] = useState("")

  useEffect(() => {
    getSupabase().auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = "/login"; return }
      setUserId(user.id)
    })
  }, [])

  // Auto-load popular services when biz type selected
  useEffect(() => {
    if (bizType && POPULAR_SERVICES[bizType]) {
      setServices(POPULAR_SERVICES[bizType].map(s => ({ ...s, selected: true })))
    } else {
      setServices([])
    }
  }, [bizType])

  async function saveStep1() {
    if (!bizName.trim()) { setError("Please enter your business name"); return false }
    if (!bizType)         { setError("Please select your business type"); return false }
    setLoading(true); setError("")
    try {
      const supabase = getSupabase()
      const { error } = await supabase.from("business_settings").upsert({
        user_id:       userId,
        business_name: bizName.trim(),
        business_type: bizType,
        location:      location.trim(),
        working_hours: hours.trim(),
        phone:         phone.trim(),
        updated_at:    new Date().toISOString()
      }, { onConflict: "user_id" })
      if (error) throw error
      return true
    } catch(e) { setError(e.message || "Save failed"); return false }
    finally { setLoading(false) }
  }

  async function saveStep2() {
    const selected = services.filter(s => s.selected)
    if (selected.length === 0) { setError("Please add at least one service"); return false }
    setLoading(true); setError("")
    try {
      const supabase = getSupabase()
      // Delete existing services first
      await supabase.from("services").delete().eq("user_id", userId)
      // Insert selected services
      const rows = selected.map(s => ({
        user_id:      userId,
        name:         s.name,
        price:        parseInt(s.price) || 0,
        duration:     parseInt(s.duration) || 30,
        service_type: "time_based",
        is_active:    true,
        created_at:   new Date().toISOString()
      }))
      const { error } = await supabase.from("services").insert(rows)
      if (error) throw error
      return true
    } catch(e) { setError(e.message || "Save failed"); return false }
    finally { setLoading(false) }
  }

  async function saveStep3() {
    setLoading(true); setError("")
    try {
      const supabase = getSupabase()
      const { error } = await supabase.from("business_settings").upsert({
        user_id:         userId,
        ai_language:     language,
        ai_instructions: instructions.trim(),
        updated_at:      new Date().toISOString()
      }, { onConflict: "user_id" })
      if (error) throw error
      return true
    } catch(e) { setError(e.message || "Save failed"); return false }
    finally { setLoading(false) }
  }

  async function handleNext() {
    setError("")
    let ok = true
    if      (step === 0) ok = await saveStep1()
    else if (step === 1) ok = await saveStep2()
    else if (step === 2) ok = await saveStep3()
    if (ok) {
      if (step < 3) setStep(s => s + 1)
      else window.location.href = "/dashboard"
    }
  }

  function addCustomService() {
    if (!customSvc.name.trim() || !customSvc.price) return
    setServices(s => [...s, { ...customSvc, selected: true }])
    setCustomSvc({ name:"", price:"", duration:"30" })
  }

  const bg      = "#08080e"
  const card    = "#0f0f1a"
  const border  = "rgba(255,255,255,0.08)"
  const text    = "#eeeef5"
  const muted   = "rgba(255,255,255,0.45)"
  const accent  = "#00C9B1"
  const inp     = { width:"100%", padding:"10px 12px", borderRadius:8, border:"1px solid "+border, background:"rgba(255,255,255,0.04)", color:text, fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"'Plus Jakarta Sans',sans-serif" }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${bg};font-family:'Plus Jakarta Sans',sans-serif;color:${text};}
        .biz-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
        .biz-card{padding:14px;border-radius:10px;border:1px solid ${border};background:rgba(255,255,255,0.03);cursor:pointer;transition:all 0.15s;text-align:center;}
        .biz-card:hover{border-color:${accent}44;background:${accent}08;}
        .biz-card.selected{border-color:${accent};background:${accent}15;}
        .biz-icon{font-size:24px;margin-bottom:6px;}
        .biz-name{font-size:12px;font-weight:600;color:${text};}
        .biz-desc{font-size:10px;color:${muted};margin-top:2px;}
        .svc-list{display:flex;flex-direction:column;gap:8px;}
        .svc-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;border:1px solid ${border};background:rgba(255,255,255,0.03);}
        .svc-check{width:18px;height:18px;border-radius:4px;border:1.5px solid ${border};background:transparent;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
        .svc-check.on{background:${accent};border-color:${accent};}
        .lang-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
        .lang-btn{padding:9px;border-radius:8px;border:1px solid ${border};background:rgba(255,255,255,0.03);color:${muted};font-size:13px;cursor:pointer;transition:all 0.12s;font-family:'Plus Jakarta Sans',sans-serif;}
        .lang-btn.on{border-color:${accent};background:${accent}15;color:${accent};font-weight:600;}
        @media(max-width:480px){.biz-grid{grid-template-columns:repeat(2,1fr);}.lang-grid{grid-template-columns:repeat(2,1fr);}}
      `}</style>
      <div style={{ minHeight:"100vh", background:bg, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
        <div style={{ width:"100%", maxWidth:"560px" }}>

          {/* Logo */}
          <div style={{ textAlign:"center", marginBottom:"32px" }}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"10px"}}><img src="/logo.png" width="34" height="34" alt="Fastrill" style={{display:"block",objectFit:"contain",flexShrink:0}} /><span style={{fontWeight:800,fontSize:20,color:"#fff",letterSpacing:"-0.3px",lineHeight:1}}>fast<span style={{color:"#00C9B1"}}>rill</span></span></div>
            <p style={{ color:muted, fontSize:"14px", marginTop:"6px" }}>Let's set up your AI receptionist</p>
          </div>

          {/* Progress */}
          <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"28px" }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", flex:1 }}>
                <div style={{ width:"100%", height:"4px", borderRadius:"2px", background: i <= step ? accent : border, transition:"background 0.3s" }} />
              </div>
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"24px", marginTop:"-18px" }}>
            {STEPS.map((s, i) => (
              <span key={i} style={{ fontSize:"11px", color: i === step ? accent : muted, fontWeight: i === step ? 600 : 400 }}>{s}</span>
            ))}
          </div>

          {/* Card */}
          <div style={{ background:card, border:"1px solid "+border, borderRadius:"16px", padding:"28px" }}>

            {error && <div style={{ background:"#2d1515", border:"1px solid #f87171", borderRadius:"8px", padding:"10px 14px", marginBottom:"16px", color:"#f87171", fontSize:"13px" }}>{error}</div>}

            {/* STEP 0: Business Info */}
            {step === 0 && (
              <>
                <h2 style={{ fontSize:"18px", fontWeight:"700", marginBottom:"6px" }}>About your business</h2>
                <p style={{ color:muted, fontSize:"13px", marginBottom:"20px" }}>Your AI will use this to answer customer questions</p>

                <div style={{ marginBottom:"14px" }}>
                  <label style={{ display:"block", fontSize:"12px", color:muted, marginBottom:"5px" }}>Business name *</label>
                  <input value={bizName} onChange={e => setBizName(e.target.value)} placeholder="e.g. Priya Beauty Salon" style={inp} />
                </div>

                <label style={{ display:"block", fontSize:"12px", color:muted, marginBottom:"8px" }}>Business type *</label>
                <div className="biz-grid" style={{ marginBottom:"16px" }}>
                  {BIZ_TYPES.map(t => (
                    <div key={t.id} className={"biz-card" + (bizType===t.id?" selected":"")} onClick={() => setBizType(t.id)}>
                      <div className="biz-icon">{t.icon}</div>
                      <div className="biz-name">{t.id}</div>
                      <div className="biz-desc">{t.desc}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"14px" }}>
                  <div>
                    <label style={{ display:"block", fontSize:"12px", color:muted, marginBottom:"5px" }}>Location / Address</label>
                    <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Shop address" style={inp} />
                  </div>
                  <div>
                    <label style={{ display:"block", fontSize:"12px", color:muted, marginBottom:"5px" }}>Phone number</label>
                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" style={inp} />
                  </div>
                </div>

                <div>
                  <label style={{ display:"block", fontSize:"12px", color:muted, marginBottom:"5px" }}>Working hours</label>
                  <input value={hours} onChange={e => setHours(e.target.value)} placeholder="Mon-Sat 10am-8pm, Sun 11am-6pm" style={inp} />
                </div>
              </>
            )}

            {/* STEP 1: Services */}
            {step === 1 && (
              <>
                <h2 style={{ fontSize:"18px", fontWeight:"700", marginBottom:"6px" }}>Your services</h2>
                <p style={{ color:muted, fontSize:"13px", marginBottom:"20px" }}>Select the services you offer — you can add more in settings</p>

                {services.length > 0 && (
                  <div className="svc-list" style={{ marginBottom:"16px" }}>
                    {services.map((svc, i) => (
                      <div key={i} className="svc-row">
                        <div className={"svc-check" + (svc.selected?" on":"")} onClick={() => setServices(s => s.map((x,j) => j===i ? {...x,selected:!x.selected} : x))}>
                          {svc.selected && <span style={{ color:"#000", fontSize:"12px", fontWeight:"700" }}>✓</span>}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:"13px", fontWeight:"600", color:text }}>{svc.name}</div>
                          <div style={{ fontSize:"11px", color:muted }}>₹{svc.price} · {svc.duration} min</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:"10px", padding:"14px", border:"1px solid "+border }}>
                  <div style={{ fontSize:"12px", color:muted, marginBottom:"10px", fontWeight:"600" }}>Add custom service</div>
                  <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:"8px", marginBottom:"8px" }}>
                    <input value={customSvc.name} onChange={e => setCustomSvc(s=>({...s,name:e.target.value}))} placeholder="Service name" style={{ ...inp, fontSize:12 }} />
                    <input type="number" value={customSvc.price} onChange={e => setCustomSvc(s=>({...s,price:e.target.value}))} placeholder="₹ Price" style={{ ...inp, fontSize:12 }} />
                    <input type="number" value={customSvc.duration} onChange={e => setCustomSvc(s=>({...s,duration:e.target.value}))} placeholder="Mins" style={{ ...inp, fontSize:12 }} />
                  </div>
                  <button onClick={addCustomService} disabled={!customSvc.name||!customSvc.price} style={{ padding:"8px 16px", borderRadius:"7px", border:"none", background: !customSvc.name||!customSvc.price?"rgba(255,255,255,0.1)":accent, color: !customSvc.name||!customSvc.price?muted:"#000", fontSize:"12px", fontWeight:"700", cursor: !customSvc.name||!customSvc.price?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    + Add
                  </button>
                </div>
              </>
            )}

            {/* STEP 2: AI Setup */}
            {step === 2 && (
              <>
                <h2 style={{ fontSize:"18px", fontWeight:"700", marginBottom:"6px" }}>AI configuration</h2>
                <p style={{ color:muted, fontSize:"13px", marginBottom:"20px" }}>Your AI speaks all 10 Indian languages — set your default</p>

                <label style={{ display:"block", fontSize:"12px", color:muted, marginBottom:"8px" }}>Default language</label>
                <div className="lang-grid" style={{ marginBottom:"20px" }}>
                  {LANGUAGES.map(l => (
                    <button key={l} className={"lang-btn" + (language===l?" on":"")} onClick={() => setLanguage(l)}>{l}</button>
                  ))}
                </div>

                <label style={{ display:"block", fontSize:"12px", color:muted, marginBottom:"5px" }}>
                  AI instructions <span style={{ color:"rgba(255,255,255,0.2)" }}>(optional — tell AI your rules)</span>
                </label>
                <textarea value={instructions} onChange={e => setInstructions(e.target.value)} placeholder={"Examples:\n• Always be warm and use customer's name\n• Upsell hair spa with every haircut\n• Free parking available in basement\n• Never share pricing without confirming first"} rows={5} style={{ ...inp, resize:"vertical", lineHeight:1.6 }} />

                <div style={{ marginTop:"14px", padding:"12px 14px", background:accent+"0a", border:"1px solid "+accent+"22", borderRadius:"9px", fontSize:"12px", color:muted, lineHeight:1.7 }}>
                  💡 <strong style={{ color:text }}>The more you add, the smarter your AI gets.</strong> You can always update this from Settings → AI Brain.
                </div>
              </>
            )}

            {/* STEP 3: WhatsApp */}
            {step === 3 && (
              <>
                <h2 style={{ fontSize:"18px", fontWeight:"700", marginBottom:"6px" }}>Connect WhatsApp</h2>
                <p style={{ color:muted, fontSize:"13px", marginBottom:"24px" }}>Link your WhatsApp Business account to activate AI replies</p>

                <div style={{ background:"rgba(37,211,102,0.06)", border:"1px solid rgba(37,211,102,0.2)", borderRadius:"12px", padding:"20px", marginBottom:"20px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"12px" }}>
                    <div style={{ width:"44px", height:"44px", borderRadius:"11px", background:"#25d366", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0 }}>💬</div>
                    <div>
                      <div style={{ fontWeight:"700", fontSize:"15px" }}>WhatsApp Business API</div>
                      <div style={{ color:muted, fontSize:"12px" }}>Via Meta Business Manager</div>
                    </div>
                  </div>
                  <div style={{ fontSize:"12px", color:muted, lineHeight:1.7, marginBottom:"16px" }}>
                    You'll be redirected to Facebook to authorize Fastrill to use your WhatsApp Business number. This takes about 2 minutes.
                  </div>
                  <button onClick={() => {
                    // These are public Meta app IDs — safe to be in client code
                    const appId    = process.env.NEXT_PUBLIC_META_APP_ID || "780799931531576"
                    const configId = process.env.NEXT_PUBLIC_META_CONFIG_ID || "1090960043190718"
                    const appUrl   = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
                    const redirect = encodeURIComponent(appUrl + "/api/meta/callback")
                    window.location.href = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirect}&response_type=code&config_id=${configId}`
                  }} style={{ width:"100%", padding:"12px", borderRadius:"9px", border:"none", background:"#1877f2", color:"#fff", fontWeight:"700", fontSize:"14px", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    Connect WhatsApp via Meta →
                  </button>
                </div>

                <button onClick={() => { window.location.href = "/dashboard" }} style={{ width:"100%", padding:"10px", borderRadius:"8px", border:"1px solid "+border, background:"transparent", color:muted, fontSize:"13px", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  Skip for now — connect later from Settings
                </button>
              </>
            )}

            {/* Navigation */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"24px" }}>
              {step > 0 ? (
                <button onClick={() => { setStep(s => s-1); setError("") }} style={{ padding:"10px 20px", borderRadius:"8px", border:"1px solid "+border, background:"transparent", color:muted, fontSize:"13px", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  ← Back
                </button>
              ) : <div />}

              {step < 3 && (
                <button onClick={handleNext} disabled={loading} style={{ padding:"11px 28px", borderRadius:"9px", border:"none", background: loading?"rgba(0,208,132,0.4)":accent, color:"#000", fontWeight:"700", fontSize:"14px", cursor: loading?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  {loading ? "Saving..." : step === 2 ? "Save & Connect WhatsApp →" : "Continue →"}
                </button>
              )}
            </div>
          </div>

          <p style={{ textAlign:"center", marginTop:"16px", color:muted, fontSize:"12px" }}>
            You can change everything later from the Settings page
          </p>
        </div>
      </div>
    </>
  )
}
