import { useAppStore } from "../state/store";
import { LiveTrainingView } from "../visualizations/LiveTrainingView";
import { LearningRateZones } from "../visualizations/LearningRateZones";
import { TrainingModesSlider } from "../visualizations/TrainingModesSlider";
import { ChatTrigger } from "../ui/ChatTrigger";
import { ChapterIntro } from "../ui/ChapterIntro";
import {
  DecisionPanel,
  type DecisionOption,
} from "../ui/DecisionPanel";

const SETUP_TUTOR_PROMPT =
  "Bereite mich auf den Abschluss von Kapitel 6 vor: ich soll das Standard-" +
  "Trainings-Setup für unseren FNO methodisch rechtfertigen — Adam-Optimizer " +
  "mit einem LR-Schedule wie Cosine-Annealing, sinnvolle Modenzahl, " +
  "ausreichende Epochen. Erklär mir kompakt, warum Adam für Spektral-Layer " +
  "robust ist, warum ein LR-Schedule bei FNOs hilft und welche typischen " +
  "Probleme entstehen, wenn Lernrate, Modenzahl oder Epochen falsch " +
  "gewählt sind. Halte es knapp genug, dass ich es im Übergabe-Bericht " +
  "zitieren kann.";

const SETUP_DECISION_OPTIONS: DecisionOption[] = [
  {
    id: "adam",
    text: "Adam ist robust für Spektral-Layer — adaptive Lernraten fangen die unterschiedliche Skalierung pro Mode ab.",
    weight: "strong",
  },
  {
    id: "schedule",
    text: "Ein LR-Schedule (z. B. Cosine-Annealing) lässt das Modell zu Beginn explorativ lernen und am Ende fein justieren.",
    weight: "strong",
  },
  {
    id: "baseline",
    text: "Hyperparameter folgen der FNO-Paper-Baseline — die Ergebnisse sind vergleichbar mit publizierten Benchmarks.",
    weight: "strong",
  },
  {
    id: "no-overfit",
    text: "Train- und Test-Loss laufen sauber parallel — kein Anzeichen von Over- oder Underfitting.",
    weight: "strong",
  },
  {
    id: "looks-ok",
    text: "Hat im Live-Training stabil ausgesehen, kein Sägezahn-Muster im Loss.",
    weight: "weak",
  },
  {
    id: "middle-ground",
    text: "Mittelweg zwischen aggressiv und zaghaft — fühlt sich richtig an.",
    weight: "weak",
  },
  {
    id: "lr-max",
    text: "Höhere Lernraten konvergieren immer schneller — wir sollten sie maximieren.",
    weight: "wrong",
    rebuttal:
      "Bei Spektral-Layern führt eine zu hohe LR typischerweise zu Divergenz oder oszillierendem Loss. Schneller ist nicht stabiler — und ein Schedule kann das nicht reparieren.",
  },
  {
    id: "modes-max",
    text: "Mehr Moden heißt immer mehr Genauigkeit — wir sollten den Cutoff einfach hochsetzen.",
    weight: "wrong",
    rebuttal:
      "Höhere Modenzahl vervielfacht die Parameterzahl und den Trainingsbedarf. Außerhalb der trainierten Verteilung steigt die Genauigkeit dadurch nicht — Speicher und Zeit aber schon. Mehr ist nicht immer besser.",
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
        verschiebt sich der FNO ein Stück weit in die richtige
        Richtung.
      </p>

      <aside className="def-box">
        <strong>Loss</strong>
        Das Maß dafür, „wie falsch lag das Modell". In der Lerneinheit
        nutzen wir den <em>relativen L2-Fehler</em>: die Abweichung
        zwischen Vorhersage und Wahrheit, geteilt durch die Größe der
        Wahrheit. Kein Formelwald, einfach ein Prozentwert.
      </aside>

      <aside className="def-box">
        <strong>Epoche</strong>
        Ein kompletter Durchgang durch alle Trainingspaare. Bei 1000
        Paaren und 50 Epochen sieht das Modell den Datensatz 50 mal.
      </aside>

      <h2>Live-Trainingsansicht</h2>
      <p>
        Drück „Trainieren starten" und sieh zu. Links die aktuelle
        Vorhersage (cyan) neben der Wahrheit (gestrichelt). Rechts der
        Verlust, der mit jeder Epoche fällt. Am Anfang sind die
        Gewichte zufällig, deshalb der Matsch. Mit jedem Schritt schärft
        sich die Kurve.
      </p>
      <LiveTrainingView />

      <h2>Stellschraube 1: die Lernrate</h2>
      <p>
        Die Lernrate bestimmt, wie groß ein Schritt pro Update ist.
        Drei Zonen: zu zaghaft, gut, explodiert. Schieb den Regler
        bewusst in alle drei Bereiche und beobachte, wie der Loss
        reagiert.
      </p>
      <LearningRateZones />

      <h2>Stellschraube 2: die Anzahl der Moden</h2>
      <p>
        Aus Kapitel 4 weißt du: der FNO behält nur die ersten{" "}
        <code>k</code> Fourier-Moden. Beim Training ist das nicht nur
        eine Architekturentscheidung, sondern eine harte Grenze für das,
        was das Modell überhaupt lernen kann.
      </p>

      <aside className="def-box">
        <strong>Schockfront</strong>
        Eine sehr steile, fast sprunghafte Stelle im Lösungsfeld, wie
        eine plötzliche Wand. In Burgers entsteht so eine Front
        natürlich, wenn die Viskosität klein ist. Solche scharfen
        Übergänge brauchen viele Frequenzen, um sauber dargestellt zu
        werden.
      </aside>
      <p>
        Mit wenigen Moden bleibt eine scharfe Schockfront verwaschen,
        egal wie lange du trainierst.
      </p>
      <TrainingModesSlider />

      <h2>Stellschraube 3: die Epochen</h2>
      <p>
        Wie oft soll der Datensatz durchlaufen werden? Zu wenige
        Epochen, das Modell hat noch nicht ausgelernt. Zu viele Epochen,
        das Modell merkt sich Beispiele statt Strukturen.
      </p>

      <aside className="def-box">
        <strong>Overfitting</strong>
        Das Modell wird zu sehr auf die genauen Trainingsdaten
        zugeschnitten. Trainings-Loss fällt weiter, Test-Loss steigt
        wieder. Heißt: das Modell lernt auswendig statt zu
        verallgemeinern.
      </aside>

      <aside className="def-box">
        <strong>Train- und Test-Daten</strong>
        PDEBench teilt den Datensatz in zwei Hälften. Auf den{" "}
        <em>Train-Daten</em> wird gelernt, auf den <em>Test-Daten</em>{" "}
        ehrlich gemessen. Solange der Test-Loss weiter fällt, ist mehr
        Training gut, sobald er steigt, ist Schluss.
      </aside>

      <h2>Setup-Begründung mit dem Tutor durchgehen</h2>
      <p>
        Lass dir vom Tutor die methodischen Argumente für das gewählte
        Trainings-Setup erklären — damit deine Begründung im Abschluss
        fachlich sitzt.
      </p>
      <ChatTrigger
        mode="tutor"
        question={SETUP_TUTOR_PROMPT}
        label="Trainings-Setup erklären lassen"
      />

      <h2>Abschluss · Deine Empfehlung an das Team</h2>
      <p>
        Das Trainings-Setup steht — Adam, LR-Schedule, passende Modenzahl.
        Im Übergabe-Bericht musst du es methodisch verteidigen. Wähl die
        drei Argumente, die du unterschreiben würdest. Priya prüft jede
        Auswahl fachlich.
      </p>
      <DecisionPanel
        decisionId="k6-training"
        outcomeLabel="Training · Standard-FNO-Setup"
        storyHook="Adam, LR-Schedule, passende Modenzahl — das Team folgt der Standard-Empfehlung. Deine Aufgabe: die Methodik im Bericht stützen."
        prompt="Welche drei Argumente kommen in den Übergabe-Bericht?"
        options={SETUP_DECISION_OPTIONS}
        picksRequired={3}
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
