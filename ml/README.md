# Catalyst Machine Learning Subsystem (MLOps Architecture)

This directory contains the production and offline Machine Learning assets for the **Catalyst Intelligent Construction Fleet Management System**.

---

## 📁 Directory Structure

```
ml/
├── datasets/
│   ├── anomaly/
│   │   ├── excavator_dataset_50k.csv      # 50,000 telemetry samples for Excavator anomaly training
│   │   ├── bulldozer_dataset_50k.csv      # 50,000 telemetry samples for Bulldozer anomaly training
│   │   └── loader_dataset_50k.csv         # 50,000 telemetry samples for Wheel Loader anomaly training
│   └── task_time/
│       └── task_time_dataset.csv          # 2,000 task execution records with environmental telemetry
├── models/
│   ├── excavator_anomaly_model.pkl        # Random Forest multi-class model (9 classes, 25 features)
│   ├── bulldozer_anomaly_model.pkl        # Random Forest multi-class model (9 classes, 24 features)
│   ├── loader_anomaly_model.pkl           # Random Forest multi-class model (9 classes, 28 features)
│   └── task_time_catboost.pkl             # CatBoost Regressor (17 features, R² = 0.92)
├── notebooks/
│   └── time_estimation.ipynb              # Exploratory data analysis & CatBoost model hyperparameter search
├── pipelines/
│   ├── anomaly/
│   │   ├── excavator_predictor.py         # Offline feature preprocessing & standalone testing
│   │   ├── bulldozer_predictor.py
│   │   ├── loader_predictor.py
│   │   ├── test_excavator.py
│   │   ├── test_bulldozer.py
│   │   └── test_loader.py
│   └── task_time/
│       └── README.md                      # Task time training documentation & feature definitions
├── requirements.txt                       # Training and evaluation dependencies
└── README.md                              # Subsystem architecture reference
```

---

## 🤖 Models & Specifications

### 1. Task Completion Time Estimator
- **Architecture**: CatBoost Regressor (`catboost.CatBoostRegressor`)
- **Trained Samples**: 2,000 historical construction tasks across 3 equipment types
- **Evaluation Metric**: $R^2 = 0.92$, $MAE = 4.2 \text{ min}$, $RMSE = 5.8 \text{ min}$
- **Feature Set (17 features)**:
  - `Machine_Type`, `Machine_Age_yrs`, `Machine_Maintenance_Status`
  - `Operator_Skill`, `Operator_Fatigue_Level`
  - `Task_Type`, `Task_Volume`, `Load_Weight_tons`, `Travel_Distance_m`
  - `Site_Terrain`, `Site_Condition`
  - `Weather`, `Temperature_C`, `Humidity_Percent`, `Visibility`
  - `Shift_Time`, `Estimated_Time_min`
- **Output**: Calibrated completion duration, scheduled deviation %, confidence score, and schedule risk assessment (`On Schedule`, `Delayed`, `Accelerated`).

### 2. Multi-Class Anomaly Detection
- **Architecture**: Scikit-Learn `RandomForestClassifier` (100 estimators, balanced class weights)
- **Trained Samples**: 50,000 synthetic high-fidelity telemetry samples per machine class
- **Classes per Machine Type (9 classes each)**:
  - **Excavator**: `Normal`, `Excessive_Idling`, `Hydraulic_Stress`, `Engine_Overheating`, `Aggressive_Boom_Movement`, `Excessive_Swing_Speed`, `Bucket_Overloading`, `Abnormal_Vibration`, `Low_Excavation_Productivity`
  - **Bulldozer**: `Normal`, `Blade_Overloading`, `Engine_Overheating`, `Excessive_Dozing_Depth`, `Excessive_Idling`, `Hydraulic_Stress`, `Poor_Grading_Performance`, `Track_Slip`, `Uneven_Track_Speed`
  - **Wheel Loader**: `Normal`, `Aggressive_Acceleration`, `Bucket_Overloading`, `Excessive_Idling`, `Excessive_Tire_Slip`, `Harsh_Braking`, `Hydraulic_Stress`, `Inefficient_Loading_Cycle`, `Transmission_Overheating`
- **Output**: Multi-class probability distribution, primary classification label, operational explanation, and prescriptive maintenance action.

---

## ⚡ Backend Serving Architecture

For microsecond production inference and container portability:
1. Model binaries are mirrored into `backend/app/ml/models/` for self-contained server execution.
2. In-memory model caching is managed by the thread-safe `ModelRegistry` singleton (`backend/app/ml/registry.py`).
3. Services (`TaskTimeService`, `AnomalyService`) perform schema alignment, default imputation, and error boundary handling with fallback protection.
4. Exposes REST endpoints on FastAPI:
   - `POST /ml/task-time/predict`
   - `POST /ml/anomaly/predict`
   - `POST /ml/anomaly/{excavator|bulldozer|loader}`
   - `GET /ml/status`
   - `POST /tasks/{task_id}/estimate`
   - Auto-evaluation during `POST /telemetry` and `GET /machines/{id}/insights`.
