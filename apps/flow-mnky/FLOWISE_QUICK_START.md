# Flowise + MinIO + Chat Integration - Quick Start

You've successfully configured your environment with:
- **Flowise**: flowise-dev.moodmnky.com
- **MinIO**: S3-compatible storage
- **Context7 MCP**: Documentation integration

## ✅ What's Ready

Your chat interface now has full Flowise integration with:
- **Hybrid Backend Routing** - Toggle between Flowise and AI SDK native models
- **Automatic Fallback** - If Flowise fails, seamlessly switches to AI SDK
- **Context7 Documentation** - Real-time docs injected into coder mode
- **MinIO Storage** - File uploads and knowledge base management
- **Session Management** - Tracks Flowise sessions with auto-cleanup

## 🚀 Getting Started

### Step 1: Verify Connection
Check if all services are connected:
```bash
curl http://localhost:3000/api/verify-flowise
```

Expected response shows your Flowise chatflows and connection status.

### Step 2: Test the Chat
1. Open http://localhost:3000
2. Notice the **"Flowise"** button in the top right (default enabled)
3. Type a message and send
4. Chat routes to Flowise by default
5. Click **"Flowise"** button to switch to AI SDK native models

### Step 3: Upload Files (MinIO)
1. Use the attachment button in chat to upload images or documents
2. Files are stored in MinIO S3 buckets
3. References are automatically available in chat context

### Step 4: Configure Chatflow (Important!)
Your Flowise instance needs at least one chatflow:
1. Go to https://flowise-dev.moodmnky.com
2. Create a new chatflow with a chat node
3. Configure it with your LLM (OpenAI, Anthropic, etc.)
4. The first chatflow will automatically be used by the chat interface

## 📝 Key Features

### Flowise Toggle Button
- **Flowise** (default): Uses your production Flowise instance
- **AI SDK**: Falls back to native AI models (GPT-4o, Claude, Gemini)
- Click to switch between modes on the fly

### Agent Modes with Flowise
- **General**: Standard chat through Flowise
- **Coder**: Flowise + Context7 documentation injection
- **Writer/Analyst/Researcher**: Specialized modes with knowledge base

### Session Tracking
- Each temporary chat session gets a unique ID
- Flowise sessions track message count
- Auto-cleanup after 24 hours
- Source documents returned from knowledge base

## 🔧 Environment Variables

All your environment variables are set:
- ✓ FLOWISE_HOST_URL
- ✓ FLOWISE_API_KEY
- ✓ MINIO_ROOT_USER
- ✓ MINIO_ROOT_PASSWORD
- ✓ MINIO_ENDPOINT
- ✓ MINIO_PORT
- ✓ MINIO_USE_SSL
- ✓ MINIO_BUCKET_* (images, documents, knowledge, projects)
- ✓ OPENAI_API_KEY

## 🐛 Troubleshooting

### "No chatflow found"
- Go to Flowise dashboard
- Create at least one chatflow
- The first chatflow will be auto-selected

### Flowise returns 401 error
- Check FLOWISE_API_KEY is correct
- Verify it's valid in Flowise dashboard settings
- Test with: `curl -H "Authorization: Bearer YOUR_KEY" https://flowise-dev.moodmnky.com/api/v1/chatflows`

### MinIO connection fails
- Verify MINIO_ENDPOINT and MINIO_PORT
- Check MINIO_ROOT_USER and MINIO_ROOT_PASSWORD
- Ensure SSL setting (MINIO_USE_SSL) matches your setup

### Chat not responding
1. Check `/api/verify-flowise` for service status
2. Look at browser console for errors
3. Check server logs for `[v0]` debug messages
4. Try switching to AI SDK mode to isolate Flowise issues

## 📊 API Endpoints

- `POST /api/chat` - Main chat endpoint (routes to Flowise or AI SDK)
- `GET /api/verify-flowise` - Check service connectivity
- `POST /api/storage` - File upload/download
- `POST /api/flowise` - Direct Flowise operations
- `POST /api/context7` - Documentation fetch
- `GET /api/health` - System health check

## 🎯 Next Steps

1. **Create a Flowise chatflow** with your preferred LLM
2. **Test the chat** with both Flowise and AI SDK modes
3. **Upload test files** to MinIO
4. **Configure knowledge base** in Flowise if using document retrieval
5. **Deploy to production** when ready

## 📚 Documentation

- See `FLOWISE_SETUP_GUIDE.md` for detailed setup
- See `DEPLOYMENT_CHECKLIST.md` for production deployment
- See `QUICK_REFERENCE.md` for API reference

Happy chatting! 🎉
