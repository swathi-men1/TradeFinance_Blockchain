#!/bin/bash

# Start FastAPI backend
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 &

# Start Vite frontend
cd client
npm run dev
