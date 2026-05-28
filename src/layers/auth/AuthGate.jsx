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
      if (err.code === "auth/unauthorized-domain") {
        setError("Domain not authorized. Add this URL to Firebase Console → Authentication → Authorized Domains.")
      } else if (err.code !== "auth/cancelled-popup-request" && err.code !== "auth/popup-closed-by-user") {
        setError("Sign-in error. Try again.")
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
      if (err.code === "auth/unauthorized-domain") {
        setError("Domain not authorized. Add this URL to Firebase Console → Authentication → Authorized Domains.")
      } else {
        setError("Sign-in failed. Try again.")
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
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080810", flexDirection: "column", gap: 20 }}>
      <div style={{ width: 40, height: 40, background: "#00c896", clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)" }} />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: 800, fontSize: "1rem", letterSpacing: "0.2em", color: "#f0f0f8", textTransform: "uppercase", marginBottom: 6 }}>PACER</div>
        <div style={{ fontSize: "0.62rem", color: "#444460", letterSpacing: "0.12em", fontFamily: "monospace" }}>JPG Ventures OS</div>
      </div>
      {error && (
        <div style={{ padding: "9px 14px", borderRadius: 7, fontSize: "0.72rem", color: "#ff6b6b", background: "rgba(255,107,107,0.07)", border: "1px solid rgba(255,107,107,0.2)", maxWidth: 340, textAlign: "center" }}>
          {error}
        </div>
      )}
      <button
        onClick={handleSignIn}
        disabled={loading}
        style={{ padding: "11px 28px", border: "1px solid #00c89640", borderRadius: 8, background: "rgba(0,200,150,0.08)", color: "#00c896", fontFamily: "monospace", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}
      >
        Sign in with Google
      </button>
    </div>
  )
}
