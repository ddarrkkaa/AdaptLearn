interface Topic {
  title?: string;
  [key: string]: unknown;
}

interface Props {
  topics: (string | Topic)[];
}

export default function TrajectoryView({ topics }: Props) {
  return (
    <div style={{ background: "#f8fafc", borderRadius: 8, padding: 16 }}>
      <h3 style={{ marginBottom: 12, color: "#334155" }}>Навчальна траєкторія</h3>
      {topics.length === 0 ? (
        <p style={{ color: "#94a3b8" }}>Траєкторія ще не сформована</p>
      ) : (
        <ol style={{ paddingLeft: 20 }}>
          {topics.map((topic, i) => (
            <li key={i} style={{ marginBottom: 8, color: "#475569" }}>
              {typeof topic === "string" ? topic : topic.title ?? JSON.stringify(topic)}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
