// src/layers/atrium/AtriumRoom.jsx
// Atrium Briefing v1 — the front door shows one move, explains why, gives one door.
// Observation intake collapses to a drawer. Council debates. Atrium decides.

import { useState, useEffect, useRef }       from "react"
import { conductorPrioritize }               from "../../engine/conductor.js"
import { getActiveJourney, moveJourney }     from "../../engine/journeys.js"
import { LANE_MAP }                          from "../../config/lanes.js"
import {
  recordObservation, getObservations, OBS_TAGS,
} from "../../engine/observations.js"
import { recordSignal, SIGNAL_TYPES, getRecentSignals } from "../../engine/signals.js"
import { buildAtriumURL, ATRIUM_URL }                   from "../../engine/atriumBridge.js"

const COLOR  = "#5bafd6"
const DIM    = "rgba(91,175,214,0.07)"
const BORDER = "rgba(91,175,214,0.18)"

// Conductor seats → navigable lane IDs
const SEAT_TO_LANE = {
  opscore:   "ops",
  archivist: "archivist",
  kodex:     "creative",
  vera:      "vera",
  muse:      "muse",
  pacer:     "council",
  reality:   null,
}

function greeting() {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return "Good morning."
  if (h >= 12 && h < 17) return "Good afternoon."
  if (h >= 17 && h < 22) return "Good evening."
  return "Still at it."
}

function timeAgo(ts) {
  const d = Date.now() - ts
  if (d < 60000)    return "just now"
  if (d < 3600000)  return `${Math.floor(d / 60000)}m ago`
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`
  return `${Math.floor(d / 86400000)}d ago`
}

// ── BriefingCard ─────────────────────────────────────────────────────────────

function BriefingCard({ priority, journey, onEnter }) {
  // Derive the one move: journey recommendation takes precedence over conductor
  let destLaneId, action, reason, label, confidence, urgencyLabel

  const jr = priority.journeyRecommendation

  if (jr) {
    destLaneId   = jr.nextRoom
    action       = jr.reason
    reason       = priority.action || null
    label        = LANE_MAP[destLaneId]?.label || destLaneId.toUpperCase()
    confidence   = priority.confidence
    urgencyLabel = priority.urgencyLabel
  } else if (priority.seat !== "reality") {
    destLaneId   = SEAT_TO_LANE[priority.seat] || null
    action       = priority.action
    reason       = priority.summary
    label        = LANE_MAP[destLaneId]?.label || priority.seat.toUpperCase()
    confidence   = priority.confidence
    urgencyLabel = priority.urgencyLabel
  } else {
    // All clear — quiet state
    destLaneId   = null
    action       = "A quiet moment is good for reflection or intention."
    reason       = "No active signals. No stale tasks. No schedule pressure."
    label        = null
    confidence   = null
    urgencyLabel = "When ready"
  }

  const destColor = (destLaneId && LANE_MAP[destLaneId]?.color) || COLOR
  const destDim   = (destLaneId && LANE_MAP[destLaneId]?.dim)   || DIM

  return (
    <div style={{
      padding: "18px 20px",
      borderRadius: 10,
      border: `1px solid ${destColor}30`,
      background: `${destColor}06`,
      animation: "fadeUp 0.3s ease",
    }}>
      {/* Type + urgency header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: destColor }}>
          Recommended Next Move
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {urgencyLabel && (
            <span style={{ fontSize: "0.42rem", fontFamily: "monospace", color: "var(--fg-4)", letterSpacing: "0.08em" }}>
              {urgencyLabel}
            </span>
          )}
          {confidence !== null && (
            <span style={{ fontSize: "0.48rem", fontFamily: "monospace", color: destColor, fontWeight: 700 }}>
              {confidence}%
            </span>
          )}
        </div>
      </div>

      {/* Destination label */}
      {label && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: destColor, boxShadow: `0 0 6px ${destColor}` }} />
          <span style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.14em", fontFamily: "monospace", textTransform: "uppercase", color: destColor }}>
            {label}
          </span>
        </div>
      )}

      {/* Action */}
      <div style={{ fontSize: "0.82rem", color: "var(--fg-2)", lineHeight: 1.55, marginBottom: reason ? 10 : 14 }}>
        {action}
      </div>

      {/* Reason */}
      {reason && (
        <div style={{ marginBottom: 14, padding: "8px 11px", borderRadius: 5, background: "var(--bg-panel)", border: `1px solid ${destColor}15` }}>
          <div style={{ fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 3 }}>why this matters</div>
          <div style={{ fontSize: "0.66rem", color: "var(--fg-3)", lineHeight: 1.45 }}>{reason}</div>
        </div>
      )}

      {/* CTA */}
      {destLaneId ? (
        <button
          onClick={() => { moveJourney(destLaneId, action); onEnter?.(destLaneId) }}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 6,
            border: `1px solid ${destColor}50`, background: destDim,
            color: destColor, fontSize: "0.62rem", fontFamily: "monospace",
            fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
            cursor: "pointer", transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `${destColor}18`; e.currentTarget.style.borderColor = `${destColor}80` }}
          onMouseLeave={e => { e.currentTarget.style.background = destDim; e.currentTarget.style.borderColor = `${destColor}50` }}
        >
          Enter {label} →
        </button>
      ) : (
        <div style={{ fontSize: "0.54rem", color: "var(--fg-4)", fontFamily: "monospace", fontStyle: "italic" }}>
          No action required right now.
        </div>
      )}
    </div>
  )
}

// ── JourneyStrip ─────────────────────────────────────────────────────────────

function JourneyStrip({ journey }) {
  const stops = [journey.originRoom, ...journey.trail.map(s => s.to)]
  const seen  = new Set()
  const unique = stops.filter(r => { if (seen.has(r)) return false; seen.add(r); return true })

  return (
    <div style={{
      padding: "10px 14px",
      borderRadius: 7,
      background: "rgba(240,160,64,0.05)",
      border: "1px solid rgba(240,160,64,0.18)",
      marginBottom: 14,
    }}>
      <div style={{ fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.16em", textTransform: "uppercase", color: "#f0a040", marginBottom: 7, opacity: 0.85 }}>
        Active Journey · {unique.length} room{unique.length !== 1 ? "s" : ""}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", marginBottom: journey.carrying?.summary ? 7 : 0 }}>
        {unique.map((room, i) => {
          const l         = LANE_MAP[room]
          const isCurrent = room === journey.currentRoom
          return (
            <span key={room + i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              {i > 0 && <span style={{ fontSize: "0.48rem", color: "rgba(240,160,64,0.4)", fontFamily: "monospace" }}>→</span>}
              <span style={{
                fontSize: isCurrent ? "0.58rem" : "0.52rem",
                fontWeight: isCurrent ? 700 : 400,
                fontFamily: "monospace",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: isCurrent ? "#f0a040" : "rgba(240,160,64,0.55)",
              }}>
                {l?.label || room.toUpperCase()}
              </span>
            </span>
          )
        })}
      </div>
      {journey.carrying?.summary && (
        <div style={{ fontSize: "0.58rem", color: "var(--fg-4)", fontStyle: "italic", lineHeight: 1.4 }}>
          {journey.carrying.summary.length > 80
            ? journey.carrying.summary.slice(0, 80) + "…"
            : journey.carrying.summary}
        </div>
      )}
    </div>
  )
}

// ── ObservationDrawer ──────────────────────────────────────────────────────────

function ObservationDrawer() {
  const [open, setOpen]               = useState(false)
  const [content, setContent]         = useState("")
  const [tags, setTags]               = useState([])
  const [justRecorded, setRecorded]   = useState(false)
  const [obsCount, setObsCount]       = useState(() => getObservations(1).length > 0 ? getObservations(50).length : 0)
  const textareaRef                   = useRef(null)

  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 80)
  }, [open])

  function toggleTag(label) {
    setTags(prev => prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label])
  }

  function handleRecord() {
    if (!content.trim()) return
    const obs = recordObservation({ content: content.trim(), tags })
    recordSignal({ type: SIGNAL_TYPES.OBSERVATION_LOGGED, source: "atrium", title: obs.content.slice(0, 80), summary: obs.content })
    setObsCount(c => c + 1)
    setContent("")
    setTags([])
    setRecorded(true)
    setTimeout(() => { setRecorded(false); setOpen(false) }, 1800)
  }

  return (
    <div style={{
      borderRadius: 8,
      border: open ? `1px solid ${BORDER}` : "1px solid var(--border-lo)",
      background: open ? DIM : "transparent",
      overflow: "hidden",
      transition: "border-color 0.15s, background 0.15s",
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px", background: "transparent", border: "none",
          cursor: "pointer", color: open ? COLOR : "var(--fg-4)", transition: "color 0.15s",
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.color = "var(--fg-3)" }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.color = "var(--fg-4)" }}
      >
        <span style={{ fontSize: "0.54rem", fontFamily: "monospace", letterSpacing: "0.12em" }}>
          {open ? "▾" : "▸"} Record an observation
        </span>
        {obsCount > 0 && !open && (
          <span style={{ fontSize: "0.44rem", fontFamily: "monospace", color: "var(--fg-4)", opacity: 0.6 }}>
            {obsCount} preserved
          </span>
        )}
      </button>

      {open && (
        <div style={{ padding: "0 14px 14px", animation: "fadeUp 0.15s ease" }}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleRecord() }}
            placeholder="Describe what you saw, heard, or felt. No format required."
            rows={3}
            style={{
              width: "100%", resize: "none",
              background: "var(--bg-input)", border: "1px solid var(--border-lo)",
              borderRadius: 6, padding: "9px 11px",
              color: "var(--fg-body)", fontSize: "0.76rem", lineHeight: 1.55,
              fontFamily: "inherit", outline: "none", transition: "border-color 0.15s",
              marginBottom: 8,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = `${COLOR}50` }}
            onBlur={e =>  { e.currentTarget.style.borderColor = "var(--border-lo)" }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {OBS_TAGS.map(t => (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  style={{
                    padding: "2px 7px", borderRadius: 3, cursor: "pointer",
                    border: `1px solid ${tags.includes(t) ? COLOR + "80" : "var(--border-lo)"}`,
                    background: tags.includes(t) ? DIM : "transparent",
                    color: tags.includes(t) ? COLOR : "var(--fg-4)",
                    fontSize: "0.48rem", fontFamily: "monospace", letterSpacing: "0.08em",
                    textTransform: "uppercase", fontWeight: tags.includes(t) ? 700 : 400,
                    transition: "all 0.12s",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              onClick={handleRecord}
              disabled={!content.trim()}
              style={{
                padding: "6px 14px", borderRadius: 5, flexShrink: 0,
                border: `1px solid ${content.trim() ? COLOR + "60" : "var(--border-lo)"}`,
                background: content.trim() ? DIM : "transparent",
                color: content.trim() ? COLOR : "var(--fg-4)",
                fontSize: "0.58rem", fontFamily: "monospace", fontWeight: 700,
                letterSpacing: "0.1em", cursor: content.trim() ? "pointer" : "default",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (content.trim()) e.currentTarget.style.background = `${COLOR}15` }}
              onMouseLeave={e => { if (content.trim()) e.currentTarget.style.background = DIM }}
            >
              {justRecorded ? "Preserved ✓" : "Record →"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── PACERBriefing ─────────────────────────────────────────────────────────────
// PACER speaks first. 2–4 sentences synthesized from conductor + signals.
// No AI call — deterministic. Updates every session.

function buildBriefingLines(priority, journey, recentSignals) {
  const lines = []

  if (journey) {
    const currentLabel = LANE_MAP[journey.currentRoom]?.label || journey.currentRoom
    lines.push(`${currentLabel} has your active attention.`)
    if (journey.carrying?.summary) {
      const s = journey.carrying.summary
      lines.push(s.length > 90 ? s.slice(0, 90) + "…" : s)
    }
  }

  if (priority && priority.seat !== "reality") {
    if (priority.urgency === "critical") lines.push("Immediate attention required. " + (priority.summary || ""))
    else if (priority.summary)            lines.push(priority.summary)
  } else if (priority && priority.seat === "reality" && !journey) {
    lines.push("No signal requires action. The institution is quiet.")
  }

  const dormant = recentSignals.some(s => s.type === SIGNAL_TYPES.CREATIVE_DORMANCY)
  if (dormant) lines.push("MUSE has detected creative dormancy — no new hypotheses in recent sessions.")

  return lines
}

function PACERBriefing({ priority, journey, recentSignals }) {
  const lines = buildBriefingLines(priority, journey, recentSignals)
  if (lines.length === 0) return null

  return (
    <div style={{ marginBottom: 22 }}>
      {lines.map((line, i) => (
        <p key={i} style={{
          margin: 0,
          marginBottom: i < lines.length - 1 ? 7 : 0,
          fontSize:     i === 0 ? "0.88rem" : "0.76rem",
          fontWeight:   i === 0 ? 400 : 300,
          color:        i === 0 ? "var(--fg-2)" : "var(--fg-3)",
          lineHeight:   1.65,
        }}>
          {line}
        </p>
      ))}
    </div>
  )
}

// ── AtriumRoom ────────────────────────────────────────────────────────────────

export default function AtriumRoom({ onGoTo }) {
  const [priority, setPriority]       = useState(null)
  const [journey, setJourney]         = useState(null)
  const [recentSignals, setRecentSigs] = useState([])

  useEffect(() => {
    setPriority(conductorPrioritize())
    setJourney(getActiveJourney())
    setRecentSigs(
      getRecentSignals(50).filter(s =>
        s.type !== SIGNAL_TYPES.SESSION_OPENED && s.type !== SIGNAL_TYPES.SESSION_CLOSED
      )
    )
  }, [])

  return (
    <div style={{
      flex: 1, overflowY: "auto", padding: "32px 36px 40px",
      display: "flex", flexDirection: "column", maxWidth: 640, alignSelf: "center", width: "100%",
    }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <span style={{ fontSize: "1.4rem", filter: "hue-rotate(150deg) saturate(0.85) brightness(0.8)", lineHeight: 1, userSelect: "none", flexShrink: 0 }}>🍍</span>
        <div>
          <div style={{ fontSize: "0.5rem", fontFamily: "monospace", letterSpacing: "0.22em", textTransform: "uppercase", color: COLOR, marginBottom: 2 }}>ATRIUM</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 300, color: "var(--fg-2)", letterSpacing: "0.02em" }}>{greeting()}</div>
        </div>
      </div>

      {/* PACER speaks first — deterministic briefing prose */}
      {priority && (
        <PACERBriefing
          priority={priority}
          journey={journey}
          recentSignals={recentSignals}
        />
      )}

      {/* Active Journey strip */}
      {journey && <JourneyStrip journey={journey} />}

      {/* Briefing — one move */}
      {priority && (
        <BriefingCard
          priority={priority}
          journey={journey}
          onEnter={onGoTo}
        />
      )}

      {/* Talk to PACER */}
      <div style={{ marginTop: 14, marginBottom: 4 }}>
        <button
          onClick={() => onGoTo?.("council")}
          style={{
            width: "100%", padding: "9px 0", borderRadius: 6,
            border: `1px solid ${COLOR}25`,
            background: "transparent",
            color: "var(--fg-4)",
            fontSize: "0.58rem", fontFamily: "monospace",
            fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
            cursor: "pointer", transition: "all 0.15s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = `${COLOR}55`
            e.currentTarget.style.color = COLOR
            e.currentTarget.style.background = DIM
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = `${COLOR}25`
            e.currentTarget.style.color = "var(--fg-4)"
            e.currentTarget.style.background = "transparent"
          }}
        >
          Talk to PACER →
        </button>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1, minHeight: 20 }} />

      {/* Observation drawer */}
      <ObservationDrawer />

      {/* Campus bridge — Enter Atrium Space */}
      {ATRIUM_URL && (
        <div style={{ marginTop: 14 }}>
          <a
            href={buildAtriumURL("atrium")}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block", width: "100%", padding: "9px 0",
              borderRadius: 6, border: `1px solid rgba(91,175,214,0.2)`,
              background: "transparent", color: "var(--fg-4)",
              fontSize: "0.54rem", fontFamily: "monospace",
              fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase",
              textAlign: "center", textDecoration: "none",
              cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "rgba(91,175,214,0.45)"
              e.currentTarget.style.color = COLOR
              e.currentTarget.style.background = DIM
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "rgba(91,175,214,0.2)"
              e.currentTarget.style.color = "var(--fg-4)"
              e.currentTarget.style.background = "transparent"
            }}
          >
            ↗ Enter Atrium Space
          </a>
          <div style={{ textAlign: "center", marginTop: 5, fontSize: "0.4rem", fontFamily: "monospace", color: "var(--fg-4)", letterSpacing: "0.1em" }}>
            Separate building. Same campus.
          </div>
        </div>
      )}

    </div>
  )
}
