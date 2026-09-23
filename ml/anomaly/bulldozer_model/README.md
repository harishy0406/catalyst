# Bulldozer Anomaly Detection Model

## 1. Overview

The **Bulldozer Anomaly Detection Model** is the machine-learning component of the **CAT Smart Operator Assistant**.

The model detects unusual bulldozer operating behavior from machine telemetry, operating conditions, and operator/machine context.

It predicts one of the following operating states:

1. Normal
2. Blade Overloading
3. Engine Overheating
4. Excessive Dozing Depth
5. Excessive Idling
6. Hydraulic Stress
7. Poor Grading Performance
8. Track Slip
9. Uneven Track Speed

This model is intended for a **hackathon/prototype demonstration**.

> **Important:** The training dataset is synthetic. It is not real CAT telemetry and does not represent validated CAT operating limits or certified safety thresholds.

---

# 2. Folder Structure

The bulldozer model folder contains:

```text
bulldozer_model/
│
├── bulldozer_anomaly_model.pkl
├── bulldozer_predictor.py
├── test_bulldozer.py
└── README.md
```

### `bulldozer_anomaly_model.pkl`

The trained machine-learning model artifact.

It contains:

- Trained Random Forest model
- Model feature list
- Class names
- Preprocessing/model pipeline information
- Training metadata

The backend loads this file for prediction. The model does not need to be retrained during normal application use.

### `bulldozer_predictor.py`

The prediction wrapper used by the backend.

It:

1. Receives structured bulldozer input.
2. Extracts context and telemetry.
3. Converts the input into the exact feature format expected by the model.
4. Maintains the correct feature order.
5. Runs the Random Forest model.
6. Calculates prediction confidence.
7. Generates a human-readable message.
8. Returns a structured prediction response.

### `test_bulldozer.py`

A sample test script used to verify that the model and predictor are working correctly.

The current sample represents normal bulldozer operation.

### `README.md`

This documentation.

---

# 3. Model Information

| Property | Value |
|---|---|
| Machine | Bulldozer |
| Dataset | `bulldozer_dataset_50k.csv` |
| Dataset size | 50,000 records |
| Training records | 40,000 |
| Testing records | 10,000 |
| Algorithm | Random Forest Classifier |
| Target | `anomaly_type` |
| Number of classes | 9 |
| Train/Test split | 80/20 |
| Random state | 42 |
| Number of estimators | 250 |
| Minimum samples per leaf | 2 |
| Class weighting | Balanced |
| Test accuracy | ~99.97% |
| Macro F1-score | ~99.93% |

The model was trained using a stratified 80/20 train/test split.

The high test performance is expected for this prototype because the synthetic dataset contains strongly correlated patterns for the different anomaly classes.

The reported performance should **not** be interpreted as real-world performance on CAT bulldozers.

---

# 4. Prediction Architecture

```text
                    Backend
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
             +---------+---------+
             |                   |
             v                   v
        Prediction          Probabilities
             |                   |
             v                   v
       Anomaly Type          Confidence
             |
             v
      Message Generation
             |
             v
        Final Response
```

---

# 5. Input Format

The predictor expects a backend-friendly dictionary in the following structure:

```python
machine_input = {

    "machine_type": "bulldozer",

    "context": {
        "machine_id": "BD-1024",
        "operator_id": "OP-204",
        "timestamp": "2026-09-23T16:30:00",

        "task_type": "dozing",
        "soil_type": "clay",
        "ground_condition": "wet"
    },

    "telemetry": {

        "engine_rpm": 1800,
        "engine_temperature_c": 82,

        "hydraulic_pressure_bar": 240,
        "hydraulic_oil_temperature_c": 70,

        "fuel_rate_lph": 18.0,
        "fuel_level_pct": 62,

        "vehicle_speed_kmh": 5.5,
        "idle_duration_min": 0,

        "blade_load_pct": 70,
        "blade_angle_deg": 6,
        "blade_height_m": 0.4,

        "drawbar_load_pct": 65,
        "traction_force_kn": 70,

        "track_speed_left_kmh": 5.2,
        "track_speed_right_kmh": 5.1,
        "track_slip_pct": 4,

        "dozing_depth_m": 0.3,
        "grading_accuracy_error_cm": 3,

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

## Context Features

| Feature | Description | Example |
|---|---|---|
| `task_type` | Current bulldozer operation | `dozing` |
| `soil_type` | Soil/material type | `clay` |
| `ground_condition` | Current ground condition | `wet` |

## Engine

| Feature | Description | Unit |
|---|---|---|
| `engine_rpm` | Engine rotational speed | RPM |
| `engine_temperature_c` | Engine temperature | °C |

## Hydraulic System

| Feature | Description | Unit |
|---|---|---|
| `hydraulic_pressure_bar` | Hydraulic system pressure | bar |
| `hydraulic_oil_temperature_c` | Hydraulic oil temperature | °C |

## Fuel

| Feature | Description | Unit |
|---|---|---|
| `fuel_rate_lph` | Fuel consumption rate | L/hour |
| `fuel_level_pct` | Remaining fuel level | % |

## Movement

| Feature | Description | Unit |
|---|---|---|
| `vehicle_speed_kmh` | Bulldozer speed | km/h |
| `idle_duration_min` | Idle duration | minutes |

## Blade

| Feature | Description | Unit |
|---|---|---|
| `blade_load_pct` | Blade load | % |
| `blade_angle_deg` | Blade angle | degrees |
| `blade_height_m` | Blade height | meters |

## Traction / Load

| Feature | Description | Unit |
|---|---|---|
| `drawbar_load_pct` | Drawbar load | % |
| `traction_force_kn` | Traction force | kN |

## Track System

| Feature | Description | Unit |
|---|---|---|
| `track_speed_left_kmh` | Left track speed | km/h |
| `track_speed_right_kmh` | Right track speed | km/h |
| `track_slip_pct` | Track slip percentage | % |

## Dozing / Grading

| Feature | Description | Unit |
|---|---|---|
| `dozing_depth_m` | Dozing depth | meters |
| `grading_accuracy_error_cm` | Grading accuracy error | cm |

## Machine Condition

| Feature | Description | Unit |
|---|---|---|
| `vibration_level` | Machine vibration measurement | Dataset-defined |

## Environment

| Feature | Description | Unit |
|---|---|---|
| `slope_deg` | Operating slope | degrees |
| `ambient_temperature_c` | Ambient temperature | °C |

## Operator / Machine Context

| Feature | Description | Unit |
|---|---|---|
| `operator_experience_years` | Operator experience | years |
| `machine_hours` | Total machine operating hours | hours |
| `maintenance_due_days` | Days until scheduled maintenance | days |
| `previous_anomaly_count_1hr` | Previous anomalies in the last hour | count |

---

# 7. Model Features

The model uses the following 28 input features:

```text
task_type
soil_type
ground_condition

engine_rpm
engine_temperature_c

hydraulic_pressure_bar
hydraulic_oil_temperature_c

fuel_rate_lph
fuel_level_pct

vehicle_speed_kmh
idle_duration_min

blade_load_pct
blade_angle_deg
blade_height_m

drawbar_load_pct
traction_force_kn

track_speed_left_kmh
track_speed_right_kmh
track_slip_pct

dozing_depth_m
grading_accuracy_error_cm

vibration_level
slope_deg
ambient_temperature_c

operator_experience_years
machine_hours
maintenance_due_days
previous_anomaly_count_1hr
```

The following fields are not used as ML features:

```text
timestamp
machine_type
machine_id
operator_id
anomaly_type
is_anomaly
severity
```

`machine_id`, `operator_id`, and `timestamp` are retained as metadata and returned in the prediction response.

---

# 8. Prediction Classes

The model predicts the following classes:

```text
Blade_Overloading
Engine_Overheating
Excessive_Dozing_Depth
Excessive_Idling
Hydraulic_Stress
Normal
Poor_Grading_Performance
Track_Slip
Uneven_Track_Speed
```

---

# 9. Output Format

The main function is:

```python
predict_bulldozer(machine_input)
```

It returns a dictionary similar to:

```python
{
    "machine_type": "bulldozer",

    "machine_id": "BD-1024",

    "operator_id": "OP-204",

    "timestamp": "2026-09-23T16:30:00",

    "is_anomaly": False,

    "prediction": "Normal",

    "message": "No unusual machine behavior detected.",

    "confidence": 1.0,

    "confidence_percent": 100.0,

    "class_probabilities": {
        "Blade_Overloading": 0.0,
        "Engine_Overheating": 0.0,
        "Excessive_Dozing_Depth": 0.0,
        "Excessive_Idling": 0.0,
        "Hydraulic_Stress": 0.0,
        "Normal": 1.0,
        "Poor_Grading_Performance": 0.0,
        "Track_Slip": 0.0,
        "Uneven_Track_Speed": 0.0
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
| `is_anomaly` | `True` if the prediction is not `Normal` |
| `prediction` | Actual ML prediction |
| `message` | Human-readable explanation |
| `confidence` | Maximum predicted class probability |
| `confidence_percent` | Confidence converted to percentage |
| `class_probabilities` | Probability assigned to every class |

---

# 11. Human-Readable Messages

### Normal

```text
No unusual machine behavior detected.
```

### Excessive Idling

```text
Excessive idling detected. The bulldozer has remained idle for an unusually long duration.
```

### Blade Overloading

```text
Blade overloading detected. The blade load appears unusually high.
```

### Engine Overheating

```text
Engine overheating detected. The engine temperature and operating conditions indicate abnormal behavior.
```

### Hydraulic Stress

```text
Hydraulic stress detected. The machine is showing an unusual hydraulic operating pattern.
```

### Excessive Dozing Depth

```text
Excessive dozing depth detected. The bulldozer is operating at an unusually deep dozing level.
```

### Uneven Track Speed

```text
Uneven track speed detected. The left and right tracks are operating at an unusual speed difference.
```

### Track Slip

```text
Track slip detected. The bulldozer is experiencing unusually high track slip.
```

### Poor Grading Performance

```text
Poor grading performance detected. The current operating pattern indicates reduced grading accuracy.
```

---

# 12. Running the Test

Make sure the following files are in the same folder:

```text
bulldozer_model/
│
├── bulldozer_anomaly_model.pkl
├── bulldozer_predictor.py
├── test_bulldozer.py
└── README.md
```

Run:

```bash
python test_bulldozer.py
```

The test imports:

```python
from bulldozer_predictor import predict_bulldozer
```

and sends a sample `machine_input` to the model.

---

# 13. Current Test Example

The current test input represents normal bulldozer operation.

Example output:

```python
{
    'machine_type': 'bulldozer',
    'machine_id': 'BD-1024',
    'operator_id': 'OP-204',
    'timestamp': '2026-09-23T16:30:00',

    'is_anomaly': False,

    'prediction': 'Normal',

    'message': 'No unusual machine behavior detected.',

    'confidence': 1.0,

    'confidence_percent': 100.0
}
```

The complete probability output is also available through:

```python
result["class_probabilities"]
```

---

# 14. Testing Anomaly Scenarios

The predictor can also be tested using modified telemetry.

## Track Slip

Example values:

```python
"track_speed_left_kmh": 6.5,
"track_speed_right_kmh": 2.5,
"track_slip_pct": 18
```

## Blade Overloading

Example values:

```python
"blade_load_pct": 98,
"drawbar_load_pct": 95,
"traction_force_kn": 105
```

## Engine Overheating

Example values:

```python
"engine_temperature_c": 108,
"engine_rpm": 2100,
"ambient_temperature_c": 38
```

## Excessive Idling

Example value:

```python
"idle_duration_min": 35
```

These values are useful for prototype testing, but they should not be interpreted as real manufacturer-defined safety thresholds.

---

# 15. Loading the Model Manually

The model artifact can be loaded using `joblib`:

```python
import joblib

model_artifact = joblib.load(
    "bulldozer_anomaly_model.pkl"
)

model = model_artifact["model"]

print(model_artifact["machine_type"])
print(model_artifact["classes"])
```

However, normal application code should use:

```python
from bulldozer_predictor import predict_bulldozer
```

rather than interacting with the Random Forest directly.

---

# 16. Backend Integration

The backend only needs to provide the structured input and call:

```python
result = predict_bulldozer(machine_input)
```

The most important returned fields are:

```python
result["is_anomaly"]
result["prediction"]
result["message"]
result["confidence_percent"]
result["class_probabilities"]
```

For example:

```python
if result["is_anomaly"]:

    print("Anomaly detected")
    print(result["prediction"])
    print(result["message"])

else:

    print("Machine operating normally")
```

---

# 17. Prediction Flow

```text
Backend
   |
   v
machine_input
   |
   v
transform_input()
   |
   v
Pandas DataFrame
   |
   v
Expected Feature Order
   |
   v
Random Forest
   |
   +----------------------+
   |                      |
   v                      v
Prediction            Probabilities
   |                      |
   v                      v
Anomaly Status        Confidence
   |
   v
Human-readable Message
   |
   v
Structured JSON-compatible Result
```

---

# 18. Confidence

The predictor calculates:

```python
confidence = max(model.predict_proba(model_input)[0])
```

For example:

```text
confidence = 0.91
confidence_percent = 91.0
```

means the model assigned the highest probability of 91% to the selected class.

A prediction such as:

```text
Track_Slip → 91%
Normal → 9%
```

has a clearer class separation than:

```text
Track_Slip → 52%
Normal → 48%
```

However, Random Forest probability is **model confidence**, not a calibrated real-world safety probability.

---

# 19. Severity

The current model predicts:

```text
anomaly_type
```

It does **not** independently predict:

```text
Low
Medium
High
Critical
```

severity.

Even if a `severity` field exists in the original dataset, it is not the target of this model.

A separate severity classifier can be trained later if the application requires severity prediction.

---

# 20. Important Limitations

- The dataset is synthetic.
- The model has not been validated against real CAT bulldozer telemetry.
- The reported accuracy comes from the synthetic test dataset.
- The model does not define official CAT safety thresholds.
- The model does not independently predict anomaly severity.
- Confidence is not equivalent to real-world safety certainty.
- Prototype anomaly thresholds should not be presented as manufacturer-certified limits.
- The model should be treated as a decision-support component.
- It should not replace certified machine safety systems, maintenance procedures, or trained operator judgment.

---

# 21. Future Extensions

The bulldozer model can later be extended with:

- Separate severity prediction
- Predictive maintenance
- Task completion time estimation
- Fuel efficiency prediction
- Operator behavior analysis
- Equipment health monitoring
- Time-series anomaly detection
- Real-time telemetry streaming
- Cross-machine anomaly monitoring

The overall CAT Smart Operator Assistant architecture can contain:

```text
CAT Smart Operator Assistant
│
├── Excavator
│   ├── excavator_anomaly_model.pkl
│   ├── excavator_predictor.py
│   └── README.md
│
├── Wheel Loader
│   ├── loader_anomaly_model.pkl
│   ├── loader_predictor.py
│   └── README.md
│
└── Bulldozer
    ├── bulldozer_anomaly_model.pkl
    ├── bulldozer_predictor.py
    ├── test_bulldozer.py
    └── README.md
```

---

# 22. Quick Reference

### Model

```text
Machine:
Bulldozer

Algorithm:
Random Forest Classifier

Dataset:
50,000 synthetic records

Input features:
28

Output classes:
9
```

### Main function

```python
predict_bulldozer(machine_input)
```

### Main outputs

```python
result["is_anomaly"]
result["prediction"]
result["message"]
result["confidence"]
result["confidence_percent"]
result["class_probabilities"]
```

### Normal response

```text
Prediction:
Normal

Message:
No unusual machine behavior detected.
```

### Anomaly response

```text
Prediction:
<Anomaly Class>

Message:
<Human-readable explanation>

Confidence:
<Model confidence>
```

---

## Disclaimer

This bulldozer anomaly detection model is a prototype developed for hackathon/academic purposes. The underlying dataset is synthetic and is not actual CAT telemetry. The model has not been validated or certified for real-world machine safety. Its predictions should not be used as a substitute for certified safety systems, manufacturer specifications, maintenance procedures, or trained operator judgment.
