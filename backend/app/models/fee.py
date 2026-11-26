from sqlmodel import SQLModel, Field, Relationship
from typing import Literal, TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.models.student import StudentBlueprint


# Fee Obligation
class FeeObligation(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    student_id: int | None = Field(default=None, foreign_key="studentblueprint.id")
    school_id: int = Field(foreign_key="school.id", index=True)
    fee_amount: int
    month: str
    academic_year: int
    fee_type: str
    fee_status: str = "pending"
    student: Optional["StudentBlueprint"] = Relationship(back_populates="feeobligation")
 

# Client fields for creating a fee; the server gets school_id from the student.
class FeeCreate(SQLModel):
    student_id: int
    fee_amount: int
    month: str
    academic_year: int
    fee_type: str
    fee_status: str = "pending"


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
