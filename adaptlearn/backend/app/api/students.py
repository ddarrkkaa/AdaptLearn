from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Student, CognitiveProfile, TestResult, Test
from app.schemas import StudentCreate, StudentOut, CognitiveProfileOut, CognitiveProfilePatch

router = APIRouter(prefix="/students", tags=["students"])


@router.post("/", response_model=StudentOut)
async def create_student(data: StudentCreate, db: AsyncSession = Depends(get_db)):
    student = Student(class_id=data.class_id, role=data.role)
    db.add(student)
    await db.commit()
    await db.refresh(student)

    profile = CognitiveProfile(student_id=student.id)
    db.add(profile)
    await db.commit()

    return student


@router.get("/", response_model=list[StudentOut])
async def list_students(class_id: int | None = None, db: AsyncSession = Depends(get_db)):
    q = select(Student)
    if class_id is not None:
        q = q.where(Student.class_id == class_id)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{student_id}", response_model=StudentOut)
async def get_student(student_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Student).where(Student.id == student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.get("/{student_id}/profile", response_model=CognitiveProfileOut)
async def get_profile(student_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CognitiveProfile).where(CognitiveProfile.student_id == student_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.get("/{student_id}/results")
async def student_results(student_id: int, db: AsyncSession = Depends(get_db)):
    """Всі результати тестів учня."""
    result = await db.execute(
        select(TestResult).where(TestResult.student_id == student_id)
        .order_by(TestResult.completed_at.desc())
    )
    items = result.scalars().all()
    return [{"id": r.id, "test_id": r.test_id, "score": r.score,
             "answers": r.answers, "errors": r.errors,
             "completed_at": r.completed_at.isoformat() if r.completed_at else None}
            for r in items]


@router.post("/{student_id}/ai_advice")
async def ai_advice(student_id: int, db: AsyncSession = Depends(get_db)):
    """AI-порада досвідченого вчителя для основного класного керівника
    на основі профілю учня, тестів, помилок, інтересів, сенсорів."""
    import os
    import json
    from app.models import User, LessonSession, Test, RobotEvent, EventTypeEnum
 
    prof_res = await db.execute(select(CognitiveProfile).where(CognitiveProfile.student_id == student_id))
    profile = prof_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
 
    user_res = await db.execute(select(User).where(User.student_id == student_id))
    user = user_res.scalar_one_or_none()
    full_name = user.full_name if user else f"учень №{student_id}"
    class_id = user.class_id if user else None
    
    res_res = await db.execute(
        select(TestResult).where(TestResult.student_id == student_id)
        .order_by(TestResult.completed_at.desc()).limit(8)
    )
    recent_results = res_res.scalars().all()
    avg_score = round(sum(r.score for r in recent_results) / len(recent_results), 1) if recent_results else None
    common_errors = []
    for r in recent_results:
        if isinstance(r.errors, list):
            common_errors.extend(r.errors)
    common_errors = common_errors[:8]
     
    sensor_summary = "немає даних"
    if class_id is not None:
        less_res = await db.execute(select(LessonSession).where(LessonSession.class_id == class_id).order_by(LessonSession.date.desc()).limit(5))
        less = less_res.scalars().all()
        attentions = []
        for l in less:
            ev_res = await db.execute(
                select(RobotEvent).where(RobotEvent.session_id == l.id, RobotEvent.type == EventTypeEnum.thermal)
            )
            for e in ev_res.scalars():
                sc = (e.payload or {}).get("attention_scores", [])
                if sc:
                    attentions.extend(sc)
        if attentions:
            sensor_summary = f"середня увага на уроках ~{round(sum(attentions)/len(attentions))}% (по {len(attentions)} вимірах)"

    pace_val = profile.learning_pace.value if hasattr(profile.learning_pace, 'value') else str(profile.learning_pace)
    interests_str = ", ".join((profile.interests or [])[:6]) or "не вказано"
 
    name_parts = (full_name or "").strip().split()
    first_name = name_parts[0] if name_parts else "учень"
    last_name = name_parts[1] if len(name_parts) > 1 else ""
    pronoun = "учениця" if first_name.endswith(("а", "я", "ія")) else "учень"

    prompt = (
        "Ти — досвідчений педагог-консультант. Класний керівник просить твою пораду щодо одного учня. "
        "На основі даних нижче дай КОНКРЕТНУ практичну пораду (3-6 речень, тон як старший колега):\n"
        "- Що зараз робити основному вчителю з цим учнем на найближчих уроках\n"
        "- На що звернути увагу (тема, поведінка, мотивація)\n"
        "- Які прийоми чи слова сказати, щоб допомогти\n\n"
        "ДУЖЕ ВАЖЛИВО ЩОДО ІМЕНІ:\n"
        f"- Ім'я учня в називному відмінку: '{first_name}'.\n"
        f"- Прізвище: '{last_name}'.\n"
        "- Можеш згадати ім'я 1 раз на початку, далі використовуй слова 'учень'/'учениця' або 'дитина'.\n"
        "- ЗАБОРОНЕНО змінювати або скорочувати ім'я (наприклад, не пиши 'Альоніна' замість 'Аліна').\n"
        "- Якщо потрібен непрямий відмінок (родовий, давальний) — використовуй слово 'учня'/'учениці' замість імені.\n\n"
        "Уникай загальних фраз. Звертайся до вчителя на 'ви'. Українською мовою. Без емодзі, без маркерів-списків."
    )
    user_msg = (
        f"Ім'я: {first_name} {last_name}\n"
        f"Стать (граматична): {pronoun}\n"
        f"Рівень знань: {profile.knowledge_level:.0f}/100\n"
        f"Залученість (увага): {profile.engagement_score:.0f}/100\n"
        f"Темп навчання: {pace_val}\n"
        f"Інтереси/хобі: {interests_str}\n"
        f"Середній бал останніх тестів: {avg_score if avg_score is not None else 'немає'}\n"
        f"Типові помилки: {'; '.join(common_errors) if common_errors else 'немає даних'}\n"
        f"Сенсори класу: {sensor_summary}\n"
    )
 
    try:
        groq_key = os.getenv("GROQ_API_KEY", "")
        if groq_key and "твій-ключ" not in groq_key:
            from groq import AsyncGroq
            g = AsyncGroq(api_key=groq_key)
            r = await g.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role":"system","content":prompt},{"role":"user","content":user_msg}],
            )
            return {"advice": r.choices[0].message.content.strip()}
    except Exception as e:
        print(f"[ai_advice Groq] {e}")
    try:
        oai_key = os.getenv("OPENAI_API_KEY", "")
        if oai_key:
            from openai import AsyncOpenAI
            o = AsyncOpenAI(api_key=oai_key)
            r = await o.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role":"system","content":prompt},{"role":"user","content":user_msg}],
            )
            return {"advice": r.choices[0].message.content.strip()}
    except Exception as e:
        print(f"[ai_advice OpenAI] {e}")
     
    if profile.knowledge_level < 50:
        return {"advice": f"{full_name.split()[0]} зараз має пробіли в базовому матеріалі. Поверніться на 1-2 теми назад, дайте простіші практичні завдання, попросіть пояснити правило своїми словами. Якщо є інтерес ({interests_str.split(',')[0] if interests_str else 'хобі'}) — будуйте приклади саме на ньому. Часті короткі похвали утримають мотивацію."}
    if profile.engagement_score < 50:
        return {"advice": "Учень може бути неуважним на уроках. Викликайте до дошки, давайте міні-ролі ('помічник'). Якщо тема нудна — переформулюйте через хобі учня. Стежте за станом класу (термокамера) і робіть короткі активності."}
    return {"advice": "Учень стабільний. Тримайте темп, періодично додавайте складніші задачі для росту, фіксуйте успіхи письмово (учневі і батькам). Це чудовий момент дати маленьке лідерське завдання."}


@router.patch("/{student_id}/profile", response_model=CognitiveProfileOut)
async def patch_profile(student_id: int, data: CognitiveProfilePatch, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CognitiveProfile).where(CognitiveProfile.student_id == student_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if data.interests is not None:
        profile.interests = data.interests
    if data.knowledge_level is not None:
        profile.knowledge_level = data.knowledge_level
    if data.engagement_score is not None:
        profile.engagement_score = data.engagement_score
    await db.commit()
    await db.refresh(profile)
    return profile
