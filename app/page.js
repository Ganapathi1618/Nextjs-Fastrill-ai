"use client"
import { useState, useEffect, useRef } from "react"

const DEMOS = {
  booking: [
    { r: "c", m: "Hi, I want a haircut tomorrow around 3pm" },
    { r: "a", m: "Tomorrow at 3 PM is available!\n\nShall I confirm your haircut?" },
    { r: "c", m: "Yes please!" },
    { r: "a", m: "✅ Confirmed!\nHaircut • Tomorrow • 3:00 PM\nSee you then ✨" },
  ],
  hindi: [
    { r: "c", m: "Bhai facial karwa sakte hai kal shaam?" },
    { r: "a", m: "Haan bilkul! Facial ₹1,200 (60 mins).\nKis time aana hai?" },
    { r: "c", m: "6 baje" },
    { r: "a", m: "✅ Booked!\nFacial • Kal • 6:00 PM\nMilte hain! 🙏" },
  ],
  winback: [
    { r: "a", m: "Hey Anita, it's been a while ❤️\nYour signature keratin treatment is back with 15% off this week." },
    { r: "c", m: "Price kya hai?" },
    { r: "a", m: "₹2,520 (was ₹2,800)\nSaturday morning works?" },
    { r: "c", m: "Yes" },
    { r: "a", m: "✅ Booked for Saturday 10 AM!\nLooking forward to seeing you." },
  ],
}

const DEMO_TABS = [
  { k: "booking", label: "Instant Booking", sub: "4 messages → Done" },
  { k: "hindi", label: "Hinglish & Hindi", sub: "Natural conversation" },
  { k: "winback", label: "Win-back Campaign", sub: "Re-engage lost customers" },
]

export default function Landing() {
  const [scrolled, setScrolled] = useState(false)
  const [demoKey, setDemoKey] = useState("booking")
  const [demoMsgs, setDemoMsgs] = useState([])
  const [billing, setBilling] = useState("monthly")
  const chatRef = useRef(null)
  const tmr = useRef(null)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  useEffect(() => {
    setDemoMsgs([])
    if (tmr.current) clearTimeout(tmr.current)

    DEMOS[demoKey].forEach((m, i) => {
      tmr.current = setTimeout(() => {
        setDemoMsgs(prev => [...prev, m])
        if (chatRef.current) chatRef.current.scrollTop = 9999
      }, 400 + i * 900)
    })

    return () => { if (tmr.current) clearTimeout(tmr.current) }
  }, [demoKey])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');

        body {
          background: #050507;
          color: #e0e0e6;
          font-family: 'Instrument Sans', system-ui, sans-serif;
        }

        .hero-h { font-family: 'Space Grotesk', sans-serif; letter-spacing: -0.04em; }

        .reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: all 0.9s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .reveal.animate-in { opacity: 1; transform: translateY(0); }

        .glass { background: rgba(10,10,15,0.85); backdrop-filter: blur(20px); }
      `}</style>

      {/* NAV */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all ${scrolled ? 'py-4 bg-black/95 border-b border-white/10' : 'py-6'}`}>
        <div className="max-w-screen-2xl mx-auto px-8 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-2xl">f</div>
            <span className="font-semibold text-3xl tracking-tighter">fastrill</span>
          </a>

          <div className="hidden md:flex items-center gap-10 text-sm font-medium">
            <a href="#problem" className="hover:text-white transition">Problem</a>
            <a href="#product" className="hover:text-white transition">Product</a>
            <a href="#demo" className="hover:text-white transition">Live Demo</a>
            <a href="#results" className="hover:text-white transition">Results</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <a href="/login" className="px-6 py-2.5 text-sm font-medium hover:bg-white/5 rounded-2xl transition">Log in</a>
            <a href="/signup" className="bg-white text-black px-8 py-3 rounded-3xl font-semibold hover:scale-105 transition">Start Free Trial</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="min-h-screen pt-32 pb-24 relative flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(at_40%_20%,rgba(124,92,252,0.18),transparent_70%)]" />

        <div className="max-w-screen-2xl mx-auto px-8 grid md:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/10 bg-white/5 mb-6 reveal">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Official Meta WhatsApp Partner
            </div>

            <h1 className="hero-h text-6xl md:text-7xl lg:text-[88px] leading-[0.95] font-semibold tracking-tighter mb-8 reveal">
              Your ads work.<br />
              Your <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">WhatsApp doesn’t.</span>
            </h1>

            <p className="text-xl md:text-2xl text-zinc-400 max-w-lg leading-tight reveal">
              AI Revenue Infrastructure that replies in seconds, qualifies leads, and books appointments — automatically.
            </p>

            <div className="flex flex-wrap gap-4 mt-12 reveal">
              <a href="/signup" className="bg-white text-black px-10 py-4 rounded-3xl font-semibold text-lg inline-flex items-center gap-3 hover:bg-zinc-100 transition">
                Start 14-Day Free Trial →
              </a>
              <a href="#demo" className="border border-white/30 hover:border-white px-10 py-4 rounded-3xl text-lg font-medium transition">Watch Demo</a>
            </div>

            <div className="mt-16 flex items-center gap-8 text-sm reveal">
              <div>Trusted by 280+ Indian salons & clinics</div>
              <div className="flex -space-x-3">
                {["P","R","S","A"].map((l,i) => (
                  <div key={i} className="w-8 h-8 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center ring-4 ring-[#050507] text-xs font-bold">{l}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Phone Mock */}
          <div className="justify-self-center reveal">
            <div className="relative">
              <div className="absolute -inset-12 bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 blur-3xl rounded-[4rem]" />
              <div className="bg-zinc-950 border border-white/10 rounded-[3rem] p-4 shadow-2xl">
                <div className="bg-black rounded-[2.2rem] overflow-hidden h-[620px] w-[300px]">
                  <div className="h-full flex flex-col">
                    <div className="bg-zinc-900 p-4 flex items-center gap-3 border-b border-white/10">
                      <div className="w-9 h-9 bg-gradient-to-br from-violet-400 to-fuchsia-400 rounded-full flex items-center justify-center text-white text-sm font-bold">R</div>
                      <div className="flex-1">
                        <div className="font-semibold text-white">Riya Salon</div>
                        <div className="text-emerald-400 text-xs flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-current rounded-full" /> AI Active
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 p-5 space-y-4 overflow-auto" ref={chatRef}>
                      {demoMsgs.length > 0 ? demoMsgs.map((msg, i) => (
                        <div key={i} className={`max-w-[80%] p-4 rounded-3xl text-sm leading-relaxed ${msg.r === "c" ? "bg-violet-600 ml-auto rounded-br-none" : "bg-zinc-800"}`}>
                          {msg.m}
                        </div>
                      )) : DEMOS.booking.map((msg, i) => (
                        <div key={i} className={`max-w-[80%] p-4 rounded-3xl text-sm leading-relaxed ${msg.r === "c" ? "bg-violet-600 ml-auto rounded-br-none" : "bg-zinc-800"}`}>
                          {msg.m}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* More sections can be added similarly — let me know if you want the complete expanded version with Problem, Product, Testimonials, Pricing, etc. */}

      <section id="demo" className="py-32 bg-zinc-950">
        <div className="max-w-screen-2xl mx-auto px-8 text-center">
          <h2 className="text-5xl font-semibold tracking-tighter mb-4">See the magic live</h2>
          <p className="text-zinc-400 text-xl mb-12">Pick a scenario</p>

          <div className="flex justify-center gap-4 mb-10">
            {DEMO_TABS.map(tab => (
              <button
                key={tab.k}
                onClick={() => setDemoKey(tab.k)}
                className={`px-8 py-4 rounded-3xl transition-all ${demoKey === tab.k ? "bg-white text-black" : "bg-zinc-900 border border-white/10 hover:border-white/30"}`}
              >
                <div className="font-semibold">{tab.label}</div>
                <div className="text-xs text-zinc-500">{tab.sub}</div>
              </button>
            ))}
          </div>

          {/* Demo Chat */}
          <div className="max-w-md mx-auto">
            <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-white/10">
              <div className="p-4 border-b border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-400 to-fuchsia-400 rounded-full" />
                <div>Riya Salon • AI Active</div>
              </div>
              <div className="h-[420px] p-6 overflow-auto space-y-4" ref={chatRef}>
                {demoMsgs.map((msg, i) => (
                  <div key={i} className={`max-w-[80%] p-4 rounded-3xl ${msg.r === "c" ? "bg-violet-600 ml-auto" : "bg-zinc-800"}`}>
                    {msg.m}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 text-center border-t border-white/10">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-6xl font-semibold tracking-tighter mb-8">Stop losing customers to slow replies.</h2>
          <a href="/signup" className="inline-block bg-white text-black px-16 py-6 rounded-3xl text-2xl font-semibold hover:scale-105 transition">
            Start Free Trial — 14 Days
          </a>
          <p className="mt-6 text-zinc-500">Takes 10 minutes to set up • No credit card needed</p>
        </div>
      </section>
    </>
  )
}
