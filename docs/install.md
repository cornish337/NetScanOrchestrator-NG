# Installation Guide

This document provides instructions for setting up the NetScanOrchestrator project. There are two primary methods for installation: using Docker (recommended) or setting up a manual development environment.

## Prerequisites

Before you begin, ensure you have the following software installed on your system:

- **Git:** For cloning the repository.
- **Docker and Docker Compose:** For the containerized setup.
- **Node.js and npm (or yarn/pnpm):** For manual frontend setup.
- **Python 3.10+ and Poetry:** For manual backend setup.

## Docker Installation (Recommended)

The recommended way to run NetScanOrchestrator is with Docker Compose. This method sets up all the necessary services, including the backend, frontend (served via Nginx), and the PostgreSQL database.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/cornish337/NetScanOrchestrator-NG.git
    cd NetScanOrchestrator-NG
    ```

2.  **Build and run the containers:**
    ```bash
    sudo docker compose up -d --build
    ```
    This command will build the Docker images and start all the services in detached mode.

3.  **Access the application:**
    -   **Web UI:** [http://localhost/](http://localhost/)
    -   **API Docs:** [http://localhost/api/docs](http://localhost/api/docs)

5.  **Stopping the application:**
    ```bash
    docker compose down
    ```

## Manual Installation (for Development)

A manual setup is suitable for developers who want to work on the frontend or backend directly.

### Backend Setup

1.  **Navigate to the project root.**

2.  **Install Python dependencies using Poetry:**
    ```bash
    poetry install
    ```

3.  **Set up the database:**
    You'll need a running PostgreSQL server. Configure the `NSO_DATABASE_URL` environment variable to point to your database.

4.  **Run database migrations:**
    ```bash
    poetry run alembic upgrade head
    ```

5.  **Run the backend server:**
    ```bash
    poetry run uvicorn backend.app:app --reload
    ```
    The backend will be available at `http://localhost:8000`.

### Frontend Setup

1.  **Navigate to the `frontend` directory:**
    ```bash
    cd frontend
    ```

2.  **Install Node.js dependencies:**
    ```bash
    npm install
    ```

3.  **Run the frontend development server:**
    ```bash
    npm run dev
    ```
    The frontend will be available at `http://localhost:5173`. It will be configured to proxy API requests to the backend server running on `http://localhost:8000`.

## Environment Variables

The application is configured using environment variables. The backend expects the following variables (with the `NSO_` prefix):

-   `NSO_DATABASE_URL`: The connection string for the PostgreSQL database.
-   `NSO_OUTPUT_DIR`: The directory where Nmap scan outputs are stored.
-   `NSO_NMAP_PATH`: The path to the `nmap` executable.

A `.env.example` file at the project root provides sample values for these variables. Copy it to `.env` and customize it for your environment:

```bash
cp .env.example .env
```

These are set in the `docker-compose.yml` for the Docker setup. For a manual setup, you can use a `.env` file or set them in your shell.
