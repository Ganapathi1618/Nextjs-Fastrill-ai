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

const TEMPLATE_LIBRARY = {
  "Salon & Spa": [
    { id:"s1", name:"Festival Offer", goal:"Booking", tags:["offer","festival"],
      message:"Hi [Name] 👋 This [FESTIVAL], get [DISCOUNT]% off on [SERVICE] at [SALON NAME]! 🎉\nOnly [SLOTS] slots left. Book now → [BOOKING LINK]",
      fields:["FESTIVAL","DISCOUNT","SERVICE","SALON NAME","SLOTS"] },
    { id:"s2", name:"New Service Launch", goal:"Awareness", tags:["new","launch"],
      message:"Hi [Name] ✨ We just launched our new [SERVICE NAME] at [SALON NAME]!\nStarting at just ₹[PRICE]. Be the first to try it 💫\nBook your slot → [BOOKING LINK]",
      fields:["SERVICE NAME","SALON NAME","PRICE"] },
    { id:"s3", name:"Win Back Inactive", goal:"Re-engagement", tags:["winback"],
      message:"Hi [Name] 😊 We miss you at [SALON NAME]!\nIt's been a while — come back this week and get ₹[DISCOUNT] off your next visit.\nBook here → [BOOKING LINK]",
      fields:["SALON NAME","DISCOUNT"] },
    { id:"s4", name:"Bridal Season", goal:"Upsell", tags:["bridal","premium"],
      message:"Hi [Name] 👰 Getting married soon? Our exclusive Bridal Package includes [SERVICES] — all for ₹[PRICE].\nLimited slots for [MONTH]. Book your trial → [BOOKING LINK]",
      fields:["SERVICES","PRICE","MONTH"] },
    { id:"s5", name:"Weekend Special", goal:"Booking", tags:["weekend","offer"],
      message:"Hi [Name] ✂️ Weekend Special at [SALON NAME]!\n[SERVICE] at just ₹[PRICE] — this Sat & Sun only.\nBook now before slots fill up → [BOOKING LINK]",
      fields:["SALON NAME","SERVICE","PRICE"] },
  ],
  "Clinic & Doctor": [
    { id:"c1", name:"Health Camp", goal:"Awareness", tags:["camp","health"],
      message:"Hi [Name] 🏥 [CLINIC NAME] is organising a Free Health Checkup Camp on [DATE].\nServices: [SERVICES]. Register here → [LINK]",
      fields:["CLINIC NAME","DATE","SERVICES"] },
    { id:"c2", name:"Seasonal Reminder", goal:"Booking", tags:["seasonal","reminder"],
      message:"Hi [Name] 👨‍⚕️ [SEASON] is here and it's time for your [SERVICE] checkup!\nBook with Dr. [DOCTOR NAME] this week → [BOOKING LINK]",
      fields:["SEASON","SERVICE","DOCTOR NAME"] },
    { id:"c3", name:"Follow-up Appointment", goal:"Re-engagement", tags:["followup"],
      message:"Hi [Name], this is a reminder from [CLINIC NAME].\nYour follow-up with Dr. [DOCTOR] is due. Book your slot → [BOOKING LINK]",
      fields:["CLINIC NAME","DOCTOR"] },
  ],
  "Dental": [
    { id:"d1", name:"Scaling Offer", goal:"Booking", tags:["scaling","offer"],
      message:"Hi [Name] 😁 Smile brighter this [MONTH]!\nGet teeth scaling + polishing at just ₹[PRICE] at [CLINIC NAME].\nOnly [SLOTS] slots available → [BOOKING LINK]",
      fields:["MONTH","PRICE","CLINIC NAME","SLOTS"] },
    { id:"d2", name:"Whitening Campaign", goal:"Upsell", tags:["whitening"],
      message:"Hi [Name] ✨ Get a celebrity smile with our Teeth Whitening treatment!\nSpecial price: ₹[PRICE] (regular ₹[ORIGINAL PRICE]).\nBook at [CLINIC NAME] → [BOOKING LINK]",
      fields:["PRICE","ORIGINAL PRICE","CLINIC NAME"] },
  ],
  "General": [
    { id:"g1", name:"Simple Offer", goal:"Booking", tags:["offer"],
      message:"Hi [Name] 🎁 Special offer from [BUSINESS NAME]!\nGet [DISCOUNT]% off on [SERVICE] this week only.\nBook here → [BOOKING LINK]",
      fields:["BUSINESS NAME","DISCOUNT","SERVICE"] },
    { id:"g2", name:"Referral Ask", goal:"Awareness", tags:["referral"],
      message:"Hi [Name] 💚 Enjoying our services? Refer a friend and BOTH of you get ₹[AMOUNT] off!\nShare this link → [REFERRAL LINK]",
      fields:["AMOUNT"] },
  ],
}

const CRM_SEGMENTS = [
  { id:"all", label:"All Customers", count:312, icon:"👥" },
  { id:"female", label:"Female Customers", count:198, icon:"👩" },
  { id:"male", label:"Male Customers", count:114, icon:"👨" },
  { id:"inactive", label:"Inactive (60+ days)", count:47, icon:"😴" },
  { id:"vip", label:"VIP Customers (₹5k+)", count:28, icon:"⭐" },
  { id:"new", label:"New Leads (never booked)", count:63, icon:"🌱" },
]

const GOALS_INFO = {
  Booking: { color:"#00c47d", sub:"Drive appointment bookings", aiAction:"AI will push every reply toward booking a slot" },
  Awareness: { color:"#0ea5e9", sub:"Announce new services or offers", aiAction:"AI will answer questions and share details" },
  "Re-engagement": { color:"#f59e0b", sub:"Bring back inactive customers", aiAction:"AI will offer incentives to re-book" },
  Upsell: { color:"#7c3aed", sub:"Sell premium services to existing customers", aiAction:"AI will highlight value and push premium options" },
}

const MOCK_CAMPAIGNS = [
  { id:1, name:"Diwali Offer — 30% Off Facials", status:"completed", goal:"Booking",
    recipients:500, sentAt:"Oct 28, 2024", scheduledFor:null,
    sent:500, delivered:487, opened:312, replied:68, booked:41, revenue:24600,
    followUpSent:180, followUpReplied:22,
    message:"Hi Priya 👋 This Diwali, get 30% off on all facials 🪔 Only 20 slots left! Book now → fastrill.com/book" },
  { id:2, name:"New Bridal Package Launch", status:"active", goal:"Awareness",
    recipients:280, sentAt:"Mar 5, 2026", scheduledFor:null,
    sent:280, delivered:271, opened:198, replied:34, booked:18, revenue:144000,
    followUpSent:80, followUpReplied:9,
    message:"Hi Priya ✨ We just launched our exclusive Bridal Package! Starting at ₹8,000. Book your trial → fastrill.com/book" },
  { id:3, name:"Re-engage Inactive Customers", status:"active", goal:"Re-engagement",
    recipients:120, sentAt:"Mar 6, 2026", scheduledFor:null,
    sent:120, delivered:116, opened:44, replied:11, booked:5, revenue:3500,
    followUpSent:34, followUpReplied:4,
    message:"Hi Priya 😊 We miss you! Come back this week and get ₹100 off on any service → fastrill.com/book" },
  { id:4, name:"Men's Haircut Weekend Special", status:"scheduled", goal:"Booking",
    recipients:114, sentAt:"—", scheduledFor:"Mar 8, 2026 at 10:00 AM",
    sent:0, delivered:0, opened:0, replied:0, booked:0, revenue:0,
    followUpSent:0, followUpReplied:0,
    message:"Hi Rahul ✂️ Weekend special! Men's haircut at just ₹150 this Sat & Sun only. Book your slot → fastrill.com/book" },
]

export default function CampaignsPage() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [dark, setDark] = useState(true)
  const [mainTab, setMainTab] = useState("campaigns")
  const [view, setView] = useState("list")
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS)
  const [templateCategory, setTemplateCategory] = useState("Salon & Spa")
  const [showTemplateLib, setShowTemplateLib] = useState(false)

  // Builder state
  const [step, setStep] = useState(1)
  const [bName, setBName] = useState("")
  const [bGoal, setBGoal] = useState("Booking")
  const [bRecipientMode, setBRecipientMode] = useState("")
  const [bSelectedSegment, setBSelectedSegment] = useState(null)
  const [bManualNumbers, setBManualNumbers] = useState("")
  const [bCsvFileName, setBCsvFileName] = useState("")
  const [bMessage, setBMessage] = useState("")
  const [bUsedTemplate, setBUsedTemplate] = useState(null)
  const [bScheduleMode, setBScheduleMode] = useState("now")
  const [bScheduleDate, setBScheduleDate] = useState("")
  const [bScheduleTime, setBScheduleTime] = useState("")
  const [bFollowUp, setBFollowUp] = useState(true)
  const [bWarmDays, setBWarmDays] = useState(2)
  const [bColdDays, setBColdDays] = useState(3)

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) router.push("/login")
      else setUserEmail(data.user.email || "")
    }
    init()
  }, [])

  const toggleTheme = () => { const n = !dark; setDark(n); localStorage.setItem("fastrill-theme", n?"dark":"light") }
  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login") }
  const pct = (n, d) => d > 0 ? Math.round(n/d*100) : 0
  const statusColor = (s) => ({active:"#00c47d",completed:"#0ea5e9",draft:"#6b7280",scheduled:"#f59e0b",paused:"#f59e0b"}[s]||"#6b7280")
  const statusLabel = (s) => ({active:"● Live",completed:"✓ Done",draft:"○ Draft",scheduled:"⏰ Scheduled",paused:"⏸ Paused"}[s]||s)

  const recipientCount = bRecipientMode==="crm" && bSelectedSegment
    ? CRM_SEGMENTS.find(s=>s.id===bSelectedSegment)?.count||0
    : bRecipientMode==="manual" ? bManualNumbers.split("\n").filter(l=>l.trim().length>8).length
    : bRecipientMode==="csv" && bCsvFileName ? 120 : 0

  const estimatedBookings = Math.round(recipientCount * 0.14)
  const estimatedRevenue = estimatedBookings * 600

  const applyTemplate = (tmpl) => {
    setBMessage(tmpl.message); setBGoal(tmpl.goal); setBUsedTemplate(tmpl); setShowTemplateLib(false)
  }

  const resetBuilder = () => {
    setStep(1); setBName(""); setBGoal("Booking"); setBRecipientMode(""); setBSelectedSegment(null)
    setBManualNumbers(""); setBCsvFileName(""); setBMessage(""); setBUsedTemplate(null)
    setBScheduleMode("now"); setBScheduleDate(""); setBScheduleTime(""); setBFollowUp(true)
  }

  const t = dark ? {
    bg:"#0a0a0f", sidebar:"#0f0f17", border:"rgba(255,255,255,0.06)", card:"#0f0f17",
    cardBorder:"rgba(255,255,255,0.07)", text:"#e8e8f0", textMuted:"rgba(255,255,255,0.4)",
    textFaint:"rgba(255,255,255,0.2)", navActive:"rgba(0,196,125,0.1)",
    navActiveBorder:"rgba(0,196,125,0.2)", navActiveText:"#00c47d",
    navText:"rgba(255,255,255,0.45)", inputBg:"rgba(255,255,255,0.04)",
    chipBg:"rgba(255,255,255,0.02)", chipBorder:"rgba(255,255,255,0.05)",
  } : {
    bg:"#f4f5f7", sidebar:"#ffffff", border:"rgba(0,0,0,0.07)", card:"#ffffff",
    cardBorder:"rgba(0,0,0,0.08)", text:"#111827", textMuted:"rgba(0,0,0,0.45)",
    textFaint:"rgba(0,0,0,0.25)", navActive:"rgba(0,180,115,0.08)",
    navActiveBorder:"rgba(0,180,115,0.2)", navActiveText:"#00935a",
    navText:"rgba(0,0,0,0.45)", inputBg:"rgba(0,0,0,0.03)",
    chipBg:"rgba(0,0,0,0.02)", chipBorder:"rgba(0,0,0,0.05)",
  }
  const accent = dark ? "#00c47d" : "#00935a"
  const userInitial = userEmail ? userEmail[0].toUpperCase() : "G"
  const inp = {background:t.inputBg,border:`1px solid ${t.cardBorder}`,borderRadius:9,padding:"9px 12px",fontSize:13,color:t.text,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none",width:"100%"}

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${t.bg}!important;color:${t.text}!important;font-family:'Plus Jakarta Sans',sans-serif!important;}
        .root{display:flex;height:100vh;overflow:hidden;background:${t.bg};}
        .sidebar{width:224px;flex-shrink:0;background:${t.sidebar};border-right:1px solid ${t.border};display:flex;flex-direction:column;overflow-y:auto;}
        .logo{padding:22px 20px 18px;font-weight:800;font-size:20px;color:${t.text};text-decoration:none;display:block;border-bottom:1px solid ${t.border};}
        .logo span{color:${accent};}
        .nav-section{padding:18px 16px 7px;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${t.textFaint};font-weight:600;}
        .nav-item{display:flex;align-items:center;gap:9px;padding:9px 12px;margin:1px 8px;border-radius:8px;cursor:pointer;font-size:13.5px;color:${t.navText};font-weight:500;transition:all 0.13s;border:1px solid transparent;background:none;width:calc(100% - 16px);text-align:left;font-family:'Plus Jakarta Sans',sans-serif;}
        .nav-item:hover{background:${t.inputBg};color:${t.text};}
        .nav-item.active{background:${t.navActive};color:${t.navActiveText};font-weight:600;border-color:${t.navActiveBorder};}
        .nav-icon{font-size:13px;width:18px;text-align:center;flex-shrink:0;}
        .sidebar-footer{margin-top:auto;padding:14px;border-top:1px solid ${t.border};}
        .user-card{display:flex;align-items:center;gap:9px;padding:9px;border-radius:9px;background:${t.inputBg};border:1px solid ${t.cardBorder};}
        .user-avatar{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,${accent},#0ea5e9);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#fff;flex-shrink:0;}
        .user-email{font-size:11.5px;color:${t.textMuted};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .logout-btn{margin-top:7px;width:100%;padding:7px;border-radius:7px;background:transparent;border:1px solid ${t.cardBorder};font-size:12px;color:${t.textMuted};cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .logout-btn:hover{border-color:#fca5a5;color:#ef4444;}
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .topbar{height:54px;flex-shrink:0;border-bottom:1px solid ${t.border};display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:${t.sidebar};}
        .topbar-left{display:flex;align-items:center;gap:10px;}
        .topbar-title{font-weight:700;font-size:15px;color:${t.text};}
        .topbar-right{display:flex;align-items:center;gap:10px;}
        .theme-btn{display:flex;align-items:center;gap:7px;padding:5px 11px;border-radius:8px;background:${t.inputBg};border:1px solid ${t.cardBorder};cursor:pointer;font-size:12px;color:${t.textMuted};font-family:'Plus Jakarta Sans',sans-serif;font-weight:500;}
        .pill{width:32px;height:18px;border-radius:100px;background:${dark?accent:"#d1d5db"};position:relative;transition:background 0.2s;flex-shrink:0;}
        .pill::after{content:'';position:absolute;top:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:left 0.2s;left:${dark?"16px":"2px"};}
        .back-btn{display:flex;align-items:center;gap:6px;padding:6px 13px;border-radius:8px;background:${t.inputBg};border:1px solid ${t.cardBorder};color:${t.textMuted};font-size:12.5px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .new-btn{display:inline-flex;align-items:center;gap:7px;padding:8px 18px;border-radius:9px;background:${accent};border:none;color:#000;font-weight:700;font-size:12.5px;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.15s;}
        .new-btn:hover{transform:translateY(-1px);box-shadow:0 4px 14px ${accent}44;}
        .content{flex:1;overflow-y:auto;padding:20px 24px;background:${t.bg};}
        .content::-webkit-scrollbar{width:4px;}
        .content::-webkit-scrollbar-thumb{background:${t.border};border-radius:2px;}
        .page-tabs{display:flex;gap:5px;margin-bottom:18px;}
        .ptab{padding:7px 18px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid ${t.cardBorder};background:transparent;color:${t.textMuted};font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.13s;}
        .ptab.active{background:${accent}15;border-color:${accent}40;color:${accent};}
        .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;}
        .stat-card{background:${t.card};border:1px solid ${t.cardBorder};border-radius:12px;padding:15px 18px;}
        .stat-label{font-size:10.5px;color:${t.textMuted};font-weight:500;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.8px;}
        .stat-value{font-weight:800;font-size:24px;letter-spacing:-0.5px;line-height:1;}
        .stat-sub{font-size:11px;color:${t.textFaint};margin-top:3px;}
        .camp-card{background:${t.card};border:1px solid ${t.cardBorder};border-radius:13px;padding:18px 20px;margin-bottom:10px;cursor:pointer;transition:all 0.15s;}
        .camp-card:hover{border-color:${accent}33;transform:translateY(-1px);}
        .camp-name{font-weight:700;font-size:14px;color:${t.text};margin-bottom:5px;}
        .camp-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
        .tag{display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border-radius:100px;font-size:11px;font-weight:600;}
        .rev-badge{display:inline-flex;align-items:center;padding:5px 12px;border-radius:8px;background:${accent}10;border:1px solid ${accent}22;color:${accent};font-size:13px;font-weight:700;flex-shrink:0;}
        .sched-badge{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:8px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);color:#f59e0b;font-size:11.5px;font-weight:600;flex-shrink:0;}
        .funnel-row{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:12px;}
        .fi{text-align:center;}
        .fi-label{font-size:9.5px;color:${t.textFaint};font-weight:600;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.6px;}
        .fi-bar{height:3px;background:${t.inputBg};border-radius:100px;margin-bottom:4px;overflow:hidden;}
        .fi-fill{height:100%;border-radius:100px;}
        .fi-val{font-weight:700;font-size:13.5px;}
        .fi-pct{font-size:10px;color:${t.textFaint};}
        .tlib-cats{display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap;}
        .tcat{padding:6px 14px;border-radius:8px;font-size:12.5px;font-weight:600;cursor:pointer;border:1px solid ${t.cardBorder};background:${t.inputBg};color:${t.textMuted};font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.13s;}
        .tcat.active{background:${accent}12;border-color:${accent}33;color:${accent};}
        .tmpl-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;}
        .tmpl-card{background:${t.card};border:1px solid ${t.cardBorder};border-radius:12px;padding:16px;transition:all 0.15s;}
        .tmpl-card:hover{border-color:${accent}33;transform:translateY(-1px);}
        .tmpl-name{font-weight:700;font-size:13.5px;color:${t.text};margin-bottom:5px;}
        .tmpl-preview{font-size:12px;color:${t.textMuted};line-height:1.55;margin-bottom:10px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
        .tmpl-use-btn{padding:7px 14px;border-radius:7px;background:${accent}15;border:1px solid ${accent}33;color:${accent};font-size:12px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;width:100%;text-align:center;}
        .tlib-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px;}
        .tlib-modal{background:${t.sidebar};border:1px solid ${t.cardBorder};border-radius:16px;width:720px;max-height:80vh;overflow-y:auto;padding:24px;}
        .tlib-modal::-webkit-scrollbar{width:4px;}
        .tlib-modal::-webkit-scrollbar-thumb{background:${t.border};}
        .builder-wrap{max-width:700px;}
        .steps{display:flex;align-items:center;gap:0;margin-bottom:22px;}
        .sdot{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;}
        .sdot.done{background:${accent};color:#000;}
        .sdot.active{background:${accent}18;border:2px solid ${accent};color:${accent};}
        .sdot.todo{background:${t.inputBg};border:1px solid ${t.cardBorder};color:${t.textFaint};}
        .sname{font-size:11.5px;font-weight:600;white-space:nowrap;}
        .sname.active{color:${t.text};}
        .sname.todo{color:${t.textFaint};}
        .sline{flex:1;height:1px;background:${t.border};margin:0 6px;}
        .bc{background:${t.card};border:1px solid ${t.cardBorder};border-radius:14px;padding:22px 24px;margin-bottom:14px;}
        .bc-title{font-weight:700;font-size:15px;color:${t.text};margin-bottom:3px;}
        .bc-sub{font-size:12.5px;color:${t.textMuted};margin-bottom:20px;}
        .flabel{font-size:11.5px;font-weight:600;color:${t.textMuted};margin-bottom:5px;display:block;}
        .fw{margin-bottom:14px;}
        .rmode-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px;}
        .rmode-card{padding:16px;border-radius:11px;border:1px solid ${t.cardBorder};background:${t.inputBg};cursor:pointer;transition:all 0.15s;text-align:center;}
        .rmode-card:hover{border-color:${accent}33;}
        .rmode-card.active{background:${accent}08;border-color:${accent}40;}
        .rmode-icon{font-size:22px;margin-bottom:7px;}
        .rmode-name{font-weight:700;font-size:13px;color:${t.text};margin-bottom:2px;}
        .rmode-sub{font-size:11px;color:${t.textMuted};}
        .seg-list{display:flex;flex-direction:column;gap:7px;margin-top:4px;}
        .seg-row{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:10px;border:1px solid ${t.cardBorder};background:${t.inputBg};cursor:pointer;transition:all 0.13s;}
        .seg-row:hover{border-color:${accent}33;}
        .seg-row.active{background:${accent}08;border-color:${accent}40;}
        .goal-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin-bottom:16px;}
        .goal-card{padding:13px 15px;border-radius:10px;border:1px solid ${t.cardBorder};background:${t.inputBg};cursor:pointer;transition:all 0.13s;}
        .goal-card:hover{border-color:${accent}33;}
        .sched-opts{display:flex;gap:10px;margin-bottom:16px;}
        .sched-opt{flex:1;padding:16px;border-radius:11px;border:1px solid ${t.cardBorder};background:${t.inputBg};cursor:pointer;transition:all 0.13s;text-align:center;}
        .sched-opt:hover{border-color:${accent}33;}
        .sched-opt.active{background:${accent}08;border-color:${accent}40;}
        .datetime-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;}
        .fu-toggle{display:flex;align-items:center;justify-content:space-between;padding:13px 15px;border-radius:10px;background:${t.inputBg};border:1px solid ${t.cardBorder};margin-bottom:12px;}
        .tog-btn{width:40px;height:22px;border-radius:100px;border:none;cursor:pointer;position:relative;flex-shrink:0;transition:background 0.2s;}
        .tog-btn.on{background:${accent};}
        .tog-btn.off{background:${dark?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.12)"};}
        .tog-btn::after{content:'';position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left 0.2s;}
        .tog-btn.on::after{left:21px;}
        .tog-btn.off::after{left:3px;}
        .fu-rule{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:10px;background:${t.chipBg};border:1px solid ${t.chipBorder};margin-bottom:8px;}
        .dayctr{display:flex;align-items:center;border:1px solid ${t.cardBorder};border-radius:8px;overflow:hidden;}
        .dcbtn{width:28px;height:28px;background:${t.inputBg};border:none;color:${t.text};cursor:pointer;font-size:15px;font-weight:700;}
        .dcval{width:32px;text-align:center;font-weight:700;font-size:13px;color:${t.text};background:${t.chipBg};}
        .forecast{background:linear-gradient(135deg,${accent}08,rgba(14,165,233,0.05));border:1px solid ${accent}20;border-radius:12px;padding:16px 20px;margin-bottom:16px;}
        .forecast-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:8px;}
        .fcast-val{font-weight:800;font-size:20px;letter-spacing:-0.5px;}
        .fcast-label{font-size:11px;color:${t.textMuted};margin-top:2px;}
        .review-row{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid ${t.border};font-size:13px;}
        .msg-preview{background:${accent}0a;border:1px solid ${accent}18;border-radius:12px;border-bottom-left-radius:3px;padding:11px 15px;font-size:13px;color:${t.text};line-height:1.65;max-width:340px;}
        .ai-note{display:flex;gap:10px;padding:12px 14px;border-radius:10px;background:rgba(124,58,237,0.06);border:1px solid rgba(124,58,237,0.15);margin-top:14px;}
        .btn-row{display:flex;gap:9px;justify-content:flex-end;margin-top:18px;}
        .sec-btn{padding:9px 20px;border-radius:9px;background:${t.inputBg};border:1px solid ${t.cardBorder};color:${t.textMuted};font-size:13px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .pri-btn{padding:9px 22px;border-radius:9px;background:${accent};border:none;color:#000;font-size:13px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.15s;}
        .pri-btn:disabled{opacity:0.4;cursor:not-allowed;}
        .pri-btn:not(:disabled):hover{transform:translateY(-1px);}
        .launch-btn{padding:11px 26px;border-radius:10px;background:#1877f2;border:none;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.15s;}
        .launch-btn:hover{transform:translateY(-1px);box-shadow:0 4px 18px rgba(24,119,242,0.4);}
        .dkpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px;}
        .dkpi{background:${t.chipBg};border:1px solid ${t.chipBorder};border-radius:10px;padding:14px;}
        .dkpi-val{font-weight:800;font-size:22px;letter-spacing:-0.5px;}
        .dkpi-label{font-size:11px;color:${t.textMuted};margin-top:2px;}
        .funnel-detail{display:flex;align-items:flex-end;gap:0;height:90px;margin:16px 0 8px;}
        .fds{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;}
        .fds-bar{width:75%;border-radius:4px 4px 0 0;}
        .fds-val{font-weight:700;font-size:13px;}
        .fds-label{font-size:9.5px;color:${t.textFaint};text-transform:uppercase;letter-spacing:0.6px;}
        .fds-pct{font-size:9.5px;color:${t.textFaint};}
        .farr{font-size:17px;color:${t.textFaint};margin-bottom:30px;flex-shrink:0;}
        .fu-boxes{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .fu-box{background:${t.chipBg};border:1px solid ${t.chipBorder};border-radius:10px;padding:14px;}
        .fu-stat{display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;}
        @media(max-width:768px){.sidebar{display:none;}.stats-row,.rmode-grid,.tmpl-grid,.goal-grid,.fu-boxes,.dkpis{grid-template-columns:1fr 1fr;}.funnel-row{grid-template-columns:repeat(3,1fr);}}
      `}</style>

      {/* Template Library Modal */}
      {showTemplateLib && (
        <div className="tlib-overlay" onClick={()=>setShowTemplateLib(false)}>
          <div className="tlib-modal" onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
              <div>
                <div style={{fontWeight:700,fontSize:17,color:t.text}}>Template Library</div>
                <div style={{fontSize:12,color:t.textMuted,marginTop:2}}>Pick a template, fill in the blanks, launch</div>
              </div>
              <button style={{width:30,height:30,borderRadius:8,background:t.inputBg,border:`1px solid ${t.cardBorder}`,color:t.textMuted,cursor:"pointer",fontSize:16}} onClick={()=>setShowTemplateLib(false)}>✕</button>
            </div>
            <div className="tlib-cats">
              {Object.keys(TEMPLATE_LIBRARY).map(cat=>(
                <button key={cat} className={`tcat${templateCategory===cat?" active":""}`} onClick={()=>setTemplateCategory(cat)}>{cat}</button>
              ))}
            </div>
            <div className="tmpl-grid">
              {TEMPLATE_LIBRARY[templateCategory].map(tmpl=>(
                <div key={tmpl.id} className="tmpl-card">
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                    <div className="tmpl-name">{tmpl.name}</div>
                    <span className="tag" style={{background:GOALS_INFO[tmpl.goal]?.color+"15",border:`1px solid ${GOALS_INFO[tmpl.goal]?.color}25`,color:GOALS_INFO[tmpl.goal]?.color,fontSize:10}}>{tmpl.goal}</span>
                  </div>
                  <div className="tmpl-preview">{tmpl.message}</div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
                    {tmpl.fields.map(f=>(
                      <span key={f} style={{background:`${accent}10`,border:`1px solid ${accent}22`,borderRadius:5,padding:"1px 7px",fontSize:10.5,color:accent,fontWeight:600}}>[{f}]</span>
                    ))}
                  </div>
                  <button className="tmpl-use-btn" onClick={()=>applyTemplate(tmpl)}>Use This Template →</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="root">
        <aside className="sidebar">
          <a href="/dashboard" className="logo">fast<span>rill</span></a>
          <div className="nav-section">Platform</div>
          {NAV.map(item=>(
            <button key={item.id} className={`nav-item${item.id==="campaigns"?" active":""}`} onClick={()=>router.push(item.path)}>
              <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
          <div className="sidebar-footer">
            <div className="user-card">
              <div className="user-avatar">{userInitial}</div>
              <div className="user-email">{userEmail||"Loading..."}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>↩ Sign out</button>
          </div>
        </aside>

        <div className="main">
          <div className="topbar">
            <div className="topbar-left">
              {view!=="list" && <button className="back-btn" onClick={()=>{setView("list");resetBuilder()}}>← Back</button>}
              <div className="topbar-title">
                {view==="list"?"Campaigns":view==="create"?"New Campaign":selectedCampaign?.name}
              </div>
            </div>
            <div className="topbar-right">
              <button className="theme-btn" onClick={toggleTheme}>
                <span>{dark?"🌙":"☀️"}</span><div className="pill"/><span>{dark?"Dark":"Light"}</span>
              </button>
              {view==="list" && <button className="new-btn" onClick={()=>{setView("create");setMainTab("campaigns")}}>◆ New Campaign</button>}
            </div>
          </div>

          <div className="content">

            {/* ══ LIST VIEW ══ */}
            {view==="list" && (
              <>
                <div className="page-tabs">
                  {[{id:"campaigns",label:"📢 Campaigns"},{id:"templates",label:"📝 Template Library"}].map(tab=>(
                    <button key={tab.id} className={`ptab${mainTab===tab.id?" active":""}`} onClick={()=>setMainTab(tab.id)}>{tab.label}</button>
                  ))}
                </div>

                {mainTab==="campaigns" && (
                  <>
                    <div className="stats-row">
                      {[
                        {label:"Campaign Revenue", value:`₹${campaigns.reduce((s,c)=>s+c.revenue,0).toLocaleString()}`, sub:"all time", color:accent},
                        {label:"Active Campaigns", value:campaigns.filter(c=>c.status==="active").length, sub:"running now", color:"#0ea5e9"},
                        {label:"Bookings via Campaigns", value:campaigns.reduce((s,c)=>s+c.booked,0), sub:"total", color:"#7c3aed"},
                        {label:"Avg Open Rate", value:`${pct(campaigns.reduce((s,c)=>s+c.opened,0),campaigns.reduce((s,c)=>s+c.delivered,0))}%`, sub:"across all campaigns", color:"#f59e0b"},
                      ].map(s=>(
                        <div key={s.label} className="stat-card">
                          <div className="stat-label">{s.label}</div>
                          <div className="stat-value" style={{color:s.color}}>{s.value}</div>
                          <div className="stat-sub">{s.sub}</div>
                        </div>
                      ))}
                    </div>

                    {/* Activation nudge */}
                    <div style={{background:`linear-gradient(135deg,${accent}08,rgba(14,165,233,0.05))`,border:`1px solid ${accent}20`,borderRadius:13,padding:"16px 20px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:13.5,color:t.text,marginBottom:3}}>💡 47 customers haven't visited in 60+ days</div>
                        <div style={{fontSize:12.5,color:t.textMuted}}>A Re-engagement campaign could generate an estimated <strong style={{color:accent}}>₹28,200</strong> — one click to launch</div>
                      </div>
                      <button className="new-btn" onClick={()=>setView("create")}>Launch Campaign →</button>
                    </div>

                    {campaigns.map(c=>(
                      <div key={c.id} className="camp-card" onClick={()=>{setSelectedCampaign(c);setView("detail")}}>
                        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,marginBottom:c.sent>0?12:0}}>
                          <div style={{flex:1}}>
                            <div className="camp-name">{c.name}</div>
                            <div className="camp-meta">
                              <span style={{fontSize:12,fontWeight:700,color:statusColor(c.status)}}>{statusLabel(c.status)}</span>
                              <span className="tag" style={{background:GOALS_INFO[c.goal]?.color+"12",border:`1px solid ${GOALS_INFO[c.goal]?.color}22`,color:GOALS_INFO[c.goal]?.color}}>{c.goal}</span>
                              <span className="tag" style={{background:t.inputBg,border:`1px solid ${t.cardBorder}`,color:t.textMuted}}>👥 {c.recipients} recipients</span>
                              {c.scheduledFor && <span style={{fontSize:11,color:"#f59e0b"}}>⏰ {c.scheduledFor}</span>}
                              {c.sentAt!=="—"&&!c.scheduledFor && <span style={{fontSize:11,color:t.textFaint}}>Sent {c.sentAt}</span>}
                            </div>
                          </div>
                          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                            {c.revenue>0 && <div className="rev-badge">₹{c.revenue.toLocaleString()}</div>}
                            {c.status==="scheduled" && <div className="sched-badge">⏰ Scheduled</div>}
                          </div>
                        </div>

                        {c.sent>0 ? (
                          <div className="funnel-row">
                            {[
                              {label:"Sent",val:c.sent,p:100,color:"#6b7280"},
                              {label:"Delivered",val:c.delivered,p:pct(c.delivered,c.sent),color:"#0ea5e9"},
                              {label:"Opened",val:c.opened,p:pct(c.opened,c.sent),color:"#f59e0b"},
                              {label:"Replied",val:c.replied,p:pct(c.replied,c.sent),color:"#7c3aed"},
                              {label:"Booked",val:c.booked,p:pct(c.booked,c.sent),color:accent},
                              {label:"Revenue",val:`₹${c.revenue.toLocaleString()}`,p:pct(c.booked,c.sent),color:accent},
                            ].map(f=>(
                              <div key={f.label} className="fi">
                                <div className="fi-label">{f.label}</div>
                                <div className="fi-bar"><div className="fi-fill" style={{width:`${f.p}%`,background:f.color+"66"}}/></div>
                                <div className="fi-val" style={{color:f.color,fontSize:f.label==="Revenue"?14:13.5}}>{f.val}</div>
                                {f.label!=="Revenue" && <div className="fi-pct">{f.p}%</div>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{fontSize:12,color:t.textFaint,display:"flex",alignItems:"center",gap:7,paddingTop:4}}>
                            {c.status==="scheduled" ? `⏰ Sends to ${c.recipients} people on ${c.scheduledFor}` : "○ Draft — not sent yet"}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}

                {mainTab==="templates" && (
                  <>
                    <div style={{fontSize:13,color:t.textMuted,marginBottom:16}}>Ready-made WhatsApp templates for salons, clinics, dental and more. Fill in the blanks and launch.</div>
                    <div className="tlib-cats">
                      {Object.keys(TEMPLATE_LIBRARY).map(cat=>(
                        <button key={cat} className={`tcat${templateCategory===cat?" active":""}`} onClick={()=>setTemplateCategory(cat)}>{cat}</button>
                      ))}
                    </div>
                    <div className="tmpl-grid">
                      {TEMPLATE_LIBRARY[templateCategory].map(tmpl=>(
                        <div key={tmpl.id} className="tmpl-card">
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                            <div className="tmpl-name">{tmpl.name}</div>
                            <span className="tag" style={{background:GOALS_INFO[tmpl.goal]?.color+"15",border:`1px solid ${GOALS_INFO[tmpl.goal]?.color}25`,color:GOALS_INFO[tmpl.goal]?.color,fontSize:10}}>{tmpl.goal}</span>
                          </div>
                          <div className="tmpl-preview">{tmpl.message}</div>
                          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
                            {tmpl.fields.map(f=>(
                              <span key={f} style={{background:`${accent}10`,border:`1px solid ${accent}22`,borderRadius:5,padding:"1px 7px",fontSize:10.5,color:accent,fontWeight:600}}>[{f}]</span>
                            ))}
                          </div>
                          <button className="tmpl-use-btn" onClick={()=>{applyTemplate(tmpl);setView("create");setStep(2);}}>Use This Template →</button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* ══ DETAIL VIEW ══ */}
            {view==="detail" && selectedCampaign && (
              <div style={{maxWidth:820}}>
                <div style={{background:t.card,border:`1px solid ${t.cardBorder}`,borderRadius:14,padding:"22px 24px",marginBottom:16}}>
                  <div style={{fontWeight:800,fontSize:19,color:t.text,marginBottom:8,letterSpacing:"-0.3px"}}>{selectedCampaign.name}</div>
                  <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:16}}>
                    <span style={{fontSize:13,fontWeight:700,color:statusColor(selectedCampaign.status)}}>{statusLabel(selectedCampaign.status)}</span>
                    <span className="tag" style={{background:GOALS_INFO[selectedCampaign.goal]?.color+"12",border:`1px solid ${GOALS_INFO[selectedCampaign.goal]?.color}22`,color:GOALS_INFO[selectedCampaign.goal]?.color}}>{selectedCampaign.goal}</span>
                    <span style={{fontSize:12,color:t.textFaint}}>👥 {selectedCampaign.recipients} recipients</span>
                    <span style={{fontSize:12,color:t.textFaint}}>{selectedCampaign.scheduledFor?`⏰ ${selectedCampaign.scheduledFor}`:`Sent ${selectedCampaign.sentAt}`}</span>
                  </div>
                  <div className="dkpis">
                    {[
                      {label:"Revenue Generated",val:`₹${selectedCampaign.revenue.toLocaleString()}`,color:accent},
                      {label:"Bookings",val:selectedCampaign.booked,color:"#7c3aed"},
                      {label:"Revenue per Recipient",val:selectedCampaign.recipients>0?`₹${Math.round(selectedCampaign.revenue/selectedCampaign.recipients)}`:"—",color:"#0ea5e9"},
                    ].map(k=>(
                      <div key={k.label} className="dkpi">
                        <div className="dkpi-val" style={{color:k.color}}>{k.val}</div>
                        <div className="dkpi-label">{k.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedCampaign.sent>0 && (
                  <div style={{background:t.card,border:`1px solid ${t.cardBorder}`,borderRadius:14,padding:"20px 24px",marginBottom:16}}>
                    <div style={{fontWeight:700,fontSize:14,color:t.text}}>Campaign Funnel</div>
                    <div style={{fontSize:12,color:t.textMuted,marginTop:2}}>From send to revenue — every step tracked</div>
                    <div className="funnel-detail">
                      {[
                        {label:"Sent",val:selectedCampaign.sent,p:100,color:"#6b7280"},
                        {label:"Delivered",val:selectedCampaign.delivered,p:pct(selectedCampaign.delivered,selectedCampaign.sent),color:"#0ea5e9"},
                        {label:"Opened",val:selectedCampaign.opened,p:pct(selectedCampaign.opened,selectedCampaign.sent),color:"#f59e0b"},
                        {label:"Replied",val:selectedCampaign.replied,p:pct(selectedCampaign.replied,selectedCampaign.sent),color:"#7c3aed"},
                        {label:"Booked",val:selectedCampaign.booked,p:pct(selectedCampaign.booked,selectedCampaign.sent),color:accent},
                      ].map((f,i,arr)=>(
                        <>
                          <div key={f.label} className="fds">
                            <div className="fds-bar" style={{height:`${Math.max(f.p*0.82,6)}px`,background:f.color+"28",border:`1px solid ${f.color}44`}}/>
                            <div className="fds-val" style={{color:f.color}}>{f.val}</div>
                            <div className="fds-pct">{f.p}%</div>
                            <div className="fds-label">{f.label}</div>
                          </div>
                          {i<arr.length-1 && <div className="farr" key={`a${i}`}>›</div>}
                        </>
                      ))}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:10,background:`${accent}08`,border:`1px solid ${accent}20`}}>
                      <div style={{fontSize:26,fontWeight:800,color:accent}}>₹{selectedCampaign.revenue.toLocaleString()}</div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:t.text}}>Revenue from this campaign</div>
                        <div style={{fontSize:12,color:t.textMuted}}>{selectedCampaign.booked} bookings · avg ₹{selectedCampaign.booked>0?Math.round(selectedCampaign.revenue/selectedCampaign.booked).toLocaleString():"—"} per booking</div>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{background:t.card,border:`1px solid ${t.cardBorder}`,borderRadius:14,padding:"20px 24px",marginBottom:16}}>
                  <div style={{fontWeight:700,fontSize:14,color:t.text,marginBottom:14}}>◆ Smart Follow-ups</div>
                  <div className="fu-boxes">
                    <div className="fu-box">
                      <div style={{fontSize:10.5,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",color:t.textFaint,marginBottom:3}}>🔥 Warm Follow-up</div>
                      <div style={{fontSize:11,color:t.textFaint,marginBottom:10}}>Opened but didn't reply · After 2 days</div>
                      {[{l:"Targeted",v:selectedCampaign.opened-selectedCampaign.replied},{l:"Sent",v:selectedCampaign.followUpSent},{l:"Replied",v:selectedCampaign.followUpReplied},{l:"Reply Rate",v:`${pct(selectedCampaign.followUpReplied,selectedCampaign.followUpSent)}%`}].map(r=>(
                        <div key={r.l} className="fu-stat"><span style={{color:t.textMuted}}>{r.l}</span><span style={{fontWeight:700,color:t.text}}>{r.v}</span></div>
                      ))}
                    </div>
                    <div className="fu-box">
                      <div style={{fontSize:10.5,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",color:t.textFaint,marginBottom:3}}>❄️ Cold Re-engage</div>
                      <div style={{fontSize:11,color:t.textFaint,marginBottom:10}}>Didn't open · After 3 days</div>
                      {[{l:"Targeted",v:selectedCampaign.sent-selectedCampaign.opened},{l:"Resent",v:Math.round((selectedCampaign.sent-selectedCampaign.opened)*0.6)},{l:"Opened",v:Math.round((selectedCampaign.sent-selectedCampaign.opened)*0.12)},{l:"Open Rate",v:"12%"}].map(r=>(
                        <div key={r.l} className="fu-stat"><span style={{color:t.textMuted}}>{r.l}</span><span style={{fontWeight:700,color:t.text}}>{r.v}</span></div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{background:t.card,border:`1px solid ${t.cardBorder}`,borderRadius:14,padding:"20px 24px",marginBottom:16}}>
                  <div style={{fontWeight:700,fontSize:14,color:t.text,marginBottom:10}}>Message</div>
                  <div className="msg-preview" style={{maxWidth:"100%"}}>{selectedCampaign.message}</div>
                </div>

                <div style={{display:"flex",gap:10}}>
                  {selectedCampaign.status==="active" && <button style={{padding:"9px 18px",borderRadius:9,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.18)",color:"#ef4444",fontWeight:700,fontSize:12.5,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>⏸ Pause</button>}
                  <button style={{padding:"9px 18px",borderRadius:9,background:`${accent}10`,border:`1px solid ${accent}22`,color:accent,fontWeight:700,fontSize:12.5,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>⟳ Duplicate</button>
                </div>
              </div>
            )}

            {/* ══ CREATE VIEW ══ */}
            {view==="create" && (
              <div className="builder-wrap">
                <div className="steps">
                  {[{n:1,label:"Recipients"},{n:2,label:"Message"},{n:3,label:"Schedule"},{n:4,label:"Follow-ups"},{n:5,label:"Review"}].map((s,i,arr)=>(
                    <>
                      <div key={s.n} style={{display:"flex",alignItems:"center",gap:7}}>
                        <div className={`sdot ${step>s.n?"done":step===s.n?"active":"todo"}`}>{step>s.n?"✓":s.n}</div>
                        <span className={`sname ${step===s.n?"active":"todo"}`}>{s.label}</span>
                      </div>
                      {i<arr.length-1 && <div key={`l${i}`} className="sline"/>}
                    </>
                  ))}
                </div>

                {/* STEP 1 — Recipients */}
                {step===1 && (
                  <div className="bc">
                    <div className="bc-title">Who are you sending to?</div>
                    <div className="bc-sub">Choose your recipients from CRM, upload a CSV, or add numbers manually</div>
                    <div className="rmode-grid">
                      {[
                        {id:"crm",icon:"👥",name:"From CRM",sub:"Use existing customer segments"},
                        {id:"csv",icon:"📁",name:"Upload CSV",sub:"Import phone numbers from file"},
                        {id:"manual",icon:"✏️",name:"Add Manually",sub:"Paste numbers directly"},
                      ].map(m=>(
                        <div key={m.id} className={`rmode-card${bRecipientMode===m.id?" active":""}`} onClick={()=>setBRecipientMode(m.id)}>
                          <div className="rmode-icon">{m.icon}</div>
                          <div className="rmode-name">{m.name}</div>
                          <div className="rmode-sub">{m.sub}</div>
                        </div>
                      ))}
                    </div>

                    {bRecipientMode==="crm" && (
                      <div className="seg-list">
                        <div style={{fontSize:11.5,fontWeight:600,color:t.textMuted,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.8px"}}>Select a segment</div>
                        {CRM_SEGMENTS.map(seg=>(
                          <div key={seg.id} className={`seg-row${bSelectedSegment===seg.id?" active":""}`} onClick={()=>setBSelectedSegment(seg.id)}>
                            <span style={{fontSize:18}}>{seg.icon}</span>
                            <span style={{fontWeight:600,fontSize:13,color:t.text,flex:1}}>{seg.label}</span>
                            <span style={{fontSize:12,fontWeight:700,color:accent}}>{seg.count} people</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {bRecipientMode==="csv" && (
                      <div style={{border:`2px dashed ${t.cardBorder}`,borderRadius:12,padding:"28px 24px",textAlign:"center",cursor:"pointer"}} onClick={()=>setBCsvFileName("customers_march.csv")}>
                        {bCsvFileName ? (
                          <>
                            <div style={{fontSize:22,marginBottom:7}}>✅</div>
                            <div style={{fontWeight:700,fontSize:13,color:t.text}}>{bCsvFileName}</div>
                            <div style={{fontSize:12,color:t.textMuted,marginTop:3}}>120 valid phone numbers found</div>
                          </>
                        ) : (
                          <>
                            <div style={{fontSize:28,marginBottom:7,opacity:0.3}}>📁</div>
                            <div style={{fontWeight:600,fontSize:13,color:t.text}}>Click to upload or drag & drop</div>
                            <div style={{fontSize:12,color:t.textMuted,marginTop:3}}>CSV with columns: Name, Phone (with country code +91...)</div>
                            <div style={{fontSize:11,color:t.textFaint,marginTop:6}}>Max 10,000 numbers per campaign</div>
                          </>
                        )}
                      </div>
                    )}

                    {bRecipientMode==="manual" && (
                      <div>
                        <label className="flabel">Phone numbers (one per line, with country code)</label>
                        <textarea style={{...inp,resize:"vertical",minHeight:120,lineHeight:1.7}} value={bManualNumbers} onChange={e=>setBManualNumbers(e.target.value)} placeholder={"+91 98765 43210\n+91 87654 32109\n+91 76543 21098"}/>
                        {bManualNumbers && <div style={{fontSize:12,color:accent,marginTop:5,fontWeight:600}}>✓ {bManualNumbers.split("\n").filter(l=>l.trim().length>8).length} valid numbers</div>}
                      </div>
                    )}

                    {bRecipientMode && (
                      <div style={{marginTop:18}}>
                        <div className="fw">
                          <label className="flabel">Campaign Name</label>
                          <input style={inp} value={bName} onChange={e=>setBName(e.target.value)} placeholder="e.g. Diwali Special — 30% Off Facials"/>
                        </div>
                        <label className="flabel">Campaign Goal</label>
                        <div className="goal-grid">
                          {Object.entries(GOALS_INFO).map(([goal,info])=>(
                            <div key={goal} className="goal-card" style={{borderColor:bGoal===goal?info.color+"50":t.cardBorder,background:bGoal===goal?info.color+"08":t.inputBg}} onClick={()=>setBGoal(goal)}>
                              <div style={{fontWeight:700,fontSize:13,color:bGoal===goal?info.color:t.text,marginBottom:2}}>{goal}</div>
                              <div style={{fontSize:11,color:t.textMuted,marginBottom:4}}>{info.sub}</div>
                              <div style={{fontSize:10.5,color:t.textFaint}}>⬡ {info.aiAction}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="btn-row">
                      <button className="pri-btn" onClick={()=>setStep(2)} disabled={!bRecipientMode||!bName||(bRecipientMode==="crm"&&!bSelectedSegment)}>Next →</button>
                    </div>
                  </div>
                )}

                {/* STEP 2 — Message */}
                {step===2 && (
                  <div className="bc">
                    <div className="bc-title">Write your message</div>
                    <div className="bc-sub">Use a ready template or write your own. Every reply will be handled by AI.</div>

                    <div style={{display:"flex",gap:9,marginBottom:16,flexWrap:"wrap"}}>
                      <button style={{padding:"8px 16px",borderRadius:9,background:`${accent}12`,border:`1px solid ${accent}30`,color:accent,fontWeight:700,fontSize:12.5,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}} onClick={()=>setShowTemplateLib(true)}>📝 Browse Templates</button>
                      {bUsedTemplate && (
                        <div style={{display:"flex",alignItems:"center",gap:7,padding:"6px 12px",borderRadius:9,background:t.inputBg,border:`1px solid ${t.cardBorder}`,fontSize:12,color:t.textMuted}}>
                          Using: <strong style={{color:t.text}}>{bUsedTemplate.name}</strong>
                          <button style={{background:"none",border:"none",color:t.textFaint,cursor:"pointer",fontSize:13}} onClick={()=>{setBMessage("");setBUsedTemplate(null)}}>✕</button>
                        </div>
                      )}
                    </div>

                    <div className="fw">
                      <label className="flabel">Message</label>
                      <textarea style={{...inp,resize:"vertical",minHeight:110,lineHeight:1.65}} value={bMessage} onChange={e=>setBMessage(e.target.value)} placeholder="Hi [Name] 👋 We have a special offer for you this week..."/>
                      <div style={{fontSize:11,color:t.textFaint,marginTop:5}}>Use <strong>[Name]</strong> for customer name · <strong>[BOOKING LINK]</strong> for your booking URL</div>
                    </div>

                    {bMessage && (
                      <div style={{background:dark?"#0d1117":"#f0fdf4",border:`1px solid ${accent}22`,borderRadius:12,padding:14,marginBottom:14}}>
                        <div style={{fontSize:10,letterSpacing:"1.2px",textTransform:"uppercase",color:t.textFaint,fontWeight:600,marginBottom:8}}>Live Preview</div>
                        <div className="msg-preview">{bMessage.replace("[Name]","Priya").replace("[BOOKING LINK]","fastrill.com/book")}</div>
                      </div>
                    )}

                    <div className="ai-note">
                      <div style={{fontSize:16,flexShrink:0}}>⬡</div>
                      <div style={{fontSize:12,color:t.textMuted,lineHeight:1.55}}>
                        <strong style={{color:"#a78bfa"}}>AI takes over when they reply.</strong> Every reply to this campaign is handled automatically by Fastrill AI based on your <strong>{bGoal}</strong> goal — no manual work needed.
                      </div>
                    </div>

                    <div className="btn-row">
                      <button className="sec-btn" onClick={()=>setStep(1)}>← Back</button>
                      <button className="pri-btn" onClick={()=>setStep(3)} disabled={!bMessage}>Next →</button>
                    </div>
                  </div>
                )}

                {/* STEP 3 — Schedule */}
                {step===3 && (
                  <div className="bc">
                    <div className="bc-title">When to send?</div>
                    <div className="bc-sub">Send immediately or schedule for the best time</div>
                    <div className="sched-opts">
                      {[{id:"now",icon:"🚀",name:"Send Now",sub:"Deliver immediately after launch"},{id:"schedule",icon:"⏰",name:"Schedule",sub:"Pick a specific date and time"}].map(opt=>(
                        <div key={opt.id} className={`sched-opt${bScheduleMode===opt.id?" active":""}`} onClick={()=>setBScheduleMode(opt.id)}>
                          <div style={{fontSize:24,marginBottom:6}}>{opt.icon}</div>
                          <div style={{fontWeight:700,fontSize:13,color:t.text}}>{opt.name}</div>
                          <div style={{fontSize:11.5,color:t.textMuted,marginTop:2}}>{opt.sub}</div>
                        </div>
                      ))}
                    </div>

                    {bScheduleMode==="schedule" && (
                      <div className="datetime-row">
                        <div><label className="flabel">Date</label><input type="date" style={inp} value={bScheduleDate} onChange={e=>setBScheduleDate(e.target.value)}/></div>
                        <div><label className="flabel">Time</label><input type="time" style={inp} value={bScheduleTime} onChange={e=>setBScheduleTime(e.target.value)}/></div>
                      </div>
                    )}

                    {bScheduleMode==="now" && (
                      <div style={{padding:"12px 14px",borderRadius:10,background:`${accent}08`,border:`1px solid ${accent}18`,fontSize:12.5,color:t.textMuted,marginTop:8}}>
                        💡 <strong style={{color:t.text}}>Best time tip:</strong> WhatsApp campaigns perform best between <strong style={{color:accent}}>10 AM–12 PM</strong> and <strong style={{color:accent}}>5 PM–7 PM</strong> on weekdays.
                      </div>
                    )}

                    <div className="btn-row">
                      <button className="sec-btn" onClick={()=>setStep(2)}>← Back</button>
                      <button className="pri-btn" onClick={()=>setStep(4)} disabled={bScheduleMode==="schedule"&&(!bScheduleDate||!bScheduleTime)}>Next →</button>
                    </div>
                  </div>
                )}

                {/* STEP 4 — Follow-ups */}
                {step===4 && (
                  <div className="bc">
                    <div className="bc-title">Smart Follow-ups</div>
                    <div className="bc-sub">AI re-engages non-responders automatically — with a different message each time, not the same text again</div>

                    <div className="fu-toggle">
                      <div>
                        <div style={{fontWeight:600,fontSize:13,color:t.text}}>Enable Smart Follow-ups</div>
                        <div style={{fontSize:11.5,color:t.textMuted}}>AI sends follow-ups to people who didn't respond</div>
                      </div>
                      <button className={`tog-btn ${bFollowUp?"on":"off"}`} onClick={()=>setBFollowUp(p=>!p)}/>
                    </div>

                    {bFollowUp && (
                      <>
                        {[
                          {icon:"🔥",title:"Warm Follow-up",sub:"Opened but didn't reply — AI sends a gentle, contextual nudge",days:bWarmDays,setDays:setBWarmDays,max:7},
                          {icon:"❄️",title:"Cold Re-engage",sub:"Didn't open at all — AI tries a completely different angle",days:bColdDays,setDays:setBColdDays,max:10},
                        ].map(rule=>(
                          <div key={rule.title} className="fu-rule">
                            <div style={{fontSize:20}}>{rule.icon}</div>
                            <div style={{flex:1}}>
                              <div style={{fontWeight:600,fontSize:13,color:t.text}}>{rule.title}</div>
                              <div style={{fontSize:11.5,color:t.textMuted}}>{rule.sub}</div>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <div className="dayctr">
                                <button className="dcbtn" onClick={()=>rule.setDays(p=>Math.max(1,p-1))}>−</button>
                                <div className="dcval">{rule.days}</div>
                                <button className="dcbtn" onClick={()=>rule.setDays(p=>Math.min(rule.max,p+1))}>+</button>
                              </div>
                              <span style={{fontSize:12,color:t.textFaint}}>days</span>
                            </div>
                          </div>
                        ))}
                        <div className="ai-note">
                          <div style={{fontSize:16,flexShrink:0}}>⬡</div>
                          <div style={{fontSize:12,color:t.textMuted,lineHeight:1.55}}>
                            AI writes a <strong style={{color:"#a78bfa"}}>different message</strong> for each follow-up based on the campaign context. Warm leads get a gentle reminder. Cold leads get a fresh offer. No spam — smart re-engagement.
                          </div>
                        </div>
                      </>
                    )}

                    <div className="btn-row">
                      <button className="sec-btn" onClick={()=>setStep(3)}>← Back</button>
                      <button className="pri-btn" onClick={()=>setStep(5)}>Next →</button>
                    </div>
                  </div>
                )}

                {/* STEP 5 — Review & Launch */}
                {step===5 && (
                  <div className="bc">
                    <div className="bc-title">Review & Launch</div>
                    <div className="bc-sub">Check everything below then launch your campaign</div>

                    {recipientCount>0 && (
                      <div className="forecast">
                        <div style={{fontSize:11,letterSpacing:"1.2px",textTransform:"uppercase",color:`${accent}99`,fontWeight:700,marginBottom:10}}>⬡ Revenue Forecast</div>
                        <div className="forecast-row">
                          <div style={{textAlign:"center"}}><div className="fcast-val" style={{color:accent}}>{recipientCount}</div><div className="fcast-label">Recipients</div></div>
                          <div style={{textAlign:"center"}}><div className="fcast-val" style={{color:"#7c3aed"}}>~{estimatedBookings}</div><div className="fcast-label">Est. Bookings</div></div>
                          <div style={{textAlign:"center"}}><div className="fcast-val" style={{color:accent}}>₹{estimatedRevenue.toLocaleString()}</div><div className="fcast-label">Est. Revenue</div></div>
                        </div>
                        <div style={{fontSize:11,color:t.textFaint,marginTop:10}}>* Based on 14% avg booking rate · ₹600 avg booking value from past campaigns</div>
                      </div>
                    )}

                    <div style={{marginBottom:18}}>
                      {[
                        {label:"Campaign Name",val:bName},
                        {label:"Goal",val:bGoal},
                        {label:"Recipients",val:bRecipientMode==="crm"?`${CRM_SEGMENTS.find(s=>s.id===bSelectedSegment)?.label} (${recipientCount} people)`:bRecipientMode==="csv"?`CSV: ${bCsvFileName} (120 people)`:`Manual (${recipientCount} numbers)`},
                        {label:"Schedule",val:bScheduleMode==="now"?"Send immediately":`${bScheduleDate} at ${bScheduleTime}`},
                        {label:"Smart Follow-ups",val:bFollowUp?`Warm after ${bWarmDays}d · Cold after ${bColdDays}d`:"Disabled"},
                      ].map(r=>(
                        <div key={r.label} className="review-row">
                          <span style={{color:t.textMuted}}>{r.label}</span>
                          <span style={{fontWeight:600,color:t.text}}>{r.val}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{marginBottom:18}}>
                      <div style={{fontSize:12,color:t.textMuted,marginBottom:8,fontWeight:600}}>Message Preview</div>
                      <div className="msg-preview">{bMessage.replace("[Name]","Priya").replace("[BOOKING LINK]","fastrill.com/book")}</div>
                    </div>

                    <div className="btn-row">
                      <button className="sec-btn" onClick={()=>setStep(4)}>← Back</button>
                      <button className="sec-btn" onClick={()=>{
                        setCampaigns(p=>[{id:Date.now(),name:bName,status:"draft",goal:bGoal,recipients:recipientCount,sentAt:"—",scheduledFor:null,sent:0,delivered:0,opened:0,replied:0,booked:0,revenue:0,followUpSent:0,followUpReplied:0,message:bMessage},...p])
                        setView("list"); resetBuilder()
                      }}>Save Draft</button>
                      <button className="launch-btn" onClick={()=>{
                        const isScheduled = bScheduleMode==="schedule"
                        setCampaigns(p=>[{id:Date.now(),name:bName,status:isScheduled?"scheduled":"active",goal:bGoal,recipients:recipientCount,sentAt:isScheduled?"—":"Now",scheduledFor:isScheduled?`${bScheduleDate} at ${bScheduleTime}`:null,sent:0,delivered:0,opened:0,replied:0,booked:0,revenue:0,followUpSent:0,followUpReplied:0,message:bMessage},...p])
                        setView("list"); resetBuilder()
                      }}>🚀 {bScheduleMode==="now"?"Launch Now":"Schedule Campaign"}</button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}
