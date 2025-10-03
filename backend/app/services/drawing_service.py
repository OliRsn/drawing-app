from sqlalchemy.orm import Session
import random
from typing import List, Optional

from fastapi import HTTPException, status

from .. import crud, models, schemas


def adjust_weights(students: List[models.Student]):
    """
    Adjusts the weights of students based on their draw count.
    The more a student has been drawn, the less likely they are to be drawn again.
    """
    for student in students:
        student.weight = 1 / (student.draw_count + 1) ** 2


def _calculate_probabilities(students: List[models.Student]) -> List[models.Student]:
    """Helper to calculate drawing probabilities for a list of students."""
    if not students:
        return []

    total_weight = sum(student.weight for student in students)
    if total_weight == 0:
        # If all weights are zero, assign uniform probability
        prob = 1 / len(students)
        for student in students:
            student.probability = prob
    else:
        for student in students:
            student.probability = student.weight / total_weight
    return students


def list_students_with_probabilities(db: Session, classroom_id: int) -> List[models.Student]:
    """
    Gets all students for a classroom and calculates their drawing probability.
    """
    students = crud.list_students_by_classroom(db, classroom_id=classroom_id)
    return _calculate_probabilities(students)


def draw_students(db: Session, classroom_id: int, num_students: int, student_ids: Optional[List[int]] = None) -> List[models.Student]:
    """
    Performs a weighted random draw of students from a classroom.
    Validates that the provided student_ids belong to the classroom.
    """
    classroom_students = crud.list_students_by_classroom(db, classroom_id=classroom_id)
    classroom_student_ids = {s.id for s in classroom_students}

    if student_ids:
        # Validate that all provided student_ids are valid for this classroom
        if not set(student_ids).issubset(classroom_student_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more selected students do not belong to this classroom."
            )
        # Filter the list to only the students who are eligible for the draw
        students_to_draw_from = [s for s in classroom_students if s.id in student_ids]
    else:
        students_to_draw_from = classroom_students

    if not students_to_draw_from:
        return []

    num_to_draw = min(num_students, len(students_to_draw_from))
    weights = [s.weight for s in students_to_draw_from]
    
    # Perform weighted sample without replacement
    drawn_students = []
    # Create a temporary list of students and weights to modify during selection
    temp_students = list(students_to_draw_from)
    
    while len(drawn_students) < num_to_draw and temp_students:
        total_weight = sum(w for s, w in zip(temp_students, weights) if s not in drawn_students)

        if total_weight == 0:
            # If all remaining weights are zero, choose uniformly from remaining students
            eligible = [s for s in temp_students if s not in drawn_students]
            if not eligible:
                break
            chosen = random.choice(eligible)
        else:
            # Recalculate probabilities for the remaining students
            remaining_weights = [w if s not in drawn_students else 0 for s, w in zip(temp_students, weights)]
            chosen = random.choices(temp_students, weights=remaining_weights, k=1)[0]

        drawn_students.append(chosen)
        # To prevent a student from being chosen again, we can remove them,
        # but it's safer to just handle it in the weight calculation above.
        # To be absolutely sure, find the index and set weight to 0 for next iteration.
        try:
            chosen_index = temp_students.index(chosen)
            weights[chosen_index] = 0
        except ValueError:
            # Should not happen
            break

    return drawn_students


def confirm_draw(db: Session, classroom_id: int, student_ids: List[int]) -> List[models.Student]:
    """
    Confirms a draw by updating draw counts for selected students,
    adjusting their weights, and creating a history record.
    This is an atomic transaction.
    """
    if not student_ids:
        return []
        
    try:
        students_to_update = crud.get_students_by_ids(db, student_ids=student_ids)
        
        if len(students_to_update) != len(student_ids):
            raise HTTPException(status_code=404, detail="One or more students not found.")

        for student in students_to_update:
            student.draw_count += 1
        
        adjust_weights(students_to_update)
        
        crud.create_drawing_history(db=db, classroom_id=classroom_id, drawn_students=students_to_update)
        
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
        
    return students_to_update


def reset_classroom(db: Session, classroom_id: int):
    """
    Resets all student weights and draw counts, and deletes the drawing history
    for a given classroom in a single transaction.
    """
    try:
        students = crud.list_students_by_classroom(db, classroom_id=classroom_id)
        for student in students:
            student.weight = 1.0
            student.draw_count = 0
        
        crud.delete_drawing_history_by_classroom(db, classroom_id=classroom_id)
        
        db.commit()
    except Exception as e:
        db.rollback()
        raise e