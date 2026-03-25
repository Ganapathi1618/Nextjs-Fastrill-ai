"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth }  from "@/lib/hooks/useAuth"
import { useTheme } from "@/lib/hooks/useTheme"
import { useToast } from "@/components/Toast"

const NAV = [
  { id:"overview",  label:"Revenue Engine", icon:"⬡", path:"/dashboard" },
  { id:"inbox",     label:"Conversations",  icon:"◎", path:"/dashboard/conversations" },
  { id:"bookings",  label:"Bookings",       icon:"◷", path:"/dashboard/bookings" },
  { id:"campaigns", label:"Campaigns",      icon:"◆", path:"/dashboard/campaigns" },
  { id:"leads",     label:"Lead Recovery",  icon:"◉", path:"/dashboard/leads" },
  { id:"contacts",  label:"Customers",      icon:"◑", path:"/dashboard/contacts" },
  { id:"analytics", label:"Analytics",      icon:"▦", path:"/dashboard/analytics" },
  { id:"settings",  label:"Settings",       icon:"◌", path:"/dashboard/settings" },
]

const TAG_COLORS = {
  new_lead:  { color:"#38bdf8", bg:"rgba(56,189,248,0.1)",  border:"rgba(56,189,248,0.2)"  },
  returning: { color:"#00C9B1", bg:"rgba(0,208,132,0.1)",   border:"rgba(0,208,132,0.2)"   },
  vip:       { color:"#f59e0b", bg:"rgba(245,158,11,0.1)",  border:"rgba(245,158,11,0.2)"  },
  inactive:  { color:"#fb7185", bg:"rgba(251,113,133,0.1)", border:"rgba(251,113,133,0.2)" },
  regular:   { color:"#a78bfa", bg:"rgba(167,139,250,0.1)", border:"rgba(167,139,250,0.2)" },
}

export default function Customers() {
  const { userId, userEmail, loading: authLoading, logout } = useAuth()
  const { dark, toggleTheme, colors, inputStyle: inp } = useTheme()
  const toast = useToast()

  const router = useRouter()
  const [mobSidebarOpen, setMobSidebarOpen] = useState(false)
  const [customers, setCustomers] = useState([])
  const [selected, setSelected]   = useState(null)
  const [bookings, setBookings]   = useState([])   // bookings for selected customer
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState("")
  const [filter, setFilter]       = useState("all")
  const [stats, setStats]         = useState({ total:0, vip:0, returning:0, revenue:0 })

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) router.push("/login")
      else { setUserEmail(data.user.email || ""); setUserId(data.user.id) }
    })
  }, [])

  useEffect(() => { if (userId) loadCustomers() }, [userId])

  async function loadCustomers() {
    setLoading(true)
    const { data, error } = await supabase
      .from("customers").select("*").eq("user_id", userId)
      .order("created_at", { ascending: false })
    if (error) console.error("Customers load:", error.message)
    const list = data || []

    // Enrich with booking counts + spend from bookings table
    const { data: bks } = await supabase
      .from("bookings").select("customer_phone, amount, status, booking_date, service")
      .eq("user_id", userId)

    const bkMap = {}
    for (const b of (bks || [])) {
      if (!bkMap[b.customer_phone]) bkMap[b.customer_phone] = { count:0, spend:0, last:"", services:[] }
      bkMap[b.customer_phone].count++
      if (b.status==="confirmed"||b.status==="completed") bkMap[b.customer_phone].spend += (b.amount||0)
      if (!bkMap[b.customer_phone].last || b.booking_date > bkMap[b.customer_phone].last) bkMap[b.customer_phone].last = b.booking_date
      if (b.service && !bkMap[b.customer_phone].services.includes(b.service)) bkMap[b.customer_phone].services.push(b.service)
    }

    const enriched = list.map(c => ({
      ...c,
      booking_count: bkMap[c.phone]?.count || 0,
      total_spend:   bkMap[c.phone]?.spend || c.total_spend || 0,
      last_booking:  bkMap[c.phone]?.last  || "",
      services_used: bkMap[c.phone]?.services || [],
    }))

    setCustomers(enriched)
    setStats({
      total:     enriched.length,
      vip:       enriched.filter(c=>c.tag==="vip").length,
      returning: enriched.filter(c=>c.booking_count>=2).length,
      revenue:   enriched.reduce((s,c)=>s+(c.total_spend||0),0),
    })
    setLoading(false)
  }

  async function loadCustomerBookings(phone) {
    const { data } = await supabase
      .from("bookings").select("*").eq("user_id", userId).eq("customer_phone", phone)
      .order("booking_date", { ascending: false })
    setBookings(data || [])
  }

  async function updateTag(id, tag) {
    await supabase.from("customers").update({ tag }).eq("id", id)
    setCustomers(prev => prev.map(c => c.id===id ? {...c, tag} : c))
    if (selected?.id===id) setSelected(s=>({...s, tag}))
  }

  // toggleTheme now from useTheme() hook
  // logout now from useAuth() hook

  const bg=dark?"#08080e":"#f0f2f5", sidebar=dark?"#0c0c15":"#ffffff", card=dark?"#0f0f1a":"#ffffff"
  const border=dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.08)", cardBorder=dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.09)"
  const text=dark?"#eeeef5":"#111827", textMuted=dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const textFaint=dark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.25)", inputBg=dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"
  const accent=dark?"#00C9B1":"#00897A"
  const navText=dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const navActive=dark?"rgba(0,196,125,0.1)":"rgba(0,180,115,0.08)"
  const navActiveBorder = colors.navActiveBdr // dark?"rgba(0,196,125,0.2)":"rgba(0,180,115,0.2)"
  const navActiveText = colors.navActiveText // dark?"#00B5A0":"#00897A"
  const accentDim=dark?"rgba(0,208,132,0.12)":"rgba(0,147,90,0.1)"
  const userInitial = userEmail?userEmail[0].toUpperCase():"G"

  const filtered = customers.filter(c => {
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
    const matchFilter = filter==="all" || c.tag===filter || (filter==="returning" && c.booking_count>=2)
    return matchSearch && matchFilter
  })

  const tagStyle = (tag) => TAG_COLORS[tag] || TAG_COLORS.new_lead

  const formatDate = (d) => {
    if (!d) return "—"
    try { return new Date(d+"T12:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) }
    catch { return d }
  }

  const initial = (name) => (name||"?")[0].toUpperCase()
  const avatarColor = (name) => {
    const colors = ["#00C9B1","#38bdf8","#a78bfa","#f59e0b","#fb7185","#34d399"]
    return colors[(name||"").charCodeAt(0)%colors.length]
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${bg}!important;color:${text}!important;font-family:'Plus Jakarta Sans',sans-serif!important;}
        .wrap{display:flex;height:100vh;overflow:hidden;}
        .sidebar{width:224px;flex-shrink:0;background:${sidebar};border-right:1px solid ${border};display:flex;flex-direction:column;overflow-y:auto;}
        .logo{padding:16px 18px;font-weight:800;font-size:20px;color:${text};text-decoration:none;display:flex;flex-direction:row;align-items:center;gap:10px;border-bottom:1px solid ${border};line-height:1;}
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
        .content{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:14px;background:${bg};}
        .cust-row{display:flex;align-items:center;padding:11px 16px;border-bottom:1px solid ${border};cursor:pointer;transition:background 0.1s;gap:12px;}
        .cust-row:hover{background:${inputBg};}
        .cust-row.sel{background:${accentDim};}
        select option{background-color:#0c0c15!important;color:#eeeef5!important;}

        /* ══ MOBILE RESPONSIVE ══════════════════════════════════ */
        @media(max-width:767px){
          .wrap{position:relative;}
          .sidebar{
            position:fixed;top:0;left:0;height:100vh;z-index:300;
            transform:translateX(-100%);transition:transform 0.25s ease;
            width:240px!important;box-shadow:4px 0 24px rgba(0,0,0,0.5);
          }
          .sidebar.mob-open{transform:translateX(0);}
          .mob-overlay{display:block!important;}
          .main{width:100%;}
          .topbar{padding:0 12px!important;}
          .content{padding:12px!important;}
          .hamburger{display:flex!important;}
          .tb-title{font-size:14px!important;}
          /* Hide theme toggle label on small screens */
          .theme-toggle .tog-label{display:none;}
        }
        .mob-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:299;cursor:pointer;}
        .hamburger{display:none;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:6px 9px;cursor:pointer;font-size:17px;color:#eeeef5;line-height:1;margin-right:2px;}
        /* Responsive grids */
        @media(max-width:767px){
          [style*="grid-template-columns: repeat(5"]{grid-template-columns:repeat(2,1fr)!important;}
          [style*="grid-template-columns: repeat(4"]{grid-template-columns:repeat(2,1fr)!important;}
          [style*="grid-template-columns: repeat(3"]{grid-template-columns:repeat(2,1fr)!important;}
          [style*="grid-template-columns: 1fr 300px"]{grid-template-columns:1fr!important;}
          [style*="grid-template-columns: 1fr 320px"]{grid-template-columns:1fr!important;}
          [style*="grid-template-columns: 280px 1fr 280px"]{grid-template-columns:1fr!important;}
          [style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important;}
          [style*="repeat(7,1fr)"]{grid-template-columns:repeat(4,1fr)!important;}
        }
        /* Bottom navigation bar */
        .bottom-nav{
          display:none;position:fixed;bottom:0;left:0;right:0;
          background:#0c0c15;border-top:1px solid rgba(255,255,255,0.07);
          padding:6px 0;z-index:200;
        }
        @media(max-width:767px){
          .bottom-nav{display:flex;justify-content:space-around;}
          .main{padding-bottom:60px;}
          .wrap{padding-bottom:0;}
        }
        .bnav-btn{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 6px;border:none;background:transparent;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;flex:1;}
        .bnav-icon{font-size:17px;color:rgba(255,255,255,0.3);}
        .bnav-label{font-size:9px;font-weight:600;color:rgba(255,255,255,0.3);}
        .bnav-btn.active .bnav-icon,.bnav-btn.active .bnav-label{color:#00C9B1;}
      `}</style>

      <div className="wrap">
        <aside className={`sidebar${mobSidebarOpen?" mob-open":""}`}>
          <a href="/dashboard" className="logo"><img src="/logo.png" width="34" height="34" alt="Fastrill" style={{display:"block",objectFit:"contain",flexShrink:0}} /><span style={{fontWeight:800,fontSize:20,color:tx,letterSpacing:"-0.3px"}}>fast<span style={{color:acc}}>rill</span></span></a>
          <div className="nav-section">Platform</div>
          {NAV.map(item => (
            <button key={item.id} className={`nav-item${item.id==="contacts"?" active":""}`} onClick={() => router.push(item.path)}>
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
            <button className="hamburger" onClick={()=>setMobSidebarOpen(s=>!s)}>☰</button>
              <span className="tb-title">Customers</span>
            <div className="topbar-r">
              <button className="theme-toggle" onClick={toggleTheme}>
                <span>{dark?"🌙":"☀️"}</span><div className="toggle-pill"/><span>{dark?"Dark":"Light"}</span>
              </button>
            </div>
          </div>

          <div className="content">
            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:11}}>
              {[
                {l:"Total Customers", v:stats.total,                          c:text},
                {l:"Returning",       v:stats.returning,                      c:accent},
                {l:"VIP",             v:stats.vip,                            c:"#f59e0b"},
                {l:"Total Revenue",   v:`₹${stats.revenue.toLocaleString()}`, c:accent},
              ].map(s=>(
                <div key={s.l} style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:11,padding:"13px 15px"}}>
                  <div style={{fontSize:11,color:textMuted,marginBottom:5}}>{s.l}</div>
                  <div style={{fontSize:22,fontWeight:700,color:s.c}}>{loading?"…":s.v}</div>
                </div>
              ))}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:14}}>
              {/* Customer list */}
              <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,overflow:"hidden"}}>
                {/* Search + filter */}
                <div style={{padding:"12px 14px",borderBottom:`1px solid ${border}`,display:"flex",gap:8,alignItems:"center"}}>
                  <input
                    placeholder="🔍  Search by name or phone..."
                    value={search} onChange={e=>setSearch(e.target.value)}
                    style={{flex:1,background:inputBg,border:`1px solid ${cardBorder}`,borderRadius:8,padding:"7px 11px",fontSize:12.5,color:text,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none"}}
                  />
                  <select value={filter} onChange={e=>setFilter(e.target.value)}
                    style={{background:inputBg,border:`1px solid ${cardBorder}`,borderRadius:8,padding:"7px 10px",fontSize:12,color:text,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none"}}>
                    <option value="all">All</option>
                    <option value="new_lead">New Lead</option>
                    <option value="returning">Returning</option>
                    <option value="vip">VIP</option>
                    <option value="regular">Regular</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div style={{overflowY:"auto",maxHeight:"calc(100vh - 270px)"}}>
                  {loading ? (
                    <div style={{textAlign:"center",padding:40,color:textFaint}}>Loading customers...</div>
                  ) : filtered.length===0 ? (
                    <div style={{textAlign:"center",padding:40,color:textFaint}}>
                      <div style={{fontSize:28,marginBottom:8}}>◑</div>
                      <div style={{fontWeight:600,fontSize:13}}>No customers yet</div>
                      <div style={{fontSize:11,marginTop:4}}>Customers appear automatically when someone messages your WhatsApp</div>
                    </div>
                  ) : filtered.map(c => (
                    <div key={c.id} className={`cust-row${selected?.id===c.id?" sel":""}`}
                      onClick={()=>{ setSelected(c); loadCustomerBookings(c.phone) }}>
                      {/* Avatar */}
                      <div style={{width:36,height:36,borderRadius:10,background:avatarColor(c.name),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:"#fff",flexShrink:0}}>
                        {initial(c.name)}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                          <span style={{fontWeight:700,fontSize:13,color:text}}>{c.name}</span>
                          <span style={{fontSize:9.5,fontWeight:700,color:tagStyle(c.tag).color,background:tagStyle(c.tag).bg,border:`1px solid ${tagStyle(c.tag).border}`,borderRadius:100,padding:"1px 7px"}}>
                            {(c.tag||"new_lead").replace("_"," ")}
                          </span>
                        </div>
                        <div style={{fontSize:11.5,color:textMuted}}>{c.phone} {c.source?`· ${c.source}`:""}</div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        {c.total_spend>0 && <div style={{fontWeight:700,fontSize:12.5,color:accent}}>₹{c.total_spend.toLocaleString()}</div>}
                        {c.booking_count>0 && <div style={{fontSize:11,color:textFaint}}>{c.booking_count} booking{c.booking_count>1?"s":""}</div>}
                        {!c.total_spend && !c.booking_count && <div style={{fontSize:11,color:textFaint}}>{formatDate(c.created_at)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detail panel */}
              <div style={{background:card,border:`1px solid ${cardBorder}`,borderRadius:13,padding:18,overflowY:"auto",maxHeight:"calc(100vh - 200px)"}}>
                {selected ? (
                  <>
                    {/* Header */}
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,paddingBottom:14,borderBottom:`1px solid ${border}`}}>
                      <div style={{width:44,height:44,borderRadius:12,background:avatarColor(selected.name),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:18,color:"#fff",flexShrink:0}}>
                        {initial(selected.name)}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:800,fontSize:15,color:text}}>{selected.name}</div>
                        <div style={{fontSize:12,color:textMuted}}>{selected.phone}</div>
                      </div>
                      <button onClick={()=>setSelected(null)} style={{background:"transparent",border:"none",color:textFaint,cursor:"pointer",fontSize:18}}>×</button>
                    </div>

                    {/* Info rows */}
                    {[
                      ["Source",      selected.source || "WhatsApp"],
                      ["Joined",      formatDate(selected.created_at)],
                      ["Last visit",  formatDate(selected.last_visit_at || selected.last_booking)],
                      ["Bookings",    selected.booking_count || 0],
                      ["Total spend", selected.total_spend>0?`₹${selected.total_spend.toLocaleString()}`:"—"],
                    ].map(([l,v])=>(
                      <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${border}`}}>
                        <span style={{fontSize:11.5,color:textMuted}}>{l}</span>
                        <span style={{fontSize:12,fontWeight:600,color:text}}>{v}</span>
                      </div>
                    ))}

                    {/* Services used */}
                    {selected.services_used?.length>0 && (
                      <div style={{marginTop:12}}>
                        <div style={{fontSize:11,color:textFaint,marginBottom:6,fontWeight:600}}>SERVICES USED</div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                          {selected.services_used.map(s=>(
                            <span key={s} style={{fontSize:10.5,fontWeight:600,color:accent,background:accentDim,border:`1px solid ${accent}33`,borderRadius:100,padding:"2px 8px"}}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tag selector */}
                    <div style={{marginTop:14}}>
                      <div style={{fontSize:11,color:textFaint,marginBottom:6,fontWeight:600}}>TAG</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                        {Object.keys(TAG_COLORS).map(tag=>(
                          <button key={tag} onClick={()=>updateTag(selected.id,tag)} style={{
                            fontSize:10.5,fontWeight:700,padding:"3px 10px",borderRadius:100,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",
                            border:`1px solid ${selected.tag===tag?TAG_COLORS[tag].border:cardBorder}`,
                            background:selected.tag===tag?TAG_COLORS[tag].bg:"transparent",
                            color:selected.tag===tag?TAG_COLORS[tag].color:textMuted
                          }}>{tag.replace("_"," ")}</button>
                        ))}
                      </div>
                    </div>

                    {/* Booking history */}
                    <div style={{marginTop:16}}>
                      <div style={{fontSize:11,color:textFaint,marginBottom:8,fontWeight:600}}>BOOKING HISTORY</div>
                      {bookings.length===0 ? (
                        <div style={{fontSize:12,color:textFaint,textAlign:"center",padding:"12px 0"}}>No bookings yet</div>
                      ) : bookings.map(b=>(
                        <div key={b.id} style={{padding:"8px 0",borderBottom:`1px solid ${border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div>
                            <div style={{fontSize:12,fontWeight:600,color:text}}>{b.service}</div>
                            <div style={{fontSize:11,color:textFaint}}>{formatDate(b.booking_date)}{b.booking_time?` · ${b.booking_time}`:""}</div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            {b.amount>0&&<div style={{fontSize:12,fontWeight:700,color:accent}}>₹{b.amount.toLocaleString()}</div>}
                            <div style={{fontSize:10,color:{confirmed:accent,completed:"#a78bfa",cancelled:"#fb7185",pending:"#f59e0b"}[b.status]||textFaint}}>{b.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div style={{marginTop:16,display:"flex",gap:8}}>
                      <button onClick={()=>router.push("/dashboard/conversations")} style={{flex:1,padding:"8px",background:accentDim,border:`1px solid ${accent}44`,borderRadius:8,color:accent,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                        💬 View Chat
                      </button>
                      <button onClick={()=>router.push("/dashboard/bookings")} style={{flex:1,padding:"8px",background:inputBg,border:`1px solid ${cardBorder}`,borderRadius:8,color:textMuted,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                        📅 Bookings
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{textAlign:"center",padding:"40px 16px"}}>
                    <div style={{fontSize:28,opacity:0.15,marginBottom:8}}>◑</div>
                    <div style={{fontSize:12,color:textFaint,lineHeight:1.7}}>Click any customer<br/>to see their profile</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
