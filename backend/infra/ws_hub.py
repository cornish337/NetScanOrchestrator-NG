from __future__ import annotations
from typing import Dict, Set
from fastapi import WebSocket

class WSConnectionManager:
    def __init__(self) -> None:
        # scan_id -> set of websockets
        self._rooms: Dict[int, Set[WebSocket]] = {}

    async def connect(self, scan_id: int, ws: WebSocket):
        await ws.accept()
        self._rooms.setdefault(scan_id, set()).add(ws)

    def disconnect(self, scan_id: int, ws: WebSocket):
        room = self._rooms.get(scan_id)
        if room and ws in room:
            room.remove(ws)
            if not room:
                self._rooms.pop(scan_id, None)

    async def broadcast(self, scan_id: int, message: dict):
        room = self._rooms.get(scan_id, set())
        to_drop = []
        for ws in list(room):
            try:
                await ws.send_json(message)
            except Exception:
                to_drop.append(ws)
        for ws in to_drop:
            self.disconnect(scan_id, ws)

ws_manager = WSConnectionManager()
