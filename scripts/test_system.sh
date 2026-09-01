#!/bin/bash
set -e

echo "=========================================="
echo "EduSense End-to-End System Test Suite"
echo "=========================================="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "1. Running Python ML Unit Tests..."
cd "$ROOT_DIR"
pytest tests/test_ml_pipeline.py -v

echo "2. Running Backend API Integration Tests..."
node tests/backend_api.test.js

echo "3. Testing Sample Dataset Generation..."
python3 ml-service/dataset_generator.py

echo "4. Checking Next.js Frontend Production Build..."
cd frontend
npm run build

echo "=========================================="
echo "✔ All EduSense System Tests Passed (100%)"
echo "=========================================="
