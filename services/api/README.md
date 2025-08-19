# Go API Service

This directory contains the Go service that powers the core REST API for the PDF editor.  It is built with [Gin](https://gin-gonic.com/) and uses PostgreSQL (via GORM) for persistence.  The service issues JSON Web Tokens (JWT) for authentication, serves pre‑signed URLs for file uploads/downloads, exposes billing and admin endpoints, and coordinates with the Python PDFOps service for heavy operations.

## Running locally

Make sure a PostgreSQL database and Redis instance are available (the provided `docker-compose.yml` takes care of this).  Then run:

```sh
cd services/api
go run .
```

The service will listen on `localhost:8080` by default.  Configuration is via environment variables; see `.env.example` at the repository root for all options.

## Directory structure

- `main.go` – program entry point, sets up routes, middleware and database connection.
- `jwt.go` – helpers for creating and parsing JWTs.
- `migrations/` – SQL migrations to create tables and seed demo data.  Use [golang-migrate](https://github.com/golang-migrate/migrate) to apply these outside of development.

## API endpoints

See the [OpenAPI specification](../../packages/shared/openapi.yaml) for a comprehensive description of each endpoint, request/response payloads and authentication requirements.
