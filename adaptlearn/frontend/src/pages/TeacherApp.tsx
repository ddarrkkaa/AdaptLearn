import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import NeuroLessonView from "../components/neuro/NeuroLessonView";
import NeuroDepth from "../components/neuro/NeuroDepth";
import { useTheme, PALETTES } from "../contexts/ThemeContext";
import client from "../api/client";
import {
  useStaticContent,
  NON_HOBBY_KEYS,
} from "../contexts/StaticContentContext";

const STUDENT_LESSON_ANSWERS: Record<number, Record<number, any>> = {};

const I = {
  grid: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: 20, height: 20 }}
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
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
  users: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: 20, height: 20 }}
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
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
      <path d="M9 12l2 2 4-4" />
      <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.51 0 4.78 1.03 6.41 2.69" />
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
  play: (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ width: 26, height: 26 }}
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  pause: (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ width: 26, height: 26 }}
    >
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  ),
  ai: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: 18, height: 18 }}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
    </svg>
  ),
};

const cl = (v: number) =>
  v >= 70 ? "#22c55e" : v >= 45 ? "#f59e0b" : "#ef4444";
const avg = (arr: number[]) =>
  arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

const NAV = [
  { key: "overview", label: "Огляд", icon: I.grid },
  { key: "lessons", label: "Уроки", icon: I.book },
  { key: "tests", label: "Тести", icon: I.test },
  { key: "students", label: "Учні", icon: I.users },
  { key: "journal", label: "Журнал", icon: I.cal },
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
  user: { full_name: string; subject: string | null };
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
        width: 230,
        minWidth: 230,
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
              width: "38px",
              height: "38px",
              borderRadius: "11px",
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
              style={{ width: 19, height: 19 }}
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "var(--text)",
                lineHeight: 1,
              }}
            >
              AdaptLearn
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: 3,
              }}
            >
              {user.subject ?? "Класний керівник"}
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
              padding: "11px 13px",
              borderRadius: "9px",
              border: "none",
              background:
                section === n.key ? "var(--primary-10)" : "transparent",
              color: section === n.key ? "var(--primary)" : "var(--text-muted)",
              fontWeight: section === n.key ? 700 : 400,
              fontSize: "15px",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 120ms ease",
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
            {user.full_name.charAt(0)}
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
              {user.full_name.split(" ").slice(0, 2).join(" ")}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Вчитель{user.subject ? ` · ${user.subject}` : ""}
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

function LessonMediaSection({
  lessonId,
  tags,
}: {
  lessonId: number;
  topic?: string;
  tags: string[];
}) {
  const API = "http://localhost:8000";
  const [tab, setTab] = useState<"video" | "transcript" | "ai">("video");
  const [lessonData, setLessonData] = useState<any>(null);
  const [editTranscript, setEditTranscript] = useState("");
  const [editAnalysis, setEditAnalysis] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await client.get(`/api/lessons/${lessonId}`);
      setLessonData(data);
      setEditTranscript(data.transcript ?? "");
      setEditAnalysis(data.ai_analysis ?? null);
    } catch {}
  }, [lessonId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg(
      "Завантаження та транскрибування... (може тривати кілька хвилин)",
    );
    const form = new FormData();
    form.append("file", file);
    try {
      await client.post(`/api/lessons/${lessonId}/upload`, form);
      setUploadMsg(
        "Відео завантажено! Транскрипт готується у фоні — оновіть сторінку за хвилину.",
      );
      setTimeout(load, 5000);
    } catch {
      setUploadMsg("Помилка завантаження");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveTranscript = async () => {
    setSaving(true);
    try {
      const { data } = await client.patch(
        `/api/lessons/${lessonId}/transcript`,
        { transcript: editTranscript },
      );
      setLessonData(data);
      setEditAnalysis(data.ai_analysis);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleReanalyze = async () => {
    setAnalyzing(true);
    try {
      const { data } = await client.post(`/api/lessons/${lessonId}/analyze`);
      setLessonData(data);
      setEditAnalysis(data.ai_analysis);
    } catch {
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveAnalysis = async () => {
    setSaving(true);
    try {
      await client.patch(`/api/lessons/${lessonId}/analysis`, {
        ai_analysis: editAnalysis,
      });
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const hasVideo = !!lessonData?.video_path;
  const videoUrl = `${API}/api/lessons/${lessonId}/video`;
  const vttUrl = `${API}/api/lessons/${lessonId}/vtt`;
  const analysis = editAnalysis ?? lessonData?.ai_analysis;

  return (
    <div>
      {}
      <div
        style={{
          display: "flex",
          gap: "5px",
          marginBottom: "16px",
          background: "var(--surface-2)",
          padding: "4px",
          borderRadius: "9px",
        }}
      >
        {[
          { k: "video", l: "Відео" },
          { k: "transcript", l: "Транскрипт" },
          { k: "ai", l: "AI-аналіз" },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as any)}
            style={{
              flex: 1,
              padding: "9px 14px",
              borderRadius: "7px",
              border: "none",
              background: tab === t.k ? "var(--surface)" : "transparent",
              color: tab === t.k ? "var(--primary)" : "var(--text-muted)",
              fontWeight: tab === t.k ? 700 : 500,
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            {t.l}
          </button>
        ))}
      </div>

      {}
      {tab === "video" && (
        <div style={{ display: "block" }}>
          <div>
            {}
            <div
              style={{
                background: "#0f172a",
                borderRadius: "14px",
                overflow: "hidden",
              }}
            >
              {hasVideo ? (
                <video
                  controls
                  controlsList="nodownload"
                  preload="metadata"
                  style={{
                    width: "100%",
                    display: "block",
                    maxHeight: "560px",
                    background: "#000",
                  }}
                  key={videoUrl}
                >
                  <source src={videoUrl} type="video/mp4" />
                  <source src={videoUrl} type="video/webm" />
                  {lessonData?.vtt_subtitles && (
                    <track
                      kind="subtitles"
                      src={vttUrl}
                      srcLang="uk"
                      label="Субтитри"
                      default
                    />
                  )}
                  Ваш браузер не підтримує відтворення відео.
                </video>
              ) : (
                <div
                  style={{
                    aspectRatio: "16/9",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "14px",
                  }}
                >
                  <div
                    style={{ fontSize: "15px", color: "rgba(255,255,255,0.5)" }}
                  >
                    Відео ще не завантажено
                  </div>
                  <label style={{ cursor: "pointer" }}>
                    <input
                      type="file"
                      accept="video/*,audio/*"
                      onChange={handleUpload}
                      style={{ display: "none" }}
                    />
                    <span
                      className="btn btn-primary"
                      style={{ fontSize: "14px", padding: "10px 20px" }}
                    >
                      {uploading ? "Завантаження..." : "Завантажити відео"}
                    </span>
                  </label>
                </div>
              )}
            </div>

            {}
            {hasVideo && (
              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <label style={{ cursor: "pointer" }}>
                  <input
                    type="file"
                    accept="video/*,audio/*"
                    onChange={handleUpload}
                    style={{ display: "none" }}
                  />
                  <span
                    className="btn btn-ghost"
                    style={{ fontSize: "13px", padding: "8px 16px" }}
                  >
                    {uploading ? "Завантаження..." : "Замінити відео"}
                  </span>
                </label>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: "13px", padding: "8px 16px" }}
                  onClick={async () => {
                    setUploadMsg("Запуск транскрипції...");
                    try {
                      await client.post(`/api/lessons/${lessonId}/transcribe`);
                      setUploadMsg(
                        "Транскрипція запущена у фоні. Оновіть через хвилину.",
                      );
                      setTimeout(load, 10000);
                    } catch {
                      setUploadMsg("Помилка — перевір логи API");
                    }
                  }}
                >
                  Повторити транскрипцію
                </button>
                {lessonData?.vtt_subtitles && (
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#22c55e",
                      fontWeight: 600,
                    }}
                  >
                    ✓ Субтитри готові
                  </span>
                )}
                {lessonData?.transcript && !lessonData?.vtt_subtitles && (
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#f59e0b",
                      fontWeight: 600,
                    }}
                  >
                    ⏳ Транскрипт є, субтитри в процесі
                  </span>
                )}
              </div>
            )}
            {uploadMsg &&
              (() => {
                const isErr = uploadMsg.toLowerCase().includes("помилк");
                const isSuccess =
                  uploadMsg.includes("✓") ||
                  uploadMsg.toLowerCase().includes("успі") ||
                  uploadMsg.toLowerCase().includes("завантажено") ||
                  uploadMsg.toLowerCase().includes("готов");
                const bg = isErr
                  ? "var(--danger-bg)"
                  : isSuccess
                    ? "var(--success-bg)"
                    : "var(--primary-10)";
                const co = isErr
                  ? "var(--danger)"
                  : isSuccess
                    ? "var(--success)"
                    : "var(--primary)";
                return (
                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "14px",
                      color: co,
                      background: bg,
                      padding: "10px 14px",
                      borderRadius: "8px",
                      fontWeight: 500,
                    }}
                  >
                    {uploadMsg}
                  </div>
                );
              })()}

            <div
              style={{
                marginTop: "12px",
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              {tags.map((t) => (
                <span
                  key={t}
                  style={{
                    background: "var(--primary-10)",
                    color: "var(--primary)",
                    padding: "4px 12px",
                    borderRadius: "99px",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {}
      {tab === "transcript" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {!lessonData?.transcript && (
            <div
              style={{
                background: "var(--surface-2)",
                borderRadius: "10px",
                padding: "12px 16px",
                fontSize: "14px",
                color: "var(--text-muted)",
                marginBottom: "12px",
              }}
            >
              Транскрипт порожній. Завантаж відео — Whisper автоматично
              транскрибує. Або введи текст вручну нижче.
            </div>
          )}
          <div
            style={{
              background: "var(--surface-2)",
              borderRadius: "10px",
              padding: "12px 16px",
              fontSize: "14px",
              color: "var(--text)",
              lineHeight: 1.6,
            }}
          >
            Транскрипт формується автоматично через локальну модель{" "}
            <strong>faster-whisper</strong> після завантаження відео або PDF.
            Можна редагувати вручну — AI-аналіз оновиться автоматично.
          </div>
          <textarea
            value={editTranscript}
            onChange={(e) => setEditTranscript(e.target.value)}
            rows={16}
            placeholder="Транскрипт уроку з'явиться тут після завантаження відео або введи вручну..."
            style={{ fontSize: "15px", lineHeight: 1.7, resize: "vertical" }}
          />
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="btn btn-primary"
              onClick={handleSaveTranscript}
              disabled={saving}
            >
              {saving ? "Збереження..." : "Зберегти та оновити AI-аналіз"}
            </button>
            {lessonData?.transcript && (
              <button
                className="btn btn-ghost"
                onClick={handleReanalyze}
                disabled={analyzing}
              >
                {analyzing ? "Аналізується..." : "Перезапустити AI-аналіз"}
              </button>
            )}
          </div>
        </div>
      )}

      {}
      {tab === "ai" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {!analysis ? (
            <div
              style={{
                background: "var(--surface-2)",
                borderRadius: "14px",
                padding: "32px",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              <div style={{ fontSize: "16px", marginBottom: "12px" }}>
                AI-аналіз ще не сформований
              </div>
              <p style={{ fontSize: "14px", marginBottom: "16px" }}>
                Завантаж відео або введи транскрипт вручну
              </p>
              {lessonData?.transcript && (
                <button
                  className="btn btn-primary"
                  onClick={handleReanalyze}
                  disabled={analyzing}
                >
                  {analyzing ? "Аналізується..." : "Запустити AI-аналіз"}
                </button>
              )}
            </div>
          ) : (
            <>
              <div
                style={{
                  background: "var(--surface-2)",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  fontSize: "13px",
                  color: "var(--text-muted)",
                }}
              >
                {I.ai} AI-аналіз сформований з транскрипту уроку. Редагуй і
                зберігай.
              </div>

              {}
              <div
                style={{
                  background: "var(--surface)",
                  borderRadius: "14px",
                  padding: "18px",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--primary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "8px",
                  }}
                >
                  Тема уроку
                </div>
                <input
                  value={editAnalysis?.topic ?? analysis?.topic ?? ""}
                  onChange={(e) =>
                    setEditAnalysis({
                      ...(editAnalysis ?? analysis),
                      topic: e.target.value,
                    })
                  }
                  style={{ fontSize: "17px", fontWeight: 600 }}
                />
              </div>

              {}
              <div
                style={{
                  background: "var(--surface)",
                  borderRadius: "14px",
                  padding: "18px",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--primary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "8px",
                  }}
                >
                  Ключові терміни
                </div>
                <input
                  value={(
                    editAnalysis?.key_terms ??
                    analysis?.key_terms ??
                    []
                  ).join(", ")}
                  onChange={(e) =>
                    setEditAnalysis({
                      ...(editAnalysis ?? analysis),
                      key_terms: e.target.value
                        .split(",")
                        .map((s: string) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="термін1, термін2, термін3..."
                  style={{ fontSize: "15px" }}
                />
              </div>

              {}
              <div
                style={{
                  background: "var(--surface)",
                  borderRadius: "14px",
                  padding: "18px",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "8px",
                  }}
                >
                  Короткий огляд
                </div>
                <textarea
                  rows={3}
                  value={editAnalysis?.summary ?? analysis?.summary ?? ""}
                  onChange={(e) =>
                    setEditAnalysis({
                      ...(editAnalysis ?? analysis),
                      summary: e.target.value,
                    })
                  }
                  style={{
                    fontSize: "15px",
                    lineHeight: 1.6,
                    resize: "vertical",
                  }}
                />
              </div>

              {}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    background: "rgba(34,197,94,0.12)",
                    borderRadius: "14px",
                    padding: "18px",
                    borderLeft: "4px solid #22c55e",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#22c55e",
                      marginBottom: "10px",
                      fontSize: "14px",
                    }}
                  >
                    Сильні сторони
                  </div>
                  <textarea
                    rows={4}
                    value={(
                      editAnalysis?.strengths ??
                      analysis?.strengths ??
                      []
                    ).join("\n")}
                    onChange={(e) =>
                      setEditAnalysis({
                        ...(editAnalysis ?? analysis),
                        strengths: e.target.value.split("\n").filter(Boolean),
                      })
                    }
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      padding: "8px",
                      fontSize: "13px",
                      width: "100%",
                      resize: "vertical",
                      color: "var(--text)",
                    }}
                  />
                </div>
                <div
                  style={{
                    background: "rgba(245,158,11,0.14)",
                    borderRadius: "14px",
                    padding: "18px",
                    borderLeft: "4px solid #f59e0b",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#f59e0b",
                      marginBottom: "10px",
                      fontSize: "14px",
                    }}
                  >
                    Що покращити
                  </div>
                  <textarea
                    rows={4}
                    value={(
                      editAnalysis?.improvements ??
                      analysis?.improvements ??
                      []
                    ).join("\n")}
                    onChange={(e) =>
                      setEditAnalysis({
                        ...(editAnalysis ?? analysis),
                        improvements: e.target.value
                          .split("\n")
                          .filter(Boolean),
                      })
                    }
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      padding: "8px",
                      fontSize: "13px",
                      width: "100%",
                      resize: "vertical",
                      color: "var(--text)",
                    }}
                  />
                </div>
              </div>

              {}
              <div
                style={{
                  background: "rgba(239,68,68,0.13)",
                  borderRadius: "14px",
                  padding: "18px",
                  borderLeft: "4px solid #ef4444",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: "#ef4444",
                    marginBottom: "10px",
                    fontSize: "14px",
                  }}
                >
                  Ознаки ризику / учні що потребують уваги
                </div>
                <textarea
                  rows={3}
                  value={(
                    editAnalysis?.at_risk_indicators ??
                    analysis?.at_risk_indicators ??
                    []
                  ).join("\n")}
                  onChange={(e) =>
                    setEditAnalysis({
                      ...(editAnalysis ?? analysis),
                      at_risk_indicators: e.target.value
                        .split("\n")
                        .filter(Boolean),
                    })
                  }
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "8px",
                    fontSize: "13px",
                    width: "100%",
                    resize: "vertical",
                    color: "var(--text)",
                  }}
                />
              </div>

              {}
              <div
                style={{
                  background: "var(--primary-10)",
                  borderRadius: "14px",
                  padding: "18px",
                  borderLeft: "4px solid var(--primary)",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: "var(--primary)",
                    marginBottom: "8px",
                    fontSize: "14px",
                  }}
                >
                  Рекомендації до наступного уроку
                </div>
                <textarea
                  rows={3}
                  value={
                    editAnalysis?.next_lesson ?? analysis?.next_lesson ?? ""
                  }
                  onChange={(e) =>
                    setEditAnalysis({
                      ...(editAnalysis ?? analysis),
                      next_lesson: e.target.value,
                    })
                  }
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "8px",
                    fontSize: "14px",
                    width: "100%",
                    resize: "vertical",
                    lineHeight: 1.6,
                    color: "var(--text)",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  className="btn btn-primary"
                  onClick={handleSaveAnalysis}
                  disabled={saving}
                >
                  {saving ? "Збереження..." : "Зберегти редагування"}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={handleReanalyze}
                  disabled={analyzing}
                >
                  {analyzing ? "Аналізується..." : "Перезапустити AI"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function TestEditor({ lessonId }: { lessonId: number }) {
  const [qs, setQs] = useState<
    { q: string; correct: number; opts: string[] }[]
  >([]);
  const [saved, setSaved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    client
      .get(`/api/tests/lesson/${lessonId}`)
      .then((r) => {
        const t = r.data?.[0];
        if (t?.questions)
          setQs(
            t.questions.map((q: any) => ({
              q: q.question ?? q.q ?? "",
              correct: q.correct_index ?? q.correct ?? 0,
              opts: q.options ?? q.opts ?? ["", "", "", ""],
            })),
          );
      })
      .catch(() => {});
  }, [lessonId]);

  const save = async () => {
    try {
      const payload = qs.map((q) => ({
        question: q.q,
        options: q.opts,
        correct_index: q.correct,
        explanation: "",
      }));
      await client.post(`/api/tests/save/${lessonId}`, { questions: payload });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setMsg("Помилка збереження");
    }
  };
  const letters = ["A", "B", "C", "D"];

  const generateFromTranscript = async () => {
    setGenerating(true);
    setMsg("");
    try {
      const { data } = await client.post(`/api/tests/generate/${lessonId}`);
      const items = Array.isArray(data?.questions)
        ? data.questions
        : Array.isArray(data)
          ? data
          : [];
      if (items.length === 0) {
        setMsg("AI повернув порожній результат — перевір транскрипт");
      } else {
        setQs(
          items.map((q: any) => ({
            q: q.question ?? "",
            correct: q.correct_index ?? 0,
            opts: q.options ?? ["", "", "", ""],
          })),
        );
        setMsg("Тест згенеровано з транскрипту");
      }
    } catch (e: any) {
      setMsg("Помилка генерації — перевір AI ключі");
    } finally {
      setGenerating(false);
    }
  };

  if (qs.length === 0)
    return (
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "14px",
          padding: "40px 28px",
          textAlign: "center",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: "10px",
          }}
        >
          Тест ще не створено
        </div>
        <p
          style={{
            fontSize: "15px",
            color: "var(--text-muted)",
            marginBottom: "22px",
            lineHeight: 1.6,
          }}
        >
          Згенеруй тест автоматично на основі транскрипту уроку через AI або
          створи питання вручну
        </p>
        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            className="btn btn-primary"
            onClick={generateFromTranscript}
            disabled={generating}
            style={{ fontSize: "15px" }}
          >
            {generating ? "AI генерує..." : "Згенерувати з транскрипту"}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() =>
              setQs([
                {
                  q: "Нове питання",
                  correct: 0,
                  opts: ["Варіант A", "Варіант B", "Варіант C", "Варіант D"],
                },
              ])
            }
            style={{ fontSize: "15px" }}
          >
            Створити вручну
          </button>
        </div>
        {msg && (
          <div
            style={{
              marginTop: "16px",
              background: msg.includes("Помилка")
                ? "#fee2e2"
                : "var(--primary-10)",
              color: msg.includes("Помилка") ? "#dc2626" : "var(--primary)",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "14px",
            }}
          >
            {msg}
          </div>
        )}
      </div>
    );

  return (
    <div>
      {qs.map((q, qi) => (
        <div
          key={qi}
          style={{
            background: "var(--surface)",
            borderRadius: "14px",
            padding: "22px",
            marginBottom: "14px",
            boxShadow: "var(--shadow-sm)",
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
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--primary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Питання {qi + 1}
            </span>
            <button
              onClick={() => setQs(qs.filter((_, i) => i !== qi))}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--danger)",
                fontSize: "18px",
                lineHeight: 1,
                padding: "2px 8px",
                borderRadius: "6px",
              }}
            >
              ×
            </button>
          </div>
          <input
            value={q.q}
            onChange={(e) => {
              const n = [...qs];
              n[qi] = { ...n[qi], q: e.target.value };
              setQs(n);
            }}
            style={{ marginBottom: "14px", fontSize: "16px", fontWeight: 500 }}
            placeholder="Текст питання"
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            {q.opts.map((opt, oi) => (
              <div
                key={oi}
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  background:
                    q.correct === oi ? "var(--success-bg)" : "var(--surface-2)",
                  borderRadius: "10px",
                  padding: "10px 12px",
                  border:
                    q.correct === oi
                      ? "1.5px solid var(--success)"
                      : "1.5px solid transparent",
                }}
              >
                <button
                  onClick={() => {
                    const n = [...qs];
                    n[qi] = { ...n[qi], correct: oi };
                    setQs(n);
                  }}
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    border:
                      q.correct === oi ? "none" : "2px solid var(--border)",
                    background:
                      q.correct === oi ? "var(--success)" : "transparent",
                    cursor: "pointer",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  {q.correct === oi ? "✓" : letters[oi]}
                </button>
                <input
                  value={opt}
                  onChange={(e) => {
                    const n = [...qs];
                    const o = [...n[qi].opts];
                    o[oi] = e.target.value;
                    n[qi] = { ...n[qi], opts: o };
                    setQs(n);
                  }}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: "0",
                    fontSize: "14px",
                    color: "var(--text)",
                    flex: 1,
                  }}
                  placeholder={`Варіант ${letters[oi]}`}
                />
              </div>
            ))}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              marginTop: "8px",
            }}
          >
            Клікни на кружечок → правильна відповідь
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          className="btn btn-ghost"
          onClick={() =>
            setQs([
              ...qs,
              {
                q: "Нове питання",
                correct: 0,
                opts: ["Варіант A", "Варіант B", "Варіант C", "Варіант D"],
              },
            ])
          }
        >
          + Питання
        </button>
        <button
          className="btn btn-ghost"
          onClick={generateFromTranscript}
          disabled={generating}
        >
          {generating ? "AI генерує..." : "Перегенерувати з транскрипту"}
        </button>
        <button className="btn btn-primary" onClick={save}>
          {saved ? "✓ Збережено" : "Зберегти тест"}
        </button>
      </div>
      {msg && (
        <div
          style={{
            marginTop: "12px",
            background: msg.includes("Помилка")
              ? "#fee2e2"
              : "var(--primary-10)",
            color: msg.includes("Помилка") ? "#dc2626" : "var(--primary)",
            borderRadius: "8px",
            padding: "10px 14px",
            fontSize: "14px",
          }}
        >
          {msg}
        </div>
      )}
    </div>
  );
}

function StudentAnswers({
  lessonId,
  studentId,
  studentName,
}: {
  lessonId: number;
  studentId: number;
  studentName: string;
}) {
  const data = STUDENT_LESSON_ANSWERS[lessonId]?.[studentId];
  const [comment, setComment] = useState("");
  const [saved, setSaved] = useState(false);
  if (!data)
    return (
      <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>
        Даних про відповіді немає
      </p>
    );
  const pct = Math.round((data.correct / data.total) * 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: "12px",
        }}
      >
        {[
          { l: "Відповідей", v: data.total, c: "var(--primary)" },
          { l: "Правильних", v: data.correct, c: "#22c55e" },
          { l: "Результат", v: `${pct}%`, c: cl(pct) },
        ].map((s) => (
          <div
            key={s.l}
            style={{
              background: `${s.c}14`,
              borderRadius: "12px",
              padding: "16px 18px",
              borderLeft: `4px solid ${s.c}`,
            }}
          >
            <div
              style={{
                fontSize: "26px",
                fontWeight: 800,
                color: s.c,
                lineHeight: 1,
              }}
            >
              {s.v}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                fontWeight: 600,
                marginTop: "5px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {s.l}
            </div>
          </div>
        ))}
      </div>

      {}
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "14px",
          padding: "18px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: "15px",
            color: "var(--text)",
            marginBottom: "12px",
          }}
        >
          Відповіді під час уроку
        </div>
        {data.responses.map((r: any, i: number) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "flex-start",
              padding: "9px 0",
              borderBottom:
                i < data.responses.length - 1
                  ? "1px solid var(--border)"
                  : "none",
            }}
          >
            <span
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: r.correct ? "#dcfce7" : "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: "12px",
                fontWeight: 700,
                color: r.correct ? "#16a34a" : "#dc2626",
              }}
            >
              {r.correct ? "✓" : "✗"}
            </span>
            <span
              style={{
                fontSize: "14px",
                color: "var(--text)",
                lineHeight: 1.5,
              }}
            >
              {r.text}
            </span>
          </div>
        ))}
      </div>

      {}
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "14px",
          padding: "18px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: "15px",
            color: "var(--text)",
            marginBottom: "12px",
          }}
        >
          Навички по предмету
        </div>
        {data.skills.map((s: any) => (
          <div key={s.name} style={{ marginBottom: "12px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "14px",
                marginBottom: "5px",
              }}
            >
              <span style={{ color: "var(--text)" }}>{s.name}</span>
              <span style={{ fontWeight: 700, color: cl(s.level) }}>
                {s.level}%
              </span>
            </div>
            <div
              style={{
                height: "8px",
                background: "var(--surface-2)",
                borderRadius: "4px",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${s.level}%`,
                  background: cl(s.level),
                  borderRadius: "4px",
                  transition: "width 600ms ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {}
      <div
        style={{
          background: "var(--primary-10)",
          borderRadius: "14px",
          padding: "18px",
          borderLeft: "4px solid var(--primary)",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--primary)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "8px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {I.ai} AI-коментар
        </div>
        <p style={{ fontSize: "14px", color: "var(--text)", lineHeight: 1.65 }}>
          {data.aiComment}
        </p>
      </div>

      {}
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "14px",
          padding: "18px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: "15px",
            color: "var(--text)",
            marginBottom: "10px",
          }}
        >
          Коментар вчителя
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder={`Персональний коментар для ${studentName}...`}
          style={{ resize: "vertical", fontSize: "14px" }}
        />
        <button
          className="btn btn-primary"
          style={{ marginTop: "10px" }}
          onClick={() => {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
        >
          {saved ? "✓ Надіслано" : "Надіслати учню"}
        </button>
      </div>
    </div>
  );
}

const RESOURCES: Record<
  string,
  { title: string; url: string; desc: string }[]
> = {
  Математика: [
    {
      title: "НМТ Математика — тести",
      url: "https://zno.osvita.ua/mathematics/",
      desc: "Архів завдань ЗНО/НМТ з математики",
    },
    {
      title: "Олімпіадні задачі",
      url: "https://matholymp.com.ua",
      desc: "Завдання математичних олімпіад України",
    },
    {
      title: "Naurok — розробки уроків",
      url: "https://naurok.com.ua/matematika",
      desc: "Готові розробки уроків та презентації",
    },
    {
      title: "Vseosvita — математика",
      url: "https://vseosvita.ua/library/matematika",
      desc: "Конспекти, тести, відеоуроки",
    },
  ],
  "Українська мова": [
    {
      title: "НМТ Укр. мова — тести",
      url: "https://zno.osvita.ua/ukrainian/",
      desc: "Архів завдань ЗНО/НМТ з укр. мови",
    },
    {
      title: "Українська мова онлайн",
      url: "https://mova.info",
      desc: "Словники, правила, довідники",
    },
    {
      title: "Naurok — укр. мова",
      url: "https://naurok.com.ua/ukrainska-mova",
      desc: "Розробки уроків і тести",
    },
    {
      title: "Правопис 2019",
      url: "https://mon.gov.ua/ua/osvita/zagalna-serednya-osvita/navchalni-programi/navchalni-programi-5-9-klas",
      desc: "Актуальний правопис",
    },
  ],
  Фізика: [
    {
      title: "НМТ Фізика — тести",
      url: "https://zno.osvita.ua/physics/",
      desc: "Архів завдань ЗНО/НМТ з фізики",
    },
    {
      title: "Фізика в задачах",
      url: "https://naurok.com.ua/fizika",
      desc: "Задачі різного рівня складності",
    },
    {
      title: "PhET симуляції",
      url: "https://phet.colorado.edu/uk",
      desc: "Інтерактивні симуляції фізичних явищ",
    },
    {
      title: "Vseosvita — фізика",
      url: "https://vseosvita.ua/library/fizika",
      desc: "Конспекти і лабораторні роботи",
    },
  ],
  Біологія: [
    {
      title: "НМТ Біологія — тести",
      url: "https://zno.osvita.ua/biology/",
      desc: "Архів завдань ЗНО/НМТ з біології",
    },
    {
      title: "Атлас анатомії",
      url: "https://www.innerbody.com",
      desc: "Інтерактивний атлас тіла людини",
    },
    {
      title: "Naurok — біологія",
      url: "https://naurok.com.ua/biologiya",
      desc: "Розробки уроків і тести",
    },
  ],
  Інформатика: [
    {
      title: "Код.орг",
      url: "https://code.org/learn",
      desc: "Безкоштовні курси програмування",
    },
    {
      title: "НМТ Інформатика",
      url: "https://zno.osvita.ua/computer-science/",
      desc: "Тести ЗНО/НМТ з інформатики",
    },
    {
      title: "Scratch",
      url: "https://scratch.mit.edu",
      desc: "Візуальне програмування для школярів",
    },
    {
      title: "Naurok — інформатика",
      url: "https://naurok.com.ua/informatika",
      desc: "Розробки уроків",
    },
  ],
  Читання: [
    {
      title: "Казки онлайн",
      url: "https://kazky.me",
      desc: "Дитячі казки для читання",
    },
    {
      title: "Буквар онлайн",
      url: "https://vseosvita.ua/library/ukrainska-mova",
      desc: "Матеріали для навчання грамоти",
    },
    {
      title: "Naurok — читання",
      url: "https://naurok.com.ua/chitannya",
      desc: "Розробки уроків читання",
    },
  ],
};

function getResources(subject: string | null) {
  if (!subject) return [];
  return RESOURCES[subject] ?? [];
}

function OverviewSection({
  teacherSubject,
  onClassClick,
  onLessonClick,
}: {
  teacherSubject: string | null;
  profiles: Record<number, any>;
  isHomeroom: boolean;
  onClassClick: (classId: number) => void;
  onLessonClick: (lessonId: number, classId: number) => void;
}) {
  const { classMap: CLASS_MAP } = useStaticContent();
  const [lessons, setLessons] = useState<any[]>([]);
  const [classes, setClasses] = useState<
    { id: number; name: string; grade: number }[]
  >([]);

  useEffect(() => {
    client
      .get("/api/admin/classes")
      .then((r) => setClasses(r.data ?? []))
      .catch(() => {
        setClasses(Object.values(CLASS_MAP));
      });

    const url =
      "/api/lessons/?" +
      (teacherSubject ? `subject=${encodeURIComponent(teacherSubject)}` : "");
    client
      .get(url)
      .then((r) => setLessons((r.data ?? []).slice(0, 5)))
      .catch(() => {});
  }, [teacherSubject]);

  const resources = getResources(teacherSubject);

  return (
    <div className="fade-in" style={{ position: "relative" }}>
      <NeuroDepth intensity="normal" />
      {}
      <div style={{ marginBottom: "28px", position: "relative", zIndex: 1 }}>
        <h3
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: "14px",
          }}
        >
          Мої класи
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {classes.map((c) => (
            <button
              key={c.id}
              onClick={() => onClassClick(c.id)}
              style={{
                background: "var(--surface)",
                borderRadius: "12px",
                padding: "16px 22px",
                boxShadow: "var(--shadow-sm)",
                borderLeft: "4px solid var(--primary)",
                minWidth: "130px",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                transition: "transform 120ms",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-2px)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
            >
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "var(--primary)",
                }}
              >
                {c.name}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "var(--text-muted)",
                  marginTop: "4px",
                }}
              >
                {c.grade} клас · уроки →
              </div>
            </button>
          ))}
        </div>
      </div>

      {}
      {lessons.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "14px",
            }}
          >
            Останні уроки
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {lessons.map((l) => (
              <div
                key={l.id}
                onClick={() => onLessonClick(l.id, l.class_id)}
                style={{
                  background: "var(--surface)",
                  borderRadius: "12px",
                  padding: "14px 18px",
                  boxShadow: "var(--shadow-sm)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
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
                    {l.subject} ·{" "}
                    {CLASS_MAP[l.class_id]?.name ?? `Клас ${l.class_id}`} ·{" "}
                    {l.date?.slice?.(0, 10) ?? ""}
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
        </div>
      )}

      {}
      {resources.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "14px",
            }}
          >
            Корисні ресурси{teacherSubject ? ` · ${teacherSubject}` : ""}
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
              gap: "12px",
            }}
          >
            {resources.map((r) => (
              <a
                key={r.url}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: "var(--surface)",
                  borderRadius: "12px",
                  padding: "16px 18px",
                  boxShadow: "var(--shadow-sm)",
                  display: "block",
                  textDecoration: "none",
                  borderLeft: "4px solid var(--primary)",
                  transition: "box-shadow 150ms",
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
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "var(--primary)",
                    marginBottom: "4px",
                  }}
                >
                  {r.title}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--text-muted)",
                    lineHeight: 1.5,
                  }}
                >
                  {r.desc}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {}
      {[
        "Математика",
        "Українська мова",
        "Фізика",
        "Біологія",
        "Інформатика",
      ].includes(teacherSubject ?? "") && (
        <div
          style={{
            background: "var(--primary-10)",
            borderRadius: "14px",
            padding: "20px 22px",
            borderLeft: "5px solid var(--primary)",
          }}
        >
          <div
            style={{
              fontSize: "17px",
              fontWeight: 700,
              color: "var(--primary)",
              marginBottom: "8px",
            }}
          >
            Підготовка до НМТ
          </div>
          <p
            style={{
              fontSize: "15px",
              color: "var(--text)",
              lineHeight: 1.7,
              marginBottom: "12px",
            }}
          >
            Для учнів 9–11 класів: використовуй завдання з архіву ЗНО/НМТ для
            підготовки. Офіційний портал — testportal.gov.ua.
          </p>
          <a
            href="https://testportal.gov.ua"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{
              fontSize: "15px",
              textDecoration: "none",
              display: "inline-flex",
            }}
          >
            Перейти на testportal.gov.ua →
          </a>
        </div>
      )}
    </div>
  );
}

function CreateLessonPage({
  onClose,
  teacherSubject,
}: {
  onClose: () => void;
  teacherSubject: string | null;
}) {
  const [form, setForm] = useState({
    topic: "",
    subject: teacherSubject ?? "",
    classId: "6",
    contentType: "transcript" as "transcript" | "video",
  });
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async () => {
    if (!form.topic.trim()) {
      setMsg("Введи тему уроку");
      return;
    }
    setSaving(true);
    try {
      const { data } = await client.post("/api/lessons/", {
        class_id: Number(form.classId),
        subject: form.subject || teacherSubject || "Загальне",
        topic: form.topic,
      });
      if (form.contentType === "transcript" && content.trim()) {
        await client.patch(`/api/lessons/${data.id}/transcript`, {
          transcript: content,
        });
      }
      if (form.contentType === "video" && file) {
        const fd = new FormData();
        fd.append("file", file);
        await client.post(`/api/lessons/${data.id}/upload`, fd);
        setMsg("Відео завантажено! Транскрипт генерується у фоні...");
      }
      setMsg("✓ Урок створено!");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch {
      setMsg("Помилка створення уроку");
    }
    setSaving(false);
  };

  return (
    <div className="fade-in" style={{ maxWidth: "720px", margin: "0 auto" }}>
      <button
        onClick={onClose}
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
        ← Назад до уроків
      </button>
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "14px",
          padding: "32px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: "24px",
          }}
        >
          Новий урок
        </h2>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: "8px",
            }}
          >
            Тема уроку
          </label>
          <input
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            placeholder="Наприклад: Похідна функції"
            style={{ fontSize: "16px" }}
          />
        </div>

        {!teacherSubject && (
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: "8px",
              }}
            >
              Предмет
            </label>
            <input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Математика, Фізика..."
              style={{ fontSize: "16px" }}
            />
          </div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: "8px",
            }}
          >
            Клас
          </label>
          <select
            value={form.classId}
            onChange={(e) => setForm({ ...form, classId: e.target.value })}
            style={{ fontSize: "16px" }}
          >
            {[
              { id: "1", n: "1А" },
              { id: "2", n: "1Б" },
              { id: "3", n: "5А" },
              { id: "4", n: "5Б" },
              { id: "5", n: "9А" },
              { id: "6", n: "10А" },
              { id: "7", n: "10Б" },
              { id: "8", n: "11А" },
            ].map((c) => (
              <option key={c.id} value={c.id}>
                {c.n}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: "10px",
            }}
          >
            Тип контенту
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            {(
              [
                { k: "transcript", l: "Транскрипт" },
                { k: "video", l: "Відео" },
              ] as const
            ).map((t) => (
              <button
                key={t.k}
                type="button"
                onClick={() => setForm({ ...form, contentType: t.k as any })}
                style={{
                  flex: 1,
                  padding: "12px 8px",
                  borderRadius: "9px",
                  border: `2px solid ${form.contentType === t.k ? "var(--primary)" : "var(--border)"}`,
                  background:
                    form.contentType === t.k
                      ? "var(--primary-10)"
                      : "var(--surface-2)",
                  color:
                    form.contentType === t.k
                      ? "var(--primary)"
                      : "var(--text-muted)",
                  fontWeight: form.contentType === t.k ? 700 : 500,
                  fontSize: "15px",
                  cursor: "pointer",
                  transition: "all 150ms",
                  lineHeight: 1.4,
                }}
              >
                {t.l}
              </button>
            ))}
          </div>
        </div>

        {form.contentType === "transcript" && (
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: "8px",
              }}
            >
              Транскрипт або план уроку
            </label>
            <textarea
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Введи текст уроку, конспект або план..."
              style={{ fontSize: "15px", lineHeight: 1.6, resize: "vertical" }}
            />
          </div>
        )}
        {form.contentType === "video" && (
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: "8px",
              }}
            >
              Відео файл (mp4, до 45 хв)
            </label>
            {}
            <label
              htmlFor="lesson-video-file"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "16px 18px",
                border: `1.5px dashed ${file ? "var(--primary)" : "rgba(0, 230, 200, 0.30)"}`,
                borderRadius: "14px",
                background: file
                  ? "rgba(0, 230, 200, 0.07)"
                  : "rgba(0, 230, 200, 0.03)",
                cursor: "pointer",
                transition: "all 180ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--primary)";
                e.currentTarget.style.background = "rgba(0, 230, 200, 0.07)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = file
                  ? "var(--primary)"
                  : "rgba(0, 230, 200, 0.30)";
                e.currentTarget.style.background = file
                  ? "rgba(0, 230, 200, 0.07)"
                  : "rgba(0, 230, 200, 0.03)";
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  background:
                    "linear-gradient(135deg, var(--primary), var(--primary-hover))",
                  color: "#050507",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  boxShadow: "0 0 18px rgba(0, 230, 200, 0.30)",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ width: 14, height: 14 }}
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Обрати файл
              </span>
              <span
                style={{
                  fontSize: "14px",
                  color: file ? "var(--text)" : "var(--text-muted)",
                  fontWeight: file ? 600 : 400,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {file ? file.name : "Файл не обраний"}
              </span>
              <input
                id="lesson-video-file"
                type="file"
                accept="video/*,audio/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                style={{ display: "none" }}
              />
            </label>
          </div>
        )}

        {msg && (
          <div
            style={{
              background: msg.includes("Помилка") ? "#fee2e2" : "#dcfce7",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "14px",
              color: msg.includes("Помилка") ? "#dc2626" : "#166534",
              marginBottom: "12px",
            }}
          >
            {msg}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={saving}
            style={{ flex: 1, fontSize: "16px", padding: "14px" }}
          >
            {saving ? "Створення..." : "Створити урок"}
          </button>
          <button
            className="btn btn-ghost"
            onClick={onClose}
            style={{ fontSize: "16px", padding: "14px 20px" }}
          >
            Скасувати
          </button>
        </div>
      </div>
    </div>
  );
}

function LessonsSection({
  teacherSubject,
  isHomeroom: _ih,
  forcedClass,
  focusLessonId,
  initialTab,
  onConsumed,
}: {
  teacherSubject: string | null;
  isHomeroom: boolean;
  forcedClass: number | null;
  focusLessonId: number | null;
  initialTab?: "media" | "test" | "students";
  onConsumed: () => void;
}) {
  const { classMap: CLASS_MAP } = useStaticContent();
  const allClassIds = Object.keys(CLASS_MAP).map(Number);
  const [cls, setCls] = useState<number>(allClassIds[0] ?? 6);

  useEffect(() => {
    if (forcedClass !== null) {
      setCls(forcedClass);
      onConsumed();
    }
  }, [forcedClass, onConsumed]);
  const [apiLessons, setApiLessons] = useState<any[]>([]);
  const [sel, setSel] = useState<any | null>(null);
  const [lessonTab, setLessonTab] = useState<"media" | "test" | "students">(
    initialTab ?? "media",
  );
  const [selStudent, setSelStudent] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const loadLessons = useCallback(() => {
    let url = `/api/lessons/?class_id=${cls}`;
    if (teacherSubject) url += `&subject=${encodeURIComponent(teacherSubject)}`;
    client
      .get(url)
      .then((r) => setApiLessons(r.data ?? []))
      .catch(() => {});
  }, [cls, teacherSubject]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  useEffect(() => {
    if (focusLessonId == null) return;
    const found = apiLessons.find((l) => l.id === focusLessonId);
    if (found) {
      setSel(found);
      if (initialTab) setLessonTab(initialTab);
      onConsumed();
    }
  }, [focusLessonId, apiLessons, initialTab, onConsumed]);

  const visible = apiLessons;
  const { user: authUser, logout: authLogout } = useAuth();

  if (sel)
    return (
      <NeuroLessonView
        lesson={sel}
        className={CLASS_MAP[sel.class_id]?.name}
        onBack={() => {
          setSel(null);
          setSelStudent(null);
        }}
        user={{
          full_name: authUser?.full_name,
          subject: authUser?.subject ?? null,
        }}
        onLogout={authLogout}
        activeNav="lessons"
      />
    );

  if (showCreate)
    return (
      <CreateLessonPage
        onClose={() => {
          setShowCreate(false);
          loadLessons();
        }}
        teacherSubject={teacherSubject}
      />
    );

  return (
    <div className="fade-in">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "18px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {allClassIds.map((id) => (
            <button
              key={id}
              onClick={() => setCls(id)}
              className={cls === id ? "btn btn-primary" : "btn btn-ghost"}
              style={{ fontSize: "15px", padding: "8px 16px" }}
            >
              {CLASS_MAP[id]?.name ?? id}
            </button>
          ))}
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreate(true)}
          style={{ fontSize: "16px" }}
        >
          + Створити урок
        </button>
      </div>

      {visible.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "16px" }}>
          Уроків немає
        </p>
      ) : (
        visible.map((l) => (
          <div
            key={l.id}
            onClick={() => setSel(l)}
            style={{
              background: "var(--surface)",
              borderRadius: "12px",
              padding: "17px 20px",
              cursor: "pointer",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              borderLeft: `4px solid ${cl(l.avg_engagement ?? l.engagement ?? 60)}`,
              marginBottom: "10px",
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
                  marginBottom: "3px",
                }}
              >
                {l.topic ?? l.subject}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  marginBottom: "8px",
                }}
              >
                {l.subject} · {CLASS_MAP[l.class_id]?.name ?? l.className ?? ""}{" "}
                · {l.date?.slice?.(0, 10) ?? ""}
              </div>
              <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
                {(l.key_terms ?? l.tags ?? []).map((t: string) => (
                  <span
                    key={t}
                    style={{
                      background: "var(--primary-10)",
                      color: "var(--primary)",
                      padding: "3px 11px",
                      borderRadius: "99px",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div
              style={{ textAlign: "right", flexShrink: 0, marginLeft: "14px" }}
            >
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  color: cl(l.avg_engagement ?? l.testScore ?? 60),
                }}
              >
                {Math.round(l.avg_engagement ?? l.testScore ?? 0)}%
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                тест
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function SensorCard({
  lessonId,
  compact = false,
}: {
  lessonId: number;
  compact?: boolean;
}) {
  const [s, setS] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [audioEvents, setAudioEvents] = useState<any[]>([]);
  const [showAudio, setShowAudio] = useState(false);
  useEffect(() => {
    setLoading(true);
    Promise.all([
      client
        .get(`/api/lessons/${lessonId}/sensors`)
        .then((r) => r.data)
        .catch(() => null),
      client
        .get(`/api/lessons/${lessonId}/audio_events`)
        .then((r) => r.data ?? [])
        .catch(() => []),
    ])
      .then(([sens, ae]) => {
        setS(sens);
        setAudioEvents(ae);
      })
      .finally(() => setLoading(false));
  }, [lessonId]);
  if (loading) return null;
  if (!s) return null;
  const tempColor =
    s.avg_temperature != null
      ? s.avg_temperature < 20 || s.avg_temperature > 24
        ? "#ef4444"
        : "#22c55e"
      : "var(--text-muted)";
  const humColor =
    s.avg_humidity != null
      ? s.avg_humidity < 40 || s.avg_humidity > 60
        ? "#f59e0b"
        : "#22c55e"
      : "var(--text-muted)";
  const tip = (txt: string) => txt;
  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: "14px",
        padding: compact ? "14px 18px" : "20px",
        boxShadow: "var(--shadow-sm)",
        marginBottom: "18px",
      }}
    >
      <div
        style={{
          fontSize: "15px",
          fontWeight: 700,
          color: "var(--text)",
          marginBottom: "12px",
        }}
      >
        Дані класу
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "10px",
          marginBottom: s.attention_timeline?.length > 0 ? "14px" : 0,
        }}
      >
        {s.avg_attention != null && (
          <div
            title={tip("Джерело: термокамера (мапа уваги класу)")}
            style={{
              background: `${cl(s.avg_attention)}14`,
              borderRadius: "10px",
              padding: "12px 14px",
              borderLeft: `3px solid ${cl(s.avg_attention)}`,
              cursor: "help",
            }}
          >
            <div
              style={{
                fontSize: "19px",
                fontWeight: 800,
                color: cl(s.avg_attention),
              }}
            >
              {s.avg_attention}%
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                fontWeight: 600,
                marginTop: "3px",
                textTransform: "uppercase",
              }}
            >
              Сер. увага
            </div>
          </div>
        )}
        {s.avg_temperature != null && (
          <div
            title={tip("Джерело: термостат")}
            style={{
              background: `${tempColor}14`,
              borderRadius: "10px",
              padding: "12px 14px",
              borderLeft: `3px solid ${tempColor}`,
              cursor: "help",
            }}
          >
            <div
              style={{ fontSize: "19px", fontWeight: 800, color: tempColor }}
            >
              {s.avg_temperature}°C
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                fontWeight: 600,
                marginTop: "3px",
                textTransform: "uppercase",
              }}
            >
              Температура
            </div>
          </div>
        )}
        {s.avg_humidity != null && (
          <div
            title={tip("Джерело: гігрометр")}
            style={{
              background: `${humColor}14`,
              borderRadius: "10px",
              padding: "12px 14px",
              borderLeft: `3px solid ${humColor}`,
              cursor: "help",
            }}
          >
            <div style={{ fontSize: "19px", fontWeight: 800, color: humColor }}>
              {s.avg_humidity}%
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                fontWeight: 600,
                marginTop: "3px",
                textTransform: "uppercase",
              }}
            >
              Вологість
            </div>
          </div>
        )}
        <div
          title={tip("Джерело: мікрофон (питання, відповіді, гучний шум)")}
          onClick={() => setShowAudio((v) => !v)}
          style={{
            background: "var(--primary-10)",
            borderRadius: "10px",
            padding: "12px 14px",
            borderLeft: "3px solid var(--primary)",
            cursor: "pointer",
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: "19px",
              fontWeight: 800,
              color: "var(--primary)",
            }}
          >
            {s.audio_events_count ?? 0}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              fontWeight: 600,
              marginTop: "3px",
              textTransform: "uppercase",
            }}
          >
            Голосових подій {showAudio ? "▴" : "▾"}
          </div>
        </div>
      </div>
      {s.attention_timeline?.length > 0 && (
        <div
          title={tip("Джерело: термокамера — динаміка уваги впродовж уроку")}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-muted)",
              marginBottom: "6px",
            }}
          >
            Увага класу впродовж уроку
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "3px",
              height: "60px",
            }}
          >
            {s.attention_timeline.map((v: number, i: number) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${Math.max(4, v * 0.6)}px`,
                  background: cl(v),
                  borderRadius: "3px 3px 0 0",
                }}
                title={`${v}%`}
              />
            ))}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11px",
              color: "var(--text-muted)",
              marginTop: "4px",
            }}
          >
            <span>початок</span>
            <span>середина</span>
            <span>кінець</span>
          </div>
        </div>
      )}
      {}
      {showAudio && audioEvents.length > 0 && (
        <div
          title={tip("Джерело: мікрофон")}
          style={{
            marginTop: "14px",
            background: "var(--surface-2)",
            borderRadius: "10px",
            padding: "12px 14px",
            maxHeight: "260px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--text-muted)",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Деталізація — {audioEvents.length} подій
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {audioEvents.map((ev: any, i: number) => {
              const typeMap: Record<string, { l: string; c: string }> = {
                answer: { l: "Відповідь", c: "#22c55e" },
                question: { l: "Питання", c: "#0284c7" },
                noise: { l: "Шум", c: "#f59e0b" },
              };
              const t = typeMap[ev.type] ?? {
                l: ev.type,
                c: "var(--text-muted)",
              };
              const time = ev.timestamp
                ? new Date(ev.timestamp).toLocaleTimeString("uk-UA", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—";
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "7px 10px",
                    background: "var(--surface)",
                    borderRadius: "7px",
                    fontSize: "13px",
                  }}
                >
                  <span
                    style={{ color: "var(--text-muted)", minWidth: "56px" }}
                  >
                    {time}
                  </span>
                  <span
                    style={{
                      background: `${t.c}18`,
                      color: t.c,
                      padding: "2px 9px",
                      borderRadius: "99px",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {t.l}
                  </span>
                  <span style={{ color: "var(--text)", minWidth: "100px" }}>
                    учень №{ev.student_id ?? "?"}
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>
                    гучність {Math.round((ev.volume ?? 0) * 100)}%
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>
                    {ev.duration_sec ?? 0} сек
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {s.video_keywords?.length > 0 && !compact && (
        <div
          title={tip("Джерело: камера (розпізнане мовлення)")}
          style={{ marginTop: "14px", cursor: "help" }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-muted)",
              marginBottom: "6px",
            }}
          >
            Ключові слова з камери
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {s.video_keywords.slice(0, 12).map((k: string, i: number) => (
              <span
                key={i}
                style={{
                  background: "var(--surface-2)",
                  color: "var(--text)",
                  padding: "3px 10px",
                  borderRadius: "99px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LessonAnalytics({
  lessonId,
  fallbackScores: _fb,
}: {
  lessonId: number;
  fallbackScores: Record<number, number> | undefined;
}) {
  const { allStudents: MOCK_STUDENTS } = useStaticContent();
  const [data, setData] = useState<any>(null);
  const [studentResults, setStudentResults] = useState<
    { student: any; score: number; answers: any; testQuestions: any[] }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [reviewItem, setReviewItem] = useState<any | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      client
        .get(`/api/tests/lesson/${lessonId}/analytics`)
        .catch(() => ({ data: { has_data: false } })),
      client.get(`/api/tests/lesson/${lessonId}`).catch(() => ({ data: [] })),
    ])
      .then(async ([anal, tests]) => {
        setData(anal.data);

        const results: {
          student: any;
          score: number;
          answers: any;
          testQuestions: any[];
        }[] = [];
        const testList = tests.data ?? [];
        for (const s of MOCK_STUDENTS) {
          try {
            const r = await client.get(`/api/students/${s.id}/results`);
            (r.data ?? []).forEach((res: any) => {
              const t = testList.find((tt: any) => tt.id === res.test_id);
              if (t)
                results.push({
                  student: s,
                  score: res.score,
                  answers: res.answers,
                  testQuestions: t.questions,
                });
            });
          } catch {}
        }
        setStudentResults(results);
      })
      .finally(() => setLoading(false));
  }, [lessonId, MOCK_STUDENTS]);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "30px" }}>
        <span className="spinner" />
      </div>
    );

  const hasReal = data?.has_data;
  const hasFallback = _fb && Object.keys(_fb).length > 0;

  if (reviewItem) {
    const r = reviewItem;
    const grade12 = Math.max(1, Math.min(12, Math.round((r.score * 12) / 100)));
    const cl12 =
      grade12 >= 10
        ? "#22c55e"
        : grade12 >= 7
          ? "#f59e0b"
          : grade12 >= 4
            ? "#fb923c"
            : "#ef4444";
    return (
      <div className="fade-in">
        <button
          onClick={() => setReviewItem(null)}
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
          ← Назад до результатів
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "22px",
          }}
        >
          <div
            style={{
              width: "54px",
              height: "54px",
              borderRadius: "50%",
              background: `${cl12}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              color: cl12,
              fontSize: "22px",
            }}
          >
            {r.student.name.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--text)",
              }}
            >
              {r.student.name}
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                marginTop: "2px",
              }}
            >
              Клас {r.student.className} · результат теста
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "36px",
                fontWeight: 800,
                color: cl12,
                lineHeight: 1,
              }}
            >
              {grade12}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginTop: "3px",
              }}
            >
              з 12
            </div>
          </div>
        </div>

        {}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {r.testQuestions.map((q: any, qi: number) => {
            const chosen = r.answers?.[String(qi)];
            const correct = q.correct_index;
            const isRight = chosen === correct;
            return (
              <div
                key={qi}
                style={{
                  background: "var(--surface)",
                  borderRadius: "12px",
                  padding: "18px",
                  boxShadow: "var(--shadow-sm)",
                  borderLeft: `4px solid ${isRight ? "#22c55e" : "#ef4444"}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Питання {qi + 1}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: isRight ? "#22c55e" : "#ef4444",
                    }}
                  >
                    {isRight ? "✓ Правильно" : "✗ Помилка"}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "var(--text)",
                    marginBottom: "12px",
                  }}
                >
                  {q.question}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {q.options.map((opt: string, oi: number) => {
                    const isCorrect = oi === correct;
                    const isChosen = oi === chosen;
                    let bg = "var(--surface-2)";
                    let border = "transparent";
                    let co = "var(--text)";
                    if (isCorrect) {
                      bg = "var(--success-bg)";
                      border = "#22c55e";
                      co = "#16a34a";
                    } else if (isChosen) {
                      bg = "var(--danger-bg)";
                      border = "#ef4444";
                      co = "#dc2626";
                    }
                    return (
                      <div
                        key={oi}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: `1.5px solid ${border}`,
                          background: bg,
                          color: co,
                          fontSize: "15px",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            opacity: 0.7,
                            minWidth: "22px",
                          }}
                        >
                          {String.fromCharCode(65 + oi)}.
                        </span>
                        <span style={{ flex: 1 }}>{opt}</span>
                        {isCorrect && (
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: "#16a34a",
                            }}
                          >
                            правильна
                          </span>
                        )}
                        {isChosen && !isCorrect && (
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: "#dc2626",
                            }}
                          >
                            обрав учень
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {q.explanation && (
                  <div
                    style={{
                      marginTop: "10px",
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      fontStyle: "italic",
                      background: "var(--primary-10)",
                      padding: "8px 12px",
                      borderRadius: "6px",
                    }}
                  >
                    💡 {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (!hasReal && !hasFallback) {
    return (
      <div
        style={{
          background: "var(--surface-2)",
          borderRadius: "14px",
          padding: "40px 28px",
          textAlign: "center",
          color: "var(--text-muted)",
        }}
      >
        <div style={{ fontSize: "17px", fontWeight: 600, marginBottom: "8px" }}>
          Упс, аналітика недоступна
        </div>
        <p style={{ fontSize: "14px", lineHeight: 1.6 }}>
          Жоден учень ще не здав тест по цьому уроку.
          <br />
          Коли учні почнуть здавати — тут з'являться реальні дані.
        </p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {hasReal && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          {[
            { l: "Здали тест", v: data.total_submissions, c: "var(--primary)" },
            {
              l: "Середній бал",
              v: `${data.average_grade_12}/12`,
              c: cl(data.average_score),
            },
          ].map((s) => (
            <div
              key={s.l}
              style={{
                background: `${s.c.startsWith("#") || s.c.startsWith("rgb") ? s.c : "var(--primary)"}14`,
                borderRadius: "12px",
                padding: "16px",
                borderLeft: `4px solid ${s.c}`,
              }}
            >
              <div style={{ fontSize: "22px", fontWeight: 800, color: s.c }}>
                {s.v}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  marginTop: "4px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                {s.l}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasReal && (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "14px",
            padding: "20px",
            boxShadow: "var(--shadow-sm)",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "12px",
            }}
          >
            Розподіл оцінок (12-бальна)
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "4px",
              height: "100px",
            }}
          >
            {Object.entries(data.distribution).map(([g, n]) => {
              const num = Number(n);
              const max = Math.max(
                ...Object.values(data.distribution).map(Number),
              );
              const h = max ? Math.max(4, (num / max) * 90) : 4;
              const c =
                Number(g) >= 10
                  ? "#22c55e"
                  : Number(g) >= 7
                    ? "#f59e0b"
                    : Number(g) >= 4
                      ? "#fb923c"
                      : "#ef4444";
              return (
                <div
                  key={g}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: num > 0 ? c : "var(--text-muted)",
                    }}
                  >
                    {num || ""}
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: `${h}px`,
                      background: num > 0 ? c : "var(--border)",
                      borderRadius: "4px 4px 0 0",
                    }}
                  />
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {g}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {}

      {}
      <div
        style={{
          fontSize: "15px",
          fontWeight: 700,
          color: "var(--text)",
          marginBottom: "12px",
        }}
      >
        Результати учнів
      </div>
      {studentResults.length === 0 ? (
        <div
          style={{
            background: "var(--surface-2)",
            borderRadius: "12px",
            padding: "24px",
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "15px",
          }}
        >
          Жоден учень ще не пройшов тест
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {studentResults
            .sort((a, b) => a.student.name.localeCompare(b.student.name, "uk"))
            .map(({ student: s, score, answers, testQuestions }) => {
              const grade12 = Math.max(
                1,
                Math.min(12, Math.round((score * 12) / 100)),
              );
              const cl12 =
                grade12 >= 10
                  ? "#22c55e"
                  : grade12 >= 7
                    ? "#f59e0b"
                    : grade12 >= 4
                      ? "#fb923c"
                      : "#ef4444";
              return (
                <div
                  key={s.id}
                  onClick={() =>
                    setReviewItem({ student: s, score, answers, testQuestions })
                  }
                  style={{
                    background: "var(--surface)",
                    borderRadius: "12px",
                    padding: "14px 18px",
                    cursor: "pointer",
                    boxShadow: "var(--shadow-sm)",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    transition: "box-shadow 150ms",
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
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: `${cl12}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      color: cl12,
                      fontSize: "15px",
                      flexShrink: 0,
                    }}
                  >
                    {s.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "var(--text)",
                      }}
                    >
                      {s.name}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        marginTop: "2px",
                      }}
                    >
                      Клас {s.className} · клікни для перегляду відповідей
                    </div>
                  </div>
                  <div
                    style={{ fontSize: "22px", fontWeight: 800, color: cl12 }}
                  >
                    {grade12}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    з 12
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

function StudentLessonsDetail({
  studentId,
  studentName,
  lessons,
}: {
  studentId: number;
  studentName: string;
  lessons: any[];
}) {
  const [selL, setSelL] = useState<any | null>(null);
  const [comments, setComments] = useState<Record<number, string>>({});
  const [savedFor, setSavedFor] = useState<number | null>(null);

  const sortedLessons = lessons.sort((a, b) =>
    String(b.date).localeCompare(String(a.date)),
  );

  if (selL) {
    const score = selL.studentScores?.[studentId] ?? 0;
    const ld = STUDENT_LESSON_ANSWERS[selL.id]?.[studentId];
    const grade12 = Math.max(1, Math.min(12, Math.round((score * 12) / 100)));
    const cl12 =
      grade12 >= 10
        ? "#22c55e"
        : grade12 >= 7
          ? "#f59e0b"
          : grade12 >= 4
            ? "#fb923c"
            : "#ef4444";
    const c = comments[selL.id] ?? "";
    return (
      <div className="fade-in">
        <button
          onClick={() => setSelL(null)}
          style={{
            background: "none",
            border: "none",
            color: "var(--primary)",
            fontWeight: 600,
            fontSize: "15px",
            cursor: "pointer",
            marginBottom: "14px",
            padding: 0,
          }}
        >
          ← Назад до уроків
        </button>
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "14px",
            padding: "22px",
            marginBottom: "14px",
            boxShadow: "var(--shadow-sm)",
            borderTop: `4px solid ${cl12}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "6px",
                }}
              >
                Урок · {selL.date?.slice?.(0, 10) ?? selL.date ?? ""}
              </div>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "var(--text)",
                }}
              >
                {selL.topic ?? selL.subject}
              </h3>
              <div
                style={{
                  fontSize: "14px",
                  color: "var(--text-muted)",
                  marginTop: "4px",
                }}
              >
                {selL.subject}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "36px",
                  fontWeight: 800,
                  color: cl12,
                  lineHeight: 1,
                }}
              >
                {grade12}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  fontWeight: 600,
                  marginTop: "4px",
                }}
              >
                з 12
              </div>
            </div>
          </div>
        </div>

        {ld ? (
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "14px",
              padding: "22px",
              marginBottom: "14px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: "12px",
              }}
            >
              Відповіді на тест ({ld.correct}/{ld.total} правильних)
            </div>
            {ld.responses.map((r: any, i: number) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "12px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: r.correct
                    ? "var(--success-bg)"
                    : "var(--danger-bg)",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    fontWeight: 700,
                    color: r.correct ? "#22c55e" : "#ef4444",
                  }}
                >
                  {r.correct ? "✓" : "✗"}
                </span>
                <span style={{ fontSize: "14px", color: "var(--text)" }}>
                  {r.text}
                </span>
              </div>
            ))}
            {ld.aiComment && (
              <div
                style={{
                  marginTop: "14px",
                  background: "var(--primary-10)",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  borderLeft: "3px solid var(--primary)",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--primary)",
                    textTransform: "uppercase",
                    marginBottom: "4px",
                  }}
                >
                  AI-коментар
                </div>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--text)",
                    lineHeight: 1.6,
                  }}
                >
                  {ld.aiComment}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              background: "var(--surface-2)",
              borderRadius: "10px",
              padding: "16px 20px",
              marginBottom: "14px",
              fontSize: "14px",
              color: "var(--text-muted)",
            }}
          >
            Детальні відповіді по цьому учню недоступні (даних від датчиків ще
            немає)
          </div>
        )}

        {}
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
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "10px",
            }}
          >
            Коментар для {studentName}
          </div>
          <textarea
            rows={3}
            value={c}
            onChange={(e) =>
              setComments({ ...comments, [selL.id]: e.target.value })
            }
            placeholder="Напиши побажання або зауваження по роботі на уроці..."
            style={{ fontSize: "15px", lineHeight: 1.6, resize: "vertical" }}
          />
          <button
            className="btn btn-primary"
            style={{ marginTop: "10px" }}
            onClick={() => {
              setSavedFor(selL.id);
              setTimeout(() => setSavedFor(null), 2000);
            }}
          >
            {savedFor === selL.id ? "✓ Надіслано учню" : "Надіслати учню"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          fontSize: "16px",
          fontWeight: 700,
          color: "var(--text)",
          marginBottom: "12px",
        }}
      >
        Уроки і тести
      </div>
      {sortedLessons.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>
          Уроків для цього учня поки немає
        </p>
      ) : (
        sortedLessons.map((l) => {
          const score = l.studentScores?.[studentId] ?? 0;
          const grade12 = score
            ? Math.max(1, Math.min(12, Math.round((score * 12) / 100)))
            : 0;
          const cl12 =
            grade12 >= 10
              ? "#22c55e"
              : grade12 >= 7
                ? "#f59e0b"
                : grade12 >= 4
                  ? "#fb923c"
                  : "#ef4444";
          const ld = STUDENT_LESSON_ANSWERS[l.id]?.[studentId];
          return (
            <div
              key={l.id}
              onClick={() => setSelL(l)}
              style={{
                background: "var(--surface)",
                borderRadius: "12px",
                padding: "15px 18px",
                marginBottom: "10px",
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "14px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "var(--text)",
                    }}
                  >
                    {l.topic ?? l.subject}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      marginTop: "3px",
                    }}
                  >
                    {l.subject} · {l.date?.slice?.(0, 10) ?? l.date ?? ""}
                  </div>
                  {ld && (
                    <div
                      style={{ display: "flex", gap: "12px", marginTop: "8px" }}
                    >
                      <span
                        style={{ fontSize: "12px", color: "var(--text-muted)" }}
                      >
                        Відповідав: <strong>{ld.total}</strong>
                      </span>
                      <span style={{ fontSize: "12px", color: "#22c55e" }}>
                        ✓ {ld.correct}
                      </span>
                      <span style={{ fontSize: "12px", color: "#ef4444" }}>
                        ✗ {ld.total - ld.correct}
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "center" }}>
                  {grade12 ? (
                    <>
                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: 800,
                          color: cl12,
                          lineHeight: 1,
                        }}
                      >
                        {grade12}
                      </div>
                      <div
                        style={{ fontSize: "11px", color: "var(--text-muted)" }}
                      >
                        з 12
                      </div>
                    </>
                  ) : (
                    <span
                      style={{ fontSize: "13px", color: "var(--text-muted)" }}
                    >
                      —
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function StudentsSection({
  classId,
  profiles,
  teacherSubject: _ts,
}: {
  classId: number;
  profiles: Record<number, any>;
  teacherSubject: string | null;
}) {
  const { allStudents: MOCK_STUDENTS, classMap: CLASS_MAP } =
    useStaticContent();
  const [cls, setCls] = useState(classId);
  const [sel, setSel] = useState<number | null>(null);
  const [aiAdvice, setAiAdvice] = useState<{
    loading: boolean;
    text: string;
    error: string;
  }>({ loading: false, text: "", error: "" });
  const students = MOCK_STUDENTS.filter((s) => s.classId === cls);
  const s = MOCK_STUDENTS.find((x) => x.id === sel);
  const p = sel ? profiles[sel] : null;

  useEffect(() => {
    if (!sel) {
      setAiAdvice({ loading: false, text: "", error: "" });
      return;
    }
    setAiAdvice({ loading: true, text: "", error: "" });
    client
      .post(`/api/students/${sel}/ai_advice`)
      .then((r) => {
        setAiAdvice({ loading: false, text: r.data?.advice ?? "", error: "" });
      })
      .catch((e) => {
        setAiAdvice({
          loading: false,
          text: "",
          error: e?.response?.data?.detail ?? "Не вдалося отримати пораду",
        });
      });
  }, [sel]);

  const recommendation = (() => {
    if (!p) return null;
    const k = p.knowledge_level ?? 50;
    const e = p.engagement_score ?? 50;
    const pace = p.learning_pace;
    if (k < 50 && e < 50)
      return {
        tone: "#ef4444",
        text: "Учень має проблеми і з матеріалом, і з залученістю. Рекомендується індивідуальна розмова, повторення базових тем, простіші завдання, посилений зворотний зв'язок.",
      };
    if (k < 50)
      return {
        tone: "#f59e0b",
        text: "Слабкі знання, але залученість непогана. Поверніться до основ теми, дайте простіші тестові завдання, попросіть пояснити своїми словами.",
      };
    if (e < 50)
      return {
        tone: "#f59e0b",
        text: "Знання нормальні, але учень неуважний. Підключайте інтереси (хобі), задавайте йому персональні питання на уроці, давайте ролі (помічник).",
      };
    if (pace === "slow")
      return {
        tone: "#0284c7",
        text: "Повільний темп — це нормально. Дайте більше часу на завдання, не квапте, забезпечте детальніші пояснення з прикладами.",
      };
    if (pace === "fast" && k >= 75)
      return {
        tone: "#22c55e",
        text: "Сильний учень з швидким темпом — давайте більш складні задачі, дослідницькі проєкти, можливо роль помічника-консультанта для слабших.",
      };
    if (k >= 75)
      return {
        tone: "#22c55e",
        text: "Стабільно високий рівень. Продовжуйте у тому ж дусі, додавайте челенджі для росту.",
      };
    return {
      tone: "#0284c7",
      text: "Середні показники. Утримуйте темп, фокусуйтеся на закріпленні нових тем через практику.",
    };
  })();

  return (
    <div className="fade-in">
      {sel ? (
        <>
          <button
            onClick={() => setSel(null)}
            style={{
              background: "none",
              border: "none",
              color: "var(--primary)",
              fontWeight: 600,
              fontSize: "15px",
              cursor: "pointer",
              marginBottom: "16px",
              padding: 0,
            }}
          >
            ← Назад
          </button>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "22px",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "var(--primary-10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: 700,
                color: "var(--primary)",
              }}
            >
              {s?.name.charAt(0)}
            </div>
            <div>
              <div
                style={{
                  fontSize: "21px",
                  fontWeight: 700,
                  color: "var(--text)",
                }}
              >
                {s?.name}
              </div>
              <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                Клас {s?.className}
              </div>
            </div>
          </div>
          {p && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: "12px",
                marginBottom: "22px",
              }}
            >
              {[
                {
                  l: "Рівень знань",
                  v: `${p.knowledge_level.toFixed(0)}%`,
                  c: cl(p.knowledge_level),
                },
                {
                  l: "Залученість",
                  v: `${p.engagement_score.toFixed(0)}%`,
                  c: cl(p.engagement_score),
                },
                {
                  l: "Темп",
                  v:
                    (
                      {
                        slow: "Повільний",
                        medium: "Середній",
                        fast: "Швидкий",
                      } as Record<string, string>
                    )[p.learning_pace] ?? p.learning_pace,
                  c: "var(--primary)",
                },
              ].map((m) => (
                <div
                  key={m.l}
                  style={{
                    background: `${m.c.startsWith("#") ? m.c : "var(--primary)"}14`,
                    borderRadius: "12px",
                    padding: "16px 18px",
                    borderLeft: `4px solid ${m.c}`,
                  }}
                >
                  <div
                    style={{ fontSize: "22px", fontWeight: 800, color: m.c }}
                  >
                    {m.v}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      fontWeight: 600,
                      marginTop: "4px",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {m.l}
                  </div>
                </div>
              ))}
            </div>
          )}

          {}
          {recommendation && (
            <div
              style={{
                background: `${recommendation.tone}14`,
                borderLeft: `4px solid ${recommendation.tone}`,
                borderRadius: "10px",
                padding: "14px 18px",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: recommendation.tone,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: "6px",
                }}
              >
                Рекомендація
              </div>
              <div
                style={{
                  fontSize: "15px",
                  color: "var(--text)",
                  lineHeight: 1.5,
                }}
              >
                {recommendation.text}
              </div>
            </div>
          )}

          {}
          {(() => {
            const hobbies = (p?.interests ?? []).filter(
              (i: string) => !NON_HOBBY_KEYS.has(i),
            );
            return hobbies.length > 0 ? (
              <div
                style={{
                  background: "var(--surface)",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  boxShadow: "var(--shadow-sm)",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginBottom: "10px",
                  }}
                >
                  Інтереси / хобі
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {hobbies.map((i: string, k: number) => (
                    <span
                      key={k}
                      style={{
                        background: "var(--primary-10)",
                        color: "var(--primary)",
                        padding: "5px 12px",
                        borderRadius: "99px",
                        fontSize: "13px",
                        fontWeight: 600,
                      }}
                    >
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {}
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "12px",
              padding: "18px 22px",
              boxShadow: "var(--shadow-sm)",
              marginBottom: "22px",
              borderLeft: "4px solid #0284c7",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#0284c7",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Адаптивна траєкторія
              </div>
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                AI порада · на основі тестів + уваги + помилок
              </span>
            </div>
            {aiAdvice.loading && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  color: "var(--text-muted)",
                  fontSize: "14px",
                }}
              >
                <span className="spinner" style={{ width: 18, height: 18 }} />{" "}
                Досвідчений вчитель AI аналізує учня…
              </div>
            )}
            {aiAdvice.error && !aiAdvice.loading && (
              <div style={{ fontSize: "14px", color: "#ef4444" }}>
                {aiAdvice.error}
              </div>
            )}
            {!aiAdvice.loading && aiAdvice.text && (
              <div
                style={{
                  fontSize: "15px",
                  color: "var(--text)",
                  lineHeight: 1.65,
                  whiteSpace: "pre-wrap",
                }}
              >
                {aiAdvice.text}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
            {Object.entries(CLASS_MAP).map(([id, c]) => (
              <button
                key={id}
                onClick={() => setCls(Number(id))}
                className={
                  cls === Number(id) ? "btn btn-primary" : "btn btn-ghost"
                }
                style={{
                  minWidth: "70px",
                  fontSize: "15px",
                  padding: "8px 14px",
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))",
              gap: "10px",
            }}
          >
            {students.map((s) => {
              const p = profiles[s.id];
              const eng = p?.engagement_score ?? 0;
              return (
                <div
                  key={s.id}
                  onClick={() => setSel(s.id)}
                  style={{
                    background: "var(--surface)",
                    borderRadius: "12px",
                    padding: "17px 18px",
                    cursor: "pointer",
                    boxShadow: "var(--shadow-sm)",
                    transition: "box-shadow 150ms",
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
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        background: `${cl(eng)}20`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        color: cl(eng),
                        fontSize: "18px",
                        flexShrink: 0,
                      }}
                    >
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "var(--text)",
                        }}
                      >
                        {s.name}
                      </div>
                      <div
                        style={{ fontSize: "12px", color: "var(--text-muted)" }}
                      >
                        Клас {s.className}
                      </div>
                    </div>
                  </div>
                  {p && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "13px",
                        color: "var(--text-muted)",
                      }}
                    >
                      <span>
                        Знання:{" "}
                        <strong style={{ color: cl(p.knowledge_level) }}>
                          {p.knowledge_level.toFixed(0)}%
                        </strong>
                      </span>
                      <span>
                        Залуч.:{" "}
                        <strong style={{ color: cl(eng) }}>
                          {eng.toFixed(0)}%
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function JournalSection({
  teacherSubject,
  classId,
  isHomeroom,
}: {
  teacherSubject: string | null;
  classId: number;
  isHomeroom: boolean;
}) {
  const { classMap: CLASS_MAP } = useStaticContent();
  const [cls, setCls] = useState(classId);
  const [students, setStudents] = useState<
    { id: number; full_name: string; student_id: number }[]
  >([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [grades, setGrades] = useState<Record<number, Record<number, number>>>(
    {},
  );
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const usersRes = await client
        .get("/api/admin/users")
        .catch(() => ({ data: [] }));
      const studs = (usersRes.data ?? [])
        .filter(
          (u: any) =>
            u.role === "student" && u.class_id === cls && u.student_id,
        )
        .map((u: any) => ({
          id: u.student_id,
          full_name: u.full_name,
          student_id: u.student_id,
        }));
      setStudents(studs);

      let lessUrl = `/api/lessons/?class_id=${cls}`;
      if (teacherSubject)
        lessUrl += `&subject=${encodeURIComponent(teacherSubject)}`;
      const lessRes = await client.get(lessUrl).catch(() => ({ data: [] }));
      const less = (lessRes.data ?? []).sort((a: any, b: any) =>
        (a.date ?? "").localeCompare(b.date ?? ""),
      );
      setLessons(less);

      const testListsPerLesson = await Promise.all(
        less.map((l: any) =>
          client
            .get(`/api/tests/lesson/${l.id}`)
            .then((r) => r.data ?? [])
            .catch(() => []),
        ),
      );
      const testToLesson: Record<number, number> = {};
      less.forEach((l: any, i: number) => {
        (testListsPerLesson[i] ?? []).forEach((t: any) => {
          testToLesson[t.id] = l.id;
        });
      });

      const resultsPerStudent = await Promise.all(
        studs.map((s: any) =>
          client
            .get(`/api/students/${s.student_id}/results`)
            .then((r) => r.data ?? [])
            .catch(() => []),
        ),
      );
      const gradeMap: Record<number, Record<number, number>> = {};
      studs.forEach((s: any, i: number) => {
        gradeMap[s.student_id] = {};
        (resultsPerStudent[i] ?? []).forEach((r: any) => {
          const lessonId = testToLesson[r.test_id];
          if (lessonId != null) {
            const prev = gradeMap[s.student_id][lessonId] ?? 0;
            gradeMap[s.student_id][lessonId] = Math.max(prev, r.score ?? 0);
          }
        });
      });
      setGrades(gradeMap);
    } finally {
      setLoading(false);
    }
  }, [cls, teacherSubject]);

  useEffect(() => {
    load();
  }, [load]);

  const to12 = (v: number) =>
    v === 0 ? 0 : Math.max(1, Math.min(12, Math.round((v * 12) / 100)));
  const cl12 = (v: number) =>
    v >= 10 ? "#22c55e" : v >= 7 ? "#f59e0b" : v >= 4 ? "#fb923c" : "#ef4444";

  return (
    <div className="fade-in">
      {isHomeroom && (
        <div
          style={{
            background: "var(--primary-10)",
            borderRadius: "10px",
            padding: "11px 16px",
            marginBottom: "16px",
            fontSize: "14px",
            color: "var(--primary)",
            fontWeight: 600,
          }}
        >
          Класний керівник — перегляд оцінок (без редагування)
        </div>
      )}
      <div
        style={{
          display: "flex",
          gap: "6px",
          marginBottom: "18px",
          flexWrap: "wrap",
        }}
      >
        {Object.entries(CLASS_MAP).map(([id, c]) => (
          <button
            key={id}
            onClick={() => setCls(Number(id))}
            className={cls === Number(id) ? "btn btn-primary" : "btn btn-ghost"}
            style={{ fontSize: "15px", padding: "8px 14px" }}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: "var(--text-muted)" }}>Завантаження…</p>}

      {!loading && students.length === 0 && (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "14px",
            padding: "40px",
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "16px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          У класі {CLASS_MAP[cls]?.name ?? cls} ще немає зареєстрованих учнів
        </div>
      )}

      {!loading && students.length > 0 && lessons.length === 0 && (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "14px",
            padding: "6px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th
                  style={{
                    padding: "14px 16px",
                    textAlign: "left",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  Учень
                </th>
                <th
                  style={{
                    padding: "14px 16px",
                    textAlign: "center",
                    fontSize: "13px",
                    color: "var(--text-muted)",
                  }}
                >
                  Уроків з цього предмета ще немає
                </th>
              </tr>
            </thead>
            <tbody>
              {students
                .sort((a, b) => a.full_name.localeCompare(b.full_name, "uk"))
                .map((s) => (
                  <tr
                    key={s.id}
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <td
                      style={{
                        padding: "13px 16px",
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "var(--text)",
                      }}
                    >
                      {s.full_name}
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        textAlign: "center",
                        color: "var(--text-muted)",
                      }}
                    >
                      —
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && students.length > 0 && lessons.length > 0 && (
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
                    padding: "14px 16px",
                    textAlign: "left",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    minWidth: "180px",
                  }}
                >
                  Учень
                </th>
                {lessons.map((l) => (
                  <th
                    key={l.id}
                    style={{
                      padding: "12px 14px",
                      textAlign: "center",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--text)",
                      minWidth: "120px",
                      lineHeight: 1.45,
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>
                      {(l.topic ?? l.subject).length > 20
                        ? (l.topic ?? l.subject).substring(0, 18) + "…"
                        : (l.topic ?? l.subject)}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 400,
                        color: "var(--text-muted)",
                        marginTop: "4px",
                      }}
                    >
                      {l.date?.slice?.(0, 10) ?? ""}
                    </div>
                  </th>
                ))}
                <th
                  style={{
                    padding: "12px 14px",
                    textAlign: "center",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Серед.
                </th>
              </tr>
            </thead>
            <tbody>
              {students
                .sort((a, b) => a.full_name.localeCompare(b.full_name, "uk"))
                .map((s) => {
                  const stuGrades = grades[s.student_id] ?? {};
                  const gs = lessons.map((l) => stuGrades[l.id] ?? 0);
                  const a = avg(gs.filter((g) => g > 0));
                  return (
                    <tr
                      key={s.id}
                      style={{ borderTop: "1px solid var(--border)" }}
                    >
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: "15px",
                          fontWeight: 600,
                          color: "var(--text)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s.full_name}
                      </td>
                      {lessons.map((l) => {
                        const g = stuGrades[l.id] ?? 0;
                        const g12 = to12(g);
                        return (
                          <td
                            key={l.id}
                            style={{ padding: "8px 12px", textAlign: "center" }}
                          >
                            {g12 ? (
                              <span
                                style={{
                                  fontSize: "17px",
                                  fontWeight: 700,
                                  color: cl12(g12),
                                  background: `${cl12(g12)}14`,
                                  padding: "5px 10px",
                                  borderRadius: "7px",
                                }}
                              >
                                {g12}
                              </span>
                            ) : (
                              <span style={{ color: "var(--text-muted)" }}>
                                —
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td
                        style={{
                          padding: "13px 14px",
                          textAlign: "center",
                          fontWeight: 800,
                          fontSize: "19px",
                          color: cl12(to12(a)),
                        }}
                      >
                        {to12(a) || "—"}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TestSubmissionsPage({
  lesson,
  onBack,
  onGoLesson,
}: {
  lesson: any;
  onBack: () => void;
  onGoLesson: () => void;
}) {
  const { classMap: CLASS_MAP } = useStaticContent();
  const [test, setTest] = useState<any | null>(null);
  const [rows, setRows] = useState<
    { student: any; score: number; answers: any; errors: string[] }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [reviewItem, setReviewItem] = useState<any | null>(null);

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const [testsR, usersR] = await Promise.all([
          client
            .get(`/api/tests/lesson/${lesson.id}`)
            .then((r) => r.data ?? [])
            .catch(() => []),
          client
            .get(`/api/admin/users`)
            .then((r) => r.data ?? [])
            .catch(() => []),
        ]);
        const t = testsR[0] ?? null;
        setTest(t);
        if (!t) {
          setRows([]);
          return;
        }
        const stu = (usersR ?? []).filter(
          (u: any) =>
            u.role === "student" &&
            u.class_id === lesson.class_id &&
            u.student_id,
        );
        const resPerStu = await Promise.all(
          stu.map((u: any) =>
            client
              .get(`/api/students/${u.student_id}/results`)
              .then((r) =>
                (r.data ?? []).filter((x: any) => x.test_id === t.id),
              )
              .catch(() => []),
          ),
        );
        const items: {
          student: any;
          score: number;
          answers: any;
          errors: string[];
        }[] = [];
        stu.forEach((u: any, i: number) => {
          const rs = resPerStu[i] ?? [];
          if (rs.length > 0) {
            const best = rs.reduce((a: any, b: any) =>
              a.score >= b.score ? a : b,
            );
            items.push({
              student: u,
              score: best.score,
              answers: best.answers,
              errors: best.errors,
            });
          }
        });
        items.sort((a, b) => b.score - a.score);
        setRows(items);
      } finally {
        setLoading(false);
      }
    })();
  }, [lesson.id, lesson.class_id]);

  const to12 = (v: number) =>
    Math.max(1, Math.min(12, Math.round((v * 12) / 100)));
  const cl12 = (v: number) =>
    v >= 10 ? "#22c55e" : v >= 7 ? "#f59e0b" : v >= 4 ? "#fb923c" : "#ef4444";

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "30px" }}>
        <span className="spinner" />
      </div>
    );

  if (reviewItem && test) {
    const r = reviewItem;
    const grade12 = to12(r.score);
    return (
      <div className="fade-in">
        <button
          onClick={() => setReviewItem(null)}
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
          ← Назад до списку
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "22px",
          }}
        >
          <div
            style={{
              width: "54px",
              height: "54px",
              borderRadius: "50%",
              background: `${cl12(grade12)}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              color: cl12(grade12),
              fontSize: "22px",
            }}
          >
            {r.student.full_name.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--text)",
              }}
            >
              {r.student.full_name}
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                marginTop: "2px",
              }}
            >
              Тест по темі «{lesson.topic ?? lesson.subject}»
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "36px",
                fontWeight: 800,
                color: cl12(grade12),
                lineHeight: 1,
              }}
            >
              {grade12}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginTop: "3px",
              }}
            >
              з 12
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {test.questions.map((q: any, qi: number) => {
            const chosen = r.answers?.[String(qi)];
            const correct = q.correct_index;
            const isRight = chosen === correct;
            return (
              <div
                key={qi}
                style={{
                  background: "var(--surface)",
                  borderRadius: "12px",
                  padding: "18px",
                  boxShadow: "var(--shadow-sm)",
                  borderLeft: `4px solid ${isRight ? "#22c55e" : "#ef4444"}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Питання {qi + 1}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: isRight ? "#22c55e" : "#ef4444",
                    }}
                  >
                    {isRight ? "Правильно" : "Помилка"}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "var(--text)",
                    marginBottom: "12px",
                  }}
                >
                  {q.question}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {q.options.map((opt: string, oi: number) => {
                    const isCorrect = oi === correct;
                    const isChosen = oi === chosen;
                    let bg = "var(--surface-2)";
                    let border = "transparent";
                    let co = "var(--text)";
                    if (isCorrect) {
                      bg = "var(--success-bg)";
                      border = "#22c55e";
                      co = "#16a34a";
                    } else if (isChosen) {
                      bg = "var(--danger-bg)";
                      border = "#ef4444";
                      co = "#dc2626";
                    }
                    return (
                      <div
                        key={oi}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: `1.5px solid ${border}`,
                          background: bg,
                          color: co,
                          fontSize: "15px",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            opacity: 0.7,
                            minWidth: "22px",
                          }}
                        >
                          {String.fromCharCode(65 + oi)}.
                        </span>
                        <span style={{ flex: 1 }}>{opt}</span>
                        {isCorrect && (
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: "#16a34a",
                            }}
                          >
                            правильна
                          </span>
                        )}
                        {isChosen && !isCorrect && (
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: "#dc2626",
                            }}
                          >
                            обрав учень
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {q.explanation && (
                  <div
                    style={{
                      marginTop: "10px",
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      fontStyle: "italic",
                      background: "var(--primary-10)",
                      padding: "8px 12px",
                      borderRadius: "6px",
                    }}
                  >
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: "var(--primary)",
          fontWeight: 600,
          fontSize: "15px",
          cursor: "pointer",
          marginBottom: "16px",
          padding: 0,
        }}
      >
        ← Назад до списку тестів
      </button>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "12px",
          marginBottom: "18px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "4px",
            }}
          >
            Тест: {lesson.topic ?? lesson.subject}
          </h2>
          <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>
            {lesson.subject} · {CLASS_MAP[lesson.class_id]?.name ?? ""} ·{" "}
            {lesson.date?.slice?.(0, 10) ?? ""}
          </div>
        </div>
        <button
          onClick={onGoLesson}
          className="btn btn-primary"
          style={{ fontSize: "15px", padding: "10px 18px" }}
        >
          Перейти до уроку →
        </button>
      </div>
      {!test && (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          Тест ще не створено
        </div>
      )}
      {test && rows.length === 0 && (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          Жоден учень ще не пройшов цей тест
        </div>
      )}
      {test && rows.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {rows.map((r, i) => {
            const g = to12(r.score);
            return (
              <div
                key={r.student.id + "_" + i}
                onClick={() => setReviewItem(r)}
                style={{
                  background: "var(--surface)",
                  borderRadius: "12px",
                  padding: "14px 18px",
                  cursor: "pointer",
                  boxShadow: "var(--shadow-sm)",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  transition: "box-shadow 150ms",
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
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: `${cl12(g)}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    color: cl12(g),
                    fontSize: "15px",
                    flexShrink: 0,
                  }}
                >
                  {r.student.full_name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "var(--text)",
                    }}
                  >
                    {r.student.full_name}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      marginTop: "2px",
                    }}
                  >
                    клікни для перегляду відповідей · {Math.round(r.score)}%
                  </div>
                </div>
                <div
                  style={{ fontSize: "22px", fontWeight: 800, color: cl12(g) }}
                >
                  {g}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  з 12
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TestsSectionTeacher({
  teacherSubject,
  onOpenLesson,
}: {
  teacherSubject: string | null;
  onOpenLesson: (lessonId: number) => void;
}) {
  const { classMap: CLASS_MAP } = useStaticContent();
  const allClassIds = Object.keys(CLASS_MAP).map(Number);
  const [cls, setCls] = useState<number | "all">("all");
  const [rows, setRows] = useState<
    {
      lesson: any;
      test: any | null;
      submissionsCount: number;
      avg: number | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [openSubLesson, setOpenSubLesson] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const classIds = cls === "all" ? allClassIds : [cls];
      const lessonsPerClass = await Promise.all(
        classIds.map((c) => {
          let url = `/api/lessons/?class_id=${c}`;
          if (teacherSubject)
            url += `&subject=${encodeURIComponent(teacherSubject)}`;
          return client
            .get(url)
            .then((r) => r.data ?? [])
            .catch(() => []);
        }),
      );
      const lessons = lessonsPerClass.flat();

      const items = await Promise.all(
        lessons.map(async (l: any) => {
          const [testsRes, analRes] = await Promise.all([
            client
              .get(`/api/tests/lesson/${l.id}`)
              .then((r) => r.data ?? [])
              .catch(() => []),
            client
              .get(`/api/tests/lesson/${l.id}/analytics`)
              .then((r) => r.data)
              .catch(() => null),
          ]);
          const test = testsRes[0] ?? null;
          const submissionsCount = analRes?.has_data
            ? (analRes.total_submissions ?? 0)
            : 0;
          const avg = analRes?.has_data ? analRes.average_score : null;
          return { lesson: l, test, submissionsCount, avg };
        }),
      );
      items.sort((a, b) => (b.test ? 1 : 0) - (a.test ? 1 : 0));
      setRows(items);
    } finally {
      setLoading(false);
    }
  }, [cls, teacherSubject]);

  useEffect(() => {
    load();
  }, [load]);

  const withTest = rows.filter((r) => r.test);
  const withoutTest = rows.filter((r) => !r.test);

  if (openSubLesson) {
    return (
      <TestSubmissionsPage
        lesson={openSubLesson}
        onBack={() => setOpenSubLesson(null)}
        onGoLesson={() => onOpenLesson(openSubLesson.id)}
      />
    );
  }

  return (
    <div className="fade-in">
      <div
        style={{
          display: "flex",
          gap: "6px",
          marginBottom: "18px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setCls("all")}
          className={cls === "all" ? "btn btn-primary" : "btn btn-ghost"}
          style={{ fontSize: "14px", padding: "7px 14px" }}
        >
          Всі класи
        </button>
        {Object.entries(CLASS_MAP).map(([id, c]) => (
          <button
            key={id}
            onClick={() => setCls(Number(id))}
            className={cls === Number(id) ? "btn btn-primary" : "btn btn-ghost"}
            style={{ fontSize: "14px", padding: "7px 14px" }}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: "var(--text-muted)" }}>Завантаження…</p>}

      {!loading && withTest.length === 0 && withoutTest.length === 0 && (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          Уроків для цього фільтра ще немає
        </div>
      )}

      {withTest.length > 0 && (
        <>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "10px",
            }}
          >
            Задані тести ({withTest.length})
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginBottom: "24px",
            }}
          >
            {withTest.map(({ lesson: l, test, submissionsCount, avg }) => (
              <div
                key={l.id}
                onClick={() => setOpenSubLesson(l)}
                style={{
                  background: "var(--surface)",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  boxShadow: "var(--shadow-sm)",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderLeft: "4px solid var(--primary)",
                  transition: "box-shadow 150ms",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.boxShadow = "var(--shadow-md)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.boxShadow = "var(--shadow-sm)")
                }
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "var(--text)",
                      marginBottom: "4px",
                    }}
                  >
                    {l.topic ?? l.subject}
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    {l.subject} ·{" "}
                    {CLASS_MAP[l.class_id]?.name ?? `Клас ${l.class_id}`} ·{" "}
                    {l.date?.slice?.(0, 10) ?? ""}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "22px",
                    alignItems: "center",
                    fontSize: "14px",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "19px",
                        fontWeight: 800,
                        color: "var(--text)",
                      }}
                    >
                      {test.questions?.length ?? 0}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      питань
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "19px",
                        fontWeight: 800,
                        color:
                          submissionsCount > 0
                            ? "var(--primary)"
                            : "var(--text-muted)",
                      }}
                    >
                      {submissionsCount}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      здали
                    </div>
                  </div>
                  {avg != null && (
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: "19px",
                          fontWeight: 800,
                          color: cl(avg),
                        }}
                      >
                        {Math.round(avg)}%
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        середн.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {withoutTest.length > 0 && (
        <>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "10px",
            }}
          >
            Уроки без тесту ({withoutTest.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {withoutTest.map(({ lesson: l }) => (
              <div
                key={l.id}
                onClick={() => onOpenLesson(l.id)}
                style={{
                  background: "var(--surface)",
                  borderRadius: "12px",
                  padding: "14px 20px",
                  boxShadow: "var(--shadow-sm)",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderLeft: "4px solid var(--text-muted)",
                  transition: "box-shadow 150ms",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.boxShadow = "var(--shadow-md)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.boxShadow = "var(--shadow-sm)")
                }
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "var(--text)",
                      marginBottom: "3px",
                    }}
                  >
                    {l.topic ?? l.subject}
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    {l.subject} ·{" "}
                    {CLASS_MAP[l.class_id]?.name ?? `Клас ${l.class_id}`} ·{" "}
                    {l.date?.slice?.(0, 10) ?? ""}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--primary)",
                    fontWeight: 600,
                  }}
                >
                  Створити тест →
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function TeacherApp() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, palette, setPalette } = useTheme();
  const [section, setSection] = useState("overview");
  const [classId, setClassId] = useState(1);
  const [forcedClass, setForcedClass] = useState<number | null>(null);
  const [focusLessonId, setFocusLessonId] = useState<number | null>(null);
  const [lessonInitialTab, setLessonInitialTab] = useState<
    "media" | "test" | "students" | undefined
  >(undefined);
  const [profiles, setProfiles] = useState<Record<number, any>>({});

  const openLesson = useCallback(
    (
      lessonId: number,
      classOfLesson: number,
      tab?: "media" | "test" | "students",
    ) => {
      setForcedClass(classOfLesson);
      setClassId(classOfLesson);
      setFocusLessonId(lessonId);
      setLessonInitialTab(tab);
      setSection("lessons");
    },
    [],
  );

  const teacherSubject = user?.subject ?? null;
  const isHomeroom = !teacherSubject;

  const { allStudents } = useStaticContent();

  const loadProfiles = useCallback(async () => {
    if (!allStudents.length) return;
    const results = await Promise.allSettled(
      allStudents.map((s) => client.get(`/api/students/${s.id}/profile`)),
    );
    const map: Record<number, any> = {};
    results.forEach((r, i) => {
      if (r.status === "fulfilled") map[allStudents[i].id] = r.value.data;
    });
    setProfiles(map);
  }, [allStudents]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const titles: Record<string, string> = {
    overview: "Огляд класу",
    lessons: "Уроки",
    tests: "Тести",
    students: "Учні",
    journal: "Журнал оцінок",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        section={section}
        setSection={setSection}
        user={{ full_name: user?.full_name ?? "", subject: teacherSubject }}
        logout={logout}
        theme={theme}
        toggleTheme={toggleTheme}
        palette={palette}
        setPalette={setPalette}
      />
      <main
        style={{
          marginLeft: "230px",
          flex: 1,
          padding: "34px 44px",
          minWidth: 0,
        }}
      >
        <div className="fade-in">
          <h1
            style={{
              fontSize: "26px",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "4px",
            }}
          >
            {titles[section]}
          </h1>
          <p
            style={{
              fontSize: "15px",
              color: "var(--text-muted)",
              marginBottom: "30px",
            }}
          >
            {user?.full_name} ·{" "}
            {isHomeroom ? "Класний керівник (10А)" : teacherSubject}
          </p>
        </div>
        {section === "overview" && (
          <OverviewSection
            teacherSubject={teacherSubject}
            profiles={profiles}
            isHomeroom={isHomeroom}
            onClassClick={(id) => {
              setClassId(id);
              setForcedClass(id);
              setSection("lessons");
            }}
            onLessonClick={(lessonId, clsId) => openLesson(lessonId, clsId)}
          />
        )}
        {section === "lessons" && (
          <LessonsSection
            teacherSubject={teacherSubject}
            isHomeroom={isHomeroom}
            forcedClass={forcedClass}
            focusLessonId={focusLessonId}
            initialTab={lessonInitialTab}
            onConsumed={() => {
              setForcedClass(null);
              setFocusLessonId(null);
              setLessonInitialTab(undefined);
            }}
          />
        )}
        {section === "tests" && (
          <TestsSectionTeacher
            teacherSubject={teacherSubject}
            onOpenLesson={(lessonId) => {
              client
                .get(`/api/lessons/${lessonId}`)
                .then((r) => {
                  const l = r.data;
                  if (l) openLesson(lessonId, l.class_id, "test");
                })
                .catch(() => {});
            }}
          />
        )}
        {section === "students" && (
          <StudentsSection
            classId={classId}
            profiles={profiles}
            teacherSubject={teacherSubject}
          />
        )}
        {section === "journal" && (
          <JournalSection
            teacherSubject={teacherSubject}
            classId={classId}
            isHomeroom={isHomeroom}
          />
        )}
      </main>
    </div>
  );
}
