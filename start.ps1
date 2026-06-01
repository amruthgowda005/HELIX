Write-Host "Starting Helix Services..."

# Start Backend
Start-Process -NoNewWindow -FilePath "python" -ArgumentList "-m uvicorn main:app --host 0.0.0.0 --port 8000 --reload" -WorkingDirectory ".\backend"

# Start ML Service
Start-Process -NoNewWindow -FilePath "python" -ArgumentList "-m uvicorn main:app --host 0.0.0.0 --port 8001 --reload" -WorkingDirectory ".\ml"

# Start Frontend
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory ".\frontend"

Write-Host "All services started."
Write-Host "Backend: http://localhost:8000"
Write-Host "ML Service: http://localhost:8001"
Write-Host "Frontend: http://localhost:5173"
Write-Host "Press Ctrl+C to stop all services (you may need to kill the terminal session to fully terminate child processes)."

while ($true) {
    Start-Sleep -Seconds 1
}
