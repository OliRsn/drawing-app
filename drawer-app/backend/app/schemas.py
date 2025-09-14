from pydantic import BaseModel
from typing import List, Optional

class GradeBase(BaseModel):
    subject: str
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

class StudentCreate(StudentBase):
    pass

class Student(StudentBase):
    id: int
    classroom_id: int
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
