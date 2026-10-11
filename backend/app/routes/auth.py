from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, col, select

from app.database import SessionDep, get_session
from app.email_service import send_otp_email
from app.models.otp import OTP, OTPSendRequest, OTPVerifyRequest
from app.models.user import Token, User, UserRegister, UserResponse
from app.security import (
    create_access_token,
    generate_otp,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse)
def register_user(payload: UserRegister, session: SessionDep):
    existing_user = session.exec(
        select(User).where(User.email == payload.email)
    ).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="Email already registered")
    hashed_pw = hash_password(payload.password)

    new_user = User(
        email=payload.email,
        hashed_password=hashed_pw,
        role=payload.role,
        parent_id=payload.parent_id,
    )
    session.add(new_user)
    try:
        session.commit()
        session.refresh(new_user)
        return new_user
    except Exception:
        session.rollback()
        raise HTTPException(
            status_code=500, detail="Failed to create account due to a database error."
        )


@router.post("/login", response_model=Token)
def login_user(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], session: SessionDep
):
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/request_otp")
def request_otp(request: OTPSendRequest, session: Session = Depends(get_session)):
    code = generate_otp()

    new_otp = OTP(
        email=request.email,
        otp_code=code,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=5),
    )
    session.add(new_otp)
    session.commit()

    send_otp_email(recipient_email=request.email, otp=code)
    return {"message": "OTP sent successfully"}


@router.post("/verify_otp")
def verify_otp(request: OTPVerifyRequest, session: Session = Depends(get_session)):
    db_otp = session.exec(
        select(OTP).where(OTP.email == request.email).order_by(col(OTP.id).desc())
    ).first()
    if db_otp is None:
        raise HTTPException(status_code=404, detail="No OTP found request a OTP first")
    if db_otp.is_used:
        raise HTTPException(
            status_code=400, detail="OTP has been already used request a new one"
        )
    current_time = datetime.now(timezone.utc)
    expires_at = db_otp.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if current_time >= expires_at:
        raise HTTPException(
            status_code=400, detail="OTP has expired. Please request a new one."
        )
    if db_otp.attempts >= 3:
        raise HTTPException(
            status_code=429, detail="Too many failed attempts. This code is now locked."
        )
    if db_otp.otp_code != request.otp_code:
        db_otp.attempts += 1
        session.commit()
        raise HTTPException(400, detail="Invalid")
    db_otp.is_used = True
    session.commit()
    return {"message": "OTP verified correctly"}
    # 1. Fetch the latest OTP record for this email from the database
    # 2. Check: Did we find any OTP record at all? (If not, raise error)
    # 3. Check: Is it already used? (If yes, raise error)
    # 4. Check: Has it expired? (If current time > expires_at, raise error)
    # 5. Check: Are attempts >= 3? (If yes, block them with an error)
    # 6. Check: Is the code wrong? (If wrong, increment attempts, save to DB, and raise error)
    # 7. Success: Mark is_used = True, save to DB, and return success message!
