# Start Hunyuan3D API server for Blender MCP (default http://localhost:8081).
# Run from repo root. Requires tools/Hunyuan3D-2 to be cloned and .venv installed.
# Texture generation is ON by default; use -NoTexture to disable.
# Usage: .\tools\hunyuan3d\run-api.ps1 [-NoTexture] [-LowVram]

param(
    [switch]$NoTexture,
    [switch]$LowVram
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$h3d = Join-Path $root "tools" "Hunyuan3D-2"

if (-not (Test-Path $h3d)) {
    Write-Host "Hunyuan3D-2 not found at $h3d. Run one-time setup first:" -ForegroundColor Yellow
    Write-Host "  .\tools\hunyuan3d\setup.ps1" -ForegroundColor Cyan
    Write-Host "Or see tools\hunyuan3d\README.md for manual clone + install."
    exit 1
}

$apiPy = Join-Path $h3d "api_server.py"
if (-not (Test-Path $apiPy)) {
    Write-Host "api_server.py not found in $h3d. Check clone." -ForegroundColor Yellow
    exit 1
}

$pythonExe = Join-Path $h3d ".venv" "Scripts" "python.exe"
if (-not (Test-Path $pythonExe)) {
    Write-Host "python.exe not found in venv. Run setup first: .\tools\hunyuan3d\setup.ps1" -ForegroundColor Yellow
    exit 1
}

$serverArgs = @("--host", "127.0.0.1", "--port", "8081", "--device", "cuda")
if (-not $NoTexture) {
    $serverArgs += @("--tex_model_path", "tencent/Hunyuan3D-2", "--enable_tex")
}
if ($LowVram) {
    $serverArgs += "--low_vram_mode"
}

# Avoid Hugging Face cache symlink issues on Windows (WinError 1314); texture pipeline uses local_dir_use_symlinks=False
$env:HF_HUB_DISABLE_SYMLINKS_WARNING = "1"

Push-Location $h3d
try {
    Write-Host "Starting Hunyuan3D API at http://127.0.0.1:8081 (Blender MCP will use this)." -ForegroundColor Green
    & $pythonExe api_server.py @serverArgs
} finally {
    Pop-Location
}
