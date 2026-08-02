import Link from "next/link"
import MarketingNav from "@/components/MarketingNav"
import MarketingFooter from "@/components/MarketingFooter"

export const metadata = {
  title: "Use Cases — Fastrill | WhatsApp AI for Indian Businesses",
  description: "Real use cases for WhatsApp automation — booking, lead recovery, campaigns, reminders, and more. See how Fastrill works for your business type."
}

const USE_CASES = [
  {
    icon: "📅",
    title: "After-hours booking",
    industry: "Salons, Clinics, Gyms",
    problem: "A customer messages at 10 PM asking about tomorrow's availability. By 9 AM when you check, they've already booked elsewhere.",
    solution: "Fastrill replies instantly at 10 PM, checks your actual calendar, offers available slots, and confirms the booking — all before you've woken up.",
    result: "₹18,000 avg. monthly revenue from after-hours bookings alone",
    color: "#EFF6FF",
    accent: "#1D6AF5",
  },
  {
    icon: "🔁",
    title: "Lead recovery sequences",
    industry: "Real Estate, Coaching, Gyms",
    problem: "A lead inquires, you respond, then they go quiet. Most businesses give up after one follow-up. Most bookings happen after the third touch.",
    solution: "Fastrill detects the silence and automatically sends a follow-up sequence: Day 1, Day 3, Day 7. Each message is personalized. The sequence stops the moment they reply or book.",
    result: "3x more conversions from leads who initially went cold",
    color: "#FFF7ED",
    accent: "#C2410C",
  },
  {
    icon: "🌐",
    title: "Regional language support",
    industry: "Clinics, Salons, Coaching",
    problem: "Your patients message in Telugu. Your current system replies in English. They feel unheard and go to a competitor who speaks their language.",
    solution: "Fastrill auto-detects the language in each message — Telugu, Tamil, Hindi, Kannada, Malayalam, Marathi, and more — and replies in the same language. Zero setup required.",
    result: "Clinics in Andhra Pradesh report 40% higher booking completion from Telugu-speaking patients",
    color: "#F0FDF4",
    accent: "#166534",
  },
  {
    icon: "📣",
    title: "Bulk WhatsApp campaigns",
    industry: "All business types",
    problem: "You want to send a promotional message to your customer list. SMS gets ignored. Email goes to spam. You have no way to reach them where they actually are.",
    solution: "Fastrill sends approved WhatsApp templates to your segmented customer list — new customers, returning customers, inactive customers. Real read receipts. Revenue tracking per campaign.",
    result: "98% open rate vs 18% for email. Track how much each campaign earned, not just who opened it.",
    color: "#FFF1F2",
    accent: "#BE123C",
  },
  {
    icon: "⏰",
    title: "No-show reduction",
    industry: "Salons, Clinics, Coaching",
    problem: "1 in 4 appointments doesn't show up. You've blocked the slot, turned away walk-ins, and now you're sitting idle for 30 minutes.",
    solution: "Fastrill sends an automatic reminder 24 hours before, another 2 hours before. The customer can confirm or reschedule directly in the chat. No phone calls needed.",
    result: "60% reduction in no-shows for clinics and salons using automated reminders",
    color: "#F5F3FF",
    accent: "#6D28D9",
  },
  {
    icon: "🏢",
    title: "Multi-branch management",
    industry: "Salon chains, Clinic groups, Gym franchises",
    problem: "You have 3 branches. Each has its own WhatsApp number, its own staff, and its own booking calendar. Managing all three is a full-time job.",
    solution: "Fastrill Pro connects up to 5 WhatsApp numbers under one dashboard. Each branch gets its own AI, its own calendar, and its own analytics — but you see everything from one place.",
    result: "Multi-branch businesses save 15+ hours per week on coordination and customer follow-up",
    color: "#FFFBEB",
    accent: "#92400E",
  },
]

export default function UseCasesPage() {
  return (
    <div style={{ background: "#fff", minHeight: "100vh", fontFamily: "'Inter',system-ui,sans-serif", color: "#374151" }}>
      <MarketingNav />

      {/* HERO */}
      <section style={{ paddingTop: 120, paddingBottom: 72, paddingLeft: "clamp(16px,4vw,44px)", paddingRight: "clamp(16px,4vw,44px)", textAlign: "center", borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "inline-block", background: "#EFF6FF", color: "#1D6AF5", fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 100, marginBottom: 20, border: "1px solid #DBEAFE" }}>Use Cases</div>
          <h1 style={{ fontSize: "clamp(30px,4.5vw,52px)", fontWeight: 800, color: "#111827", letterSpacing: "-.03em", lineHeight: 1.12, marginBottom: 18, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Real problems. Real solutions.<br />Real revenue.
          </h1>
          <p style={{ fontSize: 17, color: "#6B7280", lineHeight: 1.75, marginBottom: 36 }}>See exactly how Indian businesses use Fastrill to capture more bookings, recover lost leads, and run on WhatsApp — automatically.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#1D6AF5", color: "#fff", padding: "13px 26px", borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: "none", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Start free trial →</Link>
            <Link href="/pricing" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#F9FAFB", color: "#374151", padding: "13px 22px", borderRadius: 10, fontWeight: 600, fontSize: 14.5, textDecoration: "none", border: "1px solid #E5E7EB" }}>See pricing</Link>
          </div>
        </div>
      </section>

      {/* USE CASE CARDS */}
      <section style={{ padding: "72px clamp(16px,4vw,44px) 100px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", display: "flex", flexDirection: "column", gap: 48 }}>
          {USE_CASES.map((uc, i) => (
            <div key={uc.title} style={{ display: "grid", gridTemplateColumns: i % 2 === 0 ? "1fr 1.4fr" : "1.4fr 1fr", gap: "clamp(32px,4vw,64px)", alignItems: "center" }}>
              <div style={{ order: i % 2 === 0 ? 1 : 2 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: uc.color, border: `1px solid ${uc.accent}22`, borderRadius: 100, padding: "5px 14px", marginBottom: 20 }}>
                  <span style={{ fontSize: 16 }}>{uc.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: uc.accent, letterSpacing: ".06em", textTransform: "uppercase" }}>{uc.title}</span>
                </div>
                <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".05em" }}>{uc.industry}</div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>The problem</div>
                  <p style={{ fontSize: 14.5, color: "#6B7280", lineHeight: 1.75 }}>{uc.problem}</p>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>How Fastrill fixes it</div>
                  <p style={{ fontSize: 14.5, color: "#6B7280", lineHeight: 1.75 }}>{uc.solution}</p>
                </div>
                <div style={{ background: uc.color, border: `1px solid ${uc.accent}33`, borderRadius: 10, padding: "12px 16px", fontSize: 13, color: uc.accent, fontWeight: 600, lineHeight: 1.5 }}>
                  📊 {uc.result}
                </div>
              </div>
              <div style={{ order: i % 2 === 0 ? 2 : 1, background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 18, padding: "clamp(24px,3vw,40px)" }}>
                <div style={{ fontSize: 48, marginBottom: 16, textAlign: "center" }}>{uc.icon}</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: uc.accent, textAlign: "center", fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: "-.02em", lineHeight: 1 }}>
                  {uc.result.match(/[\d,₹%x+]+/)?.[0] || "✓"}
                </div>
                <div style={{ fontSize: 13, color: "#6B7280", textAlign: "center", marginTop: 6 }}>{uc.title}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section style={{ padding: "0 clamp(16px,4vw,44px) 100px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", background: "#111827", borderRadius: 20, padding: "clamp(40px,5vw,64px)" }}>
          <h2 style={{ fontSize: "clamp(22px,3vw,34px)", fontWeight: 800, color: "#fff", marginBottom: 12, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Which use case fits your business?</h2>
          <p style={{ fontSize: 15, color: "#9CA3AF", marginBottom: 28, lineHeight: 1.7 }}>Start a free 14-day trial and see Fastrill running on your WhatsApp number — no credit card, full Growth plan access.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#1D6AF5", color: "#fff", padding: "13px 28px", borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: "none", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Get started free →</Link>
            <Link href="/industries/salons" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", color: "#9CA3AF", padding: "13px 20px", borderRadius: 10, fontWeight: 600, fontSize: 14, textDecoration: "none", border: "1px solid #374151" }}>See industry pages</Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
