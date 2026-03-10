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
  const msgsEndRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login")
      else { setUserEmail(data.user.email || ""); setUserId(data.user.id) }
    })
  }, [])

  // Load conversations
  useEffect(() => {
    if (!userId) return
    loadConvos()
    // Real-time subscription
    const channel = supabase.channel("conversations")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations", filter: `user_id=eq.${userId}` },
        () => loadConvos())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [userId])

  // Load messages when conversation selected
  useEffect(() => {
    if (!selected) return
    loadMessages(selected.id)
    // Mark as read
    supabase.from("conversations").update({ unread_count: 0 }).eq("id", selected.id)
    // Real-time messages
    const channel = supabase.channel("messages-" + selected.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selected.id}` },
        (payload) => setMessages(prev => [...prev, payload.new]))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [selected?.id])

  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  async function loadConvos() {
    setLoading(true)
    const { data } = await supabase
      .from("conversations")
      .select("*, customers(name, phone)")
      .eq("user_id", userId)
      .order("last_message_at", { ascending: false })
    setConvos(data || [])
    if (data?.length && !selected) setSelected(data[0])
    setLoading(false)
  }

  async function loadMessages(convoId) {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convoId)
      .order("created_at", { ascending: true })
    setMessages(data || [])
  }

  async function toggleAI(convoId, current) {
    await supabase.from("conversations").update({ ai_enabled: !current }).eq("id", convoId)
    setConvos(prev => prev.map(c => c.id === convoId ? { ...c, ai_enabled: !current } : c))
    if (selected?.id === convoId) setSelected(prev => ({ ...prev, ai_enabled: !current }))
  }

  async function sendMsg() {
    if (!msgInput.trim() || !selected || sending) return
    setSending(true)
    const text = msgInput.trim()
    setMsgInput("")

    try {
      // Get WhatsApp connection
      const { data: conn } = await supabase.from("whatsapp_connections").select("access_token, phone_number_id").eq("user_id", userId).single()
      if (!conn) { alert("WhatsApp not connected"); setSending(false); return }

      // Send via WhatsApp API
      const phone = selected.phone.replace("+", "")
      const res = await fetch(`https://graph.facebook.com/v18.0/${conn.phone_number_id}/messages`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${conn.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", to: phone, type: "text", text: { body: text } })
      })
      const waData = await res.json()

      // Save to DB
      await supabase.from("messages").insert({
        conversation_id: selected.id, customer_phone: selected.phone,
        direction: "outbound", message_type: "text", content: text,
        status: "sent", is_ai: false, user_id: userId,
        wa_message_id: waData?.messages?.[0]?.id || null,
        created_at: new Date().toISOString()
      })

      await supabase.from("conversations").update({ last_message: text, last_message_at: new Date().toISOString() }).eq("id", selected.id)
    } catch (e) { console.error(e) }
    setSending(false)
  }

  const toggleTheme = () => { const n = !dark; setDark(n); localStorage.setItem("fastrill-theme", n ? "dark" : "light") }
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login") }

  const bg = dark ? "#08080e" : "#f0f2f5"
  const sidebar = dark ? "#0c0c15" : "#ffffff"
  const card = dark ? "#0f0f1a" : "#ffffff"
  const border = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"
  const cardBorder = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)"
  const text = dark ? "#eeeef5" : "#111827"
  const textMuted = dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)"
  const textFaint = dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)"
  const inputBg = dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"
  const accent = dark ? "#00d084" : "#00935a"
  const navText = dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)"
  const navActive = dark ? "rgba(0,196,125,0.1)" : "rgba(0,180,115,0.08)"
  const navActiveBorder = dark ? "rgba(0,196,125,0.2)" : "rgba(0,180,115,0.2)"
  const navActiveText = dark ? "#00c47d" : "#00935a"
  const accentDim = dark ? "rgba(0,208,132,0.12)" : "rgba(0,147,90,0.1)"
  const userInitial = userEmail ? userEmail[0].toUpperCase() : "G"

  const getInitial = (name) => (name || "?")[0].toUpperCase()
  const getAvatarColor = (name) => { const colors = ["#00d084","#38bdf8","#a78bfa","#f59e0b","#fb7185","#34d399"]; return colors[(name||"").charCodeAt(0) % colors.length] }
  const formatTime = (ts) => { if (!ts) return ""; const d = new Date(ts); const now = new Date(); const diff = now - d; if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`; if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`; return d.toLocaleDateString() }

  const filtered = convos.filter(c => {
    const name = c.customers?.name || c.phone || ""
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || (c.last_message||"").toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === "all" || (filter === "ai" && c.ai_enabled) || (filter === "human" && !c.ai_enabled) || filter === c.status
    return matchSearch && matchFilter
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
        .toggle-pill{width:30px;height:16px;border-radius:100px;background:${dark ? accent : "#d1d5db"};position:relative;flex-shrink:0;transition:background 0.2s;}
        .toggle-pill::after{content:'';position:absolute;top:2px;width:12px;height:12px;border-radius:50%;background:#fff;transition:left 0.2s;left:${dark ? "16px" : "2px"};}
        .inbox-wrap{flex:1;display:flex;overflow:hidden;}
        .clist{width:300px;flex-shrink:0;border-right:1px solid ${border};display:flex;flex-direction:column;background:${sidebar};}
        .clist-top{padding:12px;border-bottom:1px solid ${border};}
        .search-box{display:flex;align-items:center;gap:7px;background:${inputBg};border:1px solid ${cardBorder};border-radius:8px;padding:7px 10px;margin-bottom:9px;}
        .search-box input{flex:1;background:transparent;border:none;outline:none;font-size:12.5px;color:${text};font-family:'Plus Jakarta Sans',sans-serif;}
        .search-box input::placeholder{color:${textFaint};}
        .filters{display:flex;gap:4px;flex-wrap:wrap;}
        .filter-btn{padding:3px 9px;border-radius:100px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid ${cardBorder};background:transparent;color:${textMuted};font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.12s;}
        .filter-btn.active{background:${accentDim};border-color:${accent}44;color:${accent};}
        .clist-items{flex:1;overflow-y:auto;}
        .c-item{padding:11px 14px;border-bottom:1px solid ${border};cursor:pointer;transition:background 0.1s;}
        .c-item:hover{background:${inputBg};}
        .c-item.sel{background:${accentDim};border-left:2px solid ${accent};}
        .c-top{display:flex;align-items:center;gap:9px;margin-bottom:4px;}
        .c-av{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#fff;flex-shrink:0;}
        .c-info{flex:1;min-width:0;}
        .c-name{font-weight:600;font-size:13px;color:${text};display:flex;align-items:center;justify-content:space-between;}
        .c-time{font-size:10.5px;color:${textFaint};font-weight:400;}
        .c-msg{font-size:12px;color:${textMuted};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .c-badges{display:flex;align-items:center;gap:5px;margin-top:4px;}
        .status-pill{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:100px;font-size:10px;font-weight:700;border:1px solid;}
        .unread-dot{background:${accent};color:#fff;font-size:9px;font-weight:700;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
        .chat-area{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .chat-head{padding:14px 18px;border-bottom:1px solid ${border};display:flex;align-items:center;justify-content:space-between;background:${card};flex-shrink:0;}
        .chat-head-l{display:flex;align-items:center;gap:11px;}
        .ch-av{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#fff;}
        .ch-name{font-weight:700;font-size:14px;color:${text};}
        .ch-num{font-size:11px;color:${textMuted};}
        .ai-toggle-wrap{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:600;color:${textMuted};}
        .ai-toggle{width:36px;height:20px;border-radius:100px;position:relative;cursor:pointer;transition:background 0.2s;border:none;flex-shrink:0;}
        .chat-msgs{flex:1;overflow-y:auto;padding:16px 18px;display:flex;flex-direction:column;gap:10px;background:${bg};}
        .msg-row{display:flex;}
        .msg-row.inbound{justify-content:flex-start;}
        .msg-row.outbound{justify-content:flex-end;}
        .msg-bubble{max-width:65%;padding:9px 13px;border-radius:12px;font-size:13px;line-height:1.5;}
        .msg-bubble.inbound{background:${card};border:1px solid ${cardBorder};color:${text};border-radius:4px 12px 12px 12px;}
        .msg-bubble.outbound-ai{background:${accent}22;border:1px solid ${accent}44;color:${text};border-radius:12px 4px 12px 12px;}
        .msg-bubble.outbound-human{background:rgba(167,139,250,0.15);border:1px solid rgba(167,139,250,0.3);color:${text};border-radius:12px 4px 12px 12px;}
        .msg-time{font-size:10px;color:${textFaint};margin-top:3px;}
        .msg-from{font-size:10px;font-weight:700;margin-bottom:2px;letter-spacing:0.5px;}
        .chat-input{padding:12px 18px;border-top:1px solid ${border};background:${card};display:flex;gap:9px;align-items:center;flex-shrink:0;}
        .msg-field{flex:1;background:${inputBg};border:1px solid ${cardBorder};border-radius:9px;padding:9px 13px;font-size:13px;color:${text};font-family:'Plus Jakarta Sans',sans-serif;outline:none;}
        .msg-field::placeholder{color:${textFaint};}
        .send-btn{background:${accent};color:#fff;border:none;border-radius:9px;padding:9px 16px;font-weight:700;font-size:13px;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .send-btn:disabled{opacity:0.4;cursor:not-allowed;}
        .ai-note{font-size:11px;color:${textFaint};text-align:center;flex:1;}
        .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:10px;color:${textFaint};}
        select{color-scheme:dark;background-color:inherit;}
        select option{background-color:#0c0c15!important;color:#eeeef5!important;}
        select:focus{outline:none;}
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
                <span>{dark?"🌙":"☀️"}</span>
                <div className="toggle-pill"/>
                <span>{dark?"Dark":"Light"}</span>
              </button>
            </div>
          </div>

          <div className="inbox-wrap">
            {/* Convo List */}
            <div className="clist">
              <div className="clist-top">
                <div className="search-box">
                  <span style={{color:textFaint,fontSize:13}}>🔍</span>
                  <input placeholder="Search conversations..." value={search} onChange={e=>setSearch(e.target.value)}/>
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
                {loading ? (
                  <div className="empty-state"><span>Loading...</span></div>
                ) : filtered.length === 0 ? (
                  <div className="empty-state"><span style={{fontSize:28}}>💬</span><span>No conversations yet</span><span style={{fontSize:11}}>Messages will appear here</span></div>
                ) : filtered.map(c => {
                  const name = c.customers?.name || c.phone
                  const color = getAvatarColor(name)
                  return (
                    <div key={c.id} className={`c-item${selected?.id===c.id?" sel":""}`} onClick={()=>setSelected(c)}>
                      <div className="c-top">
                        <div className="c-av" style={{background:`linear-gradient(135deg,${color}88,${color}44)`}}>{getInitial(name)}</div>
                        <div className="c-info">
                          <div className="c-name"><span>{name}</span><span className="c-time">{formatTime(c.last_message_at)}</span></div>
                          <div className="c-msg">{c.last_message||"No messages yet"}</div>
                        </div>
                      </div>
                      <div className="c-badges">
                        <span className="status-pill" style={{color:c.ai_enabled?accent:"#a78bfa",borderColor:(c.ai_enabled?accent:"#a78bfa")+"44",background:(c.ai_enabled?accent:"#a78bfa")+"12"}}>
                          ● {c.ai_enabled?"AI Active":"Human"}
                        </span>
                        {c.unread_count>0 && <span className="unread-dot">{c.unread_count}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Chat */}
            {selected ? (
              <div className="chat-area">
                <div className="chat-head">
                  <div className="chat-head-l">
                    <div className="ch-av" style={{background:`linear-gradient(135deg,${getAvatarColor(selected.customers?.name||selected.phone)}88,${getAvatarColor(selected.customers?.name||selected.phone)}44)`}}>
                      {getInitial(selected.customers?.name||selected.phone)}
                    </div>
                    <div>
                      <div className="ch-name">{selected.customers?.name||selected.phone}</div>
                      <div className="ch-num">{selected.phone}</div>
                    </div>
                  </div>
                  <div className="ai-toggle-wrap">
                    <span>AI</span>
                    <button className="ai-toggle"
                      style={{background:selected.ai_enabled?accent:(dark?"rgba(255,255,255,0.12)":"#d1d5db")}}
                      onClick={()=>toggleAI(selected.id, selected.ai_enabled)}>
                      <span style={{position:"absolute",top:"2px",width:"16px",height:"16px",borderRadius:"50%",background:"#fff",transition:"left 0.2s",left:selected.ai_enabled?"18px":"2px",display:"block"}}/>
                    </button>
                    <span style={{color:selected.ai_enabled?accent:textFaint}}>{selected.ai_enabled?"ON":"OFF"}</span>
                  </div>
                </div>

                <div className="chat-msgs">
                  {messages.length===0 ? (
                    <div className="empty-state"><span style={{fontSize:24}}>💬</span><span>No messages yet</span></div>
                  ) : messages.map(m=>{
                    const dir = m.direction||"inbound"
                    const isAI = m.is_ai
                    const bubbleClass = dir==="inbound" ? "inbound" : isAI ? "outbound-ai" : "outbound-human"
                    const fromLabel = dir==="inbound" ? (selected.customers?.name||selected.phone) : isAI ? "◈ AI" : "👤 You"
                    const fromColor = dir==="inbound" ? textFaint : isAI ? accent : "#a78bfa"
                    return (
                      <div key={m.id} className={`msg-row ${dir}`}>
                        <div>
                          <div className="msg-from" style={{color:fromColor,textAlign:dir==="inbound"?"left":"right"}}>{fromLabel}</div>
                          <div className={`msg-bubble ${bubbleClass}`}>{m.content||m.message_text}</div>
                          <div className="msg-time" style={{textAlign:dir==="inbound"?"left":"right"}}>{new Date(m.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={msgsEndRef}/>
                </div>

                <div className="chat-input">
                  {selected.ai_enabled ? (
                    <div className="ai-note">◈ AI is handling this conversation — turn off AI to send a manual message</div>
                  ) : (
                    <>
                      <input className="msg-field" placeholder="Type a message..." value={msgInput}
                        onChange={e=>setMsgInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMsg()}/>
                      <button className="send-btn" onClick={sendMsg} disabled={sending}>{sending?"...":"Send"}</button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="chat-area">
                <div className="empty-state"><span style={{fontSize:36}}>💬</span><span style={{fontSize:14,fontWeight:600}}>Select a conversation</span></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
