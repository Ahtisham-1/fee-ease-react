from datetime import timezone

from app.models.school import School


def test_new_school_is_active_by_default():
    assert School.model_fields["is_active"].default is True


def test_new_school_creation_time_is_timezone_aware_utc():
    created_at_factory = School.model_fields["created_at"].default_factory
    assert created_at_factory is not None
    created_at = created_at_factory()

    assert created_at.tzinfo is not None
    assert created_at.utcoffset() == timezone.utc.utcoffset(None)


def test_school_identity_fields_are_required_and_timezone_aware():
    columns = School.__table__.columns

    assert columns["is_active"].nullable is False
    assert columns["created_at"].nullable is False
    assert columns["created_at"].type.timezone is True
