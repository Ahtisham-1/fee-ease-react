from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from threading import Barrier
from uuid import uuid4

from app.database import engine
from app.main import app
from app.models.parent import ParentBlueprint
from app.models.phone_otp import PhoneOTP
from app.models.school import School
from app.models.user import User
from app.security import create_access_token, protect_otp
from fastapi.testclient import TestClient
from sqlmodel import Session, col, select


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
        assert school.id is not None

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
        assert parent.id is not None
        assert user.id is not None

        phone_otp = PhoneOTP(
            user_id=user.id,
            phone=phone,
            otp_hash=protect_otp(otp_code, phone),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=5),
        )
        session.add(phone_otp)
        session.commit()
        session.refresh(phone_otp)
        assert phone_otp.id is not None

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
            linked_school_id = saved_user.school_id if saved_user else None
            otp_was_used = saved_otp.is_used if saved_otp else False

        assert linked_parent_id == parent_id
        assert linked_school_id == school_id
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


def _seed_phone_otp_case(
    *,
    parent_count=1,
    expires_at=None,
    attempts=0,
    is_used=False,
    already_linked=False,
):
    phone = "+91" + str(6_000_000_000 + uuid4().int % 4_000_000_000)
    email = f"phone-otp-case-{uuid4().hex}@example.com"
    otp_code = "123456"

    with Session(engine) as session:
        school = School(name="Phone OTP test school")
        session.add(school)
        session.commit()
        session.refresh(school)
        assert school.id is not None

        parents = [
            ParentBlueprint(
                name=f"Phone OTP test parent {index}",
                phone=phone,
                school_id=school.id,
            )
            for index in range(parent_count)
        ]
        session.add_all(parents)
        session.flush()
        if already_linked and parents:
            assert parents[0].id is not None
            linked_parent_id = parents[0].id
        else:
            linked_parent_id = None
        user = User(
            email=email,
            hashed_password="not-used",
            role="parent",
            parent_id=linked_parent_id,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        assert user.id is not None
        parent_ids = []
        for parent in parents:
            session.refresh(parent)
            assert parent.id is not None
            parent_ids.append(parent.id)

        phone_otp = PhoneOTP(
            user_id=user.id,
            phone=phone,
            otp_hash=protect_otp(otp_code, phone),
            expires_at=expires_at or datetime.now(timezone.utc) + timedelta(minutes=5),
            attempts=attempts,
            is_used=is_used,
        )
        session.add(phone_otp)
        session.commit()
        session.refresh(phone_otp)
        assert phone_otp.id is not None

        case = {
            "phone": phone,
            "email": email,
            "otp_code": otp_code,
            "school_id": school.id,
            "parent_ids": parent_ids,
            "user_id": user.id,
            "otp_id": phone_otp.id,
            "token": create_access_token({"sub": email}),
        }

    return case


def _delete_phone_otp_case(case):
    with Session(engine) as session:
        saved_otp = session.get(PhoneOTP, case["otp_id"])
        saved_user = session.get(User, case["user_id"])
        if saved_otp is not None:
            session.delete(saved_otp)
            session.flush()
        if saved_user is not None:
            session.delete(saved_user)
            session.flush()
        for parent_id in case["parent_ids"]:
            parent = session.get(ParentBlueprint, parent_id)
            if parent is not None:
                session.delete(parent)
                session.flush()
        school = session.get(School, case["school_id"])
        if school is not None:
            session.delete(school)
            session.flush()
        session.commit()


def _verify(case, *, phone=None, otp_code=None, token=None):
    with TestClient(app) as client:
        return client.post(
            "/api/auth/phone/verify-otp",
            headers={"Authorization": f"Bearer {token or case['token']}"},
            json={
                "phone": phone or case["phone"],
                "otp_code": otp_code or case["otp_code"],
            },
        )


def test_expired_otp_is_rejected_without_linking_or_using_it():
    case = _seed_phone_otp_case(
        expires_at=datetime.now(timezone.utc) - timedelta(seconds=1)
    )
    try:
        response = _verify(case)
        assert response.status_code == 400
        assert response.json()["detail"] == "This verification code has expired"

        with Session(engine) as session:
            user = session.get(User, case["user_id"])
            phone_otp = session.get(PhoneOTP, case["otp_id"])
            assert user is not None
            assert phone_otp is not None
            assert user.parent_id is None
            assert phone_otp.is_used is False
    finally:
        _delete_phone_otp_case(case)


def test_wrong_otp_increments_attempts_and_three_attempts_lock_the_code():
    case = _seed_phone_otp_case()
    try:
        for attempt in range(3):
            response = _verify(case, otp_code="000000")
            assert response.status_code == 400
            assert response.json()["detail"] == "Invalid verification code"
            with Session(engine) as session:
                phone_otp = session.get(PhoneOTP, case["otp_id"])
                assert phone_otp is not None
                assert phone_otp.attempts == attempt + 1

        locked_response = _verify(case)
        assert locked_response.status_code == 429
        assert locked_response.json()["detail"] == (
            "Too many failed attempts. This code is locked"
        )
        with Session(engine) as session:
            user = session.get(User, case["user_id"])
            phone_otp = session.get(PhoneOTP, case["otp_id"])
            assert user is not None
            assert phone_otp is not None
            assert user.parent_id is None
            assert phone_otp.is_used is False
            assert phone_otp.attempts == 3
    finally:
        _delete_phone_otp_case(case)


def test_used_otp_is_rejected():
    case = _seed_phone_otp_case(is_used=True)
    try:
        response = _verify(case)
        assert response.status_code == 400
        assert response.json()["detail"] == (
            "This verification code has already been used"
        )
        with Session(engine) as session:
            user = session.get(User, case["user_id"])
            assert user is not None
            assert user.parent_id is None
    finally:
        _delete_phone_otp_case(case)


def test_phone_without_an_otp_request_is_rejected():
    case = _seed_phone_otp_case()
    other_phone = "+91" + str(6_000_000_000 + uuid4().int % 4_000_000_000)
    try:
        response = _verify(case, phone=other_phone)
        assert response.status_code == 404
        assert response.json()["detail"] == "No phone verification request found"
        with Session(engine) as session:
            user = session.get(User, case["user_id"])
            assert user is not None
            assert user.parent_id is None
    finally:
        _delete_phone_otp_case(case)


def test_otp_cannot_be_used_by_a_different_user():
    case = _seed_phone_otp_case()
    other_email = f"other-phone-otp-user-{uuid4().hex}@example.com"
    with Session(engine) as session:
        other_user = User(
            email=other_email,
            hashed_password="not-used",
            role="parent",
        )
        session.add(other_user)
        session.commit()
        session.refresh(other_user)
        assert other_user.id is not None
        other_user_id = other_user.id

    try:
        other_token = create_access_token({"sub": other_email})
        response = _verify(case, token=other_token)
        assert response.status_code == 404
        with Session(engine) as session:
            user = session.get(User, other_user_id)
            phone_otp = session.get(PhoneOTP, case["otp_id"])
            assert user is not None
            assert phone_otp is not None
            assert user.parent_id is None
            assert phone_otp.is_used is False
    finally:
        with Session(engine) as session:
            other_user = session.get(User, other_user_id)
            if other_user is not None:
                session.delete(other_user)
                session.commit()
        _delete_phone_otp_case(case)


def test_phone_with_no_matching_parent_is_rejected():
    case = _seed_phone_otp_case(parent_count=0)
    try:
        response = _verify(case)
        assert response.status_code == 400
        assert response.json()["detail"] == "Verification failed"
        with Session(engine) as session:
            user = session.get(User, case["user_id"])
            phone_otp = session.get(PhoneOTP, case["otp_id"])
            assert user is not None
            assert phone_otp is not None
            assert user.parent_id is None
            assert phone_otp.is_used is False
    finally:
        _delete_phone_otp_case(case)


def test_already_linked_user_cannot_link_a_second_parent():
    case = _seed_phone_otp_case(already_linked=True)
    try:
        with Session(engine) as session:
            user = session.get(User, case["user_id"])
            assert user is not None
            existing_parent_id = user.parent_id

        response = _verify(case)
        assert response.status_code == 400
        assert response.json()["detail"] == "Parent account already linked to this user"

        with Session(engine) as session:
            user = session.get(User, case["user_id"])
            phone_otp = session.get(PhoneOTP, case["otp_id"])
            assert user is not None
            assert phone_otp is not None
            assert user.parent_id == existing_parent_id
            assert phone_otp.is_used is False
    finally:
        _delete_phone_otp_case(case)


def test_phone_otp_endpoints_require_authentication():
    with TestClient(app) as client:
        send_response = client.post(
            "/api/auth/phone/send-otp", json={"phone": "+919876543210"}
        )
        verify_response = client.post(
            "/api/auth/phone/verify-otp",
            json={"phone": "+919876543210", "otp_code": "123456"},
        )
    assert send_response.status_code == 401
    assert verify_response.status_code == 401


def _seed_user_for_send_test():
    email = f"phone-otp-send-{uuid4().hex}@example.com"
    with Session(engine) as session:
        user = User(email=email, hashed_password="not-used", role="parent")
        session.add(user)
        session.commit()
        session.refresh(user)
        assert user.id is not None
        user_id = user.id
    return {
        "email": email,
        "user_id": user_id,
        "token": create_access_token({"sub": email}),
        "phone": "+919876543210",
    }


def _delete_send_test_user(case):
    with Session(engine) as session:
        records = session.exec(
            select(PhoneOTP).where(PhoneOTP.user_id == case["user_id"])
        ).all()
        for record in records:
            session.delete(record)
        session.flush()
        user = session.get(User, case["user_id"])
        if user is not None:
            session.delete(user)
        session.commit()


def test_send_otp_stores_only_protected_code_and_sets_expiry(monkeypatch):
    from app.routes import auth

    case = _seed_user_for_send_test()
    sent_codes = []
    monkeypatch.setattr(auth, "is_rate_limited", lambda _ip: False)
    monkeypatch.setattr(
        auth,
        "send_otp_sms",
        lambda phone, otp: sent_codes.append((phone, otp)),
    )
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/auth/phone/send-otp",
                headers={"Authorization": f"Bearer {case['token']}"},
                json={"phone": case["phone"]},
            )

        assert response.status_code == 200
        assert len(sent_codes) == 1
        assert sent_codes[0][0] == case["phone"]
        sent_code = sent_codes[0][1]

        with Session(engine) as session:
            record = session.exec(
                select(PhoneOTP).where(PhoneOTP.user_id == case["user_id"])
            ).one()
            assert record.otp_hash == protect_otp(sent_code, case["phone"])
            assert record.otp_hash != sent_code
            assert record.is_used is False
            assert record.expires_at > datetime.now(timezone.utc)
    finally:
        _delete_send_test_user(case)


def test_send_otp_cooldown_rejects_another_request(monkeypatch):
    from app.routes import auth

    case = _seed_user_for_send_test()
    monkeypatch.setattr(auth, "is_rate_limited", lambda _ip: False)
    monkeypatch.setattr(auth, "send_otp_sms", lambda **_kwargs: None)
    with Session(engine) as session:
        session.add(
            PhoneOTP(
                user_id=case["user_id"],
                phone=case["phone"],
                otp_hash=protect_otp("123456", case["phone"]),
                expires_at=datetime.now(timezone.utc) + timedelta(minutes=5),
            )
        )
        session.commit()
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/auth/phone/send-otp",
                headers={"Authorization": f"Bearer {case['token']}"},
                json={"phone": case["phone"]},
            )
        assert response.status_code == 429
        with Session(engine) as session:
            records = session.exec(
                select(PhoneOTP).where(PhoneOTP.user_id == case["user_id"])
            ).all()
            assert len(records) == 1
    finally:
        _delete_send_test_user(case)


def test_send_otp_stays_blocked_while_current_code_is_still_valid(monkeypatch):
    from app.routes import auth

    case = _seed_user_for_send_test()
    monkeypatch.setattr(auth, "is_rate_limited", lambda _ip: False)
    monkeypatch.setattr(auth, "send_otp_sms", lambda **_kwargs: None)
    with Session(engine) as session:
        session.add(
            PhoneOTP(
                user_id=case["user_id"],
                phone=case["phone"],
                otp_hash=protect_otp("123456", case["phone"]),
                expires_at=datetime.now(timezone.utc) + timedelta(minutes=4),
                created_at=datetime.now(timezone.utc) - timedelta(seconds=61),
            )
        )
        session.commit()
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/auth/phone/send-otp",
                headers={"Authorization": f"Bearer {case['token']}"},
                json={"phone": case["phone"]},
            )
        assert response.status_code == 429
        assert response.json()["detail"] == (
            "Please wait until the current otp expires"
        )
        with Session(engine) as session:
            records = session.exec(
                select(PhoneOTP).where(PhoneOTP.user_id == case["user_id"])
            ).all()
            assert len(records) == 1
            assert records[0].is_used is False
    finally:
        _delete_send_test_user(case)


def test_new_otp_request_invalidates_expired_previous_code(monkeypatch):
    from app.routes import auth

    case = _seed_user_for_send_test()
    sent_codes = []
    monkeypatch.setattr(auth, "is_rate_limited", lambda _ip: False)
    monkeypatch.setattr(
        auth,
        "send_otp_sms",
        lambda phone, otp: sent_codes.append((phone, otp)),
    )
    with Session(engine) as session:
        session.add(
            PhoneOTP(
                user_id=case["user_id"],
                phone=case["phone"],
                otp_hash=protect_otp("123456", case["phone"]),
                expires_at=datetime.now(timezone.utc) - timedelta(seconds=1),
                created_at=datetime.now(timezone.utc) - timedelta(seconds=61),
            )
        )
        session.commit()
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/auth/phone/send-otp",
                headers={"Authorization": f"Bearer {case['token']}"},
                json={"phone": case["phone"]},
            )
        assert response.status_code == 200
        assert len(sent_codes) == 1
        with Session(engine) as session:
            records = session.exec(
                select(PhoneOTP)
                .where(PhoneOTP.user_id == case["user_id"])
                .order_by(col(PhoneOTP.id))
            ).all()
            assert len(records) == 2
            assert records[0].is_used is True
            assert records[1].is_used is False
            assert records[1].otp_hash == protect_otp(
                sent_codes[0][1], case["phone"]
            )
    finally:
        _delete_send_test_user(case)


def test_sms_failure_does_not_save_a_usable_otp(monkeypatch):
    from app.routes import auth

    case = _seed_user_for_send_test()
    monkeypatch.setattr(auth, "is_rate_limited", lambda _ip: False)

    def fail_to_send(**_kwargs):
        raise RuntimeError("SMS provider failed")

    monkeypatch.setattr(auth, "send_otp_sms", fail_to_send)
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/auth/phone/send-otp",
                headers={"Authorization": f"Bearer {case['token']}"},
                json={"phone": case["phone"]},
            )
        assert response.status_code == 500
        assert response.json()["detail"] == "Could not create phone verification request"
        with Session(engine) as session:
            records = session.exec(
                select(PhoneOTP).where(PhoneOTP.user_id == case["user_id"])
            ).all()
            assert records == []
    finally:
        _delete_send_test_user(case)



def test_duplicate_parent_phone_is_rejected():
    phone = "+91" + str(6_000_000_000 + uuid4().int % 4_000_000_000)
    email = f"duplicate-parent-{uuid4().hex}@example.com"
    otp_code = "123456"
    token = create_access_token({"sub": email})

    with Session(engine) as session:
        school = School(name="Duplicate parent test school")
        session.add(school)
        session.commit()
        session.refresh(school)
        assert school.id is not None

        first_parent = ParentBlueprint(
            name="First matching parent",
            phone=phone,
            school_id=school.id,
        )
        second_parent = ParentBlueprint(
            name="Second matching parent",
            phone=phone,
            school_id=school.id,
        )
        user = User(
            email=email,
            hashed_password="not-used",
            role="parent",
        )
        session.add_all([first_parent, second_parent, user])
        session.commit()
        session.refresh(first_parent)
        session.refresh(second_parent)
        session.refresh(user)
        assert first_parent.id is not None
        assert second_parent.id is not None
        assert user.id is not None

        phone_otp = PhoneOTP(
            user_id=user.id,
            phone=phone,
            otp_hash=protect_otp(otp_code, phone),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=5),
        )
        session.add(phone_otp)
        session.commit()
        session.refresh(phone_otp)
        assert phone_otp.id is not None

        school_id = school.id
        parent_ids = [first_parent.id, second_parent.id]
        user_id = user.id
        otp_id = phone_otp.id

    try:
        headers = {"Authorization": f"Bearer {token}"}
        request_body = {"phone": phone, "otp_code": otp_code}

        with TestClient(app) as client:
            response = client.post(
                "/api/auth/phone/verify-otp",
                headers=headers,
                json=request_body,
            )

        assert response.status_code == 400
        assert response.json().get("detail") == "Verification failed"

        with Session(engine) as session:
            saved_user = session.get(User, user_id)
            saved_otp = session.get(PhoneOTP, otp_id)
            assert saved_user is not None
            assert saved_otp is not None
            linked_parent_id = saved_user.parent_id if saved_user else None
            otp_was_used = saved_otp.is_used if saved_otp else False

        assert linked_parent_id is None
        assert otp_was_used is False

    finally:
        with Session(engine) as session:
            saved_otp = session.get(PhoneOTP, otp_id)
            saved_user = session.get(User, user_id)
            saved_school = session.get(School, school_id)

            if saved_otp is not None:
                session.delete(saved_otp)
                session.flush()

            if saved_user is not None:
                session.delete(saved_user)
                session.flush()

            for parent_id in parent_ids:
                saved_parent = session.get(ParentBlueprint, parent_id)
                if saved_parent is not None:
                    session.delete(saved_parent)
                    session.flush()

            if saved_school is not None:
                session.delete(saved_school)
                session.flush()

            session.commit()
