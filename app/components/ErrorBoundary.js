"use client"
import { Component } from "react"

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error }
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          padding:        "40px 20px",
          gap:            12,
          background:     "rgba(239,68,68,0.05)",
          border:         "1px solid rgba(239,68,68,0.2)",
          borderRadius:   12,
          textAlign:      "center"
        }}>
          <div style={{ fontSize: 28, opacity: 0.5 }}>⚠️</div>
          <div style={{
            fontWeight: 600, fontSize: 14,
            color: "#f87171",
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}>
            Something went wrong
          </div>
          <div style={{
            fontSize: 12, color: "rgba(255,255,255,0.35)",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            maxWidth: 300, lineHeight: 1.5
          }}>
            {this.state.error && this.state.error.message
              ? this.state.error.message
              : "An unexpected error occurred in this section"}
          </div>
          <button
            onClick={function() { window.location.reload() }}
            style={{
              marginTop:   4,
              padding:     "7px 18px",
              borderRadius: 8,
              background:  "rgba(239,68,68,0.15)",
              border:      "1px solid rgba(239,68,68,0.3)",
              color:       "#f87171",
              fontSize:    12,
              fontWeight:  600,
              cursor:      "pointer",
              fontFamily:  "'Plus Jakarta Sans', sans-serif"
            }}>
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
