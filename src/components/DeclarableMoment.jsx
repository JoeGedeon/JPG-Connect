// src/components/DeclarableMoment.jsx
// Universal declarable moment card — surfaces at institutional transition points.
// Tiny. Dismissible. No guilt.

import { useState } from "react"
import { getMomentPrompt } from "../engine/moments.js"
import { createDeclaration, IMPORTANCE } from "../engine/canon.js"

const TIERS = [
  { value: IMPORTANCE.TACTICAL,     label: "Tactical" },
  { value: IMPORTANCE.OPERATIONAL,  label: "Operational" },
  { value: IMPORTANCE.FOUNDATIONAL, label: "Foundational" },
]

export default function DeclarableMoment({ moment, onDismiss, onDeclared }) {
  const [mode, setMode]         = useState("prompt")
  const [label, setLabel]       = useState(moment.prefillLabel || "")
  const [content, setContent]   = useState(moment.prefillContent || "")
  const [importance, setImportance] = useState(IMPORTANCE.OPERATIONAL)

  const { headline, question } = getMomentPrompt(moment.type)
  const category = moment.category || "ops"
  const canSubmit = label.trim().length > 0 && content.trim().length > 0

  function handleSubmit() {
    if (!canSubmit) return
    createDeclaration({ label: label.trim(), content: content.trim(), category, importance })
    onDeclared?.()
    onDismiss()
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit()
    if (e.key === "Escape") onDismiss()
  }

  return (
    <div
      onKeyDown={handleKeyDown}
      style={{
        position: "fixed",
        bottom: 88,
        right: 22,
        width: 308,
        zIndex: 999,
        background: "#0c0c1c",
        border: "1px solid #1d1d38",
        borderRadius: 10,
        boxShadow: "0 12px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,200,150,0.05)",
        overflow: "hidden",
        animation: "momentSlide 0.2s ease",
      }}
    >
      <style>{`@keyframes momentSlide { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }`}</style>

      {/* Header */}
      <div style={{
        padding: "9px 12px 8px",
        borderBottom: "1px solid #1d1d38",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{
          fontSize: "0.42rem",
          fontFamily: "monospace",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#00c896",
          opacity: 0.75,
        }}>
          declarable moment
        </div>
        <button
          onClick={onDismiss}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--fg-4)",
            fontSize: "0.9rem",
            lineHeight: 1,
            padding: "1px 4px",
            opacity: 0.5,
          }}
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "12px 14px 14px" }}>
        {mode === "prompt" ? (
          <>
            <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--fg)", marginBottom: 4 }}>
              {headline}
            </div>
            <div style={{ fontSize: "0.66rem", color: "var(--fg-3)", lineHeight: 1.65, marginBottom: moment.context ? 10 : 14 }}>
              {question}
            </div>
            {moment.context && (
              <div style={{
                fontSize: "0.58rem",
                color: "var(--fg-4)",
                lineHeight: 1.55,
                fontStyle: "italic",
                marginBottom: 14,
                padding: "7px 9px",
                borderRadius: 5,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid #181830",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
              }}>
                "{moment.context}"
              </div>
            )}
            <div style={{ display: "flex", gap: 7 }}>
              <button
                onClick={onDismiss}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 6,
                  border: "1px solid #1d1d38",
                  background: "transparent",
                  color: "var(--fg-4)",
                  fontSize: "0.64rem",
                  cursor: "pointer",
                }}
              >
                Ignore
              </button>
              <button
                onClick={() => setMode("form")}
                style={{
                  flex: 2,
                  padding: "8px 0",
                  borderRadius: 6,
                  border: "1px solid #00c89638",
                  background: "rgba(0,200,150,0.06)",
                  color: "#00c896",
                  fontSize: "0.64rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Declare
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 9 }}>
              <div style={{ fontSize: "0.4rem", fontFamily: "monospace", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 4 }}>
                label
              </div>
              <input
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="Name this doctrine…"
                autoFocus
                style={{
                  width: "100%",
                  padding: "7px 9px",
                  borderRadius: 5,
                  border: "1px solid #1d1d38",
                  background: "#07070f",
                  color: "var(--fg)",
                  fontSize: "0.7rem",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>
            <div style={{ marginBottom: 9 }}>
              <div style={{ fontSize: "0.4rem", fontFamily: "monospace", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 4 }}>
                content
              </div>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="What should the institution remember…"
                rows={3}
                style={{
                  width: "100%",
                  padding: "7px 9px",
                  borderRadius: 5,
                  border: "1px solid #1d1d38",
                  background: "#07070f",
                  color: "var(--fg)",
                  fontSize: "0.68rem",
                  outline: "none",
                  resize: "none",
                  lineHeight: 1.55,
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: "0.4rem", fontFamily: "monospace", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 5 }}>
                tier
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {TIERS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setImportance(opt.value)}
                    style={{
                      flex: 1,
                      padding: "5px 0",
                      borderRadius: 4,
                      border: `1px solid ${importance === opt.value ? "#00c89638" : "#1d1d38"}`,
                      background: importance === opt.value ? "rgba(0,200,150,0.06)" : "transparent",
                      color: importance === opt.value ? "#00c896" : "var(--fg-4)",
                      fontSize: "0.52rem",
                      cursor: "pointer",
                      fontFamily: "monospace",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 7 }}>
              <button
                onClick={() => setMode("prompt")}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 6,
                  border: "1px solid #1d1d38",
                  background: "transparent",
                  color: "var(--fg-4)",
                  fontSize: "0.64rem",
                  cursor: "pointer",
                }}
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                style={{
                  flex: 2,
                  padding: "8px 0",
                  borderRadius: 6,
                  border: `1px solid ${canSubmit ? "#00c89638" : "#1d1d38"}`,
                  background: canSubmit ? "rgba(0,200,150,0.06)" : "transparent",
                  color: canSubmit ? "#00c896" : "var(--fg-4)",
                  fontSize: "0.64rem",
                  fontWeight: 600,
                  cursor: canSubmit ? "pointer" : "default",
                }}
              >
                Record Declaration
              </button>
            </div>
            <div style={{ marginTop: 8, textAlign: "center", fontSize: "0.4rem", fontFamily: "monospace", color: "var(--fg-4)", opacity: 0.4 }}>
              ⌘ Enter to save · Esc to dismiss
            </div>
          </>
        )}
      </div>
    </div>
  )
}
