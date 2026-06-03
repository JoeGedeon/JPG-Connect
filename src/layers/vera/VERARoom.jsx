// src/layers/vera/VERARoom.jsx
// VERA witness room — what persists, what changed, what remains unresolved
// Slate-blue palette. Still. Observational. Not a worker wing — an observer.

import { useState, useRef, useEffect } from "react"
import { loadAllCanon, loadOpenTensions, loadTensions, getStaleDoctrines, getPendingConflictReviews, resolveConflictReview, IMPORTANCE } from "../../engine/canon.js"
import { getDeltaFromPreviousSession, SIGNAL_TYPES } from "../../engine/signals.js"
import { loadStorage } from "../../utils/storage.js"
import { formatMessage } from "../../utils/formatMessage.jsx"

const VR = {
  bg:      "#07090d",
  card:    "#0b0d12",
  border:  "#171c26",
  primary: "#8daac4",
  dim:     "rgba(141,170,196,0.07)",
  glow:    "rgba(141,170,196,0.18)",
}

const DELTA_LABEL = {
  [SIGNAL_TYPES.DECLARATION_CREATED]:      "declared",
  [SIGNAL_TYPES.DECLARATION_RELEASED]:     "released",
  [SIGNAL_TYPES.TASK_CREATED]:             "tasks added",
  [SIGNAL_TYPES.TASK_COMPLETED]:           "tasks done",
  [SIGNAL_TYPES.TASK_STALE]:               "stale",
  [SIGNAL_TYPES.MEMORY_RECORDED]:          "recorded",
  [SIGNAL_TYPES.INTERPRETATION_REQUESTED]: "tensions opened",
  [SIGNAL_TYPES.OBJECTIVE_UPDATED]:        "updated",
}

const SEED_PREFIXES = ["KX-", "PFP-", "AP-", "AWK-", "GENESIS-", "PACER-", "VERA-"]

function sessionAge(ts) {
  if (!ts) return null
  const diff = Date.now() - ts
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

export default function VERARoom({ messages, thinking, input, onInputChange, onSend }) {
  const { delta, lastSessionAt } = getDeltaFromPreviousSession()
  const allCanon     = loadAllCanon()
  const openTensions = loadOpenTensions()
  const allTensions  = loadTensions()
  const stale        = getStaleDoctrines(30)
  const tasks        = loadStorage()?.tasks || []
  const bottomRef    = useRef(null)

  const [reviews, setReviews] = useState(() => getPendingConflictReviews())

  function handleReview(reviewId, decision) {
    resolveConflictReview(reviewId, decision)
    setReviews(getPendingConflictReviews())
  }

  const declarations    = allCanon.filter(d => d.status === "active" && !SEED_PREFIXES.some(p => d.label?.startsWith(p)))
  const seeds           = allCanon.filter(d => SEED_PREFIXES.some(p => d.label?.startsWith(p)))
  const resolvedCount   = allTensions.filter(t => t.status === "resolved").length
  const staleFoundational = stale.filter(d => d.importance === IMPORTANCE.FOUNDATIONAL)

  const veraMsgs = messages.filter(
    m => m.lane === "vera" && (m.role === "user" || m.role === "bot" || m.role === "error")
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, thinking])

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend() }
  }

  // Group delta signals by label
  const deltaCounts = {}
  delta.forEach(s => {
    const key = DELTA_LABEL[s.type] || s.type
    deltaCounts[key] = (deltaCounts[key] || 0) + 1
  })

  const stats = [
    { label: "declarations",    value: declarations.length },
    { label: "open tensions",   value: openTensions.length },
    { label: "stale doctrine",  value: stale.length,     alert: staleFoundational.length > 0 },
    { label: "review required", value: reviews.length,   alert: reviews.length > 0 },
  ]

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: VR.bg,
      overflow: "hidden",
      backgroundImage: "repeating-linear-gradient(180deg, rgba(141,170,196,0.018) 0px, rgba(141,170,196,0.018) 1px, transparent 1px, transparent 28px)",
    }}>

      {/* Room header */}
      <div style={{
        padding: "12px 20px 11px",
        borderBottom: `1px solid ${VR.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div>
          <div style={{
            fontSize: "0.72rem",
            fontWeight: 200,
            letterSpacing: "0.55em",
            color: VR.primary,
            textTransform: "uppercase",
            marginBottom: 4,
            animation: "pulse 6s ease-in-out infinite",
          }}>
            V · E · R · A
          </div>
          <div style={{ fontSize: "0.48rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-4)" }}>
            witness room
          </div>
        </div>
        {lastSessionAt && (
          <div style={{ textAlign: "right", fontSize: "0.48rem", fontFamily: "monospace", color: "var(--fg-4)", lineHeight: 1.7 }}>
            <div>last session</div>
            <div style={{ color: VR.primary + "90" }}>{sessionAge(lastSessionAt)}</div>
          </div>
        )}
      </div>

      {/* Two-panel body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Left: identity — what persists */}
        <div style={{
          width: 200,
          flexShrink: 0,
          borderRight: `1px solid ${VR.border}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          <div style={{ padding: "9px 14px 7px", borderBottom: `1px solid ${VR.border}` }}>
            <div style={{ fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-4)" }}>
              identity · what persists
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px" }}>
            {stats.map(({ label, value, alert }) => (
              <div key={label} style={{ marginBottom: 22 }}>
                <div style={{
                  fontSize: "1.6rem",
                  fontWeight: 200,
                  color: alert && value > 0 ? "#e8a87c" : VR.primary,
                  lineHeight: 1,
                  opacity: value === 0 ? 0.35 : 1,
                  transition: "color 0.3s, opacity 0.3s",
                }}>
                  {value}
                </div>
                <div style={{
                  fontSize: "0.44rem",
                  fontFamily: "monospace",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: alert && value > 0 ? "#e8a87c60" : "var(--fg-4)",
                  marginTop: 5,
                }}>
                  {label}
                </div>
              </div>
            ))}

            {/* current state */}
            <div style={{ marginTop: 12, paddingTop: 16, borderTop: `1px solid ${VR.border}` }}>
              <div style={{ fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 12 }}>
                current state
              </div>
              {[
                { key: "doctrine",  label: "doctrine debt", value: openTensions.length, alert: openTensions.length > 0, alertColor: "#c87dff" },
                { key: "memory",    label: "active memory",  value: declarations.length, alert: false },
                { key: "execution", label: "tasks queued",   value: tasks.filter(t => ["pending","approved","executing"].includes(t.status)).length, alert: false },
              ].map(({ key, label, value, alert, alertColor }) => (
                <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: "0.52rem", color: "var(--fg-4)", fontFamily: "monospace" }}>{label}</div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: alert ? alertColor : VR.primary, opacity: value === 0 ? 0.35 : 1 }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: delta + guide consultation */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Delta surface */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 14 }}>
              since your last session
            </div>

            {delta.length === 0 ? (
              <div style={{ fontSize: "0.7rem", color: "var(--fg-4)", lineHeight: 1.8, fontStyle: "italic" }}>
                {lastSessionAt
                  ? "Nothing was recorded between sessions."
                  : "This is your first session."}
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 28 }}>
                {Object.entries(deltaCounts).map(([label, count]) => (
                  <div key={label} style={{
                    padding: "5px 11px",
                    borderRadius: 4,
                    background: VR.dim,
                    border: `1px solid ${VR.primary}20`,
                    fontSize: "0.6rem",
                    fontFamily: "monospace",
                    color: "var(--fg-3)",
                  }}>
                    <span style={{ fontWeight: 700, color: VR.primary }}>{count}</span>{" "}{label}
                  </div>
                ))}
              </div>
            )}

            {/* Unresolved tensions — always surfaced in VERA */}
            {openTensions.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 12 }}>
                  unresolved · KODEX
                </div>
                {openTensions.map(t => {
                  const daysOpen = Math.floor((Date.now() - t.createdAt) / 86400000)
                  return (
                    <div key={t.id} style={{
                      marginBottom: 8,
                      padding: "10px 14px",
                      borderRadius: 6,
                      background: VR.card,
                      border: "1px solid " + VR.border,
                      borderLeft: "2px solid #c87dff40",
                    }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                        <div style={{ fontSize: "0.68rem", color: "var(--fg-2)", lineHeight: 1.65, flex: 1 }}>
                          {t.title || t.statement}
                        </div>
                        {daysOpen > 0 && (
                          <div style={{ fontSize: "0.44rem", fontFamily: "monospace", color: daysOpen > 7 ? "#e8a87c" : "var(--fg-4)", flexShrink: 0 }}>
                            {daysOpen}d
                          </div>
                        )}
                      </div>
                      {t.affectedWings?.length > 0 && (
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          {t.affectedWings.map(w => (
                            <span key={w} style={{ fontSize: "0.44rem", fontFamily: "monospace", color: "#c87dff60", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                              {w}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Stale doctrine — foundational declarations not recently referenced */}
            {staleFoundational.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "#e8a87c60", marginBottom: 12 }}>
                  foundational · not recently referenced
                </div>
                {staleFoundational.slice(0, 4).map(d => {
                  const daysSince = d.lastReferenced
                    ? Math.floor((Date.now() - d.lastReferenced) / 86400000)
                    : null
                  return (
                    <div key={d.id} style={{
                      marginBottom: 7,
                      padding: "9px 12px",
                      borderRadius: 5,
                      background: VR.card,
                      border: "1px solid " + VR.border,
                      borderLeft: "2px solid #e8a87c30",
                    }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ fontSize: "0.63rem", color: "var(--fg-3)", lineHeight: 1.45, flex: 1 }}>
                          {d.label}
                        </div>
                        <div style={{ fontSize: "0.44rem", fontFamily: "monospace", color: "#e8a87c70", flexShrink: 0 }}>
                          {daysSince !== null ? `${daysSince}d ago` : "never"}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Conflict review — new declarations vs foundational doctrine */}
          {reviews.length > 0 && (
            <div style={{
              borderTop: `1px solid ${VR.border}`,
              flexShrink: 0,
              maxHeight: 260,
              overflowY: "auto",
              background: "rgba(232,168,124,0.03)",
            }}>
              <div style={{ padding: "9px 20px 0", fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "#e8a87c60", marginBottom: 8 }}>
                doctrine review required
              </div>
              {reviews.map(r => (
                <div key={r.id} style={{
                  margin: "0 12px 8px",
                  padding: "10px 12px",
                  borderRadius: 6,
                  background: VR.card,
                  border: "1px solid " + VR.border,
                  borderLeft: "2px solid #e8a87c30",
                }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.58rem", color: "var(--fg-2)", lineHeight: 1.4, marginBottom: 3 }}>
                        {r.newDeclaration.label}
                      </div>
                      <div style={{ fontSize: "0.42rem", fontFamily: "monospace", color: "var(--fg-4)" }}>new · {r.newDeclaration.category}</div>
                    </div>
                    <div style={{ fontSize: "0.6rem", color: "var(--fg-4)", flexShrink: 0, paddingTop: 2 }}>vs</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.58rem", color: "#e8a87c", lineHeight: 1.4, marginBottom: 3 }}>
                        {r.foundational.label}
                      </div>
                      <div style={{ fontSize: "0.42rem", fontFamily: "monospace", color: "#e8a87c60" }}>foundational · {r.foundational.category}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[
                      { decision: "conflict", label: "conflict", color: "#ff6b6b" },
                      { decision: "link",     label: "link",     color: VR.primary },
                      { decision: "ignore",   label: "ignore",   color: "var(--fg-4)" },
                    ].map(({ decision, label, color }) => (
                      <button
                        key={decision}
                        onClick={() => handleReview(r.id, decision)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 4,
                          border: `1px solid ${color}30`,
                          background: "transparent",
                          color,
                          fontSize: "0.44rem",
                          fontFamily: "monospace",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          cursor: "pointer",
                          transition: "all 0.12s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = `${color}12`}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Guide consultation */}
          {(veraMsgs.length > 0 || thinking) && (
            <div style={{
              maxHeight: 190,
              overflowY: "auto",
              borderTop: `1px solid ${VR.border}`,
              padding: "10px 20px 6px",
              background: VR.card,
              flexShrink: 0,
            }}>
              <div style={{ fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 10 }}>
                guide
              </div>
              {veraMsgs.map((m, i) => (
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
                    color: m.role === "user" ? "var(--fg-4)" : VR.primary,
                    textTransform: "uppercase",
                    paddingTop: 3,
                    flexShrink: 0,
                  }}>
                    {m.role === "user" ? "you" : m.role === "error" ? "error" : "vera"}
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
                  <span style={{ fontSize: "0.38rem", fontFamily: "monospace", color: VR.primary, textTransform: "uppercase", letterSpacing: "0.1em" }}>vera</span>
                  {[0, 0.2, 0.4].map((d, i) => (
                    <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: VR.primary, animation: `blink 1.1s ${d}s infinite` }} />
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Input bar */}
          <div style={{
            borderTop: `1px solid ${VR.border}`,
            padding: "10px 16px",
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexShrink: 0,
            background: VR.bg,
          }}>
            <input
              value={input}
              onChange={e => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What do you want to understand…"
              style={{
                flex: 1,
                background: "rgba(141,170,196,0.03)",
                border: `1px solid ${VR.border}`,
                borderRadius: 6,
                padding: "9px 13px",
                fontSize: "0.78rem",
                color: "var(--fg)",
                outline: "none",
                fontFamily: "inherit",
                transition: "border-color 0.15s",
              }}
              onFocus={e => e.target.style.borderColor = VR.primary + "45"}
              onBlur={e => e.target.style.borderColor = VR.border}
            />
            <button
              onClick={() => onSend()}
              disabled={!input.trim() || thinking}
              style={{
                padding: "9px 18px",
                borderRadius: 6,
                background: input.trim() && !thinking ? VR.dim : "transparent",
                border: `1px solid ${input.trim() && !thinking ? VR.primary + "40" : VR.border}`,
                color: input.trim() && !thinking ? VR.primary : "var(--fg-4)",
                fontSize: "0.58rem",
                fontFamily: "monospace",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                cursor: input.trim() && !thinking ? "pointer" : "default",
                transition: "all 0.15s",
                flexShrink: 0,
              }}>
              reflect
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
