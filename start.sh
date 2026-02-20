#!/bin/bash

echo "Starting Backend on port 8000..."
python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 &

echo "Waiting for backend..."
sleep 3

echo "Starting Frontend on port 5000..."
cd client
# Bind to 0.0.0.0:5000 as it's the standard web port for Replit previews
npm run dev -- --host 0.0.0.0 --port 5000
