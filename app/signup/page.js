"use client"
import { useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function SignupPage() {
  const [email, setEmail]     = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp]         = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")
  const [message, setMessage] = useState("")

  async function handleGoogleSignup() {
    setLoading(true); setError("")
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth/callback" }
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  async function handleSendOTP(e) {
    e.preventDefault()
    if (!email.trim()) { setError("Please enter your email"); return }
    setLoading(true); setError("")
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true }
    })
    if (error) { setError(error.message); setLoading(false); return }
    setOtpSent(true)
    setMessage("OTP sent to " + email + " — check your inbox")
    setLoading(false)
  }

  async function handleVerifyOTP(e) {
    e.preventDefault()
    if (!otp.trim()) { setError("Please enter the OTP"); return }
    setLoading(true); setError("")
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: "email"
    })
    if (error) { setError(error.message); setLoading(false); return }
    const created = data?.user?.created_at
    const isNew   = created && (Date.now() - new Date(created).getTime()) < 10000
    window.location.href = isNew ? "/onboarding" : "/dashboard"
  }

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Inter,sans-serif" }}>
      <div style={{ width:"100%", maxWidth:420, padding:"0 20px" }}>

        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontSize:28, fontWeight:700, color:"#fff", letterSpacing:-1 }}>fast<span style={{ color:"#25D366" }}>rill</span></div>
          <p style={{ color:"#666", marginTop:8, fontSize:14 }}>AI customer service for your business</p>
        </div>

        <div style={{ background:"#111", border:"1px solid #222", borderRadius:16, padding:32 }}>
          <h1 style={{ color:"#fff", fontSize:22, fontWeight:600, margin:"0 0 8px" }}>Create your account</h1>
          <p style={{ color:"#555", fontSize:14, margin:"0 0 28px" }}>Get started free — no credit card needed</p>

          <button onClick={handleGoogleSignup} disabled={loading} style={{ width:"100%", padding:"12px 16px", background:"#fff", border:"none", borderRadius:10, fontSize:15, fontWeight:500, color:"#111", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:20, opacity:loading?0.7:1 }}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M47.5 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h13.2c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.3-10.6 7.3-17.3z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.9-6c-2.2 1.5-5 2.3-8 2.3-6.1 0-11.3-4.1-13.2-9.7H2.6v6.2C6.6 42.7 14.8 48 24 48z"/><path fill="#FBBC05" d="M10.8 28.8c-.5-1.5-.8-3-.8-4.8s.3-3.3.8-4.8v-6.2H2.6C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.9l8.2-6.1z"/><path fill="#EA4335" d="M24 9.5c3.4 0 6.5 1.2 8.9 3.5l6.6-6.6C35.9 2.5 30.5 0 24 0 14.8 0 6.6 5.3 2.6 13.1l8.2 6.2C12.7 13.6 17.9 9.5 24 9.5z"/></svg>
            Continue with Google
          </button>

          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
            <div style={{ flex:1, height:1, background:"#222" }}/>
            <span style={{ color:"#444", fontSize:13 }}>or continue with email</span>
            <div style={{ flex:1, height:1, background:"#222" }}/>
          </div>

          {!otpSent ? (
            <form onSubmit={handleSendOTP}>
              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", color:"#888", fontSize:13, marginBottom:6 }}>Email address</label>
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError("") }} placeholder="you@business.com" required style={{ width:"100%", padding:"12px 14px", background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:10, color:"#fff", fontSize:15, outline:"none", boxSizing:"border-box" }}/>
              </div>
              {error && <p style={{ color:"#ff4444", fontSize:13, marginBottom:12 }}>{error}</p>}
              <button type="submit" disabled={loading} style={{ width:"100%", padding:"13px", background:"#25D366", border:"none", borderRadius:10, color:"#fff", fontSize:15, fontWeight:600, cursor:"pointer", opacity:loading?0.7:1 }}>
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP}>
              {message && <p style={{ color:"#25D366", fontSize:13, marginBottom:16, textAlign:"center" }}>{message}</p>}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", color:"#888", fontSize:13, marginBottom:6 }}>Enter 6-digit OTP</label>
                <input type="text" value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/,"")); setError("") }} placeholder="000000" maxLength={6} required style={{ width:"100%", padding:"12px 14px", background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:10, color:"#fff", fontSize:24, letterSpacing:10, textAlign:"center", outline:"none", boxSizing:"border-box" }}/>
              </div>
              {error && <p style={{ color:"#ff4444", fontSize:13, marginBottom:12 }}>{error}</p>}
              <button type="submit" disabled={loading} style={{ width:"100%", padding:"13px", background:"#25D366", border:"none", borderRadius:10, color:"#fff", fontSize:15, fontWeight:600, cursor:"pointer", opacity:loading?0.7:1 }}>
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>
              <button type="button" onClick={() => { setOtpSent(false); setOtp(""); setError("") }} style={{ width:"100%", padding:"10px", background:"transparent", border:"none", color:"#555", fontSize:13, cursor:"pointer", marginTop:8 }}>
                ← Use different email
              </button>
            </form>
          )}

          <p style={{ color:"#444", fontSize:13, textAlign:"center", marginTop:20, marginBottom:0 }}>
            Already have an account?{" "}
            <a href="/login" style={{ color:"#25D366", textDecoration:"none" }}>Sign in</a>
          </p>
        </div>

        <p style={{ color:"#333", fontSize:12, textAlign:"center", marginTop:20 }}>
          By signing up you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  )
}
