import sys
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def run_tests():
    print("========================================")
    print("CATALYST FASTAPI BACKEND VERIFICATION")
    print("========================================")

    # 1. Health check
    print("\n[1] Testing /health and / ...")
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health = res.json()
    print(" Health response:", health)
    assert health["status"] == "healthy"
    assert health["database"] == "connected"

    res_root = client.get("/")
    assert res_root.status_code == 200
    print(" Root response:", res_root.json())

    # 2. Authentication
    print("\n[2] Testing POST /auth/login and GET /auth/me ...")
    login_payload = {"operatorId": "OP-4412", "password": "4412"}
    res = client.post("/auth/login", json=login_payload)
    assert res.status_code == 200, f"Login failed: {res.text}"
    auth_data = res.json()
    token = auth_data["token"]
    print(" Login successful for:", auth_data["operator"]["name"])
    print(" Token acquired (length):", len(token))

    headers = {"Authorization": f"Bearer {token}"}
    res_me = client.get("/auth/me", headers=headers)
    assert res_me.status_code == 200
    assert res_me.json()["id"] == "OP-4412"
    print(" GET /auth/me verified:", res_me.json()["name"])

    # 3. Tasks
    print("\n[3] Testing Task Workflows ...")
    res_tasks = client.get("/tasks/today", headers=headers)
    assert res_tasks.status_code == 200
    tasks = res_tasks.json()
    print(f" Retrieved {len(tasks)} tasks for OP-4412")
    assert len(tasks) > 0

    # Start T001
    res_start = client.post("/tasks/T001/start", headers=headers)
    assert res_start.status_code == 200
    assert res_start.json()["task"]["status"] == "in_progress"
    print(" Task T001 started successfully.")

    # 4. Telemetry Ingestion & Safety Rule Verification
    print("\n[4] Testing Telemetry Ingestion & Safety Alerts ...")
    # Ingest over-temp telemetry (108 °C > 105 °C threshold -> triggers critical alarm)
    tel_payload = {
        "machineId": "CAT-320-01",
        "operatorId": "OP-4412",
        "engineRpm": 1850.0,
        "fuelRate": 22.0,
        "hydraulicPressure": 310.0,
        "engineTemp": 108.0,
        "speed": 0.0,
        "odometer": 14210.0,
        "latitude": 37.7749,
        "longitude": -122.4194
    }
    res_tel = client.post("/telemetry", json=tel_payload)
    assert res_tel.status_code == 200
    tel_res = res_tel.json()
    print(" Telemetry ingested:", tel_res["telemetryId"])
    print(f" Alerts triggered: {len(tel_res['alertsTriggered'])}")
    print(f" Anomalies detected: {len(tel_res['anomaliesDetected'])}")
    assert len(tel_res["alertsTriggered"]) > 0, "Expected over-temp rule to trigger an alert"

    alert_id = tel_res["alertsTriggered"][0]["id"]

    # 5. Safety Alerts and Acknowledgement
    print("\n[5] Testing Safety Alerts & Acknowledgement ...")
    res_alerts = client.get("/safety/alerts", headers=headers)
    assert res_alerts.status_code == 200
    alerts_list = res_alerts.json()
    print(f" Total safety alerts in DB: {len(alerts_list)}")

    res_ack = client.post(f"/safety/alerts/{alert_id}/ack", headers=headers)
    assert res_ack.status_code == 200
    assert res_ack.json()["success"] is True
    print(f" Alert {alert_id} acknowledged successfully.")

    # Safety Rules
    res_rules = client.get("/safety/rules", headers=headers)
    assert res_rules.status_code == 200
    print(f" Active safety rules in DB: {len(res_rules.json())}")

    # 6. Incidents
    print("\n[6] Testing Incidents Logging & Resolution ...")
    inc_payload = {
        "incidentType": "hydraulic_leak",
        "description": "Minor hydraulic fitting weep on main boom cylinder hose.",
        "severity": "low",
        "machineId": "CAT-320-01",
        "taskId": "T001"
    }
    res_inc = client.post("/incidents", json=inc_payload, headers=headers)
    assert res_inc.status_code == 200
    new_inc = res_inc.json()
    inc_id = new_inc["id"]
    print(" Incident logged:", inc_id)

    res_resolve = client.patch(
        f"/incidents/{inc_id}",
        json={"status": "resolved", "resolutionNotes": "Hose fitting torqued to spec. Leak resolved."},
        headers=headers
    )
    assert res_resolve.status_code == 200
    assert res_resolve.json()["status"] == "resolved"
    print(" Incident marked resolved.")

    # 7. Training Hub
    print("\n[7] Testing Training Content & Recommendations ...")
    res_content = client.get("/training/content", headers=headers)
    assert res_content.status_code == 200
    print(f" Available training modules: {len(res_content.json())}")

    res_rec = client.get("/training/recommendations", headers=headers)
    assert res_rec.status_code == 200
    recs = res_rec.json()["recommendations"]
    print(f" Adaptive recommendations for OP-4412: {len(recs)}")
    if recs:
        target_mod = recs[0]["contentId"]
        res_comp = client.post(f"/training/{target_mod}/complete", headers=headers)
        assert res_comp.status_code == 200
        print(f" Completed module {target_mod}")

    # 8. Machine Insights & Anomaly
    print("\n[8] Testing Machine Predictive Insights ...")
    res_insights = client.get("/machines/CAT-320-01/insights", headers=headers)
    assert res_insights.status_code == 200
    insights = res_insights.json()
    print(" Machine Health Score:", insights["healthScore"])
    print(" Detected anomalies count:", len(insights["anomalies"]))
    print(" Recommendations count:", len(insights["recommendations"]))

    # 9. Task Completion (TC-09)
    print("\n[9] Completing Task T001 (Actual = 58 min, Estimated = 60 min) ...")
    res_done = client.post(
        "/tasks/T001/complete",
        json={"actualMinutes": 58.0, "notes": "Completed utility trench on time with zero incidents."},
        headers=headers
    )
    assert res_done.status_code == 200
    done_task = res_done.json()["task"]
    assert done_task["status"] == "completed"
    assert done_task["actualMinutes"] == 58.0
    print(" Task T001 completed successfully. Error recorded.")

    # 10. Machine Learning & Estimation Validation (TEST_PLAN §4)
    print("\n[10] Testing ML Prediction, Model Training & Accuracy Metrics ...")
    pred_payload = {
        "taskType": "trenching",
        "weatherCondition": "sunny",
        "operatorSkill": "expert",
        "machineAgeYears": 2.0
    }
    res_pred = client.post("/ml/predict", json=pred_payload, headers=headers)
    assert res_pred.status_code == 200
    pred_data = res_pred.json()
    print(" ML Legacy Predict Output:", pred_data)
    assert pred_data["predictedMinutes"] > 0

    # Train ML model
    res_train = client.post("/ml/train", headers=headers)
    assert res_train.status_code == 200
    train_data = res_train.json()
    print(" ML Train Output:", train_data)

    # Check ML Metrics
    res_metrics = client.get("/ml/metrics", headers=headers)
    assert res_metrics.status_code == 200
    metrics = res_metrics.json()
    print(" Current Estimation Metrics:", metrics)
    print(f" Target MAE: {metrics['targetMae']} | Computed MAE: {metrics['mae']}")
    print(f" Target RMSE: {metrics['targetRmse']} | Computed RMSE: {metrics['rmse']}")
    print(f" Total Task History Samples: {metrics['sampleCount']}")

    # 11. New MLOps Integrated Endpoints (CatBoost & Multi-Machine Random Forest)
    print("\n[11] Testing Integrated Production ML Endpoints ...")
    
    # 11a. CatBoost Task Duration Estimation
    print(" -> Testing POST /ml/task-time/predict (CatBoost Regressor R²=0.92) ...")
    task_time_req = {
        "taskType": "Trenching",
        "machineType": "Excavator",
        "estimatedMinutes": 75.0,
        "weatherCondition": "Rain",
        "operatorSkill": "Beginner",
        "machineAgeYears": 4.5,
        "operatorFatigueLevel": 4.0,
        "taskVolume": 150.0,
        "loadWeightTons": 14.0,
        "travelDistanceMeters": 60.0,
        "siteTerrain": "Rough",
        "siteCondition": "Muddy"
    }
    res_tt = client.post("/ml/task-time/predict", json=task_time_req, headers=headers)
    assert res_tt.status_code == 200, f"Task time predict failed: {res_tt.text}"
    tt_data = res_tt.json()
    print(f"    Predicted: {tt_data['predictedMinutes']} min (Baseline: {tt_data['estimatedBaselineMinutes']} min)")
    print(f"    Confidence: {tt_data['confidenceLabel']} | Risk: {tt_data['riskAssessment']}")
    assert tt_data["predictedMinutes"] > 0
    assert tt_data["modelType"] == "catboost_regressor"

    # 11b. Task contextual estimation
    print(" -> Testing POST /tasks/T002/estimate (Task contextual ML estimation) ...")
    res_task_est = client.post("/tasks/T002/estimate", json={"weatherCondition": "Sunny"}, headers=headers)
    assert res_task_est.status_code == 200, f"Task estimate failed: {res_task_est.text}"
    task_est = res_task_est.json()
    print(f"    Task T002 estimated duration: {task_est['predictedMinutes']} min")

    # 11c. Unified Anomaly Detection - Excavator
    print(" -> Testing POST /ml/anomaly/predict (Excavator Anomaly Detection) ...")
    exc_anomaly_req = {
        "machine_type": "excavator",
        "context": {
            "machine_id": "CAT-320-01",
            "task_type": "excavation",
            "soil_type": "rocky",
            "ground_condition": "rough"
        },
        "telemetry": {
            "engine_rpm": 2100.0,
            "engine_temp": 104.0,
            "hydraulic_pressure_bar": 340.0,
            "hydraulic_oil_temperature_c": 92.0,
            "boom_movement_rate": 42.0,
            "vibration_level": 4.5
        },
        "machine_context": {
            "machine_hours": 4200.0,
            "maintenance_due_days": 3.0
        }
    }
    res_anom_exc = client.post("/ml/anomaly/predict", json=exc_anomaly_req, headers=headers)
    assert res_anom_exc.status_code == 200
    exc_anom_data = res_anom_exc.json()
    print(f"    Excavator Prediction: {exc_anom_data['prediction']} (isAnomaly: {exc_anom_data['isAnomaly']})")
    print(f"    Action: {exc_anom_data['recommendedAction']}")
    assert "classProbabilities" in exc_anom_data

    # 11d. Bulldozer Anomaly Detection
    print(" -> Testing POST /ml/anomaly/bulldozer (Bulldozer Track & Blade Stress) ...")
    dozer_anomaly_req = {
        "machine_type": "bulldozer",
        "context": {"machine_id": "CAT-D6-03", "task_type": "dozing"},
        "telemetry": {
            "blade_load_pct": 95.0,
            "blade_angle_deg": 18.0,
            "drawbar_load_pct": 90.0,
            "track_slip_pct": 24.0,
            "engine_rpm": 2150.0,
            "engine_temp": 98.0
        }
    }
    res_anom_dozer = client.post("/ml/anomaly/bulldozer", json=dozer_anomaly_req, headers=headers)
    assert res_anom_dozer.status_code == 200
    dozer_anom_data = res_anom_dozer.json()
    print(f"    Bulldozer Prediction: {dozer_anom_data['prediction']} ({dozer_anom_data['confidencePercent']}%)")

    # 11e. Wheel Loader Anomaly Detection
    print(" -> Testing POST /ml/anomaly/loader (Wheel Loader Transmission & Bucket) ...")
    loader_anomaly_req = {
        "machine_type": "wheel_loader",
        "context": {"machine_id": "CAT-950-02", "task_type": "loading"},
        "telemetry": {
            "bucket_load_pct": 98.0,
            "lift_height_m": 3.2,
            "transmission_temperature_c": 110.0,
            "braking_intensity": 0.85
        }
    }
    res_anom_loader = client.post("/ml/anomaly/loader", json=loader_anomaly_req, headers=headers)
    assert res_anom_loader.status_code == 200
    loader_anom_data = res_anom_loader.json()
    print(f"    Loader Prediction: {loader_anom_data['prediction']} ({loader_anom_data['confidencePercent']}%)")

    # 11f. Comprehensive ML Status
    print(" -> Testing GET /ml/status (Multi-Model Registry Health) ...")
    res_status = client.get("/ml/status", headers=headers)
    assert res_status.status_code == 200
    status_data = res_status.json()
    print("    Registry Models:")
    for mname, minfo in status_data["models"].items():
        print(f"      - {mname}: loaded={minfo.get('loaded')}, framework={minfo.get('framework')}")
        assert minfo.get("loaded") is True

    # 12. Supervisor Analytics (TC-10)
    print("\n[12] Testing GET /analytics/supervisor ...")
    res_analytics = client.get("/analytics/supervisor", headers=headers)
    assert res_analytics.status_code == 200
    analytics = res_analytics.json()
    print(" Fleet Overview:", analytics["fleet"])
    print(" Tasks Overview:", analytics["tasks"])
    print(" Safety Alerts Overview:", analytics["safetyAlerts"])
    print(" Estimation Metrics in Analytics:", analytics["estimationMetrics"])

    print("\n========================================")
    print(" ALL 12 TEST PHASES PASSED WITH 100% SUCCESS!")
    print("========================================")


if __name__ == "__main__":
    run_tests()
