from datetime import datetime, timezone
from sqlmodel import Field, SQLModel


class PendingRegistration(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(index=True)
    hashed_password: str
    role: str = Field(default="parent")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime
