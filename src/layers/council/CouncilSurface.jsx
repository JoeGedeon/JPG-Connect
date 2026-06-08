// src/layers/council/CouncilSurface.jsx
// The place PACER lives. Not a room — the institution itself.
// Every return replays the ceremony. Arrival has weight here.

import { useState, useEffect } from "react"
import { DEPLOYMENT_META } from "../../config/deployments.js"

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
    deployments: ["Isles of the Awakened"],
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
    deployments: ["JPG Ventures"],
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
    deployments: ["JPG Ventures", "FleetFlow", "Fleethop", "Isles"],
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
    deployments: ["Isles of the Awakened"],
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
    deployments: ["FleetFlow", "JPG Ventures"],
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
    deployments: ["FleetFlow", "Fleethop"],
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
    deployments: ["FleetFlow", "Isles", "Fleethop", "JPG Ventures"],
  },
]

const DEPLOYMENTS = Object.values(DEPLOYMENT_META)

// ── Institution status reads ──────────────────────────────────────────────────

function readArchiveStatus() {
  try {
    const raw = localStorage.getItem("pacer_v3")
    if (!raw) return { label: "Empty", color: "#8daac4" }
    const data = JSON.parse(raw)
    const hasRecords = (data.declarations?.length > 0) || (data.archivistHistory?.length > 0)
    return hasRecords
      ? { label: "Active",  color: "#00c896" }
      : { label: "Empty",   color: "#8daac4" }
  } catch {
    return { label: "Unknown", color: "#5858a0" }
  }
}

function readSignalStatus() {
  try {
    const raw  = localStorage.getItem("pacer_signals")
    const sigs = raw ? JSON.parse(raw) : []
    return sigs.length > 0
      ? { label: "Online",  color: "#00c896" }
      : { label: "Standby", color: "#8daac4" }
  } catch {
    return { label: "Unknown", color: "#5858a0" }
  }
}

// ── CouncilSurface ────────────────────────────────────────────────────────────

export default function CouncilSurface({ onEnterSeat }) {
  // Ceremony phases: 0 wordmark → 1 thesis → 2 seats → 3 addresses → 4 status
  const [phase, setPhase]             = useState(0)
  const [hoveredSeat, setHoveredSeat] = useState(null)

  const archive = readArchiveStatus()
  const signal  = readSignalStatus()

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 350),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1300),
      setTimeout(() => setPhase(4), 1700),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  function handleSeatClick(seat) {
    if (seat.laneId && onEnterSeat) onEnterSeat(seat.laneId)
  }

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      padding: "44px 44px 36px",
      overflowY: "auto",
      minHeight: 0,
    }}>

      {/* ── Arrival — the institution announces itself ── */}
      <div style={{ marginBottom: 38 }}>
        <div style={{
          fontSize: "0.38rem",
          fontFamily: "monospace",
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "var(--fg-4)",
          marginBottom: 10,
        }}>
          Constitutional Operating Environment
        </div>

        <div style={{
          fontSize: "2rem",
          fontWeight: 200,
          letterSpacing: "0.38em",
          textTransform: "uppercase",
          color: "var(--fg)",
          lineHeight: 1,
          marginBottom: 24,
          fontFamily: "monospace",
        }}>
          PACER
        </div>

        {/* Thesis — appears after wordmark settles */}
        <div style={{
          opacity:   phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? "none" : "translateY(7px)",
          transition: "opacity 0.55s ease, transform 0.55s ease",
        }}>
          <div style={{
            fontSize: "0.82rem",
            fontWeight: 300,
            color: "var(--fg-2)",
            lineHeight: 1.9,
            letterSpacing: "0.01em",
          }}>
            Memory compounds.<br />
            Reasoning does not.<br />
            <span style={{ color: "var(--fg-4)" }}>The resident survives.</span>
          </div>
        </div>
      </div>

      {/* ── Seats — materialize one by one ── */}
      <div style={{
        opacity: phase >= 2 ? 1 : 0,
        transition: "opacity 0.3s ease",
        marginBottom: 30,
      }}>
        <div style={{
          fontSize: "0.42rem",
          fontFamily: "monospace",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--fg-4)",
          marginBottom: 14,
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
            const clickable = !!seat.laneId
            return (
              <div
                key={seat.id}
                onMouseEnter={() => setHoveredSeat(seat.id)}
                onMouseLeave={() => setHoveredSeat(null)}
                onClick={() => handleSeatClick(seat)}
                style={{
                  opacity:   phase >= 2 ? 1 : 0,
                  transform: phase >= 2 ? "none" : "translateY(5px)",
                  transition: [
                    `opacity 0.4s ease ${0.06 * i}s`,
                    `transform 0.4s ease ${0.06 * i}s`,
                    "background 0.15s",
                    "border-color 0.15s",
                    "box-shadow 0.15s",
                  ].join(", "),
                  padding: "14px 15px",
                  borderRadius: 8,
                  background: hovered ? seat.dim : "var(--bg-card)",
                  border: `1px solid ${hovered ? seat.color + "40" : "var(--border-lo)"}`,
                  cursor: clickable ? "pointer" : "default",
                  boxShadow: hovered ? `0 0 18px ${seat.glow}` : "none",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                  <div style={{
                    width: 6, height: 6,
                    borderRadius: "50%",
                    background: seat.color,
                    boxShadow: hovered ? `0 0 7px ${seat.color}` : "none",
                    transition: "box-shadow 0.2s",
                    flexShrink: 0,
                  }} />
                  <div style={{
                    fontSize: "0.61rem",
                    fontWeight: 800,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    fontFamily: "monospace",
                    color: hovered ? seat.color : "var(--fg-2)",
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

      {/* ── Addresses — where the institution currently lives ── */}
      <div style={{
        opacity:   phase >= 3 ? 1 : 0,
        transform: phase >= 3 ? "none" : "translateY(6px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
        marginBottom: 32,
      }}>
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

      {/* ── Status Bar — the institution's vital signs, appears last ── */}
      <div style={{
        opacity: phase >= 4 ? 1 : 0,
        transition: "opacity 0.7s ease",
        marginTop: "auto",
        paddingTop: 18,
        borderTop: "1px solid var(--border-lo)",
        display: "flex",
        alignItems: "center",
        gap: 28,
        flexWrap: "wrap",
      }}>
        {[
          { label: "Institution",   value: "Stable",       color: "#00c896" },
          { label: "Archive",       value: archive.label,  color: archive.color },
          { label: "Signal Bridge", value: signal.label,   color: signal.color },
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

    </div>
  )
}
