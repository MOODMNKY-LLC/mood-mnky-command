# MOOD MNKY Docker Stack Integration Guide

Complete guide for integrating the Docker Compose stack (Flowise, n8n, Redis, PostgreSQL) with the MOOD MNKY Next.js application.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              MOOD MNKY Next.js Application                  │
│                 (Vercel Deployment)                         │
└────────────┬────────────────────────────────────────────────┘
             │
             │ HTTP/API Calls
             │
    ┌────────┴──────────────┬──────────────┬─────────────────┐
    │                       │              │                 │
    ▼                       ▼              ▼                 ▼
┌─────────┐         ┌──────────┐    ┌─────────┐      ┌─────────────┐
│ Flowise │         │   n8n    │    │ Supabase│      │     Redis   │
│ (3000)  │         │ (5678)   │    │(Remote) │      │   (Local)   │
└────┬────┘         └────┬─────┘    └────┬────┘      └─────────────┘
     │                   │              │
     └───────────────────┴──────────────┘
                   │
                   ▼
           ┌───────────────────┐
           │   PostgreSQL      │
           │    (5432)         │
           └───────────────────┘
```

## Environment Setup

### Local Development

1. **Start Docker Stack**
   ```bash
   cd docker-compose
   ./init.sh
   ```

2. **Update Next.js .env.local**
   ```bash
   # .env.local
   FLOWISE_URL=http://localhost:3000
   FLOWISE_API_KEY=your_flowise_api_key
   
   N8N_API_URL=http://localhost:5678
   N8N_API_KEY=your_n8n_api_key
   
   # Supabase (can use local Docker instance or cloud)
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Start Next.js App**
   ```bash
   npm run dev
   ```

### Production

1. **Docker Stack on VPS/Cloud**
   - Deploy docker-compose stack to production server
   - Use proper SSL certificates
   - Configure strong passwords

2. **Next.js on Vercel**
   - Set environment variables in Vercel dashboard
   - Use stable URLs for Flowise and n8n
   - Configure CORS appropriately

## API Integration Points

### 1. Flowise Integration

#### Chat API Usage

```typescript
// lib/flowise-client.ts

export async function chatWithFlowise(
  chatflowId: string,
  question: string,
  sessionId?: string
): Promise<string> {
  const flowise_url = process.env.FLOWISE_URL
  const flowise_api_key = process.env.FLOWISE_API_KEY

  const response = await fetch(
    `${flowise_url}/api/v1/prediction/${chatflowId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${flowise_api_key}`,
      },
      body: JSON.stringify({
        question,
        sessionId,
        overrideConfig: {
          temperature: 0.7,
          top_p: 0.9,
        },
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Flowise error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.text
}
```

#### Get Available Chatflows

```typescript
export async function listFlowiseFlows(): Promise<ChatFlow[]> {
  const flowise_url = process.env.FLOWISE_URL
  const flowise_api_key = process.env.FLOWISE_API_KEY

  const response = await fetch(`${flowise_url}/api/v1/chatflows`, {
    headers: {
      'Authorization': `Bearer ${flowise_api_key}`,
    },
  })

  const data = await response.json()
  return data
}
```

#### Get Flowise API Key

1. Access Flowise at http://localhost:3000
2. Go to Settings → API Keys
3. Create a new API key
4. Copy and save it

### 2. n8n Integration

#### Trigger Workflow

```typescript
// lib/n8n-client.ts

export async function triggerN8nWorkflow(
  workflowId: string,
  data: Record<string, any>
): Promise<any> {
  const n8n_url = process.env.N8N_API_URL
  const n8n_api_key = process.env.N8N_API_KEY

  const response = await fetch(
    `${n8n_url}/api/v1/workflows/${workflowId}/execute`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${n8n_api_key}`,
      },
      body: JSON.stringify(data),
    }
  )

  if (!response.ok) {
    throw new Error(`n8n error: ${response.statusText}`)
  }

  return response.json()
}
```

#### Execute Workflow via Webhook

```typescript
export async function executeN8nWorkflow(
  webhookUrl: string,
  data: Record<string, any>
): Promise<any> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  return response.json()
}
```

#### Get n8n Credentials

1. Access n8n at http://localhost:5678
2. Go to Settings → API Keys
3. Create API key (required for non-webhook operations)
4. For webhooks, n8n generates URLs automatically

### 3. Redis Integration

#### Cache Chat Results

```typescript
// lib/redis-client.ts

import { createClient } from 'redis'

const redis = createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
})

export async function cacheResult(
  key: string,
  value: string,
  ttl: number = 3600
): Promise<void> {
  await redis.setEx(key, ttl, value)
}

export async function getCache(key: string): Promise<string | null> {
  return redis.get(key)
}

export async function invalidateCache(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern)
  if (keys.length > 0) {
    await redis.del(keys)
  }
}
```

### 4. Supabase Integration (with Docker PostgreSQL)

#### Connect to Docker PostgreSQL

For local development using Docker PostgreSQL instead of Supabase Cloud:

```typescript
// lib/supabase/server.ts

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  // Use local Docker PostgreSQL
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:5432',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // ignored
          }
        },
      },
    }
  )
}
```

## API Route Examples

### Chat Endpoint with Flowise

```typescript
// app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { chatWithFlowise } from '@/lib/flowise-client'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { threadId, content, chatflowId } = await request.json()
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get response from Flowise
    const response = await chatWithFlowise(
      chatflowId,
      content,
      threadId
    )

    // Save to database
    const supabase = await createClient()
    await supabase.from('messages').insert([
      {
        thread_id: threadId,
        user_id: user.id,
        content: response,
        role: 'assistant',
      },
    ])

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Webhook for n8n

```typescript
// app/api/webhooks/n8n/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Verify webhook signature (if configured in n8n)
    const signature = request.headers.get('X-N8N-Signature')
    if (!verifySignature(signature, JSON.stringify(data))) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Process workflow result
    const supabase = await createClient()
    await supabase.from('workflow_results').insert([
      {
        data,
        processed_at: new Date().toISOString(),
      },
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
```

## Service Credentials Configuration

### Flowise API Key Setup

1. Login to Flowise
2. Click Settings (top right)
3. Go to API Keys tab
4. Click "Add API Key"
5. Save the key securely

### n8n API Key Setup

1. Login to n8n
2. Click Settings (bottom left)
3. Go to API tab
4. Click "Create API Key"
5. Save the key securely

### n8n Webhook Setup

1. In your workflow, add "Webhook" node
2. Set method to POST
3. Copy the webhook URL (automatically generated)
4. Use in your app to trigger workflows

## Environment Variables Reference

```bash
# Local Development (.env.local)
FLOWISE_URL=http://localhost:3000
FLOWISE_API_KEY=key_from_flowise_settings

N8N_API_URL=http://localhost:5678
N8N_API_KEY=key_from_n8n_settings

# Optional: Cache/Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Supabase (can be cloud or local Docker)
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

# Production (.env.production)
FLOWISE_URL=https://flowise.yourdomain.com
FLOWISE_API_KEY=production_key

N8N_API_URL=https://n8n.yourdomain.com
N8N_API_KEY=production_key
```

## Error Handling

### Flowise Connection Error

```typescript
try {
  const response = await chatWithFlowise(chatflowId, message)
} catch (error) {
  if (error.message.includes('ECONNREFUSED')) {
    console.error('Flowise is not running or not accessible')
    // Fallback to OpenAI
    return fallbackToOpenAI(message)
  }
  throw error
}
```

### n8n Timeout

```typescript
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 30000)

try {
  const response = await fetch(webhookUrl, {
    signal: controller.signal,
  })
} finally {
  clearTimeout(timeoutId)
}
```

## Performance Optimization

### Caching Strategy

```typescript
async function getCachedResponse(
  key: string,
  fetcher: () => Promise<string>
): Promise<string> {
  const cached = await getCache(key)
  if (cached) {
    return cached
  }

  const result = await fetcher()
  await cacheResult(key, result, 3600) // 1 hour TTL
  return result
}
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit'

export const flowise_limiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 100,                  // 100 requests per minute
  message: 'Too many requests to Flowise',
})

export const n8n_limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: 'Too many requests to n8n',
})
```

## Monitoring

### Health Check Endpoint

```typescript
// app/api/health/route.ts

export async function GET() {
  const health = {
    flowise: await checkFlowise(),
    n8n: await checkN8n(),
    redis: await checkRedis(),
    database: await checkDatabase(),
    timestamp: new Date().toISOString(),
  }

  const isHealthy = Object.values(health).every(v => v === 'ok')
  
  return Response.json(health, {
    status: isHealthy ? 200 : 503,
  })
}
```

### Logging

```typescript
import winston from 'winston'

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
})

logger.info('Flowise request', {
  chatflowId,
  duration: Date.now() - start,
  status: response.status,
})
```

## Testing

### Unit Test Example

```typescript
import { chatWithFlowise } from '@/lib/flowise-client'

describe('Flowise Integration', () => {
  it('should chat with Flowise', async () => {
    const response = await chatWithFlowise(
      'test-chatflow-id',
      'Hello'
    )
    expect(response).toBeDefined()
    expect(typeof response).toBe('string')
  })

  it('should handle errors gracefully', async () => {
    await expect(
      chatWithFlowise('invalid-id', 'Hello')
    ).rejects.toThrow()
  })
})
```

## Support

For issues with integration:
- Check Flowise logs: `docker-compose logs flowise`
- Check n8n logs: `docker-compose logs n8n`
- Verify API keys are correctly set
- Ensure services are healthy: `docker-compose ps`
- Review MOOD MNKY application logs
