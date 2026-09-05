from fastapi import FastAPI, Depends, HTTPException, Query
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import create_engine, SQLModel, Field, Session, select
from typing import Annotated


app = FastAPI()

# The PostgreSQL connection String
DATABASE_URL = "postgresql://postgres:password@localhost:5432/feeease_db"

# Creating the Engine
engine = create_engine(DATABASE_URL, echo=True)


origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class StudentBlueprint(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    student_name: str
    parent_name: str
    phone: str
    grade: str
    tuition_fee: int
    has_transport: bool = False
    transport_fee: int = 0


@app.get("/")
def read_root():
    return {"message": "Clean start successful!"}


# Creating Tables on Startup
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

    # The Session: Your Request Workspace


def get_session():
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]


# Create Database Tables on Startup
@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.post("/api/students", response_model=StudentBlueprint)
def create_student(student: StudentBlueprint, session: SessionDep):
    # Put it in the cart
    session.add(student)

    # Hit "save"
    session.commit()

    # Get the new id from PostgreSQL
    session.refresh(student)

    # Send it back to the frontend
    return student


@app.get("/api/students", response_model=list[StudentBlueprint])
def read_students(
    session: SessionDep,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
):
    students = session.exec(select(StudentBlueprint)).all()
    return students


@app.get("/api/students/{student_id}", response_model=StudentBlueprint)
def read_one_student(student_id: int, session: SessionDep) -> StudentBlueprint:
    student = session.get(StudentBlueprint, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@app.delete("/api/students/{student_id}")
def delete_item(student_id: int, session: SessionDep):
    student = session.get(StudentBlueprint, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Item not found to be deleted")
    session.delete(student)
    session.commit()
    return {"Ok": True}
