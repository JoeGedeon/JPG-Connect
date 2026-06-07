// src/engine/specimens.js
// First two real PDF job packets fed into PACER — baseline evidence density.
// Source: Good Friends Movers LLC signed job packets (June 2026).
// Extracted from BOL, inventory pages, packing forms, binding estimates.
//
// These are the first historical specimens. They prove what the paperwork proves
// and expose what the paperwork never captured. Crew: null on both. That's the finding.

import { ingestPDFJobPacket } from "./events.js"
import { getEvents }         from "./events.js"

export const PDF_SPECIMENS = [
  {
    // GF3581855 — Linda Lenard, Orlando FL → Helena AL
    // 8 pages: BOL, 2-page handwritten inventory, packing form,
    //          post-contract services, onsite binding estimate
    // Original estimate: $806.60 → Binding estimate: $2,213.22 (escalation on-site)
    // 8 signatures across 4 documents. Crew: not captured.
    company_id:      "jpg_ventures",
    job_id:          "GF3581855",
    customer:        "Linda Lenard",
    customer_email:  "lind.le0202@gmail.com",
    customer_phone:  "601-572-7875",
    origin:          "4752 Conroy Ave, Orlando, FL 32801",
    destination:     "165 Rivercrest Lane, Apt B3, Helena, AL 35080",
    completed_at:    "2026-06-07",
    cubic_feet:      300,
    inventory_count: 41,
    invoice_total:   2213.22,
    signatures: [
      "customer_bol",
      "carrier_bol",
      "customer_packing_form",
      "carrier_packing_form",
      "customer_post_contract",
      "carrier_post_contract",
      "customer_binding_estimate",
      "carrier_binding_estimate",
    ],
    crew:         null,
    damage_notes: null,
  },
  {
    // GF3581917 — Candi J Wilson / Victor P Wilson, Lake Worth FL → Leander TX
    // 95 pages: BOL, 5+ inventory pages (91 items), delivery inventory with
    //           destination exceptions, origin and destination signatures
    // Large move: 1905 cu.ft, 15% fuel surcharge. Crew: not captured.
    company_id:      "jpg_ventures",
    job_id:          "GF3581917",
    customer:        "Candi J Wilson / Victor P Wilson",
    customer_email:  "candigean@live.com",
    customer_phone:  "864-420-8150",
    origin:          "6797 Bayshore Drive, Lake Worth, FL 33462",
    destination:     "786 Beauchamp Rd, Leander, TX 78645",
    completed_at:    "2026-06-04",
    cubic_feet:      1905,
    inventory_count: 91,
    invoice_total:   7432.56,
    signatures: [
      "customer_bol",
      "carrier_bol",
      "customer_inventory_origin",
      "carrier_inventory_origin",
      "customer_inventory_destination",
      "carrier_inventory_destination",
    ],
    crew:         null,
    damage_notes: null,
  },
]

// Seeds both specimens into the PACER ledger.
// Idempotent: skips any specimen whose job_id already exists in the ledger.
// Returns { seeded: number, skipped: number, events: Event[] }
export function seedPDFSpecimens() {
  const existing = new Set(
    getEvents().flatMap(e =>
      (e.entities || []).filter(en => en.type === "job_id").map(en => en.value)
    )
  )

  const seededEvents = []
  let skipped = 0

  for (const specimen of PDF_SPECIMENS) {
    if (existing.has(specimen.job_id)) {
      skipped++
      continue
    }
    const events = ingestPDFJobPacket(specimen)
    seededEvents.push(...events)
  }

  return { seeded: PDF_SPECIMENS.length - skipped, skipped, events: seededEvents }
}
