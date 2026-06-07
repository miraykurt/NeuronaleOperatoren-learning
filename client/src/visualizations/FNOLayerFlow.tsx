import { useState } from "react";

interface Step {
  id: string;
  title: string;
  subtitle: string;
  explanation: string;
}

const STEPS: Step[] = [
  {
    id: "input",
    title: "Eingabe u(x)",
    subtitle: "Funktion auf einem Gitter",
    explanation:
      "Der FNO bekommt die Anfangsbedingung als Funktion, typischerweise als Werte auf einem regelmäßigen Gitter. Das Gitter ist nur für die Auswertung da, das Modell selbst arbeitet im Funktionsraum.",
  },
  {
    id: "fft",
    title: "FFT",
    subtitle: "Wechsel in den Frequenzraum",
    explanation:
      "Die schnelle Fourier-Transformation zerlegt das Signal in seine Frequenzkomponenten. Statt über benachbarte Gitterpunkte zu reden, sprechen wir jetzt über Wellenzahlen, was global passiert, ist hier direkt sichtbar.",
  },
  {
    id: "cutoff",
    title: "Cutoff-Maske",
    subtitle: "Hohe Frequenzen weg",
    explanation:
      "Eine Maske behält nur die ersten k Moden. Hohe Frequenzen tragen meistens Rauschen oder feine, gitterabhängige Artefakte, die werden hier abgeschnitten. Das ist der Trick, der das Modell auflösungsunabhängig macht.",
  },
  {
    id: "linear",
    title: "Linear",
    subtitle: "Gelernte komplexe Gewichte",
    explanation:
      "Auf den behaltenen Frequenzkomponenten wird eine gelernte, komplexwertige lineare Transformation angewendet. Anders als ein Convolutional Neural Network (CNN), das nur lokale Nachbarschaften sieht, kann diese Operation global zwischen Frequenzen mischen.",
  },
  {
    id: "ifft",
    title: "IFFT",
    subtitle: "Zurück in den Ortsraum",
    explanation:
      "Die inverse FFT bringt das transformierte Signal zurück in den Ortsraum. Ergebnis: eine Funktion, die wieder auf einem Gitter ausgewertet werden kann, aber bewusst nur die ersten Moden enthält.",
  },
  {
    id: "skip",
    title: "Lokale Korrektur + Aktivierung",
    subtitle: "1×1-Convolution + GeLU",
    explanation:
      "Parallel zur globalen Frequenz-Operation läuft ein lokaler 1×1-Pfad. Beides wird addiert, eine nichtlineare Aktivierung folgt. Dieser Block (Fourier-Pfad + lokaler Pfad) wird mehrfach gestapelt.",
  },
  {
    id: "output",
    title: "Ausgabe v(x)",
    subtitle: "Lösung der PDE",
    explanation:
      "Nach mehreren solcher Blöcke kommt die vorhergesagte Lösung heraus. Im Idealfall dasselbe, was ein klassischer Solver liefern würde, nur deutlich schneller.",
  },
];

export function FNOLayerFlow() {
  const [active, setActive] = useState<string>("fft");
  const step = STEPS.find((s) => s.id === active) ?? STEPS[0];

  return (
    <div className="layerflow">
      <div className="layerflow-pipeline">
        {STEPS.map((s, i) => (
          <div key={s.id} className="layerflow-cell">
            <button
              className={`layerflow-step ${s.id === active ? "active" : ""}`}
              onClick={() => setActive(s.id)}
            >
              <div className="layerflow-step-num">{i + 1}</div>
              <div className="layerflow-step-title">{s.title}</div>
              <div className="layerflow-step-sub">{s.subtitle}</div>
            </button>
            {i < STEPS.length - 1 && (
              <div className="layerflow-arrow" aria-hidden>
                →
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="layerflow-detail">
        <div className="layerflow-detail-head">{step.title}</div>
        <div className="layerflow-detail-body">{step.explanation}</div>
      </div>
    </div>
  );
}
