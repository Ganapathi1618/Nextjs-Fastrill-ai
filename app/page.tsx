export default function Home() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: #080c10;
          color: #e8edf2;
          font-family: 'DM Sans', sans-serif;
          overflow-x: hidden;
        }

        /* ── UTILS ── */
        .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
        .green { color: #00e5a0; }
        .outline-text {
          color: transparent;
          -webkit-text-stroke: 1.5px rgba(255,255,255,0.25);
        }

        /* ── NAV ── */
        .nav {
          position: sticky; top: 0; z-index: 100;
          backdrop-filter: blur(16px);
          background: rgba(8,12,16,0.85);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .nav-inner {
          max-width: 1100px; margin: 0 auto; padding: 0 24px;
          height: 64px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .nav-logo {
          font-family: 'Syne', sans-serif;
          font-weight: 800; font-size: 22px; letter-spacing: -0.5px;
          color: #fff; text-decoration: none;
        }
        .nav-links {
          display: flex; align-items: center; gap: 32px;
          list-style: none;
        }
        .nav-links a {
          font-size: 14px; color: rgba(255,255,255,0.45);
          text-decoration: none; transition: color 0.2s;
        }
        .nav-links a:hover { color: #fff; }
        .nav-cta {
          display: inline-flex; align-items: center;
          background: #00e5a0; color: #080c10 !important;
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 13px !important; letter-spacing: 0.3px;
          padding: 9px 20px; border-radius: 8px;
          text-decoration: none; transition: opacity 0.2s, transform 0.15s;
        }
        .nav-cta:hover { opacity: 0.88 !important; transform: translateY(-1px); }

        /* ── HERO ── */
        .hero {
          padding: 120px 24px 100px;
          max-width: 1100px; margin: 0 auto;
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 60px; align-items: center;
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(0,229,160,0.08);
          border: 1px solid rgba(0,229,160,0.2);
          border-radius: 100px;
          padding: 6px 14px;
          font-size: 12px; font-weight: 500; letter-spacing: 0.5px;
          color: #00e5a0; margin-bottom: 28px;
        }
        .hero-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #00e5a0;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        .hero-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(40px, 5vw, 64px);
          font-weight: 800; line-height: 1.0;
          letter-spacing: -2.5px; color: #fff;
          margin-bottom: 24px;
        }
        .hero-sub {
          font-size: 17px; line-height: 1.7;
          color: rgba(255,255,255,0.45);
          font-weight: 300; margin-bottom: 40px;
          max-width: 460px;
        }
        .hero-actions { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; }
        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: #00e5a0; color: #080c10;
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 15px; padding: 14px 28px; border-radius: 10px;
          text-decoration: none; transition: opacity 0.2s, transform 0.15s;
          border: none; cursor: pointer;
        }
        .btn-primary:hover { opacity: 0.88; transform: translateY(-2px); }
        .btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          color: rgba(255,255,255,0.55); font-size: 15px;
          text-decoration: none; transition: color 0.2s;
        }
        .btn-ghost:hover { color: #fff; }
        .hero-trust {
          margin-top: 40px;
          display: flex; align-items: center; gap: 12px;
        }
        .hero-trust-text {
          font-size: 12px; color: rgba(255,255,255,0.3);
          font-weight: 300; letter-spacing: 0.3px;
        }
        .hero-trust-avatars { display: flex; }
        .hero-trust-avatars span {
          width: 28px; height: 28px; border-radius: 50%;
          border: 2px solid #080c10;
          background: linear-gradient(135deg, #00e5a0, #0099ff);
          margin-left: -8px; display: block;
        }
        .hero-trust-avatars span:first-child { margin-left: 0; }
        .hero-trust-avatars span:nth-child(2) { background: linear-gradient(135deg, #7c3aed, #00e5a0); }
        .hero-trust-avatars span:nth-child(3) { background: linear-gradient(135deg, #f59e0b, #ef4444); }

        /* Hero visual */
        .hero-visual {
          position: relative;
        }
        .hero-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px; padding: 28px;
          backdrop-filter: blur(10px);
        }
        .hero-card-header {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .wa-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: #25d366;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
        }
        .hero-card-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; }
        .hero-card-sub { font-size: 12px; color: rgba(255,255,255,0.35); margin-top: 2px; }
        .status-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #00e5a0; margin-left: auto;
          box-shadow: 0 0 8px #00e5a0;
        }
        .chat-bubble {
          padding: 10px 14px; border-radius: 12px;
          font-size: 13px; line-height: 1.5; margin-bottom: 8px;
          max-width: 85%;
        }
        .chat-incoming {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.7);
          border-bottom-left-radius: 4px;
        }
        .chat-outgoing {
          background: rgba(0,229,160,0.12);
          border: 1px solid rgba(0,229,160,0.2);
          color: rgba(255,255,255,0.85);
          margin-left: auto;
          border-bottom-right-radius: 4px;
        }
        .intent-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(0,229,160,0.08);
          border: 1px solid rgba(0,229,160,0.15);
          border-radius: 6px; padding: 6px 10px;
          font-size: 11px; color: #00e5a0; font-weight: 500;
          margin: 12px 0 16px;
        }
        .metrics-row {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 12px; margin-top: 16px;
        }
        .metric-box {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px; padding: 12px;
          text-align: center;
        }
        .metric-val {
          font-family: 'Syne', sans-serif;
          font-weight: 800; font-size: 20px;
          color: #00e5a0;
        }
        .metric-label {
          font-size: 10px; color: rgba(255,255,255,0.3);
          margin-top: 2px; letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .floating-pill {
          position: absolute;
          background: rgba(8,12,16,0.9);
          border: 1px solid rgba(0,229,160,0.2);
          border-radius: 100px; padding: 8px 14px;
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 500;
          backdrop-filter: blur(10px);
        }
        .pill-top { top: -20px; right: 20px; }
        .pill-bottom { bottom: -20px; left: 20px; }

        /* ── LOGOS ── */
        .logos-strip {
          border-top: 1px solid rgba(255,255,255,0.05);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding: 28px 24px;
        }
        .logos-inner {
          max-width: 1100px; margin: 0 auto;
          display: flex; align-items: center; gap: 40px; flex-wrap: wrap;
        }
        .logos-label {
          font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
          color: rgba(255,255,255,0.2); font-weight: 500; white-space: nowrap;
        }
        .logos-items { display: flex; align-items: center; gap: 36px; flex-wrap: wrap; }
        .logos-item {
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 15px; color: rgba(255,255,255,0.15);
          letter-spacing: -0.5px;
        }

        /* ── SECTION SHARED ── */
        .section { padding: 100px 24px; }
        .section-eyebrow {
          font-size: 11px; font-weight: 500; letter-spacing: 3px;
          text-transform: uppercase; color: #00e5a0;
          margin-bottom: 16px;
          display: flex; align-items: center; gap: 10px;
        }
        .section-eyebrow::before {
          content: ''; display: block;
          width: 24px; height: 1px; background: #00e5a0; opacity: 0.5;
        }
        .section-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(32px, 4vw, 52px);
          font-weight: 800; line-height: 1.05;
          letter-spacing: -1.5px; color: #fff;
          margin-bottom: 16px;
        }
        .section-sub {
          font-size: 16px; line-height: 1.7;
          color: rgba(255,255,255,0.4); font-weight: 300;
          max-width: 520px;
        }

        /* ── HOW IT WORKS ── */
        .how-grid {
          max-width: 1100px; margin: 60px auto 0;
          display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 2px; background: rgba(255,255,255,0.05);
          border-radius: 20px; overflow: hidden;
        }
        .how-step {
          background: #080c10; padding: 36px 32px;
          position: relative; transition: background 0.2s;
        }
        .how-step:hover { background: rgba(0,229,160,0.03); }
        .how-num {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 48px; letter-spacing: -2px;
          color: transparent; -webkit-text-stroke: 1px rgba(0,229,160,0.2);
          line-height: 1; margin-bottom: 20px;
        }
        .how-title {
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 17px; color: #fff; margin-bottom: 10px;
        }
        .how-text { font-size: 14px; line-height: 1.7; color: rgba(255,255,255,0.4); font-weight: 300; }

        /* ── FEATURES ── */
        .features-section { padding: 100px 24px; }
        .features-header { max-width: 1100px; margin: 0 auto 60px; }
        .features-grid {
          max-width: 1100px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .feat-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; padding: 32px;
          transition: border-color 0.2s, background 0.2s;
          position: relative; overflow: hidden;
        }
        .feat-card::before {
          content: ''; position: absolute;
          top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,229,160,0.3), transparent);
          opacity: 0; transition: opacity 0.3s;
        }
        .feat-card:hover { border-color: rgba(0,229,160,0.15); background: rgba(0,229,160,0.02); }
        .feat-card:hover::before { opacity: 1; }
        .feat-icon {
          width: 44px; height: 44px; border-radius: 12px;
          background: rgba(0,229,160,0.1);
          border: 1px solid rgba(0,229,160,0.15);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; margin-bottom: 20px;
        }
        .feat-title {
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 16px; color: #fff; margin-bottom: 10px;
        }
        .feat-text { font-size: 14px; line-height: 1.7; color: rgba(255,255,255,0.4); font-weight: 300; }
        .feat-card.large { grid-column: span 2; }

        /* ── INTENT ENGINE ── */
        .intent-section {
          padding: 100px 24px;
          background: radial-gradient(ellipse at 50% 0%, rgba(0,229,160,0.05) 0%, transparent 60%);
        }
        .intent-inner {
          max-width: 1100px; margin: 0 auto;
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 80px; align-items: center;
        }
        .intent-visual {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; padding: 28px;
        }
        .intent-label {
          font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
          color: rgba(255,255,255,0.25); margin-bottom: 16px;
        }
        .intent-msg {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px; padding: 14px;
          font-size: 14px; color: rgba(255,255,255,0.6);
          line-height: 1.6; margin-bottom: 16px;
        }
        .intent-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
        .intent-tag {
          padding: 5px 12px; border-radius: 100px;
          font-size: 11px; font-weight: 500; letter-spacing: 0.3px;
        }
        .tag-green { background: rgba(0,229,160,0.1); color: #00e5a0; border: 1px solid rgba(0,229,160,0.2); }
        .tag-blue { background: rgba(0,153,255,0.1); color: #5bb8ff; border: 1px solid rgba(0,153,255,0.2); }
        .tag-orange { background: rgba(245,158,11,0.1); color: #fbbf24; border: 1px solid rgba(245,158,11,0.2); }
        .intent-response {
          background: rgba(0,229,160,0.06);
          border: 1px solid rgba(0,229,160,0.15);
          border-radius: 10px; padding: 14px;
          font-size: 13px; color: rgba(255,255,255,0.7); line-height: 1.6;
        }
        .intent-response-label {
          font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase;
          color: #00e5a0; font-weight: 600; margin-bottom: 8px;
        }
        .intent-points { list-style: none; display: flex; flex-direction: column; gap: 16px; }
        .intent-point { display: flex; gap: 14px; align-items: flex-start; }
        .intent-point-icon {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(0,229,160,0.08); border: 1px solid rgba(0,229,160,0.15);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; flex-shrink: 0; margin-top: 2px;
        }
        .intent-point-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; color: #fff; margin-bottom: 4px; }
        .intent-point-text { font-size: 14px; color: rgba(255,255,255,0.4); font-weight: 300; line-height: 1.6; }

        /* ── STATS ── */
        .stats-section {
          padding: 80px 24px;
          border-top: 1px solid rgba(255,255,255,0.05);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .stats-grid {
          max-width: 1100px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 0;
        }
        .stat-item {
          padding: 32px; text-align: center;
          border-right: 1px solid rgba(255,255,255,0.05);
        }
        .stat-item:last-child { border-right: none; }
        .stat-val {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 44px; letter-spacing: -2px;
          color: #fff; line-height: 1;
          margin-bottom: 8px;
        }
        .stat-val span { color: #00e5a0; }
        .stat-label { font-size: 13px; color: rgba(255,255,255,0.35); font-weight: 300; }

        /* ── PRICING ── */
        .pricing-section { padding: 100px 24px; }
        .pricing-header { max-width: 1100px; margin: 0 auto 60px; }
        .pricing-grid {
          max-width: 1100px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 20px; align-items: start;
        }
        .plan-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; padding: 36px;
          transition: border-color 0.2s;
        }
        .plan-card.featured {
          background: rgba(0,229,160,0.04);
          border-color: rgba(0,229,160,0.25);
          position: relative;
        }
        .plan-badge {
          position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
          background: #00e5a0; color: #080c10;
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 11px; letter-spacing: 1px; text-transform: uppercase;
          padding: 4px 14px; border-radius: 100px; white-space: nowrap;
        }
        .plan-name {
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 14px; letter-spacing: 1px; text-transform: uppercase;
          color: rgba(255,255,255,0.4); margin-bottom: 16px;
        }
        .plan-price {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 48px; letter-spacing: -2px; color: #fff;
          line-height: 1; margin-bottom: 4px;
        }
        .plan-price sup { font-size: 24px; letter-spacing: 0; font-weight: 600; }
        .plan-price-note { font-size: 13px; color: rgba(255,255,255,0.3); margin-bottom: 28px; }
        .plan-divider { height: 1px; background: rgba(255,255,255,0.06); margin-bottom: 24px; }
        .plan-features { list-style: none; display: flex; flex-direction: column; gap: 12px; margin-bottom: 28px; }
        .plan-feature { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: rgba(255,255,255,0.5); }
        .plan-feature::before { content: '✓'; color: #00e5a0; font-weight: 700; flex-shrink: 0; }
        .plan-btn {
          display: block; width: 100%; text-align: center;
          padding: 13px; border-radius: 10px;
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 14px; text-decoration: none; transition: all 0.2s;
        }
        .plan-btn-outline {
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.6);
        }
        .plan-btn-outline:hover { border-color: rgba(255,255,255,0.3); color: #fff; }
        .plan-btn-filled {
          background: #00e5a0; color: #080c10;
        }
        .plan-btn-filled:hover { opacity: 0.88; transform: translateY(-1px); }

        /* ── TESTIMONIALS ── */
        .testimonials-section { padding: 100px 24px; }
        .testimonials-header { max-width: 1100px; margin: 0 auto 60px; }
        .testimonials-grid {
          max-width: 1100px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .testimonial-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; padding: 28px;
        }
        .testimonial-stars { color: #00e5a0; font-size: 14px; margin-bottom: 16px; }
        .testimonial-text {
          font-size: 15px; line-height: 1.75;
          color: rgba(255,255,255,0.55); font-weight: 300;
          margin-bottom: 20px; font-style: italic;
        }
        .testimonial-author { display: flex; align-items: center; gap: 12px; }
        .testimonial-avatar {
          width: 38px; height: 38px; border-radius: 50%;
          background: linear-gradient(135deg, #00e5a0, #0099ff);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 14px; color: #080c10;
        }
        .testimonial-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; color: #fff; }
        .testimonial-role { font-size: 12px; color: rgba(255,255,255,0.3); margin-top: 2px; }

        /* ── CTA BANNER ── */
        .cta-section { padding: 60px 24px 100px; }
        .cta-inner {
          max-width: 1100px; margin: 0 auto;
          background: rgba(0,229,160,0.04);
          border: 1px solid rgba(0,229,160,0.15);
          border-radius: 24px; padding: 72px;
          text-align: center;
          position: relative; overflow: hidden;
        }
        .cta-inner::before {
          content: ''; position: absolute;
          top: -100px; left: 50%; transform: translateX(-50%);
          width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(0,229,160,0.1) 0%, transparent 70%);
          pointer-events: none;
        }
        .cta-title {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: clamp(32px, 4vw, 52px);
          letter-spacing: -1.5px; color: #fff;
          margin-bottom: 16px; position: relative;
        }
        .cta-sub {
          font-size: 16px; color: rgba(255,255,255,0.4);
          font-weight: 300; margin-bottom: 40px; position: relative;
        }
        .cta-actions { display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; position: relative; }
        .cta-note { margin-top: 16px; font-size: 12px; color: rgba(255,255,255,0.2); }

        /* ── FOOTER ── */
        .footer {
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 48px 24px;
        }
        .footer-inner {
          max-width: 1100px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 20px;
        }
        .footer-logo {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 20px; color: #fff; text-decoration: none;
        }
        .footer-links { display: flex; gap: 24px; }
        .footer-links a { font-size: 13px; color: rgba(255,255,255,0.3); text-decoration: none; transition: color 0.2s; }
        .footer-links a:hover { color: rgba(255,255,255,0.7); }
        .footer-copy { font-size: 13px; color: rgba(255,255,255,0.2); }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .hero { grid-template-columns: 1fr; gap: 60px; }
          .hero-visual { order: -1; }
          .intent-inner { grid-template-columns: 1fr; }
          .features-grid { grid-template-columns: 1fr 1fr; }
          .feat-card.large { grid-column: span 1; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .stat-item:nth-child(2) { border-right: none; }
          .stat-item:nth-child(3), .stat-item:nth-child(4) { border-top: 1px solid rgba(255,255,255,0.05); }
          .pricing-grid { grid-template-columns: 1fr; max-width: 440px; }
          .testimonials-grid { grid-template-columns: 1fr; max-width: 500px; }
          .nav-links { display: none; }
        }
        @media (max-width: 560px) {
          .features-grid { grid-template-columns: 1fr; }
          .how-grid { grid-template-columns: 1fr; }
          .cta-inner { padding: 40px 24px; }
          .metrics-row { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-inner">
          <a href="/" className="nav-logo">fast<span className="green">rill</span></a>
          <ul className="nav-links">
            <li><a href="#how">How it works</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="/signup" className="nav-cta">Get Started →</a></li>
          </ul>
        </div>
      </nav>

      {/* HERO */}
      <section>
        <div className="hero">
          <div className="hero-left">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              Now live — WhatsApp Business API
            </div>
            <h1 className="hero-title">
              Reply Smarter.<br />
              Grow <span className="green">Faster.</span><br />
              <span className="outline-text">Convert More.</span>
            </h1>
            <p className="hero-sub">
              Fastrill detects real customer intent in real time and responds with the right message — not just a keyword match. The only WhatsApp automation built around how customers actually think.
            </p>
            <div className="hero-actions">
              <a href="/signup" className="btn-primary">Start for free →</a>
              <a href="#how" className="btn-ghost">See how it works ↓</a>
            </div>
            <div className="hero-trust">
              <div className="hero-trust-avatars">
                <span /><span /><span />
              </div>
              <p className="hero-trust-text">Trusted by 500+ businesses across India</p>
            </div>
          </div>

          <div className="hero-visual">
            <div className="floating-pill pill-top">
              <span style={{color:"#00e5a0"}}>⚡</span> Intent detected in &lt;200ms
            </div>
            <div className="hero-card">
              <div className="hero-card-header">
                <div className="wa-icon">💬</div>
                <div>
                  <div className="hero-card-title">Live Inbox</div>
                  <div className="hero-card-sub">Powered by intent engine</div>
                </div>
                <div className="status-dot" />
              </div>
              <div className="chat-bubble chat-incoming">
                Hi, I saw your ad. What's the price for the gold plan? Does it include support?
              </div>
              <div className="intent-badge">
                🎯 Intent: <strong>Pricing inquiry + Support query</strong>
              </div>
              <div className="chat-bubble chat-outgoing">
                Hey! Gold plan is ₹2,999/mo and yes — includes 24/7 priority support. Want me to send a full comparison? 🙌
              </div>
              <div className="metrics-row">
                <div className="metric-box">
                  <div className="metric-val">94<span style={{fontSize:"14px",color:"rgba(255,255,255,0.4)"}}>%</span></div>
                  <div className="metric-label">Response rate</div>
                </div>
                <div className="metric-box">
                  <div className="metric-val" style={{color:"#5bb8ff"}}>1.2<span style={{fontSize:"14px",color:"rgba(255,255,255,0.4)"}}>s</span></div>
                  <div className="metric-label">Avg reply time</div>
                </div>
                <div className="metric-box">
                  <div className="metric-val" style={{color:"#fbbf24"}}>3.8<span style={{fontSize:"14px",color:"rgba(255,255,255,0.4)"}}>x</span></div>
                  <div className="metric-label">Conversion</div>
                </div>
              </div>
            </div>
            <div className="floating-pill pill-bottom">
              <span style={{color:"#fbbf24"}}>📈</span> 3.8x more conversions on avg
            </div>
          </div>
        </div>
      </section>

      {/* LOGOS */}
      <div className="logos-strip">
        <div className="logos-inner">
          <span className="logos-label">Works with</span>
          <div className="logos-items">
            <span className="logos-item">WhatsApp Business</span>
            <span className="logos-item">Meta API</span>
            <span className="logos-item">Shopify</span>
            <span className="logos-item">WooCommerce</span>
            <span className="logos-item">Razorpay</span>
            <span className="logos-item">Zoho CRM</span>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="section" id="how">
        <div className="container">
          <div className="section-eyebrow">How it works</div>
          <h2 className="section-title">Live in minutes,<br /><span className="outline-text">not months.</span></h2>
          <p className="section-sub">Connect once. Fastrill handles everything from intent detection to the perfect reply.</p>
        </div>
        <div className="how-grid">
          {[
            { n: "01", title: "Connect your WhatsApp", text: "Use our embedded signup to link your WhatsApp Business account directly. No developer needed, takes under 3 minutes." },
            { n: "02", title: "Set your business context", text: "Tell Fastrill about your products, pricing, and FAQs. Our engine learns your business and builds a smart reply brain." },
            { n: "03", title: "Intent engine goes live", text: "Every incoming message is analysed for real intent — not just keywords. Customers get accurate, human-sounding replies instantly." },
            { n: "04", title: "Watch conversions grow", text: "Track reply rates, conversion metrics, and customer satisfaction from one clean dashboard. Improve over time." },
          ].map((s) => (
            <div key={s.n} className="how-step">
              <div className="how-num">{s.n}</div>
              <div className="how-title">{s.title}</div>
              <div className="how-text">{s.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* INTENT ENGINE */}
      <section className="intent-section" id="intent">
        <div className="intent-inner">
          <div className="intent-visual">
            <div className="intent-label">Intent Engine — Live Example</div>
            <div className="intent-msg">
              "Hey I ordered yesterday but haven't received any update. Also wanted to know if I can change the color before it ships?"
            </div>
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
            <h2 className="section-title">Intent over<br /><span className="green">keywords.</span></h2>
            <p className="section-sub" style={{marginBottom: "36px"}}>
              Every other tool matches words. Fastrill understands meaning — and responds like your best sales rep would.
            </p>
            <ul className="intent-points">
              {[
                { icon: "🧠", title: "Real-time intent detection", text: "Messages are analysed semantically, not by trigger words. Multi-intent messages get multi-part answers." },
                { icon: "😊", title: "Sentiment awareness", text: "Frustrated customers get empathetic replies. Excited customers get enthusiastic ones. Context always matches." },
                { icon: "⚡", title: "Sub-second response", text: "Replies go out in under 2 seconds. No customer left waiting, no lead going cold." },
              ].map((p) => (
                <li key={p.title} className="intent-point">
                  <div className="intent-point-icon">{p.icon}</div>
                  <div>
                    <div className="intent-point-title">{p.title}</div>
                    <div className="intent-point-text">{p.text}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section" id="features">
        <div className="features-header">
          <div className="section-eyebrow">Everything you need</div>
          <h2 className="section-title">Built for businesses<br /><span className="outline-text">that move fast.</span></h2>
        </div>
        <div className="features-grid">
          {[
            { icon: "🔗", title: "Embedded WhatsApp Signup", text: "Connect your WhatsApp Business account in one click. No API keys, no developer handoffs — everything done inside Fastrill.", large: true },
            { icon: "📋", title: "Pre-Built Templates", text: "High-converting message templates for every scenario — abandoned cart, order updates, lead follow-up, and more." },
            { icon: "📣", title: "Campaign Manager", text: "Broadcast targeted messages to segmented audiences and track open rates, replies, and conversions in real time." },
            { icon: "🤖", title: "Smart Automation", text: "Build no-code workflows that trigger the right message at the right moment, 24/7." },
            { icon: "📊", title: "Analytics Dashboard", text: "See what's working. Track reply rates, conversion funnels, and customer satisfaction scores." },
            { icon: "🏷️", title: "Contact Tagging", text: "Tag and segment contacts by behaviour, intent, or stage in the funnel. Personalise every message." },
          ].map((f) => (
            <div key={f.title} className={`feat-card${f.large ? " large" : ""}`}>
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
          {[
            { val: "94", unit: "%", label: "Average reply rate" },
            { val: "3.8", unit: "x", label: "Increase in conversions" },
            { val: "<2", unit: "s", label: "Average response time" },
            { val: "500", unit: "+", label: "Businesses using Fastrill" },
          ].map((s) => (
            <div key={s.label} className="stat-item">
              <div className="stat-val">{s.val}<span>{s.unit}</span></div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TESTIMONIALS */}
      <section className="testimonials-section">
        <div className="testimonials-header">
          <div className="section-eyebrow">Loved by businesses</div>
          <h2 className="section-title">Real results,<br /><span className="outline-text">real businesses.</span></h2>
        </div>
        <div className="testimonials-grid">
          {[
            { init: "R", name: "Rahul M.", role: "D2C Fashion Brand, Bangalore", text: "We went from replying to 30% of WhatsApp inquiries to 100% — automatically. Our sales literally doubled in 6 weeks." },
            { init: "P", name: "Priya S.", role: "Online Coaching Business, Hyderabad", text: "The intent detection is scary good. It caught that a lead was comparing us with a competitor and replied with exactly the right pitch. Closed the deal." },
            { init: "A", name: "Arjun T.", role: "Local Electronics Store, Chennai", text: "I used to spend 3 hours a day on WhatsApp. Now Fastrill handles 90% of it and I just step in for the tricky ones. Game changer." },
          ].map((t) => (
            <div key={t.name} className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <div className="testimonial-text">"{t.text}"</div>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{t.init}</div>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing-section" id="pricing">
        <div className="pricing-header">
          <div className="section-eyebrow">Pricing</div>
          <h2 className="section-title">Simple pricing.<br /><span className="outline-text">No surprises.</span></h2>
          <p className="section-sub">Start free, scale when you're ready. All plans include the intent engine.</p>
        </div>
        <div className="pricing-grid">
          {[
            {
              name: "Starter", price: "Free", note: "Forever free",
              features: ["Up to 500 conversations/mo", "Intent engine included", "5 automation workflows", "Pre-built templates", "Basic analytics"],
              btn: "Get started free", btnStyle: "outline", href: "/signup",
            },
            {
              name: "Growth", price: "₹2,999", note: "per month", featured: true,
              features: ["Unlimited conversations", "Advanced intent detection", "Unlimited workflows", "Campaign manager", "CRM integrations", "Priority support"],
              btn: "Start free trial", btnStyle: "filled", href: "/signup",
            },
            {
              name: "Scale", price: "₹7,999", note: "per month",
              features: ["Everything in Growth", "Multi-agent inbox", "Custom AI training", "Dedicated account manager", "API access", "White-label option"],
              btn: "Talk to us", btnStyle: "outline", href: "/signup",
            },
          ].map((plan) => (
            <div key={plan.name} className={`plan-card${plan.featured ? " featured" : ""}`}>
              {plan.featured && <div className="plan-badge">Most Popular</div>}
              <div className="plan-name">{plan.name}</div>
              <div className="plan-price">
                {plan.price === "Free" ? "Free" : <><sup>₹</sup>{plan.price.replace("₹","")}</>}
              </div>
              <div className="plan-price-note">{plan.note}</div>
              <div className="plan-divider" />
              <ul className="plan-features">
                {plan.features.map((f) => <li key={f} className="plan-feature">{f}</li>)}
              </ul>
              <a href={plan.href} className={`plan-btn plan-btn-${plan.btnStyle}`}>{plan.btn}</a>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2 className="cta-title">Your competitors are<br />already on WhatsApp.</h2>
          <p className="cta-sub">Be the one who actually replies — intelligently, instantly, at scale.</p>
          <div className="cta-actions">
            <a href="/signup" className="btn-primary" style={{fontSize:"16px", padding:"16px 36px"}}>Create free account →</a>
          </div>
          <p className="cta-note">No credit card required · Free forever plan · Setup in 3 minutes</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <a href="/" className="footer-logo">fast<span className="green">rill</span></a>
          <div className="footer-links">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
          </div>
          <p className="footer-copy">© {new Date().getFullYear()} Fastrill. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
