"use client"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"
import { useTheme } from "@/lib/ThemeContext"

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
  const { t, accent, darkMode } = useTheme()
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS)
  const [selected, setSelected] = useState(MOCK_CONVERSATIONS[0])
  const [inputMsg, setInputMsg] = useState("")
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) router.push("/login")
    }
    init()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selected])

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
      c.id === selected.id ? { ...c, messages: [...c.messages, newMsg], lastMsg: inputMsg, time: "now" } : c
    )
    setConversations(updated)
    setSelected(prev => ({ ...prev, messages: [...prev.messages, newMsg] }))
    setInputMsg("")
  }

  const filteredConvs = conversations.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.number.includes(search)
    const matchFilter = filter === "all" || c.status === filter
    return matchSearch && matchFilter
  })

  const getStatusColor = (status) => {
    if (status === "ai") return accent
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

  const needsAttentionCount = conversations.filter(c => c.status === "needs-attention").length

  return (
    <DashboardLayout
      activePage="inbox"
      topbar={<span style={{fontWeight:700, fontSize:15, color:t.text}}>Conversations</span>}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .conv-root { display: flex; flex: 1; overflow: hidden; height: calc(100vh - 54px); font-family: 'Plus Jakarta Sans', sans-serif; }

        /* LIST */
        .conv-list { width: 310px; flex-shrink: 0; border-right: 1px solid ${t.border}; display: flex; flex-direction: column; background: ${t.sidebar}; }
        .conv-list-header { padding: 14px; border-bottom: 1px solid ${t.border}; }
        .conv-list-title { font-weight: 700; font-size: 13px; color: ${t.text}; margin-bottom: 9px; display: flex; align-items: center; justify-content: space-between; }
        .conv-count { font-size: 11px; color: ${t.textMuted}; font-weight: 400; }
        .search-box { display: flex; align-items: center; gap: 8px; background: ${t.inputBg}; border: 1px solid ${t.cardBorder}; border-radius: 9px; padding: 8px 11px; margin-bottom: 9px; }
        .search-box input { background: none; border: none; outline: none; font-size: 12.5px; color: ${t.text}; font-family: 'Plus Jakarta Sans', sans-serif; flex: 1; }
        .search-box input::placeholder { color: ${t.textFaint}; }
        .filter-tabs { display: flex; gap: 4px; }
        .filter-tab { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid ${t.cardBorder}; background: transparent; color: ${t.textMuted}; transition: all 0.12s; font-family: 'Plus Jakarta Sans', sans-serif; }
        .filter-tab.active { background: ${accent}15; border-color: ${accent}40; color: ${accent}; }
        .conv-items { flex: 1; overflow-y: auto; }
        .conv-item { display: flex; align-items: center; gap: 11px; padding: 12px 14px; cursor: pointer; border-bottom: 1px solid ${t.border}; transition: background 0.12s; }
        .conv-item:hover { background: ${t.inputBg}; }
        .conv-item.active { background: ${accent}0d; border-left: 2px solid ${accent}; }
        .conv-avatar { width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, ${accent}40, #0ea5e940); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: ${t.text}; flex-shrink: 0; position: relative; }
        .conv-status-dot { position: absolute; bottom: -2px; right: -2px; width: 10px; height: 10px; border-radius: 50%; border: 2px solid ${t.sidebar}; }
        .conv-info { flex: 1; min-width: 0; }
        .conv-name { font-size: 13px; font-weight: 600; color: ${t.text}; margin-bottom: 2px; display: flex; align-items: center; justify-content: space-between; }
        .conv-time { font-size: 10px; color: ${t.textFaint}; font-weight: 400; }
        .conv-preview { font-size: 11.5px; color: ${t.textMuted}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: flex; align-items: center; justify-content: space-between; gap: 6px; }
        .conv-unread { background: ${accent}; color: #000; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 100px; flex-shrink: 0; }
        .conv-items::-webkit-scrollbar { width: 3px; }
        .conv-items::-webkit-scrollbar-thumb { background: ${t.border}; }

        /* CHAT */
        .chat-panel { flex: 1; display: flex; flex-direction: column; background: ${t.bg}; }
        .chat-header { padding: 13px 18px; border-bottom: 1px solid ${t.border}; background: ${t.topbar}; display: flex; align-items: center; justify-content: space-between; }
        .chat-header-left { display: flex; align-items: center; gap: 11px; }
        .chat-hdr-avatar { width: 34px; height: 34px; border-radius: 9px; background: linear-gradient(135deg, ${accent}40, #0ea5e940); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; color: ${t.text}; }
        .chat-hdr-name { font-weight: 700; font-size: 13.5px; color: ${t.text}; }
        .chat-hdr-num { font-size: 11px; color: ${t.textMuted}; }
        .status-pill { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; }
        .ai-toggle-wrap { display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 9px; background: ${t.inputBg}; border: 1px solid ${t.cardBorder}; }
        .ai-toggle-label { font-size: 12px; font-weight: 600; color: ${t.textMuted}; }
        .ai-toggle { width: 38px; height: 20px; border-radius: 100px; border: none; cursor: pointer; position: relative; flex-shrink: 0; transition: background 0.2s; }
        .ai-toggle.on { background: ${accent}; }
        .ai-toggle.off { background: ${darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}; }
        .ai-toggle::after { content:''; position:absolute; top:3px; width:14px; height:14px; border-radius:50%; background:#fff; transition:left 0.2s; }
        .ai-toggle.on::after { left: 21px; }
        .ai-toggle.off::after { left: 3px; }
        .ai-status { font-size: 11px; font-weight: 700; }
        .ai-status.on { color: ${accent}; }
        .ai-status.off { color: ${t.textMuted}; }

        .attention-banner { margin: 10px 16px 0; padding: 9px 13px; border-radius: 9px; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); display: flex; align-items: center; gap: 9px; }
        .attention-text { font-size: 12px; color: #f59e0b; font-weight: 500; flex: 1; }
        .attention-btn { padding: 4px 11px; border-radius: 7px; background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.25); color: #f59e0b; font-size: 11.5px; font-weight: 700; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; white-space: nowrap; }

        .messages-area { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; }
        .msg-row { display: flex; }
        .msg-row.customer { justify-content: flex-start; }
        .msg-row.ai, .msg-row.human { justify-content: flex-end; }
        .msg-bubble { max-width: 66%; padding: 10px 13px; border-radius: 13px; font-size: 13px; line-height: 1.5; font-family: 'Plus Jakarta Sans', sans-serif; }
        .msg-bubble.customer { background: ${t.msgCustomer || (darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)")}; color: ${t.text}; border-bottom-left-radius: 4px; }
        .msg-bubble.ai { background: ${accent}15; border: 1px solid ${accent}25; color: ${t.text}; border-bottom-right-radius: 4px; }
        .msg-bubble.human { background: rgba(124,58,237,0.12); border: 1px solid rgba(124,58,237,0.2); color: ${t.text}; border-bottom-right-radius: 4px; }
        .msg-meta { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
        .msg-time { font-size: 10px; color: ${t.textFaint}; }
        .msg-badge { font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 100px; }
        .msg-badge.ai { background: ${accent}20; color: ${accent}; }
        .msg-badge.human { background: rgba(124,58,237,0.15); color: #7c3aed; }
        .messages-area::-webkit-scrollbar { width: 3px; }
        .messages-area::-webkit-scrollbar-thumb { background: ${t.border}; }

        .chat-input-area { padding: 12px 18px; border-top: 1px solid ${t.border}; background: ${t.topbar}; }
        .ai-note { font-size: 11.5px; margin-bottom: 7px; display: flex; align-items: center; gap: 6px; padding: 6px 11px; border-radius: 7px; }
        .ai-note.active { color: ${accent}99; background: ${accent}0a; border: 1px solid ${accent}18; }
        .ai-note.paused { color: #7c3aed; background: rgba(124,58,237,0.06); border: 1px solid rgba(124,58,237,0.12); }
        .input-row { display: flex; gap: 9px; align-items: flex-end; }
        .msg-input { flex: 1; background: ${t.inputBg}; border: 1px solid ${t.cardBorder}; border-radius: 11px; padding: 10px 14px; font-size: 13px; color: ${t.text}; font-family: 'Plus Jakarta Sans', sans-serif; outline: none; resize: none; transition: border-color 0.15s; line-height: 1.4; }
        .msg-input:focus { border-color: ${accent}55; }
        .msg-input::placeholder { color: ${t.textFaint}; }
        .msg-input:disabled { opacity: 0.4; cursor: not-allowed; }
        .send-btn { width: 40px; height: 40px; border-radius: 10px; background: ${accent}; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; transition: all 0.15s; flex-shrink: 0; }
        .send-btn:hover { opacity: 0.85; transform: scale(1.05); }
        .send-btn:disabled { background: ${t.inputBg}; cursor: not-allowed; transform: none; }
      `}</style>

      <div className="conv-root">
        {/* LIST */}
        <div className="conv-list">
          <div className="conv-list-header">
            <div className="conv-list-title">
              Conversations
              <span className="conv-count">{conversations.length} total</span>
            </div>
            <div className="search-box">
              <span style={{color: t.textFaint, fontSize:13}}>⌕</span>
              <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="filter-tabs">
              {[
                { id: "all", label: "All" },
                { id: "needs-attention", label: "⚠ Attention" },
                { id: "ai", label: "AI" },
                { id: "booked", label: "Booked" },
              ].map(f => (
                <button key={f.id} className={`filter-tab${filter === f.id ? " active" : ""}`} onClick={() => setFilter(f.id)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="conv-items">
            {filteredConvs.map(c => (
              <div key={c.id} className={`conv-item${selected?.id === c.id ? " active" : ""}`} onClick={() => setSelected(c)}>
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
                    <span style={{overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{c.lastMsg}</span>
                    {c.unread > 0 && <span className="conv-unread">{c.unread}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHAT */}
        {selected && (
          <div className="chat-panel">
            <div className="chat-header">
              <div className="chat-header-left">
                <div className="chat-hdr-avatar">{selected.avatar}</div>
                <div>
                  <div className="chat-hdr-name">{selected.name}</div>
                  <div className="chat-hdr-num">{selected.number}</div>
                </div>
                <div className="status-pill" style={{background: getStatusColor(selected.status) + "15", border:`1px solid ${getStatusColor(selected.status)}30`, color: getStatusColor(selected.status)}}>
                  <span style={{width:5, height:5, borderRadius:"50%", background:"currentColor", display:"inline-block"}} />
                  {getStatusLabel(selected.status)}
                </div>
              </div>
              <div className="ai-toggle-wrap">
                <span className="ai-toggle-label">AI</span>
                <button className={`ai-toggle ${selected.aiOn ? "on" : "off"}`} onClick={() => toggleAI(selected.id)} />
                <span className={`ai-status ${selected.aiOn ? "on" : "off"}`}>{selected.aiOn ? "ON" : "OFF"}</span>
              </div>
            </div>

            {selected.status === "needs-attention" && (
              <div className="attention-banner">
                <span>⚠️</span>
                <span className="attention-text">AI couldn't answer this customer. They need a human response.</span>
                <button className="attention-btn" onClick={() => toggleAI(selected.id)}>Take Over →</button>
              </div>
            )}

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

            <div className="chat-input-area">
              <div className={`ai-note ${selected.aiOn ? "active" : "paused"}`}>
                {selected.aiOn ? "◈ AI is handling this conversation — toggle off to reply manually" : "◈ AI is paused — you are in control of this conversation"}
              </div>
              <div className="input-row">
                <textarea
                  className="msg-input" rows={1}
                  placeholder={selected.aiOn ? "AI is active — toggle off to type..." : "Type a message..."}
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  disabled={selected.aiOn}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() }}}
                />
                <button className="send-btn" onClick={sendMessage} disabled={selected.aiOn || !inputMsg.trim()}>➤</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
