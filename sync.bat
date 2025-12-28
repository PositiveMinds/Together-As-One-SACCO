@echo off
REM Auto-sync script for SACCO project

cd /d "%~dp0"

echo Syncing with GitHub...
echo.

REM Pull latest changes
echo Pulling latest changes...
git pull origin main
echo.

REM Add all changes
echo Adding changes...
git add .
echo.

REM Commit with timestamp
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)

git commit -m "Auto-sync %mydate% %mytime%"
echo.

REM Push to GitHub
echo Pushing to GitHub...
git push origin main
echo.

echo Sync complete!
pause
