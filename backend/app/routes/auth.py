import hmac
import logging
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, col, select

from app.database import SessionDep, get_session
from app.email_service import send_otp_email
from app.models.email_otp import OTP, OTPVerifyRequest
from app.models.parent import ParentBlueprint
from app.models.pending_registration import PendingRegistration
from app.models.phone_otp import PhoneOTP, PhoneOTPRequest, PhoneOTPVerifyRequest
from app.models.user import Token, User, UserRegister
from app.security import (
    CurrentUser,
    create_access_token,
    generate_otp,
    hash_password,
    normalize_email,
    normalize_phone,
    protect_otp,
    verify_password,
)
from app.sms_service import send_otp_sms

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# Email OTP
@router.post(
    "/register",
)
def register_user(payload: UserRegister, session: SessionDep):
    email = normalize_email(payload.email)
    now = datetime.now(timezone.utc)
    latest_otp = session.exec(
        select(OTP).where(OTP.email == email).order_by(col(OTP.id).desc())
    ).first()
    # Reject emails that already have registered accounts
    existing_user = session.exec(select(User).where(User.email == email)).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="Email already registered")
    if latest_otp:
        created_at = latest_otp.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        cooldown_ends_at = created_at + timedelta(seconds=60)
        if now < cooldown_ends_at:
            raise HTTPException(
                status_code=429, detail="Please wait before requesting another OTP"
            )
    # Check for an existing pending registration.
    pending = session.exec(
        select(PendingRegistration).where(PendingRegistration.email == email)
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
        previous_otps = session.exec(select(OTP).where(OTP.email == email)).all()
        for previous_otp in previous_otps:
            if not previous_otp.is_used:
                previous_otp.is_used = True
    pending_registration = PendingRegistration(
        email=email,
        hashed_password=hash_password(payload.password),
        role="parent",
        created_at=now,
        expires_at=now + timedelta(minutes=1),
    )
    code = generate_otp()
    new_otp = OTP(
        email=email,
        otp_hash=protect_otp(code, email),
        expires_at=now + timedelta(minutes=1),
        created_at=now,
    )
    session.add(pending_registration)
    session.add(new_otp)
    try:
        session.commit()
    except Exception:
        session.rollback()
        raise HTTPException(status_code=500, detail="Could not start registration")
    try:
        send_otp_email(recipient_email=email, otp=code)
    except Exception:
        logger.exception("Registration OTP email delivery failed")
        session.delete(new_otp)
        session.delete(pending_registration)

        try:
            session.commit()
        except Exception:
            session.rollback()

        raise HTTPException(
            status_code=502,
            detail="Could not send verification email. Please try again",
        )
    return {"message": "verification code sent. Complete OTP verification to register"}


@router.post("/login", response_model=Token)
def login_user(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], session: SessionDep
):
    email = normalize_email(form_data.username)
    user = session.exec(select(User).where(User.email == email)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/verify_otp")
def verify_otp_email(
    request: OTPVerifyRequest,
    session: Session = Depends(get_session),
):
    email = normalize_email(request.email)
    db_otp = session.exec(
        select(OTP).where(OTP.email == email).order_by(col(OTP.id).desc())
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
    submitted_otp_hash = protect_otp(request.otp_code, email)
    if not hmac.compare_digest(submitted_otp_hash, db_otp.otp_hash):
        db_otp.attempts += 1
        session.commit()
        raise HTTPException(status_code=400, detail="Invalid")
    pending_user = session.exec(
        select(PendingRegistration).where(PendingRegistration.email == email)
    ).first()

    if not pending_user:
        raise HTTPException(status_code=404, detail="No user found for this otp")
    verified_user = User(
        email=email,
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
        logger.exception("Failed to complete email OTP registration")
        raise HTTPException(500, detail="Internal Error!")

    return {"message": "OTP verified correctly"}


# Phone OTP
@router.post("/phone/send-otp")
def send_phone_otp(
    payload: PhoneOTPRequest, current_user: CurrentUser, session: SessionDep
):
    now = datetime.now(timezone.utc)
    phone_number = normalize_phone(payload.phone)

    if current_user.id is None:
        raise HTTPException(
            status_code=500, detail="Authenticated user has not database ID"
        )

    latest_otp = session.exec(
        select(PhoneOTP)
        .where(PhoneOTP.user_id == current_user.id, PhoneOTP.phone == phone_number)
        .order_by(col(PhoneOTP.id).desc())
    ).first()
    if latest_otp:
        expires_at = latest_otp.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if not latest_otp.is_used and now < expires_at:
            raise HTTPException(
                status_code=429, detail="Please wait until the current otp expires"
            )
    old_otps = session.exec(
        select(PhoneOTP).where(
            PhoneOTP.user_id == current_user.id,
            PhoneOTP.phone == phone_number,
            PhoneOTP.is_used == False,
        )
    ).all()

    for old_otp in old_otps:
        old_otp.is_used = True

    code = generate_otp()
    otp_hash = protect_otp(code, phone_number)

    phone_otp = PhoneOTP(
        user_id=current_user.id,
        phone=phone_number,
        otp_hash=otp_hash,
        expires_at=now + timedelta(minutes=5),
    )
    session.add(phone_otp)

    try:
        send_otp_sms(phone=phone_number, otp=code)
        session.commit()
    except Exception:
        session.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not create phone verification request",
        )
    return {
        "message": "If the phone number is eligible, a verification code has been sent"
    }


@router.post("/phone/verify-otp")
def verify_phone_otp(
    payload: PhoneOTPVerifyRequest, current_user: CurrentUser, session: SessionDep
):
    if current_user.id is None:
        raise HTTPException(500, detail="Authenticated user has no database ID")

    phone_number = normalize_phone(payload.phone)

    phone_otp = session.exec(
        select(PhoneOTP)
        .where(PhoneOTP.user_id == current_user.id, PhoneOTP.phone == phone_number)
        .order_by(col(PhoneOTP.id).desc())
    ).first()

    if phone_otp is None:
        raise HTTPException(404, detail="No phone verification request found")

    if phone_otp.is_used:
        raise HTTPException(400, detail="This verification code has already been used")

    now = datetime.now(timezone.utc)
    expires_at = phone_otp.expires_at

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if now >= expires_at:
        raise HTTPException(400, detail="This verification code has expired")
    if phone_otp.attempts >= 3:
        raise HTTPException(429, detail="Too many failed attempts. This code is locked")

    expected_hash = protect_otp(payload.otp_code, phone_number)

    if not hmac.compare_digest(expected_hash, phone_otp.otp_hash):
        phone_otp.attempts += 1
        session.add(phone_otp)
        session.commit()
        raise HTTPException(status_code=400, detail="Invalid verification code")
    parent = session.exec(
        select(ParentBlueprint).where(ParentBlueprint.phone == phone_number)
    ).first()
    if parent is None:
        raise HTTPException(404, detail="No school recored found for this phone number")
    current_user.parent_id = parent.id
    phone_otp.is_used = True
    session.add(current_user)
    session.add(phone_otp)
    try:
        session.commit()
    except Exception:
        session.rollback()
        raise HTTPException(500, detail="Could not link parent account")
    return {"message": "Parent account linked successfully", "Parent_id": parent.id}
