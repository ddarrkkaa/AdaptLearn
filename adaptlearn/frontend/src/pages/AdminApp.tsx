import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme, PALETTES } from "../contexts/ThemeContext";
import client from "../api/client";
import NeuroDepth from "../components/neuro/NeuroDepth";

const I = {
  grid:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  users:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  book:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  check:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><polyline points="20 6 9 17 4 12"/></svg>,
  x:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

interface PendingUser {
  id: number; username: string; full_name: string; role: string;
  subject: string | null; class_id: number | null;
}
interface AllUser { id: number; username: string; full_name: string; role: string; subject: string | null; class_id: number | null; approved: boolean; }
interface Subject { id: number; name: string; }
interface SchoolClass { id: number; name: string; grade: number; }

const NAV = [
  { key: "overview", label: "Огляд",         icon: I.grid },
  { key: "alerts",   label: "Сповіщення",    icon: I.book },
  { key: "pending",  label: "Очікують",      icon: I.users },
  { key: "all",      label: "Всі учасники",  icon: I.book },
];

const cl = (r: string) => r === "student" ? "#6366f1" : r === "teacher" ? "#0d9488" : "#00E6C8";
const rl = (r: string) => r === "student" ? "Учень" : r === "teacher" ? "Вчитель" : "Адмін";

function Sidebar({ section, setSection, user, logout, theme, toggleTheme, palette, setPalette }: any) {
  const [showPal, setShowPal] = useState(false);
  return (
    <aside style={{ width: 230, minWidth: 230, background: "var(--sidebar-bg)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 50 }}>
      <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "11px", background: "#00E6C8", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" style={{ width: 19, height: 19 }}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          </div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", lineHeight: 1 }}>AdaptLearn</div>
            <div style={{ fontSize: "11px", color: "#00E6C8", marginTop: 3, fontWeight: 600 }}>Адміністратор</div>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "14px 10px" }}>
        {NAV.map(n => (
          <button key={n.key} onClick={() => setSection(n.key)} style={{ display: "flex", alignItems: "center", gap: "11px", width: "100%", padding: "11px 13px", borderRadius: "9px", border: "none", background: section === n.key ? "rgba(217,119,6,0.1)" : "transparent", color: section === n.key ? "#00E6C8" : "var(--text-muted)", fontWeight: section === n.key ? 700 : 400, fontSize: "15px", cursor: "pointer", textAlign: "left", marginBottom: "3px" }}>
            <span style={{ color: section === n.key ? "#00E6C8" : "var(--text-muted)" }}>{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>
      <div style={{ padding: "12px 10px 14px", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: "var(--surface-2)", marginBottom: "8px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#00E6C8", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "15px", fontWeight: 700, flexShrink: 0 }}>{user?.full_name?.charAt(0)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.full_name?.split(" ").slice(0, 2).join(" ")}</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Адміністратор</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={toggleTheme} title={theme === "dark" ? "Світла тема" : "Темна тема"} style={{ flex: "0 0 38px", height: "38px", borderRadius: "10px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 150ms" }} onMouseEnter={e => { (e.currentTarget.style.background = "var(--primary-10)"); (e.currentTarget.style.color = "var(--primary)"); (e.currentTarget.style.borderColor = "var(--primary)"); }} onMouseLeave={e => { (e.currentTarget.style.background = "transparent"); (e.currentTarget.style.color = "var(--text-muted)"); (e.currentTarget.style.borderColor = "var(--border)"); }}>
            {theme === "dark" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>
          <button onClick={logout} title="Вийти" style={{ flex: 1, padding: "10px 0", borderRadius: "10px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "13px", fontWeight: 600, letterSpacing: "0.04em", transition: "all 150ms" }} onMouseEnter={e => { (e.currentTarget.style.background = "rgba(255,94,122,0.10)"); (e.currentTarget.style.color = "#FF5E7A"); (e.currentTarget.style.borderColor = "rgba(255,94,122,0.40)"); }} onMouseLeave={e => { (e.currentTarget.style.background = "transparent"); (e.currentTarget.style.color = "var(--text-muted)"); (e.currentTarget.style.borderColor = "var(--border)"); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Вийти
          </button>
        </div>
      </div>
    </aside>
  );
}

function OverviewSection({ pending, all, classes, onNav }: { pending: PendingUser[]; all: AllUser[]; classes: SchoolClass[]; onNav: (s: string, filter?: string) => void }) {
  const students = all.filter(u => u.role === "student" && u.approved);
  const teachers = all.filter(u => u.role === "teacher" && u.approved);
  return (
    <div className="fade-in" style={{ position: "relative" }}>
      <NeuroDepth intensity="normal"/>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px", marginBottom: "28px", position: "relative", zIndex: 1 }}>
        {[
          { label: "Учні",     v: students.length, c: "#6366f1", filter: "student" },
          { label: "Вчителі",  v: teachers.length, c: "#0d9488", filter: "teacher" },
          { label: "Очікують", v: pending.length,  c: "#00E6C8", filter: "pending" },
        ].map(s => (
          <button key={s.label} onClick={() => s.filter === "pending" ? onNav("pending") : onNav("all", s.filter)} style={{ background: `${s.c}14`, borderRadius: "14px", padding: "20px 22px", borderLeft: `4px solid ${s.c}`, border: "none", cursor: "pointer", textAlign: "left", transition: "transform 120ms" }} onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")} onMouseLeave={e => (e.currentTarget.style.transform = "none")}>
            <div style={{ fontSize: "36px", fontWeight: 800, color: s.c, lineHeight: 1 }}>{s.v}</div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600, marginTop: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label} →</div>
          </button>
        ))}
      </div>

      {pending.length > 0 && (
        <div style={{ background: "rgba(0,230,200,0.08)", borderRadius: "14px", padding: "16px 20px", borderLeft: "4px solid #00E6C8", marginBottom: "24px", boxShadow: "0 0 22px rgba(0,230,200,0.12), inset 0 0 18px rgba(0,230,200,0.04)" }}>
          <div style={{ fontWeight: 700, color: "#00E6C8", marginBottom: "4px", fontSize: "16px", textShadow: "0 0 14px rgba(0,230,200,0.40)" }}>Нові реєстрації ({pending.length})</div>
          <div style={{ fontSize: "14px", color: "var(--text)", marginBottom: "10px" }}>{pending.map(u => u.full_name).join(", ")}</div>
          <button onClick={() => onNav("pending")} className="btn btn-primary" style={{ fontSize: "14px", padding: "8px 18px" }}>Розглянути</button>
        </div>
      )}

      { }
      {classes.length > 0 && (() => {
        const data = classes.map(c => ({ name: c.name, count: students.filter(s => s.class_id === c.id).length, grade: c.grade }));
        const maxCount = Math.max(1, ...data.map(d => d.count));
        return (
          <div style={{ background: "var(--surface)", borderRadius: "14px", padding: "22px", boxShadow: "var(--shadow-sm)", marginBottom: "24px" }}>
            <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)", marginBottom: "16px" }}>Розподіл учнів по класах</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "14px", height: "200px", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
              {data.map(d => (
                <div key={d.name} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--primary)" }}>{d.count}</div>
                  <div style={{ width: "100%", height: `${Math.max(8, (d.count / maxCount) * 160)}px`, background: "var(--primary)", borderRadius: "8px 8px 0 0", transition: "height 500ms ease" }} />
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{d.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{d.grade} кл.</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      { }
      {teachers.length > 0 && (() => {
        const bySubj: Record<string, number> = {};
        teachers.forEach(t => { const k = t.subject ?? "Без предмета"; bySubj[k] = (bySubj[k] ?? 0) + 1; });
        const items = Object.entries(bySubj).sort((a, b) => b[1] - a[1]);
        const palette = ["#6366f1", "#0d9488", "#00E6C8", "#7c3aed", "#e11d48", "#0284c7", "#22c55e", "#f59e0b"];
        return (
          <div style={{ background: "var(--surface)", borderRadius: "14px", padding: "22px", boxShadow: "var(--shadow-sm)", marginBottom: "24px" }}>
            <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)", marginBottom: "16px" }}>Вчителі за предметами</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {items.map(([subj, n], i) => {
                const c = palette[i % palette.length];
                return (
                  <div key={subj} style={{ background: `${c}14`, borderRadius: "10px", padding: "12px 18px", borderLeft: `4px solid ${c}`, minWidth: "120px" }}>
                    <div style={{ fontSize: "22px", fontWeight: 800, color: c }}>{n}</div>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "3px" }}>{subj}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      { }
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginBottom: "16px" }}>
        <button onClick={() => onNav("pending")} style={{ background: "var(--surface)", borderRadius: "12px", padding: "16px 20px", boxShadow: "var(--shadow-sm)", border: "none", cursor: "pointer", textAlign: "left", borderLeft: "4px solid #00E6C8" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>Підтвердити нових учасників</div>
          <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "3px" }}>{pending.length} очікують</div>
        </button>
        <button onClick={() => onNav("alerts")} style={{ background: "var(--surface)", borderRadius: "12px", padding: "16px 20px", boxShadow: "var(--shadow-sm)", border: "none", cursor: "pointer", textAlign: "left", borderLeft: "4px solid #ef4444" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>Сповіщення з датчиків</div>
          <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "3px" }}>Умови в класах</div>
        </button>
        <button onClick={() => onNav("all")} style={{ background: "var(--surface)", borderRadius: "12px", padding: "16px 20px", boxShadow: "var(--shadow-sm)", border: "none", cursor: "pointer", textAlign: "left", borderLeft: "4px solid var(--primary)" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>Всі учасники</div>
          <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "3px" }}>{all.length} облікових записів</div>
        </button>
      </div>
    </div>
  );
}

function PendingSection({ pending, subjects, classes, onRefresh }: { pending: PendingUser[]; subjects: Subject[]; classes: SchoolClass[]; onRefresh: () => void }) {
  const [assign, setAssign] = useState<Record<number, { class_id?: number; subject?: string }>>({});
  const [loading, setLoading] = useState<number | null>(null);

  const approve = async (u: PendingUser) => {
    setLoading(u.id);
    const a = assign[u.id] ?? {};
    try {
      await client.patch(`/api/admin/users/${u.id}/approve`, { class_id: a.class_id ?? null, subject: a.subject ?? null });
      onRefresh();
    } catch {}
    setLoading(null);
  };

  const reject = async (id: number) => {
    if (!confirm("Відхилити і видалити цього користувача?")) return;
    try { await client.delete(`/api/admin/users/${id}`); onRefresh(); } catch {}
  };

  if (pending.length === 0) return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>✓</div>
      <div style={{ fontSize: "17px", fontWeight: 600 }}>Немає нових реєстрацій</div>
      <p style={{ fontSize: "14px", marginTop: "8px" }}>Всі учасники підтверджені</p>
    </div>
  );

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {pending.map(u => {
        const a = assign[u.id] ?? {};
        return (
          <div key={u.id} style={{ background: "var(--surface)", borderRadius: "14px", padding: "18px 20px", boxShadow: "var(--shadow-sm)", borderLeft: `4px solid ${cl(u.role)}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "14px", flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>{u.full_name}</span>
                  <span style={{ background: `${cl(u.role)}18`, color: cl(u.role), fontSize: "12px", fontWeight: 700, padding: "2px 10px", borderRadius: "99px" }}>{rl(u.role)}</span>
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>@{u.username}</div>
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                {u.role === "student" && (
                  <select value={a.class_id ?? ""} onChange={e => setAssign({ ...assign, [u.id]: { ...a, class_id: Number(e.target.value) || undefined } })} style={{ fontSize: "14px", padding: "8px 12px", minWidth: "120px" }}>
                    <option value="">Обрати клас</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.grade} клас)</option>)}
                  </select>
                )}
                {u.role === "teacher" && (
                  <select value={a.subject ?? ""} onChange={e => setAssign({ ...assign, [u.id]: { ...a, subject: e.target.value || undefined } })} style={{ fontSize: "14px", padding: "8px 12px", minWidth: "180px" }}>
                    <option value="">Обрати предмет</option>
                    {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                )}
                <button onClick={() => approve(u)} disabled={loading === u.id || (u.role === "student" && !a.class_id) || (u.role === "teacher" && !a.subject)} className="btn btn-primary" style={{ padding: "8px 16px", fontSize: "14px", gap: "6px" }}>
                  {I.check} {loading === u.id ? "..." : "Підтвердити"}
                </button>
                <button onClick={() => reject(u.id)} className="btn btn-ghost" style={{ padding: "8px 12px", fontSize: "14px", color: "var(--danger)" }}>
                  {I.x}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface NotifItem { type: string; level: string; message: string; suggestion: string; }
interface Notification { session_id: number; subject: string|null; topic: string|null; class_name: string|null; timestamp: string|null; items: NotifItem[]; }

function AlertsSection({ alerts }: { alerts: Notification[] }) {
  if (alerts.length === 0) return (
    <div style={{ background: "var(--surface)", borderRadius: "14px", padding: "40px", textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ fontSize: "44px", marginBottom: "12px" }}>✓</div>
      <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)" }}>Все добре</div>
      <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "8px" }}>Несприятливих умов у класах не виявлено</p>
    </div>
  );
  const levelColor = (lv: string) => lv === "critical" ? "#ef4444" : lv === "warning" ? "#f59e0b" : "#6366f1";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ background: "var(--primary-10)", borderRadius: "10px", padding: "14px 18px", color: "var(--text)", fontSize: "14px", lineHeight: 1.6 }}>
        Сповіщення з датчиків температури і вологості робота. Норма: <strong>20–24°C</strong>, <strong>40–60% вологості</strong>.
      </div>
      {alerts.map(a => (
        <div key={a.session_id} style={{ background: "var(--surface)", borderRadius: "14px", padding: "18px 22px", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>{a.topic ?? a.subject ?? "Урок"}</div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>{a.subject} · {a.class_name ?? "—"}</div>
            </div>
            {a.timestamp && <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{new Date(a.timestamp).toLocaleString("uk")}</div>}
          </div>
          {a.items.map((it, i) => (
            <div key={i} style={{ display: "flex", gap: "12px", padding: "10px 14px", background: `${levelColor(it.level)}14`, borderRadius: "10px", borderLeft: `4px solid ${levelColor(it.level)}`, marginBottom: i < a.items.length - 1 ? "8px" : "0" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>{it.message}</div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "3px" }}>💡 {it.suggestion}</div>
              </div>
              <span style={{ background: levelColor(it.level), color: "#fff", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "99px", height: "fit-content", textTransform: "uppercase" }}>
                {it.level === "critical" ? "Терміново" : it.level === "warning" ? "Увага" : "Інфо"}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function AllUsersSection({ all, classes, initialFilter, onRefresh }: { all: AllUser[]; classes: SchoolClass[]; initialFilter: string; onRefresh: () => void }) {
  const [filter, setFilter] = useState(initialFilter);
  const [search, setSearch] = useState("");
  const classMap: Record<number, string> = {};
  classes.forEach(c => { classMap[c.id] = c.name; });
  const filtered = all
    .filter(u => filter === "all" || u.role === filter)
    .filter(u => u.full_name.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.full_name.localeCompare(b.full_name, "uk"));

  const del = async (id: number, name: string) => {
    if (!confirm(`Видалити користувача ${name}?`)) return;
    try { await client.delete(`/api/admin/users/${id}`); onRefresh(); } catch {}
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", gap: "10px", marginBottom: "18px", flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук по імені або логіну..." style={{ width: "260px", fontSize: "15px" }} />
        <div style={{ display: "flex", gap: "6px" }}>
          {[{ k: "all", l: "Всі" }, { k: "student", l: "Учні" }, { k: "teacher", l: "Вчителі" }, { k: "admin", l: "Адміни" }].map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)} className={filter === f.k ? "btn btn-primary" : "btn btn-ghost"} style={{ fontSize: "14px", padding: "8px 16px" }}>{f.l}</button>
          ))}
        </div>
      </div>
      <div style={{ background: "var(--surface)", borderRadius: "14px", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border)" }}>
              {["Ім'я", "Логін", "Роль", "Клас / Предмет", "Статус", ""].map(h => (
                <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: "13px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>Користувачів не знайдено</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ padding: "13px 16px", fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>{u.full_name}</td>
                <td style={{ padding: "13px 16px", fontSize: "14px", color: "var(--text-muted)" }}>@{u.username}</td>
                <td style={{ padding: "13px 16px" }}>
                  <span style={{ background: `${cl(u.role)}18`, color: cl(u.role), fontSize: "12px", fontWeight: 700, padding: "3px 10px", borderRadius: "99px" }}>{rl(u.role)}</span>
                </td>
                <td style={{ padding: "13px 16px", fontSize: "14px", color: "var(--text-muted)" }}>
                  {u.role === "student" ? (u.class_id ? (classMap[u.class_id] ?? `Клас ${u.class_id}`) : "—") : (u.subject ?? "Адмін")}
                </td>
                <td style={{ padding: "13px 16px" }}>
                  <span style={{ fontSize: "11.5px", fontWeight: 700, padding: "3px 11px", borderRadius: "99px", textTransform: "uppercase", letterSpacing: "0.04em", background: u.approved ? "rgba(34,197,94,0.14)" : "rgba(0,230,200,0.10)", color: u.approved ? "#5BE39A" : "#00E6C8", border: `1px solid ${u.approved ? "rgba(34,197,94,0.32)" : "rgba(0,230,200,0.32)"}` }}>
                    {u.approved ? "Підтверджено" : "Очікує"}
                  </span>
                </td>
                <td style={{ padding: "13px 16px", textAlign: "right" }}>
                  <button onClick={() => del(u.id, u.full_name)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", padding: "4px 8px", borderRadius: "6px", fontSize: "13px", fontWeight: 600 }} title="Видалити">Видалити</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminApp() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, palette, setPalette } = useTheme();
  const [section, setSection] = useState("overview");
  const [allFilter, setAllFilter] = useState("all");
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [all, setAll] = useState<AllUser[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [alerts, setAlerts] = useState<Notification[]>([]);

  const load = useCallback(async () => {
    try {
      const [p, a, s, c, n] = await Promise.all([
        client.get("/api/admin/pending"),
        client.get("/api/admin/users"),
        client.get("/api/admin/subjects"),
        client.get("/api/admin/classes"),
        client.get("/api/admin/notifications").catch(() => ({ data: [] })),
      ]);
      setPending(p.data);
      setAll(a.data);
      setSubjects(s.data);
      setClasses(c.data);
      setAlerts(n.data);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const titles: Record<string, string> = { overview: "Огляд", alerts: "Сповіщення про умови", pending: "Очікують підтвердження", all: "Всі учасники" };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar section={section} setSection={setSection} user={user} logout={logout} theme={theme} toggleTheme={toggleTheme} palette={palette} setPalette={setPalette} />
      <main style={{ marginLeft: "230px", flex: 1, padding: "34px 44px", minWidth: 0 }}>
        <div className="fade-in">
          <h1 style={{ fontSize: "26px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>{titles[section]}</h1>
          <p style={{ fontSize: "15px", color: "var(--text-muted)", marginBottom: "30px" }}>
            {user?.full_name} · Адміністратор школи
            {section === "pending" && pending.length > 0 && <span style={{ marginLeft: "12px", background: "rgba(0,230,200,0.12)", color: "#00E6C8", fontSize: "11.5px", fontWeight: 700, padding: "3px 12px", borderRadius: "99px", border: "1px solid rgba(0,230,200,0.32)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{pending.length} нових</span>}
          </p>
        </div>
        {section === "overview" && <OverviewSection pending={pending} all={all} classes={classes} onNav={(s, f) => { setSection(s); if (f) setAllFilter(f); }} />}
        {section === "alerts"   && <AlertsSection alerts={alerts} />}
        {section === "pending"  && <PendingSection pending={pending} subjects={subjects} classes={classes} onRefresh={load} />}
        {section === "all"      && <AllUsersSection all={all} classes={classes} initialFilter={allFilter} onRefresh={load} />}
      </main>
    </div>
  );
}
