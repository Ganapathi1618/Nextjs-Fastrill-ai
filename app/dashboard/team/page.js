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
  { id:"analytics", label:"Analytics",      icon:"▦", path:"/dashboard/analytics" },
  { id:"settings",  label:"Settings",       icon:"◌", path:"/dashboard/settings" },
]

const ROLES = ["Admin","Sales Rep","Support Agent","Manager"]
const ROLE_COLORS = { Admin:"#f59e0b", "Sales Rep":"#38bdf8", "Support Agent":"#a78bfa", Manager:"#4ade80" }

const MOCK_TEAM = [
  { id:"t1", name:"Priya Nair",    email:"priya@salon.com",   role:"Admin",        leads:24, conversations:87, status:"online",  avatar:"P" },
  { id:"t2", name:"Ravi Kumar",    email:"ravi@salon.com",    role:"Sales Rep",    leads:18, conversations:54, status:"online",  avatar:"R" },
  { id:"t3", name:"Sneha Reddy",   email:"sneha@salon.com",   role:"Support Agent",leads:9,  conversations:41, status:"offline", avatar:"S" },
  { id:"t4", name:"Arjun Mehta",   email:"arjun@salon.com",   role:"Sales Rep",    leads:31, conversations:96, status:"online",  avatar:"A" },
]

export default function Team() {
  usePlanGuard()
  const { userId, userEmail, loading: authLoading, logout } = useAuth()
  const { dark, toggleTheme, colors } = useTheme()
  const toast  = useToast()
  const router = useRouter()

  const [mobOpen,    setMobOpen]    = useState(false)
  const [team,       setTeam]       = useState(MOCK_TEAM)
  const [leads,      setLeads]      = useState([])
  const [selected,   setSelected]   = useState(null)
  const [showInvite, setShowInvite] = useState(false)
  const [invEmail,   setInvEmail]   = useState("")
  const [invRole,    setInvRole]    = useState("Sales Rep")
  const [invName,    setInvName]    = useState("")
  const [saving,     setSaving]     = useState(false)
  const [assigning,  setAssigning]  = useState(null)

  useEffect(() => { if (userId) loadLeads() }, [userId])

  async function loadLeads() {
    const { data } = await supabase
      .from("leads").select("*, customers(name,phone)")
      .eq("user_id", userId)
      .order("last_message_at", { ascending: false })
    setLeads(data || [])
  }

  async function inviteMember() {
    if (!invEmail.trim()||!invName.trim()) { toast.error("Name and email required"); return }
    setSaving(true)
    await new Promise(r=>setTimeout(r,800))
    const newMember = {
      id:"t"+Date.now(), name:invName.trim(), email:invEmail.trim(),
      role:invRole, leads:0, conversations:0, status:"invited", avatar:invName[0].toUpperCase()
    }
    setTeam(prev=>[...prev,newMember])
    toast.success(`Invite sent to ${invEmail}`)
    setShowInvite(false); setInvEmail(""); setInvName(""); setInvRole("Sales Rep")
    setSaving(false)
  }

  async function assignLead(leadId, memberId) {
    setAssigning(leadId)
    await supabase.from("leads").update({ assigned_to: memberId }).eq("id", leadId)
    setLeads(prev=>prev.map(l=>l.id===leadId?{...l,assigned_to:memberId}:l))
    toast.success("Lead assigned")
    setAssigning(null)
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

  const unassigned = leads.filter(l=>!l.assigned_to)
  const myLeads = selected ? leads.filter(l=>l.assigned_to===selected.id) : []

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${bg}!important;color:${tx}!important;font-family:'Plus Jakarta Sans',sans-serif!important;}
        .wrap{display:flex;height:100vh;overflow:hidden;}
        .sidebar{width:224px;flex-shrink:0;background:${sb};border-right:1px solid ${bdr};display:flex;flex-direction:column;overflow-y:auto;}
        .logo{padding:16px 18px;font-weight:800;font-size:20px;color:${tx};text-decoration:none;display:flex;flex-direction:row;align-items:center;gap:10px;border-bottom:1px solid ${bdr};line-height:1;}
        .nav-section{padding:18px 16px 7px;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${txf};font-weight:600;}
        .nav-item{display:flex;align-items:center;gap:9px;padding:9px 12px;margin:1px 8px;border-radius:8px;cursor:pointer;font-size:13.5px;color:${navText};font-weight:500;transition:all 0.13s;border:1px solid transparent;background:none;width:calc(100% - 16px);text-align:left;font-family:'Plus Jakarta Sans',sans-serif;}
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
        .content{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:14px;background:${bg};}
        .theme-toggle{display:flex;align-items:center;gap:6px;padding:5px 10px;background:${ibg};border:1px solid ${cbdr};border-radius:8px;cursor:pointer;font-size:11.5px;color:${txm};font-family:'Plus Jakarta Sans',sans-serif;}
        .toggle-pill{width:30px;height:16px;border-radius:100px;background:${dark?acc:"#d1d5db"};position:relative;flex-shrink:0;}
        .toggle-pill::after{content:'';position:absolute;top:2px;width:12px;height:12px;border-radius:50%;background:#fff;left:${dark?"16px":"2px"};}
        .hamburger{display:none;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:6px 9px;cursor:pointer;font-size:17px;color:#eeeef5;line-height:1;margin-right:2px;}
        .mob-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:299;cursor:pointer;}
        .modal-ov{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:400;display:flex;align-items:center;justify-content:center;padding:16px}
        .modal{background:${sb};border:1px solid ${cbdr};border-radius:16px;padding:24px;width:100%;max-width:400px;display:flex;flex-direction:column;gap:14px}
        .inp{background:${ibg};border:1px solid ${cbdr};border-radius:8px;padding:9px 12px;font-size:13px;color:${tx};outline:none;width:100%;font-family:'Plus Jakarta Sans',sans-serif;}
        .inp:focus{border-color:${acc}66}
        .sel{background:${ibg};border:1px solid ${cbdr};border-radius:8px;padding:9px 12px;font-size:13px;color:${tx};outline:none;width:100%;font-family:'Plus Jakarta Sans',sans-serif;cursor:pointer;}
        .member-card{background:${card};border:1px solid ${cbdr};border-radius:12px;padding:16px;cursor:pointer;transition:border-color 0.12s;display:flex;align-items:center;gap:13px}
        .member-card:hover{border-color:${acc}55}
        .member-card.sel{border-color:${acc};background:${adim}}
        .av{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;color:#fff;flex-shrink:0}
        .status-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
        @media(max-width:767px){
          .sidebar{position:fixed;top:0;left:0;height:100vh;z-index:300;transform:translateX(-100%);transition:transform 0.25s ease;width:240px!important;box-shadow:4px 0 24px rgba(0,0,0,0.5);}
          .sidebar.mob-open{transform:translateX(0);}
          .mob-ov{display:block;}
          .hamburger{display:flex!important;}
          .topbar{padding:0 12px!important;}
          .content{padding:12px!important;}
          [style*="grid-template-columns: 1fr 340px"]{grid-template-columns:1fr!important;}
          [style*="grid-template-columns: repeat(4"]{grid-template-columns:repeat(2,1fr)!important;}
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
            <button key={item.id} className={`nav-item${item.id==="team"?" active":""}`} onClick={()=>router.push(item.path)}>
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
              <span style={{fontWeight:700,fontSize:15,color:tx}}>Team</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button onClick={()=>setShowInvite(true)}
                style={{padding:"7px 14px",borderRadius:8,background:acc,border:"none",color:"#000",fontWeight:700,fontSize:12.5,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                + Invite member
              </button>
              <button className="theme-toggle" onClick={toggleTheme}>
                <span>{dark?"🌙":"☀️"}</span><div className="toggle-pill"/><span>{dark?"Dark":"Light"}</span>
              </button>
            </div>
          </div>

          <div className="content">
            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:11}}>
              {[
                {l:"Team Members",  v:team.filter(t=>t.status!=="invited").length, c:tx},
                {l:"Online Now",    v:team.filter(t=>t.status==="online").length,  c:"#4ade80"},
                {l:"Unassigned Leads", v:unassigned.length, c:"#f59e0b"},
                {l:"Total Assigned",   v:leads.filter(l=>l.assigned_to).length, c:acc},
              ].map(s=>(
                <div key={s.l} style={{background:card,border:`1px solid ${cbdr}`,borderRadius:11,padding:"13px 15px"}}>
                  <div style={{fontSize:11,color:txm,marginBottom:5}}>{s.l}</div>
                  <div style={{fontSize:22,fontWeight:700,color:s.c}}>{s.v}</div>
                </div>
              ))}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:14}}>
              {/* Team list */}
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div style={{fontSize:12,fontWeight:700,color:txm,textTransform:"uppercase",letterSpacing:"0.8px"}}>Members</div>
                {team.map(member=>(
                  <div key={member.id} className={`member-card${selected?.id===member.id?" sel":""}`} onClick={()=>setSelected(selected?.id===member.id?null:member)}>
                    <div className="av" style={{background:`linear-gradient(135deg,${ROLE_COLORS[member.role]||acc},${ROLE_COLORS[member.role]||acc}88)`}}>
                      {member.avatar}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:2}}>
                        <span style={{fontWeight:700,fontSize:13.5,color:tx}}>{member.name}</span>
                        <span className="status-dot" style={{background:member.status==="online"?"#4ade80":member.status==="invited"?"#f59e0b":"#6b7280"}}/>
                        <span style={{fontSize:10,color:txm}}>{member.status}</span>
                      </div>
                      <div style={{fontSize:11.5,color:txm,marginBottom:5}}>{member.email}</div>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <span style={{fontSize:10.5,fontWeight:700,color:ROLE_COLORS[member.role]||acc,background:(ROLE_COLORS[member.role]||acc)+"18",border:`1px solid ${(ROLE_COLORS[member.role]||acc)}33`,borderRadius:100,padding:"2px 8px"}}>{member.role}</span>
                        <span style={{fontSize:10.5,color:txf}}>{leads.filter(l=>l.assigned_to===member.id).length} leads assigned</span>
                        <span style={{fontSize:10.5,color:txf}}>{member.conversations} convos</span>
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:20,fontWeight:700,color:acc}}>{leads.filter(l=>l.assigned_to===member.id).length}</div>
                      <div style={{fontSize:10,color:txf}}>leads</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right panel */}
              <div>
                {selected?(
                  <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:13,overflow:"hidden"}}>
                    <div style={{padding:"12px 16px",borderBottom:`1px solid ${bdr}`,display:"flex",alignItems:"center",gap:10}}>
                      <div className="av" style={{background:`linear-gradient(135deg,${ROLE_COLORS[selected.role]||acc},${ROLE_COLORS[selected.role]||acc}88)`,width:32,height:32,fontSize:13}}>
                        {selected.avatar}
                      </div>
                      <div>
                        <div style={{fontWeight:700,fontSize:13,color:tx}}>{selected.name}</div>
                        <div style={{fontSize:11,color:txm}}>{selected.role} · {myLeads.length} leads</div>
                      </div>
                    </div>
                    <div style={{maxHeight:"calc(100vh - 340px)",overflowY:"auto"}}>
                      <div style={{padding:"8px 12px",fontSize:10.5,fontWeight:700,color:txf,textTransform:"uppercase",letterSpacing:"0.7px"}}>Assigned Leads</div>
                      {myLeads.length===0?(
                        <div style={{textAlign:"center",padding:"24px 16px",color:txf,fontSize:12}}>No leads assigned yet</div>
                      ):myLeads.map(lead=>{
                        const name=lead.customers?.name||lead.name||lead.phone||"Unknown"
                        return(
                          <div key={lead.id} style={{padding:"10px 14px",borderBottom:`1px solid ${bdr}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div>
                              <div style={{fontWeight:600,fontSize:12.5,color:tx,marginBottom:2}}>{name}</div>
                              <div style={{fontSize:11,color:txm}}>{lead.status||"open"} · {lead.ai_score||0}pts</div>
                            </div>
                            {lead.estimated_value>0&&<span style={{fontSize:12,fontWeight:700,color:acc}}>₹{lead.estimated_value.toLocaleString()}</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ):(
                  <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:13,overflow:"hidden"}}>
                    <div style={{padding:"12px 16px",borderBottom:`1px solid ${bdr}`,fontWeight:700,fontSize:13,color:tx,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span>Unassigned Leads</span>
                      <span style={{fontSize:10,color:txm,background:ibg,border:`1px solid ${cbdr}`,borderRadius:100,padding:"2px 8px"}}>{unassigned.length}</span>
                    </div>
                    <div style={{maxHeight:"calc(100vh - 300px)",overflowY:"auto"}}>
                      {unassigned.length===0?(
                        <div style={{textAlign:"center",padding:"32px 16px",color:txf,fontSize:12}}>All leads are assigned ✓</div>
                      ):unassigned.map(lead=>{
                        const name=lead.customers?.name||lead.name||lead.phone||"Unknown"
                        return(
                          <div key={lead.id} style={{padding:"10px 14px",borderBottom:`1px solid ${bdr}`}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                              <div>
                                <div style={{fontWeight:600,fontSize:12.5,color:tx,marginBottom:1}}>{name}</div>
                                <div style={{fontSize:11,color:txm}}>{lead.ai_score||0}pts · {lead.status||"open"}</div>
                              </div>
                              {lead.estimated_value>0&&<span style={{fontSize:11.5,fontWeight:700,color:acc}}>₹{lead.estimated_value.toLocaleString()}</span>}
                            </div>
                            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                              {team.filter(t=>t.status!=="invited").map(m=>(
                                <button key={m.id} onClick={()=>assignLead(lead.id,m.id)}
                                  disabled={assigning===lead.id}
                                  style={{padding:"3px 9px",borderRadius:6,background:ibg,border:`1px solid ${cbdr}`,color:txm,fontSize:10.5,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600}}>
                                  {assigning===lead.id?"…":m.avatar} {m.name.split(" ")[0]}
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showInvite&&(
        <div className="modal-ov" onClick={e=>{if(e.target===e.currentTarget)setShowInvite(false)}}>
          <div className="modal">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontWeight:700,fontSize:15,color:tx}}>Invite team member</span>
              <button onClick={()=>setShowInvite(false)} style={{background:"transparent",border:"none",color:txf,cursor:"pointer",fontSize:20,lineHeight:1}}>×</button>
            </div>
            <input className="inp" placeholder="Full name *" value={invName} onChange={e=>setInvName(e.target.value)}/>
            <input className="inp" placeholder="Email address *" type="email" value={invEmail} onChange={e=>setInvEmail(e.target.value)}/>
            <select className="sel" value={invRole} onChange={e=>setInvRole(e.target.value)}>
              {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
            <div style={{background:ibg,border:`1px solid ${cbdr}`,borderRadius:8,padding:"10px 12px",fontSize:12,color:txm,lineHeight:1.6}}>
              They'll receive a WhatsApp invite link and can access conversations assigned to them.
            </div>
            <button onClick={inviteMember} disabled={saving}
              style={{padding:"11px",borderRadius:9,background:acc,border:"none",color:"#000",fontWeight:700,fontSize:13.5,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",opacity:saving?0.6:1}}>
              {saving?"Sending invite…":"📩 Send invite"}
            </button>
          </div>
        </div>
      )}

      <nav className="bnav">
        {[
          {id:"overview",icon:"⬡",label:"Home",    path:"/dashboard"},
          {id:"inbox",   icon:"◎",label:"Chats",   path:"/dashboard/conversations"},
          {id:"pipeline",icon:"⬦",label:"Pipeline",path:"/dashboard/pipeline"},
          {id:"team",    icon:"⊕",label:"Team",    path:"/dashboard/team"},
          {id:"contacts",icon:"◑",label:"Contacts",path:"/dashboard/contacts"},
        ].map(item=>(
          <button key={item.id} className={"bni"+(item.id==="team"?" on":"")} onClick={()=>router.push(item.path)}>
            <span className="bnic">{item.icon}</span>
            <span className="bnil">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
