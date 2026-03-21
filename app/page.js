<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Fastrill — WhatsApp AI Receptionist for Indian Service Businesses</title>
<meta name="description" content="Fastrill turns your WhatsApp into a 24/7 AI booking engine. Auto-book appointments, answer customer questions, and grow your salon, clinic, or spa — in Hindi, Telugu, Tamil, and more.">
<meta name="keywords" content="WhatsApp booking software India, AI receptionist salon India, WhatsApp appointment booking, automated booking salon, WhatsApp CRM India, salon booking software, spa booking AI, clinic appointment WhatsApp, Hindi WhatsApp bot, Telugu WhatsApp booking">
<meta property="og:title" content="Fastrill — Your WhatsApp AI Receptionist">
<meta property="og:description" content="Books appointments, converts leads, answers in 10+ languages — 24/7. Built for Indian salons, spas & clinics.">
<meta property="og:type" content="website">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600;1,700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">

<style>
/* ══════════════════════════════════════════════════════════
   FASTRILL — Light Premium Theme
   Fonts: Playfair Display (headings) + Outfit (body)
   Palette: Warm cream + deep navy + green accent
   Feel: Premium Indian SaaS — like a luxury brand not a startup
══════════════════════════════════════════════════════════ */

:root {
  --cream:    #faf8f4;
  --cream2:   #f4f1eb;
  --cream3:   #ede9e0;
  --navy:     #0f1523;
  --navy2:    #1a2235;
  --navy3:    #243048;
  --green:    #00a86b;
  --green2:   #00d084;
  --green-bg: rgba(0,168,107,0.08);
  --green-bd: rgba(0,168,107,0.2);
  --text:     #1a1a2e;
  --muted:    #6b7280;
  --faint:    #9ca3af;
  --border:   #e5e0d8;
  --border2:  #d1ccc2;
  --white:    #ffffff;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04);
  --shadow-lg: 0 20px 60px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06);
  --shadow-xl: 0 40px 100px rgba(0,0,0,0.16);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }

body {
  background: var(--white);
  color: var(--text);
  font-family: 'Outfit', sans-serif;
  font-size: 16px;
  line-height: 1.6;
  overflow-x: hidden;
}

h1, h2, h3, .display {
  font-family: 'Playfair Display', serif;
  line-height: 1.1;
  letter-spacing: -0.01em;
}

/* ── NAV ───────────────────────────────────────────────── */
nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  padding: 0 48px;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(24px);
  border-bottom: 1px solid var(--border);
}

.logo {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 22px;
  color: var(--text);
  text-decoration: none;
  letter-spacing: -0.5px;
}
.logo span { color: var(--green); }

.nav-links {
  display: flex;
  align-items: center;
  gap: 36px;
  list-style: none;
}
.nav-links a {
  color: var(--muted);
  text-decoration: none;
  font-size: 14.5px;
  font-weight: 500;
  transition: color 0.2s;
}
.nav-links a:hover { color: var(--text); }

.nav-cta {
  background: var(--navy) !important;
  color: var(--white) !important;
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 600 !important;
  font-size: 14px !important;
  transition: background 0.2s !important;
}
.nav-cta:hover { background: var(--navy2) !important; }

/* ── HERO ──────────────────────────────────────────────── */
.hero {
  padding: 140px 48px 100px;
  background: var(--cream);
  position: relative;
  overflow: hidden;
}

/* Subtle geometric background */
.hero::before {
  content: '';
  position: absolute;
  top: -100px; right: -100px;
  width: 600px; height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0,168,107,0.06) 0%, transparent 70%);
  pointer-events: none;
}

.hero::after {
  content: '';
  position: absolute;
  bottom: -150px; left: -100px;
  width: 500px; height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(15,21,35,0.04) 0%, transparent 70%);
  pointer-events: none;
}

.hero-inner {
  max-width: 1160px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
  position: relative;
  z-index: 1;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--green-bg);
  border: 1px solid var(--green-bd);
  border-radius: 100px;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--green);
  margin-bottom: 28px;
}

.hero-badge::before {
  content: '';
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--green);
  animation: blink 2s ease infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.hero h1 {
  font-size: clamp(42px, 5vw, 68px);
  font-weight: 800;
  color: var(--navy);
  margin-bottom: 24px;
  line-height: 1.08;
}

.hero h1 em {
  font-style: italic;
  color: var(--green);
}

.hero-sub {
  font-size: 18px;
  color: var(--muted);
  line-height: 1.7;
  font-weight: 400;
  margin-bottom: 40px;
  max-width: 480px;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 48px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--navy);
  color: var(--white);
  padding: 14px 32px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 15px;
  text-decoration: none;
  transition: all 0.2s;
  font-family: 'Outfit', sans-serif;
  box-shadow: 0 4px 20px rgba(15,21,35,0.25);
}
.btn-primary:hover {
  background: var(--navy2);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(15,21,35,0.3);
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  color: var(--text);
  padding: 14px 28px;
  border-radius: 10px;
  font-weight: 500;
  font-size: 15px;
  text-decoration: none;
  border: 1.5px solid var(--border2);
  transition: all 0.2s;
}
.btn-ghost:hover {
  border-color: var(--green);
  color: var(--green);
}

.hero-trust {
  display: flex;
  align-items: center;
  gap: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.trust-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--muted);
  font-weight: 500;
}

.trust-check {
  width: 18px; height: 18px;
  border-radius: 50%;
  background: var(--green-bg);
  border: 1px solid var(--green-bd);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--green);
  flex-shrink: 0;
}

/* ── PHONE MOCKUP ─────────────────────────────────────── */
.hero-visual {
  display: flex;
  justify-content: center;
  position: relative;
}

/* Decorative dots */
.hero-visual::before {
  content: '';
  position: absolute;
  top: -20px; right: -20px;
  width: 120px; height: 120px;
  background-image: radial-gradient(circle, var(--border2) 1.5px, transparent 1.5px);
  background-size: 14px 14px;
  opacity: 0.6;
}

.phone-wrap {
  position: relative;
  display: inline-block;
}

.phone-shadow {
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  width: 220px;
  height: 40px;
  background: radial-gradient(ellipse, rgba(0,0,0,0.15) 0%, transparent 70%);
  filter: blur(10px);
}

.phone {
  width: 300px;
  background: #1c1c1e;
  border-radius: 44px;
  padding: 14px;
  box-shadow: var(--shadow-xl), 0 0 0 1px rgba(255,255,255,0.05) inset;
  position: relative;
}

/* Notch */
.phone::before {
  content: '';
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  width: 90px; height: 28px;
  background: #1c1c1e;
  border-radius: 0 0 18px 18px;
  z-index: 10;
}

.phone-screen {
  background: #111b21;
  border-radius: 32px;
  overflow: hidden;
}

.wa-header {
  background: #1f2c34;
  padding: 40px 14px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.wa-avatar {
  width: 34px; height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--green), #0ea5e9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  color: #000;
  flex-shrink: 0;
}

.wa-info {}
.wa-name   { font-size: 13px; font-weight: 600; color: #e9edef; }
.wa-status { font-size: 10.5px; color: var(--green); }

.wa-msgs {
  background: #0b141a;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 380px;
}

.wa-msg {
  max-width: 82%;
  padding: 7px 10px;
  border-radius: 7px;
  font-size: 11.5px;
  line-height: 1.45;
  color: #e9edef;
}

.wa-msg.in {
  background: #202c33;
  align-self: flex-start;
  border-radius: 2px 7px 7px 7px;
  animation: slideIn 0.35s ease both;
}

.wa-msg.out {
  background: #005c4b;
  align-self: flex-end;
  border-radius: 7px 2px 7px 7px;
  animation: slideIn 0.35s ease both;
}

.wa-msg.bot {
  background: linear-gradient(135deg, #0a2a1f, #0d3525);
  border: 1px solid rgba(0,168,107,0.25);
  align-self: flex-start;
  border-radius: 2px 7px 7px 7px;
  animation: slideIn 0.35s ease both;
}

.bot-label { font-size: 9.5px; color: var(--green2); font-weight: 700; margin-bottom: 2px; display: block; }
.wa-time   { font-size: 9.5px; color: #8696a0; text-align: right; margin-top: 2px; }

@keyframes slideIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Floating stat cards */
.float-card {
  position: absolute;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px 18px;
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
  animation: float 3s ease-in-out infinite;
}

.float-card-1 {
  top: 60px;
  right: -80px;
  animation-delay: 0s;
}

.float-card-2 {
  bottom: 120px;
  left: -90px;
  animation-delay: 1.5s;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.float-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.float-icon.green { background: var(--green-bg); }
.float-icon.blue  { background: rgba(59,130,246,0.1); }

.float-num   { font-size: 18px; font-weight: 700; color: var(--text); font-family: 'Outfit', sans-serif; line-height: 1; }
.float-label { font-size: 11px; color: var(--muted); margin-top: 1px; }

/* ── CONTAINER ─────────────────────────────────────────── */
.container {
  max-width: 1160px;
  margin: 0 auto;
  padding: 0 48px;
}

/* ── LOGOS STRIP ───────────────────────────────────────── */
.logos-strip {
  padding: 40px 0;
  border-bottom: 1px solid var(--border);
  background: var(--white);
}

.logos-inner {
  max-width: 1160px;
  margin: 0 auto;
  padding: 0 48px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.logos-label {
  font-size: 13px;
  color: var(--faint);
  white-space: nowrap;
  font-weight: 500;
}

.logos-divider {
  width: 1px;
  height: 24px;
  background: var(--border);
  flex-shrink: 0;
}

.logos-row {
  display: flex;
  align-items: center;
  gap: 32px;
  flex: 1;
}

.biz-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--muted);
  white-space: nowrap;
}

/* ── STATS ─────────────────────────────────────────────── */
.stats-section {
  padding: 80px 0;
  background: var(--navy);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
}

.stat-item {
  text-align: center;
  padding: 0 32px;
  border-right: 1px solid rgba(255,255,255,0.1);
  position: relative;
}
.stat-item:last-child { border-right: none; }

.stat-num {
  font-family: 'Playfair Display', serif;
  font-size: 52px;
  font-weight: 700;
  color: var(--white);
  line-height: 1;
  margin-bottom: 8px;
}

.stat-accent { color: var(--green2); }

.stat-label {
  font-size: 14px;
  color: rgba(255,255,255,0.5);
  font-weight: 400;
  line-height: 1.4;
}

/* ── SECTION COMMON ────────────────────────────────────── */
.section-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--green);
  margin-bottom: 16px;
}

.section-eyebrow::before {
  content: '';
  width: 20px;
  height: 2px;
  background: var(--green);
  border-radius: 1px;
}

.section-h {
  font-size: clamp(32px, 4vw, 52px);
  font-weight: 700;
  color: var(--navy);
  margin-bottom: 20px;
  line-height: 1.1;
}

.section-p {
  font-size: 17px;
  color: var(--muted);
  line-height: 1.7;
  font-weight: 400;
}

/* ── HOW IT WORKS ──────────────────────────────────────── */
.how-section {
  padding: 120px 0;
  background: var(--cream);
}

.steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
  margin-top: 72px;
  position: relative;
}

/* Connecting line */
.steps::before {
  content: '';
  position: absolute;
  top: 52px;
  left: calc(16.66% + 24px);
  right: calc(16.66% + 24px);
  height: 1px;
  background: linear-gradient(90deg, var(--green), rgba(0,168,107,0.2), var(--green));
  z-index: 0;
}

.step {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 40px 32px;
  position: relative;
  z-index: 1;
  transition: all 0.25s;
  box-shadow: var(--shadow-sm);
}

.step:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-lg);
  border-color: var(--green-bd);
}

.step-num {
  width: 52px; height: 52px;
  border-radius: 14px;
  background: var(--navy);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  font-family: 'Outfit', sans-serif;
  margin-bottom: 24px;
}

.step h3 {
  font-size: 20px;
  font-weight: 700;
  color: var(--navy);
  margin-bottom: 12px;
  font-family: 'Playfair Display', serif;
}

.step p {
  font-size: 14.5px;
  color: var(--muted);
  line-height: 1.7;
}

/* ── FEATURES ──────────────────────────────────────────── */
.features-section {
  padding: 120px 0;
  background: var(--white);
}

.features-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: start;
  margin-top: 72px;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
}

.feature-row {
  padding: 24px 28px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.15s;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}
.feature-row:last-child { border-bottom: none; }
.feature-row:hover, .feature-row.active { background: var(--cream); }
.feature-row.active { border-left: 3px solid var(--green); }

.feature-row-icon {
  width: 40px; height: 40px;
  border-radius: 10px;
  background: var(--green-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 2px;
}

.feature-row-text {}
.feature-row-title { font-size: 15px; font-weight: 600; color: var(--navy); margin-bottom: 4px; }
.feature-row-desc  { font-size: 13.5px; color: var(--muted); line-height: 1.6; }

.feature-detail {
  background: var(--cream);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 40px;
  position: sticky;
  top: 100px;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.feature-detail-icon { font-size: 48px; margin-bottom: 20px; }
.feature-detail h3   { font-size: 26px; font-weight: 700; color: var(--navy); margin-bottom: 14px; }
.feature-detail p    { font-size: 15px; color: var(--muted); line-height: 1.75; }

.feature-detail-tag {
  display: inline-block;
  margin-top: 20px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--green);
  background: var(--green-bg);
  border: 1px solid var(--green-bd);
  padding: 4px 12px;
  border-radius: 6px;
}

/* ── CONVERSATION DEMO ─────────────────────────────────── */
.demo-section {
  padding: 120px 0;
  background: var(--cream);
}

.demo-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: start;
  margin-top: 72px;
}

.scenario-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.scenario {
  background: var(--white);
  border: 1.5px solid var(--border);
  border-radius: 14px;
  padding: 18px 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.scenario.active {
  border-color: var(--green);
  background: var(--white);
  box-shadow: 0 0 0 3px var(--green-bg);
}

.scenario:hover:not(.active) {
  border-color: var(--border2);
  box-shadow: var(--shadow-sm);
}

.scenario-title { font-size: 14.5px; font-weight: 600; color: var(--navy); margin-bottom: 4px; }
.scenario-desc  { font-size: 13px; color: var(--muted); }

.chat-window {
  background: #0b141a;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: var(--shadow-xl);
}

.chat-win-header {
  background: #1f2c34;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-win-msgs {
  padding: 20px 16px;
  min-height: 360px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #0b141a;
}

.cw-msg {
  max-width: 78%;
  padding: 9px 14px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.55;
  animation: msgIn 0.3s ease both;
}

.cw-msg.customer {
  background: #005c4b;
  color: #e9edef;
  align-self: flex-end;
  border-radius: 10px 2px 10px 10px;
}

.cw-msg.ai {
  background: #1a2a22;
  border: 1px solid rgba(0,168,107,0.2);
  color: #e9edef;
  align-self: flex-start;
  border-radius: 2px 10px 10px 10px;
}

.cw-ai-label { font-size: 10px; color: var(--green2); font-weight: 700; margin-bottom: 3px; display: block; }

@keyframes msgIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── FOR WHO ────────────────────────────────────────────── */
.forwho-section {
  padding: 120px 0;
  background: var(--white);
}

.biz-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-top: 72px;
}

.biz-card {
  background: var(--cream);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 28px 22px;
  text-align: center;
  transition: all 0.25s;
}

.biz-card:hover {
  background: var(--white);
  border-color: var(--green-bd);
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.biz-emoji { font-size: 32px; margin-bottom: 12px; display: block; }
.biz-name  { font-size: 15px; font-weight: 600; color: var(--navy); margin-bottom: 6px; }
.biz-desc  { font-size: 13px; color: var(--muted); line-height: 1.5; }

/* ── VS SECTION ────────────────────────────────────────── */
.vs-section {
  padding: 120px 0;
  background: var(--navy);
  position: relative;
  overflow: hidden;
}

.vs-section::before {
  content: '';
  position: absolute;
  top: -200px; right: -200px;
  width: 600px; height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0,208,132,0.06) 0%, transparent 70%);
}

.vs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: center;
  margin-top: 64px;
}

.vs-copy .section-eyebrow { color: var(--green2); }
.vs-copy .section-eyebrow::before { background: var(--green2); }
.vs-copy .section-h { color: var(--white); }
.vs-copy .section-p { color: rgba(255,255,255,0.6); }

.vs-points {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 32px;
}

.vs-point {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 15px;
  color: rgba(255,255,255,0.75);
  line-height: 1.6;
}

.vs-check {
  width: 22px; height: 22px;
  border-radius: 50%;
  background: rgba(0,208,132,0.15);
  border: 1px solid rgba(0,208,132,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--green2);
  flex-shrink: 0;
  margin-top: 2px;
}

.vs-table {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  overflow: hidden;
}

.vs-table-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: rgba(255,255,255,0.06);
}

.vs-col-h {
  padding: 16px 24px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.vs-col-h.them { color: rgba(255,255,255,0.4); border-right: 1px solid rgba(255,255,255,0.1); }
.vs-col-h.us   { color: var(--green2); }

.vs-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid rgba(255,255,255,0.08);
}

.vs-cell {
  padding: 14px 24px;
  font-size: 13.5px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.vs-cell.them {
  color: rgba(255,255,255,0.4);
  border-right: 1px solid rgba(255,255,255,0.08);
}
.vs-cell.them::before { content: '✕'; color: #f87171; font-size: 11px; }

.vs-cell.us {
  color: rgba(255,255,255,0.85);
  font-weight: 500;
}
.vs-cell.us::before { content: '✓'; color: var(--green2); font-size: 11px; }

/* ── PRICING ────────────────────────────────────────────── */
.pricing-section {
  padding: 120px 0;
  background: var(--cream);
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 72px;
}

.plan {
  background: var(--white);
  border: 1.5px solid var(--border);
  border-radius: 24px;
  padding: 40px 36px;
  position: relative;
  transition: all 0.25s;
  box-shadow: var(--shadow-sm);
}

.plan:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-lg);
}

.plan.featured {
  border-color: var(--green);
  background: var(--navy);
  box-shadow: var(--shadow-xl);
  transform: scale(1.03);
}

.plan.featured:hover { transform: scale(1.03) translateY(-6px); }

.plan-ribbon {
  position: absolute;
  top: -1px; left: 50%;
  transform: translateX(-50%);
  background: var(--green);
  color: var(--white);
  font-size: 11px;
  font-weight: 700;
  padding: 5px 18px;
  border-radius: 0 0 12px 12px;
  letter-spacing: 0.5px;
  white-space: nowrap;
  font-family: 'Outfit', sans-serif;
}

.plan-tier {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 20px;
}

.plan.featured .plan-tier { color: rgba(255,255,255,0.5); }

.plan-price {
  display: flex;
  align-items: baseline;
  gap: 2px;
  margin-bottom: 6px;
}

.plan-currency { font-size: 22px; font-weight: 600; color: var(--navy); margin-top: 8px; }
.plan-amount   {
  font-family: 'Playfair Display', serif;
  font-size: 56px;
  font-weight: 700;
  color: var(--navy);
  line-height: 1;
  letter-spacing: -2px;
}

.plan.featured .plan-currency,
.plan.featured .plan-amount { color: var(--white); }

.plan-period { font-size: 13px; color: var(--muted); margin-bottom: 28px; }
.plan.featured .plan-period { color: rgba(255,255,255,0.5); }

.plan-divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: 24px 0;
}
.plan.featured .plan-divider { border-color: rgba(255,255,255,0.1); }

.plan-features {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
}

.plan-features li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  color: var(--muted);
  line-height: 1.5;
}

.plan.featured .plan-features li { color: rgba(255,255,255,0.7); }

.plan-features li::before {
  content: '✓';
  color: var(--green);
  font-size: 12px;
  margin-top: 2px;
  flex-shrink: 0;
  font-weight: 700;
}

.plan-features li.bold {
  color: var(--text);
  font-weight: 600;
}
.plan.featured .plan-features li.bold { color: var(--white); }

.plan-cta {
  display: block;
  text-align: center;
  padding: 14px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  text-decoration: none;
  transition: all 0.2s;
  font-family: 'Outfit', sans-serif;
}

.plan-cta.dark  { background: var(--navy); color: var(--white); }
.plan-cta.dark:hover { background: var(--navy2); }

.plan-cta.green { background: var(--green); color: var(--white); box-shadow: 0 4px 20px rgba(0,168,107,0.4); }
.plan-cta.green:hover { background: #00c07a; }

.plan-cta.outline { background: transparent; color: var(--navy); border: 1.5px solid var(--border2); }
.plan-cta.outline:hover { border-color: var(--green); color: var(--green); }

/* ── TESTIMONIALS ──────────────────────────────────────── */
.testimonials-section {
  padding: 120px 0;
  background: var(--white);
}

.t-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 72px;
}

.t-card {
  background: var(--cream);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 32px;
  transition: all 0.2s;
}

.t-card:hover {
  background: var(--white);
  box-shadow: var(--shadow-md);
  transform: translateY(-3px);
}

.t-stars { color: #f59e0b; font-size: 16px; letter-spacing: 2px; margin-bottom: 16px; }

.t-text {
  font-size: 14.5px;
  color: var(--muted);
  line-height: 1.75;
  margin-bottom: 24px;
  font-style: italic;
}

.t-author {
  display: flex;
  align-items: center;
  gap: 12px;
}

.t-avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 15px;
  color: var(--white);
  flex-shrink: 0;
}

.t-name { font-size: 14px; font-weight: 600; color: var(--navy); }
.t-biz  { font-size: 12.5px; color: var(--muted); }

/* ── FAQ ────────────────────────────────────────────────── */
.faq-section {
  padding: 120px 0;
  background: var(--cream);
}

.faq-wrap {
  max-width: 720px;
  margin: 72px auto 0;
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
  background: var(--white);
  box-shadow: var(--shadow-sm);
}

.faq-item { border-bottom: 1px solid var(--border); }
.faq-item:last-child { border-bottom: none; }

.faq-btn {
  width: 100%;
  background: none;
  border: none;
  padding: 22px 28px;
  text-align: left;
  font-size: 15.5px;
  font-weight: 600;
  color: var(--navy);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  font-family: 'Outfit', sans-serif;
  transition: background 0.15s;
}
.faq-btn:hover { background: var(--cream); }

.faq-plus {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: var(--cream2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--navy);
  flex-shrink: 0;
  transition: all 0.2s;
  line-height: 1;
}

.faq-answer {
  padding: 0 28px;
  font-size: 14.5px;
  color: var(--muted);
  line-height: 1.75;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, padding 0.3s ease;
}

.faq-item.open .faq-answer { max-height: 200px; padding: 0 28px 24px; }
.faq-item.open .faq-plus   { background: var(--green-bg); color: var(--green); transform: rotate(45deg); }

/* ── CTA ────────────────────────────────────────────────── */
.cta-section {
  padding: 120px 0;
  background: var(--navy);
  position: relative;
  overflow: hidden;
  text-align: center;
}

.cta-section::before {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 800px; height: 400px;
  background: radial-gradient(ellipse, rgba(0,208,132,0.08) 0%, transparent 70%);
}

.cta-section h2 {
  font-size: clamp(36px, 5vw, 64px);
  color: var(--white);
  margin-bottom: 20px;
  position: relative;
}

.cta-section p {
  font-size: 18px;
  color: rgba(255,255,255,0.55);
  margin-bottom: 40px;
  font-weight: 300;
  position: relative;
}

.cta-btns {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  position: relative;
}

.cta-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--green);
  color: var(--white);
  padding: 16px 40px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  text-decoration: none;
  transition: all 0.2s;
  box-shadow: 0 4px 24px rgba(0,168,107,0.4);
}
.cta-primary:hover { background: #00c07a; transform: translateY(-2px); }

.cta-ghost {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.08);
  color: var(--white);
  padding: 16px 32px;
  border-radius: 12px;
  font-weight: 500;
  font-size: 15px;
  text-decoration: none;
  border: 1px solid rgba(255,255,255,0.15);
  transition: all 0.2s;
}
.cta-ghost:hover { background: rgba(255,255,255,0.12); }

.cta-note {
  margin-top: 20px;
  font-size: 13px;
  color: rgba(255,255,255,0.35);
  position: relative;
}

/* ── FOOTER ─────────────────────────────────────────────── */
footer {
  background: var(--navy2);
  border-top: 1px solid rgba(255,255,255,0.08);
  padding: 64px 48px 40px;
}

.footer-inner {
  max-width: 1160px;
  margin: 0 auto;
}

.footer-top {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 48px;
  margin-bottom: 48px;
}

.footer-logo-wrap .logo { color: var(--white); }
.footer-about {
  font-size: 14px;
  color: rgba(255,255,255,0.45);
  line-height: 1.7;
  margin-top: 14px;
  max-width: 280px;
}

.footer-col-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.35);
  margin-bottom: 16px;
}

.footer-links { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.footer-links a {
  font-size: 14px;
  color: rgba(255,255,255,0.55);
  text-decoration: none;
  transition: color 0.2s;
}
.footer-links a:hover { color: var(--green2); }

.footer-bottom {
  padding-top: 28px;
  border-top: 1px solid rgba(255,255,255,0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: rgba(255,255,255,0.3);
}

/* ── REVEAL ─────────────────────────────────────────────── */
.reveal {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.65s ease, transform 0.65s ease;
}
.reveal.visible { opacity: 1; transform: none; }

/* ── RESPONSIVE ─────────────────────────────────────────── */
@media (max-width: 1024px) {
  .hero-inner     { grid-template-columns: 1fr; text-align: center; }
  .hero-actions   { justify-content: center; }
  .hero-trust     { justify-content: center; }
  .hero-sub       { margin: 0 auto 40px; }
  .hero-visual    { display: none; }
  .features-layout{ grid-template-columns: 1fr; }
  .demo-grid      { grid-template-columns: 1fr; }
  .vs-grid        { grid-template-columns: 1fr; }
  .footer-top     { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 768px) {
  nav             { padding: 0 20px; }
  .nav-links      { display: none; }
  .hero           { padding: 100px 20px 60px; }
  .container      { padding: 0 20px; }
  .stats-grid     { grid-template-columns: repeat(2,1fr); }
  .stat-item      { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.1); padding: 20px; }
  .steps          { grid-template-columns: 1fr; }
  .steps::before  { display: none; }
  .biz-grid       { grid-template-columns: repeat(2,1fr); }
  .pricing-grid   { grid-template-columns: 1fr; }
  .plan.featured  { transform: none; }
  .t-grid         { grid-template-columns: 1fr; }
  .footer-top     { grid-template-columns: 1fr; }
  .footer-bottom  { flex-direction: column; gap: 8px; text-align: center; }
  footer          { padding: 48px 20px 32px; }
}
</style>
</head>
<body>

<!-- NAV -->
<nav>
  <a href="/" class="logo">fast<span>rill</span></a>
  <ul class="nav-links">
    <li><a href="#how">How it works</a></li>
    <li><a href="#features">Features</a></li>
    <li><a href="#pricing">Pricing</a></li>
    <li><a href="#faq">FAQ</a></li>
    <li><a href="https://fastrill.com/login" class="nav-cta">Start Free →</a></li>
  </ul>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="hero-inner">
    <div>
      <div class="hero-badge">🇮🇳 Built for Indian Service Businesses</div>
      <h1>Your WhatsApp<br><em>Books Appointments</em><br>While You Sleep</h1>
      <p class="hero-sub">Fastrill is an AI receptionist that lives on your WhatsApp. It books appointments, follows up on leads, answers questions — in Hindi, Telugu, Tamil, and 7 more languages. 24/7.</p>
      <div class="hero-actions">
        <a href="https://fastrill.com/signup" class="btn-primary">Start Free Trial →</a>
        <a href="#how" class="btn-ghost">See how it works ↓</a>
      </div>
      <div class="hero-trust">
        <div class="trust-item"><div class="trust-check">✓</div>No app needed</div>
        <div class="trust-item"><div class="trust-check">✓</div>Setup in 10 min</div>
        <div class="trust-item"><div class="trust-check">✓</div>14-day free trial</div>
      </div>
    </div>

    <!-- Phone mockup -->
    <div class="hero-visual">
      <div class="phone-wrap">
        <div class="phone-shadow"></div>
        <div class="phone">
          <div class="phone-screen">
            <div class="wa-header">
              <div class="wa-avatar">P</div>
              <div class="wa-info">
                <div class="wa-name">Priya Beauty Salon</div>
                <div class="wa-status">◈ AI Active — replies instantly</div>
              </div>
            </div>
            <div class="wa-msgs">
              <div class="wa-msg out" style="animation-delay:.1s">Hi, want to book facial 😊</div>
              <div class="wa-msg bot" style="animation-delay:.5s">
                <span class="bot-label">◈ Fastrill AI</span>
                Great! 📅 What date works for your Facial?
              </div>
              <div class="wa-msg out" style="animation-delay:.9s">Tomorrow please</div>
              <div class="wa-msg bot" style="animation-delay:1.3s">
                <span class="bot-label">◈ Fastrill AI</span>
                Tomorrow — Sat, 21 Mar! ⏰ What time?
              </div>
              <div class="wa-msg out" style="animation-delay:1.7s">6pm</div>
              <div class="wa-msg bot" style="animation-delay:2.1s">
                <span class="bot-label">◈ Fastrill AI</span>
                Confirm *Facial* on *Sat 21* at *6 PM*? ✅
              </div>
              <div class="wa-msg out" style="animation-delay:2.5s">Yes! 🙌</div>
              <div class="wa-msg bot" style="animation-delay:2.9s">
                <span class="bot-label">◈ Fastrill AI</span>
                ✅ Booked! See you Saturday 6 PM at Priya Salon 😊
                <div class="wa-time">Just now</div>
              </div>
            </div>
          </div>
        </div>
        <!-- Floating cards -->
        <div class="float-card float-card-1">
          <div class="float-icon green">📅</div>
          <div>
            <div class="float-num">+47%</div>
            <div class="float-label">More bookings</div>
          </div>
        </div>
        <div class="float-card float-card-2">
          <div class="float-icon blue">⚡</div>
          <div>
            <div class="float-num">&lt; 3s</div>
            <div class="float-label">Response time</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- LOGOS / BUILT FOR -->
<div class="logos-strip">
  <div class="logos-inner">
    <span class="logos-label">Built for</span>
    <div class="logos-divider"></div>
    <div class="logos-row">
      <div class="biz-pill">💈 Salons</div>
      <div class="biz-pill">🧖 Spas</div>
      <div class="biz-pill">🏥 Clinics</div>
      <div class="biz-pill">🦷 Dental</div>
      <div class="biz-pill">💪 Fitness</div>
      <div class="biz-pill">💅 Nail Studios</div>
      <div class="biz-pill">🌿 Ayurveda</div>
      <div class="biz-pill">💻 Agencies</div>
    </div>
  </div>
</div>

<!-- STATS -->
<section class="stats-section">
  <div class="container">
    <div class="stats-grid">
      <div class="stat-item reveal">
        <div class="stat-num"><span class="stat-accent">24</span>/7</div>
        <div class="stat-label">AI replies instantly,<br>even at 2 AM</div>
      </div>
      <div class="stat-item reveal">
        <div class="stat-num">10<span class="stat-accent">+</span></div>
        <div class="stat-label">Indian languages<br>supported natively</div>
      </div>
      <div class="stat-item reveal">
        <div class="stat-num"><span class="stat-accent">0</span></div>
        <div class="stat-label">Missed leads while<br>you're busy or away</div>
      </div>
      <div class="stat-item reveal">
        <div class="stat-num">10<span class="stat-accent">m</span></div>
        <div class="stat-label">Setup time, zero<br>technical knowledge</div>
      </div>
    </div>
  </div>
</section>

<!-- HOW IT WORKS -->
<section class="how-section" id="how">
  <div class="container">
    <div class="reveal">
      <div class="section-eyebrow">How it works</div>
      <h2 class="section-h">Set it up once.<br>It works forever.</h2>
      <p class="section-p" style="max-width:480px">Connect, configure, go live. No developer needed. No complicated training. Your AI receptionist is ready in minutes.</p>
    </div>
    <div class="steps">
      <div class="step reveal">
        <div class="step-num">01</div>
        <h3>Connect Your WhatsApp</h3>
        <p>Link your existing WhatsApp Business number through Meta's official API. One click, fully secure. Your number, your conversations — always.</p>
      </div>
      <div class="step reveal">
        <div class="step-num">02</div>
        <h3>Configure Your Business</h3>
        <p>Add services, prices, working hours, and any custom instructions. Write in plain language — the AI understands exactly what you mean.</p>
      </div>
      <div class="step reveal">
        <div class="step-num">03</div>
        <h3>Watch It Convert</h3>
        <p>Every customer who messages gets an instant, intelligent reply. Bookings happen automatically. Leads get followed up. Revenue grows.</p>
      </div>
    </div>
  </div>
</section>

<!-- FEATURES -->
<section class="features-section" id="features">
  <div class="container">
    <div class="reveal">
      <div class="section-eyebrow">Features</div>
      <h2 class="section-h">Everything your front desk<br>does — automated.</h2>
      <p class="section-p" style="max-width:480px">Fastrill isn't a chatbot with fixed responses. It's a full AI system that thinks, remembers, and converts like a trained human.</p>
    </div>
    <div class="features-layout">
      <div class="features-list reveal" id="feature-list">
        <div class="feature-row active" onclick="selectFeature(0, this)">
          <div class="feature-row-icon">📅</div>
          <div class="feature-row-text">
            <div class="feature-row-title">Smart Appointment Booking</div>
            <div class="feature-row-desc">Service → Date → Time → Confirm → Done. Fully automated.</div>
          </div>
        </div>
        <div class="feature-row" onclick="selectFeature(1, this)">
          <div class="feature-row-icon">🧠</div>
          <div class="feature-row-text">
            <div class="feature-row-title">Customer Memory</div>
            <div class="feature-row-desc">Remembers preferences, language, and history across visits.</div>
          </div>
        </div>
        <div class="feature-row" onclick="selectFeature(2, this)">
          <div class="feature-row-icon">💬</div>
          <div class="feature-row-text">
            <div class="feature-row-title">10+ Indian Languages</div>
            <div class="feature-row-desc">Hindi, Telugu, Tamil, Kannada — auto-detected, no setup.</div>
          </div>
        </div>
        <div class="feature-row" onclick="selectFeature(3, this)">
          <div class="feature-row-icon">🎯</div>
          <div class="feature-row-text">
            <div class="feature-row-title">Lead Recovery</div>
            <div class="feature-row-desc">Auto follows up when customers drop mid-booking.</div>
          </div>
        </div>
        <div class="feature-row" onclick="selectFeature(4, this)">
          <div class="feature-row-icon">😤</div>
          <div class="feature-row-text">
            <div class="feature-row-title">Emotion Detection</div>
            <div class="feature-row-desc">Adapts tone when customer is angry, confused, or hesitant.</div>
          </div>
        </div>
        <div class="feature-row" onclick="selectFeature(5, this)">
          <div class="feature-row-icon">🔄</div>
          <div class="feature-row-text">
            <div class="feature-row-title">Handles Interruptions</div>
            <div class="feature-row-desc">Answers side questions mid-booking and resumes smoothly.</div>
          </div>
        </div>
        <div class="feature-row" onclick="selectFeature(6, this)">
          <div class="feature-row-icon">👤</div>
          <div class="feature-row-text">
            <div class="feature-row-title">Human Handoff</div>
            <div class="feature-row-desc">Knows when to stop and notify you. Never gets stuck.</div>
          </div>
        </div>
        <div class="feature-row" onclick="selectFeature(7, this)">
          <div class="feature-row-icon">📊</div>
          <div class="feature-row-text">
            <div class="feature-row-title">Analytics Dashboard</div>
            <div class="feature-row-desc">Conversations, bookings, leads, revenue — all in one place.</div>
          </div>
        </div>
      </div>

      <div class="feature-detail reveal" id="feature-detail">
        <div class="feature-detail-icon" id="fd-icon">📅</div>
        <h3 id="fd-title">Smart Appointment Booking</h3>
        <p id="fd-desc">Customers just message naturally — "I want a facial tomorrow at 6pm" — and Fastrill handles the entire booking flow. It collects the service, confirms the date, checks availability, and creates the booking automatically. No forms, no apps, no friction.</p>
        <span class="feature-detail-tag" id="fd-tag">Core Feature</span>
      </div>
    </div>
  </div>
</section>

<!-- DEMO -->
<section class="demo-section">
  <div class="container">
    <div class="reveal">
      <div class="section-eyebrow">See it in action</div>
      <h2 class="section-h">Real conversations.<br><em>Real intelligence.</em></h2>
      <p class="section-p" style="max-width:480px">Click any scenario to see how Fastrill handles it. This is the actual AI — not scripted responses.</p>
    </div>
    <div class="demo-grid">
      <div class="scenario-list reveal">
        <div class="scenario active" onclick="showConvo('booking', this)">
          <div class="scenario-title">📅 Natural Booking Flow</div>
          <div class="scenario-desc">From "I want a facial" to confirmed booking in 6 messages</div>
        </div>
        <div class="scenario" onclick="showConvo('unknown', this)">
          <div class="scenario-title">❓ Service Not Offered</div>
          <div class="scenario-desc">Customer asks for something you don't do — handled warmly</div>
        </div>
        <div class="scenario" onclick="showConvo('hindi', this)">
          <div class="scenario-title">🇮🇳 Hindi Booking</div>
          <div class="scenario-desc">Customer writes Hindi, AI responds in Hindi perfectly</div>
        </div>
        <div class="scenario" onclick="showConvo('reschedule', this)">
          <div class="scenario-title">🔄 Reschedule Request</div>
          <div class="scenario-desc">Change appointment date with zero friction</div>
        </div>
      </div>

      <div class="chat-window reveal">
        <div class="chat-win-header">
          <div class="wa-avatar" style="width:32px;height:32px;font-size:12px">G</div>
          <div>
            <div style="font-size:13px;font-weight:600;color:#e9edef">Glow Salon</div>
            <div style="font-size:11px;color:#00d084">◈ Fastrill AI Active</div>
          </div>
        </div>
        <div class="chat-win-msgs" id="convo-msgs"></div>
      </div>
    </div>
  </div>
</section>

<!-- FOR WHO -->
<section class="forwho-section">
  <div class="container">
    <div class="reveal" style="text-align:center">
      <div class="section-eyebrow">Built for</div>
      <h2 class="section-h">Every business that runs<br>on appointments</h2>
      <p class="section-p" style="max-width:520px;margin:0 auto">If your customers book with you and message on WhatsApp, Fastrill works for you.</p>
    </div>
    <div class="biz-grid">
      <div class="biz-card reveal"><span class="biz-emoji">💈</span><div class="biz-name">Salons & Parlours</div><p class="biz-desc">Book haircuts, facials, and beauty services automatically</p></div>
      <div class="biz-card reveal"><span class="biz-emoji">🧖</span><div class="biz-name">Spas & Wellness</div><p class="biz-desc">Schedule massages, treatments, and wellness sessions</p></div>
      <div class="biz-card reveal"><span class="biz-emoji">🏥</span><div class="biz-name">Clinics & Doctors</div><p class="biz-desc">Manage patient appointments and follow-ups</p></div>
      <div class="biz-card reveal"><span class="biz-emoji">🦷</span><div class="biz-name">Dental Clinics</div><p class="biz-desc">Auto-book checkups and treatment appointments</p></div>
      <div class="biz-card reveal"><span class="biz-emoji">💪</span><div class="biz-name">Gyms & Fitness</div><p class="biz-desc">Book PT sessions, classes, and consultations</p></div>
      <div class="biz-card reveal"><span class="biz-emoji">💅</span><div class="biz-name">Nail Studios</div><p class="biz-desc">Manage nail art, gel, and extension appointments</p></div>
      <div class="biz-card reveal"><span class="biz-emoji">🌿</span><div class="biz-name">Ayurvedic & Physio</div><p class="biz-desc">Schedule consultations and therapy sessions</p></div>
      <div class="biz-card reveal"><span class="biz-emoji">💻</span><div class="biz-name">Agencies</div><p class="biz-desc">Book demos, discovery calls, and kickoffs</p></div>
    </div>
  </div>
</section>

<!-- VS SECTION -->
<section class="vs-section">
  <div class="container">
    <div class="vs-grid">
      <div class="vs-copy reveal">
        <div class="section-eyebrow">Why Fastrill</div>
        <h2 class="section-h">Not just another<br>WhatsApp bot</h2>
        <p class="section-p">Most tools give you rigid menus and keyword triggers. Fastrill gives you an AI that actually understands your customers.</p>
        <div class="vs-points">
          <div class="vs-point"><div class="vs-check">✓</div>Understands natural language — not just commands</div>
          <div class="vs-point"><div class="vs-check">✓</div>Remembers customers across conversations</div>
          <div class="vs-point"><div class="vs-check">✓</div>Handles any message, not just expected ones</div>
          <div class="vs-point"><div class="vs-check">✓</div>Detects emotion and adapts its tone</div>
          <div class="vs-point"><div class="vs-check">✓</div>Never hallucinates on policies or pricing</div>
          <div class="vs-point"><div class="vs-check">✓</div>Knows when to hand off to a human</div>
        </div>
      </div>
      <div class="vs-table reveal">
        <div class="vs-table-header">
          <div class="vs-col-h them">Other tools</div>
          <div class="vs-col-h us">Fastrill</div>
        </div>
        <div class="vs-row">
          <div class="vs-cell them">Fixed button menus only</div>
          <div class="vs-cell us">Natural conversation</div>
        </div>
        <div class="vs-row">
          <div class="vs-cell them">English only</div>
          <div class="vs-cell us">10+ Indian languages</div>
        </div>
        <div class="vs-row">
          <div class="vs-cell them">Breaks on unexpected messages</div>
          <div class="vs-cell us">Handles anything intelligently</div>
        </div>
        <div class="vs-row">
          <div class="vs-cell them">No customer memory</div>
          <div class="vs-cell us">Remembers every customer</div>
        </div>
        <div class="vs-row">
          <div class="vs-cell them">No emotion awareness</div>
          <div class="vs-cell us">Adapts to customer mood</div>
        </div>
        <div class="vs-row">
          <div class="vs-cell them">Per-message pricing</div>
          <div class="vs-cell us">Flat monthly — unlimited</div>
        </div>
        <div class="vs-row">
          <div class="vs-cell them">Needs developer to setup</div>
          <div class="vs-cell us">10-minute self-setup</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- PRICING -->
<section class="pricing-section" id="pricing">
  <div class="container">
    <div class="reveal" style="text-align:center">
      <div class="section-eyebrow">Pricing</div>
      <h2 class="section-h">Simple, honest pricing</h2>
      <p class="section-p" style="max-width:480px;margin:0 auto">No per-message charges. No hidden fees. One flat monthly price that pays for itself with a single extra booking.</p>
    </div>
    <div class="pricing-grid">
      <div class="plan reveal">
        <div class="plan-tier">Starter</div>
        <div class="plan-price">
          <span class="plan-currency">₹</span>
          <span class="plan-amount">999</span>
        </div>
        <div class="plan-period">per month + GST</div>
        <hr class="plan-divider">
        <ul class="plan-features">
          <li class="bold">1 WhatsApp number</li>
          <li>AI booking automation</li>
          <li>Up to 300 conversations/month</li>
          <li>Basic analytics</li>
          <li>Email support</li>
        </ul>
        <a href="https://fastrill.com/signup" class="plan-cta outline">Get Started</a>
      </div>

      <div class="plan featured reveal">
        <div class="plan-ribbon">Most Popular</div>
        <div class="plan-tier">Growth</div>
        <div class="plan-price">
          <span class="plan-currency" style="color:rgba(255,255,255,0.6)">₹</span>
          <span class="plan-amount" style="color:#fff">1,999</span>
        </div>
        <div class="plan-period">per month + GST</div>
        <hr class="plan-divider">
        <ul class="plan-features">
          <li class="bold">1 WhatsApp number</li>
          <li class="bold">Unlimited conversations</li>
          <li class="bold">Customer memory & personalization</li>
          <li class="bold">Lead recovery automation</li>
          <li>WhatsApp campaigns</li>
          <li>Advanced analytics</li>
          <li>Priority support</li>
        </ul>
        <a href="https://fastrill.com/signup" class="plan-cta green">Start Free Trial →</a>
      </div>

      <div class="plan reveal">
        <div class="plan-tier">Pro</div>
        <div class="plan-price">
          <span class="plan-currency">₹</span>
          <span class="plan-amount">4,999</span>
        </div>
        <div class="plan-period">per month + GST</div>
        <hr class="plan-divider">
        <ul class="plan-features">
          <li class="bold">Up to 3 WhatsApp numbers</li>
          <li class="bold">Everything in Growth</li>
          <li class="bold">Multi-branch management</li>
          <li>Staff availability routing</li>
          <li>Custom AI playbook</li>
          <li>Dedicated onboarding</li>
          <li>SLA-backed support</li>
        </ul>
        <a href="https://fastrill.com/signup" class="plan-cta dark">Contact Us</a>
      </div>
    </div>
    <p style="text-align:center;margin-top:28px;font-size:14px;color:var(--muted)">
      All plans include a <strong>14-day free trial</strong>. No credit card required to start.
    </p>
  </div>
</section>

<!-- TESTIMONIALS -->
<section class="testimonials-section">
  <div class="container">
    <div class="reveal" style="text-align:center">
      <div class="section-eyebrow">Testimonials</div>
      <h2 class="section-h">Business owners love Fastrill</h2>
    </div>
    <div class="t-grid">
      <div class="t-card reveal">
        <div class="t-stars">★★★★★</div>
        <p class="t-text">"Before Fastrill I was losing bookings at night because I couldn't reply on WhatsApp. Now the AI handles everything. My bookings went up 40% in the first month."</p>
        <div class="t-author">
          <div class="t-avatar" style="background:linear-gradient(135deg,#f59e0b,#ef4444)">P</div>
          <div>
            <div class="t-name">Priya Sharma</div>
            <div class="t-biz">Glow Beauty Parlour, Hyderabad</div>
          </div>
        </div>
      </div>
      <div class="t-card reveal">
        <div class="t-stars">★★★★★</div>
        <p class="t-text">"My patients message in Telugu and the AI replies in Telugu perfectly. It books appointments, sends reminders, and never makes mistakes. Unbelievable for this price."</p>
        <div class="t-author">
          <div class="t-avatar" style="background:linear-gradient(135deg,#3b82f6,#0ea5e9)">R</div>
          <div>
            <div class="t-name">Dr. Ravi Kumar</div>
            <div class="t-biz">Apollo Skin Clinic, Vijayawada</div>
          </div>
        </div>
      </div>
      <div class="t-card reveal">
        <div class="t-stars">★★★★★</div>
        <p class="t-text">"We have 3 branches and managing WhatsApp for all was a nightmare. Fastrill handles all three. Our receptionist now only handles in-person walk-ins."</p>
        <div class="t-author">
          <div class="t-avatar" style="background:linear-gradient(135deg,#00d084,#0ea5e9)">S</div>
          <div>
            <div class="t-name">Sneha Reddy</div>
            <div class="t-biz">Studio S Salon, Bangalore</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- FAQ -->
<section class="faq-section" id="faq">
  <div class="container">
    <div class="reveal" style="text-align:center">
      <div class="section-eyebrow">FAQ</div>
      <h2 class="section-h">Honest answers</h2>
    </div>
    <div class="faq-wrap">
      <div class="faq-item">
        <button class="faq-btn" onclick="toggleFaq(this)">
          Do I need to change my WhatsApp number?
          <span class="faq-plus">+</span>
        </button>
        <div class="faq-answer">No. You keep your existing WhatsApp Business number. Fastrill connects through Meta's official Business API. Same number, same app — now with AI.</div>
      </div>
      <div class="faq-item">
        <button class="faq-btn" onclick="toggleFaq(this)">
          Which languages does the AI support?
          <span class="faq-plus">+</span>
        </button>
        <div class="faq-answer">Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, and English. The AI auto-detects which language your customer writes in and responds accordingly. No setup needed.</div>
      </div>
      <div class="faq-item">
        <button class="faq-btn" onclick="toggleFaq(this)">
          Can I take over from the AI and reply manually?
          <span class="faq-plus">+</span>
        </button>
        <div class="faq-answer">Yes, always. In your dashboard, you can toggle AI off for any conversation and reply yourself. The AI pauses until you turn it back on. You are always in control.</div>
      </div>
      <div class="faq-item">
        <button class="faq-btn" onclick="toggleFaq(this)">
          How long does setup take?
          <span class="faq-plus">+</span>
        </button>
        <div class="faq-answer">About 10 minutes. Connect your WhatsApp, add your services and working hours, and you're live. No developer, no technical knowledge required.</div>
      </div>
      <div class="faq-item">
        <button class="faq-btn" onclick="toggleFaq(this)">
          What if the AI doesn't know the answer?
          <span class="faq-plus">+</span>
        </button>
        <div class="faq-answer">It politely tells the customer it will check and connect them with the team. You get notified. The AI never invents answers on topics like refunds, policies, or pricing.</div>
      </div>
      <div class="faq-item">
        <button class="faq-btn" onclick="toggleFaq(this)">
          Is there a free trial?
          <span class="faq-plus">+</span>
        </button>
        <div class="faq-answer">Yes — 14 days free, no credit card required. Full access to all Growth plan features. If you love it, subscribe. If not, you pay nothing and owe nothing.</div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta-section">
  <div class="container" style="position:relative;z-index:1">
    <h2>Your next customer<br>is messaging you <em style="color:var(--green2);font-style:italic">right now</em></h2>
    <p>Don't make them wait. Don't lose them to a competitor who replies faster.<br>Let Fastrill answer instantly, every time, in any language.</p>
    <div class="cta-btns">
      <a href="https://fastrill.com/signup" class="cta-primary">Start Free — No Card Needed →</a>
      <a href="https://wa.me/919999999999" class="cta-ghost">💬 Chat with us on WhatsApp</a>
    </div>
    <p class="cta-note">14-day free trial · Setup in 10 minutes · Cancel anytime</p>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-inner">
    <div class="footer-top">
      <div class="footer-logo-wrap">
        <a href="/" class="logo">fast<span>rill</span></a>
        <p class="footer-about">WhatsApp AI receptionist for Indian service businesses. Books appointments, converts leads, and grows your revenue — 24/7, in any language.</p>
      </div>
      <div>
        <div class="footer-col-title">Product</div>
        <ul class="footer-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#how">How it works</a></li>
          <li><a href="https://fastrill.com/changelog">Changelog</a></li>
        </ul>
      </div>
      <div>
        <div class="footer-col-title">Company</div>
        <ul class="footer-links">
          <li><a href="https://fastrill.com/about">About</a></li>
          <li><a href="https://fastrill.com/blog">Blog</a></li>
          <li><a href="https://fastrill.com/contact">Contact</a></li>
        </ul>
      </div>
      <div>
        <div class="footer-col-title">Legal</div>
        <ul class="footer-links">
          <li><a href="https://fastrill.com/privacy">Privacy Policy</a></li>
          <li><a href="https://fastrill.com/terms">Terms of Service</a></li>
          <li><a href="https://fastrill.com/refund">Refund Policy</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 Fastrill Technologies. All rights reserved.</span>
      <span>Made with ❤️ in India 🇮🇳</span>
    </div>
  </div>
</footer>

<script>
// ── Feature selector ──────────────────────────────────────
const featureData = [
  { icon:'📅', title:'Smart Appointment Booking', desc:'Customers just message naturally — "I want a facial tomorrow at 6pm" — and Fastrill handles the entire flow. Collects service, confirms date, checks availability, creates the booking. No forms, no apps.', tag:'Core Feature' },
  { icon:'🧠', title:'Customer Memory', desc:'Fastrill remembers every customer — their preferred services, favorite time windows, the language they write in, their booking history. Every return visit feels personalized, not generic.', tag:'Personalization' },
  { icon:'💬', title:'10+ Indian Languages', desc:'Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, and English — all detected and replied in automatically. Your customers write what feels natural. Fastrill handles the rest.', tag:'Multilingual' },
  { icon:'🎯', title:'Lead Recovery', desc:'When a customer starts booking but stops mid-flow, Fastrill follows up automatically at the right time with the right message. Recovers bookings that would have been permanently lost.', tag:'Revenue' },
  { icon:'😤', title:'Emotion Detection', desc:'Fastrill detects when a customer is frustrated, confused, or angry — and adapts immediately. Empathy first, solution second. Stops upselling when the customer is upset. Escalates to you when needed.', tag:'AI Intelligence' },
  { icon:'🔄', title:'Handles Interruptions', desc:'Mid-booking, a customer asks "how much is the cleanup?" Fastrill answers it and smoothly returns to the booking flow. Just like a trained receptionist would. No context lost, no awkward restart.', tag:'AI v2' },
  { icon:'👤', title:'Human Handoff', desc:'Fastrill knows when it\'s out of its depth — refund disputes, complex complaints, VIP customer issues. It pauses, notifies you with full context, and waits for you to take over. Smart, not stubborn.', tag:'Smart Escalation' },
  { icon:'📊', title:'Analytics Dashboard', desc:'See all your conversations, bookings, leads, and campaign performance in a single beautiful dashboard. Track AI quality metrics, revenue, and customer trends. Know exactly how your AI is performing.', tag:'Dashboard' }
]

function selectFeature(idx, el) {
  document.querySelectorAll('.feature-row').forEach(r => r.classList.remove('active'))
  el.classList.add('active')
  const f = featureData[idx]
  document.getElementById('fd-icon').textContent  = f.icon
  document.getElementById('fd-title').textContent = f.title
  document.getElementById('fd-desc').textContent  = f.desc
  document.getElementById('fd-tag').textContent   = f.tag
}

// ── Demo conversations ────────────────────────────────────
const convos = {
  booking: [
    { t:'customer', m:'Hi, I want to book a facial 😊' },
    { t:'ai',       m:'Great choice! 📅 What date works for your Facial session?' },
    { t:'customer', m:'Tomorrow evening' },
    { t:'ai',       m:'Tomorrow is Saturday, 21 March! What time works — 5 PM, 6 PM, or 7 PM?' },
    { t:'customer', m:'6pm please' },
    { t:'ai',       m:'Shall I confirm *Facial* on *Sat, 21 Mar* at *6:00 PM*? ✅' },
    { t:'customer', m:'Yes!' },
    { t:'ai',       m:'✅ Booking Confirmed!\n\n📋 Facial\n📅 Saturday, 21 March\n⏰ 6:00 PM\n\nSee you soon at Glow Salon! 😊' }
  ],
  unknown: [
    { t:'customer', m:'Do you do hair straightening?' },
    { t:'ai',       m:"We don't offer hair straightening 😊 But here's what we have:\n\n• Hair Spa — ₹800\n• Cleanup — ₹500\n• Facial — ₹1,200\n\nWould you like to book one of these?" },
    { t:'customer', m:'Ok, hair spa then!' },
    { t:'ai',       m:'Perfect! 📅 What date works for your Hair Spa?' },
    { t:'customer', m:'This Saturday' },
    { t:'ai',       m:'Saturday, 21 March! ⏰ What time works for you?' }
  ],
  hindi: [
    { t:'customer', m:'Namaste! Kal ka appointment mil sakta hai?' },
    { t:'ai',       m:'Namaste! 😊 Bilkul. Kal kaunsi service chahiye?' },
    { t:'customer', m:'Facial chahiye' },
    { t:'ai',       m:'Kal Saturday, 21 March — kaunsa time suit karega?' },
    { t:'customer', m:'Shaam ko 5 baje' },
    { t:'ai',       m:'Confirm karu — *Facial* on *Sat 21 Mar* at *5:00 PM*? ✅' },
    { t:'customer', m:'Haan, theek hai!' },
    { t:'ai',       m:'✅ Booking ho gayi!\n\n📋 Facial\n📅 Saturday, 21 March\n⏰ 5:00 PM\n\nGlow Salon mein milte hain! 😊' }
  ],
  reschedule: [
    { t:'customer', m:'I need to reschedule my appointment' },
    { t:'ai',       m:'Of course! 😊 What new date works for you?' },
    { t:'customer', m:'Next Monday' },
    { t:'ai',       m:'Monday, 23 March — what time works?' },
    { t:'customer', m:'3pm' },
    { t:'ai',       m:'✅ Rescheduled!\n\n📋 Hair Spa\n📅 Monday, 23 March\n⏰ 3:00 PM\n\nAll updated! See you at Glow Salon 😊' }
  ]
}

function showConvo(type, el) {
  document.querySelectorAll('.scenario').forEach(s => s.classList.remove('active'))
  el.classList.add('active')
  const container = document.getElementById('convo-msgs')
  container.innerHTML = ''
  convos[type].forEach((msg, i) => {
    setTimeout(() => {
      const div = document.createElement('div')
      div.className = 'cw-msg ' + (msg.t === 'customer' ? 'customer' : 'ai')
      if (msg.t === 'ai') {
        div.innerHTML = '<span class="cw-ai-label">◈ Fastrill AI</span>' + msg.m.replace(/\n/g,'<br>')
      } else {
        div.textContent = msg.m
      }
      container.appendChild(div)
      container.scrollTop = container.scrollHeight
    }, i * 420)
  })
}
showConvo('booking', document.querySelector('.scenario'))

// ── FAQ ───────────────────────────────────────────────────
function toggleFaq(btn) {
  const item = btn.parentElement
  const open = item.classList.contains('open')
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'))
  if (!open) item.classList.add('open')
}

// ── Scroll reveal ─────────────────────────────────────────
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) }
  })
}, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' })

document.querySelectorAll('.reveal').forEach((el, i) => {
  // Stagger grid items
  if (el.closest('.biz-grid, .t-grid, .pricing-grid')) {
    const siblings = Array.from(el.parentElement.children)
    el.style.transitionDelay = (siblings.indexOf(el) % 4) * 0.08 + 's'
  }
  obs.observe(el)
})
</script>
</body>
</html>
