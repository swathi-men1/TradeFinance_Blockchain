#!/bin/bash

# Start FastAPI backend
cd backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 3000 &

# Start Vite frontend
cd ../client
# Bind to 0.0.0.0:5000 as per system requirements
npm run dev -- --host 0.0.0.0 --port 5000
