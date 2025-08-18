# Usage Guide

This document explains how to use the NetScanOrchestrator, covering both the web interface and the API.

## Web Interface

The web interface provides a user-friendly way to manage and run Nmap scans.

### 1. Creating a Project

Before you can start a scan, you need to create a project to organize your scans.

1.  Navigate to the web UI (e.g., `http://localhost/`).
2.  In the "Projects" section, you will see a form to create a new project.
3.  Enter a name for your project and an optional description.
4.  Click the "Create" button. Your new project will appear in the list.

### 2. Starting a Scan

Once you have a project, you can start a scan.

1.  Select the project you want to associate the scan with by clicking the radio button next to its name.
2.  In the "Start Scan" section, fill in the scan details:
    -   **Nmap flags:** The Nmap flags to use for the scan (e.g., `-sV -p-`).
    -   **Chunk size:** The number of targets to include in each Nmap batch.
    -   **Concurrency:** The number of Nmap batches to run in parallel.
    -   **Targets:** The list of targets to scan, one per line. Targets can be IP addresses, hostnames, or CIDR ranges.
    -   **Runner:** Choose the scanning engine to use:
        -   **Asyncio:** The modern, non-blocking runner that provides real-time streaming of Nmap output. This is the recommended option.
        -   **Legacy Parallel:** The original multiprocessing-based runner. This runner may be faster for a large number of small scans but does not provide real-time output. The results will be displayed only after the entire scan is complete.
3.  Click the "Start Scan" button.

### 3. Monitoring a Scan

When a scan is started, a "Live Stream" section will appear. This section displays the real-time output from the Nmap processes. The output is streamed from the backend via a WebSocket connection.

The active scan ID is also displayed, which can be used to interact with the scan via the API.

### 4. Nmap Runner (Utility)

The "Nmap Runner" section is a simple utility for running a one-off Nmap command without creating a project or a scan. It's useful for quick tests and debugging.

## API Usage

The API provides programmatic access to the NetScanOrchestrator's features. For a full API reference, see the [API Documentation](./api.md).

### Starting a Scan

To start a scan, send a `POST` request to the `/api/scans/start` endpoint.

**Request:**
```http
POST /api/scans/start
Content-Type: application/json

{
  "project_id": 1,
  "nmap_flags": ["-sS", "-Pn", "-T4"],
  "targets": ["scanme.nmap.org", "localhost"],
  "chunk_size": 256,
  "concurrency": 6
}
```

**Response:**
```json
{
  "scan_id": 123,
  "status": "started"
}
```

### Stopping a Scan

To stop a running scan, send a `POST` request to the `/api/scans/{scan_id}/stop` endpoint.

**Request:**
```http
POST /api/scans/123/stop
```

**Response:**
```json
{
  "scan_id": 123,
  "status": "stopping"
}
```

### WebSocket Streaming

To receive live scan output, connect a WebSocket client to the following URL:

`ws://<host>/ws/scans/{scan_id}`

Replace `<host>` with the application's hostname (e.g., `localhost`) and `{scan_id}` with the ID of the scan you want to monitor.

The server will send JSON-encoded messages with the scan output.
