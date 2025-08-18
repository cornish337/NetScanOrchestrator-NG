# Backend Documentation

This document provides an overview of the backend application, which is a FastAPI application responsible for orchestrating Nmap scans.

## Technology Stack

-   **Framework:** [FastAPI](https://fastapi.tiangolo.com/)
-   **Language:** Python
-   **Database:** [PostgreSQL](https://www.postgresql.org/)
-   **ORM:** [SQLAlchemy](https://www.sqlalchemy.org/) (with `asyncpg` for async support)
-   **Migrations:** [Alembic](https://alembic.sqlalchemy.org/)
-   **Dependency Management:** [Poetry](https://python-poetry.org/)

## Project Structure

The backend code is located in the `backend/` directory and follows a layered architecture pattern.

-   `backend/api/`: The API layer, responsible for handling HTTP requests and WebSocket connections.
-   `backend/domain/`: The domain layer, containing the core business logic of the application.
-   `backend/infra/`: The infrastructure layer, responsible for interacting with external systems like the database and WebSockets.
-   `backend/app.py`: The main entry point for the FastAPI application.
-   `alembic/`: The directory for Alembic database migrations.

## Key Modules

### `domain/scan_coordinator.py`

This is the heart of the backend's business logic. The `ScanCoordinator` is responsible for:
-   Taking a scan request from the API layer.
-   Creating a scan record in the database.
-   Splitting the targets into smaller chunks.
-   Creating and managing concurrent `NmapRunner` tasks for each chunk.
-   Broadcasting the output from the runners to the appropriate WebSocket clients.

### `domain/runner.py`

This module is responsible for executing Nmap scans.
-   It uses `asyncio.create_subprocess_exec` to run `nmap` as a non-blocking child process.
-   It captures the `stdout` of the `nmap` process line by line and yields it back to the caller (`ScanCoordinator`).
-   It handles the creation of output directories and files for each scan batch.

### `infra/ws_hub.py`

This module provides a `WebSocketHub` for managing WebSocket connections.
-   It maintains a dictionary of active connections for each `scan_id`.
-   It provides methods for connecting, disconnecting, and broadcasting messages to all clients for a specific scan.
-   This implementation is in-memory and suitable for single-process deployments.

### `infra/db.py` and `infra/models.py`

-   `db.py` sets up the SQLAlchemy engine and session management for asynchronous database access.
-   `models.py` defines the SQLAlchemy models that map to the database tables (e.g., `Project`, `Scan`, `ScanBatch`).

## Database and Migrations

The application uses PostgreSQL as its database. The schema is managed using Alembic.
-   The base models are defined in `backend/infra/models.py`.
-   Migrations are stored in the `alembic/versions/` directory.
-   To create a new migration after changing the models, you can run `poetry run alembic revision --autogenerate -m "description"`.
-   To apply migrations, run `poetry run alembic upgrade head`.

## Features

### Completed
-   REST API for managing projects and scans.
-   WebSocket API for live streaming of scan output.
-   Asynchronous, concurrent execution of Nmap scans.
-   Chunking of large target lists.
-   Database persistence of projects and scans.
-   Alembic for database migrations.

### To Be Done
-   **User Authentication and Authorization:** Implement OAuth2 or another authentication scheme.
-   **Advanced Results Parsing:** Parse the Nmap XML output and store it in the database in a structured way.
-   **Scan Scheduling:** Add a mechanism to schedule scans to run in the future or on a recurring basis.
-   **Redis Integration:** Use Redis for WebSocket pub/sub to support multi-replica deployments.
-   **Configuration Management:** Improve configuration handling to be more flexible.
-   **Error Handling:** More robust error handling and reporting.
