"""
EduSense FastAPI Machine Learning Microservice
Exposes REST endpoints for academic risk prediction, multi-model benchmarking,
model retraining, explainability, and dataset validation.
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import datetime
import pandas as pd
from ml_pipeline import pipeline_service, FEATURE_COLUMNS

app = FastAPI(
    title="EduSense ML Service",
    description="Academic Risk Prediction and Explainable ML API",
    version="1.0.4"
)

# Enable CORS for communication from Node.js backend and Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StudentFeatures(BaseModel):
    student_id: Optional[str] = "STU001"
    attendance_pct: float = Field(..., ge=0, le=100, description="Attendance percentage 0-100")
    assignment_completion_rate: float = Field(..., ge=0, le=100, description="Assignment completion 0-100")
    assignment_avg_score: float = Field(..., ge=0, le=100, description="Assignment average score 0-100")
    internal_test_avg: float = Field(..., ge=0, le=100, description="Internal test average 0-100")
    previous_exam_score: float = Field(..., ge=0, le=100, description="Previous exam score 0-100")
    performance_trend: float = Field(default=0.0, description="Performance trend (-50 to +50)")
    study_engagement_score: float = Field(default=75.0, ge=0, le=100)
    subject_failure_count: int = Field(default=0, ge=0)
    score_dsa: Optional[float] = Field(default=70.0, ge=0, le=100)
    score_dbms: Optional[float] = Field(default=70.0, ge=0, le=100)
    score_maths: Optional[float] = Field(default=70.0, ge=0, le=100)
    score_os: Optional[float] = Field(default=70.0, ge=0, le=100)
    score_cn: Optional[float] = Field(default=70.0, ge=0, le=100)

class TrainRequest(BaseModel):
    records: Optional[List[Dict[str, Any]]] = None
    csv_path: Optional[str] = None

class ValidationRequest(BaseModel):
    records: List[Dict[str, Any]]

@app.get("/")
def root():
    return {
        "service": "EduSense Machine Learning Service",
        "status": "online",
        "version": "1.0.4",
        "documentation": "/docs"
    }

@app.get("/health")
def health_check():
    has_model = pipeline_service.model is not None
    meta = pipeline_service.metadata or {}
    return {
        "status": "healthy" if has_model else "warning",
        "model_loaded": has_model,
        "algorithm": meta.get("algorithm", "Random Forest"),
        "model_version": meta.get("version", "1.0.4"),
        "trained_at": meta.get("trained_at"),
        "features": pipeline_service.feature_names,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

@app.get("/model/info")
def get_model_info():
    if pipeline_service.metadata is None:
        pipeline_service.load_model_if_exists()
    
    if pipeline_service.metadata is None:
        return {
            "status": "not_trained",
            "message": "Model not trained yet. Run training to generate evaluation benchmarks.",
            "is_demo_model": False
        }
    
    return {
        "status": "trained",
        "metadata": pipeline_service.metadata
    }

@app.post("/predict")
def predict_single(data: StudentFeatures):
    try:
        payload = data.model_dump()
        result = pipeline_service.predict_student(payload)
        return {
            "success": True,
            "student_id": data.student_id,
            "prediction": result
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )

@app.post("/predict-batch")
def predict_batch(records: List[StudentFeatures]):
    try:
        results = []
        for rec in records:
            p = pipeline_service.predict_student(rec.model_dump())
            results.append({
                "student_id": rec.student_id,
                "prediction": p
            })
        return {
            "success": True,
            "count": len(results),
            "predictions": results
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch prediction failed: {str(e)}"
        )

@app.post("/model/train")
def train_model(payload: TrainRequest):
    try:
        metadata = pipeline_service.train_and_evaluate(
            csv_path=payload.csv_path,
            data_records=payload.records
        )
        return {
            "success": True,
            "message": "EduSense ML Model trained and evaluated successfully.",
            "metadata": metadata
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Model training error: {str(e)}"
        )

@app.post("/validate-data")
def validate_dataset(req: ValidationRequest):
    """
    Validates uploaded raw records against institutional integrity constraints:
    - Attendance between 0% and 100%
    - Marks between 0 and 100
    - Valid non-empty student ID
    - Duplicate detection
    - Missing value detection
    """
    records = req.records
    total = len(records)
    valid_records = []
    invalid_records = []
    seen_ids = set()
    duplicate_count = 0
    missing_fields_count = 0

    numeric_range_rules = {
        "attendance_pct": (0.0, 100.0, "Attendance must be between 0% and 100%"),
        "assignment_completion_rate": (0.0, 100.0, "Assignment completion must be between 0% and 100%"),
        "assignment_avg_score": (0.0, 100.0, "Assignment average score must be between 0 and 100"),
        "internal_test_avg": (0.0, 100.0, "Internal test average must be between 0 and 100"),
        "previous_exam_score": (0.0, 100.0, "Previous exam score must be between 0 and 100"),
        "score_dsa": (0.0, 100.0, "DSA score must be between 0 and 100"),
        "score_dbms": (0.0, 100.0, "DBMS score must be between 0 and 100"),
        "score_maths": (0.0, 100.0, "Maths score must be between 0 and 100"),
        "score_os": (0.0, 100.0, "OS score must be between 0 and 100"),
        "score_cn": (0.0, 100.0, "CN score must be between 0 and 100")
    }

    for idx, row in enumerate(records):
        row_num = idx + 1
        errors = []
        warnings = []
        
        # 1. Student ID check
        stu_id = str(row.get("student_id", "") or row.get("roll_no", "") or "").strip()
        if not stu_id:
            errors.append("Missing student identifier (student_id / roll_no)")
            missing_fields_count += 1
        elif stu_id in seen_ids:
            warnings.append(f"Duplicate student ID '{stu_id}' detected")
            duplicate_count += 1
        else:
            seen_ids.add(stu_id)

        # 2. Name check
        name = str(row.get("name", "")).strip()
        if not name:
            warnings.append("Missing student name; placeholder will be assigned")

        # 3. Numeric range validations
        sanitized_row = dict(row)
        for field, (min_val, max_val, err_msg) in numeric_range_rules.items():
            val = row.get(field)
            if val is not None and val != "":
                try:
                    num_val = float(val)
                    if num_val < min_val or num_val > max_val:
                        errors.append(f"{field} value '{val}' is outside valid range [{min_val}-{max_val}]: {err_msg}")
                    else:
                        sanitized_row[field] = num_val
                except ValueError:
                    errors.append(f"{field} has non-numeric value '{val}'")
            else:
                # Default imputation warning
                if field in ["attendance_pct", "internal_test_avg"]:
                    warnings.append(f"Field '{field}' is missing; will impute median.")

        if errors:
            invalid_records.append({
                "row_number": row_num,
                "student_id": stu_id or "N/A",
                "name": name or "N/A",
                "errors": errors,
                "warnings": warnings,
                "raw_data": row
            })
        else:
            valid_records.append({
                "row_number": row_num,
                "sanitized_data": sanitized_row,
                "warnings": warnings
            })

    return {
        "total_records": total,
        "valid_count": len(valid_records),
        "invalid_count": len(invalid_records),
        "duplicate_count": duplicate_count,
        "missing_fields_count": missing_fields_count,
        "is_ready_for_import": len(valid_records) > 0 and len(invalid_records) == 0,
        "preview_valid_records": [r["sanitized_data"] for r in valid_records[:10]],
        "validation_errors": invalid_records,
        "all_valid_records": [r["sanitized_data"] for r in valid_records]
    }
