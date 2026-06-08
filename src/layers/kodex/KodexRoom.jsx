// src/layers/kodex/KodexRoom.jsx
// KODEX room — council chamber layout: doctrine (left) + tension table + council (right)
// You don't select a tension. You can't hide one. They sit on the table until decided.

import { useState, useRef, useEffect } from "react"
import { loadAllCanon, loadOpenTensions, loadTensions } from "../../engine/canon.js"
import { getAllRulings } from "../../engine/rulings.js"
import { formatMessage } from "../../utils/formatMessage.jsx"
import RulingCrystallizer from "../../components/RulingCrystallizer.jsx"
import RulingChallenger from "../../components/RulingChallenger.jsx"

const KX = {
  bg:      "#070710",
  card:    "#0d0d1e",
  tension: "#0b0816",
  border:  "#1a1a30",
  primary: "#c87dff",
  dim:     "rgba(200,125,255,0.07)",
}

const WING_LABEL = {
  ops:       "OPSCORE",
  archivist: "ARCHIVIST",
  creative:  "KODEX",
  kel:       "K.E.L.",
}

function DoctrineEntry({ declaration }) {
  const isDecided = !!declaration.originTension
  return (
    <div style={{
      padding: "8px 8px",
      marginBottom: 4,
      borderRadius: 4,
      borderLeft: `2px solid ${isDecided ? KX.primary + "55" : KX.primary + "20"}`,
      paddingLeft: 10,
    }}>
      <div style={{
        fontSize: "0.58rem",
        fontWeight: 600,
        color: isDecided ? "var(--fg-2)" : "var(--fg-3)",
        lineHeight: 1.35,
        marginBottom: 4,
        overflow: "hidden",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
      }}>
        {declaration.label}
      </div>
      <div style={{ fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", color: isDecided ? KX.primary + "65" : "var(--fg-4)" }}>
        {isDecided ? "↳ decided" : declaration.type}
      </div>
    </div>
  )
}

function TensionCard({ tension }) {
  const days      = Math.floor((Date.now() - tension.createdAt) / 86400000)
  const daysLabel = days === 0 ? "opened today" : days === 1 ? "1 day open" : `${days} days open`
  const daysColor = days > 3 ? "#ff9f43" : "var(--fg-4)"

  return (
    <div style={{
      marginBottom: 16,
      padding: "16px 18px",
      borderRadius: 8,
      background: KX.tension,
      border: `1px solid ${KX.border}`,
      borderLeft: `3px solid ${KX.primary}`,
    }}>
      <div style={{ fontSize: "0.46rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: KX.primary, marginBottom: 10, opacity: 0.85 }}>
        active contradiction
      </div>
      <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--fg)", lineHeight: 1.4, marginBottom: 12 }}>
        {tension.title}
      </div>
      <div style={{ fontSize: "0.76rem", color: "var(--fg-2)", lineHeight: 1.85, marginBottom: 14, whiteSpace: "pre-line" }}>
        {tension.statement}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {tension.affectedWings.length > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: "0.44rem", fontFamily: "monospace", color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase" }}>affects</span>
            <div style={{ display: "flex", gap: 4 }}>
              {tension.affectedWings.map(w => (
                <span key={w} style={{ fontSize: "0.48rem", fontFamily: "monospace", color: KX.primary, letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 3, background: `${KX.primary}10`, border: `1px solid ${KX.primary}1e` }}>
                  {WING_LABEL[w] || w}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div />
        )}
        <div style={{ fontSize: "0.48rem", fontFamily: "monospace", color: daysColor }}>
          {daysLabel}
        </div>
      </div>
    </div>
  )
}

export default function KodexRoom({ messages, thinking, input, onInputChange, onSend }) {
  const [crystallizerOpen, setCrystallizerOpen] = useState(false)
  const [challengerOpen, setChallengerOpen]     = useState(false)

  const allCanon   = loadAllCanon()
  const allRulings = getAllRulings().filter(r =>
    r.status === "active" || r.status === "upheld" || r.status === "challenged"
  )
  const tensions = loadOpenTensions()
  const resolved = loadTensions("resolved")
    .sort((a, b) => (b.resolvedAt || 0) - (a.resolvedAt || 0))
    .slice(0, 5)

  const doctrine = allCanon
    .filter(d => d.status === "active" && (d.originTension || d.category === "global"))
    .slice(0, 12)

  const kodexMsgs = messages.filter(
    m => m.lane === "creative" && (m.role === "user" || m.role === "bot" || m.role === "error")
  )

  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, thinking])

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend() }
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: KX.bg, overflow: "hidden" }}>

      {/* Room header */}
      <div style={{
        padding: "10px 16px 9px",
        borderBottom: `1px solid ${KX.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.22em", textTransform: "uppercase", color: KX.primary, marginBottom: 3 }}>
            KODEX · Interpretation Wing
          </div>
          <div style={{ fontSize: "0.6rem", color: "var(--fg-4)", fontStyle: "italic" }}>
            A decision is waiting to be made.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {tensions.length > 0 && (
            <div style={{ fontSize: "0.48rem", fontFamily: "monospace", textAlign: "right", lineHeight: 1.6 }}>
              <span style={{ color: KX.primary }}>{tensions.length}</span>
              <span style={{ color: "var(--fg-4)" }}> unresolved</span>
            </div>
          )}
          {allRulings.length > 0 && (
            <button
              onClick={() => { setChallengerOpen(v => !v); setCrystallizerOpen(false) }}
              style={{
                position:      "relative",
                padding:       "5px 11px",
                borderRadius:  5,
                border:        `1px solid ${challengerOpen ? KX.primary + "55" : KX.border}`,
                background:    challengerOpen ? `${KX.primary}10` : "transparent",
                color:         challengerOpen ? KX.primary : "var(--fg-4)",
                fontSize:      "0.5rem",
                fontFamily:    "monospace",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor:        "pointer",
                transition:    "all 0.15s",
              }}
            >
              Rulings
              {allRulings.filter(r => r.status === "challenged").length > 0 && (
                <span style={{
                  position:     "absolute",
                  top:          -4,
                  right:        -4,
                  width:        8,
                  height:       8,
                  borderRadius: "50%",
                  background:   "#ff9f43",
                }} />
              )}
            </button>
          )}
          <button
            onClick={() => { setCrystallizerOpen(v => !v); setChallengerOpen(false) }}
            style={{
              padding:       "5px 11px",
              borderRadius:  5,
              border:        `1px solid ${crystallizerOpen ? KX.primary + "55" : KX.border}`,
              background:    crystallizerOpen ? `${KX.primary}10` : "transparent",
              color:         crystallizerOpen ? KX.primary : "var(--fg-4)",
              fontSize:      "0.5rem",
              fontFamily:    "monospace",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor:        "pointer",
              transition:    "all 0.15s",
            }}
          >
            Issue Ruling
          </button>
        </div>
      </div>

      {crystallizerOpen && (
        <RulingCrystallizer
          onDismiss={() => setCrystallizerOpen(false)}
          onIssued={() => setCrystallizerOpen(false)}
        />
      )}

      {challengerOpen && (
        <RulingChallenger
          onDismiss={() => setChallengerOpen(false)}
        />
      )}

      {/* Two-column body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Left: Doctrine — what is settled */}
        <div style={{
          width: 200,
          flexShrink: 0,
          borderRight: `1px solid ${KX.border}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          <div style={{ padding: "9px 10px 6px", borderBottom: `1px solid ${KX.border}` }}>
            <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-4)" }}>doctrine</div>
            <div style={{ fontSize: "0.5rem", color: "var(--fg-4)", marginTop: 2, fontStyle: "italic" }}>what is settled</div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px 6px" }}>
            {doctrine.length === 0 ? (
              <div style={{ padding: "14px 8px", fontSize: "0.62rem", color: "var(--fg-4)", lineHeight: 1.7, fontStyle: "italic" }}>
                No standing doctrine.
              </div>
            ) : (
              doctrine.map(d => <DoctrineEntry key={d.id} declaration={d} />)
            )}
          </div>
        </div>

        {/* Right: Tension Table + Council + Input */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Tension table sub-header */}
          <div style={{ padding: "9px 18px 6px", borderBottom: `1px solid ${KX.border}`, flexShrink: 0 }}>
            <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-4)" }}>tension table</div>
            <div style={{ fontSize: "0.5rem", color: "var(--fg-4)", marginTop: 2, fontStyle: "italic" }}>what is not</div>
          </div>

          {/* Tension cards — all visible, none hidden */}
          <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px" }}>
            {tensions.length === 0 ? (
              <div style={{ paddingTop: 16, fontSize: "0.74rem", color: "var(--fg-3)", lineHeight: 1.75 }}>
                The table is clear.
                <br />
                <span style={{ fontSize: "0.68rem", color: "var(--fg-4)" }}>
                  Either everything is resolved — or nothing has been examined.
                </span>
              </div>
            ) : (
              tensions.map(t => <TensionCard key={t.id} tension={t} />)
            )}

            {resolved.length > 0 && (
              <div style={{ marginTop: tensions.length > 0 ? 20 : 0 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
                  fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.16em",
                  textTransform: "uppercase", color: "var(--fg-4)",
                }}>
                  <div style={{ flex: 1, height: 1, background: KX.border }} />
                  resolved
                  <div style={{ flex: 1, height: 1, background: KX.border }} />
                </div>
                {resolved.map(t => (
                  <div key={t.id} style={{
                    marginBottom: 6, padding: "8px 12px",
                    borderRadius: 5, border: `1px solid ${KX.border}`,
                    borderLeft: `2px solid ${KX.primary}28`,
                  }}>
                    <div style={{ fontSize: "0.62rem", color: "var(--fg-3)", fontWeight: 600, marginBottom: 3 }}>{t.title}</div>
                    <div style={{ fontSize: "0.44rem", fontFamily: "monospace", color: KX.primary + "55", letterSpacing: "0.08em" }}>↳ resolved</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Council — kodex messages, compact */}
          {(kodexMsgs.length > 0 || thinking) && (
            <div style={{
              maxHeight: 190,
              overflowY: "auto",
              borderTop: `1px solid ${KX.border}`,
              padding: "10px 18px 6px",
              background: KX.card,
              flexShrink: 0,
            }}>
              <div style={{ fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 10 }}>council</div>
              {kodexMsgs.map((m, i) => (
                <div key={i} style={{
                  marginBottom: 10,
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                  flexDirection: m.role === "user" ? "row-reverse" : "row",
                }}>
                  <span style={{
                    fontSize: "0.38rem",
                    fontFamily: "monospace",
                    letterSpacing: "0.1em",
                    color: m.role === "user" ? "var(--fg-4)" : KX.primary,
                    textTransform: "uppercase",
                    paddingTop: 3,
                    flexShrink: 0,
                  }}>
                    {m.role === "user" ? "you" : m.role === "error" ? "error" : "kodex"}
                  </span>
                  <div style={{
                    fontSize: "0.72rem",
                    color: m.role === "user" ? "var(--fg-3)" : m.role === "error" ? "#ff6b6b" : "var(--fg-2)",
                    lineHeight: 1.7,
                    maxWidth: "88%",
                  }}>
                    {formatMessage(m.text)}
                  </div>
                </div>
              ))}
              {thinking && (
                <div style={{ display: "flex", gap: 6, alignItems: "center", paddingBottom: 4 }}>
                  <span style={{ fontSize: "0.38rem", fontFamily: "monospace", color: KX.primary, textTransform: "uppercase", letterSpacing: "0.1em" }}>kodex</span>
                  {[0, 0.2, 0.4].map((d, i) => (
                    <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: KX.primary, animation: `blink 1.1s ${d}s infinite` }} />
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Input */}
          <div style={{
            borderTop: `1px solid ${KX.border}`,
            padding: "10px 16px",
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexShrink: 0,
            background: KX.bg,
          }}>
            <input
              value={input}
              onChange={e => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Bring a contradiction…"
              style={{
                flex: 1,
                background: `${KX.primary}04`,
                border: `1px solid ${KX.border}`,
                borderRadius: 6,
                padding: "9px 13px",
                fontSize: "0.78rem",
                color: "var(--fg)",
                outline: "none",
                fontFamily: "inherit",
                transition: "border-color 0.15s",
              }}
              onFocus={e => e.target.style.borderColor = KX.primary + "38"}
              onBlur={e => e.target.style.borderColor = KX.border}
            />
            <button
              onClick={() => onSend()}
              disabled={!input.trim() || thinking}
              style={{
                padding: "9px 18px",
                borderRadius: 6,
                background: input.trim() && !thinking ? KX.dim : "transparent",
                border: `1px solid ${input.trim() && !thinking ? KX.primary + "38" : KX.border}`,
                color: input.trim() && !thinking ? KX.primary : "var(--fg-4)",
                fontSize: "0.58rem",
                fontFamily: "monospace",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                cursor: input.trim() && !thinking ? "pointer" : "default",
                transition: "all 0.15s",
                flexShrink: 0,
              }}>
              argue
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
