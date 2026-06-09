// src/engine/journeys.js
// Journey — a first-class citizen. The path is the intelligence.
// Tracks movement through meaning, not just movement through rooms.

import { fsWrite, fsHydrate } from "./store.js"

const STORE_KEY = "pacer_journeys_v1"

export const JOURNEY_STATUS = {
  ACTIVE:    "active",
  RESOLVED:  "resolved",
  ABANDONED: "abandoned",
}

// The cognitive flow: each room knows which door matters next.
// This is the Keymaker layer — not what room you're in, but what room comes after.
export const COGNITIVE_FLOW = {
  vera:      { nextRoom: "archivist", reason: "Testimony received. Archive and cross-reference." },
  archivist: { nextRoom: "muse",      reason: "Pattern found. Meaning may be unresolved." },
  muse:      { nextRoom: "creative",  reason: "Hypothesis needs narrative form — bring it to KODEX." },
  creative:  { nextRoom: "council",   reason: "Meaning is formed. Bring it to governance." },
  council:   { nextRoom: "kel",       reason: "Decision reached. Execution is the next door." },
  kel:       { nextRoom: "ops",       reason: "Plan approved. Ready to operationalize." },
  ops:       { nextRoom: "vera",      reason: "Observe the outcome of what was executed." },
}

function load() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "[]") }
  catch { return [] }
}

function save(items) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(items)) }
  catch {}
}

export function startJourney({ originRoom, carrying = null }) {
  const items      = load()
  const wasActive  = items.filter(j => j.status === JOURNEY_STATUS.ACTIVE)
  const updated    = items.map(j =>
    j.status === JOURNEY_STATUS.ACTIVE
      ? { ...j, status: JOURNEY_STATUS.ABANDONED, updatedAt: Date.now() }
      : j
  )
  const journey = {
    id:          `journey_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    startedAt:   Date.now(),
    updatedAt:   Date.now(),
    status:      JOURNEY_STATUS.ACTIVE,
    originRoom,
    currentRoom: originRoom,
    carrying,
    trail:       [],
    outcome:     null,
  }
  save([journey, ...updated])
  fsWrite("journeys", journey.id, journey)
  wasActive.forEach(j => {
    const abandoned = updated.find(u => u.id === j.id)
    if (abandoned) fsWrite("journeys", abandoned.id, abandoned)
  })
  return journey
}

export function moveJourney(toRoom, reason = "") {
  const items = load()
  const idx   = items.findIndex(j => j.status === JOURNEY_STATUS.ACTIVE)
  if (idx === -1) return null
  const j = items[idx]
  if (j.currentRoom === toRoom) return j
  const step    = { from: j.currentRoom, to: toRoom, reason, timestamp: Date.now() }
  const updated = { ...j, currentRoom: toRoom, trail: [...j.trail, step], updatedAt: Date.now() }
  items[idx]    = updated
  save(items)
  fsWrite("journeys", updated.id, updated)
  return updated
}

export function getActiveJourney() {
  return load().find(j => j.status === JOURNEY_STATUS.ACTIVE) || null
}

export function getJourneys(limit = 20) {
  return load().slice(0, limit)
}

export function closeJourney(outcome = "") {
  const items = load()
  const idx   = items.findIndex(j => j.status === JOURNEY_STATUS.ACTIVE)
  if (idx === -1) return null
  items[idx] = { ...items[idx], status: JOURNEY_STATUS.RESOLVED, outcome, updatedAt: Date.now() }
  save(items)
  fsWrite("journeys", items[idx].id, items[idx])
  return items[idx]
}

export function hydrateJourneys() {
  return fsHydrate("journeys", STORE_KEY, { orderField: "startedAt" })
}
