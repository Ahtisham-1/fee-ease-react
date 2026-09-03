from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from app.schemas.student import StudentCreate, StudentResponse

from app.core.database import get_db_connection, init_db


app = FastAPI(title="FeeEase API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.post(
    "/api/students", response_model=StudentResponse, status_code=status.HTTP_201_CREATED
)
def create_student(student: StudentCreate):
    try:
        query = """INSERT INTO students (student_name, parent_name, phone, grade, tuition_fee, has_transport, transport_fee)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING id, student_name, parent_name, phone, grade, tuition_fee, has_transport, transport_fee;"""

        data = (
            student.student_name,
            student.parent_name,
            student.phone,
            student.grade,
            student.tuition_fee,
            student.has_transport,
            student.transport_fee,
        )

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(query, data)
        new_student = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        return new_student
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/students", response_model=list[StudentResponse])
def get_all_students():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "SELECT id, student_name, parent_name, phone, grade, tuition_fee, has_transport, transport_fee FROM students ORDER BY id ASC;"
        cursor.execute(query)
        students = cursor.fetchall()
        cursor.close()
        conn.close()
        return students
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
