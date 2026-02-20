---
title: API Hooks
agent: sage-mnky
description: "Integration endpoints and knowledge hooks for the SAGE MNKY agent"
---

# SAGE MNKY API Integration

<div className="sage-mnky-section p-4 rounded-lg mb-6">
This document provides details on integrating with the SAGE MNKY agent through its API endpoints, knowledge hooks, and educational platform integrations. These integration points enable developers to incorporate SAGE MNKY's knowledge capabilities into learning environments and content systems.
</div>

## Integration Overview

SAGE MNKY provides several integration pathways for learning and knowledge applications:

1. **Knowledge API** - Core endpoints for content retrieval, knowledge queries, and learning path management
2. **Content Generation API** - AI-powered creation of educational materials
3. **Learning Assessment API** - Evaluation and feedback on learning activities
4. **Community Tools API** - Facilitating group learning and knowledge sharing
5. **Event-based Integrations** - Webhooks and event subscriptions for real-time updates

## Authentication and Access

All SAGE MNKY API integrations require proper authentication:

```typescript
// Authentication with API key
const sageMnkyClient = new SageMnkyClient({
  apiKey: process.env.SAGE_MNKY_API_KEY,
  environment: 'production', // or 'staging', 'development'
  version: 'v1'
});

// User-context client
const userClient = sageMnkyClient.withUserContext({
  userId: 'user_123',
  sessionId: 'session_abc123',
  learningContext: 'dojo_environment'
});
```

## Knowledge API

### Knowledge Queries

```typescript
// Query the knowledge graph
const knowledgeResults = await sageMnkyClient.knowledge.query({
  query: "mindfulness techniques for daily practice",
  responseType: 'comprehensive',
  format: 'structured',
  depth: 'intermediate',
  maxResults: 5,
  includeRelatedConcepts: true
});

// Retrieve topic details
const topicDetails = await sageMnkyClient.knowledge.getTopic({
  topicId: 'topic_mindfulness_basics',
  includeSubtopics: true,
  includeRelatedContent: true,
  contentTypes: ['articles', 'videos', 'exercises']
});
```

### Learning Paths

```typescript
// Create a personalized learning path
const learningPath = await sageMnkyClient.learning.createPath({
  userId: 'user_123',
  topic: 'sustainable fragrance practices',
  goal: 'practical application',
  difficulty: 'intermediate',
  preferredContentTypes: ['article', 'video', 'interactive'],
  estimatedDuration: {
    value: 3,
    unit: 'weeks'
  },
  prerequisites: [
    { topicId: 'topic_fragrance_basics', requiredLevel: 'completed' }
  ]
});

// Retrieve learning path
const pathDetails = await sageMnkyClient.learning.getPath({
  pathId: 'path_789',
  includeProgress: true,
  includeResources: true
});

// Update learning progress
await sageMnkyClient.learning.updateProgress({
  userId: 'user_123',
  pathId: 'path_789',
  stepId: 'step_456',
  status: 'completed',
  assessmentResults: {
    score: 85,
    timeSpent: 25,
    completedAt: new Date().toISOString()
  }
});
```

### Knowledge Graph

```typescript
// Get knowledge graph visualization data
const graphData = await sageMnkyClient.knowledge.getGraphData({
  rootTopicId: 'topic_aromatherapy',
  depth: 2,
  includeRelations: true,
  layout: 'radial',
  includeMetadata: true
});

// Find connections between topics
const connections = await sageMnkyClient.knowledge.findConnections({
  fromTopicId: 'topic_essential_oils',
  toTopicId: 'topic_stress_reduction',
  maxDepth: 3,
  relationTypes: ['applies_to', 'influences', 'part_of']
});
```

## Content Generation API

### Educational Content Creation

```typescript
// Generate an instructional article
const article = await sageMnkyClient.content.generateArticle({
  topic: 'Creating a Relaxation Blend',
  audience: 'beginner',
  style: 'conversational',
  format: 'step-by-step',
  length: 'medium',
  includeExamples: true,
  focusPoints: [
    'Selecting complementary scents',
    'Proper ratios for blending',
    'Safety considerations',
    'Testing techniques'
  ]
});

// Create an interactive learning module
const module = await sageMnkyClient.content.createInteractiveModule({
  title: 'Identifying Fragrance Families',
  learningObjectives: [
    'Distinguish between the major fragrance families',
    'Identify key characteristics of each family',
    'Match example scents to their families'
  ],
  interactivityLevel: 'high',
  estimatedDuration: 15, // minutes
  includeAssessment: true
});
```

### Multi-format Content Generation

```typescript
// Generate multi-format content for a topic
const contentPackage = await sageMnkyClient.content.generateMultiFormat({
  topic: 'Mindfulness in Self-Care',
  formats: [
    { type: 'article', style: 'informative', length: 'medium' },
    { type: 'infographic', style: 'visual', focusAreas: ['key techniques', 'benefits'] },
    { type: 'exercise', style: 'guided', duration: '5min' }
  ],
  consistencyParameters: {
    maintainVoice: true,
    sharedConcepts: true,
    progressiveComplexity: true
  },
  targetAudience: 'general',
  brandVoice: true
});
```

### Personalized Content Adaptation

```typescript
// Adapt content for specific learner
const adaptedContent = await sageMnkyClient.content.adaptForLearner({
  contentId: 'cont_123',
  learnerId: 'user_456',
  adaptations: {
    complexity: 'simplify',
    examples: 'personalize',
    format: 'visual_emphasis',
    length: 'condense'
  },
  preserveCore: true,
  addContext: true
});
```

## Learning Assessment API

### Knowledge Assessment

```typescript
// Create an assessment
const assessment = await sageMnkyClient.assessment.create({
  topic: 'Fragrance Composition',
  difficulty: 'intermediate',
  questionTypes: ['multiple-choice', 'short-answer', 'matching'],
  questionCount: 10,
  timeLimit: 20, // minutes
  passingScore: 70,
  includeExplanations: true
});

// Evaluate learning submission
const evaluation = await sageMnkyClient.assessment.evaluate({
  submissionId: 'sub_789',
  submissionType: 'written-response',
  rubric: {
    understanding: { weight: 0.4, criteria: ['accuracy', 'depth'] },
    application: { weight: 0.4, criteria: ['relevance', 'creativity'] },
    communication: { weight: 0.2, criteria: ['clarity', 'organization'] }
  },
  referenceMaterials: ['doc_123', 'doc_456'],
  provideFeedback: true
});
```

### Learning Analytics

```typescript
// Get learning analytics
const analytics = await sageMnkyClient.analytics.getLearnerInsights({
  userId: 'user_123',
  timeframe: 'last-90-days',
  metrics: [
    'completion-rate',
    'engagement-patterns',
    'knowledge-growth',
    'strengths-gaps'
  ],
  includeRecommendations: true
});

// Get cohort-level analytics
const cohortAnalytics = await sageMnkyClient.analytics.getCohortInsights({
  cohortId: 'fragrance-fundamentals-spring-2023',
  compareWithPrevious: true,
  metrics: [
    'completion-distribution',
    'engagement-over-time',
    'performance-breakdown',
    'content-effectiveness'
  ]
});
```

## Community Tools API

### Discussion Facilitation

```typescript
// Create facilitated discussion
const discussion = await sageMnkyClient.community.createDiscussion({
  title: 'Best Practices for Sustainable Ingredients',
  description: 'Sharing approaches to sourcing and using sustainable materials',
  facilitation: {
    level: 'active', // or 'light', 'observational'
    focusAreas: ['knowledge-sharing', 'collaborative-problem-solving'],
    moderationGuidelines: ['respectful-discourse', 'evidence-based-claims']
  },
  initialPrompts: [
    'What sustainability criteria do you consider when choosing ingredients?',
    'How do you verify sustainability claims from suppliers?'
  ],
  relatedResources: ['resource_123', 'resource_456']
});

// Get discussion insights
const insights = await sageMnkyClient.community.getDiscussionInsights({
  discussionId: 'disc_789',
  analysisTypes: [
    'key-themes',
    'knowledge-gaps',
    'participant-engagement',
    'follow-up-opportunities'
  ],
  format: 'summary'
});
```

### Collaborative Learning

```typescript
// Create collaborative learning project
const project = await sageMnkyClient.community.createCollaborativeProject({
  title: 'Developing a Sustainable Fragrance Line',
  description: 'Team-based project to design an eco-friendly fragrance collection',
  learningObjectives: [
    'Apply sustainable sourcing principles',
    'Design eco-friendly packaging',
    'Create marketing that authentically communicates sustainability'
  ],
  teamSize: { min: 3, max: 5 },
  duration: { value: 2, unit: 'weeks' },
  milestones: [
    { title: 'Research and Concept', duration: '3 days' },
    { title: 'Prototype Development', duration: '5 days' },
    { title: 'Refinement and Presentation', duration: '6 days' }
  ],
  facilitationLevel: 'guided'
});

// Get project status
const projectStatus = await sageMnkyClient.community.getProjectStatus({
  projectId: 'proj_123',
  includeIndividualContributions: true,
  includeFeedback: true
});
```

### Learning Circles

```typescript
// Create learning circle
const circle = await sageMnkyClient.community.createLearningCircle({
  name: 'Natural Fragrance Enthusiasts',
  description: 'Regular meetings to explore and share natural fragrance techniques',
  schedule: {
    frequency: 'weekly',
    duration: 60, // minutes
    startDate: '2023-09-01T18:00:00Z',
  },
  topics: ['natural-ingredients', 'blending-techniques', 'sustainability'],
  facilitationNeeds: {
    contentSuggestions: true,
    discussionPrompts: true,
    expertConnections: true
  },
  membershipCriteria: {
    interestMatch: true,
    knowledgeLevel: 'mixed',
    applicationRequired: false
  }
});
```

## Event-based Integrations

### Event Subscriptions

```typescript
// Subscribe to learning events
await sageMnkyClient.events.subscribe({
  events: [
    'learning.path.started',
    'learning.path.completed',
    'assessment.submitted',
    'content.engaged',
    'discussion.participated'
  ],
  destination: {
    type: 'webhook',
    url: 'https://your-app.com/learning-events',
    secret: 'your_webhook_secret'
  },
  filters: {
    users: ['user_123', 'user_456'], // or '*' for all
    contentTypes: ['course', 'assessment']
  }
});

// List active subscriptions
const subscriptions = await sageMnkyClient.events.listSubscriptions();
```

### Webhook Integration

```typescript
// Register webhook
const webhook = await sageMnkyClient.webhooks.create({
  url: 'https://your-app.com/webhooks/sage-mnky',
  secret: 'your_signing_secret',
  description: 'Learning milestone notifications',
  events: [
    'learning.milestone.achieved',
    'content.recommendation.generated',
    'assessment.feedback.provided'
  ],
  isActive: true
});

// Node.js webhook handler example
import crypto from 'crypto';

function verifyWebhookSignature(req, secret) {
  const signature = req.headers['x-sage-mnky-signature'];
  const timestamp = req.headers['x-sage-mnky-timestamp'];
  
  // Recreate the signature
  const payload = timestamp + '.' + JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

app.post('/webhooks/sage-mnky', (req, res) => {
  const isValid = verifyWebhookSignature(req, process.env.WEBHOOK_SECRET);
  
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }
  
  const event = req.body;
  
  // Process different event types
  switch (event.type) {
    case 'learning.milestone.achieved':
      celebrateLearnerMilestone(event.data);
      break;
    case 'assessment.feedback.provided':
      notifyLearnerFeedback(event.data);
      break;
  }
  
  res.status(200).send('Webhook received');
});
```

## Client Libraries

### React Integration

```typescript
// React hooks integration
import { useSageMnky, SageMnkyProvider } from '@sage-mnky/react';

function App() {
  return (
    <SageMnkyProvider apiKey="YOUR_PUBLIC_KEY">
      <LearningModule />
    </SageMnkyProvider>
  );
}

function LearningModule() {
  const { 
    learningPath,
    getCurrentTopic,
    getRelatedContent,
    trackProgress,
    isLoading
  } = useSageMnky();
  
  const [currentTopic, setCurrentTopic] = useState(null);
  
  useEffect(() => {
    async function loadCurrentTopic() {
      const topic = await getCurrentTopic();
      setCurrentTopic(topic);
    }
    
    if (learningPath) {
      loadCurrentTopic();
    }
  }, [learningPath, getCurrentTopic]);
  
  return (
    <div className="learning-module">
      {isLoading ? (
        <LoadingIndicator />
      ) : (
        <>
          <h1>{currentTopic?.title}</h1>
          <TopicContent 
            content={currentTopic?.content}
            onComplete={() => trackProgress(currentTopic.id, 'completed')}
          />
          <RelatedResources 
            getResources={() => getRelatedContent(currentTopic.id)}
          />
        </>
      )}
    </div>
  );
}
```

### Node.js Server Integration

```typescript
// Node.js server integration
import { SageMnkyServer } from '@sage-mnky/node';

const sageMnkyServer = new SageMnkyServer({
  apiKey: process.env.SAGE_MNKY_API_KEY,
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
});

// Express middleware for learning context
app.use(async (req, res, next) => {
  if (req.user) {
    req.sageMnky = sageMnkyServer.withUserContext({
      userId: req.user.id,
      sessionId: req.sessionID,
      learningContext: req.query.context || 'default'
    });
  }
  next();
});

// Use in route handler
app.get('/personalized-learning-content', async (req, res) => {
  try {
    const content = await req.sageMnky.content.getPersonalized({
      contentId: req.query.contentId,
      adaptationLevel: req.query.adaptLevel || 'medium'
    });
    
    res.json(content);
  } catch (error) {
    console.error('SAGE MNKY API error:', error);
    res.status(500).json({ error: 'Failed to get personalized content' });
  }
});
```

## Integration Patterns

### Learning Management System Integration

```typescript
// LMS integration with SAGE MNKY
async function enhanceLMSContent(courseId, userId) {
  // Get course structure from LMS
  const courseStructure = await lmsClient.getCourseStructure(courseId);
  
  // Enhance each module with SAGE MNKY content
  for (const module of courseStructure.modules) {
    // Get personalized content recommendations
    const enhancedContent = await sageMnkyClient.content.enhanceModuleContent({
      moduleId: module.id,
      originalContent: module.content,
      userId: userId,
      enhancementTypes: [
        'examples',
        'exercises',
        'visualizations',
        'deeper_explanations'
      ],
      preserveStructure: true
    });
    
    // Update module in LMS
    await lmsClient.updateModuleContent(module.id, enhancedContent);
    
    // Generate supplementary resources
    const supplementary = await sageMnkyClient.content.generateSupplementaryResources({
      moduleId: module.id,
      userId: userId,
      resourceTypes: ['practice_questions', 'summary_notes', 'application_examples']
    });
    
    // Add supplementary resources to LMS
    await lmsClient.addModuleResources(module.id, supplementary.resources);
  }
  
  // Create personalized learning path through course
  const personalizedPath = await sageMnkyClient.learning.createPersonalizedSequence({
    courseStructure: courseStructure,
    userId: userId,
    adaptationLevel: 'high',
    includePrerequisiteCheck: true
  });
  
  // Store personalized path in LMS
  await lmsClient.setUserLearningPath(courseId, userId, personalizedPath);
}
```

### Knowledge Base Enhancement

```typescript
// Enhance existing knowledge base with SAGE MNKY
async function enhanceKnowledgeBase(knowledgeBaseId) {
  // Get current knowledge structure
  const knowledgeStructure = await getKnowledgeBaseStructure(knowledgeBaseId);
  
  // Identify knowledge gaps
  const gaps = await sageMnkyClient.knowledge.identifyGaps({
    knowledgeStructure,
    analysisDepth: 'comprehensive',
    considerUserQueries: true
  });
  
  // Generate content to fill gaps
  const newContent = await Promise.all(
    gaps.map(gap => 
      sageMnkyClient.content.generateContent({
        topic: gap.topic,
        contentType: gap.recommendedFormat,
        depth: gap.requiredDepth,
        connect: {
          relatedTopics: gap.connections
        }
      })
    )
  );
  
  // Add new content to knowledge base
  for (const content of newContent) {
    await addToKnowledgeBase(knowledgeBaseId, content);
  }
  
  // Enhance navigation with knowledge graph
  const knowledgeGraph = await sageMnkyClient.knowledge.generateGraph({
    knowledgeBaseId,
    visualizationType: 'interactive',
    includeMetadata: true
  });
  
  // Implement graph navigation in knowledge base
  await updateKnowledgeBaseNavigation(knowledgeBaseId, knowledgeGraph);
}
```

## Implementation Considerations

### Privacy and Data Protection

- **Collect only necessary learner data** for personalization
- **Provide clear data usage explanations** to users
- **Implement data retention policies** appropriate for learning contexts
- **Allow learners to control** their data and personalization level
- **Anonymize analytics data** where possible

### Content Accuracy and Quality

- **Implement review processes** for auto-generated content
- **Establish feedback loops** to improve content quality
- **Version content appropriately** to track changes
- **Provide source attribution** for knowledge claims
- **Regularly audit knowledge base** for accuracy and currency

### Rate Limits and Quota Management

SAGE MNKY API implements rate limiting to ensure service stability:

| API Type | Default Limit | Enterprise Limit |
|----------|---------------|------------------|
| Knowledge API | 100 req/min | 1,000 req/min |
| Content Generation | 20 req/min | 200 req/min |
| Learning Analytics | 50 req/min | 500 req/min |

Exceeding limits will return a `429 Too Many Requests` response with retry guidance.

## Development Resources

- [API Reference Documentation](https://developers.moodmnky.com/sage-mnky/api)
- [Knowledge Integration Guide](https://developers.moodmnky.com/sage-mnky/knowledge)
- [Content Generation Best Practices](https://developers.moodmnky.com/sage-mnky/content)
- [Learning Analytics Implementation](https://developers.moodmnky.com/sage-mnky/analytics)
- [Sample Applications](https://github.com/sage-mnky/examples)
