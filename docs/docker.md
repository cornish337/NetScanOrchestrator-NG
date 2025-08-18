# Docker Documentation

This document explains the Docker setup for the NetScanOrchestrator project. Docker is the recommended way to run the application, as it simplifies dependency management and deployment.

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

-   **Build:** This service is built from the `docker/Dockerfile.backend` file.
-   **Purpose:** This service runs the FastAPI backend application.
-   **Environment:** It sets the environment variables required by the backend, such as the database URL and the output directory for scans.
-   **Volumes:** It mounts a named volume `outputs` to `/data/outputs`. This is where the Nmap scan results are stored, ensuring they persist.
-   **Depends On:** It depends on the `db` service, so Docker Compose will start the database before starting the API.
-   **Capabilities:** `cap_add: [NET_RAW, NET_ADMIN]` is necessary for Nmap to perform certain types of scans (like SYN scans) from within the container.

#### `nginx`

-   **Image:** `nginx:1.27-alpine`
-   **Purpose:** This service acts as a reverse proxy.
-   **Ports:** It exposes port `80` on the host machine.
-   **Volumes:** It mounts the `ops/nginx.conf` file into the container. This file configures Nginx to:
    -   Serve the static frontend files.
    -   Proxy requests to `/api` to the `api` service.
    -   Handle WebSocket upgrades for the `/ws` path.
-   **Depends On:** It depends on the `api` service.

### Volumes

-   **`dbdata`:** Persists the PostgreSQL database data.
-   **`outputs`:** Persists the Nmap scan output files.

## `docker/Dockerfile.backend`

This Dockerfile defines the image for the `api` service.

-   **Base Image:** It starts from a `python:3.11-slim` base image.
-   **Poetry:** It installs Poetry, the dependency manager for the backend.
-   **Nmap:** It installs `nmap`, which is required by the backend to run scans.
-   **Dependencies:** It copies the `pyproject.toml` and `poetry.lock` files and installs the Python dependencies using Poetry. This is done in a separate layer to take advantage of Docker's layer caching.
-   **Application Code:** It copies the backend application code into the image.
-   **Command:** The default command runs the application using `gunicorn` with `uvicorn` workers, which is a production-ready setup for a FastAPI application.
