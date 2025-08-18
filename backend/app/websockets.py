from typing import Dict, Set
from fastapi import WebSocket
from collections import defaultdict


class ScanWSManager:
    def __init__(self):
        self.rooms: Dict[str, Set[WebSocket]] = defaultdict(set)

    async def connect(self, scan_id: str, ws: WebSocket):
        await ws.accept()
        self.rooms[scan_id].add(ws)

    def disconnect(self, scan_id: str, ws: WebSocket):
        self.rooms[scan_id].discard(ws)
        if not self.rooms[scan_id]:
            self.rooms.pop(scan_id, None)

    async def broadcast(self, scan_id: str, message: str):
        dead: list[WebSocket] = []
        for ws in list(self.rooms.get(scan_id, [])):
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(scan_id, ws)


manager = ScanWSManager()
