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

const MOCK_CUSTOMERS = [
  { id:1, name:"Priya Sharma", phone:"+91 98765 43210", gender:"female", visits:12, totalSpend:8400, lastVisit:"Mar 5, 2026", daysSince:3, tags:["VIP","Regular"], source:"WhatsApp", joinedAt:"Jan 2024", campaigns:3, booked:true,
    history:[
      {date:"Mar 5, 2026", service:"Hair Spa + Blowdry", amount:1200, staff:"Anita"},
      {date:"Feb 18, 2026", service:"Facial + Cleanup", amount:800, staff:"Meena"},
      {date:"Feb 1, 2026", service:"Manicure + Pedicure", amount:650, staff:"Anita"},
      {date:"Jan 12, 2026", service:"Hair Color (Global)", amount:2800, staff:"Ravi"},
    ]
  },
  { id:2, name:"Rahul Verma", phone:"+91 87654 32109", gender:"male", visits:5, totalSpend:2250, lastVisit:"Jan 20, 2026", daysSince:47, tags:["Regular"], source:"Referral", joinedAt:"Aug 2024", campaigns:1, booked:true,
    history:[
      {date:"Jan 20, 2026", service:"Men's Haircut + Beard", amount:350, staff:"Ravi"},
      {date:"Dec 10, 2025", service:"Men's Haircut", amount:150, staff:"Ravi"},
      {date:"Nov 5, 2025", service:"Hair Color (Highlights)", amount:1400, staff:"Anita"},
    ]
  },
  { id:3, name:"Sneha Patel", phone:"+91 76543 21098", gender:"female", visits:0, totalSpend:0, lastVisit:"Never", daysSince:999, tags:["New Lead"], source:"Instagram", joinedAt:"Mar 1, 2026", campaigns:0, booked:false,
    history:[]
  },
  { id:4, name:"Divya Nair", phone:"+91 65432 10987", gender:"female", visits:8, totalSpend:12400, lastVisit:"Dec 28, 2025", daysSince:70, tags:["VIP","Inactive"], source:"WhatsApp", joinedAt:"Mar 2023", campaigns:4, booked:true,
    history:[
      {date:"Dec 28, 2025", service:"Bridal Makeup Trial", amount:3500, staff:"Meena"},
      {date:"Nov 15, 2025", service:"Hair Spa + Keratin", amount:4200, staff:"Anita"},
      {date:"Oct 3, 2025", service:"Facial + D-tan", amount:1100, staff:"Meena"},
    ]
  },
  { id:5, name:"Arjun Mehta", phone:"+91 54321 09876", gender:"male", visits:2, totalSpend:900, lastVisit:"Feb 28, 2026", daysSince:8, tags:["Regular"], source:"WhatsApp", joinedAt:"Nov 2024", campaigns:1, booked:true,
    history:[
      {date:"Feb 28, 2026", service:"Men's Haircut", amount:150, staff:"Ravi"},
      {date:"Jan 14, 2026", service:"Men's Haircut + Beard + Hair Color", amount:750, staff:"Ravi"},
    ]
  },
  { id:6, name:"Kavya Reddy", phone:"+91 43210 98765", gender:"female", visits:0, totalSpend:0, lastVisit:"Never", daysSince:999, tags:["New Lead"], source:"Campaign", joinedAt:"Feb 20, 2026", campaigns:1, booked:false,
    history:[]
  },
  { id:7, name:"Sunita Krishnan", phone:"+91 32109 87654", gender:"female", visits:19, totalSpend:22600, lastVisit:"Mar 3, 2026", daysSince:5, tags:["VIP","Regular"], source:"Referral", joinedAt:"Jun 2022", campaigns:6, booked:true,
    history:[
      {date:"Mar 3, 2026", service:"Hair Color + Cut + Blow-dry", amount:3200, staff:"Anita"},
      {date:"Feb 10, 2026", service:"Facial + Cleanup + Threading", amount:950, staff:"Meena"},
      {date:"Jan 20, 2026", service:"Manicure + Pedicure + Nail Art", amount:1200, staff:"Meena"},
    ]
  },
  { id:8, name:"Kiran Singh", phone:"+91 21098 76543", gender:"male", visits:3, totalSpend:1100, lastVisit:"Oct 15, 2025", daysSince:144, tags:["Inactive"], source:"WhatsApp", joinedAt:"Jul 2024", campaigns:2, booked:true,
    history:[
      {date:"Oct 15, 2025", service:"Men's Haircut + Beard", amount:350, staff:"Ravi"},
      {date:"Aug 2, 2025", service:"Hair Color (Global)", amount:600, staff:"Ravi"},
    ]
  },
  { id:9, name:"Meera Iyer", phone:"+91 10987 65432", gender:"female", visits:6, totalSpend:5600, lastVisit:"Mar 7, 2026", daysSince:1, tags:["VIP","Regular"], source:"WhatsApp", joinedAt:"Apr 2024", campaigns:2, booked:true,
    history:[
      {date:"Mar 7, 2026", service:"Hair Spa + Blowdry + Facial", amount:1800, staff:"Anita"},
      {date:"Feb 14, 2026", service:"Bridal Makeup (Friend's)", amount:2500, staff:"Meena"},
    ]
  },
  { id:10, name:"Ravi Kumar", phone:"+91 90876 54321", gender:"male", visits:0, totalSpend:0, lastVisit:"Never", daysSince:999, tags:["New Lead"], source:"Instagram", joinedAt:"Mar 6, 2026", campaigns:0, booked:false,
    history:[]
  },
]

const FILTERS = [
  { id:"all", label:"All Customers", icon:"👥" },
  { id:"vip", label:"VIP", icon:"⭐" },
  { id:"inactive", label:"Inactive (60+ days)", icon:"😴" },
  { id:"new", label:"New Leads", icon:"🌱" },
  { id:"female", label:"Female", icon:"👩" },
  { id:"male", label:"Male", icon:"👨" },
]

const TAG_COLORS = {
  VIP: { bg:"rgba(245,158,11,0.1)", border:"rgba(245,158,11,0.25)", text:"#f59e0b" },
  Regular: { bg:"rgba(14,165,233,0.08)", border:"rgba(14,165,233,0.2)", text:"#0ea5e9" },
  Inactive: { bg:"rgba(239,68,68,0.08)", border:"rgba(239,68,68,0.18)", text:"#ef4444" },
  "New Lead": { bg:"rgba(124,58,237,0.08)", border:"rgba(124,58,237,0.2)", text:"#7c3aed" },
}

export default function CustomersPage() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [dark, setDark] = useState(true)
  const [view, setView] = useState("list") // list | profile | add | import
  const [activeFilter, setActiveFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [customers, setCustomers] = useState(MOCK_CUSTOMERS)
  const [selected, setSelected] = useState(null)
  const [sortBy, setSortBy] = useState("spend") // spend | visits | recent | name

  // Add form
  const [addName, setAddName] = useState("")
  const [addPhone, setAddPhone] = useState("")
  const [addGender, setAddGender] = useState("female")
  const [addSource, setAddSource] = useState("WhatsApp")
  const [addSaved, setAddSaved] = useState(false)

  // Import
  const [importFile, setImportFile] = useState("")
  const [importStep, setImportStep] = useState(1)

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

  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
    if (!matchSearch) return false
    if (activeFilter === "all") return true
    if (activeFilter === "vip") return c.tags.includes("VIP")
    if (activeFilter === "inactive") return c.daysSince >= 60 && c.booked
    if (activeFilter === "new") return !c.booked
    if (activeFilter === "female") return c.gender === "female"
    if (activeFilter === "male") return c.gender === "male"
    return true
  }).sort((a, b) => {
    if (sortBy === "spend") return b.totalSpend - a.totalSpend
    if (sortBy === "visits") return b.visits - a.visits
    if (sortBy === "recent") return a.daysSince - b.daysSince
    if (sortBy === "name") return a.name.localeCompare(b.name)
    return 0
  })

  const stats = {
    total: customers.length,
    vip: customers.filter(c=>c.tags.includes("VIP")).length,
    inactive: customers.filter(c=>c.daysSince>=60&&c.booked).length,
    newLeads: customers.filter(c=>!c.booked).length,
    totalRevenue: customers.reduce((s,c)=>s+c.totalSpend,0),
    avgLTV: Math.round(customers.filter(c=>c.booked).reduce((s,c)=>s+c.totalSpend,0)/customers.filter(c=>c.booked).length),
  }

  const t = dark ? {
    bg:"#0a0a0f", sidebar:"#0f0f17", border:"rgba(255,255,255,0.06)", card:"#0f0f17",
    cardBorder:"rgba(255,255,255,0.07)", text:"#e8e8f0", textMuted:"rgba(255,255,255,0.4)",
    textFaint:"rgba(255,255,255,0.2)", navActive:"rgba(0,196,125,0.1)",
    navActiveBorder:"rgba(0,196,125,0.2)", navActiveText:"#00c47d",
    navText:"rgba(255,255,255,0.45)", inputBg:"rgba(255,255,255,0.04)",
    chipBg:"rgba(255,255,255,0.02)", chipBorder:"rgba(255,255,255,0.05)",
    rowHover:"rgba(255,255,255,0.02)",
  } : {
    bg:"#f4f5f7", sidebar:"#ffffff", border:"rgba(0,0,0,0.07)", card:"#ffffff",
    cardBorder:"rgba(0,0,0,0.08)", text:"#111827", textMuted:"rgba(0,0,0,0.45)",
    textFaint:"rgba(0,0,0,0.25)", navActive:"rgba(0,180,115,0.08)",
    navActiveBorder:"rgba(0,180,115,0.2)", navActiveText:"#00935a",
    navText:"rgba(0,0,0,0.45)", inputBg:"rgba(0,0,0,0.03)",
    chipBg:"rgba(0,0,0,0.02)", chipBorder:"rgba(0,0,0,0.05)",
    rowHover:"rgba(0,0,0,0.02)",
  }
  const accent = dark ? "#00c47d" : "#00935a"
  const userInitial = userEmail ? userEmail[0].toUpperCase() : "G"
  const inp = {background:t.inputBg,border:`1px solid ${t.cardBorder}`,borderRadius:9,padding:"9px 12px",fontSize:13,color:t.text,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none",width:"100%"}

  const avatarColor = (name) => {
    const colors = ["#00c47d","#0ea5e9","#7c3aed","#f59e0b","#ef4444","#10b981","#f97316"]
    return colors[name.charCodeAt(0) % colors.length]
  }

  const AvatarEl = ({name, size=36}) => (
    <div style={{width:size,height:size,borderRadius:10,background:`${avatarColor(name)}18`,border:`1.5px solid ${avatarColor(name)}30`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:size*0.38,color:avatarColor(name),flexShrink:0,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      {name.split(" ").map(w=>w[0]).join("").slice(0,2)}
    </div>
  )

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
        .topbar-right{display:flex;align-items:center;gap:9px;}
        .theme-btn{display:flex;align-items:center;gap:7px;padding:5px 11px;border-radius:8px;background:${t.inputBg};border:1px solid ${t.cardBorder};cursor:pointer;font-size:12px;color:${t.textMuted};font-family:'Plus Jakarta Sans',sans-serif;font-weight:500;}
        .pill{width:32px;height:18px;border-radius:100px;background:${dark?accent:"#d1d5db"};position:relative;flex-shrink:0;}
        .pill::after{content:'';position:absolute;top:2px;width:14px;height:14px;border-radius:50%;background:#fff;left:${dark?"16px":"2px"};}
        .back-btn{display:flex;align-items:center;gap:6px;padding:6px 13px;border-radius:8px;background:${t.inputBg};border:1px solid ${t.cardBorder};color:${t.textMuted};font-size:12.5px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .act-btn{display:inline-flex;align-items:center;gap:7px;padding:7px 16px;border-radius:9px;border:1px solid ${t.cardBorder};background:${t.inputBg};color:${t.textMuted};font-weight:600;font-size:12.5px;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.13s;}
        .act-btn:hover{border-color:${accent}33;color:${t.text};}
        .pri-btn{display:inline-flex;align-items:center;gap:7px;padding:8px 18px;border-radius:9px;background:${accent};border:none;color:#000;font-weight:700;font-size:12.5px;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.15s;}
        .pri-btn:hover{transform:translateY(-1px);box-shadow:0 4px 14px ${accent}44;}
        .content{flex:1;overflow:hidden;display:flex;}

        /* Split layout */
        .list-panel{width:100%;display:flex;flex-direction:column;overflow:hidden;border-right:1px solid ${t.border};}
        .list-panel.has-profile{width:420px;flex-shrink:0;}
        .profile-panel{flex:1;overflow-y:auto;background:${t.bg};}
        .profile-panel::-webkit-scrollbar{width:4px;}
        .profile-panel::-webkit-scrollbar-thumb{background:${t.border};}

        /* Stats bar */
        .stats-bar{display:flex;gap:0;border-bottom:1px solid ${t.border};background:${t.sidebar};}
        .stat-item{flex:1;padding:14px 18px;border-right:1px solid ${t.border};}
        .stat-item:last-child{border-right:none;}
        .si-val{font-weight:800;font-size:20px;letter-spacing:-0.5px;}
        .si-label{font-size:10.5px;color:${t.textMuted};margin-top:2px;text-transform:uppercase;letter-spacing:0.8px;font-weight:500;}

        /* Toolbar */
        .toolbar{padding:12px 16px;border-bottom:1px solid ${t.border};display:flex;align-items:center;gap:9px;background:${t.sidebar};}
        .search-wrap{flex:1;position:relative;}
        .search-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:13px;color:${t.textFaint};}
        .search-inp{width:100%;padding:7px 10px 7px 30px;border-radius:8px;background:${t.inputBg};border:1px solid ${t.cardBorder};font-size:13px;color:${t.text};outline:none;font-family:'Plus Jakarta Sans',sans-serif;}
        .sort-sel{padding:7px 11px;border-radius:8px;background:${t.inputBg};border:1px solid ${t.cardBorder};font-size:12.5px;color:${t.textMuted};outline:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}

        /* Filters */
        .filters{display:flex;gap:4px;padding:10px 14px;border-bottom:1px solid ${t.border};overflow-x:auto;flex-shrink:0;}
        .filters::-webkit-scrollbar{display:none;}
        .ftab{display:flex;align-items:center;gap:5px;padding:5px 12px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid ${t.cardBorder};background:transparent;color:${t.textMuted};white-space:nowrap;transition:all 0.12s;font-family:'Plus Jakarta Sans',sans-serif;}
        .ftab.active{background:${accent}15;border-color:${accent}40;color:${accent};}
        .ftab-count{font-size:10px;padding:1px 6px;border-radius:100px;background:${t.inputBg};color:${t.textFaint};}
        .ftab.active .ftab-count{background:${accent}20;color:${accent};}

        /* Customer list */
        .cust-list{flex:1;overflow-y:auto;}
        .cust-list::-webkit-scrollbar{width:4px;}
        .cust-list::-webkit-scrollbar-thumb{background:${t.border};}
        .cust-row{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid ${t.border};cursor:pointer;transition:background 0.12s;}
        .cust-row:hover{background:${t.rowHover};}
        .cust-row.active{background:${accent}06;border-right:2px solid ${accent};}
        .cust-info{flex:1;min-width:0;}
        .cust-name{font-weight:700;font-size:13.5px;color:${t.text};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .cust-phone{font-size:11.5px;color:${t.textMuted};margin-top:1px;}
        .cust-tags{display:flex;gap:4px;margin-top:5px;flex-wrap:wrap;}
        .ctag{display:inline-flex;padding:1px 7px;border-radius:100px;font-size:10px;font-weight:700;}
        .cust-right{text-align:right;flex-shrink:0;}
        .cust-spend{font-weight:800;font-size:14px;color:${t.text};}
        .cust-visits{font-size:11px;color:${t.textMuted};margin-top:2px;}
        .cust-days{font-size:11px;margin-top:3px;font-weight:600;}

        /* Profile */
        .profile-inner{padding:22px 24px;}
        .prof-header{display:flex;align-items:flex-start;gap:14px;margin-bottom:20px;}
        .prof-info{flex:1;}
        .prof-name{font-weight:800;font-size:20px;color:${t.text};letter-spacing:-0.3px;margin-bottom:4px;}
        .prof-phone{font-size:13px;color:${t.textMuted};margin-bottom:8px;}
        .prof-tags{display:flex;gap:6px;flex-wrap:wrap;}
        .prof-actions{display:flex;gap:8px;margin-top:14px;}
        .prof-action-btn{padding:7px 14px;border-radius:8px;font-size:12.5px;font-weight:600;cursor:pointer;border:1px solid ${t.cardBorder};background:${t.inputBg};color:${t.textMuted};font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.13s;}
        .prof-action-btn:hover{border-color:${accent}33;color:${accent};}
        .prof-action-btn.primary{background:${accent};border-color:${accent};color:#000;}

        /* KPI row */
        .kpi-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px;}
        .kpi-card{background:${t.card};border:1px solid ${t.cardBorder};border-radius:11px;padding:13px 15px;}
        .kpi-val{font-weight:800;font-size:20px;letter-spacing:-0.5px;}
        .kpi-label{font-size:10.5px;color:${t.textMuted};margin-top:2px;text-transform:uppercase;letter-spacing:0.7px;}

        /* Section */
        .sect{background:${t.card};border:1px solid ${t.cardBorder};border-radius:13px;padding:16px 18px;margin-bottom:14px;}
        .sect-title{font-weight:700;font-size:13px;color:${t.text};margin-bottom:12px;display:flex;align-items:center;gap:7px;}
        .hist-row{display:flex;align-items:flex-start;gap:12px;padding:9px 0;border-bottom:1px solid ${t.border};}
        .hist-row:last-child{border-bottom:none;padding-bottom:0;}
        .hist-dot{width:8px;height:8px;border-radius:50%;background:${accent};margin-top:5px;flex-shrink:0;}
        .hist-service{font-size:13px;font-weight:600;color:${t.text};}
        .hist-meta{font-size:11.5px;color:${t.textMuted};margin-top:2px;}
        .hist-amount{font-weight:700;font-size:13px;color:${accent};margin-left:auto;flex-shrink:0;}

        /* Empty */
        .empty{padding:40px 24px;text-align:center;}
        .empty-icon{font-size:36px;margin-bottom:10px;opacity:0.3;}
        .empty-text{font-size:13px;color:${t.textMuted};}

        /* Add / Import forms */
        .form-wrap{max-width:520px;padding:24px;}
        .fw{margin-bottom:14px;}
        .flabel{font-size:11.5px;font-weight:600;color:${t.textMuted};margin-bottom:5px;display:block;}
        .gender-row{display:flex;gap:8px;}
        .gender-opt{flex:1;padding:10px;border-radius:9px;border:1px solid ${t.cardBorder};background:${t.inputBg};text-align:center;cursor:pointer;transition:all 0.13s;font-size:13px;font-weight:600;color:${t.textMuted};font-family:'Plus Jakarta Sans',sans-serif;}
        .gender-opt.active{background:${accent}10;border-color:${accent}33;color:${accent};}
        .source-row{display:flex;gap:8px;flex-wrap:wrap;}
        .src-btn{padding:6px 14px;border-radius:8px;border:1px solid ${t.cardBorder};background:${t.inputBg};font-size:12px;font-weight:600;color:${t.textMuted};cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.13s;}
        .src-btn.active{background:${accent}10;border-color:${accent}33;color:${accent};}
        .success-banner{display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:10px;background:${accent}10;border:1px solid ${accent}25;margin-bottom:16px;}
        .import-drop{border:2px dashed ${t.cardBorder};border-radius:13px;padding:36px 24px;text-align:center;cursor:pointer;transition:all 0.15s;margin-bottom:16px;}
        .import-drop:hover{border-color:${accent}44;}
        .col-map{background:${t.inputBg};border:1px solid ${t.cardBorder};border-radius:10px;overflow:hidden;margin-bottom:14px;}
        .col-row{display:flex;align-items:center;gap:12px;padding:9px 14px;border-bottom:1px solid ${t.border};font-size:12.5px;}
        .col-row:last-child{border-bottom:none;}
        .col-field{color:${t.textMuted};width:120px;flex-shrink:0;}
        .col-arrow{color:${t.textFaint};}
        .col-csv{font-weight:600;color:${t.text};}
        .col-check{color:${accent};font-size:14px;}
        .btn-row{display:flex;gap:9px;justify-content:flex-end;margin-top:18px;}
        .sec-btn{padding:9px 20px;border-radius:9px;background:${t.inputBg};border:1px solid ${t.cardBorder};color:${t.textMuted};font-size:13px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}

        @media(max-width:900px){.list-panel.has-profile{width:100%;}.profile-panel{display:none;}}
      `}</style>

      <div className="root">
        <aside className="sidebar">
          <a href="/dashboard" className="logo">fast<span>rill</span></a>
          <div className="nav-section">Platform</div>
          {NAV.map(item=>(
            <button key={item.id} className={`nav-item${item.id==="contacts"?" active":""}`} onClick={()=>router.push(item.path)}>
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
              {(view==="add"||view==="import") && <button className="back-btn" onClick={()=>setView("list")}>← Back</button>}
              <div className="topbar-title">
                {view==="list"?"Customers":view==="add"?"Add Customer":view==="import"?"Import CSV":"Customers"}
              </div>
            </div>
            <div className="topbar-right">
              <button className="theme-btn" onClick={toggleTheme}>
                <span>{dark?"🌙":"☀️"}</span><div className="pill"/><span>{dark?"Dark":"Light"}</span>
              </button>
              {view==="list" && (
                <>
                  <button className="act-btn" onClick={()=>{setView("import");setImportStep(1);setImportFile("")}}>📁 Import CSV</button>
                  <button className="pri-btn" onClick={()=>{setView("add");setAddSaved(false);setAddName("");setAddPhone("")}}>+ Add Customer</button>
                </>
              )}
            </div>
          </div>

          {/* ══ LIST VIEW ══ */}
          {(view==="list"||view==="profile") && (
            <div className="content">
              <div className={`list-panel${selected?" has-profile":""}`}>

                {/* Stats bar */}
                <div className="stats-bar">
                  {[
                    {val:stats.total,label:"Total Customers",color:t.text},
                    {val:stats.vip,label:"VIP",color:"#f59e0b"},
                    {val:stats.inactive,label:"Inactive",color:"#ef4444"},
                    {val:stats.newLeads,label:"New Leads",color:"#7c3aed"},
                    {val:`₹${stats.avgLTV.toLocaleString()}`,label:"Avg Customer LTV",color:accent},
                  ].map(s=>(
                    <div key={s.label} className="stat-item">
                      <div className="si-val" style={{color:s.color}}>{s.val}</div>
                      <div className="si-label">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Toolbar */}
                <div className="toolbar">
                  <div className="search-wrap">
                    <span className="search-icon">🔍</span>
                    <input className="search-inp" placeholder="Search by name or phone..." value={search} onChange={e=>setSearch(e.target.value)}/>
                  </div>
                  <select className="sort-sel" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                    <option value="spend">Sort: Highest Spend</option>
                    <option value="visits">Sort: Most Visits</option>
                    <option value="recent">Sort: Most Recent</option>
                    <option value="name">Sort: Name A–Z</option>
                  </select>
                </div>

                {/* Filters */}
                <div className="filters">
                  {FILTERS.map(f=>{
                    const count = f.id==="all"?customers.length
                      :f.id==="vip"?customers.filter(c=>c.tags.includes("VIP")).length
                      :f.id==="inactive"?customers.filter(c=>c.daysSince>=60&&c.booked).length
                      :f.id==="new"?customers.filter(c=>!c.booked).length
                      :f.id==="female"?customers.filter(c=>c.gender==="female").length
                      :customers.filter(c=>c.gender==="male").length
                    return (
                      <button key={f.id} className={`ftab${activeFilter===f.id?" active":""}`} onClick={()=>setActiveFilter(f.id)}>
                        <span>{f.icon}</span> {f.label} <span className="ftab-count">{count}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Customer rows */}
                <div className="cust-list">
                  {filtered.length === 0 ? (
                    <div className="empty">
                      <div className="empty-icon">👥</div>
                      <div className="empty-text">No customers found</div>
                    </div>
                  ) : filtered.map(c=>(
                    <div key={c.id} className={`cust-row${selected?.id===c.id?" active":""}`} onClick={()=>setSelected(c)}>
                      <AvatarEl name={c.name}/>
                      <div className="cust-info">
                        <div className="cust-name">{c.name}</div>
                        <div className="cust-phone">{c.phone}</div>
                        <div className="cust-tags">
                          {c.tags.map(tag=>(
                            <span key={tag} className="ctag" style={{background:TAG_COLORS[tag]?.bg,border:`1px solid ${TAG_COLORS[tag]?.border}`,color:TAG_COLORS[tag]?.text}}>{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div className="cust-right">
                        <div className="cust-spend" style={{color:c.totalSpend>5000?accent:t.text}}>
                          {c.totalSpend>0?`₹${c.totalSpend.toLocaleString()}`:"—"}
                        </div>
                        <div className="cust-visits">{c.visits>0?`${c.visits} visits`:"Never visited"}</div>
                        <div className="cust-days" style={{color:c.daysSince>=60&&c.booked?"#ef4444":c.daysSince<=7&&c.booked?accent:t.textFaint}}>
                          {c.booked
                            ? c.daysSince<=1 ? "Today" : c.daysSince<=7 ? `${c.daysSince}d ago` : c.daysSince>=60 ? `${c.daysSince}d inactive` : `${c.daysSince}d ago`
                            : "Lead"}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Bottom add nudge */}
                  <div style={{padding:"16px",textAlign:"center",borderTop:`1px solid ${t.border}`}}>
                    <div style={{fontSize:12,color:t.textFaint,marginBottom:8}}>Missing a customer?</div>
                    <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                      <button className="act-btn" style={{fontSize:12,padding:"5px 12px"}} onClick={()=>setView("add")}>+ Add manually</button>
                      <button className="act-btn" style={{fontSize:12,padding:"5px 12px"}} onClick={()=>setView("import")}>📁 Import CSV</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile panel */}
              {selected && (
                <div className="profile-panel">
                  <div className="profile-inner">

                    {/* Header */}
                    <div className="prof-header">
                      <AvatarEl name={selected.name} size={54}/>
                      <div className="prof-info">
                        <div className="prof-name">{selected.name}</div>
                        <div className="prof-phone">{selected.phone} · {selected.gender==="female"?"👩 Female":"👨 Male"}</div>
                        <div className="prof-tags">
                          {selected.tags.map(tag=>(
                            <span key={tag} style={{display:"inline-flex",padding:"2px 9px",borderRadius:100,background:TAG_COLORS[tag]?.bg,border:`1px solid ${TAG_COLORS[tag]?.border}`,color:TAG_COLORS[tag]?.text,fontSize:11,fontWeight:700}}>{tag}</span>
                          ))}
                        </div>
                        <div style={{fontSize:11.5,color:t.textFaint,marginTop:6}}>
                          Source: {selected.source} · Joined {selected.joinedAt}
                        </div>
                      </div>
                      <button style={{background:"none",border:"none",color:t.textFaint,cursor:"pointer",fontSize:18,padding:4}} onClick={()=>setSelected(null)}>✕</button>
                    </div>

                    {/* Action buttons */}
                    <div className="prof-actions" style={{marginBottom:20}}>
                      <button className="prof-action-btn primary" onClick={()=>router.push("/dashboard/conversations")}>💬 Message</button>
                      <button className="prof-action-btn" onClick={()=>router.push("/dashboard/campaigns")}>📢 Add to Campaign</button>
                      <button className="prof-action-btn" onClick={()=>router.push("/dashboard/bookings")}>📅 Book Appointment</button>
                    </div>

                    {/* KPIs */}
                    <div className="kpi-row">
                      {[
                        {label:"Total Spend",val:`₹${selected.totalSpend.toLocaleString()}`,color:accent},
                        {label:"Total Visits",val:selected.visits,color:"#0ea5e9"},
                        {label:"Campaigns Sent",val:selected.campaigns,color:"#7c3aed"},
                      ].map(k=>(
                        <div key={k.label} className="kpi-card">
                          <div className="kpi-val" style={{color:k.color}}>{k.val}</div>
                          <div className="kpi-label">{k.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Last visit + inactivity alert */}
                    {selected.booked && selected.daysSince >= 60 && (
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderRadius:11,background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.16)",marginBottom:14}}>
                        <div>
                          <div style={{fontWeight:700,fontSize:13,color:"#ef4444"}}>⚠️ Inactive for {selected.daysSince} days</div>
                          <div style={{fontSize:12,color:t.textMuted,marginTop:2}}>Last visited {selected.lastVisit}. High re-engagement potential.</div>
                        </div>
                        <button className="pri-btn" style={{fontSize:12,padding:"6px 14px"}} onClick={()=>router.push("/dashboard/campaigns")}>Re-engage →</button>
                      </div>
                    )}

                    {!selected.booked && (
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderRadius:11,background:"rgba(124,58,237,0.06)",border:"1px solid rgba(124,58,237,0.16)",marginBottom:14}}>
                        <div>
                          <div style={{fontWeight:700,fontSize:13,color:"#7c3aed"}}>🌱 Never booked yet</div>
                          <div style={{fontSize:12,color:t.textMuted,marginTop:2}}>Lead from {selected.source}. AI can convert them with a direct message.</div>
                        </div>
                        <button className="pri-btn" style={{fontSize:12,padding:"6px 14px"}} onClick={()=>router.push("/dashboard/conversations")}>Start Chat →</button>
                      </div>
                    )}

                    {/* Visit History */}
                    <div className="sect">
                      <div className="sect-title">
                        <span style={{color:accent}}>◷</span> Visit History
                        <span style={{fontSize:11,color:t.textFaint,fontWeight:400,marginLeft:"auto"}}>{selected.visits} visits · ₹{selected.totalSpend.toLocaleString()} total</span>
                      </div>
                      {selected.history.length > 0 ? selected.history.map((h, i)=>(
                        <div key={i} className="hist-row">
                          <div className="hist-dot"/>
                          <div style={{flex:1}}>
                            <div className="hist-service">{h.service}</div>
                            <div className="hist-meta">{h.date} · {h.staff}</div>
                          </div>
                          <div className="hist-amount">₹{h.amount.toLocaleString()}</div>
                        </div>
                      )) : (
                        <div style={{fontSize:13,color:t.textFaint,textAlign:"center",padding:"16px 0"}}>No visits yet — this is a new lead</div>
                      )}
                    </div>

                    {/* Notes */}
                    <div className="sect">
                      <div className="sect-title"><span style={{color:"#7c3aed"}}>◌</span> Notes</div>
                      <textarea style={{...inp,resize:"vertical",minHeight:70,fontSize:12.5,lineHeight:1.6}} placeholder="Add a private note about this customer (allergies, preferences, birthday, etc.)..."/>
                    </div>

                    {/* Danger */}
                    <div style={{display:"flex",justifyContent:"flex-end"}}>
                      <button style={{padding:"6px 14px",borderRadius:8,background:"transparent",border:`1px solid rgba(239,68,68,0.2)`,color:"#ef4444",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}
                        onClick={()=>{setCustomers(p=>p.filter(c=>c.id!==selected.id));setSelected(null)}}>
                        Delete Customer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ ADD CUSTOMER ══ */}
          {view==="add" && (
            <div style={{flex:1,overflowY:"auto",background:t.bg}}>
              <div className="form-wrap">
                {addSaved && (
                  <div className="success-banner">
                    <span style={{fontSize:18}}>✅</span>
                    <div style={{fontSize:13,fontWeight:600,color:accent}}>Customer added successfully!</div>
                  </div>
                )}
                <div className="fw">
                  <label className="flabel">Full Name</label>
                  <input style={inp} value={addName} onChange={e=>setAddName(e.target.value)} placeholder="e.g. Priya Sharma"/>
                </div>
                <div className="fw">
                  <label className="flabel">WhatsApp Number</label>
                  <input style={inp} value={addPhone} onChange={e=>setAddPhone(e.target.value)} placeholder="+91 98765 43210"/>
                  <div style={{fontSize:11,color:t.textFaint,marginTop:4}}>Include country code. This is the number Fastrill AI will use to message them.</div>
                </div>
                <div className="fw">
                  <label className="flabel">Gender</label>
                  <div className="gender-row">
                    {["female","male","other"].map(g=>(
                      <button key={g} className={`gender-opt${addGender===g?" active":""}`} onClick={()=>setAddGender(g)}>
                        {g==="female"?"👩 Female":g==="male"?"👨 Male":"⚧ Other"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="fw">
                  <label className="flabel">How did they find you?</label>
                  <div className="source-row">
                    {["WhatsApp","Instagram","Referral","Walk-in","Campaign","Google"].map(s=>(
                      <button key={s} className={`src-btn${addSource===s?" active":""}`} onClick={()=>setAddSource(s)}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="btn-row">
                  <button className="sec-btn" onClick={()=>setView("list")}>Cancel</button>
                  <button className="pri-btn" disabled={!addName||!addPhone} onClick={()=>{
                    const newC = {
                      id:Date.now(), name:addName, phone:addPhone, gender:addGender,
                      visits:0, totalSpend:0, lastVisit:"Never", daysSince:999,
                      tags:["New Lead"], source:addSource, joinedAt:"Mar 2026",
                      campaigns:0, booked:false, history:[]
                    }
                    setCustomers(p=>[newC,...p])
                    setAddSaved(true); setAddName(""); setAddPhone("")
                  }}>Save Customer</button>
                </div>
              </div>
            </div>
          )}

          {/* ══ IMPORT CSV ══ */}
          {view==="import" && (
            <div style={{flex:1,overflowY:"auto",background:t.bg}}>
              <div className="form-wrap">
                <div style={{fontSize:12.5,color:t.textMuted,marginBottom:20,lineHeight:1.65}}>
                  Import your existing customer list from Google Contacts, Excel, or any other tool. We'll map the columns automatically.
                </div>

                {importStep===1 && (
                  <>
                    <div className="import-drop" onClick={()=>{setImportFile("customers_export.csv");setImportStep(2)}}>
                      {importFile ? (
                        <>
                          <div style={{fontSize:24,marginBottom:8}}>✅</div>
                          <div style={{fontWeight:700,fontSize:13,color:t.text}}>{importFile}</div>
                          <div style={{fontSize:12,color:t.textMuted,marginTop:3}}>Ready to process</div>
                        </>
                      ) : (
                        <>
                          <div style={{fontSize:32,opacity:0.25,marginBottom:10}}>📁</div>
                          <div style={{fontWeight:700,fontSize:14,color:t.text,marginBottom:4}}>Click to upload your CSV file</div>
                          <div style={{fontSize:12.5,color:t.textMuted}}>Or drag and drop here</div>
                          <div style={{fontSize:11,color:t.textFaint,marginTop:10}}>Supports CSV, XLS, XLSX · Max 10,000 rows</div>
                        </>
                      )}
                    </div>

                    <div style={{background:t.inputBg,border:`1px solid ${t.cardBorder}`,borderRadius:10,padding:"14px 16px",marginBottom:16}}>
                      <div style={{fontSize:12,fontWeight:700,color:t.text,marginBottom:8}}>📋 Required columns in your file:</div>
                      {[{col:"Name",desc:"Customer full name"},{col:"Phone",desc:"WhatsApp number with country code (+91...)"}].map(r=>(
                        <div key={r.col} style={{display:"flex",gap:10,fontSize:12,marginBottom:4}}>
                          <span style={{color:accent,fontWeight:700,width:50}}>{r.col}</span>
                          <span style={{color:t.textMuted}}>{r.desc}</span>
                        </div>
                      ))}
                      <div style={{fontSize:11.5,color:t.textFaint,marginTop:8}}>Optional: Gender, Email, Source, Notes</div>
                    </div>

                    <div className="btn-row">
                      <button className="sec-btn" onClick={()=>setView("list")}>Cancel</button>
                      <button className="pri-btn" disabled={!importFile} onClick={()=>setImportStep(2)}>Next: Review Mapping →</button>
                    </div>
                  </>
                )}

                {importStep===2 && (
                  <>
                    <div style={{fontWeight:700,fontSize:14,color:t.text,marginBottom:4}}>Column Mapping</div>
                    <div style={{fontSize:12.5,color:t.textMuted,marginBottom:14}}>We detected these columns in your file. Confirm the mapping:</div>

                    <div className="col-map">
                      {[
                        {field:"Name",csv:"Customer Name",ok:true},
                        {field:"Phone",csv:"Mobile Number",ok:true},
                        {field:"Gender",csv:"Gender",ok:true},
                        {field:"Email",csv:"Email ID",ok:true},
                        {field:"Notes",csv:"(not found)",ok:false},
                      ].map(r=>(
                        <div key={r.field} className="col-row">
                          <span className="col-field">{r.field}</span>
                          <span className="col-arrow">→</span>
                          <span className="col-csv" style={{color:r.ok?t.text:t.textFaint,flex:1}}>{r.csv}</span>
                          <span className="col-check">{r.ok?"✓":"—"}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{padding:"12px 14px",borderRadius:10,background:`${accent}08`,border:`1px solid ${accent}18`,fontSize:12.5,color:t.textMuted,marginBottom:16}}>
                      Found <strong style={{color:accent}}>247 valid contacts</strong> ready to import · 3 skipped (missing phone number)
                    </div>

                    <div className="btn-row">
                      <button className="sec-btn" onClick={()=>setImportStep(1)}>← Back</button>
                      <button className="pri-btn" onClick={()=>{
                        setView("list")
                        setActiveFilter("all")
                      }}>✓ Import 247 Customers</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
