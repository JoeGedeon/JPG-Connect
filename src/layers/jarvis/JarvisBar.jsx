// src/layers/jarvis/JarvisBar.jsx
// PACER bottom action bar — voice, upload, threads, command, input, send

import { useRef } from "react"

function aBtn(active, color) {
  return {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "0 10px",
    height: 36,
    border: `1px solid ${active ? color + "80" : "var(--border)"}`,
    borderRadius: 6,
    background: active ? color + "14" : "transparent",
    color: active ? color : "var(--fg-3)",
    fontSize: "0.6rem",
    fontFamily: "monospace",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "all 0.15s",
    flexShrink: 0,
    whiteSpace: "nowrap",
  }
}

export default function JarvisBar({
  laneConfig,
  voiceEnabled,
  thinking,
  threadsOpen,
  commandOpen,
  onToggleVoice,
  onOpenThreads,
  onOpenCommand,
  input,
  onInputChange,
  onSend,
  onFileSelect,
}) {
  const fileInputRef = useRef(null)
  const { color, placeholder } = laneConfig

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend() }
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (file && onFileSelect) onFileSelect(file)
    e.target.value = ""
  }

  const canSend = !thinking && !!input.trim()

  return (
    <div style={{
      height: 60,
      flexShrink: 0,
      background: "var(--bg-panel)",
      borderTop: "1px solid var(--border)",
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "0 12px",
    }}>
      <button onClick={onToggleVoice} style={aBtn(voiceEnabled, color)} title="Toggle voice presence">
        ◎ Voice
      </button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFile}
        accept="image/*,audio/*,.pdf,.txt,.md,.doc,.docx"
        hidden
      />
      <button onClick={() => fileInputRef.current?.click()} style={aBtn(false, color)} title="Attach a file">
        + Upload
      </button>

      <button onClick={onOpenThreads} style={aBtn(threadsOpen, color)} title="View lane threads">
        ≡ Threads
      </button>

      <button onClick={onOpenCommand} style={aBtn(commandOpen, color)} title="Command palette">
        ⌘ Command
      </button>

      <div style={{ width: 1, height: 30, background: "var(--border)", flexShrink: 0 }} />

      <textarea
        style={{
          flex: 1,
          height: 40,
          background: "var(--bg-input)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          color: "var(--fg-body)",
          fontFamily: "inherit",
          fontSize: "0.84rem",
          padding: "10px 13px",
          resize: "none",
          outline: "none",
          lineHeight: 1.4,
          overflow: "auto",
        }}
        placeholder={placeholder}
        value={input}
        onChange={e => onInputChange(e.target.value)}
        onKeyDown={handleKey}
        rows={1}
      />

      <button
        onClick={onSend}
        disabled={!canSend}
        style={{
          width: 40,
          height: 40,
          border: "none",
          background: canSend ? color : "var(--bg-card)",
          cursor: canSend ? "pointer" : "not-allowed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          opacity: canSend ? 1 : 0.35,
          transition: "all 0.2s",
          flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={canSend ? "#000" : "var(--fg-4)"}>
          <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
        </svg>
      </button>
    </div>
  )
}
