I'll refactor this large component into smaller, more manageable pieces. Here's the refactored version:

```jsx
"use client"
import { useEffect, useState, useCallback, createContext, useContext } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

// ─── Data Models ─────────────────────────────────
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

const TIMES = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30"]
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

// ─── Constants & Helpers ───────────────────────────
const toDateStr = (v) => (v || "").substring(0, 10)
const getTodayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
}

// ─── Auth Context ──────────────────────────────────
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) router.push("/login")
      else { 
        setUser(data.user); 
        setUserEmail(data.user.email || ""); 
        setUserId(data.user.id)
      }
      setLoading(false)
    })
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

// ─── Custom Hooks ──────────────────────────────────
function useBookings(userId) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from("bookings").select("*")
        .eq("user_id", userId)
        .order("booking_date", { ascending: true })
        .order("booking_time", { ascending: true })
      
      if (error) throw error
      
      const list = (data || []).map(b => ({ ...b, booking_date: toDateStr(b.booking_date) }))
      setBookings(list)
      return list
    } catch (error) {
      setError(error.message)
      console.error("Bookings load:", error.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [userId])

  const updateStatus = useCallback(async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from("bookings").update({ status: newStatus })
        .eq("id", id)
      
      if (error) throw error
      
      setBookings(prev => prev.map(b => 
        b.id === id ? { ...b, status: newStatus } : b
      ))
      return true
    } catch (error) {
      console.error("Status update:", error.message)
      return false
    }
  }, [])

  const addBooking = useCallback(async (bookingData) => {
    try {
      const { data, error } = await supabase
        .from("bookings").insert({
          ...bookingData, 
          user_id: userId, 
          status: "confirmed", 
          ai_booked: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error("Add booking:", error.message)
      return null
    }
  }, [userId])

  return { bookings, loading, error, load, updateStatus, addBooking }
}

function useServices(userId) {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from("services").select("name,price")
        .eq("user_id", userId)
      
      setServices(data || [])
    } finally {
      setLoading(false)
    }
  }, [userId])

  return { services, loading, load }
}

// ─── Components ─────────────────────────────────────
const ThemeContext = createContext({ dark: true, toggle: () => {} })

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    localStorage.setItem("fastrill-theme", next ? "dark" : "light")
  }

  const theme = { dark, toggle }
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

const Sidebar = ({ userEmail, userInitial, onLogout }) => {
  const router = useRouter()
  
  return (
    <aside className="sidebar">
      <a href="/dashboard" className="logo">fast<span>rill</span></a>
      <div className="nav-section">Platform</div>
      {NAV.map(item => (
        <button
          key={item.id}
          className={`nav-item ${item.id === "bookings" ? "active" : ""}`}
          onClick={() => router.push(item.path)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{
