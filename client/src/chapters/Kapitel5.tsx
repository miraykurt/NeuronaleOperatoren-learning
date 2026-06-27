import { useAppStore } from "../state/store";
import { PDEBenchMap } from "../visualizations/PDEBenchMap";
import { TrainingPointAnimation } from "../visualizations/TrainingPointAnimation";
import { ChapterIntro } from "../ui/ChapterIntro";
import { ChatTrigger } from "../ui/ChatTrigger";
import {
  FamilyRankingPanel,
  type RankingFamily,
} from "../ui/FamilyRankingPanel";

const FAMILIES_TUTOR_PROMPT =
  "Bereite mich auf den Abschluss von Kapitel 5 vor. Erklär mir kompakt, " +
  "welche Eigenschaft jede der vier PDE-Familien testet, die im echten " +
  "Training auftauchen: 1D-Advection mit kleinem β (sanft, gut " +
  "konditioniert), 1D-Advection mit großem β (Schockbildung, Test der " +
  "Mode-Skalierung), 2D-CFD-Random (Multi-Channel, realistische " +
  "Engineering-Komplexität), 2D-CFD-Turbulent (Grenze des Setups). Und " +
  "warum gerade diese vier zusammen eine sinnvolle, gestaffelte Testreihe " +
  "für einen FNO bilden. Halte es knapp, damit ich es im Übergabe-Bericht " +
  "zitieren kann.";

const PDE_FAMILIES: RankingFamily[] = [
  {
    id: "cfd-random",
    label: "2D-CFD-Random",
    description:
      "2D-Strömung mit vier Channels (Dichte, Druck, Geschwindigkeit X und Y), 128 × 128, zufällige Anfangsbedingungen. Strukturell am nächsten zu AeroDyn.",
    rank: 1,
  },
  {
    id: "cfd-turbulent",
    label: "2D-CFD-Turbulent",
    description:
      "Turbulente 2D-Strömung, 512 × 512. Sehr nah an realer Aerodynamik, aber Grenze des Setups: der FNO konvergiert nicht sauber.",
    rank: 2,
  },
  {
    id: "advection-beta4",
    label: "1D-Advection β=4",
    description:
      "1D mit Schockfront. Zeigt die Mode-Skalierung in 1D, dimensional aber weit weg von 2D-Strömungen.",
    rank: 3,
  },
  {
    id: "advection-beta02",
    label: "1D-Advection β=0,2",
    description:
      "1D, sanftes Verhalten, gut konditioniert. Didaktische Baseline, aber zu einfach für einen AeroDyn-Vergleich.",
    rank: 4,
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

      <h2>Die vier Familien mit dem Tutor durchgehen</h2>
      <p>
        Lass dir vom Tutor erklären, wie sich die vier PDE-Familien
        unterscheiden und warum sie zusammen eine sinnvolle Testreihe
        sind. Damit sitzt deine Begründung im Abschluss.
      </p>
      <ChatTrigger
        mode="tutor"
        question={FAMILIES_TUTOR_PROMPT}
        label="Vier Familien erklären lassen"
      />

      <h2>Abschluss · Rang die vier Familien für AeroDyn</h2>
      <p>
        AeroDyn macht 2D-Strömungen mit vielen Konfigurationen, kein
        1D-Spielproblem. Bring die vier PDEBench-Familien in eine
        Rangfolge: oben die beste Eignung für den Kunden-Use-Case, unten
        die am wenigsten geeignete. Priya prüft, ob die Reihenfolge
        Engineering-fest sitzt.
      </p>
      <FamilyRankingPanel
        decisionId="k5-dataset"
        outcomeLabel="Empfehlung · 2D-CFD-Random"
        storyHook="Eine Wahl pro Position, vier Plätze, alle vier müssen sitzen. Bei Fehlern markiert Priya die problematischen Stellen, du kannst neu sortieren."
        prompt="Sortier die vier Familien von 1 (beste Eignung für AeroDyn) bis 4 (am wenigsten geeignet)."
        families={PDE_FAMILIES}
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
