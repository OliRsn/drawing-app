import os
import csv
from collections import defaultdict

from app.database import SessionLocal, engine, Base
from app import crud, schemas, auth

def init_db():
    # Truncate all tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    data_dir = os.path.join(os.path.dirname(__file__), "../data/class_data")

    for filename in os.listdir(data_dir):
        if filename.endswith(".csv"):
            class_name = os.path.splitext(filename)[0]
            classroom = crud.create_classroom(db, classroom=schemas.ClassroomCreate(name=class_name))

            students_in_class = []
            with open(os.path.join(data_dir, filename), 'r', encoding='utf-8') as f:
                reader = csv.reader(f, delimiter=';')
                next(reader)  # Skip header
                for row in reader:
                    full_name = row[0]
                    # Split name, handling multi-word last names
                    parts = full_name.split()
                    if len(parts) >= 2:
                        first_name = parts[-1]
                        last_name = " ".join(parts[:-1])
                        students_in_class.append((first_name, last_name))

            # Handle duplicate first names
            first_name_counts = defaultdict(int)
            for first_name, _ in students_in_class:
                first_name_counts[first_name] += 1

            processed_students = {}
            for first_name, last_name in students_in_class:
                if first_name_counts[first_name] > 1:
                    student_name = f"{first_name} {last_name[0]}."
                else:
                    student_name = first_name
                
                if student_name not in processed_students:
                     crud.create_student(db, student=schemas.StudentCreate(name=student_name), classroom_id=classroom.id)
                     processed_students[student_name] = True

    # Create default settings if they don't exist
    crud.create_or_update_setting(db, setting=schemas.SettingCreate(key="numSlotMachines", value="4"))

    # Create a default admin user if it doesn't exist
    user = crud.get_user_by_username(db, username="admin")
    if not user:
        user_in = schemas.UserCreate(username="admin", password="admin", is_admin=True)
        hashed_password = auth.get_password_hash(user_in.password)
        crud.create_user(db, user=user_in, hashed_password=hashed_password)

    db.close()

if __name__ == "__main__":
    init_db()