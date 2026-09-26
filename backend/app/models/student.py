from sqlmodel import SQLModel, Field, Relationship
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.parent import ParentBlueprint
    from app.models.fee import FeeObligation


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
    parent: ParentBlueprint | None = Relationship(back_populates="students")
    feeobligation: list["FeeObligation"] | None = Relationship(back_populates="student")


# For student update
class StudentUpdate(SQLModel):
    student_name: str | None = None
    parent_id: str | None = None
    phone: str | None = None
    grade: str | None = None
    tuition_fee: int | None = None
    has_transport: bool | None = None
    transport_fee: int | None = None
