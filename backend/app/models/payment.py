from sqlmodel import Field, SQLModel


# Payment Model
class Payment(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    amount: int
    date_time: str
    fee_id: int | None = Field(default=None, foreign_key="feeobligation.id")
    student_id: int | None = Field(default=None, foreign_key="studentblueprint.id")
    school_id: int = Field(foreign_key="school.id", index=True)
    status: str


class PaymentCreate(SQLModel):
    amount: int
    date_time: str
    fee_id: int
    # The route uses the fee's student, even if a client sends another student ID.
    student_id: int
    status: str
