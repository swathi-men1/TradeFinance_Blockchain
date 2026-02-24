$API_BASE = "http://127.0.0.1:8001"
$Session = $null

# 1. Check current status
Write-Host "Checking current status..."
try {
    $resp = Invoke-WebRequest -Uri "$API_BASE/auth/me" -SessionVariable Session -ErrorAction Stop
    $resp.Content
} catch {
    $_.Exception.Message
}

# 2. Login
Write-Host "`nAttempting login..."
$loginPayload = @{
    email = "admin@trade.com"
    password = "password123"
} | ConvertTo-Json

$resp = Invoke-WebRequest -Uri "$API_BASE/auth/login" -Method Post -Body $loginPayload -ContentType "application/json" -WebSession $Session
$resp.Content
Write-Host "Cookies set: $($Session.Cookies.GetCookies($API_BASE) | Select-Object Name, Value | Format-Table | Out-String)"

# 3. Check status again
Write-Host "`nChecking status after login..."
$resp = Invoke-WebRequest -Uri "$API_BASE/auth/me" -WebSession $Session
$resp.Content
