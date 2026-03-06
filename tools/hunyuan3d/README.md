# Hunyuan 3D (Tencent) — local API for Blender MCP

[Tencent Hunyuan3D-2](https://github.com/Tencent/Hunyuan3D-2) runs locally and exposes an API at `http://localhost:8081` that [Blender MCP](/developer-resources/blender-mcp) can use for text-to-3D and image-to-3D.

## Quick start (after one-time setup)

**Start the API server** (from repo root):

```powershell
# Default: shape + texture (full pipeline, ~16 GB VRAM)
.\tools\hunyuan3d\run-api.ps1

# Shape only (lower VRAM, ~6 GB)
.\tools\hunyuan3d\run-api.ps1 -NoTexture
```

Requires the project to be cloned and installed first (see **One-time setup** below or use `setup.ps1`).

## One-time setup

From repo root, clone and install into `tools/Hunyuan3D-2`:

```powershell
# 1. Clone (if not already present)
if (-not (Test-Path "tools\Hunyuan3D-2")) {
  git clone https://github.com/Tencent/Hunyuan3D-2.git tools/Hunyuan3D-2
}
cd tools\Hunyuan3D-2

# 2. Create venv and install PyTorch (CUDA 12.4) + deps
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu124
pip install -r requirements.txt
pip install -e .

# 3. (Optional) Texture generation — build native modules
# cd hy3dgen\texgen\custom_rasterizer && python setup.py install && cd ..\..\..
# cd hy3dgen\texgen\differentiable_renderer && python setup.py install && cd ..\..\..

# 4. Back to repo root; start API when needed
cd ..\..
.\tools\hunyuan3d\run-api.ps1
```

Or run the automated setup script (clone + venv + pip; does not build native texture modules):

```powershell
.\tools\hunyuan3d\setup.ps1
```

Then start the server with `.\tools\hunyuan3d\run-api.ps1`.

## If texture fails with `ModuleNotFoundError: No module named 'custom_rasterizer'`

Texture generation needs two native extensions: **custom_rasterizer** (CUDA) and **mesh_processor** (C++). Build them once with:

```powershell
.\tools\hunyuan3d\build-texture-extensions.ps1
```

**Requirements:** Visual Studio Build Tools with “Desktop development with C++”, and **CUDA Toolkit** whose version matches the PyTorch wheel you installed (e.g. CUDA 12.4 if you used `cu124`). If you see “CUDA version mismatches the version that was used to compile PyTorch”, install [CUDA 12.4](https://developer.nvidia.com/cuda-12-4-0-download-archive) (Windows exe; can coexist with other versions). The script uses `C:\...\CUDA\v12.4` if present, or set `CUDA_HOME` to that path. Then restart the API.

If **install** fails with `Access is denied` or `Permission denied`: the build succeeded but the venv is locked (e.g. Hunyuan API is running). Either stop the API and run the script again, or run with **`-ForceStopApi`** to stop the process on port 8081 and then build: `.\tools\hunyuan3d\build-texture-extensions.ps1 -ForceStopApi`

If you cannot build the extensions, run shape-only (no texture): `.\tools\hunyuan3d\run-api.ps1 -NoTexture` and leave “Generate Texture” unchecked in Blender.

## If texture load fails with `WinError 1314` (symlinks) on Windows

The texture pipeline is patched to download the Hunyuan3D-2 texture model into a local directory with `local_dir_use_symlinks=False`, so the default Hugging Face cache (which uses symlinks and can fail without Administrator or Developer Mode) is not used for texture assets. If you still see symlink errors elsewhere, enable [Windows Developer Mode](https://learn.microsoft.com/en-us/windows/apps/get-started/enable-your-device-for-development) or run the terminal as Administrator.

## If the server crashes with `MT5Tokenizer` / `transformers`

Newer `transformers` (5.x) removed `MT5Tokenizer`; Hunyuan3D’s diffusers pipeline needs an older version. In the Hunyuan3D venv, pin and reinstall:

```powershell
cd tools\Hunyuan3D-2
.\.venv\Scripts\Activate.ps1
pip install "transformers>=4.30,<5.0"
.\..\hunyuan3d\run-api.ps1
```

Then start the API again with `.\tools\hunyuan3d\run-api.ps1` from repo root.

## Requirements

- **Python 3.10 or 3.11**
- **NVIDIA GPU**, 6 GB+ VRAM (shape only), 16 GB+ for texture
- **CUDA 12.4+** and matching PyTorch
- **Visual Studio Build Tools** (Windows) if you build the texture extensions

Full details: [Tencent Hunyuan 3D Local Setup](/developer-resources/hunyuan3d-setup).

## Re-texture an existing GLB (mesh + image → new GLB)

With the API running (texture enabled), you can re-texture an existing mesh using a reference image:

```powershell
.\tools\hunyuan3d\retexture-glb.ps1 -MeshPath "temp\mood-mnky.glb" -ImagePath "temp\reference.png" -OutputPath "apps\hydaelyn\public\models\mood-mnky-improved.glb"
```

Omit `-MeshPath` to generate a new model from the image (image-to-3D with texture). See [Improve 3D models and texturing](/docs/Improve-3D-Models-Texturing.md) for Blender MCP and full workflow.
