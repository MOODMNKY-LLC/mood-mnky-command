# Notion API OpenAPI Specification

This directory contains the OpenAPI specification for the Notion API, converted from the original Postman collection.

## Files

- `notion-api.json` - The OpenAPI 3.0 specification for the Notion API

## Conversion Process

The OpenAPI specification was generated from the Postman collection using the `postman-to-openapi` tool. The conversion was done using a custom script that:

1. Takes the Postman collection as input
2. Configures the conversion with options like defaultTag and output format
3. Converts the Postman collection to OpenAPI 3.0.0
4. Saves the result as a nicely formatted JSON file

## Using the OpenAPI Specification

This OpenAPI specification can be used with:

- API documentation generators (Swagger UI, ReDoc, etc.)
- API client generators
- API testing tools
- API mocking tools

## Original Source

The original Postman collection can be found in the repository at:
`/postman_collections/Notion API.postman_collection.json`

## Additional Resources

- [Notion API Documentation](https://developers.notion.com/)
- [OpenAPI Specification](https://swagger.io/specification/) 