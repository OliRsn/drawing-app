from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class StudentBase(BaseModel):
    name: str
    weight: Optional[float] = 1.0
    draw_count: Optional[int] = 0

class StudentCreate(StudentBase):
    pass

class Student(StudentBase):
    id: int
    classroom_id: int
    weight: float
    draw_count: int
    probability: Optional[float] = None

    class Config:
        from_attributes = True

class ClassroomBase(BaseModel):
    name: str

class ClassroomCreate(ClassroomBase):
    pass

class Classroom(ClassroomBase):
    id: int
    students: List[Student] = []

    class Config:
        from_attributes = True

class DrawCreate(BaseModel):
    num_students: int
    student_ids: Optional[List[int]] = None

class StudentIDs(BaseModel):
    student_ids: List[int]

class SettingBase(BaseModel):
    key: str
    value: str

class SettingCreate(SettingBase):
    pass

class Setting(SettingBase):
    class Config:
        from_attributes = True

class DrawingHistoryBase(BaseModel):
    drawn_students: List[dict]

class DrawingHistoryCreate(DrawingHistoryBase):
    pass

class DrawingHistory(DrawingHistoryBase):
    id: int
    classroom_id: int
    drawing_date: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat() + "Z"
        }

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str
    is_admin: bool = False

class User(UserBase):
    id: int
    is_admin: bool

    class Config:
        from_attributes = True

class UserInDB(User):
    password_hash: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str
