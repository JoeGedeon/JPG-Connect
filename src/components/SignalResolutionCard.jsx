// src/components/SignalResolutionCard.jsx
import { useState } from "react"
import { RESOLUTION, RESOLUTION_DESCRIPTIONS, recordResolution } from "../engine/ledger.js"

const BUTTONS = [
  { key: RESOLUTION.CONFIRMED,      label: "Confirmed",      color: "#00c896" },
  { key: RESOLUTION.FALSE_POSITIVE, label: "False Positive", color: "#ff7675" },
  { key: RESOLUTION.INCOMPLETE,     label: "Incomplete",     color: "#ffcc5c" },
  { key: RESOLUTION.SUPERSEDED,     label: "Superseded",     color: "#9e9e9e" },
]

export default function SignalResolutionCard({ signal, seatColor, seatName, onResolved }) {
  const [resolving, setResolving] = useState(null)

  function handleResolve(resolution) {
    setResolving(resolution)
    recordResolution({ signalId: signal.id, resolution })
    setTimeout(() => onResolved?.(), 700)
  }

  return (
    <div style={{
      padding:    "14px 16px",
      borderRadius: 8,
      background: "var(--bg-card)",
      border:     `1px solid ${seatColor}30`,
      marginBottom: 8,
      opacity:    resolving ? 0.75 : 1,
      transition: "opacity 0.3s",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-4)" }}>
          UNRESOLVED SIGNAL
        </div>
        <div style={{ padding: "2px 8px", borderRadius: 4, background: seatColor + "20", border: `1px solid ${seatColor}40`, fontSize: "0.44rem", fontFamily: "monospace", color: seatColor, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {signal.signalType}
        </div>
      </div>

      <div style={{ fontSize: "0.5rem", fontFamily: "monospace", color: seatColor, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
        {seatName}
      </div>
      <div style={{ fontSize: "0.76rem", color: "var(--fg-2)", lineHeight: 1.5, marginBottom: 10 }}>
        {signal.summary}
      </div>

      {signal.signals?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {signal.signals.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start", marginBottom: 3 }}>
              <div style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--fg-4)", marginTop: 7, flexShrink: 0 }} />
              <div style={{ fontSize: "0.66rem", color: "var(--fg-3)", lineHeight: 1.4 }}>{s}</div>
            </div>
          ))}
        </div>
      )}

      {signal.action && (
        <div style={{ padding: "7px 10px", borderRadius: 5, background: "var(--bg-panel)", marginBottom: 12, fontSize: "0.66rem", color: "var(--fg-3)", lineHeight: 1.4 }}>
          <span style={{ color: "var(--fg-4)", fontFamily: "monospace", fontSize: "0.52rem", letterSpacing: "0.1em" }}>suggested → </span>
          {signal.action}
        </div>
      )}

      <div style={{ fontSize: "0.5rem", color: "var(--fg-4)", fontFamily: "monospace", marginBottom: 8 }}>How did this resolve?</div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {BUTTONS.map(btn => (
          <button
            key={btn.key}
            title={RESOLUTION_DESCRIPTIONS[btn.key]}
            onClick={() => !resolving && handleResolve(btn.key)}
            style={{
              padding:       "5px 12px",
              borderRadius:  5,
              border:        `1px solid ${resolving === btn.key ? btn.color : btn.color + "50"}`,
              background:    resolving === btn.key ? btn.color + "30" : btn.color + "10",
              color:         btn.color,
              fontSize:      "0.6rem",
              fontFamily:    "monospace",
              fontWeight:    700,
              cursor:        resolving ? "default" : "pointer",
              letterSpacing: "0.06em",
              transition:    "all 0.15s",
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  )
}
