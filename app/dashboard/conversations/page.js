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

const MOCK = [
  {
    id:1, name:"Priya Sharma", number:"+91 98765 43210", lastMsg:"Can I book a haircut for tomorrow?",
    time:"2m ago", unread:2, aiOn:true, status:"ai", avatar:"P",
    messages:[
      {id:1, from:"customer", text:"Hi! What services do you offer?", time:"10:01 AM"},
      {id:2, from:"ai", text:"Hello Priya! We offer haircuts, colouring, facials, and bridal packages. Would you like to book an appointment? 😊", time:"10:01 AM"},
      {id:3, from:"customer", text:"Can I book a haircut for tomorrow?", time:"10:03 AM"},
      {id:4, from:"ai", text:"Of course! We have slots at 10 AM, 2 PM, and 5 PM tomorrow. Which works best for you?", time:"10:03 AM"},
    ]
  },
  {
    id:2, name:"Rahul Mehta", number:"+91 87654 32109", lastMsg:"Is the facial worth it?",
    time:"15m ago", unread:1, aiOn:false, status:"needs-attention", avatar:"R",
    messages:[
      {id:1, from:"customer", text:"Hello, I want to know about facials", time:"9:45 AM"},
      {id:2, from:"ai", text:"Hi Rahul! Our gold facial is ₹1,500 for 60 minutes, great for glowing skin. Our hydra facial is ₹2,200 for deep cleansing.", time:"9:45 AM"},
      {id:3, from:"customer", text:"Is the facial worth it?", time:"9:50 AM"},
    ]
  },
  {
    id:3, name:"Sneha Patel", number:"+91 76543 21098", lastMsg:"See you at 3 PM!",
    time:"1h ago", unread:0, aiOn:true, status:"booked", avatar:"S",
    messages:[
      {id:1, from:"customer", text:"Hi, want to book bridal package", time:"8:30 AM"},
      {id:2, from:"ai", text:"Congratulations! 🎊 Our bridal package is ₹8,500 including makeup, hair, and facial. When is the event?", time:"8:30 AM"},
      {id:3, from:"customer", text:"This Sunday at 5 PM", time:"8:32 AM"},
      {id:4, from:"ai", text:"Perfect! I've booked you for Sunday at 3 PM so we have time to prepare. Confirmation sent! ✅", time:"8:32 AM"},
      {id:5, from:"customer", text:"See you at 3 PM!", time:"8:33 AM"},
    ]
  },
  {
    id:4, name:"Anjali Gupta", number:"+91 65432 10987", lastMsg:"What are your prices?",
    time:"2h ago", unread:0, aiOn:true, status:"ai", avatar:"A",
    messages:[
      {id:1, from:"customer", text:"What are your prices?", time:"7:15 AM"},
      {id:2, from:"ai", text:"Hi Anjali! Haircut starts at ₹300, colouring from ₹800, facials from ₹1,000. Want to see the full menu?", time:"7:15 AM"},
    ]
  },
  {
    id:5, name:"Kavita Nair", number:"+91 54321 09876", lastMsg:"Thanks for the reminder",
    time:"3h ago", unread:0, aiOn:false, status:"human", avatar:"K",
    messages:[
      {id:1, from:"human", text:"Hi Kavita! Just a reminder you have an appointment at 4 PM today.", time:"6:00 AM"},
      {id:2, from:"customer", text:"Thanks for the reminder", time:"6:05 AM"},
    ]
  },
]

export default function Conversations() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [dark, setDark] = useState(true)
  const [selected, setSelected] = useState(MOCK[0])
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [msgInput, setMsgInput] = useState("")
  const [convos, setConvos] = useState(MOCK)

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login")
      else setUserEmail(data.user.email || "")
    })
  }, [])

  const toggleTheme = () => {
    const n = !dark; setDark(n)
    localStorage.setItem("fastrill-theme", n ? "dark" : "light")
  }

  const handleLogout = async () => {
    await supabase.auth.signOut(); router.push("/login")
  }

  const toggleAI = (id) => {
    setConvos(prev => prev.map(c => c.id===id ? {...c, aiOn:!c.aiOn} : c))
    if (selected.id===id) setSelected(prev => ({...prev, aiOn:!prev.aiOn}))
  }

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
  const accentDim = dark ? "rgba(0,208,132,0.12)" : "rgba(0,147,90,0.1)"
  const userInitial = userEmail ? userEmail[0].toUpperCase() : "G"

  const statusColor = { ai: accent, "needs-attention": "#f59e0b", booked: "#a78bfa", human: "#38bdf8" }
  const statusLabel = { ai: "AI Active", "needs-attention": "Needs Attention", booked: "Booked", human: "Human" }

  const filtered = convos.filter(c => {
    const matchFilter = filter==="all" || c.status===filter || (filter==="ai" && c.aiOn)
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.lastMsg.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const sendMsg = () => {
    if (!msgInput.trim()) return
    const newMsg = {id: Date.now(), from:"human", text: msgInput.trim(), time: new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}
    setSelected(prev => ({...prev, messages:[...prev.messages, newMsg]}))
    setConvos(prev => prev.map(c => c.id===selected.id ? {...c, messages:[...c.messages, newMsg], lastMsg: msgInput.trim()} : c))
    setMsgInput("")
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: ${bg} !important; color: ${text} !important; font-family: 'DM Sans', sans-serif !important; }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: ${border}; border-radius: 10px; }

        .wrap { display: flex; height: 100vh; overflow: hidden; background: ${bg}; }
        .sb { width: 220px; flex-shrink: 0; background: ${sidebar}; border-right: 1px solid ${border}; display: flex; flex-direction: column; overflow-y: auto; }
        .sb-logo { padding: 20px 18px 16px; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 19px; color: ${text}; border-bottom: 1px solid ${border}; display: block; text-decoration: none; }
        .sb-logo span { color: ${accent}; }
        .sb-section { padding: 18px 16px 6px; font-size: 9.5px; letter-spacing: 1.4px; text-transform: uppercase; color: ${textFaint}; font-weight: 600; }
        .sb-nav { padding: 3px 8px; }
        .nav-btn { display: flex; align-items: center; gap: 9px; width: 100%; padding: 8px 10px; border-radius: 8px; border: 1px solid transparent; background: transparent; color: ${textMuted}; font-size: 13.5px; font-weight: 500; cursor: pointer; text-align: left; font-family: 'DM Sans', sans-serif; transition: all 0.12s; margin-bottom: 1px; }
        .nav-btn:hover { background: ${inputBg}; color: ${text}; }
        .nav-btn.active { background: ${accentDim}; border-color: ${accent}33; color: ${accent}; font-weight: 600; }
        .nav-icon { font-size: 12px; width: 16px; text-align: center; flex-shrink: 0; }
        .sb-foot { margin-top: auto; padding: 12px; border-top: 1px solid ${border}; }
        .user-row { display: flex; align-items: center; gap: 8px; padding: 8px 9px; background: ${inputBg}; border: 1px solid ${cardBorder}; border-radius: 9px; margin-bottom: 8px; }
        .user-av { width: 28px; height: 28px; border-radius: 7px; background: linear-gradient(135deg, ${accent}, #38bdf8); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; color: #fff; flex-shrink: 0; }
        .user-em { font-size: 11px; color: ${textMuted}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .logout { width: 100%; padding: 7px; background: transparent; border: 1px solid ${cardBorder}; border-radius: 7px; font-size: 11.5px; color: ${textMuted}; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.12s; }
        .logout:hover { border-color: #fca5a5; color: #ef4444; }

        .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
        .topbar { height: 52px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 22px; background: ${sidebar}; border-bottom: 1px solid ${border}; }
        .tb-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; color: ${text}; }
        .topbar-r { display: flex; align-items: center; gap: 8px; }
        .theme-toggle { display: flex; align-items: center; gap: 6px; padding: 5px 10px; background: ${inputBg}; border: 1px solid ${cardBorder}; border-radius: 8px; cursor: pointer; font-size: 11.5px; color: ${textMuted}; font-family: 'DM Sans', sans-serif; }
        .toggle-pill { width: 30px; height: 16px; border-radius: 100px; background: ${dark ? accent : "#d1d5db"}; position: relative; flex-shrink: 0; transition: background 0.2s; }
        .toggle-pill::after { content: ''; position: absolute; top: 2px; width: 12px; height: 12px; border-radius: 50%; background: #fff; transition: left 0.2s; left: ${dark ? "16px" : "2px"}; }

        .inbox-wrap { flex: 1; display: flex; overflow: hidden; }

        /* Convo list */
        .clist { width: 300px; flex-shrink: 0; border-right: 1px solid ${border}; display: flex; flex-direction: column; background: ${sidebar}; }
        .clist-top { padding: 12px; border-bottom: 1px solid ${border}; }
        .search-box { display: flex; align-items: center; gap: 7px; background: ${inputBg}; border: 1px solid ${cardBorder}; border-radius: 8px; padding: 7px 10px; margin-bottom: 9px; }
        .search-box input { flex: 1; background: transparent; border: none; outline: none; font-size: 12.5px; color: ${text}; font-family: 'DM Sans', sans-serif; }
        .search-box input::placeholder { color: ${textFaint}; }
        .filters { display: flex; gap: 4px; flex-wrap: wrap; }
        .filter-btn { padding: 3px 9px; border-radius: 100px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid ${cardBorder}; background: transparent; color: ${textMuted}; font-family: 'DM Sans', sans-serif; transition: all 0.12s; }
        .filter-btn.active { background: ${accentDim}; border-color: ${accent}44; color: ${accent}; }
        .clist-items { flex: 1; overflow-y: auto; }
        .c-item { padding: 11px 14px; border-bottom: 1px solid ${border}; cursor: pointer; transition: background 0.1s; }
        .c-item:hover { background: ${inputBg}; }
        .c-item.sel { background: ${accentDim}; border-left: 2px solid ${accent}; }
        .c-top { display: flex; align-items: center; gap: 9px; margin-bottom: 4px; }
        .c-av { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #fff; flex-shrink: 0; }
        .c-info { flex: 1; min-width: 0; }
        .c-name { font-weight: 600; font-size: 13px; color: ${text}; display: flex; align-items: center; justify-content: space-between; }
        .c-time { font-size: 10.5px; color: ${textFaint}; font-weight: 400; }
        .c-msg { font-size: 12px; color: ${textMuted}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .c-badges { display: flex; align-items: center; gap: 5px; margin-top: 4px; }
        .status-pill { display: inline-flex; align-items: center; gap: 3px; padding: 2px 7px; border-radius: 100px; font-size: 9.5px; font-weight: 700; border: 1px solid; }
        .unread-dot { background: ${accent}; color: #fff; font-size: 9px; font-weight: 700; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }

        /* Chat area */
        .chat-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .chat-head { padding: 14px 18px; border-bottom: 1px solid ${border}; display: flex; align-items: center; justify-content: space-between; background: ${card}; flex-shrink: 0; }
        .chat-head-l { display: flex; align-items: center; gap: 11px; }
        .ch-av { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #fff; }
        .ch-name { font-weight: 700; font-size: 14px; color: ${text}; }
        .ch-num { font-size: 11px; color: ${textMuted}; }
        .chat-head-r { display: flex; align-items: center; gap: 10px; }
        .ai-toggle-wrap { display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 600; color: ${textMuted}; }
        .ai-toggle { width: 36px; height: 20px; border-radius: 100px; position: relative; cursor: pointer; transition: background 0.2s; border: none; flex-shrink: 0; }
        .ai-toggle::after { content:''; position:absolute; top:2px; width:16px; height:16px; border-radius:50%; background:#fff; transition:left 0.2s; }

        .chat-msgs { flex: 1; overflow-y: auto; padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; background: ${bg}; }
        .msg-row { display: flex; }
        .msg-row.customer { justify-content: flex-start; }
        .msg-row.ai, .msg-row.human { justify-content: flex-end; }
        .msg-bubble { max-width: 65%; padding: 9px 13px; border-radius: 12px; font-size: 13px; line-height: 1.5; }
        .msg-bubble.customer { background: ${card}; border: 1px solid ${cardBorder}; color: ${text}; border-radius: 4px 12px 12px 12px; }
        .msg-bubble.ai { background: ${accent}22; border: 1px solid ${accent}44; color: ${text}; border-radius: 12px 4px 12px 12px; }
        .msg-bubble.human { background: rgba(167,139,250,0.15); border: 1px solid rgba(167,139,250,0.3); color: ${text}; border-radius: 12px 4px 12px 12px; }
        .msg-time { font-size: 10px; color: ${textFaint}; margin-top: 3px; }
        .msg-from { font-size: 9.5px; font-weight: 700; margin-bottom: 2px; letter-spacing: 0.5px; }

        .attention-banner { margin: 10px 18px 0; padding: 10px 14px; background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.25); border-radius: 9px; font-size: 12px; color: #f59e0b; display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

        .chat-input { padding: 12px 18px; border-top: 1px solid ${border}; background: ${card}; display: flex; gap: 9px; align-items: center; flex-shrink: 0; }
        .msg-field { flex: 1; background: ${inputBg}; border: 1px solid ${cardBorder}; border-radius: 9px; padding: 9px 13px; font-size: 13px; color: ${text}; font-family: 'DM Sans', sans-serif; outline: none; }
        .msg-field::placeholder { color: ${textFaint}; }
        .msg-field:disabled { opacity: 0.4; cursor: not-allowed; }
        .send-btn { background: ${accent}; color: #fff; border: none; border-radius: 9px; padding: 9px 16px; font-weight: 700; font-size: 13px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: opacity 0.12s; flex-shrink: 0; }
        .send-btn:hover { opacity: 0.85; }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .ai-note { font-size: 11px; color: ${textFaint}; text-align: center; flex: 1; }
      `}</style>

      <div className="wrap">
        <aside className="sb">
          <a href="/dashboard" className="sb-logo">fast<span>rill</span></a>
          <div className="sb-section">Platform</div>
          <div className="sb-nav">
            {NAV.map(item => (
              <button key={item.id} className={`nav-btn${item.id==="inbox"?" active":""}`} onClick={() => router.push(item.path)}>
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          <div className="sb-foot">
            <div className="user-row">
              <div className="user-av">{userInitial}</div>
              <div className="user-em">{userEmail || "Loading..."}</div>
            </div>
            <button className="logout" onClick={handleLogout}>↩ Sign out</button>
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
                  {["all","ai","needs-attention","booked","human"].map(f => (
                    <button key={f} className={`filter-btn${filter===f?" active":""}`} onClick={()=>setFilter(f)}>
                      {f==="all"?"All":f==="needs-attention"?"Attention":f.charAt(0).toUpperCase()+f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="clist-items">
                {filtered.map(c => (
                  <div key={c.id} className={`c-item${selected.id===c.id?" sel":""}`} onClick={()=>setSelected(c)}>
                    <div className="c-top">
                      <div className="c-av" style={{background:`linear-gradient(135deg, ${statusColor[c.status]}88, ${statusColor[c.status]}44)`}}>
                        {c.avatar}
                      </div>
                      <div className="c-info">
                        <div className="c-name">
                          <span>{c.name}</span>
                          <span className="c-time">{c.time}</span>
                        </div>
                        <div className="c-msg">{c.lastMsg}</div>
                      </div>
                    </div>
                    <div className="c-badges">
                      <span className="status-pill" style={{color:statusColor[c.status],borderColor:statusColor[c.status]+"44",background:statusColor[c.status]+"12"}}>
                        ● {statusLabel[c.status]}
                      </span>
                      {c.unread > 0 && <span className="unread-dot">{c.unread}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat */}
            <div className="chat-area">
              <div className="chat-head">
                <div className="chat-head-l">
                  <div className="ch-av" style={{background:`linear-gradient(135deg, ${statusColor[selected.status]}88, ${statusColor[selected.status]}44)`}}>
                    {selected.avatar}
                  </div>
                  <div>
                    <div className="ch-name">{selected.name}</div>
                    <div className="ch-num">{selected.number}</div>
                  </div>
                </div>
                <div className="chat-head-r">
                  <div className="ai-toggle-wrap">
                    <span>AI</span>
                    <button
                      className="ai-toggle"
                      style={{background: selected.aiOn ? accent : (dark?"rgba(255,255,255,0.12)":"#d1d5db")}}
                      onClick={()=>toggleAI(selected.id)}
                    >
                      <span style={{position:"absolute",top:"2px",width:"16px",height:"16px",borderRadius:"50%",background:"#fff",transition:"left 0.2s",left:selected.aiOn?"18px":"2px",display:"block"}}/>
                    </button>
                    <span style={{color:selected.aiOn?accent:textFaint}}>{selected.aiOn?"ON":"OFF"}</span>
                  </div>
                </div>
              </div>

              {selected.status==="needs-attention" && (
                <div className="attention-banner">
                  ⚠️ AI needs human help — this customer may need a personal response
                </div>
              )}

              <div className="chat-msgs">
                {selected.messages.map(m => (
                  <div key={m.id} className={`msg-row ${m.from}`}>
                    <div>
                      <div className="msg-from" style={{color: m.from==="customer" ? textFaint : m.from==="ai" ? accent : "#a78bfa", textAlign: m.from==="customer"?"left":"right"}}>
                        {m.from==="customer" ? selected.name : m.from==="ai" ? "◈ AI" : "👤 You"}
                      </div>
                      <div className={`msg-bubble ${m.from}`}>{m.text}</div>
                      <div className="msg-time" style={{textAlign:m.from==="customer"?"left":"right"}}>{m.time}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="chat-input">
                {selected.aiOn ? (
                  <div className="ai-note">◈ AI is handling this conversation — turn off AI to send a manual message</div>
                ) : (
                  <>
                    <input className="msg-field" placeholder="Type a message..." value={msgInput} onChange={e=>setMsgInput(e.target.value)}
                      onKeyDown={e=>e.key==="Enter"&&sendMsg()}/>
                    <button className="send-btn" onClick={sendMsg}>Send</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
