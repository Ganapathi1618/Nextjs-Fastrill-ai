import "./globals.css"

export const metadata = {
  title: "Fastrill – WhatsApp Growth Engine",
  description: "Automate WhatsApp replies with real-time intent detection",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
