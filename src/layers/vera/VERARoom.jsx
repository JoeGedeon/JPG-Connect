// src/layers/vera/VERARoom.jsx
// VERA witness room — what persists, what changed, what remains unresolved
// Slate-blue palette. Still. Observational. Not a worker wing — an observer.

import { useState, useRef, useEffect } from "react"
import { loadAllCanon, loadOpenTensions, loadTensions, getStaleDoctrines, getPendingConflictReviews, resolveConflictReview, markReviewSurfaced, getGovernanceSummary, IMPORTANCE } from "../../engine/canon.js"
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

// ── GovernanceSummary ─────────────────────────────────────────────────────────
// Only renders when there is actual institutional pressure.
// Shows what needs attention — not what exists.

function GovernanceSummary({ summary, onScrollToReview, onGoToDoc }) {
  const hasPressure = summary.pendingCount > 0 || summary.mostConflicted || summary.needsAttention.length > 0 || !!summary.worstProjection
  if (!hasPressure) return null

  const GV = "#e8a87c"  // governance amber — distinct from VR.primary slate-blue

  function projColor(score) {
    if (score < 25) return "#ff6b6b"
    if (score < 50) return "#ff9f43"
    return GV
  }

  const chips = [
    summary.pendingCount > 0 && {
      key:     "pending",
      label:   "pending",
      value:   String(summary.pendingCount),
      sub:     null,
      onClick: () => onScrollToReview?.(),
    },
    summary.oldestPending?.declaration && {
      key:     "oldest",
      label:   "oldest",
      value:   (() => {
        const d = Math.floor((Date.now() - summary.oldestPending.createdAt) / 86400000)
        return d > 0 ? `${d}d` : "today"
      })(),
      sub:     summary.oldestPending.declaration.label,
      onClick: () => onScrollToReview?.(summary.oldestPending.id),
    },
    summary.mostChallenged && {
      key:     "challenged",
      label:   "most challenged",
      value:   `${summary.mostChallenged.challengeCount}×`,
      sub:     summary.mostChallenged.label,
      onClick: () => onGoToDoc?.(summary.mostChallenged.id),
    },
    summary.mostConflicted && {
      key:     "conflicted",
      label:   "most conflicted",
      value:   String(summary.mostConflicted.conflictCount),
      sub:     summary.mostConflicted.label,
      onClick: () => onGoToDoc?.(summary.mostConflicted.id),
    },
    summary.worstProjection && {
      key:        "forecast",
      label:      "projected 30d",
      value:      String(summary.worstProjection.score30d),
      valueColor: projColor(summary.worstProjection.score30d),
      sub:        summary.worstProjection.label,
      onClick:    () => onGoToDoc?.(summary.worstProjection.id),
    },
  ].filter(Boolean)

  return (
    <div style={{
      borderBottom: `1px solid rgba(232,168,124,0.15)`,
      padding: "14px 20px 12px",
      background: "rgba(232,168,124,0.02)",
      flexShrink: 0,
    }}>
      <div style={{ fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: GV + "60", marginBottom: 12 }}>
        governance
      </div>

      {/* Pressure chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
        {chips.map(({ key, label, value, sub, onClick, valueColor }) => (
          <div key={key} onClick={onClick} style={{
            padding: "7px 11px",
            borderRadius: 5,
            background: "rgba(232,168,124,0.05)",
            border: `1px solid rgba(232,168,124,0.18)`,
            minWidth: 70,
            cursor: onClick ? "pointer" : "default",
          }}>
            <div style={{ fontSize: "1.1rem", fontWeight: 200, color: valueColor || GV, lineHeight: 1, marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", color: GV + "60" }}>{label}</div>
            {sub && (
              <div style={{ fontSize: "0.48rem", color: "var(--fg-4)", marginTop: 4, lineHeight: 1.35, maxWidth: 140, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                {sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Needs attention */}
      {summary.needsAttention.length > 0 && (
        <div>
          <div style={{ fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.14em", textTransform: "uppercase", color: GV + "50", marginBottom: 8 }}>
            needs attention
          </div>
          {summary.needsAttention.map(item => (
            <div
              key={item.id}
              onClick={() => item.type === "review" ? onScrollToReview?.(item.reviewId) : onGoToDoc?.(item.id)}
              style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6, cursor: "pointer" }}
            >
              <span style={{ color: GV, fontSize: "0.52rem", flexShrink: 0 }}>↗</span>
              <span style={{ fontSize: "0.6rem", color: "var(--fg-2)", lineHeight: 1.35, flex: 1 }}>{item.label}</span>
              <span style={{ fontSize: "0.48rem", fontFamily: "monospace", color: GV + "70", flexShrink: 0 }}>{item.reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function VERARoom({ messages, thinking, input, onInputChange, onSend, onGoTo, saveStatus = "ok" }) {
  const { delta, lastSessionAt } = getDeltaFromPreviousSession()
  const allCanon     = loadAllCanon()
  const openTensions = loadOpenTensions()
  const allTensions  = loadTensions()
  const stale        = getStaleDoctrines(30)
  const tasks        = loadStorage()?.tasks || []
  const bottomRef    = useRef(null)
  const reviewSectionRef = useRef(null)

  const [reviews, setReviews]   = useState(() => getPendingConflictReviews())
  const governance = getGovernanceSummary()
  const [noteFor, setNoteFor]   = useState(null)   // { reviewId, decision } | null
  const [noteText, setNoteText] = useState("")

  function scrollToReview(reviewId) {
    if (!reviewSectionRef.current) return
    if (reviewId) {
      const el = reviewSectionRef.current.querySelector(`[data-review-id="${reviewId}"]`)
      ;(el || reviewSectionRef.current).scrollIntoView({ behavior: "smooth", block: "nearest" })
    } else {
      reviewSectionRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }

  // Mark reviews as surfaced when they first appear in the UI
  useEffect(() => {
    reviews.filter(r => !r.surfacedAt).forEach(r => markReviewSurfaced(r.id))
  }, [reviews.length])

  function startNote(reviewId, decision) {
    if (decision === "ignore") {
      commitReview(reviewId, "ignore", "")
    } else {
      setNoteFor({ reviewId, decision })
      setNoteText("")
    }
  }

  function commitReview(reviewId, decision, note) {
    resolveConflictReview(reviewId, decision, note)
    setNoteFor(null)
    setNoteText("")
    setReviews(getPendingConflictReviews())
  }

  function handleNoteKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitReview(noteFor.reviewId, noteFor.decision, noteText) }
    if (e.key === "Escape") { setNoteFor(null); setNoteText("") }
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

              {/* Session memory — reflects last saveStorage outcome */}
              {saveStatus === "failed" ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: "0.52rem", color: "#ff6b6b", fontFamily: "monospace" }}>session will not persist</div>
                  <div style={{ fontSize: "0.52rem", color: "#ff6b6b60", fontFamily: "monospace" }}>storage full</div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: "0.52rem", color: "var(--fg-4)", fontFamily: "monospace" }}>session memory</div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: saveStatus === "trimmed" ? "#ff9f43" : VR.primary }}>
                    {messages.filter(m => m.role === "user" || m.role === "bot").length} msgs held
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: delta + guide consultation */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          <GovernanceSummary
            summary={governance}
            onScrollToReview={scrollToReview}
            onGoToDoc={id => onGoTo?.("archivist", id)}
          />

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
            <div ref={reviewSectionRef} style={{
              borderTop: `1px solid ${VR.border}`,
              flexShrink: 0,
              maxHeight: 260,
              overflowY: "auto",
              background: "rgba(232,168,124,0.03)",
            }}>
              <div style={{ padding: "9px 20px 0", fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "#e8a87c60", marginBottom: 8 }}>
                doctrine review required
              </div>
              {reviews.map(r => {
                const inNoteMode = noteFor?.reviewId === r.id
                return (
                  <div key={r.id} data-review-id={r.id} style={{
                    margin: "0 12px 8px",
                    padding: "10px 12px",
                    borderRadius: 6,
                    background: VR.card,
                    border: "1px solid " + VR.border,
                    borderLeft: `2px solid ${inNoteMode ? (noteFor.decision === "conflict" ? "#ff6b6b40" : VR.primary + "40") : "#e8a87c30"}`,
                    transition: "border-left-color 0.15s",
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

                    {inNoteMode ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          autoFocus
                          value={noteText}
                          onChange={e => setNoteText(e.target.value)}
                          onKeyDown={handleNoteKey}
                          placeholder="why? (optional — Enter to confirm, Esc to cancel)"
                          style={{
                            flex: 1,
                            background: "transparent",
                            border: `1px solid ${noteFor.decision === "conflict" ? "#ff6b6b30" : VR.primary + "30"}`,
                            borderRadius: 4,
                            padding: "5px 8px",
                            fontSize: "0.58rem",
                            color: "var(--fg-2)",
                            fontFamily: "inherit",
                            outline: "none",
                          }}
                        />
                        <button
                          onClick={() => commitReview(r.id, noteFor.decision, noteText)}
                          style={{
                            padding: "5px 10px",
                            borderRadius: 4,
                            border: `1px solid ${noteFor.decision === "conflict" ? "#ff6b6b40" : VR.primary + "40"}`,
                            background: "transparent",
                            color: noteFor.decision === "conflict" ? "#ff6b6b" : VR.primary,
                            fontSize: "0.44rem",
                            fontFamily: "monospace",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                          }}>
                          {noteFor.decision}
                        </button>
                        <button
                          onClick={() => { setNoteFor(null); setNoteText("") }}
                          style={{ background: "none", border: "none", color: "var(--fg-4)", cursor: "pointer", fontSize: "0.6rem", padding: "0 2px" }}>
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 6 }}>
                        {[
                          { decision: "conflict", label: "conflict", color: "#ff6b6b" },
                          { decision: "link",     label: "link",     color: VR.primary },
                          { decision: "ignore",   label: "ignore",   color: "var(--fg-4)" },
                        ].map(({ decision, label, color }) => (
                          <button
                            key={decision}
                            onClick={() => startNote(r.id, decision)}
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
                    )}
                  </div>
                )
              })}
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

          {/* Guide query — minimal. VERA observes first, interprets on request. */}
          <div style={{
            padding: "5px 20px 10px",
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexShrink: 0,
            background: VR.bg,
          }}>
            <input
              value={input}
              onChange={e => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ask vera to interpret…"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                borderBottom: `1px solid ${VR.border}`,
                borderRadius: 0,
                padding: "3px 0",
                fontSize: "0.62rem",
                color: "var(--fg-2)",
                outline: "none",
                fontFamily: "inherit",
                transition: "border-color 0.15s",
              }}
              onFocus={e => e.target.style.borderBottomColor = VR.primary + "55"}
              onBlur={e => e.target.style.borderBottomColor = VR.border}
            />
            {input.trim() && (
              <button
                onClick={() => onSend()}
                disabled={!input.trim() || thinking}
                style={{
                  padding: "2px 9px",
                  borderRadius: 3,
                  background: "transparent",
                  border: `1px solid ${VR.primary}30`,
                  color: VR.primary,
                  fontSize: "0.44rem",
                  fontFamily: "monospace",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  cursor: thinking ? "default" : "pointer",
                  flexShrink: 0,
                  opacity: thinking ? 0.4 : 1,
                  transition: "opacity 0.15s",
                }}>
                reflect
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
