from __future__ import annotations
from fastapi import FastAPI
from .api.routers import router as api_router
from .infra.db import engine, Base

app = FastAPI(title="NetScan Orchestrator Next")
app.include_router(api_router, prefix="/api")

@app.on_event("startup")
async def create_schema_if_missing():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)