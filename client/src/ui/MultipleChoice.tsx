import { useState } from "react";
import { useAppStore } from "../state/store";

export interface MCOption {
  id: string;
  text: string;
}

interface CorrectInfo {
  firstTry: boolean;
  wrongAttempts: number;
}

interface Props {
  question: string;
  options: MCOption[];
  correctId: string;
  explanation?: string;
  onCorrect: (info: CorrectInfo) => void;
}

export function MultipleChoice({
  question,
  options,
  correctId,
  explanation,
  onCorrect,
}: Props) {
  const reportQuizWrong = useAppStore((s) => s.reportQuizWrong);
  const reportQuizCorrect = useAppStore((s) => s.reportQuizCorrect);
  const reportQuizStuck = useAppStore((s) => s.reportQuizStuck);
  const unlockAchievement = useAppStore((s) => s.unlockAchievement);
  const [picked, setPicked] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);

  function handlePick(id: string) {
    if (solved) return;
    setPicked(id);
    if (id === correctId) {
      setSolved(true);
      const firstTry = wrongAttempts === 0;
      if (firstTry) unlockAchievement("quick_thinker");
      reportQuizCorrect(firstTry);
      onCorrect({ firstTry, wrongAttempts });
    } else {
      const next = wrongAttempts + 1;
      setWrongAttempts(next);
      setShakeKey((k) => k + 1);
      reportQuizWrong();
      if (next === 2) reportQuizStuck();
    }
  }

  return (
    <div className="mc">
      <div className="mc-question">{question}</div>
      <div className="mc-options">
        {options.map((o, i) => {
          const letter = String.fromCharCode(65 + i);
          const isWrong = picked === o.id && !solved;
          const isCorrect = solved && o.id === correctId;
          const isDimmed = solved && o.id !== correctId;
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
              disabled={solved}
            >
              <span className="mc-letter">{letter}</span>
              <span className="mc-text">{o.text}</span>
            </button>
          );
        })}
      </div>

      {picked && !solved && (
        <div className="mc-hint">Nicht ganz. Versuch's nochmal.</div>
      )}

      {solved && explanation && (
        <div className="mc-explanation">{explanation}</div>
      )}
    </div>
  );
}
