import { useAppStore } from "../state/store";
import { DockerDiagram } from "../visualizations/DockerDiagram";
import { ChapterIntro } from "../ui/ChapterIntro";
import { pick, LENA_AT_PROJECT_DONE } from "../state/messageTemplates";

interface RetroQuestion {
  key: string;
  label: string;
  placeholder: string;
}

const RETRO_QUESTIONS: RetroQuestion[] = [
  {
    key: "aha",
    label: "1. Was war für dich der wichtigste Aha-Moment?",
    placeholder:
      "z. B. dass der FNO im Frequenzraum arbeitet und deshalb auflösungsunabhängig ist …",
  },
  {
    key: "open",
    label: "2. Wo hast du noch eine offene Frage?",
    placeholder:
      "z. B. wie sich das Verhalten bei 2D-Strömungen verändert …",
  },
  {
    key: "next",
    label: "3. Was würdest du beim nächsten Projekt anders angehen?",
    placeholder:
      "z. B. früher den Trainingsbereich mit dem Kunden klären …",
  },
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

  const allAnswered = RETRO_QUESTIONS.every(
    (q) => (projectRetro[q.key] ?? "").trim().length > 0,
  );

  function openNotebook() {
    setView({ type: "room", id: "notebook" });
  }

  function handleSubmit() {
    if (done || !allAnswered) return;
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

      <h2>Die Infrastruktur sichtbar gemacht</h2>
      <p>
        Es ist dieselbe Container-Umgebung wie in Einheit 1, jetzt mit
        echtem Inhalt: Browser, Container, Ergebnis. Klick eine Station
        für Details.
      </p>
      <DockerDiagram />

      <h2>Das Notebook ansehen</h2>
      <p>
        Bevor der Projektabschluss kommt: schau dir das vorbereitete
        FNO-Trainings-Notebook im Notebook Terminal an. Setup, Modell,
        Training und Auswertung — alles, was AeroDyn am Ende bekommt.
      </p>
      <button className="primary-button" onClick={openNotebook}>
        {notebookVisited ? "Notebook erneut öffnen" : "Notebook öffnen"}
      </button>

      {notebookVisited ? (
        <>
          <h2>Abschluss · Projekt-Retro</h2>
          <p>
            Drei kurze Fragen am Ende, wie nach jedem echten Projekt.
            Deine Antworten landen im Project Archive und werden mit ins
            PDF exportiert — als persönliches Lern-Protokoll, nicht als
            Bewertung.
          </p>

          <div className="retro-form">
            {RETRO_QUESTIONS.map((q) => (
              <div key={q.key} className="retro-question">
                <label className="retro-label" htmlFor={`retro-${q.key}`}>
                  {q.label}
                </label>
                <textarea
                  id={`retro-${q.key}`}
                  className="retro-input"
                  value={projectRetro[q.key] ?? ""}
                  onChange={(e) => setRetroAnswer(q.key, e.target.value)}
                  placeholder={q.placeholder}
                  rows={3}
                  disabled={done}
                />
              </div>
            ))}

            {!done && (
              <div className="retro-actions">
                <button
                  className="primary-button"
                  onClick={handleSubmit}
                  disabled={!allAnswered}
                >
                  Retro abgeben & Projekt übergeben
                </button>
                {!allAnswered && (
                  <span className="retro-hint">
                    Alle drei Felder ausfüllen, dann kannst du übergeben.
                  </span>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <p className="chapter-hint">
          Öffne erst das Notebook im Notebook Terminal — danach erscheint
          hier dein Projekt-Retro.
        </p>
      )}

      {done && (
        <div className="chapter-done">
          <div>
            <div className="chapter-done-headline">
              Kapitel 8 abgeschlossen · +240 CC · Projekt fertig
            </div>
            <div className="chapter-done-sub">
              Alle acht Kapitel durch, Retro im Archive. Die Akte ist
              bereit für den Kunden.
            </div>
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
