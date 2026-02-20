"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function Dashboard() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        router.push("/login")
      } else {
        setUserEmail(data.user.email)
      }
    }

    checkUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>Welcome to Fastrill Dashboard 🚀</h1>
      <p>Logged in as: {userEmail}</p>

      <button
        onClick={handleLogout}
        style={{
          marginTop: "20px",
          padding: "10px 15px",
          backgroundColor: "#111827",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer"
        }}
      >
        Logout
      </button>
    </div>
  )
}
