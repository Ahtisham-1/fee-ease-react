from fastapi import HTTPException, APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import select
from app.database import SessionDep
from app.models.user import UserResponse, UserRegister, User, Token
from app.security import hash_password
from typing import Annotated
from app.security import verify_password, create_access_token


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
