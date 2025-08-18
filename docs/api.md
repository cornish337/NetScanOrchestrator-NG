# API Documentation

This document provides a detailed reference for the NetScanOrchestrator's REST and WebSocket APIs.

## REST API

The REST API is the primary way to interact with the application programmatically. The API base path is `/api`.

### Projects

#### `POST /api/projects`

Create a new project.

-   **Request Body:**
    ```json
    {
      "name": "My First Project",
      "description": "An optional description for the project."
    }
    ```
-   **Response (200 OK):**
    ```json
    {
      "id": 1,
      "name": "My First Project"
    }
    ```

#### `GET /api/projects`

List all projects.

-   **Response (200 OK):**
    ```json
    [
      {
        "id": 1,
        "name": "My First Project",
        "description": "An optional description for the project."
      }
    ]
    ```

### Scans

#### `POST /api/scans/start`

Start a new scan.

-   **Request Body:**
    ```json
    {
      "project_id": 1,
      "nmap_flags": ["-sS", "-Pn", "-T4"],
      "targets": ["scanme.nmap.org", "localhost"],
      "runner": "asyncio",
      "chunk_size": 256,
      "concurrency": 6
    }
    ```
    -   `runner` (string, optional): The scanning engine to use. Can be `"asyncio"` (default) or `"multiprocessing"`.
-   **Response (200 OK):**
    ```json
    {
      "scan_id": 123,
      "status": "started"
    }
    ```

#### `POST /api/scans/{scan_id}/stop`

Stop a running scan.

-   **URL Parameters:**
    -   `scan_id` (integer): The ID of the scan to stop.
-   **Response (200 OK):**
    ```json
    {
      "scan_id": 123,
      "status": "stopping"
    }
    ```

### Nmap Runner (Utility)

#### `POST /api/nmap/run`

Run a one-off Nmap command. This is a utility endpoint for direct Nmap execution.

-   **Request Body:**
    ```json
    {
      "nmap_flags": ["-A", "scanme.nmap.org"],
      "targets": ["scanme.nmap.org"]
    }
    ```
-   **Response (200 OK):**
    ```json
    {
      "stdout": "...",
      "exit_code": 0
    }
    ```
-   **Error Response (500 Internal Server Error):**
    If the Nmap command fails, the response will have a status code of 500 and the body will contain the stderr output from Nmap.

## WebSocket API

The WebSocket API is used for streaming live output from running scans.

### Connection URL

`ws://<host>/ws/scans/{scan_id}`

-   **URL Parameters:**
    -   `scan_id` (integer): The ID of the scan to monitor.

### Messages

The server sends JSON-encoded messages to the client.

-   **On Connection:**
    When a client first connects, the server sends a confirmation message.
    ```json
    {
      "event": "connected",
      "scan_id": 123
    }
    ```

-   **Scan Events:**
    During a scan, the server sends various event messages. The `event` field determines the type of the message.

    -   **`line`**: A single line of output from an Nmap process.
        ```json
        {
          "event": "line",
          "batch_id": 1,
          "line": "Starting Nmap..."
        }
        ```
    -   **`batch_start`**: Indicates that a new batch of targets has started scanning.
        ```json
        {
          "event": "batch_start",
          "batch_id": 1,
          "targets": ["1.1.1.1", "8.8.8.8"]
        }
        ```
    -   **`batch_complete`**: Indicates that a batch has finished.
        ```json
        {
          "event": "batch_complete",
          "batch_id": 1,
          "summary": { "hosts_up": 2, "open_ports": 3 }
        }
        ```
    -   **`scan_complete`**: Sent when the entire scan is finished (for the `asyncio` runner).
        ```json
        {
          "event": "scan_complete",
          "scan_id": 123
        }
        ```
    -   **`legacy_scan_complete`**: Sent when a scan using the `multiprocessing` runner is finished. The `results` field contains an array of the results from each chunk.
        ```json
        {
          "event": "legacy_scan_complete",
          "results": [ ... ]
        }
        ```

The client does not need to send any messages to the server; the connection is one-way (server-to-client) after the initial handshake.
