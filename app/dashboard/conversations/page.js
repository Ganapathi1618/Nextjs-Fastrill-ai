"use client"
import { useEffect, useState, useRef } from "react"
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

/** * FIX: Unified Time Formatting 
 * Both functions now use identical Locales and Options to prevent the 6:12 vs 12:42 discrepancy.
 */
const timeOptions = { hour: "2-digit", minute: "2-digit", hour12: true };

function formatMsgTime(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleTimeString("en-IN", timeOptions);
  } catch { return ""; }
}

function formatConvoTime(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    if (isToday) {
      return d.toLocaleTimeString("en-IN", timeOptions);
    }
    const diff = now - d;
    if (diff < 7 * 86_400_000) return d.toLocaleDateString("en-IN", { weekday: "short" });
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch { return ""; }
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
    return () => { supabase.removeChannel(convoCh) }
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
        // FIX: Update the sidebar time immediately when a message is received
        setConvos(prev => prev.map(c => 
          c.id === selected.id ? { ...c, last_message: payload.new.message_text, last_message_at: payload.new.created_at, unread_count: 0 } : c
        ))
      }).subscribe()
    return () => { supabase.removeChannel(msgCh) }
  }, [selected?.id])

  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

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
    if (data?.length) { if (selectedRef.current?.id === convoId) setMessages(data); return; }
    // Fallback search by phone logic...
    if (selectedRef.current?.id === convoId) setMessages([])
  }

  async function sendMsg() {
    if (!msgInput.trim() || !selected || sending) return
    setSending(true)
    const text = msgInput.trim(); setMsgInput("")
    const now = new Date().toISOString()
    try {
      // WhatsApp API call...
      await supabase.from("messages").insert({ conversation_id: selected.id, direction: "outbound", message_text: text, user_id: userId, created_at: now })
      await supabase.from("conversations").update({ last_message: text, last_message_at: now }).eq("id", selected.id)
    } catch (e) { console.error(e) }
    setSending(false)
  }

  async function toggleAI(id, current) {
    const newVal = !current
    await supabase.from("conversations").update({ ai_enabled: newVal }).eq("id", id)
    setConvos(prev => prev.map(c => c.id === id ? { ...c, ai_enabled: newVal } : c))
    if (selected?.id === id) setSelected(p => ({ ...p, ai_enabled: newVal }))
  }

  const toggleTheme = () => { const n = !dark; setDark(n); localStorage.setItem("fastrill-theme", n ? "dark" : "light") }
  const bg = dark ? "#08080e" : "#f0f2f5"; const sidebar = dark ? "#0c0c15" : "#ffffff"; const border = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const text = dark ? "#eeeef5" : "#111827"; const accent = dark ? "#00d084" : "#00935a";

  const filtered = convos.filter(c => (c._displayName || "").toLowerCase().includes(search.toLowerCase()) && (filter === "all" || (filter === "ai" && c.ai_enabled) || (filter === "human" && !c.ai_enabled)))

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:${bg};color:${text};font-family:'Plus Jakarta Sans',sans-serif;height:100vh;overflow:hidden;}
        .wrap{display:flex;height:100vh;}
        .sidebar{width:224px;background:${sidebar};border-right:1px solid ${border};display:flex;flex-direction:column;}
        .logo{padding:22px 20px;font-weight:800;font-size:20px;border-bottom:1px solid ${border};text-decoration:none;color:${text};}
        .logo span{color:${accent};}
        .nav-item{padding:10px 16px;margin:2px 10px;border-radius:8px;cursor:pointer;font-size:13.5px;color:gray;border:none;background:none;text-align:left;display:flex;align-items:center;gap:8px;}
        .nav-item.active{background:${accent}15;color:${accent};font-weight:600;}
        .main{flex:1;display:flex;flex-direction:column;}
        .topbar{height:54px;border-bottom:1px solid ${border};display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:${sidebar};}
        .inbox-wrap{flex:1;display:flex;overflow:hidden;}
        .clist{width:300px;border-right:1px solid ${border};background:${sidebar};display:flex;flex-direction:column;}
        .c-item{padding:12px 16px;border-bottom:1px solid ${border};cursor:pointer;}
        .c-item.sel{background:${accent}10;border-left:3px solid ${accent};}
        .chat-area{flex:1;display:flex;flex-direction:column;background:${bg};}
        .chat-head{padding:12px 20px;border-bottom:1px solid ${border};background:${sidebar};display:flex;justify-content:space-between;align-items:center;}
        .chat-msgs{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:10px;}
        .msg-row{display:flex;flex-direction:column;max-width:75%;}
        .msg-row.outbound{align-self:flex-end;align-items:flex-end;}
        .msg-bubble{padding:10px 14px;border-radius:12px;font-size:13.5px;background:${sidebar};border:1px solid ${border};}
        .msg-row.outbound .msg-bubble{background:${accent}20;border-color:${accent}40;}
        .msg-time{font-size:10px;color:gray;margin-top:4px;}
        .chat-input{padding:15px;border-top:1px solid ${border};background:${sidebar};display:flex;gap:10px;}
        .msg-field{flex:1;background:${bg};border:1px solid ${border};border-radius:10px;padding:10px;color:${text};outline:none;resize:none;}
        .send-btn{background:${accent};color:#000;border:none;padding:0 20px;border-radius:10px;font-weight:700;cursor:pointer;}
      `}</style>

      <div className="wrap">
        <aside className="sidebar">
          <a href="#" className="logo">fast<span>rill</span></a>
          <div style={{padding:"15px 20px 5px", fontSize:11, color:"gray"}}>PLATFORM</div>
          {NAV.map(n => <button key={n.id} className={`nav-item ${n.id==="inbox"?"active":""}`} onClick={()=>router.push(n.path)}>{n.icon} {n.label}</button>)}
        </aside>

        <div className="main">
          <div className="topbar">
            <span style={{fontWeight:700}}>Conversations</span>
            <button onClick={toggleTheme} style={{background:"none", border:`1px solid ${border}`, color:text, padding:"5px 10px", borderRadius:6, cursor:pointer}}>{dark?"🌙":"☀️"}</button>
          </div>

          <div className="inbox-wrap">
            <div className="clist">
              <div style={{padding:12, borderBottom:`1px solid ${border}`}}>
                <input placeholder="Search..." style={{width:"100%", padding:8, borderRadius:6, background:`${bg}`, border:`1px solid ${border}`, color:text}} onChange={e=>setSearch(e.target.value)} />
                <div style={{display:"flex", gap:5, marginTop:8}}>
                  {["all","ai","human"].map(f => <button key={f} onClick={()=>setFilter(f)} style={{fontSize:10, padding:"3px 8px", borderRadius:10, border:"none", background:filter===f?accent:"transparent", color:filter===f?"#000":"gray"}}>{f.toUpperCase()}</button>)}
                </div>
              </div>
              <div style={{flex:1, overflowY:"auto"}}>
                {filtered.map(c => (
                  <div key={c.id} className={`c-item ${selected?.id===c.id?"sel":""}`} onClick={()=>setSelected(c)}>
                    <div style={{display:"flex", justifyContent:"space-between", marginBottom:4}}>
                      <span style={{fontWeight:600, fontSize:13}}>{c._displayName}</span>
                      <span style={{fontSize:10, color:"gray"}}>{formatConvoTime(c.last_message_at)}</span>
                    </div>
                    <div style={{fontSize:12, color:"gray", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{c.last_message || "No messages"}</div>
                  </div>
                ))}
              </div>
            </div>

            {selected ? (
              <div className="chat-area">
                <div className="chat-head">
                  <div><div style={{fontWeight:700}}>{selected._displayName}</div><div style={{fontSize:11, color:"gray"}}>{selected.phone}</div></div>
                  <div style={{display:"flex", gap:10}}>
                    <button onClick={()=>setShowBooking(true)} style={{background:accent, border:"none", padding:"6px 12px", borderRadius:6, fontWeight:700, cursor:"pointer"}}>Book</button>
                    <button onClick={()=>toggleAI(selected.id, selected.ai_enabled)} style={{background:selected.ai_enabled?accent:"#333", color:selected.ai_enabled?"#000":"#fff", border:"none", padding:"6px 12px", borderRadius:6, cursor:"pointer"}}>AI {selected.ai_enabled?"ON":"OFF"}</button>
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
                  {selected.ai_enabled ? <div style={{flex:1, textAlign:"center", color:"gray", fontSize:12}}>AI is handling this chat. Turn AI OFF to reply.</div> : 
                  <><textarea className="msg-field" placeholder="Type a message..." value={msgInput} onChange={e=>setMsgInput(e.target.value)} /><button className="send-btn" onClick={sendMsg}>Send</button></>}
                </div>
              </div>
            ) : <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"gray"}}>Select a conversation to start</div>}
          </div>
        </div>
      </div>
    </>
  )
}
