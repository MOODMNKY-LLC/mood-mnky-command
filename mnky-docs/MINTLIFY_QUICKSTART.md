# Mintlify Quick Start Guide

## Running Mintlify in Dev Mode

### Quick Start

```bash
# Navigate to docs directory
cd docs

# Start Mintlify dev server
pnpm dlx mint dev --port 3001
```

The documentation will be available at: **http://localhost:3001**

### Alternative: Using PowerShell Script

```powershell
# Run the preview script
.\docs\preview-api-docs.ps1
```

### Check for Issues

```bash
# Check for broken links and syntax errors
cd docs
pnpm dlx mint broken-links
```

## Common Issues Fixed

### ✅ Syntax Errors with Angle Brackets

**Problem**: Mintlify parses `<` followed by numbers as JSX tags.

**Solution**: Use "Less than X" instead of `<X` in markdown files.

**Example**:
- ❌ `<2s` → ✅ `Less than 2s`
- ❌ `<1%` → ✅ `Less than 1%`
- ❌ `<your-key>` → ✅ `your-key`

### Files Fixed

All archived markdown files with angle bracket patterns have been fixed:
- `PRD_TRVLR_SYNC.md`
- `SOFTWARE_DEVELOPMENT_ROADMAP.md`
- `flowise-env-example.md`

## Debugging

If Mintlify fails to start:

1. **Check for syntax errors**:
   ```bash
   cd docs
   pnpm dlx mint broken-links
   ```

2. **Verify config file**:
   - Check `docs/docs.json` exists
   - Validate JSON syntax

3. **Check port availability**:
   ```powershell
   Get-NetTCPConnection -LocalPort 3001
   ```

4. **View debug report**:
   - See `docs/MINTLIFY_DEBUG_REPORT.md` for detailed information

## Notes

- Mintlify CLI command is `mint` (not `mintlify`)
- Archive files are processed even if not in navigation
- Server runs on port 3001 by default (or next available port)
- Check PowerShell window for server output and errors



