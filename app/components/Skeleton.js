"use client"

// Usage examples:
// <Skeleton width="100%" height={20} />           — single line
// <Skeleton width="60%" height={16} />            — shorter line
// <SkeletonCard />                                 — full card with lines
// <SkeletonTable rows={5} />                       — table rows
// <SkeletonStat />                                 — stat card

export default function Skeleton({ width, height, borderRadius, style }) {
  return (
    <div style={Object.assign({
      width:        width  || "100%",
      height:       height || 16,
      borderRadius: borderRadius || 6,
      background:   "rgba(255,255,255,0.06)",
      animation:    "shimmer 1.4s ease-in-out infinite",
      flexShrink:   0
    }, style || {})}>
      <style>{"\
        @keyframes shimmer {\
          0%   { opacity: 0.4; }\
          50%  { opacity: 0.8; }\
          100% { opacity: 0.4; }\
        }\
      "}</style>
    </div>
  )
}

export function SkeletonCard({ lines, dark }) {
  var bg     = dark === false ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)"
  var border = dark === false ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"
  var numLines = lines || 3
  return (
    <div style={{
      background:   dark === false ? "#ffffff" : "#0f0f1a",
      border:       "1px solid " + border,
      borderRadius: 13, padding: 20,
      display:      "flex", flexDirection: "column", gap: 12
    }}>
      <style>{"\
        @keyframes shimmer {\
          0%   { opacity: 0.4; }\
          50%  { opacity: 0.8; }\
          100% { opacity: 0.4; }\
        }\
      "}</style>
      {Array.from({ length: numLines }).map(function(_, i) {
        return (
          <div key={i} style={{
            height: i === 0 ? 18 : 14,
            width:  i === 0 ? "40%" : i % 2 === 0 ? "90%" : "70%",
            borderRadius: 6, background: bg,
            animation: "shimmer 1.4s ease-in-out infinite",
            animationDelay: (i * 0.1) + "s"
          }} />
        )
      })}
    </div>
  )
}

export function SkeletonStat({ dark }) {
  var bg = dark === false ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)"
  var cardBg = dark === false ? "#ffffff" : "#0f0f1a"
  var cardBorder = dark === false ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"
  return (
    <div style={{
      background: cardBg, border: "1px solid " + cardBorder,
      borderRadius: 11, padding: "13px 15px",
      display: "flex", flexDirection: "column", gap: 10
    }}>
      <style>{"\
        @keyframes shimmer {\
          0%   { opacity: 0.4; }\
          50%  { opacity: 0.8; }\
          100% { opacity: 0.4; }\
        }\
      "}</style>
      <div style={{ height: 11, width: "50%", borderRadius: 4, background: bg, animation: "shimmer 1.4s ease-in-out infinite" }} />
      <div style={{ height: 28, width: "70%", borderRadius: 6, background: bg, animation: "shimmer 1.4s ease-in-out infinite", animationDelay: "0.1s" }} />
      <div style={{ height: 10, width: "40%", borderRadius: 4, background: bg, animation: "shimmer 1.4s ease-in-out infinite", animationDelay: "0.2s" }} />
    </div>
  )
}

export function SkeletonTable({ rows, dark }) {
  var bg = dark === false ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)"
  var border = dark === false ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"
  var numRows = rows || 5
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <style>{"\
        @keyframes shimmer {\
          0%   { opacity: 0.4; }\
          50%  { opacity: 0.8; }\
          100% { opacity: 0.4; }\
        }\
      "}</style>
      {Array.from({ length: numRows }).map(function(_, i) {
        return (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 16px",
            borderBottom: "1px solid " + border
          }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, flexShrink: 0, animation: "shimmer 1.4s ease-in-out infinite" }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ height: 13, width: "40%", borderRadius: 4, background: bg, animation: "shimmer 1.4s ease-in-out infinite", animationDelay: (i * 0.05) + "s" }} />
              <div style={{ height: 11, width: "60%", borderRadius: 4, background: bg, animation: "shimmer 1.4s ease-in-out infinite", animationDelay: (i * 0.05 + 0.1) + "s" }} />
            </div>
            <div style={{ height: 13, width: 60, borderRadius: 4, background: bg, flexShrink: 0, animation: "shimmer 1.4s ease-in-out infinite" }} />
          </div>
        )
      })}
    </div>
  )
}
