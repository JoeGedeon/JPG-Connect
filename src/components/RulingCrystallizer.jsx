// src/components/RulingCrystallizer.jsx
// The pen that makes the ruling real.
// Compact. No ceremony needed — the act itself is the ceremony.

import { useState } from "react"
import { createRuling, issueRuling, RULING_AUTHORITIES } from "../engine/rulings.js"

const LANES = [
  { id: "vera",      label: "VERA" },
  { id: "ops",       label: "OPSCORE" },
  { id: "archivist", label: "ARCHIVIST" },
  { id: "creative",  label: "KODEX" },
  { id: "kel",       label: "K.E.L." },
]

const PRIMARY = "#c87dff"

export default function RulingCrystallizer({ onDismiss, onIssued }) {
  const [summary, setSummary]         = useState("")
  const [authority, setAuthority]     = useState("interpretive")
  const [basisText, setBasisText]     = useState("KX-005")
  const [lanes, setLanes]             = useState([])
  const [constraintText, setConstraintText] = useState("")
  const [fullText, setFullText]       = useState("")

  const canIssue = summary.trim().length > 0

  function toggleLane(id) {
    setLanes(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    )
  }

  function handleIssue() {
    if (!canIssue) return

    const constitutionalBasis = basisText
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)

    const constraints = constraintText
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean)

    const draft = createRuling({
      issuingSeat:        "KODEX",
      authority,
      constitutionalBasis,
      constraints,
      affectedLanes:      lanes,
      summary:            summary.trim(),
      fullText:           fullText.trim(),
    })

    issueRuling(draft.id)
    onIssued?.()
    onDismiss()
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") onDismiss()
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleIssue()
  }

  const inputStyle = {
    width: "100%",
    background: "#0d0d1e",
    border: "1px solid #222240",
    borderRadius: 5,
    color: "var(--fg)",
    fontSize: "0.68rem",
    padding: "7px 9px",
    fontFamily: "inherit",
    outline: "none",
    resize: "none",
    lineHeight: 1.5,
  }

  const labelStyle = {
    fontSize: "0.42rem",
    fontFamily: "monospace",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "var(--fg-4)",
    marginBottom: 5,
    display: "block",
  }

  return (
    <div
      onKeyDown={handleKeyDown}
      style={{
        position: "fixed",
        bottom: 90,
        right: 22,
        width: 320,
        zIndex: 999,
        background: "#080814",
        border: `1px solid ${PRIMARY}22`,
        borderRadius: 10,
        boxShadow: `0 14px 44px rgba(0,0,0,0.6), 0 0 0 1px ${PRIMARY}10`,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{
        padding: "11px 14px 10px",
        borderBottom: `1px solid ${PRIMARY}18`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: "0.4rem", fontFamily: "monospace", letterSpacing: "0.22em", textTransform: "uppercase", color: PRIMARY, marginBottom: 2 }}>
            KODEX · Issue Ruling
          </div>
          <div style={{ fontSize: "0.56rem", color: "var(--fg-4)", fontStyle: "italic" }}>
            The artifact must explain itself.
          </div>
        </div>
        <button
          onClick={onDismiss}
          style={{ background: "none", border: "none", color: "var(--fg-4)", cursor: "pointer", fontSize: "0.7rem", padding: "0 2px" }}
        >
          ✕
        </button>
      </div>

      <div style={{ padding: "14px 14px 12px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Summary — required */}
        <div>
          <label style={labelStyle}>Summary *</label>
          <input
            autoFocus
            value={summary}
            onChange={e => setSummary(e.target.value)}
            placeholder="One line. What does this ruling establish?"
            style={{ ...inputStyle }}
          />
        </div>

        {/* Authority */}
        <div>
          <label style={labelStyle}>Authority</label>
          <select
            value={authority}
            onChange={e => setAuthority(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            {Object.entries(RULING_AUTHORITIES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Constitutional basis */}
        <div>
          <label style={labelStyle}>Constitutional Basis</label>
          <input
            value={basisText}
            onChange={e => setBasisText(e.target.value)}
            placeholder="e.g. KX-005, KX-006"
            style={{ ...inputStyle }}
          />
        </div>

        {/* Affected lanes */}
        <div>
          <label style={labelStyle}>Affected Lanes</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {LANES.map(l => {
              const selected = lanes.includes(l.id)
              return (
                <button
                  key={l.id}
                  onClick={() => toggleLane(l.id)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 4,
                    border: `1px solid ${selected ? PRIMARY + "60" : "#222240"}`,
                    background: selected ? `${PRIMARY}12` : "transparent",
                    color: selected ? PRIMARY : "var(--fg-4)",
                    fontSize: "0.52rem",
                    fontFamily: "monospace",
                    letterSpacing: "0.08em",
                    cursor: "pointer",
                    transition: "all 0.12s",
                  }}
                >
                  {l.label}
                </button>
              )
            })}
          </div>
          <div style={{ fontSize: "0.44rem", color: "var(--fg-4)", marginTop: 4, fontStyle: "italic" }}>
            Empty = applies to all lanes.
          </div>
        </div>

        {/* Constraints — one per line */}
        <div>
          <label style={labelStyle}>Constraints (one per line)</label>
          <textarea
            value={constraintText}
            onChange={e => setConstraintText(e.target.value)}
            placeholder={"Reasoning must cite prior precedent.\nNo ruling may expand KODEX authority beyond interpretive."}
            rows={3}
            style={{ ...inputStyle }}
          />
        </div>

        {/* Full text — optional */}
        <div>
          <label style={labelStyle}>Full Text (optional)</label>
          <textarea
            value={fullText}
            onChange={e => setFullText(e.target.value)}
            placeholder="Complete ruling statement. Survives model replacement."
            rows={3}
            style={{ ...inputStyle }}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleIssue}
          disabled={!canIssue}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: 6,
            border: `1px solid ${canIssue ? PRIMARY + "50" : "#222240"}`,
            background: canIssue ? `${PRIMARY}14` : "transparent",
            color: canIssue ? PRIMARY : "var(--fg-4)",
            fontSize: "0.62rem",
            fontFamily: "monospace",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            cursor: canIssue ? "pointer" : "default",
            transition: "all 0.15s",
          }}
        >
          Issue Ruling →
        </button>

        <div style={{ fontSize: "0.44rem", color: "var(--fg-4)", textAlign: "center", fontStyle: "italic" }}>
          ⌘↵ to issue · Esc to dismiss
        </div>
      </div>
    </div>
  )
}
