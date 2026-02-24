Write-Host "Starting TradeChain Backend..."

# Move to backend folder only if not already inside it
if (!(Test-Path "app.py")) {
    Set-Location backend
}

# Activate virtual environment if it exists
if (Test-Path ".venv\Scripts\Activate.ps1") {
    . ".venv\Scripts\Activate.ps1"
}

python -m uvicorn app:app --reload --host 0.0.0.0 --port 8001
