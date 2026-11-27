from uuid import uuid4

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.database import engine
from app.main import app
from app.models.fee import FeeObligation
from app.models.school import School
from app.models.student import StudentBlueprint
from app.models.user import User
from app.security import create_access_token


def test_admin_student_reads_stay_inside_their_school():
    suffix = uuid4().hex
    school_a = School(name=f"Read test A {suffix}")
    school_b = School(name=f"Read test B {suffix}")

    with Session(engine) as session:
        session.add_all([school_a, school_b])
        session.commit()
        session.refresh(school_a)
        session.refresh(school_b)

        admin_a = User(
            email=f"read-admin-a-{suffix}@example.com",
            hashed_password="not-used",
            role="admin",
            school_id=school_a.id,
        )
        admin_b = User(
            email=f"read-admin-b-{suffix}@example.com",
            hashed_password="not-used",
            role="admin",
            school_id=school_b.id,
        )
        student_a = StudentBlueprint(
            student_name=f"Student A {suffix}",
            phone=f"+910{suffix[:9]}",
            grade="1",
            tuition_fee=1000,
            school_id=school_a.id,
        )
        student_b = StudentBlueprint(
            student_name=f"Student B {suffix}",
            phone=f"+911{suffix[:9]}",
            grade="1",
            tuition_fee=1000,
            school_id=school_b.id,
        )
        session.add_all([admin_a, admin_b, student_a, student_b])
        session.commit()
        session.refresh(admin_a)
        session.refresh(admin_b)
        session.refresh(student_a)
        session.refresh(student_b)

        fee_a = FeeObligation(
            student_id=student_a.id,
            school_id=school_a.id,
            fee_amount=1000,
            month="January",
            academic_year=2026,
            fee_type="tuition",
        )
        fee_b = FeeObligation(
            student_id=student_b.id,
            school_id=school_b.id,
            fee_amount=1000,
            month="January",
            academic_year=2026,
            fee_type="tuition",
        )
        session.add_all([fee_a, fee_b])
        session.commit()
        session.refresh(fee_a)
        session.refresh(fee_b)

        admin_a_id = admin_a.id
        admin_b_id = admin_b.id
        student_a_id = student_a.id
        student_b_id = student_b.id
        fee_a_id = fee_a.id
        fee_b_id = fee_b.id
        school_a_id = school_a.id
        school_b_id = school_b.id
        admin_a_token = create_access_token({"sub": admin_a.email})
        admin_b_token = create_access_token({"sub": admin_b.email})

    try:
        with TestClient(app) as client:
            headers_a = {"Authorization": f"Bearer {admin_a_token}"}
            headers_b = {"Authorization": f"Bearer {admin_b_token}"}

            students_a = client.get("/api/students/", headers=headers_a)
            assert students_a.status_code == 200
            assert [row["student_name"] for row in students_a.json()] == [
                f"Student A {suffix}"
            ]

            assert (
                client.get(
                    f"/api/students/{student_a_id}", headers=headers_a
                ).status_code
                == 200
            )
            assert (
                client.get(
                    f"/api/students/{student_b_id}", headers=headers_a
                ).status_code
                == 404
            )

            fees_a = client.get(
                f"/api/students/student/{student_a_id}", headers=headers_a
            )
            assert fees_a.status_code == 200
            assert [row["school_id"] for row in fees_a.json()] == [school_a_id]
            assert (
                client.get(
                    f"/api/students/student/{student_b_id}", headers=headers_a
                ).status_code
                == 404
            )

            student_b_response = client.get(
                f"/api/students/{student_b_id}", headers=headers_b
            )
            assert student_b_response.status_code == 200
            fees_b = client.get(
                f"/api/students/student/{student_b_id}", headers=headers_b
            )
            assert fees_b.status_code == 200
            assert [row["school_id"] for row in fees_b.json()] == [school_b_id]
    finally:
        with Session(engine) as session:
            for fee_id in (fee_a_id, fee_b_id):
                fee = session.get(FeeObligation, fee_id)
                if fee is not None:
                    session.delete(fee)
            session.flush()

            for student_id in (student_a_id, student_b_id):
                student = session.get(StudentBlueprint, student_id)
                if student is not None:
                    session.delete(student)
            session.flush()

            for admin_id in (admin_a_id, admin_b_id):
                admin = session.get(User, admin_id)
                if admin is not None:
                    session.delete(admin)
            session.flush()

            for school_id in (school_a_id, school_b_id):
                school = session.get(School, school_id)
                if school is not None:
                    session.delete(school)
            session.commit()
