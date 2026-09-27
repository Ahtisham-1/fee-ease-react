from dotenv import load_dotenv
from sqlmodel import create_engine, SQLModel, Session
from fastapi import Depends
from typing import Annotated
import os


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
