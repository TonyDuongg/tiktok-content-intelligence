# TikTok Content Intelligence & AI Script Studio - PowerShell Launcher
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "   TIKTOK CONTENT INTELLIGENCE & AI SCRIPT GENERATOR STUDIO" -ForegroundColor Yellow
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Docker
$DockerActive = $false
try {
    $null = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        $DockerActive = $true
    }
} catch {}

if ($DockerActive) {
    Write-Host "[*] Docker is active. Starting PostgreSQL, Redis, LocalStack..." -ForegroundColor Green
    docker compose -f docker/docker-compose.yml up -d
    Write-Host "[*] Starting Backend Spring Boot on port 8080..." -ForegroundColor Green
    Start-Process cmd.exe -WorkingDirectory "$ScriptDir\backend" -ArgumentList "/k .\mvnw.cmd spring-boot:run"
} else {
    Write-Host "[!] Docker Desktop is not running." -ForegroundColor Yellow
    Write-Host "[*] Starting Spring Boot in lightweight LOCAL mode (In-Memory H2 DB)..." -ForegroundColor Green
    Write-Host "[*] All features and Gemini AI script generator will work 100%!" -ForegroundColor Green
    Start-Process cmd.exe -WorkingDirectory "$ScriptDir\backend" -ArgumentList "/k .\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=local"
}

Write-Host "[*] Starting Frontend Creator Studio on port 3000..." -ForegroundColor Green
Start-Process cmd.exe -WorkingDirectory "$ScriptDir\frontend" -ArgumentList "/k npm.cmd run dev"

Write-Host ""
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "   SYSTEM IS STARTING UP!" -ForegroundColor Yellow
Write-Host "   * Creator Studio UI: http://localhost:3000" -ForegroundColor White
Write-Host "   * Swagger API:       http://localhost:8080/swagger-ui.html" -ForegroundColor White
Write-Host "   * Health Check:      http://localhost:8080/actuator/health" -ForegroundColor White
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host ""

Start-Sleep -Seconds 8
Start-Process "http://localhost:3000"

Write-Host "Press any key to exit this window (Backend & Frontend will stay running)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
