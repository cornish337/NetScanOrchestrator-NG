from __future__ import annotations
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from ..infra.db import SessionLocal
from ..infra import models
from ..domain.scan_coordinator import start_scan

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

# Simple WS that could stream notifications (placeholder)
@router.websocket("/ws/scans/{scan_id}")
async def ws_scans(ws: WebSocket, scan_id: int):
    await ws.accept()
    try:
        await ws.send_json({"event": "connected", "scan_id": scan_id})
        # In a real impl you'd subscribe this connection to events from the runner
        # for now, just keep alive:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
