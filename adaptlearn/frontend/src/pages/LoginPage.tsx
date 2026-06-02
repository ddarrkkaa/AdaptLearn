import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Eye, EyeOff, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
    } catch {
      setError("Невірний логін або пароль");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="tw-relative tw-min-h-screen tw-flex tw-items-center tw-justify-center tw-overflow-hidden tw-px-4"
      style={{ perspective: "1400px" }}
    >
      {}
      <div
        className="tw-pointer-events-none tw-absolute tw--top-[20vh] tw--right-[15vw] tw-w-[60vw] tw-h-[60vw] tw-rounded-full tw-animate-drift"
        style={{
          background:
            "radial-gradient(circle, rgba(0,230,200,0.22) 0%, transparent 60%)",
          transform: "translateZ(-200px)",
        }}
      />
      <div
        className="tw-pointer-events-none tw-absolute tw--bottom-[25vh] tw--left-[12vw] tw-w-[50vw] tw-h-[50vw] tw-rounded-full tw-animate-drift"
        style={{
          background:
            "radial-gradient(circle, rgba(232,185,35,0.12) 0%, transparent 60%)",
          transform: "translateZ(-150px)",
          animationDelay: "4s",
        }}
      />
      <div
        className="tw-pointer-events-none tw-absolute tw-top-1/2 tw-left-1/2 tw-w-[40vw] tw-h-[40vw] tw-rounded-full tw-animate-pulse-soft"
        style={{
          background:
            "radial-gradient(circle, rgba(255,94,122,0.07) 0%, transparent 60%)",
          transform: "translate(-50%, -50%) translateZ(-100px)",
        }}
      />

      {}
      <svg
        className="tw-pointer-events-none tw-absolute tw-inset-0 tw-w-full tw-h-full"
        style={{ opacity: 0.18 }}
      >
        <defs>
          <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00E6C8" stopOpacity="0" />
            <stop offset="50%" stopColor="#00E6C8" stopOpacity="1" />
            <stop offset="100%" stopColor="#E8B923" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[
          ["10%", "20%", "30%", "60%"],
          ["70%", "15%", "55%", "70%"],
          ["20%", "85%", "80%", "30%"],
          ["85%", "75%", "40%", "40%"],
          ["5%", "50%", "45%", "10%"],
          ["60%", "90%", "90%", "20%"],
        ].map(([x1, y1, x2, y2], i) => (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="url(#line-grad)"
            strokeWidth="0.6"
          />
        ))}
      </svg>

      {}
      <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-overflow-hidden">
        {[...Array(28)].map((_, i) => {
          const depth = (i % 4) - 2;
          return (
            <span
              key={i}
              className="tw-absolute tw-rounded-full tw-animate-pulse-soft"
              style={{
                width: `${2 + (i % 4)}px`,
                height: `${2 + (i % 4)}px`,
                top: `${(i * 53) % 100}%`,
                left: `${(i * 37) % 100}%`,
                background:
                  i % 3 === 0 ? "#00E6C8" : i % 3 === 1 ? "#E8B923" : "#FF5E7A",
                boxShadow: `0 0 ${6 + (i % 6)}px currentColor`,
                animationDelay: `${(i % 7) * 0.3}s`,
                opacity: 0.45 + (i % 3) * 0.2,
                transform: `translateZ(${depth * 80}px)`,
                filter:
                  depth < 0 ? `blur(${Math.abs(depth) * 0.7}px)` : undefined,
              }}
            />
          );
        })}
      </div>

      {}
      <div
        className="neuro-card-glow fade-in tw-relative tw-z-10 tw-w-full tw-max-w-[460px] tw-rounded-3xl tw-p-10"
        style={{
          background:
            "linear-gradient(165deg, rgb(var(--neuro-card-rgb) / 0.92), rgb(var(--neuro-card-rgb) / 0.75))",
          backdropFilter: "blur(24px)",

          boxShadow: [
            "0 1px 0 rgba(255,255,255,0.06) inset",
            "0 -1px 0 rgba(0,0,0,0.6) inset",
            "0 30px 80px -10px rgba(0,0,0,0.7)",
            "0 15px 40px -10px rgba(0,230,200,0.18)",
            "0 -10px 50px -15px rgba(232,185,35,0.10)",
            "0 0 0 1px rgba(0,230,200,0.18)",
          ].join(", "),
          transform: "translateZ(0)",
        }}
      >
        {}
        <div className="tw-flex tw-items-center tw-gap-3.5 tw-mb-10">
          <div
            className="tw-relative tw-w-12 tw-h-12 tw-rounded-2xl tw-flex tw-items-center tw-justify-center
                          tw-bg-gradient-to-br tw-from-neuro-teal/30 tw-to-neuro-gold/20
                          tw-border tw-border-neuro-teal/40"
            style={{
              boxShadow:
                "0 0 24px rgba(0,230,200,0.30), inset 0 0 18px rgba(0,230,200,0.08)",
            }}
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
            className="tw-w-4 tw-h-4 tw-text-neuro-teal tw-animate-pulse-soft"
            strokeWidth={1.8}
          />
          <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.22em] tw-text-neuro-muted">
            Доступ до системи
          </span>
        </div>
        <h1
          className="tw-text-[32px] tw-font-bold tw-text-neuro-text tw-leading-tight tw-mb-2 tw-tracking-tight"
          style={{ textShadow: "0 0 30px rgba(0,230,200,0.18)" }}
        >
          Вхід
        </h1>
        <p className="tw-text-[14px] tw-text-neuro-muted tw-mb-8">
          Немає акаунту?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="tw-text-neuro-teal tw-font-semibold tw-inline-flex tw-items-center tw-gap-1 tw-transition-all tw-duration-200"
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              textDecoration: "underline",
              textDecorationColor: "rgba(0,230,200,0.30)",
              textUnderlineOffset: "4px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#E8EAF0";
              e.currentTarget.style.textDecorationColor = "#00E6C8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#00E6C8";
              e.currentTarget.style.textDecorationColor =
                "rgba(0,230,200,0.30)";
            }}
          >
            Зареєструватись{" "}
            <ArrowRight className="tw-w-3.5 tw-h-3.5" strokeWidth={2} />
          </button>
        </p>

        <form onSubmit={handleSubmit} className="tw-flex tw-flex-col tw-gap-5">
          {}
          <div>
            <label className="tw-block tw-text-[10.5px] tw-font-bold tw-text-neuro-muted tw-mb-2 tw-uppercase tw-tracking-[0.14em]">
              Логін
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ім'я користувача"
              required
              autoFocus
            />
          </div>

          {}
          <div>
            <label className="tw-block tw-text-[10.5px] tw-font-bold tw-text-neuro-muted tw-mb-2 tw-uppercase tw-tracking-[0.14em]">
              Пароль
            </label>
            <div className="tw-relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ paddingRight: "44px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="tw-absolute tw-right-2 tw-top-1/2 tw--translate-y-1/2 tw-w-8 tw-h-8 tw-rounded-lg
                           tw-flex tw-items-center tw-justify-center tw-text-neuro-muted tw-transition-all tw-duration-200"
                style={{
                  background: "rgba(0,230,200,0.06)",
                  border: "1px solid rgba(0,230,200,0.20)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0,230,200,0.14)";
                  e.currentTarget.style.color = "#00E6C8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(0,230,200,0.06)";
                  e.currentTarget.style.color = "";
                }}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="tw-w-4 tw-h-4" />
                ) : (
                  <Eye className="tw-w-4 tw-h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="tw-rounded-xl tw-px-4 tw-py-3 tw-text-[13px] tw-font-medium"
              style={{
                background: "rgba(255,94,122,0.10)",
                color: "#FF8FA3",
                border: "1px solid rgba(255,94,122,0.30)",
                boxShadow: "0 0 18px rgba(255,94,122,0.10)",
              }}
            >
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
            onMouseEnter={(e) => {
              if (!loading)
                e.currentTarget.style.boxShadow =
                  "0 0 0 1px #00E6C8, 0 10px 40px rgba(0,230,200,0.65)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                "0 0 0 1px rgba(0,230,200,0.40), 0 8px 28px rgba(0,230,200,0.40)";
            }}
          >
            {loading ? (
              <span className="spinner" />
            ) : (
              <>
                Увійти
                <ArrowRight
                  className="tw-w-4 tw-h-4 group-hover:tw-translate-x-1 tw-transition-transform"
                  strokeWidth={2.2}
                />
              </>
            )}
          </button>
        </form>

        {}
        <div className="tw-mt-8 tw-pt-6 tw-border-t tw-border-neuro-border/40 tw-text-center">
          <div className="tw-text-[11px] tw-text-neuro-muted tw-tracking-wide">
            Адаптивне навчання · Сенсорика класу · AI-аналітика
          </div>
        </div>
      </div>
    </div>
  );
}
