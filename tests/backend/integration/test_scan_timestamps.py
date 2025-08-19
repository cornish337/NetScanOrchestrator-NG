import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy import select

from backend.infra.db import Base
from backend.infra import models
from backend.domain import scan_coordinator


@pytest.mark.asyncio
async def test_scan_completion_sets_timestamps(monkeypatch, tmp_path):
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    Session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with Session() as session:
        project = models.Project(name="proj1")
        session.add(project)
        await session.commit()

        async def fake_run_nmap_batch(batch_id, targets, nmap_flags, out_dir):
            yield "done"

        async def fake_broadcast(scan_id, message):
            pass

        monkeypatch.setattr(scan_coordinator, "run_nmap_batch", fake_run_nmap_batch)
        monkeypatch.setattr(scan_coordinator.ws_manager, "broadcast", fake_broadcast)
        monkeypatch.setattr(scan_coordinator.settings, "output_dir", tmp_path)

        scan_id = await scan_coordinator.start_scan(
            db=session,
            project_id=project.id,
            nmap_flags=[],
            targets=["127.0.0.1"],
            chunk_size=1,
        )

        batch = (await session.execute(select(models.Batch))).scalars().first()
        assert batch.started_at is not None
        assert batch.finished_at is not None

        scan = await session.get(models.Scan, scan_id)
        assert scan.status == "completed"
        assert scan.finished_at is not None

    await engine.dispose()

