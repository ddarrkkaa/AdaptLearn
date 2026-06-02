import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme, PALETTES } from "../contexts/ThemeContext";
import client from "../api/client";
 

const SUBJECTS = [
  { id: "Математика",      icon: "📐", color: "#6366f1" },
  { id: "Українська мова", icon: "📝", color: "#0d9488" },
  { id: "Фізика",          icon: "⚡", color: "#d97706" },
];

const PLACEMENT: Record<string, { question: string; options: string[]; correct: number; explanation: string }[]> = {
  "Математика": [
    { question: "Яке значення виразу 2³ + √16?", options: ["12", "16", "10", "8"], correct: 0, explanation: "2³=8, √16=4, сума = 12" },
    { question: "Розв'яжи рівняння: 2x + 6 = 14", options: ["x = 4", "x = 5", "x = 3", "x = 7"], correct: 0, explanation: "2x = 8, x = 4" },
    { question: "Знайди площу кола радіуса 5 (π ≈ 3.14)", options: ["78.5", "31.4", "25", "157"], correct: 0, explanation: "S = πr² = 3.14 × 25 = 78.5" },
    { question: "Скільки коренів має рівняння x² − 9 = 0?", options: ["2", "0", "1", "3"], correct: 0, explanation: "x=±3, два корені" },
    { question: "log₂(8) = ?", options: ["3", "4", "2", "8"], correct: 0, explanation: "2³ = 8, тому log₂(8) = 3" },
  ],
  "Українська мова": [
    { question: "Яка частина мови слово «красиво»?", options: ["Прислівник", "Прикметник", "Іменник", "Дієслово"], correct: 0, explanation: "Відповідає на питання «як?» — прислівник" },
    { question: "Що таке метафора?", options: ["Перенесення значення за схожістю", "Повтор однакових звуків", "Пряме значення слова", "Протиставлення понять"], correct: 0, explanation: "Метафора — приховане порівняння за схожістю" },
    { question: "Яке речення є складносурядним?", options: ["Він читав, а вона писала", "Я знаю, що ти прийдеш", "Сонце зайшло", "Читаючи книгу, він думав"], correct: 0, explanation: "Два рівноправних простих речення, з'єднаних сурядним сполучником «а»" },
    { question: "Яка словоформа НЕ є дієприкметником?", options: ["Читаючи", "Написаний", "Прочитаний", "Сказаний"], correct: 0, explanation: "«Читаючи» — дієприслівник, а не дієприкметник" },
    { question: "У якому слові є подвоєння приголосних?", options: ["Зна́ння", "Спів", "Читання (1 н)", "Книга"], correct: 0, explanation: "зна́ння — нн, через суфікс -нн-" },
  ],
  "Фізика": [
    { question: "Яка одиниця виміру сили?", options: ["Ньютон", "Джоуль", "Ватт", "Паскаль"], correct: 0, explanation: "Сила вимірюється в Ньютонах (Н)" },
    { question: "Формула другого закону Ньютона:", options: ["F = ma", "F = mv", "F = m/a", "F = E/t"], correct: 0, explanation: "Сила дорівнює масі, помноженій на прискорення" },
    { question: "Швидкість світла у вакуумі приблизно:", options: ["3×10⁸ м/с", "3×10⁶ м/с", "3×10¹⁰ м/с", "3×10⁴ м/с"], correct: 0, explanation: "c ≈ 3×10⁸ м/с — фундаментальна константа" },
    { question: "Що вимірює амперметр?", options: ["Силу струму", "Напругу", "Опір", "Потужність"], correct: 0, explanation: "Амперметр вимірює силу електричного струму (А)" },
    { question: "При якому явищі тіло поглинає фотони?", options: ["Поглинання", "Випромінювання", "Відбиття", "Заломлення"], correct: 0, explanation: "При поглинанні атом переходить на вищий енергетичний рівень" },
  ],
};

const CAREER_QUESTIONS = [
  {
    text: "Коли ти стикаєшся з чимось незрозумілим, що ти робиш першим?",
    options: [
      { text: "Шукаю технічне пояснення або розбираю механізм", type: "stem" },
      { text: "Запитую когось досвідченого або обговорюю з друзями", type: "social" },
      { text: "Придумую своє пояснення чи нестандартну версію", type: "creative" },
      { text: "Оцінюю, чи це важливо для моїх цілей і планів", type: "business" },
    ],
  },
  {
    text: "Що тебе найбільше захоплює у світі?",
    options: [
      { text: "Те, як влаштована природа — фізика, математика, технології", type: "stem" },
      { text: "Люди — їхні почуття, стосунки, суспільство", type: "social" },
      { text: "Краса і форма — звук, колір, простір, слово", type: "creative" },
      { text: "Системи і рішення — як зробити щось ефективніше", type: "business" },
    ],
  },
  {
    text: "Твій друг у скрутній ситуації. Ти:",
    options: [
      { text: "Аналізую і шукаю логічне рішення його проблеми", type: "stem" },
      { text: "Спочатку вислухую і підтримую емоційно", type: "social" },
      { text: "Пропоную несподіваний, нестандартний вихід", type: "creative" },
      { text: "Одразу будую конкретний план дій", type: "business" },
    ],
  },
  {
    text: "Твій ідеальний вільний день:",
    options: [
      { text: "Вивчаю щось нове: читаю, дивлюся документальне, розбираю прилад", type: "stem" },
      { text: "Спілкуюся з людьми: друзі, волонтерство, нові знайомства", type: "social" },
      { text: "Творю: малюю, граю музику, пишу, знімаю відео", type: "creative" },
      { text: "Планую або розвиваю своє хобі чи проєкт", type: "business" },
    ],
  },
  {
    text: "Якби у тебе з'явилась суперсила, ти б обрав:",
    options: [
      { text: "Миттєво розуміти будь-яку технологію чи природне явище", type: "stem" },
      { text: "Відчувати і розуміти емоції будь-якої людини", type: "social" },
      { text: "Творити речі, що торкаються серць і залишаються навіки", type: "creative" },
      { text: "Бачити найкраще рішення у будь-якій ситуації", type: "business" },
    ],
  },
  {
    text: "У командному проєкті ти зазвичай:",
    options: [
      { text: "Займаюся технічними питаннями — дані, розрахунки, логіка", type: "stem" },
      { text: "Слідкую за атмосферою, щоб усі почувалися комфортно", type: "social" },
      { text: "Пропоную ідеї, займаюся оформленням і подачею", type: "creative" },
      { text: "Координую, розподіляю завдання, слідкую за результатом", type: "business" },
    ],
  },
  {
    text: "Що тебе найбільше дратує?",
    options: [
      { text: "Коли щось не працює логічно або є неточності", type: "stem" },
      { text: "Коли люди байдужі або несправедливі", type: "social" },
      { text: "Коли немає простору для творчості і все шаблонно", type: "creative" },
      { text: "Коли немає чіткого плану і час витрачається даремно", type: "business" },
    ],
  },
  {
    text: "Якби ти міг зробити щось важливе для суспільства, ти б:",
    options: [
      { text: "Зробив наукове відкриття або технологію, що змінює світ", type: "stem" },
      { text: "Допоміг тисячам людей у найважчий момент їхнього життя", type: "social" },
      { text: "Створив твір, який надихає і залишиться назавжди", type: "creative" },
      { text: "Побудував організацію, яка вирішує системну проблему", type: "business" },
    ],
  },
];

const CAREER_RESULTS: Record<string, { title: string; desc: string; icon: string; profs: string[]; color: string }> = {
  stem:     { title: "Природничі науки та ІТ",      icon: "🔬", color: "#6366f1", desc: "Ти аналітик із систематичним підходом до пізнання світу. Тебе захоплюють точні закономірності і механізми речей.",     profs: ["Інженер-програміст", "Математик-аналітик", "Фізик-дослідник", "Кібербезпека"] },
  social:   { title: "Медицина та соціальні науки", icon: "🤝", color: "#0d9488", desc: "Ти природжений емпат. Люди тягнуться до тебе за підтримкою — і ти справді хочеш і вмієш допомагати.",                profs: ["Психолог", "Лікар", "Педагог", "Соціальний працівник"] },
  creative: { title: "Мистецтво та дизайн",         icon: "🎨", color: "#7c3aed", desc: "Ти мислиш образами і маєш яскраве творче бачення. Стандартні рішення тебе нудять — ти шукаєш красиве і неочікуване.", profs: ["Дизайнер", "Архітектор", "Режисер", "Арт-директор"] },
  business: { title: "Економіка та право",          icon: "⚖️", color: "#d97706", desc: "Ти стратег із лідерськими якостями. Ти бачиш систему там, де інші бачать хаос, і знаєш як досягти мети.",            profs: ["Юрист", "Підприємець", "Менеджер проєктів", "Фінансовий аналітик"] },
};
 

interface Profile {
  knowledge_level: number;
  engagement_score: number;
  learning_pace: string;
  typical_errors: unknown[];
}
 

function paceLabel(p: string) {
  return { slow: "Повільний", medium: "Середній", fast: "Швидкий" }[p] ?? p;
}

function engColor(v: number) {
  if (v >= 70) return "var(--success)";
  if (v >= 45) return "var(--warning)";
  return "var(--danger)";
}
 

function StatCard({ icon, value, label, color }: { icon: string; value: string; label: string; color?: string }) {
  return (
    <div className="card" style={{ padding: "16px 14px", textAlign: "center", flex: "1 1 0" }}>
      <div style={{ fontSize: "22px", marginBottom: "6px" }}>{icon}</div>
      <div style={{ fontSize: "20px", fontWeight: 700, color: color ?? "var(--primary)" }}>{value}</div>
      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px", fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color?: string }) {
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${Math.min(100, value)}%`, background: color ?? "var(--primary)" }} />
    </div>
  );
}
 

function PlacementTest({ subject, studentId, onDone }: { subject: string; studentId: number; onDone: (score: number) => void }) {
  const questions = PLACEMENT[subject] ?? [];
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const q = questions[idx];

  const pick = (i: number) => { if (!revealed) setSelected(i); };

  const next = () => {
    const a = [...answers, selected ?? -1];
    if (idx + 1 < questions.length) {
      setAnswers(a);
      setIdx(idx + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      const correct = a.filter((ans, i) => ans === questions[i].correct).length;
      const pct = Math.round((correct / questions.length) * 100);
      setFinalScore(pct);
      setDone(true);
      client.post(`/api/students/${studentId}/profile`, {}).catch(() => {});
      onDone(pct);
    }
  };

  if (done) {
    const stars = finalScore >= 80 ? "⭐⭐⭐" : finalScore >= 60 ? "⭐⭐" : "⭐";
    const msg = finalScore >= 80 ? "Відмінно!" : finalScore >= 60 ? "Добре!" : "Є над чим попрацювати";
    return (
      <div className="card fade-in" style={{ padding: "32px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>{stars}</div>
        <div style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px", color: "var(--primary)" }}>{msg}</div>
        <div style={{ fontSize: "40px", fontWeight: 800, margin: "16px 0", color: finalScore >= 60 ? "var(--success)" : "var(--warning)" }}>{finalScore}%</div>
        <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>Початковий тест з предмету «{subject}» завершено</div>
        <button className="btn btn-primary" style={{ marginTop: "24px" }} onClick={() => { setIdx(0); setAnswers([]); setSelected(null); setRevealed(false); setDone(false); }}>
          Пройти ще раз
        </button>
      </div>
    );
  }

  return (
    <div className="card fade-in" style={{ padding: "28px" }}>
      { }
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>
          Питання {idx + 1} / {questions.length}
        </span>
        <div style={{ display: "flex", gap: "4px" }}>
          {questions.map((_, i) => (
            <div key={i} style={{ width: "28px", height: "4px", borderRadius: "2px", background: i <= idx ? "var(--primary)" : "var(--border)", transition: "background 300ms" }} />
          ))}
        </div>
      </div>
      <div style={{ fontSize: "17px", fontWeight: 600, color: "var(--text)", marginBottom: "20px", lineHeight: 1.5 }}>{q.question}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
        {q.options.map((opt, i) => {
          let bg = "var(--surface-2)";
          let border = "1px solid var(--border)";
          let color = "var(--text)";
          if (revealed) {
            if (i === q.correct) { bg = "var(--success-bg)"; border = "1px solid var(--success)"; color = "#166534"; }
            else if (i === selected && i !== q.correct) { bg = "var(--danger-bg)"; border = "1px solid var(--danger)"; color = "#991b1b"; }
          } else if (i === selected) {
            bg = "var(--primary-10)"; border = "1px solid var(--primary)"; color = "var(--primary)";
          }
          return (
            <button key={i} onClick={() => pick(i)} style={{ background: bg, border, borderRadius: "var(--r-sm)", padding: "12px 16px", textAlign: "left", cursor: revealed ? "default" : "pointer", color, fontSize: "14px", fontWeight: 500, transition: "all 150ms ease" }}>
              <span style={{ fontWeight: 700, marginRight: "10px", opacity: 0.6 }}>{String.fromCharCode(65 + i)}.</span>{opt}
            </button>
          );
        })}
      </div>
      {revealed && (
        <div style={{ background: "var(--primary-10)", borderRadius: "var(--r-sm)", padding: "12px 14px", fontSize: "13px", color: "var(--text)", marginBottom: "16px" }}>
          💡 {q.explanation}
        </div>
      )}
      {!revealed && selected !== null && (
        <button className="btn btn-ghost" onClick={() => setRevealed(true)} style={{ marginRight: "10px" }}>Перевірити</button>
      )}
      {revealed && (
        <button className="btn btn-primary" onClick={next}>{idx + 1 < questions.length ? "Далі →" : "Завершити"}</button>
      )}
    </div>
  );
}
 

function CareerTest() {
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({ stem: 0, social: 0, creative: 0, business: 0 });
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<string>("");

  const q = CAREER_QUESTIONS[idx];

  const next = () => {
    if (selected === null) return;
    const type = q.options[selected].type;
    const newScores = { ...scores, [type]: scores[type] + 1 };
    setScores(newScores);
    setSelected(null);
    if (idx + 1 < CAREER_QUESTIONS.length) {
      setIdx(idx + 1);
    } else {
      const top = Object.entries(newScores).sort((a, b) => b[1] - a[1])[0][0];
      setResult(top);
      setDone(true);
    }
  };

  if (done) {
    const r = CAREER_RESULTS[result];
    const total = Object.values(scores).reduce((a, b) => a + b, 0) + 1;
    const pct: Record<string, number> = {};
    const finalScores = { ...scores, [result]: scores[result] + 1 };
    Object.entries(finalScores).forEach(([k, v]) => { pct[k] = Math.round((v / CAREER_QUESTIONS.length) * 100); });

    return (
      <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="card" style={{ padding: "28px", textAlign: "center", borderTop: `4px solid ${r.color}` }}>
          <div style={{ fontSize: "52px", marginBottom: "12px" }}>{r.icon}</div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: r.color, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>Твоя сфера</div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--text)", marginBottom: "14px" }}>{r.title}</div>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "20px" }}>{r.desc}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
            {r.profs.map((p) => (
              <span key={p} className="badge badge-blue" style={{ background: `${r.color}18`, color: r.color }}>{p}</span>
            ))}
          </div>
        </div>
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Розподіл твоїх відповідей</div>
          {Object.entries(CAREER_RESULTS).map(([key, val]) => (
            <div key={key} style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <span style={{ fontSize: "13px", color: "var(--text)" }}>{val.icon} {val.title}</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: val.color }}>{pct[key]}%</span>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct[key]}%`, background: val.color }} /></div>
            </div>
          ))}
        </div>
        <button className="btn btn-ghost" onClick={() => { setIdx(0); setScores({ stem:0, social:0, creative:0, business:0 }); setSelected(null); setDone(false); }}>
          Пройти знову
        </button>
      </div>
    );
  }

  const progress = Math.round((idx / CAREER_QUESTIONS.length) * 100);

  return (
    <div className="card fade-in" style={{ padding: "28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>Питання {idx + 1} / {CAREER_QUESTIONS.length}</span>
        <span style={{ fontSize: "13px", color: "var(--primary)", fontWeight: 700 }}>{progress}%</span>
      </div>
      <div className="progress-bar" style={{ marginBottom: "24px" }}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div style={{ fontSize: "17px", fontWeight: 600, color: "var(--text)", marginBottom: "20px", lineHeight: 1.55 }}>{q.text}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {q.options.map((opt, i) => (
          <button key={i} onClick={() => setSelected(i)} style={{
            background: selected === i ? "var(--primary-10)" : "var(--surface-2)",
            border: selected === i ? "1.5px solid var(--primary)" : "1.5px solid transparent",
            borderRadius: "var(--r-sm)",
            padding: "14px 16px",
            textAlign: "left",
            cursor: "pointer",
            color: selected === i ? "var(--primary)" : "var(--text)",
            fontSize: "14px",
            fontWeight: selected === i ? 600 : 400,
            transition: "all 150ms ease",
          }}>
            {opt.text}
          </button>
        ))}
      </div>
      <button className="btn btn-primary" style={{ marginTop: "20px" }} onClick={next} disabled={selected === null}>
        {idx + 1 < CAREER_QUESTIONS.length ? "Далі →" : "Дізнатись результат"}
      </button>
    </div>
  );
}
 

function Header({ name, onLogout }: { name: string; onLogout: () => void }) {
  const { theme, toggleTheme, palette, setPalette } = useTheme();
  const [showPalette, setShowPalette] = useState(false);
  return (
    <header style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "0 24px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "30px", height: "30px", background: "var(--primary)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🧠</div>
        <span style={{ fontWeight: 700, fontSize: "16px", color: "var(--text)" }}>AdaptLearn</span>
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
 

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [trajectory, setTrajectory] = useState<string[]>([]);
  const [subject, setSubject] = useState("Математика");
  const [tab, setTab] = useState<"learn" | "placement" | "career">("learn");
  const [placementScore, setPlacementScore] = useState<number | null>(null);

  const sid = user?.student_id ?? 1;

  const loadProfile = useCallback(() => {
    client.get(`/api/students/${sid}/profile`).then((r) => setProfile(r.data)).catch(() => {});
    client.get(`/api/trajectory/${sid}`).then((r) => {
      const t = r.data?.topics;
      if (Array.isArray(t)) setTrajectory(t.map((x: unknown) => (typeof x === "string" ? x : (x as { title?: string })?.title ?? "")));
    }).catch(() => {});
  }, [sid]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Header name={user?.full_name ?? ""} onLogout={logout} />

      <main style={{ maxWidth: "820px", margin: "0 auto", padding: "28px 20px" }}>
        { }
        <div className="fade-in" style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>
            Привіт, {user?.full_name?.split(" ")[1] ?? user?.full_name}! 👋
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Клас: {user?.class_id === 1 ? "10А" : "10Б"} · AdaptLearn відстежує твій прогрес в реальному часі</p>
        </div>

        { }
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
          {SUBJECTS.map((s) => (
            <button key={s.id} onClick={() => setSubject(s.id)} style={{
              padding: "10px 18px",
              borderRadius: "var(--r)",
              border: subject === s.id ? `2px solid ${s.color}` : "2px solid var(--border)",
              background: subject === s.id ? `${s.color}18` : "var(--surface)",
              color: subject === s.id ? s.color : "var(--text-muted)",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              transition: "all 150ms ease",
              boxShadow: subject === s.id ? "var(--shadow-sm)" : "none",
            }}>
              {s.icon} {s.id}
            </button>
          ))}
        </div>

        { }
        {profile ? (
          <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
            <StatCard icon="📚" value={`${profile.knowledge_level.toFixed(0)}%`} label="Рівень знань" color={engColor(profile.knowledge_level)} />
            <StatCard icon="⚡" value={`${profile.engagement_score.toFixed(0)}%`} label="Залученість" color={engColor(profile.engagement_score)} />
            <StatCard icon="🏃" value={paceLabel(profile.learning_pace)} label="Темп навчання" />
            <StatCard icon="⚠️" value={String(profile.typical_errors.length)} label="Типові помилки" color={profile.typical_errors.length > 3 ? "var(--danger)" : "var(--success)"} />
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}><span className="spinner" /></div>
        )}

        { }
        {profile && (
          <div className="card" style={{ padding: "20px", marginBottom: "24px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginBottom: "14px" }}>Загальний прогрес</div>
            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "5px" }}>
                <span style={{ color: "var(--text-muted)" }}>Рівень знань</span>
                <span style={{ fontWeight: 700, color: "var(--primary)" }}>{profile.knowledge_level.toFixed(0)}%</span>
              </div>
              <ProgressBar value={profile.knowledge_level} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "5px" }}>
                <span style={{ color: "var(--text-muted)" }}>Залученість</span>
                <span style={{ fontWeight: 700, color: engColor(profile.engagement_score) }}>{profile.engagement_score.toFixed(0)}%</span>
              </div>
              <ProgressBar value={profile.engagement_score} color={engColor(profile.engagement_score)} />
            </div>
          </div>
        )}

        { }
        <div className="tabs" style={{ marginBottom: "20px" }}>
          <button className={`tab ${tab === "learn" ? "active" : ""}`} onClick={() => setTab("learn")}>📖 Навчання</button>
          <button className={`tab ${tab === "placement" ? "active" : ""}`} onClick={() => setTab("placement")}>🎯 Початковий тест</button>
          <button className={`tab ${tab === "career" ? "active" : ""}`} onClick={() => setTab("career")}>🧭 Проф. орієнтація</button>
        </div>

        { }
        {tab === "learn" && (
          <div className="fade-in">
            { }
            {trajectory.length > 0 && (
              <div className="card" style={{ padding: "20px", marginBottom: "16px" }}>
                <div style={{ fontWeight: 700, color: "var(--text)", fontSize: "14px", marginBottom: "12px" }}>🗺️ Траєкторія навчання</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {trajectory.map((t, i) => (
                    <span key={i} className="badge badge-blue">{t}</span>
                  ))}
                </div>
              </div>
            )}
            {placementScore !== null && (
              <div style={{ background: "var(--success-bg)", borderRadius: "var(--r-sm)", padding: "12px 16px", marginBottom: "16px", fontSize: "14px", color: "#166534" }}>
                ✅ Останній тест: <strong>{placementScore}%</strong>
              </div>
            )}
            <div className="card" style={{ padding: "24px", textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📋</div>
              <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "8px", color: "var(--text)" }}>Пройди тест з предмету «{subject}»</div>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "20px" }}>Адаптивна система підбере завдання під твій рівень</p>
              <button className="btn btn-primary" onClick={() => setTab("placement")}>Пройти тест</button>
            </div>
          </div>
        )}

        {tab === "placement" && (
          <div className="fade-in">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>Предмет:</span>
              {SUBJECTS.map((s) => (
                <button key={s.id} onClick={() => setSubject(s.id)} style={{
                  padding: "5px 12px",
                  borderRadius: "99px",
                  border: subject === s.id ? "1.5px solid var(--primary)" : "1.5px solid var(--border)",
                  background: subject === s.id ? "var(--primary-10)" : "transparent",
                  color: subject === s.id ? "var(--primary)" : "var(--text-muted)",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}>
                  {s.icon} {s.id}
                </button>
              ))}
            </div>
            <PlacementTest key={subject} subject={subject} studentId={sid} onDone={(s) => { setPlacementScore(s); loadProfile(); }} />
          </div>
        )}

        {tab === "career" && (
          <div className="fade-in">
            <div className="card" style={{ padding: "16px 20px", marginBottom: "16px", background: "var(--primary-10)", border: "1px solid var(--primary-20)" }}>
              <p style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.6 }}>
                🧭 <strong>Тест профорієнтації</strong> — 8 питань, які допоможуть визначити твою природну схильність. Відповідай чесно, без аналізу «що правильно» — тут немає неправильних відповідей.
              </p>
            </div>
            <CareerTest />
          </div>
        )}
      </main>
    </div>
  );
}
