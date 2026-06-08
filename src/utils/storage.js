// src/utils/storage.js
// Pacer Command Center - Storage Helpers
// JPG Ventures LLC

import { STORAGE_KEY } from "../config/lanes.js";

export function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Returns "ok" | "trimmed" | "failed" — callers should surface "trimmed" and "failed" to the user.
export function saveStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return "ok";
  } catch (err) {
    if (err && (err.name === "QuotaExceededError" || err.code === 22 || err.code === 1014)) {
      try {
        const trimmed = {
          ...data,
          messages:        (data.messages        || []).slice(-50),
          opsHistory:      (data.opsHistory       || []).slice(-20),
          creativeHistory: (data.creativeHistory  || []).slice(-20),
          kelHistory:      (data.kelHistory       || []).slice(-20),
          archivistHistory:(data.archivistHistory || []).slice(-20),
          veraHistory:     (data.veraHistory      || []).slice(-20),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        return "trimmed";
      } catch {
        // Still failing — storage is critically full
      }
    }
    return "failed";
  }
}

export function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
