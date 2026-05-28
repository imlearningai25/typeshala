# Typeshala ⌨️

A production-grade, multi-language typing tutor platform inspired by [typeshala.smilepant.com](https://typeshala.smilepant.com).  
Practice typing in **English**, **Nepali**, and **Hindi** — earn XP, build streaks, climb the leaderboard.

---

## Features

- **Multi-language typing practice** — English, Nepali (Devanagari), Hindi
- **Real-time metrics** — WPM, accuracy, consistency (5-second window sampling)
- **Gamification** — XP system, levels, daily streaks, 9 achievement badges
- **Leaderboard** — all-time / monthly / weekly, filterable by language
- **Personal dashboard** — WPM trend chart, activity heatmap, achievement showcase
- **Admin panel** — system stats, user management, role promotion
- **JWT auth** — access + refresh tokens, Redis blacklist, automatic rotation
- **Observability** — Prometheus metrics, pre-built Grafana dashboard, Sentry error tracking
- **Redis caching** — language list (5 min TTL), leaderboard (2 min TTL)
- **CI/CD** — GitHub Actions: lint → test → build → push to GHCR on merge to main

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI 0.115 · Python 3.12 · SQLAlchemy 2 (async) · Alembic |
| Database | PostgreSQL 16 |
| Cache / Queue | Redis 7 |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS · TanStack Query |
| Auth | JWT (python-jose) · bcrypt (passlib) |
| Observability | Prometheus · Grafana · Sentry · structured JSON logs |
| Infrastructure | Docker Compose · NGINX · GitHub Actions · GHCR |

---

## Port Reference

All services use the **5100-series** host ports to avoid conflicts with local databases and other dev servers.

| Host Port | Service | Container Port | Notes |
|-----------|---------|---------------|-------|
| **5100** | PostgreSQL | 5432 | Dev DB |
| **5101** | Redis | 6379 | Cache + token blacklist |
| **5102** | Backend API | 8000 | FastAPI · hot-reload in dev |
| **5103** | Frontend | 5173 | Vite dev server · HMR enabled |
| **5104** | NGINX gateway | 80 | Routes `/api/*` → backend, `/` → frontend |
| **5105** | Prometheus | 9090 | Scrapes `/metrics` every 10 s |
| **5106** | Grafana | 3000 | Pre-provisioned Typeshala dashboard |
| **5107** | cAdvisor | 8080 | Docker container-level metrics |
| **5108** | node-exporter | 9100 | Host OS metrics |

> Container-internal ports (e.g. Postgres listening on 5432 inside its container) are unchanged.  
> Services communicate with each other using those internal ports; only the **host** side changes.

---

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) 24+

### 1 — Clone and configure

```bash
git clone https://github.com/<your-org>/typeshala.git
cd typeshala

cp .env.example .env
# Edit .env — at minimum change SECRET_KEY
```

### 2 — Build and start

```bash
docker compose build --no-cache    # first-time build (3–5 min)
docker compose up -d               # start all services detached
```

### 3 — Migrate and seed

```bash
docker compose exec backend alembic upgrade head          # run migrations (creates all 8 tables)
docker compose exec backend python -m app.seed            # insert 3 languages + 8 lessons (+ optional superuser)
```

### 4 — Open the app

| URL | What |
|-----|------|
| http://localhost:5103 | React frontend (Vite dev server) |
| http://localhost:5104 | NGINX gateway (recommended entry point) |
| http://localhost:5102/api/docs | Swagger UI |
| http://localhost:5102/api/redoc | ReDoc |

---

## Development Workflow

### Backend

```bash
# Run tests locally (SQLite in-memory — no Docker needed)
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
pytest                             # 116 tests, ≥ 80% coverage

# Inside Docker
docker compose exec backend pytest                                      # run tests
docker compose exec backend ruff check app tests && \
  docker compose exec backend mypy app                                  # lint
docker compose exec backend ruff format app tests                       # format
docker compose exec backend bash                                        # open shell
```

### Frontend

```bash
cd frontend
npm install
npm run dev                    # start local Vite dev server (proxies /api → localhost:5102)
npm run test                   # Vitest
npm run lint                   # ESLint
npm run build                  # production bundle
```

### Database

```bash
docker compose exec db psql -U typeshala -d typeshala                  # open psql
docker compose exec backend alembic upgrade head                        # apply migrations
docker compose exec backend alembic revision --autogenerate -m "add_foo"  # new migration
docker compose exec backend alembic downgrade -1                        # rollback one step
docker compose exec backend python -m app.seed                          # re-run seed (idempotent)
```

---

## Monitoring

```bash
# Start app + full monitoring stack
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

# Access
open http://localhost:5105     # Prometheus
open http://localhost:5106     # Grafana  (admin / typeshala_grafana)
open http://localhost:5107     # cAdvisor

# Stop monitoring containers only
docker compose -f docker-compose.monitoring.yml down
```

The pre-built **Typeshala — Application** Grafana dashboard shows:

- HTTP request rate, error rate, p50/p95/p99 latency
- Sessions submitted per language (real-time counter)
- WPM distribution histogram
- Active users gauge
- Container CPU, memory, and network I/O

---

## Environment Variables

Copy `.env.example` to `.env` and customise. Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | *(change me)* | JWT signing secret — use `openssl rand -hex 32` |
| `ENVIRONMENT` | `development` | `development` \| `staging` \| `production` |
| `POSTGRES_PASSWORD` | `typeshala_dev` | Database password |
| `REDIS_PASSWORD` | *(empty)* | Redis auth — enable in prod |
| `CORS_ORIGINS` | `["http://localhost:5103","http://localhost:5104"]` | Allowed frontend origins |
| `SENTRY_DSN` | *(empty)* | Leave empty to disable Sentry |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.1` | 10% of transactions sent to Sentry |
| `GRAFANA_ADMIN_PASSWORD` | `typeshala_grafana` | Grafana admin password |
| `FIRST_SUPERUSER_EMAIL` | *(unset)* | Seed script: create admin user |
| `FIRST_SUPERUSER_PASSWORD` | *(unset)* | Seed script: admin password |
| `FIRST_SUPERUSER_USERNAME` | *(unset)* | Seed script: admin username |

---

## Project Structure

```
typeshala/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # FastAPI routers (auth, users, languages, sessions, analytics, admin)
│   │   ├── core/            # Config, security, logging, middleware, Redis, cache, metrics
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── repositories/    # DB access layer
│   │   ├── schemas/         # Pydantic request/response models
│   │   ├── services/        # Business logic (auth, session, streak, achievement, leaderboard…)
│   │   ├── main.py          # App factory — Sentry + Prometheus init
│   │   └── seed.py          # Idempotent seed script
│   ├── alembic/             # Database migrations
│   └── tests/               # 116 tests — SQLite in-memory + fakeredis
├── frontend/
│   └── src/
│       ├── features/        # Pages: home, auth, lessons, practice, dashboard, leaderboard, admin
│       ├── components/      # Shared UI + typing engine components
│       ├── hooks/           # useTypingEngine, useAuth, useCurrentUser
│       ├── services/        # Typed API clients
│       ├── stores/          # Zustand stores (auth, theme)
│       └── lib/sentry.ts    # Sentry initialisation
├── monitoring/
│   ├── prometheus.yml                         # Scrape config
│   └── grafana/
│       ├── provisioning/datasources/          # Auto-connect Prometheus
│       ├── provisioning/dashboards/           # Auto-load dashboards
│       └── dashboards/typeshala.json          # Pre-built dashboard
├── nginx/
│   ├── nginx.conf           # Dev gateway config
│   └── nginx.prod.conf      # Production config (rate limiting, security headers, gzip)
├── docker-compose.yml               # Dev stack
├── docker-compose.prod.yml          # Production stack
├── docker-compose.monitoring.yml    # Prometheus + Grafana (composable overlay)
├── Makefile                         # Convenience aliases for all docker compose commands
├── TESTING_GUIDE.md                 # Step-by-step local testing guide
└── .env.example                     # All environment variable defaults
```

---

## API Overview

All endpoints are prefixed with `/api/v1`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | — | Liveness probe |
| `GET` | `/health/ready` | — | Readiness probe (checks DB + Redis) |
| `POST` | `/auth/register` | — | Register new user |
| `POST` | `/auth/login` | — | Login, returns access + refresh tokens |
| `POST` | `/auth/refresh` | — | Rotate refresh token |
| `POST` | `/auth/logout` | ✓ | Blacklist access token |
| `GET` | `/users/me` | ✓ | Get own profile |
| `PATCH` | `/users/me` | ✓ | Update profile |
| `POST` | `/users/me/change-password` | ✓ | Change password |
| `GET` | `/languages` | — | List languages *(cached 5 min)* |
| `GET` | `/lessons` | — | List lessons (filter by language/difficulty) |
| `GET` | `/lessons/{id}` | — | Get one lesson |
| `POST` | `/sessions` | ✓ | Submit typing session |
| `GET` | `/sessions/me` | ✓ | My session history |
| `GET` | `/sessions/me/stats` | ✓ | My aggregate stats |
| `GET` | `/analytics/me/wpm-history` | ✓ | Daily WPM trend |
| `GET` | `/analytics/me/activity` | ✓ | Activity heatmap data |
| `GET` | `/analytics/me/achievements` | ✓ | All achievements + earned status |
| `GET` | `/leaderboard` | — | Ranked list *(cached 2 min, filter by period/language)* |
| `GET` | `/admin/stats` | admin | System statistics |
| `GET` | `/admin/users` | admin | Paginated user list with search |
| `PATCH` | `/admin/users/{id}/role` | admin | Promote / demote user |
| `PATCH` | `/admin/users/{id}/active` | admin | Activate / deactivate user |
| `GET` | `/metrics` | — | Prometheus metrics endpoint |

Full interactive docs: http://localhost:5102/api/docs

---

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and PR:

1. **Backend** — Ruff lint · MyPy type-check · pytest (116 tests, ≥ 80% coverage) · Codecov upload
2. **Frontend** — ESLint · tsc · Vitest · Vite production build
3. **Docker check** — build backend + frontend images (no push, validates Dockerfiles)
4. **Publish** *(main branch only)* — push `ghcr.io/<owner>/typeshala-backend:latest` + `typeshala-frontend:latest` with git SHA tag

Required GitHub secrets: `CODECOV_TOKEN` (optional), `GITHUB_TOKEN` (automatic).

---

## Production Deployment

Before deploying, set all production values in your environment:
- `SECRET_KEY` — `openssl rand -hex 32`
- `POSTGRES_PASSWORD` — strong random password
- `REDIS_PASSWORD` — strong random password
- `SENTRY_DSN` — from your Sentry project settings
- `CORS_ORIGINS` — your actual frontend domain(s)

```bash
# Start production stack (multi-worker Uvicorn, resource limits, no dev mounts)
docker compose -f docker-compose.prod.yml up -d --build

# With monitoring
docker compose -f docker-compose.prod.yml -f docker-compose.monitoring.yml up -d --build

# Tear down
docker compose -f docker-compose.prod.yml down
```

---

## License

MIT
