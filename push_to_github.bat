@echo off
echo ========================================================
echo Pushing Web Crawler to GitHub (Rishi006knight/web-crawler)
echo ========================================================

cd /d "%~dp0"

if not exist ".git" (
    echo Initializing git repository...
    git init
)

echo Checking git status...
git status

echo Adding all files...
git add .

echo Committing...
git commit -m "initial commit"

echo Setting main branch...
git branch -M main

echo Configuring remote origin...
git remote remove origin 2>nul
git remote add origin https://github.com/Rishi006knight/web-crawler.git

echo Pushing to GitHub...
git push -u origin main

echo ========================================================
echo Push complete!
echo ========================================================
pause
