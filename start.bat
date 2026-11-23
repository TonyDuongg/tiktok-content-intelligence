@echo off
chcp 65001 >nul
echo =======================================================================
echo   🚀 TIKTOK CONTENT INTELLIGENCE ^& AI SCRIPT GENERATOR STUDIO
echo =======================================================================
echo.

REM 1. Kiem tra Docker Desktop
echo [1/4] Kiem tra ha tang Docker...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Docker Desktop chua bat. Dang mo Docker Desktop...
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        echo Dang cho Docker khoi dong (15 giay)...
        timeout /t 15 /nobreak >nul
    ) else (
        echo [!] Khong tim thay Docker Desktop. Vui long bat Docker thu cong.
    )
)

REM 2. Khoi dong PostgreSQL, Redis, LocalStack
echo [2/4] Khoi dong Database ^& Cloud Services (PostgreSQL, Redis, LocalStack)...
docker compose -f docker/docker-compose.yml up -d

REM 3. Khoi chay Backend Spring Boot (Port 8080)
echo [3/4] Khoi dong Backend Spring Boot tren port 8080...
start "TikTok AI Backend (Spring Boot)" cmd /k "cd backend && .\mvnw.cmd spring-boot:run"

REM 4. Khoi chay Frontend React Studio (Port 3000)
echo [4/4] Khoi dong Frontend Creator Studio tren port 3000...
start "TikTok AI Studio Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo =======================================================================
echo   ✅ HE THONG DA DUOC KHOI DONG!
echo.
echo   * Giao dien Creator Studio: http://localhost:3000
echo   * Swagger API Documentation: http://localhost:8080/swagger-ui.html
echo   * Actuator Health Check:    http://localhost:8080/actuator/health
echo =======================================================================
echo.
echo Tu dong mo trinh duyet sau 5 giay...
timeout /t 5 /nobreak >nul
start http://localhost:3000
