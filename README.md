# PDF Editor Monorepo

This repository contains a complete, self‑contained PDF editing service built to be easy to run locally via `docker compose` and ready to deploy to a small cluster.  It is intentionally modular and uses a **monorepo** layout so that every component (web, API, heavy PDF operations, shared packages, infrastructure) lives together and can evolve in lock‑step.

## High‑level overview

| Service | Tech | Purpose |
| --- | --- | --- |
| **`apps/web`** | Next.js + React (TypeScript) with TailwindCSS | Browser client which provides the UI for viewing, annotating and editing PDFs.  Uses PDF.js + pdf‑lib for rendering and lightweight client‑side edits.  Talks to `services/api` for authentication, file management and billing.  Uses Web Workers and OffscreenCanvas to keep the UI fluid even for large documents. |
| **`services/api`** | Go (Gin) | REST API responsible for users, auth, files, versions, subscriptions and ads.  Handles JWT/OAuth2 authentication, talks to PostgreSQL via GORM, uses Redis for caching and Celery queues.  Issues pre‑signed S3 URLs for upload/download. |
| **`services/pdfops`** | Python (FastAPI) + Celery | Performs heavy CPU‑bound PDF tasks such as OCR, redaction, optimization and repair.  Exposes idempotent job endpoints that return a job ID and supports server‑sent events (SSE) for progress updates.  Uses Tesseract for OCR and PyPDF2 for PDF manipulation. |
| **`packages/shared`** | TypeScript, Protobuf, OpenAPI specs | Shared types and schemas consumed by the frontend and backend services.  Having a single source of truth for your API contracts reduces the risk of drift between components. |
| **`infra`** | Docker, Kubernetes, Terraform | Infrastructure as code.  Includes Dockerfiles for each service, a `docker-compose.yml` for local development, sample Kubernetes manifests and a minimal Terraform script for provisioning a small cluster with S3‑compatible storage and managed Postgres. |

## Getting started

First clone the repository and install dependencies.  The only hard requirement is Docker; everything else runs in containers.

```sh
git clone <this‑repo> pdf-editor
cd pdf-editor
cp .env.example .env # supply secrets/keys for JWT signing, DB connection, Stripe, etc.
docker compose up --build
```

Once the stack has started you can open the application in your browser at [http://localhost:3000](http://localhost:3000) and sign up for a new account.  The default configuration seeds a free and pro user along with sample PDFs so you can immediately try out uploading, annotating, redacting and optimizing documents.  See [`docs/demo-script.md`](docs/demo-script.md) for a step‑by‑step walkthrough of the features.

For detailed information on architecture, design decisions, API reference and extensibility please consult the docs inside each sub‑package and the top‑level [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) document.

## Quick start (TL;DR)

1. **Clone and configure:** `git clone … && cd pdf-editor && cp .env.example .env`
2. **Run locally:** `docker compose up --build`
3. **Browse:** open [http://localhost:3000](http://localhost:3000) and follow the onboarding prompts.
4. **Read docs:** there are READMEs in each folder plus a comprehensive `docs/` directory.

If you prefer to run individual services outside of Docker you can follow the instructions in each directory's README, but Docker is the recommended path for development and production parity.
