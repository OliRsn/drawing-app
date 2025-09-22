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

class Setting(Base):
    __tablename__ = "settings"

    key = Column(String, primary_key=True, index=True)
    value = Column(String)