import { useAppStore } from "../state/store";
import { FourierDecomposition } from "../visualizations/FourierDecomposition";
import { FrequencyCutoff } from "../visualizations/FrequencyCutoff";
import { FNOLayerFlow } from "../visualizations/FNOLayerFlow";
import { ThreeModels } from "../visualizations/ThreeModels";
import { QuizSeries, type QuizQuestion } from "../ui/QuizSeries";
import { ChapterIntro } from "../ui/ChapterIntro";

const QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    question:
      "Warum arbeitet der FNO im Frequenzraum statt direkt auf dem Gitter?",
    options: [
      {
        id: "a",
        text: "Weil die FFT zufällig der schnellste Algorithmus auf modernen GPUs ist.",
      },
      {
        id: "b",
        text: "Weil globale Beziehungen zwischen Punkten im Frequenzraum durch wenige Moden ausgedrückt werden. Der FNO sieht den ganzen Definitionsbereich auf einmal.",
      },
      {
        id: "c",
        text: "Weil PDEs nur im Frequenzraum lösbar sind.",
      },
      {
        id: "d",
        text: "Weil das Modell sonst keine Aktivierungsfunktion benutzen könnte.",
      },
    ],
    correctId: "b",
    explanation:
      "Genau. Im Ortsraum müsste ein CNN viele Schichten stapeln, um globale Effekte zu erfassen. Im Frequenzraum sind wenige Moden direkt global wirksam.",
  },
  {
    id: "q2",
    question:
      "Was passiert, wenn der Frequenz-Cutoff zu niedrig gesetzt ist?",
    options: [
      {
        id: "a",
        text: "Das Modell wird langsamer.",
      },
      {
        id: "b",
        text: "Die Rekonstruktion wird zu glatt, feine Details und scharfe Übergänge gehen verloren.",
      },
      {
        id: "c",
        text: "Das Modell hört auf zu lernen, weil keine Gradienten mehr fließen.",
      },
      {
        id: "d",
        text: "Das Rauschen verstärkt sich, weil hohe Frequenzen fehlen.",
      },
    ],
    correctId: "b",
    explanation:
      "Korrekt. Niedriger Cutoff = nur grobe Form. Höhere Frequenzen tragen die Details, schneidet man sie zu früh ab, fehlen sie im Output.",
  },
  {
    id: "q3",
    question:
      "Worin liegt der zentrale Unterschied zwischen FNO und einem CNN bei der gleichen PDE?",
    options: [
      {
        id: "a",
        text: "CNNs sind grundsätzlich genauer als FNOs.",
      },
      {
        id: "b",
        text: "Es gibt keinen relevanten Unterschied, beides sind Faltungen.",
      },
      {
        id: "c",
        text: "Ein CNN sieht nur lokale Nachbarschaften und ist auf eine feste Gitterauflösung gebunden; ein FNO arbeitet global und auflösungsunabhängig.",
      },
      {
        id: "d",
        text: "FNOs können nur in 1D arbeiten, CNNs in beliebigen Dimensionen.",
      },
    ],
    correctId: "c",
    explanation:
      "Richtig. Lokale vs. globale Sichtweise und Gitterunabhängigkeit sind die beiden Eigenschaften, die den FNO bei PDE-Lösungen ausmachen.",
  },
];

export function Kapitel4() {
  const completeChapter = useAppStore((s) => s.completeChapter);
  const earnCC = useAppStore((s) => s.earnCC);
  const setView = useAppStore((s) => s.setView);
  const done = useAppStore((s) => s.completedChapters.includes(4));

  function handleAllCorrect() {
    if (!done) {
      completeChapter(4);
      earnCC(180, "Kapitel 4 abgeschlossen");
    }
  }

  return (
    <div>
      <ChapterIntro chapter={4} meta="Kapitel 4 · Fourier Neural Operator" title="Architektur, Frequenzraum und globale Mustererkennung" />
      <p>
        Der Fourier Neural Operator (FNO) ist eine konkrete Architektur,
        die ganze Funktionen statt einzelner Gitterwerte verarbeitet.
        Die Idee: statt im Ortsraum Punkt für Punkt zu arbeiten, schickt
        der FNO die Eingabe kurz in den Frequenzraum. Dort sind globale
        Muster sichtbar, und ein kleiner Schritt genügt, um sie zu
        verändern. Danach geht es zurück in den Ortsraum.
      </p>
      <p>
        Warum gerade Fourier? Eine Sinuswelle reicht über den ganzen
        Definitionsbereich. Wenige Sinuswellen zusammen tragen die
        globale Form einer Funktion. Was ein Modell im Ortsraum nur
        über viele Schichten zusammensetzen müsste, sieht der FNO im
        Frequenzraum mit einer Handvoll Moden. Wir zerlegen gleich eine
        Kurve genau so, schauen, was der Cutoff wegnimmt, und stellen
        am Ende die Frage: wie viele Frequenzen braucht der FNO für
        eine PDE-Lösung?
      </p>

      <h2>Fourier-Zerlegung: eine Funktion ist eine Summe von Sinuswellen</h2>
      <p>
        Klick durch die Moden. Mit jeder zusätzlichen Frequenz wird die
        Annäherung präziser. Schon vier bis fünf Moden reichen für die
        Grundform, die letzten Moden polieren nur noch Details.
      </p>
      <FourierDecomposition />

      <h2>Frequenz-Cutoff: der Trick im FNO</h2>
      <p>
        Der FNO behält in jedem Layer nur die ersten <code>k</code> Moden.
        Niedrige Frequenzen tragen die globale Struktur, hohe Frequenzen
        meistens Rauschen und gitterabhängige Artefakte. Schieb den Slider
        und such den Sweet-Spot.
      </p>
      <FrequencyCutoff />

      <h2>Was ein FNO-Layer tut: anklickbarer Datenfluss</h2>
      <p>
        Klick durch die Schritte. Diese Pipeline ist ein einzelner
        Fourier-Layer, in einem fertigen FNO werden vier bis sechs davon
        gestapelt.
      </p>
      <FNOLayerFlow />

      <h2>Vergleich auf derselben PDE: FNO vs. CNN vs. MLP</h2>
      <p>
        Drei Modelle treten gegeneinander an, alle drei trainieren auf
        derselben PDE und derselben Trainingsdatenmenge:
      </p>
      <ul className="kapitel4-models">
        <li>
          <strong>Fourier Neural Operator (FNO):</strong> arbeitet
          global im Frequenzraum, wenige Moden tragen die ganze
          Struktur.
        </li>
        <li>
          <strong>Convolutional Neural Network (CNN):</strong> stapelt
          lokale Faltungen über benachbarte Gitterpunkte. Die globale
          Sicht entsteht erst über viele Schichten.
        </li>
        <li>
          <strong>Multilayer Perceptron (MLP):</strong> vollvernetzt,
          jeder Gitterpunkt direkt mit jedem. Hat globale Sicht, aber
          lernt jeden Punkt einzeln, ohne Struktur.
        </li>
      </ul>
      <p>
        Die Heatmaps zeigen, wo jedes Modell danebenliegt:
      </p>
      <ThreeModels />

      <h2>Abschluss · 3-Fragen-Quiz</h2>
      <p>
        Drei Fragen, alle drei richtig, dann ist Kapitel 5 frei.
      </p>
      <QuizSeries questions={QUESTIONS} onAllCorrect={handleAllCorrect} />

      {done && (
        <div className="chapter-done">
          <div>
            <div className="chapter-done-headline">
              Kapitel 4 abgeschlossen · +180 CC
            </div>
            <div className="chapter-done-sub">
              Kapitel 5 ist in der Seitenleiste freigeschaltet.
            </div>
          </div>
          <button
            className="primary-button"
            onClick={() => setView({ type: "chapter", id: 5 })}
          >
            Weiter zu Kapitel 5
          </button>
        </div>
      )}
    </div>
  );
}
