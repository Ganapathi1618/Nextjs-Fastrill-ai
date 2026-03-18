"use client"
import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

// --- CONSTANTS ---
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

// --- TIME FIX HELPERS (Synced Formatting) ---
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
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString("en-IN", timeOptions);
    }
    const diff = now - d;
    if (diff < 7 * 86400000) return d.toLocaleDateString("en-IN", { weekday: "short" });
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch { return ""; }
}

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

  // Booking Modal State
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

  // --- Realtime Subscriptions ---
  useEffect(() => {
    if (!userId) return
    loadConvos(); loadWaConn(); loadServices();
    const convoCh = supabase.channel("convos-" + userId)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations", filter: `user_id=eq.${userId}` }, (p) => {
        if (p.eventType === "UPDATE") {
          setConvos(prev => {
            const up = prev.map(c => c.id === p.new.id ? { ...c, ...p.new } : c)
            return [...up].sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0))
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
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selected.id}` }, (p) => {
        if (selectedRef.current?.id !== selected.id) return
        setMessages(prev => (prev.find(m => m.id === p.new.id) ? prev : [...prev, p.new]))
        // Sync Sidebar Time immediately
        setConvos(prev => prev.map(c => c.id === selected.id ? { ...c, last_message: p.new.message_text, last_message_at: p.new.created_at, unread_count: 0 } : c))
      }).subscribe()
    return () => { supabase.removeChannel(msgCh) }
  }, [selected?.id])

  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  // --- Database Logic ---
  async function loadWaConn() { const { data } = await supabase.from("whatsapp_connections").select("*").eq("user_id", userId).maybeSingle(); setWaConn(data) }
  async function loadServices() { const { data } = await supabase.from("services").select("name, price").eq("user_id", userId); setServices(data || []) }

  async function loadConvos() {
    setLoading(true)
    const { data } = await supabase.from("conversations").select("*, customers(name, phone)").eq("user_id", userId).order("last_message_at", { ascending: false })
    const enriched = (data || []).map(c => ({ ...c, _displayName: c.customers?.name || c.phone || "Unknown" }))
    setConvos(enriched); if (enriched.length && !selectedRef.current) setSelected(enriched[0]); setLoading(false)
  }

  async function loadMessages(convoId, phone) {
    const { data } = await supabase.from("messages").select("*").eq("conversation_id", convoId).order("created_at", { ascending: true })
    if (selectedRef.current?.id === convoId) setMessages(data || [])
  }

  async function toggleAI(id, current) {
    const newVal = !current; await supabase.from("conversations").update({ ai_enabled: newVal }).eq("id", id)
    setConvos(prev => prev.map(c => c.id === id ? { ...c, ai_enabled: newVal } : c))
    if (selected?.id === id) setSelected(p => ({ ...p, ai_enabled: newVal }))
  }

  async function sendMsg() {
    if (!msgInput.trim() || !selected || sending) return
    if (!waConn) return alert("WhatsApp Connection Required")
    setSending(true); const text = msgInput.trim(); setMsgInput("")
    const phone = (selected.phone || "").replace("+", "").replace(/\s/g, "")
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

  async function saveBooking() {
    if (!bookingForm.service || !bookingForm.date) return alert("Required fields missing")
    setSavingBooking(true)
    try {
      const { data } = await supabase.from("bookings").insert({
        user_id: userId, customer_name: selected._displayName, customer_phone: selected.phone,
        service: bookingForm.service, booking_date: bookingForm.date, booking_time: bookingForm.time,
        amount: parseInt(bookingForm.amount) || 0, status: "confirmed", created_at: new Date().toISOString()
      })
      setShowBooking(false); setBookingForm({ service: "", date: "", time: "", amount: "", staff: "", notes: "" })
    } catch (e) { console.error(e) }
    setSavingBooking(false)
  }

  // --- Theme & Logout ---
  const toggleTheme = () => { const n = !dark; setDark(n); localStorage.setItem("fastrill-theme", n ? "dark" : "light") }
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login") }

  // --- Styles Injection ---
  const bg = dark ? "#08080e" : "#f0f2f5"; const sidebar = dark ? "#0c0c15" : "#ffffff"; const card = dark ? "#0f0f1a" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"; const text = dark ? "#eeeef5" : "#111827";
  const accent = dark ? "#00d084" : "#00935a"; const textMuted = dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)";
  const cardBorder = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)"; const inputBg = dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const accentDim = dark ? "rgba(0,208,132,0.12)" : "rgba(0,147,90,0.1)";

  const filtered = convos.filter(c => (c._displayName || "").toLowerCase().includes(search.toLowerCase()) && (filter === "all" || (filter === "ai" && c.ai_enabled) || (filter === "human" && !c.ai_enabled)))

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${bg}!important;color:${text}!important;font-family:'Plus Jakarta Sans',sans-serif!important;height:100vh;overflow:hidden;}
        .wrap{display:flex;height:100vh;background:${bg};}
        .sidebar{width:224px;background:${sidebar};border-right:1px solid ${border};display:flex;flex-direction:column;z-index:10;}
        .logo{padding:22px 20px;font-weight:800;font-size:20px;color:${text};text-decoration:none;border-bottom:1px solid ${border};}
        .logo span{color:${accent};}
        .nav-item{display:flex;align-items:center;gap:10px;padding:10px 14px;margin:2px 10px;border-radius:8px;cursor:pointer;font-size:13.5px;color:${textMuted};border:none;background:none;width:calc(100% - 20px);transition:0.2s;}
        .nav-item:hover{background:${inputBg};color:${text};}
        .nav-item.active{background:${accentDim};color:${accent};font-weight:600;}
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .topbar{height:54px;border-bottom:1px solid ${border};display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:${sidebar};}
        .inbox-wrap{flex:1;display:flex;overflow:hidden;}
        .clist{width:300px;border-right:1px solid ${border};display:flex;flex-direction:column;background:${sidebar};}
        .clist-top{padding:15px;border-bottom:1px solid ${border};}
        .search-box{background:${inputBg};border:1px solid ${cardBorder};border-radius:10px;padding:8px 12px;display:flex;gap:8px;}
        .search-box input{background:transparent;border:none;outline:none;color:${text};font-size:13px;flex:1;}
        .c-item{padding:14px 18px;border-bottom:1px solid ${border};cursor:pointer;transition:0.1s;}
        .c-item:hover{background:${inputBg};}
        .c-item.sel{background:${accentDim};border-left:3px solid ${accent};}
        .chat-area{flex:1;display:flex;flex-direction:column;background:${bg};}
        .chat-head{padding:12px 20px;border-bottom:1px solid ${border};background:${card};display:flex;justify-content:space-between;align-items:center;}
        .chat-msgs{flex:1;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:14px;}
        .msg-row{display:flex;flex-direction:column;max-width:70%;}
        .msg-row.outbound{align-self:flex-end;align-items:flex-end;}
        .msg-bubble{padding:11px 15px;border-radius:14px;font-size:13.5px;line-height:1.5;word-wrap:break-word;background:${card};border:1px solid ${cardBorder};}
        .msg-row.outbound .msg-bubble{background:${accent}22;border-color:${accent}44;}
        .msg-time{font-size:10px;color:rgba(255,255,255,0.25);margin-top:5px;}
        .chat-input{padding:18px;border-top:1px solid ${border};background:${card};display:flex;gap:12px;align-items:center;}
        .msg-field{flex:1;background:${inputBg};border:1px solid ${cardBorder};border-radius:12px;padding:11px 15px;color:${text};font-family:inherit;font-size:13.5px;outline:none;resize:none;max-height:100px;}
        .send-btn{background:${accent};color:#000;border:none;padding:0 22px;height:42px;border-radius:11px;font-weight:700;cursor:pointer;transition:0.2s;}
        .send-btn:disabled{opacity:0.4;}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;}
        .modal-card{background:${card};border:1px solid ${cardBorder};padding:30px;border-radius:20px;width:100%;maxWidth:420px;}
        .form-label{font-size:12px;font-weight:600;color:${textMuted};margin-bottom:6px;display:block;}
        .form-input{width:100%;background:${inputBg};border:1px solid ${cardBorder};border-radius:10px;padding:12px;color:${text};margin-bottom:16px;outline:none;}
      `}</style>

      <div className="wrap">
        <aside className="sidebar">
          <a href="/dashboard" className="logo">fast<span>rill</span></a>
          <div style={{ padding: "20px 20px 8px", fontSize: 10, letterSpacing: 1, color: "rgba(255,255,255,0.2)", fontWeight: 700 }}>PLATFORM</div>
          {NAV.map(n => (
            <button key={n.id} className={`nav-item ${n.id === "inbox" ? "active" : ""}`} onClick={() => router.push(n.path)}>
              <span style={{ fontSize: 16 }}>{n.icon}</span> <span>{n.label}</span>
            </button>
          ))}
          <div style={{ marginTop: "auto", padding: 15, borderTop: `1px solid ${border}` }}>
            <button className="nav-item" onClick={handleLogout} style={{ color: "#fca5a5" }}>↩ Sign out</button>
          </div>
        </aside>

        <div className="main">
          <div className="topbar">
            <span style={{ fontWeight: 800, fontSize: 16 }}>Conversations</span>
            <button onClick={toggleTheme} style={{ background: inputBg, border: `1px solid ${cardBorder}`, padding: "6px 14px", borderRadius: 8, color: text, cursor: "pointer", fontSize: 12 }}>
              {dark ? "🌙 Dark Mode" : "☀️ Light Mode"}
            </button>
          </div>

          <div className="inbox-wrap">
            <div className="clist">
              <div className="clist-top">
                <div className="search-box">
                  <span style={{ opacity: 0.4 }}>🔍</span>
                  <input placeholder="Search chats..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                  {["all", "ai", "human"].map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{ fontSize: 10, fontWeight: 700, padding: "5px 12px", borderRadius: 20, border: "none", background: filter === f ? accent : inputBg, color: filter === f ? "#000" : textMuted, cursor: "pointer" }}>
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                {loading ? (
                  <div style={{ padding: 40, textAlign: "center", opacity: 0.3 }}>Loading...</div>
                ) : filtered.length === 0 ? (
                  <div style={{ padding: 40, textAlign: "center", opacity: 0.3 }}>No chats found</div>
                ) : filtered.map(c => (
                  <div key={c.id} className={`c-item ${selected?.id === c.id ? "sel" : ""}`} onClick={() => setSelected(c)}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c._displayName}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: accent }}>{formatConvoTime(c.last_message_at)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.last_message || "No message history"}</div>
                  </div>
                ))}
              </div>
            </div>

            {selected ? (
              <div className="chat-area">
                <div className="chat-head">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: `linear-gradient(135deg, ${accent}, #0ea5e9)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff" }}>
                      {selected._displayName[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{selected._displayName}</div>
                      <div style={{ fontSize: 11, color: textMuted }}>{selected.phone}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setShowBooking(true)} style={{ background: accent, border: "none", padding: "8px 16px", borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: "pointer" }}>📅 Book</button>
                    <button onClick={() => toggleAI(selected.id, selected.ai_enabled)} style={{ background: selected.ai_enabled ? "rgba(0,208,132,0.15)" : inputBg, border: `1px solid ${selected.ai_enabled ? accent : cardBorder}`, padding: "8px 16px", borderRadius: 10, fontWeight: 800, fontSize: 12, color: selected.ai_enabled ? accent : text, cursor: "pointer" }}>
                      AI {selected.ai_enabled ? "ACTIVE" : "OFF"}
                    </button>
                  </div>
                </div>

                <div className="chat-msgs">
                  {messages.map((m, i) => (
                    <div key={m.id || i} className={`msg-row ${m.direction}`}>
                      <div className={`msg-bubble ${m.direction === "inbound" ? "" : m.is_ai ? "ai" : "human"}`}>
                        {m.message_text}
                      </div>
                      <div className="msg-time">{formatMsgTime(m.created_at)}</div>
                    </div>
                  ))}
                  <div ref={msgsEndRef} />
                </div>

                <div className="chat-input">
                  {selected.ai_enabled ? (
                    <div style={{ flex: 1, textAlign: "center", fontSize: 12, color: textMuted, padding: "10px", background: "rgba(255,255,255,0.02)", borderRadius: 10 }}>
                      ◈ AI is currently handling this conversation. Toggle AI OFF to reply manually.
                    </div>
                  ) : (
                    <>
                      <textarea className="msg-field" placeholder="Type a message..." value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg() } }} />
                      <button className="send-btn" onClick={sendMsg} disabled={sending || !msgInput.trim()}>
                        {sending ? "..." : "Send"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: 0.2 }}>
                <div style={{ fontSize: 50 }}>💬</div>
                <div style={{ fontWeight: 700, marginTop: 10 }}>Select a customer to start chatting</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showBooking && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>New Appointment</h2>
              <button onClick={() => setShowBooking(false)} style={{ background: "none", border: "none", color: text, fontSize: 20, cursor: "pointer" }}>×</button>
            </div>
            <label className="form-label">SERVICE</label>
            <select className="form-input" style={{ appearance: "none" }} value={bookingForm.service} onChange={e => setBookingForm({ ...bookingForm, service: e.target.value })}>
              <option value="">Choose a service...</option>
              {services.map(s => <option key={s.name} value={s.name}>{s.name} (₹{s.price})</option>)}
            </select>
            <label className="form-label">DATE</label>
            <input type="date" className="form-input" value={bookingForm.date} onChange={e => setBookingForm({ ...bookingForm, date: e.target.value })} />
            <label className="form-label">TIME</label>
            <select className="form-input" value={bookingForm.time} onChange={e => setBookingForm({ ...bookingForm, time: e.target.value })}>
              <option value="">Select slot...</option>
              {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={saveBooking} disabled={savingBooking} style={{ width: "100%", background: accent, color: "#000", border: "none", padding: "14px", borderRadius: 12, fontWeight: 800, cursor: "pointer", marginTop: 10 }}>
              {savingBooking ? "Scheduling..." : "Confirm Booking"}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
