from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from . import crud, models, schemas
from .database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI()


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/classrooms/", response_model=schemas.Classroom)
def create_classroom(classroom: schemas.ClassroomCreate, db: Session = Depends(get_db)):
    return crud.create_classroom(db=db, classroom=classroom)


@app.get("/classrooms/", response_model=list[schemas.Classroom])
def read_classrooms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    classrooms = crud.get_classrooms(db, skip=skip, limit=limit)
    return classrooms


@app.get("/classrooms/{classroom_id}", response_model=schemas.Classroom)
def read_classroom(classroom_id: int, db: Session = Depends(get_db)):
    db_classroom = crud.get_classroom(db, classroom_id=classroom_id)
    if db_classroom is None:
        raise HTTPException(status_code=404, detail="Classroom not found")
    return db_classroom


@app.delete("/classrooms/{classroom_id}", response_model=schemas.Classroom)
def delete_classroom(classroom_id: int, db: Session = Depends(get_db)):
    db_classroom = crud.delete_classroom(db, classroom_id=classroom_id)
    if db_classroom is None:
        raise HTTPException(status_code=404, detail="Classroom not found")
    return db_classroom


@app.post("/classrooms/{classroom_id}/students/", response_model=schemas.Student)
def create_student_for_classroom(
    classroom_id: int, student: schemas.StudentCreate, db: Session = Depends(get_db)
):
    return crud.create_student(db=db, student=student, classroom_id=classroom_id)


@app.get("/students/", response_model=list[schemas.Student])
def read_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    students = crud.get_students(db, skip=skip, limit=limit)
    return students


@app.delete("/students/{student_id}", response_model=schemas.Student)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    db_student = crud.delete_student(db, student_id=student_id)
    if db_student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return db_student


@app.post("/students/{student_id}/grades/", response_model=schemas.Grade)
def create_grade_for_student(
    student_id: int, grade: schemas.GradeCreate, db: Session = Depends(get_db)
):
    return crud.create_student_grade(db=db, grade=grade, student_id=student_id)


@app.delete("/grades/{grade_id}", response_model=schemas.Grade)
def delete_grade(grade_id: int, db: Session = Depends(get_db)):
    db_grade = crud.delete_grade(db, grade_id=grade_id)
    if db_grade is None:
        raise HTTPException(status_code=404, detail="Grade not found")
    return db_grade


@app.get("/classrooms/{classroom_id}/students/probabilities", response_model=list[schemas.Student])
def read_student_probabilities(classroom_id: int, db: Session = Depends(get_db)):
    students = crud.get_students_with_probabilities_by_classroom(db, classroom_id=classroom_id)
    return students

@app.post("/classrooms/{classroom_id}/draw", response_model=list[schemas.Student])
def draw_students_for_classroom(
    classroom_id: int,
    draw_input: schemas.DrawCreate,
    db: Session = Depends(get_db)
):
    return crud.get_drawn_students(
        db=db,
        classroom_id=classroom_id,
        num_students=draw_input.num_students,
        student_ids=draw_input.student_ids
    )

@app.post("/students/draw_count", response_model=list[schemas.Student])
def update_draw_count(
    student_ids: schemas.StudentIDs,
    db: Session = Depends(get_db)
):
    return crud.update_draw_count(db=db, student_ids=student_ids.student_ids)


@app.get("/health")
def health_check():
    return {"status": "ok"}
