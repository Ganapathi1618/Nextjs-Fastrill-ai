"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

const MOCK_BOOKINGS = [
  { id: 1, customer: "Priya Sharma", phone: "+91 98765 43210", service: "Women's Haircut", staff: "Ananya", time: "10:00", duration: 30, date: new Date().toDateString(), status: "confirmed", revenue: 350, avatar: "P", source: "WhatsApp AI" },
  { id: 2, customer: "Meera Nair", phone: "+91 54321 09876", service: "Facial", staff: "Ananya", time: "11:00", duration: 60, date: new Date().toDateString(), status: "confirmed", revenue: 600, avatar: "M", source: "WhatsApp AI" },
  { id: 3, customer: "Sneha Patel", phone: "+91 76543 21098", service: "Bridal Package", staff: "Riya", time: "13:00", duration: 120, date: new Date().toDateString(), status: "in-progress", revenue: 8000, avatar: "S", source: "Walk-in" },
  { id: 4, customer: "Kiran Reddy", phone: "+91 65432 10987", service: "Men's Haircut", staff: "Raj", time: "15:00", duration: 30, date: new Date().toDateString(), status: "pending", revenue: 200, avatar: "K", source: "WhatsApp AI" },
  { id: 5, customer: "Rahul Verma", phone: "+91 87654 32109", service: "Hair Colour", staff: "Riya", time: "16:00", duration: 90, date: new Date().toDateString(), status: "pending", revenue: 1500, avatar: "R", source: "WhatsApp AI" },
]

const STAFF = [
  { name: "All Staff", color: "#00c47d" },
  { name: "Ananya", color: "#0ea5e9" },
  { name: "Riya", color: "#f59e0b" },
  { name: "Raj", color: "#7c3aed" },
]

const TIME_SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"]

export default function BookingsPage() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")
  const [view, setView] = useState("day") // day | week | list
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [staffFilter, setStaffFilter] = useState("All Staff")
  const [showModal, setShowModal] = useState(false)

  const navItems = [
    { id: "overview", label: "Revenue Engine", icon: "◈", path: "/dashboard" },
    { id: "inbox", label: "Conversations", icon: "◎", path: "/dashboard/conversations" },
    { id: "bookings", label: "Bookings", icon: "◷", path: "/dashboard/bookings" },
    { id: "leads", label: "Lead Recovery", icon: "◉", path: "/dashboard/leads" },
    { id: "contacts", label: "Customers", icon: "◑", path: "/dashboard/contacts" },
    { id: "analytics", label: "Analytics", icon: "◫", path: "/dashboard/analytics" },
    { id: "settings", label: "Settings", icon: "◌", path: "/dashboard/settings" },
  ]

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { router.push("/login"); return }
      setUserEmail(data.user.email || "")
    }
    init()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const userInitial = userEmail ? userEmail[0].toUpperCase() : "U"

  const todayBookings = MOCK_BOOKINGS.filter(b => b.date === selectedDate.toDateString())
  const filteredBookings = staffFilter === "All Staff" ? todayBookings : todayBookings.filter(b => b.staff === staffFilter)
  const todayRevenue = todayBookings.reduce((sum, b) => sum + b.revenue, 0)
  const confirmedCount = todayBookings.filter(b => b.status === "confirmed").length
  const pendingCount = todayBookings.filter(b => b.status === "pending").length

  const getStatusColor = (status) => {
    if (status === "confirmed") return "#00c47d"
    if (status === "in-progress") return "#0ea5e9"
    if (status === "pending") return "#f59e0b"
    if (status === "cancelled") return "#ef4444"
    return "#6b7280"
  }

  const getStatusLabel = (status) => {
    if (status === "confirmed") return "Confirmed"
    if (status === "in-progress") return "In Progress"
    if (status === "pending") return "Pending"
    if (status === "cancelled") return "Cancelled"
    return status
  }

  const getStaffColor = (name) => {
    const s = STAFF.find(st => st.name === name)
    return s ? s.color : "#6b7280"
  }

  const getBookingAtSlot = (time) => filteredBookings.filter(b => b.time === time)

  const formatDate = (date) => {
    return `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`
  }

  const changeDate = (delta) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + delta)
    setSelectedDate(d)
  }

  const getWeekDates = () => {
    const week = []
    const start = new Date(selectedDate)
    start.setDate(start.getDate() - start.getDay())
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      week.push(d)
    }
    return week
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0a0a0f !important; color: #e8e8f0 !important; font-family: 'DM Sans', sans-serif !important; }

        .dash-root { display: flex; height: 100vh; overflow: hidden; }

        /* SIDEBAR */
        .sidebar { width: 220px; flex-shrink: 0; background: #0f0f17; border-right: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; }
        .sidebar-logo { padding: 24px 20px 20px; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 22px; color: #fff; text-decoration: none; display: block; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .sidebar-logo span { color: #00c47d; }
        .sidebar-section { padding: 20px 12px 8px; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.2); font-weight: 600; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; margin: 2px 8px; border-radius: 8px; cursor: pointer; font-size: 13px; color: rgba(255,255,255,0.45); font-weight: 500; transition: all 0.15s; border: none; background: none; width: calc(100% - 16px); text-align: left; font-family: 'DM Sans', sans-serif; }
        .nav-item:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8); }
        .nav-item.active { background: rgba(0,196,125,0.1); color: #00c47d; font-weight: 600; border: 1px solid rgba(0,196,125,0.2); }
        .nav-icon { font-size: 14px; width: 18px; text-align: center; }
        .sidebar-footer { margin-top: auto; padding: 14px; border-top: 1px solid rgba(255,255,255,0.05); }
        .user-card { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); }
        .user-avatar-sm { width: 30px; height: 30px; border-radius: 8px; background: linear-gradient(135deg, #00c47d, #0ea5e9); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 12px; color: #fff; flex-shrink: 0; }
        .user-email { font-size: 11px; color: rgba(255,255,255,0.35); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .logout-btn { margin-top: 8px; width: 100%; padding: 7px; border-radius: 7px; background: transparent; border: 1px solid rgba(255,255,255,0.08); font-size: 11.5px; color: rgba(255,255,255,0.3); cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .logout-btn:hover { border-color: rgba(239,68,68,0.4); color: #ef4444; }

        /* MAIN */
        .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

        /* TOPBAR */
        .topbar { height: 56px; flex-shrink: 0; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between; padding: 0 24px; background: #0f0f17; }
        .topbar-left { display: flex; align-items: center; gap: 14px; }
        .topbar-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; color: #fff; }
        .date-nav { display: flex; align-items: center; gap: 8px; }
        .date-nav-btn { width: 28px; height: 28px; border-radius: 7px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.5); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 13px; transition: all 0.12s; }
        .date-nav-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .date-label { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px; color: #fff; min-width: 160px; text-align: center; }
        .today-btn { padding: 4px 12px; border-radius: 7px; background: rgba(0,196,125,0.1); border: 1px solid rgba(0,196,125,0.2); color: #00c47d; font-size: 11.5px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .view-tabs { display: flex; gap: 3px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 9px; padding: 3px; }
        .view-tab { padding: 5px 14px; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; background: transparent; color: rgba(255,255,255,0.35); transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
        .view-tab.active { background: #00c47d; color: #000; }
        .add-booking-btn { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; border-radius: 9px; background: #00c47d; color: #000; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 12.5px; border: none; cursor: pointer; transition: all 0.15s; box-shadow: 0 4px 14px rgba(0,196,125,0.3); }
        .add-booking-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,196,125,0.4); }

        /* CONTENT */
        .content { flex: 1; display: flex; overflow: hidden; }

        /* STATS BAR */
        .stats-bar { display: flex; gap: 12px; padding: 14px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); background: #0a0a0f; flex-shrink: 0; }
        .stat-chip { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 10px; background: #0f0f17; border: 1px solid rgba(255,255,255,0.07); }
        .stat-chip-val { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 16px; }
        .stat-chip-label { font-size: 11px; color: rgba(255,255,255,0.35); }

        /* CALENDAR AREA */
        .calendar-wrap { flex: 1; display: flex; overflow: hidden; }

        /* STAFF FILTER */
        .staff-col { width: 180px; flex-shrink: 0; border-right: 1px solid rgba(255,255,255,0.06); padding: 16px 12px; background: #0f0f17; overflow-y: auto; }
        .staff-col-title { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.2); font-weight: 600; margin-bottom: 12px; }
        .staff-btn { display: flex; align-items: center; gap: 8px; width: 100%; padding: 9px 10px; border-radius: 9px; border: none; background: transparent; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 12.5px; color: rgba(255,255,255,0.45); font-weight: 500; transition: all 0.12s; text-align: left; margin-bottom: 3px; }
        .staff-btn:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.8); }
        .staff-btn.active { background: rgba(255,255,255,0.06); color: #fff; font-weight: 600; }
        .staff-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .staff-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 10px 0; }
        .capacity-info { padding: 10px; border-radius: 9px; background: rgba(0,196,125,0.05); border: 1px solid rgba(0,196,125,0.1); margin-top: 12px; }
        .capacity-info-title { font-size: 10px; color: rgba(255,255,255,0.3); font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
        .capacity-row { display: flex; justify-content: space-between; font-size: 11px; color: rgba(255,255,255,0.4); margin-bottom: 3px; }
        .capacity-val { color: #00c47d; font-weight: 700; font-family: 'Syne', sans-serif; }

        /* DAY VIEW */
        .day-view { flex: 1; overflow-y: auto; padding: 0; }
        .time-grid { display: flex; flex-direction: column; }
        .time-row { display: flex; min-height: 56px; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .time-row:hover { background: rgba(255,255,255,0.01); }
        .time-label { width: 64px; flex-shrink: 0; padding: 6px 12px 0; font-size: 11px; color: rgba(255,255,255,0.2); font-weight: 500; text-align: right; }
        .time-slot-area { flex: 1; padding: 4px 12px; display: flex; flex-wrap: wrap; gap: 6px; align-items: flex-start; }
        .booking-chip { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 10px; cursor: pointer; transition: all 0.15s; border: 1px solid transparent; min-width: 200px; max-width: 320px; }
        .booking-chip:hover { transform: translateY(-1px); }
        .booking-avatar { width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 11px; color: #fff; flex-shrink: 0; }
        .booking-info { flex: 1; min-width: 0; }
        .booking-name { font-size: 12px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .booking-service { font-size: 11px; color: rgba(255,255,255,0.45); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .booking-rev { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 12px; color: #00c47d; flex-shrink: 0; }
        .empty-slot { padding: 6px 0; font-size: 11px; color: rgba(255,255,255,0.1); }
        .day-view::-webkit-scrollbar { width: 3px; }
        .day-view::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); }

        /* WEEK VIEW */
        .week-view { flex: 1; overflow: auto; }
        .week-header { display: grid; grid-template-columns: 64px repeat(7, 1fr); border-bottom: 1px solid rgba(255,255,255,0.06); background: #0f0f17; position: sticky; top: 0; z-index: 10; }
        .week-header-cell { padding: 10px 8px; text-align: center; border-right: 1px solid rgba(255,255,255,0.04); }
        .week-day-name { font-size: 10px; color: rgba(255,255,255,0.3); font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
        .week-day-num { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 18px; color: rgba(255,255,255,0.6); margin-top: 2px; }
        .week-day-num.today { color: #00c47d; }
        .week-body { display: grid; grid-template-columns: 64px repeat(7, 1fr); }
        .week-time-label { padding: 6px 12px 0; font-size: 11px; color: rgba(255,255,255,0.2); text-align: right; border-right: 1px solid rgba(255,255,255,0.04); min-height: 50px; }
        .week-cell { border-right: 1px solid rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.03); min-height: 50px; padding: 3px; }
        .week-cell:hover { background: rgba(255,255,255,0.02); }
        .week-booking { padding: 4px 7px; border-radius: 6px; font-size: 10.5px; font-weight: 600; color: #fff; margin-bottom: 2px; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        /* LIST VIEW */
        .list-view { flex: 1; overflow-y: auto; padding: 16px 24px; }
        .list-section-title { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.2); font-weight: 600; margin-bottom: 10px; margin-top: 20px; }
        .list-section-title:first-child { margin-top: 0; }
        .list-card { display: flex; align-items: center; gap: 14px; padding: 14px 16px; background: #0f0f17; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; margin-bottom: 8px; cursor: pointer; transition: all 0.15s; }
        .list-card:hover { border-color: rgba(0,196,125,0.2); transform: translateX(2px); }
        .list-avatar { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 15px; color: #fff; flex-shrink: 0; background: linear-gradient(135deg, rgba(0,196,125,0.3), rgba(14,165,233,0.3)); }
        .list-info { flex: 1; }
        .list-name { font-size: 13.5px; font-weight: 600; color: #fff; margin-bottom: 3px; }
        .list-meta { font-size: 11.5px; color: rgba(255,255,255,0.35); display: flex; align-items: center; gap: 10px; }
        .list-dot { width: 3px; height: 3px; border-radius: 50%; background: rgba(255,255,255,0.2); }
        .list-right { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
        .list-time { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; color: #fff; }
        .list-revenue { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 13px; color: #00c47d; }
        .status-badge { padding: 3px 10px; border-radius: 100px; font-size: 10px; font-weight: 700; }
        .source-tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 100px; background: rgba(0,196,125,0.08); border: 1px solid rgba(0,196,125,0.15); color: #00c47d; font-size: 10px; font-weight: 600; }
        .list-view::-webkit-scrollbar { width: 3px; }
        .list-view::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); }

        /* BOOKING DETAIL PANEL */
        .detail-panel { width: 300px; flex-shrink: 0; border-left: 1px solid rgba(255,255,255,0.06); background: #0f0f17; overflow-y: auto; padding: 20px; }
        .detail-panel-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; color: #fff; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; }
        .close-btn { width: 26px; height: 26px; border-radius: 7px; background: rgba(255,255,255,0.05); border: none; color: rgba(255,255,255,0.4); cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; }
        .detail-avatar { width: 56px; height: 56px; border-radius: 14px; background: linear-gradient(135deg, rgba(0,196,125,0.3), rgba(14,165,233,0.3)); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 22px; color: #fff; margin: 0 auto 14px; }
        .detail-name { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 18px; color: #fff; text-align: center; margin-bottom: 4px; }
        .detail-phone { font-size: 12px; color: rgba(255,255,255,0.3); text-align: center; margin-bottom: 16px; }
        .detail-section { margin-bottom: 16px; }
        .detail-label { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255,255,255,0.2); font-weight: 600; margin-bottom: 8px; }
        .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 12.5px; }
        .detail-row-label { color: rgba(255,255,255,0.4); }
        .detail-row-val { color: #fff; font-weight: 600; }
        .detail-revenue { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 28px; color: #00c47d; text-align: center; margin: 16px 0; }
        .detail-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
        .action-btn { width: 100%; padding: 10px; border-radius: 9px; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 12.5px; cursor: pointer; transition: all 0.15s; border: none; }
        .action-btn.confirm { background: #00c47d; color: #000; }
        .action-btn.confirm:hover { background: #00d988; }
        .action-btn.whatsapp { background: rgba(37,211,102,0.1); border: 1px solid rgba(37,211,102,0.2); color: #25d366; }
        .action-btn.cancel { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15); color: #ef4444; }
        .detail-panel::-webkit-scrollbar { width: 3px; }
        .detail-panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); }

        /* WRAP */
        .main-body { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
      `}</style>

      <div className="dash-root">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <a href="/" className="sidebar-logo">fast<span>rill</span></a>
          <div className="sidebar-section">Platform</div>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item${item.id === "bookings" ? " active" : ""}`}
              onClick={() => router.push(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          <div className="sidebar-footer">
            <div className="user-card">
              <div className="user-avatar-sm">{userInitial}</div>
              <div className="user-email">{userEmail}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>↩ Sign out</button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="main">
          {/* TOPBAR */}
          <div className="topbar">
            <div className="topbar-left">
              <div className="topbar-title">Bookings</div>
              <div className="date-nav">
                <button className="date-nav-btn" onClick={() => changeDate(-1)}>‹</button>
                <div className="date-label">{formatDate(selectedDate)}</div>
                <button className="date-nav-btn" onClick={() => changeDate(1)}>›</button>
                <button className="today-btn" onClick={() => setSelectedDate(new Date())}>Today</button>
              </div>
              <div className="view-tabs">
                {["day", "week", "list"].map(v => (
                  <button key={v} className={`view-tab${view === v ? " active" : ""}`} onClick={() => setView(v)}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <button className="add-booking-btn" onClick={() => setShowModal(true)}>
              + New Booking
            </button>
          </div>

          {/* STATS BAR */}
          <div className="stats-bar">
            {[
              { label: "Today's Revenue", val: `₹${todayRevenue.toLocaleString()}`, color: "#00c47d" },
              { label: "Total Bookings", val: todayBookings.length, color: "#0ea5e9" },
              { label: "Confirmed", val: confirmedCount, color: "#00c47d" },
              { label: "Pending", val: pendingCount, color: "#f59e0b" },
              { label: "Booked via AI", val: todayBookings.filter(b => b.source === "WhatsApp AI").length, color: "#7c3aed" },
            ].map(s => (
              <div key={s.label} className="stat-chip">
                <div className="stat-chip-val" style={{color: s.color}}>{s.val}</div>
                <div className="stat-chip-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* BODY */}
          <div className="content">
            {/* STAFF COL */}
            <div className="staff-col">
              <div className="staff-col-title">Filter by Staff</div>
              {STAFF.map(s => (
                <button
                  key={s.name}
                  className={`staff-btn${staffFilter === s.name ? " active" : ""}`}
                  onClick={() => setStaffFilter(s.name)}
                >
                  <div className="staff-dot" style={{background: s.color}} />
                  {s.name}
                </button>
              ))}
              <div className="staff-divider" />
              <div className="capacity-info">
                <div className="capacity-info-title">Capacity Today</div>
                {STAFF.slice(1).map(s => {
                  const count = todayBookings.filter(b => b.staff === s.name).length
                  return (
                    <div key={s.name} className="capacity-row">
                      <span style={{color: s.color}}>{s.name}</span>
                      <span className="capacity-val">{count} booked</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* CALENDAR */}
            <div className="main-body">
              {/* DAY VIEW */}
              {view === "day" && (
                <div className="day-view">
                  <div className="time-grid">
                    {TIME_SLOTS.map(time => {
                      const bookings = getBookingAtSlot(time)
                      return (
                        <div key={time} className="time-row">
                          <div className="time-label">{time}</div>
                          <div className="time-slot-area">
                            {bookings.length > 0 ? bookings.map(b => (
                              <div
                                key={b.id}
                                className="booking-chip"
                                style={{
                                  background: getStatusColor(b.status) + "12",
                                  borderColor: getStatusColor(b.status) + "30",
                                }}
                                onClick={() => setSelectedBooking(b)}
                              >
                                <div className="booking-avatar" style={{background: getStaffColor(b.staff) + "40"}}>
                                  {b.avatar}
                                </div>
                                <div className="booking-info">
                                  <div className="booking-name">{b.customer}</div>
                                  <div className="booking-service">{b.service} · {b.staff}</div>
                                </div>
                                <div className="booking-rev">₹{b.revenue}</div>
                              </div>
                            )) : (
                              <div className="empty-slot" />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* WEEK VIEW */}
              {view === "week" && (
                <div className="week-view">
                  <div className="week-header">
                    <div className="week-header-cell" />
                    {getWeekDates().map((d, i) => (
                      <div key={i} className="week-header-cell" onClick={() => { setSelectedDate(d); setView("day") }} style={{cursor:"pointer"}}>
                        <div className="week-day-name">{DAYS[d.getDay()]}</div>
                        <div className={`week-day-num${d.toDateString() === new Date().toDateString() ? " today" : ""}`}>
                          {d.getDate()}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="week-body">
                    {TIME_SLOTS.map(time => (
                      <>
                        <div key={`t-${time}`} className="week-time-label">{time}</div>
                        {getWeekDates().map((d, i) => {
                          const dayBookings = MOCK_BOOKINGS.filter(b => b.date === d.toDateString() && b.time === time)
                          return (
                            <div key={`${time}-${i}`} className="week-cell">
                              {dayBookings.map(b => (
                                <div
                                  key={b.id}
                                  className="week-booking"
                                  style={{background: getStatusColor(b.status) + "20", borderLeft: `3px solid ${getStatusColor(b.status)}`}}
                                  onClick={() => setSelectedBooking(b)}
                                >
                                  {b.customer.split(" ")[0]}
                                </div>
                              ))}
                            </div>
                          )
                        })}
                      </>
                    ))}
                  </div>
                </div>
              )}

              {/* LIST VIEW */}
              {view === "list" && (
                <div className="list-view">
                  {["in-progress", "confirmed", "pending"].map(status => {
                    const group = filteredBookings.filter(b => b.status === status)
                    if (group.length === 0) return null
                    return (
                      <div key={status}>
                        <div className="list-section-title">
                          {status === "in-progress" ? "🔵 In Progress" : status === "confirmed" ? "✅ Confirmed" : "⏳ Pending"}
                        </div>
                        {group.map(b => (
                          <div key={b.id} className="list-card" onClick={() => setSelectedBooking(b)}>
                            <div className="list-avatar">{b.avatar}</div>
                            <div className="list-info">
                              <div className="list-name">{b.customer}</div>
                              <div className="list-meta">
                                <span>{b.service}</span>
                                <div className="list-dot" />
                                <span style={{color: getStaffColor(b.staff)}}>{b.staff}</span>
                                <div className="list-dot" />
                                <span>{b.duration} min</span>
                                {b.source === "WhatsApp AI" && (
                                  <span className="source-tag">◈ AI Booked</span>
                                )}
                              </div>
                            </div>
                            <div className="list-right">
                              <div className="list-time">{b.time}</div>
                              <div className="list-revenue">₹{b.revenue.toLocaleString()}</div>
                              <div className="status-badge" style={{background: getStatusColor(b.status) + "15", color: getStatusColor(b.status)}}>
                                {getStatusLabel(b.status)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* BOOKING DETAIL PANEL */}
            {selectedBooking && (
              <div className="detail-panel">
                <div className="detail-panel-title">
                  Booking Details
                  <button className="close-btn" onClick={() => setSelectedBooking(null)}>×</button>
                </div>
                <div className="detail-avatar">{selectedBooking.avatar}</div>
                <div className="detail-name">{selectedBooking.customer}</div>
                <div className="detail-phone">{selectedBooking.phone}</div>

                <div className="detail-revenue">₹{selectedBooking.revenue.toLocaleString()}</div>

                <div className="detail-section">
                  <div className="detail-label">Appointment Info</div>
                  {[
                    { label: "Service", val: selectedBooking.service },
                    { label: "Staff", val: selectedBooking.staff },
                    { label: "Time", val: selectedBooking.time },
                    { label: "Duration", val: `${selectedBooking.duration} min` },
                    { label: "Status", val: getStatusLabel(selectedBooking.status) },
                    { label: "Source", val: selectedBooking.source },
                  ].map(r => (
                    <div key={r.label} className="detail-row">
                      <span className="detail-row-label">{r.label}</span>
                      <span className="detail-row-val" style={r.label === "Status" ? {color: getStatusColor(selectedBooking.status)} : {}}>{r.val}</span>
                    </div>
                  ))}
                </div>

                <div className="detail-actions">
                  {selectedBooking.status === "pending" && (
                    <button className="action-btn confirm">✓ Confirm Booking</button>
                  )}
                  <button className="action-btn whatsapp">💬 Message on WhatsApp</button>
                  <button className="action-btn cancel">✕ Cancel Booking</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
