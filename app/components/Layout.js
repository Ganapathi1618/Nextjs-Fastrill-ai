export default function Layout({ children }) {
  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f9fafb",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "420px",
        background: "white",
        padding: "40px",
        borderRadius: "12px",
        boxShadow: "0 15px 30px rgba(0,0,0,0.08)"
      }}>
        {children}
      </div>
    </div>
  )
}
