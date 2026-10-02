# Starts every RouteX dev dependency, in order, each in its own window.
# Run this after any reboot/sleep - Redis, Kafka, and the backend are native
# background processes (no Docker, per this project's design) and do not
# survive a restart or auto-reconnect to each other on their own.
#
# Usage: right-click > "Run with PowerShell", or from a PowerShell prompt:
#   powershell -ExecutionPolicy Bypass -File start-dev.ps1

$ErrorActionPreference = "Stop"

# Dynamic repository directories based on script root
$ServerDir = "$PSScriptRoot\server"
$ClientDir = "$PSScriptRoot\client"

# Configurable / discoverable service paths
$RedisDir = if ($env:REDIS_HOME -and (Test-Path $env:REDIS_HOME)) { $env:REDIS_HOME }
            elseif (Test-Path "$PSScriptRoot\..\redis") { (Resolve-Path "$PSScriptRoot\..\redis").Path }
            elseif (Test-Path "C:\redis") { "C:\redis" }
            elseif (Test-Path "$env:USERPROFILE\redis") { "$env:USERPROFILE\redis" }
            elseif (Test-Path "C:\Users\Samik Patel\redis") { "C:\Users\Samik Patel\redis" }
            else { "C:\redis" }

$KafkaDir = if ($env:KAFKA_HOME -and (Test-Path $env:KAFKA_HOME)) { $env:KAFKA_HOME }
            elseif (Test-Path "C:\kafka") { "C:\kafka" }
            elseif (Test-Path "$PSScriptRoot\..\kafka") { (Resolve-Path "$PSScriptRoot\..\kafka").Path }
            elseif (Test-Path "$env:USERPROFILE\kafka") { "$env:USERPROFILE\kafka" }
            else { "C:\kafka" }

function Test-PortOpen($port) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    return $null -ne $conn
}

if (Test-PortOpen 6379) {
    Write-Host "Redis already running (port 6379)." -ForegroundColor Yellow
} else {
    Write-Host "Starting Redis..." -ForegroundColor Cyan
    Start-Process -WorkingDirectory $RedisDir -FilePath ".\redis-server.exe" -ArgumentList "redis.windows.conf"
    Start-Sleep -Seconds 2
}

if (Test-PortOpen 9092) {
    Write-Host "Kafka already running (port 9092)." -ForegroundColor Yellow
} else {
    if (-not (Test-Path "$KafkaDir\kraft-logs\meta.properties")) {
        Write-Host "Kafka storage not formatted yet - formatting (KRaft, standalone)..." -ForegroundColor Cyan
        Push-Location $KafkaDir
        $uuid = & ".\bin\windows\kafka-storage.bat" random-uuid
        & ".\bin\windows\kafka-storage.bat" format -t $uuid -c "config\kraft\server.properties" --standalone
        Pop-Location
    }
    Write-Host "Starting Kafka..." -ForegroundColor Cyan
    Start-Process -WorkingDirectory $KafkaDir -FilePath ".\bin\windows\kafka-server-start.bat" -ArgumentList "config\kraft\server.properties"
    Write-Host "Waiting for Kafka to finish electing itself leader..." -ForegroundColor Cyan
    Start-Sleep -Seconds 10
    Push-Location $KafkaDir
    & ".\bin\windows\kafka-topics.bat" --create --topic ride-events --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1 --if-not-exists | Out-Null
    & ".\bin\windows\kafka-topics.bat" --create --topic payment-events --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1 --if-not-exists | Out-Null
    Pop-Location
}

if (Test-PortOpen 5050) {
    Write-Host "Backend already running (port 5050)." -ForegroundColor Yellow
} else {
    Write-Host "Starting backend..." -ForegroundColor Cyan
    Start-Process -WorkingDirectory $ServerDir -FilePath "npm" -ArgumentList "run", "dev"
    Start-Sleep -Seconds 3
}

if ((Test-PortOpen 5173) -or (Test-PortOpen 5174)) {
    Write-Host "Frontend already running." -ForegroundColor Yellow
} else {
    Write-Host "Starting frontend..." -ForegroundColor Cyan
    Start-Process -WorkingDirectory $ClientDir -FilePath "npm" -ArgumentList "run", "dev"
}

Write-Host ""
Write-Host "All services launching in their own windows."
Write-Host "Backend health: http://localhost:5050/api/health"
Write-Host "Frontend: check the client window for its port (5173 or 5174)."
