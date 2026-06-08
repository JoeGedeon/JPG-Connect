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
}

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
  return signal
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
// Excludes SESSION bookends — only substantive activity within the current visit.
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

// Returns signals from the most recently completed session — between the last
// two SESSION_CLOSED events. This is the correct slice for "since your last
// visit": the previous session's substantive record, not the current session.
// Returns { delta, lastSessionAt } where lastSessionAt is the close timestamp.
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
