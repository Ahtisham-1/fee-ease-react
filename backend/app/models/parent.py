from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

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
