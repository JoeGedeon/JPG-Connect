// src/engine/firebase.js
// Firestore initialization — shared event ledger across devices and apps.
// Uses the same Firebase project as auth.js. Configure via VITE_FIREBASE_* env vars.
// Both FleetFlow and PACER write to the same /pacer_events collection.

import { initializeApp, getApps } from "firebase/app"
import { getFirestore }           from "firebase/firestore"

const cfg = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

// Gracefully degrade if env vars are absent — localStorage remains source of truth.
export const isFirestoreConfigured = !!cfg.apiKey

let _db = null
if (cfg.apiKey) {
  const app = getApps().length ? getApps()[0] : initializeApp(cfg)
  _db = getFirestore(app)
}

export const db = _db
