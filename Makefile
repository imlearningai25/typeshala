# ── Typeshala Development Makefile ────────────────────────────────────────────
.PHONY: help up up-d down build logs logs-backend shell-backend shell-db \
        migrate migrate-auto migrate-down test-backend test-frontend \
        lint-backend format-backend lint-frontend seed \
        prod-up prod-down \
        monitoring-up monitoring-down monitoring-logs

DOCKER_COMPOSE         = docker-compose
BACKEND                = $(DOCKER_COMPOSE) exec backend
DB_SHELL               = $(DOCKER_COMPOSE) exec db
MONITORING_COMPOSE     = $(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.monitoring.yml

help: ## Show this help
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-22s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ── Docker lifecycle ──────────────────────────────────────────────────────────
up: ## Start all services (attached)
	$(DOCKER_COMPOSE) up

up-d: ## Start all services (detached)
	$(DOCKER_COMPOSE) up -d

down: ## Stop all services
	$(DOCKER_COMPOSE) down

build: ## Rebuild all images (no cache)
	$(DOCKER_COMPOSE) build --no-cache

logs: ## Tail all logs
	$(DOCKER_COMPOSE) logs -f

logs-backend: ## Tail backend logs
	$(DOCKER_COMPOSE) logs -f backend

# ── Backend ───────────────────────────────────────────────────────────────────
shell-backend: ## Open a shell in the backend container
	$(BACKEND) bash

migrate: ## Run pending Alembic migrations
	$(BACKEND) alembic upgrade head

migrate-auto: ## Generate a new migration (MSG=your_message)
	$(BACKEND) alembic revision --autogenerate -m "$(MSG)"

migrate-down: ## Downgrade one migration
	$(BACKEND) alembic downgrade -1

test-backend: ## Run backend tests with coverage
	$(BACKEND) pytest

lint-backend: ## Lint backend code (ruff + mypy)
	$(BACKEND) ruff check app tests
	$(BACKEND) mypy app

format-backend: ## Format backend code
	$(BACKEND) ruff format app tests

# ── Frontend ──────────────────────────────────────────────────────────────────
test-frontend: ## Run frontend tests
	$(DOCKER_COMPOSE) exec frontend npm run test

lint-frontend: ## Lint frontend code
	$(DOCKER_COMPOSE) exec frontend npm run lint

# ── Database ──────────────────────────────────────────────────────────────────
shell-db: ## Open psql in the db container
	$(DB_SHELL) psql -U typeshala -d typeshala

seed: ## Seed the database with languages, lessons, and optional superuser
	$(BACKEND) python -m app.seed

# ── Monitoring ────────────────────────────────────────────────────────────────
monitoring-up: ## Start app + monitoring stack (Prometheus + Grafana + cAdvisor + node-exporter)
	$(MONITORING_COMPOSE) up -d

monitoring-down: ## Stop monitoring stack only
	$(DOCKER_COMPOSE) -f docker-compose.monitoring.yml down

monitoring-logs: ## Tail monitoring logs
	$(DOCKER_COMPOSE) -f docker-compose.monitoring.yml logs -f

# ── Production ────────────────────────────────────────────────────────────────
prod-up: ## Start production stack
	docker-compose -f docker-compose.prod.yml up -d --build

prod-down: ## Stop production stack
	docker-compose -f docker-compose.prod.yml down

prod-monitoring-up: ## Start production stack + monitoring
	docker-compose -f docker-compose.prod.yml -f docker-compose.monitoring.yml up -d --build
