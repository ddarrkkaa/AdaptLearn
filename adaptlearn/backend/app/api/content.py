"""
API для статичного контенту (preferences/career/knowledge_graph) +
динамічних відповідей учнів на уроках (lesson_responses).

Раніше фронт читав це з JSON-файлів — тепер тягне з БД через ці ендпоінти.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    PrefQuestion, HobbyOption,
    CareerQuestion, CareerResult, SubjectTrack,
    KnowledgeNode, CognitiveProfile,
    LessonResponse, Student, User,
)

router = APIRouter(tags=["content"])
 
@router.get("/preferences/questions")
async def get_pref_questions(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(PrefQuestion).order_by(PrefQuestion.order_idx))
    return [{"text": q.text, "key": q.key, "opts": q.options} for q in res.scalars()]


@router.get("/preferences/hobbies")
async def get_hobbies(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(HobbyOption).order_by(HobbyOption.order_idx))
    return [h.label for h in res.scalars()]

 
@router.get("/career/questions")
async def get_career_questions(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(CareerQuestion).order_by(CareerQuestion.order_idx))
    return [{"t": q.text, "opts": q.options} for q in res.scalars()]


@router.get("/career/results")
async def get_career_results(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(CareerResult))
    out: dict[str, dict] = {}
    for r in res.scalars():
        out[r.track] = {
            "title": r.title,
            "desc": r.desc,
            "color": r.color,
            "profs": r.profs,
        }
     
    return out


@router.get("/career/track-labels")
async def get_track_labels(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(CareerResult))
    return {r.track: r.track_label for r in res.scalars()}


@router.get("/career/subject-tracks")
async def get_subject_tracks(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SubjectTrack))
    return {r.subject: {"track": r.track, "subj": r.subj_genitive} for r in res.scalars()}

 
@router.get("/knowledge-graph")
async def get_knowledge_graph(db: AsyncSession = Depends(get_db)):
    """Повертає {nodes, edges} — топологію графа знань."""
    res = await db.execute(select(KnowledgeNode))
    nodes = []
    edges = []
    for n in res.scalars():
        nodes.append({
            "id": n.id, "name": n.name, "subject": n.subject,
            "x": n.x, "y": n.y, "prereqs": n.prereqs,
        })
        for pre in (n.prereqs or []):
            edges.append({"from": pre, "to": n.id})
    return {"nodes": nodes, "edges": edges}


@router.get("/students/{student_id}/knowledge-mastery")
async def get_student_mastery(student_id: int, db: AsyncSession = Depends(get_db)):
    """Повертає мапу nodeId → mastery (0..1) для конкретного учня — з cognitive_profiles.skills."""
    res = await db.execute(select(CognitiveProfile).where(CognitiveProfile.student_id == student_id))
    profile = res.scalar_one_or_none()
    return profile.skills if profile else {}

 
@router.get("/lessons/{lesson_id}/responses")
async def get_lesson_responses(
    lesson_id: int,
    student_id: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Відповіді учнів НА уроці. Якщо student_id передано — тільки цього учня
    (для вкладки учня). Інакше — всі учні з агрегацією (для вчителя)."""
    q = select(LessonResponse).where(LessonResponse.lesson_id == lesson_id)
    if student_id is not None:
        q = q.where(LessonResponse.student_id == student_id)
    q = q.order_by(LessonResponse.student_id, LessonResponse.id)
    res = await db.execute(q)
    rows = res.scalars().all()
 
    bundles: dict[int, dict] = {}
    for r in rows:
        b = bundles.setdefault(r.student_id, {
            "student_id": r.student_id,
            "responses": [],
            "_acc_sum": 0,
            "_count": 0,
        })
        b["responses"].append({
            "q": r.question,
            "given": r.given_answer,
            "correct": r.correct_answer,
            "isCorrect": r.is_correct,
            "accuracy": r.accuracy,
        })
        b["_acc_sum"] += r.accuracy
        b["_count"] += 1
 
    if bundles:
        user_res = await db.execute(select(User).where(User.student_id.in_(bundles.keys())))
        users = {u.student_id: u.full_name for u in user_res.scalars()}
    else:
        users = {}

    out = []
    for sid, b in bundles.items():
        out.append({
            "student_id": sid,
            "student_name": users.get(sid, f"учень №{sid}"),
            "responses": b["responses"],
            "totalAccuracy": round(b["_acc_sum"] / b["_count"]) if b["_count"] else 0,
        })
    out.sort(key=lambda x: -x["totalAccuracy"])
    return out


@router.get("/students/{student_id}/lesson-responses")
async def student_all_lesson_responses(student_id: int, db: AsyncSession = Depends(get_db)):
    """Усі відповіді одного учня згруповані по lesson_id — з підтягнутим subject уроку."""
    from app.models import LessonSession
    res = await db.execute(
        select(LessonResponse).where(LessonResponse.student_id == student_id)
        .order_by(LessonResponse.lesson_id, LessonResponse.id)
    )
    rows = res.scalars().all()
    if not rows:
        return {}
    lesson_ids = {r.lesson_id for r in rows}
    less_res = await db.execute(select(LessonSession).where(LessonSession.id.in_(lesson_ids)))
    lessons = {l.id: l for l in less_res.scalars()}

    bundles: dict[str, dict] = {}
    for r in rows:
        key = str(r.lesson_id)
        b = bundles.setdefault(key, {
            "subject": lessons.get(r.lesson_id).subject if r.lesson_id in lessons else "—",
            "responses": [], "_sum": 0, "_n": 0,
        })
        b["responses"].append({
            "q": r.question,
            "given": r.given_answer,
            "correct": r.correct_answer,
            "isCorrect": r.is_correct,
            "accuracy": r.accuracy,
        })
        b["_sum"] += r.accuracy
        b["_n"] += 1

    out = {}
    for k, b in bundles.items():
        out[k] = {
            "subject": b["subject"],
            "responses": b["responses"],
            "totalAccuracy": round(b["_sum"] / b["_n"]) if b["_n"] else 0,
        }
    return out


@router.post("/lessons/{lesson_id}/responses")
async def post_lesson_response(
    lesson_id: int,
    body: dict,
    db: AsyncSession = Depends(get_db),
):
    """Учень відповів під час уроку (для майбутнього UI з відповідями в real-time)."""
    student_id = body.get("student_id")
    if not student_id:
        raise HTTPException(status_code=400, detail="student_id required")
    r = LessonResponse(
        student_id=int(student_id),
        lesson_id=lesson_id,
        question=str(body.get("question", "")),
        given_answer=str(body.get("given", "")),
        correct_answer=str(body.get("correct", "")),
        is_correct=bool(body.get("is_correct", False)),
        accuracy=int(body.get("accuracy", 0)),
        skill=body.get("skill"),
    )
    db.add(r)
    await db.commit()
    await db.refresh(r)
    return {"id": r.id}
