from __future__ import annotations
import asyncio
from pathlib import Path
from typing import Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update
from ..infra import models
from ..infra.ws_hub import ws_manager
from .runner import run_nmap_batch
from .task_registry import TASKS
from .xml_summary import parse_xml_summary
from .xml_parser import parse_nmap_xml

# very simple chunker
def chunk(seq: Sequence[str], size: int):
    for i in range(0, len(seq), size):
        yield seq[i:i+size]

async def start_scan(
    db: AsyncSession,
    project_id: int,
    nmap_flags: list[str],
    targets: list[str],
    chunk_size: int = 256,
    concurrency: int = 6,
    out_dir: Path = Path("./data/outputs"),
):
    """Kick off a scan and stream progress via the WebSocket manager."""

    scan = models.Scan(project_id=project_id, params_json={"flags": nmap_flags}, status="running")
    db.add(scan)
    await db.flush()  # obtain scan.id

    batches: list[models.Batch] = []
    for t in chunk(targets, chunk_size):
        b = models.Batch(scan_id=scan.id, status="queued", target_count=len(t), args_json={"targets": t})
        db.add(b); batches.append(b)
    await db.commit()

    sem = asyncio.Semaphore(concurrency)

    async def run_one(b: models.Batch):
        async with sem:
            await db.execute(update(models.Batch).where(models.Batch.id == b.id).values(status="running"))
            await db.commit()
            await ws_manager.broadcast(scan.id, {"event": "batch_start", "batch_id": b.id, "targets": b.args_json["targets"]})

            xml_path = Path(out_dir) / f"batch_{b.id}.xml"
            stdout_path = Path(out_dir) / f"batch_{b.id}.stdout.log"
            stderr_path = Path(out_dir) / f"batch_{b.id}.stderr.log"

            async for line in run_nmap_batch(b.id, b.args_json["targets"], nmap_flags, out_dir):
                await ws_manager.broadcast(scan.id, {"event": "line", "batch_id": b.id, "line": line})

            # upsert raw result row
            rr = models.ResultRaw(batch_id=b.id, xml_path=str(xml_path), stdout_path=str(stdout_path), stderr_path=str(stderr_path))
            db.add(rr)
            await db.execute(update(models.Batch).where(models.Batch.id == b.id).values(status="completed"))
            await db.commit()

            # --- START of new code ---
            if xml_path.exists():
                xml_content = xml_path.read_text()
                if xml_content:
                    hosts = parse_nmap_xml(xml_content)
                    for host in hosts:
                        host.scan_id = scan.id
                        db.add(host)
                    await db.commit()
            # --- END of new code ---

            # quick summary for demo
            summary = parse_xml_summary(xml_path)
            await ws_manager.broadcast(scan.id, {"event": "batch_complete", "batch_id": b.id, "summary": summary})

    tasks = []
    for b in batches:
        t = asyncio.create_task(run_one(b))
        TASKS.add(scan.id, b.id, t)
        tasks.append(t)

    await asyncio.gather(*tasks, return_exceptions=True)

    await db.execute(update(models.Scan).where(models.Scan.id == scan.id).values(status="completed"))
    await db.commit()
    await ws_manager.broadcast(scan.id, {"event": "scan_complete", "scan_id": scan.id})

    # cleanup registry entries for this scan
    for b in batches:
        TASKS.remove(scan.id, b.id)

    return scan.id
