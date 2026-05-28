# Typeshala ⌨️

A production-grade typing tutor platform with real-time feedback, gamification, a Ramayana-themed typing game, and full CI/CD.

---

## Features

- **Typing practice** — lessons by difficulty (beginner → advanced), real-time WPM, accuracy and consistency
- **Keyboard guide** — interactive QWERTY display with per-finger colour zones and hand diagrams; highlights the next key to press
- **Ramayana Battle** — arcade typing game where you defeat falling demons by typing their words before time runs out; victory/defeat summary screen
- **Gamification** — XP, levels, daily streaks, 9 achievement badges
- **Leaderboard** — all-time / monthly / weekly rankings
- **Personal dashboard** — WPM trend chart, activity heatmap, achievement showcase, session history
- **Admin panel** — system stats, user management, role promotion
- **JWT auth** — access + refresh tokens, Redis blacklist, automatic rotation
- **Observability** — Prometheus metrics, Grafana dashboard, Sentry error tracking
- **Legal pages** — Terms of Service and Privacy Policy at `/terms` and `/privacy`
- **CI/CD** — GitHub Actions: test → build → push to GHCR → deploy via SSH

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Backend | FastAPI 0.115 · Python 3.12 · SQLAlchemy 2 (async) · Alembic · Celery |
| Database | PostgreSQL 16 |
| Cache / Queue | Redis 7 |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS · TanStack Query · Framer Motion |
| Auth | JWT (python-jose) · bcrypt (passlib) |
| Observability | Prometheus · Grafana · Sentry · structured JSON logs |
| Infrastructure | Docker Compose · NGINX · GitHub Actions · GHCR |

---

## Port Reference

| Host Port | Service | Notes |
| --- | --- | --- |
| **5100** | PostgreSQL | Dev DB |
| **5101** | Redis | Cache + token blacklist |
| **5102** | Backend API | FastAPI · hot-reload in dev |
| **5103** | Frontend | Vite dev server · HMR enabled |
| **5104** | NGINX gateway | Routes `/api/*` → backend, `/` → frontend |
| **5105** | Prometheus | Scrapes `/metrics` every 10 s |
| **5106** | Grafana | Pre-provisioned Typeshala dashboard |
| **5107** | cAdvisor | Docker container-level metrics |
| **5108** | node-exporter | Host OS metrics |

---

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) 24+

### 1 — Clone and configure

```bash
git clone https://github.com/<your-org>/typeshala.git
cd typeshala
cp .env.example .env
# Edit .env — at minimum set a strong SECRET_KEY
```

### 2 — Build and start

```bash
docker compose build --no-cache    # first-time build (~3–5 min)
docker compose up -d               # start all services
```

### 3 — Migrate and seed

```bash
docker compose exec backend alembic upgrade head        # create all tables
docker compose exec backend python -m app.seed          # insert English lessons + optional admin user
```

To seed an admin user, set these environment variables before running the seed:

```bash
FIRST_SUPERUSER_EMAIL=admin@example.com \
FIRST_SUPERUSER_PASSWORD=Secret1! \
FIRST_SUPERUSER_USERNAME=admin \
docker compose exec backend python -m app.seed
```

### 4 — Open the app

| URL | What |
| --- | --- |
| <http://localhost:5104> | App (NGINX gateway — recommended) |
| <http://localhost:5103> | Frontend direct (Vite dev server) |
| <http://localhost:5102/api/docs> | Swagger UI |
| <http://localhost:5102/api/redoc> | ReDoc |

---

## Development Workflow

### Hot reload

Both services use volume mounts — **no rebuild needed** when you edit source files:

- **Frontend** — Vite HMR updates the browser automatically
- **Backend** — `uvicorn --reload` restarts within ~1 s

Rebuild only when you change `requirements.txt`, `package.json`, or a `Dockerfile`:

```bash
docker compose up --build backend     # rebuild backend only
docker compose up --build frontend    # rebuild frontend only
```

### Backend

```bash
# Local (no Docker)
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pytest --tb=short -q                 # tests use SQLite in-memory + fakeredis

# Inside Docker
docker compose exec backend pytest
docker compose exec backend bash     # open shell
```

### Frontend

```bash
cd frontend
npm install
npm run dev          # local Vite server (proxies /api → localhost:5102)
npm run test         # Vitest unit tests
npm run lint         # ESLint
npx tsc --noEmit     # TypeScript check
npm run build        # production bundle
```

### Database

```bash
docker compose exec db psql -U typeshala -d typeshala                  # psql shell
docker compose exec backend alembic upgrade head                        # apply migrations
docker compose exec backend alembic revision --autogenerate -m "msg"    # new migration
docker compose exec backend alembic downgrade -1                        # rollback one step
```

---

## Monitoring

```bash
# Start app + monitoring stack together
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

open http://localhost:5105     # Prometheus
open http://localhost:5106     # Grafana  (admin / typeshala_grafana)
```

---

## Environment Variables

Copy `.env.example` → `.env`. Key variables:

| Variable | Default | Description |
| --- | --- | --- |
| `SECRET_KEY` | *(change me)* | JWT signing key — use `openssl rand -hex 32` |
| `ENVIRONMENT` | `development` | `development` \| `staging` \| `production` |
| `POSTGRES_PASSWORD` | `typeshala_password` | Database password |
| `REDIS_PASSWORD` | *(empty)* | Redis auth — always set in prod |
| `CORS_ORIGINS` | `["http://localhost:5103","http://localhost:5104"]` | Allowed frontend origins |
| `SENTRY_DSN` | *(empty)* | Leave empty to disable Sentry |
| `FIRST_SUPERUSER_EMAIL` | *(unset)* | Seed script: create admin account |
| `FIRST_SUPERUSER_PASSWORD` | *(unset)* | Seed script: admin password |
| `FIRST_SUPERUSER_USERNAME` | *(unset)* | Seed script: admin username |

---

## Project Structure

```
typeshala/
├── .github/
│   └── workflows/
│       ├── ci.yml                   # Test on every push / PR
│       ├── deploy-staging.yml       # Build → push → SSH deploy on merge to main
│       └── deploy-production.yml    # Build → push → SSH deploy on tag or manual trigger
├── backend/
│   ├── app/
│   │   ├── api/v1/                  # Routers: auth, users, languages, sessions, analytics, admin
│   │   ├── core/                    # Config, security, logging, middleware, Redis, cache, metrics
│   │   ├── models/                  # SQLAlchemy ORM models
│   │   ├── repositories/            # DB access layer
│   │   ├── schemas/                 # Pydantic request/response models
│   │   ├── services/                # Business logic (auth, session, streak, achievement, leaderboard)
│   │   ├── celery_app.py            # Celery application instance
│   │   ├── tasks.py                 # Celery background tasks
│   │   ├── main.py                  # App factory
│   │   └── seed.py                  # Idempotent seed script (English lessons)
│   ├── alembic/                     # Database migrations
│   └── tests/                       # pytest — SQLite in-memory + fakeredis (no external services)
├── frontend/
│   └── src/
│       ├── features/
│       │   ├── home/                # Landing page (auth-aware CTAs)
│       │   ├── auth/                # Login + Register
│       │   ├── lessons/             # Lesson browser (English only)
│       │   ├── practice/            # Typing session with keyboard guide
│       │   ├── game/                # Ramayana Battle arcade game
│       │   ├── dashboard/           # Personal analytics hub
│       │   ├── leaderboard/         # Ranked typists
│       │   ├── admin/               # Admin panel
│       │   └── legal/               # Terms of Service + Privacy Policy
│       ├── components/
│       │   ├── typing/              # TypingArea, WpmMeter, AccuracyBar, ResultsCard, KeyboardDisplay
│       │   ├── layout/              # Navbar + Layout (with footer)
│       │   ├── auth/                # ProtectedRoute, GuestRoute
│       │   └── ui/                  # Button, Card, Badge, Skeleton, Input
│       ├── hooks/                   # useTypingEngine, useAuth, useCurrentUser, useAuthMutations
│       ├── services/                # Typed API clients (auth, session, language, analytics)
│       ├── stores/                  # Zustand: auth (sessionStorage), theme (localStorage)
│       └── types/                   # Shared TypeScript types
├── nginx/
│   ├── nginx.conf                   # Dev gateway
│   └── nginx.prod.conf              # Prod (rate limiting, security headers, gzip)
├── monitoring/                      # Prometheus + Grafana provisioning
├── docker-compose.yml               # Dev stack
├── docker-compose.stg.yml           # Staging stack (pulls images from GHCR)
├── docker-compose.prod.yml          # Production stack
├── docker-compose.monitoring.yml    # Observability overlay
└── .env.example                     # All environment variable defaults
```

---

## API Overview

All endpoints prefixed with `/api/v1`.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | — | Liveness probe |
| `GET` | `/health/ready` | — | Readiness probe (DB + Redis) |
| `POST` | `/auth/register` | — | Create account |
| `POST` | `/auth/login` | — | Login, returns access + refresh tokens |
| `POST` | `/auth/refresh` | — | Rotate refresh token |
| `POST` | `/auth/logout` | ✓ | Blacklist access token |
| `GET` | `/auth/me` | ✓ | Get own profile |
| `PATCH` | `/users/me` | ✓ | Update profile |
| `POST` | `/users/me/change-password` | ✓ | Change password |
| `GET` | `/languages` | — | List languages |
| `GET` | `/lessons` | — | List lessons (filter by language / difficulty) |
| `GET` | `/lessons/{id}` | — | Get one lesson |
| `POST` | `/sessions` | ✓ | Submit typing session |
| `GET` | `/sessions/me` | ✓ | My session history |
| `GET` | `/sessions/me/stats` | ✓ | My aggregate stats |
| `GET` | `/analytics/me/wpm-history` | ✓ | Daily WPM trend |
| `GET` | `/analytics/me/activity` | ✓ | Activity heatmap data |
| `GET` | `/analytics/me/achievements` | ✓ | Achievements + earned status |
| `GET` | `/leaderboard` | — | Ranked list (cached 2 min) |
| `GET` | `/admin/stats` | admin | System statistics |
| `GET` | `/admin/users` | admin | Paginated user list |
| `PATCH` | `/admin/users/{id}/role` | admin | Promote / demote user |
| `GET` | `/metrics` | — | Prometheus metrics |

Full interactive docs: <http://localhost:5102/api/docs>

---

## CI/CD

### How it works

| Workflow | Trigger | What it does |
| --- | --- | --- |
| `ci.yml` | Every push + PR | Run backend pytest + frontend tsc / lint / vitest |
| `deploy-staging.yml` | Merge to `main` | CI → build images → push to GHCR → SSH deploy to staging |
| `deploy-production.yml` | Push `v*.*.*` tag **or** manual trigger | CI guard → build images → push to GHCR → SSH deploy to production |

---

## One-time Setup

### Step 1 — GitHub Secrets

Go to your repository → **Settings → Secrets and variables → Actions → New repository secret** and add every secret in the table below.

#### Staging secrets

| Secret name | What to put |
| --- | --- |
| `STG_SSH_HOST` | Public IP or hostname of your staging server (e.g. `203.0.113.10`) |
| `STG_SSH_USER` | SSH username on that server (e.g. `ubuntu` or `deploy`) |
| `STG_SSH_KEY` | Full contents of the **private** SSH key whose public key is in `~/.ssh/authorized_keys` on the server |
| `STG_APP_DIR` | Absolute path where the repo lives on the server (e.g. `/home/ubuntu/typeshala`) |
| `STG_POSTGRES_USER` | Database username (e.g. `typeshala`) |
| `STG_POSTGRES_PASSWORD` | Strong password for Postgres |
| `STG_POSTGRES_DB` | Database name (e.g. `typeshala_stg`) |
| `STG_REDIS_PASSWORD` | Strong password for Redis |
| `STG_SECRET_KEY` | 64-char random string — run `openssl rand -hex 32` |
| `STG_CORS_ORIGINS` | Comma-separated allowed origins (e.g. `https://stg.typeshala.com`) |

#### Production secrets

Same names with `PROD_` prefix instead of `STG_`:

| Secret name | What to put |
| --- | --- |
| `PROD_SSH_HOST` | Public IP or hostname of your production server |
| `PROD_SSH_USER` | SSH username |
| `PROD_SSH_KEY` | Full private SSH key contents |
| `PROD_APP_DIR` | Absolute path on the server (e.g. `/home/ubuntu/typeshala`) |
| `PROD_POSTGRES_USER` | Database username |
| `PROD_POSTGRES_PASSWORD` | Strong password (different from staging) |
| `PROD_POSTGRES_DB` | Database name (e.g. `typeshala`) |
| `PROD_REDIS_PASSWORD` | Strong password (different from staging) |
| `PROD_SECRET_KEY` | Different 64-char secret — run `openssl rand -hex 32` |
| `PROD_CORS_ORIGINS` | Your production domain (e.g. `https://typeshala.com`) |

> **Tip:** Generate a secret key with `openssl rand -hex 32`

### Step 2 — Prepare each server

Run these once on both the staging and production server:

```bash
# 1. Install Docker + Docker Compose plugin
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # log out and back in after this

# 2. Clone the repo into the app directory
git clone https://github.com/<your-org>/typeshala.git /home/ubuntu/typeshala
cd /home/ubuntu/typeshala

# 3. Log in to GitHub Container Registry so the server can pull images
echo "<your-github-pat>" | docker login ghcr.io -u <your-github-username> --password-stdin
# PAT needs: read:packages scope
# Create one at: GitHub → Settings → Developer settings → Personal access tokens
```

> The deploy workflow SSHes in and runs `docker compose pull` + `docker compose up -d`,
> so the server only needs Docker, the repo cloned, and GHCR access.

### Step 3 — Add your SSH public key to each server

```bash
# On your local machine — generate a deploy key pair (no passphrase)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/typeshala_deploy

# Copy the PUBLIC key to the server
ssh-copy-id -i ~/.ssh/typeshala_deploy.pub ubuntu@<your-server-ip>

# The PRIVATE key goes into the GitHub secret (STG_SSH_KEY / PROD_SSH_KEY)
cat ~/.ssh/typeshala_deploy
# Copy the entire output (including -----BEGIN ... and -----END ...) into the secret
```

---

## Deploying to Staging

Staging deploys **automatically** every time you push or merge to `main`:

```bash
git push origin main
```

GitHub Actions will:

1. Run all tests (backend + frontend)
2. Build Docker images and push to `ghcr.io/<org>/typeshala/backend:stg-<sha>` and `frontend:stg-<sha>`
3. SSH into the staging server, pull the new images and restart all containers
4. Run `alembic upgrade head` to apply any new migrations

You can watch the progress under **Actions** in your GitHub repository.

---

## Deploying to Production

### Option A — Git tag (recommended)

```bash
# Make sure main is tested and working first
git checkout main && git pull

# Create and push a semver tag
git tag v1.2.0
git push origin v1.2.0
```

GitHub Actions picks up the tag, runs the build, and deploys to production automatically.

### Option B — Manual trigger

1. Go to your repository → **Actions** → **Deploy → Production**
2. Click **Run workflow**
3. Type `deploy-prod` in the confirmation field
4. Click **Run workflow**

### First production deploy

After the workflow completes, run migrations and seed data once:

```bash
ssh ubuntu@<your-prod-server>
cd /home/ubuntu/typeshala

# Apply migrations
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head

# (Optional) Seed initial data
docker compose -f docker-compose.prod.yml exec backend python -m app.seed

# (Optional) Create admin user
FIRST_SUPERUSER_EMAIL=admin@example.com \
FIRST_SUPERUSER_PASSWORD=YourStrongPassword1! \
docker compose -f docker-compose.prod.yml exec backend python -m app.seed
```

---

## Rolling Back

```bash
# Find the previous image tag in GitHub Packages or Actions history
# e.g. the previous tag was v1.1.0

# SSH into the server and redeploy the old tag manually
ssh ubuntu@<your-server>
cd /home/ubuntu/typeshala

export IMAGE_TAG=v1.1.0
docker compose -f docker-compose.prod.yml --env-file .env.production pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# Roll back the migration if needed
docker compose -f docker-compose.prod.yml exec backend alembic downgrade -1
```

---

## Contact

**Email:** typeshala@aipioneerlab.com  
**Terms:** [/terms](/terms)  
**Privacy:** [/privacy](/privacy)

---

## License

MIT
