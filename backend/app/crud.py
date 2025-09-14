from sqlalchemy.orm import Session

from . import models, schemas

# Classroom CRUD

def get_classroom(db: Session, classroom_id: int):
    return db.query(models.Classroom).filter(models.Classroom.id == classroom_id).first()

def get_classrooms(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Classroom).offset(skip).limit(limit).all()

def create_classroom(db: Session, classroom: schemas.ClassroomCreate):
    db_classroom = models.Classroom(name=classroom.name)
    db.add(db_classroom)
    db.commit()
    db.refresh(db_classroom)
    return db_classroom

def delete_classroom(db: Session, classroom_id: int):
    db_classroom = db.query(models.Classroom).filter(models.Classroom.id == classroom_id).first()
    if db_classroom:
        db.delete(db_classroom)
        db.commit()
    return db_classroom

# Student CRUD

def get_student(db: Session, student_id: int):
    return db.query(models.Student).filter(models.Student.id == student_id).first()

def get_students(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Student).offset(skip).limit(limit).all()

def create_student(db: Session, student: schemas.StudentCreate, classroom_id: int):
    db_student = models.Student(**student.dict(), classroom_id=classroom_id)
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

def delete_student(db: Session, student_id: int):
    db_student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if db_student:
        db.delete(db_student)
        db.commit()
    return db_student

# Grade CRUD

def create_student_grade(db: Session, grade: schemas.GradeCreate, student_id: int):
    db_grade = models.Grade(**grade.dict(), student_id=student_id)
    db.add(db_grade)
    db.commit()
    db.refresh(db_grade)
    return db_grade

def delete_grade(db: Session, grade_id: int):
    db_grade = db.query(models.Grade).filter(models.Grade.id == grade_id).first()
    if db_grade:
        db.delete(db_grade)
        db.commit()
    return db_grade
