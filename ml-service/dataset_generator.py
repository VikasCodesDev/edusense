"""
EduSense Synthetic & Institutional Academic Dataset Generator
Generates realistic academic records with multi-dimensional student performance indicators:
- Attendance Percentage (0-100%)
- Assignment Completion Rate (0-100%)
- Assignment Average Score (0-100)
- Internal Assessment / Midterm Marks (0-100)
- Previous Semester / Baseline Marks (0-100)
- Performance Trend (slope across recent assessments, -50 to +50)
- Study Engagement Score (0-100)
- Subject Failure Count (0-5)
- Subject-wise scores: DSA, DBMS, Mathematics, Operating Systems, Computer Networks
"""

import os
import random
import numpy as np
import pandas as pd

np.random.seed(42)
random.seed(42)

FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
    "Shaurya", "Atharva", "Dhruv", "Kabir", "Rudra", "Vikas", "Rohan", "Ananya", "Diya", "Saanvi",
    "Aadhya", "Pari", "Ananya", "Anika", "Navya", "Angel", "Myra", "Sara", "Isha", "Riya",
    "Tanvi", "Prisha", "Aditi", "Meera", "Kavya", "Deepak", "Sneha", "Kunal", "Pooja", "Vikram",
    "Rahul", "Priya", "Ankit", "Neha", "Amit", "Simran", "Varun", "Shruti", "Manish", "Divya"
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Gupta", "Singh", "Kumar", "Rao", "Reddy", "Nair", "Iyer",
    "Mehta", "Joshi", "Chopra", "Malhotra", "Kapoor", "Bose", "Das", "Mukherjee", "Banerjee", "Ghosh",
    "Mishra", "Pandey", "Saxena", "Bhatia", "Seth", "Tiwari", "Yadav", "Chauhan", "Agarwal", "Bansal"
]

COURSES = ["B.Tech Computer Science", "B.Tech Information Technology", "B.Tech AI & Data Science"]
SEMESTERS = [3, 4, 5, 6]
SUBJECTS = ["Data Structures & Algorithms", "Database Management Systems", "Applied Mathematics", "Operating Systems", "Computer Networks"]

def compute_ground_truth_risk(row):
    """
    Scientifically defensible academic risk labeling based on institutional standards:
    - High Risk: Failing end-term potential (Exam/Internal < 45% OR Attendance < 60% OR (Failures >= 2 AND Trend < -5))
    - Moderate Risk: Borderline indicators (Attendance 60-74% OR Marks 45-58% OR Trend < -8 OR Failures == 1)
    - Low Risk: In good academic standing
    """
    att = row["attendance_pct"]
    assign_comp = row["assignment_completion_rate"]
    internal = row["internal_test_avg"]
    prev_exam = row["previous_exam_score"]
    trend = row["performance_trend"]
    failures = row["subject_failure_count"]
    
    composite_score = (
        0.25 * (att / 100) +
        0.15 * (assign_comp / 100) +
        0.30 * (internal / 100) +
        0.20 * (prev_exam / 100) +
        0.10 * ((trend + 30) / 60)
    )
    
    if (att < 60 or internal < 42 or (failures >= 2 and trend < -4) or composite_score < 0.48):
        return "High"
    elif (att < 75 or internal < 60 or assign_comp < 65 or trend < -8 or failures >= 1 or composite_score < 0.68):
        return "Moderate"
    else:
        return "Low"

def generate_student_record(student_id_num):
    fname = random.choice(FIRST_NAMES)
    lname = random.choice(LAST_NAMES)
    name = f"{fname} {lname}"
    roll_no = f"EDU2024CS{student_id_num:03d}"
    email = f"{fname.lower()}.{lname.lower()}{student_id_num}@university.edu"
    course = random.choice(COURSES)
    semester = random.choice(SEMESTERS)
    
    # Base archetype: 55% Low Risk, 28% Moderate Risk, 17% High Risk
    archetype_roll = random.random()
    if archetype_roll < 0.55: # Healthy / Low Risk
        att = float(np.clip(np.random.normal(88, 6), 75, 100))
        assign_comp = float(np.clip(np.random.normal(92, 7), 78, 100))
        assign_score = float(np.clip(np.random.normal(84, 8), 70, 98))
        internal = float(np.clip(np.random.normal(80, 9), 65, 98))
        prev_exam = float(np.clip(np.random.normal(82, 8), 65, 98))
        trend = float(np.clip(np.random.normal(3.5, 5), -8, 25))
        engagement = float(np.clip(np.random.normal(85, 9), 68, 100))
        failures = 0
        
    elif archetype_roll < 0.83: # Moderate Risk / Needs Monitoring
        att = float(np.clip(np.random.normal(68, 6), 58, 80))
        assign_comp = float(np.clip(np.random.normal(70, 10), 55, 85))
        assign_score = float(np.clip(np.random.normal(63, 10), 48, 78))
        internal = float(np.clip(np.random.normal(56, 8), 44, 70))
        prev_exam = float(np.clip(np.random.normal(62, 9), 48, 76))
        trend = float(np.clip(np.random.normal(-4.5, 6), -20, 8))
        engagement = float(np.clip(np.random.normal(62, 11), 40, 80))
        failures = random.choice([0, 1])
        
    else: # High Risk / Critical Attention
        att = float(np.clip(np.random.normal(52, 9), 25, 68))
        assign_comp = float(np.clip(np.random.normal(46, 12), 15, 62))
        assign_score = float(np.clip(np.random.normal(44, 12), 20, 60))
        internal = float(np.clip(np.random.normal(38, 9), 18, 52))
        prev_exam = float(np.clip(np.random.normal(48, 11), 22, 64))
        trend = float(np.clip(np.random.normal(-12.0, 7), -35, 2))
        engagement = float(np.clip(np.random.normal(38, 12), 15, 60))
        failures = random.choice([1, 2, 3])
        
    # Subject breakdown with correlated performance
    dsa_score = float(np.clip(internal + np.random.normal(-3, 8), 10, 100))
    dbms_score = float(np.clip(internal + np.random.normal(2, 7), 15, 100))
    maths_score = float(np.clip(internal + np.random.normal(-4, 9), 10, 100))
    os_score = float(np.clip(internal + np.random.normal(1, 8), 15, 100))
    cn_score = float(np.clip(internal + np.random.normal(0, 8), 15, 100))
    
    # Recalculate failure count based on subject marks < 40
    calc_failures = sum(1 for s in [dsa_score, dbms_score, maths_score, os_score, cn_score] if s < 40)
    failures = max(failures, calc_failures)

    rec = {
        "student_id": roll_no,
        "name": name,
        "email": email,
        "course": course,
        "semester": semester,
        "attendance_pct": round(att, 1),
        "assignment_completion_rate": round(assign_comp, 1),
        "assignment_avg_score": round(assign_score, 1),
        "internal_test_avg": round(internal, 1),
        "previous_exam_score": round(prev_exam, 1),
        "performance_trend": round(trend, 1),
        "study_engagement_score": round(engagement, 1),
        "subject_failure_count": int(failures),
        "score_dsa": round(dsa_score, 1),
        "score_dbms": round(dbms_score, 1),
        "score_maths": round(maths_score, 1),
        "score_os": round(os_score, 1),
        "score_cn": round(cn_score, 1),
    }
    
    rec["risk_level"] = compute_ground_truth_risk(rec)
    return rec

def generate_datasets(output_dir="/home/user/edusense/data/sample", n_samples=600):
    os.makedirs(output_dir, exist_ok=True)
    
    records = [generate_student_record(i + 1) for i in range(n_samples)]
    df = pd.DataFrame(records)
    
    # 1. Clean training dataset
    clean_csv_path = os.path.join(output_dir, "college_academic_dataset_clean.csv")
    df.to_csv(clean_csv_path, index=False)
    print(f"Generated clean dataset: {clean_csv_path} ({len(df)} rows)")
    
    # 2. Raw dataset with realistic edge cases and validation errors (for Admin Data Import demo)
    raw_records = [generate_student_record(i + 1001) for i in range(80)]
    
    # Add deliberate validation edge cases at the end:
    raw_records.append({
        "student_id": "EDU2024CS991", "name": "Invalid Attendance Student", "email": "inv1@edu.com",
        "course": "B.Tech CS", "semester": 4, "attendance_pct": 115.0, # > 100%
        "assignment_completion_rate": 80.0, "assignment_avg_score": 75.0, "internal_test_avg": 70.0,
        "previous_exam_score": 72.0, "performance_trend": 2.0, "study_engagement_score": 80.0,
        "subject_failure_count": 0, "score_dsa": 70.0, "score_dbms": 75.0, "score_maths": 72.0,
        "score_os": 74.0, "score_cn": 71.0, "risk_level": "Low"
    })
    raw_records.append({
        "student_id": "EDU2024CS992", "name": "Negative Score Student", "email": "inv2@edu.com",
        "course": "B.Tech CS", "semester": 4, "attendance_pct": 65.0,
        "assignment_completion_rate": 60.0, "assignment_avg_score": -15.0, # Negative score
        "internal_test_avg": 50.0, "previous_exam_score": 55.0, "performance_trend": -5.0,
        "study_engagement_score": 50.0, "subject_failure_count": 1, "score_dsa": 50.0,
        "score_dbms": 52.0, "score_maths": 45.0, "score_os": 48.0, "score_cn": 50.0, "risk_level": "Moderate"
    })
    raw_records.append({
        "student_id": "", "name": "Missing ID Student", "email": "noid@edu.com", # Missing ID
        "course": "B.Tech CS", "semester": 4, "attendance_pct": 82.0,
        "assignment_completion_rate": 85.0, "assignment_avg_score": 80.0, "internal_test_avg": 78.0,
        "previous_exam_score": 80.0, "performance_trend": 1.0, "study_engagement_score": 82.0,
        "subject_failure_count": 0, "score_dsa": 80.0, "score_dbms": 82.0, "score_maths": 79.0,
        "score_os": 81.0, "score_cn": 80.0, "risk_level": "Low"
    })
    raw_records.append(raw_records[0].copy()) # Duplicate entry
    
    raw_df = pd.DataFrame(raw_records)
    raw_csv_path = os.path.join(output_dir, "college_academic_dataset_raw.csv")
    raw_df.to_csv(raw_csv_path, index=False)
    print(f"Generated raw test dataset with validation cases: {raw_csv_path} ({len(raw_df)} rows)")
    
    # 3. Excel format for multi-format import testing
    excel_path = os.path.join(output_dir, "sample_students_batch.xlsx")
    df.head(60).to_excel(excel_path, index=False, sheet_name="AcademicRecords")
    print(f"Generated Excel sample batch: {excel_path} (60 rows)")
    
    print("\nDataset Class Distribution:")
    print(df["risk_level"].value_counts(normalize=True).round(3))

if __name__ == "__main__":
    generate_datasets()
