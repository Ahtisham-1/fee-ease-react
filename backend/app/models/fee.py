from __future__ import annotations
from sqlmodel import SQLModel, Field, Relationship
from typing import Literal, TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.student import StudentBlueprint


# Fee Obligation
class FeeObligation(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    student_id: int | None = Field(default=None, foreign_key="studentblueprint.id")
    fee_amount: int
    month: str
    academic_year: int
    fee_type: str
    fee_status: str = "pending"
    student: StudentBlueprint | None = Relationship(back_populates="feeobligation")


# Fee Obligation update
class FeeUpdate(SQLModel):
    fee_amount: int | None = None
    month: str | None = None
    academic_year: int | None = None
    fee_type: Literal["tuition", "tuition+transport"] | None = None
    fee_status: Literal["paid", "pending"] | None = None


# Assign fees class
class AssignFeesPayload(SQLModel):
    target_class: str
    target_month: str
    assign_fees: int
    academic_year: int
