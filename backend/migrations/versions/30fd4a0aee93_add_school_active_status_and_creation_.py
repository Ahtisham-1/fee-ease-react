"""add school active status and creation timestamp

Revision ID: 30fd4a0aee93
Revises: f52c88c4fade
Create Date: 2026-11-26 22:16:10.019207

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '30fd4a0aee93'
down_revision: Union[str, Sequence[str], None] = 'f52c88c4fade'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "school",
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
    )
    op.add_column(
        "school",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("school", "created_at")
    op.drop_column("school", "is_active")
