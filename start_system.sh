#!/bin/bash

# Function to kill processes on exit
cleanup() {
    echo ""
    echo "Stopping all services..."
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM EXIT

echo "Starting CuraLytica System..."

# 1. Start Backend
echo "[1/2] Starting Backend API..."
cd backend
# Using the current python environment
python app.py &
BACKEND_PID=$!
cd ..
echo "Backend started with PID: $BACKEND_PID"

# 2. Start Frontend
echo "[2/2] Starting Frontend Dashboard..."
cd frontend
# Check if npm is installed
if command -v npm &> /dev/null; then
    npm start &
    FRONTEND_PID=$!
    echo "Frontend started with PID: $FRONTEND_PID"
else
    echo "Error: npm not found. Please install Node.js and npm."
    cleanup
fi
cd ..

echo "All services started!"
echo "Press Ctrl+C to stop everything."

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
