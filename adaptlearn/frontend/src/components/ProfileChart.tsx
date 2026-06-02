import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface Props {
  knowledgeLevel: number;
  engagementScore: number;
  errorsCount: number;
}

export default function ProfileChart({ knowledgeLevel, engagementScore, errorsCount }: Props) {
  const data = [
    { subject: "Знання", value: knowledgeLevel },
    { subject: "Залученість", value: engagementScore },
    { subject: "Без помилок", value: Math.max(0, 100 - errorsCount * 10) },
    { subject: "Активність", value: (knowledgeLevel + engagementScore) / 2 },
  ];

  return (
    <div style={{ width: "100%", height: 250 }}>
      <ResponsiveContainer>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <Radar name="Профіль" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
