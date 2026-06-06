// src/config/providers.js
// PACER Provider Routing Table — JPG-022
// The model is a runtime decision. The lane is permanent.
// Models arrive empty. PACER contains the context.

export const PROVIDERS = {
  anthropic: {
    name:   "Anthropic",
    models: {
      "claude-sonnet-4-6": { label: "Claude Sonnet 4.6", speed: "fast",   strength: "reasoning"  },
      "claude-opus-4-8":   { label: "Claude Opus 4.8",   speed: "deep",   strength: "frontier"   },
    },
  },
  mistral: {
    name:   "Mistral AI",
    models: {
      "mistral-large-latest": { label: "Mistral Large 3", speed: "fast",  strength: "operations" },
      "mistral-small-latest": { label: "Mistral Small",   speed: "ultra", strength: "speed"      },
    },
  },
  openai: {
    name:   "OpenAI",
    models: {
      "gpt-4o":      { label: "GPT-4o",      speed: "fast",  strength: "general"    },
      "o3":          { label: "o3",           speed: "deep",  strength: "reasoning"  },
    },
  },
  local: {
    name:   "Local",
    models: {
      "llama-3":  { label: "Llama 3",  speed: "fast",  strength: "private"    },
      "qwen-2.5": { label: "Qwen 2.5", speed: "fast",  strength: "operations" },
    },
  },
}

// PACER routing table — one line per lane.
// Swap provider or model here. Nothing else changes.
export const LANE_PROVIDERS = {
  ops:       { provider: "anthropic", model: "claude-sonnet-4-6" },
  creative:  { provider: "anthropic", model: "claude-sonnet-4-6" },
  kel:       { provider: "anthropic", model: "claude-sonnet-4-6" },
  vera:      { provider: "anthropic", model: "claude-sonnet-4-6" },
  archivist: { provider: "anthropic", model: "claude-sonnet-4-6" },
}

export function getProviderForLane(lane) {
  return LANE_PROVIDERS[lane] || LANE_PROVIDERS.ops
}

export function getProviderLabel(provider, model) {
  const p = PROVIDERS[provider]
  if (!p) return provider
  const m = p.models[model]
  return m ? `${p.name} · ${m.label}` : `${p.name} · ${model}`
}
