from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select
from typing import Annotated
from app.database import SessionDep
from app.models.parent import ParentBlueprint, ParentUpdate


router = APIRouter(prefix="/api/parents", tags=["Parents"])


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
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
):
    parents = session.exec(select(ParentBlueprint)).all()
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
