"use client"
export const dynamic = "force-dynamic"
import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export default function LoginPage() {
  const [step, setStep]       = useState("email") // email | otp | password
  const [mode, setMode]       = useState("otp")   // otp | password
  const [email, setEmail]     = useState("")
  const [otp, setOtp]         = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")
  const [message, setMessage] = useState("")
  const [resendTimer, setResendTimer] = useState(0)

  // Check if already logged in
  useEffect(() => {
    getSupabase().auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = "/dashboard"
    })
    // Check for error in URL
    const params = new URLSearchParams(window.location.search)
    if (params.get("error")) setError("Authentication failed. Please try again.")
  }, [])

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer])

  async function handleSendOTP(e) {
    e.preventDefault()
    if (!email.trim()) { setError("Please enter your email"); return }
    setLoading(true); setError("")
    try {
      const { error } = await getSupabase().auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: true }
      })
      if (error) throw error
      setStep("otp")
      setMessage("We sent a 6-digit code to " + email)
      setResendTimer(60)
    } catch(e) {
      setError(e.message || "Failed to send OTP. Please try again.")
    } finally { setLoading(false) }
  }

  async function handleVerifyOTP(e) {
    e.preventDefault()
    if (!otp.trim() || otp.length < 6) { setError("Please enter the 6-digit code"); return }
    setLoading(true); setError("")
    try {
      const { data, error } = await getSupabase().auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otp.trim(),
        type:  "email"
      })
      if (error) throw error
      // New user → onboarding, returning → dashboard
      const isNew = data.user?.created_at && (Date.now() - new Date(data.user.created_at).getTime()) < 10000
      window.location.href = isNew ? "/onboarding" : "/dashboard"
    } catch(e) {
      setError(e.message?.includes("expired") ? "Code expired. Please request a new one." : e.message?.includes("invalid") ? "Invalid code. Please check and try again." : "Verification failed. Please try again.")
    } finally { setLoading(false) }
  }

  async function handlePasswordLogin(e) {
    e.preventDefault()
    if (!email || !password) { setError("Please enter email and password"); return }
    setLoading(true); setError("")
    try {
      const { data, error } = await getSupabase().auth.signInWithPassword({
        email: email.trim().toLowerCase(), password
      })
      if (error) throw error
      window.location.href = "/dashboard"
    } catch(e) {
      setError(e.message?.includes("Invalid") ? "Incorrect email or password." : e.message || "Login failed.")
    } finally { setLoading(false) }
  }

  async function handleGoogleLogin() {
    setLoading(true); setError("")
    try {
      const { error } = await getSupabase().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/auth/callback" }
      })
      if (error) throw error
    } catch(e) {
      setError("Google login failed. Please try again.")
      setLoading(false)
    }
  }

  async function handleResendOTP() {
    if (resendTimer > 0) return
    setLoading(true); setError(""); setMessage("")
    try {
      const { error } = await getSupabase().auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: true }
      })
      if (error) throw error
      setMessage("New code sent to " + email)
      setResendTimer(60)
    } catch(e) {
      setError("Failed to resend. Please try again.")
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#fff", letterSpacing: "-1px" }}>
            fast<span style={{ color: "#00d4ff" }}>rill</span>
          </div>
          <p style={{ color: "#888", marginTop: "8px", fontSize: "14px" }}>WhatsApp AI for your business</p>
        </div>

        {/* Card */}
        <div style={{ background: "#111", border: "1px solid #222", borderRadius: "16px", padding: "32px" }}>

          {/* Error */}
          {error && <div style={{ background: "#2d1515", border: "1px solid #f87171", borderRadius: "8px", padding: "12px", marginBottom: "20px", color: "#f87171", fontSize: "14px" }}>{error}</div>}
          {message && <div style={{ background: "#0d2d1a", border: "1px solid #4ade80", borderRadius: "8px", padding: "12px", marginBottom: "20px", color: "#4ade80", fontSize: "14px" }}>{message}</div>}

          {/* Step: Email */}
          {step === "email" && (
            <>
              <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: "700", marginBottom: "8px" }}>Welcome back</h1>
              <p style={{ color: "#888", fontSize: "14px", marginBottom: "24px" }}>Sign in to your Fastrill account</p>

              {/* Google Button */}
              <button onClick={handleGoogleLogin} disabled={loading} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #333", background: "#1a1a1a", color: "#fff", fontSize: "15px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "20px", transition: "all 0.2s" }}>
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google <span style={{ color: "#555", fontSize: "12px" }}>(coming soon)</span>
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <div style={{ flex: 1, height: "1px", background: "#222" }} />
                <span style={{ color: "#555", fontSize: "13px" }}>or continue with email</span>
                <div style={{ flex: 1, height: "1px", background: "#222" }} />
              </div>

              {/* Mode toggle */}
              <div style={{ display: "flex", background: "#1a1a1a", borderRadius: "8px", padding: "4px", marginBottom: "20px" }}>
                {["otp","password"].map(m => (
                  <button key={m} onClick={() => { setMode(m); setError("") }} style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "none", background: mode === m ? "#00d4ff" : "transparent", color: mode === m ? "#000" : "#888", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}>
                    {m === "otp" ? "Email OTP" : "Password"}
                  </button>
                ))}
              </div>

              {mode === "otp" ? (
                <form onSubmit={handleSendOTP}>
                  <label style={{ display: "block", color: "#aaa", fontSize: "13px", marginBottom: "6px" }}>Email address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #333", background: "#1a1a1a", color: "#fff", fontSize: "15px", outline: "none", boxSizing: "border-box", marginBottom: "16px" }} />
                  <button type="submit" disabled={loading} style={{ width: "100%", padding: "13px", borderRadius: "10px", border: "none", background: loading ? "#333" : "linear-gradient(135deg, #00d4ff, #0099cc)", color: "#000", fontSize: "15px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer" }}>
                    {loading ? "Sending..." : "Send OTP →"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handlePasswordLogin}>
                  <label style={{ display: "block", color: "#aaa", fontSize: "13px", marginBottom: "6px" }}>Email address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #333", background: "#1a1a1a", color: "#fff", fontSize: "15px", outline: "none", boxSizing: "border-box", marginBottom: "12px" }} />
                  <label style={{ display: "block", color: "#aaa", fontSize: "13px", marginBottom: "6px" }}>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #333", background: "#1a1a1a", color: "#fff", fontSize: "15px", outline: "none", boxSizing: "border-box", marginBottom: "8px" }} />
                  <div style={{ textAlign: "right", marginBottom: "16px" }}>
                    <a href="/forgot-password" style={{ color: "#00d4ff", fontSize: "13px", textDecoration: "none" }}>Forgot password?</a>
                  </div>
                  <button type="submit" disabled={loading} style={{ width: "100%", padding: "13px", borderRadius: "10px", border: "none", background: loading ? "#333" : "linear-gradient(135deg, #00d4ff, #0099cc)", color: "#000", fontSize: "15px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer" }}>
                    {loading ? "Signing in..." : "Sign In →"}
                  </button>
                </form>
              )}

              <p style={{ textAlign: "center", marginTop: "20px", color: "#666", fontSize: "14px" }}>
                Don't have an account? <a href="/signup" style={{ color: "#00d4ff", textDecoration: "none", fontWeight: "600" }}>Sign up free</a>
              </p>
            </>
          )}

          {/* Step: OTP Verify */}
          {step === "otp" && (
            <>
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>📧</div>
                <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: "700", marginBottom: "8px" }}>Check your email</h1>
                <p style={{ color: "#888", fontSize: "14px" }}>Enter the 6-digit code sent to<br /><span style={{ color: "#fff" }}>{email}</span></p>
              </div>

              <form onSubmit={handleVerifyOTP}>
                <input
                  type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,"").substring(0,6))}
                  placeholder="000000" maxLength={6} autoFocus
                  style={{ width: "100%", padding: "16px", borderRadius: "10px", border: "1px solid #333", background: "#1a1a1a", color: "#fff", fontSize: "28px", fontWeight: "700", textAlign: "center", outline: "none", letterSpacing: "8px", boxSizing: "border-box", marginBottom: "16px" }}
                />
                <button type="submit" disabled={loading || otp.length < 6} style={{ width: "100%", padding: "13px", borderRadius: "10px", border: "none", background: otp.length < 6 ? "#333" : "linear-gradient(135deg, #00d4ff, #0099cc)", color: otp.length < 6 ? "#666" : "#000", fontSize: "15px", fontWeight: "700", cursor: otp.length < 6 ? "not-allowed" : "pointer", marginBottom: "16px" }}>
                  {loading ? "Verifying..." : "Verify Code →"}
                </button>
              </form>

              <div style={{ textAlign: "center" }}>
                <button onClick={handleResendOTP} disabled={resendTimer > 0 || loading} style={{ background: "none", border: "none", color: resendTimer > 0 ? "#555" : "#00d4ff", fontSize: "14px", cursor: resendTimer > 0 ? "not-allowed" : "pointer" }}>
                  {resendTimer > 0 ? "Resend in " + resendTimer + "s" : "Resend code"}
                </button>
              </div>

              <button onClick={() => { setStep("email"); setOtp(""); setError(""); setMessage("") }} style={{ width: "100%", marginTop: "16px", padding: "10px", borderRadius: "8px", border: "1px solid #333", background: "transparent", color: "#888", fontSize: "14px", cursor: "pointer" }}>
                ← Change email
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
