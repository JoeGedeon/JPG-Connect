// src/engine/atriumBridge.js
// Campus bridge — PACER side.
// Reads atrium_signals written by jarvis-ip.
// PACER does not absorb buildings. PACER connects them.

import { db }                                 from "./firebase.js"
import { getAuth }                            from "firebase/auth"
import { collection, query, where, orderBy,
         limit, onSnapshot, doc, updateDoc }  from "firebase/firestore"

export const ATRIUM_URL = import.meta.env.VITE_ATRIUM_URL || ""

// Build the URL for navigating to the Atrium building with context attached.
export function buildAtriumURL(sourceRoom) {
  if (!ATRIUM_URL) return null
  const uid = getAuth().currentUser?.uid || null
  const url = new URL(ATRIUM_URL)
  if (uid)        url.searchParams.set("userId",     uid)
  if (sourceRoom) url.searchParams.set("sourceRoom", sourceRoom)
  url.searchParams.set("from", "pacer")
  return url.toString()
}

// Read incoming URL params set by the Atrium when it navigates back to PACER.
export function getAtriumReturnContext() {
  const p = new URLSearchParams(window.location.search)
  if (p.get("from") !== "atrium") return null
  return {
    from:       p.get("from"),
    sourceRoom: p.get("sourceRoom") || null,
  }
}

// Subscribe to pending atrium signals for MUSE.
// Calls callback with array of { id, text, project, destination, createdAt, createdBy, status }
// Returns unsubscribe function.
export function subscribeAtriumSignals(callback) {
  if (!db) { callback([]); return () => {} }
  const q = query(
    collection(db, "atrium_signals"),
    where("status", "==", "pending_review"),
    orderBy("createdAt", "desc"),
    limit(10)
  )
  return onSnapshot(q,
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    ()   => callback([])
  )
}

// Mark an atrium signal as reviewed (remove it from the pending queue).
export async function markAtriumSignalReviewed(signalId) {
  if (!db) return
  await updateDoc(doc(db, "atrium_signals", signalId), { status: "reviewed" })
}
