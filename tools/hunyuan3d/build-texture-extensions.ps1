# Build native texture extensions for Hunyuan3D (custom_rasterizer + mesh_processor).
# Run from repo root. Requires: Hunyuan3D-2 cloned, .venv with PyTorch/CUDA, and on Windows
# Visual Studio Build Tools (C++) and CUDA Toolkit. PyTorch in the venv is built for CUDA 12.4;
# nvcc version must match (set CUDA_HOME to CUDA 12.4 path if you have multiple toolkits).
# Usage: .\tools\hunyuan3d\build-texture-extensions.ps1 [-ForceStopApi]
#
# -ForceStopApi: If port 8081 is in use, stop the process using it (Hunyuan API) so install can proceed.
# If install fails with "Access is denied": stop the API and run again, or use -ForceStopApi.

param(
    [switch]$ForceStopApi
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$h3d = Join-Path $root "tools" "Hunyuan3D-2"
$pythonExe = Join-Path $h3d ".venv" "Scripts" "python.exe"

# Pre-check: port 8081 in use (Hunyuan API) locks venv files during install
try {
    $port8081 = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
} catch { $port8081 = $null }
if ($port8081) {
    if ($ForceStopApi) {
        $procIds = $port8081 | ForEach-Object { $_.OwningProcess } | Sort-Object -Unique
        foreach ($procId in $procIds) {
            $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "Stopping process on port 8081: $($proc.ProcessName) (PID $procId)" -ForegroundColor Cyan
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            }
        }
        Start-Sleep -Seconds 2
        Write-Host "Proceeding with build..." -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host "WARNING: Port 8081 is in use (Hunyuan API may be running)." -ForegroundColor Yellow
        Write-Host "Stop the API before building, or install will fail with 'Access is denied'." -ForegroundColor Yellow
        Write-Host "  Option A: Close the terminal running run-api.ps1, then run this script again." -ForegroundColor Gray
        Write-Host "  Option B: Run with -ForceStopApi to stop the process on 8081 now:" -ForegroundColor Gray
        Write-Host "            .\tools\hunyuan3d\build-texture-extensions.ps1 -ForceStopApi" -ForegroundColor Cyan
        Write-Host ""
    }
}

if (-not (Test-Path $h3d)) {
    Write-Host "Hunyuan3D-2 not found at $h3d. Run setup first: .\tools\hunyuan3d\setup.ps1" -ForegroundColor Yellow
    exit 1
}
if (-not (Test-Path $pythonExe)) {
    Write-Host "venv not found. Run setup first: .\tools\hunyuan3d\setup.ps1" -ForegroundColor Yellow
    exit 1
}

$crDir = Join-Path $h3d "hy3dgen" "texgen" "custom_rasterizer"
$drDir = Join-Path $h3d "hy3dgen" "texgen" "differentiable_renderer"

foreach ($dir in @($crDir, $drDir)) {
    if (-not (Test-Path $dir)) {
        Write-Host "Directory not found: $dir" -ForegroundColor Yellow
        exit 1
    }
}

# Ensure Visual Studio C++ compiler (cl.exe) is on PATH
$vsPath = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\BuildTools"
$launchScript = Join-Path $vsPath "Common7\Tools\Launch-VsDevShell.ps1"
if (Test-Path $launchScript) {
    Write-Host "Loading Visual Studio Build Tools environment..." -ForegroundColor Gray
    & $launchScript -Arch amd64 -HostArch amd64
}

# Avoid duplicate VC env activation when building (PyTorch extension build)
$env:DISTUTILS_USE_SDK = "1"

# PyTorch in the venv is built for CUDA 12.4; nvcc ideally matches. If CUDA 12.4 install
# failed, we can attempt a best-effort build using your system nvcc (e.g. 13.1) by relaxing
# PyTorch's strict major-version check (local-only hack). This may still fail at runtime.
$cuda124 = "C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.4"
if ($env:CUDA_HOME) {
    Write-Host "Using CUDA from CUDA_HOME: $env:CUDA_HOME" -ForegroundColor Gray
} elseif (Test-Path $cuda124) {
    $env:CUDA_HOME = $cuda124
    $env:PATH = "$cuda124\bin;$env:PATH"
    Write-Host "Using CUDA 12.4 at $cuda124 (matches PyTorch)." -ForegroundColor Gray
} else {
    $nvccVer = (nvcc --version 2>$null) -match "release (\d+\.\d+)"; if ($nvccVer) { $sysCuda = $Matches[1] } else { $sysCuda = "unknown" }
    if ($sysCuda -and $sysCuda -ne "12.4") {
        $cudaSysPath = "C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v$sysCuda"
        if (Test-Path $cudaSysPath) {
            $env:CUDA_HOME = $cudaSysPath
            $env:PATH = "$cudaSysPath\bin;$env:PATH"
        }

        Write-Host ""
        Write-Host "WARNING: CUDA version mismatch: system nvcc is $sysCuda but PyTorch was built for 12.4." -ForegroundColor Yellow
        Write-Host "Attempting best-effort build anyway (may fail). Recommended fix is still CUDA 12.4 install:" -ForegroundColor Yellow
        Write-Host "  https://developer.nvidia.com/cuda-12-4-0-download-archive" -ForegroundColor Cyan
        Write-Host ""

        # Local-only hack: relax PyTorch strict CUDA major mismatch check during extension build.
        $env:TORCH_CUDA_ALLOW_MAJOR_MISMATCH = "1"
    }
}

# Ensure CUDA_HOME\bin is on PATH (nvcc, dlls)
if ($env:CUDA_HOME -and (Test-Path (Join-Path $env:CUDA_HOME "bin"))) {
    $env:PATH = "$(Join-Path $env:CUDA_HOME "bin");$env:PATH"
}

# If we are not using CUDA 12.4, enable the local-only mismatch hack.
if ($env:CUDA_HOME -and ($env:CUDA_HOME -ne $cuda124)) {
    $env:TORCH_CUDA_ALLOW_MAJOR_MISMATCH = "1"
    Write-Host ""
    Write-Host "WARNING: Building with CUDA_HOME=$env:CUDA_HOME while PyTorch expects CUDA 12.4 (best-effort hack enabled)." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Building texture extensions (custom_rasterizer, mesh_processor)..." -ForegroundColor Cyan
Write-Host ""

# 1. custom_rasterizer (CUDA)
Write-Host "1/2 custom_rasterizer..." -ForegroundColor Green
Push-Location $crDir
try {
    & $pythonExe setup.py install 2>&1 | Tee-Object -Variable crOutput
    if ($LASTEXITCODE -ne 0) { throw "setup.py install exited $LASTEXITCODE" }
} catch {
    $outStr = $crOutput -join "`n"
    if ($outStr -match "Access is denied|Permission denied|WinError 5|Errno 13") {
        Write-Host ""
        Write-Host "Build succeeded but INSTALL failed (venv file locked)." -ForegroundColor Yellow
        Write-Host "1. Stop the Hunyuan API server: close the terminal running run-api.ps1" -ForegroundColor Cyan
        Write-Host "2. Close any other terminal/IDE using this venv" -ForegroundColor Cyan
        Write-Host "3. Run this script again: .\tools\hunyuan3d\build-texture-extensions.ps1" -ForegroundColor Cyan
        Write-Host ""
    }
    exit 1
} finally {
    Pop-Location
}

# 2. differentiable_renderer (mesh_processor, C++/pybind11)
Write-Host "2/2 mesh_processor (differentiable_renderer)..." -ForegroundColor Green
Push-Location $drDir
try {
    & $pythonExe setup.py install 2>&1 | Tee-Object -Variable drOutput
    if ($LASTEXITCODE -ne 0) { throw "setup.py install exited $LASTEXITCODE" }
} catch {
    $outStr = $drOutput -join "`n"
    if ($outStr -match "Access is denied|Permission denied|WinError 5|Errno 13") {
        Write-Host ""
        Write-Host "Build succeeded but INSTALL failed (venv file locked)." -ForegroundColor Yellow
        Write-Host "1. Stop the Hunyuan API server: close the terminal running run-api.ps1" -ForegroundColor Cyan
        Write-Host "2. Run this script again: .\tools\hunyuan3d\build-texture-extensions.ps1" -ForegroundColor Cyan
        Write-Host ""
    }
    exit 1
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "Texture extensions built. Start the API with: .\tools\hunyuan3d\run-api.ps1" -ForegroundColor Green
