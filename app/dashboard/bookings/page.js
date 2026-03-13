"use client"
import { useEffect, useState, useCallback, createContext, useContext } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

// ─── Data Models & Constants ─────────────────────────────────
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

const TIMES = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30"]
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

// ─── Helper Functions ─────────────────────────────────
const toDateStr = (v) => (v || "").substring(0, 10)
const getTodayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
}
const formatDate = (raw, now = new Date()) => {
  if (!raw) return "—"
  const d = toDateStr(raw)
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate()+1)
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,"0")}-${String(tomorrow.getDate()).padStart(2,"0")}`
  const prefix = d === getTodayStr() ? "Today · " : d === tomorrowStr ? "Tomorrow · " : ""
  try { 
    return prefix + new Date(d+"T12:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"}) 
  } catch { 
    return raw 
  }
}

// ─── Context Providers ─────────────────────────────────
const AuthContext = createContext(null)
const ThemeContext = createContext({ dark: true, toggle: () => {} })

// ─── Custom Hooks ──────────────────────────────────
function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const savedTheme = localStorage.getItem("fastrill-theme")
    
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) router.push("/login")
      else { 
        setUser(data.user)
        setLoading(false)
      }
    }).catch(() => {
      router.push("/login")
      setLoading(false)
    })
  }, [router])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return { user, loading, signOut, themeState: { savedTheme } }
}

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

function useTheme(savedTheme) {
  const [dark, setDark] = useState(savedTheme === "dark")

  const toggle = () => {
    const next = !dark
    setDark(next)
    localStorage.setItem("fastrill-theme", next ? "dark" : "light")
  }

  return { dark, toggle }
}

// ─── Components ─────────────────────────────────────
const Sidebar = ({ user, onLogout }) => {
  const router = useRouter()
  const userInitial = user?.email ? user.email[0].toUpperCase() : "G"
  
  if (!user) return null

  return (
    <aside className
