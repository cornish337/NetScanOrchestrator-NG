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

**Frontend**
- Added a Vite + React + TypeScript UI with Tailwind and TanStack Query.
- Lists projects, allows starting scans, and streams live output via WebSocket.

**Docs**
- This changelog, TODO list, runbook, and frontend quickstart captured here.

## Install & Run

### Backend
- Python 3.11+, Nmap installed
- Setup:

```bash
python -m venv .venv && source .venv/bin/activate
pip install -U pip
pip install fastapi uvicorn[standard] sqlalchemy aiosqlite alembic pydantic
mkdir -p data/outputs
alembic revision --autogenerate -m "init" && alembic upgrade head
uvicorn backend.app:app --reload --port 8000
```

### Frontend
- Node 18+
- Setup:

```bash
cd frontend
npm install
npm run dev
```

If your backend is on a different origin, create `.env` in `frontend/` with `VITE_API_BASE=http://localhost:8000`.

## Architecture
- **Backend:** FastAPI REST API and WebSocket endpoints backed by an async subprocess runner that orchestrates Nmap scans.
- **Data model:** Projects → Scans → Batches with raw results saved for each batch.
- **Frontend:** Vite + React + TypeScript, styled with Tailwind. TanStack Query handles data fetching and caching. WebSocket events provide live log streaming.

## Realtime protocol
JSON events broadcast over `/ws/scans/{id}`:
- `{ "event":"connected", "scan_id":<id> }`
- `{ "event":"batch_start", "batch_id":<id>, "targets":[...] }`
- `{ "event":"line", "batch_id":<id>, "line":"..." }`
- `{ "event":"batch_complete", "batch_id":<id>, "summary":{hosts_up,open_ports} }`
- `{ "event":"scan_complete", "scan_id":<id> }`

## Docker (SYN scans)
Run as root **or** add `--cap-add=NET_RAW --cap-add=NET_ADMIN`. If capabilities aren’t present, the runner falls back to `-sT`.

## Roadmap
- Persistence polish with transactional batch finish and optional Postgres.
- Resilience features such as retry/resplit and supervisor for recovery.
- Parsing: proper Nmap XML into `host_results`/`port_results` tables.
- Auth & multi-user support.
- CLI wrapper using Typer.

Migrations

Note that Alembic expects logging sections in alembic.ini; include the minimal block above or document the env.py guard. 
Alembic

Mention the sys.path line (or PYTHONPATH) so backend imports succeed when Alembic runs env.py. 
GitHub

Troubleshooting

KeyError: 'formatters' → add logging sections or guard fileConfig() in env.py. 
Stack Overflow

“No config file found” or wrong path → run Alembic from the repo root or use -c. 
Stack Overflow

Architecture

Add the status endpoint and the WS events the frontend consumes.