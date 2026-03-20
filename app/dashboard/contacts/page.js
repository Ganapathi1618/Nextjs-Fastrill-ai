"use client"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
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
  new_lead:  { color:"#38bdf8", bg:"rgba(56,189,248,0.1)",   border:"rgba(56,189,248,0.2)"   },
  returning: { color:"#00d084", bg:"rgba(0,208,132,0.1)",    border:"rgba(0,208,132,0.2)"    },
  vip:       { color:"#f59e0b", bg:"rgba(245,158,11,0.1)",   border:"rgba(245,158,11,0.2)"   },
  inactive:  { color:"#fb7185", bg:"rgba(251,113,133,0.1)",  border:"rgba(251,113,133,0.2)"  },
  regular:   { color:"#a78bfa", bg:"rgba(167,139,250,0.1)",  border:"rgba(167,139,250,0.2)"  },
}

const AVATAR_COLORS = ["#00d084","#38bdf8","#a78bfa","#f59e0b","#fb7185","#34d399","#0ea5e9"]
const avatarColor = (name) => AVATAR_COLORS[(name || "").charCodeAt(0) % AVATAR_COLORS.length]
const initial     = (name) => (name || "?")[0].toUpperCase()
const tagStyle    = (tag)  => TAG_COLORS[tag] || TAG_COLORS.new_lead
const formatDate  = (d)    => {
  if (!d) return "—"
  try { return new Date(d + "T12:00:00").toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) }
  catch { return d }
}

export default function Customers() {
  const router  = useRouter()
  const toast   = useToast()
  const fileRef = useRef(null)
  const noteRef = useRef(null)

  const [userEmail, setUserEmail] = useState("")
  const [userId, setUserId]       = useState(null)
  const [dark, setDark]           = useState(true)
  const [mobOpen, setMobOpen]     = useState(false)

  const [customers, setCustomers]   = useState([])
  const [selected, setSelected]     = useState(null)
  const [bookings, setBookings]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [search, setSearch]         = useState("")
  const [filter, setFilter]         = useState("all")
  const [sort, setSort]             = useState("recent") // recent | spend | bookings | name

  const [stats, setStats]           = useState({ total:0, vip:0, returning:0, revenue:0, newThisMonth:0 })
  const [showAdd, setShowAdd]       = useState(false)
  const [showBulk, setShowBulk]     = useState(false)
  const [editMode, setEditMode]     = useState(false)
  const [note, setNote]             = useState("")
  const [showNote, setShowNote]     = useState(false)

  // Add single customer form
  const [newCust, setNewCust] = useState({ name:"", phone:"", source:"whatsapp", tag:"new_lead" })

  // Bulk import
  const [bulkText, setBulkText]   = useState("")
  const [bulkParsed, setBulkParsed] = useState([])
  const [bulkSaving, setBulkSaving] = useState(false)

  // Edit form
  const [editForm, setEditForm] = useState({ name:"", phone:"", tag:"new_lead", notes:"" })

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
    try {
      const { data, error } = await supabase
        .from("customers").select("*").eq("user_id", userId)
        .order("created_at", { ascending: false })
      if (error) throw error

      const { data: bks } = await supabase
        .from("bookings").select("customer_phone,amount,status,booking_date,service,created_at")
        .eq("user_id", userId)

      // Build booking map
      const bkMap = {}
      for (const b of (bks || [])) {
        if (!bkMap[b.customer_phone]) bkMap[b.customer_phone] = { count:0, spend:0, last:"", services:[] }
        bkMap[b.customer_phone].count++
        if (b.status === "confirmed" || b.status === "completed") bkMap[b.customer_phone].spend += (b.amount || 0)
        if (!bkMap[b.customer_phone].last || b.booking_date > bkMap[b.customer_phone].last) bkMap[b.customer_phone].last = b.booking_date
        if (b.service && !bkMap[b.customer_phone].services.includes(b.service)) bkMap[b.customer_phone].services.push(b.service)
      }

      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const enriched = (data || []).map(c => ({
        ...c,
        booking_count: bkMap[c.phone]?.count || 0,
        total_spend:   bkMap[c.phone]?.spend || c.total_spend || 0,
        last_booking:  bkMap[c.phone]?.last  || "",
        services_used: bkMap[c.phone]?.services || [],
      }))

      setCustomers(enriched)
      setStats({
        total:        enriched.length,
        vip:          enriched.filter(c => c.tag === "vip").length,
        returning:    enriched.filter(c => c.booking_count >= 2).length,
        revenue:      enriched.reduce((s, c) => s + (c.total_spend || 0), 0),
        newThisMonth: enriched.filter(c => c.created_at >= monthStart).length,
      })
    } catch(e) {
      toast.error("Failed to load customers: " + e.message)
    }
    setLoading(false)
  }

  async function loadCustomerBookings(phone) {
    const { data } = await supabase
      .from("bookings").select("*").eq("user_id", userId).eq("customer_phone", phone)
      .order("booking_date", { ascending: false })
    setBookings(data || [])
  }

  async function updateTag(id, tag) {
    try {
      await supabase.from("customers").update({ tag }).eq("id", id)
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, tag } : c))
      if (selected?.id === id) setSelected(s => ({ ...s, tag }))
      toast.success("Tag updated to " + tag.replace("_"," "))
    } catch(e) { toast.error("Failed to update tag") }
  }

  async function addCustomer() {
    if (!newCust.name.trim() || !newCust.phone.trim()) { toast.warning("Name and phone are required"); return }
    setSaving(true)
    try {
      const phone = newCust.phone.replace(/[^0-9]/g, "")
      const { data, error } = await supabase.from("customers").insert({
        user_id: userId, name: newCust.name.trim(), phone,
        source: newCust.source, tag: newCust.tag, created_at: new Date().toISOString()
      }).select().single()
      if (error) throw error
      setCustomers(prev => [{ ...data, booking_count:0, total_spend:0, services_used:[] }, ...prev])
      setStats(s => ({ ...s, total: s.total + 1 }))
      setShowAdd(false)
      setNewCust({ name:"", phone:"", source:"whatsapp", tag:"new_lead" })
      toast.success(newCust.name + " added successfully")
    } catch(e) { toast.error("Failed to add customer: " + e.message) }
    setSaving(false)
  }

  async function saveEdit() {
    if (!editForm.name.trim()) { toast.warning("Name is required"); return }
    setSaving(true)
    try {
      const { error } = await supabase.from("customers")
        .update({ name: editForm.name, phone: editForm.phone, tag: editForm.tag, notes: editForm.notes })
        .eq("id", selected.id)
      if (error) throw error
      const updated = { ...selected, ...editForm }
      setCustomers(prev => prev.map(c => c.id === selected.id ? updated : c))
      setSelected(updated)
      setEditMode(false)
      toast.success("Customer updated")
    } catch(e) { toast.error("Failed to save: " + e.message) }
    setSaving(false)
  }

  async function saveNote() {
    try {
      await supabase.from("customers").update({ notes: note }).eq("id", selected.id)
      setSelected(s => ({ ...s, notes: note }))
      setCustomers(prev => prev.map(c => c.id === selected.id ? { ...c, notes: note } : c))
      setShowNote(false)
      toast.success("Note saved")
    } catch(e) { toast.error("Failed to save note") }
  }

  // Bulk CSV/text import
  function parseBulk(text) {
    const lines = text.replace(/\r/g, "").split("\n").filter(l => l.trim())
    const parsed = []
    for (const line of lines) {
      const parts = line.split(",").map(p => p.trim())
      const phone = parts.find(p => /^[0-9+\s\-()]{8,}$/.test(p.replace(/[^0-9]/g,"")))
      const name  = parts.find(p => p && !/^[0-9+\s\-()]{8,}$/.test(p.replace(/[^0-9]/g,"")) && p.length > 1)
      if (phone) parsed.push({ name: name || "Customer", phone: phone.replace(/[^0-9]/g,"") })
    }
    setBulkParsed(parsed)
  }

  async function importBulk() {
    if (!bulkParsed.length) { toast.warning("No valid numbers found"); return }
    setBulkSaving(true)
    let added = 0, skipped = 0
    for (const c of bulkParsed) {
      try {
        const { error } = await supabase.from("customers").insert({
          user_id: userId, name: c.name, phone: c.phone,
          source: "import", tag: "new_lead", created_at: new Date().toISOString()
        })
        if (error && error.code === "23505") skipped++ // duplicate
        else if (!error) added++
      } catch(e) { skipped++ }
    }
    await loadCustomers()
    setBulkSaving(false)
    setShowBulk(false)
    setBulkText(""); setBulkParsed([])
    toast.success(added + " customers imported" + (skipped > 0 ? ", " + skipped + " duplicates skipped" : ""))
  }

  function handleCsvFile(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { setBulkText(ev.target.result); parseBulk(ev.target.result) }
    reader.readAsText(file)
  }

  const toggleTheme  = () => { const n = !dark; setDark(n); localStorage.setItem("fastrill-theme", n ? "dark" : "light") }
  const handleLogout = async () => {
    try { await supabase.auth.signOut(); router.push("/login") }
    catch(e) { toast.error("Sign out failed") }
  }

  // Sort + filter
  const filtered = customers.filter(c => {
    const matchSearch = !search || (c.name||"").toLowerCase().includes(search.toLowerCase()) || (c.phone||"").includes(search)
    const matchFilter = filter === "all" || c.tag === filter || (filter === "returning" && c.booking_count >= 2)
    return matchSearch && matchFilter
  }).sort((a, b) => {
    if (sort === "spend")    return (b.total_spend||0) - (a.total_spend||0)
    if (sort === "bookings") return (b.booking_count||0) - (a.booking_count||0)
    if (sort === "name")     return (a.name||"").localeCompare(b.name||"")
    return new Date(b.created_at||0) - new Date(a.created_at||0) // recent
  })

  // Theme tokens
  const bg = dark?"#08080e":"#f0f2f5", sb = dark?"#0c0c15":"#ffffff", card = dark?"#0f0f1a":"#ffffff"
  const bdr = dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.08)", cbdr = dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.09)"
  const tx = dark?"#eeeef5":"#111827", txm = dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const txf = dark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.25)", ibg = dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"
  const acc = dark?"#00d084":"#00935a", adim = dark?"rgba(0,208,132,0.12)":"rgba(0,147,90,0.1)"
  const navText = dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const navActive = dark?"rgba(0,196,125,0.1)":"rgba(0,180,115,0.08)"
  const navActiveBorder = dark?"rgba(0,196,125,0.2)":"rgba(0,180,115,0.2)"
  const navActiveText = dark?"#00c47d":"#00935a"
  const ui = userEmail ? userEmail[0].toUpperCase() : "G"
  const inp = { background:ibg, border:"1px solid " + cbdr, borderRadius:8, padding:"9px 12px", fontSize:13, color:tx, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none", width:"100%" }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${bg}!important;color:${tx}!important;font-family:'Plus Jakarta Sans',sans-serif!important;}
        .wrap{display:flex;height:100vh;overflow:hidden;}
        .sidebar{width:224px;flex-shrink:0;background:${sb};border-right:1px solid ${bdr};display:flex;flex-direction:column;overflow-y:auto;}
        .logo{padding:22px 20px 18px;font-weight:800;font-size:20px;color:${tx};text-decoration:none;display:block;border-bottom:1px solid ${bdr};}
        .logo span{color:${acc};}
        .nav-section{padding:18px 16px 7px;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${txf};font-weight:600;}
        .nav-item{display:flex;align-items:center;gap:9px;padding:9px 12px;margin:1px 8px;border-radius:8px;cursor:pointer;font-size:13.5px;color:${navText};font-weight:500;transition:all 0.13s;border:1px solid transparent;background:none;width:calc(100% - 16px);text-align:left;font-family:'Plus Jakarta Sans',sans-serif;}
        .nav-item:hover{background:${ibg};color:${tx};}
        .nav-item.active{background:${navActive};color:${navActiveText};font-weight:600;border-color:${navActiveBorder};}
        .nav-icon{font-size:13px;width:18px;text-align:center;flex-shrink:0;}
        .sbf{margin-top:auto;padding:14px;border-top:1px solid ${bdr};}
        .uc{display:flex;align-items:center;gap:9px;padding:9px;border-radius:9px;background:${ibg};border:1px solid ${cbdr};}
        .ua{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,${acc},#0ea5e9);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#fff;flex-shrink:0;}
        .lb{margin-top:7px;width:100%;padding:7px;border-radius:7px;background:transparent;border:1px solid ${cbdr};font-size:12px;color:${txm};cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .lb:hover{border-color:#fca5a5;color:#ef4444;}
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .topbar{height:54px;flex-shrink:0;border-bottom:1px solid ${bdr};display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:${sb};}
        .content{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:14px;background:${bg};}
        .cust-row{display:flex;align-items:center;padding:11px 16px;border-bottom:1px solid ${bdr};cursor:pointer;transition:background 0.1s;gap:12px;}
        .cust-row:hover{background:${ibg};}
        .cust-row.sel{background:${adim};border-left:3px solid ${acc};}
        .theme-toggle{display:flex;align-items:center;gap:6px;padding:5px 10px;background:${ibg};border:1px solid ${cbdr};border-radius:8px;cursor:pointer;font-size:11.5px;color:${txm};font-family:'Plus Jakarta Sans',sans-serif;}
        .toggle-pill{width:30px;height:16px;border-radius:100px;background:${dark?acc:"#d1d5db"};position:relative;flex-shrink:0;}
        .toggle-pill::after{content:'';position:absolute;top:2px;width:12px;height:12px;border-radius:50%;background:#fff;left:${dark?"16px":"2px"};}
        .hbtn{display:none;background:${ibg};border:1px solid ${cbdr};border-radius:8px;padding:6px 9px;cursor:pointer;font-size:17px;color:${tx};line-height:1;margin-right:2px;}
        .mob-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:299;cursor:pointer;}
        .bnav{display:none;position:fixed;bottom:0;left:0;right:0;background:${sb};border-top:1px solid ${bdr};padding:6px 0;z-index:200;}
        @media(max-width:767px){
          .wrap{position:relative;}
          .sidebar{position:fixed;top:0;left:0;height:100vh;z-index:300;transform:translateX(-100%);transition:transform 0.25s;width:240px!important;box-shadow:4px 0 24px rgba(0,0,0,0.5);}
          .sidebar.open{transform:translateX(0);}
          .mob-ov.open{display:block;}
          .hbtn{display:flex;}
          .bnav{display:flex;}
          .main{padding-bottom:58px;}
          .topbar{padding:0 12px!important;}
          .content{padding:12px!important;}
          [style*="grid-template-columns: 1fr 320px"]{grid-template-columns:1fr!important;}
          [style*="grid-template-columns: repeat(5"]{grid-template-columns:repeat(2,1fr)!important;}
          [style*="grid-template-columns: repeat(4"]{grid-template-columns:repeat(2,1fr)!important;}
        }
        .bni{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 6px;border:none;background:transparent;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;flex:1;}
        .bnic{font-size:17px;color:rgba(255,255,255,0.3);}
        .bnil{font-size:9px;font-weight:600;color:rgba(255,255,255,0.3);}
        .bni.on .bnic,.bni.on .bnil{color:${acc};}
        input:focus,textarea:focus{border-color:${acc}88!important;}
        select option{background-color:#0c0c15!important;color:#eeeef5!important;}
      `}</style>

      <div className="wrap">
        <div className={"mob-ov" + (mobOpen ? " open" : "")} onClick={() => setMobOpen(false)}/>
        <aside className={"sidebar" + (mobOpen ? " open" : "")}>
          <a href="/dashboard" className="logo">fast<span>rill</span></a>
          <div className="nav-section">Platform</div>
          {NAV.map(item => (
            <button key={item.id} className={"nav-item" + (item.id === "contacts" ? " active" : "")} onClick={() => router.push(item.path)}>
              <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
          <div className="sbf">
            <div className="uc">
              <div className="ua">{ui}</div>
              <div style={{fontSize:11.5, color:txm, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{userEmail || "Loading..."}</div>
            </div>
            <button className="lb" onClick={handleLogout}>↩ Sign out</button>
          </div>
        </aside>

        <div className="main">
          <div className="topbar">
            <div style={{display:"flex", alignItems:"center", gap:8}}>
              <button className="hbtn" onClick={() => setMobOpen(s => !s)}>☰</button>
              <span style={{fontWeight:700, fontSize:15, color:tx}}>Customers</span>
              <span style={{fontSize:12, color:txf, background:ibg, border:"1px solid " + cbdr, borderRadius:100, padding:"2px 10px", fontWeight:600}}>{customers.length}</span>
            </div>
            <div style={{display:"flex", alignItems:"center", gap:8}}>
              <button onClick={() => setShowBulk(true)} style={{display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, background:ibg, border:"1px solid " + cbdr, color:txm, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                📎 Bulk Import
              </button>
              <button onClick={() => setShowAdd(true)} style={{display:"flex", alignItems:"center", gap:5, padding:"6px 14px", borderRadius:8, background:acc, border:"none", color:"#000", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                + Add Customer
              </button>
              <button className="theme-toggle" onClick={toggleTheme}>
                <span>{dark ? "🌙" : "☀️"}</span><div className="toggle-pill"/><span>{dark ? "Dark" : "Light"}</span>
              </button>
            </div>
          </div>

          <div className="content">
            {/* KPI stats */}
            <div style={{display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:11}}>
              {[
                { l:"Total",       v:stats.total,                           c:tx },
                { l:"New (Month)", v:stats.newThisMonth,                   c:"#38bdf8" },
                { l:"Returning",   v:stats.returning,                       c:acc },
                { l:"VIP",         v:stats.vip,                             c:"#f59e0b" },
                { l:"Revenue",     v:"₹" + stats.revenue.toLocaleString(), c:acc },
              ].map(s => (
                <div key={s.l} style={{background:card, border:"1px solid " + cbdr, borderRadius:11, padding:"13px 15px"}}>
                  <div style={{fontSize:11, color:txm, marginBottom:5}}>{s.l}</div>
                  <div style={{fontSize:22, fontWeight:700, color:s.c}}>{loading ? "…" : s.v}</div>
                </div>
              ))}
            </div>

            <div style={{display:"grid", gridTemplateColumns:"1fr 320px", gap:14}}>
              {/* Customer list */}
              <div style={{background:card, border:"1px solid " + cbdr, borderRadius:13, overflow:"hidden"}}>
                {/* Toolbar */}
                <div style={{padding:"12px 14px", borderBottom:"1px solid " + bdr, display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
                  <input placeholder="🔍  Search name or phone..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    style={{flex:1, minWidth:140, background:ibg, border:"1px solid " + cbdr, borderRadius:8, padding:"7px 11px", fontSize:12.5, color:tx, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none"}}
                  />
                  <select value={filter} onChange={e => setFilter(e.target.value)}
                    style={{background:ibg, border:"1px solid " + cbdr, borderRadius:8, padding:"7px 10px", fontSize:12, color:tx, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none"}}>
                    <option value="all">All Tags</option>
                    <option value="new_lead">New Lead</option>
                    <option value="returning">Returning</option>
                    <option value="vip">VIP</option>
                    <option value="regular">Regular</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <select value={sort} onChange={e => setSort(e.target.value)}
                    style={{background:ibg, border:"1px solid " + cbdr, borderRadius:8, padding:"7px 10px", fontSize:12, color:tx, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none"}}>
                    <option value="recent">Sort: Recent</option>
                    <option value="spend">Sort: Top Spend</option>
                    <option value="bookings">Sort: Most Bookings</option>
                    <option value="name">Sort: Name A–Z</option>
                  </select>
                </div>

                {/* Column headers */}
                <div style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", padding:"8px 16px", borderBottom:"1px solid " + bdr, fontSize:10, fontWeight:700, color:txf, letterSpacing:"0.5px", textTransform:"uppercase"}}>
                  <span>Customer</span><span style={{textAlign:"center"}}>Bookings</span><span style={{textAlign:"center"}}>Spend</span><span style={{textAlign:"right"}}>Tag</span>
                </div>

                <div style={{overflowY:"auto", maxHeight:"calc(100vh - 310px)"}}>
                  {loading ? (
                    <div style={{textAlign:"center", padding:40, color:txf}}>Loading customers...</div>
                  ) : filtered.length === 0 ? (
                    <div style={{textAlign:"center", padding:40, color:txf}}>
                      <div style={{fontSize:28, marginBottom:8}}>◑</div>
                      <div style={{fontWeight:600, fontSize:13, marginBottom:4}}>No customers yet</div>
                      <div style={{fontSize:11}}>Customers appear automatically when they message your WhatsApp</div>
                      <button onClick={() => setShowAdd(true)} style={{marginTop:12, padding:"6px 16px", borderRadius:8, background:adim, border:"1px solid " + acc + "44", color:acc, fontWeight:600, fontSize:12, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif"}}>+ Add manually</button>
                    </div>
                  ) : filtered.map(c => (
                    <div key={c.id}
                      className={"cust-row" + (selected?.id === c.id ? " sel" : "")}
                      onClick={() => { setSelected(c); loadCustomerBookings(c.phone); setEditMode(false); setNote(c.notes || ""); setShowNote(false) }}>
                      {/* Avatar + name */}
                      <div style={{display:"flex", alignItems:"center", gap:10, flex:2, minWidth:0}}>
                        <div style={{width:36, height:36, borderRadius:10, background:avatarColor(c.name), display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:14, color:"#fff", flexShrink:0}}>
                          {initial(c.name)}
                        </div>
                        <div style={{minWidth:0}}>
                          <div style={{fontWeight:700, fontSize:13, color:tx, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{c.name}</div>
                          <div style={{fontSize:11.5, color:txm}}>{c.phone}</div>
                          {c.notes && <div style={{fontSize:10.5, color:txf, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:160}}>📝 {c.notes}</div>}
                        </div>
                      </div>
                      {/* Bookings */}
                      <div style={{textAlign:"center", flex:1}}>
                        <div style={{fontSize:14, fontWeight:700, color:c.booking_count > 0 ? acc : txf}}>{c.booking_count || "—"}</div>
                        {c.last_booking && <div style={{fontSize:10, color:txf}}>{formatDate(c.last_booking)}</div>}
                      </div>
                      {/* Spend */}
                      <div style={{textAlign:"center", flex:1}}>
                        <div style={{fontSize:13, fontWeight:700, color:c.total_spend > 0 ? acc : txf}}>
                          {c.total_spend > 0 ? "₹" + c.total_spend.toLocaleString() : "—"}
                        </div>
                      </div>
                      {/* Tag */}
                      <div style={{textAlign:"right", flex:1, flexShrink:0}}>
                        <span style={{fontSize:9.5, fontWeight:700, color:tagStyle(c.tag).color, background:tagStyle(c.tag).bg, border:"1px solid " + tagStyle(c.tag).border, borderRadius:100, padding:"2px 8px", whiteSpace:"nowrap"}}>
                          {(c.tag || "new_lead").replace("_"," ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer: count */}
                <div style={{padding:"8px 16px", borderTop:"1px solid " + bdr, fontSize:11.5, color:txf}}>
                  {filtered.length} of {customers.length} customers
                </div>
              </div>

              {/* Detail panel */}
              <div style={{background:card, border:"1px solid " + cbdr, borderRadius:13, overflowY:"auto", maxHeight:"calc(100vh - 200px)"}}>
                {selected ? (
                  <div style={{padding:18}}>
                    {/* Header */}
                    <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:16, paddingBottom:14, borderBottom:"1px solid " + bdr}}>
                      <div style={{width:44, height:44, borderRadius:12, background:avatarColor(selected.name), display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:18, color:"#fff", flexShrink:0}}>
                        {initial(selected.name)}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:800, fontSize:15, color:tx}}>{selected.name}</div>
                        <div style={{fontSize:12, color:txm}}>{selected.phone}</div>
                      </div>
                      <div style={{display:"flex", gap:6}}>
                        <button onClick={() => { setEditForm({ name:selected.name, phone:selected.phone, tag:selected.tag||"new_lead", notes:selected.notes||"" }); setEditMode(true) }}
                          style={{padding:"5px 10px", borderRadius:7, background:ibg, border:"1px solid " + cbdr, color:txm, fontSize:11, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif"}}>✏️ Edit</button>
                        <button onClick={() => setSelected(null)}
                          style={{background:"transparent", border:"none", color:txf, cursor:"pointer", fontSize:18, lineHeight:1}}>×</button>
                      </div>
                    </div>

                    {editMode ? (
                      <div style={{display:"flex", flexDirection:"column", gap:10, marginBottom:16}}>
                        <div style={{fontSize:12, color:txf, fontWeight:700, marginBottom:4}}>EDIT CUSTOMER</div>
                        <input placeholder="Name" value={editForm.name} onChange={e => setEditForm(p => ({...p, name:e.target.value}))} style={inp}/>
                        <input placeholder="Phone" value={editForm.phone} onChange={e => setEditForm(p => ({...p, phone:e.target.value}))} style={inp}/>
                        <select value={editForm.tag} onChange={e => setEditForm(p => ({...p, tag:e.target.value}))} style={inp}>
                          {Object.keys(TAG_COLORS).map(t => <option key={t} value={t}>{t.replace("_"," ")}</option>)}
                        </select>
                        <textarea placeholder="Notes (optional)" value={editForm.notes} onChange={e => setEditForm(p => ({...p, notes:e.target.value}))} rows={2} style={{...inp, resize:"vertical"}}/>
                        <div style={{display:"flex", gap:8}}>
                          <button onClick={() => setEditMode(false)} style={{flex:1, padding:"8px", background:ibg, border:"1px solid " + cbdr, borderRadius:8, color:txm, fontWeight:600, fontSize:12, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Cancel</button>
                          <button onClick={saveEdit} disabled={saving} style={{flex:1, padding:"8px", background:acc, border:"none", borderRadius:8, color:"#000", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                            {saving ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Info rows */}
                        {[
                          ["Source",      selected.source || "WhatsApp"],
                          ["Joined",      formatDate(selected.created_at)],
                          ["Last visit",  formatDate(selected.last_visit_at || selected.last_booking)],
                          ["Bookings",    selected.booking_count || 0],
                          ["Total spend", selected.total_spend > 0 ? "₹" + selected.total_spend.toLocaleString() : "—"],
                        ].map(([l, v]) => (
                          <div key={l} style={{display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid " + bdr}}>
                            <span style={{fontSize:11.5, color:txm}}>{l}</span>
                            <span style={{fontSize:12, fontWeight:600, color:tx}}>{v}</span>
                          </div>
                        ))}

                        {/* Services used */}
                        {selected.services_used?.length > 0 && (
                          <div style={{marginTop:12}}>
                            <div style={{fontSize:10, color:txf, marginBottom:6, fontWeight:700, letterSpacing:"0.5px"}}>SERVICES USED</div>
                            <div style={{display:"flex", flexWrap:"wrap", gap:5}}>
                              {selected.services_used.map(s => (
                                <span key={s} style={{fontSize:10.5, fontWeight:600, color:acc, background:adim, border:"1px solid " + acc + "33", borderRadius:100, padding:"2px 8px"}}>{s}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        <div style={{marginTop:12}}>
                          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6}}>
                            <div style={{fontSize:10, color:txf, fontWeight:700, letterSpacing:"0.5px"}}>NOTES</div>
                            <button onClick={() => setShowNote(!showNote)} style={{fontSize:11, color:acc, background:"transparent", border:"none", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                              {showNote ? "Cancel" : selected.notes ? "Edit" : "+ Add note"}
                            </button>
                          </div>
                          {showNote ? (
                            <div>
                              <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                                placeholder="Add a note about this customer..."
                                style={{...inp, resize:"vertical", marginBottom:6}}/>
                              <button onClick={saveNote} style={{width:"100%", padding:"7px", borderRadius:8, background:adim, border:"1px solid " + acc + "44", color:acc, fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                                Save Note
                              </button>
                            </div>
                          ) : selected.notes ? (
                            <div style={{fontSize:12, color:txm, background:ibg, borderRadius:8, padding:"8px 10px", lineHeight:1.5}}>{selected.notes}</div>
                          ) : (
                            <div style={{fontSize:11.5, color:txf}}>No notes yet</div>
                          )}
                        </div>

                        {/* Tag selector */}
                        <div style={{marginTop:14}}>
                          <div style={{fontSize:10, color:txf, marginBottom:7, fontWeight:700, letterSpacing:"0.5px"}}>TAG</div>
                          <div style={{display:"flex", flexWrap:"wrap", gap:5}}>
                            {Object.keys(TAG_COLORS).map(tag => (
                              <button key={tag} onClick={() => updateTag(selected.id, tag)} style={{
                                fontSize:10.5, fontWeight:700, padding:"3px 10px", borderRadius:100, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif",
                                border:"1px solid " + (selected.tag === tag ? TAG_COLORS[tag].border : cbdr),
                                background: selected.tag === tag ? TAG_COLORS[tag].bg : "transparent",
                                color: selected.tag === tag ? TAG_COLORS[tag].color : txm
                              }}>{tag.replace("_"," ")}</button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Booking history */}
                    <div style={{marginTop:16}}>
                      <div style={{fontSize:10, color:txf, marginBottom:8, fontWeight:700, letterSpacing:"0.5px"}}>BOOKING HISTORY ({bookings.length})</div>
                      {bookings.length === 0 ? (
                        <div style={{fontSize:12, color:txf, textAlign:"center", padding:"12px 0"}}>No bookings yet</div>
                      ) : bookings.slice(0, 6).map(b => (
                        <div key={b.id} style={{padding:"8px 0", borderBottom:"1px solid " + bdr, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                          <div>
                            <div style={{fontSize:12, fontWeight:600, color:tx}}>{b.service}</div>
                            <div style={{fontSize:11, color:txf}}>{formatDate(b.booking_date)}{b.booking_time ? " · " + b.booking_time : ""}</div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            {b.amount > 0 && <div style={{fontSize:12, fontWeight:700, color:acc}}>₹{b.amount.toLocaleString()}</div>}
                            <div style={{fontSize:10, color:{ confirmed:acc, completed:"#a78bfa", cancelled:"#fb7185", pending:"#f59e0b" }[b.status] || txf}}>{b.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div style={{marginTop:16, display:"flex", flexDirection:"column", gap:8}}>
                      <button onClick={() => router.push("/dashboard/conversations")}
                        style={{padding:"9px", background:adim, border:"1px solid " + acc + "44", borderRadius:8, color:acc, fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                        💬 Open Conversation
                      </button>
                      <div style={{display:"flex", gap:8}}>
                        <button onClick={() => router.push("/dashboard/bookings")}
                          style={{flex:1, padding:"8px", background:ibg, border:"1px solid " + cbdr, borderRadius:8, color:txm, fontWeight:600, fontSize:12, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                          📅 Bookings
                        </button>
                        <button onClick={() => router.push("/dashboard/campaigns")}
                          style={{flex:1, padding:"8px", background:ibg, border:"1px solid " + cbdr, borderRadius:8, color:txm, fontWeight:600, fontSize:12, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                          📢 Campaign
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{textAlign:"center", padding:"40px 16px"}}>
                    <div style={{fontSize:28, opacity:0.15, marginBottom:8}}>◑</div>
                    <div style={{fontSize:12, color:txf, lineHeight:1.7}}>Click any customer<br/>to see their profile & history</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAdd && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.72)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000}} onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}>
          <div style={{background:card, border:"1px solid " + cbdr, borderRadius:16, padding:28, width:400, display:"flex", flexDirection:"column", gap:12}}>
            <div style={{fontWeight:800, fontSize:16, color:tx}}>Add Customer</div>
            <input placeholder="Full name *" value={newCust.name} onChange={e => setNewCust(p => ({...p, name:e.target.value}))} style={inp}/>
            <input placeholder="Phone number (with country code) *" value={newCust.phone} onChange={e => setNewCust(p => ({...p, phone:e.target.value}))} style={inp}/>
            <select value={newCust.source} onChange={e => setNewCust(p => ({...p, source:e.target.value}))} style={inp}>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
              <option value="google">Google</option>
              <option value="referral">Referral</option>
              <option value="walk_in">Walk-in</option>
              <option value="import">Import</option>
            </select>
            <select value={newCust.tag} onChange={e => setNewCust(p => ({...p, tag:e.target.value}))} style={inp}>
              {Object.keys(TAG_COLORS).map(t => <option key={t} value={t}>{t.replace("_"," ")}</option>)}
            </select>
            <div style={{display:"flex", gap:8}}>
              <button onClick={() => setShowAdd(false)} style={{flex:1, padding:"9px", background:ibg, border:"1px solid " + cbdr, borderRadius:8, color:txm, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Cancel</button>
              <button onClick={addCustomer} disabled={saving || !newCust.name.trim() || !newCust.phone.trim()}
                style={{flex:1, padding:"9px", background:acc, border:"none", borderRadius:8, color:"#000", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", opacity:saving ? 0.6 : 1}}>
                {saving ? "Adding..." : "Add Customer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulk && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20}} onClick={e => { if (e.target === e.currentTarget) setShowBulk(false) }}>
          <div style={{background:card, border:"1px solid " + cbdr, borderRadius:16, padding:28, width:"100%", maxWidth:520, display:"flex", flexDirection:"column", gap:14}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <div style={{fontWeight:800, fontSize:16, color:tx}}>📎 Bulk Import Customers</div>
              <button onClick={() => setShowBulk(false)} style={{background:"transparent", border:"none", color:txf, cursor:"pointer", fontSize:20}}>×</button>
            </div>
            <div style={{fontSize:12.5, color:txm, background:adim, borderRadius:8, padding:"10px 12px", lineHeight:1.6}}>
              Paste numbers below — one per line, or CSV format<br/>
              <span style={{opacity:0.75}}>Format: <code style={{color:acc}}>Name, Phone</code> or just <code style={{color:acc}}>Phone</code></span>
            </div>

            {/* CSV upload */}
            <input ref={fileRef} type="file" accept=".csv,.txt" style={{display:"none"}} onChange={handleCsvFile}/>
            <button onClick={() => fileRef.current?.click()} style={{padding:"9px", borderRadius:8, background:ibg, border:"1px dashed " + cbdr, color:txm, fontWeight:600, fontSize:12.5, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              📂 Upload CSV or .txt file
            </button>

            <textarea
              placeholder={"Priya Sharma, 919876543210\nRahul, 918765432109\n917654321098"}
              value={bulkText}
              onChange={e => { setBulkText(e.target.value); parseBulk(e.target.value) }}
              rows={6}
              style={{...inp, resize:"vertical", lineHeight:1.6, fontFamily:"monospace"}}
            />

            {bulkParsed.length > 0 && (
              <div style={{background:adim, border:"1px solid " + acc + "33", borderRadius:8, padding:"10px 12px"}}>
                <div style={{fontSize:12.5, fontWeight:700, color:acc, marginBottom:6}}>{bulkParsed.length} customers detected</div>
                <div style={{maxHeight:120, overflowY:"auto"}}>
                  {bulkParsed.slice(0, 8).map((c, i) => (
                    <div key={i} style={{fontSize:12, color:txm, padding:"2px 0"}}>{c.name} · {c.phone}</div>
                  ))}
                  {bulkParsed.length > 8 && <div style={{fontSize:11, color:txf}}>...and {bulkParsed.length - 8} more</div>}
                </div>
              </div>
            )}

            <div style={{fontSize:11.5, color:txf}}>Duplicates are automatically skipped. All imported customers get "new_lead" tag.</div>

            <div style={{display:"flex", gap:8}}>
              <button onClick={() => { setShowBulk(false); setBulkText(""); setBulkParsed([]) }}
                style={{flex:1, padding:"10px", background:ibg, border:"1px solid " + cbdr, borderRadius:8, color:txm, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                Cancel
              </button>
              <button onClick={importBulk} disabled={bulkSaving || bulkParsed.length === 0}
                style={{flex:2, padding:"10px", background:bulkParsed.length > 0 ? acc : ibg, border:"none", borderRadius:8, color:bulkParsed.length > 0 ? "#000" : txf, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", opacity:bulkSaving ? 0.7 : 1}}>
                {bulkSaving ? "Importing..." : "Import " + bulkParsed.length + " Customers"}
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="bnav">
        {[
          { id:"overview", icon:"⬡", label:"Home",     path:"/dashboard" },
          { id:"inbox",    icon:"◎", label:"Chats",    path:"/dashboard/conversations" },
          { id:"bookings", icon:"◷", label:"Bookings", path:"/dashboard/bookings" },
          { id:"leads",    icon:"◉", label:"Leads",    path:"/dashboard/leads" },
          { id:"contacts", icon:"◑", label:"Customers",path:"/dashboard/contacts" },
        ].map(item => (
          <button key={item.id} className={"bni" + (item.id === "contacts" ? " on" : "")} onClick={() => router.push(item.path)}>
            <span className="bnic">{item.icon}</span>
            <span className="bnil">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
