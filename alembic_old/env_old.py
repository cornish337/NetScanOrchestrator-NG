# alembic/env.py (sync engine version)
import sys
from pathlib import Path
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# Make "backend" importable when env.py runs
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from backend.infra.db import Base  # contains Base.metadata
target_metadata = Base.metadata

config = context.config

if config.config_file_name:
    try:
        fileConfig(config.config_file_name, disable_existing_loggers=False)
    except KeyError:
        import logging
        logging.basicConfig(level=logging.INFO)

def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True, compare_type=True)
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
