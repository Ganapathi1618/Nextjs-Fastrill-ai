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

const TEMPLATES = [
  { id:"offer",    label:"Special Offer 🎉", text:"Hi {name}! 🎉 Special offer just for you — get 20% off your next visit this week!\n\nBook now: Reply BOOK\n\n{business}" },
  { id:"reminder", label:"Appointment Reminder ⏰", text:"Hi {name}! ⏰ Just a reminder about your upcoming appointment.\n\nSee you soon at {business}! 😊\nReply RESCHEDULE if you need to change." },
  { id:"winback",  label:"Win Back 💔",  text:"Hi {name}! We miss you 😊 It's been a while since your last visit.\n\nCome back this week and get a special treat on us! 🎁\n\nReply BOOK to schedule. — {business}" },
  { id:"festival", label:"Festival Greetings 🪔", text:"Hi {name}! Wishing you a wonderful celebration! 🪔✨\n\nTreat yourself this festive season — book a special session at {business}!\n\nReply BOOK to schedule 😊" },
  { id:"review",   label:"Ask for Review ⭐", text:"Hi {name}! Thank you for visiting {business} 😊\n\nWe'd love to hear your feedback! Could you spare 2 minutes for a quick review?\n\nYour feedback helps us serve you better 🙏" },
  { id:"custom",   label:"Custom Message ✏️", text:"" },
]

const SEGMENTS = [
  { id:"all",        label:"All Customers",    desc:"Everyone who has messaged you" },
  { id:"new_lead",   label:"New Leads",        desc:"First-time contacts, haven't booked yet" },
  { id:"returning",  label:"Returning Customers", desc:"Have booked 2+ times" },
  { id:"vip",        label:"VIP Customers",    desc:"Tagged as VIP" },
  { id:"inactive",   label:"Inactive",         desc:"Haven't visited in 30+ days" },
]

export default function Campaigns() {
  const router = useRouter()
  const [userEmail, setUserEmail]   = useState("")
  const [userId, setUserId]         = useState(null)
  const [dark, setDark]             = useState(true)
  const [customers, setCustomers]   = useState([])
  const [whatsapp, setWhatsapp]     = useState(null)
  const [biz, setBiz]               = useState(null)
  const [loading, setLoading]       = useState(true)
  const [sending, setSending]       = useState(false)
  const [sent, setSent]             = useState(0)
  const [failed, setFailed]         = useState(0)
  const [step, setStep]             = useState("compose") // compose | preview | sending | done
  const [selectedTemplate, setSelectedTemplate] = useState("offer")
  const [segment, setSegment]       = useState("all")
  const [message, setMessage]       = useState(TEMPLATES[0].text)
  const [campaignName, setCampaignName] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) router.push("/login")
      else { setUserEmail(data.user.email||""); setUserId(data.user.id) }
    })
  }, [])

  useEffect(() => { if (userId) loadData() }, [userId])

  async function loadData() {
    setLoading(true)
    const [{ data: custs }, { data: wa }, { data: bizData }] = await Promise.all([
      supabase.from("customers").select("id,name,phone,tag,last_visit_at,created_at").eq("user_id", userId),
      supabase.from("whatsapp_connections").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("business_settings").select("business_name").eq("user_id", userId).maybeSingle(),
    ])
    setCustomers(custs || [])
    setWhatsapp(wa || null)
    setBiz(bizData || null)
    setLoading(false)
  }

  function getAudience() {
    const now = new Date()
    const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate()-30)
    return customers.filter(c => {
      if (segment==="all") return true
      if (segment==="new_lead") return c.tag==="new_lead"
      if (segment==="returning") return c.tag==="returning"
      if (segment==="vip") return c.tag==="vip"
      if (segment==="inactive") {
        const last = new Date(c.last_visit_at || c.created_at)
        return last < thirtyDaysAgo
      }
      return true
    }).filter(c => c.phone) // must have phone
  }

  function personalise(text, customer) {
    const firstName = (customer.name || "there").split(" ")[0]
    const businessName = biz?.business_name || "us"
    return text
      .replace(/\{name\}/g, firstName)
      .replace(/\{business\}/g, businessName)
  }

  async function sendCampaign() {
    if (!message.trim()) return
    const audience = getAudience()
    if (audience.length===0) return
    setSending(true)
    setSent(0); setFailed(0)
    setStep("sending")

    let sentCount=0, failCount=0

    for (const customer of audience) {
      try {
        const personalised = personalise(message, customer)

        // Send via our webhook endpoint (uses stored WA token)
        const res = await fetch("/api/campaigns/send", {
          method: "POST",
          headers: { "Content-Type":"application/json" },
          body: JSON.stringify({
            phone: customer.phone,
            message: personalised,
            userId,
          })
        })

        if (res.ok) {
          sentCount++
          setSent(sentCount)
        } else {
          failCount++
          setFailed(failCount)
        }

        // Rate limit: 1 message per second (WhatsApp allows ~80/min)
        await new Promise(r => setTimeout(r, 1200))

      } catch(e) {
        failCount++
        setFailed(failCount)
      }
    }

    // Log campaign
    try {
      await supabase.from("campaigns").insert({
        user_id: userId,
        name: campaignName || `Campaign ${new Date().toLocaleDateString("en-IN")}`,
        segment,
        message,
        sent_count: sentCount,
        failed_count: failCount,
        status: "completed",
        created_at: new Date().toISOString()
      })
    } catch(e) { /* campaigns table may not exist yet */ }

    setSending(false)
    setStep("done")
  }

  const toggleTheme = () => { const n=!dark; setDark(n); localStorage.setItem("fastrill-theme",n?"dark":"light") }
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login") }

  const bg=dark?"#08080e":"#f0f2f5", sidebar=dark?"#0c0c15":"#ffffff", card=dark?"#0f0f1a":"#ffffff"
  const border=dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.08)", cardBorder=dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.09)"
  const text=dark?"#eeeef5":"#111827", textMuted=dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const textFaint=dark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.25)", inputBg=dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"
  const accent=dark?"#00d084":"#00935a"
  const navText=dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const navActive=dark?"rgba(0,196,125,0.1)":"rgba(0,180,115,0.08)"
  const navActiveBorder=dark?"rgba(0,196,125,0.2)":"rgba(0,180,115,0.2)"
  const navActiveText=dark?"#00c47d":"#00935a"
  const accentDim=dark?"rgba(0,208,132,0.12)":"rgba(0,147,90,0.1)"
  const userInitial = userEmail?userEmail[0].toUpperCase():"G"
  const inp = { background:inputBg, border:`1px solid ${cardBorder}`, borderRadius:8, padding:"9px 12px", fontSize:13, color:text, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none", width:"100%" }

  const audience = getAudience()
  const previewCustomer = audience[0] || { name:"Customer", phone:"" }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${bg}!important;color:${text}!important;font-family:'Plus Jakarta Sans',sans-serif!important;}
        .wrap{display:flex;height:100vh;overflow:hidden;}
        .sidebar{width:224px;flex-shrink:0;background:${sidebar};border-right:1px solid ${border};display:flex;flex-direction:column;overflow-y:auto;}
        .logo{padding:22px 20px 18px;font-weight:800;font-size:20px;color:${text};text-decoration:none;display:block;border-bottom:1px solid ${border};}
        .logo span{color:${accent};}
        .nav-section{padding:18px 16px 7px;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${textFaint};font-weight:600;}
        .nav-item{display:flex;align-items:center;gap:9px;padding:9px 12px;margin:1px 8px;border-radius:8px;cursor:pointer;font-size:13.5px;color:${navText};font-weight:500;transition:all 0.13s;border:1px solid transparent;background:none;width:calc(100% - 16px);text-align:left;font-family:'Plus Jakarta Sans',sans-serif;}
        .nav-item:hover{background:${inputBg};color:${text};}
        .nav-item.active{background:${navActive};color:${navActiveText};font-weight:600;border-color:${navActiveBorder};}
        .nav-icon{font-size:13px;width:18px;text-align:center;flex-shrink:0;}
        .sidebar-footer{margin-top:auto;padding:14px;border-top:1px solid ${border};}
        .user-card{display:flex;align-items:center;gap:9px;padding:9px;border-radius:9px;background:${inputBg};border:1px solid ${cardBorder};}
        .user-avatar{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,${accent},#0ea5e9);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#fff;flex-shrink:0;}
        .user-email{font-size:11.5px;color:${textMuted};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .logout-btn{margin-top:7px;width:100%;padding:7px;border-radius:7px;background:transparent;border:1px solid ${cardBorder};font-size:12px;color:${textMuted};cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .logout-btn:hover{border-color:#fca5a5;color:#ef4444;}
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .topbar{height:54px;flex-shrink:0;border-bottom:1px solid ${border};display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:${sidebar};}
        .tb-title{font-weight:700;font-size:15px;color:${text};}
        .topbar-r{display:flex;align-items:center;gap:8px;}
        .theme-toggle{display:flex;align-items:center;gap:6px;padding:5px 10px;background:${inputBg};border:1px solid ${cardBorder};border-radius:8px;cursor:pointer;font-size:11.5px;color:${textMuted};font-family:'Plus Jakarta Sans',sans-serif;}
        .toggle-pill{width:30px;height:16px;border-radius:100px;background:${dark?accent:"#d1d5db"};position:relative;flex-shrink:0;}
        .toggle-pill::after{content:'';position:absolute;top:2px;width:12px;height:12px;border-radius:50%;background:#fff;left:${dark?"16px":"2px"};}
        .content{flex:1;overflow-y:auto;padding:20px 24px;background:${bg};}
        .tmpl-card{padding:10px 13px;border-radius:9px;cursor:pointer;border:1px solid transparent;transition:all 0.12s;margin-bottom:6px;}
        .tmpl-card:hover{background:${inputBg};}
      `}</style>

      <div className="wrap">
        <aside className="sidebar">
          <a href="/dashboard" className="logo">fast<span>rill</span></a>
          <div className="nav-section">Platform</div>
          {NAV.map(item => (
            <button key={item.id} className={`nav-item${item.id==="campaigns"?" active":""}`} onClick={() => router.push(item.path)}>
              <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
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
            <span className="tb-title">Campaigns</span>
            <div className="topbar-r">
              <button className="theme-toggle" onClick={toggleTheme}>
                <span>{dark?"🌙":"☀️"}</span><div className="toggle-pill"/><span>{dark?"Dark":"Light"}</span>
              </button>
            </div>
          </div>

          <div className="content">
            {/* No WhatsApp warning */}
            {!loading && !whatsapp && (
              <div style={{background:"rgba(251,113,133,0.08)",border:"1px solid rgba(251,113,133,0.25)",borderRadius:11,padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:20}}>⚠️</span>
                <div>
                  <div style={{fontWeight:700,fontSize:13,color:"#fb7185"}}>WhatsApp not connected</div>
                  <div style={{fontSize:12,color:textMuted}}>Connect WhatsApp in Settings to send campaigns</div>
                </div>
                <button onClick={()=>router.push("/dashboard/settings")} style={{marginLeft:"auto",padding:"6px 14px",borderRadius:8,background:"rgba(251,113,133,0.1)",border:"1px solid rgba(251,113,133,0.25)",color:"#fb7185",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  Go to Settings →
                </button>
              </div>
            )}

            {step==="done" ? (
              /* Done screen */
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:16}}>
                <div style={{fontSize:52}}>🎉</div>
                <div style={{fontWeight:800,fontSize:22,color:text}}>Campaign Sent!</div>
                <div style={{display:"flex",gap:20,margin:"8px 0"}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:32,fontWeight:800,color:accent}}>{sent}</div>
                    <div style={{fontSize:12,color:textMuted}}>Delivered</div>
                  </div>
                  {failed>0&&<div style={{textAlign:"center"}}>
                    <div style={{fontSize:32,fontWeight:800,color:"#fb7185"}}>{failed}</div>
                    <div style={{fontSize:12,color:textMuted}}>Failed</div>
                  </div>}
                </div>
                <button onClick={()=>{ setStep("compose"); setSent(0); setFailed(0) }} style={{padding:"10px 28px",borderRadius:9,background:accent,border:"none",color:"#000",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  Send Another Campaign
                </button>
              </div>
            ) : step==="sending" ? (
              /* Sending screen */
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:16}}>
                <div style={{fontSize:40}}>📤</div>
                <div style={{fontWeight:800,fontSize:18,color:text}}>Sending Campaign...</div>
                <div style={{fontSize:13,color:textMuted}}>Please keep this tab open</div>
                <div style={{display:"flex",gap:20,margin:"8px 0"}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:32,fontWeight:800,color:accent}}>{sent}</div>
                    <div style={{fontSize:12,color:textMuted}}>Sent</div>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:32,fontWeight:800,color:textMuted}}>{audience.length-sent-failed}</div>
                    <div style={{fontSize:12,color:textMuted}}>Remaining</div>
                  </div>
                  {failed>0&&<div style={{textAlign:"center"}}>
                    <div style={{fontSize:32,fontWeight:800,color:"#fb7185"}}>{failed}</div>
                    <div style={{fontSize:12,color:textMuted}}>Failed</div>
                  </div>}
                </div>
                {/* Progress bar */}
                <div style={{width:300,height:6,borderRadius:100,background:dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)"}}>
                  <div style={{height:6,borderRadius:100,background:accent,width:`${audience.length>0?Math.round(((sent+failed)/audience.length)*100):0}%`,transition:"width 0.5s"}}/>
                </div>
              </div>
            ) : (
              /* Compose screen */
              <div style={{display:"grid",gridTemplateColumns:"280px 1fr 280px",gap:16,maxWidth:1100}}>

                {/* Templates */}
                <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:16}}>
                  <div style={{fontWeight:700,fontSize:13,color:text,marginBottom:12}}>Templates</div>
                  {TEMPLATES.map(t=>(
                    <div key={t.id} className="tmpl-card"
                      onClick={()=>{ setSelectedTemplate(t.id); if(t.text) setMessage(t.text) }}
                      style={{background:selectedTemplate===t.id?accentDim:"transparent",border:`1px solid ${selectedTemplate===t.id?accent+"44":cardBorder}`}}>
                      <div style={{fontWeight:600,fontSize:12.5,color:selectedTemplate===t.id?accent:text}}>{t.label}</div>
                    </div>
                  ))}

                  <div style={{marginTop:16,padding:"11px 13px",background:inputBg,borderRadius:9}}>
                    <div style={{fontSize:10.5,fontWeight:700,color:textFaint,marginBottom:6}}>VARIABLES</div>
                    {[["{name}","Customer's first name"],["{business}","Your business name"]].map(([v,d])=>(
                      <div key={v} style={{marginBottom:5}}>
                        <code style={{fontSize:11,color:accent,fontWeight:700}}>{v}</code>
                        <div style={{fontSize:10.5,color:textFaint}}>{d}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compose */}
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:18}}>
                    <div style={{fontWeight:700,fontSize:13,color:text,marginBottom:12}}>Compose Message</div>
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>Campaign Name</div>
                      <input placeholder="e.g. Diwali Offer 2026" value={campaignName} onChange={e=>setCampaignName(e.target.value)} style={inp}/>
                    </div>
                    <div>
                      <div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>Message <span style={{color:textFaint}}>({message.length} chars)</span></div>
                      <textarea
                        value={message}
                        onChange={e=>setMessage(e.target.value)}
                        rows={8}
                        placeholder="Type your message here... Use {name} and {business} as variables"
                        style={{...inp,resize:"vertical",lineHeight:1.6,minHeight:160}}
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:18}}>
                    <div style={{fontWeight:700,fontSize:13,color:text,marginBottom:12}}>Preview <span style={{fontSize:11,color:textFaint,fontWeight:400}}>for {previewCustomer.name}</span></div>
                    <div style={{background:dark?"#1a1a2e":"#e5ddd5",borderRadius:10,padding:12}}>
                      <div style={{background:dark?"#2a2a3e":"#ffffff",borderRadius:"4px 12px 12px 12px",padding:"10px 13px",maxWidth:"85%",display:"inline-block"}}>
                        <div style={{fontSize:12.5,color:dark?"#eee":"#111",lineHeight:1.7,whiteSpace:"pre-wrap"}}>
                          {personalise(message, previewCustomer) || <span style={{color:textFaint,fontStyle:"italic"}}>Type your message above...</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audience + Send */}
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:18}}>
                    <div style={{fontWeight:700,fontSize:13,color:text,marginBottom:12}}>Audience</div>
                    {SEGMENTS.map(s=>(
                      <div key={s.id} onClick={()=>setSegment(s.id)}
                        style={{padding:"9px 11px",borderRadius:8,cursor:"pointer",border:`1px solid ${segment===s.id?accent+"44":cardBorder}`,background:segment===s.id?accentDim:"transparent",marginBottom:6}}>
                        <div style={{fontWeight:600,fontSize:12.5,color:segment===s.id?accent:text}}>{s.label}</div>
                        <div style={{fontSize:11,color:textFaint,marginTop:1}}>{s.desc}</div>
                      </div>
                    ))}
                  </div>

                  {/* Audience count */}
                  <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:18}}>
                    <div style={{fontWeight:700,fontSize:13,color:text,marginBottom:8}}>Ready to send</div>
                    <div style={{fontSize:32,fontWeight:800,color:accent,marginBottom:4}}>{audience.length}</div>
                    <div style={{fontSize:12,color:textMuted,marginBottom:14}}>recipients in this segment</div>

                    {audience.length>0 && (
                      <div style={{marginBottom:14,maxHeight:100,overflowY:"auto"}}>
                        {audience.slice(0,5).map(c=>(
                          <div key={c.id} style={{fontSize:11,color:textFaint,padding:"2px 0"}}>{c.name} · {c.phone}</div>
                        ))}
                        {audience.length>5&&<div style={{fontSize:11,color:textFaint}}>+{audience.length-5} more</div>}
                      </div>
                    )}

                    {/* Warning */}
                    <div style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:8,padding:"8px 10px",fontSize:11,color:"#f59e0b",marginBottom:14,lineHeight:1.5}}>
                      ⚠️ Only send to customers who have messaged you first (WhatsApp policy).
                    </div>

                    <button
                      onClick={sendCampaign}
                      disabled={!whatsapp||audience.length===0||!message.trim()||sending}
                      style={{width:"100%",padding:"11px",background:(!whatsapp||audience.length===0||!message.trim())?inputBg:accent,border:`1px solid ${(!whatsapp||audience.length===0||!message.trim())?cardBorder:accent}`,borderRadius:9,color:(!whatsapp||audience.length===0||!message.trim())?textMuted:"#000",fontWeight:700,fontSize:13,cursor:(!whatsapp||audience.length===0||!message.trim())?"not-allowed":"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                      {!whatsapp?"Connect WhatsApp First":audience.length===0?"No recipients":sending?"Sending...":"🚀 Send Campaign"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
