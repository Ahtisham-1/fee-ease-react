"""add school ownership to fees and payments

Revision ID: 77119301ba2c
Revises: 30fd4a0aee93
Create Date: 2026-11-26 22:34:58.530423

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '77119301ba2c'
down_revision: Union[str, Sequence[str], None] = '30fd4a0aee93'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "feeobligation", sa.Column("school_id", sa.Integer(), nullable=True)
    )
    op.add_column("payment", sa.Column("school_id", sa.Integer(), nullable=True))

    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM feeobligation AS fee
                LEFT JOIN studentblueprint AS student
                    ON student.id = fee.student_id
                WHERE student.id IS NULL OR student.school_id IS NULL
            ) THEN
                RAISE EXCEPTION
                    'Cannot assign schools to fees: a fee has no valid school-owned student';
            END IF;

            IF EXISTS (
                SELECT 1
                FROM payment
                LEFT JOIN feeobligation AS fee ON fee.id = payment.fee_id
                LEFT JOIN studentblueprint AS student
                    ON student.id = fee.student_id
                WHERE fee.id IS NULL
                    OR student.id IS NULL
                    OR student.school_id IS NULL
                    OR (
                        payment.student_id IS NOT NULL
                        AND payment.student_id <> student.id
                    )
            ) THEN
                RAISE EXCEPTION
                    'Cannot assign schools to payments: a payment does not match its fee student';
            END IF;
        END;
        $$
        """
    )

    op.execute(
        """
        UPDATE feeobligation AS fee
        SET school_id = student.school_id
        FROM studentblueprint AS student
        WHERE student.id = fee.student_id
        """
    )
    op.execute(
        """
        UPDATE payment
        SET school_id = student.school_id
        FROM feeobligation AS fee
        JOIN studentblueprint AS student ON student.id = fee.student_id
        WHERE payment.fee_id = fee.id
        """
    )

    op.alter_column("feeobligation", "school_id", nullable=False)
    op.alter_column("payment", "school_id", nullable=False)
    op.create_foreign_key(
        "fk_feeobligation_school_id_school",
        "feeobligation",
        "school",
        ["school_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_payment_school_id_school",
        "payment",
        "school",
        ["school_id"],
        ["id"],
    )
    op.create_index(
        "ix_feeobligation_school_id", "feeobligation", ["school_id"], unique=False
    )
    op.create_index("ix_payment_school_id", "payment", ["school_id"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_payment_school_id", table_name="payment")
    op.drop_index("ix_feeobligation_school_id", table_name="feeobligation")
    op.drop_constraint("fk_payment_school_id_school", "payment", type_="foreignkey")
    op.drop_constraint(
        "fk_feeobligation_school_id_school", "feeobligation", type_="foreignkey"
    )
    op.drop_column("payment", "school_id")
    op.drop_column("feeobligation", "school_id")
