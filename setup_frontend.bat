@echo off
echo ========================================================
echo Installing Frontend Dependencies (React, Tailwind, Lucide)
echo ========================================================

cd /d "%~dp0\frontend"
call npm install

echo ========================================================
echo Frontend setup complete!
echo To run Vite dev server: cd frontend && npm run dev
echo ========================================================
pause
