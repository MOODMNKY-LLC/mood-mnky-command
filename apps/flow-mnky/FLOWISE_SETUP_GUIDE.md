## Flowise Integration Setup Guide

This guide walks you through setting up the complete Flowise integration with MinIO S3 storage, Context7 MCP, and the AI Chat interface.

---

### Phase 1: Environment Configuration

#### 1.1 Create `.env.local` file

Create a new file at the root of your project with the following environment variables:

```bash
# === Flowise Configuration ===
FLOWISE_API_URL=https://flowise-dev.moodmnky.com/api/v1
FLOWISE_API_KEY=your-flowise-api-key-here
FLOWISE_CHATFLOW_ID=your-chatflow-uuid-here
FLOWISE_STREAMING_ENABLED=true

# === MinIO S3-Compatible Storage ===
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin-password

# MinIO Bucket Names
MINIO_IMAGES_BUCKET=chat-images
MINIO_DOCUMENTS_BUCKET=chat-documents
MINIO_KNOWLEDGE_BUCKET=chat-knowledge-base
MINIO_PROJECTS_BUCKET=chat-projects

# === Context7 MCP Plugin ===
CONTEXT7_MCP_URL=https://mcp.context7.com/mcp
CONTEXT7_MCP_ENABLED=true
CONTEXT7_CACHE_TTL=3600

# === AI SDK Configuration ===
OPENAI_API_KEY=your-openai-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here
GOOGLE_GENERATIVE_AI_API_KEY=your-google-key-here

# === Feature Flags ===
USE_FLOWISE_FALLBACK=true
ENABLE_MINIO_STORAGE=true
ENABLE_CONTEXT7_MCP=true
```

#### 1.2 Get Your Credentials

**Flowise API Key & Chatflow ID:**
1. Log into your Flowise instance at https://flowise-dev.moodmnky.com
2. Navigate to **Settings** → **API Keys**
3. Create or copy an existing API key
4. Go to your chatflow and copy the **Chatflow ID** from the URL or dashboard
5. Update `.env.local` with both values

**AI SDK Keys:**
- **OpenAI**: Get from https://platform.openai.com/api-keys
- **Anthropic**: Get from https://console.anthropic.com/
- **Google**: Get from https://ai.google.dev/

---

### Phase 2: MinIO Setup

#### 2.1 Local Development Setup (Docker)

Install and run MinIO locally:

```bash
docker run -d \
  --name minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin-password \
  minio/minio server /data --console-address ":9001"
```

Access MinIO Console:
- URL: http://localhost:9001
- Username: `minioadmin`
- Password: `minioadmin-password`

#### 2.2 Create MinIO Buckets

Via MinIO Console:
1. Go to http://localhost:9001
2. Click **Create Bucket** for each of these:
   - `chat-images`
   - `chat-documents`
   - `chat-knowledge-base`
   - `chat-projects`

Or via CLI:
```bash
mc alias set minio http://localhost:9000 minioadmin minioadmin-password
mc mb minio/chat-images
mc mb minio/chat-documents
mc mb minio/chat-knowledge-base
mc mb minio/chat-projects
```

#### 2.3 Production MinIO Setup

For production, use Kubernetes with the MinIO Helm chart:

```bash
helm repo add minio https://charts.min.io
helm install minio-release minio/minio \
  --set rootUser=prod-user \
  --set rootPassword=prod-secure-password \
  --set persistence.enabled=true \
  --set persistence.size=500Gi
```

Update your `.env.local` with production values:
```bash
MINIO_ENDPOINT=minio-prod.yourdomain.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=prod-user
MINIO_SECRET_KEY=prod-secure-password
```

---

### Phase 3: Install Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

This installs the MinIO client and all other required dependencies.

---

### Phase 4: Verify Configuration

Run the environment validation check:

```bash
npm run dev
```

The application will validate all environment variables on startup. If any are missing or invalid, you'll see detailed error messages.

Check the health of all services:

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "flowise": { "available": true, "latency": 245 },
    "minio": { "available": true, "latency": 128 },
    "context7": { "available": true, "latency": 412 },
    "openai": { "available": true, "latency": 0 }
  },
  "timestamp": "2026-03-08T00:00:00.000Z",
  "uptime": 42.5
}
```

---

### Phase 5: Test File Upload

Using the chat interface:
1. Drag and drop a file into the chat input
2. Select the destination bucket (images, documents, etc.)
3. The file will upload to MinIO
4. You'll get a presigned URL for download

Or test via API:

```bash
curl -X POST http://localhost:3000/api/storage?action=upload \
  -F "file=@document.pdf" \
  -F "bucket=chat-documents"
```

---

### Phase 6: Test Flowise Integration

Switch to **Flowise Chatflow** in the model selector and send a message:

```bash
curl -X POST http://localhost:3000/api/flowise?action=predict \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello"}],
    "streaming": true
  }'
```

Check Flowise session health:

```bash
curl http://localhost:3000/api/flowise?action=health
```

---

### Phase 7: Production Deployment

#### 7.1 Set Environment Variables in Vercel

In your Vercel project dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add all variables from `.env.local`
3. For production, use secure, rotated credentials

#### 7.2 Deploy to Vercel

```bash
git add .
git commit -m "Add Flowise integration"
git push origin main
```

Vercel will automatically deploy. Verify via:
```bash
curl https://your-app-domain.vercel.app/api/health
```

#### 7.3 Configure Production MinIO

For Vercel deployment, ensure:
1. MinIO endpoint is publicly accessible (or use private networking)
2. MINIO_USE_SSL=true for production
3. Credentials are properly rotated (every 60 days)

---

### Troubleshooting

#### "FLOWISE_API_URL is not defined"
- Ensure `.env.local` is in the project root
- Restart the dev server after adding environment variables
- Check that variable names are exactly as specified

#### MinIO Connection Failed
```bash
# Test connectivity
telnet localhost 9000

# Check MinIO logs
docker logs minio

# Verify credentials
mc alias set minio http://localhost:9000 minioadmin minioadmin-password
mc ls minio
```

#### Flowise Connection Failed
```bash
# Test Flowise API
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://flowise-dev.moodmnky.com/api/v1/chatflow

# Check Flowise logs
docker logs flowise
```

#### Context7 MCP Not Working
- Verify CONTEXT7_MCP_URL is accessible
- Check cache by calling `/api/context7?action=cache-stats`
- Invalidate cache if needed: `POST /api/context7?action=invalidate-cache`

---

### API Endpoints Reference

**Storage Operations:**
- `POST /api/storage?action=upload` - Upload file
- `GET /api/storage?action=list&bucket=chat-documents` - List files
- `GET /api/storage?action=download&bucket=chat-documents&object=file.pdf` - Download file
- `POST /api/storage?action=presigned-url` - Generate presigned URL
- `DELETE /api/storage?action=delete` - Delete file

**Flowise Integration:**
- `POST /api/flowise?action=predict` - Get prediction from Flowise
- `GET /api/flowise?action=history&sessionId=` - Get chat history
- `GET /api/flowise?action=chatflows` - List available chatflows
- `POST /api/flowise?action=validate` - Validate Flowise connection

**Context7 Documentation:**
- `GET /api/context7?action=docs&libraries=nodejs,react` - Get documentation
- `GET /api/context7?action=examples&library=nodejs` - Get code examples
- `GET /api/context7?action=search&q=async` - Search documentation
- `GET /api/context7?action=version&library=react` - Get library version

**Health & Monitoring:**
- `GET /api/health` - Overall health check
- `GET /api/flowise?action=health` - Flowise health
- `GET /api/context7?action=cache-stats` - Context7 cache statistics

---

### Credential Rotation Schedule

| Component | Rotation Interval | Update Location |
|-----------|------------------|-----------------|
| Flowise API Key | 30 days | Flowise Settings → API Keys |
| MinIO Access Key | 60 days | MinIO Console or Kubernetes secret |
| MinIO Secret Key | 60 days | MinIO Console or Kubernetes secret |
| OpenAI API Key | 60 days | OpenAI Dashboard |
| Anthropic API Key | 60 days | Anthropic Console |

---

### Monitoring & Logs

**View application logs:**
```bash
npm run dev  # Shows real-time logs with [v0] prefix for integration events
```

**Key metrics to monitor:**
- Chat API response time (target: <2s)
- Flowise prediction latency (target: <5s)
- MinIO upload/download speed (target: >5MB/s)
- Service health check status
- Error rates by service

**Enable detailed logging:**
Add to your code for debugging:
```typescript
console.log("[v0] Debug message here")
```

These logs will appear in the console and Vercel's real-time logs dashboard.
