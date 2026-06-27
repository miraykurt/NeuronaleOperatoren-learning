import { useState } from "react";
import { useAppStore } from "../state/store";

export interface RankingFamily {
  id: string;
  label: string;
  description: string;
  rank: number;
}

interface Props {
  decisionId: string;
  outcomeLabel: string;
  storyHook: string;
  prompt: string;
  families: RankingFamily[];
  ccReward: number;
  onAccepted?: () => void;
}

export function FamilyRankingPanel({
  decisionId,
  outcomeLabel,
  storyHook,
  prompt,
  families,
  ccReward,
  onAccepted,
}: Props) {
  const earnCC = useAppStore((s) => s.earnCC);
  const setProjectDecision = useAppStore((s) => s.setProjectDecision);
  const pushCharacterMessage = useAppStore((s) => s.pushCharacterMessage);
  const existing = useAppStore((s) => s.projectDecisions[decisionId]);
  const committed = existing != null;

  const totalSlots = families.length;
  const [picked, setPicked] = useState<(string | null)[]>(
    Array(totalSlots).fill(null),
  );
  const [showFeedback, setShowFeedback] = useState(false);

  const pool = families.filter((f) => !picked.includes(f.id));
  const allFilled = picked.every((p) => p !== null);

  function placeFamily(id: string) {
    if (committed) return;
    setShowFeedback(false);
    setPicked((prev) => {
      const next = [...prev];
      const emptyIdx = next.indexOf(null);
      if (emptyIdx === -1) return prev;
      next[emptyIdx] = id;
      return next;
    });
  }

  function removeFromSlot(idx: number) {
    if (committed) return;
    setShowFeedback(false);
    setPicked((prev) => {
      const next = [...prev];
      next[idx] = null;
      return next;
    });
  }

  function submit() {
    if (committed || !allFilled) return;
    const allCorrect = picked.every((id, i) => {
      const fam = families.find((f) => f.id === id);
      return !!fam && fam.rank === i + 1;
    });
    if (allCorrect) {
      const ranking = picked.map((id, i) => {
        const fam = families.find((f) => f.id === id)!;
        return `${i + 1}. ${fam.label}, ${fam.description}`;
      });
      setProjectDecision(decisionId, ranking);
      earnCC(ccReward, `Empfehlung: ${outcomeLabel}`);
      pushCharacterMessage(
        "priya",
        "Saubere Engineering-Einordnung. Geht so in den Bericht.",
      );
      pushCharacterMessage(
        "lena",
        "Empfehlung registriert, danke. Geht an AeroDyn.",
      );
      onAccepted?.();
    } else {
      pushCharacterMessage(
        "priya",
        "Die Reihenfolge stimmt noch nicht. Schau dir die rot markierten Plätze an.",
      );
      setShowFeedback(true);
    }
  }

  if (committed) {
    return (
      <div className="ranking-panel committed">
        <div className="ranking-panel-head">
          <div className="ranking-panel-label">Empfehlung an das Team</div>
          <div className="ranking-panel-outcome">{outcomeLabel}</div>
        </div>
        <div className="ranking-committed-tag">
          ✓ Empfehlung im Project Archive abgelegt
        </div>
        <ol className="ranking-committed-list">
          {existing.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div className="ranking-panel">
      <div className="ranking-panel-head">
        <div className="ranking-panel-label">Empfehlung an das Team</div>
        <div className="ranking-panel-outcome">{outcomeLabel}</div>
      </div>
      <p className="ranking-panel-story">{storyHook}</p>
      <p className="ranking-panel-prompt">
        <strong>{prompt}</strong>
      </p>

      <div className="ranking-slots">
        {picked.map((id, i) => {
          const fam = id ? families.find((f) => f.id === id) : null;
          const isWrong = showFeedback && fam && fam.rank !== i + 1;
          const isRight = showFeedback && fam && fam.rank === i + 1;
          return (
            <div
              key={i}
              className={`ranking-slot ${fam ? "filled" : "empty"} ${
                isWrong ? "wrong" : ""
              } ${isRight ? "right" : ""}`}
            >
              <div className="ranking-slot-rank">{i + 1}</div>
              {fam ? (
                <button
                  type="button"
                  className="ranking-slot-card"
                  onClick={() => removeFromSlot(i)}
                  title="Klick gibt die Familie zurück in den Pool"
                >
                  <div className="ranking-card-label">{fam.label}</div>
                  <div className="ranking-card-desc">{fam.description}</div>
                </button>
              ) : (
                <div className="ranking-slot-placeholder">
                  Klick eine Familie unten
                </div>
              )}
            </div>
          );
        })}
      </div>

      {pool.length > 0 && (
        <>
          <div className="ranking-pool-label">Verfügbar</div>
          <div className="ranking-pool">
            {pool.map((fam) => (
              <button
                key={fam.id}
                type="button"
                className="ranking-pool-card"
                onClick={() => placeFamily(fam.id)}
              >
                <div className="ranking-card-label">{fam.label}</div>
                <div className="ranking-card-desc">{fam.description}</div>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="ranking-actions">
        <button
          type="button"
          className="primary-button"
          onClick={submit}
          disabled={!allFilled}
        >
          Empfehlung absenden
        </button>
        {!allFilled && (
          <span className="ranking-hint">
            Bring alle vier Familien in eine Rangfolge, dann kannst du
            absenden.
          </span>
        )}
        {showFeedback && (
          <span className="ranking-feedback wrong">
            Mindestens eine Familie steht nicht an der richtigen Stelle.
            Klick auf eine Karte, um sie zurückzugeben.
          </span>
        )}
      </div>
    </div>
  );
}
