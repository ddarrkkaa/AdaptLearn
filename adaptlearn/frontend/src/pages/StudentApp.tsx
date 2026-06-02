import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme, PALETTES } from "../contexts/ThemeContext";
import client from "../api/client";
import NeuroDepth from "../components/neuro/NeuroDepth";
import KnowledgeMap from "../components/neuro/KnowledgeMap";

const I = {
  home: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: 20, height: 20 }}
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  ),
  book: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: 20, height: 20 }}
    >
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  ),
  learn: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: 20, height: 20 }}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4l3 3" />
    </svg>
  ),
  test: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: 20, height: 20 }}
    >
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  ),
  chart: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: 20, height: 20 }}
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  cal: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: 20, height: 20 }}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  compass: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      style={{ width: 20, height: 20 }}
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88 16.24,7.76" />
    </svg>
  ),
  logout: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: 20, height: 20 }}
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

const cl = (v: number) =>
  v >= 70 ? "#22c55e" : v >= 45 ? "#f59e0b" : "#ef4444";
const paceL = (p: string) =>
  ({ slow: "Повільний", medium: "Середній", fast: "Швидкий" })[p] ?? p;

function motivationFor(profile: any): {
  title: string;
  subtitle: string;
  color: string;
} {
  const know = Number(profile?.knowledge_level ?? 50);
  const eng = Number(profile?.engagement_score ?? 50);
  if (know >= 80 && eng >= 70)
    return {
      title: "Молодець, так тримати!",
      subtitle: "У тебе чудові результати — продовжуй у тому ж дусі.",
      color: "#22c55e",
    };
  if (know >= 65)
    return {
      title: "Так тримати, ти молодець!",
      subtitle: "Бачимо твій прогрес — кожен урок наближає до мети.",
      color: "#22c55e",
    };
  if (know < 50 || eng < 50)
    return {
      title: "Піднажми, у тебе все вийде!",
      subtitle:
        "Не здавайся — поступово все стане легше. Зосередься на наступному уроці.",
      color: "#f59e0b",
    };
  return {
    title: "Все йде добре, не зупиняйся!",
    subtitle: "Ти на правильному шляху — крок за кроком уперед.",
    color: "#0284c7",
  };
}

const CLASS_NAMES: Record<number, string> = {
  1: "1А",
  2: "1Б",
  3: "5А",
  4: "5Б",
  5: "9А",
  6: "10А",
  7: "10Б",
  8: "11А",
};
const className = (id: number | null | undefined) =>
  id ? (CLASS_NAMES[id] ?? `Клас ${id}`) : "—";

import { useStaticContent } from "../contexts/StaticContentContext";

function getLessonContent(subject: string, topic: string, interests: string[]) {
  const hobbyMap: Record<string, string> = {
    Малювання: "art",
    Музика: "music",
    Футбол: "sport",
    Читання: "reading",
    "Комп'ютерні ігри": "tech",
    Тварини: "nature",
    Кулінарія: "cooking",
    Танці: "art",
    "Квіти/природа": "nature",
    Конструктор: "tech",
    Плавання: "sport",
    Шахи: "tech",
  };
  const hobby = interests.map((i) => hobbyMap[i]).find(Boolean) ?? "sport";

  if (subject === "Математика" && topic.toLowerCase().includes("похідн")) {
    const analogies: Record<string, string> = {
      sport:
        "Уяви футбольний м'яч, що летить у повітрі. Його швидкість змінюється кожну мить — на початку швидко, потім повільніше через гравітацію. Похідна — це і є та швидкість зміни в кожен момент часу.",
      art: "Якщо ти малюєш криву лінію пензлем, то похідна показує, куди саме і наскільки круто пензель повертає в кожній точці. Це нахил твого пензля.",
      music:
        "Уяви музичну мелодію. Похідна — це швидкість, з якою ноти підвищуються або знижуються. Якщо мелодія різко стрибає вгору — велика похідна.",
      tech: "У комп'ютерних іграх похідна — це швидкість зміни характеристик. Якщо персонаж біжить і прискорюється — похідна швидкості це прискорення.",
      reading:
        "У книзі похідна — це темп розповіді: наскільки швидко змінюються події в кожному розділі.",
      nature:
        "Похідна — як швидкість росту дерева. Воно росте не однаково — спочатку повільно, потім швидше, потім сповільнюється.",
      cooking:
        "Як швидкість підвищення температури тіста в духовці — спочатку швидко нагрівається, потім стабільно.",
    };
    return {
      paragraphs: [
        `**Похідна функції** — це одне з ключових понять математичного аналізу. Простими словами, похідна показує, наскільки швидко змінюється функція в кожній точці.`,
        analogies[hobby] ?? analogies.sport,
        `**Формальне визначення:** похідна функції f у точці x₀ — це границя відношення приросту функції Δy до приросту аргументу Δx, коли Δx прямує до нуля. Записують так: f'(x) = lim[Δx→0] (f(x+Δx) − f(x)) / Δx.`,
        `**Геометричний зміст:** значення похідної f'(x₀) дорівнює тангенсу кута нахилу дотичної до графіка функції в точці x₀. Чим крутіша дотична, тим більша похідна. Якщо дотична горизонтальна — похідна 0 (це часто екстремум).`,
        `**Фізичний зміст:** якщо s(t) — це шлях, то s'(t) — миттєва швидкість. А похідна швидкості v'(t) — це прискорення. Саме тому похідні так часто використовують у фізиці для опису руху.`,
        `**Основні правила:** (xⁿ)' = n·xⁿ⁻¹ (степенева), (C)' = 0 (константа), (f+g)' = f'+g' (сума), (f·g)' = f'·g + f·g' (добуток), (sin x)' = cos x, (cos x)' = −sin x.`,
      ],
      examples: [
        {
          title: "Похідна простої функції",
          solution:
            "f(x) = x²\nf'(x) = 2·x²⁻¹ = 2x\n\nПеревірка: при x=3 → f'(3) = 6 (нахил дотичної в точці 3)",
        },
        {
          title: "Похідна суми",
          solution: "g(x) = 3x³ + 2x − 5\ng'(x) = 9x² + 2 + 0 = 9x² + 2",
        },
        {
          title: "Похідна добутку",
          solution:
            "h(x) = x · sin(x)\nh'(x) = 1·sin(x) + x·cos(x) = sin(x) + x·cos(x)",
        },
      ],
      selfcheck: [
        {
          q: "Знайди похідну f(x) = 5x³ − 2x + 7",
          type: "open",
          answer: "15x² − 2",
        },
        {
          q: "Чому дорівнює (sin x)'?",
          type: "choice",
          options: ["cos x", "−sin x", "−cos x", "tan x"],
          correct: 0,
        },
        {
          q: "Похідна константи f(x) = 42 дорівнює:",
          type: "choice",
          options: ["42", "1", "0", "x"],
          correct: 2,
        },
        {
          q: "f'(x₀) — це кутовий коефіцієнт чого?",
          type: "open",
          answer: "дотичної",
        },
      ],
      encourage:
        hobby === "sport"
          ? "Ти добре розбираєшся в швидкостях у спорті — це той самий принцип. Молодець!"
          : hobby === "art"
            ? "Художнє мислення допомагає тобі бачити криві — це і є інтуїція похідних!"
            : "Чудова робота! Ти зробив крок до розуміння одного з найважливіших понять математики.",
    };
  }

  if (
    subject === "Українська мова" &&
    topic.toLowerCase().includes("підрядн")
  ) {
    return {
      paragraphs: [
        `**Складнопідрядне речення** — це таке складне речення, яке складається з головної і підрядної частин. Підрядна частина залежить від головної і пояснює її.`,
        `Наприклад: «Я знаю, що ти любиш ${interests.includes("Футбол") ? "футбол" : "читати"}». Тут «Я знаю» — головна частина, «що ти любиш ${interests.includes("Футбол") ? "футбол" : "читати"}» — підрядна.`,
        `**Сполучники підрядних:** що, який, чий, де, коли, тому що, бо, хоча, якщо, аби, доки. Саме за ними можна впізнати, що перед нами підрядна частина.`,
        `**Типи підрядних речень:** означальні (відповідають на «який?»), з'ясувальні (відповідають на питання відмінків — «що? кого? чого?»), обставинні (часу, місця, причини, мети, умови, наслідку).`,
        `**Розділові знаки:** підрядна частина завжди відокремлюється комою. Якщо вона стоїть перед головною — кома після неї. Якщо після — кома перед сполучником. Якщо всередині — коми з двох боків.`,
      ],
      examples: [
        {
          title: "Означальне підрядне",
          solution:
            "«Книга, яку я читаю, дуже цікава»\nГоловна: «Книга дуже цікава»\nПідрядна означальна: «яку я читаю» (який?)",
        },
        {
          title: "З'ясувальне підрядне",
          solution:
            "«Він сказав, що буде пізно»\nГоловна: «Він сказав»\nПідрядна з'ясувальна: «що буде пізно» (що сказав?)",
        },
        {
          title: "Обставинне причини",
          solution:
            "«Я залишився вдома, бо йшов дощ»\nГоловна: «Я залишився вдома»\nПідрядна обставинна причини: «бо йшов дощ» (чому?)",
        },
      ],
      selfcheck: [
        {
          q: "Назви тип підрядного: «Я бачив, де ти сидиш»",
          type: "choice",
          options: [
            "означальне",
            "з'ясувальне",
            "обставинне місця",
            "обставинне часу",
          ],
          correct: 1,
        },
        {
          q: "Яким сполучником приєднується означальне?",
          type: "open",
          answer: "який",
        },
        {
          q: "Чи потрібна кома: «Він знає що ти прийдеш»?",
          type: "choice",
          options: ["Так, перед «що»", "Ні", "Перед «знає»", "Не знаю"],
          correct: 0,
        },
      ],
      encourage:
        "Розуміння синтаксису — ключ до грамотної мови. Ти на правильному шляху!",
    };
  }

  return {
    paragraphs: [
      `**Тема уроку: ${topic}** з предмету **${subject}**.`,
      `Це важлива тема, яку ми сьогодні розглянемо детально. Спочатку розберемо базові поняття, потім приклади, а в кінці перевіримо себе самостійними завданнями.`,
      `Намагайся читати уважно і пов'язувати нове з тим, що ти вже знаєш — так матеріал засвоюється набагато краще.`,
      `Якщо щось незрозуміло — не біда. Перечитай абзац, подивись приклади і повертайся до тестів. Кожне питання має пояснення.`,
      `Готовий? Тоді почнемо. Не поспішай — твоє розуміння важливіше за швидкість.`,
    ],
    examples: [
      {
        title: "Приклад 1",
        solution:
          "Загальний приклад до теми буде сформований AI на основі транскрипту уроку.",
      },
    ],
    selfcheck: [
      {
        q: `Чи зрозумів ти тему «${topic}»?`,
        type: "choice",
        options: [
          "Так, повністю",
          "Частково",
          "Потрібно перечитати",
          "Ні, не зрозумів",
        ],
        correct: 0,
      },
      {
        q: "Чи варто звернутись до вчителя за поясненням?",
        type: "choice",
        options: [
          "Так, на наступному уроці",
          "Ні, все зрозуміло",
          "Можливо",
          "Ще не вирішив",
        ],
        correct: 1,
      },
    ],
    encourage: "Ти молодець, що дочитав до кінця! Це вже половина успіху.",
  };
}

const NAV = [
  { key: "home", label: "Головна", icon: I.home },
  { key: "learn", label: "Уроки", icon: I.book },
  { key: "tests", label: "Тести", icon: I.test },
  { key: "progress", label: "Прогрес", icon: I.chart },
  { key: "journal", label: "Щоденник", icon: I.cal },
  { key: "schedule", label: "Розклад", icon: I.learn },
  { key: "career", label: "Профорієнтація", icon: I.compass },
  { key: "profile", label: "Профіль", icon: I.test },
];

function Sidebar({
  section,
  setSection,
  user,
  logout,
  theme,
  toggleTheme,
  palette,
  setPalette,
}: {
  section: string;
  setSection: (s: string) => void;
  user: any;
  logout: () => void;
  theme: string;
  toggleTheme: () => void;
  palette: string;
  setPalette: (p: any) => void;
}) {
  const [showPal, setShowPal] = useState(false);
  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        background: "var(--sidebar-bg)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        zIndex: 50,
      }}
    >
      <div
        style={{
          padding: "22px 20px 18px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth={2}
              strokeLinecap="round"
              style={{ width: 20, height: 20 }}
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <div
              style={{
                fontSize: "17px",
                fontWeight: 700,
                color: "var(--text)",
                lineHeight: 1,
              }}
            >
              AdaptLearn
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginTop: 3,
              }}
            >
              Клас {className(user?.class_id)}
            </div>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "14px 10px", overflowY: "auto" }}>
        {NAV.map((n) => (
          <button
            key={n.key}
            onClick={() => setSection(n.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "11px",
              width: "100%",
              padding: "12px 14px",
              borderRadius: "10px",
              border: "none",
              background:
                section === n.key ? "var(--primary-10)" : "transparent",
              color: section === n.key ? "var(--primary)" : "var(--text-muted)",
              fontWeight: section === n.key ? 700 : 400,
              fontSize: "16px",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 120ms",
              marginBottom: "3px",
            }}
          >
            <span
              style={{
                color:
                  section === n.key ? "var(--primary)" : "var(--text-muted)",
              }}
            >
              {n.icon}
            </span>
            {n.label}
            {section === n.key && (
              <div
                style={{
                  marginLeft: "auto",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "var(--primary)",
                }}
              />
            )}
          </button>
        ))}
      </nav>
      <div
        style={{
          padding: "12px 10px 14px",
          borderTop: "1px solid var(--border)",
        }}
      >
        {}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 12px",
            borderRadius: "10px",
            background: "var(--surface-2)",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {user?.full_name?.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.full_name?.split(" ").slice(0, 2).join(" ")}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Учень · {className(user?.class_id)}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Світла тема" : "Темна тема"}
            style={{
              flex: "0 0 38px",
              height: "38px",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 150ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--primary-10)";
              e.currentTarget.style.color = "var(--primary)";
              e.currentTarget.style.borderColor = "var(--primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            {theme === "dark" ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: 16, height: 16 }}
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: 16, height: 16 }}
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <button
            onClick={logout}
            title="Вийти"
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "0.04em",
              transition: "all 150ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,94,122,0.10)";
              e.currentTarget.style.color = "#FF5E7A";
              e.currentTarget.style.borderColor = "rgba(255,94,122,0.40)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: 16, height: 16 }}
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Вийти
          </button>
        </div>
      </div>
    </aside>
  );
}

function PreferencesTest({
  studentId,
  onDone,
}: {
  studentId: number;
  onDone: () => void;
}) {
  const { prefs: PREFS, hobbies: HOBBY_LIST } = useStaticContent();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sel, setSel] = useState<number | null>(null);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [showHobbies, setShowHobbies] = useState(false);

  if (!PREFS.length) return null;
  const q = PREFS[idx];
  const pct = Math.round((idx / PREFS.length) * 100);

  const next = () => {
    if (sel === null) return;
    const a = { ...answers, [q.key]: q.opts[sel].v };
    if (idx + 1 < PREFS.length) {
      setAnswers(a);
      setIdx(idx + 1);
      setSel(null);
    } else {
      setAnswers(a);
      setShowHobbies(true);
    }
  };

  const finish = () => {
    const interests = [...Object.values(answers), ...hobbies];
    client
      .patch(`/api/students/${studentId}/profile`, { interests })
      .catch(() => {});
    localStorage.setItem(`pref_done_${studentId}`, "1");
    onDone();
  };

  if (showHobbies)
    return (
      <div
        style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: "8px",
          }}
        >
          Що тебе цікавить у вільний час?
        </h2>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "16px",
            marginBottom: "24px",
          }}
        >
          Обери все що подобається — це допоможе підібрати приклади в уроках
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "28px",
          }}
        >
          {HOBBY_LIST.map((h) => {
            const sel = hobbies.includes(h);
            return (
              <button
                key={h}
                onClick={() =>
                  setHobbies(
                    sel ? hobbies.filter((x) => x !== h) : [...hobbies, h],
                  )
                }
                style={{
                  padding: "10px 18px",
                  borderRadius: "99px",
                  border: `2px solid ${sel ? "var(--primary)" : "var(--border)"}`,
                  background: sel ? "var(--primary-10)" : "transparent",
                  color: sel ? "var(--primary)" : "var(--text-muted)",
                  fontWeight: sel ? 700 : 400,
                  fontSize: "16px",
                  cursor: "pointer",
                  transition: "all 150ms",
                }}
              >
                {h}
              </button>
            );
          })}
        </div>
        <button
          className="btn btn-primary"
          onClick={finish}
          style={{ fontSize: "17px", padding: "14px 32px" }}
        >
          Завершити налаштування
        </button>
      </div>
    );

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div
          style={{
            display: "inline-block",
            background: "var(--primary-10)",
            color: "var(--primary)",
            fontWeight: 700,
            fontSize: "14px",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            padding: "7px 16px",
            borderRadius: "99px",
            marginBottom: "16px",
          }}
        >
          Знайомство з системою
        </div>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 800,
            color: "var(--text)",
            marginBottom: "8px",
          }}
        >
          Розкажи про себе
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "17px",
            lineHeight: 1.6,
          }}
        >
          Ці відповіді допоможуть AdaptLearn підлаштувати навчання під тебе
        </p>
      </div>
      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "15px",
            color: "var(--text-muted)",
            marginBottom: "8px",
          }}
        >
          <span>
            Питання {idx + 1} з {PREFS.length}
          </span>
          <span style={{ color: "var(--primary)", fontWeight: 700 }}>
            {pct}%
          </span>
        </div>
        <div
          style={{
            height: "5px",
            background: "var(--surface-2)",
            borderRadius: "3px",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: "var(--primary)",
              borderRadius: "3px",
              transition: "width 300ms",
            }}
          />
        </div>
      </div>
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "16px",
          padding: "30px",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <p
          style={{
            fontSize: "19px",
            fontWeight: 600,
            color: "var(--text)",
            marginBottom: "22px",
            lineHeight: 1.55,
          }}
        >
          {q.text}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {q.opts.map((opt, i) => (
            <button
              key={i}
              onClick={() => setSel(i)}
              style={{
                padding: "15px 18px",
                borderRadius: "10px",
                border: `1.5px solid ${sel === i ? "var(--primary)" : "transparent"}`,
                background:
                  sel === i ? "var(--primary-10)" : "var(--surface-2)",
                color: sel === i ? "var(--primary)" : "var(--text)",
                fontWeight: sel === i ? 600 : 400,
                fontSize: "16px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 150ms",
              }}
            >
              {opt.l}
            </button>
          ))}
        </div>
        <button
          className="btn btn-primary"
          style={{
            width: "100%",
            marginTop: "22px",
            fontSize: "17px",
            padding: "14px",
          }}
          onClick={next}
          disabled={sel === null}
        >
          {idx + 1 < PREFS.length ? "Далі →" : "До вибору захоплень"}
        </button>
      </div>
    </div>
  );
}

function renderParagraph(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} style={{ color: "var(--primary)" }}>
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

function MyLessonResponses({
  studentId,
  lessonId,
}: {
  studentId: number;
  lessonId: number;
}) {
  const [bundle, setBundle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    client
      .get(`/api/lessons/${lessonId}/responses?student_id=${studentId}`)
      .then((r) => {
        const list = r.data ?? [];
        setBundle(list[0] ?? null);
      })
      .catch(() => setBundle(null))
      .finally(() => setLoading(false));
  }, [studentId, lessonId]);
  if (loading || !bundle || !bundle.responses?.length) return null;
  const totalC =
    bundle.totalAccuracy >= 80
      ? "#5BE39A"
      : bundle.totalAccuracy >= 50
        ? "#E8B923"
        : "#FF5E7A";
  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: "14px",
        padding: "22px 26px",
        marginBottom: "16px",
        boxShadow: "var(--shadow-sm)",
        borderLeft: `4px solid ${totalC}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "14px",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Мої відповіді на уроці
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: totalC,
              textShadow: `0 0 18px ${totalC}55`,
            }}
          >
            {bundle.totalAccuracy}%
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            точність
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {bundle.responses.map((r: any, i: number) => (
          <div
            key={i}
            style={{
              background: "var(--surface-2)",
              borderRadius: "10px",
              padding: "12px 16px",
              borderLeft: `3px solid ${r.isCorrect ? "#5BE39A" : "#FF5E7A"}`,
            }}
          >
            <div
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                marginBottom: "4px",
              }}
            >
              Питання {i + 1}
            </div>
            <div
              style={{
                fontSize: "15px",
                color: "var(--text)",
                fontWeight: 600,
                marginBottom: "6px",
              }}
            >
              {r.q}
            </div>
            <div
              style={{
                display: "flex",
                gap: "16px",
                fontSize: "13px",
                flexWrap: "wrap",
              }}
            >
              <span style={{ color: r.isCorrect ? "#5BE39A" : "#FF5E7A" }}>
                Твоя: <strong>{r.given}</strong>
              </span>
              {!r.isCorrect && (
                <span style={{ color: "#5BE39A" }}>
                  Правильна: <strong>{r.correct}</strong>
                </span>
              )}
              <span style={{ color: "var(--text-muted)", marginLeft: "auto" }}>
                {r.accuracy}% точно
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentLessonSensors({ lessonId }: { lessonId: number }) {
  const [s, setS] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    client
      .get(`/api/lessons/${lessonId}/sensors`)
      .then((r) => setS(r.data))
      .catch(() => setS(null))
      .finally(() => setLoading(false));
  }, [lessonId]);
  if (loading || !s) return null;
  const att = s.avg_attention;

  const message =
    att == null
      ? "Дані з датчиків ще збираються."
      : att >= 80
        ? "Цей урок пройшов яскраво — клас був дуже зосереджений."
        : att >= 60
          ? "Урок пройшов добре — клас в цілому слухав уважно."
          : att >= 45
            ? "Місцями було непросто утримати увагу — повтори ключові моменти разом з AI-поясненням нижче."
            : "Урок був нелегким для багатьох — AI-пояснення нижче розжує матеріал на твоїх захопленнях.";
  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: "14px",
        padding: "18px 22px",
        marginBottom: "16px",
        boxShadow: "var(--shadow-sm)",
        borderLeft: `4px solid ${cl(att ?? 60)}`,
      }}
    >
      <div
        style={{
          fontSize: "13px",
          fontWeight: 700,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "8px",
        }}
      >
        Як пройшов цей урок
      </div>
      <div
        style={{
          fontSize: "15px",
          color: "var(--text)",
          lineHeight: 1.55,
          marginBottom: "12px",
        }}
      >
        {message}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: "8px",
        }}
      >
        {att != null && (
          <div
            style={{
              background: `${cl(att)}14`,
              borderRadius: "10px",
              padding: "10px 12px",
            }}
          >
            <div style={{ fontSize: "17px", fontWeight: 800, color: cl(att) }}>
              {att}%
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                fontWeight: 600,
                marginTop: "2px",
                textTransform: "uppercase",
              }}
            >
              Увага класу
            </div>
          </div>
        )}
        {s.avg_temperature != null && (
          <div
            style={{
              background: `${s.avg_temperature < 20 || s.avg_temperature > 24 ? "#f59e0b14" : "#22c55e14"}`,
              borderRadius: "10px",
              padding: "10px 12px",
            }}
          >
            <div
              style={{
                fontSize: "17px",
                fontWeight: 800,
                color:
                  s.avg_temperature < 20 || s.avg_temperature > 24
                    ? "#f59e0b"
                    : "#22c55e",
              }}
            >
              {s.avg_temperature}°C
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                fontWeight: 600,
                marginTop: "2px",
                textTransform: "uppercase",
              }}
            >
              У класі
            </div>
          </div>
        )}
        {s.avg_humidity != null && (
          <div
            style={{
              background: `${s.avg_humidity < 40 || s.avg_humidity > 60 ? "#f59e0b14" : "#22c55e14"}`,
              borderRadius: "10px",
              padding: "10px 12px",
            }}
          >
            <div
              style={{
                fontSize: "17px",
                fontWeight: 800,
                color:
                  s.avg_humidity < 40 || s.avg_humidity > 60
                    ? "#f59e0b"
                    : "#22c55e",
              }}
            >
              {s.avg_humidity}%
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                fontWeight: 600,
                marginTop: "2px",
                textTransform: "uppercase",
              }}
            >
              Вологість
            </div>
          </div>
        )}
        {s.audio_events_count != null && (
          <div
            style={{
              background: "var(--primary-10)",
              borderRadius: "10px",
              padding: "10px 12px",
            }}
          >
            <div
              style={{
                fontSize: "17px",
                fontWeight: 800,
                color: "var(--primary)",
              }}
            >
              {s.audio_events_count}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                fontWeight: 600,
                marginTop: "2px",
                textTransform: "uppercase",
              }}
            >
              Питань і відповідей
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LearnSection({
  lessons,
  profile,
  studentId,
  focusLessonId,
  onConsumed,
}: {
  lessons: any[];
  profile: any;
  studentId: number;
  focusLessonId: number | null;
  onConsumed: () => void;
}) {
  const [sel, setSel] = useState<any>(null);
  const [selfAnswers, setSelfAnswers] = useState<any[]>([]);
  const [evaluated, setEvaluated] = useState<string[]>([]);
  const [showTest, setShowTest] = useState(false);
  const [aiContent, setAiContent] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const interests: string[] = profile?.interests ?? [];

  useEffect(() => {
    if (focusLessonId) {
      const f = lessons.find((l) => l.id === focusLessonId);
      if (f) {
        setSel(f);
        onConsumed();
      }
    }
  }, [focusLessonId, lessons, onConsumed]);

  useEffect(() => {
    if (!sel) {
      setAiContent(null);
      setAiError("");
      return;
    }
    if (!sel.transcript || !sel.transcript.trim()) {
      setAiContent(null);
      return;
    }
    setAiLoading(true);
    setAiError("");
    client
      .post(`/api/lessons/${sel.id}/explain`, {
        interests,
        student_id: studentId,
      })
      .then((r) => setAiContent(r.data))
      .catch((e) =>
        setAiError(
          e?.response?.data?.detail ?? "Упс, AI не зміг сформувати пояснення",
        ),
      )
      .finally(() => setAiLoading(false));
  }, [sel, interests.join("|")]);

  if (sel) {
    const fallback = getLessonContent(
      sel.subject ?? "",
      sel.topic ?? sel.subject,
      interests,
    );

    const content: any = aiContent
      ? {
          ...aiContent,
          paragraphs:
            aiContent.adapted_explanation ??
            aiContent.paragraphs ??
            fallback.paragraphs,
          original_explanation: aiContent.original_explanation ?? null,
          selfcheck:
            aiContent.selfcheck && aiContent.selfcheck.length > 0
              ? aiContent.selfcheck
              : fallback.selfcheck,
          examples:
            aiContent.examples && aiContent.examples.length > 0
              ? aiContent.examples
              : fallback.examples,
        }
      : fallback;
    const done = evaluated.length > 0;
    return (
      <div className="fade-in">
        <button
          onClick={() => {
            setSel(null);
            setSelfAnswers([]);
            setEvaluated([]);
            setShowTest(false);
          }}
          style={{
            background: "none",
            border: "none",
            color: "var(--primary)",
            fontWeight: 600,
            fontSize: "17px",
            cursor: "pointer",
            marginBottom: "16px",
            padding: 0,
          }}
        >
          ← Назад до уроків
        </button>
        <h2
          style={{
            fontSize: "26px",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: "4px",
          }}
        >
          {sel.topic ?? sel.subject}
        </h2>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "16px",
            marginBottom: "24px",
          }}
        >
          {sel.subject} · {sel.date?.slice?.(0, 10) ?? ""}
        </p>

        {}
        <MyLessonResponses studentId={studentId} lessonId={sel.id} />

        {aiLoading && (
          <div
            style={{
              background: "var(--primary-10)",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "14px",
              fontSize: "15px",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span className="spinner" style={{ width: 18, height: 18 }} /> AI
            готує персональне пояснення для тебе...
          </div>
        )}
        {aiError && (
          <div
            style={{
              background: "var(--warning-bg)",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "14px",
              fontSize: "15px",
              color: "var(--warning)",
            }}
          >
            {aiError}
          </div>
        )}
        {!sel.transcript && (
          <div
            style={{
              background: "var(--warning-bg)",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "14px",
              fontSize: "15px",
              color: "var(--warning)",
            }}
          >
            Транскрипт уроку ще не готовий. Як буде — отримаєш персональне
            пояснення на основі своїх захоплень.
          </div>
        )}

        {}
        {content.original_explanation &&
          content.original_explanation.length > 0 && (
            <div
              style={{
                background: "var(--surface)",
                borderRadius: "14px",
                padding: "32px",
                marginBottom: "16px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "16px",
                }}
              >
                Що казав вчитель на уроці
              </div>
              {content.original_explanation.map((p: string, i: number) => (
                <p
                  key={i}
                  style={{
                    fontSize: "18px",
                    color: "var(--text)",
                    lineHeight: 1.75,
                    marginBottom: "16px",
                  }}
                >
                  {renderParagraph(p)}
                </p>
              ))}
            </div>
          )}

        {}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "14px",
            padding: "32px",
            marginBottom: "16px",
            boxShadow: "var(--shadow-sm)",
            borderLeft: "5px solid var(--primary)",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--primary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "16px",
            }}
          >
            {content.original_explanation
              ? "Пояснення для тебе"
              : "Пояснення теми"}
            {interests.length > 0 && (
              <span
                style={{
                  marginLeft: "10px",
                  background: "var(--primary-10)",
                  padding: "3px 12px",
                  borderRadius: "99px",
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "none",
                  letterSpacing: "normal",
                }}
              >
                з прив'язкою до:{" "}
                {interests
                  .filter(
                    (i: string) =>
                      ![
                        "auditory",
                        "visual",
                        "kinesthetic",
                        "reading",
                        "stem",
                        "humanities",
                        "arts",
                        "nature",
                        "slow",
                        "medium",
                        "fast",
                        "dedicated",
                        "mastery",
                        "grades",
                        "exam",
                        "growth",
                        "quiet",
                        "music",
                        "social",
                        "flexible",
                        "art",
                        "sport",
                        "tech",
                      ].includes(i),
                  )
                  .slice(0, 4)
                  .join(", ") || "твоїх інтересів"}
              </span>
            )}
          </div>
          {content.paragraphs.map((p: string, i: number) => (
            <p
              key={i}
              style={{
                fontSize: "18px",
                color: "var(--text)",
                lineHeight: 1.75,
                marginBottom: "16px",
              }}
            >
              {renderParagraph(p)}
            </p>
          ))}
        </div>

        {}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "14px",
            padding: "32px",
            marginBottom: "16px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--primary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "16px",
            }}
          >
            Приклади з розв'язанням
          </div>
          {content.examples.map((ex: any, i: number) => (
            <div
              key={i}
              style={{
                marginBottom: "22px",
                paddingBottom: "22px",
                borderBottom:
                  i < content.examples.length - 1
                    ? "1px solid var(--border)"
                    : "none",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  background: "var(--primary)",
                  color: "#fff",
                  padding: "5px 14px",
                  borderRadius: "99px",
                  fontSize: "13px",
                  fontWeight: 700,
                  marginBottom: "12px",
                }}
              >
                Приклад {i + 1}
              </div>
              <div
                style={{
                  fontSize: "19px",
                  fontWeight: 700,
                  color: "var(--text)",
                  marginBottom: "12px",
                }}
              >
                {renderParagraph(ex.title)}
              </div>
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  fontSize: "17px",
                  color: "var(--text)",
                  lineHeight: 1.75,
                }}
              >
                {renderParagraph(ex.solution)}
              </div>
            </div>
          ))}
        </div>

        {}
        {content.encourage && (
          <div
            style={{
              background: "var(--primary-10)",
              borderRadius: "14px",
              padding: "18px 22px",
              marginBottom: "20px",
              borderLeft: "4px solid var(--primary)",
            }}
          >
            <p
              style={{
                fontSize: "16px",
                color: "var(--text)",
                lineHeight: 1.6,
                fontWeight: 500,
              }}
            >
              💡 {content.encourage}
            </p>
          </div>
        )}

        {}
        {!showTest && (
          <button
            className="btn btn-primary"
            style={{ fontSize: "17px", padding: "14px 28px" }}
            onClick={() => setShowTest(true)}
          >
            Перевірити себе →
          </button>
        )}

        {}
        {showTest && (
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "14px",
              padding: "28px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                fontSize: "17px",
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: "18px",
              }}
            >
              Самоперевірка
            </div>
            {content.selfcheck.map((q: any, i: number) => (
              <div key={i} style={{ marginBottom: "18px" }}>
                <p
                  style={{
                    fontSize: "16px",
                    color: "var(--text)",
                    marginBottom: "10px",
                    fontWeight: 500,
                  }}
                >
                  {i + 1}. {q.q}
                </p>
                {q.type === "choice" ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    {q.options.map((opt: string, oi: number) => (
                      <button
                        key={oi}
                        onClick={() => {
                          if (!evaluated[i]) {
                            const a = [...selfAnswers];
                            a[i] = oi;
                            setSelfAnswers(a);
                          }
                        }}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border:
                            "1.5px solid " +
                            (selfAnswers[i] === oi
                              ? "var(--primary)"
                              : "transparent"),
                          background:
                            selfAnswers[i] === oi
                              ? "var(--primary-10)"
                              : "var(--surface-2)",
                          color:
                            selfAnswers[i] === oi
                              ? "var(--primary)"
                              : "var(--text)",
                          fontSize: "15px",
                          textAlign: "left",
                          cursor: evaluated[i] ? "default" : "pointer",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            marginRight: "8px",
                            opacity: 0.6,
                          }}
                        >
                          {String.fromCharCode(65 + oi)}.
                        </span>
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    value={selfAnswers[i] ?? ""}
                    onChange={(e) => {
                      const a = [...selfAnswers];
                      a[i] = e.target.value;
                      setSelfAnswers(a);
                    }}
                    placeholder="Введи відповідь..."
                    style={{ fontSize: "16px" }}
                  />
                )}
                {evaluated[i] && (
                  <div
                    style={{
                      marginTop: "8px",
                      background: evaluated[i].startsWith("✓")
                        ? "var(--success-bg)"
                        : "var(--warning-bg)",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      fontSize: "15px",
                      color: "var(--text)",
                    }}
                  >
                    {evaluated[i]}
                  </div>
                )}
              </div>
            ))}
            {!done && (
              <button
                className="btn btn-primary"
                style={{ marginTop: "8px", fontSize: "16px" }}
                onClick={() => {
                  const evals = content.selfcheck.map((q: any, i: number) => {
                    if (q.type === "choice") {
                      return selfAnswers[i] === q.correct
                        ? `✓ Правильно!`
                        : `Не зовсім: правильна відповідь — ${String.fromCharCode(65 + q.correct)}`;
                    }
                    const ans = String(selfAnswers[i] ?? "")
                      .trim()
                      .toLowerCase();
                    const correct = String(q.answer ?? "").toLowerCase();
                    if (!correct) return "Дякуємо за відповідь!";
                    if (ans.length < 2) return "Спробуй дати розгорнутіше";
                    if (
                      correct &&
                      (ans.includes(correct.split(" ")[0]) ||
                        correct.includes(ans))
                    )
                      return `✓ Правильно! ${q.answer}`;
                    return `Перевір: правильна відповідь — ${q.answer}`;
                  });
                  setEvaluated(evals);
                }}
              >
                Перевірити відповіді
              </button>
            )}
            {done && (
              <div
                style={{
                  marginTop: "12px",
                  background: "var(--success-bg)",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  fontSize: "15px",
                  color: "var(--success)",
                  fontWeight: 600,
                }}
              >
                ✓ Самоперевірку завершено. Молодець!
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fade-in">
      <p
        style={{
          color: "var(--text-muted)",
          fontSize: "17px",
          marginBottom: "20px",
        }}
      >
        Уроки підлаштовані під твої вподобання: приклади беруться з того, що
        тобі цікаво.
      </p>
      {lessons.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>Уроки ще не завантажено</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {lessons.map((l) => (
            <div
              key={l.id}
              onClick={() => setSel(l)}
              style={{
                background: "var(--surface)",
                borderRadius: "12px",
                padding: "18px 22px",
                cursor: "pointer",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "box-shadow 150ms",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow = "var(--shadow-md)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow = "var(--shadow-sm)")
              }
            >
              <div>
                <div
                  style={{
                    fontSize: "17px",
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  {l.topic ?? l.subject}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--text-muted)",
                    marginTop: "3px",
                  }}
                >
                  {l.subject} · {l.date?.slice?.(0, 10) ?? ""}
                </div>
              </div>
              <span
                style={{
                  color: "var(--primary)",
                  fontWeight: 700,
                  fontSize: "17px",
                }}
              >
                →
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CareerSticker({
  studentId,
  lessons,
}: {
  studentId: number;
  lessons: any[];
}) {
  const { subjectToTrack: SUBJ_TO_TRACK, trackLabels: TRACK_LABELS } =
    useStaticContent();
  const [items, setItems] = useState<
    { subject: string; avg: number; track: string }[]
  >([]);
  useEffect(() => {
    (async () => {
      const bySubj: Record<string, number[]> = {};

      try {
        const r = await client.get(`/api/students/${studentId}/results`);
        const results = r.data ?? [];
        if (results.length) {
          const testLists = await Promise.all(
            lessons.map((l: any) =>
              client
                .get(`/api/tests/lesson/${l.id}`)
                .then((r) => r.data ?? [])
                .catch(() => []),
            ),
          );
          const testToSubj: Record<number, string> = {};
          lessons.forEach((l: any, i: number) =>
            (testLists[i] ?? []).forEach((t: any) => {
              testToSubj[t.id] = l.subject;
            }),
          );
          results.forEach((r: any) => {
            const subj = testToSubj[r.test_id];
            if (subj) (bySubj[subj] ||= []).push(r.score);
          });
        }
      } catch {}

      if (Object.keys(bySubj).length === 0) {
        try {
          const r = await client.get(
            `/api/students/${studentId}/lesson-responses`,
          );
          Object.values(r.data ?? {}).forEach((b: any) => {
            if (b?.subject && typeof b.totalAccuracy === "number") {
              (bySubj[b.subject] ||= []).push(b.totalAccuracy);
            }
          });
        } catch {}
      }

      const out = Object.entries(bySubj)
        .map(([subject, arr]) => {
          const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
          const info = SUBJ_TO_TRACK[subject];
          return info ? { subject, avg, track: info.track } : null;
        })
        .filter(Boolean) as { subject: string; avg: number; track: string }[];
      out.sort((a, b) => b.avg - a.avg);
      setItems(out.slice(0, 5));
    })();
  }, [studentId, lessons, SUBJ_TO_TRACK]);

  if (items.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          minWidth: 0,
          background: "var(--surface-2)",
          borderRadius: "16px",
          padding: "22px",
          border: "2px dashed var(--border)",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "8px",
          }}
        >
          Аналіз твоїх оцінок
        </div>
        <div
          style={{ fontSize: "15px", color: "var(--text)", lineHeight: 1.6 }}
        >
          Пройди кілька тестів зі шкільних предметів — і тут з'являться
          персональні поради на основі того, що в тебе виходить найкраще.
        </div>
      </div>
    );
  }
  const best = items[0];
  const trackTxt = TRACK_LABELS[best.track];
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: `linear-gradient(135deg, ${"#0284c7"}14, ${"#22c55e"}14)`,
        borderRadius: "16px",
        padding: "22px",
        boxShadow: "var(--shadow-sm)",
        border: "1px solid var(--border)",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-8px",
          right: "14px",
          background: "#22c55e",
          color: "#fff",
          padding: "4px 12px",
          borderRadius: "99px",
          fontSize: "11px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        Підказка
      </div>
      <div
        style={{
          fontSize: "13px",
          fontWeight: 700,
          color: "#22c55e",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "10px",
        }}
      >
        На основі твоїх оцінок зі школи
      </div>
      <div
        style={{
          fontSize: "17px",
          fontWeight: 700,
          color: "var(--text)",
          lineHeight: 1.5,
          marginBottom: "14px",
        }}
      >
        У тебе хороші оцінки з{" "}
        {SUBJ_TO_TRACK[best.subject]?.subj ?? best.subject} (
        {Math.round(best.avg)}%) — це означає, що тобі може бути цікаво в
        напрямку <strong style={{ color: "#0284c7" }}>{trackTxt}</strong>.
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          marginBottom: "12px",
        }}
      >
        {items.map((it) => (
          <div
            key={it.subject}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "14px",
            }}
          >
            <span style={{ color: "var(--text)" }}>{it.subject}</span>
            <span style={{ fontWeight: 700, color: cl(it.avg) }}>
              {Math.round(it.avg)}%
            </span>
          </div>
        ))}
      </div>
      <div
        style={{
          fontSize: "13px",
          color: "var(--text-muted)",
          lineHeight: 1.5,
        }}
      >
        Пройди тест зліва, щоб отримати повну картину з твоїми інтересами і
        характером.
      </div>
    </div>
  );
}

function CareerTest({
  studentId,
  lessons,
}: {
  studentId: number;
  lessons: any[];
}) {
  const { career: CAREER, careerResults: CAREER_RES } = useStaticContent();
  const storageKey = `career_result_${studentId}`;
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState({
    stem: 0,
    social: 0,
    creative: 0,
    business: 0,
  });
  const [sel, setSel] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved?.result && saved?.scores) {
          setResult(saved.result);
          setScores(saved.scores);
        }
      }
    } catch {}
  }, [storageKey]);

  const q = CAREER[idx];
  const next = () => {
    if (sel === null) return;
    const tp = q.opts[sel].tp as keyof typeof scores;
    const ns = { ...scores, [tp]: scores[tp] + 1 };
    if (idx + 1 < CAREER.length) {
      setScores(ns);
      setIdx(idx + 1);
      setSel(null);
    } else {
      const winner = Object.entries(ns).sort((a, b) => b[1] - a[1])[0][0];
      setResult(winner);
      setScores(ns);
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ result: winner, scores: ns }),
        );
      } catch {}
    }
  };

  const restart = () => {
    setIdx(0);
    setScores({ stem: 0, social: 0, creative: 0, business: 0 });
    setSel(null);
    setResult(null);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  };

  if (result) {
    const r = CAREER_RES[result];
    const total = CAREER.length;
    const fs = { ...scores };
    return (
      <div
        className="fade-in"
        style={{
          display: "flex",
          gap: "18px",
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            flex: "1 1 480px",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "14px",
              padding: "28px",
              borderTop: `4px solid ${r.color}`,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: r.color,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "8px",
              }}
            >
              Твоя сфера
            </div>
            <h3
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: "12px",
              }}
            >
              {r.title}
            </h3>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "16px",
                lineHeight: 1.7,
                marginBottom: "16px",
              }}
            >
              {r.desc}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {r.profs.map((p) => (
                <span
                  key={p}
                  style={{
                    background: `${r.color}18`,
                    color: r.color,
                    padding: "5px 14px",
                    borderRadius: "99px",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "14px",
              padding: "22px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {Object.entries(CAREER_RES).map(([key, val]) => {
              const s = (fs as any)[key];
              const pct = Math.min(100, Math.round((s / total) * 100));
              return (
                <div key={key} style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "15px",
                      marginBottom: "5px",
                    }}
                  >
                    <span style={{ color: "var(--text)" }}>{val.title}</span>
                    <span style={{ fontWeight: 700, color: val.color }}>
                      {pct}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: "7px",
                      background: "var(--surface-2)",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: val.color,
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <button
            className="btn btn-ghost"
            style={{ fontSize: "16px", alignSelf: "flex-start" }}
            onClick={restart}
          >
            Пройти знову
          </button>
        </div>
        <CareerSticker studentId={studentId} lessons={lessons} />
      </div>
    );
  }

  const pct = Math.round((idx / CAREER.length) * 100);
  return (
    <div
      className="fade-in"
      style={{
        display: "flex",
        gap: "18px",
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: "1 1 480px", minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "15px",
            color: "var(--text-muted)",
            marginBottom: "6px",
          }}
        >
          <span>
            Питання {idx + 1} / {CAREER.length}
          </span>
          <span style={{ color: "var(--primary)", fontWeight: 700 }}>
            {pct}%
          </span>
        </div>
        <div
          style={{
            height: "5px",
            background: "var(--surface-2)",
            borderRadius: "3px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: "var(--primary)",
              borderRadius: "3px",
              transition: "width 300ms",
            }}
          />
        </div>
        <p
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "var(--text)",
            marginBottom: "22px",
            lineHeight: 1.55,
          }}
        >
          {q.t}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {q.opts.map((opt, i) => (
            <button
              key={i}
              onClick={() => setSel(i)}
              style={{
                padding: "14px 18px",
                borderRadius: "10px",
                border: `1.5px solid ${sel === i ? "var(--primary)" : "transparent"}`,
                background:
                  sel === i ? "var(--primary-10)" : "var(--surface-2)",
                color: sel === i ? "var(--primary)" : "var(--text)",
                fontWeight: sel === i ? 600 : 400,
                fontSize: "16px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 150ms",
              }}
            >
              {opt.t}
            </button>
          ))}
        </div>
        <button
          className="btn btn-primary"
          style={{ marginTop: "22px", fontSize: "17px" }}
          onClick={next}
          disabled={sel === null}
        >
          {idx + 1 < CAREER.length ? "Далі →" : "Дізнатись результат"}
        </button>
      </div>
      <CareerSticker studentId={studentId} lessons={lessons} />
    </div>
  );
}

function JournalSection({
  lessons,
  studentId,
  onSelectTest,
}: {
  lessons: any[];
  studentId: number;
  onSelectTest: (lessonId: number) => void;
}) {
  const [search, setSearch] = useState("");
  const [subFilter, setSubFilter] = useState("Всі");
  const [dateSort, setDateSort] = useState<"asc" | "desc">("desc");
  const [grades, setGrades] = useState<Record<number, number>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resultsR = await client.get(`/api/students/${studentId}/results`);
        const results = resultsR.data ?? [];
        if (!results.length) {
          if (!cancelled) setGrades({});
          return;
        }
        const testLists = await Promise.all(
          lessons.map((l: any) =>
            client
              .get(`/api/tests/lesson/${l.id}`)
              .then((r) => r.data ?? [])
              .catch(() => []),
          ),
        );
        const testToLesson: Record<number, number> = {};
        lessons.forEach((l: any, i: number) => {
          (testLists[i] ?? []).forEach((t: any) => {
            testToLesson[t.id] = l.id;
          });
        });
        const m: Record<number, number> = {};
        results.forEach((r: any) => {
          const lid = testToLesson[r.test_id];
          if (lid != null) {
            m[lid] = Math.max(m[lid] ?? 0, r.score ?? 0);
          }
        });
        if (!cancelled) setGrades(m);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId, lessons]);

  const subjects = [
    "Всі",
    ...Array.from(new Set(lessons.map((l) => l.subject))),
  ];
  const filtered = lessons
    .filter((l) => subFilter === "Всі" || l.subject === subFilter)
    .filter((l) =>
      (l.topic ?? l.subject).toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      const d = new Date(a.date).getTime() - new Date(b.date).getTime();
      return dateSort === "desc" ? -d : d;
    });

  return (
    <div className="fade-in">
      {}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "18px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Пошук по темі..."
          style={{ width: "240px", fontSize: "16px" }}
        />
        <select
          value={subFilter}
          onChange={(e) => setSubFilter(e.target.value)}
          style={{ fontSize: "16px", width: "auto" }}
        >
          {subjects.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button
          className="btn btn-ghost"
          style={{ fontSize: "15px", padding: "10px 18px" }}
          onClick={() => setDateSort((d) => (d === "desc" ? "asc" : "desc"))}
        >
          Дата {dateSort === "desc" ? "↓" : "↑"}
        </button>
      </div>

      {}
      {filtered.length === 0 ? (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "14px",
            padding: "40px",
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "17px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          Уроків не знайдено
        </div>
      ) : (
        (() => {
          const byDate: Record<string, any[]> = {};
          filtered.forEach((l) => {
            const d = l.date?.slice?.(0, 10) ?? "—";
            if (!byDate[d]) byDate[d] = [];
            byDate[d].push(l);
          });
          const todayStr = new Date().toISOString().slice(0, 10);
          const dayNames = [
            "Неділя",
            "Понеділок",
            "Вівторок",
            "Середа",
            "Четвер",
            "П'ятниця",
            "Субота",
          ];

          return (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {Object.entries(byDate).map(([date, items]) => {
                const dt = new Date(date);
                const isToday = date === todayStr;
                const dayName = isNaN(dt.getTime())
                  ? ""
                  : dayNames[dt.getDay()];
                const dayNum = isNaN(dt.getTime()) ? "" : String(dt.getDate());
                const monthName = isNaN(dt.getTime())
                  ? ""
                  : [
                      "січ",
                      "лют",
                      "бер",
                      "кві",
                      "тра",
                      "чер",
                      "лип",
                      "сер",
                      "вер",
                      "жов",
                      "лис",
                      "гру",
                    ][dt.getMonth()];

                return (
                  <div
                    key={date}
                    style={{
                      background: "var(--surface)",
                      borderRadius: "14px",
                      overflow: "hidden",
                      boxShadow: "var(--shadow-sm)",
                      borderLeft: isToday
                        ? "5px solid #22c55e"
                        : "5px solid var(--primary)",
                    }}
                  >
                    {}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        padding: "16px 20px",
                        borderBottom: "1px solid var(--border)",
                        background: isToday
                          ? "rgba(34,197,94,0.06)"
                          : "var(--surface-2)",
                      }}
                    >
                      <div
                        style={{
                          width: "54px",
                          height: "54px",
                          borderRadius: "12px",
                          background: isToday ? "#22c55e" : "var(--primary)",
                          color: "#fff",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "22px",
                            fontWeight: 800,
                            lineHeight: 1,
                          }}
                        >
                          {dayNum}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            marginTop: "2px",
                          }}
                        >
                          {monthName}
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: 700,
                            color: "var(--text)",
                          }}
                        >
                          {dayName}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "var(--text-muted)",
                          }}
                        >
                          {date}
                          {isToday ? " · сьогодні" : ""} · {items.length}{" "}
                          {items.length === 1
                            ? "урок"
                            : items.length < 5
                              ? "уроки"
                              : "уроків"}
                        </div>
                      </div>
                    </div>
                    {}
                    <table
                      style={{ width: "100%", borderCollapse: "collapse" }}
                    >
                      <tbody>
                        {items.map((l, i) => {
                          const realScore = grades[l.id];
                          const score =
                            realScore != null
                              ? realScore
                              : l.avg_engagement
                                ? Math.round(l.avg_engagement)
                                : null;
                          const g12 = score
                            ? Math.max(
                                1,
                                Math.min(12, Math.round((score * 12) / 100)),
                              )
                            : null;
                          const cl12 = g12
                            ? g12 >= 10
                              ? "#22c55e"
                              : g12 >= 7
                                ? "#f59e0b"
                                : g12 >= 4
                                  ? "#fb923c"
                                  : "#ef4444"
                            : "var(--border)";
                          return (
                            <tr
                              key={l.id}
                              style={{
                                borderTop: i
                                  ? "1px dashed var(--border)"
                                  : "none",
                              }}
                            >
                              <td
                                style={{
                                  padding: "14px 20px",
                                  fontSize: "14px",
                                  color: "var(--primary)",
                                  fontWeight: 700,
                                  width: "80px",
                                }}
                              >
                                {l.subject?.slice?.(0, 12)}
                              </td>
                              <td
                                style={{
                                  padding: "14px 12px",
                                  fontSize: "15px",
                                  color: "var(--text)",
                                }}
                              >
                                {l.topic ?? l.subject}
                              </td>
                              <td
                                style={{
                                  padding: "14px 20px",
                                  textAlign: "right",
                                  width: "100px",
                                }}
                              >
                                {g12 !== null ? (
                                  <button
                                    onClick={() => onSelectTest(l.id)}
                                    style={{
                                      background: `${cl12}18`,
                                      color: cl12,
                                      fontWeight: 800,
                                      fontSize: "19px",
                                      padding: "4px 16px",
                                      borderRadius: "8px",
                                      border: "none",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {g12}
                                  </button>
                                ) : (
                                  <span
                                    style={{
                                      color: "var(--text-muted)",
                                      fontSize: "16px",
                                    }}
                                  >
                                    —
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          );
        })()
      )}
    </div>
  );
}

function TakeTestPage({
  test,
  studentId,
  onClose,
  onComplete,
}: {
  test: any;
  studentId: number;
  onClose: () => void;
  onComplete: (score: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const qs = test.questions ?? [];
  const total = qs.length;
  const q = qs[idx];

  if (!q) return null;

  const submit = async (finalAnswers: number[]) => {
    setSubmitting(true);
    let correct = 0;
    finalAnswers.forEach((a, i) => {
      if (a === qs[i].correct_index) correct++;
    });
    const score = Math.round((correct / total) * 100);
    const errors = finalAnswers
      .map((a, i) => (a !== qs[i].correct_index ? qs[i].question : null))
      .filter(Boolean);
    const answersObj: Record<string, number> = {};
    finalAnswers.forEach((a, i) => {
      answersObj[String(i)] = a;
    });
    try {
      await client.post("/api/tests/results", {
        student_id: studentId,
        test_id: test.id,
        answers: answersObj,
        score,
        errors,
      });
      onComplete(score);
    } catch (e: any) {
      setErr("Упс, не вдалося зберегти результат. Спробуй ще раз.");
      setSubmitting(false);
    }
  };

  const next = () => {
    if (sel === null) return;
    const a = [...answers, sel];
    setAnswers(a);
    if (idx + 1 < total) {
      setIdx(idx + 1);
      setSel(null);
    } else {
      submit(a);
    }
  };

  const pct = Math.round(((idx + 1) / total) * 100);

  return (
    <div className="fade-in" style={{ maxWidth: "720px", margin: "0 auto" }}>
      <button
        onClick={onClose}
        disabled={submitting}
        style={{
          background: "none",
          border: "none",
          color: "var(--primary)",
          fontWeight: 600,
          fontSize: "16px",
          cursor: submitting ? "default" : "pointer",
          marginBottom: "16px",
          padding: 0,
          opacity: submitting ? 0.5 : 1,
        }}
      >
        ← Назад до тестів
      </button>
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "14px",
          padding: "32px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <h3
            style={{ fontSize: "22px", fontWeight: 700, color: "var(--text)" }}
          >
            {test.topic}
          </h3>
          <p
            style={{
              fontSize: "15px",
              color: "var(--text-muted)",
              marginTop: "4px",
            }}
          >
            {test.subject}
          </p>
        </div>

        <div
          style={{
            height: "5px",
            background: "var(--surface-2)",
            borderRadius: "3px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: "var(--primary)",
              borderRadius: "3px",
              transition: "width 300ms",
            }}
          />
        </div>

        <div
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--primary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "10px",
          }}
        >
          Питання {idx + 1} з {total}
        </div>
        <p
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "var(--text)",
            marginBottom: "20px",
            lineHeight: 1.55,
          }}
        >
          {q.question}
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginBottom: "22px",
          }}
        >
          {(q.options ?? []).map((opt: string, i: number) => (
            <button
              key={i}
              onClick={() => setSel(i)}
              disabled={submitting}
              style={{
                padding: "14px 18px",
                borderRadius: "10px",
                border: `1.5px solid ${sel === i ? "var(--primary)" : "transparent"}`,
                background:
                  sel === i ? "var(--primary-10)" : "var(--surface-2)",
                color: sel === i ? "var(--primary)" : "var(--text)",
                fontWeight: sel === i ? 600 : 400,
                fontSize: "16px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 150ms",
              }}
            >
              <span
                style={{ fontWeight: 700, marginRight: "10px", opacity: 0.6 }}
              >
                {String.fromCharCode(65 + i)}.
              </span>
              {opt}
            </button>
          ))}
        </div>

        {err && (
          <div
            style={{
              background: "var(--danger-bg)",
              color: "var(--danger)",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "14px",
              marginBottom: "14px",
            }}
          >
            {err}
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={next}
          disabled={sel === null || submitting}
          style={{ width: "100%", fontSize: "17px", padding: "14px" }}
        >
          {submitting
            ? "Зберігання..."
            : idx + 1 < total
              ? "Далі →"
              : "Завершити тест"}
        </button>
      </div>
    </div>
  );
}

function TestsSection({
  lessons,
  studentId: _sid2,
  focusLessonId: _fid,
  grade: _grade,
}: {
  lessons: any[];
  studentId: number;
  focusLessonId: number | null;
  grade: number;
}) {
  const [available, setAvailable] = useState<any[]>([]);
  const [done, setDone] = useState<any[]>([]);
  const [takingTest, setTakingTest] = useState<any | null>(null);
  const [lastScore, setLastScore] = useState<number | null>(null);

  const loadAvailable = useCallback(async () => {
    const all: any[] = [];
    const doneList: any[] = [];
    let submittedTestIds: Set<number> = new Set();
    let submittedMap: Record<number, any> = {};
    try {
      const sub = await client
        .get(`/api/students/${_sid2}/results`)
        .catch(() => ({ data: [] }));
      (sub.data ?? []).forEach((r: any) => {
        submittedTestIds.add(r.test_id);
        submittedMap[r.test_id] = r;
      });
    } catch {}
    const lessonsMap: Record<number, any> = {};
    lessons.forEach((l) => {
      lessonsMap[l.id] = l;
    });
    for (const l of lessons) {
      try {
        const r = await client.get(`/api/tests/lesson/${l.id}`);
        if (r.data && r.data.length) {
          r.data.forEach((t: any) => {
            if (!t.questions || t.questions.length === 0) return;
            const meta = {
              id: t.id,
              lesson_id: l.id,
              subject: l.subject,
              topic: l.topic ?? l.subject,
              date: l.date?.slice?.(0, 10) ?? "",
              questions: t.questions,
              questions_count: t.questions.length,
            };
            if (submittedTestIds.has(t.id)) {
              const res = submittedMap[t.id];
              doneList.push({
                ...meta,
                score: res.score,
                completed_at: res.completed_at,
              });
            } else {
              all.push(meta);
            }
          });
        }
      } catch {}
    }
    setAvailable(all);
    setDone(
      doneList.sort((a, b) =>
        String(b.completed_at ?? "").localeCompare(
          String(a.completed_at ?? ""),
        ),
      ),
    );
  }, [lessons, _sid2]);
  useEffect(() => {
    loadAvailable();
  }, [loadAvailable]);

  const [selDone, setSelDone] = useState<any | null>(null);

  if (selDone) {
    const cl12 = (v: number) =>
      v >= 10 ? "#22c55e" : v >= 7 ? "#f59e0b" : v >= 4 ? "#fb923c" : "#ef4444";
    const grade12 = Math.max(
      1,
      Math.min(12, Math.round((selDone.score * 12) / 100)),
    );
    return (
      <div className="fade-in">
        <button
          onClick={() => setSelDone(null)}
          style={{
            background: "none",
            border: "none",
            color: "var(--primary)",
            fontWeight: 600,
            fontSize: "16px",
            cursor: "pointer",
            marginBottom: "16px",
            padding: 0,
          }}
        >
          ← Назад до тестів
        </button>
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "14px",
            padding: "24px",
            boxShadow: "var(--shadow-sm)",
            borderTop: `4px solid ${cl12(grade12)}`,
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "8px",
            }}
          >
            Виконаний тест · {selDone.date}
          </div>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "6px",
            }}
          >
            {selDone.topic}
          </h2>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "15px",
              marginBottom: "20px",
            }}
          >
            {selDone.subject}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                width: "70px",
                height: "70px",
                borderRadius: "50%",
                background: `${cl12(grade12)}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "30px",
                fontWeight: 800,
                color: cl12(grade12),
              }}
            >
              {grade12}
            </div>
            <div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "var(--text)",
                }}
              >
                Оцінка {grade12} з 12
              </div>
              <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                {grade12 >= 10
                  ? "Відмінно"
                  : grade12 >= 7
                    ? "Добре"
                    : grade12 >= 4
                      ? "Задовільно"
                      : "Потребує доопрацювання"}
              </div>
            </div>
          </div>
          <div
            style={{
              background: "var(--surface-2)",
              borderRadius: "10px",
              padding: "14px 18px",
              fontSize: "15px",
              color: "var(--text)",
              lineHeight: 1.7,
            }}
          >
            Тест уже здано. Перегляд відповідей доступний лише вчителю. Якщо є
            питання — звернись до вчителя особисто на уроці.
          </div>
        </div>
      </div>
    );
  }

  if (takingTest)
    return (
      <TakeTestPage
        test={takingTest}
        studentId={_sid2}
        onClose={() => setTakingTest(null)}
        onComplete={(score) => {
          setTakingTest(null);
          setLastScore(score);
          loadAvailable();
        }}
      />
    );

  return (
    <div className="fade-in">
      {lastScore !== null && (
        <div
          style={{
            background:
              lastScore >= 75
                ? "var(--success-bg)"
                : lastScore >= 50
                  ? "var(--warning-bg)"
                  : "var(--danger-bg)",
            borderRadius: "10px",
            padding: "14px 18px",
            marginBottom: "16px",
            fontSize: "16px",
            color:
              lastScore >= 75
                ? "var(--success)"
                : lastScore >= 50
                  ? "var(--warning)"
                  : "var(--danger)",
            fontWeight: 600,
          }}
        >
          ✓ Тест здано · результат {lastScore}% (оцінка{" "}
          {Math.max(1, Math.min(12, Math.round((lastScore * 12) / 100)))} з 12)
        </div>
      )}

      {available.length === 0 ? (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "14px",
            padding: "32px",
            textAlign: "center",
            boxShadow: "var(--shadow-sm)",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              fontSize: "17px",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "8px",
            }}
          >
            Активних тестів немає
          </div>
          <p
            style={{
              fontSize: "15px",
              color: "var(--text-muted)",
              lineHeight: 1.6,
            }}
          >
            Коли вчитель надішле новий тест — він з'явиться тут. Виконані тести
            — нижче.
          </p>
        </div>
      ) : (
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              fontSize: "17px",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "14px",
            }}
          >
            Тести від вчителя ({available.length})
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {available.map((t) => (
              <div
                key={t.id}
                style={{
                  background: "var(--surface)",
                  borderRadius: "12px",
                  padding: "18px 22px",
                  boxShadow: "var(--shadow-sm)",
                  borderLeft: "4px solid var(--primary)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    {t.topic}
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "var(--text-muted)",
                      marginTop: "4px",
                    }}
                  >
                    {t.subject} · {t.date} · {t.questions_count}{" "}
                    {t.questions_count === 1
                      ? "питання"
                      : t.questions_count < 5
                        ? "питання"
                        : "питань"}
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ fontSize: "15px" }}
                  onClick={() => setTakingTest(t)}
                >
                  Пройти →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {done.length > 0 && (
        <div>
          <div
            style={{
              fontSize: "17px",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "14px",
            }}
          >
            Виконані тести
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {done.map((t) => {
              const g12 = Math.max(
                1,
                Math.min(12, Math.round((t.score * 12) / 100)),
              );
              const cl12 =
                g12 >= 10
                  ? "#22c55e"
                  : g12 >= 7
                    ? "#f59e0b"
                    : g12 >= 4
                      ? "#fb923c"
                      : "#ef4444";
              return (
                <div
                  key={t.id}
                  onClick={() => setSelDone(t)}
                  style={{
                    background: "var(--surface)",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    cursor: "pointer",
                    boxShadow: "var(--shadow-sm)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "var(--text)",
                      }}
                    >
                      {t.topic}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "var(--text-muted)",
                        marginTop: "3px",
                      }}
                    >
                      {t.subject} · {t.date}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{ fontSize: "24px", fontWeight: 800, color: cl12 }}
                    >
                      {g12}
                    </div>
                    <div
                      style={{ fontSize: "12px", color: "var(--text-muted)" }}
                    >
                      з 12
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ProgressSection({
  profile,
  trajectory,
  studentId,
  lessons: _lessons,
}: {
  profile: any;
  trajectory: string[];
  studentId: number;
  lessons: any[];
}) {
  const monthlyData = [
    { month: "Вер", average: 62 },
    { month: "Жов", average: 68 },
    { month: "Лис", average: 72 },
    { month: "Гру", average: 70 },
    { month: "Січ", average: 75 },
    { month: "Лют", average: 78 },
    { month: "Бер", average: 81 },
    { month: "Кві", average: 79 },
    { month: "Тра", average: Math.round(profile?.knowledge_level ?? 80) },
  ];

  const moti = motivationFor(profile);
  return (
    <div className="fade-in">
      {}
      <div
        style={{
          background: `${moti.color}14`,
          borderLeft: `5px solid ${moti.color}`,
          borderRadius: "14px",
          padding: "22px 26px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: moti.color,
            marginBottom: "4px",
          }}
        >
          {moti.title}
        </div>
        <div style={{ fontSize: "16px", color: "var(--text-muted)" }}>
          {moti.subtitle}
        </div>
      </div>
      {}

      {}
      {monthlyData.length > 0 && (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "14px",
            padding: "22px",
            boxShadow: "var(--shadow-sm)",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "16px",
            }}
          >
            Прогрес по місяцях
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "12px",
              height: "180px",
              borderBottom: "1px solid var(--border)",
              paddingBottom: "8px",
            }}
          >
            {monthlyData.map((m, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: cl(m.average),
                  }}
                >
                  {m.average}%
                </div>
                <div
                  style={{
                    width: "100%",
                    height: `${Math.max(8, m.average * 1.5)}px`,
                    background: `${cl(m.average)}`,
                    borderRadius: "6px 6px 0 0",
                    transition: "height 500ms ease",
                  }}
                />
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                  }}
                >
                  {m.month}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {}
      <div style={{ marginBottom: "20px" }}>
        <KnowledgeMap studentId={studentId} />
      </div>

      {trajectory.length > 0 && (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "14px",
            padding: "22px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "6px",
            }}
          >
            Траєкторія навчання
          </div>
          <p
            style={{
              fontSize: "14px",
              color: "var(--text-muted)",
              marginBottom: "14px",
            }}
          >
            Список тем, які тобі рекомендовано пройти на основі твого рівня
            знань та інтересів.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {trajectory.map((t, i) => (
              <span
                key={i}
                style={{
                  background: "var(--primary-10)",
                  color: "var(--primary)",
                  padding: "6px 16px",
                  borderRadius: "99px",
                  fontSize: "15px",
                  fontWeight: 600,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileSection({
  user,
  profile,
  onSavedInterests,
}: {
  user: any;
  profile: any;
  onSavedInterests: (i: string[]) => void;
}) {
  const { hobbies: HOBBY_LIST } = useStaticContent();
  const [tab, setTab] = useState<"info" | "prefs" | "interests">("info");
  const [editName, setEditName] = useState(user?.full_name ?? "");
  const [savedMsg, setSavedMsg] = useState("");

  const interests: string[] = profile?.interests ?? [];
  const hobbyTags = interests.filter((i) => HOBBY_LIST.includes(i));
  const styleMap: Record<string, string> = {
    auditory: "Аудіо",
    visual: "Візуально",
    kinesthetic: "Практично",
    reading: "Через читання",
  };
  const goalMap: Record<string, string> = {
    mastery: "Глибоке розуміння",
    grades: "Хороші оцінки",
    exam: "ЗНО/НМТ",
    growth: "Саморозвиток",
  };
  const paceMap: Record<string, string> = {
    slow: "До 30 хв на день",
    medium: "30-60 хв",
    fast: "1-2 години",
    dedicated: "Скільки потрібно",
  };
  const envMap: Record<string, string> = {
    quiet: "Тиша",
    music: "Музика",
    social: "Компанія",
    flexible: "Будь-де",
  };
  const intMap: Record<string, string> = {
    stem: "Точні науки",
    humanities: "Гуманітарні",
    arts: "Мистецтво",
    nature: "Природа/спорт",
  };

  const find = (map: Record<string, string>) => {
    const v = interests.find((i) => Object.keys(map).includes(i));
    return v ? map[v] : "не вказано";
  };

  const [selHobbies, setSelHobbies] = useState<string[]>(hobbyTags);
  const saveHobbies = async () => {
    const nonHobbies = interests.filter((i) => !HOBBY_LIST.includes(i));
    const newInterests = [...nonHobbies, ...selHobbies];
    try {
      await client.patch(`/api/students/${user.student_id}/profile`, {
        interests: newInterests,
      });
      onSavedInterests(newInterests);
      setSavedMsg("Збережено");
      setTimeout(() => setSavedMsg(""), 2000);
    } catch {
      setSavedMsg("Помилка");
    }
  };

  return (
    <div className="fade-in">
      {}
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "14px",
          padding: "24px",
          boxShadow: "var(--shadow-sm)",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "var(--primary)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {user?.full_name?.charAt(0)}
        </div>
        <div>
          <div
            style={{ fontSize: "22px", fontWeight: 700, color: "var(--text)" }}
          >
            {user?.full_name}
          </div>
          <div
            style={{
              fontSize: "15px",
              color: "var(--text-muted)",
              marginTop: "4px",
            }}
          >
            @{user?.username} · Клас {className(user?.class_id)}
          </div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: "18px" }}>
        <button
          className={`tab${tab === "info" ? " active" : ""}`}
          onClick={() => setTab("info")}
        >
          Особиста інформація
        </button>
        <button
          className={`tab${tab === "prefs" ? " active" : ""}`}
          onClick={() => setTab("prefs")}
        >
          Мої вподобання
        </button>
        <button
          className={`tab${tab === "interests" ? " active" : ""}`}
          onClick={() => setTab("interests")}
        >
          Хобі
        </button>
      </div>

      {tab === "info" && (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "14px",
            padding: "24px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--text-muted)",
                marginBottom: "8px",
                textTransform: "uppercase",
              }}
            >
              Повне ім'я
            </label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--text-muted)",
                marginBottom: "8px",
                textTransform: "uppercase",
              }}
            >
              Логін
            </label>
            <input value={user?.username} disabled style={{ opacity: 0.6 }} />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setSavedMsg("Зміни збережено");
              setTimeout(() => setSavedMsg(""), 2000);
            }}
          >
            Зберегти
          </button>
          {savedMsg && (
            <span
              style={{
                marginLeft: "14px",
                color: "var(--success)",
                fontWeight: 600,
              }}
            >
              {savedMsg}
            </span>
          )}
        </div>
      )}

      {tab === "prefs" && (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "14px",
            padding: "24px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "15px",
              marginBottom: "20px",
            }}
          >
            Результати початкового опитування, на основі якого AdaptLearn
            підлаштовує приклади в уроках:
          </p>
          {[
            { l: "Стиль навчання", v: find(styleMap) },
            { l: "Інтереси", v: find(intMap) },
            { l: "Темп", v: find(paceMap) },
            { l: "Мета", v: find(goalMap) },
            { l: "Атмосфера для навчання", v: find(envMap) },
          ].map((item) => (
            <div
              key={item.l}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span style={{ fontSize: "15px", color: "var(--text-muted)" }}>
                {item.l}
              </span>
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--text)",
                }}
              >
                {item.v}
              </span>
            </div>
          ))}
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              marginTop: "16px",
              fontStyle: "italic",
            }}
          >
            Щоб переробити опитування — звернись до адміністратора школи.
          </p>
        </div>
      )}

      {tab === "interests" && (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "14px",
            padding: "24px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "15px",
              marginBottom: "16px",
            }}
          >
            Обери все, що тобі подобається. Це впливає на приклади в уроках:
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            {HOBBY_LIST.map((h) => {
              const isSel = selHobbies.includes(h);
              return (
                <button
                  key={h}
                  onClick={() =>
                    setSelHobbies(
                      isSel
                        ? selHobbies.filter((x) => x !== h)
                        : [...selHobbies, h],
                    )
                  }
                  style={{
                    padding: "10px 18px",
                    borderRadius: "99px",
                    border: `2px solid ${isSel ? "var(--primary)" : "var(--border)"}`,
                    background: isSel ? "var(--primary-10)" : "transparent",
                    color: isSel ? "var(--primary)" : "var(--text-muted)",
                    fontWeight: isSel ? 700 : 400,
                    fontSize: "15px",
                    cursor: "pointer",
                  }}
                >
                  {h}
                </button>
              );
            })}
          </div>
          <button className="btn btn-primary" onClick={saveHobbies}>
            Зберегти
          </button>
          {savedMsg && (
            <span
              style={{
                marginLeft: "14px",
                color:
                  savedMsg === "Помилка" ? "var(--danger)" : "var(--success)",
                fontWeight: 600,
              }}
            >
              {savedMsg}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ScheduleSection({ grade }: { grade: number }) {
  const BELLS = [
    { num: 1, start: "08:30", end: "09:15" },
    { num: 2, start: "09:30", end: "10:15" },
    { num: 3, start: "10:30", end: "11:15" },
    { num: 4, start: "11:30", end: "12:15" },
    { num: 5, start: "12:30", end: "13:15" },
    { num: 6, start: "13:30", end: "14:15" },
    { num: 7, start: "14:30", end: "15:15" },
  ];
  const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт"];

  const WEEK_LOW: string[][] = [
    ["Читання", "Математика", "Природознавство", "Музика", "—"],
    ["Українська мова", "Математика", "Читання", "Фізкультура", "—"],
    ["Математика", "Читання", "Природознавство", "Малювання", "—"],
    ["Українська мова", "Математика", "Читання", "Праця", "—"],
    ["Читання", "Математика", "Природознавство", "Фізкультура", "—"],
  ];
  const WEEK_MID: string[][] = [
    ["Українська мова", "Математика", "Англійська", "Біологія", "Фізкультура"],
    ["Математика", "Українська літ.", "Історія", "Географія", "Інформатика"],
    ["Англійська", "Математика", "Біологія", "Фізика", "Українська мова"],
    ["Хімія", "Математика", "Англійська", "Географія", "Музика"],
    ["Математика", "Українська мова", "Історія", "Фізкультура", "—"],
  ];
  const WEEK_HIGH: string[][] = [
    [
      "Математика",
      "Фізика",
      "Українська мова",
      "Англійська",
      "Історія України",
    ],
    ["Математика", "Біологія", "Українська літ.", "Хімія", "Інформатика"],
    ["Фізика", "Математика", "Англійська", "Географія", "Захист України"],
    ["Українська мова", "Математика", "Хімія", "Біологія", "Англійська"],
    [
      "Математика",
      "Українська літ.",
      "Історія України",
      "Інформатика",
      "Фізкультура",
    ],
  ];
  const week = grade <= 4 ? WEEK_LOW : grade <= 9 ? WEEK_MID : WEEK_HIGH;

  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const today = now.getDay();
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const tab = ["bells", "week"] as const;
  type Tab = (typeof tab)[number];
  const [view, setView] = useState<Tab>("week");

  return (
    <div className="fade-in">
      <div className="tabs" style={{ marginBottom: "18px", maxWidth: "360px" }}>
        <button
          className={`tab${view === "week" ? " active" : ""}`}
          onClick={() => setView("week")}
        >
          Тижневий розклад
        </button>
        <button
          className={`tab${view === "bells" ? " active" : ""}`}
          onClick={() => setView("bells")}
        >
          Розклад дзвінків
        </button>
      </div>

      {view === "week" ? (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "14px",
            padding: "6px",
            boxShadow: "var(--shadow-sm)",
            overflowX: "auto",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th
                  style={{
                    padding: "14px",
                    textAlign: "left",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  №
                </th>
                <th
                  style={{
                    padding: "14px",
                    textAlign: "left",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    minWidth: "110px",
                  }}
                >
                  Час
                </th>
                {DAYS.map((d, i) => (
                  <th
                    key={d}
                    style={{
                      padding: "14px",
                      textAlign: "left",
                      fontSize: "14px",
                      fontWeight: 700,
                      color:
                        today === i + 1
                          ? "var(--primary)"
                          : "var(--text-muted)",
                      minWidth: "130px",
                      background:
                        today === i + 1 ? "var(--primary-10)" : "transparent",
                    }}
                  >
                    {d}
                    {today === i + 1 ? " (сьогодні)" : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BELLS.map((b, bi) => {
                const isCurrent = cur >= toMin(b.start) && cur <= toMin(b.end);
                return (
                  <tr
                    key={b.num}
                    style={{
                      borderTop: "1px solid var(--border)",
                      background: isCurrent
                        ? "rgba(34,197,94,0.06)"
                        : "transparent",
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 14px",
                        fontWeight: 700,
                        fontSize: "17px",
                        color: isCurrent ? "#22c55e" : "var(--primary)",
                      }}
                    >
                      {b.num}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        fontSize: "14px",
                        color: "var(--text-muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {b.start}–{b.end}
                    </td>
                    {DAYS.map((_, di) => {
                      const subject = week[di]?.[bi] ?? "—";
                      const isToday = today === di + 1;
                      return (
                        <td
                          key={di}
                          style={{
                            padding: "12px 14px",
                            fontSize: "15px",
                            color:
                              subject === "—"
                                ? "var(--text-muted)"
                                : "var(--text)",
                            fontWeight: isToday && isCurrent ? 700 : 500,
                            background:
                              isToday && isCurrent
                                ? "#22c55e22"
                                : isToday
                                  ? "var(--primary-10)"
                                  : "transparent",
                          }}
                        >
                          {subject}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "14px",
            overflow: "hidden",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {BELLS.map((s, i) => {
            const isActive = cur >= toMin(s.start) && cur <= toMin(s.end);
            const next = BELLS[i + 1];
            return (
              <div key={s.num}>
                <div
                  style={{
                    padding: "18px 24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                    borderTop: i ? "1px solid var(--border)" : "none",
                    background: isActive ? "var(--primary-10)" : "transparent",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: isActive
                        ? "var(--primary)"
                        : "var(--surface-2)",
                      color: isActive ? "#fff" : "var(--text)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "20px",
                      flexShrink: 0,
                    }}
                  >
                    {s.num}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "var(--text)",
                      }}
                    >
                      Урок {s.num}
                    </div>
                    <div
                      style={{ fontSize: "15px", color: "var(--text-muted)" }}
                    >
                      {s.start} — {s.end} · 45 хв
                    </div>
                  </div>
                  {isActive && (
                    <span
                      style={{
                        background: "#22c55e",
                        color: "#fff",
                        fontSize: "13px",
                        fontWeight: 700,
                        padding: "4px 14px",
                        borderRadius: "99px",
                      }}
                    >
                      зараз
                    </span>
                  )}
                </div>
                {next && (
                  <div
                    style={{
                      padding: "8px 24px 8px 88px",
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      background: "var(--surface-2)",
                    }}
                  >
                    Перерва {s.end} — {next.start} (
                    {toMin(next.start) - toMin(s.end)} хв)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HomeSection({
  profile,
  lessons,
  setSection,
  onLessonClick,
}: {
  profile: any;
  lessons: any[];
  setSection: (s: string) => void;
  onLessonClick: (l: any) => void;
}) {
  const moti = motivationFor(profile);
  return (
    <div className="fade-in" style={{ position: "relative" }}>
      <NeuroDepth intensity="normal" />
      {}
      <div
        style={{
          background: `${moti.color}14`,
          borderLeft: `5px solid ${moti.color}`,
          borderRadius: "14px",
          padding: "22px 26px",
          marginBottom: "20px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: moti.color,
            marginBottom: "4px",
          }}
        >
          {moti.title}
        </div>
        <div style={{ fontSize: "16px", color: "var(--text-muted)" }}>
          {moti.subtitle}
        </div>
      </div>
      {}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        <div
          onClick={() => setSection("learn")}
          style={{
            background: "var(--surface)",
            borderRadius: "14px",
            padding: "22px",
            boxShadow: "var(--shadow-sm)",
            cursor: "pointer",
            borderLeft: "5px solid var(--primary)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.boxShadow = "var(--shadow-md)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.boxShadow = "var(--shadow-sm)")
          }
        >
          <div
            style={{
              fontSize: "19px",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "6px",
            }}
          >
            Навчання
          </div>
          <div style={{ fontSize: "16px", color: "var(--text-muted)" }}>
            Уроки з персоналізованими прикладами
          </div>
        </div>
        <div
          onClick={() => setSection("tests")}
          style={{
            background: "var(--surface)",
            borderRadius: "14px",
            padding: "22px",
            boxShadow: "var(--shadow-sm)",
            cursor: "pointer",
            borderLeft: "5px solid #0d9488",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.boxShadow = "var(--shadow-md)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.boxShadow = "var(--shadow-sm)")
          }
        >
          <div
            style={{
              fontSize: "19px",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "6px",
            }}
          >
            Тести
          </div>
          <div style={{ fontSize: "16px", color: "var(--text-muted)" }}>
            Початковий, достатній і високий рівень
          </div>
        </div>
      </div>
      <div
        style={{
          fontSize: "17px",
          fontWeight: 700,
          color: "var(--text)",
          marginBottom: "12px",
        }}
      >
        Останні уроки
      </div>
      {lessons.slice(0, 4).map((l) => (
        <div
          key={l.id}
          onClick={() => onLessonClick(l)}
          style={{
            background: "var(--surface)",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "var(--shadow-sm)",
            cursor: "pointer",
            transition: "box-shadow 150ms",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.boxShadow = "var(--shadow-md)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.boxShadow = "var(--shadow-sm)")
          }
        >
          <div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              {l.topic ?? l.subject}
            </div>
            <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>
              {l.subject} · {l.date?.slice?.(0, 10) ?? ""}
            </div>
          </div>
          {l.avg_engagement && (
            <span
              style={{
                fontSize: "20px",
                fontWeight: 800,
                color: cl(l.avg_engagement),
              }}
            >
              {Math.round(l.avg_engagement)}%
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function StudentApp() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, palette, setPalette } = useTheme();
  const [section, setSection] = useState("home");
  const [profile, setProfile] = useState<any>(null);
  const [trajectory, setTrajectory] = useState<string[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [showPrefs, setShowPrefs] = useState(false);
  const [focusLessonId, setFocusLessonId] = useState<number | null>(null);

  const sid = user?.student_id ?? 1;
  const classId = user?.class_id ?? 6;
  const grade = [1, 1, 5, 5, 9, 10, 10, 11][classId - 1] ?? 10;

  const load = useCallback(() => {
    client
      .get(`/api/students/${sid}/profile`)
      .then((r) => {
        setProfile(r.data);
        const noInt = !r.data.interests || r.data.interests.length === 0;
        if (noInt) setShowPrefs(true);
      })
      .catch(() => {});
    client
      .get(`/api/trajectory/${sid}`)
      .then((r) => {
        const t = r.data?.topics;
        if (Array.isArray(t))
          setTrajectory(
            t.map((x: any) => (typeof x === "string" ? x : (x?.title ?? ""))),
          );
      })
      .catch(() => {});
    client
      .get(`/api/lessons/?class_id=${classId}`)
      .then((r) => setLessons(r.data ?? []))
      .catch(() => {});
  }, [sid, classId]);

  useEffect(() => {
    load();
  }, [load]);

  const titles: Record<string, string> = {
    home: "Головна",
    learn: "Уроки",
    tests: "Тести",
    progress: "Прогрес",
    journal: "Щоденник",
    schedule: "Розклад",
    career: "Профорієнтація",
    profile: "Профіль",
  };

  if (showPrefs)
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <PreferencesTest
          studentId={sid}
          onDone={() => {
            setShowPrefs(false);
            load();
          }}
        />
      </div>
    );

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        section={section}
        setSection={(s: string) => {
          setSection(s);
          if (s !== "tests") setFocusLessonId(null);
        }}
        user={user}
        logout={logout}
        theme={theme}
        toggleTheme={toggleTheme}
        palette={palette}
        setPalette={setPalette}
      />
      <main
        style={{
          marginLeft: "240px",
          flex: 1,
          padding: "36px 48px",
          minWidth: 0,
        }}
      >
        <div className="fade-in">
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "4px",
            }}
          >
            {titles[section]}
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "var(--text-muted)",
              marginBottom: "30px",
            }}
          >
            {user?.full_name} · Клас {className(classId)}
          </p>
        </div>
        {section === "home" && (
          <HomeSection
            profile={profile}
            lessons={lessons}
            setSection={setSection}
            onLessonClick={(l) => {
              setFocusLessonId(l.id);
              setSection("learn");
            }}
          />
        )}
        {section === "learn" && (
          <LearnSection
            lessons={lessons}
            profile={profile}
            studentId={sid}
            focusLessonId={focusLessonId}
            onConsumed={() => setFocusLessonId(null)}
          />
        )}
        {section === "tests" && (
          <TestsSection
            lessons={lessons}
            studentId={sid}
            focusLessonId={focusLessonId}
            grade={grade}
          />
        )}
        {section === "progress" && (
          <ProgressSection
            profile={profile}
            trajectory={trajectory}
            studentId={sid}
            lessons={lessons}
          />
        )}
        {section === "journal" && (
          <JournalSection
            lessons={lessons}
            studentId={sid}
            onSelectTest={(id) => {
              setFocusLessonId(id);
              setSection("tests");
            }}
          />
        )}
        {section === "schedule" && <ScheduleSection grade={grade} />}
        {section === "profile" && (
          <ProfileSection
            user={user}
            profile={profile}
            onSavedInterests={(i) => setProfile({ ...profile, interests: i })}
          />
        )}
        {section === "career" && (
          <div className="fade-in">
            <div
              style={{
                background: "var(--primary-10)",
                borderRadius: "10px",
                padding: "14px 18px",
                marginBottom: "20px",
                fontSize: "16px",
                color: "var(--text)",
                lineHeight: 1.6,
              }}
            >
              Тест профорієнтації — 20 запитань про твої вподобання та реакції в
              різних ситуаціях. Допоможе зрозуміти, які сфери діяльності тобі
              найближчі. Просто відповідай чесно — правильних чи неправильних
              відповідей немає.
            </div>
            <CareerTest studentId={sid} lessons={lessons} />
          </div>
        )}
      </main>
    </div>
  );
}
