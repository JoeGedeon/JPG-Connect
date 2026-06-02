// src/layers/jarvis/JarvisInterface.jsx
// PACER conversation engine — messages, history, TTS

import { useState, useRef, useEffect } from "react"
import { LANE_MAP, STARTERS } from "../../config/lanes.js"
import { SYSTEM_MAP } from "../../config/prompts.js"
import { saveStorage, loadStorage, formatTime } from "../../utils/storage.js"
import { formatMessage } from "../../utils/formatMessage.jsx"
import { sendChat } from "../../api/chat.js"
import { speak, stopSpeaking } from "../../engine/voice.js"
import { buildCanonContext, loadAllCanon } from "../../engine/canon.js"
import { getSignalsByTypes, SIGNAL_TYPES } from "../../engine/signals.js"
import JarvisBar from "./JarvisBar.jsx"

function formatRelativeTime(ts) {
  const diff = Date.now() - ts
  if (diff < 60000)    return "just now"
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

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
  savedMessages,
  savedHistory,
}) {
  const [messages, setMessages] = useState(() => savedMessages || [])
  const [input, setInput]       = useState("")
  const [thinking, setThinking] = useState(false)

  const initialHistory = savedHistory || { ops: [], creative: [], kel: [], archivist: [] }
  if (!initialHistory.kel && initialHistory.claw) {
    initialHistory.kel = initialHistory.claw
    delete initialHistory.claw
  }
  if (!initialHistory.archivist) initialHistory.archivist = []

  const historyRef = useRef(initialHistory)
  const bottomRef  = useRef(null)
  const prevLane   = useRef(lane)

  useEffect(() => {
    saveStorage({
      lane,
      messages,
      opsHistory:       historyRef.current.ops,
      creativeHistory:  historyRef.current.creative,
      kelHistory:       historyRef.current.kel,
      archivistHistory: historyRef.current.archivist,
    })
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
      const baseSystem = SYSTEM_MAP[laneAtSend] || ""
      const canonCtx   = buildCanonContext(laneAtSend)
      const reply = await sendChat({ lane: laneAtSend, system: baseSystem + canonCtx, messages: newHistory.slice(-20) })
      historyRef.current[laneAtSend] = [...newHistory, { role: "assistant", content: reply }]
      setMessages(prev => [...prev, {
        role: "bot",
        text: reply,
        lane: laneAtSend,
        ts: Date.now(),
        spoken: voiceEnabled,
      }])
      if (voiceEnabled) speak(reply)
    } catch (err) {
      setMessages(prev => [...prev, { role: "error", text: err.message, ts: Date.now() }])
    }

    setThinking(false)
  }

  const laneConfig = LANE_MAP[lane]
  const { color: primary, dim, accent } = laneConfig

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", "--primary": primary, "--accent": accent }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 0" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 20px", display: "flex", flexDirection: "column", gap: 16 }}>

          {messages.length === 0 && (
            lane === "ops" ? (
              <OpsBoard lc={laneConfig} onSend={send} />
            ) : lane === "archivist" ? (
              <ArchivistBoard lc={laneConfig} onSend={send} />
            ) : (
              <div style={{ textAlign: "center", paddingTop: 52, paddingBottom: 20 }}>
                <div style={{ width: 44, height: 44, margin: "0 auto 16px", background: dim, border: `1px solid ${primary}40`, clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)" }} />
                <div style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 5, color: "var(--fg)" }}>{laneConfig.label}</div>
                <div style={{ fontSize: "0.74rem", color: "var(--fg-3)", marginBottom: 24 }}>{laneConfig.subtitle}</div>
                {lane === "kel" && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 13px", borderRadius: 6, background: "rgba(255,159,67,0.07)", border: "1px solid rgba(255,159,67,0.22)", fontSize: "0.63rem", color: "#ff9f43", fontFamily: "monospace", marginBottom: 20 }}>
                    All tasks require approval before execution
                  </div>
                )}
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

          {messages.map((m, i) => {
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

            const isUser = m.role === "user"
            const mc = LANE_MAP[m.lane] || laneConfig

            return (
              <div key={i} style={{ display: "flex", gap: 10, flexDirection: isUser ? "row-reverse" : "row", animation: "fadeUp 0.2s ease" }}>
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

// ── OpsBoard ─────────────────────────────────────────────────────────────────────────────────

function OpsBoard({ lc, onSend }) {
  const tasks   = loadStorage()?.tasks || []
  const pending = tasks.filter(t => t.status === "pending").length
  const active  = tasks.filter(t => ["executing", "approved"].includes(t.status)).length

  return (
    <div style={{ paddingTop: 40, paddingBottom: 20 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: lc.color, marginBottom: 8 }}>OPSCORE · Operations Wing</div>
        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--fg)", marginBottom: 4 }}>What is moving right now.</div>
      </div>

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

// ── ArchivistBoard ────────────────────────────────────────────────────────────────────────

const RECORD_LABEL = {
  [SIGNAL_TYPES.DECLARATION_CREATED]:  "declared",
  [SIGNAL_TYPES.MEMORY_RECORDED]:      "recorded",
  [SIGNAL_TYPES.DECLARATION_RELEASED]: "released",
}

function ArchivistBoard({ lc, onSend }) {
  const allCanon      = loadAllCanon()
  const declarations  = allCanon.filter(d => !/^[A-Z]/.test(d.id) && d.status === "active").slice(0, 6)
  const recentRecords = getSignalsByTypes([
    SIGNAL_TYPES.DECLARATION_CREATED,
    SIGNAL_TYPES.MEMORY_RECORDED,
    SIGNAL_TYPES.DECLARATION_RELEASED,
  ], 8)

  return (
    <div style={{ paddingTop: 32, paddingBottom: 20 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: lc.color, marginBottom: 8 }}>ARCHIVIST · Memory Wing</div>
        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--fg)", marginBottom: 4 }}>What you’re holding.</div>
      </div>

      {declarations.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 10 }}>on the shelf</div>
          {declarations.map(d => (
            <div key={d.id} style={{ marginBottom: 8, padding: "10px 13px", borderRadius: 7, background: "var(--bg-card)", border: "1px solid var(--border)", borderLeft: `2px solid ${lc.color}` }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--fg-2)", marginBottom: 3 }}>{d.label}</div>
              <div style={{ fontSize: "0.68rem", color: "var(--fg-3)", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{d.content}</div>
            </div>
          ))}
        </div>
      )}

      {recentRecords.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 10 }}>recent records</div>
          {recentRecords.map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, padding: "7px 10px", borderRadius: 6, background: "var(--bg-card)", border: "1px solid var(--border-lo)" }}>
              <div style={{ fontSize: "0.5rem", fontFamily: "monospace", color: lc.color, textTransform: "uppercase", flexShrink: 0, letterSpacing: "0.1em" }}>{RECORD_LABEL[s.type] || s.type}</div>
              <div style={{ flex: 1, fontSize: "0.68rem", color: "var(--fg-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</div>
              <div style={{ fontSize: "0.52rem", color: "var(--fg-4)", fontFamily: "monospace", flexShrink: 0 }}>{formatRelativeTime(s.createdAt)}</div>
            </div>
          ))}
        </div>
      )}

      {declarations.length === 0 && recentRecords.length === 0 && (
        <div style={{ marginBottom: 24, padding: "16px 14px", borderRadius: 8, border: "1px solid var(--border-lo)", background: "var(--bg-card)", fontSize: "0.72rem", color: "var(--fg-4)", lineHeight: 1.6, fontStyle: "italic" }}>
          The shelf is empty. Declare something worth keeping.
        </div>
      )}

      <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 10 }}>ask</div>
      {(STARTERS.archivist || []).map((s, i) => (
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
