"use client"
import { useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")
  const [sent, setSent]       = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) { setError("Please enter your email"); return }
    setLoading(true); setError("")
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: window.location.origin + "/reset-password"
      })
      if (error) throw error
      setSent(true)
    } catch(e) {
      setError(e.message || "Failed to send reset email. Please try again.")
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#fff", letterSpacing: "-1px" }}>fast<span style={{ color: "#00d4ff" }}>rill</span></div>
        </div>
        <div style={{ background: "#111", border: "1px solid #222", borderRadius: "16px", padding: "32px" }}>
          {!sent ? (
            <>
              <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: "700", marginBottom: "8px" }}>Forgot password?</h1>
              <p style={{ color: "#888", fontSize: "14px", marginBottom: "24px" }}>Enter your email and we'll send a reset link</p>
              {error && <div style={{ background: "#2d1515", border: "1px solid #f87171", borderRadius: "8px", padding: "12px", marginBottom: "20px", color: "#f87171", fontSize: "14px" }}>{error}</div>}
              <form onSubmit={handleSubmit}>
                <label style={{ display: "block", color: "#aaa", fontSize: "13px", marginBottom: "6px" }}>Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #333", background: "#1a1a1a", color: "#fff", fontSize: "15px", outline: "none", boxSizing: "border-box", marginBottom: "16px" }} />
                <button type="submit" disabled={loading} style={{ width: "100%", padding: "13px", borderRadius: "10px", border: "none", background: loading ? "#333" : "linear-gradient(135deg, #00d4ff, #0099cc)", color: "#000", fontSize: "15px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer" }}>
                  {loading ? "Sending..." : "Send reset link →"}
                </button>
              </form>
              <p style={{ textAlign: "center", marginTop: "20px" }}>
                <a href="/login" style={{ color: "#00d4ff", fontSize: "14px", textDecoration: "none" }}>← Back to login</a>
              </p>
            </>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📬</div>
              <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: "700", marginBottom: "8px" }}>Check your inbox</h1>
              <p style={{ color: "#888", fontSize: "14px", marginBottom: "24px" }}>We sent a password reset link to<br /><span style={{ color: "#fff" }}>{email}</span></p>
              <p style={{ color: "#555", fontSize: "13px", marginBottom: "24px" }}>Didn't get it? Check spam or <button onClick={() => setSent(false)} style={{ background: "none", border: "none", color: "#00d4ff", cursor: "pointer", fontSize: "13px" }}>try again</button></p>
              <a href="/login" style={{ display: "block", padding: "13px", borderRadius: "10px", background: "#1a1a1a", border: "1px solid #333", color: "#fff", textDecoration: "none", fontSize: "15px" }}>← Back to login</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
