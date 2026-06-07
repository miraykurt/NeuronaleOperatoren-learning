import { useState } from "react";
import { useAppStore } from "../state/store";
import { CurveMorph } from "../visualizations/CurveMorph";
import { DrawAndPredict } from "../visualizations/DrawAndPredict";
import { LexiconVsGrammar } from "../visualizations/LexiconVsGrammar";
import { AssignmentQuiz, type AssignItem } from "../ui/AssignmentQuiz";
import { ChatTrigger } from "../ui/ChatTrigger";
import { ChapterIntro } from "../ui/ChapterIntro";

const ASSIGN_ITEMS: AssignItem[] = [
  {
    id: "punktweise",
    text: "Lernt für jeden Gitterpunkt einen Wert.",
    correct: "nn",
  },
  {
    id: "funktion",
    text: "Lernt die Abbildung zwischen ganzen Funktionen.",
    correct: "no",
  },
  {
    id: "neuesgitter",
    text: "Muss bei neuer Auflösung neu trainiert werden.",
    correct: "nn",
  },
  {
    id: "auflösungsfrei",
    text: "Liefert bei jeder Auflösung die gleiche Lösung.",
    correct: "no",
  },
  {
    id: "lexikon",
    text: "Funktioniert wie ein Lexikon: Eintrag pro bekanntem Punkt.",
    correct: "nn",
  },
  {
    id: "regel",
    text: "Funktioniert wie eine Grammatik: Regel, die für jede Eingabe gilt.",
    correct: "no",
  },
];

export function Kapitel3() {
  const completeChapter = useAppStore((s) => s.completeChapter);
  const earnCC = useAppStore((s) => s.earnCC);
  const setView = useAppStore((s) => s.setView);
  const done = useAppStore((s) => s.completedChapters.includes(3));
  const [showFormal, setShowFormal] = useState(false);

  function handleQuizDone() {
    if (!done) {
      completeChapter(3);
      earnCC(140, "Kapitel 3 abgeschlossen");
    }
  }

  return (
    <div>
      <ChapterIntro chapter={3} meta="Kapitel 3 · Grundlagen & Konzept" title="Was ist ein Operator? Unterschied zwischen Neuronalem Netz und Neuronalem Operator" />
      <p>
        Ein klassisches Neuronales Netz lernt eine Abbildung zwischen
        Vektoren: <code>x ∈ ℝⁿ</code> wird auf <code>y ∈ ℝᵐ</code> abgebildet.
        Eingabe und Ausgabe sind also Vektoren mit fester Länge, jeder
        Eintrag gehört zu einer festen Gitterposition. Wechselt das Gitter,
        wechselt die Vektorlänge, und das Modell muss neu trainiert werden.
        Ist die Eingabe ein Gitter mit 16 Werten, kann das Modell auch nur
        Gitter mit 16 Werten verarbeiten.
      </p>
      <p>
        Ein Neuronaler Operator lernt etwas Höheres: die Abbildung zwischen
        ganzen Funktionen. Aus <code>u(x)</code> wird <code>v(x)</code>,
        unabhängig davon, wie fein du <code>u</code> samplest.
      </p>

      <CurveMorph />

      <h2>Selber zeichnen und sehen, wo das Neuronale Netz versagt</h2>
      <p>
        Zeichne unten eine beliebige Anfangsbedingung in die Fläche. Das
        Modell wurde auf einem 16-Punkte-Gitter trainiert. Wechsel die
        Anzeige-Auflösung und beobachte, wie das Neuronale Netz bei höheren
        Auflösungen Artefakte erfindet, während der Neuronale Operator
        sauber bleibt.
      </p>

      <DrawAndPredict />

      <h2>Lexikon oder Grammatik?</h2>
      <p>
        Eine Metapher hilft: Ein Neuronales Netz ist wie ein Lexikon mit
        fertigen Einträgen, gut für bekannte Wörter, hilflos bei neuen. Ein
        Neuronaler Operator ist wie eine Grammatik, er kennt die Regel, die
        jeden Satz erzeugt.
      </p>

      <LexiconVsGrammar />

      <div className="kapitel3-triggers">
        <ChatTrigger
          mode="tutor"
          question="Erklär mir nochmal in einfachen Worten, was ein klassisches Neuronales Netz ist, wie es aufgebaut ist und wofür es typischerweise verwendet wird. Halte dich kurz, ich brauche die Grundlage als Sprungbrett zum Neuronalen Operator."
          label="Was ist ein Neuronales Netz?"
        />
        <ChatTrigger
          mode="tutor"
          question="Welche konkreten neuronalen Operator-Architekturen aus der Forschung gibt es? Nenne mir mindestens Fourier Neural Operator (FNO), DeepONet und Graph Neural Operator (GNO), plus verwandte Ansätze wie Physics-Informed Neural Networks (PINNs). Je 1 bis 2 Sätze, was sie ausmacht und worauf der Fokus liegt. Halte den Ton kompakt und übersichtlich."
          label="Welche neuronalen Operatoren gibt es?"
        />
      </div>

      <h2>Formale Definition</h2>
      <button
        className="secondary-button"
        onClick={() => setShowFormal((v) => !v)}
      >
        {showFormal ? "Definition einklappen" : "Definition aufklappen"}
      </button>
      {showFormal && (
        <div className="formal-def">
          <p>
            Ein Operator <code>G : A → B</code> bildet Funktionen aus einem
            Funktionenraum <code>A</code> in einen Funktionenraum{" "}
            <code>B</code> ab. Für eine PDE der Form{" "}
            <code>L(u) = f</code> ist der Lösungsoperator{" "}
            <code>G : f ↦ u</code> die Abbildung von rechter Seite auf
            Lösung.
          </p>
          <p>
            Ein Neuronaler Operator <code>G_θ</code> ist eine
            parametrisierte Annäherung an <code>G</code>, gelernt aus
            Paaren <code>(fᵢ, uᵢ)</code>. Die Diskretisierung, auf
            welchem Gitter <code>f</code> und <code>u</code> abgespeichert
            sind, ist Implementierungsdetail, nicht Teil des Modells.
          </p>
          <p className="formal-def-tip">
            Frag den Tutor wenn du einen einzelnen Term
            erklärt haben willst, etwa „Was ist ein Funktionenraum?"
            oder „Was bedeutet das θ in G_θ?".
          </p>
        </div>
      )}

      <h2>Abschluss · Zuordnung</h2>
      <p>
        Sechs Aussagen, zwei Spalten. Ordne jede Aussage zu. Kapitel 4
        wird erst freigeschaltet, wenn alle sechs korrekt sind.
      </p>
      <AssignmentQuiz
        prompt="Welche Aussage passt zum Neuronalen Netz, welche zum Neuronalen Operator?"
        items={ASSIGN_ITEMS}
        labels={{ nn: "Neuronales Netz", no: "Neuronaler Operator" }}
        onAllCorrect={handleQuizDone}
      />

      {done && (
        <div className="chapter-done">
          <div>
            <div className="chapter-done-headline">
              Kapitel 3 abgeschlossen · +140 CC
            </div>
            <div className="chapter-done-sub">
              Kapitel 4 ist in der Seitenleiste freigeschaltet.
            </div>
          </div>
          <button
            className="primary-button"
            onClick={() => setView({ type: "chapter", id: 4 })}
          >
            Weiter zu Kapitel 4
          </button>
        </div>
      )}
    </div>
  );
}
