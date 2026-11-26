# Import TestClient to make real HTTP requests to our FastAPI app
# Import pytest's monkeypatch fixture for mocking functions
import pytest

# Import database engine for connecting to PostgreSQL
from app.database import engine

# Import the FastAPI app instance so the test client can talk to it
from app.main import app
from app.models.email_otp import OTP
from app.models.fee import FeeObligation
from app.models.parent import ParentBlueprint
from app.models.payment import Payment
from app.models.pending_registration import PendingRegistration
from app.models.phone_otp import PhoneOTP

# Import models we need for setup and verification
from app.models.school import School
from app.models.student import StudentBlueprint
from app.models.user import User
from fastapi.testclient import TestClient

# Import SQLModel tools for database queries
from sqlmodel import Session, select


def test_full_parent_registration_to_payment_flow(monkeypatch):
    """
    Integration test: full parent journey from registration through payment.
    """
    # Create a test client that simulates HTTP requests to our app
    client = TestClient(app)

    # This test uses a disposable database, so clear leftovers before each run.
    def cleanup():
        with Session(engine) as session:
            for model in [
                Payment,
                FeeObligation,
                StudentBlueprint,
                PhoneOTP,
                User,
                OTP,
                PendingRegistration,
                ParentBlueprint,
                School,
            ]:
                for record in session.exec(select(model)).all():
                    session.delete(record)
            session.commit()

    cleanup()

    # Empty lists to store OTP codes captured by our mocked senders
    email_otp_codes = []
    sms_otp_codes = []

    # --- SETUP: Create school and parent record in database ---
    # Open a database session to write setup data
    with Session(engine) as session:
        # Create a school so we have a school_id for foreign keys
        school = School(name="Lifecycle Test School")
        session.add(school)
        session.commit()
        session.refresh(school)
        assert school.id is not None

        # Create a parent record with the phone number the user will verify
        # This is the record the user will LINK TO after phone verification
        parent = ParentBlueprint(
            name="Test Parent",
            phone="+919876543210",
            school_id=school.id,
        )
        session.add(parent)
        session.commit()
        session.refresh(parent)

        # Save IDs for later cleanup and assertions
        parent_id = parent.id
        school_id = school.id

    try:
        # ===== MOCK EMAIL SENDER BEFORE REGISTER =====
        # Import the auth module where send_otp_email lives
        from app.routes import auth

        # Define fake function that captures the OTP instead of sending email
        def mock_send_email(recipient_email: str, otp: str):
            email_otp_codes.append(otp)  # Save the raw OTP code for test to use

        # Replace real send_otp_email with our fake during this test
        monkeypatch.setattr(auth, "send_otp_email", mock_send_email)

        # ===== STEP 1: Register with email =====
        # Call the register endpoint with email, password, role
        register_resp = client.post(
            "/api/auth/register",
            json={
                "email": "lifecycle@test.com",
                "password": "password123",
                "role": "parent",
            },
        )
        # Should return 200: created PendingRegistration + "sent" email OTP
        assert register_resp.status_code == 200
        # Verify our mock captured exactly one OTP
        assert len(email_otp_codes) == 1
        # Store the captured OTP for next step
        email_otp = email_otp_codes[0]

        # ===== STEP 2: Verify Email OTP =====
        # Submit the captured OTP to complete registration
        verify_resp = client.post(
            "/api/auth/verify_otp",
            json={"email": "lifecycle@test.com", "otp_code": email_otp},
        )
        # Should return 200: User account now exists in database
        assert verify_resp.status_code == 200

        # ===== STEP 3: Login with email/password =====
        # Login uses form data (OAuth2 spec), not JSON
        login_resp = client.post(
            "/api/auth/login",
            data={"username": "lifecycle@test.com", "password": "password123"},
        )
        assert login_resp.status_code == 200
        # Extract JWT access token from response
        token_data = login_resp.json()
        access_token = token_data["access_token"]
        # Build Authorization header for authenticated requests
        auth_header = {"Authorization": f"Bearer {access_token}"}

        # ===== MOCK SMS SENDER BEFORE PHONE OTP =====
        def mock_send_sms(phone: str, otp: str):
            sms_otp_codes.append(otp)  # Save the raw phone OTP

        # Replace real send_otp_sms with our fake
        monkeypatch.setattr(auth, "send_otp_sms", mock_send_sms)

        # ===== STEP 4: Send Phone OTP =====
        # Authenticated request to send phone OTP
        send_phone_resp = client.post(
            "/api/auth/phone/send-otp",
            headers=auth_header,
            json={"phone": "+919876543210"},
        )
        assert send_phone_resp.status_code == 200
        assert len(sms_otp_codes) == 1
        phone_otp = sms_otp_codes[0]

        # ===== STEP 5: Verify Phone OTP (links parent) =====
        verify_phone_resp = client.post(
            "/api/auth/phone/verify-otp",
            headers=auth_header,
            json={"phone": "+919876543210", "otp_code": phone_otp},
        )
        assert verify_phone_resp.status_code == 200
        # User should now be linked to the parent record

        # ===== STEP 6: Verify Link in Database =====
        with Session(engine) as session:
            # Query the User we just created
            user = session.exec(
                select(User).where(User.email == "lifecycle@test.com")
            ).first()
            assert user is not None
            # Confirm the link worked: user.parent_id matches our parent
            assert user.parent_id == parent_id

        # ===== STEP 7: Verify Parent Can Access Student Fees =====
        # Create a student and fee so there's data to access
        with Session(engine) as session:
            student = StudentBlueprint(
                student_name="Test Student",
                phone="+919876543211",
                grade="1",
                tuition_fee=1000,
                parent_id=parent_id,
                school_id=school_id,
            )
            session.add(student)
            session.commit()
            session.refresh(student)
            student_id = student.id

            # Create a pending fee obligation for that student
            fee = FeeObligation(
                student_id=student_id,
                school_id=school_id,
                fee_amount=1000,
                month="January",
                academic_year=2026,
                fee_type="tuition",
                fee_status="pending",
            )
            session.add(fee)
            session.commit()
            session.refresh(fee)
            fee_id = fee.id

        # Call GET /api/students/ with parent's token
        students_resp = client.get("/api/students/", headers=auth_header)
        assert students_resp.status_code == 200
        students = students_resp.json()
        assert len(students) == 1
        assert students[0]["student_name"] == "Test Student"

        # Call GET /api/fees/ with parent's token
        fees_resp = client.get("/api/fees/", headers=auth_header)
        assert fees_resp.status_code == 200
        fees = fees_resp.json()
        assert len(fees) == 1
        assert fees[0]["fee_amount"] == 1000
        assert fees[0]["school_id"] == school_id

        payment_resp = client.post(
            "/api/payments/",
            headers=auth_header,
            json={
                "amount": 1000,
                "date_time": "2026-01-01T00:00:00Z",
                "fee_id": fee_id,
                "student_id": student_id + 1_000_000,
                "status": "SUCCESS",
            },
        )
        assert payment_resp.status_code == 200
        assert payment_resp.json()["student_id"] == student_id
        assert payment_resp.json()["school_id"] == school_id

    finally:
        # Always run cleanup, even if test fails
        cleanup()
