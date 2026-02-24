export default function Home() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Instrument+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        :root {
          --green: #00c47d;
          --green-light: #e8fdf4;
          --green-mid: #b3f0d8;
          --gray-900: #111827;
          --gray-700: #374151;
          --gray-600: #4b5563;
          --gray-500: #6b7280;
          --gray-300: #d1d5db;
          --gray-100: #f3f4f6;
          --gray-50: #f9fafb;
          --white: #ffffff;
          --border: #e5e7eb;
        }

        body {
          background: var(--white) !important;
          color: var(--gray-900) !important;
          font-family: 'Instrument Sans', sans-serif;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }

        .container { max-width: 1120px; margin: 0 auto; padding: 0 28px; }

        /* NAV */
        .nav {
          position: sticky; top: 0; z-index: 100;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }
        .nav-inner {
          max-width: 1120px; margin: 0 auto; padding: 0 28px;
          height: 64px; display: flex; align-items: center; justify-content: space-between;
        }
        .nav-logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 22px; letter-spacing: -0.5px; color: var(--gray-900); text-decoration: none; }
        .nav-logo span { color: var(--green); }
        .nav-links { display: flex; align-items: center; gap: 4px; list-style: none; }
        .nav-links a { font-size: 14px; color: var(--gray-500); text-decoration: none; padding: 6px 14px; border-radius: 7px; transition: all 0.15s; font-weight: 500; }
        .nav-links a:hover { color: var(--gray-900); background: var(--gray-100); }
        .nav-cta { background: var(--green) !important; color: #fff !important; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px !important; padding: 9px 20px !important; border-radius: 8px !important; box-shadow: 0 2px 8px rgba(0,196,125,0.3); }
        .nav-cta:hover { opacity: 0.88 !important; }
        .nav-mobile-cta { display: none; background: var(--green); color: #fff; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px; padding: 9px 18px; border-radius: 8px; text-decoration: none; }

        /* HERO */
        .hero-wrap { background: linear-gradient(160deg, #f0fdf8 0%, #ffffff 55%); border-bottom: 1px solid var(--border); }
        .hero { max-width: 1120px; margin: 0 auto; padding: 88px 28px 80px; display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
        .hero-left { order: 0; }
        .hero-visual { order: 1; }

        .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: var(--green-light); border: 1px solid var(--green-mid); border-radius: 100px; padding: 5px 14px; font-size: 12px; font-weight: 600; color: #007a50; margin-bottom: 28px; }
        .hero-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }

        .hero-title { font-family: 'Syne', sans-serif; font-size: clamp(36px, 4.5vw, 58px); font-weight: 800; line-height: 1.05; letter-spacing: -2px; color: var(--gray-900); margin-bottom: 22px; }
        .hero-title .g { color: var(--green); }
        .hero-title .o { color: transparent; -webkit-text-stroke: 2px var(--green-mid); }

        .hero-sub { font-size: 17px; line-height: 1.8; color: var(--gray-500); font-weight: 400; margin-bottom: 36px; max-width: 460px; }

        .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
        .btn-primary { display: inline-flex; align-items: center; gap: 8px; background: var(--green); color: #fff; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; padding: 13px 28px; border-radius: 10px; text-decoration: none; transition: all 0.2s; box-shadow: 0 4px 14px rgba(0,196,125,0.35); }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,196,125,0.4); }
        .btn-ghost { display: inline-flex; align-items: center; gap: 8px; color: var(--gray-600); font-size: 15px; font-weight: 500; text-decoration: none; padding: 13px 20px; border-radius: 10px; border: 1.5px solid var(--border); transition: all 0.2s; }
        .btn-ghost:hover { color: var(--gray-900); border-color: var(--gray-300); }

        .hero-trust { margin-top: 32px; display: flex; align-items: center; gap: 12px; }
        .hero-trust-text { font-size: 12.5px; color: var(--gray-500); }
        .hero-trust-avatars { display: flex; }
        .hero-trust-avatars span { width: 28px; height: 28px; border-radius: 50%; border: 2px solid #fff; margin-left: -8px; display: block; }
        .hero-trust-avatars span:first-child { margin-left: 0; background: linear-gradient(135deg, #00c47d, #0099ff); }
        .hero-trust-avatars span:nth-child(2) { background: linear-gradient(135deg, #7c3aed, #00c47d); }
        .hero-trust-avatars span:nth-child(3) { background: linear-gradient(135deg, #f59e0b, #ef4444); }

        /* HERO CARD */
        .hero-card-wrap { display: flex; flex-direction: column; gap: 12px; }
        .pill-inline { display: inline-flex; align-items: center; gap: 8px; background: #fff; border: 1px solid var(--border); border-radius: 100px; padding: 8px 16px; font-size: 12px; font-weight: 600; color: var(--gray-700); align-self: flex-start; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }

        .hero-card { background: #fff; border: 1px solid var(--border); border-radius: 20px; padding: 24px; box-shadow: 0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04); }
        .hero-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid var(--gray-100); }
        .wa-icon { width: 36px; height: 36px; border-radius: 10px; background: #25d366; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 2px 8px rgba(37,211,102,0.25); }
        .hero-card-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; color: var(--gray-900); }
        .hero-card-sub { font-size: 11.5px; color: var(--gray-500); margin-top: 2px; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); margin-left: auto; box-shadow: 0 0 6px var(--green); }

        .chat-bubble { padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.55; margin-bottom: 8px; max-width: 88%; }
        .chat-incoming { background: var(--gray-50); color: var(--gray-700); border: 1px solid var(--border); border-bottom-left-radius: 4px; }
        .chat-outgoing { background: var(--green-light); border: 1px solid var(--green-mid); color: #005c3a; margin-left: auto; border-bottom-right-radius: 4px; }
        .intent-badge { display: inline-flex; align-items: center; gap: 6px; background: var(--green-light); border: 1px solid var(--green-mid); border-radius: 6px; padding: 5px 10px; font-size: 11px; color: #007a50; font-weight: 600; margin: 8px 0 12px; }

        .metrics-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 12px; }
        .metric-box { background: var(--gray-50); border: 1px solid var(--border); border-radius: 10px; padding: 12px; text-align: center; }
        .metric-val { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 20px; color: var(--green); }
        .metric-label { font-size: 10px; color: var(--gray-500); margin-top: 2px; letter-spacing: 0.5px; text-transform: uppercase; }

        /* LOGOS */
        .logos-strip { padding: 24px 28px; border-bottom: 1px solid var(--border); background: var(--gray-50); }
        .logos-inner { max-width: 1120px; margin: 0 auto; display: flex; align-items: center; gap: 40px; flex-wrap: wrap; }
        .logos-label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--gray-300); font-weight: 600; white-space: nowrap; }
        .logos-items { display: flex; align-items: center; gap: 32px; flex-wrap: wrap; }
        .logos-item { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px; color: var(--gray-300); }

        /* SECTIONS */
        .section { padding: 100px 28px; }
        .section-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: var(--green); margin-bottom: 16px; }
        .section-eyebrow::before { content: ''; display: block; width: 20px; height: 2px; background: var(--green); border-radius: 2px; }
        .section-title { font-family: 'Syne', sans-serif; font-size: clamp(28px, 3.5vw, 48px); font-weight: 800; line-height: 1.08; letter-spacing: -1.5px; color: var(--gray-900); margin-bottom: 16px; }
        .section-title .o { color: transparent; -webkit-text-stroke: 2px var(--green-mid); }
        .section-title .g { color: var(--green); }
        .section-sub { font-size: 16px; line-height: 1.75; color: var(--gray-500); max-width: 520px; }

        /* HOW */
        .how-section { background: var(--gray-50); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .how-grid { max-width: 1120px; margin: 56px auto 0; display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
        .how-step { background: #fff; padding: 36px 28px; border-right: 1px solid var(--border); transition: background 0.2s; }
        .how-step:last-child { border-right: none; }
        .how-step:hover { background: var(--green-light); }
        .how-num { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 40px; letter-spacing: -2px; color: var(--green-mid); line-height: 1; margin-bottom: 20px; }
        .how-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; color: var(--gray-900); margin-bottom: 10px; }
        .how-text { font-size: 14px; line-height: 1.7; color: var(--gray-500); }

        /* INTENT */
        .intent-section { padding: 100px 28px; background: #fff; }
        .intent-inner { max-width: 1120px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .intent-visual { background: var(--gray-50); border: 1px solid var(--border); border-radius: 20px; padding: 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
        .intent-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--gray-300); font-weight: 700; margin-bottom: 16px; }
        .intent-msg { background: #fff; border: 1px solid var(--border); border-radius: 10px; padding: 14px; font-size: 14px; color: var(--gray-700); line-height: 1.65; margin-bottom: 14px; }
        .intent-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
        .intent-tag { padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 600; }
        .tag-green { background: var(--green-light); color: #007a50; border: 1px solid var(--green-mid); }
        .tag-blue { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
        .tag-orange { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
        .intent-response { background: var(--green-light); border: 1px solid var(--green-mid); border-radius: 10px; padding: 14px; font-size: 13px; color: #005c3a; line-height: 1.65; }
        .intent-response-label { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--green); font-weight: 700; margin-bottom: 8px; }
        .intent-points { list-style: none; display: flex; flex-direction: column; gap: 20px; }
        .intent-point { display: flex; gap: 14px; align-items: flex-start; }
        .intent-point-icon { width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0; background: var(--green-light); border: 1px solid var(--green-mid); display: flex; align-items: center; justify-content: center; font-size: 16px; margin-top: 2px; }
        .intent-point-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; color: var(--gray-900); margin-bottom: 4px; }
        .intent-point-text { font-size: 14px; color: var(--gray-500); line-height: 1.65; }

        /* FEATURES */
        .features-section { padding: 100px 28px; background: var(--gray-50); border-top: 1px solid var(--border); }
        .features-grid { max-width: 1120px; margin: 48px auto 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .feat-card { background: #fff; border: 1px solid var(--border); border-radius: 16px; padding: 28px; transition: box-shadow 0.2s, border-color 0.2s, transform 0.15s; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .feat-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.08); border-color: var(--green-mid); transform: translateY(-2px); }
        .feat-card.large { grid-column: span 2; }
        .feat-icon { width: 44px; height: 44px; border-radius: 12px; background: var(--green-light); border: 1px solid var(--green-mid); display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 18px; }
        .feat-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; color: var(--gray-900); margin-bottom: 8px; }
        .feat-text { font-size: 14px; line-height: 1.7; color: var(--gray-500); }

        /* STATS — green bg strip */
        .stats-section { padding: 72px 28px; background: var(--green); }
        .stats-grid { max-width: 1120px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); }
        .stat-item { padding: 28px; text-align: center; border-right: 1px solid rgba(255,255,255,0.2); }
        .stat-item:last-child { border-right: none; }
        .stat-val { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 44px; letter-spacing: -2px; color: #fff; line-height: 1; margin-bottom: 8px; }
        .stat-val span { font-size: 28px; color: rgba(255,255,255,0.6); }
        .stat-label { font-size: 13px; color: rgba(255,255,255,0.75); }

        /* TESTIMONIALS */
        .testimonials-section { padding: 100px 28px; background: #fff; }
        .testimonials-grid { max-width: 1120px; margin: 56px auto 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .testimonial-card { background: var(--gray-50); border: 1px solid var(--border); border-radius: 16px; padding: 28px; transition: box-shadow 0.2s, transform 0.15s; }
        .testimonial-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.07); transform: translateY(-2px); }
        .testimonial-stars { color: #f59e0b; font-size: 14px; margin-bottom: 14px; letter-spacing: 2px; }
        .testimonial-text { font-size: 15px; line-height: 1.75; color: var(--gray-600); margin-bottom: 20px; }
        .testimonial-author { display: flex; align-items: center; gap: 12px; }
        .testimonial-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--green), #0099ff); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 15px; color: #fff; }
        .testimonial-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; color: var(--gray-900); }
        .testimonial-role { font-size: 12px; color: var(--gray-500); margin-top: 2px; }

        /* PRICING */
        .pricing-section { padding: 100px 28px; background: var(--gray-50); border-top: 1px solid var(--border); }
        .pricing-grid { max-width: 1120px; margin: 56px auto 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; align-items: start; }
        .plan-card { background: #fff; border: 1px solid var(--border); border-radius: 20px; padding: 36px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); transition: box-shadow 0.2s; }
        .plan-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.08); }
        .plan-card.featured { background: var(--gray-900); border-color: var(--gray-900); position: relative; box-shadow: 0 12px 40px rgba(0,0,0,0.2); }
        .plan-badge { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); background: var(--green); color: #fff; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; padding: 4px 14px; border-radius: 100px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,196,125,0.4); }
        .plan-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: var(--gray-500); margin-bottom: 16px; }
        .plan-card.featured .plan-name { color: rgba(255,255,255,0.45); }
        .plan-price { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 48px; letter-spacing: -2px; color: var(--gray-900); line-height: 1; margin-bottom: 4px; }
        .plan-card.featured .plan-price { color: #fff; }
        .plan-price sup { font-size: 22px; font-weight: 700; }
        .plan-price-note { font-size: 13px; color: var(--gray-500); margin-bottom: 28px; }
        .plan-card.featured .plan-price-note { color: rgba(255,255,255,0.4); }
        .plan-divider { height: 1px; background: var(--border); margin-bottom: 24px; }
        .plan-card.featured .plan-divider { background: rgba(255,255,255,0.1); }
        .plan-features { list-style: none; display: flex; flex-direction: column; gap: 12px; margin-bottom: 28px; }
        .plan-feature { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: var(--gray-600); }
        .plan-card.featured .plan-feature { color: rgba(255,255,255,0.7); }
        .plan-feature-check { width: 18px; height: 18px; border-radius: 50%; background: var(--green-light); border: 1px solid var(--green-mid); display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; font-size: 10px; color: var(--green); font-weight: 700; }
        .plan-card.featured .plan-feature-check { background: rgba(0,196,125,0.15); border-color: rgba(0,196,125,0.3); color: #4ade80; }
        .plan-btn { display: block; width: 100%; text-align: center; padding: 13px; border-radius: 10px; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; text-decoration: none; transition: all 0.2s; }
        .plan-btn-outline { border: 1.5px solid var(--border); color: var(--gray-700); background: #fff; }
        .plan-btn-outline:hover { border-color: var(--green); color: var(--green); }
        .plan-btn-filled { background: var(--green); color: #fff; border: none; box-shadow: 0 3px 12px rgba(0,196,125,0.4); }
        .plan-btn-filled:hover { opacity: 0.9; transform: translateY(-1px); }

        /* CTA */
        .cta-section { padding: 60px 28px 100px; background: #fff; border-top: 1px solid var(--border); }
        .cta-inner { max-width: 1120px; margin: 0 auto; background: var(--gray-900); border-radius: 24px; padding: 80px; text-align: center; position: relative; overflow: hidden; }
        .cta-inner::before { content: ''; position: absolute; top: -80px; left: 50%; transform: translateX(-50%); width: 500px; height: 300px; border-radius: 50%; background: radial-gradient(circle, rgba(0,196,125,0.15) 0%, transparent 70%); pointer-events: none; }
        .cta-title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: clamp(28px, 4vw, 50px); letter-spacing: -1.5px; color: #fff; margin-bottom: 16px; position: relative; }
        .cta-title span { color: var(--green); }
        .cta-sub { font-size: 16px; color: rgba(255,255,255,0.5); margin-bottom: 40px; position: relative; line-height: 1.7; }
        .cta-actions { display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; position: relative; }
        .cta-note { margin-top: 20px; font-size: 12px; color: rgba(255,255,255,0.25); }

        /* FOOTER */
        .footer { border-top: 1px solid var(--border); padding: 48px 28px; background: #fff; }
        .footer-inner { max-width: 1120px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px; }
        .footer-logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 20px; color: var(--gray-900); text-decoration: none; }
        .footer-logo span { color: var(--green); }
        .footer-links { display: flex; gap: 24px; }
        .footer-links a { font-size: 13px; color: var(--gray-500); text-decoration: none; transition: color 0.2s; font-weight: 500; }
        .footer-links a:hover { color: var(--gray-900); }
        .footer-copy { font-size: 13px; color: var(--gray-300); }

        /* RESPONSIVE */
        @media (max-width: 1024px) { .how-grid { grid-template-columns: repeat(2, 1fr); } .how-step { border-bottom: 1px solid var(--border); } }
        @media (max-width: 900px) {
          .hero { grid-template-columns: 1fr; padding: 60px 28px; gap: 48px; }
          .intent-inner { grid-template-columns: 1fr; gap: 40px; }
          .features-grid { grid-template-columns: 1fr 1fr; }
          .feat-card.large { grid-column: span 2; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .stat-item:nth-child(2) { border-right: none; }
          .stat-item:nth-child(3), .stat-item:nth-child(4) { border-top: 1px solid rgba(255,255,255,0.2); }
          .pricing-grid { grid-template-columns: 1fr; max-width: 440px; margin-left: auto; margin-right: auto; }
          .testimonials-grid { grid-template-columns: 1fr; }
          .nav-links { display: none; }
          .nav-mobile-cta { display: inline-flex; }
          .cta-inner { padding: 48px 32px; }
        }
        @media (max-width: 600px) {
          .hero { padding: 48px 20px; gap: 36px; }
          .features-grid { grid-template-columns: 1fr; }
          .feat-card.large { grid-column: span 1; }
          .how-grid { grid-template-columns: 1fr; }
          .cta-inner { padding: 36px 24px; }
          .stat-item { padding: 24px 16px; } .stat-val { font-size: 34px; }
          .section { padding: 72px 20px; }
        }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-inner">
          <a href="/" className="nav-logo">fast<span>rill</span></a>
          <ul className="nav-links">
            <li><a href="#how">How it works</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="/signup" className="nav-cta">Get Started →</a></li>
          </ul>
          <a href="/signup" className="nav-mobile-cta">Get Started →</a>
        </div>
      </nav>

      {/* HERO */}
      <div className="hero-wrap">
        <div className="hero">
          <div className="hero-left">
            <div className="hero-badge"><span className="hero-badge-dot" />Now live — WhatsApp Business API</div>
            <h1 className="hero-title">
              Reply Smarter.<br />
              Grow <span className="g">Faster.</span><br />
              <span className="o">Convert More.</span>
            </h1>
            <p className="hero-sub">Fastrill detects real customer intent in real time and responds with the right message — not just a keyword match. The only WhatsApp automation built around how customers actually think.</p>
            <div className="hero-actions">
              <a href="/signup" className="btn-primary">Start for free →</a>
              <a href="#how" className="btn-ghost">See how it works ↓</a>
            </div>
            <div className="hero-trust">
              <div className="hero-trust-avatars"><span /><span /><span /></div>
              <p className="hero-trust-text">Trusted by 500+ businesses across India</p>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card-wrap">
              <div className="pill-inline"><span style={{color:"var(--green)"}}>⚡</span> Intent detected in &lt;200ms</div>
              <div className="hero-card">
                <div className="hero-card-header">
                  <div className="wa-icon">💬</div>
                  <div><div className="hero-card-title">Live Inbox</div><div className="hero-card-sub">Powered by intent engine</div></div>
                  <div className="status-dot" />
                </div>
                <div className="chat-bubble chat-incoming">Hi, I saw your ad. What's the price for the gold plan? Does it include support?</div>
                <div className="intent-badge">🎯 Intent: <strong>Pricing inquiry + Support query</strong></div>
                <div className="chat-bubble chat-outgoing">Hey! Gold plan is ₹2,999/mo and yes — includes 24/7 priority support. Want me to send a full comparison? 🙌</div>
                <div className="metrics-row">
                  <div className="metric-box"><div className="metric-val">94<span style={{fontSize:"13px",color:"#9ca3af"}}>%</span></div><div className="metric-label">Response rate</div></div>
                  <div className="metric-box"><div className="metric-val" style={{color:"#2563eb"}}>1.2<span style={{fontSize:"13px",color:"#9ca3af"}}>s</span></div><div className="metric-label">Avg reply time</div></div>
                  <div className="metric-box"><div className="metric-val" style={{color:"#d97706"}}>3.8<span style={{fontSize:"13px",color:"#9ca3af"}}>x</span></div><div className="metric-label">Conversion</div></div>
                </div>
              </div>
              <div className="pill-inline" style={{alignSelf:"flex-end"}}><span style={{color:"#d97706"}}>📈</span> 3.8x more conversions on avg</div>
            </div>
          </div>
        </div>
      </div>

      {/* LOGOS */}
      <div className="logos-strip">
        <div className="logos-inner">
          <span className="logos-label">Works with</span>
          <div className="logos-items">
            {["WhatsApp Business","Meta API","Shopify","WooCommerce","Razorpay","Zoho CRM"].map(l=><span key={l} className="logos-item">{l}</span>)}
          </div>
        </div>
      </div>

      {/* HOW */}
      <section className="how-section section" id="how">
        <div className="container">
          <div className="section-eyebrow">How it works</div>
          <h2 className="section-title">Live in minutes,<br /><span className="o">not months.</span></h2>
          <p className="section-sub">Connect once. Fastrill handles everything from intent detection to the perfect reply.</p>
        </div>
        <div className="how-grid">
          {[
            {n:"01",title:"Connect your WhatsApp",text:"Use our embedded signup to link your WhatsApp Business account directly. No developer needed, takes under 3 minutes."},
            {n:"02",title:"Set your business context",text:"Tell Fastrill about your products, pricing, and FAQs. Our engine learns your business and builds a smart reply brain."},
            {n:"03",title:"Intent engine goes live",text:"Every incoming message is analysed for real intent — not just keywords. Customers get accurate, human-sounding replies instantly."},
            {n:"04",title:"Watch conversions grow",text:"Track reply rates, conversion metrics, and customer satisfaction from one clean dashboard. Improve over time."},
          ].map(s=>(
            <div key={s.n} className="how-step">
              <div className="how-num">{s.n}</div>
              <div className="how-title">{s.title}</div>
              <div className="how-text">{s.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* INTENT */}
      <section className="intent-section" id="intent">
        <div className="intent-inner">
          <div className="intent-visual">
            <div className="intent-label">Intent Engine — Live Example</div>
            <div className="intent-msg">"Hey I ordered yesterday but haven't received any update. Also wanted to know if I can change the color before it ships?"</div>
            <div className="intent-tags">
              <span className="intent-tag tag-orange">🚚 Order status query</span>
              <span className="intent-tag tag-blue">✏️ Modification request</span>
              <span className="intent-tag tag-green">😟 Frustration detected</span>
            </div>
            <div className="intent-response">
              <div className="intent-response-label">Auto-generated reply</div>
              Hey! Sorry for the wait — your order is currently being packed and will ship by tonight. And yes, color changes are possible before dispatch! I've flagged it for our team right now. 🙌
            </div>
          </div>
          <div>
            <div className="section-eyebrow">The Fastrill difference</div>
            <h2 className="section-title">Intent over<br /><span className="g">keywords.</span></h2>
            <p className="section-sub" style={{marginBottom:"36px"}}>Every other tool matches words. Fastrill understands meaning — and responds like your best sales rep would.</p>
            <ul className="intent-points">
              {[
                {icon:"🧠",title:"Real-time intent detection",text:"Messages are analysed semantically, not by trigger words. Multi-intent messages get multi-part answers."},
                {icon:"😊",title:"Sentiment awareness",text:"Frustrated customers get empathetic replies. Excited customers get enthusiastic ones. Context always matches."},
                {icon:"⚡",title:"Sub-second response",text:"Replies go out in under 2 seconds. No customer left waiting, no lead going cold."},
              ].map(p=>(
                <li key={p.title} className="intent-point">
                  <div className="intent-point-icon">{p.icon}</div>
                  <div><div className="intent-point-title">{p.title}</div><div className="intent-point-text">{p.text}</div></div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section" id="features">
        <div className="container">
          <div className="section-eyebrow">Everything you need</div>
          <h2 className="section-title">Built for businesses<br /><span className="o">that move fast.</span></h2>
        </div>
        <div className="features-grid">
          {[
            {icon:"🔗",title:"Embedded WhatsApp Signup",text:"Connect your WhatsApp Business account in one click. No API keys, no developer handoffs — everything done inside Fastrill.",large:true},
            {icon:"📋",title:"Pre-Built Templates",text:"High-converting message templates for every scenario — abandoned cart, order updates, lead follow-up, and more."},
            {icon:"📣",title:"Campaign Manager",text:"Broadcast targeted messages to segmented audiences and track open rates, replies, and conversions in real time."},
            {icon:"🤖",title:"Smart Automation",text:"Build no-code workflows that trigger the right message at the right moment, 24/7."},
            {icon:"📊",title:"Analytics Dashboard",text:"See what's working. Track reply rates, conversion funnels, and customer satisfaction scores."},
            {icon:"🏷️",title:"Contact Tagging",text:"Tag and segment contacts by behaviour, intent, or stage in the funnel. Personalise every message."},
          ].map(f=>(
            <div key={f.title} className={`feat-card${f.large?" large":""}`}>
              <div className="feat-icon">{f.icon}</div>
              <div className="feat-title">{f.title}</div>
              <div className="feat-text">{f.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <div className="stats-section">
        <div className="stats-grid">
          {[{val:"94",unit:"%",label:"Average reply rate"},{val:"3.8",unit:"x",label:"Increase in conversions"},{val:"<2",unit:"s",label:"Average response time"},{val:"500",unit:"+",label:"Businesses using Fastrill"}].map(s=>(
            <div key={s.label} className="stat-item">
              <div className="stat-val">{s.val}<span>{s.unit}</span></div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TESTIMONIALS */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-eyebrow">Loved by businesses</div>
          <h2 className="section-title">Real results,<br /><span className="o">real businesses.</span></h2>
        </div>
        <div className="testimonials-grid">
          {[
            {init:"R",name:"Rahul M.",role:"D2C Fashion Brand, Bangalore",text:"We went from replying to 30% of WhatsApp inquiries to 100% — automatically. Our sales literally doubled in 6 weeks."},
            {init:"P",name:"Priya S.",role:"Online Coaching Business, Hyderabad",text:"The intent detection is scary good. It caught that a lead was comparing us with a competitor and replied with exactly the right pitch. Closed the deal."},
            {init:"A",name:"Arjun T.",role:"Local Electronics Store, Chennai",text:"I used to spend 3 hours a day on WhatsApp. Now Fastrill handles 90% of it and I just step in for the tricky ones. Game changer."},
          ].map(t=>(
            <div key={t.name} className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <div className="testimonial-text">"{t.text}"</div>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{t.init}</div>
                <div><div className="testimonial-name">{t.name}</div><div className="testimonial-role">{t.role}</div></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing-section" id="pricing">
        <div className="container">
          <div className="section-eyebrow">Pricing</div>
          <h2 className="section-title">Simple pricing.<br /><span className="o">No surprises.</span></h2>
          <p className="section-sub">Start free, scale when you're ready. All plans include the intent engine.</p>
        </div>
        <div className="pricing-grid">
          {[
            {name:"Starter",price:"Free",note:"Forever free",features:["Up to 500 conversations/mo","Intent engine included","5 automation workflows","Pre-built templates","Basic analytics"],btn:"Get started free",btnStyle:"outline",href:"/signup"},
            {name:"Growth",price:"2,999",note:"per month",featured:true,features:["Unlimited conversations","Advanced intent detection","Unlimited workflows","Campaign manager","CRM integrations","Priority support"],btn:"Start free trial",btnStyle:"filled",href:"/signup"},
            {name:"Scale",price:"7,999",note:"per month",features:["Everything in Growth","Multi-agent inbox","Custom AI training","Dedicated account manager","API access","White-label option"],btn:"Talk to us",btnStyle:"outline",href:"/signup"},
          ].map(plan=>(
            <div key={plan.name} className={`plan-card${plan.featured?" featured":""}`}>
              {plan.featured&&<div className="plan-badge">Most Popular</div>}
              <div className="plan-name">{plan.name}</div>
              <div className="plan-price">{plan.price==="Free"?"Free":<><sup>₹</sup>{plan.price}</>}</div>
              <div className="plan-price-note">{plan.note}</div>
              <div className="plan-divider" />
              <ul className="plan-features">{plan.features.map(f=><li key={f} className="plan-feature"><span className="plan-feature-check">✓</span>{f}</li>)}</ul>
              <a href={plan.href} className={`plan-btn plan-btn-${plan.btnStyle}`}>{plan.btn}</a>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2 className="cta-title">Your competitors are already<br />on <span>WhatsApp.</span></h2>
          <p className="cta-sub">Be the one who actually replies — intelligently, instantly, at scale.</p>
          <div className="cta-actions">
            <a href="/signup" className="btn-primary" style={{fontSize:"16px",padding:"15px 36px"}}>Create free account →</a>
          </div>
          <p className="cta-note">No credit card required · Free forever plan · Setup in 3 minutes</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <a href="/" className="footer-logo">fast<span>rill</span></a>
          <div className="footer-links">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
          </div>
          <p className="footer-copy">© {new Date().getFullYear()} Fastrill. All rights reserved.</p>
        </div>
      </footer>
    </>
  )
}
