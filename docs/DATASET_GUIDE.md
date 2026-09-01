# EduSense Dataset Specification & Ingestion Guide

## 1. Overview

EduSense is engineered to operate on **real college academic datasets** without hard-coding assumptions. The platform includes a dedicated **Data Ingestion & Validation Studio** that handles CSV and Excel (.xlsx, .xls) uploads with dynamic column mapping, range validation, and automated missing value imputation.

---

## 2. Supported Dataset Formats & Schema

### 2.1 File Formats
* Comma Separated Values (`.csv`)
* Microsoft Excel Workbook (`.xlsx`, `.xls`)
* JSON Object Array (`.json`)

### 2.2 Expected Column Dictionary
| Column Name | Required | Accepted Aliases | Data Type | Valid Constraint |
|---|---|---|---|---|
| `student_id` | **Yes** | `roll_no`, `reg_no`, `id`, `urn` | String | Non-empty unique string |
| `name` | No | `student_name`, `full_name` | String | UTF-8 String |
| `email` | No | `mail`, `student_email` | String | Valid email address |
| `course` | No | `program`, `branch`, `department` | String | E.g. "B.Tech Computer Science" |
| `semester` | No | `sem`, `term` | Integer | 1 through 8 |
| `attendance_pct` | **Yes** | `attendance`, `att_pct`, `present_pct` | Float | $0.0 \le \text{value} \le 100.0$ |
| `assignment_completion_rate` | No | `assignments_pct`, `assignments_submitted` | Float | $0.0 \le \text{value} \le 100.0$ |
| `internal_test_avg` | **Yes** | `internal_marks`, `cat_avg`, `midterm` | Float | $0.0 \le \text{value} \le 100.0$ |
| `previous_exam_score` | No | `prev_gpa_pct`, `last_sem_marks` | Float | $0.0 \le \text{value} \le 100.0$ |
| `performance_trend` | No | `trend_delta`, `delta_marks` | Float | $-50.0 \le \text{value} \le +50.0$ |
| `score_dsa` | No | `dsa`, `data_structures` | Float | $0.0 \le \text{value} \le 100.0$ |
| `score_dbms` | No | `dbms`, `database` | Float | $0.0 \le \text{value} \le 100.0$ |
| `score_maths` | No | `mathematics`, `maths`, `am` | Float | $0.0 \le \text{value} \le 100.0$ |
| `score_os` | No | `operating_systems`, `os` | Float | $0.0 \le \text{value} \le 100.0$ |
| `score_cn` | No | `computer_networks`, `cn`, `networking`| Float | $0.0 \le \text{value} \le 100.0$ |

---

## 3. Automated Validation & Error Rules

The validation engine processes datasets prior to database insertion, rejecting corrupt records and logging exact row numbers:

1. **Range Validation**:
   * Attendance percentage outside $[0, 100]\%$ $\rightarrow$ **Validation Error** (e.g. `115%` is flagged).
   * Marks outside $[0, 100]$ $\rightarrow$ **Validation Error** (e.g. `-15` is flagged).
2. **Identifier Integrity**:
   * Missing `student_id` $\rightarrow$ **Validation Error**.
   * Duplicate `student_id` in single batch $\rightarrow$ **Duplicate Warning** (first entry retained, subsequent updated or flagged).
3. **Missing Value Imputation**:
   * If non-critical subject marks are omitted, the engine automatically imputes the student's `internal_test_avg`.

---

## 4. How to Transition from Demo to Real Institutional Data

1. Log into the Administrator portal (`admin@edusense.edu`).
2. Navigate to **Data Ingestion Studio** (`/admin/data-import`).
3. Drag and drop your college's CSV or Excel spreadsheet.
4. Review the auto-detected columns and validation report.
5. Click **"Confirm Import & Update ML Risk Predictions"**.
6. The system automatically commits the valid records and executes batch ML predictions.
7. Navigate to **ML Model Hub** (`/admin/model-management`) and click **"Retrain ML Model on Current Dataset"** to re-benchmark classifiers on your specific institution's distribution.
