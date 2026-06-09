// src/config/personas.js
// The institution arranges itself around who is arriving.
// Not permissions — perception. Different residents see different rooms.

export const PERSONAS = {
  steward: {
    id:              "steward",
    label:           "Steward",
    subtitle:        "Architect · Governance",
    color:           "#e0e0f8",
    lanes:           ["council", "vera", "ops", "archivist", "creative", "kel"],
    defaultLane:     "council",
    seesContextRail: true,
  },
  governance: {
    id:              "governance",
    label:           "Governance",
    subtitle:        "Constitutional Council",
    color:           "#c87dff",
    lanes:           ["council", "creative"],
    defaultLane:     "council",
    seesContextRail: true,
  },
  dispatcher: {
    id:              "dispatcher",
    label:           "Dispatcher",
    subtitle:        "Operations",
    color:           "#00c896",
    lanes:           ["ops"],
    defaultLane:     "ops",
    seesContextRail: true,
  },
  crew: {
    id:              "crew",
    label:           "Crew",
    subtitle:        "Field Operations",
    color:           "#00c896",
    lanes:           ["ops"],
    defaultLane:     "ops",
    seesContextRail: false,
  },
  client: {
    id:              "client",
    label:           "Client",
    subtitle:        "Move Status",
    color:           "#8daac4",
    lanes:           ["vera"],
    defaultLane:     "vera",
    seesContextRail: false,
  },
}

export const PERSONA_LIST    = Object.values(PERSONAS)
export const DEFAULT_PERSONA = "steward"
