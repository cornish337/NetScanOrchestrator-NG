# NetScanOrchestrator-NG — Architecture

## Overview
A FastAPI service orchestrates Nmap batch scans and streams live output via WebSockets to a frontend. Results are saved to disk and persisted in Postgres (raw artifact paths) and can be re-parsed from canonical `-oX` XML to populate summaries.

## Components
- **API server**: FastAPI with Gunicorn/Uvicorn workers
- **Runner**: Async subprocess launches Nmap batches
- **WS Layer**: Per-scan rooms; broadcast stdout lines to clients at `/ws/{scan_id}`
- **Persistence**: `ResultRaw` stores XML/stdout/stderr paths per batch
- **Parser**: Minimal `xml.etree` pass over `-oX` outputs to produce host/port summaries
- **DB**: Postgres + Alembic migrations
- **Proxy**: Nginx front, HTTP + WS upgrades

## Data flow
1. Client starts a scan → API schedules async task and returns `scan_id`.
2. Runner writes outputs under `/var/lib/netscan/outputs/{scan_id}/` and streams stdout lines over WS.
3. On batch completion, paths are recorded as `ResultRaw` rows.
4. A parsing pass reads XML for durable summaries.

## Scaling notes
- For single-process deployments, the in-memory WS manager is sufficient.
- For multi-process/replicas, introduce Redis pub/sub for fan-out.
