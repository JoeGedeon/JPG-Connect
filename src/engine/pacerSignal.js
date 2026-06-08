// src/engine/pacerSignal.js
// FleetFlow → PACER signal sender
// JPG Ventures LLC
//
// Fire-and-forget: never blocks the UI, never throws to callers.
//
// Required env vars (Vite / Netlify):
//   VITE_PACER_SIGNAL_URL    — PACER signal bridge function URL
//                               e.g. https://your-pacer.netlify.app/.netlify/functions/fleetflow-signal
//   VITE_PACER_SIGNAL_SECRET — shared secret (matches FLEETFLOW_SIGNAL_SECRET in PACER Netlify)
//
// Signal shape sent:
//   { type, job?, amount?, note?, userId? }
//
// Supported event types:
//   lead.new | estimate.created | job.booked | job.completed
//   payment.received | invoice.overdue | payroll.issue
//   task.approved | task.completed

const PACER_URL    = import.meta.env.VITE_PACER_SIGNAL_URL
const PACER_SECRET = import.meta.env.VITE_PACER_SIGNAL_SECRET

/**
 * Send a FleetFlow business event to PACER.
 * @param {string} type    Event type (e.g. "job.booked", "payment.received")
 * @param {object} payload Optional context: { job, amount, note, userId }
 */
export function sendSignalToPacer(type, payload = {}) {
  if (!PACER_URL || !PACER_SECRET) return
  fetch(PACER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-fleetflow-secret": PACER_SECRET,
    },
    body: JSON.stringify({ type, ...payload }),
  }).catch(() => {})
}
