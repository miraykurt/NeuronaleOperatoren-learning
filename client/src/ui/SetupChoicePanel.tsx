import { useState } from "react";
import { useAppStore } from "../state/store";

export interface SetupOption {
  id: string;
  label: string;
  details: string[];
  verdict: string;
  isCorrect: boolean;
}

interface Props {
  decisionId: string;
  outcomeLabel: string;
  storyHook: string;
  prompt: string;
  options: SetupOption[];
  ccReward: number;
  onAccepted?: () => void;
}

export function SetupChoicePanel({
  decisionId,
  outcomeLabel,
  storyHook,
  prompt,
  options,
  ccReward,
  onAccepted,
}: Props) {
  const earnCC = useAppStore((s) => s.earnCC);
  const setProjectDecision = useAppStore((s) => s.setProjectDecision);
  const pushCharacterMessage = useAppStore((s) => s.pushCharacterMessage);
  const existing = useAppStore((s) => s.projectDecisions[decisionId]);
  const committed = existing != null;

  const [picked, setPicked] = useState<string | null>(null);

  function handlePick(id: string) {
    if (committed) return;
    const option = options.find((o) => o.id === id);
    if (!option) return;
    setPicked(id);
    if (option.isCorrect) {
      const stored = [option.label, ...option.details];
      setProjectDecision(decisionId, stored);
      earnCC(ccReward, `Setup: ${outcomeLabel}`);
      pushCharacterMessage(
        "priya",
        "Saubere Wahl. Das ist das Setup, mit dem das Team die 12 Experimente fährt.",
      );
      pushCharacterMessage("lena", "Empfehlung registriert, geht an AeroDyn.");
      onAccepted?.();
    } else {
      pushCharacterMessage(
        "priya",
        "Klingt plausibel, ist aber nicht das gewählte Setup. Schau dir die Auflösung an.",
      );
    }
  }

  if (committed) {
    const chosenLabel = existing[0] ?? outcomeLabel;
    const chosenDetails = existing.slice(1);
    return (
      <div className="setup-choice-panel committed">
        <div className="setup-choice-head">
          <div className="setup-choice-label">Trainings-Setup</div>
          <div className="setup-choice-outcome">{outcomeLabel}</div>
        </div>
        <div className="setup-committed-tag">
          ✓ Setup im Project Archive abgelegt
        </div>
        <div className="setup-committed-label">{chosenLabel}</div>
        <ul className="setup-committed-list">
          {chosenDetails.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      </div>
    );
  }

  const pickedOption = picked ? options.find((o) => o.id === picked) : null;

  return (
    <div className="setup-choice-panel">
      <div className="setup-choice-head">
        <div className="setup-choice-label">Setup für das Training</div>
        <div className="setup-choice-outcome">{outcomeLabel}</div>
      </div>
      <p className="setup-choice-story">{storyHook}</p>
      <p className="setup-choice-prompt">
        <strong>{prompt}</strong>
      </p>

      <div className="setup-grid">
        {options.map((opt) => {
          const isPicked = picked === opt.id;
          const isRight = isPicked && opt.isCorrect;
          const isWrong = isPicked && !opt.isCorrect;
          return (
            <button
              key={opt.id}
              type="button"
              className={`setup-card ${isPicked ? "picked" : ""} ${
                isRight ? "right" : ""
              } ${isWrong ? "wrong" : ""}`}
              onClick={() => handlePick(opt.id)}
            >
              <div className="setup-label">{opt.label}</div>
              <ul className="setup-details">
                {opt.details.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {pickedOption && (
        <div
          className={`setup-verdict ${
            pickedOption.isCorrect ? "right" : "wrong"
          }`}
        >
          <div className="setup-verdict-label">
            {pickedOption.isCorrect ? "✓ Richtig" : "× Schau nochmal hin"}
          </div>
          <div>{pickedOption.verdict}</div>
        </div>
      )}
    </div>
  );
}
