from typing import List
from . import models

def adjust_weights(students: List[models.Student]):
    """
    Adjusts the weights of students based on their draw count.
    The more a student has been drawn, the less likely they are to be drawn again.
    """
    for student in students:
        student.weight = 1 / (student.draw_count + 1)
