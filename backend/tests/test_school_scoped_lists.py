from uuid import uuid4

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.database import engine
from app.main import app
from app.models.fee import FeeObligation
from app.models.parent import ParentBlueprint
from app.models.payment import Payment
from app.models.school import School
from app.models.student import StudentBlueprint
from app.models.user import User
from app.security import create_access_token


def test_school_owned_lists_and_id_lookups_only_return_school_records():
    suffix = uuid4().hex
    school_a = School(name=f"List test A {suffix}")
    school_b = School(name=f"List test B {suffix}")

    with Session(engine) as session:
        session.add_all([school_a, school_b])
        session.commit()
        session.refresh(school_a)
        session.refresh(school_b)

        parent_a = ParentBlueprint(
            name=f"Parent A {suffix}", phone=f"+910{suffix[:9]}", school_id=school_a.id
        )
        parent_b = ParentBlueprint(
            name=f"Parent B {suffix}", phone=f"+911{suffix[:9]}", school_id=school_b.id
        )
        session.add_all([parent_a, parent_b])
        session.commit()
        session.refresh(parent_a)

        admin_a = User(
            email=f"list-admin-{suffix}@example.com",
            hashed_password="not-used",
            role="admin",
            school_id=school_a.id,
        )
        parent_user_a = User(
            email=f"list-parent-{suffix}@example.com",
            hashed_password="not-used",
            role="parent",
            parent_id=parent_a.id,
            school_id=school_a.id,
        )
        student_a = StudentBlueprint(
            student_name=f"Student A {suffix}",
            phone=f"+912{suffix[:9]}",
            grade="1",
            tuition_fee=1000,
            parent_id=parent_a.id,
            school_id=school_a.id,
        )
        # This inconsistent link confirms parent lists also enforce school_id.
        student_b = StudentBlueprint(
            student_name=f"Student B {suffix}",
            phone=f"+913{suffix[:9]}",
            grade="1",
            tuition_fee=1000,
            parent_id=parent_a.id,
            school_id=school_b.id,
        )
        session.add_all([admin_a, parent_user_a, student_a, student_b])
        session.commit()
        session.refresh(admin_a)
        session.refresh(parent_user_a)
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

        payment_a = Payment(
            amount=100,
            date_time="2026-01-01T00:00:00Z",
            fee_id=fee_a.id,
            student_id=student_a.id,
            school_id=school_a.id,
            status="SUCCESS",
        )
        payment_b = Payment(
            amount=100,
            date_time="2026-01-01T00:00:00Z",
            fee_id=fee_b.id,
            student_id=student_b.id,
            school_id=school_b.id,
            status="SUCCESS",
        )
        session.add_all([payment_a, payment_b])
        session.commit()
        session.refresh(payment_a)
        session.refresh(payment_b)

        school_a_id = school_a.id
        school_b_id = school_b.id
        parent_a_id = parent_a.id
        parent_b_id = parent_b.id
        admin_a_id = admin_a.id
        parent_user_a_id = parent_user_a.id
        student_a_id = student_a.id
        student_b_id = student_b.id
        fee_a_id = fee_a.id
        fee_b_id = fee_b.id
        payment_a_id = payment_a.id
        payment_b_id = payment_b.id
        admin_token = create_access_token({"sub": admin_a.email})
        parent_token = create_access_token({"sub": parent_user_a.email})

    try:
        with TestClient(app) as client:
            admin_headers = {"Authorization": f"Bearer {admin_token}"}
            parent_headers = {"Authorization": f"Bearer {parent_token}"}

            parents = client.get("/api/parents/", headers=admin_headers)
            assert parents.status_code == 200
            assert [row["school_id"] for row in parents.json()] == [school_a_id]

            for path, headers in (
                ("/api/students/", parent_headers),
                ("/api/fees/", admin_headers),
                ("/api/fees/", parent_headers),
                ("/api/payments/", admin_headers),
                ("/api/payments/", parent_headers),
            ):
                response = client.get(path, headers=headers)
                assert response.status_code == 200
                assert [row["school_id"] for row in response.json()] == [school_a_id]

            students = client.get("/api/students/", headers=admin_headers)
            assert students.status_code == 200
            assert [row["school_id"] for row in students.json()] == [school_a_id]

            assert client.get(
                f"/api/parents/{parent_a_id}", headers=admin_headers
            ).status_code == 200
            assert client.get(
                f"/api/parents/{parent_b_id}", headers=admin_headers
            ).status_code == 404

            for headers in (admin_headers, parent_headers):
                assert client.get(
                    f"/api/students/{student_a_id}", headers=headers
                ).status_code == 200
                assert client.get(
                    f"/api/students/{student_b_id}", headers=headers
                ).status_code == 404
                assert client.get(
                    f"/api/students/student/{student_a_id}", headers=headers
                ).status_code == 200
                assert client.get(
                    f"/api/students/student/{student_b_id}", headers=headers
                ).status_code == 404
                assert client.get(
                    f"/api/fees/{fee_a_id}", headers=headers
                ).status_code == 200
                assert client.get(
                    f"/api/fees/{fee_b_id}", headers=headers
                ).status_code == 404
                assert client.get(
                    f"/api/payments/student/{student_a_id}", headers=headers
                ).status_code == 200
                assert client.get(
                    f"/api/payments/student/{student_b_id}", headers=headers
                ).status_code == 404

    finally:
        with Session(engine) as session:
            for payment_id in (payment_a_id, payment_b_id):
                payment = session.get(Payment, payment_id)
                if payment is not None:
                    session.delete(payment)
            session.flush()

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

            for user_id in (admin_a_id, parent_user_a_id):
                user = session.get(User, user_id)
                if user is not None:
                    session.delete(user)
            session.flush()

            for parent_id in (parent_a_id, parent_b_id):
                parent = session.get(ParentBlueprint, parent_id)
                if parent is not None:
                    session.delete(parent)
            session.flush()

            for school_id in (school_a_id, school_b_id):
                school = session.get(School, school_id)
                if school is not None:
                    session.delete(school)
            session.commit()
