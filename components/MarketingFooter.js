"use client"
import Link from "next/link"

export default function MarketingFooter() {
  return (
    <footer style={{ borderTop: "1px solid #E5E7EB", padding: "clamp(48px,6vw,72px) clamp(16px,4vw,52px) 28px", background: "#F9FAFB", fontFamily: "'Inter',sans-serif" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "clamp(24px,4vw,52px)", marginBottom: 48 }}>
          <div>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 16 }}>
              <img src="/logo.png" alt="Fastrill" style={{ width: 30, height: 30, objectFit: "contain" }} />
              <span style={{ fontWeight: 800, fontSize: 19, color: "#1A1D23", letterSpacing: "-.03em", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>fast<span style={{ color: "#00D4AA" }}>rill</span></span>
            </Link>
            <p style={{ fontSize: 13.5, color: "#6B7280", lineHeight: 1.8, maxWidth: 250 }}>The AI operating system for WhatsApp customer communication. Built for Indian service businesses.</p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 12 }}>By Solvabil Pvt. Ltd.</p>
          </div>
          {[
            { h: "Features", links: [["AI Conversations", "/features#ai"], ["Booking Automation", "/features#booking"], ["Campaigns", "/features#campaigns"], ["Smart Inbox", "/features#inbox"], ["Lead Recovery", "/features#lead-recovery"]] },
            { h: "Industries", links: [["Salons & Spas", "/industries/salons"], ["Clinics", "/industries/clinics"], ["Coaching", "/industries/coaching"], ["Real Estate", "/industries/real-estate"], ["Gyms", "/industries/gyms"]] },
            { h: "Resources", links: [["Blog", "/blog"], ["Use Cases", "/use-cases"], ["About us", "/about"], ["Contact", "mailto:team@fastrill.com"]] },
            { h: "Legal", links: [["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"], ["Sign in", "/login"], ["Start free", "/signup"]] },
          ].map(col => (
            <div key={col.h}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 14 }}>{col.h}</div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map(([name, href]) => (
                  <li key={name}>
                    <Link href={href} style={{ fontSize: 13.5, color: "#6B7280", textDecoration: "none" }}
                      onMouseEnter={e => e.target.style.color = "#1A1D23"}
                      onMouseLeave={e => e.target.style.color = "#6B7280"}
                    >{name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 22, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, fontSize: 12.5, color: "#9CA3AF" }}>
          <span>© 2026 Fastrill · Solvabil Pvt. Ltd. · All rights reserved</span>
          <span>Made with conviction in India 🇮🇳</span>
        </div>
      </div>
      <style>{`
        @media(max-width:760px){
          footer > div > div:first-child > div:first-child{
            grid-template-columns:1fr !important;
          }
        }
      `}</style>
    </footer>
  )
}
