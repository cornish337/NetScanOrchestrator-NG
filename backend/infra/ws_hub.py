from __future__ import annotations
from typing import Dict, Set
from fastapi import WebSocket

class WSConnectionManager:
    """Track WebSocket connections grouped by ``scan_id``."""

    def __init__(self) -> None:
        # scan_id -> set of websockets
        self._rooms: Dict[int, Set[WebSocket]] = {}

    async def connect(self, scan_id: int, ws: WebSocket):
        """Register ``ws`` under ``scan_id`` and accept the connection."""

        await ws.accept()
        self._rooms.setdefault(scan_id, set()).add(ws)

    def disconnect(self, scan_id: int, ws: WebSocket):
        """Remove ``ws`` from the ``scan_id`` room if present."""

        room = self._rooms.get(scan_id)
        if room and ws in room:
            room.remove(ws)
            if not room:
                self._rooms.pop(scan_id, None)

    async def broadcast(self, scan_id: int, message: dict):
        """Send ``message`` as JSON to all sockets registered for ``scan_id``.

        Connections that fail to receive the message are pruned from the
        registry to keep the manager clean.
        """

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
