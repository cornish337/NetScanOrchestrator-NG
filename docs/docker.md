# Docker Documentation

This document explains the Docker setup for the NetScanOrchestrator project. Docker is the recommended way to run the application, as it simplifies dependency management and deployment. The backend uses Poetry for dependency management.

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
-   **Environment:** Uses `NSO_DATABASE_URL`, `NSO_OUTPUT_DIR` (default `./data/outputs`), and `NSO_NMAP_PATH` (default `nmap`).
-   **Volumes:** Mounts the named volume `outputs` at `/data/outputs` for persistent Nmap scan results.
-   **Depends On:** Depends on the `db` service, so Docker Compose starts the database first.
-   **Capabilities:** `cap_add: [NET_RAW, NET_ADMIN, NET_BIND_SERVICE]` allows Nmap to perform scans requiring elevated network privileges.
    When running the container manually, add `--cap-add=NET_RAW,NET_ADMIN,NET_BIND_SERVICE` to `docker run` to supply these capabilities.

#### `frontend`

-   **Build:** Built from `docker/Dockerfile.frontend`, which first compiles the frontend with Node and then serves the static files with Nginx.
-   **Purpose:** Serves the built frontend assets and proxies API and WebSocket traffic to the `api` service.
-   **Ports:** Exposes port `8080` on the host, mapping to port `80` in the container.
-   **Configuration:** Includes the Nginx configuration from `ops/nginx.conf`.
-   **Depends On:** Depends on the `api` service.


### Volumes

-   **`dbdata`:** Persists the PostgreSQL database data.
-   **`outputs`:** Persists the Nmap scan output files.

## Dockerfiles

### `docker/Dockerfile.backend`

This Dockerfile defines the image for the `api` service.

-   **Base Image:** Uses `python:3.12-slim`.
-   **Dependencies:** The project uses Poetry for dependency management. The Dockerfile exports the dependencies to a `requirements.txt` file and builds wheels with `pip wheel` in a separate build stage. The runtime stage installs these wheels without network access.
-   **Nmap:** The Dockerfile explicitly installs the `nmap` package and sets the necessary capabilities so the backend can execute network scans.
-   **Application Code:** Copies the backend source into the image and runs it with `gunicorn` and `uvicorn` workers.

### `docker/Dockerfile.frontend`

This Dockerfile defines the image for the `frontend` service. It's a multi-stage build that compiles the frontend with Node and then serves the static files with Nginx.

-   **Frontend Build Stage:**
    -   **Base Image:** `node:20-slim`
    -   **Purpose:** This stage builds the static frontend assets.
    -   It installs the npm dependencies and runs the `npm run build` script.
-   **Final Stage:**
    -   **Base Image:** `public.ecr.aws/y9w1g0t0/nginxinc/nginx-unprivileged:1.21-alpine`
    -   **Purpose:** This stage serves the built frontend with Nginx.
    -   It copies the built assets from the frontend build stage.
    -   It also copies the `ops/nginx.conf` file to configure Nginx.
