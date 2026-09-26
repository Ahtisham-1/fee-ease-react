from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select
from typing import Annotated
from app.database import SessionDep
from app.models.student import StudentBlueprint, StudentUpdate
from app.models.fee import FeeObligation

router = APIRouter(prefix="/api/students", tags=["Students"])


# ------------- Student Endpoints------------
@router.get("/", response_model=list[StudentBlueprint])
def read_students(
    session: SessionDep,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
):
    students = session.exec(select(StudentBlueprint)).all()
    return students


@router.post("/", response_model=StudentBlueprint)
def create_student(student: StudentBlueprint, session: SessionDep):
    # Put it in the cart
    session.add(student)
    # Hit "save"
    session.commit()
    # Get the new id from PostgreSQL
    session.refresh(student)
    # Send it back to the frontend
    return student


@router.get("/{student_id}", response_model=StudentBlueprint)
def read_one_student(student_id: int, session: SessionDep) -> StudentBlueprint:
    student = session.get(StudentBlueprint, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.patch("/{student_id}", response_model=StudentBlueprint)
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


@router.delete("/{student_id}")
def delete_student(student_id: int, session: SessionDep):
    student = session.get(StudentBlueprint, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Item not found to be deleted")
    session.delete(student)
    session.commit()
    return {"Ok": True}


@router.get("/student/{student_id}", response_model=list[FeeObligation])
def read_student_fees(student_id: int, session: SessionDep):
    student = session.get(StudentBlueprint, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student Fee detail not found")

    fees = session.exec(
        select(FeeObligation).where(FeeObligation.student_id == student_id)
    ).all()
    return fees
