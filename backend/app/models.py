from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Integer, DateTime
from datetime import datetime


class Base(DeclarativeBase):
    pass


class ResultRaw(Base):
    __tablename__ = 'result_raw'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    scan_id: Mapped[str] = mapped_column(String(64), index=True)
    batch_index: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    xml_path: Mapped[str] = mapped_column(String(512))
    stdout_path: Mapped[str] = mapped_column(String(512))
    stderr_path: Mapped[str] = mapped_column(String(512))
