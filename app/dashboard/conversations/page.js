"use client"
import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

// --- THE CRITICAL TIME FIX ---
// This constant ensures the format is IDENTICAL in the sidebar and the chat bubbles.
const TIME_CONFIG = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true
};

function formatMsgTime(ts) {
  if (!ts) return "";
  try {
    // Converts Database UTC to User's Local Time (IST based on your screenshot)
    return new Date(ts).toLocaleTimeString("en-IN", TIME_CONFIG);
  } catch { return ""; }
}

function formatConvoTime(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    const now = new Date();
    // If the message was sent today, it MUST show the exact same clock time as the chat
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString("en-IN", TIME_CONFIG);
    }
    // If older than today, show day/date
    const diff = now - d;
    if (diff < 7 * 86400000) return d.toLocaleDateString("en-IN", { weekday: "short" });
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch { return ""; }
}

const NAV = [
  { id: "overview", label: "Revenue Engine", icon: "⬡", path: "/dashboard" },
  { id: "inbox", label: "Conversations", icon: "◎", path: "/dashboard/conversations" },
  { id: "bookings", label: "Bookings", icon: "◷", path: "/dashboard/bookings" },
  { id: "campaigns", label: "Campaigns", icon: "◆", path: "/dashboard/campaigns" },
  { id: "leads", label: "Lead Recovery", icon: "◉", path: "/dashboard/leads" },
  { id: "contacts", label: "Customers", icon: "◑", path: "/dashboard/contacts" },
  { id: "analytics", label: "Analytics", icon: "▦", path: "/dashboard/analytics" },
  { id: "settings", label: "Settings", icon: "◌", path: "/dashboard/settings" },
]

const TIMES = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"]

export default function Conversations() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [userId, setUserId] = useState(null)
  const [dark, setDark] = useState(true)
  const [mobSidebarOpen, setMobSidebarOpen] = useState(false)
  const [mobChatOpen, setMobChatOpen] = useState(false)
  const [convos, setConvos] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [msgInput, setMsgInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [waConn, setWaConn] = useState(null)

  // Booking Modal
  const [showBooking, setShowBooking] = useState(false)
  const [services, setServices] = useState([])
  const [bookingForm, setBookingForm] = useState({ service: "", date: "", time: "", amount: "", staff: "", notes: "" })
  const [savingBooking, setSavingBooking] = useState(false)

  const msgsEndRef = useRef(null)
  const selectedRef = useRef(null)

  useEffect(() => { selectedRef.current = selected }, [selected])

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login")
      else { setUserEmail(data.user.email || ""); setUserId(data.user.id) }
    })
  }, [router])

  // Realtime Logic
  useEffect(() => {
    if (!userId) return
    loadConvos(); loadWaConn(); loadServices();
    
    const convoCh = supabase.channel("convos-" + userId)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations", filter: `user_id=eq.${userId}` }, 
      (payload) => {
        if (payload.eventType === "UPDATE") {
          setConvos(prev => {
            const updated = prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c)
            return [...updated].sort((a,b) => new Date(b.last_message_at||0) - new Date(a.last_message_at||0))
          })
        } else { loadConvos() }
      }).subscribe()
    return () => supabase.removeChannel(convoCh)
  }, [userId])

  useEffect(() => {
    if (!selected?.id) return
    loadMessages(selected.id, selected.phone)
    supabase.from("conversations").update({ unread_count: 0 }).eq("id", selected.id)

    const msgCh = supabase.channel("msgs-" + selected.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selected.id}` }, 
      (payload) => {
        if (selectedRef.current?.id !== selected.id) return
        setMessages(prev => (prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new]))
        
        // SYNC FIX: When a "fresh msg" arrives, update the sidebar timestamp to the exact message time
        setConvos(prev => prev.map(c => 
          c.id === selected.id ? { ...c, last_message: payload.new.message_text, last_message_at: payload.new.created_at, unread_count: 0 } : c
        ))
      }).subscribe()
    return () => supabase.removeChannel(msgCh)
  }, [selected?.id])

  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  // Data Fetching
  async function loadWaConn() { const { data } = await supabase.from("whatsapp_connections").select("*").eq("user_id", userId).maybeSingle(); setWaConn(data) }
  async function loadServices() { const { data } = await supabase.from("services").select("name, price").eq("user_id", userId); setServices(data || []) }
  async function loadConvos() {
    setLoading(true)
    const { data } = await supabase.from("conversations").select("*, customers(name, phone)").eq("user_id", userId).order("last_message_at", { ascending: false })
    const enriched = (data || []).map(c => ({ ...c, _displayName: c.customers?.name || c.phone || "Unknown" }))
    setConvos(enriched)
    if (enriched.length && !selectedRef.current) setSelected(enriched[0])
    setLoading(false)
  }
  async function loadMessages(convoId, phone) {
    const { data } = await supabase.from("messages").select("*").eq("conversation_id", convoId).order("created_at", { ascending: true })
    if (selectedRef.current?.id === convoId) setMessages(data || [])
  }

  // Messaging Logic
  async function sendMsg() {
    if (!msgInput.trim() || !selected || sending) return
    if (!waConn) return alert("WhatsApp not connected")
    setSending(true)
    const text = msgInput.trim(); setMsgInput("")
    const phone = (selected.phone || "").replace("+","").replace(/\s/g,"")
    try {
      const res = await fetch(`https://graph.facebook.com/v18.0/${waConn.phone_number_id}/messages`, {
        method: "POST", headers: { "Authorization": `Bearer ${waConn.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", to: phone, type: "text", text: { body: text } })
      })
      const waData = await res.json()
      if (waData.error) throw new Error(waData.error.message)
      const now = new Date().toISOString()
      const { data: saved } = await supabase.from("messages").insert({ conversation_id: selected.id, direction: "outbound", message_text: text, user_id: userId, created_at: now }).select().single()
      if (saved) setMessages(prev => [...prev, saved])
      await supabase.from("conversations").update({ last_message: text, last_message_at: now }).eq("id", selected.id)
    } catch (e) { alert(e.message) }
    setSending(false)
  }

  async function toggleAI(id, current) {
    const newVal = !current; await supabase.from("conversations").update({ ai_enabled: newVal }).eq("id", id)
    setConvos(prev => prev.map(c => c.id === id ? { ...c, ai_enabled: newVal } : c))
    if (selected?.id === id) setSelected(p => ({ ...p, ai_enabled: newVal }))
  }

  // Booking logic
  async function saveBooking() {
    if (!bookingForm.service || !bookingForm.date) return alert("Missing fields")
    setSavingBooking(true)
    try {
      await supabase.from("bookings").insert({
        user_id: userId, customer_name: selected._displayName, customer_phone: selected.phone,
        service: bookingForm.service, booking_date: bookingForm.date, booking_time: bookingForm.time,
        amount: parseInt(bookingForm.amount) || 0, status: "confirmed", created_at: new Date().toISOString()
      })
      setShowBooking(false); setBookingForm({ service: "", date: "", time: "", amount: "", staff: "", notes: "" })
    } catch (e) { console.error(e) }
    setSavingBooking(false)
  }

  const toggleTheme = () => { const n = !dark; setDark(n); localStorage.setItem("fastrill-theme", n ? "dark" : "light") }
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login") }

  // Styles
  const bg = dark ? "#08080e" : "#f0f2f5"; const sidebar = dark ? "#0c0c15" : "#ffffff"; const border = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const card = dark ? "#0f0f1a" : "#ffffff"; const cardBorder = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)";
  const text = dark ? "#eeeef5" : "#111827"; const accent = dark ? "#00d084" : "#00935a";
  const textMuted = dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)";
  const textFaint = dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)";
  const inputBg = dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const accentDim = dark ? "rgba(0,208,132,0.12)" : "rgba(0,147,90,0.1)";

  const filtered = convos.filter(c => (c._displayName || "").toLowerCase().includes(search.toLowerCase()) && (filter === "all" || (filter === "ai" && c.ai_enabled) || (filter === "human" && !c.ai_enabled)))

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${bg}!important;color:${text}!important;font-family:'Plus Jakarta Sans',sans-serif!important;height:100vh;overflow:hidden;}
        .wrap{display:flex;height:100vh;}
        .sidebar{width:224px;background:${sidebar};border-right:1px solid ${border};display:flex;flex-direction:column;z-index:10;}
        .logo{padding:22px 20px;font-weight:800;font-size:20px;color:${text};text-decoration:none;border-bottom:1px solid ${border};}
        .logo span{color:${accent};}
        .nav-item{display:flex;align-items:center;gap:10px;padding:10px 14px;margin:2px 10px;border-radius:8px;cursor:pointer;font-size:13.5px;color:${textMuted};border:none;background:none;width:calc(100% - 20px);text-align:left;}
        .nav-item.active{background:${accentDim};color:${accent};font-weight:600;}
        .topbar{height:54px;border-bottom:1px solid ${border};display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:${sidebar};}
        .clist{width:300px;border-right:1px solid ${border};display:flex;flex-direction:column;background:${sidebar};}
        .search-box{background:${inputBg};border:1px solid ${cardBorder};border-radius:10px;padding:8px 12px;display:flex;gap:8px;margin-bottom:12px;}
        .search-box input{background:transparent;border:none;outline:none;color:${text};font-size:13px;flex:1;}
        .c-item{padding:14px 18px;border-bottom:1px solid ${border};cursor:pointer;}
        .c-item.sel{background:${accentDim};border-left:3px solid ${accent};}
        .chat-area{flex:1;display:flex;flex-direction:column;background:${bg};}
        .chat-head{padding:12px 20px;border-bottom:1px solid ${border};background:${card};display:flex;justify-content:space-between;align-items:center;}
        .chat-msgs{flex:1;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:12px;}
        .msg-row{display:flex;flex-direction:column;max-width:70%;}
        .msg-row.outbound{align-self:flex-end;align-items:flex-end;}
        .msg-bubble{padding:11px 15px;border-radius:14px;font-size:13.5px;line-height:1.5;background:${card};border:1px solid ${cardBorder};}
        .msg-row.outbound .msg-bubble{background:${accent}22;border-color:${accent}44;}
        .msg-time{font-size:10px;color:rgba(255,255,255,0.25);margin-top:5px;}
        .chat-input{padding:18px;border-top:1px solid ${border};background:${card};display:flex;gap:12px;}
        .msg-field{flex:1;background:${inputBg};border:1px solid ${cardBorder};border-radius:12px;padding:11px 15px;color:${text};outline:none;resize:none;}
        .send-btn{background:${accent};color:#000;border:none;padding:0 22px;border-radius:11px;font-weight:700;cursor:pointer;}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:1000;}
        .modal-card{background:${card};padding:30px;border-radius:20px;width:100%;max-width:420px;border:1px solid ${cardBorder};}
      `}</style>

      <div className="wrap">
        <aside className="sidebar">
          <a href="#" className="logo">fast<span>rill</span></a>
          <div style={{padding:"20px 20px 8px", fontSize:10, color:textFaint, fontWeight:700}}>PLATFORM</div>
          {NAV.map(n => <button key={n.id} className={`nav-item ${n.id==="inbox"?"active":""}`} onClick={()=>router.push(n.path)}>{n.icon} {n.label}</button>)}
          <div style={{marginTop:"auto", padding:15, borderTop:`1px solid ${border}`}}>
            <button className="nav-item" onClick={handleLogout} style={{color:"#fca5a5"}}>↩ Sign out</button>
          </div>
        </aside>

        <div className="main">
          <div className="topbar">
            <span style={{fontWeight:800, fontSize:16}}>Conversations</span>
            <button onClick={toggleTheme} style={{background:inputBg, border:`1px solid ${cardBorder}`, padding:"6px 14px", borderRadius:8, color:text, cursor:"pointer", fontSize:12}}>{dark?"🌙 Dark":"☀️ Light"}</button>
          </div>

          <div className="inbox-wrap">
            <div className="clist">
              <div style={{padding:15, borderBottom:`1px solid ${border}`}}>
                <div className="search-box">🔍 <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
                <div style={{display:"flex", gap:6}}>
                  {["all","ai","human"].map(f => <button key={f} onClick={()=>setFilter(f)} style={{fontSize:10, padding:"5px 12px", borderRadius:20, border:"none", background:filter===f?accent:inputBg, color:filter===f?"#000":textMuted, cursor:"pointer"}}>{f.toUpperCase()}</button>)}
                </div>
              </div>
              <div style={{flex:1, overflowY:"auto"}}>
                {filtered.map(c => (
                  <div key={c.id} className={`c-item ${selected?.id===c.id?"sel":""}`} onClick={()=>setSelected(c)}>
                    <div style={{display:"flex", justifyContent:"space-between", marginBottom:5}}>
                      <span style={{fontWeight:700, fontSize:13}}>{c._displayName}</span>
                      <span style={{fontSize:10, color:accent}}>{formatConvoTime(c.last_message_at)}</span>
                    </div>
                    <div style={{fontSize:12, color:textMuted, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{c.last_message || "No history"}</div>
                  </div>
                ))}
              </div>
            </div>

            {selected ? (
              <div className="chat-area">
                <div className="chat-head">
                  <div>
                    <div style={{fontWeight:800, fontSize:14}}>{selected._displayName}</div>
                    <div style={{fontSize:11, color:textMuted}}>{selected.phone}</div>
                  </div>
                  <div style={{display:"flex", gap:10}}>
                    <button onClick={()=>setShowBooking(true)} style={{background:accent, border:"none", padding:"8px 16px", borderRadius:10, fontWeight:800, fontSize:12, cursor:"pointer"}}>📅 Book</button>
                    <button onClick={()=>toggleAI(selected.id, selected.ai_enabled)} style={{background:selected.ai_enabled?accent:inputBg, color:selected.ai_enabled?"#000":text, border:"none", padding:"8px 16px", borderRadius:10, fontWeight:800, cursor:"pointer"}}>AI {selected.ai_enabled?"ON":"OFF"}</button>
                  </div>
                </div>
                <div className="chat-msgs">
                  {messages.map((m, i) => (
                    <div key={m.id || i} className={`msg-row ${m.direction}`}>
                      <div className="msg-bubble">{m.message_text}</div>
                      <div className="msg-time">{formatMsgTime(m.created_at)}</div>
                    </div>
                  ))}
                  <div ref={msgsEndRef} />
                </div>
                <div className="chat-input">
                  {selected.ai_enabled ? <div style={{flex:1, textAlign:"center", fontSize:12, color:textMuted, padding:10, background:"rgba(255,255,255,0.02)", borderRadius:10}}>◈ AI is handling this chat. Turn AI OFF to reply.</div> : 
                  <><textarea className="msg-field" placeholder="Type a message..." value={msgInput} onChange={e=>setMsgInput(e.target.value)} /><button className="send-btn" onClick={sendMsg}>Send</button></>}
                </div>
              </div>
            ) : <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", opacity:0.2}}>Select a customer</div>}
          </div>
        </div>
      </div>

      {showBooking && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2 style={{fontSize:18, fontWeight:800, marginBottom:20}}>New Booking</h2>
            <label style={{fontSize:12, color:textMuted}}>SERVICE</label>
            <select style={{width:"100%", padding:12, background:inputBg, border:`1px solid ${cardBorder}`, color:text, borderRadius:10, marginBottom:15}} value={bookingForm.service} onChange={e=>setBookingForm({...bookingForm, service:e.target.value})}>
              <option value="">Select service...</option>
              {services.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
            <label style={{fontSize:12, color:textMuted}}>DATE</label>
            <input type="date" style={{width:"100%", padding:12, background:inputBg, border:`1px solid ${cardBorder}`, color:text, borderRadius:10, marginBottom:15}} value={bookingForm.date} onChange={e=>setBookingForm({...bookingForm, date:e.target.value})} />
            <button onClick={saveBooking} style={{width:"100%", background:accent, color:"#000", border:"none", padding:14, borderRadius:12, fontWeight:800, cursor:"pointer"}}>Confirm Booking</button>
            <button onClick={()=>setShowBooking(false)} style={{width:"100%", background:"none", border:"none", color:textMuted, marginTop:10, cursor:"pointer"}}>Cancel</button>
          </div>
        </div>
      )}
    </>
  )
}
