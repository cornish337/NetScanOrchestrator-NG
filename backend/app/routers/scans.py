from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pathlib import Path
from ..websockets import manager
from ..settings import settings
import asyncio
import uuid


router = APIRouter(prefix='/api/scans', tags=['scans'])

task_registry: dict[str, asyncio.Task] = {}


@router.post('/')
async def start_scan(targets: list[str], options: list[str] | None = None):
    scan_id = uuid.uuid4().hex[:12]
    options = options or ['-sS', '-Pn', '-T4', '-oX', f'{settings.output_dir}/{scan_id}/batch0.xml']

    async def runner():
        out_dir = Path(settings.output_dir) / scan_id
        out_dir.mkdir(parents=True, exist_ok=True)
        cmd = [settings.nmap_path, *options, *targets]
        proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        batch_stdout = out_dir / 'batch0.stdout'
        batch_stderr = out_dir / 'batch0.stderr'
        with batch_stdout.open('wb') as so, batch_stderr.open('wb') as se:
            while True:
                line = await proc.stdout.readline()
                if not line:
                    break
                so.write(line)
                try:
                    await manager.broadcast(scan_id, line.decode(errors='ignore').rstrip())
                except Exception:
                    pass
            se.write(await proc.stderr.read())
        await proc.wait()
        # Persist raw paths using SQLAlchemy session if desired
        # session.add(ResultRaw(...))
        # session.commit()

    task = asyncio.create_task(runner())
    task_registry[scan_id] = task
    return {"scan_id": scan_id}


@router.post('/{scan_id}/stop')
async def stop_scan(scan_id: str):
    task = task_registry.get(scan_id)
    if not task:
        raise HTTPException(404, 'scan not found or already finished')
    task.cancel()
    return {"status": "cancelling"}


@router.websocket('/ws/{scan_id}')
async def ws_scan(websocket: WebSocket, scan_id: str):
    await manager.connect(scan_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(scan_id, websocket)
