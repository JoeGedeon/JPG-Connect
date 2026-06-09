// src/layers/atrium/AtriumRoom.jsx
// Atrium — threshold between the outside world and the institution.
// Observation intake: notice, preserve, translate, pass forward.

import { useState, useEffect, useRef } from "react"
import {
  recordObservation, markPassedForward, getObservations, OBS_TAGS,
} from "../../engine/observations.js"
import { recordSignal, SIGNAL_TYPES } from "../../engine/signals.js"

const COLOR  = "#5bafd6"
const DIM    = "rgba(91,175,214,0.07)"
const BORDER = "rgba(91,175,214,0.18)"

function timeAgo(ts) {
  const d = Date.now() - ts
  if (d < 60000)    return "just now"
  if (d < 3600000)  return `${Math.floor(d / 60000)}m ago`
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`
  return `${Math.floor(d / 86400000)}d ago`
}

const PROMPTS = [
  "Three customers this week asked about storage.",
  "Something keeps happening before delivery that slows everything down.",
  "I've been noticing a pattern across our long-haul jobs.",
  "A client said something today I don't want to forget.",
]

function TagChip({ label, selected, onToggle }) {
  return (
    <button
      onClick={() => onToggle(label)}
      style={{
        padding:      "3px 9px",
        borderRadius: 4,
        border:       `1px solid ${selected ? COLOR + "80" : "var(--border-lo)"}`,
        background:   selected ? DIM : "transparent",
        color:        selected ? COLOR : "var(--fg-4)",
        fontSize:     "0.52rem",
        fontFamily:   "monospace",
        fontWeight:   selected ? 700 : 400,
        letterSpacing:"0.08em",
        textTransform:"uppercase",
        cursor:       "pointer",
        transition:   "all 0.12s",
      }}
    >
      {label}
    </button>
  )
}

function ObservationCard({ obs, onPassForward }) {
  const [passed, setPassed] = useState(obs.passedForward)

  function handlePass() {
    markPassedForward(obs.id)
    recordSignal({
      type:    SIGNAL_TYPES.OBSERVATION_LOGGED,
      source:  "atrium",
      title:   obs.content.slice(0, 80),
      summary: obs.content,
    })
    setPassed(true)
    onPassForward?.()
  }

  return (
    <div style={{
      padding:      "10px 14px",
      borderRadius: 7,
      border:       `1px solid ${passed ? "var(--border-lo)" : BORDER}`,
      background:   passed ? "var(--bg-card)" : DIM,
      marginBottom: 8,
      transition:   "all 0.2s",
    }}>
      <div style={{ fontSize: "0.74rem", color: "var(--fg-body)", lineHeight: 1.5, marginBottom: 8 }}>
        {obs.content}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {obs.tags.map(t => (
            <span key={t} style={{ fontSize: "0.46rem", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-4)", padding: "1px 6px", border: "1px solid var(--border-lo)", borderRadius: 3 }}>
              {t}
            </span>
          ))}
          <span style={{ fontSize: "0.46rem", fontFamily: "monospace", color: "var(--fg-4)", letterSpacing: "0.06em" }}>
            {timeAgo(obs.createdAt)}
          </span>
        </div>

        {passed ? (
          <span style={{ fontSize: "0.5rem", fontFamily: "monospace", color: "var(--fg-4)", letterSpacing: "0.08em" }}>
            → passed to VERA
          </span>
        ) : (
          <button
            onClick={handlePass}
            style={{
              padding:      "4px 10px",
              borderRadius: 4,
              border:       `1px solid ${COLOR}40`,
              background:   "transparent",
              color:        COLOR,
              fontSize:     "0.52rem",
              fontFamily:   "monospace",
              fontWeight:   700,
              letterSpacing:"0.08em",
              cursor:       "pointer",
              transition:   "all 0.12s",
              flexShrink:   0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = DIM }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
          >
            Pass Forward →
          </button>
        )}
      </div>
    </div>
  )
}

export default function AtriumRoom() {
  const [content, setContent]       = useState("")
  const [tags, setTags]             = useState([])
  const [observations, setObs]      = useState(() => getObservations(30))
  const [justRecorded, setRecorded] = useState(false)
  const textareaRef                 = useRef(null)

  function toggleTag(label) {
    setTags(prev => prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label])
  }

  function handleRecord() {
    if (!content.trim()) return
    recordObservation({ content: content.trim(), tags })
    setObs(getObservations(30))
    setContent("")
    setTags([])
    setRecorded(true)
    setTimeout(() => setRecorded(false), 2200)
  }

  function handlePrompt(text) {
    setContent(text)
    textareaRef.current?.focus()
  }

  function handleKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleRecord()
  }

  return (
    <div style={{
      flex: 1, overflowY: "auto", padding: "28px 32px",
      display: "flex", flexDirection: "column", gap: 28,
    }}>

      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 28, height: 28,
            background: COLOR,
            clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
            boxShadow: `0 0 14px ${BORDER}`,
          }} />
          <div>
            <div style={{ fontSize: "0.52rem", fontFamily: "monospace", letterSpacing: "0.22em", textTransform: "uppercase", color: COLOR, marginBottom: 2 }}>ATRIUM</div>
            <div style={{ fontSize: "0.6rem", color: "var(--fg-4)", letterSpacing: "0.08em" }}>Threshold · Observation Intake</div>
          </div>
        </div>
        <div style={{ width: 40, height: 1, background: `${COLOR}40`, marginTop: 12 }} />
      </div>

      {/* Capture */}
      <div style={{
        padding: "20px 22px",
        borderRadius: 10,
        border: `1px solid ${BORDER}`,
        background: DIM,
      }}>
        <div style={{ fontSize: "0.6rem", fontFamily: "monospace", letterSpacing: "0.14em", textTransform: "uppercase", color: COLOR, marginBottom: 12 }}>
          What have you noticed?
        </div>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you saw, heard, or felt. Patterns. Signals. Moments. No format required."
          rows={4}
          style={{
            width: "100%", resize: "none",
            background: "var(--bg-input)", border: "1px solid var(--border-lo)",
            borderRadius: 7, padding: "10px 12px",
            color: "var(--fg-body)", fontSize: "0.78rem", lineHeight: 1.6,
            fontFamily: "inherit", outline: "none", transition: "border-color 0.15s",
          }}
          onFocus={e => { e.currentTarget.style.borderColor = `${COLOR}50` }}
          onBlur={e =>  { e.currentTarget.style.borderColor = "var(--border-lo)" }}
        />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, gap: 10 }}>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {OBS_TAGS.map(t => (
              <TagChip key={t} label={t} selected={tags.includes(t)} onToggle={toggleTag} />
            ))}
          </div>

          <button
            onClick={handleRecord}
            disabled={!content.trim()}
            style={{
              padding:       "8px 18px",
              borderRadius:  6,
              border:        `1px solid ${content.trim() ? COLOR + "60" : "var(--border-lo)"}`,
              background:    content.trim() ? DIM : "transparent",
              color:         content.trim() ? COLOR : "var(--fg-4)",
              fontSize:      "0.6rem",
              fontFamily:    "monospace",
              fontWeight:    700,
              letterSpacing: "0.1em",
              cursor:        content.trim() ? "pointer" : "default",
              transition:    "all 0.15s",
              flexShrink:    0,
            }}
            onMouseEnter={e => { if (content.trim()) e.currentTarget.style.background = `${COLOR}15` }}
            onMouseLeave={e => { if (content.trim()) e.currentTarget.style.background = DIM }}
          >
            {justRecorded ? "Preserved ✓" : "Record →"}
          </button>
        </div>
      </div>

      {/* Prompt starters */}
      {!observations.length && (
        <div>
          <div style={{ fontSize: "0.5rem", fontFamily: "monospace", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 10 }}>
            If you're not sure where to start —
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => handlePrompt(p)}
                style={{
                  padding: "8px 12px", borderRadius: 6, textAlign: "left",
                  border: "1px solid var(--border-lo)", background: "transparent",
                  color: "var(--fg-3)", fontSize: "0.72rem", cursor: "pointer",
                  transition: "all 0.12s", fontFamily: "inherit", lineHeight: 1.4,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${COLOR}40`; e.currentTarget.style.color = "var(--fg-2)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-lo)"; e.currentTarget.style.color = "var(--fg-3)" }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Observations list */}
      {observations.length > 0 && (
        <div>
          <div style={{ fontSize: "0.5rem", fontFamily: "monospace", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 12 }}>
            Preserved · {observations.length} observation{observations.length !== 1 ? "s" : ""}
          </div>
          {observations.map(obs => (
            <ObservationCard
              key={obs.id}
              obs={obs}
              onPassForward={() => setObs(getObservations(30))}
            />
          ))}
        </div>
      )}

    </div>
  )
}
