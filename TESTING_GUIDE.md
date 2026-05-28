# Typeshala — Local Testing Guide (Phases 1–5)

This guide walks you through every layer of the stack: automated unit/API tests (no Docker needed), the full Docker dev environment, manual API verification, and frontend smoke testing.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Docker Desktop | 24+ | https://www.docker.com/products/docker-desktop |
| Docker Compose | 2.x (bundled) | included with Docker Desktop |
| Python | 3.12+ | https://www.python.org/downloads/ |
| Node.js | 20+ | https://nodejs.org/ |
| `curl` or HTTPie | any | `brew install httpie` / `pip install httpie` |

> **Windows users:** run all commands in **PowerShell** or **Git Bash**. WSL2 also works fine.

---

## 1 — Repository Layout

```
typeshala/
├── backend/          # FastAPI + SQLAlchemy 2 + Alembic
│   ├── app/
│   ├── alembic/
│   ├── tests/
│   ├── requirements.txt
│   └── pyproject.toml
├── frontend/         # React 18 + TypeScript + Vite
│   └── src/
├── nginx/            # NGINX gateway config
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
└── Makefile
```

---

## 2 — Environment Setup

```bash
# From the project root
cd typeshala

# Copy the example env file
cp .env.example .env
```

Open `.env` and set a real `SECRET_KEY` (or leave the default for local dev).
To also create an admin superuser during seed, uncomment these three lines:

```env
FIRST_SUPERUSER_EMAIL=admin@example.com
FIRST_SUPERUSER_PASSWORD=SuperSecret1!
FIRST_SUPERUSER_USERNAME=admin
```

---

## 3 — Automated Test Suite (No Docker Required)

The full test suite uses **SQLite in-memory** + **fakeredis** — no Postgres or Redis container needed.

### 3.1 — Install Python dependencies

```bash
cd backend

# Create a virtual environment
python -m venv .venv

# Activate it
# macOS/Linux:
source .venv/bin/activate
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1

# Install all deps
pip install -r requirements.txt
```

### 3.2 — Run the full test suite

```bash
# From backend/
pytest
```

Expected output:

```
tests/api/test_admin.py         12 passed
tests/api/test_analytics.py     14 passed
tests/api/test_auth.py           9 passed
tests/api/test_health.py         2 passed
tests/api/test_languages.py      9 passed
tests/api/test_sessions.py       9 passed
tests/api/test_users.py          8 passed
tests/unit/test_metrics.py      14 passed
tests/unit/test_security.py      7 passed
tests/unit/test_user_service.py  5 passed

============================== 116 passed in ~30s =============================
```

Coverage report is written to `backend/htmlcov/index.html` — open it in a browser to see line-by-line coverage (target: ≥ 80%).

### 3.3 — Run a specific test file

```bash
# Only unit tests
pytest tests/unit/

# Only API tests
pytest tests/api/

# Single file
pytest tests/api/test_sessions.py -v

# Single test by name
pytest tests/api/test_sessions.py::test_submit_session -v
```

---

## 4 — Docker Dev Environment

### 4.1 — Build and start all services

```bash
# From typeshala/ root
docker-compose up --build
```

Or using Make:

```bash
make build   # build without cache
make up      # start (attached, shows all logs)
make up-d    # start detached
```

First build takes 3–5 minutes. Subsequent starts are fast.

### 4.2 — Verify all services are healthy

```bash
docker-compose ps
```

You should see all containers with status `healthy` or `running`:

```
NAME                    STATUS
typeshala-db-1          healthy
typeshala-redis-1       healthy
typeshala-backend-1     healthy
typeshala-frontend-1    running
typeshala-nginx-1       running
```

### 4.3 — Service URLs

| Service | URL | Notes |
|---------|-----|-------|
| Frontend (Vite dev) | http://localhost:5103 | Hot-reload enabled |
| Backend API (direct) | http://localhost:5102 | Hot-reload enabled |
| API via NGINX | http://localhost:5104/api/v1 | Gateway |
| API docs (Swagger) | http://localhost:5102/docs | Interactive |
| API docs (Redoc) | http://localhost:5102/redoc | Readable |
| PostgreSQL | localhost:5100 | User: typeshala / Pass: typeshala_password |
| Redis | localhost:5101 | No auth in dev |

---

## 5 — Database Migrations and Seeding

### 5.1 — Run Alembic migrations

```bash
make migrate
# or directly:
docker-compose exec backend alembic upgrade head
```

This runs `alembic/versions/0001_initial_schema.py` which creates all 8 tables:
`users`, `languages`, `lessons`, `typing_sessions`, `achievements`, `user_achievements`, `daily_challenges`, `leaderboard_entries`.

### 5.2 — Seed languages, lessons, and optional superuser

```bash
make seed
# or:
docker-compose exec backend python -m app.seed
```

The seed script is idempotent — safe to run multiple times. It inserts:

- **3 languages:** English (en 🇬🇧), Nepali (ne 🇳🇵), Hindi (hi 🇮🇳)
- **8 lessons** across all three languages and three difficulty levels (beginner / intermediate / advanced)
- **Superuser** (if `FIRST_SUPERUSER_*` env vars are set in `.env`)

Expected output:

```
[seed] Language 'English' already exists — skipping.
[seed] Language 'Nepali' — created.
[seed] Language 'Hindi' — created.
[seed] Lesson 'Home Row Keys' — created.
...
[seed] Done.
```

### 5.3 — Verify seeded data via psql

```bash
make shell-db
# then inside psql:
SELECT code, name, flag_emoji FROM languages;
SELECT title, difficulty FROM lessons ORDER BY language_id, order_index;
\q
```

---

## 6 — Manual API Testing

All examples use `http` (HTTPie). Replace with `curl` if preferred — curl equivalents are shown in comments.

Base URL: `http://localhost:5102/api/v1`

### 6.1 — Health check

```bash
http GET http://localhost:5102/api/v1/health
# curl: curl http://localhost:5102/api/v1/health
```

Expected: `200 OK` with `{"status": "ok", ...}`

### 6.2 — Register a new user

```bash
http POST http://localhost:5102/api/v1/auth/register \
  username=testuser \
  email=test@example.com \
  password=MyPassword1

# curl:
# curl -X POST http://localhost:5102/api/v1/auth/register \
#   -H "Content-Type: application/json" \
#   -d '{"username":"testuser","email":"test@example.com","password":"MyPassword1"}'
```

Expected: `201 Created` with the user object (id, username, email, role=user, total_xp=0, level=1, …).

### 6.3 — Log in and capture tokens

```bash
http POST http://localhost:5102/api/v1/auth/login \
  username=testuser \
  password=MyPassword1
```

Save the `access_token` from the response. All subsequent protected requests need:
`Authorization: Bearer <access_token>`

```bash
# Set a shell variable for convenience:
TOKEN="<paste access_token here>"
```

### 6.4 — Get your profile

```bash
http GET http://localhost:5102/api/v1/users/me \
  "Authorization: Bearer $TOKEN"
```

### 6.5 — List languages

```bash
http GET http://localhost:5102/api/v1/languages
```

Returns the 3 seeded languages. No auth required.

### 6.6 — List lessons (optionally filtered)

```bash
# All lessons
http GET http://localhost:5102/api/v1/lessons

# Filter by language code
http GET "http://localhost:5102/api/v1/lessons?language_code=en"

# Filter by difficulty
http GET "http://localhost:5102/api/v1/lessons?difficulty=beginner"
```

Note the `id` (UUID) of a lesson — you'll need it for the next step.

### 6.7 — Submit a typing session

```bash
LESSON_ID="<paste a lesson UUID here>"

http POST http://localhost:5102/api/v1/sessions \
  "Authorization: Bearer $TOKEN" \
  lesson_id="$LESSON_ID" \
  wpm:=65 \
  accuracy:=92.5 \
  duration_seconds:=60 \
  characters_typed:=300 \
  errors:=24 \
  raw_keystrokes:='[]'
```

Expected: `201 Created` with computed fields (xp_earned, consistency, cpm, …).
Your profile's `total_xp`, `level`, and `current_streak` will update automatically.

### 6.8 — View your session history

```bash
http GET http://localhost:5102/api/v1/sessions \
  "Authorization: Bearer $TOKEN"
```

### 6.9 — View your stats

```bash
http GET http://localhost:5102/api/v1/sessions/stats/me \
  "Authorization: Bearer $TOKEN"
```

Returns aggregated avg_wpm, best_wpm, total_sessions, total_time, total_xp.

### 6.10 — Analytics: WPM history

```bash
http GET http://localhost:5102/api/v1/analytics/me/wpm-history \
  "Authorization: Bearer $TOKEN"
```

### 6.11 — Analytics: Activity heatmap

```bash
http GET http://localhost:5102/api/v1/analytics/me/activity \
  "Authorization: Bearer $TOKEN"
```

### 6.12 — Achievements

```bash
http GET http://localhost:5102/api/v1/analytics/me/achievements \
  "Authorization: Bearer $TOKEN"
```

Returns all 9 achievements. `earned_at` is non-null for any you've already unlocked.

### 6.13 — Leaderboard

```bash
# All-time
http GET http://localhost:5102/api/v1/leaderboard

# Weekly
http GET "http://localhost:5102/api/v1/leaderboard?period=weekly"

# Filter by language
http GET "http://localhost:5102/api/v1/leaderboard?language_code=en"
```

### 6.14 — Token refresh

```bash
REFRESH_TOKEN="<paste refresh_token here>"

http POST http://localhost:5102/api/v1/auth/refresh \
  refresh_token="$REFRESH_TOKEN"
```

Returns a new `access_token` + `refresh_token` pair (old refresh token is blacklisted).

### 6.15 — Logout

```bash
http POST http://localhost:5102/api/v1/auth/logout \
  "Authorization: Bearer $TOKEN"
```

The access token is immediately blacklisted. Any subsequent request using it will return `401`.

---

## 7 — Admin API Testing

The admin endpoints require `role=admin`. Use the superuser account created by the seed script, or promote a user first.

### 7.1 — Log in as superuser

```bash
http POST http://localhost:5102/api/v1/auth/login \
  username=admin \
  password="SuperSecret1!"

ADMIN_TOKEN="<paste access_token>"
```

### 7.2 — System stats

```bash
http GET http://localhost:5102/api/v1/admin/stats \
  "Authorization: Bearer $ADMIN_TOKEN"
```

Returns counts for users, active users, languages, lessons, sessions, achievements.

### 7.3 — List all users (with search and role filter)

```bash
# All users, paginated
http GET http://localhost:5102/api/v1/admin/users \
  "Authorization: Bearer $ADMIN_TOKEN"

# Search by username or email
http GET "http://localhost:5102/api/v1/admin/users?search=testuser" \
  "Authorization: Bearer $ADMIN_TOKEN"

# Filter by role
http GET "http://localhost:5102/api/v1/admin/users?role=user" \
  "Authorization: Bearer $ADMIN_TOKEN"
```

### 7.4 — Promote a user to admin

```bash
USER_ID="<paste user UUID>"

http PATCH "http://localhost:5102/api/v1/admin/users/$USER_ID/role" \
  "Authorization: Bearer $ADMIN_TOKEN" \
  role=admin
```

### 7.5 — Deactivate a user

```bash
http PATCH "http://localhost:5102/api/v1/admin/users/$USER_ID/active" \
  "Authorization: Bearer $ADMIN_TOKEN" \
  is_active:=false
```

### 7.6 — Confirm non-admins are blocked

```bash
# Using the regular user token — should return 403
http GET http://localhost:5102/api/v1/admin/stats \
  "Authorization: Bearer $TOKEN"
```

---

## 8 — Frontend Smoke Testing

### 8.1 — Access the app

Open http://localhost:5103 in your browser.

### 8.2 — Checklist

**Public pages**

- [ ] **Home page** loads with a call-to-action and navigation bar
- [ ] **Lessons page** (`/lessons`) shows all 8 seeded lessons; language pills filter correctly; difficulty filter works
- [ ] **Leaderboard** (`/leaderboard`) loads; period tabs (All Time / Monthly / Weekly) switch correctly; podium renders for top 3

**Authentication**

- [ ] **Register** (`/register`) — create a new account; form validates password length and required fields
- [ ] **Login** (`/login`) — log in; navbar changes to show username + Dashboard link
- [ ] **Logout** — clicking logout clears session and redirects to home

**Typing practice**

- [ ] Click any lesson → goes to `/practice/:lessonId`
- [ ] Click the typing area (or press any key) → session starts, timer begins
- [ ] Type the lesson text:
  - Correct characters appear **green**
  - Incorrect characters appear **red**
  - WPM meter updates in real time
  - Accuracy bar updates in real time
- [ ] Finish the lesson → Results card appears with WPM, accuracy, grade (S/A/B/C/D), XP earned
- [ ] **Try Again** resets the session; **Next Lesson** navigates forward

**Dashboard** (requires login)

- [ ] `/dashboard` shows your streak, level, XP, achievements unlocked count
- [ ] WPM trend chart renders (flat on first session, line after multiple sessions)
- [ ] Activity strip shows a dot for today
- [ ] Achievement badges: earned ones appear in color, unearned appear greyed out
- [ ] Recent sessions table lists your completed sessions

**Admin panel** (requires admin role)

- [ ] `/admin` redirects non-admin users to `/dashboard`
- [ ] Logged in as admin: system stats cards show correct counts
- [ ] User table is paginated; search input filters by username/email
- [ ] Promote/demote role buttons work; page refreshes with updated role badge
- [ ] Activate/deactivate toggle works

**Guest-only redirect**

- [ ] While logged in, visiting `/login` or `/register` redirects to `/`

---

## 9 — Running Tests Inside Docker

If you prefer to run the test suite in the same environment as CI:

```bash
make test-backend
# or:
docker-compose exec backend pytest
```

The container uses the same SQLite in-memory + fakeredis approach, so no Postgres connection is needed during tests.

---

## 10 — Useful Make Targets

```
make help              Show all available targets

make up                Start all services (attached)
make up-d              Start all services (detached)
make down              Stop all services
make build             Rebuild all images (no cache)
make logs              Tail all logs
make logs-backend      Tail backend logs only

make migrate           Run pending Alembic migrations
make migrate-auto      Generate a new migration (MSG=your_message)
make migrate-down      Rollback one migration
make seed              Seed languages, lessons, and optional superuser

make shell-backend     Open bash inside the backend container
make shell-db          Open psql inside the db container

make test-backend      Run pytest (with coverage)
make lint-backend      Run ruff + mypy
make format-backend    Run ruff formatter

make test-frontend     Run Vitest frontend tests
make lint-frontend     Run ESLint
```

---

## 11 — Troubleshooting

### Backend container keeps restarting

```bash
docker-compose logs backend
```

Common causes:
- **DB not ready yet:** the `depends_on` healthcheck should handle this; if it fails, run `make down && make up-d` to retry
- **Missing env vars:** check `.env` exists and has valid `SECRET_KEY`

### `alembic upgrade head` fails with "relation already exists"

The DB has stale tables from a previous run. Either:
```bash
# Option A — drop and recreate the volume
docker-compose down -v
docker-compose up -d
make migrate

# Option B — stamp current state (if you just want to move forward)
docker-compose exec backend alembic stamp head
```

### Tests fail locally but pass in Docker

Most likely a Python version mismatch. The project targets **Python 3.12**. Check:
```bash
python --version
```
If < 3.12, upgrade or use pyenv/asdf to switch versions.

### `fakeredis` import error

```bash
pip install fakeredis[aioredis]
```

The `[aioredis]` extra is required for the async interface used by the test fixtures.

### Frontend shows "Failed to fetch" errors

The Vite dev server proxies `/api/v1` calls to `http://localhost:5102`. Make sure the backend container is running:
```bash
docker-compose ps backend
```

If it's down, restart it:
```bash
docker-compose up -d backend
```

### Port conflicts

All services use the 5100-series host ports to avoid common conflicts. If any of those ports are still in use:
1. Find what's using it: `lsof -i :<port>` (macOS/Linux) or `netstat -ano | findstr :<port>` (Windows)
2. Either stop the conflicting process, or change the host port in `docker-compose.yml` (e.g., change `"5100:5432"` to `"5200:5432"`)

---

## 12 — Quick Sanity Check Script

Paste this into a terminal (after `make up-d && make migrate && make seed`) for a fast end-to-end smoke test:

```bash
BASE="http://localhost:5102/api/v1"

# Health
echo "--- Health ---"
curl -s $BASE/health | python3 -m json.tool

# Register
echo "--- Register ---"
curl -s -X POST $BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"smoketest","email":"smoke@test.com","password":"Smoke1234"}' \
  | python3 -m json.tool

# Login
echo "--- Login ---"
RESP=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"smoketest","password":"Smoke1234"}')
echo $RESP | python3 -m json.tool
TOKEN=$(echo $RESP | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Languages
echo "--- Languages ---"
curl -s $BASE/languages | python3 -m json.tool

# Lessons
echo "--- Lessons ---"
curl -s $BASE/lessons | python3 -m json.tool

echo "--- Done. TOKEN=$TOKEN ---"
```

---

*All 116 automated tests pass as of Phase 6. Happy testing!*
