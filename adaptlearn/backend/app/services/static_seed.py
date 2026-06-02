"""
Seed функція для статичного контенту з JSON-файлів у app/data/ → БД.

Викликається в lifespan після створення таблиць. Якщо в таблиці вже є дані —
не дублює (idempotent).
"""
from __future__ import annotations
import json
import os
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    PrefQuestion, HobbyOption,
    CareerQuestion, CareerResult,
    SubjectTrack,
    KnowledgeNode, LessonResponse,
    Student,
)


DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def _load(name: str) -> dict:
    with open(DATA_DIR / name, "r", encoding="utf-8") as f:
        return json.load(f)

 
async def seed_preferences(db: AsyncSession):
    if (await db.execute(select(PrefQuestion).limit(1))).scalar_one_or_none():
        return   
    data = _load("preferences.json")
    for i, q in enumerate(data.get("questions", [])):
        db.add(PrefQuestion(order_idx=i, text=q["text"], key=q["key"], options=q["opts"]))
    for i, h in enumerate(data.get("hobbies", [])):
        db.add(HobbyOption(order_idx=i, label=h))
    await db.commit()
    print(f"[StaticSeed] preferences: {len(data.get('questions',[]))} questions, {len(data.get('hobbies',[]))} hobbies")

 
async def seed_career(db: AsyncSession):
    if (await db.execute(select(CareerQuestion).limit(1))).scalar_one_or_none():
        return
    data = _load("career.json")
 
    for i, q in enumerate(data.get("questions", [])):
        db.add(CareerQuestion(order_idx=i, text=q["t"], options=q["opts"]))
    
    track_labels = data.get("trackLabels", {})
    for track, r in (data.get("results") or {}).items():
        db.add(CareerResult(
            track=track,
            title=r.get("title", track),
            desc=r.get("desc", ""),
            color=r.get("color", "#0284c7"),
            profs=r.get("profs", []),
            track_label=track_labels.get(track, r.get("title", "")),
        ))
 
    for subject, info in (data.get("subjectToTrack") or {}).items():
        db.add(SubjectTrack(
            subject=subject,
            track=info.get("track", "stem"),
            subj_genitive=info.get("subj", subject.lower()),
        ))
    await db.commit()
    print(f"[StaticSeed] career: {len(data.get('questions',[]))} questions, {len(data.get('results',{}))} tracks, {len(data.get('subjectToTrack',{}))} subject-mappings")

 
async def seed_knowledge_graph(db: AsyncSession):
    if (await db.execute(select(KnowledgeNode).limit(1))).scalar_one_or_none():
        return
    data = _load("knowledgeGraph.json")
    for n in data.get("nodes", []):
        db.add(KnowledgeNode(
            id=n["id"],
            name=n["name"],
            subject=n["subject"],
            x=int(n.get("x", 0)),
            y=int(n.get("y", 0)),
            prereqs=n.get("prereqs", []),
        ))
    await db.commit()
    print(f"[StaticSeed] knowledge_graph: {len(data.get('nodes',[]))} nodes")

 
    from app.models import CognitiveProfile
    mastery_data = data.get("studentMastery", {})
    for student_id_str, skills in mastery_data.items():
        sid = int(student_id_str)
        prof_res = await db.execute(select(CognitiveProfile).where(CognitiveProfile.student_id == sid))
        prof = prof_res.scalar_one_or_none()
        if prof and not (prof.skills or {}):
 
            prof.skills = dict(skills)
    await db.commit()
    print(f"[StaticSeed] knowledge mastery seeded for {len(mastery_data)} students (only those with empty skills)")

 
async def seed_lesson_responses(db: AsyncSession):
    if (await db.execute(select(LessonResponse).limit(1))).scalar_one_or_none():
        return
    data = _load("studentLessonResponses.json") 
    count = 0
    for sid_str, by_lesson in data.items():
        if sid_str.startswith("_"):
            continue
        sid = int(sid_str) 
        stu_res = await db.execute(select(Student).where(Student.id == sid))
        if not stu_res.scalar_one_or_none():
            continue
        for lid_str, bundle in by_lesson.items():
            lid = int(lid_str)
            for r in bundle.get("responses", []):
                db.add(LessonResponse(
                    student_id=sid,
                    lesson_id=lid,
                    question=r.get("q", ""),
                    given_answer=str(r.get("given", "")),
                    correct_answer=str(r.get("correct", "")),
                    is_correct=bool(r.get("isCorrect", False)),
                    accuracy=int(r.get("accuracy", 0)),
                    skill=None,
                ))
                count += 1
    await db.commit()
    print(f"[StaticSeed] lesson_responses: {count} responses seeded")
 
async def seed_all_static(db: AsyncSession):
    """Викликається з lifespan після _do_seed (юзери/класи) і ensure-column міграцій."""
    try:
        await seed_preferences(db)
        await seed_career(db)
        await seed_knowledge_graph(db)
        await seed_lesson_responses(db)
    except Exception as e:
        print(f"[StaticSeed] failed: {type(e).__name__}: {e}")
