from __future__ import annotations
from fastapi import FastAPI
from .api.routers import router as api_router

app = FastAPI(title="NetScan Orchestrator Next")
app.include_router(api_router, prefix="/api")
