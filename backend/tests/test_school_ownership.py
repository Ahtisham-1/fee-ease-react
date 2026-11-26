from types import SimpleNamespace
from unittest.mock import Mock

from app.models import fee as fee_models
from app.models import payment as payment_models
from app.models.parent import ParentBlueprint  # noqa: F401
from app.routes.fees import create_fees
from app.models.school import School  # noqa: F401


def test_fees_and_payments_require_an_indexed_school_foreign_key():
    for model in (fee_models.FeeObligation, payment_models.Payment):
        school_column = model.__table__.columns["school_id"]

        assert school_column.nullable is False
        assert any(
            foreign_key.target_fullname == "school.id"
            for foreign_key in school_column.foreign_keys
        )
        assert any(
            list(index.columns.keys()) == ["school_id"]
            for index in model.__table__.indexes
        )


def test_school_id_is_not_accepted_in_fee_or_payment_write_schemas():
    assert "school_id" not in fee_models.FeeCreate.model_fields
    assert "school_id" not in fee_models.FeeUpdate.model_fields
    assert "school_id" not in payment_models.PaymentCreate.model_fields


def test_new_fee_takes_school_id_from_its_student():
    session = Mock()
    session.get.return_value = SimpleNamespace(id=123, school_id=9)
    payload = fee_models.FeeCreate(
        student_id=123,
        fee_amount=1000,
        month="January",
        academic_year=2026,
        fee_type="tuition",
    )

    fee = create_fees(payload, session)

    assert fee.student_id == 123
    assert fee.school_id == 9
