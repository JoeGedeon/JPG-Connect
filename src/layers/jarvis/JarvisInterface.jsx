// src/layers/jarvis/JarvisInterface.jsx
// PACER conversation engine — messages, history, TTS
// Routes archivist → ArchivistRoom, creative → KodexRoom. OPS + KEL remain here.

import { useState, useRef, useEffect } from "react"
import { LANE_MAP, STARTERS } from "../../config/lanes.js"
import { SYSTEM_MAP } from "../../config/prompts.js"
import { saveStorage, loadStorage, formatTime } from "../../utils/storage.js"
import { formatMessage } from "../../utils/formatMessage.jsx"
import { sendChat } from "../../api/chat.js"
import { speak, stopSpeaking } from "../../engine/voice.js"
import { buildCanonContext, loadOpenTensions, getDoctrineDebt } from "../../engine/canon.js"
import { ingestFleetFlowEvent, FF_DEMO_EVENTS, getEvents, getIntelligenceStats, buildVERAMemoryContext } from "../../engine/events.js"
import { detectDecisionSignals, extractContext, MOMENT_TYPES } from "../../engine/moments.js"
import DeclarableMoment from "../../components/DeclarableMoment.jsx"
import JarvisBar from "./JarvisBar.jsx"
import ArchivistRoom from "../archivist/ArchivistRoom.jsx"
import KodexRoom from "../kodex/KodexRoom.jsx"
import VERARoom from "../vera/VERARoom.jsx"

export default function JarvisInterface({
  lane,
  voiceEnabled,
  onToggleVoice,
  threadsOpen,
  commandOpen,
  onOpenThreads,
  onOpenCommand,
  prefill,
  onClearPrefill,
  onGoTo,
  focusDeclarationId,
  savedMessages,
  savedHistory,
}) {
  const [messages, setMessages]         = useState(() => savedMessages || [])
  const [input, setInput]               = useState("")
  const [thinking, setThinking]         = useState(false)
  const [saveStatus, setSaveStatus]     = useState("ok")
  const [currentMoment, setCurrentMoment] = useState(null)
  const [hoveredMsg, setHoveredMsg]     = useState(null)

  const initialHistory = savedHistory || { ops: [], creative: [], kel: [], archivist: [], vera: [] }
  if (!initialHistory.kel && initialHistory.claw) {
    initialHistory.kel = initialHistory.claw
    delete initialHistory.claw
  }
  if (!initialHistory.archivist) initialHistory.archivist = []
  if (!initialHistory.vera)     initialHistory.vera     = []

  const historyRef = useRef(initialHistory)
  const bottomRef  = useRef(null)
  const prevLane   = useRef(lane)

  useEffect(() => {
    const status = saveStorage({
      lane,
      messages:         messages.slice(-200),
      opsHistory:       historyRef.current.ops.slice(-40),
      creativeHistory:  historyRef.current.creative.slice(-40),
      kelHistory:       historyRef.current.kel.slice(-40),
      archivistHistory: historyRef.current.archivist.slice(-40),
      veraHistory:      historyRef.current.vera.slice(-40),
    })
    setSaveStatus(status)
  }, [lane, messages])

  useEffect(() => {
    if (prevLane.current !== lane) {
      stopSpeaking()
      setMessages(prev => [
        ...prev,
        { type: "divider", text: `→ ${LANE_MAP[lane].label}`, ts: Date.now() },
      ])
      prevLane.current = lane
    }
  }, [lane])

  useEffect(() => {
    if (prefill) {
      setInput(prefill)
      onClearPrefill?.()
    }
  }, [prefill])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, thinking])

  useEffect(() => () => stopSpeaking(), [])

  function handleFile(file) {
    setMessages(prev => [...prev, {
      role: "user",
      text: `[Attached: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]`,
      lane,
      ts: Date.now(),
    }])
  }

  async function send(prefillText) {
    const msg = (prefillText !== undefined ? prefillText : input).trim()
    if (!msg || thinking) return
    stopSpeaking()

    const laneAtSend = lane
    setInput("")
    setMessages(prev => [...prev, { role: "user", text: msg, lane: laneAtSend, ts: Date.now() }])

    const history    = historyRef.current[laneAtSend] || []
    const newHistory = [...history, { role: "user", content: msg }]
    historyRef.current[laneAtSend] = newHistory
    setThinking(true)

    try {
      const baseSystem  = SYSTEM_MAP[laneAtSend] || ""
      const canonCtx    = buildCanonContext(laneAtSend)
      const ledgerCtx   = laneAtSend === "vera" ? buildVERAMemoryContext(msg) : ""
      const reply = await sendChat({ lane: laneAtSend, system: baseSystem + canonCtx + ledgerCtx, messages: newHistory.slice(-20) })
      historyRef.current[laneAtSend] = [...newHistory, { role: "assistant", content: reply }].slice(-40)
      setMessages(prev => [...prev, {
        role: "bot",
        text: reply,
        lane: laneAtSend,
        ts: Date.now(),
        spoken: voiceEnabled,
      }])
      if (voiceEnabled) speak(reply)

      // Declarable moment detection — OPS and KEL lanes only
      if ((laneAtSend === "ops" || laneAtSend === "kel") && detectDecisionSignals(reply)) {
        setCurrentMoment({
          type:           MOMENT_TYPES.DECISION_DETECTED,
          category:       laneAtSend,
          context:        extractContext(reply),
          prefillContent: extractContext(reply),
        })
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "error", text: err.message, ts: Date.now() }])
    }

    setThinking(false)
  }

  // ── Room content ──────────────────────────────────────────────────────────────

  let roomContent

  if (lane === "archivist") {
    roomContent = (
      <ArchivistRoom
        messages={messages}
        thinking={thinking}
        input={input}
        onInputChange={setInput}
        onSend={send}
        voiceEnabled={voiceEnabled}
        focusDeclarationId={focusDeclarationId}
        onMoment={setCurrentMoment}
      />
    )
  } else if (lane === "creative") {
    roomContent = (
      <KodexRoom
        messages={messages}
        thinking={thinking}
        input={input}
        onInputChange={setInput}
        onSend={send}
        voiceEnabled={voiceEnabled}
        onMoment={setCurrentMoment}
      />
    )
  } else if (lane === "vera") {
    roomContent = (
      <VERARoom
        messages={messages}
        thinking={thinking}
        input={input}
        onInputChange={setInput}
        onSend={send}
        voiceEnabled={voiceEnabled}
        onGoTo={onGoTo}
        saveStatus={saveStatus}
        onMoment={setCurrentMoment}
      />
    )
  } else {
    // ── OPS + KEL: standard chat shell ─────────────────────────────────────────

    const laneConfig = LANE_MAP[lane]
    const { color: primary, dim } = laneConfig

    roomContent = (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 0" }}>
          <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 20px", display: "flex", flexDirection: "column", gap: 16 }}>

            {messages.length === 0 && (
              lane === "ops" ? (
                <OpsBoard lc={laneConfig} onSend={send} />
              ) : lane === "kel" ? (
                <KELBoard lc={laneConfig} onSend={send} />
              ) : (
                <div style={{ textAlign: "center", paddingTop: 52, paddingBottom: 20 }}>
                  <div style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 5, color: "var(--fg)" }}>{laneConfig.label}</div>
                  <div style={{ fontSize: "0.74rem", color: "var(--fg-3)", marginBottom: 24 }}>{laneConfig.subtitle}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                    {(STARTERS[lane] || []).map((s, i) => (
                      <div key={i} onClick={() => send(s)}
                        style={{ padding: "7px 13px", border: "1px solid var(--border)", borderRadius: 6, fontSize: "0.74rem", color: "var(--fg-3)", cursor: "pointer", background: "var(--bg-card)", transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = primary; e.currentTarget.style.color = "var(--fg)"; e.currentTarget.style.background = dim }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--fg-3)"; e.currentTarget.style.background = "var(--bg-card)" }}>
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {messages
              .filter(m => m.lane !== "archivist" && m.lane !== "creative" && m.lane !== "vera")
              .map((m, i) => {
                if (m.type === "divider") return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, height: 1, background: "var(--border-lo)" }} />
                    <span style={{ fontSize: "0.54rem", color: "var(--fg-4)", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase" }}>{m.text}</span>
                    <div style={{ flex: 1, height: 1, background: "var(--border-lo)" }} />
                  </div>
                )

                if (m.role === "error") return (
                  <div key={i} style={{ padding: "8px 12px", borderRadius: 8, fontSize: "0.76rem", color: "#ff6b6b", background: "rgba(255,107,107,0.07)", border: "1px solid rgba(255,107,107,0.15)", fontFamily: "monospace" }}>
                    Error: {m.text}
                  </div>
                )

                if (!m.role) return null

                const isUser = m.role === "user"
                const mc     = LANE_MAP[m.lane] || laneConfig

                return (
                  <div
                    key={i}
                    style={{ display: "flex", gap: 10, flexDirection: isUser ? "row-reverse" : "row", animation: "fadeUp 0.2s ease", position: "relative" }}
                    onMouseEnter={() => setHoveredMsg(i)}
                    onMouseLeave={() => setHoveredMsg(null)}
                  >
                    <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.5rem", fontWeight: 800, letterSpacing: "0.06em", flexShrink: 0, marginTop: 4, background: isUser ? "var(--bg-card)" : mc.dim, border: isUser ? "1px solid var(--border)" : `1px solid ${mc.color}40`, color: isUser ? "var(--fg-3)" : mc.color }}>
                      {isUser ? "J" : "P"}
                    </div>
                    <div style={{ maxWidth: "82%", display: "flex", flexDirection: "column", gap: 4, alignItems: isUser ? "flex-end" : "flex-start" }}>
                      {!isUser && (
                        <div style={{ fontSize: "0.52rem", fontFamily: "monospace", letterSpacing: "0.12em", color: mc.color, textTransform: "uppercase", paddingLeft: 2 }}>
                          {mc.label}
                        </div>
                      )}
                      <div style={{ padding: "10px 14px", borderRadius: 10, fontSize: "0.84rem", lineHeight: 1.82, background: isUser ? "var(--bg-card)" : "var(--bg-panel)", border: "1px solid var(--border)", borderLeft: !isUser ? `2px solid ${mc.color}` : undefined, borderTopRightRadius: isUser ? 2 : 10, borderTopLeftRadius: !isUser ? 2 : 10, color: "var(--fg-body)" }}>
                        {formatMessage(m.text)}
                      </div>
                      <div style={{ fontSize: "0.54rem", color: "var(--fg-4)", fontFamily: "monospace", display: "flex", gap: 8, alignItems: "center" }}>
                        {formatTime(m.ts)}
                        {m.spoken && <span style={{ color: mc.color, opacity: 0.55 }}>◎</span>}
                        {/* Capture button — appears on hover for bot messages */}
                        {!isUser && hoveredMsg === i && (
                          <button
                            onClick={() => setCurrentMoment({
                              type:           MOMENT_TYPES.MANUAL_CAPTURE,
                              category:       m.lane || lane,
                              context:        extractContext(m.text),
                              prefillContent: extractContext(m.text),
                            })}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--fg-4)",
                              fontSize: "0.52rem",
                              fontFamily: "monospace",
                              letterSpacing: "0.08em",
                              padding: "0 2px",
                              opacity: 0.65,
                              transition: "opacity 0.15s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "#00c896" }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = "0.65"; e.currentTarget.style.color = "var(--fg-4)" }}
                          >
                            ◎ capture
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

            {thinking && (
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.5rem", fontWeight: 800, background: dim, border: `1px solid ${primary}40`, color: primary, flexShrink: 0, marginTop: 4 }}>P</div>
                <div style={{ padding: "12px 15px", borderRadius: 10, borderTopLeftRadius: 2, background: "var(--bg-panel)", border: "1px solid var(--border)", borderLeft: `2px solid ${primary}`, display: "flex", gap: 5, alignItems: "center" }}>
                  {[0, 0.18, 0.36].map((d, i) => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: primary, animation: `blink 1.1s ${d}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        <JarvisBar
          laneConfig={laneConfig}
          voiceEnabled={voiceEnabled}
          thinking={thinking}
          threadsOpen={threadsOpen}
          commandOpen={commandOpen}
          onToggleVoice={onToggleVoice}
          onOpenThreads={onOpenThreads}
          onOpenCommand={onOpenCommand}
          input={input}
          onInputChange={setInput}
          onSend={() => send()}
          onFileSelect={handleFile}
        />
      </div>
    )
  }

  return (
    <>
      {roomContent}
      {currentMoment && (
        <DeclarableMoment
          moment={currentMoment}
          onDismiss={() => setCurrentMoment(null)}
          onDeclared={() => setCurrentMoment(null)}
        />
      )}
    </>
  )
}

// ── OpsBoard ──────────────────────────────────────────────────────────────────

function PACERStack() {
  const events       = getEvents()
  const stats        = getIntelligenceStats()
  const ffCount      = events.filter(e => e.source === "fleetflow").length
  const manualCount  = events.filter(e => e.source === "manual").length
  const total        = events.length

  const sourceSub = [
    ffCount   ? `FleetFlow (${ffCount})` : "FleetFlow",
    manualCount ? `Manual (${manualCount})` : "Manual",
    "API-ready",
  ].join(" · ")

  const LAYERS = [
    {
      id:      "reality",
      label:   "Reality",
      sub:     "Boxes move. Money changes hands. Humans create expensive chaos.",
      color:   "var(--fg-4)",
      right:   null,
    },
    {
      id:      "sources",
      label:   "Sources",
      sub:     sourceSub,
      color:   "#5a9bc8",
      pill:    "data origin",
      right:   "any system can emit",
    },
    {
      id:      "ledger",
      label:   "Event Ledger",
      sub:     "The hub — all sources converge here · append-only · immutable",
      color:   "#c8955a",
      pill:    "memory hub",
      right:   total
        ? `${total} events · ${stats.attributedCount} attributed · ${stats.gapCount} gap${stats.gapCount !== 1 ? "s" : ""}`
        : "empty",
    },
    {
      id:      "pacer",
      label:   "PACER",
      sub:     "Observe · Remember · Explain · Predict",
      color:   "#7bc85a",
      pill:    "intelligence",
      right:   stats.totalEvents >= 10 ? "patterns visible" : "accumulating",
    },
    {
      id:      "kel",
      label:   "K.E.L.",
      sub:     "Document — the Ledger writes, K.E.L. signs",
      color:   "rgba(76,217,100,0.85)",
      pill:    "evidence",
      right:   "7 report types",
    },
    {
      id:      "vera",
      label:   "VERA",
      sub:     "Witness — speaks from memory, not inference",
      color:   "#8daac4",
      pill:    "decision",
      right:   "ledger-grounded",
    },
    {
      id:      "output",
      label:   "Evidence · Reports · Claims · Audits · Decisions",
      color:   "var(--fg-4)",
      isBottom: true,
    },
  ]

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 12 }}>
        architecture · live
      </div>

      {LAYERS.map((layer, i) => (
        <div key={layer.id}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: layer.isBottom ? "4px 10px" : "8px 12px",
            borderRadius: 5,
            background: layer.isBottom ? "transparent" : "var(--bg-card)",
            border: layer.isBottom ? "none" : `1px solid ${layer.color}18`,
            borderLeft: layer.isBottom ? "none" : `2px solid ${layer.color}45`,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: layer.isBottom ? "0.42rem" : "0.56rem",
                fontWeight: layer.isBottom ? 400 : 600,
                color: layer.color,
                fontFamily: layer.isBottom ? "monospace" : "inherit",
                letterSpacing: layer.isBottom ? "0.08em" : "0.01em",
              }}>
                {layer.label}
              </div>
              {layer.sub && (
                <div style={{ fontSize: "0.4rem", fontFamily: "monospace", color: "var(--fg-4)", marginTop: 2, letterSpacing: "0.04em" }}>
                  {layer.sub}
                </div>
              )}
            </div>
            {layer.pill && (
              <div style={{ fontSize: "0.34rem", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 6px", borderRadius: 3, border: `1px solid ${layer.color}20`, color: `${layer.color}65`, flexShrink: 0 }}>
                {layer.pill}
              </div>
            )}
            {layer.right && (
              <div style={{ fontSize: "0.38rem", fontFamily: "monospace", color: `${layer.color}70`, letterSpacing: "0.04em", flexShrink: 0, textAlign: "right" }}>
                {layer.right}
              </div>
            )}
          </div>

          {i < LAYERS.length - 1 && !layer.isBottom && (
            <div style={{ display: "flex", justifyContent: "center", height: 10, alignItems: "center" }}>
              <div style={{ width: 1, height: "100%", background: "var(--border)", opacity: 0.5 }} />
            </div>
          )}
        </div>
      ))}

      <div style={{ marginTop: 10, fontSize: "0.4rem", fontFamily: "monospace", color: "var(--fg-4)", opacity: 0.38, letterSpacing: "0.04em", lineHeight: 1.9 }}>
        FleetFlow emits · PACER remembers · K.E.L. doesn't write — the Ledger writes · VERA speaks from memory
      </div>
    </div>
  )
}

function IntelligenceLayer() {
  const stats = getIntelligenceStats()

  const decisionPct  = Math.min(stats.attributedCount / stats.attributedThreshold, 1)
  const patternPct   = Math.min(stats.maxTypeDensity  / stats.patternThreshold, 1)

  const decisionReady = decisionPct >= 1
  const patternReady  = patternPct  >= 1
  const gapsClean     = stats.gapCount === 0

  function ProgressBar({ pct, color }) {
    return (
      <div style={{ height: 2, background: "#1d1d38", borderRadius: 1, marginTop: 5 }}>
        <div style={{ height: "100%", width: `${Math.round(pct * 100)}%`, background: color, borderRadius: 1, transition: "width 0.4s ease" }} />
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "#7bc85a" }}>
          decision intelligence
        </div>
        <div style={{ fontSize: "0.4rem", fontFamily: "monospace", color: "var(--fg-4)", letterSpacing: "0.06em" }}>
          {stats.totalEvents} events total
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>

        {/* Decision Quality */}
        <div style={{
          padding: "10px 12px",
          borderRadius: 6,
          background: "var(--bg-card)",
          border: `1px solid ${decisionReady ? "#7bc85a30" : "var(--border)"}`,
          borderLeft: `2px solid ${decisionReady ? "#7bc85a" : "#1d1d38"}`,
        }}>
          <div style={{ fontSize: "0.52rem", fontWeight: 600, color: decisionReady ? "#7bc85a" : "var(--fg-3)", letterSpacing: "0.06em", marginBottom: 2 }}>
            Decision Quality
          </div>
          <div style={{ fontSize: "0.46rem", color: "var(--fg-4)", lineHeight: 1.5, marginBottom: 3 }}>
            {decisionReady
              ? "Active — approver patterns visible"
              : "Which approvers make the best calls?"}
          </div>
          <div style={{ fontSize: "0.44rem", fontFamily: "monospace", color: decisionReady ? "#7bc85a" : "var(--fg-4)" }}>
            {decisionReady ? "✓ threshold met" : `${stats.attributedCount} / ${stats.attributedThreshold} attributed events`}
          </div>
          {!decisionReady && <ProgressBar pct={decisionPct} color="#7bc85a60" />}
        </div>

        {/* Pattern Recognition */}
        <div style={{
          padding: "10px 12px",
          borderRadius: 6,
          background: "var(--bg-card)",
          border: `1px solid ${patternReady ? "#5a9bc830" : "var(--border)"}`,
          borderLeft: `2px solid ${patternReady ? "#5a9bc8" : "#1d1d38"}`,
        }}>
          <div style={{ fontSize: "0.52rem", fontWeight: 600, color: patternReady ? "#5a9bc8" : "var(--fg-3)", letterSpacing: "0.06em", marginBottom: 2 }}>
            Pattern Recognition
          </div>
          <div style={{ fontSize: "0.46rem", color: "var(--fg-4)", lineHeight: 1.5, marginBottom: 3 }}>
            {patternReady
              ? "Active — recurring patterns detectable"
              : "What repeats across event types?"}
          </div>
          <div style={{ fontSize: "0.44rem", fontFamily: "monospace", color: patternReady ? "#5a9bc8" : "var(--fg-4)" }}>
            {patternReady ? "✓ threshold met" : `${stats.maxTypeDensity} / ${stats.patternThreshold} densest type`}
          </div>
          {!patternReady && <ProgressBar pct={patternPct} color="#5a9bc860" />}
        </div>

        {/* Accountability Gaps */}
        <div style={{
          padding: "10px 12px",
          borderRadius: 6,
          background: "var(--bg-card)",
          border: `1px solid ${gapsClean ? "rgba(76,217,100,0.15)" : "rgba(255,107,107,0.15)"}`,
          borderLeft: `2px solid ${gapsClean ? "rgba(76,217,100,0.5)" : "rgba(255,107,107,0.5)"}`,
        }}>
          <div style={{ fontSize: "0.52rem", fontWeight: 600, color: gapsClean ? "#4cd964" : "#ff6b6b", letterSpacing: "0.06em", marginBottom: 2 }}>
            Accountability Gaps
          </div>
          <div style={{ fontSize: "0.46rem", color: "var(--fg-4)", lineHeight: 1.5, marginBottom: 3 }}>
            {gapsClean
              ? "All events have a named approver"
              : `${stats.gapCount} event${stats.gapCount !== 1 ? "s" : ""} missing approver attribution`}
          </div>
          {!gapsClean && stats.recentGaps.length > 0 && (
            <div style={{ marginTop: 4 }}>
              {stats.recentGaps.slice(0, 2).map(g => (
                <div key={g.id} style={{ fontSize: "0.4rem", fontFamily: "monospace", color: "#ff6b6b80", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {g.id}: {g.description?.slice(0, 40) || g.type}…
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Learning Velocity */}
        <div style={{
          padding: "10px 12px",
          borderRadius: 6,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderLeft: "2px solid #1d1d38",
        }}>
          <div style={{ fontSize: "0.52rem", fontWeight: 600, color: "var(--fg-3)", letterSpacing: "0.06em", marginBottom: 2 }}>
            Learning Velocity
          </div>
          <div style={{ fontSize: "0.46rem", color: "var(--fg-4)", lineHeight: 1.5, marginBottom: 3 }}>
            How fast does decision quality improve after doctrine updates?
          </div>
          <div style={{ fontSize: "0.44rem", fontFamily: "monospace", color: "var(--fg-4)" }}>
            {stats.velocityReady
              ? "Baseline calculable — check ARCHIVIST"
              : `Baseline period · needs ${Math.max(0, 10 - stats.attributedCount)} more attributed events`}
          </div>
        </div>

      </div>

      <div style={{ marginTop: 7, fontSize: "0.4rem", fontFamily: "monospace", color: "var(--fg-4)", opacity: 0.45, letterSpacing: "0.04em" }}>
        The history is the intelligence. Each attributed event moves these thresholds.
      </div>
    </div>
  )
}

function FleetFlowFeed({ lc }) {
  const [ingested, setIngested] = useState(() => new Set(getEvents().filter(e => e.source === "fleetflow").map(e => e.description)))
  const [lastIn, setLastIn]     = useState(null)

  function simulate(demo) {
    const ev = ingestFleetFlowEvent(demo)
    setIngested(prev => new Set([...prev, demo.ff_description]))
    setLastIn(ev.id)
  }

  const liveCount = getEvents().filter(e => e.source === "fleetflow").length

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "#5a9bc8" }}>
          fleetflow feed
        </div>
        <div style={{ fontSize: "0.42rem", fontFamily: "monospace", color: "var(--fg-4)", letterSpacing: "0.08em" }}>
          {liveCount} event{liveCount !== 1 ? "s" : ""} in ledger · source: fleetflow
        </div>
      </div>

      {lastIn && (
        <div style={{ marginBottom: 8, padding: "7px 11px", borderRadius: 5, background: "rgba(90,155,200,0.06)", border: "1px solid rgba(90,155,200,0.2)", fontSize: "0.52rem", fontFamily: "monospace", color: "#5a9bc8", letterSpacing: "0.06em" }}>
          ↳ {lastIn} recorded in ARCHIVIST
        </div>
      )}

      <div style={{ fontSize: "0.4rem", fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 6, opacity: 0.7 }}>
        demo events — simulate FleetFlow → ARCHIVIST ingestion
      </div>

      {FF_DEMO_EVENTS.map((demo, i) => {
        const done = ingested.has(demo.ff_description)
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 10,
              marginBottom: 6,
              padding: "9px 12px",
              borderRadius: 6,
              background: done ? "rgba(90,155,200,0.04)" : "var(--bg-card)",
              border: `1px solid ${done ? "rgba(90,155,200,0.2)" : "var(--border)"}`,
              transition: "all 0.2s",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.58rem", color: done ? "#5a9bc8" : "var(--fg-2)", lineHeight: 1.4, marginBottom: 3 }}>
                {demo.ff_description}
              </div>
              <div style={{ fontSize: "0.42rem", fontFamily: "monospace", color: "var(--fg-4)", letterSpacing: "0.06em" }}>
                {demo.ff_job_id && `${demo.ff_job_id} · `}
                {new Date(demo.ff_timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                {demo.ff_amount && ` · $${demo.ff_amount.toLocaleString()}`}
              </div>
            </div>
            <button
              onClick={() => !done && simulate(demo)}
              disabled={done}
              style={{
                padding: "5px 10px",
                borderRadius: 4,
                border: `1px solid ${done ? "rgba(90,155,200,0.2)" : "#5a9bc840"}`,
                background: done ? "rgba(90,155,200,0.06)" : "transparent",
                color: done ? "#5a9bc8" : "var(--fg-4)",
                fontSize: "0.46rem",
                fontFamily: "monospace",
                letterSpacing: "0.08em",
                cursor: done ? "default" : "pointer",
                flexShrink: 0,
                transition: "all 0.15s",
              }}
            >
              {done ? "✓ ingested" : "ingest →"}
            </button>
          </div>
        )
      })}

      <div style={{ marginTop: 6, fontSize: "0.4rem", fontFamily: "monospace", color: "var(--fg-4)", opacity: 0.5, letterSpacing: "0.06em" }}>
        ingested events appear in ARCHIVIST → Events tab
      </div>
    </div>
  )
}

function OpsBoard({ lc, onSend }) {
  const tasks        = loadStorage()?.tasks || []
  const pending      = tasks.filter(t => t.status === "pending").length
  const active       = tasks.filter(t => ["executing", "approved"].includes(t.status)).length
  const debt         = getDoctrineDebt()
  const opsTensions  = loadOpenTensions().filter(t => t.affectedWings.includes("ops"))

  return (
    <div style={{ paddingTop: 40, paddingBottom: 20 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: lc.color, marginBottom: 8 }}>OPSCORE · Operations Wing</div>
        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--fg)", marginBottom: 4 }}>What is moving right now.</div>
      </div>

      {debt.pendingReviews > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, padding: "10px 13px", borderRadius: 7, background: "rgba(232,168,124,0.06)", border: "1px solid rgba(232,168,124,0.22)" }}>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#e8a87c", lineHeight: 1, flexShrink: 0 }}>{debt.pendingReviews}</div>
          <div>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#e8a87c", letterSpacing: "0.1em", textTransform: "uppercase" }}>doctrine review pending · VERA</div>
            <div style={{ fontSize: "0.52rem", color: "var(--fg-4)", fontFamily: "monospace", marginTop: 2 }}>
              new declarations awaiting comparison with foundational doctrine
            </div>
          </div>
        </div>
      )}

      {opsTensions.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22, padding: "10px 13px", borderRadius: 7, background: "#c87dff0a", border: "1px solid #c87dff30" }}>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#c87dff", lineHeight: 1, flexShrink: 0 }}>{opsTensions.length}</div>
          <div>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#c87dff", letterSpacing: "0.1em", textTransform: "uppercase" }}>unresolved doctrine · KODEX</div>
            <div style={{ fontSize: "0.52rem", color: "var(--fg-4)", fontFamily: "monospace", marginTop: 2 }}>
              {opsTensions.length === 1 ? "1 open tension" : `${opsTensions.length} open tensions`} affecting operations
            </div>
          </div>
        </div>
      )}

      {tasks.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {[
            { label: "total",   count: tasks.length, color: "var(--fg-3)" },
            { label: "pending", count: pending,       color: "#ff9f43" },
            { label: "active",  count: active,        color: lc.color },
          ].map(({ label, count, color }) => (
            <div key={label} style={{ flex: 1, padding: "10px 12px", borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border)", textAlign: "center" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color, lineHeight: 1 }}>{count}</div>
              <div style={{ fontSize: "0.48rem", fontFamily: "monospace", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-4)", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      <PACERStack />

      <IntelligenceLayer />

      <FleetFlowFeed lc={lc} />

      <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 10 }}>ask</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {(STARTERS.ops || []).map((s, i) => (
          <div key={i} onClick={() => onSend(s)}
            style={{ padding: "7px 13px", border: "1px solid var(--border)", borderRadius: 6, fontSize: "0.74rem", color: "var(--fg-3)", cursor: "pointer", background: "var(--bg-card)", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = lc.color; e.currentTarget.style.color = "var(--fg)"; e.currentTarget.style.background = lc.dim }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--fg-3)"; e.currentTarget.style.background = "var(--bg-card)" }}>
            {s}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── KELBoard ──────────────────────────────────────────────────────────────────

const KEL_STARTERS = [
  "Plan: sync FleetFlow jobs to a Google Sheet daily",
  "Plan: send crew SMS briefing before each job",
  "Plan: auto-archive completed jobs to Firebase",
  "Plan: post Isles content drop to social on schedule",
]

function KELBoard({ lc, onSend }) {
  const tasks       = loadStorage()?.tasks || []
  const kelTensions = loadOpenTensions().filter(t => t.affectedWings.includes("kel"))
  const hasKelDebt  = kelTensions.length > 0

  const approved = tasks.filter(t => t.status === "approved" || t.status === "executing")
  const blocked  = tasks.filter(t => t.status === "rejected")

  const waitingOnKodex = hasKelDebt ? approved : []
  const readyToExecute = hasKelDebt ? [] : approved

  const buckets = [
    { label: "Waiting on KODEX", tasks: waitingOnKodex, color: "#c87dff", note: kelTensions.length > 0 ? `${kelTensions.length} open tension${kelTensions.length !== 1 ? "s" : ""} affecting K.E.L.` : null },
    { label: "Ready to Execute", tasks: readyToExecute, color: lc.color,   note: null },
    { label: "Blocked",          tasks: blocked,         color: "#ff6b6b",  note: null },
  ]

  return (
    <div style={{ paddingTop: 32, paddingBottom: 20 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: lc.color, marginBottom: 8 }}>K.E.L. · Execution Wing</div>
        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--fg)", marginBottom: 4 }}>What is queued to run.</div>
      </div>

      {tasks.length > 0 ? (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 10 }}>execution queue</div>
          {buckets.map(({ label, tasks: bt, color, note }) => (
            <div key={label} style={{ marginBottom: 8, padding: "10px 13px", borderRadius: 7, background: "var(--bg-card)", border: "1px solid var(--border)", borderLeft: `2px solid ${bt.length > 0 ? color : "var(--border)"}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: note ? 4 : 0 }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: bt.length > 0 ? color : "var(--fg-4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: bt.length > 0 ? color : "var(--fg-4)", lineHeight: 1 }}>{bt.length}</div>
              </div>
              {note && bt.length > 0 && (
                <div style={{ fontSize: "0.54rem", color: "#c87dff80", fontFamily: "monospace" }}>{note}</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ marginBottom: 28, padding: "16px 14px", borderRadius: 8, border: "1px solid var(--border-lo)", background: "var(--bg-card)", fontSize: "0.72rem", color: "var(--fg-4)", lineHeight: 1.6, fontStyle: "italic" }}>
          No tasks in queue. Plan something worth executing.
        </div>
      )}

      <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 10 }}>plan</div>
      {KEL_STARTERS.map((s, i) => (
        <div key={i} onClick={() => onSend(s)}
          style={{ marginBottom: 6, padding: "9px 13px", border: "1px solid var(--border)", borderRadius: 6, fontSize: "0.74rem", color: "var(--fg-3)", cursor: "pointer", background: "var(--bg-card)", transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = lc.color; e.currentTarget.style.color = "var(--fg)"; e.currentTarget.style.background = lc.dim }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--fg-3)"; e.currentTarget.style.background = "var(--bg-card)" }}>
          {s}
        </div>
      ))}
    </div>
  )
}
