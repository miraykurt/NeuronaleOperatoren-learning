import { useState } from "react";
import { useAppStore } from "../state/store";
import {
  LivePredictionFNO,
  type QueryResult,
} from "../visualizations/LivePredictionFNO";
import { ConfigSpacePlot } from "../visualizations/ConfigSpacePlot";
import { ErrorHeatmap } from "../visualizations/ErrorHeatmap";
import { ModeLensError } from "../visualizations/ModeLensError";
import { ChatTrigger } from "../ui/ChatTrigger";
import { ChapterIntro } from "../ui/ChapterIntro";
import {
  DecisionPanel,
  type DecisionOption,
} from "../ui/DecisionPanel";

const LIMITS_TUTOR_PROMPT =
  "Bereite mich auf den Abschluss von Kapitel 7 vor: ich soll dem Kunden " +
  "AeroDyn im Übergabe-Bericht die methodischen Grenzen unseres FNO-Modells " +
  "dokumentieren. Erklär mir kompakt, welche Klassen von Limitationen IMMER " +
  "kommuniziert werden müssen, wenn ein FNO an einen Kunden übergeben wird " +
  "(Stichworte Trainingsbereich, Cutoff-bedingte Genauigkeitsgrenze, " +
  "Dimensions-Übertragung, Out-of-Distribution-Verhalten). Und sag mir " +
  "auch: was wäre KEINE faire Limitation, sondern eine bewusste " +
  "Designentscheidung? Halte es knapp genug, dass ich drei Sätze davon im " +
  "Bericht zitieren kann.";

const LIMITS_DECISION_OPTIONS: DecisionOption[] = [
  {
    id: "training-range",
    text: "Trainingsbereich explizit angeben (Viskositäts-Range, Verteilung der Anfangsbedingungen) — außerhalb gilt das Modell nicht.",
    weight: "strong",
  },
  {
    id: "mode-cutoff",
    text: "Mode-Cutoff als Designentscheidung benennen — Strukturen feiner als die behaltenen Moden werden systematisch verworfen.",
    weight: "strong",
  },
  {
    id: "dimension",
    text: "Dimensions-Übertragung markieren — ein 1D-Modell macht keine Aussagen über 2D- oder 3D-Strömungen.",
    weight: "strong",
  },
  {
    id: "ood",
    text: "Out-of-Distribution-Verhalten beschreiben — bei untypischen Eingaben antwortet das Modell plausibel, aber unzuverlässig.",
    weight: "strong",
  },
  {
    id: "test-size",
    text: "Test-Set ist relativ klein — die gemessene Genauigkeit hat Streuung.",
    weight: "weak",
  },
  {
    id: "more-epochs",
    text: "Mehr Trainings-Epochen könnten den letzten Prozentpunkt noch herausholen.",
    weight: "weak",
  },
  {
    id: "universal",
    text: "Mit dem gemessenen Test-Fehler ist das Modell für jeden Strömungsfall geeignet.",
    weight: "wrong",
    rebuttal:
      "Der Testfehler gilt nur im Trainingsbereich. Außerhalb ist die Genauigkeit undefiniert — keine Verallgemeinerungs-Garantie ohne explizite Validierung.",
  },
  {
    id: "open-budget",
    text: "Das Fehler-Budget bleibt offen, damit der Kunde flexibel reagieren kann.",
    weight: "wrong",
    rebuttal:
      "Ohne explizites Budget kein Engineering-Vertrag. Ein nicht festgelegtes Budget ist das Gegenteil von professioneller Übergabe — der Kunde kann später jede Abweichung als Mangel reklamieren.",
  },
];

export function Kapitel7() {
  const completeChapter = useAppStore((s) => s.completeChapter);
  const earnCC = useAppStore((s) => s.earnCC);
  const setView = useAppStore((s) => s.setView);
  const done = useAppStore((s) => s.completedChapters.includes(7));

  const [history, setHistory] = useState<QueryResult[]>([]);
  const [currentVisc, setCurrentVisc] = useState(0.2);
  const [currentT, setCurrentT] = useState(0.5);

  function handleSnapshot(r: QueryResult) {
    setHistory((h) => [...h, r]);
  }

  function handleChange(visc: number, t: number) {
    setCurrentVisc(visc);
    setCurrentT(t);
  }

  function handleDecisionAccepted() {
    if (!done) {
      completeChapter(7);
      earnCC(200, "Kapitel 7 abgeschlossen");
    }
  }

  return (
    <div>
      <ChapterIntro chapter={7} meta="Kapitel 7 · Ergebnis verstehen" title="Den trainierten FNO erkunden und seine Grenzen lesen" />
      <p>
        Das Modell ist jetzt trainiert. Zwei Fragen bleiben: Wie
        reagiert es auf neue Konfigurationen, und wo darf man ihm
        wirklich trauen? Genau diese beiden Fragen klären wir hier in
        einem Kapitel zusammen.
      </p>

      <h2>Sofort-Vorhersage</h2>
      <p>
        Eine gelernte Abbildung auszuwerten ist genau ein Durchlauf des
        Modells. Deshalb fühlt sich jede Anfrage instant an, ganz egal
        wie fein das Gitter ist.
      </p>

      <h2>Parameter erkunden</h2>
      <p>
        Drehst du an einem Regler, läuft das Modell intern einmal durch
        und die Kurve unten passt sich an. Innerhalb des gelernten
        Bereichs ist die Vorhersage cyan, am Rand und außerhalb färbt
        sie sich gelb-orange, weil das Modell dort raten muss.
      </p>
      <LivePredictionFNO
        onSnapshot={handleSnapshot}
        onChange={handleChange}
      />

      <h2>Der Konfigurationsraum</h2>
      <p>
        Die Karte zeigt die Cloud der Trainings-Konfigurationen aus
        PDEBench. Dein aktueller Reglerpunkt wandert als Crosshair
        darüber.
      </p>

      <aside className="def-box">
        <strong>Interpolation</strong>
        Wenn der Reglerpunkt zwischen bekannten Trainings-Konfigurationen
        liegt, füllt das Modell Lücken. Ergebnis: meistens kleiner,
        stabiler Fehler.
      </aside>

      <aside className="def-box">
        <strong>Extrapolation</strong>
        Wenn der Reglerpunkt außerhalb der Trainings-Cloud liegt, rät
        das Modell über den gelernten Bereich hinaus. Die Ausgabe sieht
        weiter plausibel aus, ist aber nicht mehr verlässlich.
      </aside>

      <ConfigSpacePlot
        history={history}
        currentVisc={currentVisc}
        currentT={currentT}
      />

      <h2>Den Fehler lesen, zwei Ursachen</h2>
      <p>
        Ein hoher Fehler ist kein Zufall. Er hat zwei Quellen.
      </p>
      <p>
        <strong>Ursache 1: außerhalb des Gelernten.</strong> Innerhalb
        des Trainingsbereichs interpoliert das Modell, der Fehler
        bleibt klein und stabil. Außerhalb wechselt es unbemerkt in den
        Extrapolations-Modus. Die Fehlerkarte unten zeigt das räumlich:
        schieb die Slider und beobachte, wo es rot wird.
      </p>
      <ErrorHeatmap />
      <p>
        <strong>Ursache 2: zu wenige Moden.</strong> Der FNO behält nur
        die ersten <code>k</code> Fourier-Moden (siehe Kapitel 4 und 6).
        Funktionen mit scharfen Schockfronten brauchen gerade diese
        hohen Frequenzen. Was nicht im Frequenzraum darstellbar ist,
        kann der FNO nicht vorhersagen.
      </p>

      <aside className="def-box">
        <strong>Cutoff-Maske</strong>
        Die Architektur-Stelle im FNO, an der hohe Frequenzen
        abgeschnitten werden. Drüber hinaus kann das Modell prinzipiell
        nichts mehr darstellen, egal wie viel trainiert wird.
      </aside>

      <ModeLensError />

      <h2>Limitationen mit dem Tutor durchgehen</h2>
      <p>
        Lass dir vom Tutor erklären, welche Klassen von Grenzen in einen
        seriösen Übergabe-Bericht gehören — damit deine Auswahl im
        Abschluss methodisch sitzt.
      </p>
      <ChatTrigger
        mode="tutor"
        question={LIMITS_TUTOR_PROMPT}
        label="Übergabe-Limitationen erklären lassen"
      />

      <h2>Abschluss · Deine Empfehlung an das Team</h2>
      <p>
        Das Modell ist trainiert, der Test sieht gut aus — aber nur im
        Trainingsbereich. Welche drei Grenzen schreibst du explizit in
        den Übergabe-Bericht, damit AeroDyn weiß, wo das Modell endet?
        Priya prüft jede Auswahl fachlich.
      </p>
      <DecisionPanel
        decisionId="k7-handover"
        outcomeLabel="Übergabe · Drei methodische Grenzen"
        storyHook="Der Test-Fehler ist klein — die Grenzen sind es nicht. Deine Aufgabe: die drei wichtigsten Limitationen sauber dokumentieren."
        prompt="Welche drei Limitationen kommen in den Übergabe-Bericht?"
        options={LIMITS_DECISION_OPTIONS}
        picksRequired={3}
        ccReward={200}
        onAccepted={handleDecisionAccepted}
      />

      {done && (
        <div className="chapter-done">
          <div>
            <div className="chapter-done-headline">
              Kapitel 7 abgeschlossen · +200 CC
            </div>
            <div className="chapter-done-sub">
              Kapitel 8 ist in der Seitenleiste freigeschaltet.
            </div>
          </div>
          <button
            className="primary-button"
            onClick={() => setView({ type: "chapter", id: 8 })}
          >
            Weiter zu Kapitel 8
          </button>
        </div>
      )}
    </div>
  );
}
