import { useState } from "react";
import { useAppStore } from "../state/store";
import type { MCOption } from "./MultipleChoice";

export interface QuizQuestion {
  id: string;
  question: string;
  options: MCOption[];
  correctId: string;
  explanation: string;
}

interface Props {
  questions: QuizQuestion[];
  onAllCorrect: () => void;
}

export function QuizSeries({ questions, onAllCorrect }: Props) {
  const reportQuizWrong = useAppStore((s) => s.reportQuizWrong);
  const reportQuizCorrect = useAppStore((s) => s.reportQuizCorrect);
  const reportQuizStuck = useAppStore((s) => s.reportQuizStuck);
  const unlockAchievement = useAppStore((s) => s.unlockAchievement);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [solvedQ, setSolvedQ] = useState<Record<string, boolean>>({});
  const [shakeKey, setShakeKey] = useState(0);
  const [done, setDone] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);

  const q = questions[idx];
  const isSolved = solvedQ[q.id] === true;

  function handlePick(id: string) {
    if (isSolved) return;
    setPicked(id);
    if (id === q.correctId) {
      const next = { ...solvedQ, [q.id]: true };
      setSolvedQ(next);
      if (Object.keys(next).length === questions.length) {
        setDone(true);
        const firstTry = wrongAttempts === 0;
        if (firstTry) unlockAchievement("quick_thinker");
        reportQuizCorrect(firstTry);
        onAllCorrect();
      }
    } else {
      reportQuizWrong();
      setShakeKey((k) => k + 1);
      const nextWrong = wrongAttempts + 1;
      setWrongAttempts(nextWrong);
      if (nextWrong === 2) reportQuizStuck();
    }
  }

  function nextQ() {
    setPicked(null);
    setIdx((i) => Math.min(questions.length - 1, i + 1));
  }

  function prevQ() {
    setPicked(null);
    setIdx((i) => Math.max(0, i - 1));
  }

  return (
    <div className="quiz-series">
      <div className="quiz-series-progress">
        Frage {idx + 1} / {questions.length} · {Object.keys(solvedQ).length} richtig
      </div>

      <div className="mc">
        <div className="mc-question">{q.question}</div>
        <div className="mc-options">
          {q.options.map((o, i) => {
            const letter = String.fromCharCode(65 + i);
            const isWrong = picked === o.id && !isSolved;
            const isCorrect = isSolved && o.id === q.correctId;
            const isDimmed = isSolved && o.id !== q.correctId;
            const cls = [
              "mc-option",
              isWrong && "wrong",
              isCorrect && "correct",
              isDimmed && "dimmed",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button
                key={isWrong ? `${o.id}-${shakeKey}` : o.id}
                className={cls}
                onClick={() => handlePick(o.id)}
                disabled={isSolved}
              >
                <span className="mc-letter">{letter}</span>
                <span className="mc-text">{o.text}</span>
              </button>
            );
          })}
        </div>

        {picked && !isSolved && (
          <div className="mc-hint">Nicht ganz. Versuch's nochmal.</div>
        )}
        {isSolved && <div className="mc-explanation">{q.explanation}</div>}
      </div>

      <div className="quiz-series-nav">
        <button
          className="secondary-button"
          onClick={prevQ}
          disabled={idx === 0}
        >
          ← Zurück
        </button>
        {!done && (
          <button
            className="primary-button"
            onClick={nextQ}
            disabled={!isSolved || idx >= questions.length - 1}
          >
            Nächste Frage →
          </button>
        )}
        {done && (
          <span className="quiz-series-success">
            Alle {questions.length} Fragen richtig. Kapitel 5 ist frei.
          </span>
        )}
      </div>
    </div>
  );
}
