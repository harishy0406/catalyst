# CATALYST — FastAPI Backend & Machine Learning Engine

A high-performance **FastAPI (Python 3.11)** backend powering the **CATALYST Intelligent Operator Assistant for Heavy Construction Machinery**.

The backend integrates real-time telemetry processing, safety rule evaluations, incident reporting, training modules, supervisor analytics, and an integrated **Machine Learning Engine** for task duration estimation and anomaly detection.

---

## 🏗 Architecture Overview

```
backend/
├── app/
│   ├── __init__.py
│   ├── config.py           # Pydantic BaseSettings & Environment Variables
│   ├── database.py         # PostgreSQL Connection Pool & DDL Schema
│   ├── dependencies.py     # JWT OAuth2 Bearer Authentication
│   ├── main.py             # FastAPI App, CORS, Lifespan & Router Mounts
│   ├── seed.py             # Complete Supabase Seed Script
│   ├── schemas/            # Pydantic v2 Request & Response Models
│   │   ├── auth.py
│   │   ├── tasks.py
│   │   ├── telemetry.py
│   │   ├── safety.py
│   │   ├── incidents.py
│   │   ├── training.py
│   │   ├── anomaly.py
│   │   ├── analytics.py
│   │   └── ml.py
│   ├── ml/                 # Machine Learning & Estimation Engine
│   │   ├── __init__.py
│   │   └── estimator.py    # Random Forest Regressor & Transparent Heuristic
│   └── routers/            # Clean REST API Routers
│       ├── __init__.py
│       ├── auth.py
│       ├── tasks.py
│       ├── telemetry.py
│       ├── safety.py
│       ├── incidents.py
│       ├── training.py
│       ├── anomaly.py
│       ├── analytics.py
│       └── ml.py
├── test_api.py             # Complete E2E Integration Test Suite
├── requirements.txt        # Python Dependencies
├── .env.example            # Sanitized Environment Configuration Template
└── .gitignore
```

---

## 🚀 Getting Started

### 1. Requirements
- Python 3.11+
- PostgreSQL database (Supabase pooler configured)

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Setup
Copy `.env.example` to `.env` and fill in your Supabase connection credentials:
```bash
cp .env.example .env
```

### 4. Database Initialization & Seeding
To reset and seed the database tables with baseline demo data:
```bash
python -m app.seed
```

### 5. Running the API Server
Start the server using `uvicorn`:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload
```

Interactive OpenAPI Swagger UI is available at:
- **Swagger UI**: [http://localhost:3000/docs](http://localhost:3000/docs)
- **ReDoc**: [http://localhost:3000/redoc](http://localhost:3000/redoc)
- **Health Check**: [http://localhost:3000/health](http://localhost:3000/health)

---

## 🤖 Machine Learning Engine

The ML engine provides dual-mode task duration estimation:

### 1. Phase 1 Transparent Heuristic
```
estimated_minutes = base_time(task_type)
                     * weather_factor(weather)
                     * skill_factor(operator_skill)
                     * machine_age_factor(machine_age)
```
- Derived directly from domain operational physics.
- Includes dynamic confidence indicator based on sample frequency.

### 2. Phase 2 Random Forest Regressor
- Utilizes `scikit-learn` `RandomForestRegressor`.
- Evaluates against the canonical 5-task benchmark dataset from `docs/TEST_PLAN.md §4`:
  - **Baseline Benchmark**: MAE = **7.6 min**, RMSE = **9.23 min**
- Supports continuous online model re-training via `POST /ml/train`.

---

## 📡 API Endpoints

| Method | Endpoint | Module | Description |
|---|---|---|---|
| `GET` | `/health` | Core | System health & Supabase connection status |
| `POST` | `/seed` | Core | Triggers database reset & seed |
| `POST` | `/auth/login` | Auth | Authenticates operator/supervisor, returns JWT |
| `GET` | `/auth/me` | Auth | Returns authenticated user profile |
| `GET` | `/tasks/today` | Tasks | Lists today's tasks for current operator |
| `GET` | `/tasks/{id}` | Tasks | Returns single task detail |
| `POST` | `/tasks/{id}/start` | Tasks | Marks task in progress |
| `POST` | `/tasks/{id}/complete` | Tasks | Marks task completed, calculates duration error |
| `POST` | `/tasks/{id}/status` | Tasks | Updates status directly |
| `POST` | `/telemetry` | Telemetry | Ingests telemetry, executes safety rules |
| `GET` | `/telemetry/{machine_id}` | Telemetry | Returns latest telemetry record |
| `GET` | `/safety/alerts` | Safety | Lists active/historical safety alerts |
| `POST` | `/safety/alerts/{id}/ack` | Safety | Acknowledges an alert |
| `GET` | `/safety/rules` | Safety | Lists safety threshold rules |
| `POST` | `/safety/rules` | Safety | Creates/updates dynamic safety rules |
| `GET` | `/incidents` | Incidents | Lists reported incidents |
| `POST` | `/incidents` | Incidents | Reports a new incident |
| `PATCH` | `/incidents/{id}` | Incidents | Updates status or resolves incident |
| `GET` | `/training/content` | Training | Lists available training modules |
| `GET` | `/training/recommendations` | Training | Returns adaptive contextual recommendations |
| `POST` | `/training/{id}/complete` | Training | Marks module completed |
| `GET` | `/machines/{id}/insights` | Anomaly | Health score, anomalies & recommendations |
| `GET` | `/analytics/supervisor` | Analytics | Fleet overview, productivity & MAE/RMSE metrics |
| `POST` | `/ml/predict` | ML | Predicts task duration using ML/formula |
| `POST` | `/ml/train` | ML | Re-trains Random Forest model on task history |
| `GET` | `/ml/metrics` | ML | Returns MAE & RMSE estimation accuracy metrics |
| `GET` | `/ml/status` | ML | Returns ML engine status & features |

---

## 🧪 Verification Testing
Run the automated test suite:
```bash
python test_api.py
```
Outputs complete test results with 100% pass verification across all 11 subsystems.
