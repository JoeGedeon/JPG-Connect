// src/engine/moments.js
// Declarable Moment Engine — catches institutional knowledge at transition boundaries.
// The bottleneck is acquisition. This catches knowledge the moment it is created.

export const MOMENT_TYPES = {
  CONFLICT_RESOLVED: "conflict_resolved",
  TENSION_RESOLVED:  "tension_resolved",
  DECISION_DETECTED: "decision_detected",
  TASK_COMPLETED:    "task_completed",
  MANUAL_CAPTURE:    "manual_capture",
}

const PROMPTS = {
  [MOMENT_TYPES.CONFLICT_RESOLVED]: {
    headline: "Conflict resolved",
    question: "Should this reasoning become doctrine?",
  },
  [MOMENT_TYPES.TENSION_RESOLVED]: {
    headline: "Tension resolved",
    question: "Did the resolution reveal a principle worth keeping?",
  },
  [MOMENT_TYPES.DECISION_DETECTED]: {
    headline: "Decision detected",
    question: "Should this become institutional memory?",
  },
  [MOMENT_TYPES.TASK_COMPLETED]: {
    headline: "Task completed",
    question: "Did we learn something worth keeping?",
  },
  [MOMENT_TYPES.MANUAL_CAPTURE]: {
    headline: "Capture moment",
    question: "What should the institution remember?",
  },
}

export function getMomentPrompt(type) {
  return PROMPTS[type] || PROMPTS[MOMENT_TYPES.MANUAL_CAPTURE]
}

// Heuristics for detecting decision language in AI replies.
// Fires when ≥ 2 signals are found — avoids triggering on passing mentions.
const DECISION_SIGNALS = [
  /\bwe (should|will|decided|agreed|concluded)\b/i,
  /\bgoing forward\b/i,
  /\bfrom now on\b/i,
  /\bthe (rule|principle|standard|policy|decision) is\b/i,
  /\bshould become (doctrine|policy|standard|principle)\b/i,
  /\bthis (means|implies|establishes)\b/i,
  /\bconcluded that\b/i,
  /\bour approach (is|will be|should be)\b/i,
  /\bwe (need to|must|have to) (establish|adopt|commit)\b/i,
  /\bthe answer is\b/i,
]

export function detectDecisionSignals(text) {
  if (!text) return false
  return DECISION_SIGNALS.filter(rx => rx.test(text)).length >= 2
}

// Extract the most signal-dense sentence as a context snippet (max 160 chars).
export function extractContext(text) {
  if (!text) return ""
  const sentences = text.split(/(?<=[.!?])\s+/)
  const scored = sentences
    .map(s => ({ s, score: DECISION_SIGNALS.filter(rx => rx.test(s)).length }))
    .sort((a, b) => b.score - a.score)
  const best = scored[0]?.s || text
  return best.length > 160 ? best.slice(0, 157) + "…" : best
}
