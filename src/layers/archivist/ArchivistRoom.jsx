// src/layers/archivist/ArchivistRoom.jsx
// ARCHIVIST room — library layout: stacks (left) + reading room + consultation (right)
// The room is permanent. The stacks are always visible. The record is the center.

import { useState, useRef, useEffect } from "react"
import { loadAllCanon, buildCanonContext } from "../../engine/canon.js"
import { formatMessage } from "../../utils/formatMessage.jsx"

const AM = {
  bg:       "#0a0806",
  card:     "#110d09",
  border:   "#231810",
  primary:  "#c8955a",
  dim:      "rgba(200,149,90,0.07)",
  hover:    "rgba(200,149,90,0.04)",
  spine:    "#c8955a",
  spineAlt: "rgba(200,149,90,0.32)",
}

function recordedOn(ts) {
  const d    = new Date(ts)
  const diff = Date.now() - ts
  if (diff < 3600000)  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
}

function StackVolume({ declaration, selected, onSelect }) {
  const isChained = !!declaration.originTension
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={() => onSelect(declaration)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 9,
        padding: "9px 8px",
        marginBottom: 2,
        borderRadius: 5,
        cursor: "pointer",
        background: selected ? AM.dim : hovered ? AM.hover : "transparent",
        border: `1px solid ${selected ? AM.primary + "28" : "transparent"}`,
        transition: "all 0.12s",
      }}
    >
      {/* Book spine */}
      <div style={{
        width: 3,
        alignSelf: "stretch",
        minHeight: 34,
        borderRadius: 2,
        background: isChained ? AM.spine : AM.spineAlt,
        flexShrink: 0,
        marginTop: 1,
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "0.63rem",
          fontWeight: 600,
          color: selected ? AM.primary : "var(--fg-2)",
          lineHeight: 1.35,
          marginBottom: 5,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          transition: "color 0.12s",
        }}>
          {declaration.label}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.44rem", fontFamily: "monospace", color: "var(--fg-4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {declaration.type}
          </span>
          {isChained && (
            <span style={{ fontSize: "0.44rem", fontFamily: "monospace", color: AM.primary + "80", letterSpacing: "0.06em" }}>
              ↳ kodex
            </span>
          )}
          <span style={{ fontSize: "0.44rem", fontFamily: "monospace", color: "var(--fg-4)", marginLeft: "auto" }}>
            {recordedOn(declaration.createdAt)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function ArchivistRoom({ messages, thinking, input, onInputChange, onSend }) {
  const allCanon = loadAllCanon()
  const active   = allCanon.filter(d => !/^[A-Z]/.test(d.id) && d.status === "active")
  const archived = allCanon.filter(d => !/^[A-Z]/.test(d.id) && d.status === "released")

  const [selected, setSelected] = useState(() => active[0] || archived[0] || null)
  const bottomRef = useRef(null)

  const archivistMsgs = messages.filter(
    m => m.lane === "archivist" && (m.role === "user" || m.role === "bot" || m.role === "error")
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, thinking])

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend() }
  }

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: AM.bg,
      overflow: "hidden",
    }}>

      {/* Room header */}
      <div style={{
        padding: "10px 16px 9px",
        borderBottom: `1px solid ${AM.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.22em", textTransform: "uppercase", color: AM.primary, marginBottom: 3 }}>
            ARCHIVIST · Memory Wing
          </div>
          <div style={{ fontSize: "0.6rem", color: "var(--fg-4)", fontStyle: "italic", letterSpacing: "0.01em" }}>
            Everything in here already happened.
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: "0.48rem", fontFamily: "monospace", lineHeight: 1.6 }}>
          <span style={{ color: AM.primary }}>{active.length}</span>
          <span style={{ color: "var(--fg-4)" }}> active</span>
          {archived.length > 0 && (
            <>
              <br />
              <span style={{ color: "var(--fg-4)" }}>{archived.length} archived</span>
            </>
          )}
        </div>
      </div>

      {/* Two-column body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Left: The Stacks */}
        <div style={{
          width: 228,
          flexShrink: 0,
          borderRight: `1px solid ${AM.border}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "9px 10px 7px",
            borderBottom: `1px solid ${AM.border}`,
          }}>
            <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-4)" }}>
              the stacks
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px 6px" }}>
            {active.length === 0 && archived.length === 0 ? (
              <div style={{ padding: "18px 8px", fontSize: "0.66rem", color: "var(--fg-4)", lineHeight: 1.75, fontStyle: "italic" }}>
                The stacks are empty.
                <br />
                <span style={{ fontSize: "0.6rem" }}>Declare something worth keeping.</span>
              </div>
            ) : (
              active.map(d => (
                <StackVolume
                  key={d.id}
                  declaration={d}
                  selected={selected?.id === d.id}
                  onSelect={setSelected}
                />
              ))
            )}

            {archived.length > 0 && (
              <>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  margin: "14px 4px 8px",
                  fontSize: "0.42rem",
                  fontFamily: "monospace",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--fg-4)",
                }}>
                  <div style={{ flex: 1, height: 1, background: AM.border }} />
                  archive
                  <div style={{ flex: 1, height: 1, background: AM.border }} />
                </div>
                {archived.map(d => (
                  <StackVolume
                    key={d.id}
                    declaration={d}
                    selected={selected?.id === d.id}
                    onSelect={setSelected}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Right: Reading room + consultation + input */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Reading room */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {selected ? (
              <div style={{ padding: "24px 28px 20px" }}>
                <div style={{
                  fontSize: "0.44rem",
                  fontFamily: "monospace",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: AM.primary + "70",
                  marginBottom: 12,
                }}>
                  {selected.type} · {selected.category}
                </div>

                <div style={{
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  color: "var(--fg)",
                  lineHeight: 1.45,
                  marginBottom: 20,
                  letterSpacing: "-0.01em",
                }}>
                  {selected.label}
                </div>

                <div style={{
                  fontSize: "0.8rem",
                  color: "var(--fg-2)",
                  lineHeight: 1.95,
                  marginBottom: 24,
                }}>
                  {selected.content}
                </div>

                {selected.originTension && (
                  <div style={{
                    padding: "12px 16px",
                    borderRadius: 6,
                    background: AM.dim,
                    border: `1px solid ${AM.primary}18`,
                    fontSize: "0.62rem",
                    color: "var(--fg-3)",
                    fontFamily: "monospace",
                    lineHeight: 1.8,
                    marginBottom: 20,
                  }}>
                    <span style={{ color: AM.primary }}>↳ chain of custody</span>
                    <br />
                    originated from KODEX tension
                    <br />
                    <span style={{ color: "var(--fg-4)", fontSize: "0.54rem" }}>
                      {selected.originTension}
                    </span>
                  </div>
                )}

                <div style={{
                  fontSize: "0.48rem",
                  fontFamily: "monospace",
                  color: "var(--fg-4)",
                  letterSpacing: "0.08em",
                }}>
                  recorded {new Date(selected.createdAt).toLocaleDateString([], {
                    weekday: "long", year: "numeric", month: "long", day: "numeric"
                  })}
                </div>
              </div>
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: "0.52rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--fg-4)", opacity: 0.35 }}>
                  select a record
                </div>
              </div>
            )}
          </div>

          {/* Consultation — archivist messages, compact */}
          {(archivistMsgs.length > 0 || thinking) && (
            <div style={{
              maxHeight: 210,
              overflowY: "auto",
              borderTop: `1px solid ${AM.border}`,
              padding: "10px 20px 6px",
              background: AM.card,
              flexShrink: 0,
            }}>
              <div style={{
                fontSize: "0.42rem",
                fontFamily: "monospace",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--fg-4)",
                marginBottom: 10,
              }}>consultation</div>

              {archivistMsgs.map((m, i) => (
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
                    color: m.role === "user" ? "var(--fg-4)" : AM.primary,
                    textTransform: "uppercase",
                    paddingTop: 3,
                    flexShrink: 0,
                  }}>
                    {m.role === "user" ? "you" : m.role === "error" ? "error" : "archivist"}
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
                  <span style={{ fontSize: "0.38rem", fontFamily: "monospace", color: AM.primary, textTransform: "uppercase", letterSpacing: "0.1em" }}>archivist</span>
                  {[0, 0.2, 0.4].map((d, i) => (
                    <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: AM.primary, animation: `blink 1.1s ${d}s infinite` }} />
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Input bar */}
          <div style={{
            borderTop: `1px solid ${AM.border}`,
            padding: "10px 16px",
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexShrink: 0,
            background: AM.bg,
          }}>
            <input
              value={input}
              onChange={e => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Record something…"
              style={{
                flex: 1,
                background: "rgba(200,149,90,0.04)",
                border: `1px solid ${AM.border}`,
                borderRadius: 6,
                padding: "9px 13px",
                fontSize: "0.78rem",
                color: "var(--fg)",
                outline: "none",
                fontFamily: "inherit",
                transition: "border-color 0.15s",
              }}
              onFocus={e => e.target.style.borderColor = AM.primary + "45"}
              onBlur={e => e.target.style.borderColor = AM.border}
            />
            <button
              onClick={() => onSend()}
              disabled={!input.trim() || thinking}
              style={{
                padding: "9px 18px",
                borderRadius: 6,
                background: input.trim() && !thinking ? AM.dim : "transparent",
                border: `1px solid ${input.trim() && !thinking ? AM.primary + "40" : AM.border}`,
                color: input.trim() && !thinking ? AM.primary : "var(--fg-4)",
                fontSize: "0.58rem",
                fontFamily: "monospace",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                cursor: input.trim() && !thinking ? "pointer" : "default",
                transition: "all 0.15s",
                flexShrink: 0,
              }}>
              record
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
