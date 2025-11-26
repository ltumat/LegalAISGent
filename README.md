# LegalAISGent

Two-folder layout:
- `frontend/`: TanStack Start React app (chat UI, auth screens).
- `backend/`: FastAPI service with PostgreSQL + Drizzle schema (in `backend/drizzle`) and Pydantic models for validation.

## Prerequisites
- Bun (for the frontend and Drizzle tooling).
- Python 3.11+ for the FastAPI backend.
- PostgreSQL (see `backend/drizzle/docker-compose.yml` for a local dev stack).

## Setup
1) Install JS deps (workspace installs `frontend` and `backend/drizzle`):
```bash
bun install
```

2) Install Python deps:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e .
```

3) Configure env vars (copy `backend/.env.example` to `backend/.env` and fill in):
- `DATABASE_URL` (e.g. `postgresql://postgres:password@localhost:5432/LegalAISGent`)
- `OPENAI_API_KEY`
- `FRONTEND_ORIGIN` (default `http://localhost:3001`)
- `VITE_BACKEND_URL` / `BACKEND_URL` (default `http://localhost:8000`)

4) Apply the Drizzle schema to Postgres:
```bash
bun run db:push
```

## Running everything with one command

First, go to `backend/drizzle`. Then run:

```bash
bun run db:start
```

Now, from the repo root (after activating your virtualenv):
```bash
bun run dev
```
This starts:
- Postgres via Docker (idempotent `docker compose up -d` from `backend/drizzle`).
- FastAPI on `http://localhost:8000` (auth, health, private data, AI chat).
- Frontend dev server on `http://localhost:3001` with `/api` proxied to the backend.

Individual processes:
- Backend only: `bun run dev:backend`
- Frontend only: `bun run dev:backend`

## API notes
- Auth: `/api/auth/sign-up`, `/api/auth/sign-in`, `/api/auth/session`, `/api/auth/sign-out` (cookie-based sessions backed by Drizzle schema; Pydantic models mirror the tables).
- Core: `/api/health`, `/api/private` (requires session).
- Chat: `/api/ai` streams OpenAI completions using the system prompt at `backend/prompts/system-prompt.xml`.

## Drizzle schema
Tables are defined under `backend/drizzle/src/schema` (auth tables plus document chunks for RAG) and mirrored as Pydantic models in `backend/app/schemas.py` for validation/serialization. Use the bundled scripts (`bun run db:*`) for migrations and local Postgres via Docker.
