# NetScanOrchestrator-NG

NetScanOrchestrator-NG is a web-based application designed to orchestrate Nmap scans, providing a user-friendly interface to manage and monitor network scanning tasks. It is built with a modern technology stack, featuring a FastAPI backend, a React frontend, and Docker for containerization.

This project is a complete rewrite of the original NetScanOrchestrator, focusing on a more robust architecture, a cleaner codebase, and improved scalability.

## Documentation

This README provides a high-level overview of the project. For detailed documentation, please refer to the following files in the `docs/` directory:

- **[Installation Guide](./docs/install.md):** Instructions for setting up the project.
- **[Usage Guide](./docs/usage.md):** How to use the application and its API.
- **[Architecture Overview](./docs/architecture.md):** A deep dive into the project's architecture.
- **[Frontend Documentation](./docs/frontend.md):** Details about the frontend application.
- **[Backend Documentation](./docs/backend.md):** Details about the backend application.
- **[API Reference](./docs/api.md):** Comprehensive documentation for the REST and WebSocket APIs.
- **[Docker Setup](./docs/docker.md):** Information about the Docker configuration.

## Features

### Completed
- **Web-based UI:** A React-based frontend for managing scans.
- **Project Management:** Organize scans into projects.
- **Nmap Scan Orchestration:** Start, and monitor Nmap scans from the UI.
- **Live Scan Output:** Real-time streaming of scan logs via WebSockets.
- **Quick Scan:** Launch ad-hoc Nmap scans and view the raw results without creating a project.
- **Concurrent Scans:** Run multiple scan batches in parallel.
- **Target Chunking:** Split large target lists into smaller chunks for scanning.
- **Dockerized Deployment:** Easy setup and deployment using Docker Compose.
- **REST API:** A comprehensive API for programmatic control.

### To Be Done
- **User Authentication and Authorization:** Secure the application with user accounts and roles.
- **Advanced Scan Results Parsing:** More detailed parsing of Nmap XML output.
- **Scan Scheduling:** Schedule scans to run at specific times.
- **Notifications:** Notify users when scans are complete.
- **Reporting:** Generate reports from scan results.
- **Redis Pub/Sub:** For WebSocket fan-out in multi-replica deployments.

## A Note on Documentation

This project is under active development. As new features are implemented, the documentation will be updated to reflect the changes. It is crucial to maintain and update the documentation in the `docs/` directory to ensure it remains accurate and useful for developers and users.

## Quick Start

For a quick start with Docker, see the [Installation Guide](./docs/install.md).
