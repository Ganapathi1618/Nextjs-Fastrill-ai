"use client"
import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const NAV = [
  { id:"overview", label:"Revenue Engine",  icon:"⬡", path:"/dashboard" },
  { id:"inbox",    label:"Conversations",   icon:"◎", path:"/dashboard/conversations" },
  { id:"bookings", label:"Bookings",        icon:"◷", path:"/dashboard/bookings" },
  { id:"campaigns",label:"Campaigns",       icon:"◆", path:"/dashboard/campaigns" },
  { id:"leads",    label:"Lead Recovery",   icon:"◉", path:"/dashboard/leads" },
  { id:"contacts", label:"Customers",       icon:"◑", path:"/dashboard/contacts" },
  { id:"analytics",label:"Analytics",       icon:"▦", path:"/dashboard/analytics" },
  { id:"settings", label:"Settings",        icon:"◌", path:"/dashboard/settings" },
]

const TIMES = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30"]

// FIX: Standardized local time formatting for both sidebar and chat
function formatMsgTime(ts) {
  if (!ts) return ""
  try {
    const d = new Date(ts)
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    })
  } catch { return "" }
}

function formatConvoTime(ts) {
  if (!ts) return ""
  try {
    const d = new Date(ts)
    const now = new Date()
    
    // Check if message was sent today
    const isToday = d.getDate() === now.getDate() &&
                    d.getMonth() === now.getMonth() &&
                    d.getFullYear() === now.getFullYear()

    if (isToday) {
      // Use exact same formatting as chat bubbles for consistency
      return d.toLocaleTimeString("en-IN", { 
        hour: "2-digit", 
        minute: "2-digit", 
        hour12: true 
      })
    }

    const diff = now - d
    if (diff < 7 * 86_400_000) return d.toLocaleDateString("en-IN", { weekday: "short" })
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
  } catch { return "" }
}

export default function Conversations() {
  const router = useRouter()
  const [userEmail, setUserEmail]   = useState("")
  const [userId, setUserId]         = useState(null)
  const [dark, setDark]             = useState(true)
  const [mobSidebarOpen, setMobSidebarOpen] = useState(false)
  const [mobChatOpen, setMobChatOpen] = useState(false)
  const [convos, setConvos]         = useState([])
  const [selected, setSelected]     = useState(null)
  const [messages, setMessages]     = useState([])
  const [filter, setFilter]         = useState("all")
  const [search, setSearch]         = useState("")
  const [msgInput, setMsgInput]     = useState("")
  const [loading, setLoading]       = useState(true)
  const [sending, setSending]       = useState(false)
  const [waConn, setWaConn]         = useState(null)

  const [showBooking, setShowBooking]     = useState(false)
  const [services, setServices]           = useState([])
  const [bookingForm, setBookingForm]     = useState({ service:"", date:"", time:"", amount:"", staff:"", notes:"" })
  const [savingBooking, setSavingBooking] = useState(false)

  const msgsEndRef        = useRef(null)
  const selectedRef       = useRef(null)

  useEffect(() => { selectedRef.current = selected }, [selected])

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login")
      else { setUserEmail(data.user.email || ""); setUserId(data.user.id) }
    })
  }, [])

  useEffect(() => {
    if (!userId) return
    loadConvos()
    loadWaConn()
    loadServices()

    const convoCh = supabase.channel("convos-" + userId)
      .on("postgres_changes", {
        event:  "*",
        schema: "public",
        table:  "conversations",
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        if (payload.eventType === "UPDATE" && payload.new) {
          setConvos(prev => {
            const updated = prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c)
            return [...updated].sort((a,b) => new Date(b.last_message_at||0) - new Date(a.last_message_at||0))
          })
        } else {
          loadConvos()
        }
      })
      .subscribe()
    return () => supabase.removeChannel(convoCh)
  }, [userId])

  useEffect(() => {
    if (!selected?.id) return
    loadMessages(selected.id, selected.phone)
    supabase.from("conversations").update({ unread_count: 0 }).eq("id", selected.id)

    const msgCh = supabase.channel("msgs-" + selected.id)
      .on("postgres_changes", {
        event:  "INSERT",
        schema: "public",
        table:  "messages",
        filter: `conversation_id=eq.${selected.id}`
      }, (payload) => {
        if (selectedRef.current?.id !== selected.id) return
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev
          return [...prev, payload.new]
        })
        setConvos(prev => prev.map(c =>
          c.id === selected.id
            ? { ...c, last_message: payload.new.message_text, unread_count: 0, last_message_at: payload.new.created_at }
            : c
        ))
      })
      .subscribe()
    return () => supabase.removeChannel(msgCh)
  }, [selected?.id])

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function loadWaConn() {
    const { data } = await supabase.from("whatsapp_connections").select("*").eq("user_id", userId).maybeSingle()
    setWaConn(data || null)
  }

  async function loadServices() {
    const { data } = await supabase.from("services").select("name, price").eq("user_id", userId)
    setServices(data || [])
  }

  async function loadConvos() {
    setLoading(true)
    const { data, error } = await supabase
      .from("conversations")
      .select("*, customers(name, phone)")
      .eq("user_id", userId)
      .order("last_message_at", { ascending: false })

    const enriched = (data || []).map(c => ({
      ...c,
      _displayName:  c.customers?.name  || c.phone || "Unknown",
      _displayPhone: c.customers?.phone || c.phone || ""
    }))

    setConvos(enriched)
    if (enriched.length && !selectedRef.current) setSelected(enriched[0])
    setLoading(false)
  }

  async function loadMessages(convoId, customerPhone) {
    const { data: byConvoId } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convoId)
      .order("created_at", { ascending: true })

    if (byConvoId?.length > 0) {
      if (selectedRef.current?.id === convoId) setMessages(byConvoId)
      return
    }

    if (customerPhone) {
      const digits = customerPhone.replace(/[^0-9]/g, "")
      const variants = [...new Set([customerPhone, digits, "+" + digits])]
      let byPhone = []
      for (const variant of variants) {
        const { data } = await supabase.from("messages").select("*").eq("customer_phone", variant).eq("user_id", userId).order("created_at", { ascending: true })
        if (data?.length) { byPhone = data; break }
      }
      if (byPhone.length) {
        supabase.from("messages").update({ conversation_id: convoId }).in("id", byPhone.map(m => m.id))
        if (selectedRef.current?.id === convoId) setMessages(byPhone)
        return
      }
    }
    if (selectedRef.current?.id === convoId) setMessages([])
  }

  async function toggleAI(convoId, current) {
    const newVal = !current
    await supabase.from("conversations").update({ ai_enabled: newVal }).eq("id", convoId)
    setConvos(prev => prev.map(c => c.id === convoId ? { ...c, ai_enabled: newVal } : c))
    if (selected?.id === convoId) setSelected(prev => ({ ...prev, ai_enabled: newVal }))
  }

  async function sendMsg() {
    if (!msgInput.trim() || !selected || sending) return
    if (!waConn) return alert("WhatsApp not connected.")

    setSending(true)
    const text  = msgInput.trim()
    setMsgInput("")
    const phone = (selected.phone || "").replace("+","").replace(/\s/g,"")

    try {
      const res = await fetch(`https://graph.facebook.com/v18.0/${waConn.phone_number_id}/messages`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${waConn.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product:"whatsapp", to:phone, type:"text", text:{ body:text } })
      })
      const waData = await res.json()
      const now = new Date().toISOString()
      const { data: savedMsg } = await supabase.from("messages").insert({
        conversation_id: selected.id,
        customer_phone:  selected.phone,
        direction:       "outbound",
        message_text:    text,
        status:          "sent",
        user_id:         userId,
        created_at:      now
      }).select().single()

      if (savedMsg) setMessages(prev => [...prev, savedMsg])
      await supabase.from("conversations").update({ last_message: text, last_message_at: now }).eq("id", selected.id)
    } catch (e) { alert(e.message) }
    setSending(false)
  }

  async function saveBooking() {
    if (!bookingForm.service || !bookingForm.date) return alert("Required fields missing")
    setSavingBooking(true)
    try {
      const now = new Date().toISOString()
      await supabase.from("bookings").insert({
        user_id: userId,
        customer_name: selected._displayName,
        customer_phone: selected.phone,
        service: bookingForm.service,
        booking_date: bookingForm.date,
        booking_time: bookingForm.time,
        amount: parseInt(bookingForm.amount) || 0,
        created_at: now
      })
      setShowBooking(false)
    } catch (e) { alert(e.message) }
    setSavingBooking(false)
  }

  const toggleTheme  = () => { const n=!dark; setDark(n); localStorage.setItem("fastrill-theme",n?"dark":"light") }
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login") }

  const bg             = dark ? "#08080e" : "#f0f2f5"
  const sidebar        = dark ? "#0c0c15" : "#ffffff"
  const card           = dark ? "#0f0f1a" : "#ffffff"
  const border         = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"
  const cardBorder     = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)"
  const text           = dark ? "#eeeef5" : "#111827"
  const textMuted      = dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)"
  const textFaint      = dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)"
  const inputBg        = dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"
  const accent         = dark ? "#00d084" : "#00935a"
  const accentDim      = dark ? "rgba(0,208,132,0.12)" : "rgba(0,147,90,0.1)"

  const filtered = convos.filter(c => {
    const name = (c._displayName || "").toLowerCase()
    return name.includes(search.toLowerCase()) && (filter==="all" || (filter==="ai" && c.ai_enabled) || (filter==="human" && !c.ai_enabled))
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${bg}!important;color:${text}!important;font-family:'Plus Jakarta Sans',sans-serif!important;}
        .wrap{display:flex;height:100vh;overflow:hidden;}
        .sidebar{width:224px;background:${sidebar};border-right:1px solid ${border};display:flex;flex-direction:column;}
        .logo{padding:22px 20px;font-weight:800;font-size:20px;color:${text};text-decoration:none;border-bottom:1px solid ${border};}
        .logo span{color:${accent};}
        .nav-item{display:flex;align-items:center;gap:9px;padding:10px 14px;margin:2px 10px;border-radius:8px;cursor:pointer;font-size:13.5px;color:${textMuted};border:none;background:none;width:calc(100% - 20px);text-align:left;}
        .nav-item.active{background:${accentDim};color:${accent};font-weight:600;}
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .topbar{height:54px;border-bottom:1px solid ${border};display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:${sidebar};}
        .inbox-wrap{flex:1;display:flex;overflow:hidden;}
        .clist{width:300px;border-right:1px solid ${border};display:flex;flex-direction:column;background:${sidebar};}
        .clist-top{padding:12px;border-bottom:1px solid ${border};}
        .search-box{background:${inputBg};border:1px solid ${cardBorder};border-radius:8px;padding:7px 10px;display:flex;gap:8px;}
        .search-box input{background:transparent;border:none;outline:none;color:${text};font-size:13px;flex:1;}
        .filters{display:flex;gap:5px;padding-top:10px;}
        .filter-btn{padding:4px 10px;border-radius:20px;font-size:11px;cursor:pointer;border:1px solid ${cardBorder};background:transparent;color:${textMuted};}
        .filter-btn.active{background:${accent};color:#000;border:none;}
        .clist-items{flex:1;overflow-y:auto;}
        .c-item{padding:12px 16px;border-bottom:1px solid ${border};cursor:pointer;}
        .c-item.sel{background:${accentDim};border-left:3px solid ${accent};}
        .chat-area{flex:1;display:flex;flex-direction:column;background:${bg};}
        .chat-head{padding:12px 18px;border-bottom:1px solid ${border};display:flex;align-items:center;justify-content:space-between;background:${card};}
        .chat-msgs{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:12px;}
        .msg-row{display:flex;flex-direction:column;max-width:70%;}
        .msg-row.outbound{align-self:flex-end;align-items:flex-end;}
        .msg-row.inbound{align-self:flex-start;align-items:flex-start;}
        .msg-bubble{padding:10px 14px;border-radius:12px;font-size:13.5px;line-height:1.5;}
        .msg-bubble.inbound{background:${card};border:1px solid ${cardBorder};}
        .msg-bubble.outbound-human{background:rgba(167,139,250,0.15);border:1px solid rgba(167,139,250,0.3);}
        .msg-bubble.outbound-ai{background:${accent}22;border:1px solid ${accent}44;}
        .msg-time{font-size:10px;color:${textFaint};margin-top:4px;}
        .chat-input{padding:15px;border-top:1px solid ${border};background:${card};display:flex;gap:10px;}
        .msg-field{flex:1;background:${inputBg};border:1px solid ${cardBorder};border-radius:10px;padding:10px;color:${text};resize:none;outline:none;}
        .send-btn{background:${accent};color:#000;border:none;padding:0 20px;border-radius:10px;font-weight:700;cursor:pointer;}
      `}</style>

      <div className="wrap">
        <aside className="sidebar">
          <a href="/dashboard" className="logo">fast<span>rill</span></a>
          <div style={{padding:"15px 20px 5px", fontSize:11, color:textFaint, fontWeight:700}}>PLATFORM</div>
          {NAV.map(item => (
            <button key={item.id} className={`nav-item ${item.id==="inbox"?"active":""}`} onClick={() => router.push(item.path)}>
              {item.icon} {item.label}
            </button>
          ))}
          <div style={{marginTop:"auto", padding:15, borderTop:`1px solid ${border}`}}>
            <button className="nav-item" onClick={handleLogout}>↩ Sign out</button>
          </div>
        </aside>

        <div className="main">
          <div className="topbar">
            <span style={{fontWeight:700}}>Conversations</span>
            <button className="filter-btn" onClick={toggleTheme} style={{padding:"6px 12px"}}>{dark?"🌙 Dark":"☀️ Light"}</button>
          </div>

          <div className="inbox-wrap">
            <div className="clist">
              <div className="clist-top">
                <div className="search-box">
                  <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} />
                </div>
                <div className="filters">
                  {["all","ai","human"].map(f=>(
                    <button key={f} className={`filter-btn ${filter===f?"active":""}`} onClick={()=>setFilter(f)}>{f.toUpperCase()}</button>
                  ))}
                </div>
              </div>
              <div className="clist-items">
                {filtered.map(c => (
                  <div key={c.id} className={`c-item ${selected?.id===c.id?"sel":""}`} onClick={()=>setSelected(c)}>
                    <div style={{display:"flex", justifyContent:"space-between", marginBottom:4}}>
                      <span style={{fontWeight:600, fontSize:13}}>{c._displayName}</span>
                      <span style={{fontSize:10, color:textFaint}}>{formatConvoTime(c.last_message_at)}</span>
                    </div>
                    <div style={{fontSize:12, color:textMuted, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
                      {c.last_message || "No messages"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selected ? (
              <div className="chat-area">
                <div className="chat-head">
                  <div>
                    <div style={{fontWeight:700}}>{selected._displayName}</div>
                    <div style={{fontSize:11, color:textMuted}}>{selected.phone}</div>
                  </div>
                  <div style={{display:"flex", gap:10}}>
                    <button onClick={()=>setShowBooking(true)} style={{background:accent, border:"none", padding:"6px 12px", borderRadius:6, fontWeight:700, cursor:"pointer"}}>Book</button>
                    <button onClick={()=>toggleAI(selected.id, selected.ai_enabled)} style={{background:selected.ai_enabled?accent:inputBg, color:selected.ai_enabled?"#000":text, border:"none", padding:"6px 12px", borderRadius:6, cursor:"pointer"}}>
                      AI {selected.ai_enabled?"ON":"OFF"}
                    </button>
                  </div>
                </div>

                <div className="chat-msgs">
                  {messages.map((m, i) => (
                    <div key={m.id || i} className={`msg-row ${m.direction}`}>
                      <div className={`msg-bubble ${m.direction==="inbound"?"inbound":m.is_ai?"outbound-ai":"outbound-human"}`}>
                        {m.message_text}
                      </div>
                      <div className="msg-time">{formatMsgTime(m.created_at)}</div>
                    </div>
                  ))}
                  <div ref={msgsEndRef} />
                </div>

                <div className="chat-input">
                  {selected.ai_enabled ? (
                    <div style={{flex:1, textAlign:"center", fontSize:12, color:textFaint}}>AI is handling this chat. Turn AI OFF to reply.</div>
                  ) : (
                    <>
                      <textarea className="msg-field" placeholder="Type a message..." value={msgInput} onChange={e=>setMsgInput(e.target.value)} />
                      <button className="send-btn" onClick={sendMsg} disabled={sending}>Send</button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:textFaint}}>Select a conversation to start</div>
            )}
          </div>
        </div>
      </div>

      {showBooking && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000}}>
          <div style={{background:card, padding:30, borderRadius:15, width:400}}>
            <h3 style={{marginBottom:20}}>New Booking</h3>
            <input style={{width:"100%", padding:10, marginBottom:10, background:inputBg, border:`1px solid ${border}`, color:text}} type="date" value={bookingForm.date} onChange={e=>setBookingForm({...bookingForm, date:e.target.value})} />
            <button onClick={saveBooking} style={{width:"100%", padding:10, background:accent, border:"none", borderRadius:8, fontWeight:700}}>Confirm</button>
            <button onClick={()=>setShowBooking(false)} style={{width:"100%", padding:10, background:"transparent", color:textMuted, border:"none", marginTop:10}}>Cancel</button>
          </div>
        </div>
      )}
    </>
  )
}
