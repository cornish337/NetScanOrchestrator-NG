# Makefile — quality-of-life commands

SHELL := /bin/sh

# Default: prod-like
up:
\tdocker compose up -d

down:
\tdocker compose down

logs:
\t# Usage: make logs s=api  (or omit s= to stream all)
\tdocker compose logs -f --tail=200 $(s)

build:
\tdocker compose build --no-cache

clean:
\tdocker compose down -v --remove-orphans

# Dev (hot reload) — starts uvicorn --reload and a Vite dev server on 5173
dev:
\tdocker compose -f docker-compose.yml -f docker-compose.override.yml up --build

dev-logs:
\tdocker compose -f docker-compose.yml -f docker-compose.override.yml logs -f --tail=200 $(s)

# Shells
api-shell:
\tdocker compose exec api sh

db-shell:
\tdocker compose exec db sh

psql:
\t# psql inside the db container
\tdocker compose exec db psql -U postgres -d netscan

# DB migrations (alembic is in runtime deps)
migrate:
\tdocker compose exec api alembic revision --autogenerate -m "$(m)"

upgrade:
\tdocker compose exec api alembic upgrade head

downgrade:
\tdocker compose exec api alembic downgrade -1

# Smoke endpoints (through gateway or dev server)
smoke-gateway:
\tcurl -I http://localhost:8080/ || true ; \\
\tcurl -I http://localhost:8080/api/docs || true

smoke-dev:
\tcurl -I http://localhost:5173/ || true ; \\
\tcurl -I http://localhost:8000/docs || true
