---
title: API Hooks
agent: mood-mnky
description: "Integration endpoints and event hooks for the MOOD MNKY agent"
---

# MOOD MNKY API Integration

<div className="mood-mnky-section p-4 rounded-lg mb-6">
This document provides comprehensive details on integrating with the MOOD MNKY agent through its API endpoints, event hooks, and webhooks. These integration points enable developers to incorporate MOOD MNKY's personalization and customer experience capabilities into custom applications and services.
</div>

## Integration Overview

The MOOD MNKY agent provides multiple integration pathways to fit different implementation needs:

1. **REST API** - Direct request/response pattern for immediate interactions
2. **WebSocket API** - Real-time bidirectional communication for conversational interfaces
3. **Event Hooks** - Subscription-based notifications for platform events
4. **Webhooks** - Custom HTTP callbacks for integration with external systems
5. **Client Libraries** - Pre-built SDKs for common development platforms

## Authentication and Access

All MOOD MNKY API integrations require proper authentication:

```typescript
// Authentication example with API key
const moodMnkyClient = new MoodMnkyClient({
  apiKey: process.env.MOOD_MNKY_API_KEY,
  environment: 'production', // or 'staging', 'development'
  version: 'v1'
});

// JWT-based authentication for user context
const userClient = moodMnkyClient.withUserContext({
  userToken: userJwtToken, // JWT representing the authenticated user
  sessionId: 'session_12345' // Optional session tracking
});
```

API keys can be generated and managed in the MOOD MNKY developer portal, with different scopes available based on integration needs:

| Scope | Description | Typical Use Case |
|-------|-------------|------------------|
| `profile:read` | Access user profile data | Personalization features |
| `profile:write` | Update user profile data | Preference collection |
| `conversation:create` | Start new conversations | Chat implementations |
| `recommendation:read` | Retrieve recommendations | Product suggestions |
| `event:publish` | Publish events to MOOD MNKY | Activity tracking |
| `webhook:manage` | Manage webhook configurations | Integration setup |

## REST API Endpoints

### User Profile Management

```typescript
// Fetch user profile with preferences
const userProfile = await moodMnkyClient.users.getProfile('user_123');

// Update scent preferences
await moodMnkyClient.users.updatePreferences('user_123', {
  scentPreferences: {
    favoriteNotes: ['lavender', 'bergamot', 'sandalwood'],
    intensity: 'moderate',
    allergies: ['musk']
  }
});

// Get personalization vector
const personalizationVector = await moodMnkyClient.users.getPersonalizationVector('user_123', {
  dimensions: ['scent', 'self-care', 'product']
});
```

### Conversation Management

```typescript
// Start a new conversation
const conversation = await moodMnkyClient.conversations.create({
  userId: 'user_123',
  initialContext: {
    location: 'product_page',
    productId: 'prod_custom_candle',
    userIntent: 'product_guidance'
  }
});

// Send user message
const response = await moodMnkyClient.conversations.sendMessage(conversation.id, {
  type: 'text',
  content: "I'm looking for a calming scent for evening relaxation.",
  attachments: []
});

// End conversation
await moodMnkyClient.conversations.close(conversation.id, {
  endReason: 'completed',
  feedback: {
    helpful: true,
    comments: "Found exactly what I needed"
  }
});
```

### Personalization Services

```typescript
// Get personalized product recommendations
const recommendations = await moodMnkyClient.personalization.getRecommendations({
  userId: 'user_123',
  context: {
    location: 'home_page',
    recentViews: ['prod_123', 'prod_456'],
    interactionHistory: ['viewed_fragrance_guide', 'completed_scent_quiz']
  },
  recommendationType: 'product',
  count: 5
});

// Get personalized content recommendations
const contentSuggestions = await moodMnkyClient.personalization.getContentRecommendations({
  userId: 'user_123',
  contentType: ['article', 'video', 'guide'],
  interests: 'inferred', // or specific tags
  count: 3
});

// Generate personalized messaging
const personalizedCopy = await moodMnkyClient.personalization.generateCopy({
  userId: 'user_123',
  template: 'product_description',
  parameters: {
    productId: 'prod_789',
    highlightFeatures: true,
    tone: 'conversational'
  }
});
```

### Experience Orchestration

```typescript
// Log user interaction
await moodMnkyClient.experiences.trackInteraction({
  userId: 'user_123',
  interactionType: 'product_view',
  entityId: 'prod_789',
  context: {
    referrer: 'search',
    duration: 45, // seconds
    depth: 'detailed'
  }
});

// Get next best action
const nextAction = await moodMnkyClient.experiences.getNextBestAction({
  userId: 'user_123',
  currentLocation: 'cart_page',
  context: {
    cartItems: ['prod_123', 'prod_456'],
    totalValue: 85.97,
    sessionDuration: 420
  }
});

// Generate journey milestone
const milestone = await moodMnkyClient.experiences.createMilestone({
  userId: 'user_123',
  milestoneType: 'scent_profile_completion',
  achievements: {
    profileCompleteness: 100,
    notesIdentified: 15,
    preferencesCollected: true
  }
});
```

## WebSocket API

For real-time interactive experiences, the WebSocket API provides a persistent connection:

```typescript
// Client-side WebSocket integration
import { MoodMnkyWebSocketClient } from '@mood-mnky/web-client';

const wsClient = new MoodMnkyWebSocketClient({
  apiKey: 'YOUR_PUBLIC_API_KEY',
  userId: 'user_123',
  sessionId: 'session_456'
});

// Connection management
wsClient.connect();

wsClient.on('connect', () => {
  console.log('Connected to MOOD MNKY');
});

wsClient.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

// Conversation handling
wsClient.on('message', (message) => {
  console.log('New message from MOOD MNKY:', message);
  updateChatInterface(message);
});

// Send user message
const sendUserMessage = (text) => {
  wsClient.send({
    type: 'user_message',
    content: text
  });
};

// Request specific actions
const requestRecommendation = () => {
  wsClient.send({
    type: 'action_request',
    action: 'recommend_products',
    parameters: {
      category: 'candles',
      count: 3
    }
  });
};
```

## Event Hooks

Subscribe to platform events to maintain synchronization with MOOD MNKY:

```typescript
// Subscribe to events
await moodMnkyClient.events.subscribe({
  eventTypes: [
    'user.preference_updated',
    'user.scent_profile_created',
    'conversation.completed',
    'product.recommended'
  ],
  destination: {
    type: 'webhook',
    url: 'https://your-app.com/mood-mnky-events',
    secret: 'your_webhook_secret'
  },
  filters: {
    users: ['*'], // all users, or specific user IDs
    environments: ['production']
  }
});

// List active subscriptions
const subscriptions = await moodMnkyClient.events.listSubscriptions();

// Unsubscribe
await moodMnkyClient.events.unsubscribe('subscription_789');
```

### Available Event Types

| Event Category | Event Type | Description |
|----------------|------------|-------------|
| User | `user.created` | New user registered |
| User | `user.preference_updated` | User preferences changed |
| User | `user.scent_profile_created` | User completed scent profile |
| User | `user.milestone_achieved` | User reached experience milestone |
| Conversation | `conversation.started` | New conversation initiated |
| Conversation | `conversation.message_sent` | Message sent in conversation |
| Conversation | `conversation.completed` | Conversation ended |
| Product | `product.viewed` | User viewed product |
| Product | `product.recommended` | Products recommended to user |
| Product | `product.custom_created` | Custom product created |
| Order | `order.created` | New order placed |
| Order | `order.status_updated` | Order status changed |
| Content | `content.engaged` | User engaged with content |

## Webhook Integration

Set up webhooks to receive real-time notifications:

```typescript
// Register webhook
const webhook = await moodMnkyClient.webhooks.create({
  url: 'https://your-app.com/webhooks/mood-mnky',
  secret: 'your_signing_secret',
  description: 'Production event notifications',
  events: [
    'user.preference_updated',
    'conversation.completed',
    'product.recommended'
  ],
  isActive: true
});

// Update webhook
await moodMnkyClient.webhooks.update(webhook.id, {
  events: [
    'user.preference_updated',
    'conversation.completed',
    'product.recommended',
    'order.created' // Added new event
  ]
});

// Delete webhook
await moodMnkyClient.webhooks.delete(webhook.id);
```

### Webhook Payload Format

```typescript
// Example webhook payload
{
  "id": "evt_123456789",
  "timestamp": "2023-06-15T14:30:45Z",
  "type": "user.preference_updated",
  "environment": "production",
  "version": "1.0",
  "data": {
    "userId": "user_123",
    "preferences": {
      "scentPreferences": {
        "favoriteNotes": ["lavender", "bergamot", "sandalwood"],
        "intensity": "moderate",
        "allergies": ["musk"]
      }
    },
    "updatedBy": "user", // or 'system', 'agent'
    "updatedAt": "2023-06-15T14:30:40Z"
  }
}
```

### Webhook Security

Verify webhook authenticity by checking the signature:

```typescript
// Node.js example for webhook signature verification
import crypto from 'crypto';

function verifyWebhookSignature(req, secret) {
  const signature = req.headers['x-mood-mnky-signature'];
  const timestamp = req.headers['x-mood-mnky-timestamp'];
  
  // Recreate the signature
  const payload = timestamp + '.' + JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  // Use constant-time comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Express.js webhook handler example
app.post('/webhooks/mood-mnky', (req, res) => {
  const isValid = verifyWebhookSignature(req, process.env.WEBHOOK_SECRET);
  
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }
  
  const event = req.body;
  
  // Process different event types
  switch (event.type) {
    case 'user.preference_updated':
      updateUserPreferences(event.data);
      break;
    case 'conversation.completed':
      analyzeConversation(event.data);
      break;
    // Handle other events
  }
  
  // Acknowledge receipt
  res.status(200).send('Webhook received');
});
```

## Client Libraries

MOOD MNKY provides official client libraries for common platforms:

### JavaScript/TypeScript

```typescript
// Browser client with user authentication
import { MoodMnkyClient } from '@mood-mnky/browser-client';

const client = new MoodMnkyClient({
  publicKey: 'YOUR_PUBLIC_KEY',
  userToken: await getUserToken() // from your auth system
});

// React hooks integration
import { useMoodMnky, MoodMnkyProvider } from '@mood-mnky/react';

function App() {
  return (
    <MoodMnkyProvider apiKey="YOUR_PUBLIC_KEY">
      <ProductPage />
    </MoodMnkyProvider>
  );
}

function ProductPage() {
  const { 
    userProfile,
    getRecommendations,
    startConversation,
    isLoading
  } = useMoodMnky();
  
  const [recommendations, setRecommendations] = useState([]);
  
  useEffect(() => {
    async function loadRecommendations() {
      const recs = await getRecommendations({
        type: 'product',
        count: 3
      });
      setRecommendations(recs);
    }
    
    if (userProfile) {
      loadRecommendations();
    }
  }, [userProfile, getRecommendations]);
  
  // Rest of component
}
```

### Server-Side Node.js

```typescript
// Node.js server integration
import { MoodMnkyServer } from '@mood-mnky/node';

const mnkyServer = new MoodMnkyServer({
  apiKey: process.env.MOOD_MNKY_API_KEY,
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
});

// Express middleware for user context
app.use(async (req, res, next) => {
  if (req.user) {
    req.moodMnky = mnkyServer.withUserContext({
      userId: req.user.id,
      sessionId: req.sessionID
    });
  }
  next();
});

// Use in route handler
app.get('/recommended-products', async (req, res) => {
  try {
    const recommendations = await req.moodMnky.getRecommendations({
      type: 'product',
      count: 5
    });
    
    res.json(recommendations);
  } catch (error) {
    console.error('MOOD MNKY API error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});
```

## Integration Patterns

### E-commerce Integration

Enhance your Shopify or custom e-commerce platform with MOOD MNKY's personalization:

```typescript
// Product recommendation component
import { useMoodMnky } from '@mood-mnky/react';

function ProductRecommendations({ currentProductId, placement }) {
  const { getRecommendations, isLoading } = useMoodMnky();
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    async function fetchRecommendations() {
      const recommendations = await getRecommendations({
        type: 'product',
        context: {
          currentProduct: currentProductId,
          placement: placement,
        },
        count: placement === 'product_page' ? 4 : 3
      });
      
      // Fetch full product details from your e-commerce system
      const productDetails = await fetchProductsByIds(
        recommendations.map(rec => rec.productId)
      );
      
      setProducts(productDetails);
    }
    
    fetchRecommendations();
  }, [currentProductId, placement, getRecommendations]);
  
  if (isLoading) return <RecommendationsSkeleton />;
  
  return (
    <div className="product-recommendations">
      <h3>{getRecommendationTitle(placement)}</h3>
      <div className="products-grid">
        {products.map(product => (
          <ProductCard 
            key={product.id}
            product={product}
            tracking={{
              source: 'mood_mnky_recommendation',
              placement: placement
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

### Chat Integration

Integrate the MOOD MNKY conversational interface:

```typescript
// React chat component
import { useMoodMnkyChat } from '@mood-mnky/react';

function MoodMnkyChat({ placement, initialContext = {} }) {
  const {
    messages,
    sendMessage,
    isTyping,
    chatState,
    startChat,
    endChat
  } = useMoodMnkyChat({
    initialContext: {
      ...initialContext,
      placement
    }
  });
  
  const [userInput, setUserInput] = useState('');
  
  const handleSend = () => {
    if (userInput.trim()) {
      sendMessage({
        type: 'text',
        content: userInput
      });
      setUserInput('');
    }
  };
  
  return (
    <div className="mood-mnky-chat">
      <div className="chat-header">
        <h3>MOOD MNKY Assistant</h3>
        <button onClick={endChat}>Close</button>
      </div>
      
      <div className="message-container">
        {messages.map(message => (
          <ChatMessage 
            key={message.id}
            message={message}
          />
        ))}
        
        {isTyping && <TypingIndicator />}
      </div>
      
      <div className="input-area">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask MOOD MNKY..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
```

### Custom Fragrance Creation Flow

Integrate with the MOOD MNKY fragrance creation capabilities:

```typescript
// Scent profile and custom product creation
import { useMoodMnkyScentProfile } from '@mood-mnky/react';

function ScentProfileCreator() {
  const {
    scentProfile,
    updatePreference,
    saveProfile,
    generateProductRecommendation,
    isLoading
  } = useMoodMnkyScentProfile();
  
  const [step, setStep] = useState('preferences');
  const [recommendation, setRecommendation] = useState(null);
  
  const handlePreferenceSelection = (category, selection) => {
    updatePreference(category, selection);
  };
  
  const handleSaveAndRecommend = async () => {
    await saveProfile();
    
    const recommended = await generateProductRecommendation({
      productType: 'candle',
      personalizationLevel: 'high'
    });
    
    setRecommendation(recommended);
    setStep('recommendation');
  };
  
  return (
    <div className="scent-profile-creator">
      {step === 'preferences' && (
        <>
          <h2>Create Your Scent Profile</h2>
          <ScentPreferenceQuestions 
            onSelect={handlePreferenceSelection}
            currentSelections={scentProfile}
          />
          <button 
            onClick={handleSaveAndRecommend}
            disabled={isLoading}
          >
            Find My Perfect Scent
          </button>
        </>
      )}
      
      {step === 'recommendation' && recommendation && (
        <ScentRecommendation 
          recommendation={recommendation}
          onCustomize={() => setStep('customize')}
          onAccept={() => setStep('checkout')}
        />
      )}
      
      {/* Additional steps for customization and checkout */}
    </div>
  );
}
```

## Implementation Considerations

### Rate Limiting and Quotas

MOOD MNKY API implements rate limiting to ensure service stability:

| API Type | Default Limit | Enterprise Limit |
|----------|---------------|------------------|
| REST API | 60 req/min | 600 req/min |
| WebSocket | 10 msg/sec | 100 msg/sec |
| Webhooks | 5 req/sec | 50 req/sec |

Exceeding limits will return a `429 Too Many Requests` response with retry guidance in the headers.

### Error Handling

Implement robust error handling for all integrations:

```typescript
try {
  const recommendations = await moodMnkyClient.getRecommendations({
    type: 'product',
    count: 5
  });
  
  // Success handling
} catch (error) {
  if (error.statusCode === 401) {
    // Authentication failed - refresh token or redirect to login
  } else if (error.statusCode === 429) {
    // Rate limited - implement retry with exponential backoff
    const retryAfter = parseInt(error.headers['retry-after'] || '1');
    setTimeout(() => retryRequest(), retryAfter * 1000);
  } else {
    // Log error and show appropriate UI message
    console.error('MOOD MNKY API error:', error);
    showUserFriendlyError();
  }
}
```

### Performance Optimization

Optimize API usage for best performance:

- **Batch requests** when retrieving multiple items
- **Implement caching** for appropriate resources
- **Use webhooks** rather than polling for updates
- **Initialize early** to reduce perceived latency
- **Preload critical personalization** on page load

## Development Tools

### API Testing

The MOOD MNKY Developer Portal provides tools for testing API integrations:

- **API Explorer** - Interactive documentation with request builder
- **Webhook Tester** - Debug webhook deliveries
- **Event Simulator** - Trigger test events for integration testing
- **Request Logs** - View recent API requests for debugging

### Environments

Separate environments are available for development lifecycle:

| Environment | Base URL | Purpose |
|-------------|----------|---------|
| Development | `https://api.dev.moodmnky.com/v1` | Development and testing |
| Staging | `https://api.staging.moodmnky.com/v1` | Pre-production testing |
| Production | `https://api.moodmnky.com/v1` | Production use |

Use environment-specific API keys with appropriate access restrictions.

## Versioning and Deprecation

The MOOD MNKY API follows semantic versioning practices:

- **Major version changes** (v1 → v2) may include breaking changes
- **Minor version updates** introduce new features without breaking changes
- **Patch updates** provide bug fixes and non-disruptive improvements

API versions are specified in the base URL. Deprecated features receive:

1. Advance notice (minimum 6 months for major features)
2. Deprecation headers in responses
3. Migration guides in documentation

## Resources

- [API Reference Documentation](https://developers.moodmnky.com/api-reference)
- [Client Libraries](https://developers.moodmnky.com/libraries)
- [Sample Applications](https://github.com/mood-mnky/examples)
- [API Status Dashboard](https://status.moodmnky.com)
- [Developer Community](https://community.moodmnky.com/developers)
