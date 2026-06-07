import { useMemo, useState } from "react";

const TRAIN_X_MIN = 0.05;
const TRAIN_X_MAX = 0.5;
const TRAIN_Y_MIN = 0.1;
const TRAIN_Y_MAX = 1.0;

interface Recommendation {
  viscRange: [number, number];
  tRange: [number, number];
  withinTraining: boolean;
  feasible: boolean;
  comment: string;
}

function recommend(budgetPct: number): Recommendation {
  // 0…2 %: nur strikt innerhalb des Trainingsbereichs
  // 2…5 %: ganzer Trainingsbereich, leicht über die Ränder
  // 5…10 %: knapp außerhalb akzeptabel
  // 10…20 %: weit raus möglich
  // > 20 %: praktisch beliebig (aber inhaltlich oft wertlos)
  if (budgetPct < 0.5) {
    return {
      viscRange: [TRAIN_X_MIN, TRAIN_X_MAX],
      tRange: [TRAIN_Y_MIN, TRAIN_Y_MAX],
      withinTraining: true,
      feasible: false,
      comment:
        "Unter 0,5 % Fehler ist das FNO-Modell selten verlässlich. Hier brauchst du den klassischen Solver, oder ein speziell auf diese Anforderung trainiertes Modell.",
    };
  }
  if (budgetPct < 2) {
    return {
      viscRange: [TRAIN_X_MIN + 0.05, TRAIN_X_MAX - 0.05],
      tRange: [TRAIN_Y_MIN + 0.05, TRAIN_Y_MAX - 0.1],
      withinTraining: true,
      feasible: true,
      comment:
        "Knapper Spielraum. Bleib im inneren Bereich des Trainings. Randzonen bringen schon hier zusätzliches Risiko.",
    };
  }
  if (budgetPct < 5) {
    return {
      viscRange: [TRAIN_X_MIN, TRAIN_X_MAX],
      tRange: [TRAIN_Y_MIN, TRAIN_Y_MAX],
      withinTraining: true,
      feasible: true,
      comment:
        "Solide Toleranz. Du kannst den vollen Trainingsbereich nutzen. Außerhalb bleibst du besser nicht, dort wächst der Fehler schnell.",
    };
  }
  if (budgetPct < 10) {
    return {
      viscRange: [TRAIN_X_MIN - 0.02, TRAIN_X_MAX + 0.1],
      tRange: [TRAIN_Y_MIN - 0.05, TRAIN_Y_MAX + 0.2],
      withinTraining: false,
      feasible: true,
      comment:
        "Mit etwas Toleranz darfst du knapp über die Trainingsgrenzen hinaus. Stichprobenartig mit dem Solver verifizieren bleibt Pflicht.",
    };
  }
  if (budgetPct < 20) {
    return {
      viscRange: [0.01, 0.8],
      tRange: [0.05, 1.6],
      withinTraining: false,
      feasible: true,
      comment:
        "Großzügige Toleranz erlaubt deutlich mehr Spielraum. Akzeptabel etwa für schnelle Vorerkundung, nicht für finale Entscheidungen.",
    };
  }
  return {
    viscRange: [0.01, 1.0],
    tRange: [0.05, 2.0],
    withinTraining: false,
    feasible: true,
    comment:
      "Über 20 % Fehler ist meistens kein Anwendungsfall mehr. Das Modell liefert hier nur grobe qualitative Trends.",
  };
}

function fmt([a, b]: [number, number]): string {
  return `[${a.toFixed(2)}, ${b.toFixed(2)}]`;
}

export function ErrorBudget() {
  const [budget, setBudget] = useState(3);
  const rec = useMemo(() => recommend(budget), [budget]);

  return (
    <div className="errbudget">
      <div className="errbudget-input-row">
        <label className="errbudget-label">
          Genauigkeitsanforderung:
          <code>{budget.toFixed(1)} %</code> maximaler Fehler
        </label>
        <input
          type="range"
          min={0.2}
          max={25}
          step={0.1}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="errbudget-slider"
        />
        <div className="errbudget-input-ticks">
          <span>strict</span>
          <span>locker</span>
        </div>
      </div>

      <div
        className={`errbudget-result ${rec.feasible ? "" : "infeasible"}`}
      >
        <div className="errbudget-result-head">
          {rec.feasible ? "Empfohlene Parametergrenzen" : "Nicht erfüllbar mit dem aktuellen Modell"}
        </div>
        {rec.feasible && (
          <div className="errbudget-result-grid">
            <div className="errbudget-result-cell">
              <span className="errbudget-result-label">Viskosität ν</span>
              <code>{fmt(rec.viscRange)}</code>
            </div>
            <div className="errbudget-result-cell">
              <span className="errbudget-result-label">Zeitstempel T</span>
              <code>{fmt(rec.tRange)}</code>
            </div>
            <div className="errbudget-result-cell">
              <span className="errbudget-result-label">Status</span>
              <code className={rec.withinTraining ? "ok" : "warn"}>
                {rec.withinTraining ? "in Training" : "teils außerhalb"}
              </code>
            </div>
          </div>
        )}
        <div className="errbudget-comment">{rec.comment}</div>
      </div>
    </div>
  );
}
