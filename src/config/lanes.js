// src/config/lanes.js
// Pacer Command Center - Lane Configuration
// JPG Ventures LLC

export const LANES = [
  {
    id: "vera",
    label: "VERA",
    color: "#8daac4",
    dim: "rgba(141,170,196,0.07)",
    glow: "rgba(141,170,196,0.18)",
    accent: "#aac4de",
    placeholder: "What do you want to understand…",
    subtitle: "First Witness",
  },
  {
    id: "ops",
    label: "OPSCORE",
    color: "#00c896",
    dim: "rgba(0,200,150,0.07)",
    glow: "rgba(0,200,150,0.18)",
    accent: "#00ffb3",
    placeholder: "Ask OPSCORE…",
    subtitle: "FleetFlow + Moving Operations",
  },
  {
    id: "creative",
    label: "KODEX",
    color: "#c87dff",
    dim: "rgba(200,125,255,0.07)",
    glow: "rgba(200,125,255,0.18)",
    accent: "#e8b4ff",
    placeholder: "Ask KODEX…",
    subtitle: "Isles of the Awakening",
  },
  {
    id: "claw",
    label: "CLAW",
    color: "#ff9f43",
    dim: "rgba(255,159,67,0.07)",
    glow: "rgba(255,159,67,0.18)",
    accent: "#ffc97e",
    placeholder: "Plan a task for CLAW…",
    subtitle: "Approved Automation Execution",
  },
];

export const LANE_MAP = Object.fromEntries(LANES.map((l) => [l.id, l]));

export const STARTERS = {
  ops: [
    "Draft a crew briefing for a large residential move",
    "FleetFlow pricing strategy for a 10-truck company",
    "Write a move estimate phone script",
    "What should Good Friends Moving focus on this quarter?",
  ],
  creative: [
    "Write the moment Yanu first touches the Kodex",
    "Panel sequence: Codex Architects reveal their plan",
    "Expand the Aru-Kai / Zemi Wardens origin",
    "Social drop copy for an Isles chapter reveal",
  ],
  claw: [
    "Plan: sync FleetFlow jobs to a Google Sheet daily",
    "Plan: send crew SMS briefing before each job",
    "Plan: auto-archive completed jobs to Firebase",
    "Plan: post Isles content drop to social on schedule",
  ],
};

export const IMAGE_STARTERS = [
  "Yanu Elu activating the Kodex for the first time",
  "The Aru-Kai temple, overgrown, pulsing with light",
  "Dr. Voss and the Codex Architects in their command room",
  "Zemi Wardens rising from the ocean at dawn",
  "The Kodex as a living game HUD over a Caribbean landscape",
];

export const IMAGE_SIZES = {
  "1024x1024": "Square",
  "1536x1024": "Wide",
  "1024x1536": "Tall",
};

export const TASK_STATUSES = {
  draft:     { label: "Draft",            color: "#8888a0" },
  pending:   { label: "Pending Approval", color: "#ff9f43" },
  approved:  { label: "Approved",         color: "#00c896" },
  executing: { label: "Executing",        color: "#c87dff" },
  complete:  { label: "Complete",         color: "#00c896" },
  rejected:  { label: "Rejected",         color: "#ff6b6b" },
};

export const STORAGE_KEY = "pacer_v3";
