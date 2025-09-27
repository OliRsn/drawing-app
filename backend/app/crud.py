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
    
    # Delete drawing history for the classroom
    db.query(models.DrawingHistory).filter(models.DrawingHistory.classroom_id == classroom_id).delete()

    db.commit()
    return {"message": "Weights, draw counts, and drawing history reset successfully"}


# Drawing History CRUD

def create_drawing_history(db: Session, classroom_id: int, drawn_students: List[schemas.Student]):
    drawn_students_data = [{'id': s.id, 'name': s.name} for s in drawn_students]
    db_drawing_history = models.DrawingHistory(
        classroom_id=classroom_id,
        drawn_students=drawn_students_data
    )
    db.add(db_drawing_history)
    db.commit()
    db.refresh(db_drawing_history)
    return db_drawing_history

def get_drawing_history_by_classroom(db: Session, classroom_id: int):
    return db.query(models.DrawingHistory).filter(models.DrawingHistory.classroom_id == classroom_id).order_by(models.DrawingHistory.drawing_date.desc()).all()


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

    # Ensure num_students is not greater than the number of available students
    k = min(num_students, len(students))

    weights = [student.weight for student in students]
    
    # Weighted sample without replacement
    drawn_students = []
    while len(drawn_students) < k:
        total_weight = sum(weights)
        if total_weight == 0:
            # If all remaining weights are zero, choose uniformly
            remaining_students = [s for s in students if s not in drawn_students]
            if not remaining_students:
                break
            chosen = random.choice(remaining_students)
        else:
            probabilities = [w / total_weight for w in weights]
            chosen = random.choices(students, weights=probabilities, k=1)[0]

        drawn_students.append(chosen)
        chosen_index = students.index(chosen)
        weights[chosen_index] = 0 # Ensure it's not picked again

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

# Settings CRUD

def get_setting(db: Session, key: str):
    return db.query(models.Setting).filter(models.Setting.key == key).first()

def create_or_update_setting(db: Session, setting: schemas.SettingCreate):
    db_setting = get_setting(db, key=setting.key)
    if db_setting:
        db_setting.value = setting.value
    else:
        db_setting = models.Setting(key=setting.key, value=setting.value)
        db.add(db_setting)
    db.commit()
    db.refresh(db_setting)
    return db_setting

# User CRUD

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    from .auth import get_password_hash
    hashed_password = get_password_hash(user.password)
    db_user = models.User(username=user.username, password_hash=hashed_password, is_admin=user.is_admin)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_password(db: Session, user: models.User, current_password: str, new_password: str):
    from .auth import verify_password, get_password_hash

    db_user = db.query(models.User).filter(models.User.id == user.id).first()
    if not db_user:
        return None

    if not verify_password(current_password, db_user.password_hash):
        return None
        
    hashed_password = get_password_hash(new_password)
    db_user.password_hash = hashed_password
    db.commit()
    db.refresh(db_user)
    return db_user
