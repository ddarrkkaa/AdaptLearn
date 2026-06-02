import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse, PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import LessonSession
from app.schemas import LessonCreate, LessonOut, LessonTranscriptUpdate, LessonAnalysisUpdate, LessonAccessUpdate
from app.services.lesson_processor import LessonProcessor

router = APIRouter(prefix="/lessons", tags=["lessons"])

VIDEOS_DIR = "/app/videos"
os.makedirs(VIDEOS_DIR, exist_ok=True)

_processor = LessonProcessor()


async def _get_or_404(lesson_id: int, db: AsyncSession) -> LessonSession:
    result = await db.execute(select(LessonSession).where(LessonSession.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson

 

@router.post("/", response_model=LessonOut)
async def create_lesson(data: LessonCreate, db: AsyncSession = Depends(get_db)):
    lesson = LessonSession(class_id=data.class_id, subject=data.subject, topic=data.topic)
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
 
    await _seed_sensor_events_for_lesson(db, lesson.id, topic=(lesson.topic or lesson.subject))
    return lesson


async def _seed_sensor_events_for_lesson(db: AsyncSession, lesson_id: int, topic: str = ""):
    """Створює мок-події з усіх датчиків для уроку: 45 хв = 9 точок по 5 хв.
    Дозволяє відразу показати UI з датчиками для щойно створеного уроку."""
    from app.models import RobotEvent, EventTypeEnum
    from datetime import datetime, timedelta, timezone
    import random
     
    base_temp = round(random.uniform(21.5, 23.5), 1)
    base_humid = round(random.uniform(42.0, 55.0), 1)
    base_attention = random.uniform(60.0, 85.0)   
    start = datetime.now(timezone.utc) - timedelta(hours=2)
    n_points = 9   
    topic_words = (topic or "").split()[:4] or ["lesson"]

    for i in range(n_points):
        ts = (start + timedelta(minutes=5 * i)).isoformat()
         
        drift = -10 if 3 <= i <= 5 else (5 if i >= 7 else 0)
        cohort_attention = max(20.0, min(100.0, base_attention + drift + random.uniform(-6, 6)))
        scores = [round(max(15.0, min(100.0, cohort_attention + random.uniform(-15, 15))), 1) for _ in range(30)]
        db.add(RobotEvent(session_id=lesson_id, type=EventTypeEnum.thermal, payload={
            "attention_scores": scores,
            "temperature_c": round(base_temp + random.uniform(-0.4, 0.4), 1),
            "humidity_percent": round(base_humid + random.uniform(-2.0, 2.0), 1),
            "timestamp": ts,
        }))
        
        for _ in range(random.randint(2, 3)):
            db.add(RobotEvent(session_id=lesson_id, type=EventTypeEnum.audio, payload={
                "student_id": random.randint(1, 30),
                "duration_sec": random.randint(2, 8),
                "type": random.choice(["answer", "question", "noise"]),
                "volume": round(random.uniform(0.35, 0.85), 2),
                "timestamp": ts,
            }))
       
        db.add(RobotEvent(session_id=lesson_id, type=EventTypeEnum.video, payload={
            "keywords": random.sample(topic_words + ["приклад", "правило", "формула", "розв'язок"], min(3, len(topic_words) + 4)),
            "confidence": round(random.uniform(0.72, 0.96), 3),
            "timestamp": ts,
        }))
    await db.commit()


@router.get("/", response_model=list[LessonOut])
async def list_lessons(
    class_id: int | None = None,
    subject: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(LessonSession).order_by(LessonSession.date.desc())
    if class_id is not None:
        q = q.where(LessonSession.class_id == class_id)
    if subject:
        q = q.where(LessonSession.subject == subject)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/active", response_model=list[LessonOut])
async def get_active_lessons(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LessonSession).where(LessonSession.is_active == True))
    return result.scalars().all()


@router.get("/{lesson_id}", response_model=LessonOut)
async def get_lesson(lesson_id: int, db: AsyncSession = Depends(get_db)):
    return await _get_or_404(lesson_id, db)


@router.patch("/{lesson_id}/close", response_model=LessonOut)
async def close_lesson(lesson_id: int, db: AsyncSession = Depends(get_db)):
    lesson = await _get_or_404(lesson_id, db)
    lesson.is_active = False
    await db.commit()
    await db.refresh(lesson)
    return lesson

 

@router.post("/{lesson_id}/upload", response_model=LessonOut)
async def upload_video(
    lesson_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a video file. Saves it to disk, then:
    1. Calls OpenAI Whisper API for transcription (with timestamps)
    2. Generates WebVTT subtitles from timestamps
    3. Stores transcript + VTT in DB
    Runs transcription in background so the response is immediate.
    """
    lesson = await _get_or_404(lesson_id, db)
 
    ext = os.path.splitext(file.filename or "video.mp4")[1] or ".mp4"
    video_path = os.path.join(VIDEOS_DIR, f"lesson_{lesson_id}{ext}")
    with open(video_path, "wb") as f:
        content = await file.read()
        f.write(content)

    lesson.video_path = video_path
    await db.commit()
    await db.refresh(lesson)
 
    background_tasks.add_task(_transcribe_and_analyze, lesson_id, video_path)

    return lesson


async def _transcribe_and_analyze(lesson_id: int, video_path: str):
    """Background task: transcribe video → generate VTT → run AI analysis."""
    print(f"[Lesson {lesson_id}] Starting transcription of {video_path}")
    try:
        from app.database import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            lesson = await _get_or_404(lesson_id, db)

            result = await _processor.transcribe_video(video_path)
            text = result.get("text", "")
            segments = result.get("segments", [])

            print(f"[Lesson {lesson_id}] Whisper done: {len(text)} chars, {len(segments)} segments")

            error = result.get("error")
            vtt = result.get("vtt")
            if error:
                lesson.transcript = f"[ПОМИЛКА: {error}]"
            else:
                lesson.transcript = text or "[Порожній результат — можливо відео без мови]"
            lesson.vtt_subtitles = vtt

            if text:
                detected_lang = result.get("language")
                print(f"[Lesson {lesson_id}] Running AI analysis... language={detected_lang}")
                lesson.ai_analysis = await _processor.analyze_transcript(text, language=detected_lang)
                lesson.key_terms = lesson.ai_analysis.get("key_terms", [])
                 
                if detected_lang:
                    lesson.ai_analysis["language"] = detected_lang
                print(f"[Lesson {lesson_id}] AI analysis done.")

            await db.commit()
            print(f"[Lesson {lesson_id}] All done.")
    except Exception as e:
        print(f"[Lesson {lesson_id}] Background task ERROR: {e}")

 
@router.get("/{lesson_id}/video")
async def get_video(lesson_id: int, db: AsyncSession = Depends(get_db)):
    """Serve the uploaded video file."""
    lesson = await _get_or_404(lesson_id, db)
    if not lesson.video_path or not os.path.exists(lesson.video_path):
        raise HTTPException(status_code=404, detail="Video not uploaded yet")
    return FileResponse(lesson.video_path, media_type="video/mp4")


@router.get("/{lesson_id}/vtt", response_class=PlainTextResponse)
async def get_vtt(lesson_id: int, db: AsyncSession = Depends(get_db)):
    """Return WebVTT subtitles for the lesson video."""
    lesson = await _get_or_404(lesson_id, db)
    if not lesson.vtt_subtitles:
        return PlainTextResponse("WEBVTT\n", media_type="text/vtt")
    return PlainTextResponse(lesson.vtt_subtitles, media_type="text/vtt")


 
@router.patch("/{lesson_id}/transcript", response_model=LessonOut)
async def update_transcript(
    lesson_id: int, body: LessonTranscriptUpdate, db: AsyncSession = Depends(get_db)
):
    """Teacher edits/corrects the transcript manually."""
    lesson = await _get_or_404(lesson_id, db)
    lesson.transcript = body.transcript
    
    from app.services.test_generator import detect_language
    lang = detect_language(body.transcript)
    lesson.ai_analysis = await _processor.analyze_transcript(body.transcript, language=lang)
    lesson.ai_analysis["language"] = lang
    lesson.key_terms = lesson.ai_analysis.get("key_terms", [])
    await db.commit()
    await db.refresh(lesson)
    return lesson

 
@router.post("/{lesson_id}/upload-pdf", response_model=LessonOut)
async def upload_pdf(
    lesson_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Завантажити PDF план уроку — текст витягується і стає транскриптом → AI-аналіз."""
    lesson = await _get_or_404(lesson_id, db)
    try:
        from pypdf import PdfReader
        import io
        content = await file.read()
        reader = PdfReader(io.BytesIO(content))
        text = "\n\n".join(page.extract_text() or "" for page in reader.pages).strip()
        if not text:
            raise HTTPException(status_code=400, detail="PDF не містить тексту (можливо сканований документ)")
        lesson.transcript = text
        await db.commit()
        await db.refresh(lesson)
        
        background_tasks.add_task(_analyze_existing_transcript, lesson_id)
        return lesson
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Помилка обробки PDF: {e}")


async def _analyze_existing_transcript(lesson_id: int):
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        lesson = await _get_or_404(lesson_id, db)
        if not lesson.transcript:
            return
        try:
            from app.services.test_generator import detect_language
            lang = detect_language(lesson.transcript)
            lesson.ai_analysis = await _processor.analyze_transcript(lesson.transcript, language=lang)
            lesson.ai_analysis["language"] = lang
            lesson.key_terms = lesson.ai_analysis.get("key_terms", [])
            await db.commit()
            print(f"[Lesson {lesson_id}] PDF AI-аналіз готовий (lang={lang})")
        except Exception as e:
            print(f"[Lesson {lesson_id}] PDF аналіз впав: {e}")


@router.post("/{lesson_id}/transcribe", response_model=LessonOut)
async def retranscribe(
    lesson_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Re-trigger Whisper transcription on already uploaded video."""
    lesson = await _get_or_404(lesson_id, db)
    if not lesson.video_path or not os.path.exists(lesson.video_path):
        raise HTTPException(status_code=400, detail="No video file found")
    background_tasks.add_task(_transcribe_and_analyze, lesson_id, lesson.video_path)
    return lesson


@router.post("/{lesson_id}/analyze", response_model=LessonOut)
async def analyze_lesson(lesson_id: int, db: AsyncSession = Depends(get_db)):
    """(Re-)run AI analysis on existing transcript."""
    lesson = await _get_or_404(lesson_id, db)
    if not lesson.transcript or not lesson.transcript.strip():
        raise HTTPException(status_code=400, detail="Транскрипт порожній. Завантаж відео/PDF або введи текст вручну.")
    from app.services.test_generator import detect_language
    lang = detect_language(lesson.transcript)
    lesson.ai_analysis = await _processor.analyze_transcript(lesson.transcript, language=lang)
    lesson.ai_analysis["language"] = lang
    lesson.key_terms = lesson.ai_analysis.get("key_terms", [])
    await db.commit()
    await db.refresh(lesson)
    return lesson


@router.patch("/{lesson_id}/analysis", response_model=LessonOut)
async def update_analysis(
    lesson_id: int, body: LessonAnalysisUpdate, db: AsyncSession = Depends(get_db)
):
    """Teacher saves edited version of AI analysis."""
    lesson = await _get_or_404(lesson_id, db)
    lesson.ai_analysis = body.ai_analysis
    await db.commit()
    await db.refresh(lesson)
    return lesson

 
@router.post("/{lesson_id}/explain")
async def generate_explanation(lesson_id: int, body: dict, db: AsyncSession = Depends(get_db)):
    """
    Генерує адаптивне пояснення теми для учня на основі транскрипту, його інтересів І когнітивного профілю.
    body: {"interests": [...], "student_id": int (опц.)}
    Якщо переданий student_id — підтягуємо CognitiveProfile (рівень, темп, увагу) для глибшої адаптації.
    """
    lesson = await _get_or_404(lesson_id, db)
    if not lesson.transcript or not lesson.transcript.strip():
        raise HTTPException(status_code=400, detail="Транскрипт уроку порожній")
    interests = body.get("interests", [])
    student_id = body.get("student_id")
    hobby_str = ", ".join(interests[:8]) if interests else ""
    topic = lesson.topic or lesson.subject
 
    profile_block = ""
    if student_id:
        from app.models import CognitiveProfile
        prof_res = await db.execute(
            select(CognitiveProfile).where(CognitiveProfile.student_id == int(student_id))
        )
        prof = prof_res.scalar_one_or_none()
        if prof:
            
            if prof.knowledge_level < 50:
                depth_hint = "ПОЧИНАЙ ВІД АЗІВ. Кожне поняття розжовуй через приклад. Уникай складних термінів — якщо вживаєш, одразу пояснюй своїми словами. Більше повторень. Більше акцентів на основах."
            elif prof.knowledge_level < 75:
                depth_hint = "СЕРЕДНІЙ РІВЕНЬ. Бази коротко (1-2 речення), основна увага — на нових поняттях. Зв'язуй з раніше вивченим. Приклади середньої складності."
            else:
                depth_hint = "ВИСОКИЙ РІВЕНЬ. Можна одразу до суті. Менше повторень, більше нюансів, винятків, складніших прикладів. Доречно згадати міжпредметні зв'язки."

            
            pace_val = prof.learning_pace.value if hasattr(prof.learning_pace, 'value') else str(prof.learning_pace)
            if pace_val == "slow":
                pace_hint = "Темп ПОВІЛЬНИЙ → коротші речення, ключові слова частіше повторюй, кожен абзац коротший (3-4 речення), додай більше проміжних кроків у прикладах."
            elif pace_val == "fast":
                pace_hint = "Темп ШВИДКИЙ → можна компактніше і щільніше, без зайвих повторень, можна давати більш концептуальні зв'язки."
            else:
                pace_hint = "Темп СЕРЕДНІЙ → стандартна подача, абзаци по 4-5 речень."

            
            if prof.engagement_score < 50:
                engage_hint = "Залученість НИЗЬКА → починай з ЯСКРАВОГО гачка (питання-інтрига, історія, парадокс). Емоційні маркери. Конкретні приклади з життя замість абстракції. Часті звертання у другій особі ('уяви', 'спробуй', 'а тепер ти')."
            else:
                engage_hint = "Залученість ВИСОКА → можна одразу до контенту, не треба переборщувати з мотиваційним вступом."

            profile_block = (
                "\n\nКОГНІТИВНИЙ ПРОФІЛЬ УЧНЯ (АДАПТУЙСЯ ПІД НЬОГО):\n"
                f"- {depth_hint}\n"
                f"- {pace_hint}\n"
                f"- {engage_hint}\n"
            )
            print(f"[/explain] student={student_id} knowledge={prof.knowledge_level:.0f} pace={pace_val} engagement={prof.engagement_score:.0f}", flush=True)
 
    main_hobbies = interests[:2] if interests else []
    main_hobby_str = " і ".join(main_hobbies)
    hobby_instruction = (
        f"ВАЖЛИВО ПРО ХОБІ: учень захоплюється {main_hobby_str}. "
        f"Використовуй ТІЛЬКИ ці захоплення (не більше двох). "
        f"Вплети аналогію з {main_hobbies[0]} природно у текст пояснення. "
        f"Кожен такий приклад-аналогія = РОВНО 2 РЕЧЕННЯ всередині абзацу пояснення (не окремим блоком). "
        f"Не починай кожен абзац з 'Уяви'/'Як у' — органічно вплети 1-2 такі аналогії на весь блок."
    ) if main_hobbies else "У учня немає вказаних хобі — пояснюй простими життєвими прикладами."

    prompt = (
        f"Ти — досвідчений педагог, який ПЕРЕКАЗУЄ урок учневі простішою мовою. "
        f"Тема: '{topic}', предмет: '{lesson.subject}'. "
        f"{hobby_instruction}"
        f"{profile_block}\n\n"
        "ПРАВИЛА МОВИ (КРИТИЧНО):\n"
        "- Якщо предмет = 'Англійська мова' → ОСНОВНІ ТЕРМІНИ англійською, пояснення — українською.\n"
        "- Решта предметів → ВСЕ українською.\n"
        "- ЗАБОРОНЕНО: китайські, японські, корейські символи.\n\n"
        "СТРУКТУРА ВІДПОВІДІ:\n\n"
        "1. ORIGINAL_EXPLANATION — це ДОСЛІВНИЙ ТРАНСКРИПТ з відео уроку (те що казав вчитель). "
        "Поверни ЯК Є, розбитий на 6-10 абзаців. БЕЗ переказу, БЕЗ скорочень, БЕЗ пояснень. "
        "Тільки структуруй текст — розбий на абзаци і прибери явний шум/повтори. Це СИРИЙ текст вчителя.\n\n"
        "2. ADAPTED_EXPLANATION — це твій ПЕРЕКАЗ простішою мовою:\n"
        "   - МІНІМУМ 15 ПРОНУМЕРОВАНИХ РЕЧЕНЬ-ПОЯСНЕНЬ (не прикладів — самих пояснень).\n"
        "   - Розбий на 4-6 абзаців.\n"
        "   - Усередині 1-2 абзаців вплети аналогію з хобі учня. Кожна аналогія = РІВНО 2 РЕЧЕННЯ (не більше, не окремим блоком).\n"
        "   - Не повторюй той самий хобі-приклад двічі. Використовуй не більше 2 хобі за весь блок.\n"
        "   - Виділяй **жирним** ключові терміни.\n"
        "   - Уникай 'Уяви футбольний м'яч' на початку кожного абзацу — це штучно.\n"
        "   - Якщо учень має РІВЕНЬ ЗНАНЬ < 50% → пояснюй ще простіше, більше аналогій з життя.\n\n"
        "3. EXAMPLES — 2-3 повних прикладі з покроковим розв'язанням (тут вже можуть бути сценарії з хобі).\n"
        "4. SELFCHECK — 3-5 multiple choice питань.\n"
        "5. ENCOURAGE — 1-2 теплі речення підтримки.\n\n"
        "Поверни ТІЛЬКИ валідний JSON:\n"
        "{\n"
        '  "original_explanation": ["абзац1 (дослівно)", ...],\n'
        '  "adapted_explanation": ["абзац-переказ1", "абзац-переказ2", ...],\n'
        '  "examples": [{"title": "...", "solution": "..."}],\n'
        '  "selfcheck": [{"q": "...", "type": "choice", "options": ["A","B","C","D"], "correct": 0}],\n'
        '  "encourage": "..."\n'
        "}"
    )
    
    ai_analysis = lesson.ai_analysis if isinstance(lesson.ai_analysis, dict) else {}
    key_terms = lesson.key_terms or ai_analysis.get("key_terms", []) or []
    summary = ai_analysis.get("summary", "") or ""

    user_parts = [f"ТЕМА УРОКУ: {topic}", f"ПРЕДМЕТ: {lesson.subject}"]
    if summary:
        user_parts.append(f"\nКОРОТКИЙ ОГЛЯД (з попереднього AI-аналізу):\n{summary}")
    if key_terms:
        user_parts.append(f"\nКЛЮЧОВІ ТЕРМІНИ (обов'язково розкрий КОЖЕН): {', '.join(key_terms[:15])}")
 
    full_t = lesson.transcript
    if len(full_t) > 12000:
        transcript_section = full_t[:8000] + "\n\n[...середина уроку пропущена...]\n\n" + full_t[-3000:]
    else:
        transcript_section = full_t
    user_parts.append(f"\nПОВНИЙ ТРАНСКРИПТ УРОКУ:\n{transcript_section}")
    user_msg = "\n".join(user_parts)

    print(f"[/explain] lesson={lesson_id} transcript={len(full_t)}ch key_terms={len(key_terms)} summary={bool(summary)}", flush=True)

    try:
        from app.services.lesson_processor import _get_groq, _get_openai
        try:
            groq = _get_groq()
            r = await groq.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role":"system","content":prompt},
                          {"role":"user","content":user_msg}],
                response_format={"type":"json_object"})
            import json as _json
            return _json.loads(r.choices[0].message.content)
        except Exception as eg:
            print(f"[Groq explain] {eg}, fallback OpenAI")
            oai = _get_openai()
            r = await oai.chat.completions.create(
                model="gpt-4o-mini",
                response_format={"type":"json_object"},
                messages=[{"role":"system","content":prompt},
                          {"role":"user","content":user_msg}])
            import json as _json
            return _json.loads(r.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI не зміг сформувати пояснення: {e}")


@router.get("/{lesson_id}/sensors")
async def get_sensor_data(lesson_id: int, db: AsyncSession = Depends(get_db)):
    """Дані з датчиків (камера/термостат/мікрофон) для уроку.
    Якщо подій ще не сідано — створюємо мокову серію на льоту."""
    from app.models import RobotEvent, EventTypeEnum
    from sqlalchemy import desc
    result = await db.execute(
        select(RobotEvent).where(RobotEvent.session_id == lesson_id)
        .order_by(desc(RobotEvent.timestamp)).limit(50)
    )
    events = result.scalars().all()
    if not events:
 
        lesson = await _get_or_404(lesson_id, db)
        await _seed_sensor_events_for_lesson(db, lesson_id, topic=(lesson.topic or lesson.subject))
        result = await db.execute(
            select(RobotEvent).where(RobotEvent.session_id == lesson_id)
            .order_by(desc(RobotEvent.timestamp)).limit(50)
        )
        events = result.scalars().all()
    if not events:
        return None
    thermal = [e.payload for e in events if e.type == EventTypeEnum.thermal]
    audio = [e.payload for e in events if e.type == EventTypeEnum.audio]
    video = [e.payload for e in events if e.type == EventTypeEnum.video]
    latest_thermal = thermal[0] if thermal else None
   
    all_attention = []
    for t in thermal:
        sc = t.get("attention_scores", [])
        if sc:
            all_attention.extend(sc)
    avg_attention = round(sum(all_attention) / len(all_attention), 1) if all_attention else None
    
    temps = [t.get("temperature_c") for t in thermal if t.get("temperature_c") is not None]
    hums = [t.get("humidity_percent") for t in thermal if t.get("humidity_percent") is not None]
    avg_temp = round(sum(temps) / len(temps), 1) if temps else None
    avg_humid = round(sum(hums) / len(hums), 1) if hums else None
    return {
        "avg_attention": avg_attention,
        "avg_temperature": avg_temp,
        "avg_humidity": avg_humid,
        "latest_thermal": latest_thermal,
        "audio_events_count": len(audio),
        "video_keywords": [k for v in video for k in v.get("keywords", [])][:20],
        "attention_timeline": [round(sum(t.get("attention_scores", []))/max(1,len(t.get("attention_scores", []))), 1) for t in thermal[:12]][::-1],
    }


@router.get("/{lesson_id}/audio_events")
async def get_audio_events(lesson_id: int, db: AsyncSession = Depends(get_db)):
    """Окремі аудіо-події (питання/відповіді/шум) уроку — для деталізації UI."""
    from app.models import RobotEvent, EventTypeEnum
    from sqlalchemy import asc
    result = await db.execute(
        select(RobotEvent).where(
            RobotEvent.session_id == lesson_id,
            RobotEvent.type == EventTypeEnum.audio
        ).order_by(asc(RobotEvent.timestamp))
    )
    events = result.scalars().all()
    return [
        {**(e.payload or {}), "timestamp": e.payload.get("timestamp") if e.payload else None}
        for e in events
    ]


@router.patch("/{lesson_id}/access", response_model=LessonOut)
async def set_student_access(
    lesson_id: int, body: LessonAccessUpdate, db: AsyncSession = Depends(get_db)
):
    """Toggle whether students of this class can see the transcript."""
    lesson = await _get_or_404(lesson_id, db)
    lesson.student_access = body.student_access
    await db.commit()
    await db.refresh(lesson)
    return lesson
