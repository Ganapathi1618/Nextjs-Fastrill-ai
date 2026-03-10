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

// Fastrill's pre-built template suggestions that clients create in Meta
const TEMPLATE_SUGGESTIONS = [
  {
    id:"t1", name:"Festival Offer", goal:"Booking", category:"MARKETING",
    body:"Hi {{1}} 👋 This festive season, get {{2}}% off on {{3}}! 🎉\nOnly {{4}} slots left. Book now → {{5}}",
    params:["Customer name","Discount %","Service name","Slots left","Booking link"],
    hint:"festival_offer"
  },
  {
    id:"t2", name:"Win Back Inactive", goal:"Re-engagement", category:"MARKETING",
    body:"Hi {{1}} 😊 We miss you!\nIt's been a while — come back this week and get ₹{{2}} off your next visit.\nBook here → {{3}}",
    params:["Customer name","Discount amount","Booking link"],
    hint:"win_back_inactive"
  },
  {
    id:"t3", name:"New Service Launch", goal:"Awareness", category:"MARKETING",
    body:"Hi {{1}} ✨ We just launched our new {{2}}!\nStarting at just ₹{{3}}. Be the first to try it 💫\nBook → {{4}}",
    params:["Customer name","Service name","Price","Booking link"],
    hint:"new_service_launch"
  },
  {
    id:"t4", name:"VIP Exclusive Offer", goal:"Upsell", category:"MARKETING",
    body:"Hi {{1}} 🌟 As one of our VIP customers, you get exclusive access to our {{2}} package!\nSpecial price ₹{{3}} — only for you.\nBook → {{4}}",
    params:["Customer name","Package name","Price","Booking link"],
    hint:"vip_exclusive"
  },
  {
    id:"t5", name:"Appointment Reminder", goal:"Reminder", category:"UTILITY",
    body:"Hi {{1}} ⏰ Reminder: You have an appointment tomorrow at {{2}} for {{3}}.\nLooking forward to seeing you! 😊",
    params:["Customer name","Time","Service"],
    hint:"appointment_reminder"
  },
]

export default function Campaigns() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [userId, setUserId] = useState(null)
  const [dark, setDark] = useState(true)
  const [campaigns, setCampaigns] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState("list") // list | templates | create | sending | results

  // Meta templates fetched from API
  const [metaTemplates, setMetaTemplates] = useState([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [wabaId, setWabaId] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [phoneNumberId, setPhoneNumberId] = useState(null)

  // Create form
  const [campaignName, setCampaignName] = useState("")
  const [selectedMetaTemplate, setSelectedMetaTemplate] = useState(null)
  const [templateParams, setTemplateParams] = useState({})
  const [audience, setAudience] = useState("all")
  const [sending, setSending] = useState(false)
  const [testNumbers, setTestNumbers] = useState("") // comma-separated phone numbers for test send
  const [testMode, setTestMode] = useState(false)
  const [sendProgress, setSendProgress] = useState(0)
  const [sendResults, setSendResults] = useState({ sent:0, failed:0, total:0 })

  // Session message (24hr window - free)
  const [sessionMsg, setSessionMsg] = useState("")
  const [sessionAudience, setSessionAudience] = useState("all")
  const [useSessionMode, setUseSessionMode] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login")
      else { setUserEmail(data.user.email||""); setUserId(data.user.id) }
    })
  }, [])

  useEffect(() => { if (userId) { loadCampaigns(); loadCustomers(); loadWAConnection() } }, [userId])

  async function loadWAConnection() {
    const { data } = await supabase.from("whatsapp_connections")
      .select("access_token, phone_number_id, waba_id")
      .eq("user_id", userId).single()
    if (data) {
      setAccessToken(data.access_token)
      setPhoneNumberId(data.phone_number_id)
      setWabaId(data.waba_id)
    }
  }

  async function loadCampaigns() {
    setLoading(true)
    const { data } = await supabase.from("campaigns").select("*")
      .eq("user_id", userId).order("created_at", { ascending: false })
    setCampaigns(data||[])
    setLoading(false)
  }

  async function loadCustomers() {
    const { data } = await supabase.from("customers").select("name,phone,tag").eq("user_id", userId)
    setCustomers(data||[])
  }

  async function fetchMetaTemplates() {
    if (!wabaId || !accessToken) {
      alert("WhatsApp not connected. Connect first in Settings.")
      return
    }
    setTemplatesLoading(true)
    try {
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${wabaId}/message_templates?fields=name,status,category,language,components&limit=50`,
        { headers: { "Authorization": `Bearer ${accessToken}` } }
      )
      const data = await res.json()
      if (data.error) {
        console.error("Meta templates error:", data.error)
        setMetaTemplates([])
      } else {
        // Only show APPROVED templates
        const approved = (data.data||[]).filter(t => t.status === "APPROVED")
        setMetaTemplates(approved)
      }
    } catch(e) {
      console.error("Failed to fetch templates:", e)
      setMetaTemplates([])
    }
    setTemplatesLoading(false)
  }

  function getTemplatePreviewText(template) {
    const bodyComp = template.components?.find(c => c.type === "BODY")
    return bodyComp?.text || "No preview available"
  }

  function getTemplateParams(template) {
    const bodyComp = template.components?.find(c => c.type === "BODY")
    if (!bodyComp?.text) return []
    const matches = bodyComp.text.match(/\{\{(\d+)\}\}/g) || []
    return [...new Set(matches)].sort()
  }

  function buildPersonalisedParams(template, customer, overrideParams) {
    const params = getTemplateParams(template)
    return params.map((p, i) => {
      const key = `param_${i}`
      let val = overrideParams[key] || ""
      // Auto-fill {{1}} with customer first name if it looks like a name field
      if (i === 0 && !val) val = customer.name?.split(" ")[0] || "there"
      return { type: "text", text: val || "—" }
    })
  }

  async function sendTemplatedCampaign() {
    if (!campaignName) return alert("Enter a campaign name")
    if (!selectedMetaTemplate) return alert("Select a WhatsApp template")
    if (!accessToken || !phoneNumberId) return alert("WhatsApp not connected")

    setSending(true)
    setStep("sending")
    setSendProgress(0)

    // Get recipients — test mode or full audience
    let recipients = []
    if (testMode && testNumbers.trim()) {
      recipients = testNumbers.split(",")
        .map(n => ({ name: "Test", phone: n.trim().replace(/\D/g, "") }))
        .filter(r => r.phone.length >= 10)
      if (!recipients.length) {
        alert("Enter valid phone numbers (with country code, e.g. 919876543210)")
        setSending(false); setStep("create"); return
      }
    } else {
      let query = supabase.from("customers").select("name,phone").eq("user_id", userId)
      if (audience !== "all") query = query.eq("tag", audience)
      const { data } = await query
      recipients = data || []
      if (!recipients.length) {
        alert("No customers in this audience. Add customers first or switch audience.")
        setSending(false); setStep("create"); return
      }
    }

    // Save campaign to DB
    const templateBody = getTemplatePreviewText(selectedMetaTemplate)
    const { data: campaign, error: campErr } = await supabase.from("campaigns").insert({
      user_id: userId,
      name: campaignName,
      message: templateBody,
      audience_filter: audience,
      recipient_count: recipients.length,
      status: "sending",
      template_name: selectedMetaTemplate.name,
      created_at: new Date().toISOString()
    }).select().single()

    if (campErr) { console.error(campErr); alert("DB error: " + campErr.message); setSending(false); setStep("create"); return }

    let sent = 0, failed = 0
    for (const customer of recipients) {
      const phone = (customer.phone||"").replace("+","").replace(/\s/g,"").replace(/-/g,"")
      const paramValues = buildPersonalisedParams(selectedMetaTemplate, customer, templateParams)

      const msgPayload = {
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: selectedMetaTemplate.name,
          language: { code: selectedMetaTemplate.language || "en" },
          components: paramValues.length > 0 ? [{
            type: "body",
            parameters: paramValues
          }] : []
        }
      }

      try {
        const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify(msgPayload)
        })
        const result = await res.json()
        if (result.error) {
          console.error(`Failed for ${phone}:`, result.error)
          await supabase.from("campaign_recipients").insert({
            campaign_id: campaign.id, user_id: userId,
            customer_phone: customer.phone, status: "failed",
            error_message: result.error.message
          })
          failed++
        } else {
          await supabase.from("campaign_recipients").insert({
            campaign_id: campaign.id, user_id: userId,
            customer_phone: customer.phone, status: "sent",
            wa_message_id: result.messages?.[0]?.id
          })
          sent++
        }
      } catch(e) {
        failed++
      }
      setSendProgress(Math.round(((sent+failed)/recipients.length)*100))
      await new Promise(r => setTimeout(r, 400)) // ~2.5 msgs/sec (Meta limit)
    }

    await supabase.from("campaigns").update({
      status: failed === recipients.length ? "failed" : "completed",
      sent_count: sent, failed_count: failed
    }).eq("id", campaign.id)

    setSendResults({ sent, failed, total: recipients.length })
    setSending(false)
    await loadCampaigns()
    setStep("results")
  }

  async function sendSessionCampaign() {
    if (!sessionMsg.trim()) return alert("Enter a message")
    if (!accessToken || !phoneNumberId) return alert("WhatsApp not connected")

    setSending(true)
    setStep("sending")
    setSendProgress(0)

    let query = supabase.from("customers").select("name,phone").eq("user_id", userId)
    if (sessionAudience !== "all") query = query.eq("tag", sessionAudience)
    const { data: recipients } = await query

    if (!recipients?.length) { alert("No customers"); setSending(false); setStep("create"); return }

    const { data: campaign } = await supabase.from("campaigns").insert({
      user_id: userId, name: campaignName || "Quick Message",
      message: sessionMsg, audience_filter: sessionAudience,
      recipient_count: recipients.length, status: "sending",
      created_at: new Date().toISOString()
    }).select().single()

    let sent = 0, failed = 0
    for (const customer of recipients) {
      const personalMsg = sessionMsg.replace(/\[Name\]/gi, customer.name?.split(" ")[0]||"there")
      const phone = (customer.phone||"").replace("+","").replace(/\s/g,"").replace(/-/g,"")
      try {
        const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ messaging_product:"whatsapp", to:phone, type:"text", text:{ body:personalMsg } })
        })
        const result = await res.json()
        result.error ? failed++ : sent++
      } catch(e) { failed++ }
      setSendProgress(Math.round(((sent+failed)/recipients.length)*100))
      await new Promise(r => setTimeout(r, 400))
    }

    if (campaign) await supabase.from("campaigns").update({ status:"completed", sent_count:sent, failed_count:failed }).eq("id", campaign.id)
    setSendResults({ sent, failed, total: recipients.length })
    setSending(false)
    await loadCampaigns()
    setStep("results")
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

  const audienceCounts = {
    all: customers.length,
    vip: customers.filter(c=>c.tag==="vip").length,
    inactive: customers.filter(c=>c.tag==="inactive").length,
    new_lead: customers.filter(c=>c.tag==="new_lead").length
  }

  const templateParams_count = selectedMetaTemplate ? getTemplateParams(selectedMetaTemplate).length : 0

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
        .topbar-l{display:flex;align-items:center;gap:12px;}
        .topbar-r{display:flex;align-items:center;gap:8px;}
        .theme-toggle{display:flex;align-items:center;gap:6px;padding:5px 10px;background:${inputBg};border:1px solid ${cardBorder};border-radius:8px;cursor:pointer;font-size:11.5px;color:${textMuted};font-family:'Plus Jakarta Sans',sans-serif;}
        .toggle-pill{width:30px;height:16px;border-radius:100px;background:${dark?accent:"#d1d5db"};position:relative;flex-shrink:0;}
        .toggle-pill::after{content:'';position:absolute;top:2px;width:12px;height:12px;border-radius:50%;background:#fff;left:${dark?"16px":"2px"};}
        .content{flex:1;overflow-y:auto;padding:20px 24px;background:${bg};}
        select,select option{color-scheme:dark;background-color:#0c0c15!important;color:#eeeef5!important;}
        select:focus{outline:none;}
        .template-card{background:${card};border:1px solid ${cardBorder};border-radius:10px;padding:14px;cursor:pointer;transition:all 0.12s;margin-bottom:8px;}
        .template-card:hover{border-color:${accent}44;transform:translateY(-1px);}
        .template-card.selected{background:${accentDim};border-color:${accent}66;}
        .wa-preview{background:#0b1418;border-radius:12px;padding:14px;}
        .wa-bubble{background:#005c4b;border-radius:12px 12px 12px 3px;padding:10px 13px;font-size:13px;color:#e9edef;line-height:1.6;white-space:pre-wrap;max-width:90%;display:inline-block;}
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
            <div className="topbar-l">
              {step!=="list" && (
                <button onClick={()=>setStep("list")} style={{background:"transparent",border:"none",color:textMuted,cursor:"pointer",fontSize:18,lineHeight:1}}>←</button>
              )}
              <span className="tb-title">
                {step==="list"?"Campaigns":step==="sending"?"Sending Campaign...":step==="results"?"Campaign Complete":step==="templates"?"WhatsApp Templates":"New Campaign"}
              </span>
            </div>
            <div className="topbar-r">
              {step==="list" && (
                <button onClick={()=>{setStep("create");fetchMetaTemplates()}} style={{background:accent,color:"#000",border:"none",padding:"7px 16px",borderRadius:8,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  + New Campaign
                </button>
              )}
              <button className="theme-toggle" onClick={toggleTheme}>
                <span>{dark?"🌙":"☀️"}</span><div className="toggle-pill"/><span>{dark?"Dark":"Light"}</span>
              </button>
            </div>
          </div>

          <div className="content">

            {/* ── SENDING SCREEN ── */}
            {step==="sending" && (
              <div style={{maxWidth:480,margin:"60px auto",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:18}}>
                <div style={{fontSize:52}}>📲</div>
                <div style={{fontWeight:800,fontSize:20,color:text}}>Sending Campaign</div>
                <div style={{fontSize:13,color:textMuted}}>Sending messages via WhatsApp API...</div>
                <div style={{width:"100%",height:8,background:inputBg,borderRadius:100,overflow:"hidden"}}>
                  <div style={{height:"100%",background:`linear-gradient(90deg,${accent},#38bdf8)`,borderRadius:100,width:`${sendProgress}%`,transition:"width 0.3s"}}/>
                </div>
                <div style={{fontWeight:800,fontSize:32,color:accent}}>{sendProgress}%</div>
                <div style={{fontSize:12,color:textFaint}}>⚠️ Don't close this window</div>
              </div>
            )}

            {/* ── RESULTS SCREEN ── */}
            {step==="results" && (
              <div style={{maxWidth:480,margin:"60px auto",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:18}}>
                <div style={{fontSize:52}}>{sendResults.failed===sendResults.total?"❌":"✅"}</div>
                <div style={{fontWeight:800,fontSize:20,color:text}}>Campaign Complete!</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,width:"100%"}}>
                  {[{l:"Sent",v:sendResults.sent,c:accent},{l:"Failed",v:sendResults.failed,c:"#fb7185"},{l:"Total",v:sendResults.total,c:text}].map(s=>(
                    <div key={s.l} style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:11,padding:"14px 10px"}}>
                      <div style={{fontWeight:800,fontSize:28,color:s.c}}>{s.v}</div>
                      <div style={{fontSize:11,color:textMuted}}>{s.l}</div>
                    </div>
                  ))}
                </div>
                {sendResults.failed>0 && (
                  <div style={{background:"rgba(251,113,133,0.1)",border:"1px solid rgba(251,113,133,0.25)",borderRadius:10,padding:"12px 16px",fontSize:12.5,color:"#fb7185",textAlign:"left",width:"100%",lineHeight:1.6}}>
                    ⚠️ {sendResults.failed} messages failed. Common reasons: number not on WhatsApp, outside 24hr window without template, or phone format issue.
                  </div>
                )}
                <button onClick={()=>{setStep("list");setCampaignName("");setSelectedMetaTemplate(null);setTemplateParams({});setAudience("all")}}
                  style={{background:accent,color:"#000",border:"none",padding:"11px 28px",borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  Back to Campaigns
                </button>
              </div>
            )}

            {/* ── CREATE SCREEN ── */}
            {step==="create" && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:20,maxWidth:1100}}>

                {/* LEFT */}
                <div style={{display:"flex",flexDirection:"column",gap:16}}>

                  {/* Mode toggle */}
                  <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:18}}>
                    <div style={{fontWeight:700,fontSize:13.5,color:text,marginBottom:12}}>Message Type</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <div onClick={()=>setUseSessionMode(false)} style={{padding:"14px 16px",background:!useSessionMode?accentDim:inputBg,border:`1px solid ${!useSessionMode?accent+"66":cardBorder}`,borderRadius:10,cursor:"pointer"}}>
                        <div style={{fontWeight:700,fontSize:13,color:!useSessionMode?accent:text,marginBottom:4}}>📋 Template Message</div>
                        <div style={{fontSize:11.5,color:textMuted,lineHeight:1.5}}>Use a Meta-approved template. Works for ALL customers anytime. Required for marketing campaigns.</div>
                        <div style={{marginTop:8,fontSize:10.5,fontWeight:600,color:"#f59e0b"}}>💰 ~₹0.60–₹0.80 per message</div>
                      </div>
                      <div onClick={()=>setUseSessionMode(true)} style={{padding:"14px 16px",background:useSessionMode?accentDim:inputBg,border:`1px solid ${useSessionMode?accent+"66":cardBorder}`,borderRadius:10,cursor:"pointer"}}>
                        <div style={{fontWeight:700,fontSize:13,color:useSessionMode?accent:text,marginBottom:4}}>💬 Free Text Message</div>
                        <div style={{fontSize:11.5,color:textMuted,lineHeight:1.5}}>Send any message. Only works if customer messaged you in last 24 hours (session window).</div>
                        <div style={{marginTop:8,fontSize:10.5,fontWeight:600,color:accent}}>✅ Free (1000/month)</div>
                      </div>
                    </div>
                  </div>

                  {/* Campaign name */}
                  <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:18}}>
                    <div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>Campaign Name</div>
                    <input placeholder="e.g. Diwali Offer 2026" value={campaignName} onChange={e=>setCampaignName(e.target.value)} style={inp}/>
                  </div>

                  {/* TEMPLATE MODE */}
                  {!useSessionMode && (
                    <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:18}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                        <div style={{fontWeight:700,fontSize:13.5,color:text}}>Select WhatsApp Template</div>
                        <button onClick={fetchMetaTemplates} disabled={templatesLoading} style={{background:inputBg,border:`1px solid ${cardBorder}`,borderRadius:7,padding:"5px 12px",fontSize:11.5,color:textMuted,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                          {templatesLoading?"Loading...":"🔄 Refresh"}
                        </button>
                      </div>

                      {templatesLoading ? (
                        <div style={{textAlign:"center",padding:"20px",color:textFaint,fontSize:12}}>Fetching your approved templates...</div>
                      ) : metaTemplates.length === 0 ? (
                        <div style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:10,padding:16}}>
                          <div style={{fontWeight:700,fontSize:13,color:"#f59e0b",marginBottom:8}}>⚠️ No approved templates found</div>
                          <div style={{fontSize:12.5,color:textMuted,lineHeight:1.7,marginBottom:12}}>
                            You need to create and get templates approved in Meta Business Manager first.<br/>
                            Templates take 1–24 hours to get approved.
                          </div>
                          <div style={{fontSize:12,color:textFaint,marginBottom:12,fontWeight:600}}>Templates to create (copy these exactly):</div>
                          {TEMPLATE_SUGGESTIONS.map(t=>(
                            <div key={t.id} style={{background:inputBg,border:`1px solid ${cardBorder}`,borderRadius:8,padding:"10px 12px",marginBottom:8}}>
                              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                                <span style={{fontWeight:700,fontSize:12,color:text}}>{t.name}</span>
                                <span style={{fontSize:10,fontWeight:700,color:"#a78bfa",background:"rgba(167,139,250,0.12)",padding:"2px 8px",borderRadius:100}}>{t.category}</span>
                              </div>
                              <div style={{fontFamily:"monospace",fontSize:11,color:textMuted,lineHeight:1.6,whiteSpace:"pre-wrap",background:dark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.03)",padding:"8px 10px",borderRadius:6,border:`1px solid ${cardBorder}`}}>{t.body}</div>
                            </div>
                          ))}
                          <a href="https://business.facebook.com/wa/manage/message-templates/" target="_blank" rel="noreferrer"
                            style={{display:"inline-block",marginTop:8,background:"#1877f2",color:"#fff",padding:"9px 18px",borderRadius:8,fontSize:12,fontWeight:700,textDecoration:"none"}}>
                            → Create Templates in Meta
                          </a>
                        </div>
                      ) : (
                        <div>
                          {metaTemplates.map(t=>(
                            <div key={t.name} className={`template-card${selectedMetaTemplate?.name===t.name?" selected":""}`}
                              onClick={()=>{setSelectedMetaTemplate(t);setTemplateParams({})}}>
                              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                                <span style={{fontWeight:700,fontSize:13,color:selectedMetaTemplate?.name===t.name?accent:text}}>{t.name}</span>
                                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                                  <span style={{fontSize:10,fontWeight:700,color:"#22c55e",background:"rgba(34,197,94,0.12)",padding:"2px 8px",borderRadius:100,border:"1px solid rgba(34,197,94,0.2)"}}>✓ APPROVED</span>
                                  <span style={{fontSize:10,color:textFaint,background:inputBg,padding:"2px 8px",borderRadius:100}}>{t.category}</span>
                                </div>
                              </div>
                              <div style={{fontSize:12,color:textMuted,lineHeight:1.5}}>{getTemplatePreviewText(t)}</div>
                              <div style={{fontSize:10.5,color:textFaint,marginTop:4}}>{t.language} · {getTemplateParams(t).length} variable{getTemplateParams(t).length!==1?"s":""}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Template variables fill-in */}
                      {selectedMetaTemplate && templateParams_count > 0 && (
                        <div style={{marginTop:14,padding:14,background:inputBg,border:`1px solid ${cardBorder}`,borderRadius:10}}>
                          <div style={{fontSize:12,fontWeight:700,color:text,marginBottom:10}}>Fill in template variables</div>
                          <div style={{fontSize:11,color:textFaint,marginBottom:10}}>{"{{1}} is auto-filled with customer's first name. Fill in the rest:"}</div>
                          {getTemplateParams(selectedMetaTemplate).map((p,i)=>(
                            i===0 ? (
                              <div key={p} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,opacity:0.5}}>
                                <span style={{fontSize:12,color:textMuted,width:40}}>{p}</span>
                                <input disabled value="[Customer name — auto filled]" style={{...inp,flex:1,fontSize:11.5,opacity:0.6}}/>
                              </div>
                            ) : (
                              <div key={p} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                                <span style={{fontSize:12,color:textMuted,width:40,flexShrink:0}}>{p}</span>
                                <input placeholder={`Value for ${p}`} value={templateParams[`param_${i}`]||""}
                                  onChange={e=>setTemplateParams(prev=>({...prev,[`param_${i}`]:e.target.value}))}
                                  style={{...inp,flex:1}}/>
                              </div>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SESSION MODE */}
                  {useSessionMode && (
                    <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:18}}>
                      <div style={{fontWeight:700,fontSize:13.5,color:text,marginBottom:4}}>Message</div>
                      <div style={{fontSize:11.5,color:textFaint,marginBottom:10}}>Use [Name] to personalise. Only reaches customers active in last 24hrs.</div>
                      <textarea value={sessionMsg} onChange={e=>setSessionMsg(e.target.value)}
                        placeholder={"Hi [Name] 👋 Just checking in — we have availability this week!\nBook your slot → https://fastrill.com"}
                        style={{...inp,resize:"vertical",minHeight:120,lineHeight:1.6}}/>
                      <div style={{fontSize:11,color:textFaint,marginTop:6}}>{sessionMsg.length} characters</div>
                    </div>
                  )}
                </div>

                {/* RIGHT PANEL */}
                <div style={{display:"flex",flexDirection:"column",gap:14}}>

                  {/* Audience */}
                  <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:18}}>
                    <div style={{fontWeight:700,fontSize:13.5,color:text,marginBottom:12}}>Audience</div>
                    {[{v:"all",l:"All Customers",icon:"👥"},{v:"vip",l:"VIP Only",icon:"⭐"},{v:"inactive",l:"Inactive",icon:"😴"},{v:"new_lead",l:"New Leads",icon:"🔥"}].map(o=>(
                      <div key={o.v} onClick={()=>setAudience(o.v)}
                        style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",background:audience===o.v?accentDim:inputBg,border:`1px solid ${audience===o.v?accent+"55":cardBorder}`,borderRadius:8,cursor:"pointer",marginBottom:6,transition:"all 0.12s"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:14}}>{o.icon}</span>
                          <span style={{fontSize:13,fontWeight:audience===o.v?600:500,color:audience===o.v?text:textMuted}}>{o.l}</span>
                        </div>
                        <span style={{fontSize:13,fontWeight:700,color:audience===o.v?accent:textFaint}}>{audienceCounts[o.v]}</span>
                      </div>
                    ))}
                  </div>

                  {/* Cost estimate */}
                  {!useSessionMode && (
                    <div style={{background:card,border:`1px solid rgba(245,158,11,0.2)`,borderRadius:13,padding:16}}>
                      <div style={{fontWeight:700,fontSize:12.5,color:"#f59e0b",marginBottom:8}}>💰 Estimated Cost</div>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                        <span style={{color:textMuted}}>Recipients</span>
                        <span style={{fontWeight:600,color:text}}>{audienceCounts[audience]}</span>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                        <span style={{color:textMuted}}>Cost per message</span>
                        <span style={{fontWeight:600,color:text}}>~₹0.70</span>
                      </div>
                      <div style={{height:1,background:border,margin:"8px 0"}}/>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                        <span style={{fontWeight:600,color:text}}>Total Meta cost</span>
                        <span style={{fontWeight:800,color:"#f59e0b"}}>~₹{(audienceCounts[audience]*0.70).toFixed(0)}</span>
                      </div>
                      <div style={{fontSize:10.5,color:textFaint,marginTop:8,lineHeight:1.5}}>Charged by Meta to your WhatsApp Business account directly.</div>
                    </div>
                  )}

                  {/* Preview */}
                  <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:16}}>
                    <div style={{fontWeight:700,fontSize:13,color:text,marginBottom:10}}>Preview</div>
                    <div className="wa-preview">
                      <div className="wa-bubble">
                        {!useSessionMode && selectedMetaTemplate
                          ? getTemplatePreviewText(selectedMetaTemplate)
                              .replace(/\{\{1\}\}/g, customers[0]?.name?.split(" ")[0]||"Priya")
                              .replace(/\{\{(\d+)\}\}/g, (m,n) => templateParams[`param_${parseInt(n)-1}`]||m)
                          : useSessionMode && sessionMsg
                          ? sessionMsg.replace(/\[Name\]/gi, customers[0]?.name?.split(" ")[0]||"Priya")
                          : "Select a template to preview..."}
                      </div>
                      <div style={{fontSize:10,color:"#8696a0",textAlign:"right",marginTop:3}}>✓✓ Now</div>
                    </div>
                  </div>

                  {/* Send button */}
                  <button
                    onClick={useSessionMode ? sendSessionCampaign : sendTemplatedCampaign}
                    disabled={sending || !campaignName || (!useSessionMode && !selectedMetaTemplate) || (useSessionMode && !sessionMsg)}
                    style={{
                      background: (sending || !campaignName || (!useSessionMode && !selectedMetaTemplate) || (useSessionMode && !sessionMsg))
                        ? inputBg : accent,
                      color: (sending || !campaignName || (!useSessionMode && !selectedMetaTemplate) || (useSessionMode && !sessionMsg))
                        ? textFaint : "#000",
                      border:"none",padding:"14px",borderRadius:10,fontWeight:700,fontSize:14,
                      cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",
                      transition:"all 0.15s"
                    }}>
                    📲 Send to {audienceCounts[audience]} Customers
                  </button>
                </div>
              </div>
            )}

            {/* ── LIST SCREEN ── */}
            {step==="list" && (
              <div style={{display:"flex",flexDirection:"column",gap:14}}>

                {/* Info banner */}
                <div style={{background:"rgba(56,189,248,0.06)",border:"1px solid rgba(56,189,248,0.2)",borderRadius:12,padding:"13px 18px",display:"flex",alignItems:"flex-start",gap:12}}>
                  <span style={{fontSize:20,flexShrink:0}}>ℹ️</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,color:text,marginBottom:3}}>How WhatsApp campaigns work</div>
                    <div style={{fontSize:12,color:textMuted,lineHeight:1.7}}>
                      <strong style={{color:"#38bdf8"}}>Template messages</strong> — use Meta-approved templates to reach any customer anytime. Costs ~₹0.70/msg (charged by Meta). <br/>
                      <strong style={{color:accent}}>Free text messages</strong> — send to customers who messaged you in the last 24 hours. Completely free (1,000/month).
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:11}}>
                  {[
                    {l:"Total Campaigns",v:campaigns.length,c:text},
                    {l:"Messages Sent",v:campaigns.reduce((s,c)=>s+(c.sent_count||0),0),c:accent},
                    {l:"Success Rate",v:campaigns.length?`${Math.round((campaigns.reduce((s,c)=>s+(c.sent_count||0),0)/Math.max(campaigns.reduce((s,c)=>s+(c.recipient_count||0),0),1))*100)}%`:"—",c:"#38bdf8"},
                  ].map(s=>(
                    <div key={s.l} style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:11,padding:"13px 15px"}}>
                      <div style={{fontSize:11,color:textMuted,marginBottom:5}}>{s.l}</div>
                      <div style={{fontSize:22,fontWeight:700,color:s.c}}>{s.v}</div>
                    </div>
                  ))}
                </div>

                {/* Campaign history */}
                <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,overflow:"hidden"}}>
                  <div style={{padding:"14px 18px",borderBottom:`1px solid ${border}`,fontWeight:700,fontSize:13.5,color:text}}>Campaign History</div>
                  {loading ? (
                    <div style={{padding:"40px",textAlign:"center",color:textFaint}}>Loading...</div>
                  ) : campaigns.length===0 ? (
                    <div style={{padding:"50px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
                      <div style={{fontSize:36,opacity:0.2}}>◆</div>
                      <div style={{fontWeight:700,fontSize:14,color:textFaint}}>No campaigns yet</div>
                      <div style={{fontSize:12,color:textFaint,lineHeight:1.6}}>Create your first WhatsApp campaign to reach all your customers at once</div>
                      <button onClick={()=>{setStep("create");fetchMetaTemplates()}}
                        style={{marginTop:6,background:accent,color:"#000",border:"none",padding:"9px 20px",borderRadius:8,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                        + Create Campaign
                      </button>
                    </div>
                  ) : campaigns.map(c=>{
                    const statusColor = { completed:accent, sending:"#f59e0b", failed:"#fb7185", draft:textFaint }
                    const successRate = c.recipient_count ? Math.round((c.sent_count||0)/c.recipient_count*100) : 0
                    return (
                      <div key={c.id} style={{display:"flex",alignItems:"center",padding:"14px 18px",borderBottom:`1px solid ${border}`,gap:14}}>
                        <div style={{width:40,height:40,borderRadius:10,background:accentDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>📢</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:700,fontSize:13,color:text,marginBottom:2,display:"flex",alignItems:"center",gap:8}}>
                            {c.name}
                            {c.template_name && <span style={{fontSize:10,color:"#a78bfa",background:"rgba(167,139,250,0.12)",padding:"2px 7px",borderRadius:100,fontWeight:600}}>template</span>}
                          </div>
                          <div style={{fontSize:11.5,color:textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.message}</div>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div style={{fontSize:12,fontWeight:700,color:statusColor[c.status]||textFaint,marginBottom:2}}>{(c.status||"").charAt(0).toUpperCase()+(c.status||"").slice(1)}</div>
                          <div style={{fontSize:11,color:textFaint}}>{c.sent_count||0}/{c.recipient_count||0} sent · {successRate}%</div>
                          <div style={{fontSize:10.5,color:textFaint}}>{c.created_at?new Date(c.created_at).toLocaleDateString("en-IN"):"—"}</div>
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
