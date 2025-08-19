# Architecture Overview

This document provides a detailed overview of the NetScanOrchestrator-NG architecture. The system is designed to be a scalable and robust platform for orchestrating Nmap scans.

## High-Level Diagram

```text
+-----------------+      +-----------------+      +-----------------+
|   Web Browser   |<---->|      Nginx      |<---->|   FastAPI App   |
+-----------------+      +-----------------+      +-----------------+
                             |                      |
                             | (WebSocket)          | (Subprocess)
                             |                      |
                             v                      v
                         +-----------------+      +-----------------+
                         | WebSocket Hub   |<---->|   Nmap Runner   |
                         +-----------------+      +-----------------+
                                                    |
                                                    | (Database)
                                                    v
                                                +-----------------+
                                                |   PostgreSQL    |
                                                +-----------------+
```

## Components

The application is composed of several key components that work together to provide the scanning functionality.

### 1. Frontend

-   **Framework:** React with Vite for building.
-   **Language:** TypeScript.
-   **State Management:** Tanstack Query for managing server state and caching.
-   **UI:** Tailwind CSS for styling.
-   **Functionality:** Provides a user interface for creating projects, starting scans, and viewing live output. It communicates with the backend via a REST API and WebSockets.

### 2. Reverse Proxy

-   **Service:** Nginx.
-   **Functionality:**
    -   Serves the static frontend files.
    -   Acts as a reverse proxy for the backend API, forwarding requests from `/api` to the FastAPI application.
    -   Handles WebSocket upgrades, proxying WebSocket connections to the backend.

### 3. Backend

-   **Framework:** FastAPI.
-   **Language:** Python.
-   **Layers:** The backend is structured into three main layers:
    -   **API Layer (`backend/api`):** Defines the REST endpoints and WebSocket handlers. It's responsible for request validation and serialization.
    -   **Domain Layer (`backend/domain`):** Contains the core business logic. This includes the `ScanCoordinator`, which manages the lifecycle of a scan, and the `NmapRunner`, which executes Nmap commands.
    -   **Infrastructure Layer (`backend/infra`):** Handles external concerns like database connections (`db.py`), WebSocket connection management (`ws_hub.py`), and database models (`models.py`).
-   **Asynchronous:** The backend is fully asynchronous, using `asyncio` to handle concurrent operations like running multiple Nmap scans and managing WebSocket connections.

### 4. Database

-   **Service:** PostgreSQL.
-   **ORM:** SQLAlchemy with `asyncpg` for asynchronous database access.
-   **Migrations:** Alembic is used to manage database schema migrations.
-   **Models:** The database stores information about projects, scans, and scan results.

### 5. Nmap Runner

-   **Implementation:** A Python module (`backend/domain/runner.py`) that uses `asyncio.create_subprocess_exec` to run Nmap commands as child processes.
-   **Output Streaming:** It captures the `stdout` of the Nmap process in real-time and streams it back to the `ScanCoordinator`.
-   **Concurrency:** The system can run multiple Nmap processes concurrently, with the level of concurrency being configurable for each scan.

## Data Flow for a Scan

1.  **Initiation:** A user starts a scan from the frontend. A `POST` request is sent to the `/api/scans/start` endpoint.
2.  **Coordination:** The `ScanCoordinator` receives the request. It creates a new scan record in the database and divides the targets into chunks.
3.  **Execution:** The `ScanCoordinator` creates a set of concurrent tasks, where each task runs an `NmapRunner` for a chunk of targets.
4.  **Live Output:**
    -   The frontend opens a WebSocket connection to `ws://<host>/ws/scans/{scan_id}`.
    -   As the `NmapRunner` captures output from the Nmap process, it passes the lines to the `ScanCoordinator`.
    -   The `ScanCoordinator` broadcasts the lines to all connected WebSocket clients for that scan via the `WebSocketHub`.
5.  **Completion:**
    -   When an Nmap process finishes, the runner saves the output files (XML, nmap, gnmap) to disk.
    -   The path to the output files is stored in the database.
    -   (Future) A parser can be run on the XML output to extract detailed results and store them in the database.

## Scalability Considerations

-   **Current State:** The current implementation uses an in-memory WebSocket manager, which is suitable for a single-process deployment.
-   **Future Scaling:** For a multi-process or multi-replica deployment, the WebSocket manager would need to be replaced with a message broker like Redis Pub/Sub. This would allow WebSocket messages to be broadcast across all instances of the application, ensuring that users receive live updates regardless of which server they are connected to.
