from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

from app.database import get_session
from app.main import app
from app.models.otp import OTP
from app.models.pending_registration import PendingRegistration
from app.models.user import User


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
