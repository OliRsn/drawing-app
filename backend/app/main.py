from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta

from . import crud, models, schemas, auth
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

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth.get_user(db, username=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user


@app.post("/classrooms/", response_model=schemas.Classroom)
def create_classroom(classroom: schemas.ClassroomCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    return crud.create_classroom(db=db, classroom=classroom)


@app.get("/classrooms/", response_model=list[schemas.Classroom])
def read_classrooms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    classrooms = crud.get_classrooms(db, skip=skip, limit=limit)
    return classrooms


@app.get("/classrooms/{classroom_id}", response_model=schemas.Classroom)
def read_classroom(classroom_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    db_classroom = crud.get_classroom(db, classroom_id=classroom_id)
    if db_classroom is None:
        raise HTTPException(status_code=404, detail="Classroom not found")
    return db_classroom


@app.delete("/classrooms/{classroom_id}", response_model=schemas.Classroom)
def delete_classroom(classroom_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    db_classroom = crud.delete_classroom(db, classroom_id=classroom_id)
    if db_classroom is None:
        raise HTTPException(status_code=404, detail="Classroom not found")
    return db_classroom


@app.post("/classrooms/{classroom_id}/reset-weights")
def reset_weights(classroom_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    return crud.reset_student_weights_in_classroom(db=db, classroom_id=classroom_id)


@app.post("/classrooms/{classroom_id}/students/", response_model=schemas.Student)
def create_student_for_classroom(
    classroom_id: int, student: schemas.StudentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)
):
    return crud.create_student(db=db, student=student, classroom_id=classroom_id)





@app.get("/students/", response_model=list[schemas.Student])
def read_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    students = crud.get_students(db, skip=skip, limit=limit)
    return students


@app.delete("/students/{student_id}", response_model=schemas.Student)
def delete_student(student_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    db_student = crud.delete_student(db, student_id=student_id)
    if db_student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return db_student


@app.put("/students/{student_id}", response_model=schemas.Student)
def update_student(
    student_id: int, student: schemas.StudentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)
):
    db_student = crud.update_student(db, student_id=student_id, student=student)
    if db_student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return db_student


@app.get("/classrooms/{classroom_id}/students/probabilities", response_model=list[schemas.Student])
def read_student_probabilities(classroom_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    students = crud.get_students_with_probabilities_by_classroom(db, classroom_id=classroom_id)
    return students

@app.post("/classrooms/{classroom_id}/draw", response_model=list[schemas.Student])
def draw_students_for_classroom(
    classroom_id: int,
    draw_input: schemas.DrawCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    drawn_students = crud.get_drawn_students(
        db=db,
        classroom_id=classroom_id,
        num_students=draw_input.num_students,
        student_ids=draw_input.student_ids
    )
    return drawn_students

@app.get("/classrooms/{classroom_id}/drawing-history", response_model=list[schemas.DrawingHistory])
def read_drawing_history(classroom_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    return crud.get_drawing_history_by_classroom(db, classroom_id=classroom_id)

@app.post("/classrooms/{classroom_id}/confirm_draw", response_model=list[schemas.Student])
def confirm_draw(
    classroom_id: int,
    student_ids: schemas.StudentIDs,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    students = crud.update_draw_count(db=db, student_ids=student_ids.student_ids)
    if students:
        crud.create_drawing_history(db=db, classroom_id=classroom_id, drawn_students=students)
    return students


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/settings/{key}", response_model=schemas.Setting)
def read_setting(key: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    db_setting = crud.get_setting(db, key=key)
    if db_setting is None:
        raise HTTPException(status_code=404, detail="Setting not found")
    return db_setting


@app.put("/settings/", response_model=schemas.Setting)
def create_or_update_setting(setting: schemas.SettingCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    return crud.create_or_update_setting(db=db, setting=setting)
