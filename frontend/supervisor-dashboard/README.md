# CATALYST Supervisor Dashboard

A web command center where site supervisors and safety officers can:

- **Assign tasks.** Create work orders, pick the operator and machine, set the priority, and add a safety checklist. The estimate is pre-filled from the backend's formula. Tasks that haven't started can be reassigned or deleted.
- **Supervise operators.** See each operator's live status: current task and elapsed time against the estimate, queue, unacknowledged alerts, incidents, training, machine telemetry, and estimate-vs-actual history.
- **Review incident reports.** Incidents logged from the cabin app appear here. Move them from open to investigating to resolved and add notes. Each note is stamped with who wrote it and when, and notes are required to resolve.
- **Handle safety alerts.** Acknowledge the alerts the rule engine raises from telemetry.

It is a standalone **Next.js 16** app. It does **not** call the FastAPI backend. It connects straight to the **same Supabase PostgreSQL database**, from server code only, and uses the tables defined in [`backend/app/database.py`](../../backend/app/database.py). See [ADR-008](../../docs/DECISIONS.md) for why.

## Run it

```bash
cd frontend/supervisor-dashboard
npm install
cp .env.example .env.local   # DATABASE_URL: same value as backend/.env
                             # SESSION_SECRET: openssl rand -hex 32
npm run dev                  # http://localhost:3100
```

For a production build, run `npm run build && npm start`. The app runs on port **3100** so it doesn't clash with the backend on 3000.

**Logins** (seeded by `backend/app/seed.py`):

| ID | PIN | Role |
|---|---|---|
| `SUP-101` | `1001` | Supervisor |
| `SAFE-201` | `2001` | Safety officer |

Operator accounts are refused here. Operators use the cabin app.

## How it connects to the operator app

| Supervisor does | Operator app sees |
|---|---|
| Creates a task assigned to `OP-4412` | It appears in that operator's `/tasks/today` on the next poll |
| Leaves a task unassigned | It appears in **every** operator's queue (backend behaviour) |
| Reassigns a task | The task moves to the new operator's queue, and `machine_id` follows that operator's bound machine |
| Resolves an incident | `status` and `resolution_notes` update, and backend analytics stop counting it as active |

In the other direction, operator activity shows up on the dashboard within about 10 seconds: tasks started, paused or completed, incidents logged, and alerts raised. The dashboard re-fetches while its tab is visible.

## Layout

```
src/
├── app/
│   ├── actions.ts            # server actions (all writes; each one re-checks the session)
│   ├── login/                # ID + PIN sign-in
│   └── (dash)/               # authenticated pages
│       ├── page.tsx          # overview: KPIs, crew status, incidents, alerts, fleet
│       ├── tasks/            # create, assign, reassign, prioritise, delete
│       ├── operators/        # crew cards + per-operator detail
│       ├── incidents/        # incident center
│       └── alerts/           # safety alerts
├── components/               # Badge, AutoRefresh, NavLinks, …
└── lib/
    ├── db.ts                 # pg pool (server-only)
    ├── session.ts            # signed httpOnly cookie, role check
    ├── queries.ts            # read queries
    └── domain.ts             # statuses, task types, estimate formula (mirrors backend)
```

## Things to know

- **Shared database.** Everything you do here writes to the same database the whole team uses. The backend's `POST /seed` wipes it, including tasks created here.
- **Keep in sync.** `src/lib/domain.ts` copies the task types and estimate factors from `backend/app/ml/estimator.py`. Update both together.
- **Incident statuses** are `open`, `investigating` and `resolved`. Backend analytics count anything that isn't `resolved` as active.
- **Styling** follows the operator app's "Heavy Telematics" tokens (dark surfaces, CAT gold, Barlow Condensed + Inter). Supervisor screens are denser, per `docs/DESIGN.md` §1.5.
