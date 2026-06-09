// src/layers/council/CouncilSurface.jsx
// The institution opening its eyes. Not a loading screen — a ceremony.
// Deliberate, not flashy. Every return replays the sequence.

import { useState, useEffect }                             from "react"
import { DEPLOYMENT_META }                                 from "../../config/deployments.js"
import { conductorPrioritize }                             from "../../engine/conductor.js"
import { recordFiredSignal, getUnresolvedSignals }         from "../../engine/ledger.js"
import SignalResolutionCard                                from "../../components/SignalResolutionCard.jsx"

const SEATS = [
  {
    id: "muse",
    label: "MUSE",
    subtitle: "Cultural Intelligence",
    color: "#ff6b9d",
    dim: "rgba(255,107,157,0.06)",
    glow: "rgba(255,107,157,0.15)",
    description: "Creates the world the resident inhabits. Music, image, tone, atmosphere.",
    laneId: null,
  },
  {
    id: "vera",
    label: "VERA",
    subtitle: "First Witness",
    color: "#8daac4",
    dim: "rgba(141,170,196,0.07)",
    glow: "rgba(141,170,196,0.18)",
    description: "Receives the full situation before anyone asks a question. Always watching.",
    laneId: "vera",
  },
  {
    id: "pacer",
    label: "PACER",
    subtitle: "Cognitive OS",
    color: "#e0e0f8",
    dim: "rgba(224,224,248,0.04)",
    glow: "rgba(224,224,248,0.10)",
    description: "Not a lane — the layer all lanes run on. The operating system of the resident.",
    laneId: null,
  },
  {
    id: "kodex",
    label: "KODEX",
    subtitle: "Mythology + Narrative",
    color: "#c87dff",
    dim: "rgba(200,125,255,0.07)",
    glow: "rgba(200,125,255,0.18)",
    description: "Holds the lore, the world, the story. The civilization remembers itself here.",
    laneId: "creative",
  },
  {
    id: "archivist",
    label: "ARCHIVIST",
    subtitle: "Memory Wing",
    color: "#c8955a",
    dim: "rgba(200,149,90,0.08)",
    glow: "rgba(200,149,90,0.22)",
    description: "Every declaration, job, and signal. The ledger that never forgets.",
    laneId: "archivist",
  },
  {
    id: "opscore",
    label: "OPSCORE",
    subtitle: "Operations + Logistics",
    color: "#00c896",
    dim: "rgba(0,200,150,0.07)",
    glow: "rgba(0,200,150,0.18)",
    description: "Every job, every crew, every move scored and stored.",
    laneId: "ops",
  },
  {
    id: "reality",
    label: "REALITY",
    subtitle: "The Anchor",
    color: "#f0c040",
    dim: "rgba(240,192,64,0.05)",
    glow: "rgba(240,192,64,0.14)",
    description: "Where all of this lands. The real world. The resident survives here.",
    laneId: null,
  },
]

const DEPLOYMENTS = Object.values(DEPLOYMENT_META)

// ── Live status reads ─────────────────────────────────────────────────────────

function readArchiveStatus() {
  try {
    const raw = localStorage.getItem("pacer_v3")
    if (!raw) return { label: "Empty", color: "#8daac4" }
    const data = JSON.parse(raw)
    const active = (data.declarations?.length > 0) || (data.archivistHistory?.length > 0)
    return active ? { label: "Active", color: "#00c896" } : { label: "Empty", color: "#8daac4" }
  } catch { return { label: "Unknown", color: "#5858a0" } }
}

function readSignalStatus() {
  try {
    const sigs = JSON.parse(localStorage.getItem("pacer_signals") || "[]")
    return sigs.length > 0
      ? { label: "Online",  color: "#00c896" }
      : { label: "Standby", color: "#8daac4" }
  } catch { return { label: "Unknown", color: "#5858a0" } }
}

// ── MuseCard ──────────────────────────────────────────────────────────────────
// MUSE is not making a claim. It is making an invitation.

function MuseCard({ priority }) {
  const museColor = "#ff6b9d"
  return (
    <div style={{ marginBottom: 24, padding: "16px 18px", borderRadius: 9, background: "var(--bg-card)", border: `1px solid ${museColor}30`, animation: "fadeUp 0.4s ease" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: "0.52rem", fontFamily: "monospace", letterSpacing: "0.22em", color: museColor, textTransform: "uppercase", fontWeight: 800 }}>M.U.S.E.</div>
        <div style={{ padding: "2px 8px", borderRadius: 4, background: museColor + "20", border: `1px solid ${museColor}40`, fontSize: "0.44rem", fontFamily: "monospace", color: museColor, letterSpacing: "0.1em" }}>Possibility</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ fontSize: "0.72rem", color: museColor, fontFamily: "monospace" }}>◈</div>
        <div>
          <div style={{ fontSize: "0.58rem", fontFamily: "monospace", fontWeight: 700, color: museColor, letterSpacing: "0.1em", textTransform: "uppercase", lineHeight: 1 }}>MUSE</div>
          <div style={{ fontSize: "0.44rem", color: museColor + "70", letterSpacing: "0.08em", marginTop: 2 }}>Meaning Under Strategic Emergence</div>
        </div>
      </div>

      <div style={{ fontSize: "0.82rem", fontStyle: "italic", color: "var(--fg-2)", lineHeight: 1.65, marginBottom: 14 }}>
        {priority.summary}
      </div>

      {priority.signals?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 9px", borderRadius: 4, background: museColor + "bb", fontSize: "0.46rem", fontFamily: "monospace", fontWeight: 700, color: "#000" }}>
            {priority.signals.length} supporting pattern{priority.signals.length > 1 ? "s" : ""}
          </span>
        </div>
      )}

      {priority.action && (
        <div style={{ padding: "9px 12px", borderRadius: 6, background: "var(--bg-panel)", border: `1px solid ${museColor}18`, marginBottom: 12 }}>
          <div style={{ fontSize: "0.44rem", fontFamily: "monospace", color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>what to explore</div>
          <div style={{ fontSize: "0.7rem", color: "var(--fg-3)", lineHeight: 1.5 }}>{priority.action}</div>
        </div>
      )}

      {priority.confidence !== null && (
        <div style={{ padding: "3px 9px", display: "inline-block", borderRadius: 4, background: museColor + "99", fontSize: "0.5rem", fontFamily: "monospace", fontWeight: 700, color: "#000" }}>
          {priority.confidence}% confidence
        </div>
      )}
    </div>
  )
}

// ── PacerSignal ───────────────────────────────────────────────────────────────

function PacerSignal({ priority }) {
  if (!priority || priority.seat === "reality") return null

  const seat = SEATS.find(s => s.id === priority.seat)
  if (!seat) return null

  if (priority.signalType === "Possibility") {
    return <MuseCard priority={priority} />
  }

  const urgencyColors = { critical: "#ff6b6b", high: "#ff9f43", medium: "#f0c040", low: "#8daac4" }
  const urgencyColor  = urgencyColors[priority.urgency] || "#8daac4"
  const impactColors  = { High: "#ff6b6b", Medium: "#ff9f43", Low: "#8daac4" }
  const impactColor   = impactColors[priority.impact]   || "#8daac4"

  return (
    <div style={{ marginBottom: 24, padding: "16px 18px", borderRadius: 9, background: "var(--bg-card)", border: `1px solid ${seat.color}30`, animation: "fadeUp 0.4s ease" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-4)" }}>active seat</div>
        <div style={{ padding: "2px 8px", borderRadius: 4, background: seat.color + "20", border: `1px solid ${seat.color}40`, fontSize: "0.44rem", fontFamily: "monospace", color: seat.color, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {priority.signalType}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: seat.color, boxShadow: `0 0 9px ${seat.color}` }} />
          <div style={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "monospace", color: seat.color }}>{seat.label}</div>
        </div>
        <div style={{ fontSize: "0.52rem", fontFamily: "monospace", color: "var(--fg-4)" }}>
          {priority.score} · {priority.confidence !== null ? `${priority.confidence}%` : "—"}
        </div>
      </div>

      <div style={{ fontSize: "0.78rem", color: "var(--fg-2)", lineHeight: 1.5, marginBottom: 10 }}>
        {priority.summary}
      </div>

      {priority.signals?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {priority.signals.map((sig, i) => (
            <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start", marginBottom: 3 }}>
              <div style={{ width: 3, height: 3, borderRadius: "50%", background: seat.color, marginTop: 8, flexShrink: 0 }} />
              <div style={{ fontSize: "0.66rem", color: "var(--fg-3)", lineHeight: 1.4 }}>{sig}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ height: 1, background: "var(--border-lo)", marginBottom: 10 }} />

      {priority.action && (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ fontSize: "0.52rem", fontFamily: "monospace", color: "var(--fg-4)", letterSpacing: "0.08em", flexShrink: 0, paddingTop: 2 }}>suggested →</div>
          <div style={{ fontSize: "0.72rem", color: "var(--fg-2)", lineHeight: 1.5 }}>{priority.action}</div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: priority.ignore_cost ? 10 : 0 }}>
        {priority.impact && (
          <div style={{ padding: "3px 9px", borderRadius: 4, background: impactColor + "18", border: `1px solid ${impactColor}40`, fontSize: "0.5rem", fontFamily: "monospace", fontWeight: 700, color: impactColor, letterSpacing: "0.06em" }}>
            {priority.impact} Impact
          </div>
        )}
        {priority.urgencyLabel && (
          <div style={{ padding: "3px 9px", borderRadius: 4, background: urgencyColor + "18", border: `1px solid ${urgencyColor}40`, fontSize: "0.5rem", fontFamily: "monospace", color: urgencyColor, letterSpacing: "0.06em" }}>
            {priority.urgencyLabel}
          </div>
        )}
      </div>

      {priority.ignore_cost && (
        <>
          <div style={{ height: 1, background: "var(--border-lo)", marginBottom: 8 }} />
          <div style={{ fontSize: "0.62rem", color: "var(--fg-4)", lineHeight: 1.5 }}>
            <span style={{ fontFamily: "monospace", fontSize: "0.5rem", letterSpacing: "0.1em" }}>if ignored: </span>
            {priority.ignore_cost}
          </div>
        </>
      )}
    </div>
  )
}

// ── CouncilSurface ────────────────────────────────────────────────────────────

export default function CouncilSurface({ onEnterSeat }) {
  const [phase, setPhase]             = useState(0)
  const [hoveredSeat, setHoveredSeat] = useState(null)
  const [priority, setPriority]       = useState(null)
  const [unresolved, setUnresolved]   = useState([])

  const archive = readArchiveStatus()
  const signal  = readSignalStatus()

  useEffect(() => {
    const result = conductorPrioritize()
    setPriority(result)
    if (result.seat !== "reality") recordFiredSignal(result)
    setUnresolved(getUnresolvedSignals())
  }, [])

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 700),
      setTimeout(() => setPhase(3), 1100),
      setTimeout(() => setPhase(4), 1500),
      setTimeout(() => setPhase(5), 2400),
      setTimeout(() => setPhase(6), 2800),
      setTimeout(() => setPhase(7), 3400),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  function refreshUnresolved() {
    setUnresolved(getUnresolvedSignals())
  }

  function handleSeatClick(seat) {
    if (seat.laneId && onEnterSeat) onEnterSeat(seat.laneId)
  }

  const prioritizedId = priority?.seat !== "reality" ? priority?.seat : null

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      padding: "48px 48px 40px",
      overflowY: "auto",
      minHeight: 0,
    }}>

      {/* Phase 0 — PACER mark */}
      <div style={{ marginBottom: 6 }}>
        <div style={{
          fontSize: "2.1rem",
          fontWeight: 200,
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          color: "var(--fg)",
          lineHeight: 1,
          fontFamily: "monospace",
        }}>
          PACER
        </div>
      </div>

      {/* Phase 1 — Acronym expansion + institution title */}
      {phase >= 1 && (
        <div style={{ animation: "fadeUp 0.5s ease both", marginBottom: 28 }}>
          <div style={{
            fontSize: "0.46rem",
            fontFamily: "monospace",
            letterSpacing: "0.14em",
            color: "var(--fg-3)",
            marginTop: 9,
            marginBottom: 5,
          }}>
            Pattern · Adaptive · Cognition · Execution · Resonance
          </div>
          <div style={{
            fontSize: "0.38rem",
            fontFamily: "monospace",
            letterSpacing: "0.26em",
            textTransform: "uppercase",
            color: "var(--fg-4)",
          }}>
            Constitutional Operating Environment
          </div>
        </div>
      )}

      {/* Phase 2 — Purpose statement + thesis */}
      {phase >= 2 && (
        <div style={{ animation: "fadeUp 0.5s ease both", marginBottom: 14 }}>
          <div style={{
            fontSize: "0.68rem",
            fontWeight: 400,
            color: "var(--fg-3)",
            fontStyle: "italic",
            letterSpacing: "0.02em",
            marginBottom: 14,
          }}>
            The Observation Must Survive The Observer.
          </div>
          <div style={{
            fontSize: "0.84rem",
            fontWeight: 300,
            color: "var(--fg-2)",
            lineHeight: 1.85,
            letterSpacing: "0.01em",
          }}>
            Memory compounds.<br />
            Reasoning does not.<br />
            <span style={{ color: "var(--fg-4)" }}>The resident survives.</span><br />
            <span style={{ fontSize: "0.62rem", color: "var(--fg-4)", letterSpacing: "0.06em", fontStyle: "italic" }}>Everything else is translation.</span>
          </div>
        </div>
      )}

      {/* Phase 3 — Institution count */}
      {phase >= 3 && (
        <div style={{ animation: "fadeUp 0.5s ease both", marginBottom: 36 }}>
          <div style={{
            fontSize: "0.54rem",
            fontFamily: "monospace",
            letterSpacing: "0.1em",
            color: "var(--fg-3)",
          }}>
            Seven seats. Four addresses. One institution.
          </div>
        </div>
      )}

      {/* Phase 4 — PACER conductor signal */}
      {phase >= 4 && priority && (
        <PacerSignal priority={priority} />
      )}

      {/* Phase 4 — Seat grid */}
      {phase >= 4 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontSize: "0.42rem",
            fontFamily: "monospace",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--fg-4)",
            marginBottom: 14,
            animation: "fadeUp 0.4s ease both",
          }}>
            Current Seats Available
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(192px, 1fr))",
            gap: 8,
          }}>
            {SEATS.map((seat, i) => {
              const hovered   = hoveredSeat === seat.id
              const isLit     = seat.id === prioritizedId
              const dimmed    = !!(prioritizedId && !isLit && !hovered)
              const clickable = !!seat.laneId
              return (
                <div
                  key={seat.id}
                  onMouseEnter={() => setHoveredSeat(seat.id)}
                  onMouseLeave={() => setHoveredSeat(null)}
                  onClick={() => handleSeatClick(seat)}
                  style={{
                    opacity:   dimmed ? 0.35 : 1,
                    transform: "translateY(0)",
                    animation: `fadeUp 420ms ease ${i * 90}ms both`,
                    padding: "14px 15px",
                    borderRadius: 8,
                    background: hovered ? seat.dim : "var(--bg-card)",
                    border: `1px solid ${(hovered || isLit) ? seat.color + "40" : "var(--border-lo)"}`,
                    cursor: clickable ? "pointer" : "default",
                    boxShadow: (hovered || isLit) ? `0 0 18px ${seat.glow}` : "none",
                    transition: "background 0.15s, border-color 0.15s, box-shadow 0.15s, opacity 0.3s",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                    <div style={{
                      width: 6, height: 6,
                      borderRadius: "50%",
                      background: seat.color,
                      boxShadow: (hovered || isLit) ? `0 0 7px ${seat.color}` : "none",
                      transition: "box-shadow 0.2s",
                      flexShrink: 0,
                    }} />
                    <div style={{
                      fontSize: "0.61rem",
                      fontWeight: 800,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      fontFamily: "monospace",
                      color: (hovered || isLit) ? seat.color : "var(--fg-2)",
                      transition: "color 0.15s",
                    }}>
                      {seat.label}
                    </div>
                    {!clickable && (
                      <div style={{
                        marginLeft: "auto",
                        fontSize: "0.37rem",
                        fontFamily: "monospace",
                        color: "var(--fg-4)",
                        letterSpacing: "0.07em",
                      }}>
                        meta
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: "0.55rem", color: "var(--fg-3)", lineHeight: 1.4 }}>
                    {seat.subtitle}
                  </div>

                  {hovered && (
                    <div style={{
                      fontSize: "0.54rem",
                      color: "var(--fg-3)",
                      lineHeight: 1.55,
                      marginTop: 9,
                      marginBottom: clickable ? 18 : 0,
                      animation: "fadeUp 0.12s ease",
                    }}>
                      {seat.description}
                    </div>
                  )}

                  {clickable && hovered && (
                    <div style={{
                      position: "absolute",
                      bottom: 9, right: 12,
                      fontSize: "0.42rem",
                      fontFamily: "monospace",
                      color: seat.color,
                      letterSpacing: "0.1em",
                      opacity: 0.7,
                    }}>
                      enter →
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Unresolved signals — ledger close-loop prompts */}
      {phase >= 4 && unresolved.length > 0 && (
        <div style={{ marginBottom: 28, animation: "fadeUp 0.5s ease both" }}>
          <div style={{
            fontSize: "0.42rem",
            fontFamily: "monospace",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--fg-4)",
            marginBottom: 10,
          }}>
            Unresolved Signals · {unresolved.length}
          </div>
          {unresolved.slice(0, 3).map(sig => {
            const seat = SEATS.find(s => s.id === sig.seat)
            return (
              <SignalResolutionCard
                key={sig.id}
                signal={sig}
                seatColor={seat?.color || "#8daac4"}
                seatName={seat?.label  || sig.seat}
                onResolved={refreshUnresolved}
              />
            )
          })}
          {unresolved.length > 3 && (
            <div style={{ fontSize: "0.58rem", color: "var(--fg-4)", fontFamily: "monospace", paddingLeft: 2 }}>
              +{unresolved.length - 3} more unresolved
            </div>
          )}
        </div>
      )}

      {/* Phase 5 — Deployment addresses */}
      {phase >= 5 && (
        <div style={{ animation: "fadeUp 0.5s ease both", marginBottom: 32 }}>
          <div style={{
            fontSize: "0.42rem",
            fontFamily: "monospace",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--fg-4)",
            marginBottom: 12,
          }}>
            Current Addresses
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(206px, 1fr))",
            gap: 7,
          }}>
            {DEPLOYMENTS.map(dep => {
              const seatDots = dep.seats
                .map(sId => SEATS.find(s => s.id === sId))
                .filter(Boolean)
              return (
                <div key={dep.id} style={{
                  padding: "11px 13px",
                  borderRadius: 7,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-lo)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: dep.color, flexShrink: 0 }} />
                    <div style={{ fontSize: "0.61rem", fontWeight: 700, color: "var(--fg-2)", letterSpacing: "0.04em" }}>
                      {dep.label}
                    </div>
                  </div>
                  <div style={{ fontSize: "0.5rem", color: "var(--fg-4)", marginBottom: 9 }}>
                    {dep.subtitle}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                    {seatDots.map(seat => (
                      <div key={seat.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: seat.color, opacity: 0.75 }} />
                        <div style={{ fontSize: "0.37rem", fontFamily: "monospace", color: "var(--fg-4)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                          {seat.label.slice(0, 3)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Phase 6 — Status strip */}
      {phase >= 6 && (
        <div style={{
          animation: "fadeUp 0.5s ease both",
          marginTop: "auto",
          paddingTop: 18,
          borderTop: "1px solid var(--border-lo)",
          display: "flex",
          alignItems: "center",
          gap: 28,
          flexWrap: "wrap",
        }}>
          {[
            { label: "Institution",   value: "Stable",      color: "#00c896" },
            { label: "Archive",       value: archive.label, color: archive.color },
            { label: "Signal Bridge", value: signal.label,  color: signal.color },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{
                width: 5, height: 5,
                borderRadius: "50%",
                background: color,
                boxShadow: `0 0 5px ${color}60`,
              }} />
              <div style={{
                fontSize: "0.48rem",
                fontFamily: "monospace",
                color: "var(--fg-4)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}>
                {label}{" "}
                <span style={{ color }}>{value}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Phase 7 — Constitutional emblem */}
      {phase >= 7 && (
        <div style={{
          animation: "fadeUp 0.6s ease both",
          display: "flex",
          justifyContent: "flex-end",
          marginTop: 14,
        }}>
          <span
            title="Knowledge arrived. Knowledge was welcomed. Knowledge survived. Choice remained with its owner."
            style={{
              fontSize: "1rem",
              filter: "hue-rotate(150deg) saturate(0.85) brightness(0.8)",
              opacity: 0.5,
              lineHeight: 1,
              userSelect: "none",
            }}
          >
            🍍
          </span>
        </div>
      )}

    </div>
  )
}
