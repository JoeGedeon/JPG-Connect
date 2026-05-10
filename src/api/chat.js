// src/api/chat.js
// Pacer Command Center - Chat API Client
// JPG Ventures LLC
// All calls go to backend proxy - no model keys in browser.

export async function sendChat({ lane, system, messages }) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lane, system, messages }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server error: ${res.status}`);
  }

  const data = await res.json();
  return data.content || data.message || "No response received.";
}
