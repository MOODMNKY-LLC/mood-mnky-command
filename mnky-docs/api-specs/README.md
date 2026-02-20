# API Specifications in MNKY-REPO

This directory contains OpenAPI/Swagger specifications for various APIs integrated with the MOOD MNKY ecosystem within our monorepo. These specifications serve as the source of truth for API integrations across MNKY services.

## Role in MNKY-REPO

The `api-specs` directory centralizes all external API definitions that integrate with the MOOD MNKY platform. It serves several purposes:

- Provides reference documentation for developers working on integrations
- Enables automatic client code generation for our services
- Ensures consistency across all API implementations
- Facilitates testing and validation of API-dependent features

## Directory Structure

```
api-specs/
├── bungie/              # Bungie API specifications for game integrations
│   ├── bungie-api-v1.json
│   └── bungie-api-v2.json
├── flowise/             # Flowise API specifications for AI workflow automation
│   ├── flowise-api-v1.0.0.json
│   ├── flowise-api-v1.0.0.yaml
│   └── flowise-swagger-full.yaml
├── n8n/                 # n8n API specifications for workflow automation
│   └── n8n-public-api-v1.1.1.yaml
└── README.md            # This file
```

## Integration with MNKY Services

These API specifications are used by various components within our monorepo:

- **CODE MNKY**: Uses these specs for generating API clients and validating responses
- **MOOD MNKY**: Integrates with these APIs for AI-assisted automation workflows
- **Virtual Agents**: Consume these APIs when performing automated tasks
- **Supabase Backend**: References these specs for data validation and transformation

## File Naming Convention

API specification files follow this naming convention:

- `{service-name}-api-v{version}.{format}` - Standard API specs
- `{service-name}-swagger-{detail}.{format}` - Swagger UI definitions

Where:
- `{service-name}` is the name of the service (e.g., n8n, flowise, bungie)
- `{version}` is the API version (e.g., 1.0.0, 1.1.1)
- `{format}` is either `json` or `yaml`/`yml`
- `{detail}` provides additional context (e.g., "full" for complete Swagger definitions)

## Monorepo Integration Tools

To leverage these API specs within our monorepo, we use:

1. **Swagger UI** - Interactive API documentation
   ```
   npm install swagger-ui-dist
   ```

2. **Redoc** - Clean, responsive documentation
   ```
   npm install redoc
   ```

3. **OpenAPI Generator** - Generate clients, stubs, documentation
   ```
   npm install @openapitools/openapi-generator-cli
   ```

4. **Spectral** - Linting and validation
   ```
   npm install @stoplight/spectral-cli
   ```

## MNKY-REPO Best Practices

- Keep API specs versioned using semantic versioning
- Use YAML format for better readability when possible
- Validate specs before committing
- Document breaking vs. non-breaking changes
- Always update relevant client code when API specs change
- When adding new API integrations, follow the established directory structure
- Link to the relevant API specs in service documentation
- Test all integrations with the Supabase backend before deployment 