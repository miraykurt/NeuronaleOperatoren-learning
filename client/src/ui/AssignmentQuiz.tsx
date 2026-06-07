import { useMemo, useState } from "react";
import { useAppStore } from "../state/store";

export type Category = "nn" | "no";

export interface AssignItem {
  id: string;
  text: string;
  correct: Category;
}

interface Props {
  prompt: string;
  items: AssignItem[];
  labels: { nn: string; no: string };
  onAllCorrect: () => void;
}

const COLUMNS: Category[] = ["nn", "no"];

export function AssignmentQuiz({ prompt, items, labels, onAllCorrect }: Props) {
  const reportQuizWrong = useAppStore((s) => s.reportQuizWrong);
  const reportQuizCorrect = useAppStore((s) => s.reportQuizCorrect);
  const reportQuizStuck = useAppStore((s) => s.reportQuizStuck);
  const unlockAchievement = useAppStore((s) => s.unlockAchievement);
  const [picked, setPicked] = useState<Record<string, Category | null>>(() =>
    Object.fromEntries(items.map((i) => [i.id, null])),
  );
  const [checked, setChecked] = useState(false);
  const [solved, setSolved] = useState(false);
  const [wrongChecks, setWrongChecks] = useState(0);

  const allAssigned = useMemo(
    () => items.every((i) => picked[i.id] != null),
    [picked, items],
  );

  function assign(id: string, cat: Category) {
    if (solved) return;
    setPicked((p) => ({ ...p, [id]: cat }));
    if (checked) setChecked(false);
  }

  function check() {
    setChecked(true);
    const allCorrect = items.every((i) => picked[i.id] === i.correct);
    if (allCorrect) {
      setSolved(true);
      const firstTry = wrongChecks === 0;
      if (firstTry) unlockAchievement("quick_thinker");
      reportQuizCorrect(firstTry);
      onAllCorrect();
    } else {
      reportQuizWrong();
      const nextWrong = wrongChecks + 1;
      setWrongChecks(nextWrong);
      if (nextWrong === 2) reportQuizStuck();
    }
  }

  function reset() {
    setPicked(Object.fromEntries(items.map((i) => [i.id, null])));
    setChecked(false);
  }

  const wrongCount = checked && !solved
    ? items.filter((i) => picked[i.id] !== i.correct).length
    : 0;

  return (
    <div className="assign-quiz">
      <div className="assign-prompt">{prompt}</div>

      <div className="assign-items">
        {items.map((item) => {
          const sel = picked[item.id];
          const isWrong = checked && sel != null && sel !== item.correct;
          const isRight = checked && sel === item.correct;
          return (
            <div
              key={item.id}
              className={`assign-item ${isWrong ? "wrong" : ""} ${isRight ? "right" : ""}`}
            >
              <div className="assign-text">{item.text}</div>
              <div className="assign-cols">
                {COLUMNS.map((c) => (
                  <button
                    key={c}
                    className={`assign-pill ${sel === c ? "selected" : ""} ${isWrong && sel === c ? "wrong" : ""} ${isRight && sel === c ? "right" : ""}`}
                    onClick={() => assign(item.id, c)}
                    disabled={solved}
                  >
                    {labels[c]}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="assign-actions">
        <button
          className="primary-button"
          onClick={check}
          disabled={!allAssigned || solved}
        >
          {solved ? "Alles korrekt" : "Zuordnung prüfen"}
        </button>
        {checked && !solved && (
          <>
            <span className="assign-feedback">
              {wrongCount} von {items.length} noch falsch. Überprüf die
              markierten.
            </span>
            <button className="secondary-button" onClick={reset}>
              Alles zurücksetzen
            </button>
          </>
        )}
        {solved && (
          <span className="assign-success">
            Alle korrekt. Das nächste Kapitel ist frei.
          </span>
        )}
      </div>
    </div>
  );
}
