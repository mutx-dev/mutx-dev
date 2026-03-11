# Entrypoint for full-stack deployment
#!/bin/bash

# Start backend in background
cd /app
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend
cd /app
node .next/standalone/server.js

# If frontend exits, kill backend
kill $BACKEND_PID
