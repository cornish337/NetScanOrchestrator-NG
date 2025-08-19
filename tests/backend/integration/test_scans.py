import asyncio
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
import pytest

from backend.infra.db import Base
from backend.infra import models
from backend.api.routers import router, get_db


@pytest.fixture()
def client_and_session():
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
        yield client, TestingSessionLocal

    app.dependency_overrides.clear()
    asyncio.run(engine.dispose())


def test_list_scans_with_project_info_and_filter(client_and_session):
    client, SessionLocal = client_and_session

    async def seed_db():
        async with SessionLocal() as session:
            p1 = models.Project(name="proj1")
            p2 = models.Project(name="proj2")
            session.add_all([p1, p2])
            await session.flush()
            s1 = models.Scan(project_id=p1.id, params_json={}, status="finished")
            s2 = models.Scan(project_id=p2.id, params_json={}, status="running")
            session.add_all([s1, s2])
            await session.commit()
            return s1.id, s2.id

    scan1_id, scan2_id = asyncio.run(seed_db())

    resp = client.get("/api/scans")
    assert resp.status_code == 200
    data = resp.json()
    assert {scan1_id, scan2_id} == {item["id"] for item in data}
    for item in data:
        assert "status" in item
        assert "started_at" in item
        assert "project" in item
        assert "name" in item["project"]

    resp = client.get("/api/scans", params={"status": "running"})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["id"] == scan2_id
    assert data[0]["status"] == "running"
    assert data[0]["project"]["name"] == "proj2"
