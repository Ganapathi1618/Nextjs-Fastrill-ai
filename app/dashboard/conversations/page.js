"use client"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const NAV = [
  { id:"overview", label:"Revenue Engine", icon:"◈", path:"/dashboard" },
  { id:"inbox", label:"Conversations", icon:"◎", path:"/dashboard/conversations" },
  { id:"bookings", label:"Bookings", icon:"◷", path:"/dashboard/bookings" },
  { id:"campaigns", label:"Campaigns", icon:"◆", path:"/dashboard/campaigns" },
  { id:"leads", label:"Lead Recovery", icon:"◉", path:"/dashboard/leads" },
  { id:"contacts", label:"Customers", icon:"◑", path:"/dashboard/contacts" },
  { id:"analytics", label:"Analytics", icon:"◫", path:"/dashboard/analytics" },
  { id:"settings", label:"Settings", icon:"◌", path:"/dashboard/settings" },
]

const MOCK = [
  { id:1, name:"Priya Sharma", number:"+91 98765 43210", lastMsg:"Can I book a haircut for tomorrow?", time:"2m ago", unread:2, aiOn:true, status:"ai", avatar:"P",
    messages:[
      {id:1,text:"Hi! What services do you offer?",from:"customer",time:"10:01 AM"},
      {id:2,text:"Hi Priya! 👋 Welcome to Glamour Studio! We offer haircuts, hair colour, facials, waxing, and much more. What are you looking for today? ✨",from:"ai",time:"10:01 AM"},
      {id:3,text:"What's the price for a women's haircut?",from:"customer",time:"10:03 AM"},
      {id:4,text:"Women's haircut starts at ₹350 💇‍♀️ We also have styling packages from ₹600. Would you like to book an appointment?",from:"ai",time:"10:03 AM"},
      {id:5,text:"Can I book a haircut for tomorrow?",from:"customer",time:"10:05 AM"},
    ]},
  { id:2, name:"Rahul Verma", number:"+91 87654 32109", lastMsg:"Our team will get back to you shortly 🙌", time:"15m ago", unread:0, aiOn:true, status:"needs-attention", avatar:"R",
    messages:[
      {id:1,text:"Do you have any offers this week?",from:"customer",time:"9:45 AM"},
      {id:2,text:"Thanks for reaching out! Our team will get back to you shortly 🙌",from:"ai",time:"9:45 AM"},
    ]},
  { id:3, name:"Sneha Patel", number:"+91 76543 21098", lastMsg:"Okay thank you!", time:"1h ago", unread:0, aiOn:false, status:"human", avatar:"S",
    messages:[
      {id:1,text:"I want to speak to someone",from:"customer",time:"8:30 AM"},
      {id:2,text:"Sure! Our team will reach out shortly 🙌",from:"ai",time:"8:30 AM"},
      {id:3,text:"Hi Sneha, this is Ananya. How can I help?",from:"human",time:"8:35 AM"},
      {id:4,text:"Okay thank you!",from:"customer",time:"8:40 AM"},
    ]},
  { id:4, name:"Kiran Reddy", number:"+91 65432 10987", lastMsg:"What time are you open on Sunday?", time:"2h ago", unread:1, aiOn:true, status:"ai", avatar:"K",
    messages:[{id:1,text:"What time are you open on Sunday?",from:"customer",time:"7:15 AM"}]},
  { id:5, name:"Meera Nair", number:"+91 54321 09876", lastMsg:"Appointment confirmed ✅", time:"3h ago", unread:0, aiOn:true, status:"booked", avatar:"M",
    messages:[
      {id:1,text:"I want to book a facial",from:"customer",time:"6:00 AM"},
      {id:2,text:"Great choice! 💆‍♀️ Facial starts at ₹600. What date works for you?",from:"ai",time:"6:00 AM"},
      {id:3,text:"Tomorrow at 11am",from:"customer",time:"6:02 AM"},
      {id:4,text:"Appointment confirmed ✅ Tomorrow, 11:00 AM — Facial (₹600). See you at Glamour Studio! 🌟",from:"ai",time:"6:02 AM"},
    ]},
]

export default function ConversationsPage() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [dark, setDark] = useState(true)
  const [convs, setConvs] = useState(MOCK)
  const [selected, setSelected] = useState(MOCK[0])
  const [inputMsg, setInputMsg] = useState("")
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const endRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) router.push("/login")
      else setUserEmail(data.user.email || "")
    }
    init()
  }, [])

  useEffect(() => { endRef.current?.scrollIntoView({behavior:"smooth"}) }, [selected])

  const toggleTheme = () => { const n = !dark; setDark(n); localStorage.setItem("fastrill-theme", n?"dark":"light") }
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login") }

  const toggleAI = (id) => {
    setConvs(p => p.map(c => c.id===id ? {...c, aiOn:!c.aiOn, status:c.aiOn?"human":"ai"} : c))
    if (selected?.id===id) setSelected(p => ({...p, aiOn:!p.aiOn, status:p.aiOn?"human":"ai"}))
  }

  const sendMsg = () => {
    if (!inputMsg.trim() || !selected) return
    const msg = {id:Date.now(), text:inputMsg, from:"human", time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
    setConvs(p => p.map(c => c.id===selected.id ? {...c, messages:[...c.messages,msg], lastMsg:inputMsg, time:"now"} : c))
    setSelected(p => ({...p, messages:[...p.messages,msg]}))
    setInputMsg("")
  }

  const filtered = convs.filter(c => {
    const ms = c.name.toLowerCase().includes(search.toLowerCase()) || c.number.includes(search)
    const mf = filter==="all" || c.status===filter
    return ms && mf
  })

  const statusColor = (s) => ({ai:"#00c47d","needs-attention":"#f59e0b",booked:"#0ea5e9",human:"#7c3aed"}[s]||"#6b7280")
  const statusLabel = (s) => ({ai:"AI Active","needs-attention":"Needs Attention",booked:"Booked ✓",human:"Human"}[s]||s)

  const t = dark ? {
    bg:"#0a0a0f",sidebar:"#0f0f17",border:"rgba(255,255,255,0.06)",card:"#0f0f17",
    cardBorder:"rgba(255,255,255,0.07)",text:"#e8e8f0",textMuted:"rgba(255,255,255,0.4)",
    textFaint:"rgba(255,255,255,0.2)",navActive:"rgba(0,196,125,0.1)",
    navActiveBorder:"rgba(0,196,125,0.2)",navActiveText:"#00c47d",
    navText:"rgba(255,255,255,0.45)",inputBg:"rgba(255,255,255,0.04)",
    msgCust:"rgba(255,255,255,0.07)",
  } : {
    bg:"#f4f5f7",sidebar:"#ffffff",border:"rgba(0,0,0,0.07)",card:"#ffffff",
    cardBorder:"rgba(0,0,0,0.08)",text:"#111827",textMuted:"rgba(0,0,0,0.45)",
    textFaint:"rgba(0,0,0,0.25)",navActive:"rgba(0,180,115,0.08)",
    navActiveBorder:"rgba(0,180,115,0.2)",navActiveText:"#00935a",
    navText:"rgba(0,0,0,0.45)",inputBg:"rgba(0,0,0,0.03)",
    msgCust:"rgba(0,0,0,0.06)",
  }
  const accent = dark ? "#00c47d" : "#00935a"
  const userInitial = userEmail ? userEmail[0].toUpperCase() : "G"

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${t.bg}!important;color:${t.text}!important;font-family:'Plus Jakarta Sans',sans-serif!important;}
        .root{display:flex;height:100vh;overflow:hidden;background:${t.bg};}
        .sidebar{width:224px;flex-shrink:0;background:${t.sidebar};border-right:1px solid ${t.border};display:flex;flex-direction:column;overflow-y:auto;}
        .logo{padding:22px 20px 18px;font-weight:800;font-size:20px;color:${t.text};text-decoration:none;display:block;border-bottom:1px solid ${t.border};font-family:'Plus Jakarta Sans',sans-serif;}
        .logo span{color:${accent};}
        .nav-section{padding:18px 16px 7px;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${t.textFaint};font-weight:600;}
        .nav-item{display:flex;align-items:center;gap:9px;padding:9px 12px;margin:1px 8px;border-radius:8px;cursor:pointer;font-size:13.5px;color:${t.navText};font-weight:500;transition:all 0.13s;border:1px solid transparent;background:none;width:calc(100% - 16px);text-align:left;font-family:'Plus Jakarta Sans',sans-serif;}
        .nav-item:hover{background:${t.inputBg};color:${t.text};}
        .nav-item.active{background:${t.navActive};color:${t.navActiveText};font-weight:600;border-color:${t.navActiveBorder};}
        .nav-icon{font-size:13px;width:18px;text-align:center;flex-shrink:0;}
        .sidebar-footer{margin-top:auto;padding:14px;border-top:1px solid ${t.border};}
        .user-card{display:flex;align-items:center;gap:9px;padding:9px;border-radius:9px;background:${t.inputBg};border:1px solid ${t.cardBorder};}
        .user-avatar{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,${accent},#0ea5e9);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#fff;flex-shrink:0;}
        .user-email{font-size:11.5px;color:${t.textMuted};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .logout-btn{margin-top:7px;width:100%;padding:7px;border-radius:7px;background:transparent;border:1px solid ${t.cardBorder};font-size:12px;color:${t.textMuted};cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.12s;}
        .logout-btn:hover{border-color:#fca5a5;color:#ef4444;}
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .topbar{height:54px;flex-shrink:0;border-bottom:1px solid ${t.border};display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:${t.sidebar};}
        .topbar-title{font-weight:700;font-size:15px;color:${t.text};}
        .topbar-right{display:flex;align-items:center;gap:10px;}
        .theme-btn{display:flex;align-items:center;gap:7px;padding:5px 11px;border-radius:8px;background:${t.inputBg};border:1px solid ${t.cardBorder};cursor:pointer;font-size:12px;color:${t.textMuted};font-family:'Plus Jakarta Sans',sans-serif;font-weight:500;}
        .pill{width:32px;height:18px;border-radius:100px;background:${dark?accent:"#d1d5db"};position:relative;transition:background 0.2s;flex-shrink:0;}
        .pill::after{content:'';position:absolute;top:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:left 0.2s;left:${dark?"16px":"2px"};}
        .body{display:flex;flex:1;overflow:hidden;}
        .conv-list{width:310px;flex-shrink:0;border-right:1px solid ${t.border};display:flex;flex-direction:column;background:${t.sidebar};}
        .list-hdr{padding:14px;border-bottom:1px solid ${t.border};}
        .list-title{font-weight:700;font-size:13px;color:${t.text};margin-bottom:9px;display:flex;align-items:center;justify-content:space-between;}
        .list-count{font-size:11px;color:${t.textMuted};font-weight:400;}
        .search{display:flex;align-items:center;gap:8px;background:${t.inputBg};border:1px solid ${t.cardBorder};border-radius:9px;padding:8px 11px;margin-bottom:9px;}
        .search input{background:none;border:none;outline:none;font-size:12.5px;color:${t.text};font-family:'Plus Jakarta Sans',sans-serif;flex:1;}
        .search input::placeholder{color:${t.textFaint};}
        .filters{display:flex;gap:4px;}
        .ftab{padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid ${t.cardBorder};background:transparent;color:${t.textMuted};transition:all 0.12s;font-family:'Plus Jakarta Sans',sans-serif;}
        .ftab.active{background:${accent}15;border-color:${accent}40;color:${accent};}
        .conv-items{flex:1;overflow-y:auto;}
        .conv-items::-webkit-scrollbar{width:3px;}
        .conv-item{display:flex;align-items:center;gap:11px;padding:12px 14px;cursor:pointer;border-bottom:1px solid ${t.border};transition:background 0.12s;}
        .conv-item:hover{background:${t.inputBg};}
        .conv-item.active{background:${accent}0d;border-left:2px solid ${accent};}
        .cavatar{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,${accent}40,#0ea5e940);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:${t.text};flex-shrink:0;position:relative;}
        .cdot{position:absolute;bottom:-2px;right:-2px;width:10px;height:10px;border-radius:50%;border:2px solid ${t.sidebar};}
        .cinfo{flex:1;min-width:0;}
        .cname{font-size:13px;font-weight:600;color:${t.text};margin-bottom:2px;display:flex;align-items:center;justify-content:space-between;}
        .ctime{font-size:10px;color:${t.textFaint};font-weight:400;}
        .cpreview{font-size:11.5px;color:${t.textMuted};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:flex;align-items:center;justify-content:space-between;gap:6px;}
        .cunread{background:${accent};color:#000;font-size:10px;font-weight:700;padding:1px 6px;border-radius:100px;flex-shrink:0;}
        .chat{flex:1;display:flex;flex-direction:column;background:${t.bg};}
        .chat-hdr{padding:13px 18px;border-bottom:1px solid ${t.border};background:${t.sidebar};display:flex;align-items:center;justify-content:space-between;}
        .chat-hdr-left{display:flex;align-items:center;gap:11px;}
        .chat-av{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,${accent}40,#0ea5e940);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:${t.text};}
        .chat-name{font-weight:700;font-size:13.5px;color:${t.text};}
        .chat-num{font-size:11px;color:${t.textMuted};}
        .spill{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:100px;font-size:11px;font-weight:600;}
        .ai-wrap{display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:9px;background:${t.inputBg};border:1px solid ${t.cardBorder};}
        .ai-lbl{font-size:12px;font-weight:600;color:${t.textMuted};}
        .ai-tog{width:38px;height:20px;border-radius:100px;border:none;cursor:pointer;position:relative;flex-shrink:0;transition:background 0.2s;}
        .ai-tog.on{background:${accent};}
        .ai-tog.off{background:${dark?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.12)"};}
        .ai-tog::after{content:'';position:absolute;top:3px;width:14px;height:14px;border-radius:50%;background:#fff;transition:left 0.2s;}
        .ai-tog.on::after{left:21px;}
        .ai-tog.off::after{left:3px;}
        .ai-st{font-size:11px;font-weight:700;}
        .ai-st.on{color:${accent};}
        .ai-st.off{color:${t.textMuted};}
        .att-banner{margin:10px 16px 0;padding:9px 13px;border-radius:9px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);display:flex;align-items:center;gap:9px;}
        .att-text{font-size:12px;color:#f59e0b;font-weight:500;flex:1;}
        .att-btn{padding:4px 11px;border-radius:7px;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.25);color:#f59e0b;font-size:11.5px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;white-space:nowrap;}
        .msgs{flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:10px;}
        .msgs::-webkit-scrollbar{width:3px;}
        .mrow{display:flex;}
        .mrow.customer{justify-content:flex-start;}
        .mrow.ai,.mrow.human{justify-content:flex-end;}
        .mbubble{max-width:66%;padding:10px 13px;border-radius:13px;font-size:13px;line-height:1.5;}
        .mbubble.customer{background:${t.msgCust};color:${t.text};border-bottom-left-radius:4px;}
        .mbubble.ai{background:${accent}15;border:1px solid ${accent}25;color:${t.text};border-bottom-right-radius:4px;}
        .mbubble.human{background:rgba(124,58,237,0.12);border:1px solid rgba(124,58,237,0.2);color:${t.text};border-bottom-right-radius:4px;}
        .mmeta{display:flex;align-items:center;gap:6px;margin-top:4px;}
        .mtime{font-size:10px;color:${t.textFaint};}
        .mbadge{font-size:9px;font-weight:700;padding:1px 6px;border-radius:100px;}
        .mbadge.ai{background:${accent}20;color:${accent};}
        .mbadge.human{background:rgba(124,58,237,0.15);color:#7c3aed;}
        .input-area{padding:12px 18px;border-top:1px solid ${t.border};background:${t.sidebar};}
        .ai-note{font-size:11.5px;margin-bottom:7px;display:flex;align-items:center;gap:6px;padding:6px 11px;border-radius:7px;}
        .ai-note.active{color:${accent}99;background:${accent}0a;border:1px solid ${accent}18;}
        .ai-note.paused{color:#7c3aed;background:rgba(124,58,237,0.06);border:1px solid rgba(124,58,237,0.12);}
        .irow{display:flex;gap:9px;align-items:flex-end;}
        .minput{flex:1;background:${t.inputBg};border:1px solid ${t.cardBorder};border-radius:11px;padding:10px 14px;font-size:13px;color:${t.text};font-family:'Plus Jakarta Sans',sans-serif;outline:none;resize:none;transition:border-color 0.15s;line-height:1.4;}
        .minput:focus{border-color:${accent}55;}
        .minput::placeholder{color:${t.textFaint};}
        .minput:disabled{opacity:0.4;cursor:not-allowed;}
        .send-btn{width:40px;height:40px;border-radius:10px;background:${accent};border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;transition:all 0.15s;flex-shrink:0;}
        .send-btn:disabled{background:${t.inputBg};cursor:not-allowed;}
        @media(max-width:768px){.sidebar{display:none;}}
      `}</style>

      <div className="root">
        <aside className="sidebar">
          <a href="/dashboard" className="logo">fast<span>rill</span></a>
          <div className="nav-section">Platform</div>
          {NAV.map(item => (
            <button key={item.id} className={`nav-item${item.id==="inbox"?" active":""}`} onClick={() => router.push(item.path)}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
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
            <div className="topbar-title">Conversations</div>
            <div className="topbar-right">
              <button className="theme-btn" onClick={toggleTheme}>
                <span>{dark?"🌙":"☀️"}</span><div className="pill"/><span>{dark?"Dark":"Light"}</span>
              </button>
            </div>
          </div>

          <div className="body">
            <div className="conv-list">
              <div className="list-hdr">
                <div className="list-title">Conversations <span className="list-count">{convs.length} total</span></div>
                <div className="search">
                  <span style={{color:t.textFaint,fontSize:13}}>⌕</span>
                  <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/>
                </div>
                <div className="filters">
                  {[{id:"all",label:"All"},{id:"needs-attention",label:"⚠ Attention"},{id:"ai",label:"AI"},{id:"booked",label:"Booked"}].map(f => (
                    <button key={f.id} className={`ftab${filter===f.id?" active":""}`} onClick={()=>setFilter(f.id)}>{f.label}</button>
                  ))}
                </div>
              </div>
              <div className="conv-items">
                {filtered.map(c => (
                  <div key={c.id} className={`conv-item${selected?.id===c.id?" active":""}`} onClick={()=>setSelected(c)}>
                    <div className="cavatar">{c.avatar}<div className="cdot" style={{background:statusColor(c.status)}}/></div>
                    <div className="cinfo">
                      <div className="cname">{c.name}<span className="ctime">{c.time}</span></div>
                      <div className="cpreview">
                        <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.lastMsg}</span>
                        {c.unread>0 && <span className="cunread">{c.unread}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selected && (
              <div className="chat">
                <div className="chat-hdr">
                  <div className="chat-hdr-left">
                    <div className="chat-av">{selected.avatar}</div>
                    <div><div className="chat-name">{selected.name}</div><div className="chat-num">{selected.number}</div></div>
                    <div className="spill" style={{background:statusColor(selected.status)+"15",border:`1px solid ${statusColor(selected.status)}30`,color:statusColor(selected.status)}}>
                      <span style={{width:5,height:5,borderRadius:"50%",background:"currentColor",display:"inline-block"}}/>
                      {statusLabel(selected.status)}
                    </div>
                  </div>
                  <div className="ai-wrap">
                    <span className="ai-lbl">AI</span>
                    <button className={`ai-tog ${selected.aiOn?"on":"off"}`} onClick={()=>toggleAI(selected.id)}/>
                    <span className={`ai-st ${selected.aiOn?"on":"off"}`}>{selected.aiOn?"ON":"OFF"}</span>
                  </div>
                </div>

                {selected.status==="needs-attention" && (
                  <div className="att-banner">
                    <span>⚠️</span>
                    <span className="att-text">AI couldn't answer this customer. They need a human response.</span>
                    <button className="att-btn" onClick={()=>toggleAI(selected.id)}>Take Over →</button>
                  </div>
                )}

                <div className="msgs">
                  {selected.messages.map(msg => (
                    <div key={msg.id} className={`mrow ${msg.from}`}>
                      <div className={`mbubble ${msg.from}`}>
                        {msg.text}
                        <div className="mmeta">
                          <span className="mtime">{msg.time}</span>
                          {msg.from==="ai" && <span className="mbadge ai">AI</span>}
                          {msg.from==="human" && <span className="mbadge human">You</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={endRef}/>
                </div>

                <div className="input-area">
                  <div className={`ai-note ${selected.aiOn?"active":"paused"}`}>
                    {selected.aiOn?"◈ AI is handling this conversation — toggle off to reply manually":"◈ AI is paused — you are in control"}
                  </div>
                  <div className="irow">
                    <textarea className="minput" rows={1}
                      placeholder={selected.aiOn?"AI is active — toggle off to type...":"Type a message..."}
                      value={inputMsg} onChange={e=>setInputMsg(e.target.value)}
                      disabled={selected.aiOn}
                      onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg()}}}
                    />
                    <button className="send-btn" onClick={sendMsg} disabled={selected.aiOn||!inputMsg.trim()}>➤</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
