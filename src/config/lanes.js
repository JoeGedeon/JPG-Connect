// src/config/lanes.js
// Pacer Command Center - Lane Configuration
// JPG Ventures LLC

export const LANES = [
  {
    id: "council",
    wing: "council",
    label: "COUNCIL",
    color: "#e0e0f8",
    dim: "rgba(224,224,248,0.04)",
    glow: "rgba(224,224,248,0.10)",
    accent: "#f0f0ff",
    placeholder: "Open council…",
    subtitle: "Constitutional Operating Environment",
  },
  {
    id: "ops",
    wing: "operational",
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
    wing: "cognitive",
    label: "KODEX",
    color: "#c87dff",
    dim: "rgba(200,125,255,0.07)",
    glow: "rgba(200,125,255,0.18)",
    accent: "#e8b4ff",
    placeholder: "Ask KODEX…",
    subtitle: "Isles of the Awakened",
  },
  {
    id: "muse",
    wing: "cognitive",
    label: "MUSE",
    color: "#ff6b9d",
    dim: "rgba(255,107,157,0.06)",
    glow: "rgba(255,107,157,0.18)",
    accent: "#ff9dbf",
    placeholder: "What are you exploring…",
    subtitle: "Possibility Laboratory",
  },
  {
    id: "vera",
    wing: "cognitive",
    label: "VERA",
    color: "#8daac4",
    dim: "rgba(141,170,196,0.07)",
    glow: "rgba(141,170,196,0.18)",
    accent: "#b0cce0",
    placeholder: "Ask VERA…",
    subtitle: "First Witness",
  },
  {
    id: "archivist",
    wing: "cognitive",
    label: "ARCHIVIST",
    color: "#c8955a",
    dim: "rgba(200,149,90,0.08)",
    glow: "rgba(200,149,90,0.22)",
    accent: "#e8b880",
    placeholder: "Ask the Archivist…",
    subtitle: "Memory Wing",
  },
  {
    id: "kel",
    wing: "operational",
    label: "KEL",
    color: "#ff9f43",
    dim: "rgba(255,159,67,0.07)",
    glow: "rgba(255,159,67,0.18)",
    accent: "#ffc97e",
    placeholder: "Plan a task for KEL…",
    subtitle: "Automated Execution",
  },
  {
    id: "claw",
    wing: "operational",
    label: "CLAW",
    color: "#ff9f43",
    dim: "rgba(255,159,67,0.07)",
    glow: "rgba(255,159,67,0.18)",
    accent: "#ffc97e",
    placeholder: "Plan a task for CLAW…",
    subtitle: "Approved Automation Execution",
  },
  {
    id:          "atrium",
    wing:        "threshold",
    label:       "ATRIUM",
    color:       "#5bafd6",
    dim:         "rgba(91,175,214,0.07)",
    glow:        "rgba(91,175,214,0.18)",
    accent:      "#7ecae8",
    placeholder: "What have you noticed…",
    subtitle:    "Threshold · Observation Intake",
    isThreshold: true,
  },
];

export const LANE_MAP = Object.fromEntries(LANES.map((l) => [l.id, l]));

// Wing grouping for SideRail navigation
export const WING_ORDER  = ["threshold", "cognitive", "council", "operational"]
export const WING_LABELS = {
  threshold:   "THRESHOLD",
  cognitive:   "COGNITIVE WING",
  council:     "COUNCIL CHAMBER",
  operational: "OPERATIONAL WING",
}

// Visible exits per room — the arrows the institution shows you when you arrive.
export const ROOM_EXITS = {
  atrium:   ["vera", "council"],
  vera:     ["archivist", "council", "atrium"],
  archivist:["muse", "council"],
  muse:     ["council", "creative"],
  creative: ["council", "muse"],
  council:  ["kel", "muse", "archivist", "ops"],
  kel:      ["ops", "council"],
  ops:      ["vera", "kel"],
}

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
  kel: [
    "Plan: sync FleetFlow jobs to a Google Sheet daily",
    "Plan: send crew SMS briefing before each job",
    "Plan: auto-archive completed jobs to Firebase",
    "Plan: post Isles content drop to social on schedule",
  ],
  claw: [
    "Plan: sync FleetFlow jobs to a Google Sheet daily",
    "Plan: send crew SMS briefing before each job",
    "Plan: auto-archive completed jobs to Firebase",
    "Plan: post Isles content drop to social on schedule",
  ],
  muse: [
    "What if we offered a premium relocation concierge tier?",
    "Explore the pattern emerging from our storage customers",
    "What is this data trying to tell us we’re not seeing?",
    "Open a new possibility thread",
  ],
  atrium: [
    "Three customers this week asked about storage.",
    "Something keeps happening before delivery that slows everything down.",
    "I’ve been noticing a pattern across our long-haul jobs.",
    "A client said something today I don’t want to forget.",
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
