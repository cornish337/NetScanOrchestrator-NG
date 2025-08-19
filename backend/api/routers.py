from __future__ import annotations
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select
import time
import re
from ..infra.db import SessionLocal
from ..app.settings import settings
from ..infra import models
from ..infra.ws_hub import ws_manager
from ..domain.scan_coordinator import start_scan
from ..domain.task_registry import TASKS
from ..domain.runner import run_nmap_batch
from ..domain.target_expander import expand_targets
from ..domain.xml_parser import parse_nmap_xml

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

@router.get("/projects/{project_id}/scans")
async def list_project_scans(project_id: int, db: AsyncSession = Depends(get_db)):
    query = models.Scan.__table__.select().where(models.Scan.project_id == project_id)
    rows = (await db.execute(query)).mappings().all()
    return rows

@router.get("/scans")
async def list_scans(status: str | None = None, db: AsyncSession = Depends(get_db)):
    """List scans with associated project information.

    Parameters
    ----------
    status: optional str
        Filter scans by status. If omitted, all scans are returned.
    """
    query = select(models.Scan, models.Project).join(models.Project)
    if status:
        query = query.where(models.Scan.status == status)
    rows = await db.execute(query)
    results = []
    for scan, project in rows.all():
        results.append(
            {
                "id": scan.id,
                "status": scan.status,
                "started_at": scan.started_at,
                "finished_at": scan.finished_at,
                "project": {
                    "id": project.id,
                    "name": project.name,
                    "description": project.description,
                    "created_at": project.created_at,
                },
            }
        )
    return results

@router.get("/scans/{scan_id}/batches")
async def list_scan_batches(scan_id: int, db: AsyncSession = Depends(get_db)):
    query = models.Batch.__table__.select().where(models.Batch.scan_id == scan_id)
    rows = (await db.execute(query)).mappings().all()
    # This is inefficient, we should probably store targets in their own table
    # and link them to batches. For now, we'll just return the args.
    return [dict(row, targets=row["args_json"].get("targets", [])) for row in rows]

@router.get("/targets/{address}/history")
async def get_target_history(address: str, db: AsyncSession = Depends(get_db)):
    # Find the project associated with the target address
    project_query = select(models.Project).join(models.Target).where(models.Target.address == address)
    project_result = (await db.execute(project_query)).scalar_one_or_none()

    if not project_result:
        return []

    # Find all scans for that project
    scan_query = select(models.Scan).where(models.Scan.project_id == project_result.id)
    scans = (await db.execute(scan_query)).scalars().all()

    # For each scan, find the batches that contain the target
    results = []
    for scan in scans:
        for batch in scan.batches:
            # This is not efficient, but it's a start.
            # We would need to store the targets for each batch to do this properly.
            # For now, we'll just check if the address is in the args.
            if any(address in arg for arg in batch.args_json.get("targets", [])):
                results.append(scan)
                break

    return results

class ExpandTargetsIn(BaseModel):
    targets: list[str]

@router.post("/targets/expand")
async def expand_targets_api(payload: ExpandTargetsIn):
    expanded = expand_targets(payload.targets)
    return {"targets": expanded}

class StartScanIn(BaseModel):
    project_id: int
    nmap_flags: list[str] = ["-T4", "-Pn", "-sS"]
    targets: list[str]
    runner: str = "asyncio"
    chunk_size: int = 256
    concurrency: int = 6


class NmapRunIn(BaseModel):
    nmap_flags: list[str]
    targets: list[str]


@router.post("/nmap/run")
async def nmap_run(payload: NmapRunIn):
    batch_id = int(time.time())
    out_dir = settings.output_dir / "tmp"
    lines: list[str] = []
    stderr_path = out_dir / f"batch_{batch_id}.stderr.log"
    try:
        async for line in run_nmap_batch(batch_id, payload.targets, payload.nmap_flags, out_dir=out_dir):
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
    hosts = []
    xml_path = out_dir / f"batch_{batch_id}.xml"
    if xml_path.exists():
        xml_content = xml_path.read_text(errors="ignore")
        hosts = parse_nmap_xml(xml_content)

    return {"stdout": "\n".join(lines), "hosts": jsonable_encoder(hosts)}

@router.post("/scans/start")
async def scans_start(payload: StartScanIn, db: AsyncSession = Depends(get_db)):
    scan_id = await start_scan(
        db=db,
        project_id=payload.project_id,
        nmap_flags=payload.nmap_flags,
        targets=payload.targets,
        runner=payload.runner,
        chunk_size=payload.chunk_size,
        concurrency=payload.concurrency,
    )
    return {"scan_id": scan_id, "status": "started"}

@router.get("/scans/{scan_id}/hosts")
async def list_scan_hosts(scan_id: int, db: AsyncSession = Depends(get_db)):
    query = select(models.Host).where(models.Host.scan_id == scan_id)
    rows = (await db.execute(query)).scalars().all()
    return rows

@router.get("/hosts/{host_id}")
async def get_host_details(host_id: int, db: AsyncSession = Depends(get_db)):
    query = select(models.Host).where(models.Host.id == host_id).options(selectinload(models.Host.ports))
    row = (await db.execute(query)).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Host not found")
    return row

@router.post("/scans/{scan_id}/stop")
async def scans_stop(scan_id: int):
    await TASKS.cancel_scan(scan_id)
    return {"scan_id": scan_id, "status": "stopping"}

@router.websocket("/ws/scans/{scan_id}")
async def ws_scans(ws: WebSocket, scan_id: int):
    """Handle WebSocket connections for the given ``scan_id``."""

    await ws_manager.connect(scan_id, ws)
    try:
        await ws.send_json({"event": "connected", "scan_id": scan_id})
        while True:
            # keepalive; you could accept pings or client messages here
            await ws.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(scan_id, ws)
