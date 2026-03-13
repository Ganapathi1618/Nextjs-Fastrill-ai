"use client"

import { useEffect, useState, useRef } from "react"
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

const TIMES = [
  "09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","12:30","13:00","13:30","14:00","14:30",
  "15:00","15:30","16:00","16:30","17:00","17:30",
  "18:00","18:30","19:00","19:30"
]

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]

// ---------- Helpers ----------

const toDateStr = (v) => (v || "").substring(0, 10)

const getTodayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
}

// ---------- Error Handler ----------

const useErrorHandler = () => {
  const [errors, setErrors] = useState({})
  const [lastError, setLastError] = useState(null)

  const showError = (key, message) => {
    setErrors(prev => ({ ...prev, [key]: message }))
    setLastError(message)
  }

  const clearErrors = () => setErrors({})

  return { errors, lastError, showError, clearErrors }
}

// ---------- Booking Validation ----------

const validateBooking = (booking) => {

  const errors = {}

  if (!booking.customer_name?.trim())
    errors.customer_name = "Customer name required"

  if (!booking.customer_phone?.trim())
    errors.customer_phone = "Phone required"

  if (!booking.service)
    errors.service = "Select service"

  if (!booking.booking_date)
    errors.booking_date = "Select date"

  if (!booking.booking_time)
    errors.booking_time = "Select time"

  if (!booking.amount)
    errors.amount = "Enter amount"

  return errors
}

// ---------- Main Component ----------

export default function Bookings() {

  const router = useRouter()

  const [userId, setUserId] = useState(null)
  const [userEmail, setUserEmail] = useState("")
  const [dark, setDark] = useState(true)

  const [bookings, setBookings] = useState([])
  const [services, setServices] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [selected, setSelected] = useState(null)

  const [newBk, setNewBk] = useState({
    customer_name:"",
    customer_phone:"",
    service:"",
    staff:"",
    booking_date:"",
    booking_time:"",
    amount:""
  })

  const todayStr = getTodayStr()
  const contentRef = useRef(null)

  const { errors, lastError, showError, clearErrors } = useErrorHandler()

  // ---------- INIT ----------

  useEffect(() => {

    const init = async () => {

      try {

        // Safe localStorage
        if (typeof window !== "undefined") {
          const saved = localStorage.getItem("fastrill-theme")
          if (saved) setDark(saved === "dark")
        }

        const { data } = await supabase.auth.getUser()

        if (!data?.user) {
          router.push("/login")
          return
        }

        const uid = data.user.id

        setUserId(uid)
        setUserEmail(data.user.email || "")

        await loadServices(uid)
        await loadBookings(uid)

      } catch (err) {

        console.error(err)
        showError("init", "Initialization failed")

      } finally {

        setLoading(false)

      }
    }

    init()

  }, [])

  // ---------- Load Services ----------

  const loadServices = async (uid) => {

    try {

      const { data, error } = await supabase
        .from("services")
        .select("name,price,duration")
        .eq("user_id", uid)

      if (error) throw error

      setServices(data || [])

    } catch (err) {

      console.error("Service load error", err)
      showError("services", "Failed to load services")

    }
  }

  // ---------- Load Bookings ----------

  const loadBookings = async (uid) => {

    try {

      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", uid)
        .order("booking_date", { ascending:true })
        .order("booking_time", { ascending:true })

      if (error) throw error

      const list = (data || []).map(b => ({
        ...b,
        booking_date: toDateStr(b.booking_date)
      }))

      setBookings(list)

      const upcoming = list.filter(b => b.booking_date >= todayStr)

      setSelected(upcoming[0] || list[0] || null)

    } catch (err) {

      console.error("Booking load error", err)
      showError("bookings", "Failed to load bookings")

    }
  }

  // ---------- Save Booking ----------

  const saveBooking = async () => {

    const validation = validateBooking(newBk)

    if (Object.keys(validation).length > 0) {
      showError("validation", "Please fix form errors")
      return
    }

    try {

      setSaving(true)

      const { error } = await supabase
        .from("bookings")
        .insert({
          ...newBk,
          user_id: userId
        })

      if (error) throw error

      await loadBookings(userId)

      setNewBk({
        customer_name:"",
        customer_phone:"",
        service:"",
        staff:"",
        booking_date:"",
        booking_time:"",
        amount:""
      })

    } catch (err) {

      console.error(err)
      showError("save", "Booking save failed")

    } finally {

      setSaving(false)

    }
  }

  // ---------- UI ----------

  if (loading) {
    return (
      <div className="p-10 text-center">
        Loading Bookings...
      </div>
    )
  }

  return (
    <div ref={contentRef} className="p-6">

      <h1 className="text-2xl font-bold mb-4">
        Bookings
      </h1>

      {lastError && (
        <div className="text-red-500 mb-4">
          {lastError}
        </div>
      )}

      <div className="space-y-3">

        {bookings.map(b => (

          <div
            key={b.id}
            className="border p-3 rounded"
          >

            <div className="font-semibold">
              {b.customer_name}
            </div>

            <div className="text-sm">
              {b.booking_date} • {b.booking_time}
            </div>

            <div className="text-sm">
              {b.service}
            </div>

          </div>

        ))}

      </div>

    </div>
  )
}
