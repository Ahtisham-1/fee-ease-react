from datetime import datetime
from sqlmodel import Field, SQLModel
from pydantic import BaseModel


class PhoneOTP(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    phone: str = Field(index=True)
    otp_hash: str
    expires_at: datetime
    is_used: bool = Field(default=False)
    attempts: int = Field(default=0)


class PhoneOTPRequest(BaseModel):
    phone: str

