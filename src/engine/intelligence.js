// src/engine/intelligence.js
// Computes owner-facing observations from FleetFlow signal history.
// No AI. No new collections. Pattern recognition on records that already exist.
// Constitutional Article V: Discovery Precedes Generation.

import { SIGNAL_TYPES } from "./signals.js"

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

const FF_SIGNAL_TYPES = new Set([
  SIGNAL_TYPES.FF_JOB_COMPLETED,
  SIGNAL_TYPES.FF_ESTIMATE_APPROVED,
  SIGNAL_TYPES.FF_CLIENT_SIGNED,
  SIGNAL_TYPES.FF_PAYMENT_CONFIRMED,
  SIGNAL_TYPES.FF_DELIVERY_CONFIRMED,
  SIGNAL_TYPES.FF_DRIVER_SIGNED,
  SIGNAL_TYPES.FF_LOADING_COMPLETE,
  SIGNAL_TYPES.FF_ESTIMATE_VARIANCE,
  SIGNAL_TYPES.FF_MISSING_SIGNATURE,
  SIGNAL_TYPES.FF_PAYMENT_DELAY,
])

function parseAmount(summary) {
  const m = summary?.match(/\$([0-9,]+(?:\.[0-9]+)?)/)
  return m ? parseFloat(m[1].replace(/,/g, "")) : 0
}

function groupByJob(signals) {
  const jobs = {}
  signals.forEach(sig => {
    const id = sig.title || "unknown"
    if (!jobs[id]) jobs[id] = { id, types: new Set(), signals: [], latestAt: 0 }
    jobs[id].types.add(sig.type)
    jobs[id].signals.push(sig)
    if ((sig.createdAt || 0) > jobs[id].latestAt) jobs[id].latestAt = sig.createdAt
  })
  return jobs
}

// ── computeIntelligence ───────────────────────────────────────────────────────
// Takes the full signal array from getRecentSignals() and returns a sorted list
// of owner-facing observations. Severity: "critical" | "warning" | "insight"

export function computeIntelligence(allSignals) {
  const ff      = allSignals.filter(s => FF_SIGNAL_TYPES.has(s.type))
  const now     = Date.now()
  const recent  = ff.filter(s => now - (s.createdAt || 0) < THIRTY_DAYS)
  const jobs    = groupByJob(ff)
  const rJobs   = groupByJob(recent)
  const obs     = []

  // ── 1. Outstanding collections ─────────────────────────────────────────────
  const delays = ff.filter(s => s.type === SIGNAL_TYPES.FF_PAYMENT_DELAY)
  if (delays.length > 0) {
    const total = delays.reduce((sum, s) => sum + parseAmount(s.summary), 0)
    obs.push({
      id:       "payment_delay",
      severity: "critical",
      icon:     "⚠",
      label:    "Outstanding Collections",
      detail:   `$${total.toLocaleString()} across ${delays.length} job${delays.length !== 1 ? "s" : ""}`,
      amount:   total,
      count:    delays.length,
      weight:   90,
    })
  }

  // ── 2. Unsigned closes ──────────────────────────────────────────────────────
  const unsigned = ff.filter(s => s.type === SIGNAL_TYPES.FF_MISSING_SIGNATURE)
  if (unsigned.length > 0) {
    obs.push({
      id:       "missing_signature",
      severity: "critical",
      icon:     "⚠",
      label:    "Unsigned Closes",
      detail:   `${unsigned.length} job${unsigned.length !== 1 ? "s" : ""} closed without required signature`,
      count:    unsigned.length,
      weight:   80,
    })
  }

  // ── 3. Completed jobs without confirmed payment ─────────────────────────────
  const completed  = Object.values(jobs).filter(j => j.types.has(SIGNAL_TYPES.FF_JOB_COMPLETED))
  const unpaid     = completed.filter(j => !j.types.has(SIGNAL_TYPES.FF_PAYMENT_CONFIRMED))
  if (unpaid.length > 0) {
    const atRisk = unpaid.reduce((sum, j) => {
      const sig = j.signals.find(s => s.type === SIGNAL_TYPES.FF_JOB_COMPLETED)
      return sum + parseAmount(sig?.summary)
    }, 0)
    if (atRisk > 0) {
      obs.push({
        id:       "revenue_at_risk",
        severity: "critical",
        icon:     "⚠",
        label:    "Revenue At Risk",
        detail:   `$${atRisk.toLocaleString()} on ${unpaid.length} completed job${unpaid.length !== 1 ? "s" : ""} with no confirmed payment`,
        amount:   atRisk,
        count:    unpaid.length,
        weight:   75,
      })
    }
  }

  // ── 4. Estimate accuracy ────────────────────────────────────────────────────
  const variances = ff.filter(s => s.type === SIGNAL_TYPES.FF_ESTIMATE_VARIANCE)
  if (variances.length > 0) {
    obs.push({
      id:       "estimate_variance",
      severity: "warning",
      icon:     "△",
      label:    "Estimate Accuracy",
      detail:   `${variances.length} job${variances.length !== 1 ? "s" : ""} exceeded CF estimate — review pricing model`,
      count:    variances.length,
      weight:   55,
    })
  }

  // ── 5. Collection gap (30-day window) ──────────────────────────────────────
  const rCompleted = Object.values(rJobs).filter(j => j.types.has(SIGNAL_TYPES.FF_JOB_COMPLETED))
  const rPaid      = Object.values(rJobs).filter(j => j.types.has(SIGNAL_TYPES.FF_PAYMENT_CONFIRMED))
  const gap        = rCompleted.length - rPaid.length
  if (gap > 0 && !obs.find(o => o.id === "revenue_at_risk")) {
    obs.push({
      id:       "collection_gap",
      severity: "warning",
      icon:     "△",
      label:    "Collection Gap",
      detail:   `${rCompleted.length} jobs completed, ${rPaid.length} payments confirmed this month`,
      count:    gap,
      weight:   50,
    })
  }

  // ── 6. Revenue pattern (30-day) ─────────────────────────────────────────────
  if (rCompleted.length > 0) {
    const revenue = rCompleted.reduce((sum, j) => {
      const sig = j.signals.find(s => s.type === SIGNAL_TYPES.FF_JOB_COMPLETED)
      return sum + parseAmount(sig?.summary)
    }, 0)
    if (revenue > 0) {
      const avg = Math.round(revenue / rCompleted.length)
      obs.push({
        id:       "revenue_pattern",
        severity: "insight",
        icon:     "◈",
        label:    "Revenue Pattern",
        detail:   `$${revenue.toLocaleString()} across ${rCompleted.length} job${rCompleted.length !== 1 ? "s" : ""} this month · avg $${avg.toLocaleString()} per move`,
        amount:   revenue,
        count:    rCompleted.length,
        weight:   35,
      })
    }
  }

  // ── 7. Pipeline health ──────────────────────────────────────────────────────
  const inProgress = Object.values(jobs).filter(j =>
    (j.types.has(SIGNAL_TYPES.FF_ESTIMATE_APPROVED) || j.types.has(SIGNAL_TYPES.FF_CLIENT_SIGNED))
    && !j.types.has(SIGNAL_TYPES.FF_JOB_COMPLETED)
  )
  if (inProgress.length > 0) {
    const pipeValue = inProgress.reduce((sum, j) => {
      const sig = j.signals.find(s =>
        s.type === SIGNAL_TYPES.FF_ESTIMATE_APPROVED ||
        s.type === SIGNAL_TYPES.FF_CLIENT_SIGNED
      )
      return sum + parseAmount(sig?.summary)
    }, 0)
    obs.push({
      id:       "pipeline",
      severity: "insight",
      icon:     "◈",
      label:    "Active Pipeline",
      detail:   `${inProgress.length} job${inProgress.length !== 1 ? "s" : ""} in progress${pipeValue > 0 ? ` · $${pipeValue.toLocaleString()} booked` : ""}`,
      count:    inProgress.length,
      amount:   pipeValue,
      weight:   25,
    })
  }

  return obs.sort((a, b) => b.weight - a.weight)
}
