@echo off
echo ========================================
echo   BAGGA BUGS QUICK SETUP & FIX
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "backend\backend\package.json" (
    echo Error: Please run this script from the root project directory
    echo Expected structure: project\backend\backend\package.json
    pause
    exit /b 1
)

echo Step 1: Navigate to backend directory...
cd backend\backend

echo Step 2: Clean installation...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo Step 3: Install dependencies with correct versions...
call npm install express@4.21.2 --save
call npm install cors@2.8.5 --save
call npm install body-parser@1.20.3 --save
call npm install dotenv@16.6.1 --save
call npm install nodemailer@6.9.14 --save
call npm install express-validator@7.2.1 --save

echo Step 4: Verify nodemailer installation...
node -e "try { const nm = require('nodemailer'); console.log('✅ Nodemailer loaded successfully'); console.log('✅ createTransport method exists:', typeof nm.createTransport === 'function'); } catch(e) { console.log('❌ Nodemailer failed:', e.message); }"

echo Step 5: Create/update .env file...
if not exist ".env" (
    echo # Bagga Bugs Backend Configuration> .env
    echo SMTP_HOST=smtp.gmail.com>> .env
    echo SMTP_PORT=465>> .env
    echo SMTP_USER=your-email@gmail.com>> .env
    echo SMTP_PASSWORD=your-16-character-app-password>> .env
    echo SMTP_FROM_EMAIL=your-email@gmail.com>> .env
    echo PORT=9000>> .env
    echo NODE_ENV=development>> .env
    echo ✅ .env file created - PLEASE EDIT IT WITH YOUR EMAIL DETAILS
) else (
    echo ✅ .env file already exists
)

echo Step 6: Copy fixed server.js...
echo The server.js file has been updated to fix the nodemailer issue.
echo Make sure to use the corrected version from the artifacts.

echo.
echo ========================================
echo   SETUP COMPLETE
echo ========================================
echo.
echo Next steps:
echo 1. Edit the .env file with your Gmail credentials
echo 2. Replace server.js with the fixed version
echo 3. Start the backend: node server.js
echo 4. Test at: http://localhost:9000/api/health
echo.
echo To get Gmail App Password:
echo 1. Go to https://myaccount.google.com/apppasswords
echo 2. Generate app password for "Mail"
echo 3. Use the 16-character password in .env
echo.

cd ..\..
echo Ready to start! Run 'cd backend\backend && node server.js'
pause