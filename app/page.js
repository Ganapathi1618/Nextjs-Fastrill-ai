export default function Home() {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#111827" }}>
      
      {/* Hero Section */}
      <section style={{
        padding: "80px 20px",
        textAlign: "center",
        backgroundColor: "#f9fafb"
      }}>
        <h1 style={{ fontSize: "42px", marginBottom: "20px" }}>
          Fastrill
        </h1>
        <p style={{ fontSize: "18px", marginBottom: "30px" }}>
          WhatsApp Automation Platform for Modern Businesses
        </p>

        <a href="/signup">
          <button style={{
            padding: "14px 28px",
            backgroundColor: "#111827",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: "pointer"
          }}>
            Get Started
          </button>
        </a>
      </section>

      {/* Features Section */}
      <section style={{
        padding: "60px 20px",
        maxWidth: "1000px",
        margin: "0 auto"
      }}>
        <h2 style={{ textAlign: "center", marginBottom: "40px" }}>
          Why Fastrill?
        </h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "30px"
        }}>
          <div>
            <h3>Embedded WhatsApp Signup</h3>
            <p>Connect your WhatsApp Business account directly inside Fastrill.</p>
          </div>

          <div>
            <h3>Pre-Built Message Templates</h3>
            <p>Use high-converting message templates tailored for your business.</p>
          </div>

          <div>
            <h3>Campaign Management</h3>
            <p>Launch and manage WhatsApp campaigns from one dashboard.</p>
          </div>

          <div>
            <h3>Automation Ready</h3>
            <p>Send automated replies and scale conversations effortlessly.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: "60px 20px",
        textAlign: "center",
        backgroundColor: "#111827",
        color: "white"
      }}>
        <h2 style={{ marginBottom: "20px" }}>
          Start Automating Your WhatsApp Today
        </h2>
        <a href="/signup">
          <button style={{
            padding: "14px 28px",
            backgroundColor: "white",
            color: "#111827",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: "pointer"
          }}>
            Create Free Account
          </button>
        </a>
      </section>

      {/* Footer */}
      <footer style={{
        padding: "30px 20px",
        textAlign: "center",
        backgroundColor: "#f3f4f6"
      }}>
        <p>© {new Date().getFullYear()} Fastrill. All rights reserved.</p>

        <div style={{ marginTop: "10px" }}>
          <a href="/privacy" style={{ marginRight: "15px" }}>Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
        </div>
      </footer>

    </div>
  )
}
