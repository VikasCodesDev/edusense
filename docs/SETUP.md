# EduSense Setup & Deployment Guide

## 1. Local Environment Setup

### 1.1 Requirements
* Node.js v18.0.0+ (v20+ recommended)
* Python v3.10+
* Git & npm

### 1.2 Step-by-Step Installation

```bash
# 1. Clone repository
git clone <repository_url>
cd edusense

# 2. Setup Python ML Environment
pip install -r ml-service/requirements.txt

# 3. Setup Node Backend & Dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 4. Generate Datasets & Train Model
python3 ml-service/dataset_generator.py
python3 ml-service/ml_pipeline.py

# 5. Seed Database
node scripts/seed_database.js

# 6. Start Unified Services
./scripts/start_all.sh
```

---

## 2. Production Deployment

### 2.1 Frontend (Vercel)
1. Push `frontend/` directory to GitHub / GitLab.
2. Link project in Vercel.
3. Configure Environment Variables:
   * `NEXT_PUBLIC_APP_URL` = `https://your-domain.vercel.app`
4. Set Root Directory to `frontend`.
5. Deploy.

### 2.2 Backend (Render / Railway / Cloud Run)
1. Deploy `backend/` as a Node.js web service.
2. Configure Environment Variables:
   * `NODE_ENV` = `production`
   * `PORT` = `5000`
   * `JWT_SECRET` = `<your-secure-random-string>`
   * `ML_SERVICE_URL` = `https://your-ml-service.onrender.com`
   * `LLM_PROVIDER` = `groq`
   * `LLM_MODEL` = `llama-3.3-70b-versatile`
   * `LLM_API_KEY` = `<your-free-groq-api-key>`
   * `MONGODB_URI` = `mongodb+srv://...` (Optional MongoDB Atlas connection)

### 2.3 Python ML Microservice (Render / Railway / AWS ECS)
1. Deploy `ml-service/` with command:
   `uvicorn main:app --host 0.0.0.0 --port 8000`
2. Ensure Dockerfile is used for reproducible builds.

---

## 3. Zero Paid Dependency Architecture

EduSense is designed to run completely on **free or open-source tiers**:
* **Frontend**: Vercel Free Hobby Tier.
* **Backend & ML**: Free / Low-cost tiers on Render or Railway.
* **Database**: MongoDB Atlas Free Tier (M0) or local persistent JSON store.
* **LLM Engine**: Groq Cloud Free Tier (LLaMA 3.3 70B / 3.1 8B) or Zero-Dependency Deterministic Fallback.
