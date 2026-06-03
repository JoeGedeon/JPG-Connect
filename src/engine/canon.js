// src/engine/canon.js
// PACER declaration store + constitutional seed infrastructure

import { recordSignal, SIGNAL_TYPES } from "./signals.js"

const STORAGE_KEY  = "pacer_canon"
const TENSION_KEY  = "pacer_tensions"

// Constitutional seeds — never emit behavioral signals, seeded idempotently
const SEED_IDS = new Set([
  "PFP-001","PFP-002","PFP-003","PFP-004","PFP-005","PFP-006",
  "KX-001","KX-002","KX-003","KX-004","KX-006","KX-007",
  "GENESIS-001","PACER-HQ-001",
  "VERA-001","AP-001","AP-002","AP-003","AP-004","AP-005","AWK-001",
])

const CONSTITUTIONAL_SEEDS = [
  {
    id:        "PFP-005",
    category:  "global",
    type:      "rule",
    label:     "PFP-005: Continuity Is Not Storage",
    content:   "Memory without continuity is just storage. Continuity is not how much you remember. It is whether the system can pick up where it left off — across time, across sessions, across people. The question is never 'what did we store?' It is 'what can we recognize when we return?'",
    priority:  1,
    createdAt: 1780449000000,
    status:    "active",
  },
  {
    id:        "PFP-006",
    category:  "global",
    type:      "rule",
    label:     "PFP-006: Compression Reveals Structure",
    content:   "Clarity is not accumulation. Interference increases with surface. Structure emerges through compression. The purpose of the system is not to increase awareness. It is to reduce interference. Remove enough surface noise and the load-bearing dependency becomes visible. Less is not a constraint. Less is the mechanism.",
    priority:  1,
    createdAt: 1780450000000,
    status:    "active",
  },
]

// ── Declaration store ────────────────────────────────────────────────────────

function loadDeclarations() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") }
  catch { return [] }
}

function saveDeclarations(declarations) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(declarations)) }
  catch {}
}

export function seedCanon() {
  const existing    = loadDeclarations()
  const existingIds = new Set(existing.map(d => d.id))
  const toAdd       = CONSTITUTIONAL_SEEDS.filter(s => !existingIds.has(s.id))
  if (toAdd.length > 0) saveDeclarations([...existing, ...toAdd])
}

export function loadAllCanon() {
  return loadDeclarations().sort((a, b) => b.createdAt - a.createdAt)
}

// originTension: id of the tension this declaration resolved (if any).
// Closes the chain of custody: ARCHIVIST can show which argument produced each conclusion.
export function createDeclaration({ type = "rule", label, content, category = "ops", priority = 2, originTension = null }) {
  const existing    = loadDeclarations()
  const id          = `${type}_${category}_${Date.now()}`
  const declaration = {
    id,
    category,
    type,
    label,
    content,
    priority,
    originTension,
    createdAt: Date.now(),
    status:    "active",
  }
  saveDeclarations([declaration, ...existing])
  if (!SEED_IDS.has(id)) {
    recordSignal({
      type:   SIGNAL_TYPES.DECLARATION_CREATED,
      source: category,
      title:  label,
    })
  }
  return declaration
}

export function releaseDeclaration(id) {
  const existing = loadDeclarations()
  const target   = existing.find(d => d.id === id)
  if (!target) return
  saveDeclarations(existing.map(d => d.id === id ? { ...d, status: "released" } : d))
  if (!SEED_IDS.has(id)) {
    recordSignal({
      type:   SIGNAL_TYPES.DECLARATION_RELEASED,
      source: target.category,
      title:  target.label,
    })
  }
}

export function buildCanonContext(laneCategory) {
  const all = loadDeclarations().filter(d => d.status === "active")
  const relevant = all
    .filter(d => d.category === "global" || d.category === laneCategory)
    .sort((a, b) => (a.priority || 2) - (b.priority || 2))
    .slice(0, 12)
  if (relevant.length === 0) return ""
  return [
    "\n\n--- ACTIVE DECLARATIONS ---",
    ...relevant.map(d => `[${d.id}] ${d.label}\n${d.content}`),
    "--- END DECLARATIONS ---",
  ].join("\n")
}

// ── Tension store ────────────────────────────────────────────────────────────

function loadTensionsRaw() {
  try { return JSON.parse(localStorage.getItem(TENSION_KEY) || "[]") }
  catch { return [] }
}

function saveTensions(tensions) {
  try { localStorage.setItem(TENSION_KEY, JSON.stringify(tensions)) }
  catch {}
}

export function createTension({ title, statement, affectedWings = [] }) {
  const tensions = loadTensionsRaw()
  const tension  = {
    id:           `tension_${Date.now()}`,
    title,
    statement,
    status:       "open",
    affectedWings,
    resolution:   null,
    closedBy:     null,
    createdAt:    Date.now(),
    resolvedAt:   null,
  }
  saveTensions([tension, ...tensions])
  recordSignal({
    type:    SIGNAL_TYPES.INTERPRETATION_REQUESTED,
    source:  "creative",
    title,
    summary: statement,
  })
  return tension
}

// Resolution becomes a declaration in ARCHIVIST with originTension set,
// so the chain of custody is complete in both directions.
export function resolveTension(id, resolution) {
  const tensions = loadTensionsRaw()
  const target   = tensions.find(t => t.id === id)
  if (!target) return null

  const declaration = createDeclaration({
    type:          "resolution",
    label:         `Resolution: ${target.title}`,
    content:       resolution,
    category:      "global",
    priority:      1,
    originTension: id,
  })

  saveTensions(tensions.map(t =>
    t.id === id
      ? { ...t, status: "resolved", resolution, closedBy: declaration.id, resolvedAt: Date.now() }
      : t
  ))

  return declaration
}

export function loadTensions(status = null) {
  const all = loadTensionsRaw()
  return status ? all.filter(t => t.status === status) : all
}

export function loadOpenTensions() {
  return loadTensionsRaw()
    .filter(t => t.status === "open")
    .sort((a, b) => a.createdAt - b.createdAt)
}

export function getDoctrineDebt() {
  const open   = loadTensionsRaw().filter(t => t.status === "open")
  const byWing = {}
  open.forEach(t => {
    t.affectedWings.forEach(w => { byWing[w] = (byWing[w] || 0) + 1 })
  })
  const oldest = [...open].sort((a, b) => a.createdAt - b.createdAt)[0] || null
  return { count: open.length, byWing, oldest }
}
