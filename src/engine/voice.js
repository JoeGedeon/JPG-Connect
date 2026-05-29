// src/engine/voice.js
// PACER voice presence — TTS output only, opt-in

const synth = typeof window !== "undefined" ? window.speechSynthesis : null
let _cachedVoice = null

function resolveVoice() {
  if (_cachedVoice) return _cachedVoice
  if (!synth) return null
  const voices = synth.getVoices()
  if (!voices.length) return null
  _cachedVoice =
    voices.find(v => v.name === "Samantha") ||
    voices.find(v => v.name === "Google US English") ||
    voices.find(v => v.name === "Daniel") ||
    voices.find(v => v.name.includes("Zira")) ||
    voices.find(v => v.lang === "en-US" && v.localService) ||
    voices.find(v => v.lang.startsWith("en")) ||
    voices[0] || null
  return _cachedVoice
}

if (synth) {
  synth.addEventListener?.("voiceschanged", () => { _cachedVoice = null; resolveVoice() })
}

function stripMarkdown(text) {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`{3}[\s\S]*?`{3}/g, "")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .trim()
}

export function canSpeak() { return !!synth }

export function speak(text, { rate = 0.9, pitch = 0.86, volume = 0.95 } = {}) {
  if (!synth) return
  synth.cancel()
  const clean = stripMarkdown(text).slice(0, 420)
  if (!clean) return
  const u = new SpeechSynthesisUtterance(clean)
  u.rate = rate
  u.pitch = pitch
  u.volume = volume
  const voice = resolveVoice()
  if (voice) u.voice = voice
  synth.speak(u)
}

export function stopSpeaking() { synth?.cancel() }
export function isSpeaking() { return synth?.speaking ?? false }
