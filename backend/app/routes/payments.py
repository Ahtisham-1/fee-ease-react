from fastapi import APIRouter, HTTPException, Query, Depends
from sqlmodel import select
from typing import Annotated
from app.database import SessionDep
from app.models.payment import Payment
from app.models.fee import FeeObligation, FeeUpdate
from app.models.student import StudentBlueprint
from app.security import get_current_user, CurrentUser

router = APIRouter(
    prefix="/api/payments", tags=["Payments"], dependencies=[Depends(get_current_user)]
)


# Payment Endpoints
@router.post("/")
def assign_payments(payment: Payment, session: SessionDep):
    payment_db = session.get(FeeObligation, payment.fee_id)
    if not payment_db:
        raise HTTPException(status_code=404, detail="Fee record not found")
    elif payment_db.fee_status == "paid":
        raise HTTPException(status_code=409, detail="Fee has already paid")
    if payment.amount <= 0:
        raise HTTPException(400, detail="The payment amount cannot be zero")
    existing_payments = session.exec(
        select(Payment).where(Payment.fee_id == payment.fee_id)
    ).all()
    already_paid = sum(p.amount for p in existing_payments)
    remaining_due = payment_db.fee_amount - already_paid
    if payment.amount > remaining_due:
        raise HTTPException(
            400,
            detail=f"payment of {payment.amount} exceeds remaining balance of {remaining_due}",
        )
    if (already_paid + payment.amount) >= payment_db.fee_amount:
        payment_db.fee_status = "paid"
    else:
        payment_db.fee_status = "pending"
    session.add(payment_db)
    session.add(payment)
    try:
        session.commit()
        session.refresh(payment)
        return payment
    except Exception:
        session.rollback()
        raise HTTPException(500, detail="Failed to pay fees due to database errors")


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
