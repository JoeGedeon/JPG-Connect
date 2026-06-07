// src/components/EventCapture.jsx
// Quick-capture panel for recording a real-world event into the Event Ledger.
// Events are immutable once written. No editing. Corrections become new events.

import { useState } from "react"
import { createEvent, EVENT_TYPES, EVENT_TYPE_LABELS, getSubscribers, ATTACHMENT_TYPES } from "../engine/events.js"

const ROOM_COLORS = {
  archivist: "#c8955a",
  opscore:   "#5a9bc8",
  kel:       "#7bc85a",
  kodex:     "#b55ac8",
}

const TYPE_GROUPS = [
  {
    label: "Operations",
    types: [
      EVENT_TYPES.EQUIPMENT_PURCHASE,
      EVENT_TYPES.JOB_COMPLETED,
      EVENT_TYPES.JOB_CREATED,
      EVENT_TYPES.INVOICE_PAID,
      EVENT_TYPES.INVOICE_RECOVERED,
      EVENT_TYPES.EXPENSE_RECORDED,
      EVENT_TYPES.CLIENT_SIGNED,
      EVENT_TYPES.REVENUE_RECOVERED,
    ],
  },
  {
    label: "Creative",
    types: [
      EVENT_TYPES.CHAPTER_PUBLISHED,
      EVENT_TYPES.SONG_RELEASED,
      EVENT_TYPES.FEATURE_LAUNCHED,
      EVENT_TYPES.IDEA_DECLARED,
    ],
  },
  {
    label: "Governance",
    types: [
      EVENT_TYPES.MILESTONE_REACHED,
      EVENT_TYPES.GOAL_CREATED,
      EVENT_TYPES.GOAL_ACHIEVED,
      EVENT_TYPES.DECLARATION_CREATED,
    ],
  },
  {
    label: "Evidence",
    types: [
      EVENT_TYPES.PHOTO_CAPTURED,
      EVENT_TYPES.VOICE_NOTE,
      EVENT_TYPES.DOCUMENT_FILED,
      EVENT_TYPES.SIGNATURE_CAPTURED,
    ],
  },
  {
    label: "Outcomes",
    types: [
      EVENT_TYPES.CLAIM_FILED,
      EVENT_TYPES.CLAIM_RESOLVED,
      EVENT_TYPES.CHARGEBACK,
      EVENT_TYPES.INVOICE_WRITTEN_OFF,
      EVENT_TYPES.CUSTOMER_DISPUTE,
      EVENT_TYPES.CUSTOMER_COMPLAINT,
      EVENT_TYPES.LEGAL_REQUEST,
    ],
  },
  {
    label: "Incidents",
    types: [
      EVENT_TYPES.INCIDENT_CREATED,
      EVENT_TYPES.INCIDENT_RESOLVED,
    ],
  },
  {
    label: "Other",
    types: [
      EVENT_TYPES.MEETING_COMPLETED,
      EVENT_TYPES.CORRECTION,
      EVENT_TYPES.MANUAL,
    ],
  },
]

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

const inputStyle = {
  width: "100%",
  padding: "7px 9px",
  borderRadius: 5,
  border: "1px solid #1d1d38",
  background: "#07070f",
  color: "var(--fg)",
  fontSize: "0.7rem",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
}

const labelStyle = {
  fontSize: "0.4rem",
  fontFamily: "monospace",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--fg-4)",
  marginBottom: 4,
}

export default function EventCapture({ onDismiss, onRecorded }) {
  const [type, setType]         = useState(EVENT_TYPES.MANUAL)
  const [date, setDate]         = useState(todayIso())
  const [description, setDesc]  = useState("")
  const [note, setNote]         = useState("")
  const [committedBy, setCommittedBy] = useState("")
  const [commitReason, setCommitReason] = useState("")
  const [groupOpen, setGroupOpen] = useState("Operations")
  const [attachments, setAttachments] = useState([])
  const [attOpen, setAttOpen]   = useState(false)

  const canSubmit = description.trim().length > 0

  function addAttachment(attachType) {
    setAttachments(prev => [...prev, { type: attachType, url: "", caption: "" }])
    setAttOpen(true)
  }
  function updateAttachment(i, field, value) {
    setAttachments(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a))
  }
  function removeAttachment(i) {
    setAttachments(prev => prev.filter((_, idx) => idx !== i))
  }

  const subscribers = getSubscribers(type)

  function handleSubmit() {
    if (!canSubmit) return
    const occurredAt = new Date(date).getTime() || Date.now()
    const entities = committedBy.trim()
      ? [{ type: "approved_by", value: committedBy.trim(), reason: commitReason.trim() || null }]
      : []
    const cleanAttachments = attachments.filter(a => a.url.trim())
    createEvent({ type, occurredAt, description, note, entities, attachments: cleanAttachments })
    onRecorded?.()
    onDismiss()
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit()
    if (e.key === "Escape") onDismiss()
  }

  return (
    <div
      onKeyDown={handleKeyDown}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={e => { if (e.target === e.currentTarget) onDismiss() }}
    >
      <div style={{
        width: 420,
        maxHeight: "88vh",
        overflowY: "auto",
        background: "#0c0c1c",
        border: "1px solid #1d1d38",
        borderRadius: 10,
        boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
        animation: "captureIn 0.2s ease",
      }}>
        <style>{`@keyframes captureIn { from { opacity:0; transform:scale(0.97) } to { opacity:1; transform:none } }`}</style>

        {/* Header */}
        <div style={{
          padding: "12px 16px 11px",
          borderBottom: "1px solid #1d1d38",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          background: "#0c0c1c",
          zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.22em", textTransform: "uppercase", color: "#5a9bc8", marginBottom: 2 }}>
              event ledger
            </div>
            <div style={{ fontSize: "0.64rem", fontWeight: 700, color: "var(--fg)" }}>
              Record Event
            </div>
          </div>
          <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-4)", fontSize: "1rem", lineHeight: 1, padding: "2px 6px", opacity: 0.5 }}>
            ×
          </button>
        </div>

        <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Event type */}
          <div>
            <div style={labelStyle}>event type</div>
            {TYPE_GROUPS.map(group => (
              <div key={group.label} style={{ marginBottom: 5 }}>
                <button
                  onClick={() => setGroupOpen(groupOpen === group.label ? null : group.label)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "3px 0",
                    fontSize: "0.4rem",
                    fontFamily: "monospace",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--fg-4)",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <span style={{ opacity: 0.5 }}>{groupOpen === group.label ? "▾" : "▸"}</span>
                  {group.label}
                </button>

                {groupOpen === group.label && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                    {group.types.map(t => (
                      <button
                        key={t}
                        onClick={() => setType(t)}
                        style={{
                          padding: "4px 9px",
                          borderRadius: 4,
                          border: `1px solid ${type === t ? "#5a9bc838" : "#1d1d38"}`,
                          background: type === t ? "rgba(90,155,200,0.08)" : "transparent",
                          color: type === t ? "#5a9bc8" : "var(--fg-4)",
                          fontSize: "0.54rem",
                          cursor: "pointer",
                          fontFamily: "monospace",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {EVENT_TYPE_LABELS[t]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Date */}
          <div>
            <div style={labelStyle}>date occurred</div>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{
                ...inputStyle,
                colorScheme: "dark",
                width: "auto",
              }}
            />
          </div>

          {/* Description */}
          <div>
            <div style={labelStyle}>what happened</div>
            <textarea
              value={description}
              onChange={e => setDesc(e.target.value)}
              placeholder="Describe the event…"
              autoFocus
              rows={3}
              style={{
                ...inputStyle,
                resize: "none",
                lineHeight: 1.55,
              }}
            />
          </div>

          {/* Note */}
          <div>
            <div style={labelStyle}>
              why it matters <span style={{ opacity: 0.45, fontWeight: 400 }}>· optional</span>
            </div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Context, significance, chain this event begins or continues…"
              rows={2}
              style={{
                ...inputStyle,
                resize: "none",
                lineHeight: 1.5,
                fontSize: "0.66rem",
              }}
            />
          </div>

          {/* Evidence Attachments — JPG-025 Universal Event Schema */}
          <div style={{ borderRadius: 6, border: "1px solid #1a1a2e", background: "rgba(90,155,200,0.02)" }}>
            <button
              onClick={() => setAttOpen(o => !o)}
              style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "9px 13px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--fg-4)" }}
            >
              <div style={{ ...labelStyle, marginBottom: 0 }}>
                evidence attachments
                {attachments.length > 0 && (
                  <span style={{ marginLeft: 7, padding: "1px 6px", borderRadius: 3, background: "rgba(90,155,200,0.12)", color: "#5a9bc8", fontSize: "0.38rem" }}>
                    {attachments.length}
                  </span>
                )}
              </div>
              <span style={{ fontSize: "0.5rem", opacity: 0.5 }}>{attOpen ? "▾" : "▸"}</span>
            </button>

            {attOpen && (
              <div style={{ padding: "4px 13px 13px", display: "flex", flexDirection: "column", gap: 8 }}>
                {attachments.length === 0 && (
                  <div style={{ fontSize: "0.52rem", color: "var(--fg-4)", opacity: 0.5, fontFamily: "monospace" }}>
                    No attachments yet. Add photos, audio, documents, or signatures.
                  </div>
                )}
                {attachments.map((att, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: 5, padding: "8px 10px", borderRadius: 5, background: "#0a0a18", border: "1px solid #1d1d38" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5a9bc8" }}>
                        {att.type}
                      </span>
                      <button onClick={() => removeAttachment(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-4)", fontSize: "0.8rem", lineHeight: 1, padding: "0 4px", opacity: 0.5 }}>×</button>
                    </div>
                    <input
                      value={att.url}
                      onChange={e => updateAttachment(i, "url", e.target.value)}
                      placeholder={`${att.type === ATTACHMENT_TYPES.IMAGE ? "Photo" : att.type === ATTACHMENT_TYPES.AUDIO ? "Audio" : att.type === ATTACHMENT_TYPES.SIGNATURE ? "Signature" : "Document"} URL…`}
                      style={{ ...inputStyle, fontSize: "0.62rem" }}
                    />
                    <input
                      value={att.caption}
                      onChange={e => updateAttachment(i, "caption", e.target.value)}
                      placeholder="Caption (optional)…"
                      style={{ ...inputStyle, fontSize: "0.58rem" }}
                    />
                  </div>
                ))}
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {[
                    { type: ATTACHMENT_TYPES.IMAGE,     label: "+ Photo" },
                    { type: ATTACHMENT_TYPES.AUDIO,     label: "+ Audio" },
                    { type: ATTACHMENT_TYPES.DOCUMENT,  label: "+ Document" },
                    { type: ATTACHMENT_TYPES.SIGNATURE, label: "+ Signature" },
                  ].map(({ type: at, label }) => (
                    <button
                      key={at}
                      onClick={() => addAttachment(at)}
                      style={{
                        padding: "4px 9px",
                        borderRadius: 4,
                        border: "1px solid #5a9bc828",
                        background: "rgba(90,155,200,0.04)",
                        color: "#5a9bc870",
                        fontSize: "0.48rem",
                        fontFamily: "monospace",
                        cursor: "pointer",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Attribution — JPG-009 */}
          <div style={{ padding: "12px 13px", borderRadius: 6, background: "rgba(76,217,100,0.03)", border: "1px solid rgba(76,217,100,0.1)" }}>
            <div style={{ ...labelStyle, color: "rgba(76,217,100,0.6)", marginBottom: 8 }}>
              committed by <span style={{ opacity: 0.45, fontWeight: 400, color: "var(--fg-4)" }}>· who decided this · JPG-009</span>
            </div>
            <input
              value={committedBy}
              onChange={e => setCommittedBy(e.target.value)}
              placeholder="Name of person who committed to this decision…"
              style={{ ...inputStyle, marginBottom: 7 }}
            />
            <input
              value={commitReason}
              onChange={e => setCommitReason(e.target.value)}
              placeholder="Why they approved (optional but encouraged)…"
              style={{ ...inputStyle, fontSize: "0.66rem" }}
            />
          </div>

          {/* Subscribers preview */}
          {subscribers.length > 0 && (
            <div>
              <div style={labelStyle}>rooms notified</div>
              <div style={{ display: "flex", gap: 5 }}>
                {subscribers.map(room => (
                  <span
                    key={room}
                    style={{
                      padding: "3px 8px",
                      borderRadius: 4,
                      fontSize: "0.48rem",
                      fontFamily: "monospace",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: ROOM_COLORS[room] || "var(--fg-4)",
                      border: `1px solid ${(ROOM_COLORS[room] || "#ffffff") + "30"}`,
                      background: (ROOM_COLORS[room] || "#ffffff") + "08",
                    }}
                  >
                    {room}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onDismiss}
              style={{
                flex: 1,
                padding: "9px 0",
                borderRadius: 6,
                border: "1px solid #1d1d38",
                background: "transparent",
                color: "var(--fg-4)",
                fontSize: "0.66rem",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                flex: 2,
                padding: "9px 0",
                borderRadius: 6,
                border: `1px solid ${canSubmit ? "#5a9bc838" : "#1d1d38"}`,
                background: canSubmit ? "rgba(90,155,200,0.08)" : "transparent",
                color: canSubmit ? "#5a9bc8" : "var(--fg-4)",
                fontSize: "0.66rem",
                fontWeight: 600,
                cursor: canSubmit ? "pointer" : "default",
              }}
            >
              Record Event
            </button>
          </div>

          <div style={{ textAlign: "center", fontSize: "0.4rem", fontFamily: "monospace", color: "var(--fg-4)", opacity: 0.4 }}>
            ⌘ Enter to record · Esc to cancel · Events are permanent
          </div>
        </div>
      </div>
    </div>
  )
}
