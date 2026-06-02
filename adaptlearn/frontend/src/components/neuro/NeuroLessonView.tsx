import { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutDashboard, BookOpen, ListChecks, Users, Calendar, ArrowLeft,
  Activity, ThermometerSun, Droplets, Mic, LogOut, Settings, Play,
  Pause, Volume2, Maximize2, Brain, Sparkles, Eye,
  Upload, FileText, Save, Send, Wand2, CheckCircle2,
  Plus, Trash2, AlertCircle,
} from "lucide-react";
import client from "../../api/client";
import { MOCK_LESSON_ANALYTICS } from "../../data/mocks";


interface Lesson {
  id: number;
  subject: string;
  topic?: string | null;
  date: string;
  class_id: number;
  video_path?: string | null;
  transcript?: string | null;
  key_terms?: string[];
  avg_engagement?: number | null;
  avg_fatigue?: number | null;
  answers_given?: number;
  answers_total?: number;
  ai_analysis?: any;
}
interface SensorData {
  avg_attention?: number | null;
  avg_temperature?: number | null;
  avg_humidity?: number | null;
  audio_events_count?: number;
  attention_timeline?: number[];
  video_keywords?: string[];
}

interface NeuroLessonViewProps {
  lesson: Lesson;
  className?: string;
  onBack: () => void;
  user?: { full_name?: string; subject?: string | null };
  onLogout?: () => void;
  activeNav?: NavKey;
  onNavChange?: (k: NavKey) => void;
}

type NavKey = "overview" | "lessons" | "tests" | "students" | "journal";
type TabKey = "lesson" | "test" | "analytics";
 
const cn = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

const colorFor = (v: number | null | undefined, type: "attention" | "temp" | "humid" = "attention") => {
  if (v == null) return "text-neuro-muted";
  if (type === "temp")  return (v < 20 || v > 24) ? "text-neuro-coral"   : "text-neuro-teal";
  if (type === "humid") return (v < 40 || v > 60) ? "text-neuro-gold"    : "text-neuro-teal";
  return v >= 70 ? "text-neuro-teal" : v >= 45 ? "text-neuro-gold" : "text-neuro-coral";
};
 
const NAV_ITEMS: { key: NavKey; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Огляд",   icon: LayoutDashboard },
  { key: "lessons",  label: "Уроки",   icon: BookOpen },
  { key: "tests",    label: "Тести",   icon: ListChecks },
  { key: "students", label: "Учні",    icon: Users },
  { key: "journal",  label: "Журнал",  icon: Calendar },
];

function Sidebar({
  active, onChange, user, onLogout,
}: {
  active: NavKey;
  onChange: (k: NavKey) => void;
  user?: { full_name?: string; subject?: string | null };
  onLogout?: () => void;
}) {
  return (
    <aside
      className="tw-fixed tw-top-0 tw-left-0 tw-h-screen tw-w-[228px] tw-flex tw-flex-col
                 tw-bg-neuro-bg-2/80 tw-backdrop-blur-xl tw-border-r tw-border-neuro-border/60
                 tw-z-40"
    >
      { }
      <div className="tw-px-6 tw-pt-7 tw-pb-8">
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="tw-relative tw-w-10 tw-h-10 tw-rounded-xl tw-bg-gradient-to-br tw-from-neuro-teal/30 tw-to-neuro-gold/20
                          tw-flex tw-items-center tw-justify-center tw-shadow-neuro-glow tw-border tw-border-neuro-teal/30">
            <Brain className="tw-w-5 tw-h-5 tw-text-neuro-teal" strokeWidth={1.7} />
            <div className="tw-absolute tw-inset-0 tw-rounded-xl tw-animate-pulse-soft tw-bg-neuro-teal/10" />
          </div>
          <div>
            <div className="tw-text-[15px] tw-font-semibold tw-text-neuro-text tw-leading-none tw-tracking-wide">
              AdaptLearn
            </div>
            <div className="tw-text-[10.5px] tw-text-neuro-muted tw-mt-1.5 tw-uppercase tw-tracking-[0.18em]">
              Neural Edu Lab
            </div>
          </div>
        </div>
      </div>

      { }
      <nav className="tw-flex-1 tw-px-3 tw-flex tw-flex-col tw-gap-1">
        {NAV_ITEMS.map((it) => {
          const isActive = it.key === active;
          const Icon = it.icon;
          return (
            <button
              key={it.key}
              onClick={() => onChange(it.key)}
              className={cn(
                "tw-group tw-relative tw-flex tw-items-center tw-gap-3 tw-px-4 tw-py-3 tw-rounded-xl",
                "tw-text-[14px] tw-transition-all tw-duration-300",
                isActive
                  ? "tw-text-neuro-teal tw-bg-neuro-teal/[0.07] tw-shadow-neuro-glow"
                  : "tw-text-neuro-muted hover:tw-text-neuro-text hover:tw-bg-white/[0.02]"
              )}
            >
              { }
              <span
                className={cn(
                  "tw-absolute tw-left-0 tw-top-1/2 tw--translate-y-1/2 tw-w-[3px] tw-h-5 tw-rounded-r-full",
                  "tw-transition-all tw-duration-300",
                  isActive ? "tw-bg-neuro-teal tw-shadow-[0_0_10px_#00E6C8]" : "tw-bg-transparent"
                )}
              />
              <Icon className={cn("tw-w-[18px] tw-h-[18px]", isActive && "tw-drop-shadow-[0_0_6px_#00E6C8]")} strokeWidth={1.7} />
              <span className={cn("tw-font-medium tw-tracking-wide", isActive && "tw-font-semibold")}>
                {it.label}
              </span>
              {isActive && (
                <span className="tw-ml-auto tw-w-1.5 tw-h-1.5 tw-rounded-full tw-bg-neuro-teal tw-shadow-[0_0_8px_#00E6C8] tw-animate-pulse-soft" />
              )}
            </button>
          );
        })}
      </nav>

      {}
      <div className="tw-p-4 tw-border-t tw-border-neuro-border/60">
        <div className="tw-flex tw-items-center tw-gap-3 tw-px-3 tw-py-2.5 tw-rounded-xl tw-bg-white/[0.02]">
          <div className="tw-w-9 tw-h-9 tw-rounded-full tw-bg-gradient-to-br tw-from-neuro-teal/40 tw-to-neuro-gold/30
                          tw-flex tw-items-center tw-justify-center tw-text-[14px] tw-font-bold tw-text-neuro-text
                          tw-shadow-neuro-glow tw-border tw-border-neuro-teal/20">
            {(user?.full_name ?? "T").charAt(0)}
          </div>
          <div className="tw-flex-1 tw-min-w-0">
            <div className="tw-text-[13px] tw-font-semibold tw-text-neuro-text tw-truncate">
              {user?.full_name?.split(" ").slice(0, 2).join(" ") ?? "Вчитель"}
            </div>
            <div className="tw-text-[10.5px] tw-text-neuro-muted tw-uppercase tw-tracking-wider tw-truncate">
              {user?.subject ?? "Класний кер."}
            </div>
          </div>
        </div>
        <div className="tw-flex tw-gap-1 tw-mt-2">
          <button className="tw-flex-1 tw-py-2 tw-rounded-lg tw-text-neuro-muted hover:tw-text-neuro-text hover:tw-bg-white/[0.03]
                             tw-flex tw-items-center tw-justify-center tw-transition-colors">
            <Settings className="tw-w-4 tw-h-4" strokeWidth={1.6} />
          </button>
          <button
            onClick={onLogout}
            className="tw-flex-1 tw-py-2 tw-rounded-lg tw-text-neuro-muted hover:tw-text-neuro-coral hover:tw-bg-neuro-coral/[0.08]
                       tw-flex tw-items-center tw-justify-center tw-transition-colors"
          >
            <LogOut className="tw-w-4 tw-h-4" strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function MetricPod({
  label, value, suffix, percent, tone = "teal", icon: Icon, hint,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  percent: number;  
  tone?: "teal" | "gold" | "coral";
  icon: React.ElementType;
  hint?: string;
}) {
  const toneColor =
    tone === "gold"  ? "#E8B923" :
    tone === "coral" ? "#FF5E7A" : "#00E6C8";
  const glowClass =
    tone === "gold"  ? "tw-shadow-neuro-gold" :
    tone === "coral" ? "tw-shadow-neuro-coral" : "tw-shadow-neuro-glow";

 
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - (c * Math.max(0, Math.min(100, percent))) / 100;

  return (
    <div
      className={cn(
        "neuro-card-glow tw-relative tw-rounded-2xl tw-p-5 tw-bg-neuro-card",
        "tw-transition-all tw-duration-500 hover:tw--translate-y-0.5",
        "hover:" + glowClass, glowClass + "/40"
      )}
      style={{
        background: "linear-gradient(165deg, rgb(var(--neuro-card-rgb) / 0.95), rgb(var(--neuro-card-rgb) / 0.7))",
      }}
    >
      { }
      <div
        className="tw-absolute tw-inset-0 tw-rounded-2xl tw-pointer-events-none tw-opacity-40"
        style={{ background: `radial-gradient(ellipse at top left, ${toneColor}1A, transparent 60%)` }}
      />

      <div className="tw-relative tw-flex tw-items-start tw-justify-between">
        <div className="tw-flex tw-flex-col tw-gap-1">
          <div className="tw-flex tw-items-center tw-gap-2 tw-text-neuro-muted tw-text-[11px] tw-uppercase tw-tracking-[0.16em] tw-font-semibold">
            <Icon className="tw-w-3.5 tw-h-3.5" strokeWidth={1.8} style={{ color: toneColor }} />
            {label}
          </div>
          <div className="tw-flex tw-items-baseline tw-gap-1.5 tw-mt-2">
            <span className="tw-text-[34px] tw-font-bold tw-text-neuro-text tw-leading-none tw-tracking-tight"
                  style={{ textShadow: `0 0 22px ${toneColor}55` }}>
              {value}
            </span>
            {suffix && <span className="tw-text-[15px] tw-text-neuro-muted tw-font-medium">{suffix}</span>}
          </div>
          {hint && <div className="tw-text-[11.5px] tw-text-neuro-muted tw-mt-2 tw-tracking-wide">{hint}</div>}
        </div>

        { }
        <div className="tw-relative tw-w-[68px] tw-h-[68px] tw-flex tw-items-center tw-justify-center">
          <svg viewBox="0 0 64 64" className="tw-w-full tw-h-full tw--rotate-90">
            <circle cx="32" cy="32" r={r} fill="none" strokeWidth="4" className="neuro-ring-track" />
            <circle
              cx="32" cy="32" r={r} fill="none" strokeWidth="4"
              stroke={toneColor}
              strokeDasharray={c}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="neuro-ring-fill"
              style={{ color: toneColor }}
            />
          </svg>
          <span className="tw-absolute tw-text-[12px] tw-font-bold" style={{ color: toneColor }}>
            {Math.round(percent)}%
          </span>
        </div>
      </div>

      { }
      <div className="tw-relative tw-mt-4 tw-h-1.5 tw-rounded-full tw-bg-white/[0.04] tw-overflow-hidden">
        <div
          className="tw-h-full tw-rounded-full tw-transition-all tw-duration-700"
          style={{
            width: `${Math.max(2, percent)}%`,
            background: `linear-gradient(90deg, ${toneColor}, ${toneColor}99)`,
            boxShadow: `0 0 12px ${toneColor}99`,
          }}
        />
        <div className="tw-absolute tw-inset-0 neuro-shimmer tw-opacity-30 tw-pointer-events-none" />
      </div>
    </div>
  );
}

 
function SensorNode({
  value, label, source, icon: Icon, tone = "teal", isFirst = false, onClick,
}: {
  value: string | number;
  label: string;
  source: string;
  icon: React.ElementType;
  tone?: "teal" | "gold" | "coral";
  isFirst?: boolean;
  onClick?: () => void;
}) {
  const toneColor =
    tone === "gold"  ? "#E8B923" :
    tone === "coral" ? "#FF5E7A" : "#00E6C8";

  return (
    <div className="tw-relative tw-flex-1 tw-min-w-0">
      { }
      {!isFirst && (
        <div
          className="tw-absolute tw--left-3 tw-top-1/2 tw--translate-y-1/2 tw-h-px tw-w-6 neuro-connect"
          aria-hidden
        />
      )}

      <button
        onClick={onClick}
        title={source}
        className={cn(
          "tw-group tw-relative tw-w-full tw-rounded-xl tw-bg-neuro-card tw-border tw-border-neuro-border/60",
          "tw-p-4 tw-text-left tw-transition-all tw-duration-300",
          "hover:tw-border-neuro-teal/30 hover:tw--translate-y-0.5",
          onClick && "tw-cursor-pointer"
        )}
      >
        { }
        <div
          className="tw-absolute tw-inset-0 tw-rounded-xl tw-opacity-0 group-hover:tw-opacity-100 tw-transition-opacity tw-duration-500 tw-pointer-events-none"
          style={{ boxShadow: `0 0 24px ${toneColor}33, inset 0 0 18px ${toneColor}11` }}
        />

        <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2.5">
          <div
            className="tw-relative tw-w-7 tw-h-7 tw-rounded-lg tw-flex tw-items-center tw-justify-center"
            style={{ background: `${toneColor}14`, border: `1px solid ${toneColor}40` }}
          >
            <Icon className="tw-w-3.5 tw-h-3.5" strokeWidth={1.9} style={{ color: toneColor }} />
            <span className="tw-absolute tw-inset-0 tw-rounded-lg tw-animate-pulse-soft" style={{ boxShadow: `0 0 10px ${toneColor}66` }} />
          </div>
          <div className="tw-text-[10.5px] tw-uppercase tw-tracking-[0.14em] tw-text-neuro-muted tw-font-semibold">
            {label}
          </div>
        </div>
        <div
          className="tw-text-[22px] tw-font-bold tw-tracking-tight"
          style={{ color: toneColor, textShadow: `0 0 18px ${toneColor}55` }}
        >
          {value}
        </div>
        <div className="tw-text-[10.5px] tw-text-neuro-dim tw-mt-1.5 tw-tracking-wider">
          {source}
        </div>
      </button>
    </div>
  );
}

 
function NeuralTimeline({ data }: { data: number[] }) {
   
  const points = data.length > 0 ? data : Array(12).fill(50);
   
  const w = 100;  
  const h = 60;   
  const step = w / Math.max(1, points.length - 1);
  const polyPoints = points.map((v, i) => {
    const x = i * step;
    const y = h - (v / 100) * h;
    return `${x},${y}`;
  }).join(" ");
  const areaPath = `M 0,${h} L ${polyPoints.replace(/,/g, " ").split(" ").reduce((acc: string[], val, i) => {
    if (i % 2 === 0) acc.push(val);
    else acc[acc.length - 1] = `${acc[acc.length - 1]},${val}`;
    return acc;
  }, []).join(" L ")} L ${w},${h} Z`;

  const avg = Math.round(points.reduce((a, b) => a + b, 0) / points.length);

  return (
    <div className="neuro-card-glow tw-rounded-2xl tw-bg-neuro-card tw-p-6">
      <div className="tw-flex tw-items-start tw-justify-between tw-mb-4">
        <div>
          <div className="tw-flex tw-items-center tw-gap-2 tw-mb-1.5">
            <Activity className="tw-w-4 tw-h-4 tw-text-neuro-teal" strokeWidth={1.8} />
            <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.18em] tw-text-neuro-muted">
              Neural Activity Timeline
            </span>
            <span className="tw-w-1.5 tw-h-1.5 tw-rounded-full tw-bg-neuro-teal tw-animate-pulse-soft tw-shadow-[0_0_8px_#00E6C8]" />
          </div>
          <div className="tw-text-[15px] tw-font-medium tw-text-neuro-text/80">
            Увага класу впродовж уроку
          </div>
        </div>
        <div className="tw-text-right">
          <div className="tw-text-[28px] tw-font-bold tw-text-neuro-teal tw-leading-none"
               style={{ textShadow: "0 0 18px #00E6C880" }}>
            {avg}%
          </div>
          <div className="tw-text-[10.5px] tw-text-neuro-muted tw-uppercase tw-tracking-wider tw-mt-1">
            сер. за урок
          </div>
        </div>
      </div>

      { }
      <div className="tw-relative">
        <svg viewBox={`0 0 ${w} ${h + 8}`} preserveAspectRatio="none" className="tw-w-full tw-h-[140px]">
          <defs>
            <linearGradient id="neuro-waveFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#00E6C8" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#00E6C8" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#00E6C8" stopOpacity="0.00" />
            </linearGradient>
            <linearGradient id="neuro-waveStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#00E6C8" />
              <stop offset="50%"  stopColor="#E8B923" />
              <stop offset="100%" stopColor="#00E6C8" />
            </linearGradient>
            <filter id="neuro-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.8" />
            </filter>
          </defs>
          { }
          {[0.25, 0.5, 0.75].map((p) => (
            <line key={p} x1="0" x2={w} y1={h * p} y2={h * p}
                  stroke="rgba(255,255,255,0.04)" strokeDasharray="0.5 1" />
          ))}
          { }
          <path d={areaPath} fill="url(#neuro-waveFill)" />
          { }
          <polyline
            points={polyPoints}
            fill="none"
            stroke="url(#neuro-waveStroke)"
            strokeWidth="0.8"
            strokeLinejoin="round"
            strokeLinecap="round"
            filter="url(#neuro-glow)"
          />
          { }
          {points.map((v, i) => {
            const x = i * step;
            const y = h - (v / 100) * h;
            const color = v >= 70 ? "#00E6C8" : v >= 45 ? "#E8B923" : "#FF5E7A";
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="0.9" fill={color} />
                <circle cx={x} cy={y} r="2.2" fill={color} opacity="0.18" />
              </g>
            );
          })}
        </svg>

        { }
        <div className="tw-flex tw-justify-between tw-mt-2 tw-text-[10px] tw-text-neuro-muted tw-uppercase tw-tracking-wider">
          <span>початок</span>
          <span>середина</span>
          <span>кінець</span>
        </div>
      </div>

      { }
      <div className="tw-flex tw-items-end tw-gap-[3px] tw-mt-5 tw-h-10">
        {points.map((v, i) => {
          const color = v >= 70 ? "#00E6C8" : v >= 45 ? "#E8B923" : "#FF5E7A";
          return (
            <div
              key={i}
              className="tw-flex-1 tw-rounded-t-sm tw-origin-bottom tw-animate-wave-pulse"
              style={{
                height: `${Math.max(8, (v / 100) * 100)}%`,
                background: `linear-gradient(180deg, ${color}, ${color}55)`,
                boxShadow: `0 0 8px ${color}66`,
                animationDelay: `${i * 0.08}s`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

 
function PhrasePill({ children, tone = "teal" }: { children: React.ReactNode; tone?: "teal" | "gold" }) {
  const color = tone === "gold" ? "#E8B923" : "#00E6C8";
  return (
    <span
      className="tw-inline-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-rounded-full tw-text-[13px]
                 tw-font-medium tw-text-neuro-text/90 tw-transition-all tw-duration-300
                 hover:tw--translate-y-0.5 hover:tw-text-neuro-text tw-cursor-default"
      style={{
        background: `linear-gradient(135deg, ${color}14, transparent 80%)`,
        border: `1px solid ${color}33`,
        boxShadow: `inset 0 0 12px ${color}10`,
      }}
    >
      <span className="tw-w-1.5 tw-h-1.5 tw-rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      {children}
    </span>
  );
}

 
function LessonTabs({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: "lesson",    label: "Урок"      },
    { key: "test",      label: "Тест"      },
    { key: "analytics", label: "Аналітика" },
  ];
  return (
    <div className="tw-relative tw-inline-flex tw-items-center tw-gap-1 tw-p-1 tw-rounded-xl
                    tw-bg-neuro-card tw-border tw-border-neuro-border/60">
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              "tw-relative tw-px-5 tw-py-2 tw-rounded-lg tw-text-[13.5px] tw-font-medium",
              "tw-transition-all tw-duration-300",
              isActive
                ? "tw-bg-neuro-teal tw-shadow-[0_0_18px_rgba(0,230,200,0.55)]"
                : "tw-text-neuro-muted hover:tw-text-neuro-text"
            )}
            style={isActive ? { color: "#050507" } : undefined}
          >
            {t.label}
            {isActive && (
              <span className="tw-absolute tw-inset-0 tw-rounded-lg tw-animate-pulse-soft tw-pointer-events-none"
                    style={{ boxShadow: "0 0 18px #00E6C8" }} />
            )}
          </button>
        );
      })}
    </div>
  );
}


function VideoPlayer({ lessonId, hasVideo, title }: { lessonId: number; hasVideo: boolean; title: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const onTime = () => {
      if (v.duration) setProgress((v.currentTime / v.duration) * 100);
    };
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, []);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else          { v.pause(); setPlaying(false); }
  };

  return (
    <div className="neuro-card-glow tw-relative tw-rounded-2xl tw-overflow-hidden tw-bg-black
                    tw-shadow-[0_30px_80px_-20px_rgba(0,230,200,0.25)]">
      { }
      <div className="tw-absolute tw-top-0 tw-left-0 tw-right-0 tw-z-10 tw-p-6 tw-pb-12
                      tw-bg-gradient-to-b tw-from-black/80 tw-to-transparent tw-pointer-events-none">
        <div className="tw-flex tw-items-center tw-gap-2.5 tw-text-neuro-text">
          <span className="tw-w-1.5 tw-h-1.5 tw-rounded-full tw-bg-neuro-coral tw-animate-pulse-soft" />
          <span className="tw-text-[11px] tw-uppercase tw-tracking-[0.22em] tw-text-neuro-muted">Live recording</span>
        </div>
        <div className="tw-text-[20px] tw-font-semibold tw-mt-2 tw-text-neuro-text" style={{ textShadow: "0 2px 12px #000" }}>
          {title}
        </div>
      </div>

      <div className="tw-aspect-video tw-relative tw-w-full">
        {hasVideo ? (
          <video
            ref={ref}
            src={`/api/lessons/${lessonId}/video`}
            className="tw-w-full tw-h-full tw-object-cover neuro-video"
            playsInline
          />
        ) : (
          <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-bg-gradient-to-br tw-from-neuro-bg-2 tw-to-black">
            <div className="tw-text-center">
              <div className="tw-w-20 tw-h-20 tw-mx-auto tw-rounded-full tw-flex tw-items-center tw-justify-center
                              tw-bg-neuro-teal/[0.07] tw-border tw-border-neuro-teal/20 tw-shadow-neuro-glow tw-mb-4">
                <Eye className="tw-w-9 tw-h-9 tw-text-neuro-teal" strokeWidth={1.4} />
              </div>
              <div className="tw-text-neuro-muted tw-text-sm tw-uppercase tw-tracking-[0.16em]">
                Відео не завантажено для цього уроку
              </div>
            </div>
          </div>
        )}
      </div>

      { }
      <div className="tw-absolute tw-bottom-0 tw-left-0 tw-right-0 tw-p-5 tw-pt-12
                      tw-bg-gradient-to-t tw-from-black/90 tw-via-black/40 tw-to-transparent">
        { }
        <div className="tw-relative tw-h-1 tw-rounded-full tw-bg-white/10 tw-overflow-hidden tw-mb-4">
          <div
            className="tw-h-full tw-rounded-full tw-bg-gradient-to-r tw-from-neuro-teal tw-to-neuro-gold"
            style={{ width: `${progress}%`, boxShadow: "0 0 10px #00E6C8" }}
          />
        </div>
        <div className="tw-flex tw-items-center tw-gap-3">
          { }
          {[
            { key: "play",   icon: playing ? Pause : Play, onClick: toggle,                    disabled: !hasVideo, big: true },
            { key: "volume", icon: Volume2,                onClick: () => { const v = ref.current; if (v) v.muted = !v.muted; }, disabled: !hasVideo },
            { key: "full",   icon: Maximize2,              onClick: () => ref.current?.requestFullscreen?.(),                    disabled: !hasVideo },
          ].map((b) => {
            const Icon = b.icon;
            const size = b.big ? "tw-w-12 tw-h-12" : "tw-w-10 tw-h-10";
            const iconSize = b.big ? "tw-w-5 tw-h-5" : "tw-w-4 tw-h-4";
            return (
              <button
                key={b.key}
                onClick={b.onClick}
                disabled={b.disabled}
                className={cn(
                  size,
                  "tw-rounded-full tw-flex tw-items-center tw-justify-center tw-transition-all tw-duration-200",
                  "tw-text-neuro-teal disabled:tw-opacity-30 disabled:tw-cursor-not-allowed"
                )}
                style={{
                  background: "rgba(0,230,200,0.12)",
                  border: "1px solid rgba(0,230,200,0.40)",
                  boxShadow: "0 0 14px rgba(0,230,200,0.18), inset 0 0 12px rgba(0,230,200,0.06)",
                }}
                onMouseEnter={(e) => { if (!b.disabled) e.currentTarget.style.boxShadow = "0 0 24px rgba(0,230,200,0.55), inset 0 0 16px rgba(0,230,200,0.12)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 14px rgba(0,230,200,0.18), inset 0 0 12px rgba(0,230,200,0.06)"; }}
              >
                <Icon className={cn(iconSize, b.key === "play" && !playing && "tw-translate-x-0.5")} />
              </button>
            );
          })}
          <div className="tw-flex-1 tw-text-neuro-muted tw-text-[12px] tw-tracking-widest tw-text-right">
            {playing ? "PLAYING" : "READY"} · {Math.round(progress)}%
          </div>
        </div>
      </div>
    </div>
  );
}

 
function Header({ lesson, classLabel, onBack }: { lesson: Lesson; classLabel?: string; onBack: () => void }) {
  const title = lesson.topic ?? lesson.subject;
  const date = lesson.date?.slice(0, 10) ?? "";
  return (
    <div className="tw-flex tw-items-start tw-justify-between tw-gap-6 tw-mb-8">
      <div className="tw-flex tw-items-start tw-gap-4">
        <button
          onClick={onBack}
          className="tw-group tw-w-10 tw-h-10 tw-rounded-xl tw-flex tw-items-center tw-justify-center
                     tw-bg-neuro-card tw-border tw-border-neuro-border/60 tw-text-neuro-muted
                     hover:tw-text-neuro-teal hover:tw-border-neuro-teal/40 hover:tw-shadow-neuro-glow
                     tw-transition-all tw-duration-300"
        >
          <ArrowLeft className="tw-w-4 tw-h-4 group-hover:tw--translate-x-0.5 tw-transition-transform" strokeWidth={1.8} />
        </button>
        <div>
          <div className="tw-flex tw-items-center tw-gap-3 tw-mb-2">
            <span className="tw-text-[10.5px] tw-font-semibold tw-uppercase tw-tracking-[0.22em] tw-text-neuro-muted
                             tw-px-2.5 tw-py-1 tw-rounded-full tw-border tw-border-neuro-border/60 tw-bg-neuro-card">
              Урок · {lesson.subject}
            </span>
            {classLabel && (
              <span className="tw-text-[10.5px] tw-font-semibold tw-uppercase tw-tracking-[0.22em] tw-text-neuro-teal
                               tw-px-2.5 tw-py-1 tw-rounded-full tw-border tw-border-neuro-teal/40
                               tw-shadow-neuro-glow">
                {classLabel}
              </span>
            )}
            {date && (
              <span className="tw-text-[11px] tw-text-neuro-muted tw-tracking-wide">{date}</span>
            )}
          </div>
          <h1 className="tw-text-[34px] tw-font-bold tw-text-neuro-text tw-leading-tight tw-tracking-tight"
              style={{ textShadow: "0 0 30px rgba(0,230,200,0.20)" }}>
            {title}
          </h1>
        </div>
      </div>

      { }
      <div className="neuro-card-glow tw-flex tw-items-center tw-gap-2.5 tw-px-4 tw-py-2.5 tw-rounded-xl
                      tw-bg-neuro-card tw-border tw-border-neuro-teal/30">
        <Sparkles className="tw-w-4 tw-h-4 tw-text-neuro-teal tw-drop-shadow-[0_0_6px_#00E6C8] tw-animate-pulse-soft" strokeWidth={1.8} />
        <span className="tw-text-[12.5px] tw-text-neuro-text/80 tw-font-medium tw-tracking-wide">AI Analysis ready</span>
      </div>
    </div>
  );
}

 
function VideoUploader({ lessonId, hasVideo, onUploaded }: { lessonId: number; hasVideo: boolean; onUploaded?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      await client.post(`/api/lessons/${lessonId}/upload`, fd);
      setMsg("Відео завантажено. Транскрипт генерується у фоні...");
      setFile(null);
 
      onUploaded?.();
    } catch {
      setMsg("Помилка завантаження");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="neuro-card-glow tw-rounded-2xl tw-bg-neuro-card tw-p-5">
      <div className="tw-flex tw-items-center tw-gap-2 tw-mb-4">
        <Upload className="tw-w-4 tw-h-4 tw-text-neuro-teal" strokeWidth={1.8} />
        <span className="tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-[0.20em] tw-text-neuro-muted">
          {hasVideo ? "Замінити відео" : "Завантажити відео уроку"}
        </span>
      </div>

      <label
        htmlFor={`video-upload-${lessonId}`}
        className="tw-flex tw-items-center tw-gap-3 tw-p-4 tw-rounded-xl tw-cursor-pointer tw-transition-all"
        style={{
          border: `1.5px dashed ${file ? "#00E6C8" : "rgba(0,230,200,0.30)"}`,
          background: file ? "rgba(0,230,200,0.07)" : "rgba(0,230,200,0.03)",
        }}
      >
        <span
          className="tw-inline-flex tw-items-center tw-gap-1.5 tw-px-4 tw-py-2 tw-rounded-lg tw-text-[12.5px] tw-font-bold tw-whitespace-nowrap"
          style={{
            background: "linear-gradient(135deg, #00E6C8, #00C9AE)",
            color: "#050507",
            boxShadow: "0 0 16px rgba(0,230,200,0.35)",
          }}
        >
          <Upload className="tw-w-3.5 tw-h-3.5" strokeWidth={2.2} />
          Обрати файл
        </span>
        <span className="tw-text-[13.5px] tw-flex-1 tw-truncate"
              style={{ color: file ? "#E8EAF0" : "#7A7E8F", fontWeight: file ? 600 : 400 }}>
          {file ? file.name : "Файл не обраний · mp4 / mov / mp3"}
        </span>
        <input
          id={`video-upload-${lessonId}`}
          type="file"
          accept="video/*,audio/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          style={{ display: "none" }}
        />
      </label>

      {file && (
        <button
          onClick={upload}
          disabled={uploading}
          className="tw-mt-3 tw-w-full tw-py-3 tw-rounded-xl tw-text-[14px] tw-font-bold
                     tw-flex tw-items-center tw-justify-center tw-gap-2 tw-transition-all tw-duration-200
                     disabled:tw-opacity-60 disabled:tw-cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg, #00E6C8, #00C9AE)",
            color: "#050507",
            boxShadow: "0 0 0 1px rgba(0,230,200,0.40), 0 6px 22px rgba(0,230,200,0.32)",
          }}
        >
          {uploading ? <span className="spinner" /> : (
            <>
              <Upload className="tw-w-4 tw-h-4" strokeWidth={2.2} />
              Завантажити відео
            </>
          )}
        </button>
      )}

      {msg && (
        <div className="tw-mt-3 tw-px-4 tw-py-2.5 tw-rounded-lg tw-text-[13px] tw-font-medium tw-flex tw-items-center tw-gap-2"
             style={{
               background: msg.includes("Помилка") ? "rgba(255,94,122,0.10)" : "rgba(0,230,200,0.10)",
               color:      msg.includes("Помилка") ? "#FF8FA3" : "#00E6C8",
               border:     `1px solid ${msg.includes("Помилка") ? "rgba(255,94,122,0.30)" : "rgba(0,230,200,0.30)"}`,
             }}>
          {msg.includes("Помилка") ? <AlertCircle className="tw-w-4 tw-h-4" /> : <CheckCircle2 className="tw-w-4 tw-h-4" />}
          {msg}
        </div>
      )}
    </div>
  );
}


 
function TranscriptEditor({ lessonId, initial, onSaved }: { lessonId: number; initial: string; onSaved?: () => void }) {
  const [text, setText] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const dirty = text !== initial;
 
  useEffect(() => { setText(initial); }, [initial]);

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      await client.patch(`/api/lessons/${lessonId}/transcript`, { transcript: text });
      setMsg("Транскрипт збережено. AI-аналіз перезапущено.");
      onSaved?.();
    } catch {
      setMsg("Помилка збереження");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="neuro-card-glow tw-rounded-2xl tw-bg-neuro-card tw-p-5">
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
        <div className="tw-flex tw-items-center tw-gap-2">
          <FileText className="tw-w-4 tw-h-4 tw-text-neuro-teal" strokeWidth={1.8} />
          <span className="tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-[0.20em] tw-text-neuro-muted">
            Транскрипція уроку
          </span>
          {!!text && (
            <span className="tw-text-[10.5px] tw-text-neuro-dim tw-ml-2">
              {text.length} симв · {text.trim().split(/\s+/).filter(Boolean).length} слів
            </span>
          )}
        </div>
        {dirty && (
          <span className="tw-text-[10.5px] tw-text-neuro-gold tw-uppercase tw-tracking-wider tw-font-semibold">
            Не збережено
          </span>
        )}
      </div>

      <textarea
        rows={10}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Транскрипт з'явиться автоматично після завантаження відео, або ти можеш ввести/редагувати його вручну тут..."
        style={{ fontSize: "14px", lineHeight: 1.65, resize: "vertical", fontFamily: "inherit" }}
      />

      <div className="tw-flex tw-items-center tw-gap-3 tw-mt-4">
        <button
          onClick={save}
          disabled={saving || !dirty}
          className="tw-inline-flex tw-items-center tw-gap-2 tw-px-5 tw-py-2.5 tw-rounded-lg tw-text-[13.5px] tw-font-bold
                     tw-transition-all tw-duration-200 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg, #00E6C8, #00C9AE)",
            color: "#050507",
            boxShadow: dirty ? "0 0 0 1px rgba(0,230,200,0.40), 0 4px 18px rgba(0,230,200,0.32)" : "none",
          }}
        >
          {saving ? <span className="spinner" /> : <Save className="tw-w-3.5 tw-h-3.5" strokeWidth={2.2} />}
          Зберегти транскрипт
        </button>
        {msg && (
          <span className="tw-text-[12.5px]" style={{ color: msg.includes("Помилка") ? "#FF8FA3" : "#5BE39A" }}>
            {msg}
          </span>
        )}
      </div>
    </div>
  );
}

 
interface TestQuestion { question: string; options: string[]; correct_index: number; explanation?: string; }

function TestEditor({ lessonId }: { lessonId: number }) {
  const [qs, setQs] = useState<TestQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    setLoading(true);
    client.get(`/api/tests/lesson/${lessonId}`)
      .then((r) => {
        const t = (r.data ?? [])[0];
        if (t?.questions) setQs(t.questions);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [lessonId]);

  const generate = async () => {
    setGenerating(true);
    setMsg(null);
    try {
      const { data } = await client.post(`/api/tests/generate/${lessonId}`);
      const items: TestQuestion[] = Array.isArray(data?.questions) ? data.questions : (Array.isArray(data) ? data : []);
      if (items.length === 0) {
        setMsg({ text: "AI повернув порожній результат — перевір транскрипт", ok: false });
      } else {
        setQs(items);
        setMsg({ text: `Згенеровано ${items.length} питань на основі транскрипту`, ok: true });
      }
    } catch {
      setMsg({ text: "Помилка генерації — транскрипт порожній або проблема з AI", ok: false });
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await client.post(`/api/tests/save/${lessonId}`, { questions: qs });
      setMsg({ text: "Тест збережено", ok: true });
    } catch {
      setMsg({ text: "Помилка збереження", ok: false });
    } finally {
      setSaving(false);
    }
  };

  const send = async () => {
    setSending(true);
    setMsg(null);
    try {
 
      await client.post(`/api/tests/save/${lessonId}`, { questions: qs });
      await client.patch(`/api/lessons/${lessonId}/access`, { student_access: true });
      setMsg({ text: "Тест надіслано учням класу", ok: true });
    } catch {
      setMsg({ text: "Помилка надсилання", ok: false });
    } finally {
      setSending(false);
    }
  };

  const updateQ = (i: number, patch: Partial<TestQuestion>) => {
    setQs((arr) => arr.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  };
  const updateOpt = (qi: number, oi: number, value: string) => {
    setQs((arr) => arr.map((q, idx) => idx === qi ? { ...q, options: q.options.map((o, j) => j === oi ? value : o) } : q));
  };
  const removeQ = (i: number) => setQs((arr) => arr.filter((_, idx) => idx !== i));
  const addQ = () => setQs((arr) => [...arr, { question: "", options: ["", "", "", ""], correct_index: 0, explanation: "" }]);

  if (loading) {
    return (
      <div className="neuro-card-glow tw-rounded-2xl tw-bg-neuro-card tw-p-12 tw-text-center">
        <span className="spinner" />
      </div>
    );
  }

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      { }
      <div className="neuro-card-glow tw-rounded-2xl tw-bg-neuro-card tw-p-4 tw-flex tw-flex-wrap tw-items-center tw-gap-3">
        <button
          onClick={generate}
          disabled={generating}
          className="tw-inline-flex tw-items-center tw-gap-2 tw-px-5 tw-py-2.5 tw-rounded-lg tw-text-[13.5px] tw-font-bold
                     tw-transition-all tw-duration-200 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg, #E8B923, #CDA01D)",
            color: "#050507",
            boxShadow: "0 0 0 1px rgba(232,185,35,0.40), 0 4px 18px rgba(232,185,35,0.30)",
          }}
        >
          {generating ? <span className="spinner" /> : <Wand2 className="tw-w-3.5 tw-h-3.5" strokeWidth={2.2} />}
          Згенерувати з транскрипту
        </button>

        <button
          onClick={save}
          disabled={saving || qs.length === 0}
          className="tw-inline-flex tw-items-center tw-gap-2 tw-px-5 tw-py-2.5 tw-rounded-lg tw-text-[13.5px] tw-font-bold
                     tw-transition-all tw-duration-200 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
          style={{
            background: "rgba(0,230,200,0.10)",
            color: "#00E6C8",
            border: "1px solid rgba(0,230,200,0.40)",
          }}
        >
          {saving ? <span className="spinner" /> : <Save className="tw-w-3.5 tw-h-3.5" strokeWidth={2.2} />}
          Зберегти тест
        </button>

        <button
          onClick={send}
          disabled={sending || qs.length === 0}
          className="tw-inline-flex tw-items-center tw-gap-2 tw-px-5 tw-py-2.5 tw-rounded-lg tw-text-[13.5px] tw-font-bold
                     tw-transition-all tw-duration-200 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg, #00E6C8, #00C9AE)",
            color: "#050507",
            boxShadow: "0 0 0 1px rgba(0,230,200,0.50), 0 6px 22px rgba(0,230,200,0.42)",
          }}
        >
          {sending ? <span className="spinner" /> : <Send className="tw-w-3.5 tw-h-3.5" strokeWidth={2.2} />}
          Надіслати учням
        </button>

        <div className="tw-flex-1" />
        <button
          onClick={addQ}
          className="tw-inline-flex tw-items-center tw-gap-1.5 tw-px-4 tw-py-2 tw-rounded-lg tw-text-[12.5px] tw-font-semibold
                     tw-text-neuro-muted hover:tw-text-neuro-teal tw-transition-colors"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}
        >
          <Plus className="tw-w-3.5 tw-h-3.5" strokeWidth={2.2} />
          Додати питання
        </button>
      </div>

      {msg && (
        <div className="tw-rounded-xl tw-px-4 tw-py-3 tw-text-[13px] tw-font-medium tw-flex tw-items-center tw-gap-2"
             style={{
               background: msg.ok ? "rgba(0,230,200,0.10)" : "rgba(255,94,122,0.10)",
               color:      msg.ok ? "#00E6C8" : "#FF8FA3",
               border:     `1px solid ${msg.ok ? "rgba(0,230,200,0.30)" : "rgba(255,94,122,0.30)"}`,
             }}>
          {msg.ok ? <CheckCircle2 className="tw-w-4 tw-h-4" /> : <AlertCircle className="tw-w-4 tw-h-4" />}
          {msg.text}
        </div>
      )}

      { }
      {qs.length === 0 && (
        <div className="neuro-card-glow tw-rounded-2xl tw-bg-neuro-card tw-p-10 tw-text-center">
          <ListChecks className="tw-w-10 tw-h-10 tw-text-neuro-teal tw-mx-auto tw-mb-4" strokeWidth={1.4} />
          <div className="tw-text-[16px] tw-text-neuro-text tw-font-semibold tw-mb-2">Тест ще не створено</div>
          <div className="tw-text-[13px] tw-text-neuro-muted">
            Натисни «Згенерувати з транскрипту» — AI створить питання на основі тексту уроку.
          </div>
        </div>
      )}

      { }
      {qs.map((q, i) => (
        <div key={i} className="neuro-card-glow tw-rounded-2xl tw-bg-neuro-card tw-p-5">
          <div className="tw-flex tw-items-start tw-justify-between tw-mb-3">
            <span className="tw-text-[10.5px] tw-font-bold tw-uppercase tw-tracking-[0.18em] tw-text-neuro-teal">
              Питання {i + 1}
            </span>
            <button onClick={() => removeQ(i)} className="tw-text-neuro-muted hover:tw-text-neuro-coral tw-transition-colors">
              <Trash2 className="tw-w-4 tw-h-4" strokeWidth={1.8} />
            </button>
          </div>
          <input
            value={q.question}
            onChange={(e) => updateQ(i, { question: e.target.value })}
            placeholder="Текст питання..."
            style={{ marginBottom: "12px", fontSize: "14.5px" }}
          />
          <div className="tw-grid tw-grid-cols-2 tw-gap-2">
            {q.options.map((opt, oi) => {
              const correct = q.correct_index === oi;
              return (
                <div key={oi} className="tw-relative">
                  <button
                    onClick={() => updateQ(i, { correct_index: oi })}
                    title={correct ? "Правильна відповідь" : "Зробити правильною"}
                    className="tw-absolute tw-left-2.5 tw-top-1/2 tw--translate-y-1/2 tw-w-6 tw-h-6 tw-rounded-full
                               tw-flex tw-items-center tw-justify-center tw-transition-all"
                    style={{
                      background: correct ? "linear-gradient(135deg, #00E6C8, #00C9AE)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${correct ? "#00E6C8" : "var(--border)"}`,
                      boxShadow: correct ? "0 0 12px rgba(0,230,200,0.55)" : "none",
                      color: correct ? "#050507" : "#7A7E8F",
                    }}
                  >
                    {correct ? <CheckCircle2 className="tw-w-3.5 tw-h-3.5" strokeWidth={2.4} /> : <span className="tw-text-[11px] tw-font-bold">{String.fromCharCode(65 + oi)}</span>}
                  </button>
                  <input
                    value={opt}
                    onChange={(e) => updateOpt(i, oi, e.target.value)}
                    placeholder={`Варіант ${String.fromCharCode(65 + oi)}`}
                    style={{ paddingLeft: "44px", fontSize: "14px" }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

 
function LessonAnalyticsView({ lessonId }: { lessonId: number }) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    client.get(`/api/tests/lesson/${lessonId}/analytics`)
      .then((r) => {
 
        if (r.data?.has_data) {
 
          const mock = MOCK_LESSON_ANALYTICS[String(lessonId)];
          setData({ ...mock, ...r.data });
        } else {
          setData(MOCK_LESSON_ANALYTICS[String(lessonId)] ?? null);
        }
      })
      .catch(() => setData(MOCK_LESSON_ANALYTICS[String(lessonId)] ?? null))
      .finally(() => setLoading(false));
  }, [lessonId]);

  if (loading) {
    return (
      <div className="neuro-card-glow tw-rounded-2xl tw-bg-neuro-card tw-p-12 tw-text-center">
        <span className="spinner" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="neuro-card-glow tw-rounded-2xl tw-bg-neuro-card tw-p-10 tw-text-center">
        <Activity className="tw-w-10 tw-h-10 tw-text-neuro-muted tw-mx-auto tw-mb-3" strokeWidth={1.4} />
        <div className="tw-text-[15px] tw-text-neuro-text tw-font-semibold tw-mb-1">Аналітика недоступна</div>
        <div className="tw-text-[13px] tw-text-neuro-muted">Жоден учень ще не пройшов тест по цьому уроку.</div>
      </div>
    );
  }

  const maxDist = Math.max(...Object.values(data.distribution ?? {}).map(Number));

  return (
    <div className="tw-flex tw-flex-col tw-gap-5">
      { }
      <div className="tw-grid tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
        {[
          { l: "Здали тест",      v: data.total_submissions,                  tone: "#00E6C8" },
          { l: "Середній бал",    v: `${data.average_grade_12}/12`,            tone: "#00E6C8" },
          { l: "Найкращий",       v: `${Math.round(data.best ?? 0)}%`,         tone: "#5BE39A" },
          { l: "Слабкий",         v: `${Math.round(data.worst ?? 0)}%`,        tone: "#FF5E7A" },
        ].map((m, i) => (
          <div key={i} className="neuro-card-glow tw-rounded-2xl tw-bg-neuro-card tw-p-5"
               style={{ background: `linear-gradient(165deg, ${m.tone}14, rgb(var(--neuro-card-rgb) / 0.7))` }}>
            <div className="tw-text-[10.5px] tw-font-bold tw-uppercase tw-tracking-[0.18em] tw-text-neuro-muted tw-mb-2">{m.l}</div>
            <div className="tw-text-[28px] tw-font-bold" style={{ color: m.tone, textShadow: `0 0 20px ${m.tone}55` }}>{m.v}</div>
          </div>
        ))}
      </div>

      { }
      {data.aiSummary && (
        <div className="neuro-card-glow tw-rounded-2xl tw-bg-neuro-card tw-p-6"
             style={{ borderLeft: "3px solid #00E6C8" }}>
          <div className="tw-flex tw-items-center tw-gap-2 tw-mb-3">
            <Sparkles className="tw-w-4 tw-h-4 tw-text-neuro-teal tw-animate-pulse-soft" strokeWidth={1.8} />
            <span className="tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-[0.18em] tw-text-neuro-teal">AI-резюме</span>
          </div>
          <p className="tw-text-[14.5px] tw-text-neuro-text/90 tw-leading-relaxed">{data.aiSummary}</p>
        </div>
      )}

      { }
      <div className="neuro-card-glow tw-rounded-2xl tw-bg-neuro-card tw-p-6">
        <div className="tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-[0.18em] tw-text-neuro-muted tw-mb-4">
          Розподіл оцінок (12-бальна)
        </div>
        <div className="tw-flex tw-items-end tw-gap-1.5 tw-h-[120px]">
          {Object.entries(data.distribution ?? {}).map(([g, n]) => {
            const num = Number(n);
            const h = maxDist ? Math.max(6, (num / maxDist) * 100) : 6;
            const gn = Number(g);
            const color = gn >= 10 ? "#5BE39A" : gn >= 7 ? "#E8B923" : gn >= 4 ? "#FF8FA3" : "#FF5E7A";
            return (
              <div key={g} className="tw-flex-1 tw-flex tw-flex-col tw-items-center tw-gap-1.5">
                <div className="tw-text-[11px] tw-font-bold" style={{ color: num > 0 ? color : "#4A4E5D" }}>{num || ""}</div>
                <div className="tw-w-full tw-rounded-t-md tw-transition-all" style={{
                  height: `${h}%`,
                  background: num > 0 ? `linear-gradient(180deg, ${color}, ${color}55)` : "rgba(255,255,255,0.04)",
                  boxShadow: num > 0 ? `0 0 12px ${color}55` : "none",
                }} />
                <div className="tw-text-[11px] tw-text-neuro-muted tw-font-semibold">{g}</div>
              </div>
            );
          })}
        </div>
      </div>

      { }
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4">
        {data.topSkills?.length > 0 && (
          <div className="neuro-card-glow tw-rounded-2xl tw-bg-neuro-card tw-p-6">
            <div className="tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-[0.18em] tw-text-neuro-muted tw-mb-4">
              Засвоєння навичок
            </div>
            <div className="tw-flex tw-flex-col tw-gap-3">
              {data.topSkills.map((s: any, i: number) => {
                const color = s.level >= 70 ? "#00E6C8" : s.level >= 45 ? "#E8B923" : "#FF5E7A";
                return (
                  <div key={i}>
                    <div className="tw-flex tw-justify-between tw-mb-1.5">
                      <span className="tw-text-[13.5px] tw-text-neuro-text">{s.name}</span>
                      <span className="tw-text-[13px] tw-font-bold" style={{ color }}>{s.level}%</span>
                    </div>
                    <div className="tw-h-1.5 tw-rounded-full tw-overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="tw-h-full tw-rounded-full" style={{
                        width: `${s.level}%`,
                        background: `linear-gradient(90deg, ${color}, ${color}99)`,
                        boxShadow: `0 0 8px ${color}99`,
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {data.commonErrors?.length > 0 && (
          <div className="neuro-card-glow tw-rounded-2xl tw-bg-neuro-card tw-p-6">
            <div className="tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-[0.18em] tw-text-neuro-muted tw-mb-4">
              Типові помилки
            </div>
            <div className="tw-flex tw-flex-col tw-gap-2">
              {data.commonErrors.map((err: string, i: number) => (
                <div key={i} className="tw-flex tw-items-start tw-gap-2.5 tw-p-3 tw-rounded-lg"
                     style={{ background: "rgba(255,94,122,0.06)", border: "1px solid rgba(255,94,122,0.18)" }}>
                  <AlertCircle className="tw-w-4 tw-h-4 tw-text-neuro-coral tw-flex-shrink-0 tw-mt-0.5" strokeWidth={1.8} />
                  <span className="tw-text-[13.5px] tw-text-neuro-text/90">{err}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      { }
      <StudentLessonResponsesPanel lessonId={lessonId} />
    </div>
  );
}

  
function StudentLessonResponsesPanel({ lessonId }: { lessonId: number }) {
  const [openStudent, setOpenStudent] = useState<number | null>(null);
  const [rows, setRows] = useState<{ student: any; bundle: any }[]>([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    setLoading(true);
    client.get(`/api/lessons/${lessonId}/responses`)
      .then((r) => {
        const out = (r.data ?? []).map((b: any) => ({
          student: { id: b.student_id, name: b.student_name, className: "10А" },
          bundle: {
            lessonDate: "",
            totalAccuracy: b.totalAccuracy,
            responses: b.responses,
            skillsAffected: b.skillsAffected ?? {},
          },
        }));
        setRows(out);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [lessonId]);

  if (loading) return null;
  if (rows.length === 0) return null;

  const cl = (acc: number) => acc >= 80 ? "#5BE39A" : acc >= 50 ? "#E8B923" : "#FF5E7A";

  if (openStudent != null) {
    const row = rows.find((r) => r.student.id === openStudent);
    if (!row) return null;
    const { student, bundle } = row;
    return (
      <div className="neuro-card-glow tw-rounded-2xl tw-bg-neuro-card tw-p-6">
        <button
          onClick={() => setOpenStudent(null)}
          className="tw-text-neuro-teal tw-font-semibold tw-text-[13px] tw-mb-4 tw-inline-flex tw-items-center tw-gap-1.5"
        >
          <ArrowLeft className="tw-w-3.5 tw-h-3.5" strokeWidth={2.2} />
          До списку учнів
        </button>
        <div className="tw-flex tw-items-center tw-justify-between tw-mb-5">
          <div>
            <div className="tw-text-[18px] tw-font-bold tw-text-neuro-text">{student.name}</div>
            <div className="tw-text-[12px] tw-text-neuro-muted tw-mt-1">Клас {student.className} · {bundle.lessonDate}</div>
          </div>
          <div className="tw-text-right">
            <div className="tw-text-[32px] tw-font-bold" style={{ color: cl(bundle.totalAccuracy), textShadow: `0 0 20px ${cl(bundle.totalAccuracy)}55` }}>
              {bundle.totalAccuracy}%
            </div>
            <div className="tw-text-[11px] tw-text-neuro-muted tw-uppercase tw-tracking-wider">загальна точність</div>
          </div>
        </div>
        <div className="tw-flex tw-flex-col tw-gap-2.5">
          {bundle.responses.map((r: any, i: number) => (
            <div key={i} className="tw-rounded-xl tw-p-4"
                 style={{ background: "rgba(255,255,255,0.02)", borderLeft: `3px solid ${r.isCorrect ? "#5BE39A" : "#FF5E7A"}` }}>
              <div className="tw-text-[12px] tw-text-neuro-muted tw-mb-1.5">Питання {i+1}</div>
              <div className="tw-text-[14px] tw-font-semibold tw-text-neuro-text tw-mb-2">{r.q}</div>
              <div className="tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-1 tw-text-[13px]">
                <span style={{ color: r.isCorrect ? "#5BE39A" : "#FF5E7A" }}>
                  Відповідь: <strong>{r.given}</strong>
                </span>
                {!r.isCorrect && (
                  <span style={{ color: "#5BE39A" }}>
                    Правильна: <strong>{r.correct}</strong>
                  </span>
                )}
                <span className="tw-text-neuro-muted tw-ml-auto">{r.accuracy}% точно</span>
              </div>
            </div>
          ))}
        </div>
        { }
        {bundle.skillsAffected && Object.keys(bundle.skillsAffected).length > 0 && (
          <div className="tw-mt-5 tw-pt-4 tw-border-t tw-border-neuro-border/50">
            <div className="tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-[0.16em] tw-text-neuro-muted tw-mb-3">
              Вплив на профіль учня
            </div>
            <div className="tw-flex tw-flex-wrap tw-gap-2">
              {Object.entries(bundle.skillsAffected).map(([skill, delta]) => {
                const num = Number(delta);
                const up = num > 0;
                return (
                  <span key={skill} className="tw-inline-flex tw-items-center tw-gap-1.5 tw-px-3 tw-py-1.5 tw-rounded-full tw-text-[12px] tw-font-semibold"
                        style={{ background: up ? "rgba(91,227,154,0.10)" : "rgba(255,94,122,0.10)", color: up ? "#5BE39A" : "#FF5E7A", border: `1px solid ${up ? "rgba(91,227,154,0.30)" : "rgba(255,94,122,0.30)"}` }}>
                    {skill} {up ? "+" : ""}{(num * 100).toFixed(0)}%
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="neuro-card-glow tw-rounded-2xl tw-bg-neuro-card tw-p-6">
      <div className="tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-[0.18em] tw-text-neuro-muted tw-mb-4">
        Відповіді учнів на уроці ({rows.length})
      </div>
      <div className="tw-flex tw-flex-col tw-gap-2">
        {rows.map(({ student, bundle }) => {
          const color = cl(bundle.totalAccuracy);
          const correctCount = bundle.responses.filter((r: any) => r.isCorrect).length;
          return (
            <button
              key={student.id}
              onClick={() => setOpenStudent(student.id)}
              className="tw-w-full tw-flex tw-items-center tw-gap-4 tw-p-3.5 tw-rounded-xl tw-text-left tw-transition-all"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,230,200,0.04)"; e.currentTarget.style.borderColor = "rgba(0,230,200,0.20)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              <div className="tw-w-9 tw-h-9 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-text-[14px] tw-font-bold"
                   style={{ background: `${color}18`, color, border: `1px solid ${color}44` }}>
                {student.name.charAt(0)}
              </div>
              <div className="tw-flex-1 tw-min-w-0">
                <div className="tw-text-[14px] tw-font-semibold tw-text-neuro-text tw-truncate">{student.name}</div>
                <div className="tw-text-[11.5px] tw-text-neuro-muted tw-mt-0.5">
                  {correctCount} / {bundle.responses.length} правильних · клас {student.className}
                </div>
              </div>
              <div className="tw-text-right">
                <div className="tw-text-[18px] tw-font-bold" style={{ color, textShadow: `0 0 12px ${color}55` }}>
                  {bundle.totalAccuracy}%
                </div>
                <div className="tw-text-[10px] tw-text-neuro-muted tw-uppercase tw-tracking-wider">точність</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

 
export default function NeuroLessonView({
  lesson, className, onBack, user, onLogout, activeNav = "lessons", onNavChange,
}: NeuroLessonViewProps) {
  const [tab, setTab] = useState<TabKey>("lesson");
  const [sensor, setSensor] = useState<SensorData | null>(null);
  const [audioCount, setAudioCount] = useState<number | null>(null);
  
  const [currentLesson, setCurrentLesson] = useState<Lesson>(lesson);
  useEffect(() => { setCurrentLesson(lesson); }, [lesson]);
 
  const refreshLesson = async () => {
    try {
      const r = await client.get(`/api/lessons/${lesson.id}`);
      if (r.data) setCurrentLesson(r.data);
    } catch {}
  };
 
  useEffect(() => {
    let cancel = false;
    setSensor(null);
    client.get(`/api/lessons/${lesson.id}/sensors`)
      .then((r) => { if (!cancel) setSensor(r.data); })
      .catch(() => { if (!cancel) setSensor(null); });
    client.get(`/api/lessons/${lesson.id}/audio_events`)
      .then((r) => { if (!cancel) setAudioCount((r.data ?? []).length); })
      .catch(() => { if (!cancel) setAudioCount(null); });
    return () => { cancel = true; };
  }, [lesson.id]);

  
  useEffect(() => {
    const t = currentLesson.transcript ?? "";
    const needsPoll = !!currentLesson.video_path && (!t.trim() || t.startsWith("[ПОМИЛКА"));
    if (!needsPoll) return;
    const id = setInterval(refreshLesson, 5000);
    return () => clearInterval(id);
     
  }, [currentLesson.video_path, currentLesson.transcript]);

  const metrics = useMemo(() => ({
    engagement: Math.round(currentLesson.avg_engagement ?? 0),
    fatigue:    Math.round(currentLesson.avg_fatigue ?? 0),
    answers:    `${currentLesson.answers_given ?? 0}/${currentLesson.answers_total ?? 0}`,
    answersPct: currentLesson.answers_total ? Math.round(((currentLesson.answers_given ?? 0) / currentLesson.answers_total) * 100) : 0,
    testScore:  Math.round(currentLesson.avg_engagement ?? 0),
  }), [currentLesson]);

  const phrases = (currentLesson.key_terms && currentLesson.key_terms.length > 0)
    ? currentLesson.key_terms
    : (sensor?.video_keywords ?? []).slice(0, 8);

  return (
    <div className="tw-min-h-screen tw-text-neuro-text tw-font-sans">
      <Sidebar
        active={activeNav}
        onChange={(k) => onNavChange?.(k)}
        user={user}
        onLogout={onLogout}
      />

      <main className="tw-ml-[228px] tw-px-10 tw-py-9 tw-max-w-[1480px]">
        <Header lesson={currentLesson} classLabel={className} onBack={onBack} />

        { }
        <div className="tw-grid tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4 tw-mb-9">
          <MetricPod
            label="Залученість"
            value={metrics.engagement}
            suffix="%"
            percent={metrics.engagement}
            tone="teal"
            icon={Brain}
            hint="середня по класу"
          />
          <MetricPod
            label="Втома"
            value={metrics.fatigue}
            suffix="%"
            percent={metrics.fatigue}
            tone={metrics.fatigue > 60 ? "coral" : "gold"}
            icon={Activity}
            hint="кінець уроку"
          />
          <MetricPod
            label="Відповіді"
            value={metrics.answers}
            percent={metrics.answersPct}
            tone="teal"
            icon={Users}
            hint="залученість аудиторії"
          />
          <MetricPod
            label="Тест"
            value={metrics.testScore}
            suffix="%"
            percent={metrics.testScore}
            tone={metrics.testScore >= 70 ? "teal" : metrics.testScore >= 45 ? "gold" : "coral"}
            icon={ListChecks}
            hint="середній бал"
          />
        </div>

        { }
        <section className="tw-mb-9">
          <div className="tw-flex tw-items-center tw-gap-3 tw-mb-5">
            <span className="tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-[0.22em] tw-text-neuro-muted">
              Дані з датчиків класу
            </span>
            <span className="tw-flex-1 tw-h-px tw-bg-gradient-to-r tw-from-neuro-border/60 tw-to-transparent" />
            <span className="tw-text-[10.5px] tw-text-neuro-dim tw-tracking-wider">
              {sensor ? "LIVE" : "—"}
            </span>
          </div>
          <div className="tw-flex tw-gap-3 tw-flex-wrap lg:tw-flex-nowrap">
            <SensorNode
              isFirst
              icon={Brain}
              label="Увага"
              value={`${sensor?.avg_attention ?? "—"}${sensor?.avg_attention != null ? "%" : ""}`}
              source="Термокамера"
              tone="teal"
            />
            <SensorNode
              icon={ThermometerSun}
              label="Температура"
              value={`${sensor?.avg_temperature ?? "—"}${sensor?.avg_temperature != null ? "°C" : ""}`}
              source="Термостат"
              tone={(sensor?.avg_temperature != null && (sensor.avg_temperature < 20 || sensor.avg_temperature > 24)) ? "coral" : "teal"}
            />
            <SensorNode
              icon={Droplets}
              label="Вологість"
              value={`${sensor?.avg_humidity ?? "—"}${sensor?.avg_humidity != null ? "%" : ""}`}
              source="Гігрометр"
              tone={(sensor?.avg_humidity != null && (sensor.avg_humidity < 40 || sensor.avg_humidity > 60)) ? "gold" : "teal"}
            />
            <SensorNode
              icon={Mic}
              label="Голосові події"
              value={String(sensor?.audio_events_count ?? audioCount ?? 0)}
              source="Мікрофон"
              tone="gold"
            />
          </div>
        </section>

        { }
        <section className="tw-mb-9">
          <NeuralTimeline data={sensor?.attention_timeline ?? []} />
        </section>

        { }
        {phrases.length > 0 && (
          <section className="tw-mb-9">
            <div className="tw-flex tw-items-center tw-gap-3 tw-mb-4">
              <Sparkles className="tw-w-4 tw-h-4 tw-text-neuro-gold" strokeWidth={1.8} />
              <span className="tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-[0.22em] tw-text-neuro-muted">
                Ключові фрази
              </span>
              <span className="tw-flex-1 tw-h-px tw-bg-gradient-to-r tw-from-neuro-border/60 tw-to-transparent" />
            </div>
            <div className="tw-flex tw-flex-wrap tw-gap-2.5">
              {phrases.map((p, i) => (
                <PhrasePill key={p + i} tone={i % 2 === 0 ? "teal" : "gold"}>
                  {p}
                </PhrasePill>
              ))}
            </div>
          </section>
        )}

        { }
        <section className="tw-mb-6">
          <LessonTabs active={tab} onChange={setTab} />
        </section>

        { }
        {tab === "lesson" && (
          <div className="tw-flex tw-flex-col tw-gap-5">
            <VideoPlayer
              lessonId={currentLesson.id}
              hasVideo={!!currentLesson.video_path}
              title={currentLesson.topic ?? currentLesson.subject}
            />
            <VideoUploader lessonId={currentLesson.id} hasVideo={!!currentLesson.video_path} onUploaded={refreshLesson} />
            <TranscriptEditor lessonId={currentLesson.id} initial={currentLesson.transcript ?? ""} onSaved={refreshLesson} />
          </div>
        )}
        {tab === "test" && <TestEditor lessonId={currentLesson.id} />}
        {tab === "analytics" && <LessonAnalyticsView lessonId={currentLesson.id} />}
      </main>
    </div>
  );
}
