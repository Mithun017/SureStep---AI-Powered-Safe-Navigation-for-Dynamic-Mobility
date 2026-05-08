@echo off
setlocal
echo Running SureStep...

:: Change directory to the script's location
pushd "%~dp0"

:: Start Backend
echo Starting Backend...
start "SureStep Backend" cmd /k "cd backend && call venv\Scripts\activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

:: Start Frontend
echo Starting Frontend...
start "SureStep Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo SureStep is running. 
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Close the command windows to stop the services.
popd
pause

