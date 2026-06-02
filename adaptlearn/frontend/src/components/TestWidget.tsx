import { useState } from "react";

interface Question {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

interface Props {
  questions: Question[];
  onComplete: (score: number) => void;
}

export default function TestWidget({ questions, onComplete }: Props) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);

  const q = questions[current];

  const handleAnswer = (idx: number) => {
    if (showFeedback) return;
    setSelected(idx);
    setShowFeedback(true);
    if (idx === q.correct_index) setCorrect((c) => c + 1);
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      const score = Math.round(((correct + (selected === q.correct_index ? 1 : 0)) / questions.length) * 100);
      onComplete(score);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setShowFeedback(false);
    }
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 20 }}>
      <p style={{ color: "#64748b", fontSize: 13 }}>
        Питання {current + 1} / {questions.length}
      </p>
      <h4 style={{ marginBottom: 16 }}>{q.question}</h4>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {q.options.map((opt, i) => {
          let bg = "#f1f5f9";
          if (showFeedback) {
            if (i === q.correct_index) bg = "#dcfce7";
            else if (i === selected) bg = "#fee2e2";
          }
          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              style={{
                background: bg,
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                padding: "10px 14px",
                textAlign: "left",
                cursor: showFeedback ? "default" : "pointer",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {showFeedback && (
        <div style={{ marginTop: 12, padding: 10, background: "#f0fdf4", borderRadius: 6, fontSize: 14 }}>
          <strong>{selected === q.correct_index ? "Правильно!" : "Неправильно."}</strong>{" "}
          {q.explanation}
        </div>
      )}
      {showFeedback && (
        <button
          onClick={handleNext}
          style={{
            marginTop: 14,
            background: "#6366f1",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "10px 20px",
            cursor: "pointer",
          }}
        >
          {current + 1 >= questions.length ? "Завершити" : "Далі"}
        </button>
      )}
    </div>
  );
}
