"""
ProfileEngine — оновлює CognitiveProfile після кожного тесту.

Нова версія використовує:
  • BKT (Bayesian Knowledge Tracing) для per-skill mastery замість EMA
  • Сенсорика термокамери/мікрофону → engagement_score
  • typical_errors — топ-5 повторюваних помилок з результатів тестів
  • learning_pace — на основі тренду останніх тестів

Результат:
  • profile.skills = {skill: 0..1} — справжній граф володіння
  • profile.knowledge_level — агрегат для UI (середнє по skills * 100)
  • profile.typical_errors — список повторюваних помилок
"""
from __future__ import annotations
import statistics
from collections import Counter
from datetime import datetime
from typing import Iterable

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import CognitiveProfile, TestResult, PaceEnum
from app.services.bkt import BKT, update_skills, aggregate_knowledge_level

 
_BKT = BKT()


class ProfileEngine:
    async def update_after_test(
        self,
        db: AsyncSession,
        student_id: int,
        test_score: float,
        thermal_scores: list[float],
        audio_events: list[dict],
        skill_observations: dict[str, bool] | None = None,
        recent_errors: list[str] | None = None,
    ) -> CognitiveProfile:
        """
        skill_observations: {skill_name: True/False} — окремі навички, по яких
            учень показав знання чи помилку. Якщо None — деградуємо до однієї
            навички "Загальна" (на основі test_score >= 60).
        recent_errors: список текстових помилок з цього тесту → typical_errors.
        """
        result = await db.execute(
            select(CognitiveProfile).where(CognitiveProfile.student_id == student_id)
        )
        profile = result.scalar_one_or_none()
        if profile is None:
            profile = CognitiveProfile(student_id=student_id, skills={})
            db.add(profile)
 
        existing_skills: dict[str, float] = dict(profile.skills or {})
        if skill_observations is None:
            
            skill_observations = {"Загальна": test_score >= 60}
        new_skills = update_skills(existing_skills, skill_observations, _BKT)
        profile.skills = new_skills
        profile.knowledge_level = aggregate_knowledge_level(new_skills)
 
        if thermal_scores:
            mean_thermal = statistics.mean(thermal_scores)
        else:
            mean_thermal = 50.0
        answer_events = [e for e in audio_events if e.get("type") == "answer"]
        audio_activity_rate = (len(answer_events) / max(len(audio_events), 1)) * 100
 
        new_engagement = 0.6 * mean_thermal + 0.4 * audio_activity_rate
        profile.engagement_score = round(
            0.7 * (profile.engagement_score or 50.0) + 0.3 * new_engagement, 1
        )
 
        if recent_errors:
            existing_errors = list(profile.typical_errors or [])
            existing_errors.extend(recent_errors)
            counts = Counter(existing_errors)
            profile.typical_errors = [e for e, _ in counts.most_common(5)]
 
        history = await db.execute(
            select(TestResult)
            .where(TestResult.student_id == student_id)
            .order_by(TestResult.completed_at.desc())
            .limit(4)
        )
        past_results = history.scalars().all()
        if len(past_results) >= 3:
            scores = [r.score for r in reversed(past_results)]
             
            deltas = [scores[i+1] - scores[i] for i in range(len(scores)-1)]
            avg_delta = sum(deltas) / len(deltas)
            if avg_delta < 2:
                profile.learning_pace = PaceEnum.slow
            elif avg_delta > 8:
                profile.learning_pace = PaceEnum.fast
            else:
                profile.learning_pace = PaceEnum.medium

        profile.last_updated = datetime.utcnow()
        await db.commit()
        await db.refresh(profile)
        return profile


def derive_skill_observations(
    questions: list[dict],
    answers: dict[str, int],
    skill_map: dict[int, str] | None = None,
) -> dict[str, bool]:
    """Допоміжна функція: дістає {skill: correct?} зі списку питань і відповідей.
    skill_map — необов'язкова мапа question_index → skill_name. Якщо нема,
    використовуємо question["skill"] поле."""
    obs: dict[str, list[bool]] = {}
    for i, q in enumerate(questions):
        skill = (
            (skill_map or {}).get(i)
            or q.get("skill")
            or q.get("topic")
            or "Загальна"
        )
        correct_idx = q.get("correct_index")
        chosen_idx = answers.get(str(i))
        is_correct = (chosen_idx == correct_idx)
        obs.setdefault(skill, []).append(is_correct)
 
    return {skill: (sum(arr) / len(arr) >= 0.6) for skill, arr in obs.items()}
