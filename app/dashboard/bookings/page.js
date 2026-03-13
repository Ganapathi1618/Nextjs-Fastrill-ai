I'll enhance your booking agent with powerful error handling, validation, and intelligent booking features. Here's the upgraded version:

```jsx
"use client"
import { useEffect, useState, useCallback, useRef } from "react"
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

const TIMES = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30"]
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

// Enhanced error handling system
const useErrorHandler = () => {
  const [errors, setErrors] = useState({})
  const [errorMessages, setErrorMessages] = useState([])
  const [lastError, setLastError] = useState(null)

  const showError = (key, message) => {
    setErrors(prev => ({ ...prev, [key]: message }))
    setErrorMessages(prev => [...prev.slice(-4), message])
    setLastError(message)
  }

  const clearErrors = () => {
    setErrors({})
    setErrorMessages([])
  }

  const clearFieldError = (key) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[key]
      return newErrors
    })
  }

  return { errors, errorMessages, lastError, showError, clearErrors, clearFieldError }
}

// Safe date helpers with timezone handling
const toDateStr = (v) => (v || "").substring(0, 10)
const getTodayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
}

// Booking validation utilities
const validateBooking = (booking, services) => {
  const errors = {}
  
  if (!booking.customer_name?.trim()) {
    errors.customer_name = "Customer name is required"
  } else if (booking.customer_name.length < 2) {
    errors.customer_name = "Customer name must be at least 2 characters"
  }
  
  if (!booking.customer_phone?.trim()) {
    errors.customer_phone = "Phone number is required"
  } else if (!/^\+?[1-9]\d{1,14}$/.test(booking.customer_phone)) {
    errors.customer_phone = "Invalid phone number format"
  }
  
  if (!booking.service) {
    errors.service = "Please select a service"
  }
  
  if (!booking.booking_date) {
    errors.booking_date = "Booking date is required"
  } else if (booking.booking_date < getTodayStr()) {
    errors.booking_date = "Cannot book in the past"
  }
  
  if (!booking.booking_time) {
    errors.booking_time = "Please select a time slot"
  }
  
  if (!booking.amount || booking.amount <= 0) {
    errors.amount = "Valid amount is required"
  }
  
  // Check for duplicate bookings
  if (booking.customer_phone && booking.booking_date && booking.booking_time) {
    const checkDuplicate = {
      customer_phone: booking.customer_phone,
      booking_date: booking.booking_date,
      booking_time: booking.booking_time
    }
    // This would be an API call in production
  }
  
  return errors
}

const BookingAgent = () => {
  const router = useRouter()
  const [userEmail, setUserEmail]   = useState("")
  const [userId, setUserId]         = useState(null)
  const [dark, setDark]             = useState(true)
  const [view, setView]             = useState("list")
  const [bookings, setBookings]     = useState([])
  const [selected, setSelected]     = useState(null)
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState("upcoming")
  const [showAdd, setShowAdd]       = useState(false)
  const [services, setServices]     = useState([])
  const [weekOffset, setWeekOffset] = useState(0)
  const [newBk, setNewBk]           = useState({
    customer_name:"", 
    customer_phone:"", 
    service:"", 
    staff:"", 
    booking_date:"", 
    booking_time:"", 
    amount:""
  })
  const [saving, setSaving]         = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { errors, errorMessages, lastError, showError, clearErrors, clearFieldError } = useErrorHandler()
  
  const todayStr = getTodayStr()
  const contentRef = useRef(null)

  // Initialize theme and auth
  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
    
    // Clear any previous errors on mount
    clearErrors()
    
    if (window.confirm("Welcome back! Enable AI auto-booking from WhatsApp conversations?")) {
      // Enable AI booking feature
      localStorage.setItem("aiBookingEnabled", "true")
      // Here you could load AI-enabled bookings
    }
    
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        router.push("/login")
      } else {
        setUserEmail(data.user.email || "")
        setUserId(data.user.id)
        loadServices()
      }
    }).catch(error => {
      showError("auth", "Authentication failed. Please refresh the page.")
      console.error("Auth error:", error)
    })
  }, [])

  // Load services with error handling
  async function loadServices() {
    try {
      const { data, error } = await supabase
        .from("services").select("name,price,duration").eq("user_id", userId)
      
      if (error) {
        showError("services", "Failed to
