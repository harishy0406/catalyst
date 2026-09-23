# CATALYST — Security & Privacy Document

**Project:** Smart Operator Assistant for CAT Machinery
**Team:** H1B Visa

---

## 1. Security Objectives

1. Protect operator personal data and machine telemetry from unauthorized access.
2. Ensure only authorized roles can view/modify safety-critical configuration (rule thresholds) and incident records.
3. Preserve an accurate, tamper-resistant audit trail for safety alerts and incidents.
4. Be explicit about the system's boundaries so it is never mistaken for a certified safety system.

## 2. Roles & Access Control

| Screen / Capability | Operator | Supervisor | Safety Manager | Trainer | System Admin |
|---|---|---|---|---|---|
| Home Dashboard / Task Detail | Own tasks only | Read (team) | Read | — | — |
| Live Safety View | Own machine | Read (team) | Read + threshold config | — | — |
| Incident Center | Create (own), view own | Full (team) | Full | — | Full |
| Training Hub | Consume | Read | Read | Author/publish | — |
| Machine Insights | Own machine | Read (team) | Read | — | — |
| Supervisor Analytics | — | Full | Full | Read | Full |
| Safety rule configuration | — | — | Full | — | Full |
| User/machine administration | — | — | — | — | Full |

Access control should be enforced **server-side** on every endpoint (role check on the API, not just hiding UI elements), since a hidden button is not a security boundary.

## 3. Authentication

- **Hackathon scope:** simple email/username + password with a JWT carrying the user's role claim; token expiry on a reasonable session window.
- **Production path:** integrate with an organization identity provider (SSO/OAuth) and add multi-factor authentication for Safety Manager and System Admin roles, given their ability to change safety-critical configuration.

## 4. Data Classification & Protection

| Data | Sensitivity | Handling |
|---|---|---|
| Operator name/ID | PII — moderate | Store minimally; avoid exposing full operator PII on shared/supervisor screens beyond what's needed for accountability |
| Telemetry (engine hours, fuel, idling, seatbelt) | Operational — moderate | Encrypt in transit (TLS); at rest encryption recommended for production |
| Incident descriptions | Potentially sensitive (may describe injuries/near-misses) | Restrict to Supervisor/Safety Manager/Admin roles; treat similarly to a workplace safety record |
| Safety rule configuration | Safety-critical | Change-controlled; every edit logged with who/when/old value/new value |
| Training completion records | Low sensitivity | Standard access control is sufficient |

- All API traffic should run over HTTPS/TLS, including in the demo environment where feasible.
- No secrets (API keys, JWT signing keys) should be committed to the repository; use environment variables/secret management.

## 5. Safety-Critical Boundaries & Liability Disclaimer

CATALYST is a **decision-support interface only**. It explicitly does not:
- Control machine movement, hydraulics, or any physical actuator.
- Perform autonomous driving or excavation.
- Replace certified machine safety systems (e.g., factory-installed seatbelt interlocks, proximity-detection hardware).
- Provide medical monitoring or diagnosis of the operator.
- Guarantee the accuracy of task-duration predictions, particularly when historical data is limited (as with the 4-telemetry/5-task sample set used in this prototype).

This boundary should be stated in-product (e.g., a footer note or onboarding message) as well as in project documentation, so operators and supervisors do not over-rely on the system in place of certified equipment and procedures.

## 6. Audit Logging & Traceability

- Every safety alert: timestamp, machine, operator, rule that fired, severity, acknowledgment time, resolving user.
- Every incident: creation time, creator, category, severity, all status changes with timestamp and actor.
- Every safety-rule configuration change: old value, new value, actor, timestamp.
- Logs should be append-only where feasible (no silent edits/deletes of historical safety records), supporting later incident investigation.

## 7. Rule Engine Configuration Security

Because safety rules are stored as configurable data (see ARCHITECTURE.md §7), the system must guard against:
- **Unauthorized edits:** only Safety Manager/Admin roles may write to `safety_rules`.
- **Malformed/malicious conditions:** rule conditions should be validated against a strict schema (allowed fields, operators, and value ranges) rather than evaluated as arbitrary code, to prevent injection through the rule-config surface.
- **Silent threshold weakening:** consider requiring a second approver or at least a logged justification when a threshold is loosened (e.g., raising the idling limit), since this directly affects safety sensitivity.

## 8. Threats & Mitigations

| Threat | Impact | Mitigation |
|---|---|---|
| Unauthorized access to incident records | Privacy violation, mistrust | Server-side RBAC on every endpoint |
| Tampering with safety rule thresholds | Missed real hazards | Restrict to Safety Manager/Admin, log all changes |
| Spoofed telemetry (fake "Fastened" status) | False sense of safety | Validate telemetry source/session binding; flag anomalous patterns for review |
| Session hijacking | Impersonation of operator/supervisor | Short-lived tokens, HTTPS-only cookies/headers, logout on session end |
| Data loss of incident/alert history | Loss of safety accountability | Regular backups; append-only audit tables |
| Over-trust in low-confidence estimates | Poor scheduling decisions | Always surface the confidence indicator alongside any estimate |

## 9. Compliance Considerations

- Incident records function similarly to workplace safety logs; production deployments should align retention and access policies with applicable occupational safety regulations (e.g., OSHA-equivalent record-keeping in the relevant jurisdiction).
- If deployed across regions, data residency and privacy regulations (e.g., GDPR-equivalent) should govern where operator PII and telemetry are stored.

## 10. Prototype Limitations & Production Hardening Roadmap

This prototype, built for a hackathon timeframe, intentionally simplifies several production security concerns:

| Prototype shortcut | Production hardening step |
|---|---|
| Simple JWT auth | SSO/OAuth + MFA for privileged roles |
| SQLite, single-host | Managed PostgreSQL with encryption at rest, backups, and access logging |
| Sample/simulated telemetry | Authenticated, signed telemetry ingestion from real CAT telematics hardware |
| Minimal rate limiting | API gateway with rate limiting, anomaly detection on ingestion patterns |
| Manual rule validation | Automated schema validation + approval workflow for safety-rule changes |
