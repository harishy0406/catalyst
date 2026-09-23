# CATALYST — Design Document (UX/UI)

**Project:** Smart Operator Assistant for CAT Machinery
**Team:** H1B Visa

---

## 1. Design Principles

1. **Glanceable first.** An operator inside a moving machine cannot read paragraphs. Every screen leads with one clear number, status, or action.
2. **Safety interrupts everything.** Critical alerts visually override whatever else is on screen — they are not just another list item.
3. **Low cognitive load.** Big touch targets, minimal text entry, short sentences, plain language explanations for anomalies (not raw statistics).
4. **Trust through transparency.** When the system estimates or flags something, it shows *why* (confidence indicator, explanation text) rather than presenting a bare number.
5. **Role-appropriate density.** Operator screens are sparse and action-oriented; supervisor screens can be denser since they're reviewed off-machine.

## 2. Design System

**Color language (safety-first, colorblind-safe pairing with icons/text — never color alone):**

| State | Color | Usage |
|---|---|---|
| Safe / Normal | Green | Seatbelt fastened, no active alerts |
| Warning | Amber | Excessive idling, proximity warning, minor deviation |
| Critical | Red | Seatbelt unfastened + active, proximity breach, unresolved critical alert |
| Informational | Blue | Training recommendations, estimation confidence |
| Neutral | Slate/Gray | Backgrounds, inactive states |

**Typography:** A single, highly legible sans-serif (e.g., Inter or system UI font) at large base sizes (operator screens ≥ 18px body, ≥ 28px key numbers) for readability with gloves on and in bright/dim cabin light.

**Components:** Large tap targets (≥ 48px), status pills (colored badge + icon + short label, never color alone), a persistent alert banner region reserved at the top of every operator screen.

## 3. Screen Specifications

### 3.1 Login / Machine Selection
- **Purpose:** authenticate and bind the session to a specific machine.
- **Key elements:** role-aware login, machine picker (ID + model + last-inspection status).
- **Primary action:** "Start Shift."

### 3.2 Home / Daily Dashboard
- **Purpose:** orient the operator instantly.
- **Key elements:** today's task list (status pill per task), current weather, machine readiness summary (seatbelt/inspection state).
- **States:** no tasks assigned; tasks loaded; machine flagged not-ready (blocks start until acknowledged).
- **Primary action:** select a task → Task Detail.

### 3.3 Task Detail
- **Purpose:** everything needed to execute one task.
- **Key elements:** instructions, estimated duration + confidence indicator, environmental conditions, start/complete controls.
- **States:** not started, in progress (timer visible), completed (shows estimated vs. actual).

### 3.4 Live Safety View
- **Purpose:** real-time alert feed during operation.
- **Key elements:** current status banner (green/amber/red), scrolling log of recent alerts with timestamp and severity, acknowledge/resolve buttons.
- **States:** all clear; active warning; active critical (visually dominant, may require explicit acknowledgment before dismissing).

### 3.5 Incident Center
- **Purpose:** create and track incidents.
- **Key elements:** "New Incident" button (pre-fills machine/operator/linked alert if launched from an alert), category + severity selectors, description field, status list for supervisors.
- **Primary action:** submit incident in under 3 taps + optional note.

### 3.6 Training Hub
- **Purpose:** deliver and track training.
- **Key elements:** recommended module (if triggered by a safety pattern) pinned at top with the reason shown ("Recommended: you've had 2 seatbelt alerts this week"), browsable catalog, completion checkmarks.

### 3.7 Machine Insights
- **Purpose:** show usage trends and anomalies for a machine/operator.
- **Key elements:** idling/fuel/load-cycle/engine-hour trend charts, anomaly cards with plain-language explanation (e.g., "Idling was 60 min today, well above your 45-min threshold").

### 3.8 Supervisor Analytics
- **Purpose:** cross-operator, cross-machine oversight.
- **Key elements:** safety trend chart (alerts/incidents over time), usage summary table, estimation accuracy panel (current MAE/RMSE with a short trend).

## 4. Interaction Patterns

- **Alert acknowledgment flow:** alert appears → banner + sound/visual cue (described, not literally audible in a web demo) → operator taps "Acknowledge" → optional "Log Incident" shortcut appears for critical alerts.
- **Incident creation flow:** from an alert (pre-filled) or from Incident Center (blank) → category → severity → short description → submit → supervisor notified.
- **Training recommendation flow:** anomaly/pattern detected → recommendation card appears in Training Hub with the triggering reason spelled out → operator opens/completes → completion recorded.

## 5. Accessibility & Field Usability

- Large touch targets and high-contrast color/icon pairing for use with gloves and in bright sunlight or glare.
- No interaction should require fine motor precision (e.g., small sliders) while the machine is in motion.
- Text kept short; icons paired with every status color so the interface remains usable for colorblind operators.
- Critical alerts should be dismissible only after an explicit acknowledgment tap, preventing accidental swipe-aways.

## 6. Information Hierarchy / Glanceability Rules

1. Anything safety-critical sits at the very top of the operator's viewport, always.
2. Only one primary number per card (e.g., estimated minutes, idling minutes) — supporting detail is secondary/smaller text.
3. Supervisor screens may use tables and multi-series charts; operator screens never do.

## 7. Empty / Error / Loading States

- **No tasks today:** friendly empty state, not a blank screen.
- **Telemetry gap (connectivity loss):** Live Safety View shows a neutral "reconnecting" state rather than falsely implying "all clear."
- **Insufficient history for estimation:** Task Detail shows the estimate with a clearly labeled "Low confidence — limited historical data" note rather than hiding the number.

## 8. Wireframe Sketches (textual)

**Home / Daily Dashboard**
```
------------------------------------------------
|  [Machine EXC001]        [Seatbelt: OK]      |
|  Weather: Sunny 28°C                         |
------------------------------------------------
|  Today's Tasks                               |
|  > Earth Excavation      Est. 60m   [Start]  |
|    Trenching             Est. 45m   [Queued] |
------------------------------------------------
```

**Live Safety View**
```
------------------------------------------------
|  STATUS: CRITICAL — Seatbelt Unfastened      |
|  [Acknowledge]     [Log Incident]            |
------------------------------------------------
|  10:00  Seatbelt Unfastened     CRITICAL     |
|  09:40  Idling 55m               WARNING     |
------------------------------------------------
```

**Task Detail (completed state)**
```
------------------------------------------------
|  Earth Excavation                            |
|  Estimated: 60m   Confidence: Medium         |
|  Actual: 58m       Error: -2m                |
------------------------------------------------
```
