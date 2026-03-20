"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/Toast"
import { sendWhatsApp } from "@/lib/sendWhatsApp"

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

const COOLDOWN_DAYS = 3

export default function Leads() {
  const router = useRouter()
  const toast  = useToast()

  const [userEmail, setUserEmail]   = useState("")
  const [userId, setUserId]         = useState(null)
  const [dark, setDark]             = useState(true)
  const [mobOpen, setMobOpen]       = useState(false)
  const [leads, setLeads]           = useState([])
  const [selected, setSelected]     = useState(null)
  const [filter, setFilter]         = useState("all")
  const [loading, setLoading]       = useState(true)
  const [sending, setSending]       = useState(false)
  const [recoveryMsg, setRecoveryMsg] = useState("")
  const [stats, setStats]           = useState({ total:0, hot:0, warm:0, value:0 })

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) router.push("/login")
      else { setUserEmail(data.user.email || ""); setUserId(data.user.id) }
    })
  }, [])

  useEffect(() => { if (userId) loadLeads() }, [userId])
  useEffect(() => { if (selected) setRecoveryMsg(generateRecoveryMsg(selected)) }, [selected?.id])

  async function loadLeads() {
    setLoading(true)
    try {
      const cooldownDate = new Date()
      cooldownDate.setDate(cooldownDate.getDate() - COOLDOWN_DAYS)

      const { data, error } = await supabase
        .from("leads").select("*, customers(name,phone)")
        .eq("user_id", userId).eq("status", "open")
        .order("ai_score", { ascending: false })
      if (error) throw error

      const list = (data || []).filter(l => {
        if (!l.recovery_sent_at) return true
        return new Date(l.recovery_sent_at) < cooldownDate
      })

      setLeads(list)
      setStats({
        total: list.length,
        hot:   list.filter(l => l.ai_score >= 85).length,
        warm:  list.filter(l => l.ai_score >= 65 && l.ai_score < 85).length,
        value: list.reduce((s, l) => s + (l.estimated_value || 600), 0),
      })
      if (list.length && !selected) setSelected(list[0])
    } catch(e) { toast.error("Failed to load leads") }
    setLoading(false)
  }

  function generateRecoveryMsg(lead) {
    const name = lead.name?.split(" ")[0] || "there"
    const msgs = [
      `Hi ${name}! 👋 We noticed you reached out recently but we didn't connect. We'd love to help — are you still looking for an appointment?`,
      `Hey ${name}! It's been a while since we chatted. We have some great offers this week — want to book a slot? 😊`,
      `Hi ${name}! Just checking in — we have availability this week and would love to have you visit us! 🌟`,
    ]
    return msgs[(lead.id || "").charCodeAt(0) % msgs.length] || msgs[0]
  }

  async function sendRecovery() {
    if (!selected || !recoveryMsg.trim() || sending) return
    setSending(true)
    try {
      const phone = (selected.phone || selected.customers?.phone || "").replace(/[^0-9]/g, "")
      if (!phone) { toast.error("No phone number for this lead"); setSending(false); return }

      // Use secure server route — token never hits browser
      const result = await sendWhatsApp({ to: phone, message: recoveryMsg })
      if (!result.success) { toast.error("Failed to send: " + (result.error || "Unknown error")); setSending(false); return }

      // Update lead — keep status "open", just set recovery_sent_at so it hides for COOLDOWN_DAYS
      await supabase.from("leads").update({
        recovery_message: recoveryMsg,
        recovery_sent_at: new Date().toISOString(),
      }).eq("id", selected.id)

      const remaining = leads.filter(l => l.id !== selected.id)
      setLeads(remaining)
      setSelected(remaining[0] || null)
      toast.success("Recovery message sent to " + (selected.name || phone))
    } catch(e) { toast.error("Failed to send message") }
    setSending(false)
  }

  async function dismissLead(id) {
    try {
      await supabase.from("leads").update({ status: "dismissed" }).eq("id", id)
      const remaining = leads.filter(l => l.id !== id)
      setLeads(remaining)
      setSelected(remaining[0] || null)
      toast.info("Lead dismissed")
    } catch(e) { toast.error("Failed to dismiss lead") }
  }

  const toggleTheme  = () => { const n = !dark; setDark(n); localStorage.setItem("fastrill-theme", n ? "dark" : "light") }
  const handleLogout = async () => {
    try { await supabase.auth.signOut(); router.push("/login") }
    catch(e) { toast.error("Sign out failed") }
  }

  const bg = dark?"#08080e":"#f0f2f5", sb = dark?"#0c0c15":"#ffffff", card = dark?"#0f0f1a":"#ffffff"
  const bdr = dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.08)", cbdr = dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.09)"
  const tx = dark?"#eeeef5":"#111827", txm = dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const txf = dark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.25)", ibg = dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"
  const acc = dark?"#00d084":"#00935a"
  const navText = dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const navActive = dark?"rgba(0,196,125,0.1)":"rgba(0,180,115,0.08)"
  const navActiveBorder = dark?"rgba(0,196,125,0.2)":"rgba(0,180,115,0.2)"
  const navActiveText = dark?"#00c47d":"#00935a"
  const adim = dark?"rgba(0,208,132,0.12)":"rgba(0,147,90,0.1)"
  const ui = userEmail ? userEmail[0].toUpperCase() : "G"

  const getScoreColor = s => s>=85?"#fb7185":s>=65?"#f59e0b":"#38bdf8"
  const getScoreLabel = s => s>=85?"🔥 Hot":s>=65?"🌡 Warm":"❄️ Cold"
  const getInitial    = n => (n||"?")[0].toUpperCase()
  const getColor      = n => { const c=["#00d084","#38bdf8","#a78bfa","#f59e0b","#fb7185"]; return c[(n||"").charCodeAt(0)%c.length] }
  const srcColor      = { whatsapp:"#25d366", instagram:"#e1306c", referral:"#f59e0b", campaign:"#38bdf8", google:"#ea4335" }
  const formatTime    = ts => { if(!ts)return""; const d=Date.now()-new Date(ts); if(d<3600000)return`${Math.floor(d/60000)}m ago`; if(d<86400000)return`${Math.floor(d/3600000)}h ago`; return`${Math.floor(d/86400000)}d ago` }

  const filtered = leads.filter(l => {
    if (filter === "hot")  return l.ai_score >= 85
    if (filter === "warm") return l.ai_score >= 65 && l.ai_score < 85
    if (filter === "cold") return l.ai_score < 65
    return true
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${bg}!important;color:${tx}!important;font-family:'Plus Jakarta Sans',sans-serif!important;}
        .wrap{display:flex;height:100vh;overflow:hidden;background:${bg};}
        .sidebar{width:224px;flex-shrink:0;background:${sb};border-right:1px solid ${bdr};display:flex;flex-direction:column;overflow-y:auto;transition:transform 0.25s;}
        .logo{padding:22px 20px 18px;font-weight:800;font-size:20px;color:${tx};text-decoration:none;display:block;border-bottom:1px solid ${bdr};}
        .logo span{color:${acc};}
        .nav-sec{padding:18px 16px 7px;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${txf};font-weight:600;}
        .nav-item{display:flex;align-items:center;gap:9px;padding:9px 12px;margin:1px 8px;border-radius:8px;cursor:pointer;font-size:13.5px;color:${navText};font-weight:500;transition:all 0.13s;border:1px solid transparent;background:none;width:calc(100% - 16px);text-align:left;font-family:'Plus Jakarta Sans',sans-serif;}
        .nav-item:hover{background:${ibg};color:${tx};}
        .nav-item.active{background:${navActive};color:${navActiveText};font-weight:600;border-color:${navActiveBorder};}
        .nav-icon{font-size:13px;width:18px;text-align:center;flex-shrink:0;}
        .sbf{margin-top:auto;padding:14px;border-top:1px solid ${bdr};}
        .uc{display:flex;align-items:center;gap:9px;padding:9px;border-radius:9px;background:${ibg};border:1px solid ${cbdr};}
        .ua{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,${acc},#0ea5e9);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#fff;flex-shrink:0;}
        .lb{margin-top:7px;width:100%;padding:7px;border-radius:7px;background:transparent;border:1px solid ${cbdr};font-size:12px;color:${txm};cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .lb:hover{border-color:#fca5a5;color:#ef4444;}
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .topbar{height:54px;flex-shrink:0;border-bottom:1px solid ${bdr};display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:${sb};}
        .ttog{display:flex;align-items:center;gap:6px;padding:5px 10px;background:${ibg};border:1px solid ${cbdr};border-radius:8px;cursor:pointer;font-size:11.5px;color:${txm};font-family:'Plus Jakarta Sans',sans-serif;}
        .tpill{width:30px;height:16px;border-radius:100px;background:${dark?acc:"#d1d5db"};position:relative;flex-shrink:0;}
        .tpill::after{content:'';position:absolute;top:2px;width:12px;height:12px;border-radius:50%;background:#fff;left:${dark?"16px":"2px"};}
        .content{flex:1;display:flex;overflow:hidden;}
        .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:8px;color:${txf};text-align:center;}
        .hbtn{display:none;background:${ibg};border:1px solid ${cbdr};border-radius:8px;padding:6px 9px;cursor:pointer;font-size:17px;color:${tx};line-height:1;margin-right:2px;}
        .mob-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:299;cursor:pointer;}
        .mob-ov.open{display:block;}
        .bnav{display:none;position:fixed;bottom:0;left:0;right:0;background:${sb};border-top:1px solid ${bdr};padding:6px 0;z-index:200;}
        .bni{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 6px;border:none;background:transparent;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;flex:1;}
        .bnic{font-size:17px;color:rgba(255,255,255,0.3);}
        .bnil{font-size:9px;font-weight:600;color:rgba(255,255,255,0.3);}
        .bni.on .bnic,.bni.on .bnil{color:${acc};}
        @media(max-width:767px){
          .wrap{position:relative;}
          .sidebar{position:fixed;top:0;left:0;height:100vh;z-index:300;transform:translateX(-100%);width:240px!important;box-shadow:4px 0 24px rgba(0,0,0,0.5);}
          .sidebar.open{transform:translateX(0);}
          .mob-ov.open{display:block;}
          .hbtn{display:flex;}
          .bnav{display:flex;}
          .main{padding-bottom:60px;}
          .topbar{padding:0 12px!important;}
          .lead-detail{display:none;}
          .lead-detail.show{display:flex!important;}
          .lead-list{width:100%!important;}
        }
        textarea:focus{border-color:${acc}88!important;outline:none;}
      `}</style>

      <div className="wrap">
        <div className={"mob-ov"+(mobOpen?" open":"")} onClick={()=>setMobOpen(false)}/>
        <aside className={"sidebar"+(mobOpen?" open":"")}>
          <a href="/dashboard" className="logo">fast<span>rill</span></a>
          <div className="nav-sec">Platform</div>
          {NAV.map(item=>(
            <button key={item.id} className={"nav-item"+(item.id==="leads"?" active":"")} onClick={()=>router.push(item.path)}>
              <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
          <div className="sbf">
            <div className="uc">
              <div className="ua">{ui}</div>
              <div style={{fontSize:11.5,color:txm,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{userEmail||"Loading..."}</div>
            </div>
            <button className="lb" onClick={handleLogout}>↩ Sign out</button>
          </div>
        </aside>

        <div className="main">
          <div className="topbar">
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button className="hbtn" onClick={()=>setMobOpen(s=>!s)}>☰</button>
              <span style={{fontWeight:700,fontSize:15,color:tx}}>Lead Recovery</span>
              {stats.total>0&&<span style={{fontSize:12,color:txf,background:ibg,border:`1px solid ${cbdr}`,borderRadius:100,padding:"2px 10px",fontWeight:600}}>{stats.total} leads</span>}
            </div>
            <button className="ttog" onClick={toggleTheme}><span>{dark?"🌙":"☀️"}</span><div className="tpill"/><span>{dark?"Dark":"Light"}</span></button>
          </div>

          {/* Stats banner */}
          {stats.total>0&&(
            <div style={{padding:"10px 24px",borderBottom:`1px solid ${bdr}`,background:`linear-gradient(135deg,rgba(251,113,133,0.07),rgba(245,158,11,0.04))`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <div style={{fontSize:13,fontWeight:600,color:tx}}>
                💰 <span style={{color:"#fb7185"}}>₹{stats.value.toLocaleString()}</span> in unconverted leads
              </div>
              <div style={{display:"flex",gap:16,fontSize:12}}>
                <span style={{color:"#fb7185",fontWeight:600}}>🔥 {stats.hot} Hot</span>
                <span style={{color:"#f59e0b",fontWeight:600}}>🌡 {stats.warm} Warm</span>
                <span style={{color:txf}}>· Hides for {COOLDOWN_DAYS}d after sending</span>
              </div>
            </div>
          )}

          <div className="content">
            {/* Lead list */}
            <div className="lead-list" style={{width:380,flexShrink:0,borderRight:`1px solid ${bdr}`,display:"flex",flexDirection:"column",background:sb}}>
              <div style={{padding:"10px 12px",borderBottom:`1px solid ${bdr}`,display:"flex",gap:4,flexWrap:"wrap"}}>
                {["all","hot","warm","cold"].map(f=>(
                  <button key={f} onClick={()=>setFilter(f)} style={{padding:"4px 12px",borderRadius:100,fontSize:11,fontWeight:600,cursor:"pointer",border:`1px solid ${filter===f?acc+"44":cbdr}`,background:filter===f?adim:"transparent",color:filter===f?acc:txm,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                    {f==="hot"?"🔥 Hot":f==="warm"?"🌡 Warm":f==="cold"?"❄️ Cold":"All ("+stats.total+")"}
                  </button>
                ))}
              </div>
              <div style={{flex:1,overflowY:"auto"}}>
                {loading?(
                  <div className="empty-state"><span style={{fontSize:12}}>Loading leads...</span></div>
                ):filtered.length===0?(
                  <div className="empty-state" style={{padding:"32px 20px"}}>
                    <span style={{fontSize:32,opacity:0.3}}>◉</span>
                    <span style={{fontWeight:600,fontSize:13}}>No leads to recover</span>
                    <span style={{fontSize:11,color:txf,maxWidth:220}}>Sent leads reappear after {COOLDOWN_DAYS} days if still not converted</span>
                  </div>
                ):filtered.map(l=>{
                  const name=l.name||l.customers?.name||l.phone
                  const color=getColor(name)
                  const isSelected=selected?.id===l.id
                  return(
                    <div key={l.id} onClick={()=>setSelected(l)}
                      style={{padding:"12px 16px",borderBottom:`1px solid ${bdr}`,cursor:"pointer",background:isSelected?adim:"transparent",borderLeft:isSelected?`3px solid ${acc}`:"3px solid transparent",transition:"background 0.1s"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:5}}>
                        <div style={{width:36,height:36,borderRadius:9,background:`linear-gradient(135deg,${color}88,${color}44)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:"#fff",flexShrink:0}}>{getInitial(name)}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:600,fontSize:13,color:tx,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</span>
                            <span style={{fontSize:10.5,fontWeight:700,color:getScoreColor(l.ai_score||50),flexShrink:0,marginLeft:4}}>{getScoreLabel(l.ai_score||50)}</span>
                          </div>
                          <div style={{fontSize:11.5,color:txm,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>"{l.last_message||"No message"}"</div>
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <span style={{fontSize:10,fontWeight:600,color:srcColor[l.source]||txf,background:(srcColor[l.source]||txf)+"18",padding:"2px 7px",borderRadius:100}}>{l.source||"whatsapp"}</span>
                        <span style={{fontSize:10,color:txf}}>{formatTime(l.last_message_at)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Detail panel */}
            {selected?(
              <div className="lead-detail show" style={{flex:1,overflowY:"auto",padding:24,display:"flex",flexDirection:"column",gap:14,background:bg}}>
                {/* Score card */}
                <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:13,padding:20,display:"flex",alignItems:"center",gap:20}}>
                  <div style={{position:"relative",width:72,height:72,flexShrink:0}}>
                    <svg width="72" height="72" viewBox="0 0 72 72" style={{transform:"rotate(-90deg)"}}>
                      <circle cx="36" cy="36" r="29" fill="none" stroke={dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)"} strokeWidth="5"/>
                      <circle cx="36" cy="36" r="29" fill="none" stroke={getScoreColor(selected.ai_score||50)} strokeWidth="5" strokeLinecap="round"
                        strokeDasharray={`${2*Math.PI*29}`} strokeDashoffset={`${2*Math.PI*29*(1-(selected.ai_score||50)/100)}`}/>
                    </svg>
                    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16,color:getScoreColor(selected.ai_score||50)}}>{selected.ai_score||50}</div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:17,color:tx,marginBottom:3}}>{selected.name||selected.customers?.name||selected.phone}</div>
                    <div style={{fontSize:12,color:txm,marginBottom:5}}>{selected.phone} · {selected.source||"whatsapp"}</div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:12,fontWeight:700,color:getScoreColor(selected.ai_score||50)}}>{getScoreLabel(selected.ai_score||50)}</span>
                      {selected.estimated_value>0&&<span style={{fontSize:12,color:acc,fontWeight:600}}>· Est. ₹{selected.estimated_value}</span>}
                    </div>
                    {selected.recovery_sent_at&&(
                      <div style={{fontSize:11,color:txf,marginTop:4}}>Last recovery: {formatTime(selected.recovery_sent_at)} · reappears in {COOLDOWN_DAYS}d</div>
                    )}
                  </div>
                </div>

                {/* Last message */}
                {selected.last_message&&(
                  <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:13,padding:18}}>
                    <div style={{fontSize:11,color:txf,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:"1px"}}>Last Message</div>
                    <div style={{background:ibg,border:`1px solid ${cbdr}`,borderRadius:10,padding:"10px 13px",fontSize:13,color:tx,lineHeight:1.5,fontStyle:"italic"}}>"{selected.last_message}"</div>
                    <div style={{fontSize:11,color:txf,marginTop:6}}>{formatTime(selected.last_message_at)}</div>
                  </div>
                )}

                {/* Recovery message */}
                <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:13,padding:18}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div style={{fontSize:11,color:txf,fontWeight:700,textTransform:"uppercase",letterSpacing:"1px"}}>Recovery Message</div>
                    <button onClick={()=>setRecoveryMsg(generateRecoveryMsg(selected))} style={{fontSize:11,color:acc,background:"transparent",border:"none",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>↺ Regenerate</button>
                  </div>
                  <textarea value={recoveryMsg} onChange={e=>setRecoveryMsg(e.target.value)} rows={4}
                    style={{width:"100%",background:ibg,border:`1px solid ${cbdr}`,borderRadius:9,padding:"10px 13px",fontSize:13,color:tx,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none",resize:"vertical",lineHeight:1.5}}/>
                  <div style={{fontSize:11,color:txf,marginTop:6}}>After sending, this lead hides for {COOLDOWN_DAYS} days. It reappears if still not converted.</div>
                  <div style={{display:"flex",gap:8,marginTop:12}}>
                    <button onClick={()=>dismissLead(selected.id)}
                      style={{padding:"9px 16px",background:ibg,border:`1px solid ${cbdr}`,borderRadius:8,color:txm,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                      Dismiss Forever
                    </button>
                    <button onClick={()=>router.push("/dashboard/conversations")}
                      style={{padding:"9px 14px",background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.25)",borderRadius:8,color:"#a78bfa",fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                      💬 Open Chat
                    </button>
                    <button onClick={sendRecovery} disabled={sending||!recoveryMsg.trim()}
                      style={{flex:1,padding:"9px",background:!recoveryMsg.trim()?ibg:acc,border:"none",borderRadius:8,color:!recoveryMsg.trim()?txm:"#000",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",opacity:sending?0.7:1}}>
                      {sending?"Sending...":"📲 Send Recovery Message"}
                    </button>
                  </div>
                </div>
              </div>
            ):(
              <div style={{flex:1}} className="empty-state">
                <span style={{fontSize:32}}>◉</span>
                <span style={{fontSize:14,fontWeight:600}}>Select a lead to recover</span>
                <span style={{fontSize:12,color:txf}}>Send personalised messages to win them back</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav className="bnav">
        {[
          {id:"overview",icon:"⬡",label:"Home",    path:"/dashboard"},
          {id:"inbox",   icon:"◎",label:"Chats",   path:"/dashboard/conversations"},
          {id:"bookings",icon:"◷",label:"Bookings",path:"/dashboard/bookings"},
          {id:"leads",   icon:"◉",label:"Leads",   path:"/dashboard/leads"},
          {id:"contacts",icon:"◑",label:"Customers",path:"/dashboard/contacts"},
        ].map(item=>(
          <button key={item.id} className={"bni"+(item.id==="leads"?" on":"")} onClick={()=>router.push(item.path)}>
            <span className="bnic">{item.icon}</span><span className="bnil">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
