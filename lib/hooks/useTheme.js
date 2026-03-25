import { useState, useEffect } from "react"

export function useTheme() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem("fastrill-theme")
    if (saved) setDark(saved === "dark")
  }, [])

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    localStorage.setItem("fastrill-theme", next ? "dark" : "light")
  }

  return { dark, toggleTheme }
}
