import "./globals.css"
import { ToastProvider } from "@/components/Toast"

export const metadata = {
  title: "Fastrill",
  description: "WhatsApp AI Receptionist"
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}