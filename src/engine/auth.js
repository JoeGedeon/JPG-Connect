// src/engine/auth.js
// Firebase auth with redirect flow for Safari/iOS compatibility

import { initializeApp, getApps } from "firebase/app"
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  indexedDBLocalPersistence,
} from "firebase/auth"

const cfg = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

let _auth = null
let _provider = null

if (cfg.apiKey) {
  const app = getApps().length ? getApps()[0] : initializeApp(cfg)
  _auth = getAuth(app)
  _provider = new GoogleAuthProvider()
  // indexedDBLocalPersistence has better cross-origin support on Safari/iOS than
  // localStorage — the Firebase auth relay page can read IndexedDB across origins
  // where localStorage is restricted by ITP. Surfaces failures rather than hiding them.
  setPersistence(_auth, indexedDBLocalPersistence).catch(err => {
    console.warn("PACER: auth persistence init failed:", err?.code, err?.message)
  })
}

export function isAuthConfigured() { return !!cfg.apiKey }

export function signInWithGoogle() {
  if (!_auth) return Promise.reject(new Error("Firebase not configured"))
  return signInWithRedirect(_auth, _provider)
}

export function checkRedirectResult() {
  if (!_auth) return Promise.resolve(null)
  return getRedirectResult(_auth)
}

export function signOutUser() {
  if (!_auth) return Promise.resolve()
  return signOut(_auth)
}

export function subscribeAuth(callback) {
  if (!_auth) { callback(null); return () => {} }
  return onAuthStateChanged(_auth, callback)
}

export function resetPassword(email) {
  if (!_auth) return Promise.reject(new Error("Firebase not configured"))
  return sendPasswordResetEmail(_auth, email)
}
