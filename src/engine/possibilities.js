// src/engine/possibilities.js
// Possibility artifact storage — MUSE workspace engine

import { fsWrite, fsDelete, fsHydrate } from "./store.js"

const STORE_KEY   = "pacer_possibilities_v1"
const CONTEXT_KEY = "pacer_muse_context_v1"

export const POSSIBILITY_STATUS = {
  EXPLORING:           "exploring",
  ARCHIVED:            "archived",
  PROMOTED_TO_COUNCIL: "promoted_to_council",
  CONNECTED:           "connected",
}

export const STATUS_LABELS = {
  exploring:           "Exploring",
  archived:            "Archived",
  promoted_to_council: "Promoted to Council",
  connected:           "Connected to Project",
}

export const STATUS_COLORS = {
  exploring:           "#ff6b9d",
  archived:            "#5858a0",
  promoted_to_council: "#e0e0f8",
  connected:           "#00c896",
}

function load() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "[]") }
  catch { return [] }
}

function save(items) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(items)) }
  catch {}
}

export function getPossibilities() {
  return load()
}

export function createPossibility({ title, hypothesis = "", confidence = 30, signals = [], fromSignal = null }) {
  const items = load()
  const item = {
    id:         `poss_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title,
    hypothesis,
    confidence,
    signals,
    fromSignal,
    status:     POSSIBILITY_STATUS.EXPLORING,
    createdAt:  Date.now(),
    updatedAt:  Date.now(),
    notes:      "",
  }
  save([item, ...items])
  fsWrite("possibilities", item.id, item)
  return item
}

export function updatePossibility(id, updates) {
  let updated = null
  const items = load().map(p => {
    if (p.id !== id) return p
    updated = { ...p, ...updates, updatedAt: Date.now() }
    return updated
  })
  save(items)
  if (updated) fsWrite("possibilities", id, updated)
}

export function deletePossibility(id) {
  save(load().filter(p => p.id !== id))
  fsDelete("possibilities", id)
}

export function hydratePossibilities() {
  return fsHydrate("possibilities", STORE_KEY, { orderField: "createdAt" })
}

export function getMuseContext() {
  try { return JSON.parse(localStorage.getItem(CONTEXT_KEY) || "null") }
  catch { return null }
}

export function setMuseContext(ctx) {
  try {
    if (ctx) localStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx))
    else     localStorage.removeItem(CONTEXT_KEY)
  } catch {}
}
