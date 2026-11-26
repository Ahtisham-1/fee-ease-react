from datetime import timezone

from app.models.school import School


def test_new_school_is_active_by_default():
    school = School(name="Test school")

    assert school.is_active is True


def test_new_school_creation_time_is_timezone_aware_utc():
    school = School(name="Test school")

    assert school.created_at.tzinfo is not None
    assert school.created_at.utcoffset() == timezone.utc.utcoffset(None)


def test_school_identity_fields_are_required_and_timezone_aware():
    columns = School.__table__.columns

    assert columns["is_active"].nullable is False
    assert columns["created_at"].nullable is False
    assert columns["created_at"].type.timezone is True
