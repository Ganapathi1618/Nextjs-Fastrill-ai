"use client"
import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function SignupPage() {
  const [step, setStep]       = useState("signup") // signup | verify
  const [name, setName]       = useState("")
  const [email, setEmail]     = useState("")
  const [password, setPass]   = useState("")
  const [biz, setBiz]         = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")
  const [show, setShow]       = useState(false)

  async function handleSignup(e) {
    e.preventDefault()
    setError("")
    if (!name.trim())     return setError("Enter your name")
    if (!biz.trim())      return setError("Enter your business name")
    if (!email.trim())    return setError("Enter your email")
    if (password.length < 8) return setError("Password must be at least 8 characters")

    setLoading(true)
    try {
      const { data, error: signupErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, business_name: biz },
          emailRedirectTo: `${location.origin}/onboarding`,
        },
      })
      if (signupErr) throw signupErr

      // Also create business_settings row
      if (data?.user) {
        await supabase.from("business_settings").upsert({
          user_id:       data.user.id,
          business_name: biz,
          created_at:    new Date().toISOString(),
        }, { onConflict: "user_id" })
      }

      setStep("verify")
    } catch(err) {
      setError(err.message || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options:  { redirectTo: `${location.origin}/onboarding` },
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  if (step === "verify") return <VerifyScreen email={email} />

  return (
    <>
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:#0d1117;font-family:'Plus Jakarta Sans',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.page{display:grid;grid-template-columns:1fr 1fr;min-height:100vh;width:100%;max-width:1100px;margin:0 auto;gap:0;border-radius:20px;overflow:hidden;box-shadow:0 40px 120px rgba(0,0,0,.5)}
.left{background:linear-gradient(135deg,#0d2818 0%,#0d1117 60%);padding:60px 48px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden;border-right:1px solid rgba(46,160,67,.15)}
.left::before{content:'';position:absolute;top:-100px;left:-100px;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(46,160,67,.12) 0%,transparent 70%)}
.left::after{content:'';position:absolute;bottom:-80px;right:-80px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(46,160,67,.07) 0%,transparent 70%)}
.left-content{position:relative;z-index:1}
.brand{font-size:22px;font-weight:800;color:#fff;text-decoration:none;letter-spacing:-.5px;display:inline-block;margin-bottom:56px}
.brand span{color:#3fb950}
.left h2{font-size:36px;font-weight:800;color:#fff;line-height:1.2;margin-bottom:20px;letter-spacing:-.02em}
.left h2 em{font-style:normal;color:#3fb950}
.left p{font-size:15px;color:rgba(255,255,255,.55);line-height:1.7;margin-bottom:40px}
.proof-list{display:flex;flex-direction:column;gap:14px}
.proof-item{display:flex;align-items:flex-start;gap:12px;font-size:14px;color:rgba(255,255,255,.7);line-height:1.5}
.proof-icon{width:28px;height:28px;border-radius:8px;background:rgba(46,160,67,.15);border:1px solid rgba(46,160,67,.25);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;margin-top:1px}
.testimonial{position:relative;z-index:1;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:20px}
.test-text{font-size:13.5px;color:rgba(255,255,255,.6);line-height:1.7;font-style:italic;margin-bottom:14px}
.test-auth{display:flex;align-items:center;gap:10px}
.test-av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#ef4444);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#fff}
.test-nm{font-size:13px;font-weight:600;color:#fff}
.test-bz{font-size:11.5px;color:rgba(255,255,255,.4)}
.right{background:#161b22;padding:60px 48px;display:flex;flex-direction:column;justify-content:center}
.form-title{font-size:26px;font-weight:800;color:#f0f6fc;margin-bottom:6px;letter-spacing:-.02em}
.form-sub{font-size:14px;color:#8b949e;margin-bottom:32px}
.form-sub a{color:#3fb950;text-decoration:none;font-weight:600}
.form-sub a:hover{text-decoration:underline}
.g-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;background:#21262d;border:1px solid rgba(240,246,252,.12);border-radius:9px;padding:12px;font-size:14.5px;font-weight:600;color:#f0f6fc;cursor:pointer;transition:all .2s;margin-bottom:20px}
.g-btn:hover{background:#2d333b;border-color:rgba(240,246,252,.2)}
.g-btn:disabled{opacity:.5;cursor:not-allowed}
.divider{display:flex;align-items:center;gap:12px;margin-bottom:20px}
.div-line{flex:1;height:1px;background:rgba(240,246,252,.08)}
.div-txt{font-size:12px;color:#6e7681;font-weight:500}
.row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.field{margin-bottom:16px}
.field label{display:block;font-size:13px;font-weight:600;color:#8b949e;margin-bottom:6px;letter-spacing:.2px}
.field input{width:100%;background:#0d1117;border:1px solid rgba(240,246,252,.1);border-radius:9px;padding:11px 14px;font-size:14.5px;color:#f0f6fc;font-family:inherit;transition:all .2s;outline:none}
.field input:focus{border-color:#2ea043;box-shadow:0 0 0 3px rgba(46,160,67,.1)}
.field input::placeholder{color:#6e7681}
.pass-wrap{position:relative}
.pass-wrap input{padding-right:44px}
.pass-toggle{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#6e7681;font-size:16px;padding:0;transition:color .15s}
.pass-toggle:hover{color:#8b949e}
.error{background:rgba(248,81,73,.08);border:1px solid rgba(248,81,73,.25);border-radius:8px;padding:10px 14px;font-size:13.5px;color:#f85149;margin-bottom:16px}
.submit{width:100%;background:#238636;border:1px solid #2ea043;border-radius:9px;padding:13px;font-size:15px;font-weight:700;color:#fff;cursor:pointer;transition:all .2s;font-family:inherit;margin-top:4px}
.submit:hover:not(:disabled){background:#2ea043;box-shadow:0 0 0 3px rgba(46,160,67,.2)}
.submit:disabled{opacity:.6;cursor:not-allowed}
.terms{font-size:12px;color:#6e7681;text-align:center;margin-top:14px;line-height:1.6}
.terms a{color:#3fb950;text-decoration:none}
@media(max-width:768px){
  body{padding:0;align-items:flex-start}
  .page{grid-template-columns:1fr;border-radius:0;box-shadow:none;min-height:100vh}
  .left{display:none}
  .right{padding:40px 24px;min-height:100vh;justify-content:flex-start;padding-top:60px}
  .mobile-logo{display:block!important}
  .row{grid-template-columns:1fr}
}
.mobile-logo{display:none;font-size:20px;font-weight:800;color:#f0f6fc;text-decoration:none;letter-spacing:-.5px;margin-bottom:32px}
.mobile-logo span{color:#3fb950}
    `}</style>

    <div className="page">
      {/* LEFT — branding */}
      <div className="left">
        <div className="left-content">
          <a href="/" className="brand">fast<span>rill</span></a>
          <h2>Your WhatsApp replies like your <em>best employee</em></h2>
          <p>Join hundreds of salons, clinics, and service businesses that never miss a customer message again.</p>
          <div className="proof-list">
            {[
              {i:"⚡", t:"AI replies in under 2 seconds, 24/7"},
              {i:"🇮🇳", t:"Works in Hindi, Telugu, Tamil + 7 more languages"},
              {i:"📅", t:"Books appointments automatically while you sleep"},
              {i:"🎯", t:"Recovers leads that would have been lost forever"},
            ].map(p=>(
              <div key={p.t} className="proof-item">
                <div className="proof-icon">{p.i}</div>
                <span>{p.t}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="testimonial">
          <div className="test-text">"Before Fastrill I was losing bookings at night. Now I wake up to confirmed appointments every morning. It paid for itself in week one."</div>
          <div className="test-auth">
            <div className="test-av">P</div>
            <div>
              <div className="test-nm">Priya Sharma</div>
              <div className="test-bz">Glow Beauty Parlour, Hyderabad</div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — form */}
      <div className="right">
        <a href="/" className="mobile-logo">fast<span>rill</span></a>
        <div className="form-title">Create your account</div>
        <div className="form-sub">Already have an account? <a href="/login">Sign in</a></div>

        {/* Google */}
        <button className="g-btn" onClick={handleGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continue with Google
        </button>

        <div className="divider">
          <div className="div-line"/><div className="div-txt">or</div><div className="div-line"/>
        </div>

        <form onSubmit={handleSignup}>
          <div className="row">
            <div className="field">
              <label>Your Name</label>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Priya Sharma" autoComplete="name"/>
            </div>
            <div className="field">
              <label>Business Name</label>
              <input value={biz} onChange={e=>setBiz(e.target.value)} placeholder="Glow Salon"/>
            </div>
          </div>
          <div className="field">
            <label>Email Address</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="priya@glowsalon.com" autoComplete="email"/>
          </div>
          <div className="field">
            <label>Password</label>
            <div className="pass-wrap">
              <input type={show?"text":"password"} value={password} onChange={e=>setPass(e.target.value)} placeholder="Min. 8 characters" autoComplete="new-password"/>
              <button type="button" className="pass-toggle" onClick={()=>setShow(!show)}>{show?"🙈":"👁️"}</button>
            </div>
          </div>
          {error && <div className="error">{error}</div>}
          <button className="submit" disabled={loading}>
            {loading ? "Creating account…" : "Create Free Account →"}
          </button>
        </form>
        <div className="terms">
          By signing up you agree to our <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.<br/>No credit card required. 14-day free trial.
        </div>
      </div>
    </div>
    </>
  )
}

function VerifyScreen({ email }) {
  return (
    <>
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0d1117;font-family:'Plus Jakarta Sans',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:#161b22;border:1px solid rgba(240,246,252,.1);border-radius:20px;padding:48px 40px;max-width:440px;width:100%;text-align:center}
.icon{font-size:48px;margin-bottom:20px;display:block}
h2{font-size:24px;font-weight:800;color:#f0f6fc;margin-bottom:10px;letter-spacing:-.02em}
p{font-size:14.5px;color:#8b949e;line-height:1.7;margin-bottom:6px}
.em{color:#f0f6fc;font-weight:600}
.note{background:rgba(46,160,67,.08);border:1px solid rgba(46,160,67,.2);border-radius:10px;padding:14px;font-size:13.5px;color:rgba(240,246,252,.7);margin-top:24px;line-height:1.6}
.back{display:inline-block;margin-top:20px;font-size:13.5px;color:#3fb950;text-decoration:none;font-weight:600}
    `}</style>
    <div className="card">
      <span className="icon">📬</span>
      <h2>Check your email</h2>
      <p>We sent a verification link to</p>
      <p className="em">{email}</p>
      <div className="note">
        Click the link in the email to verify your account and get started.<br/><br/>
        Can't find it? Check your spam folder.
      </div>
      <a href="/login" className="back">← Back to login</a>
    </div>
    </>
  )
}
