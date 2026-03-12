# Re-texture an existing GLB using Hunyuan 3D API (mesh + reference image -> new GLB with texture).
# Requires: Hunyuan API running with texture enabled (.\tools\hunyuan3d\run-api.ps1).
# Usage:
#   .\tools\hunyuan3d\retexture-glb.ps1 -ImagePath "path\to\reference.png" -OutputPath "path\to\output.glb"
#   .\tools\hunyuan3d\retexture-glb.ps1 -MeshPath "temp\mood-mnky.glb" -ImagePath "temp\ref.png" -OutputPath "apps\hydaelyn\public\models\mood-mnky-improved.glb"

param(
    [Parameter(Mandatory = $false)]
    [string]$MeshPath = "",
    [Parameter(Mandatory = $true)]
    [string]$ImagePath,
    [Parameter(Mandatory = $true)]
    [string]$OutputPath,
    [string]$ApiBase = "http://127.0.0.1:8081",
    [int]$PollIntervalSeconds = 10,
    [int]$MaxWaitSeconds = 600
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $ImagePath)) {
    Write-Error "Image not found: $ImagePath"
}
if ($MeshPath -and -not (Test-Path $MeshPath)) {
    Write-Error "Mesh not found: $MeshPath"
}

$imageBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $ImagePath))
$imageB64 = [Convert]::ToBase64String($imageBytes)

$bodyHash = @{
    image   = $imageB64
    texture = $true
    type   = "glb"
}
if ($MeshPath) {
    $meshBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $MeshPath))
    $bodyHash["mesh"] = [Convert]::ToBase64String($meshBytes)
}
$body = $bodyHash | ConvertTo-Json

Write-Host "Submitting to Hunyuan API (re-texture)..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$ApiBase/send" -Method Post -Body $body -ContentType "application/json"
} catch {
    Write-Error "Hunyuan API request failed. Is the API running? ($ApiBase). Error: $_"
}

$uid = $response.uid
Write-Host "Task UID: $uid. Polling for completion (interval ${PollIntervalSeconds}s, max ${MaxWaitSeconds}s)..." -ForegroundColor Cyan

$elapsed = 0
while ($elapsed -lt $MaxWaitSeconds) {
    Start-Sleep -Seconds $PollIntervalSeconds
    $elapsed += $PollIntervalSeconds
    try {
        $statusResp = Invoke-RestMethod -Uri "$ApiBase/status/$uid" -Method Get
    } catch {
        Write-Warning "Status request failed: $_"
        continue
    }
    if ($statusResp.status -eq "completed") {
        $root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
        $resolvedOut = if ([System.IO.Path]::IsPathRooted($OutputPath)) { $OutputPath } else { Join-Path $root $OutputPath }
        $outDir = Split-Path -Parent $resolvedOut
        if ($outDir -and -not (Test-Path $outDir)) {
            New-Item -ItemType Directory -Path $outDir -Force | Out-Null
        }
        [System.IO.File]::WriteAllBytes($resolvedOut, [Convert]::FromBase64String($statusResp.model_base64))
        Write-Host "Saved re-textured model to: $resolvedOut" -ForegroundColor Green
        exit 0
    }
    Write-Host "  Still processing... (${elapsed}s)"
}
Write-Error "Timed out after ${MaxWaitSeconds}s. Check Hunyuan API logs."
