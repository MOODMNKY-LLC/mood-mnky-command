---
title: API Hooks
agent: code-mnky
description: "Integration endpoints and development hooks for the CODE MNKY agent"
---

# CODE MNKY API Integration

<div className="code-mnky-section p-4 rounded-lg mb-6">
This document provides details on integrating with the CODE MNKY agent through its API endpoints, development hooks, and tooling integrations. These integration points enable developers to incorporate CODE MNKY's technical expertise into development workflows and applications.
</div>

## Integration Overview

CODE MNKY provides multiple integration options for development workflows:

1. **REST API** - Core API endpoints for code analysis, generation, and documentation
2. **CLI Tools** - Command-line integration for development workflows
3. **IDE Extensions** - Direct editor integration for VS Code, JetBrains IDEs, and more
4. **CI/CD Hooks** - Integration with GitHub Actions, Jenkins, and other CI systems
5. **SDK Libraries** - Programmatic access in Node.js, Python, and other environments

## Authentication and Access

All CODE MNKY API integrations require authentication:

```typescript
// Authentication with API key
const codeMnkyClient = new CodeMnkyClient({
  apiKey: process.env.CODE_MNKY_API_KEY,
  environment: 'production', // or 'staging', 'development'
  version: 'v1'
});

// Repository-specific client
const repoClient = codeMnkyClient.withRepository({
  repoId: 'repo_123456',  // Your repository identifier
  branch: 'main'          // Target branch
});
```

## REST API Endpoints

### Code Analysis API

```typescript
// Analyze code for issues and best practices
const analysis = await codeMnkyClient.code.analyze({
  files: [
    {
      path: 'src/components/Button.tsx',
      content: '// Code content here...',
      language: 'typescript'
    }
  ],
  analysisType: 'comprehensive',
  rulesConfig: {
    performance: true,
    security: true,
    accessibility: true,
    bestPractices: true
  }
});

// Get code quality metrics
const metrics = await codeMnkyClient.code.getMetrics({
  repositoryId: 'repo_123456',
  path: 'src/components/',
  includeSubdirectories: true,
  metrics: [
    'complexity',
    'duplication',
    'maintainability',
    'test-coverage'
  ]
});
```

### Code Generation API

```typescript
// Generate code from spec or description
const generatedCode = await codeMnkyClient.generation.createCode({
  description: 'Create a React functional component for a form input with validation',
  language: 'typescript',
  framework: 'react',
  style: 'functional',
  additionalContext: {
    projectStructure: 'src/components organized by feature',
    codingStandards: 'Use Tailwind for styling, prefer named exports'
  }
});

// Transform existing code
const transformedCode = await codeMnkyClient.generation.transformCode({
  originalCode: '// Original code here...',
  transformation: 'refactor',
  parameters: {
    target: 'performance',
    preserveLogic: true,
    styleGuide: 'airbnb'
  }
});
```

### Documentation API

```typescript
// Generate documentation from code
const docs = await codeMnkyClient.documentation.generate({
  repositoryId: 'repo_123456',
  path: 'src/utils/formatters.ts',
  format: 'markdown',
  style: 'detailed',
  includeExamples: true
});

// Generate API reference
const apiReference = await codeMnkyClient.documentation.generateApiReference({
  sourceFiles: ['src/api/users.ts', 'src/api/products.ts'],
  format: 'openapi',
  version: '3.0.0',
  title: 'Project API Reference',
  baseUrl: '/api/v1'
});
```

### Project Management API

```typescript
// Generate implementation plan from requirements
const implementationPlan = await codeMnkyClient.projects.generatePlan({
  requirements: '// Detailed requirements document',
  targetTechnology: {
    frontend: 'react',
    backend: 'node',
    database: 'postgres'
  },
  outputFormat: 'tasks', // or 'milestones', 'sprints'
  estimationLevel: 'detailed'
});

// Analyze code changes
const changeAnalysis = await codeMnkyClient.projects.analyzeChanges({
  repositoryId: 'repo_123456',
  baseBranch: 'main',
  headBranch: 'feature/add-authentication',
  reviewType: 'comprehensive'
});
```

## CLI Integration

The CODE MNKY CLI provides command-line access to agent capabilities:

```bash
# Install CODE MNKY CLI
npm install -g @code-mnky/cli

# Set up authentication
code-mnky auth login

# Analyze code in current directory
code-mnky analyze ./src --output report.md

# Generate documentation
code-mnky docs generate ./src/utils --output ./docs

# Explain code
code-mnky explain ./src/complex-algorithm.js

# Suggest improvements
code-mnky suggest ./src/components/Form.jsx
```

Example of programmatic CLI usage:

```typescript
import { execSync } from 'child_process';

// Run CODE MNKY analyze and capture output
const analysisResult = execSync(
  'code-mnky analyze ./src --format json --rules performance,security',
  { encoding: 'utf-8' }
);

const analysis = JSON.parse(analysisResult);
console.log(`Found ${analysis.issues.length} issues`);
```

## IDE Extensions

CODE MNKY integrates directly into development environments:

### VS Code Extension

Install the CODE MNKY extension from the VS Code marketplace and configure with your API key.

Key features:
- Code analysis with inline diagnostics
- Code generation and transformation
- Documentation generation
- Code explanation and learning aids
- Pull request assistance

### Command Palette Integration

```typescript
// Example VS Code extension API usage
import * as vscode from 'vscode';
import { codeMnkyVSCodeClient } from '@code-mnky/vscode-client';

export function activate(context: vscode.ExtensionContext) {
  // Register command to analyze current file
  const analyzeCommand = vscode.commands.registerCommand(
    'extension.codeMnkyAnalyze',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      
      const document = editor.document;
      const code = document.getText();
      
      try {
        const analysis = await codeMnkyVSCodeClient.analyze({
          code,
          language: document.languageId,
          path: document.fileName
        });
        
        // Display results
        displayAnalysisResults(analysis);
      } catch (error) {
        vscode.window.showErrorMessage(`Analysis failed: ${error.message}`);
      }
    }
  );
  
  context.subscriptions.push(analyzeCommand);
}
```

## CI/CD Integration

### GitHub Actions Integration

```yaml
# .github/workflows/code-mnky-analysis.yml
name: CODE MNKY Analysis

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: CODE MNKY Analysis
        uses: code-mnky/github-action@v1
        with:
          api-key: ${{ secrets.CODE_MNKY_API_KEY }}
          analysis-type: full
          report-format: github-pr-comment
          fail-on: critical
          paths: 'src/**/*.{ts,tsx,js,jsx}'
```

### PR Comment Webhook

Set up a webhook to receive PR comments and analysis:

```typescript
// Example Express.js webhook handler
app.post('/webhooks/code-mnky', async (req, res) => {
  const signature = req.headers['x-code-mnky-signature'];
  if (!validateSignature(signature, req.body, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  
  const event = req.body;
  
  switch (event.type) {
    case 'pr.analyzed':
      await storePRAnalysis(event.data);
      break;
    case 'code.documented':
      await updateDocumentation(event.data);
      break;
  }
  
  res.status(200).send('Webhook received');
});
```

## SDK Libraries

### Node.js Integration

```typescript
// Install SDK: npm install @code-mnky/node-sdk
import { CodeMnky } from '@code-mnky/node-sdk';

const codeMnky = new CodeMnky({
  apiKey: process.env.CODE_MNKY_API_KEY
});

async function analyzeProjectFiles() {
  const result = await codeMnky.batchAnalyze({
    files: [
      { path: 'src/utils/format.js', content: fs.readFileSync('src/utils/format.js', 'utf-8') },
      { path: 'src/utils/validate.js', content: fs.readFileSync('src/utils/validate.js', 'utf-8') }
    ],
    rules: ['security', 'performance', 'maintainability']
  });
  
  console.log('Analysis complete:', result.summary);
  console.table(result.issues);
}
```

### Integration with Build Tools

```typescript
// Example webpack plugin integration
class CodeMnkyWebpackPlugin {
  constructor(options) {
    this.options = options;
    this.client = new CodeMnky({
      apiKey: options.apiKey
    });
  }
  
  apply(compiler) {
    compiler.hooks.emit.tapAsync(
      'CodeMnkyWebpackPlugin',
      async (compilation, callback) => {
        const files = Object.keys(compilation.assets)
          .filter(filename => filename.endsWith('.js') || filename.endsWith('.css'))
          .map(filename => ({
            path: filename,
            content: compilation.assets[filename].source()
          }));
        
        try {
          const analysis = await this.client.analyze({ files });
          
          // Add analysis report to build assets
          compilation.assets['code-mnky-report.json'] = {
            source: () => JSON.stringify(analysis, null, 2),
            size: () => JSON.stringify(analysis, null, 2).length
          };
          
          if (this.options.failOnCritical && analysis.hasCriticalIssues) {
            compilation.errors.push('CODE MNKY found critical issues');
          }
          
          callback();
        } catch (error) {
          callback(new Error(`CODE MNKY analysis failed: ${error.message}`));
        }
      }
    );
  }
}
```

## Common Integration Patterns

### Code Review Workflow

```typescript
// Integrate CODE MNKY into a code review workflow
async function enhanceCodeReview(prId, baseBranch, headBranch) {
  // Pull the changes from the PR
  const changedFiles = await getChangedFiles(prId);
  
  // Analyze the changes with CODE MNKY
  const analysis = await codeMnkyClient.projects.analyzeChanges({
    baseBranch,
    headBranch,
    changedFiles,
    analysisDepth: 'comprehensive'
  });
  
  // Generate review comments
  const comments = analysis.issues.map(issue => ({
    path: issue.file,
    line: issue.line,
    body: `**CODE MNKY Analysis**: ${issue.message}\n\n${issue.suggestion || ''}`
  }));
  
  // Post comments to the PR
  await postReviewComments(prId, comments);
  
  // Generate overall review summary
  const summary = await codeMnkyClient.projects.generateReviewSummary({
    analysis,
    format: 'markdown',
    includeMetrics: true
  });
  
  // Post the summary as a PR comment
  await postPRComment(prId, summary);
}
```

### Documentation Generation Pipeline

```typescript
// Documentation generation workflow
async function generateProjectDocs(repositoryPath, outputDir) {
  // Discover project structure
  const projectStructure = await codeMnkyClient.projects.discoverStructure({
    repositoryPath,
    includePatterns: ['src/**/*.{ts,tsx,js,jsx}'],
    excludePatterns: ['**/*.test.*', '**/node_modules/**']
  });
  
  // Generate architecture overview
  const architecture = await codeMnkyClient.documentation.generateArchitecture({
    projectStructure,
    format: 'markdown',
    visualizations: true
  });
  fs.writeFileSync(`${outputDir}/architecture.md`, architecture);
  
  // Generate API documentation
  const apiDocs = await codeMnkyClient.documentation.generateApiReference({
    projectStructure,
    format: 'markdown',
    apiPatterns: ['src/api/**/*.ts', 'src/controllers/**/*.ts']
  });
  fs.writeFileSync(`${outputDir}/api-reference.md`, apiDocs);
  
  // Generate component documentation
  const componentDocs = await codeMnkyClient.documentation.generateComponentDocs({
    projectStructure,
    format: 'markdown',
    componentPatterns: ['src/components/**/*.tsx'],
    includeProps: true,
    includeExamples: true
  });
  fs.writeFileSync(`${outputDir}/components.md`, componentDocs);
  
  // Generate usage guide
  const usageGuide = await codeMnkyClient.documentation.generateUsageGuide({
    projectStructure,
    format: 'markdown',
    audienceLevel: 'developer'
  });
  fs.writeFileSync(`${outputDir}/usage-guide.md`, usageGuide);
  
  console.log(`Documentation generated in ${outputDir}`);
}
```

## Implementation Considerations

### Security Best Practices

- **Use environment variables** for API keys
- **Apply least privilege principle** to access tokens
- **Sanitize code** before sending to the API
- **Validate responses** before using in critical workflows
- **Implement proper webhook signature verification**

### Performance Optimization

- **Use batch API operations** for multiple files
- **Implement caching** for frequently analyzed files
- **Consider incremental analysis** for large codebases
- **Set appropriate analysis depth** based on needs
- **Use repository-aware clients** for context-aware operations

### Rate Limits and Quotas

CODE MNKY API implements rate limiting to ensure service stability:

| API Type | Default Limit | Enterprise Limit |
|----------|---------------|------------------|
| Analysis API | 100 req/hour | 1000 req/hour |
| Generation API | 50 req/hour | 500 req/hour |
| Documentation API | 30 req/hour | 300 req/hour |

Exceeding limits will return a `429 Too Many Requests` response with retry guidance.

## Development Resources

- [API Reference Documentation](https://developers.moodmnky.com/code-mnky/api)
- [Client Libraries](https://developers.moodmnky.com/code-mnky/libraries)
- [Sample Integrations](https://github.com/code-mnky/examples)
- [GitHub Integration Guide](https://developers.moodmnky.com/code-mnky/github)
- [Security Guidelines](https://developers.moodmnky.com/code-mnky/security)
