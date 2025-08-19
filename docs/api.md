# API Documentation

## Overview
The service is a FastAPI application that coordinates Nmap scans and streams progress to clients over WebSockets. Scan artifacts are written to disk and tracked in a relational database for later parsing and summarization.

## Data Model
- **Project** – uniquely named collection of targets and scans
- **Scan** – records each launched scan, its parameters, status, and associated batches
- **Batch** – one chunk of targets run as a sub-task; stores count, arguments, and result link
- **ResultRaw** – file paths to the XML/stdout/stderr artifacts for a batch

## REST Endpoints
Paths below are prefixed with `/api` by the application root router.

### Projects
- `POST /projects` – create a project with name and optional description
- `GET /projects` – list all projects stored in the database

### Ad-hoc Nmap Execution
- `POST /nmap/run` – execute a single Nmap run.
  - **Body:** `{"nmap_flags": [...], "targets": [...]}`
  - Streams Nmap output, captures logs, and returns `{stdout, exit_code}`; non-zero exit codes return HTTP 500 with stderr text


### Managed Scans
- `POST /scans/start` – queue a multi-target scan.
  - **Body:** includes project ID, Nmap flags (default `["-T4","-Pn","-sS"]`), target list, chunk_size, and concurrency limits
  - **Response:** `{scan_id, status:"started"}`
- `POST /scans/{scan_id}/stop` – cancel all running batches for the given scan ID.

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

#### `GET /api/projects/{project_id}/scans`

List all scans for a given project.

-   **URL Parameters:**
    -   `project_id` (integer): The ID of the project.
-   **Response (200 OK):**
    ```json
    [
      {
        "id": 1,
        "project_id": 1,
        "status": "completed",
        "created_at": "..."
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

#### `GET /api/scans/{scan_id}/batches`

List all batches for a given scan.

-   **URL Parameters:**
    -   `scan_id` (integer): The ID of the scan.
-   **Response (200 OK):**
    ```json
    [
      {
        "id": 1,
        "scan_id": 1,
        "status": "completed",
        "targets": ["1.1.1.1", "8.8.8.8"]
      }
    ]
    ```

#### `GET /api/scans/{scan_id}/hosts`

List all hosts discovered in a given scan.

-   **URL Parameters:**
    -   `scan_id` (integer): The ID of the scan.
-   **Response (200 OK):**
    ```json
    [
      {
        "id": 1,
        "scan_id": 1,
        "address": "127.0.0.1",
        "hostname": "localhost"
      }
    ]
    ```

### Hosts

#### `GET /api/hosts/{host_id}`

Get detailed information about a specific host, including its open ports.

-   **URL Parameters:**
    -   `host_id` (integer): The ID of the host.
-   **Response (200 OK):**
    ```json
    {
      "id": 1,
      "scan_id": 1,
      "address": "127.0.0.1",
      "hostname": "localhost",
      "ports": [
        { "port": 80, "protocol": "tcp", "service": "http", "state": "open" }
      ]
    }
    ```

### Targets

#### `POST /api/targets/expand`

Expand a list of targets (e.g., CIDR ranges) into a list of individual IP addresses.

-   **Request Body:**
    ```json
    {
      "targets": ["192.168.1.0/30"]
    }
    ```
-   **Response (200 OK):**
    ```json
    {
      "targets": ["192.168.1.1", "192.168.1.2"]
    }
    ```

#### `GET /api/targets/{address}/history`

Get the scan history for a specific target address.

-   **URL Parameters:**
    -   `address` (string): The IP address of the target.
-   **Response (200 OK):**
    ```json
    [
      {
        "id": 1,
        "project_id": 1,
        "status": "completed",
        "created_at": "..."
      }
    ]
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
- `/ws/scans/{scan_id}` – join a room for real-time updates on a scan.

Upon connection, the server sends `{event:"connected", scan_id}`.

### Event Stream
During `start_scan`, batches are scheduled and progress is emitted:

Event | Payload fields
----- | -------------
`batch_start` | `batch_id`, `targets` for the chunk being processed
`line` | `batch_id`, `line` for each stdout line from Nmap
`batch_complete` | `batch_id`, summary of hosts and open ports parsed from XML
`scan_complete` | `scan_id` when all batches finish

## Legacy Scan Router
A previous router still exists under `/api/scans` with simpler semantics:


- `POST /api/scans/` to start a single-batch scan with optional flags
- `POST /api/scans/{scan_id}/stop` to cancel it
- WebSocket `/api/scans/ws/{scan_id}` for raw stdout lines

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


## Testing
⚠️ No automated tests were executed; analysis is based solely on static source review
