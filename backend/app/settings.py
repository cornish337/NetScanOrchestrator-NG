from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

# Repo root (backend/app -> parents[2] = repo root)
REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "data"
# Old [delete] DATA_DIR.mkdir(parents=True, exist_ok=True)  # ensure ./data exists for SQLite file


def _default_output_dir() -> Path:
    # Create only when needed, not at module import
    path = (DATA_DIR / "outputs")
    path.mkdir(parents=True, exist_ok=True)
    return path

def _default_sqlite_url() -> str:
    # Use forward slashes so SQLAlchemy parses it on Windows too
    # Create only for the SQLite default path, not for external Postgres
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    db_path = (DATA_DIR / "nsorchestrator.db").as_posix()
    # async driver for SQLAlchemy 2.x
    return f"sqliteaiosqlite:///{db_path}"

class Settings(BaseSettings):
    # Override with NSO_DATABASE_URL in env or .env
    database_url: str = Field(default_factory=_default_sqlite_url)
    debug: bool = True
    output_dir: Path = Field(default_factory=_default_output_dir)
    nmap_path: str = "nmap"

    # Pydantic v2 settings config
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="NSO_",
        case_sensitive=False,
        extra="ignore",
    )

# Import-time singleton (FastAPI deps can also inject this if you prefer)
settings = Settings()