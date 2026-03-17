"use client"
import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

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

// ── DB STATUS VALUES must match your campaigns table constraint ──────────────
// Allowed: draft | scheduled | live | done | paused
const STATUS_SENDING   = "live"   // campaign is currently sending
const STATUS_COMPLETED = "done"   // campaign finished

const META_TEMPLATES = [
  {
    id:"fastrill_salon_winback", label:"Salon Win Back", icon:"💌",
    category:"MARKETING", industry:"Salon", metaCost:0.83,
    desc:"Re-engage customers who haven't visited recently",
    template_name:"fastrill_salon_winback",
    vars:[
      {key:"customer_name", label:"Customer Name", auto:true},
      {key:"business_name", label:"Business Name", auto:true},
      {key:"offer",         label:"Your Offer",    auto:false, hint:"e.g. 20% off any service"},
    ],
    preview:v=>`Hi ${v.customer_name||"Priya"}! It's been a while since your last visit at ${v.business_name||"Your Business"}.\n\nYour hair deserves some love 😊\n\n✨ Come back this week and get ${v.offer||"20% off"} — just for you.\n\nReply BOOK to grab your slot!`
  },
  {
    id:"fastrill_salon_special_offer", label:"Special Offer", icon:"🎁",
    category:"MARKETING", industry:"Salon", metaCost:0.83,
    desc:"Limited time offer to drive immediate bookings",
    template_name:"fastrill_salon_special_offer",
    vars:[
      {key:"customer_name", label:"Customer Name", auto:true},
      {key:"business_name", label:"Business Name", auto:true},
      {key:"offer_details", label:"Offer Details", auto:false, hint:"e.g. 50% off Keratin Treatment"},
      {key:"expiry_date",   label:"Valid Till",    auto:false, hint:"e.g. Sunday 20th March"},
      {key:"slots_left",    label:"Slots Left",    auto:false, hint:"e.g. 3"},
    ],
    preview:v=>`Hi ${v.customer_name||"Priya"}! ${v.business_name||"Your Business"} has a special offer 🎉\n\n💅 ${v.offer_details||"50% off Keratin"}\n⏰ Valid till ${v.expiry_date||"Sunday"} only\nOnly ${v.slots_left||"3"} slots left!\n\nReply BOOK ✅`
  },
  {
    id:"fastrill_salon_festival", label:"Festival Greeting", icon:"🎊",
    category:"MARKETING", industry:"Salon", metaCost:0.83,
    desc:"Festival season special offer",
    template_name:"fastrill_salon_festival",
    vars:[
      {key:"business_name",  label:"Business Name",  auto:true},
      {key:"customer_name",  label:"Customer Name",  auto:true},
      {key:"festival_offer", label:"Festival Offer", auto:false, hint:"e.g. 25% off all bridal packages"},
    ],
    preview:v=>`Hi ${v.customer_name||"Priya"}! Wishes from ${v.business_name||"Your Business"} 🎉\n\n✨ ${v.festival_offer||"25% off bridal packages"}\n📅 Limited slots this week\n\nReply BOOK 😊`
  },
  {
    id:"fastrill_clinic_followup", label:"Follow-up Reminder", icon:"🩺",
    category:"UTILITY", industry:"Clinic", metaCost:0.35,
    desc:"Remind patients to come back for a follow-up",
    template_name:"fastrill_clinic_followup",
    vars:[
      {key:"customer_name",    label:"Patient Name",     auto:true},
      {key:"business_name",    label:"Clinic Name",      auto:true},
      {key:"time_since_visit", label:"Time Since Visit", auto:false, hint:"e.g. 3 months"},
      {key:"doctor_name",      label:"Doctor Name",      auto:false, hint:"e.g. Dr Sharma"},
    ],
    preview:v=>`Hi ${v.customer_name||"Rahul"}, reminder from ${v.business_name||"Apollo Clinic"}.\n\nIt has been ${v.time_since_visit||"3 months"} since your last visit. Dr. ${v.doctor_name||"Sharma"} recommends a follow-up 🩺\n\nReply BOOK ✅`
  },
  {
    id:"fastrill_clinic_health_offer", label:"Health Package Offer", icon:"🏥",
    category:"MARKETING", industry:"Clinic", metaCost:0.83,
    desc:"Promote a health checkup package",
    template_name:"fastrill_clinic_health_offer",
    vars:[
      {key:"business_name",  label:"Clinic Name",    auto:true},
      {key:"customer_name",  label:"Patient Name",   auto:true},
      {key:"package_name",   label:"Package Name",   auto:false, hint:"e.g. Full Body Checkup"},
      {key:"offer_price",    label:"Offer Price",    auto:false, hint:"e.g. Rs 499"},
      {key:"original_price", label:"Original Price", auto:false, hint:"e.g. Rs 999"},
    ],
    preview:v=>`Hi ${v.customer_name||"Rahul"}! ${v.business_name||"Apollo Clinic"} has a special package 🏥\n\n🩺 ${v.package_name||"Full Body Checkup"}\n💰 Just ${v.offer_price||"Rs 499"} (usually ${v.original_price||"Rs 999"})\n\nReply BOOK ✅`
  },
  {
    id:"fastrill_spa_winback", label:"Spa Win Back", icon:"🧘",
    category:"MARKETING", industry:"Spa", metaCost:0.83,
    desc:"Bring back customers who haven't visited",
    template_name:"fastrill_spa_winback",
    vars:[
      {key:"customer_name",    label:"Customer Name",  auto:true},
      {key:"time_since_visit", label:"Since Last Visit",auto:false, hint:"e.g. 2 months"},
      {key:"business_name",    label:"Spa Name",       auto:true},
      {key:"service_name",     label:"Service",        auto:false, hint:"e.g. Deep Tissue Massage"},
      {key:"discount",         label:"Discount",       auto:false, hint:"e.g. 15% off"},
    ],
    preview:v=>`Hi ${v.customer_name||"Priya"}! It has been ${v.time_since_visit||"2 months"} since your last session at ${v.business_name||"Serenity Spa"}.\n\n💆 ${v.service_name||"Deep Tissue Massage"} — ${v.discount||"15% off"} for returning guests.\n\nReply BOOK 🙌`
  },
  {
    id:"fastrill_universal_winback", label:"Universal Win Back", icon:"🔄",
    category:"MARKETING", industry:"All", metaCost:0.83,
    desc:"Works for any business type",
    template_name:"fastrill_universal_winback",
    vars:[
      {key:"customer_name", label:"Customer Name", auto:true},
      {key:"business_name", label:"Business Name", auto:true},
      {key:"offer",         label:"Offer",         auto:false, hint:"e.g. 15% off your next visit"},
      {key:"expiry",        label:"Valid Till",    auto:false, hint:"e.g. this Sunday"},
    ],
    preview:v=>`Hi ${v.customer_name||"Priya"}! It has been a while at ${v.business_name||"Your Business"} 😊\n\n🎁 ${v.offer||"15% off"} — just for you.\nValid till ${v.expiry||"this Sunday"} only.\n\nReply BOOK ✅`
  },
  {
    id:"fastrill_universal_offer", label:"Universal Offer", icon:"🎯",
    category:"MARKETING", industry:"All", metaCost:0.83,
    desc:"Quick offer blast for any business",
    template_name:"fastrill_universal_offer",
    vars:[
      {key:"customer_name", label:"Customer Name", auto:true},
      {key:"business_name", label:"Business Name", auto:true},
      {key:"offer_details", label:"Offer Details", auto:false, hint:"e.g. Buy 1 Get 1 Free this week"},
      {key:"expiry",        label:"Valid Till",    auto:false, hint:"e.g. Sunday 20th March"},
    ],
    preview:v=>`Hi ${v.customer_name||"Priya"}! ${v.business_name||"Your Business"} has a special offer —\n\n✨ ${v.offer_details||"Buy 1 Get 1 Free"}\n⏰ Valid till ${v.expiry||"Sunday"}\n\nReply BOOK 🙌`
  },
  {
    id:"fastrill_review_request", label:"Review Request", icon:"⭐",
    category:"UTILITY", industry:"All", metaCost:0.35,
    desc:"Ask customers to leave a Google review",
    template_name:"fastrill_review_request",
    vars:[
      {key:"customer_name", label:"Customer Name", auto:true},
      {key:"business_name", label:"Business Name", auto:true},
      {key:"review_link",   label:"Review Link",   auto:false, hint:"e.g. g.page/your-business"},
    ],
    preview:v=>`Hi ${v.customer_name||"Priya"}! Thank you for visiting ${v.business_name||"Your Business"} 😊\n\nYour feedback helps us — takes 60 seconds:\n⭐ ${v.review_link||"g.page/your-business"}\n\nThank you 🙏`
  },
  {
    id:"fastrill_referral", label:"Referral Program", icon:"🤝",
    category:"MARKETING", industry:"All", metaCost:0.83,
    desc:"Get customers to refer their friends",
    template_name:"fastrill_referral",
    vars:[
      {key:"customer_name", label:"Customer Name", auto:true},
      {key:"business_name", label:"Business Name", auto:true},
      {key:"reward",        label:"Reward",        auto:false, hint:"e.g. 10% off next visit"},
    ],
    preview:v=>`Hi ${v.customer_name||"Priya"}! Loved your visit at ${v.business_name||"Your Business"}? 😊\n\n👥 Refer a friend and both of you get ${v.reward||"10% off"}!\n\nJust mention your name when booking 🎁`
  },
]

const SEGMENTS = [
  {id:"all",       label:"All Customers", desc:"Everyone who messaged you",   icon:"👥"},
  {id:"new_lead",  label:"New Leads",     desc:"First-time, not booked",      icon:"✨"},
  {id:"returning", label:"Returning",     desc:"Booked 2+ times",             icon:"🔄"},
  {id:"vip",       label:"VIP",           desc:"Tagged as VIP",               icon:"⭐"},
  {id:"inactive",  label:"Inactive 30d+", desc:"No visit in 30 days",         icon:"💤"},
  {id:"manual",    label:"Enter Numbers", desc:"Paste numbers manually",       icon:"✏️"},
  {id:"csv",       label:"Upload CSV",    desc:"Upload a .csv or .txt file",   icon:"📎"},
]

const INDUSTRIES = ["All","Salon","Clinic","Spa","Gym","Restaurant"]

function toPhone(p){const d=(p||"").replace(/[^0-9]/g,"");if(d.length===10)return"91"+d;if(d.length===12&&d.startsWith("91"))return d;if(d.length===11&&d.startsWith("0"))return"91"+d.slice(1);return d}
function dedupe(p){const d=(p||"").replace(/[^0-9]/g,"");return d.length>=12?d.slice(-10):d}

export default function Campaigns(){
  const router  = useRouter()
  const fileRef = useRef(null)
  const pollRef = useRef(null)

  // Auth + data
  const [userId,    setUserId]    = useState(null)
  const [userEmail, setUserEmail] = useState("")
  const [dark,      setDark]      = useState(true)
  const [mobOpen,   setMobOpen]   = useState(false)
  const [customers, setCustomers] = useState([])
  const [optouts,   setOptouts]   = useState([])
  const [whatsapp,  setWhatsapp]  = useState(null)
  const [bizName,   setBizName]   = useState("")
  const [loading,   setLoading]   = useState(true)

  // Views
  const [view, setView] = useState("compose") // compose | history
  const [step, setStep] = useState("setup")   // setup | sending | done

  // Compose state
  const [industryFilter,  setIndustryFilter]  = useState("All")
  const [selectedTmplId,  setSelectedTmplId]  = useState("")
  const [tmplVals,        setTmplVals]        = useState({})
  const [campaignName,    setCampaignName]    = useState("")
  const [segment,         setSegment]         = useState("all")
  const [manualNums,      setManualNums]      = useState("")
  const [csvNums,         setCsvNums]         = useState([])
  const [testPhone,       setTestPhone]       = useState("")
  const [testState,       setTestState]       = useState("idle")

  // Send state
  const [sentCount,  setSentCount]  = useState(0)
  const [failCount,  setFailCount]  = useState(0)
  const [sendLog,    setSendLog]    = useState([])
  const [sending,    setSending]    = useState(false)
  const [campCost,   setCampCost]   = useState(0)

  // History
  const [history,     setHistory]     = useState([])
  const [histLoading, setHistLoading] = useState(false)

  useEffect(()=>{
    const saved = localStorage.getItem("fastrill-theme")
    if(saved) setDark(saved==="dark")
    supabase.auth.getUser().then(({data})=>{
      if(!data?.user) router.push("/login")
      else{ setUserEmail(data.user.email||""); setUserId(data.user.id) }
    })
  },[])

  useEffect(()=>{ if(userId) loadAll() },[userId])
  useEffect(()=>()=>{ if(pollRef.current) clearInterval(pollRef.current) },[])

  async function loadAll(){
    setLoading(true)
    const [{data:custs},{data:wa},{data:biz}] = await Promise.all([
      supabase.from("customers").select("id,name,phone,tag,last_visit_at,created_at").eq("user_id",userId),
      supabase.from("whatsapp_connections").select("*").eq("user_id",userId).maybeSingle(),
      supabase.from("business_settings").select("business_name").eq("user_id",userId).maybeSingle(),
    ])
    setCustomers(custs||[])
    setWhatsapp(wa||null)
    const bn = biz?.business_name||""
    setBizName(bn)
    if(bn) setTmplVals(p=>({...p,business_name:bn}))
    try{
      const{data:opts} = await supabase.from("campaign_optouts").select("phone").eq("user_id",userId)
      setOptouts((opts||[]).map(o=>o.phone))
    }catch(e){ console.warn("Optouts:",e.message) }
    await loadHistory()
    setLoading(false)
  }

  const loadHistory = useCallback(async()=>{
    if(!userId) return
    setHistLoading(true)
    const{data,error} = await supabase
      .from("campaigns").select("*")
      .eq("user_id",userId)
      .order("created_at",{ascending:false})
      .limit(50)
    if(error) console.error("History load error:",error.message, error.code, error.details)
    else setHistory(data||[])
    setHistLoading(false)
  },[userId])

  // ── Audience helpers ───────────────────────────────────────────────────────
  function getAudience(){
    const ago30 = new Date(Date.now()-30*86400000)
    const optSet = new Set(optouts.map(dedupe))
    let base = []
    if(segment==="manual"){
      const nums = manualNums.replace(/[,;]/g," ").split(/\s+/).map(s=>s.trim()).filter(s=>s.length>=8)
      base = nums.map((p,i)=>({id:"m"+i,name:p,phone:p}))
    } else if(segment==="csv"){
      base = csvNums.map((p,i)=>({id:"c"+i,name:p,phone:p}))
    } else {
      base = customers.filter(c=>{
        if(!c.phone) return false
        if(segment==="all")       return true
        if(segment==="new_lead")  return c.tag==="new_lead"
        if(segment==="returning") return c.tag==="returning"||c.tag==="vip"
        if(segment==="vip")       return c.tag==="vip"
        if(segment==="inactive")  return new Date(c.last_visit_at||c.created_at)<ago30
        return true
      })
    }
    const seen = new Set()
    base = base.filter(c=>{ const n=dedupe(c.phone); if(seen.has(n)) return false; seen.add(n); return true })
    return base.filter(c=>!optSet.has(dedupe(c.phone)))
  }

  function segCount(id){
    const ago30 = new Date(Date.now()-30*86400000)
    if(id==="all")       return customers.length
    if(id==="new_lead")  return customers.filter(c=>c.tag==="new_lead").length
    if(id==="returning") return customers.filter(c=>c.tag==="returning"||c.tag==="vip").length
    if(id==="vip")       return customers.filter(c=>c.tag==="vip").length
    if(id==="inactive")  return customers.filter(c=>new Date(c.last_visit_at||c.created_at)<ago30).length
    return null
  }

  // ── Template helpers ───────────────────────────────────────────────────────
  const selectedTmpl = META_TEMPLATES.find(t=>t.id===selectedTmplId)

  function getPreview(){
    if(!selectedTmpl) return ""
    const v = {...tmplVals, customer_name:"Priya", business_name:tmplVals.business_name||bizName||"Your Business"}
    return selectedTmpl.preview(v)
  }

  function buildPayload(customerName, phone){
    if(!selectedTmpl) return null
    const firstName = (customerName||"there").split(" ")[0]
    const v = {...tmplVals, customer_name:firstName, business_name:tmplVals.business_name||bizName||"our business"}
    const parameters = selectedTmpl.vars.map(vv=>({ type:"text", text:String(v[vv.key]||vv.hint||"N/A") }))
    return{
      messaging_product:"whatsapp", to:phone, type:"template",
      template:{ name:selectedTmpl.template_name, language:{code:"en"}, components:[{type:"body",parameters}] }
    }
  }

  // ── Send test ──────────────────────────────────────────────────────────────
  async function sendTest(){
    if(!testPhone.trim()||!whatsapp||!selectedTmpl||testState==="sending") return
    setTestState("sending")
    try{
      const res = await fetch(`https://graph.facebook.com/v18.0/${whatsapp.phone_number_id}/messages`,{
        method:"POST",
        headers:{"Authorization":`Bearer ${whatsapp.access_token}`,"Content-Type":"application/json"},
        body:JSON.stringify(buildPayload("Test", toPhone(testPhone)))
      })
      const d = await res.json()
      if(d.error){ alert("Test failed: "+d.error.message); setTestState("fail"); setTimeout(()=>setTestState("idle"),3000) }
      else{ setTestState("done"); setTimeout(()=>setTestState("idle"),3000) }
    }catch(e){ alert("Error: "+e.message); setTestState("fail"); setTimeout(()=>setTestState("idle"),3000) }
  }

  // ── Poll delivery stats ────────────────────────────────────────────────────
  async function pollDelivery(campId, waIds){
    if(pollRef.current) clearInterval(pollRef.current)
    if(!waIds?.length||!campId) return
    let ticks = 0
    pollRef.current = setInterval(async()=>{
      ticks++; if(ticks>60){ clearInterval(pollRef.current); return }
      try{
        const{data:msgs} = await supabase.from("messages").select("status,wa_message_id").in("wa_message_id",waIds)
        if(!msgs) return
        const delivered = msgs.filter(m=>m.status==="delivered"||m.status==="read").length
        const read      = msgs.filter(m=>m.status==="read").length
        const{error:pe} = await supabase.from("campaigns").update({delivered_count:delivered,read_count:read}).eq("id",campId)
        if(pe) console.error("Poll update error:",pe.message)
        else await loadHistory()
      }catch(e){ console.warn("Poll error:",e.message) }
    },10000)
  }

  // ── Main send ──────────────────────────────────────────────────────────────
  async function sendCampaign(){
    if(!canSend||sending) return
    const aud = getAudience()
    if(!aud.length) return

    setSending(true); setSentCount(0); setFailCount(0); setSendLog([]); setStep("sending")
    const cost = parseFloat((aud.length*(selectedTmpl.metaCost||0.83)).toFixed(2))
    setCampCost(cost)
    const now = new Date().toISOString()
    const waIds=[], log=[]
    let sc=0, fc=0

    // ── FIX: Create campaign with CORRECT status values ──────────────────────
    // status "live" = currently sending (matches DB constraint)
    let campId = null
    const insertRow = {
      user_id:         userId,
      name:            campaignName,
      status:          STATUS_SENDING,   // "live" — matches DB constraint
      sent_count:      0,
      failed_count:    0,
      delivered_count: 0,
      read_count:      0,
      replied_count:   0,
      segment:         segment,
      message:         getPreview().substring(0,500),
      template_name:   selectedTmpl.template_name,
      wa_message_ids:  [],
      sent_at:         now,
      created_at:      now,
    }

    const{data:newCamp, error:insertErr} = await supabase.from("campaigns").insert(insertRow).select("id").single()

    if(insertErr){
      // Log full error so we can debug
      console.error("❌ Campaign insert failed:", JSON.stringify({
        message: insertErr.message,
        code:    insertErr.code,
        details: insertErr.details,
        hint:    insertErr.hint,
      }))
      alert(`Campaign history failed to save: ${insertErr.message}\n\nSending will continue.`)
    } else {
      campId = newCamp?.id
      console.log("✅ Campaign created:", campId)
    }

    // ── Send messages ────────────────────────────────────────────────────────
    for(const customer of aud){
      const phone   = toPhone(customer.phone)
      const payload = buildPayload(customer.name, phone)
      if(!payload) continue
      try{
        const res = await fetch(`https://graph.facebook.com/v18.0/${whatsapp.phone_number_id}/messages`,{
          method:"POST",
          headers:{"Authorization":`Bearer ${whatsapp.access_token}`,"Content-Type":"application/json"},
          body:JSON.stringify(payload)
        })
        const d = await res.json()
        if(!d.error){
          sc++; setSentCount(sc)
          const waId = d?.messages?.[0]?.id
          if(waId) waIds.push(waId)
          log.push({name:customer.name||customer.phone, phone, status:"sent"})
          // Save to messages for AI context
          try{
            const{data:convo} = await supabase.from("conversations").select("id").eq("user_id",userId).eq("phone",dedupe(customer.phone)).maybeSingle()
            await supabase.from("messages").insert({
              user_id:userId, customer_phone:dedupe(customer.phone),
              conversation_id:convo?.id||null, direction:"outbound",
              message_type:"text", message_text:getPreview().substring(0,500),
              status:"sent", is_ai:false, wa_message_id:waId||null, created_at:now,
            })
          }catch(e){ console.warn("Message save:", e.message) }
        } else {
          fc++; setFailCount(fc)
          log.push({name:customer.name||customer.phone, phone, status:"failed", error:d.error.message})
          console.error("Send failed:", phone, d.error.message)
        }
      }catch(e){
        fc++; setFailCount(fc)
        log.push({name:customer.name||customer.phone, phone, status:"error"})
        console.warn("Send exception:", phone, e.message)
      }
      await new Promise(r=>setTimeout(r,1200))
    }

    setSendLog(log)

    // ── FIX: Update with CORRECT status "done" ───────────────────────────────
    if(campId){
      const{error:updateErr} = await supabase.from("campaigns").update({
        sent_count:    sc,
        failed_count:  fc,
        status:        STATUS_COMPLETED,  // "done" — matches DB constraint
        wa_message_ids:waIds,
      }).eq("id",campId)

      if(updateErr){
        console.error("❌ Campaign update failed:", JSON.stringify({
          message: updateErr.message,
          code:    updateErr.code,
          details: updateErr.details,
        }))
      } else {
        console.log("✅ Campaign updated to done")
        if(waIds.length>0) pollDelivery(campId, waIds)
      }
    }

    await loadHistory()
    setSending(false); setStep("done")
  }

  function handleCsv(e){
    const file = e.target.files[0]; if(!file) return
    const reader = new FileReader()
    reader.onload = ev=>{
      const nums=[]
      ev.target.result.split("\n").forEach(line=>
        line.replace(/\r/g,"").split(",").forEach(col=>{
          const d = col.replace(/[^0-9]/g,"")
          if(d.length>=10) nums.push(d)
        })
      )
      setCsvNums([...new Set(nums)]); setSegment("csv")
    }
    reader.readAsText(file)
  }

  function calcRoi(c){
    const sc  = c.sent_count||0
    const rpl = c.replied_count||0
    const tmpl = META_TEMPLATES.find(t=>t.template_name===c.template_name)
    const cost = parseFloat((sc*(tmpl?.metaCost||0.83)).toFixed(2))
    const bookings = Math.round(rpl*0.6)
    const revenue  = bookings*1200
    const roi = cost>0 ? Math.round(((revenue-cost)/cost)*100) : 0
    return{cost, bookings, revenue, roi}
  }

  const toggleTheme = ()=>{ const n=!dark; setDark(n); localStorage.setItem("fastrill-theme",n?"dark":"light") }
  const logout      = async()=>{ await supabase.auth.signOut(); router.push("/login") }

  // ── Theme ──────────────────────────────────────────────────────────────────
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
  const inp  = {background:ibg,border:`1px solid ${cbdr}`,borderRadius:9,padding:"11px 14px",fontSize:13.5,color:tx,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none",width:"100%"}
  const ui   = userEmail?userEmail[0].toUpperCase():"G"

  const audience      = getAudience()
  const previewText   = getPreview()
  const filteredTmpls = META_TEMPLATES.filter(t=>industryFilter==="All"||t.industry===industryFilter||t.industry==="All")
  const nonAutoVars   = selectedTmpl?.vars.filter(v=>!v.auto&&v.key!=="customer_name")||[]
  const allVarsFilled = nonAutoVars.every(v=>!!tmplVals[v.key])
  const canSend       = !!whatsapp&&!!campaignName.trim()&&audience.length>0&&!!selectedTmplId&&allVarsFilled

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${bg}!important;color:${tx}!important;font-family:'Plus Jakarta Sans',sans-serif!important;}
        .wrap{display:flex;height:100vh;overflow:hidden;}

        /* Sidebar */
        .sidebar{width:220px;flex-shrink:0;background:${sb};border-right:1px solid ${bdr};display:flex;flex-direction:column;overflow-y:auto;transition:transform 0.25s;}
        .logo{padding:20px 18px 16px;font-weight:800;font-size:20px;color:${tx};text-decoration:none;display:block;border-bottom:1px solid ${bdr};}
        .logo span{color:${acc};}
        .navs{padding:16px 14px 6px;font-size:9.5px;letter-spacing:1.5px;text-transform:uppercase;color:${txf};font-weight:700;}
        .navi{display:flex;align-items:center;gap:9px;padding:8px 11px;margin:1px 7px;border-radius:8px;cursor:pointer;font-size:13px;color:${dark?"rgba(255,255,255,0.4)":"rgba(0,0,0,0.45)"};font-weight:500;transition:all 0.12s;border:1px solid transparent;background:none;width:calc(100% - 14px);text-align:left;font-family:'Plus Jakarta Sans',sans-serif;}
        .navi:hover{background:${ibg};color:${tx};}
        .navi.on{background:${dark?"rgba(0,196,125,0.1)":"rgba(0,180,115,0.08)"};color:${dark?"#00c47d":"#00935a"};font-weight:600;border-color:${dark?"rgba(0,196,125,0.2)":"rgba(0,180,115,0.2)"};}
        .sbf{margin-top:auto;padding:13px;border-top:1px solid ${bdr};}
        .uc{display:flex;align-items:center;gap:8px;padding:8px;border-radius:9px;background:${ibg};border:1px solid ${cbdr};}
        .ua{width:28px;height:28px;border-radius:7px;background:linear-gradient(135deg,${acc},#0ea5e9);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;color:#fff;flex-shrink:0;}
        .lb{margin-top:6px;width:100%;padding:6px;border-radius:7px;background:transparent;border:1px solid ${cbdr};font-size:11.5px;color:${txm};cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .lb:hover{border-color:#fca5a5;color:#ef4444;}

        /* Main */
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .topbar{height:54px;flex-shrink:0;border-bottom:1px solid ${bdr};display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:${sb};}

        /* Desktop layout: left panel + main content */
        .desktop{flex:1;display:flex;overflow:hidden;}
        .left-panel{width:300px;flex-shrink:0;border-right:1px solid ${bdr};overflow-y:auto;background:${sb};display:flex;flex-direction:column;}
        .right-area{flex:1;overflow-y:auto;background:${bg};}
        .right-pad{padding:28px;max-width:760px;margin:0 auto;}

        /* Template cards in left panel */
        .tmpl-item{padding:14px 16px;cursor:pointer;border-bottom:1px solid ${bdr};transition:background 0.1s;border-left:3px solid transparent;}
        .tmpl-item:hover{background:${ibg};}
        .tmpl-item.on{background:${adim};border-left-color:${acc};}

        /* Segment grid */
        .seg-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
        .seg-card{padding:12px 14px;border:1px solid ${cbdr};border-radius:10px;cursor:pointer;transition:all 0.12s;background:${ibg};display:flex;align-items:center;gap:10px;}
        .seg-card:hover{border-color:${acc}44;}
        .seg-card.on{border-color:${acc};background:${adim};}

        /* Step cards */
        .step-card{background:${card};border:1px solid ${cbdr};border-radius:14px;margin-bottom:18px;overflow:hidden;}
        .step-head{padding:18px 22px;border-bottom:1px solid ${bdr};display:flex;align-items:center;gap:12px;}
        .step-body{padding:22px;}
        .step-num{width:26px;height:26px;border-radius:50%;background:${adim};border:1px solid ${acc}44;display:flex;align-items:center;justify-content:center;font-size:11.5px;font-weight:700;color:${acc};flex-shrink:0;}

        /* Industry pills */
        .ip{padding:5px 13px;border-radius:100px;font-size:11.5px;font-weight:600;cursor:pointer;border:1px solid ${cbdr};background:transparent;color:${txm};font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.12s;}
        .ip.on{background:${adim};border-color:${acc};color:${acc};}

        /* Tab buttons */
        .tb{padding:4px 14px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;border:none;background:transparent;color:${txm};font-family:'Plus Jakarta Sans',sans-serif;white-space:nowrap;}
        .tb.on{background:${card};color:${tx};box-shadow:0 1px 4px rgba(0,0,0,0.15);}

        /* Var grid */
        .var-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}

        .hbtn{display:none;background:${ibg};border:1px solid ${cbdr};border-radius:7px;padding:5px 8px;cursor:pointer;font-size:16px;color:${tx};line-height:1;margin-right:4px;}
        .mob-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:299;cursor:pointer;}
        .bnav{display:none;position:fixed;bottom:0;left:0;right:0;background:${sb};border-top:1px solid ${bdr};padding:5px 0;z-index:200;}
        .bni{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px;border:none;background:transparent;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;flex:1;}
        .bnic{font-size:16px;color:${txf};}
        .bnil{font-size:9px;font-weight:600;color:${txf};}
        .bni.on .bnic,.bni.on .bnil{color:${acc};}

        input:focus,textarea:focus{border-color:${acc}88!important;outline:none;}
        select option{background-color:#0c0c15!important;color:#eeeef5!important;}

        @media(max-width:1024px){
          .left-panel{width:260px;}
        }
        @media(max-width:767px){
          .wrap{position:relative;}
          .sidebar{position:fixed;top:0;left:0;height:100vh;z-index:300;transform:translateX(-100%);}
          .sidebar.open{transform:translateX(0);box-shadow:4px 0 24px rgba(0,0,0,0.5);}
          .mob-ov.open{display:block;}
          .hbtn{display:flex;}
          .bnav{display:flex;}
          .main{padding-bottom:58px;}
          .desktop{flex-direction:column;}
          .left-panel{width:100%!important;border-right:none;border-bottom:1px solid ${bdr};max-height:320px;}
          .right-pad{padding:16px;}
          .var-grid{grid-template-columns:1fr!important;}
          .seg-grid{grid-template-columns:1fr 1fr;}
        }
      `}</style>

      <div className="wrap">
        <div className={"mob-ov"+(mobOpen?" open":"")} onClick={()=>setMobOpen(false)}/>

        {/* ── Sidebar ── */}
        <aside className={"sidebar"+(mobOpen?" open":"")}>
          <a href="/dashboard" className="logo">fast<span>rill</span></a>
          <div className="navs">Platform</div>
          {NAV.map(item=>(
            <button key={item.id} className={"navi"+(item.id==="campaigns"?" on":"")}
              onClick={()=>{ router.push(item.path); setMobOpen(false) }}>
              <span style={{fontSize:12,width:17,textAlign:"center",flexShrink:0}}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          <div className="sbf">
            <div className="uc">
              <div className="ua">{ui}</div>
              <div style={{fontSize:11,color:txm,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{userEmail||"..."}</div>
            </div>
            <button className="lb" onClick={logout}>↩ Sign out</button>
          </div>
        </aside>

        <div className="main">
          {/* ── Topbar ── */}
          <div className="topbar">
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button className="hbtn" onClick={()=>setMobOpen(s=>!s)}>☰</button>
              <span style={{fontWeight:700,fontSize:15,color:tx}}>Campaigns</span>
              <div style={{display:"flex",background:ibg,border:`1px solid ${cbdr}`,borderRadius:8,padding:2,gap:1,marginLeft:8}}>
                {[["compose","Compose"],["history",`History (${history.length})`]].map(([v,l])=>(
                  <button key={v} className={"tb"+(view===v?" on":"")}
                    onClick={()=>{ setView(v); if(v==="history") loadHistory() }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {!whatsapp&&!loading&&(
                <div onClick={()=>router.push("/dashboard/settings")}
                  style={{padding:"4px 12px",borderRadius:6,background:"rgba(251,113,133,0.1)",border:"1px solid rgba(251,113,133,0.25)",fontSize:11.5,color:"#fb7185",fontWeight:600,cursor:"pointer"}}>
                  ⚠ Connect WhatsApp
                </div>
              )}
              <button onClick={toggleTheme}
                style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",background:ibg,border:`1px solid ${cbdr}`,borderRadius:7,cursor:"pointer",fontSize:11.5,color:txm,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                <span>{dark?"🌙":"☀️"}</span>
                <div style={{width:28,height:15,borderRadius:100,background:dark?acc:"#d1d5db",position:"relative",flexShrink:0}}>
                  <div style={{position:"absolute",top:2,width:11,height:11,borderRadius:"50%",background:"#fff",left:dark?"15px":"2px",transition:"left 0.2s"}}/>
                </div>
              </button>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              HISTORY
          ══════════════════════════════════════════════════════════ */}
          {view==="history"&&(
            <div style={{flex:1,overflow:"auto",padding:28}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
                <div>
                  <div style={{fontWeight:800,fontSize:20,color:tx}}>Campaign History</div>
                  <div style={{fontSize:12.5,color:txf,marginTop:3}}>Real Meta cost · ROI calculated from actual replies</div>
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={loadHistory}
                    style={{padding:"8px 16px",borderRadius:9,background:ibg,border:`1px solid ${cbdr}`,color:txm,fontSize:12.5,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                    {histLoading?"Loading...":"↻ Refresh"}
                  </button>
                  <button onClick={()=>{ setView("compose"); setStep("setup") }}
                    style={{padding:"8px 20px",borderRadius:9,background:acc,border:"none",color:"#000",fontSize:12.5,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                    + New Campaign
                  </button>
                </div>
              </div>

              {histLoading?(
                <div style={{textAlign:"center",padding:64,color:txf,fontSize:14}}>Loading campaigns...</div>
              ):history.length===0?(
                <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:16,padding:"72px 24px",textAlign:"center"}}>
                  <div style={{fontSize:52,marginBottom:16,opacity:0.2}}>📢</div>
                  <div style={{fontWeight:800,fontSize:18,color:tx,marginBottom:8}}>No campaigns yet</div>
                  <div style={{fontSize:13.5,color:txf,marginBottom:28}}>Send your first campaign and track real revenue impact here</div>
                  <button onClick={()=>setView("compose")}
                    style={{padding:"12px 32px",borderRadius:11,background:acc,border:"none",color:"#000",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                    Create first campaign →
                  </button>
                </div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  {history.map(c=>{
                    const sc=c.sent_count||0, dlv=c.delivered_count||0, rd=c.read_count||0, rpl=c.replied_count||0
                    const roi = calcRoi(c)
                    const isDone = c.status===STATUS_COMPLETED||c.status==="done"||c.status==="completed"
                    return(
                      <div key={c.id} style={{background:card,border:`1px solid ${cbdr}`,borderRadius:14,overflow:"hidden"}}>
                        {/* Header */}
                        <div style={{padding:"16px 22px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",borderBottom:`1px solid ${bdr}`}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                              <span style={{fontWeight:700,fontSize:15,color:tx}}>{c.name}</span>
                              {c.template_name&&(
                                <span style={{fontSize:11,padding:"2px 9px",borderRadius:100,background:adim,color:acc,border:`1px solid ${acc}33`,fontWeight:600}}>{c.template_name}</span>
                              )}
                              <span style={{fontSize:11,padding:"2px 9px",borderRadius:100,
                                background:isDone?adim:c.status==="live"?"rgba(56,189,248,0.1)":"rgba(245,158,11,0.1)",
                                color:isDone?acc:c.status==="live"?"#38bdf8":"#f59e0b",
                                border:`1px solid ${isDone?acc+"33":c.status==="live"?"rgba(56,189,248,0.3)":"rgba(245,158,11,0.3)"}`,
                                fontWeight:600}}>
                                {c.status==="live"?"● Sending...":isDone?"✓ Done":"Draft"}
                              </span>
                            </div>
                            <div style={{fontSize:12,color:txm,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"82%"}}>{(c.message||"").substring(0,90)}</div>
                            <div style={{fontSize:11,color:txf,marginTop:5}}>
                              {c.sent_at?new Date(c.sent_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}):""} · {c.segment||"all customers"}
                            </div>
                          </div>
                          <div style={{textAlign:"right",flexShrink:0,marginLeft:20}}>
                            <div style={{fontSize:34,fontWeight:800,color:acc,letterSpacing:"-1.5px",lineHeight:1}}>{sc}</div>
                            <div style={{fontSize:11,color:txf,marginTop:2}}>messages sent</div>
                          </div>
                        </div>

                        {/* Delivery stats */}
                        <div style={{padding:"14px 22px",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,borderBottom:`1px solid ${bdr}`}}>
                          {[
                            {label:"Sent",      val:sc,  pct:100,                                           color:txm,      icon:"📤"},
                            {label:"Delivered", val:dlv, pct:sc>0?Math.round((dlv/sc)*100):0, color:"#38bdf8",icon:"📬"},
                            {label:"Read",      val:rd,  pct:sc>0?Math.round((rd/sc)*100):0,  color:"#a78bfa",icon:"👁"},
                            {label:"Replied",   val:rpl, pct:sc>0?Math.round((rpl/sc)*100):0, color:acc,      icon:"↩"},
                          ].map(s=>(
                            <div key={s.label} style={{background:ibg,borderRadius:10,padding:"12px 14px"}}>
                              <div style={{fontSize:10.5,color:txf,marginBottom:4}}>{s.icon} {s.label}</div>
                              <div style={{fontWeight:800,fontSize:22,color:s.val>0?s.color:txf,lineHeight:1,letterSpacing:"-0.5px"}}>{s.val}</div>
                              {sc>0&&<>
                                <div style={{marginTop:5,height:3,borderRadius:100,background:dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)"}}>
                                  <div style={{height:3,borderRadius:100,width:`${s.pct}%`,background:s.color,transition:"width 0.5s"}}/>
                                </div>
                                <div style={{fontSize:10,color:txf,marginTop:2}}>{s.pct}%</div>
                              </>}
                            </div>
                          ))}
                        </div>

                        {/* ROI — only after done */}
                        {isDone&&sc>0&&(
                          <div style={{padding:"14px 22px",background:dark?"rgba(0,208,132,0.04)":"rgba(0,147,90,0.03)",borderBottom:`1px solid ${bdr}`}}>
                            <div style={{fontSize:12,fontWeight:700,color:acc,marginBottom:10}}>📊 Campaign ROI</div>
                            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                              {[
                                {label:"Meta Cost",    val:`₹${roi.cost}`,                        color:txm},
                                {label:"Est. Bookings",val:roi.bookings,                          color:"#a78bfa"},
                                {label:"Est. Revenue", val:`₹${roi.revenue.toLocaleString()}`,    color:acc},
                                {label:"ROI",          val:`${roi.roi}%`,                         color:roi.roi>0?acc:"#fb7185"},
                              ].map(r=>(
                                <div key={r.label} style={{background:ibg,borderRadius:10,padding:"11px 13px"}}>
                                  <div style={{fontSize:10.5,color:txf,marginBottom:3}}>{r.label}</div>
                                  <div style={{fontWeight:800,fontSize:18,color:r.color}}>{r.val}</div>
                                </div>
                              ))}
                            </div>
                            <div style={{fontSize:11,color:txf,marginTop:8}}>
                              ₹{META_TEMPLATES.find(t=>t.template_name===c.template_name)?.metaCost||0.83}/msg · Revenue = replies × 60% booking rate × ₹1,200 avg
                            </div>
                          </div>
                        )}

                        <div style={{padding:"10px 22px",display:"flex",gap:10,alignItems:"center"}}>
                          <button onClick={async()=>{
                            const{count} = await supabase.from("messages").select("id",{count:"exact"}).eq("user_id",userId).eq("direction","inbound").gte("created_at",c.sent_at||c.created_at)
                            if(count!==null){ await supabase.from("campaigns").update({replied_count:count}).eq("id",c.id); await loadHistory() }
                          }} style={{padding:"5px 12px",borderRadius:7,background:"transparent",border:`1px solid ${cbdr}`,color:txf,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                            ↻ Refresh replies
                          </button>
                          {(c.failed_count||0)>0&&<span style={{fontSize:12,color:"#fb7185",marginLeft:"auto"}}>{c.failed_count} failed</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              SENDING
          ══════════════════════════════════════════════════════════ */}
          {view==="compose"&&step==="sending"&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,padding:24}}>
              <div style={{fontSize:56}}>📤</div>
              <div style={{fontWeight:800,fontSize:24,color:tx}}>Sending Campaign...</div>
              <div style={{fontSize:13.5,color:txm}}>Keep this tab open · Using approved Meta template · Reaches everyone</div>
              <div style={{display:"flex",gap:48,marginTop:8}}>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:56,fontWeight:800,color:acc,letterSpacing:"-2px",lineHeight:1}}>{sentCount}</div>
                  <div style={{fontSize:13,color:txm,marginTop:6}}>Sent</div>
                </div>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:56,fontWeight:800,color:txm,letterSpacing:"-2px",lineHeight:1}}>{Math.max(0,audience.length-sentCount-failCount)}</div>
                  <div style={{fontSize:13,color:txm,marginTop:6}}>Remaining</div>
                </div>
                {failCount>0&&<div style={{textAlign:"center"}}>
                  <div style={{fontSize:56,fontWeight:800,color:"#fb7185",letterSpacing:"-2px",lineHeight:1}}>{failCount}</div>
                  <div style={{fontSize:13,color:txm,marginTop:6}}>Failed</div>
                </div>}
              </div>
              <div style={{width:400,height:8,borderRadius:100,background:ibg,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:100,background:acc,
                  width:audience.length>0?`${Math.round(((sentCount+failCount)/audience.length)*100)}%`:"0%",
                  transition:"width 0.4s"}}/>
              </div>
              <div style={{fontSize:12.5,color:txf}}>
                {audience.length>0?Math.round(((sentCount+failCount)/audience.length)*100):0}% · ~{Math.ceil(Math.max(0,audience.length-sentCount-failCount)*1.2)}s remaining
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              DONE
          ══════════════════════════════════════════════════════════ */}
          {view==="compose"&&step==="done"&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,padding:24}}>
              <div style={{fontSize:64}}>🎉</div>
              <div style={{fontWeight:800,fontSize:28,color:tx}}>Campaign Sent!</div>
              <div style={{display:"flex",gap:48}}>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:56,fontWeight:800,color:acc,letterSpacing:"-2px",lineHeight:1}}>{sentCount}</div>
                  <div style={{fontSize:13,color:txm,marginTop:6}}>Delivered ✅</div>
                </div>
                {failCount>0&&<div style={{textAlign:"center"}}>
                  <div style={{fontSize:56,fontWeight:800,color:"#fb7185",letterSpacing:"-2px",lineHeight:1}}>{failCount}</div>
                  <div style={{fontSize:13,color:txm,marginTop:6}}>Failed</div>
                </div>}
              </div>
              <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:14,padding:"18px 28px",display:"flex",gap:36,textAlign:"center"}}>
                <div>
                  <div style={{fontSize:11.5,color:txf,marginBottom:5}}>Meta Cost</div>
                  <div style={{fontWeight:800,fontSize:22,color:txm}}>₹{campCost}</div>
                </div>
                <div style={{width:1,background:bdr}}/>
                <div>
                  <div style={{fontSize:11.5,color:txf,marginBottom:5}}>ROI in History</div>
                  <div style={{fontWeight:800,fontSize:22,color:acc}}>Auto ↻</div>
                </div>
                <div style={{width:1,background:bdr}}/>
                <div>
                  <div style={{fontSize:11.5,color:txf,marginBottom:5}}>Updates as replies arrive</div>
                  <div style={{fontWeight:800,fontSize:22,color:"#a78bfa"}}>Live</div>
                </div>
              </div>
              {sendLog.length>0&&(
                <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:12,padding:18,width:"100%",maxWidth:520,maxHeight:220,overflowY:"auto"}}>
                  <div style={{fontSize:11.5,fontWeight:700,color:txf,marginBottom:10,letterSpacing:"0.5px"}}>SEND LOG</div>
                  {sendLog.map((l,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"5px 0",borderBottom:`1px solid ${bdr}`}}>
                      <span style={{color:tx,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"55%"}}>{l.name}</span>
                      <span style={{color:l.status==="sent"?acc:"#fb7185",flexShrink:0}}>{l.status==="sent"?"✓ Sent":"✗ "+(l.error||"Failed")}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{display:"flex",gap:12}}>
                <button onClick={()=>{ setStep("setup"); setSentCount(0); setFailCount(0); setCampaignName(""); setSendLog([]) }}
                  style={{padding:"12px 32px",borderRadius:11,background:acc,border:"none",color:"#000",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  New Campaign
                </button>
                <button onClick={()=>{ setView("history"); setStep("setup"); loadHistory() }}
                  style={{padding:"12px 32px",borderRadius:11,background:ibg,border:`1px solid ${cbdr}`,color:txm,fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  View History & ROI →
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              COMPOSE — DESKTOP: Left panel + Right form
          ══════════════════════════════════════════════════════════ */}
          {view==="compose"&&step==="setup"&&(
            <div className="desktop">

              {/* ── LEFT: Template library ── */}
              <div className="left-panel">
                <div style={{padding:"16px 16px 10px",borderBottom:`1px solid ${bdr}`,position:"sticky",top:0,background:sb,zIndex:5}}>
                  <div style={{fontWeight:700,fontSize:12.5,color:tx,marginBottom:10}}>Templates</div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {INDUSTRIES.map(ind=>(
                      <button key={ind} className={"ip"+(industryFilter===ind?" on":"")} onClick={()=>setIndustryFilter(ind)}>{ind}</button>
                    ))}
                  </div>
                </div>
                {filteredTmpls.map(t=>(
                  <div key={t.id} className={"tmpl-item"+(selectedTmplId===t.id?" on":"")}
                    onClick={()=>{ setSelectedTmplId(t.id); setTmplVals(p=>({business_name:p.business_name||bizName})) }}>
                    <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:5}}>
                      <span style={{fontSize:18,lineHeight:1,flexShrink:0}}>{t.icon}</span>
                      <div style={{fontWeight:600,fontSize:13,color:selectedTmplId===t.id?acc:tx}}>{t.label}</div>
                    </div>
                    <div style={{fontSize:11,color:txf,lineHeight:1.4,marginBottom:7,paddingLeft:27}}>{t.desc}</div>
                    <div style={{display:"flex",gap:5,alignItems:"center",paddingLeft:27}}>
                      <span style={{fontSize:9.5,padding:"2px 8px",borderRadius:100,
                        background:t.category==="UTILITY"?"rgba(56,189,248,0.1)":adim,
                        color:t.category==="UTILITY"?"#38bdf8":acc,
                        border:`1px solid ${t.category==="UTILITY"?"rgba(56,189,248,0.25)":acc+"33"}`,
                        fontWeight:700}}>
                        {t.category}
                      </span>
                      <span style={{fontSize:9.5,color:txf,marginLeft:"auto"}}>₹{t.metaCost}/msg</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── RIGHT: Step-by-step form ── */}
              <div className="right-area">
                <div className="right-pad">

                  {!selectedTmplId&&(
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:400,gap:12,color:txf}}>
                      <div style={{fontSize:48,opacity:0.2}}>←</div>
                      <div style={{fontWeight:600,fontSize:15,color:txm}}>Select a template to get started</div>
                      <div style={{fontSize:12.5}}>Filter by industry on the left</div>
                    </div>
                  )}

                  {/* STEP 1 — Campaign name + vars */}
                  {selectedTmplId&&(
                    <div className="step-card">
                      <div className="step-head">
                        <div className="step-num">1</div>
                        <div>
                          <div style={{fontWeight:700,fontSize:14,color:tx}}>Campaign Details</div>
                          <div style={{fontSize:11.5,color:txf,marginTop:1}}>Name your campaign and fill in the template variables</div>
                        </div>
                        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:18}}>{selectedTmpl.icon}</span>
                          <span style={{fontWeight:600,fontSize:13,color:acc}}>{selectedTmpl.label}</span>
                          <button onClick={()=>setSelectedTmplId("")}
                            style={{padding:"5px 12px",borderRadius:7,background:ibg,border:`1px solid ${cbdr}`,color:txm,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                            ← Change
                          </button>
                        </div>
                      </div>
                      <div className="step-body">
                        {/* Campaign name */}
                        <div style={{marginBottom:20}}>
                          <div style={{fontSize:12.5,color:txm,fontWeight:600,marginBottom:7}}>Campaign Name *</div>
                          <input placeholder="e.g. Diwali Offer March 2026" value={campaignName}
                            onChange={e=>setCampaignName(e.target.value)}
                            style={{...inp,border:`1px solid ${!campaignName.trim()?"rgba(251,113,133,0.4)":cbdr}`,fontSize:14}}/>
                        </div>

                        {/* Template vars — 2-column grid on desktop */}
                        <div style={{fontSize:12.5,color:txm,fontWeight:600,marginBottom:12}}>Template Variables</div>
                        <div className="var-grid">
                          {selectedTmpl.vars.map(v=>(
                            <div key={v.key}>
                              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                                <div style={{fontSize:12.5,color:txm,fontWeight:600}}>{v.label}</div>
                                {v.auto&&<div style={{fontSize:11,color:acc,fontWeight:600}}>auto per customer</div>}
                              </div>
                              {v.auto&&v.key==="customer_name"?(
                                <div style={{...inp,background:"transparent",border:`1px solid ${acc}22`,color:acc,fontSize:12.5}}>
                                  Customer's first name — personalised per send
                                </div>
                              ):(
                                <input placeholder={v.hint||""} value={tmplVals[v.key]||""}
                                  onChange={e=>setTmplVals(p=>({...p,[v.key]:e.target.value}))}
                                  style={{...inp,border:`1px solid ${!v.auto&&!tmplVals[v.key]?"rgba(251,113,133,0.4)":cbdr}`}}/>
                              )}
                            </div>
                          ))}
                        </div>

                        <div style={{marginTop:16,padding:"11px 14px",background:`${acc}0d`,border:`1px solid ${acc}22`,borderRadius:9,fontSize:12,color:txm}}>
                          ✅ Approved Meta template — reaches any number, no 24hr restriction
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2 — Audience */}
                  {selectedTmplId&&campaignName.trim()&&(
                    <div className="step-card">
                      <div className="step-head">
                        <div className="step-num">2</div>
                        <div>
                          <div style={{fontWeight:700,fontSize:14,color:tx}}>Select Audience</div>
                          <div style={{fontSize:11.5,color:txf,marginTop:1}}>Who should receive this campaign?</div>
                        </div>
                        {audience.length>0&&(
                          <div style={{marginLeft:"auto",textAlign:"right"}}>
                            <div style={{fontSize:28,fontWeight:800,color:acc,letterSpacing:"-1px",lineHeight:1}}>{audience.length}</div>
                            <div style={{fontSize:11,color:txf}}>recipients</div>
                          </div>
                        )}
                      </div>
                      <div className="step-body">
                        <div className="seg-grid" style={{marginBottom:16}}>
                          {SEGMENTS.map(s=>{
                            const count = segCount(s.id)
                            return(
                              <div key={s.id} className={"seg-card"+(segment===s.id?" on":"")}
                                onClick={()=>{ setSegment(s.id); if(s.id!=="csv") setCsvNums([]) }}>
                                <span style={{fontSize:18,flexShrink:0}}>{s.icon}</span>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:13,fontWeight:600,color:segment===s.id?acc:tx}}>{s.label}</div>
                                  <div style={{fontSize:11,color:txf,marginTop:1}}>{s.desc}</div>
                                </div>
                                {count!==null&&(
                                  <div style={{fontSize:14,fontWeight:700,color:segment===s.id?acc:txf,flexShrink:0}}>{count}</div>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {/* Manual numbers */}
                        {segment==="manual"&&(
                          <div style={{background:ibg,border:`1px solid ${cbdr}`,borderRadius:10,padding:16,marginTop:4}}>
                            <div style={{fontSize:12.5,color:txm,fontWeight:600,marginBottom:8}}>Enter phone numbers (one per line, with country code)</div>
                            <textarea placeholder={"919876543210\n918765432109\n917654321098"} value={manualNums}
                              onChange={e=>setManualNums(e.target.value)} rows={5}
                              style={{...inp,resize:"vertical",lineHeight:1.7,marginBottom:8}}/>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                              <span style={{fontSize:12.5,color:acc,fontWeight:600}}>
                                {manualNums.replace(/[,;]/g," ").split(/\s+/).filter(s=>s.trim().length>=8).length} numbers detected
                              </span>
                              <button onClick={()=>setManualNums("")}
                                style={{fontSize:12,color:txf,background:"transparent",border:"none",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Clear</button>
                            </div>
                          </div>
                        )}

                        {/* CSV upload */}
                        {segment==="csv"&&(
                          <div style={{background:ibg,border:`1px solid ${cbdr}`,borderRadius:10,padding:16,marginTop:4}}>
                            <input ref={fileRef} type="file" accept=".csv,.txt" style={{display:"none"}} onChange={handleCsv}/>
                            <button onClick={()=>fileRef.current?.click()}
                              style={{width:"100%",padding:"12px",borderRadius:9,background:adim,border:`1px solid ${acc}44`,color:acc,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",marginBottom:8}}>
                              📎 {csvNums.length>0?`${csvNums.length} numbers loaded — click to replace`:"Upload CSV or .txt file"}
                            </button>
                            {csvNums.length>0&&(
                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                                <span style={{fontSize:12.5,color:acc,fontWeight:600}}>{csvNums.length} numbers ready</span>
                                <span style={{fontSize:12,color:"#fb7185",cursor:"pointer"}} onClick={()=>{ setCsvNums([]); setSegment("all") }}>✕ Clear</span>
                              </div>
                            )}
                            <div style={{fontSize:12,color:txf}}>One number per line, or first column of CSV. Include country code (91xxxxxxxxxx)</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 3 — Preview + Test + Send */}
                  {selectedTmplId&&campaignName.trim()&&audience.length>0&&(
                    <div className="step-card">
                      <div className="step-head">
                        <div className="step-num">3</div>
                        <div>
                          <div style={{fontWeight:700,fontSize:14,color:tx}}>Preview, Test & Send</div>
                          <div style={{fontSize:11.5,color:txf,marginTop:1}}>Always test on your own number before blasting</div>
                        </div>
                      </div>
                      <div className="step-body">
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,marginBottom:24}}>

                          {/* WhatsApp preview */}
                          <div>
                            <div style={{fontSize:12.5,color:txm,fontWeight:600,marginBottom:10}}>Message preview</div>
                            <div style={{background:dark?"#0d1117":"#e5ddd5",borderRadius:13,padding:"18px 16px"}}>
                              <div style={{background:dark?"#1c2433":"#fff",borderRadius:"4px 14px 14px 14px",padding:"13px 16px",maxWidth:"92%",display:"inline-block",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}>
                                <div style={{fontSize:13.5,color:dark?"#e8eaf0":"#111",lineHeight:1.75,whiteSpace:"pre-wrap"}}>{previewText}</div>
                                <div style={{fontSize:10.5,color:txf,marginTop:6,textAlign:"right"}}>
                                  {new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true})} ✓✓
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right: Test + Summary */}
                          <div style={{display:"flex",flexDirection:"column",gap:16}}>
                            {/* Test send */}
                            <div>
                              <div style={{fontSize:12.5,color:txm,fontWeight:600,marginBottom:8}}>🧪 Send test message</div>
                              <div style={{display:"flex",gap:8}}>
                                <input placeholder="e.g. 919876543210" value={testPhone}
                                  onChange={e=>setTestPhone(e.target.value)}
                                  onKeyDown={e=>{ if(e.key==="Enter") sendTest() }}
                                  style={{...inp,flex:1,fontSize:13}}/>
                                <button onClick={sendTest}
                                  disabled={!testPhone.trim()||!whatsapp||testState==="sending"}
                                  style={{padding:"11px 16px",borderRadius:9,flexShrink:0,
                                    background:testState==="done"?acc:testState==="fail"?"rgba(251,113,133,0.15)":adim,
                                    border:`1px solid ${testState==="fail"?"rgba(251,113,133,0.4)":acc+"44"}`,
                                    color:testState==="done"?"#000":testState==="fail"?"#fb7185":acc,
                                    fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",whiteSpace:"nowrap"}}>
                                  {testState==="sending"?"...":testState==="done"?"Sent ✓":testState==="fail"?"Failed ✗":"Send Test"}
                                </button>
                              </div>
                            </div>

                            {/* Campaign summary */}
                            <div style={{background:ibg,border:`1px solid ${cbdr}`,borderRadius:11,padding:"14px 16px",flex:1}}>
                              <div style={{fontSize:12.5,color:txm,fontWeight:600,marginBottom:12}}>Campaign Summary</div>
                              {[
                                {label:"Template",   val:selectedTmpl.label},
                                {label:"Audience",   val:`${audience.length} recipients`},
                                {label:"Meta Cost",  val:`₹${(audience.length*selectedTmpl.metaCost).toFixed(2)}`},
                                {label:"Type",       val:selectedTmpl.category},
                                {label:"Est. time",  val:`~${Math.ceil(audience.length*1.2)}s`},
                              ].map(item=>(
                                <div key={item.label} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${bdr}`}}>
                                  <span style={{fontSize:12.5,color:txf}}>{item.label}</span>
                                  <span style={{fontSize:12.5,fontWeight:600,color:tx}}>{item.val}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Send button */}
                        <button onClick={sendCampaign} disabled={!canSend||sending}
                          style={{width:"100%",padding:"16px",
                            background:canSend?"#00c47d":ibg,
                            border:`1px solid ${canSend?"#00c47d":cbdr}`,
                            borderRadius:12,color:canSend?"#000":txm,
                            fontWeight:800,fontSize:16,
                            cursor:canSend?"pointer":"not-allowed",
                            fontFamily:"'Plus Jakarta Sans',sans-serif",
                            letterSpacing:"-0.3px",
                            transition:"all 0.15s",
                            marginBottom:8}}>
                          {!allVarsFilled
                            ?"↑ Fill in all template details"
                            :`🚀 Send to ${audience.length} ${audience.length===1?"person":"people"} · ₹${(audience.length*selectedTmpl.metaCost).toFixed(2)} Meta cost`}
                        </button>
                        <div style={{fontSize:12,color:txf,textAlign:"center"}}>
                          1 msg/sec · Meta rate safe · No 24hr window restriction
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
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
