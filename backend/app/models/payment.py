from sqlmodel import SQLModel, Field, Relationship

# Payment Model
class Payment(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    amount: int
    date_time: str
    fee_id: int | None = Field(default=None, foreign_key="feeobligation.id")
    student_id: int | None = Field(default=None, foreign_key="studentblueprint.id")
    status: str