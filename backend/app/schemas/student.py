from pydantic import BaseModel
from typing import Optional


class StudentCreate(BaseModel):
    student_name: str
    parent_name: str
    phone: str
    grade: str
    tuition_fee: float
    has_transport: bool = False
    transport_fee: Optional[float] = 0.0


class StudentResponse(BaseModel):
    id: int
    student_name: str
    parent_name: str
    phone: str
    grade: str
    tuition_fee: float
    has_transport: bool
    transport_fee: float
    
    class Config:
        from_attributes = True
