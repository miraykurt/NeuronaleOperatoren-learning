import { useEffect, useRef, useState } from "react";

const SAMPLES = 80;
const W = 200;
const H = 100;
const PAD = 8;

type Phase = "idle" | "config" | "solving" | "done";

interface Config {
  pde: string;
  ic: string;
  bc: string;
  steps: number;
  resolution: number;
}

const CONFIGS: Config[] = [
  {
    pde: "Burgers 1D",
    ic: "Sinus + Rauschen",
    bc: "periodisch",
    steps: 200,
    resolution: 128,
  },
  {
    pde: "Diffusion 1D",
    ic: "Gauß-Peak",
    bc: "Dirichlet u=0",
    steps: 150,
    resolution: 64,
  },
  {
    pde: "Reaktion-Diffusion 1D",
    ic: "Random",
    bc: "Neumann",
    steps: 300,
    resolution: 128,
  },
];

function initialField(configIdx: number): number[] {
  const arr = new Array(SAMPLES);
  for (let i = 0; i < SAMPLES; i++) {
    const x = i / (SAMPLES - 1);
    if (configIdx === 0) {
      arr[i] = 0.5 + 0.35 * Math.sin(x * Math.PI * 2) + 0.1 * Math.sin(x * 17);
    } else if (configIdx === 1) {
      arr[i] = Math.exp(-Math.pow((x - 0.5) * 6, 2));
    } else {
      arr[i] = 0.45 + 0.4 * Math.sin(x * 8 + configIdx);
    }
  }
  return arr;
}

function evolvedField(configIdx: number, t: number): number[] {
  const arr = new Array(SAMPLES);
  for (let i = 0; i < SAMPLES; i++) {
    const x = i / (SAMPLES - 1);
    if (configIdx === 0) {
      // Burgers: glättet + verschiebt
      const w = 1 + t * 6;
      arr[i] =
        0.5 +
        0.3 * Math.tanh(Math.sin(x * Math.PI * 2 - t * 1.5) * w) +
        0.04 * Math.sin(x * 7);
    } else if (configIdx === 1) {
      // Diffusion: Gauß wird breiter, flacher
      const width = 6 / (1 + t * 4);
      arr[i] = Math.exp(-Math.pow((x - 0.5) * width, 2)) / (1 + t);
    } else {
      // Reaction-Diffusion: Strukturen + Drift
      arr[i] =
        0.5 +
        0.3 *
          Math.tanh(2 * Math.cos(x * 6 + configIdx + t * 2)) *
          Math.exp(-t * 0.3);
    }
  }
  return arr;
}

function drawValues(
  ctx: CanvasRenderingContext2D,
  values: number[],
  color: string,
) {
  const usable = W - PAD * 2;
  const h = H - PAD * 2;
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, H - PAD);
  ctx.lineTo(W - PAD, H - PAD);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  values.forEach((v, i) => {
    const px = PAD + (i / (values.length - 1)) * usable;
    const py = PAD + (1 - Math.max(0, Math.min(1, v))) * h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
}

export function TrainingPointAnimation() {
  const inputRef = useRef<HTMLCanvasElement>(null);
  const outputRef = useRef<HTMLCanvasElement>(null);
  const [configIdx, setConfigIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [datasetSize, setDatasetSize] = useState(0);
  const timer = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const config = CONFIGS[configIdx];

  useEffect(() => {
    return () => {
      if (timer.current) window.clearInterval(timer.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function drawInput() {
    const ctx = inputRef.current?.getContext("2d");
    if (!ctx) return;
    drawValues(ctx, initialField(configIdx), "#22d3ee");
  }

  function drawOutput(t: number) {
    const ctx = outputRef.current?.getContext("2d");
    if (!ctx) return;
    drawValues(ctx, evolvedField(configIdx, t), "#34d399");
  }

  function clearOutput() {
    const ctx = outputRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, H - PAD);
    ctx.lineTo(W - PAD, H - PAD);
    ctx.stroke();
  }

  useEffect(() => {
    drawInput();
    clearOutput();
    setPhase("idle");
    setProgress(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configIdx]);

  function start() {
    if (phase === "solving") return;
    if (timer.current) window.clearInterval(timer.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    setPhase("config");
    drawInput();
    clearOutput();
    setProgress(0);

    // 600ms config display, then 2200ms solving
    window.setTimeout(() => {
      setPhase("solving");
      const start = performance.now();
      const duration = 2200;
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        setProgress(p);
        drawOutput(p);
        if (p < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          rafRef.current = null;
          setPhase("done");
          setDatasetSize((n) => n + 1);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    }, 600);
  }

  function nextConfig() {
    setConfigIdx((i) => (i + 1) % CONFIGS.length);
  }

  return (
    <div className="trainpoint">
      <div className="trainpoint-flow">
        <div
          className={`trainpoint-step ${phase === "config" || phase === "solving" || phase === "done" ? "active" : ""}`}
        >
          <div className="trainpoint-step-num">1</div>
          <div className="trainpoint-step-label">Konfiguration</div>
          <div className="trainpoint-config">
            <div className="trainpoint-config-row">
              <span>PDE</span>
              <code>{config.pde}</code>
            </div>
            <div className="trainpoint-config-row">
              <span>Anfangsbedingung</span>
              <code>{config.ic}</code>
            </div>
            <div className="trainpoint-config-row">
              <span>Randbedingung</span>
              <code>{config.bc}</code>
            </div>
            <div className="trainpoint-config-row">
              <span>Auflösung</span>
              <code>{config.resolution}</code>
            </div>
            <div className="trainpoint-config-row">
              <span>Zeitschritte</span>
              <code>{config.steps}</code>
            </div>
          </div>
          <button
            className="secondary-button trainpoint-cycle"
            onClick={nextConfig}
            disabled={phase === "solving" || phase === "config"}
          >
            Andere Konfiguration
          </button>
        </div>

        <div className="trainpoint-arrow" aria-hidden>→</div>

        <div
          className={`trainpoint-step ${phase === "solving" || phase === "done" ? "active" : ""}`}
        >
          <div className="trainpoint-step-num">2</div>
          <div className="trainpoint-step-label">Solver läuft</div>
          <div className="trainpoint-solver">
            <div className={`hourglass ${phase === "solving" ? "" : "hourglass-still"}`}>
              <div className="hourglass-inner" />
            </div>
            <div className="trainpoint-solver-bar">
              <div
                className="trainpoint-solver-fill"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="trainpoint-solver-status">
              {phase === "solving"
                ? `Schritt ${Math.round(progress * config.steps)} / ${config.steps}`
                : phase === "done"
                  ? "fertig"
                  : "wartet auf Start"}
            </div>
          </div>
        </div>

        <div className="trainpoint-arrow" aria-hidden>→</div>

        <div
          className={`trainpoint-step ${phase === "done" ? "active" : ""}`}
        >
          <div className="trainpoint-step-num">3</div>
          <div className="trainpoint-step-label">Paar im Datensatz</div>
          <div className="trainpoint-pair">
            <div>
              <div className="trainpoint-pair-label">Input u(x, 0)</div>
              <canvas
                ref={inputRef}
                width={W}
                height={H}
                className="trainpoint-canvas"
              />
            </div>
            <div>
              <div className="trainpoint-pair-label">
                Output u(x, T)
              </div>
              <canvas
                ref={outputRef}
                width={W}
                height={H}
                className="trainpoint-canvas"
              />
            </div>
          </div>
          <div className="trainpoint-counter">
            Datensatz: <code>{datasetSize}</code>{" "}
            {datasetSize === 1 ? "Paar" : "Paare"}
          </div>
        </div>
      </div>

      <div className="trainpoint-actions">
        <button
          className="primary-button"
          onClick={start}
          disabled={phase === "config" || phase === "solving"}
        >
          {phase === "done"
            ? "Nächsten Trainingspunkt generieren"
            : phase === "solving"
              ? "Solver läuft …"
              : "Trainingspunkt generieren"}
        </button>
      </div>

      <p className="trainpoint-note">
        Genau so entsteht jeder einzelne Eintrag in PDEBench: eine
        Konfiguration wird einmal teuer mit dem klassischen Solver
        durchgerechnet. Das Eingabe-Ausgabe-Paar landet im Datensatz und
        steht beim Training jedem Operator-Modell zur Verfügung.
      </p>
    </div>
  );
}
