# Upload MOOD MNKY Flowise Custom Tools via API
# Usage: .\upload-tools.ps1 -FlowiseUrl "https://flowise-dev.moodmnky.com" -ApiKey "your-flowise-api-key"

param(
    [Parameter(Mandatory=$true)]
    [string]$FlowiseUrl,
    [Parameter(Mandatory=$true)]
    [string]$ApiKey
)

$baseUrl = $FlowiseUrl.TrimEnd('/')
$toolsDir = Join-Path $PSScriptRoot "tools"

if (-not (Test-Path $toolsDir)) {
    Write-Error "Tools directory not found: $toolsDir"
    exit 1
}

$files = Get-ChildItem -Path $toolsDir -Filter "*.json"
foreach ($file in $files) {
    Write-Host "Uploading $($file.Name)..."
    try {
        $body = Get-Content $file.FullName -Raw
        $response = Invoke-RestMethod -Uri "$baseUrl/api/v1/tools" `
            -Method Post `
            -Headers @{ "Authorization" = "Bearer $ApiKey"; "Content-Type" = "application/json" } `
            -Body $body
        Write-Host "  Created: $($response.name) (id: $($response.id))" -ForegroundColor Green
    } catch {
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
