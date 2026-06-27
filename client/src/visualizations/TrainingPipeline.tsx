import { useEffect, useRef, useState } from "react";

interface Stage {
  id: string;
  label: string;
  sublabel: string;
  body: string;
}

const STAGES: Stage[] = [
  {
    id: "daten",
    label: "Daten",
    sublabel: "PDEBench laden",
    body:
      "Eingabe-Ausgabe-Paare aus vielen Lösungen eines klassischen Solvers: Anfangszustand rein, Lösung nach T Zeitschritten raus. Aufgeteilt in Train, Val und Test (typisch 80/10/10) und pro Channel normalisiert.",
  },
  {
    id: "modell",
    label: "Modell",
    sublabel: "FNO aufsetzen",
    body:
      "Mehrere Fourier-Layer hintereinander, jeder mit einem lokalen 1×1-Pfad und einem globalen FFT-Pfad. Die Modenzahl k legt fest, wieviele Frequenzen pro Layer behalten werden. Tiefe und Breite sind weitere Stellschrauben.",
  },
  {
    id: "training",
    label: "Training",
    sublabel: "Loop + Validierung",
    body:
      "Pro Epoche: Vorhersage berechnen, mit dem Ziel vergleichen (Loss), Gradienten zurück, Gewichte aktualisieren. Im echten Setup mit AdamW, Cosine-Schedule und H1-Loss. Nach jeder Epoche kurz auf dem Val-Set messen und das beste Modell speichern.",
  },
  {
    id: "auswertung",
    label: "Auswertung",
    sublabel: "Plots & Übergabe",
    body:
      "Bestes Modell auf dem Test-Set bewerten. Loss-Kurven und Metriken plotten, Prediction-Video für ein fixes Sample erzeugen, summary.json mit allen Kennzahlen schreiben. Das ist die Übergabe an den Kunden.",
  },
];

const BOX_W = 130;
const BOX_H = 80;
const GAP = 38;
const PAD_X = 28;
const PAD_Y = 30;
const TOTAL_W = STAGES.length * BOX_W + (STAGES.length - 1) * GAP + 2 * PAD_X;
const TOTAL_H = PAD_Y + BOX_H + PAD_Y;

export function TrainingPipeline() {
  const [active, setActive] = useState<string>("training");
  const [tick, setTick] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const loop = (now: number) => {
      setTick((now - start) / 1000);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const stage = STAGES.find((s) => s.id === active) ?? STAGES[2];

  const lineStart = PAD_X + BOX_W;
  const lineEnd = TOTAL_W - PAD_X - BOX_W;
  const lineMid = PAD_Y + BOX_H / 2;

  // Animated particle moving from left to right along the connecting line
  const speed = 0.25; // cycles per second
  const t = (tick * speed) % 1;
  const particleX = lineStart + t * (lineEnd - lineStart);

  return (
    <div className="dockerdiag">
      <svg
        viewBox={`0 0 ${TOTAL_W} ${TOTAL_H}`}
        className="dockerdiag-svg"
        aria-label="Trainings-Pipeline für einen neuronalen Operator"
      >
        <line
          x1={lineStart}
          y1={lineMid}
          x2={lineEnd}
          y2={lineMid}
          className="dockerdiag-line"
        />

        {STAGES.map((s, i) => {
          const x = PAD_X + i * (BOX_W + GAP);
          const isActive = s.id === active;
          return (
            <g
              key={s.id}
              className={`dockerdiag-station ${isActive ? "active" : ""}`}
              onClick={() => setActive(s.id)}
            >
              <rect
                x={x}
                y={PAD_Y}
                width={BOX_W}
                height={BOX_H}
                rx={8}
                className="dockerdiag-box"
              />
              <text
                x={x + BOX_W / 2}
                y={PAD_Y + BOX_H / 2 - 4}
                textAnchor="middle"
                className="dockerdiag-label"
              >
                {s.label}
              </text>
              <text
                x={x + BOX_W / 2}
                y={PAD_Y + BOX_H / 2 + 14}
                textAnchor="middle"
                className="dockerdiag-sublabel"
              >
                {s.sublabel}
              </text>
            </g>
          );
        })}

        <circle
          cx={particleX}
          cy={lineMid}
          r={5}
          className="dockerdiag-particle"
        />
      </svg>

      <div className="dockerdiag-detail-tabs">
        {STAGES.map((s) => (
          <button
            key={s.id}
            className={`dockerdiag-tab ${s.id === active ? "active" : ""}`}
            onClick={() => setActive(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="dockerdiag-detail">
        <div className="dockerdiag-detail-head">{stage.label}</div>
        <div className="dockerdiag-detail-sub">{stage.sublabel}</div>
        <div className="dockerdiag-detail-body">{stage.body}</div>
      </div>
    </div>
  );
}
