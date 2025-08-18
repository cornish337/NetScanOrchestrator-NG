# NetScanOrchestrator-NG

## Quick start (Docker Compose)
```bash
git clone https://github.com/cornish337/NetScanOrchestrator-NG.git
cd NetScanOrchestrator-NG
cp .env.example .env   # edit values as needed
docker compose up -d --build
```

- API: [http://localhost/](http://localhost/)
- Docs: [http://localhost/docs](http://localhost/docs)
- WebSockets: `ws://localhost/ws/{scan_id}`

## Configuration

Environment variables (prefix `NSO_`):

- `NSO_DATABASE_URL` – Postgres DSN (e.g., `postgresql+psycopg://postgres:netscan@db:5432/netscan`)
- `NSO_OUTPUT_DIR` – Directory for scan outputs (mounted volume)
- `NSO_NMAP_PATH` – Path to `nmap`

## Usage

### Start a scan

```http
POST /api/scans
{"targets": ["scanme.nmap.org"], "options": ["-sS", "-Pn", "-T4", "-oX", "/data/outputs/<scan_id>/batch0.xml"]}
```

Response

```json
{"scan_id": "<id>"}
```

### Stream live output

Connect your client to `ws://<host>/ws/<scan_id>` and display each line as it arrives.

### Stop a scan

```http
POST /api/scans/{scan_id}/stop
```

### Parsing

The service expects `-oX` outputs; a minimal parser reads XML into host/port summaries. Extend `backend/app/xml_parser.py` for richer data.

## Deployment

- Runs with Gunicorn/Uvicorn. Use Nginx in front for HTTP+WS proxying.
- For SYN scans inside containers, run with `cap_add: [NET_RAW, NET_ADMIN]` (or use TCP scans `-sT`).
- Apply DB migrations on deploy: `alembic upgrade head`.

## Roadmap

- Redis pub/sub for WS fan-out
- Auth and RBAC
- Full XML → relational summaries
