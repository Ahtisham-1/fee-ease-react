from sqlmodel import SQLModel, Field, Relationship

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.student import StudentBlueprint


# Parent Blueprint
class ParentBlueprint(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    phone: str
    students: list["StudentBlueprint"] = Relationship(back_populates="parent")


# For Parent Update
class ParentUpdate(SQLModel):
    name: str
    phone: str
