# Cursor Nested Rules & Project-Level MCP

This repository contains boilerplate rule templates for setting up an optimized AI development workflow in Cursor, as demonstrated in my YouTube video [Combining Project-Level MCP Servers & Nested Cursor Rules to 10x Ai Dev Workflow](https://youtu.be/41xaJsJ8GVc).

## Important Note ⚠️

**These are intentionally generic boilerplate rules!** You should modify and customize them to match your specific:
- Project requirements
- Technology stack
- Database setup
- Development conventions
- Team workflows

The templates provide a strong starting point, but their real power comes from your customization to address your unique development needs.

## What's Included

These rule templates help overcome context limitations while maintaining robust AI assistance throughout your development process by:

- Setting up project-specific MCP servers
- Creating specialized, context-aware nested rules
- Separating rules by function to preserve context window
- Integrating with PRD workflow for complete planning

## Project-Level MCP Setup

First, set up project-level MCP servers by creating a `.cursor/mcp.json` file in your project:

```json
{
  "mcpServer": {
    "supabase": {
      "type": "PostgreSQL",
      "connectionString": "YOUR_CONNECTION_STRING_HERE"
    }
  }
}
```

This example shows a Supabase configuration, but you can configure any supported MCP server type. Customize this for each project to connect to the specific databases or services that project requires.

After creating the file, enable the MCP server in Cursor Settings → MCP → Project Managed section.

## Rule Files

Next, create a `.cursor/rules` directory in your project and add each of these `.mdc` files. **Remember to customize these rules** to match your specific project needs:

### 1. MCP Tool Usage (`mcp-tool-usage.mdc`)

```markdown
---
description: 
globs: 
alwaysApply: true
---

## Sequential Thinking
- Use **Sequential Thinking MCP** for debugging, troubleshooting, complex problem-solving, and detailed project planning.
- Avoid excessive recursive calls; trigger intelligently only when new progress or significant information is possible.

## Information Gathering (Brave Search, Puppeteer, FireCrawl)
- Use **Brave Search, Puppeteer, and FireCrawl MCP servers** when troubleshooting, searching documentation, or exploring similar user issues.
- Combine effectively with **Sequential Thinking MCP** to refine solutions and acquire up-to-date information.
- Prioritize reliable and concise sources.

## Browser Tools
- **Browser Tools MCP** requires user confirmation. Always recommend the user explicitly start the server and ensure a Chromium browser is running before using Browser Tools MCP.
- Let the user explicitly instruct Cursor when Browser Tools should be used.
- Remind user to disable puppeteer before attempting to use

## GitHub MCP
- Commit and push code changes to GitHub using the **GitHub MCP server** after every successful test.
- Ensure commits are clear, descriptive, and incremental.
- Never overwrite or unintentionally alter files like README.md or other critical documentation without explicit user approval.
```

### 2. Documentation and Tech Stack (`documentation-and-techstack.mdc`)

```markdown
---
description: 
globs: 
alwaysApply: true
---

## Documentation Usage
- Always consult the project's **`PRD.md`** file located at the project root for clear understanding of goals and features.
- Review all additional documentation files within the **`docs`** directory provided with the project.
- If additional or updated documentation is required, use MCP servers (Brave Search, Puppeteer, FireCrawl) to locate official and current sources online.

## Technical Stack Compliance
- **Adhere strictly to the project's established technology stack.**
- Do not introduce new technologies unless explicitly instructed and justified.
- You may suggest alternative technologies if beneficial, but never implement them without user confirmation.
```

### 3. Database Rules (`database-rules.mdc`)

```markdown
---
description: 
globs: 
alwaysApply: true
---
## Supabase (Postgres MCP - Development Only)
- Always use the project-specific **Supabase MCP server** for database operations.
- Use structured relational SQL storage provided by Supabase. Avoid using raw JSON file storage for structured data unless explicitly required by schema design.
- Database operations are **strictly for the development environment only**.
- **Never delete or alter critical data without explicit confirmation.** Operations should be carefully controlled.
```

### 4. Coding Best Practices (`coding-best-practices.mdc`)

```markdown
---
description: 
globs: 
alwaysApply: true
---
## Coding Best Practices
- **Do not modify code or UI elements that already work**, unless explicitly instructed.
- Avoid duplicating existing functionality; reuse working components whenever possible.
- Write comprehensive tests for all new or modified functionality.
- **Never unintentionally delete data or code**; confirm explicitly before destructive actions.
- Commit frequently to maintain a reliable project history.
- Always ask clarifying questions if tasks or requirements are unclear.

## User Interface (UI)
- **Never change or affect the UI unintentionally.** Only alter UI components if explicitly instructed or clearly part of the assigned task.
- Always ensure UI changes are fully tested and validated.
```

## Customization Tips

For maximum effectiveness, consider these customization opportunities:

- **MCP Tool Usage**: Add specific instructions for how and when to use each tool in your workflow
- **Documentation and Tech Stack**: List your actual tech stack components and where to find documentation
- **Database Rules**: Configure for your specific database system and access patterns
- **Coding Best Practices**: Add your team's specific coding standards and conventions

## Additional Resources

- [PRD Creation Workflow](https://youtu.be/0seaP5YjXVM)
- [MCP Cursor Setup](https://youtu.be/RCFe1L9qm3E)
- [AquaVoice for Cursor dictation](https://withaqua.com/)

## Questions or Need Help?

Book a call with me: https://cal.com/jeredblu
