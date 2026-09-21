from fastapi import FastAPI, Depends, HTTPException, Query
import datetime
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Relationship, create_engine, SQLModel, Field, Session, select
from typing import Annotated, Literal


app = FastAPI()

# The PostgreSQL connection String
DATABASE_URL = "postgresql://postgres:password@localhost:5432/feeease_db"

# Creating the Engine
engine = create_engine(DATABASE_URL, echo=True)


origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


# Payment Model
class Payment(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    amount: int
    date_time: str
    fee_id: int | None = Field(default=None, foreign_key="feeobligation.id")
    student_id: int | None = Field(default=None, foreign_key="studentblueprint.id")
    status: str


@app.get("/")
def read_root():
    return {"message": "Clean start successful!"}


# Creating Tables on Startup
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


# The Session: Your Request Workspace
def get_session():
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]


# Create Database Tables on Startup
@app.on_event("startup")
def on_startup():
    create_db_and_tables()


# ------------- Student Endpoints------------
@app.get("/api/students", response_model=list[StudentBlueprint])
def read_students(
    session: SessionDep,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
):
    students = session.exec(select(StudentBlueprint)).all()
    return students


@app.post("/api/students", response_model=StudentBlueprint)
def create_student(student: StudentBlueprint, session: SessionDep):
    # Put it in the cart
    session.add(student)
    # Hit "save"
    session.commit()
    # Get the new id from PostgreSQL
    session.refresh(student)
    # Send it back to the frontend
    return student


@app.get("/api/students/{student_id}", response_model=StudentBlueprint)
def read_one_student(student_id: int, session: SessionDep) -> StudentBlueprint:
    student = session.get(StudentBlueprint, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@app.patch("/api/students/{student_id}", response_model=StudentBlueprint)
def update_student(student_id: int, student: StudentUpdate, session: SessionDep):
    student_db = session.get(StudentBlueprint, student_id)
    if not student_db:
        raise HTTPException(status_code=404, detail="Student not found")
    student_data = student.model_dump(exclude_unset=True)
    student_db.sqlmodel_update(student_data)
    session.add(student_db)
    session.commit()
    session.refresh(student_db)
    return student_db


@app.delete("/api/students/{student_id}")
def delete_student(student_id: int, session: SessionDep):
    student = session.get(StudentBlueprint, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Item not found to be deleted")
    session.delete(student)
    session.commit()
    return {"Ok": True}


# ------------ PARENT ENDPOINTS -----------
@app.post("/api/parents", response_model=ParentBlueprint)
def create_parent(parent: ParentBlueprint, session: SessionDep):
    session.add(parent)
    session.commit()
    session.refresh(parent)
    return parent


@app.get("/api/parents", response_model=list[ParentBlueprint])
def read_all_parents(
    session: SessionDep,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
):
    parents = session.exec(select(ParentBlueprint)).all()
    return parents


@app.get("/api/parents/{parent_id}", response_model=ParentBlueprint)
def read_one_parent(parent_id: int, session: SessionDep) -> ParentBlueprint:
    parent = session.get(ParentBlueprint, parent_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")
    return parent


@app.delete("/api/parents/{parent_id}")
def delete_parent(parent_id: int, session: SessionDep):
    parent = session.get(ParentBlueprint, parent_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found to be deleted")
    session.delete(parent)
    session.commit()
    return {"Ok": True}


@app.patch("/api/parents/{parent_id}", response_model=ParentBlueprint)
def update_parent(parent_id: int, parent: ParentUpdate, session: SessionDep):
    parent_db = session.get(ParentBlueprint, parent_id)
    if not parent_db:
        raise HTTPException(status_code=404, detail="Parnet not found")
    parent_data = parent.model_dump(exclude_unset=True)
    parent_db.sqlmodel_update(parent_data)
    session.add(parent_db)
    session.commit()
    session.refresh(parent_db)
    return parent_db


# -------- FEE OBLIGATION END POINTS ----------


@app.post("/api/fees", response_model=FeeObligation)
def create_fees(createfeeobligation: FeeObligation, session: SessionDep):
    session.add(createfeeobligation)
    session.commit()
    session.refresh(createfeeobligation)
    return createfeeobligation


@app.get("/api/fees", response_model=list[FeeObligation])
def read_all_fees(
    session: SessionDep,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
):
    feeobligation = session.exec(select(FeeObligation)).all()
    return feeobligation


@app.get("/api/fees/{fees_id}", response_model=FeeObligation)
def read_one_fees(fees_id: int, session: SessionDep) -> FeeObligation:
    feeobligation = session.get(FeeObligation, fees_id)
    if not feeobligation:
        raise HTTPException(status_code=404, detail="Fees detail not found")
    return feeobligation


@app.patch("/api/fees/{fees_id}", response_model=FeeObligation)
def update_fees(fees_id: int, feeobligation: FeeObligation, session: SessionDep):
    fee_db = session.get(FeeObligation, fees_id)
    if not fee_db:
        raise HTTPException(
            status_code=404, detail="Fees detail not found to be updated"
        )
    fee_data = feeobligation.model_dump(exclude_unset=True)
    fee_db.sqlmodel_update(fee_data)
    session.add(fee_db)
    session.commit()
    session.refresh(fee_db)
    return fee_db


@app.get("/api/students/{student_id}/fees", response_model=list[FeeObligation])
def read_student_fees(student_id: int, session: SessionDep):
    student = session.get(StudentBlueprint, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student Fee detail not found")

    fees = session.exec(
        select(FeeObligation).where(FeeObligation.student_id == student_id)
    ).all()
    return fees


@app.delete("/api/fees/{fees_id}")
def delete_fees(fees_id: int, session: SessionDep):
    feeobligation = session.get(FeeObligation, fees_id)
    if not feeobligation:
        raise HTTPException(
            status_code=404, detail="No Fees details found to be deleted"
        )
    session.delete(feeobligation)
    session.commit()
    return {"Ok": True}


# ---------- ASSIGN FEES ENDPOINTS ----------
@app.post("/api/fees/assign")
def assign_fees(payload: AssignFeesPayload, session: SessionDep):
    students = session.exec(
        select(StudentBlueprint).where(StudentBlueprint.grade == payload.target_class)
    ).all()
    if not students:
        raise HTTPException(status_code=404, detail="No students found in this class")
    for x in students:
        fee = FeeObligation(
            student_id=x.id,
            fee_amount=payload.assign_fees,
            month=payload.target_month,
            academic_year=payload.academic_year,
            fee_type="tuition+transport" if x.has_transport else "tuition",
            fee_status="pending",
        )
        if x.has_transport:
            fee.fee_amount += x.transport_fee
        session.add(fee)
    session.commit()
    return {"message": "Fees assigned successfully", "count": len(students)}


# Payment Endpoints
@app.post("/api/payments")
def assign_payments(payment: Payment, session: SessionDep):
    payment_db = session.get(FeeObligation, payment.fee_id)
    if not payment_db:
        raise HTTPException(status_code=404, detail="Fee record not found")
    elif payment_db.fee_status == "paid":
        raise HTTPException(status_code=404, detail="Fee has already paid")
    payment_db.fee_status = "paid"
    session.add(payment_db)
    session.add(payment)
    session.commit()
    session.refresh(payment)
    return payment
