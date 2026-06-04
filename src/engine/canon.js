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
  "JPG-001","JPG-002","JPG-003","JPG-004","JPG-005","JPG-006",
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

  // ── JPG Founding Doctrine ────────────────────────────────────────────────────
  // Methodological operating law extracted from decisions already made across
  // FleetFlow, PACER, and JPG Ventures. Not invented here — recognized here.
  // Each rule is testable, violable, and load-bearing for everything downstream.

  {
    id:            "JPG-001",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "JPG-001: Reality Before Preference",
    content:       "Evidence outranks what we hoped was true. When data conflicts with belief, the data wins. Decisions begin from what is, not from what we want to be true. This rule is violated whenever a metric that contradicts a preferred narrative gets ignored, whenever a plan proceeds despite early signals of failure, or whenever a problem is framed to match a pre-decided answer. FleetFlow was built because revenue leakage was real and was being treated as negligible — the preference was that jobs were being captured correctly. PACER's VERA was built to report condition rather than status, because status reporting is preference-shaped. Any decision framework, dashboard, or AI response that softens reality to protect comfort violates this principle. Future policies around measurement, reporting, and conflict resolution all inherit from this rule.",
    wound:         "Estimates were presented optimistically because the accurate numbers would have been uncomfortable in the room. When operations reflected the real figures, course corrections were more expensive than they would have been had the original estimate been honest. This happened across different contexts before a rule was required to make it stop.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780451000000,
    status:        "active",
  },
  {
    id:            "JPG-002",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "JPG-002: Systems Over Memory",
    content:       "Critical truth must survive individual people, moods, and forgotten conversations. If it matters, it must exist in a system — not in someone's head, not in a chat thread, not in a meeting that only three people attended. This rule is violated when critical decisions are made verbally without recorded reasoning, when a single person holds institutional knowledge that no system mirrors, or when 'we talked about this' substitutes for 'we declared this.' PACER exists because humans spend ninety minutes arguing a decision and nine seconds documenting it. FleetFlow exists because job information living in crew members' heads does not make it into invoices. Every storage architecture, every persistence mechanism, every warning about undeclared doctrine descends from this rule. The test: if the person who made this decision were unreachable tomorrow, would the institution still know why the decision was made?",
    wound:         "A crew member who understood a recurring client's access and handling requirements left without transferring that knowledge. The next crew had no record to consult. The client had to re-explain conditions that should have been documented. A preventable problem occurred because the institutional knowledge was stored in a person rather than a system.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780452000000,
    status:        "active",
  },
  {
    id:            "JPG-003",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "JPG-003: Visibility Before Optimization",
    content:       "Nothing gets improved until it can be seen clearly. Optimization without measurement is guessing. Measurement without visibility is noise. This rule is violated when fixes are attempted before the actual shape of a problem is understood, when features are added before measuring whether existing ones are used, or when a metric is optimized that is not the actual bottleneck. VERA was built before any automated remediation because the institution must be able to see drift before it can be expected to act on it. FleetFlow's revenue dashboard preceded any automation of collection. The sequence is always: make it visible, then make it legible, then consider acting on it. Every dashboard, forecast, and health score in this system is an upstream act — not a solution, but a prerequisite for one.",
    wound:         "Efficiency improvements were attempted before the actual shape of the problem was understood. The improvements made certain parts of the process faster. The part that was causing the loss remained unaddressed because it had not been made visible first. The process ran faster. The structural problem continued at the same rate. The diagnosis was wrong.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780453000000,
    status:        "active",
  },
  {
    id:            "JPG-004",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "JPG-004: Capture Truth at the Moment It Appears",
    content:       "Decisions, contradictions, and discoveries must be recorded at the transition point — not reconstructed later from memory. Information degrades between the moment it is known and the moment it is documented. A decision recorded an hour after the meeting is already shaped by the mood of the walk back. This rule is violated whenever a meeting ends without recording what was decided and why, whenever a conflict is resolved without noting the reasoning, or whenever a declarable moment passes undeclared. The Declaration Engine was built as a direct implementation of this principle — capture prompts appear at the moment of creation, not after. The conflict resolution note field exists because the reasoning behind a resolution is more valuable than the resolution itself. Every transition-point capture mechanism in this system descends from this rule.",
    wound:         "A pricing decision was discussed verbally and not written down. Three days later two people in the same organization disagreed about what had been decided. Both believed their version was accurate. Both were reconstructing from memory. The original decision was unrecoverable. A new decision was made to replace an unrecorded one, with no way to know whether the replacement was better or worse than what had actually been agreed.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780454000000,
    status:        "active",
  },
  {
    id:            "JPG-005",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "JPG-005: Small Leaks Become Large Losses",
    content:       "Ignored variance compounds until it becomes expensive. A three percent revenue leak ignored for two years is not a three percent problem — it is a structural problem that has been running for two years. A doctrine drifting slowly is not a small concern — it is an organization gradually becoming something different from what it declared itself to be. This rule is violated whenever a small discrepancy is postponed because the absolute number looks manageable, whenever a single missed declaration is treated as inconsequential, or whenever slow drift is accepted as 'not urgent yet.' FleetFlow's entire founding insight is this rule applied to operations. PACER's drift detection and forecast exist because a doctrine that loses five points per month does not look alarming until month six. Every warning system, every forecast horizon, every alert threshold in this system is an enforcement mechanism for this rule. The question is never whether the leak matters now. It is whether it will matter at scale.",
    wound:         "A consistent gap between estimated and actual job time was classified as acceptable variance for nearly two years. Each individual instance was small enough to defer. Accumulated, the gap represented a structural loss that would have cost a fraction of the correction if addressed at month three instead of month twenty-four. The variance was visible throughout. It was repeatedly decided it was too small to prioritize. It was not too small. It was too early to be painful.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780455000000,
    status:        "active",
  },
  {
    id:            "JPG-006",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "JPG-006: The Scar Tissue Principle",
    content:       "Every durable organizational capability originated as a response to a specific injury. If the injury is forgotten, the capability becomes ritual. If the injury is remembered, the capability remains adaptive. This principle governs why the wound field exists, why founding wounds are more valuable than founding principles, and why every declaration must be testable against its original purpose rather than defended as tradition. Applied to every feature in this system: the delivery gate exists because leverage disappeared after an unload. VERA exists because drift was invisible until it became expensive. The Declaration Engine exists because knowledge evaporated at the moment of transition. The wound field exists because PACER found five foundational declarations with no recorded injuries — the WHY was being lost while the WHAT was preserved. Every capability that forgets its wound risks becoming the kind of rule that survives long after the problem it solved has disappeared. The wound is not context for the rule. The wound is the rule's reason to exist.",
    wound:         "PACER itself carried five founding declarations with no recorded wounds. The principles existed. The injuries that required them did not. The system was preserving WHAT while losing WHY — exactly the disease it was built to detect, operating inside its own founding layer. The Scar Tissue Principle was written into the system to prevent that from happening again.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780456000000,
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
      ? { ...d, importance: IMPORTANCE.FOUNDATIONAL, conflicts: d.conflicts || [], lastReferenced: d.lastReferenced || null, wound: d.wound ?? null }
      : SEED_IDS.has(d.id) && d.wound === undefined
      ? { ...d, wound: null }
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
// wound: the specific failure or incident that made this declaration necessary
export function createDeclaration({
  type          = "rule",
  label,
  content,
  wound         = null,
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
    wound,
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
  saveDeclarations(all.map(d =>
    d.id === id ? { ...d, lastReferenced: Date.now(), refCount: (d.refCount || 0) + 1 } : d
  ))
}

// Doctrine Health Score — 0 to 100. Pure math on existing data.
// freshness(25) + references(25) + scrutiny(20) + conflicts(20) + reviews(10)
export function getDoctineHealth(doc) {
  const stats = getChallengeStats(doc.id)

  // Freshness (0-25): 30-day linear decay since last AI reference
  const daysSince  = doc.lastReferenced ? (Date.now() - doc.lastReferenced) / 86400000 : 999
  const freshness  = Math.round(Math.max(0, 25 * (1 - Math.min(1, daysSince / 30))))

  // References (0-25): how many times included in AI context (saturates at 10)
  const refCount   = doc.refCount || 0
  const references = Math.round(Math.min(25, refCount * 2.5))

  // Scrutiny (0-20): resolved challenges signal active, examined doctrine
  // baseline 10 (unchallenged is neutral), +2 per resolved, -3 per pending
  const resolved      = stats.conflict + stats.linked + stats.ignored
  const scrutiny      = Math.max(0, 10 + Math.min(10, resolved * 2) - Math.min(10, stats.pending * 3))

  // Conflicts (0-20): confirmed bidirectional conflicts erode doctrine integrity
  const conflictLinks = (doc.conflicts || []).length
  const conflicts     = Math.max(0, 20 - conflictLinks * 5)

  // Reviews (0-10): unresolved pending reviews depress the score
  const reviews       = Math.max(0, 10 - stats.pending * 5)

  const total = Math.min(100, freshness + references + scrutiny + conflicts + reviews)
  return { total, breakdown: { freshness, references, scrutiny, conflicts, reviews } }
}

// ── Doctrine Drift ─────────────────────────────────────────────────────────────
// Tracks how health scores change across sessions so VERA can detect decay,
// not just staleness. An institution can fail a doctrine by slowly ignoring it.

const HEALTH_HISTORY_KEY = "pacer_health_history"

function loadHealthHistory() {
  try { return JSON.parse(localStorage.getItem(HEALTH_HISTORY_KEY) || "[]") }
  catch { return [] }
}

// Records a health snapshot for every active declaration.
// Called once on session open. Retains 60 snapshots (~2 months of daily use).
export function snapshotDoctrineHealth() {
  const decls = loadDeclarations().filter(d => d.status === "active")
  if (decls.length === 0) return
  const scores = {}
  decls.forEach(d => { scores[d.id] = getDoctineHealth(d).total })
  const history = loadHealthHistory()
  localStorage.setItem(HEALTH_HISTORY_KEY, JSON.stringify(
    [{ ts: Date.now(), scores }, ...history].slice(0, 60)
  ))
}

// Returns the health history for a single declaration, newest first.
export function getDriftHistory(declarationId, limit = 10) {
  return loadHealthHistory()
    .filter(s => s.scores[declarationId] !== undefined)
    .slice(0, limit)
    .map(s => ({ ts: s.ts, score: s.scores[declarationId] }))
}

// Returns drift vs oldest available snapshot, or null if none / no change.
export function getDoctrineDrift(declarationId, currentScore) {
  const history = getDriftHistory(declarationId)
  if (history.length < 2) return null
  const baseline = history[history.length - 1]
  const delta    = currentScore - baseline.score
  if (delta === 0) return null
  const daysAgo  = Math.max(0, Math.floor((Date.now() - baseline.ts) / 86400000))
  return { delta, daysAgo, from: baseline.score }
}

// Projects future health using least-squares regression on snapshot history.
// Returns null if: insufficient history, < 1 day of span, or trend is not negative.
// horizons: days into the future to project (default 30/60/90).
export function getDoctineRiskForecast(declarationId, currentScore, horizons = [30, 60, 90]) {
  const history = getDriftHistory(declarationId, 10)
  if (history.length < 2) return null

  const t0  = history[history.length - 1].ts          // oldest snapshot epoch
  const now = Date.now()

  // (days-from-oldest, score) pairs — oldest first, current score appended
  const xy = [...history].reverse()
    .map(p => ({ x: (p.ts - t0) / 86400000, y: p.score }))
  xy.push({ x: (now - t0) / 86400000, y: currentScore })

  if (xy[xy.length - 1].x < 1) return null             // < 1 day of data span

  // Least-squares linear regression: y = a + b·x
  const n     = xy.length
  const sumX  = xy.reduce((s, p) => s + p.x, 0)
  const sumY  = xy.reduce((s, p) => s + p.y, 0)
  const sumXY = xy.reduce((s, p) => s + p.x * p.y, 0)
  const sumX2 = xy.reduce((s, p) => s + p.x * p.x, 0)
  const denom = n * sumX2 - sumX * sumX
  if (denom === 0) return null

  const b = (n * sumXY - sumX * sumY) / denom   // slope (pts/day, negative = decaying)
  const a = (sumY - b * sumX) / n               // intercept

  if (b >= 0) return null                        // not decaying — no forecast needed

  const currentX = (now - t0) / 86400000
  return {
    ratePerDay: Math.round(Math.abs(b) * 10) / 10,
    forecasts:  horizons.map(days => ({
      days,
      score: Math.max(0, Math.round(a + b * (currentX + days))),
    })),
  }
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
  const foundational = loadDeclarations().find(d => d.id === foundationalId)
  recordSignal({
    type:    SIGNAL_TYPES.REVIEW_CREATED,
    source:  "vera",
    title:   "Review required",
    summary: foundational?.label || foundationalId,
  })
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
  const foundational = loadDeclarations().find(d => d.id === review.foundationalId)
  recordSignal({
    type:    SIGNAL_TYPES.REVIEW_RESOLVED,
    source:  "vera",
    title:   foundational?.label || review.foundationalId,
    summary: decision,
  })
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

  recordSignal({
    type:    SIGNAL_TYPES.TENSION_RESOLVED,
    source:  "creative",
    title:   target.title,
    summary: resolution,
  })

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
  function candidate(doc, reason, type = "doctrine", reviewId = null) {
    if (!doc || seen.has(doc.id)) return
    seen.add(doc.id)
    urgent.push({ id: doc.id, label: doc.label, reason, type, reviewId })
  }

  if (oldestPending) {
    const doc = allDecls.find(d => d.id === oldestPending.foundationalId)
    const age = Math.floor((Date.now() - oldestPending.createdAt) / 86400000)
    candidate(doc, `oldest pending · ${age > 0 ? `${age}d` : "today"}`, "review", oldestPending.id)
  }
  if (mostConflicted && mostConflictedCount > 0) {
    candidate(mostConflicted, `${mostConflictedCount} confirmed conflict${mostConflictedCount !== 1 ? "s" : ""}`, "doctrine")
  }
  const staleF = getStaleDoctrines(30).filter(d => d.importance === IMPORTANCE.FOUNDATIONAL)
  if (staleF[0]) {
    const days = staleF[0].lastReferenced ? Math.floor((Date.now() - staleF[0].lastReferenced) / 86400000) : null
    candidate(staleF[0], days ? `${days}d without reference` : "never referenced", "doctrine")
  }
  // Worst drift: foundational doctrine whose health is decaying fastest across sessions
  let driftDoc = null, worstDelta = 0
  for (const doc of foundational) {
    const drift = getDoctrineDrift(doc.id, getDoctineHealth(doc).total)
    if (drift && drift.delta < worstDelta) { worstDelta = drift.delta; driftDoc = { doc, drift } }
  }
  if (driftDoc && worstDelta <= -10) {
    candidate(driftDoc.doc, `drifting ${worstDelta} pts · ${driftDoc.drift.daysAgo}d`, "doctrine")
  }

  // Worst projection: foundational doctrine most at risk in the next 30 days
  let worstProjection = null, worstScore30d = Infinity
  for (const doc of foundational) {
    const forecast = getDoctineRiskForecast(doc.id, getDoctineHealth(doc).total)
    if (!forecast) continue
    const score30d = forecast.forecasts[0]?.score ?? 100
    if (score30d < worstScore30d) {
      worstScore30d = score30d
      worstProjection = {
        id:         doc.id,
        label:      doc.label,
        score30d,
        score60d:   forecast.forecasts[1]?.score ?? 100,
        score90d:   forecast.forecasts[2]?.score ?? 100,
        ratePerDay: forecast.ratePerDay,
      }
    }
  }
  if (worstProjection && worstScore30d >= 70) worstProjection = null
  if (worstProjection) {
    const doc = foundational.find(d => d.id === worstProjection.id)
    candidate(doc, `projected ${worstProjection.score30d} in 30d`, "doctrine")
  }

  return {
    pendingCount:     pending.length,
    oldestPending:    oldestPending
      ? { ...oldestPending, declaration: allDecls.find(d => d.id === oldestPending.foundationalId) || null }
      : null,
    mostChallenged:   mostChallengedCount > 0 ? { ...mostChallenged, challengeCount: mostChallengedCount } : null,
    mostConflicted:   mostConflictedCount > 0 ? { ...mostConflicted, conflictCount: mostConflictedCount } : null,
    needsAttention:   urgent,
    worstProjection,
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
