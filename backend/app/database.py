import os
from typing import Annotated

from dotenv import load_dotenv
from fastapi import Depends
from sqlmodel import Session, SQLModel, create_engine

# The PostgreSQL connection String
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")


# Creating the Engine
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set in .env file")
engine = create_engine(DATABASE_URL, echo=True)


# Creating Tables on Startup
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


# The Session: Your Request Workspace
def get_session():
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]
