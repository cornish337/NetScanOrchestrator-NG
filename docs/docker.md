# Docker Documentation

This document explains the Docker setup for the NetScanOrchestrator project. Docker is the recommended way to run the application, as it simplifies dependency management and deployment.

Before starting, copy the provided `.env.example` file to `.env` and adjust values for `NSO_DATABASE_URL`, `NSO_OUTPUT_DIR`, and `NSO_NMAP_PATH` so that Docker Compose can load them.

## `docker-compose.yml`

The `docker-compose.yml` file at the root of the project defines the services that make up the application.

### Services

#### `db`

-   **Image:** `postgres:16`
-   **Purpose:** This service runs the PostgreSQL database.
-   **Environment:** It sets the database name, user, and password. These should match the `NSO_DATABASE_URL` used by the `api` service.
-   **Volumes:** It uses a named volume `dbdata` to persist the database data, so you don't lose your data when the container is stopped and removed.
-   **Healthcheck:** It includes a healthcheck to ensure that the `api` service only starts after the database is ready to accept connections.

#### `api`


-   **Build:** Built from `docker/Dockerfile.backend`.
-   **Purpose:** Runs the FastAPI backend application.
-   **Environment:** Uses `NSO_DATABASE_URL`, `NSO_OUTPUT_DIR`, and `NSO_NMAP_PATH`.
-   **Volumes:** Mounts the named volume `outputs` at `/data/outputs` for persistent Nmap scan results.
-   **Depends On:** Depends on the `db` service, so Docker Compose starts the database first.
-   **Capabilities:** `cap_add: [NET_RAW, NET_ADMIN]` allows Nmap to perform scans requiring elevated network privileges.

#### `gateway`

-   **Build:** Built from `docker/Dockerfile.gateway`.
-   **Purpose:** Serves the frontend assets and proxies API and WebSocket traffic to the `api` service.
-   **Ports:** Exposes port `80` on the host machine.
-   **Configuration:** Includes the Nginx configuration from `ops/nginx.conf`.
-   **Depends On:** Depends on the `api` service.


### Volumes

-   **`dbdata`:** Persists the PostgreSQL database data.
-   **`outputs`:** Persists the Nmap scan output files.

## Dockerfiles

### `docker/Dockerfile.backend`

This Dockerfile defines the image for the `api` service.


-   **Base Image:** Uses `python:3.12-slim`.
-   **Dependencies:** Copies `requirements.txt` and builds wheels with `pip wheel` in a separate build stage. The runtime stage installs these wheels without network access.
-   **Nmap:** Installs the `nmap` package so the backend can execute network scans.
-   **Application Code:** Copies the backend source into the image and runs it with `gunicorn` and `uvicorn` workers.

### `docker/Dockerfile.gateway`

This Dockerfile defines the image for the `gateway` service. It's a multi-stage build.

-   **Frontend Build Stage:**
    -   **Base Image:** `node:20-slim`
    -   **Purpose:** This stage builds the static frontend assets.
    -   It installs the npm dependencies and runs the `npm run build` script.
-   **Final Stage:**
    -   **Base Image:** `nginx:1.27-alpine`
    -   **Purpose:** This stage serves the built frontend.
    -   It copies the built assets from the frontend build stage.
    -   It also copies the `ops/nginx.conf` file to configure nginx.
