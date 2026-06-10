// src/layers/dispatcher/DispatcherWorkspace.jsx
// Field operations room for Dispatcher and Crew personas.
// Organized around reality: today's jobs, payment status, crew movement.
// Not a constitution. A room.

import { useState, useRef, useEffect } from "react"
import { SIGNAL_TYPES, getRecentSignals } from "../../engine/signals.js"
import { getWeeklyJobIntake } from "../../engine/events.js"
import { computeIntelligence } from "../../engine/intelligence.js"
import { LANE_MAP } from "../../config/lanes.js"
import { formatMessage } from "../../utils/formatMessage.jsx"
import JarvisBar from "../jarvis/JarvisBar.jsx"

const OPS_COLOR = "#00c896"
const OPS_DIM   = "rgba(0,200,150,0.07)"

const FF_EVENT_LABEL = {
  [SIGNAL_TYPES.FF_JOB_COMPLETED]:      "move complete",
  [SIGNAL_TYPES.FF_ESTIMATE_APPROVED]:  "estimate set",
  [SIGNAL_TYPES.FF_CLIENT_SIGNED]:      "client signed",
  [SIGNAL_TYPES.FF_PAYMENT_CONFIRMED]:  "payment in",
  [SIGNAL_TYPES.FF_DELIVERY_CONFIRMED]: "delivered",
  [SIGNAL_TYPES.FF_DRIVER_SIGNED]:      "driver closed",
  [SIGNAL_TYPES.FF_LOADING_COMPLETE]:   "loaded",
  [SIGNAL_TYPES.FF_ESTIMATE_VARIANCE]:  "CF variance",
  [SIGNAL_TYPES.FF_MISSING_SIGNATURE]:  "unsigned close",
  [SIGNAL_TYPES.FF_PAYMENT_DELAY]:      "payment delay",
}

const FF_EVENT_COLOR = {
  [SIGNAL_TYPES.FF_JOB_COMPLETED]:      "#00c896",
  [SIGNAL_TYPES.FF_ESTIMATE_APPROVED]:  "#00c896",
  [SIGNAL_TYPES.FF_CLIENT_SIGNED]:      "#00c896",
  [SIGNAL_TYPES.FF_PAYMENT_CONFIRMED]:  "#00c896",
  [SIGNAL_TYPES.FF_DELIVERY_CONFIRMED]: "#00c896",
  [SIGNAL_TYPES.FF_DRIVER_SIGNED]:      "#8daac4",
  [SIGNAL_TYPES.FF_LOADING_COMPLETE]:   "#8daac4",
  [SIGNAL_TYPES.FF_ESTIMATE_VARIANCE]:  "#ff9f43",
  [SIGNAL_TYPES.FF_MISSING_SIGNATURE]:  "#ff6b6b",
  [SIGNAL_TYPES.FF_PAYMENT_DELAY]:      "#ff6b6b",
}

const RISK_TYPES = new Set([
  SIGNAL_TYPES.FF_ESTIMATE_VARIANCE,
  SIGNAL_TYPES.FF_MISSING_SIGNATURE,
  SIGNAL_TYPES.FF_PAYMENT_DELAY,
])

const FF_TYPES = new Set(Object.keys(FF_EVENT_LABEL))

const SEV_COLOR = {
  critical: "#ff6b6b",
  warning:  "#ff9f43",
  insight:  "#00c896",
}

function IntelligencePanel({ observations }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div style={{ marginBottom: 24 }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: "100%", background: "none", border: "none", cursor: "pointer",
          padding: 0, display: "flex", alignItems: "center", gap: 8, marginBottom: expanded ? 10 : 0,
        }}
      >
        <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: OPS_COLOR }}>
          PACER Intelligence
        </div>
        {observations.length > 0 && (
          <div style={{
            fontSize: "0.38rem", fontFamily: "monospace", padding: "1px 6px",
            borderRadius: 3, background: `${SEV_COLOR[observations[0].severity]}18`,
            color: SEV_COLOR[observations[0].severity], border: `1px solid ${SEV_COLOR[observations[0].severity]}40`,
            letterSpacing: "0.12em",
          }}>
            {observations.filter(o => o.severity === "critical").length > 0
              ? `${observations.filter(o => o.severity === "critical").length} critical`
              : `${observations.length} signal${observations.length !== 1 ? "s" : ""}`
            }
          </div>
        )}
        <div style={{ marginLeft: "auto", fontSize: "0.42rem", color: "var(--fg-4)", fontFamily: "monospace" }}>
          {expanded ? "▲" : "▼"}
        </div>
      </button>

      {expanded && (
        <div>
          {observations.length === 0 && (
            <div style={{
              padding: "12px 14px", borderRadius: 7,
              background: "var(--bg-card)", border: "1px solid var(--border-lo)",
              fontSize: "0.66rem", color: "var(--fg-4)", lineHeight: 1.6,
            }}>
              No signals yet. Observations will appear as FleetFlow jobs are recorded.
            </div>
          )}

          {observations.map(obs => {
            const color = SEV_COLOR[obs.severity]
            return (
              <div key={obs.id} style={{
                padding: "10px 14px", marginBottom: 6, borderRadius: 7,
                background: `${color}06`,
                border: `1px solid ${color}22`,
                borderLeft: `3px solid ${color}`,
                animation: "fadeUp 0.2s ease",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ fontSize: "0.7rem", color, flexShrink: 0, marginTop: 1, lineHeight: 1 }}>
                    {obs.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: "0.62rem", fontWeight: 700, color, letterSpacing: "0.04em" }}>
                        {obs.label}
                      </span>
                      {obs.count > 1 && (
                        <span style={{
                          fontSize: "0.38rem", fontFamily: "monospace", padding: "1px 5px",
                          borderRadius: 3, background: `${color}18`, color, border: `1px solid ${color}30`,
                        }}>
                          ×{obs.count}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.64rem", color: "var(--fg-3)", lineHeight: 1.5 }}>
                      {obs.detail}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function timeAgo(ts) {
  const d = Date.now() - ts
  if (d < 60000)    return "just now"
  if (d < 3600000)  return `${Math.floor(d / 60000)}m ago`
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`
  return `${Math.floor(d / 86400000)}d ago`
}

function isToday(ts) {
  const d     = new Date(ts)
  const today = new Date()
  return d.toDateString() === today.toDateString()
}

export default function DispatcherWorkspace({
  persona,
  messages,
  thinking,
  input,
  onInputChange,
  onSend,
  voiceEnabled,
  threadsOpen,
  commandOpen,
  onToggleVoice,
  onOpenThreads,
  onOpenCommand,
}) {
  const laneConfig = LANE_MAP["ops"]
  const bottomRef  = useRef(null)
  const [intake]   = useState(() => getWeeklyJobIntake())

  const allSignals    = getRecentSignals(200)
  const ffSignals     = allSignals.filter(s => FF_TYPES.has(s.type))
  const todaySignals  = ffSignals.filter(s => isToday(s.createdAt))
  const riskSignals   = ffSignals.filter(s => RISK_TYPES.has(s.type)).slice(0, 5)
  const opsMessages   = messages.filter(m => m.lane === "ops" && (m.role === "user" || m.role === "bot"))
  const intelligence  = !isCrewView ? computeIntelligence(allSignals) : []

  const isCrewView = persona === "crew"

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, thinking])

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 0" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 20px" }}>

          {/* Header */}
          <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: OPS_COLOR, marginBottom: 5 }}>
                {isCrewView ? "Crew · Field Operations" : "Dispatcher · Field Operations"}
              </div>
              <div style={{ fontSize: "1.0rem", fontWeight: 800, color: "var(--fg)", letterSpacing: "0.01em" }}>
                {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
              </div>
            </div>
            {!isCrewView && (
              <div style={{ textAlign: "right", paddingTop: 2 }}>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: intake.thisWeek > 0 ? OPS_COLOR : "var(--fg-4)", lineHeight: 1, fontFamily: "monospace" }}>
                  {intake.thisWeek}
                </div>
                <div style={{ fontSize: "0.38rem", fontFamily: "monospace", color: "var(--fg-4)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
                  moves this week
                </div>
              </div>
            )}
          </div>

          {/* PACER Intelligence — owner-facing observations, dispatcher only */}
          {!isCrewView && (
            <IntelligencePanel observations={intelligence} />
          )}

          {/* Risk Flags — dispatcher only, shown when present */}
          {!isCrewView && riskSignals.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "#ff6b6b", marginBottom: 8 }}>
                {riskSignals.length} risk{riskSignals.length !== 1 ? "s" : ""} flagged
              </div>
              {riskSignals.map(s => (
                <div key={s.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", marginBottom: 6, borderRadius: 6,
                  background: `${FF_EVENT_COLOR[s.type]}08`,
                  border: `1px solid ${FF_EVENT_COLOR[s.type]}30`,
                  borderLeft: `2px solid ${FF_EVENT_COLOR[s.type]}`,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: s.summary ? 2 : 0 }}>
                      <span style={{ fontSize: "0.6rem", fontFamily: "monospace", fontWeight: 700, color: FF_EVENT_COLOR[s.type] }}>
                        {s.title || "FF-?"}
                      </span>
                      <span style={{ fontSize: "0.52rem", color: FF_EVENT_COLOR[s.type], textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "monospace" }}>
                        {FF_EVENT_LABEL[s.type]}
                      </span>
                    </div>
                    {s.summary && (
                      <div style={{ fontSize: "0.48rem", color: "var(--fg-4)", fontFamily: "monospace" }}>{s.summary}</div>
                    )}
                  </div>
                  <div style={{ fontSize: "0.42rem", color: "var(--fg-4)", fontFamily: "monospace", flexShrink: 0 }}>
                    {timeAgo(s.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Today's Activity */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <span>today's activity</span>
              {todaySignals.length > 0 && (
                <span style={{ color: OPS_COLOR }}>{todaySignals.length} event{todaySignals.length !== 1 ? "s" : ""}</span>
              )}
            </div>

            {ffSignals.length === 0 && (
              <div style={{ padding: "14px 16px", borderRadius: 7, background: "var(--bg-card)", border: "1px solid var(--border-lo)", fontSize: "0.72rem", color: "var(--fg-4)", lineHeight: 1.6 }}>
                No FleetFlow activity yet. Jobs will appear here as they come in.
              </div>
            )}

            {todaySignals.length === 0 && ffSignals.length > 0 && (
              <div style={{ padding: "10px 14px", borderRadius: 6, background: "var(--bg-card)", border: "1px solid var(--border-lo)", fontSize: "0.66rem", color: "var(--fg-4)", fontFamily: "monospace" }}>
                No moves today — {ffSignals.length} total on record.
              </div>
            )}

            {todaySignals.map(s => (
              <div key={s.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px", marginBottom: 5, borderRadius: 6,
                background: "var(--bg-card)", border: "1px solid var(--border-lo)",
                borderLeft: `2px solid ${(FF_EVENT_COLOR[s.type] || OPS_COLOR)}40`,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: FF_EVENT_COLOR[s.type] || OPS_COLOR, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: s.summary ? 2 : 0 }}>
                    <span style={{ fontSize: "0.6rem", fontFamily: "monospace", fontWeight: 700, color: "var(--fg-2)" }}>
                      {s.title || "FF-?"}
                    </span>
                    <span style={{ fontSize: "0.52rem", color: FF_EVENT_COLOR[s.type] || OPS_COLOR, fontFamily: "monospace", letterSpacing: "0.04em" }}>
                      {FF_EVENT_LABEL[s.type] || s.type}
                    </span>
                  </div>
                  {s.summary && (
                    <div style={{ fontSize: "0.48rem", color: "var(--fg-4)", fontFamily: "monospace" }}>{s.summary}</div>
                  )}
                </div>
                <div style={{ fontSize: "0.42rem", color: "var(--fg-4)", fontFamily: "monospace", flexShrink: 0 }}>
                  {timeAgo(s.createdAt)}
                </div>
              </div>
            ))}
          </div>

          {/* Recent history — shown when no today events but history exists */}
          {todaySignals.length === 0 && ffSignals.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 8 }}>
                recent moves
              </div>
              {ffSignals.slice(0, 5).map(s => (
                <div key={s.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "7px 12px", marginBottom: 5, borderRadius: 6,
                  background: "var(--bg-card)", border: "1px solid var(--border-lo)",
                  borderLeft: `2px solid ${(FF_EVENT_COLOR[s.type] || OPS_COLOR)}25`,
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: FF_EVENT_COLOR[s.type] || OPS_COLOR, flexShrink: 0, opacity: 0.5 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: s.summary ? 2 : 0 }}>
                      <span style={{ fontSize: "0.58rem", fontFamily: "monospace", color: "var(--fg-3)" }}>
                        {s.title || "FF-?"}
                      </span>
                      <span style={{ fontSize: "0.5rem", color: `${FF_EVENT_COLOR[s.type] || OPS_COLOR}80`, fontFamily: "monospace" }}>
                        {FF_EVENT_LABEL[s.type] || s.type}
                      </span>
                    </div>
                    {s.summary && (
                      <div style={{ fontSize: "0.46rem", color: "var(--fg-4)", fontFamily: "monospace", opacity: 0.7 }}>{s.summary}</div>
                    )}
                  </div>
                  <div style={{ fontSize: "0.42rem", color: "var(--fg-4)", fontFamily: "monospace", flexShrink: 0, opacity: 0.6 }}>
                    {timeAgo(s.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* OPSCORE conversation thread */}
          {opsMessages.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: "0.44rem", fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 8 }}>
                opscore
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {opsMessages.slice(-8).map((m, i) => {
                  const isUser = m.role === "user"
                  return (
                    <div key={i} style={{ display: "flex", gap: 8, flexDirection: isUser ? "row-reverse" : "row", animation: "fadeUp 0.2s ease" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.44rem", fontWeight: 800, flexShrink: 0, marginTop: 3, background: isUser ? "var(--bg-card)" : OPS_DIM, border: isUser ? "1px solid var(--border)" : `1px solid ${OPS_COLOR}40`, color: isUser ? "var(--fg-3)" : OPS_COLOR }}>
                        {isUser ? "J" : "P"}
                      </div>
                      <div style={{ maxWidth: "84%", padding: "9px 13px", borderRadius: 9, fontSize: "0.82rem", lineHeight: 1.75, background: isUser ? "var(--bg-card)" : "var(--bg-panel)", border: "1px solid var(--border)", borderLeft: !isUser ? `2px solid ${OPS_COLOR}` : undefined, borderTopRightRadius: isUser ? 2 : 9, borderTopLeftRadius: !isUser ? 2 : 9, color: "var(--fg-body)" }}>
                        {formatMessage(m.text)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Thinking indicator */}
          {thinking && (
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.44rem", fontWeight: 800, background: OPS_DIM, border: `1px solid ${OPS_COLOR}40`, color: OPS_COLOR, flexShrink: 0, marginTop: 3 }}>P</div>
              <div style={{ padding: "10px 14px", borderRadius: 9, borderTopLeftRadius: 2, background: "var(--bg-panel)", border: "1px solid var(--border)", borderLeft: `2px solid ${OPS_COLOR}`, display: "flex", gap: 5, alignItems: "center" }}>
                {[0, 0.18, 0.36].map((d, i) => (
                  <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: OPS_COLOR, animation: `blink 1.1s ${d}s infinite` }} />
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
        onInputChange={onInputChange}
        onSend={onSend}
        onFileSelect={() => {}}
      />
    </div>
  )
}
