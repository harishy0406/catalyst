# Wheel Loader Anomaly Detection Model

## 1. Overview

The **Wheel Loader Anomaly Detection Model** is the machine-learning component of the **CAT Smart Operator Assistant**.

The purpose of this model is to identify unusual wheel loader operating behavior using machine telemetry, operating conditions, and operator/machine context.

The model predicts one of **9 operating states**:

1. Normal
2. Excessive Idling
3. Bucket Overloading
4. Excessive Tire Slip
5. Aggressive Acceleration
6. Harsh Braking
7. Transmission Overheating
8. Hydraulic Stress
9. Inefficient Loading Cycle

The model is designed for prototype/hackathon development.

> **Important:** The dataset used for training is synthetic. It does not represent real CAT telemetry, validated CAT operating limits, or certified safety thresholds.

---

# 2. Model Information

| Property          | Value                    |
| ----------------- | ------------------------ |
| Machine           | Wheel Loader             |
| Dataset           | `loader_dataset_50k.csv` |
| Dataset size      | 50,000 records           |
| Training records  | 40,000                   |
| Testing records   | 10,000                   |
| Algorithm         | Random Forest Classifier |
| Target            | `anomaly_type`           |
| Number of classes | 9                        |
| Train/Test split  | 80/20                    |
| Random state      | 42                       |
| Test accuracy     | ~99.96%                  |
| Macro F1-score    | ~99.91%                  |

The high performance is expected because the synthetic dataset was generated using correlated telemetry patterns for the different anomaly types.

The reported accuracy should **not** be interpreted as real-world CAT machine performance.

---

# 3. Project Files

Recommended project structure:

```text
CAT_Anomaly_Model/loader
│
├── loader_anomaly_model.pkl
├── loader_predictor.py
├── test_loader.py
└── README.md
```

### `loader_anomaly_model.pkl`

Contains:

* Trained Random Forest model
* Preprocessing pipeline
* Expected feature names
* Numerical feature information
* Categorical feature information
* Class names
* Training/test metadata

The backend should load this file rather than retraining the model.

### `loader_predictor.py`

Acts as the adapter between the backend and the trained ML model.

It:

1. Receives structured wheel loader telemetry.
2. Extracts contextual information.
3. Converts the input into the format expected by the model.
4. Maintains the correct feature order.
5. Runs the trained Random Forest.
6. Calculates confidence.
7. Generates a human-readable message.
8. Returns the final prediction response.

---

# 4. Prediction Architecture

```text
Backend Input
      |
      v
machine_input
      |
      v
transform_input()
      |
      v
Model-Specific DataFrame
      |
      v
Random Forest Model
      |
      +-------------------------+
      |                         |
      v                         v
Prediction                Probabilities
      |                         |
      v                         v
Anomaly Type              Confidence
      |
      v
Human-readable Message
      |
      v
Final Prediction Output
```

---

# 5. Input Format

The predictor expects the following structure:

```python
machine_input = {

    "machine_type": "wheel_loader",

    "context": {
        "machine_id": "WL-1024",
        "operator_id": "OP-204",
        "timestamp": "2026-09-23T16:30:00",

        "task_type": "loading",
        "material_type": "sand",
        "ground_condition": "dry"
    },

    "telemetry": {

        "engine_rpm": 1800,
        "engine_temperature_c": 82,
        "transmission_temperature_c": 76,

        "hydraulic_pressure_bar": 240,
        "hydraulic_oil_temperature_c": 70,

        "fuel_rate_lph": 16.5,
        "fuel_level_pct": 62,

        "vehicle_speed_kmh": 8.5,
        "idle_duration_min": 2,

        "bucket_load_pct": 72,
        "bucket_fill_ratio_pct": 80,
        "lift_height_m": 3.2,

        "forward_speed_kmh": 8.5,
        "reverse_speed_kmh": 4.0,

        "acceleration_mps2": 1.2,
        "braking_intensity": 0.3,

        "loading_cycles_per_hour": 22,
        "cycle_time_sec": 165,

        "tire_slip_pct": 4,

        "vibration_level": 1.7,

        "slope_deg": 3,
        "ambient_temperature_c": 31
    },

    "machine_context": {

        "operator_experience_years": 5,
        "machine_hours": 4200,
        "maintenance_due_days": 18,
        "previous_anomaly_count_1hr": 0
    }
}
```

---

# 6. Input Feature Reference

## Operating Context

| Field              | Description              | Example   |
| ------------------ | ------------------------ | --------- |
| `task_type`        | Current loader operation | `loading` |
| `material_type`    | Material being handled   | `sand`    |
| `ground_condition` | Current ground condition | `dry`     |

---

## Engine

| Field                  | Description             | Unit |
| ---------------------- | ----------------------- | ---- |
| `engine_rpm`           | Engine rotational speed | RPM  |
| `engine_temperature_c` | Engine temperature      | °C   |

---

## Transmission

| Field                        | Description              | Unit |
| ---------------------------- | ------------------------ | ---- |
| `transmission_temperature_c` | Transmission temperature | °C   |

---

## Hydraulic System

| Field                         | Description               | Unit |
| ----------------------------- | ------------------------- | ---- |
| `hydraulic_pressure_bar`      | Hydraulic system pressure | bar  |
| `hydraulic_oil_temperature_c` | Hydraulic oil temperature | °C   |

---

## Fuel

| Field            | Description           | Unit   |
| ---------------- | --------------------- | ------ |
| `fuel_rate_lph`  | Fuel consumption rate | L/hour |
| `fuel_level_pct` | Remaining fuel level  | %      |

---

## Machine Movement

| Field               | Description           | Unit    |
| ------------------- | --------------------- | ------- |
| `vehicle_speed_kmh` | Loader movement speed | km/h    |
| `idle_duration_min` | Idle duration         | minutes |

---

## Bucket / Loading

| Field                   | Description               | Unit   |
| ----------------------- | ------------------------- | ------ |
| `bucket_load_pct`       | Bucket loading percentage | %      |
| `bucket_fill_ratio_pct` | Bucket fill ratio         | %      |
| `lift_height_m`         | Bucket/lift height        | meters |

---

## Driving Behaviour

| Field               | Description       | Unit            |
| ------------------- | ----------------- | --------------- |
| `forward_speed_kmh` | Forward speed     | km/h            |
| `reverse_speed_kmh` | Reverse speed     | km/h            |
| `acceleration_mps2` | Acceleration      | m/s²            |
| `braking_intensity` | Braking intensity | Dataset-defined |

---

## Loading Cycle

| Field                     | Description                | Unit        |
| ------------------------- | -------------------------- | ----------- |
| `loading_cycles_per_hour` | Loading cycles per hour    | cycles/hour |
| `cycle_time_sec`          | Average loading cycle time | seconds     |

---

## Machine Condition

| Field             | Description                   | Unit            |
| ----------------- | ----------------------------- | --------------- |
| `tire_slip_pct`   | Tire slip percentage          | %               |
| `vibration_level` | Machine vibration measurement | Dataset-defined |

---

## Environment

| Field                   | Description         | Unit    |
| ----------------------- | ------------------- | ------- |
| `slope_deg`             | Operating slope     | degrees |
| `ambient_temperature_c` | Ambient temperature | °C      |

---

## Operator / Machine Context

| Field                        | Description                             | Unit  |
| ---------------------------- | --------------------------------------- | ----- |
| `operator_experience_years`  | Operator experience                     | years |
| `machine_hours`              | Total machine operating hours           | hours |
| `maintenance_due_days`       | Days until scheduled maintenance        | days  |
| `previous_anomaly_count_1hr` | Anomalies detected during previous hour | count |

---

# 7. Required Units

The backend must provide telemetry using the same units used during training.

```text
engine_temperature_c
→ Celsius

transmission_temperature_c
→ Celsius

hydraulic_pressure_bar
→ bar

hydraulic_oil_temperature_c
→ Celsius

fuel_rate_lph
→ Liters/hour

fuel_level_pct
→ Percentage

vehicle_speed_kmh
→ km/hour

idle_duration_min
→ Minutes

lift_height_m
→ Meters

forward_speed_kmh
→ km/hour

reverse_speed_kmh
→ km/hour

acceleration_mps2
→ m/s²

loading_cycles_per_hour
→ cycles/hour

cycle_time_sec
→ Seconds

tire_slip_pct
→ Percentage

slope_deg
→ Degrees

ambient_temperature_c
→ Celsius
```

The backend should convert incoming telemetry into these units before calling the predictor.

---

# 8. Model Prediction

The main model output is:

```text
prediction
```

This represents the **actual class predicted by the machine-learning model**.

Possible predictions:

```text
Normal
Excessive_Idling
Bucket_Overloading
Excessive_Tire_Slip
Aggressive_Acceleration
Harsh_Braking
Transmission_Overheating
Hydraulic_Stress
Inefficient_Loading_Cycle
```

---

# 9. Output Format

The `predict_loader()` function returns:

```python
{
    "machine_type": "wheel_loader",

    "machine_id": "WL-1024",

    "operator_id": "OP-204",

    "timestamp": "2026-09-23T16:30:00",

    "is_anomaly": True,

    "prediction": "Inefficient_Loading_Cycle",

    "message": "Inefficient loading cycle detected. The current loading pattern indicates reduced operating efficiency.",

    "confidence": 0.6126,

    "confidence_percent": 61.26,

    "class_probabilities": {
        "Aggressive_Acceleration": 0.0,
        "Bucket_Overloading": 0.0,
        "Excessive_Idling": 0.0,
        "Excessive_Tire_Slip": 0.0,
        "Harsh_Braking": 0.0,
        "Hydraulic_Stress": 0.0,
        "Inefficient_Loading_Cycle": 0.6126,
        "Normal": 0.3874,
        "Transmission_Overheating": 0.0
    }
}
```

---

# 10. Output Field Reference

| Field                 | Description                                  |
| --------------------- | -------------------------------------------- |
| `machine_type`        | Machine type                                 |
| `machine_id`          | Machine identifier                           |
| `operator_id`         | Operator identifier                          |
| `timestamp`           | Telemetry timestamp                          |
| `is_anomaly`          | `True` if prediction is not `Normal`         |
| `prediction`          | **Actual ML prediction**                     |
| `message`             | Human-readable description of the prediction |
| `confidence`          | Prediction confidence from 0 to 1            |
| `confidence_percent`  | Prediction confidence as percentage          |
| `class_probabilities` | Probability assigned to each class           |

---

# 11. Understanding the Output

For example:

```python
"is_anomaly": True
```

means the model classified the current operating state as anomalous.

```python
"prediction": "Inefficient_Loading_Cycle"
```

means the model's predicted anomaly is **Inefficient Loading Cycle**.

```python
"message": "Inefficient loading cycle detected..."
```

is the human-readable explanation generated from the prediction.

```python
"confidence_percent": 61.26
```

means the model assigned 61.26% probability to the predicted class.

In this example:

```text
Inefficient_Loading_Cycle → 61.26%
Normal                    → 38.74%
```

The model therefore selected `Inefficient_Loading_Cycle`, but the prediction is relatively uncertain compared with a prediction above 90%.

The confidence value should be treated as **model confidence**, not as a real-world safety probability.

---

# 12. Normal Prediction

A normal prediction looks like:

```python
{
    "is_anomaly": False,

    "prediction": "Normal",

    "message": "No unusual machine behavior detected.",

    "confidence": 0.97,

    "confidence_percent": 97.0
}
```

The backend can use:

```python
if result["is_anomaly"]:
    # Handle anomaly
else:
    # Normal operation
```

---

# 13. Example Anomaly Messages

### Excessive Idling

```text
Excessive idling detected. The wheel loader has remained idle for an unusually long duration.
```

### Bucket Overloading

```text
Bucket overloading detected. The bucket load appears unusually high.
```

### Excessive Tire Slip

```text
Excessive tire slip detected. The wheel loader is experiencing unusually high tire slip.
```

### Aggressive Acceleration

```text
Aggressive acceleration detected. The wheel loader is accelerating more aggressively than expected.
```

### Harsh Braking

```text
Harsh braking detected. The wheel loader is experiencing unusually high braking intensity.
```

### Transmission Overheating

```text
Transmission overheating detected. The transmission temperature indicates an unusual operating condition.
```

### Hydraulic Stress

```text
Hydraulic stress detected. The machine is showing an unusual hydraulic operating pattern.
```

### Inefficient Loading Cycle

```text
Inefficient loading cycle detected. The current loading pattern indicates reduced operating efficiency.
```

### Normal

```text
No unusual machine behavior detected.
```

---

# 14. Loading the Model

Install the required packages:

```bash
pip install pandas scikit-learn joblib
```

Load the model:

```python
import joblib

model_data = joblib.load(
    "loader_anomaly_model.pkl"
)

model = model_data["model"]

print(model_data["machine_type"])
print(model_data["classes"])
```

---

# 15. Using the Predictor

Import the predictor:

```python
from loader_predictor import predict_loader
```

Create the structured input:

```python
result = predict_loader(machine_input)
```

Print the important results:

```python
print("Anomaly:", result["is_anomaly"])
print("Prediction:", result["prediction"])
print("Message:", result["message"])
print("Confidence:", result["confidence_percent"], "%")
```

Example:

```text
Anomaly: True
Prediction: Inefficient_Loading_Cycle
Message: Inefficient loading cycle detected. The current loading pattern indicates reduced operating efficiency.
Confidence: 61.26 %
```

---

# 16. Prediction Flow

```text
                  Backend
                     |
                     v
             Structured Input
                     |
                     v
            transform_input()
                     |
                     v
          Loader Model Features
                     |
                     v
           Random Forest Model
                     |
                     v
                 Prediction
                     |
            +--------+--------+
            |                 |
            v                 v
       Anomaly Type       Confidence
            |
            v
      Message Mapping
            |
            v
       Final Response
```

---

# 17. Important Design Note

The current model predicts:

```text
anomaly_type
```

It does not independently predict:

```text
severity
```

Therefore, the current model should not be used to claim:

```text
Low
Medium
High
Critical
```

severity.

A separate severity model can be trained later if the application requires it.

---

# 18. Confidence Interpretation

The model returns confidence as both:

```text
confidence
```

and:

```text
confidence_percent
```

Example:

```text
confidence = 0.6126
confidence_percent = 61.26
```

The application can display this value to provide context about the model prediction.

For example:

```text
Prediction:
Inefficient Loading Cycle

Confidence:
61.26%
```

Confidence thresholds such as "high confidence" or "low confidence" should be treated as application-level design choices rather than certified safety thresholds.

---

# 19. Limitations

* The dataset is synthetic.
* The model has not been validated against real CAT wheel loader telemetry.
* The reported accuracy is based on the synthetic test dataset.
* The model does not define real CAT safety thresholds.
* The model does not independently determine anomaly severity.
* Model confidence is not equivalent to real-world safety certainty.
* Predictions should be treated as decision-support information.
* The model should not replace certified machine safety systems or trained operator judgment.

---

# 20. Future Extensions

The same architecture can be extended to additional construction equipment:

```text
CAT Smart Operator Assistant
│
├── Excavator
│   ├── excavator_anomaly_model.pkl
│   └── excavator_predictor.py
│
├── Wheel Loader
│   ├── loader_anomaly_model.pkl
│   └── loader_predictor.py
│
└── Bulldozer
    ├── bulldozer_anomaly_model.pkl
    └── bulldozer_predictor.py
```

Potential future ML modules:

* Severity prediction
* Task completion time estimation
* Fuel efficiency prediction
* Predictive maintenance
* Operator behavior analysis
* Equipment health monitoring

---

# 21. Quick Reference for Backend Developer

### Input

```text
machine_input
    |
    +-- machine_type
    |
    +-- context
    |
    +-- telemetry
    |
    +-- machine_context
```

### Call

```python
result = predict_loader(machine_input)
```

### Important outputs

```python
result["is_anomaly"]
result["prediction"]
result["message"]
result["confidence_percent"]
```

### Example

```text
is_anomaly       → True

prediction       → Inefficient_Loading_Cycle

message          → Inefficient loading cycle detected.
                   The current loading pattern indicates
                   reduced operating efficiency.

confidence       → 61.26%
```

The backend can therefore use:

* `prediction` as the detected anomaly
* `message` as the human-readable explanation
* `confidence_percent` as the model confidence
* `is_anomaly` as the anomaly status

---

## Disclaimer

This model is a prototype developed for hackathon/academic purposes. The underlying dataset is synthetic and is not actual CAT telemetry. Model predictions should not be used as a substitute for certified safety systems, manufacturer specifications, maintenance procedures, or trained operator judgment.
