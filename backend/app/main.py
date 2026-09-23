from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import init_db, check_db_connection
from app.inference.estimator import estimator_instance
from app.seed import seed_database
from app.routers import (
    auth,
    tasks,
    telemetry,
    safety,
    incidents,
    training,
    anomaly,
    analytics,
    ml,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    try:
        init_db()
        print("[Startup] Database initialized successfully.")
    except Exception as e:
        print(f"[Startup Warning] Database initialization failed: {e}")

    # Initialize ML estimator
    try:
        res = estimator_instance.train_ml_model()
        print(f"[Startup] ML Estimator status: {res}")
    except Exception as e:
        print(f"[Startup Warning] ML Estimator initialization: {e}")

    yield
    print("[Shutdown] Application stopping...")


app = FastAPI(
    title="CATALYST Heavy Machinery Co-Pilot API",
    description="Intelligent Assistant for CAT Heavy Equipment Operators, Safety, and Supervisors",
    version="2.0.0",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(telemetry.router)
app.include_router(safety.router)
app.include_router(incidents.router)
app.include_router(training.router)
app.include_router(anomaly.router)
app.include_router(analytics.router)
app.include_router(ml.router)


@app.get("/health")
def health_check():
    db_connected = check_db_connection()
    return {
        "status": "healthy" if db_connected else "degraded",
        "service": "catalyst-fastapi-backend",
        "version": "2.0.0",
        "database": "connected" if db_connected else "disconnected",
        "mlModelStatus": "trained" if estimator_instance.is_trained else "heuristic_fallback"
    }


@app.post("/seed")
def trigger_seed():
    try:
        seed_database()
        estimator_instance.train_ml_model()
        return {"success": True, "message": "Database and ML model seeded successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Seed failed: {str(e)}")


@app.get("/")
def root():
    return {
        "name": "CATALYST Backend API",
        "version": "2.0.0",
        "framework": "FastAPI (Python 3.11)",
        "docs": "/docs",
        "health": "/health"
    }
