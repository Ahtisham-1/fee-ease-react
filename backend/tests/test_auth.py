from datetime import datetime, timedelta, timezone

import pytest
from app.database import get_session
from app.main import app
from app.models.otp import OTP
from app.models.parent import ParentBlueprint
from app.models.pending_registration import PendingRegistration
from app.models.phone_otp import PhoneOTP
from app.models.user import User
from app.security import get_current_user, protect_otp
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select
from app.models.school import School


@pytest.fixture
def test_context():
    # Create a separate, in-memory SQLite database for testing.
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    SQLModel.metadata.create_all(test_engine)

    # Make FastAPI use the test database instead of the real database.
    def get_test_session():
        with Session(test_engine) as session:
            yield session

    app.dependency_overrides[get_session] = get_test_session
    client = TestClient(app)

    yield client, test_engine

    app.dependency_overrides.clear()
    SQLModel.metadata.drop_all(test_engine)
    test_engine.dispose()


def test_valid_otp_creates_user_and_removes_pending_registration(
    test_context,
):
    client, test_engine = test_context
    email = "parent@example.com"
    now = datetime.now(timezone.utc)

    # Arrange: create the pending registration and OTP.
    with Session(test_engine) as session:
        pending = PendingRegistration(
            email=email,
            hashed_password="test-password-hash",
            role="parent",
            created_at=now,
            expires_at=now + timedelta(minutes=15),
        )
        otp = OTP(
            email=email,
            otp_code="123456",
            expires_at=now + timedelta(minutes=5),
        )

        session.add(pending)
        session.add(otp)
        session.commit()

        # Act: call the actual API endpoint.
        response = client.post(
            "/api/auth/verify_otp",
            json={"email": email, "otp_code": "123456"},
        )

    # Assert: the request succeeded.
    assert response.status_code == 200, response.text

    # Assert: inspect the database after the request.
    with Session(test_engine) as session:
        user = session.exec(select(User).where(User.email == email)).first()

        used_otp = session.exec(select(OTP).where(OTP.email == email)).first()

        pending = session.exec(
            select(PendingRegistration).where(PendingRegistration.email == email)
        ).first()

        assert user is not None
        assert user.hashed_password == "test-password-hash"
        assert used_otp is not None
        assert used_otp.is_used is True
        assert pending is None


def test_invalid_otp_does_not_create_user(test_context):
    client, test_engine = test_context
    email = "parent@example.com"
    now = datetime.now(timezone.utc)

    with Session(test_engine) as session:
        pending = PendingRegistration(
            email=email,
            hashed_password="test-password-hash",
            role="parent",
            created_at=now,
            expires_at=now + timedelta(minutes=15),
        )
        otp = OTP(
            email=email,
            otp_code="123456",
            expires_at=now + timedelta(minutes=5),
        )
        session.add(pending)
        session.add(otp)
        session.commit()

    response = client.post(
        "/api/auth/verify_otp",
        json={"email": email, "otp_code": "000000"},
    )

    assert response.status_code == 400

    with Session(test_engine) as session:
        user = session.exec(select(User).where(User.email == email)).first()
        otp = session.exec(select(OTP).where(OTP.email == email)).first()
        pending = session.exec(
            select(PendingRegistration).where(PendingRegistration.email == email)
        ).first()

        assert user is None
        assert otp is not None
        assert otp.attempts == 1
        assert otp.is_used is False
        assert pending is not None


def test_registration_ignores_client_supplied_role(test_context, monkeypatch):
    client, test_engine = test_context

    monkeypatch.setattr(
        "app.routes.auth.send_otp_email",
        lambda recipient_email, otp: None,
    )

    response = client.post(
        "/api/auth/register",
        json={
            "email": "attacker@example.com",
            "password": "StrongTestPassword123!",
            "role": "admin",
        },
    )

    assert response.status_code == 200, response.text

    with Session(test_engine) as session:
        pending = session.exec(
            select(PendingRegistration).where(
                PendingRegistration.email == "attacker@example.com"
            )
        ).first()

        assert pending is not None
        assert pending.role == "parent"


def test_phone_otp_links_authenticated_user_to_parent(test_context):
    client, test_engine = test_context
    email = "parent@example.com"
    phone = "89898989"
    school_id = 1
    now = datetime.now(timezone.utc)

    with Session(test_engine) as session:
        parent = ParentBlueprint(
            name="Parent Example", phone=phone, school_id=school_id
        )

        user = User(email=email, hashed_password="test_password_hash", role="parent")

        session.add(parent)
        session.add(user)
        session.commit()
        session.refresh(user)
        session.refresh(parent)
        if user.id is None:
            raise AssertionError("Test user was not assigned an ID")
        if parent.id is None:
            raise AssertionError("Test parent was not assigned an ID")
        user_id = user.id
        parent_id = parent.id
        otp = PhoneOTP(
            user_id=user_id,
            phone=phone,
            otp_hash=protect_otp("123456", phone),
            expires_at=now + timedelta(minutes=5),
        )
        session.add(otp)
        session.commit()

    def get_test_current_user():
        with Session(test_engine) as session:
            return session.get(User, user_id)

    app.dependency_overrides[get_current_user] = get_test_current_user

    response = client.post(
        "/api/auth/phone/verify-otp",
        json={"phone": phone, "otp_code": "123456"},
    )

    assert response.status_code == 200, response.text

    with Session(test_engine) as session:
        saved_user = session.get(User, user_id)
        saved_otp = session.exec(
            select(PhoneOTP).where(PhoneOTP.user_id == user_id)
        ).first()

        assert saved_user is not None
        assert saved_user.parent_id == parent_id
        assert saved_otp is not None
        assert saved_otp.is_used is True


def test_expired_phone_otp_is_rejected(test_context):
    client, test_engine = test_context
    phone = "9876543210"
    now = datetime.now(timezone.utc)

    with Session(test_engine) as session:
        user = User(
            email="expired@example.com",
            hashed_password="test-password-hash",
            role="parent",
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        if user.id is None:
            raise AssertionError("Test user was not assigned an ID")
        user_id = user.id

        session.add(
            PhoneOTP(
                user_id=user_id,
                phone=phone,
                otp_hash=protect_otp("123456", phone),
                expires_at=now - timedelta(minutes=1),
            )
        )
        session.commit()

    def get_test_current_user():
        with Session(test_engine) as session:
            return session.get(User, user_id)

    app.dependency_overrides[get_current_user] = get_test_current_user

    response = client.post(
        "/api/auth/phone/verify-otp",
        json={"phone": phone, "otp_code": "123456"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "This verification code has expired"


def test_used_phone_otp_is_rejected(test_context):
    client, test_engine = test_context
    phone = "9876543210"
    now = datetime.now(timezone.utc)

    with Session(test_engine) as session:
        user = User(
            email="used@example.com",
            hashed_password="test-password-hash",
            role="parent",
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        if user.id is None:
            raise AssertionError("Test user was not assigned an ID")
        user_id = user.id

        session.add(
            PhoneOTP(
                user_id=user_id,
                phone=phone,
                otp_hash=protect_otp("123456", phone),
                expires_at=now + timedelta(minutes=5),
                is_used=True,
            )
        )
        session.commit()

    def get_test_current_user():
        with Session(test_engine) as session:
            return session.get(User, user_id)

    app.dependency_overrides[get_current_user] = get_test_current_user

    response = client.post(
        "/api/auth/phone/verify-otp",
        json={"phone": phone, "otp_code": "123456"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "This verification code has already been used"


def test_locked_phone_otp_is_rejected(test_context):
    client, test_engine = test_context
    phone = "9876543210"
    now = datetime.now(timezone.utc)

    with Session(test_engine) as session:
        user = User(
            email="locked@example.com",
            hashed_password="test-password-hash",
            role="parent",
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        if user.id is None:
            raise AssertionError("Test user was not assigned an ID")
        user_id = user.id

        session.add(
            PhoneOTP(
                user_id=user_id,
                phone=phone,
                otp_hash=protect_otp("123456", phone),
                expires_at=now + timedelta(minutes=5),
                attempts=3,
            )
        )
        session.commit()

    def get_test_current_user():
        with Session(test_engine) as session:
            return session.get(User, user_id)

    app.dependency_overrides[get_current_user] = get_test_current_user

    response = client.post(
        "/api/auth/phone/verify-otp",
        json={"phone": phone, "otp_code": "123456"},
    )

    assert response.status_code == 429
    assert response.json()["detail"] == "Too many failed attempts. This code is locked"


def test_phone_without_school_parent_record_cannot_link_user(test_context):
    client, test_engine = test_context
    phone = "9876543210"
    now = datetime.now(timezone.utc)

    with Session(test_engine) as session:
        user = User(
            email="unlinked@example.com",
            hashed_password="test-password-hash",
            role="parent",
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        if user.id is None:
            raise AssertionError("Test user was not assigned an ID")
        user_id = user.id

        session.add(
            PhoneOTP(
                user_id=user_id,
                phone=phone,
                otp_hash=protect_otp("123456", phone),
                expires_at=now + timedelta(minutes=5),
            )
        )
        session.commit()

    def get_test_current_user():
        with Session(test_engine) as session:
            return session.get(User, user_id)

    app.dependency_overrides[get_current_user] = get_test_current_user

    response = client.post(
        "/api/auth/phone/verify-otp",
        json={"phone": phone, "otp_code": "123456"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "No school recored found for this phone number"

    with Session(test_engine) as session:
        saved_user = session.get(User, user_id)
        assert saved_user is not None
        assert saved_user.parent_id is None


def test_invalid_phone_otp_does_not_link_user_and_increments_attempts(
    test_context,
):
    client, test_engine = test_context
    email = "parent@example.com"
    phone = "9876543210"
    school_id = 3
    now = datetime.now(timezone.utc)

    with Session(test_engine) as session:
        parent = ParentBlueprint(
            name="Parent Example", phone=phone, school_id=school_id
        )
        user = User(
            email=email,
            hashed_password="test-password-hash",
            role="parent",
        )

        session.add(parent)
        session.add(user)
        session.commit()
        session.refresh(user)

        if user.id is None:
            raise AssertionError("Test user was not assigned an ID")
        user_id = user.id

        otp = PhoneOTP(
            user_id=user_id,
            phone=phone,
            otp_hash=protect_otp("123456", phone),
            expires_at=now + timedelta(minutes=5),
        )
        session.add(otp)
        session.commit()

    def get_test_current_user():
        with Session(test_engine) as session:
            return session.get(User, user_id)

    app.dependency_overrides[get_current_user] = get_test_current_user

    response = client.post(
        "/api/auth/phone/verify-otp",
        json={"phone": phone, "otp_code": "000000"},
    )

    assert response.status_code == 400, response.text

    with Session(test_engine) as session:
        saved_user = session.get(User, user_id)
        saved_otp = session.exec(
            select(PhoneOTP).where(PhoneOTP.user_id == user_id)
        ).first()

        assert saved_user is not None
        assert saved_user.parent_id is None
        assert saved_otp is not None
        assert saved_otp.attempts == 1
        assert saved_otp.is_used is False
