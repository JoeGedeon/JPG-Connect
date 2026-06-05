// src/layers/archivist/ArchivistRoom.jsx
// ARCHIVIST room — library layout: stacks (left) + reading room + consultation (right)
// The room is permanent. The stacks are always visible. The record is the center.
// ARCHIVIST subscribes to "*" — no filtering, no opinions. Just witness.

import { useState, useRef, useEffect } from "react"
import { loadAllCanon, getReviewsForDeclaration, getChallengeStats, getDoctineHealth, getDriftHistory, getDoctrineDrift, getDoctineRiskForecast, IMPORTANCE } from "../../engine/canon.js"
import { EVENT_TYPES, getEvents, seedEvents, EVENT_TYPE_LABELS, queryEvents, getDecisionRationale, findSimilarEvents, getEventSequenceAfter, getLinkedDeclarationIds, generateDisputePackage, generateRevenueLeakageReport, generateAccountabilitySummary, generatePayrollReport, generateBrokerReport, getEventsByAuthor } from "../../engine/events.js"
import { formatMessage } from "../../utils/formatMessage.jsx"
import EventCapture from "../../components/EventCapture.jsx"

const AM = {
  bg:       "#0a0806",
  card:     "#110d09",
  border:   "#231810",
  primary:  "#c8955a",
  dim:      "rgba(200,149,90,0.07)",
  hover:    "rgba(200,149,90,0.04)",
  spine:    "#c8955a",
  spineAlt: "rgba(200,149,90,0.32)",
}

function healthColor(score) {
  if (score >= 75) return "#4cd964"
  if (score >= 50) return AM.primary
  if (score >= 25) return "#ff9f43"
  return "#ff6b6b"
}

function recordedOn(ts) {
  const d    = new Date(ts)
  const diff = Date.now() - ts
  if (diff < 3600000)  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
}

function StackVolume({ declaration, selected, onSelect }) {
  const isChained = !!declaration.originTension
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={() => onSelect(declaration)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 9,
        padding: "9px 8px",
        marginBottom: 2,
        borderRadius: 5,
        cursor: "pointer",
        background: selected ? AM.dim : hovered ? AM.hover : "transparent",
        border: `1px solid ${selected ? AM.primary + "28" : "transparent"}`,
        transition: "all 0.12s",
      }}
    >
      {/* Book spine */}
      <div style={{
        width: 3,
        alignSelf: "stretch",
        minHeight: 34,
        borderRadius: 2,
        background: isChained ? AM.spine : AM.spineAlt,
        flexShrink: 0,
        marginTop: 1,
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "0.63rem",
          fontWeight: 600,
          color: selected ? AM.primary : "var(--fg-2)",
          lineHeight: 1.35,
          marginBottom: 5,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          transition: "color 0.12s",
        }}>
          {declaration.label}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.44rem", fontFamily: "monospace", color: "var(--fg-4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {declaration.type}
          </span>
          {declaration.importance === IMPORTANCE.FOUNDATIONAL && (
            <span style={{ fontSize: "0.4rem", fontFamily: "monospace", color: "#e8a87c80", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              ◆
            </span>
          )}
          {isChained && (
            <span style={{ fontSize: "0.44rem", fontFamily: "monospace", color: AM.primary + "80", letterSpacing: "0.06em" }}>
              ↳ kodex
            </span>
          )}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
            {(() => {
              const h = getDoctineHealth(declaration)
              return (
                <span style={{ fontSize: "0.42rem", fontFamily: "monospace", color: healthColor(h.total), opacity: 0.7 }}>
                  {h.total}
                </span>
              )
            })()}
            <span style={{ fontSize: "0.44rem", fontFamily: "monospace", color: "var(--fg-4)" }}>
              {recordedOn(declaration.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

const DECISION_LABEL = { conflict: "conflict", link: "linked", ignore: "ignored" }
const DECISION_COLOR = { conflict: "#ff6b6b", link: "#8daac4", ignore: "var(--fg-4)" }

function ChallengeHistory({ declarationId }) {
  const reviews = getReviewsForDeclaration(declarationId)
  const stats   = getChallengeStats(declarationId)
  if (reviews.length === 0) return null

  const summaryParts = [
    stats.total > 0 && `challenged ${stats.total}×`,
    stats.conflict > 0 && `conflicted ${stats.conflict}`,
    stats.linked > 0 && `linked ${stats.linked}`,
    stats.ignored > 0 && `ignored ${stats.ignored}`,
    stats.pending > 0 && `${stats.pending} pending`,
  ].filter(Boolean)

  return (
    <div style={{ borderTop: `1px solid ${AM.border}`, paddingTop: 18 }}>
      <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 4 }}>
        challenge history
      </div>
      <div style={{ fontSize: "0.52rem", color: AM.primary + "80", fontFamily: "monospace", marginBottom: 14 }}>
        {summaryParts.join(" · ")}
      </div>
      {reviews.map(r => {
        const challenger = r.newDeclaration?.id === declarationId ? r.foundational : r.newDeclaration
        const role       = r.foundationalId === declarationId ? "challenged by" : "challenged"
        const date       = new Date(r.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
        const status     = r.status === "pending" ? "pending" : DECISION_LABEL[r.status] || r.status
        const color      = r.status === "pending" ? "#e8a87c" : (DECISION_COLOR[r.status] || "var(--fg-4)")
        return (
          <div key={r.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${AM.border}` }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ fontSize: "0.52rem", color: "var(--fg-4)", fontFamily: "monospace" }}>{role}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ fontSize: "0.44rem", fontFamily: "monospace", color, letterSpacing: "0.08em" }}>{status}</div>
                <div style={{ fontSize: "0.44rem", fontFamily: "monospace", color: "var(--fg-4)" }}>{date}</div>
              </div>
            </div>
            {challenger && (
              <div style={{ fontSize: "0.6rem", color: "var(--fg-2)", lineHeight: 1.4, marginBottom: r.resolution?.note ? 4 : 0 }}>
                {challenger.label}
              </div>
            )}
            {r.resolution?.note && (
              <div style={{ fontSize: "0.56rem", color: "var(--fg-3)", fontStyle: "italic", lineHeight: 1.5 }}>
                "{r.resolution.note}"
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const ROOM_COLORS = {
  archivist: "#c8955a",
  opscore:   "#5a9bc8",
  kel:       "#7bc85a",
  kodex:     "#b55ac8",
}

function EventRow({ event, selected, onSelect }) {
  const [hovered, setHovered] = useState(false)
  const date = new Date(event.occurredAt)
  const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })

  return (
    <div
      onClick={() => onSelect(event)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "9px 8px",
        marginBottom: 2,
        borderRadius: 5,
        cursor: "pointer",
        background: selected ? "rgba(90,155,200,0.07)" : hovered ? "rgba(90,155,200,0.03)" : "transparent",
        border: `1px solid ${selected ? "#5a9bc828" : "transparent"}`,
        transition: "all 0.12s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ width: 3, alignSelf: "stretch", minHeight: 24, borderRadius: 2, background: "#5a9bc860", flexShrink: 0 }} />
        <div style={{
          fontSize: "0.6rem",
          fontWeight: 600,
          color: selected ? "#5a9bc8" : "var(--fg-2)",
          lineHeight: 1.35,
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          transition: "color 0.12s",
        }}>
          {event.description || EVENT_TYPE_LABELS[event.type] || event.type}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, paddingLeft: 8 }}>
        <span style={{ fontSize: "0.42rem", fontFamily: "monospace", color: "#5a9bc870", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {event.id}
        </span>
        <span style={{ fontSize: "0.42rem", fontFamily: "monospace", color: "var(--fg-4)" }}>
          {dateStr}
        </span>
      </div>
    </div>
  )
}

export default function ArchivistRoom({ messages, thinking, input, onInputChange, onSend, focusDeclarationId }) {
  const allCanon = loadAllCanon()
  const active   = allCanon.filter(d => !/^[A-Z]/.test(d.id) && d.status === "active")
  const archived = allCanon.filter(d => !/^[A-Z]/.test(d.id) && d.status === "released")

  const [selected, setSelected]       = useState(() => active[0] || archived[0] || null)
  const [leftTab, setLeftTab]         = useState("stacks")  // "stacks" | "events" | "query"
  const [events, setEvents]           = useState(() => { seedEvents(); return getEvents() })
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [captureOpen, setCaptureOpen] = useState(false)
  const [queryMode, setQueryMode]       = useState("search")
  const [queryText, setQueryText]       = useState("")
  const [queryAuthor, setQueryAuthor]   = useState("")
  const [queryType, setQueryType]       = useState(EVENT_TYPES.JOB_COMPLETED)
  const [queryJobId, setQueryJobId]     = useState("")
  const [queryResults, setQueryResults] = useState([])
  const [sequenceData, setSequenceData] = useState([])
  const [disputePackage, setDisputePackage] = useState(null)
  const [docType, setDocType]           = useState("dispute")
  const [orgReport, setOrgReport]       = useState(null)
  const bottomRef = useRef(null)

  const archivistMsgs = messages.filter(
    m => m.lane === "archivist" && (m.role === "user" || m.role === "bot" || m.role === "error")
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, thinking])

  useEffect(() => {
    if (!focusDeclarationId) return
    const doc = allCanon.find(d => d.id === focusDeclarationId)
    if (doc) setSelected(doc)
  }, [focusDeclarationId])

  useEffect(() => {
    if (leftTab !== "query") return
    if (queryMode === "next") {
      setSequenceData(getEventSequenceAfter(queryType))
      setQueryResults([])
    } else if (queryMode === "doc") {
      setQueryResults([])
    } else if (queryMode === "who") {
      setQueryResults(queryAuthor.trim() ? getEventsByAuthor(queryAuthor) : [])
    } else if (queryMode === "why") {
      setQueryResults(
        queryEvents({ text: queryText || undefined })
          .filter(e => e.entities?.some(en => en.type === "approved_by"))
      )
    } else if (queryMode === "seen") {
      setQueryResults(queryEvents({ type: queryType }))
    } else {
      setQueryResults(queryText.trim() ? queryEvents({ text: queryText }) : getEvents().slice(0, 20))
    }
  }, [leftTab, queryMode, queryText, queryAuthor, queryType])

  useEffect(() => { setDisputePackage(null) }, [selectedEvent?.id])

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend() }
  }

  return (
  <>
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: AM.bg,
      overflow: "hidden",
    }}>

      {/* Room header */}
      <div style={{
        padding: "10px 16px 9px",
        borderBottom: `1px solid ${AM.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.22em", textTransform: "uppercase", color: AM.primary, marginBottom: 3 }}>
            ARCHIVIST · Memory Wing
          </div>
          <div style={{ fontSize: "0.6rem", color: "var(--fg-4)", fontStyle: "italic", letterSpacing: "0.01em" }}>
            Everything in here already happened.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right", fontSize: "0.48rem", fontFamily: "monospace", lineHeight: 1.6 }}>
            <span style={{ color: AM.primary }}>{active.length}</span>
            <span style={{ color: "var(--fg-4)" }}> active</span>
            {archived.length > 0 && (
              <>
                <br />
                <span style={{ color: "var(--fg-4)" }}>{archived.length} archived</span>
              </>
            )}
            <br />
            <span style={{ color: "#5a9bc8" }}>{events.length}</span>
            <span style={{ color: "var(--fg-4)" }}> events</span>
          </div>
          <button
            onClick={() => setCaptureOpen(true)}
            style={{
              padding: "6px 11px",
              borderRadius: 5,
              border: "1px solid #5a9bc828",
              background: "rgba(90,155,200,0.06)",
              color: "#5a9bc8",
              fontSize: "0.52rem",
              fontFamily: "monospace",
              letterSpacing: "0.1em",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            + Event
          </button>
        </div>
      </div>

      {/* Two-column body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Left: The Stacks */}
        <div style={{
          width: 228,
          flexShrink: 0,
          borderRight: `1px solid ${AM.border}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Left panel tab bar */}
          <div style={{
            padding: "6px 8px 5px",
            borderBottom: `1px solid ${AM.border}`,
            display: "flex",
            gap: 4,
          }}>
            {[
              { id: "stacks", label: "Stacks" },
              { id: "events", label: "Events" },
              { id: "query",  label: "Query" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setLeftTab(tab.id)}
                style={{
                  padding: "3px 9px",
                  borderRadius: 4,
                  border: `1px solid ${leftTab === tab.id ? AM.primary + "30" : "transparent"}`,
                  background: leftTab === tab.id ? AM.dim : "transparent",
                  color: leftTab === tab.id ? AM.primary : "var(--fg-4)",
                  fontSize: "0.44rem",
                  fontFamily: "monospace",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {leftTab === "query" && (
            <div style={{
              padding: "6px 6px 5px",
              borderBottom: `1px solid ${AM.border}`,
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 5 }}>
                {[
                  { id: "search", label: "What?" },
                  { id: "why",    label: "Why?" },
                  { id: "seen",   label: "Seen?" },
                  { id: "next",   label: "Next?" },
                  { id: "who",    label: "Who?" },
                  { id: "doc",    label: "Doc?" },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setQueryMode(m.id); setSelectedEvent(null); setDisputePackage(null) }}
                    style={{
                      padding: "3px 8px",
                      borderRadius: 4,
                      border: `1px solid ${queryMode === m.id
                        ? m.id === "doc" ? "rgba(76,217,100,0.2)" : "#5a9bc828"
                        : AM.border}`,
                      background: queryMode === m.id
                        ? m.id === "doc" ? "rgba(76,217,100,0.06)" : "rgba(90,155,200,0.08)"
                        : "transparent",
                      color: queryMode === m.id
                        ? m.id === "doc" ? "rgba(76,217,100,0.8)" : "#5a9bc8"
                        : "var(--fg-4)",
                      fontSize: "0.44rem",
                      fontFamily: "monospace",
                      letterSpacing: "0.1em",
                      cursor: "pointer",
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {(queryMode === "search" || queryMode === "why") && (
                <input
                  value={queryText}
                  onChange={e => setQueryText(e.target.value)}
                  placeholder={queryMode === "why" ? "Search attributed events…" : "Search events…"}
                  style={{
                    width: "100%",
                    padding: "5px 7px",
                    borderRadius: 4,
                    border: `1px solid ${AM.border}`,
                    background: "#07070f",
                    color: "var(--fg)",
                    fontSize: "0.62rem",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              )}
              {queryMode === "who" && (
                <input
                  value={queryAuthor}
                  onChange={e => setQueryAuthor(e.target.value)}
                  placeholder="Author name…"
                  style={{
                    width: "100%",
                    padding: "5px 7px",
                    borderRadius: 4,
                    border: `1px solid ${AM.border}`,
                    background: "#07070f",
                    color: "var(--fg)",
                    fontSize: "0.62rem",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              )}
              {(queryMode === "seen" || queryMode === "next") && (
                <select
                  value={queryType}
                  onChange={e => setQueryType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "5px 7px",
                    borderRadius: 4,
                    border: `1px solid ${AM.border}`,
                    background: "#07070f",
                    color: "var(--fg)",
                    fontSize: "0.62rem",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                >
                  {Object.entries(EVENT_TYPE_LABELS).map(([t, label]) => (
                    <option key={t} value={t}>{label}</option>
                  ))}
                </select>
              )}
              {queryMode === "doc" && (
                <>
                  <div style={{ display: "flex", gap: 3, marginBottom: 5 }}>
                    {[
                      { id: "dispute",        label: "Dispute" },
                      { id: "leakage",        label: "Leakage" },
                      { id: "accountability", label: "Acctblty" },
                      { id: "payroll",        label: "Crew" },
                      { id: "broker",         label: "Broker" },
                    ].map(d => (
                      <button
                        key={d.id}
                        onClick={() => { setDocType(d.id); setDisputePackage(null); setOrgReport(null) }}
                        style={{
                          padding: "2px 7px",
                          borderRadius: 3,
                          border: `1px solid ${docType === d.id ? "rgba(76,217,100,0.2)" : AM.border}`,
                          background: docType === d.id ? "rgba(76,217,100,0.06)" : "transparent",
                          color: docType === d.id ? "rgba(76,217,100,0.8)" : "var(--fg-4)",
                          fontSize: "0.4rem",
                          fontFamily: "monospace",
                          letterSpacing: "0.06em",
                          cursor: "pointer",
                        }}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>

                  {docType === "dispute" ? (
                    <div style={{ display: "flex", gap: 4 }}>
                      <input
                        value={queryJobId}
                        onChange={e => { setQueryJobId(e.target.value); setDisputePackage(null) }}
                        onKeyDown={e => {
                          if (e.key === "Enter" && queryJobId.trim()) {
                            const pkg = generateDisputePackage(queryJobId.trim())
                            setDisputePackage(pkg || { jobId: queryJobId.trim(), notFound: true })
                          }
                        }}
                        placeholder="Job ID (e.g. FF-8812)…"
                        style={{
                          flex: 1,
                          padding: "5px 7px",
                          borderRadius: 4,
                          border: `1px solid ${AM.border}`,
                          background: "#07070f",
                          color: "var(--fg)",
                          fontSize: "0.62rem",
                          outline: "none",
                          boxSizing: "border-box",
                          fontFamily: "inherit",
                        }}
                      />
                      <button
                        onClick={() => {
                          if (!queryJobId.trim()) return
                          const pkg = generateDisputePackage(queryJobId.trim())
                          setDisputePackage(pkg || { jobId: queryJobId.trim(), notFound: true })
                        }}
                        style={{
                          padding: "5px 10px",
                          borderRadius: 4,
                          border: "1px solid rgba(76,217,100,0.2)",
                          background: "rgba(76,217,100,0.06)",
                          color: "rgba(76,217,100,0.8)",
                          fontSize: "0.58rem",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        →
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setOrgReport(
                        docType === "leakage"        ? generateRevenueLeakageReport() :
                        docType === "accountability" ? generateAccountabilitySummary() :
                        docType === "payroll"        ? generatePayrollReport() :
                                                       generateBrokerReport()
                      )}
                      style={{
                        width: "100%",
                        padding: "5px 10px",
                        borderRadius: 4,
                        border: "1px solid rgba(76,217,100,0.2)",
                        background: "rgba(76,217,100,0.06)",
                        color: "rgba(76,217,100,0.8)",
                        fontSize: "0.52rem",
                        fontFamily: "monospace",
                        letterSpacing: "0.06em",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      Generate {
                        { leakage: "Leakage Report", accountability: "Accountability Summary", payroll: "Crew Activity Report", broker: "Broker Report" }[docType]
                      } →
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          <div style={{ flex: 1, overflowY: "auto", padding: "8px 6px" }}>
            {leftTab === "stacks" ? (
              <>
                {active.length === 0 && archived.length === 0 ? (
                  <div style={{ padding: "18px 8px", fontSize: "0.66rem", color: "var(--fg-4)", lineHeight: 1.75, fontStyle: "italic" }}>
                    The stacks are empty.
                    <br />
                    <span style={{ fontSize: "0.6rem" }}>Declare something worth keeping.</span>
                  </div>
                ) : (
                  active.map(d => (
                    <StackVolume
                      key={d.id}
                      declaration={d}
                      selected={selected?.id === d.id}
                      onSelect={d => { setSelected(d); setSelectedEvent(null) }}
                    />
                  ))
                )}

                {archived.length > 0 && (
                  <>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      margin: "14px 4px 8px",
                      fontSize: "0.42rem",
                      fontFamily: "monospace",
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "var(--fg-4)",
                    }}>
                      <div style={{ flex: 1, height: 1, background: AM.border }} />
                      archive
                      <div style={{ flex: 1, height: 1, background: AM.border }} />
                    </div>
                    {archived.map(d => (
                      <StackVolume
                        key={d.id}
                        declaration={d}
                        selected={selected?.id === d.id}
                        onSelect={d => { setSelected(d); setSelectedEvent(null) }}
                      />
                    ))}
                  </>
                )}
              </>
            ) : leftTab === "events" ? (
              /* Events tab */
              <>
                {events.length === 0 ? (
                  <div style={{ padding: "18px 8px", fontSize: "0.66rem", color: "var(--fg-4)", lineHeight: 1.75, fontStyle: "italic" }}>
                    No events yet.
                    <br />
                    <span style={{ fontSize: "0.6rem" }}>The ledger is waiting.</span>
                  </div>
                ) : (
                  events.map(ev => (
                    <EventRow
                      key={ev.id}
                      event={ev}
                      selected={selectedEvent?.id === ev.id}
                      onSelect={ev => { setSelectedEvent(ev); setSelected(null) }}
                    />
                  ))
                )}
              </>
            ) : (
              /* Query tab — results */
              <>
                {queryResults.length === 0 ? (
                  <div style={{ padding: "8px 4px", fontSize: "0.58rem", color: "var(--fg-4)", fontStyle: "italic", lineHeight: 1.8 }}>
                    {queryMode === "next"
                      ? "Select a type to see what follows."
                      : queryMode === "doc"
                        ? (disputePackage && !disputePackage.notFound) || orgReport
                          ? <span style={{ color: "rgba(76,217,100,0.7)" }}>Document ready ↗</span>
                          : docType === "dispute" ? "Enter a job ID above." : "Press Generate above."
                        : queryMode === "who" && !queryAuthor.trim()
                          ? "Enter a name above."
                          : queryMode === "search" && !queryText.trim()
                            ? "Type to search the ledger."
                            : "No matching events."}
                  </div>
                ) : (
                  queryResults.map(ev => (
                    <EventRow
                      key={ev.id}
                      event={ev}
                      selected={selectedEvent?.id === ev.id}
                      onSelect={ev => { setSelectedEvent(ev); setSelected(null) }}
                    />
                  ))
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: Reading room + consultation + input */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Reading room */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {(leftTab === "query" && queryMode === "doc") ? (
              /* K.E.L. Document Engine */
              <div style={{ padding: "24px 28px 20px" }}>
                {/* Shared document renderer — handles all three doc types */}
                {(() => {
                  const doc = docType === "dispute" ? disputePackage : orgReport

                  if (!doc) {
                    const empty = {
                      dispute:        { hint: "Enter a job ID above.", sub: "The dispute package writes itself from the Event Ledger." },
                      leakage:        { hint: "Press Generate above.", sub: "Revenue Leakage Report runs across all recorded recovery events." },
                      accountability: { hint: "Press Generate above.", sub: "Accountability Summary shows every named decision-maker on record." },
                      payroll:        { hint: "Press Generate above.", sub: "Crew Activity Report aggregates job completions by crew member." },
                      broker:         { hint: "Press Generate above.", sub: "Broker Report surfaces all damage, claim, and evidence events." },
                    }[docType]
                    return (
                      <div style={{ paddingTop: 40, textAlign: "center" }}>
                        <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(76,217,100,0.4)", marginBottom: 12 }}>
                          K.E.L. document engine
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--fg-4)", fontStyle: "italic", lineHeight: 1.8 }}>
                          {empty.hint}
                          <br />
                          <span style={{ fontSize: "0.6rem" }}>{empty.sub}</span>
                        </div>
                      </div>
                    )
                  }

                  if (doc.notFound) {
                    return (
                      <div>
                        <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(76,217,100,0.5)", marginBottom: 12 }}>
                          no events found
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--fg-4)", fontStyle: "italic" }}>
                          Job {doc.jobId} has no recorded events in the ledger.
                        </div>
                      </div>
                    )
                  }

                  const titles = {
                    dispute:        `K.E.L. · Dispute Package · Job ${doc.jobId}`,
                    leakage:        "K.E.L. · Revenue Leakage Report",
                    accountability: "K.E.L. · Accountability Summary",
                    payroll:        "K.E.L. · Crew Activity Report",
                    broker:         "K.E.L. · Broker / Insurance Report",
                  }

                  const stats = {
                    dispute: [
                      { label: "events",    value: doc.eventCount },
                      { label: "approvals", value: doc.approvalCount, warn: doc.approvalCount === 0 },
                      { label: "evidence",  value: doc.evidenceCount },
                      { label: "total",     value: doc.totalAmount ? `$${doc.totalAmount.toLocaleString()}` : "—" },
                    ],
                    leakage: [
                      { label: "recovered",  value: doc.eventCount },
                      { label: "attributed", value: doc.attributedCount, warn: doc.attributedCount === 0 },
                      { label: "rate",       value: `${doc.attributionRate}%`, warn: doc.attributionRate < 50 },
                      { label: "total",      value: doc.totalRecovered ? `$${doc.totalRecovered.toLocaleString()}` : "$0" },
                    ],
                    accountability: [
                      { label: "total",    value: doc.totalEvents },
                      { label: "named",    value: doc.attributedCount },
                      { label: "gaps",     value: doc.gapCount, warn: doc.gapCount > 0 },
                      { label: "rate",     value: `${doc.attributionRate}%`, warn: doc.attributionRate < 80 },
                    ],
                    payroll: [
                      { label: "jobs",  value: doc.jobCount },
                      { label: "crew",  value: doc.crewCount },
                    ],
                    broker: [
                      { label: "incidents",  value: doc.incidentCount },
                      { label: "evidence",   value: doc.evidenceCount },
                      { label: "attributed", value: doc.attributedCount },
                      { label: "gaps",       value: doc.gapCount, warn: doc.gapCount > 0 },
                    ],
                  }[docType]

                  const hasGap = docType === "dispute"
                    ? doc.approvalCount === 0
                    : docType === "leakage"
                      ? doc.attributionRate < 100 && doc.eventCount > 0
                    : docType === "payroll"
                      ? false
                    : doc.gapCount > 0

                  return (
                    <>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                        <div>
                          <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(76,217,100,0.55)", marginBottom: 5 }}>
                            {titles[docType]}
                          </div>
                        </div>
                        <button
                          onClick={() => navigator.clipboard?.writeText(doc.text)}
                          style={{ padding: "6px 12px", borderRadius: 4, border: "1px solid rgba(76,217,100,0.18)", background: "rgba(76,217,100,0.05)", color: "rgba(76,217,100,0.7)", fontSize: "0.46rem", fontFamily: "monospace", letterSpacing: "0.1em", cursor: "pointer", flexShrink: 0 }}
                        >
                          Copy
                        </button>
                      </div>

                      <div style={{ display: "flex", gap: 16, marginBottom: 18 }}>
                        {stats.map(({ label, value, warn }) => (
                          <div key={label} style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "1.0rem", fontWeight: 200, color: warn ? "#ff6b6b" : "rgba(76,217,100,0.8)", lineHeight: 1, marginBottom: 4 }}>{value}</div>
                            <div style={{ fontSize: "0.38rem", fontFamily: "monospace", color: "var(--fg-4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
                          </div>
                        ))}
                      </div>

                      {hasGap && (
                        <div style={{ marginBottom: 14, padding: "8px 12px", borderRadius: 5, background: "rgba(255,107,107,0.04)", border: "1px solid rgba(255,107,107,0.15)" }}>
                          <div style={{ fontSize: "0.48rem", color: "#ff9f43", fontFamily: "monospace" }}>
                            ⚠ Accountability gaps detected — decisions without a named approver (JPG-009)
                          </div>
                        </div>
                      )}

                      <pre style={{ fontSize: "0.5rem", fontFamily: "monospace", color: "var(--fg-3)", lineHeight: 1.75, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, padding: "12px 14px", borderRadius: 5, background: "rgba(0,0,0,0.25)", border: `1px solid ${AM.border}`, maxHeight: 420, overflowY: "auto" }}>
                        {doc.text}
                      </pre>

                      <div style={{ marginTop: 10, fontSize: "0.42rem", fontFamily: "monospace", color: "var(--fg-4)", opacity: 0.4, lineHeight: 1.8 }}>
                        Generated from verified Event Ledger records · PACER doesn't guess — PACER remembers (JPG-010)
                      </div>
                    </>
                  )
                })()}
              </div>
            ) : (leftTab === "query" && queryMode === "next") ? (
              /* Q4: What usually happens next? — sequence visualization */
              <div style={{ padding: "24px 28px 20px" }}>
                <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "#5a9bc870", marginBottom: 12 }}>
                  pattern sequence
                </div>
                <div style={{ fontSize: "0.96rem", fontWeight: 700, color: "var(--fg)", lineHeight: 1.45, marginBottom: 8 }}>
                  After {EVENT_TYPE_LABELS[queryType] || queryType}
                </div>
                {sequenceData.length === 0 ? (
                  <div style={{ fontSize: "0.7rem", color: "var(--fg-4)", fontStyle: "italic", marginTop: 16, lineHeight: 1.8 }}>
                    No sequence data yet.
                    <br />
                    <span style={{ fontSize: "0.62rem" }}>Record more events of this type to see what usually follows.</span>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: "0.54rem", color: "var(--fg-4)", marginBottom: 20, lineHeight: 1.7 }}>
                      Observed after{" "}
                      <span style={{ color: AM.primary }}>
                        {getEvents().filter(e => e.type === queryType).length}
                      </span>{" "}
                      recorded event{getEvents().filter(e => e.type === queryType).length !== 1 ? "s" : ""} of this type.
                    </div>
                    {sequenceData.map(({ type: t, count }, i) => (
                      <div key={t} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 10,
                        padding: "11px 14px",
                        borderRadius: 5,
                        background: AM.card,
                        border: `1px solid ${AM.border}`,
                      }}>
                        <div style={{ fontSize: "1.0rem", fontWeight: 200, color: "#5a9bc840", fontFamily: "monospace", width: 22, textAlign: "center", flexShrink: 0 }}>
                          {i + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "0.66rem", color: "var(--fg-2)", fontWeight: 600, marginBottom: 3 }}>
                            {EVENT_TYPE_LABELS[t] || t}
                          </div>
                          <div style={{ fontSize: "0.44rem", fontFamily: "monospace", color: "var(--fg-4)" }}>
                            {count} time{count !== 1 ? "s" : ""} observed
                          </div>
                        </div>
                        <div style={{
                          height: 3,
                          width: Math.max(16, Math.round((count / sequenceData[0].count) * 72)),
                          background: "#5a9bc8",
                          borderRadius: 2,
                          opacity: 0.45,
                          flexShrink: 0,
                        }} />
                      </div>
                    ))}
                    <div style={{ marginTop: 12, fontSize: "0.44rem", fontFamily: "monospace", color: "var(--fg-4)", opacity: 0.45, lineHeight: 1.9 }}>
                      Sequences inferred from Event Ledger order of occurrence.
                      <br />
                      Patterns accumulate as more events are recorded.
                    </div>
                  </>
                )}
              </div>
            ) : selectedEvent ? (
              /* Event detail view */
              <div style={{ padding: "24px 28px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "#5a9bc870" }}>
                    {EVENT_TYPE_LABELS[selectedEvent.type] || selectedEvent.type}
                  </div>
                  <div style={{
                    fontSize: "0.4rem",
                    fontFamily: "monospace",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "2px 6px",
                    borderRadius: 3,
                    color: "#5a9bc8",
                    background: "rgba(90,155,200,0.08)",
                    border: "1px solid #5a9bc828",
                  }}>
                    {selectedEvent.id}
                  </div>
                </div>

                <div style={{ fontSize: "1.0rem", fontWeight: 700, color: "var(--fg)", lineHeight: 1.45, marginBottom: 16, letterSpacing: "-0.01em" }}>
                  {selectedEvent.description}
                </div>

                <div style={{ fontSize: "0.48rem", fontFamily: "monospace", color: "var(--fg-4)", lineHeight: 1.9, marginBottom: 20 }}>
                  <div>occurred {new Date(selectedEvent.occurredAt).toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
                  <div>recorded {new Date(selectedEvent.recordedAt).toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
                  <div>source: {selectedEvent.source}</div>
                </div>

                {/* Attribution block — JPG-009: pulled out of entities, given its own weight */}
                {selectedEvent.entities?.some(en => en.type === "approved_by") && (() => {
                  const ap = selectedEvent.entities.find(en => en.type === "approved_by")
                  return (
                    <div style={{ marginBottom: 18, padding: "11px 15px", borderRadius: 6, background: "rgba(76,217,100,0.03)", border: "1px solid rgba(76,217,100,0.12)", borderLeft: "2px solid rgba(76,217,100,0.4)" }}>
                      <div style={{ fontSize: "0.4rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(76,217,100,0.55)", marginBottom: 6 }}>
                        committed by
                      </div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--fg)", marginBottom: ap.reason ? 6 : 0 }}>
                        {ap.value}
                      </div>
                      {ap.reason && (
                        <div style={{ fontSize: "0.64rem", color: "var(--fg-3)", lineHeight: 1.6, fontStyle: "italic" }}>
                          "{ap.reason}"
                        </div>
                      )}
                    </div>
                  )
                })()}

                {selectedEvent.entities?.filter(en => en.type !== "approved_by").length > 0 && (
                  <div style={{ marginBottom: 18, padding: "12px 14px", borderRadius: 6, background: AM.card, border: `1px solid ${AM.border}` }}>
                    <div style={{ fontSize: "0.4rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 10 }}>
                      entities
                    </div>
                    {selectedEvent.entities.filter(en => en.type !== "approved_by").map((en, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: "0.62rem", color: "var(--fg-3)", marginBottom: 5, lineHeight: 1.4 }}>
                        <span style={{ fontFamily: "monospace", fontSize: "0.46rem", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0, marginRight: 8 }}>
                          {en.type}
                        </span>
                        <span style={{ flex: 1 }}>{en.value}</span>
                        {en.qty && (
                          <span style={{ fontFamily: "monospace", fontSize: "0.5rem", color: AM.primary, marginLeft: 8 }}>
                            {en.qty} × ${en.unitPrice}
                            {en.total ? ` = $${en.total}` : ""}
                          </span>
                        )}
                        {en.value !== undefined && en.currency && (
                          <span style={{ fontFamily: "monospace", fontSize: "0.5rem", color: AM.primary, marginLeft: 8 }}>
                            ${en.value} {en.currency}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* K.E.L. contextual action — surfaces when event has a job_id */}
                {selectedEvent.entities?.some(en => en.type === "job_id") && (() => {
                  const jobId = selectedEvent.entities.find(en => en.type === "job_id").value
                  const pkg   = disputePackage?.jobId === jobId ? disputePackage : null
                  return (
                    <div style={{ marginBottom: 18 }}>
                      {!pkg ? (
                        <button
                          onClick={() => setDisputePackage(generateDisputePackage(jobId) || { jobId, notFound: true })}
                          style={{
                            width: "100%",
                            padding: "9px 14px",
                            borderRadius: 5,
                            border: "1px solid rgba(76,217,100,0.15)",
                            background: "rgba(76,217,100,0.03)",
                            color: "rgba(76,217,100,0.65)",
                            fontSize: "0.5rem",
                            fontFamily: "monospace",
                            letterSpacing: "0.1em",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          K.E.L. → Generate Dispute Package · {jobId}
                        </button>
                      ) : pkg.notFound ? (
                        <div style={{ fontSize: "0.54rem", color: "var(--fg-4)", fontStyle: "italic", padding: "6px 0" }}>
                          No ledger events found for {jobId}.
                        </div>
                      ) : (
                        <div style={{ padding: "12px 14px", borderRadius: 6, background: "rgba(76,217,100,0.03)", border: "1px solid rgba(76,217,100,0.12)" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                            <div style={{ fontSize: "0.4rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(76,217,100,0.55)" }}>
                              K.E.L. · Dispute Package · {pkg.jobId}
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                onClick={() => navigator.clipboard?.writeText(pkg.text)}
                                style={{ padding: "3px 8px", borderRadius: 3, border: "1px solid rgba(76,217,100,0.15)", background: "transparent", color: "rgba(76,217,100,0.6)", fontSize: "0.42rem", fontFamily: "monospace", cursor: "pointer" }}
                              >
                                Copy
                              </button>
                              <button
                                onClick={() => setDisputePackage(null)}
                                style={{ padding: "3px 7px", borderRadius: 3, border: "none", background: "transparent", color: "var(--fg-4)", fontSize: "0.7rem", cursor: "pointer", lineHeight: 1 }}
                              >
                                ×
                              </button>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 14, marginBottom: 10 }}>
                            {[
                              { label: "events",    value: pkg.eventCount },
                              { label: "approvals", value: pkg.approvalCount, warn: pkg.approvalCount === 0 },
                              { label: "evidence",  value: pkg.evidenceCount },
                              { label: "total",     value: pkg.totalAmount ? `$${pkg.totalAmount.toLocaleString()}` : "—" },
                            ].map(({ label, value, warn }) => (
                              <div key={label} style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "0.88rem", fontWeight: 200, color: warn ? "#ff6b6b" : "rgba(76,217,100,0.75)", lineHeight: 1, marginBottom: 3 }}>{value}</div>
                                <div style={{ fontSize: "0.36rem", fontFamily: "monospace", color: "var(--fg-4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
                              </div>
                            ))}
                          </div>
                          <pre style={{
                            fontSize: "0.48rem",
                            fontFamily: "monospace",
                            color: "var(--fg-3)",
                            lineHeight: 1.7,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            margin: 0,
                            padding: "9px 11px",
                            borderRadius: 4,
                            background: "rgba(0,0,0,0.2)",
                            border: `1px solid ${AM.border}`,
                            maxHeight: 260,
                            overflowY: "auto",
                          }}>
                            {pkg.text}
                          </pre>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {selectedEvent.note && (
                  <div style={{ marginBottom: 18, padding: "11px 15px", borderRadius: 6, background: "rgba(90,155,200,0.03)", border: "1px solid rgba(90,155,200,0.1)", borderLeft: "2px solid rgba(90,155,200,0.35)" }}>
                    <div style={{ fontSize: "0.4rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(90,155,200,0.5)", marginBottom: 7 }}>
                      significance
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--fg-3)", lineHeight: 1.75 }}>
                      {selectedEvent.note}
                    </div>
                  </div>
                )}

                {selectedEvent.subscribers?.length > 0 && (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: "0.4rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 7 }}>
                      rooms subscribed
                    </div>
                    <div style={{ display: "flex", gap: 5 }}>
                      {selectedEvent.subscribers.map(room => (
                        <span key={room} style={{
                          padding: "3px 8px",
                          borderRadius: 4,
                          fontSize: "0.48rem",
                          fontFamily: "monospace",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: ROOM_COLORS[room] || "var(--fg-4)",
                          border: `1px solid ${(ROOM_COLORS[room] || "#ffffff") + "30"}`,
                          background: (ROOM_COLORS[room] || "#ffffff") + "08",
                        }}>
                          {room}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEvent.declarationRefs?.length > 0 && (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: "0.4rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 7 }}>
                      linked declarations
                    </div>
                    {selectedEvent.declarationRefs.map(ref => (
                      <div key={ref} style={{ fontSize: "0.58rem", fontFamily: "monospace", color: AM.primary, marginBottom: 3 }}>
                        ↳ {ref}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : selected ? (
              <div style={{ padding: "24px 28px 20px" }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}>
                  <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: AM.primary + "70" }}>
                    {selected.type} · {selected.category}
                  </div>
                  {selected.importance && (
                    <div style={{
                      fontSize: "0.4rem",
                      fontFamily: "monospace",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      padding: "2px 6px",
                      borderRadius: 3,
                      color: selected.importance === IMPORTANCE.FOUNDATIONAL ? "#e8a87c" : "var(--fg-4)",
                      background: selected.importance === IMPORTANCE.FOUNDATIONAL ? "rgba(232,168,124,0.1)" : "transparent",
                      border: `1px solid ${selected.importance === IMPORTANCE.FOUNDATIONAL ? "#e8a87c30" : "var(--border-lo)"}`,
                    }}>
                      {selected.importance}
                    </div>
                  )}
                </div>

                <div style={{
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  color: "var(--fg)",
                  lineHeight: 1.45,
                  marginBottom: 16,
                  letterSpacing: "-0.01em",
                }}>
                  {selected.label}
                </div>

                {/* Doctrine Health Score + Drift + Risk Forecast */}
                {(() => {
                  const h        = getDoctineHealth(selected)
                  const hc       = healthColor(h.total)
                  const history  = getDriftHistory(selected.id, 7)
                  const drift    = getDoctrineDrift(selected.id, h.total)
                  const forecast = getDoctineRiskForecast(selected.id, h.total)
                  const DIMS = [
                    { key: "freshness",  label: "fresh",    max: 25 },
                    { key: "references", label: "refs",     max: 25 },
                    { key: "scrutiny",   label: "scrutiny", max: 20 },
                    { key: "conflicts",  label: "conflict", max: 20 },
                    { key: "reviews",    label: "reviews",  max: 10 },
                  ]
                  const spark = history.length >= 2
                    ? [...history].reverse().map(({ score }) =>
                        score >= 80 ? "▇" : score >= 65 ? "▅" : score >= 50 ? "▄" : score >= 35 ? "▃" : "▂"
                      ).join("")
                    : null
                  return (
                    <>
                      {/* Health panel */}
                      <div style={{ marginBottom: forecast ? 6 : 20, padding: "10px 14px", borderRadius: 5, background: AM.card, border: `1px solid ${AM.border}` }}>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 7 }}>
                          <div style={{ fontSize: "0.4rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-4)" }}>
                            doctrine health
                          </div>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                            {drift && Math.abs(drift.delta) >= 5 && (
                              <div style={{
                                fontSize: "0.42rem",
                                fontFamily: "monospace",
                                color: drift.delta > 0 ? "#4cd964" : "#ff9f43",
                                letterSpacing: "0.04em",
                              }}>
                                {drift.delta > 0 ? "▲" : "▼"} {Math.abs(drift.delta)} · {drift.daysAgo === 0 ? "today" : `${drift.daysAgo}d`}
                              </div>
                            )}
                            <div style={{ fontSize: "1rem", fontWeight: 200, color: hc, lineHeight: 1 }}>
                              {h.total}
                            </div>
                          </div>
                        </div>
                        <div style={{ height: 2, background: AM.border, borderRadius: 1, marginBottom: 8 }}>
                          <div style={{ height: "100%", width: `${h.total}%`, background: hc, borderRadius: 1, transition: "width 0.4s ease" }} />
                        </div>
                        {spark && (
                          <div style={{
                            fontSize: "0.62rem",
                            fontFamily: "monospace",
                            letterSpacing: "0.1em",
                            color: drift && drift.delta < -5 ? "#ff9f43" : "var(--fg-4)",
                            marginBottom: 8,
                            opacity: 0.7,
                          }}>
                            {spark}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 10 }}>
                          {DIMS.map(({ key, label, max }) => (
                            <div key={key} style={{ flex: 1, textAlign: "center" }}>
                              <div style={{
                                fontSize: "0.56rem",
                                fontWeight: 700,
                                color: h.breakdown[key] === max ? hc : "var(--fg-3)",
                                lineHeight: 1,
                                marginBottom: 3,
                              }}>
                                {h.breakdown[key]}
                              </div>
                              <div style={{ fontSize: "0.36rem", fontFamily: "monospace", color: "var(--fg-4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                                {label}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Risk Forecast — only shown when trend is negative */}
                      {forecast && (
                        <div style={{
                          marginBottom: 20,
                          padding: "9px 14px",
                          borderRadius: 5,
                          background: "rgba(255,107,107,0.03)",
                          border: "1px solid rgba(255,107,107,0.12)",
                        }}>
                          <div style={{
                            fontSize: "0.4rem",
                            fontFamily: "monospace",
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            color: "var(--fg-4)",
                            marginBottom: 9,
                          }}>
                            risk forecast · −{forecast.ratePerDay} pts/day
                          </div>
                          <div style={{ display: "flex", gap: 18 }}>
                            {forecast.forecasts.map(({ days, score }) => (
                              <div key={days} style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "0.9rem", fontWeight: 200, color: healthColor(score), lineHeight: 1, marginBottom: 4 }}>
                                  {score}
                                </div>
                                <div style={{ fontSize: "0.38rem", fontFamily: "monospace", color: "var(--fg-4)", letterSpacing: "0.08em" }}>
                                  {days}d
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}

                <div style={{
                  fontSize: "0.8rem",
                  color: "var(--fg-2)",
                  lineHeight: 1.95,
                  marginBottom: selected.wound ? 14 : 24,
                }}>
                  {selected.content}
                </div>

                {selected.wound && (
                  <div style={{
                    padding: "11px 15px",
                    borderRadius: 6,
                    background: "rgba(255,107,107,0.03)",
                    border: "1px solid rgba(255,107,107,0.1)",
                    borderLeft: "2px solid rgba(255,107,107,0.35)",
                    marginBottom: 16,
                  }}>
                    <div style={{ fontSize: "0.4rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,107,107,0.5)", marginBottom: 7 }}>
                      founding wound
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--fg-3)", lineHeight: 1.75, fontStyle: "italic" }}>
                      {selected.wound}
                    </div>
                  </div>
                )}

                {selected.originTension && (
                  <div style={{
                    padding: "12px 16px",
                    borderRadius: 6,
                    background: AM.dim,
                    border: `1px solid ${AM.primary}18`,
                    fontSize: "0.62rem",
                    color: "var(--fg-3)",
                    fontFamily: "monospace",
                    lineHeight: 1.8,
                    marginBottom: 16,
                  }}>
                    <span style={{ color: AM.primary }}>↳ chain of custody</span>
                    <br />
                    originated from KODEX tension
                    <br />
                    <span style={{ color: "var(--fg-4)", fontSize: "0.54rem" }}>
                      {selected.originTension}
                    </span>
                  </div>
                )}

                {selected.conflicts?.length > 0 && (
                  <div style={{
                    padding: "12px 16px",
                    borderRadius: 6,
                    background: "rgba(255,107,107,0.04)",
                    border: "1px solid rgba(255,107,107,0.15)",
                    fontSize: "0.62rem",
                    color: "var(--fg-3)",
                    fontFamily: "monospace",
                    lineHeight: 1.8,
                    marginBottom: 16,
                  }}>
                    <span style={{ color: "#ff6b6b" }}>⚡ conflicts declared</span>
                    {selected.conflicts.map((c, i) => (
                      <div key={i} style={{ marginTop: 4, fontSize: "0.54rem", color: "var(--fg-4)" }}>
                        ↔ {c.id}{c.note ? ` — ${c.note}` : ""}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{
                  fontSize: "0.48rem",
                  fontFamily: "monospace",
                  color: "var(--fg-4)",
                  letterSpacing: "0.08em",
                  lineHeight: 1.9,
                  marginBottom: 24,
                }}>
                  <div>recorded {new Date(selected.createdAt).toLocaleDateString([], {
                    weekday: "long", year: "numeric", month: "long", day: "numeric"
                  })}</div>
                  {selected.lastReferenced && (
                    <div>last referenced {new Date(selected.lastReferenced).toLocaleDateString([], {
                      month: "short", day: "numeric", year: "numeric"
                    })}</div>
                  )}
                  {!selected.lastReferenced && (
                    <div style={{ fontStyle: "italic" }}>never referenced by AI</div>
                  )}
                </div>

                <ChallengeHistory declarationId={selected.id} />
              </div>
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: "0.52rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--fg-4)", opacity: 0.35 }}>
                  {leftTab === "query" ? "select a result" : "select a record"}
                </div>
              </div>
            )}
          </div>

          {/* Consultation — archivist messages, compact */}
          {(archivistMsgs.length > 0 || thinking) && (
            <div style={{
              maxHeight: 210,
              overflowY: "auto",
              borderTop: `1px solid ${AM.border}`,
              padding: "10px 20px 6px",
              background: AM.card,
              flexShrink: 0,
            }}>
              <div style={{
                fontSize: "0.42rem",
                fontFamily: "monospace",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--fg-4)",
                marginBottom: 10,
              }}>consultation</div>

              {archivistMsgs.map((m, i) => (
                <div key={i} style={{
                  marginBottom: 10,
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                  flexDirection: m.role === "user" ? "row-reverse" : "row",
                }}>
                  <span style={{
                    fontSize: "0.38rem",
                    fontFamily: "monospace",
                    letterSpacing: "0.1em",
                    color: m.role === "user" ? "var(--fg-4)" : AM.primary,
                    textTransform: "uppercase",
                    paddingTop: 3,
                    flexShrink: 0,
                  }}>
                    {m.role === "user" ? "you" : m.role === "error" ? "error" : "archivist"}
                  </span>
                  <div style={{
                    fontSize: "0.72rem",
                    color: m.role === "user" ? "var(--fg-3)" : m.role === "error" ? "#ff6b6b" : "var(--fg-2)",
                    lineHeight: 1.7,
                    maxWidth: "88%",
                  }}>
                    {formatMessage(m.text)}
                  </div>
                </div>
              ))}

              {thinking && (
                <div style={{ display: "flex", gap: 6, alignItems: "center", paddingBottom: 4 }}>
                  <span style={{ fontSize: "0.38rem", fontFamily: "monospace", color: AM.primary, textTransform: "uppercase", letterSpacing: "0.1em" }}>archivist</span>
                  {[0, 0.2, 0.4].map((d, i) => (
                    <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: AM.primary, animation: `blink 1.1s ${d}s infinite` }} />
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Input bar */}
          <div style={{
            borderTop: `1px solid ${AM.border}`,
            padding: "10px 16px",
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexShrink: 0,
            background: AM.bg,
          }}>
            <input
              value={input}
              onChange={e => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Record something…"
              style={{
                flex: 1,
                background: "rgba(200,149,90,0.04)",
                border: `1px solid ${AM.border}`,
                borderRadius: 6,
                padding: "9px 13px",
                fontSize: "0.78rem",
                color: "var(--fg)",
                outline: "none",
                fontFamily: "inherit",
                transition: "border-color 0.15s",
              }}
              onFocus={e => e.target.style.borderColor = AM.primary + "45"}
              onBlur={e => e.target.style.borderColor = AM.border}
            />
            <button
              onClick={() => onSend()}
              disabled={!input.trim() || thinking}
              style={{
                padding: "9px 18px",
                borderRadius: 6,
                background: input.trim() && !thinking ? AM.dim : "transparent",
                border: `1px solid ${input.trim() && !thinking ? AM.primary + "40" : AM.border}`,
                color: input.trim() && !thinking ? AM.primary : "var(--fg-4)",
                fontSize: "0.58rem",
                fontFamily: "monospace",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                cursor: input.trim() && !thinking ? "pointer" : "default",
                transition: "all 0.15s",
                flexShrink: 0,
              }}>
              record
            </button>
          </div>

        </div>
      </div>
    </div>

    {captureOpen && (
      <EventCapture
        onDismiss={() => setCaptureOpen(false)}
        onRecorded={() => {
          setEvents(getEvents())
          setLeftTab("events")
          setCaptureOpen(false)
        }}
      />
    )}
  </>
  )
}
