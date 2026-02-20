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

  const handleConnect = () => {
    const appId = "YOUR_APP_ID" // <-- replace this with your real App ID

    const redirectUri =
      "https://fastrill-fastrills-projects.vercel.app/api/meta/callback"

    const scope =
      "whatsapp_business_management,whatsapp_business_messaging,business_management"

    window.location.href =
      `https://www.facebook.com/v18.0/dialog/oauth?client_id=${780799931531576}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>Welcome to Fastrill Dashboard 🚀</h1>
      <p>Logged in as: {userEmail}</p>

      <button
        onClick={handleConnect}
        style={{
          marginTop: "20px",
          marginRight: "10px",
          padding: "10px 15px",
          backgroundColor: "#1877f2",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer"
        }}
      >
        Connect WhatsApp
      </button>

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
