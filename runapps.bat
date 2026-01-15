@echo off
echo ============================================
echo  Starting All Integration Mapper Apps
echo ============================================
echo.

echo IMPORTANT: Make sure the following ports are available:
echo   - Port 5000 (API)
echo   - Port 4000 (Web2)
echo.
echo If any app is already running, it will fail to start!
echo.

REM Start the API (port 5000)
echo [1/2] Starting IntegrationMapper.Api on http://localhost:5000
start "IntegrationMapper.Api" cmd /k "cd /d IntegrationMapper.Api && dotnet run"

REM Wait a moment before starting the frontend
timeout /t 2 /nobreak >nul

REM Start Web2 (port 4000)
echo [2/2] Starting IntegrationMapper.Web2 on http://localhost:4000
start "IntegrationMapper.Web2" cmd /k "cd /d IntegrationMapper.Web2 && npm run dev"

echo.
echo ============================================
echo All applications are starting in separate windows:
echo   - API:  http://localhost:5000
echo   - Web2: http://localhost:4000
echo ============================================
echo.
echo NOTE: Check each window for errors. If a port is already
echo in use, you'll see an error in that window.
echo.
echo Press any key to exit this window (apps will continue running)...
pause >nul
