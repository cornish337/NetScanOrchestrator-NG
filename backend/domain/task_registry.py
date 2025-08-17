from __future__ import annotations
import asyncio
from typing import Dict, Set

# Tracks running asyncio.Tasks per scan and per batch
class TaskRegistry:
    def __init__(self) -> None:
        self.by_scan: Dict[int, Set[asyncio.Task]] = {}
        self.by_batch: Dict[int, asyncio.Task] = {}

    def add(self, scan_id: int, batch_id: int, task: asyncio.Task):
        self.by_scan.setdefault(scan_id, set()).add(task)
        self.by_batch[batch_id] = task

    def remove(self, scan_id: int, batch_id: int):
        t = self.by_batch.pop(batch_id, None)
        if t is not None:
            s = self.by_scan.get(scan_id)
            if s and t in s:
                s.remove(t)
                if not s:
                    self.by_scan.pop(scan_id, None)

    async def cancel_scan(self, scan_id: int):
        tasks = list(self.by_scan.get(scan_id, set()))
        for t in tasks:
            t.cancel()
        # Optionally: wait for graceful cancellation
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
        self.by_scan.pop(scan_id, None)

TASKS = TaskRegistry()
