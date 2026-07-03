"use client";
import { useEffect, useState } from "react";

const WA_LINK = "https://wa.me/916309279265?text=Hi%2C%20show%20me%20a%20Fastrill%20demo";

const PLANS = [
  {
    name: "Starter",
    price: "999",
    tag: "For one location getting started",
    features: [
      "1 WhatsApp number",
      "300 AI conversations / month",
      "Appointment booking & calendar sync",
      "Automated reminders (24hr & 2hr)",
      "Missed-call to WhatsApp recovery",
      "10+ Indian languages (auto-detected)",
      "Unified inbox dashboard",
      "Customer profile & history",
      "Basic analytics",
    ],
    missing: [
      "Lead recovery sequences",
      "Bulk WhatsApp campaigns",
      "Campaign revenue tracking",
      "UPI payment collection",
      "Multi-staff calendars",
    ],
    featured: false,
  },
  {
    name: "Growth",
    price: "1,999",
    tag: "For busy businesses that live on bookings",
    features: [
      "1 WhatsApp number",
      "Unlimited AI conversations",
      "Everything in Starter",
      "Lead recovery — auto follow-up sequences",
      "Bulk WhatsApp campaigns (send offers to your list)",
      "Campaign revenue & ROI tracking",
      "UPI payment collection inside chat",
      "Customer segmentation (new / returning / VIP / inactive)",
      "Win-back sequences for inactive customers",
      "Advanced analytics & booking trends",
      "Priority support",
    ],
    missing: [
      "Multiple staff / resource calendars",
      "Voice agent (early access)",
    ],
    featured: true,
  },
  {
    name: "Pro",
    price: "4,999",
    tag: "For teams and multiple locations",
    features: [
      "Up to 5 WhatsApp numbers",
      "Unlimited AI conversations",
      "Everything in Growth",
      "Multiple staff & resource calendars",
      "Multi-branch management dashboard",
      "Custom AI playbook & tone",
      "Voice agent — early access",
      "Dedicated onboarding & setup support",
      "Priority response SLA",
      "Custom integrations on request",
    ],
    missing: [],
    featured: false,
  },
];

const CHAT = [
  { dir: "in",  delay: 600,  text: "Sir, my back pain is worse. Any slot with doctor tomorrow?", time: "11:47 PM" },
  { dir: "out", delay: 2300, text: "Sorry to hear that! Dr. Meena has 10:30 AM and 6:15 PM open tomorrow. Consultation is ₹500. Which works for you?", time: "11:47 PM" },
  { dir: "in",  delay: 3900, text: "10.30 pls", time: "11:48 PM" },
  { dir: "out", delay: 5500, text: "Booked ✅ Physio consultation, tomorrow 10:30 AM with Dr. Meena. You'll get a reminder at 9:30 AM. Feel better soon! 🙏", time: "11:48 PM" },
];

const LEDGER = [
  { time: "9:15 AM", what: '"Any appointment today?" — clinic front desk busy, patient booked elsewhere', loss: "–₹500" },
  { time: "1:40 PM", what: "Missed call at the salon during a client session", loss: "–₹650" },
  { time: "6:20 PM", what: '"Fees for weekend batch?" — coaching centre replied next day, parent moved on', loss: "–₹4,000" },
  { time: "11:47 PM", what: "Late-night enquiry at the gym — nobody awake to answer", loss: "–₹1,200" },
];

const TESTIMONIALS = [
  { name: "Priya Nair", biz: "Glow Parlour, Hyderabad", stat: "+43%", statLabel: "bookings in month one", quote: "I was losing Saturday night bookings because nobody replied after 8 PM. Customers now book at midnight and wake up to a confirmation. It paid for itself in the first week." },
  { name: "Dr. Ravi Sharma", biz: "Skin First Clinic, Vijayawada", stat: "₹22k", statLabel: "saved per month", quote: "My patients message in Telugu and the AI replies in Telugu, books the slot, and follows up if they go quiet. I had to see it to believe it wasn't a person." },
  { name: "Sneha Reddy", biz: "Studio S, 2 branches, Bangalore", stat: "0", statLabel: "missed messages", quote: "Two branches, both inboxes handled at once. Our staff stopped checking phones and started focusing on the customer in front of them." },
];

const FAQS = [
  { q: "Will customers know it's not me replying?", a: "It replies as your business, in your tone, with your real prices and timings. Most customers just notice they finally got an instant answer. You can jump into any conversation yourself whenever you want." },
  { q: "What if it says something wrong?", a: "It only answers from the business information you approve during setup — it doesn't invent prices or promises. Anything it's unsure about, it politely takes the customer's details and alerts you to follow up." },
  { q: "I'm not technical. How hard is setup?", a: "You answer questions about your business — services, prices, timings. We handle everything technical and you're live the same day. If you can use WhatsApp, you can use Fastrill." },
  { q: "Does it work with my existing WhatsApp number?", a: "Yes — we connect your number to WhatsApp Business API (your chats and contacts stay intact), or you can run Fastrill on a fresh number. Your choice." },
  { q: "What happens after the free trial?", a: "If it booked appointments for you, you'll want to keep it — pick a plan from your dashboard, cancel anytime. No lock-in, no awkward calls." },
  { q: "Which languages does Fastrill support?", a: "Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi and English — auto-detected per conversation. No configuration needed." },
];

const WaIcon = () => (
  <svg style={{width:18,height:18,flexShrink:0}} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.5 14.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.82 9.82 0 0 1-1.51-5.26c0-5.44 4.43-9.87 9.89-9.87 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.98c0 5.45-4.43 9.88-9.88 9.88m8.4-18.28A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.34.15 11.9c0 2.1.55 4.14 1.59 5.95L.05 24l6.3-1.65a11.9 11.9 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.9-11.9 0-3.18-1.24-6.17-3.49-8.42"/>
  </svg>
);

export default function Home() {
  const [mobOpen, setMobOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [activeT, setActiveT] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const msgs = document.querySelectorAll("#chat .msg");
    const typing = document.getElementById("typing");
    const timers = [];
    if (reduced) {
      msgs.forEach(m => m.classList.add("show"));
    } else {
      msgs.forEach(m => {
        const d = parseInt(m.dataset.delay, 10);
        if (m.classList.contains("msg-out")) {
          timers.push(setTimeout(() => typing && typing.classList.add("show"), d - 1100));
          timers.push(setTimeout(() => { typing && typing.classList.remove("show"); m.classList.add("show"); }, d));
        } else {
          timers.push(setTimeout(() => m.classList.add("show"), d));
        }
      });
    }
    const els = document.querySelectorAll(".reveal");
    let io;
    if (reduced || !("IntersectionObserver" in window)) {
      els.forEach(e => e.classList.add("in"));
    } else {
      io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: 0.12 });
      els.forEach(e => io.observe(e));
    }
    const tInterval = setInterval(() => setActiveT(p => (p + 1) % TESTIMONIALS.length), 5500);
    return () => { timers.forEach(clearTimeout); if (io) io.disconnect(); clearInterval(tInterval); };
  }, []);

  return (
    <>
      <style>{CSS}</style>

      {/* NAV */}
      <nav className="nav">
        <div className="wrap nav-inner">
          <a href="/" className="logo">
            <img src="/logo.png" alt="Fastrill" className="logo-img" />
            <span className="logo-text">fast<em>rill</em></span>
          </a>
          <div className="nav-links">
            <a href="#how">How it works</a>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="/login" className="nav-signin">Sign in</a>
            <a className="btn btn-teal btn-nav" href="/signup">Start free trial</a>
          </div>
          <button className="hbg" onClick={() => setMobOpen(p => !p)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>
      <div className={`mdr${mobOpen ? " open" : ""}`}>
        {[["#how","How it works"],["#features","Features"],["#pricing","Pricing"],["/login","Sign in"],["/signup","Start free trial"]].map(([h,l]) => (
          <a key={h} href={h} onClick={() => setMobOpen(false)}>{l}</a>
        ))}
      </div>

      {/* HERO */}
      <header className="hero">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">AI receptionist · lives inside WhatsApp</span>
            <h1>You close at 9.<br /><span className="accent">Your bookings don't.</span></h1>
            <p className="hero-sub">Fastrill answers every WhatsApp message — books the appointment, collects payment, sends reminders. In seconds, in 10 languages, at any hour.</p>
            <div className="hero-ctas">
              <a className="btn btn-teal btn-lg" href="/signup">Start free 14-day trial</a>
              <a className="btn btn-ghost btn-lg" href={WA_LINK} target="_blank" rel="noopener noreferrer"><WaIcon /> See live demo</a>
            </div>
            <p className="cta-note">The demo is Fastrill itself, answering you on WhatsApp. <strong>No signup. 60 seconds.</strong></p>
            <div className="trust-row">
              <span className="trust-item">✓ No credit card</span>
              <span className="trust-item">✓ Setup in 10 min</span>
              <span className="trust-item">✓ 200+ Indian businesses</span>
            </div>
          </div>
          <div className="phone-wrap">
            <span className="late-tag">11:47 PM — you're asleep</span>
            <div className="phone">
              <div className="screen">
                <div className="chat-header">
                  <div className="avatar">C</div>
                  <div>
                    <div className="chat-name">CityCare Physio Clinic</div>
                    <div className="chat-status">online</div>
                  </div>
                </div>
                <div className="chat-body" id="chat">
                  <span className="day-chip">Today</span>
                  {CHAT.map((m, i) => (
                    <div key={i} className={`msg msg-${m.dir}`} data-delay={m.delay}>
                      {m.text}
                      <span className="msg-time">{m.time}{m.dir === "out" && <span className="ticks"> ✓✓</span>}</span>
                    </div>
                  ))}
                  <div className="typing" id="typing"><span /><span /><span /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* VERTICALS */}
      <div className="verticals">
        <div className="wrap verticals-inner">
          <span className="verticals-label">Running on appointments?</span>
          {["Clinics","Salons & spas","Gyms & fitness","Coaching centres","Dental & physio","Home services","Real estate"].map(v => <span key={v}>{v}</span>)}
        </div>
      </div>

      {/* LEAK */}
      <section className="leak">
        <div className="wrap leak-grid">
          <div className="reveal">
            <h2>Every message you miss is money <em>walking to the business next door.</em></h2>
            <p>Customers don't wait anymore. If you don't reply in minutes, they message your competitor. You're not losing them because your service is bad — you're losing them because you were busy doing the service.</p>
          </div>
          <div className="ledger reveal">
            {LEDGER.map((r, i) => (
              <div key={i} className={`ledger-row${i === LEDGER.length - 1 ? " ledger-last" : ""}`}>
                <span className="ledger-time">{r.time}</span>
                <span className="ledger-what">{r.what}</span>
                <span className="ledger-loss">{r.loss}</span>
              </div>
            ))}
            <div className="ledger-total">
              <span className="ledger-total-label">Lost today</span>
              <span className="ledger-total-val">–₹6,350</span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW */}
      <section className="section" id="how">
        <div className="wrap">
          <div className="section-head reveal">
            <p className="kicker">How it works</p>
            <h2 className="title">Live on your number in one day. We do the setup with you.</h2>
          </div>
          <div className="steps">
            {[
              { h:"Connect your WhatsApp number", p:"Your existing business number, or a new one. Customers see your business name, not ours.", note:"~20 minutes" },
              { h:"Fastrill learns your business", p:"Your services, prices, timings, staff, languages. You review its answers before it goes live — nothing reaches customers without your sign-off.", note:"Same day" },
              { h:"Customers book while you work", p:"Fastrill answers, books, collects payment and reminds. You watch everything from one dashboard and jump into any chat whenever you want.", note:"From day 1" },
            ].map((s,i) => (
              <div key={i} className="step reveal">
                <div className="step-num">{String(i+1).padStart(2,"0")}</div>
                <h3>{s.h}</h3>
                <p>{s.p}</p>
                <span className="step-note">{s.note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section pt-0" id="features">
        <div className="wrap">
          <div className="section-head reveal">
            <p className="kicker">What it handles</p>
            <h2 className="title">A full-time receptionist's job. Minus the salary, leaves and lunch breaks.</h2>
          </div>
          <div className="bento">
            <div className="cell cell-big reveal">
              <span className="pill">Bookings — the core</span>
              <h3>Books, reschedules and cancels real appointments</h3>
              <p>Fastrill checks your actual calendar, offers open slots, confirms the booking and blocks the time. Reschedules and cancellations handled in chat too — with reminders before every appointment so no-shows drop.</p>
            </div>
            <div className="cell cell-tall reveal">
              <span className="pill">Languages</span>
              <h3>Speaks your customer's language</h3>
              <p>Telugu, Hindi, English and 7 more — including the Hinglish mix people actually type. Auto-detected per conversation.</p>
              <div className="mini-quote">"It replied to a patient at midnight and I woke up to a booked slot with advance paid."<small>— the moment it clicks for every owner</small></div>
            </div>
            <div className="cell cell-sm reveal">
              <span className="pill">Campaigns</span>
              <h3>Bulk WhatsApp campaigns</h3>
              <p>Send festival offers or re-engagement messages to your entire customer list. Fastrill handles the flood of replies and converts them into bookings — with full revenue tracking.</p>
            </div>
            <div className="cell cell-sm reveal">
              <span className="pill">Lead recovery</span>
              <h3>Wins back lost leads automatically</h3>
              <p>Customer went quiet after enquiring? Fastrill follows up with a sequence of messages over 24–48 hours and brings them back — without you lifting a finger.</p>
            </div>
            <div className="cell cell-sm reveal">
              <span className="pill">Payments</span>
              <h3>Collects advance payment in chat</h3>
              <p>UPI payment links sent inside WhatsApp. Advance-paid customers actually show up. No-shows drop dramatically.</p>
            </div>
            <div className="cell cell-sm reveal">
              <span className="pill">Missed calls</span>
              <h3>Recovers missed calls instantly</h3>
              <p>Can't pick up? The caller instantly gets a WhatsApp message from Fastrill and books there instead. Zero lost leads from busy hours.</p>
            </div>
            <div className="cell cell-sm reveal">
              <span className="pill">Analytics</span>
              <h3>Revenue per campaign & booking trends</h3>
              <p>See which campaigns drove bookings, which services are trending, peak hours, and customer lifetime value — all from one dashboard.</p>
            </div>
            <div className="cell cell-sm reveal">
              <span className="pill">Control</span>
              <h3>You stay in control, always</h3>
              <p>Complex question or upset customer? Fastrill alerts you and steps aside. Take over any chat, any time, then hand back to AI when you're done.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section testimonials-section">
        <div className="wrap">
          <div className="section-head reveal">
            <p className="kicker">Results</p>
            <h2 className="title">Real businesses. Real numbers.</h2>
          </div>
          <div className="test-grid reveal">
            <div className="test-main">
              <div className="test-qmark">"</div>
              <p className="test-quote">{TESTIMONIALS[activeT].quote}</p>
              <div className="test-auth">
                <div className="test-av">{TESTIMONIALS[activeT].name[0]}</div>
                <div>
                  <div className="test-name">{TESTIMONIALS[activeT].name}</div>
                  <div className="test-biz">{TESTIMONIALS[activeT].biz}</div>
                </div>
              </div>
            </div>
            <div className="test-rail">
              {TESTIMONIALS.map((t,i) => (
                <button key={t.name} className={`test-btn${i===activeT?" active":""}`} onClick={() => setActiveT(i)}>
                  <div className="test-stat">{t.stat}</div>
                  <div className="test-stat-label">{t.statLabel}</div>
                  <div className="test-person">{t.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section pricing" id="pricing">
        <div className="wrap">
          <div className="section-head reveal">
            <p className="kicker">Pricing</p>
            <h2 className="title">Start free for 14 days. Pick a plan when it's earning for you.</h2>
            <p>No per-message charges. No setup fee. Cancel anytime from the dashboard.</p>
          </div>
          <div className="plans">
            {PLANS.map(p => (
              <div key={p.name} className={`plan reveal${p.featured ? " plan-featured" : ""}`}>
                {p.featured && <span className="plan-badge">Most popular</span>}
                <h3>{p.name}</h3>
                <p className="plan-tag">{p.tag}</p>
                <div className="plan-price">₹{p.price}<small> /month + GST</small></div>
                <ul className="plan-feats">
                  {p.features.map(f => <li key={f}><span className="check">✓</span>{f}</li>)}
                  {p.missing.map(f => <li key={f} className="miss"><span className="cross">✗</span>{f}</li>)}
                </ul>
                <a className={`btn plan-cta ${p.featured ? "btn-marigold" : "btn-ghost"}`} href="/signup">Start free trial</a>
              </div>
            ))}
          </div>
          <p className="roi reveal"><strong>It pays for itself with 4–5 saved bookings a month.</strong> Most businesses lose more than that in unanswered messages every single week.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="wrap">
          <div className="section-head reveal">
            <p className="kicker">Questions owners actually ask</p>
            <h2 className="title">Before you ask —</h2>
          </div>
          <div className="faq reveal">
            {FAQS.map((f,i) => (
              <div key={i} className={`faq-item${openFaq===i?" open":""}`}>
                <button className="faq-q" onClick={() => setOpenFaq(openFaq===i?null:i)}>
                  {f.q}<span className="faq-icon">{openFaq===i?"−":"+"}</span>
                </button>
                <div className="faq-a"><p>{f.a}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final">
        <div className="wrap">
          <h2>Don't take our word for it.<br />Take Fastrill's.</h2>
          <p>The demo <strong>is</strong> the product — message it right now and try to stump it. Ask prices, book a slot, cancel it, ask in Telugu. See what your customers would see.</p>
          <div className="final-ctas">
            <a className="btn btn-white" href={WA_LINK} target="_blank" rel="noopener noreferrer"><WaIcon /> Message Fastrill on WhatsApp</a>
            <a className="btn btn-ghost-light" href="/signup">Start free trial →</a>
          </div>
          <p className="final-note">14-day free trial · No credit card · Cancel anytime</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="wrap footer-inner">
          <div className="footer-brand">
            <a href="/" className="logo">
              <img src="/logo.png" alt="Fastrill" className="logo-img" />
              <span className="logo-text">fast<em>rill</em></span>
            </a>
            <p className="footer-tagline">AI-powered WhatsApp automation for Indian service businesses. Built by Solvabil Pvt. Ltd., Hyderabad.</p>
          </div>
          <div className="footer-cols">
            <div>
              <div className="footer-col-h">Product</div>
              <ul className="footer-links">
                <li><a href="#how">How it works</a></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="/signup">Start free trial</a></li>
                <li><a href="/login">Sign in</a></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-h">Company</div>
              <ul className="footer-links">
                <li><a href="mailto:hello@fastrill.com">hello@fastrill.com</a></li>
                <li><a href={WA_LINK} target="_blank" rel="noopener noreferrer">WhatsApp us</a></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-h">Legal</div>
              <ul className="footer-links">
                <li><a href="/privacy">Privacy Policy</a></li>
                <li><a href="/terms">Terms of Service</a></li>
                <li><a href="/refund">Refund Policy</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="wrap footer-bot">
          <span>© 2026 Fastrill — Solvabil Pvt. Ltd. All rights reserved.</span>
          <span>Made with conviction in Hyderabad 🇮🇳</span>
        </div>
      </footer>
    </>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

:root{
  --ink:#14201B;--ink-soft:#3D4A44;--paper:#FBFAF6;--card:#FFFFFF;
  --teal:#075E54;--teal-light:#EAF4F1;--teal-border:#CFE5DF;
  --wa-green:#25D366;--marigold:#F2A007;--marigold-soft:#FDF3DC;--marigold-border:#EFD9A8;
  --line:#E4E1D6;--bubble-out:#D9FDD3;--red:#E86A5E;
  --display:'Bricolage Grotesque',sans-serif;--body:'IBM Plex Sans',sans-serif;
  --chat:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  --radius:14px;
}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:var(--body);background:var(--paper);color:var(--ink);line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
.wrap{max-width:1120px;margin:0 auto;padding:0 24px}
:focus-visible{outline:3px solid var(--marigold);outline-offset:3px;border-radius:4px}
.pt-0{padding-top:0!important}

/* NAV */
.nav{position:sticky;top:0;z-index:100;background:rgba(251,250,246,.92);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.nav-inner{display:flex;align-items:center;justify-content:space-between;height:64px}
.logo{display:flex;align-items:center;gap:10px;text-decoration:none}
.logo-img{width:32px;height:32px;object-fit:contain}
.logo-text{font-family:var(--display);font-weight:800;font-size:1.3rem;letter-spacing:-.03em;color:var(--ink)}
.logo-text em{color:#00C9B1;font-style:normal}
.nav-links{display:flex;align-items:center;gap:24px;font-size:.92rem;font-weight:500}
.nav-links a{color:var(--ink-soft);transition:color .15s}
.nav-links a:hover{color:var(--ink)}
.nav-signin{color:var(--teal)!important;font-weight:600}
.hbg{display:none;flex-direction:column;gap:5px;background:none;border:1.5px solid var(--line);border-radius:8px;padding:8px 10px;cursor:pointer}
.hbg span{display:block;width:18px;height:2px;background:var(--ink-soft);border-radius:2px;transition:all .2s}
.mdr{position:fixed;top:64px;left:0;right:0;z-index:99;background:rgba(251,250,246,.97);backdrop-filter:blur(12px);border-bottom:1px solid var(--line);padding:8px 16px 20px;display:flex;flex-direction:column;gap:2px;transform:translateY(-110%);transition:transform .25s ease}
.mdr.open{transform:none}
.mdr a{color:var(--ink-soft);font-size:14px;font-weight:500;padding:12px 14px;border-radius:8px;display:block;transition:color .15s,background .15s}
.mdr a:hover{color:var(--ink);background:rgba(0,0,0,.03)}

/* BUTTONS */
.btn{display:inline-flex;align-items:center;gap:9px;font-family:var(--body);font-weight:600;border-radius:999px;cursor:pointer;transition:transform .15s ease,box-shadow .15s ease,opacity .15s;text-decoration:none;border:none}
.btn:hover{transform:translateY(-1px)}
.btn-teal{background:var(--teal);color:#fff;padding:10px 22px;box-shadow:0 4px 14px rgba(7,94,84,.2)}
.btn-teal:hover{box-shadow:0 6px 20px rgba(7,94,84,.3)}
.btn-nav{padding:9px 18px;font-size:.9rem}
.btn-lg{padding:13px 28px;font-size:1rem}
.btn-ghost{border:1.5px solid var(--line);background:var(--card);color:var(--ink);padding:10px 22px}
.btn-ghost-light{border:1.5px solid rgba(255,255,255,.3);background:transparent;color:#fff;padding:13px 28px;font-size:1rem}
.btn-ghost-light:hover{background:rgba(255,255,255,.1)}
.btn-marigold{background:var(--marigold);color:var(--ink);padding:13px 24px}
.btn-white{background:#fff;color:var(--teal);padding:15px 32px;font-size:1.02rem;font-weight:700;box-shadow:0 4px 20px rgba(0,0,0,.15)}

/* HERO */
.hero{padding:72px 0 88px}
.hero-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center}
.eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:.78rem;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--teal);background:var(--teal-light);border:1px solid var(--teal-border);padding:6px 14px;border-radius:999px;margin-bottom:22px}
h1{font-family:var(--display);font-weight:800;font-size:clamp(2.4rem,4.6vw,3.6rem);line-height:1.06;letter-spacing:-.025em}
.accent{color:var(--teal);position:relative;white-space:nowrap}
.accent::after{content:'';position:absolute;left:0;right:0;bottom:4px;height:10px;background:var(--marigold-soft);z-index:-1;border-radius:3px}
.hero-sub{font-size:1.08rem;color:var(--ink-soft);margin:20px 0 28px;max-width:32rem}
.hero-ctas{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.cta-note{font-size:.87rem;color:var(--ink-soft);margin-top:14px}
.cta-note strong{color:var(--ink)}
.trust-row{display:flex;gap:18px;flex-wrap:wrap;margin-top:20px}
.trust-item{font-size:.82rem;font-weight:600;color:var(--teal)}

/* PHONE */
.phone-wrap{display:flex;justify-content:center;position:relative}
.late-tag{position:absolute;top:-16px;right:4%;background:var(--ink);color:var(--marigold);font-family:var(--display);font-weight:700;font-size:.82rem;padding:7px 15px;border-radius:999px;transform:rotate(3deg);z-index:5;box-shadow:0 6px 18px rgba(20,32,27,.25)}
.phone{width:320px;background:#111B21;border-radius:38px;padding:11px;box-shadow:0 30px 60px -18px rgba(20,32,27,.4)}
.screen{background:#EFEAE2;border-radius:28px;overflow:hidden;display:flex;flex-direction:column;height:540px}
.chat-header{background:var(--teal);color:#fff;padding:13px 15px;display:flex;align-items:center;gap:11px;font-family:var(--chat)}
.avatar{width:36px;height:36px;border-radius:50%;background:var(--marigold);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--ink);font-size:.95rem;flex-shrink:0}
.chat-name{font-size:.92rem;font-weight:600;line-height:1.2}
.chat-status{font-size:.72rem;opacity:.85}
.chat-body{flex:1;padding:14px 11px;display:flex;flex-direction:column;gap:9px;font-family:var(--chat);overflow:hidden}
.day-chip{align-self:center;background:#fff;border-radius:8px;padding:3px 11px;font-size:.7rem;color:#54656F;box-shadow:0 1px 1px rgba(0,0,0,.08)}
.msg{max-width:82%;padding:8px 12px;border-radius:10px;font-size:.83rem;line-height:1.45;box-shadow:0 1px 1px rgba(0,0,0,.07);opacity:0;transform:translateY(8px)}
.msg.show{animation:pop .35s ease forwards}
@keyframes pop{to{opacity:1;transform:translateY(0)}}
.msg-in{align-self:flex-start;background:#fff;border-top-left-radius:2px}
.msg-out{align-self:flex-end;background:var(--bubble-out);border-top-right-radius:2px}
.msg-time{display:block;font-size:.63rem;color:#667781;text-align:right;margin-top:3px}
.ticks{color:#53BDEB}
.typing{align-self:flex-end;background:var(--bubble-out);border-radius:10px;padding:11px 15px;display:none;gap:4px}
.typing.show{display:flex}
.typing span{width:6px;height:6px;border-radius:50%;background:#7A8B84;animation:blink 1.2s infinite}
.typing span:nth-child(2){animation-delay:.2s}
.typing span:nth-child(3){animation-delay:.4s}
@keyframes blink{0%,80%,100%{opacity:.3}40%{opacity:1}}

/* VERTICALS */
.verticals{border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--card)}
.verticals-inner{display:flex;gap:24px;align-items:center;justify-content:center;flex-wrap:wrap;padding:16px 0;font-size:.88rem;color:var(--ink-soft);font-weight:500}
.verticals-label{font-family:var(--display);font-weight:700;color:var(--ink);font-size:.9rem}

/* LEAK */
.leak{background:var(--ink);color:var(--paper);padding:80px 0}
.leak-grid{display:grid;grid-template-columns:1fr 1.2fr;gap:56px;align-items:center}
.leak h2{font-family:var(--display);font-weight:800;font-size:clamp(1.8rem,3.2vw,2.5rem);line-height:1.12;letter-spacing:-.02em}
.leak h2 em{font-style:normal;color:var(--marigold)}
.leak p{color:#B9C4BE;margin-top:18px;font-size:1rem;max-width:26rem}
.ledger{border:1px solid #2B3833;border-radius:var(--radius);overflow:hidden}
.ledger-row{display:grid;grid-template-columns:80px 1fr auto;gap:14px;align-items:center;padding:16px 20px;border-bottom:1px solid #2B3833;font-size:.92rem}
.ledger-last{background:#1D2B25}
.ledger-time{font-family:var(--display);font-weight:600;color:#8A9992;font-size:.82rem}
.ledger-what{color:#DDE4E0;font-size:.88rem}
.ledger-loss{font-family:var(--display);font-weight:700;color:var(--red);white-space:nowrap}
.ledger-last .ledger-loss{color:var(--marigold)}
.ledger-total{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;background:#0D1A16;border-top:2px solid #3D5248}
.ledger-total-label{font-size:.85rem;font-weight:600;color:#8A9992;letter-spacing:.04em;text-transform:uppercase}
.ledger-total-val{font-family:var(--display);font-weight:800;font-size:1.4rem;color:var(--red)}

/* SECTIONS */
.section{padding:88px 0}
.section-head{max-width:40rem;margin-bottom:52px}
.kicker{font-size:.78rem;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--teal);margin-bottom:12px}
h2.title{font-family:var(--display);font-weight:800;font-size:clamp(1.7rem,3vw,2.4rem);letter-spacing:-.02em;line-height:1.12}
.section-head p{color:var(--ink-soft);margin-top:14px;font-size:1rem}

/* STEPS */
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.step{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:32px 26px}
.step-num{font-family:var(--display);font-weight:800;font-size:2.8rem;color:var(--marigold);line-height:1;margin-bottom:18px}
.step h3{font-family:var(--display);font-weight:700;font-size:1.12rem;margin-bottom:10px;letter-spacing:-.01em}
.step p{font-size:.93rem;color:var(--ink-soft)}
.step-note{display:inline-block;margin-top:16px;font-size:.8rem;font-weight:600;color:var(--teal);background:var(--teal-light);padding:4px 10px;border-radius:6px}

/* BENTO */
.bento{display:grid;grid-template-columns:repeat(6,1fr);gap:16px}
.cell{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:26px 24px}
.cell h3{font-family:var(--display);font-weight:700;font-size:1.08rem;margin-bottom:8px;letter-spacing:-.01em}
.cell p{font-size:.91rem;color:var(--ink-soft);line-height:1.65}
.cell-big{grid-column:span 4;background:linear-gradient(135deg,var(--teal-light) 0%,var(--card) 60%)}
.cell-big h3{font-size:1.3rem}
.cell-big p{max-width:32rem;font-size:.97rem}
.cell-tall{grid-column:span 2;grid-row:span 2;background:var(--marigold-soft);border-color:var(--marigold-border);display:flex;flex-direction:column;justify-content:space-between}
.mini-quote{font-family:var(--display);font-weight:600;font-size:1rem;line-height:1.4;margin-top:24px;color:var(--ink)}
.mini-quote small{display:block;font-family:var(--body);font-weight:500;font-size:.78rem;color:var(--ink-soft);margin-top:8px}
.cell-sm{grid-column:span 2}
.pill{display:inline-block;font-size:.7rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--teal);background:var(--teal-light);padding:4px 10px;border-radius:6px;margin-bottom:12px}
.cell-tall .pill{background:#fff}

/* TESTIMONIALS */
.testimonials-section{background:var(--card);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.test-grid{display:grid;grid-template-columns:1.5fr 1fr;gap:clamp(32px,5vw,72px);align-items:start}
.test-qmark{font-size:80px;line-height:0.6;color:rgba(7,94,84,.1);margin-bottom:10px;display:block;font-family:var(--display)}
.test-quote{font-size:clamp(17px,2vw,22px);font-weight:600;color:var(--ink);line-height:1.5;letter-spacing:-.01em;margin-bottom:28px;min-height:90px;font-family:var(--display)}
.test-auth{display:flex;align-items:center;gap:12px;padding-top:20px;border-top:1px solid var(--line)}
.test-av{width:38px;height:38px;border-radius:50%;background:var(--teal);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#fff;flex-shrink:0}
.test-name{font-size:13px;font-weight:700;color:var(--ink)}
.test-biz{font-size:11.5px;color:var(--ink-soft)}
.test-rail{display:flex;flex-direction:column;border-left:1px solid var(--line)}
.test-btn{text-align:left;background:none;border:none;border-left:2px solid transparent;margin-left:-1px;padding:18px 0 18px 22px;cursor:pointer;font-family:var(--body);transition:all .2s}
.test-btn.active{border-left-color:var(--teal);background:linear-gradient(90deg,var(--teal-light),transparent 70%)}
.test-stat{font-family:var(--display);font-size:22px;font-weight:800;color:var(--ink-soft);margin-bottom:3px;transition:color .2s}
.test-btn.active .test-stat{color:var(--teal)}
.test-stat-label{font-size:10.5px;color:var(--ink-soft);margin-bottom:4px}
.test-person{font-size:11px;color:var(--ink-soft)}

/* PRICING */
.pricing{background:var(--card);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.plans{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;align-items:stretch}
.plan{background:var(--paper);border:1px solid var(--line);border-radius:18px;padding:32px 26px;display:flex;flex-direction:column;position:relative;transition:transform .2s,box-shadow .2s}
.plan:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(20,32,27,.08)}
.plan-featured{background:var(--ink);color:var(--paper);border-color:var(--ink);transform:scale(1.03)}
.plan-featured:hover{transform:scale(1.03) translateY(-2px)}
.plan-badge{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--marigold);color:var(--ink);font-family:var(--display);font-weight:700;font-size:.76rem;padding:5px 14px;border-radius:999px;white-space:nowrap}
.plan h3{font-family:var(--display);font-weight:800;font-size:1.25rem;letter-spacing:-.01em}
.plan-tag{font-size:.86rem;color:var(--ink-soft);margin-top:4px;min-height:2.4em}
.plan-featured .plan-tag{color:#9FB0A9}
.plan-price{font-family:var(--display);font-weight:800;font-size:2.2rem;letter-spacing:-.03em;margin:16px 0 18px;line-height:1}
.plan-price small{font-size:.88rem;font-weight:500;color:var(--ink-soft);letter-spacing:0}
.plan-featured .plan-price small{color:#9FB0A9}
.plan-feats{list-style:none;display:flex;flex-direction:column;gap:10px;margin-bottom:26px;flex:1}
.plan-feats li{display:flex;gap:9px;align-items:flex-start;font-size:.88rem;color:var(--ink-soft)}
.plan-featured .plan-feats li{color:#DDE4E0}
.plan-feats li.miss{opacity:.4}
.check{color:var(--wa-green);font-weight:700;flex-shrink:0;margin-top:1px}
.cross{color:var(--red);opacity:.5;font-weight:700;flex-shrink:0;margin-top:1px}
.plan-featured .cross{color:#E86A5E}
.plan-cta{justify-content:center;width:100%;padding:13px 24px;font-size:.95rem}

.roi{margin-top:36px;text-align:center;color:var(--ink-soft);font-size:.96rem}
.roi strong{font-family:var(--display);color:var(--ink)}

/* FAQ */
.faq{max-width:44rem}
.faq-item{border-bottom:1px solid var(--line)}
.faq-item:first-child{border-top:1px solid var(--line)}
.faq-q{width:100%;background:none;border:none;padding:18px 0;text-align:left;font-family:var(--display);font-weight:600;font-size:1.02rem;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:14px;color:var(--ink);transition:color .2s}
.faq-q:hover{color:var(--teal)}
.faq-icon{font-size:1.4rem;font-weight:400;color:var(--teal);flex-shrink:0;transition:transform .2s}
.faq-item.open .faq-icon{transform:rotate(45deg)}
.faq-a{max-height:0;overflow:hidden;transition:max-height .3s ease,padding .3s ease}
.faq-item.open .faq-a{max-height:200px;padding-bottom:18px}
.faq-a p{font-size:.94rem;color:var(--ink-soft);max-width:38rem}

/* FINAL CTA */
.final{background:var(--teal);color:#fff;padding:88px 0;text-align:center;position:relative;overflow:hidden}
.final::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 80% 20%,rgba(242,160,7,.18),transparent 45%);pointer-events:none}
.final h2{font-family:var(--display);font-weight:800;font-size:clamp(1.9rem,3.6vw,2.8rem);letter-spacing:-.02em;line-height:1.1;position:relative}
.final p{margin:16px auto 32px;max-width:30rem;color:#CBE3DE;position:relative;font-size:.98rem}
.final p strong{color:#fff}
.final-ctas{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;position:relative}
.final-note{margin-top:20px;font-size:.82rem;color:rgba(255,255,255,.55);position:relative}

/* FOOTER */
.footer{background:var(--ink);color:var(--paper);padding:56px 0 0}
.footer-inner{display:grid;grid-template-columns:1.6fr 1fr;gap:48px;padding-bottom:40px;border-bottom:1px solid #2B3833}
.footer-brand .logo-text{color:#fff}
.footer-tagline{font-size:.84rem;color:#8A9992;line-height:1.8;margin-top:14px;max-width:260px}
.footer-cols{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.footer-col-h{font-size:.75rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#8A9992;margin-bottom:14px}
.footer-links{list-style:none;display:flex;flex-direction:column;gap:9px}
.footer-links a{font-size:.88rem;color:#B9C4BE;transition:color .15s}
.footer-links a:hover{color:#fff}
.footer-bot{display:flex;justify-content:space-between;align-items:center;font-size:.8rem;color:#5C6B64;flex-wrap:wrap;gap:8px;padding:20px 0}

/* REVEAL */
.reveal{opacity:0;transform:translateY(18px);transition:opacity .55s ease,transform .55s ease}
.reveal.in{opacity:1;transform:none}

@media(prefers-reduced-motion:reduce){
  .msg,.typing span,.reveal,.btn{animation:none!important;transition:none!important;opacity:1!important;transform:none!important}
  html{scroll-behavior:auto}
}
@media(max-width:900px){
  .hero-grid,.leak-grid{grid-template-columns:1fr;gap:44px}
  .steps,.plans{grid-template-columns:1fr}
  .plan-featured{transform:none}
  .bento{grid-template-columns:1fr 1fr}
  .cell-big,.cell-tall,.cell-sm{grid-column:span 2;grid-row:auto}
  .nav-links a:not(.btn-teal):not(.nav-signin){display:none}
  .hbg{display:flex}
  .hero{padding:48px 0 64px}
  .phone{width:295px}
  .screen{height:510px}
  .test-grid{grid-template-columns:1fr;gap:28px}
  .test-rail{border-left:none;border-top:1px solid var(--line);flex-direction:row;flex-wrap:wrap}
  .test-btn{border-left:none;border-top:2px solid transparent;margin:0;padding:12px 16px 12px 0}
  .test-btn.active{border-top-color:var(--teal);background:none}
  .footer-inner{grid-template-columns:1fr}
  .footer-cols{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:540px){
  .bento{grid-template-columns:1fr}
  .cell-big,.cell-tall,.cell-sm{grid-column:span 1}
  .ledger-row{grid-template-columns:70px 1fr;gap:8px}
  .ledger-loss{grid-column:span 2;text-align:right}
  .footer-cols{grid-template-columns:1fr}
}
`;
