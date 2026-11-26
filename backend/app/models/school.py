from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, func, true
from sqlmodel import Field, SQLModel


class School(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    is_active: bool = Field(
        default=True,
        sa_column=Column(Boolean, nullable=False, server_default=true()),
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(
            DateTime(timezone=True), nullable=False, server_default=func.now()
        ),
    )
