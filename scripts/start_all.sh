#!/bin/bash

# EduSense Unified Service Runner
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Starting EduSense Stack..."

# 1. Start Python FastAPI ML Service
cd "$ROOT_DIR/ml-service"
uvicorn main:app --host 0.0.0.0 --port 8000 &
ML_PID=$!
echo "ML Service started (PID: $ML_PID) on http://0.0.0.0:8000"

# 2. Start Express Backend API
cd "$ROOT_DIR/backend"
node src/server.js &
BACKEND_PID=$!
echo "Backend API started (PID: $BACKEND_PID) on http://0.0.0.0:5000"

# 3. Start Next.js Frontend
cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID) on http://0.0.0.0:3000"

# Cleanup on exit
trap "kill $ML_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

wait
