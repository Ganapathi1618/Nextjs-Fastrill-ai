import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export function useAuth() {
  const [userId,    setUserId]    = useState(null)
  const [userEmail, setUserEmail] = useState("")
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id)
        setUserEmail(session.user.email || "")
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        setUserId(session.user.id)
        setUserEmail(session.user.email || "")
      } else {
        setUserId(null)
        setUserEmail("")
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { userId, userEmail, loading }
}
