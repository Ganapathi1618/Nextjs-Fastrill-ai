"use client"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

/** * PROFESSIONAL CAMPAIGN MANAGER 2.0
 * Features: Multi-step flow, Real-time Preview, ROI Analytics
 */

const NAV = [
  { id: "overview", label: "Revenue Engine", icon: "⬡", path: "/dashboard" },
  { id: "campaigns", label: "Campaigns", icon: "◆", path: "/dashboard/campaigns" },
  { id: "settings", label: "Settings", icon: "◌", path: "/dashboard/settings" },
]

const SEGMENTS = [
  { id: "all", label: "All Customers", desc: "Broadcast to your entire base" },
  { id: "new_lead", label: "New Leads", desc: "Acquisition focus" },
  { id: "returning", label: "VIP / Returning", desc: "Retention & Loyalty" },
  { id: "inactive", label: "Win-Back", desc: "Re-engage dormant users" },
  { id: "manual", label: "Custom List", desc: "Paste specific numbers" },
]

export default function ProfessionalCampaigns() {
  const router = useRouter()
  const [step, setStep] = useState("compose") // compose | sending | results
  const [dark, setDark] = useState(true)
  const [loading, setLoading] = useState(true)
  const [whatsapp, setWhatsapp] = useState(null)
  
  // Data State
  const [customers, setCustomers] = useState([])
  const [history, setHistory] = useState([])
  const [bizName, setBizName] = useState("Your Business")
  
  // Form State
  const [campaignName, setCampaignName] = useState("")
  const [segment, setSegment] = useState("all")
  const [message, setMessage] = useState("Hi {name}! We have a special offer for you at {business}. Reply BOOK to claim.")
  const [manualNums, setManualNums] = useState("")
  
  // Progress State
  const [sent, setSent] = useState(0)
  const [failed, setFailed] = useState(0)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) router.push("/login")
      else loadData(data.user.id)
    })
  }, [])

  async function loadData(userId) {
    setLoading(true)
    const [{ data: custs }, { data: wa }, { data: bizData }, { data: hist }] = await Promise.all([
      supabase.from("customers").select("*").eq("user_id", userId),
      supabase.from("whatsapp_connections").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("business_settings").select("business_name").eq("user_id", userId).maybeSingle(),
      supabase.from("campaigns").select("*").eq("user_id", userId).order("created_at", { ascending: false })
    ])
    
    setCustomers(custs || [])
    setWhatsapp(wa || null)
    setBizName(bizData?.business_name || "Your Business")
    setHistory(hist || [])
    setLoading(false)
  }

  // Logic: Audience Calculation
  const getFilteredAudience = () => {
    if (segment === "manual") {
      return manualNums.split(/[\s,]+/).filter(n => n.length >= 10).map(n => ({ name: "Customer", phone: n }))
    }
    return customers.filter(c => {
      if (segment === "all") return true
      if (segment === "new_lead") return c.tag === "new_lead"
      return true
    })
  }

  const audience = getFilteredAudience()
  const previewText = message.replace("{name}", "Radhika").replace("{business}", bizName)

  // Action: Send Campaign
  const executeCampaign = async () => {
    if (!campaignName || !whatsapp) return alert("Please fill all details")
    
    setStep("sending")
    setIsSending(true)
    let sCount = 0
    let fCount = 0

    for (const person of audience) {
      try {
        const phone = person.phone.replace(/\D/g, "").length === 10 ? "91" + person.phone.replace(/\D/g, "") : person.phone.replace(/\D/g, "")
        const text = message.replace("{name}", (person.name || "there").split(" ")[0]).replace("{business}", bizName)

        const res = await fetch(`https://graph.facebook.com/v18.0/${whatsapp.phone_number_id}/messages`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${whatsapp.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ messaging_product: "whatsapp", to: phone, type: "text", text: { body: text } })
        })
        
        const data = await res.json()
        if (data.error) fCount++
        else sCount++
        
        setSent(sCount)
        setFailed(fCount)
        await new Promise(r => setTimeout(r, 1000)) // Rate limiting
      } catch (e) {
        fCount++
        setFailed(fCount)
      }
    }

    // FINAL SAVE TO DB (Using your exact columns)
    await supabase.from("campaigns").insert({
      user_id: (await supabase.auth.getUser()).data.user.id,
      name: campaignName,
      recipient_segment: segment,
      message: message,
      sent_count: sCount,
      failed_count: fCount,
      recipient_count: audience.length,
      status: "completed",
      sent_at: new Date().toISOString()
    })

    setIsSending(false)
    setStep("results")
  }

  // --- UI Styles ---
  const theme = {
    bg: "#050508",
    card: "#0f0f18",
    border: "rgba(255,255,255,0.08)",
    accent: "#00d084",
    text: "#ffffff",
    dim: "#88889b"
  }

  if (loading) return <div style={{ background: theme.bg, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Initializing Engine...</div>

  return (
    <div style={{ background: theme.bg, color: theme.text, minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
        .glass-card { background: ${theme.card}; border: 1px solid ${theme.border}; border-radius: 20px; padding: 24px; }
        .btn-primary { background: ${theme.accent}; color: #000; font-weight: 700; border: none; padding: 12px 24px; border-radius: 12px; cursor: pointer; transition: 0.2s; }
        .btn-primary:disabled { opacity: 0.5; }
        .input-dark { background: #000; border: 1px solid ${theme.border}; color: #fff; padding: 12px; border-radius: 10px; width: 100%; outline: none; }
        .input-dark:focus { border-color: ${theme.accent}; }
      `}</style>

      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "20px 40px", borderBottom: `1px solid ${theme.border}` }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Campaign Center</h1>
          <p style={{ color: theme.dim, fontSize: 13 }}>Strategic customer outreach and ROI tracking</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setStep("compose")} style={{ background: "none", border: "none", color: step === "compose" ? theme.accent : theme.dim, cursor: "pointer", fontWeight: 600 }}>Create</button>
          <button onClick={() => setStep("history")} style={{ background: "none", border: "none", color: step === "history" ? theme.accent : theme.dim, cursor: "pointer", fontWeight: 600 }}>History</button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "40px auto", padding: "0 20px" }}>
        
        {step === "compose" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: 40 }}>
            {/* Left: Configuration */}
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: 30 }}>
              
              <section>
                <label style={{ display: "block", marginBottom: 10, fontWeight: 600, fontSize: 14 }}>1. Campaign Identity</label>
                <input 
                  className="input-dark" 
                  placeholder="e.g. Summer Keratin Special - June 2026" 
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </section>

              <section>
                <label style={{ display: "block", marginBottom: 10, fontWeight: 600, fontSize: 14 }}>2. Target Audience</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                  {SEGMENTS.map(s => (
                    <div 
                      key={s.id} 
                      onClick={() => setSegment(s.id)}
                      style={{ 
                        padding: 15, borderRadius: 12, border: `1px solid ${segment === s.id ? theme.accent : theme.border}`,
                        cursor: "pointer", background: segment === s.id ? "rgba(0,208,132,0.05)" : "transparent"
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13, color: segment === s.id ? theme.accent : "#fff" }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: theme.dim, marginTop: 4 }}>{s.desc}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <label style={{ display: "block", marginBottom: 10, fontWeight: 600, fontSize: 14 }}>3. Content Design</label>
                <textarea 
                  className="input-dark" 
                  rows={5} 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ resize: "none" }}
                />
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button onClick={() => setMessage(m => m + " {name}")} style={{ fontSize: 11, background: "rgba(255,255,255,0.05)", border: "none", color: "#fff", padding: "4px 8px", borderRadius: 4 }}>+ Insert Name</button>
                  <button onClick={() => setMessage(m => m + " {business}")} style={{ fontSize: 11, background: "rgba(255,255,255,0.05)", border: "none", color: "#fff", padding: "4px 8px", borderRadius: 4 }}>+ Insert Biz</button>
                </div>
              </section>

              <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: theme.accent }}>{audience.length}</div>
                  <div style={{ fontSize: 12, color: theme.dim }}>Potential Recipients</div>
                </div>
                <button 
                  className="btn-primary" 
                  onClick={executeCampaign}
                  disabled={!whatsapp || audience.length === 0}
                >
                  Deploy Campaign →
                </button>
              </div>
            </div>

            {/* Right: Phone Preview */}
            <div style={{ position: "sticky", top: 40 }}>
              <div style={{ 
                width: 320, height: 640, background: "#000", border: "8px solid #1a1a2e", 
                borderRadius: 40, margin: "0 auto", overflow: "hidden", position: "relative",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)"
              }}>
                <div style={{ background: "#075e54", padding: "40px 15px 15px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#ccc" }} />
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{bizName}</div>
                </div>
                <div style={{ padding: 20, background: "#0b141a", height: "100%" }}>
                  <div style={{ 
                    background: "#005c4b", color: "#fff", padding: 12, borderRadius: "0 12px 12px 12px", 
                    fontSize: 13, lineHeight: 1.5, position: "relative" 
                  }}>
                    {previewText}
                    <div style={{ fontSize: 10, textAlign: "right", marginTop: 4, opacity: 0.6 }}>12:48 PM</div>
                  </div>
                </div>
              </div>
              <p style={{ textAlign: "center", color: theme.dim, fontSize: 11, marginTop: 15 }}>Real-time Preview (Radhika)</p>
            </div>
          </div>
        )}

        {step === "sending" && (
          <div className="glass-card" style={{ textAlign: "center", padding: "80px 40px" }}>
            <div style={{ fontSize: 40, marginBottom: 20 }}>🚀</div>
            <h2 style={{ fontSize: 24, fontWeight: 800 }}>Deploying "{campaignName}"</h2>
            <p style={{ color: theme.dim, marginBottom: 40 }}>Syncing with Meta WhatsApp API...</p>
            
            <div style={{ display: "flex", justifyContent: "center", gap: 40 }}>
              <div>
                <div style={{ fontSize: 48, fontWeight: 800, color: theme.accent }}>{sent}</div>
                <div style={{ fontSize: 14, color: theme.dim }}>Delivered</div>
              </div>
              <div>
                <div style={{ fontSize: 48, fontWeight: 800, color: "#fb7185" }}>{failed}</div>
                <div style={{ fontSize: 14, color: theme.dim }}>Errors</div>
              </div>
            </div>

            {!isSending && (
              <button className="btn-primary" style={{ marginTop: 40 }} onClick={() => setStep("results")}>View Detailed Analytics</button>
            )}
          </div>
        )}

        {step === "results" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
             <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
                <div className="glass-card">
                  <div style={{ fontSize: 12, color: theme.dim }}>TOTAL SENT</div>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>{sent}</div>
                </div>
                <div className="glass-card">
                  <div style={{ fontSize: 12, color: theme.dim }}>OPEN RATE (AUTO)</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: theme.accent }}>0%</div>
                </div>
                <div className="glass-card">
                  <div style={{ fontSize: 12, color: theme.dim }}>CONVERSIONS</div>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>0</div>
                </div>
                <div className="glass-card" style={{ background: "linear-gradient(135deg, #00d084 0%, #00935a 100%)", color: "#000" }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>EST. REVENUE</div>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>₹0.00</div>
                </div>
             </div>
             <button className="btn-primary" style={{ alignSelf: "center" }} onClick={() => setStep("compose")}>Launch Another Campaign</button>
          </div>
        )}

        {step === "history" && (
          <div className="glass-card">
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Campaign Archives</h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: theme.dim, fontSize: 12 }}>
                  <th style={{ paddingBottom: 15 }}>CAMPAIGN NAME</th>
                  <th style={{ paddingBottom: 15 }}>SEGMENT</th>
                  <th style={{ paddingBottom: 15 }}>SENT</th>
                  <th style={{ paddingBottom: 15 }}>OPENED</th>
                  <th style={{ paddingBottom: 15 }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {history.map(c => (
                  <tr key={c.id} style={{ borderTop: `1px solid ${theme.border}`, fontSize: 14 }}>
                    <td style={{ padding: "15px 0", fontWeight: 600 }}>{c.name}</td>
                    <td><span style={{ background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: 6, fontSize: 11 }}>{c.recipient_segment}</span></td>
                    <td>{c.sent_count}</td>
                    <td style={{ color: theme.accent }}>{c.opened_count || 0}</td>
                    <td><div style={{ width: 8, height: 8, borderRadius: "50%", background: theme.accent, display: "inline-block", marginRight: 6 }} /> {c.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
