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
  [EVENT_TYPES.MEETING_COMPLETED]:  "Meeting Completed",
  [EVENT_TYPES.CORRECTION]:         "Correction",
  [EVENT_TYPES.MANUAL]:             "Manual Entry",
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
  corrects = null,     // EVT id this corrects, if type === CORRECTION
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

// Seed EVT-001 — the first physical operational asset owned by JPG Ventures.
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
