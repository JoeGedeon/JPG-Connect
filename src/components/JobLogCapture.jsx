// src/components/JobLogCapture.jsx
// Fast-capture for job completions. < 30 seconds per job. Minimum required: job ID.
// Every completed move is now an experiment. Every dispute is now evidence. JPG-033.

import { useState } from "react"
import { createEvent, EVENT_TYPES } from "../engine/events.js"

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

const ADVERSE_OPTIONS = [
  { type: EVENT_TYPES.CUSTOMER_DISPUTE,   label: "Customer Dispute" },
  { type: EVENT_TYPES.CUSTOMER_COMPLAINT, label: "Customer Complaint" },
  { type: EVENT_TYPES.CLAIM_FILED,        label: "Claim Filed" },
  { type: EVENT_TYPES.CHARGEBACK,         label: "Chargeback" },
  { type: EVENT_TYPES.INVOICE_WRITTEN_OFF, label: "Written Off" },
  { type: EVENT_TYPES.LEGAL_REQUEST,      label: "Legal Request" },
]

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export default function JobLogCapture({ onDismiss, onRecorded }) {
  const [jobId, setJobId]               = useState("")
  const [customer, setCustomer]         = useState("")
  const [date, setDate]                 = useState(todayIso())
  const [crew, setCrew]                 = useState("")
  const [amount, setAmount]             = useState("")
  const [hasSig, setHasSig]             = useState(false)
  const [photoCount, setPhotoCount]     = useState("")
  const [committedBy, setCommittedBy]   = useState("")
  const [commitReason, setCommitReason] = useState("")
  const [adverseType, setAdverseType]   = useState(null)
  const [adverseNote, setAdverseNote]   = useState("")

  const hasJobId = jobId.trim().length > 0

  function buildDescription() {
    const parts = []
    if (customer.trim()) parts.push(customer.trim())
    if (crew.trim())     parts.push(`crew: ${crew.trim()}`)
    if (amount)          parts.push(`$${amount}`)
    return `Job ${jobId.trim() || "?"} completed${parts.length > 0 ? ` — ${parts.join(", ")}` : ""}`
  }

  function handleSubmit() {
    if (!hasJobId) return
    const occurredAt = new Date(date).getTime() || Date.now()

    const entities = []
    if (committedBy.trim()) entities.push({ type: "approved_by", value: committedBy.trim(), reason: commitReason.trim() || null })
    entities.push({ type: "job_id", value: jobId.trim() })
    if (customer.trim())  entities.push({ type: "customer", value: customer.trim() })
    if (crew.trim())      entities.push({ type: "crew",     value: crew.trim() })
    if (amount)           entities.push({ type: "amount",   value: parseFloat(amount), currency: "USD" })
    if (hasSig)           entities.push({ type: "evidence", value: "customer_signature", present: true })
    if (photoCount && parseInt(photoCount) > 0) {
      entities.push({ type: "evidence", value: "photos", count: parseInt(photoCount) })
    }

    createEvent({
      type:        EVENT_TYPES.JOB_COMPLETED,
      occurredAt,
      source:      "manual",
      description: buildDescription(),
      entities,
      domain:      "ops",
    })

    if (adverseType) {
      const label = ADVERSE_OPTIONS.find(a => a.type === adverseType)?.label || adverseType
      const adverseEntities = []
      adverseEntities.push({ type: "job_id", value: jobId.trim() })
      if (customer.trim())  adverseEntities.push({ type: "customer", value: customer.trim() })
      if (committedBy.trim()) adverseEntities.push({ type: "approved_by", value: committedBy.trim() })

      createEvent({
        type:        adverseType,
        occurredAt:  occurredAt + 1,
        source:      "manual",
        description: `${label} — Job ${jobId.trim()}${customer.trim() ? `, ${customer.trim()}` : ""}${adverseNote.trim() ? `: ${adverseNote.trim()}` : ""}`,
        entities:    adverseEntities,
        note:        adverseNote.trim(),
        domain:      "ops",
      })
    }

    onRecorded?.()
    onDismiss()
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") onDismiss()
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit()
  }

  return (
    <div
      onKeyDown={handleKeyDown}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={e => { if (e.target === e.currentTarget) onDismiss() }}
    >
      <div style={{
        width: 400,
        maxHeight: "88vh",
        overflowY: "auto",
        background: "#0c0c1c",
        border: "1px solid #1d1d38",
        borderLeft: "2px solid #00c89640",
        borderRadius: 10,
        boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
        animation: "captureIn 0.18s ease",
      }}>
        <style>{`@keyframes captureIn { from { opacity:0; transform:scale(0.97) } to { opacity:1; transform:none } }`}</style>

        {/* Header */}
        <div style={{
          padding: "12px 16px 11px",
          borderBottom: "1px solid #1d1d38",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, background: "#0c0c1c", zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.22em", textTransform: "uppercase", color: "#00c896", marginBottom: 2 }}>
              job log · every move is an experiment
            </div>
            <div style={{ fontSize: "0.64rem", fontWeight: 700, color: "var(--fg)" }}>
              Log Completed Job
            </div>
          </div>
          <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-4)", fontSize: "1rem", lineHeight: 1, padding: "2px 6px", opacity: 0.5 }}>×</button>
        </div>

        <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Job ID + Customer */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 10 }}>
            <div>
              <div style={labelStyle}>job id <span style={{ color: "#00c89670" }}>*</span></div>
              <input
                autoFocus
                value={jobId}
                onChange={e => setJobId(e.target.value)}
                placeholder="FF-8812"
                style={{ ...inputStyle, borderColor: hasJobId ? "#00c89628" : "#1d1d38" }}
              />
            </div>
            <div>
              <div style={labelStyle}>customer</div>
              <input
                value={customer}
                onChange={e => setCustomer(e.target.value)}
                placeholder="Smith Family"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <div style={labelStyle}>date completed</div>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ ...inputStyle, colorScheme: "dark", width: "auto" }}
            />
          </div>

          {/* Crew + Amount */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 10 }}>
            <div>
              <div style={labelStyle}>crew</div>
              <input
                value={crew}
                onChange={e => setCrew(e.target.value)}
                placeholder="Marcus T., Devon R."
                style={inputStyle}
              />
            </div>
            <div>
              <div style={labelStyle}>revenue $</div>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="1450"
                style={inputStyle}
                min="0"
              />
            </div>
          </div>

          {/* Evidence */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "9px 12px", borderRadius: 6, background: "rgba(76,217,100,0.02)", border: "1px solid rgba(76,217,100,0.08)" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", flex: 1 }}>
              <input
                type="checkbox"
                checked={hasSig}
                onChange={e => setHasSig(e.target.checked)}
                style={{ accentColor: "#4cd964", width: 14, height: 14 }}
              />
              <span style={{ fontSize: "0.58rem", color: hasSig ? "#4cd964" : "var(--fg-4)" }}>
                Signature captured
              </span>
            </label>
            <div style={{ flexShrink: 0 }}>
              <div style={{ ...labelStyle, marginBottom: 3 }}>photos</div>
              <input
                type="number"
                value={photoCount}
                onChange={e => setPhotoCount(e.target.value)}
                placeholder="0"
                style={{ ...inputStyle, width: 60, textAlign: "center" }}
                min="0"
              />
            </div>
          </div>

          {/* Attribution */}
          <div style={{ padding: "11px 12px", borderRadius: 6, background: "rgba(76,217,100,0.03)", border: "1px solid rgba(76,217,100,0.1)" }}>
            <div style={{ ...labelStyle, color: "rgba(76,217,100,0.6)", marginBottom: 8 }}>
              committed by · JPG-009
            </div>
            <input
              value={committedBy}
              onChange={e => setCommittedBy(e.target.value)}
              placeholder="Name of person who committed to this job…"
              style={{ ...inputStyle, marginBottom: 7 }}
            />
            <input
              value={commitReason}
              onChange={e => setCommitReason(e.target.value)}
              placeholder="On-site decisions, surcharges approved…"
              style={{ ...inputStyle, fontSize: "0.64rem" }}
            />
          </div>

          {/* Adverse outcome — optional */}
          <div style={{ borderRadius: 6, border: "1px solid #1a1a2e" }}>
            <div style={{ padding: "8px 12px 6px", fontSize: "0.4rem", fontFamily: "monospace", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-4)" }}>
              adverse outcome <span style={{ opacity: 0.45 }}>· optional · attaches to this job</span>
            </div>
            <div style={{ padding: "0 12px 11px", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {ADVERSE_OPTIONS.map(({ type: at, label }) => (
                  <button
                    key={at}
                    onClick={() => setAdverseType(adverseType === at ? null : at)}
                    style={{
                      padding: "4px 9px",
                      borderRadius: 4,
                      border: `1px solid ${adverseType === at ? "#ff6b6b40" : "#1d1d38"}`,
                      background: adverseType === at ? "rgba(255,107,107,0.08)" : "transparent",
                      color: adverseType === at ? "#ff6b6b" : "var(--fg-4)",
                      fontSize: "0.5rem",
                      fontFamily: "monospace",
                      cursor: "pointer",
                      transition: "all 0.1s",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {adverseType && (
                <input
                  value={adverseNote}
                  onChange={e => setAdverseNote(e.target.value)}
                  placeholder="Describe the issue…"
                  style={{ ...inputStyle, fontSize: "0.64rem" }}
                />
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onDismiss}
              style={{
                flex: 1, padding: "9px 0", borderRadius: 6,
                border: "1px solid #1d1d38", background: "transparent",
                color: "var(--fg-4)", fontSize: "0.66rem", cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!hasJobId}
              style={{
                flex: 2, padding: "9px 0", borderRadius: 6,
                border: `1px solid ${hasJobId ? "#00c89638" : "#1d1d38"}`,
                background: hasJobId ? "rgba(0,200,150,0.08)" : "transparent",
                color: hasJobId ? "#00c896" : "var(--fg-4)",
                fontSize: "0.66rem", fontWeight: 600,
                cursor: hasJobId ? "pointer" : "default",
                transition: "all 0.15s",
              }}
            >
              {adverseType ? "Log Job + Outcome" : "Log Job"}
            </button>
          </div>

          <div style={{ textAlign: "center", fontSize: "0.4rem", fontFamily: "monospace", color: "var(--fg-4)", opacity: 0.4 }}>
            ⌘ Enter to log · Esc to cancel · JPG-033 · Every move is an experiment
          </div>

        </div>
      </div>
    </div>
  )
}
