import logging
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
from typing import Generator, Optional, Any, List, Dict

from app.config import settings

logger = logging.getLogger("catalyst.database")

_pool: Optional[pool.ThreadedConnectionPool] = None


def get_connection_pool() -> pool.ThreadedConnectionPool:
    global _pool
    if _pool is None or _pool.closed:
        logger.info(f"Initializing PostgreSQL ThreadedConnectionPool -> {settings.db_host}:{settings.db_port}/{settings.db_name}")
        _pool = pool.ThreadedConnectionPool(
            minconn=settings.db_pool_min,
            maxconn=settings.db_pool_max,
            host=settings.db_host,
            port=settings.db_port,
            dbname=settings.db_name,
            user=settings.db_user,
            password=settings.db_password,
            sslmode=settings.db_sslmode,
            connect_timeout=10,
        )
    return _pool


@contextmanager
def get_db_cursor(commit: bool = False) -> Generator[RealDictCursor, None, None]:
    """Context manager for acquiring a database connection and returning a RealDictCursor."""
    p = get_connection_pool()
    conn = p.getconn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            yield cur
            if commit:
                conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Database error: {e}")
        raise
    finally:
        p.putconn(conn)


def execute_query(
    sql: str,
    params: Optional[tuple] = None,
    commit: bool = False,
    fetchone: bool = False,
    fetchall: bool = True,
) -> Any:
    """Helper function to execute parameterized queries cleanly."""
    # Determine whether statement modifies data
    sql_strip = sql.strip().upper()
    needs_commit = commit or sql_strip.startswith("INSERT") or sql_strip.startswith("UPDATE") or sql_strip.startswith("DELETE")

    with get_db_cursor(commit=needs_commit) as cur:
        cur.execute(sql, params or ())
        if fetchone:
            return cur.fetchone()
        if fetchall and (sql_strip.startswith("SELECT") or "RETURNING" in sql_strip):
            return cur.fetchall()
        return None


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'operator',
  pin_hash VARCHAR(100),
  skill_level VARCHAR(50) DEFAULT 'intermediate',
  active_machine_id VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS machines (
  id VARCHAR(50) PRIMARY KEY,
  model VARCHAR(150) NOT NULL,
  serial_number VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  operating_hours REAL DEFAULT 0.0,
  health_score INTEGER DEFAULT 95,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  type VARCHAR(100) NOT NULL,
  zone VARCHAR(100),
  priority VARCHAR(50) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'pending',
  assigned_to VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  machine_id VARCHAR(50) REFERENCES machines(id) ON DELETE SET NULL,
  estimated_minutes REAL DEFAULT 45.0,
  actual_minutes REAL,
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  checklist JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_history (
  id SERIAL PRIMARY KEY,
  task_id VARCHAR(50),
  task_type VARCHAR(100) NOT NULL,
  operator_id VARCHAR(50),
  machine_id VARCHAR(50),
  estimated_minutes REAL NOT NULL,
  actual_minutes REAL NOT NULL,
  error_minutes REAL NOT NULL,
  weather_condition VARCHAR(50) DEFAULT 'clear',
  operator_skill VARCHAR(50) DEFAULT 'intermediate',
  machine_age_years REAL DEFAULT 2.0,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS safety_rules (
  id VARCHAR(100) PRIMARY KEY,
  rule_type VARCHAR(100) NOT NULL,
  threshold REAL NOT NULL,
  comparison VARCHAR(20) NOT NULL,
  duration_seconds INTEGER DEFAULT 0,
  severity VARCHAR(50) DEFAULT 'warning',
  action VARCHAR(50) DEFAULT 'alert',
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS alerts (
  id VARCHAR(100) PRIMARY KEY,
  machine_id VARCHAR(50) NOT NULL,
  operator_id VARCHAR(50),
  rule_id VARCHAR(100),
  severity VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telemetry (
  id VARCHAR(100) PRIMARY KEY,
  machine_id VARCHAR(50) NOT NULL,
  operator_id VARCHAR(50),
  engine_rpm REAL,
  fuel_rate REAL,
  hydraulic_pressure REAL,
  engine_temp REAL,
  speed REAL,
  odometer REAL,
  latitude REAL,
  longitude REAL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incidents (
  id VARCHAR(100) PRIMARY KEY,
  incident_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(50) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'open',
  reported_by VARCHAR(50) NOT NULL,
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  machine_id VARCHAR(50),
  task_id VARCHAR(50),
  photos JSONB DEFAULT '[]'::jsonb,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS training_content (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  format VARCHAR(50) DEFAULT 'video',
  url TEXT,
  content TEXT
);

CREATE TABLE IF NOT EXISTS operator_training (
  id SERIAL PRIMARY KEY,
  operator_id VARCHAR(50) NOT NULL,
  content_id VARCHAR(100) NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  score REAL DEFAULT 100.0,
  UNIQUE (operator_id, content_id)
);

CREATE TABLE IF NOT EXISTS anomalies (
  id VARCHAR(100) PRIMARY KEY,
  machine_id VARCHAR(50) NOT NULL,
  anomaly_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_machine ON telemetry(machine_id);
CREATE INDEX IF NOT EXISTS idx_alerts_machine ON alerts(machine_id);
CREATE INDEX IF NOT EXISTS idx_incidents_machine ON incidents(machine_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_history_type ON task_history(task_type);
"""


# Additive columns for tables that already exist in the shared DB (CREATE TABLE IF NOT EXISTS won't add them).
# `source` is 'live' or 'simulation' so demo-stream rows can be filtered out or cleaned up.
MIGRATIONS_SQL = """
ALTER TABLE telemetry ADD COLUMN IF NOT EXISTS seatbelt_fastened BOOLEAN;
ALTER TABLE telemetry ADD COLUMN IF NOT EXISTS proximity_m REAL;
ALTER TABLE telemetry ADD COLUMN IF NOT EXISTS features JSONB;
ALTER TABLE telemetry ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'live';
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'live';
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'live';
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS alert_id VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_telemetry_machine_time ON telemetry(machine_id, recorded_at DESC);
"""


def init_db():
    """Ensure all required tables and indexes exist without dropping existing data."""
    with get_db_cursor(commit=True) as cur:
        cur.execute(SCHEMA_SQL)
        cur.execute(MIGRATIONS_SQL)
    logger.info("Verified all PostgreSQL tables exist in Supabase.")


def reset_db():
    """Drop and re-create all tables cleanly."""
    drop_sql = """
    DROP TABLE IF EXISTS anomalies CASCADE;
    DROP TABLE IF EXISTS operator_training CASCADE;
    DROP TABLE IF EXISTS training_content CASCADE;
    DROP TABLE IF EXISTS incidents CASCADE;
    DROP TABLE IF EXISTS alerts CASCADE;
    DROP TABLE IF EXISTS safety_rules CASCADE;
    DROP TABLE IF EXISTS telemetry CASCADE;
    DROP TABLE IF EXISTS task_history CASCADE;
    DROP TABLE IF EXISTS tasks CASCADE;
    DROP TABLE IF EXISTS machines CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    """
    with get_db_cursor(commit=True) as cur:
        cur.execute(drop_sql)
        cur.execute(SCHEMA_SQL)
        cur.execute(MIGRATIONS_SQL)
    logger.info("PostgreSQL schema reset successfully in Supabase.")


def check_db_connection() -> bool:
    try:
        with get_db_cursor() as cur:
            cur.execute("SELECT 1")
        return True
    except Exception:
        return False


def close_pool():
    global _pool
    if _pool and not _pool.closed:
        _pool.closeall()
        logger.info("PostgreSQL connection pool closed.")
