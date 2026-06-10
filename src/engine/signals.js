// src/engine/signals.js
// PACER behavioral observation layer — 200-signal FIFO

const MAX_SIGNALS  = 200
const STORAGE_KEY  = "pacer_signals"

export const SIGNAL_TYPES = {
  SESSION_OPENED:           "session_opened",
  SESSION_CLOSED:           "session_closed",
  DECLARATION_CREATED:      "declaration_created",
  DECLARATION_RELEASED:     "declaration_released",
  TASK_CREATED:             "task_created",
  TASK_COMPLETED:           "task_completed",
  TASK_STALE:               "task_stale",
  MEMORY_RECORDED:          "memory_recorded",
  INTERPRETATION_REQUESTED: "interpretation_requested",
  OBJECTIVE_UPDATED:        "objective_updated",
  REVIEW_CREATED:           "review_created",
  REVIEW_RESOLVED:          "review_resolved",
  TENSION_RESOLVED:         "tension_resolved",
  RULING_ISSUED:            "ruling_issued",
  RULING_CHALLENGED:        "ruling_challenged",
  RULING_UPHELD:            "ruling_upheld",
  RULING_OVERTURNED:        "ruling_overturned",
  // FleetFlow reality feed
  FF_JOB_COMPLETED:         "ff:job_completed",
  FF_ESTIMATE_APPROVED:     "ff:estimate_approved",
  FF_CLIENT_SIGNED:         "ff:client_signed",
  FF_PAYMENT_CONFIRMED:     "ff:payment_confirmed",
  FF_DELIVERY_CONFIRMED:    "ff:delivery_confirmed",
  FF_DRIVER_SIGNED:         "ff:driver_signed",
  FF_LOADING_COMPLETE:      "ff:loading_complete",
  FF_ESTIMATE_VARIANCE:     "ff:estimate_variance",
  FF_MISSING_SIGNATURE:     "ff:missing_signature",
  FF_PAYMENT_DELAY:         "ff:payment_delay",
  // Conductor-facing types
  OPERATIONAL_RISK:         "operational_risk",
  SCHEDULE_PRESSURE:        "schedule_pressure",
  MEMORY_PRESSURE:          "memory_pressure",
  MEANING_CONFLICT:         "meaning_conflict",
  PATTERN_DETECTED:         "pattern_detected",
  OBSERVATION_LOGGED:       "observation_logged",
  OPPORTUNITY_FLAGGED:      "opportunity_flagged",
  CREATIVE_DORMANCY:        "creative_dormancy",
  POSSIBILITY_SURFACED:     "possibility_surfaced",
  ESCALATION_TRIGGERED:     "escalation_triggered",
}

// Rich taxonomy for conductor routing — each entry carries institutional metadata.
// The conductor derives seat and signalType from here, never from hardcoded strings.
export const SIGNAL_TAXONOMY = {
  // ── Operational ──────────────────────────────────────────────────────────
  TASK_STALE: {
    type:        SIGNAL_TYPES.TASK_STALE,
    label:       "Stale Task",
    primarySeat: "opscore",
    description: "A task has remained in draft or pending status past its natural rhythm.",
    example:     "Task 'Confirm insurance docs' stale for 8 days — no one has moved it.",
    baseWeight:  32,
  },
  OPERATIONAL_RISK: {
    type:        SIGNAL_TYPES.OPERATIONAL_RISK,
    label:       "Operational Risk",
    primarySeat: "opscore",
    description: "Multiple overdue or stale tasks indicate a systemic execution gap.",
    example:     "Three moves this week have open tasks with no recent activity.",
    baseWeight:  42,
  },
  SCHEDULE_PRESSURE: {
    type:        SIGNAL_TYPES.SCHEDULE_PRESSURE,
    label:       "Schedule Pressure",
    primarySeat: "opscore",
    description: "Upcoming commitments are closer than comfortable without confirmed preparation.",
    example:     "Two moves in 48 hours. No crew confirmations recorded.",
    baseWeight:  38,
  },
  // ── Memory / Archive ─────────────────────────────────────────────────────
  DECLARATION_CREATED: {
    type:        SIGNAL_TYPES.DECLARATION_CREATED,
    label:       "Declaration Created",
    primarySeat: "archivist",
    description: "A formal institutional statement was recorded.",
    example:     "Joe declared: 'No moves on Sundays starting Q3.'",
    baseWeight:  20,
  },
  DECLARATION_RELEASED: {
    type:        SIGNAL_TYPES.DECLARATION_RELEASED,
    label:       "Declaration Released",
    primarySeat: "archivist",
    description: "A declaration was marked complete and archived.",
    example:     "Declaration 'Hire second driver' marked released.",
    baseWeight:  16,
  },
  MEMORY_RECORDED: {
    type:        SIGNAL_TYPES.MEMORY_RECORDED,
    label:       "Memory Recorded",
    primarySeat: "archivist",
    description: "An observation was logged to the permanent record.",
    example:     "Recorded: 'Storage unit D4 is at capacity. Do not overbook.'",
    baseWeight:  15,
  },
  MEMORY_PRESSURE: {
    type:        SIGNAL_TYPES.MEMORY_PRESSURE,
    label:       "Memory Pressure",
    primarySeat: "archivist",
    description: "Important institutional knowledge was recorded but has not been acted on.",
    example:     "Memory 'Client called about damage claim' recorded 5 days ago — no follow-up.",
    baseWeight:  30,
  },
  // ── Meaning / Interpretation ──────────────────────────────────────────────
  INTERPRETATION_REQUESTED: {
    type:        SIGNAL_TYPES.INTERPRETATION_REQUESTED,
    label:       "Tension Opened",
    primarySeat: "kodex",
    description: "An unresolved tension or contradiction was flagged for interpretive attention.",
    example:     "Tension: 'Estimate given verbally contradicts signed paperwork.'",
    baseWeight:  28,
  },
  MEANING_CONFLICT: {
    type:        SIGNAL_TYPES.MEANING_CONFLICT,
    label:       "Meaning Conflict",
    primarySeat: "kodex",
    description: "Two signals or declarations are pointing in opposite directions.",
    example:     "Declaration says 'prioritize retention' but signals show repeat client churn.",
    baseWeight:  35,
  },
  TENSION_RESOLVED: {
    type:        SIGNAL_TYPES.TENSION_RESOLVED,
    label:       "Tension Resolved",
    primarySeat: "kodex",
    description: "A previously flagged tension was closed.",
    example:     "Tension 'Verbal vs written estimate' resolved.",
    baseWeight:  12,
  },
  // ── Observation / Pattern ─────────────────────────────────────────────────
  OBSERVATION_LOGGED: {
    type:        SIGNAL_TYPES.OBSERVATION_LOGGED,
    label:       "Observation",
    primarySeat: "vera",
    description: "A specific moment was witnessed and recorded.",
    example:     "VERA noted: job #1142 had no driver signature at close.",
    baseWeight:  18,
  },
  PATTERN_DETECTED: {
    type:        SIGNAL_TYPES.PATTERN_DETECTED,
    label:       "Pattern",
    primarySeat: "vera",
    description: "A recurring signal across multiple events has emerged.",
    example:     "Three jobs this month with missing payment confirmations.",
    baseWeight:  34,
  },
  // ── Strategic ────────────────────────────────────────────────────────────
  OBJECTIVE_UPDATED: {
    type:        SIGNAL_TYPES.OBJECTIVE_UPDATED,
    label:       "Objective Updated",
    primarySeat: "pacer",
    description: "A strategic objective was created or modified.",
    example:     "Objective updated: 'Reach 8 moves/week by August.'",
    baseWeight:  22,
  },
  OPPORTUNITY_FLAGGED: {
    type:        SIGNAL_TYPES.OPPORTUNITY_FLAGGED,
    label:       "Opportunity",
    primarySeat: "pacer",
    description: "A signal suggests an unexploited opportunity worth strategic attention.",
    example:     "Three clients asked about storage-only service. No offering exists yet.",
    baseWeight:  32,
  },
  // ── MUSE ─────────────────────────────────────────────────────────────────
  POSSIBILITY_SURFACED: {
    type:        SIGNAL_TYPES.POSSIBILITY_SURFACED,
    label:       "Possibility",
    primarySeat: "muse",
    description: "Signals from multiple domains are converging around an unexplored hypothesis.",
    example:     "Storage customers + long-haul patterns + high-margin jobs → Premium Relocation Concierge hypothesis.",
    baseWeight:  35,
  },
  CREATIVE_DORMANCY: {
    type:        SIGNAL_TYPES.CREATIVE_DORMANCY,
    label:       "Creative Dormancy",
    primarySeat: "muse",
    description: "Creative or generative activity has been absent past its natural rhythm.",
    example:     "No new concepts, opportunities, or possibility threads created in 10+ days.",
    baseWeight:  28,
  },
  // ── Escalation ───────────────────────────────────────────────────────────
  ESCALATION_TRIGGERED: {
    type:        SIGNAL_TYPES.ESCALATION_TRIGGERED,
    label:       "Escalation",
    primarySeat: "pacer",
    description: "A signal has crossed a threshold requiring immediate human attention.",
    example:     "Payment delay on 4 consecutive jobs — possible systemic billing issue.",
    baseWeight:  55,
  },
}

// ── Signal Nature Doctrine ────────────────────────────────────────────────────
// Constitutional Article IV: Signals may represent Presence, Absence, Pattern, or Dormancy.
// These are meaning types, not event types. They survive framework changes, database
// changes, model changes, and UI rewrites. Twenty years from now these four will remain.

export const SIGNAL_NATURE = {
  PRESENCE: "presence",  // something happened
  ABSENCE:  "absence",   // something expected did not happen
  PATTERN:  "pattern",   // something keeps happening
  DORMANCY: "dormancy",  // something stopped happening
}

export const SIGNAL_NATURE_LABELS = {
  presence: "Something happened.",
  absence:  "Something didn't happen.",
  pattern:  "Something keeps happening.",
  dormancy: "Something stopped happening.",
}

export const SIGNAL_NATURE_MAP = {
  // Presence — events that record something occurring
  [SIGNAL_TYPES.SESSION_OPENED]:           SIGNAL_NATURE.PRESENCE,
  [SIGNAL_TYPES.SESSION_CLOSED]:           SIGNAL_NATURE.PRESENCE,
  [SIGNAL_TYPES.DECLARATION_CREATED]:      SIGNAL_NATURE.PRESENCE,
  [SIGNAL_TYPES.DECLARATION_RELEASED]:     SIGNAL_NATURE.PRESENCE,
  [SIGNAL_TYPES.TASK_CREATED]:             SIGNAL_NATURE.PRESENCE,
  [SIGNAL_TYPES.TASK_COMPLETED]:           SIGNAL_NATURE.PRESENCE,
  [SIGNAL_TYPES.MEMORY_RECORDED]:          SIGNAL_NATURE.PRESENCE,
  [SIGNAL_TYPES.REVIEW_CREATED]:           SIGNAL_NATURE.PRESENCE,
  [SIGNAL_TYPES.REVIEW_RESOLVED]:          SIGNAL_NATURE.PRESENCE,
  [SIGNAL_TYPES.TENSION_RESOLVED]:         SIGNAL_NATURE.PRESENCE,
  [SIGNAL_TYPES.RULING_ISSUED]:            SIGNAL_NATURE.PRESENCE,
  [SIGNAL_TYPES.RULING_UPHELD]:            SIGNAL_NATURE.PRESENCE,
  [SIGNAL_TYPES.RULING_OVERTURNED]:        SIGNAL_NATURE.PRESENCE,
  [SIGNAL_TYPES.OBJECTIVE_UPDATED]:        SIGNAL_NATURE.PRESENCE,
  [SIGNAL_TYPES.OPPORTUNITY_FLAGGED]:      SIGNAL_NATURE.PRESENCE,
  [SIGNAL_TYPES.OBSERVATION_LOGGED]:       SIGNAL_NATURE.PRESENCE,
  [SIGNAL_TYPES.ESCALATION_TRIGGERED]:     SIGNAL_NATURE.PRESENCE,
  [SIGNAL_TYPES.FF_JOB_COMPLETED]:         SIGNAL_NATURE.PRESENCE,
  [SIGNAL_TYPES.FF_ESTIMATE_APPROVED]:     SIGNAL_NATURE.PRESENCE,
  [SIGNAL_TYPES.FF_CLIENT_SIGNED]:         SIGNAL_NATURE.PRESENCE,
  [SIGNAL_TYPES.FF_PAYMENT_CONFIRMED]:     SIGNAL_NATURE.PRESENCE,
  [SIGNAL_TYPES.FF_DELIVERY_CONFIRMED]:    SIGNAL_NATURE.PRESENCE,
  [SIGNAL_TYPES.FF_DRIVER_SIGNED]:         SIGNAL_NATURE.PRESENCE,
  [SIGNAL_TYPES.FF_LOADING_COMPLETE]:      SIGNAL_NATURE.PRESENCE,
  // Absence — something expected did not arrive or progress
  [SIGNAL_TYPES.TASK_STALE]:               SIGNAL_NATURE.ABSENCE,
  [SIGNAL_TYPES.OPERATIONAL_RISK]:         SIGNAL_NATURE.ABSENCE,
  [SIGNAL_TYPES.SCHEDULE_PRESSURE]:        SIGNAL_NATURE.ABSENCE,
  [SIGNAL_TYPES.MEMORY_PRESSURE]:          SIGNAL_NATURE.ABSENCE,
  [SIGNAL_TYPES.RULING_CHALLENGED]:        SIGNAL_NATURE.ABSENCE,
  [SIGNAL_TYPES.FF_MISSING_SIGNATURE]:     SIGNAL_NATURE.ABSENCE,
  [SIGNAL_TYPES.FF_PAYMENT_DELAY]:         SIGNAL_NATURE.ABSENCE,
  [SIGNAL_TYPES.FF_ESTIMATE_VARIANCE]:     SIGNAL_NATURE.ABSENCE,
  // Pattern — recurring signal across time or events
  [SIGNAL_TYPES.PATTERN_DETECTED]:         SIGNAL_NATURE.PATTERN,
  [SIGNAL_TYPES.POSSIBILITY_SURFACED]:     SIGNAL_NATURE.PATTERN,
  [SIGNAL_TYPES.MEANING_CONFLICT]:         SIGNAL_NATURE.PATTERN,
  [SIGNAL_TYPES.INTERPRETATION_REQUESTED]: SIGNAL_NATURE.PATTERN,
  // Dormancy — a category of activity has gone quiet past its natural rhythm
  [SIGNAL_TYPES.CREATIVE_DORMANCY]:        SIGNAL_NATURE.DORMANCY,
}

export function getNatureForSignal(type) {
  return SIGNAL_NATURE_MAP[type] || SIGNAL_NATURE.PRESENCE
}

export function getTaxonomy(key) {
  return SIGNAL_TAXONOMY[key] || null
}

export function getTaxonomyByType(type) {
  return Object.values(SIGNAL_TAXONOMY).find(t => t.type === type) || null
}

// ── Storage ───────────────────────────────────────────────────────────────────

import { fsWrite, fsHydrate } from "./store.js"

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") }
  catch { return [] }
}

function save(signals) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(signals)) }
  catch {}
}

export function recordSignal({ type, source = "ops", title = "", summary = "" }) {
  const signals = load()
  const signal  = {
    id:        crypto.randomUUID(),
    type,
    source,
    title,
    summary,
    createdAt: Date.now(),
  }
  save([signal, ...signals].slice(0, MAX_SIGNALS))
  fsWrite("signals", signal.id, signal)
  return signal
}

export function hydrateSignals() {
  return fsHydrate("signals", STORAGE_KEY, { orderField: "createdAt", maxItems: MAX_SIGNALS })
}

export function getRecentSignals(limit = 20) {
  return load().slice(0, limit)
}

export function getSignalsBySource(source, limit = 10) {
  return load().filter(s => s.source === source).slice(0, limit)
}

export function getSignalsByType(type, limit = 10) {
  return load().filter(s => s.type === type).slice(0, limit)
}

export function getSignalsByTypes(types, limit = 10) {
  return load().filter(s => types.includes(s.type)).slice(0, limit)
}

// Returns all signals that occurred after the most recent SESSION_CLOSED.
export function getDeltaSinceLastVisit() {
  const all       = load()
  const lastClose = all.find(s => s.type === SIGNAL_TYPES.SESSION_CLOSED)
  if (!lastClose) return []
  return all.filter(s =>
    s.createdAt > lastClose.createdAt &&
    s.type !== SIGNAL_TYPES.SESSION_OPENED &&
    s.type !== SIGNAL_TYPES.SESSION_CLOSED
  )
}

// Returns signals from the most recently completed session.
export function getDeltaFromPreviousSession() {
  const all    = load()
  const closes = all.filter(s => s.type === SIGNAL_TYPES.SESSION_CLOSED)
  if (closes.length === 0) return { delta: [], lastSessionAt: null }

  const lastClose = closes[0]
  const prevClose = closes[1] || null

  const delta = all.filter(s => {
    const afterPrev  = prevClose ? s.createdAt > prevClose.createdAt : true
    const beforeLast = s.createdAt < lastClose.createdAt
    const notBookend = s.type !== SIGNAL_TYPES.SESSION_OPENED && s.type !== SIGNAL_TYPES.SESSION_CLOSED
    return afterPrev && beforeLast && notBookend
  })

  return { delta, lastSessionAt: lastClose.createdAt }
}
