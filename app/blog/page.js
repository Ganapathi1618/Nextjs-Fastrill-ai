import Link from "next/link"
import MarketingNav from "@/components/MarketingNav"
import MarketingFooter from "@/components/MarketingFooter"

export const metadata = {
  title: "Blog — Fastrill | WhatsApp AI for Indian Businesses",
  description: "Tips, guides, and strategies to grow your Indian business with WhatsApp automation. Written by the Fastrill team."
}

const POSTS = [
  {
    slug: "whatsapp-booking-automation-salons",
    tag: "Booking Automation",
    title: "How Indian Salons Are Filling Their Appointment Books with WhatsApp AI",
    excerpt: "Most salon owners lose 30–40% of potential bookings simply because no one replied in time. Here's how automated WhatsApp replies are changing that.",
    readTime: "5 min read",
    date: "Aug 1, 2026",
    featured: true,
  },
  {
    slug: "whatsapp-lead-recovery-real-estate",
    tag: "Lead Recovery",
    title: "The ₹10 Lakh Lead That Went Silent (and How to Get It Back)",
    excerpt: "A property inquiry sits unanswered for 6 hours. By the time you call back, they've already toured another project. Lead recovery sequences fix this.",
    readTime: "4 min read",
    date: "Jul 28, 2026",
    featured: false,
  },
  {
    slug: "whatsapp-multilingual-clinics",
    tag: "Healthcare",
    title: "Why Your Clinic Needs to Reply in Telugu, Tamil, and Hindi — Not Just English",
    excerpt: "80% of tier-2 city patients message in their native language. If your reply comes back in English, you've already lost the booking.",
    readTime: "6 min read",
    date: "Jul 24, 2026",
    featured: false,
  },
  {
    slug: "whatsapp-campaigns-roi",
    tag: "Campaigns",
    title: "We Analyzed 500 WhatsApp Campaigns. Here's What Actually Drives Bookings.",
    excerpt: "Open rates are vanity. Revenue per send is the metric that matters. Here's what separates a ₹12,000 campaign from one that earns ₹1.2 lakh.",
    readTime: "7 min read",
    date: "Jul 20, 2026",
    featured: false,
  },
  {
    slug: "no-show-reduction-reminders",
    tag: "Appointment Reminders",
    title: "Cut No-Shows by 60%: The Two-Message Reminder Sequence That Works",
    excerpt: "Send one reminder 24 hours before, another 2 hours before. Let the customer confirm or reschedule in chat. That's it. Here's the data behind it.",
    readTime: "4 min read",
    date: "Jul 15, 2026",
    featured: false,
  },
  {
    slug: "whatsapp-vs-email-sms-india",
    tag: "Strategy",
    title: "WhatsApp vs Email vs SMS for Indian SMBs: The Real Comparison",
    excerpt: "Email open rates in India hover at 18%. SMS gets filtered as spam. WhatsApp sits at 98%. The channel choice is already made — here's how to use it right.",
    readTime: "5 min read",
    date: "Jul 10, 2026",
    featured: false,
  },
]

const TAG_COLORS = {
  "Booking Automation": { bg: "#EFF6FF", color: "#1D6AF5" },
  "Lead Recovery": { bg: "#FEF9C3", color: "#854D0E" },
  "Healthcare": { bg: "#F0FDF4", color: "#166534" },
  "Campaigns": { bg: "#FFF7ED", color: "#9A3412" },
  "Appointment Reminders": { bg: "#F5F3FF", color: "#6D28D9" },
  "Strategy": { bg: "#F0F9FF", color: "#0369A1" },
}

export default function BlogPage() {
  const featured = POSTS.find(p => p.featured)
  const rest = POSTS.filter(p => !p.featured)

  return (
    <div style={{ background: "#fff", minHeight: "100vh", fontFamily: "'Inter',system-ui,sans-serif", color: "#374151" }}>
      <MarketingNav />

      {/* HERO */}
      <section style={{ paddingTop: 120, paddingBottom: 64, paddingLeft: "clamp(16px,4vw,44px)", paddingRight: "clamp(16px,4vw,44px)", borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-block", background: "#EFF6FF", color: "#1D6AF5", fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 100, marginBottom: 20, border: "1px solid #DBEAFE" }}>Fastrill Blog</div>
          <h1 style={{ fontSize: "clamp(30px,4vw,48px)", fontWeight: 800, color: "#111827", letterSpacing: "-.03em", lineHeight: 1.15, marginBottom: 16, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Grow your business with WhatsApp
          </h1>
          <p style={{ fontSize: 17, color: "#6B7280", lineHeight: 1.7 }}>Practical guides, real numbers, and strategies for Indian service businesses using WhatsApp to get more customers.</p>
        </div>
      </section>

      <section style={{ padding: "64px clamp(16px,4vw,44px) 100px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>

          {/* FEATURED */}
          {featured && (
            <div style={{ marginBottom: 64 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 20 }}>Featured</div>
              <Link href={`/blog/${featured.slug}`} style={{ textDecoration: "none", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(32px,4vw,64px)", alignItems: "center", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 20, padding: "clamp(28px,4vw,48px)", transition: "box-shadow .15s" }}>
                <div>
                  {(() => { const tc = TAG_COLORS[featured.tag] || {}; return <span style={{ display: "inline-block", background: tc.bg, color: tc.color, fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 100, marginBottom: 16, letterSpacing: ".05em", textTransform: "uppercase" }}>{featured.tag}</span> })()}
                  <h2 style={{ fontSize: "clamp(20px,2.5vw,30px)", fontWeight: 800, color: "#111827", letterSpacing: "-.02em", lineHeight: 1.25, marginBottom: 14, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{featured.title}</h2>
                  <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.75, marginBottom: 20 }}>{featured.excerpt}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: "#9CA3AF" }}>
                    <span>{featured.date}</span>
                    <span>·</span>
                    <span>{featured.readTime}</span>
                  </div>
                </div>
                <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: "clamp(24px,3vw,40px)", display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { from: "Priya", msg: "Hi, kal 3 baje appointment available hai?" },
                    { from: "Fastrill", msg: "Namaste Priya! Kal 3 PM available hai. Name aur service confirm karein?" },
                    { from: "Priya", msg: "Priya Mehta, facial" },
                    { from: "Fastrill", msg: "✅ Confirmed! Priya Mehta · Facial · Kal 3:00 PM\n\nReminder bhejenge 2 ghante pehle." },
                  ].map((m, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: m.from === "Fastrill" ? "flex-end" : "flex-start" }}>
                      <div style={{ maxWidth: "80%", background: m.from === "Fastrill" ? "#EFF6FF" : "#F3F4F6", borderRadius: 12, padding: "9px 13px", fontSize: 12.5, color: m.from === "Fastrill" ? "#1D6AF5" : "#374151", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{m.msg}</div>
                    </div>
                  ))}
                </div>
              </Link>
            </div>
          )}

          {/* GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 24 }}>
            {rest.map(post => {
              const tc = TAG_COLORS[post.tag] || {}
              return (
                <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: "none", background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 12, transition: "box-shadow .15s, border-color .15s" }}>
                  <span style={{ display: "inline-block", background: tc.bg, color: tc.color, fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 100, letterSpacing: ".05em", textTransform: "uppercase", alignSelf: "flex-start" }}>{post.tag}</span>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", lineHeight: 1.4, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{post.title}</h3>
                  <p style={{ fontSize: 13.5, color: "#6B7280", lineHeight: 1.7, flex: 1 }}>{post.excerpt}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "#9CA3AF", marginTop: 4, borderTop: "1px solid #F3F4F6", paddingTop: 12 }}>
                    <span>{post.date}</span>
                    <span>·</span>
                    <span>{post.readTime}</span>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* CTA */}
          <div style={{ marginTop: 80, background: "#F0F7FF", border: "1px solid #DBEAFE", borderRadius: 20, padding: "clamp(32px,4vw,56px)", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(20px,2.5vw,30px)", fontWeight: 800, color: "#111827", marginBottom: 12, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>See Fastrill in action</h2>
            <p style={{ fontSize: 15, color: "#6B7280", marginBottom: 24 }}>14-day free trial. Full Growth plan. No credit card required.</p>
            <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#1D6AF5", color: "#fff", padding: "13px 28px", borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: "none", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Start free trial →</Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
