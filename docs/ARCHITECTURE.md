# EduSense Architecture & System Design

## 1. High-Level Architecture Overview

EduSense follows a modern, decoupled modular architecture composed of:
1. **Next.js 14 Presentation Tier**: Client-rendered dashboards with responsive data visualizations, interactive simulators, and role-based views.
2. **Node.js / Express API Gateway Tier**: Authentication, role authorization, business logic, CSV/Excel parsing, database abstraction, and LLM orchestration.
3. **Python FastAPI ML Microservice Tier**: High-performance Machine Learning inference engine, cross-validation benchmarking, dynamic feature importance extraction, and dataset validation.
4. **Persistent Data Tier**: Flexible persistence supporting MongoDB Atlas via standard connection strings, alongside an embedded file-backed storage engine.
5. **Generative LLM Guidance Tier**: Groq Cloud API powering structured LLaMA 3.3 models with deterministic rule fallbacks.

```
+-----------------------------------------------------------------------------------+
|                            NEXT.JS 14 FRONTEND LAYER                              |
|  - Public Landing & Simulator       - Student Dashboard (Risk, Guidance, Subjects)|
|  - Faculty Console (Directory, Logs)- Admin Hub (Ingestion Studio, ML Benchmarks) |
+-----------------------------------------------------------------------------------+
                                         |
                                         | REST / JSON (JWT Protected)
                                         v
+-----------------------------------------------------------------------------------+
|                        NODE.JS / EXPRESS BACKEND LAYER                            |
|  - Auth & Role Guard Middleware     - Data Ingestion & Validation Parser          |
|  - Student & Faculty Business Logic - LLM Guidance Orchestration & Fallback Engine|
+-----------------------------------------------------------------------------------+
                    /                                    \
                   /                                      \
                  v                                        v
+-----------------------------------+    +------------------------------------------+
|  PYTHON FASTAPI ML MICROSERVICE   |    |         PERSISTENT DATABASE LAYER        |
|  - Scikit-Learn Random Forest     |    |  - Users (Students, Faculty, Admin)      |
|  - Multi-Model Benchmarks (4 Clf) |    |  - Student Academic Records & Subjects   |
|  - 5-Fold Stratified CV Evaluation|    |  - ML Predictions & Feature Factors      |
|  - Feature Importance (MDI)       |    |  - Personalized Recommendations & Notes  |
|  - Dynamic Factor Explainability  |    |  - Audit Activity Logs & Ingested Batches|
+-----------------------------------+    +------------------------------------------+
```

---

## 2. Component Breakdown

### 2.1 Next.js 14 Frontend Tier
* **App Router Layout**: Centralized layout with `AuthProvider`, dynamic `Navbar`, responsive sidebar drawer, and dark academic UI theme.
* **Component System**:
  * `RiskBadge`: Accessible color-coded badge with pulsing status indicator.
  * `StatCard`: Key metric card with animated progress bars and trend deltas.
  * `TypingText`: Animated typewriter presentation of AI guidance with instantaneous skip controls.
  * `MagneticButton`: Interactive button with smooth cursor attraction physics.
* **Data Visualizations**: Built using `Recharts`, providing responsive area trajectory charts, radar profiles, and comparative cohort bar charts.

### 2.2 Express API Gateway Tier
* **Modular Routing**: Clean separation of `authRoutes`, `studentRoutes`, `facultyRoutes`, and `adminRoutes`.
* **Security Middleware**: `requireAuth` verifies JWT tokens; `requireRole(['student', 'faculty', 'admin'])` enforces strict role boundaries at the HTTP layer.
* **Ingestion Middleware**: `multer` memory storage for multi-part file uploads (.csv and .xlsx) paired with `xlsx` and `csv-parser`.

### 2.3 Python ML Microservice Tier
* **Framework**: FastAPI with Pydantic validation models.
* **Pipelines**: `ml_pipeline.py` encapsulates StandardScaler, Feature Engineering (`subject_min_score`, `subject_avg_score`, `subject_std_dev`), and candidate model benchmarks.
* **Explainability Algorithm**: Evaluates student indicators against empirical thresholds (e.g. Attendance $< 65\%$, internal score $< 45\%$, negative trend $< -6\%$) to generate precise diagnostic factor objects.

### 2.4 Generative AI & Guidance Engine
* **Provider**: Groq Cloud API with `llama-3.3-70b-versatile` or `llama-3.1-8b-instant`.
* **Prompt Engineering**: Strict JSON schema with bounds preventing medical or fatalistic grading claims.
* **Deterministic Fallback**: If `LLM_API_KEY` is omitted or network calls fail, the fallback engine calculates structured study plans and weekly hour allocations tailored to the student's actual weak subjects.

---

## 3. Communication & Data Flow

1. **User Authentication**: Client sends credentials -> Express issues signed JWT containing user ID and role -> Client stores token in localStorage and attaches to subsequent HTTP requests.
2. **Student Dashboard Query**: Student requests `/api/students/me` -> Express validates JWT -> Queries database for student record -> Calls ML Service (`/predict`) if prediction is stale -> Calls LLM Service (`/generate`) if guidance is missing -> Returns composite profile to frontend.
3. **Data Import & Batch Inference**: Admin uploads CSV -> Express extracts records -> Calls ML Service `/validate-data` -> Admin previews sanitized data -> Admin clicks Confirm -> Express inserts records into database -> Dispatches batch prediction request to `/predict-batch` -> Persists updated risk scores and generates historical checkpoints.
