Construction Task Time Estimation — CatBoost Model

Overview

This model predicts actual task completion time in minutes for construction machinery operations.

Model: CatBoost Regressor

Training data: 2,000 synthetic completed tasks

Target: Actual_Time_min

Final MAE: 27.87 minutes

Final RMSE: 39.10 minutes

Final R²: 0.9203

Baseline MAE: 102.50 minutes

The model is a pre-task estimation model using task, machine, operator, site, weather, and baseline-estimate information.

Model Input Features

The final trained model expects 17 input features:

Machine_Type — Type of construction machine.

Machine_Age_yrs — Machine age in years.

Machine_Maintenance_Status — Machine maintenance condition/status.

Operator_Skill — Beginner, Intermediate, or Expert.

Operator_Fatigue_Level — Operator fatigue level.

Task_Type — Earth Excavation, Trenching, Material Loading, Grading, or Demolition.

Task_Volume — Amount/volume of work.

Load_Weight_tons — Load weight associated with the task.

Travel_Distance_m — Machine travel distance.

Site_Terrain — Terrain type.

Site_Condition — General site condition.

Weather — Weather condition.

Temperature_C — Temperature in °C.

Humidity_Percent — Relative humidity percentage.

Visibility — Visibility condition.

Shift_Time — Work shift/time period.

Estimated_Time_min — Baseline task-time estimate.

Dataset Fields Not Used by the Final Pre-Task Model

The full dataset also contains these operational fields:

Fuel_Consumption_L

Idle_Time_during_task_min

These were intentionally excluded from the final pre-task model because they represent information that may only become available during task execution. They can be used later for a live/in-task prediction model.

Prediction Target

The model predicts:

Actual_Time_min

The output is the estimated number of minutes required to complete the task.

Do Not Use as Prediction Inputs

The following are post-task/outcome fields and were excluded to prevent target leakage:

Actual_Time_min

Time_Deviation_Percent

Breakdown_During_Task

Delay_Reason

Categorical Features

These should be supplied as strings:

Machine_Type

Machine_Maintenance_Status

Operator_Skill

Task_Type

Site_Terrain

Site_Condition

Weather

Visibility

Shift_Time

Missing categorical values can be represented as Unknown. CatBoost can handle missing numerical values.

Model File

Expected artifact:

construction_task_time_catboost.pkl

The model package contains:

Trained CatBoost model

Required feature list

Categorical feature list

Target name

Integration Note

The application should provide the same 17 feature names used during training. If some features are unavailable, do not simply remove the columns at inference time. Either provide valid missing values or use a model retrained specifically for the available feature set.

Final Model Performance

On the held-out test set:

MAE: 27.87 minutes

RMSE: 39.10 minutes

R²: 0.9203

Compared with the baseline Estimated_Time_min:

Baseline MAE: 102.50 minutes

MAE reduction: approximately 72.8%