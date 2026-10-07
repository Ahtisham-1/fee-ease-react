from fastapi import APIRouter, HTTPException, Query, Depends
from sqlmodel import select, col
from typing import Annotated
from app.database import SessionDep
from app.models.parent import ParentBlueprint, ParentUpdate
from app.security import get_current_user, CurrentUser, require_admin

router = APIRouter(
    prefix="/api/parents", tags=["Parents"], dependencies=[Depends(require_admin)]
)


# ------------ PARENT ENDPOINTS -----------
@router.post("/", response_model=ParentBlueprint)
def create_parent(parent: ParentBlueprint, session: SessionDep):

    existing_parent = session.exec(
        select(ParentBlueprint).where(ParentBlueprint.phone == parent.phone)
    ).first()
    if existing_parent:
        return existing_parent
    else:
        session.add(parent)
        session.commit()
        session.refresh(parent)
        return parent


@router.get("/", response_model=list[ParentBlueprint])
def read_all_parents(
    session: SessionDep,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=100),
    search: str | None = Query(default=None),
):
    statement = select(ParentBlueprint)
    if search:
        statement = statement.where(
            col(ParentBlueprint.name).ilike(f"%{search}%")
            | col(ParentBlueprint.phone).ilike(f"%{search}%")
        )
    offset = (page - 1) * limit
    statement = statement.offset(offset).limit(limit)
    parents = session.exec(statement).all()
    return parents


@router.get("/{parent_id}", response_model=ParentBlueprint)
def read_one_parent(parent_id: int, session: SessionDep) -> ParentBlueprint:
    parent = session.get(ParentBlueprint, parent_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")
    return parent


@router.delete("/{parent_id}")
def delete_parent(parent_id: int, session: SessionDep):
    parent = session.get(ParentBlueprint, parent_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found to be deleted")
    if parent.students:
        raise HTTPException(
            status_code=409, detail="Cannot delete parent. Remove their students first."
        )
    session.delete(parent)
    session.commit()
    return {"Ok": True}


@router.patch("/{parent_id}", response_model=ParentBlueprint)
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
