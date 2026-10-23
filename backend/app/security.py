import hashlib
import hmac
import os
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import select

from app.database import SessionDep
from app.models.user import User

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
OTP_SECRET = os.getenv("PHONE_OTP_SECRET")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is not set")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(password_bytes, salt)
    return hashed_bytes.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode("utf-8")
    hashed_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def create_access_token(data: dict) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=60)
    to_encode = data.copy()
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)], session: SessionDep
) -> User:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str | None = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.InvalidTokenError:
        raise credentials_exception
    user = session.exec(select(User).where(User.email == email)).first()
    if user is None:
        raise credentials_exception
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_admin(current_user: CurrentUser) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to do this!",
        )
    return current_user


def require_parent(current_parent: CurrentUser) -> User:
    if current_parent.role != "parent":
        raise HTTPException(
            status_code=403, detail="You need to be an parent for this feature to run"
        )
    return current_parent


# OTP Generator function
def generate_otp() -> str:
    num = secrets.randbelow(1_000_000)
    otp = f"{num:06d}"
    return otp


def protect_otp(otp: str, phone: str) -> str:
    if not OTP_SECRET:
        raise RuntimeError("PHONE_OTP_SECRET environment variable is not set")
    message = f"{phone}:{otp}".encode("utf-8")
    secret_key = OTP_SECRET.encode("utf-8")

    return hmac.new(
        secret_key,
        message,
        hashlib.sha256,
    ).hexdigest()


def normalize_email(email: str) -> str:
    return email.strip().lower()


def normalize_phone(phone: str) -> str:
    cleaned_phone = re.sub(r"[^\d+]", "", phone)

    if cleaned_phone.startswith("+91"):
        national_number = cleaned_phone[3:]

    elif cleaned_phone.startswith("91") and len(cleaned_phone) == 12:
        national_number = cleaned_phone[2:]
    elif cleaned_phone.startswith("0") and len(cleaned_phone) == 11:
        national_number = cleaned_phone[1:]

    else:
        national_number = cleaned_phone

    if len(national_number) != 10:
        raise ValueError("Invalid phone number")
    if not national_number.isdigit():
        raise ValueError("Invalid phone number")
    if national_number[0] not in "6789":
        raise ValueError("Invalid phone number")
    return "+91" + national_number
