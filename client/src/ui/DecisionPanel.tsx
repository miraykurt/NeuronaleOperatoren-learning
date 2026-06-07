import { useState } from "react";
import { useAppStore } from "../state/store";

export type DecisionWeight = "strong" | "weak" | "wrong";

export interface DecisionOption {
  id: string;
  text: string;
  weight: DecisionWeight;
  rebuttal?: string;
}

interface Props {
  decisionId: string;
  outcomeLabel: string;
  storyHook: string;
  prompt: string;
  options: DecisionOption[];
  picksRequired: number;
  ccReward: number;
  onAccepted?: () => void;
}

type Verdict = "wrong" | "weak" | "accept" | null;

export function DecisionPanel({
  decisionId,
  outcomeLabel,
  storyHook,
  prompt,
  options,
  picksRequired,
  ccReward,
  onAccepted,
}: Props) {
  const earnCC = useAppStore((s) => s.earnCC);
  const setProjectDecision = useAppStore((s) => s.setProjectDecision);
  const pushCharacterMessage = useAppStore((s) => s.pushCharacterMessage);
  const existing = useAppStore((s) => s.projectDecisions[decisionId]);

  const committed = existing != null;
  const [picked, setPicked] = useState<string[]>([]);
  const [verdict, setVerdict] = useState<Verdict>(null);

  function toggle(id: string) {
    if (committed) return;
    setVerdict(null);
    setPicked((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < picksRequired
          ? [...prev, id]
          : prev,
    );
  }

  function submit() {
    if (committed || picked.length !== picksRequired) return;
    const chosen = options.filter((o) => picked.includes(o.id));
    const wrongs = chosen.filter((o) => o.weight === "wrong");
    const strongs = chosen.filter((o) => o.weight === "strong");

    if (wrongs.length > 0) {
      setVerdict("wrong");
      pushCharacterMessage(
        "priya",
        "Eins davon stimmt sachlich nicht. Schau nochmal hin.",
      );
      return;
    }
    if (strongs.length === 0) {
      setVerdict("weak");
      pushCharacterMessage(
        "priya",
        "Nichts Falsches dabei, aber Lena braucht mindestens einen tragfähigen Grund.",
      );
      return;
    }
    // Accept
    const chosenTexts = chosen.map((o) => o.text);
    setProjectDecision(decisionId, chosenTexts);
    earnCC(ccReward, `Empfehlung: ${outcomeLabel}`);
    pushCharacterMessage(
      "priya",
      "Saubere Begründung. Geht so in den Bericht.",
    );
    pushCharacterMessage(
      "lena",
      "Empfehlung registriert, danke. Geht an AeroDyn.",
    );
    setVerdict("accept");
    onAccepted?.();
  }

  const committedTexts = existing ?? [];

  return (
    <div className={`decision-panel ${committed ? "committed" : ""}`}>
      <div className="decision-panel-head">
        <div className="decision-panel-label">Empfehlung an das Team</div>
        <div className="decision-panel-outcome">{outcomeLabel}</div>
      </div>
      <p className="decision-panel-story">{storyHook}</p>
      <p className="decision-panel-prompt">
        <strong>{prompt}</strong>
      </p>

      {committed ? (
        <div className="decision-committed-body">
          <div className="decision-committed-tag">
            ✓ Empfehlung im Project Archive abgelegt
          </div>
          <ul className="decision-committed-list">
            {committedTexts.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <ul className="decision-options">
            {options.map((o) => {
              const sel = picked.includes(o.id);
              const showRebuttal =
                verdict === "wrong" && sel && o.weight === "wrong";
              return (
                <li
                  key={o.id}
                  className={`decision-option ${sel ? "selected" : ""} ${showRebuttal ? "rebutted" : ""}`}
                >
                  <button
                    type="button"
                    className="decision-option-btn"
                    onClick={() => toggle(o.id)}
                  >
                    <span className="decision-option-box">{sel ? "✓" : ""}</span>
                    <span className="decision-option-text">{o.text}</span>
                  </button>
                  {showRebuttal && o.rebuttal && (
                    <div className="decision-rebuttal">{o.rebuttal}</div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="decision-actions">
            <button
              className="primary-button"
              onClick={submit}
              disabled={picked.length !== picksRequired}
            >
              Empfehlung absenden ({picked.length} / {picksRequired})
            </button>
            {verdict === "wrong" && (
              <span className="decision-feedback wrong">
                Mindestens ein Argument hält fachlich nicht. Korrigier die
                Auswahl.
              </span>
            )}
            {verdict === "weak" && (
              <span className="decision-feedback weak">
                Reicht nicht für den Bericht. Such mindestens einen starken
                Grund.
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
