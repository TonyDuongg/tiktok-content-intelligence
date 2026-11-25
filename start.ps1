param([switch]$NoBrowser)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $projectRoot

if (Test-Path -LiteralPath (Join-Path $projectRoot '.env')) {
    Get-Content -LiteralPath (Join-Path $projectRoot '.env') | ForEach-Object {
        if ($_ -match '^\s*([A-Z][A-Z0-9_]+)\s*=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2].Trim().Trim('"').Trim("'"), 'Process')
        }
    }
}
if (!$env:AI_PROVIDER) { $env:AI_PROVIDER = 'gemini' }
if (!$env:SCRAPER_PROVIDER) { $env:SCRAPER_PROVIDER = 'rapidapi' }
if ($env:AI_PROVIDER -notin @('gemini', 'google', 'openai', 'anthropic', 'xai', 'bedrock') -or $env:SCRAPER_PROVIDER -ne 'rapidapi') {
    throw 'Choose AI_PROVIDER=gemini, openai, anthropic, xai or bedrock, and SCRAPER_PROVIDER=rapidapi in .env.'
}
if (($env:AI_PROVIDER -in @('gemini', 'google')) -and !$env:GEMINI_API_KEY) {
    Write-Warning 'GEMINI_API_KEY is missing. Add it to .env to generate scripts.'
}
if (!$env:RAPIDAPI_KEY) { Write-Warning 'RAPIDAPI_KEY is missing. Add it to .env to research TikTok channels.' }

$logDirectory = Join-Path $projectRoot 'logs'
New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
$backendRunning = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
$frontendRunning = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue

if (!$backendRunning) {
    $dockerReady = $false
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        try { docker info *> $null; $dockerReady = $LASTEXITCODE -eq 0 } catch { $dockerReady = $false }
    }
    if ($dockerReady) {
        $ErrorActionPreference = 'Continue'
        docker compose -f docker/docker-compose.yml up -d 2>&1 | Out-File (Join-Path $logDirectory 'docker.log') -Encoding utf8
        $dockerExitCode = $LASTEXITCODE
        $ErrorActionPreference = 'Stop'
        if ($dockerExitCode -ne 0) { throw 'Docker services did not start. Check logs/docker.log and retry.' }
        $env:SPRING_PROFILES_ACTIVE = 'default'
    } else {
        $env:SPRING_PROFILES_ACTIVE = 'local'
        Write-Host 'Using a persistent local database in backend/data. TikTok and AI still use real providers.'
    }
    Start-Process cmd.exe -WindowStyle Hidden -WorkingDirectory (Join-Path $projectRoot 'backend') `
        -ArgumentList @('/d', '/c', 'call', ('"{0}"' -f (Join-Path $projectRoot 'backend\mvnw.cmd')), 'spring-boot:run') `
        -RedirectStandardOutput (Join-Path $logDirectory 'backend.log') `
        -RedirectStandardError (Join-Path $logDirectory 'backend-error.log') | Out-Null
}

if (!$frontendRunning) {
    if (!(Test-Path -LiteralPath (Join-Path $projectRoot 'frontend/node_modules'))) {
        Push-Location (Join-Path $projectRoot 'frontend')
        try { npm.cmd ci; if ($LASTEXITCODE -ne 0) { throw 'Frontend dependency installation failed.' } }
        finally { Pop-Location }
    }
    Start-Process cmd.exe -WindowStyle Hidden -WorkingDirectory (Join-Path $projectRoot 'frontend') `
        -ArgumentList '/d /c npm.cmd run dev' `
        -RedirectStandardOutput (Join-Path $logDirectory 'frontend.log') `
        -RedirectStandardError (Join-Path $logDirectory 'frontend-error.log') | Out-Null
}

$startupTimer = [Diagnostics.Stopwatch]::StartNew()
$ready = $false
while ($startupTimer.Elapsed.TotalSeconds -lt 60) {
    try {
        $health = Invoke-RestMethod 'http://127.0.0.1:8080/actuator/health' -TimeoutSec 2
        if ($health.status -eq 'UP') { $ready = $true; break }
    } catch {}
    Start-Sleep -Milliseconds 500
}
if (!$ready) { throw 'Backend did not become ready within 60 seconds. Check logs/backend.log and logs/backend-error.log.' }
Write-Host 'Creator Studio: http://localhost:3000'
Write-Host 'Live providers enabled. Logs are saved in logs/.'
if (!$NoBrowser) { Start-Process 'http://localhost:3000' }
