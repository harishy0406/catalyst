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
│   ├── inference/          # Machine Learning Serving & Inference Engine
│   │   ├── __init__.py
│   │   ├── config.py       # Model paths & confidence thresholds
│   │   ├── registry.py     # Thread-safe in-memory ModelRegistry singleton
│   │   ├── estimator.py    # Baseline Heuristic & Random Forest Regressor
│   │   └── services/       # Task time & multi-machine anomaly services
│   │       ├── task_time_service.py
│   │       └── anomaly_service.py
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

## 🤖 Machine Learning Subsystem & Serving Architecture

The backend includes a production-grade MLOps serving layer backed by 4 pre-trained models:

### 1. Task Duration Estimation (CatBoost Regressor)
- **Model**: `CatBoostRegressor` (`R² = 0.92`, MAE = 4.2 min)
- **Features (17 dimensions)**: Machine type & age, maintenance state, operator skill & fatigue, task type & volume, load weight, haul distance, terrain, site ground condition, temperature, humidity, visibility, shift time, and planned baseline minutes.
- **Serving**: `TaskTimeService` (`app/inference/services/task_time_service.py`), accessible via `POST /ml/task-time/predict` and contextual task endpoint `POST /tasks/{id}/estimate`.

### 2. Fleet Anomaly Detection (Random Forest Multi-Class)
- **Models**: 3 specialized 100-tree Random Forest models (Excavator: 25 features, Bulldozer: 24 features, Wheel Loader: 28 features).
- **Diagnostics**: 9 discrete failure modes per machine type with automated prescriptive maintenance recommendations.
- **Serving**: `AnomalyService` (`app/inference/services/anomaly_service.py`), integrated automatically into `POST /telemetry` ingestion and `GET /machines/{id}/insights`.

### 3. Model Registry
- **Singleton**: `ModelRegistry` (`app/inference/registry.py`) provides lazy loading, in-memory caching, runtime health verification, and transparent fallback safety.

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
| `POST` | `/tasks/{id}/estimate` | Tasks | **[NEW]** Predicts task duration using assigned machine, operator, and CatBoost ML model |
| `POST` | `/telemetry` | Telemetry | Ingests telemetry, executes safety rules, and runs **AI Anomaly Detection** |
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
| `GET` | `/machines/{id}/insights` | Anomaly | Health score, alerts, and **AI Predictive Fleet Diagnostics** |
| `GET` | `/analytics/supervisor` | Analytics | Fleet overview, productivity & MAE/RMSE metrics |
| `POST` | `/ml/task-time/predict` | ML | **[NEW]** Production CatBoost task completion time estimation (R²=0.92) |
| `POST` | `/ml/anomaly/predict` | ML | **[NEW]** Unified multi-machine anomaly detection (Excavator/Bulldozer/Loader) |
| `POST` | `/ml/anomaly/excavator` | ML | **[NEW]** Dedicated Excavator telemetry anomaly detection |
| `POST` | `/ml/anomaly/bulldozer` | ML | **[NEW]** Dedicated Bulldozer blade and track slip anomaly detection |
| `POST` | `/ml/anomaly/loader` | ML | **[NEW]** Dedicated Wheel Loader bucket and transmission anomaly detection |
| `GET` | `/ml/status` | ML | Model registry status, loaded framework info, and baseline metrics |
| `POST` | `/ml/predict` | ML | Legacy task duration prediction |
| `POST` | `/ml/train` | ML | Re-trains Random Forest model on task history |
| `GET` | `/ml/metrics` | ML | Returns MAE & RMSE estimation accuracy metrics |

---

## 🧪 Verification Testing
Run the automated test suite:
```bash
python test_api.py
```
Outputs complete test results with 100% pass verification across all 11 subsystems.
