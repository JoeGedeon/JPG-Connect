// src/layers/muse/MuseLayer.jsx
// MUSE — Possibility Laboratory. Not a chat window.
// Answers: What if? Creates and tracks Possibility artifacts.

import { useState, useEffect } from "react"
import {
  getPossibilities,
  createPossibility,
  updatePossibility,
  deletePossibility,
  getMuseContext,
  setMuseContext,
  POSSIBILITY_STATUS,
  STATUS_LABELS,
  STATUS_COLORS,
} from "../../engine/possibilities.js"
import { STARTERS }                                          from "../../config/lanes.js"
import { subscribeAtriumSignals, markAtriumSignalReviewed } from "../../engine/atriumBridge.js"

const museColor = "#ff6b9d"

export default function MuseLayer() {
  const [possibilities, setPossibilities] = useState(() => getPossibilities())
  const [incomingCtx, setIncomingCtx]     = useState(() => getMuseContext())
  const [creating, setCreating]           = useState(false)
  const [form, setForm]                   = useState({ title: "", hypothesis: "", confidence: 30 })
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    if (incomingCtx) setCreating(true)
  }, [])

  useEffect(() => {
    return subscribeAtriumSignals(setAtriumSignals)
  }, [])

  function refresh() { setPossibilities(getPossibilities()) }

  function handleCreate() {
    if (!form.title.trim()) return
    createPossibility({
      title:      form.title,
      hypothesis: form.hypothesis,
      confidence: form.confidence,
      signals:    incomingCtx?.signals || [],
      fromSignal: incomingCtx,
    })
    setIncomingCtx(null)
    setMuseContext(null)
    setCreating(false)
    setForm({ title: "", hypothesis: "", confidence: 30 })
    refresh()
  }

  function handleStatus(id, status) {
    updatePossibility(id, { status })
    refresh()
  }

  function handleDelete(id) {
    deletePossibility(id)
    refresh()
  }

  function dismissContext() {
    setIncomingCtx(null)
    setMuseContext(null)
    setCreating(false)
  }

  function openWithStarter(hypothesis) {
    setForm(f => ({ ...f, hypothesis }))
    setCreating(true)
  }

  const active   = possibilities.filter(p => p.status === POSSIBILITY_STATUS.EXPLORING)
  const archived = possibilities.filter(p => p.status !== POSSIBILITY_STATUS.EXPLORING)

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", padding: "48px 48px 40px" }}>

      {/* Header */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: "2.1rem", fontWeight: 200, letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--fg)", lineHeight: 1, fontFamily: "monospace" }}>
          MUSE
        </div>
      </div>
      <div style={{ marginBottom: 36, animation: "fadeUp 0.5s ease both" }}>
        <div style={{ fontSize: "0.46rem", fontFamily: "monospace", letterSpacing: "0.14em", color: "var(--fg-3)", marginTop: 9, marginBottom: 5 }}>
          Meaning Under Strategic Emergence
        </div>
        <div style={{ fontSize: "0.38rem", fontFamily: "monospace", letterSpacing: "0.26em", textTransform: "uppercase", color: "var(--fg-4)" }}>
          Possibility Laboratory
        </div>
      </div>

      {/* Incoming signal context banner */}
      {incomingCtx && (
        <div style={{ marginBottom: 24, padding: "14px 16px", borderRadius: 9, background: museColor + "10", border: `1px solid ${museColor}30`, animation: "fadeUp 0.3s ease" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: museColor }}>
              ◈ Signal from Council
            </div>
            <button onClick={dismissContext} style={{ background: "none", border: "none", color: "var(--fg-4)", cursor: "pointer", fontSize: "0.62rem", padding: "0 2px", lineHeight: 1 }}>✕</button>
          </div>
          {incomingCtx.summary && (
            <div style={{ fontSize: "0.7rem", fontStyle: "italic", color: "var(--fg-2)", lineHeight: 1.6, marginBottom: incomingCtx.signals?.length ? 10 : 0 }}>
              {incomingCtx.summary}
            </div>
          )}
          {incomingCtx.signals?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
              {incomingCtx.signals.map((s, i) => (
                <span key={i} style={{ padding: "2px 8px", borderRadius: 4, background: museColor + "20", fontSize: "0.46rem", fontFamily: "monospace", color: museColor + "cc" }}>{s}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Atrium Signals — creative observations from the sister building */}
      {atriumSignals.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "#5bafd6", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "#5bafd6", boxShadow: "0 0 5px #5bafd6", animation: "pulse 2s ease-in-out infinite" }} />
            From Atrium · {atriumSignals.length} pending
          </div>
          {atriumSignals.map(sig => (
            <div key={sig.id} style={{
              marginBottom: 7, padding: "12px 14px",
              borderRadius: 8, background: "rgba(91,175,214,0.05)",
              border: "1px solid rgba(91,175,214,0.18)",
              animation: "fadeUp 0.3s ease",
            }}>
              <div style={{ fontSize: "0.7rem", color: "var(--fg-2)", lineHeight: 1.55, marginBottom: 10 }}>
                {sig.text}
              </div>
              {sig.project && (
                <div style={{ fontSize: "0.44rem", fontFamily: "monospace", color: "var(--fg-4)", marginBottom: 8 }}>{sig.project}</div>
              )}
              <div style={{ display: "flex", gap: 7 }}>
                <button
                  onClick={() => {
                    setForm(f => ({ ...f, hypothesis: sig.text, title: sig.text.slice(0, 48) }))
                    setCreating(true)
                    markAtriumSignalReviewed(sig.id)
                  }}
                  style={{
                    padding: "4px 12px", borderRadius: 5,
                    border: `1px solid ${museColor}40`, background: museColor + "10",
                    color: museColor, fontSize: "0.52rem", fontFamily: "monospace",
                    fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer", transition: "all 0.12s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = museColor + "22" }}
                  onMouseLeave={e => { e.currentTarget.style.background = museColor + "10" }}
                >
                  Open as Possibility →
                </button>
                <button
                  onClick={() => markAtriumSignalReviewed(sig.id)}
                  style={{
                    padding: "4px 10px", borderRadius: 5,
                    border: "1px solid var(--border-lo)", background: "transparent",
                    color: "var(--fg-4)", fontSize: "0.52rem", fontFamily: "monospace",
                    cursor: "pointer", transition: "all 0.12s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = "var(--fg-2)" }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--fg-4)" }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create form or New Possibility button */}
      {!creating ? (
        <div style={{ marginBottom: 28 }}>
          <button
            onClick={() => setCreating(true)}
            style={{
              padding: "9px 18px",
              borderRadius: 7,
              border: `1px solid ${museColor}40`,
              background: museColor + "10",
              color: museColor,
              fontSize: "0.62rem",
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = museColor + "20"; e.currentTarget.style.borderColor = museColor + "60" }}
            onMouseLeave={e => { e.currentTarget.style.background = museColor + "10"; e.currentTarget.style.borderColor = museColor + "40" }}
          >
            + New Possibility
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: 28, padding: "16px 18px", borderRadius: 9, background: "var(--bg-card)", border: `1px solid ${museColor}30`, animation: "fadeUp 0.25s ease" }}>
          <div style={{ fontSize: "0.5rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: museColor, marginBottom: 14 }}>
            Open a Possibility
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: "0.42rem", fontFamily: "monospace", color: "var(--fg-4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>title</div>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="What is the possibility called?"
              autoFocus
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "var(--bg-input)",
                color: "var(--fg)",
                fontSize: "0.78rem",
                fontFamily: "inherit",
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: "0.42rem", fontFamily: "monospace", color: "var(--fg-4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>hypothesis</div>
            <textarea
              value={form.hypothesis}
              onChange={e => setForm(f => ({ ...f, hypothesis: e.target.value }))}
              placeholder="What if… (state the idea as an invitation, not a conclusion)"
              rows={3}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "var(--bg-input)",
                color: "var(--fg)",
                fontSize: "0.78rem",
                fontFamily: "inherit",
                outline: "none",
                resize: "vertical",
                lineHeight: 1.6,
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: "0.42rem", fontFamily: "monospace", color: "var(--fg-4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>
              initial confidence — {form.confidence}%
            </div>
            <input
              type="range"
              min={5}
              max={95}
              step={5}
              value={form.confidence}
              onChange={e => setForm(f => ({ ...f, confidence: Number(e.target.value) }))}
              style={{ width: "100%", accentColor: museColor }}
            />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleCreate}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: `1px solid ${museColor}50`,
                background: museColor + "15",
                color: museColor,
                fontSize: "0.62rem",
                fontFamily: "monospace",
                fontWeight: 700,
                letterSpacing: "0.1em",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = museColor + "28" }}
              onMouseLeave={e => { e.currentTarget.style.background = museColor + "15" }}
            >
              Open →
            </button>
            <button
              onClick={() => { setCreating(false); setForm({ title: "", hypothesis: "", confidence: 30 }); dismissContext() }}
              style={{
                padding: "8px 14px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--fg-4)",
                fontSize: "0.62rem",
                fontFamily: "monospace",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active possibilities */}
      {active.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 14 }}>
            Exploring · {active.length}
          </div>
          {active.map(p => (
            <PossibilityCard
              key={p.id}
              possibility={p}
              expanded={expandedId === p.id}
              onExpand={() => setExpandedId(expandedId === p.id ? null : p.id)}
              onStatus={status => handleStatus(p.id, status)}
              onDelete={() => handleDelete(p.id)}
              onUpdateNotes={notes => { updatePossibility(p.id, { notes }); refresh() }}
            />
          ))}
        </div>
      )}

      {/* Empty state with starters */}
      {active.length === 0 && !creating && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ padding: "24px 20px", borderRadius: 9, border: "1px solid var(--border-lo)", background: "var(--bg-card)", textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: "0.72rem", fontStyle: "italic", color: "var(--fg-4)", lineHeight: 1.8, marginBottom: 6 }}>
              No possibilities open.
            </div>
            <div style={{ fontSize: "0.58rem", color: "var(--fg-4)" }}>
              Something will surface. Or open one yourself.
            </div>
          </div>
          <div style={{ fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 10 }}>
            What if…
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(STARTERS.muse || []).map((s, i) => (
              <div
                key={i}
                onClick={() => openWithStarter(s)}
                style={{
                  padding: "9px 13px",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  fontSize: "0.74rem",
                  color: "var(--fg-3)",
                  cursor: "pointer",
                  background: "var(--bg-card)",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = museColor; e.currentTarget.style.color = "var(--fg)"; e.currentTarget.style.background = "rgba(255,107,157,0.06)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--fg-3)"; e.currentTarget.style.background = "var(--bg-card)" }}
              >
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Archived */}
      {archived.length > 0 && (
        <div>
          <div style={{ fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 14 }}>
            Archive · {archived.length}
          </div>
          {archived.map(p => (
            <PossibilityCard
              key={p.id}
              possibility={p}
              expanded={expandedId === p.id}
              onExpand={() => setExpandedId(expandedId === p.id ? null : p.id)}
              onStatus={status => handleStatus(p.id, status)}
              onDelete={() => handleDelete(p.id)}
              onUpdateNotes={notes => { updatePossibility(p.id, { notes }); refresh() }}
            />
          ))}
        </div>
      )}

    </div>
  )
}

function PossibilityCard({ possibility: p, expanded, onExpand, onStatus, onDelete, onUpdateNotes }) {
  const color        = STATUS_COLORS[p.status] || museColor
  const [editNotes, setEditNotes]   = useState(false)
  const [draftNotes, setDraftNotes] = useState(p.notes || "")

  const statusOptions = [
    { key: POSSIBILITY_STATUS.EXPLORING,           label: "Exploring",    color: museColor },
    { key: POSSIBILITY_STATUS.ARCHIVED,            label: "Archive",      color: "#5858a0" },
    { key: POSSIBILITY_STATUS.PROMOTED_TO_COUNCIL, label: "→ Council", color: "#e0e0f8" },
    { key: POSSIBILITY_STATUS.CONNECTED,           label: "→ Project", color: "#00c896" },
  ]

  return (
    <div style={{
      marginBottom: 8,
      padding: "13px 15px",
      borderRadius: 8,
      background: "var(--bg-card)",
      border: `1px solid ${color}20`,
      borderLeft: `2px solid ${color}70`,
      transition: "all 0.15s",
    }}>

      {/* Top row — always visible */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }} onClick={onExpand}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--fg-2)", lineHeight: 1.3, marginBottom: 4 }}>{p.title}</div>
          {p.hypothesis && (
            <div style={{ fontSize: "0.62rem", fontStyle: "italic", color: "var(--fg-3)", lineHeight: 1.5 }}>
              {p.hypothesis.slice(0, 120)}{p.hypothesis.length > 120 ? "…" : ""}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
          <div style={{ padding: "2px 8px", borderRadius: 4, background: color + "20", border: `1px solid ${color}40`, fontSize: "0.44rem", fontFamily: "monospace", color, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
            {STATUS_LABELS[p.status]}
          </div>
          <div style={{ padding: "2px 8px", borderRadius: 4, background: museColor + "15", fontSize: "0.44rem", fontFamily: "monospace", color: museColor, fontWeight: 700 }}>
            {p.confidence}%
          </div>
        </div>
      </div>

      {p.signals?.length > 0 && (
        <div style={{ marginTop: 7 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, background: museColor + "15", fontSize: "0.44rem", fontFamily: "monospace", color: museColor + "cc" }}>
            {p.signals.length} supporting signal{p.signals.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Expanded */}
      {expanded && (
        <div style={{ marginTop: 14, animation: "fadeUp 0.15s ease" }}>
          <div style={{ height: 1, background: "var(--border-lo)", marginBottom: 12 }} />

          {p.hypothesis && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 5 }}>hypothesis</div>
              <div style={{ fontSize: "0.68rem", fontStyle: "italic", color: "var(--fg-2)", lineHeight: 1.7 }}>{p.hypothesis}</div>
            </div>
          )}

          {p.signals?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 5 }}>supporting signals</div>
              {p.signals.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start", marginBottom: 3 }}>
                  <div style={{ width: 3, height: 3, borderRadius: "50%", background: museColor, marginTop: 8, flexShrink: 0 }} />
                  <div style={{ fontSize: "0.64rem", color: "var(--fg-3)", lineHeight: 1.4 }}>{s}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 5 }}>notes</div>
            {editNotes ? (
              <div>
                <textarea
                  value={draftNotes}
                  onChange={e => setDraftNotes(e.target.value)}
                  rows={3}
                  autoFocus
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 5, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--fg)", fontSize: "0.68rem", fontFamily: "inherit", outline: "none", resize: "vertical", lineHeight: 1.6 }}
                />
                <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
                  <button
                    onClick={() => { onUpdateNotes(draftNotes); setEditNotes(false) }}
                    style={{ padding: "4px 10px", borderRadius: 4, border: `1px solid ${museColor}40`, background: museColor + "10", color: museColor, fontSize: "0.54rem", fontFamily: "monospace", cursor: "pointer" }}>
                    Save
                  </button>
                  <button
                    onClick={() => { setDraftNotes(p.notes || ""); setEditNotes(false) }}
                    style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid var(--border)", background: "transparent", color: "var(--fg-4)", fontSize: "0.54rem", fontFamily: "monospace", cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div onClick={() => setEditNotes(true)} style={{ cursor: "text", minHeight: 24 }}>
                {p.notes ? (
                  <div style={{ fontSize: "0.66rem", color: "var(--fg-3)", lineHeight: 1.6 }}>{p.notes}</div>
                ) : (
                  <div style={{ fontSize: "0.62rem", color: "var(--fg-4)", fontStyle: "italic" }}>Click to add notes…</div>
                )}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 7 }}>move to</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {statusOptions.filter(s => s.key !== p.status).map(s => (
                <button
                  key={s.key}
                  onClick={() => onStatus(s.key)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 4,
                    border: `1px solid ${s.color}30`,
                    background: s.color + "10",
                    color: s.color,
                    fontSize: "0.52rem",
                    fontFamily: "monospace",
                    cursor: "pointer",
                    transition: "all 0.12s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = s.color + "22" }}
                  onMouseLeave={e => { e.currentTarget.style.background = s.color + "10" }}
                >
                  {s.label}
                </button>
              ))}
              <button
                onClick={onDelete}
                style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid rgba(255,107,107,0.2)", background: "rgba(255,107,107,0.06)", color: "#ff6b6b60", fontSize: "0.52rem", fontFamily: "monospace", cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#ff6b6b"; e.currentTarget.style.background = "rgba(255,107,107,0.12)" }}
                onMouseLeave={e => { e.currentTarget.style.color = "#ff6b6b60"; e.currentTarget.style.background = "rgba(255,107,107,0.06)" }}
              >
                Delete
              </button>
            </div>
          </div>

          <div style={{ fontSize: "0.42rem", fontFamily: "monospace", color: "var(--fg-4)", letterSpacing: "0.06em" }}>
            opened {new Date(p.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
          </div>
        </div>
      )}
    </div>
  )
}
