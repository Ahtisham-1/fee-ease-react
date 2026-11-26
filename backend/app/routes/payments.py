from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select

from app.database import SessionDep
from app.models.fee import FeeObligation
from app.models.payment import Payment, PaymentCreate
from app.models.student import StudentBlueprint
from app.security import CurrentUser, get_current_user

router = APIRouter(
    prefix="/api/payments", tags=["Payments"], dependencies=[Depends(get_current_user)]
)


# Payment Endpoints
@router.post("/")
def assign_payments(
    payload: PaymentCreate, session: SessionDep, current_user: CurrentUser
):
    payment_db = session.get(FeeObligation, payload.fee_id)

    if not payment_db:
        raise HTTPException(status_code=404, detail="Fee record not found")
    elif payment_db.fee_status == "paid":
        raise HTTPException(status_code=409, detail="Fee has already paid")

    student = session.get(StudentBlueprint, payment_db.student_id)
    if not student:
        raise HTTPException(404, detail="Student was not found")
    if current_user.role == "parent" and current_user.parent_id != student.parent_id:
        raise HTTPException(403, detail="Forbidden")

    if payload.amount <= 0:
        raise HTTPException(400, detail="The payment amount cannot be zero")
    existing_payments = session.exec(
        select(Payment).where(Payment.fee_id == payload.fee_id)
    ).all()
    already_paid = sum(p.amount for p in existing_payments)
    remaining_due = payment_db.fee_amount - already_paid
    if payload.amount > remaining_due:
        raise HTTPException(
            400,
            detail=f"payment of {payload.amount} exceeds remaining balance of {remaining_due}",
        )
    if (already_paid + payload.amount) >= payment_db.fee_amount:
        payment_db.fee_status = "paid"
    else:
        payment_db.fee_status = "pending"
    payment = Payment(
        amount=payload.amount,
        date_time=payload.date_time,
        fee_id=payment_db.id,
        student_id=student.id,
        school_id=payment_db.school_id,
        status=payload.status,
    )
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
    session: SessionDep,
    current_user: CurrentUser,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=100),
):
    if current_user.role == "admin":
        offset = (page - 1) * limit
        statement = select(Payment).offset(offset).limit(limit)
        payment = session.exec(statement).all()
        return payment
    elif current_user.role == "parent":
        if not current_user.parent_id:
            return []
        current_user_payments = session.exec(
            select(Payment)
            .join(StudentBlueprint)
            .where(StudentBlueprint.parent_id == current_user.parent_id)
        ).all()
        return current_user_payments
    return []


@router.get("/student/{student_id}", response_model=list[Payment])
def read_student_payments(
    student_id: int, session: SessionDep, current_user: CurrentUser
):
    student = session.get(StudentBlueprint, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student Payment detail not found")
    if current_user.role == "parent" and current_user.parent_id != student.parent_id:
        raise HTTPException(status_code=403, detail="Forbidden you cannot access this ")
    payments = session.exec(
        select(Payment).where(Payment.student_id == student_id)
    ).all()
    return payments
