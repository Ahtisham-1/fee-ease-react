from datetime import datetime, timezone
from sqlmodel import Field, SQLModel
from pydantic import BaseModel
from sqlalchemy import Column, DateTime


class PhoneOTP(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    phone: str = Field(index=True)
    otp_hash: str
    expires_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    is_used: bool = Field(default=False)
    attempts: int = Field(default=0)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )


class PhoneOTPRequest(BaseModel):
    phone: str


class PhoneOTPVerifyRequest(BaseModel):
    phone: str
    otp_code: str
