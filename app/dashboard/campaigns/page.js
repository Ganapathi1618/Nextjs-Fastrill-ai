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

const STATUS_SENDING   = "live"
const STATUS_COMPLETED = "done"

const META_TEMPLATES = [
  { id:"fastrill_salon_winback", label:"Salon Win Back", icon:"💌", category:"MARKETING", industry:"Salon", metaCost:0.83, desc:"Re-engage customers who haven't visited recently", template_name:"fastrill_salon_winback", vars:[{key:"customer_name",label:"Customer Name",auto:true},{key:"business_name",label:"Business Name",auto:true},{key:"offer",label:"Your Offer",auto:false,hint:"e.g. 20% off any service"}], preview:v=>`Hi ${v.customer_name||"Priya"}! It's been a while since your last visit at ${v.business_name||"Your Business"}.\n\nYour hair deserves some love 😊\n\n✨ Come back this week and get ${v.offer||"20% off"} — just for you.\n\nReply BOOK to grab your slot!` },
  { id:"fastrill_salon_special_offer", label:"Special Offer", icon:"🎁", category:"MARKETING", industry:"Salon", metaCost:0.83, desc:"Limited time offer to drive immediate bookings", template_name:"fastrill_salon_special_offer", vars:[{key:"customer_name",label:"Customer Name",auto:true},{key:"business_name",label:"Business Name",auto:true},{key:"offer_details",label:"Offer Details",auto:false,hint:"e.g. 50% off Keratin Treatment"},{key:"expiry_date",label:"Valid Till",auto:false,hint:"e.g. Sunday 20th March"},{key:"slots_left",label:"Slots Left",auto:false,hint:"e.g. 3"}], preview:v=>`Hi ${v.customer_name||"Priya"}! ${v.business_name||"Your Business"} has a special offer 🎉\n\n💅 ${v.offer_details||"50% off Keratin"}\n⏰ Valid till ${v.expiry_date||"Sunday"} only\nOnly ${v.slots_left||"3"} slots left!\n\nReply BOOK ✅` },
  { id:"fastrill_salon_festival", label:"Festival Greeting", icon:"🎊", category:"MARKETING", industry:"Salon", metaCost:0.83, desc:"Festival season special offer", template_name:"fastrill_salon_festival", vars:[{key:"business_name",label:"Business Name",auto:true},{key:"customer_name",label:"Customer Name",auto:true},{key:"festival_offer",label:"Festival Offer",auto:false,hint:"e.g. 25% off all bridal packages"}], preview:v=>`Hi ${v.customer_name||"Priya"}! Wishes from ${v.business_name||"Your Business"} 🎉\n\n✨ ${v.festival_offer||"25% off bridal packages"}\n📅 Limited slots this week\n\nReply BOOK 😊` },
  { id:"fastrill_clinic_followup", label:"Follow-up Reminder", icon:"🩺", category:"UTILITY", industry:"Clinic", metaCost:0.35, desc:"Remind patients to come back for a follow-up", template_name:"fastrill_clinic_followup", vars:[{key:"customer_name",label:"Patient Name",auto:true},{key:"business_name",label:"Clinic Name",auto:true},{key:"time_since_visit",label:"Time Since Visit",auto:false,hint:"e.g. 3 months"},{key:"doctor_name",label:"Doctor Name",auto:false,hint:"e.g. Dr Sharma"}], preview:v=>`Hi ${v.customer_name||"Rahul"}, reminder from ${v.business_name||"Apollo Clinic"}.\n\nIt has been ${v.time_since_visit||"3 months"} since your last visit. Dr. ${v.doctor_name||"Sharma"} recommends a follow-up 🩺\n\nReply BOOK ✅` },
  { id:"fastrill_clinic_health_offer", label:"Health Package Offer", icon:"🏥", category:"MARKETING", industry:"Clinic", metaCost:0.83, desc:"Promote a health checkup package", template_name:"fastrill_clinic_health_offer", vars:[{key:"business_name",label:"Clinic Name",auto:true},{key:"customer_name",label:"Patient Name",auto:true},{key:"package_name",label:"Package Name",auto:false,hint:"e.g. Full Body Checkup"},{key:"offer_price",label:"Offer Price",auto:false,hint:"e.g. Rs 499"},{key:"original_price",label:"Original Price",auto:false,hint:"e.g. Rs 999"}], preview:v=>`Hi ${v.customer_name||"Rahul"}! ${v.business_name||"Apollo Clinic"} has a special package 🏥\n\n🩺 ${v.package_name||"Full Body Checkup"}\n💰 Just ${v.offer_price||"Rs 499"} (usually ${v.original_price||"Rs 999"})\n\nReply BOOK ✅` },
  { id:"fastrill_spa_winback", label:"Spa Win Back", icon:"🧘", category:"MARKETING", industry:"Spa", metaCost:0.83, desc:"Bring back customers who haven't visited", template_name:"fastrill_spa_winback", vars:[{key:"customer_name",label:"Customer Name",auto:true},{key:"time_since_visit",label:"Since Last Visit",auto:false,hint:"e.g. 2 months"},{key:"business_name",label:"Spa Name",auto:true},{key:"service_name",label:"Service",auto:false,hint:"e.g. Deep Tissue Massage"},{key:"discount",label:"Discount",auto:false,hint:"e.g. 15% off"}], preview:v=>`Hi ${v.customer_name||"Priya"}! It has been ${v.time_since_visit||"2 months"} since your last session at ${v.business_name||"Serenity Spa"}.\n\n💆 ${v.service_name||"Deep Tissue Massage"} — ${v.discount||"15% off"} for returning guests.\n\nReply BOOK 🙌` },
  { id:"fastrill_universal_winback", label:"Universal Win Back", icon:"🔄", category:"MARKETING", industry:"All", metaCost:0.83, desc:"Works for any business type", template_name:"fastrill_universal_winback", vars:[{key:"customer_name",label:"Customer Name",auto:true},{key:"business_name",label:"Business Name",auto:true},{key:"offer",label:"Offer",auto:false,hint:"e.g. 15% off your next visit"},{key:"expiry",label:"Valid Till",auto:false,hint:"e.g. this Sunday"}], preview:v=>`Hi ${v.customer_name||"Priya"}! It has been a while at ${v.business_name||"Your Business"} 😊\n\n🎁 ${v.offer||"15% off"} — just for you.\nValid till ${v.expiry||"this Sunday"} only.\n\nReply BOOK ✅` },
  { id:"fastrill_universal_offer", label:"Universal Offer", icon:"🎯", category:"MARKETING", industry:"All", metaCost:0.83, desc:"Quick offer blast for any business", template_name:"fastrill_universal_offer", vars:[{key:"customer_name",label:"Customer Name",auto:true},{key:"business_name",label:"Business Name",auto:true},{key:"offer_details",label:"Offer Details",auto:false,hint:"e.g. Buy 1 Get 1 Free this week"},{key:"expiry",label:"Valid Till",auto:false,hint:"e.g. Sunday 20th March"}], preview:v=>`Hi ${v.customer_name||"Priya"}! ${v.business_name||"Your Business"} has a special offer —\n\n✨ ${v.offer_details||"Buy 1 Get 1 Free"}\n⏰ Valid till ${v.expiry||"Sunday"}\n\nReply BOOK 🙌` },
  { id:"fastrill_review_request", label:"Review Request", icon:"⭐", category:"UTILITY", industry:"All", metaCost:0.35, desc:"Ask customers to leave a Google review", template_name:"fastrill_review_request", vars:[{key:"customer_name",label:"Customer Name",auto:true},{key:"business_name",label:"Business Name",auto:true},{key:"review_link",label:"Review Link",auto:false,hint:"e.g. g.page/your-business"}], preview:v=>`Hi ${v.customer_name||"Priya"}! Thank you for visiting ${v.business_name||"Your Business"} 😊\n\nYour feedback helps us — takes 60 seconds:\n⭐ ${v.review_link||"g.page/your-business"}\n\nThank you 🙏` },
  { id:"fastrill_referral", label:"Referral Program", icon:"🤝", category:"MARKETING", industry:"All", metaCost:0.83, desc:"Get customers to refer their friends", template_name:"fastrill_referral", vars:[{key:"customer_name",label:"Customer Name",auto:true},{key:"business_name",label:"Business Name",auto:true},{key:"reward",label:"Reward",auto:false,hint:"e.g. 10% off next visit"}], preview:v=>`Hi ${v.customer_name||"Priya"}! Loved your visit at ${v.business_name||"Your Business"}? 😊\n\n👥 Refer a friend and both of you get ${v.reward||"10% off"}!\n\nJust mention your name when booking 🎁` },
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

  const [userId,    setUserId]    = useState(null)
  const [userEmail, setUserEmail] = useState("")
  const [dark,      setDark]      = useState(true)
  const [mobOpen,   setMobOpen]   = useState(false)
  const [customers, setCustomers] = useState([])
  const [optouts,   setOptouts]   = useState([])
  const [whatsapp,  setWhatsapp]  = useState(null)
  const [bizName,   setBizName]   = useState("")
  const [loading,   setLoading]   = useState(true)

  // FIX 1: Single view state — was declared twice causing syntax error
  const [view, setView] = useState("dashboard")
  const [step, setStep] = useState("setup")

  const [industryFilter,  setIndustryFilter]  = useState("All")
  const [selectedTmplId,  setSelectedTmplId]  = useState("")
  const [tmplVals,        setTmplVals]        = useState({})
  const [campaignName,    setCampaignName]    = useState("")
  const [segment,         setSegment]         = useState("all")
  const [manualNums,      setManualNums]      = useState("")
  const [csvNums,         setCsvNums]         = useState([])
  const [testPhone,       setTestPhone]       = useState("")
  const [testState,       setTestState]       = useState("idle")
  const [scheduleMode,    setScheduleMode]    = useState("now")
  const [scheduleDate,    setScheduleDate]    = useState("")
  const [scheduleTime,    setScheduleTime]    = useState("")

  // FIX 2: Missing state declarations
  const [sending,    setSending]    = useState(false)
  const [sentCount,  setSentCount]  = useState(0)
  const [failCount,  setFailCount]  = useState(0)
  const [campCost,   setCampCost]   = useState(0)
  const [sendLog,    setSendLog]    = useState([])
  const [history,    setHistory]    = useState([])
  const [histLoading,setHistLoading]= useState(false)

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

  // FIX 3: Single loadHistory — was duplicated causing extra closing bracket syntax error
  const loadHistory = useCallback(async()=>{
    if(!userId) return
    setHistLoading(true)
    const{data,error} = await supabase
      .from("campaigns").select("*")
      .eq("user_id",userId)
      .order("created_at",{ascending:false})
      .limit(50)
    if(error) console.error("History load error:",error.message)
    else setHistory(data||[])
    setHistLoading(false)
  },[userId])

  // FIX 4: getPreview — was missing, caused "getPreview is not defined"
  function getPreview(){
    if(!selectedTmpl) return ""
    const v = {...tmplVals, customer_name:"Priya", business_name:tmplVals.business_name||bizName||"Your Business"}
    return selectedTmpl.preview(v)
  }

  // FIX 5: segCount — was called but never defined
  function segCount(segId){
    if(segId==="manual"||segId==="csv") return null
    const ago30 = new Date(Date.now()-30*86400000)
    if(segId==="all")      return customers.length
    if(segId==="new_lead") return customers.filter(c=>c.tag==="new_lead").length
    if(segId==="returning")return customers.filter(c=>c.tag==="returning"||c.tag==="vip").length
    if(segId==="vip")      return customers.filter(c=>c.tag==="vip").length
    if(segId==="inactive") return customers.filter(c=>!c.last_visit_at||new Date(c.last_visit_at)<ago30).length
    return null
  }

  // FIX 6: getAudience — was using preview logic instead of customer filtering
  function getAudience(){
    if(!customers) return []
    const ago30 = new Date(Date.now()-30*86400000)
    let pool = []
    if(segment==="all")       pool = customers
    else if(segment==="new_lead")  pool = customers.filter(c=>c.tag==="new_lead")
    else if(segment==="returning") pool = customers.filter(c=>c.tag==="returning"||c.tag==="vip")
    else if(segment==="vip")       pool = customers.filter(c=>c.tag==="vip")
    else if(segment==="inactive")  pool = customers.filter(c=>!c.last_visit_at||new Date(c.last_visit_at)<ago30)
    else if(segment==="manual"){
      const nums = manualNums.replace(/[,;]/g," ").split(/\s+/).filter(s=>s.replace(/[^0-9]/g,"").length>=8)
      pool = nums.map(n=>({name:"Customer",phone:n,id:n}))
    }
    else if(segment==="csv") pool = csvNums.map(n=>({name:"Customer",phone:n,id:n}))
    // Remove optouts
    return pool.filter(c=>!optouts.includes(dedupe(c.phone)))
  }

  function getDashboardStats(){
    const completed = history.filter(c=>c.status==="done"||c.status==="completed")
    const totalSent      = completed.reduce((a,c)=>a+(c.sent_count||0),0)
    const totalDelivered = completed.reduce((a,c)=>a+(c.delivered_count||0),0)
    const totalRead      = completed.reduce((a,c)=>a+(c.read_count||0),0)
    const totalReplied   = completed.reduce((a,c)=>a+(c.replied_count||0),0)
    const totalCost      = completed.reduce((a,c)=>{ const tmpl=META_TEMPLATES.find(t=>t.template_name===c.template_name); return a+(c.sent_count||0)*(tmpl?.metaCost||0.83) },0)
    const deliveryRate   = totalSent>0?Math.min(100,Math.round((totalDelivered/totalSent)*100)):0
    const readRate       = totalSent>0?Math.min(100,Math.round((totalRead/totalSent)*100)):0
    const replyRate      = totalSent>0?Math.min(100,Math.round((totalReplied/totalSent)*100)):0
    const estBookings    = Math.round(totalReplied*0.6)
    const estRevenue     = estBookings*1200
    const roi            = totalCost>0?Math.round(((estRevenue-totalCost)/totalCost)*100):0
    return{totalSent,totalDelivered,totalRead,totalReplied,totalCost:parseFloat(totalCost.toFixed(2)),deliveryRate,readRate,replyRate,estBookings,estRevenue,roi,campaignCount:completed.length}
  }

  async function saveDraft(){
    if(!userId||!campaignName.trim()||!selectedTmplId) return
    const now = new Date().toISOString()
    const{error} = await supabase.from("campaigns").insert({
      user_id:userId, name:campaignName.trim(), status:"draft",
      template_name:selectedTmpl?.template_name||"", segment,
      message:getPreview().substring(0,500),
      sent_count:0, failed_count:0, delivered_count:0, read_count:0, replied_count:0,
      created_at:now
    })
    if(error) console.error("Draft save error:",error.message)
    else{ await loadHistory(); alert("Draft saved!") }
  }

  function buildPayload(customerName, phone){
    if(!selectedTmpl) return null
    const firstName = (customerName||"there").split(" ")[0]
    const v = {...tmplVals, customer_name:firstName, business_name:tmplVals.business_name||bizName||"our business"}
    const parameters = selectedTmpl.vars.map(vv=>({ type:"text", text:String(v[vv.key]||vv.hint||"N/A") }))
    return{ messaging_product:"whatsapp", to:phone, type:"template", template:{ name:selectedTmpl.template_name, language:{code:"en"}, components:[{type:"body",parameters}] } }
  }

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
        await supabase.from("campaigns").update({delivered_count:delivered,read_count:read}).eq("id",campId)
        await loadHistory()
      }catch(e){ console.warn("Poll error:",e.message) }
    },10000)
  }

  async function sendCampaign(){
    const aud = getAudience()
    if(!canSend||sending||!aud.length) return
    setSending(true); setSentCount(0); setFailCount(0); setSendLog([]); setStep("sending")
    const cost = parseFloat((aud.length*(selectedTmpl.metaCost||0.83)).toFixed(2))
    setCampCost(cost)
    const now = new Date().toISOString()
    const waIds=[], log=[]
    let sc=0, fc=0

    let campId = null
    const{data:newCamp, error:insertErr} = await supabase.from("campaigns").insert({
      user_id:userId, name:campaignName, status:STATUS_SENDING,
      sent_count:0, failed_count:0, delivered_count:0, read_count:0, replied_count:0,
      segment, message:getPreview().substring(0,500), template_name:selectedTmpl.template_name,
      wa_message_ids:[], sent_at:now, created_at:now,
    }).select("id").single()

    if(insertErr){ console.error("Campaign insert failed:", insertErr.message) }
    else campId = newCamp?.id

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
          try{
            const{data:convo} = await supabase.from("conversations").select("id").eq("user_id",userId).eq("phone",dedupe(customer.phone)).maybeSingle()
            await supabase.from("messages").insert({ user_id:userId, customer_phone:dedupe(customer.phone), conversation_id:convo?.id||null, direction:"outbound", message_type:"text", message_text:getPreview().substring(0,500), status:"sent", is_ai:false, wa_message_id:waId||null, created_at:now })
          }catch(e){}
        } else {
          fc++; setFailCount(fc)
          log.push({name:customer.name||customer.phone, phone, status:"failed", error:d.error.message})
        }
      }catch(e){
        fc++; setFailCount(fc)
        log.push({name:customer.name||customer.phone, phone, status:"error"})
      }
      await new Promise(r=>setTimeout(r,1200))
    }

    setSendLog(log)
    if(campId){
      await supabase.from("campaigns").update({ sent_count:sc, failed_count:fc, status:STATUS_COMPLETED, wa_message_ids:waIds }).eq("id",campId)
      if(waIds.length>0) pollDelivery(campId, waIds)
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
    const sc=c.sent_count||0, rpl=c.replied_count||0
    const tmpl=META_TEMPLATES.find(t=>t.template_name===c.template_name)
    const cost=parseFloat((sc*(tmpl?.metaCost||0.83)).toFixed(2))
    const bookings=Math.round(rpl*0.6), revenue=bookings*1200
    const roi=cost>0?Math.round(((revenue-cost)/cost)*100):0
    return{cost,bookings,revenue,roi}
  }

  const toggleTheme = ()=>{ const n=!dark; setDark(n); localStorage.setItem("fastrill-theme",n?"dark":"light") }
  const logout      = async()=>{ await supabase.auth.signOut(); router.push("/login") }

  const bg   = dark?"#08080e":"#f0f2f5"
  const sb   = dark?"#0c0c15":"#ffffff"
  const card = dark?"#0f0f1a":"#ffffff"
  const bdr  = dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.08)"
  const cbdr = dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.09)"
  const tx   = dark?"#eeeef5":"#111827"
  const txm  = dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const txf  = dark?"rgba(255,255,255,0.18)":"rgba(0,0,0,0.22)"
  const ibg  = dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"
  const acc  = dark?"#00C9B1":"#00897A"
  const adim = dark?"rgba(0,208,132,0.1)":"rgba(0,147,90,0.08)"
  const inp  = {background:ibg,border:`1px solid ${cbdr}`,borderRadius:9,padding:"11px 14px",fontSize:13.5,color:tx,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none",width:"100%"}
  const ui   = userEmail?userEmail[0].toUpperCase():"G"

  const selectedTmpl   = META_TEMPLATES.find(t=>t.id===selectedTmplId)||null
  const audience       = getAudience()
  const previewText    = getPreview()
  const filteredTmpls  = META_TEMPLATES.filter(t=>industryFilter==="All"||t.industry===industryFilter||t.industry==="All")
  const nonAutoVars    = selectedTmpl?.vars.filter(v=>!v.auto&&v.key!=="customer_name")||[]
  const allVarsFilled  = nonAutoVars.every(v=>!!tmplVals[v.key])
  const canSend        = !!whatsapp&&!!campaignName.trim()&&audience.length>0&&!!selectedTmplId&&allVarsFilled

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${bg}!important;color:${tx}!important;font-family:'Plus Jakarta Sans',sans-serif!important;}
        .wrap{display:flex;height:100vh;overflow:hidden;}
        .sidebar{width:224px;flex-shrink:0;background:${sb};border-right:1px solid ${bdr};display:flex;flex-direction:column;overflow-y:auto;transition:transform 0.25s;scrollbar-width:none;-ms-overflow-style:none;}
        .sidebar::-webkit-scrollbar{display:none;}
        .logo{padding:16px 18px;font-weight:800;font-size:20px;color:${tx};text-decoration:none;display:flex;flex-direction:row;align-items:center;gap:10px;border-bottom:1px solid ${bdr};line-height:1;};text-decoration:none;display:flex;align-items:center;gap:8px;border-bottom:1px solid ${bdr};}
        .logo span{color:${acc};}
        .navs{padding:18px 16px 7px;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${txf};font-weight:700;}
        .navi{display:flex;align-items:center;gap:9px;padding:9px 12px;margin:1px 8px;border-radius:8px;cursor:pointer;font-size:13.5px;color:${dark?"rgba(255,255,255,0.4)":"rgba(0,0,0,0.45)"};font-weight:500;transition:all 0.12s;border:1px solid transparent;background:none;width:calc(100% - 14px);text-align:left;font-family:'Plus Jakarta Sans',sans-serif;}
        .navi:hover{background:${ibg};color:${tx};}
        .navi.on{background:${dark?"rgba(0,196,125,0.1)":"rgba(0,180,115,0.08)"};color:${dark?"#00B5A0":"#00897A"};font-weight:600;border-color:${dark?"rgba(0,196,125,0.2)":"rgba(0,180,115,0.2)"};}
        .sbf{margin-top:auto;padding:14px;border-top:1px solid ${bdr};}
        .uc{display:flex;align-items:center;gap:9px;padding:9px;border-radius:9px;background:${ibg};border:1px solid ${cbdr};}
        .ua{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,${acc},#0ea5e9);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;color:#fff;flex-shrink:0;}
        .lb{margin-top:7px;width:100%;padding:7px;border-radius:7px;background:transparent;border:1px solid ${cbdr};font-size:11.5px;color:${txm};cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .lb:hover{border-color:#fca5a5;color:#ef4444;}
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .topbar{height:54px;flex-shrink:0;border-bottom:1px solid ${bdr};display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:${sb};}
        .desktop{flex:1;display:flex;overflow:hidden;}
        .left-panel{width:300px;flex-shrink:0;border-right:1px solid ${bdr};overflow-y:auto;background:${sb};display:flex;flex-direction:column;}
        .right-area{flex:1;overflow-y:auto;background:${bg};}
        .right-pad{padding:28px;max-width:760px;margin:0 auto;}
        .tmpl-item{padding:14px 16px;cursor:pointer;border-bottom:1px solid ${bdr};transition:background 0.1s;border-left:3px solid transparent;}
        .tmpl-item:hover{background:${ibg};}
        .tmpl-item.on{background:${adim};border-left-color:${acc};}
        .seg-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
        .seg-card{padding:12px 14px;border:1px solid ${cbdr};border-radius:10px;cursor:pointer;transition:all 0.12s;background:${ibg};display:flex;align-items:center;gap:10px;}
        .seg-card:hover{border-color:${acc}44;}
        .seg-card.on{border-color:${acc};background:${adim};}
        .step-card{background:${card};border:1px solid ${cbdr};border-radius:14px;margin-bottom:18px;overflow:hidden;}
        .step-head{padding:18px 22px;border-bottom:1px solid ${bdr};display:flex;align-items:center;gap:12px;}
        .step-body{padding:22px;}
        .step-num{width:26px;height:26px;border-radius:50%;background:${adim};border:1px solid ${acc}44;display:flex;align-items:center;justify-content:center;font-size:11.5px;font-weight:700;color:${acc};flex-shrink:0;}
        .ip{padding:5px 13px;border-radius:100px;font-size:11.5px;font-weight:600;cursor:pointer;border:1px solid ${cbdr};background:transparent;color:${txm};font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.12s;}
        .ip.on{background:${adim};border-color:${acc};color:${acc};}
        .tb{padding:4px 14px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;border:none;background:transparent;color:${txm};font-family:'Plus Jakarta Sans',sans-serif;white-space:nowrap;}
        .tb.on{background:${card};color:${tx};box-shadow:0 1px 4px rgba(0,0,0,0.15);}
        .var-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        .dash-kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;}
        .dash-rev{display:grid;grid-template-columns:repeat(5,1fr);gap:16px;}
        .hbtn{display:none;background:${ibg};border:1px solid ${cbdr};border-radius:7px;padding:5px 8px;cursor:pointer;font-size:16px;color:${tx};line-height:1;margin-right:4px;}
        .mob-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:299;cursor:pointer;}
        .bnav{display:none;position:fixed;bottom:0;left:0;right:0;background:${sb};border-top:1px solid ${bdr};padding:5px 0;z-index:200;}
        .bni{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px;border:none;background:transparent;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;flex:1;}
        .bnic{font-size:16px;color:${txf};}
        .bnil{font-size:9px;font-weight:600;color:${txf};}
        .bni.on .bnic,.bni.on .bnil{color:${acc};}
        input:focus,textarea:focus{border-color:${acc}88!important;outline:none;}
        @media(max-width:1024px){.left-panel{width:260px;}}
        @media(max-width:767px){
          .sidebar{position:fixed;top:0;left:0;height:100vh;z-index:300;transform:translateX(-100%);width:240px!important;box-shadow:4px 0 24px rgba(0,0,0,0.5);}
          .sidebar.open{transform:translateX(0);box-shadow:4px 0 24px rgba(0,0,0,0.5);}
          .mob-ov.open{display:block;}
          .hbtn{display:flex;}
          .bnav{display:flex;}
          .main{padding-bottom:58px;}
          .desktop{flex-direction:column;}
          .left-panel{width:100%!important;border-right:none;border-bottom:1px solid ${bdr};max-height:320px;}
          .right-pad{padding:16px;}
          .var-grid{grid-template-columns:1fr!important;}
          .dash-kpi{grid-template-columns:repeat(2,1fr)!important;}
          .dash-rev{grid-template-columns:repeat(2,1fr)!important;}
        }
      `}</style>

      <div className="wrap">
        <div className={"mob-ov"+(mobOpen?" open":"")} onClick={()=>setMobOpen(false)}/>

        <aside className={"sidebar"+(mobOpen?" open":"")}>
          <a href="/dashboard" className="logo"><img src="/logo.png" width="34" height="34" alt="Fastrill" style={{display:"block",objectFit:"contain",flexShrink:0}} /><span style={{fontWeight:800,fontSize:20,color:tx,letterSpacing:"-0.3px",lineHeight:1}}>fast<span style={{color:acc}}>rill</span></span></a>
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
          {/* FIX 7: Single topbar — was duplicated */}
          <div className="topbar">
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button className="hbtn" onClick={()=>setMobOpen(s=>!s)}>☰</button>
              <span style={{fontWeight:700,fontSize:15,color:tx}}>Campaigns</span>
              <div style={{display:"flex",background:ibg,border:`1px solid ${cbdr}`,borderRadius:8,padding:2,gap:1,marginLeft:8}}>
                {/* FIX 8: Single tab bar with all 3 views — was duplicated */}
                {[["dashboard","Overview"],["compose","Compose"],["history",`History (${history.length})`]].map(([v,l])=>(
                  <button key={v} className={"tb"+(view===v?" on":"")}
                    onClick={()=>{ setView(v); if(v==="history"||v==="dashboard") loadHistory() }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {!whatsapp&&(
                <div style={{fontSize:12,color:"#fb7185",background:"rgba(251,113,133,0.08)",border:"1px solid rgba(251,113,133,0.2)",borderRadius:7,padding:"5px 12px"}}>
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

          {/* ── DASHBOARD ── */}
          {view==="dashboard"&&(
            <div style={{flex:1,overflow:"auto",padding:28}}>
              {(()=>{
                const stats = getDashboardStats()
                return(<>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
                    <div>
                      <div style={{fontWeight:800,fontSize:22,color:tx}}>Campaign Performance</div>
                      <div style={{fontSize:13,color:txf,marginTop:3}}>{stats.campaignCount} campaigns sent · Real-time delivery tracking</div>
                    </div>
                    <button onClick={()=>{ setView("compose"); setStep("setup") }}
                      style={{padding:"10px 24px",borderRadius:10,background:acc,border:"none",color:"#000",fontSize:13.5,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                      + New Campaign
                    </button>
                  </div>
                  <div className="dash-kpi">
                    {[
                      {label:"Total Sent",    val:stats.totalSent.toLocaleString(),   sub:"messages",                   color:tx,        icon:"📤"},
                      {label:"Delivery Rate", val:stats.deliveryRate+"%",              sub:stats.totalDelivered+" delivered", color:"#38bdf8", icon:"📬"},
                      {label:"Read Rate",     val:stats.readRate+"%",                  sub:stats.totalRead+" read",          color:"#a78bfa", icon:"👁"},
                      {label:"Reply Rate",    val:stats.replyRate+"%",                 sub:stats.totalReplied+" replied",    color:acc,       icon:"↩"},
                    ].map(k=>(
                      <div key={k.label} style={{background:card,border:`1px solid ${cbdr}`,borderRadius:14,padding:"22px 20px"}}>
                        <div style={{fontSize:12,color:txf,fontWeight:600,marginBottom:12}}>{k.icon} {k.label}</div>
                        <div style={{fontSize:36,fontWeight:800,color:k.color,letterSpacing:"-1.5px",lineHeight:1}}>{k.val}</div>
                        <div style={{fontSize:11.5,color:txf,marginTop:6}}>{k.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:14,padding:"24px 28px",marginBottom:24}}>
                    <div style={{fontSize:14,fontWeight:700,color:acc,marginBottom:16}}>📊 Revenue Impact</div>
                    <div className="dash-rev">
                      {[
                        {label:"Meta Spend",     val:`₹${stats.totalCost.toLocaleString()}`,  color:txm},
                        {label:"Est. Bookings",  val:stats.estBookings,                        color:"#a78bfa"},
                        {label:"Est. Revenue",   val:`₹${stats.estRevenue.toLocaleString()}`,  color:acc},
                        {label:"ROI",            val:`${stats.roi}%`,                          color:stats.roi>0?acc:"#fb7185"},
                        {label:"Cost per Reply", val:stats.totalReplied>0?`₹${(stats.totalCost/stats.totalReplied).toFixed(1)}`:"—", color:txm},
                      ].map(r=>(
                        <div key={r.label} style={{background:ibg,borderRadius:10,padding:"14px 16px",textAlign:"center"}}>
                          <div style={{fontSize:11,color:txf,marginBottom:6}}>{r.label}</div>
                          <div style={{fontSize:24,fontWeight:800,color:r.color,letterSpacing:"-0.5px"}}>{r.val}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{fontSize:12,color:txf,marginTop:12}}>Est. Revenue = replies × 60% booking rate × avg. booking value (₹1,200). Actual results may vary.</div>
                  </div>
                  {history.length>0?(
                    <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:14,overflow:"hidden"}}>
                      <div style={{padding:"16px 22px",borderBottom:`1px solid ${bdr}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{fontSize:14,fontWeight:700,color:tx}}>Recent Campaigns</div>
                        <button onClick={()=>setView("history")} style={{fontSize:12,color:acc,background:"transparent",border:"none",cursor:"pointer",fontWeight:600,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>View all →</button>
                      </div>
                      {history.slice(0,5).map(c=>{
                        const sc=c.sent_count||0, dlv=c.delivered_count||0, rpl=c.replied_count||0
                        const isDone=c.status==="done"||c.status==="completed"
                        return(
                          <div key={c.id} style={{padding:"14px 22px",borderBottom:`1px solid ${bdr}`,display:"flex",alignItems:"center",gap:16}}>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                                <span style={{fontWeight:600,fontSize:13.5,color:tx}}>{c.name}</span>
                                <span style={{fontSize:10,padding:"2px 8px",borderRadius:100,background:isDone?adim:c.status==="live"?"rgba(56,189,248,0.1)":"rgba(245,158,11,0.1)",color:isDone?acc:c.status==="live"?"#38bdf8":"#f59e0b",fontWeight:700}}>
                                  {c.status==="live"?"Sending":isDone?"Done":c.status==="draft"?"Draft":c.status}
                                </span>
                              </div>
                              <div style={{fontSize:11.5,color:txf}}>{sc} sent · {dlv} delivered · {rpl} replied</div>
                            </div>
                            <div style={{textAlign:"right",flexShrink:0}}>
                              <div style={{fontSize:22,fontWeight:800,color:sc>0?acc:txf}}>{sc>0&&rpl>0?Math.round((rpl/sc)*100)+"%":"—"}</div>
                              <div style={{fontSize:10,color:txf}}>reply rate</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ):(
                    <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:16,padding:"72px 24px",textAlign:"center"}}>
                      <div style={{fontSize:52,marginBottom:16,opacity:0.2}}>📢</div>
                      <div style={{fontWeight:800,fontSize:18,color:tx,marginBottom:8}}>No campaigns yet</div>
                      <div style={{fontSize:13.5,color:txf,marginBottom:28}}>Create your first WhatsApp campaign to start tracking performance</div>
                      <button onClick={()=>setView("compose")} style={{padding:"12px 32px",borderRadius:11,background:acc,border:"none",color:"#000",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Create first campaign →</button>
                    </div>
                  )}
                </>)
              })()}
            </div>
          )}

          {/* ── HISTORY ── */}
          {view==="history"&&(
            <div style={{flex:1,overflow:"auto",padding:28}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
                <div>
                  <div style={{fontWeight:800,fontSize:20,color:tx}}>Campaign History</div>
                  <div style={{fontSize:12.5,color:txf,marginTop:3}}>Real Meta cost · ROI calculated from actual replies</div>
                </div>
                <button onClick={loadHistory} style={{padding:"8px 16px",borderRadius:9,background:ibg,border:`1px solid ${cbdr}`,color:txm,fontSize:12.5,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  {histLoading?"Loading...":"↻ Refresh"}
                </button>
              </div>
              {histLoading?(
                <div style={{textAlign:"center",padding:64,color:txf,fontSize:14}}>Loading campaigns...</div>
              ):history.length===0?(
                <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:16,padding:"72px 24px",textAlign:"center"}}>
                  <div style={{fontSize:52,marginBottom:16,opacity:0.2}}>📢</div>
                  <div style={{fontWeight:800,fontSize:18,color:tx,marginBottom:8}}>No campaigns yet</div>
                  <button onClick={()=>setView("compose")} style={{padding:"12px 32px",borderRadius:11,background:acc,border:"none",color:"#000",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Create first campaign →</button>
                </div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  {history.map(c=>{
                    const{cost,bookings,revenue,roi}=calcRoi(c)
                    const sc=c.sent_count||0, dlv=c.delivered_count||0, rpl=c.replied_count||0
                    const isDone=c.status==="done"||c.status==="completed"
                    return(
                      <div key={c.id} style={{background:card,border:`1px solid ${cbdr}`,borderRadius:14,padding:"20px 24px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                          <div>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                              <span style={{fontWeight:700,fontSize:15,color:tx}}>{c.name}</span>
                              <span style={{fontSize:10,padding:"2px 8px",borderRadius:100,background:isDone?adim:c.status==="live"?"rgba(56,189,248,0.1)":"rgba(245,158,11,0.1)",color:isDone?acc:c.status==="live"?"#38bdf8":"#f59e0b",fontWeight:700}}>
                                {isDone?"Done":c.status==="live"?"Sending":c.status==="draft"?"Draft":c.status}
                              </span>
                            </div>
                            <div style={{fontSize:12,color:txf}}>{c.sent_at?new Date(c.sent_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):""}</div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:28,fontWeight:800,color:roi>0?acc:"#fb7185",letterSpacing:"-1px",lineHeight:1}}>{roi>0?"+":""}{roi}%</div>
                            <div style={{fontSize:10,color:txf}}>ROI</div>
                          </div>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
                          {[
                            {label:"Sent",      val:sc,        color:tx},
                            {label:"Delivered", val:dlv,       color:"#38bdf8"},
                            {label:"Read",      val:c.read_count||0, color:"#a78bfa"},
                            {label:"Replied",   val:rpl,       color:acc},
                            {label:"Meta Cost", val:`₹${cost}`,color:txm},
                          ].map(stat=>(
                            <div key={stat.label} style={{background:ibg,borderRadius:9,padding:"10px 12px",textAlign:"center"}}>
                              <div style={{fontSize:11,color:txf,marginBottom:4}}>{stat.label}</div>
                              <div style={{fontSize:18,fontWeight:700,color:stat.color}}>{stat.val}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── COMPOSE: SENDING ── */}
          {view==="compose"&&step==="sending"&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,padding:24}}>
              <div style={{fontSize:48}}>📤</div>
              <div style={{fontWeight:800,fontSize:24,color:tx}}>Sending Campaign...</div>
              <div style={{fontSize:14,color:txm}}>{sentCount} sent · {failCount} failed</div>
              <div style={{width:"100%",maxWidth:400,background:ibg,borderRadius:100,height:8,overflow:"hidden"}}>
                <div style={{height:"100%",background:acc,borderRadius:100,
                  width:audience.length>0?`${Math.round(((sentCount+failCount)/audience.length)*100)}%`:"0%",
                  transition:"width 0.4s"}}/>
              </div>
              <div style={{fontSize:12.5,color:txf}}>
                {audience.length>0?Math.round(((sentCount+failCount)/audience.length)*100):0}% complete
              </div>
            </div>
          )}

          {/* ── COMPOSE: DONE ── */}
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

          {/* ── COMPOSE: SETUP ── */}
          {view==="compose"&&step==="setup"&&(
            <div className="desktop">
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
                      <span style={{fontSize:9.5,padding:"2px 8px",borderRadius:100,background:t.category==="UTILITY"?"rgba(56,189,248,0.1)":adim,color:t.category==="UTILITY"?"#38bdf8":acc,border:`1px solid ${t.category==="UTILITY"?"rgba(56,189,248,0.25)":acc+"33"}`,fontWeight:700}}>{t.category}</span>
                      <span style={{fontSize:9.5,color:txf,marginLeft:"auto"}}>₹{t.metaCost}/msg</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="right-area">
                <div className="right-pad">
                  {!selectedTmplId&&(
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:400,gap:12,color:txf}}>
                      <div style={{fontSize:48,opacity:0.2}}>←</div>
                      <div style={{fontWeight:600,fontSize:15,color:txm}}>Select a template to get started</div>
                    </div>
                  )}

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
                          <button onClick={()=>setSelectedTmplId("")} style={{padding:"5px 12px",borderRadius:7,background:ibg,border:`1px solid ${cbdr}`,color:txm,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>← Change</button>
                        </div>
                      </div>
                      <div className="step-body">
                        <div style={{marginBottom:20}}>
                          <div style={{fontSize:12.5,color:txm,fontWeight:600,marginBottom:7}}>Campaign Name *</div>
                          <input placeholder="e.g. Diwali Offer March 2026" value={campaignName} onChange={e=>setCampaignName(e.target.value)} style={{...inp,fontSize:14}}/>
                        </div>
                        <div style={{fontSize:12.5,color:txm,fontWeight:600,marginBottom:12}}>Template Variables</div>
                        <div className="var-grid">
                          {selectedTmpl.vars.map(v=>(
                            <div key={v.key}>
                              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                                <div style={{fontSize:12.5,color:txm,fontWeight:600}}>{v.label}</div>
                                {v.auto&&<div style={{fontSize:11,color:acc,fontWeight:600}}>auto per customer</div>}
                              </div>
                              {v.auto&&v.key==="customer_name"?(
                                <div style={{...inp,background:"transparent",border:`1px solid ${acc}22`,color:acc,fontSize:12.5}}>Customer's first name — personalised per send</div>
                              ):(
                                <input placeholder={v.hint||""} value={tmplVals[v.key]||""} onChange={e=>setTmplVals(p=>({...p,[v.key]:e.target.value}))} style={inp}/>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

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
                            const count=segCount(s.id)
                            return(
                              <div key={s.id} className={"seg-card"+(segment===s.id?" on":"")}
                                onClick={()=>{ setSegment(s.id); if(s.id!=="csv") setCsvNums([]) }}>
                                <span style={{fontSize:18,flexShrink:0}}>{s.icon}</span>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:13,fontWeight:600,color:segment===s.id?acc:tx}}>{s.label}</div>
                                  <div style={{fontSize:11,color:txf,marginTop:1}}>{s.desc}</div>
                                </div>
                                {count!==null&&<div style={{fontSize:14,fontWeight:700,color:segment===s.id?acc:txf,flexShrink:0}}>{count}</div>}
                              </div>
                            )
                          })}
                        </div>
                        {segment==="manual"&&(
                          <div style={{background:ibg,border:`1px solid ${cbdr}`,borderRadius:10,padding:16}}>
                            <div style={{fontSize:12.5,color:txm,fontWeight:600,marginBottom:8}}>Enter phone numbers (one per line)</div>
                            <textarea placeholder={"919876543210\n918765432109"} value={manualNums} onChange={e=>setManualNums(e.target.value)} rows={5} style={{...inp,resize:"vertical",lineHeight:1.7,marginBottom:8}}/>
                            <span style={{fontSize:12.5,color:acc,fontWeight:600}}>
                              {manualNums.replace(/[,;]/g," ").split(/\s+/).filter(s=>s.trim().length>=8).length} numbers detected
                            </span>
                          </div>
                        )}
                        {segment==="csv"&&(
                          <div style={{background:ibg,border:`1px solid ${cbdr}`,borderRadius:10,padding:16}}>
                            <input ref={fileRef} type="file" accept=".csv,.txt" style={{display:"none"}} onChange={handleCsv}/>
                            <button onClick={()=>fileRef.current?.click()} style={{width:"100%",padding:"12px",borderRadius:9,background:adim,border:`1px solid ${acc}44`,color:acc,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                              📎 {csvNums.length>0?`${csvNums.length} numbers loaded`:"Upload CSV or .txt file"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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
                          <div>
                            <div style={{fontSize:12.5,color:txm,fontWeight:600,marginBottom:10}}>Message preview</div>
                            <div style={{background:dark?"#0d1117":"#e5ddd5",borderRadius:13,padding:"18px 16px"}}>
                              <div style={{background:dark?"#1c2433":"#fff",borderRadius:"4px 14px 14px 14px",padding:"13px 16px",maxWidth:"92%",display:"inline-block"}}>
                                <div style={{fontSize:13.5,color:dark?"#e8eaf0":"#111",lineHeight:1.75,whiteSpace:"pre-wrap"}}>{previewText}</div>
                              </div>
                            </div>
                          </div>
                          <div style={{display:"flex",flexDirection:"column",gap:16}}>
                            <div>
                              <div style={{fontSize:12.5,color:txm,fontWeight:600,marginBottom:8}}>🧪 Send test message</div>
                              <div style={{display:"flex",gap:8}}>
                                <input placeholder="e.g. 919876543210" value={testPhone} onChange={e=>setTestPhone(e.target.value)} style={{...inp,flex:1,fontSize:13}}/>
                                <button onClick={sendTest} disabled={!testPhone.trim()||!whatsapp||testState==="sending"}
                                  style={{padding:"11px 16px",borderRadius:9,flexShrink:0,background:testState==="done"?acc:adim,border:`1px solid ${acc}44`,color:testState==="done"?"#000":acc,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",whiteSpace:"nowrap"}}>
                                  {testState==="sending"?"...":testState==="done"?"Sent ✓":"Send Test"}
                                </button>
                              </div>
                            </div>
                            <div style={{background:ibg,border:`1px solid ${cbdr}`,borderRadius:11,padding:"14px 16px",flex:1}}>
                              <div style={{fontSize:12.5,color:txm,fontWeight:600,marginBottom:12}}>Campaign Summary</div>
                              {[
                                {label:"Template",  val:selectedTmpl.label},
                                {label:"Audience",  val:`${audience.length} recipients`},
                                {label:"Meta Cost", val:`₹${(audience.length*selectedTmpl.metaCost).toFixed(2)}`},
                                {label:"Est. time", val:`~${Math.ceil(audience.length*1.2)}s`},
                              ].map(item=>(
                                <div key={item.label} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${bdr}`}}>
                                  <span style={{fontSize:12.5,color:txf}}>{item.label}</span>
                                  <span style={{fontSize:12.5,fontWeight:600,color:tx}}>{item.val}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Schedule toggle */}
                        <div style={{display:"flex",gap:8,marginBottom:14}}>
                          {[["now","⚡ Send Now"],["scheduled","🕐 Schedule"]].map(([mode,label])=>(
                            <button key={mode} onClick={()=>setScheduleMode(mode)}
                              style={{flex:1,padding:"10px",borderRadius:9,background:scheduleMode===mode?adim:ibg,border:`1px solid ${scheduleMode===mode?acc+"44":cbdr}`,color:scheduleMode===mode?acc:txm,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                              {label}
                            </button>
                          ))}
                        </div>

                        {scheduleMode==="scheduled"&&(
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                            <div>
                              <div style={{fontSize:12,color:txm,fontWeight:600,marginBottom:5}}>Date</div>
                              <input type="date" value={scheduleDate} onChange={e=>setScheduleDate(e.target.value)} min={new Date().toISOString().split("T")[0]} style={{...inp,fontSize:13}}/>
                            </div>
                            <div>
                              <div style={{fontSize:12,color:txm,fontWeight:600,marginBottom:5}}>Time</div>
                              <input type="time" value={scheduleTime} onChange={e=>setScheduleTime(e.target.value)} style={{...inp,fontSize:13}}/>
                            </div>
                          </div>
                        )}

                        <button onClick={scheduleMode==="now"?sendCampaign:()=>{ if(!scheduleDate||!scheduleTime){alert("Please select date and time");return}; saveDraft(); alert("Saved as draft — send manually at the scheduled time.") }}
                          disabled={!canSend||sending}
                          style={{width:"100%",padding:"16px",background:canSend?"#00B5A0":ibg,border:`1px solid ${canSend?"#00B5A0":cbdr}`,borderRadius:12,color:canSend?"#000":txm,fontWeight:800,fontSize:16,cursor:canSend?"pointer":"not-allowed",fontFamily:"'Plus Jakarta Sans',sans-serif",marginBottom:8}}>
                          {!allVarsFilled?"↑ Fill in all template details":scheduleMode==="scheduled"?`🕐 Schedule for ${audience.length} people`:`🚀 Send to ${audience.length} people · ₹${(audience.length*selectedTmpl.metaCost).toFixed(2)}`}
                        </button>

                        <div style={{display:"flex",gap:10,alignItems:"center",justifyContent:"center",marginTop:4}}>
                          <button onClick={saveDraft} disabled={!campaignName.trim()||!selectedTmplId}
                            style={{padding:"6px 16px",borderRadius:7,background:"transparent",border:`1px solid ${cbdr}`,color:txm,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                            💾 Save as Draft
                          </button>
                          <span style={{fontSize:12,color:txf}}>1 msg/sec · Meta rate safe</span>
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
