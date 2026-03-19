"use client"
import { useEffect, useState } from "react"

// ── TOAST STORE ──────────────────────────────────────────────────
// Simple global store — no Redux, no context needed
let listeners = []
let toasts    = []
let nextId    = 0

function notify(listeners) {
  listeners.forEach(function(fn) { fn([].concat(toasts)) })
}

export const toast = {
  success: function(message, duration) {
    addToast("success", message, duration || 3000)
  },
  error: function(message, duration) {
    addToast("error", message, duration || 4000)
  },
  info: function(message, duration) {
    addToast("info", message, duration || 3000)
  },
  loading: function(message) {
    return addToast("loading", message, 0) // 0 = stays until dismissed
  },
  dismiss: function(id) {
    toasts = toasts.filter(function(t) { return t.id !== id })
    notify(listeners)
  }
}

function addToast(type, message, duration) {
  var id = ++nextId
  toasts = toasts.concat([{ id: id, type: type, message: message }])
  notify(listeners)
  if (duration > 0) {
    setTimeout(function() { toast.dismiss(id) }, duration)
  }
  return id
}

// ── TOAST COMPONENT ──────────────────────────────────────────────
export default function Toaster() {
  var [items, setItems] = useState([])

  useEffect(function() {
    function update(list) { setItems(list) }
    listeners.push(update)
    return function() {
      listeners = listeners.filter(function(fn) { return fn !== update })
    }
  }, [])

  if (items.length === 0) return null

  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20,
      display: "flex", flexDirection: "column", gap: 8,
      zIndex: 9999, pointerEvents: "none"
    }}>
      {items.map(function(item) {
        var bg     = item.type === "success" ? "#22c55e"
                   : item.type === "error"   ? "#ef4444"
                   : item.type === "loading" ? "#3b82f6"
                   : "#6366f1"
        var icon   = item.type === "success" ? "✓"
                   : item.type === "error"   ? "✕"
                   : item.type === "loading" ? "⟳"
                   : "ℹ"
        return (
          <div key={item.id} style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "#0f0f1a",
            border: "1px solid rgba(255,255,255,0.1)",
            borderLeft: "3px solid " + bg,
            borderRadius: 10, padding: "11px 16px",
            fontSize: 13, color: "#eeeef5",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 500,
            boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
            minWidth: 260, maxWidth: 380,
            pointerEvents: "all",
            animation: "slideUp 0.2s ease"
          }}>
            <span style={{
              width: 20, height: 20, borderRadius: "50%",
              background: bg, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 11, fontWeight: 700,
              color: "#fff", flexShrink: 0,
              animation: item.type === "loading" ? "spin 1s linear infinite" : "none"
            }}>{icon}</span>
            <span style={{ flex: 1 }}>{item.message}</span>
            <button onClick={function() { toast.dismiss(item.id) }} style={{
              background: "transparent", border: "none",
              color: "rgba(255,255,255,0.3)", cursor: "pointer",
              fontSize: 16, lineHeight: 1, padding: 0, flexShrink: 0
            }}>×</button>
          </div>
        )
      })}
      <style>{"\
        @keyframes slideUp {\
          from { opacity: 0; transform: translateY(12px); }\
          to   { opacity: 1; transform: translateY(0); }\
        }\
        @keyframes spin {\
          from { transform: rotate(0deg); }\
          to   { transform: rotate(360deg); }\
        }\
      "}</style>
    </div>
  )
}
