"""
Bayesian Knowledge Tracing (BKT) — стандартна педагогічна модель з 4 параметрами:
  P(L0)  — prior: ймовірність що учень вже знає тему ДО першої спроби
  P(T)   — transit: ймовірність вивчити навичку після спроби (якщо ще не знав)
  P(G)   — guess: ймовірність вгадати правильну відповідь не знаючи
  P(S)   — slip: ймовірність помилитися знаючи

Після кожної спроби (правильно / неправильно) маємо posterior P(L|obs), потім
застосовуємо T щоб отримати ймовірність володіння навичкою ПЕРЕД наступною спробою.

Замість одного knowledge_level зберігаємо мапу skill → mastery (ймовірність).

Реалізація компактна (~30 рядків логіки), використовується в ProfileEngine.
Джерело: Corbett & Anderson (1995), де-факто стандарт у адаптивних системах.
"""
from __future__ import annotations
from typing import Dict


class BKT:
    """Один екземпляр на тип навички. Параметри типові з літератури."""

    def __init__(self, p_l0: float = 0.30, p_t: float = 0.15,
                 p_g: float = 0.20, p_s: float = 0.10):
        self.p_l0 = p_l0  
        self.p_t  = p_t    
        self.p_g  = p_g  
        self.p_s  = p_s   

    def update(self, p_known: float, correct: bool) -> float:
        """Posterior: ймовірність володіння навичкою ПІСЛЯ спостереження + transit.
        p_known — поточна ймовірність володіння (0..1).
        Повертає нову ймовірність володіння."""
        
        if correct:
            num = p_known * (1 - self.p_s)
            den = num + (1 - p_known) * self.p_g
        else:
            num = p_known * self.p_s
            den = num + (1 - p_known) * (1 - self.p_g)
        if den <= 0:
            posterior = p_known
        else:
            posterior = num / den
         
        return posterior + (1 - posterior) * self.p_t


def update_skills(
    skills: Dict[str, float],
    observations: Dict[str, bool],
    bkt: BKT | None = None,
) -> Dict[str, float]:
    """Оновлює мапу skill → mastery (0..1) за списком {skill: correct/wrong}.
    Якщо навички ще нема — стартуємо з p_l0."""
    bkt = bkt or BKT()
    out = dict(skills)
    for skill, correct in observations.items():
        prev = out.get(skill, bkt.p_l0)
        out[skill] = round(bkt.update(prev, bool(correct)), 4)
    return out


def aggregate_knowledge_level(skills: Dict[str, float]) -> float:
    """Загальний knowledge_level (0..100) — середнє mastery усіх навичок * 100.
    Якщо навичок нема — повертає 50 (нейтральний старт)."""
    if not skills:
        return 50.0
    avg = sum(skills.values()) / len(skills)
    return round(avg * 100, 1)
