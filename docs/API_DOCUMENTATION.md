# EduSense REST API Reference

Base URL: `/api` (or `http://localhost:5000/api` on backend)

All protected endpoints require a JWT Bearer token in the `Authorization` header:
`Authorization: Bearer <token>`

---

## 1. Authentication Endpoints

### `POST /api/auth/login`
Authenticates a user and returns a signed JWT.
* **Payload**:
  ```json
  {
    "email": "student1@edusense.edu",
    "password": "Student@123"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1...",
    "user": {
      "_id": "usr_student_01",
      "name": "Rahul Sharma",
      "email": "student1@edusense.edu",
      "role": "student",
      "studentId": "EDU2024CS001"
    }
  }
  ```

### `POST /api/auth/register`
Creates a new student, faculty, or administrator account.

### `GET /api/auth/me`
Returns the profile of the currently authenticated session.

---

## 2. Student Endpoints

### `GET /api/students/me` *(Student Only)*
Retrieves the logged-in student's full record, subjects, latest ML risk prediction, personalized guidance, and progress history.

### `GET /api/students/:id/risk` *(Authorized Users)*
Runs or fetches the latest ML risk diagnostic for student `:id`.

### `GET /api/students/:id/recommendations` *(Authorized Users)*
Retrieves or synthesizes personalized guidance for student `:id`.

### `POST /api/students/:id/recommendations/generate` *(Authorized Users)*
Forces regeneration of AI guidance via Groq LLaMA 3.3 or deterministic rule engine.

---

## 3. Faculty Endpoints

### `GET /api/faculty/dashboard` *(Faculty & Admin)*
Returns macro class metrics, risk distribution, subject performance averages, attention queue, and early warning alerts.

### `GET /api/faculty/students` *(Faculty & Admin)*
Returns paginated student roster with query parameters:
* `search`: filter by name or roll number.
* `risk`: `ALL | High | Moderate | Low`.
* `sortBy`: `currentRiskScore | attendancePct | internalTestAvg | name`.
* `sortOrder`: `asc | desc`.
* `page`: integer page number.
* `limit`: records per page.

### `POST /api/faculty/interventions` *(Faculty & Admin)*
Logs an intervention or counseling note for a student.
* **Payload**:
  ```json
  {
    "studentId": "EDU2024CS001",
    "note": "Scheduled DSA tutorial and reviewed discrete maths questions.",
    "actionTaken": "Assigned peer tutor",
    "priority": "High"
  }
  ```

---

## 4. Admin Endpoints

### `POST /api/admin/import/preview` *(Admin Only)*
Accepts uploaded `.csv` or `.xlsx` file via `multipart/form-data`, validates columns and ranges, and returns validation errors + preview records.

### `POST /api/admin/import/confirm` *(Admin Only)*
Commits valid records into database, triggers batch ML risk predictions, and logs dataset metadata.

### `GET /api/admin/model` *(Admin Only)*
Queries the Python ML service to return active champion model info, 4-model benchmark matrix, and feature importances.

### `POST /api/admin/model/retrain` *(Admin Only)*
Triggers model retraining and 5-fold cross validation across all student records in the database.

---

## 5. Python ML Service Endpoints (Port 8000)

* `GET /health` : Liveness and model status.
* `GET /model/info` : Model metadata, benchmark results, and feature importances.
* `POST /predict` : Single student feature vector risk prediction.
* `POST /predict-batch` : Batch prediction across multiple student records.
* `POST /model/train` : Retrain pipeline with custom or database records.
* `POST /validate-data` : Check raw records against institutional integrity constraints.
