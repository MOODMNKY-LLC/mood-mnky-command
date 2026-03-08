# AI Chat Studio - Flowise Integration Complete

A production-ready Next.js chat interface with integrated Flowise AI backend, MinIO S3 storage, and Context7 documentation plugin. Features glassmorphic design, theme switching, voice controls, and seamless hybrid backend routing.

## What's New

This project now includes **complete Flowise integration** with:

- ✅ Flowise API bridge for chatflow predictions
- ✅ MinIO S3-compatible storage for files, documents, and knowledge base
- ✅ Context7 MCP plugin for real-time documentation
- ✅ Hybrid backend routing (Flowise or AI SDK)
- ✅ Automatic fallback when services are unavailable
- ✅ Comprehensive health monitoring
- ✅ Production-ready deployment configuration

## Quick Start

### Option 1: Docker (Recommended)

```bash
# 1. Setup environment
cp .env.example .env.local
# Edit .env.local with your credentials

# 2. Run everything
docker-compose up

# 3. Open your browser
# App: http://localhost:3000
# MinIO: http://localhost:9001
```

### Option 2: Local Development

```bash
# 1. Setup environment
cp .env.example .env.local
# Edit .env.local with your credentials

# 2. Start MinIO (if not using Docker)
# Use local MinIO or cloud instance

# 3. Install and run
npm install
npm run dev

# Open http://localhost:3000
```

## Documentation

**Start with these in order:**

1. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - API endpoints and quick commands
2. **[FLOWISE_SETUP_GUIDE.md](./FLOWISE_SETUP_GUIDE.md)** - Complete setup guide (7 phases)
3. **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Pre-deployment verification
4. **[INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)** - Architecture and file structure

## Key Features

### Chat Interface
- Multiple AI models (GPT-4o, Claude, Gemini)
- 5 agent modes (General, Coder, Writer, Analyst, Researcher)
- Glassmorphic design with light/dark theme
- Voice input/output (STT, TTS, S2S)
- File uploads and knowledge base integration

### Integrations
- **Flowise**: Production LLM deployment at flowise-dev.moodmnky.com
- **MinIO**: S3-compatible storage for files and documents
- **Context7 MCP**: Up-to-date documentation for code assistants
- **AI SDK**: Native access to OpenAI, Anthropic, Google models

### Production Ready
- Health checks for all services
- Comprehensive error handling
- Automatic fallback mechanisms
- Detailed logging with [v0] prefix
- Security best practices

## Environment Variables

See `.env.example` for complete reference. Minimum required:

```bash
FLOWISE_API_URL=https://flowise-dev.moodmnky.com/api/v1
FLOWISE_API_KEY=your-key-here
FLOWISE_CHATFLOW_ID=your-chatflow-id
MINIO_ENDPOINT=localhost (or your MinIO server)
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=your-password
OPENAI_API_KEY=your-key-here (or ANTHROPIC_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY)
```

## API Routes

```
Storage Operations
  POST   /api/storage?action=upload
  GET    /api/storage?action=list
  GET    /api/storage?action=download

Flowise Integration  
  POST   /api/flowise?action=predict
  GET    /api/flowise?action=history
  GET    /api/flowise?action=chatflows

Context7 Documentation
  GET    /api/context7?action=docs
  GET    /api/context7?action=search
  GET    /api/context7?action=version

Health & Monitoring
  GET    /api/health
  GET    /api/flowise?action=health
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Chat Interface (Next.js)                 │
│  - Model Selector  - Agent Modes  - Voice Controls          │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
    ┌────────┐    ┌──────────┐    ┌──────────┐
    │ Flowise│    │ AI SDK   │    │ Context7 │
    │ Bridge │    │ (Native) │    │ (MCP)    │
    └────────┘    └──────────┘    └──────────┘
        │
        ├─→ /api/flowise
        ├─→ /api/storage (MinIO)
        ├─→ /api/context7
        └─→ /api/health
```

## File Structure

```
app/
├── api/
│   ├── chat/route.ts          ← Enhanced with Flowise routing
│   ├── flowise/route.ts       ← Flowise API bridge
│   ├── storage/route.ts       ← MinIO S3 operations
│   ├── context7/route.ts      ← Documentation plugin
│   └── health/route.ts        ← Service health checks
└── [other pages]

lib/
├── services/
│   ├── flowise.service.ts     ← Flowise integration
│   ├── minio.service.ts       ← S3 storage
│   └── context7-mcp.service.ts← Documentation
├── env-validation.ts          ← Config validation
└── chat-store.ts              ← Enhanced types

components/
└── chat/
    ├── chat-interface.tsx
    ├── model-selector.tsx
    ├── agent-mode-selector.tsx
    └── [other components]
```

## Testing

```bash
# Test system health
curl http://localhost:3000/api/health

# Upload a file
curl -X POST http://localhost:3000/api/storage?action=upload \
  -F "file=@document.pdf" \
  -F "bucket=chat-documents"

# Test Flowise
curl -X POST http://localhost:3000/api/flowise?action=predict \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'

# Get documentation
curl "http://localhost:3000/api/context7?action=docs&libraries=nodejs"
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Environment validation failed" | Copy `.env.example` to `.env.local` and fill in values |
| "Flowise connection failed" | Verify API key and URL; test with curl |
| "MinIO bucket not found" | Run `docker-compose up` or create buckets manually |
| "Context7 docs not loading" | Check internet; inspect cache at `/api/context7?action=cache-stats` |
| "Port 3000 in use" | Change port: `npm run dev -- -p 3001` |

## Deployment

1. **Local Testing**: Use Docker Compose for complete setup
2. **Vercel Deployment**: Add environment variables in project settings
3. **Production MinIO**: Use Kubernetes + Helm for scalability
4. **Monitoring**: Check `/api/health` regularly

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for detailed steps.

## Security

- API keys in `.env.local` (never committed)
- All connections use HTTPS
- MinIO access controlled via bucket policies
- Credentials rotated every 30-60 days
- Request authentication validated server-side

## Support & Documentation

- **Setup Guide**: [FLOWISE_SETUP_GUIDE.md](./FLOWISE_SETUP_GUIDE.md)
- **Deployment**: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)  
- **Architecture**: [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)
- **Quick Reference**: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

## Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **AI**: AI SDK 6, Flowise, OpenAI/Anthropic/Google APIs
- **Storage**: MinIO (S3-compatible)
- **Documentation**: Context7 MCP
- **Styling**: Tailwind CSS v4, Glassmorphism effects
- **UI**: shadcn/ui, Radix UI

---

**Ready to deploy?** Start with [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) then follow [FLOWISE_SETUP_GUIDE.md](./FLOWISE_SETUP_GUIDE.md).

**Questions?** Check [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md) for detailed architecture information.
