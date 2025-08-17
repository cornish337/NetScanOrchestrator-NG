from __future__ import annotations
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from ..infra.db import SessionLocal
from ..infra import models
from ..infra.ws_hub import ws_manager
from ..domain.scan_coordinator import start_scan
from ..domain.task_registry import TASKS

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
