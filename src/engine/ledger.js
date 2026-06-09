// src/engine/ledger.js
// PACER Ledger — was the signal justified? The seventh seat. Human close-loop.

import { fsWrite, fsHydrate } from "./store.js"

const PENDING_KEY = "pacer_ledger_pending_v1"
const ENTRIES_KEY = "pacer_ledger_entries_v1"

export const RESOLUTION = {
  CONFIRMED:      "confirmed",
  FALSE_POSITIVE: "false_positive",
  INCOMPLETE:     "incomplete",
  SUPERSEDED:     "superseded",
}

export const RESOLUTION_LABELS = {
  confirmed:      "Confirmed",
  false_positive: "False Positive",
  incomplete:     "Incomplete",
  superseded:     "Superseded",
}

// Institutional descriptions — shown in button tooltips.
export const RESOLUTION_DESCRIPTIONS = {
  confirmed:      "The signal was accurate. The situation existed as described.",
  false_positive: "The signal fired but the situation was not real. The system was wrong.",
  incomplete:     "The signal was partially right but lacked key context.",
  superseded:     "Correct at the time but overtaken by events before action was taken. The system was early, not wrong.",
}

function loadPending() {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || "[]") }
  catch { return [] }
}

function savePending(items) {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(items)) }
  catch {}
}

function loadEntries() {
  try { return JSON.parse(localStorage.getItem(ENTRIES_KEY) || "[]") }
  catch { return [] }
}

function saveEntries(items) {
  try { localStorage.setItem(ENTRIES_KEY, JSON.stringify(items)) }
  catch {}
}

// Deduplicates within 48h by seat + signalType + summary.
// Prevents the same active condition from flooding the pending queue on every mount.
export function recordFiredSignal(signal) {
  const pending  = loadPending()
  const HOURS_48 = 48 * 3600 * 1000
  const cutoff   = Date.now() - HOURS_48

  const isDuplicate = pending.some(p =>
    p.seat       === signal.seat &&
    p.signalType === signal.signalType &&
    p.summary    === signal.summary &&
    p.firedAt    >  cutoff
  )
  if (isDuplicate) return null

  const entry = {
    id:         `sig_${crypto.randomUUID().slice(0, 8)}`,
    firedAt:    Date.now(),
    seat:       signal.seat,
    signalType: signal.signalType,
    summary:    signal.summary,
    signals:    signal.signals   || [],
    action:     signal.action    || null,
    score:      signal.score     || 0,
    confidence: signal.confidence ?? null,
    urgency:    signal.urgency   || "medium",
  }

  savePending([entry, ...pending].slice(0, 200))
  fsWrite("ledger_pending", entry.id, entry)
  return entry
}

export function recordResolution({ signalId, resolution, notes = "", resolvedBy = "human" }) {
  const entry = { signalId, resolvedAt: Date.now(), resolution, notes, resolvedBy }
  const entries = loadEntries()
  saveEntries([entry, ...entries].slice(0, 500))
  fsWrite("ledger_entries", signalId, entry)
  return entry
}

export function hydrateLedger() {
  return Promise.all([
    fsHydrate("ledger_pending", PENDING_KEY, { orderField: "firedAt" }),
    fsHydrate("ledger_entries", ENTRIES_KEY, { orderField: "resolvedAt" }),
  ])
}

export function getPendingSignals() {
  return loadPending()
}

export function getLedgerEntries() {
  return loadEntries()
}

export function getUnresolvedSignals() {
  const pending  = loadPending()
  const resolved = new Set(loadEntries().map(e => e.signalId))
  return pending.filter(p => !resolved.has(p.id))
}
