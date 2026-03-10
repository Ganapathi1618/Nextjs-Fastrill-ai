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

const TEMPLATES = [
  { id:"t1", name:"Festival Offer", goal:"Booking", msg:"Hi [Name] 👋 This [FESTIVAL], get [DISCOUNT]% off on [SERVICE]! 🎉\nOnly [SLOTS] slots left. Book now → [BOOKING LINK]" },
  { id:"t2", name:"Win Back Inactive", goal:"Re-engagement", msg:"Hi [Name] 😊 We miss you!\nIt's been a while — come back this week and get ₹[DISCOUNT] off your next visit. Book here → [BOOKING LINK]" },
  { id:"t3", name:"New Service Launch", goal:"Awareness", msg:"Hi [Name] ✨ We just launched our new [SERVICE NAME]!\nStarting at just ₹[PRICE]. Be the first to try it 💫\nBook → [BOOKING LINK]" },
  { id:"t4", name:"VIP Exclusive", goal:"Upsell", msg:"Hi [Name] 🌟 As one of our VIP customers, you get early access to our new [SERVICE] package!\nExclusive price ₹[PRICE] — only for you. Book → [BOOKING LINK]" },
  { id:"t5", name:"Appointment Reminder", goal:"Reminder", msg:"Hi [Name] ⏰ Reminder: You have an appointment tomorrow at [TIME] for [SERVICE].\nLooking forward to seeing you! 😊" },
]

export default function Campaigns() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [userId, setUserId] = useState(null)
  const [dark, setDark] = useState(true)
  const [campaigns, setCampaigns] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState("list") // list | create | sending
  const [selected, setSelected] = useState(null)

  // Create form
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [audience, setAudience] = useState("all") // all | vip | inactive | new_lead
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [preview, setPreview] = useState([])
  const [sending, setSending] = useState(false)
  const [sendProgress, setSendProgress] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login")
      else { setUserEmail(data.user.email||""); setUserId(data.user.id) }
    })
  }, [])

  useEffect(() => { if (userId) { loadCampaigns(); loadCustomers() } }, [userId])

  useEffect(() => {
    if (!customers.length) return
    const filtered = audience==="all" ? customers
      : customers.filter(c=>c.tag===audience)
    setPreview(filtered.slice(0,5))
  }, [audience, customers])

  async function loadCampaigns() {
    setLoading(true)
    const { data } = await supabase.from("campaigns").select("*").eq("user_id", userId).order("created_at", { ascending: false })
    setCampaigns(data||[])
    setLoading(false)
  }

  async function loadCustomers() {
    const { data } = await supabase.from("customers").select("name,phone,tag").eq("user_id", userId)
    setCustomers(data||[])
  }

  async function sendCampaign() {
    if (!name || !message) return alert("Fill in campaign name and message")
    setSending(true)
    setStep("sending")

    // Get whatsapp connection
    const { data: conn } = await supabase.from("whatsapp_connections").select("access_token, phone_number_id").eq("user_id", userId).single()
    if (!conn) { alert("WhatsApp not connected"); setSending(false); setStep("create"); return }

    // Get audience
    let query = supabase.from("customers").select("name,phone").eq("user_id", userId)
    if (audience!=="all") query = query.eq("tag", audience)
    const { data: recipients } = await query

    if (!recipients?.length) { alert("No customers in this audience"); setSending(false); setStep("create"); return }

    // Save campaign
    const { data: campaign } = await supabase.from("campaigns").insert({
      user_id: userId, name, message, audience_filter: audience,
      recipient_count: recipients.length, status: "sending",
      created_at: new Date().toISOString()
    }).select().single()

    let sent = 0
    for (const customer of recipients) {
      const personalMsg = message.replace(/\[Name\]/gi, customer.name?.split(" ")[0]||"there")
      const phone = (customer.phone||"").replace("+","").replace(/\s/g,"")
      try {
        await fetch(`https://graph.facebook.com/v18.0/${conn.phone_number_id}/messages`, {
          method:"POST",
          headers:{"Authorization":`Bearer ${conn.access_token}`,"Content-Type":"application/json"},
          body:JSON.stringify({messaging_product:"whatsapp",to:phone,type:"text",text:{body:personalMsg}})
        })
        await supabase.from("campaign_recipients").insert({ campaign_id:campaign.id, user_id:userId, customer_phone:customer.phone, status:"sent" })
        sent++
        setSendProgress(Math.round((sent/recipients.length)*100))
        await new Promise(r=>setTimeout(r,500)) // Rate limit: 2/sec
      } catch(e) {
        await supabase.from("campaign_recipients").insert({ campaign_id:campaign.id, user_id:userId, customer_phone:customer.phone, status:"failed" })
      }
    }

    await supabase.from("campaigns").update({ status:"completed", sent_count:sent }).eq("id", campaign.id)
    setSending(false)
    await loadCampaigns()
    setStep("list")
    setName(""); setMessage(""); setAudience("all"); setSelectedTemplate(null)
  }

  const toggleTheme = () => { const n=!dark; setDark(n); localStorage.setItem("fastrill-theme",n?"dark":"light") }
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login") }

  const bg=dark?"#08080e":"#f0f2f5", sidebar=dark?"#0c0c15":"#ffffff", card=dark?"#0f0f1a":"#ffffff"
  const border=dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.08)", cardBorder=dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.09)"
  const text=dark?"#eeeef5":"#111827", textMuted=dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const textFaint=dark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.25)", inputBg=dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"
  const accent=dark?"#00d084":"#00935a", navText=dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const navActive=dark?"rgba(0,196,125,0.1)":"rgba(0,180,115,0.08)", navActiveBorder=dark?"rgba(0,196,125,0.2)":"rgba(0,180,115,0.2)"
  const navActiveText=dark?"#00c47d":"#00935a", accentDim=dark?"rgba(0,208,132,0.12)":"rgba(0,147,90,0.1)"
  const userInitial=userEmail?userEmail[0].toUpperCase():"G"
  const inp = { background:inputBg, border:`1px solid ${cardBorder}`, borderRadius:8, padding:"9px 12px", fontSize:13, color:text, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none", width:"100%" }

  const audienceCounts = { all:customers.length, vip:customers.filter(c=>c.tag==="vip").length, inactive:customers.filter(c=>c.tag==="inactive").length, new_lead:customers.filter(c=>c.tag==="new_lead").length }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${bg}!important;color:${text}!important;font-family:'Plus Jakarta Sans',sans-serif!important;}
        .wrap{display:flex;height:100vh;overflow:hidden;background:${bg};}
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
      `}</style>

      <div className="wrap">
        <aside className="sidebar">
          <a href="/dashboard" className="logo">fast<span>rill</span></a>
          <div className="nav-section">Platform</div>
          {NAV.map(item=>(
            <button key={item.id} className={`nav-item${item.id==="campaigns"?" active":""}`} onClick={()=>router.push(item.path)}>
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
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              {step!=="list" && <button onClick={()=>setStep("list")} style={{background:"transparent",border:"none",color:textMuted,cursor:"pointer",fontSize:18}}>←</button>}
              <span className="tb-title">{step==="list"?"Campaigns":step==="sending"?"Sending...":"New Campaign"}</span>
            </div>
            <div className="topbar-r">
              {step==="list" && <button onClick={()=>setStep("create")} style={{background:accent,color:"#000",border:"none",padding:"7px 16px",borderRadius:8,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>+ New Campaign</button>}
              <button className="theme-toggle" onClick={toggleTheme}>
                <span>{dark?"🌙":"☀️"}</span><div className="toggle-pill"/><span>{dark?"Dark":"Light"}</span>
              </button>
            </div>
          </div>

          <div className="content">

            {/* SENDING SCREEN */}
            {step==="sending" && (
              <div style={{maxWidth:480,margin:"60px auto",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
                <div style={{fontSize:48}}>📲</div>
                <div style={{fontWeight:800,fontSize:20,color:text}}>Sending Campaign</div>
                <div style={{fontSize:13,color:textMuted}}>Sending "{name}" to your customers...</div>
                <div style={{width:"100%",height:8,background:inputBg,borderRadius:100,overflow:"hidden"}}>
                  <div style={{height:"100%",background:`linear-gradient(90deg,${accent},#38bdf8)`,borderRadius:100,width:`${sendProgress}%`,transition:"width 0.3s"}}/>
                </div>
                <div style={{fontWeight:700,fontSize:24,color:accent}}>{sendProgress}%</div>
                <div style={{fontSize:12,color:textFaint}}>Please don't close this window</div>
              </div>
            )}

            {/* CREATE SCREEN */}
            {step==="create" && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 360px",gap:20,maxWidth:1100}}>
                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  {/* Templates */}
                  <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:18}}>
                    <div style={{fontWeight:700,fontSize:13.5,color:text,marginBottom:12}}>Templates</div>
                    <div style={{display:"flex",flexDirection:"column",gap:7}}>
                      {TEMPLATES.map(t=>(
                        <div key={t.id} onClick={()=>{setSelectedTemplate(t.id);setMessage(t.msg)}}
                          style={{padding:"11px 13px",background:selectedTemplate===t.id?accentDim:inputBg,border:`1px solid ${selectedTemplate===t.id?accent+"44":cardBorder}`,borderRadius:9,cursor:"pointer",transition:"all 0.12s"}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                            <span style={{fontWeight:600,fontSize:13,color:text}}>{t.name}</span>
                            <span style={{fontSize:10,fontWeight:700,color:"#a78bfa",background:"rgba(167,139,250,0.12)",padding:"2px 7px",borderRadius:100,border:"1px solid rgba(167,139,250,0.2)"}}>{t.goal}</span>
                          </div>
                          <div style={{fontSize:11.5,color:textMuted,lineHeight:1.4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.msg.split("\n")[0]}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Compose */}
                  <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:18}}>
                    <div style={{fontWeight:700,fontSize:13.5,color:text,marginBottom:12}}>Compose</div>
                    <div style={{display:"flex",flexDirection:"column",gap:12}}>
                      <div><div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>Campaign Name</div><input placeholder="e.g. Diwali Offer 2026" value={name} onChange={e=>setName(e.target.value)} style={inp}/></div>
                      <div><div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>Message <span style={{color:textFaint}}>(use [Name] for personalisation)</span></div>
                        <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Hi [Name] 👋 ..."
                          style={{...inp,resize:"vertical",minHeight:130,lineHeight:1.6}}/>
                      </div>
                      <div style={{fontSize:11,color:textFaint}}>Character count: {message.length} · Estimated parts: {Math.ceil(message.length/160)}</div>
                    </div>
                  </div>
                </div>

                {/* Right panel */}
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  {/* Audience */}
                  <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:18}}>
                    <div style={{fontWeight:700,fontSize:13.5,color:text,marginBottom:12}}>Audience</div>
                    {[{v:"all",l:"All Customers"},{v:"vip",l:"VIP Only"},{v:"inactive",l:"Inactive"},{v:"new_lead",l:"New Leads"}].map(o=>(
                      <div key={o.v} onClick={()=>setAudience(o.v)}
                        style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",background:audience===o.v?accentDim:inputBg,border:`1px solid ${audience===o.v?accent+"44":cardBorder}`,borderRadius:8,cursor:"pointer",marginBottom:6}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{width:7,height:7,borderRadius:"50%",background:audience===o.v?accent:textFaint}}/>
                          <span style={{fontSize:13,fontWeight:audience===o.v?600:500,color:audience===o.v?text:textMuted}}>{o.l}</span>
                        </div>
                        <span style={{fontSize:12,fontWeight:700,color:audience===o.v?accent:textFaint}}>{audienceCounts[o.v]}</span>
                      </div>
                    ))}
                  </div>

                  {/* Preview */}
                  <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:18}}>
                    <div style={{fontWeight:700,fontSize:13.5,color:text,marginBottom:4}}>Message Preview</div>
                    <div style={{fontSize:11,color:textFaint,marginBottom:10}}>{audienceCounts[audience]} recipients</div>
                    <div style={{background:"#0b1418",borderRadius:10,padding:12,fontFamily:"sans-serif"}}>
                      <div style={{background:"#005c4b",borderRadius:"12px 12px 12px 3px",padding:"10px 13px",fontSize:12.5,color:"#e9edef",lineHeight:1.5,whiteSpace:"pre-wrap",maxWidth:"85%"}}>
                        {(message||"Your message will appear here...").replace(/\[Name\]/gi, preview[0]?.name?.split(" ")[0]||"Priya")}
                      </div>
                      <div style={{fontSize:10,color:"#8696a0",textAlign:"right",marginTop:3}}>✓✓ Now</div>
                    </div>
                  </div>

                  <button onClick={sendCampaign} disabled={!name||!message||sending}
                    style={{background:(!name||!message)?inputBg:accent,color:(!name||!message)?textFaint:"#000",border:"none",padding:"13px",borderRadius:10,fontWeight:700,fontSize:14,cursor:(!name||!message)?"not-allowed":"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                    📲 Send to {audienceCounts[audience]} Customers
                  </button>
                </div>
              </div>
            )}

            {/* LIST SCREEN */}
            {step==="list" && (
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                {/* Stats */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:11}}>
                  {[{l:"Total Campaigns",v:campaigns.length,c:text},{l:"Messages Sent",v:campaigns.reduce((s,c)=>s+(c.sent_count||0),0),c:accent},{l:"Customers Reached",v:[...new Set(campaigns.map(c=>c.audience_filter))].length>0?customers.length:0,c:"#38bdf8"}].map(s=>(
                    <div key={s.l} style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:11,padding:"13px 15px"}}>
                      <div style={{fontSize:11,color:textMuted,marginBottom:5}}>{s.l}</div>
                      <div style={{fontSize:22,fontWeight:700,color:s.c}}>{s.v}</div>
                    </div>
                  ))}
                </div>

                {/* Campaign list */}
                <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,overflow:"hidden"}}>
                  <div style={{padding:"14px 18px",borderBottom:`1px solid ${border}`,fontWeight:700,fontSize:13.5,color:text}}>Campaign History</div>
                  {loading ? (
                    <div style={{padding:"40px",textAlign:"center",color:textFaint}}>Loading...</div>
                  ) : campaigns.length===0 ? (
                    <div style={{padding:"50px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
                      <div style={{fontSize:36,opacity:0.2}}>◆</div>
                      <div style={{fontWeight:700,fontSize:14,color:textFaint}}>No campaigns yet</div>
                      <div style={{fontSize:12,color:textFaint}}>Create your first WhatsApp campaign to reach all customers at once</div>
                      <button onClick={()=>setStep("create")} style={{marginTop:6,background:accent,color:"#000",border:"none",padding:"9px 20px",borderRadius:8,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>+ Create Campaign</button>
                    </div>
                  ) : campaigns.map(c=>{
                    const statusColor = { completed:accent, sending:"#f59e0b", failed:"#fb7185", draft:textFaint }
                    return (
                      <div key={c.id} style={{display:"flex",alignItems:"center",padding:"14px 18px",borderBottom:`1px solid ${border}`,gap:14}}>
                        <div style={{width:40,height:40,borderRadius:10,background:accentDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>📢</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:700,fontSize:13,color:text,marginBottom:2}}>{c.name}</div>
                          <div style={{fontSize:11.5,color:textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.message}</div>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div style={{fontSize:12,fontWeight:700,color:statusColor[c.status]||textFaint,marginBottom:2}}>{(c.status||"").charAt(0).toUpperCase()+(c.status||"").slice(1)}</div>
                          <div style={{fontSize:11,color:textFaint}}>{c.sent_count||0}/{c.recipient_count||0} sent</div>
                          <div style={{fontSize:10.5,color:textFaint}}>{c.created_at?new Date(c.created_at).toLocaleDateString():"—"}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
