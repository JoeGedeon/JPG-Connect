// src/layers/council/CouncilSurface.jsx
// Orientation layer — the first screen that makes the civilization visible.
// Not new logic. New visibility.

import { useState } from "react"

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

const DEPLOYMENTS = [
  {
    id: "fleetflow",
    label: "FleetFlow",
    subtitle: "Moving Operations",
    seats: ["opscore", "archivist", "vera"],
    color: "#00c896",
  },
  {
    id: "isles",
    label: "Isles of the Awakened",
    subtitle: "Mythology + World",
    seats: ["kodex", "muse", "pacer"],
    color: "#c87dff",
  },
  {
    id: "fleethop",
    label: "Fleethop",
    subtitle: "Carrier Intelligence",
    seats: ["opscore", "vera"],
    color: "#ff9f43",
  },
  {
    id: "jpgventures",
    label: "JPG Ventures",
    subtitle: "The Parent Layer",
    seats: ["pacer", "vera", "archivist", "reality"],
    color: "#8daac4",
  },
]

export default function CouncilSurface({ onEnterSeat }) {
  const [hoveredSeat, setHoveredSeat] = useState(null)

  function handleSeatClick(seat) {
    if (seat.laneId && onEnterSeat) onEnterSeat(seat.laneId)
  }

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
      padding: "28px 32px 40px",
    }}>

      {/* Thesis */}
      <div style={{ marginBottom: 36, maxWidth: 560 }}>
        <div style={{
          fontSize: "0.43rem",
          fontFamily: "monospace",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "var(--fg-4)",
          marginBottom: 12,
        }}>
          PACER · Council Surface
        </div>
        <div style={{
          fontSize: "1.05rem",
          fontWeight: 300,
          color: "var(--fg)",
          lineHeight: 1.65,
          letterSpacing: "0.005em",
        }}>
          The council carries questions.<br />
          Reality supplies answers.<br />
          <span style={{ color: "var(--fg-3)" }}>The resident survives.</span>
        </div>
        <div style={{
          marginTop: 14,
          fontSize: "0.6rem",
          color: "var(--fg-4)",
          lineHeight: 1.65,
          maxWidth: 460,
        }}>
          Seven permanent seats. Not features — functions.<br />
          Each deployment below is an address where the resident currently lives.
        </div>
      </div>

      {/* Permanent Seats */}
      <div>
        <div style={{
          fontSize: "0.44rem",
          fontFamily: "monospace",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--fg-4)",
          marginBottom: 12,
        }}>
          Permanent Seats
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(195px, 1fr))",
          gap: 9,
        }}>
          {SEATS.map(seat => {
            const hovered = hoveredSeat === seat.id
            const clickable = !!seat.laneId
            return (
              <div
                key={seat.id}
                onMouseEnter={() => setHoveredSeat(seat.id)}
                onMouseLeave={() => setHoveredSeat(null)}
                onClick={() => handleSeatClick(seat)}
                style={{
                  padding: "14px 15px",
                  borderRadius: 8,
                  background: hovered ? seat.dim : "var(--bg-card)",
                  border: `1px solid ${hovered ? seat.color + "45" : "var(--border-lo)"}`,
                  cursor: clickable ? "pointer" : "default",
                  transition: "all 0.16s ease",
                  boxShadow: hovered ? `0 0 18px ${seat.glow}` : "none",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                  <div style={{
                    width: 7, height: 7,
                    borderRadius: "50%",
                    background: seat.color,
                    boxShadow: hovered ? `0 0 7px ${seat.color}` : "none",
                    transition: "box-shadow 0.2s",
                    flexShrink: 0,
                  }} />
                  <div style={{
                    fontSize: "0.62rem",
                    fontWeight: 800,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    fontFamily: "monospace",
                    color: hovered ? seat.color : "var(--fg-2)",
                    transition: "color 0.16s",
                  }}>
                    {seat.label}
                  </div>
                  {!clickable && (
                    <div style={{
                      marginLeft: "auto",
                      fontSize: "0.38rem",
                      fontFamily: "monospace",
                      color: "var(--fg-4)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}>
                      meta
                    </div>
                  )}
                </div>

                <div style={{ fontSize: "0.57rem", color: "var(--fg-3)", lineHeight: 1.4 }}>
                  {seat.subtitle}
                </div>

                {hovered && (
                  <div style={{
                    fontSize: "0.55rem",
                    color: "var(--fg-3)",
                    lineHeight: 1.55,
                    marginTop: 8,
                    marginBottom: 4,
                    animation: "fadeUp 0.14s ease",
                  }}>
                    {seat.description}
                  </div>
                )}

                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 9 }}>
                  {seat.deployments.map(dep => (
                    <div key={dep} style={{
                      padding: "2px 7px",
                      borderRadius: 3,
                      background: "var(--bg)",
                      border: "1px solid var(--border-lo)",
                      fontSize: "0.43rem",
                      fontFamily: "monospace",
                      color: "var(--fg-4)",
                      letterSpacing: "0.06em",
                    }}>
                      {dep}
                    </div>
                  ))}
                </div>

                {clickable && hovered && (
                  <div style={{
                    position: "absolute",
                    bottom: 10,
                    right: 12,
                    fontSize: "0.44rem",
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

      {/* Current Addresses */}
      <div style={{ marginTop: 28 }}>
        <div style={{
          fontSize: "0.44rem",
          fontFamily: "monospace",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--fg-4)",
          marginBottom: 12,
        }}>
          Current Addresses
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
          gap: 8,
        }}>
          {DEPLOYMENTS.map(dep => {
            const seatDots = dep.seats
              .map(sId => SEATS.find(s => s.id === sId))
              .filter(Boolean)
            return (
              <div key={dep.id} style={{
                padding: "12px 14px",
                borderRadius: 8,
                background: "var(--bg-card)",
                border: "1px solid var(--border-lo)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <div style={{
                    width: 5, height: 5,
                    borderRadius: "50%",
                    background: dep.color,
                    flexShrink: 0,
                  }} />
                  <div style={{
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    color: "var(--fg-2)",
                    letterSpacing: "0.05em",
                  }}>
                    {dep.label}
                  </div>
                </div>
                <div style={{
                  fontSize: "0.52rem",
                  color: "var(--fg-4)",
                  marginBottom: 10,
                }}>
                  {dep.subtitle}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  {seatDots.map(seat => (
                    <div key={seat.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      <div style={{
                        width: 5, height: 5,
                        borderRadius: "50%",
                        background: seat.color,
                        opacity: 0.75,
                      }} />
                      <div style={{
                        fontSize: "0.38rem",
                        fontFamily: "monospace",
                        color: "var(--fg-4)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}>
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

      {/* Footer */}
      <div style={{
        marginTop: 28,
        paddingTop: 16,
        borderTop: "1px solid var(--border-lo)",
        fontSize: "0.48rem",
        fontFamily: "monospace",
        color: "var(--fg-4)",
        letterSpacing: "0.12em",
      }}>
        Not new logic. New visibility.
      </div>
    </div>
  )
}
