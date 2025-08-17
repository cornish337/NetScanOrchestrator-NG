# NetScan Orchestrator Next — Sprint 1

This repository contains the early backend scaffold for NetScan Orchestrator Next.

## Changelog (this update)

**Backend**
- Added a WebSocket connection manager for per-scan broadcasting.
- Wired the scan coordinator to emit realtime events.
- Persist raw outputs (XML/stdout/stderr) in `results_raw` table after each batch.
- Introduced a stop endpoint that cancels in-flight batches for a scan.
- Added a tiny XML summary parser to showcase post-processing.
- Documented run instructions and Docker capability notes.

**Docs**
- This changelog, TODO list, and runbook captured here.

## What's still to build

1. Frontend minimal UI (Vite + React + Tailwind + TanStack Query).
2. Persistence polish with transactional batch finish and optional Postgres.
3. Resilience features such as retry/resplit and supervisor for recovery.
4. Parsing: proper Nmap XML into `host_results`/`port_results` tables.
5. Auth & multi-user support.
6. CLI wrapper using Typer.

## How to run (local)

```bash
python -m venv .venv && source .venv/bin/activate
pip install -U pip
pip install fastapi uvicorn[standard] sqlalchemy aiosqlite alembic pydantic
mkdir -p data/outputs
alembic revision --autogenerate -m "init" && alembic upgrade head
uvicorn backend.app:app --reload
```

### Docker (SYN scans)

Run as root **or** add `--cap-add=NET_RAW --cap-add=NET_ADMIN`. If capabilities aren’t present, the runner will fall back to `-sT`.

## API events (WebSocket)

Events broadcast today (JSON):
- `{"event":"connected","scan_id":<id>}`
- `{"event":"batch_start","batch_id":<id>,"targets":[...]}`
- `{"event":"line","batch_id":<id>,"line":"..."}`
- `{"event":"batch_complete","batch_id":<id>,"summary":{hosts_up,open_ports}}`
- `{"event":"scan_complete","scan_id":<id>}`

## Next tasks (detailed TODO)

- Frontend skeleton.
- DB lifecycle improvements.
- XML parsing.
- Resplit logic.
- Startup recovery.
- Dockerfile.
- CLI.
