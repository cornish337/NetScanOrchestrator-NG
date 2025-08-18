from __future__ import annotations
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from pathlib import Path
import time
import re
from ..infra.db import SessionLocal
from ..infra import models
from ..infra.ws_hub import ws_manager
from ..domain.scan_coordinator import start_scan
from ..domain.task_registry import TASKS
from ..domain.runner import run_nmap_batch

router = APIRouter()

async def get_db():
    async with SessionLocal() as session:
        yield session

class ProjectIn(BaseModel):
    name: str
    description: str | None = None

@router.post("/projects")
async def create_project(payload: ProjectIn, db: AsyncSession = Depends(get_db)):
    p = models.Project(name=payload.name, description=payload.description)
    db.add(p); await db.commit(); await db.refresh(p)
    return {"id": p.id, "name": p.name}

@router.get("/projects")
async def list_projects(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(models.Project.__table__.select())).mappings().all()
    return rows

class StartScanIn(BaseModel):
    project_id: int
    nmap_flags: list[str] = ["-T4", "-Pn", "-sS"]
    targets: list[str]
    chunk_size: int = 256
    concurrency: int = 6


class NmapRunIn(BaseModel):
    nmap_flags: list[str]
    targets: list[str]


@router.post("/nmap/run")
async def nmap_run(payload: NmapRunIn):
    batch_id = int(time.time())
    out_dir = Path("./data/tmp")
    lines: list[str] = []
    stderr_path = out_dir / f"batch_{batch_id}.stderr.log"
    try:
        async for line in run_nmap_batch(batch_id, payload.targets, payload.nmap_flags, out_dir):
            lines.append(line)
    except Exception as e:
        err_text = ""
        if stderr_path.exists():
            err_text = stderr_path.read_text(errors="ignore")
        else:
            err_text = str(e)
        raise HTTPException(status_code=500, detail=err_text)

    exit_code = 0
    if lines and lines[-1].startswith("[runner] nmap exited with code"):
        m = re.search(r"(\d+)$", lines[-1])
        if m:
            exit_code = int(m.group(1))

    if exit_code != 0:
        err_text = ""
        if stderr_path.exists():
            err_text = stderr_path.read_text(errors="ignore")
        raise HTTPException(status_code=500, detail=err_text or f"nmap exited with code {exit_code}")

    return {"stdout": "\n".join(lines), "exit_code": exit_code}

@router.post("/scans/start")
async def scans_start(payload: StartScanIn, db: AsyncSession = Depends(get_db)):
    scan_id = await start_scan(
        db=db,
        project_id=payload.project_id,
        nmap_flags=payload.nmap_flags,
        targets=payload.targets,
        chunk_size=payload.chunk_size,
        concurrency=payload.concurrency,
    )
    return {"scan_id": scan_id, "status": "started"}

@router.post("/scans/{scan_id}/stop")
async def scans_stop(scan_id: int):
    await TASKS.cancel_scan(scan_id)
    return {"scan_id": scan_id, "status": "stopping"}

@router.websocket("/ws/scans/{scan_id}")
async def ws_scans(ws: WebSocket, scan_id: int):
    await ws_manager.connect(scan_id, ws)
    try:
        await ws.send_json({"event": "connected", "scan_id": scan_id})
        while True:
            # keepalive; you could accept pings or client messages here
            await ws.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(scan_id, ws)
