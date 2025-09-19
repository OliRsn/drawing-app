from pydantic import BaseModel
from typing import List, Optional

class GradeBase(BaseModel):
    grade: float

class GradeCreate(GradeBase):
    pass

class Grade(GradeBase):
    id: int
    student_id: int

    class Config:
        from_attributes = True

class StudentBase(BaseModel):
    name: str
    weight: Optional[float] = 1.0
    draw_count: Optional[int] = 0

class StudentCreate(StudentBase):
    pass

class Student(StudentBase):
    id: int
    classroom_id: int
    weight: float
    draw_count: int
    probability: Optional[float] = None
    grades: List[Grade] = []

    class Config:
        from_attributes = True

class ClassroomBase(BaseModel):
    name: str

class ClassroomCreate(ClassroomBase):
    pass

class Classroom(ClassroomBase):
    id: int
    students: List[Student] = []

    class Config:
        from_attributes = True

class DrawCreate(BaseModel):
    num_students: int
    student_ids: Optional[List[int]] = None

class StudentIDs(BaseModel):
    student_ids: List[int]
