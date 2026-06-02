"""
Lesson processing pipeline:
  video/audio file → Whisper API → VTT subtitles + plain text
                          ↓
                  OpenAI GPT-4o-mini → topic, key terms, AI recommendations
"""

import asyncio
import json
import os
import re
import spacy

_nlp = None
_openai_client = None
_groq_client = None
_whisper_model = None


def _get_nlp():
    global _nlp
    if _nlp is None:
        _nlp = spacy.load("en_core_web_sm")
    return _nlp


def _get_openai():
    global _openai_client
    if _openai_client is None:
        from openai import AsyncOpenAI
        key = os.getenv("OPENAI_API_KEY", "")
        if not key:
            raise RuntimeError("OPENAI_API_KEY is not set in environment")
        _openai_client = AsyncOpenAI(api_key=key)
    return _openai_client


def _get_groq():
    global _groq_client
    if _groq_client is None:
        from groq import AsyncGroq
        key = os.getenv("GROQ_API_KEY", "")
        if not key or "твій-ключ" in key:
            raise RuntimeError("GROQ_API_KEY is not set")
        _groq_client = AsyncGroq(api_key=key)
    return _groq_client


def _get_whisper_model():
    """Локальна faster-whisper модель — безкоштовна, без обмежень.
    Пробуємо моделі від великої до малої — якщо "base" не завантажилась,
    автоматично відкочуємось на "tiny" (~75 МБ)."""
    global _whisper_model
    if _whisper_model is not None:
        return _whisper_model
    from faster_whisper import WhisperModel
   
    preferred = os.getenv("WHISPER_MODEL_SIZE", "base")
    candidates = [preferred] + [m for m in ("base", "tiny") if m != preferred]
    last_err: Exception | None = None
    for size in candidates:
        try:
            print(f"[faster-whisper] Завантаження моделі '{size}'...", flush=True)
            _whisper_model = WhisperModel(size, device="cpu", compute_type="int8")
            print(f"[faster-whisper] Модель '{size}' готова", flush=True)
            return _whisper_model
        except Exception as e:
            last_err = e
            print(f"[faster-whisper] Модель '{size}' не завантажилась: {type(e).__name__}: {e}", flush=True)
    raise RuntimeError(f"Не вдалося завантажити жодну faster-whisper модель: {last_err}")


def _transcribe_local(audio_path: str) -> dict:
    """Транскрипція через локальну faster-whisper. Безкоштовно, без лімітів.
    Спершу визначаємо мову, потім транскрибуємо з цією мовою для кращої якості."""
    model = _get_whisper_model()
 
    try:
        detected_lang, lang_prob = _detect_language(model, audio_path)
        print(f"[faster-whisper] Визначена мова: {detected_lang} (впевненість {lang_prob:.0%})", flush=True)
    except Exception as e:
        print(f"[faster-whisper] Не вдалось визначити мову: {type(e).__name__}: {e}. Використовую авто-детекцію.", flush=True)
        detected_lang = None
 
    segments_iter, info = model.transcribe(
        audio_path,
        language=detected_lang,
        vad_filter=True,
        beam_size=5,
    )
    segments = []
    for seg in segments_iter:
        segments.append({"start": seg.start, "end": seg.end, "text": seg.text.strip()})
    text = " ".join(s["text"] for s in segments)
     
    vtt_lines = ["WEBVTT", ""]
    for i, s in enumerate(segments, 1):
        vtt_lines += [str(i), f"{_fmt_vtt_time(s['start'])} --> {_fmt_vtt_time(s['end'])}", s["text"], ""]
    vtt = "\n".join(vtt_lines)
    print(f"[faster-whisper] Готово: {len(text)} chars, {len(segments)} сегментів, мова={info.language}", flush=True)
    return {"text": text, "vtt": vtt, "language": info.language}


def _detect_language(model, audio_path: str) -> tuple[str, float]:
    """Визначає мову аудіо через faster-whisper. Використовує перші ~30 сек.
    Повертає (код_мови, ймовірність)."""
     
    from faster_whisper.audio import decode_audio
    audio = decode_audio(audio_path, sampling_rate=model.feature_extractor.sampling_rate)
    
    sample = audio[: 30 * model.feature_extractor.sampling_rate]
    features = model.feature_extractor(sample)
    encoder_output = model.encode(features)
    results = model.model.detect_language(encoder_output)
     
    if not results or not results[0]:
        return "uk", 0.0
    top = results[0][0] if isinstance(results[0], list) else results[0]
    lang_code, prob = top[0], top[1]
     
    lang_code = lang_code.strip("<|>")
    return lang_code, float(prob)


def _fmt_vtt_time(seconds: float) -> str:
    """Convert seconds to WebVTT timestamp HH:MM:SS.mmm"""
    if seconds < 0:
        seconds = 0
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds - h * 3600 - m * 60
    return f"{h:02d}:{m:02d}:{s:06.3f}"


def _vtt_to_text(vtt: str) -> str:
    """Extract plain text from WebVTT string."""
    lines = []
    for line in vtt.splitlines():
        line = line.strip()
        if not line:
            continue
        if line == "WEBVTT":
            continue
        if "-->" in line:
            continue
        if re.match(r"^\d+$", line):
            continue
        lines.append(line)
    return " ".join(lines)


class LessonProcessor:

    async def _extract_audio(self, video_path: str) -> str:
        """
        Extract compressed mono audio from video using ffmpeg.
        Returns path to the .mp3 file.
        64kbps mono is enough for speech recognition and keeps file small:
          45-min lesson ≈ 21 MB (under 25 MB Whisper limit).
        """
        audio_path = video_path.rsplit(".", 1)[0] + "_audio.mp3"
        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-vn",                     
            "-ar", "16000",            
            "-ac", "1",                
            "-b:a", "64k",             
            audio_path,
        ]
        print(f"[ffmpeg] Extracting audio: {' '.join(cmd)}")
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await proc.communicate()
        if proc.returncode != 0:
            raise RuntimeError(f"ffmpeg failed: {stderr.decode()[-500:]}")
        size_mb = os.path.getsize(audio_path) / (1024 * 1024)
        print(f"[ffmpeg] Audio extracted: {audio_path} ({size_mb:.1f} MB)")
        return audio_path

    async def transcribe_video(self, video_path: str) -> dict:
        """
        Pipeline (БЕЗКОШТОВНО, БЕЗ ОБМЕЖЕНЬ):
          1. Extract compressed audio via ffmpeg
          2. Транскрибуємо через ЛОКАЛЬНУ faster-whisper модель → VTT субтитри
          3. OpenAI Whisper як fallback тільки якщо локальна впала
        """
      
        try:
            audio_path = await self._extract_audio(video_path)
        except Exception as e:
            print(f"[ffmpeg] Extraction failed: {e}")
            audio_path = video_path

        audio_size_mb = os.path.getsize(audio_path) / (1024 * 1024)
        print(f"[Transcribe] Файл: {audio_size_mb:.1f} МБ")

         
        import traceback
        local_error: str | None = None
        try:
            print(f"[faster-whisper] Старт транскрипції файлу {audio_path}...", flush=True)
            result = await asyncio.get_event_loop().run_in_executor(None, _transcribe_local, audio_path)
            if audio_path != video_path and os.path.exists(audio_path):
                os.remove(audio_path)
            return result
        except Exception as e_local:
            local_error = f"{type(e_local).__name__}: {e_local}"
            print(f"[faster-whisper] Локальна транскрипція впала:\n{traceback.format_exc()}", flush=True)

        
        openai_key = os.getenv("OPENAI_API_KEY", "").strip()
        if not openai_key:
            if audio_path != video_path and os.path.exists(audio_path):
                os.remove(audio_path)
            return {"text": "", "vtt": None,
                    "error": f"Локальна транскрипція не вдалася ({local_error}). OpenAI ключа теж немає — увімкни faster-whisper або додай ключ."}

        try:
            if audio_size_mb > 24.5:
                if audio_path != video_path and os.path.exists(audio_path):
                    os.remove(audio_path)
                return {"text": "", "vtt": None,
                        "error": f"faster-whisper впала ({local_error}). Аудіо {audio_size_mb:.0f} МБ перевищує 25 МБ для OpenAI."}
            client = _get_openai()
            with open(audio_path, "rb") as f:
                vtt_str = await client.audio.transcriptions.create(
                    model="whisper-1", file=f, response_format="vtt")
            vtt_str = str(vtt_str)
            text = _vtt_to_text(vtt_str)
            if audio_path != video_path and os.path.exists(audio_path):
                os.remove(audio_path)
            return {"text": text, "vtt": vtt_str}
        except Exception as e_api:
            if audio_path != video_path and os.path.exists(audio_path):
                os.remove(audio_path)
            err_msg = str(e_api)
            if "429" in err_msg or "quota" in err_msg.lower():
                return {"text": "", "vtt": None,
                        "error": f"faster-whisper впала: {local_error}. OpenAI ключ вичерпаний. ВИРІШЕННЯ: 1) перевір логи API на причину faster-whisper 2) або додай кредитів на platform.openai.com"}
            return {"text": "", "vtt": None,
                    "error": f"faster-whisper: {local_error} | OpenAI: {err_msg}"}

    async def analyze_transcript(self, transcript: str, language: str | None = None) -> dict:
        """
        Groq (primary) або GPT-4o-mini (fallback) аналізує транскрипт.
        Підтримує укр (за замовч.) і англ — аналіз генерується мовою уроку.
        """
        if not transcript.strip():
            return _empty_analysis()
 
        lang = (language or "").lower()
        if lang.startswith("en"):
            prompt = (
                "You are a pedagogical AI analyst. Analyze this lesson transcript "
                "and return JSON IN ENGLISH:\n"
                "{\n"
                '  "topic": "short topic name (3-7 words)",\n'
                '  "key_terms": ["term1", "term2", ...up to 10],\n'
                '  "summary": "concise overview (2-3 sentences)",\n'
                '  "strengths": ["strength 1", "2", "3"],\n'
                '  "improvements": ["what to improve 1", "2", "3"],\n'
                '  "at_risk_indicators": ["risk signal 1", "2"],\n'
                '  "next_lesson": "recommendations for the next lesson"\n'
                "}\n"
                "All values MUST be in English. Reply with ONLY valid JSON, no markdown."
            )
            user_prefix = "Transcript:"
        else:
            prompt = (
                "Ти — педагогічний AI-аналітик. Проаналізуй транскрипт уроку і поверни JSON УКРАЇНСЬКОЮ:\n"
                "{\n"
                '  "topic": "коротка назва теми (3-7 слів)",\n'
                '  "key_terms": ["термін1", "термін2", ...до 10],\n'
                '  "summary": "стислий огляд (2-3 речення)",\n'
                '  "strengths": ["сильна сторона 1", "2", "3"],\n'
                '  "improvements": ["що покращити 1", "2", "3"],\n'
                '  "at_risk_indicators": ["ознака ризику 1", "2"],\n'
                '  "next_lesson": "рекомендації до наступного уроку"\n'
                "}\n"
                "Усі значення мають бути УКРАЇНСЬКОЮ. Відповідай ТІЛЬКИ валідним JSON."
            )
            user_prefix = "Транскрипт:"
 
        try:
            groq = _get_groq()
            response = await groq.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": f"{user_prefix}\n\n{transcript[:4000]}"},
                ],
                response_format={"type": "json_object"},
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e_groq:
            print(f"[Groq] Analysis failed: {e_groq} — trying OpenAI")
 
        try:
            openai = _get_openai()
            response = await openai.chat.completions.create(
                model="gpt-4o-mini",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": f"{user_prefix}\n\n{transcript[:4000]}"},
                ],
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e_openai:
            print(f"[OpenAI] Analysis failed: {e_openai} — spaCy fallback")
            return _spacy_analysis(transcript)

    def extract_terms(self, text: str) -> list[str]:
        nlp = _get_nlp()
        doc = nlp(text)
        seen: set = set()
        terms = []
        for chunk in doc.noun_chunks:
            if chunk.root.pos_ in ("NOUN", "PROPN") and len(chunk.text) > 2:
                normalized = chunk.text.lower().strip()
                if normalized not in seen:
                    seen.add(normalized)
                    terms.append(chunk.text.strip())
        return terms[:20]


def _spacy_analysis(text: str) -> dict:
    """Fallback analysis using spaCy when OpenAI is unavailable."""
    terms = []
    try:
        nlp = _get_nlp()
        doc = nlp(text[:3000])
        seen: set = set()
        for chunk in doc.noun_chunks:
            t = chunk.text.strip().lower()
            if len(t) > 3 and t not in seen:
                seen.add(t)
                terms.append(chunk.text.strip())
            if len(terms) >= 10:
                break
    except Exception:
        pass
    words = text.split()
    topic = " ".join(words[:6]) + "..." if len(words) > 6 else text[:40]
    return {
        "topic": topic,
        "key_terms": terms,
        "summary": text[:300] + "..." if len(text) > 300 else text,
        "strengths": ["Транскрипт отримано успішно"],
        "improvements": ["Додай кредити OpenAI для повного AI-аналізу"],
        "at_risk_indicators": [],
        "next_lesson": "Для детальних рекомендацій потрібен OpenAI API ключ з балансом.",
    }



def _empty_analysis() -> dict:
    return {
        "topic": "Тема не визначена",
        "key_terms": [],
        "summary": "",
        "strengths": [],
        "improvements": [],
        "at_risk_indicators": [],
        "next_lesson": "",
    }
