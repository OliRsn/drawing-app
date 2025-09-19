from sqlalchemy.orm import Session
import random
from typing import List, Optional

from . import models, schemas, drawing_logic

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


def reset_student_weights_in_classroom(db: Session, classroom_id: int):
    students = db.query(models.Student).filter(models.Student.classroom_id == classroom_id).all()
    for student in students:
        student.weight = 1.0
        student.draw_count = 0
    db.commit()
    return {"message": "Weights and draw counts reset successfully"}


# Student CRUD

def get_student(db: Session, student_id: int):
    return db.query(models.Student).filter(models.Student.id == student_id).first()

def get_students(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Student).offset(skip).limit(limit).all()



def get_students_with_probabilities_by_classroom(db: Session, classroom_id: int):
    students = db.query(models.Student).filter(models.Student.classroom_id == classroom_id).all()
    if not students:
        return []

    total_weight = sum([student.weight for student in students])
    if total_weight == 0:
        for student in students:
            student.probability = 1 / len(students)
    else:
        for student in students:
            student.probability = student.weight / total_weight

    return students

def get_drawn_students(db: Session, classroom_id: int, num_students: int, student_ids: Optional[List[int]] = None):
    query = db.query(models.Student).filter(models.Student.classroom_id == classroom_id)
    if student_ids:
        query = query.filter(models.Student.id.in_(student_ids))
    
    students = query.all()
    
    if not students:
        return []

    weights = [student.weight for student in students]
    total_weight = sum(weights)
    if total_weight == 0:
        probabilities = [1/len(students)] * len(students)
    else:
        probabilities = [w / total_weight for w in weights]

    drawn_students = random.choices(students, weights=probabilities, k=num_students)

    return drawn_students

def update_draw_count(db: Session, student_ids: List[int]):
    students = db.query(models.Student).filter(models.Student.id.in_(student_ids)).all()
    for student in students:
        student.draw_count += 1
    
    drawing_logic.adjust_weights(students)
    db.commit()

    return students

def create_student(db: Session, student: schemas.StudentCreate, classroom_id: int):
    db_student = models.Student(**student.dict(), classroom_id=classroom_id)
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

def update_student(db: Session, student_id: int, student: schemas.StudentCreate):
    db_student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if db_student:
        db_student.name = student.name
        db_student.weight = student.weight
        db_student.draw_count = student.draw_count
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
