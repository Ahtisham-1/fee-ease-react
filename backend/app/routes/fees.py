from fastapi import APIRouter, HTTPException, Query, Depends
from sqlmodel import select
from typing import Annotated
from app.database import SessionDep
from app.models.fee import FeeObligation, AssignFeesPayload
from app.models.student import StudentBlueprint
from app.security import get_current_user, require_admin, CurrentUser

router = APIRouter(
    prefix="/api/fees", tags=["Fees"], dependencies=[Depends(get_current_user)]
)


# -------- FEE OBLIGATION END POINTS ----------
@router.post("/", response_model=FeeObligation, dependencies=[Depends(require_admin)])
def create_fees(createfeeobligation: FeeObligation, session: SessionDep):
    session.add(createfeeobligation)
    session.commit()
    session.refresh(createfeeobligation)
    return createfeeobligation


@router.get("/", response_model=list[FeeObligation])
def read_all_fees(
    session: SessionDep,
    current_user: CurrentUser,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=100),
):
    if current_user.role == "admin":
        offset = (page - 1) * limit
        statement = select(FeeObligation).offset(offset).limit(limit)
        feeobligation = session.exec(statement).all()
        return feeobligation
    elif current_user.role == "parent":
        if not current_user.parent_id:
            return []
        student_fees = session.exec(
            select(FeeObligation)
            .join(StudentBlueprint)
            .where(StudentBlueprint.parent_id == current_user.parent_id)
        ).all()
        return student_fees
    return []


@router.get("/{fees_id}", response_model=FeeObligation)
def read_one_fees(
    fees_id: int, session: SessionDep, current_user: CurrentUser
) -> FeeObligation:
    feeobligation = session.get(FeeObligation, fees_id)
    if not feeobligation:
        raise HTTPException(status_code=404, detail="Fees detail not found")
    student = session.get(StudentBlueprint, feeobligation.student_id)
    if not student:
        raise HTTPException(404, detail="Student record not found")
    if current_user.role == "parent" and current_user.parent_id != student.parent_id:
        raise HTTPException(status_code=403, detail="Forbidden details")
    return feeobligation


@router.patch(
    "/{fees_id}", response_model=FeeObligation, dependencies=[Depends(require_admin)]
)
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


@router.delete("/{fees_id}", dependencies=[Depends(require_admin)])
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
@router.post("/assign", dependencies=[Depends(require_admin)])
def assign_fees(payload: AssignFeesPayload, session: SessionDep):
    students = session.exec(
        select(StudentBlueprint).where(StudentBlueprint.grade == payload.target_class)
    ).all()
    if not students:
        raise HTTPException(status_code=404, detail="No students found in this class")
    for x in students:
        for existing_fees in x.feeobligation:
            if (
                existing_fees.month == payload.target_month
                and existing_fees.academic_year == payload.academic_year
            ):
                raise HTTPException(409, detail="Fees already assigned for this class")
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
    try:
        session.commit()
        return {"message": "Fees assigned successfully", "count": len(students)}
    except Exception:
        session.rollback()
        raise HTTPException(
            status_code=500, detail="Failed to assign fees due to a database error."
        )
