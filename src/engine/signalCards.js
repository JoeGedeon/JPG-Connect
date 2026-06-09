// src/engine/signalCards.js
// Intelligence artifacts that travel through rooms independently of users.
// A Signal Card is raised in one room and moves until it reaches resolution.

import { fsWrite, fsHydrate } from "./store.js"

const STORE_KEY = "pacer_signal_cards_v1"
const MAX_CARDS = 100

function load() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "[]") }
  catch { return [] }
}

function save(cards) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(cards)) }
  catch {}
}

function nextNumber() {
  const cards = load()
  if (!cards.length) return 1
  return Math.max(...cards.map(c => c.number ?? 0)) + 1
}

export function createSignalCard({ origin, subject, summary = "", confidence = 60, recommendedDestination = null }) {
  const cards = load()
  const card = {
    id:                     crypto.randomUUID(),
    number:                 nextNumber(),
    origin,
    subject,
    summary,
    confidence,
    recommendedDestination,
    currentLocation:        origin,
    trail:                  [],
    status:                 "active",
    createdAt:              Date.now(),
    updatedAt:              Date.now(),
  }
  save([card, ...cards].slice(0, MAX_CARDS))
  fsWrite("signal_cards", card.id, card)
  return card
}

export function moveSignalCard(id, to, reason = "") {
  const cards = load()
  const idx   = cards.findIndex(c => c.id === id)
  if (idx === -1) return null
  const card    = cards[idx]
  const updated = {
    ...card,
    currentLocation: to,
    trail:     [...card.trail, { from: card.currentLocation, to, reason, timestamp: Date.now() }],
    updatedAt: Date.now(),
  }
  cards[idx] = updated
  save(cards)
  fsWrite("signal_cards", id, updated)
  return updated
}

export function updateSignalCardStatus(id, status) {
  const cards = load()
  const idx   = cards.findIndex(c => c.id === id)
  if (idx === -1) return null
  const updated = { ...cards[idx], status, updatedAt: Date.now() }
  cards[idx] = updated
  save(cards)
  fsWrite("signal_cards", id, updated)
  return updated
}

export function getSignalCards({ status, location, limit = 20 } = {}) {
  let cards = load()
  if (status)   cards = cards.filter(c => c.status === status)
  if (location) cards = cards.filter(c => c.currentLocation === location || c.recommendedDestination === location)
  return cards.slice(0, limit)
}

export function getActiveSignalCards(limit = 20) {
  return load().filter(c => c.status === "active").slice(0, limit)
}

export function getSignalCardArrivals(location) {
  return load().filter(c => c.status === "active" && (c.currentLocation === location || c.recommendedDestination === location))
}

export function hydrateSignalCards() {
  return fsHydrate("signal_cards", STORE_KEY, { orderField: "createdAt" })
}
