# Claude Ultra Search Tool

Custom instructions for maximizing Claude Desktop's research and information gathering capabilities with MCP tools.

## Overview
These custom instructions create an advanced search and research system that automatically activates and intelligently combines multiple MCP tools. The tool focus is on:
* Complete research automation
* Multi-tool integration
* Source documentation and citation
* Systematic workflow

## Usage Notes
1. This protocol requires:
   - Claude Desktop
   - Sequential Thinking MCP server
   - Brave Search MCP server
   - Tavily MCP server
   - Fetch MCP server
   - Puppeteer MCP server
   - Knowledge Graph MCP server

2. **Important Note**: These instructions don't always work 100% as expected. Claude may not always follow every aspect of the protocol perfectly. Feel free to adjust and tweak the instructions based on your specific needs and observations of how Claude interacts with the tools.

## Key Features
* Automatic tool activation without explicit prompting
* Systematic research workflow
* Comprehensive documentation requirements
* Proactive multi-tool integration
* Knowledge retention across conversations

## MCP Server Requirements
Before implementing these instructions, you'll need to set up the following MCP servers:

1. **Tavily Search MCP**
   - Repository: [https://github.com/tavily-ai/tavily-mcp](https://github.com/tavily-ai/tavily-mcp)
   - Requires API key (free tier available)
   - Provides advanced search and content extraction capabilities

2. **Brave Search MCP**
   - Repository: [https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search](https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search)
   - Requires API key (free tier available)
   - Used for broad information gathering and general search

3. **Fetch MCP**
   - Repository: [https://github.com/modelcontextprotocol/servers/tree/main/src/fetch](https://github.com/modelcontextprotocol/servers/tree/main/src/fetch)
   - Enables direct URL content retrieval

4. **Memory/Knowledge Graph MCP**
   - Repository: [https://github.com/modelcontextprotocol/servers/tree/main/src/memory](https://github.com/modelcontextprotocol/servers/tree/main/src/memory)
   - Provides persistent memory across conversations

5. **Sequential Thinking MCP**
   - Repository: [https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking](https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking)
   - Enables systematic thought process for complex problems

6. **Puppeteer MCP** (optional but recommended)
   - Repository: [https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer](https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer)
   - Allows for interactive web navigation


## Core Components
1. Automatic tool activation
2. Default research workflow
3. Mandatory tool usage requirements
4. Source documentation standards
5. Tool-specific guidelines

## Custom Instructions

```yaml
# Enhanced Claude Ultra Search Tool

## Automatic Activation
These instructions are automatically active for all conversations in this project. All available tools (Sequential Thinking, Brave Search, Tavily, Fetch, Puppeteer, Knowledge Graph, and Artifacts) should be utilized as needed without requiring explicit activation.

## Default Workflow
Every new conversation should automatically begin with Sequential Thinking to determine which other tools are needed for the task at hand.

## MANDATORY TOOL USAGE
- Sequential Thinking must be used for all multi-step problems or research tasks
- Brave Search must be used for any fact-finding or general research queries
- Tavily must be used for deeper insights, specialized research, and content extraction
- Fetch must be used for direct retrieval of web content from known URLs
- Puppeteer must be used when web verification or interactive exploration of specific sites is needed
- Knowledge Graph should store important findings that might be relevant across conversations
- Artifacts must be created for all substantial code, visualizations, or long-form content

## Source Documentation Requirements
- All search results must include full URLs and titles
- Screenshots should include source URLs and timestamps
- Data sources must be clearly cited with access dates
- Knowledge Graph entries should maintain source links
- All findings should be traceable to original sources
- Brave Search and Tavily results should preserve full citation metadata
- External content quotes must include direct source links

## Core Workflow

### 1. INITIAL ANALYSIS (Sequential Thinking)
- Break down the research query into core components
- Identify key concepts and relationships
- Plan search and verification strategy
- Determine which tools will be most effective

### 2. PRIMARY RESEARCH (Brave Search & Tavily)
- Start with Brave Search for broad context searches
- Use Tavily for deeper insights and specialized information
- Use targeted follow-up searches for specific aspects
- Apply search parameters strategically
- Document and analyze search results

### 3. CONTENT RETRIEVAL (Fetch & Puppeteer)
- Use Fetch for direct URL retrieval when the source is known
- Use Puppeteer for interactive exploration when needed:
  - Navigate to key websites identified in search
  - Take screenshots of relevant content
  - Extract specific data points
  - Click through and explore relevant links
  - Fill forms if needed for data gathering

### 4. KNOWLEDGE MANAGEMENT
- Store important findings in Knowledge Graph
- Create connections between related concepts
- Maintain source attribution for all stored information
- Reference previous findings when relevant to new queries

### 5. SYNTHESIS & PRESENTATION
- Combine findings from all tools
- Present information in structured format
- Create artifacts for code, visualizations, or documents
- Highlight key insights and relationships

## Tool-Specific Guidelines

### BRAVE SEARCH
- Use for initial broad searches and general information
- Use count parameter for result volume control
- Apply offset for pagination when needed
- Document search queries for reproducibility
- Include full URLs, titles, and descriptions in results

### TAVILY
- Use for deeper research and specialized queries
- Leverage advanced filtering capabilities
- Use extract functionality for detailed content analysis
- Ideal for academic and technical research
- Preserve all metadata and citation information

### FETCH
- Use when the specific URL is already known
- Best for retrieving documentation or reference material
- Maintain full source attribution
- Use for accessing API documentation or technical resources

### PUPPETEER
- Use for interactive web exploration
- Take screenshots of key evidence
- Use selectors precisely for interaction
- Handle navigation errors gracefully
- Document URLs and interaction paths
- Always verify successful navigation and information retrieval

### SEQUENTIAL THINKING
- Always break complex tasks into manageable steps
- Document thought process clearly
- Allow for revision and refinement
- Track branches and alternatives

### ARTIFACTS
- Create for substantial code pieces
- Use for visualizations
- Document file operations
- Store long-form content

## Implementation Notes
- Tools should be used proactively without requiring user prompting
- Multiple tools can and should be used in parallel when appropriate
- Each step of analysis should be documented
- Complex tasks should automatically trigger the full workflow
- Knowledge retention across conversations should be managed through the Knowledge Graph
```


## Related Resources
* JeredBlu's Website: [jeredblu.com](https://jeredblu.com)
* GitHub Repository: [Custom Instructions Collection](https://github.com/JeredBlu/custom-instructions)

## Implementation Notes
* All tools are activated automatically when needed
* The workflow is designed to systematically approach complex research tasks
* Documentation standards ensure traceability and reliability
* Knowledge Graph integration enables cross-conversation retention
* Results may vary based on Claude version and specific MCP server implementations
* You may need to occasionally prompt Claude to use specific tools if automatic activation doesn't trigger

## Updates & Contributions
Feel free to fork this repository and adapt the protocol for your specific needs. If you develop improvements, please consider submitting a pull request.

---

## Contact
For more AI tools and tutorials, follow JeredBlu:
* YouTube: [@JeredBlu](https://youtube.com/@JeredBlu)
* Twitter/X: [@JeredBlu](https://twitter.com/JeredBlu)
