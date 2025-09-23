from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware

from . import crud, models, schemas
from .database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(root_path="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


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


@app.post("/classrooms/{classroom_id}/reset-weights")
def reset_weights(classroom_id: int, db: Session = Depends(get_db)):
    return crud.reset_student_weights_in_classroom(db=db, classroom_id=classroom_id)


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


@app.put("/students/{student_id}", response_model=schemas.Student)
def update_student(
    student_id: int, student: schemas.StudentCreate, db: Session = Depends(get_db)
):
    db_student = crud.update_student(db, student_id=student_id, student=student)
    if db_student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return db_student


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
    drawn_students = crud.get_drawn_students(
        db=db,
        classroom_id=classroom_id,
        num_students=draw_input.num_students,
        student_ids=draw_input.student_ids
    )
    crud.create_drawing_history(db=db, classroom_id=classroom_id, drawn_students=drawn_students)
    return drawn_students

@app.get("/classrooms/{classroom_id}/drawing-history", response_model=list[schemas.DrawingHistory])
def read_drawing_history(classroom_id: int, db: Session = Depends(get_db)):
    return crud.get_drawing_history_by_classroom(db, classroom_id=classroom_id)

@app.post("/students/draw_count", response_model=list[schemas.Student])
def update_draw_count(
    student_ids: schemas.StudentIDs,
    db: Session = Depends(get_db)
):
    return crud.update_draw_count(db=db, student_ids=student_ids.student_ids)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/settings/{key}", response_model=schemas.Setting)
def read_setting(key: str, db: Session = Depends(get_db)):
    db_setting = crud.get_setting(db, key=key)
    if db_setting is None:
        raise HTTPException(status_code=404, detail="Setting not found")
    return db_setting


@app.put("/settings/", response_model=schemas.Setting)
def create_or_update_setting(setting: schemas.SettingCreate, db: Session = Depends(get_db)):
    return crud.create_or_update_setting(db=db, setting=setting)
