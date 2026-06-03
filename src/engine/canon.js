// src/engine/canon.js
// PACER declaration store + constitutional seed infrastructure

import { recordSignal, SIGNAL_TYPES } from "./signals.js"

const STORAGE_KEY  = "pacer_canon"
const TENSION_KEY  = "pacer_tensions"
const REVIEW_KEY   = "pacer_conflict_reviews"

// Importance tiers: foundational (load-bearing) → operational (active policy) → tactical (context-specific)
export const IMPORTANCE = {
  FOUNDATIONAL: "foundational",
  OPERATIONAL:  "operational",
  TACTICAL:     "tactical",
}

// Constitutional seeds — never emit behavioral signals, seeded idempotently
const SEED_IDS = new Set([
  "PFP-001","PFP-002","PFP-003","PFP-004","PFP-005","PFP-006",
  "KX-001","KX-002","KX-003","KX-004","KX-006","KX-007",
  "GENESIS-001","PACER-HQ-001",
  "VERA-001","AP-001","AP-002","AP-003","AP-004","AP-005","AWK-001",
])

const CONSTITUTIONAL_SEEDS = [
  {
    id:            "PFP-005",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "PFP-005: Continuity Is Not Storage",
    content:       "Memory without continuity is just storage. Continuity is not how much you remember. It is whether the system can pick up where it left off — across time, across sessions, across people. The question is never 'what did we store?' It is 'what can we recognize when we return?'",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780449000000,
    status:        "active",
  },
  {
    id:            "PFP-006",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "PFP-006: Compression Reveals Structure",
    content:       "Clarity is not accumulation. Interference increases with surface. Structure emerges through compression. The purpose of the system is not to increase awareness. It is to reduce interference. Remove enough surface noise and the load-bearing dependency becomes visible. Less is not a constraint. Less is the mechanism.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780450000000,
    status:        "active",
  },
]

// ── Declaration store ──────────────────────────────────────────────────────────

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
  // Backfill importance and conflicts onto existing seeds that predate this field
  const patched = existing.map(d =>
    SEED_IDS.has(d.id) && !d.importance
      ? { ...d, importance: IMPORTANCE.FOUNDATIONAL, conflicts: d.conflicts || [], lastReferenced: d.lastReferenced || null }
      : d
  )
  if (toAdd.length > 0 || patched.some((d, i) => d !== existing[i])) {
    saveDeclarations([...patched, ...toAdd])
  }
}

export function loadAllCanon() {
  return loadDeclarations().sort((a, b) => b.createdAt - a.createdAt)
}

// importance: "foundational" | "operational" | "tactical" (default "operational")
// originTension: chain of custody from KODEX tension that produced this declaration
export function createDeclaration({
  type          = "rule",
  label,
  content,
  category      = "ops",
  priority      = 2,
  importance    = IMPORTANCE.OPERATIONAL,
  originTension = null,
}) {
  const existing    = loadDeclarations()
  const id          = `${type}_${category}_${Date.now()}`
  const declaration = {
    id,
    category,
    type,
    importance,
    label,
    content,
    priority,
    conflicts:      [],
    lastReferenced: null,
    originTension,
    createdAt:      Date.now(),
    status:         "active",
  }
  saveDeclarations([declaration, ...existing])
  if (!SEED_IDS.has(id)) {
    recordSignal({
      type:   SIGNAL_TYPES.DECLARATION_CREATED,
      source: category,
      title:  label,
    })
    // Auto-flag for review: foundational doctrine in this domain that hasn't been
    // recently consulted. The system doesn't claim conflict — it requires comparison.
    const recentThreshold = Date.now() - 7 * 86400000
    const toReview = loadDeclarations().filter(d =>
      d.status === "active" &&
      d.importance === IMPORTANCE.FOUNDATIONAL &&
      d.id !== id &&
      (d.category === "global" || d.category === category) &&
      (!d.lastReferenced || d.lastReferenced < recentThreshold)
    )
    toReview.forEach(doc => _createConflictReview(id, doc.id))
  }
  return declaration
}

// Marks this declaration as referenced right now.
// Called by buildCanonContext() whenever a declaration is surfaced to the AI.
export function touchDeclaration(id) {
  const all = loadDeclarations()
  saveDeclarations(all.map(d => d.id === id ? { ...d, lastReferenced: Date.now() } : d))
}

// Elevates a declaration's importance tier.
// Foundational doctrine must be consciously elevated — it never defaults there.
export function setImportance(id, importance) {
  const all = loadDeclarations()
  saveDeclarations(all.map(d => d.id === id ? { ...d, importance } : d))
}

// Creates a bidirectional conflict link between two declarations.
// Neither is marked as wrong — the conflict is the fact worth surfacing.
export function declareConflict(idA, idB, note = "") {
  const all = loadDeclarations()
  const at  = Date.now()
  saveDeclarations(all.map(d => {
    if (d.id === idA) return { ...d, conflicts: [...(d.conflicts || []), { id: idB, note, at }] }
    if (d.id === idB) return { ...d, conflicts: [...(d.conflicts || []), { id: idA, note, at }] }
    return d
  }))
}

// ── Conflict review queue ─────────────────────────────────────────────────────
// A review is a pair (new declaration, foundational declaration) requiring
// conscious acknowledgment. The system flags them; humans resolve them.

function loadConflictReviewsRaw() {
  try { return JSON.parse(localStorage.getItem(REVIEW_KEY) || "[]") }
  catch { return [] }
}

function saveConflictReviews(reviews) {
  try { localStorage.setItem(REVIEW_KEY, JSON.stringify(reviews)) }
  catch {}
}

function _createConflictReview(newDeclarationId, foundationalId) {
  const existing = loadConflictReviewsRaw()
  if (existing.some(r => r.newDeclarationId === newDeclarationId && r.foundationalId === foundationalId)) return
  saveConflictReviews([{
    id:               `review_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
    newDeclarationId,
    foundationalId,
    status:           "pending",
    createdAt:        Date.now(),
    resolvedAt:       null,
  }, ...existing])
}

// Returns pending reviews with populated declaration objects.
// Filters out orphans (declarations that have been released/deleted).
export function getPendingConflictReviews() {
  const pending = loadConflictReviewsRaw().filter(r => r.status === "pending")
  const all     = loadDeclarations()
  return pending
    .map(r => ({
      ...r,
      newDeclaration: all.find(d => d.id === r.newDeclarationId) || null,
      foundational:   all.find(d => d.id === r.foundationalId)   || null,
    }))
    .filter(r => r.newDeclaration && r.foundational)
    .sort((a, b) => b.createdAt - a.createdAt)
}

// Mark a review as surfaced — called when it first appears in VERA's UI.
// Records the moment the system placed this conflict in front of a human.
export function markReviewSurfaced(reviewId) {
  const reviews = loadConflictReviewsRaw()
  if (!reviews.some(r => r.id === reviewId && !r.surfacedAt)) return
  saveConflictReviews(reviews.map(r =>
    r.id === reviewId && !r.surfacedAt ? { ...r, surfacedAt: Date.now() } : r
  ))
}

// Resolve a pending review with a full audit record.
// decision: "conflict" — creates bidirectional conflict link between declarations
//           "link"     — soft association, noted but not flagged as contradiction
//           "ignore"   — acknowledged, no conflict found
// note: optional human-written explanation of why this decision was made
export function resolveConflictReview(reviewId, decision, note = "") {
  const reviews = loadConflictReviewsRaw()
  const review  = reviews.find(r => r.id === reviewId)
  if (!review) return
  saveConflictReviews(reviews.map(r =>
    r.id === reviewId
      ? { ...r, status: decision, resolvedAt: Date.now(), resolution: { decision, note, at: Date.now() } }
      : r
  ))
  if (decision === "conflict") {
    declareConflict(review.newDeclarationId, review.foundationalId, note)
  }
}

// Returns all reviews (all statuses) involving a declaration, sorted newest first.
// Used by ARCHIVIST to show the full challenge history for any declaration.
export function getReviewsForDeclaration(declarationId) {
  const all = loadConflictReviewsRaw()
  const decls = loadDeclarations()
  return all
    .filter(r => r.newDeclarationId === declarationId || r.foundationalId === declarationId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(r => ({
      ...r,
      newDeclaration: decls.find(d => d.id === r.newDeclarationId) || null,
      foundational:   decls.find(d => d.id === r.foundationalId)   || null,
    }))
}

// Returns a challenge summary for a foundational declaration.
// Powers VERA's "challenged N times, conflicted N, linked N, ignored N" display.
export function getChallengeStats(foundationalId) {
  const reviews = loadConflictReviewsRaw().filter(r => r.foundationalId === foundationalId)
  return {
    total:     reviews.length,
    pending:   reviews.filter(r => r.status === "pending").length,
    conflict:  reviews.filter(r => r.status === "conflict").length,
    linked:    reviews.filter(r => r.status === "link").length,
    ignored:   reviews.filter(r => r.status === "ignore").length,
  }
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

// Returns active declarations not referenced in the last N days.
// Foundational declarations bubble to the top — neglecting them is highest risk.
export function getStaleDoctrines(days = 30) {
  const threshold = Date.now() - days * 86400000
  return loadDeclarations()
    .filter(d => d.status === "active")
    .filter(d => !d.lastReferenced || d.lastReferenced < threshold)
    .sort((a, b) => {
      if (a.importance === IMPORTANCE.FOUNDATIONAL && b.importance !== IMPORTANCE.FOUNDATIONAL) return -1
      if (b.importance === IMPORTANCE.FOUNDATIONAL && a.importance !== IMPORTANCE.FOUNDATIONAL) return 1
      const aRef = a.lastReferenced || a.createdAt
      const bRef = b.lastReferenced || b.createdAt
      return aRef - bRef
    })
}

export function buildCanonContext(laneCategory) {
  const all      = loadDeclarations().filter(d => d.status === "active")
  const relevant = all
    .filter(d => d.category === "global" || d.category === laneCategory)
    .sort((a, b) => (a.priority || 2) - (b.priority || 2))
    .slice(0, 12)
  if (relevant.length === 0) return ""
  // Touch every declaration that reaches the AI — this is how we track relevance over time
  relevant.forEach(d => touchDeclaration(d.id))
  return [
    "\n\n--- ACTIVE DECLARATIONS ---",
    ...relevant.map(d => `[${d.id}] ${d.label}\n${d.content}`),
    "--- END DECLARATIONS ---",
  ].join("\n")
}

// ── Tension store ──────────────────────────────────────────────────────────────

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
    importance:    IMPORTANCE.OPERATIONAL,
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

// Returns a governance pressure snapshot — what the institution needs to look at now.
// Only computes meaningful signals; returns nulls when nothing is under pressure.
export function getGovernanceSummary() {
  const allReviews   = loadConflictReviewsRaw()
  const allDecls     = loadDeclarations()
  const foundational = allDecls.filter(d => d.status === "active" && d.importance === IMPORTANCE.FOUNDATIONAL)

  const pending       = allReviews.filter(r => r.status === "pending").sort((a, b) => a.createdAt - b.createdAt)
  const oldestPending = pending[0] || null

  let mostChallenged = null, mostChallengedCount = 0
  let mostConflicted = null, mostConflictedCount = 0

  for (const doc of foundational) {
    const docReviews   = allReviews.filter(r => r.foundationalId === doc.id)
    const conflictCount = docReviews.filter(r => r.status === "conflict").length
    if (docReviews.length > mostChallengedCount) { mostChallengedCount = docReviews.length; mostChallenged = doc }
    if (conflictCount > mostConflictedCount)      { mostConflictedCount = conflictCount;      mostConflicted = doc }
  }

  // Needs attention: doctrines with confirmed pressure, deduplicated
  const seen   = new Set()
  const urgent = []
  function candidate(doc, reason) {
    if (!doc || seen.has(doc.id)) return
    seen.add(doc.id)
    urgent.push({ id: doc.id, label: doc.label, reason })
  }

  if (oldestPending) {
    const doc = allDecls.find(d => d.id === oldestPending.foundationalId)
    const age = Math.floor((Date.now() - oldestPending.createdAt) / 86400000)
    candidate(doc, `oldest pending · ${age > 0 ? `${age}d` : "today"}`)
  }
  if (mostConflicted && mostConflictedCount > 0) {
    candidate(mostConflicted, `${mostConflictedCount} confirmed conflict${mostConflictedCount !== 1 ? "s" : ""}`)
  }
  const staleF = getStaleDoctrines(30).filter(d => d.importance === IMPORTANCE.FOUNDATIONAL)
  if (staleF[0]) {
    const days = staleF[0].lastReferenced ? Math.floor((Date.now() - staleF[0].lastReferenced) / 86400000) : null
    candidate(staleF[0], days ? `${days}d without reference` : "never referenced")
  }

  return {
    pendingCount:    pending.length,
    oldestPending:   oldestPending
      ? { ...oldestPending, declaration: allDecls.find(d => d.id === oldestPending.foundationalId) || null }
      : null,
    mostChallenged:  mostChallengedCount > 0 ? { ...mostChallenged, challengeCount: mostChallengedCount } : null,
    mostConflicted:  mostConflictedCount > 0 ? { ...mostConflicted, conflictCount: mostConflictedCount } : null,
    needsAttention:  urgent,
  }
}

export function getDoctrineDebt() {
  const open   = loadTensionsRaw().filter(t => t.status === "open")
  const byWing = {}
  open.forEach(t => {
    t.affectedWings.forEach(w => { byWing[w] = (byWing[w] || 0) + 1 })
  })
  const oldest            = [...open].sort((a, b) => a.createdAt - b.createdAt)[0] || null
  const staleFoundational = getStaleDoctrines(30).filter(d => d.importance === IMPORTANCE.FOUNDATIONAL)
  const pendingReviews    = loadConflictReviewsRaw().filter(r => r.status === "pending").length
  return { count: open.length, byWing, oldest, staleFoundational: staleFoundational.length, pendingReviews }
}
