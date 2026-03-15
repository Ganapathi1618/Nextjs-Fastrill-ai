"use client"
import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

// ─── Nav ──────────────────────────────────────────────────────────────────────
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

// ─── Templates ────────────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id:"product_launch", label:"Product Launch", category:"MARKETING", icon:"🚀",
    desc:"Announce a new product or service",
    vars:[
      {key:"name",   label:"Customer Name",     hint:"Auto-filled",           auto:true},
      {key:"biz",    label:"Business Name",     hint:"e.g. Radiance Salon",   auto:true},
      {key:"detail", label:"Product/Service",   hint:"e.g. Keratin Treatment",auto:false},
    ],
    build:v=>`Hi ${v.name}! Exciting news from *${v.biz}*! 🎉\n\n${v.detail}\n\nLimited time offer. Reply *BOOK* to grab your slot!`
  },
  {
    id:"special_offer", label:"Special Offer", category:"MARKETING", icon:"🎁",
    desc:"Discount or deal for your customers",
    vars:[
      {key:"name",   label:"Customer Name",  hint:"Auto-filled",               auto:true},
      {key:"biz",    label:"Business Name",  hint:"e.g. Radiance Salon",       auto:true},
      {key:"offer",  label:"Offer Details",  hint:"e.g. 20% off all services", auto:false},
      {key:"expiry", label:"Valid Till",      hint:"e.g. Sunday 20th March",    auto:false},
    ],
    build:v=>`Hi ${v.name}! *${v.biz}* has a special offer just for you! 😊\n\n🎁 ${v.offer}\n\n⏰ Valid till *${v.expiry}* only.\n\nReply *BOOK* to avail now!`
  },
  {
    id:"winback", label:"Win Back", category:"MARKETING", icon:"💌",
    desc:"Re-engage customers who haven't visited",
    vars:[
      {key:"name",     label:"Customer Name",  hint:"Auto-filled",                auto:true},
      {key:"biz",      label:"Business Name",  hint:"e.g. Radiance Salon",        auto:true},
      {key:"discount", label:"Your Offer",      hint:"e.g. 15% off your next visit",auto:false},
    ],
    build:v=>`Hi ${v.name}! We miss you at *${v.biz}* 😊\n\nIt's been a while! Come back and get *${v.discount}*.\n\nReply *BOOK* to schedule your visit 🙌`
  },
  {
    id:"appointment_reminder", label:"Appointment Reminder", category:"UTILITY", icon:"📅",
    desc:"Remind customers of upcoming appointments",
    vars:[
      {key:"name", label:"Customer Name",    hint:"Auto-filled",          auto:true},
      {key:"biz",  label:"Business Name",    hint:"e.g. Radiance Salon",  auto:true},
      {key:"date", label:"Appointment Date", hint:"e.g. Saturday 15th",   auto:false},
      {key:"time", label:"Appointment Time", hint:"e.g. 4:00 PM",         auto:false},
    ],
    build:v=>`Hi ${v.name}! 📅 Reminder from *${v.biz}*:\n\nYour appointment is on *${v.date}* at *${v.time}*.\n\nReply *CONFIRM* ✅ or *RESCHEDULE* to change.`
  },
  {
    id:"festival", label:"Festival Greeting", category:"MARKETING", icon:"🎊",
    desc:"Festive season offer or greeting",
    vars:[
      {key:"name",  label:"Customer Name",  hint:"Auto-filled",                  auto:true},
      {key:"biz",   label:"Business Name",  hint:"e.g. Radiance Salon",          auto:true},
      {key:"offer", label:"Festival Offer", hint:"e.g. 25% off colour services", auto:false},
    ],
    build:v=>`Hi ${v.name}! 🎊 Warm wishes from *${v.biz}*!\n\nThis festive season, treat yourself —\n✨ *${v.offer}*\n\nReply *BOOK* to schedule 😊`
  },
  {
    id:"review_request", label:"Review Request", category:"UTILITY", icon:"⭐",
    desc:"Ask happy customers for a review",
    vars:[
      {key:"name", label:"Customer Name",  hint:"Auto-filled",            auto:true},
      {key:"biz",  label:"Business Name",  hint:"e.g. Radiance Salon",    auto:true},
      {key:"link", label:"Review Link",    hint:"e.g. g.page/your-biz",   auto:false},
    ],
    build:v=>`Hi ${v.name}! Thank you for visiting *${v.biz}* 😊\n\nWould you take 2 minutes to share your experience?\n\n⭐ ${v.link}\n\nYour feedback means the world to us 🙏`
  },
  {
    id:"referral", label:"Referral Program", category:"MARKETING", icon:"🤝",
    desc:"Get customers to refer friends",
    vars:[
      {key:"name",   label:"Customer Name",  hint:"Auto-filled",               auto:true},
      {key:"biz",    label:"Business Name",  hint:"e.g. Radiance Salon",       auto:true},
      {key:"reward", label:"Reward",          hint:"e.g. 10% off next visit",   auto:false},
    ],
    build:v=>`Hi ${v.name}! Loved your visit at *${v.biz}*? 😊\n\nRefer a friend and *both of you* get *${v.reward}*! 🎁\n\nJust ask them to mention your name when booking ✨`
  },
]

const SEGMENTS = [
  {id:"all",       label:"All Customers",   desc:"Everyone who has messaged you",   icon:"👥"},
  {id:"new_lead",  label:"New Leads",       desc:"First-time contacts, not booked",  icon:"✨"},
  {id:"returning", label:"Returning",       desc:"Booked 2+ times",                  icon:"🔄"},
  {id:"vip",       label:"VIP",             desc:"Tagged as VIP",                    icon:"⭐"},
  {id:"inactive",  label:"Inactive 30d+",   desc:"No visit in 30 days",             icon:"💤"},
  {id:"manual",    label:"Enter Numbers",   desc:"Paste numbers manually",           icon:"✏️"},
  {id:"csv",       label:"Upload CSV",      desc:"Upload a .csv or .txt file",       icon:"📎"},
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function toSendPhone(phone) {
  const d = (phone||"").replace(/[^0-9]/g,"")
  if (d.length===10) return "91"+d
  if (d.length===12&&d.startsWith("91")) return d
  if (d.length===11&&d.startsWith("0")) return "91"+d.slice(1)
  return d
}
function dedupePhone(phone) {
  const d = (phone||"").replace(/[^0-9]/g,"")
  return d.length>=12 ? d.slice(-10) : d
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function Campaigns() {
  const router  = useRouter()
  const fileRef = useRef(null)
  const pollRef = useRef(null)

  const [userId, setUserId]             = useState(null)
  const [userEmail, setUserEmail]       = useState("")
  const [dark, setDark]                 = useState(true)
  const [mobOpen, setMobOpen]           = useState(false)
  const [customers, setCustomers]       = useState([])
  const [optouts, setOptouts]           = useState([])
  const [whatsapp, setWhatsapp]         = useState(null)
  const [bizName, setBizName]           = useState("")
  const [loading, setLoading]           = useState(true)
  const [history, setHistory]           = useState([])
  const [histError, setHistError]       = useState(false)

  // View: compose | history
  const [view, setView]                 = useState("compose")
  // Compose step: setup | sending | done
  const [step, setStep]                 = useState("setup")

  const [mode, setMode]                 = useState("template")
  const [tmplId, setTmplId]             = useState("")
  const [tmplVals, setTmplVals]         = useState({})
  const [freeText, setFreeText]         = useState("")
  const [ctaUrl, setCtaUrl]             = useState("")
  const [campaignName, setCampaignName] = useState("")
  const [segment, setSegment]           = useState("all")
  const [manualNums, setManualNums]     = useState("")
  const [csvNums, setCsvNums]           = useState([])

  const [testPhone, setTestPhone]       = useState("")
  const [testState, setTestState]       = useState("idle") // idle | sending | done | fail

  const [sending, setSending]           = useState(false)
  const [sentCount, setSentCount]       = useState(0)
  const [failCount, setFailCount]       = useState(0)
  const [sendLog, setSendLog]           = useState([])
  const [currentCampId, setCurrentCampId] = useState(null)

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(()=>{
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved==="dark")
    supabase.auth.getUser().then(({data})=>{
      if (!data?.user) router.push("/login")
      else { setUserEmail(data.user.email||""); setUserId(data.user.id) }
    })
  },[])

  useEffect(()=>{ if (userId) loadAll() },[userId])
  useEffect(()=>()=>{ if (pollRef.current) clearInterval(pollRef.current) },[])

  async function loadAll() {
    setLoading(true)
    const [
      {data:custs},
      {data:wa},
      {data:biz},
    ] = await Promise.all([
      supabase.from("customers").select("id,name,phone,tag,last_visit_at,created_at").eq("user_id",userId),
      supabase.from("whatsapp_connections").select("*").eq("user_id",userId).maybeSingle(),
      supabase.from("business_settings").select("business_name").eq("user_id",userId).maybeSingle(),
    ])
    setCustomers(custs||[])
    setWhatsapp(wa||null)
    const bn = biz?.business_name||""
    setBizName(bn)
    if (bn) setTmplVals(p=>({...p,biz:bn}))

    try {
      const {data:opts} = await supabase.from("campaign_optouts").select("phone").eq("user_id",userId)
      setOptouts((opts||[]).map(o=>o.phone))
    } catch(e){}

    await loadHistory()
    setLoading(false)
  }

  const loadHistory = useCallback(async()=>{
    if (!userId) return
    try {
      const {data,error} = await supabase.from("campaigns")
        .select("*").eq("user_id",userId)
        .order("created_at",{ascending:false}).limit(50)
      if (error) { setHistError(true); return }
      setHistory(data||[])
      setHistError(false)
    } catch(e){ setHistError(true) }
  },[userId])

  // ── Audience ─────────────────────────────────────────────────────────────
  function getAudience() {
    const now  = new Date()
    const ago30 = new Date(now); ago30.setDate(now.getDate()-30)
    const optSet = new Set(optouts.map(dedupePhone))
    let base = []

    if (segment==="manual") {
      const nums = manualNums.replace(/[,;]/g," ").split(/\s+/).map(s=>s.trim()).filter(s=>s.length>=8)
      base = nums.map((p,i)=>({id:"m"+i,name:p,phone:p}))
    } else if (segment==="csv") {
      base = csvNums.map((p,i)=>({id:"c"+i,name:p,phone:p}))
    } else {
      base = customers.filter(c=>{
        if (!c.phone) return false
        if (segment==="all")       return true
        if (segment==="new_lead")  return c.tag==="new_lead"
        if (segment==="returning") return c.tag==="returning"||c.tag==="vip"
        if (segment==="vip")       return c.tag==="vip"
        if (segment==="inactive")  return new Date(c.last_visit_at||c.created_at)<ago30
        return true
      })
    }
    const seen = new Set()
    base = base.filter(c=>{ const n=dedupePhone(c.phone); if(seen.has(n))return false; seen.add(n); return true })
    return base.filter(c=>!optSet.has(dedupePhone(c.phone)))
  }

  // ── Message builder ───────────────────────────────────────────────────────
  function buildMsg(customerName) {
    const firstName = (customerName||"there").split(" ")[0]
    const tmpl = TEMPLATES.find(t=>t.id===tmplId)
    if (mode==="template"&&tmpl) {
      const v={...tmplVals}
      v.name = firstName
      v.biz  = v.biz||bizName||"our business"
      tmpl.vars.forEach(tv=>{ if (!v[tv.key]) v[tv.key]=tv.hint })
      return tmpl.build(v)
    }
    const cta = ctaUrl ? `\n\n${ctaUrl}` : ""
    return freeText.replace(/\{name\}/gi,firstName).replace(/\{business\}/gi,bizName||"us") + cta
  }

  function getPreview() {
    const tmpl = TEMPLATES.find(t=>t.id===tmplId)
    if (mode==="template"&&tmpl) {
      const v={...tmplVals}
      v.name = tmplVals.name||"Priya"
      v.biz  = v.biz||bizName||"Your Business"
      tmpl.vars.forEach(tv=>{ if (!v[tv.key]) v[tv.key]=tv.hint||"..." })
      return tmpl.build(v)
    }
    const aud = getAudience()
    const c = aud[0]||{name:"Priya"}
    return buildMsg(c.name)
  }

  // ── Send test ─────────────────────────────────────────────────────────────
  async function sendTest() {
    if (!testPhone.trim()||!whatsapp||testState==="sending") return
    setTestState("sending")
    try {
      const phone = toSendPhone(testPhone)
      const text  = getPreview()||"Test from Fastrill"
      const res = await fetch(`https://graph.facebook.com/v18.0/${whatsapp.phone_number_id}/messages`,{
        method:"POST",
        headers:{"Authorization":`Bearer ${whatsapp.access_token}`,"Content-Type":"application/json"},
        body:JSON.stringify({messaging_product:"whatsapp",to:phone,type:"text",text:{body:text,preview_url:false}})
      })
      const d = await res.json()
      if (d.error) { setTestState("fail"); setTimeout(()=>setTestState("idle"),3000) }
      else { setTestState("done"); setTimeout(()=>setTestState("idle"),3000) }
    } catch(e){ setTestState("fail"); setTimeout(()=>setTestState("idle"),3000) }
  }

  // ── Poll delivery stats ───────────────────────────────────────────────────
  // FIX: After campaign sends, we poll messages table every 10s to aggregate
  // delivered/read counts. The webhook updates message.status per wa_message_id.
  async function startPolling(campId, waIds) {
    if (pollRef.current) clearInterval(pollRef.current)
    if (!waIds.length) return

    let ticks = 0
    pollRef.current = setInterval(async()=>{
      ticks++
      if (ticks > 60) { clearInterval(pollRef.current); return } // stop after 10 min

      try {
        const {data:msgs} = await supabase.from("messages")
          .select("status,wa_message_id").in("wa_message_id",waIds)
        if (!msgs) return

        const delivered = msgs.filter(m=>m.status==="delivered"||m.status==="read").length
        const read      = msgs.filter(m=>m.status==="read").length

        await supabase.from("campaigns").update({delivered_count:delivered,read_count:read}).eq("id",campId)
        await loadHistory()
      } catch(e){}
    }, 10000)
  }

  // FIX: Count replies after campaign
  async function refreshReplies(camp) {
    try {
      const {count} = await supabase.from("messages")
        .select("id",{count:"exact"})
        .eq("user_id",userId)
        .eq("direction","inbound")
        .gte("created_at", camp.sent_at||camp.created_at)
      if (count!==null) {
        await supabase.from("campaigns").update({replied_count:count}).eq("id",camp.id)
        await loadHistory()
      }
    } catch(e){}
  }

  // ── Send campaign ─────────────────────────────────────────────────────────
  async function sendCampaign() {
    const audience = getAudience()
    if (!canSend||sending||!audience.length) return

    setSending(true); setSentCount(0); setFailCount(0); setSendLog([]); setStep("sending")

    const waIds  = []
    const log    = []
    let sc = 0, fc = 0

    // FIX: Create DB row FIRST with "sending" status so history shows immediately
    let campId = null
    try {
      const {data:newCamp} = await supabase.from("campaigns").insert({
        user_id:         userId,
        name:            campaignName,
        segment:         segment,
        message:         getPreview(),
        sent_count:      0,
        failed_count:    0,
        delivered_count: 0,
        read_count:      0,
        replied_count:   0,
        status:          "sending",
        sent_at:         new Date().toISOString(),
        created_at:      new Date().toISOString(),
        wa_message_ids:  [],
      }).select().single()
      campId = newCamp?.id||null
      setCurrentCampId(campId)
    } catch(e){ console.warn("Campaign table missing columns — run migration SQL. Error:",e.message) }

    // Send messages
    for (const customer of audience) {
      const phone = toSendPhone(customer.phone)
      const text  = buildMsg(customer.name)

      try {
        const res = await fetch(`https://graph.facebook.com/v18.0/${whatsapp.phone_number_id}/messages`,{
          method:"POST",
          headers:{"Authorization":`Bearer ${whatsapp.access_token}`,"Content-Type":"application/json"},
          body:JSON.stringify({messaging_product:"whatsapp",to:phone,type:"text",text:{body:text,preview_url:false}})
        })
        const d = await res.json()
        if (!d.error) {
          sc++; setSentCount(sc)
          const waId = d?.messages?.[0]?.id
          if (waId) waIds.push(waId)
          log.push({name:customer.name,phone,status:"sent"})

          // FIX: Save to messages table so webhook can update delivery status
          // This also fixes the "AI replies without context" bug —
          // the outbound campaign message is now in conversation history
          if (campId) {
            try {
              // Find or create conversation for this customer
              const {data:existingConvo} = await supabase.from("conversations")
                .select("id").eq("user_id",userId).eq("phone",dedupePhone(customer.phone)).maybeSingle()

              await supabase.from("messages").insert({
                user_id:         userId,
                customer_phone:  dedupePhone(customer.phone),
                conversation_id: existingConvo?.id||null,
                direction:       "outbound",
                message_type:    "text",
                message_text:    text,
                status:          "sent",
                is_ai:           false,
                wa_message_id:   waId||null,
                created_at:      new Date().toISOString(),
              })
            } catch(e){ /* non-fatal */ }
          }
        } else {
          fc++; setFailCount(fc)
          log.push({name:customer.name,phone,status:"failed",error:d.error.message})
        }
      } catch(e){
        fc++; setFailCount(fc)
        log.push({name:customer.name,phone,status:"error"})
      }
      await new Promise(r=>setTimeout(r,1200))
    }

    setSendLog(log)

    // Update final counts
    if (campId) {
      try {
        await supabase.from("campaigns").update({
          sent_count:    sc,
          failed_count:  fc,
          wa_message_ids:waIds,
          status:        "completed",
        }).eq("id",campId)
        if (waIds.length>0) startPolling(campId,waIds)
      } catch(e){ console.warn("Campaign update error:",e.message) }
    }

    await loadHistory()
    setSending(false)
    setStep("done")
  }

  function handleCsv(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev=>{
      const nums=[]
      ev.target.result.split("\n").forEach(line=>{
        line.replace(/\r/g,"").split(",").forEach(col=>{
          const d=col.replace(/[^0-9]/g,"")
          if (d.length>=10) nums.push(d)
        })
      })
      setCsvNums([...new Set(nums)]); setSegment("csv")
    }
    reader.readAsText(file)
  }

  const toggleTheme = ()=>{ const n=!dark; setDark(n); localStorage.setItem("fastrill-theme",n?"dark":"light") }
  const logout = async()=>{ await supabase.auth.signOut(); router.push("/login") }

  // ── Theme ─────────────────────────────────────────────────────────────────
  const bg   = dark?"#08080e":"#f0f2f5"
  const sb   = dark?"#0c0c15":"#ffffff"
  const card = dark?"#0f0f1a":"#ffffff"
  const bdr  = dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.08)"
  const cbdr = dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.09)"
  const tx   = dark?"#eeeef5":"#111827"
  const txm  = dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const txf  = dark?"rgba(255,255,255,0.18)":"rgba(0,0,0,0.22)"
  const ibg  = dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"
  const acc  = dark?"#00d084":"#00935a"
  const adim = dark?"rgba(0,208,132,0.1)":"rgba(0,147,90,0.08)"
  const inp  = {background:ibg,border:`1px solid ${cbdr}`,borderRadius:8,padding:"9px 12px",fontSize:13,color:tx,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none",width:"100%"}

  const audience     = getAudience()
  const previewText  = getPreview()
  const selectedTmpl = TEMPLATES.find(t=>t.id===tmplId)
  const ui           = userEmail?userEmail[0].toUpperCase():"G"
  const canSend      = !!whatsapp&&!!campaignName.trim()&&audience.length>0&&(mode==="freetext"?!!freeText.trim():!!tmplId)

  const navTxOn  = dark?"#00c47d":"#00935a"
  const navAct   = dark?"rgba(0,196,125,0.1)":"rgba(0,180,115,0.08)"
  const navActBdr= dark?"rgba(0,196,125,0.2)":"rgba(0,180,115,0.2)"

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${bg}!important;color:${tx}!important;font-family:'Plus Jakarta Sans',sans-serif!important;}
        .wrap{display:flex;height:100vh;overflow:hidden;}
        .sidebar{width:220px;flex-shrink:0;background:${sb};border-right:1px solid ${bdr};display:flex;flex-direction:column;overflow-y:auto;transition:transform 0.25s;}
        .logo{padding:20px 18px 16px;font-weight:800;font-size:20px;color:${tx};text-decoration:none;display:block;border-bottom:1px solid ${bdr};letter-spacing:-0.5px;}
        .logo span{color:${acc};}
        .nav-s{padding:16px 14px 6px;font-size:9.5px;letter-spacing:1.5px;text-transform:uppercase;color:${txf};font-weight:700;}
        .nav-i{display:flex;align-items:center;gap:9px;padding:8px 11px;margin:1px 7px;border-radius:8px;cursor:pointer;font-size:13px;color:${dark?"rgba(255,255,255,0.4)":"rgba(0,0,0,0.45)"};font-weight:500;transition:all 0.12s;border:1px solid transparent;background:none;width:calc(100% - 14px);text-align:left;font-family:'Plus Jakarta Sans',sans-serif;}
        .nav-i:hover{background:${ibg};color:${tx};}
        .nav-i.on{background:${navAct};color:${navTxOn};font-weight:600;border-color:${navActBdr};}
        .nav-ic{font-size:12px;width:17px;text-align:center;flex-shrink:0;}
        .sbf{margin-top:auto;padding:13px;border-top:1px solid ${bdr};}
        .uc{display:flex;align-items:center;gap:8px;padding:8px;border-radius:9px;background:${ibg};border:1px solid ${cbdr};}
        .ua{width:28px;height:28px;border-radius:7px;background:linear-gradient(135deg,${acc},#0ea5e9);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;color:#fff;flex-shrink:0;}
        .ue{font-size:11px;color:${txm};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .lb{margin-top:6px;width:100%;padding:6px;border-radius:7px;background:transparent;border:1px solid ${cbdr};font-size:11.5px;color:${txm};cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .lb:hover{border-color:#fca5a5;color:#ef4444;}
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;background:${bg};}
        .topbar{height:52px;flex-shrink:0;border-bottom:1px solid ${bdr};display:flex;align-items:center;justify-content:space-between;padding:0 20px;background:${sb};}
        .con{flex:1;overflow-y:auto;}

        /* Campaign compose layout */
        .cmp-shell{display:grid;grid-template-columns:260px 1fr 280px;height:100%;overflow:hidden;}
        .cmp-left{border-right:1px solid ${bdr};overflow-y:auto;display:flex;flex-direction:column;}
        .cmp-mid{overflow-y:auto;padding:20px;}
        .cmp-right{border-left:1px solid ${bdr};overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;}

        /* Segment pills */
        .seg-item{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;border-bottom:1px solid ${bdr};transition:background 0.1s;}
        .seg-item:hover{background:${ibg};}
        .seg-item.on{background:${adim};border-left:2px solid ${acc};}

        /* Template cards */
        .tmpl-item{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;cursor:pointer;border-bottom:1px solid ${bdr};transition:background 0.1s;}
        .tmpl-item:hover{background:${ibg};}
        .tmpl-item.on{background:${adim};border-left:2px solid ${acc};}
        .tmpl-icon{font-size:20px;flex-shrink:0;margin-top:2px;}

        /* Mode tabs */
        .mode-tab{flex:1;padding:9px;text-align:center;font-size:12px;font-weight:600;cursor:pointer;border-bottom:2px solid transparent;color:${txm};transition:all 0.15s;background:none;border:none;font-family:'Plus Jakarta Sans',sans-serif;}
        .mode-tab.on{color:${acc};border-bottom:2px solid ${acc};}

        /* Stat pill */
        .stat-pill{display:flex;align-items:center;gap:6px;padding:7px 10px;border-radius:8px;background:${ibg};border:1px solid ${cbdr};}

        /* Mobile */
        .hbtn{display:none;background:${ibg};border:1px solid ${cbdr};border-radius:7px;padding:5px 8px;cursor:pointer;font-size:16px;color:${tx};line-height:1;margin-right:4px;}
        .mob-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:299;cursor:pointer;}
        .bnav{display:none;position:fixed;bottom:0;left:0;right:0;background:${sb};border-top:1px solid ${bdr};padding:5px 0;z-index:200;}
        .bni{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px;border:none;background:transparent;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;flex:1;}
        .bnic{font-size:16px;color:${txf};}
        .bnil{font-size:9px;font-weight:600;color:${txf};}
        .bni.on .bnic,.bni.on .bnil{color:${acc};}
        select option{background-color:#0c0c15!important;color:#eeeef5!important;}

        @media(max-width:900px){
          .cmp-shell{grid-template-columns:1fr!important;}
          .cmp-left,.cmp-right{border:none;border-bottom:1px solid ${bdr};}
          .cmp-mid{padding:14px;}
        }
        @media(max-width:767px){
          .wrap{position:relative;}
          .sidebar{position:fixed;top:0;left:0;height:100vh;z-index:300;transform:translateX(-100%);}
          .sidebar.open{transform:translateX(0);box-shadow:4px 0 24px rgba(0,0,0,0.5);}
          .mob-ov.open{display:block;}
          .hbtn{display:flex;}
          .bnav{display:flex;}
          .main{padding-bottom:58px;}
        }
      `}</style>

      <div className="wrap">
        <div className={"mob-ov"+(mobOpen?" open":"")} onClick={()=>setMobOpen(false)}/>
        <aside className={"sidebar"+(mobOpen?" open":"")}>
          <a href="/dashboard" className="logo">fast<span>rill</span></a>
          <div className="nav-s">Platform</div>
          {NAV.map(item=>(
            <button key={item.id} className={"nav-i"+(item.id==="campaigns"?" on":"")}
              onClick={()=>{ router.push(item.path); setMobOpen(false) }}>
              <span className="nav-ic">{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
          <div className="sbf">
            <div className="uc"><div className="ua">{ui}</div><div className="ue">{userEmail||"Loading..."}</div></div>
            <button className="lb" onClick={logout}>↩ Sign out</button>
          </div>
        </aside>

        <div className="main">
          {/* ── Topbar ── */}
          <div className="topbar">
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <button className="hbtn" onClick={()=>setMobOpen(s=>!s)}>☰</button>
              <span style={{fontWeight:700,fontSize:15,color:tx}}>Campaigns</span>
              {/* View switcher */}
              <div style={{display:"flex",background:ibg,border:`1px solid ${cbdr}`,borderRadius:8,padding:2,gap:1,marginLeft:10}}>
                {[["compose","Compose"],["history",`History (${history.length})`]].map(([v,l])=>(
                  <button key={v} onClick={()=>{ setView(v); if(v==="history") loadHistory() }}
                    style={{padding:"3px 12px",borderRadius:6,fontSize:11.5,fontWeight:600,cursor:"pointer",border:"none",background:view===v?card:"transparent",color:view===v?tx:txm,fontFamily:"'Plus Jakarta Sans',sans-serif",whiteSpace:"nowrap"}}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {!whatsapp&&!loading&&(
                <div style={{padding:"4px 10px",borderRadius:6,background:"rgba(251,113,133,0.1)",border:"1px solid rgba(251,113,133,0.25)",fontSize:11,color:"#fb7185",fontWeight:600,cursor:"pointer"}}
                  onClick={()=>router.push("/dashboard/settings")}>
                  ⚠ Connect WhatsApp
                </div>
              )}
              <button onClick={toggleTheme} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",background:ibg,border:`1px solid ${cbdr}`,borderRadius:7,cursor:"pointer",fontSize:11.5,color:txm,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                <span>{dark?"🌙":"☀️"}</span>
                <div style={{width:28,height:15,borderRadius:100,background:dark?acc:"#d1d5db",position:"relative",flexShrink:0}}>
                  <div style={{position:"absolute",top:2,width:11,height:11,borderRadius:"50%",background:"#fff",left:dark?"15px":"2px",transition:"left 0.2s"}}/>
                </div>
              </button>
            </div>
          </div>

          {/* ── DB migration warning ── */}
          {histError&&(
            <div style={{margin:"12px 16px 0",background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.25)",borderRadius:10,padding:"11px 14px"}}>
              <div style={{fontWeight:700,fontSize:12.5,color:"#f59e0b"}}>⚠️ Campaign history table needs columns</div>
              <div style={{fontSize:11.5,color:txm,marginTop:3}}>Run this SQL in Supabase SQL Editor to enable full tracking:</div>
              <pre style={{fontSize:10.5,color:txf,background:ibg,borderRadius:7,padding:"8px 10px",marginTop:7,overflowX:"auto",lineHeight:1.6}}>
{`ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS delivered_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS read_count      INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS replied_count   INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wa_message_ids  TEXT[] DEFAULT '{}';`}
              </pre>
            </div>
          )}

          <div className="con">
            {/* ════════════════════════════════════════════════════════════
                HISTORY VIEW
            ════════════════════════════════════════════════════════════ */}
            {view==="history"&&(
              <div style={{padding:20}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:15,color:tx}}>Campaign History</div>
                    <div style={{fontSize:11.5,color:txf,marginTop:2}}>Delivery stats update automatically via WhatsApp webhooks</div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={loadHistory} style={{padding:"6px 14px",borderRadius:7,background:ibg,border:`1px solid ${cbdr}`,color:txm,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>↻ Refresh</button>
                    <button onClick={()=>setView("compose")} style={{padding:"6px 14px",borderRadius:7,background:acc,border:"none",color:"#000",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>+ New Campaign</button>
                  </div>
                </div>

                {history.length===0?(
                  <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:13,padding:"60px 20px",textAlign:"center"}}>
                    <div style={{fontSize:36,marginBottom:12,opacity:0.3}}>📢</div>
                    <div style={{fontWeight:700,fontSize:14,color:tx,marginBottom:6}}>No campaigns sent yet</div>
                    <div style={{fontSize:12,color:txf,marginBottom:18}}>Your sent campaigns will appear here with full delivery analytics</div>
                    <button onClick={()=>setView("compose")} style={{padding:"9px 22px",borderRadius:9,background:acc,border:"none",color:"#000",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                      Send your first campaign →
                    </button>
                  </div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {history.map(c=>{
                      const sc   = c.sent_count||0
                      const dlv  = c.delivered_count||0
                      const rd   = c.read_count||0
                      const rpl  = c.replied_count||0
                      const dlvP = sc>0?Math.round((dlv/sc)*100):0
                      const rdP  = sc>0?Math.round((rd/sc)*100):0
                      const rplP = sc>0?Math.round((rpl/sc)*100):0
                      return (
                        <div key={c.id} style={{background:card,border:`1px solid ${cbdr}`,borderRadius:12,overflow:"hidden"}}>
                          {/* Campaign header */}
                          <div style={{padding:"14px 16px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",borderBottom:`1px solid ${bdr}`}}>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                                <span style={{fontWeight:700,fontSize:13.5,color:tx}}>{c.name}</span>
                                <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:100,background:c.status==="completed"?adim:c.status==="sending"?"rgba(245,158,11,0.12)":"rgba(255,255,255,0.06)",color:c.status==="completed"?acc:c.status==="sending"?"#f59e0b":txf,border:`1px solid ${c.status==="completed"?acc+"33":c.status==="sending"?"rgba(245,158,11,0.3)":cbdr}`}}>
                                  {c.status==="sending"?"● Sending...":c.status==="completed"?"✓ Completed":"Draft"}
                                </span>
                              </div>
                              <div style={{fontSize:11.5,color:txm,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"85%"}}>{(c.message||"").substring(0,90)}</div>
                              <div style={{fontSize:11,color:txf,marginTop:4}}>
                                {c.sent_at?new Date(c.sent_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}):""} · Segment: {c.segment}
                              </div>
                            </div>
                            <div style={{flexShrink:0,textAlign:"right",marginLeft:12}}>
                              <div style={{fontSize:26,fontWeight:800,color:acc,lineHeight:1,letterSpacing:"-1px"}}>{sc}</div>
                              <div style={{fontSize:10.5,color:txf}}>messages sent</div>
                            </div>
                          </div>

                          {/* Stats row */}
                          <div style={{padding:"12px 16px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
                            {[
                              {label:"Sent",       val:sc,  pct:100,  color:txm,       icon:"📤"},
                              {label:"Delivered",  val:dlv, pct:dlvP, color:"#38bdf8",  icon:"📬"},
                              {label:"Read",       val:rd,  pct:rdP,  color:"#a78bfa",  icon:"👁"},
                              {label:"Replied",    val:rpl, pct:rplP, color:acc,         icon:"↩"},
                            ].map(s=>(
                              <div key={s.label} style={{background:ibg,borderRadius:8,padding:"9px 10px"}}>
                                <div style={{fontSize:10,color:txf,marginBottom:4}}>{s.icon} {s.label}</div>
                                <div style={{fontWeight:800,fontSize:18,color:s.val>0?s.color:txf,lineHeight:1,letterSpacing:"-0.5px"}}>{s.val}</div>
                                {sc>0&&(
                                  <>
                                    <div style={{marginTop:5,height:2,borderRadius:100,background:dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)"}}>
                                      <div style={{height:2,borderRadius:100,width:`${s.pct}%`,background:s.color,transition:"width 0.5s"}}/>
                                    </div>
                                    <div style={{fontSize:9.5,color:txf,marginTop:2}}>{s.pct}%</div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Action row */}
                          <div style={{padding:"8px 16px",borderTop:`1px solid ${bdr}`,display:"flex",alignItems:"center",gap:8}}>
                            <button onClick={()=>refreshReplies(c)} style={{padding:"4px 10px",borderRadius:6,background:"transparent",border:`1px solid ${cbdr}`,color:txf,fontSize:11,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>↻ Refresh replies</button>
                            {c.wa_message_ids?.length>0&&(
                              <button onClick={()=>startPolling(c.id,c.wa_message_ids)} style={{padding:"4px 10px",borderRadius:6,background:"transparent",border:`1px solid ${cbdr}`,color:txf,fontSize:11,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>↻ Refresh delivery</button>
                            )}
                            <span style={{fontSize:11,color:txf,marginLeft:"auto"}}>
                              {(c.failed_count||0)>0&&<span style={{color:"#fb7185"}}>{c.failed_count} failed</span>}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════
                SENDING STATE
            ════════════════════════════════════════════════════════════ */}
            {view==="compose"&&step==="sending"&&(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"80%",gap:16,padding:20}}>
                <div style={{fontSize:44}}>📤</div>
                <div style={{fontWeight:800,fontSize:20,color:tx}}>Sending Campaign...</div>
                <div style={{fontSize:12,color:txm,textAlign:"center"}}>Keep this tab open · Do not navigate away</div>
                <div style={{display:"flex",gap:28,marginTop:4}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:40,fontWeight:800,color:acc,letterSpacing:"-1.5px",lineHeight:1}}>{sentCount}</div>
                    <div style={{fontSize:11,color:txm,marginTop:3}}>Sent</div>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:40,fontWeight:800,color:txm,letterSpacing:"-1.5px",lineHeight:1}}>{Math.max(0,audience.length-sentCount-failCount)}</div>
                    <div style={{fontSize:11,color:txm,marginTop:3}}>Remaining</div>
                  </div>
                  {failCount>0&&(
                    <div style={{textAlign:"center"}}>
                      <div style={{fontSize:40,fontWeight:800,color:"#fb7185",letterSpacing:"-1.5px",lineHeight:1}}>{failCount}</div>
                      <div style={{fontSize:11,color:txm,marginTop:3}}>Failed</div>
                    </div>
                  )}
                </div>
                <div style={{width:300,height:6,borderRadius:100,background:ibg,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:100,background:acc,width:audience.length>0?`${Math.round(((sentCount+failCount)/audience.length)*100)}%`:"0%",transition:"width 0.4s"}}/>
                </div>
                <div style={{fontSize:11,color:txf}}>{audience.length>0?Math.round(((sentCount+failCount)/audience.length)*100):0}% complete · ~{Math.ceil((audience.length-sentCount-failCount)*1.2)}s remaining</div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════
                DONE STATE
            ════════════════════════════════════════════════════════════ */}
            {view==="compose"&&step==="done"&&(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"80%",gap:16,padding:20}}>
                <div style={{fontSize:52}}>🎉</div>
                <div style={{fontWeight:800,fontSize:22,color:tx}}>Campaign Sent!</div>
                <div style={{display:"flex",gap:24}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:44,fontWeight:800,color:acc,letterSpacing:"-2px",lineHeight:1}}>{sentCount}</div>
                    <div style={{fontSize:12,color:txm,marginTop:4}}>Messages sent</div>
                  </div>
                  {failCount>0&&(
                    <div style={{textAlign:"center"}}>
                      <div style={{fontSize:44,fontWeight:800,color:"#fb7185",letterSpacing:"-2px",lineHeight:1}}>{failCount}</div>
                      <div style={{fontSize:12,color:txm,marginTop:4}}>Failed</div>
                    </div>
                  )}
                </div>
                <div style={{fontSize:12,color:txf,textAlign:"center",maxWidth:320,lineHeight:1.7}}>
                  Delivery stats update automatically as WhatsApp sends us read receipts. Check History in a few minutes.
                </div>
                {sendLog.length>0&&(
                  <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:11,padding:14,width:"100%",maxWidth:440,maxHeight:180,overflowY:"auto"}}>
                    <div style={{fontSize:10.5,fontWeight:700,color:txf,marginBottom:7,letterSpacing:"0.5px"}}>SEND LOG</div>
                    {sendLog.map((l,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:11.5,padding:"3px 0",borderBottom:`1px solid ${bdr}`}}>
                        <span style={{color:tx,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"55%"}}>{l.name||l.phone}</span>
                        <span style={{color:l.status==="sent"?acc:"#fb7185",flexShrink:0}}>{l.status==="sent"?"✓ Sent":"✗ "+(l.error||"Failed")}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{display:"flex",gap:10,marginTop:4}}>
                  <button onClick={()=>{setStep("setup");setSentCount(0);setFailCount(0);setCampaignName("");setSendLog([])}}
                    style={{padding:"10px 24px",borderRadius:9,background:acc,border:"none",color:"#000",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                    New Campaign
                  </button>
                  <button onClick={()=>{setView("history");setStep("setup");loadHistory()}}
                    style={{padding:"10px 24px",borderRadius:9,background:ibg,border:`1px solid ${cbdr}`,color:txm,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                    View History →
                  </button>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════
                COMPOSE — 3-COLUMN LAYOUT (Wati-inspired)
            ════════════════════════════════════════════════════════════ */}
            {view==="compose"&&step==="setup"&&(
              <div className="cmp-shell">

                {/* ── LEFT: Audience selector ── */}
                <div className="cmp-left">
                  <div style={{padding:"14px 14px 10px",borderBottom:`1px solid ${bdr}`}}>
                    <div style={{fontWeight:700,fontSize:12,color:tx,marginBottom:2}}>1 · Select Audience</div>
                    <div style={{fontSize:10.5,color:txf}}>Who receives this campaign?</div>
                  </div>

                  {SEGMENTS.map(s=>(
                    <div key={s.id} className={"seg-item"+(segment===s.id?" on":"")} onClick={()=>{setSegment(s.id);if(s.id!=="csv")setCsvNums([])}}>
                      <span style={{fontSize:16}}>{s.icon}</span>
                      <div>
                        <div style={{fontSize:12.5,fontWeight:600,color:segment===s.id?acc:tx}}>{s.label}</div>
                        <div style={{fontSize:10.5,color:txf,marginTop:1}}>{s.desc}</div>
                      </div>
                    </div>
                  ))}

                  {segment==="manual"&&(
                    <div style={{padding:"10px 12px",borderTop:`1px solid ${bdr}`}}>
                      <textarea placeholder={"919876543210\n918765432109\n...one per line"}
                        value={manualNums} onChange={e=>setManualNums(e.target.value)} rows={5}
                        style={{...inp,resize:"vertical",fontSize:12,lineHeight:1.6,marginBottom:4}}/>
                      <div style={{fontSize:10.5,color:acc}}>
                        {manualNums.replace(/[,;]/g," ").split(/\s+/).filter(s=>s.trim().length>=8).length} numbers detected
                      </div>
                    </div>
                  )}

                  {segment==="csv"&&(
                    <div style={{padding:"10px 12px",borderTop:`1px solid ${bdr}`}}>
                      <input ref={fileRef} type="file" accept=".csv,.txt" style={{display:"none"}} onChange={handleCsv}/>
                      <button onClick={()=>fileRef.current?.click()} style={{width:"100%",padding:"9px",borderRadius:8,background:adim,border:`1px solid ${acc}44`,color:acc,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                        📎 {csvNums.length>0?`${csvNums.length} numbers loaded`:"Upload CSV / .txt"}
                      </button>
                      {csvNums.length>0&&<div style={{fontSize:11,color:txf,marginTop:6,textAlign:"center"}}><span style={{color:"#fb7185",cursor:"pointer"}} onClick={()=>{setCsvNums([]);setSegment("all")}}>✕ Clear</span></div>}
                      <div style={{fontSize:10.5,color:txf,marginTop:6}}>One number per line, or first column of CSV</div>
                    </div>
                  )}

                  {/* Audience summary */}
                  <div style={{margin:"auto 0 0",padding:"12px 14px",borderTop:`1px solid ${bdr}`,background:audience.length>0?adim:"transparent"}}>
                    <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                      <div style={{fontSize:32,fontWeight:800,color:audience.length>0?acc:txf,letterSpacing:"-1px",lineHeight:1}}>{audience.length}</div>
                      <div style={{fontSize:12,color:txm}}>recipients</div>
                    </div>
                    {optouts.length>0&&<div style={{fontSize:10.5,color:txf,marginTop:2}}>🚫 {optouts.length} opted-out excluded</div>}
                  </div>
                </div>

                {/* ── MIDDLE: Message compose ── */}
                <div className="cmp-mid">
                  {/* Campaign name */}
                  <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:12,padding:16,marginBottom:14}}>
                    <div style={{fontWeight:700,fontSize:12,color:tx,marginBottom:8}}>2 · Campaign Details</div>
                    <div style={{fontSize:11.5,color:txm,marginBottom:5}}>Campaign name <span style={{color:"#fb7185"}}>*</span></div>
                    <input placeholder="e.g. Summer Offer June 2026" value={campaignName}
                      onChange={e=>setCampaignName(e.target.value)}
                      style={{...inp,border:`1px solid ${!campaignName.trim()?"rgba(251,113,133,0.3)":cbdr}`}}/>
                  </div>

                  {/* Mode tabs */}
                  <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:12,overflow:"hidden",marginBottom:14}}>
                    <div style={{display:"flex",borderBottom:`1px solid ${bdr}`}}>
                      <button className={"mode-tab"+(mode==="template"?" on":"")} onClick={()=>setMode("template")}>◈ Meta Template</button>
                      <button className={"mode-tab"+(mode==="freetext"?" on":"")} onClick={()=>setMode("freetext")}>✏️ Free Text</button>
                    </div>

                    {mode==="template"&&(
                      <div style={{padding:"0"}}>
                        {/* Template picker */}
                        <div style={{padding:"10px 14px",borderBottom:`1px solid ${bdr}`,background:ibg}}>
                          <div style={{fontSize:10.5,color:txf}}>Pick a template · fill in the details · send to anyone (no 24hr limit)</div>
                        </div>
                        {!tmplId?(
                          // Grid of templates
                          <div style={{padding:12,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                            {TEMPLATES.map(t=>(
                              <button key={t.id} onClick={()=>{setTmplId(t.id);setTmplVals({biz:bizName})}}
                                style={{background:ibg,border:`1px solid ${cbdr}`,borderRadius:10,padding:"12px",textAlign:"left",cursor:"pointer",transition:"all 0.15s",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                                <div style={{fontSize:22,marginBottom:6}}>{t.icon}</div>
                                <div style={{fontWeight:700,fontSize:12.5,color:tx}}>{t.label}</div>
                                <div style={{fontSize:10.5,color:txf,marginTop:3}}>{t.desc}</div>
                                <div style={{fontSize:9.5,color:acc,fontWeight:700,marginTop:5,padding:"1px 7px",background:adim,borderRadius:100,display:"inline-block"}}>{t.category}</div>
                              </button>
                            ))}
                          </div>
                        ):(
                          // Template vars form
                          <div style={{padding:14}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                              <span style={{fontSize:22}}>{selectedTmpl?.icon}</span>
                              <div>
                                <div style={{fontWeight:700,fontSize:13,color:tx}}>{selectedTmpl?.label}</div>
                                <div style={{fontSize:10.5,color:txf,marginTop:1}}>{selectedTmpl?.desc}</div>
                              </div>
                              <button onClick={()=>setTmplId("")} style={{marginLeft:"auto",padding:"4px 10px",borderRadius:6,background:"transparent",border:`1px solid ${cbdr}`,color:txm,fontSize:11,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                                ← Change
                              </button>
                            </div>
                            {selectedTmpl?.vars.map(v=>(
                              <div key={v.key} style={{marginBottom:12}}>
                                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                                  <div style={{fontSize:11.5,color:txm,fontWeight:600}}>{v.label}</div>
                                  {v.auto&&<div style={{fontSize:10,color:acc,fontWeight:600}}>auto-filled per customer</div>}
                                </div>
                                {v.auto?(
                                  <div style={{...inp,background:"transparent",border:`1px solid ${acc}22`,color:acc,fontSize:12}}>
                                    {v.key==="name"?"Customer's first name (personalised per send)":(tmplVals[v.key]||bizName||v.hint)}
                                  </div>
                                ):(
                                  <input placeholder={v.hint} value={tmplVals[v.key]||""}
                                    onChange={e=>setTmplVals(p=>({...p,[v.key]:e.target.value}))}
                                    style={inp}/>
                                )}
                              </div>
                            ))}
                            <div style={{padding:"9px 11px",background:`${acc}0d`,border:`1px solid ${acc}22`,borderRadius:8,fontSize:11,color:txm,lineHeight:1.6}}>
                              ✅ Template campaigns reach any contact anytime — no 24-hour window restriction.
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {mode==="freetext"&&(
                      <div style={{padding:14}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                          <div style={{fontSize:11.5,color:txm,fontWeight:600}}>Message</div>
                          <div style={{fontSize:11,color:txf}}>{freeText.length}/4096</div>
                        </div>
                        <textarea value={freeText} onChange={e=>setFreeText(e.target.value)} rows={5}
                          placeholder="Type your message... Use {name} for customer name, {business} for your business name"
                          style={{...inp,resize:"vertical",lineHeight:1.65,minHeight:120,marginBottom:10}}/>
                        <div style={{marginBottom:10}}>
                          <div style={{fontSize:11.5,color:txm,fontWeight:600,marginBottom:5}}>🔗 Link (optional)</div>
                          <input placeholder="https://your-link.com" value={ctaUrl}
                            onChange={e=>setCtaUrl(e.target.value)} style={{...inp,fontSize:12}}/>
                        </div>
                        <div style={{padding:"9px 11px",background:"rgba(245,158,11,0.07)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:8,fontSize:11,color:"#f59e0b",lineHeight:1.6}}>
                          ⚠️ Free text only works if the customer messaged you in the last 24 hours. For bulk outreach → use Meta Template instead.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* WhatsApp preview */}
                  <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:12,padding:16,marginBottom:14}}>
                    <div style={{fontWeight:700,fontSize:12,color:tx,marginBottom:10}}>
                      Preview
                      {audience.length>0&&<span style={{fontSize:11,color:txf,fontWeight:400,marginLeft:6}}>as {(audience[0]?.name||"Customer").split(" ")[0]} sees it</span>}
                    </div>
                    <div style={{background:dark?"#0d1117":"#e5ddd5",borderRadius:11,padding:"12px 10px",minHeight:80}}>
                      <div style={{background:dark?"#1c2433":"#fff",borderRadius:"4px 13px 13px 13px",padding:"10px 13px",maxWidth:"88%",display:"inline-block",boxShadow:"0 1px 4px rgba(0,0,0,0.18)"}}>
                        <div style={{fontSize:13,color:dark?"#e8eaf0":"#111",lineHeight:1.75,whiteSpace:"pre-wrap"}}>
                          {previewText||<span style={{color:txf,fontStyle:"italic"}}>Select a template above to see preview...</span>}
                        </div>
                        <div style={{fontSize:9.5,color:txf,marginTop:5,textAlign:"right"}}>
                          {new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true})} ✓✓
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Test send */}
                  <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:12,padding:16}}>
                    <div style={{fontWeight:700,fontSize:12,color:tx,marginBottom:3}}>🧪 Test before sending</div>
                    <div style={{fontSize:11,color:txf,marginBottom:9}}>Always send a test to yourself first</div>
                    <div style={{display:"flex",gap:8}}>
                      <input placeholder="Your number e.g. 919876543210" value={testPhone}
                        onChange={e=>setTestPhone(e.target.value)}
                        onKeyDown={e=>{if(e.key==="Enter")sendTest()}}
                        style={{...inp,flex:1}}/>
                      <button onClick={sendTest} disabled={!testPhone.trim()||!whatsapp||testState==="sending"}
                        style={{padding:"9px 14px",borderRadius:8,background:testState==="done"?acc:testState==="fail"?"rgba(251,113,133,0.2)":adim,border:`1px solid ${testState==="fail"?"rgba(251,113,133,0.4)":acc+"44"}`,color:testState==="done"?"#000":testState==="fail"?"#fb7185":acc,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",flexShrink:0}}>
                        {testState==="sending"?"Sending...":testState==="done"?"Sent ✓":testState==="fail"?"Failed ✗":"Send Test"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── RIGHT: Send panel ── */}
                <div className="cmp-right">
                  {/* Checklist */}
                  <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:12,padding:14}}>
                    <div style={{fontWeight:700,fontSize:12,color:tx,marginBottom:10}}>3 · Pre-Send Checklist</div>
                    {[
                      {label:"WhatsApp connected",   done:!!whatsapp,                                            warn:true},
                      {label:"Campaign name added",  done:!!campaignName.trim(),                                 warn:true},
                      {label:"Audience selected",    done:audience.length>0,                                     warn:true},
                      {label:mode==="template"?"Template selected":"Message written", done:mode==="template"?!!tmplId:!!freeText.trim(), warn:true},
                      {label:"Test message sent",    done:testState==="done",                                    warn:false},
                    ].map(item=>(
                      <div key={item.label} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${bdr}`}}>
                        <div style={{width:18,height:18,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:item.done?"#22c55e22":item.warn?"rgba(251,113,133,0.12)":ibg,border:`1px solid ${item.done?"#22c55e44":item.warn?"rgba(251,113,133,0.25)":cbdr}`,fontSize:10,color:item.done?"#22c55e":item.warn?"#fb7185":txf}}>
                          {item.done?"✓":"○"}
                        </div>
                        <span style={{fontSize:12,color:item.done?tx:txm}}>{item.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Stats */}
                  <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:12,padding:14}}>
                    <div style={{fontWeight:700,fontSize:12,color:tx,marginBottom:10}}>Audience Summary</div>
                    <div style={{fontSize:40,fontWeight:800,color:audience.length>0?acc:txf,letterSpacing:"-1.5px",lineHeight:1,marginBottom:4}}>{audience.length}</div>
                    <div style={{fontSize:12,color:txm,marginBottom:10}}>{audience.length===1?"recipient":"recipients"}</div>

                    {audience.length>0&&(
                      <div style={{marginBottom:10,maxHeight:100,overflowY:"auto",background:ibg,borderRadius:8,padding:"8px 10px"}}>
                        {audience.slice(0,6).map((c,i)=>(
                          <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:11.5,padding:"2px 0",borderBottom:`1px solid ${bdr}`}}>
                            <span style={{color:tx,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"55%"}}>{c.name||c.phone}</span>
                            <span style={{fontFamily:"monospace",color:txf}}>···{toSendPhone(c.phone).slice(-4)}</span>
                          </div>
                        ))}
                        {audience.length>6&&<div style={{fontSize:11,color:txf,paddingTop:4}}>+{audience.length-6} more</div>}
                      </div>
                    )}

                    {optouts.length>0&&(
                      <div style={{padding:"6px 9px",background:"rgba(251,113,133,0.06)",border:"1px solid rgba(251,113,133,0.15)",borderRadius:7,fontSize:11,color:"#fb7185",marginBottom:8}}>
                        🚫 {optouts.length} opted-out auto-excluded
                      </div>
                    )}

                    <div style={{padding:"7px 9px",background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.15)",borderRadius:7,fontSize:10.5,color:"#f59e0b",marginBottom:12,lineHeight:1.5}}>
                      ⚠️ Only send to customers who have messaged you first. Meta policy.
                    </div>

                    {/* SEND BUTTON */}
                    <button onClick={sendCampaign} disabled={!canSend||sending}
                      style={{width:"100%",padding:"13px",background:canSend?"#00c47d":ibg,border:`1px solid ${canSend?"#00c47d":cbdr}`,borderRadius:10,color:canSend?"#000":txm,fontWeight:800,fontSize:14,cursor:canSend?"pointer":"not-allowed",fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:"-0.3px",transition:"all 0.15s"}}>
                      {!whatsapp?"Connect WhatsApp first"
                        :!campaignName.trim()?"↑ Add campaign name"
                        :!audience.length?"Select an audience"
                        :mode==="template"&&!tmplId?"← Select a template"
                        :mode==="freetext"&&!freeText.trim()?"← Write a message"
                        :`🚀 Send to ${audience.length} people`}
                    </button>

                    <div style={{fontSize:10.5,color:txf,textAlign:"center",marginTop:8}}>
                      Est. time: ~{Math.ceil(audience.length*1.2)}s · 1 msg/sec
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <nav className="bnav">
        {[
          {id:"overview",  icon:"⬡", label:"Home",      path:"/dashboard"},
          {id:"inbox",     icon:"◎", label:"Chats",     path:"/dashboard/conversations"},
          {id:"campaigns", icon:"◆", label:"Campaigns", path:"/dashboard/campaigns"},
          {id:"leads",     icon:"◉", label:"Leads",     path:"/dashboard/leads"},
          {id:"contacts",  icon:"◑", label:"Customers", path:"/dashboard/contacts"},
        ].map(item=>(
          <button key={item.id} className={"bni"+(item.id==="campaigns"?" on":"")} onClick={()=>router.push(item.path)}>
            <span className="bnic">{item.icon}</span>
            <span className="bnil">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
