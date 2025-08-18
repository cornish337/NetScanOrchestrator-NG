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

## Testing
⚠️ No automated tests were executed; analysis is based solely on static source review
