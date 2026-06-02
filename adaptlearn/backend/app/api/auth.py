import os
import random
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Header
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import (
    User, Student, CognitiveProfile, Trajectory,
    LessonSession, RoleEnum, PaceEnum, SchoolClass, Subject
)
from app.schemas import LoginRequest, RegisterRequest, Token, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "adaptlearn-secret-2024")
ALGORITHM  = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def _hash(p: str) -> str: return pwd_context.hash(p)
def _verify(p: str, h: str) -> bool: return pwd_context.verify(p, h)
def _make_token(user_id: int, role: str) -> str:
    exp = datetime.utcnow() + timedelta(days=30)
    return jwt.encode({"sub": str(user_id), "role": role, "exp": exp}, SECRET_KEY, algorithm=ALGORITHM)

async def _get_user_from_token(authorization: str, db: AsyncSession) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization[7:]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload["sub"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
 
SCHOOL_SUBJECTS = [
    "Математика", "Алгебра", "Геометрія",
    "Українська мова", "Українська література",
    "Англійська мова", "Французька мова", "Німецька мова",
    "Фізика", "Хімія", "Біологія", "Географія", "Екологія",
    "Історія України", "Всесвітня історія", "Громадянська освіта",
    "Інформатика", "Природознавство", "Читання",
    "Фізична культура", "Музика", "Образотворче мистецтво",
    "Трудове навчання", "Основи здоров'я", "Зарубіжна література",
]
 
CLASSES = [
    {"name": "1А",  "grade": 1},
    {"name": "1Б",  "grade": 1},
    {"name": "5А",  "grade": 5},
    {"name": "5Б",  "grade": 5},
    {"name": "9А",  "grade": 9},
    {"name": "10А", "grade": 10},
    {"name": "10Б", "grade": 10},
    {"name": "11А", "grade": 11},
] 

_TEACHERS = [
    {"username": "admin",           "password": "Admin2024!",   "full_name": "Ганна Адміненко",    "role": "admin",    "subject": None,                "class_id": None},
    {"username": "math_teacher",    "password": "Math2024!",    "full_name": "Ірина Коваленко",    "role": "teacher",  "subject": "Математика",        "class_id": None},
    {"username": "ukr_teacher",     "password": "Ukr2024!",     "full_name": "Олена Петренко",     "role": "teacher",  "subject": "Українська мова",   "class_id": None},
    {"username": "physics_teacher", "password": "Phys2024!",    "full_name": "Михайло Шевченко",   "role": "teacher",  "subject": "Фізика",            "class_id": None},
    {"username": "biology_teacher", "password": "Bio2024!",     "full_name": "Наталя Гриценко",    "role": "teacher",  "subject": "Біологія",          "class_id": None},
    {"username": "history_teacher", "password": "Hist2024!",    "full_name": "Андрій Лисенко",     "role": "teacher",  "subject": "Історія України",   "class_id": None},
    {"username": "eng_teacher",     "password": "Eng2024!",     "full_name": "Тетяна Романенко",   "role": "teacher",  "subject": "Англійська мова",   "class_id": None},
    {"username": "inform_teacher",  "password": "IT2024!",      "full_name": "Василь Бойченко",    "role": "teacher",  "subject": "Інформатика",       "class_id": None},
    {"username": "read_teacher",    "password": "Read2024!",    "full_name": "Світлана Мороз",     "role": "teacher",  "subject": "Читання",           "class_id": None},
]

_STUDENTS = [
     
    {"username": "student_1a_01", "full_name": "Аліна Бондаренко",  "class_id": 1},
    {"username": "student_1a_02", "full_name": "Богдан Іваненко",   "class_id": 1},
    {"username": "student_1a_03", "full_name": "Вікторія Кравченко","class_id": 1},
     
    {"username": "student_5a_01", "full_name": "Дмитро Мельник",    "class_id": 3},
    {"username": "student_5a_02", "full_name": "Єва Олійник",       "class_id": 3},
    {"username": "student_5a_03", "full_name": "Захар Шевчук",      "class_id": 3},
     
    {"username": "student_9a_01", "full_name": "Ірина Гриценко",    "class_id": 5},
    {"username": "student_9a_02", "full_name": "Іван Лисенко",      "class_id": 5},
     
    {"username": "student01", "full_name": "Олексій Бондаренко", "class_id": 6},
    {"username": "student02", "full_name": "Марія Іваненко",     "class_id": 6},
    {"username": "student03", "full_name": "Дмитро Кравченко",   "class_id": 6},
    {"username": "student04", "full_name": "Аніта Мельник",      "class_id": 6},
    {"username": "student05", "full_name": "Тарас Олійник",      "class_id": 6},
     
    {"username": "student06", "full_name": "Катерина Шевчук",    "class_id": 7},
    {"username": "student07", "full_name": "Андрій Гриценко",    "class_id": 7},
    {"username": "student08", "full_name": "Наталя Лисенко",     "class_id": 7},
    {"username": "student09", "full_name": "Василь Романенко",   "class_id": 7},
    {"username": "student10", "full_name": "Юлія Тимошенко",     "class_id": 7},
     
    {"username": "student_11_01", "full_name": "Максим Бойченко",  "class_id": 8},
    {"username": "student_11_02", "full_name": "Олена Мороз",      "class_id": 8},
     
    {"username": "new_student", "full_name": "Новий Учень", "class_id": None, "is_new": True},
]

_LESSONS = [
    
    {"class_id": 1, "subject": "Читання",         "topic": "Буква А. Слова та речення",      "is_active": False, "engagement": 88, "fatigue": 15, "answers_given": 18, "answers_total": 20},
    {"class_id": 1, "subject": "Математика",       "topic": "Числа від 1 до 10. Додавання",   "is_active": True,  "engagement": 82, "fatigue": 20, "answers_given": 15, "answers_total": 20},
    {"class_id": 1, "subject": "Природознавство",  "topic": "Пори року. Осінь",               "is_active": False, "engagement": 91, "fatigue": 10, "answers_given": 20, "answers_total": 20},
     
    {"class_id": 3, "subject": "Математика",       "topic": "Дроби. Поняття дробу",           "is_active": True,  "engagement": 74, "fatigue": 30, "answers_given": 22, "answers_total": 28},
    {"class_id": 3, "subject": "Біологія",         "topic": "Клітина — основа живого",        "is_active": False, "engagement": 79, "fatigue": 25, "answers_given": 20, "answers_total": 25},
    {"class_id": 3, "subject": "Англійська мова",  "topic": "My Family. Present Simple",      "is_active": False, "engagement": 85, "fatigue": 18, "answers_given": 24, "answers_total": 28},
     
    {"class_id": 5, "subject": "Фізика",           "topic": "Електромагнітна індукція",       "is_active": True,  "engagement": 68, "fatigue": 42, "answers_given": 18, "answers_total": 30},
    {"class_id": 5, "subject": "Хімія",            "topic": "Кислоти та їх властивості",      "is_active": False, "engagement": 71, "fatigue": 35, "answers_given": 20, "answers_total": 28},
    {"class_id": 5, "subject": "Інформатика",      "topic": "Алгоритми. Блок-схеми",          "is_active": False, "engagement": 88, "fatigue": 20, "answers_given": 26, "answers_total": 28},
     
    {"class_id": 6, "subject": "Математика",       "topic": "Похідна функції та її застосування", "is_active": True,  "engagement": 78, "fatigue": 32, "answers_given": 24, "answers_total": 30},
    {"class_id": 6, "subject": "Математика",       "topic": "Тригонометричні функції",            "is_active": False, "engagement": 65, "fatigue": 45, "answers_given": 20, "answers_total": 30},
    {"class_id": 6, "subject": "Фізика",           "topic": "Закони збереження енергії",          "is_active": False, "engagement": 71, "fatigue": 38, "answers_given": 22, "answers_total": 30},
    {"class_id": 6, "subject": "Українська мова",  "topic": "Синтаксис. Складнопідрядне речення", "is_active": False, "engagement": 80, "fatigue": 28, "answers_given": 25, "answers_total": 30},
    {"class_id": 6, "subject": "Хімія",            "topic": "Кислоти та їх властивості",          "is_active": False, "engagement": 76, "fatigue": 35, "answers_given": 22, "answers_total": 28},
    {"class_id": 6, "subject": "Біологія",         "topic": "Будова клітини",                     "is_active": False, "engagement": 82, "fatigue": 25, "answers_given": 24, "answers_total": 28},
    {"class_id": 6, "subject": "Англійська мова",  "topic": "Present Perfect Tense",              "is_active": False, "engagement": 79, "fatigue": 30, "answers_given": 23, "answers_total": 28},
    {"class_id": 6, "subject": "Географія",        "topic": "Материки і океани",                  "is_active": False, "engagement": 84, "fatigue": 22, "answers_given": 26, "answers_total": 30},
    {"class_id": 6, "subject": "Історія України",  "topic": "Київська Русь",                      "is_active": False, "engagement": 81, "fatigue": 28, "answers_given": 25, "answers_total": 30},
    {"class_id": 6, "subject": "Інформатика",      "topic": "Алгоритми. Блок-схеми",              "is_active": False, "engagement": 88, "fatigue": 20, "answers_given": 27, "answers_total": 28},
    
    {"class_id": 7, "subject": "Математика",       "topic": "Геометрія: коло та його властивості","is_active": True,  "engagement": 88, "fatigue": 22, "answers_given": 28, "answers_total": 30},
    {"class_id": 7, "subject": "Українська мова",  "topic": "Морфологія. Дієприкметник",          "is_active": False, "engagement": 83, "fatigue": 28, "answers_given": 27, "answers_total": 30},
    
    {"class_id": 8, "subject": "Математика",       "topic": "Інтеграл. Визначений інтеграл",      "is_active": True,  "engagement": 72, "fatigue": 40, "answers_given": 20, "answers_total": 25},
    {"class_id": 8, "subject": "Фізика",           "topic": "Ядерна фізика. Радіоактивність",     "is_active": False, "engagement": 75, "fatigue": 36, "answers_given": 18, "answers_total": 24},
    {"class_id": 8, "subject": "Інформатика",      "topic": "Бази даних. SQL запити",             "is_active": False, "engagement": 90, "fatigue": 15, "answers_given": 23, "answers_total": 24},
]


def _get_seed_transcripts() -> dict[str, str]:
    """Повноцінні мок-транскрипти уроків для AI-аналізу і пояснень."""
    return {
        "Математика": (
            "08:30 Вчитель: Доброго ранку! Сьогодні розглянемо одну з найважливіших тем алгебри — похідну функції. "
            "Це поняття є основою всього математичного аналізу і використовується у фізиці, економіці, інженерії.\n\n"
            "08:35 Похідна функції в точці — це границя відношення приросту функції до приросту аргументу, коли приріст аргументу прямує до нуля. "
            "Записують: f'(x) = lim[Δx→0] (f(x+Δx) − f(x)) / Δx. Геометрично — це кутовий коефіцієнт дотичної до графіка в даній точці.\n\n"
            "08:45 Розглянемо приклади. (x²)' = 2x — за правилом степеневої функції. (x³)' = 3x². (sin x)' = cos x. (cos x)' = −sin x. "
            "(e^x)' = e^x. (ln x)' = 1/x. Похідна константи дорівнює нулю: (5)' = 0.\n\n"
            "08:55 Правила диференціювання: похідна суми (f+g)' = f'+g'; похідна добутку (f·g)' = f'g + fg'; "
            "похідна частки (f/g)' = (f'g − fg')/g²; похідна складної функції — ланцюгове правило: y = f(g(x)), y' = f'(g(x))·g'(x).\n\n"
            "09:05 Фізичний зміст похідної — швидкість зміни. Якщо S(t) — шлях, то S'(t) — миттєва швидкість. "
            "Якщо v(t) — швидкість, то v'(t) — прискорення. Саме тому фізики постійно використовують похідні.\n\n"
            "09:15 Кінець уроку. Домашнє завдання: знайти похідні функцій 3x² + 2x − 5, sin(2x), x·cos(x)."
        ),
        "Українська мова": (
            "09:30 Тема: Дієприслівниковий зворот. Дієприслівник — особлива незмінна форма дієслова, що поєднує ознаки дієслова і прислівника. "
            "Відповідає на питання 'що роблячи?', 'що зробивши?'. Виражає додаткову дію, що відбувається одночасно з основною або передує їй.\n\n"
            "09:35 Дієприслівниковий зворот — це дієприслівник із залежними словами. Наприклад: 'Прочитавши книгу, я довго думав'. "
            "Тут 'прочитавши книгу' — зворот, який доповнює дію 'думав'. Зворот завжди стосується підмета головного речення.\n\n"
            "09:45 ПРАВИЛО: дієприслівниковий зворот ЗАВЖДИ виділяється комами незалежно від місця в реченні. "
            "На початку: 'Зайшовши до класу, він привітався'. У середині: 'Він, побачивши друга, посміхнувся'. У кінці: 'Він посміхнувся, побачивши друга'.\n\n"
            "09:55 ТИПОВА ПОМИЛКА: підмет головного речення і дія дієприслівника мають належати одному виконавцю. "
            "Неправильно: 'Підходячи до школи, у мене заболіла голова' (голова не підходила). "
            "Правильно: 'Підходячи до школи, я відчув головний біль'.\n\n"
            "10:05 Не плутайте з підрядним реченням часу. 'Коли він прочитав книгу, він задумався' — підрядне (є сполучник). "
            "'Прочитавши книгу, він задумався' — дієприслівниковий зворот.\n\n"
            "10:15 Домашнє: вправа 287, скласти 5 речень з дієприслівниковими зворотами на тему 'Мій вільний час'."
        ),
        "Фізика": (
            "10:30 Тема: Закон збереження механічної енергії. Кінетична енергія Ek = mv²/2, де m — маса (кг), v — швидкість (м/с). "
            "Потенціальна енергія в полі тяжіння Ep = mgh, де g ≈ 9.8 м/с², h — висота над нульовим рівнем.\n\n"
            "10:35 Повна механічна енергія E = Ek + Ep. У замкненій системі без тертя E = const — повна енергія зберігається. "
            "Це фундаментальний закон природи, з якого випливає неможливість вічного двигуна.\n\n"
            "10:45 Класичний приклад — маятник. У крайній точці швидкість = 0, вся енергія потенціальна. "
            "У найнижчій точці h = 0, вся енергія кінетична. Між ними енергія перетікає з однієї форми в іншу.\n\n"
            "10:55 ЗАДАЧА: камінь масою 2 кг кидають вертикально вгору зі швидкістю 10 м/с. "
            "На якій максимальній висоті він буде? Розв'язання: Ek_поч = Ep_макс. mv²/2 = mgh. h = v²/(2g) = 100/19.6 ≈ 5.1 м.\n\n"
            "11:05 За наявності тертя частина енергії переходить у тепло. Тоді E_поч = E_кін + Q (теплота). "
            "Закон збереження виконується, але вже для повної енергії, не лише механічної.\n\n"
            "11:15 Домашнє: пар. 24, задачі 1-3. Особливо задача про санки, що з'їжджають з гірки."
        ),
        "Біологія": (
            "10:30 Тема: Будова рослинної клітини. Клітина — основна структурна і функціональна одиниця живого. "
            "Рослинна клітина має ряд особливостей, що відрізняють її від тваринної.\n\n"
            "10:35 Основні органели рослинної клітини: 1) клітинна стінка з целюлози — забезпечує форму і захист; "
            "2) клітинна мембрана — контролює транспорт речовин; 3) цитоплазма — внутрішнє рідке середовище; 4) ядро з ДНК — управління клітиною.\n\n"
            "10:45 Унікальні органели рослин: хлоропласти містять хлорофіл і здійснюють фотосинтез. "
            "Це процес перетворення CO2 і H2O в глюкозу за участю сонячного світла: 6CO2 + 6H2O + світло → C6H12O6 + 6O2.\n\n"
            "10:55 Вакуоля — велика порожнина з клітинним соком. Підтримує тургор (пружність) клітини. "
            "Коли рослина в'яне, це означає що в вакуолях не вистачає води і тургор втрачено.\n\n"
            "11:05 Мітохондрії — 'енергетичні станції'. Тут відбувається клітинне дихання — розщеплення глюкози з виділенням АТФ (енергія). "
            "Цікаво: і мітохондрії, і хлоропласти мають власну ДНК — це сліди симбіозу мільярдів років тому.\n\n"
            "11:15 Домашнє: намалювати схему рослинної клітини і підписати органели."
        ),
        "Інформатика": (
            "12:30 Тема: Алгоритми і блок-схеми. Алгоритм — це чітка послідовність дій для розв'язання задачі за скінчений час. "
            "Властивості: дискретність (поділ на кроки), визначеність (однозначність), результативність, масовість.\n\n"
            "12:35 Три типи алгоритмів. ЛІНІЙНИЙ — дії виконуються послідовно одна за одною. "
            "Приклад: ранкова рутина — встати, вмитися, поснідати, вийти з дому.\n\n"
            "12:45 РОЗГАЛУЖЕНИЙ — є умова, і залежно від неї виконується одна з гілок. 'Якщо йде дощ → взяти парасолю, інакше → ні'. "
            "У блок-схемах позначається ромбом. Має два виходи: 'так' і 'ні'.\n\n"
            "12:55 ЦИКЛІЧНИЙ — дії повторюються поки виконується умова. "
            "Приклад: 'мити посуд, поки в раковині є тарілки'. У програмуванні — цикли while, for.\n\n"
            "13:05 Блок-схема — графічне зображення алгоритму. Овал — початок/кінець. Прямокутник — дія. Ромб — умова. "
            "Паралелограм — ввід/вивід. Стрілки показують напрямок виконання.\n\n"
            "13:15 Домашнє: скласти блок-схему алгоритму 'визначити максимум з трьох чисел'."
        ),
        "Читання": (
            "08:30 Сьогодні вчимо звук і букву М. Маленька дзвінка буква, якою починаються найголовніші слова у нашому житті — МАМА, МОРЕ, МОЛОКО.\n\n"
            "08:35 Вимова: губи стискаємо, видихаємо повітря через ніс. М-м-м-м. Скажіть всі разом — М! Тепер тихіше — м-м-м. А тепер як кіт мурчить — мур-мур!\n\n"
            "08:45 Склади: МА, МО, МУ, МИ. Прочитаємо хором: ма-ма! мо-ло-ко! ми-ло! Знайдіть слова, де М на початку: МАК, МАЛЯ, МОРЕ.\n\n"
            "08:55 Слова де М посередині: ЛАМ-ПА, СО-МА, КО-МА. Слова де М в кінці: ДІМ, КИМ, КРИМ.\n\n"
            "09:05 Велика буква М схожа на гори з трьома вершинами. Маленька м — на два пагорби. Беремо прописи і обережно виводимо.\n\n"
            "09:15 Кінець. Домашнє: намалюй три предмети, які починаються на М і підпиши їх."
        ),
        "Хімія": (
            "10:30 Тема: Кислоти. Кислоти — це складні речовини, які при дисоціації у воді утворюють катіони водню H+ і аніон кислотного залишку. "
            "Загальна формула HnX, де X — кислотний залишок.\n\n"
            "10:35 Класифікація. За наявністю кисню: безкисневі (HCl, HBr, H2S) і кисневмісні (H2SO4, HNO3, H3PO4). "
            "За основністю — кількістю атомів водню: одноосновні (HCl), двоосновні (H2SO4), триосновні (H3PO4).\n\n"
            "10:45 Властивості: 1) кислий смак (але куштувати кислоти НЕБЕЗПЕЧНО!); 2) змінюють колір індикаторів — лакмус червоніє, метилоранж червоніє; "
            "3) реагують з активними металами з виділенням водню: Zn + 2HCl → ZnCl2 + H2↑.\n\n"
            "10:55 Реакція з оксидами металів: CuO + H2SO4 → CuSO4 + H2O. "
            "Реакція з основами (нейтралізація): NaOH + HCl → NaCl + H2O. Це найважливіша реакція в хімії.\n\n"
            "11:05 Сильні кислоти (повністю дисоціюють у воді): HCl, HNO3, H2SO4. Слабкі (частково): CH3COOH (оцтова), H2CO3 (вугільна).\n\n"
            "11:15 Домашнє: § 17, скласти рівняння реакції H2SO4 з трьома різними металами."
        ),
        "Природознавство": (
            "10:30 Тема: Пори року. У природі помітно виділяються чотири пори року: весна, літо, осінь, зима. Кожна має свої ознаки.\n\n"
            "10:35 ВЕСНА (березень-травень). Тане сніг, прокидається природа, з'являється перша зелена травичка. "
            "Прилітають птахи — спочатку шпаки, потім ластівки. Розпускаються бруньки на деревах.\n\n"
            "10:45 ЛІТО (червень-серпень). Найтепліша пора. Сонце світить найдовше — найдовший день 22 червня. "
            "Достигають ягоди — суниця, малина, чорниця. Літо — це канікули і відпочинок!\n\n"
            "10:55 ОСІНЬ (вересень-листопад). Жовтіє і опадає листя. Птахи летять у теплі краї — лелеки, журавлі. "
            "Збирають урожай: яблука, картоплю, кукурудзу. Дні стають коротшими.\n\n"
            "11:05 ЗИМА (грудень-лютий). Випадає сніг, замерзають калюжі. Найкоротший день — 22 грудня. "
            "Багато тварин впадають у сплячку — ведмеді, їжаки, борсуки.\n\n"
            "11:15 Домашнє: намалювати свою улюблену пору року і описати чому."
        ),
        "Англійська мова": (
            "10:30 Topic: Present Perfect Tense. We use this tense to talk about actions that happened at an unspecified time in the past, or actions that started in the past and continue to the present.\n\n"
            "10:35 Structure: subject + have/has + past participle. Example: 'I have read this book' (Я прочитав цю книгу). "
            "Has — for he/she/it. Have — for I/you/we/they. Past participle — third form of the verb (V3).\n\n"
            "10:45 Regular verbs form V3 by adding -ed: work → worked → worked. Play → played → played. "
            "Irregular verbs must be memorized: go → went → gone. See → saw → seen. Eat → ate → eaten.\n\n"
            "10:55 Time markers for Present Perfect: ever, never, already, yet, just, since, for, recently. "
            "Example: 'Have you EVER been to London?' 'I have JUST finished my homework.' 'She has lived here SINCE 2010.'\n\n"
            "11:05 Compare with Past Simple. Past Simple — specific time in the past: 'I read the book YESTERDAY'. "
            "Present Perfect — no specific time: 'I have read this book' (when? doesn't matter — important that I read it).\n\n"
            "11:15 Homework: write 10 sentences in Present Perfect using different time markers."
        ),
        "Географія": (
            "11:30 Тема: Материки і океани. На Землі є 6 материків (континентів) і 4 (або 5) океани. "
            "Материки оточені водами Світового океану.\n\n"
            "11:35 ЄВРАЗІЯ — найбільший материк (54 млн км²). Об'єднує Європу і Азію. Тут живе більше половини людства. "
            "Україна знаходиться саме в Європі.\n\n"
            "11:45 АФРИКА (30 млн км²) — другий за розміром. Найжаркіший материк, тут — пустеля Сахара, найдовша річка Ніл. "
            "ПІВНІЧНА АМЕРИКА (24 млн км²) — США, Канада, Мексика. ПІВДЕННА АМЕРИКА (18 млн км²) — Амазонка, Анди, Бразилія.\n\n"
            "11:55 АНТАРКТИДА (14 млн км²) — найхолодніший. Майже повністю вкрита льодом до 4 км завтовшки. Тут немає постійного населення. "
            "АВСТРАЛІЯ (8.5 млн км²) — найменший материк, в Південній півкулі.\n\n"
            "12:05 Океани: ТИХИЙ (найбільший і найглибший), АТЛАНТИЧНИЙ, ІНДІЙСКИЙ, ПІВНІЧНИЙ ЛЬОДОВИТИЙ. "
            "Іноді виділяють і Південний (Антарктичний) — навколо Антарктиди.\n\n"
            "12:15 Домашнє: на карті показати всі материки і океани, підписати."
        ),
        "Історія України": (
            "12:30 Тема: Київська Русь. Велика середньовічна держава східних слов'ян, що існувала у IX-XIII століттях. "
            "Столиця — Київ, центр економічного і культурного життя.\n\n"
            "12:35 882 рік — князь Олег об'єднує Новгород і Київ, перетворивши Київ на столицю. "
            "Сказав: 'Хай буде Київ матір'ю містам руським'.\n\n"
            "12:45 Найвидатніші князі: Володимир Великий (980-1015) — прийняв християнство від Візантії у 988 році, що мало величезне значення для розвитку культури і освіти. "
            "Ярослав Мудрий (1019-1054) — створив 'Руську правду', перший писаний звід законів.\n\n"
            "12:55 У XII столітті держава розпадається на окремі князівства через внутрішні чвари. "
            "Володимиро-Суздальське на півночі, Галицько-Волинське на заході (продовжувач традицій Київської Русі).\n\n"
            "13:05 1240 рік — Київ зруйновано монголо-татарами хана Батия. Це фактичний кінець Київської Русі як єдиної держави. "
            "Спадщину перейняли Галицько-Волинська держава і пізніше — Литовське князівство та Козацька Україна.\n\n"
            "13:15 Домашнє: § 5, скласти хронологічну таблицю основних подій Київської Русі."
        ),
    }


async def _do_seed(db: AsyncSession) -> str:
    existing = await db.execute(select(User).limit(1))
    if existing.scalar_one_or_none():
        return "Already seeded"

    for name in SCHOOL_SUBJECTS:
        db.add(Subject(name=name))

    for c in CLASSES:
        db.add(SchoolClass(name=c["name"], grade=c["grade"]))
    await db.flush()

    for t in _TEACHERS:
        db.add(User(
            username=t["username"],
            hashed_password=_hash(t["password"]),
            full_name=t["full_name"],
            role=RoleEnum(t["role"]),
            subject=t.get("subject"),
            class_id=None,
            student_id=None,
            approved=True,
        ))

    paces = [PaceEnum.slow, PaceEnum.medium, PaceEnum.fast]
    for s in _STUDENTS:
        is_new = s.get("is_new", False)
        class_id = s.get("class_id")
        approved = not is_new and class_id is not None

        student = Student(class_id=class_id or 0, role=RoleEnum.student)
        db.add(student)
        await db.flush()

        db.add(CognitiveProfile(
            student_id=student.id,
            knowledge_level=50.0 if is_new else round(40 + random.random() * 50, 1),
            engagement_score=50.0 if is_new else round(50 + random.random() * 45, 1),
            learning_pace=PaceEnum.medium if is_new else random.choice(paces),
            typical_errors=[],
            interests=[],
        ))
        db.add(Trajectory(student_id=student.id, topics=[] if is_new else ["Вступний розділ"]))

        db.add(User(
            username=s["username"],
            hashed_password=_hash("Learn2024!"),
            full_name=s["full_name"],
            role=RoleEnum.student,
            subject=None,
            class_id=class_id,
            student_id=student.id,
            approved=approved,
        ))
 
    from app.models import RobotEvent, EventTypeEnum
    from datetime import datetime, timedelta, timezone
    import json as _json

    transcripts = _get_seed_transcripts()
    lesson_ids = []
    for l in _LESSONS:
        ls = LessonSession(
            class_id=l["class_id"],
            subject=l["subject"],
            topic=l["topic"],
            transcript=transcripts.get(l["subject"], f"[Транскрипт уроку '{l['topic']}' з {l['subject']}]"),
            is_active=l["is_active"],
            key_terms=[],
            avg_engagement=l["engagement"],
            avg_fatigue=l["fatigue"],
            answers_given=l["answers_given"],
            answers_total=l["answers_total"],
        )
        db.add(ls)
        await db.flush()
        lesson_ids.append(ls.id)

 
        idx = len(lesson_ids) - 1
        hot_lessons      = {2, 8, 11, 14, 17}  
        very_hot_lessons = {17}                 
        cold_lessons     = {6, 13}              
        dry_lessons      = {3, 10, 16}           
        wet_lessons      = {5, 18}               
        low_attention    = {12, 15}              

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

        base = datetime.now(timezone.utc) - timedelta(days=3)
        for i in range(5):
            db.add(RobotEvent(session_id=ls.id, type=EventTypeEnum.thermal,
                payload={"attention_scores": [round(attention_floor + (i*3 + j*1.7) % attention_range, 1) for j in range(30)],
                         "temperature_c": round(base_temp + i*0.3, 1),
                         "humidity_percent": round(base_humid + i*1.2, 1),
                         "timestamp": (base + timedelta(minutes=5*i)).isoformat()}))
            db.add(RobotEvent(session_id=ls.id, type=EventTypeEnum.audio,
                payload={"student_id": (i%5)+1, "duration_sec": 3+i, "type": "answer" if i%2 else "question",
                         "volume": round(0.5 + i*0.05, 2),
                         "timestamp": (base + timedelta(minutes=5*i)).isoformat()}))
        db.add(RobotEvent(session_id=ls.id, type=EventTypeEnum.video,
            payload={"keywords": (l.get("topic") or "").split()[:3], "confidence": 0.87,
                     "timestamp": base.isoformat()}))
 
    from app.models import Test, TestResult
    first_student_id = 9   
    student01_class = 6
    for lid, l in zip(lesson_ids, _LESSONS):
        if l["class_id"] != student01_class:
            continue
         
        t = Test(lesson_id=lid, questions=[
            {"question": f"Питання 1 з теми '{l['topic']}'", "options": ["A","B","C","D"], "correct_index": 0, "explanation": ""},
            {"question": f"Питання 2 з теми '{l['topic']}'", "options": ["A","B","C","D"], "correct_index": 1, "explanation": ""},
        ])
        db.add(t)
        await db.flush()
         
        db.add(TestResult(student_id=first_student_id, test_id=t.id,
                          answers={"0": 0, "1": 1}, score=85.0, errors=[]))

    await db.commit()
    return f"Seeded: {len(_TEACHERS)} staff, {len(_STUDENTS)} students, {len(_LESSONS)} lessons, {len(SCHOOL_SUBJECTS)} subjects"


@router.post("/login", response_model=Token)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == body.username))
    user = result.scalar_one_or_none()
    if not user or not _verify(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Невірний логін або пароль")
    token = _make_token(user.id, user.role.value)
    return Token(access_token=token, role=user.role.value, full_name=user.full_name, user_id=user.id,
                 student_id=user.student_id, class_id=user.class_id, subject=user.subject,
                 approved=user.approved)


@router.post("/register", response_model=Token)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.username == body.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Логін вже зайнятий")

    role = RoleEnum(body.role)
    student_id = None

    if role == RoleEnum.student:
        student = Student(class_id=0, role=RoleEnum.student)
        db.add(student)
        await db.flush()
        student_id = student.id
        db.add(CognitiveProfile(student_id=student_id, knowledge_level=50.0, engagement_score=50.0, interests=[]))
        db.add(Trajectory(student_id=student_id, topics=[]))

    user = User(
        username=body.username,
        hashed_password=_hash(body.password),
        full_name=body.full_name,
        role=role,
        subject=body.subject,
        class_id=body.class_id,
        student_id=student_id,
        approved=False,   
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = _make_token(user.id, role.value)
    return Token(access_token=token, role=role.value, full_name=user.full_name, user_id=user.id,
                 student_id=student_id, class_id=body.class_id, subject=body.subject,
                 approved=False)


@router.get("/me", response_model=UserOut)
async def me(authorization: str = Header(...), db: AsyncSession = Depends(get_db)):
    user = await _get_user_from_token(authorization, db)
    return UserOut.model_validate(user)


@router.post("/seed")
async def seed(db: AsyncSession = Depends(get_db)):
    msg = await _do_seed(db)
    return {"message": msg}
