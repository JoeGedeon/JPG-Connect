// src/engine/canon.js
// PACER declaration store + constitutional seed infrastructure

import { recordSignal, SIGNAL_TYPES } from "./signals.js"

const STORAGE_KEY = "pacer_canon"

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

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") }
  catch { return [] }
}

function save(declarations) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(declarations)) }
  catch {}
}

// Seeds constitutional entries idempotently on app load
export function seedCanon() {
  const existing = load()
  const existingIds = new Set(existing.map(d => d.id))
  const toAdd = CONSTITUTIONAL_SEEDS.filter(s => !existingIds.has(s.id))
  if (toAdd.length > 0) save([...existing, ...toAdd])
}

export function loadAllCanon() {
  return load().sort((a, b) => b.createdAt - a.createdAt)
}

export function createDeclaration({ type = "rule", label, content, category = "ops", priority = 2 }) {
  const existing = load()
  const id = `${type}_${category}_${Date.now()}`
  const declaration = {
    id,
    category,
    type,
    label,
    content,
    priority,
    createdAt: Date.now(),
    status: "active",
  }
  save([declaration, ...existing])
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
  const existing = load()
  const target   = existing.find(d => d.id === id)
  if (!target) return
  save(existing.map(d => d.id === id ? { ...d, status: "released" } : d))
  if (!SEED_IDS.has(id)) {
    recordSignal({
      type:   SIGNAL_TYPES.DECLARATION_RELEASED,
      source: target.category,
      title:  target.label,
    })
  }
}

// Builds the AI system prompt injection from active declarations
export function buildCanonContext(laneCategory) {
  const all = load().filter(d => d.status === "active")
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
