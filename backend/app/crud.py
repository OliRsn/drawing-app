from sqlalchemy.orm import Session
from typing import List

from . import models, schemas

# Classroom CRUD

def get_classroom(db: Session, classroom_id: int):
    return db.query(models.Classroom).filter(models.Classroom.id == classroom_id).first()

def list_classrooms(db: Session, skip: int = 0, limit: int = 100):
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

# Drawing History CRUD

def create_drawing_history(db: Session, classroom_id: int, drawn_students: List[schemas.Student]):
    """Creates a drawing history record. Does not commit."""
    drawn_students_data = [{'id': s.id, 'name': s.name} for s in drawn_students]
    db_drawing_history = models.DrawingHistory(
        classroom_id=classroom_id,
        drawn_students=drawn_students_data
    )
    db.add(db_drawing_history)
    # The service layer is responsible for the commit

def get_drawing_history_by_classroom(db: Session, classroom_id: int):
    return db.query(models.DrawingHistory).filter(models.DrawingHistory.classroom_id == classroom_id).order_by(models.DrawingHistory.drawing_date.desc()).all()

def delete_drawing_history_by_classroom(db: Session, classroom_id: int):
    """Deletes all drawing history for a classroom. Does not commit."""
    db.query(models.DrawingHistory).filter(models.DrawingHistory.classroom_id == classroom_id).delete(synchronize_session=False)
    # The service layer is responsible for the commit

# Student CRUD

def get_student(db: Session, student_id: int):
    return db.query(models.Student).filter(models.Student.id == student_id).first()

def get_students_by_ids(db: Session, student_ids: List[int]) -> List[models.Student]:
    return db.query(models.Student).filter(models.Student.id.in_(student_ids)).all()

def list_students(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Student).offset(skip).limit(limit).all()

def list_students_by_classroom(db: Session, classroom_id: int):
    return db.query(models.Student).filter(models.Student.classroom_id == classroom_id).all()

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

def create_user(db: Session, user: schemas.UserCreate, hashed_password: str):
    db_user = models.User(username=user.username, password_hash=hashed_password, is_admin=user.is_admin)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_password_hash(db: Session, user: models.User, new_password_hash: str):
    db_user = db.query(models.User).filter(models.User.id == user.id).first()
    if not db_user:
        return None

    db_user.password_hash = new_password_hash
    db.commit()
    db.refresh(db_user)
    return db_user