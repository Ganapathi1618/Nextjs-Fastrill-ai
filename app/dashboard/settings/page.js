"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Settings() {

const [loading,setLoading] = useState(true)

const [settings,setSettings] = useState({
business_name:"",
business_type:"salon",
phone:"",
email:"",
description:"",
location:"",
maps_link:"",

working_hours_start:"09:00",
working_hours_end:"20:00",
working_days:["Mon","Tue","Wed","Thu","Fri","Sat"],

slot_interval_minutes:30,
allow_parallel_bookings:true,
default_capacity:3,
auto_booking:true,

ai_enabled:true,
ai_language:"English",
ai_tone:"friendly",
ai_instructions:"",
greeting_message:"",
missed_lead_message:"",
follow_up_enabled:true
})

useEffect(()=>{
loadSettings()
},[])

async function loadSettings(){

const {data:user} = await supabase.auth.getUser()

if(!user?.user) return

const {data} = await supabase
.from("business_settings")
.select("*")
.eq("user_id",user.user.id)
.maybeSingle()

if(data){
setSettings(data)
}

setLoading(false)
}

function updateField(field,value){
setSettings(prev=>({...prev,[field]:value}))
}

async function saveSettings(){

const {data:user} = await supabase.auth.getUser()

await supabase
.from("business_settings")
.upsert({
...settings,
user_id:user.user.id,
updated_at:new Date().toISOString()
})

alert("Settings saved")
}

if(loading) return <div style={{padding:40}}>Loading settings...</div>

return (

<div style={{padding:40,maxWidth:900}}>

<h2>Business Settings</h2>

<input
placeholder="Business Name"
value={settings.business_name||""}
onChange={e=>updateField("business_name",e.target.value)}
/>

<input
placeholder="Business Type (salon / clinic)"
value={settings.business_type||""}
onChange={e=>updateField("business_type",e.target.value)}
/>

<input
placeholder="Phone"
value={settings.phone||""}
onChange={e=>updateField("phone",e.target.value)}
/>

<input
placeholder="Email"
value={settings.email||""}
onChange={e=>updateField("email",e.target.value)}
/>

<input
placeholder="Location"
value={settings.location||""}
onChange={e=>updateField("location",e.target.value)}
/>

<input
placeholder="Google Maps Link"
value={settings.maps_link||""}
onChange={e=>updateField("maps_link",e.target.value)}
/>

<textarea
placeholder="Business Description"
value={settings.description||""}
onChange={e=>updateField("description",e.target.value)}
/>

<hr/>

<h2>Working Hours</h2>

<label>Start</label>
<input
type="time"
value={settings.working_hours_start}
onChange={e=>updateField("working_hours_start",e.target.value)}
/>

<label>End</label>
<input
type="time"
value={settings.working_hours_end}
onChange={e=>updateField("working_hours_end",e.target.value)}
/>

<hr/>

<h2>Booking Engine</h2>

<label>Slot Interval (minutes)</label>

<input
type="number"
value={settings.slot_interval_minutes}
onChange={e=>updateField("slot_interval_minutes",parseInt(e.target.value))}
 />

<label>Allow Parallel Bookings</label>

<input
type="checkbox"
checked={settings.allow_parallel_bookings}
onChange={e=>updateField("allow_parallel_bookings",e.target.checked)}
/>

<label>Default Capacity</label>

<input
type="number"
value={settings.default_capacity}
onChange={e=>updateField("default_capacity",parseInt(e.target.value))}
 />

<label>Auto Booking</label>

<input
type="checkbox"
checked={settings.auto_booking}
onChange={e=>updateField("auto_booking",e.target.checked)}
/>

<hr/>

<h2>AI Assistant</h2>

<label>Enable AI</label>

<input
type="checkbox"
checked={settings.ai_enabled}
onChange={e=>updateField("ai_enabled",e.target.checked)}
/>

<label>AI Language</label>

<input
value={settings.ai_language}
onChange={e=>updateField("ai_language",e.target.value)}
/>

<label>AI Tone</label>

<input
value={settings.ai_tone}
onChange={e=>updateField("ai_tone",e.target.value)}
/>

<textarea
placeholder="AI Instructions"
value={settings.ai_instructions}
onChange={e=>updateField("ai_instructions",e.target.value)}
/>

<textarea
placeholder="Greeting Message"
value={settings.greeting_message}
onChange={e=>updateField("greeting_message",e.target.value)}
/>

<textarea
placeholder="Missed Lead Message"
value={settings.missed_lead_message}
onChange={e=>updateField("missed_lead_message",e.target.value)}
/>

<label>Follow up enabled</label>

<input
type="checkbox"
checked={settings.follow_up_enabled}
onChange={e=>updateField("follow_up_enabled",e.target.checked)}
/>

<br/><br/>

<button onClick={saveSettings}>Save Settings</button>

</div>

)
}
