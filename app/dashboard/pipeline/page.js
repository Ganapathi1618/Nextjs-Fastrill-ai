"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth }  from "@/lib/hooks/useAuth"
import { useTheme } from "@/lib/hooks/useTheme"
import { useToast } from "@/components/Toast"
import { usePlanGuard } from "@/lib/hooks/usePlanGuard"

const NAV = [
  { id:"overview",  label:"Revenue Engine", icon:"⬡", path:"/dashboard" },
  { id:"inbox",     label:"Conversations",  icon:"◎", path:"/dashboard/conversations" },
  { id:"bookings",  label:"Bookings",       icon:"◷", path:"/dashboard/bookings" },
  { id:"pipeline",  label:"CRM Pipeline",   icon:"⬦", path:"/dashboard/pipeline" },
  { id:"team",      label:"Team",           icon:"⊕", path:"/dashboard/team" },
  { id:"campaigns", label:"Campaigns",      icon:"◆", path:"/dashboard/campaigns" },
  { id:"sequences", label:"Sequences",      icon:"⟳", path:"/dashboard/sequences" },
  { id:"leads",     label:"Lead Recovery",  icon:"◉", path:"/dashboard/leads" },
  { id:"contacts",  label:"Customers",      icon:"◑", path:"/dashboard/contacts" },
  { id:"analytics",    label:"Analytics",      icon:"▦", path:"/dashboard/analytics" },
  { id:"templates",   label:"WA Templates",  icon:"◫", path:"/dashboard/templates" },
  { id:"integrations",label:"Integrations",  icon:"⊞", path:"/dashboard/integrations" },
  { id:"reports",     label:"Reports",        icon:"▣", path:"/dashboard/reports" },
  { id:"referrals",   label:"Refer & Earn",   icon:"◈", path:"/dashboard/referrals" },
  { id:"settings",    label:"Settings",       icon:"◌", path:"/dashboard/settings" },
]

const STAGES = [
  { id:"new",       label:"New Lead",       color:"#38bdf8" },
  { id:"contacted", label:"Contacted",      color:"#818cf8" },
  { id:"qualified", label:"Qualified",      color:"#f59e0b" },
  { id:"proposal",  label:"Proposal Sent",  color:"#fb923c" },
  { id:"won",       label:"Won",            color:"#4ade80" },
  { id:"lost",      label:"Lost",           color:"#f87171" },
]

export default function Pipeline() {
  usePlanGuard()
  const { userId, userEmail, loading: authLoading, logout } = useAuth()
  const { dark, toggleTheme, colors } = useTheme()
  const toast  = useToast()
  const router = useRouter()

  const [mobOpen,   setMobOpen]   = useState(false)
  const [leads,     setLeads]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [dragging,  setDragging]  = useState(null)
  const [dragOver,  setDragOver]  = useState(null)
  const [selected,  setSelected]  = useState(null)
  const [addStage,  setAddStage]  = useState(null)
  const [newName,   setNewName]   = useState("")
  const [newPhone,  setNewPhone]  = useState("")
  const [newValue,  setNewValue]  = useState("")
  const [saving,    setSaving]    = useState(false)
  const [search,    setSearch]    = useState("")

  useEffect(() => { if (userId) loadLeads() }, [userId])

  async function loadLeads() {
    setLoading(true)
    const { data, error } = await supabase
      .from("leads").select("*, customers(name,phone)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    if (error) { toast.error("Failed to load pipeline"); setLoading(false); return }
    setLeads(data || [])
    setLoading(false)
  }

  async function moveStage(lead, newStage) {
    await supabase.from("leads").update({ status: newStage }).eq("id", lead.id)
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: newStage } : l))
    if (selected?.id === lead.id) setSelected(s => ({ ...s, status: newStage }))
    toast.success(`Moved to ${STAGES.find(s=>s.id===newStage)?.label}`)
  }

  async function addLead() {
    if (!newName.trim()) { toast.error("Name required"); return }
    setSaving(true)
    const { data, error } = await supabase.from("leads").insert([{
      user_id: userId,
      name: newName.trim(),
      phone: newPhone.trim(),
      estimated_value: parseFloat(newValue) || 0,
      status: addStage,
      source: "manual",
      ai_score: 50,
      last_message_at: new Date().toISOString(),
    }]).select()
    setSaving(false)
    if (error) { toast.error("Failed to add lead"); return }
    setLeads(prev => [data[0], ...prev])
    setNewName(""); setNewPhone(""); setNewValue(""); setAddStage(null)
    toast.success("Lead added!")
  }

  const bg    = dark?"#08080e":"#f0f2f5", sb=dark?"#0c0c15":"#ffffff"
  const card  = dark?"#0f0f1a":"#ffffff"
  const bdr   = dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.08)"
  const cbdr  = dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.09)"
  const tx    = dark?"#eeeef5":"#111827"
  const txm   = dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const txf   = dark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.25)"
  const ibg   = dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"
  const acc   = dark?"#00C9B1":"#00897A"
  const adim  = dark?"rgba(0,201,177,0.12)":"rgba(0,137,122,0.1)"
  const navActive = dark?"rgba(0,196,125,0.1)":"rgba(0,180,115,0.08)"
  const navText   = dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const ui = userEmail ? userEmail[0].toUpperCase() : "G"

  const scoreColor = s => s>=70?"#f59e0b":s>=40?"#38bdf8":txm

  const stageLeads = (stageId) => {
    const q = search.toLowerCase()
    return leads.filter(l => {
      const st = l.status||"new"
      const nm = (l.customers?.name||l.name||l.phone||"").toLowerCase()
      return st===stageId && (!q || nm.includes(q))
    })
  }

  const totalValue = leads.filter(l=>l.status==="won").reduce((s,l)=>s+(l.estimated_value||0),0)
  const pipelineValue = leads.filter(l=>!["won","lost"].includes(l.status||"new")).reduce((s,l)=>s+(l.estimated_value||0),0)

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${bg}!important;color:${tx}!important;font-family:'Plus Jakarta Sans',sans-serif!important;}
        .wrap{display:flex;height:100vh;overflow:hidden;}
        .sidebar{width:224px;flex-shrink:0;background:${sb};border-right:1px solid ${bdr};display:flex;flex-direction:column;overflow-y:auto;scrollbar-width:none;}
        .sidebar::-webkit-scrollbar{display:none;}
        .logo{padding:16px 18px;font-weight:800;font-size:20px;color:${tx};text-decoration:none;display:flex;flex-direction:row;align-items:center;gap:10px;border-bottom:1px solid ${bdr};line-height:1;}
        .nav-section{padding:18px 16px 7px;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${txf};font-weight:600;}
        .nav-item{display:flex;align-items:center;gap:9px;padding:8px 12px;margin:1px 8px;border-radius:8px;cursor:pointer;font-size:13px;color:${navText};font-weight:500;transition:all 0.13s;border:1px solid transparent;background:none;width:calc(100% - 16px);text-align:left;font-family:'Plus Jakarta Sans',sans-serif;}
        .nav-item:hover{background:${ibg};color:${tx};}
        .nav-item.active{background:${navActive};color:${colors.navActiveText};font-weight:600;border-color:${colors.navActiveBdr};}
        .nav-icon{font-size:13px;width:18px;text-align:center;flex-shrink:0;}
        .sbf{margin-top:auto;padding:14px;border-top:1px solid ${bdr};}
        .uc{display:flex;align-items:center;gap:9px;padding:9px;border-radius:9px;background:${ibg};border:1px solid ${cbdr};}
        .ua{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,${acc},#0ea5e9);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#fff;flex-shrink:0;}
        .lb{margin-top:7px;width:100%;padding:7px;border-radius:7px;background:transparent;border:1px solid ${cbdr};font-size:12px;color:${txm};cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .lb:hover{border-color:#fca5a5;color:#ef4444;}
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .topbar{height:54px;flex-shrink:0;border-bottom:1px solid ${bdr};display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:${sb};}
        .content{flex:1;overflow:hidden;display:flex;flex-direction:column;gap:0;background:${bg};}
        .theme-toggle{display:flex;align-items:center;gap:6px;padding:5px 10px;background:${ibg};border:1px solid ${cbdr};border-radius:8px;cursor:pointer;font-size:11.5px;color:${txm};font-family:'Plus Jakarta Sans',sans-serif;}
        .toggle-pill{width:30px;height:16px;border-radius:100px;background:${dark?acc:"#d1d5db"};position:relative;flex-shrink:0;}
        .toggle-pill::after{content:'';position:absolute;top:2px;width:12px;height:12px;border-radius:50%;background:#fff;left:${dark?"16px":"2px"};}
        .hamburger{display:none;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:6px 9px;cursor:pointer;font-size:17px;color:#eeeef5;line-height:1;margin-right:2px;}
        .mob-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:299;cursor:pointer;}
        .board{display:flex;gap:12px;padding:16px 20px;overflow-x:auto;flex:1;align-items:flex-start;scrollbar-width:thin;scrollbar-color:${cbdr} transparent;}
        .col{min-width:240px;width:240px;flex-shrink:0;display:flex;flex-direction:column;gap:0;border-radius:12px;background:${ibg};border:1px solid ${bdr}}
        .col-hd{padding:11px 13px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid ${bdr}}
        .col-title{font-size:12px;font-weight:700;display:flex;align-items:center;gap:7px}
        .col-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
        .col-count{font-size:10px;color:${txm};background:${ibg};border:1px solid ${cbdr};border-radius:100px;padding:1px 7px;font-weight:600}
        .col-add{background:transparent;border:none;color:${txm};cursor:pointer;font-size:15px;padding:2px 4px;border-radius:5px;line-height:1}
        .col-add:hover{color:${tx};background:${ibg}}
        .col-cards{padding:8px;display:flex;flex-direction:column;gap:7px;min-height:80px;max-height:calc(100vh - 220px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:${cbdr} transparent}
        .col-cards.drag-over{background:${adim};border-radius:8px}
        .lead-card{background:${card};border:1px solid ${cbdr};border-radius:9px;padding:10px 12px;cursor:pointer;transition:border-color 0.12s,box-shadow 0.12s;user-select:none}
        .lead-card:hover{border-color:${acc}55;box-shadow:0 2px 10px rgba(0,0,0,0.12)}
        .lead-card.dragging{opacity:0.4}
        .lead-card.selected{border-color:${acc};background:${adim}}
        .add-form{background:${card};border:1px solid ${acc}55;border-radius:9px;padding:10px 12px;display:flex;flex-direction:column;gap:7px}
        .add-input{background:${ibg};border:1px solid ${cbdr};border-radius:7px;padding:7px 10px;font-size:12px;color:${tx};outline:none;font-family:'Plus Jakarta Sans',sans-serif;width:100%}
        .modal-ov{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:400;display:flex;align-items:center;justify-content:center;padding:16px}
        .modal{background:${sb};border:1px solid ${cbdr};border-radius:16px;padding:24px;width:100%;max-width:380px;display:flex;flex-direction:column;gap:14px}
        @media(max-width:767px){
          .sidebar{position:fixed;top:0;left:0;height:100vh;z-index:300;transform:translateX(-100%);transition:transform 0.25s ease;width:240px!important;box-shadow:4px 0 24px rgba(0,0,0,0.5);}
          .sidebar.mob-open{transform:translateX(0);}
          .mob-ov{display:block;}
          .hamburger{display:flex!important;}
          .topbar{padding:0 12px!important;}
          .board{padding:12px;}
          .col{min-width:220px;width:220px;}
        }
        .bnav{display:none;position:fixed;bottom:0;left:0;right:0;background:${sb};border-top:1px solid ${bdr};padding:6px 0 calc(6px + env(safe-area-inset-bottom));z-index:200;}
        @media(max-width:767px){.bnav{display:flex;justify-content:space-around;}.main{padding-bottom:60px;}}
        .bni{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 6px;border:none;background:transparent;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;flex:1;}
        .bnic{font-size:17px;color:rgba(255,255,255,0.3);}
        .bnil{font-size:9px;font-weight:600;color:rgba(255,255,255,0.3);}
        .bni.on .bnic,.bni.on .bnil{color:${acc};}
      `}</style>

      <div className={"mob-ov"+(mobOpen?" open":"")} onClick={()=>setMobOpen(false)}/>

      <div className="wrap">
        <aside className={`sidebar${mobOpen?" mob-open":""}`}>
          <a href="/dashboard" className="logo">
            <img src="/logo.png" width="34" height="34" alt="Fastrill" style={{display:"block",objectFit:"contain",flexShrink:0}}/>
            <span style={{fontWeight:800,fontSize:20,color:tx,letterSpacing:"-0.3px",lineHeight:1}}>fast<span style={{color:acc}}>rill</span></span>
          </a>
          <div className="nav-section">Platform</div>
          {NAV.map(item=>(
            <button key={item.id} className={`nav-item${item.id==="pipeline"?" active":""}`} onClick={()=>router.push(item.path)}>
              <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
          <div className="sbf">
            <div className="uc">
              <div className="ua">{ui}</div>
              <div style={{fontSize:11.5,color:txm,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{userEmail||"Loading..."}</div>
            </div>
            <button className="lb" onClick={logout}>↩ Sign out</button>
          </div>
        </aside>

        <div className="main">
          <div className="topbar">
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button className="hamburger" onClick={()=>setMobOpen(s=>!s)}>☰</button>
              <span style={{fontWeight:700,fontSize:15,color:tx}}>CRM Pipeline</span>
              <span style={{fontSize:11,color:txm,padding:"2px 9px",background:ibg,border:`1px solid ${cbdr}`,borderRadius:100,marginLeft:4}}>
                {leads.filter(l=>!["won","lost"].includes(l.status||"new")).length} active
              </span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search leads…"
                style={{background:ibg,border:`1px solid ${cbdr}`,borderRadius:8,padding:"5px 11px",fontSize:12,color:tx,outline:"none",fontFamily:"'Plus Jakarta Sans',sans-serif",width:160}}/>
              <button className="theme-toggle" onClick={toggleTheme}>
                <span>{dark?"🌙":"☀️"}</span><div className="toggle-pill"/><span>{dark?"Dark":"Light"}</span>
              </button>
            </div>
          </div>

          {/* KPI strip */}
          <div style={{display:"flex",gap:0,borderBottom:`1px solid ${bdr}`,background:sb}}>
            {[
              {l:"Total Leads",    v:leads.length,           c:tx},
              {l:"Pipeline Value", v:`₹${pipelineValue.toLocaleString()}`,  c:"#f59e0b"},
              {l:"Won Value",      v:`₹${totalValue.toLocaleString()}`,      c:"#4ade80"},
              {l:"Closed Rate",    v:leads.length?Math.round(leads.filter(l=>l.status==="won").length/leads.length*100)+"%":"0%", c:acc},
            ].map((s,i)=>(
              <div key={s.l} style={{flex:1,padding:"11px 18px",borderRight:i<3?`1px solid ${bdr}`:"none"}}>
                <div style={{fontSize:10,color:txm,marginBottom:3}}>{s.l}</div>
                <div style={{fontSize:18,fontWeight:700,color:s.c}}>{loading?"…":s.v}</div>
              </div>
            ))}
          </div>

          <div className="content">
            <div className="board">
              {STAGES.map(stage=>{
                const cards = stageLeads(stage.id)
                return (
                  <div key={stage.id} className="col"
                    onDragOver={e=>{e.preventDefault();setDragOver(stage.id)}}
                    onDrop={e=>{e.preventDefault();if(dragging)moveStage(dragging,stage.id);setDragging(null);setDragOver(null)}}
                  >
                    <div className="col-hd">
                      <div className="col-title">
                        <span className="col-dot" style={{background:stage.color}}/>
                        <span style={{color:tx,fontSize:12}}>{stage.label}</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span className="col-count">{cards.length}</span>
                        <button className="col-add" onClick={()=>setAddStage(stage.id)}>+</button>
                      </div>
                    </div>
                    <div className={`col-cards${dragOver===stage.id?" drag-over":""}`}>
                      {addStage===stage.id&&(
                        <div className="add-form">
                          <input className="add-input" placeholder="Name *" value={newName} onChange={e=>setNewName(e.target.value)} autoFocus/>
                          <input className="add-input" placeholder="Phone" value={newPhone} onChange={e=>setNewPhone(e.target.value)}/>
                          <input className="add-input" placeholder="Deal value (₹)" type="number" value={newValue} onChange={e=>setNewValue(e.target.value)}/>
                          <div style={{display:"flex",gap:5}}>
                            <button onClick={addLead} disabled={saving}
                              style={{flex:1,padding:"6px",borderRadius:7,background:acc,border:"none",color:"#000",fontWeight:700,fontSize:11.5,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                              {saving?"…":"Add"}
                            </button>
                            <button onClick={()=>{setAddStage(null);setNewName("");setNewPhone("");setNewValue("")}}
                              style={{padding:"6px 10px",borderRadius:7,background:ibg,border:`1px solid ${cbdr}`,color:txm,fontSize:11.5,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
                      {cards.length===0&&addStage!==stage.id&&(
                        <div style={{textAlign:"center",padding:"20px 8px",color:txf,fontSize:11}}>Drop leads here</div>
                      )}
                      {cards.map(lead=>{
                        const name = lead.customers?.name||lead.name||lead.phone||"Unknown"
                        const score = lead.ai_score||0
                        return(
                          <div key={lead.id}
                            className={`lead-card${dragging?.id===lead.id?" dragging":""}${selected?.id===lead.id?" selected":""}`}
                            draggable
                            onDragStart={()=>setDragging(lead)}
                            onDragEnd={()=>{setDragging(null);setDragOver(null)}}
                            onClick={()=>setSelected(selected?.id===lead.id?null:lead)}
                          >
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                              <span style={{fontWeight:700,fontSize:12.5,color:tx,lineHeight:1.3}}>{name}</span>
                              <span style={{fontSize:10,fontWeight:700,color:scoreColor(score),background:scoreColor(score)+"18",borderRadius:100,padding:"1px 6px",flexShrink:0,marginLeft:4}}>
                                {score>=70?"🔥":score>=40?"♨":"❄"} {score}
                              </span>
                            </div>
                            {lead.estimated_value>0&&(
                              <div style={{fontSize:12,fontWeight:700,color:acc,marginBottom:4}}>₹{lead.estimated_value.toLocaleString()}</div>
                            )}
                            {lead.last_message&&(
                              <div style={{fontSize:11,color:txm,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lead.last_message}</div>
                            )}
                            {lead.source&&(
                              <div style={{marginTop:5,fontSize:10,color:txf,display:"flex",alignItems:"center",gap:4}}>
                                <span style={{background:ibg,border:`1px solid ${cbdr}`,borderRadius:4,padding:"1px 6px"}}>{lead.source}</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Lead detail modal */}
      {selected&&(
        <div className="modal-ov" onClick={e=>{if(e.target===e.currentTarget)setSelected(null)}}>
          <div className="modal">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontWeight:700,fontSize:15,color:tx}}>{selected.customers?.name||selected.name||selected.phone||"Lead"}</span>
              <button onClick={()=>setSelected(null)} style={{background:"transparent",border:"none",color:txf,cursor:"pointer",fontSize:20,lineHeight:1}}>×</button>
            </div>
            {[
              ["Phone",  selected.phone||selected.customers?.phone||"—"],
              ["Source", selected.source||"WhatsApp"],
              ["Score",  `${selected.ai_score||0} / 100`],
              ["Value",  selected.estimated_value?`₹${selected.estimated_value.toLocaleString()}`:"—"],
              ["Stage",  STAGES.find(s=>s.id===(selected.status||"new"))?.label||"New Lead"],
              ["Last contact", selected.last_message_at?new Date(selected.last_message_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):"—"],
            ].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${bdr}`}}>
                <span style={{fontSize:12,color:txm}}>{l}</span>
                <span style={{fontSize:12.5,fontWeight:600,color:tx}}>{v}</span>
              </div>
            ))}
            {selected.last_message&&(
              <div style={{background:ibg,border:`1px solid ${cbdr}`,borderRadius:8,padding:"9px 12px",fontSize:12,color:txm,lineHeight:1.6}}>"{selected.last_message}"</div>
            )}
            <div>
              <div style={{fontSize:11,color:txm,marginBottom:7,fontWeight:600}}>Move to stage</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {STAGES.filter(s=>s.id!==(selected.status||"new")).map(s=>(
                  <button key={s.id} onClick={()=>{moveStage(selected,s.id);setSelected(null)}}
                    style={{padding:"5px 12px",borderRadius:7,background:s.color+"18",border:`1px solid ${s.color}44`,color:s.color,fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                    → {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="bnav">
        {[
          {id:"overview",  icon:"⬡",label:"Home",    path:"/dashboard"},
          {id:"inbox",     icon:"◎",label:"Chats",   path:"/dashboard/conversations"},
          {id:"pipeline",  icon:"⬦",label:"Pipeline",path:"/dashboard/pipeline"},
          {id:"leads",     icon:"◉",label:"Leads",   path:"/dashboard/leads"},
          {id:"contacts",  icon:"◑",label:"Contacts",path:"/dashboard/contacts"},
        ].map(item=>(
          <button key={item.id} className={"bni"+(item.id==="pipeline"?" on":"")} onClick={()=>router.push(item.path)}>
            <span className="bnic">{item.icon}</span>
            <span className="bnil">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
