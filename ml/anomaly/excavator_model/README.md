# Excavator Anomaly Detection Model

## 1. Overview

The **Excavator Anomaly Detection Model** is the machine-learning component of the **CAT Smart Operator Assistant**.

The purpose of this model is to identify unusual excavator operating behavior using machine telemetry, environmental conditions, and operator/machine context.

The model analyzes the current operating state and predicts one of **9 classes**:

1. Normal
2. Excessive Idling
3. Hydraulic Stress
4. Engine Overheating
5. Aggressive Boom Movement
6. Excessive Swing Speed
7. Bucket Overloading
8. Abnormal Vibration
9. Low Excavation Productivity

The model is designed as a prototype for a hackathon/academic project.

> **Important:** The dataset is synthetic and does not represent real CAT telemetry, CAT safety thresholds, or validated machine operating limits.

---

# 2. Model Information

| Property | Value |
|---|---|
| Machine | Excavator |
| Dataset | `excavator_dataset_50k.csv` |
| Dataset size | 50,000 records |
| Training records | 40,000 |
| Testing records | 10,000 |
| Algorithm | Random Forest Classifier |
| Target | `anomaly_type` |
| Number of classes | 9 |
| Train/Test split | 80/20 |
| Random state | 42 |
| Test accuracy | ~99.62% |

The high accuracy is expected because the synthetic dataset was generated with correlated telemetry patterns for the different anomaly types.

The accuracy should **not** be interpreted as real-world CAT machine performance.

---

# 3. Files

Recommended project structure:

```text
excavator_model/
│
├── excavator_anomaly_model.pkl
├── excavator_predictor.py
├── README.md
└── test_excavator.py
```

### `excavator_anomaly_model.pkl`

This is the trained machine-learning artifact.

It contains:

- Random Forest model
- Preprocessing pipeline
- Expected feature names
- Numerical feature information
- Categorical feature information
- Class names
- Training/test metadata

The backend should load this file and use the prediction wrapper.

### `excavator_predictor.py`

This is the adapter between the backend and the ML model.

It:

1. Receives structured excavator input.
2. Extracts telemetry and contextual information.
3. Converts the input into the format expected by the model.
4. Maintains the correct feature order.
5. Runs the trained model.
6. Calculates prediction confidence.
7. Generates a human-readable message.
8. Returns the final prediction response.

### `test_excavator.py`

This is a sample test script used to verify that the predictor and model are working correctly.

It creates a sample `machine_input`, passes it to:

```python
predict_excavator(machine_input)
```

and prints the resulting prediction.

### `README.md`

Documentation for the excavator anomaly detection model, predictor, input contract, output contract, and usage.

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
Model-specific DataFrame
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
prediction                confidence
      |
      v
Human-readable message
      |
      v
Final JSON Response
```

---

# 5. Input Format

The predictor expects the following structure:

```python
machine_input = {

    "machine_type": "excavator",

    "context": {
        "machine_id": "EXC-1024",
        "operator_id": "OP-204",
        "timestamp": "2026-09-23T16:30:00",

        "task_type": "excavation",
        "soil_type": "clay",
        "ground_condition": "wet"
    },

    "telemetry": {

        "engine_rpm": 1850,
        "engine_temperature_c": 82,

        "hydraulic_pressure_bar": 245,
        "hydraulic_oil_temperature_c": 71,

        "fuel_rate_lph": 14.2,
        "fuel_level_pct": 63,

        "machine_speed_kmh": 2.4,
        "idle_duration_min": 0,

        "boom_movement_rate": 32,
        "arm_movement_rate": 28,
        "bucket_movement_rate": 25,

        "swing_speed_rpm": 7,

        "bucket_cycles_per_min": 8,
        "excavation_depth_m": 2.1,
        "bucket_load_pct": 68,

        "vibration_level": 1.8,

        "slope_deg": 4,
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

## Context

| Field | Description | Example |
|---|---|---|
| `machine_id` | Unique machine identifier | `EXC-1024` |
| `operator_id` | Operator identifier | `OP-204` |
| `timestamp` | Time of telemetry | ISO timestamp |
| `task_type` | Current operation | `excavation` |
| `soil_type` | Soil type | `clay` |
| `ground_condition` | Current ground condition | `wet` |

The `machine_id`, `operator_id`, and `timestamp` are contextual fields. They are returned in the prediction response but are not used as predictive features.

---

## Engine

| Field | Description | Unit |
|---|---|---|
| `engine_rpm` | Engine rotational speed | RPM |
| `engine_temperature_c` | Engine temperature | °C |

---

## Hydraulic System

| Field | Description | Unit |
|---|---|---|
| `hydraulic_pressure_bar` | Hydraulic system pressure | bar |
| `hydraulic_oil_temperature_c` | Hydraulic oil temperature | °C |

---

## Fuel

| Field | Description | Unit |
|---|---|---|
| `fuel_rate_lph` | Fuel consumption rate | L/hour |
| `fuel_level_pct` | Remaining fuel | % |

---

## Machine Movement

| Field | Description | Unit |
|---|---|---|
| `machine_speed_kmh` | Machine movement speed | km/h |
| `idle_duration_min` | Idle duration | minutes |
| `boom_movement_rate` | Boom movement rate | Dataset-defined |
| `arm_movement_rate` | Arm movement rate | Dataset-defined |
| `bucket_movement_rate` | Bucket movement rate | Dataset-defined |
| `swing_speed_rpm` | Excavator swing speed | RPM |

---

## Excavation

| Field | Description | Unit |
|---|---|---|
| `bucket_cycles_per_min` | Bucket cycles | cycles/min |
| `excavation_depth_m` | Excavation depth | meters |
| `bucket_load_pct` | Bucket load | % |

---

## Environment / Machine Condition

| Field | Description | Unit |
|---|---|---|
| `vibration_level` | Machine vibration measurement | Dataset-defined |
| `slope_deg` | Operating slope | degrees |
| `ambient_temperature_c` | Ambient temperature | °C |

---

## Operator / Machine Context

| Field | Description | Unit |
|---|---|---|
| `operator_experience_years` | Operator experience | years |
| `machine_hours` | Total operating hours | hours |
| `maintenance_due_days` | Days until scheduled maintenance | days |
| `previous_anomaly_count_1hr` | Anomalies detected during previous hour | count |

---

# 7. Required Units

The backend must provide values using the same units used during model training.

```text
engine_temperature_c
→ Celsius

hydraulic_pressure_bar
→ bar

hydraulic_oil_temperature_c
→ Celsius

fuel_rate_lph
→ Liters/hour

fuel_level_pct
→ Percentage

machine_speed_kmh
→ km/hour

idle_duration_min
→ Minutes

swing_speed_rpm
→ RPM

excavation_depth_m
→ Meters

bucket_load_pct
→ Percentage

slope_deg
→ Degrees

ambient_temperature_c
→ Celsius
```

Do not send values in different units without converting them first.

---

# 8. Model Prediction

The most important output field is:

```text
prediction
```

This represents the **actual class predicted by the machine-learning model**.

Possible predictions are:

```text
Normal
Excessive_Idling
Hydraulic_Stress
Engine_Overheating
Aggressive_Boom_Movement
Excessive_Swing_Speed
Bucket_Overloading
Abnormal_Vibration
Low_Excavation_Productivity
```

---

# 9. Output Format

The predictor returns a dictionary with the following structure:

```python
{
    "machine_type": "excavator",

    "machine_id": "EXC-1024",

    "operator_id": "OP-204",

    "timestamp": "2026-09-23T16:30:00",

    "is_anomaly": True,

    "prediction": "Aggressive_Boom_Movement",

    "message": "Aggressive boom movement detected. The boom is being operated with unusually high movement intensity.",

    "confidence": 0.995,

    "confidence_percent": 99.5,

    "class_probabilities": {
        "Abnormal_Vibration": 0.0,
        "Aggressive_Boom_Movement": 0.995,
        "Bucket_Overloading": 0.0,
        "Engine_Overheating": 0.0,
        "Excessive_Idling": 0.0,
        "Excessive_Swing_Speed": 0.0,
        "Hydraulic_Stress": 0.0,
        "Low_Excavation_Productivity": 0.0,
        "Normal": 0.005
    }
}
```

---

# 10. Output Field Reference

| Field | Description |
|---|---|
| `machine_type` | Machine type |
| `machine_id` | Machine identifier |
| `operator_id` | Operator identifier |
| `timestamp` | Telemetry timestamp |
| `is_anomaly` | `True` if prediction is not `Normal` |
| `prediction` | **Actual ML prediction** |
| `message` | Human-readable description of the prediction |
| `confidence` | Prediction confidence from 0 to 1 |
| `confidence_percent` | Prediction confidence as percentage |
| `class_probabilities` | Probability assigned to each class |

---

# 11. Understanding the Output

For example:

```python
"is_anomaly": True
```

means the model detected unusual behavior.

```python
"prediction": "Aggressive_Boom_Movement"
```

means the model's actual prediction is **Aggressive Boom Movement**.

```python
"message": "Aggressive boom movement detected..."
```

is a human-readable explanation that can be displayed by the application.

```python
"confidence_percent": 99.5
```

means the model assigned approximately 99.5% probability to the predicted class.

---

# 12. Normal Prediction

When the model predicts normal operation:

```python
{
    "is_anomaly": False,

    "prediction": "Normal",

    "message": "No unusual machine behavior detected.",

    "confidence": 0.972,

    "confidence_percent": 97.2
}
```

The backend can therefore use:

```python
if result["is_anomaly"]:

    # Handle anomaly

else:

    # Normal operation
```

---

# 13. Anomaly Prediction

Example:

```python
{
    "is_anomaly": True,

    "prediction": "Hydraulic_Stress",

    "message": "Hydraulic stress detected. The machine is showing an unusual hydraulic operating pattern.",

    "confidence": 0.94,

    "confidence_percent": 94.0
}
```

The backend can use:

```python
prediction = result["prediction"]

confidence = result["confidence_percent"]

message = result["message"]
```

---

# 14. Loading the Model

Install the required Python packages:

```bash
pip install pandas scikit-learn joblib
```

Load the model:

```python
import joblib

model_data = joblib.load(
    "excavator_anomaly_model.pkl"
)

model = model_data["model"]

print(model_data["machine_type"])
print(model_data["classes"])
```

---

# 15. Using the Predictor

Import the prediction function:

```python
from excavator_predictor import predict_excavator
```

Pass the structured input:

```python
result = predict_excavator(machine_input)
```

Print the important fields:

```python
print("Anomaly:", result["is_anomaly"])

print("Prediction:", result["prediction"])

print("Message:", result["message"])

print("Confidence:", result["confidence_percent"], "%")
```

Example:

```text
Anomaly: True

Prediction: Aggressive_Boom_Movement

Message: Aggressive boom movement detected. The boom is being operated with unusually high movement intensity.

Confidence: 99.5 %
```

---

# 16. Testing the Predictor

The included `test_excavator.py` can be used to test a sample input.

Run:

```bash
python test_excavator.py
```

The test script imports:

```python
from excavator_predictor import predict_excavator
```

creates a sample `machine_input`, and calls:

```python
result = predict_excavator(machine_input)

print(result)
```

This provides a quick way to verify that:

- The model file loads correctly.
- The predictor imports correctly.
- The input transformation works.
- The feature order is correct.
- The model produces a prediction.
- Confidence values are returned.
- Class probabilities are returned.
- The human-readable message is generated.

---

# 17. Prediction Flow

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
          Model-Specific Features
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
         Final Output
```

---

# 18. Example Anomaly Messages

### Excessive Idling

```text
Excessive idling detected. The excavator has remained idle for an unusually long duration.
```

### Hydraulic Stress

```text
Hydraulic stress detected. The machine is showing an unusual hydraulic operating pattern.
```

### Engine Overheating

```text
Engine overheating detected. The engine temperature and operating conditions indicate abnormal behavior.
```

### Aggressive Boom Movement

```text
Aggressive boom movement detected. The boom is being operated with unusually high movement intensity.
```

### Excessive Swing Speed

```text
Excessive swing speed detected. The excavator is operating with unusually high swing speed.
```

### Bucket Overloading

```text
Bucket overloading detected. The bucket load appears unusually high.
```

### Abnormal Vibration

```text
Abnormal vibration detected. The machine is showing an unusual vibration pattern.
```

### Low Excavation Productivity

```text
Low excavation productivity detected. The current operating pattern indicates reduced excavation efficiency.
```

### Normal

```text
No unusual machine behavior detected.
```

---

# 19. Important Design Note

The model currently predicts:

```text
anomaly_type
```

It does **not** independently predict:

```text
severity
```

Therefore, the current output should not claim that an anomaly is:

```text
Low
Medium
High
Critical
```

A separate severity model can be trained later if required.

---

# 20. Missing Data

The trained preprocessing pipeline includes missing-value handling.

However, for the actual application, the backend should provide all available telemetry fields.

For important telemetry, missing values should ideally be detected before prediction.

For example:

```json
{
    "status": "insufficient_data",

    "missing_fields": [
        "engine_temperature_c",
        "hydraulic_pressure_bar"
    ]
}
```

The model should not be treated as reliable when essential telemetry is unavailable.

---

# 21. Limitations

- The training dataset is synthetic.
- The model has not been validated using real CAT telemetry.
- The model's accuracy is based on the synthetic test dataset.
- The model does not define real CAT safety thresholds.
- The model does not replace certified machine safety systems.
- The model does not independently determine anomaly severity.
- Model confidence is not equivalent to real-world safety certainty.
- Predictions should be treated as decision-support information.

---

# 22. Future Extensions

The same architecture can be extended to other construction machines:

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

Potential future ML modules include:

- Severity prediction
- Task completion time estimation
- Fuel efficiency prediction
- Predictive maintenance
- Operator behavior analysis
- Equipment health monitoring

---

# 23. Quick Reference for Backend Developer

### Input

```text
machine_input
    ├── machine_type
    ├── context
    ├── telemetry
    └── machine_context
```

### Call

```python
result = predict_excavator(machine_input)
```

### Important outputs

```python
result["is_anomaly"]

result["prediction"]

result["message"]

result["confidence_percent"]

result["class_probabilities"]
```

### Example

```text
is_anomaly       → True

prediction       → Aggressive_Boom_Movement

message          → Aggressive boom movement detected...

confidence       → 99.5%
```

The backend can directly use `prediction` as the detected anomaly and `message` as the human-readable output.

---

## Disclaimer

This model is a prototype developed for hackathon/academic purposes. The underlying data is synthetic and is not actual CAT telemetry. The predictions should not be used as a substitute for certified safety systems, manufacturer specifications, maintenance procedures, or trained operator judgment.
