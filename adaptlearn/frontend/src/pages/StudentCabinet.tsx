import { useEffect, useState } from "react";
import client from "../api/client";
import TrajectoryView from "../components/TrajectoryView";
import TestWidget from "../components/TestWidget";
import ProfileChart from "../components/ProfileChart";

interface Profile {
  knowledge_level: number;
  engagement_score: number;
  learning_pace: string;
  typical_errors: unknown[];
}

interface Trajectory {
  topics: unknown[];
}

interface Props {
  studentId: number;
}

export default function StudentCabinet({ studentId }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [trajectory, setTrajectory] = useState<Trajectory | null>(null);
  const [activeTest, setActiveTest] = useState<{ questions: { question: string; options: string[]; correct_index: number; explanation: string }[] } | null>(null);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    client.get(`/api/students/${studentId}/profile`).then((r) => setProfile(r.data)).catch(() => {});
    client.get(`/api/trajectory/${studentId}`).then((r) => setTrajectory(r.data)).catch(() => {});
  }, [studentId]);

  const startTest = async () => {
    try {
      const lessons = await client.get("/api/lessons/active");
      if (lessons.data.length > 0) {
        const lessonId = lessons.data[0].id;
        const test = await client.get(`/api/tests/lesson/${lessonId}`);
        if (test.data.length > 0) {
          setActiveTest(test.data[0]);
        } else {
          const generated = await client.post(`/api/tests/generate/${lessonId}?student_id=${studentId}`);
          setActiveTest(generated.data);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestComplete = (s: number) => {
    setScore(s);
    setActiveTest(null);
    if (profile) setProfile({ ...profile, knowledge_level: 0.7 * profile.knowledge_level + 0.3 * s });
  };

  const paceLabel: Record<string, string> = { slow: "Повільний", medium: "Середній", fast: "Швидкий" };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24, fontFamily: "sans-serif" }}>
      <h2 style={{ color: "#1e293b" }}>Особистий кабінет студента #{studentId}</h2>

      {profile && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Рівень знань", value: `${profile.knowledge_level.toFixed(1)}%` },
              { label: "Залученість", value: `${profile.engagement_score.toFixed(1)}%` },
              { label: "Темп навчання", value: paceLabel[profile.learning_pace] ?? profile.learning_pace },
              { label: "Типові помилки", value: profile.typical_errors.length },
            ].map((card) => (
              <div key={card.label} style={{ background: "#f8fafc", borderRadius: 8, padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#6366f1" }}>{card.value}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{card.label}</div>
              </div>
            ))}
          </div>
          <ProfileChart
            knowledgeLevel={profile.knowledge_level}
            engagementScore={profile.engagement_score}
            errorsCount={profile.typical_errors.length}
          />
        </>
      )}

      {trajectory && <TrajectoryView topics={trajectory.topics as (string | { title?: string })[]} />}

      <div style={{ marginTop: 20 }}>
        {score !== null && (
          <div style={{ background: "#dcfce7", borderRadius: 8, padding: 14, marginBottom: 16 }}>
            Тест завершено! Ваш результат: <strong>{score}%</strong>
          </div>
        )}
        {activeTest ? (
          <TestWidget questions={activeTest.questions} onComplete={handleTestComplete} />
        ) : (
          <button
            onClick={startTest}
            style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 6, padding: "12px 24px", cursor: "pointer" }}
          >
            Пройти тест
          </button>
        )}
      </div>
    </div>
  );
}
