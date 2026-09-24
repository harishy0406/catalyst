import json
from app.database import execute_query, reset_db


def seed_database():
    print("Resetting database tables...")
    reset_db()

    print("Seeding Users...")
    users = [
        ("OP-4412", "Arjun Mehta", "operator", "4412", "expert", "CAT-320-01"),
        ("OP-8821", "Priya Sharma", "operator", "8821", "intermediate", "CAT-950-02"),
        ("SUP-101", "Vikram Singh", "supervisor", "1001", "expert", None),
        ("SAFE-201", "Ananya Iyer", "safety_officer", "2001", "expert", None),
    ]
    for u in users:
        execute_query(
            """INSERT INTO users (id, name, role, pin_hash, skill_level, active_machine_id)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            u
        )

    print("Seeding Machines...")
    machines = [
        ("CAT-320-01", "CAT 320 Hydraulic Excavator", "CAT0320VANC01", "active", 1420.5, 94),
        ("CAT-950-02", "CAT 950M Wheel Loader", "CAT0950LOAD02", "active", 2150.0, 88),
        ("CAT-D6-03", "CAT D6 Track-Type Tractor", "CAT00D6DOZR03", "maintenance", 3410.2, 76),
    ]
    for m in machines:
        execute_query(
            """INSERT INTO machines (id, model, serial_number, status, operating_hours, health_score)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            m
        )

    print("Seeding Tasks...")
    t1_chk = json.dumps([
        {"id": "c1", "text": "Inspect trench shoring and side slopes", "completed": False},
        {"id": "c2", "text": "Verify utility locate markers along North boundary", "completed": False},
        {"id": "c3", "text": "Check Grade Control laser reference", "completed": False},
    ])
    t2_chk = json.dumps([
        {"id": "c1", "text": "Bucket tooth inspection", "completed": False},
        {"id": "c2", "text": "Scale sensor zero calibration", "completed": False},
    ])

    tasks = [
        ("T001", "Trenching North Utility Trench", "Excavate 45m conduit corridor to 1.8m grade depth.", "trenching", "Zone A - Sector 3", "high", "pending", "OP-4412", "CAT-320-01", 60.0, None, t1_chk),
        ("T002", "Truck Loading Zone B", "Load haulers with aggregate stockpile material.", "loading", "Zone B - Stockpile", "medium", "pending", "OP-8821", "CAT-950-02", 45.0, None, t2_chk),
        # Every task's type must be one its machine can do (app/machine_types.py → TASKS_BY_MACHINE)
        ("T003", "Stormwater Drain Trench Pad 4", "Excavate 30m stormwater drain trench along Pad 4 to 1.2m depth.", "trenching", "Pad 4 South", "low", "pending", "OP-4412", "CAT-320-01", 30.0, None, "[]"),
        ("T004", "Stockpile Loading Zone C", "Load haul trucks from the gravel stockpile for Zone A backfill.", "loading", "Zone C - Stockpile", "high", "pending", "OP-8821", "CAT-950-02", 35.0, None, "[]"),
        ("T005", "Bulk Excavation Retention Basin", "Bulk earth movement for stormwater pond.", "bulk_excavation", "Zone C Basin", "medium", "pending", "OP-4412", "CAT-320-01", 90.0, None, "[]"),
    ]
    for t in tasks:
        execute_query(
            """INSERT INTO tasks (id, title, description, type, zone, priority, status, assigned_to, machine_id, estimated_minutes, actual_minutes, checklist)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            t
        )

    print("Seeding Task History (Canonical Benchmark Dataset from TEST_PLAN.md)...")
    history_records = [
        ("T001-HIST", "trenching", "OP-4412", "CAT-320-01", 60.0, 58.0, -2.0, "sunny", "expert", 2.0),
        ("T002-HIST", "loading", "OP-8821", "CAT-950-02", 45.0, 52.0, 7.0, "rainy", "intermediate", 3.5),
        ("T003-HIST", "grading", "OP-4412", "CAT-320-01", 30.0, 42.0, 12.0, "sunny", "beginner", 2.0),
        ("T004-HIST", "pipe_laying", "OP-8821", "CAT-950-02", 35.0, 33.0, -2.0, "clear", "expert", 1.5),
        ("T005-HIST", "bulk_excavation", "OP-4412", "CAT-320-01", 90.0, 105.0, 15.0, "rainy", "intermediate", 5.0),
    ]
    for h in history_records:
        execute_query(
            """INSERT INTO task_history
               (task_id, task_type, operator_id, machine_id, estimated_minutes, actual_minutes,
                error_minutes, weather_condition, operator_skill, machine_age_years)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            h
        )

    print("Seeding Safety Rules...")
    safety_rules = [
        ("RULE-TEMP-01", "engine_temp", 105.0, "gt", 10, "critical", "alarm"),
        ("RULE-PRESS-02", "hydraulic_pressure", 340.0, "gt", 5, "warning", "alert"),
        ("RULE-SPD-03", "speed", 25.0, "gt", 3, "warning", "alert"),
        ("RULE-IDLE-04", "idling", 45.0, "gt", 2700, "info", "log"),
    ]
    for sr in safety_rules:
        execute_query(
            """INSERT INTO safety_rules (id, rule_type, threshold, comparison, duration_seconds, severity, action, is_active)
               VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE)""",
            sr
        )

    print("Seeding Training Content...")
    trainings = [
        ("TRN-001", "CAT 320 Pre-Operational Inspection & Safety Walkaround", "Safety", 15, "video", "https://cat.com/training/320-walkaround", "Step-by-step visual pre-op checklist covering track tension, fluid levels, and emergency cutoff switches."),
        ("TRN-002", "Optimizing Hydraulic Efficiency in Deep Trenching", "Efficiency", 20, "interactive", "https://cat.com/training/hydraulic-efficiency", "Interactive simulation on boom and stick hydraulic flow sharing to reduce fuel consumption."),
        ("TRN-003", "Eco-Mode Throttle Management & Idle Reduction", "Eco", 10, "video", "https://cat.com/training/eco-mode", "Best practices for utilizing automatic engine speed control (AEC) and idle shutdown timers."),
        ("TRN-004", "Grade Control 2D System Quick Calibration", "Technical", 25, "pdf", "https://cat.com/training/grade-control", "Reference handbook on referencing bench marks and setting grade offset tolerances."),
    ]
    for tr in trainings:
        execute_query(
            """INSERT INTO training_content (id, title, category, duration_minutes, format, url, content)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            tr
        )

    print("Seeding Completed Training for OP-4412...")
    execute_query(
        """INSERT INTO operator_training (operator_id, content_id, completed_at, score)
           VALUES ('OP-4412', 'TRN-001', NOW(), 100)"""
    )

    print("Seeding Baseline Telemetry...")
    telemetries = [
        ("TEL-INIT-01", "CAT-320-01", "OP-4412", 1750.0, 18.5, 290.0, 88.0, 4.2, 14205.0, 37.7749, -122.4194),
        ("TEL-INIT-02", "CAT-950-02", "OP-8821", 1620.0, 14.2, 260.0, 85.0, 12.0, 21500.0, 37.7752, -122.4188),
    ]
    for tel in telemetries:
        execute_query(
            """INSERT INTO telemetry
               (id, machine_id, operator_id, engine_rpm, fuel_rate, hydraulic_pressure, engine_temp, speed, odometer, latitude, longitude, recorded_at)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())""",
            tel
        )

    print("Seeding Sample Incidents...")
    execute_query(
        """INSERT INTO incidents (id, incident_type, description, severity, status, reported_by, reported_at, machine_id, task_id, photos)
           VALUES ('INC-001', 'near_miss', 'Ground worker stepped inside swing radius during bucket slewing.', 'medium', 'open', 'OP-4412', NOW(), 'CAT-320-01', 'T001', '[]')"""
    )

    print("Database seeding completed successfully!")


if __name__ == "__main__":
    seed_database()
