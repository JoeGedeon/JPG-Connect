// src/engine/calendar.js
// Local timeline/event store for PACER context rail

const CALENDAR_KEY = "pacer_calendar_v1"

export const EVENT_TYPES = {
  ops:      { label: "OPS",      color: "#00c896" },
  creative: { label: "CREATIVE", color: "#c87dff" },
  claw:     { label: "CLAW",     color: "#ff9f43" },
  deadline: { label: "DEADLINE", color: "#ff6b6b" },
  meeting:  { label: "MEETING",  color: "#4db8ff" },
}

function loadEvents() {
  try {
    const raw = localStorage.getItem(CALENDAR_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveEvents(evts) {
  try { localStorage.setItem(CALENDAR_KEY, JSON.stringify(evts)) } catch {}
}

export function addEvent(evt) {
  const evts = loadEvents()
  const newEvt = { id: Date.now(), createdAt: Date.now(), done: false, ...evt }
  evts.push(newEvt)
  saveEvents(evts)
  return newEvt
}

export function getUpcomingEvents(daysAhead = 7) {
  const now = Date.now()
  const cutoff = now + daysAhead * 86400000
  return loadEvents()
    .filter(e => !e.done && e.dueAt >= now && e.dueAt <= cutoff)
    .sort((a, b) => a.dueAt - b.dueAt)
}

export function getOverdueEvents() {
  const now = Date.now()
  return loadEvents()
    .filter(e => !e.done && e.dueAt < now)
    .sort((a, b) => b.dueAt - a.dueAt)
}

export function markEventDone(id) {
  saveEvents(loadEvents().map(e => e.id === id ? { ...e, done: true } : e))
}

export function deleteEvent(id) {
  saveEvents(loadEvents().filter(e => e.id !== id))
}
