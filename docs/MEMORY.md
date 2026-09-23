# CATALYST — Project Memory

**Project:** Smart Operator Assistant for CAT Machinery
**Team:** H1B Visa
**Members:** M Harish Gautham, Ansh Vohra, Prasurjya Boruah, Nithish Selvam C

This document is the living reference for the team and anyone (including an AI assistant) picking the project back up later. It summarizes what CATALYST is, key terms, current status, and where to look for more detail.

---

## 1. Project Snapshot

CATALYST is an operator-facing intelligent assistant for CAT construction machinery. It combines a daily task dashboard, real-time safety alerts, incident logging, a training hub, machine-usage anomaly detection, and task-time estimation into one low-distraction interface. It is a decision-support system — it does not control the machine, drive autonomously, or replace certified safety equipment.

Full detail lives in `PRD.md` (what to build), `ARCHITECTURE.md` (how it's built), `DESIGN.md` (how it looks/feels), `TEST_PLAN.md` (how it's verified), `SECURITY.md` (how it's protected), and `DECISIONS.md` (why key choices were made).

## 2. Team & Roles

| Member | Suggested focus (adjust as needed) |
|---|---|
| M Harish Gautham | TBD |
| Ansh Vohra | TBD |
| Prasurjya Boruah | TBD |
| Nithish Selvam C | TBD |

> Fill in actual module ownership here as the team divides work — a natural split follows the modules in `ARCHITECTURE.md` §3 (e.g., one person on Safety Engine + Anomaly Detection, one on Task + Estimation, one on Incident + Training, one on frontend/Analytics).

## 3. Glossary

| Term | Meaning |
|---|---|
| **Telemetry** | A timestamped snapshot of machine/operator state (engine hours, fuel, load cycles, idling, seatbelt status) |
| **Safety Engine** | The module that evaluates telemetry against configurable rules and emits alerts |
| **Configurable rule** | A safety condition stored as data (not code) so thresholds can change without redeployment |
| **Anomaly** | A flagged unusual pattern (e.g., excessive idling, repeated safety events) with a plain-language explanation |
| **Estimation confidence** | An indicator of how much historical data supports a given task-duration estimate |
| **MAE / RMSE** | Mean Absolute Error / Root Mean Squared Error — the two accuracy metrics used to evaluate task-time estimation |
| **Incident** | An operator- or supervisor-created record of a safety event, optionally linked to an alert |
| **Decision-support system** | A system that informs/advises humans but does not control machinery directly — CATALYST's defining boundary |

## 4. Current Status Checklist

Use this as a running checklist; check items off as they're actually built (this file should be updated as the project progresses).

- [ ] Auth module (login, roles)
- [ ] Task module (daily dashboard, task detail, start/complete)
- [ ] Telemetry ingestion (sample data seeded)
- [ ] Safety Engine (configurable rules: seatbelt, proximity, idling)
- [ ] Live Safety View (real-time alert feed)
- [ ] Incident Center (create/view/update)
- [ ] Anomaly Detection (excessive idling, repeated pattern)
- [ ] Training Hub (catalog + recommendation trigger)
- [ ] Estimation engine (Phase 1 formula + confidence indicator)
- [ ] Machine Insights (usage trend charts)
- [ ] Supervisor Analytics (safety trend, usage summary, MAE/RMSE)
- [ ] End-to-end demo script rehearsed (see `TEST_PLAN.md` §7)

## 5. Key Decisions Recap

See `DECISIONS.md` for full ADRs. Short version:

- Rule-based (not ML) safety detection for now — data is too small for ML (ADR-001).
- Rules and thresholds are configurable data, not hard-coded (ADR-002).
- Task-time estimation starts as a transparent formula with a confidence score, not ML (ADR-003).
- One unified operator app, not separate tools per feature (ADR-004).
- Backend split into 9 modules for parallel team development (ADR-005).
- Explicitly no machine control, no autonomous operation, no medical monitoring (ADR-006).
- Recommended stack: React + Node/Express + SQLite, portable to Postgres later (ADR-007).

## 6. Open Questions / Risks

- Real-time delivery mechanism: WebSocket vs. polling — needs a team decision before the Live Safety View is built.
- How will telemetry actually be simulated for the live demo (manual trigger buttons vs. a scripted replay of the sample rows)?
- Role-switching in the demo: full multi-account login, or a single "switch role" toggle for speed?
- Estimation formula's factor tables (weather/skill/machine-age multipliers) need to be derived explicitly from the 5 sample rows — assign an owner.
- Confirm how "machine active" is determined for the seatbelt rule (engine-on flag isn't in the current sample schema — may need to be assumed/simulated).

## 7. Next Steps / Backlog

1. Finalize module ownership across the four team members.
2. Stand up the shared schema (tables in `ARCHITECTURE.md` §6) so parallel work can begin.
3. Seed the database with the provided sample telemetry/task rows.
4. Build Safety Engine + Live Safety View first (core demo moment).
5. Wire Incident Center to alerts.
6. Build Estimation Phase-1 formula and validate against the MAE/RMSE figures in `TEST_PLAN.md` §4.
7. Build Supervisor Analytics last, once other modules produce real data to aggregate.
8. Rehearse the full demo script (`TEST_PLAN.md` §7 / `PRD.md` §13) at least twice before presenting.

## 8. Cross-Document Index

- **`PRD.md`** — problem, users, features, screens, success criteria, demo script.
- **`ARCHITECTURE.md`** — modules, data flow diagrams, schema, API list, tech stack, estimation/rule engine design.
- **`DESIGN.md`** — design principles, design system, per-screen specs, wireframe sketches.
- **`TEST_PLAN.md`** — test cases, estimation validation (MAE/RMSE worked example), demo script mapped to judging.
- **`SECURITY.md`** — RBAC matrix, data classification, safety boundaries/disclaimer, audit logging, threats/mitigations.
- **`DECISIONS.md`** — the "why" behind every major architectural choice (ADR-001 through ADR-007).
