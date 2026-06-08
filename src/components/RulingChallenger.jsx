// src/components/RulingChallenger.jsx
// The challenge bench.
// An institution that cannot be questioned cannot be trusted.
// A ruling that cannot be overturned is dogma pretending to be wisdom.

import { useState } from "react"
import {
  getAllRulings,
  challengeRuling,
  upholdRuling,
  overturnRuling,
  RULING_AUTHORITIES,
} from "../engine/rulings.js"

const PRIMARY = "#c87dff"
const WARN    = "#ff9f43"
const DANGER  = "#ff6b6b"

export default function RulingChallenger({ onDismiss }) {
  const [rulings, setRulings] = useState(() =>
    getAllRulings().filter(r =>
      r.status === "active" || r.status === "upheld" || r.status === "challenged"
    )
  )
  const [challengingId, setChallengingId] = useState(null)
  const [basis, setBasis]                 = useState("")

  function refresh() {
    setRulings(
      getAllRulings().filter(r =>
        r.status === "active" || r.status === "upheld" || r.status === "challenged"
      )
    )
  }

  function handleChallenge(id) {
    if (!basis.trim()) return
    challengeRuling(id, basis.trim())
    setChallengingId(null)
    setBasis("")
    refresh()
  }

  function handleUphold(id) {
    upholdRuling(id)
    refresh()
  }

  function handleOverturn(id) {
    overturnRuling(id)
    refresh()
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      if (challengingId) { setChallengingId(null); setBasis("") }
      else onDismiss()
    }
  }

  const binding    = rulings.filter(r => r.status === "active" || r.status === "upheld")
  const challenged = rulings.filter(r => r.status === "challenged")

  return (
    <div
      onKeyDown={handleKeyDown}
      style={{
        position:      "fixed",
        bottom:        90,
        right:         22,
        width:         340,
        maxHeight:     540,
        zIndex:        999,
        background:    "#080814",
        border:        `1px solid ${PRIMARY}22`,
        borderRadius:  10,
        boxShadow:     `0 14px 44px rgba(0,0,0,0.6), 0 0 0 1px ${PRIMARY}10`,
        overflow:      "hidden",
        display:       "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{
        padding:       "11px 14px 10px",
        borderBottom:  `1px solid ${PRIMARY}18`,
        display:       "flex",
        alignItems:    "center",
        justifyContent:"space-between",
        flexShrink:    0,
      }}>
        <div>
          <div style={{ fontSize: "0.4rem", fontFamily: "monospace", letterSpacing: "0.22em", textTransform: "uppercase", color: PRIMARY, marginBottom: 2 }}>
            KODEX · Review Rulings
          </div>
          <div style={{ fontSize: "0.56rem", color: "var(--fg-4)", fontStyle: "italic" }}>
            A ruling that cannot be challenged is suggestion.
          </div>
        </div>
        <button
          onClick={onDismiss}
          style={{ background: "none", border: "none", color: "var(--fg-4)", cursor: "pointer", fontSize: "0.7rem", padding: "0 2px" }}
        >
          ✕
        </button>
      </div>

      <div style={{ overflowY: "auto", padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Challenged rulings — resolution pending */}
        {challenged.length > 0 && (
          <div>
            <div style={{ fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.16em", textTransform: "uppercase", color: WARN, marginBottom: 8 }}>
              awaiting resolution · {challenged.length}
            </div>
            {challenged.map(r => (
              <div key={r.id} style={{
                marginBottom:  10,
                padding:       "11px 12px",
                borderRadius:  7,
                background:    "#0d0d1e",
                border:        `1px solid ${WARN}28`,
                borderLeft:    `3px solid ${WARN}`,
              }}>
                <div style={{ fontSize: "0.42rem", fontFamily: "monospace", color: WARN + "cc", letterSpacing: "0.1em", marginBottom: 4 }}>
                  {r.id} · {RULING_AUTHORITIES[r.authority] || r.authority}
                </div>
                <div style={{ fontSize: "0.66rem", color: "var(--fg-2)", fontWeight: 600, lineHeight: 1.35, marginBottom: 8 }}>
                  {r.summary}
                </div>
                {r.challengeBasis && (
                  <div style={{
                    fontSize:    "0.6rem",
                    color:       "var(--fg-3)",
                    lineHeight:  1.6,
                    marginBottom: 10,
                    padding:     "7px 9px",
                    borderRadius: 4,
                    background:  `${WARN}08`,
                    borderLeft:  `2px solid ${WARN}30`,
                    fontStyle:   "italic",
                  }}>
                    "{r.challengeBasis}"
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleUphold(r.id)}
                    style={{
                      flex:            1,
                      padding:         "7px 0",
                      borderRadius:    4,
                      border:          `1px solid ${PRIMARY}40`,
                      background:      `${PRIMARY}0c`,
                      color:           PRIMARY,
                      fontSize:        "0.52rem",
                      fontFamily:      "monospace",
                      letterSpacing:   "0.1em",
                      textTransform:   "uppercase",
                      cursor:          "pointer",
                      transition:      "all 0.12s",
                    }}
                  >
                    Uphold
                  </button>
                  <button
                    onClick={() => handleOverturn(r.id)}
                    style={{
                      flex:            1,
                      padding:         "7px 0",
                      borderRadius:    4,
                      border:          `1px solid ${DANGER}40`,
                      background:      `${DANGER}0c`,
                      color:           DANGER,
                      fontSize:        "0.52rem",
                      fontFamily:      "monospace",
                      letterSpacing:   "0.1em",
                      textTransform:   "uppercase",
                      cursor:          "pointer",
                      transition:      "all 0.12s",
                    }}
                  >
                    Overturn
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Binding rulings */}
        {binding.length > 0 ? (
          <div>
            <div style={{ fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 8 }}>
              binding rulings · {binding.length}
            </div>
            {binding.map(r => (
              <div key={r.id} style={{
                marginBottom:  10,
                padding:       "11px 12px",
                borderRadius:  7,
                background:    "#0d0d1e",
                border:        `1px solid ${PRIMARY}18`,
                borderLeft:    `3px solid ${r.status === "upheld" ? PRIMARY + "88" : PRIMARY + "44"}`,
              }}>
                <div style={{ fontSize: "0.42rem", fontFamily: "monospace", color: r.status === "upheld" ? PRIMARY + "99" : PRIMARY + "55", letterSpacing: "0.1em", marginBottom: 4 }}>
                  {r.id} · {RULING_AUTHORITIES[r.authority] || r.authority}
                  {r.status === "upheld" && (
                    <span style={{ marginLeft: 8, color: PRIMARY + "55" }}>· upheld</span>
                  )}
                </div>
                <div style={{ fontSize: "0.66rem", color: "var(--fg-2)", fontWeight: 600, lineHeight: 1.35, marginBottom: r.constraints?.length ? 8 : 10 }}>
                  {r.summary}
                </div>
                {r.constraints?.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    {r.constraints.map((c, i) => (
                      <div key={i} style={{
                        fontSize:    "0.58rem",
                        color:       "var(--fg-3)",
                        lineHeight:  1.5,
                        paddingLeft: 8,
                        borderLeft:  `1px solid ${PRIMARY}20`,
                        marginBottom: 2,
                      }}>
                        · {c}
                      </div>
                    ))}
                  </div>
                )}

                {challengingId === r.id ? (
                  <div style={{ marginTop: 4 }}>
                    <textarea
                      autoFocus
                      value={basis}
                      onChange={e => setBasis(e.target.value)}
                      placeholder="State the grounds for challenge..."
                      rows={2}
                      style={{
                        width:       "100%",
                        background:  "#0a0a1a",
                        border:      `1px solid ${WARN}40`,
                        borderRadius: 4,
                        color:       "var(--fg)",
                        fontSize:    "0.6rem",
                        padding:     "7px 9px",
                        fontFamily:  "inherit",
                        outline:     "none",
                        resize:      "none",
                        lineHeight:  1.5,
                        boxSizing:   "border-box",
                      }}
                    />
                    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                      <button
                        onClick={() => { setChallengingId(null); setBasis("") }}
                        style={{
                          flex:          1,
                          padding:       "6px 0",
                          borderRadius:  4,
                          border:        "1px solid #222240",
                          background:    "transparent",
                          color:         "var(--fg-4)",
                          fontSize:      "0.5rem",
                          fontFamily:    "monospace",
                          letterSpacing: "0.08em",
                          cursor:        "pointer",
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleChallenge(r.id)}
                        disabled={!basis.trim()}
                        style={{
                          flex:          2,
                          padding:       "6px 0",
                          borderRadius:  4,
                          border:        `1px solid ${basis.trim() ? WARN + "50" : "#222240"}`,
                          background:    basis.trim() ? `${WARN}12` : "transparent",
                          color:         basis.trim() ? WARN : "var(--fg-4)",
                          fontSize:      "0.5rem",
                          fontFamily:    "monospace",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          cursor:        basis.trim() ? "pointer" : "default",
                          transition:    "all 0.12s",
                        }}
                      >
                        Submit Challenge →
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setChallengingId(r.id); setBasis("") }}
                    style={{
                      width:         "100%",
                      padding:       "5px 0",
                      borderRadius:  4,
                      border:        "1px solid #222240",
                      background:    "transparent",
                      color:         "var(--fg-4)",
                      fontSize:      "0.5rem",
                      fontFamily:    "monospace",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      cursor:        "pointer",
                      transition:    "border-color 0.12s, color 0.12s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = WARN + "40"; e.currentTarget.style.color = WARN }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#222240"; e.currentTarget.style.color = "var(--fg-4)" }}
                  >
                    Challenge
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : challenged.length === 0 && (
          <div style={{ padding: "16px 0", fontSize: "0.66rem", color: "var(--fg-4)", lineHeight: 1.75, fontStyle: "italic" }}>
            No binding rulings yet.
            <br />
            <span style={{ fontSize: "0.6rem" }}>Issue a ruling to establish precedent.</span>
          </div>
        )}

      </div>
    </div>
  )
}
