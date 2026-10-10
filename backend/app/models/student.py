from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.fee import FeeObligation
    from app.models.parent import ParentBlueprint


# Student blueprint
class StudentBlueprint(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    parent_id: int | None = Field(default=None, foreign_key="parentblueprint.id")
    student_name: str
    phone: str
    grade: str
    tuition_fee: int
    has_transport: bool = False
    transport_fee: int = 0
    parent: Optional["ParentBlueprint"] = Relationship(back_populates="students")
    feeobligation: list["FeeObligation"] = Relationship(back_populates="student") 


# For student update
class StudentUpdate(SQLModel):
    student_name: str | None = None
    parent_id: str | None = None
    phone: str | None = None
    grade: str | None = None
    tuition_fee: int | None = None
    has_transport: bool | None = None
    transport_fee: int | None = None
