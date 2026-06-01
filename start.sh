#!/bin/bash
echo "Starting Helix Services..."

# Start Backend
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# Start ML Service
cd ml
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload &
ML_PID=$!
cd ..

# Start Frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "All services started."
echo "Backend: http://localhost:8000"
echo "ML Service: http://localhost:8001"
echo "Frontend: http://localhost:5173"

# Wait for any process to exit
wait $BACKEND_PID $ML_PID $FRONTEND_PID
