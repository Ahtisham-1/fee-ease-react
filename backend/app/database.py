from sqlmodel import create_engine, SQLModel, Session
from fastapi import Depends
from typing import Annotated

# The PostgreSQL connection String
DATABASE_URL = "postgresql://postgres:password@localhost:5432/feeease_db"

# Creating the Engine
engine = create_engine(DATABASE_URL, echo=True)


# Creating Tables on Startup
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


# The Session: Your Request Workspace
def get_session():
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]
