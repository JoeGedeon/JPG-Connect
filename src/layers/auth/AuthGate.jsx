// src/layers/auth/AuthGate.jsx
// Firebase auth gate — redirect flow, Safari/iOS compatible

import { useState, useEffect } from "react"
import { signInWithGoogle, checkRedirectResult, subscribeAuth, signOutUser, isAuthConfigured } from "../../engine/auth.js"

export default function AuthGate({ children }) {
  const [user, setUser] = useState(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isAuthConfigured()) { setUser(null); setLoading(false); return }

    checkRedirectResult().catch(err => {
      console.error("PACER auth error (redirect):", err.code, err.message, err)
      if (err.code === "auth/unauthorized-domain") {
        setError(`[${err.code}] Domain not authorized — add this URL to Firebase Console → Authentication → Authorized Domains.`)
      } else if (err.code !== "auth/cancelled-popup-request" && err.code !== "auth/popup-closed-by-user") {
        setError(`[${err.code}] ${err.message}`)
      }
    })

    const unsub = subscribeAuth(u => { setUser(u); setLoading(false) })
    return () => { if (typeof unsub === "function") unsub() }
  }, [])

  async function handleSignIn() {
    setLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      console.error("PACER auth error (sign-in):", err.code, err.message, err)
      if (err.code === "auth/unauthorized-domain") {
        setError(`[${err.code}] Domain not authorized — add this URL to Firebase Console → Authentication → Authorized Domains.`)
      } else {
        setError(`[${err.code}] ${err.message}`)
      }
      setLoading(false)
    }
  }

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080810" }}>
      <div style={{ width: 28, height: 28, border: "2px solid #1a1a2e", borderTopColor: "#00c896", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!isAuthConfigured() || user) return children

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080810", flexDirection: "column", gap: 24 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      <div style={{ width: 44, height: 44, background: "#00c896", clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)" }} />

      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: 700, fontSize: "1.4rem", color: "#e8e8f0", marginBottom: 10 }}>Your memory needs a home.</div>
        <div style={{ fontSize: "0.78rem", color: "#5858a0", lineHeight: 1.6 }}>
          Sign in to establish continuity across devices.<br />
          PACER holds what you declare. Nothing more.
        </div>
      </div>

      {error && (
        <div style={{ padding: "10px 16px", borderRadius: 7, fontSize: "0.7rem", color: "#ff6b6b", background: "rgba(255,107,107,0.07)", border: "1px solid rgba(255,107,107,0.2)", maxWidth: 380, textAlign: "center", fontFamily: "monospace", lineHeight: 1.5 }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSignIn}
        disabled={loading}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 32px", border: "1px solid #222242", borderRadius: 10, background: "#0d0d1e", color: "#e8e8f0", fontSize: "0.88rem", fontWeight: 500, cursor: loading ? "wait" : "pointer", transition: "all 0.2s", minWidth: 240, justifyContent: "center" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#00c89650"; e.currentTarget.style.background = "#0f0f28" }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "#222242"; e.currentTarget.style.background = "#0d0d1e" }}
      >
        {loading
          ? <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid #333", borderTopColor: "#00c896", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          : <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        }
        Continue with Google
      </button>

      <div style={{ position: "absolute", bottom: 24, textAlign: "center", fontSize: "0.56rem", color: "#2a2a40", fontFamily: "monospace", letterSpacing: "0.1em" }}>
        PACER · JPG Systems<br />
        <span style={{ opacity: 0.6 }}>Witness architecture. Not surveillance.</span>
      </div>
    </div>
  )
}
