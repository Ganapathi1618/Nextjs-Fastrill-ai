"use client";
import { useEffect } from "react";

/* ============================================================
   FASTRILL — MARKETING PAGE (final)
   Drop-in replacement for app/page.js
   TODO before deploy:
   1. Replace 91XXXXXXXXXX in WA_LINK with your demo number
   2. Confirm plan prices below match your Razorpay plans
   ============================================================ */

const WA_LINK =
  "https://wa.me/91XXXXXXXXXX?text=Hi%2C%20show%20me%20a%20Fastrill%20demo";

const PLANS = [
  {
    name: "Starter",
    price: "999", // TODO: confirm against Razorpay plan
    tag: "For one location getting started",
    features: [
      "AI receptionist on WhatsApp",
      "Appointment booking + reminders",
      "Missed-call to WhatsApp recovery",
      "Dashboard with all chats & bookings",
    ],
    featured: false,
  },
  {
    name: "Growth",
    price: "1,999", // TODO: confirm against Razorpay plan
    tag: "For busy businesses that live on bookings",
    features: [
      "Everything in Starter",
      "UPI payment collection in chat",
      "Campaigns — offers to your customer list",
      "Lead recovery follow-ups",
      "10 languages incl. Telugu & Hindi",
    ],
    featured: true,
  },
  {
    name: "Pro",
    price: "3,999", // TODO: confirm against Razorpay plan
    tag: "For teams and multiple staff calendars",
    features: [
      "Everything in Growth",
      "Multiple staff / resource calendars",
      "Priority support & setup",
      "Early access to voice agent",
    ],
    featured: false,
  },
];

const CHAT = [
  {
    dir: "in",
    delay: 600,
    text: "Sir, my back pain is worse. Any slot with doctor tomorrow?",
    time: "11:47 PM",
  },
  {
    dir: "out",
    delay: 2300,
    text:
      "Sorry to hear that! Dr. Meena has 10:30 AM and 6:15 PM open tomorrow. Consultation is ₹500. Which works for you?",
    time: "11:47 PM",
  },
  { dir: "in", delay: 3900, text: "10.30 pls", time: "11:48 PM" },
  {
    dir: "out",
    delay: 5500,
    text:
      "Booked ✅ Physio consultation, tomorrow 10:30 AM with Dr. Meena. You'll get a reminder at 9:30 AM. Feel better soon! 🙏",
    time: "11:48 PM",
  },
];

const LEDGER = [
  {
    time: "9:15 AM",
    what: "\u201CAny appointment today?\u201D — clinic front desk busy, patient booked elsewhere",
    loss: "–₹500",
  },
  {
    time: "1:40 PM",
    what: "Missed call at the salon during a client session",
    loss: "–₹650",
  },
  {
    time: "6:20 PM",
    what: "\u201CFees for weekend batch?\u201D — coaching centre replied next day, parent moved on",
    loss: "–₹4,000",
  },
  {
    time: "11:47 PM",
    what: "Late-night enquiry at the gym — nobody awake to answer",
    loss: "–₹1,200",
  },
];

const WaIcon = () => (
  <svg className="wa-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.5 14.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.82 9.82 0 0 1-1.51-5.26c0-5.44 4.43-9.87 9.89-9.87 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.98c0 5.45-4.43 9.88-9.88 9.88m8.4-18.28A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.34.15 11.9c0 2.1.55 4.14 1.59 5.95L.05 24l6.3-1.65a11.9 11.9 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.9-11.9 0-3.18-1.24-6.17-3.49-8.42" />
  </svg>
);

export default function Home() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* Chat animation */
    const msgs = document.querySelectorAll("#chat .msg");
    const typing = document.getElementById("typing");
    const timers = [];
    if (reduced) {
      msgs.forEach((m) => m.classList.add("show"));
    } else {
      msgs.forEach((m) => {
        const d = parseInt(m.dataset.delay, 10);
        if (m.classList.contains("msg-out")) {
          timers.push(setTimeout(() => typing && typing.classList.add("show"), d - 1100));
          timers.push(
            setTimeout(() => {
              typing && typing.classList.remove("show");
              m.classList.add("show");
            }, d)
          );
        } else {
          timers.push(setTimeout(() => m.classList.add("show"), d));
        }
      });
    }

    /* Scroll reveals */
    const els = document.querySelectorAll(".reveal");
    let io;
    if (reduced || !("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("in"));
    } else {
      io = new IntersectionObserver(
        (entries) =>
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add("in");
              io.unobserve(en.target);
            }
          }),
        { threshold: 0.15 }
      );
      els.forEach((e) => io.observe(e));
    }

    return () => {
      timers.forEach(clearTimeout);
      if (io) io.disconnect();
    };
  }, []);

  return (
    <>
      <style>{css}</style>

      <nav className="nav">
        <div className="wrap nav-inner">
          <a href="#" className="logo">
            <span className="logo-dot" />
            Fastrill
          </a>
          <div className="nav-links">
            <a href="#how">How it works</a>
            <a href="#features">What it handles</a>
            <a href="#pricing">Pricing</a>
            <a className="btn btn-nav" href="/signup">
              Start free trial
            </a>
          </div>
        </div>
      </nav>

      {/* ---------- HERO ---------- */}
      <header className="hero">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">AI receptionist · lives inside WhatsApp</span>
            <h1>
              You close at 9.
              <br />
              <span className="accent">Your bookings don&apos;t.</span>
            </h1>
            <p className="hero-sub">
              Fastrill answers every WhatsApp message your business gets — books
              appointments, collects payment, sends reminders. In seconds, in 10
              languages, at any hour. Built for clinics, salons, gyms, coaching
              centres — any business that runs on appointments.
            </p>
            <div className="hero-ctas">
              <a className="btn btn-green" href="/signup">
                Start free 14-day trial
              </a>
              <a className="btn btn-ghost" href={WA_LINK} target="_blank" rel="noopener noreferrer">
                <WaIcon /> See the live demo
              </a>
            </div>
            <p className="cta-note">
              The demo is Fastrill itself, answering you on WhatsApp.{" "}
              <strong>No signup, no call, 60 seconds.</strong>
            </p>
          </div>

          <div className="phone-wrap">
            <span className="late-tag">11:47 PM — you&apos;re asleep</span>
            <div
              className="phone"
              aria-label="Example WhatsApp conversation where Fastrill books an appointment late at night"
            >
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
                      <span className="msg-time">
                        {m.time} {m.dir === "out" && <span className="ticks">✓✓</span>}
                      </span>
                    </div>
                  ))}
                  <div className="typing" id="typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ---------- VERTICALS STRIP ---------- */}
      <div className="verticals">
        <div className="wrap verticals-inner">
          <span className="verticals-label">Running on appointments?</span>
          <span>Clinics</span>
          <span>Salons &amp; spas</span>
          <span>Gyms &amp; fitness</span>
          <span>Coaching centres</span>
          <span>Dental &amp; physio</span>
          <span>Home services</span>
        </div>
      </div>

      {/* ---------- LEAK ---------- */}
      <section className="leak">
        <div className="wrap leak-grid">
          <div className="reveal">
            <h2>
              Every message you miss is money{" "}
              <em>walking to the business next door.</em>
            </h2>
            <p>
              Customers don&apos;t wait anymore. If you don&apos;t reply in a few
              minutes, they message your competitor. You&apos;re not losing them
              because your service is bad — you&apos;re losing them because you were
              busy doing the service.
            </p>
          </div>
          <div
            className="ledger reveal"
            aria-label="Example of revenue lost from unanswered messages in one day"
          >
            {LEDGER.map((r, i) => (
              <div key={i} className="ledger-row">
                <span className="ledger-time">{r.time}</span>
                <span className="ledger-what">{r.what}</span>
                <span className="ledger-loss">{r.loss}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- HOW ---------- */}
      <section className="section" id="how">
        <div className="wrap">
          <div className="section-head reveal">
            <p className="kicker">How it works</p>
            <h2 className="title">Live on your number in one day. We do the setup with you.</h2>
          </div>
          <div className="steps">
            <div className="step reveal">
              <h3>Connect your WhatsApp number</h3>
              <p>
                Your existing business number, or a new one — your choice. Customers
                see your business name, not ours.
              </p>
              <span className="step-note">~20 minutes</span>
            </div>
            <div className="step reveal">
              <h3>Fastrill learns your business</h3>
              <p>
                Your services, prices, timings, staff, languages. You review its
                answers before it goes live — nothing reaches customers without your
                sign-off.
              </p>
              <span className="step-note">Same day</span>
            </div>
            <div className="step reveal">
              <h3>Customers book while you work</h3>
              <p>
                Fastrill answers, books, collects payment and reminds. You watch
                everything from one dashboard and jump into any chat whenever you
                want.
              </p>
              <span className="step-note">From day 1</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section className="section pt-0" id="features">
        <div className="wrap">
          <div className="section-head reveal">
            <p className="kicker">What it handles</p>
            <h2 className="title">
              A full-time receptionist&apos;s job. Minus the salary, leaves and lunch
              breaks.
            </h2>
          </div>
          <div className="bento">
            <div className="cell cell-big reveal">
              <span className="pill">Bookings — the specialty</span>
              <h3>Books, reschedules and cancels real appointments</h3>
              <p>
                Fastrill checks your actual calendar, offers open slots, confirms the
                booking and blocks the time. Reschedules and cancellations handled in
                chat too — with reminders before every appointment so no-shows drop.
              </p>
            </div>
            <div className="cell cell-tall reveal">
              <span className="pill">Why owners switch</span>
              <h3>Speaks your customer&apos;s language</h3>
              <p>
                Telugu, Hindi, English and 7 more — including the Hinglish mix people
                actually type. No &quot;press 1 for services&quot; menus.
              </p>
              <div className="mini-quote">
                &quot;It replied to a patient at midnight and I woke up to a booked
                slot with advance paid.&quot;
                <small>— the moment it clicks for every owner</small>
              </div>
            </div>
            <div className="cell cell-sm reveal">
              <span className="pill">Payments</span>
              <h3>Collects advance payment</h3>
              <p>UPI payment links inside the chat. Advance-paid customers actually show up.</p>
            </div>
            <div className="cell cell-sm reveal">
              <span className="pill">Missed calls</span>
              <h3>Recovers missed calls</h3>
              <p>
                Can&apos;t pick up? The caller instantly gets a WhatsApp message and
                books there instead.
              </p>
            </div>
            <div className="cell cell-sm reveal">
              <span className="pill">Campaigns</span>
              <h3>Handles offer replies</h3>
              <p>
                Send a festival offer to your customer list — Fastrill handles the
                flood of replies and converts them into bookings.
              </p>
            </div>
            <div className="cell cell-sm reveal">
              <span className="pill">You stay in control</span>
              <h3>Hands over when needed</h3>
              <p>
                Complex question or upset customer? It alerts you and steps aside. You
                can take over any chat, any time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- PRICING ---------- */}
      <section className="section pricing" id="pricing">
        <div className="wrap">
          <div className="section-head reveal">
            <p className="kicker">Pricing</p>
            <h2 className="title">Start free for 14 days. Pick a plan when it&apos;s earning for you.</h2>
            <p>
              No per-message charges that surprise you at month end. Cancel anytime
              from the dashboard.
            </p>
          </div>
          <div className="plans">
            {PLANS.map((p) => (
              <div key={p.name} className={`plan reveal${p.featured ? " plan-featured" : ""}`}>
                {p.featured && <span className="plan-badge">Most popular</span>}
                <h3>{p.name}</h3>
                <p className="plan-tag">{p.tag}</p>
                <div className="plan-price">
                  ₹{p.price}
                  <small> /month</small>
                </div>
                <ul>
                  {p.features.map((f) => (
                    <li key={f}>
                      <span className="check">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a className={`btn ${p.featured ? "btn-marigold" : "btn-ghost"} plan-cta`} href="/signup">
                  Start free trial
                </a>
              </div>
            ))}
          </div>
          <p className="roi reveal">
            <strong>It pays for itself with 4–5 saved bookings a month.</strong> Most
            businesses lose more than that in unanswered messages every single week.
          </p>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="section">
        <div className="wrap">
          <div className="section-head reveal">
            <p className="kicker">Questions owners actually ask</p>
            <h2 className="title">Before you ask —</h2>
          </div>
          <div className="faq reveal">
            <details>
              <summary>Will customers know it&apos;s not me replying?</summary>
              <p>
                It replies as your business, in your tone, with your real prices and
                timings. Most customers just notice they finally got an instant
                answer. And you can jump into any conversation yourself whenever you
                want.
              </p>
            </details>
            <details>
              <summary>What if it says something wrong?</summary>
              <p>
                It only answers from the business information you approve during
                setup — it doesn&apos;t invent prices or promises. Anything it&apos;s
                unsure about, it politely takes the customer&apos;s details and
                alerts you to follow up.
              </p>
            </details>
            <details>
              <summary>I&apos;m not technical. How hard is setup?</summary>
              <p>
                You answer questions about your business — services, prices,
                timings. We handle everything technical and you&apos;re live the same
                day. If you can use WhatsApp, you can use Fastrill.
              </p>
            </details>
            <details>
              <summary>Does it work with my existing WhatsApp number?</summary>
              <p>
                Yes — we move your number to WhatsApp Business API (your chats and
                customers stay intact), or you can run Fastrill on a fresh number and
                keep your personal one separate.
              </p>
            </details>
            <details>
              <summary>What happens after the free trial?</summary>
              <p>
                If it booked appointments for you, you&apos;ll want to keep it — pick
                a plan from your dashboard, cancel anytime. If it didn&apos;t, walk
                away. No lock-in, no awkward calls.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* ---------- FINAL CTA ---------- */}
      <section className="final">
        <div className="wrap">
          <h2>
            Don&apos;t take our word for it.
            <br />
            Take Fastrill&apos;s.
          </h2>
          <p>
            The demo <strong>is</strong> the product — message it right now and try
            to stump it. Ask prices, book a slot, cancel it, ask in Telugu. See what
            your customers would see.
          </p>
          <a className="btn btn-white" href={WA_LINK} target="_blank" rel="noopener noreferrer">
            <WaIcon /> Message Fastrill on WhatsApp
          </a>
        </div>
      </section>

      <footer className="footer">
        <div className="wrap footer-inner">
          <span>
            <strong>Fastrill</strong> · Solvabil Pvt. Ltd. · Hyderabad, India
          </span>
          <span>hello@fastrill.com</span>
        </div>
      </footer>
    </>
  );
}

/* ============================================================ CSS */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

:root{
  --ink:#14201B; --ink-soft:#3D4A44; --paper:#FBFAF6; --card:#FFFFFF;
  --teal:#075E54; --wa-green:#25D366; --marigold:#F2A007; --marigold-soft:#FDF3DC;
  --line:#E4E1D6; --bubble-out:#D9FDD3; --radius:14px;
  --display:'Bricolage Grotesque',sans-serif; --body:'IBM Plex Sans',sans-serif;
  --chat:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:var(--body);background:var(--paper);color:var(--ink);line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:inherit}
.wrap{max-width:1120px;margin:0 auto;padding:0 24px}
:focus-visible{outline:3px solid var(--marigold);outline-offset:3px;border-radius:4px}
.pt-0{padding-top:0!important}

.nav{position:sticky;top:0;z-index:50;background:rgba(251,250,246,.92);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.nav-inner{display:flex;align-items:center;justify-content:space-between;height:64px}
.logo{font-family:var(--display);font-weight:800;font-size:1.35rem;letter-spacing:-.02em;text-decoration:none;display:flex;align-items:center;gap:8px}
.logo-dot{width:10px;height:10px;border-radius:50%;background:var(--wa-green);box-shadow:0 0 0 4px rgba(37,211,102,.18)}
.nav-links{display:flex;align-items:center;gap:28px;font-size:.92rem;font-weight:500}
.nav-links a{text-decoration:none;color:var(--ink-soft)}
.nav-links a:hover{color:var(--ink)}
.btn{display:inline-flex;align-items:center;gap:10px;font-family:var(--body);font-weight:600;text-decoration:none;border-radius:999px;cursor:pointer;transition:transform .15s ease,box-shadow .15s ease}
.btn:hover{transform:translateY(-1px)}
.btn-green{background:var(--teal);color:#fff;padding:12px 24px;box-shadow:0 4px 14px rgba(7,94,84,.25)}
.btn-green:hover{box-shadow:0 6px 20px rgba(7,94,84,.32)}
.btn-nav{background:var(--teal);color:#fff;padding:9px 18px;font-size:.9rem}
.btn-ghost{border:1.5px solid var(--line);background:var(--card);color:var(--ink);padding:12px 24px}
.wa-icon{width:18px;height:18px;flex-shrink:0}

.hero{padding:72px 0 88px;position:relative;overflow:hidden}
.hero-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center}
.eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:.8rem;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--teal);background:#EAF4F1;border:1px solid #CFE5DF;padding:6px 14px;border-radius:999px;margin-bottom:22px}
h1{font-family:var(--display);font-weight:800;font-size:clamp(2.4rem,4.6vw,3.6rem);line-height:1.06;letter-spacing:-.025em}
h1 .accent{color:var(--teal);position:relative;white-space:nowrap}
h1 .accent::after{content:'';position:absolute;left:0;right:0;bottom:4px;height:10px;background:var(--marigold-soft);z-index:-1;border-radius:3px}
.hero-sub{font-size:1.13rem;color:var(--ink-soft);margin:22px 0 30px;max-width:33rem}
.hero-ctas{display:flex;gap:14px;flex-wrap:wrap;align-items:center}
.cta-note{font-size:.88rem;color:var(--ink-soft);margin-top:14px}
.cta-note strong{color:var(--ink)}

.phone-wrap{display:flex;justify-content:center;position:relative}
.late-tag{position:absolute;top:-14px;right:6%;background:var(--ink);color:var(--marigold);font-family:var(--display);font-weight:700;font-size:.85rem;padding:8px 16px;border-radius:999px;transform:rotate(3deg);z-index:5;box-shadow:0 6px 18px rgba(20,32,27,.25)}
.phone{width:330px;background:#111B21;border-radius:38px;padding:12px;box-shadow:0 30px 60px -18px rgba(20,32,27,.4)}
.screen{background:#EFEAE2;border-radius:28px;overflow:hidden;display:flex;flex-direction:column;height:560px}
.chat-header{background:var(--teal);color:#fff;padding:14px 16px;display:flex;align-items:center;gap:12px;font-family:var(--chat)}
.avatar{width:38px;height:38px;border-radius:50%;background:var(--marigold);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--ink);font-size:1rem}
.chat-name{font-size:.95rem;font-weight:600;line-height:1.2}
.chat-status{font-size:.74rem;opacity:.85}
.chat-body{flex:1;padding:16px 12px;display:flex;flex-direction:column;gap:10px;font-family:var(--chat);overflow:hidden}
.day-chip{align-self:center;background:#fff;border-radius:8px;padding:4px 12px;font-size:.72rem;color:#54656F;box-shadow:0 1px 1px rgba(0,0,0,.08)}
.msg{max-width:82%;padding:8px 12px;border-radius:10px;font-size:.85rem;line-height:1.45;box-shadow:0 1px 1px rgba(0,0,0,.08);opacity:0;transform:translateY(8px)}
.msg.show{animation:pop .35s ease forwards}
@keyframes pop{to{opacity:1;transform:translateY(0)}}
.msg-in{align-self:flex-start;background:#fff;border-top-left-radius:2px}
.msg-out{align-self:flex-end;background:var(--bubble-out);border-top-right-radius:2px}
.msg-time{display:block;font-size:.64rem;color:#667781;text-align:right;margin-top:3px}
.ticks{color:#53BDEB}
.typing{align-self:flex-end;background:var(--bubble-out);border-radius:10px;padding:12px 16px;display:none;gap:4px}
.typing.show{display:flex}
.typing span{width:6px;height:6px;border-radius:50%;background:#7A8B84;animation:blink 1.2s infinite}
.typing span:nth-child(2){animation-delay:.2s}
.typing span:nth-child(3){animation-delay:.4s}
@keyframes blink{0%,80%,100%{opacity:.3}40%{opacity:1}}

.verticals{border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--card)}
.verticals-inner{display:flex;gap:26px;align-items:center;justify-content:center;flex-wrap:wrap;padding:18px 0;font-size:.9rem;color:var(--ink-soft);font-weight:500}
.verticals-label{font-family:var(--display);font-weight:700;color:var(--ink);font-size:.92rem}

.leak{background:var(--ink);color:var(--paper);padding:76px 0}
.leak-grid{display:grid;grid-template-columns:1fr 1.2fr;gap:56px;align-items:center}
.leak h2{font-family:var(--display);font-weight:800;font-size:clamp(1.8rem,3.2vw,2.5rem);line-height:1.12;letter-spacing:-.02em}
.leak h2 em{font-style:normal;color:var(--marigold)}
.leak p{color:#B9C4BE;margin-top:18px;font-size:1.02rem;max-width:26rem}
.ledger{border:1px solid #2B3833;border-radius:var(--radius);overflow:hidden}
.ledger-row{display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center;padding:18px 22px;border-bottom:1px solid #2B3833;font-size:.95rem}
.ledger-row:last-child{border-bottom:none;background:#1D2B25}
.ledger-time{font-family:var(--display);font-weight:600;color:#8A9992;font-size:.85rem;min-width:74px}
.ledger-loss{font-family:var(--display);font-weight:700;color:#E86A5E}
.ledger-row:last-child .ledger-loss{color:var(--marigold);font-size:1.05rem}
.ledger-what{color:#DDE4E0}

.section{padding:88px 0}
.section-head{max-width:40rem;margin-bottom:48px}
.kicker{font-size:.8rem;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--teal);margin-bottom:12px}
h2.title{font-family:var(--display);font-weight:800;font-size:clamp(1.7rem,3vw,2.4rem);letter-spacing:-.02em;line-height:1.12}
.section-head p{color:var(--ink-soft);margin-top:14px;font-size:1.02rem}

.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;counter-reset:step}
.step{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:30px 26px;position:relative;counter-increment:step}
.step::before{content:counter(step);font-family:var(--display);font-weight:800;font-size:2.6rem;color:var(--marigold);line-height:1;display:block;margin-bottom:16px}
.step h3{font-family:var(--display);font-weight:700;font-size:1.15rem;margin-bottom:8px;letter-spacing:-.01em}
.step p{font-size:.94rem;color:var(--ink-soft)}
.step .step-note{display:inline-block;margin-top:14px;font-size:.8rem;font-weight:600;color:var(--teal);background:#EAF4F1;padding:4px 10px;border-radius:6px}

.bento{display:grid;grid-template-columns:repeat(6,1fr);gap:18px}
.cell{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:28px 26px}
.cell h3{font-family:var(--display);font-weight:700;font-size:1.12rem;margin-bottom:8px;letter-spacing:-.01em}
.cell p{font-size:.93rem;color:var(--ink-soft)}
.cell-big{grid-column:span 4;background:linear-gradient(135deg,#EAF4F1 0%,var(--card) 60%)}
.cell-big h3{font-size:1.35rem}
.cell-big p{max-width:32rem;font-size:1rem}
.cell-tall{grid-column:span 2;grid-row:span 2;background:var(--marigold-soft);border-color:#EFD9A8;display:flex;flex-direction:column;justify-content:space-between}
.cell-tall .mini-quote{font-family:var(--display);font-weight:600;font-size:1.05rem;line-height:1.4;margin-top:24px}
.cell-tall .mini-quote small{display:block;font-family:var(--body);font-weight:500;font-size:.8rem;color:var(--ink-soft);margin-top:10px}
.cell-sm{grid-column:span 2}
.pill{display:inline-block;font-size:.72rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--teal);background:#EAF4F1;padding:4px 10px;border-radius:6px;margin-bottom:14px}
.cell-tall .pill{background:#fff}

.pricing{background:var(--card);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.plans{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;align-items:stretch}
.plan{background:var(--paper);border:1px solid var(--line);border-radius:18px;padding:34px 28px;display:flex;flex-direction:column;position:relative}
.plan-featured{background:var(--ink);color:var(--paper);border-color:var(--ink);transform:scale(1.03)}
.plan-badge{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--marigold);color:var(--ink);font-family:var(--display);font-weight:700;font-size:.78rem;padding:5px 14px;border-radius:999px;white-space:nowrap}
.plan h3{font-family:var(--display);font-weight:800;font-size:1.3rem;letter-spacing:-.01em}
.plan-tag{font-size:.88rem;color:var(--ink-soft);margin-top:4px;min-height:2.6em}
.plan-featured .plan-tag{color:#9FB0A9}
.plan-price{font-family:var(--display);font-weight:800;font-size:2.4rem;letter-spacing:-.03em;margin:16px 0 20px;line-height:1}
.plan-price small{font-size:.95rem;font-weight:600;color:var(--ink-soft);letter-spacing:0}
.plan-featured .plan-price small{color:#9FB0A9}
.plan ul{list-style:none;display:grid;gap:11px;margin-bottom:28px;flex:1}
.plan li{display:flex;gap:10px;align-items:flex-start;font-size:.92rem}
.plan-featured li{color:#DDE4E0}
.check{color:var(--wa-green);font-weight:700;flex-shrink:0}
.plan-cta{justify-content:center;width:100%;padding:13px 24px}
.btn-marigold{background:var(--marigold);color:var(--ink);font-weight:700}
.roi{margin-top:36px;text-align:center;color:var(--ink-soft);font-size:.98rem}
.roi strong{font-family:var(--display);color:var(--ink)}

.faq{max-width:44rem}
.faq details{border-bottom:1px solid var(--line);padding:6px 0}
.faq summary{font-family:var(--display);font-weight:600;font-size:1.05rem;padding:18px 36px 18px 0;cursor:pointer;list-style:none;position:relative;letter-spacing:-.01em}
.faq summary::-webkit-details-marker{display:none}
.faq summary::after{content:'+';position:absolute;right:4px;top:14px;font-size:1.5rem;font-weight:400;color:var(--teal);transition:transform .2s}
.faq details[open] summary::after{transform:rotate(45deg)}
.faq details p{padding:0 0 20px;color:var(--ink-soft);font-size:.96rem;max-width:40rem}

.final{background:var(--teal);color:#fff;padding:88px 0;text-align:center;position:relative;overflow:hidden}
.final::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 80% 20%,rgba(242,160,7,.18),transparent 45%)}
.final h2{font-family:var(--display);font-weight:800;font-size:clamp(1.9rem,3.6vw,2.8rem);letter-spacing:-.02em;line-height:1.1;position:relative}
.final p{margin:16px auto 32px;max-width:30rem;color:#CBE3DE;position:relative}
.btn-white{background:#fff;color:var(--teal);padding:15px 32px;font-weight:700;font-size:1.02rem;position:relative}
.footer{padding:36px 0;border-top:1px solid var(--line)}
.footer-inner{display:flex;justify-content:space-between;align-items:center;font-size:.85rem;color:var(--ink-soft);flex-wrap:wrap;gap:12px}

.reveal{opacity:0;transform:translateY(18px);transition:opacity .5s ease,transform .5s ease}
.reveal.in{opacity:1;transform:none}

@media (prefers-reduced-motion:reduce){
  .msg,.typing span,.reveal,.btn{animation:none!important;transition:none!important;opacity:1!important;transform:none!important}
  .typing{display:none!important}
  html{scroll-behavior:auto}
}
@media (max-width:900px){
  .hero-grid,.leak-grid{grid-template-columns:1fr;gap:44px}
  .steps,.plans{grid-template-columns:1fr}
  .plan-featured{transform:none}
  .bento{grid-template-columns:1fr 1fr}
  .cell-big,.cell-tall,.cell-sm{grid-column:span 2;grid-row:auto}
  .nav-links a:not(.btn){display:none}
  .hero{padding:48px 0 64px}
  .phone{width:300px}
  .screen{height:520px}
}
`;
