// src/engine/briefing.js
// Read layer: surfaces what matters when a seat enters a lane.
// Not new memory. Arrival with context.

import { getRecentSignals } from "./signals.js"
import { SEAT_TO_DEPLOYMENTS, getRelatedSeats } from "../config/deployments.js"

// Lane ID → seat ID (for signal source filtering)
const LANE_TO_SEAT = {
  vera:      "vera",
  ops:       "opscore",
  archivist: "archivist",
  creative:  "kodex",
  kel:       "kel",
}

// Seat ID → lane ID (inverse)
const SEAT_TO_LANE = Object.fromEntries(
  Object.entries(LANE_TO_SEAT).map(([lane, seat]) => [seat, lane])
)

/**
 * buildSeatBriefing({ lane, limit })
 *
 * Returns a structured context object for the given lane.
 * Meant to be called at lane entry and injected into the room's system prompt.
 *
 * Shape:
 * {
 *   lane, seatId, deployments,
 *   recentSignals,      // this seat's own recent signals
 *   relatedSeats,       // { seatId: signal[] } for co-resident seats
 *   activeTasks,        // non-complete tasks for this lane
 *   openTensions,       // unresolved tensions relevant to this lane
 * }
 */
export function buildSeatBriefing({ lane, limit = 12 }) {
  const seatId = LANE_TO_SEAT[lane] || lane

  const ownSignals = getRecentSignals(limit * 2)
    .filter(s => s.source === lane)
    .slice(0, limit)

  const relatedSeatIds = getRelatedSeats(seatId)
  const relatedSeats = {}
  for (const relSeat of relatedSeatIds) {
    const relLane = SEAT_TO_LANE[relSeat]
    if (!relLane) continue
    const signals = getRecentSignals(limit)
      .filter(s => s.source === relLane)
      .slice(0, 4)
    if (signals.length) relatedSeats[relSeat] = signals
  }

  return {
    lane,
    seatId,
    deployments:   SEAT_TO_DEPLOYMENTS[seatId] || [],
    recentSignals: ownSignals,
    relatedSeats,
    activeTasks:   _loadActiveTasks(lane),
    openTensions:  _loadOpenTensions(lane),
  }
}

/**
 * formatBriefingForPrompt(briefing)
 *
 * Formats the structured briefing as a plain-text block for system prompt injection.
 * Each room prepends this to its system context before the first user message.
 *
 * Example output:
 *   ## Recent Activity
 *   - declaration created: Job #145 filed
 *
 *   ## Related Seat Activity
 *   - ARCHIVIST: memory recorded — Job #145 variance flagged
 *   - VERA: interpretation requested — invoice reconciliation
 *
 *   ## Active Tasks
 *   - Reconcile Good Friends Q2 ledger
 */
export function formatBriefingForPrompt(briefing) {
  const lines = []

  if (briefing.recentSignals.length) {
    lines.push("## Recent Activity")
    for (const s of briefing.recentSignals.slice(0, 6)) {
      const label = s.type.replace(/_/g, " ").toLowerCase()
      lines.push(`- ${label}${s.title ? ": " + s.title : ""}`)
    }
  }

  const relatedEntries = Object.entries(briefing.relatedSeats)
  if (relatedEntries.length) {
    lines.push("\n## Related Seat Activity")
    for (const [seat, signals] of relatedEntries) {
      for (const s of signals.slice(0, 2)) {
        const label = s.type.replace(/_/g, " ").toLowerCase()
        lines.push(`- ${seat.toUpperCase()}: ${label}${s.title ? " — " + s.title : ""}`)
      }
    }
  }

  if (briefing.activeTasks.length) {
    lines.push("\n## Active Tasks")
    for (const t of briefing.activeTasks.slice(0, 5)) {
      lines.push(`- ${t.title || t.id}`)
    }
  }

  if (briefing.openTensions.length) {
    lines.push("\n## Open Tensions")
    for (const t of briefing.openTensions.slice(0, 3)) {
      lines.push(`- ${t.question || t.title || t.id}`)
    }
  }

  return lines.join("\n")
}

// ── Internal helpers ──────────────────────────────────────────────────────────
// These read from localStorage directly. If dedicated engine functions for
// tasks/tensions exist in the codebase, swap these imports to use them instead.

function _loadActiveTasks(lane) {
  try {
    const raw = localStorage.getItem("pacer_tasks")
    if (!raw) return []
    const tasks = JSON.parse(raw)
    const all = Array.isArray(tasks) ? tasks : Object.values(tasks)
    return all.filter(t =>
      t.lane === lane &&
      t.status !== "complete" &&
      t.status !== "rejected"
    )
  } catch { return [] }
}

function _loadOpenTensions(lane) {
  try {
    const raw = localStorage.getItem("pacer_tensions")
    if (!raw) return []
    const tensions = JSON.parse(raw)
    const all = Array.isArray(tensions) ? tensions : Object.values(tensions)
    return all
      .filter(t => !t.resolvedAt && (!t.lane || t.lane === lane))
      .slice(0, 10)
  } catch { return [] }
}
