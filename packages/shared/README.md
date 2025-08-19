# Shared package

This package holds types, interfaces and schemas shared across the front‑end and back‑end services.  Having a central place for these definitions helps avoid drift and makes it easier to generate clients or servers from OpenAPI/Protobuf specifications.

Contents:

- `src/index.ts` – TypeScript interfaces used by the Next.js frontend.
- `openapi.yaml` – The OpenAPI specification describing the REST API of the Go service.  You can use this file to generate clients in other languages using tools like `openapi-generator`.

To add a new schema or update existing definitions, modify `openapi.yaml` and `src/index.ts` together.  Keeping both in sync is vital for type safety and documentation accuracy.
