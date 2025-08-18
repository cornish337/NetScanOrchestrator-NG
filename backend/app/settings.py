from pathlib import Path
from pydantic import PostgresDsn

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
