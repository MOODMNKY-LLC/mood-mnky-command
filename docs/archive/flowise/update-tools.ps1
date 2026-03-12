# Update existing MOOD MNKY Flowise Custom Tools via API (keeps flow intact)
# Uses PUT /api/v1/tools/{id} to update schema and func in-place.
# Usage: .\update-tools.ps1 -FlowiseUrl "https://flowise-dev.moodmnky.com" -ApiKey "your-flowise-api-key"

param(
    [Parameter(Mandatory=$false)]
    [string]$FlowiseUrl = $env:NEXT_PUBLIC_FLOWISE_HOST,
    [Parameter(Mandatory=$false)]
    [string]$ApiKey = $env:FLOWISE_API_KEY
)

if (-not $FlowiseUrl -or -not $ApiKey) {
    # Try loading .env from project root
    $envPath = Join-Path (Split-Path $PSScriptRoot -Parent) ".env"
    if (Test-Path $envPath) {
        Get-Content $envPath | ForEach-Object {
            if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
                $key = $matches[1].Trim()
                $val = $matches[2].Trim().Trim('"').Trim("'")
                if ($key -eq 'NEXT_PUBLIC_FLOWISE_HOST' -and -not $FlowiseUrl) { $FlowiseUrl = $val }
                if ($key -eq 'FLOWISE_API_KEY' -and -not $ApiKey) { $ApiKey = $val }
            }
        }
    }
}

if (-not $FlowiseUrl -or -not $ApiKey) {
    Write-Error "Need FlowiseUrl and ApiKey. Set env vars or run: .\update-tools.ps1 -FlowiseUrl 'https://flowise-dev.moodmnky.com' -ApiKey 'your-key'"
    exit 1
}

$baseUrl = $FlowiseUrl.TrimEnd('/')
$toolsDir = Join-Path $PSScriptRoot "tools"

if (-not (Test-Path $toolsDir)) {
    Write-Error "Tools directory not found: $toolsDir"
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $ApiKey"
    "Content-Type"  = "application/json"
}

Write-Host "Fetching existing tools from Flowise..." -ForegroundColor Cyan
try {
    $existingTools = Invoke-RestMethod -Uri "$baseUrl/api/v1/tools" -Method Get -Headers $headers
} catch {
    Write-Error "Failed to list tools: $($_.Exception.Message)"
    exit 1
}

$nameToId = @{}
foreach ($t in $existingTools) {
    $nameToId[$t.name] = $t.id
}

$files = Get-ChildItem -Path $toolsDir -Filter "*.json"
$updated = 0
$skipped = 0

foreach ($file in $files) {
    $toolJson = Get-Content $file.FullName -Raw | ConvertFrom-Json
    $name = $toolJson.name

    if (-not $nameToId.ContainsKey($name)) {
        Write-Host "  Skipped $name (not found in Flowise - create with upload-tools.ps1 first)" -ForegroundColor Yellow
        $skipped++
        continue
    }

    $id = $nameToId[$name]
    Write-Host "Updating $name ($id)..." -ForegroundColor Cyan

    $body = @{
        name        = $toolJson.name
        description = $toolJson.description
        color       = $toolJson.color
        schema      = $toolJson.schema
        func        = $toolJson.func
    } | ConvertTo-Json -Depth 10 -Compress

    try {
        Invoke-RestMethod -Uri "$baseUrl/api/v1/tools/$id" -Method Put -Headers $headers -Body $body | Out-Null
        Write-Host "  Updated successfully" -ForegroundColor Green
        $updated++
    } catch {
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nDone: $updated updated, $skipped skipped." -ForegroundColor Green
