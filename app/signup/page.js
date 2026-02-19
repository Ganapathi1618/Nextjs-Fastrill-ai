"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Signup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSignup = async (e) => {
    e.preventDefault()

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      alert("Check your email for confirmation!")
    }
  }

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#f3f4f6"
    }}>
      <div style={{
        width: "350px",
        padding: "30px",
        background: "white",
        borderRadius: "10px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{ marginBottom: "20px", textAlign: "center" }}>
          Fastrill Signup
        </h2>

        <form onSubmit={handleSignup}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "15px",
              borderRadius: "6px",
              border: "1px solid #ddd"
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "20px",
              borderRadius: "6px",
              border: "1px solid #ddd"
            }}
          />

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#111827",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  )
}
