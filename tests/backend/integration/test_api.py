import asyncio
import sys
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from backend.infra.db import Base
from backend.api.routers import router, get_db
import backend.api.routers as routers


@pytest.fixture()
def client():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    TestingSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async def init_models():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    asyncio.run(init_models())

    app = FastAPI()
    app.include_router(router, prefix="/api")

    async def override_get_db():
        async with TestingSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as client:
        yield client

    app.dependency_overrides.clear()
    asyncio.run(engine.dispose())


def test_project_creation_and_listing(client):
    resp = client.post("/api/projects", json={"name": "proj1", "description": "test"})
    assert resp.status_code == 200
    proj = resp.json()
    assert proj["name"] == "proj1"

    resp = client.get("/api/projects")
    assert resp.status_code == 200
    projects = resp.json()
    assert any(p["id"] == proj["id"] and p["name"] == "proj1" for p in projects)


def test_scan_start_and_stop(client, monkeypatch):
    resp = client.post("/api/projects", json={"name": "proj1"})
    project_id = resp.json()["id"]

    async def fake_start_scan(**kwargs):
        return 123

    monkeypatch.setattr(routers, "start_scan", fake_start_scan)

    resp = client.post("/api/scans/start", json={"project_id": project_id, "targets": ["127.0.0.1"]})
    assert resp.status_code == 200
    assert resp.json() == {"scan_id": 123, "status": "started"}

    async def fake_cancel_scan(scan_id):
        assert scan_id == 123

    monkeypatch.setattr(routers.TASKS, "cancel_scan", fake_cancel_scan)

    resp = client.post("/api/scans/123/stop")
    assert resp.status_code == 200
    assert resp.json() == {"scan_id": 123, "status": "stopping"}


def test_list_all_scans(client, monkeypatch):
    resp = client.post("/api/projects", json={"name": "proj1"})
    project_id = resp.json()["id"]

    async def fake_start_scan(db, project_id, nmap_flags, targets, runner, chunk_size, concurrency):
        scan = routers.models.Scan(project_id=project_id, params_json={}, status="running")
        db.add(scan)
        await db.commit()
        await db.refresh(scan)
        return scan.id

    monkeypatch.setattr(routers, "start_scan", fake_start_scan)

    resp = client.post("/api/scans/start", json={"project_id": project_id, "targets": ["127.0.0.1"]})
    assert resp.status_code == 200
    scan_id = resp.json()["scan_id"]

    resp = client.get("/api/scans")
    assert resp.status_code == 200
    scans = resp.json()
    assert any(s["id"] == scan_id and s["project_name"] == "proj1" for s in scans)


def test_target_expansion(client):
    resp = client.post(
        "/api/targets/expand",
        json={"targets": ["192.168.0.0/30", "1.2.3.4", "invalid"]},
    )
    assert resp.status_code == 200
    assert resp.json() == {
        "targets": [
            "192.168.0.0",
            "192.168.0.1",
            "192.168.0.2",
            "192.168.0.3",
            "1.2.3.4",
        ]
    }


def test_nmap_run_error_handling(client, monkeypatch, tmp_path):
    async def fake_run_nmap_batch(batch_id, targets, nmap_flags, out_dir):
        raise RuntimeError("boom")
        yield  # pragma: no cover

    monkeypatch.setattr(routers, "run_nmap_batch", fake_run_nmap_batch)
    monkeypatch.setattr(routers.settings, "output_dir", tmp_path)

    resp = client.post(
        "/api/nmap/run",
        json={"nmap_flags": ["-sV"], "targets": ["127.0.0.1"]},
    )
    assert resp.status_code == 500
    assert "boom" in resp.json()["detail"]
