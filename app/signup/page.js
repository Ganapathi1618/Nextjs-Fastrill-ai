"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Signup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) {
      alert(error.message)
    } else {
      setDone(true)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080c10; font-family: 'DM Sans', sans-serif; }

        .auth-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        /* LEFT PANEL */
        .auth-left {
          background: #0d1117;
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex; flex-direction: column;
          padding: 40px;
          position: relative; overflow: hidden;
        }
        .auth-left::before {
          content: '';
          position: absolute;
          top: -120px; left: -80px;
          width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(0,229,160,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .auth-left::after {
          content: '';
          position: absolute;
          bottom: -100px; right: -60px;
          width: 300px; height: 300px; border-radius: 50%;
          background: radial-gradient(circle, rgba(0,153,255,0.06) 0%, transparent 70%);
          pointer-events: none;
        }
        .left-logo {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 22px; color: #fff; text-decoration: none;
          position: relative; z-index: 1;
        }
        .left-logo span { color: #00e5a0; }

        .left-content {
          flex: 1; display: flex; flex-direction: column;
          justify-content: center; position: relative; z-index: 1;
        }
        .left-eyebrow {
          font-size: 11px; font-weight: 500; letter-spacing: 3px;
          text-transform: uppercase; color: #00e5a0;
          margin-bottom: 20px;
          display: flex; align-items: center; gap: 10px;
        }
        .left-eyebrow::before { content: ''; display: block; width: 24px; height: 1px; background: #00e5a0; opacity: 0.5; }
        .left-title {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: clamp(32px, 3.5vw, 48px);
          line-height: 1.05; letter-spacing: -1.5px; color: #fff;
          margin-bottom: 20px;
        }
        .left-title em { font-style: normal; color: #00e5a0; }
        .left-sub {
          font-size: 15px; line-height: 1.75;
          color: rgba(255,255,255,0.4); font-weight: 300;
          max-width: 380px; margin-bottom: 40px;
        }
        .left-features { display: flex; flex-direction: column; gap: 14px; }
        .feat-row { display: flex; align-items: center; gap: 12px; }
        .feat-check {
          width: 22px; height: 22px; border-radius: 6px;
          background: rgba(0,229,160,0.1); border: 1px solid rgba(0,229,160,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; color: #00e5a0; flex-shrink: 0;
        }
        .feat-text { font-size: 14px; color: rgba(255,255,255,0.5); font-weight: 300; }

        .left-footer {
          position: relative; z-index: 1;
          font-size: 12px; color: rgba(255,255,255,0.2);
        }

        /* RIGHT PANEL */
        .auth-right {
          background: #080c10;
          display: flex; align-items: center; justify-content: center;
          padding: 40px 24px;
        }
        .auth-card {
          width: 100%; max-width: 400px;
        }
        .auth-card-title {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 26px; letter-spacing: -0.8px; color: #fff;
          margin-bottom: 6px;
        }
        .auth-card-sub {
          font-size: 14px; color: rgba(255,255,255,0.35);
          font-weight: 300; margin-bottom: 36px;
        }
        .auth-card-sub a {
          color: #00e5a0; text-decoration: none; font-weight: 500;
        }
        .auth-card-sub a:hover { text-decoration: underline; }

        /* SUCCESS STATE */
        .success-box {
          text-align: center; padding: 32px 0;
        }
        .success-icon {
          width: 64px; height: 64px; border-radius: 50%;
          background: rgba(0,229,160,0.1); border: 1px solid rgba(0,229,160,0.25);
          display: flex; align-items: center; justify-content: center;
          font-size: 28px; margin: 0 auto 20px;
        }
        .success-title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 20px; color: #fff; margin-bottom: 10px; }
        .success-sub { font-size: 14px; color: rgba(255,255,255,0.4); font-weight: 300; line-height: 1.6; }

        /* FORM */
        .field { margin-bottom: 18px; }
        .field-label {
          display: block; font-size: 12px; font-weight: 500;
          color: rgba(255,255,255,0.45); letter-spacing: 0.5px;
          margin-bottom: 8px; text-transform: uppercase;
        }
        .field-input-wrap { position: relative; }
        .field-input {
          width: 100%; padding: 13px 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; color: #fff;
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          outline: none; transition: border-color 0.2s, background 0.2s;
          -webkit-appearance: none;
        }
        .field-input::placeholder { color: rgba(255,255,255,0.2); }
        .field-input:focus {
          border-color: rgba(0,229,160,0.35);
          background: rgba(0,229,160,0.03);
        }
        .field-input.has-toggle { padding-right: 48px; }
        .toggle-btn {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.25); font-size: 16px;
          display: flex; align-items: center; justify-content: center;
          transition: color 0.2s; padding: 4px;
          line-height: 1;
        }
        .toggle-btn:hover { color: rgba(255,255,255,0.6); }

        .submit-btn {
          width: 100%; padding: 14px;
          background: #00e5a0; color: #080c10;
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 15px; border: none; border-radius: 10px;
          cursor: pointer; transition: opacity 0.2s, transform 0.15s;
          margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .submit-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .divider {
          display: flex; align-items: center; gap: 12px;
          margin: 24px 0;
        }
        .divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.06); }
        .divider-text { font-size: 12px; color: rgba(255,255,255,0.2); }

        .login-link-row {
          text-align: center; margin-top: 24px;
          font-size: 14px; color: rgba(255,255,255,0.3);
        }
        .login-link-row a {
          color: #00e5a0; text-decoration: none; font-weight: 500;
        }
        .login-link-row a:hover { text-decoration: underline; }

        .terms-note {
          text-align: center; margin-top: 20px;
          font-size: 11px; color: rgba(255,255,255,0.15); line-height: 1.6;
        }
        .terms-note a { color: rgba(255,255,255,0.3); text-decoration: none; }
        .terms-note a:hover { color: #00e5a0; }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .auth-root { grid-template-columns: 1fr; }
          .auth-left { display: none; }
          .auth-right { padding: 40px 24px; }
        }
      `}</style>

      <div className="auth-root">
        {/* LEFT — BRAND PANEL */}
        <div className="auth-left">
          <a href="/" className="left-logo">fast<span>rill</span></a>

          <div className="left-content">
            <div className="left-eyebrow">WhatsApp Growth Engine</div>
            <h1 className="left-title">
              Turn every message<br />into a <em>conversion.</em>
            </h1>
            <p className="left-sub">
              Fastrill understands real customer intent and replies instantly — like your best sales rep, available 24/7.
            </p>
            <div className="left-features">
              {[
                "Intent-based auto replies in under 2 seconds",
                "Connect WhatsApp Business in 3 minutes",
                "Campaign manager with conversion tracking",
                "Free plan — no credit card required",
              ].map((f) => (
                <div key={f} className="feat-row">
                  <div className="feat-check">✓</div>
                  <div className="feat-text">{f}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="left-footer">
            © {new Date().getFullYear()} Fastrill · Solvabil Technologies
          </div>
        </div>

        {/* RIGHT — FORM PANEL */}
        <div className="auth-right">
          <div className="auth-card">
            {done ? (
              <div className="success-box">
                <div className="success-icon">✉️</div>
                <div className="success-title">Check your inbox!</div>
                <div className="success-sub">
                  We sent a confirmation link to<br />
                  <strong style={{color:"#fff"}}>{email}</strong><br /><br />
                  Click the link to activate your account and get started.
                </div>
              </div>
            ) : (
              <>
                <div className="auth-card-title">Create your account</div>
                <div className="auth-card-sub">
                  Already have an account? <a href="/login">Sign in →</a>
                </div>

                <form onSubmit={handleSignup}>
                  <div className="field">
                    <label className="field-label">Email address</label>
                    <div className="field-input-wrap">
                      <input
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="field-input"
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label className="field-label">Password</label>
                    <div className="field-input-wrap">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="field-input has-toggle"
                      />
                      <button
                        type="button"
                        className="toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          /* Eye-off SVG */
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                            <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        ) : (
                          /* Eye SVG */
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={loading}
                  >
                    {loading ? "Creating account..." : "Create free account →"}
                  </button>
                </form>

                <div className="login-link-row">
                  Already have an account? <a href="/login">Sign in here</a>
                </div>

                <div className="terms-note">
                  By signing up you agree to our{" "}
                  <a href="/terms">Terms of Service</a> and{" "}
                  <a href="/privacy">Privacy Policy</a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
