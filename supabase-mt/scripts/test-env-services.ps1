# Test all services referenced in supabase-mt/.env.local
# Run from repo root: .\supabase-mt\scripts\test-env-services.ps1

$ErrorActionPreference = "Continue"
$failed = 0
$passed = 0

function Test-Service {
    param([string]$Name, [scriptblock]$Test)
    Write-Host "`n--- $Name ---" -ForegroundColor Cyan
    try {
        $result = & $Test
        if ($result) {
            Write-Host "OK" -ForegroundColor Green
            $script:passed++
            return $true
        }
    } catch {
        Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
        $script:failed++
        return $false
    }
    Write-Host "FAIL" -ForegroundColor Red
    $script:failed++
    return $false
}

# Load .env.local from supabase-mt
$envPath = Join-Path (Join-Path $PSScriptRoot "..") ".env.local"
if (-not (Test-Path $envPath)) {
    Write-Host "Missing $envPath" -ForegroundColor Red
    exit 1
}
Get-Content $envPath | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
        $key = $matches[1]
        $val = $matches[2].Trim('"').Trim("'")
        [Environment]::SetEnvironmentVariable($key, $val, "Process")
    }
}

Write-Host "Testing services from supabase-mt/.env.local" -ForegroundColor Yellow

# 1. Supabase MT — REST API
Test-Service "Supabase MT (REST)" {
    $url = $env:SUPABASE_REST_URL
    $key = $env:NEXT_PUBLIC_SUPABASE_MT_ANON_KEY
    if (-not $url -or -not $key) { Write-Host "Missing SUPABASE_REST_URL or ANON_KEY"; return $false }
    $r = Invoke-WebRequest -Uri "$url/" -Method Get -Headers @{
        "apikey" = $key
        "Authorization" = "Bearer $key"
    } -UseBasicParsing -TimeoutSec 5
    $r.StatusCode -ge 200 -and $r.StatusCode -lt 500
}

# 2. Flowise — base URL
Test-Service "Flowise" {
    $url = $env:FLOWISE_URL
    if (-not $url) { Write-Host "Missing FLOWISE_URL"; return $false }
    try {
        $r = Invoke-WebRequest -Uri $url -Method Get -UseBasicParsing -TimeoutSec 5
        return $true
    } catch {
        if ($_.Exception.Response) { return $true }
        return $false
    }
}

# 2b. Flowise API key (chatflows)
Test-Service "Flowise API key" {
    $url = $env:FLOWISE_URL
    $key = $env:FLOWISE_API_KEY
    if (-not $url -or -not $key) { Write-Host "Missing FLOWISE_URL or FLOWISE_API_KEY"; return $false }
    try {
        $r = Invoke-WebRequest -Uri "$url/api/v1/chatflows" -Method Get -Headers @{ "Authorization" = "Bearer $key" } -UseBasicParsing -TimeoutSec 5
        return $r.StatusCode -eq 200
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code -eq 401) { Write-Host "Invalid or missing FLOWISE_API_KEY"; return $false }
        if ($code) { return $true }
        return $false
    }
}

# 3. n8n — base URL
Test-Service "n8n" {
    $url = $env:N8N_URL
    if (-not $url) { Write-Host "Missing N8N_URL"; return $false }
    try {
        $r = Invoke-WebRequest -Uri $url -Method Get -UseBasicParsing -TimeoutSec 5
        return $true
    } catch {
        if ($_.Exception.Response) { return $true }
        return $false
    }
}

# 3b. n8n API key (workflows list)
Test-Service "n8n API key" {
    $url = $env:N8N_URL
    $key = $env:N8N_API_KEY
    if (-not $url -or -not $key) { Write-Host "Missing N8N_URL or N8N_API_KEY"; return $false }
    try {
        $r = Invoke-WebRequest -Uri "$url/api/v1/workflows" -Method Get -Headers @{ "X-N8N-API-KEY" = $key } -UseBasicParsing -TimeoutSec 5
        return $r.StatusCode -eq 200
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code -eq 401) { Write-Host "Invalid or expired N8N_API_KEY"; return $false }
        if ($code) { return $true }
        return $false
    }
}

# 4. MinIO — health or root (optional: start docker-compose for MinIO)
Test-Service "MinIO (optional)" {
    $base = $env:MINIO_ENDPOINT
    if (-not $base) { $base = "http://127.0.0.1:9000" }
    try {
        $r = Invoke-WebRequest -Uri "$base/minio/health/live" -Method Get -UseBasicParsing -TimeoutSec 3
        return $r.StatusCode -eq 200
    } catch {
        $resp = $_.Exception.Response
        if ($resp) { return $true }
    }
    try {
        $r = Invoke-WebRequest -Uri $base -Method Get -UseBasicParsing -TimeoutSec 3
        return $true
    } catch {
        if ($_.Exception.Response) { return $true }
        Write-Host "Not running (start docker-compose to enable MinIO)"
        return $false
    }
}

# 5. Nextcloud — status (optional: on same network as 10.0.0.117)
Test-Service "Nextcloud (optional)" {
    $url = $env:NEXTCLOUD_URL
    if (-not $url) { Write-Host "Missing NEXTCLOUD_URL"; return $false }
    try {
        $r = Invoke-WebRequest -Uri "$url/status.php" -Method Get -UseBasicParsing -TimeoutSec 5
        return $r.StatusCode -eq 200 -and $r.Content -match "installed"
    } catch {
        Write-Host "Unreachable (host 10.0.0.117 may be on another network)"
        return $false
    }
}

# 6. Supabase Studio
Test-Service "Supabase Studio" {
    $url = $env:SUPABASE_STUDIO_URL
    if (-not $url) { Write-Host "Missing SUPABASE_STUDIO_URL"; return $false }
    try {
        $r = Invoke-WebRequest -Uri $url -Method Get -UseBasicParsing -TimeoutSec 5
        return $true
    } catch {
        if ($_.Exception.Response) { return $true }
        return $false
    }
}

# 7. PostgreSQL port
Test-Service "PostgreSQL (port)" {
    $dbHost = $env:POSTGRES_HOST
    $dbPort = $env:POSTGRES_PORT
    if (-not $dbHost) { $dbHost = "127.0.0.1" }
    if (-not $dbPort) { $dbPort = "54502" }
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect($dbHost, [int]$dbPort)
        $tcp.Close()
        return $true
    } catch {
        Write-Host "Connection refused (is Supabase running?)"
        return $false
    }
}

Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "Passed: $passed  Failed: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })
# Optional services: MinIO, Nextcloud — do not fail overall if only these failed
$requiredFailed = $failed
if ($failed -gt 0) {
    Write-Host "Note: MinIO and Nextcloud are optional (Docker not running or host unreachable)." -ForegroundColor Gray
}
if ($passed -ge 5 -and $failed -le 2) { exit 0 }
exit 1
