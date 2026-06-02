import json
import os
import redis.asyncio as aioredis
from app.models import CognitiveProfile, Trajectory
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select


def _get_ai_client():
    groq_key = os.getenv("GROQ_API_KEY", "")
    if groq_key and "твій-ключ" not in groq_key:
        from groq import AsyncGroq
        return "groq", AsyncGroq(api_key=groq_key)
    openai_key = os.getenv("OPENAI_API_KEY", "")
    if openai_key:
        from openai import AsyncOpenAI
        return "openai", AsyncOpenAI(api_key=openai_key)
    return None, None

_TOPIC_MAP = {
    "repeat": ["Повторення: основні поняття", "Практика базових задач", "Закріплення матеріалу"],
    "standard": ["Нова тема: розширені поняття", "Практичні завдання середнього рівня", "Зв'язок з реальним світом"],
    "advanced": ["Поглиблене вивчення", "Дослідницькі задачі", "Міжпредметні зв'язки"],
}


class TrajectoryEngine:
    def __init__(self, redis_url: str = None):
        self._redis_url = redis_url or os.getenv("REDIS_URL", "redis://redis:6379/0")
        self._redis: aioredis.Redis | None = None

    async def _get_redis(self) -> aioredis.Redis:
        if self._redis is None:
            self._redis = await aioredis.from_url(self._redis_url, decode_responses=True)
        return self._redis

    def _determine_level(self, knowledge: float) -> str:
        if knowledge < 60:
            return "repeat"
        elif knowledge < 80:
            return "standard"
        return "advanced"

    async def _adapt_with_ai(self, topics: list[str], interests: list[str]) -> list[str]:
        if not interests:
            return topics
        provider, ai_client = _get_ai_client()
        if not ai_client:
            return topics
        try:
            interests_str = ", ".join(interests[:5])
            msgs = [
                {"role": "system", "content": "Адаптуй теми навчання до інтересів учня українською. Поверни JSON: {\"topics\": [\"тема1\", \"тема2\", \"тема3\"]}"},
                {"role": "user", "content": f"Теми: {topics}\nІнтереси учня: {interests_str}\nПерепиши теми з прив'язкою до інтересів."},
            ]
            if provider == "groq":
                response = await ai_client.chat.completions.create(model="llama-3.3-70b-versatile", messages=msgs, response_format={"type": "json_object"})
            else:
                response = await ai_client.chat.completions.create(model="gpt-4o-mini", messages=msgs, response_format={"type": "json_object"})
            data = json.loads(response.choices[0].message.content)
            return data.get("topics", topics)
        except Exception:
            return topics

    async def update(self, db: AsyncSession, student_id: int, profile: CognitiveProfile) -> Trajectory:
        level = self._determine_level(profile.knowledge_level)
        base_topics = _TOPIC_MAP[level].copy()

        cache_key = f"traj:{student_id}:{level}"
        redis = await self._get_redis()
        cached = await redis.get(cache_key)

        if cached:
            adapted_topics = json.loads(cached)
        else:
            adapted_topics = await self._adapt_with_ai(base_topics, profile.interests or [])
            await redis.set(cache_key, json.dumps(adapted_topics), ex=86400)

        result = await db.execute(
            select(Trajectory).where(Trajectory.student_id == student_id)
        )
        trajectory = result.scalar_one_or_none()

        if trajectory is None:
            trajectory = Trajectory(student_id=student_id, topics=adapted_topics)
            db.add(trajectory)
        else:
            trajectory.topics = adapted_topics

        await db.commit()
        await db.refresh(trajectory)
        return trajectory
