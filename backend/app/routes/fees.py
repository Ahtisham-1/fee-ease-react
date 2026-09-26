from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select
from typing import Annotated
from app.database import SessionDep
from app.models.fee import FeeObligation, AssignFeesPayload
from app.models.student import StudentBlueprint

router = APIRouter(prefix="/api/fees", tags=["Fees"])


# -------- FEE OBLIGATION END POINTS ----------
@router.post("/", response_model=FeeObligation)
def create_fees(createfeeobligation: FeeObligation, session: SessionDep):
    session.add(createfeeobligation)
    session.commit()
    session.refresh(createfeeobligation)
    return createfeeobligation


@router.get("/", response_model=list[FeeObligation])
def read_all_fees(
    session: SessionDep,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
):
    feeobligation = session.exec(select(FeeObligation)).all()
    return feeobligation


@router.get("/{fees_id}", response_model=FeeObligation)
def read_one_fees(fees_id: int, session: SessionDep) -> FeeObligation:
    feeobligation = session.get(FeeObligation, fees_id)
    if not feeobligation:
        raise HTTPException(status_code=404, detail="Fees detail not found")
    return feeobligation


@router.patch("/{fees_id}", response_model=FeeObligation)
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


@router.delete("/{fees_id}")
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
@router.post("/assign")
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
