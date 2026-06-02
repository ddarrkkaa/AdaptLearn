import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  Sparkles,
  ArrowRight,
  GraduationCap,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import client from "../api/client";

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    username: "",
    password: "",
    confirm: "",
    role: "student" as "student" | "teacher",
    class_id: "1",
    subject: "Математика",
    homeroom: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("Паролі не збігаються");
      return;
    }
    if (form.password.length < 6) {
      setError("Пароль мінімум 6 символів");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const body = {
        username: form.username,
        password: form.password,
        full_name: form.full_name,
        role: form.role,
        class_id: form.role === "student" ? Number(form.class_id) : undefined,
        subject:
          form.role === "teacher" && !form.homeroom ? form.subject : undefined,
        homeroom: form.homeroom,
      };
      await client.post("/api/auth/register", body);
      await login(form.username, form.password);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Помилка реєстрації");
    } finally {
      setLoading(false);
    }
  };

  const labelCls =
    "tw-block tw-text-[10.5px] tw-font-bold tw-text-neuro-muted tw-mb-2 tw-uppercase tw-tracking-[0.14em]";

  return (
    <div className="tw-relative tw-min-h-screen tw-flex tw-items-center tw-justify-center tw-overflow-hidden tw-px-4 tw-py-10">
      {}
      <div
        className="tw-pointer-events-none tw-absolute tw--top-[15vh] tw--left-[15vw] tw-w-[55vw] tw-h-[55vw] tw-rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(0,230,200,0.16) 0%, transparent 60%)",
        }}
      />
      <div
        className="tw-pointer-events-none tw-absolute tw--bottom-[20vh] tw--right-[10vw] tw-w-[45vw] tw-h-[45vw] tw-rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,94,122,0.08) 0%, transparent 60%)",
        }}
      />

      {}
      <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-overflow-hidden">
        {[...Array(16)].map((_, i) => (
          <span
            key={i}
            className="tw-absolute tw-rounded-full tw-animate-pulse-soft"
            style={{
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              top: `${(i * 61) % 100}%`,
              left: `${(i * 43) % 100}%`,
              background: i % 2 === 0 ? "#00E6C8" : "#E8B923",
              boxShadow: `0 0 ${4 + (i % 5)}px currentColor`,
              animationDelay: `${(i % 7) * 0.3}s`,
              opacity: 0.55,
            }}
          />
        ))}
      </div>

      <div
        className="neuro-card-glow fade-in tw-relative tw-z-10 tw-w-full tw-max-w-[500px] tw-rounded-3xl tw-p-9"
        style={{
          background:
            "linear-gradient(165deg, rgb(var(--neuro-card-rgb) / 0.92), rgb(var(--neuro-card-rgb) / 0.75))",
          backdropFilter: "blur(20px)",
          boxShadow:
            "0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(0,230,200,0.10), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        {}
        <div className="tw-flex tw-items-center tw-gap-3.5 tw-mb-8">
          <div
            className="tw-relative tw-w-12 tw-h-12 tw-rounded-2xl tw-flex tw-items-center tw-justify-center
                          tw-bg-gradient-to-br tw-from-neuro-teal/30 tw-to-neuro-gold/20
                          tw-border tw-border-neuro-teal/40"
            style={{ boxShadow: "0 0 24px rgba(0,230,200,0.30)" }}
          >
            <Brain
              className="tw-w-6 tw-h-6 tw-text-neuro-teal"
              strokeWidth={1.6}
            />
            <span
              className="tw-absolute tw-inset-0 tw-rounded-2xl tw-animate-pulse-soft"
              style={{ boxShadow: "0 0 16px rgba(0,230,200,0.40)" }}
            />
          </div>
          <div>
            <div className="tw-text-[18px] tw-font-bold tw-text-neuro-text tw-leading-none tw-tracking-wide">
              AdaptLearn
            </div>
            <div className="tw-text-[10.5px] tw-text-neuro-muted tw-mt-1.5 tw-uppercase tw-tracking-[0.20em]">
              Neural Edu Lab
            </div>
          </div>
        </div>

        {}
        <div className="tw-mb-2 tw-flex tw-items-center tw-gap-2">
          <Sparkles
            className="tw-w-4 tw-h-4 tw-text-neuro-gold tw-animate-pulse-soft"
            strokeWidth={1.8}
          />
          <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.22em] tw-text-neuro-muted">
            Створити обліковий запис
          </span>
        </div>
        <h1 className="tw-text-[30px] tw-font-bold tw-text-neuro-text tw-leading-tight tw-mb-2 tw-tracking-tight">
          Реєстрація
        </h1>
        <p className="tw-text-[14px] tw-text-neuro-muted tw-mb-6">
          Вже маєш акаунт?{" "}
          <button
            onClick={() => navigate("/login")}
            className="tw-text-neuro-teal tw-font-semibold hover:tw-text-neuro-text tw-transition-colors tw-inline-flex tw-items-center tw-gap-1"
          >
            Увійти <ArrowRight className="tw-w-3.5 tw-h-3.5" strokeWidth={2} />
          </button>
        </p>

        {}
        <div className="tw-grid tw-grid-cols-2 tw-gap-3 tw-mb-6">
          {(["student", "teacher"] as const).map((r) => {
            const isActive = form.role === r;
            const Icon = r === "student" ? GraduationCap : BookOpen;
            return (
              <button
                key={r}
                type="button"
                onClick={() => set("role", r)}
                className="tw-relative tw-rounded-xl tw-p-3.5 tw-text-left tw-transition-all tw-duration-300 tw-flex tw-items-center tw-gap-3"
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, rgba(0,230,200,0.14), rgba(0,230,200,0.04))"
                    : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isActive ? "rgba(0,230,200,0.50)" : "var(--border)"}`,
                  boxShadow: isActive
                    ? "0 0 18px rgba(0,230,200,0.18), inset 0 0 14px rgba(0,230,200,0.05)"
                    : "none",
                }}
              >
                <div
                  className="tw-w-9 tw-h-9 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0"
                  style={{
                    background: isActive
                      ? "rgba(0,230,200,0.18)"
                      : "rgba(255,255,255,0.04)",
                    color: isActive ? "#00E6C8" : "var(--text-muted)",
                  }}
                >
                  <Icon className="tw-w-5 tw-h-5" strokeWidth={1.7} />
                </div>
                <div>
                  <div
                    className="tw-text-[14px] tw-font-bold"
                    style={{ color: isActive ? "#00E6C8" : "var(--text)" }}
                  >
                    {r === "student" ? "Учень" : "Вчитель"}
                  </div>
                  <div className="tw-text-[11px] tw-text-neuro-muted tw-mt-0.5">
                    {r === "student"
                      ? "Доступ до уроків"
                      : "Створення і аналітика"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="tw-flex tw-flex-col tw-gap-4">
          <div>
            <label className={labelCls}>Повне ім'я</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              placeholder="Ім'я Прізвище"
              required
            />
          </div>
          <div>
            <label className={labelCls}>Логін</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              placeholder="унікальний логін"
              required
            />
          </div>
          <div className="tw-grid tw-grid-cols-2 tw-gap-3">
            <div>
              <label className={labelCls}>Пароль</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="6+ символів"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Підтвердити</label>
              <input
                type="password"
                value={form.confirm}
                onChange={(e) => set("confirm", e.target.value)}
                placeholder="повторити"
                required
              />
            </div>
          </div>

          {form.role === "student" && (
            <div>
              <label className={labelCls}>Клас</label>
              <select
                value={form.class_id}
                onChange={(e) => set("class_id", e.target.value)}
              >
                <option value="1">10А</option>
                <option value="2">10Б</option>
              </select>
            </div>
          )}

          {form.role === "teacher" && (
            <>
              <label
                htmlFor="homeroom"
                className="tw-flex tw-items-center tw-gap-3 tw-px-4 tw-py-3 tw-rounded-xl tw-cursor-pointer tw-transition-all"
                style={{
                  background: form.homeroom
                    ? "rgba(0,230,200,0.08)"
                    : "rgba(255,255,255,0.02)",
                  border: `1px solid ${form.homeroom ? "rgba(0,230,200,0.40)" : "var(--border)"}`,
                }}
              >
                <input
                  type="checkbox"
                  id="homeroom"
                  checked={form.homeroom}
                  onChange={(e) => set("homeroom", e.target.checked)}
                  style={{
                    width: "16px",
                    height: "16px",
                    accentColor: "#00E6C8",
                  }}
                />
                <span className="tw-text-[13.5px] tw-text-neuro-text">
                  Класний керівник{" "}
                  <span className="tw-text-neuro-muted">
                    (доступ до всіх предметів)
                  </span>
                </span>
              </label>
              {!form.homeroom && (
                <div>
                  <label className={labelCls}>Предмет</label>
                  <select
                    value={form.subject}
                    onChange={(e) => set("subject", e.target.value)}
                  >
                    <option>Математика</option>
                    <option>Українська мова</option>
                    <option>Фізика</option>
                    <option>Хімія</option>
                    <option>Біологія</option>
                    <option>Географія</option>
                    <option>Історія</option>
                    <option>Інформатика</option>
                  </select>
                </div>
              )}
            </>
          )}

          {error && (
            <div
              className="tw-rounded-xl tw-px-4 tw-py-3 tw-text-[13px] tw-font-medium tw-flex tw-items-start tw-gap-2"
              style={{
                background: "rgba(255,94,122,0.10)",
                color: "#FF8FA3",
                border: "1px solid rgba(255,94,122,0.30)",
              }}
            >
              <AlertCircle
                className="tw-w-4 tw-h-4 tw-flex-shrink-0 tw-mt-0.5"
                strokeWidth={2}
              />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="tw-group tw-relative tw-w-full tw-mt-2 tw-py-3.5 tw-rounded-xl tw-text-[15px] tw-font-bold
                       tw-flex tw-items-center tw-justify-center tw-gap-2 tw-transition-all tw-duration-300
                       disabled:tw-opacity-60 disabled:tw-cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #00E6C8, #00C9AE)",
              color: "#050507",
              boxShadow:
                "0 0 0 1px rgba(0,230,200,0.40), 0 8px 28px rgba(0,230,200,0.40)",
            }}
          >
            {loading ? (
              <span className="spinner" />
            ) : (
              <>
                Зареєструватись
                <ArrowRight
                  className="tw-w-4 tw-h-4 group-hover:tw-translate-x-1 tw-transition-transform"
                  strokeWidth={2.2}
                />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
