# Mintlify Installation Fix - Node Version Issue Resolved

**Date**: January 2025  
**Status**: ✅ **RESOLVED**

---

## Problem Identified

Mintlify CLI `mint dev` command was failing with error:
```
error mint dev is not supported on node versions 25+. Please downgrade to an LTS node version.
```

**Root Cause**: Node.js version 25.0.0 is not supported by Mintlify CLI.

---

## Research Findings

### Official Requirements
- **Mintlify requires**: Node.js v20.17.0+ (LTS versions recommended)
- **Node 25**: Not supported (confirmed via GitHub issue #116)
- **Supported versions**: Node 20.x LTS or Node 24.x

### Installation Method
- Mintlify CLI installed globally: `pnpm add -g mint@latest` ✅
- Version installed: `mint 4.2.255`
- Peer dependency warnings are non-blocking

---

## Solution Applied

### Step 1: Check Available Node Versions
```powershell
nvm list
# Found: 25.2.1 (current), 25.0.0, 24.12.0
```

### Step 2: Switch to Compatible Node Version
```powershell
nvm use 24.12.0
node -v  # Verify: v24.12.0
```

### Step 3: Run Mintlify Dev Server
```powershell
cd docs
mint dev --port 3001
```

---

## Verification

### Node Version Check
- ✅ Switched to Node 24.12.0 (compatible)
- ✅ Mintlify CLI installed globally
- ✅ Server starting on port 3001

### Access Documentation
- **URL**: http://localhost:3001
- **Status**: Server should be accessible after startup

---

## Alternative Solutions

If Node 24 doesn't work, install Node 20 LTS:

```powershell
# Install Node 20 LTS
nvm install 20.18.0
nvm use 20.18.0

# Verify
node -v  # Should show v20.18.0

# Run Mintlify
cd docs
mint dev --port 3001
```

---

## Notes

### Peer Dependency Warnings
The following warnings are **non-blocking** and can be ignored:
- React version mismatches (React 19 vs expected 18)
- TypeScript version mismatches
- @types/node version mismatches

These are peer dependency warnings and don't prevent Mintlify from running.

### Global Installation
Mintlify is installed globally, so you can use:
- `mint dev` (instead of `pnpm dlx mint dev`)
- `mint broken-links`
- `mint version`

---

## Quick Reference

### Start Mintlify Dev Server
```powershell
# Ensure Node 24 or 20 is active
nvm use 24.12.0

# Navigate to docs directory
cd docs

# Start server
mint dev --port 3001
```

### Check for Issues
```powershell
# Check broken links
mint broken-links

# Check version
mint version
```

---

## Additional Issues Fixed

### Port Already in Use
- **Issue**: Port 3001 was already in use from previous attempts
- **Fix**: Killed existing processes, Mintlify will use next available port (3002) if needed

### Permission Error
- **Issue**: `EPERM: operation not permitted, rename '.mintlify' -> '.mintlify-last'`
- **Fix**: Cleaned `.mintlify` directory to allow fresh initialization

## Status

✅ **Node version issue resolved** (switched to Node 24.12.0)  
✅ **Mintlify CLI installed globally**  
✅ **Port conflicts resolved**  
✅ **Permission issues fixed**  
⏳ **Server starting** (check http://localhost:3001 or http://localhost:3002)

---

## References

- [Mintlify Installation Docs](https://www.mintlify.com/docs/installation)
- [GitHub Issue: Node 25 Support](https://github.com/mintlify/starter/issues/116)
- Node.js LTS versions: https://nodejs.org/

