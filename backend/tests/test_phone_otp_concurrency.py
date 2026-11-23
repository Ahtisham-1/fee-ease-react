from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from threading import Barrier
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.database import engine
from app.main import app
from app.models.parent import ParentBlueprint
from app.models.phone_otp import PhoneOTP
from app.models.school import School
from app.models.user import User
from app.security import create_access_token, protect_otp


def test_two_requests_cannot_use_the_same_otp():
    phone = "+91" + str(6_000_000_000 + uuid4().int % 4_000_000_000)
    email = f"otp-lock-{uuid4().hex}@example.com"
    otp_code = "123456"
    token = create_access_token({"sub": email})

    with Session(engine) as session:
        school = School(name="OTP lock test school")
        session.add(school)
        session.commit()
        session.refresh(school)

        parent = ParentBlueprint(
            name="OTP lock test parent",
            phone=phone,
            school_id=school.id,
        )
        user = User(
            email=email,
            hashed_password="not-used",
            role="parent",
        )
        session.add(parent)
        session.add(user)
        session.commit()
        session.refresh(parent)
        session.refresh(user)

        phone_otp = PhoneOTP(
            user_id=user.id,
            phone=phone,
            otp_hash=protect_otp(otp_code, phone),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=5),
        )
        session.add(phone_otp)
        session.commit()
        session.refresh(phone_otp)

        school_id = school.id
        parent_id = parent.id
        user_id = user.id
        otp_id = phone_otp.id

    try:
        headers = {"Authorization": f"Bearer {token}"}
        request_body = {"phone": phone, "otp_code": otp_code}

        with TestClient(app) as client:
            barrier = Barrier(2)

            def send_verify_request():
                barrier.wait(timeout=5)
                return client.post(
                    "/api/auth/phone/verify-otp",
                    headers=headers,
                    json=request_body,
                )

            with ThreadPoolExecutor(max_workers=2) as workers:
                first_request = workers.submit(send_verify_request)
                second_request = workers.submit(send_verify_request)
                responses = [first_request.result(), second_request.result()]

        status_codes = sorted(response.status_code for response in responses)
        assert status_codes == [200, 400]

        assert any(
            response.status_code == 400
            and response.json().get("detail")
            == "This verification code has already been used"
            for response in responses
        )

        with Session(engine) as session:
            saved_user = session.get(User, user_id)
            saved_otp = session.get(PhoneOTP, otp_id)
            linked_parent_id = saved_user.parent_id if saved_user else None
            otp_was_used = saved_otp.is_used if saved_otp else False

        assert linked_parent_id == parent_id
        assert otp_was_used is True

    finally:
        with Session(engine) as session:
            saved_otp = session.get(PhoneOTP, otp_id)
            saved_user = session.get(User, user_id)
            saved_parent = session.get(ParentBlueprint, parent_id)
            saved_school = session.get(School, school_id)

            if saved_otp is not None:
                session.delete(saved_otp)
                session.flush()

            if saved_user is not None:
                session.delete(saved_user)
                session.flush()

            if saved_parent is not None:
                session.delete(saved_parent)
                session.flush()

            if saved_school is not None:
                session.delete(saved_school)
                session.flush()

            session.commit()
