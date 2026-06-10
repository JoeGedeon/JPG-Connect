// src/layers/jarvis/JarvisInterface.jsx
// PACER conversation engine — messages, history, TTS
// Routes council → CouncilSurface, muse → MuseLayer,
//   archivist → ArchivistRoom, creative → KodexRoom. OPS + KEL remain here.
// Calls moveJourney on every lane transition — the hallway remembers why you walked through it.

import { useState, useRef, useEffect } from "react"
import { LANES, LANE_MAP, STARTERS, ROOM_EXITS } from "../../config/lanes.js"
import { SYSTEM_MAP } from "../../config/prompts.js"
import { saveStorage, loadStorage, formatTime } from "../../utils/storage.js"
import { formatMessage } from "../../utils/formatMessage.jsx"
import { sendChat } from "../../api/chat.js"
import { getProviderForLane, LANE_PROVIDERS, getProviderLabel } from "../../config/providers.js"
import { speak, stopSpeaking } from "../../engine/voice.js"
import { buildCanonContext, loadOpenTensions, getDoctrineDebt } from "../../engine/canon.js"
import { ingestFleetFlowEvent, FF_DEMO_EVENTS, getEvents, getIntelligenceStats, buildVERAMemoryContext, getMemoryIntegrityScore } from "../../engine/events.js"
import { detectDecisionSignals, extractContext, MOMENT_TYPES } from "../../engine/moments.js"
import { moveJourney } from "../../engine/journeys.js"
import { createSignalCard } from "../../engine/signalCards.js"
import DeclarableMoment from "../../components/DeclarableMoment.jsx"
import JarvisBar from "./JarvisBar.jsx"
import ArchivistRoom from "../archivist/ArchivistRoom.jsx"
import KodexRoom from "../kodex/KodexRoom.jsx"
import VERARoom from "../vera/VERARoom.jsx"
import DispatcherWorkspace from "../dispatcher/DispatcherWorkspace.jsx"
import CouncilSurface from "../council/CouncilSurface.jsx"
import MuseLayer from "../muse/MuseLayer.jsx"
import AtriumRoom from "../atrium/AtriumRoom.jsx"

function humanizeError(err) {
  const msg = (err?.message || "").toLowerCase()
  if (msg.includes("usage_exceeded") || msg.includes("usage exceeded"))
    return { headline: "OPSCORE unavailable.", detail: "Usage limit reached. The model provider quota is exhausted — try again later." }
  if (msg.includes("rate_limit") || msg.includes("rate limit") || msg.includes("429"))
    return { headline: "OPSCORE unavailable.", detail: "Rate limit reached. Wait a moment, then try again." }
  if (msg.includes("context_length") || msg.includes("context length") || msg.includes("too long") || msg.includes("maximum context"))
    return { headline: "Context too long.", detail: "The conversation history has reached the model's limit. Start a new thread to continue." }
  if (msg.includes("overloaded") || msg.includes("529") || msg.includes("service unavailable"))
    return { headline: "Model service overloaded.", detail: "The provider is temporarily unavailable. Try again in a moment." }
  if (msg.includes("unauthorized") || msg.includes("401") || msg.includes("invalid api key") || msg.includes("authentication"))
    return { headline: "API key issue.", detail: "Authentication failed. Check the provider API key in your configuration." }
  if (msg.includes("network") || msg.includes("failed to fetch") || msg.includes("load failed"))
    return { headline: "Connection lost.", detail: "Check your internet connection and try again." }
  return { headline: "Something went wrong.", detail: err?.message || "An unexpected error occurred." }
}

function RoomExits({ lane, onGoTo }) {
  const [raiseOpen, setRaiseOpen]   = useState(false)
  const [subject, setSubject]       = useState("")
  const [confidence, setConfidence] = useState(60)
  const [destId, setDestId]         = useState("")
  const [raised, setRaised]         = useState(null)

  const exits   = ROOM_EXITS[lane] || []
  const lc      = LANE_MAP[lane]

  function handleRaise(e) {
    e.preventDefault()
    if (!subject.trim()) return
    const card = createSignalCard({
      origin:                 lane,
      subject:                subject.trim(),
      confidence,
      recommendedDestination: destId || null,
    })
    setRaised(card.number)
    setSubject("")
    setConfidence(60)
    setDestId("")
    setTimeout(() => { setRaised(null); setRaiseOpen(false) }, 1800)
  }

  return (
    <div style={{ flexShrink: 0 }}>
      {raiseOpen && (
        <div style={{ padding: "10px 16px 10px", borderTop: "1px solid var(--border-lo)", background: "var(--bg-panel)", animation: "fadeUp 0.15s ease" }}>
          {raised !== null ? (
            <div style={{ padding: "8px 12px", borderRadius: 5, background: `${lc?.color || "#8daac4"}12`, border: `1px solid ${lc?.color || "#8daac4"}30`, fontSize: "0.66rem", fontFamily: "monospace", color: lc?.color || "#8daac4", letterSpacing: "0.06em" }}>
              ↑ Signal #{raised} raised from {lc?.label || lane}
            </div>
          ) : (
            <>
              <div style={{ fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.16em", color: "var(--fg-4)", textTransform: "uppercase", marginBottom: 7 }}>
                Raise Signal Card · from {lc?.label || lane.toUpperCase()}
              </div>
              <form onSubmit={handleRaise} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <input
                  autoFocus
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="What's the intelligence?"
                  style={{ padding: "7px 10px", borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--fg)", fontSize: "0.76rem", fontFamily: "inherit", outline: "none", width: "100%" }}
                />
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                    <span style={{ fontSize: "0.44rem", fontFamily: "monospace", color: "var(--fg-4)", flexShrink: 0, letterSpacing: "0.08em" }}>confidence</span>
                    <input
                      type="range" min={0} max={100} value={confidence}
                      onChange={e => setConfidence(Number(e.target.value))}
                      style={{ flex: 1, accentColor: lc?.color || "#8daac4", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "0.6rem", fontFamily: "monospace", color: lc?.color || "var(--fg-3)", flexShrink: 0, minWidth: 30, textAlign: "right", fontWeight: 700 }}>{confidence}%</span>
                  </div>
                  <select
                    value={destId}
                    onChange={e => setDestId(e.target.value)}
                    style={{ padding: "5px 7px", borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg-input)", color: destId ? "var(--fg-2)" : "var(--fg-4)", fontSize: "0.6rem", fontFamily: "monospace", outline: "none", cursor: "pointer" }}
                  >
                    <option value="">→ destination</option>
                    {LANES.filter(l => l.id !== lane).map(l => (
                      <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => setRaiseOpen(false)}
                    style={{ padding: "5px 10px", borderRadius: 4, border: "1px solid var(--border)", background: "transparent", color: "var(--fg-4)", fontSize: "0.58rem", fontFamily: "monospace", cursor: "pointer" }}>
                    cancel
                  </button>
                  <button type="submit" disabled={!subject.trim()}
                    style={{ padding: "5px 14px", borderRadius: 4, border: `1px solid ${(lc?.color || "#8daac4")}50`, background: (lc?.dim || "transparent"), color: lc?.color || "var(--fg)", fontSize: "0.6rem", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.08em", cursor: subject.trim() ? "pointer" : "default", opacity: subject.trim() ? 1 : 0.4, transition: "opacity 0.12s" }}>
                    Raise Signal →
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 16px", borderTop: "1px solid var(--border-lo)", background: "var(--bg-panel)" }}>
        {exits.length > 0 && (
          <span style={{ fontSize: "0.4rem", fontFamily: "monospace", letterSpacing: "0.16em", color: "var(--fg-4)", textTransform: "uppercase", marginRight: 4, flexShrink: 0 }}>exits</span>
        )}
        {exits.map(exitId => {
          const l = LANE_MAP[exitId]
          if (!l) return null
          return (
            <button
              key={exitId}
              onClick={() => { moveJourney(exitId, "→"); onGoTo?.(exitId) }}
              style={{ padding: "3px 10px", borderRadius: 4, border: `1px solid ${l.color}30`, background: "transparent", color: l.color, fontSize: "0.52rem", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.12s", flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.background = l.dim; e.currentTarget.style.borderColor = l.color + "60" }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = l.color + "30" }}
            >
              {l.label} →
            </button>
          )
        })}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setRaiseOpen(v => !v)}
          style={{ padding: "3px 9px", borderRadius: 4, border: `1px solid ${raiseOpen ? (lc?.color || "#8daac4") + "50" : "var(--border)"}`, background: raiseOpen ? (lc?.dim || "var(--bg-card)") : "transparent", color: raiseOpen ? (lc?.color || "var(--fg-3)") : "var(--fg-4)", fontSize: "0.5rem", fontFamily: "monospace", letterSpacing: "0.08em", cursor: "pointer", flexShrink: 0, transition: "all 0.12s" }}
          onMouseEnter={e => { if (!raiseOpen) { e.currentTarget.style.borderColor = "var(--border-hi)"; e.currentTarget.style.color = "var(--fg-3)" }}}
          onMouseLeave={e => { if (!raiseOpen) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--fg-4)" }}}
        >
          ↑ signal
        </button>
      </div>
    </div>
  )
}

export default function JarvisInterface({
  lane,
  persona,
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
  const [messages, setMessages]           = useState(() => savedMessages || [])
  const [input, setInput]                 = useState("")
  const [thinking, setThinking]           = useState(false)
  const [saveStatus, setSaveStatus]       = useState("ok")
  const [currentMoment, setCurrentMoment] = useState(null)
  const [hoveredMsg, setHoveredMsg]       = useState(null)

  const initialHistory = savedHistory || { ops: [], creative: [], kel: [], archivist: [], vera: [] }
  if (!initialHistory.kel && initialHistory.claw) {
    initialHistory.kel = initialHistory.claw
    delete initialHistory.claw
  }
  if (!initialHistory.archivist) initialHistory.archivist = []
  if (!initialHistory.vera)      initialHistory.vera      = []

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
        { type: "divider", text: `→ ${LANE_MAP[lane]?.label || lane}`, ts: Date.now() },
      ])
      // Advance the active journey — the hallway remembers why you walked through it
      moveJourney(lane, "")
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
      const { provider, model } = getProviderForLane(laneAtSend)
      const reply = await sendChat({ lane: laneAtSend, system: baseSystem + canonCtx + ledgerCtx, messages: newHistory.slice(-20), provider, model })
      historyRef.current[laneAtSend] = [...newHistory, { role: "assistant", content: reply }].slice(-40)
      setMessages(prev => [...prev, {
        role: "bot",
        text: reply,
        lane: laneAtSend,
        ts: Date.now(),
        spoken: voiceEnabled,
      }])
      if (voiceEnabled) speak(reply)

      if ((laneAtSend === "ops" || laneAtSend === "kel") && detectDecisionSignals(reply)) {
        setCurrentMoment({
          type:           MOMENT_TYPES.DECISION_DETECTED,
          category:       laneAtSend,
          context:        extractContext(reply),
          prefillContent: extractContext(reply),
        })
      }
    } catch (err) {
      const { headline, detail } = humanizeError(err)
      setMessages(prev => [...prev, { role: "error", headline, detail, lane: laneAtSend, ts: Date.now() }])
    }

    setThinking(false)
  }

  // ── Room content ──────────────────────────────────────────────────────────────────────────────

  let roomContent

  if (lane === "council") {
    roomContent = (
      <CouncilSurface
        onEnterSeat={laneId => onGoTo?.(laneId)}
      />
    )
  } else if (lane === "muse") {
    roomContent = <MuseLayer />
  } else if (lane === "atrium") {
    roomContent = <AtriumRoom onGoTo={onGoTo} />
  } else if (lane === "ops" && (persona === "dispatcher" || persona === "crew")) {
    roomContent = (
      <DispatcherWorkspace
        persona={persona}
        messages={messages}
        thinking={thinking}
        input={input}
        onInputChange={setInput}
        onSend={() => send()}
        voiceEnabled={voiceEnabled}
        threadsOpen={threadsOpen}
        commandOpen={commandOpen}
        onToggleVoice={onToggleVoice}
        onOpenThreads={onOpenThreads}
        onOpenCommand={onOpenCommand}
      />
    )
  } else if (lane === "archivist") {
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
                  <div key={i} style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,107,107,0.07)", border: "1px solid rgba(255,107,107,0.15)" }}>
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#ff6b6b", fontFamily: "monospace", marginBottom: m.detail ? 4 : 0 }}>
                      {m.headline || "Error"}
                    </div>
                    {m.detail && (
                      <div style={{ fontSize: "0.66rem", color: "rgba(255,107,107,0.75)", lineHeight: 1.45 }}>
                        {m.detail}
                      </div>
                    )}
                  </div>
                )
                if (!m.role) return null
                const isUser = m.role === "user"
                const mc     = LANE_MAP[m.lane] || laneConfig
                return (
                  <div key={i} style={{ display: "flex", gap: 10, flexDirection: isUser ? "row-reverse" : "row", animation: "fadeUp 0.2s ease", position: "relative" }}
                    onMouseEnter={() => setHoveredMsg(i)} onMouseLeave={() => setHoveredMsg(null)}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.5rem", fontWeight: 800, letterSpacing: "0.06em", flexShrink: 0, marginTop: 4, background: isUser ? "var(--bg-card)" : mc.dim, border: isUser ? "1px solid var(--border)" : `1px solid ${mc.color}40`, color: isUser ? "var(--fg-3)" : mc.color }}>
                      {isUser ? "J" : "P"}
                    </div>
                    <div style={{ maxWidth: "82%", display: "flex", flexDirection: "column", gap: 4, alignItems: isUser ? "flex-end" : "flex-start" }}>
                      {!isUser && <div style={{ fontSize: "0.52rem", fontFamily: "monospace", letterSpacing: "0.12em", color: mc.color, textTransform: "uppercase", paddingLeft: 2 }}>{mc.label}</div>}
                      <div style={{ padding: "10px 14px", borderRadius: 10, fontSize: "0.84rem", lineHeight: 1.82, background: isUser ? "var(--bg-card)" : "var(--bg-panel)", border: "1px solid var(--border)", borderLeft: !isUser ? `2px solid ${mc.color}` : undefined, borderTopRightRadius: isUser ? 2 : 10, borderTopLeftRadius: !isUser ? 2 : 10, color: "var(--fg-body)" }}>
                        {formatMessage(m.text)}
                      </div>
                      <div style={{ fontSize: "0.54rem", color: "var(--fg-4)", fontFamily: "monospace", display: "flex", gap: 8, alignItems: "center" }}>
                        {formatTime(m.ts)}
                        {m.spoken && <span style={{ color: mc.color, opacity: 0.55 }}>◎</span>}
                        {!isUser && hoveredMsg === i && (
                          <button onClick={() => setCurrentMoment({ type: MOMENT_TYPES.MANUAL_CAPTURE, category: m.lane || lane, context: extractContext(m.text), prefillContent: extractContext(m.text) })}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-4)", fontSize: "0.52rem", fontFamily: "monospace", letterSpacing: "0.08em", padding: "0 2px", opacity: 0.65, transition: "opacity 0.15s" }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "#00c896" }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = "0.65"; e.currentTarget.style.color = "var(--fg-4)" }}>
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
                  {[0, 0.18, 0.36].map((d, i) => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: primary, animation: `blink 1.1s ${d}s infinite` }} />)}
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
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {roomContent}
        <RoomExits lane={lane} onGoTo={onGoTo} />
      </div>
      {currentMoment && (
        <DeclarableMoment moment={currentMoment} onDismiss={() => setCurrentMoment(null)} onDeclared={() => setCurrentMoment(null)} />
      )}
    </>
  )
}

// ── OpsBoard ───────────────────────────────────────────────────────────────────────────────

function PACERStack() {
  const events      = getEvents()
  const stats       = getIntelligenceStats()
  const mis         = getMemoryIntegrityScore()
  const ffCount     = events.filter(e => e.source === "fleetflow").length
  const manualCount = events.filter(e => e.source === "manual").length
  const total       = events.length
  const oldest      = events.length > 0 ? events[events.length - 1] : null
  const memoryDays  = oldest ? Math.floor((Date.now() - oldest.occurredAt) / 86400000) : 0
  const memoryAge   = memoryDays === 0 ? "started today" : `${memoryDays}d of memory`
  const witnessSub  = [
    ffCount    ? `FleetFlow · first witness (${ffCount})` : "FleetFlow · first witness",
    manualCount ? `Manual (${manualCount})` : "Manual",
    "API-ready",
  ].join(" · ")
  const LAYERS = [
    { id: "reality",  label: "Reality",       sub: "Boxes move. Money changes hands. Humans create expensive chaos.", color: "var(--fg-4)", right: null },
    { id: "witnesses",label: "Witnesses",      sub: witnessSub, color: "#5a9bc8", pill: "testimony intake", right: "any system can testify" },
    { id: "ledger",   label: "Event Ledger",   sub: `${memoryAge} · append-only · the record belongs to the org`, color: "#c8955a", pill: "asset", right: total ? `${total} events · ${stats.attributedCount} attributed · ${stats.gapCount} gap${stats.gapCount !== 1 ? "s" : ""}` : "empty" },
    { id: "pacer",    label: "PACER",          sub: `Memory Integrity: ${mis.score} · ${mis.label} · ${mis.interpretation.split(".")[0].toLowerCase()}`, color: mis.color, pill: "intelligence", right: `MIS ${mis.score}` },
    { id: "router",   label: "Provider Router",sub: Object.entries(LANE_PROVIDERS).map(([l, cfg]) => `${l.toUpperCase()} → ${cfg.provider}`).join(" · "), color: "#a87cc8", pill: "JPG-022", right: "models are engines" },
    { id: "kel",      label: "K.E.L.",         sub: "Document — the Ledger writes, K.E.L. signs", color: "rgba(76,217,100,0.85)", pill: "evidence", right: "7 report types" },
    { id: "vera",     label: "VERA",           sub: "Witness — speaks from memory, not inference", color: "#8daac4", pill: "decision", right: "ledger-grounded" },
    { id: "output",   label: "Evidence · Reports · Claims · Audits · Decisions", color: "var(--fg-4)", isBottom: true },
  ]
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 12 }}>architecture · live</div>
      {LAYERS.map((layer, i) => (
        <div key={layer.id}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: layer.isBottom ? "4px 10px" : "8px 12px", borderRadius: 5, background: layer.isBottom ? "transparent" : "var(--bg-card)", border: layer.isBottom ? "none" : `1px solid ${layer.color}18`, borderLeft: layer.isBottom ? "none" : `2px solid ${layer.color}45` }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: layer.isBottom ? "0.42rem" : "0.56rem", fontWeight: layer.isBottom ? 400 : 600, color: layer.color, fontFamily: layer.isBottom ? "monospace" : "inherit", letterSpacing: layer.isBottom ? "0.08em" : "0.01em" }}>{layer.label}</div>
              {layer.sub && <div style={{ fontSize: "0.4rem", fontFamily: "monospace", color: "var(--fg-4)", marginTop: 2, letterSpacing: "0.04em" }}>{layer.sub}</div>}
            </div>
            {layer.pill  && <div style={{ fontSize: "0.34rem", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 6px", borderRadius: 3, border: `1px solid ${layer.color}20`, color: `${layer.color}65`, flexShrink: 0 }}>{layer.pill}</div>}
            {layer.right && <div style={{ fontSize: "0.38rem", fontFamily: "monospace", color: `${layer.color}70`, letterSpacing: "0.04em", flexShrink: 0, textAlign: "right" }}>{layer.right}</div>}
          </div>
          {i < LAYERS.length - 1 && !layer.isBottom && (
            <div style={{ display: "flex", justifyContent: "center", height: 10, alignItems: "center" }}><div style={{ width: 1, height: "100%", background: "var(--border)", opacity: 0.5 }} /></div>
          )}
        </div>
      ))}
      <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 5, background: "rgba(200,149,90,0.03)", border: "1px solid rgba(200,149,90,0.08)", borderLeft: "2px solid rgba(200,149,90,0.18)" }}>
        <div style={{ fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(200,149,90,0.45)", marginBottom: 7 }}>mission</div>
        <div style={{ fontSize: "0.54rem", fontWeight: 600, color: "var(--fg-3)", lineHeight: 1.5, marginBottom: 10 }}>Not to remember what happened.<br />To explain, defend, and prove it.</div>
        <div style={{ height: 1, background: "rgba(200,149,90,0.1)", marginBottom: 9 }} />
        <div style={{ fontSize: "0.42rem", fontFamily: "monospace", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(200,149,90,0.35)", marginBottom: 6 }}>how</div>
        {["Reality enters through witnesses.","The ledger is the record. It belongs to the organization.","K.E.L. defends. VERA explains. The tiers prove.","The ledger cannot invent a record. It can only receive one."].map((line, i) => (
          <div key={i} style={{ fontSize: "0.46rem", color: "var(--fg-4)", lineHeight: 1.85 }}>{line}</div>
        ))}
        <div style={{ marginTop: 8, fontSize: "0.38rem", fontFamily: "monospace", color: "var(--fg-4)", opacity: 0.4 }}>{total > 0 ? `${total} events in the record · first witness: FleetFlow` : "first witness: FleetFlow · awaiting testimony"}</div>
        {total > 0 && (
          <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 5, background: `${mis.color}08`, border: `1px solid ${mis.color}20`, borderLeft: `2px solid ${mis.color}50` }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: "0.36rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: `${mis.color}80` }}>memory integrity score</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: mis.color, lineHeight: 1 }}>{mis.score}</div>
            </div>
            <div style={{ display: "flex", gap: 4, marginBottom: 7 }}>
              {[{ label: "reliability", value: mis.components.reliability },{ label: "attribution", value: mis.components.attribution },{ label: "context", value: mis.components.context },{ label: "recency", value: mis.components.recency }].map(({ label, value }) => (
                <div key={label} style={{ flex: 1 }}>
                  <div style={{ height: 2, borderRadius: 1, background: `${mis.color}20`, marginBottom: 2 }}><div style={{ height: "100%", width: `${value}%`, background: mis.color, borderRadius: 1, opacity: 0.7 }} /></div>
                  <div style={{ fontSize: "0.3rem", fontFamily: "monospace", color: "var(--fg-4)", textAlign: "center" }}>{label.slice(0, 4)}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: "0.4rem", color: "var(--fg-4)", lineHeight: 1.5, opacity: 0.7 }}>{mis.interpretation}</div>
          </div>
        )}
      </div>
    </div>
  )
}

function IntelligenceLayer() {
  const stats        = getIntelligenceStats()
  const decisionPct  = Math.min(stats.attributedCount / stats.attributedThreshold, 1)
  const patternPct   = Math.min(stats.maxTypeDensity  / stats.patternThreshold, 1)
  const decisionReady = decisionPct >= 1
  const patternReady  = patternPct  >= 1
  const gapsClean     = stats.gapCount === 0
  function ProgressBar({ pct, color }) {
    return <div style={{ height: 2, background: "#1d1d38", borderRadius: 1, marginTop: 5 }}><div style={{ height: "100%", width: `${Math.round(pct * 100)}%`, background: color, borderRadius: 1, transition: "width 0.4s ease" }} /></div>
  }
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "#7bc85a" }}>decision intelligence</div>
        <div style={{ fontSize: "0.4rem", fontFamily: "monospace", color: "var(--fg-4)" }}>{stats.totalEvents} events total</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {[
          { label: "Decision Quality",    ready: decisionReady, color: "#7bc85a", readyText: "Active — approver patterns visible",   waitText: "Which approvers make the best calls?",          stat: `${stats.attributedCount} / ${stats.attributedThreshold} attributed events`, pct: decisionPct },
          { label: "Pattern Recognition", ready: patternReady,  color: "#5a9bc8", readyText: "Active — recurring patterns detectable", waitText: "What repeats across event types?",              stat: `${stats.maxTypeDensity} / ${stats.patternThreshold} densest type`,          pct: patternPct  },
        ].map(({ label, ready, color, readyText, waitText, stat, pct }) => (
          <div key={label} style={{ padding: "10px 12px", borderRadius: 6, background: "var(--bg-card)", border: `1px solid ${ready ? color + "30" : "var(--border)"}`, borderLeft: `2px solid ${ready ? color : "#1d1d38"}` }}>
            <div style={{ fontSize: "0.52rem", fontWeight: 600, color: ready ? color : "var(--fg-3)", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: "0.46rem", color: "var(--fg-4)", lineHeight: 1.5, marginBottom: 3 }}>{ready ? readyText : waitText}</div>
            <div style={{ fontSize: "0.44rem", fontFamily: "monospace", color: ready ? color : "var(--fg-4)" }}>{ready ? "✓ threshold met" : stat}</div>
            {!ready && <ProgressBar pct={pct} color={color + "60"} />}
          </div>
        ))}
        <div style={{ padding: "10px 12px", borderRadius: 6, background: "var(--bg-card)", border: `1px solid ${gapsClean ? "rgba(76,217,100,0.15)" : "rgba(255,107,107,0.15)"}`, borderLeft: `2px solid ${gapsClean ? "rgba(76,217,100,0.5)" : "rgba(255,107,107,0.5)"}` }}>
          <div style={{ fontSize: "0.52rem", fontWeight: 600, color: gapsClean ? "#4cd964" : "#ff6b6b", letterSpacing: "0.06em", marginBottom: 2 }}>Accountability Gaps</div>
          <div style={{ fontSize: "0.46rem", color: "var(--fg-4)", lineHeight: 1.5, marginBottom: 3 }}>{gapsClean ? "All events have a named approver" : `${stats.gapCount} event${stats.gapCount !== 1 ? "s" : ""} missing approver attribution`}</div>
          {!gapsClean && stats.recentGaps.slice(0, 2).map(g => <div key={g.id} style={{ fontSize: "0.4rem", fontFamily: "monospace", color: "#ff6b6b80", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.id}: {g.description?.slice(0, 40) || g.type}…</div>)}
        </div>
        <div style={{ padding: "10px 12px", borderRadius: 6, background: "var(--bg-card)", border: "1px solid var(--border)", borderLeft: "2px solid #1d1d38" }}>
          <div style={{ fontSize: "0.52rem", fontWeight: 600, color: "var(--fg-3)", letterSpacing: "0.06em", marginBottom: 2 }}>Learning Velocity</div>
          <div style={{ fontSize: "0.46rem", color: "var(--fg-4)", lineHeight: 1.5, marginBottom: 3 }}>How fast does decision quality improve after doctrine updates?</div>
          <div style={{ fontSize: "0.44rem", fontFamily: "monospace", color: "var(--fg-4)" }}>{stats.velocityReady ? "Baseline calculable — check ARCHIVIST" : `Baseline period · needs ${Math.max(0, 10 - stats.attributedCount)} more attributed events`}</div>
        </div>
      </div>
      <div style={{ marginTop: 7, fontSize: "0.4rem", fontFamily: "monospace", color: "var(--fg-4)", opacity: 0.45 }}>The history is the intelligence. Each attributed event moves these thresholds.</div>
    </div>
  )
}

function IngestionMonitor({ lc }) {
  const [ingested, setIngested] = useState(() => new Set(getEvents().filter(e => e.source === "fleetflow").map(e => e.description)))
  const [lastIn, setLastIn]     = useState(null)
  function simulate(demo) { const ev = ingestFleetFlowEvent(demo); setIngested(prev => new Set([...prev, demo.ff_description])); setLastIn(ev.id) }
  const allEvents   = getEvents()
  const ffCount     = allEvents.filter(e => e.source === "fleetflow").length
  const manualCount = allEvents.filter(e => e.source === "manual").length
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "#5a9bc8" }}>witness intake</div>
        <div style={{ fontSize: "0.42rem", fontFamily: "monospace", color: "var(--fg-4)" }}>{ffCount > 0 && <span>fleetflow: {ffCount}</span>}{ffCount > 0 && manualCount > 0 && <span> · </span>}{manualCount > 0 && <span>manual: {manualCount}</span>}{ffCount === 0 && manualCount === 0 && <span>no sources active</span>}</div>
      </div>
      {lastIn && <div style={{ marginBottom: 8, padding: "7px 11px", borderRadius: 5, background: "rgba(90,155,200,0.06)", border: "1px solid rgba(90,155,200,0.2)", fontSize: "0.52rem", fontFamily: "monospace", color: "#5a9bc8" }}>↳ {lastIn} — testimony recorded</div>}
      <div style={{ fontSize: "0.4rem", fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 6, opacity: 0.7 }}>demo testimony — FleetFlow · first witness (simulate intake)</div>
      {FF_DEMO_EVENTS.map((demo, i) => {
        const done = ingested.has(demo.ff_description)
        return (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 6, padding: "9px 12px", borderRadius: 6, background: done ? "rgba(90,155,200,0.04)" : "var(--bg-card)", border: `1px solid ${done ? "rgba(90,155,200,0.2)" : "var(--border)"}`, transition: "all 0.2s" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.58rem", color: done ? "#5a9bc8" : "var(--fg-2)", lineHeight: 1.4, marginBottom: 3 }}>{demo.ff_description}</div>
              <div style={{ fontSize: "0.42rem", fontFamily: "monospace", color: "var(--fg-4)" }}>{demo.ff_job_id && `${demo.ff_job_id} · `}{new Date(demo.ff_timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{demo.ff_amount && ` · $${demo.ff_amount.toLocaleString()}`}</div>
            </div>
            <button onClick={() => !done && simulate(demo)} disabled={done} style={{ padding: "5px 10px", borderRadius: 4, border: `1px solid ${done ? "rgba(90,155,200,0.2)" : "#5a9bc840"}`, background: done ? "rgba(90,155,200,0.06)" : "transparent", color: done ? "#5a9bc8" : "var(--fg-4)", fontSize: "0.46rem", fontFamily: "monospace", cursor: done ? "default" : "pointer", flexShrink: 0 }}>{done ? "✓ ingested" : "ingest →"}</button>
          </div>
        )
      })}
      <div style={{ marginTop: 6, fontSize: "0.4rem", fontFamily: "monospace", color: "var(--fg-4)", opacity: 0.5 }}>all testimony enters the ledger · the record belongs to the organization (JPG-019)</div>
    </div>
  )
}

function OpsBoard({ lc, onSend }) {
  const tasks       = loadStorage()?.tasks || []
  const pending     = tasks.filter(t => t.status === "pending").length
  const active      = tasks.filter(t => ["executing", "approved"].includes(t.status)).length
  const debt        = getDoctrineDebt()
  const opsTensions = loadOpenTensions().filter(t => t.affectedWings.includes("ops"))
  return (
    <div style={{ paddingTop: 40, paddingBottom: 20 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: lc.color, marginBottom: 8 }}>OPSCORE · Operations Wing</div>
        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--fg)", marginBottom: 4 }}>What is moving right now.</div>
      </div>
      {debt.pendingReviews > 0 && <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, padding: "10px 13px", borderRadius: 7, background: "rgba(232,168,124,0.06)", border: "1px solid rgba(232,168,124,0.22)" }}><div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#e8a87c", lineHeight: 1, flexShrink: 0 }}>{debt.pendingReviews}</div><div><div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#e8a87c", letterSpacing: "0.1em", textTransform: "uppercase" }}>doctrine review pending · VERA</div><div style={{ fontSize: "0.52rem", color: "var(--fg-4)", fontFamily: "monospace", marginTop: 2 }}>new declarations awaiting comparison with foundational doctrine</div></div></div>}
      {opsTensions.length > 0 && <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22, padding: "10px 13px", borderRadius: 7, background: "#c87dff0a", border: "1px solid #c87dff30" }}><div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#c87dff", lineHeight: 1, flexShrink: 0 }}>{opsTensions.length}</div><div><div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#c87dff", letterSpacing: "0.1em", textTransform: "uppercase" }}>unresolved doctrine · KODEX</div><div style={{ fontSize: "0.52rem", color: "var(--fg-4)", fontFamily: "monospace", marginTop: 2 }}>{opsTensions.length === 1 ? "1 open tension" : `${opsTensions.length} open tensions`} affecting operations</div></div></div>}
      {tasks.length > 0 && <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>{[{ label: "total", count: tasks.length, color: "var(--fg-3)" },{ label: "pending", count: pending, color: "#ff9f43" },{ label: "active", count: active, color: lc.color }].map(({ label, count, color }) => <div key={label} style={{ flex: 1, padding: "10px 12px", borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border)", textAlign: "center" }}><div style={{ fontSize: "1.4rem", fontWeight: 800, color, lineHeight: 1 }}>{count}</div><div style={{ fontSize: "0.48rem", fontFamily: "monospace", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-4)", marginTop: 4 }}>{label}</div></div>)}</div>}
      <PACERStack />
      <IntelligenceLayer />
      <IngestionMonitor lc={lc} />
      <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 10 }}>ask</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {(STARTERS.ops || []).map((s, i) => <div key={i} onClick={() => onSend(s)} style={{ padding: "7px 13px", border: "1px solid var(--border)", borderRadius: 6, fontSize: "0.74rem", color: "var(--fg-3)", cursor: "pointer", background: "var(--bg-card)", transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = lc.color; e.currentTarget.style.color = "var(--fg)"; e.currentTarget.style.background = lc.dim }} onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--fg-3)"; e.currentTarget.style.background = "var(--bg-card)" }}>{s}</div>)}
      </div>
    </div>
  )
}

const KEL_STARTERS = ["Plan: sync FleetFlow jobs to a Google Sheet daily","Plan: send crew SMS briefing before each job","Plan: auto-archive completed jobs to Firebase","Plan: post Isles content drop to social on schedule"]

function KELBoard({ lc, onSend }) {
  const tasks       = loadStorage()?.tasks || []
  const kelTensions = loadOpenTensions().filter(t => t.affectedWings.includes("kel"))
  const hasKelDebt  = kelTensions.length > 0
  const approved    = tasks.filter(t => t.status === "approved" || t.status === "executing")
  const blocked     = tasks.filter(t => t.status === "rejected")
  const buckets = [
    { label: "Waiting on KODEX", tasks: hasKelDebt ? approved : [], color: "#c87dff", note: kelTensions.length > 0 ? `${kelTensions.length} open tension${kelTensions.length !== 1 ? "s" : ""} affecting K.E.L.` : null },
    { label: "Ready to Execute", tasks: hasKelDebt ? [] : approved, color: lc.color, note: null },
    { label: "Blocked",          tasks: blocked, color: "#ff6b6b", note: null },
  ]
  return (
    <div style={{ paddingTop: 32, paddingBottom: 20 }}>
      <div style={{ marginBottom: 28 }}><div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: lc.color, marginBottom: 8 }}>K.E.L. · Execution Wing</div><div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--fg)", marginBottom: 4 }}>What is queued to run.</div></div>
      {tasks.length > 0 ? (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 10 }}>execution queue</div>
          {buckets.map(({ label, tasks: bt, color, note }) => <div key={label} style={{ marginBottom: 8, padding: "10px 13px", borderRadius: 7, background: "var(--bg-card)", border: "1px solid var(--border)", borderLeft: `2px solid ${bt.length > 0 ? color : "var(--border)"}` }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: note ? 4 : 0 }}><div style={{ fontSize: "0.6rem", fontWeight: 700, color: bt.length > 0 ? color : "var(--fg-4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div><div style={{ fontSize: "1.1rem", fontWeight: 800, color: bt.length > 0 ? color : "var(--fg-4)", lineHeight: 1 }}>{bt.length}</div></div>{note && bt.length > 0 && <div style={{ fontSize: "0.54rem", color: "#c87dff80", fontFamily: "monospace" }}>{note}</div>}</div>)}
        </div>
      ) : <div style={{ marginBottom: 28, padding: "16px 14px", borderRadius: 8, border: "1px solid var(--border-lo)", background: "var(--bg-card)", fontSize: "0.72rem", color: "var(--fg-4)", lineHeight: 1.6, fontStyle: "italic" }}>No tasks in queue. Plan something worth executing.</div>}
      <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 10 }}>plan</div>
      {KEL_STARTERS.map((s, i) => <div key={i} onClick={() => onSend(s)} style={{ marginBottom: 6, padding: "9px 13px", border: "1px solid var(--border)", borderRadius: 6, fontSize: "0.74rem", color: "var(--fg-3)", cursor: "pointer", background: "var(--bg-card)", transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = lc.color; e.currentTarget.style.color = "var(--fg)"; e.currentTarget.style.background = lc.dim }} onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--fg-3)"; e.currentTarget.style.background = "var(--bg-card)" }}>{s}</div>)}
    </div>
  )
}
