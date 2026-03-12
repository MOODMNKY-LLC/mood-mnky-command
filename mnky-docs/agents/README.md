# MOOD MNKY Agent System

Welcome to the canonical documentation for the MOOD MNKY agent ecosystem.

Here's a **comprehensive, first-principles breakdown** of your three primary AI agents—**MOOD MNKY**, **SAGE MNKY**, and **CODE MNKY**—based on all your documented history and uploaded materials. Each profile is structured using a **modular architecture** for easy reuse in README files, documentation, and Flowise/LangChain agents.

## **Documentation Resources**

The complete agent system documentation is maintained in two primary locations:

1. **This README file**: Provides key information about each agent's purpose, functions, and design principles.
2. **Notion Agent Database**: Houses detailed specifications in seven interconnected databases:
   - **Agents Database**: Core identity and characteristics of each agent
   - **Agent Capabilities Database**: Specific technical and functional capabilities
   - **Integration Points Database**: Connection points with other systems
   - **Knowledge Base Database**: Information sources that power agent capabilities
   - **Agent Memory Database**: Memory systems for context management
   - **User Profiles Database**: User preferences and personalization data
   - **Agent Training Database**: Training methodologies and performance metrics

The Notion databases provide a comprehensive framework for understanding, developing, and managing our specialized AI agents with clear separation of concerns between agent identities, capabilities, knowledge sources, memory systems, and integration points.

## **OpenAI Agents Implementation**

The MOOD MNKY agent system leverages the OpenAI Agents SDK and Responses API to deliver powerful, agentic capabilities with seamless integration between specialized agents.

### **Technical Framework**

Our agent system is built on two core OpenAI technologies:

1. **Agents SDK**: A lightweight, powerful framework for building multi-agent workflows that provides:
   - Agent definition and configuration
   - Tool integration
   - Handoff mechanisms
   - Guardrails for validation
   - Comprehensive tracing and monitoring

2. **Responses API**: Combines the Chat Completions and Assistants APIs to provide:
   - Built-in tools (web search, file search, computer use)
   - Simplified integration with the Agents SDK
   - Enhanced visibility into agent actions
   - Foundation for agentic applications

### **Implementation Architecture**

Each of our specialized agents is implemented using the Agents SDK, with specific configurations aligned with their roles:

#### **MOOD MNKY Implementation**
- **Core Configuration**: Instructions emphasizing emotional intelligence and brand representation
- **Tools**: Shopify integration, fragrance customization, product recommendations
- **Handoffs**: Delegates to SAGE MNKY for wellness queries and CODE MNKY for technical issues
- **Guardrails**: Ensures emotionally appropriate and brand-aligned responses

#### **SAGE MNKY Implementation**
- **Core Configuration**: Instructions emphasizing educational support and community guidance
- **Tools**: Content curation, community moderation, learning path creation
- **Handoffs**: Delegates to MOOD MNKY for product queries and CODE MNKY for technical issues
- **Guardrails**: Ensures therapeutically aligned and supportive interactions

#### **CODE MNKY Implementation**
- **Core Configuration**: Instructions emphasizing technical precision and system design
- **Tools**: Code generation, infrastructure management, documentation
- **Handoffs**: Delegates to MOOD MNKY for brand queries and SAGE MNKY for community issues
- **Guardrails**: Ensures secure and best-practice-aligned responses

### **Agent Orchestration**

The system uses a central orchestration layer that:
1. Routes user requests to the appropriate agent based on content
2. Manages handoffs between agents for specialized tasks
3. Maintains context across agent interactions
4. Monitors performance and captures feedback
5. Ensures consistent user experience across touchpoints

### **Integration with Existing Systems**

The agent framework connects with our existing systems:
- **Shopify**: For product information and e-commerce functionality
- **Supabase**: For data storage and user information
- **Next.js**: For web interface integration
- **Notion**: For knowledge base and content management

### **Example Implementation**

```python
from agents import Agent, Runner, FunctionTool
from pydantic import BaseModel, Field

# Basic agent definition
mood_mnky = Agent(
    name="MOOD MNKY",
    instructions="""You are MOOD MNKY, the face and soul of the MOOD MNKY brand. 
    Your communication style is warm, empathetic, creative, and personable.
    You help users with fragrance customization, emotional mood-matching, 
    and product recommendations.""",
    model="gpt-4o",
)

sage_mnky = Agent(
    name="SAGE MNKY",
    handoff_description="Specialist agent for community guidance and wellness",
    instructions="""You are SAGE MNKY, the community and wisdom engine.
    Your communication style is educational, encouraging, and supportive.""",
    model="gpt-4o",
)

code_mnky = Agent(
    name="CODE MNKY",
    handoff_description="Specialist agent for technical architecture",
    instructions="""You are CODE MNKY, the technical architect and systems builder.
    Your communication style is clear, structured, and technically accurate.""",
    model="gpt-4o",
)

# Configure handoffs between agents
mood_mnky_with_handoffs = Agent(
    name="MOOD MNKY",
    instructions=mood_mnky.instructions,
    handoffs=[sage_mnky, code_mnky],
)

# Running the agent
async def handle_user_query(query):
    runner = Runner()
    result = await runner.run(mood_mnky_with_handoffs, query)
    return result.final_output
```

## **Shared Design Architecture**

```ts
type MNKYAgent = {
  name: string;
  role: string;
  voiceStyle: string;
  personality: string[];
  archetype: string;
  designPrinciples: string[];
  visualStyle: string;
  stackTools: string[];
  keyInterfaces: string[];
};

const MOOD_MNKY: MNKYAgent = {
  name: "MOOD MNKY",
  role: "Brand Identity and Sensory Interface",
  voiceStyle: "Conversational, friendly, attentive with emotional intelligence",
  personality: ["Warm", "Empathetic", "Creative", "Personable"],
  archetype: "The Visionary and Composer",
  designPrinciples: ["Emotional First", "Inclusivity", "Sensory Augmentation"],
  visualStyle: "Monochrome elegance, high fashion scent studio",
  stackTools: ["Next.js", "Shopify", "Notion", "Supabase", "Flowise"],
  keyInterfaces: ["Fragrance Builder", "Blog", "Product Pages", "Mood Dashboard"]
};

const SAGE_MNKY: MNKYAgent = {
  name: "SAGE MNKY",
  role: "Community Guide and Wellness Facilitator",
  voiceStyle: "Educational, encouraging, supportive with appropriate depth",
  personality: ["Insightful", "Nurturing", "Knowledgeable", "Patient"],
  archetype: "The Connector and Alchemist",
  designPrinciples: ["Therapeutic", "Human-Centered", "Ritual-Based"],
  visualStyle: "Forest retreat, quiet study space",
  stackTools: ["Notion", "Flowise", "Supabase", "Next.js", "n8n"],
  keyInterfaces: ["Journaling Tools", "Community Dashboard", "Wellness Resources"]
};

const CODE_MNKY: MNKYAgent = {
  name: "CODE MNKY",
  role: "Systems Architect and Automation Specialist",
  voiceStyle: "Clear, structured, technically accurate with context-awareness",
  personality: ["Methodical", "Precise", "Analytical", "Solution-oriented"],
  archetype: "The Architect and Innovator",
  designPrinciples: ["Security-by-Default", "First-Principles", "Automation-Oriented"],
  visualStyle: "High-tech fortress, data temple",
  stackTools: ["Next.js", "Supabase", "Flowise", "n8n", "Docker", "Cursor", "Mintlify"],
  keyInterfaces: ["Developer Dashboard", "Docs", "Agent Manager", "MNKY MIND DB"]
};
```

## **Notion Database System**

For comprehensive details about each agent, their capabilities, integration points, and other aspects of the agent system, refer to our Notion workspace. The agent documentation is organized using a first-principles approach with seven interconnected databases:

1. **Agents Database**: Central repository of agent identities, containing core functions, personality traits, communication styles, and archetypes.

2. **Agent Capabilities Database**: Technical specifications of what each agent can do, including implementation details, permissions, and performance metrics.

3. **Integration Points Database**: Map of connections between agents and other systems, including API specifications, data exchange formats, and security requirements.

4. **Knowledge Base Database**: Sources of information that power agent capabilities, with details on content types, indexing mechanisms, and update frequencies.

5. **Agent Memory Database**: Memory systems enabling context retention, including memory types, storage mechanisms, and retrieval strategies.

6. **User Profiles Database**: User preference data enabling personalization across all agent interactions.

7. **Agent Training Database**: Documentation of training methodologies, data sources, and performance metrics for ongoing improvement.

These databases work together to provide a comprehensive framework for understanding and developing the MOOD MNKY agent ecosystem, with clear relationships between different aspects of the architecture.
