"""
EduSense Machine Learning Pipeline Test Suite
Tests data loading, feature engineering, model training, cross validation metrics,
single prediction, explainable factors, and validation checks.
"""

import sys
import os
import pytest
import pandas as pd

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "ml-service"))
from ml_pipeline import EduSenseMLService, engineer_features, FEATURE_COLUMNS

@pytest.fixture
def ml_service():
    service = EduSenseMLService()
    if service.model is None:
        service.train_and_evaluate()
    return service

def test_feature_engineering():
    df = pd.DataFrame([{
        "score_dsa": 80.0,
        "score_dbms": 70.0,
        "score_maths": 60.0,
        "score_os": 75.0,
        "score_cn": 65.0,
        "internal_test_avg": 70.0
    }])
    engineered = engineer_features(df)
    assert "subject_min_score" in engineered.columns
    assert engineered["subject_min_score"].iloc[0] == 60.0
    assert engineered["subject_avg_score"].iloc[0] == 70.0

def test_model_training_and_metrics(ml_service):
    meta = ml_service.metadata
    assert meta is not None
    assert "evaluation_metrics" in meta
    metrics = meta["evaluation_metrics"]
    assert metrics["accuracy"] >= 0.85
    assert metrics["high_risk_recall"] >= 0.80
    assert "Random Forest" in meta["all_model_benchmarks"]

def test_prediction_high_risk(ml_service):
    high_risk_student = {
        "attendance_pct": 52.0,
        "assignment_completion_rate": 40.0,
        "assignment_avg_score": 40.0,
        "internal_test_avg": 36.0,
        "previous_exam_score": 45.0,
        "performance_trend": -15.0,
        "study_engagement_score": 35.0,
        "subject_failure_count": 2,
        "score_dsa": 35.0,
        "score_dbms": 40.0,
        "score_maths": 32.0,
        "score_os": 38.0,
        "score_cn": 42.0
    }
    pred = ml_service.predict_student(high_risk_student)
    assert pred["risk_level"] == "High"
    assert pred["risk_score"] > 60
    assert len(pred["contributing_factors"]) > 0
    # Check that attendance factor was identified
    factor_names = [f["factor"] for f in pred["contributing_factors"]]
    assert any("Attendance" in f for f in factor_names)

def test_prediction_low_risk(ml_service):
    low_risk_student = {
        "attendance_pct": 92.0,
        "assignment_completion_rate": 95.0,
        "assignment_avg_score": 88.0,
        "internal_test_avg": 85.0,
        "previous_exam_score": 84.0,
        "performance_trend": 5.0,
        "study_engagement_score": 90.0,
        "subject_failure_count": 0,
        "score_dsa": 86.0,
        "score_dbms": 84.0,
        "score_maths": 88.0,
        "score_os": 82.0,
        "score_cn": 85.0
    }
    pred = ml_service.predict_student(low_risk_student)
    assert pred["risk_level"] == "Low"
    assert pred["risk_score"] < 40

if __name__ == "__main__":
    pytest.main(["-v", __file__])
