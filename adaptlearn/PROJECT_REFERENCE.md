# AdaptLearn — Project Reference / Довідник проєкту

> **Full project title (UA):** Інформаційна система адаптивного управління навчальною траєкторією студента з використанням роботизованого асистента та аналізу когнітивного профілю
>
> **Project title (EN):** Information System for Adaptive Management of a Student's Learning Trajectory Using a Robotic Assistant and Cognitive Profile Analysis
>
> Документ призначений для пояснювальної записки, діаграм, креслень і презентації. Містить технічну довідку про стек, базу даних, потоки даних, алгоритми адаптації, API.

---

## 1. Project goal / Мета проєкту

**UA.** Реалізувати інформаційну систему, що:

1. Збирає мультимодальні дані про учня (тестові результати, поведінка на уроці, мова, увага класу).
2. На основі цих даних будує **когнітивний профіль** учня (рівень знань по навичках, темп, залученість, типові помилки, інтереси).
3. Використовує **AI** (LLM + speech-to-text) для генерації **персоналізованого контенту** (пояснення тем, тести, поради) під цей профіль.
4. Симулює **робота-асистента** в класі через MQTT — 4 датчики: **термокамера** (увага кожного учня), **термометр + гігрометр** (умови в кабінеті), **мікрофон** (питання/відповіді), **камера** (розпізнані ключові слова з мовлення).
5. Веде **адаптивну навчальну траєкторію** — підбирає теми залежно від рівня учня та інтересів.

**EN.** Build an information system that captures multimodal student data, derives a cognitive profile, generates AI-personalized lesson explanations and tests, and adapts the learning trajectory via a robotic-assistant data feed (MQTT).

---

## 2. Tech Stack

### 2.1 Backend

| Component                    | Version     | Purpose                              |
| ---------------------------- | ----------- | ------------------------------------ |
| **Python**                   | 3.11        | Runtime                              |
| **FastAPI**                  | 0.111       | Async HTTP REST framework            |
| **uvicorn**                  | 0.29        | ASGI server (with `--reload` in dev) |
| **SQLAlchemy**               | 2.0 (async) | ORM + DeclarativeBase                |
| **asyncpg**                  | 0.29        | Postgres async driver                |
| **Pydantic**                 | 2.7         | Request/response schemas             |
| **python-jose + bcrypt 3.2** | —           | JWT auth                             |
| **paho-mqtt**                | 2.0         | MQTT client for robot-mock events    |
| **redis.asyncio**            | 5.0         | Cache for trajectory engine          |

### 2.2 AI / ML

| Component                         | Purpose                                                                          |
| --------------------------------- | -------------------------------------------------------------------------------- |
| **faster-whisper** (tiny/base)    | Local Speech-to-Text, transcription of lesson videos, language detection (uk/en) |
| **ffmpeg**                        | Audio extraction from video (16kHz mono, 64kbps mp3)                             |
| **Groq Llama 3.3 70B** (primary)  | LLM for lesson analysis, test generation, explanations, AI teacher advice        |
| **OpenAI GPT-4o-mini** (fallback) | Same when Groq fails                                                             |
| **spaCy `en_core_web_sm`**        | Term extraction fallback                                                         |
| **BKT** (custom implementation)   | Bayesian Knowledge Tracing for per-skill mastery                                 |

### 2.3 Frontend

| Component        | Version          | Purpose                          |
| ---------------- | ---------------- | -------------------------------- |
| **React**        | 18.3             | UI framework                     |
| **TypeScript**   | 5.4              | Type safety                      |
| **Vite**         | 5.2              | Dev server + bundler             |
| **React Router** | 6.23             | Routing                          |
| **Axios**        | 1.7              | HTTP client with JWT interceptor |
| **Tailwind CSS** | 3 (prefix `tw-`) | Utility-first styling            |
| **lucide-react** | latest           | Icons                            |
| **recharts**     | 2.12             | Charts (legacy components)       |

### 2.4 Infrastructure

| Service        | Image                | Role                            |
| -------------- | -------------------- | ------------------------------- |
| **postgres**   | postgres:15          | Primary database                |
| **redis**      | redis:7-alpine       | Cache (trajectory engine)       |
| **mqtt**       | eclipse-mosquitto    | MQTT broker for robot events    |
| **api**        | custom (Python 3.11) | FastAPI backend                 |
| **robot-mock** | custom               | Publishes sensor events to MQTT |
| **frontend**   | custom (Node 20)     | Vite dev server                 |

Всі сервіси описані в `docker-compose.yml`. Backend і frontend з live-mount volumes для HMR.

---

## 3. System Architecture / Архітектура

### 3.1 High-level diagram (text form)

```
┌──────────────────────────────────────────────────────────────────────┐
│                          BROWSER (React SPA)                          │
│ ┌─────────────────┐ ┌─────────────────┐ ┌──────────────────────────┐ │
│ │  Login/Register │ │  StudentApp     │ │  TeacherApp / AdminApp   │ │
│ │                 │ │  - home/lessons │ │  - overview / lessons    │ │
│ │                 │ │  - tests/journal│ │  - tests/students        │ │
│ │                 │ │  - career test  │ │  - journal/notifications │ │
│ └─────────────────┘ └─────────────────┘ └──────────────────────────┘ │
│                                ↕ axios + JWT                          │
└───────────────────────────────┬───────────────────────────────────────┘
                                │  HTTP REST (/api/*)
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     FASTAPI BACKEND (8000)                            │
│ ┌────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│ │ auth   │  │ students│  │ lessons  │  │ tests    │  │  content   │  │
│ │ admin  │  │ traject │  │ /upload  │  │ generate │  │ pref/career│  │
│ │        │  │ ai_advice│  │ /explain │  │  results │  │ kg/respons │  │
│ └───┬────┘  └───┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│     │           │             │              │              │         │
│     ▼           ▼             ▼              ▼              ▼         │
│ ┌────────────────────────────────────────────────────────────────┐    │
│ │            Services Layer                                       │    │
│ │  • lesson_processor  (Whisper + Groq/OpenAI for analysis)       │    │
│ │  • test_generator    (adaptive test generation via LLM)         │    │
│ │  • profile_engine    (BKT updates per skill)                    │    │
│ │  • trajectory_engine (Redis-cached AI topic recommendations)    │    │
│ │  • bkt               (Corbett & Anderson 1995 formula)          │    │
│ │  • static_seed       (JSON → DB at startup)                     │    │
│ └────────────────────────────────────────────────────────────────┘    │
└───────────────────────────┬──────────────────────────────────────────┘
                            │
       ┌────────────────────┼─────────────────────┐
       ▼                    ▼                     ▼
┌────────────┐      ┌──────────────┐      ┌────────────────┐
│ PostgreSQL │      │   Redis      │      │ MQTT (mosquitto│
│ (volume    │      │ (trajectory  │      │  /robot/video  │
│  persisted)│      │  cache 24h)  │      │  /robot/audio  │
│            │      │              │      │  /robot/thermal│
└────────────┘      └──────────────┘      └───────┬────────┘
                                                  │
                                       ┌──────────▼────────┐
                                       │   robot-mock      │
                                       │  (publishes every │
                                       │   5 seconds)      │
                                       └───────────────────┘

External APIs (called from services):
  • Groq API           (Llama 3.3 70B)
  • OpenAI API         (gpt-4o-mini fallback)
  • HuggingFace        (faster-whisper model download — at build time)
```

### 3.2 Адаптаційна петля (closed adaptation loop)

```
Сенсорика класу ──┐
(термокамера,    │
 мікрофон)       │
                 ▼
Test results ──► ProfileEngine (BKT)
                 │
                 ▼
       CognitiveProfile (DB)
       • skills: {skill_name: P(known) 0..1}
       • engagement_score
       • learning_pace
       • typical_errors
       • interests
                 │
       ┌─────────┴───────────┐
       ▼                     ▼
 /explain prompt        /tests/generate
 (LLM з адаптацією      (n питань і
  під knowledge/        складність
  pace/engagement       залежно від
  + hobby)              профілю)
       │                     │
       ▼                     ▼
 Персоналізоване        Адаптивний тест
   пояснення               для учня
```

Цей замкнений цикл — **головна академічна цінність роботи**: реальні дані учня впливають на AI-промпт, який видає контент під цього учня.

---

## 3.3 Storage tiers / Шари зберігання

Дані проєкту фізично розпорошені по 4 шарах:

| Шар                | Технологія                                         | Що зберігається                                                                                                                           | Persistence               |
| ------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| **Реляційні дані** | Postgres 15 (volume `postgres_data`)               | Усі таблиці: users, lessons, tests, profiles, sensor events, knowledge graph і т.д.                                                       | ✅ Named volume           |
| **Кеш**            | Redis 7                                            | Адаптивні траєкторії (TTL 24 год), ключ `traj:{student_id}:{level}`                                                                       | ❌ In-memory (по дизайну) |
| **Файли медіа**    | Filesystem `/app/videos/` (volume `lesson_videos`) | Завантажені відео уроків `lesson_{id}.{ext}` (mp4/mov…). Тимчасові `_audio.mp3` під час Whisper-конвеєра — видаляються після транскрипції | ✅ Named volume           |
| **MQTT**           | Mosquitto in-memory                                | Live-потік sensor подій. Не зберігається — historicals пишуться в `robot_events` таблицю                                                  | ❌ Volatile               |

### Як працює завантаження відео (детально)

1. **`POST /api/lessons/{id}/upload`** — multipart-форма з файлом.
2. FastAPI зберігає файл як **`/app/videos/lesson_{id}.{ext}`** (детермінований шлях по `lesson_id`, нове завантаження перезаписує старе).
3. У БД оновлюється `lesson_sessions.video_path = "/app/videos/lesson_{id}.{ext}"` — **тільки рядок-шлях**, не байти.
4. Запускається `BackgroundTask _transcribe_and_analyze()`:
   - `ffmpeg` витягує аудіо → `/app/videos/lesson_{id}_audio.mp3` (mono 16 kHz, 64 kbps)
   - `faster-whisper` → детекція мови → транскрипція → WebVTT
   - Аудіо-файл видаляється
   - Транскрипт пишеться в `lesson.transcript`, субтитри в `lesson.vtt_subtitles`, ai_analysis в `lesson.ai_analysis`

### Як працює віддача відео клієнту

`GET /api/lessons/{id}/video`:

```python
return FileResponse(lesson.video_path, media_type="video/mp4")
```

FastAPI повертає файл як стрім з **HTTP Range requests** — браузер може seek-ати по таймлайну і завантажувати лише потрібні шматки, не весь файл.

### Чому файли на диску, а не bytes в БД

| Підхід                                          | Плюси                                                                                 | Мінуси                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Файли на FS** (наш вибір)                     | Range requests, ефективний streaming, легкий бекап через snapshot volume, маленька БД | Треба окремий volume, файли і метадані можуть розсинхронізуватися          |
| **BYTEA / Large Object в БД**                   | Атомарність, ACID-гарантії узгодженості, єдиний бекап                                 | Великі тіла повільні в Postgres, складно стрімити з range, БД роздувається |
| **Object Storage** (S3, MinIO) — для production | Масштабування, CDN, дешеве сховище                                                    | Додатковий сервіс, складніше для діпломної демо                            |

Для production-системи рекомендований шлях — переніс на S3/MinIO з API-ендпоінтом що повертає presigned URL. У дипломі залишаємо named volume — це достатньо для демонстрації.

---

## 4. Database Schema / Схема БД

База даних — **PostgreSQL 15**. Схема описана через SQLAlchemy DeclarativeBase в `backend/app/models.py`. Створюється через `Base.metadata.create_all` на старті + ALTER міграція для нових колонок.

### 4.1 Enums

```python
RoleEnum:      student | teacher | admin
PaceEnum:      slow | medium | fast
EventTypeEnum: video | audio | thermal
```

### 4.2 Tables

#### **school_classes** — Класи школи

| Колонка | Тип                | Опис          |
| ------- | ------------------ | ------------- |
| `id`    | INT PK             | Внутрішній ID |
| `name`  | VARCHAR(20) UNIQUE | "1А", "10Б"   |
| `grade` | INT                | Клас (1-11)   |

Seed: 8 класів — 1А, 1Б, 5А, 5Б, 9А, 10А, 10Б, 11А.

#### **subjects** — Предмети

| Колонка | Тип                 | Опис                    |
| ------- | ------------------- | ----------------------- |
| `id`    | INT PK              |                         |
| `name`  | VARCHAR(100) UNIQUE | "Математика", "Фізика"… |

Seed: 25+ предметів від початкової до старшої школи.

#### **users** — Користувачі (логіни)

| Колонка           | Тип                       | Опис                           |
| ----------------- | ------------------------- | ------------------------------ |
| `id`              | INT PK                    |                                |
| `username`        | VARCHAR UNIQUE            | Логін                          |
| `hashed_password` | VARCHAR                   | bcrypt hash                    |
| `full_name`       | VARCHAR                   | Повне ім'я                     |
| `role`            | RoleEnum                  | student/teacher/admin          |
| `subject`         | VARCHAR NULL              | для вчителів-предметників      |
| `class_id`        | INT NULL                  | для учнів і класних керівників |
| `student_id`      | INT NULL FK → students.id | для учнів                      |
| `approved`        | BOOL                      | admin verifies new users       |
| `created_at`      | TIMESTAMP                 |                                |

#### **students** — Профіль студента (запис необхідний для FK)

| Колонка      | Тип       | Опис            |
| ------------ | --------- | --------------- |
| `id`         | INT PK    |                 |
| `class_id`   | INT       |                 |
| `role`       | RoleEnum  | default student |
| `created_at` | TIMESTAMP |                 |

Relationships: 1↔1 `CognitiveProfile`, 1↔\* `TestResult`, 1↔1 `Trajectory`.

#### **cognitive_profiles** — Когнітивний профіль (КЛЮЧОВА таблиця)

| Колонка            | Тип                         | Опис                                                       |
| ------------------ | --------------------------- | ---------------------------------------------------------- |
| `id`               | INT PK                      |                                                            |
| `student_id`       | INT UNIQUE FK → students.id |                                                            |
| `knowledge_level`  | FLOAT default 50            | Агрегатний рівень знань 0-100 = avg(skills) × 100          |
| `engagement_score` | FLOAT default 50            | Залученість 0-100 (з сенсорів)                             |
| `learning_pace`    | PaceEnum default medium     | Темп навчання                                              |
| `typical_errors`   | JSONB                       | Counter.most_common(5) — топ помилок                       |
| `interests`        | JSONB                       | Список інтересів/хобі                                      |
| `skills`           | JSONB **(BKT)**             | `{skill_name: P(known) 0..1}` — Bayesian Knowledge Tracing |
| `last_updated`     | TIMESTAMP                   | Auto-updated                                               |

**Skills field** — серцевина адаптації. Кожен ключ = тема (наприклад `n_alg_basics`, `n_derivative`), значення = поточна ймовірність володіння. Оновлюється після кожного тесту через BKT-формулу.

#### **trajectories** — Адаптивна траєкторія

| Колонка      | Тип           | Опис                                                         |
| ------------ | ------------- | ------------------------------------------------------------ |
| `id`         | INT PK        |                                                              |
| `student_id` | INT UNIQUE FK |                                                              |
| `topics`     | JSONB         | Список рекомендованих тем (адаптовано під рівень + інтереси) |
| `updated_at` | TIMESTAMP     |                                                              |

#### **lesson_sessions** — Уроки

| Колонка          | Тип          | Опис                                                                                              |
| ---------------- | ------------ | ------------------------------------------------------------------------------------------------- |
| `id`             | INT PK       |                                                                                                   |
| `class_id`       | INT          |                                                                                                   |
| `subject`        | VARCHAR      |                                                                                                   |
| `topic`          | VARCHAR NULL | Тема                                                                                              |
| `date`           | TIMESTAMP    |                                                                                                   |
| `transcript`     | TEXT NULL    | Дослівний текст уроку (з Whisper)                                                                 |
| `vtt_subtitles`  | TEXT NULL    | WebVTT субтитри                                                                                   |
| `video_path`     | VARCHAR NULL | Шлях до відео файлу                                                                               |
| `key_terms`      | JSONB        | AI-екстрагований список ключових термінів                                                         |
| `is_active`      | BOOL         | Активний урок                                                                                     |
| `student_access` | BOOL         | Тест надіслано учням (visible)                                                                    |
| `ai_analysis`    | JSONB NULL   | `{topic, summary, key_terms, strengths, improvements, at_risk_indicators, next_lesson, language}` |
| `avg_engagement` | FLOAT NULL   | Aggregate з RobotEvent                                                                            |
| `avg_fatigue`    | FLOAT NULL   |                                                                                                   |
| `answers_given`  | INT          |                                                                                                   |
| `answers_total`  | INT          |                                                                                                   |

#### **tests** — Тести

| Колонка      | Тип                         | Опис                                                   |
| ------------ | --------------------------- | ------------------------------------------------------ |
| `id`         | INT PK                      |                                                        |
| `lesson_id`  | INT FK → lesson_sessions.id |                                                        |
| `questions`  | JSONB                       | `[{question, options[4], correct_index, explanation}]` |
| `created_at` | TIMESTAMP                   |                                                        |

#### **test_results** — Здачі тестів

| Колонка        | Тип       | Опис                                           |
| -------------- | --------- | ---------------------------------------------- |
| `id`           | INT PK    |                                                |
| `student_id`   | INT FK    |                                                |
| `test_id`      | INT FK    |                                                |
| `answers`      | JSONB     | `{question_index_str: chosen_option_index}`    |
| `score`        | FLOAT     | 0-100                                          |
| `errors`       | JSONB     | Список текстів неправильно відповіданих питань |
| `completed_at` | TIMESTAMP |                                                |

#### **robot_events** — Події з датчиків

| Колонка      | Тип                         | Опис                                       |
| ------------ | --------------------------- | ------------------------------------------ |
| `id`         | INT PK                      |                                            |
| `session_id` | INT FK → lesson_sessions.id | До якого уроку прив'язано                  |
| `type`       | EventTypeEnum               | video / audio / thermal                    |
| `payload`    | JSONB                       | Дані датчика (структура залежить від type) |
| `timestamp`  | TIMESTAMP                   |                                            |

**Payload structures:**

```
thermal: {
  attention_scores: [0..100] × 30 (per-student attention),
  temperature_c: float,
  humidity_percent: float,
  timestamp: ISO
}
audio: {
  student_id: int,
  duration_sec: int,
  type: "answer" | "question" | "noise",
  volume: 0..1,
  timestamp: ISO
}
video: {
  keywords: [str],     # from STT
  confidence: 0..1,
  timestamp: ISO
}
```

#### **lesson_responses** — Відповіді учнів НА уроці (нова таблиця)

| Колонка          | Тип          | Опис                      |
| ---------------- | ------------ | ------------------------- |
| `id`             | INT PK       |                           |
| `student_id`     | INT FK       |                           |
| `lesson_id`      | INT FK       |                           |
| `question`       | TEXT         |                           |
| `given_answer`   | TEXT         | Що сказав учень           |
| `correct_answer` | TEXT         | Що мало бути              |
| `is_correct`     | BOOL         |                           |
| `accuracy`       | INT          | 0-100                     |
| `skill`          | VARCHAR NULL | Яка навичка перевіряється |
| `created_at`     | TIMESTAMP    |                           |

#### **knowledge_nodes** — Граф знань (нова таблиця)

| Колонка   | Тип            | Опис                            |
| --------- | -------------- | ------------------------------- |
| `id`      | VARCHAR(64) PK | "n_derivative", "n_trig_deriv"… |
| `name`    | VARCHAR        | "Похідна функції"               |
| `subject` | VARCHAR        | "Математика"                    |
| `x`, `y`  | INT            | Координати для SVG-розкладки    |
| `prereqs` | JSONB          | `["n_alg_basics", "n_limits"]`  |

Ребра графа обчислюються автоматично з prereqs кожного вузла.

#### **pref_questions / hobby_options** — Опитування переваг

Статичні налаштування UI (раніше були JSON, тепер у БД для централізованого керування).

#### **career_questions / career_results / subject_tracks** — Кар'єрний тест

Статичний контент: 20 питань, 4 професійні напрями (STEM/social/creative/business), мапа `предмет → напрям`.

### 4.3 ER-схема (текстова)

```
SchoolClass 1───* Student 1───1 CognitiveProfile
                  │                  │
                  ├───1 Trajectory   └─ skills (JSONB key→prob)
                  │
                  ├───* TestResult ────► Test ──── LessonSession
                  │                                     │
                  └───* LessonResponse ─────────────────┤
                                                        │
User ──── student_id ─────► Student                     │
                                                        │
                                            * RobotEvent (sensors)

KnowledgeNode * ── prereqs ──*► KnowledgeNode (self-ref via JSONB array)

PrefQuestion ↘
HobbyOption  ─── (static seed)
CareerQuestion ↗
CareerResult ↘
SubjectTrack ─── (static seed)
```

---

## 5. Services Layer / Сервіси

### 5.1 LessonProcessor (`services/lesson_processor.py`)

Конвеєр обробки відео-уроку.

**`transcribe_video(path)`** — повний пайплайн:

1. **ffmpeg**: витягує моно-аудіо 16 кГц, 64 кбіт/с (~21 МБ за 45 хв уроку).
2. **faster-whisper** локально:
   - Спочатку **детекція мови** (uk/en) на перших 30 сек аудіо
   - Потім транскрипція з визначеною мовою → текст + сегменти
   - Будується WebVTT файл субтитрів
3. **Fallback**: якщо локальна модель упала — OpenAI Whisper API.
4. Повертає `{text, vtt, language}`.

**`analyze_transcript(text, language)`** — LLM-аналіз:

- Промпт залежить від мови (uk/en)
- Groq → fallback OpenAI → fallback spaCy term extraction
- Повертає JSON: `topic`, `key_terms[10]`, `summary`, `strengths`, `improvements`, `at_risk_indicators`, `next_lesson`

**`extract_terms(text)`** — spaCy noun_chunks → топ-20 термінів.

### 5.2 ProfileEngine + BKT (`services/profile_engine.py`, `services/bkt.py`)

**Bayesian Knowledge Tracing** (Corbett & Anderson, 1995) — стандартна педагогічна модель з 4 параметрами:

```
P(L₀) = 0.30   — prior: ймовірність що учень вже знає тему ДО першої спроби
P(T)  = 0.15   — transit: ймовірність вивчити навичку після спроби
P(G)  = 0.20   — guess: ймовірність вгадати не знаючи
P(S)  = 0.10   — slip: ймовірність помилитися знаючи
```

**Формула posterior (після відповіді):**

```
Якщо відповідь правильна:
  P(L|✓) = P(L)·(1-S) / (P(L)·(1-S) + (1-P(L))·G)

Якщо неправильна:
  P(L|✗) = P(L)·S / (P(L)·S + (1-P(L))·(1-G))

Потім transit:
  P(L_new) = P(L|obs) + (1 - P(L|obs))·T
```

`ProfileEngine.update_after_test(student_id, score, thermal_scores, audio_events, skill_observations, recent_errors)`:

1. **BKT update** для кожної навички в skill_observations
2. **knowledge_level** = середнє по skills × 100
3. **engagement_score** = `0.7×old + 0.3×(0.6·thermal + 0.4·audio_rate)`
4. **typical_errors** = `Counter.most_common(5)` накопичено з останніх тестів
5. **learning_pace** = тренд по 4 останніх тестах (avg_delta < 2 → slow, > 8 → fast)

### 5.3 TrajectoryEngine (`services/trajectory_engine.py`)

Адаптивна траєкторія:

1. `knowledge < 60` → рівень "repeat" (повторення основ)
2. `knowledge 60-80` → "standard"
3. `knowledge > 80` → "advanced" (поглиблене)

Базові 3 теми за рівнем → AI (Groq/OpenAI) переписує під інтереси учня. Результат кешується в Redis (24 години) за ключем `traj:{student_id}:{level}`.

### 5.4 TestGenerator (`services/test_generator.py`)

Адаптивна генерація тестів:

- **Низький рівень** (< 50%) → 3-4 простих питання, дистрактори далекі
- **Середній** (50-75%) → 4-5 питань
- **Високий** (≥ 75%) → 5-7 питань зі складними дистракторами
- **Slow pace** → -1 питання, простіше формулювання
- **Fast pace** → +1 питання, концептуально

Мова визначається з транскрипту або `ai_analysis.language`. Промпт двомовний (uk/en).

---

## 6. API Endpoints (full list)

Базовий префікс: `/api`. Усі POST/PATCH/PUT приймають JSON.

### Auth (`/api/auth`)

| Метод | Шлях        | Опис                        |
| ----- | ----------- | --------------------------- |
| POST  | `/login`    | JWT login                   |
| POST  | `/register` | Реєстрація з approved=false |
| GET   | `/me`       | Поточний користувач         |
| POST  | `/seed`     | Manual seed (idempotent)    |

### Admin (`/api/admin`)

| Метод | Шлях                  | Опис                                                  |
| ----- | --------------------- | ----------------------------------------------------- |
| GET   | `/pending`            | Користувачі що чекають approve                        |
| GET   | `/users`              | Всі користувачі                                       |
| PATCH | `/users/{id}/approve` | Підтвердити                                           |
| GET   | `/subjects`           | Список предметів                                      |
| GET   | `/classes`            | Список класів                                         |
| GET   | `/notifications`      | Сповіщення про погані умови (temp/humidity/attention) |
| POST  | `/reseed-sensors`     | Перестворити sensor events для всіх уроків            |

### Students (`/api/students`)

| Метод | Шлях              | Опис                                        |
| ----- | ----------------- | ------------------------------------------- |
| GET   | `/{id}`           | Учень                                       |
| GET   | `/{id}/profile`   | CognitiveProfile (включно зі skills/BKT)    |
| PATCH | `/{id}/profile`   | Оновити інтереси/рівень                     |
| GET   | `/{id}/results`   | Всі тестові результати                      |
| POST  | `/{id}/ai_advice` | AI-порада досвідченого вчителя (3-6 речень) |

### Lessons (`/api/lessons`)

| Метод | Шлях                 | Опис                                        |
| ----- | -------------------- | ------------------------------------------- |
| POST  | `/`                  | Створити урок (auto-seed sensor events)     |
| GET   | `/`                  | Список (?class_id, ?subject)                |
| GET   | `/{id}`              | Один урок                                   |
| POST  | `/{id}/upload`       | Завантажити відео → background Whisper      |
| POST  | `/{id}/transcribe`   | Re-trigger транскрипцію                     |
| POST  | `/{id}/analyze`      | Re-run AI-аналіз                            |
| PATCH | `/{id}/transcript`   | Manual edit транскрипту                     |
| GET   | `/{id}/video`        | Streams MP4                                 |
| GET   | `/{id}/vtt`          | WebVTT субтитри                             |
| GET   | `/{id}/sensors`      | Aggregated sensor data + attention timeline |
| GET   | `/{id}/audio_events` | Окремі голосові події                       |
| POST  | `/{id}/explain`      | **AI-пояснення під профіль учня + хобі**    |
| PATCH | `/{id}/access`       | Toggle student_access                       |

### Tests (`/api/tests`)

| Метод | Шлях                                | Опис                                                       |
| ----- | ----------------------------------- | ---------------------------------------------------------- |
| POST  | `/generate/{lesson_id}?student_id=` | AI-генерація тесту з транскрипту з адаптацією під студента |
| POST  | `/save/{lesson_id}`                 | Зберегти/оновити                                           |
| GET   | `/{test_id}`                        | Тест                                                       |
| GET   | `/lesson/{lesson_id}`               | Усі тести уроку                                            |
| GET   | `/lesson/{lesson_id}/analytics`     | Розподіл оцінок                                            |
| POST  | `/results`                          | Здача тесту → BKT update в background                      |

### Trajectory (`/api/trajectory`)

| Метод | Шлях                    | Опис                     |
| ----- | ----------------------- | ------------------------ |
| GET   | `/{student_id}`         | Поточна траєкторія       |
| POST  | `/{student_id}/refresh` | Force re-generate via AI |

### Content (`/api/content` — статичний контент + LessonResponses)

| Метод | Шлях                                  | Опис                                       |
| ----- | ------------------------------------- | ------------------------------------------ |
| GET   | `/preferences/questions`              | 6 питань початкового опитування            |
| GET   | `/preferences/hobbies`                | 13 хобі                                    |
| GET   | `/career/questions`                   | 20 питань кар'єрного тесту                 |
| GET   | `/career/results`                     | 4 професійні напрями                       |
| GET   | `/career/track-labels`                | Описові назви напрямів                     |
| GET   | `/career/subject-tracks`              | Мапа предмет→напрям                        |
| GET   | `/knowledge-graph`                    | nodes + edges                              |
| GET   | `/students/{id}/knowledge-mastery`    | Per-student mastery з BKT                  |
| GET   | `/lessons/{id}/responses?student_id=` | Відповіді на уроці                         |
| GET   | `/students/{id}/lesson-responses`     | Усі відповіді учня згруповані по уроках    |
| POST  | `/lessons/{id}/responses`             | Новий response (для майбутнього real-time) |

---

## 7. Frontend Architecture / Архітектура фронта

### 7.1 Структура

```
src/
├── App.tsx                      # Routing + Providers
├── main.tsx                     # Entry point (CSS imports)
├── index.css                    # Global styles + CSS vars (light/dark themes)
├── styles/neuro.css             # Tailwind directives + neuro effects
├── api/client.ts                # Axios instance with JWT interceptor
├── contexts/
│   ├── AuthContext.tsx          # Login/logout, current user
│   ├── ThemeContext.tsx         # Light/dark toggle
│   └── StaticContentContext.tsx # DB-loaded content (prefs, career, classes, students)
├── pages/
│   ├── LoginPage.tsx            # Neuro-cinematic login
│   ├── RegisterPage.tsx         # Neuro-cinematic register
│   ├── StudentApp.tsx           # Student dashboard + 8 sections
│   ├── TeacherApp.tsx           # Teacher dashboard + 5 sections
│   └── AdminApp.tsx             # Admin dashboard + 4 sections
├── components/neuro/            # Dark cinematic neuro design system
│   ├── NeuroLessonView.tsx      # Main lesson detail view
│   ├── KnowledgeMap.tsx         # SVG graph visualization
│   └── NeuroDepth.tsx           # 3D background layer
└── data/mocks/
    ├── index.ts                 # Exports MOCK_LESSON_ANALYTICS only (corner-case)
    └── lessonAnalytics.json     # AI summary fallback
```

### 7.2 Theming

- **Dark cinematic neuro** (default) + **Light** themes
- Switch via `data-theme="dark|light"` attribute on `<html>`
- Tailwind colors are mapped to CSS vars: `--neuro-bg-rgb`, `--neuro-card-rgb`, etc.
- Brand accents (teal #00E6C8, gold #E8B923, coral #FF5E7A) are fixed across themes
- Background grid (synaptic dots) and floating glow blobs visible everywhere via body::before

### 7.3 Three role-based apps

**StudentApp.tsx** — 8 розділів у sidebar:

1. **Home** — мотиваційний банер (на основі профілю) + останні уроки
2. **Lessons** — список уроків з персоналізованим AI-поясненням, дослівний транскрипт + переказ простіше з хобі-аналогіями (2 речення на хобі), examples, selfcheck
3. **Tests** — тести від вчителя, проходження inline (TakeTestPage)
4. **Progress** — мотиваційний банер + місячна динаміка + **KnowledgeMap (BKT)** + траєкторія
5. **Journal** — щоденник: уроки з реальними оцінками (test_results)
6. **Schedule** — тижневий розклад + дзвінки (статичне за grade)
7. **Career** — профорієнтаційний тест (20 питань) + sticker з предметом-фаворитом
8. **Profile** — info / preferences / hobbies + редагування

**TeacherApp.tsx** — 5 розділів:

1. **Overview** — мої класи + останні уроки + ресурси по предмету + НМТ підготовка
2. **Lessons** — список + клік → **NeuroLessonView** (відео, транскрипт, тест, аналітика)
3. **Tests** — задані тести з % здавачів + per-test review учнів
4. **Students** — картки учнів з cognitive profile + AI порада + інтереси + траєкторія
5. **Journal** — повна 12-бальна таблиця з real test_results

**AdminApp.tsx** — 4 розділи:

1. **Overview** — статистика + швидкі дії + popup нових реєстрацій
2. **Notifications** — погані умови класу з робот-сенсорів
3. **Pending** — підтвердження нових юзерів
4. **All Users** — клікабельний список з фільтрами

### 7.4 NeuroLessonView (key component)

Розгорнутий перегляд уроку для вчителя (`components/neuro/NeuroLessonView.tsx`). Структура:

1. **Sidebar** — Огляд / Уроки / Тести / Учні / Журнал
2. **Header** — back, breadcrumb, AI badge
3. **4 MetricPods** — Залученість / Втома / Відповіді / Тест (circular progress + glow)
4. **SensorCard** — Увага класу / Температура / Вологість / Голосові події (clickable → деталі)
5. **NeuralTimeline** — waveform + per-point dots + bottom mini-bars
6. **Phrase pills** — key_terms або video_keywords
7. **Tabs**: Урок / Тест / Аналітика
8. **Tab content**:
   - **Урок**: VideoPlayer (unified circular teal controls) + VideoUploader + **TranscriptEditor** (auto-pulled from Whisper, dirty indicator)
   - **Тест**: TestEditor (generate from transcript + edit questions + save + send to students)
   - **Аналітика**: 4 top metrics + AI summary + grade distribution + top skills + common errors + **StudentLessonResponsesPanel** (click student → review answers + skill impact)

### 7.5 KnowledgeMap (BKT visualization)

`components/neuro/KnowledgeMap.tsx` — SVG-граф навичок учня:

- 21+ pill nodes з name + % mastery всередині (адаптивний viewBox)
- Колір залежно від mastery: ≥75% зелений, 50-75% teal, 25-50% gold, <25% coral
- Стрілки prereq з teal-glow на hover
- Hover на ноду → деталі + статус + передумови
- Дані тягне з `/api/knowledge-graph` (топологія) + `/api/students/{id}/knowledge-mastery` (live BKT skills)

---

## 8. Mock data status / Стан моків

Майже все мігровано в БД (через `static_seed.py` при старті):

| Що                                         | Звідки                                                                | Стан                                                                                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Учні, класи, предмети, вчителі             | `auth.py` seed → БД                                                   | ✅ DB                                                                                                                      |
| Уроки (24 моки) + transcripts              | `auth.py` seed → БД                                                   | ✅ DB                                                                                                                      |
| Sensor events для кожного уроку            | `auth.py` seed → БД (можна re-seed через `/api/admin/reseed-sensors`) | ✅ DB                                                                                                                      |
| Тести / test results                       | Live (від вчителя/учня)                                               | ✅ DB                                                                                                                      |
| Cognitive profiles + skills (BKT)          | Seed + live updates                                                   | ✅ DB                                                                                                                      |
| Preferences questions, hobbies             | `backend/app/data/preferences.json` → seed → БД                       | ✅ DB                                                                                                                      |
| Career test (20 questions, 4 results)      | `backend/app/data/career.json` → seed → БД                            | ✅ DB                                                                                                                      |
| Subject → career track mapping             | `backend/app/data/career.json` → seed → БД                            | ✅ DB                                                                                                                      |
| Knowledge graph (21 nodes)                 | `backend/app/data/knowledgeGraph.json` → seed → БД                    | ✅ DB                                                                                                                      |
| Per-student mastery                        | `cognitive_profiles.skills`                                           | ✅ DB                                                                                                                      |
| Lesson responses (5 students × 10 lessons) | `backend/app/data/studentLessonResponses.json` → seed → БД            | ✅ DB                                                                                                                      |
| **lessonAnalytics.json**                   | `frontend/src/data/mocks/`                                            | ⚠️ Single remaining mock — corner-case fallback for AI summary + topSkills + commonErrors when test has no submissions yet |

---

## 9. Deployment / Розгортання

### 9.1 docker-compose.yml — 6 сервісів

```yaml
services:
  db: postgres:15 # port 5432, healthcheck pg_isready
  redis: redis:7-alpine # health redis-cli ping
  mqtt: eclipse-mosquitto # broker for sensors
  api: custom Python 3.11 # port 8000, uvicorn --reload, volume ./backend/app
  robot-mock: custom (same image) # publishes to /robot/* every 5s
  frontend: custom Node 20 # port 5173, Vite dev, volumes for src
```

### 9.2 Запуск

```bash
docker-compose up -d --build

docker-compose up -d
```

Доступ:

- `http://localhost:5173` — frontend
- `http://localhost:8000/docs` — Swagger API

### 9.3 Environment vars (.env)

```
GROQ_API_KEY=gsk_...           # primary LLM
OPENAI_API_KEY=sk-...           # fallback LLM + Whisper
DATABASE_URL=postgresql+asyncpg://...
REDIS_URL=redis://redis:6379/0
MQTT_HOST=mqtt
JWT_SECRET=...
```

### 9.4 Demo accounts (after seed)

| Role          | Username                  | Password     | Notes                |
| ------------- | ------------------------- | ------------ | -------------------- |
| Admin         | `admin`                   | `Admin2024!` |                      |
| Class teacher | `class_teacher`           | `Class2024!` | homeroom 10А         |
| Math teacher  | `math_teacher`            | `Math2024!`  |                      |
| Physics       | `physics_teacher`         | `Phys2024!`  |                      |
| English       | `eng_teacher`             | `Eng2024!`   |                      |
| Student 10А   | `student01` … `student05` | `Learn2024!` | 5 учнів з мок-даними |

---

## 10. Key Algorithms — формули і рішення

### 10.1 BKT update (Corbett & Anderson 1995)

```python
def bkt_update(p_known: float, correct: bool,
               p_t=0.15, p_g=0.20, p_s=0.10) -> float:

    if correct:
        num = p_known * (1 - p_s)
        den = num + (1 - p_known) * p_g
    else:
        num = p_known * p_s
        den = num + (1 - p_known) * (1 - p_g)
    posterior = num / den if den > 0 else p_known

    return posterior + (1 - posterior) * p_t
```

Aggregate `knowledge_level = mean(skills.values()) × 100`.

### 10.2 Engagement з сенсорики

```python
engagement = 0.7 × old + 0.3 × (0.6 × avg_thermal_attention
                              + 0.4 × audio_answer_rate)
```

### 10.3 Learning pace (по 4 останніх тестах)

```python
deltas = [scores[i+1] - scores[i] for i ...]
avg_delta = mean(deltas)
pace = slow if avg_delta < 2
      else fast if avg_delta > 8
      else medium
```

### 10.4 Adaptive test generation (TestGenerator)

```python
if knowledge_level < 50:    n = 3-4; difficulty = EASY; distractors_far = True
elif knowledge_level < 75:  n = 4-5; difficulty = MEDIUM
else:                       n = 5-7; difficulty = HARD; tricky_edge_cases = True
if pace == "slow":          n -= 1; short_phrasing = True
elif pace == "fast":        n += 1; conceptual_questions = True
```

### 10.5 Адаптивний промпт `/explain`

В промпт LLM передаються:

- Тема + предмет
- 1-2 головних хобі учня (для аналогій)
- depth_hint (залежно від knowledge_level)
- pace_hint
- engagement_hint
- Транскрипт уроку (до 12000 символів, з middle skip якщо довший)
- key_terms (до 15, з вимогою "розкрий КОЖЕН")
- summary з попереднього аналізу

LLM повертає:

```json
{
  "original_explanation": ["абзац 1", ...],
  "adapted_explanation": ["переказ 1", ...],
  "examples": [{"title", "solution"}],
  "selfcheck": [{q, type, options, correct}],
  "encourage": "..."
}
```

---

## 11. Sensor / Robot subsystem

### 11.1 Склад датчиків роботa-асистента

Робот-асистент моделюється як уніфікований сенсорний модуль з **4 фізичними датчиками**, але логічно їх дані групуються в **3 MQTT-топіки** (термокамера + термометр + гігрометр публікуються разом, бо це одна апаратна плата клімат-контролю):

| #   | Датчик / Sensor                                      | Що вимірює                                                                                                      | Топік / Topic                       | EventType в БД |
| --- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------- | -------------- |
| 1   | **Камера** (Camera + STT)                            | Відеопотік → ключові слова з розпізнаного мовлення                                                              | `/robot/video`                      | `video`        |
| 2   | **Мікрофон** (Microphone)                            | Окремі голосові події: питання учня / відповідь / шум                                                           | `/robot/audio`                      | `audio`        |
| 3   | **Термокамера** (Thermal IR camera)                  | Інфрачервона мапа класу → 30 значень `attention_scores[]` (одне на кожне крісло — за тепловим патерном і позою) | `/robot/thermal`                    | `thermal`      |
| 4   | **Термометр + гігрометр** (Thermometer + Hygrometer) | Температура повітря (°C), відносна вологість (%) — мікроклімат приміщення                                       | `/robot/thermal` (в тому ж payload) | `thermal`      |

**Обґрунтування об'єднання термокамери + термометра в один топік:** реалізовано як спільну плату клімат-моніторингу — економія MQTT-трафіку і логічна спорідненість (всі три виміри стосуються "фізичного стану класу"). На рівні БД зберігається в єдиному `RobotEvent.type = thermal` з усіма трьома полями в JSONB-payload.

### 11.2 MQTT-протокол

Кожні 5 секунд `robot-mock` сервіс публікує:

```
/robot/video    → {
                    keywords: [str],          # розпізнані терміни з мовлення
                    confidence: 0..1,
                    timestamp: ISO
                  }

/robot/audio    → {
                    student_id: int,          # ID учня (від мапування облич)
                    duration_sec: int,        # тривалість висловлювання
                    type: "answer" | "question" | "noise",
                    volume: 0..1,             # рівень гучності
                    timestamp: ISO
                  }

/robot/thermal  → {
                    attention_scores: [0..100] × 30,   # ← термокамера (per-student)
                    temperature_c: float,              # ← термометр (°C)
                    humidity_percent: float,           # ← гігрометр (%)
                    timestamp: ISO
                  }
```

### 11.3 MQTT subscriber (`backend/app/main.py`)

API підписаний на `#` (всі топіки). Приймає payload, але **не записує live в БД** автоматично — для цього треба прив'язати до конкретного `session_id` уроку. Замість цього використовується **batch-seed** при створенні уроку (`_seed_sensor_events_for_lesson`).

### 11.4 Bad conditions (для admin notifications)

В seed навмисно створюються погані умови:

| Сценарій           | Lesson indices   | Значення           |
| ------------------ | ---------------- | ------------------ |
| Спекотно (>26°C)   | 2, 8, 11, 14, 17 | t=27.8°C           |
| Критично спекотно  | 17               | t=30.2°C, h=35%    |
| Холодно (<18°C)    | 6, 13            | t=16.5°C           |
| Сухо (<30%)        | 3, 10, 16        | h=24%              |
| Волого (>70%)      | 5, 18            | h=78%              |
| Низька увага класу | 12, 15           | attention_floor=25 |

Endpoint `/api/admin/notifications` сканує останні 100 thermal events і повертає попередження з порадами.

---

## 12. UI Design System / Дизайн-система

### 12.1 Палітра

- **Background**: `#050507` → `#0C0C12` (dark) / `#F4F6FB` → `#FFF` (light)
- **Cards**: `#0B0C13` (dark) / `#FFFFFF` (light)
- **Primary accent**: `#00E6C8` (electric teal-cyan з glow)
- **Secondary**: `#E8B923` (warm gold)
- **Attention**: `#FF5E7A` (soft coral, sparingly)

### 12.2 Effects

- Synaptic dot grid (background-image на body)
- Floating glow blobs (animation `bodyDrift`)
- Neural lines (SVG)
- Floating particles з 3D `translateZ` parallax
- Pulse-soft, drift, shimmer, wave-pulse keyframes
- Glow shadows (multi-layered box-shadow з teal/gold/coral)

### 12.3 Typography

- **Inter** font primary
- Headings tracking -0.012em
- Tabular numbers для метрик

---

## 13. File Reference / Карта файлів проєкту

### Backend

```
backend/app/
├── main.py                      # FastAPI entry, lifespan, routes
├── database.py                  # AsyncEngine + Base
├── models.py                    # All SQLAlchemy models
├── schemas.py                   # Pydantic DTOs
├── api/
│   ├── auth.py                  # Login/register/seed
│   ├── admin.py                 # Pending/users/notifications/reseed-sensors
│   ├── students.py              # Profile + ai_advice
│   ├── lessons.py               # CRUD + Whisper + explain + sensors
│   ├── tests.py                 # Generate/save/results
│   ├── trajectory.py            # Adaptive trajectory
│   └── content.py               # Static content + lesson_responses
├── services/
│   ├── lesson_processor.py      # Whisper + Groq/OpenAI
│   ├── test_generator.py        # Adaptive test gen
│   ├── profile_engine.py        # BKT updates
│   ├── trajectory_engine.py     # Redis-cached AI traj
│   ├── bkt.py                   # BKT formulas
│   └── static_seed.py           # JSON → DB seed
├── data/                        # Seed JSON sources
│   ├── preferences.json
│   ├── career.json
│   ├── knowledgeGraph.json
│   └── studentLessonResponses.json
└── robot_mock/
    └── simulator.py             # MQTT publisher

backend/Dockerfile               # python:3.11-slim + ffmpeg + faster-whisper tiny pre-download
backend/requirements.txt
```

### Frontend

```
frontend/src/
├── App.tsx                      # Routes + Providers
├── main.tsx
├── index.css                    # CSS vars (dark/light), button/input/tab styles
├── styles/neuro.css             # Tailwind directives + neuro effects
├── api/client.ts                # Axios with JWT interceptor
├── contexts/
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── StaticContentContext.tsx # All static data from API at app start
├── pages/                       # 5 pages
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── StudentApp.tsx
│   ├── TeacherApp.tsx
│   └── AdminApp.tsx
└── components/neuro/
    ├── NeuroLessonView.tsx      # Lesson detail (1500+ lines)
    ├── KnowledgeMap.tsx         # SVG graph
    └── NeuroDepth.tsx           # 3D background

frontend/tailwind.config.js       # Custom colors via CSS vars
frontend/postcss.config.js
frontend/vite.config.ts
frontend/Dockerfile
```

### Infrastructure

```
docker-compose.yml               # 6 services
mosquitto.conf                   # MQTT config
.env                             # API keys (gitignored)
```

---

## 14. Diploma defense talking points / Тези для захисту

### Сильні сторони (sell these)

1. **Замкнена адаптаційна петля**: сенсори → BKT-профіль → AI-промпт → персональний контент → нові дані. Це **демонструється** реальним кодом і UI.
2. **3-рівневий AI-стек з fallback**: faster-whisper local + Groq + OpenAI. Інженерно ґрунтовно.
3. **BKT — академічно валідована модель** (Corbett & Anderson 1995), а не евристика.
4. **Граф знань** з prereqs і SVG-візуалізацією — наочно.
5. **Robot-mock через MQTT** — архітектурно правильно, готово до підключення реального робота.
6. **Темна cinematic дизайн-система** з кастомним Tailwind + lucide-react — сучасно.
7. **Чиста архітектура**: 99% даних з БД, лише 1 corner-case JSON-мок.

### Слабкі сторони (для чесної відповіді)

- Робот фізично відсутній → "цифровий twin готовий, можна підключити реальне залізо".
- Когнітивний профіль — proof-of-concept BKT, не повноцінний adaptive system з IRT/PFA.
- Граф знань поки 21 вузол на 2 предмети — обмежений демо-розмір.
- Frontend має деякі legacy-залишки (lessonAnalytics.json) — можна прибрати в production.

### Майбутній розвиток

- Реальний робот через ROS2 з тими ж MQTT-топіками
- Розширення графа знань на повну шкільну програму
- IRT-модель замість BKT для exam-grade оцінювання
- Mobile app (React Native, share API)
- Group analytics (клас vs клас, predictive ML)

---

## 15. Quick demo flow / Сценарій демонстрації

```
1. admin / Admin2024!
   → Сповіщення: 12 попереджень про погані умови
   → Очікують: 0 (всі учні підтверджені)
   → Користувачі: 8 класів, 20 учнів, 8 вчителів

2. teacher: math_teacher / Math2024!
   → Уроки → клік "Похідна функції" → NeuroLessonView
     - 4 metric pods
     - Sensor data: температура, вологість, увага, голосові події
     - Neural Timeline з 12 точками
     - Tab "Тест" → "Згенерувати з транскрипту" → AI створює 5 питань
     - Tab "Аналітика" → AI summary + розподіл оцінок + 5 учнів з % точності
   → Учні → клік "Олексій Бондаренко" → AI порада (3-6 речень)

3. student: student01 / Learn2024!
   → Головна: "Молодець, так тримати!" + 4 останні уроки
   → Уроки → клік "Похідна" → 6-10 абзаців пояснення з аналогіями
     - Дослівний транскрипт зверху
     - Адаптоване пояснення з 1-2 хобі-аналогіями
     - Examples + selfcheck
   → Прогрес → KnowledgeMap: 21 тема, кольори за BKT mastery
   → Тести → пройти тест → результат з'являється в журналі
   → Профорієнтація: 20 питань + sticker з предметом-фаворитом
```

---

_Documentation generated for AdaptLearn — Information System for Adaptive Management of a Student's Learning Trajectory Using a Robotic Assistant and Cognitive Profile Analysis._
