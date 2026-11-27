from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.database import engine
from app.main import app
from app.models.fee import FeeObligation
from app.models.parent import ParentBlueprint
from app.models.payment import Payment
from app.models.phone_otp import PhoneOTP
from app.models.school import School
from app.models.student import StudentBlueprint
from app.models.user import User
from app.security import create_access_token, protect_otp


def test_school_owned_lists_lookups_and_writes_stay_within_school():
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
            name=f"Parent B {suffix}",
            phone=f"+919{int(suffix[:8], 16) % 1_000_000_000:09d}",
            school_id=school_b.id,
        )
        session.add_all([parent_a, parent_b])
        session.commit()
        session.refresh(parent_a)
        session.refresh(parent_b)

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
        unlinked_user_a = User(
            email=f"list-unlinked-parent-{suffix}@example.com",
            hashed_password="not-used",
            role="parent",
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
        student_b_without_fees = StudentBlueprint(
            student_name=f"Student B without fees {suffix}",
            phone=f"+914{suffix[:9]}",
            grade="2",
            tuition_fee=1000,
            parent_id=parent_b.id,
            school_id=school_b.id,
        )
        session.add_all(
            [
                admin_a,
                parent_user_a,
                unlinked_user_a,
                student_a,
                student_b,
                student_b_without_fees,
            ]
        )
        session.commit()
        session.refresh(admin_a)
        session.refresh(parent_user_a)
        session.refresh(unlinked_user_a)
        session.refresh(student_a)
        session.refresh(student_b)
        session.refresh(student_b_without_fees)

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
        fee_b_without_payments = FeeObligation(
            student_id=student_b_without_fees.id,
            school_id=school_b.id,
            fee_amount=1000,
            month="January",
            academic_year=2026,
            fee_type="tuition",
        )
        session.add_all([fee_a, fee_b, fee_b_without_payments])
        session.commit()
        session.refresh(fee_a)
        session.refresh(fee_b)
        session.refresh(fee_b_without_payments)

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
        phone_otp_code = "123456"
        phone_otp = PhoneOTP(
            user_id=unlinked_user_a.id,
            phone=parent_b.phone,
            otp_hash=protect_otp(phone_otp_code, parent_b.phone),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=5),
        )
        session.add(phone_otp)
        session.commit()
        session.refresh(phone_otp)
        session.refresh(payment_a)
        session.refresh(payment_b)

        school_a_id = school_a.id
        school_b_id = school_b.id
        parent_a_id = parent_a.id
        parent_b_id = parent_b.id
        admin_a_id = admin_a.id
        parent_user_a_id = parent_user_a.id
        unlinked_user_a_id = unlinked_user_a.id
        student_a_id = student_a.id
        student_b_id = student_b.id
        student_b_without_fees_id = student_b_without_fees.id
        fee_a_id = fee_a.id
        fee_b_id = fee_b.id
        fee_b_without_payments_id = fee_b_without_payments.id
        phone_otp_id = phone_otp.id
        admin_token = create_access_token({"sub": admin_a.email})
        parent_token = create_access_token({"sub": parent_user_a.email})
        unlinked_token = create_access_token({"sub": unlinked_user_a.email})

    created_parent_id = None
    try:
        with TestClient(app) as client:
            admin_headers = {"Authorization": f"Bearer {admin_token}"}
            parent_headers = {"Authorization": f"Bearer {parent_token}"}
            unlinked_headers = {"Authorization": f"Bearer {unlinked_token}"}

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

            created_parent = client.post(
                "/api/parents/",
                headers=admin_headers,
                json={
                    "name": f"Created Parent {suffix}",
                    "phone": f"+918{int(suffix[8:16], 16) % 1_000_000_000:09d}",
                    "school_id": school_b_id,
                },
            )
            if created_parent.status_code == 200:
                created_parent_id = created_parent.json()["id"]
            assert created_parent.status_code == 200
            assert created_parent.json()["school_id"] == school_a_id

            assert client.patch(
                f"/api/parents/{parent_b_id}",
                headers=admin_headers,
                json={"name": "Changed from another school", "phone": parent_b.phone},
            ).status_code == 404
            assert client.delete(
                f"/api/parents/{parent_b_id}", headers=admin_headers
            ).status_code == 404

            assert client.post(
                "/api/students/",
                headers=admin_headers,
                json={
                    "student_name": f"Wrong school parent {suffix}",
                    "phone": "+919876543210",
                    "grade": "1",
                    "tuition_fee": 1000,
                    "parent_id": parent_b_id,
                    "school_id": school_b_id,
                },
            ).status_code == 404
            assert client.patch(
                f"/api/students/{student_b_id}",
                headers=admin_headers,
                json={"student_name": "Changed from another school"},
            ).status_code == 404
            assert client.patch(
                f"/api/students/{student_a_id}",
                headers=admin_headers,
                json={"parent_id": str(parent_a_id)},
            ).status_code == 200
            assert client.patch(
                f"/api/students/{student_a_id}",
                headers=admin_headers,
                json={"parent_id": str(parent_b_id)},
            ).status_code == 404
            assert client.delete(
                f"/api/students/{student_b_without_fees_id}", headers=admin_headers
            ).status_code == 404

            assert client.post(
                "/api/fees/",
                headers=admin_headers,
                json={
                    "student_id": student_b_id,
                    "fee_amount": 500,
                    "month": "March",
                    "academic_year": 2027,
                    "fee_type": "tuition",
                },
            ).status_code == 404
            assert client.patch(
                f"/api/fees/{fee_b_id}",
                headers=admin_headers,
                json={"fee_amount": 500},
            ).status_code == 404
            assert client.delete(
                f"/api/fees/{fee_b_without_payments_id}", headers=admin_headers
            ).status_code == 404

            assigned_fees = client.post(
                "/api/fees/assign",
                headers=admin_headers,
                json={
                    "target_class": "1",
                    "target_month": "February",
                    "assign_fees": 1000,
                    "academic_year": 2027,
                },
            )
            assert assigned_fees.status_code == 200
            assert assigned_fees.json()["count"] == 1

            cross_school_payment = {
                "amount": 100,
                "date_time": "2026-01-01T00:00:00Z",
                "fee_id": fee_b_id,
                "student_id": student_b_id,
                "status": "SUCCESS",
            }
            assert client.post(
                "/api/payments/", headers=admin_headers, json=cross_school_payment
            ).status_code == 404
            assert client.post(
                "/api/payments/", headers=parent_headers, json=cross_school_payment
            ).status_code == 404

            assert client.post(
                "/api/auth/phone/verify-otp",
                headers=unlinked_headers,
                json={"phone": parent_b.phone, "otp_code": phone_otp_code},
            ).status_code == 400
            with Session(engine) as session:
                unlinked_user = session.get(User, unlinked_user_a_id)
                saved_phone_otp = session.get(PhoneOTP, phone_otp_id)
                assert unlinked_user is not None
                assert unlinked_user.parent_id is None
                assert unlinked_user.school_id == school_a_id
                assert saved_phone_otp is not None
                assert saved_phone_otp.is_used is False

    finally:
        with Session(engine) as session:
            test_students = session.exec(
                select(StudentBlueprint).where(
                    StudentBlueprint.parent_id.in_([parent_a_id, parent_b_id])
                )
            ).all()
            test_student_ids = [student.id for student in test_students]
            for payment in session.exec(
                select(Payment).where(Payment.student_id.in_(test_student_ids))
            ).all():
                session.delete(payment)
            session.flush()

            for fee in session.exec(
                select(FeeObligation).where(
                    FeeObligation.student_id.in_(test_student_ids)
                )
            ).all():
                session.delete(fee)
            session.flush()

            for student in test_students:
                session.delete(student)
            session.flush()

            for otp in session.exec(
                select(PhoneOTP).where(PhoneOTP.user_id == unlinked_user_a_id)
            ).all():
                session.delete(otp)
            session.flush()

            for user_id in (admin_a_id, parent_user_a_id, unlinked_user_a_id):
                user = session.get(User, user_id)
                if user is not None:
                    session.delete(user)
            session.flush()

            for parent_id in (parent_a_id, parent_b_id, created_parent_id):
                if parent_id is None:
                    continue
                parent = session.get(ParentBlueprint, parent_id)
                if parent is not None:
                    session.delete(parent)
            session.flush()

            for school_id in (school_a_id, school_b_id):
                school = session.get(School, school_id)
                if school is not None:
                    session.delete(school)
            session.commit()
