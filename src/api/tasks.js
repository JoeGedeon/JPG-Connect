// src/api/tasks.js
// Pacer Command Center - Tasks API Client
// JPG Ventures LLC

export async function fetchTasks({ status, lane } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (lane)   params.set("lane", lane);

  const res = await fetch(`/api/tasks?${params}`);
  if (!res.ok) throw new Error(`Tasks fetch error: ${res.status}`);
  return res.json();
}

export async function createTask({ title, plan, lane = "claw" }) {
  const res = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, plan, lane }),
  });
  if (!res.ok) throw new Error(`Task create error: ${res.status}`);
  return res.json();
}

export async function updateTaskStatus(id, status) {
  const res = await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Task update error: ${res.status}`);
  return res.json();
}

export async function deleteTask(id) {
  const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Task delete error: ${res.status}`);
  return res.json();
}

export async function dispatchToAgent(taskId, action) {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskId, action }),
  });
  if (!res.ok) throw new Error(`Agent dispatch error: ${res.status}`);
  return res.json();
}
