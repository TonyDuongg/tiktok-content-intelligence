@echo off
REM =======================================================================
REM [QUAN TRONG] DAN GEMINI API KEY CUA BAN VAO DUOI DAY (BO DAU REM DI):
REM set "GEMINI_API_KEY=AIzaSy_dien_key_cua_ban_vao_day"
REM =======================================================================

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

REM Load .env if present
if exist "%ROOT_DIR%.env" (
    for /f "usebackq tokens=1,* delims==" %%A in ("%ROOT_DIR%.env") do (
        if not "%%A"=="" set "%%A=%%B"
    )
)

cd /d "%ROOT_DIR%"
title TikTok Content Intelligence ^& AI Script Studio

echo =======================================================================
echo   TIKTOK CONTENT INTELLIGENCE ^& AI SCRIPT GENERATOR STUDIO
echo =======================================================================
echo.

docker info >nul 2>&1
if %errorlevel% equ 0 goto :DOCKER_MODE
goto :LOCAL_MODE

:DOCKER_MODE
echo [*] Docker is active. Starting PostgreSQL, Redis, LocalStack...
docker compose -f docker/docker-compose.yml up -d
echo [*] Starting Backend Spring Boot on port 8080...
start "TikTok AI Backend" /D "%BACKEND_DIR%" cmd /k "mvnw.cmd spring-boot:run"
goto :START_FRONTEND

:LOCAL_MODE
echo [!] Docker Desktop is not running or still starting.
echo [*] Starting Spring Boot in lightweight LOCAL mode (In-Memory H2 DB)...
echo [*] All features and Gemini AI script generator will work 100%%!
start "TikTok AI Backend" /D "%BACKEND_DIR%" cmd /k "mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=local"
goto :START_FRONTEND

:START_FRONTEND
echo [*] Starting Frontend Creator Studio on port 3000...
start "TikTok AI Studio Frontend" /D "%FRONTEND_DIR%" cmd /k "npm.cmd run dev"

echo.
echo =======================================================================
echo   SYSTEM IS STARTING UP!
echo.
echo   * Creator Studio UI: http://localhost:3000
echo   * Swagger API:       http://localhost:8080/swagger-ui.html
echo   * Health Check:      http://localhost:8080/actuator/health
echo =======================================================================
echo.
echo Opening web browser in 8 seconds (waiting for backend to be ready)...
ping localhost -n 9 >nul
start http://localhost:3000

echo.
echo Press any key to close this launcher window (Services will keep running).
pause >nul
