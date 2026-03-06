"use client"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const MOCK_CONVERSATIONS = [
  {
    id: 1, name: "Priya Sharma", number: "+91 98765 43210",
    lastMsg: "Can I book a haircut for tomorrow?", time: "2m ago",
    unread: 2, aiOn: true, status: "ai", avatar: "P",
    messages: [
      { id: 1, text: "Hi! What services do you offer?", from: "customer", time: "10:01 AM" },
      { id: 2, text: "Hi Priya! 👋 Welcome to Glamour Studio! We offer haircuts, hair colour, facials, waxing, and much more. What are you looking for today? ✨", from: "ai", time: "10:01 AM" },
      { id: 3, text: "What's the price for a women's haircut?", from: "customer", time: "10:03 AM" },
      { id: 4, text: "Women's haircut starts at ₹350 💇‍♀️ We also have styling packages from ₹600. Would you like to book an appointment?", from: "ai", time: "10:03 AM" },
      { id: 5, text: "Can I book a haircut for tomorrow?", from: "customer", time: "10:05 AM" },
    ]
  },
  {
    id: 2, name: "Rahul Verma", number: "+91 87654 32109",
    lastMsg: "Our team will get back to you shortly 🙌", time: "15m ago",
    unread: 0, aiOn: true, status: "needs-attention", avatar: "R",
    messages: [
      { id: 1, text: "Do you have any offers this week?", from: "customer", time: "9:45 AM" },
      { id: 2, text: "Thanks for reaching out! Our team will get back to you shortly 🙌", from: "ai", time: "9:45 AM" },
    ]
  },
  {
    id: 3, name: "Sneha Patel", number: "+91 76543 21098",
    lastMsg: "Okay thank you!", time: "1h ago",
    unread: 0, aiOn: false, status: "human", avatar: "S",
    messages: [
      { id: 1, text: "I want to speak to someone", from: "customer", time: "8:30 AM" },
      { id: 2, text: "Sure! Our team will reach out to you shortly 🙌", from: "ai", time: "8:30 AM" },
      { id: 3, text: "Hi Sneha, this is Ananya from Glamour Studio. How can I help you?", from: "human", time: "8:35 AM" },
      { id: 4, text: "I wanted to know about bridal packages", from: "customer", time: "8:36 AM" },
      { id: 5, text: "Our bridal package starts at ₹8000 and includes full makeup, hair styling and mehendi. Would you like more details?", from: "human", time: "8:38 AM" },
      { id: 6, text: "Okay thank you!", from: "customer", time: "8:40 AM" },
    ]
  },
  {
    id: 4, name: "Kiran Reddy", number: "+91 65432 10987",
    lastMsg: "What time are you open on Sunday?", time: "2h ago",
    unread: 1, aiOn: true, status: "ai", avatar: "K",
    messages: [
      { id: 1, text: "What time are you open on Sunday?", from: "customer", time: "7:15 AM" },
    ]
  },
  {
    id: 5, name: "Meera Nair", number: "+91 54321 09876",
    lastMsg: "Appointment confirmed ✅", time: "3h ago",
    unread: 0, aiOn: true, status: "booked", avatar: "M",
    messages: [
      { id: 1, text: "I want to book a facial", from: "customer", time: "6:00 AM" },
      { id: 2, text: "Great choice! 💆‍♀️ Our facial starts at ₹600. What date works for you?", from: "ai", time: "6:00 AM" },
      { id: 3, text: "Tomorrow at 11am", from: "customer", time: "6:02 AM" },
      { id: 4, text: "Appointment confirmed ✅ Tomorrow, 11:00 AM — Facial (₹600). We'll send a reminder 1 hour before. See you at Glamour Studio! 🌟", from: "ai", time: "6:02 AM" },
    ]
  },
]

export default function ConversationsPage() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS)
  const [selected, setSelected] = useState(MOCK_CONVERSATIONS[0])
  const [inputMsg, setInputMsg] = useState("")
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const messagesEndRef = useRef(null)

  const navItems = [
    { id: "overview", label: "Revenue Engine", icon: "◈" },
    { id: "inbox", label: "Conversations", icon: "◎" },
    { id: "bookings", label: "Bookings", icon: "◷" },
    { id: "leads", label: "Lead Recovery", icon: "◉" },
    { id: "contacts", label: "Customers", icon: "◑" },
    { id: "analytics", label: "Analytics", icon: "◫" },
    { id: "settings", label: "Settings", icon: "◌" },
  ]

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { router.push("/login"); return }
      setUserEmail(data.user.email || "")
    }
    init()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selected])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const toggleAI = (convId) => {
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, aiOn: !c.aiOn, status: c.aiOn ? "human" : "ai" } : c
    ))
    if (selected?.id === convId) {
      setSelected(prev => ({ ...prev, aiOn: !prev.aiOn, status: prev.aiOn ? "human" : "ai" }))
    }
  }

  const sendMessage = () => {
    if (!inputMsg.trim() || !selected) return
    const newMsg = { id: Date.now(), text: inputMsg, from: "human", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
    const updated = conversations.map(c =>
      c.id === selected.id
        ? { ...c, messages: [...c.messages, newMsg], lastMsg: inputMsg, time: "now" }
        : c
    )
    setConversations(updated)
    setSelected(prev => ({ ...prev, messages: [...prev.messages, newMsg], lastMsg: inputMsg }))
    setInputMsg("")
  }

  const filteredConvs = conversations.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.number.includes(search)
    const matchFilter = filter === "all" || c.status === filter
    return matchSearch && matchFilter
  })

  const getStatusColor = (status) => {
    if (status === "ai") return "#00c47d"
    if (status === "needs-attention") return "#f59e0b"
    if (status === "booked") return "#0ea5e9"
    if (status === "human") return "#7c3aed"
    return "#6b7280"
  }

  const getStatusLabel = (status) => {
    if (status === "ai") return "AI Active"
    if (status === "needs-attention") return "Needs Attention"
    if (status === "booked") return "Booked ✓"
    if (status === "human") return "Human"
    return status
  }

  const userInitial = userEmail ? userEmail[0].toUpperCase() : "U"
  const needsAttentionCount = conversations.filter(c => c.status === "needs-attention").length

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0a0a0f !important; color: #e8e8f0 !important; font-family: 'DM Sans', sans-serif !important; }

        .dash-root { display: flex; height: 100vh; overflow: hidden; }

        /* SIDEBAR */
        .sidebar { width: 220px; flex-shrink: 0; background: #0f0f17; border-right: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; }
        .sidebar-logo { padding: 24px 20px 20px; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 22px; color: #fff; text-decoration: none; display: block; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .sidebar-logo span { color: #00c47d; }
        .sidebar-section { padding: 20px 12px 8px; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.2); font-weight: 600; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; margin: 2px 8px; border-radius: 8px; cursor: pointer; font-size: 13px; color: rgba(255,255,255,0.45); font-weight: 500; transition: all 0.15s; border: none; background: none; width: calc(100% - 16px); text-align: left; font-family: 'DM Sans', sans-serif; }
        .nav-item:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8); }
        .nav-item.active { background: rgba(0,196,125,0.1); color: #00c47d; font-weight: 600; border: 1px solid rgba(0,196,125,0.2); }
        .nav-icon { font-size: 14px; width: 18px; text-align: center; }
        .nav-badge { margin-left: auto; background: #f59e0b; color: #000; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 100px; font-family: 'Syne', sans-serif; }
        .sidebar-footer { margin-top: auto; padding: 14px; border-top: 1px solid rgba(255,255,255,0.05); }
        .user-card { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); }
        .user-avatar { width: 30px; height: 30px; border-radius: 8px; background: linear-gradient(135deg, #00c47d, #0ea5e9); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 12px; color: #fff; flex-shrink: 0; }
        .user-email { font-size: 11px; color: rgba(255,255,255,0.35); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .logout-btn { margin-top: 8px; width: 100%; padding: 7px; border-radius: 7px; background: transparent; border: 1px solid rgba(255,255,255,0.08); font-size: 11.5px; color: rgba(255,255,255,0.3); cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .logout-btn:hover { border-color: rgba(239,68,68,0.4); color: #ef4444; }

        /* MAIN */
        .main { flex: 1; display: flex; overflow: hidden; }

        /* CONV LIST */
        .conv-list { width: 320px; flex-shrink: 0; border-right: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; background: #0f0f17; }
        .conv-list-header { padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .conv-list-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; color: #fff; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; }
        .search-box { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 9px; padding: 8px 12px; margin-bottom: 10px; }
        .search-box input { background: none; border: none; outline: none; font-size: 12.5px; color: #e8e8f0; font-family: 'DM Sans', sans-serif; flex: 1; }
        .search-box input::placeholder { color: rgba(255,255,255,0.2); }
        .search-icon { color: rgba(255,255,255,0.2); font-size: 13px; }
        .filter-tabs { display: flex; gap: 4px; }
        .filter-tab { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid rgba(255,255,255,0.07); background: transparent; color: rgba(255,255,255,0.3); transition: all 0.12s; font-family: 'DM Sans', sans-serif; }
        .filter-tab.active { background: rgba(0,196,125,0.1); border-color: rgba(0,196,125,0.25); color: #00c47d; }
        .conv-items { flex: 1; overflow-y: auto; }
        .conv-item { display: flex; align-items: center; gap: 11px; padding: 13px 16px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.12s; position: relative; }
        .conv-item:hover { background: rgba(255,255,255,0.03); }
        .conv-item.active { background: rgba(0,196,125,0.06); border-left: 2px solid #00c47d; }
        .conv-avatar { width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, rgba(0,196,125,0.3), rgba(14,165,233,0.3)); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 14px; color: #fff; flex-shrink: 0; position: relative; }
        .conv-status-dot { position: absolute; bottom: -2px; right: -2px; width: 10px; height: 10px; border-radius: 50%; border: 2px solid #0f0f17; }
        .conv-info { flex: 1; min-width: 0; }
        .conv-name { font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 2px; display: flex; align-items: center; justify-content: space-between; }
        .conv-time { font-size: 10px; color: rgba(255,255,255,0.25); font-weight: 400; }
        .conv-preview { font-size: 11.5px; color: rgba(255,255,255,0.35); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: flex; align-items: center; justify-content: space-between; gap: 6px; }
        .conv-unread { background: #00c47d; color: #000; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 100px; flex-shrink: 0; font-family: 'Syne', sans-serif; }
        .conv-items::-webkit-scrollbar { width: 3px; }
        .conv-items::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); }

        /* CHAT PANEL */
        .chat-panel { flex: 1; display: flex; flex-direction: column; background: #0a0a0f; }
        .chat-header { padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); background: #0f0f17; display: flex; align-items: center; justify-content: space-between; }
        .chat-header-left { display: flex; align-items: center; gap: 12px; }
        .chat-header-avatar { width: 36px; height: 36px; border-radius: 9px; background: linear-gradient(135deg, rgba(0,196,125,0.3), rgba(14,165,233,0.3)); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 13px; color: #fff; }
        .chat-header-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; color: #fff; }
        .chat-header-num { font-size: 11px; color: rgba(255,255,255,0.3); }
        .chat-header-right { display: flex; align-items: center; gap: 12px; }
        .status-pill { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; }

        /* AI TOGGLE */
        .ai-toggle-wrap { display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }
        .ai-toggle-label { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.5); }
        .ai-toggle { width: 40px; height: 22px; border-radius: 100px; border: none; cursor: pointer; transition: background 0.2s; position: relative; flex-shrink: 0; }
        .ai-toggle.on { background: #00c47d; }
        .ai-toggle.off { background: rgba(255,255,255,0.12); }
        .ai-toggle::after { content: ''; position: absolute; top: 3px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: left 0.2s; }
        .ai-toggle.on::after { left: 21px; }
        .ai-toggle.off::after { left: 3px; }
        .ai-toggle-status { font-size: 11px; font-weight: 700; }
        .ai-toggle-status.on { color: #00c47d; }
        .ai-toggle-status.off { color: rgba(255,255,255,0.3); }

        /* ATTENTION BANNER */
        .attention-banner { margin: 10px 16px 0; padding: 10px 14px; border-radius: 10px; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); display: flex; align-items: center; gap: 10px; }
        .attention-banner-text { font-size: 12px; color: #f59e0b; font-weight: 500; flex: 1; }
        .attention-reply-btn { padding: 5px 12px; border-radius: 7px; background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3); color: #f59e0b; font-size: 11.5px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; white-space: nowrap; }

        /* MESSAGES */
        .messages-area { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; }
        .msg-row { display: flex; align-items: flex-end; gap: 8px; }
        .msg-row.customer { justify-content: flex-start; }
        .msg-row.ai, .msg-row.human { justify-content: flex-end; }
        .msg-bubble { max-width: 68%; padding: 10px 14px; border-radius: 14px; font-size: 13px; line-height: 1.5; position: relative; }
        .msg-bubble.customer { background: rgba(255,255,255,0.07); color: #e8e8f0; border-bottom-left-radius: 4px; }
        .msg-bubble.ai { background: rgba(0,196,125,0.12); border: 1px solid rgba(0,196,125,0.2); color: #e8e8f0; border-bottom-right-radius: 4px; }
        .msg-bubble.human { background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.2); color: #e8e8f0; border-bottom-right-radius: 4px; }
        .msg-meta { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
        .msg-time { font-size: 10px; color: rgba(255,255,255,0.2); }
        .msg-badge { font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 100px; letter-spacing: 0.5px; }
        .msg-badge.ai { background: rgba(0,196,125,0.2); color: #00c47d; }
        .msg-badge.human { background: rgba(124,58,237,0.2); color: #a78bfa; }
        .messages-area::-webkit-scrollbar { width: 3px; }
        .messages-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); }

        /* INPUT */
        .chat-input-area { padding: 14px 20px; border-top: 1px solid rgba(255,255,255,0.06); background: #0f0f17; }
        .ai-paused-note { font-size: 11.5px; color: rgba(124,58,237,0.8); margin-bottom: 8px; display: flex; align-items: center; gap: 6px; background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.15); padding: 7px 12px; border-radius: 8px; }
        .input-row { display: flex; gap: 10px; align-items: flex-end; }
        .msg-input { flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 11px 15px; font-size: 13px; color: #e8e8f0; font-family: 'DM Sans', sans-serif; outline: none; resize: none; transition: border-color 0.15s; line-height: 1.4; }
        .msg-input:focus { border-color: rgba(0,196,125,0.35); }
        .msg-input::placeholder { color: rgba(255,255,255,0.2); }
        .send-btn { width: 42px; height: 42px; border-radius: 11px; background: #00c47d; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 17px; transition: all 0.15s; flex-shrink: 0; }
        .send-btn:hover { background: #00d988; transform: scale(1.05); }
        .send-btn:disabled { background: rgba(255,255,255,0.08); cursor: not-allowed; transform: none; }

        /* EMPTY STATE */
        .empty-chat { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: rgba(255,255,255,0.2); }
        .empty-chat-icon { font-size: 40px; opacity: 0.3; }
        .empty-chat-text { font-size: 13px; }
      `}</style>

      <div className="dash-root">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <a href="/" className="sidebar-logo">fast<span>rill</span></a>
          <div className="sidebar-section">Platform</div>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item${item.id === "inbox" ? " active" : ""}`}
              onClick={() => {
                if (item.id === "settings") router.push("/dashboard/settings")
                else if (item.id === "inbox") router.push("/dashboard/conversations")
                else if (item.id === "overview") router.push("/dashboard")
                else if (item.id === "bookings") router.push("/dashboard/bookings")
                else router.push("/dashboard")
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === "inbox" && needsAttentionCount > 0 && (
                <span className="nav-badge">{needsAttentionCount}</span>
              )}
            </button>
          ))}
          <div className="sidebar-footer">
            <div className="user-card">
              <div className="user-avatar">{userInitial}</div>
              <div className="user-email">{userEmail}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>↩ Sign out</button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="main">
          {/* CONVERSATION LIST */}
          <div className="conv-list">
            <div className="conv-list-header">
              <div className="conv-list-title">
                Conversations
                <span style={{fontSize:"11px", color:"rgba(255,255,255,0.25)", fontWeight:400, fontFamily:"DM Sans"}}>
                  {conversations.length} total
                </span>
              </div>
              <div className="search-box">
                <span className="search-icon">⌕</span>
                <input
                  placeholder="Search conversations..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="filter-tabs">
                {[
                  { id: "all", label: "All" },
                  { id: "needs-attention", label: "⚠ Attention" },
                  { id: "ai", label: "AI" },
                  { id: "booked", label: "Booked" },
                ].map(f => (
                  <button
                    key={f.id}
                    className={`filter-tab${filter === f.id ? " active" : ""}`}
                    onClick={() => setFilter(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="conv-items">
              {filteredConvs.map(c => (
                <div
                  key={c.id}
                  className={`conv-item${selected?.id === c.id ? " active" : ""}`}
                  onClick={() => setSelected(c)}
                >
                  <div className="conv-avatar">
                    {c.avatar}
                    <div className="conv-status-dot" style={{background: getStatusColor(c.status)}} />
                  </div>
                  <div className="conv-info">
                    <div className="conv-name">
                      {c.name}
                      <span className="conv-time">{c.time}</span>
                    </div>
                    <div className="conv-preview">
                      <span style={{overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
                        {c.lastMsg}
                      </span>
                      {c.unread > 0 && <span className="conv-unread">{c.unread}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CHAT PANEL */}
          <div className="chat-panel">
            {selected ? (
              <>
                {/* CHAT HEADER */}
                <div className="chat-header">
                  <div className="chat-header-left">
                    <div className="chat-header-avatar">{selected.avatar}</div>
                    <div>
                      <div className="chat-header-name">{selected.name}</div>
                      <div className="chat-header-num">{selected.number}</div>
                    </div>
                    <div className="status-pill" style={{
                      background: getStatusColor(selected.status) + "15",
                      border: `1px solid ${getStatusColor(selected.status)}30`,
                      color: getStatusColor(selected.status)
                    }}>
                      <span style={{width:6, height:6, borderRadius:"50%", background:"currentColor", display:"inline-block"}} />
                      {getStatusLabel(selected.status)}
                    </div>
                  </div>
                  <div className="chat-header-right">
                    <div className="ai-toggle-wrap">
                      <span className="ai-toggle-label">AI</span>
                      <button
                        className={`ai-toggle ${selected.aiOn ? "on" : "off"}`}
                        onClick={() => toggleAI(selected.id)}
                      />
                      <span className={`ai-toggle-status ${selected.aiOn ? "on" : "off"}`}>
                        {selected.aiOn ? "ON" : "OFF"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ATTENTION BANNER */}
                {selected.status === "needs-attention" && (
                  <div className="attention-banner">
                    <span>⚠️</span>
                    <span className="attention-banner-text">
                      AI couldn't answer this customer. They need a human response.
                    </span>
                    <button className="attention-reply-btn" onClick={() => toggleAI(selected.id)}>
                      Take Over →
                    </button>
                  </div>
                )}

                {/* MESSAGES */}
                <div className="messages-area">
                  {selected.messages.map(msg => (
                    <div key={msg.id} className={`msg-row ${msg.from}`}>
                      <div className={`msg-bubble ${msg.from}`}>
                        {msg.text}
                        <div className="msg-meta">
                          <span className="msg-time">{msg.time}</span>
                          {msg.from === "ai" && <span className="msg-badge ai">AI</span>}
                          {msg.from === "human" && <span className="msg-badge human">You</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* INPUT */}
                <div className="chat-input-area">
                  {!selected.aiOn && (
                    <div className="ai-paused-note">
                      ◈ AI is paused — you are in control of this conversation
                    </div>
                  )}
                  {selected.aiOn && (
                    <div style={{fontSize:"11.5px", color:"rgba(0,196,125,0.6)", marginBottom:"8px", display:"flex", alignItems:"center", gap:"6px"}}>
                      ◈ AI is handling this conversation — toggle off to reply manually
                    </div>
                  )}
                  <div className="input-row">
                    <textarea
                      className="msg-input"
                      rows={1}
                      placeholder={selected.aiOn ? "AI is active — toggle off to type..." : "Type a message..."}
                      value={inputMsg}
                      onChange={e => setInputMsg(e.target.value)}
                      disabled={selected.aiOn}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() }}}
                    />
                    <button className="send-btn" onClick={sendMessage} disabled={selected.aiOn || !inputMsg.trim()}>
                      ➤
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-chat">
                <div className="empty-chat-icon">💬</div>
                <div className="empty-chat-text">Select a conversation to start</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
