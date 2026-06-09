// src/engine/store.js
// Dual-write layer: localStorage is always source of truth for sync reads.
// Firestore writes happen in background — never block the UI.
// On hydration, Firestore overwrites localStorage if the user has server data.

import { db, isFirestoreConfigured } from "./firebase.js"
import {
  collection, doc, setDoc, deleteDoc,
  getDocs, query, orderBy, limit as firestoreLimit,
} from "firebase/firestore"
import { getAuth } from "firebase/auth"

function currentUid() {
  return getAuth().currentUser?.uid ?? null
}

export function fsWrite(collectionName, id, data) {
  if (!isFirestoreConfigured) return
  const uid = currentUid()
  if (!uid) return
  const { _uid: _1, _synced: _2, ...clean } = data
  setDoc(
    doc(db, "users", uid, collectionName, id),
    { ...clean, _uid: uid, _synced: Date.now() }
  ).catch(() => {})
}

export function fsDelete(collectionName, id) {
  if (!isFirestoreConfigured) return
  const uid = currentUid()
  if (!uid) return
  deleteDoc(doc(db, "users", uid, collectionName, id)).catch(() => {})
}

export async function fsHydrate(collectionName, storageKey, {
  orderField = "createdAt",
  maxItems   = 200,
} = {}) {
  if (!isFirestoreConfigured) return false
  const uid = currentUid()
  if (!uid) return false
  try {
    const col  = collection(db, "users", uid, collectionName)
    const q    = query(col, orderBy(orderField, "desc"), firestoreLimit(maxItems))
    const snap = await getDocs(q)
    if (snap.empty) return false
    const items = snap.docs.map(d => {
      const { _uid, _synced, ...rest } = d.data()
      return rest
    })
    localStorage.setItem(storageKey, JSON.stringify(items))
    return true
  } catch {
    return false
  }
}
