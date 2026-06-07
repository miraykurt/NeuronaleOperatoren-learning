import { useState } from "react";

interface Prediction {
  id: string;
  text: string;
}

const PREDICTIONS_VISC: Prediction[] = [
  { id: "smoother", text: "Die Kurve wird glatter, die Schockfront verwischt." },
  { id: "sharper", text: "Die Kurve wird schärfer, die Front bleibt steil." },
  { id: "shift", text: "Die Kurve wandert nach rechts oder links." },
];

const PREDICTIONS_TIME: Prediction[] = [
  { id: "shift_right", text: "Die Welle wandert weiter nach rechts." },
  { id: "flatter", text: "Die Welle wird insgesamt flacher." },
  { id: "no_change", text: "Es ändert sich praktisch nichts." },
];

const ANSWER_VISC = "smoother";
const ANSWER_TIME = "shift_right";

interface RowProps {
  title: string;
  options: Prediction[];
  correctId: string;
}

function PredictRow({ title, options, correctId }: RowProps) {
  const [chosen, setChosen] = useState<string | null>(null);
  const correct = chosen === correctId;

  return (
    <div className="predict-row">
      <div className="predict-title">{title}</div>
      <div className="predict-options">
        {options.map((p) => {
          const isChosen = chosen === p.id;
          const isAnswer = chosen != null && p.id === correctId;
          const cls = [
            "predict-option",
            isChosen ? "chosen" : "",
            isChosen && correct ? "correct" : "",
            isChosen && !correct ? "wrong" : "",
            !isChosen && isAnswer ? "reveal" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              key={p.id}
              type="button"
              className={cls}
              onClick={() => setChosen(p.id)}
              disabled={chosen != null}
            >
              {p.text}
            </button>
          );
        })}
      </div>
      {chosen != null && (
        <div className={`predict-feedback ${correct ? "ok" : "off"}`}>
          {correct
            ? "Treffer. Probier den Slider und sieh selbst, ob es genau so passiert."
            : "Daneben. Schieb den Slider und beobachte: die korrekt markierte Option zeigt, was wirklich passiert."}
        </div>
      )}
    </div>
  );
}

export function PredictBeforeSlide() {
  return (
    <div className="predict">
      <PredictRow
        title="Was passiert mit der Kurve, wenn du die Viskosität ν erhöhst?"
        options={PREDICTIONS_VISC}
        correctId={ANSWER_VISC}
      />
      <PredictRow
        title="Was passiert mit der Kurve, wenn du den Zeitstempel T erhöhst?"
        options={PREDICTIONS_TIME}
        correctId={ANSWER_TIME}
      />
    </div>
  );
}
