// src/engine/fleetflow.js
// FleetFlow signal bridge — the organism gets eyes.
//
// FleetFlow writes structured events to Firestore /ff_events.
// PACER reads, normalizes, fires internal signals.
// ARCHIVIST accumulates. OPSCORE interprets. KODEX can rule.
//
// PACER does not read raw job documents. It reads events.
// Controlled vocabulary. No haunted spreadsheets with opinions.

import { db, isFirestoreConfigured } from "./firebase.js"
import { recordSignal, SIGNAL_TYPES } from "./signals.js"

const FF_SYNC_KEY   = "pacer_ff_sync_at"
const FF_COLLECTION = "ff_events"

// FF_VOCAB — the controlled vocabulary PACER uses for FleetFlow events.
// These are semantic events, not raw FleetFlow status strings.
export const FF_VOCAB = {
  JOB_COMPLETED:      "ff:job_completed",
  ESTIMATE_APPROVED:  "ff:estimate_approved",
  CLIENT_SIGNED:      "ff:client_signed",
  PAYMENT_CONFIRMED:  "ff:payment_confirmed",
  DELIVERY_CONFIRMED: "ff:delivery_confirmed",
  DRIVER_SIGNED:      "ff:driver_signed",
  LOADING_COMPLETE:   "ff:loading_complete",
  ESTIMATE_VARIANCE:  "ff:estimate_variance",   // risk: >10% CF delta
  MISSING_SIGNATURE:  "ff:missing_signature",   // risk: completed unsigned
  PAYMENT_DELAY:      "ff:payment_delay",       // risk: completed unpaid
}

// ── Normalization ─────────────────────────────────────────────────────────────
// Each FF event maps to a PACER signal with a readable title and summary.
// The signal source is always "ops" — OPSCORE owns FleetFlow reality.

function eventToSignal(ffEvent) {
  const { eventType, jobId, payload = {} } = ffEvent
  const shortId = jobId ? jobId.replace("FLEETFLOW-", "FF-") : "FF-?"

  switch (eventType) {
    case FF_VOCAB.JOB_COMPLETED:
      return {
        type:    SIGNAL_TYPES.FF_JOB_COMPLETED,
        source:  "ops",
        title:   shortId,
        summary: `$${payload.billedTotal || 0} · ${payload.finalCF || 0} CF`,
      }
    case FF_VOCAB.ESTIMATE_APPROVED:
      return {
        type:    SIGNAL_TYPES.FF_ESTIMATE_APPROVED,
        source:  "ops",
        title:   shortId,
        summary: `$${payload.billedTotal || 0} · ${payload.estimatedCF || 0} CF`,
      }
    case FF_VOCAB.CLIENT_SIGNED:
      return {
        type:    SIGNAL_TYPES.FF_CLIENT_SIGNED,
        source:  "ops",
        title:   shortId,
        summary: "contract established",
      }
    case FF_VOCAB.PAYMENT_CONFIRMED:
      return {
        type:    SIGNAL_TYPES.FF_PAYMENT_CONFIRMED,
        source:  "ops",
        title:   shortId,
        summary: `$${payload.amount || payload.billedTotal || 0} received`,
      }
    case FF_VOCAB.DELIVERY_CONFIRMED:
      return {
        type:    SIGNAL_TYPES.FF_DELIVERY_CONFIRMED,
        source:  "ops",
        title:   shortId,
        summary: "client confirmed delivery",
      }
    case FF_VOCAB.DRIVER_SIGNED:
      return {
        type:    SIGNAL_TYPES.FF_DRIVER_SIGNED,
        source:  "ops",
        title:   shortId,
        summary: "driver closed out",
      }
    case FF_VOCAB.LOADING_COMPLETE:
      return {
        type:    SIGNAL_TYPES.FF_LOADING_COMPLETE,
        source:  "ops",
        title:   shortId,
        summary: "truck loaded and sealed",
      }
    case FF_VOCAB.ESTIMATE_VARIANCE:
      return {
        type:    SIGNAL_TYPES.FF_ESTIMATE_VARIANCE,
        source:  "ops",
        title:   shortId,
        summary: `${payload.variancePct || 0}% CF variance · ${payload.estimatedCF || 0} → ${payload.finalCF || 0}`,
      }
    case FF_VOCAB.MISSING_SIGNATURE:
      return {
        type:    SIGNAL_TYPES.FF_MISSING_SIGNATURE,
        source:  "ops",
        title:   shortId,
        summary: `completed without ${payload.missing || "required signature"}`,
      }
    case FF_VOCAB.PAYMENT_DELAY:
      return {
        type:    SIGNAL_TYPES.FF_PAYMENT_DELAY,
        source:  "ops",
        title:   shortId,
        summary: `$${payload.billedTotal || 0} outstanding at close`,
      }
    default:
      return null
  }
}

// ── Ingest ────────────────────────────────────────────────────────────────────

export function ingestFleetFlowEvent(ffEvent) {
  const sig = eventToSignal(ffEvent)
  if (!sig) return null
  return recordSignal(sig)
}

// ── Sync ──────────────────────────────────────────────────────────────────────
// Reads /ff_events written since the last sync, normalizes, fires PACER signals.
// Non-blocking: if Firestore is unavailable, localStorage remains source of truth.
// High-water mark in localStorage("pacer_ff_sync_at") — numeric epoch.

export async function syncFromFleetFlow() {
  if (!isFirestoreConfigured || !db) return { ingested: 0 }

  const { collection, query, where, orderBy, getDocs, limit } =
    await import("firebase/firestore")

  const lastSync = parseInt(localStorage.getItem(FF_SYNC_KEY) || "0")

  try {
    const q = query(
      collection(db, FF_COLLECTION),
      where("occurredAt", ">", lastSync),
      orderBy("occurredAt", "asc"),
      limit(100)
    )

    const snap = await getDocs(q)
    if (snap.empty) return { ingested: 0 }

    let ingested = 0
    let maxAt    = lastSync

    snap.forEach(docSnap => {
      const event = { id: docSnap.id, ...docSnap.data() }
      const sig   = ingestFleetFlowEvent(event)
      if (sig) ingested++
      if ((event.occurredAt || 0) > maxAt) maxAt = event.occurredAt
    })

    if (maxAt > lastSync) localStorage.setItem(FF_SYNC_KEY, String(maxAt))

    return { ingested }
  } catch (err) {
    return { ingested: 0, error: err.message }
  }
}
