import { useMemo, useState } from "react";
import { useAppStore } from "../state/store";

export interface MatchCategory {
  id: string;
  label: string;
  sub?: string;
}

export interface MatchItem {
  id: string;
  text: string;
  correctCategoryId: string;
  explanation?: string;
}

interface Props {
  prompt: string;
  categories: MatchCategory[];
  items: MatchItem[];
  onAllCorrect: () => void;
  successText?: string;
}

export function DatasetMatchQuiz({
  prompt,
  categories,
  items,
  onAllCorrect,
  successText,
}: Props) {
  const reportQuizWrong = useAppStore((s) => s.reportQuizWrong);
  const reportQuizCorrect = useAppStore((s) => s.reportQuizCorrect);
  const reportQuizStuck = useAppStore((s) => s.reportQuizStuck);
  const unlockAchievement = useAppStore((s) => s.unlockAchievement);
  const [picked, setPicked] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(items.map((i) => [i.id, null])),
  );
  const [checked, setChecked] = useState(false);
  const [solved, setSolved] = useState(false);
  const [wrongChecks, setWrongChecks] = useState(0);

  const allAssigned = useMemo(
    () => items.every((i) => picked[i.id] != null),
    [picked, items],
  );

  function assign(itemId: string, categoryId: string) {
    if (solved) return;
    setPicked((p) => ({ ...p, [itemId]: categoryId }));
    if (checked) setChecked(false);
  }

  function check() {
    setChecked(true);
    const allCorrect = items.every(
      (i) => picked[i.id] === i.correctCategoryId,
    );
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

  const wrongCount =
    checked && !solved
      ? items.filter((i) => picked[i.id] !== i.correctCategoryId).length
      : 0;

  return (
    <div className="match-quiz">
      <div className="match-prompt">{prompt}</div>

      <div className="match-list">
        {items.map((item) => {
          const sel = picked[item.id];
          const isWrong = checked && sel != null && sel !== item.correctCategoryId;
          const isRight = checked && sel === item.correctCategoryId;
          return (
            <div
              key={item.id}
              className={`match-item ${isWrong ? "wrong" : ""} ${isRight ? "right" : ""}`}
            >
              <div className="match-text">{item.text}</div>
              <div className="match-options">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    className={`match-pill ${sel === c.id ? "selected" : ""} ${isWrong && sel === c.id ? "wrong" : ""} ${isRight && sel === c.id ? "right" : ""}`}
                    onClick={() => assign(item.id, c.id)}
                    disabled={solved}
                    title={c.sub}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              {solved && item.explanation && (
                <div className="match-explanation">{item.explanation}</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="match-actions">
        <button
          className="primary-button"
          onClick={check}
          disabled={!allAssigned || solved}
        >
          {solved ? "Alles korrekt" : "Zuordnung prüfen"}
        </button>
        {checked && !solved && (
          <>
            <span className="match-feedback">
              {wrongCount} von {items.length} noch falsch.
            </span>
            <button className="secondary-button" onClick={reset}>
              Alles zurücksetzen
            </button>
          </>
        )}
        {solved && (
          <span className="match-success">
            {successText ?? "Alle Zuordnungen korrekt."}
          </span>
        )}
      </div>
    </div>
  );
}
