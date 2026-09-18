@echo off
echo ========================================================
echo Moving Spring Boot Backend Files into /backend
echo ========================================================

cd /d "%~dp0"

:: 1. Delete README.md if present
if exist "README.md" (
    echo Deleting README.md...
    git rm -f "README.md" 2>nul
    del /f /q "README.md" 2>nul
)

:: 2. Create backend folder
if not exist "backend" mkdir backend

:: 3. Move pom.xml and Dockerfile
if exist "pom.xml" (
    echo Moving pom.xml to backend/...
    git mv pom.xml backend/pom.xml 2>nul || move /y pom.xml backend\pom.xml
)
if exist "Dockerfile" (
    echo Moving Dockerfile to backend/...
    git mv Dockerfile backend/Dockerfile 2>nul || move /y Dockerfile backend\Dockerfile
)

:: 4. Move src to backend/src
if exist "src" (
    echo Moving src directory to backend/src...
    git mv src backend/src 2>nul || (
        xcopy /e /i /y src backend\src
        rd /s /q src
    )
)

:: 5. Clean up any invalid brace folder inside backend package
if exist "backend\src\main\java\com\ssn\webcrawler\{config,model,service,controller,repository}" (
    echo Cleaning invalid empty directory...
    rd /s /q "backend\src\main\java\com\ssn\webcrawler\{config,model,service,controller,repository}" 2>nul
)

:: 6. Stage and commit in git
echo.
echo ========================================================
echo Committing and Pushing restructure to GitHub...
echo ========================================================
git add -A
git commit -m "refactor: organize Spring Boot files into /backend folder"
git push -u origin main

echo.
echo ========================================================
echo Reorganization complete!
echo Spring Boot files are now in /backend
echo ========================================================
pause
