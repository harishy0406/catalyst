# CATALYST — Test Plan

**Project:** Smart Operator Assistant for CAT Machinery
**Team:** H1B Visa

---

## 1. Testing Strategy & Levels

| Level | Scope | Approach |
|---|---|---|
| Unit | Rule engine conditions, estimation formula, error calculation | Automated tests against known inputs/outputs |
| Integration | Telemetry → Safety Engine → Alert → Incident chain | Simulated telemetry feed through the API |
| System | Full screen-to-screen flow across all 8 screens | Manual walkthrough + scripted demo |
| UAT / Demo | Judge-facing end-to-end scenario | Live demo script (Section 7) |

## 2. Test Environment & Data

All functional tests use the provided sample dataset so results are reproducible and traceable back to the PRD's appendix:

- 4 telemetry records (Machine EXC001, Operator OP1001)
- 5 historical task records (T001–T005)

Where more data is needed (e.g., multi-machine or multi-operator tests), synthetic records following the same schema should be generated and clearly labeled as synthetic.

## 3. Functional Test Cases

| ID | Feature | Precondition | Steps | Expected Result |
|---|---|---|---|---|
| TC-01 | Seatbelt critical alert | Machine active | Ingest telemetry row 2 (10:00, Unfastened) | Critical alert generated, visible in Live Safety View within ~2s |
| TC-02 | Seatbelt cleared | Alert TC-01 active | Ingest telemetry row 3 (14:00, Fastened) | No new alert; prior alert remains logged with resolution option |
| TC-03 | Excessive idling (warning) | Threshold = 45 min | Ingest telemetry row 2 (Idling = 55) | Warning-level anomaly/alert generated |
| TC-04 | Excessive idling (repeat) | Threshold = 45 min | Ingest telemetry row 4 (Idling = 60) | Second idling anomaly logged; pattern visible in Machine Insights |
| TC-05 | Repeated safety pattern → training | 2 seatbelt alerts logged (rows 2 & 4) | Trigger anomaly pattern check | Training Hub surfaces a seatbelt-compliance recommendation with reason text |
| TC-06 | Incident creation from alert | TC-01 alert active | Operator taps "Log Incident" from the alert | Incident created, pre-filled with machine/operator/alert link; appears in Incident Center |
| TC-07 | Incident visibility to supervisor | Incident from TC-06 exists | Supervisor opens Incident Center | Incident is visible with correct status and can be updated |
| TC-08 | Task estimation output | Task T001 inputs (Sunny, Expert, age 2) | Request estimate | Estimate returned with a confidence indicator (expect "low/medium" given 5-row sample) |
| TC-09 | Task completion error calc | Task T001 estimate = 60 | Mark task complete with actual = 58 | Error = -2 min recorded and shown in Task Detail |
| TC-10 | Supervisor analytics aggregation | TC-01–TC-09 completed | Open Supervisor Analytics | Safety trend, usage summary, and estimation MAE/RMSE reflect the above records |
| TC-11 | No tasks assigned | Operator with empty schedule | Open Home Dashboard | Friendly empty state shown, not a blank/broken screen |
| TC-12 | Telemetry gap | API temporarily unreachable | Disconnect client briefly | Live Safety View shows "reconnecting," not a false "all clear" |
| TC-13 | Rule config change | Safety Manager updates idling threshold to 30 min | Ingest telemetry row 1 (Idling = 30) | New warning triggers (previously would not have, since old threshold was 45) — confirms rules are data-driven, not hard-coded |

## 4. Task-Time Estimation Validation

Using the 5 historical task records as a validation set for the Phase-1 formula-based estimator:

| Task | Estimated | Actual | Error (Actual − Estimated) | Abs. Error | Squared Error |
|---|---|---|---|---|---|
| T001 | 60 | 58 | -2 | 2 | 4 |
| T002 | 45 | 52 | +7 | 7 | 49 |
| T003 | 30 | 42 | +12 | 12 | 144 |
| T004 | 35 | 33 | -2 | 2 | 4 |
| T005 | 90 | 105 | +15 | 15 | 225 |

- **MAE** = (2 + 7 + 12 + 2 + 15) / 5 = **7.6 minutes**
- **RMSE** = √((4 + 49 + 144 + 4 + 225) / 5) = √85.2 ≈ **9.23 minutes**

These baseline figures should be displayed in Supervisor Analytics as the current estimator's accuracy, and re-computed automatically as new completed tasks add rows to `task_history`. Because n = 5, this is a demonstration baseline, not a statistically reliable accuracy claim — the PRD and SECURITY.md both flag this explicitly.

## 5. Edge Cases & Negative Tests

- Telemetry record with missing/null seatbelt status → system should not crash and should log a data-quality flag rather than silently treating it as "Fastened."
- Incident submitted with no description → should require at minimum a category and severity.
- Estimation requested for a task type with zero historical rows → should return a clearly labeled "no historical data" confidence state rather than a fabricated number.
- Rule with a malformed threshold (e.g., negative idling minutes) → should be rejected at config time, not silently applied.
- Duplicate telemetry record (same timestamp/machine/operator) ingested twice → should not double-count in analytics.

## 6. Non-Functional Tests

- **Alert latency:** time from telemetry ingestion to alert rendering should stay under ~2 seconds in the demo environment.
- **Usability (glanceability):** a first-time viewer should be able to identify the current safety status within 2 seconds of looking at the Live Safety View.
- **Resilience:** a brief (few-second) API disconnect should not lose queued telemetry once connectivity resumes.

## 7. UAT / Demo Script (mapped to judging)

| Step | Action | Demonstrates |
|---|---|---|
| 1 | Login → Home Dashboard | Task planning |
| 2 | Start task | Workflow continuity |
| 3 | Inject seatbelt-unfastened telemetry | Real-time safety |
| 4 | Acknowledge alert, log incident | Incident management |
| 5 | Inject idling telemetry above threshold | Anomaly detection |
| 6 | Show training recommendation triggered by repeated pattern | Training Hub intelligence |
| 7 | Complete task, show estimate vs. actual | Task-time estimation |
| 8 | Switch to Supervisor Analytics | Cross-cutting oversight, MAE/RMSE |

## 8. Acceptance Criteria Summary

A build is considered demo-ready when TC-01 through TC-10 pass against the provided sample dataset, and the Supervisor Analytics view correctly reflects the MAE/RMSE figures computed in Section 4.
