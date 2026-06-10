// src/engine/auth.js
// Firebase auth — popup-first flow for Safari/iOS compatibility
//
// signInWithRedirect uses a cross-origin relay page (pacer-flow.firebaseapp.com)
// that stores pending OAuth state in IndexedDB. Safari ITP clears cross-origin
// IndexedDB during the redirect hop, so getRedirectResult finds nothing on return.
//
// signInWithPopup opens OAuth in a new tab instead. No relay page, no cross-origin
// storage, no ITP interference. Falls back to redirect if the popup is blocked.

import { initializeApp, getApps } from "firebase/app"
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
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
}

export function isAuthConfigured() { return !!cfg.apiKey }

export async function signInWithGoogle() {
  if (!_auth) return Promise.reject(new Error("Firebase not configured"))
  try {
    // Popup opens as a new tab — no relay page, no cross-origin storage hop.
    return await signInWithPopup(_auth, _provider)
  } catch (err) {
    if (err.code === "auth/popup-blocked" || err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
      // Fall back to redirect if popup was blocked or dismissed.
      console.warn("PACER: popup blocked or closed, falling back to redirect:", err.code)
      return signInWithRedirect(_auth, _provider)
    }
    throw err
  }
}

export function checkRedirectResult() {
  if (!_auth) return Promise.resolve(null)
  // Still called on page load to handle the redirect fallback path.
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
