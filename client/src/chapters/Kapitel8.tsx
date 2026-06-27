import { useAppStore } from "../state/store";
import { ChapterIntro } from "../ui/ChapterIntro";
import { TrainingPipeline } from "../visualizations/TrainingPipeline";
import { pick, LENA_AT_PROJECT_DONE } from "../state/messageTemplates";

interface SelfRatingItem {
  key: string;
  label: string;
  question: string;
}

const SELF_RATING_ITEMS: SelfRatingItem[] = [
  {
    key: "solver-vs-operator",
    label: "Solver gegen Operator",
    question:
      "Warum löst ein neuronaler Operator das Rechenzeit-Problem klassischer Solver bei vielen Konfigurationen?",
  },
  {
    key: "operator-concept",
    label: "Operator-Konzept",
    question:
      "Was ist der Unterschied zwischen einem klassischen NN (Zahl-zu-Zahl) und einem neuronalen Operator (Funktion-zu-Funktion)?",
  },
  {
    key: "fno-architecture",
    label: "FNO-Architektur",
    question:
      "Warum arbeitet der FNO im Frequenzraum, und welche Rolle spielt die Modenzahl k?",
  },
  {
    key: "training-pipeline",
    label: "Trainings-Pipeline",
    question:
      "Wie wird ein FNO praktisch trainiert (Daten splitten, Loss, Optimizer, Val/Test)?",
  },
  {
    key: "handover",
    label: "Übergabe an den Kunden",
    question:
      "Welche Limitationen (Trainingsbereich, Mode-Cutoff, Dimensions-Grenze) muss ich ehrlich kommunizieren?",
  },
];

interface Rating {
  value: string;
  emoji: string;
  label: string;
}

const RATINGS: Rating[] = [
  { value: "unsicher", emoji: "😕", label: "Unsicher" },
  { value: "okay", emoji: "🙂", label: "Okay" },
  { value: "sicher", emoji: "😄", label: "Sicher" },
];

export function Kapitel8() {
  const setView = useAppStore((s) => s.setView);
  const done = useAppStore((s) => s.completedChapters.includes(8));
  const completeChapter = useAppStore((s) => s.completeChapter);
  const earnCC = useAppStore((s) => s.earnCC);
  const pushCharacterMessage = useAppStore((s) => s.pushCharacterMessage);
  const visitedRooms = useAppStore((s) => s.visitedRooms);
  const projectRetro = useAppStore((s) => s.projectRetro);
  const setRetroAnswer = useAppStore((s) => s.setRetroAnswer);
  const notebookVisited = visitedRooms.includes("notebook");

  const ratedCount = SELF_RATING_ITEMS.filter(
    (item) => (projectRetro[item.key] ?? "").length > 0,
  ).length;
  const totalCount = SELF_RATING_ITEMS.length;
  const allRated = ratedCount === totalCount;

  function openNotebook() {
    setView({ type: "room", id: "notebook" });
  }

  function handleSubmit() {
    if (done || !allRated) return;
    completeChapter(8);
    earnCC(240, "Kapitel 8 abgeschlossen");
    pushCharacterMessage("lena", pick(LENA_AT_PROJECT_DONE));
  }

  return (
    <div>
      <ChapterIntro
        chapter={8}
        meta="Kapitel 8 · Code & Projektabschluss"
        title="Die Infrastruktur und der Projekt-Retro"
      />

      <h2>Wie das echte Training abgelaufen ist</h2>
      <p>
        Egal wie groß das Setup, ein neuronaler Operator wird immer auf
        ähnliche Weise trainiert: Daten vorbereiten, Modell bauen, viele
        Trainings-Runden durchlaufen, am Ende auswerten. Die 12
        Experimente im Notebook folgen alle dieser Pipeline, klick eine Station für Details.
      </p>
      <TrainingPipeline />

      <h2>Was dich im Notebook erwartet</h2>
      <p>
        Das Notebook bündelt alle 12 Experimente in einer
        VS-Code-ähnlichen Oberfläche. Damit du nicht erschlagen wirst,
        hier vier Orientierungspunkte zum Inhalt.
      </p>

      <div className="notebook-preview">
        <h3>Wie das Notebook aufgebaut ist</h3>

        <div className="notebook-preview-grid">
          <div className="notebook-preview-card">
            <div className="notebook-preview-card-title">
              12 Experimente als Tabs
            </div>
            <div className="notebook-preview-card-body">
              Sortiert nach Schwierigkeit:{" "}
              <span className="lvl-dot green" /> Einstieg (1D Advection
              β=0.2),{" "}
              <span className="lvl-dot yellow" /> 1D-Schock (Advection
              β=4.0),{" "}
              <span className="lvl-dot orange" /> 2D-Anomalie (CFD
              Random) und{" "}
              <span className="lvl-dot red" /> Grenze (CFD Turbulent).
              Pro Datensatz drei Modenzahlen (4, 8, 16). Mit zunehmender
              Modenzahl sinkt im 1D-Fall der Fehler sauber, im 2D-Fall
              aber nicht immer.
            </div>
          </div>

          <div className="notebook-preview-card">
            <div className="notebook-preview-card-title">
              Sidebar mit Projekt-Repo
            </div>
            <div className="notebook-preview-card-body">
              Die echte Ordnerstruktur von <code>FNOTrainingReal/</code>:{" "}
              <code>configs/base.yaml</code> mit den Defaults,{" "}
              <code>configs/experiments.yaml</code> mit den 12
              Einträgen, <code>src/train.py</code> als Entrypoint, plus
              Dockerfile und <code>summary.json</code> pro abgeschlossenem
              Lauf. Klick öffnet den jeweiligen Inhalt im Vorschau-Fenster.
            </div>
          </div>

          <div className="notebook-preview-card">
            <div className="notebook-preview-card-title">
              Code-Cells mit echtem Output
            </div>
            <div className="notebook-preview-card-body">
              Jede Cell ist eine kompakte Single-GPU-Variante der
              entsprechenden Stelle aus <code>src/train.py</code>. Klick
              auf eine Code-Zeile mit ⓘ öffnet eine Erklärung im rechten
              Panel. Klick auf ▶ zeigt den echten Output aus{" "}
              <code>outputs/&lt;experiment&gt;/</code>, samt Plots und
              Prediction-GIF.
            </div>
          </div>

          <div className="notebook-preview-card">
            <div className="notebook-preview-card-title">
              Übersicht und Lese-Reihenfolge
            </div>
            <div className="notebook-preview-card-body">
              Ganz unten in der Sidebar: eine Heatmap aller 12
              final-Test-L²-Werte über Datensatz und Modenzahl, eine
              empfohlene Reihenfolge mit Begründung pro Schritt und drei
              Schlüssel-Beobachtungen. Hier findest du die Anomalie, dass
              CFD-Random bei k=8 schlechter ist als bei k=4.
            </div>
          </div>
        </div>
      </div>

      <h2>Notebook öffnen</h2>
      <p>
        Klick öffnet das Notebook Terminal. Wenn du dir dort kurz Zeit
        nimmst, erscheint hier unten der Projekt-Retro als Abschluss.
      </p>
      <button className="primary-button" onClick={openNotebook}>
        {notebookVisited ? "Notebook erneut öffnen" : "Notebook öffnen"}
      </button>

      {notebookVisited ? (
        <>
          <h2>Abschluss · Wie sicher fühlst du dich?</h2>
          <p>
            Fünf Themen aus dem Projekt. Klick pro Thema einen Smiley.
            Keine Bewertung, sondern eine ehrliche Selbsteinschätzung,
            die im Project Archive mit ausgegeben wird.
          </p>

          <div className="self-rating-form">
            {SELF_RATING_ITEMS.map((item) => {
              const current = projectRetro[item.key] ?? "";
              return (
                <div key={item.key} className="self-rating-item">
                  <div className="self-rating-label">{item.label}</div>
                  <div className="self-rating-question">{item.question}</div>
                  <div className="self-rating-options">
                    {RATINGS.map((r) => {
                      const isActive = current === r.value;
                      return (
                        <button
                          key={r.value}
                          type="button"
                          className={`self-rating-btn ${isActive ? "active" : ""} ${r.value}`}
                          onClick={() => setRetroAnswer(item.key, r.value)}
                        >
                          <span className="self-rating-emoji">{r.emoji}</span>
                          <span className="self-rating-text">{r.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {!done && (
              <div className="self-rating-actions">
                <button
                  className="primary-button"
                  onClick={handleSubmit}
                  disabled={!allRated}
                >
                  Selbsteinschätzung abgeben & Projekt beenden
                </button>
                {!allRated && (
                  <span className="self-rating-hint">
                    {ratedCount} von {totalCount} Themen bewertet. Wähl
                    für jedes Thema einen Smiley, dann kannst du den
                    Kurs beenden.
                  </span>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <p className="chapter-hint">
          Öffne erst das Notebook im Notebook Terminal, danach erscheint
          hier dein Abschluss.
        </p>
      )}

      {done && (
        <div className="course-complete">
          <div className="course-complete-sub">
            Alle acht Kapitel durch, Selbsteinschätzung gespeichert,
            +240 CC gutgeschrieben. Die fertige Akte liegt im Project
            Archive.
          </div>
          <button
            className="primary-button"
            onClick={() => setView({ type: "room", id: "archive" })}
          >
            Zum Project Archive
          </button>
        </div>
      )}
    </div>
  );
}
