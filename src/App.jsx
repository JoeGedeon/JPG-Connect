// src/App.jsx
// PACER Command Center — main shell
// Three-column: SideRail | Center (conversation + overlays) | ActiveContextRail

import { useState, useEffect } from "react"
import { LANES, LANE_MAP } from "./config/lanes.js"
import { loadStorage } from "./utils/storage.js"
import { canSpeak } from "./engine/voice.js"
import { getUpcomingEvents, getOverdueEvents, EVENT_TYPES } from "./engine/calendar.js"
import AuthGate from "./layers/auth/AuthGate.jsx"
import JarvisInterface from "./layers/jarvis/JarvisInterface.jsx"

// ── CSS custom properties ─────────────────────────────────────────────────────

const THEME = `
[data-theme="dark"] {
  --bg:        #080810;
  --bg-rail:   #060612;
  --bg-panel:  #0d0d1e;
  --bg-card:   #111128;
  --bg-input:  #0f0f22;
  --border-hi: #323264;
  --border:    #222242;
  --border-lo: #141430;
  --fg:        #d8e1f0;
  --fg-body:   #ccd4ea;
  --fg-2:      #9898cc;
  --fg-3:      #5858a0;
  --fg-4:      #3c3c70;
  --fg-hover:  #f0f4ff;
  --scroll:    #252540;
}
`

const GLOBAL = `
*,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { height: 100%; overflow: hidden; }
body { font-family: 'Segoe UI', system-ui, sans-serif; }
::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--scroll); border-radius: 4px; }
@keyframes fadeUp  { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
@keyframes blink   { 0%,100% { opacity:.15; transform:scale(.75) } 50% { opacity:1; transform:scale(1.1) } }
@keyframes spin    { to { transform:rotate(360deg) } }
@keyframes pulse   { 0%,100% { opacity:.4 } 50% { opacity:1 } }
@media (max-width: 640px) {
  .pacer-left-rail    { display: none !important; }
  .pacer-context-rail { display: none !important; }
}
`

// ── Active Context Rail ───────────────────────────────────────────────────────

function ActiveContextRail({ onPrefill }) {
  const [overdue, setOverdue]   = useState([])
  const [upcoming, setUpcoming] = useState([])

  useEffect(() => {
    setOverdue(getOverdueEvents())
    setUpcoming(getUpcomingEvents(7))
  }, [])

  function fmtEvtTime(ts) {
    const d        = new Date(ts)
    const today    = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    if (d.toDateString() === today.toDateString())    return "Today "    + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
  }

  const allEmpty = overdue.length === 0 && upcoming.length === 0

  return (
    <div className="pacer-context-rail" style={{ width: 180, flexShrink: 0, background: "var(--bg-rail)", borderLeft: "1px solid var(--border-lo)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "14px 12px 8px", borderBottom: "1px solid var(--border-lo)" }}>
        <div style={{ fontSize: "0.54rem", fontFamily: "monospace", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-4)" }}>Active Context</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
        {overdue.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: "0.5rem", fontFamily: "monospace", letterSpacing: "0.12em", color: "#ff6b6b", textTransform: "uppercase", marginBottom: 6 }}>Overdue</div>
            {overdue.map(evt => (
              <div key={evt.id} style={{ marginBottom: 6, padding: "6px 8px", borderRadius: 5, background: "var(--bg-card)", borderLeft: `2px solid ${EVENT_TYPES[evt.type]?.color || "#ff6b6b"}` }}>
                <div style={{ fontSize: "0.66rem", color: "var(--fg-body)", lineHeight: 1.35, marginBottom: 2 }}>{evt.title}</div>
                <div style={{ fontSize: "0.52rem", color: "#ff6b6b", fontFamily: "monospace" }}>{fmtEvtTime(evt.dueAt)}</div>
              </div>
            ))}
          </div>
        )}

        {upcoming.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: "0.5rem", fontFamily: "monospace", letterSpacing: "0.12em", color: "var(--fg-4)", textTransform: "uppercase", marginBottom: 6 }}>Upcoming</div>
            {upcoming.map(evt => (
              <div key={evt.id} style={{ marginBottom: 6, padding: "6px 8px", borderRadius: 5, background: "var(--bg-card)", borderLeft: `2px solid ${EVENT_TYPES[evt.type]?.color || "var(--fg-3)"}` }}>
                <div style={{ fontSize: "0.66rem", color: "var(--fg-body)", lineHeight: 1.35, marginBottom: 2 }}>{evt.title}</div>
                <div style={{ fontSize: "0.52rem", color: "var(--fg-4)", fontFamily: "monospace" }}>{fmtEvtTime(evt.dueAt)}</div>
              </div>
            ))}
          </div>
        )}

        {allEmpty && (
          <div style={{ paddingTop: 16, textAlign: "center" }}>
            <div style={{ fontSize: "0.62rem", color: "var(--fg-4)", lineHeight: 1.5, marginBottom: 10 }}>No events scheduled.</div>
            <div
              onClick={() => onPrefill?.("Add to my timeline: ")}
              style={{ fontSize: "0.58rem", color: "var(--fg-3)", fontFamily: "monospace", cursor: "pointer", textDecoration: "underline" }}>
              + schedule
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Threads Panel ─────────────────────────────────────────────────────────────

function ThreadsPanel({ lane, onClose, onOpenLane }) {
  const init    = loadStorage()
  const allMsgs = init?.messages || []

  const threads = LANES.map(l => {
    const msgs  = allMsgs.filter(m => m.lane === l.id && (m.role === "user" || m.role === "bot"))
    const last  = [...msgs].reverse().find(m => m.role === "bot")
    return { lane: l, count: msgs.length, preview: last?.text?.slice(0, 72) || null }
  }).filter(t => t.count > 0)

  return (
    <div style={{ position: "absolute", bottom: 62, left: 0, right: 0, zIndex: 10, background: "var(--bg-panel)", borderTop: "1px solid var(--border)", boxShadow: "0 -4px 24px rgba(0,0,8,0.5)", padding: 14, maxHeight: 280, overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: "0.56rem", fontFamily: "monospace", letterSpacing: "0.14em", color: "var(--fg-4)", textTransform: "uppercase" }}>Lane Threads</div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--fg-4)", cursor: "pointer", fontSize: "0.7rem" }}>✕</button>
      </div>
      {threads.length === 0 && (
        <div style={{ fontSize: "0.7rem", color: "var(--fg-4)", textAlign: "center", paddingTop: 10, fontFamily: "monospace" }}>No conversations yet. Start a lane.</div>
      )}
      {threads.map(({ lane: l, count, preview }) => (
        <div key={l.id} onClick={() => onOpenLane(l.id)}
          style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 10px", borderRadius: 6, border: `1px solid ${lane === l.id ? l.color + "50" : "var(--border-lo)"}`, background: lane === l.id ? l.dim : "var(--bg-card)", cursor: "pointer", marginBottom: 6, transition: "all 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = l.color + "60"}
          onMouseLeave={e => e.currentTarget.style.borderColor = lane === l.id ? l.color + "50" : "var(--border-lo)"}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: l.color, flexShrink: 0, marginTop: 6 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: "0.62rem", fontWeight: 700, color: l.color, fontFamily: "monospace", letterSpacing: "0.08em" }}>{l.label}</span>
              <span style={{ fontSize: "0.52rem", color: "var(--fg-4)", fontFamily: "monospace" }}>{count} msgs</span>
            </div>
            {preview && <div style={{ fontSize: "0.66rem", color: "var(--fg-3)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preview}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Command Palette ───────────────────────────────────────────────────────────

const COMMANDS = [
  { label: "Declare",  action: "I want to formally declare: " },
  { label: "Schedule", action: "Add to my timeline: " },
  { label: "Reflect",  action: "I've been thinking about: " },
  { label: "Plan",     action: "Plan: " },
  { label: "Release",  action: "Release note for: " },
  { label: "Brief me", action: "Give me a situational awareness brief on everything I'm currently tracking." },
]

function CommandPalette({ lane, onClose, onAction }) {
  const lc = LANE_MAP[lane]
  return (
    <div style={{ position: "absolute", bottom: 62, left: 0, right: 0, zIndex: 10, background: "var(--bg-panel)", borderTop: "1px solid var(--border)", boxShadow: "0 -4px 24px rgba(0,0,8,0.5)", padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: "0.56rem", fontFamily: "monospace", letterSpacing: "0.14em", color: "var(--fg-4)", textTransform: "uppercase" }}>Command</div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--fg-4)", cursor: "pointer", fontSize: "0.7rem" }}>✕</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
        {COMMANDS.map(({ label, action }) => (
          <button key={label} onClick={() => onAction(action)}
            style={{ padding: "10px 8px", border: "1px solid var(--border)", borderRadius: 7, background: "var(--bg-card)", color: "var(--fg-2)", fontSize: "0.66rem", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.06em", cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = lc.color + "60"; e.currentTarget.style.color = lc.color }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--fg-2)" }}>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Side Rail ─────────────────────────────────────────────────────────────────

function SideRail({ lane, setLane, voiceEnabled, onToggleVoice }) {
  const lc          = LANE_MAP[lane]
  const voiceAvail  = canSpeak()

  return (
    <div className="pacer-left-rail" style={{ width: 208, flexShrink: 0, background: "var(--bg-rail)", borderRight: "1px solid var(--border-lo)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--border-lo)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 26, height: 26, background: lc.color, clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)", boxShadow: `0 0 12px ${lc.glow}`, transition: "all 0.4s", flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--fg)", lineHeight: 1 }}>Pacer</div>
          <div style={{ fontSize: "0.48rem", color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 2 }}>JPG Ventures OS</div>
        </div>
      </div>

      <div style={{ padding: "12px 10px", flex: 1 }}>
        <div style={{ fontSize: "0.48rem", fontFamily: "monospace", letterSpacing: "0.14em", color: "var(--fg-4)", textTransform: "uppercase", marginBottom: 8, paddingLeft: 4 }}>Lanes</div>
        {LANES.map(l => (
          <button key={l.id} onClick={() => setLane(l.id)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", marginBottom: 3, border: `1px solid ${lane === l.id ? l.color + "50" : "transparent"}`, borderRadius: 7, background: lane === l.id ? l.dim : "transparent", color: lane === l.id ? l.color : "var(--fg-3)", cursor: "pointer", transition: "all 0.15s", textAlign: "left" }}
            onMouseEnter={e => { if (lane !== l.id) { e.currentTarget.style.background = "var(--bg-card)"; e.currentTarget.style.color = "var(--fg-2)" }}}
            onMouseLeave={e => { if (lane !== l.id) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fg-3)" }}}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: lane === l.id ? l.color : "var(--fg-4)", flexShrink: 0, boxShadow: lane === l.id ? `0 0 6px ${l.color}` : "none", transition: "all 0.3s" }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.66rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>{l.label}</div>
              <div style={{ fontSize: "0.54rem", color: lane === l.id ? l.color + "80" : "var(--fg-4)", marginTop: 1 }}>{l.subtitle}</div>
            </div>
          </button>
        ))}
      </div>

      <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border-lo)" }}>
        {voiceAvail && (
          <button onClick={onToggleVoice}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", border: `1px solid ${voiceEnabled ? lc.color + "50" : "var(--border)"}`, borderRadius: 7, background: voiceEnabled ? lc.dim : "transparent", color: voiceEnabled ? lc.color : "var(--fg-4)", cursor: "pointer", fontSize: "0.6rem", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", transition: "all 0.15s" }}>
            <span style={{ animation: voiceEnabled ? "pulse 3s ease-in-out infinite" : "none" }}>◎</span>
            Voice {voiceEnabled ? "on" : "off"}
          </button>
        )}
        <div style={{ marginTop: 8, fontSize: "0.48rem", color: "var(--fg-4)", fontFamily: "monospace", textAlign: "center", letterSpacing: "0.1em" }}>
          {new Date().toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
        </div>
      </div>
    </div>
  )
}

// ── App root ──────────────────────────────────────────────────────────────────

export default function App() {
  const init = loadStorage()

  const [lane, setLane]               = useState(() => init?.lane || "ops")
  const [voiceEnabled, setVoiceEnabled] = useState(() => localStorage.getItem("pacer_voice") === "true")
  const [threadsOpen, setThreadsOpen]   = useState(false)
  const [commandOpen, setCommandOpen]   = useState(false)
  const [prefill, setPrefill]           = useState("")

  function toggleVoice() {
    setVoiceEnabled(v => {
      const next = !v
      localStorage.setItem("pacer_voice", String(next))
      return next
    })
  }

  function handleOpenThreads() { setCommandOpen(false); setThreadsOpen(v => !v) }
  function handleOpenCommand()  { setThreadsOpen(false); setCommandOpen(v => !v) }

  function handleCommandAction(text) { setCommandOpen(false); setPrefill(text) }
  function handleOpenLane(laneId)    { setLane(laneId); setThreadsOpen(false) }

  return (
    <AuthGate>
      <div data-theme="dark" style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", color: "var(--fg)" }}>
        <style>{THEME + GLOBAL}</style>

        <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
          <SideRail lane={lane} setLane={setLane} voiceEnabled={voiceEnabled} onToggleVoice={toggleVoice} />

          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
            {threadsOpen && (
              <ThreadsPanel lane={lane} onClose={() => setThreadsOpen(false)} onOpenLane={handleOpenLane} />
            )}
            {commandOpen && (
              <CommandPalette lane={lane} onClose={() => setCommandOpen(false)} onAction={handleCommandAction} />
            )}

            <JarvisInterface
              lane={lane}
              voiceEnabled={voiceEnabled}
              onToggleVoice={toggleVoice}
              threadsOpen={threadsOpen}
              commandOpen={commandOpen}
              onOpenThreads={handleOpenThreads}
              onOpenCommand={handleOpenCommand}
              prefill={prefill}
              onClearPrefill={() => setPrefill("")}
              savedMessages={init?.messages}
              savedHistory={{
                ops:      init?.opsHistory      || [],
                creative: init?.creativeHistory || [],
                claw:     init?.clawHistory     || [],
              }}
            />
          </div>

          <ActiveContextRail onPrefill={text => setPrefill(text)} />
        </div>
      </div>
    </AuthGate>
  )
}
