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

export default function Contacts() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [userId, setUserId] = useState(null)
  const [dark, setDark] = useState(true)
  const [customers, setCustomers] = useState([])
  const [selected, setSelected] = useState(null)
  const [bookings, setBookings] = useState([])
  const [search, setSearch] = useState("")
  const [filterTag, setFilterTag] = useState("all")
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name:"", phone:"", gender:"", source:"whatsapp" })
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState({ total:0, vip:0, inactive:0, new_lead:0 })

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login")
      else { setUserEmail(data.user.email||""); setUserId(data.user.id) }
    })
  }, [])

  useEffect(() => { if (userId) loadCustomers() }, [userId])

  useEffect(() => {
    if (selected) loadBookings(selected.id)
  }, [selected?.id])

  async function loadCustomers() {
    setLoading(true)
    const { data } = await supabase.from("customers").select("*").eq("user_id", userId).order("created_at", { ascending: false })
    const list = data || []
    setCustomers(list)
    setStats({
      total: list.length,
      vip: list.filter(c=>c.tag==="vip").length,
      inactive: list.filter(c=>c.tag==="inactive").length,
      new_lead: list.filter(c=>c.tag==="new_lead").length
    })
    if (list.length && !selected) setSelected(list[0])
    setLoading(false)
  }

  async function loadBookings(customerId) {
    const { data } = await supabase.from("bookings").select("*").eq("customer_id", customerId).order("booking_date", { ascending: false }).limit(10)
    setBookings(data || [])
  }

  async function addCustomer() {
    if (!newCustomer.name || !newCustomer.phone) return
    setSaving(true)
    const { data } = await supabase.from("customers").insert({ ...newCustomer, user_id: userId, tag: "new_lead" }).select().single()
    if (data) { setCustomers(prev => [data, ...prev]); setSelected(data); setShowAdd(false); setNewCustomer({ name:"", phone:"", gender:"", source:"whatsapp" }) }
    setSaving(false)
  }

  async function deleteCustomer(id) {
    if (!confirm("Delete this customer?")) return
    await supabase.from("customers").delete().eq("id", id)
    setCustomers(prev => prev.filter(c=>c.id!==id))
    setSelected(customers.find(c=>c.id!==id)||null)
  }

  const toggleTheme = () => { const n = !dark; setDark(n); localStorage.setItem("fastrill-theme", n?"dark":"light") }
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login") }

  const bg = dark?"#08080e":"#f0f2f5", sidebar=dark?"#0c0c15":"#ffffff", card=dark?"#0f0f1a":"#ffffff"
  const border=dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.08)", cardBorder=dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.09)"
  const text=dark?"#eeeef5":"#111827", textMuted=dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const textFaint=dark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.25)", inputBg=dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"
  const accent=dark?"#00d084":"#00935a", navText=dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const navActive=dark?"rgba(0,196,125,0.1)":"rgba(0,180,115,0.08)", navActiveBorder=dark?"rgba(0,196,125,0.2)":"rgba(0,180,115,0.2)"
  const navActiveText=dark?"#00c47d":"#00935a", accentDim=dark?"rgba(0,208,132,0.12)":"rgba(0,147,90,0.1)"
  const userInitial = userEmail?userEmail[0].toUpperCase():"G"

  const tagColor = { vip:"#f59e0b", regular:"#38bdf8", inactive:"#fb7185", new_lead:"#a78bfa" }
  const tagLabel = { vip:"VIP", regular:"Regular", inactive:"Inactive", new_lead:"New Lead" }
  const getInitial = (name) => (name||"?")[0].toUpperCase()
  const getColor = (name) => { const c=["#00d084","#38bdf8","#a78bfa","#f59e0b","#fb7185"]; return c[(name||"").charCodeAt(0)%c.length] }
  const daysSince = (d) => { if (!d) return null; return Math.floor((Date.now()-new Date(d))/86400000) }

  const filtered = customers.filter(c => {
    const matchSearch = (c.name||"").toLowerCase().includes(search.toLowerCase()) || (c.phone||"").includes(search)
    const matchTag = filterTag==="all" || c.tag===filterTag
    return matchSearch && matchTag
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
        .content{flex:1;display:flex;overflow:hidden;}
        .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:8px;color:${textFaint};}
        select{color-scheme:dark;background-color:inherit;}
        select option{background-color:#0c0c15!important;color:#eeeef5!important;}
        select:focus{outline:none;}
      `}</style>

      <div className="wrap">
        <aside className="sidebar">
          <a href="/dashboard" className="logo">fast<span>rill</span></a>
          <div className="nav-section">Platform</div>
          {NAV.map(item=>(
            <button key={item.id} className={`nav-item${item.id==="contacts"?" active":""}`} onClick={()=>router.push(item.path)}>
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
            <span className="tb-title">Customers</span>
            <div className="topbar-r">
              <button onClick={()=>setShowAdd(true)} style={{background:accent,color:"#000",border:"none",padding:"7px 16px",borderRadius:8,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>+ Add Customer</button>
              <button className="theme-toggle" onClick={toggleTheme}>
                <span>{dark?"🌙":"☀️"}</span><div className="toggle-pill"/><span>{dark?"Dark":"Light"}</span>
              </button>
            </div>
          </div>

          {/* Stats bar */}
          <div style={{padding:"12px 24px",borderBottom:`1px solid ${border}`,background:sidebar,display:"flex",gap:24,flexShrink:0}}>
            {[{l:"Total",v:stats.total,c:text},{l:"VIP",v:stats.vip,c:"#f59e0b"},{l:"Inactive",v:stats.inactive,c:"#fb7185"},{l:"New Leads",v:stats.new_lead,c:"#a78bfa"}].map(s=>(
              <div key={s.l} style={{display:"flex",flexDirection:"column",gap:2}}>
                <span style={{fontSize:10,color:textFaint,fontWeight:600,textTransform:"uppercase",letterSpacing:"1px"}}>{s.l}</span>
                <span style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</span>
              </div>
            ))}
          </div>

          <div className="content">
            {/* Customer List */}
            <div style={{width:380,flexShrink:0,borderRight:`1px solid ${border}`,display:"flex",flexDirection:"column",background:sidebar}}>
              <div style={{padding:12,borderBottom:`1px solid ${border}`}}>
                <div style={{display:"flex",alignItems:"center",gap:7,background:inputBg,border:`1px solid ${cardBorder}`,borderRadius:8,padding:"7px 10px",marginBottom:9}}>
                  <span style={{color:textFaint,fontSize:13}}>🔍</span>
                  <input placeholder="Search customers..." value={search} onChange={e=>setSearch(e.target.value)}
                    style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:12.5,color:text,fontFamily:"'Plus Jakarta Sans',sans-serif"}}/>
                </div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {["all","vip","regular","inactive","new_lead"].map(t=>(
                    <button key={t} onClick={()=>setFilterTag(t)} style={{padding:"3px 9px",borderRadius:100,fontSize:11,fontWeight:600,cursor:"pointer",border:`1px solid ${filterTag===t?accent+"44":cardBorder}`,background:filterTag===t?accentDim:"transparent",color:filterTag===t?accent:textMuted,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                      {t==="all"?"All":t==="new_lead"?"New Leads":t.charAt(0).toUpperCase()+t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{flex:1,overflowY:"auto"}}>
                {loading ? <div className="empty-state"><span>Loading...</span></div>
                : filtered.length===0 ? <div className="empty-state"><span style={{fontSize:28}}>👤</span><span>No customers yet</span></div>
                : filtered.map(c=>{
                  const days = daysSince(c.last_visit_at)
                  const color = getColor(c.name)
                  return (
                    <div key={c.id} onClick={()=>setSelected(c)}
                      style={{padding:"12px 16px",borderBottom:`1px solid ${border}`,cursor:"pointer",background:selected?.id===c.id?accentDim:"transparent",borderLeft:selected?.id===c.id?`2px solid ${accent}`:"2px solid transparent",transition:"background 0.1s"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:5}}>
                        <div style={{width:36,height:36,borderRadius:9,background:`linear-gradient(135deg,${color}88,${color}44)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:"#fff",flexShrink:0}}>{getInitial(c.name)}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:600,fontSize:13,color:text,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <span>{c.name}</span>
                            <span style={{fontSize:11,fontWeight:700,color:tagColor[c.tag]||textFaint,background:(tagColor[c.tag]||textFaint)+"18",padding:"2px 7px",borderRadius:100,border:`1px solid ${(tagColor[c.tag]||textFaint)}33`}}>{tagLabel[c.tag]||c.tag}</span>
                          </div>
                          <div style={{fontSize:11.5,color:textMuted}}>{c.phone}</div>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:12,fontSize:11,color:textFaint}}>
                        <span>₹{(c.total_spend||0).toLocaleString()} spent</span>
                        <span>{c.visit_count||0} visits</span>
                        {days!==null && <span style={{color:days>60?"#fb7185":days>30?"#f59e0b":textFaint}}>{days}d ago</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Profile Panel */}
            {selected ? (
              <div style={{flex:1,overflowY:"auto",padding:24,display:"flex",flexDirection:"column",gap:16}}>
                {/* Header */}
                <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:20,display:"flex",alignItems:"center",gap:16}}>
                  <div style={{width:56,height:56,borderRadius:14,background:`linear-gradient(135deg,${getColor(selected.name)}88,${getColor(selected.name)}44)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:22,color:"#fff",flexShrink:0}}>{getInitial(selected.name)}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:18,color:text,marginBottom:3}}>{selected.name}</div>
                    <div style={{fontSize:12,color:textMuted}}>{selected.phone} · {selected.source||"whatsapp"}</div>
                  </div>
                  <span style={{fontSize:11,fontWeight:700,color:tagColor[selected.tag],background:tagColor[selected.tag]+"18",padding:"4px 12px",borderRadius:100,border:`1px solid ${tagColor[selected.tag]}33`}}>{tagLabel[selected.tag]||selected.tag}</span>
                </div>

                {/* KPIs */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                  {[{l:"Total Spend",v:`₹${(selected.total_spend||0).toLocaleString()}`,c:accent},{l:"Visits",v:selected.visit_count||0,c:"#38bdf8"},{l:"Days Inactive",v:daysSince(selected.last_visit_at)??"-",c:daysSince(selected.last_visit_at)>60?"#fb7185":"#f59e0b"}].map(k=>(
                    <div key={k.l} style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:11,padding:"14px 16px"}}>
                      <div style={{fontSize:10,color:textFaint,fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",marginBottom:6}}>{k.l}</div>
                      <div style={{fontSize:24,fontWeight:800,color:k.c}}>{k.v}</div>
                    </div>
                  ))}
                </div>

                {/* Visit History */}
                <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:18}}>
                  <div style={{fontWeight:700,fontSize:13.5,color:text,marginBottom:14}}>Visit History</div>
                  {bookings.length===0 ? (
                    <div style={{textAlign:"center",color:textFaint,fontSize:12,padding:"16px 0"}}>No bookings yet</div>
                  ) : bookings.map(b=>(
                    <div key={b.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${border}`}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:600,color:text}}>{b.service}</div>
                        <div style={{fontSize:11,color:textMuted}}>{b.booking_date} · {b.staff||"Any staff"}</div>
                      </div>
                      <div style={{fontWeight:700,fontSize:13,color:accent}}>₹{b.amount||0}</div>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>router.push("/dashboard/conversations")} style={{flex:1,padding:"9px",background:accentDim,border:`1px solid ${accent}44`,borderRadius:8,color:accent,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>💬 Message</button>
                  <button onClick={()=>router.push("/dashboard/campaigns")} style={{flex:1,padding:"9px",background:inputBg,border:`1px solid ${cardBorder}`,borderRadius:8,color:textMuted,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>📢 Campaign</button>
                  <button onClick={()=>deleteCustomer(selected.id)} style={{padding:"9px 14px",background:"rgba(251,113,133,0.1)",border:"1px solid rgba(251,113,133,0.25)",borderRadius:8,color:"#fb7185",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>🗑</button>
                </div>
              </div>
            ) : (
              <div style={{flex:1}} className="empty-state"><span style={{fontSize:32}}>👤</span><span style={{fontSize:14,fontWeight:600}}>Select a customer</span></div>
            )}
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAdd && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
          <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:16,padding:28,width:400,display:"flex",flexDirection:"column",gap:14}}>
            <div style={{fontWeight:800,fontSize:16,color:text}}>Add Customer</div>
            <input placeholder="Full name *" value={newCustomer.name} onChange={e=>setNewCustomer(p=>({...p,name:e.target.value}))} style={inp}/>
            <input placeholder="WhatsApp number * e.g. +919876543210" value={newCustomer.phone} onChange={e=>setNewCustomer(p=>({...p,phone:e.target.value}))} style={inp}/>
            <select value={newCustomer.gender} onChange={e=>setNewCustomer(p=>({...p,gender:e.target.value}))} style={{...inp,color:newCustomer.gender?text:textFaint}}>
              <option value="">Gender</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
            <select value={newCustomer.source} onChange={e=>setNewCustomer(p=>({...p,source:e.target.value}))} style={inp}>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
              <option value="referral">Referral</option>
              <option value="walk-in">Walk-in</option>
              <option value="google">Google</option>
            </select>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setShowAdd(false)} style={{flex:1,padding:"9px",background:inputBg,border:`1px solid ${cardBorder}`,borderRadius:8,color:textMuted,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Cancel</button>
              <button onClick={addCustomer} disabled={saving} style={{flex:1,padding:"9px",background:accent,border:"none",borderRadius:8,color:"#000",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{saving?"Saving...":"Add Customer"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
