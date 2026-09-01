# EduSense 🎓
### AI-Based Academic Risk Prediction & Personalized Learning System

> **EduSense** is a full-stack, research-grade academic intelligence platform that unifies disparate student performance indicators—attendance, continuous internal assessments, coursework completion rates, and temporal performance trends—to identify early academic risk via Machine Learning, explain contributing factors, and synthesize personalized academic guidance using an LLM.

---

## 🌟 Key Architecture & The Dual AI Principle

```
Real Student Academic Records (CSV / Excel / Ingestion Engine)
                       ↓
Data Validation (Range Checks, Missing Imputation, Integrity Rules)
                       ↓
Feature Engineering & Temporal Trend Extraction
                       ↓
Machine Learning Risk Prediction (Random Forest / 5-Fold Stratified CV)
                       ↓
Risk Level + Risk Score (0-100) + Explainable Contributing Factors
                       ↓
Weak Area & Competency Diagnostics
                       ↓
LLM-Based Personalized Guidance (Groq LLaMA 3.3 / Deterministic Fallback)
                       ↓
Student Dashboard  ←----------------→  Faculty Intervention Command Center
```

### The Clear Distinction:
* **Machine Learning (ML)** = Quantitative Risk Prediction & Contributing Indicator Extraction (SciKit-Learn, Random Forest, 5-Fold Stratified CV).
* **Large Language Model (LLM)** = Contextual Explanation & Actionable Personalized Study Plans (Groq LLaMA 3.3 / Deterministic Rules Fallback).
* **Full Stack Web Platform** = Complete end-to-end web system (Next.js 14, TypeScript, Tailwind CSS, Node.js/Express, Persistent Database).

---

## 🚀 Key Features

### 👨‍🎓 For Students
* **Academic Risk Indicator**: Low, Moderate, or High risk with transparent confidence percentages and probability distribution.
* **Responsible Academic Terminology**: Focuses on *"Potential Academic Risk"* and *"Key Contributing Indicators"* without deterministic fatalism.
* **Continuous Performance Analytics**: Multi-subject breakdown (DSA, DBMS, Maths, OS, CN), attendance thresholds, and assignment submission rates.
* **Personalized AI Guidance Plan**: Structured into *Immediate Priority*, *Subject Study Focus*, *Attendance Strategy*, *Coursework Plan*, and *Suggested Daily Routine*.
* **Text-to-Speech Audio Guidance**: In-browser audio narration of personalized recommendations.
* **Evaluation Checkpoints History**: Multi-cycle temporal tracking of internal marks, attendance, and risk index deltas.

### 👩‍🏫 For Faculty
* **Class Command Center**: Instant macro statistics (Total Students, High/Moderate/Low counts, Class Mean Attendance, Subject Performance Averages).
* **Early Warning Detection**: Proactively flags students displaying continuous temporal decline ($\le -8\%$) or attendance shortage ($< 65\%$).
* **Interactive Student Directory**: Search by name/roll no, filter by risk level or course, and sort by risk score, attendance, or performance.
* **Student Deep Dive & Intervention Logger**: Inspect student-specific ML risk factors and log counseling notes, remedial tasks, and follow-up schedules.

### 🛡️ For Institutional Administrators
* **Configurable Data Ingestion Studio**: Upload real college CSV/Excel datasets with automatic column detection, schema mapping, and validation.
* **Validation & Error Inspector**: Catches out-of-range values (e.g. attendance $> 100\%$, negative marks), missing identifiers, and duplicates before database commit.
* **Machine Learning Model Hub**: Inspect cross-validation benchmark comparisons across 4 candidate algorithms (**Random Forest, Gradient Boosting, Logistic Regression, Decision Tree**), feature importance rankings (MDI), and trigger one-click retraining on fresh institutional records.
* **User & Role Governance**: Add, edit, and manage Student, Faculty, and Admin credentials.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion, Recharts, Lucide Icons |
| **Backend API** | Node.js, Express.js, JWT Authentication, Multer, xlsx, csv-parser, bcryptjs |
| **Database** | Persistent Hybrid Store (Local JSON/BSON + Native MongoDB Atlas Support via `MONGODB_URI`) |
| **ML Microservice** | Python 3.11+, FastAPI, Uvicorn, Scikit-Learn, Pandas, NumPy, Joblib |
| **Generative AI** | Groq API (LLaMA 3.3 70B / 3.1 8B) + Zero-Dependency Deterministic Fallback Engine |

---

## 🔑 Demo Personas & Credentials

EduSense includes pre-seeded demo personas ready for immediate demonstration:

| Role | Name & Context | Email | Password |
|---|---|---|---|
| **Student (High Risk)** | Rahul Sharma (58% Att, Declining Marks, Weak in DSA) | `student1@edusense.edu` | `Student@123` |
| **Student (Moderate Risk)** | Priya Patel (74% Att, Weak in Mathematics) | `student2@edusense.edu` | `Student@123` |
| **Student (Low Risk)** | Aarav Gupta (92% Att, Strong across subjects) | `student3@edusense.edu` | `Student@123` |
| **Faculty** | Prof. Sunita Rao (CSE Department Coordinator) | `faculty@edusense.edu` | `Faculty@123` |
| **Administrator** | System Administrator | `admin@edusense.edu` | `Admin@123` |

---

## 📦 Quick Start Guide

### 1. Prerequisites
* Node.js (v18+ or v20+)
* Python (v3.10+)
* npm (v9+)

### 2. Installation
```bash
# Clone or navigate to the edusense repository
cd edusense

# Install Backend Dependencies
cd backend && npm install && cd ..

# Install Frontend Dependencies
cd frontend && npm install && cd ..

# Install Python ML Service Dependencies
pip install -r ml-service/requirements.txt
```

### 3. Initialize Database & ML Model
```bash
# 1. Generate Synthetic & College Datasets
python3 ml-service/dataset_generator.py

# 2. Train & Benchmark ML Model
python3 ml-service/ml_pipeline.py

# 3. Seed Database with Users, Academic Records, Predictions & History
node scripts/seed_database.js
```

### 4. Running the Stack
Run all services simultaneously using the launcher script:
```bash
./scripts/start_all.sh
```
Or run individually in separate terminals:
* **ML Service**: `cd ml-service && uvicorn main:app --host 0.0.0.0 --port 8000`
* **Backend API**: `cd backend && node src/server.js`
* **Next.js Frontend**: `cd frontend && npm run dev`

Open `http://localhost:3000` in your browser.

---

## 🧪 Automated Testing

EduSense includes comprehensive unit and integration tests:

```bash
# Run complete test suite
./scripts/test_system.sh

# Or run components individually:
pytest tests/test_ml_pipeline.py -v   # ML unit tests & metrics verification
node tests/backend_api.test.js        # Express API endpoints & auth verification
```

---

## 📚 Detailed Documentation

* [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Complete system architecture, data flow, and components.
* [ML_PIPELINE.md](docs/ML_PIPELINE.md) - Model selection, feature engineering, high-risk recall evaluation, and explainability.
* [DATASET_GUIDE.md](docs/DATASET_GUIDE.md) - Column specifications, schema rules, and ingestion guidelines.
* [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) - Comprehensive REST API endpoint reference.
* [SECURITY.md](docs/SECURITY.md) - Role-based access control, JWT authentication, and privacy protections.
* [SETUP.md](docs/SETUP.md) - Production deployment and environment configuration.
