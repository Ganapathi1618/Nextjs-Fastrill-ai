"use client"
import { createContext, useContext, useState, useEffect } from "react"

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDarkMode(saved === "dark")
  }, [])

  const toggleTheme = () => {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem("fastrill-theme", next ? "dark" : "light")
  }

  const t = darkMode ? {
    bg: "#0a0a0f", sidebar: "#0f0f17", border: "rgba(255,255,255,0.06)",
    card: "#0f0f17", cardBorder: "rgba(255,255,255,0.07)",
    text: "#e8e8f0", textMuted: "rgba(255,255,255,0.4)", textFaint: "rgba(255,255,255,0.2)",
    navActive: "rgba(0,196,125,0.1)", navActiveBorder: "rgba(0,196,125,0.2)",
    navActiveText: "#00c47d", navText: "rgba(255,255,255,0.45)",
    inputBg: "rgba(255,255,255,0.04)", chipBg: "rgba(255,255,255,0.02)",
    chipBorder: "rgba(255,255,255,0.05)", topbar: "#0f0f17",
    msgCustomer: "rgba(255,255,255,0.07)", scrollbar: "rgba(255,255,255,0.08)",
  } : {
    bg: "#f4f5f7", sidebar: "#ffffff", border: "rgba(0,0,0,0.07)",
    card: "#ffffff", cardBorder: "rgba(0,0,0,0.08)",
    text: "#111827", textMuted: "rgba(0,0,0,0.45)", textFaint: "rgba(0,0,0,0.25)",
    navActive: "rgba(0,180,115,0.08)", navActiveBorder: "rgba(0,180,115,0.2)",
    navActiveText: "#00935a", navText: "rgba(0,0,0,0.45)",
    inputBg: "rgba(0,0,0,0.03)", chipBg: "rgba(0,0,0,0.02)",
    chipBorder: "rgba(0,0,0,0.05)", topbar: "#ffffff",
    msgCustomer: "rgba(0,0,0,0.06)", scrollbar: "rgba(0,0,0,0.1)",
  }

  const accent = darkMode ? "#00c47d" : "#00935a"

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme, t, accent }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
