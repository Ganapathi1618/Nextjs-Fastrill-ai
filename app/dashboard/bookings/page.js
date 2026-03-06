"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"
import { useTheme } from "@/lib/ThemeContext"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const TIME_SLOTS = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30"]

const MOCK_BOOKINGS = [
  { id:1, customer:"Priya Sharma", phone:"+91 98765 43210", service:"Women's Haircut", staff:"Ananya", time:"10:00", duration:30, date:new Date().toDateString(), status:"confirmed", revenue:350, avatar:"P", source:"WhatsApp AI" },
  { id:2, customer:"Meera Nair", phone:"+91 54321 09876", service:"Facial", staff:"Ananya", time:"11:00", duration:60, date:new Date().toDateString(), status:"confirmed", revenue:600, avatar:"M", source:"WhatsApp AI" },
  { id:3, customer:"Sneha Patel", phone:"+91 76543 21098", service:"Bridal Package", staff:"Riya", time:"13:00", duration:120, date:new Date().toDateString(), status:"in-progress", revenue:8000, avatar:"S", source:"Walk-in" },
  { id:4, customer:"Kiran Reddy", phone:"+91 65432 10987", service:"Men's Haircut", staff:"Raj", time:"15:00", duration:30, date:new Date().toDateString(), status:"pending", revenue:200, avatar:"K", source:"WhatsApp AI" },
  { id:5, customer:"Rahul Verma", phone:"+91 87654 32109", service:"Hair Colour", staff:"Riya", time:"16:00", duration:90, date:new Date().toDateString(), status:"pending", revenue:1500, avatar:"R", source:"WhatsApp AI" },
]

const STAFF = [
  { name:"All Staff", color:"#00c47d" },
  { name:"Ananya", color:"#0ea5e9" },
  { name:"Riya", color:"#f59e0b" },
  { name:"Raj", color:"#7c3aed" },
]

export default function BookingsPage() {
  const router = useRouter()
  const { t, accent, darkMode } = useTheme()
  const [view, setView] = useState("day")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [staffFilter, setStaffFilter] = useState("All Staff")

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) router.push("/login")
    }
    init()
  }, [])

  const todayBookings = MOCK_BOOKINGS.filter(b => b.date === selectedDate.toDateString())
  const filteredBookings = staffFilter === "All Staff" ? todayBookings : todayBookings.filter(b => b.staff === staffFilter)
  const todayRevenue = todayBookings.reduce((sum, b) => sum + b.revenue, 0)

  const getStatusColor = (s) => ({ confirmed: accent, "in-progress":"#0ea5e9", pending:"#f59e0b", cancelled:"#ef4444" }[s] || "#6b7280")
  const getStatusLabel = (s) => ({ confirmed:"Confirmed", "in-progress":"In Progress", pending:"Pending", cancelled:"Cancelled" }[s] || s)
  const getStaffColor = (name) => STAFF.find(s => s.name === name)?.color || "#6b7280"
  const formatDate = (d) => `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`
  const changeDate = (delta) => { const d = new Date(selectedDate); d.setDate(d.getDate() + delta); setSelectedDate(d) }

  const getWeekDates = () => {
    const week = []; const start = new Date(selectedDate); start.setDate(start.getDate() - start.getDay())
    for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(start.getDate() + i); week.push(d) }
    return week
  }

  const topbar = (
    <>
      <span style={{fontWeight:700, fontSize:15, color:t.text}}>Bookings</span>
      <div style={{display:"flex", alignItems:"center", gap:8}}>
        <button style={{width:28, height:28, borderRadius:7, background:t.inputBg, border:`1px solid ${t.cardBorder}`, color:t.textMuted, cursor:"pointer", fontSize:13}} onClick={() => changeDate(-1)}>‹</button>
        <span style={{fontWeight:700, fontSize:13, color:t.text, minWidth:160, textAlign:"center"}}>{formatDate(selectedDate)}</span>
        <button style={{width:28, height:28, borderRadius:7, background:t.inputBg, border:`1px solid ${t.cardBorder}`, color:t.textMuted, cursor:"pointer", fontSize:13}} onClick={() => changeDate(1)}>›</button>
        <button style={{padding:"4px 12px", borderRadius:7, background:accent+"18", border:`1px solid ${accent}33`, color:accent, fontSize:11.5, fontWeight:600, cursor:"pointer"}} onClick={() => setSelectedDate(new Date())}>Today</button>
      </div>
      <div style={{display:"flex", gap:3, background:t.inputBg, border:`1px solid ${t.cardBorder}`, borderRadius:9, padding:3}}>
        {["day","week","list"].map(v => (
          <button key={v} onClick={() => setView(v)} style={{padding:"5px 13px", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer", border:"none", background: view===v ? accent : "transparent", color: view===v ? "#000" : t.textMuted, fontFamily:"'Plus Jakarta Sans', sans-serif"}}>
            {v.charAt(0).toUpperCase()+v.slice(1)}
          </button>
        ))}
      </div>
    </>
  )

  return (
    <DashboardLayout activePage="bookings" topbar={topbar}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .bk-root { display:flex; flex-direction:column; flex:1; overflow:hidden; height:calc(100vh - 54px); font-family:'Plus Jakarta Sans',sans-serif; }
        .stats-bar { display:flex; gap:10px; padding:12px 20px; border-bottom:1px solid ${t.border}; background:${t.bg}; flex-shrink:0; flex-wrap:wrap; }
        .stat-chip { display:flex; align-items:center; gap:8px; padding:7px 13px; border-radius:9px; background:${t.card}; border:1px solid ${t.cardBorder}; }
        .stat-chip-val { font-weight:700; font-size:15px; }
        .stat-chip-label { font-size:11px; color:${t.textMuted}; }
        .bk-body { display:flex; flex:1; overflow:hidden; }
        .staff-col { width:170px; flex-shrink:0; border-right:1px solid ${t.border}; padding:14px 10px; background:${t.sidebar}; overflow-y:auto; }
        .staff-col-title { font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:${t.textFaint}; font-weight:600; margin-bottom:10px; }
        .staff-btn { display:flex; align-items:center; gap:8px; width:100%; padding:8px 10px; border-radius:8px; border:none; background:transparent; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-size:12.5px; color:${t.navText}; font-weight:500; transition:all 0.12s; text-align:left; margin-bottom:2px; }
        .staff-btn:hover { background:${t.inputBg}; color:${t.text}; }
        .staff-btn.active { background:${t.inputBg}; color:${t.text}; font-weight:600; }
        .staff-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .cap-info { padding:10px; border-radius:9px; background:${accent}08; border:1px solid ${accent}18; margin-top:12px; }
        .cap-title { font-size:10px; color:${t.textFaint}; font-weight:600; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; }
        .cap-row { display:flex; justify-content:space-between; font-size:11px; color:${t.textMuted}; margin-bottom:3px; }
        .cap-val { color:${accent}; font-weight:700; }

        /* DAY VIEW */
        .day-view { flex:1; overflow-y:auto; }
        .time-row { display:flex; min-height:52px; border-bottom:1px solid ${t.border}; }
        .time-row:hover { background:${t.inputBg}; }
        .time-label { width:60px; flex-shrink:0; padding:6px 10px 0; font-size:11px; color:${t.textFaint}; text-align:right; }
        .slot-area { flex:1; padding:4px 10px; display:flex; flex-wrap:wrap; gap:6px; align-items:flex-start; }
        .booking-chip { display:flex; align-items:center; gap:8px; padding:7px 11px; border-radius:9px; cursor:pointer; transition:all 0.15s; border:1px solid transparent; min-width:190px; max-width:300px; }
        .booking-chip:hover { transform:translateY(-1px); }
        .bk-avatar { width:26px; height:26px; border-radius:7px; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:11px; color:#fff; flex-shrink:0; }
        .bk-name { font-size:12px; font-weight:600; color:${t.text}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bk-svc { font-size:11px; color:${t.textMuted}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bk-rev { font-weight:700; font-size:12px; color:${accent}; flex-shrink:0; }
        .day-view::-webkit-scrollbar { width:3px; }
        .day-view::-webkit-scrollbar-thumb { background:${t.border}; }

        /* WEEK VIEW */
        .week-view { flex:1; overflow:auto; }
        .week-header { display:grid; grid-template-columns:60px repeat(7,1fr); border-bottom:1px solid ${t.border}; background:${t.topbar}; position:sticky; top:0; z-index:10; }
        .week-hdr-cell { padding:9px 6px; text-align:center; border-right:1px solid ${t.border}; cursor:pointer; }
        .week-day-name { font-size:10px; color:${t.textFaint}; font-weight:600; text-transform:uppercase; letter-spacing:1px; }
        .week-day-num { font-weight:700; font-size:17px; color:${t.textMuted}; margin-top:1px; }
        .week-day-num.today { color:${accent}; }
        .week-body { display:grid; grid-template-columns:60px repeat(7,1fr); }
        .week-time-lbl { padding:6px 10px 0; font-size:11px; color:${t.textFaint}; text-align:right; border-right:1px solid ${t.border}; min-height:48px; }
        .week-cell { border-right:1px solid ${t.border}; border-bottom:1px solid ${t.border}; min-height:48px; padding:3px; }
        .week-cell:hover { background:${t.inputBg}; }
        .week-bk { padding:3px 6px; border-radius:5px; font-size:10.5px; font-weight:600; color:${t.text}; margin-bottom:2px; cursor:pointer; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

        /* LIST VIEW */
        .list-view { flex:1; overflow-y:auto; padding:16px 20px; }
        .list-section-title { font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:${t.textFaint}; font-weight:600; margin-bottom:9px; margin-top:18px; }
        .list-section-title:first-child { margin-top:0; }
        .list-card { display:flex; align-items:center; gap:13px; padding:13px 15px; background:${t.card}; border:1px solid ${t.cardBorder}; border-radius:11px; margin-bottom:7px; cursor:pointer; transition:all 0.15s; }
        .list-card:hover { border-color:${accent}33; transform:translateX(2px); }
        .list-avatar { width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; color:#fff; flex-shrink:0; background:linear-gradient(135deg,${accent}50,#0ea5e950); color:${t.text}; }
        .list-name { font-size:13px; font-weight:600; color:${t.text}; margin-bottom:3px; }
        .list-meta { font-size:11.5px; color:${t.textMuted}; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .list-dot { width:3px; height:3px; border-radius:50%; background:${t.textFaint}; }
        .ai-tag { display:inline-flex; align-items:center; gap:3px; padding:2px 7px; border-radius:100px; background:${accent}10; border:1px solid ${accent}20; color:${accent}; font-size:10px; font-weight:600; }
        .list-time { font-weight:700; font-size:14px; color:${t.text}; }
        .list-rev { font-weight:700; font-size:13px; color:${accent}; }
        .status-badge { padding:2px 9px; border-radius:100px; font-size:10px; font-weight:700; }
        .list-view::-wiki-scrollbar { width:3px; }

        /* DETAIL PANEL */
        .detail-panel { width:280px; flex-shrink:0; border-left:1px solid ${t.border}; background:${t.sidebar}; overflow-y:auto; padding:18px; }
        .detail-title { font-weight:700; font-size:13.5px; color:${t.text}; margin-bottom:14px; display:flex; align-items:center; justify-content:space-between; }
        .close-btn { width:24px; height:24px; border-radius:6px; background:${t.inputBg}; border:none; color:${t.textMuted}; cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; }
        .detail-avatar { width:52px; height:52px; border-radius:13px; background:linear-gradient(135deg,${accent}40,#0ea5e940); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:20px; color:${t.text}; margin:0 auto 12px; }
        .detail-name { font-weight:700; font-size:17px; color:${t.text}; text-align:center; margin-bottom:3px; }
        .detail-phone { font-size:11.5px; color:${t.textMuted}; text-align:center; margin-bottom:14px; }
        .detail-revenue { font-weight:800; font-size:30px; color:${accent}; text-align:center; margin:12px 0; letter-spacing:-0.5px; }
        .detail-lbl { font-size:10px; letter-spacing:1.2px; text-transform:uppercase; color:${t.textFaint}; font-weight:600; margin-bottom:7px; }
        .detail-row { display:flex; justify-content:space-between; align-items:center; padding:7px 0; border-bottom:1px solid ${t.border}; font-size:12.5px; }
        .detail-row-lbl { color:${t.textMuted}; }
        .detail-row-val { color:${t.text}; font-weight:600; }
        .detail-actions { display:flex; flex-direction:column; gap:7px; margin-top:14px; }
        .action-btn { width:100%; padding:9px; border-radius:9px; font-weight:700; font-size:12.5px; cursor:pointer; transition:all 0.15s; border:none; font-family:'Plus Jakarta Sans',sans-serif; }
        .action-btn.confirm { background:${accent}; color:#000; }
        .action-btn.wa { background:rgba(37,211,102,0.1); border:1px solid rgba(37,211,102,0.2); color:#25d366; }
        .action-btn.cancel { background:rgba(239,68,68,0.07); border:1px solid rgba(239,68,68,0.15); color:#ef4444; }
      `}</style>

      <div className="bk-root">
        {/* STATS */}
        <div className="stats-bar">
          {[
            { label:"Today's Revenue", val:`₹${todayRevenue.toLocaleString()}`, color:accent },
            { label:"Total Bookings", val:todayBookings.length, color:"#0ea5e9" },
            { label:"Confirmed", val:todayBookings.filter(b=>b.status==="confirmed").length, color:accent },
            { label:"Pending", val:todayBookings.filter(b=>b.status==="pending").length, color:"#f59e0b" },
            { label:"Booked via AI", val:todayBookings.filter(b=>b.source==="WhatsApp AI").length, color:"#7c3aed" },
          ].map(s => (
            <div key={s.label} className="stat-chip">
              <div className="stat-chip-val" style={{color:s.color}}>{s.val}</div>
              <div className="stat-chip-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bk-body">
          {/* STAFF */}
          <div className="staff-col">
            <div className="staff-col-title">Filter by Staff</div>
            {STAFF.map(s => (
              <button key={s.name} className={`staff-btn${staffFilter===s.name?" active":""}`} onClick={() => setStaffFilter(s.name)}>
                <div className="staff-dot" style={{background:s.color}} />
                {s.name}
              </button>
            ))}
            <div className="cap-info">
              <div className="cap-title">Capacity Today</div>
              {STAFF.slice(1).map(s => (
                <div key={s.name} className="cap-row">
                  <span style={{color:s.color}}>{s.name}</span>
                  <span className="cap-val">{todayBookings.filter(b=>b.staff===s.name).length} booked</span>
                </div>
              ))}
            </div>
          </div>

          {/* DAY VIEW */}
          {view === "day" && (
            <div className="day-view">
              {TIME_SLOTS.map(time => {
                const bookings = filteredBookings.filter(b => b.time === time)
                return (
                  <div key={time} className="time-row">
                    <div className="time-label">{time}</div>
                    <div className="slot-area">
                      {bookings.map(b => (
                        <div key={b.id} className="booking-chip"
                          style={{background: getStatusColor(b.status)+"12", borderColor: getStatusColor(b.status)+"30"}}
                          onClick={() => setSelectedBooking(b)}
                        >
                          <div className="bk-avatar" style={{background: getStaffColor(b.staff)+"50"}}>{b.avatar}</div>
                          <div style={{flex:1, minWidth:0}}>
                            <div className="bk-name">{b.customer}</div>
                            <div className="bk-svc">{b.service} · {b.staff}</div>
                          </div>
                          <div className="bk-rev">₹{b.revenue}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* WEEK VIEW */}
          {view === "week" && (
            <div className="week-view">
              <div className="week-header">
                <div style={{padding:"9px 6px", borderRight:`1px solid ${t.border}`}} />
                {getWeekDates().map((d, i) => (
                  <div key={i} className="week-hdr-cell" onClick={() => { setSelectedDate(d); setView("day") }}>
                    <div className="week-day-name">{DAYS[d.getDay()]}</div>
                    <div className={`week-day-num${d.toDateString()===new Date().toDateString()?" today":""}`}>{d.getDate()}</div>
                  </div>
                ))}
              </div>
              <div className="week-body">
                {TIME_SLOTS.map(time => (
                  <>
                    <div key={`t-${time}`} className="week-time-lbl">{time}</div>
                    {getWeekDates().map((d, i) => {
                      const bks = MOCK_BOOKINGS.filter(b => b.date===d.toDateString() && b.time===time)
                      return (
                        <div key={`${time}-${i}`} className="week-cell">
                          {bks.map(b => (
                            <div key={b.id} className="week-bk"
                              style={{background:getStatusColor(b.status)+"18", borderLeft:`3px solid ${getStatusColor(b.status)}`}}
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
              {["in-progress","confirmed","pending"].map(status => {
                const group = filteredBookings.filter(b => b.status===status)
                if (!group.length) return null
                return (
                  <div key={status}>
                    <div className="list-section-title">
                      {status==="in-progress" ? "🔵 In Progress" : status==="confirmed" ? "✅ Confirmed" : "⏳ Pending"}
                    </div>
                    {group.map(b => (
                      <div key={b.id} className="list-card" onClick={() => setSelectedBooking(b)}>
                        <div className="list-avatar">{b.avatar}</div>
                        <div style={{flex:1}}>
                          <div className="list-name">{b.customer}</div>
                          <div className="list-meta">
                            <span>{b.service}</span>
                            <div className="list-dot" />
                            <span style={{color:getStaffColor(b.staff)}}>{b.staff}</span>
                            <div className="list-dot" />
                            <span>{b.duration} min</span>
                            {b.source==="WhatsApp AI" && <span className="ai-tag">◈ AI Booked</span>}
                          </div>
                        </div>
                        <div style={{display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4}}>
                          <div className="list-time">{b.time}</div>
                          <div className="list-rev">₹{b.revenue.toLocaleString()}</div>
                          <div className="status-badge" style={{background:getStatusColor(b.status)+"15", color:getStatusColor(b.status)}}>
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

          {/* DETAIL PANEL */}
          {selectedBooking && (
            <div className="detail-panel">
              <div className="detail-title">
                Booking Details
                <button className="close-btn" onClick={() => setSelectedBooking(null)}>×</button>
              </div>
              <div className="detail-avatar">{selectedBooking.avatar}</div>
              <div className="detail-name">{selectedBooking.customer}</div>
              <div className="detail-phone">{selectedBooking.phone}</div>
              <div className="detail-revenue">₹{selectedBooking.revenue.toLocaleString()}</div>
              <div className="detail-lbl">Appointment Info</div>
              {[
                { label:"Service", val:selectedBooking.service },
                { label:"Staff", val:selectedBooking.staff },
                { label:"Time", val:selectedBooking.time },
                { label:"Duration", val:`${selectedBooking.duration} min` },
                { label:"Status", val:getStatusLabel(selectedBooking.status) },
                { label:"Source", val:selectedBooking.source },
              ].map(r => (
                <div key={r.label} className="detail-row">
                  <span className="detail-row-lbl">{r.label}</span>
                  <span className="detail-row-val" style={r.label==="Status" ? {color:getStatusColor(selectedBooking.status)} : {}}>{r.val}</span>
                </div>
              ))}
              <div className="detail-actions">
                {selectedBooking.status==="pending" && <button className="action-btn confirm">✓ Confirm Booking</button>}
                <button className="action-btn wa">💬 Message on WhatsApp</button>
                <button className="action-btn cancel">✕ Cancel Booking</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
