# CATALYST — Product Requirements Document (PRD)

**Project:** Smart Operator Assistant for CAT Machinery
**Team:** H1B Visa
**Members:** M Harish Gautham, Ansh Vohra, Prasurjya Boruah, Nithish Selvam C
**Document status:** Draft v1.0 — Hackathon submission

---

## 1. Overview

CATALYST is an operator-facing intelligent assistant for CAT construction machinery (excavators, loaders, and similar heavy equipment). It unifies daily work planning, real-time safety monitoring, incident handling, training, machine-usage analytics, and task-time estimation into a single, low-distraction interface designed for use inside a machine cabin.

CATALYST is a **decision-support system**, not a control system. It never touches hydraulics or machine movement, and it does not replace certified safety equipment, licensed training, or site procedures.

## 2. Problem Statement

Modern CAT machines generate continuous telemetry (engine hours, fuel use, load cycles, idling time, seatbelt state, and more), but this data rarely reaches the operator in a usable form. Today:

- Operators lack a single place to see their day's tasks and expectations.
- Safety-relevant signals (seatbelt status, proximity hazards) are not surfaced in real time in a way the operator can act on.
- Incidents are logged informally or not at all, so supervisors lack visibility.
- Training is generic and disconnected from an operator's actual safety history.
- Idling and unsafe usage patterns go unnoticed until they show up in fuel or maintenance costs.
- Task duration estimates are guesswork, so planning and scheduling suffer.

## 3. Vision

> A smart co-pilot for CAT machine operators that combines task management, real-time safety alerts, incident handling, training, machine-usage anomaly detection, and explainable task-time estimation into a single operator-friendly dashboard.

## 4. Goals & Non-Goals

### Goals
1. Give every operator a single daily dashboard showing tasks, status, and conditions.
2. Detect and alert on unsafe conditions (seatbelt, proximity) in near real time.
3. Let operators log incidents and supervisors review them.
4. Recommend training based on actual safety history, not just a static catalog.
5. Surface unusual machine usage (excessive idling, unsafe patterns) with plain-language explanations.
6. Estimate task duration transparently, and improve the estimate as more historical data accumulates.
7. Give supervisors an aggregate view of safety, usage, and estimation accuracy across operators/machines.

### Non-Goals (see also Section 12)
- Not building an ML model for production-grade prediction in the hackathon timeframe.
- Not integrating with real CAT telematics hardware (simulated/sample data is acceptable).
- Not implementing machine control of any kind.

## 5. Target Users & Personas

| Role | Primary Needs | Key Screens |
|---|---|---|
| **Operator** | Know today's tasks, get safety alerts, log incidents, access training, see personal usage insights | Login, Home Dashboard, Task Detail, Live Safety View, Incident Center, Training Hub |
| **Supervisor** | Monitor tasks, safety events, machine/operator usage across a crew | Supervisor Analytics, Incident Center, Machine Insights |
| **Safety Manager** | Manage incidents, review safety trends, tune alert thresholds | Incident Center, Supervisor Analytics, configuration of safety rules |
| **Trainer** | Publish training content, track completion | Training Hub (authoring view) |
| **System Administrator** | Manage users, machines, configuration, and reference data | Admin/config surfaces across modules |

## 6. Functional Requirements

### 6.1 Daily Task Dashboard
- Show today's assigned tasks with status (not started / in progress / complete), estimated duration, instructions, and current environmental conditions (weather).
- Allow the operator to select a task to begin.
- Surface machine/safety readiness (e.g., seatbelt status, last inspection) before task start.

### 6.2 Real-Time Safety Monitoring
- Ingest telemetry (seatbelt status, proximity signals, idling time) continuously during operation.
- Evaluate telemetry against **configurable rules** (not hard-coded thresholds).
- Generate warning/critical alerts and require operator acknowledgment.
- Log every alert with timestamp, severity, and resolution state.

### 6.3 Incident Management
- Operators can create an incident record (free text + category + severity + optional linked alert).
- Supervisors/Safety Managers can review, update status, and close incidents.
- Incident creation triggers a supervisor notification.

### 6.4 Training Hub
- Provide e-learning content (video/module list) operators can browse and complete.
- Recommend specific training when a safety pattern repeats (e.g., repeated seatbelt violations → seatbelt-compliance module).
- Track completion status per operator.

### 6.5 Machine-Usage Analytics
- Track idling time, fuel consumption, load cycles, and engine hours per machine/operator/session.
- Present trends over time (daily/weekly).

### 6.6 Anomaly Detection
- Identify excessive idling (idle time over a configurable threshold, e.g., 45 minutes).
- Identify repeated/unsafe operating patterns (e.g., recurring seatbelt violations within a time window).
- Each anomaly includes a plain-language explanation of why it was flagged.

### 6.7 Task-Time Estimation
- Predict task duration from task type, weather, operator skill, machine age, and historical task duration.
- Output an estimated duration in minutes **and** a confidence/data-quality indicator.
- On task completion, record actual duration, compute estimation error, and store it as historical data for future estimates.
- Start with a transparent, formula-based approach (Section 8 of ARCHITECTURE.md); evolve toward regression/tree-based ML as data volume grows, evaluated via MAE/RMSE.

### 6.8 Supervisor Analytics
- Safety trends (alerts/incidents over time, by machine/operator).
- Machine and operator usage summaries.
- Estimated-vs-actual task performance, including current MAE/RMSE.

## 7. User Stories (representative)

- As an **Operator**, I want to see today's tasks and their expected duration so I can plan my shift.
- As an **Operator**, I want an immediate alert if my seatbelt is unfastened while the machine is active, so I can correct it before it becomes a hazard.
- As an **Operator**, I want to log an incident in under a minute so it doesn't interrupt my work.
- As an **Operator**, I want training recommendations tied to my actual safety history, not a generic list.
- As a **Supervisor**, I want to see which machines/operators have unusual idling or repeated safety events, so I can intervene early.
- As a **Safety Manager**, I want to adjust alert thresholds without a code change, so I can tune sensitivity per site.
- As a **Trainer**, I want to see completion rates for training content I've published.
- As a **System Administrator**, I want to onboard a new machine and operator without touching code.

## 8. Screens (8 total)

1. **Login / Machine Selection** — authenticate, pick assigned machine.
2. **Home / Daily Dashboard** — today's tasks, status, conditions.
3. **Task Detail** — instructions, estimate, start/complete controls.
4. **Live Safety View** — real-time alert feed, acknowledge/resolve.
5. **Incident Center** — create/view/update incidents.
6. **Training Hub** — browse content, recommendations, completion tracking.
7. **Machine Insights** — idling/fuel/load-cycle/engine-hour trends, anomalies.
8. **Supervisor Analytics** — safety trends, usage summaries, estimation accuracy.

## 9. Data Model Overview (from sample data)

**Telemetry record:** Timestamp, Machine ID, Operator ID, Engine Hours, Fuel Used (L), Load Cycles, Idling Time (min), Seatbelt Status, Safety Alert Triggered.

**Historical task record:** Task ID, Task Type, Weather, Operator Skill, Machine Age (yrs), Estimated Time (min), Actual Time (min).

The provided sample (4 telemetry rows, 5 task rows) is explicitly sufficient only to demonstrate UI and rule-based logic — not to train a production ML model.

## 10. Success Metrics / Acceptance Criteria (hackathon scope)

- All 8 screens are navigable end-to-end in a single demo session.
- Seatbelt-unfastened + machine-active telemetry produces a visible alert within the demo.
- An idling record above threshold produces an anomaly insight with explanation.
- An operator can create an incident and a supervisor can see it.
- A task's estimated vs. actual duration is shown with computed error after completion.
- Supervisor Analytics view aggregates at least safety events and estimation error (MAE) across the sample data.

## 11. Assumptions & Constraints

- Telemetry and historical task data are simulated/sample-driven for the demo, not live CAT telematics.
- Rule thresholds (idling, proximity distance, etc.) are configurable but ship with reasonable defaults.
- Five roles exist, but the hackathon demo may implement role-switching rather than full multi-tenant auth.
- Network connectivity in the cabin may be intermittent; the design should tolerate short gaps (see ARCHITECTURE.md).

## 12. Out of Scope / Boundaries

CATALYST explicitly does **not**:
- Control machine movement or hydraulics.
- Perform autonomous driving or excavation.
- Replace certified machine safety systems.
- Provide medical monitoring or diagnosis.
- Guarantee task-duration predictions when historical data is insufficient.

## 13. Hackathon Demo Script

1. Login → see today's task on the Home Dashboard.
2. Open Task Detail → start task.
3. Simulate seatbelt-unfastened telemetry → Live Safety View shows a critical alert → operator acknowledges.
4. Simulate proximity-hazard telemetry → warning alert appears.
5. Simulate idling above threshold → Machine Insights shows an excessive-idling anomaly with explanation.
6. Operator logs an incident from the alert → Incident Center shows it; supervisor is notified.
7. Repeated seatbelt violations → Training Hub surfaces a recommended module.
8. Complete task → estimated vs. actual duration shown, error computed.
9. Switch to Supervisor Analytics → show safety trend, usage summary, and estimation MAE/RMSE across sample data.

## 14. Appendix: Sample Data

**Telemetry**

| Timestamp | Machine ID | Operator ID | Engine Hours | Fuel Used (L) | Load Cycles | Idling (min) | Seatbelt | Alert |
|---|---|---|---|---|---|---|---|---|
| 2025-05-01 08:00 | EXC001 | OP1001 | 1523.5 | 5.2 | 12 | 30 | Fastened | No |
| 2025-05-01 10:00 | EXC001 | OP1001 | 1524.8 | 3.8 | 2 | 55 | Unfastened | Yes |
| 2025-05-01 14:00 | EXC001 | OP1001 | 1526.5 | 6.1 | 10 | 15 | Fastened | No |
| 2025-05-02 09:00 | EXC001 | OP1001 | 1530.2 | 2.0 | 1 | 60 | Unfastened | Yes |

**Historical Tasks**

| Task ID | Type | Weather | Skill | Machine Age | Estimated (min) | Actual (min) |
|---|---|---|---|---|---|---|
| T001 | Earth Excavation | Sunny | Expert | 2 | 60 | 58 |
| T002 | Trenching | Rainy | Intermediate | 4 | 45 | 52 |
| T003 | Material Loading | Cloudy | Beginner | 3 | 30 | 42 |
| T004 | Grading | Sunny | Expert | 5 | 35 | 33 |
| T005 | Demolition | Windy | Intermediate | 6 | 90 | 105 |
