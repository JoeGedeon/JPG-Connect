// src/engine/canon.js
// PACER declaration store + constitutional seed infrastructure

import { recordSignal, SIGNAL_TYPES } from "./signals.js"

const STORAGE_KEY  = "pacer_canon"
const TENSION_KEY  = "pacer_tensions"
const REVIEW_KEY   = "pacer_conflict_reviews"

// Importance tiers: foundational (load-bearing) → operational (active policy) → tactical (context-specific)
export const IMPORTANCE = {
  FOUNDATIONAL: "foundational",
  OPERATIONAL:  "operational",
  TACTICAL:     "tactical",
}

// Constitutional seeds — never emit behavioral signals, seeded idempotently
const SEED_IDS = new Set([
  "PFP-001","PFP-002","PFP-003","PFP-004","PFP-005","PFP-006",
  "KX-001","KX-002","KX-003","KX-004","KX-006","KX-007",
  "GENESIS-001","PACER-HQ-001",
  "VERA-001","AP-001","AP-002","AP-003","AP-004","AP-005","AWK-001",
  "JPG-001","JPG-002","JPG-003","JPG-004","JPG-005","JPG-006","JPG-007","JPG-008","JPG-009","JPG-010","JPG-011","JPG-012","JPG-013","JPG-014","JPG-015","JPG-016","JPG-017","JPG-018","JPG-019","JPG-020","JPG-021","JPG-022",
])

const CONSTITUTIONAL_SEEDS = [
  {
    id:            "PFP-005",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "PFP-005: Continuity Is Not Storage",
    content:       "Memory without continuity is just storage. Continuity is not how much you remember. It is whether the system can pick up where it left off — across time, across sessions, across people. The question is never 'what did we store?' It is 'what can we recognize when we return?'",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780449000000,
    status:        "active",
  },
  {
    id:            "PFP-006",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "PFP-006: Compression Reveals Structure",
    content:       "Clarity is not accumulation. Interference increases with surface. Structure emerges through compression. The purpose of the system is not to increase awareness. It is to reduce interference. Remove enough surface noise and the load-bearing dependency becomes visible. Less is not a constraint. Less is the mechanism.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780450000000,
    status:        "active",
  },

  // ── JPG Founding Doctrine ────────────────────────────────────────────────────
  // Methodological operating law extracted from decisions already made across
  // FleetFlow, PACER, and JPG Ventures. Not invented here — recognized here.
  // Each rule is testable, violable, and load-bearing for everything downstream.

  {
    id:            "JPG-001",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "JPG-001: Reality Before Preference",
    content:       "Evidence outranks what we hoped was true. When data conflicts with belief, the data wins. Decisions begin from what is, not from what we want to be true. This rule is violated whenever a metric that contradicts a preferred narrative gets ignored, whenever a plan proceeds despite early signals of failure, or whenever a problem is framed to match a pre-decided answer. FleetFlow was built because revenue leakage was real and was being treated as negligible — the preference was that jobs were being captured correctly. PACER's VERA was built to report condition rather than status, because status reporting is preference-shaped. Any decision framework, dashboard, or AI response that softens reality to protect comfort violates this principle. Future policies around measurement, reporting, and conflict resolution all inherit from this rule.",
    wound:         "Estimates were presented optimistically because the accurate numbers would have been uncomfortable in the room. When operations reflected the real figures, course corrections were more expensive than they would have been had the original estimate been honest. This happened across different contexts before a rule was required to make it stop.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780451000000,
    status:        "active",
  },
  {
    id:            "JPG-002",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "JPG-002: Systems Over Memory",
    content:       "Critical truth must survive individual people, moods, and forgotten conversations. If it matters, it must exist in a system — not in someone's head, not in a chat thread, not in a meeting that only three people attended. This rule is violated when critical decisions are made verbally without recorded reasoning, when a single person holds institutional knowledge that no system mirrors, or when 'we talked about this' substitutes for 'we declared this.' PACER exists because humans spend ninety minutes arguing a decision and nine seconds documenting it. FleetFlow exists because job information living in crew members' heads does not make it into invoices. Every storage architecture, every persistence mechanism, every warning about undeclared doctrine descends from this rule. The test: if the person who made this decision were unreachable tomorrow, would the institution still know why the decision was made?",
    wound:         "A crew member who understood a recurring client's access and handling requirements left without transferring that knowledge. The next crew had no record to consult. The client had to re-explain conditions that should have been documented. A preventable problem occurred because the institutional knowledge was stored in a person rather than a system.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780452000000,
    status:        "active",
  },
  {
    id:            "JPG-003",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "JPG-003: Visibility Before Optimization",
    content:       "Nothing gets improved until it can be seen clearly. Optimization without measurement is guessing. Measurement without visibility is noise. This rule is violated when fixes are attempted before the actual shape of a problem is understood, when features are added before measuring whether existing ones are used, or when a metric is optimized that is not the actual bottleneck. VERA was built before any automated remediation because the institution must be able to see drift before it can be expected to act on it. FleetFlow's revenue dashboard preceded any automation of collection. The sequence is always: make it visible, then make it legible, then consider acting on it. Every dashboard, forecast, and health score in this system is an upstream act — not a solution, but a prerequisite for one.",
    wound:         "Efficiency improvements were attempted before the actual shape of the problem was understood. The improvements made certain parts of the process faster. The part that was causing the loss remained unaddressed because it had not been made visible first. The process ran faster. The structural problem continued at the same rate. The diagnosis was wrong.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780453000000,
    status:        "active",
  },
  {
    id:            "JPG-004",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "JPG-004: Capture Truth at the Moment It Appears",
    content:       "Decisions, contradictions, and discoveries must be recorded at the transition point — not reconstructed later from memory. Information degrades between the moment it is known and the moment it is documented. A decision recorded an hour after the meeting is already shaped by the mood of the walk back. This rule is violated whenever a meeting ends without recording what was decided and why, whenever a conflict is resolved without noting the reasoning, or whenever a declarable moment passes undeclared. The Declaration Engine was built as a direct implementation of this principle — capture prompts appear at the moment of creation, not after. The conflict resolution note field exists because the reasoning behind a resolution is more valuable than the resolution itself. Every transition-point capture mechanism in this system descends from this rule.",
    wound:         "A pricing decision was discussed verbally and not written down. Three days later two people in the same organization disagreed about what had been decided. Both believed their version was accurate. Both were reconstructing from memory. The original decision was unrecoverable. A new decision was made to replace an unrecorded one, with no way to know whether the replacement was better or worse than what had actually been agreed.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780454000000,
    status:        "active",
  },
  {
    id:            "JPG-005",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "JPG-005: Small Leaks Become Large Losses",
    content:       "Ignored variance compounds until it becomes expensive. A three percent revenue leak ignored for two years is not a three percent problem — it is a structural problem that has been running for two years. A doctrine drifting slowly is not a small concern — it is an organization gradually becoming something different from what it declared itself to be. This rule is violated whenever a small discrepancy is postponed because the absolute number looks manageable, whenever a single missed declaration is treated as inconsequential, or whenever slow drift is accepted as 'not urgent yet.' FleetFlow's entire founding insight is this rule applied to operations. PACER's drift detection and forecast exist because a doctrine that loses five points per month does not look alarming until month six. Every warning system, every forecast horizon, every alert threshold in this system is an enforcement mechanism for this rule. The question is never whether the leak matters now. It is whether it will matter at scale.",
    wound:         "A consistent gap between estimated and actual job time was classified as acceptable variance for nearly two years. Each individual instance was small enough to defer. Accumulated, the gap represented a structural loss that would have cost a fraction of the correction if addressed at month three instead of month twenty-four. The variance was visible throughout. It was repeatedly decided it was too small to prioritize. It was not too small. It was too early to be painful.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780455000000,
    status:        "active",
  },
  {
    id:            "JPG-006",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "JPG-006: The Scar Tissue Principle",
    content:       "Every durable organizational capability originated as a response to a specific injury. If the injury is forgotten, the capability becomes ritual. If the injury is remembered, the capability remains adaptive. This principle governs why the wound field exists, why founding wounds are more valuable than founding principles, and why every declaration must be testable against its original purpose rather than defended as tradition. Applied to every feature in this system: the delivery gate exists because leverage disappeared after an unload. VERA exists because drift was invisible until it became expensive. The Declaration Engine exists because knowledge evaporated at the moment of transition. The wound field exists because PACER found five foundational declarations with no recorded injuries — the WHY was being lost while the WHAT was preserved. Every capability that forgets its wound risks becoming the kind of rule that survives long after the problem it solved has disappeared. The wound is not context for the rule. The wound is the rule's reason to exist.",
    wound:         "PACER itself carried five founding declarations with no recorded wounds. The principles existed. The injuries that required them did not. The system was preserving WHAT while losing WHY — exactly the disease it was built to detect, operating inside its own founding layer. The Scar Tissue Principle was written into the system to prevent that from happening again.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780456000000,
    status:        "active",
  },
  {
    id:            "JPG-007",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "JPG-007: Selective Amnesia Creates Invisible Loss",
    content:       "Memory systems fail in two modes: information overload and selective amnesia. Most software solves overload by creating amnesia — by deciding in advance which events don't matter. But relevance is only determinable in retrospect. When a system discards an event before its future significance is known, it creates a permanent blind spot: an invisible loss that cannot be recovered, audited, or learned from, because there is no record of its absence. PACER does not filter at ingestion. PACER records first, analyzes second, acts third. The Event Ledger is append-only and total. ARCHIVIST subscribes to everything. The other rooms subscribe selectively — they are permitted to ask 'does this affect me?' ARCHIVIST is not. ARCHIVIST is the witness. A witness that edits its account is no longer a witness. It is a narrator. And a narrator is exactly what PACER was built to replace.",
    wound:         "In the period before the Event Ledger existed, significant operational events — equipment purchases, verbal agreements, ad-hoc decisions — were treated as receipts or notes rather than events. They were stored as files, not records. When later asked 'how did we get here?' the chain was partially missing because the beginning of the chain had never been entered into a system that could trace it forward. The dolly bar purchase in June 2026 became EVT-001 not because it was large, but because it was the first event that demonstrated the missing infrastructure.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780460000000,
    status:        "active",
  },
  {
    id:            "JPG-008",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "JPG-008: Optimization Requires Accurate Memory",
    content:       "Recording creates the possibility of visibility (JPG-007). Visibility enables optimization (JPG-003). But the third and closing requirement is that the memory being optimized against must be accurate — complete, proximate to truth, unedited by preference. Optimizing against selective memory does not improve the system. It efficiently entrenches the bias of whoever decided what to record. An organization that records only its successful jobs, its clean estimates, its preferred narrative, will optimize itself toward a version of reality that exists only in its own records. The result is not improvement. It is refined inaccuracy — efficient stupidity. The constitutional chain is: Record Everything → Create Visibility → Optimize Accurately. Remove the first link and visibility never exists. Remove the second and you optimize blind. Remove the third and you optimize against fiction. All three links must hold. This is why ARCHIVIST cannot filter, VERA cannot report only clean data, and OPSCORE cannot surface only the metrics that look favorable. The accuracy of the optimization is determined at the point of recording — not the point of analysis.",
    wound:         "FleetFlow jobs where overtime, extra stops, and stair charges were not recorded at the time of occurrence. End-of-job estimates were built from crew memory rather than contemporaneous record. Management then analyzed job margins and improved the estimate process — but the estimate process was not the problem. The record was the problem. The result was more refined inaccuracies: better estimates of jobs as the crew remembered them, not as they happened. Revenue recovery was partially offset by the cost of the optimization effort, which produced no actual improvement in capture rate because the underlying record gap remained untouched.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780464000000,
    status:        "active",
  },
  {
    id:            "JPG-009",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "JPG-009: Automation Ends at the Final Commitment",
    content:       "Systems may observe, record, verify, analyze, interpret, recommend, and prepare action. The final commitment — the decision to deploy, charge, approve, reject, or bind — must remain attached to a named responsible party. Accountability cannot be automated. This rule is not primarily about legality or morality. It is epistemic: accountability is the mechanism by which the organization learns from its decisions. When no human committed, no human judgment can be interrogated after the fact. The pattern that produced the wrong outcome cannot be identified, attributed, or corrected. The organization accumulates outcome data but cannot improve the quality of its decision-making — only the efficiency of its mistakes. The human at the commitment point is not a bottleneck. The human is the learning loop. Remove the human from that point and the organization loses the capacity to calibrate. PACER routes signals to humans. Humans commit. FleetFlow executes. That sequence is not a temporary limitation awaiting better AI. It is a structural choice about where judgment lives and how trust is built.",
    wound:         "Operational systems that issued surcharges, adjusted invoices, or modified job records automatically without a named approval step. When disputes arose, there was no identifiable human judgment to review, challenge, or correct. The decision that produced the error could not be attributed. The pattern was never corrected at source. The same class of error recurred because no one's judgment was on record — and you cannot improve what you cannot trace back to a decision-maker.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780468000000,
    status:        "active",
  },

  {
    id:            "JPG-010",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "JPG-010: PACER Doesn't Guess. PACER Remembers.",
    content:       "PACER's value is not what it can infer — it is what it has observed. Every answer traces to a recorded event. Every prediction shows the evidence count behind it. Every document cites its source events. The distinction between organizational memory and organizational AI is not intelligence — it is grounding. A language model can answer any question fluently. PACER can only answer questions that the Event Ledger has already answered. That constraint is not a limitation. It is the product. When a dispute arises, the claim that recovers money is not: 'our system predicts this happened.' It is: 'here is EVT-047, recorded at 14:23 on June 4th, committed by Joe G., with 4 photos attached.' That sentence wins disputes. Confidence without citation is storytelling. Citation without confidence still wins. The organization that remembers accurately competes with nothing — because its history cannot be copied, summarized, or replaced by a model trained on someone else's data. Your Event Ledger is yours. The patterns in it are yours. The attributions are yours. That is not a feature. That is a moat.",
    wound:         "The temptation to add general AI inference capabilities — letting PACER answer questions from model training rather than from recorded events. The answers would be fluent and confident and often directionally correct. They would also be unverifiable, uncitable, and indefensible the moment a real dispute required evidence. More dangerously, they would erode the epistemological distinction that makes PACER valuable. Organizational memory that cannot be cited in a dispute is not memory. A system that guesses confidently competes with every AI chatbot on the market. A system that remembers accurately competes with nothing — because your history is not reproducible.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780470000000,
    status:        "active",
  },

  {
    id:            "JPG-011",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "JPG-011: FleetFlow Emits. PACER Remembers.",
    content:       "FleetFlow is an operations platform. PACER is a memory platform. These are not the same category, and keeping them separate is load-bearing. FleetFlow manages what is happening now — jobs, crews, payments, approvals, claims. PACER records what happened and builds an understanding of pattern across time. The boundary between them is the Event Ledger. When FleetFlow emits an event and PACER records it, the event becomes permanent institutional memory. The direction of this flow is the platform story: PACER learns from FleetFlow; FleetFlow does not require PACER to function. That asymmetry is intentional. A memory engine that depends on a specific operations platform dies when the operations platform changes. A memory engine that accepts events from any source accumulates intelligence regardless of where the data originated. ConstructionFlow, PropertyFlow, HealthcareFlow — any operational system that touches reality can feed the Event Ledger. PACER's intelligence accumulates regardless of which system emitted the event, because memory is industry-agnostic even when operations are not. The moving company is the first organism. The Event Ledger is the first memory. The separation of concerns is what makes the platform durable.",
    wound:         "Systems built where intelligence and operations are entangled — where querying organizational memory requires calling the operations API, where the memory cannot function if the operations platform changes its schema. When FleetFlow updates its data model, PACER's memory should be unaffected. When a second operations platform is added, the memory should grow, not fragment. Entangling the layers forces the choice between accurate memory and operational continuity. That is a choice no platform should ever have to make.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780472000000,
    status:        "active",
  },

  {
    id:            "JPG-012",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "JPG-012: K.E.L. Doesn't Write. The Ledger Writes.",
    content:       "K.E.L. does not author documents. K.E.L. reveals what the Event Ledger already contains. A dispute package is not written — it is assembled from events recorded at the time they occurred. A broker report is not composed — it is extracted from evidence and approvals that already exist. A revenue leakage report is not estimated — it is calculated from immutable records. This distinction is not semantic. It is epistemological. Authored documents can be questioned for bias, selection, or omission. Revealed documents can be challenged only by disputing the source events themselves — which are append-only and immutable. In adversarial contexts — insurance claims, legal disputes, audits, compliance reviews — the difference between 'we wrote this to support our position' and 'we generated this from our records' is the difference between evidence and argument. Evidence wins. Argument is a contest. K.E.L.'s entire value derives from the quality and completeness of the Event Ledger it draws from. A K.E.L. document is only as strong as the events behind it. Build the Ledger first. Record every event. Attribute every decision. The documents will write themselves. That is not a metaphor. It is a design specification.",
    wound:         "Reports generated from memory, inference, or manual entry rather than from verified event records. The report may be accurate. It cannot be proven accurate — because there is no immutable source record it is drawn from. Every K.E.L. document not fully anchored to recorded events is an authored document, not a revealed one. Authored documents are the organization speaking for itself. Revealed documents are the record speaking for itself. When the record speaks, it cannot be cross-examined for honesty. When the organization speaks, it can.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780474000000,
    status:        "active",
  },

  {
    id:            "JPG-013",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "JPG-013: Reality First. Memory Second. Evidence Third.",
    content:       "Three laws define the PACER architecture, in strict order. Reality First: nothing enters the system that did not happen. Every event is anchored to an occurrence — a job completed, a payment made, a decision taken, a claim filed. PACER does not accept hypotheticals, estimates, or inferences as events. If it did not happen, it is not in the ledger. Memory Second: every occurrence is recorded completely, without interpretation or summary. The Event Ledger holds facts; ARCHIVIST holds analysis. These are different roles and must never be merged into one record. Record the event as it occurred, attribute who committed to it, note what evidence exists. Nothing more, nothing less. Evidence Third: every output is derived from verified records. K.E.L. generates from what the Ledger already contains. No document is authored — every document is revealed. These three laws are ordered because the second depends on the first, and the third depends on both. Violate Reality First and memory becomes unreliable. Build on unreliable memory and evidence becomes contestable. Contestable evidence loses disputes. The discipline of the first law is what makes the third law worth anything.",
    wound:         "The violation always follows the same pattern: pressure to move fast, an estimate made instead of an event recorded, a report generated from the estimate. The first shortcut is always justifiable. 'We'll record the actual event later.' The later never comes. Ten shortcuts later, the organization has a reporting system that looks like it works — until a dispute arrives and the entire record is contested because none of it traces to verified events. Reality First is not a constraint. It is the mechanism. Without it, the rest of the architecture is a well-organized fiction.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780476000000,
    status:        "active",
  },

  {
    id:            "JPG-014",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "JPG-014: VERA Speaks From Memory. Not From Inference.",
    content:       "VERA is not a general AI assistant. VERA is an organizational memory interrogator. The difference matters. An AI assistant answers from training data — patterns learned across the internet, calibrated to sound correct. An organizational memory interrogator answers from the record — events that actually occurred, recorded at the time they occurred, attributed to the person who committed to them. VERA's value is not that it is intelligent. VERA's value is that it is grounded. When VERA says 'the record shows,' it is citing an append-only event that cannot be retroactively altered. When a general AI says 'typically, moving companies...' it is citing probability over millions of data points that have nothing to do with JPG Ventures. One of those answers is evidence. The other is a guess dressed in confidence. VERA must never guess dressed in confidence. Every answer VERA gives must trace to a specific recorded event, or VERA must say: 'The ledger has no record of that.' That sentence is not a failure. That sentence is the most honest thing VERA can say — and in a dispute, the most legally useful.",
    wound:         "AI systems that answer confidently from training data rather than from organizational records. The answer sounds right. It has no citation. It cannot be disputed because there is no source to dispute. The organization trusts it because it sounds authoritative. When the dispute arrives, the confident AI answer is worthless — it traces to nothing. The witness who cannot cite their source is not a witness. They are an opinion. VERA must never be an opinion.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780478000000,
    status:        "active",
  },

  {
    id:            "JPG-015",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "JPG-015: The Event Ledger Has No Preferred Source.",
    content:       "The Event Ledger does not care whether an event came from FleetFlow, from a competing dispatch system, from a manual entry, from a webhook, or from an integration that does not exist yet. An event is an event. What matters is that it happened, that it was recorded at the time it happened, and that someone was named as having committed to it. The source field is metadata, not criteria. FleetFlow was the first organism feeding the ledger. It will not be the last. This is the design: the ledger is the hub. Every source is a spoke. The architecture's power comes precisely from this neutrality — a new source adds value to every intelligence layer above it without requiring any change to those layers. PACER gets smarter every time a new source is added, because the same pattern recognition, the same attribution logic, the same evidence chains operate on the new events automatically. The ledger does not learn new rules for each source. The ledger applies one rule to all sources: it happened, it is recorded, it cannot be altered. That rule is the architecture.",
    wound:         "Systems built around a single source of truth where the source and the memory are the same component. When the source dies or changes shape, the memory dies with it. When the source is the only one who can write to the record, the record can be manipulated at the source. The separation between source and ledger is not a technical detail. It is the protection. If the ledger accepts from any verified source, no single source controls the record. If the ledger only accepts from one source, you have not built a memory system — you have built a very expensive mirror for one system's version of reality.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780480000000,
    status:        "active",
  },

  {
    id:            "JPG-016",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "JPG-016: FleetFlow Is The First Case Study. Not The Last.",
    content:       "FleetFlow is the Application. PACER is the Platform. The Event Ledger is the Asset. These are not the same layer and must not be treated as the same layer. Applications come and go — they change shape as the market changes, as users change, as the founder's understanding changes. Platforms evolve — they grow more capable as more sources feed them, as more intelligence accumulates. Assets accumulate — they compound over time, gaining value with each new event recorded, each dispute resolved, each attribution made. The Application's value is measured in sessions. The Platform's value is measured in months. The Asset's value is measured in years. FleetFlow was built to stop movers from missing stair charges. PACER emerged as the thing watching what FleetFlow forgot. The Event Ledger emerged as the thing that makes it impossible to forget. These three layers are not competing visions of the same thing. They are one discovery at three different timescales. FleetFlow will change. PACER will grow. The Event Ledger — if it is maintained — will outlast both. Every completed move, every recovered charge, every accountability event adds one more brick. Humans leave companies. Managers retire. Dispatchers quit. Owners sell. Memory evaporates. The ledger stays. That is not a technical detail. That is the company.",
    wound:         "Building the application at the expense of the asset. Spending 90% of engineering on the experience — the part users see — while the record accumulates as a side effect of operations, never quite complete, never quite attributed, never quite auditable. When the application pivots (and it will), the asset is whatever got recorded along the way. If recording was a side effect, the asset is a side effect. Side effects do not compound. Assets do. The founders who discover this distinction late inherit an expensive pile of logs instead of institutional memory.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780482000000,
    status:        "active",
  },

  {
    id:            "JPG-017",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "JPG-017: The Ledger Records the Source. The Source Determines the Weight.",
    content:       "Not all events carry equal epistemic weight. The ledger records everything faithfully — but the intelligence built on top of the ledger must understand that a customer signature and a manager's note are not the same category of evidence. Three tiers exist. Verified: events corroborated by third-party or objective evidence — customer signatures, photographs, GPS data, sensor readings. These are the hardest to dispute because they do not depend on a single person's account. System: events generated by a structured application — FleetFlow jobs, API webhooks, automated state changes. These are reliable because the system generating them has no incentive to misrepresent, but they can be misconfigured or manipulated at the source. Declared: events entered by a human without corroboration — manually recorded notes, self-reported activity, entered at someone's discretion. These are recorded faithfully but carry lower weight because they are assertions, not observations. VERA must surface these distinctions when they matter. K.E.L. must weight evidence accordingly. The dispute package that leads with a customer signature is stronger than the one that leads with a manual note, even if both are in the same ledger. The ledger does not judge. The intelligence above it must.",
    wound:         "Treating all records as equivalent because they live in the same database. A manually entered note that says the customer agreed to a surcharge carries the same database weight as the customer's digital signature. The court does not agree. The insurer does not agree. The auditor does not agree. The intelligence that cannot distinguish between a signature and a note is not evidence-weighted reasoning. It is a well-organized belief system. Belief systems lose disputes. Evidence wins them.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780484000000,
    status:        "active",
  },

  {
    id:            "JPG-018",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "JPG-018: PACER Is Not a Memory System. PACER Is a Testimony System.",
    content:       "Memory is what you store. Testimony is what you can defend. The difference between them is chain of custody, source credibility, evidence weight, and confidence. PACER records events. But with source reliability tiers, PACER now records confidence — which source said it, how reliable that source is, what evidence corroborates it. That is the structure of testimony, not memory. A memory system answers: 'This happened.' A testimony system answers: 'This happened. Here is who said so. Here is how we know. Here is the evidence. Here is how much confidence the record supports.' That is why K.E.L. document types are not reports — they are testimonies. The dispute package is a testimony about a job. The broker report is a testimony about an incident. The evidence timeline is a testimony about the organization's full history. And that is why 'The ledger has no record of that' is one of the most important sentences in the ecosystem. It does not mean: I don't know. It means: the record contains no testimony on this point. That sentence is legally, contractually, and organizationally precise in a way that 'I'm not sure' never is. Memory forgets. Testimony persists. That is the architecture.",
    wound:         "Systems that accumulate events without weighting them. They produce information. They cannot produce evidence. When a dispute arrives, there is plenty of data — timestamps, records, logs — but no chain of custody, no source credibility assessment, no confidence layer. The pile of records looks authoritative. It isn't. Courts know the difference. Insurers know the difference. Auditors know the difference. Without testimony structure, you have a very organized pile. With it, you have a position.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780486000000,
    status:        "active",
  },

  {
    id:            "JPG-019",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "JPG-019: Every Source Is A Witness. PACER Is The Record.",
    content:       "Every system that feeds the Event Ledger is a witness. A witness testifies to what it observed. FleetFlow testifies to job completions, payments, crew assignments, and damage reports. A driver app would testify to GPS coordinates and time-stamped photographs. A broker system would testify to claims and settlements. An HR system would testify to staffing decisions. PACER does not distinguish between witnesses by their names or brands — only by what they observed, how reliably they observed it, and whether their testimony is corroborated by other evidence. The distinction between 'source' and 'witness' is not semantic. A source provides data. A witness provides testimony. Data can be imported, exported, migrated, or deleted. Testimony is on the record. Once a witness has testified in the PACER ledger, that testimony is immutable. FleetFlow is the First Witness. It was the first system to testify in the PACER record. It will not be the last. And this is the protection: the witness can change, retire, or be replaced — but the testimony it already gave remains. The court record outlasts the witness. That is the design.",
    wound:         "Systems where the source and the record are the same component — where the database is also the application, where deleting a record in the application deletes it from history. In a witness architecture, the witness can leave — FleetFlow could be replaced by a competing dispatch system tomorrow — but the testimony it gave over five years of operation remains in the PACER ledger. Organizations that confuse source and record lose their history every time they change software. PACER's ledger is not owned by FleetFlow. It is not owned by any witness. The record belongs to the organization.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780488000000,
    status:        "active",
  },

  {
    id:            "JPG-020",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "JPG-020: Memory Is Not The Mission. Defensible Truth Is The Mission.",
    content:       "PACER's purpose is not to remember what happened. PACER's purpose is to explain, defend, and prove what happened. A system that only remembers is an archive. A system that explains, defends, and proves is a testimony machine. The distinction matters at the moment it matters most — when a dispute arrives, when a claim is filed, when an audit is demanded, when a partnership is evaluated. No one wins a dispute by demonstrating excellent memory. They win by presenting evidence that can be explained, defended, and proven. VERA explains: she traces the interpretation to the events that support it. K.E.L. defends: it assembles the evidence chain that supports the position. The Event Ledger proves: the reliability tier on each event shows what is verified fact, what is system record, and what is human assertion. These three capabilities — explain, defend, prove — are not features built on top of PACER. They are the reason every architectural constraint exists. The immutability protects the proof. The attribution enables the defense. The reliability tier calibrates the explanation. The missing charge was never the real problem. The real problem was an organization that could not reliably testify to its own reality. PACER is the answer to the second problem. The missing charge was simply the first symptom.",
    wound:         "Memory systems that look authoritative but cannot be used as evidence. The timestamps exist. The records exist. The dashboards show impressive numbers. But when the dispute arrives, the records cannot be defended because there is no chain of custody, no attribution, no reliability tier, no witness separation from the record. The pile of data is organized. It is not defensible. Memory without defensibility is biography. Testimony with defensibility is evidence. Organizations that mistake the first for the second discover the difference in the worst possible moment.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780490000000,
    status:        "active",
  },

  {
    id:            "JPG-021",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "JPG-021: The Record Must Be Portable. Ownership Without Portability Is License.",
    content:       "The doctrine that the record belongs to the organization means nothing if the organization cannot take the record. If the record exists only within a platform that controls access, the organization does not own the record — they license access to it. True ownership requires three capabilities: the ability to export the record in full, the ability to verify the record independently of the platform that generated it, and the ability to present the record to third parties — courts, auditors, insurers, regulators — without requiring platform access or cooperation. A court does not need a SaaS subscription to read a testimony document. An auditor does not need a login to verify a chain of custody. The record must be self-contained, human-readable, and independently verifiable. Software is temporary. Records are permanent. When a moving company leaves FleetFlow, it takes its trucks, its crews, and its contracts. It must also be able to take its testimony. When a construction company migrates to a new platform, the years of project records should migrate with it, intact, attributed, and reliable. PACER's portability is not a convenience feature. It is what makes ownership real. Without it, every organization that has ever trusted a SaaS platform with their institutional memory has learned the hard way that they were renting, not owning.",
    wound:         "SaaS platforms that hold organizational records hostage behind their user interface. The data can be 'exported' in a proprietary format that requires their platform to interpret. The timestamps exist. The records exist. But the testimony cannot be read without the vendor's cooperation. That is not ownership. That is a filing cabinet where the vendor holds the only key. When the vendor pivots, raises prices, is acquired, or disappears, the organization's institutional memory is at risk. The record speaks for itself, or it does not own itself.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780492000000,
    status:        "active",
  },

  {
    id:            "JPG-022",
    category:      "global",
    type:          "rule",
    importance:    IMPORTANCE.FOUNDATIONAL,
    label:         "JPG-022: Models Arrive Empty. PACER Contains The Context.",
    content:       "A language model arrives at every conversation with no knowledge of Good Friends Moving. It has never seen a BOL from a disputed job. It does not know the payroll structure, the crew history, the damage claim that was settled, or the doctrine that governs how PACER speaks. The model is a powerful general-purpose reasoning engine. It is not, and can never become, an organizational memory. PACER contains the context. The Event Ledger is the accumulated testimony of what happened. The canon is the accumulated doctrine of how to think. The witness architecture is the accumulated chain of custody for every recorded event. These are not features of the model. They are the features that PACER contributes to the model. This means PACER's strongest position is not being the smartest model. It is being the system that selects which intelligence to use, provides that intelligence with the right context, and preserves the truth after the model is gone. When Mistral becomes the best operational model: PACER switches the provider. When a local model outperforms all hosted options for a specific lane: PACER switches the provider. When the internet disappears: PACER runs on local inference. When a future PACER-native model is trained on FleetFlow operations and moving claims: PACER switches to its own engine. The lanes do not change. The doctrine does not change. The ledger does not change. The model is a runtime decision. PACER is the durable architecture. The intelligence does not live in any model. It lives here.",
    wound:         "Organizations that mistake the model for the product. When the model changes — when the API price doubles, when the provider pivots, when a better model is released — the product collapses because the product was the model. PACER's moat is not model performance. It is the accumulated, structured, defensible context that no arriving model carries by default. Destroy the model and PACER still has the ledger, the doctrine, the witnesses, and the testimony. Destroy any single provider and PACER routes to another. That is the difference between infrastructure and dependency.",
    priority:      1,
    conflicts:     [],
    lastReferenced: null,
    createdAt:     1780494000000,
    status:        "active",
  },
]

// ── Declaration store ──────────────────────────────────────────────────────────

function loadDeclarations() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") }
  catch { return [] }
}

function saveDeclarations(declarations) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(declarations)) }
  catch {}
}

export function seedCanon() {
  const existing    = loadDeclarations()
  const existingIds = new Set(existing.map(d => d.id))
  const toAdd       = CONSTITUTIONAL_SEEDS.filter(s => !existingIds.has(s.id))
  // Backfill importance and conflicts onto existing seeds that predate this field
  const patched = existing.map(d =>
    SEED_IDS.has(d.id) && !d.importance
      ? { ...d, importance: IMPORTANCE.FOUNDATIONAL, conflicts: d.conflicts || [], lastReferenced: d.lastReferenced || null, wound: d.wound ?? null }
      : SEED_IDS.has(d.id) && d.wound === undefined
      ? { ...d, wound: null }
      : d
  )
  if (toAdd.length > 0 || patched.some((d, i) => d !== existing[i])) {
    saveDeclarations([...patched, ...toAdd])
  }
}

export function loadAllCanon() {
  return loadDeclarations().sort((a, b) => b.createdAt - a.createdAt)
}

// importance: "foundational" | "operational" | "tactical" (default "operational")
// originTension: chain of custody from KODEX tension that produced this declaration
// wound: the specific failure or incident that made this declaration necessary
export function createDeclaration({
  type          = "rule",
  label,
  content,
  wound         = null,
  category      = "ops",
  priority      = 2,
  importance    = IMPORTANCE.OPERATIONAL,
  originTension = null,
}) {
  const existing    = loadDeclarations()
  const id          = `${type}_${category}_${Date.now()}`
  const declaration = {
    id,
    category,
    type,
    importance,
    label,
    content,
    wound,
    priority,
    conflicts:      [],
    lastReferenced: null,
    originTension,
    createdAt:      Date.now(),
    status:         "active",
  }
  saveDeclarations([declaration, ...existing])
  if (!SEED_IDS.has(id)) {
    recordSignal({
      type:   SIGNAL_TYPES.DECLARATION_CREATED,
      source: category,
      title:  label,
    })
    // Auto-flag for review: foundational doctrine in this domain that hasn't been
    // recently consulted. The system doesn't claim conflict — it requires comparison.
    const recentThreshold = Date.now() - 7 * 86400000
    const toReview = loadDeclarations().filter(d =>
      d.status === "active" &&
      d.importance === IMPORTANCE.FOUNDATIONAL &&
      d.id !== id &&
      (d.category === "global" || d.category === category) &&
      (!d.lastReferenced || d.lastReferenced < recentThreshold)
    )
    toReview.forEach(doc => _createConflictReview(id, doc.id))
  }
  return declaration
}

// Marks this declaration as referenced right now.
// Called by buildCanonContext() whenever a declaration is surfaced to the AI.
export function touchDeclaration(id) {
  const all = loadDeclarations()
  saveDeclarations(all.map(d =>
    d.id === id ? { ...d, lastReferenced: Date.now(), refCount: (d.refCount || 0) + 1 } : d
  ))
}

// Doctrine Health Score — 0 to 100. Pure math on existing data.
// freshness(25) + references(25) + scrutiny(20) + conflicts(20) + reviews(10)
export function getDoctineHealth(doc) {
  const stats = getChallengeStats(doc.id)

  // Freshness (0-25): 30-day linear decay since last AI reference
  const daysSince  = doc.lastReferenced ? (Date.now() - doc.lastReferenced) / 86400000 : 999
  const freshness  = Math.round(Math.max(0, 25 * (1 - Math.min(1, daysSince / 30))))

  // References (0-25): how many times included in AI context (saturates at 10)
  const refCount   = doc.refCount || 0
  const references = Math.round(Math.min(25, refCount * 2.5))

  // Scrutiny (0-20): resolved challenges signal active, examined doctrine
  // baseline 10 (unchallenged is neutral), +2 per resolved, -3 per pending
  const resolved      = stats.conflict + stats.linked + stats.ignored
  const scrutiny      = Math.max(0, 10 + Math.min(10, resolved * 2) - Math.min(10, stats.pending * 3))

  // Conflicts (0-20): confirmed bidirectional conflicts erode doctrine integrity
  const conflictLinks = (doc.conflicts || []).length
  const conflicts     = Math.max(0, 20 - conflictLinks * 5)

  // Reviews (0-10): unresolved pending reviews depress the score
  const reviews       = Math.max(0, 10 - stats.pending * 5)

  const total = Math.min(100, freshness + references + scrutiny + conflicts + reviews)
  return { total, breakdown: { freshness, references, scrutiny, conflicts, reviews } }
}

// ── Doctrine Drift ─────────────────────────────────────────────────────────────
// Tracks how health scores change across sessions so VERA can detect decay,
// not just staleness. An institution can fail a doctrine by slowly ignoring it.

const HEALTH_HISTORY_KEY = "pacer_health_history"

function loadHealthHistory() {
  try { return JSON.parse(localStorage.getItem(HEALTH_HISTORY_KEY) || "[]") }
  catch { return [] }
}

// Records a health snapshot for every active declaration.
// Called once on session open. Retains 60 snapshots (~2 months of daily use).
export function snapshotDoctrineHealth() {
  const decls = loadDeclarations().filter(d => d.status === "active")
  if (decls.length === 0) return
  const scores = {}
  decls.forEach(d => { scores[d.id] = getDoctineHealth(d).total })
  const history = loadHealthHistory()
  localStorage.setItem(HEALTH_HISTORY_KEY, JSON.stringify(
    [{ ts: Date.now(), scores }, ...history].slice(0, 60)
  ))
}

// Returns the health history for a single declaration, newest first.
export function getDriftHistory(declarationId, limit = 10) {
  return loadHealthHistory()
    .filter(s => s.scores[declarationId] !== undefined)
    .slice(0, limit)
    .map(s => ({ ts: s.ts, score: s.scores[declarationId] }))
}

// Returns drift vs oldest available snapshot, or null if none / no change.
export function getDoctrineDrift(declarationId, currentScore) {
  const history = getDriftHistory(declarationId)
  if (history.length < 2) return null
  const baseline = history[history.length - 1]
  const delta    = currentScore - baseline.score
  if (delta === 0) return null
  const daysAgo  = Math.max(0, Math.floor((Date.now() - baseline.ts) / 86400000))
  return { delta, daysAgo, from: baseline.score }
}

// Projects future health using least-squares regression on snapshot history.
// Returns null if: insufficient history, < 1 day of span, or trend is not negative.
// horizons: days into the future to project (default 30/60/90).
export function getDoctineRiskForecast(declarationId, currentScore, horizons = [30, 60, 90]) {
  const history = getDriftHistory(declarationId, 10)
  if (history.length < 2) return null

  const t0  = history[history.length - 1].ts          // oldest snapshot epoch
  const now = Date.now()

  // (days-from-oldest, score) pairs — oldest first, current score appended
  const xy = [...history].reverse()
    .map(p => ({ x: (p.ts - t0) / 86400000, y: p.score }))
  xy.push({ x: (now - t0) / 86400000, y: currentScore })

  if (xy[xy.length - 1].x < 1) return null             // < 1 day of data span

  // Least-squares linear regression: y = a + b·x
  const n     = xy.length
  const sumX  = xy.reduce((s, p) => s + p.x, 0)
  const sumY  = xy.reduce((s, p) => s + p.y, 0)
  const sumXY = xy.reduce((s, p) => s + p.x * p.y, 0)
  const sumX2 = xy.reduce((s, p) => s + p.x * p.x, 0)
  const denom = n * sumX2 - sumX * sumX
  if (denom === 0) return null

  const b = (n * sumXY - sumX * sumY) / denom   // slope (pts/day, negative = decaying)
  const a = (sumY - b * sumX) / n               // intercept

  if (b >= 0) return null                        // not decaying — no forecast needed

  const currentX = (now - t0) / 86400000
  return {
    ratePerDay: Math.round(Math.abs(b) * 10) / 10,
    forecasts:  horizons.map(days => ({
      days,
      score: Math.max(0, Math.round(a + b * (currentX + days))),
    })),
  }
}

// Elevates a declaration's importance tier.
// Foundational doctrine must be consciously elevated — it never defaults there.
export function setImportance(id, importance) {
  const all = loadDeclarations()
  saveDeclarations(all.map(d => d.id === id ? { ...d, importance } : d))
}

// Creates a bidirectional conflict link between two declarations.
// Neither is marked as wrong — the conflict is the fact worth surfacing.
export function declareConflict(idA, idB, note = "") {
  const all = loadDeclarations()
  const at  = Date.now()
  saveDeclarations(all.map(d => {
    if (d.id === idA) return { ...d, conflicts: [...(d.conflicts || []), { id: idB, note, at }] }
    if (d.id === idB) return { ...d, conflicts: [...(d.conflicts || []), { id: idA, note, at }] }
    return d
  }))
}

// ── Conflict review queue ─────────────────────────────────────────────────────
// A review is a pair (new declaration, foundational declaration) requiring
// conscious acknowledgment. The system flags them; humans resolve them.

function loadConflictReviewsRaw() {
  try { return JSON.parse(localStorage.getItem(REVIEW_KEY) || "[]") }
  catch { return [] }
}

function saveConflictReviews(reviews) {
  try { localStorage.setItem(REVIEW_KEY, JSON.stringify(reviews)) }
  catch {}
}

function _createConflictReview(newDeclarationId, foundationalId) {
  const existing = loadConflictReviewsRaw()
  if (existing.some(r => r.newDeclarationId === newDeclarationId && r.foundationalId === foundationalId)) return
  saveConflictReviews([{
    id:               `review_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
    newDeclarationId,
    foundationalId,
    status:           "pending",
    createdAt:        Date.now(),
    resolvedAt:       null,
  }, ...existing])
  const foundational = loadDeclarations().find(d => d.id === foundationalId)
  recordSignal({
    type:    SIGNAL_TYPES.REVIEW_CREATED,
    source:  "vera",
    title:   "Review required",
    summary: foundational?.label || foundationalId,
  })
}

// Returns pending reviews with populated declaration objects.
// Filters out orphans (declarations that have been released/deleted).
export function getPendingConflictReviews() {
  const pending = loadConflictReviewsRaw().filter(r => r.status === "pending")
  const all     = loadDeclarations()
  return pending
    .map(r => ({
      ...r,
      newDeclaration: all.find(d => d.id === r.newDeclarationId) || null,
      foundational:   all.find(d => d.id === r.foundationalId)   || null,
    }))
    .filter(r => r.newDeclaration && r.foundational)
    .sort((a, b) => b.createdAt - a.createdAt)
}

// Mark a review as surfaced — called when it first appears in VERA's UI.
// Records the moment the system placed this conflict in front of a human.
export function markReviewSurfaced(reviewId) {
  const reviews = loadConflictReviewsRaw()
  if (!reviews.some(r => r.id === reviewId && !r.surfacedAt)) return
  saveConflictReviews(reviews.map(r =>
    r.id === reviewId && !r.surfacedAt ? { ...r, surfacedAt: Date.now() } : r
  ))
}

// Resolve a pending review with a full audit record.
// decision: "conflict" — creates bidirectional conflict link between declarations
//           "link"     — soft association, noted but not flagged as contradiction
//           "ignore"   — acknowledged, no conflict found
// note: optional human-written explanation of why this decision was made
export function resolveConflictReview(reviewId, decision, note = "") {
  const reviews = loadConflictReviewsRaw()
  const review  = reviews.find(r => r.id === reviewId)
  if (!review) return
  saveConflictReviews(reviews.map(r =>
    r.id === reviewId
      ? { ...r, status: decision, resolvedAt: Date.now(), resolution: { decision, note, at: Date.now() } }
      : r
  ))
  if (decision === "conflict") {
    declareConflict(review.newDeclarationId, review.foundationalId, note)
  }
  const foundational = loadDeclarations().find(d => d.id === review.foundationalId)
  recordSignal({
    type:    SIGNAL_TYPES.REVIEW_RESOLVED,
    source:  "vera",
    title:   foundational?.label || review.foundationalId,
    summary: decision,
  })
}

// Returns all reviews (all statuses) involving a declaration, sorted newest first.
// Used by ARCHIVIST to show the full challenge history for any declaration.
export function getReviewsForDeclaration(declarationId) {
  const all = loadConflictReviewsRaw()
  const decls = loadDeclarations()
  return all
    .filter(r => r.newDeclarationId === declarationId || r.foundationalId === declarationId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(r => ({
      ...r,
      newDeclaration: decls.find(d => d.id === r.newDeclarationId) || null,
      foundational:   decls.find(d => d.id === r.foundationalId)   || null,
    }))
}

// Returns a challenge summary for a foundational declaration.
// Powers VERA's "challenged N times, conflicted N, linked N, ignored N" display.
export function getChallengeStats(foundationalId) {
  const reviews = loadConflictReviewsRaw().filter(r => r.foundationalId === foundationalId)
  return {
    total:     reviews.length,
    pending:   reviews.filter(r => r.status === "pending").length,
    conflict:  reviews.filter(r => r.status === "conflict").length,
    linked:    reviews.filter(r => r.status === "link").length,
    ignored:   reviews.filter(r => r.status === "ignore").length,
  }
}

export function releaseDeclaration(id) {
  const existing = loadDeclarations()
  const target   = existing.find(d => d.id === id)
  if (!target) return
  saveDeclarations(existing.map(d => d.id === id ? { ...d, status: "released" } : d))
  if (!SEED_IDS.has(id)) {
    recordSignal({
      type:   SIGNAL_TYPES.DECLARATION_RELEASED,
      source: target.category,
      title:  target.label,
    })
  }
}

// Returns active declarations not referenced in the last N days.
// Foundational declarations bubble to the top — neglecting them is highest risk.
export function getStaleDoctrines(days = 30) {
  const threshold = Date.now() - days * 86400000
  return loadDeclarations()
    .filter(d => d.status === "active")
    .filter(d => !d.lastReferenced || d.lastReferenced < threshold)
    .sort((a, b) => {
      if (a.importance === IMPORTANCE.FOUNDATIONAL && b.importance !== IMPORTANCE.FOUNDATIONAL) return -1
      if (b.importance === IMPORTANCE.FOUNDATIONAL && a.importance !== IMPORTANCE.FOUNDATIONAL) return 1
      const aRef = a.lastReferenced || a.createdAt
      const bRef = b.lastReferenced || b.createdAt
      return aRef - bRef
    })
}

export function buildCanonContext(laneCategory) {
  const all      = loadDeclarations().filter(d => d.status === "active")
  const relevant = all
    .filter(d => d.category === "global" || d.category === laneCategory)
    .sort((a, b) => (a.priority || 2) - (b.priority || 2))
    .slice(0, 12)
  if (relevant.length === 0) return ""
  // Touch every declaration that reaches the AI — this is how we track relevance over time
  relevant.forEach(d => touchDeclaration(d.id))
  return [
    "\n\n--- ACTIVE DECLARATIONS ---",
    ...relevant.map(d => `[${d.id}] ${d.label}\n${d.content}`),
    "--- END DECLARATIONS ---",
  ].join("\n")
}

// ── Tension store ──────────────────────────────────────────────────────────────

function loadTensionsRaw() {
  try { return JSON.parse(localStorage.getItem(TENSION_KEY) || "[]") }
  catch { return [] }
}

function saveTensions(tensions) {
  try { localStorage.setItem(TENSION_KEY, JSON.stringify(tensions)) }
  catch {}
}

export function createTension({ title, statement, affectedWings = [] }) {
  const tensions = loadTensionsRaw()
  const tension  = {
    id:           `tension_${Date.now()}`,
    title,
    statement,
    status:       "open",
    affectedWings,
    resolution:   null,
    closedBy:     null,
    createdAt:    Date.now(),
    resolvedAt:   null,
  }
  saveTensions([tension, ...tensions])
  recordSignal({
    type:    SIGNAL_TYPES.INTERPRETATION_REQUESTED,
    source:  "creative",
    title,
    summary: statement,
  })
  return tension
}

// Resolution becomes a declaration in ARCHIVIST with originTension set,
// so the chain of custody is complete in both directions.
export function resolveTension(id, resolution) {
  const tensions = loadTensionsRaw()
  const target   = tensions.find(t => t.id === id)
  if (!target) return null

  const declaration = createDeclaration({
    type:          "resolution",
    label:         `Resolution: ${target.title}`,
    content:       resolution,
    category:      "global",
    priority:      1,
    importance:    IMPORTANCE.OPERATIONAL,
    originTension: id,
  })

  saveTensions(tensions.map(t =>
    t.id === id
      ? { ...t, status: "resolved", resolution, closedBy: declaration.id, resolvedAt: Date.now() }
      : t
  ))

  recordSignal({
    type:    SIGNAL_TYPES.TENSION_RESOLVED,
    source:  "creative",
    title:   target.title,
    summary: resolution,
  })

  return declaration
}

export function loadTensions(status = null) {
  const all = loadTensionsRaw()
  return status ? all.filter(t => t.status === status) : all
}

export function loadOpenTensions() {
  return loadTensionsRaw()
    .filter(t => t.status === "open")
    .sort((a, b) => a.createdAt - b.createdAt)
}

// Returns a governance pressure snapshot — what the institution needs to look at now.
// Only computes meaningful signals; returns nulls when nothing is under pressure.
export function getGovernanceSummary() {
  const allReviews   = loadConflictReviewsRaw()
  const allDecls     = loadDeclarations()
  const foundational = allDecls.filter(d => d.status === "active" && d.importance === IMPORTANCE.FOUNDATIONAL)

  const pending       = allReviews.filter(r => r.status === "pending").sort((a, b) => a.createdAt - b.createdAt)
  const oldestPending = pending[0] || null

  let mostChallenged = null, mostChallengedCount = 0
  let mostConflicted = null, mostConflictedCount = 0

  for (const doc of foundational) {
    const docReviews   = allReviews.filter(r => r.foundationalId === doc.id)
    const conflictCount = docReviews.filter(r => r.status === "conflict").length
    if (docReviews.length > mostChallengedCount) { mostChallengedCount = docReviews.length; mostChallenged = doc }
    if (conflictCount > mostConflictedCount)      { mostConflictedCount = conflictCount;      mostConflicted = doc }
  }

  // Needs attention: doctrines with confirmed pressure, deduplicated
  const seen   = new Set()
  const urgent = []
  function candidate(doc, reason, type = "doctrine", reviewId = null) {
    if (!doc || seen.has(doc.id)) return
    seen.add(doc.id)
    urgent.push({ id: doc.id, label: doc.label, reason, type, reviewId })
  }

  if (oldestPending) {
    const doc = allDecls.find(d => d.id === oldestPending.foundationalId)
    const age = Math.floor((Date.now() - oldestPending.createdAt) / 86400000)
    candidate(doc, `oldest pending · ${age > 0 ? `${age}d` : "today"}`, "review", oldestPending.id)
  }
  if (mostConflicted && mostConflictedCount > 0) {
    candidate(mostConflicted, `${mostConflictedCount} confirmed conflict${mostConflictedCount !== 1 ? "s" : ""}`, "doctrine")
  }
  const staleF = getStaleDoctrines(30).filter(d => d.importance === IMPORTANCE.FOUNDATIONAL)
  if (staleF[0]) {
    const days = staleF[0].lastReferenced ? Math.floor((Date.now() - staleF[0].lastReferenced) / 86400000) : null
    candidate(staleF[0], days ? `${days}d without reference` : "never referenced", "doctrine")
  }
  // Worst drift: foundational doctrine whose health is decaying fastest across sessions
  let driftDoc = null, worstDelta = 0
  for (const doc of foundational) {
    const drift = getDoctrineDrift(doc.id, getDoctineHealth(doc).total)
    if (drift && drift.delta < worstDelta) { worstDelta = drift.delta; driftDoc = { doc, drift } }
  }
  if (driftDoc && worstDelta <= -10) {
    candidate(driftDoc.doc, `drifting ${worstDelta} pts · ${driftDoc.drift.daysAgo}d`, "doctrine")
  }

  // Worst projection: foundational doctrine most at risk in the next 30 days
  let worstProjection = null, worstScore30d = Infinity
  for (const doc of foundational) {
    const forecast = getDoctineRiskForecast(doc.id, getDoctineHealth(doc).total)
    if (!forecast) continue
    const score30d = forecast.forecasts[0]?.score ?? 100
    if (score30d < worstScore30d) {
      worstScore30d = score30d
      worstProjection = {
        id:         doc.id,
        label:      doc.label,
        score30d,
        score60d:   forecast.forecasts[1]?.score ?? 100,
        score90d:   forecast.forecasts[2]?.score ?? 100,
        ratePerDay: forecast.ratePerDay,
      }
    }
  }
  if (worstProjection && worstScore30d >= 70) worstProjection = null
  if (worstProjection) {
    const doc = foundational.find(d => d.id === worstProjection.id)
    candidate(doc, `projected ${worstProjection.score30d} in 30d`, "doctrine")
  }

  return {
    pendingCount:     pending.length,
    oldestPending:    oldestPending
      ? { ...oldestPending, declaration: allDecls.find(d => d.id === oldestPending.foundationalId) || null }
      : null,
    mostChallenged:   mostChallengedCount > 0 ? { ...mostChallenged, challengeCount: mostChallengedCount } : null,
    mostConflicted:   mostConflictedCount > 0 ? { ...mostConflicted, conflictCount: mostConflictedCount } : null,
    needsAttention:   urgent,
    worstProjection,
  }
}

export function getDoctrineDebt() {
  const open   = loadTensionsRaw().filter(t => t.status === "open")
  const byWing = {}
  open.forEach(t => {
    t.affectedWings.forEach(w => { byWing[w] = (byWing[w] || 0) + 1 })
  })
  const oldest            = [...open].sort((a, b) => a.createdAt - b.createdAt)[0] || null
  const staleFoundational = getStaleDoctrines(30).filter(d => d.importance === IMPORTANCE.FOUNDATIONAL)
  const pendingReviews    = loadConflictReviewsRaw().filter(r => r.status === "pending").length
  return { count: open.length, byWing, oldest, staleFoundational: staleFoundational.length, pendingReviews }
}
