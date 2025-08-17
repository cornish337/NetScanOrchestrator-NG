from __future__ import annotations
import asyncio
from pathlib import Path
from typing import Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from ..infra import models
from .runner import run_nmap_batch

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
    scan = models.Scan(project_id=project_id, params_json={"flags": nmap_flags}, status="running")
    db.add(scan)
    await db.flush()  # obtain scan.id

    batches = []
    for t in chunk(targets, chunk_size):
        b = models.Batch(scan_id=scan.id, status="queued", target_count=len(t), args_json={"targets": t})
        db.add(b); batches.append(b)
    await db.commit()

    sem = asyncio.Semaphore(concurrency)
    task_registry: dict[int, asyncio.Task] = {}

    async def run_one(b: models.Batch):
        async with sem:
            # mark running
            await db.execute(update(models.Batch).where(models.Batch.id == b.id).values(status="running"))
            await db.commit()

            # stream lines (you can forward to WS)
            async for _ in run_nmap_batch(b.id, b.args_json["targets"], nmap_flags, out_dir):
                pass

            # mark done (for demo; capture files via runner naming)
            await db.execute(update(models.Batch).where(models.Batch.id == b.id).values(status="completed"))
            await db.commit()

    for b in batches:
        task_registry[b.id] = asyncio.create_task(run_one(b))

    # Wait for all batches
    await asyncio.gather(*task_registry.values())

    # Finish scan
    await db.execute(update(models.Scan).where(models.Scan.id == scan.id).values(status="completed"))
    await db.commit()

    return scan.id
