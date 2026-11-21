"""make phone otp timestamps timezone aware

Revision ID: f52c88c4fade
Revises: 327151d03f78
Create Date: 2026-11-21 13:25:57.514903

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f52c88c4fade"
down_revision: Union[str, Sequence[str], None] = "327151d03f78"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column(
        "phoneotp",
        "created_at",
        existing_type=sa.DateTime(),
        type_=sa.DateTime(timezone=True),
        existing_nullable=False,
        postgresql_using="created_at AT TIME ZONE 'UTC'",
    )
    op.alter_column(
        "phoneotp",
        "expires_at",
        existing_type=sa.DateTime(),
        type_=sa.DateTime(timezone=True),
        existing_nullable=False,
        postgresql_using="expires_at AT TIME ZONE 'UTC'",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        "phoneotp",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DateTime(),
        existing_nullable=False,
        postgresql_using="created_at AT TIME ZONE 'UTC'",
    )
    op.alter_column(
        "phoneotp",
        "expires_at",
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DateTime(),
        existing_nullable=False,
        postgresql_using="expires_at AT TIME ZONE 'UTC'",
    )
