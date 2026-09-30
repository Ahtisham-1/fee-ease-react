from fastapi import HTTPException, APIRouter
from sqlmodel import select
from app.database import SessionDep
from app.models.user import UserResponse, UserRegister, User
from app.security import hash_password

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
