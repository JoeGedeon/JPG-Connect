// src/layers/auth/AuthGate.jsx
// Firebase auth gate — Google redirect + email/password + forgot password

import { useState, useEffect } from "react"
import {
  signInWithGoogle,
  checkRedirectResult,
  subscribeAuth,
  signOutUser,
  isAuthConfigured,
  signInWithEmail,
  createAccount,
  sendPasswordReset,
} from "../../engine/auth.js"

const S = {
  bg:     "#080810",
  panel:  "#0d0d1e",
  card:   "#111128",
  border: "#222242",
  fg:     "#e8e8f0",
  fg2:    "#9898cc",
  fg4:    "#3c3c70",
  green:  "#00c896",
  red:    "#ff6b6b",
}

function Spinner({ size = 18, color = S.green }) {
  return (
    <span style={{
      display: "inline-block",
      width: size, height: size,
      border: `2px solid ${color}30`,
      borderTopColor: color,
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
      flexShrink: 0,
    }} />
  )
}

export default function AuthGate({ children }) {
  const [user, setUser]               = useState(undefined)
  const [loading, setLoading]         = useState(true)
  const [authStatus, setAuthStatus]   = useState("Loading...")
  const [error, setError]             = useState(null)

  const [mode, setMode]               = useState("signin")  // "signin" | "create" | "reset"
  const [email, setEmail]             = useState("")
  const [password, setPassword]       = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [resetSent, setResetSent]     = useState(false)

  useEffect(() => {
    if (!isAuthConfigured()) { setUser(null); setLoading(false); return }

    // Detect redirect return and show meaningful status
    const pending = sessionStorage.getItem("pacer_auth_pending")
    if (pending === "google") {
      setAuthStatus("Authenticating with Google...")
      sessionStorage.removeItem("pacer_auth_pending")
    } else {
      setAuthStatus("Checking session...")
    }

    checkRedirectResult().catch(err => {
      console.error("PACER auth error (redirect):", err.code, err.message, err)
      if (err.code === "auth/unauthorized-domain") {
        setError(`[${err.code}] Domain not authorized — add "${window.location.hostname}" to Firebase Console → Authentication → Authorized Domains.`)
      } else if (err.code !== "auth/cancelled-popup-request" && err.code !== "auth/popup-closed-by-user") {
        setError(`[${err.code}] ${err.message}`)
      }
    })

    const unsub = subscribeAuth(u => { setUser(u); setLoading(false) })
    return () => { if (typeof unsub === "function") unsub() }
  }, [])

  async function handleGoogle() {
    setSubmitting(true)
    setError(null)
    try {
      await signInWithGoogle()  // navigates away; sessionStorage flag set inside
    } catch (err) {
      console.error("PACER auth error (sign-in):", err.code, err.message, err)
      setError(err.code === "auth/unauthorized-domain"
        ? `[${err.code}] Domain not authorized — add "${window.location.hostname}" to Firebase Console → Authentication → Authorized Domains.`
        : `[${err.code}] ${err.message}`)
      setSubmitting(false)
    }
  }

  async function handleEmailSignIn(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await signInWithEmail(email, password)
      // onAuthStateChanged will fire and set user
    } catch (err) {
      setError(friendlyError(err.code))
      setSubmitting(false)
    }
  }

  async function handleCreateAccount(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await createAccount(email, password)
    } catch (err) {
      setError(friendlyError(err.code))
      setSubmitting(false)
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await sendPasswordReset(email)
      setResetSent(true)
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setSubmitting(false)
    }
  }

  function switchMode(next) {
    setMode(next)
    setError(null)
    setResetSent(false)
    setPassword("")
    setShowPassword(false)
  }

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: S.bg, gap: 14 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <Spinner size={28} />
      <div style={{ fontSize: "0.65rem", color: S.fg4, fontFamily: "monospace", letterSpacing: "0.1em" }}>{authStatus}</div>
    </div>
  )

  if (!isAuthConfigured() || user) return children

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: S.bg, flexDirection: "column", gap: 20, padding: "0 20px" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      <div style={{ width: 44, height: 44, background: S.green, clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)" }} />

      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: 700, fontSize: "1.4rem", color: S.fg, marginBottom: 8 }}>
          {mode === "reset" ? "Reset your password" : "Your memory needs a home."}
        </div>
        <div style={{ fontSize: "0.74rem", color: S.fg4, lineHeight: 1.6 }}>
          {mode === "create"
            ? "Create an account to establish continuity."
            : mode === "reset"
            ? "Enter your email and we’ll send a reset link."
            : "Sign in to establish continuity across devices."}
        </div>
      </div>

      {error && (
        <div style={{ padding: "10px 16px", borderRadius: 7, fontSize: "0.68rem", color: S.red, background: "rgba(255,107,107,0.07)", border: `1px solid rgba(255,107,107,0.2)`, maxWidth: 380, width: "100%", textAlign: "center", fontFamily: "monospace", lineHeight: 1.5 }}>
          {error}
        </div>
      )}

      <div style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", gap: 10 }}>

        {/* Google sign-in — only on signin mode */}
        {mode === "signin" && (
          <>
            <button
              onClick={handleGoogle}
              disabled={submitting}
              style={btn(submitting)}
              onMouseEnter={e => hoverIn(e)}
              onMouseLeave={e => hoverOut(e)}
            >
              {submitting
                ? <Spinner />
                : <GoogleIcon />
              }
              Continue with Google
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "2px 0" }}>
              <div style={{ flex: 1, height: 1, background: S.border }} />
              <div style={{ fontSize: "0.58rem", color: S.fg4, fontFamily: "monospace" }}>or</div>
              <div style={{ flex: 1, height: 1, background: S.border }} />
            </div>
          </>
        )}

        {/* Email / password form */}
        {mode !== "reset" && (
          <form onSubmit={mode === "create" ? handleCreateAccount : handleEmailSignIn} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={input()}
              onFocus={e => { e.target.style.borderColor = S.green + "60" }}
              onBlur={e => { e.target.style.borderColor = S.border }}
            />
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ ...input(), paddingRight: 40 }}
                onFocus={e => { e.target.style.borderColor = S.green + "60" }}
                onBlur={e => { e.target.style.borderColor = S.border }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: S.fg4, fontSize: "0.8rem", padding: "0 2px", lineHeight: 1 }}
                tabIndex={-1}
              >
                {showPassword ? "●" : "○"}
              </button>
            </div>
            <button
              type="submit"
              disabled={submitting}
              style={{ ...btn(submitting), background: S.green + "18", borderColor: S.green + "50", color: S.green, marginTop: 2 }}
              onMouseEnter={e => { e.currentTarget.style.background = S.green + "28" }}
              onMouseLeave={e => { e.currentTarget.style.background = S.green + "18" }}
            >
              {submitting ? <Spinner color={S.green} /> : null}
              {mode === "create" ? "Create Account" : "Sign In"}
            </button>
          </form>
        )}

        {/* Reset password form */}
        {mode === "reset" && (
          resetSent
            ? (
              <div style={{ textAlign: "center", padding: "16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: "0.78rem", color: S.green, fontWeight: 600 }}>Reset link sent.</div>
                <div style={{ fontSize: "0.68rem", color: S.fg2, lineHeight: 1.6 }}>Check your inbox and follow the instructions.</div>
                <button onClick={() => switchMode("signin")} style={link()}>Back to Sign In</button>
              </div>
            ) : (
              <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={input()}
                  onFocus={e => { e.target.style.borderColor = S.green + "60" }}
                  onBlur={e => { e.target.style.borderColor = S.border }}
                />
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ ...btn(submitting), background: S.green + "18", borderColor: S.green + "50", color: S.green }}
                  onMouseEnter={e => { e.currentTarget.style.background = S.green + "28" }}
                  onMouseLeave={e => { e.currentTarget.style.background = S.green + "18" }}
                >
                  {submitting ? <Spinner color={S.green} /> : null}
                  Send Reset Link
                </button>
              </form>
            )
        )}

        {/* Mode links */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          {mode === "signin" && (
            <>
              <button onClick={() => switchMode("reset")} style={link()}>Forgot Password?</button>
              <button onClick={() => switchMode("create")} style={link()}>Create Account</button>
            </>
          )}
          {mode === "create" && (
            <button onClick={() => switchMode("signin")} style={{ ...link(), margin: "0 auto" }}>Sign In instead</button>
          )}
          {mode === "reset" && !resetSent && (
            <button onClick={() => switchMode("signin")} style={{ ...link(), margin: "0 auto" }}>Back to Sign In</button>
          )}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 24, textAlign: "center", fontSize: "0.54rem", color: "#2a2a40", fontFamily: "monospace", letterSpacing: "0.1em" }}>
        PACER · JPG Systems<br />
        <span style={{ opacity: 0.6 }}>Witness architecture. Not surveillance.</span>
      </div>
    </div>
  )
}

// ── Style helpers ─────────────────────────────────────────────────────────────────

function btn(disabled) {
  return {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    padding: "13px 20px",
    width: "100%",
    border: `1px solid #222242`,
    borderRadius: 10,
    background: "#0d0d1e",
    color: "#e8e8f0",
    fontSize: "0.86rem",
    fontWeight: 500,
    cursor: disabled ? "wait" : "pointer",
    transition: "all 0.2s",
    opacity: disabled ? 0.7 : 1,
  }
}

function input() {
  return {
    width: "100%",
    padding: "11px 14px",
    border: "1px solid #222242",
    borderRadius: 8,
    background: "#0f0f22",
    color: "#e8e8f0",
    fontSize: "0.86rem",
    outline: "none",
    transition: "border-color 0.15s",
    boxSizing: "border-box",
  }
}

function link() {
  return {
    background: "none",
    border: "none",
    color: "#5858a0",
    fontSize: "0.66rem",
    fontFamily: "monospace",
    cursor: "pointer",
    padding: "2px 0",
    textDecoration: "none",
    transition: "color 0.15s",
  }
}

function hoverIn(e) { e.currentTarget.style.borderColor = "#00c89650"; e.currentTarget.style.background = "#0f0f28" }
function hoverOut(e) { e.currentTarget.style.borderColor = "#222242"; e.currentTarget.style.background = "#0d0d1e" }

function friendlyError(code) {
  if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential")
    return "Email or password is incorrect."
  if (code === "auth/email-already-in-use")
    return "An account with this email already exists."
  if (code === "auth/weak-password")
    return "Password must be at least 6 characters."
  if (code === "auth/invalid-email")
    return "Please enter a valid email address."
  if (code === "auth/too-many-requests")
    return "Too many attempts. Please wait a moment and try again."
  if (code === "auth/unauthorized-domain")
    return `Domain not authorized — add “${window.location.hostname}” to Firebase Console → Authentication → Authorized Domains.`
  return `Authentication error. [${code}]`
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}
