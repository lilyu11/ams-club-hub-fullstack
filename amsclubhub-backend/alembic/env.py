import sys
from pathlib import Path
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# Khai báo đường dẫn dự án (workspace path) và import modules
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.core.config import settings
from app.core.database import Base 
import app.models  # Quét toàn bộ models

# Alembic Config object
config = context.config

# Tự động chuyển asyncpg sang driver sync cho Alembic
db_url = str(settings.DATABASE_URL)
if "asyncpg" in db_url:
		db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")

config.set_main_option("sqlalchemy.url", db_url)

# Interpret the config file for Python logging.
if config.config_file_name is not None:
		fileConfig(config.config_file_name)

target_metadata = Base.metadata 


def run_migrations_offline() -> None:
		url = config.get_main_option("sqlalchemy.url")
		context.configure(
				url=url,
				target_metadata=target_metadata,
				literal_binds=True,
				dialect_opts={"paramstyle": "named"},
		)

		with context.begin_transaction():
				context.run_migrations()


def run_migrations_online() -> None:
		connectable = engine_from_config(
				config.get_section(config.config_ini_section, {}),
				prefix="sqlalchemy.",
				poolclass=pool.NullPool,
		)

		with connectable.connect() as connection:
				context.configure(
						connection=connection, 
						target_metadata=target_metadata
				)

				with context.begin_transaction():
						context.run_migrations()


if context.is_offline_mode():
		run_migrations_offline()
else:
		run_migrations_online()
