@echo off
setlocal
echo ==========================================
echo    SureStep - Frontend Sharing Script
echo ==========================================
echo.

:: Ensure we are in the right directory
pushd "%~dp0"

:: Start Frontend Tunnel
echo Starting Frontend Tunnel on Port 5173...
start "SureStep Frontend Sharing" cmd /k "ngrok http 5173 --host-header=localhost:5173"

echo.
echo -----------------------------------------------------------
echo SHARING INSTRUCTIONS:
echo 1. Copy the 'Forwarding' URL from the new Ngrok window.
echo 2. Send that URL to your friends/others.
echo.
echo NOTE: Ensure your backend is running locally for the 
echo       application to function correctly!
echo -----------------------------------------------------------
echo.
popd
pause
