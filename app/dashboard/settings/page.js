"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const NAV = [
  { id:"overview", label:"Revenue Engine", icon:"⬡", path:"/dashboard" },
  { id:"inbox", label:"Conversations", icon:"◎", path:"/dashboard/conversations" },
  { id:"bookings", label:"Bookings", icon:"◷", path:"/dashboard/bookings" },
  { id:"campaigns", label:"Campaigns", icon:"◆", path:"/dashboard/campaigns" },
  { id:"leads", label:"Lead Recovery", icon:"◉", path:"/dashboard/leads" },
  { id:"contacts", label:"Customers", icon:"◑", path:"/dashboard/contacts" },
  { id:"analytics", label:"Analytics", icon:"▦", path:"/dashboard/analytics" },
  { id:"settings", label:"Settings", icon:"◌", path:"/dashboard/settings" },
]

export default function Settings() {

const router = useRouter()

const [userId,setUserId] = useState(null)
const [userEmail,setUserEmail] = useState("")

const [loading,setLoading] = useState(true)
const [saving,setSaving] = useState(false)

const [business,setBusiness] = useState({
name:"",
type:"Salon",
phone:"",
location:"",
mapsLink:"",
description:""
})

const [ai,setAI] = useState({
language:"English",
customInstructions:"",
autoBooking:true,
followUpEnabled:true,
greetingMessage:"",
missedLeadMessage:""
})

/* NEW BOOKING ENGINE SETTINGS */
const [booking,setBooking] = useState({
slotInterval:15,
allowParallel:false,
defaultCapacity:1
})

const [services,setServices] = useState([])
const [whatsapp,setWhatsapp] = useState(null)

useEffect(()=>{
supabase.auth.getUser().then(({data})=>{
if(!data.user){
router.push("/login")
}else{
setUserId(data.user.id)
setUserEmail(data.user.email || "")
}
})
},[])

useEffect(()=>{
if(userId) loadAll()
},[userId])

async function loadAll(){

setLoading(true)

const {data:bs}=await supabase
.from("business_settings")
.select("*")
.eq("user_id",userId)
.maybeSingle()

const {data:svcs}=await supabase
.from("services")
.select("*")
.eq("user_id",userId)

const {data:wa}=await supabase
.from("whatsapp_connections")
.select("*")
.eq("user_id",userId)
.maybeSingle()

if(bs){

setBusiness({
name:bs.business_name || "",
type:bs.business_type || "Salon",
phone:bs.phone || "",
location:bs.location || "",
mapsLink:bs.maps_link || "",
description:bs.description || ""
})

setAI({
language:bs.ai_language || "English",
customInstructions:bs.ai_instructions || "",
autoBooking:bs.auto_booking !== false,
followUpEnabled:bs.follow_up_enabled !== false,
greetingMessage:bs.greeting_message || "",
missedLeadMessage:bs.missed_lead_message || ""
})

/* LOAD BOOKING ENGINE SETTINGS */

setBooking({
slotInterval:bs.slot_interval_minutes ?? 15,
allowParallel:bs.allow_parallel_bookings ?? false,
defaultCapacity:bs.default_capacity ?? 1
})

}

setServices(svcs || [])
setWhatsapp(wa || null)

setLoading(false)

}

async function saveBusiness(){

setSaving(true)

const payload={
user_id:userId,

business_name:business.name,
business_type:business.type,
phone:business.phone,
location:business.location,
maps_link:business.mapsLink,
description:business.description,

ai_language:ai.language,
ai_instructions:ai.customInstructions,
auto_booking:ai.autoBooking,
follow_up_enabled:ai.followUpEnabled,
greeting_message:ai.greetingMessage,
missed_lead_message:ai.missedLeadMessage,

/* BOOKING ENGINE */

slot_interval_minutes:booking.slotInterval,
allow_parallel_bookings:booking.allowParallel,
default_capacity:booking.defaultCapacity,

updated_at:new Date().toISOString()
}

await supabase
.from("business_settings")
.upsert(payload,{onConflict:"user_id"})

setSaving(false)

}

async function addService(){

if(!services.name) return

const payload={
name:services.name,
price:services.price,
duration:services.duration,
user_id:userId
}

const {data}=await supabase
.from("services")
.insert(payload)
.select()
.single()

setServices([...services,data])

}

async function disconnectWhatsApp(){

await supabase
.from("whatsapp_connections")
.delete()
.eq("user_id",userId)

setWhatsapp(null)

}

if(loading){
return <div style={{padding:40}}>Loading...</div>
}

return (

<div style={{padding:40,maxWidth:800}}>

<h2>Business Settings</h2>

<input
placeholder="Business Name"
value={business.name}
onChange={e=>setBusiness(p=>({...p,name:e.target.value}))}
/>

<select
value={business.type}
onChange={e=>setBusiness(p=>({...p,type:e.target.value}))}
>
<option>Salon</option>
<option>Spa</option>
<option>Clinic</option>
<option>Dental</option>
<option>Gym</option>
<option>Yoga Studio</option>
</select>

<input
placeholder="WhatsApp Phone"
value={business.phone}
onChange={e=>setBusiness(p=>({...p,phone:e.target.value}))}
/>

<input
placeholder="Location"
value={business.location}
onChange={e=>setBusiness(p=>({...p,location:e.target.value}))}
/>

<input
placeholder="Google Maps"
value={business.mapsLink}
onChange={e=>setBusiness(p=>({...p,mapsLink:e.target.value}))}
/>

<textarea
placeholder="Business description"
value={business.description}
onChange={e=>setBusiness(p=>({...p,description:e.target.value}))}
/>

<hr/>

<h3>Booking Engine</h3>

<label>Slot Interval (minutes)</label>

<input
type="number"
value={booking.slotInterval}
onChange={e=>setBooking(p=>({...p,slotInterval:parseInt(e.target.value)}))}
/>

<label>Allow Parallel Bookings</label>

<input
type="checkbox"
checked={booking.allowParallel}
onChange={e=>setBooking(p=>({...p,allowParallel:e.target.checked}))}
/>

{booking.allowParallel && (

<>
<label>Default Capacity</label>

<input
type="number"
value={booking.defaultCapacity}
onChange={e=>setBooking(p=>({...p,defaultCapacity:parseInt(e.target.value)}))}
/>
</>

)}

<hr/>

<h3>AI Settings</h3>

<textarea
placeholder="AI Instructions"
value={ai.customInstructions}
onChange={e=>setAI(p=>({...p,customInstructions:e.target.value}))}
/>

<label>Auto Booking</label>

<input
type="checkbox"
checked={ai.autoBooking}
onChange={e=>setAI(p=>({...p,autoBooking:e.target.checked}))}
/>

<button onClick={saveBusiness} disabled={saving}>
{saving?"Saving...":"Save Settings"}
</button>

</div>

)

}
