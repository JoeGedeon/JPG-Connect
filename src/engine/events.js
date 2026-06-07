// src/engine/events.js
// PACER Event Ledger — append-only record of everything that happens.
// Events are immutable once written. Corrections become new events, never overwrites.
// ARCHIVIST subscribes to "*". All other rooms subscribe selectively.

const STORAGE_KEY = "pacer_events"

export const EVENT_TYPES = {
  // Operations
  EQUIPMENT_PURCHASE: "equipment_purchase",
  JOB_COMPLETED:      "job_completed",
  JOB_CREATED:        "job_created",
  INVOICE_PAID:       "invoice_paid",
  INVOICE_RECOVERED:  "invoice_recovered",
  EXPENSE_RECORDED:   "expense_recorded",
  CLIENT_SIGNED:      "client_signed",
  REVENUE_RECOVERED:  "revenue_recovered",

  // Intellectual / creative
  CHAPTER_PUBLISHED:  "chapter_published",
  SONG_RELEASED:      "song_released",
  FEATURE_LAUNCHED:   "feature_launched",
  IDEA_DECLARED:      "idea_declared",

  // Governance
  DECLARATION_CREATED: "declaration_created",
  MILESTONE_REACHED:   "milestone_reached",
  GOAL_CREATED:        "goal_created",
  GOAL_ACHIEVED:       "goal_achieved",

  // Life
  MEETING_COMPLETED:   "meeting_completed",
  CORRECTION:          "correction",   // corrections to prior events — links back to original

  // Catch-all for manual entry
  MANUAL:              "manual",

  // Cross-modal evidence — Universal Event Schema (JPG-025)
  PHOTO_CAPTURED:      "photo_captured",
  VOICE_NOTE:          "voice_note",
  DOCUMENT_FILED:      "document_filed",
  SIGNATURE_CAPTURED:  "signature_captured",

  // Outcome events — the prediction test (JPG-033)
  // Attach to jobs via job_id entity. Correlated against per-job MIS at completion.
  // These are the data points that prove or disprove the hypothesis.
  CLAIM_FILED:           "claim_filed",
  CLAIM_RESOLVED:        "claim_resolved",
  CHARGEBACK:            "chargeback",
  INVOICE_WRITTEN_OFF:   "invoice_written_off",
  CUSTOMER_DISPUTE:      "customer_dispute",
  CUSTOMER_COMPLAINT:    "customer_complaint",
  LEGAL_REQUEST:         "legal_request",
}

// Human-readable labels for the event type selector
export const EVENT_TYPE_LABELS = {
  [EVENT_TYPES.EQUIPMENT_PURCHASE]: "Equipment Purchase",
  [EVENT_TYPES.JOB_COMPLETED]:      "Job Completed",
  [EVENT_TYPES.JOB_CREATED]:        "Job Created",
  [EVENT_TYPES.INVOICE_PAID]:       "Invoice Paid",
  [EVENT_TYPES.INVOICE_RECOVERED]:  "Invoice Recovered",
  [EVENT_TYPES.EXPENSE_RECORDED]:   "Expense Recorded",
  [EVENT_TYPES.CLIENT_SIGNED]:      "Client Signed",
  [EVENT_TYPES.REVENUE_RECOVERED]:  "Revenue Recovered",
  [EVENT_TYPES.CHAPTER_PUBLISHED]:  "Chapter Published",
  [EVENT_TYPES.SONG_RELEASED]:      "Song Released",
  [EVENT_TYPES.FEATURE_LAUNCHED]:   "Feature Launched",
  [EVENT_TYPES.IDEA_DECLARED]:      "Idea Declared",
  [EVENT_TYPES.DECLARATION_CREATED]:"Declaration Created",
  [EVENT_TYPES.MILESTONE_REACHED]:  "Milestone Reached",
  [EVENT_TYPES.GOAL_CREATED]:       "Goal Created",
  [EVENT_TYPES.GOAL_ACHIEVED]:      "Goal Achieved",
  [EVENT_TYPES.MEETING_COMPLETED]:      "Meeting Completed",
  [EVENT_TYPES.CORRECTION]:             "Correction",
  [EVENT_TYPES.MANUAL]:                 "Manual Entry",
  [EVENT_TYPES.PHOTO_CAPTURED]:         "Photo Captured",
  [EVENT_TYPES.VOICE_NOTE]:             "Voice Note",
  [EVENT_TYPES.DOCUMENT_FILED]:         "Document Filed",
  [EVENT_TYPES.SIGNATURE_CAPTURED]:     "Signature Captured",
  [EVENT_TYPES.CLAIM_FILED]:            "Claim Filed",
  [EVENT_TYPES.CLAIM_RESOLVED]:         "Claim Resolved",
  [EVENT_TYPES.CHARGEBACK]:             "Chargeback",
  [EVENT_TYPES.INVOICE_WRITTEN_OFF]:    "Invoice Written Off",
  [EVENT_TYPES.CUSTOMER_DISPUTE]:       "Customer Dispute",
  [EVENT_TYPES.CUSTOMER_COMPLAINT]:     "Customer Complaint",
  [EVENT_TYPES.LEGAL_REQUEST]:          "Legal Request",
}

// Which rooms subscribe to which event types.
// ARCHIVIST subscribes to "*" — total memory, no exceptions.
// Selective rooms declare their interest domain.
export const SUBSCRIPTIONS = {
  archivist: ["*"],
  opscore: [
    EVENT_TYPES.EQUIPMENT_PURCHASE,
    EVENT_TYPES.JOB_COMPLETED,
    EVENT_TYPES.JOB_CREATED,
    EVENT_TYPES.INVOICE_PAID,
    EVENT_TYPES.INVOICE_RECOVERED,
    EVENT_TYPES.EXPENSE_RECORDED,
    EVENT_TYPES.CLIENT_SIGNED,
    EVENT_TYPES.REVENUE_RECOVERED,
    EVENT_TYPES.CLAIM_FILED,
    EVENT_TYPES.CLAIM_RESOLVED,
    EVENT_TYPES.CHARGEBACK,
    EVENT_TYPES.INVOICE_WRITTEN_OFF,
    EVENT_TYPES.CUSTOMER_DISPUTE,
    EVENT_TYPES.CUSTOMER_COMPLAINT,
    EVENT_TYPES.LEGAL_REQUEST,
  ],
  kel: [
    EVENT_TYPES.EQUIPMENT_PURCHASE,
    EVENT_TYPES.JOB_COMPLETED,
    EVENT_TYPES.CLIENT_SIGNED,
    EVENT_TYPES.CHAPTER_PUBLISHED,
    EVENT_TYPES.MILESTONE_REACHED,
    EVENT_TYPES.GOAL_CREATED,
  ],
  kodex: [
    EVENT_TYPES.CHAPTER_PUBLISHED,
    EVENT_TYPES.SONG_RELEASED,
    EVENT_TYPES.MILESTONE_REACHED,
    EVENT_TYPES.DECLARATION_CREATED,
    EVENT_TYPES.GOAL_ACHIEVED,
  ],
}

// Which rooms subscribe to a given event type
export function getSubscribers(eventType) {
  return Object.entries(SUBSCRIPTIONS)
    .filter(([, types]) => types.includes("*") || types.includes(eventType))
    .map(([room]) => room)
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function save(events) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  } catch {
    // storage full — events are secondary to declarations, fail silently
  }
}

let _nextSeq = null
function nextId() {
  if (_nextSeq === null) {
    const existing = load()
    const maxSeq = existing.reduce((max, e) => {
      const n = parseInt((e.id || "").replace("EVT-", ""), 10)
      return isNaN(n) ? max : Math.max(max, n)
    }, 0)
    _nextSeq = maxSeq
  }
  _nextSeq += 1
  return `EVT-${String(_nextSeq).padStart(3, "0")}`
}

// createEvent — the only write path. Append-only. Never updates existing events.
export function createEvent({
  type = EVENT_TYPES.MANUAL,
  occurredAt = Date.now(),
  source = "manual",
  description = "",
  entities = [],
  note = "",
  declarationRefs = [],
  corrects = null,      // EVT id this corrects, if type === CORRECTION
  // Universal Event Schema — JPG-025
  domain = null,        // "ops"|"creative"|"financial"|"dispatch"|"narrative"
  attachments = [],     // [{ type, url, caption?, capturedAt?, lat?, lng?, signedBy?, transcript?, duration? }]
  geoRecord = null,     // { lat, lng, accuracy, capturedAt }
  participants = [],    // [{ role: "crew"|"customer"|"driver"|"office", name }]
}) {
  const events = load()
  const event = {
    id:              nextId(),
    occurredAt,
    recordedAt:      Date.now(),
    type,
    source,
    description:     description.trim(),
    entities,
    note:            note.trim(),
    declarationRefs,
    corrects:        corrects || null,
    subscribers:     getSubscribers(type),
    outcomeRefs:     [],
    taskRefs:        [],
    domain:          domain || null,
    attachments:     attachments || [],
    geoRecord:       geoRecord || null,
    participants:    participants || [],
  }
  events.push(event)
  save(events)
  return event
}

export function getEvents() {
  return load().sort((a, b) => b.occurredAt - a.occurredAt)
}

export function getEventsByType(type) {
  return getEvents().filter(e => e.type === type)
}

export function getEventsForDeclaration(declarationId) {
  return getEvents().filter(e => e.declarationRefs?.includes(declarationId))
}

export function getEventById(id) {
  return load().find(e => e.id === id) || null
}

// Intelligence stats — the clock readout.
// These thresholds are the minimum data needed before PACER can surface
// meaningful patterns. Below threshold: accumulating. Above: active.
export function getIntelligenceStats() {
  const all         = load()
  const attributed  = all.filter(e => e.entities?.some(en => en.type === "approved_by"))
  const gaps        = all.filter(e => !e.entities?.some(en => en.type === "approved_by"))
  const ffEvents    = all.filter(e => e.source === "fleetflow")

  // Densest event type — proxy for pattern recognition readiness
  const byType = {}
  all.forEach(e => { byType[e.type] = (byType[e.type] || 0) + 1 })
  const maxTypeDensity = Math.max(0, ...Object.values(byType))

  // Accountability gap detail — which recent events are missing attribution
  const recentGaps = gaps
    .sort((a, b) => b.occurredAt - a.occurredAt)
    .slice(0, 5)
    .map(e => ({ id: e.id, description: e.description, type: e.type }))

  // Learning velocity: compare doctrine createdAt to event occurredAt.
  // Not yet calculable — requires 10+ attributed events to establish baseline.
  const velocityReady = attributed.length >= 10

  return {
    totalEvents:        all.length,
    attributedCount:    attributed.length,
    attributedThreshold: 50,
    gapCount:           gaps.length,
    recentGaps,
    maxTypeDensity,
    patternThreshold:   20,
    ffEventCount:       ffEvents.length,
    velocityReady,
  }
}

// Memory Integrity Score — JPG-029/031/032
// Measures how well an organization is winning the fight against entropy.
// Score: 0–100. Four weighted components:
//   Reliability  (40%) — quality of evidence captured
//   Attribution  (35%) — chain of custody on decisions
//   Context      (15%) — surrounding information preserved
//   Recency      (10%) — current operations covered, not just archival
//
// This is not a feature. It is the first measurement of organizational
// anti-entropy strength. Doctrines are powerful. Numbers change behavior.
export function getMemoryIntegrityScore() {
  const all = load()

  if (all.length === 0) {
    return {
      score: 0,
      tier: "empty",
      label: "No Record",
      color: "#ff6b6b",
      components: { reliability: 0, attribution: 0, context: 0, recency: 0 },
      interpretation: "The ledger is empty. No events have been recorded. PACER has no organizational memory to measure.",
      eventCount: 0,
    }
  }

  // Reliability component — weighted by tier
  // VERIFIED = 1.0, SYSTEM = 0.7, DECLARED = 0.4
  const TIER_WEIGHTS = { verified: 1.0, system: 0.7, declared: 0.4 }
  const reliabilityRaw = all.reduce((sum, e) => {
    const rel = getSourceReliability(e)
    return sum + (TIER_WEIGHTS[rel.tier] || 0.4)
  }, 0) / all.length
  const reliabilityScore = Math.round(reliabilityRaw * 100)

  // Attribution component — percentage of events with named decision-maker
  const attributed = all.filter(e => e.entities?.some(en => en.type === "approved_by"))
  const attributionScore = Math.round(attributed.length / all.length * 100)

  // Context component — percentage of events with note + entity richness
  const withContext = all.filter(e => {
    const hasNote     = e.note && e.note.trim().length > 10
    const hasEntities = (e.entities?.length || 0) > 1
    const hasAttach   = (e.attachments?.length || 0) > 0
    return hasNote || hasEntities || hasAttach
  })
  const contextScore = Math.round(withContext.length / all.length * 100)

  // Recency component — events in last 30 days vs. expected active cadence
  const cutoff     = Date.now() - (30 * 86400000)
  const recent     = all.filter(e => e.occurredAt >= cutoff)
  // Threshold: 10+ events in last 30 days = fully active organization
  const recencyScore = Math.min(100, Math.round(recent.length / 10 * 100))

  // Composite score
  const composite = Math.round(
    reliabilityScore  * 0.40 +
    attributionScore  * 0.35 +
    contextScore      * 0.15 +
    recencyScore      * 0.10
  )

  // Tier classification
  let tier, label, color, interpretation
  if (composite >= 80) {
    tier   = "defensible"
    label  = "Defensible"
    color  = "#4cd964"
    interpretation = "This organization can defend its operational record. Evidence is reliable, decisions are attributed, context is preserved. Dispute-ready."
  } else if (composite >= 60) {
    tier   = "reliable"
    label  = "Reliable"
    color  = "#7bc85a"
    interpretation = "The record is substantially intact. Most decisions are attributed and evidence is verifiable. Some gaps remain — address attribution and context to reach Defensible."
  } else if (composite >= 40) {
    tier   = "partial"
    label  = "Partial"
    color  = "#ff9f43"
    interpretation = "The record exists but has significant gaps. Attribution is incomplete and reliability is mixed. In a dispute, evidence would be partial. Immediate improvement needed."
  } else {
    tier   = "vulnerable"
    label  = "Vulnerable"
    color  = "#ff6b6b"
    interpretation = "This organization is running on hope. Most of its operational reality is unrecorded, unattributed, or unverifiable. High exposure to dispute, audit, and knowledge loss."
  }

  return {
    score: composite,
    tier,
    label,
    color,
    components: {
      reliability: reliabilityScore,
      attribution: attributionScore,
      context:     contextScore,
      recency:     recencyScore,
    },
    interpretation,
    eventCount: all.length,
    attributedCount: attributed.length,
  }
}


// Per-job Memory Integrity Score — JPG-033 prediction test
// Calculates MIS against only the events attached to a specific job at closure.
// Correlate this score with subsequent outcome events (CLAIM_FILED, CHARGEBACK, etc.)
// to test the hypothesis: low-MIS jobs produce more adverse outcomes.
export function getJobMemoryIntegrity(jobId) {
  const all = load()
  const jobEvents = all.filter(e =>
    e.entities?.some(en => en.type === "job_id" && en.value === jobId)
  )

  if (jobEvents.length === 0) {
    return {
      jobId,
      score: null,
      tier: "no_record",
      label: "No Record",
      color: "#555570",
      components: { reliability: 0, attribution: 0, context: 0, recency: 0 },
      interpretation: `No events found for job ${jobId}. This job has no memory.`,
      eventCount: 0,
      outcomeEvents: [],
    }
  }

  const TIER_WEIGHTS = { verified: 1.0, system: 0.7, declared: 0.4 }
  const reliabilityRaw = jobEvents.reduce((sum, e) => {
    const rel = getSourceReliability(e)
    return sum + (TIER_WEIGHTS[rel.tier] || 0.4)
  }, 0) / jobEvents.length
  const reliabilityScore = Math.round(reliabilityRaw * 100)

  const attributed = jobEvents.filter(e => e.entities?.some(en => en.type === "approved_by"))
  const attributionScore = Math.round(attributed.length / jobEvents.length * 100)

  const withContext = jobEvents.filter(e => {
    const hasNote   = e.note && e.note.trim().length > 10
    const hasRich   = (e.entities?.length || 0) > 1
    const hasAttach = (e.attachments?.length || 0) > 0
    return hasNote || hasRich || hasAttach
  })
  const contextScore = Math.round(withContext.length / jobEvents.length * 100)

  // For a single job, recency is binary: any event in last 30 days = 100, else 0
  const cutoff = Date.now() - (30 * 86400000)
  const hasRecent = jobEvents.some(e => e.occurredAt >= cutoff)
  const recencyScore = hasRecent ? 100 : 0

  const composite = Math.round(
    reliabilityScore  * 0.40 +
    attributionScore  * 0.35 +
    contextScore      * 0.15 +
    recencyScore      * 0.10
  )

  let tier, label, color, interpretation
  if (composite >= 80) {
    tier   = "defensible"
    label  = "Defensible"
    color  = "#4cd964"
    interpretation = `Job ${jobId} is dispute-ready. Evidence is reliable, decisions are attributed, context is preserved.`
  } else if (composite >= 60) {
    tier   = "reliable"
    label  = "Reliable"
    color  = "#7bc85a"
    interpretation = `Job ${jobId} record is substantially intact. Some attribution or context gaps remain.`
  } else if (composite >= 40) {
    tier   = "partial"
    label  = "Partial"
    color  = "#ff9f43"
    interpretation = `Job ${jobId} has significant gaps. In a dispute, evidence would be partial.`
  } else {
    tier   = "vulnerable"
    label  = "Vulnerable"
    color  = "#ff6b6b"
    interpretation = `Job ${jobId} is largely unrecorded, unattributed, or unverifiable. High dispute exposure.`
  }

  const OUTCOME_TYPES = new Set([
    EVENT_TYPES.CLAIM_FILED, EVENT_TYPES.CLAIM_RESOLVED, EVENT_TYPES.CHARGEBACK,
    EVENT_TYPES.INVOICE_WRITTEN_OFF, EVENT_TYPES.CUSTOMER_DISPUTE,
    EVENT_TYPES.CUSTOMER_COMPLAINT, EVENT_TYPES.LEGAL_REQUEST,
  ])
  const outcomeEvents = jobEvents.filter(e => OUTCOME_TYPES.has(e.type))

  return {
    jobId,
    score: composite,
    tier,
    label,
    color,
    components: { reliability: reliabilityScore, attribution: attributionScore, context: contextScore, recency: recencyScore },
    interpretation,
    eventCount: jobEvents.length,
    attributedCount: attributed.length,
    outcomeEvents,
  }
}

// Crew performance analytics — average MIS and outcome rate per crew member.
// Crew members appear when jobs are logged with a crew entity.
// This is where individual operational reliability becomes visible.
export function getCrewPerformance() {
  const all       = load()
  const jobEvents = all.filter(e => e.type === EVENT_TYPES.JOB_COMPLETED)

  const crewMap = {}
  jobEvents.forEach(e => {
    const crewEntity = e.entities?.find(en => en.type === "crew")
    const jobId      = e.entities?.find(en => en.type === "job_id")?.value
    if (!crewEntity || !jobId) return
    const members = crewEntity.value.split(/\s*,\s*/).map(s => s.trim()).filter(Boolean)
    members.forEach(name => {
      if (!crewMap[name]) crewMap[name] = { jobIds: [] }
      crewMap[name].jobIds.push(jobId)
    })
  })

  return Object.entries(crewMap).map(([name, data]) => {
    const integrities = data.jobIds.map(jobId => getJobMemoryIntegrity(jobId))
    const scored      = integrities.filter(i => i.score !== null)
    const avgMIS      = scored.length > 0 ? Math.round(scored.reduce((sum, i) => sum + i.score, 0) / scored.length) : null
    const adverseCount = integrities.reduce((sum, i) => sum + i.outcomeEvents.length, 0)
    return {
      name,
      jobCount:    data.jobIds.length,
      avgMIS,
      adverseCount,
      adverseRate: data.jobIds.length > 0 ? Math.round(adverseCount / data.jobIds.length * 100) : 0,
      color:       _misColor(avgMIS),
    }
  }).sort((a, b) => (b.avgMIS ?? -1) - (a.avgMIS ?? -1))
}

// Decision maker performance analytics — average MIS and outcome rate per named approver.
// Decision makers appear when jobs are logged with an approved_by entity.
// The scoreboard becomes the coach — no manager lecture required.
export function getDecisionMakerPerformance() {
  const all       = load()
  const jobEvents = all.filter(e => e.type === EVENT_TYPES.JOB_COMPLETED)

  const makerMap = {}
  jobEvents.forEach(e => {
    const approver = e.entities?.find(en => en.type === "approved_by")
    const jobId    = e.entities?.find(en => en.type === "job_id")?.value
    if (!approver || !jobId) return
    const name = approver.value.trim()
    if (!makerMap[name]) makerMap[name] = { jobIds: [] }
    makerMap[name].jobIds.push(jobId)
  })

  return Object.entries(makerMap).map(([name, data]) => {
    const integrities = data.jobIds.map(jobId => getJobMemoryIntegrity(jobId))
    const scored      = integrities.filter(i => i.score !== null)
    const avgMIS      = scored.length > 0 ? Math.round(scored.reduce((sum, i) => sum + i.score, 0) / scored.length) : null
    const adverseCount = integrities.reduce((sum, i) => sum + i.outcomeEvents.length, 0)
    return {
      name,
      jobCount:    data.jobIds.length,
      avgMIS,
      adverseCount,
      adverseRate: data.jobIds.length > 0 ? Math.round(adverseCount / data.jobIds.length * 100) : 0,
      color:       _misColor(avgMIS),
    }
  }).sort((a, b) => (b.avgMIS ?? -1) - (a.avgMIS ?? -1))
}

function _misColor(score) {
  if (score === null || score === undefined) return "#555570"
  if (score >= 80) return "#4cd964"
  if (score >= 60) return "#7bc85a"
  if (score >= 40) return "#ff9f43"
  return "#ff6b6b"
}

// Weekly job intake — the fuel metric (JPG-033).
// Returns jobs logged per week for the last 4 weeks.
// If this number grows, the prediction test gets signal.
// If this number stays at zero, nothing else matters.
export function getWeeklyJobIntake() {
  const all = load()
  const now = Date.now()
  const week = 7 * 86400000

  const weeks = [0, 1, 2, 3].map(offset => {
    const start = now - (offset + 1) * week
    const end   = now - offset * week
    const jobs  = all.filter(e =>
      e.type === EVENT_TYPES.JOB_COMPLETED &&
      e.occurredAt >= start &&
      e.occurredAt < end
    )
    const adverse = all.filter(e => {
      const OUTCOME_TYPES = new Set([
        EVENT_TYPES.CLAIM_FILED, EVENT_TYPES.CLAIM_RESOLVED, EVENT_TYPES.CHARGEBACK,
        EVENT_TYPES.INVOICE_WRITTEN_OFF, EVENT_TYPES.CUSTOMER_DISPUTE,
        EVENT_TYPES.CUSTOMER_COMPLAINT, EVENT_TYPES.LEGAL_REQUEST,
      ])
      return OUTCOME_TYPES.has(e.type) && e.occurredAt >= start && e.occurredAt < end
    })
    return { offset, jobs: jobs.length, adverse: adverse.length }
  })

  const thisWeek  = weeks[0].jobs
  const lastWeek  = weeks[1].jobs
  const trend     = thisWeek - lastWeek
  const totalJobs = all.filter(e => e.type === EVENT_TYPES.JOB_COMPLETED).length

  return { thisWeek, lastWeek, trend, weeks, totalJobs }
}

// Outcome correlation table — the prediction test (JPG-033)
// Groups jobs by MIS score bucket at completion. Counts adverse outcomes per bucket.
// Hypothesis: lower-MIS jobs → higher adverse outcome rate.
// This table is the instrument. Reality fills it in.
export function getOutcomeCorrelation() {
  const all = load()

  const jobIds = new Set()
  all.forEach(e => {
    e.entities?.forEach(en => {
      if (en.type === "job_id") jobIds.add(en.value)
    })
  })

  const OUTCOME_TYPES = new Set([
    EVENT_TYPES.CLAIM_FILED,
    EVENT_TYPES.CLAIM_RESOLVED,
    EVENT_TYPES.CHARGEBACK,
    EVENT_TYPES.INVOICE_WRITTEN_OFF,
    EVENT_TYPES.CUSTOMER_DISPUTE,
    EVENT_TYPES.CUSTOMER_COMPLAINT,
    EVENT_TYPES.LEGAL_REQUEST,
  ])

  const buckets = [
    { range: "76–100", min: 76,  max: 100, label: "Defensible", color: "#4cd964", jobs: [], adverseCount: 0 },
    { range: "51–75",  min: 51,  max: 75,  label: "Reliable",   color: "#7bc85a", jobs: [], adverseCount: 0 },
    { range: "26–50",  min: 26,  max: 50,  label: "Partial",    color: "#ff9f43", jobs: [], adverseCount: 0 },
    { range: "0–25",   min: 0,   max: 25,  label: "Vulnerable", color: "#ff6b6b", jobs: [], adverseCount: 0 },
  ]

  for (const jobId of jobIds) {
    const integrity = getJobMemoryIntegrity(jobId)
    if (integrity.score === null) continue
    const hasAdverse = integrity.outcomeEvents.length > 0
    const bucket = buckets.find(b => integrity.score >= b.min && integrity.score <= b.max)
    if (bucket) {
      bucket.jobs.push({ jobId, score: integrity.score, hasAdverse, outcomeEvents: integrity.outcomeEvents })
      if (hasAdverse) bucket.adverseCount++
    }
  }

  const totalJobs = Array.from(jobIds).length
  const totalAdverse = buckets.reduce((sum, b) => sum + b.adverseCount, 0)

  return {
    buckets,
    jobCount: totalJobs,
    outcomeCount: totalAdverse,
    hasData: totalJobs > 0,
  }
}

// These functions back the ARCHIVIST query interface.
// Each question is a structured query against the append-only ledger.

// Q1: What happened? — find events matching free-text, entity value, or type
export function queryEvents({ text, entityValue, entityType, type, limit = 20 } = {}) {
  let results = load()
  if (type)        results = results.filter(e => e.type === type)
  if (entityType)  results = results.filter(e => e.entities?.some(en => en.type === entityType))
  if (entityValue) {
    const v = entityValue.toLowerCase()
    results = results.filter(e =>
      e.entities?.some(en => String(en.value || "").toLowerCase().includes(v)) ||
      e.description?.toLowerCase().includes(v)
    )
  }
  if (text) {
    const t = text.toLowerCase()
    results = results.filter(e =>
      e.description?.toLowerCase().includes(t) ||
      e.note?.toLowerCase().includes(t) ||
      e.entities?.some(en => String(en.value || "").toLowerCase().includes(t))
    )
  }
  return results.sort((a, b) => b.occurredAt - a.occurredAt).slice(0, limit)
}

// Q2: Why did it happen? — extract decision rationale from attributed events
export function getDecisionRationale(eventId) {
  const event = load().find(e => e.id === eventId)
  if (!event) return null
  const approver = event.entities?.find(en => en.type === "approved_by")
  if (!approver) return null
  return {
    approvedBy: approver.value,
    reason:     approver.reason || null,
    eventId,
    occurredAt: event.occurredAt,
    description: event.description,
  }
}

// Q3: Have we seen it before? — find events of the same type / similar profile
export function findSimilarEvents(event, limit = 10) {
  return load()
    .filter(e => e.id !== event.id && e.type === event.type)
    .sort((a, b) => b.occurredAt - a.occurredAt)
    .slice(0, limit)
}

// Q4: What usually happens next? — what event types follow this type in sequence
export function getEventSequenceAfter(eventType, limit = 5) {
  const all     = load().sort((a, b) => a.occurredAt - b.occurredAt)
  const counts  = {}
  for (let i = 0; i < all.length - 1; i++) {
    if (all[i].type === eventType) {
      const next = all[i + 1].type
      counts[next] = (counts[next] || 0) + 1
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([type, count]) => ({ type, count }))
}

// Q5: What should we do? — surface declaration IDs linked to this event.
// Callers resolve declarations from canon.js to avoid circular imports.
export function getLinkedDeclarationIds(event) {
  return event?.declarationRefs || []
}

// Q: Who decided — all attributed events for a named author
export function getEventsByAuthor(authorName) {
  const name = authorName.toLowerCase()
  return load()
    .filter(e => e.entities?.some(
      en => en.type === "approved_by" && String(en.value || "").toLowerCase().includes(name)
    ))
    .sort((a, b) => b.occurredAt - a.occurredAt)
}

// ── K.E.L. Document Generation ────────────────────────────────────────────────
// Documents are generated from verified Event Ledger records, not from
// inference. The document is only as strong as the events behind it.

// Generate a dispute package for a specific job (identified by job_id entity value).
// Organized as weighted testimony — verified evidence first, then system records,
// then declared statements. Courts, insurers, and auditors weight these differently.
export function generateDisputePackage(jobId) {
  const all       = load()
  const jobEvents = all
    .filter(e => e.entities?.some(en => en.type === "job_id" && en.value === jobId))
    .sort((a, b) => a.occurredAt - b.occurredAt)

  if (jobEvents.length === 0) return null

  const approvals   = jobEvents.filter(e => e.entities?.some(en => en.type === "approved_by"))
  const surcharges  = jobEvents.flatMap(e => e.entities?.filter(en => en.type === "surcharge") || [])
  const customers   = [...new Set(jobEvents.flatMap(e => e.entities?.filter(en => en.type === "customer").map(en => en.value) || []))]
  const amounts     = jobEvents.flatMap(e => e.entities?.filter(en => en.type === "amount") || [])
  const totalAmount = amounts.reduce((sum, a) => sum + (a.value || 0), 0)

  // Classify events by reliability tier
  const byTier = { verified: [], system: [], declared: [] }
  jobEvents.forEach(e => { byTier[getSourceReliability(e).tier].push(e) })

  const allEvidence = jobEvents.flatMap(e => e.entities?.filter(en => en.type === "evidence") || [])

  function fmtEvent(e, indent = "") {
    const ts       = new Date(e.occurredAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    const approver = e.entities?.find(en => en.type === "approved_by")
    const evidence = e.entities?.filter(en => en.type === "evidence") || []
    const rel      = getSourceReliability(e)
    const out = [`${indent}${ts}  [${e.id}]  ${e.description}`]
    if (approver) out.push(`${indent}  ↳ Committed by: ${approver.value}${approver.reason ? ` — "${approver.reason}"` : ""}`)
    else          out.push(`${indent}  ⚠ No attribution on record (JPG-009)`)
    if (evidence.length) {
      const evStr = evidence.map(ev => `${ev.value}${ev.present ? " ✓" : ""}${ev.count ? ` ×${ev.count}` : ""}`).join(", ")
      out.push(`${indent}  Evidence: ${evStr}`)
    }
    if (rel.reasons.length > 1) out.push(`${indent}  Reliability basis: ${rel.reasons.join(", ")}`)
    return out.join("\n")
  }

  const lines = []
  lines.push(`DISPUTE PACKAGE — Job ${jobId}`)
  lines.push(`Generated: ${new Date().toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" })}`)
  lines.push(`Source: PACER Event Ledger (append-only, ${jobEvents.length} events) · JPG-018`)
  lines.push("")
  if (customers.length) lines.push(`CUSTOMER: ${customers.join(", ")}`)
  if (totalAmount)      lines.push(`TOTAL RECORDED: $${totalAmount.toLocaleString()} USD`)
  lines.push("")

  // Reliability summary
  lines.push("TESTIMONY RELIABILITY SUMMARY")
  lines.push("─".repeat(44))
  lines.push(`● Verified events:     ${byTier.verified.length}  (high weight — objective evidence present)`)
  lines.push(`● System records:      ${byTier.system.length}  (medium weight — application-generated)`)
  lines.push(`● Declared statements: ${byTier.declared.length}  (context-dependent — human assertion, no corroboration)`)
  lines.push("")

  // Verified tier
  if (byTier.verified.length > 0) {
    lines.push("VERIFIED — HIGH WEIGHT")
    lines.push("Evidence corroborated by objective or third-party sources. These events support factual assertion.")
    lines.push("─".repeat(44))
    byTier.verified.forEach(e => lines.push(fmtEvent(e)))
    lines.push("")
  }

  // System tier
  if (byTier.system.length > 0) {
    lines.push("SYSTEM RECORDS — MEDIUM WEIGHT")
    lines.push("Application-generated events. Reliable for establishing who, when, and where.")
    lines.push("─".repeat(44))
    byTier.system.forEach(e => lines.push(fmtEvent(e)))
    lines.push("")
  }

  // Declared tier
  if (byTier.declared.length > 0) {
    lines.push("DECLARED STATEMENTS — CONTEXT-DEPENDENT WEIGHT")
    lines.push("Human assertions entered without objective corroboration.")
    lines.push("These establish that someone stated X, not that X occurred.")
    lines.push("─".repeat(44))
    byTier.declared.forEach(e => lines.push(fmtEvent(e)))
    lines.push("")
  }

  if (surcharges.length) {
    lines.push("SURCHARGES APPLIED")
    lines.push("─".repeat(40))
    surcharges.forEach(s => lines.push(`${s.value}: $${s.amount} — ${s.approved ? "Approved" : "Pending"}`))
    lines.push("")
  }

  if (approvals.length === 0) {
    lines.push("⚠  NO ATTRIBUTED DECISIONS — accountability gaps detected (JPG-009)")
    lines.push("")
  }

  lines.push("This testimony was assembled from verified Event Ledger records.")
  lines.push("Events are append-only and immutable. Source reliability follows JPG-017.")
  lines.push("PACER is a testimony system, not a memory system (JPG-018). PACER/JPG Ventures.")

  return {
    jobId,
    eventCount:    jobEvents.length,
    approvalCount: approvals.length,
    evidenceCount: allEvidence.length,
    verifiedCount: byTier.verified.length,
    systemCount:   byTier.system.length,
    declaredCount: byTier.declared.length,
    totalAmount,
    text:          lines.join("\n"),
  }
}
// Generate a revenue leakage report — all invoice/revenue recovery events
export function generateRevenueLeakageReport() {
  const all = load()
  const recovered = all
    .filter(e => e.type === EVENT_TYPES.INVOICE_RECOVERED || e.type === EVENT_TYPES.REVENUE_RECOVERED)
    .sort((a, b) => b.occurredAt - a.occurredAt)

  const totalRecovered = recovered.reduce((sum, e) => {
    const amt = e.entities?.find(en => en.type === "amount")
    return sum + (amt?.value || 0)
  }, 0)

  const attributed     = recovered.filter(e => e.entities?.some(en => en.type === "approved_by"))
  const allGaps        = all.filter(e => !e.entities?.some(en => en.type === "approved_by"))
  const attributionRate = recovered.length ? Math.round(attributed.length / recovered.length * 100) : 0

  const lines = []
  lines.push("REVENUE LEAKAGE REPORT")
  lines.push(`Generated: ${new Date().toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" })}`)
  lines.push(`Source: PACER Event Ledger · ${recovered.length} recovery event${recovered.length !== 1 ? "s" : ""}`)
  lines.push("")

  if (recovered.length === 0) {
    lines.push("No revenue recovery events recorded yet.")
    lines.push("Record Invoice Recovered or Revenue Recovered events to populate this report.")
  } else {
    lines.push(`TOTAL RECOVERED TO DATE: $${totalRecovered.toLocaleString()} USD`)
    lines.push(`ATTRIBUTION RATE: ${attributed.length} of ${recovered.length} recoveries had a named approver (${attributionRate}%)`)
    lines.push("")
    lines.push("RECOVERY EVENTS")
    lines.push("─".repeat(44))
    recovered.forEach(e => {
      const ts       = new Date(e.occurredAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
      const amt      = e.entities?.find(en => en.type === "amount")
      const approver = e.entities?.find(en => en.type === "approved_by")
      lines.push(`${ts}  [${e.id}]  ${e.description}`)
      if (amt) lines.push(`  Amount: $${typeof amt.value === "number" ? amt.value.toLocaleString() : amt.value} ${amt.currency || "USD"}`)
      if (approver) lines.push(`  ↳ Approved by: ${approver.value}${approver.reason ? ` — "${approver.reason}"` : ""}`)
      else          lines.push(`  ⚠ No attribution — accountability gap (JPG-009)`)
    })
  }

  if (allGaps.length > 0) {
    lines.push("")
    lines.push(`SYSTEM-WIDE ACCOUNTABILITY GAPS: ${allGaps.length} events across all types have no named approver`)
    lines.push("Revenue recovered from unattributed decisions cannot be traced to a decision-maker.")
    lines.push("These gaps represent the portion of operations that cannot improve through named feedback.")
  }

  lines.push("")
  lines.push("This report was generated from verified Event Ledger records.")
  lines.push("Events are append-only and immutable. PACER/JPG Ventures.")

  return {
    reportType:       "revenue_leakage",
    eventCount:       recovered.length,
    totalRecovered,
    attributedCount:  attributed.length,
    attributionRate,
    gapCount:         allGaps.length,
    text:             lines.join("\n"),
  }
}

// Generate an accountability summary — who decided what, and what has no named approver
export function generateAccountabilitySummary() {
  const all        = load()
  const attributed = all.filter(e => e.entities?.some(en => en.type === "approved_by"))
  const gaps       = all.filter(e => !e.entities?.some(en => en.type === "approved_by"))
  const attributionRate = all.length ? Math.round(attributed.length / all.length * 100) : 0

  const byAuthor = {}
  attributed.forEach(e => {
    const approver = e.entities.find(en => en.type === "approved_by")
    const name     = approver.value
    if (!byAuthor[name]) byAuthor[name] = []
    byAuthor[name].push(e)
  })
  const decisionMakers = Object.keys(byAuthor).length

  const lines = []
  lines.push("ACCOUNTABILITY SUMMARY")
  lines.push(`Generated: ${new Date().toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" })}`)
  lines.push(`Source: PACER Event Ledger · ${all.length} total event${all.length !== 1 ? "s" : ""}`)
  lines.push("")
  lines.push(`ATTRIBUTION RATE: ${attributed.length} of ${all.length} events carry a named decision-maker (${attributionRate}%)`)
  lines.push(`ACCOUNTABILITY GAPS: ${gaps.length} events have no named approver`)
  lines.push(`DECISION MAKERS ON RECORD: ${decisionMakers}`)
  lines.push("")

  if (decisionMakers > 0) {
    lines.push("DECISION MAKERS (ranked by volume)")
    lines.push("─".repeat(44))
    Object.entries(byAuthor)
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([name, events]) => {
        lines.push(`${name}: ${events.length} attributed decision${events.length !== 1 ? "s" : ""}`)
        events.slice(0, 3).forEach(e => {
          const ts      = new Date(e.occurredAt).toLocaleDateString([], { month: "short", day: "numeric" })
          const ap      = e.entities.find(en => en.type === "approved_by")
          const desc    = e.description.length > 58 ? e.description.slice(0, 58) + "…" : e.description
          lines.push(`  ${ts}  ${desc}`)
          if (ap?.reason) {
            const reason = ap.reason.length > 72 ? ap.reason.slice(0, 72) + "…" : ap.reason
            lines.push(`    → "${reason}"`)
          }
        })
        if (events.length > 3) lines.push(`  … and ${events.length - 3} more`)
        lines.push("")
      })
  }

  if (gaps.length > 0) {
    lines.push(`UNATTRIBUTED EVENTS (${gaps.length})`)
    lines.push("─".repeat(44))
    lines.push("These events carry no named decision-maker (JPG-009).")
    lines.push("If any becomes a dispute, there is no record of who decided.")
    lines.push("")
    gaps.sort((a, b) => b.occurredAt - a.occurredAt).slice(0, 10).forEach(e => {
      const ts   = new Date(e.occurredAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
      const desc = e.description.length > 58 ? e.description.slice(0, 58) + "…" : e.description
      lines.push(`${ts}  [${e.id}]  ${desc}`)
    })
    if (gaps.length > 10) lines.push(`… and ${gaps.length - 10} more unattributed events`)
  }

  lines.push("")
  lines.push("This report was generated from verified Event Ledger records.")
  lines.push("Events are append-only and immutable. PACER/JPG Ventures.")

  return {
    reportType:       "accountability",
    totalEvents:      all.length,
    attributedCount:  attributed.length,
    gapCount:         gaps.length,
    attributionRate,
    decisionMakers,
    text:             lines.join("\n"),
  }
}

// Generate a legal-ready evidence timeline — all events in chronological order
// Numbered entries for legal referencing. Oldest-first. Full chain of custody.
export function generateEvidenceTimeline() {
  const all = load().sort((a, b) => a.occurredAt - b.occurredAt)

  const attributed  = all.filter(e => e.entities?.some(en => en.type === "approved_by"))
  const withEvidence = all.filter(e => e.entities?.some(en => en.type === "evidence"))

  const lines = []
  lines.push("EVIDENCE TIMELINE — CHAIN OF CUSTODY")
  lines.push(`Generated: ${new Date().toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" })}`)
  lines.push(`Source: PACER Event Ledger · ${all.length} event${all.length !== 1 ? "s" : ""} · complete record`)
  lines.push("")
  lines.push(`TOTAL EVENTS:          ${all.length}`)
  lines.push(`WITH NAMED APPROVER:   ${attributed.length}`)
  lines.push(`WITH EVIDENCE ON FILE: ${withEvidence.length}`)
  lines.push(`WITHOUT ATTRIBUTION:   ${all.length - attributed.length}`)
  lines.push("")

  if (all.length === 0) {
    lines.push("No events recorded. The ledger is empty.")
  } else {
    lines.push("CHRONOLOGICAL RECORD (oldest first)")
    lines.push("─".repeat(44))
    all.forEach((e, i) => {
      const ts       = new Date(e.occurredAt).toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
      const approver = e.entities?.find(en => en.type === "approved_by")
      const evidence = e.entities?.filter(en => en.type === "evidence") || []
      const jobId    = e.entities?.find(en => en.type === "job_id")
      const customer = e.entities?.find(en => en.type === "customer")
      const amount   = e.entities?.find(en => en.type === "amount")

      lines.push(`Event No. ${String(i + 1).padStart(3, "0")}  [${e.id}]  ${ts}`)
      lines.push(`  Type: ${EVENT_TYPE_LABELS[e.type] || e.type}  ·  Source: ${e.source}`)
      if (jobId)    lines.push(`  Job: ${jobId.value}`)
      if (customer) lines.push(`  Customer: ${customer.value}`)
      if (amount)   lines.push(`  Amount: $${typeof amount.value === "number" ? amount.value.toLocaleString() : amount.value} ${amount.currency || "USD"}`)
      lines.push(`  Description: ${e.description}`)
      if (approver) {
        lines.push(`  Committed by: ${approver.value}${approver.reason ? ` — "${approver.reason}"` : ""}`)
      } else {
        lines.push(`  Attribution: none on record — accountability gap (JPG-009)`)
      }
      if (evidence.length) {
        const evStr = evidence.map(ev => `${ev.value}${ev.present ? " ✓" : ""}${ev.count ? ` ×${ev.count}` : ""}`).join(", ")
        lines.push(`  Evidence: ${evStr}`)
      }
      if (e.note) {
        lines.push(`  Note: ${e.note}`)
      }
      lines.push("")
    })
  }

  lines.push("END OF TIMELINE")
  lines.push("All timestamps are from the original event recording, not this report generation.")
  lines.push("Events are append-only and immutable. This record cannot be retroactively altered.")
  lines.push("PACER/JPG Ventures.")

  return {
    reportType:     "timeline",
    eventCount:     all.length,
    attributedCount: attributed.length,
    evidenceCount:  withEvidence.length,
    gapCount:       all.length - attributed.length,
    text:           lines.join("\n"),
  }
}

// Generate a compliance audit package — attribution rate vs threshold, gap analysis
export function generateAuditPackage({ days = 30 } = {}) {
  const all        = load()
  const cutoff     = Date.now() - (days * 86400000)
  const period     = all.filter(e => e.occurredAt >= cutoff).sort((a, b) => b.occurredAt - a.occurredAt)
  const attributed = period.filter(e => e.entities?.some(en => en.type === "approved_by"))
  const gaps       = period.filter(e => !e.entities?.some(en => en.type === "approved_by"))
  const rate       = period.length ? Math.round(attributed.length / period.length * 100) : 0

  const THRESHOLD = 80
  const compliant = rate >= THRESHOLD

  const byType = {}
  period.forEach(e => { byType[e.type] = (byType[e.type] || 0) + 1 })
  const typeBreakdown = Object.entries(byType).sort((a, b) => b[1] - a[1])

  const lines = []
  lines.push("COMPLIANCE AUDIT PACKAGE")
  lines.push(`Generated: ${new Date().toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" })}`)
  lines.push(`Audit Period: Last ${days} days`)
  lines.push(`Source: PACER Event Ledger · ${period.length} event${period.length !== 1 ? "s" : ""} in period`)
  lines.push("")
  lines.push(`COMPLIANCE STATUS: ${compliant ? "✓  COMPLIANT" : "⚠  NON-COMPLIANT"}`)
  lines.push(`Attribution threshold: ${THRESHOLD}% · Current rate: ${rate}%`)
  lines.push(`Events in period: ${period.length} · Attributed: ${attributed.length} · Gaps: ${gaps.length}`)
  lines.push("")

  if (typeBreakdown.length > 0) {
    lines.push("EVENTS BY TYPE")
    lines.push("─".repeat(44))
    typeBreakdown.forEach(([type, count]) => {
      const typeAttr = period.filter(e => e.type === type && e.entities?.some(en => en.type === "approved_by")).length
      const typeRate = Math.round(typeAttr / count * 100)
      const label    = EVENT_TYPE_LABELS[type] || type
      const flag     = typeRate < THRESHOLD ? "  ⚠" : "  ✓"
      lines.push(`${flag}  ${label}: ${count} event${count !== 1 ? "s" : ""} · ${typeRate}% attributed`)
    })
    lines.push("")
  }

  if (gaps.length > 0) {
    lines.push(`COMPLIANCE GAPS (${gaps.length})`)
    lines.push("─".repeat(44))
    lines.push("The following decisions occurred without a named approver (JPG-009).")
    lines.push("Each cannot be audited at the individual level.")
    lines.push("")
    gaps.forEach(e => {
      const ts   = new Date(e.occurredAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
      const desc = e.description.length > 58 ? e.description.slice(0, 58) + "…" : e.description
      lines.push(`${ts}  [${e.id}]  ${desc}`)
    })
  } else if (period.length > 0) {
    lines.push("No compliance gaps. All events in this period carry a named approver.")
  }

  lines.push("")
  lines.push("This audit was generated from verified Event Ledger records.")
  lines.push("Events are append-only and immutable. PACER/JPG Ventures.")

  return {
    reportType:     "audit",
    periodDays:     days,
    eventCount:     period.length,
    attributedCount: attributed.length,
    gapCount:       gaps.length,
    attributionRate: rate,
    compliant,
    text:           lines.join("\n"),
  }
}

// Generate a crew activity report — job completions by crew member
export function generatePayrollReport() {
  const all       = load()
  const jobEvents = all
    .filter(e => e.type === EVENT_TYPES.JOB_COMPLETED)
    .sort((a, b) => b.occurredAt - a.occurredAt)

  const crewMap = {}
  jobEvents.forEach(e => {
    const crewEntity = e.entities?.find(en => en.type === "crew")
    const jobId      = e.entities?.find(en => en.type === "job_id")?.value
    const amount     = e.entities?.find(en => en.type === "amount")?.value || 0
    const approver   = e.entities?.find(en => en.type === "approved_by")
    if (!crewEntity) return
    const members = crewEntity.value.split(",").map(s => s.trim()).filter(Boolean)
    members.forEach(name => {
      if (!crewMap[name]) crewMap[name] = { jobs: [], totalJobs: 0, totalAmount: 0 }
      crewMap[name].jobs.push({ jobId, description: e.description, amount, occurredAt: e.occurredAt, approver: approver?.value || null })
      crewMap[name].totalJobs++
      crewMap[name].totalAmount += amount
    })
  })

  const crewList = Object.entries(crewMap).sort((a, b) => b[1].totalJobs - a[1].totalJobs)

  const lines = []
  lines.push("CREW ACTIVITY REPORT")
  lines.push(`Generated: ${new Date().toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" })}`)
  lines.push(`Source: PACER Event Ledger · ${jobEvents.length} completed job${jobEvents.length !== 1 ? "s" : ""}`)
  lines.push("")
  lines.push(`CREW MEMBERS ON RECORD: ${crewList.length}`)
  lines.push(`TOTAL JOB COMPLETIONS: ${jobEvents.length}`)
  lines.push("")

  if (crewList.length === 0) {
    lines.push("No crew data recorded yet.")
    lines.push("Crew members appear when job completion events include crew entities.")
  } else {
    lines.push("CREW BREAKDOWN (ranked by job count)")
    lines.push("─".repeat(44))
    crewList.forEach(([name, data]) => {
      lines.push(`${name}`)
      lines.push(`  ${data.totalJobs} job${data.totalJobs !== 1 ? "s" : ""}${data.totalAmount ? ` · $${data.totalAmount.toLocaleString()} total revenue` : ""}`)
      data.jobs.forEach(j => {
        const ts = new Date(j.occurredAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
        const amt = j.amount ? ` · $${j.amount.toLocaleString()}` : ""
        const jid = j.jobId ? ` [${j.jobId}]` : ""
        lines.push(`  ${ts}${jid}${amt}`)
      })
      lines.push("")
    })
  }

  lines.push("This report was generated from verified Event Ledger records.")
  lines.push("Events are append-only and immutable. PACER/JPG Ventures.")

  return {
    reportType: "payroll",
    jobCount:   jobEvents.length,
    crewCount:  crewList.length,
    text:       lines.join("\n"),
  }
}

// Generate a broker/insurance report — testimony-weighted by reliability tier.
// Verified evidence leads. System records follow. Declared statements are labeled
// explicitly as human assertions, not confirmed facts.
export function generateBrokerReport() {
  const all = load()
  const incidents = all.filter(e =>
    e.description?.toLowerCase().includes("damage") ||
    e.description?.toLowerCase().includes("claim") ||
    e.description?.toLowerCase().includes("complaint") ||
    e.entities?.some(en => en.type === "surcharge") ||
    e.entities?.some(en => en.type === "evidence")
  ).sort((a, b) => b.occurredAt - a.occurredAt)

  const withEvidence    = incidents.filter(e => e.entities?.some(en => en.type === "evidence"))
  const withApproval    = incidents.filter(e => e.entities?.some(en => en.type === "approved_by"))
  const withoutApproval = incidents.filter(e => !e.entities?.some(en => en.type === "approved_by"))

  // Classify by tier
  const byTier = { verified: [], system: [], declared: [] }
  incidents.forEach(e => { byTier[getSourceReliability(e).tier].push(e) })

  function fmtIncident(e) {
    const ts        = new Date(e.occurredAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
    const jobId     = e.entities?.find(en => en.type === "job_id")?.value
    const customer  = e.entities?.find(en => en.type === "customer")?.value
    const approver  = e.entities?.find(en => en.type === "approved_by")
    const evidence  = e.entities?.filter(en => en.type === "evidence") || []
    const surcharges = e.entities?.filter(en => en.type === "surcharge") || []
    const out = [`${ts}  [${e.id}]${jobId ? `  Job ${jobId}` : ""}`]
    if (customer) out.push(`  Customer: ${customer}`)
    out.push(`  ${e.description}`)
    if (approver) out.push(`  ↳ Committed by: ${approver.value}${approver.reason ? ` — "${approver.reason}"` : ""}`)
    else          out.push(`  ⚠ No attribution on record (JPG-009)`)
    if (evidence.length) out.push(`  Evidence: ${evidence.map(ev => `${ev.value}${ev.count ? ` ×${ev.count}` : ""}${ev.present ? " ✓" : ""}`).join(", ")}`)
    if (surcharges.length) out.push(`  Surcharges: ${surcharges.map(s => `${s.value} $${s.amount}`).join(", ")}`)
    return out.join("\n")
  }

  const lines = []
  lines.push("BROKER / INSURANCE REPORT")
  lines.push(`Generated: ${new Date().toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" })}`)
  lines.push(`Source: PACER Event Ledger · ${incidents.length} relevant event${incidents.length !== 1 ? "s" : ""} · JPG-018`)
  lines.push("")
  lines.push(`INCIDENTS: ${incidents.length}  ·  WITH EVIDENCE: ${withEvidence.length}  ·  ATTRIBUTED: ${withApproval.length}  ·  GAPS: ${withoutApproval.length}`)
  lines.push("")

  if (incidents.length === 0) {
    lines.push("No damage, claim, or surcharge events recorded yet.")
  } else {
    lines.push("TESTIMONY RELIABILITY SUMMARY")
    lines.push("─".repeat(44))
    lines.push(`● Verified:  ${byTier.verified.length} incident${byTier.verified.length !== 1 ? "s" : ""}  (objective evidence present — strongest position)`)
    lines.push(`● System:    ${byTier.system.length} incident${byTier.system.length !== 1 ? "s" : ""}  (application-generated — reliable for who/when/where)`)
    lines.push(`● Declared:  ${byTier.declared.length} incident${byTier.declared.length !== 1 ? "s" : ""}  (human assertion — establishes that X was stated, not that X occurred)`)
    lines.push("")

    if (byTier.verified.length > 0) {
      lines.push("VERIFIED INCIDENTS — HIGH WEIGHT")
      lines.push("Corroborated by objective or third-party evidence. These support factual assertion.")
      lines.push("─".repeat(44))
      byTier.verified.forEach(e => { lines.push(fmtIncident(e)); lines.push("") })
    }

    if (byTier.system.length > 0) {
      lines.push("SYSTEM RECORDS — MEDIUM WEIGHT")
      lines.push("Application-generated. Reliable for establishing who, when, and where.")
      lines.push("─".repeat(44))
      byTier.system.forEach(e => { lines.push(fmtIncident(e)); lines.push("") })
    }

    if (byTier.declared.length > 0) {
      lines.push("DECLARED STATEMENTS — CONTEXT-DEPENDENT WEIGHT")
      lines.push("Human assertions without objective corroboration.")
      lines.push("These establish that someone stated X — not that X occurred.")
      lines.push("─".repeat(44))
      byTier.declared.forEach(e => { lines.push(fmtIncident(e)); lines.push("") })
    }
  }

  lines.push("This testimony was assembled from verified Event Ledger records.")
  lines.push("Source reliability follows JPG-017. PACER is a testimony system (JPG-018).")
  lines.push("Events are append-only and immutable. PACER/JPG Ventures.")

  return {
    reportType:     "broker",
    incidentCount:  incidents.length,
    evidenceCount:  withEvidence.length,
    attributedCount: withApproval.length,
    gapCount:       withoutApproval.length,
    verifiedCount:  byTier.verified.length,
    systemCount:    byTier.system.length,
    declaredCount:  byTier.declared.length,
    text:           lines.join("\n"),
  }
}

// Export the full PACER record as a portable, self-contained testimony document.
// The record belongs to the organization (JPG-021). It must be readable without
// any platform access. No special software required to verify or present it.
export function exportLedgerRecord({ orgName = "JPG Ventures LLC" } = {}) {
  const all   = load().sort((a, b) => a.occurredAt - b.occurredAt)
  const stats = getIntelligenceStats()

  const byTier = { verified: 0, system: 0, declared: 0 }
  all.forEach(e => { byTier[getSourceReliability(e).tier]++ })

  const oldest = all[0]
  const newest = all[all.length - 1]
  const span   = oldest && newest
    ? `${new Date(oldest.occurredAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })} – ${new Date(newest.occurredAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}`
    : "no events recorded"

  const W = 62
  const line = "═".repeat(W)
  const thin = "─".repeat(W)

  const lines = [
    line,
    "PACER TESTIMONY RECORD",
    line,
    `Organization:  ${orgName}`,
    `Exported:      ${new Date().toLocaleString()}`,
    `Record span:   ${span}`,
    "",
    `Total events:  ${all.length}`,
    `Attributed:    ${stats.attributedCount}  (${all.length ? Math.round(stats.attributedCount / all.length * 100) : 0}% attribution rate)`,
    `Gaps:          ${stats.gapCount}  (events without named approver)`,
    "",
    `Reliability:   ${byTier.verified} verified  ·  ${byTier.system} system  ·  ${byTier.declared} declared`,
    "",
    "This record is the property of the organization named above.",
    "Events are append-only and immutable. No event has been altered since recording.",
    "This document requires no special software to read, verify, or present.",
    "PACER is a testimony system. The record speaks for itself.",
    "Portability follows JPG-021: ownership without portability is license.",
    line,
    "",
  ]

  if (all.length === 0) {
    lines.push("No events have been recorded. The ledger is empty.")
  } else {
    lines.push(`COMPLETE EVENT RECORD  (${all.length} events · oldest first)`)
    lines.push(thin)
    lines.push("")

    all.forEach((e, i) => {
      const rel      = getSourceReliability(e)
      const ts       = new Date(e.occurredAt).toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
      const approver = e.entities?.find(en => en.type === "approved_by")
      const evidence = e.entities?.filter(en => en.type === "evidence") || []
      const jobId    = e.entities?.find(en => en.type === "job_id")?.value
      const customer = e.entities?.find(en => en.type === "customer")?.value
      const amount   = e.entities?.find(en => en.type === "amount")

      lines.push(`Event ${String(i + 1).padStart(4, "0")}  [${e.id}]  ${rel.tier.toUpperCase()}`)
      lines.push(`  ${ts}  ·  ${EVENT_TYPE_LABELS[e.type] || e.type}  ·  source: ${e.source}`)
      if (jobId)    lines.push(`  Job: ${jobId}`)
      if (customer) lines.push(`  Customer: ${customer}`)
      if (amount)   lines.push(`  Amount: $${typeof amount.value === "number" ? amount.value.toLocaleString() : amount.value} ${amount.currency || "USD"}`)
      lines.push(`  "${e.description}"`)
      if (approver) lines.push(`  Committed by: ${approver.value}${approver.reason ? ` — "${approver.reason}"` : ""}`)
      else          lines.push(`  ⚠ No attribution (accountability gap — JPG-009)`)
      if (evidence.length) lines.push(`  Evidence: ${evidence.map(ev => ev.value + (ev.present ? " ✓" : "") + (ev.count ? ` ×${ev.count}` : "")).join(", ")}`)
      if (e.attachments?.length) {
        const counts = {}
        e.attachments.forEach(a => { counts[a.type] = (counts[a.type] || 0) + 1 })
        lines.push(`  Attachments: ${Object.entries(counts).map(([t, n]) => `${n} ${t}`).join(", ")}`)
        e.attachments.forEach((a, ai) => {
          if (a.caption) lines.push(`    [${ai + 1}] ${a.type}: ${a.caption}${a.url ? ` — ${a.url}` : ""}`)
        })
      }
      if (e.geoRecord) lines.push(`  GPS: ${e.geoRecord.lat?.toFixed(6)}, ${e.geoRecord.lng?.toFixed(6)}`)
      if (e.participants?.length) lines.push(`  Present: ${e.participants.map(p => `${p.name} (${p.role})`).join(", ")}`)
      if (e.note)   lines.push(`  Note: ${e.note}`)
      if (rel.reasons.length > 0) lines.push(`  Reliability basis: ${rel.reasons.join(", ")}`)
      lines.push("")
    })
  }

  lines.push(line)
  lines.push("END OF RECORD")
  lines.push(`${all.length} events · ${stats.attributedCount} attributed · ${byTier.verified} verified`)
  lines.push(`The record belongs to ${orgName}. Generated by PACER.`)
  lines.push(`Doctrines: JPG-001 through JPG-025 · ${new Date().toLocaleDateString()}`)
  lines.push(line)

  const text     = lines.join("\n")
  const date     = new Date().toISOString().split("T")[0]
  const filename = `pacer-record-${date}.txt`

  return { text, filename, eventCount: all.length }
}

// Source reliability tiers — JPG-017
// verified: third-party or objective corroboration (signature, photo, GPS)
// system:   application-generated (FleetFlow, API webhooks)
// declared: human assertion without corroboration (manual entry)
export const RELIABILITY_TIERS = {
  VERIFIED: "verified",
  SYSTEM:   "system",
  DECLARED: "declared",
}

export const RELIABILITY_COLORS = {
  verified: "#4cd964",
  system:   "#5a9bc8",
  declared: "#ff9f43",
}

// Universal Event Schema — attachment types and domain registry (JPG-025)
export const ATTACHMENT_TYPES = {
  IMAGE:     "image",
  AUDIO:     "audio",
  VIDEO:     "video",
  DOCUMENT:  "document",
  SIGNATURE: "signature",
}

export const EVENT_DOMAINS = {
  OPS:       "ops",
  CREATIVE:  "creative",
  FINANCIAL: "financial",
  DISPATCH:  "dispatch",
  NARRATIVE: "narrative",
}

export function getSourceReliability(event) {
  if (!event) return { tier: RELIABILITY_TIERS.DECLARED, reasons: ["no event"] }

  const entities    = event.entities    || []
  const attachments = event.attachments || []
  const reasons     = []

  // Verified — third-party or objective evidence present
  // Check legacy entity-based evidence flags
  const hasSig   = entities.some(en => en.type === "evidence" && String(en.value || "").includes("signature") && en.present)
  const hasPhoto = entities.some(en => en.type === "evidence" && String(en.value || "").includes("photo") && (en.count > 0 || en.present))
  const hasGPS   = entities.some(en => en.type === "evidence" && String(en.value || "").toLowerCase().includes("gps"))

  // Check first-class attachments (JPG-025)
  const hasAttachedSig   = attachments.some(a => a.type === ATTACHMENT_TYPES.SIGNATURE)
  const hasAttachedPhoto = attachments.some(a => a.type === ATTACHMENT_TYPES.IMAGE || a.type === ATTACHMENT_TYPES.VIDEO)
  const hasGeoRecord     = !!event.geoRecord

  if (hasSig   || hasAttachedSig)   reasons.push("signature on file")
  if (hasPhoto || hasAttachedPhoto) reasons.push("photo documentation present")
  if (hasGPS   || hasGeoRecord)     reasons.push("GPS data captured")

  if (reasons.length > 0) return { tier: RELIABILITY_TIERS.VERIFIED, reasons }

  // System — application-generated
  if (event.source === "fleetflow" || event.source === "api") {
    reasons.push(`recorded by ${event.source}`)
    if (entities.some(en => en.type === "approved_by")) reasons.push("named approver on record")
    return { tier: RELIABILITY_TIERS.SYSTEM, reasons }
  }

  // Declared — manual human assertion
  reasons.push("manually entered")
  if (entities.some(en => en.type === "approved_by")) reasons.push("named approver on record")
  else reasons.push("no attribution on record")

  return { tier: RELIABILITY_TIERS.DECLARED, reasons }
}

// Builds organizational memory context injected into VERA's system prompt.
// Queries the Event Ledger for events relevant to the user's question.
// VERA answers from this context — not from AI inference. JPG-014.
export function buildVERAMemoryContext(question = "") {
  const all = load()

  if (all.length === 0) {
    return [
      "",
      "--- EVENT LEDGER CONTEXT ---",
      "No events have been recorded yet. The organizational ledger is empty.",
      "If asked what happened, the honest answer is: nothing has been recorded.",
      "--- END LEDGER CONTEXT ---",
    ].join("\n")
  }

  const attributed = all.filter(e => e.entities?.some(en => en.type === "approved_by"))
  const gaps       = all.filter(e => !e.entities?.some(en => en.type === "approved_by"))

  const stopwords  = new Set(["what","when","where","which","that","this","have","does","with","from","about","were","been","will","would","could","should","there","their","these","those","into","over","after","last","more","than","then","them","they","some","also","just","only","your"])
  const keywords   = question.toLowerCase()
    .split(/[\s,.\-?!:;'"()+]+/)
    .filter(w => w.length > 3 && !stopwords.has(w))

  const seen = new Set()
  const relevant = []

  for (const kw of keywords.slice(0, 5)) {
    for (const e of all) {
      if (seen.has(e.id)) continue
      const match =
        e.description?.toLowerCase().includes(kw) ||
        e.note?.toLowerCase().includes(kw) ||
        e.type?.toLowerCase().includes(kw) ||
        e.entities?.some(en => String(en.value || "").toLowerCase().includes(kw))
      if (match) { relevant.push(e); seen.add(e.id) }
    }
  }

  const contextEvents = relevant.length > 0
    ? relevant.sort((a, b) => b.occurredAt - a.occurredAt).slice(0, 12)
    : all.sort((a, b) => b.occurredAt - a.occurredAt).slice(0, 8)

  const formatEvent = (e) => {
    const ts       = new Date(e.occurredAt).toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
    const approver = e.entities?.find(en => en.type === "approved_by")
    const jobId    = e.entities?.find(en => en.type === "job_id")?.value
    const customer = e.entities?.find(en => en.type === "customer")?.value
    const amount   = e.entities?.find(en => en.type === "amount")
    const evidence = e.entities?.filter(en => en.type === "evidence") || []

    const rel  = getSourceReliability(e)

    let line = `[${e.id}] ${ts} · ${EVENT_TYPE_LABELS[e.type] || e.type} [${rel.tier.toUpperCase()}]`
    if (jobId)    line += ` · Job ${jobId}`
    if (customer) line += ` · ${customer}`
    if (amount)   line += ` · $${typeof amount.value === "number" ? amount.value.toLocaleString() : amount.value}`
    line += `\n  "${e.description}"`
    if (approver) line += `\n  Approved by: ${approver.value}${approver.reason ? ` — "${approver.reason}"` : ""}`
    else          line += `\n  ⚠ No attribution on record`
    if (evidence.length) line += `\n  Evidence: ${evidence.map(ev => ev.value + (ev.present ? " ✓" : "")).join(", ")}`
    if (e.attachments?.length) {
      const counts = {}
      e.attachments.forEach(a => { counts[a.type] = (counts[a.type] || 0) + 1 })
      line += `\n  Attachments: ${Object.entries(counts).map(([t, n]) => `${n} ${t}`).join(", ")}`
    }
    if (e.geoRecord) line += `\n  GPS recorded`
    line += `\n  Source reliability: ${rel.tier} (${rel.reasons.join(", ")})`
    if (e.note)   line += `\n  Note: ${e.note}`
    return line
  }

  const header = relevant.length > 0
    ? `Relevant to this query: ${contextEvents.length} event${contextEvents.length !== 1 ? "s" : ""}`
    : `Recent events (no keyword match): ${contextEvents.length} shown`

  return [
    "",
    "--- EVENT LEDGER CONTEXT ---",
    `Ledger: ${all.length} total events · ${attributed.length} attributed · ${gaps.length} gaps`,
    header,
    "",
    ...contextEvents.map(formatEvent),
    "",
    "INSTRUCTIONS: Cite events by ID (e.g., 'Event EVT-001 recorded...').",
    "If an answer is not traceable to an event above, say: 'The ledger has no record of that.'",
    "Never infer or reconstruct from general knowledge. Only from the records above.",
    "Source reliability tiers (JPG-017): VERIFIED = objective/third-party evidence (signature, photo, GPS);",
    "SYSTEM = application-generated (FleetFlow, API); DECLARED = human assertion, no corroboration.",
    "Weight your language accordingly — verified events can be stated as fact; declared events should be",
    "presented as 'the record shows X was entered' not 'X happened.'",
    "Events are append-only and immutable. Timestamps are from original recording.",
    "--- END LEDGER CONTEXT ---",
  ].join("\n")
}

// Idempotent: only seeds if no events exist yet.
export function seedEvents() {
  const existing = load()
  if (existing.some(e => e.id === "EVT-001")) return

  const seed = {
    id:          "EVT-001",
    occurredAt:  new Date("2026-06-04").getTime(),
    recordedAt:  Date.now(),
    type:        EVENT_TYPES.EQUIPMENT_PURCHASE,
    source:      "manual",
    description: "First operational equipment acquisition. JPG Ventures begins owning physical infrastructure rather than renting.",
    entities: [
      { type: "vendor",  value: "Chris-Lapi Moving Supplies" },
      { type: "item",    value: "Deluxe Dolly Bar (Black Rubber Coated)", qty: 2, unitPrice: 65, total: 130 },
      { type: "item",    value: "4\" Wheel Rubber Cap Dolly", qty: 1, unitPrice: 59, total: 59 },
      { type: "amount",  value: 189, currency: "USD" },
      { type: "category", value: "equipment" },
    ],
    note: "Chain origin: purchase → use in FleetFlow jobs → revenue → measurable outcome. This is the first link in JPG Ventures' equipment-to-revenue trace. At recording time the ROI is unknown. Time will decide what this becomes.",
    declarationRefs: ["JPG-003"],
    corrects: null,
    subscribers: ["archivist", "opscore", "kel"],
    outcomeRefs: [],
    taskRefs: [],
  }

  // Insert at the front of whatever exists (sorted by occurredAt desc, so this goes last)
  existing.unshift(seed)
  save(existing)
  _nextSeq = null  // reset seq counter so next createEvent reads actual max
}

// ── FleetFlow Integration Contract ────────────────────────────────────────────
// FleetFlow emits events in this shape. ingestFleetFlowEvent() normalizes them
// into the PACER Event Ledger schema. This is the OBSERVE → REMEMBER boundary.
//
// When the FleetFlow integration is live, FleetFlow calls ingestFleetFlowEvent()
// on every state change. Until then, OpsBoard provides a simulator.

export const FF_EVENT_TYPES = {
  JOB_CREATED:        "job.created",
  JOB_COMPLETED:      "job.completed",
  INVOICE_SENT:       "invoice.sent",
  INVOICE_PAID:       "invoice.paid",
  PAYMENT_RECOVERED:  "payment.recovered",
  SURCHARGE_APPROVED: "surcharge.approved",
  CREW_ASSIGNED:      "crew.assigned",
  COMPLAINT_FILED:    "complaint.filed",
  EQUIPMENT_ADDED:    "equipment.added",
  DAMAGE_REPORTED:    "damage.reported",
}

// FleetFlow event shape — the exact contract FleetFlow must emit:
// {
//   ff_event:         FF_EVENT_TYPES value (required)
//   ff_job_id:        string — FleetFlow job identifier
//   ff_timestamp:     ms epoch — when it occurred (defaults to now)
//   ff_customer:      string — customer name
//   ff_crew:          string[] — crew member names
//   ff_amount:        number — monetary value in USD
//   ff_surcharges:    { type, amount, approved }[]
//   ff_signature:     boolean — was customer signature captured?
//   ff_photo_count:   number — photos taken at job
//   ff_approved_by:   string — NAME of person who committed to this decision  ← JPG-009
//   ff_approval_reason: string — why they approved (optional but encouraged)
//   ff_description:   string — human-readable event summary
//   ff_note:          string — optional significance note
//   ff_declarationRefs: string[] — JPG declaration IDs this event tests
// }
// ff_approved_by is the JPG-009 field. Without it, the event is recorded
// but the learning loop it enables is already broken. The event tells you
// what happened. ff_approved_by tells you who chose it.

const FF_TYPE_MAP = {
  [FF_EVENT_TYPES.JOB_CREATED]:       EVENT_TYPES.JOB_CREATED,
  [FF_EVENT_TYPES.JOB_COMPLETED]:     EVENT_TYPES.JOB_COMPLETED,
  [FF_EVENT_TYPES.INVOICE_SENT]:      EVENT_TYPES.INVOICE_PAID,
  [FF_EVENT_TYPES.INVOICE_PAID]:      EVENT_TYPES.INVOICE_PAID,
  [FF_EVENT_TYPES.PAYMENT_RECOVERED]: EVENT_TYPES.REVENUE_RECOVERED,
  [FF_EVENT_TYPES.SURCHARGE_APPROVED]:EVENT_TYPES.JOB_COMPLETED,
  [FF_EVENT_TYPES.CREW_ASSIGNED]:     EVENT_TYPES.MANUAL,
  [FF_EVENT_TYPES.COMPLAINT_FILED]:   EVENT_TYPES.MANUAL,
  [FF_EVENT_TYPES.EQUIPMENT_ADDED]:   EVENT_TYPES.EQUIPMENT_PURCHASE,
  [FF_EVENT_TYPES.DAMAGE_REPORTED]:   EVENT_TYPES.MANUAL,
}

export function ingestFleetFlowEvent(ffEvent) {
  const type     = FF_TYPE_MAP[ffEvent.ff_event] || EVENT_TYPES.MANUAL
  const entities = []

  // Attribution first — JPG-009: without this, the learning loop is broken
  if (ffEvent.ff_approved_by) {
    entities.push({
      type:   "approved_by",
      value:  ffEvent.ff_approved_by,
      reason: ffEvent.ff_approval_reason || null,
    })
  }

  if (ffEvent.ff_job_id)    entities.push({ type: "job_id",   value: ffEvent.ff_job_id })
  if (ffEvent.ff_customer)  entities.push({ type: "customer", value: ffEvent.ff_customer })
  if (ffEvent.ff_crew?.length) {
    entities.push({ type: "crew", value: ffEvent.ff_crew.join(", ") })
  }
  if (ffEvent.ff_amount != null) {
    entities.push({ type: "amount", value: ffEvent.ff_amount, currency: "USD" })
  }
  if (ffEvent.ff_surcharges?.length) {
    ffEvent.ff_surcharges.forEach(s => {
      entities.push({ type: "surcharge", value: s.type, amount: s.amount, approved: s.approved })
    })
  }
  if (ffEvent.ff_signature) {
    entities.push({ type: "evidence", value: "customer_signature", present: true })
  }
  if (ffEvent.ff_photo_count) {
    entities.push({ type: "evidence", value: "photos", count: ffEvent.ff_photo_count })
  }

  return createEvent({
    type,
    occurredAt:      ffEvent.ff_timestamp || Date.now(),
    source:          "fleetflow",
    description:     ffEvent.ff_description || `FleetFlow: ${ffEvent.ff_event}`,
    entities,
    note:            ffEvent.ff_note || "",
    declarationRefs: ffEvent.ff_declarationRefs || [],
  })
}

// Demo events — representative FleetFlow events for the simulator.
// These are structurally accurate; only the data is synthetic.
export const FF_DEMO_EVENTS = [
  {
    ff_event:          FF_EVENT_TYPES.JOB_COMPLETED,
    ff_job_id:         "FF-8812",
    ff_customer:       "Smith Family",
    ff_crew:           ["Marcus T.", "Devon R."],
    ff_amount:         1450,
    ff_surcharges:     [{ type: "stairs", amount: 150, approved: true }],
    ff_signature:      true,
    ff_photo_count:    4,
    ff_approved_by:    "Joe G.",
    ff_approval_reason:"Additional staircase carry — 3 flights, customer confirmed on-site",
    ff_description:    "Job FF-8812 completed — Smith Family 3BR move, stair surcharge approved",
    ff_note:           "Surcharge approved on-site. Evidence captured. Tests JPG-003 and JPG-009: visible at time of occurrence, committed with a name.",
    ff_declarationRefs: ["JPG-003", "JPG-004", "JPG-009"],
    ff_timestamp:      Date.now() - 3600000,
  },
  {
    ff_event:          FF_EVENT_TYPES.PAYMENT_RECOVERED,
    ff_job_id:         "FF-7934",
    ff_customer:       "Ortega LLC",
    ff_amount:         320,
    ff_approved_by:    "Marcus T.",
    ff_approval_reason:"47-day outstanding balance confirmed, customer unresponsive to prior reminders — escalated collection approved",
    ff_description:    "Invoice FF-INV-0447 recovered — 47 days outstanding, $320 collected",
    ff_note:           "Revenue that would have been lost without systematic follow-up. Tests JPG-005 and JPG-009.",
    ff_declarationRefs: ["JPG-005", "JPG-009"],
    ff_timestamp:      Date.now() - 86400000,
  },
  {
    ff_event:          FF_EVENT_TYPES.DAMAGE_REPORTED,
    ff_job_id:         "FF-8801",
    ff_customer:       "Williams Estate",
    ff_approved_by:    "Joe G.",
    ff_approval_reason:"Damage confirmed on-site — antique dresser corner, photo documentation attached, claim opened",
    ff_description:    "Damage claim filed — antique dresser corner damaged during load",
    ff_note:           "Event enters the record at time of occurrence with named responsible party. ARCHIVIST holds the account before any dispute begins. Tests JPG-007 and JPG-009.",
    ff_declarationRefs: ["JPG-007", "JPG-009"],
    ff_timestamp:      Date.now() - 7200000,
  },
]
