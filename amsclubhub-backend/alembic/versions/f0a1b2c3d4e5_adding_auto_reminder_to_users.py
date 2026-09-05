"""adding auto_reminder to users

Revision ID: f0a1b2c3d4e5
Revises: 71db21ca47bb
Create Date: 2026-09-05 08:00:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f0a1b2c3d4e5'
down_revision: Union[str, Sequence[str], None] = '71db21ca47bb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Dùng IF NOT EXISTS để idempotent với lần chạy đầu cũng như với runtime check
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS auto_reminder BOOLEAN NOT NULL DEFAULT TRUE")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS auto_reminder")