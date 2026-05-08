@echo off
setlocal enabledelayedexpansion
echo ==========================================
echo    SureStep - AI Navigator Deployment
echo ==========================================
echo.

:: Ensure we are in the right directory
pushd "%~dp0"

:: 1. Start Services
echo [1/3] Starting SureStep Backend and Frontend...
start "SureStep Services" cmd /c "run.bat"

echo.
echo Waiting 10 seconds for services to initialize...
timeout /t 10 /nobreak > nul

:: 2. Start Ngrok Tunnels
echo [2/3] Starting Ngrok Secure Tunnels...
start "SureStep Tunnels" cmd /c "ngrok start --all --config=ngrok.yml"

echo.
echo Waiting 5 seconds for Ngrok to generate links...
timeout /t 5 /nobreak > nul

:: 3. Fetch and Display Links using PowerShell
echo [3/3] Fetching Live Links...
echo.

powershell -Command ^
    "$json = (Invoke-RestMethod -Uri 'http://localhost:4040/api/tunnels'); " ^
    "$front = ($json.tunnels | Where-Object { $_.config.addr -like '*5173' } | Select-Object -First 1).public_url; " ^
    "$back = ($json.tunnels | Where-Object { $_.config.addr -like '*8000' } | Select-Object -First 1).public_url; " ^
    "if ($front -and $back) { " ^
    "  Write-Host '===========================================================' -ForegroundColor Cyan; " ^
    "  Write-Host 'SUCCESS! YOUR APPLICATION IS LIVE:' -ForegroundColor Green; " ^
    "  Write-Host ''; " ^
    "  Write-Host '1. OPEN THIS IN YOUR BROWSER: ' -NoNewline; Write-Host $front -ForegroundColor White -BackgroundColor DarkBlue; " ^
    "  Write-Host ''; " ^
    "  Write-Host '2. IF THE APP ASKS FOR BACKEND URL, USE: ' -NoNewline; Write-Host $back -ForegroundColor White; " ^
    "  Write-Host ''; " ^
    "  Write-Host '3. SMART SHARE LINK (Send this to your friends):' -ForegroundColor Yellow; " ^
    "  Write-Host ($front + '?api=' + $back + '/api') -ForegroundColor Cyan; " ^
    "  Write-Host '===========================================================' -ForegroundColor Cyan; " ^
    "  Write-Host 'NOTE: If you see a 404 on the Backend link, that is normal.' -ForegroundColor Gray; " ^
    "  Write-Host 'Always open the FRONTEND link to use the app.' -ForegroundColor Gray; " ^
    "} else { " ^
    "  Write-Host '[!] Could not detect links automatically. Please check the Ngrok window.' -ForegroundColor Red; " ^
    "}"

echo.
echo Deployment Complete! Keep this window open.
echo.
popd
pause
