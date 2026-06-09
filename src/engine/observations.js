// src/engine/observations.js
// Atrium observation layer — what was noticed, preserved, passed forward.

import { fsWrite, fsHydrate } from "./store.js"

const STORE_KEY       = "pacer_observations_v1"
const MAX_OBSERVATIONS = 200

export const OBS_TAGS = ["pattern", "customer", "operations", "financial", "idea", "concern"]

function load() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "[]") }
  catch { return [] }
}

function save(items) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(items)) }
  catch {}
}

export function recordObservation({ content, source = "atrium", tags = [] }) {
  const items = load()
  const item  = {
    id:            `obs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    content,
    source,
    tags,
    createdAt:     Date.now(),
    passedForward: false,
    passedAt:      null,
  }
  save([item, ...items].slice(0, MAX_OBSERVATIONS))
  fsWrite("observations", item.id, item)
  return item
}

export function markPassedForward(id) {
  let updated = null
  const items = load().map(o => {
    if (o.id !== id) return o
    updated = { ...o, passedForward: true, passedAt: Date.now() }
    return updated
  })
  save(items)
  if (updated) fsWrite("observations", id, updated)
  return updated
}

export function getObservations(limit = 20) {
  return load().slice(0, limit)
}

export function hydrateObservations() {
  return fsHydrate("observations", STORE_KEY, { orderField: "createdAt" })
}
