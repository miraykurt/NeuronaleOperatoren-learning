import { useAppStore } from "../state/store";
import { GridZoom } from "../visualizations/GridZoom";
import { ComplexityTable } from "../visualizations/ComplexityTable";
import { CustomGridSize } from "../visualizations/CustomGridSize";
import { OpenQuestion } from "../ui/OpenQuestion";
import { ChapterIntro } from "../ui/ChapterIntro";

const ABSCHLUSS_FRAGE =
  "Erklär in zwei bis drei eigenen Sätzen, warum klassische Solver bei steigender Gitterauflösung schnell unbenutzbar werden, und welche Idee dahintersteht, das Problem stattdessen mit einem neuronalen Operator anzugehen.";

export function Kapitel2() {
  const completeChapter = useAppStore((s) => s.completeChapter);
  const earnCC = useAppStore((s) => s.earnCC);
  const setView = useAppStore((s) => s.setView);
  const setChatMode = useAppStore((s) => s.setChatMode);
  const toggleChat = useAppStore((s) => s.toggleChat);
  const chatOpen = useAppStore((s) => s.chatOpen);
  const done = useAppStore((s) => s.completedChapters.includes(2));

  function openSokrates() {
    setChatMode("sokrates");
    if (!chatOpen) toggleChat();
  }

  function handleAccepted() {
    if (!done) {
      completeChapter(2);
      earnCC(120, "Kapitel 2 abgeschlossen");
    }
  }

  return (
    <div>
      <ChapterIntro chapter={2} meta="Kapitel 2 · Rechenzeit-Problem" title="Gitter vs. Operator: warum klassische Verfahren zu langsam sind" />
      <p>
        Klassische Verfahren wie die Finite-Elemente-Methode (FEM) zerlegen
        das Rechengebiet in ein Gitter und lösen ein großes Gleichungssystem
        über alle Zellen. Verdoppelst du die Auflösung pro Achse,
        vervierfacht sich die Zellzahl in 2D, und verachtfacht sich in 3D.
        Die Rechenzeit folgt.
      </p>

      <GridZoom />

      <h2>Komplexität nach Dimension</h2>
      <p>
        Such dir eine Dimension und eine Feinheitsstufe aus. Die Tabelle
        zeigt, wie schnell ein klassischer Solver an die Wand fährt, vom
        Wimpernschlag bis übers ganze Studium.
      </p>
      <ComplexityTable />

      <h2>Probier eigene Werte</h2>
      <p>
        Eigene Gittergröße eingeben, Solver starten. Du siehst die Sanduhr
        kurz drehen. In der Realität würde die Berechnung bei realistischen
        Größen tatsächlich so lange dauern. Genau hier ist 3D-Echtzeit mit
        klassischen Verfahren nicht mehr realisierbar.
      </p>
      <CustomGridSize />

      <h2>Was wäre, wenn …</h2>
      <p>
        … man die Lösung nicht jedes Mal neu rechnet, sondern eine Funktion
        lernt, die für viele Konfigurationen direkt eine Antwort liefert?
        Einmaliger Aufwand beim Training, danach sofortige Antworten ohne
        neues Lösen.
      </p>
      <p>
        Bleibt die Frage: geht das überhaupt? Und wenn ja, wie?
      </p>

      <h2>Selber denken: Sokrates-Modus</h2>
      <p>
        Wenn du die Komplexität selbst herleiten willst, statt sie
        vorgelesen zu bekommen, frag den Tutor im Sokrates-Modus. Er
        antwortet mit Gegenfragen, bis du die Erklärung selbst formulierst.
      </p>
      <button className="secondary-button" onClick={openSokrates}>
        Sokrates-Chat starten
      </button>

      <h2>Abschluss · Deine Antwort</h2>
      <p>
        Schreib in eigenen Worten. Der Tutor wertet deine Antwort
        individuell aus, du kannst sie überarbeiten und erneut einreichen.
      </p>
      <OpenQuestion
        question={ABSCHLUSS_FRAGE}
        chapter={2}
        onAccepted={handleAccepted}
      />

      {done && (
        <div className="chapter-done">
          <div>
            <div className="chapter-done-headline">
              Kapitel 2 abgeschlossen · +120 CC
            </div>
            <div className="chapter-done-sub">
              Kapitel 3 ist in der Seitenleiste freigeschaltet.
            </div>
          </div>
          <button
            className="primary-button"
            onClick={() => setView({ type: "chapter", id: 3 })}
          >
            Weiter zu Kapitel 3
          </button>
        </div>
      )}
    </div>
  );
}
