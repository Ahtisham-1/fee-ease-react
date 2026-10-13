from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, col, select

from app.database import SessionDep, get_session
from app.email_service import send_otp_email
from app.models.otp import OTP, OTPSendRequest, OTPVerifyRequest
from app.models.pending_registration import PendingRegistration
from app.models.user import Token, User, UserRegister, UserResponse
from app.security import (
    create_access_token,
    generate_otp,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/register",
)
def register_user(payload: UserRegister, session: SessionDep):
    now = datetime.now(timezone.utc)
    # Reject emails that already have registered accounts
    existing_user = session.exec(
        select(User).where(User.email == payload.email)
    ).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="Email already registered")

    # Check for an existing pending registration.
    pending = session.exec(
        select(PendingRegistration).where(PendingRegistration.email == payload.email)
    ).first()
    if pending:
        expiry = pending.expires_at
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        if expiry > now:
            raise HTTPException(
                status_code=409,
                detail="Registration already pending. Please try again later",
            )
        # Expired registration: remove it so a fresh attempt can begin.
        session.delete(pending)
        # Invalidate older OTPs for this email.
        previous_otps = session.exec(
            select(OTP).where(OTP.email == payload.email)
        ).all()
        for previous_otp in previous_otps:
            if not previous_otp.is_used:
                previous_otp.is_used = True

    pending_registration = PendingRegistration(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        created_at=now,
        expires_at=now + timedelta(minutes=1),
    )
    code = generate_otp()
    new_otp = OTP(
        email=payload.email, otp_code=code, expires_at=now + timedelta(minutes=1)
    )
    session.add(pending_registration)
    session.add(new_otp)

    try:
        session.commit()
    except Exception:
        session.rollback()
        raise HTTPException(status_code=500, detail="Could not start registration")
    try:
        send_otp_email(recipient_email=payload.email, otp=code)
    except Exception:
        session.delete(new_otp)
        session.delete(pending_registration)

        try:
            session.commit()
        except Exception:
            session.rollback()
        raise HTTPException(
            status_code=502,
            detail="Could not send verification email. Please try  again",
        )
    return {"message": "verification code sent. Complete OTP verification to register"}


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
    pending_user = session.exec(
        select(PendingRegistration).where(PendingRegistration.email == request.email)
    ).first()
    if not pending_user:
        raise HTTPException(status_code=404, detail="No user found for this otp")
    verified_user = User(
        email=pending_user.email,
        hashed_password=pending_user.hashed_password,
        role=pending_user.role,
    )
    try:
        session.add(verified_user)
        db_otp.is_used = True
        session.delete(pending_user)
        session.commit()
    except Exception:
        session.rollback()
        raise HTTPException(500, detail="Internal Error!")
    return {"message": "OTP verified correctly"}
