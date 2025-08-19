# Environment variables

All services are configured via environment variables with sensible defaults for local development.  A sample `.env.example` is provided at the repository root; copy it to `.env` and fill in any secrets before running the stack.  The `docker-compose.yml` file automatically loads values from `.env`.

Below is a summary of the key variables used by each component.

## Web app (`apps/web`)

| Variable | Default | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Base URL for the Go API service.  Must be publicly reachable by the browser. |
| `NEXT_PUBLIC_PDFOPS_URL` | `http://localhost:9000` | Base URL for the PDFOps service. |
| `PUBLIC_ADSENSE_CLIENT_ID` | _empty_ | Google AdSense client ID used to request ads in the UI. |

## API service (`services/api`)

| Variable | Default | Description |
| --- | --- | --- |
| `API_PORT` | `8080` | Port the API listens on. |
| `API_HOST` | `0.0.0.0` | Host the API binds to. |
| `API_POSTGRES_DSN` | `postgres://postgres:postgres@db:5432/pdfeditor?sslmode=disable` | Connection string for PostgreSQL. |
| `API_JWT_SECRET` | `secret` | Secret used to sign JWT tokens.  Should be random in production. |
| `API_REDIS_ADDR` | `redis:6379` | Address of Redis for caching and rate limiting. |
| `API_S3_ENDPOINT` | `http://minio:9000` | Endpoint for the S3‑compatible object store. |
| `API_S3_ACCESS_KEY` | `minio` | Access key for S3. |
| `API_S3_SECRET_KEY` | `supersecret` | Secret key for S3. |
| `API_S3_BUCKET` | `pdf-editor` | Bucket name for storing files. |
| `API_STRIPE_SECRET` | _empty_ | Stripe secret key used for subscription billing. |
| `API_STRIPE_WEBHOOK_SECRET` | _empty_ | Stripe webhook signing secret. |
| `API_OAUTH_GOOGLE_CLIENT_ID` | _empty_ | Google OAuth client ID. |
| `API_OAUTH_GOOGLE_CLIENT_SECRET` | _empty_ | Google OAuth client secret. |

## PDFOps service (`services/pdfops`)

| Variable | Default | Description |
| --- | --- | --- |
| `PDFOPS_PORT` | `9000` | Port the FastAPI server listens on. |
| `PDFOPS_BROKER_URL` | `redis://redis:6379/0` | Celery broker URL for queuing jobs. |
| `PDFOPS_RESULT_BACKEND` | `redis://redis:6379/1` | Celery result backend for storing task results and progress. |

Set any variable to override its default.  For example, to run the API on a different port you could export `API_PORT=8090` before starting `docker-compose`.
