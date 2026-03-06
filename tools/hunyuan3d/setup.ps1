# One-time setup: clone Hunyuan3D-2 into tools/ and install Python deps.
# Run from repo root: .\tools\hunyuan3d\setup.ps1
# Requires: Python 3.10 or 3.11, CUDA 12.x, git

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$tools = Join-Path $root "tools"
$h3d = Join-Path $tools "Hunyuan3D-2"

if (Test-Path $h3d) {
    Write-Host "Hunyuan3D-2 already exists at $h3d. Skipping clone." -ForegroundColor Cyan
} else {
    Write-Host "Cloning Tencent/Hunyuan3D-2 into tools/ ..." -ForegroundColor Green
    git clone https://github.com/Tencent/Hunyuan3D-2.git $h3d
}

Push-Location $h3d
try {
    if (Test-Path ".venv") {
        Write-Host "Venv already exists. Skipping venv create. Run 'pip install -r requirements.txt' if needed." -ForegroundColor Cyan
    } else {
        Write-Host "Creating .venv ..." -ForegroundColor Green
        python -m venv .venv
    }

    & (Join-Path $h3d ".venv" "Scripts" "Activate.ps1")

    Write-Host "Installing PyTorch (CUDA 12.4) ..." -ForegroundColor Green
    pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu124

    Write-Host "Installing requirements.txt and editable package ..." -ForegroundColor Green
    pip install -r requirements.txt
    pip install -e .

    Write-Host "Setup done. Start the API server with:" -ForegroundColor Green
    Write-Host "  .\tools\hunyuan3d\run-api.ps1" -ForegroundColor Cyan
    Write-Host "Optional: .\tools\hunyuan3d\run-api.ps1 -WithTexture -LowVram" -ForegroundColor Cyan
} finally {
    Pop-Location
}
