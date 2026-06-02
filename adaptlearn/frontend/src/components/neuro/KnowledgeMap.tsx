import { useEffect, useState } from "react";
import client from "../../api/client";

interface Node {
  id: string;
  name: string;
  subject: string;
  x: number;
  y: number;
  prereqs: string[];
}
interface Edge {
  from: string;
  to: string;
}

interface Props {
  studentId: number;

  masteryOverride?: Record<string, number>;
}

export default function KnowledgeMap({ studentId, masteryOverride }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [mastery, setMastery] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      client.get("/api/knowledge-graph"),
      masteryOverride
        ? Promise.resolve({ data: masteryOverride })
        : client.get(`/api/students/${studentId}/knowledge-mastery`),
    ])
      .then(([gRes, mRes]) => {
        setNodes(gRes.data?.nodes ?? []);
        setEdges(gRes.data?.edges ?? []);
        setMastery(mRes.data ?? {});
      })
      .catch(() => {
        setNodes([]);
        setEdges([]);
        setMastery({});
      })
      .finally(() => setLoading(false));
  }, [studentId, masteryOverride]);

  if (loading) {
    return (
      <div className="neuro-card-glow tw-rounded-2xl tw-bg-neuro-card tw-p-12 tw-text-center">
        <span className="spinner" />
      </div>
    );
  }
  if (nodes.length === 0) {
    return (
      <div className="neuro-card-glow tw-rounded-2xl tw-bg-neuro-card tw-p-10 tw-text-center tw-text-neuro-muted">
        Граф знань ще не побудовано.
      </div>
    );
  }

  const values = Object.values(mastery);
  const avg = values.length
    ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100)
    : 0;
  const known = values.filter((v) => v >= 0.7).length;
  const inProgress = values.filter((v) => v >= 0.4 && v < 0.7).length;
  const weak = values.filter((v) => v < 0.4).length;

  const colorFor = (m: number) =>
    m >= 0.75
      ? "#5BE39A"
      : m >= 0.5
        ? "#00E6C8"
        : m >= 0.25
          ? "#E8B923"
          : "#FF5E7A";

  const NODE_W = 175;
  const NODE_H = 54;
  const W = Math.max(...nodes.map((n) => n.x + NODE_W)) + 10;
  const H = Math.max(...nodes.map((n) => n.y + NODE_H)) + 10;
  const nodeMap: Record<string, Node> = Object.fromEntries(
    nodes.map((n) => [n.id, n]),
  );

  return (
    <div className="neuro-card-glow tw-rounded-2xl tw-bg-neuro-card tw-p-6">
      {}
      <div className="tw-flex tw-items-start tw-justify-between tw-mb-5 tw-flex-wrap tw-gap-3">
        <div>
          <div className="tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-[0.18em] tw-text-neuro-muted tw-mb-1">
            Карта знань · BKT
          </div>
          <div className="tw-text-[18px] tw-font-bold tw-text-neuro-text">
            Граф навчальної траєкторії
          </div>
          <div className="tw-text-[12.5px] tw-text-neuro-muted tw-mt-1">
            Кожен вузол — тема з {nodes.length}. Стрілки — prerequisites. Колір
            = ймовірність володіння (Bayesian Knowledge Tracing).
          </div>
        </div>
        {}
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="tw-text-right">
            <div
              className="tw-text-[28px] tw-font-bold tw-text-neuro-teal"
              style={{ textShadow: "0 0 18px #00E6C855" }}
            >
              {avg}%
            </div>
            <div className="tw-text-[10.5px] tw-text-neuro-muted tw-uppercase tw-tracking-wider">
              загальне володіння
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="tw-flex tw-flex-wrap tw-gap-2.5 tw-mb-4">
        {[
          { c: "#5BE39A", l: `Засвоєно ≥75% (${known})` },
          { c: "#00E6C8", l: `В процесі 50-75%` },
          { c: "#E8B923", l: `Слабко 25-50% (${inProgress})` },
          { c: "#FF5E7A", l: `Не освоєно <25% (${weak})` },
        ].map((it) => (
          <span
            key={it.l}
            className="tw-inline-flex tw-items-center tw-gap-2 tw-text-[12px] tw-text-neuro-muted"
          >
            <span
              className="tw-w-2.5 tw-h-2.5 tw-rounded-full"
              style={{ background: it.c, boxShadow: `0 0 8px ${it.c}` }}
            />
            {it.l}
          </span>
        ))}
      </div>

      {}
      <div
        className="tw-rounded-xl tw-overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(0,230,200,0.04) 0%, transparent 70%)",
          border: "1px solid var(--border)",
        }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="tw-w-full"
          style={{ minHeight: "440px" }}
        >
          <defs>
            <marker
              id="arrow-teal"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(0,230,200,0.50)" />
            </marker>
            <filter id="glow-node" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" />
            </filter>
          </defs>

          {}
          {edges.map((e, i) => {
            const a = nodeMap[e.from];
            const b = nodeMap[e.to];
            if (!a || !b) return null;
            const isActive = hovered === e.from || hovered === e.to;

            const x1 = a.x + NODE_W;
            const y1 = a.y + NODE_H / 2;
            const x2 = b.x;
            const y2 = b.y + NODE_H / 2;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isActive ? "#00E6C8" : "rgba(0,230,200,0.22)"}
                strokeWidth={isActive ? 1.6 : 0.9}
                markerEnd="url(#arrow-teal)"
                style={{ transition: "stroke 200ms, stroke-width 200ms" }}
              />
            );
          })}

          {}
          {nodes.map((n) => {
            const m = mastery[n.id] ?? 0;
            const color = colorFor(m);
            const isHover = hovered === n.id;
            const pct = Math.round(m * 100);
            return (
              <g
                key={n.id}
                transform={`translate(${n.x}, ${n.y})`}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                {}
                {isHover && (
                  <rect
                    x={-4}
                    y={-4}
                    width={NODE_W + 8}
                    height={NODE_H + 8}
                    rx={18}
                    ry={18}
                    fill={`${color}22`}
                    filter="url(#glow-node)"
                  />
                )}
                {}
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx={14}
                  ry={14}
                  fill={`${color}1A`}
                  stroke={color}
                  strokeWidth={isHover ? 1.8 : 1.2}
                  style={{
                    filter: isHover ? `drop-shadow(0 0 10px ${color})` : "none",
                    transition: "stroke-width 200ms, filter 200ms",
                  }}
                />
                {}
                <text
                  x={12}
                  y={20}
                  fontSize="11.5"
                  fontWeight="700"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fill: "rgb(var(--neuro-text-rgb))",
                  }}
                >
                  {n.name.length > 22 ? n.name.slice(0, 21) + "…" : n.name}
                </text>
                {}
                <text
                  x={NODE_W - 12}
                  y={20}
                  fontSize="11.5"
                  fontWeight="800"
                  fill={color}
                  textAnchor="end"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    filter: `drop-shadow(0 0 4px ${color}88)`,
                  }}
                >
                  {pct}%
                </text>
                {}
                <rect
                  x={12}
                  y={36}
                  width={NODE_W - 24}
                  height={8}
                  rx={4}
                  fill="rgba(255,255,255,0.06)"
                />
                <rect
                  x={12}
                  y={36}
                  width={Math.max(2, (NODE_W - 24) * m)}
                  height={8}
                  rx={4}
                  fill={color}
                  style={{ filter: `drop-shadow(0 0 5px ${color}99)` }}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {}
      {hovered &&
        (() => {
          const n = nodeMap[hovered];
          if (!n) return null;
          const m = mastery[hovered] ?? 0;
          const color = colorFor(m);
          const prereqs = n.prereqs
            .map((id) => nodeMap[id]?.name)
            .filter(Boolean);
          const status =
            m >= 0.75
              ? "Засвоєно"
              : m >= 0.5
                ? "В процесі"
                : m >= 0.25
                  ? "Слабко"
                  : "Не освоєно";
          return (
            <div
              className="tw-mt-4 tw-p-4 tw-rounded-xl"
              style={{
                background: `${color}10`,
                border: `1px solid ${color}40`,
              }}
            >
              <div className="tw-flex tw-items-baseline tw-justify-between tw-mb-2">
                <div>
                  <div className="tw-text-[15px] tw-font-bold tw-text-neuro-text">
                    {n.name}
                  </div>
                  <div className="tw-text-[11.5px] tw-text-neuro-muted tw-mt-0.5">
                    {n.subject}
                  </div>
                </div>
                <div
                  className="tw-text-[20px] tw-font-bold"
                  style={{ color, textShadow: `0 0 12px ${color}55` }}
                >
                  {Math.round(m * 100)}%
                </div>
              </div>
              <div className="tw-text-[12px] tw-text-neuro-muted">
                Статус: <span style={{ color }}>{status}</span>
                {prereqs.length > 0 && <> · Передумови: {prereqs.join(", ")}</>}
              </div>
            </div>
          );
        })()}
    </div>
  );
}
