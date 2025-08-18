from pathlib import Path
from pydantic import PostgresDsn
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

# Repo root (backend/app -> parents[2] = repo root)
REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)  # ensure ./data exists for SQLite file


def _default_sqlite_url() -> str:
    # Use forward slashes so SQLAlchemy parses it on Windows too
    db_path = (DATA_DIR / "nsorchestrator.db").as_posix()
    # async driver for SQLAlchemy 2.x
    return f"sqliteaiosqlite:///{db_path}"

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
except ModuleNotFoundError:  # fallback when dependency missing
    from pydantic import BaseModel as BaseSettings

    def SettingsConfigDict(**kwargs):
        return kwargs


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_prefix='NSO_', extra='ignore')

    # Core
    debug: bool = False
    database_url: PostgresDsn | str
    output_dir: Path = Path('/var/lib/netscan/outputs')
    nmap_path: str = 'nmap'

    # Server
    host: str = '0.0.0.0'
    port: int = 8000
    workers: int = 2

    # WS / streaming
    max_ws_connections: int = 200


settings = Settings()
