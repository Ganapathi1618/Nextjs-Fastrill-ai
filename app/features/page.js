import Link from "next/link"
import MarketingNav from "@/components/MarketingNav"
import MarketingFooter from "@/components/MarketingFooter"

export const metadata = {
  title: "Features — Fastrill | WhatsApp AI for Indian Businesses",
  description: "AI conversations, booking automation, bulk campaigns, smart inbox, lead recovery and appointment reminders — all in one WhatsApp platform built for Indian SMBs."
}

export default function FeaturesPage() {
  return (
    <div style={{ background: "#fff", minHeight: "100vh", fontFamily: "'Inter',system-ui,sans-serif", color: "#374151" }}>
      <MarketingNav />
      <style>{`
        .feat-grid{display:grid;grid-template-columns:1fr 1fr;gap:clamp(36px,5vw,80px);align-items:center}
        .feat-label{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:14px}
        .feat-h2{font-size:clamp(24px,3vw,38px);font-weight:800;color:#111827;letter-spacing:-.03em;line-height:1.15;margin-bottom:14px;font-family:'Plus Jakarta Sans',sans-serif}
        .feat-p{font-size:15px;color:#6B7280;line-height:1.8;margin-bottom:22px}
        .feat-bullets{list-style:none;display:flex;flex-direction:column;gap:11px}
        .feat-bullets li{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:#374151;line-height:1.5}
        .feat-bullets li::before{content:'✓';color:#1D6AF5;font-weight:700;flex-shrink:0;margin-top:1px}
        .vis-box{border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.1)}
        .cmock{background:#EFE7DB;border-radius:16px;overflow:hidden;max-width:380px}
        .cmock-hd{background:#075E54;color:#fff;display:flex;align-items:center;gap:10px;padding:12px 16px}
        .cmock-av{width:34px;height:34px;border-radius:50%;background:#F3C26B;color:#7C3E0A;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0}
        .cmock-name{font-size:13.5px;font-weight:600}
        .cmock-status{font-size:11px;opacity:.8}
        .cmock-body{padding:14px 12px;display:flex;flex-direction:column;gap:8px;min-height:240px}
        .cb{max-width:82%;padding:9px 13px 7px;border-radius:10px;font-size:12.5px;line-height:1.5;color:#1B1B18;white-space:pre-wrap}
        .cb.c{background:#DCF8C6;align-self:flex-end;border-top-right-radius:3px}
        .cb.a{background:#fff;align-self:flex-start;border-top-left-radius:3px}
        .cb-ts{display:block;font-size:9px;color:rgba(0,0,0,.4);text-align:right;margin-top:3px}
        .cb-conf{background:#fff;border-radius:12px;border-top-left-radius:3px;max-width:86%;align-self:flex-start;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.12)}
        .cb-conf-top{background:#F0FAF0;padding:10px 13px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #E2EDE2}
        .cb-conf-chk{width:20px;height:20px;border-radius:50%;background:#25A55A;color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0}
        .cb-conf-ttl{font-size:12px;font-weight:700;color:#14532D}
        .cb-conf-body{padding:10px 13px;display:flex;flex-direction:column;gap:4px}
        .cb-conf-row{display:flex;justify-content:space-between;gap:8px;font-size:11.5px;color:#555}
        .cb-conf-row strong{color:#1B1B18;font-weight:600}
        .cb-conf-foot{font-size:10px;color:rgba(0,0,0,.4);padding:0 13px 8px;text-align:right}
        .dmock{background:#fff;border:1.5px solid #E5E7EB;border-radius:16px;overflow:hidden;max-width:420px}
        .dmock-hd{background:#F9FAFB;padding:14px 18px;border-bottom:1px solid #E5E7EB;font-size:13px;font-weight:700;color:#111827;display:flex;justify-content:space-between;align-items:center}
        .dmock-tag{font-size:10.5px;font-weight:600;background:#EEF4FF;color:#1D6AF5;padding:3px 10px;border-radius:100px}
        .dmock-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border-bottom:1px solid #F3F4F6}
        .dmock-kpi{padding:14px 16px;border-right:1px solid #F3F4F6}
        .dmock-kpi:last-child{border-right:none}
        .dmock-kl{font-size:10.5px;color:#9CA3AF;margin-bottom:4px}
        .dmock-kv{font-size:20px;font-weight:800;color:#111827;font-family:'Plus Jakarta Sans',sans-serif;letter-spacing:-.02em}
        .dmock-kv.up{color:#1D6AF5}
        .dmock-body{padding:16px 18px}
        .dmock-row{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid #F9FAFB;font-size:13px}
        .dmock-row:last-child{border-bottom:none}
        .imock{background:#fff;border:1.5px solid #E5E7EB;border-radius:16px;overflow:hidden;max-width:420px}
        .imock-hd{background:#F9FAFB;padding:12px 16px;border-bottom:1px solid #E5E7EB;display:flex;justify-content:space-between;align-items:center}
        .imock-title{font-size:13px;font-weight:700;color:#111827}
        .imock-badge{font-size:10px;font-weight:700;background:#1D6AF5;color:#fff;border-radius:100px;padding:2px 8px}
        .imock-row{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #F9FAFB}
        .imock-av{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0}
        .imock-mid{flex:1;min-width:0}
        .imock-name{font-size:13px;font-weight:600;color:#111827;margin-bottom:2px}
        .imock-msg{font-size:11.5px;color:#9CA3AF;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .imock-pill{font-size:9.5px;font-weight:700;padding:3px 9px;border-radius:100px;flex-shrink:0}
        .imock-pill.ai{background:#EEF4FF;color:#1D6AF5}
        .imock-pill.you{background:#F3F4F6;color:#9CA3AF}
        .drip-step{display:flex;gap:14px;padding:14px 18px;border-bottom:1px solid rgba(0,0,0,.06);align-items:flex-start}
        .drip-step:last-child{border-bottom:none}
        .drip-dot{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;margin-top:2px}
        .remock-row{padding:14px 18px;border-bottom:1px solid rgba(0,0,0,.06)}
        .remock-row:last-child{border-bottom:none}
        @media(max-width:860px){.feat-grid{grid-template-columns:1fr}.cmock,.dmock,.imock{max-width:100%}}
      `}</style>

      {/* HERO */}
      <section style={{ paddingTop: "clamp(108px,14vh,150px)", paddingBottom: "clamp(64px,8vw,96px)", paddingLeft: "clamp(16px,4vw,52px)", paddingRight: "clamp(16px,4vw,52px)", background: "#fff" }}>
        <div style={{ maxWidth: 740, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-block", background: "#EEF4FF", color: "#1D6AF5", fontSize: 11, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 100, marginBottom: 22, border: "1px solid #DBEAFE" }}>Platform Features</div>
          <h1 style={{ fontSize: "clamp(34px,5vw,58px)", fontWeight: 800, color: "#111827", letterSpacing: "-.03em", lineHeight: 1.1, marginBottom: 18, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Not a chatbot.<br />A revenue system.
          </h1>
          <p style={{ fontSize: 17, color: "#6B7280", lineHeight: 1.75, marginBottom: 36, maxWidth: 540, margin: "0 auto 36px" }}>Every feature in Fastrill is built to do one thing: turn a WhatsApp message into a confirmed booking, automatically.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#1D6AF5", color: "#fff", padding: "13px 26px", borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: "none", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Start free trial →</Link>
            <Link href="/pricing" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#F9FAFB", color: "#374151", padding: "13px 22px", borderRadius: 10, fontWeight: 600, fontSize: 14.5, textDecoration: "none", border: "1px solid #E5E7EB" }}>See pricing</Link>
          </div>
        </div>
      </section>

      {/* FEATURE 1 — AI */}
      <section id="ai" style={{ padding: "clamp(72px,9vw,112px) clamp(16px,4vw,52px)", background: "#F0F7FF" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div className="feat-grid">
            <div>
              <div className="feat-label" style={{ color: "#1D6AF5" }}>01 · AI Engine</div>
              <h2 className="feat-h2">Replies in under 2 seconds.<br />In any Indian language.</h2>
              <p className="feat-p">Most WhatsApp tools break the moment a customer goes off-script. Fastrill reads the actual message, understands the intent, and responds naturally — in Hindi, Telugu, Tamil, or English, exactly as your customer wrote.</p>
              <ul className="feat-bullets">
                <li>Understands casual, mixed-language messages (Hinglish, Tenglish)</li>
                <li>Remembers context — no repeating details</li>
                <li>Handles objections, price questions, and complaints</li>
                <li>Auto-detects language per message — zero config</li>
              </ul>
              <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
                {[["< 2s", "reply time"], ["10+", "languages"], ["24/7", "always on"]].map(([v, l]) => (
                  <div key={l} style={{ flex: 1, background: "#fff", border: "1px solid #DBEAFE", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#1D6AF5", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{v}</div>
                    <div style={{ fontSize: 11.5, color: "#6B7280", marginTop: 4 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="cmock vis-box">
                <div className="cmock-hd">
                  <div className="cmock-av">L</div>
                  <div><div className="cmock-name">Lakshmi Beauty Parlour</div><div className="cmock-status">online</div></div>
                </div>
                <div className="cmock-body">
                  <div className="cb c">Bhai facial karwa sakte hai kal? Aur kitna charge hoga?<span className="cb-ts">9:41 PM ✓✓</span></div>
                  <div className="cb a">{"Haan bilkul! 😊\n\nFacial ₹1,200 mein available hai (60 min).\nKal 11 AM, 2 PM ya 5 PM free hai.\n\nKis time aana chahenge?"}<span className="cb-ts">9:41 PM</span></div>
                  <div className="cb c">5 baje<span className="cb-ts">9:42 PM ✓✓</span></div>
                  <div className="cb a">{"5 PM confirm kar dun Facial ke liye kal?"}<span className="cb-ts">9:42 PM</span></div>
                  <div className="cb c">Haan<span className="cb-ts">9:42 PM ✓✓</span></div>
                  <div className="cb-conf">
                    <div className="cb-conf-top"><div className="cb-conf-chk">✓</div><div className="cb-conf-ttl">Booking Confirmed</div></div>
                    <div className="cb-conf-body">
                      <div className="cb-conf-row"><span>Service</span><strong>Gold Facial</strong></div>
                      <div className="cb-conf-row"><span>Date</span><strong>Kal, 30 Aug</strong></div>
                      <div className="cb-conf-row"><span>Time</span><strong>5:00 PM</strong></div>
                      <div className="cb-conf-row"><span>Amount</span><strong>₹1,200</strong></div>
                    </div>
                    <div className="cb-conf-foot">Milte hai kal! 🙏 · 9:42 PM ✓✓</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE 2 — BOOKING */}
      <section id="booking" style={{ padding: "clamp(72px,9vw,112px) clamp(16px,4vw,52px)", background: "#fff" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div className="feat-grid">
            <div style={{ order: 2 }}>
              <div className="feat-label" style={{ color: "#059669" }}>02 · Booking Engine</div>
              <h2 className="feat-h2">Books the appointment.<br />Start to finish.</h2>
              <p className="feat-p">A customer messages asking about availability. Fastrill checks your real calendar, offers actual open slots, collects the confirmation, and sends a WhatsApp booking card — without a single tap from you.</p>
              <ul className="feat-bullets">
                <li>Checks real-time slot availability before offering times</li>
                <li>Sends a formatted booking confirmation card in WhatsApp</li>
                <li>Handles rescheduling and cancellations automatically</li>
                <li>Owner gets instant notification for every booking</li>
                <li>Works for services, consultations, classes</li>
              </ul>
              <div style={{ marginTop: 24, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: "#059669", fontFamily: "'Plus Jakarta Sans',sans-serif", flexShrink: 0 }}>4</div>
                <div><div style={{ fontSize: 13, fontWeight: 600, color: "#065F46" }}>messages average to complete a booking</div><div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>Service → Time → Confirm → Done</div></div>
              </div>
            </div>
            <div style={{ order: 1 }}>
              <div style={{ background: "#F0FDF4", borderRadius: 20, padding: "clamp(20px,3vw,36px)", boxShadow: "0 8px 40px rgba(0,0,0,.08)" }}>
                <div style={{ fontSize: 12, color: "#059669", fontWeight: 600, marginBottom: 14 }}>Patient booking — Skin First Clinic · Telugu</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { side: "c", msg: "Doctor gari appointment book cheyyalante emi cheyyali?" },
                    { side: "a", msg: "Namaste! Dr. Ravi Sharma gari skin consultation:\n\nFee: ₹500 (30 min)\nReppu: 11 AM, 3 PM, 5 PM\n\nMeeru prefer chese time?" },
                    { side: "c", msg: "3 PM baguntundi" },
                    { side: "a", msg: "✅ Confirmed!\n\nDr. Sharma · Skin Consultation\nReppu · 3:00 PM · ₹500\n\nReminder pampistaamu 🙏" },
                  ].map((m, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: m.side === "a" ? "flex-end" : "flex-start" }}>
                      <div style={{ maxWidth: "80%", background: m.side === "a" ? "#D1FAE5" : "#fff", border: `1px solid ${m.side === "a" ? "#A7F3D0" : "#E5E7EB"}`, borderRadius: 12, padding: "9px 13px", fontSize: 12.5, color: "#1B1B18", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{m.msg}</div>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: "right", fontSize: 11, color: "#6B7280", marginTop: 10 }}>Replied in 1.8s · Language auto-detected</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE 3 — CAMPAIGNS */}
      <section id="campaigns" style={{ padding: "clamp(72px,9vw,112px) clamp(16px,4vw,52px)", background: "#FFFBF0" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div className="feat-grid">
            <div>
              <div className="feat-label" style={{ color: "#D97706" }}>03 · WhatsApp Campaigns</div>
              <h2 className="feat-h2">98% open rate.<br />Track exactly what it earned.</h2>
              <p className="feat-p">Send WhatsApp template messages to your customer list — segmented by tag, recency, or service. Then see exactly how many replied, how many booked, and how much revenue came from that send. Not just opens — actual money.</p>
              <ul className="feat-bullets">
                <li>Segment by new / returning / VIP / inactive customers</li>
                <li>Real Meta delivery, delivery and read receipts</li>
                <li>Revenue and ROI tracked per campaign</li>
                <li>Schedule sends for peak engagement times</li>
                <li>Available from Starter plan (₹999/month)</li>
              </ul>
            </div>
            <div>
              <div className="dmock vis-box">
                <div className="dmock-hd"><span>January Offer Campaign</span><span className="dmock-tag">Sent · Jan 15</span></div>
                <div className="dmock-kpis">
                  <div className="dmock-kpi"><div className="dmock-kl">Sent</div><div className="dmock-kv">412</div></div>
                  <div className="dmock-kpi"><div className="dmock-kl">Read</div><div className="dmock-kv">403</div></div>
                  <div className="dmock-kpi"><div className="dmock-kl">Replied</div><div className="dmock-kv up">138</div></div>
                </div>
                <div className="dmock-body">
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10 }}>Revenue Breakdown</div>
                  {[["Bookings generated", "82", false], ["Total revenue", "₹98,400", false], ["Campaign cost", "₹13,900", false], ["ROI", "+612%", true]].map(([l, v, accent]) => (
                    <div key={l} className="dmock-row">
                      <span style={{ fontSize: 13, color: "#6B7280" }}>{l}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: accent ? "#1D6AF5" : "#111827" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE 4 — INBOX */}
      <section id="inbox" style={{ padding: "clamp(72px,9vw,112px) clamp(16px,4vw,52px)", background: "#fff" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div className="feat-grid">
            <div style={{ order: 2 }}>
              <div className="feat-label" style={{ color: "#7C3AED" }}>04 · Smart Inbox</div>
              <h2 className="feat-h2">Every conversation.<br />One place. Full control.</h2>
              <p className="feat-p">See every customer conversation live across your WhatsApp numbers. Take over manually with one tap — Fastrill waits, and picks back up the moment you're done. Your team stays focused on the customer in front of them.</p>
              <ul className="feat-bullets">
                <li>Real-time conversation updates across all numbers</li>
                <li>AI / Human toggle per conversation — take over instantly</li>
                <li>Full customer history, tags, and booking records</li>
                <li>Search and filter across all conversations</li>
                <li>Works across 10+ Indian languages</li>
              </ul>
              <div style={{ marginTop: 24, background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: "#7C3AED", fontFamily: "'Plus Jakarta Sans',sans-serif", flexShrink: 0 }}>0</div>
                <div><div style={{ fontSize: 13, fontWeight: 600, color: "#4C1D95" }}>messages missed. Ever.</div><div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>Every message gets a reply, 24 hours a day</div></div>
              </div>
            </div>
            <div style={{ order: 1 }}>
              <div className="imock vis-box">
                <div className="imock-hd"><span className="imock-title">All conversations</span><span className="imock-badge">4 active</span></div>
                {[
                  { name: "Priya Nair", msg: "Yes please, book me for 3 PM", ai: true, color: "#EEF4FF", initial: "P" },
                  { name: "Arjun Mehta", msg: "Do you have dermatology also?", ai: true, color: "#FFF7ED", initial: "A" },
                  { name: "Sneha Reddy", msg: "Thank you! See you tomorrow 🙏", ai: false, color: "#F0FDF4", initial: "S" },
                  { name: "Kiran Patel", msg: "What time do you close?", ai: true, color: "#F5F3FF", initial: "K" },
                ].map(c => (
                  <div key={c.name} className="imock-row">
                    <div className="imock-av" style={{ background: c.color }}>{c.initial}</div>
                    <div className="imock-mid"><div className="imock-name">{c.name}</div><div className="imock-msg">{c.msg}</div></div>
                    <span className={`imock-pill ${c.ai ? "ai" : "you"}`}>{c.ai ? "AI" : "You"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE 5 — LEAD RECOVERY */}
      <section id="lead-recovery" style={{ padding: "clamp(72px,9vw,112px) clamp(16px,4vw,52px)", background: "#FFF8F0" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div className="feat-grid">
            <div>
              <div className="feat-label" style={{ color: "#EA580C" }}>05 · Lead Recovery</div>
              <h2 className="feat-h2">3x more conversions<br />from silent leads.</h2>
              <p className="feat-p">A lead messages, you reply, then they go quiet. Most businesses give up. Fastrill detects the silence and automatically sends a personalized follow-up sequence — and stops the moment they reply or book.</p>
              <ul className="feat-bullets">
                <li>Multi-step drip sequences delivered via WhatsApp</li>
                <li>Auto-stops when lead books or replies — never spammy</li>
                <li>Fully customizable timing and message copy</li>
                <li>Runs even when your business is closed</li>
                <li>Available from Growth plan (₹1,999/month)</li>
              </ul>
            </div>
            <div>
              <div style={{ background: "#fff", border: "1.5px solid #FED7AA", borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,.08)" }}>
                <div style={{ background: "#FFF0E6", padding: "12px 18px", borderBottom: "1px solid #FDDCB5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Lead recovery sequence</span>
                  <span style={{ fontSize: 10.5, color: "#EA580C", fontWeight: 600 }}>3 steps active</span>
                </div>
                {[
                  { day: "Day 1", dotBg: "#FED7AA", dotColor: "#EA580C", bg: "#FFF8F0", label: "Gentle follow-up", msg: "Hi! Just checking in — did you get a chance to think about your appointment? Happy to answer any questions 😊", status: "✓ Sent to 24 leads", statusColor: "#059669" },
                  { day: "Day 3", dotBg: "#FEF08A", dotColor: "#CA8A04", bg: "#FFFEF0", label: "Value reminder", msg: "We still have a few slots open this week. Want me to hold one for you? 👇", status: "✓ Sent to 18 leads", statusColor: "#059669" },
                  { day: "Day 7", dotBg: "#BBF7D0", dotColor: "#059669", bg: "#F0FDF4", label: "Final nudge", msg: "Last chance — our schedule fills up quickly! Book today 🗓️", status: "✓ Sent to 11 leads", statusColor: "#059669" },
                ].map(s => (
                  <div key={s.day} className="drip-step" style={{ background: s.bg }}>
                    <div className="drip-dot" style={{ background: s.dotBg, color: s.dotColor, fontSize: 11 }}>{s.day}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4, fontWeight: 600 }}>{s.label}</div>
                      <div style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.55, background: "rgba(255,255,255,.7)", borderRadius: 8, padding: "8px 10px", border: "1px solid rgba(0,0,0,.06)", marginBottom: 6 }}>{s.msg}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: s.statusColor }}>{s.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE 6 — REMINDERS */}
      <section id="reminders" style={{ padding: "clamp(72px,9vw,112px) clamp(16px,4vw,52px)", background: "#fff" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div className="feat-grid">
            <div style={{ order: 2 }}>
              <div className="feat-label" style={{ color: "#DB2777" }}>06 · Appointment Reminders</div>
              <h2 className="feat-h2">60% fewer no-shows.<br />Automatically.</h2>
              <p className="feat-p">Every missed appointment is a blocked slot you could have filled. Fastrill sends WhatsApp reminders 24 hours and 2 hours before. The customer can confirm, reschedule, or cancel directly in the chat — all handled without your team lifting a finger.</p>
              <ul className="feat-bullets">
                <li>Sent automatically at 24h and 2h before appointment</li>
                <li>Customer confirms or reschedules in chat — Fastrill handles it</li>
                <li>Cancelled slots are immediately offered to the waitlist</li>
                <li>Customizable message per service type</li>
                <li>Available from Growth plan (₹1,999/month)</li>
              </ul>
            </div>
            <div style={{ order: 1 }}>
              <div style={{ background: "#fff", border: "1.5px solid #FBCFE8", borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,.08)" }}>
                <div style={{ background: "#FFF0F6", padding: "12px 18px", borderBottom: "1px solid #FBCFE8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Upcoming reminders</span>
                  <span style={{ fontSize: 10.5, color: "#DB2777", fontWeight: 600 }}>3 sending today</span>
                </div>
                {[
                  { time: "⏰ 24h before", name: "Priya Nair", appt: "Gold Facial · 3 PM tomorrow", status: "Confirmed ✓", statusColor: "#059669", bg: "#F0FDF4" },
                  { time: "⏰ 2h before", name: "Arjun Mehta", appt: "Skin consult · 3 PM today", status: "Pending reply", statusColor: "#D97706", bg: "#FFFBF0" },
                  { time: "⏰ 24h before", name: "Sneha Mehta", appt: "Keratin · 11 AM tomorrow", status: "Rescheduled → 2 PM", statusColor: "#7C3AED", bg: "#F5F3FF" },
                ].map((r, i) => (
                  <div key={i} className="remock-row" style={{ background: r.bg }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9CA3AF", letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 8 }}>{r.time}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 2 }}>{r.name}</div>
                        <div style={{ fontSize: 12, color: "#6B7280" }}>{r.appt}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: r.statusColor, background: "#fff", border: `1px solid ${r.statusColor}44`, borderRadius: 6, padding: "3px 8px", flexShrink: 0 }}>{r.status}</span>
                    </div>
                  </div>
                ))}
                <div style={{ padding: "12px 18px", background: "#FFF0F6", borderTop: "1px solid #FBCFE8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#6B7280" }}>No-show rate this month</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#DB2777", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>4.2% <span style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>↓ from 26%</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px clamp(16px,4vw,44px) 100px", background: "#111827", textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(26px,3.5vw,42px)", fontWeight: 800, color: "#fff", marginBottom: 14, fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: "-.03em" }}>Ready to see it running on your WhatsApp?</h2>
          <p style={{ fontSize: 16, color: "#9CA3AF", marginBottom: 32, lineHeight: 1.7 }}>14-day free trial. Full Growth plan. No credit card required.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#1D6AF5", color: "#fff", padding: "14px 28px", borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: "none", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Start free →</Link>
            <Link href="/pricing" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", color: "#9CA3AF", padding: "14px 22px", borderRadius: 10, fontWeight: 600, fontSize: 14.5, textDecoration: "none", border: "1px solid #374151" }}>See pricing</Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
