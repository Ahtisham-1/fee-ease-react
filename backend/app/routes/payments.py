from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select
from typing import Annotated
from app.database import SessionDep
from app.models.payment import Payment
from app.models.fee import FeeObligation , FeeUpdate
from app.models.student import StudentBlueprint

router = APIRouter(prefix="/api/payments", tags=["Payments"])


# Payment Endpoints
@router.post("/")
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
 

@router.get("/", response_model=list[Payment])
def read_all_payments(
    session: SessionDep, offset: int = 0, limit: Annotated[int, Query(le=100)] = 100
):
    payment = session.exec(select(Payment)).all()
    return payment


@router.get("/student/{student_id}", response_model=list[Payment])
def read_student_payments(student_id: int, session: SessionDep):
    student = session.get(StudentBlueprint, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student Payment detail not found")
    payments = session.exec(
        select(Payment).where(Payment.student_id == student_id)
    ).all()
    return payments
