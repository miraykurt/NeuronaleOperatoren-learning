import { useAppStore } from "../state/store";
import { LiveTrainingView } from "../visualizations/LiveTrainingView";
import { ChatTrigger } from "../ui/ChatTrigger";
import { ChapterIntro } from "../ui/ChapterIntro";
import {
  SetupChoicePanel,
  type SetupOption,
} from "../ui/SetupChoicePanel";

const SETUP_TUTOR_PROMPT =
  "Bereite mich auf den Abschluss von Kapitel 6 vor. Ich muss aus drei " +
  "konkreten Trainings-Setups das auswählen, das tatsächlich im Notebook " +
  "(Kapitel 8) für die 12 Experimente gefahren wird. Erklär mir kompakt, " +
  "warum AdamW mit Cosine-Warmup-Schedule (lr=1e-3, min_lr=1e-6) für einen " +
  "FNO sinnvoll ist, warum H1-Loss gegenüber reiner L²-Norm bei PDE-" +
  "Lösungen hilft, warum 8 Modes ein vernünftiger Mittelwert ist (das " +
  "Notebook variiert k zwischen 4, 8 und 16) und warum 100 Epochen reichen. " +
  "Halte es knapp, damit ich es im Übergabe-Bericht zitieren kann.";

const SETUP_OPTIONS: SetupOption[] = [
  {
    id: "vorsichtig",
    label: "Vorsichtig",
    details: [
      "Optimizer: AdamW, lr = 1e-5",
      "Schedule: Cosine + Warmup",
      "Loss: L²",
      "Modes k = 4",
      "Epochen = 500",
    ],
    isCorrect: false,
    verdict:
      "Die Lernrate ist zwei Größenordnungen zu klein, das Modell kommt in 500 Epochen kaum vom Fleck. Reine L²-Norm verschenkt die Information über Ableitungen, gerade in 2D-CFD ist das spürbar.",
  },
  {
    id: "standard",
    label: "Standard",
    details: [
      "Optimizer: AdamW, lr = 1e-3, weight_decay = 1e-4",
      "Schedule: Cosine + Warmup, min_lr = 1e-6",
      "Loss: H1",
      "Modes k = 8 (variiert: 4 / 8 / 16)",
      "Epochen = 100",
    ],
    isCorrect: true,
    verdict:
      "Genau das Setup, mit dem das Team die 12 Experimente fährt. AdamW ist robust für Spektral-Layer, Cosine mit Warmup verhindert Divergenz am Anfang, H1 vergleicht Werte und Ableitungen, und 8 Modes liegen mittig im Standard-Bereich, das Notebook variiert k zwischen 4, 8 und 16.",
  },
  {
    id: "aggressiv",
    label: "Aggressiv",
    details: [
      "Optimizer: Adam, lr = 1e-2",
      "Schedule: keiner",
      "Loss: MSE",
      "Modes k = 32",
      "Epochen = 30",
    ],
    isCorrect: false,
    verdict:
      "Lernrate ist viel zu hoch für Spektral-Layer, ohne Schedule oszilliert oder divergiert der Loss. 32 Modes blähen die Parameterzahl auf, ohne dass sich Genauigkeit garantiert verbessert. 30 Epochen sind zu kurz für ein sauberes Konvergieren.",
  },
];

export function Kapitel6() {
  const completeChapter = useAppStore((s) => s.completeChapter);
  const earnCC = useAppStore((s) => s.earnCC);
  const setView = useAppStore((s) => s.setView);
  const done = useAppStore((s) => s.completedChapters.includes(6));

  function handleDecisionAccepted() {
    if (!done) {
      completeChapter(6);
      earnCC(180, "Kapitel 6 abgeschlossen");
    }
  }

  return (
    <div>
      <ChapterIntro chapter={6} meta="Kapitel 6 · Training" title="Wie der FNO aus PDEBench-Daten lernt" />
      <p>
        Du hast jetzt das Modell aus Kapitel 4 und die Daten aus
        Kapitel 5. Jetzt der Schritt, auf den alles hinauslief. Erst
        sehen, dann benennen: die Vorhersage startet als Matsch und
        schärft sich, der Fehler fällt.
      </p>

      <h2>Vom Datenpaar zum gelernten Operator</h2>
      <p>
        Der Trainingsloop ist immer derselbe: Eingabe rein, Vorhersage
        raus, mit der Wahrheit vergleichen, nachbessern. Mit jeder Runde
        verschiebt sich der FNO ein Stück in die richtige Richtung. Genau
        diesen Vorgang siehst du gleich live.
      </p>

      <h2>Live-Trainingsansicht</h2>
      <p>
        Drück „Trainieren starten" und sieh zu. Links die aktuelle
        Vorhersage (cyan) neben der Wahrheit (gestrichelt). Rechts der
        Verlust, der mit jeder Epoche fällt. Am Anfang sind die
        Gewichte zufällig, deshalb der Matsch. Mit jedem Schritt schärft
        sich die Kurve.
      </p>
      <LiveTrainingView />

      <h2>Was im Training eingestellt wird</h2>
      <p>
        Vier Knöpfe legen fest, wie das Training läuft. Im Notebook in
        Kapitel 8 siehst du die konkreten Werte, die das Team für die
        12 Experimente gewählt hat.
      </p>
      <ul className="training-knobs">
        <li>
          <strong>Lernrate.</strong> Wie groß ein Schritt pro Update ist.
          Zu groß und der Loss springt herum, zu klein und das Modell
          kommt nicht voran. Ein Schedule senkt die Lernrate über die
          Epochen sanft ab.
        </li>
        <li>
          <strong>Modenzahl k.</strong> Wie viele Fourier-Frequenzen der
          FNO pro Layer behält (Kapitel 4). Mehr Modes erlauben feinere
          Strukturen, kosten aber Parameter und Speicher. Eine harte
          obere Grenze für das, was das Modell überhaupt lernen kann.
        </li>
        <li>
          <strong>Loss-Funktion.</strong> Wie streng „falsch" gemessen
          wird. Eine reine L²-Norm vergleicht nur Werte. Eine H1-Norm
          vergleicht zusätzlich Ableitungen und passt damit besser zu
          PDE-Lösungen mit scharfen Übergängen, das Notebook nutzt H1
          als Trainings-Ziel.
        </li>
        <li>
          <strong>Epochen.</strong> Wie oft das Modell den
          Trainings-Datensatz sieht. Zu wenige und es hat nicht
          ausgelernt, zu viele und es lernt Beispiele auswendig statt
          die Struktur (Overfitting).
        </li>
      </ul>

      <aside className="def-box">
        <strong>Train, Validierung, Test</strong>
        PDEBench teilt den Datensatz dreigeteilt: auf{" "}
        <em>Trainings-Paaren</em> wird gelernt, auf{" "}
        <em>Validierungs-Paaren</em> wird nach jeder Epoche ehrlich
        gemessen (und das beste Modell gespeichert), der{" "}
        <em>Test-Split</em> bleibt unangetastet bis zur Endbewertung.
      </aside>

      <h2>Setup-Begründung mit dem Tutor durchgehen</h2>
      <p>
        Lass dir vom Tutor die methodischen Argumente für das gewählte
        Trainings-Setup erklären, damit deine Begründung im Abschluss
        fachlich sitzt.
      </p>
      <ChatTrigger
        mode="tutor"
        question={SETUP_TUTOR_PROMPT}
        label="Trainings-Setup erklären lassen"
      />

      <h2>Abschluss · Welches Setup würdest du starten?</h2>
      <p>
        Drei Setups liegen auf dem Tisch. Klick das, das du dem Team empfehlen würdest.
      </p>
      <SetupChoicePanel
        decisionId="k6-training"
        outcomeLabel="Training · Standard-FNO-Setup"
        storyHook="Drei Karten, ein realistisches Setup, zwei Sackgassen. Genau das, was im Notebook läuft, ist die richtige Wahl."
        prompt="Welches Trainings-Setup geht in die 12 Experimente?"
        options={SETUP_OPTIONS}
        ccReward={180}
        onAccepted={handleDecisionAccepted}
      />

      {done && (
        <div className="chapter-done">
          <div>
            <div className="chapter-done-headline">
              Kapitel 6 abgeschlossen · +180 CC
            </div>
            <div className="chapter-done-sub">
              Kapitel 7 ist in der Seitenleiste freigeschaltet.
            </div>
          </div>
          <button
            className="primary-button"
            onClick={() => setView({ type: "chapter", id: 7 })}
          >
            Weiter zu Kapitel 7
          </button>
        </div>
      )}
    </div>
  );
}
