"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const BUSINESS_TYPES = [
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
  "Makeup Studio":      [{ name:"Party Makeup", price:2000, duration:90 },{ name:"Bridal Makeup", price:8000, duration:180 },{ name:"Hairstyling", price:1500, duration:60 }],
  "Hair Studio":        [{ name:"Haircut", price:600, duration:30 },{ name:"Keratin", price:4000, duration:180 },{ name:"Highlights", price:3000, duration:120 }],
  "Other":              [{ name:"Consultation", price:500, duration:30 },{ name:"Session", price:1000, duration:60 }],
}

const STEPS = [
  { id:1, label:"Business Type",  icon:"🏪" },
  { id:2, label:"Your Details",   icon:"📋" },
  { id:3, label:"Your Services",  icon:"✨" },
  { id:4, label:"AI Setup",       icon:"◈" },
]

export default function Onboarding() {
  const router = useRouter()
  const [userId, setUserId]   = useState(null)
  const [step, setStep]       = useState(1)
  const [saving, setSaving]   = useState(false)
  const [dark]                = useState(true)

  // Step 1
  const [bizType, setBizType] = useState("")

  // Step 2
  const [bizName, setBizName]       = useState("")
  const [bizPhone, setBizPhone]     = useState("")
  const [bizLocation, setBizLocation] = useState("")
  const [bizMaps, setBizMaps]       = useState("")
  const [bizHours, setBizHours]     = useState("Mon–Sat 9am–8pm")

  // Step 3
  const [services, setServices]     = useState([])
  const [customSvc, setCustomSvc]   = useState({ name:"", price:"", duration:"30" })

  // Step 4
  const [aiLang, setAiLang]         = useState("English")
  const [aiInstructions, setAiInstructions] = useState("")
  const [greetingMsg, setGreetingMsg] = useState("")

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) router.push("/login")
      else {
        setUserId(data.user.id)
        // Check if already onboarded
        supabase.from("business_settings").select("business_name").eq("user_id", data.user.id).maybeSingle().then(({ data: bs }) => {
          if (bs?.business_name) router.push("/dashboard")
        })
      }
    })
  }, [])

  // When biz type selected, pre-load popular services
  useEffect(() => {
    if (bizType) {
      const defaults = POPULAR_SERVICES[bizType] || []
      setServices(defaults.map((s, i) => ({ ...s, id: i, selected: true })))
    }
  }, [bizType])

  async function finish() {
    if (!bizName.trim()) return
    setSaving(true)
    try {
      // Save business settings
      await supabase.from("business_settings").upsert({
        user_id:            userId,
        business_name:      bizName.trim(),
        business_type:      bizType,
        phone:              bizPhone.trim(),
        location:           bizLocation.trim(),
        maps_link:          bizMaps.trim(),
        working_hours:      bizHours.trim(),
        ai_language:        aiLang,
        ai_instructions:    aiInstructions.trim(),
        greeting_message:   greetingMsg.trim(),
        auto_booking:       true,
        follow_up_enabled:  true,
        updated_at:         new Date().toISOString()
      }, { onConflict: "user_id" })

      // Save selected services
      const selectedSvcs = services.filter(s => s.selected)
      if (selectedSvcs.length > 0) {
        await supabase.from("services").insert(
          selectedSvcs.map(s => ({
            user_id:   userId,
            name:      s.name,
            price:     s.price,
            duration:  s.duration,
            capacity:  1,
            is_active: true,
            category:  "Other"
          }))
        )
      }

      // Sync to business_knowledge
      const knText = [
        `Business: ${bizName}`,
        `Type: ${bizType}`,
        bizPhone    ? `Phone: ${bizPhone}` : "",
        bizLocation ? `Location: ${bizLocation}` : "",
        bizMaps     ? `Maps: ${bizMaps}` : "",
        bizHours    ? `Hours: ${bizHours}` : "",
      ].filter(Boolean).join("\n")
      await supabase.from("business_knowledge").upsert(
        { user_id: userId, category: "business_info", content: knText },
        { onConflict: "user_id,category" }
      )
      if (selectedSvcs.length > 0) {
        const svcText = selectedSvcs.map(s => `${s.name}: ₹${s.price} (${s.duration} min)`).join("\n")
        await supabase.from("business_knowledge").upsert(
          { user_id: userId, category: "services", content: svcText },
          { onConflict: "user_id,category" }
        )
      }

      router.push("/dashboard?onboarded=1")
    } catch(e) {
      console.error("Onboarding save error:", e)
      setSaving(false)
    }
  }

  // Theme
  const bg        = "#08080e"
  const card      = "#0f0f1a"
  const border    = "rgba(255,255,255,0.07)"
  const cardBorder= "rgba(255,255,255,0.08)"
  const text      = "#eeeef5"
  const textMuted = "rgba(255,255,255,0.45)"
  const textFaint = "rgba(255,255,255,0.2)"
  const inputBg   = "rgba(255,255,255,0.04)"
  const accent    = "#00d084"
  const accentDim = "rgba(0,208,132,0.12)"
  const inp = { background:inputBg, border:`1px solid ${cardBorder}`, borderRadius:9, padding:"10px 13px", fontSize:13.5, color:text, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none", width:"100%" }

  const canNext = {
    1: !!bizType,
    2: !!bizName.trim(),
    3: services.some(s=>s.selected),
    4: true,
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${bg}!important;color:${text}!important;font-family:'Plus Jakarta Sans',sans-serif!important;min-height:100vh;}
        .page{min-height:100vh;background:${bg};display:flex;flex-direction:column;align-items:center;padding:32px 16px 60px;}
        .container{width:100%;max-width:680px;}
        select option{background-color:#0c0c15!important;color:#eeeef5!important;}
        select:focus{outline:none;}
        textarea:focus{outline:none;}
        input:focus{outline:none;}
        .biz-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
        @media(max-width:480px){.biz-grid{grid-template-columns:repeat(2,1fr);}}
        .biz-card{padding:14px 12px;border-radius:11px;cursor:pointer;border:1.5px solid ${cardBorder};background:${card};transition:all 0.13s;text-align:center;}
        .biz-card:hover{border-color:${accent}66;background:${accentDim};}
        .biz-card.sel{border-color:${accent};background:${accentDim};}
        .svc-row{display:flex;align-items:center;gap:10px;padding:10px 13px;border-radius:9px;border:1px solid ${cardBorder};background:${card};margin-bottom:8px;cursor:pointer;transition:all 0.12s;}
        .svc-row:hover{border-color:${accent}44;}
        .svc-row.sel{border-color:${accent}66;background:${accentDim};}
        .check{width:18px;height:18px;border-radius:5px;border:2px solid ${cardBorder};flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;transition:all 0.12s;}
        .check.on{background:${accent};border-color:${accent};color:#000;}
        .lang-btn{padding:7px 16px;border-radius:100px;font-size:12.5px;font-weight:600;cursor:pointer;border:1.5px solid ${cardBorder};background:transparent;color:${textMuted};font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.12s;}
        .lang-btn.sel{background:${accentDim};border-color:${accent}66;color:${accent};}
      `}</style>

      <div className="page">
        <div className="container">
          {/* Logo */}
          <div style={{textAlign:"center",marginBottom:36}}>
            <div style={{fontWeight:800,fontSize:26,color:text,marginBottom:6}}>
              fast<span style={{color:accent}}>rill</span>
            </div>
            <div style={{fontSize:13.5,color:textMuted}}>Set up your AI assistant in 2 minutes</div>
          </div>

          {/* Progress steps */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:0,marginBottom:36}}>
            {STEPS.map((s,i)=>(
              <div key={s.id} style={{display:"flex",alignItems:"center"}}>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                  <div style={{
                    width:36,height:36,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:14,fontWeight:700,transition:"all 0.2s",
                    background: step>s.id ? accent : step===s.id ? accentDim : inputBg,
                    border: `2px solid ${step>=s.id ? accent : cardBorder}`,
                    color: step>s.id ? "#000" : step===s.id ? accent : textFaint
                  }}>
                    {step>s.id ? "✓" : s.icon}
                  </div>
                  <div style={{fontSize:10,fontWeight:600,color:step>=s.id?accent:textFaint,whiteSpace:"nowrap"}}>{s.label}</div>
                </div>
                {i<STEPS.length-1 && (
                  <div style={{width:60,height:2,background:step>s.id?accent:cardBorder,margin:"0 6px",marginBottom:22,transition:"background 0.3s"}}/>
                )}
              </div>
            ))}
          </div>

          {/* Step cards */}
          <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:16,padding:"28px 28px 24px",marginBottom:16}}>

            {/* ── STEP 1: Business Type ── */}
            {step===1 && (
              <>
                <div style={{fontWeight:800,fontSize:20,color:text,marginBottom:6}}>What type of business are you?</div>
                <div style={{fontSize:13,color:textMuted,marginBottom:22}}>Your AI will be tuned for your industry</div>
                <div className="biz-grid">
                  {BUSINESS_TYPES.map(b=>(
                    <div key={b.id} className={`biz-card${bizType===b.id?" sel":""}`} onClick={()=>setBizType(b.id)}>
                      <div style={{fontSize:26,marginBottom:6}}>{b.icon}</div>
                      <div style={{fontWeight:700,fontSize:12.5,color:bizType===b.id?accent:text,marginBottom:2}}>{b.id}</div>
                      <div style={{fontSize:11,color:textFaint}}>{b.desc}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── STEP 2: Business Details ── */}
            {step===2 && (
              <>
                <div style={{fontWeight:800,fontSize:20,color:text,marginBottom:6}}>Tell us about your business</div>
                <div style={{fontSize:13,color:textMuted,marginBottom:22}}>Your AI uses this to answer customer questions</div>
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  <div>
                    <div style={{fontSize:12,color:textMuted,marginBottom:5,fontWeight:600}}>Business Name *</div>
                    <input placeholder={`e.g. ${bizType==="Salon"?"Priya Hair Studio":"My Business"}`} value={bizName} onChange={e=>setBizName(e.target.value)} style={inp}/>
                  </div>
                  <div>
                    <div style={{fontSize:12,color:textMuted,marginBottom:5,fontWeight:600}}>WhatsApp Phone Number</div>
                    <input placeholder="+91 98765 43210" value={bizPhone} onChange={e=>setBizPhone(e.target.value)} style={inp}/>
                  </div>
                  <div>
                    <div style={{fontSize:12,color:textMuted,marginBottom:5,fontWeight:600}}>Location / Address</div>
                    <input placeholder="Shop 12, MG Road, Bangalore" value={bizLocation} onChange={e=>setBizLocation(e.target.value)} style={inp}/>
                  </div>
                  <div>
                    <div style={{fontSize:12,color:textMuted,marginBottom:5,fontWeight:600}}>Google Maps Link <span style={{color:textFaint,fontWeight:400}}>(optional)</span></div>
                    <input placeholder="https://maps.google.com/..." value={bizMaps} onChange={e=>setBizMaps(e.target.value)} style={inp}/>
                  </div>
                  <div>
                    <div style={{fontSize:12,color:textMuted,marginBottom:5,fontWeight:600}}>Working Hours</div>
                    <input placeholder="Mon–Sat 9am–8pm, Sunday Closed" value={bizHours} onChange={e=>setBizHours(e.target.value)} style={inp}/>
                  </div>
                </div>
              </>
            )}

            {/* ── STEP 3: Services ── */}
            {step===3 && (
              <>
                <div style={{fontWeight:800,fontSize:20,color:text,marginBottom:6}}>Your services & prices</div>
                <div style={{fontSize:13,color:textMuted,marginBottom:22}}>Select the ones you offer — AI uses these for booking & pricing queries</div>

                {services.map((s,i)=>(
                  <div key={i} className={`svc-row${s.selected?" sel":""}`} onClick={()=>setServices(prev=>prev.map((sv,j)=>j===i?{...sv,selected:!sv.selected}:sv))}>
                    <div className={`check${s.selected?" on":""}`}>{s.selected?"✓":""}</div>
                    <div style={{flex:1,fontWeight:600,fontSize:13,color:text}}>{s.name}</div>
                    <div style={{fontSize:12,color:textFaint}}>{s.duration} min</div>
                    <div style={{fontWeight:700,fontSize:13,color:accent,minWidth:60,textAlign:"right"}}>₹{s.price.toLocaleString()}</div>
                  </div>
                ))}

                {/* Add custom service */}
                <div style={{marginTop:14,padding:"13px 14px",background:inputBg,border:`1px solid ${cardBorder}`,borderRadius:10}}>
                  <div style={{fontSize:11.5,color:textFaint,fontWeight:600,marginBottom:10}}>+ ADD CUSTOM SERVICE</div>
                  <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:8,marginBottom:8}}>
                    <input placeholder="Service name" value={customSvc.name} onChange={e=>setCustomSvc(p=>({...p,name:e.target.value}))} style={{...inp,padding:"7px 10px",fontSize:12.5}}/>
                    <input placeholder="₹ Price" type="number" value={customSvc.price} onChange={e=>setCustomSvc(p=>({...p,price:e.target.value}))} style={{...inp,padding:"7px 10px",fontSize:12.5}}/>
                    <input placeholder="Min" type="number" value={customSvc.duration} onChange={e=>setCustomSvc(p=>({...p,duration:e.target.value}))} style={{...inp,padding:"7px 10px",fontSize:12.5}}/>
                  </div>
                  <button
                    onClick={()=>{
                      if(!customSvc.name.trim()||!customSvc.price) return
                      setServices(prev=>[...prev,{name:customSvc.name.trim(),price:parseInt(customSvc.price)||0,duration:parseInt(customSvc.duration)||30,selected:true,id:Date.now()}])
                      setCustomSvc({name:"",price:"",duration:"30"})
                    }}
                    disabled={!customSvc.name.trim()||!customSvc.price}
                    style={{width:"100%",padding:"8px",background:(!customSvc.name||!customSvc.price)?inputBg:accentDim,border:`1px solid ${(!customSvc.name||!customSvc.price)?cardBorder:accent+"44"}`,borderRadius:8,color:(!customSvc.name||!customSvc.price)?textFaint:accent,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                    Add Service
                  </button>
                </div>
              </>
            )}

            {/* ── STEP 4: AI Setup ── */}
            {step===4 && (
              <>
                <div style={{fontWeight:800,fontSize:20,color:text,marginBottom:6}}>Configure your AI assistant</div>
                <div style={{fontSize:13,color:textMuted,marginBottom:22}}>Fine-tune how it talks to your customers</div>

                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  <div>
                    <div style={{fontSize:12,color:textMuted,marginBottom:8,fontWeight:600}}>Reply Language</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                      {["English","Hindi","Telugu","Tamil","Kannada","Malayalam","Marathi"].map(l=>(
                        <button key={l} className={`lang-btn${aiLang===l?" sel":""}`} onClick={()=>setAiLang(l)}>{l}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{fontSize:12,color:textMuted,marginBottom:5,fontWeight:600}}>
                      Custom Greeting <span style={{fontWeight:400,color:textFaint}}>(sent to new customers)</span>
                    </div>
                    <textarea
                      placeholder={`Hi {name}! Welcome to ${bizName||"our salon"} 😊 How can I help you today?`}
                      value={greetingMsg}
                      onChange={e=>setGreetingMsg(e.target.value)}
                      rows={3}
                      style={{...inp,resize:"vertical",lineHeight:1.6}}
                    />
                  </div>

                  <div>
                    <div style={{fontSize:12,color:textMuted,marginBottom:5,fontWeight:600}}>
                      Special Instructions <span style={{fontWeight:400,color:textFaint}}>(optional)</span>
                    </div>
                    <textarea
                      placeholder={`Examples:\n• Always be warm and professional\n• Upsell hair spa with every haircut\n• Never mention competitor salons`}
                      value={aiInstructions}
                      onChange={e=>setAiInstructions(e.target.value)}
                      rows={4}
                      style={{...inp,resize:"vertical",lineHeight:1.6}}
                    />
                  </div>

                  {/* Preview what AI knows */}
                  <div style={{background:accentDim,border:`1px solid ${accent}33`,borderRadius:10,padding:"13px 15px"}}>
                    <div style={{fontSize:11,fontWeight:700,color:accent,marginBottom:8,letterSpacing:"0.5px"}}>◈ YOUR AI WILL KNOW</div>
                    {[
                      bizName     && `Business: ${bizName}`,
                      bizType     && `Type: ${bizType}`,
                      bizLocation && `Location: ${bizLocation}`,
                      bizHours    && `Hours: ${bizHours}`,
                      services.filter(s=>s.selected).length>0 && `${services.filter(s=>s.selected).length} services with prices`,
                      `Language: ${aiLang}`,
                    ].filter(Boolean).map((item,i)=>(
                      <div key={i} style={{fontSize:12,color:textMuted,marginBottom:3}}>✓ {item}</div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Navigation */}
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            {step>1 && (
              <button onClick={()=>setStep(s=>s-1)} style={{padding:"12px 22px",background:inputBg,border:`1px solid ${cardBorder}`,borderRadius:10,color:textMuted,fontWeight:600,fontSize:13.5,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                ← Back
              </button>
            )}
            <button
              onClick={step===4 ? finish : ()=>setStep(s=>s+1)}
              disabled={!canNext[step]||saving}
              style={{flex:1,padding:"13px",background:canNext[step]?accent:inputBg,border:`1px solid ${canNext[step]?accent:cardBorder}`,borderRadius:10,color:canNext[step]?"#000":textFaint,fontWeight:800,fontSize:14,cursor:canNext[step]?"pointer":"not-allowed",fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"all 0.15s"}}>
              {saving ? "Setting up your AI..." : step===4 ? "🚀 Launch my AI assistant" : `Continue → (${step}/4)`}
            </button>
          </div>

          {step===1 && (
            <div style={{textAlign:"center",marginTop:16,fontSize:12,color:textFaint}}>
              Already set up? <span onClick={()=>router.push("/dashboard")} style={{color:accent,cursor:"pointer",fontWeight:600}}>Go to dashboard →</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
