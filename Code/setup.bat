@echo off
echo Starting SureStep Setup...

cd backend
echo Setting up Python environment...
python -m venv venv
call venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt

echo Skipping Database Initialization (Stateless Mode)...


cd ..\frontend
echo Setting up Frontend...
call npm install

echo.
echo SureStep setup complete.
pause
