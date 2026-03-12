# Quick Reference Card

## Critical Environment Variables

| Variable | Value | Where to Get |
|----------|-------|-------------|
| `FLOWISE_API_URL` | `https://flowise-dev.moodmnky.com/api/v1` | Flowise Settings |
| `FLOWISE_API_KEY` | Your API Key | Flowise → Settings → API Keys |
| `FLOWISE_CHATFLOW_ID` | UUID from dashboard | Flowise chatflow details page |
| `MINIO_ENDPOINT` | `localhost` (dev) | Local or cloud MinIO address |
| `MINIO_ACCESS_KEY` | Access key | MinIO console or setup |
| `MINIO_SECRET_KEY` | Secret key | MinIO console or setup |
| `OPENAI_API_KEY` | Your API key | https://platform.openai.com/api-keys |

## API Endpoints Quick Reference

```
Storage (MinIO)
  POST   /api/storage?action=upload           Upload file
  GET    /api/storage?action=list             List files
  GET    /api/storage?action=download         Download file
  POST   /api/storage?action=presigned-url    Get temp URL

Flowise
  POST   /api/flowise?action=predict          Chat prediction
  GET    /api/flowise?action=history          Get chat history
  GET    /api/flowise?action=chatflows        List chatflows
  GET    /api/flowise?action=health           Service health

Context7
  GET    /api/context7?action=docs            Get documentation
  GET    /api/context7?action=search          Search docs
  GET    /api/context7?action=version         Get library version

Health
  GET    /api/health                          Overall system health
```

## Quick Commands

```bash
# Start development with Docker
docker-compose up

# Start without Docker
npm install
npm run dev

# Test health
curl http://localhost:3000/api/health

# Upload file
curl -X POST http://localhost:3000/api/storage?action=upload \
  -F "file=@test.pdf" -F "bucket=chat-documents"

# Test Flowise
curl -X POST http://localhost:3000/api/flowise?action=predict \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'

# Access MinIO console
# Open: http://localhost:9001
# User: minioadmin / minioadmin-password
```

## Service Ports

| Service | Port | URL |
|---------|------|-----|
| Chat App | 3000 | http://localhost:3000 |
| MinIO API | 9000 | http://localhost:9000 |
| MinIO Console | 9001 | http://localhost:9001 |
| Flowise | Remote | https://flowise-dev.moodmnky.com |

## Troubleshooting Quick Fixes

| Issue | Fix |
|-------|-----|
| "env vars not found" | Copy `.env.example` to `.env.local` and fill in values |
| "Flowise connection failed" | Check `FLOWISE_API_KEY` and `FLOWISE_API_URL` with curl |
| "MinIO bucket not found" | Create buckets in console or `docker-compose up` |
| "Port 3000 in use" | Change port: `npm run dev -- -p 3001` |
| "MinIO console won't load" | Check firewall; access from `localhost:9001` |

## File Locations

- Configuration: `.env.local` or `.env.example`
- API Routes: `app/api/*/route.ts`
- Services: `lib/services/*.service.ts`
- Setup Guide: `FLOWISE_SETUP_GUIDE.md`
- Deployment: `DEPLOYMENT_CHECKLIST.md`
- Summary: `INTEGRATION_SUMMARY.md`

## Key Concepts

**Backend Routing:** Chat automatically tries Flowise first, falls back to AI SDK if needed.

**Session Management:** Flowise sessions auto-expire after 24 hours; new sessions created automatically.

**Context7 Documentation:** Injected into system prompt for "Coder" agent mode; cached for 1 hour.

**MinIO Storage:** Files stored in buckets (images, documents, knowledge-base, projects) with presigned URLs.

**Health Checks:** `/api/health` shows status of Flowise, MinIO, Context7, and AI SDK.

---

**For detailed information, see the full guides:**
- Setup: [FLOWISE_SETUP_GUIDE.md](./FLOWISE_SETUP_GUIDE.md)
- Deploy: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- Summary: [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)
