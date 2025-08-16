@echo off
echo ========================================
echo   FIXING NODEMAILER INSTALLATION
echo ========================================
echo.

REM Navigate to backend directory
cd /d "%~dp0"

echo Step 1: Stopping any running servers...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Completely removing node_modules and package-lock.json...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
if exist .genkit rmdir /s /q .genkit

echo Step 3: Clearing npm cache...
call npm cache clean --force

echo Step 4: Installing dependencies with exact versions...
call npm install express@4.21.2 --save
call npm install cors@2.8.5 --save
call npm install body-parser@1.20.3 --save
call npm install dotenv@16.6.1 --save
call npm install nodemailer@6.9.14 --save
call npm install express-validator@7.2.1 --save

echo Step 5: Verifying nodemailer installation...
node -e "try { const nm = require('nodemailer'); console.log('✅ Nodemailer loaded successfully, version:', nm.version || 'unknown'); } catch(e) { console.log('❌ Nodemailer failed:', e.message); }"

echo Step 6: Creating/updating .env file...
if not exist ".env" (
    echo SMTP_HOST=smtp.gmail.com> .env
    echo SMTP_PORT=465>> .env
    echo SMTP_USER=arhamawan125@gmail.com>> .env
    echo SMTP_PASSWORD=skor dkfl xefr blho>> .env
    echo SMTP_FROM_EMAIL=arhamawan125@gmail.com>> .env
    echo PORT=5000>> .env
    echo ✅ .env file created
) else (
    echo ✅ .env file exists
)

echo.
echo ========================================
echo   INSTALLATION COMPLETE
echo ========================================
echo.
echo Starting server...
node server.js

pause