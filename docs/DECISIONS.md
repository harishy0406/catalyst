# CATALYST — Architecture Decision Records (ADRs)

**Project:** Smart Operator Assistant for CAT Machinery
**Team:** H1B Visa

Each record follows: **Context → Decision → Consequences.**

---

## ADR-001: Rule-based safety engine instead of ML for the MVP

**Status:** Accepted

**Context:** The prototype only has 4 sample telemetry records — far too little to train a reliable machine-learning safety classifier. Safety-relevant behavior (seatbelt/proximity/idling) is also well-defined by simple, known thresholds.

**Decision:** Use a configurable, rule-based engine (condition → severity) rather than an ML model for safety detection in the MVP.

**Consequences:** Behavior is fully explainable and testable against the sample data immediately. The trade-off is that subtler, harder-to-specify unsafe patterns won't be caught until enough data justifies a learned model — an explicit non-goal for this phase.

---

## ADR-002: Configurable rule thresholds instead of hard-coded values

**Status:** Accepted

**Context:** Safety thresholds (e.g., 45-minute idling limit) vary by site, machine, and safety policy, and may need adjustment without a deployment.

**Decision:** Store rules as structured data (`safety_rules` table) with condition, severity, and threshold fields, evaluated generically by the Safety Engine, rather than embedding thresholds in application code.

**Consequences:** Safety Managers can tune sensitivity without engineering involvement. This requires strict schema validation on rule edits (see SECURITY.md §7) to avoid misconfiguration or abuse.

---

## ADR-003: Transparent formula-based task-time estimation before ML

**Status:** Accepted

**Context:** Only 5 historical task records are available — not enough to train or validate a regression/tree-based model with any statistical confidence.

**Decision:** Ship a transparent, factor-based formula (task type × weather × skill × machine-age adjustments) for Phase 1, paired with an explicit confidence indicator, and defer ML-based estimation to a later phase once more `task_history` accumulates (evaluated via MAE/RMSE).

**Consequences:** Estimates are explainable and immediately testable against the sample data (see TEST_PLAN.md §4). The formula will be less accurate than a trained model eventually could be, which is why the confidence indicator and future ML path are both documented up front rather than presented as a permanent limitation.

---

## ADR-004: Single unified operator interface instead of separate apps per feature

**Status:** Accepted

**Context:** The challenge brief calls for "one simple, low-distraction interface," and operators cannot reasonably switch between multiple apps while working a machine.

**Decision:** Build one application with 8 screens covering tasks, safety, incidents, training, insights, and analytics, rather than separate tools per capability.

**Consequences:** Simpler operator experience and shared context (e.g., an alert can pre-fill an incident). It does mean the frontend must carefully manage information hierarchy (DESIGN.md §6) so the unified app doesn't become cluttered.

---

## ADR-005: Modular backend separation (Auth / Task / Telemetry / Safety / Incident / Training / Anomaly / Estimation / Analytics)

**Status:** Accepted

**Context:** The project must demonstrate several distinct capabilities independently within a hackathon timeframe, ideally split across four team members' work.

**Decision:** Structure the backend into the nine modules listed in ARCHITECTURE.md §3, each with a clear responsibility and data contract, communicating through the shared database and a common API gateway.

**Consequences:** Team members can build/test modules in parallel. The cost is some upfront coordination on shared schemas (telemetry format, task fields) before parallel work begins.

---

## ADR-006: Explicit scope boundaries excluding machine control and medical monitoring

**Status:** Accepted

**Context:** An "intelligent assistant" for heavy machinery could be scoped ambiguously wide, risking both engineering overreach in a hackathon timeframe and safety/liability confusion.

**Decision:** Explicitly exclude machine control (hydraulics/movement), autonomous operation, medical monitoring/diagnosis, and any guarantee of prediction accuracy from the system's scope (documented in PRD.md §12 and SECURITY.md §5).

**Consequences:** Keeps the build achievable in the hackathon window and avoids implying the system is a certified safety replacement. Future extensions (e.g., deeper integration with machine systems) would require a separate, much more rigorous safety-certification process outside this project's scope.

---

## ADR-007: Web-first stack (React + Node/Express + SQLite) for the hackathon build

**Status:** Proposed

**Context:** The team needs a stack that can be stood up quickly by four people within a hackathon, demoed reliably, and later evolved toward production (e.g., PostgreSQL, real telematics).

**Decision:** Recommend React (Vite) + Tailwind on the frontend, Node.js/Express on the backend, and SQLite for local development, with a documented migration path to PostgreSQL (ARCHITECTURE.md §5, §11).

**Consequences:** Fast iteration and a single language (JavaScript/TypeScript) across the stack lowers coordination overhead for a small team. This is a recommendation, not a hard constraint — if the team has stronger existing tooling in another stack, the module boundaries and data contracts in ARCHITECTURE.md remain valid regardless of the specific technology chosen.

---

## ADR-008: Supervisor dashboard as a separate Next.js app reading the shared database directly

**Status:** Accepted

**Context:** Supervisors need to assign tasks, watch their crew live and act on incident reports and safety alerts (PRD §6.3, §6.8). The FastAPI backend was built around the operator's cabin app. Its endpoints are scoped to the logged-in operator (for example `/tasks/today`), and it has no endpoints for creating or reassigning tasks. The team also wanted the supervisor tool to keep working and ship independently of backend changes.

**Decision:** Build `frontend/supervisor-dashboard/` as a standalone Next.js (App Router) app. It connects to the same Supabase PostgreSQL database with `pg`, from server code only (server components and server actions), and never calls the FastAPI backend. It reuses the existing tables and status values (`tasks`, `incidents`, `alerts`, `users`, `machines`, `task_history`, `operator_training`) without changing the schema. Supervisors and safety officers log in with their `users` ID and PIN. The dashboard checks the role on the server in every page and every server action (SECURITY.md §2).

**Consequences:** The dashboard and the operator app share state through the database. A task the supervisor assigns shows up in the operator's `/tasks/today`, and an incident an operator logs shows up in the dashboard within about 10 seconds (it polls). The cost is that business rules are now in two places, such as the estimate formula and the list of valid statuses. `src/lib/domain.ts` mirrors `backend/app/ml/estimator.py` and must be kept in sync when either changes. `POST /seed` on the backend wipes supervisor-created tasks along with everything else.
