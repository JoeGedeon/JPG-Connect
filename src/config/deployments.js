// src/config/deployments.js
// Single source of truth for deployment-to-seat relationships.
// Both CouncilSurface and briefing.js read from here — no split truth.

export const DEPLOYMENT_META = {
  fleetflow: {
    id:       "fleetflow",
    label:    "FleetFlow",
    subtitle: "Moving Operations",
    color:    "#00c896",
    seats:    ["opscore", "archivist", "vera"],
  },
  isles: {
    id:       "isles",
    label:    "Isles of the Awakening",
    subtitle: "Mythology + World",
    color:    "#c87dff",
    seats:    ["kodex", "muse", "pacer"],
  },
  fleethop: {
    id:       "fleethop",
    label:    "Fleethop",
    subtitle: "Carrier Intelligence",
    color:    "#ff9f43",
    seats:    ["opscore", "vera"],
  },
  jpgventures: {
    id:       "jpgventures",
    label:    "JPG Ventures",
    subtitle: "The Parent Layer",
    color:    "#8daac4",
    seats:    ["pacer", "vera", "archivist", "reality"],
  },
}

// deployment_id → seat_id[]
export const DEPLOYMENT_TO_SEATS = Object.fromEntries(
  Object.entries(DEPLOYMENT_META).map(([id, meta]) => [id, meta.seats])
)

// seat_id → deployment_id[]  (computed inverse — do not hand-edit)
export const SEAT_TO_DEPLOYMENTS = (() => {
  const map = {}
  for (const [depId, { seats }] of Object.entries(DEPLOYMENT_META)) {
    for (const seatId of seats) {
      if (!map[seatId]) map[seatId] = []
      map[seatId].push(depId)
    }
  }
  return map
})()

// Returns all seat IDs that share at least one deployment with the given seat.
// Excludes the seat itself. Used by briefing.js for cross-seat signal routing.
export function getRelatedSeats(seatId) {
  const deployments = SEAT_TO_DEPLOYMENTS[seatId] || []
  const related = new Set()
  for (const depId of deployments) {
    for (const s of DEPLOYMENT_TO_SEATS[depId] || []) {
      if (s !== seatId) related.add(s)
    }
  }
  return [...related]
}

// Returns deployment IDs that contain the given seat.
export function getSeatDeployments(seatId) {
  return SEAT_TO_DEPLOYMENTS[seatId] || []
}
