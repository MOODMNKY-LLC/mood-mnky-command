# Mintlify Quick Actions Guide

**Reference**: [Mintlify Installation Docs](https://www.mintlify.com/docs/installation)

---

## ✅ Completed Actions

### 1. Broken Links Check
```bash
cd docs
mint broken-links
```
**Result**: 524 broken links found in 162 files  
**Log**: `mintlify-broken-links.log`

### 2. Accessibility Check
```bash
cd docs
mint a11y
```
**Result**: 
- ✅ Color contrast **FIXED** (updated dark color to #666666)
- ⚠️ 69 missing alt attributes found
**Log**: `mintlify-a11y.log`

### 3. OpenAPI Validation
```bash
cd docs
mint openapi-check api/devops/ollama/api/ollama.yaml
# Repeat for each spec
```
**Result**: ✅ All 6 OpenAPI specs are valid

---

## 🔧 Quick Fixes Applied

### Color Contrast Fix ✅
**File**: `docs/docs.json`  
**Change**: `"dark": "#333333"` → `"dark": "#666666"`  
**Impact**: Improves contrast ratio from 1.53:1 to ~4.5:1 (meets WCAG AA)

---

## 📋 Remaining Actions

### High Priority
1. **Add Alt Attributes** (69 missing)
   - Focus on `mintlify-docs/web-editor.mdx` (24 issues)
   - Add descriptive alt text to all images
   - Example: `![Description of image](./path/to/image.png)`

2. **Fix Broken Links** (524 broken)
   - Create missing agent overview pages
   - Fix image references
   - Create missing API documentation pages

### Medium Priority
3. **Create Missing Pages**
   - Agent overviews (`/agents/mood-mnky/overview`, etc.)
   - API endpoint documentation
   - Developer resource pages

4. **Fix Image References**
   - Create missing images or update paths
   - Add images to `/images/` directory

---

## 🚀 Useful Commands

### Check Status
```bash
# Check broken links
mint broken-links

# Check accessibility
mint a11y

# Check specific accessibility issues
mint a11y --skip-contrast      # Only check alt text
mint a11y --skip-alt-text      # Only check contrast

# Validate OpenAPI spec
mint openapi-check <filename>
```

### File Management
```bash
# Rename file and update all references
mint rename old-path.md new-path.md

# Migrate MDX endpoint pages
mint migrate-mdx
```

### Version Management
```bash
# Update CLI
mint update

# Check version
mint version
```

---

## 📊 Current Status

- ✅ **Node Version**: v24.12.0 (compatible)
- ✅ **Mintlify CLI**: 4.2.255 (latest)
- ✅ **Color Contrast**: Fixed
- ✅ **OpenAPI Specs**: All valid
- ⚠️ **Broken Links**: 524 found
- ⚠️ **Missing Alt Text**: 69 found

---

## 📝 Reports Generated

- `docs/MINTLIFY_MAINTENANCE_REPORT.md` - Comprehensive maintenance report
- `mintlify-broken-links.log` - Full broken links list
- `mintlify-a11y.log` - Full accessibility report

---

## 🔗 References

- [Mintlify Installation](https://www.mintlify.com/docs/installation)
- [Broken Links Command](https://www.mintlify.com/docs/installation#find-broken-links)
- [Accessibility Command](https://www.mintlify.com/docs/installation#find-accessibility-issues)
- [OpenAPI Check](https://www.mintlify.com/docs/installation#check-openapi-spec)



