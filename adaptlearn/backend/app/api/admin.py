from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.models import User, Student, RoleEnum, Subject, SchoolClass, RobotEvent, EventTypeEnum, LessonSession
from app.schemas import UserOut, SubjectOut, SchoolClassOut, AdminApproveUser

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/pending", response_model=list[UserOut])
async def pending_users(db: AsyncSession = Depends(get_db)):
    """All users waiting for admin approval."""
    result = await db.execute(select(User).where(User.approved == False))
    return result.scalars().all()


@router.get("/users", response_model=list[UserOut])
async def all_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(User.role, User.full_name))
    return result.scalars().all()


@router.patch("/users/{user_id}/approve", response_model=UserOut)
async def approve_user(user_id: int, body: AdminApproveUser, db: AsyncSession = Depends(get_db)):
    """Approve user and optionally assign class (student) or subject (teacher)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.approved = True

    if user.role == RoleEnum.student and body.class_id:
        user.class_id = body.class_id
        if user.student_id:
            s_res = await db.execute(select(Student).where(Student.id == user.student_id))
            student = s_res.scalar_one_or_none()
            if student:
                student.class_id = body.class_id

    if user.role == RoleEnum.teacher and body.subject:
        user.subject = body.subject

    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=204)
async def reject_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """Reject and delete a pending user."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.commit()


@router.get("/subjects", response_model=list[SubjectOut])
async def list_subjects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Subject).order_by(Subject.name))
    return result.scalars().all()


@router.get("/classes", response_model=list[SchoolClassOut])
async def list_classes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SchoolClass).order_by(SchoolClass.grade, SchoolClass.name))
    return result.scalars().all()


@router.post("/reseed-sensors")
async def reseed_sensors(db: AsyncSession = Depends(get_db)):
    """Видаляє ВСІ robot_events і відтворює їх за поточною логікою з auth._do_seed
    (з різними поганими умовами для admin-сповіщень). Не чіпає тести/профілі/уроки."""
    from datetime import datetime, timedelta, timezone
    from sqlalchemy import delete
 
    deleted = await db.execute(delete(RobotEvent))
    await db.commit()
 
    lessons_res = await db.execute(select(LessonSession).order_by(LessonSession.id))
    lessons = lessons_res.scalars().all()
 
    hot_lessons      = {2, 8, 11, 14, 17}
    very_hot_lessons = {17}
    cold_lessons     = {6, 13}
    dry_lessons      = {3, 10, 16}
    wet_lessons      = {5, 18}
    low_attention    = {12, 15}

    base = datetime.now(timezone.utc) - timedelta(days=3)
    created = 0

    for idx, ls in enumerate(lessons):
        if idx in very_hot_lessons:
            base_temp, base_humid = 30.2, 35.0
        elif idx in hot_lessons:
            base_temp, base_humid = 27.8, 48.0
        elif idx in cold_lessons:
            base_temp, base_humid = 16.5, 52.0
        elif idx in dry_lessons:
            base_temp, base_humid = 22.0, 24.0
        elif idx in wet_lessons:
            base_temp, base_humid = 23.0, 78.0
        else:
            base_temp, base_humid = 22.5, 47.0

        attention_floor = 25 if (idx in low_attention or idx in very_hot_lessons or idx in cold_lessons) else 45
        attention_range = 35 if (idx in low_attention) else 50

        for i in range(5):
            ts = (base + timedelta(minutes=5 * i)).isoformat()
            db.add(RobotEvent(session_id=ls.id, type=EventTypeEnum.thermal, payload={
                "attention_scores": [round(attention_floor + (i * 3 + j * 1.7) % attention_range, 1) for j in range(30)],
                "temperature_c": round(base_temp + i * 0.3, 1),
                "humidity_percent": round(base_humid + i * 1.2, 1),
                "timestamp": ts,
            }))
            db.add(RobotEvent(session_id=ls.id, type=EventTypeEnum.audio, payload={
                "student_id": (i % 5) + 1,
                "duration_sec": 3 + i,
                "type": "answer" if i % 2 else "question",
                "volume": round(0.5 + i * 0.05, 2),
                "timestamp": ts,
            }))
            created += 2
        db.add(RobotEvent(session_id=ls.id, type=EventTypeEnum.video, payload={
            "keywords": (ls.topic or "").split()[:3],
            "confidence": 0.87,
            "timestamp": base.isoformat(),
        }))
        created += 1

    await db.commit()
    return {
        "deleted": deleted.rowcount if hasattr(deleted, "rowcount") else None,
        "created": created,
        "lessons": len(lessons),
        "bad_conditions": {
            "hot":      sorted(hot_lessons),
            "very_hot": sorted(very_hot_lessons),
            "cold":     sorted(cold_lessons),
            "dry":      sorted(dry_lessons),
            "wet":      sorted(wet_lessons),
            "low_attention": sorted(low_attention),
        },
    }


@router.get("/notifications")
async def notifications(db: AsyncSession = Depends(get_db)):
    """
    Сканує останні події з датчиків температури/вологості та повертає сповіщення
    про несприятливі умови в класах. Норма: t=20-24°C, h=40-60%.
    """
    result = await db.execute(
        select(RobotEvent).where(RobotEvent.type == EventTypeEnum.thermal)
        .order_by(desc(RobotEvent.timestamp)).limit(100)
    )
    events = result.scalars().all()
 
    lessons_result = await db.execute(select(LessonSession))
    lessons_map = {l.id: l for l in lessons_result.scalars().all()}

    notifications = []
    seen_sessions = set()
    for e in events:
        if e.session_id in seen_sessions:
            continue
        p = e.payload or {}
        temp = p.get("temperature_c")
        hum = p.get("humidity_percent")
        attention = p.get("attention_scores", [])
        avg_attention = sum(attention) / len(attention) if attention else 100

        items = []
        if isinstance(temp, (int, float)):
            if temp < 18:
                items.append({"type": "temperature", "level": "critical",
                              "message": f"Холодно: {temp}°C (норма 20-24°C)",
                              "suggestion": "Увімкнути обігрівач або підняти температуру батарей"})
            elif temp < 20:
                items.append({"type": "temperature", "level": "warning",
                              "message": f"Прохолодно: {temp}°C",
                              "suggestion": "Перевірити обігрівач"})
            elif temp > 26:
                items.append({"type": "temperature", "level": "critical",
                              "message": f"Спекотно: {temp}°C (норма 20-24°C)",
                              "suggestion": "Увімкнути кондиціонер або провітрити"})
            elif temp > 24:
                items.append({"type": "temperature", "level": "warning",
                              "message": f"Тепло: {temp}°C",
                              "suggestion": "Провітрити приміщення"})
        if isinstance(hum, (int, float)):
            if hum < 30:
                items.append({"type": "humidity", "level": "critical",
                              "message": f"Сухо: {hum}% (норма 40-60%)",
                              "suggestion": "Увімкнути зволожувач повітря"})
            elif hum > 70:
                items.append({"type": "humidity", "level": "critical",
                              "message": f"Волого: {hum}% (норма 40-60%)",
                              "suggestion": "Провітрити та зменшити вологу"})

        if avg_attention < 50 and items:
            items.append({"type": "engagement", "level": "info",
                          "message": f"Середня увага учнів {avg_attention:.0f}% — може бути через умови",
                          "suggestion": "Враховуйте умови в класі"})

        if items:
            lesson = lessons_map.get(e.session_id)
            class_name = None
            if lesson:
                cls_res = await db.execute(select(SchoolClass).where(SchoolClass.id == lesson.class_id))
                cls = cls_res.scalar_one_or_none()
                class_name = cls.name if cls else None

            notifications.append({
                "session_id": e.session_id,
                "subject": lesson.subject if lesson else None,
                "topic": lesson.topic if lesson else None,
                "class_name": class_name,
                "timestamp": e.timestamp.isoformat() if e.timestamp else None,
                "items": items,
            })
            seen_sessions.add(e.session_id)

        if len(notifications) >= 20:
            break

    return notifications
