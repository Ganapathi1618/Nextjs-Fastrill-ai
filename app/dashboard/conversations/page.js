"use client"
import { useEffect, useState, useRef } from "react"
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

const TIMES = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30"]

export default function Conversations() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [userId, setUserId] = useState(null)
  const [dark, setDark] = useState(true)
  const [convos, setConvos] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [msgInput, setMsgInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [waConn, setWaConn] = useState(null)

  // Booking modal
  const [showBooking, setShowBooking] = useState(false)
  const [services, setServices] = useState([])
  const [bookingForm, setBookingForm] = useState({ service:"", date:"", time:"", amount:"", staff:"", notes:"" })
  const [savingBooking, setSavingBooking] = useState(false)

  const msgsEndRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login")
      else { setUserEmail(data.user.email||""); setUserId(data.user.id) }
    })
  }, [])

  useEffect(() => {
    if (!userId) return
    loadConvos()
    loadWaConn()
    loadServices()

    // Real-time: new conversations or updates
    const ch = supabase.channel("convos-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations", filter: `user_id=eq.${userId}` },
        () => loadConvos())
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [userId])

  useEffect(() => {
    if (!selected?.id) return
    loadMessages(selected.id, selected.phone)

    // Mark as read
    supabase.from("conversations").update({ unread_count: 0 }).eq("id", selected.id)

    // Real-time messages for this conversation
    const ch = supabase.channel("msgs-" + selected.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selected.id}` },
        (payload) => {
          setMessages(prev => {
            // avoid duplicates
            if (prev.find(m => m.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })
          // Update convo list last message
          setConvos(prev => prev.map(c => c.id === selected.id ? { ...c, last_message: payload.new.content || payload.new.message_text, unread_count: 0 } : c))
        })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [selected?.id])

  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

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
    // Load conversations with optional customer join
    const { data, error } = await supabase
      .from("conversations")
      .select("*, customers(name, phone)")
      .eq("user_id", userId)
      .order("last_message_at", { ascending: false })

    if (error) console.error("loadConvos error:", error.message)

    // For any conversation missing customer info, patch display name from phone
    const enriched = (data || []).map(c => ({
      ...c,
      _displayName: c.customers?.name || c.phone || "Unknown",
      _displayPhone: c.customers?.phone || c.phone || ""
    }))

    setConvos(enriched)
    if (enriched.length && !selected) setSelected(enriched[0])
    setLoading(false)
  }

  async function loadMessages(convoId, customerPhone) {
    // Primary: load by conversation_id
    const { data: byConvoId } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convoId)
      .order("created_at", { ascending: true })

    if (byConvoId && byConvoId.length > 0) {
      // Also fix any messages saved with null conversation_id for this phone
      if (customerPhone) {
        const { data: orphaned } = await supabase
          .from("messages")
          .select("*")
          .eq("customer_phone", customerPhone)
          .is("conversation_id", null)
          .eq("user_id", userId)
          .order("created_at", { ascending: true })
        if (orphaned?.length) {
          // Backfill conversation_id on orphaned messages
          const ids = orphaned.map(m => m.id)
          await supabase.from("messages").update({ conversation_id: convoId }).in("id", ids)
          // Merge and sort all messages
          const all = [...byConvoId, ...orphaned].sort((a,b) => new Date(a.created_at) - new Date(b.created_at))
          const unique = all.filter((m,i,arr) => arr.findIndex(x=>x.id===m.id)===i)
          setMessages(unique)
          return
        }
      }
      setMessages(byConvoId)
      return
    }

    // Fallback: load by customer_phone if conversation_id returns nothing
    if (customerPhone) {
      const { data: byPhone } = await supabase
        .from("messages")
        .select("*")
        .eq("customer_phone", customerPhone)
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
      if (byPhone?.length) {
        // Backfill conversation_id on all these messages
        const ids = byPhone.map(m => m.id)
        await supabase.from("messages").update({ conversation_id: convoId }).in("id", ids)
        setMessages(byPhone)
        return
      }
    }
    setMessages([])
  }

  async function toggleAI(convoId, current) {
    const newVal = !current
    await supabase.from("conversations").update({ ai_enabled: newVal }).eq("id", convoId)
    setConvos(prev => prev.map(c => c.id === convoId ? { ...c, ai_enabled: newVal } : c))
    if (selected?.id === convoId) setSelected(prev => ({ ...prev, ai_enabled: newVal }))
  }

  async function sendMsg() {
    if (!msgInput.trim() || !selected || sending) return
    if (!waConn) { alert("WhatsApp not connected. Go to Settings to connect."); return }

    setSending(true)
    const text = msgInput.trim()
    setMsgInput("")

    const phone = (selected.phone || selected.customers?.phone || "").replace("+","").replace(/\s/g,"")

    try {
      // Send via WhatsApp
      const res = await fetch(`https://graph.facebook.com/v18.0/${waConn.phone_number_id}/messages`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${waConn.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product:"whatsapp", to:phone, type:"text", text:{ body:text, preview_url:false } })
      })
      const waData = await res.json()
      if (waData.error) { alert("WhatsApp error: " + waData.error.message); setSending(false); return }

      // Save to DB
      const { data: savedMsg } = await supabase.from("messages").insert({
        conversation_id: selected.id,
        customer_phone:  selected.phone,
        direction:       "outbound",
        message_type:    "text",
        message_text:    text,
        content:         text,
        status:          "sent",
        is_ai:           false,
        user_id:         userId,
        wa_message_id:   waData?.messages?.[0]?.id || null,
        created_at:      new Date().toISOString()
      }).select().single()

      if (savedMsg) setMessages(prev => [...prev, savedMsg])
      await supabase.from("conversations").update({ last_message: text, last_message_at: new Date().toISOString() }).eq("id", selected.id)
      setConvos(prev => prev.map(c => c.id === selected.id ? { ...c, last_message: text } : c))

    } catch(e) { console.error(e); alert("Failed to send: " + e.message) }
    setSending(false)
  }

  async function saveBooking() {
    if (!bookingForm.service || !bookingForm.date) return alert("Service and date are required")
    setSavingBooking(true)

    const customerName  = selected?._displayName || selected?.customers?.name || selected?.phone || "Customer"
    const customerPhone = selected?.phone || selected?.customers?.phone || ""
    // Clean phone: remove +, spaces, dashes — WhatsApp needs digits only with country code
    const phoneForWA = customerPhone.replace(/[^0-9]/g, "")

    try {
      // ── Save booking to DB ──
      const { data: booking, error: bookErr } = await supabase
        .from("bookings")
        .insert({
          user_id:        userId,
          customer_name:  customerName,
          customer_phone: customerPhone,
          customer_id:    selected?.customer_id || selected?.customers?.id || null,
          service:        bookingForm.service,
          booking_date:   bookingForm.date,
          booking_time:   bookingForm.time || null,
          amount:         parseInt(bookingForm.amount) || 0,
          staff:          bookingForm.staff || null,
          notes:          bookingForm.notes || null,
          status:         "confirmed",
          ai_booked:      false,
          created_at:     new Date().toISOString()
        })
        .select()
        .single()

      if (bookErr) {
        console.error("Booking DB error:", bookErr)
        alert("Could not save booking: " + bookErr.message)
        setSavingBooking(false)
        return
      }

      // ── Build confirmation message ──
      const confirmMsg = [
        "✅ *Booking Confirmed!*",
        "",
        `📋 Service: ${bookingForm.service}`,
        `📅 Date: ${bookingForm.date}`,
        bookingForm.time   ? `⏰ Time: ${bookingForm.time}`   : "",
        bookingForm.staff  ? `👤 Staff: ${bookingForm.staff}` : "",
        bookingForm.amount ? `💰 Amount: ₹${bookingForm.amount}` : "",
        "",
        `See you soon at ${selected?._displayName ? "" : "our salon"}! 😊`
      ].filter(Boolean).join("\n")

      // ── Send WhatsApp confirmation ──
      let whatsappSent = false
      if (waConn && phoneForWA.length >= 10) {
        try {
          const waRes = await fetch(`https://graph.facebook.com/v18.0/${waConn.phone_number_id}/messages`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${waConn.access_token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to:   phoneForWA,
              type: "text",
              text: { body: confirmMsg, preview_url: false }
            })
          })
          const waData = await waRes.json()
          if (waData.error) {
            console.error("WA send error:", waData.error.message)
          } else {
            whatsappSent = true
            // Save the confirmation message to the chat
            const { data: savedMsg } = await supabase.from("messages").insert({
              conversation_id: selected.id,
              customer_phone:  customerPhone,
              direction:       "outbound",
              message_type:    "text",
              message_text:    confirmMsg,
              content:         confirmMsg,
              status:          "sent",
              is_ai:           false,
              user_id:         userId,
              wa_message_id:   waData?.messages?.[0]?.id || null,
              created_at:      new Date().toISOString()
            }).select().single()
            if (savedMsg) setMessages(prev => [...prev, savedMsg])
            // Update conversation last message
            await supabase.from("conversations")
              .update({ last_message: confirmMsg, last_message_at: new Date().toISOString() })
              .eq("id", selected.id)
          }
        } catch(waErr) {
          console.error("WA send failed:", waErr.message)
        }
      }

      setShowBooking(false)
      setBookingForm({ service:"", date:"", time:"", amount:"", staff:"", notes:"" })
      setSavingBooking(false)

      const msg = whatsappSent
        ? `✅ Booking saved! Confirmation sent to ${customerName} on WhatsApp.`
        : `✅ Booking saved! (WhatsApp confirmation not sent — check connection)`
      alert(msg)

    } catch(e) {
      console.error("saveBooking unexpected error:", e)
      alert("Something went wrong: " + e.message)
      setSavingBooking(false)
    }
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
  const userInitial = userEmail?userEmail[0].toUpperCase():"G"

  const getInitial = n => (n||"?")[0].toUpperCase()
  const getColor = n => { const c=["#00d084","#38bdf8","#a78bfa","#f59e0b","#fb7185"]; return c[(n||"").charCodeAt(0)%c.length] }
  const formatTime = ts => { if (!ts) return ""; const d=Date.now()-new Date(ts); if (d<3600000) return `${Math.floor(d/60000)}m ago`; if (d<86400000) return `${Math.floor(d/3600000)}h ago`; return new Date(ts).toLocaleDateString() }
  const getMsgText = m => {
    const t = (m.content || m.message_text || "").trim()
    if (t && t !== "[media message]") return t
    if (t === "[media message]") return "📎 Media"
    if (m.message_type && m.message_type !== "text") return `📎 ${m.message_type}`
    return ""
  }
  const getMsgTime = m => m.created_at ? new Date(m.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : ""

  const filtered = convos.filter(c => {
    const name = c.customers?.name || c.phone || ""
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || (c.last_message||"").toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter==="all" || (filter==="ai"&&c.ai_enabled) || (filter==="human"&&!c.ai_enabled) || filter===c.status
    return matchSearch && matchFilter
  })

  const inp = { background:inputBg, border:`1px solid ${cardBorder}`, borderRadius:8, padding:"9px 12px", fontSize:13, color:text, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none", width:"100%" }

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
        .inbox-wrap{flex:1;display:flex;overflow:hidden;}
        .clist{width:300px;flex-shrink:0;border-right:1px solid ${border};display:flex;flex-direction:column;background:${sidebar};}
        .clist-top{padding:12px;border-bottom:1px solid ${border};}
        .search-box{display:flex;align-items:center;gap:7px;background:${inputBg};border:1px solid ${cardBorder};border-radius:8px;padding:7px 10px;margin-bottom:9px;}
        .search-box input{flex:1;background:transparent;border:none;outline:none;font-size:12.5px;color:${text};font-family:'Plus Jakarta Sans',sans-serif;}
        .search-box input::placeholder{color:${textFaint};}
        .filters{display:flex;gap:4px;flex-wrap:wrap;}
        .filter-btn{padding:3px 9px;border-radius:100px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid ${cardBorder};background:transparent;color:${textMuted};font-family:'Plus Jakarta Sans',sans-serif;}
        .filter-btn.active{background:${accentDim};border-color:${accent}44;color:${accent};}
        .clist-items{flex:1;overflow-y:auto;}
        .c-item{padding:11px 14px;border-bottom:1px solid ${border};cursor:pointer;transition:background 0.1s;}
        .c-item:hover{background:${inputBg};}
        .c-item.sel{background:${accentDim};border-left:2px solid ${accent};}
        .chat-area{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .chat-head{padding:12px 16px;border-bottom:1px solid ${border};display:flex;align-items:center;justify-content:space-between;background:${card};flex-shrink:0;}
        .chat-msgs{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:8px;background:${bg};}
        .msg-row{display:flex;}
        .msg-row.inbound{justify-content:flex-start;}
        .msg-row.outbound{justify-content:flex-end;}
        .msg-bubble{max-width:68%;padding:9px 13px;border-radius:12px;font-size:13px;line-height:1.5;word-wrap:break-word;white-space:pre-wrap;}
        .msg-bubble.inbound{background:${card};border:1px solid ${cardBorder};color:${text};border-radius:4px 12px 12px 12px;}
        .msg-bubble.outbound-ai{background:${accent}22;border:1px solid ${accent}44;color:${text};border-radius:12px 4px 12px 12px;}
        .msg-bubble.outbound-human{background:rgba(167,139,250,0.15);border:1px solid rgba(167,139,250,0.3);color:${text};border-radius:12px 4px 12px 12px;}
        .msg-time{font-size:10px;color:${textFaint};margin-top:3px;}
        .msg-from{font-size:10px;font-weight:700;margin-bottom:2px;letter-spacing:0.3px;}
        .chat-input{padding:10px 14px;border-top:1px solid ${border};background:${card};display:flex;gap:8px;align-items:center;flex-shrink:0;}
        .msg-field{flex:1;background:${inputBg};border:1px solid ${cardBorder};border-radius:9px;padding:9px 13px;font-size:13px;color:${text};font-family:'Plus Jakarta Sans',sans-serif;outline:none;resize:none;}
        .msg-field::placeholder{color:${textFaint};}
        .send-btn{background:${accent};color:#000;border:none;border-radius:9px;padding:9px 16px;font-weight:700;font-size:13px;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;flex-shrink:0;}
        .send-btn:disabled{opacity:0.4;cursor:not-allowed;}
        .ai-note{font-size:11px;color:${textFaint};text-align:center;flex:1;padding:8px;}
        .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:8px;color:${textFaint};}
        select{color-scheme:dark;}
        select option{background-color:#0c0c15!important;color:#eeeef5!important;}
      `}</style>

      <div className="wrap">
        <aside className="sidebar">
          <a href="/dashboard" className="logo">fast<span>rill</span></a>
          <div className="nav-section">Platform</div>
          {NAV.map(item=>(
            <button key={item.id} className={`nav-item${item.id==="inbox"?" active":""}`} onClick={()=>router.push(item.path)}>
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
            <span className="tb-title">Conversations</span>
            <div className="topbar-r">
              <button className="theme-toggle" onClick={toggleTheme}>
                <span>{dark?"🌙":"☀️"}</span><div className="toggle-pill"/><span>{dark?"Dark":"Light"}</span>
              </button>
            </div>
          </div>

          <div className="inbox-wrap">
            {/* Conversation List */}
            <div className="clist">
              <div className="clist-top">
                <div className="search-box">
                  <span style={{color:textFaint,fontSize:13}}>🔍</span>
                  <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/>
                </div>
                <div className="filters">
                  {["all","ai","human","open","resolved"].map(f=>(
                    <button key={f} className={`filter-btn${filter===f?" active":""}`} onClick={()=>setFilter(f)}>
                      {f.charAt(0).toUpperCase()+f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="clist-items">
                {loading ? <div className="empty-state" style={{height:200}}><span style={{fontSize:12}}>Loading...</span></div>
                : filtered.length===0 ? <div className="empty-state" style={{height:200}}><span style={{fontSize:26}}>💬</span><span style={{fontSize:12}}>No conversations yet</span></div>
                : filtered.map(c => {
                  const name = c._displayName || c.customers?.name || c.phone
                  const color = getColor(c._displayName || name)
                  return (
                    <div key={c.id} className={`c-item${selected?.id===c.id?" sel":""}`} onClick={()=>{ setSelected(c); setMessages([]) }}>
                      <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:4}}>
                        <div style={{width:34,height:34,borderRadius:9,background:`linear-gradient(135deg,${color}88,${color}44)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:"#fff",flexShrink:0}}>{getInitial(name)}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:600,fontSize:13,color:text,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</span>
                            <span style={{fontSize:10.5,color:textFaint,flexShrink:0,marginLeft:4}}>{formatTime(c.last_message_at)}</span>
                          </div>
                          <div style={{fontSize:12,color:textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.last_message||"No messages"}</div>
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:5}}>
                        <span style={{fontSize:10,fontWeight:700,color:c.ai_enabled?accent:"#a78bfa",background:(c.ai_enabled?accent:"#a78bfa")+"15",padding:"2px 7px",borderRadius:100,border:`1px solid ${(c.ai_enabled?accent:"#a78bfa")}33`}}>
                          {c.ai_enabled?"◈ AI Active":"👤 Human"}
                        </span>
                        {c.unread_count>0 && <span style={{background:accent,color:"#000",fontSize:9,fontWeight:700,width:16,height:16,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{c.unread_count}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Chat Panel */}
            {selected ? (
              <div className="chat-area">
                {/* Chat Header */}
                <div className="chat-head">
                  <div style={{display:"flex",alignItems:"center",gap:11}}>
                    <div style={{width:36,height:36,borderRadius:9,background:`linear-gradient(135deg,${getColor(selected._displayName||selected.customers?.name||selected.phone)}88,${getColor(selected._displayName||selected.customers?.name||selected.phone)}44)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:"#fff"}}>
                      {getInitial(selected._displayName||selected.customers?.name||selected.phone)}
                    </div>
                    <div>
                      <div style={{fontWeight:700,fontSize:14,color:text}}>{selected._displayName||selected.customers?.name||selected.phone}</div>
                      <div style={{fontSize:11,color:textMuted}}>{selected.phone}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    {/* Book button */}
                    <button onClick={()=>setShowBooking(true)}
                      style={{display:"flex",alignItems:"center",gap:5,background:accentDim,border:`1px solid ${accent}44`,borderRadius:8,padding:"6px 12px",fontWeight:700,fontSize:12,color:accent,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                      📅 Book
                    </button>
                    {/* AI Toggle */}
                    <div style={{display:"flex",alignItems:"center",gap:7,fontSize:12,fontWeight:600,color:textMuted}}>
                      <span>AI</span>
                      <button
                        style={{width:36,height:20,borderRadius:100,position:"relative",cursor:"pointer",border:"none",background:selected.ai_enabled?accent:"rgba(255,255,255,0.12)",transition:"background 0.2s",flexShrink:0}}
                        onClick={()=>toggleAI(selected.id, selected.ai_enabled)}>
                        <span style={{position:"absolute",top:"2px",width:"16px",height:"16px",borderRadius:"50%",background:"#fff",transition:"left 0.2s",left:selected.ai_enabled?"18px":"2px",display:"block"}}/>
                      </button>
                      <span style={{color:selected.ai_enabled?accent:textFaint,minWidth:24}}>{selected.ai_enabled?"ON":"OFF"}</span>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="chat-msgs">
                  {messages.length===0 ? (
                    <div className="empty-state"><span style={{fontSize:22}}>💬</span><span style={{fontSize:12}}>No messages yet</span></div>
                  ) : messages.map((m,i) => {
                    const dir = m.direction || "inbound"
                    const isAI = m.is_ai
                    const bubbleClass = dir==="inbound" ? "inbound" : isAI ? "outbound-ai" : "outbound-human"
                    const fromLabel = dir==="inbound" ? (selected._displayName||selected.customers?.name||selected.phone) : isAI ? "◈ AI" : "👤 You"
                    const fromColor = dir==="inbound" ? textFaint : isAI ? accent : "#a78bfa"
                    const msgText = getMsgText(m)
                    if (!msgText && !m.message_type) return null
                    const displayText = msgText || `📎 ${m.message_type || 'Media'}`
                    return (
                      <div key={m.id||i} className={`msg-row ${dir}`}>
                        <div style={{maxWidth:"68%"}}>
                          <div className="msg-from" style={{color:fromColor,textAlign:dir==="inbound"?"left":"right"}}>{fromLabel}</div>
                          <div className={`msg-bubble ${bubbleClass}`}>{displayText}</div>
                          <div className="msg-time" style={{textAlign:dir==="inbound"?"left":"right"}}>{getMsgTime(m)}</div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={msgsEndRef}/>
                </div>

                {/* Input */}
                <div className="chat-input">
                  {selected.ai_enabled ? (
                    <div className="ai-note">◈ AI is handling this conversation — toggle AI OFF to send manually</div>
                  ) : (
                    <>
                      <textarea className="msg-field" placeholder="Type a message..." value={msgInput} rows={1}
                        onChange={e=>setMsgInput(e.target.value)}
                        onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg()} }}/>
                      <button className="send-btn" onClick={sendMsg} disabled={sending||!msgInput.trim()}>
                        {sending?"...":"Send"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="chat-area">
                <div className="empty-state"><span style={{fontSize:32}}>💬</span><span style={{fontSize:14,fontWeight:600}}>Select a conversation</span></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BOOKING MODAL ── */}
      {showBooking && selected && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}>
          <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:16,padding:28,width:"100%",maxWidth:440,display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontWeight:800,fontSize:16,color:text}}>📅 Book Appointment</div>
              <button onClick={()=>setShowBooking(false)} style={{background:"transparent",border:"none",color:textFaint,cursor:"pointer",fontSize:20,lineHeight:1}}>×</button>
            </div>
            <div style={{padding:"10px 12px",background:accentDim,border:`1px solid ${accent}33`,borderRadius:9,fontSize:13,color:text}}>
              For: <strong>{selected.customers?.name||selected.phone}</strong>
            </div>
            <div>
              <div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>Service *</div>
              <select value={bookingForm.service} onChange={e=>{ const svc=services.find(s=>s.name===e.target.value); setBookingForm(p=>({...p,service:e.target.value,amount:svc?.price?.toString()||p.amount})) }} style={inp}>
                <option value="">Select service</option>
                {services.map(s=><option key={s.name} value={s.name}>{s.name} — ₹{s.price}</option>)}
                <option value="Other">Other</option>
              </select>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>Date *</div>
                <input type="date" value={bookingForm.date} onChange={e=>setBookingForm(p=>({...p,date:e.target.value}))} style={inp} min={new Date().toISOString().split("T")[0]}/>
              </div>
              <div>
                <div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>Time</div>
                <select value={bookingForm.time} onChange={e=>setBookingForm(p=>({...p,time:e.target.value}))} style={inp}>
                  <option value="">Any time</option>
                  {TIMES.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>Amount (₹)</div>
                <input type="number" placeholder="0" value={bookingForm.amount} onChange={e=>setBookingForm(p=>({...p,amount:e.target.value}))} style={inp}/>
              </div>
              <div>
                <div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>Staff</div>
                <input placeholder="Staff name" value={bookingForm.staff} onChange={e=>setBookingForm(p=>({...p,staff:e.target.value}))} style={inp}/>
              </div>
            </div>
            <div>
              <div style={{fontSize:11.5,color:textMuted,marginBottom:5}}>Notes</div>
              <input placeholder="Any special requests..." value={bookingForm.notes} onChange={e=>setBookingForm(p=>({...p,notes:e.target.value}))} style={inp}/>
            </div>
            <div style={{fontSize:11.5,color:textFaint,background:accentDim,border:`1px solid ${accent}22`,borderRadius:8,padding:"9px 11px"}}>
              ✅ A confirmation message will be sent to the customer on WhatsApp automatically
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setShowBooking(false)} style={{flex:1,padding:"10px",background:inputBg,border:`1px solid ${cardBorder}`,borderRadius:8,color:textMuted,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Cancel</button>
              <button onClick={saveBooking} disabled={savingBooking||!bookingForm.service||!bookingForm.date}
                style={{flex:2,padding:"10px",background:(!bookingForm.service||!bookingForm.date)?inputBg:accent,border:"none",borderRadius:8,color:(!bookingForm.service||!bookingForm.date)?textFaint:"#000",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                {savingBooking?"Saving...":"✅ Confirm Booking & Notify"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
