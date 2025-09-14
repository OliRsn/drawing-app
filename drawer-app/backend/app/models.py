from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship

from .database import Base

class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)

    students = relationship("Student", back_populates="classroom")

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"))

    classroom = relationship("Classroom", back_populates="students")
    grades = relationship("Grade", back_populates="student")

class Grade(Base):
    __tablename__ = "grades"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String, index=True)
    grade = Column(Float)
    student_id = Column(Integer, ForeignKey("students.id"))

    student = relationship("Student", back_populates="grades")