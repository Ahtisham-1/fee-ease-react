from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import create_db_and_tables
from app.routes import parents, students, fees, payments


app = FastAPI()

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


@app.get("/")
def read_root():
    return {"message": "Clean start successful!"}


# Create Database Tables on Startup
@app.on_event("startup")
def on_startup():
    create_db_and_tables()


app.include_router(parents.router)
app.include_router(students.router)
app.include_router(fees.router)
app.include_router(payments.router)
