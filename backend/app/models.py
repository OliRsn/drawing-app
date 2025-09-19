from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship

from .database import Base

class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)

    students = relationship("Student", back_populates="classroom", cascade="all, delete-orphan")

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    weight = Column(Float, default=1.0)
    draw_count = Column(Integer, default=0)
    classroom_id = Column(Integer, ForeignKey("classrooms.id", ondelete="CASCADE"))

    classroom = relationship("Classroom", back_populates="students")
    grades = relationship("Grade", back_populates="student", cascade="all, delete-orphan")

class Grade(Base):
    __tablename__ = "grades"

    id = Column(Integer, primary_key=True, index=True)
    grade = Column(Float)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"))

    student = relationship("Student", back_populates="grades")