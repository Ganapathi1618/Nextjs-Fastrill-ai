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

// ── Your approved Meta templates ─────────────────────────────────────────────
// IMPORTANT: template_name must EXACTLY match what you named it in Meta Business Manager
// vars array order = {{1}}, {{2}}, {{3}} order in your Meta template
const META_TEMPLATES = [
  // ── SALON
  {
    id:"fastrill_salon_winback", label:"Win Back Customer", icon:"💌",
    category:"MARKETING", industry:"Salon",
    desc:"Re-engage customers who haven't visited recently",
    template_name:"fastrill_salon_winback",
    vars:[
      { key:"customer_name", label:"Customer Name", auto:true  },
      { key:"business_name", label:"Business Name", auto:true  },
      { key:"offer",         label:"Offer",         auto:false, hint:"e.g. 20% off any service" },
    ],
    preview:(v)=>`Hi ${v.customer_name||"Priya"}! It's been a while since your last visit at ${v.business_name||"Your Business"}.\n\nYour hair deserves some love 😊\n\n✨ Come back this week and get ${v.offer||"20% off"} — just for you.\n\nReply BOOK to grab your slot!`
  },
  {
    id:"fastrill_salon_special_offer", label:"Special Offer", icon:"🎁",
    category:"MARKETING", industry:"Salon",
    desc:"Send a limited time offer to drive bookings",
    template_name:"fastrill_salon_special_offer",
    vars:[
      { key:"customer_name", label:"Customer Name", auto:true  },
      { key:"business_name", label:"Business Name", auto:true  },
      { key:"offer_details", label:"Offer Details", auto:false, hint:"e.g. 50% off Keratin Treatment" },
      { key:"expiry_date",   label:"Valid Till",     auto:false, hint:"e.g. Sunday 20th March" },
      { key:"slots_left",    label:"Slots Left",     auto:false, hint:"e.g. 3" },
    ],
    preview:(v)=>`Hi ${v.customer_name||"Priya"}! ${v.business_name||"Your Business"} has a special offer this week 🎉\n\n💅 ${v.offer_details||"50% off Keratin"}\n⏰ Valid till ${v.expiry_date||"Sunday"} only\n\nOnly ${v.slots_left||"3"} slots left!\n\nReply BOOK to confirm ✅`
  },
  {
    id:"fastrill_salon_new_service", label:"New Service Launch", icon:"✨",
    category:"MARKETING", industry:"Salon",
    desc:"Announce a new service to all your customers",
    template_name:"fastrill_salon_new_service",
    vars:[
      { key:"business_name",   label:"Business Name",   auto:true  },
      { key:"customer_name",   label:"Customer Name",   auto:true  },
      { key:"service_name",    label:"Service Name",    auto:false, hint:"e.g. Hydra Facial" },
      { key:"price",           label:"Price",           auto:false, hint:"e.g. Rs 999" },
      { key:"service_benefit", label:"Benefit",         auto:false, hint:"e.g. perfect for glowing skin" },
    ],
    preview:(v)=>`Hi ${v.customer_name||"Priya"}! Big news from ${v.business_name||"Your Business"} 🎊\n\nWe just launched → ${v.service_name||"Hydra Facial"}\n💰 Introductory price: ${v.price||"Rs 999"}\n\nPerfect for ${v.service_benefit||"glowing skin"}.\n\nReply BOOK to schedule 🙌`
  },
  {
    id:"fastrill_salon_festival", label:"Festival Greeting", icon:"🎊",
    category:"MARKETING", industry:"Salon",
    desc:"Festival season special offer",
    template_name:"fastrill_salon_festival",
    vars:[
      { key:"business_name",  label:"Business Name",  auto:true  },
      { key:"customer_name",  label:"Customer Name",  auto:true  },
      { key:"festival_offer", label:"Festival Offer", auto:false, hint:"e.g. 25% off all bridal packages this Ugadi" },
    ],
    preview:(v)=>`Hi ${v.customer_name||"Priya"}! Wishing you a wonderful celebration from ${v.business_name||"Your Business"} 🎉\n\nLook your absolute best —\n✨ ${v.festival_offer||"25% off bridal packages"}\n📅 Limited slots this week\n\nReply BOOK 😊`
  },
  // ── CLINIC
  {
    id:"fastrill_clinic_followup", label:"Follow-up Reminder", icon:"🩺",
    category:"UTILITY", industry:"Clinic",
    desc:"Remind patients to come back for a follow-up",
    template_name:"fastrill_clinic_followup",
    vars:[
      { key:"customer_name",    label:"Patient Name",      auto:true  },
      { key:"clinic_name",      label:"Clinic Name",       auto:true  },
      { key:"time_since_visit", label:"Time Since Visit",  auto:false, hint:"e.g. 3 months" },
      { key:"doctor_name",      label:"Doctor Name",       auto:false, hint:"e.g. Dr Sharma" },
    ],
    preview:(v)=>`Hi ${v.customer_name||"Rahul"}, reminder from ${v.clinic_name||"Apollo Clinic"}.\n\nIt has been ${v.time_since_visit||"3 months"} since your last visit. Dr. ${v.doctor_name||"Sharma"} recommends a follow-up 🩺\n\nReply BOOK to confirm your slot ✅`
  },
  {
    id:"fastrill_clinic_health_offer", label:"Health Package Offer", icon:"🏥",
    category:"MARKETING", industry:"Clinic",
    desc:"Promote a health checkup package",
    template_name:"fastrill_clinic_health_offer",
    vars:[
      { key:"clinic_name",    label:"Clinic Name",    auto:true  },
      { key:"customer_name",  label:"Patient Name",   auto:true  },
      { key:"package_name",   label:"Package Name",   auto:false, hint:"e.g. Full Body Checkup" },
      { key:"offer_price",    label:"Offer Price",    auto:false, hint:"e.g. Rs 499" },
      { key:"original_price", label:"Original Price", auto:false, hint:"e.g. Rs 999" },
    ],
    preview:(v)=>`Hi ${v.customer_name||"Rahul"}! ${v.clinic_name||"Apollo Clinic"} has a special package 🏥\n\n🩺 ${v.package_name||"Full Body Checkup"}\n💰 At just ${v.offer_price||"Rs 499"} (usually ${v.original_price||"Rs 999"})\n📅 This week only\n\nReply BOOK ✅`
  },
  {
    id:"fastrill_clinic_appointment_reminder", label:"Appointment Reminder", icon:"📅",
    category:"UTILITY", industry:"Clinic",
    desc:"Confirm upcoming appointments with patients",
    template_name:"fastrill_clinic_appointment_reminder",
    vars:[
      { key:"clinic_name",   label:"Clinic Name",  auto:true  },
      { key:"customer_name", label:"Patient Name", auto:true  },
      { key:"appt_date",     label:"Date",         auto:false, hint:"e.g. Saturday 22nd March" },
      { key:"appt_time",     label:"Time",         auto:false, hint:"e.g. 10:30 AM" },
      { key:"doctor_name",   label:"Doctor",       auto:false, hint:"e.g. Dr Sharma" },
    ],
    preview:(v)=>`Hi ${v.customer_name||"Rahul"}! Reminder from ${v.clinic_name||"Apollo Clinic"} 🏥\n\n📅 ${v.appt_date||"Saturday 22nd"} at ${v.appt_time||"10:30 AM"}\n👨‍⚕️ Dr. ${v.doctor_name||"Sharma"}\n\nReply CONFIRM ✅ or RESCHEDULE`
  },
  // ── SPA
  {
    id:"fastrill_spa_winback", label:"Spa Win Back", icon:"🧘",
    category:"MARKETING", industry:"Spa",
    desc:"Bring back customers who haven't visited",
    template_name:"fastrill_spa_winback",
    vars:[
      { key:"customer_name",    label:"Customer Name",   auto:true  },
      { key:"time_since_visit", label:"Time Since Visit", auto:false, hint:"e.g. 2 months" },
      { key:"spa_name",         label:"Spa Name",        auto:true  },
      { key:"service_name",     label:"Service",         auto:false, hint:"e.g. Deep Tissue Massage" },
      { key:"discount",         label:"Discount",        auto:false, hint:"e.g. 15% off" },
    ],
    preview:(v)=>`Hi ${v.customer_name||"Priya"}! It has been ${v.time_since_visit||"2 months"} since your last session at ${v.spa_name||"Serenity Spa"}.\n\nWe have your favourite ${v.service_name||"Deep Tissue Massage"} —\n💆 ${v.discount||"15% off"} for returning guests.\n\nReply BOOK 🙌`
  },
  // ── UNIVERSAL
  {
    id:"fastrill_universal_winback", label:"Universal Win Back", icon:"🔄",
    category:"MARKETING", industry:"All",
    desc:"Works for any business type",
    template_name:"fastrill_universal_winback",
    vars:[
      { key:"customer_name", label:"Customer Name", auto:true  },
      { key:"business_name", label:"Business Name", auto:true  },
      { key:"offer",         label:"Offer",         auto:false, hint:"e.g. 15% off your next visit" },
      { key:"expiry",        label:"Valid Till",     auto:false, hint:"e.g. this Sunday" },
    ],
    preview:(v)=>`Hi ${v.customer_name||"Priya"}! It has been a while since we last connected at ${v.business_name||"Your Business"} 😊\n\n🎁 ${v.offer||"15% off"} — just for returning customers.\n\nValid till ${v.expiry||"this Sunday"} only.\n\nReply BOOK ✅`
  },
  {
    id:"fastrill_universal_offer", label:"Universal Offer", icon:"🎯",
    category:"MARKETING", industry:"All",
    desc:"Quick offer blast for any business",
    template_name:"fastrill_universal_offer",
    vars:[
      { key:"customer_name", label:"Customer Name", auto:true  },
      { key:"business_name", label:"Business Name", auto:true  },
      { key:"offer_details", label:"Offer Details", auto:false, hint:"e.g. Buy 1 Get 1 Free this week" },
      { key:"expiry",        label:"Valid Till",     auto:false, hint:"e.g. Sunday 20th March" },
    ],
    preview:(v)=>`Hi ${v.customer_name||"Priya"}! ${v.business_name||"Your Business"} has a special offer —\n\n✨ ${v.offer_details||"Buy 1 Get 1 Free"}\n⏰ Valid till ${v.expiry||"Sunday"}\n\nReply BOOK now 🙌`
  },
  {
    id:"fastrill_universal_reminder", label:"Appointment Reminder", icon:"📋",
    category:"UTILITY", industry:"All",
    desc:"Works for any appointment-based business",
    template_name:"fastrill_universal_reminder",
    vars:[
      { key:"customer_name", label:"Customer Name", auto:true  },
      { key:"business_name", label:"Business Name", auto:true  },
      { key:"appt_date",     label:"Date",          auto:false, hint:"e.g. Saturday 22nd March" },
      { key:"appt_time",     label:"Time",          auto:false, hint:"e.g. 4:00 PM" },
      { key:"location",      label:"Location",      auto:false, hint:"e.g. 12 MG Road, Hyderabad" },
    ],
    preview:(v)=>`Hi ${v.customer_name||"Priya"}! Reminder from ${v.business_name||"Your Business"} 📅\n\n📅 ${v.appt_date||"Saturday 22nd"} at ${v.appt_time||"4:00 PM"}\n📍 ${v.location||"Our location"}\n\nReply CONFIRM ✅ or RESCHEDULE`
  },
  {
    id:"fastrill_review_request", label:"Review Request", icon:"⭐",
    category:"UTILITY", industry:"All",
    desc:"Ask happy customers to leave a Google review",
    template_name:"fastrill_review_request",
    vars:[
      { key:"customer_name", label:"Customer Name", auto:true  },
      { key:"business_name", label:"Business Name", auto:true  },
      { key:"review_link",   label:"Review Link",   auto:false, hint:"e.g. g.page/your-business" },
    ],
    preview:(v)=>`Hi ${v.customer_name||"Priya"}! Thank you for visiting ${v.business_name||"Your Business"} 😊\n\nYour feedback helps us serve you better — takes just 60 seconds:\n\n⭐ ${v.review_link||"g.page/your-business"}\n\nWe truly appreciate your support 🙏`
  },
  {
    id:"fastrill_referral", label:"Referral Program", icon:"🤝",
    category:"MARKETING", industry:"All",
    desc:"Get customers to refer their friends",
    template_name:"fastrill_referral",
    vars:[
      { key:"customer_name", label:"Customer Name", auto:true  },
      { key:"business_name", label:"Business Name", auto:true  },
      { key:"reward",        label:"Reward",        auto:false, hint:"e.g. 10% off next visit" },
    ],
    preview:(v)=>`Hi ${v.customer_name||"Priya"}! Loved your visit at ${v.business_name||"Your Business"}? 😊\n\n👥 Refer a friend and both of you get ${v.reward||"10% off"}!\n\nJust ask them to mention your name when booking 🎁\n\nReply REFER to get your link 🙌`
  },
]

const SEGMENTS = [
  { id:"all",       label:"All Customers",  desc:"Everyone who has messaged you",  icon:"👥" },
  { id:"new_lead",  label:"New Leads",      desc:"First-time, not booked yet",      icon:"✨" },
  { id:"returning", label:"Returning",      desc:"Booked 2+ times",                icon:"🔄" },
  { id:"vip",       label:"VIP",            desc:"Tagged as VIP",                  icon:"⭐" },
  { id:"inactive",  label:"Inactive 30d+",  desc:"No visit in 30 days",            icon:"💤" },
  { id:"manual",    label:"Enter Numbers",  desc:"Paste numbers manually",          icon:"✏️" },
  { id:"csv",       label:"Upload CSV",     desc:"Upload a .csv or .txt file",      icon:"📎" },
]

const INDUSTRIES = ["All","Salon","Clinic","Spa","Gym","Restaurant"]

function toSendPhone(phone) {
  const d = (phone||"").replace(/[^0-9]/g,"")
  if (d.length===10) return "91"+d
  if (d.length===12&&d.startsWith("91")) return d
  if (d.length===11&&d.startsWith("0")) return "91"+d.slice(1)
  return d
}
function dedupePhone(phone) {
  const d = (phone||"").replace(/[^0-9]/g,"")
  return d.length>=12?d.slice(-10):d
}

export default function Campaigns() {
  const router  = useRouter()
  const fileRef = useRef(null)
  const pollRef = useRef(null)

  const [userId, setUserId]       = useState(null)
  const [userEmail, setUserEmail] = useState("")
  const [dark, setDark]           = useState(true)
  const [mobOpen, setMobOpen]     = useState(false)
  const [customers, setCustomers] = useState([])
  const [optouts, setOptouts]     = useState([])
  const [whatsapp, setWhatsapp]   = useState(null)
  const [bizName, setBizName]     = useState("")
  const [loading, setLoading]     = useState(true)
  const [history, setHistory]     = useState([])

  const [view, setView]           = useState("compose")
  const [step, setStep]           = useState("setup")

  const [selectedTmplId, setSelectedTmplId] = useState("")
  const [tmplVals, setTmplVals]   = useState({})
  const [industryFilter, setIndustryFilter] = useState("All")
  const [campaignName, setCampaignName]     = useState("")
  const [segment, setSegment]     = useState("all")
  const [manualNums, setManualNums] = useState("")
  const [csvNums, setCsvNums]     = useState([])
  const [testPhone, setTestPhone] = useState("")
  const [testState, setTestState] = useState("idle")
  const [sentCount, setSentCount] = useState(0)
  const [failCount, setFailCount] = useState(0)
  const [sendLog, setSendLog]     = useState([])
  const [sending, setSending]     = useState(false)

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
    const [{data:custs},{data:wa},{data:biz}] = await Promise.all([
      supabase.from("customers").select("id,name,phone,tag,last_visit_at,created_at").eq("user_id",userId),
      supabase.from("whatsapp_connections").select("*").eq("user_id",userId).maybeSingle(),
      supabase.from("business_settings").select("business_name").eq("user_id",userId).maybeSingle(),
    ])
    setCustomers(custs||[])
    setWhatsapp(wa||null)
    const bn = biz?.business_name||""
    setBizName(bn)
    if (bn) setTmplVals(p=>({...p,business_name:bn}))
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
      const {data} = await supabase.from("campaigns").select("*").eq("user_id",userId)
        .order("created_at",{ascending:false}).limit(50)
      setHistory(data||[])
    } catch(e){}
  },[userId])

  function getAudience() {
    const now = new Date()
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

  const selectedTmpl = META_TEMPLATES.find(t=>t.id===selectedTmplId)

  // ── KEY: Build proper Meta template API payload ───────────────────────────
  // This sends as an approved WhatsApp template — reaches ANYONE, no 24hr limit
  function buildTemplatePayload(customerName, phone) {
    if (!selectedTmpl) return null
    const firstName = (customerName||"there").split(" ")[0]
    const vals = {...tmplVals, customer_name:firstName, business_name:tmplVals.business_name||bizName||"our business"}
    // Map spa_name and clinic_name to business_name if not set
    if (!vals.spa_name)    vals.spa_name    = vals.business_name
    if (!vals.clinic_name) vals.clinic_name = vals.business_name

    const parameters = selectedTmpl.vars.map(v=>({
      type:"text",
      text:String(vals[v.key]||v.hint||"")
    }))

    return {
      messaging_product:"whatsapp",
      to: phone,
      type:"template",
      template:{
        name: selectedTmpl.template_name,
        language:{ code:"en" },
        components:[{ type:"body", parameters }]
      }
    }
  }

  function getPreview() {
    if (!selectedTmpl) return ""
    const v = {...tmplVals, customer_name:"Priya", business_name:tmplVals.business_name||bizName||"Your Business"}
    if (!v.spa_name)    v.spa_name    = v.business_name
    if (!v.clinic_name) v.clinic_name = v.business_name
    return selectedTmpl.preview(v)
  }

  async function sendTest() {
    if (!testPhone.trim()||!whatsapp||!selectedTmpl||testState==="sending") return
    setTestState("sending")
    try {
      const phone   = toSendPhone(testPhone)
      const payload = buildTemplatePayload("Test", phone)
      const res = await fetch(`https://graph.facebook.com/v18.0/${whatsapp.phone_number_id}/messages`,{
        method:"POST",
        headers:{"Authorization":`Bearer ${whatsapp.access_token}`,"Content-Type":"application/json"},
        body:JSON.stringify(payload)
      })
      const d = await res.json()
      if (d.error) { console.error("Test send error:",d.error.message); setTestState("fail"); setTimeout(()=>setTestState("idle"),3000) }
      else { setTestState("done"); setTimeout(()=>setTestState("idle"),3000) }
    } catch(e){ setTestState("fail"); setTimeout(()=>setTestState("idle"),3000) }
  }

  async function startPolling(campId, waIds) {
    if (pollRef.current) clearInterval(pollRef.current)
    if (!waIds?.length) return
    let ticks=0
    pollRef.current = setInterval(async()=>{
      ticks++; if (ticks>60){ clearInterval(pollRef.current); return }
      try {
        const {data:msgs} = await supabase.from("messages").select("status,wa_message_id").in("wa_message_id",waIds)
        if (!msgs) return
        const delivered = msgs.filter(m=>m.status==="delivered"||m.status==="read").length
        const read      = msgs.filter(m=>m.status==="read").length
        await supabase.from("campaigns").update({delivered_count:delivered,read_count:read}).eq("id",campId)
        await loadHistory()
      } catch(e){}
    },10000)
  }

  async function sendCampaign() {
    if (!canSend||sending) return
    const audience = getAudience()
    if (!audience.length) return
    setSending(true); setSentCount(0); setFailCount(0); setSendLog([]); setStep("sending")
    const waIds=[]; const log=[]; let sc=0,fc=0

    let campId = null
    try {
      const {data:newCamp} = await supabase.from("campaigns").insert({
        user_id:userId, name:campaignName, segment,
        message:getPreview(), template_name:selectedTmpl?.template_name||"",
        sent_count:0, failed_count:0, delivered_count:0, read_count:0, replied_count:0,
        status:"sending", sent_at:new Date().toISOString(), created_at:new Date().toISOString(), wa_message_ids:[],
      }).select().single()
      campId = newCamp?.id||null
    } catch(e){ console.warn("Campaign insert error:",e.message) }

    for (const customer of audience) {
      const phone   = toSendPhone(customer.phone)
      const payload = buildTemplatePayload(customer.name, phone)
      if (!payload) continue
      try {
        const res = await fetch(`https://graph.facebook.com/v18.0/${whatsapp.phone_number_id}/messages`,{
          method:"POST",
          headers:{"Authorization":`Bearer ${whatsapp.access_token}`,"Content-Type":"application/json"},
          body:JSON.stringify(payload)
        })
        const d = await res.json()
        if (!d.error) {
          sc++; setSentCount(sc)
          const waId = d?.messages?.[0]?.id
          if (waId) waIds.push(waId)
          log.push({name:customer.name||customer.phone,phone,status:"sent"})
          // Save to messages table for AI context
          try {
            const {data:convo} = await supabase.from("conversations").select("id").eq("user_id",userId).eq("phone",dedupePhone(customer.phone)).maybeSingle()
            await supabase.from("messages").insert({
              user_id:userId, customer_phone:dedupePhone(customer.phone),
              conversation_id:convo?.id||null, direction:"outbound", message_type:"text",
              message_text:getPreview().substring(0,500), status:"sent", is_ai:false,
              wa_message_id:waId||null, created_at:new Date().toISOString(),
            })
          } catch(e){}
        } else {
          fc++; setFailCount(fc)
          log.push({name:customer.name||customer.phone,phone,status:"failed",error:d.error.message})
          console.error(`Failed for ${phone}:`,d.error.message)
        }
      } catch(e){ fc++; setFailCount(fc); log.push({name:customer.name||customer.phone,phone,status:"error"}) }
      await new Promise(r=>setTimeout(r,1200))
    }

    setSendLog(log)
    if (campId) {
      try {
        await supabase.from("campaigns").update({sent_count:sc,failed_count:fc,wa_message_ids:waIds,status:"completed"}).eq("id",campId)
        if (waIds.length>0) startPolling(campId,waIds)
      } catch(e){}
    }
    await loadHistory()
    setSending(false); setStep("done")
  }

  function handleCsv(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev=>{
      const nums=[]
      ev.target.result.split("\n").forEach(line=>{
        line.replace(/\r/g,"").split(",").forEach(col=>{ const d=col.replace(/[^0-9]/g,""); if(d.length>=10) nums.push(d) })
      })
      setCsvNums([...new Set(nums)]); setSegment("csv")
    }
    reader.readAsText(file)
  }

  const toggleTheme = ()=>{ const n=!dark; setDark(n); localStorage.setItem("fastrill-theme",n?"dark":"light") }
  const logout = async()=>{ await supabase.auth.signOut(); router.push("/login") }

  // Theme tokens
  const bg=dark?"#08080e":"#f0f2f5", sb=dark?"#0c0c15":"#ffffff", card=dark?"#0f0f1a":"#ffffff"
  const bdr=dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.08)", cbdr=dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.09)"
  const tx=dark?"#eeeef5":"#111827", txm=dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const txf=dark?"rgba(255,255,255,0.18)":"rgba(0,0,0,0.22)", ibg=dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"
  const acc=dark?"#00d084":"#00935a", adim=dark?"rgba(0,208,132,0.1)":"rgba(0,147,90,0.08)"
  const inp={background:ibg,border:`1px solid ${cbdr}`,borderRadius:8,padding:"9px 12px",fontSize:13,color:tx,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none",width:"100%"}
  const ui=userEmail?userEmail[0].toUpperCase():"G"

  const audience    = getAudience()
  const previewText = getPreview()
  const filteredTmpls = META_TEMPLATES.filter(t=>industryFilter==="All"||t.industry===industryFilter||t.industry==="All")
  const allVarsFilled = selectedTmpl?selectedTmpl.vars.filter(v=>!v.auto&&v.key!=="customer_name").every(v=>!!tmplVals[v.key]):false
  const canSend = !!whatsapp&&!!campaignName.trim()&&audience.length>0&&!!selectedTmplId&&allVarsFilled

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${bg}!important;color:${tx}!important;font-family:'Plus Jakarta Sans',sans-serif!important;}
        .wrap{display:flex;height:100vh;overflow:hidden;}
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
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .topbar{height:52px;flex-shrink:0;border-bottom:1px solid ${bdr};display:flex;align-items:center;justify-content:space-between;padding:0 20px;background:${sb};}
        .con{flex:1;overflow-y:auto;}
        .shell{display:grid;grid-template-columns:280px 1fr 270px;height:100%;overflow:hidden;}
        .col-l{border-right:1px solid ${bdr};overflow-y:auto;display:flex;flex-direction:column;background:${sb};}
        .col-m{overflow-y:auto;padding:18px;background:${bg};}
        .col-r{border-left:1px solid ${bdr};overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:11px;background:${sb};}
        .tmpl-card{padding:12px 14px;cursor:pointer;border-bottom:1px solid ${bdr};transition:background 0.1s;display:flex;align-items:flex-start;gap:10px;}
        .tmpl-card:hover{background:${ibg};}
        .tmpl-card.on{background:${adim};border-left:3px solid ${acc};}
        .seg-item{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;border-bottom:1px solid ${bdr};transition:background 0.1s;}
        .seg-item:hover{background:${ibg};}
        .seg-item.on{background:${adim};border-left:3px solid ${acc};}
        .ind-btn{padding:4px 11px;border-radius:100px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid ${cbdr};background:transparent;color:${txm};font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.12s;}
        .ind-btn.on{background:${adim};border-color:${acc}44;color:${acc};}
        .hbtn{display:none;background:${ibg};border:1px solid ${cbdr};border-radius:7px;padding:5px 8px;cursor:pointer;font-size:16px;color:${tx};line-height:1;margin-right:4px;}
        .mob-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:299;cursor:pointer;}
        .bnav{display:none;position:fixed;bottom:0;left:0;right:0;background:${sb};border-top:1px solid ${bdr};padding:5px 0;z-index:200;}
        .bni{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px;border:none;background:transparent;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;flex:1;}
        .bnic{font-size:16px;color:${txf};}
        .bnil{font-size:9px;font-weight:600;color:${txf};}
        .bni.on .bnic,.bni.on .bnil{color:${acc};}
        input:focus,textarea:focus{border-color:${acc}66!important;}
        select option{background-color:#0c0c15!important;color:#eeeef5!important;}
        @media(max-width:1100px){.shell{grid-template-columns:250px 1fr 250px;}}
        @media(max-width:900px){.shell{grid-template-columns:1fr!important;height:auto;}.col-l,.col-r{border:none;border-bottom:1px solid ${bdr};max-height:none;}.col-m{padding:12px;}}
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
          <div className="topbar">
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <button className="hbtn" onClick={()=>setMobOpen(s=>!s)}>☰</button>
              <span style={{fontWeight:700,fontSize:15,color:tx}}>Campaigns</span>
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
                <div onClick={()=>router.push("/dashboard/settings")} style={{padding:"4px 10px",borderRadius:6,background:"rgba(251,113,133,0.1)",border:"1px solid rgba(251,113,133,0.25)",fontSize:11,color:"#fb7185",fontWeight:600,cursor:"pointer"}}>
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

          <div className="con">

            {/* ════ HISTORY ════════════════════════════════════════════════ */}
            {view==="history"&&(
              <div style={{padding:20}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:15,color:tx}}>Campaign History</div>
                    <div style={{fontSize:11.5,color:txf,marginTop:2}}>Delivery stats update automatically via WhatsApp webhooks</div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={loadHistory} style={{padding:"7px 14px",borderRadius:8,background:ibg,border:`1px solid ${cbdr}`,color:txm,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>↻ Refresh</button>
                    <button onClick={()=>{ setView("compose"); setStep("setup") }} style={{padding:"7px 16px",borderRadius:8,background:acc,border:"none",color:"#000",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>+ New Campaign</button>
                  </div>
                </div>

                {history.length===0?(
                  <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:14,padding:"56px 20px",textAlign:"center"}}>
                    <div style={{fontSize:40,marginBottom:12,opacity:0.25}}>📢</div>
                    <div style={{fontWeight:700,fontSize:15,color:tx,marginBottom:6}}>No campaigns yet</div>
                    <div style={{fontSize:12.5,color:txf,marginBottom:20}}>Send your first campaign and see full analytics here</div>
                    <button onClick={()=>setView("compose")} style={{padding:"10px 24px",borderRadius:9,background:acc,border:"none",color:"#000",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                      Create first campaign →
                    </button>
                  </div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {history.map(c=>{
                      const sc=c.sent_count||0, dlv=c.delivered_count||0, rd=c.read_count||0, rpl=c.replied_count||0
                      return (
                        <div key={c.id} style={{background:card,border:`1px solid ${cbdr}`,borderRadius:13,overflow:"hidden"}}>
                          <div style={{padding:"14px 16px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",borderBottom:`1px solid ${bdr}`}}>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5,flexWrap:"wrap"}}>
                                <span style={{fontWeight:700,fontSize:14,color:tx}}>{c.name}</span>
                                {c.template_name&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:100,background:adim,color:acc,border:`1px solid ${acc}33`,fontWeight:600}}>{c.template_name}</span>}
                                <span style={{fontSize:10,padding:"2px 8px",borderRadius:100,background:c.status==="completed"?adim:"rgba(245,158,11,0.1)",color:c.status==="completed"?acc:"#f59e0b",border:`1px solid ${c.status==="completed"?acc+"33":"rgba(245,158,11,0.3)"}`,fontWeight:600}}>
                                  {c.status==="sending"?"● Sending...":"✓ Completed"}
                                </span>
                              </div>
                              <div style={{fontSize:11.5,color:txm,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"80%"}}>{(c.message||"").substring(0,80)}</div>
                              <div style={{fontSize:11,color:txf,marginTop:4}}>{c.sent_at?new Date(c.sent_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}):""} · {c.segment}</div>
                            </div>
                            <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
                              <div style={{fontSize:28,fontWeight:800,color:acc,letterSpacing:"-1px",lineHeight:1}}>{sc}</div>
                              <div style={{fontSize:10.5,color:txf}}>sent</div>
                            </div>
                          </div>
                          <div style={{padding:"12px 16px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
                            {[
                              {label:"Sent",      val:sc,  pct:100,                                          color:txm,      icon:"📤"},
                              {label:"Delivered", val:dlv, pct:sc>0?Math.round((dlv/sc)*100):0, color:"#38bdf8", icon:"📬"},
                              {label:"Read",      val:rd,  pct:sc>0?Math.round((rd/sc)*100):0,  color:"#a78bfa", icon:"👁"},
                              {label:"Replied",   val:rpl, pct:sc>0?Math.round((rpl/sc)*100):0, color:acc,        icon:"↩"},
                            ].map(s=>(
                              <div key={s.label} style={{background:ibg,borderRadius:9,padding:"10px 11px"}}>
                                <div style={{fontSize:10,color:txf,marginBottom:4}}>{s.icon} {s.label}</div>
                                <div style={{fontWeight:800,fontSize:20,color:s.val>0?s.color:txf,lineHeight:1,letterSpacing:"-0.5px"}}>{s.val}</div>
                                {sc>0&&<>
                                  <div style={{marginTop:5,height:2,borderRadius:100,background:dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)"}}>
                                    <div style={{height:2,borderRadius:100,width:`${s.pct}%`,background:s.color,transition:"width 0.5s"}}/>
                                  </div>
                                  <div style={{fontSize:9.5,color:txf,marginTop:2}}>{s.pct}%</div>
                                </>}
                              </div>
                            ))}
                          </div>
                          <div style={{padding:"8px 16px",borderTop:`1px solid ${bdr}`,display:"flex",gap:8,alignItems:"center"}}>
                            <button onClick={async()=>{
                              try {
                                const {count} = await supabase.from("messages").select("id",{count:"exact"}).eq("user_id",userId).eq("direction","inbound").gte("created_at",c.sent_at||c.created_at)
                                if (count!==null){ await supabase.from("campaigns").update({replied_count:count}).eq("id",c.id); await loadHistory() }
                              } catch(e){}
                            }} style={{padding:"4px 10px",borderRadius:6,background:"transparent",border:`1px solid ${cbdr}`,color:txf,fontSize:11,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                              ↻ Refresh replies
                            </button>
                            {(c.failed_count||0)>0&&<span style={{fontSize:11,color:"#fb7185",marginLeft:"auto"}}>{c.failed_count} failed</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ════ SENDING ════════════════════════════════════════════════ */}
            {view==="compose"&&step==="sending"&&(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"80vh",gap:16,padding:20}}>
                <div style={{fontSize:44}}>📤</div>
                <div style={{fontWeight:800,fontSize:20,color:tx}}>Sending Campaign...</div>
                <div style={{fontSize:12,color:txm,textAlign:"center"}}>Keep this tab open · Using approved Meta template · Reaches everyone</div>
                <div style={{display:"flex",gap:28,marginTop:4}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:44,fontWeight:800,color:acc,letterSpacing:"-1.5px",lineHeight:1}}>{sentCount}</div>
                    <div style={{fontSize:11,color:txm,marginTop:3}}>Sent</div>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:44,fontWeight:800,color:txm,letterSpacing:"-1.5px",lineHeight:1}}>{Math.max(0,audience.length-sentCount-failCount)}</div>
                    <div style={{fontSize:11,color:txm,marginTop:3}}>Remaining</div>
                  </div>
                  {failCount>0&&<div style={{textAlign:"center"}}>
                    <div style={{fontSize:44,fontWeight:800,color:"#fb7185",letterSpacing:"-1.5px",lineHeight:1}}>{failCount}</div>
                    <div style={{fontSize:11,color:txm,marginTop:3}}>Failed</div>
                  </div>}
                </div>
                <div style={{width:320,height:6,borderRadius:100,background:ibg,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:100,background:acc,width:audience.length>0?`${Math.round(((sentCount+failCount)/audience.length)*100)}%`:"0%",transition:"width 0.4s"}}/>
                </div>
                <div style={{fontSize:11,color:txf}}>{audience.length>0?Math.round(((sentCount+failCount)/audience.length)*100):0}% · ~{Math.ceil(Math.max(0,audience.length-sentCount-failCount)*1.2)}s remaining</div>
              </div>
            )}

            {/* ════ DONE ════════════════════════════════════════════════════ */}
            {view==="compose"&&step==="done"&&(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"80vh",gap:16,padding:20}}>
                <div style={{fontSize:52}}>🎉</div>
                <div style={{fontWeight:800,fontSize:22,color:tx}}>Campaign Sent!</div>
                <div style={{display:"flex",gap:24}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:44,fontWeight:800,color:acc,letterSpacing:"-2px",lineHeight:1}}>{sentCount}</div>
                    <div style={{fontSize:12,color:txm,marginTop:4}}>Sent via approved template ✅</div>
                  </div>
                  {failCount>0&&<div style={{textAlign:"center"}}>
                    <div style={{fontSize:44,fontWeight:800,color:"#fb7185",letterSpacing:"-2px",lineHeight:1}}>{failCount}</div>
                    <div style={{fontSize:12,color:txm,marginTop:4}}>Failed</div>
                  </div>}
                </div>
                <div style={{fontSize:12,color:txf,textAlign:"center",maxWidth:340,lineHeight:1.7}}>
                  Approved templates reach everyone — no 24hr window restriction. Check History for live delivery stats.
                </div>
                {sendLog.length>0&&(
                  <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:11,padding:14,width:"100%",maxWidth:440,maxHeight:180,overflowY:"auto"}}>
                    <div style={{fontSize:10.5,fontWeight:700,color:txf,marginBottom:7}}>SEND LOG</div>
                    {sendLog.map((l,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:11.5,padding:"3px 0",borderBottom:`1px solid ${bdr}`}}>
                        <span style={{color:tx,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"55%"}}>{l.name}</span>
                        <span style={{color:l.status==="sent"?acc:"#fb7185",flexShrink:0}}>{l.status==="sent"?"✓ Sent":"✗ "+(l.error||"Failed")}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{display:"flex",gap:10,marginTop:4}}>
                  <button onClick={()=>{ setStep("setup"); setSentCount(0); setFailCount(0); setCampaignName(""); setSendLog([]) }}
                    style={{padding:"10px 24px",borderRadius:9,background:acc,border:"none",color:"#000",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                    New Campaign
                  </button>
                  <button onClick={()=>{ setView("history"); setStep("setup"); loadHistory() }}
                    style={{padding:"10px 24px",borderRadius:9,background:ibg,border:`1px solid ${cbdr}`,color:txm,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                    View History →
                  </button>
                </div>
              </div>
            )}

            {/* ════ COMPOSE ════════════════════════════════════════════════ */}
            {view==="compose"&&step==="setup"&&(
              <div className="shell">

                {/* LEFT: Template library */}
                <div className="col-l">
                  <div style={{padding:"14px 14px 10px",borderBottom:`1px solid ${bdr}`,position:"sticky",top:0,background:sb,zIndex:10}}>
                    <div style={{fontWeight:700,fontSize:12,color:tx,marginBottom:8}}>1 · Pick Template</div>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                      {INDUSTRIES.map(ind=>(
                        <button key={ind} className={"ind-btn"+(industryFilter===ind?" on":"")} onClick={()=>setIndustryFilter(ind)}>{ind}</button>
                      ))}
                    </div>
                  </div>
                  {filteredTmpls.map(t=>(
                    <div key={t.id} className={"tmpl-card"+(selectedTmplId===t.id?" on":"")}
                      onClick={()=>{ setSelectedTmplId(t.id); setTmplVals(p=>({business_name:p.business_name||bizName})) }}>
                      <span style={{fontSize:22,flexShrink:0,marginTop:1}}>{t.icon}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:600,fontSize:13,color:selectedTmplId===t.id?acc:tx,marginBottom:2}}>{t.label}</div>
                        <div style={{fontSize:10.5,color:txf,lineHeight:1.4,marginBottom:5}}>{t.desc}</div>
                        <div style={{display:"flex",gap:5}}>
                          <span style={{fontSize:9.5,padding:"1px 7px",borderRadius:100,background:t.category==="UTILITY"?"rgba(56,189,248,0.1)":adim,color:t.category==="UTILITY"?"#38bdf8":acc,border:`1px solid ${t.category==="UTILITY"?"rgba(56,189,248,0.25)":acc+"33"}`,fontWeight:700}}>
                            {t.category}
                          </span>
                          {t.industry!=="All"&&<span style={{fontSize:9.5,padding:"1px 7px",borderRadius:100,background:ibg,color:txf,border:`1px solid ${cbdr}`}}>{t.industry}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* MIDDLE: Details + preview */}
                <div className="col-m">
                  {/* Campaign name */}
                  <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:12,padding:16,marginBottom:14}}>
                    <div style={{fontWeight:700,fontSize:12,color:tx,marginBottom:8}}>2 · Campaign Name</div>
                    <input placeholder="e.g. Diwali Offer 2026" value={campaignName}
                      onChange={e=>setCampaignName(e.target.value)}
                      style={{...inp,border:`1px solid ${!campaignName.trim()?"rgba(251,113,133,0.3)":cbdr}`}}/>
                  </div>

                  {selectedTmpl?(
                    <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:12,overflow:"hidden",marginBottom:14}}>
                      <div style={{padding:"13px 16px",borderBottom:`1px solid ${bdr}`,display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:24}}>{selectedTmpl.icon}</span>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,fontSize:13.5,color:tx}}>{selectedTmpl.label}</div>
                          <div style={{fontSize:11,color:txf,marginTop:1}}>{selectedTmpl.desc}</div>
                        </div>
                        <button onClick={()=>setSelectedTmplId("")}
                          style={{padding:"4px 10px",borderRadius:6,background:"transparent",border:`1px solid ${cbdr}`,color:txm,fontSize:11,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                          ← Change
                        </button>
                      </div>
                      <div style={{padding:16}}>
                        <div style={{fontSize:11.5,color:txf,marginBottom:14}}>3 · Fill in the details</div>
                        {selectedTmpl.vars.map(v=>(
                          <div key={v.key} style={{marginBottom:12}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                              <div style={{fontSize:11.5,color:txm,fontWeight:600}}>{v.label}</div>
                              {v.auto&&<div style={{fontSize:10,color:acc,fontWeight:600}}>auto per customer</div>}
                            </div>
                            {v.auto&&v.key==="customer_name"?(
                              <div style={{...inp,background:"transparent",border:`1px solid ${acc}22`,color:acc,fontSize:12}}>Customer's first name (auto-filled)</div>
                            ):(
                              <input placeholder={v.hint||""} value={tmplVals[v.key]||""}
                                onChange={e=>setTmplVals(p=>({...p,[v.key]:e.target.value}))}
                                style={{...inp,border:`1px solid ${v.auto?cbdr:(!tmplVals[v.key]?"rgba(251,113,133,0.25)":cbdr)}`}}/>
                            )}
                          </div>
                        ))}
                        <div style={{padding:"9px 11px",background:`${acc}0d`,border:`1px solid ${acc}22`,borderRadius:8,fontSize:11,color:txm,lineHeight:1.6}}>
                          ✅ Approved template — reaches <strong>any number</strong>, no 24hr window restriction
                        </div>
                      </div>
                    </div>
                  ):(
                    <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:12,padding:"40px 20px",textAlign:"center",marginBottom:14}}>
                      <div style={{fontSize:32,marginBottom:10,opacity:0.2}}>←</div>
                      <div style={{fontWeight:600,fontSize:13,color:tx,marginBottom:4}}>Select a template from the left</div>
                      <div style={{fontSize:11.5,color:txf}}>Filter by industry to find the right one</div>
                    </div>
                  )}

                  {/* Preview */}
                  {previewText&&(
                    <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:12,padding:16,marginBottom:14}}>
                      <div style={{fontWeight:700,fontSize:12,color:tx,marginBottom:10}}>
                        Preview <span style={{fontSize:11,color:txf,fontWeight:400}}>— as your customer sees it</span>
                      </div>
                      <div style={{background:dark?"#0d1117":"#e5ddd5",borderRadius:11,padding:"14px 12px"}}>
                        <div style={{background:dark?"#1c2433":"#fff",borderRadius:"4px 13px 13px 13px",padding:"11px 14px",maxWidth:"90%",display:"inline-block",boxShadow:"0 1px 4px rgba(0,0,0,0.18)"}}>
                          <div style={{fontSize:13,color:dark?"#e8eaf0":"#111",lineHeight:1.75,whiteSpace:"pre-wrap"}}>{previewText}</div>
                          <div style={{fontSize:9.5,color:txf,marginTop:5,textAlign:"right"}}>{new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true})} ✓✓</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Test */}
                  <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:12,padding:16}}>
                    <div style={{fontWeight:700,fontSize:12,color:tx,marginBottom:3}}>🧪 Test First</div>
                    <div style={{fontSize:11,color:txf,marginBottom:9}}>Send to your own number before blasting</div>
                    <div style={{display:"flex",gap:8}}>
                      <input placeholder="e.g. 919876543210" value={testPhone}
                        onChange={e=>setTestPhone(e.target.value)}
                        onKeyDown={e=>{ if(e.key==="Enter") sendTest() }}
                        style={{...inp,flex:1}}/>
                      <button onClick={sendTest} disabled={!testPhone.trim()||!whatsapp||testState==="sending"||!selectedTmplId}
                        style={{padding:"9px 14px",borderRadius:8,background:testState==="done"?acc:testState==="fail"?"rgba(251,113,133,0.15)":adim,border:`1px solid ${testState==="fail"?"rgba(251,113,133,0.4)":acc+"44"}`,color:testState==="done"?"#000":testState==="fail"?"#fb7185":acc,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",flexShrink:0}}>
                        {testState==="sending"?"Sending...":testState==="done"?"Sent ✓":testState==="fail"?"Failed ✗":"Send Test"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Audience + Send */}
                <div className="col-r">
                  {/* Audience */}
                  <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:12,overflow:"hidden"}}>
                    <div style={{padding:"12px 14px",borderBottom:`1px solid ${bdr}`,fontWeight:700,fontSize:12,color:tx}}>4 · Select Audience</div>
                    {SEGMENTS.map(s=>(
                      <div key={s.id} className={"seg-item"+(segment===s.id?" on":"")}
                        onClick={()=>{ setSegment(s.id); if(s.id!=="csv") setCsvNums([]) }}>
                        <span style={{fontSize:15}}>{s.icon}</span>
                        <div>
                          <div style={{fontSize:12.5,fontWeight:600,color:segment===s.id?acc:tx}}>{s.label}</div>
                          <div style={{fontSize:10.5,color:txf,marginTop:1}}>{s.desc}</div>
                        </div>
                      </div>
                    ))}
                    {segment==="manual"&&(
                      <div style={{padding:"10px 12px",borderTop:`1px solid ${bdr}`}}>
                        <textarea placeholder={"919876543210\n918765432109"} value={manualNums}
                          onChange={e=>setManualNums(e.target.value)} rows={4}
                          style={{...inp,resize:"vertical",fontSize:12,lineHeight:1.6,marginBottom:4}}/>
                        <div style={{fontSize:10.5,color:acc}}>{manualNums.replace(/[,;]/g," ").split(/\s+/).filter(s=>s.trim().length>=8).length} numbers</div>
                      </div>
                    )}
                    {segment==="csv"&&(
                      <div style={{padding:"10px 12px",borderTop:`1px solid ${bdr}`}}>
                        <input ref={fileRef} type="file" accept=".csv,.txt" style={{display:"none"}} onChange={handleCsv}/>
                        <button onClick={()=>fileRef.current?.click()}
                          style={{width:"100%",padding:"8px",borderRadius:8,background:adim,border:`1px solid ${acc}44`,color:acc,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                          📎 {csvNums.length>0?`${csvNums.length} numbers loaded`:"Upload CSV"}
                        </button>
                        {csvNums.length>0&&<div style={{fontSize:11,color:txf,marginTop:4,textAlign:"center"}}><span style={{color:"#fb7185",cursor:"pointer"}} onClick={()=>{ setCsvNums([]); setSegment("all") }}>✕ Clear</span></div>}
                      </div>
                    )}
                  </div>

                  {/* Checklist */}
                  <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:12,padding:13}}>
                    <div style={{fontWeight:700,fontSize:12,color:tx,marginBottom:9}}>Ready Checklist</div>
                    {[
                      {label:"WhatsApp connected", done:!!whatsapp},
                      {label:"Campaign named",     done:!!campaignName.trim()},
                      {label:"Template selected",  done:!!selectedTmplId},
                      {label:"All fields filled",  done:allVarsFilled},
                      {label:"Audience selected",  done:audience.length>0},
                      {label:"Test sent",          done:testState==="done"},
                    ].map(item=>(
                      <div key={item.label} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:`1px solid ${bdr}`}}>
                        <div style={{width:16,height:16,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:item.done?"rgba(34,197,94,0.15)":ibg,border:`1px solid ${item.done?"rgba(34,197,94,0.35)":cbdr}`,fontSize:9,color:item.done?"#22c55e":txf}}>
                          {item.done?"✓":"○"}
                        </div>
                        <span style={{fontSize:11.5,color:item.done?tx:txm}}>{item.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Send */}
                  <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:12,padding:14}}>
                    <div style={{fontSize:40,fontWeight:800,color:audience.length>0?acc:txf,letterSpacing:"-1.5px",lineHeight:1,marginBottom:3}}>{audience.length}</div>
                    <div style={{fontSize:12,color:txm,marginBottom:8}}>{audience.length===1?"recipient":"recipients"}{optouts.length>0&&<span style={{color:txf,fontSize:11}}> · {optouts.length} excluded</span>}</div>

                    {audience.length>0&&(
                      <div style={{marginBottom:10,maxHeight:85,overflowY:"auto",background:ibg,borderRadius:8,padding:"7px 10px"}}>
                        {audience.slice(0,5).map((c,i)=>(
                          <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"2px 0",borderBottom:`1px solid ${bdr}`}}>
                            <span style={{color:tx,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"55%"}}>{c.name||c.phone}</span>
                            <span style={{fontFamily:"monospace",color:txf}}>···{toSendPhone(c.phone).slice(-4)}</span>
                          </div>
                        ))}
                        {audience.length>5&&<div style={{fontSize:10.5,color:txf,paddingTop:3}}>+{audience.length-5} more</div>}
                      </div>
                    )}

                    <div style={{padding:"7px 9px",background:`${acc}0a`,border:`1px solid ${acc}22`,borderRadius:7,fontSize:10.5,color:txm,marginBottom:12,lineHeight:1.5}}>
                      ✅ Template reaches everyone — no 24hr window
                    </div>

                    <button onClick={sendCampaign} disabled={!canSend||sending}
                      style={{width:"100%",padding:"13px",background:canSend?"#00c47d":ibg,border:`1px solid ${canSend?"#00c47d":cbdr}`,borderRadius:10,color:canSend?"#000":txm,fontWeight:800,fontSize:14,cursor:canSend?"pointer":"not-allowed",fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:"-0.3px",transition:"all 0.15s"}}>
                      {!whatsapp?"Connect WhatsApp first"
                        :!campaignName.trim()?"↑ Name your campaign"
                        :!selectedTmplId?"← Pick a template"
                        :!allVarsFilled?"Fill in the details ↑"
                        :!audience.length?"Select an audience"
                        :`🚀 Send to ${audience.length} ${audience.length===1?"person":"people"}`}
                    </button>
                    <div style={{fontSize:10.5,color:txf,textAlign:"center",marginTop:7}}>~{Math.ceil(audience.length*1.2)}s · 1 msg/sec · Meta rate safe</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
