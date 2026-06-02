import enum
from datetime import datetime
from sqlalchemy import (
    String, Float, Boolean, Text, Integer, ForeignKey,
    Enum as SAEnum, DateTime, func, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class RoleEnum(str, enum.Enum):
    student = "student"
    teacher = "teacher"
    admin   = "admin"


class PaceEnum(str, enum.Enum):
    slow   = "slow"
    medium = "medium"
    fast   = "fast"


class EventTypeEnum(str, enum.Enum):
    video   = "video"
    audio   = "audio"
    thermal = "thermal"


class SchoolClass(Base):
    __tablename__ = "school_classes"

    id:    Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name:  Mapped[str] = mapped_column(String(20), unique=True, nullable=False)  
    grade: Mapped[int] = mapped_column(Integer, nullable=False)                   


class Subject(Base):
    __tablename__ = "subjects"

    id:   Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)


class Student(Base):
    __tablename__ = "students"

    id:         Mapped[int]       = mapped_column(Integer, primary_key=True, index=True)
    class_id:   Mapped[int]       = mapped_column(Integer, nullable=False)
    role:       Mapped[RoleEnum]  = mapped_column(SAEnum(RoleEnum), default=RoleEnum.student)
    created_at: Mapped[datetime]  = mapped_column(DateTime(timezone=True), server_default=func.now())

    profile:      Mapped["CognitiveProfile"] = relationship(back_populates="student", uselist=False)
    test_results: Mapped[list["TestResult"]] = relationship(back_populates="student")
    trajectory:   Mapped["Trajectory"]       = relationship(back_populates="student", uselist=False)


class CognitiveProfile(Base):
    __tablename__ = "cognitive_profiles"

    id:               Mapped[int]       = mapped_column(Integer, primary_key=True, index=True)
    student_id:       Mapped[int]       = mapped_column(ForeignKey("students.id"), nullable=False, unique=True)
    knowledge_level:  Mapped[float]     = mapped_column(Float, default=50.0)
    engagement_score: Mapped[float]     = mapped_column(Float, default=50.0)
    learning_pace:    Mapped[PaceEnum]  = mapped_column(SAEnum(PaceEnum), default=PaceEnum.medium)
    typical_errors:   Mapped[list]      = mapped_column(JSONB, default=list)
    interests:        Mapped[list]      = mapped_column(JSONB, default=list)

    skills:           Mapped[dict]      = mapped_column(JSONB, default=dict)
    last_updated:     Mapped[datetime]  = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    student: Mapped["Student"] = relationship(back_populates="profile")


class LessonSession(Base):
    __tablename__ = "lesson_sessions"

    id:             Mapped[int]      = mapped_column(Integer, primary_key=True, index=True)
    class_id:       Mapped[int]      = mapped_column(Integer, nullable=False)
    subject:        Mapped[str]      = mapped_column(String(255), nullable=False)
    topic:          Mapped[str|None] = mapped_column(String(512), nullable=True)
    date:           Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    transcript:     Mapped[str|None] = mapped_column(Text, nullable=True)
    key_terms:      Mapped[list]     = mapped_column(JSONB, default=list)
    is_active:      Mapped[bool]     = mapped_column(Boolean, default=True)
    video_path:     Mapped[str|None] = mapped_column(String(512), nullable=True)
    vtt_subtitles:  Mapped[str|None] = mapped_column(Text, nullable=True)
    student_access: Mapped[bool]     = mapped_column(Boolean, default=False)
    ai_analysis:    Mapped[dict|None]= mapped_column(JSONB, nullable=True)
    
    avg_engagement: Mapped[float|None] = mapped_column(Float, nullable=True)
    avg_fatigue:    Mapped[float|None] = mapped_column(Float, nullable=True)
    answers_given:  Mapped[int]        = mapped_column(Integer, default=0)
    answers_total:  Mapped[int]        = mapped_column(Integer, default=0)

    tests:        Mapped[list["Test"]]       = relationship(back_populates="lesson")
    robot_events: Mapped[list["RobotEvent"]] = relationship(back_populates="session")


class Test(Base):
    __tablename__ = "tests"

    id:         Mapped[int]      = mapped_column(Integer, primary_key=True, index=True)
    lesson_id:  Mapped[int]      = mapped_column(ForeignKey("lesson_sessions.id"), nullable=False)
    questions:  Mapped[list]     = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    lesson:  Mapped["LessonSession"]  = relationship(back_populates="tests")
    results: Mapped[list["TestResult"]] = relationship(back_populates="test")


class TestResult(Base):
    __tablename__ = "test_results"

    id:           Mapped[int]      = mapped_column(Integer, primary_key=True, index=True)
    student_id:   Mapped[int]      = mapped_column(ForeignKey("students.id"), nullable=False)
    test_id:      Mapped[int]      = mapped_column(ForeignKey("tests.id"), nullable=False)
    answers:      Mapped[dict]     = mapped_column(JSONB, nullable=False)
    score:        Mapped[float]    = mapped_column(Float, nullable=False)
    errors:       Mapped[list]     = mapped_column(JSONB, default=list)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    student: Mapped["Student"] = relationship(back_populates="test_results")
    test:    Mapped["Test"]    = relationship(back_populates="results")


class Trajectory(Base):
    __tablename__ = "trajectories"

    id:         Mapped[int]      = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int]      = mapped_column(ForeignKey("students.id"), nullable=False, unique=True)
    topics:     Mapped[list]     = mapped_column(JSONB, default=list)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    student: Mapped["Student"] = relationship(back_populates="trajectory")


class RobotEvent(Base):
    __tablename__ = "robot_events"

    id:         Mapped[int]             = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int]             = mapped_column(ForeignKey("lesson_sessions.id"), nullable=False)
    type:       Mapped[EventTypeEnum]   = mapped_column(SAEnum(EventTypeEnum), nullable=False)
    payload:    Mapped[dict]            = mapped_column(JSONB, nullable=False)
    timestamp:  Mapped[datetime]        = mapped_column(DateTime(timezone=True), server_default=func.now())

    session: Mapped["LessonSession"] = relationship(back_populates="robot_events")


class User(Base):
    __tablename__ = "users"

    id:              Mapped[int]       = mapped_column(Integer, primary_key=True, index=True)
    username:        Mapped[str]       = mapped_column(String(100), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str]       = mapped_column(String(255), nullable=False)
    full_name:       Mapped[str]       = mapped_column(String(255), nullable=False)
    role:            Mapped[RoleEnum]  = mapped_column(SAEnum(RoleEnum), nullable=False)
    subject:         Mapped[str|None]  = mapped_column(String(100), nullable=True)
    class_id:        Mapped[int|None]  = mapped_column(Integer, nullable=True)
    student_id:      Mapped[int|None]  = mapped_column(ForeignKey("students.id"), nullable=True)
    approved:        Mapped[bool]      = mapped_column(Boolean, default=False)
    created_at:      Mapped[datetime]  = mapped_column(DateTime(timezone=True), server_default=func.now())


class LessonResponse(Base):
    __tablename__ = "lesson_responses"

    id:             Mapped[int]      = mapped_column(Integer, primary_key=True, index=True)
    student_id:     Mapped[int]      = mapped_column(ForeignKey("students.id"), nullable=False, index=True)
    lesson_id:      Mapped[int]      = mapped_column(ForeignKey("lesson_sessions.id"), nullable=False, index=True)
    question:       Mapped[str]      = mapped_column(Text, nullable=False)
    given_answer:   Mapped[str]      = mapped_column(Text, nullable=False)
    correct_answer: Mapped[str]      = mapped_column(Text, nullable=False)
    is_correct:     Mapped[bool]     = mapped_column(Boolean, nullable=False)
    accuracy:       Mapped[int]      = mapped_column(Integer, default=0) 
    skill:          Mapped[str|None] = mapped_column(String(120), nullable=True)
    created_at:     Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class KnowledgeNode(Base):
    __tablename__ = "knowledge_nodes"

    id:       Mapped[str]   = mapped_column(String(64), primary_key=True)
    name:     Mapped[str]   = mapped_column(String(200), nullable=False)
    subject:  Mapped[str]   = mapped_column(String(120), nullable=False)
    x:        Mapped[int]   = mapped_column(Integer, default=0)
    y:        Mapped[int]   = mapped_column(Integer, default=0)
    prereqs:  Mapped[list]  = mapped_column(JSONB, default=list)


class PrefQuestion(Base):
    __tablename__ = "pref_questions"

    id:        Mapped[int]   = mapped_column(Integer, primary_key=True, index=True)
    order_idx: Mapped[int]   = mapped_column(Integer, default=0)
    text:      Mapped[str]   = mapped_column(Text, nullable=False)
    key:       Mapped[str]   = mapped_column(String(64), nullable=False)
    options:   Mapped[list]  = mapped_column(JSONB, default=list)  


class HobbyOption(Base):
    __tablename__ = "hobby_options"

    id:        Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    order_idx: Mapped[int] = mapped_column(Integer, default=0)
    label:     Mapped[str] = mapped_column(String(120), unique=True, nullable=False)


class CareerQuestion(Base):
    __tablename__ = "career_questions"

    id:        Mapped[int]   = mapped_column(Integer, primary_key=True, index=True)
    order_idx: Mapped[int]   = mapped_column(Integer, default=0)
    text:      Mapped[str]   = mapped_column(Text, nullable=False)
    options:   Mapped[list]  = mapped_column(JSONB, default=list)   


class CareerResult(Base):
    __tablename__ = "career_results"

    track:       Mapped[str]  = mapped_column(String(64), primary_key=True)  
    title:       Mapped[str]  = mapped_column(String(200), nullable=False)
    desc:        Mapped[str]  = mapped_column(Text, nullable=False)
    color:       Mapped[str]  = mapped_column(String(20), nullable=False)
    profs:       Mapped[list] = mapped_column(JSONB, default=list)
     
    track_label: Mapped[str]  = mapped_column(String(200), default="")


class SubjectTrack(Base):
    __tablename__ = "subject_tracks"

    subject:       Mapped[str] = mapped_column(String(120), primary_key=True)
    track:         Mapped[str] = mapped_column(String(64), nullable=False)
    subj_genitive: Mapped[str] = mapped_column(String(120), nullable=False)
