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
