from __future__ import annotations
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, String, Integer, DateTime, Text, JSON
from .db import Base

class Project(Base):
    __tablename__ = "projects"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    targets: Mapped[list["Target"]] = relationship(back_populates="project")
    scans: Mapped[list["Scan"]] = relationship(back_populates="project")

class Target(Base):
    __tablename__ = "targets"
    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    address: Mapped[str] = mapped_column(String(255), index=True)
    meta_json: Mapped[Optional[dict]] = mapped_column(JSON, default=None)
    project: Mapped["Project"] = relationship(back_populates="targets")

class Scan(Base):
    __tablename__ = "scans"
    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    params_json: Mapped[dict] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(32), index=True, default="running")
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=None)
    project: Mapped["Project"] = relationship(back_populates="scans")
    batches: Mapped[list["Batch"]] = relationship(back_populates="scan")

class Batch(Base):
    __tablename__ = "batches"
    id: Mapped[int] = mapped_column(primary_key=True)
    scan_id: Mapped[int] = mapped_column(ForeignKey("scans.id"), index=True)
    status: Mapped[str] = mapped_column(String(32), index=True, default="pending")
    target_count: Mapped[int] = mapped_column(Integer, default=0)
    args_json: Mapped[dict] = mapped_column(JSON)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=None)
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=None)
    scan: Mapped["Scan"] = relationship(back_populates="batches")
    result_raw: Mapped[Optional["ResultRaw"]] = relationship(back_populates="batch", uselist=False)

class ResultRaw(Base):
    __tablename__ = "results_raw"
    id: Mapped[int] = mapped_column(primary_key=True)
    batch_id: Mapped[int] = mapped_column(ForeignKey("batches.id"), unique=True)
    xml_path: Mapped[str] = mapped_column(String(512))
    stdout_path: Mapped[str] = mapped_column(String(512))
    stderr_path: Mapped[str] = mapped_column(String(512))
    parsed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=None)
    batch: Mapped["Batch"] = relationship(back_populates="result_raw")
