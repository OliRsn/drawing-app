from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON, Boolean
from sqlalchemy.orm import relationship
import datetime

from .database import Base

class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)

    students = relationship("Student", back_populates="classroom", cascade="all, delete-orphan")
    drawing_history = relationship("DrawingHistory", back_populates="classroom", cascade="all, delete-orphan")

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    weight = Column(Float, default=1.0)
    draw_count = Column(Integer, default=0)
    classroom_id = Column(Integer, ForeignKey("classrooms.id", ondelete="CASCADE"))

    classroom = relationship("Classroom", back_populates="students")

class DrawingHistory(Base):
    __tablename__ = "drawing_history"

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"))
    drawing_date = Column(DateTime, default=datetime.datetime.utcnow)
    drawn_students = Column(JSON)

    classroom = relationship("Classroom", back_populates="drawing_history")

class Setting(Base):
    __tablename__ = "settings"

    key = Column(String, primary_key=True, index=True)
    value = Column(String)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    is_admin = Column(Boolean, default=False)