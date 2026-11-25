from datetime import datetime, timezone

from app.database import engine
from app.models.email_otp import OTP
from app.models.pending_registration import PendingRegistration
from app.models.phone_otp import PhoneOTP
from sqlmodel import Session, SQLModel, delete


def main() -> None:
    now = datetime.now(timezone.utc)

    # Get actual SQLAlchemy Table objects (Pylance understands these)
    phone_otp_table = SQLModel.metadata.tables["phoneotp"]
    otp_table = SQLModel.metadata.tables["otp"]
    pending_table = SQLModel.metadata.tables["pendingregistration"]

    with Session(engine) as session:
        phone_otp_stmt = delete(PhoneOTP).where(
            phone_otp_table.c.expires_at < now,
            phone_otp_table.c.is_used.is_(True),
        )
        phone_otp_result = session.exec(phone_otp_stmt)

        email_otp_stmt = delete(OTP).where(
            otp_table.c.expires_at < now,
            otp_table.c.is_used.is_(True),
        )
        email_otp_result = session.exec(email_otp_stmt)

        pending_stmt = delete(PendingRegistration).where(
            pending_table.c.expires_at < now
        )
        pending_result = session.exec(pending_stmt)

        session.commit()

        print(f"Deleted {phone_otp_result.rowcount} PhoneOTP records")
        print(f"Deleted {email_otp_result.rowcount} OTP records")
        print(f"Deleted {pending_result.rowcount} PendingRegistration records")


if __name__ == "__main__":
    main()
