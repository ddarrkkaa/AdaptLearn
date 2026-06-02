import json
import os
import re

_FALLBACK_QUESTIONS = [
    {"question": "Що таке інерція?", "options": ["Властивість тіл зберігати стан руху", "Сила тяжіння", "Швидкість світла", "Одиниця виміру маси"], "correct_index": 0, "explanation": "Інерція — властивість тіл зберігати стан спокою або рівномірного прямолінійного руху."},
    {"question": "Яка одиниця виміру сили у системі СІ?", "options": ["Джоуль", "Ватт", "Ньютон", "Паскаль"], "correct_index": 2, "explanation": "Сила вимірюється в ньютонах (Н) у системі СІ."},
    {"question": "Що описує другий закон Ньютона?", "options": ["Закон всесвітнього тяжіння", "F = ma", "Закон збереження енергії", "Закон збереження імпульсу"], "correct_index": 1, "explanation": "Другий закон Ньютона: F = ma."},
]

 
_LANG_MAP = {
    "uk": ("Ukrainian", "українською мовою"),
    "ru": ("Russian", "російською мовою"),
    "en": ("English", "in English"),
    "pl": ("Polish", "po polsku"),
    "de": ("German", "auf Deutsch"),
    "fr": ("French", "en français"),
    "es": ("Spanish", "en español"),
    "it": ("Italian", "in italiano"),
}


def detect_language(text: str) -> str:
    """Простий детектор мови по символах. uk/ru → кирилиця, en → латиниця."""
    if not text or not text.strip():
        return "uk"
    cyr = len(re.findall(r"[А-Яа-яҐґЄєІіЇї]", text))
    lat = len(re.findall(r"[A-Za-z]", text))
    if cyr == 0 and lat == 0:
        return "uk"
    if cyr > lat: 
        if re.search(r"[ҐґЄєІіЇї]", text):
            return "uk"
        return "ru" if re.search(r"[ЁёЪъЫыЭэ]", text) else "uk"
    return "en"


def _lang_instruction(lang_code: str) -> tuple[str, str]:
    """Повертає (англійську назву, інструкцію якою мовою писати)."""
    return _LANG_MAP.get(lang_code, _LANG_MAP["uk"])


def _get_groq():
    from groq import AsyncGroq
    key = os.getenv("GROQ_API_KEY", "")
    if not key or "твій-ключ" in key:
        raise RuntimeError("GROQ_API_KEY not set")
    return AsyncGroq(api_key=key)


def _get_openai():
    from openai import AsyncOpenAI
    key = os.getenv("OPENAI_API_KEY", "")
    if not key:
        raise RuntimeError("OPENAI_API_KEY not set")
    return AsyncOpenAI(api_key=key)


class TestGenerator:
    async def generate(
        self,
        transcript: str,
        key_terms: list[str],
        n: int = 4,
        language: str | None = None,
        profile: dict | None = None,
    ) -> list[dict]:
        """
        profile (опційно): {"knowledge_level": 0-100, "pace": "slow|medium|fast", "engagement_score": 0-100}
        Якщо переданий — кількість і складність питань підлаштовуються під учня.
        """ 
        lang_code = (language or detect_language(transcript)).lower()
        lang_name, lang_hint = _lang_instruction(lang_code)
 
        difficulty_hint = ""
        if profile:
            knowledge = float(profile.get("knowledge_level", 50))
            pace = str(profile.get("pace", "medium")).lower() 
            if knowledge < 50:
                n = max(3, min(n, 4))
                difficulty_hint = (
                    "Difficulty: EASY. Questions should test basic recall and direct understanding. "
                    "Distractors (wrong options) should be clearly different from the correct answer. "
                    "Use simple, short phrasing."
                )
            elif knowledge < 75:
                n = max(4, min(n, 5))
                difficulty_hint = (
                    "Difficulty: MEDIUM. Mix recall and application questions. "
                    "Distractors should be plausible but distinguishable. "
                    "Standard phrasing."
                )
            else:
                n = max(5, min(n + 2, 7))
                difficulty_hint = (
                    "Difficulty: HARD. Most questions should require application, analysis, or comparison. "
                    "Distractors should be close to the correct answer (common misconceptions, near-correct values). "
                    "Include 1-2 tricky edge-case questions."
                )
             
            if pace == "slow":
                n = max(3, n - 1)
                difficulty_hint += " The student learns SLOWLY — keep questions short and unambiguous."
            elif pace == "fast":
                n = min(n + 1, 8)
                difficulty_hint += " The student learns FAST — feel free to ask deeper conceptual questions."

        print(f"[TestGen] Мова: {lang_code}; n={n}; profile={profile}", flush=True)

        terms_str = ", ".join(key_terms[:10]) if key_terms else "—"
        prompt_sys = (
            f"You are a generator of educational multiple-choice tests. "
            f"Based on the lesson transcript and key terms, generate {n} questions "
            f"in {lang_name} ({lang_hint}). "
            f"{difficulty_hint} "
            f"ALL question text, options, and explanations MUST be written {lang_hint}. "
            f"Do not mix languages. Do not use Chinese/Japanese/Korean characters. "
            "Return ONLY valid JSON: "
            '{"questions": [{"question": "...", "options": ["A","B","C","D"], "correct_index": 0, "explanation": "..."}]}'
        )
        prompt_user = f"Key terms: {terms_str}\n\nTranscript:\n{transcript[:3000]}"
 
        try:
            groq = _get_groq()
            response = await groq.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "system", "content": prompt_sys}, {"role": "user", "content": prompt_user}],
                response_format={"type": "json_object"},
            )
            data = json.loads(response.choices[0].message.content)
            return data.get("questions", data) if isinstance(data, dict) else data
        except Exception as e:
            print(f"[TestGen Groq] {e}")
 
        try:
            oai = _get_openai()
            response = await oai.chat.completions.create(
                model="gpt-4o-mini",
                response_format={"type": "json_object"},
                messages=[{"role": "system", "content": prompt_sys}, {"role": "user", "content": prompt_user}],
            )
            data = json.loads(response.choices[0].message.content)
            return data.get("questions", data) if isinstance(data, dict) else data
        except Exception as e:
            print(f"[TestGen OpenAI] {e}")

        return _FALLBACK_QUESTIONS
