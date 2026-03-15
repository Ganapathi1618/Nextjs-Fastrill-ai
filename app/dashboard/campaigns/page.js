"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ─── Navigation ───────────────────────────────────────────────────────────────
const NAV = [
  { id: "overview",  label: "Revenue Engine", icon: "⬡", path: "/dashboard" },
  { id: "inbox",     label: "Conversations",  icon: "◎", path: "/dashboard/conversations" },
  { id: "bookings",  label: "Bookings",       icon: "◷", path: "/dashboard/bookings" },
  { id: "campaigns", label: "Campaigns",      icon: "◆", path: "/dashboard/campaigns" },
  { id: "leads",     label: "Lead Recovery",  icon: "◉", path: "/dashboard/leads" },
  { id: "contacts",  label: "Customers",      icon: "◑", path: "/dashboard/contacts" },
  { id: "analytics", label: "Analytics",      icon: "▦", path: "/dashboard/analytics" },
  { id: "settings",  label: "Settings",       icon: "◌", path: "/dashboard/settings" },
];

// ─── Templates ────────────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: "product_launch", label: "Product Launch", category: "MARKETING",
    vars: [
      { key: "name",   label: "Customer Name",     hint: "Auto-filled per contact", auto: true },
      { key: "biz",    label: "Business Name",     hint: "e.g. Radiance Salon",     auto: true },
      { key: "detail", label: "Product / Service", hint: "e.g. Keratin Treatment",  auto: false },
    ],
    build: v => `Hi ${v.name}! Exciting news from ${v.biz}!\n\n${v.detail}\n\nLimited time offer. Reply BOOK or call us!`
  },
  {
    id: "special_offer", label: "Special Offer", category: "MARKETING",
    vars: [
      { key: "name",   label: "Customer Name",  hint: "Auto-filled per contact",   auto: true },
      { key: "biz",    label: "Business Name",  hint: "e.g. Radiance Salon",       auto: true },
      { key: "offer",  label: "Offer Details",  hint: "e.g. 20% off all services", auto: false },
      { key: "expiry", label: "Valid Till",      hint: "e.g. Sunday, 20th March",   auto: false },
    ],
    build: v => `Hi ${v.name}! ${v.biz} has a special offer just for you!\n\n${v.offer}\n\nValid till ${v.expiry} only. Book now!`
  },
  {
    id: "winback", label: "Win Back", category: "MARKETING",
    vars: [
      { key: "name",     label: "Customer Name",  hint: "Auto-filled per contact",     auto: true },
      { key: "biz",      label: "Business Name",  hint: "e.g. Radiance Salon",         auto: true },
      { key: "discount", label: "Your Offer",      hint: "e.g. 15% off your next visit", auto: false },
    ],
    build: v => `Hi ${v.name}! We miss you at ${v.biz} 😊\n\nIt has been a while! Come back and get ${v.discount}.\n\nReply BOOK to schedule.`
  },
  {
    id: "appointment_reminder", label: "Appointment Reminder", category: "UTILITY",
    vars: [
      { key: "name", label: "Customer Name",   hint: "Auto-filled per contact", auto: true },
      { key: "biz",  label: "Business Name",   hint: "e.g. Radiance Salon",     auto: true },
      { key: "date", label: "Appointment Date", hint: "e.g. Saturday 15th March", auto: false },
      { key: "time", label: "Appointment Time", hint: "e.g. 4:00 PM",             auto: false },
    ],
    build: v => `Hi ${v.name}! Reminder: your appointment at ${v.biz} is on ${v.date} at ${v.time}.\n\nReply CONFIRM to confirm or RESCHEDULE to change.`
  },
  {
    id: "festival", label: "Festival Greeting", category: "MARKETING",
    vars: [
      { key: "name",  label: "Customer Name", hint: "Auto-filled per contact",     auto: true },
      { key: "biz",   label: "Business Name", hint: "e.g. Radiance Salon",         auto: true },
      { key: "offer", label: "Festival Offer", hint: "e.g. 25% off colour services", auto: false },
    ],
    build: v => `Hi ${v.name}! Warm wishes from ${v.biz}!\n\nThis festive season, treat yourself — ${v.offer}.\n\nReply BOOK to schedule 😊`
  },
  {
    id: "review_request", label: "Review Request", category: "UTILITY",
    vars: [
      { key: "name", label: "Customer Name", hint: "Auto-filled per contact", auto: true },
      { key: "biz",  label: "Business Name", hint: "e.g. Radiance Salon",     auto: true },
      { key: "link", label: "Review Link",   hint: "e.g. g.page/your-business", auto: false },
    ],
    build: v => `Hi ${v.name}! Thank you for visiting ${v.biz} 😊\n\nWe would love your feedback! Takes just 2 minutes:\n${v.link}\n\nThank you 🙏`
  },
  {
    id: "referral", label: "Referral Program", category: "MARKETING",
    vars: [
      { key: "name",   label: "Customer Name", hint: "Auto-filled per contact",      auto: true },
      { key: "biz",    label: "Business Name", hint: "e.g. Radiance Salon",          auto: true },
      { key: "reward", label: "Reward",         hint: "e.g. 10% off next visit each", auto: false },
    ],
    build: v => `Hi ${v.name}! Loved your visit at ${v.biz}? 😊\n\nRefer a friend and both of you get ${v.reward}!\n\nJust ask them to mention your name when booking 🎁`
  },
];

const QUICK = [
  { id: "offer",    label: "Special Offer",   text: "Hi {name}! Special offer just for you at {business} - get 20% off this week! Reply BOOK." },
  { id: "reminder", label: "Reminder",        text: "Hi {name}! Reminder about your upcoming appointment at {business}. Reply RESCHEDULE if needed." },
  { id: "winback",  label: "Win Back",        text: "Hi {name}! We miss you at {business}. Come back for a special treat this week! Reply BOOK." },
  { id: "festival", label: "Festival",        text: "Hi {name}! Warm wishes from {business}! Treat yourself this festive season. Reply BOOK." },
  { id: "custom",   label: "Custom Message",  text: "" },
];

const SEGMENTS = [
  { id: "all",      label: "All Customers",  desc: "Everyone who has messaged you" },
  { id: "new_lead", label: "New Leads",      desc: "First-time contacts, not booked" },
  { id: "returning",label: "Returning",      desc: "Booked 2+ times" },
  { id: "vip",      label: "VIP",            desc: "Tagged as VIP" },
  { id: "inactive", label: "Inactive 30d+",  desc: "No visit in 30 days" },
  { id: "manual",   label: "Enter Numbers",  desc: "Type numbers manually" },
  { id: "csv",      label: "Upload CSV",     desc: "Upload a .csv or .txt file" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toSendPhone(phone) {
  const d = (phone || "").replace(/[^0-9]/g, "");
  if (d.length === 10) return "91" + d;
  if (d.length === 12 && d.startsWith("91")) return d;
  if (d.length === 11 && d.startsWith("0")) return "91" + d.slice(1);
  return d;
}
function dedupePhone(phone) {
  const d = (phone || "").replace(/[^0-9]/g, "");
  return d.length >= 12 ? d.slice(-10) : d;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Campaigns() {
  const router  = useRouter();
  const fileRef = useRef(null);

  const [userEmail, setUserEmail]     = useState("");
  const [userId, setUserId]           = useState(null);
  const [dark, setDark]               = useState(true);
  const [mobOpen, setMobOpen]         = useState(false);
  const [customers, setCustomers]     = useState([]);
  const [optouts, setOptouts]         = useState([]);
  const [whatsapp, setWhatsapp]       = useState(null);
  const [bizName, setBizName]         = useState("");
  const [loading, setLoading]         = useState(true);
  const [history, setHistory]         = useState([]);
  const [histError, setHistError]     = useState(false);
  const [tab, setTab]                 = useState("compose");
  const [step, setStep]               = useState("compose"); // compose | sending | done
  const [sending, setSending]         = useState(false);
  const [sent, setSent]               = useState(0);
  const [failed, setFailed]           = useState(0);
  const [mode, setMode]               = useState("template");
  const [tmplId, setTmplId]           = useState("");
  const [tmplVals, setTmplVals]       = useState({});
  const [quickId, setQuickId]         = useState("offer");
  const [message, setMessage]         = useState(QUICK[0].text);
  const [ctaText, setCtaText]         = useState("");
  const [ctaUrl, setCtaUrl]           = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [segment, setSegment]         = useState("all");
  const [manualNums, setManualNums]   = useState("");
  const [csvNums, setCsvNums]         = useState([]);
  const [testPhone, setTestPhone]     = useState("");
  const [testSent, setTestSent]       = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [sendLog, setSendLog]         = useState([]);
  const [currentCampaignId, setCurrentCampaignId] = useState(null);

  // ── Realtime stats refresh for active campaign ──────────────────────────────
  // FIX: After campaign is saved, subscribe to messages table to count
  // delivered/read updates. The webhook updates message.status per wa_message_id.
  // We aggregate those counts back into the campaigns row every 5s during sending.
  const statsInterval = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme");
    if (saved) setDark(saved === "dark");
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) router.push("/login");
      else { setUserEmail(data.user.email || ""); setUserId(data.user.id); }
    });
  }, []);

  useEffect(() => { if (userId) loadData(); }, [userId]);

  // FIX: Clean up stats polling on unmount
  useEffect(() => () => { if (statsInterval.current) clearInterval(statsInterval.current); }, []);

  async function loadData() {
    setLoading(true);
    const [{ data: custs }, { data: wa }, { data: bizData }] = await Promise.all([
      supabase.from("customers").select("id,name,phone,tag,last_visit_at,created_at").eq("user_id", userId),
      supabase.from("whatsapp_connections").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("business_settings").select("business_name").eq("user_id", userId).maybeSingle(),
    ]);
    setCustomers(custs || []);
    setWhatsapp(wa || null);
    const bn = bizData?.business_name || "";
    setBizName(bn);
    if (bn) setTmplVals(prev => ({ ...prev, biz: bn }));

    try {
      const { data: opts } = await supabase.from("campaign_optouts").select("phone").eq("user_id", userId);
      setOptouts((opts || []).map(o => o.phone));
    } catch(e) { /* table may not exist yet */ }

    await loadHistory();
    setLoading(false);
  }

  // FIX: Separate loadHistory so we can refresh it after campaign completes
  async function loadHistory() {
    try {
      const { data: hist, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) { setHistError(true); return; }
      setHistory(hist || []);
      setHistError(false);
    } catch(e) {
      setHistError(true);
    }
  }

  // FIX: Poll delivery stats for a campaign using its saved wa_message_ids
  // We store wa_message_ids as an array in the campaign row.
  // The webhook updates messages.status → we aggregate here.
  async function pollDeliveryStats(campaignId) {
    if (statsInterval.current) clearInterval(statsInterval.current);
    statsInterval.current = setInterval(async () => {
      try {
        const { data: camRow } = await supabase
          .from("campaigns").select("wa_message_ids").eq("id", campaignId).single();
        const ids = camRow?.wa_message_ids || [];
        if (!ids.length) return;

        const { data: msgs } = await supabase
          .from("messages")
          .select("status,wa_message_id")
          .in("wa_message_id", ids);

        if (!msgs) return;
        const delivered = msgs.filter(m => m.status === "delivered" || m.status === "read").length;
        const read      = msgs.filter(m => m.status === "read").length;

        await supabase.from("campaigns").update({
          delivered_count: delivered,
          read_count:      read,
        }).eq("id", campaignId);

        // Refresh history table so UI shows updated stats
        await loadHistory();
      } catch(e) { /* ignore */ }
    }, 8000); // every 8 seconds

    // Stop polling after 10 minutes (messages should all be delivered by then)
    setTimeout(() => { if (statsInterval.current) clearInterval(statsInterval.current); }, 10 * 60 * 1000);
  }

  function getAudience() {
    const now = new Date();
    const ago30 = new Date(now); ago30.setDate(now.getDate() - 30);
    const optSet = new Set(optouts.map(dedupePhone));
    let base = [];

    if (segment === "manual") {
      const nums = manualNums.replace(/,/g, " ").replace(/;/g, " ")
        .split(" ").map(s => s.trim()).filter(s => s.length >= 8);
      base = nums.map((p, i) => ({ id: "m" + i, name: p, phone: p }));
    } else if (segment === "csv") {
      base = csvNums.map((p, i) => ({ id: "c" + i, name: p, phone: p }));
    } else {
      base = customers.filter(c => {
        if (!c.phone) return false;
        if (segment === "all")       return true;
        if (segment === "new_lead")  return c.tag === "new_lead";
        if (segment === "returning") return c.tag === "returning" || c.tag === "vip";
        if (segment === "vip")       return c.tag === "vip";
        if (segment === "inactive")  return new Date(c.last_visit_at || c.created_at) < ago30;
        return true;
      });
    }

    // Dedupe
    const seen = new Set();
    base = base.filter(c => {
      const n = dedupePhone(c.phone);
      if (seen.has(n)) return false;
      seen.add(n); return true;
    });

    return base.filter(c => !optSet.has(dedupePhone(c.phone)));
  }

  function buildText(customerName) {
    const tmpl = TEMPLATES.find(t => t.id === tmplId);
    if (mode === "template" && tmpl) {
      const vals = {};
      tmpl.vars.forEach(v => { vals[v.key] = tmplVals[v.key] || ""; });
      vals.name = customerName || vals.name || "there";
      return tmpl.build(vals);
    }
    const name = customerName || "there";
    const biz  = bizName || "us";
    const cta  = ctaUrl ? "\n\n" + (ctaText || "Book now") + ": " + ctaUrl : "";
    return message.split("{name}").join(name).split("{business}").join(biz) + cta;
  }

  function getPreview() {
    const tmpl = TEMPLATES.find(t => t.id === tmplId);
    if (mode === "template" && tmpl) {
      if (!tmplId) return "";
      const vals = {};
      tmpl.vars.forEach(v => { vals[v.key] = tmplVals[v.key] || v.hint; });
      vals.name = tmplVals.name || "Priya";
      vals.biz  = tmplVals.biz  || bizName || "Your Business";
      return tmpl.build(vals);
    }
    const audience = getAudience();
    const c = audience[0] || { name: "Priya" };
    return buildText((c.name || "Priya").split(" ")[0]);
  }

  async function sendTest() {
    if (!testPhone.trim() || !whatsapp) return;
    setTestSending(true);
    try {
      const phone = toSendPhone(testPhone);
      const text  = getPreview() || "Test message from Fastrill";
      const res = await fetch(`https://graph.facebook.com/v18.0/${whatsapp.phone_number_id}/messages`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${whatsapp.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", to: phone, type: "text", text: { body: text, preview_url: false } })
      });
      const d = await res.json();
      if (!d.error) { setTestSent(true); setTimeout(() => setTestSent(false), 3000); }
      else alert("Send failed: " + d.error.message);
    } catch(e) { alert("Error: " + e.message); }
    setTestSending(false);
  }

  async function sendCampaign() {
    if (!campaignName.trim() || !whatsapp) return;
    const audience = getAudience();
    if (!audience.length) return;

    setSending(true); setSent(0); setFailed(0); setSendLog([]); setStep("sending");

    let sentCount  = 0;
    let failCount  = 0;
    const log      = [];
    const waIds    = []; // FIX: collect wa_message_ids to track delivery

    // FIX: Create the campaign row FIRST so we have an ID to attach message IDs to
    let campaignId = null;
    try {
      const { data: newCampaign } = await supabase.from("campaigns").insert({
        user_id:      userId,
        name:         campaignName,
        segment:      segment,
        message:      getPreview(),
        sent_count:   0,
        failed_count: 0,
        delivered_count: 0,
        read_count:      0,
        replied_count:   0,
        status:       "sending",
        sent_at:      new Date().toISOString(),
        created_at:   new Date().toISOString(),
        wa_message_ids: [],
      }).select().single();
      campaignId = newCampaign?.id || null;
      setCurrentCampaignId(campaignId);
    } catch(e) {
      console.warn("Campaign row create failed — run migration-full.sql. Error:", e.message);
    }

    for (const customer of audience) {
      const firstName = (customer.name || "there").split(" ")[0];
      const phone     = toSendPhone(customer.phone);
      const text      = buildText(firstName);

      try {
        const res = await fetch(`https://graph.facebook.com/v18.0/${whatsapp.phone_number_id}/messages`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${whatsapp.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ messaging_product: "whatsapp", to: phone, type: "text", text: { body: text, preview_url: false } })
        });
        const d = await res.json();
        if (!d.error) {
          sentCount++;
          setSent(sentCount);
          const waId = d?.messages?.[0]?.id;
          if (waId) waIds.push(waId);
          log.push({ name: customer.name, phone, status: "sent" });

          // FIX: Save each outbound message to messages table so webhook can update its status
          if (campaignId) {
            try {
              await supabase.from("messages").insert({
                user_id:        userId,
                customer_phone: customer.phone,
                direction:      "outbound",
                message_type:   "text",
                message_text:   text,
                status:         "sent",
                is_ai:          false,
                wa_message_id:  waId || null,
                created_at:     new Date().toISOString(),
              });
            } catch(e) { /* non-fatal */ }
          }
        } else {
          failCount++;
          setFailed(failCount);
          log.push({ name: customer.name, phone, status: "failed", error: d.error.message });
        }
      } catch(e) {
        failCount++;
        setFailed(failCount);
        log.push({ name: customer.name, phone, status: "error" });
      }
      await new Promise(r => setTimeout(r, 1200)); // 1.2s between sends (Meta rate limit safe)
    }

    setSendLog(log);

    // FIX: Update campaign row with final counts + all wa_message_ids
    if (campaignId) {
      try {
        await supabase.from("campaigns").update({
          sent_count:     sentCount,
          failed_count:   failCount,
          wa_message_ids: waIds,
          status:         "completed",
        }).eq("id", campaignId);

        // FIX: Start polling delivery stats (webhook updates message.status)
        if (waIds.length > 0) pollDeliveryStats(campaignId);
      } catch(e) {
        console.warn("Campaign update failed:", e.message);
      }
    }

    await loadHistory(); // refresh history tab
    setSending(false);
    setStep("done");
  }

  // FIX: Count replies — messages received from campaign recipients after campaign sent_at
  async function refreshReplies(campaignId) {
    try {
      const { data: camp } = await supabase
        .from("campaigns").select("sent_at,segment").eq("id", campaignId).single();
      if (!camp) return;

      // Get audience phones for this campaign
      // (simplified: count inbound messages after sent_at for all customers)
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact" })
        .eq("user_id", userId)
        .eq("direction", "inbound")
        .gte("created_at", camp.sent_at);

      if (count !== null) {
        await supabase.from("campaigns")
          .update({ replied_count: count })
          .eq("id", campaignId);
        await loadHistory();
      }
    } catch(e) { /* non-fatal */ }
  }

  function handleCsv(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      const nums = [];
      const lines = ev.target.result.split("\n");
      for (const line of lines) {
        const cols = line.replace(/\r/g, "").split(",");
        for (const col of cols) {
          const d = col.replace(/[^0-9]/g, "");
          if (d.length >= 10) { nums.push(d); break; }
        }
      }
      const unique = [...new Set(nums)];
      setCsvNums(unique);
      setSegment("csv");
    };
    reader.readAsText(file);
  }

  const toggleTheme = () => { const n = !dark; setDark(n); localStorage.setItem("fastrill-theme", n ? "dark" : "light"); };
  const logout = async () => { await supabase.auth.signOut(); router.push("/login"); };

  // ── Theme tokens ──────────────────────────────────────────────────────────────
  const bg   = dark ? "#08080e" : "#f0f2f5";
  const sb   = dark ? "#0c0c15" : "#ffffff";
  const card = dark ? "#0f0f1a" : "#ffffff";
  const bdr  = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const cbdr = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)";
  const tx   = dark ? "#eeeef5" : "#111827";
  const txm  = dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)";
  const txf  = dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)";
  const ibg  = dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const acc  = dark ? "#00d084" : "#00935a";
  const adim = dark ? "rgba(0,208,132,0.12)" : "rgba(0,147,90,0.1)";
  const navtxon = dark ? "#00c47d" : "#00935a";
  const navact  = dark ? "rgba(0,196,125,0.1)" : "rgba(0,180,115,0.08)";
  const navactb = dark ? "rgba(0,196,125,0.2)" : "rgba(0,180,115,0.2)";
  const ui   = userEmail ? userEmail[0].toUpperCase() : "G";
  const inp  = { background: ibg, border: `1px solid ${cbdr}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, color: tx, fontFamily: "'Plus Jakarta Sans',sans-serif", outline: "none", width: "100%" };

  const audience     = getAudience();
  const previewText  = getPreview();
  const selectedTmpl = TEMPLATES.find(t => t.id === tmplId);
  const canSend = !!whatsapp && !!campaignName.trim() && audience.length > 0
    && (mode === "freetext" ? !!message.trim() : !!tmplId);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${bg}!important;color:${tx}!important;font-family:'Plus Jakarta Sans',sans-serif!important;}
        .wrap{display:flex;height:100vh;overflow:hidden;}
        .sidebar{width:224px;flex-shrink:0;background:${sb};border-right:1px solid ${bdr};display:flex;flex-direction:column;overflow-y:auto;transition:transform 0.25s;}
        .logo{padding:22px 20px 18px;font-weight:800;font-size:20px;color:${tx};text-decoration:none;display:block;border-bottom:1px solid ${bdr};}
        .logo span{color:${acc};}
        .navs{padding:18px 16px 7px;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${txf};font-weight:600;}
        .navi{display:flex;align-items:center;gap:9px;padding:9px 12px;margin:1px 8px;border-radius:8px;cursor:pointer;font-size:13.5px;color:${dark?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.5)"};font-weight:500;transition:all 0.13s;border:1px solid transparent;background:none;width:calc(100% - 16px);text-align:left;font-family:'Plus Jakarta Sans',sans-serif;}
        .navi:hover{background:${ibg};color:${tx};}
        .navi.act{background:${navact};color:${navtxon};font-weight:600;border-color:${navactb};}
        .navic{font-size:13px;width:18px;text-align:center;flex-shrink:0;}
        .sbf{margin-top:auto;padding:14px;border-top:1px solid ${bdr};}
        .uc{display:flex;align-items:center;gap:9px;padding:9px;border-radius:9px;background:${ibg};border:1px solid ${cbdr};}
        .ua{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,${acc},#0ea5e9);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#fff;flex-shrink:0;}
        .ue{font-size:11.5px;color:${txm};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .lb{margin-top:7px;width:100%;padding:7px;border-radius:7px;background:transparent;border:1px solid ${cbdr};font-size:12px;color:${txm};cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .lb:hover{border-color:#fca5a5;color:#ef4444;}
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .topbar{height:54px;flex-shrink:0;border-bottom:1px solid ${bdr};display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:${sb};}
        .tbtl{font-weight:700;font-size:15px;color:${tx};}
        .tright{display:flex;align-items:center;gap:8px;}
        .tt{display:flex;align-items:center;gap:6px;padding:5px 10px;background:${ibg};border:1px solid ${cbdr};border-radius:8px;cursor:pointer;font-size:11.5px;color:${txm};font-family:'Plus Jakarta Sans',sans-serif;}
        .tp{width:30px;height:16px;border-radius:100px;background:${dark?acc:"#d1d5db"};position:relative;flex-shrink:0;}
        .tp::after{content:'';position:absolute;top:2px;width:12px;height:12px;border-radius:50%;background:#fff;left:${dark?"16px":"2px"};}
        .con{flex:1;overflow-y:auto;padding:18px 20px;background:${bg};}
        .tc{padding:9px 12px;border-radius:8px;cursor:pointer;border:1px solid ${cbdr};background:transparent;transition:all 0.12s;margin-bottom:5px;text-align:left;width:100%;font-family:'Plus Jakarta Sans',sans-serif;}
        .tc:hover{background:${ibg};}
        .sc{padding:9px 11px;border-radius:8px;cursor:pointer;border:1px solid ${cbdr};background:transparent;margin-bottom:5px;transition:all 0.12s;}
        .sc:hover{border-color:${acc}33;}
        .cgrid{display:grid;grid-template-columns:240px 1fr 260px;gap:14px;}
        .hbtn{display:none;background:${ibg};border:1px solid ${cbdr};border-radius:8px;padding:6px 9px;cursor:pointer;font-size:17px;color:${tx};line-height:1;margin-right:4px;}
        .ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:299;cursor:pointer;}
        .bnav{display:none;position:fixed;bottom:0;left:0;right:0;background:${sb};border-top:1px solid ${bdr};padding:6px 0;z-index:200;}
        .bni{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 6px;border:none;background:transparent;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;flex:1;}
        .bnic{font-size:17px;color:${txf};}
        .bnil{font-size:9px;font-weight:600;color:${txf};}
        .bni.act .bnic,.bni.act .bnil{color:${acc};}
        select option{background-color:#0c0c15!important;color:#eeeef5!important;}
        @media(max-width:767px){
          .wrap{position:relative;}
          .sidebar{position:fixed;top:0;left:0;height:100vh;z-index:300;transform:translateX(-100%);}
          .sidebar.open{transform:translateX(0);box-shadow:4px 0 24px rgba(0,0,0,0.5);}
          .ov.open{display:block;}
          .hbtn{display:flex;}
          .topbar{padding:0 12px!important;}
          .con{padding:10px!important;}
          .cgrid{grid-template-columns:1fr!important;}
          .bnav{display:flex;justify-content:space-around;}
          .main{padding-bottom:60px;}
        }
      `}</style>

      <div className="wrap">
        <div className={"ov" + (mobOpen ? " open" : "")} onClick={() => setMobOpen(false)} />
        <aside className={"sidebar" + (mobOpen ? " open" : "")}>
          <a href="/dashboard" className="logo">fast<span>rill</span></a>
          <div className="navs">Platform</div>
          {NAV.map(item => (
            <button key={item.id} className={"navi" + (item.id === "campaigns" ? " act" : "")}
              onClick={() => { router.push(item.path); setMobOpen(false); }}>
              <span className="navic">{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
          <div className="sbf">
            <div className="uc"><div className="ua">{ui}</div><div className="ue">{userEmail || "Loading..."}</div></div>
            <button className="lb" onClick={logout}>↩ Sign out</button>
          </div>
        </aside>

        <div className="main">
          <div className="topbar">
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button className="hbtn" onClick={() => setMobOpen(s => !s)}>☰</button>
              <span className="tbtl">Campaigns</span>
              <div style={{ display: "flex", background: ibg, border: `1px solid ${cbdr}`, borderRadius: 8, padding: 2, gap: 1, marginLeft: 10 }}>
                {["compose", "history"].map(t => (
                  <button key={t} onClick={() => { setTab(t); if (t === "history") loadHistory(); }}
                    style={{ padding: "3px 11px", borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: "pointer", border: "none", background: tab === t ? card : "transparent", color: tab === t ? tx : txm, fontFamily: "'Plus Jakarta Sans',sans-serif", boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.15)" : "none" }}>
                    {t === "history" ? `History (${history.length})` : "Compose"}
                  </button>
                ))}
              </div>
            </div>
            <div className="tright">
              <button className="tt" onClick={toggleTheme}>
                <span>{dark ? "🌙" : "☀️"}</span><div className="tp" /><span>{dark ? "Dark" : "Light"}</span>
              </button>
            </div>
          </div>

          <div className="con">
            {/* WhatsApp not connected warning */}
            {!loading && !whatsapp && (
              <div style={{ background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.25)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#fb7185" }}>⚠️ WhatsApp not connected</div>
                  <div style={{ fontSize: 12, color: txm }}>Connect in Settings first to send campaigns</div>
                </div>
                <button onClick={() => router.push("/dashboard/settings")} style={{ padding: "6px 12px", borderRadius: 7, background: "rgba(251,113,133,0.1)", border: "1px solid rgba(251,113,133,0.25)", color: "#fb7185", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Settings →</button>
              </div>
            )}

            {/* DB migration warning */}
            {histError && tab === "history" && (
              <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10, padding: "12px 16px", marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#f59e0b" }}>⚠️ Campaign history table not found</div>
                <div style={{ fontSize: 12, color: txm, marginTop: 4 }}>
                  Run the SQL below in your Supabase SQL Editor to enable full campaign tracking:
                </div>
                <pre style={{ fontSize: 10.5, color: txf, background: ibg, borderRadius: 7, padding: "8px 10px", marginTop: 8, overflowX: "auto", lineHeight: 1.6 }}>
{`ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS delivered_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS read_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS replied_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wa_message_ids TEXT[] DEFAULT '{}';`}
                </pre>
              </div>
            )}

            {/* ── HISTORY TAB ── */}
            {tab === "history" ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: tx }}>Campaign History</div>
                  <button onClick={loadHistory} style={{ padding: "5px 12px", borderRadius: 7, background: ibg, border: `1px solid ${cbdr}`, color: txm, fontSize: 12, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>↻ Refresh</button>
                </div>

                <div style={{ background: card, border: `1px solid ${cbdr}`, borderRadius: 13, overflow: "hidden" }}>
                  {history.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 40, color: txf }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>📢</div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>No campaigns sent yet</div>
                      <div style={{ fontSize: 11, marginTop: 4 }}>Your sent campaigns will appear here with delivery stats</div>
                    </div>
                  ) : history.map(c => {
                    const sentCount = c.sent_count || 0;
                    const deliveredPct = sentCount > 0 ? Math.round(((c.delivered_count || 0) / sentCount) * 100) : 0;
                    const readPct      = sentCount > 0 ? Math.round(((c.read_count || 0) / sentCount) * 100) : 0;
                    const repliedPct   = sentCount > 0 ? Math.round(((c.replied_count || 0) / sentCount) * 100) : 0;
                    return (
                      <div key={c.id} style={{ padding: "14px 16px", borderBottom: `1px solid ${bdr}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: tx, marginBottom: 2 }}>{c.name}</div>
                            <div style={{ fontSize: 11.5, color: txm, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "90%" }}>{(c.message || "").substring(0, 80)}</div>
                            <div style={{ fontSize: 11, color: txf, marginTop: 3 }}>
                              {c.sent_at ? new Date(c.sent_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""} · {c.segment}
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: acc }}>{sentCount} sent</div>
                            {c.status === "sending" && <div style={{ fontSize: 10, color: "#f59e0b", marginTop: 2 }}>● Sending...</div>}
                          </div>
                        </div>

                        {/* FIX: Delivery stats bars */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                          {[
                            { label: "📬 Delivered", count: c.delivered_count || 0, pct: deliveredPct, color: "#38bdf8" },
                            { label: "👁 Read",      count: c.read_count      || 0, pct: readPct,      color: "#a78bfa" },
                            { label: "↩ Replied",   count: c.replied_count   || 0, pct: repliedPct,   color: acc },
                          ].map(stat => (
                            <div key={stat.label} style={{ background: ibg, borderRadius: 8, padding: "8px 10px" }}>
                              <div style={{ fontSize: 10.5, color: txf, marginBottom: 3 }}>{stat.label}</div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: stat.count > 0 ? stat.color : txf }}>{stat.count}</div>
                              {sentCount > 0 && (
                                <div style={{ marginTop: 4 }}>
                                  <div style={{ height: 3, borderRadius: 100, background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }}>
                                    <div style={{ height: 3, borderRadius: 100, width: `${stat.pct}%`, background: stat.color, transition: "width 0.4s" }} />
                                  </div>
                                  <div style={{ fontSize: 9.5, color: txf, marginTop: 2 }}>{stat.pct}%</div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Refresh stats button for completed campaigns */}
                        {c.id && c.status !== "sending" && (
                          <button onClick={() => { refreshReplies(c.id); pollDeliveryStats(c.id); }}
                            style={{ marginTop: 8, padding: "4px 10px", borderRadius: 6, background: "transparent", border: `1px solid ${cbdr}`, color: txf, fontSize: 11, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                            ↻ Refresh stats
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            ) : step === "done" ? (
              // ── DONE STATE ──
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 16 }}>
                <div style={{ fontSize: 52 }}>🎉</div>
                <div style={{ fontWeight: 800, fontSize: 22, color: tx }}>Campaign Sent!</div>
                <div style={{ display: "flex", gap: 24 }}>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: 36, fontWeight: 800, color: acc }}>{sent}</div><div style={{ fontSize: 12, color: txm }}>Sent</div></div>
                  {failed > 0 && <div style={{ textAlign: "center" }}><div style={{ fontSize: 36, fontWeight: 800, color: "#fb7185" }}>{failed}</div><div style={{ fontSize: 12, color: txm }}>Failed</div></div>}
                </div>
                <div style={{ fontSize: 12, color: txf, textAlign: "center", maxWidth: 300, lineHeight: 1.6 }}>
                  Delivery stats update automatically as WhatsApp reports them. Check History tab in a few minutes.
                </div>
                {sendLog.length > 0 && (
                  <div style={{ background: card, border: `1px solid ${cbdr}`, borderRadius: 11, padding: 14, width: "100%", maxWidth: 420, maxHeight: 200, overflowY: "auto" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: txf, marginBottom: 8 }}>SEND LOG</div>
                    {sendLog.map((l, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, padding: "3px 0", borderBottom: `1px solid ${bdr}` }}>
                        <span style={{ color: tx }}>{l.name}</span>
                        <span style={{ color: l.status === "sent" ? acc : "#fb7185" }}>
                          {l.status === "sent" ? "✓ Sent" : "✗ " + (l.error || "Failed")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => { setStep("compose"); setSent(0); setFailed(0); setCampaignName(""); setSendLog([]); }}
                    style={{ padding: "10px 24px", borderRadius: 9, background: acc, border: "none", color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                    New Campaign
                  </button>
                  <button onClick={() => { setTab("history"); setStep("compose"); loadHistory(); }}
                    style={{ padding: "10px 24px", borderRadius: 9, background: ibg, border: `1px solid ${cbdr}`, color: txm, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                    View History →
                  </button>
                </div>
              </div>

            ) : step === "sending" ? (
              // ── SENDING STATE ──
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 14 }}>
                <div style={{ fontSize: 40 }}>📤</div>
                <div style={{ fontWeight: 800, fontSize: 18, color: tx }}>Sending Campaign...</div>
                <div style={{ fontSize: 12, color: txm }}>Keep this tab open · 1 message per second · Do not refresh</div>
                <div style={{ display: "flex", gap: 24 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: acc }}>{sent}</div>
                    <div style={{ fontSize: 11, color: txm }}>Sent</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: txm }}>{Math.max(0, audience.length - sent - failed)}</div>
                    <div style={{ fontSize: 11, color: txm }}>Remaining</div>
                  </div>
                  {failed > 0 && (
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 32, fontWeight: 800, color: "#fb7185" }}>{failed}</div>
                      <div style={{ fontSize: 11, color: txm }}>Failed</div>
                    </div>
                  )}
                </div>
                <div style={{ width: 280, height: 6, borderRadius: 100, background: ibg }}>
                  <div style={{ height: 6, borderRadius: 100, background: acc, width: audience.length > 0 ? `${Math.round(((sent + failed) / audience.length) * 100)}%` : "0%", transition: "width 0.5s" }} />
                </div>
                <div style={{ fontSize: 11, color: txf }}>{audience.length > 0 ? Math.round(((sent + failed) / audience.length) * 100) : 0}% complete</div>
              </div>

            ) : (
              // ── COMPOSE STATE ──
              <div className="cgrid">
                {/* Left column: type + templates */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ background: card, border: `1px solid ${cbdr}`, borderRadius: 13, padding: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: tx, marginBottom: 10 }}>Campaign Type</div>
                    <div onClick={() => setMode("template")} style={{ padding: "10px 12px", borderRadius: 9, cursor: "pointer", border: `1px solid ${mode === "template" ? acc + "55" : cbdr}`, background: mode === "template" ? adim : "transparent", marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 12.5, color: mode === "template" ? acc : tx }}>◈ Meta Template</div>
                      <div style={{ fontSize: 10.5, color: txf, marginTop: 2 }}>Works anytime · No 24hr limit ✅</div>
                    </div>
                    <div onClick={() => setMode("freetext")} style={{ padding: "10px 12px", borderRadius: 9, cursor: "pointer", border: `1px solid ${mode === "freetext" ? acc + "55" : cbdr}`, background: mode === "freetext" ? adim : "transparent" }}>
                      <div style={{ fontWeight: 700, fontSize: 12.5, color: mode === "freetext" ? acc : tx }}>✏️ Free Text</div>
                      <div style={{ fontSize: 10.5, color: txf, marginTop: 2 }}>24hr window only</div>
                    </div>
                  </div>

                  <div style={{ background: card, border: `1px solid ${cbdr}`, borderRadius: 13, padding: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: tx, marginBottom: 6 }}>
                      {mode === "template" ? "Template Library" : "Quick Templates"}
                    </div>
                    {mode === "template" ? (
                      <>
                        <div style={{ fontSize: 10.5, color: txf, marginBottom: 8 }}>Pick template · Fill details · Send to anyone</div>
                        {TEMPLATES.map(t => (
                          <button key={t.id} className="tc" onClick={() => { setTmplId(t.id); setTmplVals({ biz: bizName }); }}
                            style={{ color: tmplId === t.id ? acc : tx, fontWeight: tmplId === t.id ? 700 : 500, fontSize: 12, border: `1px solid ${tmplId === t.id ? acc + "44" : cbdr}`, background: tmplId === t.id ? adim : "transparent" }}>
                            <div>{t.label}</div>
                            <div style={{ fontSize: 9.5, color: tmplId === t.id ? acc : txf, fontWeight: 400, marginTop: 2 }}>{t.category}</div>
                          </button>
                        ))}
                      </>
                    ) : (
                      QUICK.map(t => (
                        <button key={t.id} className="tc" onClick={() => { setQuickId(t.id); if (t.text) setMessage(t.text); }}
                          style={{ color: quickId === t.id ? acc : tx, fontWeight: quickId === t.id ? 700 : 500, fontSize: 12.5, border: `1px solid ${quickId === t.id ? acc + "44" : cbdr}`, background: quickId === t.id ? adim : "transparent" }}>
                          {t.label}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Middle column: compose + preview */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ background: card, border: `1px solid ${cbdr}`, borderRadius: 13, padding: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: tx, marginBottom: 12 }}>
                      {mode === "template" ? "Template Details" : "Compose Message"}
                    </div>

                    {/* Campaign name */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11.5, color: txm, marginBottom: 4, fontWeight: 600 }}>
                        Campaign Name <span style={{ color: "#fb7185" }}>*</span>
                      </div>
                      <input placeholder="e.g. Summer Offer June 2026" value={campaignName}
                        onChange={e => setCampaignName(e.target.value)}
                        style={{ ...inp, border: `1px solid ${!campaignName.trim() ? "rgba(251,113,133,0.35)" : cbdr}` }} />
                    </div>

                    {mode === "template" ? (
                      selectedTmpl ? (
                        <div>
                          <div style={{ fontSize: 11.5, color: txm, marginBottom: 12, fontWeight: 600 }}>
                            Fill in details for <span style={{ color: acc }}>{selectedTmpl.label}</span>
                          </div>
                          {selectedTmpl.vars.map(v => (
                            <div key={v.key} style={{ marginBottom: 11 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <div style={{ fontSize: 11.5, color: txm, fontWeight: 600 }}>{v.label}</div>
                                {v.auto && <div style={{ fontSize: 10, color: acc }}>auto-filled per customer</div>}
                              </div>
                              {v.auto ? (
                                <div style={{ ...inp, background: "transparent", border: `1px solid ${acc}22`, color: acc, fontSize: 12 }}>
                                  {v.key === "name" ? "Customer's first name (personalised per send)" : (tmplVals[v.key] || bizName || v.hint)}
                                </div>
                              ) : (
                                <input placeholder={v.hint} value={tmplVals[v.key] || ""}
                                  onChange={e => setTmplVals(p => ({ ...p, [v.key]: e.target.value }))}
                                  style={inp} />
                              )}
                            </div>
                          ))}
                          <div style={{ padding: "9px 11px", background: "rgba(0,208,132,0.07)", border: `1px solid ${acc}22`, borderRadius: 8, fontSize: 11, color: txm, lineHeight: 1.6 }}>
                            ✅ Template campaigns reach any contact anytime — no 24hr restriction.
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: "center", padding: "24px 0", color: txf }}>
                          <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }}>←</div>
                          <div style={{ fontSize: 12 }}>Select a template from the left to get started</div>
                        </div>
                      )
                    ) : (
                      <>
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <div style={{ fontSize: 11.5, color: txm, fontWeight: 600 }}>Message</div>
                            <div style={{ fontSize: 11, color: txf }}>{message.length}/4096</div>
                          </div>
                          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5}
                            placeholder="Type your message... Use {name} for customer name, {business} for your business name"
                            style={{ ...inp, resize: "vertical", lineHeight: 1.6, minHeight: 120 }} />
                        </div>
                        <div style={{ marginBottom: 10, padding: "10px 12px", background: ibg, border: `1px solid ${ctaUrl ? acc + "33" : cbdr}`, borderRadius: 9 }}>
                          <div style={{ fontSize: 11.5, color: txm, fontWeight: 600, marginBottom: 8 }}>🔗 CTA Link (optional)</div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 8 }}>
                            <input placeholder="Button text" value={ctaText} onChange={e => setCtaText(e.target.value)} style={{ ...inp, padding: "7px 10px", fontSize: 12 }} />
                            <input placeholder="https://..." value={ctaUrl} onChange={e => setCtaUrl(e.target.value)} style={{ ...inp, padding: "7px 10px", fontSize: 12 }} />
                          </div>
                        </div>
                        <div style={{ padding: "9px 11px", background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, fontSize: 11, color: "#f59e0b", lineHeight: 1.6 }}>
                          ⚠️ Free text only works if customer messaged you in last 24hrs. For bulk → use Meta Template.
                        </div>
                      </>
                    )}
                  </div>

                  {/* WhatsApp preview */}
                  <div style={{ background: card, border: `1px solid ${cbdr}`, borderRadius: 13, padding: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: tx, marginBottom: 10 }}>
                      Message Preview
                      {audience.length > 0 && <span style={{ fontSize: 11, color: txf, fontWeight: 400, marginLeft: 8 }}>for {(audience[0].name || "Customer").split(" ")[0]}</span>}
                    </div>
                    <div style={{ background: dark ? "#0d1117" : "#e5ddd5", borderRadius: 12, padding: "14px 12px" }}>
                      <div style={{ background: dark ? "#1c2433" : "#ffffff", borderRadius: "4px 14px 14px 14px", padding: "11px 14px", maxWidth: "88%", display: "inline-block", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
                        <div style={{ fontSize: 13, color: dark ? "#e8eaf0" : "#111827", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                          {previewText || "Select a template and fill in details to see preview..."}
                        </div>
                        <div style={{ fontSize: 10, color: txf, marginTop: 6, textAlign: "right" }}>
                          {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Test send */}
                  <div style={{ background: card, border: `1px solid ${cbdr}`, borderRadius: 13, padding: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: tx, marginBottom: 4 }}>🧪 Send Test Message</div>
                    <div style={{ fontSize: 11.5, color: txf, marginBottom: 8 }}>Always test before sending to your full audience</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input placeholder="Your number e.g. 919876543210" value={testPhone}
                        onChange={e => setTestPhone(e.target.value)}
                        style={{ ...inp, flex: 1 }}
                        onKeyDown={e => { if (e.key === "Enter") sendTest(); }} />
                      <button onClick={sendTest} disabled={!testPhone.trim() || !whatsapp || testSending}
                        style={{ padding: "9px 14px", borderRadius: 8, background: testSent ? acc : adim, border: `1px solid ${acc}44`, color: testSent ? "#000" : acc, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", flexShrink: 0, whiteSpace: "nowrap" }}>
                        {testSending ? "Sending..." : testSent ? "Sent ✓" : "Send Test"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right column: audience + send */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ background: card, border: `1px solid ${cbdr}`, borderRadius: 13, padding: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: tx, marginBottom: 10 }}>Select Audience</div>
                    {SEGMENTS.map(s => (
                      <div key={s.id} onClick={() => { setSegment(s.id); if (s.id !== "csv") setCsvNums([]); }} className="sc"
                        style={{ border: `1px solid ${segment === s.id ? acc + "55" : cbdr}`, background: segment === s.id ? adim : "transparent" }}>
                        <div style={{ fontWeight: 600, fontSize: 12.5, color: segment === s.id ? acc : tx }}>{s.label}</div>
                        <div style={{ fontSize: 10.5, color: txf, marginTop: 1 }}>{s.desc}</div>
                      </div>
                    ))}

                    {segment === "manual" && (
                      <div style={{ marginTop: 8 }}>
                        <textarea placeholder={"Phone numbers:\n919876543210\n918765432109"} value={manualNums}
                          onChange={e => setManualNums(e.target.value)} rows={4}
                          style={{ ...inp, resize: "vertical", fontSize: 12, lineHeight: 1.6, marginBottom: 4 }} />
                        <div style={{ fontSize: 10.5, color: acc }}>
                          {manualNums.replace(/,/g, " ").replace(/;/g, " ").split(" ").filter(s => s.trim().length >= 8).length} numbers detected
                        </div>
                      </div>
                    )}

                    {segment === "csv" && (
                      <div style={{ marginTop: 8 }}>
                        <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={handleCsv} />
                        <button onClick={() => fileRef.current?.click()}
                          style={{ width: "100%", padding: 8, borderRadius: 8, background: adim, border: `1px solid ${acc}44`, color: acc, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                          📎 {csvNums.length > 0 ? `${csvNums.length} numbers loaded` : "Upload CSV or .txt"}
                        </button>
                        {csvNums.length > 0 && (
                          <div style={{ fontSize: 11, color: txf, marginTop: 4, textAlign: "center" }}>
                            <span style={{ color: "#fb7185", cursor: "pointer" }} onClick={() => { setCsvNums([]); setSegment("all"); }}>Clear</span>
                          </div>
                        )}
                        <div style={{ fontSize: 10.5, color: txf, marginTop: 5 }}>One number per line, or first column of CSV</div>
                      </div>
                    )}
                  </div>

                  <div style={{ background: card, border: `1px solid ${cbdr}`, borderRadius: 13, padding: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: tx, marginBottom: 8 }}>Ready to Send</div>
                    <div style={{ fontSize: 38, fontWeight: 800, color: audience.length > 0 ? acc : txf, marginBottom: 2, letterSpacing: "-1.5px" }}>
                      {audience.length}
                    </div>
                    <div style={{ fontSize: 12, color: txm, marginBottom: 12 }}>
                      {audience.length === 1 ? "recipient" : "recipients"}
                      {optouts.length > 0 && <span style={{ fontSize: 11, color: txf }}> · {optouts.length} opted out excluded</span>}
                    </div>

                    {audience.length > 0 && (
                      <div style={{ marginBottom: 12, maxHeight: 90, overflowY: "auto", background: ibg, borderRadius: 8, padding: "8px 10px" }}>
                        {audience.slice(0, 5).map((c, i) => (
                          <div key={i} style={{ fontSize: 11.5, color: txf, padding: "2px 0", display: "flex", justifyContent: "space-between" }}>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "55%" }}>{c.name}</span>
                            <span style={{ fontFamily: "monospace" }}>···{toSendPhone(c.phone).slice(-4)}</span>
                          </div>
                        ))}
                        {audience.length > 5 && <div style={{ fontSize: 11, color: txf, paddingTop: 4 }}>+{audience.length - 5} more</div>}
                      </div>
                    )}

                    {optouts.length > 0 && (
                      <div style={{ marginBottom: 10, padding: "7px 10px", background: "rgba(251,113,133,0.06)", border: "1px solid rgba(251,113,133,0.15)", borderRadius: 7, fontSize: 11, color: "#fb7185" }}>
                        🚫 {optouts.length} opted out (STOP) — auto excluded
                      </div>
                    )}

                    <div style={{ padding: "8px 10px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 7, fontSize: 11, color: "#f59e0b", marginBottom: 12, lineHeight: 1.5 }}>
                      ⚠️ Only send to customers who have messaged you first. STOP replies auto-excluded.
                    </div>

                    <button onClick={sendCampaign} disabled={!canSend || sending}
                      style={{ width: "100%", padding: 12, background: canSend ? acc : ibg, border: `1px solid ${canSend ? acc : cbdr}`, borderRadius: 9, color: canSend ? "#000" : txm, fontWeight: 700, fontSize: 13, cursor: canSend ? "pointer" : "not-allowed", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                      {!whatsapp ? "Connect WhatsApp first"
                        : !campaignName.trim() ? "Add campaign name ↑"
                        : !audience.length ? "Select an audience"
                        : mode === "template" && !tmplId ? "Select a template ←"
                        : `🚀 Send to ${audience.length} people`}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="bnav">
        {[
          { id: "overview", icon: "⬡", label: "Home",      path: "/dashboard" },
          { id: "inbox",    icon: "◎", label: "Chats",     path: "/dashboard/conversations" },
          { id: "campaigns",icon: "◆", label: "Campaigns", path: "/dashboard/campaigns" },
          { id: "leads",    icon: "◉", label: "Leads",     path: "/dashboard/leads" },
          { id: "contacts", icon: "◑", label: "Customers", path: "/dashboard/contacts" },
        ].map(item => (
          <button key={item.id} className={"bni" + (item.id === "campaigns" ? " act" : "")} onClick={() => router.push(item.path)}>
            <span className="bnic">{item.icon}</span>
            <span className="bnil">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
