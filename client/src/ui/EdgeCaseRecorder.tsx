import { useMemo, useState } from "react";
import type { QueryResult } from "../visualizations/LivePredictionFNO";

interface Props {
  history: QueryResult[];
  onSaved: () => void;
}

export function EdgeCaseRecorder({ history, onSaved }: Props) {
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const worst = useMemo(() => {
    if (history.length === 0) return null;
    return [...history].sort(
      (a, b) => b.meanAbsError - a.meanAbsError,
    )[0];
  }, [history]);

  const enoughExploration = history.length >= 3;
  const hasEdgeCase = worst && worst.meanAbsError > 0.04;
  const noteLongEnough = note.trim().length >= 20;

  function submit() {
    if (!worst || !noteLongEnough) return;
    setSaved(true);
    onSaved();
  }

  if (history.length === 0) {
    return (
      <div className="edgecase-empty">
        Merk dir oben ein paar Konfigurationen mit dem Button „Konfiguration
        merken“. Sobald du mindestens drei gespeichert hast, kannst du
        hier deinen Edge-Case dokumentieren.
      </div>
    );
  }

  return (
    <div className="edgecase">
      <div className="edgecase-hint">
        Eine Edge-Case-Dokumentation gehört in jedes Übergabeprotokoll. Sie
        beschreibt, in welchen Parameterbereichen das Modell unzuverlässig
        wird. Such dir die schlechteste gemerkte Konfiguration raus oder
        wandere bewusst an den Rand des Trainingsbereichs und merk dir
        diese Stellung.
      </div>

      <div className="edgecase-summary">
        <div className="edgecase-summary-head">Deine schlechteste gemerkte Konfiguration</div>
        {worst ? (
          <div className="edgecase-summary-grid">
            <div className="edgecase-summary-cell">
              <span className="edgecase-summary-label">Viskosität ν</span>
              <code>{worst.visc.toFixed(3)}</code>
            </div>
            <div className="edgecase-summary-cell">
              <span className="edgecase-summary-label">Zeitstempel T</span>
              <code>{worst.t.toFixed(2)}</code>
            </div>
            <div className="edgecase-summary-cell">
              <span className="edgecase-summary-label">Fehler</span>
              <code
                className={worst.meanAbsError > 0.05 ? "edgecase-high" : ""}
              >
                {(worst.meanAbsError * 100).toFixed(1)} %
              </code>
            </div>
            <div className="edgecase-summary-cell">
              <span className="edgecase-summary-label">Status</span>
              <code>
                {worst.inTraining ? "in Training" : "außerhalb"}
              </code>
            </div>
          </div>
        ) : null}
      </div>

      <label className="edgecase-note-label" htmlFor="edge-note">
        Notiz für die Akte (mindestens zwei Sätze):
      </label>
      <textarea
        id="edge-note"
        className="edgecase-note"
        rows={4}
        placeholder="Beschreib, warum dieser Punkt ein Edge-Case ist. Außerhalb des Trainingsbereichs? Extreme Viskosität? Welche Konsequenz für den Kunden?"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        disabled={saved}
      />

      <div className="edgecase-actions">
        <button
          className="primary-button"
          onClick={submit}
          disabled={!enoughExploration || !noteLongEnough || saved}
          title={
            !enoughExploration
              ? "Erst drei Konfigurationen merken"
              : !noteLongEnough
                ? "Notiz noch zu kurz"
                : ""
          }
        >
          {saved ? "Eingereicht" : "Edge-Case einreichen"}
        </button>
        {!enoughExploration && (
          <span className="edgecase-status">
            Noch {3 - history.length}{" "}
            {3 - history.length === 1 ? "Konfiguration" : "Konfigurationen"}{" "}
            bis zur Einreichung.
          </span>
        )}
        {enoughExploration && !hasEdgeCase && !saved && (
          <span className="edgecase-status warn">
            Alle gemerkten Punkte sind im Trainingsbereich oder knapp daran.
            Wander an den Rand und merk eine Konfiguration außerhalb,
            damit du einen echten Edge-Case hast.
          </span>
        )}
        {saved && (
          <span className="edgecase-status success">
            In die Projekt-Akte aufgenommen. Kapitel 7 ist frei.
          </span>
        )}
      </div>
    </div>
  );
}
