from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Test, TestResult, LessonSession, RobotEvent, EventTypeEnum, CognitiveProfile
from app.schemas import TestOut, TestResultCreate, TestResultOut
from app.services.test_generator import TestGenerator
from app.services.profile_engine import ProfileEngine
from app.services.trajectory_engine import TrajectoryEngine

router = APIRouter(prefix="/tests", tags=["tests"])
_generator = TestGenerator()
_profile_engine = ProfileEngine()
_trajectory_engine = TrajectoryEngine()


@router.post("/generate/{lesson_id}", response_model=TestOut)
async def generate_test(
    lesson_id: int,
    n: int = 4,
    student_id: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Генерує тест. Якщо переданий student_id — кількість і складність питань підлаштовуються
    під CognitiveProfile цього учня (knowledge_level, learning_pace)."""
    result = await db.execute(select(LessonSession).where(LessonSession.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    transcript = lesson.transcript or ""
    if not transcript.strip():
        raise HTTPException(status_code=400, detail="Транскрипт уроку порожній. Завантаж відео/PDF або введи транскрипт вручну перед генерацією тесту.")
    key_terms = lesson.key_terms or []
    
    lang = None
    if isinstance(lesson.ai_analysis, dict):
        lang = lesson.ai_analysis.get("language")
    if not lang:
        from app.services.test_generator import detect_language
        lang = detect_language(transcript)
 
    profile_dict = None
    if student_id is not None:
        prof_res = await db.execute(
            select(CognitiveProfile).where(CognitiveProfile.student_id == student_id)
        )
        prof = prof_res.scalar_one_or_none()
        if prof:
            pace_val = prof.learning_pace.value if hasattr(prof.learning_pace, 'value') else str(prof.learning_pace)
            profile_dict = {
                "knowledge_level": prof.knowledge_level,
                "pace": pace_val,
                "engagement_score": prof.engagement_score,
            }

    enriched = f"Тема уроку: {lesson.topic or lesson.subject}\nПредмет: {lesson.subject}\n\n{transcript}"
    questions = await _generator.generate(enriched, key_terms, n, language=lang, profile=profile_dict)

    test = Test(lesson_id=lesson_id, questions=questions)
    db.add(test)
    await db.commit()
    await db.refresh(test)
    return test


@router.post("/save/{lesson_id}", response_model=TestOut)
async def save_test(lesson_id: int, body: dict, db: AsyncSession = Depends(get_db)):
    """Зберегти або оновити тест для уроку (вчитель редагує)."""
    questions = body.get("questions", [])
    res = await db.execute(select(Test).where(Test.lesson_id == lesson_id))
    test = res.scalars().first()
    if test:
        test.questions = questions
    else:
        test = Test(lesson_id=lesson_id, questions=questions)
        db.add(test)
    await db.commit()
    await db.refresh(test)
    return test


@router.get("/lesson/{lesson_id}/analytics")
async def lesson_test_analytics(lesson_id: int, db: AsyncSession = Depends(get_db)):
    """Реальна аналітика тесту з test_results: середній бал, розподіл оцінок."""
    tests_res = await db.execute(select(Test).where(Test.lesson_id == lesson_id))
    tests = tests_res.scalars().all()
    if not tests:
        return {"has_data": False}
    test_ids = [t.id for t in tests]
    results_res = await db.execute(select(TestResult).where(TestResult.test_id.in_(test_ids)))
    results = results_res.scalars().all()
    if not results:
        return {"has_data": False}
    scores = [r.score for r in results]
    avg = sum(scores) / len(scores)
    grades_12 = [max(1, min(12, round(s * 12 / 100))) for s in scores]
    distribution = {str(g): grades_12.count(g) for g in range(1, 13)}
    return {
        "has_data": True,
        "total_submissions": len(results),
        "average_score": round(avg, 1),
        "average_grade_12": max(1, min(12, round(avg * 12 / 100))),
        "distribution": distribution,
        "best": max(scores),
        "worst": min(scores),
    }


@router.get("/{test_id}", response_model=TestOut)
async def get_test(test_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Test).where(Test.id == test_id))
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    return test


@router.get("/lesson/{lesson_id}", response_model=list[TestOut])
async def list_tests_for_lesson(lesson_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Test).where(Test.lesson_id == lesson_id))
    return result.scalars().all()


@router.post("/results", response_model=TestResultOut)
async def submit_result(
    data: TestResultCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    tr = TestResult(
        student_id=data.student_id,
        test_id=data.test_id,
        answers=data.answers,
        score=data.score,
        errors=data.errors,
    )
    db.add(tr)
    await db.commit()
    await db.refresh(tr)
 
    test_res = await db.execute(select(Test).where(Test.id == data.test_id))
    test = test_res.scalar_one_or_none()
    lesson_id = test.lesson_id if test else None
    questions = test.questions if test else []
 
    from app.services.profile_engine import derive_skill_observations
    skill_obs = derive_skill_observations(questions, data.answers or {}) if questions else None

    background_tasks.add_task(
        _update_profile_and_trajectory,
        data.student_id,
        data.score,
        lesson_id,
        skill_obs,
        list(data.errors or []),
    )
    return tr


async def _update_profile_and_trajectory(
    student_id: int,
    score: float,
    lesson_id: int | None,
    skill_obs: dict | None = None,
    recent_errors: list | None = None,
):
    """Бекграунд: реальна сенсорика + skill_obs з відповідей → BKT-апдейт профілю."""
    from app.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        thermal_scores: list[float] = []
        audio_events: list[dict] = []

        if lesson_id is not None:
            events_res = await db.execute(
                select(RobotEvent).where(RobotEvent.session_id == lesson_id)
            )
            events = events_res.scalars().all()
            for e in events:
                if e.type == EventTypeEnum.thermal:
                    p = e.payload or {}
                     
                    sc = p.get("attention_scores", [])
                    if sc:
                        thermal_scores.append(sum(sc) / len(sc))
                    val = p.get("attention", p.get("engagement"))
                    if isinstance(val, (int, float)):
                        thermal_scores.append(float(val))
                elif e.type == EventTypeEnum.audio:
                    audio_events.append(e.payload or {})

        print(
            f"[Profile/BKT] student={student_id} score={score} "
            f"thermal_n={len(thermal_scores)} audio_n={len(audio_events)} "
            f"skills={list((skill_obs or {}).keys())} errors_n={len(recent_errors or [])}",
            flush=True,
        )
        profile = await _profile_engine.update_after_test(
            db, student_id, score, thermal_scores, audio_events,
            skill_observations=skill_obs,
            recent_errors=recent_errors,
        )
        await _trajectory_engine.update(db, student_id, profile)
