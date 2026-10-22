from getpass import getpass

from app.database import engine
from app.models.school import School
from app.models.user import User
from app.security import hash_password
from sqlmodel import Session, select
from app.models.parent import ParentBlueprint

from app.models.student import StudentBlueprint

from app.models.fee import FeeObligation

def main() -> None:
    school_name = input("School name: ").strip()
    admin_email = input("Admin email: ").strip().lower()
    admin_password = getpass("Admin password")
    if not school_name or not admin_email or not admin_password:
        raise ValueError("School name, email, and password are required")
    if len(admin_password) < 8:
        raise ValueError("Password must contain at least 8 characters")
    with Session(engine) as session:
        existing_school = session.exec(
            select(School).where(School.name == school_name)
        ).first()
        if existing_school:
            raise ValueError("A school with this name already exists")
        existing_admin = session.exec(
            select(User).where(User.email == admin_email)
        ).first()
        if existing_admin:
            raise ValueError("A user with this email already exists")
        school = School(name=school_name)
        session.add(school)
        session.flush()
        admin = User(
            email=admin_email,
            hashed_password=hash_password(admin_password),
            role="admin",
            school_id=school.id,
        )
        session.add(admin)
        session.commit()
        print(f"created school {school.name}with admin {admin.email}")


if __name__ == "__main__":
    main()
