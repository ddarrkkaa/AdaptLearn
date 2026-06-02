import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme, PALETTES } from "../contexts/ThemeContext";
import client from "../api/client";
 

const MOCK_LESSONS = [
  {
    id: 101, subject: "Математика", classId: 1, className: "10А", date: "12.05.2026",
    topic: "Похідна функції та її застосування",
    engagement: 78, fatigue: 32, answersGiven: 24, answersTotal: 30, testScore: 72,
    tags: ["похідна", "функція", "межі"],
    video: null,
    testQuestions: [
      { q: "Що таке похідна функції?", correct: "Границя відношення приросту функції до приросту аргументу", options: ["Сума функцій", "Границя відношення...", "Різниця функцій", "Добуток функцій"] },
      { q: "Знайди похідну f(x)=x²", correct: "2x", options: ["x²", "2x", "x", "2"] },
      { q: "При якому значенні х функція f(x)=x²-4x має мінімум?", correct: "x=2", options: ["x=0", "x=2", "x=4", "x=-2"] },
    ],
    studentScores: { 1: 85, 2: 70, 3: 92, 4: 60, 5: 78 },
  },
  {
    id: 102, subject: "Математика", classId: 1, className: "10А", date: "08.05.2026",
    topic: "Тригонометричні функції",
    engagement: 65, fatigue: 45, answersGiven: 20, answersTotal: 30, testScore: 61,
    tags: ["синус", "косинус", "тангенс"],
    video: null,
    testQuestions: [
      { q: "Чому дорівнює sin(90°)?", correct: "1", options: ["0", "1", "−1", "0.5"] },
      { q: "Чому дорівнює cos(0°)?", correct: "1", options: ["0", "1", "−1", "√2/2"] },
    ],
    studentScores: { 1: 70, 2: 55, 3: 80, 4: 45, 5: 65 },
  },
  {
    id: 103, subject: "Українська мова", classId: 2, className: "10Б", date: "11.05.2026",
    topic: "Синтаксис. Складнопідрядне речення",
    engagement: 83, fatigue: 28, answersGiven: 27, answersTotal: 30, testScore: 79,
    tags: ["синтаксис", "підрядне речення", "сполучники"],
    video: null,
    testQuestions: [
      { q: "Що таке підрядне речення?", correct: "Залежна частина складного речення", options: ["Головна частина", "Залежна частина...", "Самостійне речення", "Вставне слово"] },
    ],
    studentScores: { 6: 90, 7: 75, 8: 85, 9: 70, 10: 82 },
  },
  {
    id: 104, subject: "Фізика", classId: 1, className: "10А", date: "07.05.2026",
    topic: "Закони збереження енергії",
    engagement: 71, fatigue: 38, answersGiven: 22, answersTotal: 30, testScore: 68,
    tags: ["енергія", "закони збереження", "механіка"],
    video: null,
    testQuestions: [
      { q: "Сформулюй закон збереження енергії", correct: "Енергія не зникає і не виникає...", options: ["Енергія зникає", "Енергія не зникає...", "Сила збережена", "Маса збережена"] },
    ],
    studentScores: { 1: 65, 2: 80, 3: 55, 4: 75, 5: 60 },
  },
  {
    id: 105, subject: "Математика", classId: 2, className: "10Б", date: "06.05.2026",
    topic: "Геометрія: коло та його властивості",
    engagement: 88, fatigue: 22, answersGiven: 28, answersTotal: 30, testScore: 84,
    tags: ["коло", "геометрія", "площа"],
    video: null,
    testQuestions: [],
    studentScores: { 6: 88, 7: 80, 8: 92, 9: 78, 10: 85 },
  },
];

const MOCK_STUDENTS = [
  { id: 1,  name: "Олексій Бондаренко",  classId: 1, className: "10А" },
  { id: 2,  name: "Марія Іваненко",       classId: 1, className: "10А" },
  { id: 3,  name: "Дмитро Кравченко",     classId: 1, className: "10А" },
  { id: 4,  name: "Аніта Мельник",        classId: 1, className: "10А" },
  { id: 5,  name: "Тарас Олійник",        classId: 1, className: "10А" },
  { id: 6,  name: "Катерина Шевчук",      classId: 2, className: "10Б" },
  { id: 7,  name: "Андрій Гриценко",      classId: 2, className: "10Б" },
  { id: 8,  name: "Наталя Лисенко",       classId: 2, className: "10Б" },
  { id: 9,  name: "Василь Романенко",     classId: 2, className: "10Б" },
  { id: 10, name: "Юлія Тимошенко",       classId: 2, className: "10Б" },
];
 

function engColor(v: number) {
  if (v >= 70) return "#22c55e";
  if (v >= 45) return "#f59e0b";
  return "#ef4444";
}

function engBg(v: number) {
  if (v >= 70) return "#dcfce7";
  if (v >= 45) return "#fef3c7";
  return "#fee2e2";
}

function avg(vals: number[]) {
  if (!vals.length) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}
 

function Header({ name, onLogout }: { name: string; onLogout: () => void }) {
  const { theme, toggleTheme, palette, setPalette } = useTheme();
  const [showPalette, setShowPalette] = useState(false);
  return (
    <header style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "0 24px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "30px", height: "30px", background: "var(--primary)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🧠</div>
        <span style={{ fontWeight: 700, fontSize: "16px", color: "var(--text)" }}>AdaptLearn</span>
        <span className="badge badge-blue" style={{ marginLeft: "4px" }}>Вчитель</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ position: "relative" }}>
          <button className="btn btn-ghost" onClick={() => setShowPalette(!showPalette)} style={{ padding: "8px 10px", fontSize: "14px" }} title="Кольорова гама">🎨</button>
          {showPalette && (
            <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "12px", boxShadow: "var(--shadow-md)", display: "flex", gap: "8px", zIndex: 200 }}>
              {PALETTES.map((p) => (
                <button key={p.id} title={p.label} onClick={() => { setPalette(p.id); setShowPalette(false); }}
                  style={{ width: "22px", height: "22px", borderRadius: "50%", background: p.color, cursor: "pointer", border: palette === p.id ? "2px solid var(--text)" : "2px solid transparent", outline: palette === p.id ? "2px solid var(--primary)" : "none", outlineOffset: "1px" }} />
              ))}
            </div>
          )}
        </div>
        <button className="btn btn-ghost" onClick={toggleTheme} style={{ padding: "8px 10px", fontSize: "16px" }}>{theme === "dark" ? "☀️" : "🌙"}</button>
        <div style={{ width: "1px", height: "20px", background: "var(--border)" }} />
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>{name}</span>
        <button className="btn btn-ghost" onClick={onLogout} style={{ padding: "8px 10px", fontSize: "13px" }}>Вийти</button>
      </div>
    </header>
  );
}
 

function StatCard({ icon, value, label, color, sub }: { icon: string; value: string | number; label: string; color?: string; sub?: string }) {
  return (
    <div className="card" style={{ padding: "18px 16px", flex: "1 1 0", minWidth: "110px" }}>
      <div style={{ fontSize: "20px", marginBottom: "8px" }}>{icon}</div>
      <div style={{ fontSize: "22px", fontWeight: 800, color: color ?? "var(--primary)", marginBottom: "2px" }}>{value}</div>
      {sub && <div style={{ fontSize: "10px", color: color ?? "var(--primary)", fontWeight: 600, marginBottom: "3px" }}>{sub}</div>}
      <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>{label}</div>
    </div>
  );
}
 
function LessonCard({ lesson, onClick }: { lesson: typeof MOCK_LESSONS[0]; onClick: () => void }) {
  return (
    <div className="card" style={{ padding: "20px", cursor: "pointer", transition: "box-shadow var(--tr), transform 100ms ease" }}
      onClick={onClick}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow)"; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "3px" }}>{lesson.topic}</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{lesson.subject} · {lesson.className} · {lesson.date}</div>
        </div>
        <span className="badge" style={{ background: engBg(lesson.engagement), color: engColor(lesson.engagement), flexShrink: 0 }}>{lesson.engagement}%</span>
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {lesson.tags.map((t) => <span key={t} className="badge badge-blue" style={{ fontSize: "10px" }}>{t}</span>)}
      </div>
      <div style={{ display: "flex", gap: "16px", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>📊 Тест: <strong style={{ color: "var(--text)" }}>{lesson.testScore}%</strong></span>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>✋ Відповіді: <strong style={{ color: "var(--text)" }}>{lesson.answersGiven}/{lesson.answersTotal}</strong></span>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>😴 Втома: <strong style={{ color: lesson.fatigue > 50 ? "var(--danger)" : "var(--text)" }}>{lesson.fatigue}%</strong></span>
      </div>
    </div>
  );
}
 

function TestEditor({ lesson }: { lesson: typeof MOCK_LESSONS[0] }) {
  const [questions, setQuestions] = useState(lesson.testQuestions.map((q) => ({ ...q })));
  const [saved, setSaved] = useState(false);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  if (!questions.length) {
    return (
      <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
        <div style={{ fontSize: "36px", marginBottom: "12px" }}>📋</div>
        <p>Тест ще не створено для цього уроку</p>
        <button className="btn btn-primary" style={{ marginTop: "16px" }}
          onClick={() => setQuestions([{ q: "Нове питання", correct: "Правильна відповідь", options: ["Правильна відповідь", "Варіант 2", "Варіант 3", "Варіант 4"] }])}>
          Створити тест
        </button>
      </div>
    );
  }

  return (
    <div>
      {questions.map((q, qi) => (
        <div key={qi} className="card" style={{ padding: "20px", marginBottom: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Питання {qi + 1}</span>
            <button onClick={() => setQuestions(questions.filter((_, i) => i !== qi))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", fontSize: "16px" }}>✕</button>
          </div>
          <input type="text" value={q.q} onChange={(e) => { const n = [...questions]; n[qi] = { ...n[qi], q: e.target.value }; setQuestions(n); }} style={{ marginBottom: "10px" }} />
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Варіанти відповідей</div>
          {q.options.map((opt, oi) => (
            <div key={oi} style={{ display: "flex", gap: "8px", marginBottom: "6px", alignItems: "center" }}>
              <button onClick={() => { const n = [...questions]; n[qi] = { ...n[qi], correct: opt }; setQuestions(n); }}
                style={{ width: "20px", height: "20px", borderRadius: "50%", border: q.correct === opt ? "2px solid var(--primary)" : "2px solid var(--border)", background: q.correct === opt ? "var(--primary)" : "transparent", cursor: "pointer", flexShrink: 0 }} />
              <input type="text" value={opt} onChange={(e) => { const n = [...questions]; const opts = [...n[qi].options]; opts[oi] = e.target.value; n[qi] = { ...n[qi], options: opts }; setQuestions(n); }} />
            </div>
          ))}
        </div>
      ))}
      <div style={{ display: "flex", gap: "10px" }}>
        <button className="btn btn-ghost" onClick={() => setQuestions([...questions, { q: "Нове питання", correct: "Варіант 1", options: ["Варіант 1", "Варіант 2", "Варіант 3", "Варіант 4"] }])}>+ Питання</button>
        <button className="btn btn-primary" onClick={save}>{saved ? "✅ Збережено!" : "Зберегти тест"}</button>
      </div>
    </div>
  );
}
 

function StudentDetail({ studentId, profiles }: { studentId: number; profiles: Record<number, { knowledge_level: number; engagement_score: number; learning_pace: string }> }) {
  const s = MOCK_STUDENTS.find((x) => x.id === studentId);
  const p = profiles[studentId];
  const lessons = MOCK_LESSONS.filter((l) => l.classId === s?.classId && l.studentScores[studentId as keyof typeof l.studentScores]);

  if (!s) return null;
  return (
    <div className="fade-in">
      <div className="card" style={{ padding: "24px", marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "var(--primary-10)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
            {s.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>{s.name}</div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Клас {s.className}</div>
          </div>
        </div>
        {p && (
          <div style={{ display: "flex", gap: "12px" }}>
            <StatCard icon="📚" value={`${p.knowledge_level.toFixed(0)}%`} label="Рівень знань" color={engColor(p.knowledge_level)} />
            <StatCard icon="⚡" value={`${p.engagement_score.toFixed(0)}%`} label="Залученість" color={engColor(p.engagement_score)} />
            <StatCard icon="🏃" value={{ slow: "Повільний", medium: "Середній", fast: "Швидкий" }[p.learning_pace] ?? p.learning_pace} label="Темп" />
          </div>
        )}
      </div>
      <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text)", marginBottom: "12px" }}>Результати уроків</div>
      {lessons.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {lessons.map((l) => {
            const score = l.studentScores[studentId as keyof typeof l.studentScores] ?? 0;
            return (
              <div key={l.id} className="card" style={{ padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{l.topic}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{l.subject} · {l.date}</div>
                </div>
                <span style={{ fontSize: "20px", fontWeight: 800, color: engColor(score) }}>{score}%</span>
              </div>
            );
          })}
        </div>
      ) : <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Даних по урокам ще немає</p>}
    </div>
  );
}
 

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [classId, setClassId] = useState(1);
  const [tab, setTab] = useState<"class" | "lessons" | "students">("class");
  const [profiles, setProfiles] = useState<Record<number, { knowledge_level: number; engagement_score: number; learning_pace: string }>>({});
  const [selectedLesson, setSelectedLesson] = useState<typeof MOCK_LESSONS[0] | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [lessonTab, setLessonTab] = useState<"info" | "test" | "students">("info");

  const classStudents = MOCK_STUDENTS.filter((s) => s.classId === classId);
  const classLessons = MOCK_LESSONS.filter((l) => l.classId === classId);
  const lastLesson = classLessons[0];

  const loadProfiles = useCallback(async () => {
    const results = await Promise.allSettled(
      MOCK_STUDENTS.map((s) => client.get(`/api/students/${s.id}/profile`))
    );
    const map: typeof profiles = {};
    results.forEach((r, i) => {
      if (r.status === "fulfilled") map[MOCK_STUDENTS[i].id] = r.value.data;
    });
    setProfiles(map);
  }, []);

  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  const avgEng = avg(classStudents.map((s) => profiles[s.id]?.engagement_score ?? 60));
  const avgKnow = avg(classStudents.map((s) => profiles[s.id]?.knowledge_level ?? 60));

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Header name={user?.full_name ?? ""} onLogout={logout} />

      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "28px 20px" }}>
        { }
        <div className="fade-in" style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>
              Панель вчителя 👩‍🏫
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              {user?.full_name} · {user?.subject}
            </p>
          </div>
          { }
          <div style={{ display: "flex", gap: "8px" }}>
            {[{ id: 1, label: "10А" }, { id: 2, label: "10Б" }].map((c) => (
              <button key={c.id} onClick={() => { setClassId(c.id); setSelectedLesson(null); setSelectedStudent(null); }}
                className={classId === c.id ? "btn btn-primary" : "btn btn-ghost"}
                style={{ minWidth: "70px" }}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        { }
        {lastLesson && (
          <div className="card fade-in" style={{ padding: "20px 24px", marginBottom: "24px", borderLeft: `4px solid ${engColor(lastLesson.engagement)}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Останній урок</div>
                <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>{lastLesson.topic}</div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>{lastLesson.subject} · {lastLesson.className} · {lastLesson.date}</div>
              </div>
              <button className="btn btn-ghost" onClick={() => { setSelectedLesson(lastLesson); setTab("lessons"); setLessonTab("info"); }}>Деталі →</button>
            </div>
            <div style={{ display: "flex", gap: "24px", marginTop: "16px", flexWrap: "wrap" }}>
              {[
                { label: "Залученість", value: `${lastLesson.engagement}%`, color: engColor(lastLesson.engagement) },
                { label: "Відповіді", value: `${lastLesson.answersGiven}/${lastLesson.answersTotal}` },
                { label: "Тест", value: `${lastLesson.testScore}%`, color: engColor(lastLesson.testScore) },
                { label: "Втома", value: `${lastLesson.fatigue}%`, color: lastLesson.fatigue > 50 ? "#ef4444" : "#22c55e" },
              ].map((item) => (
                <div key={item.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: item.color ?? "var(--text)" }}>{item.value}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        { }
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
          <StatCard icon="👥" value={classStudents.length} label="Учнів у класі" />
          <StatCard icon="⚡" value={`${avgEng}%`} label="Середня залученість" color={engColor(avgEng)} />
          <StatCard icon="📚" value={`${avgKnow}%`} label="Середній рівень знань" color={engColor(avgKnow)} />
          <StatCard icon="📋" value={classLessons.length} label="Уроків проведено" />
        </div>

        { }
        <div className="tabs" style={{ marginBottom: "20px" }}>
          <button className={`tab ${tab === "class" ? "active" : ""}`} onClick={() => { setTab("class"); setSelectedLesson(null); setSelectedStudent(null); }}>👥 Клас</button>
          <button className={`tab ${tab === "lessons" ? "active" : ""}`} onClick={() => { setTab("lessons"); setSelectedStudent(null); }}>📚 Уроки</button>
          <button className={`tab ${tab === "students" ? "active" : ""}`} onClick={() => { setTab("students"); setSelectedLesson(null); }}>🎓 Учні</button>
        </div>

        { }
        {tab === "class" && (
          <div className="fade-in">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
              {classStudents.map((s) => {
                const p = profiles[s.id];
                const eng = p?.engagement_score ?? 0;
                return (
                  <div key={s.id} className="card" style={{ padding: "16px", cursor: "pointer" }}
                    onClick={() => { setSelectedStudent(s.id); setTab("students"); }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--primary-10)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--primary)", fontSize: "14px", flexShrink: 0 }}>
                          {s.name.charAt(0)}
                        </div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{s.name.split(" ")[0]} {s.name.split(" ")[1]?.charAt(0)}.</div>
                      </div>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: p ? engColor(eng) : "var(--border)", flexShrink: 0 }} title={`Залученість: ${eng.toFixed(0)}%`} />
                    </div>
                    {p ? (
                      <div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Знання</div>
                        <div style={{ height: "4px", background: "var(--surface-2)", borderRadius: "2px", marginBottom: "8px" }}>
                          <div style={{ height: "100%", width: `${p.knowledge_level}%`, background: "var(--primary)", borderRadius: "2px" }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)" }}>
                          <span>{p.knowledge_level.toFixed(0)}% знань</span>
                          <span>{eng.toFixed(0)}% ⚡</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ height: "20px", display: "flex", alignItems: "center" }}><span className="spinner" style={{ width: "14px", height: "14px" }} /></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        { }
        {tab === "lessons" && !selectedLesson && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {classLessons.length === 0
              ? <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px" }}>Уроків ще немає</p>
              : classLessons.map((l) => <LessonCard key={l.id} lesson={l} onClick={() => { setSelectedLesson(l); setLessonTab("info"); }} />)
            }
          </div>
        )}

        {tab === "lessons" && selectedLesson && (
          <div className="fade-in">
            <button className="btn btn-ghost" style={{ marginBottom: "16px" }} onClick={() => setSelectedLesson(null)}>← Назад до уроків</button>
            <div className="card" style={{ padding: "24px", marginBottom: "16px" }}>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>{selectedLesson.topic}</div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>{selectedLesson.subject} · {selectedLesson.className} · {selectedLesson.date}</div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <StatCard icon="⚡" value={`${selectedLesson.engagement}%`} label="Залученість" color={engColor(selectedLesson.engagement)} />
                <StatCard icon="😴" value={`${selectedLesson.fatigue}%`} label="Втома" color={selectedLesson.fatigue > 50 ? "#ef4444" : "#22c55e"} />
                <StatCard icon="✋" value={`${selectedLesson.answersGiven}/${selectedLesson.answersTotal}`} label="Відповіді" />
                <StatCard icon="🧪" value={`${selectedLesson.testScore}%`} label="Середній тест" color={engColor(selectedLesson.testScore)} />
              </div>
            </div>
            <div className="tabs" style={{ marginBottom: "16px" }}>
              <button className={`tab ${lessonTab === "info" ? "active" : ""}`} onClick={() => setLessonTab("info")}>📊 Аналітика</button>
              <button className={`tab ${lessonTab === "test" ? "active" : ""}`} onClick={() => setLessonTab("test")}>📝 Тест</button>
              <button className={`tab ${lessonTab === "students" ? "active" : ""}`} onClick={() => setLessonTab("students")}>🎓 Учні</button>
            </div>
            {lessonTab === "info" && (
              <div className="card fade-in" style={{ padding: "20px" }}>
                <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: "16px" }}>Теги уроку</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                  {selectedLesson.tags.map((t) => <span key={t} className="badge badge-blue">{t}</span>)}
                </div>
                <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: "12px" }}>Прогрес залученості протягом уроку</div>
                <div style={{ display: "flex", gap: "6px", alignItems: "flex-end", height: "60px" }}>
                  {[65, 72, 80, 78, 75, 68, selectedLesson.engagement].map((v, i) => (
                    <div key={i} style={{ flex: 1, height: `${v}%`, background: `${engColor(v)}80`, borderRadius: "3px 3px 0 0", transition: "height 500ms ease" }} title={`${v}%`} />
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
                  <span>Початок</span><span>Середина</span><span>Кінець</span>
                </div>
              </div>
            )}
            {lessonTab === "test" && (
              <div className="fade-in">
                <TestEditor lesson={selectedLesson} />
              </div>
            )}
            {lessonTab === "students" && (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {Object.entries(selectedLesson.studentScores).map(([sid, score]) => {
                  const s = MOCK_STUDENTS.find((x) => x.id === Number(sid));
                  return s ? (
                    <div key={sid} className="card" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--primary-10)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--primary)" }}>{s.name.charAt(0)}</div>
                        <span style={{ fontWeight: 600, color: "var(--text)", fontSize: "14px" }}>{s.name}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ width: "120px", height: "6px", background: "var(--surface-2)", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${score}%`, background: engColor(score), borderRadius: "3px" }} />
                        </div>
                        <span style={{ fontSize: "18px", fontWeight: 800, color: engColor(score), minWidth: "42px", textAlign: "right" }}>{score}%</span>
                        <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: "12px" }}
                          onClick={() => { setSelectedStudent(Number(sid)); setTab("students"); }}>
                          Профіль
                        </button>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>
        )}

        { }
        {tab === "students" && !selectedStudent && (
          <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
            {classStudents.map((s) => {
              const p = profiles[s.id];
              const eng = p?.engagement_score ?? 0;
              return (
                <div key={s.id} className="card" style={{ padding: "18px", cursor: "pointer" }}
                  onClick={() => setSelectedStudent(s.id)}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                    <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: `${engColor(eng)}20`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: engColor(eng), fontSize: "18px", flexShrink: 0 }}>
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>{s.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Клас {s.className}</div>
                    </div>
                  </div>
                  {p ? (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Знання: <strong style={{ color: engColor(p.knowledge_level) }}>{p.knowledge_level.toFixed(0)}%</strong></span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>⚡ <strong style={{ color: engColor(eng) }}>{eng.toFixed(0)}%</strong></span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "center" }}><span className="spinner" style={{ width: "14px", height: "14px" }} /></div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "students" && selectedStudent !== null && (
          <div className="fade-in">
            <button className="btn btn-ghost" style={{ marginBottom: "16px" }} onClick={() => setSelectedStudent(null)}>← Назад до учнів</button>
            <StudentDetail studentId={selectedStudent} profiles={profiles} />
          </div>
        )}
      </main>
    </div>
  );
}
