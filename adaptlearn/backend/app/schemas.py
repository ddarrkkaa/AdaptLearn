from datetime import datetime
from typing import Any
from pydantic import BaseModel
from app.models import RoleEnum, PaceEnum, EventTypeEnum


class StudentCreate(BaseModel):
    class_id: int
    role: RoleEnum = RoleEnum.student


class StudentOut(BaseModel):
    id: int
    class_id: int
    role: RoleEnum
    created_at: datetime

    model_config = {"from_attributes": True}


class CognitiveProfileOut(BaseModel):
    id: int
    student_id: int
    knowledge_level: float
    engagement_score: float
    learning_pace: PaceEnum
    typical_errors: list
    interests: list
    last_updated: datetime

    model_config = {"from_attributes": True}


class LessonCreate(BaseModel):
    class_id: int
    subject: str
    topic: str | None = None


class LessonOut(BaseModel):
    id: int
    class_id: int
    subject: str
    topic: str | None = None
    date: datetime
    transcript: str | None
    key_terms: list
    is_active: bool
    video_path: str | None = None
    vtt_subtitles: str | None = None
    student_access: bool = False
    ai_analysis: dict | None = None
    avg_engagement: float | None = None
    avg_fatigue: float | None = None
    answers_given: int = 0
    answers_total: int = 0

    model_config = {"from_attributes": True}


class LessonTranscriptUpdate(BaseModel):
    transcript: str


class LessonAnalysisUpdate(BaseModel):
    ai_analysis: dict


class LessonAccessUpdate(BaseModel):
    student_access: bool


class TestOut(BaseModel):
    id: int
    lesson_id: int
    questions: list
    created_at: datetime

    model_config = {"from_attributes": True}


class TestResultCreate(BaseModel):
    student_id: int
    test_id: int
    answers: dict[str, Any]
    score: float
    errors: list = []


class TestResultOut(BaseModel):
    id: int
    student_id: int
    test_id: int
    answers: dict[str, Any]
    score: float
    errors: list
    completed_at: datetime

    model_config = {"from_attributes": True}


class TrajectoryOut(BaseModel):
    id: int
    student_id: int
    topics: list
    updated_at: datetime

    model_config = {"from_attributes": True}


class RobotEventCreate(BaseModel):
    session_id: int
    type: EventTypeEnum
    payload: dict[str, Any]


class RobotEventOut(BaseModel):
    id: int
    session_id: int
    type: EventTypeEnum
    payload: dict[str, Any]
    timestamp: datetime

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str
    role: RoleEnum
    class_id: int | None = None
    subject: str | None = None
    homeroom: bool = False


class CognitiveProfilePatch(BaseModel):
    interests: list | None = None
    knowledge_level: float | None = None
    engagement_score: float | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str
    user_id: int
    student_id: int | None = None
    class_id: int | None = None
    subject: str | None = None
    approved: bool = False


class UserOut(BaseModel):
    id: int
    username: str
    full_name: str
    role: RoleEnum
    subject: str | None
    class_id: int | None
    student_id: int | None
    approved: bool = False

    model_config = {"from_attributes": True}


class SubjectOut(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}


class SchoolClassOut(BaseModel):
    id: int
    name: str
    grade: int
    model_config = {"from_attributes": True}


class AdminApproveUser(BaseModel):
    class_id: int | None = None
    subject: str | None = None
