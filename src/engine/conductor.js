// src/engine/conductor.js
// PACER attention conductor — given everything happening, what deserves focus?
// Returns one priority object the institution acts on.
// Now reads the active Journey: the question shifts from
//   "what is loudest?" to "given what is underway, what door matters next?"

import { loadStorage }                                    from "../utils/storage.js"
import { getRecentSignals, SIGNAL_TYPES, SIGNAL_TAXONOMY } from "./signals.js"
import { getOverdueEvents, getUpcomingEvents }             from "./calendar.js"
import { getActiveJourney, COGNITIVE_FLOW }               from "./journeys.js"

const DOMAIN_MAP = {
  [SIGNAL_TYPES.TASK_CREATED]:             "operational",
  [SIGNAL_TYPES.TASK_STALE]:               "operational",
  [SIGNAL_TYPES.TASK_COMPLETED]:           "operational",
  [SIGNAL_TYPES.OPERATIONAL_RISK]:         "operational",
  [SIGNAL_TYPES.SCHEDULE_PRESSURE]:        "operational",
  [SIGNAL_TYPES.FF_JOB_COMPLETED]:         "operational",
  [SIGNAL_TYPES.FF_ESTIMATE_APPROVED]:     "operational",
  [SIGNAL_TYPES.FF_ESTIMATE_VARIANCE]:     "operational",
  [SIGNAL_TYPES.FF_MISSING_SIGNATURE]:     "operational",
  [SIGNAL_TYPES.FF_PAYMENT_DELAY]:         "operational",
  [SIGNAL_TYPES.DECLARATION_CREATED]:      "declarative",
  [SIGNAL_TYPES.DECLARATION_RELEASED]:     "declarative",
  [SIGNAL_TYPES.MEMORY_RECORDED]:          "declarative",
  [SIGNAL_TYPES.MEMORY_PRESSURE]:          "declarative",
  [SIGNAL_TYPES.INTERPRETATION_REQUESTED]: "interpretive",
  [SIGNAL_TYPES.MEANING_CONFLICT]:         "interpretive",
  [SIGNAL_TYPES.TENSION_RESOLVED]:         "interpretive",
  [SIGNAL_TYPES.RULING_ISSUED]:            "interpretive",
  [SIGNAL_TYPES.RULING_CHALLENGED]:        "interpretive",
  [SIGNAL_TYPES.OBSERVATION_LOGGED]:       "observational",
  [SIGNAL_TYPES.REVIEW_CREATED]:           "observational",
  [SIGNAL_TYPES.REVIEW_RESOLVED]:          "observational",
  [SIGNAL_TYPES.FF_PAYMENT_CONFIRMED]:     "financial",
  [SIGNAL_TYPES.FF_CLIENT_SIGNED]:         "financial",
  [SIGNAL_TYPES.FF_DRIVER_SIGNED]:         "financial",
  [SIGNAL_TYPES.FF_LOADING_COMPLETE]:      "financial",
  [SIGNAL_TYPES.OBJECTIVE_UPDATED]:        "strategic",
  [SIGNAL_TYPES.OPPORTUNITY_FLAGGED]:      "strategic",
  [SIGNAL_TYPES.PATTERN_DETECTED]:         "pattern",
}

function candidate(taxonomyKey, overrides) {
  const spec = SIGNAL_TAXONOMY[taxonomyKey]
  const { scoreDelta = 0, ...rest } = overrides
  return {
    seat:        spec.primarySeat,
    signalType:  spec.label,
    score:       spec.baseWeight + scoreDelta,
    confidence:  null,
    signals:     [],
    action:      null,
    urgency:     "medium",
    urgencyLabel:"Today",
    impact:      "Medium",
    ignore_cost: null,
    ...rest,
  }
}

export function conductorPrioritize() {
  const stored  = loadStorage() || {}
  const tasks   = stored.tasks  || []
  const allSigs = getRecentSignals(100)
  const overdue = getOverdueEvents()
  const soon    = getUpcomingEvents(2)

  const candidates = []
  const now        = Date.now()
  const DAY        = 86400000

  // ── OPERATIONAL RISK: multiple stale tasks ────────────────────────────────────────
  const staleTasks = tasks.filter(t =>
    (t.status === "draft" || t.status === "pending") &&
    now - (t.updatedAt || t.createdAt) > 7 * DAY
  )
  if (staleTasks.length >= 2) {
    candidates.push(candidate("OPERATIONAL_RISK", {
      scoreDelta:  staleTasks.length * 5,
      impact:      staleTasks.length >= 4 ? "High" : "Medium",
      urgency:     "high",
      urgencyLabel:"Today",
      summary:     `${staleTasks.length} tasks stalled without recent activity.`,
      signals:     staleTasks.slice(0, 3).map(t => `"${t.title}" — stalled ${Math.floor((now - (t.updatedAt || t.createdAt)) / DAY)}d`),
      action:      "Review the task queue. Close, reassign, or reset each stalled item.",
      ignore_cost: "Stalled tasks compound. Each day of silence is a day closer to a missed commitment.",
      confidence:  Math.min(99, 70 + staleTasks.length * 5),
    }))
  }

  // ── TASK STALE: single stale task ─────────────────────────────────────────────────
  const longestStale = tasks
    .filter(t => (t.status === "draft" || t.status === "pending") && now - (t.updatedAt || t.createdAt) > 5 * DAY)
    .sort((a, b) => (a.updatedAt || a.createdAt) - (b.updatedAt || b.createdAt))[0]

  if (longestStale && staleTasks.length < 2) {
    const days = Math.floor((now - (longestStale.updatedAt || longestStale.createdAt)) / DAY)
    candidates.push(candidate("TASK_STALE", {
      scoreDelta:  Math.min(20, days * 2),
      impact:      days >= 10 ? "High" : "Medium",
      urgency:     days >= 10 ? "high" : "medium",
      urgencyLabel:days >= 10 ? "Today" : "This week",
      summary:     `"${longestStale.title}" has been open for ${days} days without progress.`,
      signals:     [`Task created ${days}d ago`, `Status: ${longestStale.status}`],
      action:      `Move "${longestStale.title}" forward — approve, execute, or close it.`,
      ignore_cost: "Tasks in limbo drain attention without producing output.",
      confidence:  Math.min(99, 55 + days * 3),
    }))
  }

  // ── SCHEDULE PRESSURE ───────────────────────────────────────────────────────────────
  if (overdue.length > 0 || soon.length > 0) {
    const urgentCount = overdue.length + soon.length
    candidates.push(candidate("SCHEDULE_PRESSURE", {
      scoreDelta:  overdue.length * 8 + soon.length * 3,
      impact:      overdue.length > 0 ? "High" : "Medium",
      urgency:     overdue.length > 0 ? "critical" : "high",
      urgencyLabel:overdue.length > 0 ? "Now" : "Today",
      summary:     overdue.length > 0
        ? `${overdue.length} overdue event${overdue.length > 1 ? "s" : ""} require attention.`
        : `${soon.length} commitment${soon.length > 1 ? "s" : ""} due within 48 hours.`,
      signals: [
        ...overdue.slice(0, 2).map(e => `Overdue: "${e.title}"`),
        ...soon.slice(0, 2).map(e => `Due soon: "${e.title}"`),
      ],
      action:      "Confirm readiness for upcoming commitments. Close or defer overdue items.",
      ignore_cost: "Unacknowledged commitments become surprises. Surprises damage trust.",
      confidence:  Math.min(99, 60 + urgentCount * 8),
    }))
  }

  // ── MEMORY PRESSURE ──────────────────────────────────────────────────────────────────
  const interpretiveSigs = allSigs.filter(s =>
    s.type === SIGNAL_TYPES.INTERPRETATION_REQUESTED ||
    s.type === SIGNAL_TYPES.RULING_CHALLENGED
  )
  if (interpretiveSigs.length >= 2) {
    candidates.push(candidate("MEMORY_PRESSURE", {
      scoreDelta:  interpretiveSigs.length * 4,
      impact:      "Medium",
      urgency:     "medium",
      urgencyLabel:"This week",
      summary:     `${interpretiveSigs.length} unresolved tensions in the interpretive layer.`,
      signals:     interpretiveSigs.slice(0, 3).map(s => s.title || s.type.replace(/_/g, " ")),
      action:      "Open the Archivist. Review flagged tensions and close or escalate each one.",
      ignore_cost: "Unresolved tensions accumulate institutional debt. Eventually they surface as conflict.",
      confidence:  Math.min(99, 50 + interpretiveSigs.length * 7),
    }))
  }

  // ── MEANING CONFLICT ─────────────────────────────────────────────────────────────────
  const challengedRulings = allSigs.filter(s => s.type === SIGNAL_TYPES.RULING_CHALLENGED)
  if (challengedRulings.length > 0) {
    candidates.push(candidate("MEANING_CONFLICT", {
      scoreDelta:  challengedRulings.length * 6,
      impact:      "High",
      urgency:     "high",
      urgencyLabel:"Today",
      summary:     `${challengedRulings.length} institutional ruling${challengedRulings.length > 1 ? "s" : ""} under active challenge.`,
      signals:     challengedRulings.slice(0, 3).map(s => s.title || "Ruling challenged"),
      action:      "Review KODEX. Challenged rulings require acknowledgment — upheld or overturned.",
      ignore_cost: "Unresolved challenges leave the institution without clear doctrine.",
      confidence:  Math.min(99, 65 + challengedRulings.length * 8),
    }))
  }

  // ── OBSERVATION LOGGED ─────────────────────────────────────────────────────────────
  const recentAnomalies = allSigs.filter(s =>
    s.type === SIGNAL_TYPES.REVIEW_CREATED ||
    s.type === SIGNAL_TYPES.FF_MISSING_SIGNATURE ||
    s.type === SIGNAL_TYPES.FF_ESTIMATE_VARIANCE ||
    s.type === SIGNAL_TYPES.FF_PAYMENT_DELAY
  )
  if (recentAnomalies.length >= 2) {
    candidates.push(candidate("OBSERVATION_LOGGED", {
      scoreDelta:  recentAnomalies.length * 3,
      impact:      "Medium",
      urgency:     "medium",
      urgencyLabel:"This week",
      summary:     `${recentAnomalies.length} operational anomalies logged without follow-up.`,
      signals:     recentAnomalies.slice(0, 3).map(s => s.title || s.type.replace(/^ff:/, "FleetFlow: ").replace(/_/g, " ")),
      action:      "Review flagged observations. Determine if a pattern requires a ruling or declaration.",
      ignore_cost: "Recurring anomalies that go unaddressed become standard operating procedure.",
      confidence:  Math.min(99, 55 + recentAnomalies.length * 5),
    }))
  }

  // ── POSSIBILITY_SURFACED ─────────────────────────────────────────────────────────────
  const convergenceSigs = allSigs.filter(s => DOMAIN_MAP[s.type])
  const activeDomains   = new Set(convergenceSigs.map(s => DOMAIN_MAP[s.type]))
  if (convergenceSigs.length >= 6 && activeDomains.size >= 3) {
    const domainList = [...activeDomains].slice(0, 4).join(", ")
    candidates.push(candidate("POSSIBILITY_SURFACED", {
      scoreDelta:  activeDomains.size * 4 - 4,
      impact:      "Low",
      urgency:     "low",
      urgencyLabel:"When ready",
      summary:     `Signals from ${activeDomains.size} domains are converging — something may be emerging.`,
      signals:     [
        `${convergenceSigs.length} signals across: ${domainList}`,
        "Cross-domain convergence detected",
        "Hypothesis: unexplored possibility at the intersection",
      ],
      action:      "Ask MUSE: what do these signals have in common that we haven't named yet?",
      ignore_cost: "Possibilities don't wait. The window for early-mover advantage closes quietly.",
      confidence:  Math.min(55, 25 + activeDomains.size * 5),
    }))
  }

  // ── CREATIVE_DORMANCY ─────────────────────────────────────────────────────────────────
  const lastGenerative = allSigs.find(s =>
    s.type === SIGNAL_TYPES.OPPORTUNITY_FLAGGED ||
    s.type === SIGNAL_TYPES.POSSIBILITY_SURFACED ||
    s.type === SIGNAL_TYPES.OBJECTIVE_UPDATED
  )
  if ((!lastGenerative || Date.now() - lastGenerative.createdAt > 10 * DAY) && allSigs.length >= 5) {
    candidates.push(candidate("CREATIVE_DORMANCY", {
      scoreDelta:  0,
      impact:      "Low",
      urgency:     "low",
      urgencyLabel:"When ready",
      summary:     "No new observations, opportunities, or hypotheses in the last 10 days.",
      signals:     [
        "Creative layer has been quiet",
        "Operational signals present but generative activity absent",
      ],
      action:      "Spend 10 minutes with MUSE. What have you noticed lately that you haven't named?",
      ignore_cost: "Institutions that only execute and never synthesize eventually run out of new territory.",
      confidence:  45,
    }))
  }

  // ── Select winner ─────────────────────────────────────────────────────────────────────
  const winner = candidates.length > 0
    ? candidates.sort((a, b) => b.score - a.score)[0]
    : {
        seat:        "reality",
        signalType:  "All Clear",
        score:       0,
        confidence:  null,
        urgency:     "low",
        urgencyLabel:"When ready",
        impact:      "Low",
        summary:     "No active signals. The institution is quiet.",
        signals:     ["No stale tasks", "No schedule pressure", "No unresolved tensions"],
        action:      "A quiet moment is a good time to reflect, plan, or invest in the MUSE layer.",
        ignore_cost: null,
      }

  // ── Journey layer: given what is underway, what door matters next? ─────────────
  const activeJourney       = getActiveJourney()
  let   journeyRecommendation = null

  if (activeJourney) {
    const rec = COGNITIVE_FLOW[activeJourney.currentRoom]
    if (rec) {
      journeyRecommendation = {
        nextRoom:  rec.nextRoom,
        reason:    rec.reason,
        journeyId: activeJourney.id,
      }
    }
  }

  return { ...winner, journeyRecommendation }
}
