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

// FIX: 3-day cooldown — don't show leads that already got recovery msg in last 3 days
const COOLDOWN_DAYS = 3

export default function Leads() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [userId, setUserId] = useState(null)
  const [dark, setDark] = useState(true)
  const [mobSidebarOpen, setMobSidebarOpen] = useState(false)
  const [leads, setLeads] = useState([])
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [recoveryMsg, setRecoveryMsg] = useState("")
  const [stats, setStats] = useState({ total:0, hot:0, warm:0, value:0 })

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login")
      else { setUserEmail(data.user.email||""); setUserId(data.user.id) }
    })
  }, [])

  useEffect(() => { if (userId) loadLeads() }, [userId])

  useEffect(() => {
    if (selected) setRecoveryMsg(generateRecoveryMsg(selected))
  }, [selected?.id])

  async function loadLeads() {
    setLoading(true)

    // FIX: filter out leads that got recovery message within last COOLDOWN_DAYS days
    const cooldownDate = new Date()
    cooldownDate.setDate(cooldownDate.getDate() - COOLDOWN_DAYS)

    const { data } = await supabase
      .from("leads")
      .select("*, customers(name,phone)")
      .eq("user_id", userId)
      .eq("status", "open")  // FIX: only show "open" leads, not "contacted"
      .order("ai_score", { ascending: false })

    // FIX: also filter out leads where recovery was sent recently (within cooldown)
    const list = (data || []).filter(l => {
      if (!l.recovery_sent_at) return true  // never contacted — always show
      const sentAt = new Date(l.recovery_sent_at)
      return sentAt < cooldownDate  // only show again after cooldown
    })

    setLeads(list)
    setStats({
      total: list.length,
      hot: list.filter(l=>l.ai_score>=85).length,
      warm: list.filter(l=>l.ai_score>=65&&l.ai_score<85).length,
      value: list.reduce((s,l)=>s+(l.estimated_value||600),0)
    })
    if (list.length && !selected) setSelected(list[0])
    setLoading(false)
  }

  function generateRecoveryMsg(lead) {
    const name = lead.name?.split(" ")[0] || "there"
    const msgs = [
      `Hi ${name}! 👋 We noticed you reached out recently but we didn't connect. We'd love to help — are you still looking for an appointment?`,
      `Hey ${name}! It's been a while since we chatted. We have some great offers this week — want to book a slot? 😊`,
      `Hi ${name}! Just checking in — we have availability this week and would love to have you visit us! 🌟`,
    ]
    // Use lead id to pick consistent message per lead
    return msgs[(lead.id||"").charCodeAt(0) % msgs.length] || msgs[0]
  }

  async function sendRecovery() {
    if (!selected || !recoveryMsg || sending) return
    setSending(true)
    try {
      const { data: conn } = await supabase.from("whatsapp_connections").select("access_token,phone_number_id").eq("user_id", userId).single()
      if (!conn) { alert("WhatsApp not connected"); setSending(false); return }
      const phone = (selected.phone||selected.customers?.phone||"").replace("+","")
      const res = await fetch(`https://graph.facebook.com/v18.0/${conn.phone_number_id}/messages`, {
        method:"POST",
        headers:{"Authorization":`Bearer ${conn.access_token}`,"Content-Type":"application/json"},
        body:JSON.stringify({messaging_product:"whatsapp",to:phone,type:"text",text:{body:recoveryMsg}})
      })
      const result = await res.json()
      if (result.error) { alert("Failed to send: " + result.error.message); setSending(false); return }

      // FIX: set recovery_sent_at timestamp, keep status as "open" so it can re-appear after cooldown
      await supabase.from("leads").update({
        recovery_message: recoveryMsg,
        recovery_sent_at: new Date().toISOString()
        // NOT changing status to "contacted" — it stays "open" and re-appears after 3 days
      }).eq("id", selected.id)

      // Remove from current view (it'll come back after cooldown)
      const remaining = leads.filter(l=>l.id!==selected.id)
      setLeads(remaining)
      setSelected(remaining[0] || null)
    } catch(e) { console.error(e); alert("Error sending message") }
    setSending(false)
  }

  async function dismissLead(id) {
    // FIX: dismissed = never show again (status = "dismissed")
    await supabase.from("leads").update({ status:"dismissed" }).eq("id", id)
    const remaining = leads.filter(l=>l.id!==id)
    setLeads(remaining)
    setSelected(remaining[0] || null)
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

  const getScoreColor = (s) => s>=85?"#fb7185":s>=65?"#f59e0b":"#38bdf8"
  const getScoreLabel = (s) => s>=85?"🔥 Hot":s>=65?"🌡 Warm":"❄️ Cold"
  const getInitial = (name) => (name||"?")[0].toUpperCase()
  const getColor = (name) => { const c=["#00d084","#38bdf8","#a78bfa","#f59e0b","#fb7185"]; return c[(name||"").charCodeAt(0)%c.length] }
  const srcColor = { whatsapp:"#25d366", instagram:"#e1306c", referral:"#f59e0b", campaign:"#38bdf8", google:"#ea4335" }
  const formatTime = (ts) => { if (!ts) return ""; const d=Date.now()-new Date(ts); if (d<3600000) return `${Math.floor(d/60000)}m ago`; if (d<86400000) return `${Math.floor(d/3600000)}h ago`; return `${Math.floor(d/86400000)}d ago` }

  const filtered = leads.filter(l => {
    if (filter==="hot") return l.ai_score>=85
    if (filter==="warm") return l.ai_score>=65&&l.ai_score<85
    if (filter==="cold") return l.ai_score<65
    return true
  })

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
        .content{flex:1;display:flex;overflow:hidden;}
        .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:8px;color:${textFaint};}

        /* ══ MOBILE RESPONSIVE ══════════════════════════════════ */
        @media(max-width:767px){
          .wrap{position:relative;}
          .sidebar{
            position:fixed;top:0;left:0;height:100vh;z-index:300;
            transform:translateX(-100%);transition:transform 0.25s ease;
            width:240px!important;box-shadow:4px 0 24px rgba(0,0,0,0.5);
          }
          .sidebar.mob-open{transform:translateX(0);}
          .mob-overlay{display:block!important;}
          .main{width:100%;}
          .topbar{padding:0 12px!important;}
          .content{padding:12px!important;}
          .hamburger{display:flex!important;}
          .tb-title{font-size:14px!important;}
          /* Hide theme toggle label on small screens */
          .theme-toggle .tog-label{display:none;}
        }
        .mob-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:299;cursor:pointer;}
        .hamburger{display:none;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:6px 9px;cursor:pointer;font-size:17px;color:#eeeef5;line-height:1;margin-right:2px;}
        /* Responsive grids */
        @media(max-width:767px){
          [style*="grid-template-columns: repeat(5"]{grid-template-columns:repeat(2,1fr)!important;}
          [style*="grid-template-columns: repeat(4"]{grid-template-columns:repeat(2,1fr)!important;}
          [style*="grid-template-columns: repeat(3"]{grid-template-columns:repeat(2,1fr)!important;}
          [style*="grid-template-columns: 1fr 300px"]{grid-template-columns:1fr!important;}
          [style*="grid-template-columns: 1fr 320px"]{grid-template-columns:1fr!important;}
          [style*="grid-template-columns: 280px 1fr 280px"]{grid-template-columns:1fr!important;}
          [style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important;}
          [style*="repeat(7,1fr)"]{grid-template-columns:repeat(4,1fr)!important;}
        }
        /* Bottom navigation bar */
        .bottom-nav{
          display:none;position:fixed;bottom:0;left:0;right:0;
          background:#0c0c15;border-top:1px solid rgba(255,255,255,0.07);
          padding:6px 0;z-index:200;
        }
        @media(max-width:767px){
          .bottom-nav{display:flex;justify-content:space-around;}
          .main{padding-bottom:60px;}
          .wrap{padding-bottom:0;}
        }
        .bnav-btn{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 6px;border:none;background:transparent;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;flex:1;}
        .bnav-icon{font-size:17px;color:rgba(255,255,255,0.3);}
        .bnav-label{font-size:9px;font-weight:600;color:rgba(255,255,255,0.3);}
        .bnav-btn.active .bnav-icon,.bnav-btn.active .bnav-label{color:#00d084;}
      `}</style>

      <div className="wrap">
        <aside className={`sidebar${mobSidebarOpen?" mob-open":""}`}>
          <a href="/dashboard" className="logo">fast<span>rill</span></a>
          <div className="nav-section">Platform</div>
          {NAV.map(item=>(
            <button key={item.id} className={`nav-item${item.id==="leads"?" active":""}`} onClick={()=>router.push(item.path)}>
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
            <button className="hamburger" onClick={()=>setMobSidebarOpen(s=>!s)}>☰</button>
              <span className="tb-title">Lead Recovery</span>
            <div className="topbar-r">
              <button className="theme-toggle" onClick={toggleTheme}>
                <span>{dark?"🌙":"☀️"}</span><div className="toggle-pill"/><span>{dark?"Dark":"Light"}</span>
              </button>
            </div>
          </div>

          {stats.total>0 && (
            <div style={{padding:"12px 24px",borderBottom:`1px solid ${border}`,background:`linear-gradient(135deg,rgba(251,113,133,0.08),rgba(245,158,11,0.05))`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontSize:13,fontWeight:600,color:text}}>💰 <span style={{color:"#fb7185"}}>₹{stats.value.toLocaleString()}</span> in unconverted leads — <span style={{color:textMuted}}>{stats.hot} hot, {stats.warm} warm</span></div>
              <div style={{display:"flex",gap:16,fontSize:12,color:textFaint}}>
                <span>🔥 {stats.hot} Hot</span>
                <span>🌡 {stats.warm} Warm</span>
              </div>
            </div>
          )}

          <div className="content">
            <div style={{width:380,flexShrink:0,borderRight:`1px solid ${border}`,display:"flex",flexDirection:"column",background:sidebar}}>
              <div style={{padding:"10px 12px",borderBottom:`1px solid ${border}`,display:"flex",gap:4}}>
                {["all","hot","warm","cold"].map(f=>(
                  <button key={f} onClick={()=>setFilter(f)} style={{padding:"4px 12px",borderRadius:100,fontSize:11,fontWeight:600,cursor:"pointer",border:`1px solid ${filter===f?accent+"44":cardBorder}`,background:filter===f?accentDim:"transparent",color:filter===f?accent:textMuted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                    {f==="hot"?"🔥 Hot":f==="warm"?"🌡 Warm":f==="cold"?"❄️ Cold":"All"}
                  </button>
                ))}
              </div>
              <div style={{flex:1,overflowY:"auto"}}>
                {loading ? <div className="empty-state"><span>Loading...</span></div>
                : filtered.length===0 ? (
                  <div className="empty-state">
                    <span style={{fontSize:28}}>◉</span>
                    <span style={{fontWeight:600}}>No leads to recover</span>
                    <span style={{fontSize:11,textAlign:"center",padding:"0 20px"}}>Leads reappear after {COOLDOWN_DAYS} days if not converted</span>
                  </div>
                ) : filtered.map(l=>{
                  const name = l.name||l.customers?.name||l.phone
                  const color = getColor(name)
                  const scoreColor = getScoreColor(l.ai_score||50)
                  const sentRecently = l.recovery_sent_at && (Date.now()-new Date(l.recovery_sent_at)) < COOLDOWN_DAYS*86400000
                  return (
                    <div key={l.id} onClick={()=>setSelected(l)}
                      style={{padding:"12px 16px",borderBottom:`1px solid ${border}`,cursor:"pointer",background:selected?.id===l.id?accentDim:"transparent",borderLeft:selected?.id===l.id?`2px solid ${accent}`:"2px solid transparent",transition:"background 0.1s"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:5}}>
                        <div style={{width:36,height:36,borderRadius:9,background:`linear-gradient(135deg,${color}88,${color}44)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:"#fff",flexShrink:0}}>{getInitial(name)}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:600,fontSize:13,color:text,display:"flex",justifyContent:"space-between"}}>
                            <span>{name}</span>
                            <span style={{fontSize:11,fontWeight:700,color:scoreColor}}>{getScoreLabel(l.ai_score||50)}</span>
                          </div>
                          <div style={{fontSize:11.5,color:textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>"{l.last_message||"No message"}"</div>
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <span style={{fontSize:10,fontWeight:600,color:srcColor[l.source]||textFaint,background:(srcColor[l.source]||textFaint)+"18",padding:"2px 7px",borderRadius:100}}>{l.source||"whatsapp"}</span>
                        <span style={{fontSize:10,color:textFaint}}>{formatTime(l.last_message_at)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {selected ? (
              <div style={{flex:1,overflowY:"auto",padding:24,display:"flex",flexDirection:"column",gap:16}}>
                <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:20,display:"flex",alignItems:"center",gap:20}}>
                  <div style={{position:"relative",width:70,height:70,flexShrink:0}}>
                    <svg width="70" height="70" viewBox="0 0 70 70" style={{transform:"rotate(-90deg)"}}>
                      <circle cx="35" cy="35" r="28" fill="none" stroke={dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)"} strokeWidth="5"/>
                      <circle cx="35" cy="35" r="28" fill="none" stroke={getScoreColor(selected.ai_score||50)} strokeWidth="5" strokeLinecap="round"
                        strokeDasharray={`${2*Math.PI*28}`} strokeDashoffset={`${2*Math.PI*28*(1-(selected.ai_score||50)/100)}`}/>
                    </svg>
                    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16,color:getScoreColor(selected.ai_score||50)}}>{selected.ai_score||50}</div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:17,color:text,marginBottom:3}}>{selected.name||selected.customers?.name||selected.phone}</div>
                    <div style={{fontSize:12,color:textMuted,marginBottom:6}}>{selected.phone} · {selected.source}</div>
                    <div style={{fontSize:12,fontWeight:700,color:getScoreColor(selected.ai_score||50)}}>{getScoreLabel(selected.ai_score||50)} Lead</div>
                    {selected.recovery_sent_at && (
                      <div style={{fontSize:11,color:textFaint,marginTop:4}}>Last recovery: {formatTime(selected.recovery_sent_at)}</div>
                    )}
                  </div>
                </div>

                {selected.last_message && (
                  <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:18}}>
                    <div style={{fontSize:11,color:textFaint,fontWeight:600,marginBottom:8,textTransform:"uppercase",letterSpacing:"1px"}}>Last Message</div>
                    <div style={{background:inputBg,border:`1px solid ${cardBorder}`,borderRadius:10,padding:"10px 13px",fontSize:13,color:text,lineHeight:1.5}}>"{selected.last_message}"</div>
                    <div style={{fontSize:11,color:textFaint,marginTop:6}}>{formatTime(selected.last_message_at)}</div>
                  </div>
                )}

                <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:18}}>
                  <div style={{fontSize:11,color:textFaint,fontWeight:600,marginBottom:8,textTransform:"uppercase",letterSpacing:"1px"}}>Recovery Message</div>
                  <textarea value={recoveryMsg} onChange={e=>setRecoveryMsg(e.target.value)}
                    style={{width:"100%",background:inputBg,border:`1px solid ${cardBorder}`,borderRadius:9,padding:"10px 13px",fontSize:13,color:text,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none",resize:"vertical",minHeight:90,lineHeight:1.5}}/>
                  <div style={{fontSize:11,color:textFaint,marginTop:6}}>After sending, this lead won't appear again for {COOLDOWN_DAYS} days</div>
                  <div style={{display:"flex",gap:8,marginTop:10}}>
                    <button onClick={()=>dismissLead(selected.id)} style={{padding:"9px 16px",background:inputBg,border:`1px solid ${cardBorder}`,borderRadius:8,color:textMuted,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Dismiss Forever</button>
                    <button onClick={sendRecovery} disabled={sending} style={{flex:1,padding:"9px",background:accent,border:"none",borderRadius:8,color:"#000",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",opacity:sending?0.7:1}}>
                      {sending?"Sending...":"📲 Send on WhatsApp"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{flex:1}} className="empty-state"><span style={{fontSize:32}}>◉</span><span style={{fontSize:14,fontWeight:600}}>Select a lead</span></div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
