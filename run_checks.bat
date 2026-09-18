@echo off
echo ========================================================
echo Running Checks: Backend (Spring Boot) and Frontend (React)
echo ========================================================

cd /d "%~dp0"

echo.
echo ========================================================
echo [1/2] Testing Spring Boot Backend Compilation in /backend...
echo ========================================================
cd backend
call mvn clean test-compile
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Backend compilation failed!
    cd ..
    pause
    exit /b %errorlevel%
) else (
    echo [SUCCESS] Backend compiles with zero errors!
)
cd ..

echo.
echo ========================================================
echo [2/2] Testing React + Vite Frontend Build in /frontend...
echo ========================================================
cd frontend
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Frontend build failed!
    cd ..
    pause
    exit /b %errorlevel%
) else (
    echo [SUCCESS] Frontend builds with zero errors!
)
cd ..

echo.
echo ========================================================
echo ALL CHECKS PASSED: Both /backend and /frontend are clean!
echo ========================================================
pause
