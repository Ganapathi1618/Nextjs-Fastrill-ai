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

// ── ONLY templates that are confirmed working with correct variable counts ──
// Each template's vars array must EXACTLY match what you submitted to Meta
// If your Meta template has 3 variables, vars array must have exactly 3 items
const META_TEMPLATES = [
  {
    id:"fastrill_salon_winback",
    label:"Salon Win Back", icon:"💌",
    category:"MARKETING", industry:"Salon",
    metaCost:0.83,
    desc:"Re-engage customers who haven't visited recently",
    template_name:"fastrill_salon_winback",
    // EXACTLY 3 variables: {{1}}=customer_name, {{2}}=business_name, {{3}}=offer
    vars:[
      {key:"customer_name", label:"Customer Name", auto:true},
      {key:"business_name", label:"Business Name", auto:true},
      {key:"offer",         label:"Your Offer",    auto:false, hint:"e.g. 20% off any service"},
    ],
    preview:v=>`Hi ${v.customer_name||"Priya"}! It's been a while since your last visit at ${v.business_name||"Your Business"}.\n\nYour hair deserves some love 😊\n\n✨ Come back this week and get ${v.offer||"20% off"} — just for you.\n\nReply BOOK to grab your slot!`
  },
  {
    id:"fastrill_salon_special_offer",
    label:"Special Offer", icon:"🎁",
    category:"MARKETING", industry:"Salon",
    metaCost:0.83,
    desc:"Limited time offer to drive immediate bookings",
    template_name:"fastrill_salon_special_offer",
    // EXACTLY 5 variables
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
    id:"fastrill_salon_festival",
    label:"Festival Greeting", icon:"🎊",
    category:"MARKETING", industry:"Salon",
    metaCost:0.83,
    desc:"Festival season special offer",
    template_name:"fastrill_salon_festival",
    // EXACTLY 3 variables
    vars:[
      {key:"business_name",  label:"Business Name",  auto:true},
      {key:"customer_name",  label:"Customer Name",  auto:true},
      {key:"festival_offer", label:"Festival Offer", auto:false, hint:"e.g. 25% off all bridal packages"},
    ],
    preview:v=>`Hi ${v.customer_name||"Priya"}! Wishes from ${v.business_name||"Your Business"} 🎉\n\n✨ ${v.festival_offer||"25% off bridal packages"}\n📅 Limited slots this week\n\nReply BOOK 😊`
  },
  {
    id:"fastrill_clinic_followup",
    label:"Follow-up Reminder", icon:"🩺",
    category:"UTILITY", industry:"Clinic",
    metaCost:0.35,
    desc:"Remind patients to come back for a follow-up",
    template_name:"fastrill_clinic_followup",
    // EXACTLY 4 variables
    vars:[
      {key:"customer_name",    label:"Patient Name",     auto:true},
      {key:"business_name",    label:"Clinic Name",      auto:true},
      {key:"time_since_visit", label:"Time Since Visit", auto:false, hint:"e.g. 3 months"},
      {key:"doctor_name",      label:"Doctor Name",      auto:false, hint:"e.g. Dr Sharma"},
    ],
    preview:v=>`Hi ${v.customer_name||"Rahul"}, reminder from ${v.business_name||"Apollo Clinic"}.\n\nIt has been ${v.time_since_visit||"3 months"} since your last visit. Dr. ${v.doctor_name||"Sharma"} recommends a follow-up 🩺\n\nReply BOOK ✅`
  },
  {
    id:"fastrill_clinic_health_offer",
    label:"Health Package Offer", icon:"🏥",
    category:"MARKETING", industry:"Clinic",
    metaCost:0.83,
    desc:"Promote a health checkup package",
    template_name:"fastrill_clinic_health_offer",
    // EXACTLY 5 variables
    vars:[
      {key:"business_name",   label:"Clinic Name",     auto:true},
      {key:"customer_name",   label:"Patient Name",    auto:true},
      {key:"package_name",    label:"Package Name",    auto:false, hint:"e.g. Full Body Checkup"},
      {key:"offer_price",     label:"Offer Price",     auto:false, hint:"e.g. Rs 499"},
      {key:"original_price",  label:"Original Price",  auto:false, hint:"e.g. Rs 999"},
    ],
    preview:v=>`Hi ${v.customer_name||"Rahul"}! ${v.business_name||"Apollo Clinic"} has a special package 🏥\n\n🩺 ${v.package_name||"Full Body Checkup"}\n💰 Just ${v.offer_price||"Rs 499"} (usually ${v.original_price||"Rs 999"})\n\nReply BOOK ✅`
  },
  {
    id:"fastrill_spa_winback",
    label:"Spa Win Back", icon:"🧘",
    category:"MARKETING", industry:"Spa",
    metaCost:0.83,
    desc:"Bring back customers who haven't visited",
    template_name:"fastrill_spa_winback",
    // EXACTLY 5 variables
    vars:[
      {key:"customer_name",    label:"Customer Name",   auto:true},
      {key:"time_since_visit", label:"Time Since Visit", auto:false, hint:"e.g. 2 months"},
      {key:"business_name",    label:"Spa Name",        auto:true},
      {key:"service_name",     label:"Service",         auto:false, hint:"e.g. Deep Tissue Massage"},
      {key:"discount",         label:"Discount",        auto:false, hint:"e.g. 15% off"},
    ],
    preview:v=>`Hi ${v.customer_name||"Priya"}! It has been ${v.time_since_visit||"2 months"} since your last session at ${v.business_name||"Serenity Spa"}.\n\n💆 ${v.service_name||"Deep Tissue Massage"} — ${v.discount||"15% off"} for returning guests.\n\nReply BOOK 🙌`
  },
  {
    id:"fastrill_universal_winback",
    label:"Universal Win Back", icon:"🔄",
    category:"MARKETING", industry:"All",
    metaCost:0.83,
    desc:"Works for any business type",
    template_name:"fastrill_universal_winback",
    // EXACTLY 4 variables
    vars:[
      {key:"customer_name", label:"Customer Name", auto:true},
      {key:"business_name", label:"Business Name", auto:true},
      {key:"offer",         label:"Offer",         auto:false, hint:"e.g. 15% off your next visit"},
      {key:"expiry",        label:"Valid Till",    auto:false, hint:"e.g. this Sunday"},
    ],
    preview:v=>`Hi ${v.customer_name||"Priya"}! It has been a while at ${v.business_name||"Your Business"} 😊\n\n🎁 ${v.offer||"15% off"} — just for you.\nValid till ${v.expiry||"this Sunday"} only.\n\nReply BOOK ✅`
  },
  {
    id:"fastrill_universal_offer",
    label:"Universal Offer", icon:"🎯",
    category:"MARKETING", industry:"All",
    metaCost:0.83,
    desc:"Quick offer blast for any business",
    template_name:"fastrill_universal_offer",
    // EXACTLY 4 variables
    vars:[
      {key:"customer_name", label:"Customer Name", auto:true},
      {key:"business_name", label:"Business Name", auto:true},
      {key:"offer_details", label:"Offer Details", auto:false, hint:"e.g. Buy 1 Get 1 Free this week"},
      {key:"expiry",        label:"Valid Till",    auto:false, hint:"e.g. Sunday 20th March"},
    ],
    preview:v=>`Hi ${v.customer_name||"Priya"}! ${v.business_name||"Your Business"} has a special offer —\n\n✨ ${v.offer_details||"Buy 1 Get 1 Free"}\n⏰ Valid till ${v.expiry||"Sunday"}\n\nReply BOOK 🙌`
  },
  {
    id:"fastrill_review_request",
    label:"Review Request", icon:"⭐",
    category:"UTILITY", industry:"All",
    metaCost:0.35,
    desc:"Ask happy customers to leave a Google review",
    template_name:"fastrill_review_request",
    // EXACTLY 3 variables
    vars:[
      {key:"customer_name", label:"Customer Name", auto:true},
      {key:"business_name", label:"Business Name", auto:true},
      {key:"review_link",   label:"Review Link",   auto:false, hint:"e.g. g.page/your-business"},
    ],
    preview:v=>`Hi ${v.customer_name||"Priya"}! Thank you for visiting ${v.business_name||"Your Business"} 😊\n\nYour feedback helps us — takes 60 seconds:\n⭐ ${v.review_link||"g.page/your-business"}\n\nThank you 🙏`
  },
  {
    id:"fastrill_referral",
    label:"Referral Program", icon:"🤝",
    category:"MARKETING", industry:"All",
    metaCost:0.83,
    desc:"Get customers to refer their friends",
    template_name:"fastrill_referral",
    // EXACTLY 3 variables
    vars:[
      {key:"customer_name", label:"Customer Name", auto:true},
      {key:"business_name", label:"Business Name", auto:true},
      {key:"reward",        label:"Reward",        auto:false, hint:"e.g. 10% off next visit"},
    ],
    preview:v=>`Hi ${v.customer_name||"Priya"}! Loved your visit at ${v.business_name||"Your Business"}? 😊\n\n👥 Refer a friend and both of you get ${v.reward||"10% off"}!\n\nJust mention your name when booking 🎁`
  },
]

const SEGMENTS = [
  {id:"all",       label:"All Customers",  desc:"Everyone who has messaged you",  icon:"👥"},
  {id:"new_lead",  label:"New Leads",      desc:"First-time, not booked yet",     icon:"✨"},
  {id:"returning", label:"Returning",      desc:"Booked 2+ times",                icon:"🔄"},
  {id:"vip",       label:"VIP",            desc:"Tagged as VIP",                  icon:"⭐"},
  {id:"inactive",  label:"Inactive 30d+",  desc:"No visit in 30 days",            icon:"💤"},
  {id:"manual",    label:"Enter Numbers",  desc:"Paste numbers manually",          icon:"✏️"},
  {id:"csv",       label:"Upload CSV",     desc:"Upload a .csv or .txt file",      icon:"📎"},
]

const INDUSTRIES = ["All","Salon","Clinic","Spa","Gym","Restaurant"]

function toSendPhone(p){
  const d=(p||"").replace(/[^0-9]/g,"")
  if(d.length===10)return"91"+d
  if(d.length===12&&d.startsWith("91"))return d
  if(d.length===11&&d.startsWith("0"))return"91"+d.slice(1)
  return d
}
function dedupePhone(p){
  const d=(p||"").replace(/[^0-9]/g,"")
  return d.length>=12?d.slice(-10):d
}

export default function Campaigns(){
  const router=useRouter()
  const fileRef=useRef(null)
  const pollRef=useRef(null)

  const [userId,setUserId]=useState(null)
  const [userEmail,setUserEmail]=useState("")
  const [dark,setDark]=useState(true)
  const [mobOpen,setMobOpen]=useState(false)
  const [customers,setCustomers]=useState([])
  const [optouts,setOptouts]=useState([])
  const [whatsapp,setWhatsapp]=useState(null)
  const [bizName,setBizName]=useState("")
  const [loading,setLoading]=useState(true)
  const [history,setHistory]=useState([])
  const [histLoading,setHistLoading]=useState(false)

  const [view,setView]=useState("compose")
  const [step,setStep]=useState("setup")

  const [selectedTmplId,setSelectedTmplId]=useState("")
  const [tmplVals,setTmplVals]=useState({})
  const [industryFilter,setIndustryFilter]=useState("All")
  const [campaignName,setCampaignName]=useState("")
  const [segment,setSegment]=useState("all")
  const [manualNums,setManualNums]=useState("")
  const [csvNums,setCsvNums]=useState([])
  const [testPhone,setTestPhone]=useState("")
  const [testState,setTestState]=useState("idle")
  const [sentCount,setSentCount]=useState(0)
  const [failCount,setFailCount]=useState(0)
  const [sendLog,setSendLog]=useState([])
  const [sending,setSending]=useState(false)
  const [lastCampId,setLastCampId]=useState(null)
  const [lastCampCost,setLastCampCost]=useState(0)

  useEffect(()=>{
    const saved=localStorage.getItem("fastrill-theme")
    if(saved)setDark(saved==="dark")
    supabase.auth.getUser().then(({data})=>{
      if(!data?.user)router.push("/login")
      else{setUserEmail(data.user.email||"");setUserId(data.user.id)}
    })
  },[])

  useEffect(()=>{if(userId)loadAll()},[userId])
  useEffect(()=>()=>{if(pollRef.current)clearInterval(pollRef.current)},[])

  async function loadAll(){
    setLoading(true)
    const [{data:custs},{data:wa},{data:biz}]=await Promise.all([
      supabase.from("customers").select("id,name,phone,tag,last_visit_at,created_at").eq("user_id",userId),
      supabase.from("whatsapp_connections").select("*").eq("user_id",userId).maybeSingle(),
      supabase.from("business_settings").select("business_name").eq("user_id",userId).maybeSingle(),
    ])
    setCustomers(custs||[])
    setWhatsapp(wa||null)
    const bn=biz?.business_name||""
    setBizName(bn)
    if(bn)setTmplVals(p=>({...p,business_name:bn}))
    try{
      const{data:opts}=await supabase.from("campaign_optouts").select("phone").eq("user_id",userId)
      setOptouts((opts||[]).map(o=>o.phone))
    }catch(e){}
    await loadHistory()
    setLoading(false)
  }

  const loadHistory=useCallback(async()=>{
    if(!userId)return
    setHistLoading(true)
    try{
      // FIX: select only columns that definitely exist in the table
      const{data,error}=await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id",userId)
        .order("created_at",{ascending:false})
        .limit(50)
      if(error){
        console.error("History error:",error.message,error.code)
      }else{
        setHistory(data||[])
        console.log("History loaded:",data?.length,"rows")
      }
    }catch(e){
      console.error("History exception:",e.message)
    }
    setHistLoading(false)
  },[userId])

  function getAudience(){
    const now=new Date()
    const ago30=new Date(now);ago30.setDate(now.getDate()-30)
    const optSet=new Set(optouts.map(dedupePhone))
    let base=[]
    if(segment==="manual"){
      const nums=manualNums.replace(/[,;]/g," ").split(/\s+/).map(s=>s.trim()).filter(s=>s.length>=8)
      base=nums.map((p,i)=>({id:"m"+i,name:p,phone:p}))
    }else if(segment==="csv"){
      base=csvNums.map((p,i)=>({id:"c"+i,name:p,phone:p}))
    }else{
      base=customers.filter(c=>{
        if(!c.phone)return false
        if(segment==="all")return true
        if(segment==="new_lead")return c.tag==="new_lead"
        if(segment==="returning")return c.tag==="returning"||c.tag==="vip"
        if(segment==="vip")return c.tag==="vip"
        if(segment==="inactive")return new Date(c.last_visit_at||c.created_at)<ago30
        return true
      })
    }
    const seen=new Set()
    base=base.filter(c=>{const n=dedupePhone(c.phone);if(seen.has(n))return false;seen.add(n);return true})
    return base.filter(c=>!optSet.has(dedupePhone(c.phone)))
  }

  const selectedTmpl=META_TEMPLATES.find(t=>t.id===selectedTmplId)

  // ── Build Meta template payload ──────────────────────────────────────────
  // CRITICAL: parameters array length must EXACTLY match vars array length
  function buildPayload(customerName,phone){
    if(!selectedTmpl)return null
    const firstName=(customerName||"there").split(" ")[0]
    const v={...tmplVals,customer_name:firstName,business_name:tmplVals.business_name||bizName||"our business"}

    // Build parameters in exact order matching Meta template variables
    const parameters=selectedTmpl.vars.map(vv=>{
      let val=v[vv.key]||""
      // Auto-fill customer_name and business_name
      if(vv.key==="customer_name")val=firstName
      if(vv.key==="business_name")val=v.business_name
      return{type:"text",text:String(val||vv.hint||"N/A")}
    })

    console.log(`Sending template ${selectedTmpl.template_name} with ${parameters.length} params:`,parameters.map(p=>p.text))

    return{
      messaging_product:"whatsapp",
      to:phone,
      type:"template",
      template:{
        name:selectedTmpl.template_name,
        language:{code:"en"},
        components:[{type:"body",parameters}]
      }
    }
  }

  function getPreview(){
    if(!selectedTmpl)return""
    const v={...tmplVals,customer_name:"Priya",business_name:tmplVals.business_name||bizName||"Your Business"}
    return selectedTmpl.preview(v)
  }

  async function sendTest(){
    if(!testPhone.trim()||!whatsapp||!selectedTmpl||testState==="sending")return
    setTestState("sending")
    try{
      const phone=toSendPhone(testPhone)
      const payload=buildPayload("Test User",phone)
      const res=await fetch(`https://graph.facebook.com/v18.0/${whatsapp.phone_number_id}/messages`,{
        method:"POST",
        headers:{"Authorization":`Bearer ${whatsapp.access_token}`,"Content-Type":"application/json"},
        body:JSON.stringify(payload)
      })
      const d=await res.json()
      if(d.error){
        console.error("Test error:",d.error.message)
        alert("Send failed: "+d.error.message+"\n\nCheck that your template name in code matches Meta exactly.")
        setTestState("fail")
        setTimeout(()=>setTestState("idle"),3000)
      }else{
        setTestState("done")
        setTimeout(()=>setTestState("idle"),3000)
      }
    }catch(e){setTestState("fail");setTimeout(()=>setTestState("idle"),3000)}
  }

  async function pollDelivery(campId,waIds){
    if(pollRef.current)clearInterval(pollRef.current)
    if(!waIds?.length)return
    let ticks=0
    pollRef.current=setInterval(async()=>{
      ticks++;if(ticks>60){clearInterval(pollRef.current);return}
      try{
        const{data:msgs}=await supabase.from("messages")
          .select("status,wa_message_id").in("wa_message_id",waIds)
        if(!msgs)return
        const delivered=msgs.filter(m=>m.status==="delivered"||m.status==="read").length
        const read=msgs.filter(m=>m.status==="read").length
        await supabase.from("campaigns")
          .update({delivered_count:delivered,read_count:read})
          .eq("id",campId)
        await loadHistory()
      }catch(e){}
    },10000)
  }

  async function sendCampaign(){
    if(!canSend||sending)return
    const audience=getAudience()
    if(!audience.length)return

    setSending(true);setSentCount(0);setFailCount(0);setSendLog([]);setStep("sending")

    const waIds=[],log=[]
    let sc=0,fc=0
    const tmpl=selectedTmpl
    const totalCost=parseFloat((audience.length*(tmpl.metaCost||0.83)).toFixed(2))
    setLastCampCost(totalCost)

    // ── FIX: Create campaign row first ──────────────────────────────────
    // Insert minimal fields that definitely exist, catch any error
    let campId=null
    const now=new Date().toISOString()
    try{
      const{data:newCamp,error:insertErr}=await supabase
        .from("campaigns")
        .insert({
          user_id:        userId,
          name:           campaignName,
          status:         "sending",
          sent_count:     0,
          failed_count:   0,
          created_at:     now,
          sent_at:        now,
          // new columns — added via SQL migration
          segment:        segment,
          message:        getPreview().substring(0,500),
          template_name:  tmpl.template_name,
          delivered_count:0,
          read_count:     0,
          replied_count:  0,
          wa_message_ids: [],
        })
        .select("id")
        .single()

      if(insertErr){
        console.error("❌ Campaign insert failed:",insertErr.message,"Code:",insertErr.code)
        // Try minimal insert without new columns in case migration not run
        const{data:minCamp,error:minErr}=await supabase
          .from("campaigns")
          .insert({user_id:userId,name:campaignName,status:"sending",sent_count:0,failed_count:0,created_at:now})
          .select("id").single()
        if(minErr){console.error("❌ Even minimal insert failed:",minErr.message)}
        else{campId=minCamp?.id;console.log("✅ Minimal campaign created:",campId)}
      }else{
        campId=newCamp?.id
        console.log("✅ Campaign created:",campId)
      }
    }catch(e){console.error("❌ Campaign create exception:",e.message)}

    setLastCampId(campId)

    // ── Send messages ────────────────────────────────────────────────────
    for(const customer of audience){
      const phone=toSendPhone(customer.phone)
      const payload=buildPayload(customer.name,phone)
      if(!payload)continue

      try{
        const res=await fetch(`https://graph.facebook.com/v18.0/${whatsapp.phone_number_id}/messages`,{
          method:"POST",
          headers:{"Authorization":`Bearer ${whatsapp.access_token}`,"Content-Type":"application/json"},
          body:JSON.stringify(payload)
        })
        const d=await res.json()
        if(!d.error){
          sc++;setSentCount(sc)
          const waId=d?.messages?.[0]?.id
          if(waId)waIds.push(waId)
          log.push({name:customer.name||customer.phone,phone,status:"sent"})
          // Save to messages table for AI conversation context
          try{
            const{data:convo}=await supabase.from("conversations")
              .select("id").eq("user_id",userId).eq("phone",dedupePhone(customer.phone)).maybeSingle()
            await supabase.from("messages").insert({
              user_id:userId,customer_phone:dedupePhone(customer.phone),
              conversation_id:convo?.id||null,direction:"outbound",
              message_type:"text",message_text:getPreview().substring(0,500),
              status:"sent",is_ai:false,wa_message_id:waId||null,created_at:now,
            })
          }catch(e){}
        }else{
          fc++;setFailCount(fc)
          log.push({name:customer.name||customer.phone,phone,status:"failed",error:d.error.message})
          console.error("Send failed:",phone,d.error.message)
        }
      }catch(e){
        fc++;setFailCount(fc)
        log.push({name:customer.name||customer.phone,phone,status:"error"})
      }
      await new Promise(r=>setTimeout(r,1200))
    }

    setSendLog(log)

    // ── Update campaign with final counts ────────────────────────────────
    if(campId){
      try{
        const updateData={sent_count:sc,failed_count:fc,status:"completed"}
        try{updateData.wa_message_ids=waIds}catch(e){}
        const{error:updateErr}=await supabase.from("campaigns").update(updateData).eq("id",campId)
        if(updateErr)console.error("❌ Campaign update failed:",updateErr.message)
        else{console.log("✅ Campaign updated");if(waIds.length>0)pollDelivery(campId,waIds)}
      }catch(e){console.error("❌ Update exception:",e.message)}
    }

    await loadHistory()
    setSending(false)
    setStep("done")
  }

  function handleCsv(e){
    const file=e.target.files[0];if(!file)return
    const reader=new FileReader()
    reader.onload=ev=>{
      const nums=[]
      ev.target.result.split("\n").forEach(line=>{
        line.replace(/\r/g,"").split(",").forEach(col=>{
          const d=col.replace(/[^0-9]/g,"")
          if(d.length>=10)nums.push(d)
        })
      })
      setCsvNums([...new Set(nums)]);setSegment("csv")
    }
    reader.readAsText(file)
  }

  const toggleTheme=()=>{const n=!dark;setDark(n);localStorage.setItem("fastrill-theme",n?"dark":"light")}
  const logout=async()=>{await supabase.auth.signOut();router.push("/login")}

  // Theme tokens
  const bg=dark?"#08080e":"#f0f2f5"
  const sb=dark?"#0c0c15":"#ffffff"
  const card=dark?"#0f0f1a":"#ffffff"
  const bdr=dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.08)"
  const cbdr=dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.09)"
  const tx=dark?"#eeeef5":"#111827"
  const txm=dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"
  const txf=dark?"rgba(255,255,255,0.18)":"rgba(0,0,0,0.22)"
  const ibg=dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"
  const acc=dark?"#00d084":"#00935a"
  const adim=dark?"rgba(0,208,132,0.1)":"rgba(0,147,90,0.08)"
  const inp={background:ibg,border:`1px solid ${cbdr}`,borderRadius:8,padding:"9px 12px",fontSize:13,color:tx,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none",width:"100%"}
  const ui=userEmail?userEmail[0].toUpperCase():"G"

  const audience=getAudience()
  const previewText=getPreview()
  const filteredTmpls=META_TEMPLATES.filter(t=>industryFilter==="All"||t.industry===industryFilter||t.industry==="All")
  const nonAutoVars=selectedTmpl?.vars.filter(v=>!v.auto&&v.key!=="customer_name")||[]
  const allVarsFilled=nonAutoVars.every(v=>!!tmplVals[v.key])
  const canSend=!!whatsapp&&!!campaignName.trim()&&audience.length>0&&!!selectedTmplId&&allVarsFilled

  // Real ROI calculation for history (only after campaign completed)
  function calcRoi(c){
    const sc=c.sent_count||0
    const rpl=c.replied_count||0
    const tmpl=META_TEMPLATES.find(t=>t.template_name===c.template_name)
    const costPerMsg=tmpl?.metaCost||0.83
    const campaignCost=parseFloat((sc*costPerMsg).toFixed(2))
    const estimatedBookings=Math.round(rpl*0.6) // 60% of replies convert to bookings
    const estimatedRevenue=estimatedBookings*1200 // avg booking value Rs 1200
    const roi=campaignCost>0?Math.round(((estimatedRevenue-campaignCost)/campaignCost)*100):0
    return{campaignCost,estimatedBookings,estimatedRevenue,roi}
  }

  return(
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
        .topbar{height:52px;flex-shrink:0;border-bottom:1px solid ${bdr};display:flex;align-items:center;justify-content:space-between;padding:0 20px;background:${sb};gap:10px;}
        .con{flex:1;overflow-y:auto;}

        /* 3-col compose layout */
        .shell{display:grid;grid-template-columns:260px 1fr 280px;height:100%;overflow:hidden;}
        .col-l{border-right:1px solid ${bdr};overflow-y:auto;display:flex;flex-direction:column;background:${sb};}
        .col-m{overflow-y:auto;padding:18px;display:flex;flex-direction:column;gap:14px;}
        .col-r{border-left:1px solid ${bdr};overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;background:${sb};}

        /* Template cards */
        .tc{padding:12px 14px;cursor:pointer;border-bottom:1px solid ${bdr};transition:background 0.1s;display:flex;align-items:flex-start;gap:10px;border-left:3px solid transparent;}
        .tc:hover{background:${ibg};}
        .tc.on{background:${adim};border-left-color:${acc};}

        /* Segment items */
        .si{display:flex;align-items:center;gap:10px;padding:9px 14px;cursor:pointer;border-bottom:1px solid ${bdr};transition:background 0.1s;border-left:3px solid transparent;}
        .si:hover{background:${ibg};}
        .si.on{background:${adim};border-left-color:${acc};}

        /* Industry filter pills */
        .ip{padding:3px 10px;border-radius:100px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid ${cbdr};background:transparent;color:${txm};font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.12s;}
        .ip.on{background:${adim};border-color:${acc}44;color:${acc};}

        /* Tab buttons */
        .tb{padding:3px 11px;border-radius:6px;font-size:11.5px;font-weight:600;cursor:pointer;border:none;background:transparent;color:${txm};font-family:'Plus Jakarta Sans',sans-serif;white-space:nowrap;transition:all 0.12s;}
        .tb.on{background:${card};color:${tx};}

        /* Section header */
        .sh{padding:12px 14px 8px;border-bottom:1px solid ${bdr};position:sticky;top:0;background:${sb};z-index:5;}

        .hbtn{display:none;background:${ibg};border:1px solid ${cbdr};border-radius:7px;padding:5px 8px;cursor:pointer;font-size:16px;color:${tx};line-height:1;margin-right:4px;}
        .mob-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:299;cursor:pointer;}
        .bnav{display:none;position:fixed;bottom:0;left:0;right:0;background:${sb};border-top:1px solid ${bdr};padding:5px 0;z-index:200;}
        .bni{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px;border:none;background:transparent;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;flex:1;}
        .bnic{font-size:16px;color:${txf};}
        .bnil{font-size:9px;font-weight:600;color:${txf};}
        .bni.on .bnic,.bni.on .bnil{color:${acc};}
        input:focus,textarea:focus{border-color:${acc}66!important;}
        select option{background-color:#0c0c15!important;color:#eeeef5!important;}

        @media(max-width:1100px){.shell{grid-template-columns:240px 1fr 260px;}}
        @media(max-width:900px){
          .shell{grid-template-columns:1fr!important;height:auto;}
          .col-l,.col-r{border:none;border-bottom:1px solid ${bdr};max-height:none;}
          .col-m{padding:12px;}
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

        {/* Sidebar */}
        <aside className={"sidebar"+(mobOpen?" open":"")}>
          <a href="/dashboard" className="logo">fast<span>rill</span></a>
          <div className="navs">Platform</div>
          {NAV.map(item=>(
            <button key={item.id} className={"navi"+(item.id==="campaigns"?" on":"")}
              onClick={()=>{router.push(item.path);setMobOpen(false)}}>
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
          {/* Topbar */}
          <div className="topbar">
            <div style={{display:"flex",alignItems:"center",gap:6,flex:1,minWidth:0}}>
              <button className="hbtn" onClick={()=>setMobOpen(s=>!s)}>☰</button>
              <span style={{fontWeight:700,fontSize:15,color:tx,flexShrink:0}}>Campaigns</span>
              <div style={{display:"flex",background:ibg,border:`1px solid ${cbdr}`,borderRadius:8,padding:2,gap:1,marginLeft:8}}>
                {[["compose","Compose"],["history",`History (${history.length})`]].map(([v,l])=>(
                  <button key={v} className={"tb"+(view===v?" on":"")}
                    onClick={()=>{setView(v);if(v==="history")loadHistory()}}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              {!whatsapp&&!loading&&(
                <div onClick={()=>router.push("/dashboard/settings")}
                  style={{padding:"4px 10px",borderRadius:6,background:"rgba(251,113,133,0.1)",border:"1px solid rgba(251,113,133,0.25)",fontSize:11,color:"#fb7185",fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
                  ⚠ Connect WhatsApp
                </div>
              )}
              <button onClick={toggleTheme}
                style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",background:ibg,border:`1px solid ${cbdr}`,borderRadius:7,cursor:"pointer",fontSize:11.5,color:txm,fontFamily:"'Plus Jakarta Sans',sans-serif",flexShrink:0}}>
                <span>{dark?"🌙":"☀️"}</span>
                <div style={{width:28,height:15,borderRadius:100,background:dark?acc:"#d1d5db",position:"relative",flexShrink:0}}>
                  <div style={{position:"absolute",top:2,width:11,height:11,borderRadius:"50%",background:"#fff",left:dark?"15px":"2px",transition:"left 0.2s"}}/>
                </div>
              </button>
            </div>
          </div>

          <div className="con">

            {/* ══════════════════════════════════════════════════════════
                HISTORY VIEW
            ══════════════════════════════════════════════════════════ */}
            {view==="history"&&(
              <div style={{padding:20}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:15,color:tx}}>Campaign History</div>
                    <div style={{fontSize:11.5,color:txf,marginTop:2}}>Real cost and ROI calculated after each campaign</div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={loadHistory}
                      style={{padding:"7px 14px",borderRadius:8,background:ibg,border:`1px solid ${cbdr}`,color:txm,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                      {histLoading?"Loading...":"↻ Refresh"}
                    </button>
                    <button onClick={()=>{setView("compose");setStep("setup")}}
                      style={{padding:"7px 16px",borderRadius:8,background:acc,border:"none",color:"#000",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                      + New Campaign
                    </button>
                  </div>
                </div>

                {histLoading?(
                  <div style={{textAlign:"center",padding:40,color:txf}}>Loading campaigns...</div>
                ):history.length===0?(
                  <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:14,padding:"56px 20px",textAlign:"center"}}>
                    <div style={{fontSize:40,marginBottom:12,opacity:0.25}}>📢</div>
                    <div style={{fontWeight:700,fontSize:15,color:tx,marginBottom:6}}>No campaigns yet</div>
                    <div style={{fontSize:12.5,color:txf,marginBottom:20}}>Send your first campaign and track real revenue impact here</div>
                    <button onClick={()=>setView("compose")}
                      style={{padding:"10px 24px",borderRadius:9,background:acc,border:"none",color:"#000",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                      Create first campaign →
                    </button>
                  </div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    {history.map(c=>{
                      const sc=c.sent_count||0
                      const dlv=c.delivered_count||0
                      const rd=c.read_count||0
                      const rpl=c.replied_count||0
                      const roi=calcRoi(c)
                      return(
                        <div key={c.id} style={{background:card,border:`1px solid ${cbdr}`,borderRadius:13,overflow:"hidden"}}>

                          {/* Campaign header */}
                          <div style={{padding:"14px 16px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",borderBottom:`1px solid ${bdr}`}}>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5,flexWrap:"wrap"}}>
                                <span style={{fontWeight:700,fontSize:14,color:tx}}>{c.name}</span>
                                {c.template_name&&(
                                  <span style={{fontSize:10,padding:"2px 8px",borderRadius:100,background:adim,color:acc,border:`1px solid ${acc}33`,fontWeight:600}}>
                                    {c.template_name}
                                  </span>
                                )}
                                <span style={{fontSize:10,padding:"2px 8px",borderRadius:100,
                                  background:c.status==="completed"?adim:"rgba(245,158,11,0.1)",
                                  color:c.status==="completed"?acc:"#f59e0b",
                                  border:`1px solid ${c.status==="completed"?acc+"33":"rgba(245,158,11,0.3)"}`,fontWeight:600}}>
                                  {c.status==="sending"?"● Sending...":"✓ Completed"}
                                </span>
                              </div>
                              <div style={{fontSize:11.5,color:txm,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"85%"}}>
                                {(c.message||"").substring(0,80)}
                              </div>
                              <div style={{fontSize:11,color:txf,marginTop:4}}>
                                {c.sent_at?new Date(c.sent_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}):""} · {c.segment||"all customers"}
                              </div>
                            </div>
                            <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
                              <div style={{fontSize:28,fontWeight:800,color:acc,letterSpacing:"-1px",lineHeight:1}}>{sc}</div>
                              <div style={{fontSize:10.5,color:txf}}>sent</div>
                            </div>
                          </div>

                          {/* Delivery stats */}
                          <div style={{padding:"12px 16px",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,borderBottom:`1px solid ${bdr}`}}>
                            {[
                              {label:"Sent",      val:sc,  pct:100,                                           color:txm,       icon:"📤"},
                              {label:"Delivered", val:dlv, pct:sc>0?Math.round((dlv/sc)*100):0,  color:"#38bdf8",  icon:"📬"},
                              {label:"Read",      val:rd,  pct:sc>0?Math.round((rd/sc)*100):0,   color:"#a78bfa",  icon:"👁"},
                              {label:"Replied",   val:rpl, pct:sc>0?Math.round((rpl/sc)*100):0,  color:acc,         icon:"↩"},
                            ].map(s=>(
                              <div key={s.label} style={{background:ibg,borderRadius:9,padding:"9px 10px"}}>
                                <div style={{fontSize:10,color:txf,marginBottom:3}}>{s.icon} {s.label}</div>
                                <div style={{fontWeight:800,fontSize:20,color:s.val>0?s.color:txf,lineHeight:1,letterSpacing:"-0.5px"}}>{s.val}</div>
                                {sc>0&&<>
                                  <div style={{marginTop:4,height:2,borderRadius:100,background:dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)"}}>
                                    <div style={{height:2,borderRadius:100,width:`${s.pct}%`,background:s.color,transition:"width 0.5s"}}/>
                                  </div>
                                  <div style={{fontSize:9.5,color:txf,marginTop:2}}>{s.pct}%</div>
                                </>}
                              </div>
                            ))}
                          </div>

                          {/* REAL ROI — only shown when campaign is complete */}
                          {c.status==="completed"&&sc>0&&(
                            <div style={{padding:"12px 16px",background:dark?"rgba(0,208,132,0.05)":"rgba(0,147,90,0.04)",borderBottom:`1px solid ${bdr}`}}>
                              <div style={{fontSize:11,fontWeight:700,color:acc,marginBottom:8}}>📊 Campaign ROI</div>
                              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                                {[
                                  {label:"Meta Cost",       val:`₹${roi.campaignCost}`,             color:txm},
                                  {label:"Est. Bookings",   val:roi.estimatedBookings,               color:"#a78bfa"},
                                  {label:"Est. Revenue",    val:`₹${roi.estimatedRevenue.toLocaleString()}`, color:acc},
                                  {label:"ROI",             val:`${roi.roi}%`,                       color:roi.roi>0?acc:"#fb7185"},
                                ].map(r=>(
                                  <div key={r.label} style={{background:ibg,borderRadius:8,padding:"8px 10px"}}>
                                    <div style={{fontSize:10,color:txf,marginBottom:2}}>{r.label}</div>
                                    <div style={{fontWeight:700,fontSize:15,color:r.color}}>{r.val}</div>
                                  </div>
                                ))}
                              </div>
                              <div style={{fontSize:10,color:txf,marginTop:7}}>
                                Cost: ₹{(META_TEMPLATES.find(t=>t.template_name===c.template_name)?.metaCost||0.83)} per message · Revenue based on replies × 60% conversion × ₹1200 avg booking
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div style={{padding:"8px 16px",display:"flex",gap:8,alignItems:"center"}}>
                            <button onClick={async()=>{
                              try{
                                const{count}=await supabase.from("messages")
                                  .select("id",{count:"exact"})
                                  .eq("user_id",userId).eq("direction","inbound")
                                  .gte("created_at",c.sent_at||c.created_at)
                                if(count!==null){
                                  await supabase.from("campaigns").update({replied_count:count}).eq("id",c.id)
                                  await loadHistory()
                                }
                              }catch(e){}
                            }} style={{padding:"4px 10px",borderRadius:6,background:"transparent",border:`1px solid ${cbdr}`,color:txf,fontSize:11,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                              ↻ Refresh replies
                            </button>
                            {(c.failed_count||0)>0&&(
                              <span style={{fontSize:11,color:"#fb7185",marginLeft:"auto"}}>{c.failed_count} failed</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                SENDING STATE
            ══════════════════════════════════════════════════════════ */}
            {view==="compose"&&step==="sending"&&(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"80vh",gap:16,padding:20}}>
                <div style={{fontSize:48}}>📤</div>
                <div style={{fontWeight:800,fontSize:20,color:tx}}>Sending Campaign...</div>
                <div style={{fontSize:12,color:txm,textAlign:"center"}}>Keep this tab open · Using approved Meta template</div>
                <div style={{display:"flex",gap:32,marginTop:4}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:48,fontWeight:800,color:acc,letterSpacing:"-2px",lineHeight:1}}>{sentCount}</div>
                    <div style={{fontSize:11,color:txm,marginTop:4}}>Sent</div>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:48,fontWeight:800,color:txm,letterSpacing:"-2px",lineHeight:1}}>{Math.max(0,audience.length-sentCount-failCount)}</div>
                    <div style={{fontSize:11,color:txm,marginTop:4}}>Remaining</div>
                  </div>
                  {failCount>0&&(
                    <div style={{textAlign:"center"}}>
                      <div style={{fontSize:48,fontWeight:800,color:"#fb7185",letterSpacing:"-2px",lineHeight:1}}>{failCount}</div>
                      <div style={{fontSize:11,color:txm,marginTop:4}}>Failed</div>
                    </div>
                  )}
                </div>
                <div style={{width:300,height:6,borderRadius:100,background:ibg,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:100,background:acc,
                    width:audience.length>0?`${Math.round(((sentCount+failCount)/audience.length)*100)}%`:"0%",
                    transition:"width 0.4s"}}/>
                </div>
                <div style={{fontSize:11,color:txf}}>
                  {audience.length>0?Math.round(((sentCount+failCount)/audience.length)*100):0}% · ~{Math.ceil(Math.max(0,audience.length-sentCount-failCount)*1.2)}s remaining
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                DONE STATE
            ══════════════════════════════════════════════════════════ */}
            {view==="compose"&&step==="done"&&(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"80vh",gap:16,padding:20}}>
                <div style={{fontSize:56}}>🎉</div>
                <div style={{fontWeight:800,fontSize:24,color:tx}}>Campaign Sent!</div>
                <div style={{display:"flex",gap:28}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:48,fontWeight:800,color:acc,letterSpacing:"-2px",lineHeight:1}}>{sentCount}</div>
                    <div style={{fontSize:12,color:txm,marginTop:4}}>Messages delivered</div>
                  </div>
                  {failCount>0&&(
                    <div style={{textAlign:"center"}}>
                      <div style={{fontSize:48,fontWeight:800,color:"#fb7185",letterSpacing:"-2px",lineHeight:1}}>{failCount}</div>
                      <div style={{fontSize:12,color:txm,marginTop:4}}>Failed</div>
                    </div>
                  )}
                </div>

                {/* Real campaign cost on done screen */}
                <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:12,padding:"14px 20px",display:"flex",gap:24,alignItems:"center"}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:10,color:txf,marginBottom:3}}>Meta Cost</div>
                    <div style={{fontWeight:700,fontSize:18,color:txm}}>₹{lastCampCost}</div>
                  </div>
                  <div style={{width:1,height:32,background:bdr}}/>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:10,color:txf,marginBottom:3}}>ROI visible in</div>
                    <div style={{fontWeight:700,fontSize:18,color:acc}}>History tab</div>
                  </div>
                  <div style={{width:1,height:32,background:bdr}}/>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:10,color:txf,marginBottom:3}}>Updates as replies come in</div>
                    <div style={{fontWeight:700,fontSize:18,color:"#a78bfa"}}>Auto ↻</div>
                  </div>
                </div>

                {/* Send log */}
                {sendLog.length>0&&(
                  <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:11,padding:14,width:"100%",maxWidth:440,maxHeight:180,overflowY:"auto"}}>
                    <div style={{fontSize:10.5,fontWeight:700,color:txf,marginBottom:7,letterSpacing:"0.5px"}}>SEND LOG</div>
                    {sendLog.map((l,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:11.5,padding:"3px 0",borderBottom:`1px solid ${bdr}`}}>
                        <span style={{color:tx,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"55%"}}>{l.name}</span>
                        <span style={{color:l.status==="sent"?acc:"#fb7185",flexShrink:0}}>
                          {l.status==="sent"?"✓ Sent":"✗ "+(l.error||"Failed")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>{setStep("setup");setSentCount(0);setFailCount(0);setCampaignName("");setSendLog([])}}
                    style={{padding:"11px 24px",borderRadius:9,background:acc,border:"none",color:"#000",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                    New Campaign
                  </button>
                  <button onClick={()=>{setView("history");setStep("setup");loadHistory()}}
                    style={{padding:"11px 24px",borderRadius:9,background:ibg,border:`1px solid ${cbdr}`,color:txm,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                    View History & ROI →
                  </button>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                COMPOSE — 3-COLUMN LAYOUT
            ══════════════════════════════════════════════════════════ */}
            {view==="compose"&&step==="setup"&&(
              <div className="shell">

                {/* ── LEFT COLUMN: Template library ── */}
                <div className="col-l">
                  <div className="sh">
                    <div style={{fontWeight:700,fontSize:12,color:tx,marginBottom:8}}>1 · Pick Template</div>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                      {INDUSTRIES.map(ind=>(
                        <button key={ind} className={"ip"+(industryFilter===ind?" on":"")}
                          onClick={()=>setIndustryFilter(ind)}>
                          {ind}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredTmpls.map(t=>(
                    <div key={t.id} className={"tc"+(selectedTmplId===t.id?" on":"")}
                      onClick={()=>{setSelectedTmplId(t.id);setTmplVals(p=>({business_name:p.business_name||bizName}))}}>
                      <span style={{fontSize:22,flexShrink:0,lineHeight:1.2}}>{t.icon}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:600,fontSize:13,color:selectedTmplId===t.id?acc:tx,marginBottom:2}}>{t.label}</div>
                        <div style={{fontSize:10.5,color:txf,lineHeight:1.4,marginBottom:5}}>{t.desc}</div>
                        <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                          <span style={{fontSize:9.5,padding:"1px 7px",borderRadius:100,
                            background:t.category==="UTILITY"?"rgba(56,189,248,0.1)":adim,
                            color:t.category==="UTILITY"?"#38bdf8":acc,
                            border:`1px solid ${t.category==="UTILITY"?"rgba(56,189,248,0.25)":acc+"33"}`,
                            fontWeight:700}}>
                            {t.category}
                          </span>
                          {t.industry!=="All"&&(
                            <span style={{fontSize:9.5,padding:"1px 7px",borderRadius:100,background:ibg,color:txf,border:`1px solid ${cbdr}`}}>
                              {t.industry}
                            </span>
                          )}
                          <span style={{fontSize:9.5,color:acc,marginLeft:"auto"}}>₹{t.metaCost}/msg</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── MIDDLE COLUMN: Details + Preview + Test ── */}
                <div className="col-m">

                  {/* Campaign name */}
                  <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:12,padding:16}}>
                    <div style={{fontWeight:700,fontSize:12,color:tx,marginBottom:8}}>2 · Campaign Name</div>
                    <input placeholder="e.g. Diwali Offer March 2026" value={campaignName}
                      onChange={e=>setCampaignName(e.target.value)}
                      style={{...inp,border:`1px solid ${!campaignName.trim()?"rgba(251,113,133,0.35)":cbdr}`}}/>
                  </div>

                  {/* Template vars */}
                  {selectedTmpl?(
                    <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:12,overflow:"hidden"}}>
                      <div style={{padding:"13px 16px",borderBottom:`1px solid ${bdr}`,display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:24,lineHeight:1}}>{selectedTmpl.icon}</span>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,fontSize:13.5,color:tx}}>{selectedTmpl.label}</div>
                          <div style={{fontSize:11,color:txf,marginTop:1}}>{selectedTmpl.vars.length} variables · {selectedTmpl.category}</div>
                        </div>
                        <button onClick={()=>setSelectedTmplId("")}
                          style={{padding:"4px 10px",borderRadius:6,background:ibg,border:`1px solid ${cbdr}`,color:txm,fontSize:11,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
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
                              <div style={{...inp,background:"transparent",border:`1px solid ${acc}22`,color:acc,fontSize:12}}>
                                Customer's first name — personalised per send
                              </div>
                            ):(
                              <input placeholder={v.hint||""} value={tmplVals[v.key]||""}
                                onChange={e=>setTmplVals(p=>({...p,[v.key]:e.target.value}))}
                                style={{...inp,border:`1px solid ${!v.auto&&!tmplVals[v.key]?"rgba(251,113,133,0.3)":cbdr}`}}/>
                            )}
                          </div>
                        ))}
                        <div style={{padding:"9px 11px",background:`${acc}0d`,border:`1px solid ${acc}22`,borderRadius:8,fontSize:11,color:txm,lineHeight:1.6}}>
                          ✅ Approved template — reaches any number, no 24hr restriction
                        </div>
                      </div>
                    </div>
                  ):(
                    <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:12,padding:"40px 20px",textAlign:"center"}}>
                      <div style={{fontSize:36,marginBottom:10,opacity:0.15}}>←</div>
                      <div style={{fontWeight:600,fontSize:13,color:tx,marginBottom:4}}>Select a template from the left</div>
                      <div style={{fontSize:11.5,color:txf}}>Filter by industry to find the right one quickly</div>
                    </div>
                  )}

                  {/* WhatsApp Preview */}
                  {previewText&&(
                    <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:12,padding:16}}>
                      <div style={{fontWeight:700,fontSize:12,color:tx,marginBottom:10}}>
                        Preview
                        <span style={{fontSize:11,color:txf,fontWeight:400,marginLeft:6}}>as your customer sees it</span>
                      </div>
                      <div style={{background:dark?"#0d1117":"#e5ddd5",borderRadius:11,padding:"14px 12px"}}>
                        <div style={{background:dark?"#1c2433":"#fff",borderRadius:"4px 13px 13px 13px",padding:"11px 14px",maxWidth:"90%",display:"inline-block",boxShadow:"0 1px 4px rgba(0,0,0,0.18)"}}>
                          <div style={{fontSize:13,color:dark?"#e8eaf0":"#111",lineHeight:1.75,whiteSpace:"pre-wrap"}}>{previewText}</div>
                          <div style={{fontSize:9.5,color:txf,marginTop:5,textAlign:"right"}}>
                            {new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true})} ✓✓
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Test message */}
                  <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:12,padding:16}}>
                    <div style={{fontWeight:700,fontSize:12,color:tx,marginBottom:3}}>🧪 Test First</div>
                    <div style={{fontSize:11,color:txf,marginBottom:9}}>Always send a test to your own number before blasting</div>
                    <div style={{display:"flex",gap:8}}>
                      <input placeholder="e.g. 919876543210" value={testPhone}
                        onChange={e=>setTestPhone(e.target.value)}
                        onKeyDown={e=>{if(e.key==="Enter")sendTest()}}
                        style={{...inp,flex:1}}/>
                      <button onClick={sendTest}
                        disabled={!testPhone.trim()||!whatsapp||testState==="sending"||!selectedTmplId}
                        style={{padding:"9px 14px",borderRadius:8,flexShrink:0,
                          background:testState==="done"?acc:testState==="fail"?"rgba(251,113,133,0.15)":adim,
                          border:`1px solid ${testState==="fail"?"rgba(251,113,133,0.4)":acc+"44"}`,
                          color:testState==="done"?"#000":testState==="fail"?"#fb7185":acc,
                          fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                        {testState==="sending"?"Sending...":testState==="done"?"Sent ✓":testState==="fail"?"Failed ✗":"Send Test"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── RIGHT COLUMN: Audience + Checklist + Send ── */}
                <div className="col-r">

                  {/* Audience selector */}
                  <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:12,overflow:"hidden"}}>
                    <div style={{padding:"12px 14px",borderBottom:`1px solid ${bdr}`,fontWeight:700,fontSize:12,color:tx}}>
                      4 · Select Audience
                    </div>

                    {SEGMENTS.map(s=>(
                      <div key={s.id} className={"si"+(segment===s.id?" on":"")}
                        onClick={()=>{setSegment(s.id);if(s.id!=="csv")setCsvNums([])}}>
                        <span style={{fontSize:15,flexShrink:0}}>{s.icon}</span>
                        <div style={{minWidth:0}}>
                          <div style={{fontSize:12.5,fontWeight:600,color:segment===s.id?acc:tx}}>{s.label}</div>
                          <div style={{fontSize:10.5,color:txf,marginTop:1}}>{s.desc}</div>
                        </div>
                        {s.id!=="manual"&&s.id!=="csv"&&(
                          <div style={{marginLeft:"auto",fontSize:11,fontWeight:700,color:segment===s.id?acc:txf,flexShrink:0}}>
                            {s.id==="all"?customers.length
                              :s.id==="new_lead"?customers.filter(c=>c.tag==="new_lead").length
                              :s.id==="returning"?customers.filter(c=>c.tag==="returning"||c.tag==="vip").length
                              :s.id==="vip"?customers.filter(c=>c.tag==="vip").length
                              :customers.filter(c=>new Date(c.last_visit_at||c.created_at)<new Date(Date.now()-30*86400000)).length}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Manual number input */}
                    {segment==="manual"&&(
                      <div style={{padding:"10px 12px",background:ibg,borderTop:`1px solid ${bdr}`}}>
                        <div style={{fontSize:11,color:txm,marginBottom:6,fontWeight:500}}>One number per line (with country code)</div>
                        <textarea
                          placeholder={"919876543210\n918765432109\n917654321098"}
                          value={manualNums}
                          onChange={e=>setManualNums(e.target.value)}
                          rows={5}
                          style={{...inp,resize:"vertical",fontSize:12,lineHeight:1.7,marginBottom:6}}/>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <span style={{fontSize:11,color:acc,fontWeight:600}}>
                            {manualNums.replace(/[,;]/g," ").split(/\s+/).filter(s=>s.trim().length>=8).length} numbers detected
                          </span>
                          <button onClick={()=>setManualNums("")}
                            style={{fontSize:11,color:txf,background:"transparent",border:"none",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                            Clear
                          </button>
                        </div>
                      </div>
                    )}

                    {/* CSV upload */}
                    {segment==="csv"&&(
                      <div style={{padding:"10px 12px",background:ibg,borderTop:`1px solid ${bdr}`}}>
                        <input ref={fileRef} type="file" accept=".csv,.txt" style={{display:"none"}} onChange={handleCsv}/>
                        <button onClick={()=>fileRef.current?.click()}
                          style={{width:"100%",padding:"10px",borderRadius:8,background:adim,border:`1px solid ${acc}44`,color:acc,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",marginBottom:6}}>
                          📎 {csvNums.length>0?`${csvNums.length} numbers loaded — click to replace`:"Upload CSV or .txt file"}
                        </button>
                        {csvNums.length>0&&(
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                            <span style={{fontSize:11,color:acc,fontWeight:600}}>{csvNums.length} ready to send</span>
                            <span style={{fontSize:11,color:"#fb7185",cursor:"pointer"}}
                              onClick={()=>{setCsvNums([]);setSegment("all")}}>✕ Clear</span>
                          </div>
                        )}
                        <div style={{fontSize:10.5,color:txf}}>Format: one number per line, or first column of CSV</div>
                      </div>
                    )}
                  </div>

                  {/* Ready checklist */}
                  <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:12,padding:13}}>
                    <div style={{fontWeight:700,fontSize:12,color:tx,marginBottom:9}}>Ready Checklist</div>
                    {[
                      {label:"WhatsApp connected", done:!!whatsapp},
                      {label:"Campaign named",     done:!!campaignName.trim()},
                      {label:"Template selected",  done:!!selectedTmplId},
                      {label:"All fields filled",   done:allVarsFilled},
                      {label:"Audience selected",   done:audience.length>0},
                      {label:"Test sent",           done:testState==="done"},
                    ].map(item=>(
                      <div key={item.label} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:`1px solid ${bdr}`}}>
                        <div style={{width:17,height:17,borderRadius:"50%",flexShrink:0,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          background:item.done?"rgba(34,197,94,0.15)":ibg,
                          border:`1px solid ${item.done?"rgba(34,197,94,0.35)":cbdr}`,
                          fontSize:9,color:item.done?"#22c55e":txf}}>
                          {item.done?"✓":"○"}
                        </div>
                        <span style={{fontSize:11.5,color:item.done?tx:txm}}>{item.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Audience count + cost estimate + send */}
                  <div style={{background:card,border:`1px solid ${cbdr}`,borderRadius:12,padding:14}}>
                    <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:3}}>
                      <div style={{fontSize:40,fontWeight:800,color:audience.length>0?acc:txf,letterSpacing:"-1.5px",lineHeight:1}}>
                        {audience.length}
                      </div>
                      <div style={{fontSize:13,color:txm}}>{audience.length===1?"recipient":"recipients"}</div>
                    </div>

                    {optouts.length>0&&(
                      <div style={{fontSize:11,color:txf,marginBottom:6}}>{optouts.length} opted-out excluded</div>
                    )}

                    {/* Audience preview list */}
                    {audience.length>0&&(
                      <div style={{marginBottom:10,maxHeight:80,overflowY:"auto",background:ibg,borderRadius:8,padding:"7px 10px"}}>
                        {audience.slice(0,5).map((c,i)=>(
                          <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"2px 0",borderBottom:`1px solid ${bdr}`}}>
                            <span style={{color:tx,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"55%"}}>{c.name||c.phone}</span>
                            <span style={{fontFamily:"monospace",color:txf}}>···{toSendPhone(c.phone).slice(-4)}</span>
                          </div>
                        ))}
                        {audience.length>5&&<div style={{fontSize:10.5,color:txf,paddingTop:3}}>+{audience.length-5} more</div>}
                      </div>
                    )}

                    {/* Real cost estimate */}
                    {selectedTmpl&&audience.length>0&&(
                      <div style={{marginBottom:12,padding:"8px 10px",background:ibg,borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:11.5,color:txm}}>Estimated Meta cost</span>
                        <span style={{fontSize:13,fontWeight:700,color:tx}}>
                          ₹{(audience.length*selectedTmpl.metaCost).toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div style={{padding:"7px 9px",background:`${acc}0a`,border:`1px solid ${acc}22`,borderRadius:7,fontSize:10.5,color:txm,marginBottom:12,lineHeight:1.5}}>
                      ✅ Template reaches everyone — no 24hr window restriction
                    </div>

                    {/* SEND BUTTON */}
                    <button onClick={sendCampaign} disabled={!canSend||sending}
                      style={{width:"100%",padding:"14px",
                        background:canSend?"#00c47d":ibg,
                        border:`1px solid ${canSend?"#00c47d":cbdr}`,
                        borderRadius:10,color:canSend?"#000":txm,
                        fontWeight:800,fontSize:14,
                        cursor:canSend?"pointer":"not-allowed",
                        fontFamily:"'Plus Jakarta Sans',sans-serif",
                        letterSpacing:"-0.3px",transition:"all 0.15s",
                        marginBottom:8}}>
                      {!whatsapp?"Connect WhatsApp first"
                        :!campaignName.trim()?"↑ Name your campaign"
                        :!selectedTmplId?"← Pick a template"
                        :!allVarsFilled?"Fill in template details ↑"
                        :!audience.length?"Select an audience"
                        :`🚀 Send to ${audience.length} ${audience.length===1?"person":"people"}`}
                    </button>

                    <div style={{fontSize:10.5,color:txf,textAlign:"center"}}>
                      ~{Math.ceil(audience.length*1.2)}s · 1 msg/sec · Meta rate safe
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom nav for mobile */}
      <nav className="bnav">
        {[
          {id:"overview",  icon:"⬡", label:"Home",      path:"/dashboard"},
          {id:"inbox",     icon:"◎", label:"Chats",     path:"/dashboard/conversations"},
          {id:"campaigns", icon:"◆", label:"Campaigns", path:"/dashboard/campaigns"},
          {id:"leads",     icon:"◉", label:"Leads",     path:"/dashboard/leads"},
          {id:"contacts",  icon:"◑", label:"Customers", path:"/dashboard/contacts"},
        ].map(item=>(
          <button key={item.id} className={"bni"+(item.id==="campaigns"?" on":"")}
            onClick={()=>router.push(item.path)}>
            <span className="bnic">{item.icon}</span>
            <span className="bnil">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
