"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth }  from "@/lib/hooks/useAuth"
import { useTheme } from "@/lib/hooks/useTheme"
import { useToast } from "@/components/Toast"
import { usePlanGuard } from "@/lib/hooks/usePlanGuard"

const NAV = [
  { id:"overview",     label:"Revenue Engine",  icon:"⬡", path:"/dashboard" },
  { id:"inbox",        label:"Conversations",   icon:"◎", path:"/dashboard/conversations" },
  { id:"bookings",     label:"Bookings",        icon:"◷", path:"/dashboard/bookings" },
  { id:"pipeline",     label:"CRM Pipeline",    icon:"⬦", path:"/dashboard/pipeline" },
  { id:"team",         label:"Team",            icon:"⊕", path:"/dashboard/team" },
  { id:"campaigns",    label:"Campaigns",       icon:"◆", path:"/dashboard/campaigns" },
  { id:"sequences",    label:"Sequences",       icon:"⟳", path:"/dashboard/sequences" },
  { id:"leads",        label:"Lead Recovery",   icon:"◉", path:"/dashboard/leads" },
  { id:"contacts",     label:"Customers",       icon:"◑", path:"/dashboard/contacts" },
  { id:"analytics",    label:"Analytics",       icon:"▦", path:"/dashboard/analytics" },
  { id:"templates",    label:"WA Templates",    icon:"▤", path:"/dashboard/templates" },
  { id:"integrations", label:"Integrations",    icon:"⌁", path:"/dashboard/integrations" },
  { id:"reports",      label:"Reports",         icon:"⊟", path:"/dashboard/reports" },
  { id:"referrals",    label:"Refer & Earn",    icon:"◈", path:"/dashboard/referrals" },
  { id:"settings",     label:"Settings",        icon:"◌", path:"/dashboard/settings" },
]

const CATEGORIES = ["All","Booking","Reminder","Promotion","Follow-up","Lead Recovery","Post-visit","Custom"]
const STATUS_COLORS = { approved:"#4ade80", pending:"#f59e0b", rejected:"#f87171", draft:"#9ca3af" }

const SAMPLE_TEMPLATES = [
  { id:"t1", name:"booking_confirmation", category:"Booking", status:"approved", lang:"en",
    body:"Hi {{1}}, your {{2}} appointment is confirmed for {{3}} at {{4}}. Reply CANCEL to cancel or RESCHEDULE to change. — {{5}}",
    variables:["Customer Name","Service","Date","Time","Business Name"], usedIn:["campaigns","sequences"] },
  { id:"t2", name:"appointment_reminder_24h", category:"Reminder", status:"approved", lang:"en",
    body:"Hi {{1}}, gentle reminder — your {{2}} is tomorrow at {{3}}. Reply CONFIRM to confirm or RESCHEDULE to change your slot.",
    variables:["Customer Name","Service","Time"], usedIn:["sequences"] },
  { id:"t3", name:"lead_recovery_day1", category:"Lead Recovery", status:"approved", lang:"en",
    body:"Hi {{1}}, you enquired about {{2}} recently. We'd love to have you in — slots are filling up this week. Want to book?",
    variables:["Customer Name","Service"], usedIn:["sequences"] },
  { id:"t4", name:"festive_offer", category:"Promotion", status:"approved", lang:"en",
    body:"🎉 Hi {{1}}! Exclusive offer this week — {{2}} at just ₹{{3}}. Limited slots. Book now: reply YES.",
    variables:["Customer Name","Service","Price"], usedIn:["campaigns"] },
  { id:"t5", name:"hindi_booking_confirm", category:"Booking", status:"approved", lang:"hi",
    body:"Namaste {{1}} ji, aapka {{2}} appointment confirm ho gaya hai — {{3}} ko {{4}} baje. — {{5}}",
    variables:["Customer Name","Service","Date","Time","Business Name"], usedIn:["campaigns"] },
  { id:"t6", name:"post_visit_review", category:"Post-visit", status:"pending", lang:"en",
    body:"Hi {{1}}, thank you for visiting {{2}}! How was your experience? We'd love a quick Google review 🙏 {{3}}",
    variables:["Customer Name","Business Name","Review Link"], usedIn:[] },
  { id:"t7", name:"winback_30days", category:"Follow-up", status:"approved", lang:"en",
    body:"Hi {{1}}, it's been a while! Your favourite {{2}} is ready for you. 10% off this week only — book at {{3}}.",
    variables:["Customer Name","Service","Booking Link"], usedIn:["sequences"] },
  { id:"t8", name:"real_estate_followup", category:"Follow-up", status:"draft", lang:"en",
    body:"Hi {{1}}, following up on your interest in {{2}}. New inventory just arrived. Want to schedule a site visit?",
    variables:["Customer Name","Project Name"], usedIn:[] },
]

const LANG_LABELS = { en:"🇬🇧 English", hi:"🇮🇳 Hindi", te:"Telugu", ta:"Tamil", kn:"Kannada", ml:"Malayalam" }

export default function Templates() {
  usePlanGuard()
  const { userId, userEmail, loading: authLoading, logout } = useAuth()
  const { dark, toggleTheme, colors } = useTheme()
  const toast = useToast()
  const router = useRouter()

  const [mobOpen,   setMobOpen]   = useState(false)
  const [templates, setTemplates] = useState(SAMPLE_TEMPLATES)
  const [selected,  setSelected]  = useState(null)
  const [filter,    setFilter]    = useState("All")
  const [showNew,   setShowNew]   = useState(false)
  const [newTpl,    setNewTpl]    = useState({ name:"", category:"Booking", body:"", lang:"en" })
  const [saving,    setSaving]    = useState(false)
  const [copying,   setCopying]   = useState(null)

  function copyVariable(tplId, variable) {
    navigator.clipboard.writeText(`{{${variable}}}`)
    setCopying(variable)
    setTimeout(()=>setCopying(null),1200)
    toast.success("Copied to clipboard")
  }

  async function submitTemplate() {
    if (!newTpl.name.trim()||!newTpl.body.trim()) { toast.error("Name and body required"); return }
    setSaving(true)
    await new Promise(r=>setTimeout(r,900))
    const tpl = { id:"t"+Date.now(), ...newTpl, status:"pending", usedIn:[] }
    setTemplates(p=>[tpl,...p])
    toast.success("Template submitted for Meta approval (1-3 business days)")
    setShowNew(false)
    setNewTpl({ name:"", category:"Booking", body:"", lang:"en" })
    setSaving(false)
  }

  const bg   = dark?"#08080e":"#f0f2f5", sb=dark?"#0c0c15":"#ffffff"
  const card = dark?"#0f0f1a":"#ffffff"
  const bdr  = dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.08)"
  const cbdr = dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.09)"
  const tx   = dark?"#eeeef5":"#111827"
  const txm  = dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const txf  = dark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.25)"
  const ibg  = dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"
  const acc  = dark?"#00C9B1":"#00897A"
  const navActive = dark?"rgba(0,196,125,0.1)":"rgba(0,180,115,0.08)"
  const navText   = dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const ui = userEmail?userEmail[0].toUpperCase():"G"

  const filtered = filter==="All" ? templates : templates.filter(t=>t.category===filter)
  const approved = templates.filter(t=>t.status==="approved").length

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${bg}!important;color:${tx}!important;font-family:'Plus Jakarta Sans',sans-serif!important;}
        .wrap{display:flex;height:100vh;overflow:hidden;}
        .sidebar{width:224px;flex-shrink:0;background:${sb};border-right:1px solid ${bdr};display:flex;flex-direction:column;overflow-y:auto;}
        .logo{padding:16px 18px;font-weight:800;font-size:20px;color:${tx};text-decoration:none;display:flex;align-items:center;gap:10px;border-bottom:1px solid ${bdr};line-height:1;}
        .nav-section{padding:14px 16px 5px;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${txf};font-weight:600;}
        .nav-item{display:flex;align-items:center;gap:9px;padding:8px 12px;margin:1px 8px;border-radius:8px;cursor:pointer;font-size:13px;color:${navText};font-weight:500;transition:all 0.13s;border:1px solid transparent;background:none;width:calc(100% - 16px);text-align:left;font-family:'Plus Jakarta Sans',sans-serif;}
        .nav-item:hover{background:${ibg};color:${tx};}
        .nav-item.active{background:${navActive};color:${colors.navActiveText};font-weight:600;border-color:${colors.navActiveBdr};}
        .nav-icon{font-size:12px;width:18px;text-align:center;flex-shrink:0;}
        .sbf{margin-top:auto;padding:14px;border-top:1px solid ${bdr};}
        .uc{display:flex;align-items:center;gap:9px;padding:9px;border-radius:9px;background:${ibg};border:1px solid ${cbdr};}
        .ua{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,${acc},#0ea5e9);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#fff;flex-shrink:0;}
        .lb{margin-top:7px;width:100%;padding:7px;border-radius:7px;background:transparent;border:1px solid ${cbdr};font-size:12px;color:${txm};cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .lb:hover{border-color:#fca5a5;color:#ef4444;}
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .topbar{height:54px;flex-shrink:0;border-bottom:1px solid ${bdr};display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:${sb};}
        .content{flex:1;overflow-y:auto;padding:20px 24px;background:${bg};}
        .theme-toggle{display:flex;align-items:center;gap:6px;padding:5px 10px;background:${ibg};border:1px solid ${cbdr};border-radius:8px;cursor:pointer;font-size:11.5px;color:${txm};font-family:'Plus Jakarta Sans',sans-serif;}
        .toggle-pill{width:30px;height:16px;border-radius:100px;background:${dark?acc:"#d1d5db"};position:relative;flex-shrink:0;}
        .toggle-pill::after{content:'';position:absolute;top:2px;width:12px;height:12px;border-radius:50%;background:#fff;left:${dark?"16px":"2px"};}
        .hamburger{display:none;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:6px 9px;cursor:pointer;font-size:17px;color:#eeeef5;line-height:1;margin-right:2px;}
        .mob-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:299;cursor:pointer;}
        .stats4{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;}
        .tpl-grid{display:grid;grid-template-columns:1fr 340px;gap:14px;margin-top:16px;}
        @media(max-width:900px){.stats4{grid-template-columns:repeat(2,1fr);}}
        .tpl-list{display:flex;flex-direction:column;gap:8px;}
        .tpl-card{background:${card};border:1px solid ${cbdr};border-radius:11px;padding:14px 16px;cursor:pointer;transition:border-color 0.12s;}
        .tpl-card:hover{border-color:${acc}44}
        .tpl-card.sel{border-color:${acc};background:${acc}0a}
        .preview-box{background:#EFE7DB;border-radius:12px;padding:13px 14px;font-size:12.5px;line-height:1.6;color:#1B1B18;white-space:pre-wrap;position:relative;}
        .preview-box::before{content:'';position:absolute;top:-6px;left:14px;width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:6px solid #EFE7DB;}
        .var-pill{display:inline-flex;align-items:center;gap:4px;background:${ibg};border:1px solid ${cbdr};borderRadius:6px;padding:3px 8px;font-size:11px;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;color:${txm};transition:border-color 0.1s;}
        .var-pill:hover{border-color:${acc}55;color:${acc}}
        .modal-ov{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:400;display:flex;align-items:center;justify-content:center;padding:16px}
        .modal{background:${sb};border:1px solid ${cbdr};border-radius:16px;padding:24px;width:100%;max-width:480px;display:flex;flex-direction:column;gap:13px;max-height:90vh;overflow-y:auto}
        .inp{background:${ibg};border:1px solid ${cbdr};border-radius:8px;padding:9px 12px;font-size:13px;color:${tx};outline:none;width:100%;font-family:'Plus Jakarta Sans',sans-serif;}
        .inp:focus{border-color:${acc}66}
        .sel{appearance:none;-webkit-appearance:none;background:${ibg};border:1px solid ${cbdr};border-radius:8px;padding:9px 12px;font-size:13px;color:${tx};outline:none;width:100%;font-family:'Plus Jakarta Sans',sans-serif;}
        .sel option{background:${dark?"#12121f":"#ffffff"};color:${tx};}
        @media(max-width:900px){.tpl-grid{grid-template-columns:1fr;}}
        @media(max-width:767px){
          .sidebar{position:fixed;top:0;left:0;height:100vh;z-index:300;transform:translateX(-100%);transition:transform 0.25s ease;width:240px!important;box-shadow:4px 0 24px rgba(0,0,0,0.5);}
          .sidebar.mob-open{transform:translateX(0);}
          .mob-ov{display:block;}
          .hamburger{display:flex!important;}
          .topbar{padding:0 12px!important;}
          .content{padding:12px!important;}
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
            <button key={item.id} className={`nav-item${item.id==="templates"?" active":""}`} onClick={()=>router.push(item.path)}>
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
              <span style={{fontWeight:700,fontSize:15,color:tx}}>WhatsApp Templates</span>
              <span style={{fontSize:11,color:"#4ade80",padding:"2px 9px",background:"#4ade8018",border:"1px solid #4ade8033",borderRadius:100,marginLeft:4}}>{approved} approved</span>
            </div>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <button onClick={()=>setShowNew(true)}
                style={{padding:"7px 14px",borderRadius:8,background:acc,border:"none",color:"#000",fontWeight:700,fontSize:12.5,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                + New Template
              </button>
              <button className="theme-toggle" onClick={toggleTheme}>
                <span>{dark?"🌙":"☀️"}</span><div className="toggle-pill"/><span>{dark?"Dark":"Light"}</span>
              </button>
            </div>
          </div>

          <div className="content">
            {/* Stats */}
            <div className="stats4">
              {[
                {l:"Total",    v:templates.length,                                    c:tx},
                {l:"Approved", v:templates.filter(t=>t.status==="approved").length,   c:"#4ade80"},
                {l:"Pending",  v:templates.filter(t=>t.status==="pending").length,    c:"#f59e0b"},
                {l:"Rejected", v:templates.filter(t=>t.status==="rejected").length,   c:"#f87171"},
              ].map(s=>(
                <div key={s.l} style={{background:card,border:`1px solid ${cbdr}`,borderRadius:11,padding:"12px 15px"}}>
                  <div style={{fontSize:11,color:txm,marginBottom:4}}>{s.l}</div>
                  <div style={{fontSize:22,fontWeight:700,color:s.c}}>{s.v}</div>
                </div>
              ))}
            </div>

            {/* Filter */}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:4}}>
              {CATEGORIES.map(c=>(
                <button key={c} onClick={()=>setFilter(c)}
                  style={{padding:"4px 12px",borderRadius:100,fontSize:11.5,fontWeight:600,cursor:"pointer",border:`1px solid ${filter===c?acc+"55":cbdr}`,background:filter===c?acc+"18":"transparent",color:filter===c?acc:txm,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  {c}
                </button>
              ))}
            </div>

            <div className="tpl-grid">
              <div className="tpl-list">
                {filtered.map(tpl=>(
                  <div key={tpl.id} className={`tpl-card${selected?.id===tpl.id?" sel":""}`} onClick={()=>setSelected(selected?.id===tpl.id?null:tpl)}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:13,color:tx,marginBottom:3}}>{tpl.name}</div>
                        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                          <span style={{fontSize:10,fontWeight:700,color:STATUS_COLORS[tpl.status]||txm,background:(STATUS_COLORS[tpl.status]||txm)+"18",border:`1px solid ${(STATUS_COLORS[tpl.status]||txm)}33`,borderRadius:100,padding:"1px 7px"}}>{tpl.status}</span>
                          <span style={{fontSize:10,color:txm,background:ibg,border:`1px solid ${cbdr}`,borderRadius:100,padding:"1px 7px"}}>{tpl.category}</span>
                          <span style={{fontSize:10,color:txm,background:ibg,border:`1px solid ${cbdr}`,borderRadius:100,padding:"1px 7px"}}>{LANG_LABELS[tpl.lang]||tpl.lang}</span>
                        </div>
                      </div>
                      {tpl.usedIn.length>0&&<span style={{fontSize:10,color:txf,whiteSpace:"nowrap"}}>Used in {tpl.usedIn.join(", ")}</span>}
                    </div>
                    <div style={{fontSize:12,color:txm,lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{tpl.body}</div>
                  </div>
                ))}
              </div>

              {/* Detail */}
              <div>
                {selected?(
                  <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:13,padding:18,position:"sticky",top:0}}>
                    <div style={{fontWeight:700,fontSize:13,color:tx,marginBottom:4}}>{selected.name}</div>
                    <div style={{display:"flex",gap:5,marginBottom:14,flexWrap:"wrap"}}>
                      <span style={{fontSize:10,fontWeight:700,color:STATUS_COLORS[selected.status],background:STATUS_COLORS[selected.status]+"18",borderRadius:100,padding:"2px 9px",border:`1px solid ${STATUS_COLORS[selected.status]}33`}}>{selected.status}</span>
                      <span style={{fontSize:10,color:txm,background:ibg,border:`1px solid ${cbdr}`,borderRadius:100,padding:"2px 9px"}}>{selected.category}</span>
                    </div>

                    {/* WhatsApp preview */}
                    <div style={{marginBottom:14}}>
                      <div style={{fontSize:11,fontWeight:600,color:txm,marginBottom:8}}>Preview</div>
                      <div style={{background:"#EFE7DB",borderRadius:12,padding:"10px 14px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,background:"#075E54",borderRadius:"8px 8px 0 0",margin:"-10px -14px 10px",padding:"8px 12px"}}>
                          <div style={{width:24,height:24,borderRadius:"50%",background:"#F3C26B",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#7C3E0A"}}>B</div>
                          <span style={{fontSize:11,color:"#fff",fontWeight:600}}>Your Business</span>
                        </div>
                        <div className="preview-box">{selected.body}</div>
                      </div>
                    </div>

                    {/* Variables */}
                    {selected.variables?.length>0&&(
                      <div>
                        <div style={{fontSize:11,fontWeight:600,color:txm,marginBottom:7}}>Variables — click to copy</div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                          {selected.variables.map((v,i)=>(
                            <button key={v} className="var-pill" onClick={()=>copyVariable(selected.id,i+1)}
                              style={{background:ibg,border:`1px solid ${copying===i+1?acc:cbdr}`,borderRadius:6,padding:"3px 9px",fontSize:11,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",color:copying===i+1?acc:txm}}>
                              {`{{${i+1}}}`} {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {selected.usedIn?.length>0&&(
                      <div style={{marginTop:14,padding:"10px 12px",background:ibg,border:`1px solid ${cbdr}`,borderRadius:8}}>
                        <div style={{fontSize:11,color:txm}}>Used in: <strong style={{color:tx}}>{selected.usedIn.join(" · ")}</strong></div>
                      </div>
                    )}

                    {selected.status==="rejected"&&(
                      <div style={{marginTop:12,padding:"10px 12px",background:"#f8717118",border:"1px solid #f8717133",borderRadius:8,fontSize:12,color:"#f87171",lineHeight:1.5}}>
                        ⚠ Rejected by Meta. Review the body for policy violations and resubmit.
                      </div>
                    )}
                  </div>
                ):(
                  <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:13,padding:"40px 20px",textAlign:"center"}}>
                    <div style={{fontSize:28,opacity:0.2,marginBottom:10}}>▤</div>
                    <div style={{fontSize:12,color:txf,lineHeight:1.7}}>Select a template<br/>to preview and manage</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showNew&&(
        <div className="modal-ov" onClick={e=>{if(e.target===e.currentTarget)setShowNew(false)}}>
          <div className="modal">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontWeight:700,fontSize:15,color:tx}}>New WhatsApp Template</span>
              <button onClick={()=>setShowNew(false)} style={{background:"transparent",border:"none",color:txf,cursor:"pointer",fontSize:20,lineHeight:1}}>×</button>
            </div>
            <div style={{background:"#f59e0b18",border:"1px solid #f59e0b33",borderRadius:8,padding:"10px 12px",fontSize:12,color:"#f59e0b",lineHeight:1.5}}>
              ⚡ Templates require Meta approval (1–3 business days). Only approved templates can be used in campaigns sent outside 24h.
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:600,color:txm,marginBottom:5}}>Template name (lowercase, underscores only)</div>
              <input className="inp" placeholder="e.g. booking_reminder_24h" value={newTpl.name}
                onChange={e=>setNewTpl(p=>({...p,name:e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,"")}))}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:txm,marginBottom:5}}>Category</div>
                <select className="sel" value={newTpl.category} onChange={e=>setNewTpl(p=>({...p,category:e.target.value}))}>
                  {CATEGORIES.filter(c=>c!=="All").map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:txm,marginBottom:5}}>Language</div>
                <select className="sel" value={newTpl.lang} onChange={e=>setNewTpl(p=>({...p,lang:e.target.value}))}>
                  {Object.entries(LANG_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:600,color:txm,marginBottom:5}}>Message body — use {`{{1}}`}, {`{{2}}`} for variables</div>
              <textarea className="inp" rows={5} placeholder={`Hi {{1}}, your {{2}} appointment is confirmed for {{3}}.`}
                value={newTpl.body} onChange={e=>setNewTpl(p=>({...p,body:e.target.value}))}
                style={{resize:"vertical",lineHeight:1.6}}/>
            </div>
            <button onClick={submitTemplate} disabled={saving}
              style={{padding:"11px",borderRadius:9,background:acc,border:"none",color:"#000",fontWeight:700,fontSize:13.5,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",opacity:saving?0.6:1}}>
              {saving?"Submitting to Meta…":"Submit for approval →"}
            </button>
          </div>
        </div>
      )}

      <nav className="bnav">
        {[
          {id:"overview",  icon:"⬡",label:"Home",      path:"/dashboard"},
          {id:"campaigns", icon:"◆",label:"Campaigns", path:"/dashboard/campaigns"},
          {id:"templates", icon:"▤",label:"Templates", path:"/dashboard/templates"},
          {id:"sequences", icon:"⟳",label:"Sequences", path:"/dashboard/sequences"},
          {id:"settings",  icon:"◌",label:"Settings",  path:"/dashboard/settings"},
        ].map(item=>(
          <button key={item.id} className={"bni"+(item.id==="templates"?" on":"")} onClick={()=>router.push(item.path)}>
            <span className="bnic">{item.icon}</span><span className="bnil">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
