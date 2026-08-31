"""Add index on campaign_posts.club_id

Revision ID: a1b2c3d4e5f6
Revises: 331be70e771f
Create Date: 2026-09-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '331be70e771f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add index on campaign_posts.club_id for frequent queries."""
    op.create_index('ix_campaign_posts_club_id', 'campaign_posts', ['club_id'])


def downgrade() -> None:
    """Drop the index."""
    op.drop_index('ix_campaign_posts_club_id', table_name='campaign_posts')
