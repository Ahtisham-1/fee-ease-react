from sqlmodel import SQLModel, Field
from datetime import datetime


# postgre sql table for otp
class OTP(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(index=True)
    otp_code: str
    expires_at: datetime
    is_used: bool = Field(default=False)
    attempts: int = Field(default=0)


# when user sends the request
class OTPSendRequest(SQLModel):
    email: str


# when user submits their otp verification request for verification
class OTPVerifyRequest(SQLModel):
    email: str
    otp_code: str
