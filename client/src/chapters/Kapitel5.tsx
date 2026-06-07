import { useAppStore } from "../state/store";
import { PDEBenchMap } from "../visualizations/PDEBenchMap";
import { TrainingPointAnimation } from "../visualizations/TrainingPointAnimation";
import { ChapterIntro } from "../ui/ChapterIntro";
import { ChatTrigger } from "../ui/ChatTrigger";
import {
  DecisionPanel,
  type DecisionOption,
} from "../ui/DecisionPanel";

const BURGERS_TUTOR_PROMPT =
  "Bereite mich auf den Abschluss von Kapitel 5 vor: ich soll dem Team " +
  "die Wahl von Burgers 1D als Trainingsdatensatz begründen. Erklär mir " +
  "kompakt die Burgers-Gleichung ∂u/∂t + u·∂u/∂x = ν·∂²u/∂x² (was die " +
  "Terme bedeuten, warum sie nicht-linear ist, was Schockbildung damit zu " +
  "tun hat) und zeig mir, welche fachlich tragfähigen Argumente daraus " +
  "folgen, warum sie ein gutes Testfeld für neuronale Operatoren ist. " +
  "Halte es knapp genug, dass ich es im Übergabe-Bericht zitieren kann.";

const DATASET_DECISION_OPTIONS: DecisionOption[] = [
  {
    id: "shock",
    text: "1D-Burgers zeigt nicht-lineare Schockbildung — daran lässt sich die Operator-Genauigkeit ehrlich messen.",
    weight: "strong",
  },
  {
    id: "reference",
    text: "Validierte FEM-Referenzdaten verfügbar — direkter Vergleich FNO vs. klassischer Solver lässt sich sauber dokumentieren.",
    weight: "strong",
  },
  {
    id: "reproducible",
    text: "Das Trainings-Notebook ist vorbereitet und läuft bit-identisch — die Übergabe ist nachvollziehbar.",
    weight: "strong",
  },
  {
    id: "cutoff",
    text: "Komplexität reicht, um Cutoff-Verhalten und FNO-Architektur transparent zu zeigen.",
    weight: "strong",
  },
  {
    id: "data-size",
    text: "Datenmenge ist groß genug für saubere Generalisierung.",
    weight: "weak",
  },
  {
    id: "gpu",
    text: "Modell-Größe passt zur lokalen GPU-Verfügbarkeit.",
    weight: "weak",
  },
  {
    id: "linear",
    text: "Burgers ist linear und damit besonders einfach zu trainieren.",
    weight: "wrong",
    rebuttal:
      "Burgers ist nicht-linear — genau das Stop-and-Go-Verhalten aus ∂ₜu + u·∂ₓu = ν·∂²ₓu ist der Schockmechanismus. Lineare PDEs wären didaktisch deutlich weniger interessant.",
  },
  {
    id: "covers-3d",
    text: "1D-Burgers deckt die 3D-Strömung um Tragflächen direkt ab.",
    weight: "wrong",
    rebuttal:
      "1D-Burgers ist ein Modellproblem, kein 3D-Aerodynamik-Surrogat. Wer das so im Kundenbericht schreibt, hat einen Skandal in der Validierung.",
  },
];

export function Kapitel5() {
  const completeChapter = useAppStore((s) => s.completeChapter);
  const earnCC = useAppStore((s) => s.earnCC);
  const setView = useAppStore((s) => s.setView);
  const done = useAppStore((s) => s.completedChapters.includes(5));

  function handleDecisionAccepted() {
    if (!done) {
      completeChapter(5);
      earnCC(160, "Kapitel 5 abgeschlossen");
    }
  }

  return (
    <div>
      <ChapterIntro chapter={5} meta="Kapitel 5 · PDEBench" title="Standardisierte Trainingsdaten für neuronale Operatoren" />
      <p>
        Ein Neuronaler Operator ist nur so gut wie der Datensatz, auf dem
        er trainiert wurde. Dieses Kapitel zeigt, wie ein Trainingspunkt
        entsteht und wie du den richtigen Datensatz für ein konkretes
        Problem auswählst.
      </p>

      <h2>PDEBench als gemeinsame Datenbasis</h2>
      <p>
        PDEBench ist ein standardisierter Benchmark-Datensatz von PDE-Lösungen, der gezielt für das Training und die Evaluierung neuronaler Operatoren entwickelt wurde. Verschiedene PDE-Familien, mehrere
        Dimensionen, klare Train/Test-Splits. Klick eine Karte für
        Erklärung und Beispiel-Animation.
      </p>
      <PDEBenchMap />

      <p className="kapitel5-links">
        Paper:{" "}
        <a href="https://arxiv.org/abs/2210.07182" target="_blank" rel="noreferrer">
          arxiv.org/abs/2210.07182
        </a>
        {" · "}
        Code:{" "}
        <a href="https://github.com/pdebench/PDEBench" target="_blank" rel="noreferrer">
          github.com/pdebench/PDEBench
        </a>
      </p>

      <h2>Wie ein einzelner Trainingspunkt entsteht</h2>
      <p>
        Jeder Eintrag im Datensatz ist ein Eingabe-Ausgabe-Paar:
        Anfangsbedingung plus Konfiguration vorne, Lösung nach T
        Zeitschritten hinten. Bevor das Modell trainieren kann, muss der
        klassische Solver einmal arbeiten. Klick durch und sieh zu.
      </p>
      <TrainingPointAnimation />

      <h2>Burgers-Gleichung mit dem Tutor durchgehen</h2>
      <p>
        Lass dir vom Tutor die Gleichung kompakt erklären — damit deine
        Begründung im Abschluss fachlich sitzt.
      </p>
      <ChatTrigger
        mode="tutor"
        question={BURGERS_TUTOR_PROMPT}
        label="Burgers-Gleichung erklären lassen"
      />

      <h2>Abschluss · Deine Empfehlung an das Team</h2>
      <p>
        FieldSolve trainiert intern auf <strong>Burgers 1D</strong> — die
        Pipeline ist vorbereitet. Im Übergabe-Bericht an AeroDyn brauchen
        wir aber deine technische Begründung. Wähl die drei Argumente,
        die du unterschreiben würdest. Priya prüft jede Auswahl fachlich:
        Falsches fliegt mit Begründung raus, Schwaches reicht ihr nicht.
      </p>
      <DecisionPanel
        decisionId="k5-dataset"
        outcomeLabel="Datensatz · Burgers 1D"
        storyHook="Die Wahl ist technisch gesetzt — die Argumentation ist deine."
        prompt="Welche drei Argumente kommen in den Übergabe-Bericht?"
        options={DATASET_DECISION_OPTIONS}
        picksRequired={3}
        ccReward={160}
        onAccepted={handleDecisionAccepted}
      />

      {done && (
        <div className="chapter-done">
          <div>
            <div className="chapter-done-headline">
              Kapitel 5 abgeschlossen · +160 CC
            </div>
            <div className="chapter-done-sub">
              Kapitel 6 ist in der Seitenleiste freigeschaltet.
            </div>
          </div>
          <button
            className="primary-button"
            onClick={() => setView({ type: "chapter", id: 6 })}
          >
            Weiter zu Kapitel 6
          </button>
        </div>
      )}
    </div>
  );
}
