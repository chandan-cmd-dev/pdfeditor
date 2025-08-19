# Architecture Tour

This document provides a high‑level view of how the PDF editing platform is structured and why certain technologies were chosen.  The system is deliberately designed around **modular services** and **clear API contracts** in order to facilitate future evolution such as swapping out the PDF engine or adding new billing providers.

## Monorepo layout

The root of the repository is split into logical sub‑directories:

- `apps/web`: The Next.js frontend.  All UI, client‑side state management, and PDF rendering/annotation logic live here.  We use Next.js for its mature framework features (automatic code splitting, optimized bundling, robust routing) while keeping dependencies minimal.  Server components are **not** used; instead everything runs purely on the client so that the backend API remains a simple, stateless REST service.
- `services/api`: A Go (Gin) service that exposes RESTful endpoints for authentication, file management, billing and admin functions.  It uses JWT and optionally OAuth2/OIDC for authentication.  PostgreSQL serves as the canonical data store, while Redis offers caching and distributed locks for rate limiting and Celery coordination.
- `services/pdfops`: A Python FastAPI microservice for operations that cannot be performed efficiently in the browser.  Heavy tasks such as OCR or redaction may require C libraries or long running CPU jobs, so we run them in worker processes backed by Celery and Redis.  The service exposes HTTP endpoints for job submission and uses Server Sent Events (SSE) to stream progress back to clients.
- `packages/shared`: Types, schemas and shared utilities used across the monorepo.  Having a single place to define OpenAPI specs, database models and UI tokens reduces duplication and ensures alignment across languages.  We use [`protobuf`](https://developers.google.com/protocol-buffers) for messages in gRPC contexts and JSON‑schema for validation on the client.
- `infra`: Infrastructure as code.  Contains Dockerfiles for each service, a `docker-compose.yml` for local development, Kubernetes manifests (Deployment, Service, Ingress, HPA, Secrets) and Terraform examples for provisioning cloud resources such as a managed PostgreSQL instance and an S3 bucket.  The services are entirely configured via environment variables to follow the [Twelve‑Factor App](https://12factor.net/) methodology.

## Why these choices?

**Go for the API**: Go offers a great balance between performance and simplicity.  The Gin framework is minimal yet powerful, enabling rapid development without hiding HTTP semantics.  Go's static typing and concurrency model make it suitable for high throughput services such as file uploads and pre‑signing S3 requests.

**Python for heavy PDF work**: Python has rich PDF and OCR ecosystems (PyPDF2, pdfplumber, Tesseract bindings).  FastAPI provides an ASGI server with built‑in support for async operations and modern type hints.  Celery and Redis allow us to offload expensive jobs to worker processes, ensuring that the web UI remains responsive.

**Next.js + Tailwind**: The frontend uses Next.js primarily for its build system and routing.  The application itself is client‑side rendered, which simplifies deployment (no need for SSR servers) and avoids coupling UI rendering with the API.  TailwindCSS provides a utility‑first design system that keeps the CSS footprint very small.  We augment the base design with [shadcn/ui](https://ui.shadcn.com) components and [Framer Motion](https://www.framer.com/motion/) for subtle animations.  All interactive behaviour is written in TypeScript.

**PDF.js and pdf‑lib**: Rendering PDFs in the browser is delegated to [PDF.js](https://mozilla.github.io/pdf.js/), which is battle‑tested and allows us to support complex documents (outlines, annotations, forms).  For editing we use [pdf‑lib](https://pdf-lib.js.org/) because it supports incremental updates and direct manipulation of PDF objects without rewriting unrelated content.  Should we need higher fidelity (e.g. full forms/JavaScript support), the architecture leaves room to swap in a WASM version of PDFium in the future.

**Data model**: The database schema is event‑sourced for edits.  Every change to a PDF is stored as a row in `edit_events` with a JSON payload describing what changed.  This allows us to build a rich timeline with undo/redo and diff functionality.  The `versions` table captures named snapshots (e.g. when the user clicks “Save”), and the `files` table points to the current version.  Subscription and invoice data is kept in separate tables to decouple billing logic from file storage.

**Security and privacy**: All endpoints are protected by JWT and optional two‑factor authentication.  We follow OWASP best practices such as validating all input via JSON‑schema, generating pre‑signed S3 URLs instead of directly handling file contents in the API, and storing only hashed passwords using Argon2.  The stack is built with multi‑tenancy in mind: every table includes a `tenant_id` and appropriate indexes.  Audit logging is implemented in middleware and recorded in the `audit_logs` table.

**Ad integration and revenue model**: Ads are injected via Google AdSense into specific slots (top banner, right rail, footer) only for free tier users who have given consent.  We implement a simple IAB TCF stub to ask for consent.  Subscribing to the Pro or Team plan (managed through Stripe) automatically disables ads.  The API listens to Stripe webhooks to keep subscription status in sync.

## Future considerations

- **gRPC**: The Go API could expose a gRPC interface in addition to REST to allow high performance clients or microservices to communicate more efficiently.  The OpenAPI/Protobuf files in `packages/shared` make this straightforward.
- **WASM‑PDFium**: Should the limitations of pdf‑lib become prohibitive (e.g. editing complex forms), the client editing code is isolated behind an interface so that a WASM build of PDFium can be introduced later without touching the rest of the application.
- **Horizontal scaling**: The included Kubernetes manifests demonstrate how to deploy the system to a cluster.  Configuring horizontal pod autoscalers (HPA) on CPU and memory can ensure the system scales under load.  Using an S3‑compatible object store (e.g. MinIO or AWS S3) decouples storage from compute instances.
- **Internationalisation (i18n)**: The frontend is prepared for translation by using keys and fallback values.  Adding additional languages only requires translation files and updating the i18n provider.
