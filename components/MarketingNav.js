"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"

const NAV_ITEMS = [
  {
    label: "Features", dropdown: [
      { label: "AI Conversations", desc: "Replies in under 2 seconds", href: "/features#ai" },
      { label: "Booking Automation", desc: "Books appointments end-to-end", href: "/features#booking" },
      { label: "WhatsApp Campaigns", desc: "Broadcast & track revenue", href: "/features#campaigns" },
      { label: "Smart Inbox", desc: "One inbox, full control", href: "/features#inbox" },
      { label: "Lead Recovery", desc: "Win back silent leads", href: "/features#lead-recovery" },
      { label: "Appointment Reminders", desc: "Reduce no-shows automatically", href: "/features#reminders" },
    ]
  },
  {
    label: "Industries", dropdown: [
      { label: "Salons & Spas", desc: "Bookings, reminders, win-backs", href: "/industries/salons" },
      { label: "Clinics & Healthcare", desc: "Patient scheduling in any language", href: "/industries/clinics" },
      { label: "Coaching & Education", desc: "Enroll students automatically", href: "/industries/coaching" },
      { label: "Real Estate", desc: "Qualify leads 24/7", href: "/industries/real-estate" },
      { label: "Gyms & Fitness", desc: "Fill every time slot", href: "/industries/gyms" },
    ]
  },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
]

export default function MarketingNav() {
  const [open, setOpen] = useState(null)
  const [mobOpen, setMobOpen] = useState(false)
  const [mobExpanded, setMobExpanded] = useState(null)
  const navRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpen(null)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    if (mobOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [mobOpen])

  return (
    <>
      <style>{`
        .mn-bar{position:fixed;top:0;left:0;right:0;z-index:500;height:80px;display:flex;align-items:center;padding:0 clamp(16px,4vw,52px);background:#fff;border-bottom:1px solid #EAECF0;box-shadow:0 1px 3px rgba(0,0,0,.06)}
        .mn-logo{display:flex;align-items:center;gap:10px;text-decoration:none;flex-shrink:0}
        .mn-logo img{width:34px;height:34px;object-fit:contain}
        .mn-logo-text{font-weight:800;font-size:20px;color:#1A1D23;letter-spacing:-.03em;font-family:'Plus Jakarta Sans',sans-serif}
        .mn-logo-text em{font-style:normal;color:#00D4AA}
        .mn-center{display:flex;align-items:center;gap:4px;margin:0 auto}
        .mn-item{position:relative}
        .mn-btn{display:flex;align-items:center;gap:5px;padding:9px 14px;font-size:14px;font-weight:500;color:#4B5563;background:none;border:none;cursor:pointer;border-radius:8px;font-family:inherit;transition:color .15s,background .15s;text-decoration:none;white-space:nowrap}
        .mn-btn:hover,.mn-btn.active{color:#1A1D23;background:#F3F4F6}
        .mn-chevron{width:14px;height:14px;transition:transform .2s;opacity:.5}
        .mn-item.op .mn-chevron{transform:rotate(180deg)}
        .mn-drop{position:absolute;top:calc(100% + 12px);left:50%;transform:translateX(-50%);background:#fff;border:1px solid #E5E7EB;border-radius:14px;padding:8px;min-width:270px;box-shadow:0 8px 32px rgba(0,0,0,.12);animation:mnDropIn .15s ease;z-index:10}
        @keyframes mnDropIn{from{opacity:0;transform:translateX(-50%) translateY(-6px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        .mn-drop-item{display:flex;flex-direction:column;gap:2px;padding:10px 14px;border-radius:9px;text-decoration:none;transition:background .12s}
        .mn-drop-item:hover{background:#F9FAFB}
        .mn-drop-label{font-size:14px;font-weight:600;color:#1A1D23}
        .mn-drop-desc{font-size:12px;color:#6B7280;margin-top:2px}
        .mn-right{display:flex;align-items:center;gap:10px;flex-shrink:0}
        .mn-signin{font-size:14px;font-weight:500;color:#4B5563;text-decoration:none;padding:9px 14px;border-radius:8px;transition:color .15s,background .15s}
        .mn-signin:hover{color:#1A1D23;background:#F3F4F6}
        .mn-cta{display:inline-flex;align-items:center;gap:6px;background:#5A5FE8;color:#fff;padding:10px 20px;border-radius:9px;font-weight:700;font-size:14px;text-decoration:none;transition:background .15s;font-family:'Plus Jakarta Sans',sans-serif;white-space:nowrap}
        .mn-cta:hover{background:#4449D0}
        .mn-hbg{display:none;background:none;border:1px solid #E5E7EB;border-radius:8px;width:40px;height:40px;align-items:center;justify-content:center;cursor:pointer;color:#4B5563;font-size:18px;flex-shrink:0}

        /* MOBILE DRAWER */
        .mn-mob{position:fixed;top:80px;left:0;right:0;bottom:0;z-index:490;background:#fff;overflow-y:auto;transform:translateX(100%);transition:transform .25s ease}
        .mn-mob.open{transform:none}
        .mn-mob-inner{padding:8px 16px 32px}
        .mn-mob-item{border-bottom:1px solid #F3F4F6}
        .mn-mob-btn{width:100%;background:none;border:none;display:flex;justify-content:space-between;align-items:center;padding:16px 4px;font-size:15px;font-weight:600;color:#1A1D23;cursor:pointer;font-family:inherit;text-align:left}
        .mn-mob-link{display:block;padding:16px 4px;font-size:15px;font-weight:600;color:#1A1D23;text-decoration:none}
        .mn-mob-sub{overflow:hidden;max-height:0;transition:max-height .25s ease}
        .mn-mob-sub.open{max-height:400px}
        .mn-mob-sub-inner{padding:4px 0 12px 4px;display:flex;flex-direction:column;gap:2px}
        .mn-mob-sublink{display:flex;flex-direction:column;gap:1px;padding:10px 12px;font-size:14px;color:#4B5563;text-decoration:none;border-radius:8px}
        .mn-mob-sublink:hover{background:#F9FAFB;color:#1A1D23}
        .mn-mob-sublink span{font-size:11.5px;color:#9CA3AF}
        .mn-mob-actions{padding:16px 0 8px;display:flex;flex-direction:column;gap:10px}
        .mn-mob-signin{display:block;text-align:center;padding:13px;border-radius:10px;font-size:15px;font-weight:600;color:#4B5563;text-decoration:none;border:1px solid #E5E7EB}
        .mn-mob-cta{display:block;text-align:center;background:#5A5FE8;color:#fff;padding:14px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none}

        @media(max-width:900px){.mn-center{display:none}.mn-signin{display:none}.mn-cta{display:none}.mn-hbg{display:inline-flex}}
        @media(min-width:901px){.mn-mob{display:none}}
      `}</style>

      <nav className="mn-bar" ref={navRef}>
        <Link href="/" className="mn-logo">
          <img src="/logo.png" alt="Fastrill" />
          <span className="mn-logo-text">fast<em>rill</em></span>
        </Link>

        <div className="mn-center">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.label}
              className={`mn-item${open === item.label ? " op" : ""}`}
              onMouseEnter={() => item.dropdown && setOpen(item.label)}
              onMouseLeave={() => setOpen(null)}
            >
              {item.href ? (
                <Link href={item.href} className="mn-btn">{item.label}</Link>
              ) : (
                <button
                  className={`mn-btn${open === item.label ? " active" : ""}`}
                  onClick={() => setOpen(open === item.label ? null : item.label)}
                >
                  {item.label}
                  <svg className="mn-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M6 9l6 6 6-6" /></svg>
                </button>
              )}
              {item.dropdown && open === item.label && (
                <div className="mn-drop">
                  {item.dropdown.map(d => (
                    <Link key={d.href} href={d.href} className="mn-drop-item" onClick={() => setOpen(null)}>
                      <span className="mn-drop-label">{d.label}</span>
                      <span className="mn-drop-desc">{d.desc}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mn-right">
          <Link href="/login" className="mn-signin">Sign in</Link>
          <Link href="/signup" className="mn-cta">Start free trial →</Link>
          <button
            className="mn-hbg"
            onClick={() => setMobOpen(p => !p)}
            aria-label={mobOpen ? "Close menu" : "Open menu"}
          >
            {mobOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      <div className={`mn-mob${mobOpen ? " open" : ""}`}>
        <div className="mn-mob-inner">
          {NAV_ITEMS.map(item => (
            <div key={item.label} className="mn-mob-item">
              {item.href ? (
                <Link href={item.href} className="mn-mob-link" onClick={() => setMobOpen(false)}>{item.label}</Link>
              ) : (
                <>
                  <button
                    className="mn-mob-btn"
                    onClick={() => setMobExpanded(mobExpanded === item.label ? null : item.label)}
                  >
                    {item.label}
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ transform: mobExpanded === item.label ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }}><path d="M6 9l6 6 6-6" /></svg>
                  </button>
                  <div className={`mn-mob-sub${mobExpanded === item.label ? " open" : ""}`}>
                    <div className="mn-mob-sub-inner">
                      {item.dropdown.map(d => (
                        <Link key={d.href} href={d.href} className="mn-mob-sublink" onClick={() => { setMobOpen(false); setMobExpanded(null) }}>
                          {d.label}
                          <span>{d.desc}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
          <div className="mn-mob-actions">
            <Link href="/login" className="mn-mob-signin" onClick={() => setMobOpen(false)}>Sign in</Link>
            <Link href="/signup" className="mn-mob-cta" onClick={() => setMobOpen(false)}>Start free trial →</Link>
          </div>
        </div>
      </div>
    </>
  )
}
