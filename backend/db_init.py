from app.database import SessionLocal, engine, Base
from app import crud, schemas

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Create a classroom
    classroom = crud.create_classroom(db, classroom=schemas.ClassroomCreate(name="Classe A"))

    # Create 25 students
    student_names = [
        "Léa", "Hugo", "Maya", "Lucas", "Sara", "Noah", "Chloé", "Louis", "Jade", "Gabriel",
        "Emma", "Adam", "Lina", "Raphaël", "Alice", "Arthur", "Rose", "Jules", "Ambre", "Maël",
        "Louise", "Tom", "Anna", "Léo", "Zoé"
    ]

    students = []
    for name in student_names:
        student = crud.create_student(db, student=schemas.StudentCreate(name=name), classroom_id=classroom.id)
        students.append(student)



    # Create default settings
    crud.create_or_update_setting(db, setting=schemas.SettingCreate(key="numSlotMachines", value="4"))

    db.close()

if __name__ == "__main__":
    init_db()
