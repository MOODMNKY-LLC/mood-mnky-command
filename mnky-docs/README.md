# MOOD MNKY Documentation

This directory contains the documentation for the MOOD MNKY ecosystem, organized using Mintlify.

## Directory Structure

The documentation follows this structure:

```
docs/
├── api/                  # API documentation
│   ├── core/             # Core API endpoints
│   ├── e-commerce/       # E-commerce API integration
│   ├── agents/           # Agent API endpoints
│   ├── openapi/          # OpenAPI specifications
│   └── reference/        # API specifications
│
├── api-specs/            # Detailed API specifications by service
│   ├── flowise/          # Flowise API specs
│   ├── langchain/        # Langchain API specs
│   ├── n8n/              # n8n API specs
│   ├── notion/           # Notion API specs
│   └── bungie-net/       # Bungie.net API specs
│
├── api-reference/        # Auto-generated API reference docs
│
├── guides/               # User and developer guides
│   ├── getting-started/  # Onboarding guides
│   ├── development/      # Development guides
│   ├── user/             # User guides
│   └── admin/            # Admin guides
│
├── agents/               # Agent documentation
│   ├── mood-mnky/        # MOOD MNKY agent
│   ├── code-mnky/        # CODE MNKY agent
│   ├── sage-mnky/        # SAGE MNKY agent
│   └── infrastructure/   # Agent infrastructure
│
├── platform/             # Platform documentation
│   ├── dojo/             # Dojo platform
│   ├── e-commerce/       # E-commerce integration
│   ├── personalization/  # Personalization systems
│   └── token-economy/    # Token economy
│
├── reference/            # Technical reference
│   ├── architecture/     # System architecture
│   ├── data-models/      # Data models and schemas
│   ├── integration/      # Integration points
│   └── security/         # Security reference
│
├── tutorials/            # Step-by-step tutorials
│   ├── development/      # Development tutorials
│   ├── customization/    # Customization tutorials
│   └── integration/      # Integration tutorials
│
├── brand/                # Brand documentation
│   ├── vision/           # Brand vision and mission
│   ├── design/           # Design guidelines
│   ├── products/         # Product catalog
│   └── strategy/         # Brand strategy
│
└── internal/             # Internal documentation
    ├── processes/        # Internal processes
    ├── development/      # Development practices
    └── infrastructure/   # Infrastructure documentation
```

## Navigation Configuration

Navigation is configured in the `docs.json` file, which organizes content into tabs and groups for the Mintlify interface.

## Writing Documentation

When writing documentation:

1. Create .mdx files in the appropriate directory
2. Use frontmatter to specify title and description
3. Follow the documentation style guide
4. Include appropriate cross-links to related content
5. Use Mintlify components for enhanced content

## API Documentation

### OpenAPI Specifications

We maintain OpenAPI specifications for our APIs and integrated third-party services in two locations:
- `/docs/api/openapi/` - Contains YAML and JSON OpenAPI specs
- `/docs/api-specs/` - Contains specs organized by service in subdirectories

### Converting Postman Collections to OpenAPI

To convert a Postman collection to an OpenAPI specification:

1. Install the required dependency:
```bash
pnpm add postman-to-openapi -D -w
```

2. Create a conversion script (example: `convert-postman.js`):
```javascript
const fs = require('fs');
const postmanToOpenApi = require('postman-to-openapi');

const inputFile = './path/to/your-collection.json';
const outputFile = './docs/api-specs/service-name/api-name.json';

// Additional options
const options = {
  defaultTag: 'API Name',
  outputFormat: 'json'
};

async function convert() {
  try {
    const openApiOutput = await postmanToOpenApi(inputFile, null, options);
    const openApiJson = JSON.parse(openApiOutput);
    fs.writeFileSync(outputFile, JSON.stringify(openApiJson, null, 2));
    console.log('OpenAPI spec generated successfully at:', outputFile);
  } catch (err) {
    console.error('Conversion error:', err);
  }
}

convert();
```

3. Run the script:
```bash
node convert-postman.js
```

4. Place the generated OpenAPI specification in both locations:
   - `docs/api-specs/service-name/api-name.json`
   - `docs/api/openapi/api-name.json`

5. Generate API reference documentation:
```bash
pwsh docs/convert-openapi.ps1
```

### Generating API Reference Documentation

We use the `convert-openapi.ps1` script to generate MDX-based API reference documentation from OpenAPI specifications. This script processes all OpenAPI files in the specified directories and outputs documentation to the `docs/api-reference/` directory.

## Local Development

From the **monorepo root** (recommended; preview at http://localhost:3333 to avoid clashing with the Next.js app on 3000):

```bash
pnpm docs:dev
```

Or from this directory, with the Mintlify CLI installed globally:

```bash
cd mnky-docs
mint dev
```

One-time preview without global install:

```bash
cd mnky-docs && npx mint dev
```

## Monorepo deployment (Mintlify dashboard)

This repo is a monorepo. To deploy only this documentation with Mintlify:

1. Open [Mintlify Git Settings](https://dashboard.mintlify.com/settings/deployment/git-settings).
2. Enable **Set up as monorepo**.
3. Set the documentation path to **`/mnky-docs`** (no trailing slash).
4. Save changes.

Mintlify will then use only the `mnky-docs` directory (including its `docs.json`) for builds and deployments.

## Publishing

Documentation is automatically published when changes are pushed to the main branch (when the Mintlify GitHub app is connected and the monorepo path above is set).

## Contributing

Please see the [Documentation Contribution Guide](./guides/development/documentation-guide.mdx) for information on how to contribute to the documentation.