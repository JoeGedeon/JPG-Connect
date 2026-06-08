// src/engine/rulings.js
// The archive remembers. The constitution constrains. The ruling binds.
//
// A ledger says: this happened.
// A precedent says: this happened, therefore this must be considered next time.
// That word — "therefore" — is where consequence enters the building.

import { recordSignal, SIGNAL_TYPES } from "./signals.js"

const STORAGE_KEY = "pacer_rulings"

// ── Constants ─────────────────────────────────────────────────────────────────

export const RULING_STATUSES = {
  draft:      { label: "Draft",      color: "#8888a0" },
  active:     { label: "Active",     color: "#00c896" },
  challenged: { label: "Challenged", color: "#ff9f43" },
  upheld:     { label: "Upheld",     color: "#8daac4" },
  overturned: { label: "Overturned", color: "#ff6b6b" },
  superseded: { label: "Superseded", color: "#5858a0" },
}

// The seat exercising authority determines what kind of ruling can be issued.
// A ruling must carry its own jurisdiction — the artifact explains itself.
export const RULING_AUTHORITIES = {
  interpretive:   "Interpretive",    // KODEX: meaning, doctrine, canonical interpretation
  operational:    "Operational",     // OPSCORE: procedure, execution standards
  archival:       "Archival",        // ARCHIVIST: what persists, what is preserved, retention policy
  constitutional: "Constitutional",  // council-level: structure, constraints on the institution itself
}

// ── Storage ───────────────────────────────────────────────────────────────────

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") }
  catch { return [] }
}

function save(rulings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rulings)) }
  catch {}
}

function nextId() {
  return `RUL-${String(load().length + 1).padStart(3, "0")}`
}

function updateRuling(id, changes) {
  const rulings = load().map(r => r.id === id ? { ...r, ...changes } : r)
  save(rulings)
  return rulings.find(r => r.id === id) || null
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

/**
 * Create a ruling in draft state. The ruling carries its own jurisdiction:
 * who issued it, under what authority, on what constitutional basis,
 * what it constrains, and which lanes it affects.
 *
 * A draft ruling does not yet bind. issueRuling() makes it active.
 */
export function createRuling({
  issuingSeat,
  authority,
  constitutionalBasis = [],
  constraints = [],
  affectedLanes = [],
  summary = "",
  fullText = "",
  supersedes = null,
}) {
  const ruling = {
    id:                 nextId(),
    issuingSeat,
    authority,
    constitutionalBasis,
    constraints,
    affectedLanes,
    summary,
    fullText,
    status:             "draft",
    createdAt:          Date.now(),
    issuedAt:           null,
    challengedAt:       null,
    challengeBasis:     null,
    resolvedAt:         null,
    supersedes,
    supersededBy:       null,
  }
  save([ruling, ...load()])
  return ruling
}

/**
 * Issue a draft ruling — move it to active, making it binding.
 * If this ruling supersedes another, the prior ruling is marked superseded.
 */
export function issueRuling(id) {
  const ruling = updateRuling(id, { status: "active", issuedAt: Date.now() })
  if (!ruling) return null

  if (ruling.supersedes) {
    updateRuling(ruling.supersedes, { status: "superseded", supersededBy: id })
  }

  recordSignal({
    type:    SIGNAL_TYPES.RULING_ISSUED,
    source:  ruling.issuingSeat?.toLowerCase() || "council",
    title:   ruling.summary || ruling.id,
    summary: ruling.authority,
  })
  return ruling
}

/**
 * Challenge an active ruling. Does not overturn it — initiates review.
 * A ruling that cannot be challenged is a suggestion pretending to be authority.
 */
export function challengeRuling(id, basis = "") {
  const ruling = updateRuling(id, {
    status:         "challenged",
    challengedAt:   Date.now(),
    challengeBasis: basis,
  })
  if (!ruling) return null

  recordSignal({
    type:    SIGNAL_TYPES.RULING_CHALLENGED,
    source:  "council",
    title:   ruling.summary || ruling.id,
    summary: basis,
  })
  return ruling
}

/**
 * Uphold a challenged ruling — dismiss the challenge, ruling stands.
 * Status moves to "upheld" rather than back to "active" so the challenge
 * record is preserved. The ruling continues to bind.
 */
export function upholdRuling(id) {
  const ruling = updateRuling(id, { status: "upheld", resolvedAt: Date.now() })
  if (!ruling) return null

  recordSignal({
    type:    SIGNAL_TYPES.RULING_UPHELD,
    source:  ruling.issuingSeat?.toLowerCase() || "council",
    title:   ruling.summary || ruling.id,
    summary: "Challenge dismissed. Ruling stands.",
  })
  return ruling
}

/**
 * Overturn a challenged ruling — reverse it.
 * The record is preserved. The ruling no longer binds.
 * A ruling that cannot be overturned is dogma pretending to be wisdom.
 */
export function overturnRuling(id) {
  const ruling = updateRuling(id, { status: "overturned", resolvedAt: Date.now() })
  if (!ruling) return null

  recordSignal({
    type:    SIGNAL_TYPES.RULING_OVERTURNED,
    source:  "council",
    title:   ruling.summary || ruling.id,
    summary: "Ruling reversed. Record preserved.",
  })
  return ruling
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function getRuling(id) {
  return load().find(r => r.id === id) || null
}

export function getAllRulings() {
  return load()
}

/**
 * Returns all rulings currently in effect (active or upheld after challenge).
 * Optionally filter by lane — what binds a specific wing right now.
 */
export function getActiveRulings(laneId = null) {
  const binding = load().filter(r => r.status === "active" || r.status === "upheld")
  if (!laneId) return binding
  return binding.filter(r => r.affectedLanes.length === 0 || r.affectedLanes.includes(laneId))
}

export function getRulingsByStatus(status) {
  return load().filter(r => r.status === status)
}

/**
 * Follow the supersedes chain backward from a ruling.
 * Returns the full precedent ancestry, oldest last.
 * This is the memory that compounds structurally.
 */
export function getPrecedentChain(id) {
  const all   = load()
  const chain = []
  let current = all.find(r => r.id === id)
  while (current) {
    chain.push(current)
    current = current.supersedes ? all.find(r => r.id === current.supersedes) : null
  }
  return chain
}

/**
 * The complete institutional record — every ruling ever issued, in reverse
 * chronological order. Status does not filter here. The ledger is total.
 */
export function getRulingHistory() {
  return load()
}
