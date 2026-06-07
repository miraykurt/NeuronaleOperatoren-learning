import { BlockMath } from "react-katex";
import { useAppStore } from "../state/store";
import { TimeComparison } from "../visualizations/TimeComparison";
import { MultipleChoice, type MCOption } from "../ui/MultipleChoice";
import { ChapterIntro } from "../ui/ChapterIntro";

const QUIZ_OPTIONS: MCOption[] = [
  { id: "a", text: "Klassische Solver sind generell veraltet." },
  {
    id: "b",
    text: "Neuronale Operatoren liefern die exakt gleiche Lösung wie klassische Verfahren.",
  },
  {
    id: "c",
    text: "Bei feinen Gittern ist ein klassischer Solver um Größenordnungen langsamer als ein neuronaler Operator.",
  },
  { id: "d", text: "FNO funktioniert nur für 1D-Probleme." },
];

export function Kapitel1() {
  const completeChapter = useAppStore((s) => s.completeChapter);
  const earnCC = useAppStore((s) => s.earnCC);
  const setView = useAppStore((s) => s.setView);
  const done = useAppStore((s) => s.completedChapters.includes(1));

  function handleQuizCorrect() {
    if (!done) {
      completeChapter(1);
      earnCC(100, "Kapitel 1 abgeschlossen");
    }
  }

  return (
    <div>
      <ChapterIntro chapter={1} meta="Kapitel 1 · Onboarding" title="Numerische Solver vs. Neuronale Operatoren" />
      <p>
        Erster Tag bei FieldSolve. Priya hat dir den Auftrag
        auf den Tisch gelegt: dreihundert Tragflächen-Konfigurationen, pro
        Stück vier Stunden FEM. Die Frage: muss das so sein? <br/>
         Bevor irgendetwas erklärt wird, schau es dir an.
      </p>

      <TimeComparison />

      <h2>Was du gerade gesehen hast</h2>
      <p>
        Beide Verfahren lösen dieselbe Aufgabe: eine partielle
        Differentialgleichung. Ein typisches Beispiel ist die Burgers-Gleichung
        in einer Dimension:
      </p>
      <BlockMath math="\frac{\partial u}{\partial t} + u\,\frac{\partial u}{\partial x} = \nu\,\frac{\partial^2 u}{\partial x^2}" />

      <h2>Zwei Wege zur Lösung</h2>
      <p>
        Klassisch heißt: rechnen. Die Gleichung wird Schritt für Schritt
        auf einem Gitter gelöst. Das Verfahren ist sauber und lässt
        sich beliebig genau machen.
      </p>
      <p>
        Neuronaler Operator heißt: lernen. Das Modell wird einmal auf
        vielen Beispiel-Lösungen trainiert. Danach liefert es die Antwort
        direkt, ohne neu zu rechnen.
      </p>

      <h2>Abschluss · Check</h2>
      <MultipleChoice
        question="Was war die zentrale Beobachtung in diesem Kapitel?"
        options={QUIZ_OPTIONS}
        correctId="c"
        explanation="Genau. Der Geschwindigkeitsabstand wächst mit der Gitterauflösung. Genauigkeit, Trainingsbedarf und Grenzen des FNO folgen in den nächsten Kapiteln."
        onCorrect={handleQuizCorrect}
      />

      {done && (
        <div className="chapter-done">
          <div>
            <div className="chapter-done-headline">
              Kapitel 1 abgeschlossen · +100 CC
            </div>
            <div className="chapter-done-sub">
              Kapitel 2 ist in der Seitenleiste freigeschaltet.
            </div>
          </div>
          <button
            className="primary-button"
            onClick={() => setView({ type: "chapter", id: 2 })}
          >
            Weiter zu Kapitel 2
          </button>
        </div>
      )}
    </div>
  );
}
