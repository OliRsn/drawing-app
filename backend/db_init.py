from app.database import SessionLocal
from app import crud, schemas

def init_db():
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

    # Create 5 grades for 5 different students
    for i in range(5):
        crud.create_student_grade(db, grade=schemas.GradeCreate(grade=10 + i), student_id=students[i].id)

    db.close()

if __name__ == "__main__":
    init_db()
