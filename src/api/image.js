// src/api/image.js
// Pacer Command Center - Image API Client
// JPG Ventures LLC
// Routes to backend which calls OpenAI gpt-image-1.
// Size map normalizes legacy DALL-E 3 sizes.

const SIZE_MAP = {
  "1024x1024": "1024x1024",
  "1536x1024": "1536x1024",
  "1024x1536": "1024x1536",
  "1792x1024": "1536x1024",
  "1024x1792": "1024x1536",
};

export async function generateImage({ prompt, size = "1024x1024", style = "vivid", quality = "hd" }) {
  const normalizedSize = SIZE_MAP[size] || "1024x1024";

  const res = await fetch("/api/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, size: normalizedSize, style, quality }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Image server error: ${res.status}`);
  }

  const data = await res.json();

  if (!data.url && !data.b64) {
    throw new Error("No image returned from server.");
  }

  return {
    url: data.url || null,
    b64: data.b64 || null,
    enhancedPrompt: data.enhancedPrompt || prompt,
  };
}
